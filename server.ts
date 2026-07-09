import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import ImageKit from "imagekit";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for all origins
app.use(cors());

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_Zs+0QoId6cKbJ6RaYcqq/A7KRcs=+WHkfzjg=",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_hEfX4huhE9HYYoIaUwm",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/scwjupjlq",
});

app.use(express.json({ limit: "50mb" }));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Cache directory setup
const CACHE_DIR = path.join(process.cwd(), "cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Uploads directory setup
const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Serve uploads statically
app.use("/uploads", express.static(UPLOADS_DIR));

// API for Quran data (Hady Al-Quran)
app.get("/api/quran-data", (req, res) => {
  const filePath = path.join(process.cwd(), "public/quranData.json");
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      if (!content || content.trim() === "") {
        return res.json({ series: [], lessons: [], excerpts: [], syllabuses: [] });
      }
      res.json(JSON.parse(content));
    } else {
      res.json({ series: [], lessons: [], excerpts: [], syllabuses: [] });
    }
  } catch (error) {
    console.error("Error reading Quran data:", error);
    res.status(500).json({ error: "فشل في قراءة بيانات هدي القرآن" });
  }
});

app.post("/api/quran-data", async (req, res) => {
  const data = req.body;
  const filePath = path.join(process.cwd(), "public/quranData.json");
  const tempPath = filePath + ".tmp";
  
  try {
    // 1. Save locally using atomic write (write to temp then rename)
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
    
    // 2. Sync with GitHub if configured (optional but recommended since user asked for GitHub persistence before)
    const { token, owner, repo, branch } = getGitHubConfig();
    if (token && owner && repo) {
      const base64Content = Buffer.from(JSON.stringify(data, null, 2), "utf8").toString("base64");
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/public/quranData.json`;
      
      try {
        let sha: string | undefined;
        const getRes = await fetch(`${url}?ref=${branch}`, {
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

        await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Taiz-Platform-App",
          },
          body: JSON.stringify({
            message: "تحديث بيانات هدي القرآن عبر لوحة التحكم",
            content: base64Content,
            sha,
            branch,
          }),
        });
      } catch (ghErr) {
        console.error("GitHub sync error for Quran data:", ghErr);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving Quran data:", error);
    res.status(500).json({ error: "فشل في حفظ بيانات هدي القرآن" });
  }
});

// File upload API route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ImageKit upload API route
app.post("/api/upload/imagekit", upload.single("image"), async (req, res) => {
  let fileContent;
  let originalName = "uploaded_image.jpg";
  let isTempFile = false;
  let tempFilePath = "";

  if (req.file) {
    fileContent = fs.readFileSync(req.file.path);
    originalName = req.file.originalname;
    isTempFile = true;
    tempFilePath = req.file.path;
  } else if (req.body && req.body.imageBase64) {
    let base64String = req.body.imageBase64;
    if (base64String.startsWith('data:image')) {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        base64String = matches[2];
      }
    }
    fileContent = Buffer.from(base64String, 'base64');
    originalName = req.body.fileName || "uploaded_image_" + Date.now() + ".jpg";
  } else {
    return res.status(400).json({ error: "No file or base64 image uploaded" });
  }

  if (!imagekit.options.publicKey || !imagekit.options.privateKey || !imagekit.options.urlEndpoint) {
    console.error("ImageKit credentials are not fully set");
    if (isTempFile) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    return res.status(500).json({ error: "خدمة رفع الصور غير مهيأة (بيانات ImageKit مفقودة)" });
  }

  try {
    const uploadResponse = await imagekit.upload({
      file: fileContent,
      fileName: originalName,
      folder: "/uploads",
    });

    if (isTempFile) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }

    res.json({ 
      url: uploadResponse.url,
      thumbnail: uploadResponse.thumbnailUrl,
      status: "success",
      fileId: uploadResponse.fileId
    });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    
    if (isTempFile && req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({ 
      error: "حدث خطأ أثناء الرفع إلى ImageKit",
      message: error.message 
    });
  }
});

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

// API 404 Handler - MUST be before Vite/Static middleware
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global error handler caught:", err);
  if (req.path.startsWith("/api/")) {
    return res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: err.message,
      path: req.path
    });
  }
  next(err);
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
