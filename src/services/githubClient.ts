import { get, set } from "idb-keyval";
import { Capacitor } from "@capacitor/core";

const API_BASE = Capacitor.isNativePlatform() ? "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app" : "";

export interface GitHubStatus {
  configured: boolean;
  owner: string;
  repo: string;
  branch: string;
  hasToken: boolean;
}

// Check if running in Node environment
const isNode = typeof window === "undefined";

// In-memory cache for browser-side requests
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const CLIENT_CACHE_TTL = 30 * 1000; // 30 seconds local client-side cache TTL

export class GitHubClient {
  /**
   * Fetch status of the GitHub configuration
   */
  static async getStatus(): Promise<GitHubStatus> {
    if (isNode) {
      const token = process.env.GITHUB_TOKEN || "";
      const owner = process.env.GITHUB_OWNER || "";
      const repo = process.env.GITHUB_REPO || "";
      const branch = process.env.GITHUB_BRANCH || "main";
      return {
        configured: !!(token && owner && repo),
        owner,
        repo,
        branch,
        hasToken: !!token,
      };
    }

    try {
      const response = await fetch(`${API_BASE}/api/github/status`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch GitHub status: ${response.status} ${text.slice(0, 100)}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error getting GitHub status on client:", error);
      return {
        configured: false,
        owner: "",
        repo: "",
        branch: "main",
        hasToken: false,
      };
    }
  }

  /**
   * Fetch JSON content of a collection from GitHub (via server proxy or direct)
   * Handles local IndexedDB and memory caching on the client to minimize API calls
   */
  static async fetchContent<T>(collection: string, forceRefresh = false): Promise<T[]> {
    const cacheKey = `gh_cache_${collection}`;
    const now = Date.now();

    // 1. Check in-memory cache first (unless forceRefresh is true)
    if (!forceRefresh && memoryCache[collection] && (now - memoryCache[collection].timestamp < CLIENT_CACHE_TTL)) {
      console.log(`[GitHubClient] Returning in-memory cache for ${collection}`);
      return memoryCache[collection].data as T[];
    }

    // 2. Check IndexedDB cache if in browser (unless forceRefresh is true)
    if (!isNode && !forceRefresh) {
      try {
        const cached = await get<{ data: T[]; timestamp: number }>(cacheKey);
        if (cached && (now - cached.timestamp < CLIENT_CACHE_TTL)) {
          console.log(`[GitHubClient] Returning IndexedDB cache for ${collection}`);
          // Warm memory cache
          memoryCache[collection] = { data: cached.data, timestamp: cached.timestamp };
          return cached.data;
        }
      } catch (err) {
        console.warn(`[GitHubClient] IndexedDB cache read failed for ${collection}:`, err);
      }
    }

    // 3. Perform actual fetch
    let fetchedData: T[] = [];

    if (isNode) {
      // Direct server-side GitHub fetch
      const token = process.env.GITHUB_TOKEN || "";
      const owner = process.env.GITHUB_OWNER || "";
      const repo = process.env.GITHUB_REPO || "";
      const branch = process.env.GITHUB_BRANCH || "main";

      if (!token || !owner || !repo) {
        console.warn("[GitHubClient] Server-side environment missing GitHub configuration.");
        return [];
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
          return [];
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`GitHub responded with ${response.status}: ${text.slice(0, 100)}`);
        }

        const json = await response.json();
        const content = Buffer.from(json.content, "base64").toString("utf8");
        fetchedData = JSON.parse(content);
      } catch (err) {
        console.error(`[GitHubClient] Direct GitHub fetch failed for ${collection}:`, err);
        throw err;
      }
    } else {
      // Browser environment: request via Express API
      try {
        const response = await fetch(`${API_BASE}/api/content/${collection}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP error! status: ${response.status} content: ${text.slice(0, 100)}`);
        }
        
        // Check content-type to avoid parsing HTML as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but received ${contentType}. Content: ${text.slice(0, 100)}`);
        }

        fetchedData = await response.json();
      } catch (err) {
        console.error(`[GitHubClient] API fetch failed for ${collection}:`, err);
        // If fetch fails, try to fall back to expired IndexedDB cache
        if (!isNode) {
          const expiredCache = await get<{ data: T[]; timestamp: number }>(cacheKey);
          if (expiredCache) {
            console.log(`[GitHubClient] Network failed. Returning expired IndexedDB cache for ${collection}`);
            return expiredCache.data;
          }
        }
        throw err;
      }
    }

    // Ensure we have an array
    const result = Array.isArray(fetchedData) ? fetchedData : [];

    // 4. Update memory and IndexedDB caches
    memoryCache[collection] = { data: result, timestamp: now };
    if (!isNode) {
      try {
        await set(cacheKey, { data: result, timestamp: now });
      } catch (err) {
        console.warn(`[GitHubClient] IndexedDB cache write failed for ${collection}:`, err);
      }
    }

    return result;
  }

  /**
   * Save JSON content of a collection to GitHub (via server proxy or direct)
   * Immediately updates local client-side caches to avoid staleness
   */
  static async saveContent<T>(collection: string, data: T[]): Promise<{ success: boolean; savedLocally: boolean }> {
    if (!Array.isArray(data)) {
      throw new Error("[GitHubClient] Invalid data format. Expected an array.");
    }

    const cacheKey = `gh_cache_${collection}`;
    const now = Date.now();

    // 1. Immediately update client-side caches (Optimistic UI updates / Write-through caching)
    memoryCache[collection] = { data, timestamp: now };
    if (!isNode) {
      try {
        await set(cacheKey, { data, timestamp: now });
      } catch (err) {
        console.warn(`[GitHubClient] IndexedDB cache update failed during save:`, err);
      }
    }

    if (isNode) {
      // Direct server-side GitHub write
      const token = process.env.GITHUB_TOKEN || "";
      const owner = process.env.GITHUB_OWNER || "";
      const repo = process.env.GITHUB_REPO || "";
      const branch = process.env.GITHUB_BRANCH || "main";

      if (!token || !owner || !repo) {
        console.warn("[GitHubClient] Server-side environment missing GitHub config during write.");
        return { success: false, savedLocally: true };
      }

      const filePath = `${collection}.json`;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      try {
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
            message: `Update ${collection} data via GitHubClient`,
            content: base64Content,
            sha,
            branch,
          }),
        });

        if (!putRes.ok) {
          const errText = await putRes.text();
          throw new Error(`Failed to update ${filePath} on GitHub: ${putRes.status} ${errText}`);
        }

        return { success: true, savedLocally: true };
      } catch (err) {
        console.error(`[GitHubClient] Direct write to GitHub failed for ${collection}:`, err);
        return { success: false, savedLocally: true };
      }
    } else {
      // Browser environment: send to Express API
      try {
        const response = await fetch(`${API_BASE}/api/content/${collection}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        console.error(`[GitHubClient] API save failed for ${collection}:`, err);
        // Even if network write failed, we updated the local browser cache above, so return savedLocally: true
        return { success: false, savedLocally: true };
      }
    }
  }

  /**
   * Explicitly invalidate the local cache for a specific collection
   */
  static async clearCache(collection: string): Promise<void> {
    delete memoryCache[collection];
    if (!isNode) {
      try {
        const cacheKey = `gh_cache_${collection}`;
        await set(cacheKey, null);
      } catch (err) {
        console.warn(`[GitHubClient] IndexedDB cache clear failed for ${collection}:`, err);
      }
    }
  }
}
