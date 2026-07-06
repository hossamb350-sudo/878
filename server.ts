import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Cache directory setup
const CACHE_DIR = path.join(process.cwd(), "cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// In-memory cache metadata
const memoryCache: Record<string, { data: any; lastFetched: number }> = {};
const CACHE_TTL = 60 * 1000; // 60 seconds TTL for SWR (Stale-While-Revalidate)

// Helper to get GitHub config
function getGitHubConfig() {
  return {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

// Check if GitHub is configured
app.get("/api/github/status", (req, res) => {
  const { token, owner, repo } = getGitHubConfig();
  const configured = !!(token && owner && repo);
  res.json({
    configured,
    owner,
    repo,
    branch: process.env.GITHUB_BRANCH || "main",
    hasToken: !!token,
  });
});

// Helper to fetch file from GitHub
async function fetchFromGitHub(collection: string): Promise<any[]> {
  const { token, owner, repo, branch } = getGitHubConfig();
  if (!token || !owner || !repo) {
    console.warn(`GitHub API not configured. Falling back to local cache for ${collection}.`);
    return getLocalCache(collection);
  }

  const filePath = `${collection}.json`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Taiz-Platform-App",
      },
    });

    if (response.status === 404) {
      console.log(`File ${filePath} not found on GitHub. Returning empty list.`);
      return [];
    }

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const content = Buffer.from(json.content, "base64").toString("utf8");
    const data = JSON.parse(content);

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error fetching ${filePath} from GitHub:`, err);
    // Fallback to local cache
    return getLocalCache(collection);
  }
}

// Helper to write file to GitHub
async function writeToGitHub(collection: string, data: any[]): Promise<boolean> {
  const { token, owner, repo, branch } = getGitHubConfig();
  if (!token || !owner || !repo) {
    console.warn(`GitHub API not configured. Cannot write ${collection} to GitHub.`);
    return false;
  }

  const filePath = `${collection}.json`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    // Get the current file to get its sha
    let sha: string | undefined;
    const getUrl = `${url}?ref=${branch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Taiz-Platform-App",
      },
    });

    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    const stringifiedData = JSON.stringify(data, null, 2);
    const base64Content = Buffer.from(stringifiedData, "utf8").toString("base64");

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Taiz-Platform-App",
      },
      body: JSON.stringify({
        message: `Update ${collection} data via Admin Panel`,
        content: base64Content,
        sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`Failed to update ${filePath} on GitHub: ${putRes.status} ${errText}`);
    }

    console.log(`Successfully committed ${filePath} to GitHub branch ${branch}.`);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath} to GitHub:`, err);
    return false;
  }
}

// Local cache filesystem helpers
function getLocalCache(collection: string): any[] {
  const file = path.join(CACHE_DIR, `${collection}.json`);
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading local cache file for ${collection}:`, e);
    }
  }
  return [];
}

function setLocalCache(collection: string, data: any[]) {
  const file = path.join(CACHE_DIR, `${collection}.json`);
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`Error writing local cache file for ${collection}:`, e);
  }
}

// Get collection content (SWR Caching Strategy)
app.get("/api/content/:collection", async (req, res) => {
  const { collection } = req.params;
  const now = Date.now();

  const cached = memoryCache[collection];
  
  // If memory cache exists and is fresh
  if (cached && now - cached.lastFetched < CACHE_TTL) {
    return res.json(cached.data);
  }

  // Get from local filesystem cache
  const localData = getLocalCache(collection);

  // If we have local cached data, return it immediately (0ms latency for user)
  // and trigger a background fetch to refresh the cache from GitHub.
  if (localData.length > 0 || cached) {
    const currentData = localData.length > 0 ? localData : cached.data;
    res.json(currentData);

    // Background fetch (Stale-While-Revalidate)
    // Avoid double triggering background fetch if one is already in progress within 10 seconds
    const lastFetched = cached ? cached.lastFetched : 0;
    if (now - lastFetched > 10 * 1000) {
      // Set temporary mock fetched time to prevent duplicate triggers
      memoryCache[collection] = { data: currentData, lastFetched: now - CACHE_TTL + 10000 };
      
      fetchFromGitHub(collection).then((freshData) => {
        setLocalCache(collection, freshData);
        memoryCache[collection] = { data: freshData, lastFetched: Date.now() };
        console.log(`Background cache refresh completed for: ${collection}`);
      }).catch((err) => {
        console.error(`Background refresh failed for ${collection}:`, err);
      });
    }
    return;
  }

  // If no cache exists at all (first run), fetch synchronously
  try {
    const freshData = await fetchFromGitHub(collection);
    setLocalCache(collection, freshData);
    memoryCache[collection] = { data: freshData, lastFetched: Date.now() };
    res.json(freshData);
  } catch (err) {
    res.json([]);
  }
});

// Update or save collection content (Write-Through Caching)
app.post("/api/content/:collection", async (req, res) => {
  const { collection } = req.params;
  const data = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data format. Expected an array." });
  }

  console.log(`Received update for collection: ${collection}. Total items: ${data.length}`);

  // 1. Immediately update local filesystem and memory cache (0ms latency)
  setLocalCache(collection, data);
  memoryCache[collection] = { data, lastFetched: Date.now() };

  // 2. Perform write to GitHub asynchronously to prevent blocking the Admin UI
  writeToGitHub(collection, data)
    .then((success) => {
      if (success) {
        console.log(`Successfully synced ${collection} with GitHub.`);
      } else {
        console.warn(`Failed to sync ${collection} with GitHub. Saved locally only.`);
      }
    })
    .catch((err) => {
      console.error(`Async GitHub write failed for ${collection}:`, err);
    });

  // Return success response instantly
  res.json({ success: true, savedLocally: true });
});

async function startServer() {
  // Vite dev server middleware integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
