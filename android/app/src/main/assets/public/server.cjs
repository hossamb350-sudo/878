var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_imagekit = __toESM(require("imagekit"), 1);
var import_cors = __toESM(require("cors"), 1);

// src/config/imagekitConfig.ts
var IMAGEKIT_CONFIG = {
  urlEndpoint: "https://ik.imagekit.io/scwjupjlq",
  publicKey: "public_Zs+0QoId6cKbJ6RaYcqq/A7KRcs=+WHkfzjg=",
  privateKey: "private_hEfX4huhE9HYYoIaUwm+WHkfzjg="
};

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((0, import_cors.default)({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"]
}));
var imagekit = new import_imagekit.default({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || IMAGEKIT_CONFIG.publicKey,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || IMAGEKIT_CONFIG.privateKey,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || IMAGEKIT_CONFIG.urlEndpoint
});
app.use(import_express.default.json({ limit: "50mb" }));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`${(/* @__PURE__ */ new Date()).toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});
var CACHE_DIR = import_path.default.join(process.cwd(), "cache");
if (!import_fs.default.existsSync(CACHE_DIR)) {
  import_fs.default.mkdirSync(CACHE_DIR, { recursive: true });
}
var UPLOADS_DIR = import_path.default.join(process.cwd(), "public/uploads");
if (!import_fs.default.existsSync(UPLOADS_DIR)) {
  import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = import_path.default.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
app.use("/uploads", import_express.default.static(UPLOADS_DIR));
app.get("/api/quran-data", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "public/quranData.json");
  try {
    if (import_fs.default.existsSync(filePath)) {
      const content = import_fs.default.readFileSync(filePath, "utf8");
      if (!content || content.trim() === "") {
        return res.json({ series: [], lessons: [], excerpts: [], syllabuses: [] });
      }
      res.json(JSON.parse(content));
    } else {
      res.json({ series: [], lessons: [], excerpts: [], syllabuses: [] });
    }
  } catch (error) {
    console.error("Error reading Quran data:", error);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0642\u0631\u0627\u0621\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0647\u062F\u064A \u0627\u0644\u0642\u0631\u0622\u0646" });
  }
});
app.post("/api/quran-data", async (req, res) => {
  const data = req.body;
  const filePath = import_path.default.join(process.cwd(), "public/quranData.json");
  const tempPath = filePath + ".tmp";
  try {
    import_fs.default.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    import_fs.default.renameSync(tempPath, filePath);
    const { token, owner, repo, branch } = getGitHubConfig();
    if (token && owner && repo) {
      const base64Content = Buffer.from(JSON.stringify(data, null, 2), "utf8").toString("base64");
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/public/quranData.json`;
      try {
        let sha;
        const getRes = await fetch(`${url}?ref=${branch}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Taiz-Platform-App"
          }
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
            "User-Agent": "Taiz-Platform-App"
          },
          body: JSON.stringify({
            message: "\u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0647\u062F\u064A \u0627\u0644\u0642\u0631\u0622\u0646 \u0639\u0628\u0631 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645",
            content: base64Content,
            sha,
            branch
          })
        });
      } catch (ghErr) {
        console.error("GitHub sync error for Quran data:", ghErr);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving Quran data:", error);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0628\u064A\u0627\u0646\u0627\u062A \u0647\u062F\u064A \u0627\u0644\u0642\u0631\u0622\u0646" });
  }
});
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});
app.post("/api/upload/imagekit", upload.single("image"), async (req, res) => {
  let fileContent;
  let originalName = "uploaded_image.jpg";
  let isTempFile = false;
  let tempFilePath = "";
  if (req.file) {
    fileContent = import_fs.default.readFileSync(req.file.path);
    originalName = req.file.originalname;
    isTempFile = true;
    tempFilePath = req.file.path;
  } else if (req.body && req.body.imageBase64) {
    let base64String = req.body.imageBase64;
    if (base64String.startsWith("data:image")) {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        base64String = matches[2];
      }
    }
    fileContent = Buffer.from(base64String, "base64");
    originalName = req.body.fileName || "uploaded_image_" + Date.now() + ".jpg";
  } else {
    return res.status(400).json({ error: "No file or base64 image uploaded" });
  }
  if (!imagekit.options.publicKey || !imagekit.options.privateKey || !imagekit.options.urlEndpoint) {
    console.error("ImageKit credentials are not fully set");
    if (isTempFile) {
      try {
        import_fs.default.unlinkSync(tempFilePath);
      } catch (e) {
      }
    }
    return res.status(500).json({ error: "\u062E\u062F\u0645\u0629 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 (\u0628\u064A\u0627\u0646\u0627\u062A ImageKit \u0645\u0641\u0642\u0648\u062F\u0629)" });
  }
  try {
    const uploadResponse = await imagekit.upload({
      file: fileContent,
      fileName: originalName,
      folder: "/uploads"
    });
    if (isTempFile) {
      try {
        import_fs.default.unlinkSync(tempFilePath);
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
  } catch (error) {
    console.error("ImageKit upload error:", error);
    if (isTempFile && req.file && import_fs.default.existsSync(req.file.path)) {
      try {
        import_fs.default.unlinkSync(req.file.path);
      } catch (e) {
      }
    }
    res.status(500).json({
      error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0631\u0641\u0639 \u0625\u0644\u0649 ImageKit",
      message: error.message
    });
  }
});
var memoryCache = {};
var CACHE_TTL = 60 * 1e3;
function getGitHubConfig() {
  return {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main"
  };
}
app.get("/api/github/status", (req, res) => {
  const { token, owner, repo } = getGitHubConfig();
  const configured = !!(token && owner && repo);
  res.json({
    configured,
    owner,
    repo,
    branch: process.env.GITHUB_BRANCH || "main",
    hasToken: !!token
  });
});
async function fetchFromGitHub(collection) {
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
        "User-Agent": "Taiz-Platform-App"
      }
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
    return getLocalCache(collection);
  }
}
async function writeToGitHub(collection, data) {
  const { token, owner, repo, branch } = getGitHubConfig();
  if (!token || !owner || !repo) {
    console.warn(`GitHub API not configured. Cannot write ${collection} to GitHub.`);
    return false;
  }
  const filePath = `${collection}.json`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  try {
    let sha;
    const getUrl = `${url}?ref=${branch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Taiz-Platform-App"
      }
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
        "User-Agent": "Taiz-Platform-App"
      },
      body: JSON.stringify({
        message: `Update ${collection} data via Admin Panel`,
        content: base64Content,
        sha,
        branch
      })
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
function getLocalCache(collection) {
  const file = import_path.default.join(CACHE_DIR, `${collection}.json`);
  if (import_fs.default.existsSync(file)) {
    try {
      const content = import_fs.default.readFileSync(file, "utf8");
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading local cache file for ${collection}:`, e);
    }
  }
  return [];
}
function setLocalCache(collection, data) {
  const file = import_path.default.join(CACHE_DIR, `${collection}.json`);
  try {
    import_fs.default.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`Error writing local cache file for ${collection}:`, e);
  }
}
app.get("/api/content/:collection", async (req, res) => {
  const { collection } = req.params;
  const now = Date.now();
  const cached = memoryCache[collection];
  if (cached && now - cached.lastFetched < CACHE_TTL) {
    return res.json(cached.data);
  }
  const localData = getLocalCache(collection);
  if (localData.length > 0 || cached) {
    const currentData = localData.length > 0 ? localData : cached.data;
    res.json(currentData);
    const lastFetched = cached ? cached.lastFetched : 0;
    if (now - lastFetched > 10 * 1e3) {
      memoryCache[collection] = { data: currentData, lastFetched: now - CACHE_TTL + 1e4 };
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
  try {
    const freshData = await fetchFromGitHub(collection);
    setLocalCache(collection, freshData);
    memoryCache[collection] = { data: freshData, lastFetched: Date.now() };
    res.json(freshData);
  } catch (err) {
    res.json([]);
  }
});
app.post("/api/content/:collection", async (req, res) => {
  const { collection } = req.params;
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data format. Expected an array." });
  }
  console.log(`Received update for collection: ${collection}. Total items: ${data.length}`);
  setLocalCache(collection, data);
  memoryCache[collection] = { data, lastFetched: Date.now() };
  writeToGitHub(collection, data).then((success) => {
    if (success) {
      console.log(`Successfully synced ${collection} with GitHub.`);
    } else {
      console.warn(`Failed to sync ${collection} with GitHub. Saved locally only.`);
    }
  }).catch((err) => {
    console.error(`Async GitHub write failed for ${collection}:`, err);
  });
  res.json({ success: true, savedLocally: true });
});
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});
app.use((err, req, res, next) => {
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
