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
var import_axios = __toESM(require("axios"), 1);
var import_imagekit = __toESM(require("imagekit"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_web_push = __toESM(require("web-push"), 1);
var import_genai = require("@google/genai");
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");

// src/config/imagekitConfig.ts
var IMAGEKIT_CONFIG = {
  urlEndpoint: "https://ik.imagekit.io/scwjupjlq",
  publicKey: "public_Zs+0QoId6cKbJ6RaYcqq/A7KRcs=+WHkfzjg=",
  privateKey: "private_hEfX4huhE9HYYoIaUwm+WHkfzjg="
};

// server.ts
import_dotenv.default.config();
var firebaseConfig = { projectId: process.env.FIREBASE_PROJECT_ID || "taiz-media" };
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json, falling back to env var.");
}
var adminApp;
if ((0, import_app.getApps)().length === 0) {
  adminApp = (0, import_app.initializeApp)({
    projectId: firebaseConfig.projectId
  });
} else {
  adminApp = (0, import_app.getApps)()[0];
}
var db = (0, import_firestore.getFirestore)(adminApp);
var app = (0, import_express.default)();
var PORT = 3e3;
var DEFAULT_VAPID_PUBLIC_KEY = "BEw8fkpN0JQ-HB7b1mxhuicMWZUqvB5nCnLRYv6VjIoMxCTJQVsYGqP2-CnhPpUm0pkgz6LQZ7Ut1jsvQn4Q9ow";
var DEFAULT_VAPID_PRIVATE_KEY = "btEWHmdPbPg_jgywYnb6z4NujfcN5TeJQDY8JbDTAOQ";
function isValidVapidKey(publicKey) {
  if (!publicKey || typeof publicKey !== "string") return false;
  try {
    const normalized = publicKey.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(normalized, "base64");
    return buf.length === 65;
  } catch (e) {
    return false;
  }
}
function getVapidKeys() {
  const envPub = process.env.VITE_VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv && isValidVapidKey(envPub)) {
    return { publicKey: envPub, privateKey: envPriv };
  } else {
    console.warn("Using fallback/default stable VAPID keypair since the environment configured keys are invalid or not 65 bytes when decoded.");
    return { publicKey: DEFAULT_VAPID_PUBLIC_KEY, privateKey: DEFAULT_VAPID_PRIVATE_KEY };
  }
}
var { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY } = getVapidKeys();
var VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hossamb350@gmail.com";
try {
  import_web_push.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("Web-Push VAPID details configured successfully.");
} catch (e) {
  console.error("Failed to set VAPID details:", e);
}
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
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.use(import_express.default.json({ limit: "50mb" }));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/quran-data", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "public/quranData.json");
  if (import_fs.default.existsSync(filePath)) {
    try {
      const content = import_fs.default.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);
      return res.json(data);
    } catch (e) {
      console.error("Error parsing quranData.json:", e);
      return res.status(500).json({ error: "Failed to parse Quran data" });
    }
  }
  res.status(404).json({ error: "Quran data not found" });
});
app.get("/api/weather", async (req, res) => {
  try {
    const { lat = "13.5795", lon = "44.0203" } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenWeather API key is not configured" });
    }
    const response = await import_axios.default.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: "metric",
        lang: "ar"
        // Arabic for condition descriptions
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching weather data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});
app.get("/api/forecast", async (req, res) => {
  try {
    const { lat = "13.5795", lon = "44.0203" } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenWeather API key is not configured" });
    }
    const response = await import_axios.default.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: "metric",
        lang: "ar"
        // Arabic for condition descriptions
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching forecast data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
});
app.get("/api/prayer-times", async (req, res) => {
  try {
    const response = await import_axios.default.get(`https://api.aladhan.com/v1/timingsByCity`, {
      params: {
        city: "Taiz",
        country: "Yemen",
        method: 4
        // Umm Al-Qura University, Makkah
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching prayer times:", error.message);
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});
app.get("/api/calendar", async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }
    const response = await import_axios.default.get(`https://api.aladhan.com/v1/hijriCalendarByCity/${year}/${month}`, {
      params: {
        city: "Taiz",
        country: "Yemen",
        method: 4
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching calendar:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch calendar" });
  }
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
app.use(import_express.default.static(import_path.default.join(process.cwd(), "public")));
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
app.post("/api/admin/generate-series-descriptions", async (req, res) => {
  console.log("Environment keys:", Object.keys(process.env));
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing from environment");
    return res.status(500).json({ error: "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u0641\u0642\u0648\u062F", keys: Object.keys(process.env) });
  }
  const filePath = import_path.default.join(process.cwd(), "public/quranData.json");
  try {
    if (!import_fs.default.existsSync(filePath)) {
      return res.status(404).json({ error: "\u0645\u0644\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const content = import_fs.default.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    const { series, lessons } = data;
    if (!series || !Array.isArray(series)) {
      return res.status(400).json({ error: "\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    }
    console.log(`Starting AI description generation for ${series.length} series...`);
    const updatedSeries = await Promise.all(series.map(async (s) => {
      console.log(`Processing series: ${s.title} (${s.id})`);
      const relatedLessons = lessons.filter((l) => l.seriesId === s.id);
      if (relatedLessons.length === 0) {
        console.log(`No lessons found for series ${s.id}`);
        return s;
      }
      const lessonTitles = relatedLessons.map((l) => l.title).join("\u060C ");
      const prompt = `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0641\u064A \u0645\u062D\u062A\u0648\u0649 \u0647\u062F\u064A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645. \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u062F\u0631\u0648\u0633 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0633\u0644\u0633\u0644\u0629 \u0628\u0639\u0646\u0648\u0627\u0646 "${s.title}":
      
      \u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u062F\u0631\u0648\u0633:
      ${lessonTitles}
      
      \u0627\u0643\u062A\u0628 \u0648\u0635\u0641\u0627\u064B \u062C\u0630\u0627\u0628\u0627\u064B \u0648\u0645\u062E\u062A\u0635\u0631\u0627\u064B \u062C\u062F\u0627\u064B (\u0628\u064A\u0646 15 \u0625\u0644\u0649 25 \u0643\u0644\u0645\u0629) \u0644\u0647\u0630\u0647 \u0627\u0644\u0633\u0644\u0633\u0644\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629. \u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0641\u0627\u0626\u062F\u0629 \u0627\u0644\u0625\u064A\u0645\u0627\u0646\u064A\u0629 \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0644\u0644\u0645\u062D\u062A\u0648\u0649. \u0644\u0627 \u062A\u0632\u062F \u0639\u0646 25 \u0643\u0644\u0645\u0629.`;
      try {
        console.log(`Calling Gemini for series ${s.id}...`);
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt
        });
        const description = response.text?.trim() || s.description;
        console.log(`Generated description for ${s.id}: ${description?.substring(0, 50)}...`);
        try {
          console.log(`Updating Firestore for series ${s.id}...`);
          await db.collection("quran_series").doc(s.id).update({
            description,
            updatedAt: import_firestore.FieldValue.serverTimestamp()
          });
          console.log(`Firestore updated for series ${s.id}`);
        } catch (fsErr) {
          console.error(`Firestore update failed for series ${s.id}:`, fsErr.message);
        }
        return { ...s, description };
      } catch (err) {
        console.error(`Error generating description for series ${s.id}:`, err.message);
        return s;
      }
    }));
    data.series = updatedSeries;
    import_fs.default.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
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
            message: "\u062A\u062D\u062F\u064A\u062B \u0623\u0648\u0635\u0627\u0641 \u0627\u0644\u0633\u0644\u0627\u0633\u0644 \u0639\u0628\u0631 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
            content: base64Content,
            sha,
            branch
          })
        });
      } catch (ghErr) {
        console.error("GitHub sync error for AI descriptions:", ghErr);
      }
    }
    res.json({ success: true, updatedCount: series.length });
  } catch (error) {
    console.error("Error in generate-series-descriptions:", error);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0623\u0648\u0635\u0627\u0641 \u0639\u0628\u0631 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" });
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
  console.log(`[Server] ImageKit upload request received. req.file: ${!!req.file}, req.body.imageBase64: ${!!req.body?.imageBase64}`);
  let fileContent;
  let originalName = "uploaded_image.jpg";
  let isTempFile = false;
  let tempFilePath = "";
  if (req.file) {
    console.log(`[Server] Received file via Multer: ${req.file.originalname}, size: ${req.file.size}`);
    fileContent = import_fs.default.readFileSync(req.file.path);
    originalName = req.file.originalname;
    isTempFile = true;
    tempFilePath = req.file.path;
  } else if (req.body && req.body.imageBase64) {
    console.log(`[Server] Received base64 image string, length: ${req.body.imageBase64.length}`);
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
    console.warn("[Server] No file or base64 data in request body:", req.body);
    return res.status(400).json({ error: "No file or base64 image uploaded" });
  }
  if (!imagekit.options.publicKey || !imagekit.options.privateKey || !imagekit.options.urlEndpoint) {
    console.error("[Server] ImageKit credentials missing. Config:", {
      publicKey: !!imagekit.options.publicKey,
      privateKey: !!imagekit.options.privateKey,
      urlEndpoint: !!imagekit.options.urlEndpoint
    });
    if (isTempFile) {
      try {
        import_fs.default.unlinkSync(tempFilePath);
      } catch (e) {
      }
    }
    return res.status(500).json({ error: "\u062E\u062F\u0645\u0629 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 (\u0628\u064A\u0627\u0646\u0627\u062A ImageKit \u0645\u0641\u0642\u0648\u062F\u0629)" });
  }
  try {
    console.log(`[Server] Sending to ImageKit: fileName=${originalName}, size=${fileContent.length}`);
    const uploadResponse = await imagekit.upload({
      file: fileContent,
      fileName: originalName,
      folder: "/uploads"
    });
    console.log("[Server] ImageKit upload success:", uploadResponse.url);
    if (isTempFile) {
      try {
        import_fs.default.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("[Server] Error deleting temp file:", err);
      }
    }
    res.json({
      url: uploadResponse.url,
      thumbnail: uploadResponse.thumbnailUrl,
      status: "success",
      fileId: uploadResponse.fileId
    });
  } catch (error) {
    console.error("[Server] ImageKit upload error details:", error);
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
var SUBSCRIPTIONS_FILE = import_path.default.join(CACHE_DIR, "push_subscriptions.json");
function getStoredSubscriptions() {
  if (import_fs.default.existsSync(SUBSCRIPTIONS_FILE)) {
    try {
      const content = import_fs.default.readFileSync(SUBSCRIPTIONS_FILE, "utf8");
      return JSON.parse(content) || [];
    } catch (e) {
      console.error("Error reading subscriptions cache:", e);
    }
  }
  return [];
}
function saveStoredSubscriptions(subs) {
  try {
    import_fs.default.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving subscriptions cache:", e);
  }
}
app.post("/api/push/subscribe", (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription payload." });
  }
  let subs = getStoredSubscriptions();
  if (!subs.find((s) => s.endpoint === subscription.endpoint)) {
    subs.push(subscription);
    saveStoredSubscriptions(subs);
    console.log(`New push subscription added. Total active local subscriptions: ${subs.length}`);
  }
  res.status(201).json({ success: true });
});
app.post("/api/push/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint required." });
  }
  let subs = getStoredSubscriptions();
  const initialLength = subs.length;
  subs = subs.filter((s) => s.endpoint !== endpoint);
  if (subs.length < initialLength) {
    saveStoredSubscriptions(subs);
    console.log(`Push subscription removed. Total active local subscriptions: ${subs.length}`);
  }
  res.json({ success: true });
});
app.post("/api/push/send", async (req, res) => {
  const { title, body, url, icon, image } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Notification title is required." });
  }
  const payload = JSON.stringify({
    title,
    body: body || "",
    url: url || "/",
    icon: icon || "/app-icon.png",
    badge: "/app-icon.png",
    image: image || void 0
  });
  const subs = getStoredSubscriptions();
  console.log(`Attempting to broadcast push notification to ${subs.length} local subscribers.`);
  const notificationsPromises = subs.map((sub) => {
    return import_web_push.default.sendNotification(sub, payload).catch((err) => {
      console.error(`Error sending push notification to endpoint ${sub.endpoint}:`, err);
      if (err.statusCode === 410 || err.statusCode === 404) {
        return { error: true, endpoint: sub.endpoint };
      }
      return null;
    });
  });
  try {
    const results = await Promise.all(notificationsPromises);
    const endpointsToRemove = results.filter((r) => r && r.error).map((r) => r.endpoint);
    if (endpointsToRemove.length > 0) {
      const activeSubs = subs.filter((s) => !endpointsToRemove.includes(s.endpoint));
      saveStoredSubscriptions(activeSubs);
      console.log(`Removed ${endpointsToRemove.length} expired subscriptions. Active remaining: ${activeSubs.length}`);
    }
    res.json({ success: true, sentCount: subs.length - endpointsToRemove.length });
  } catch (err) {
    console.error("Error broadcasting push notifications:", err);
    res.status(500).json({ error: "Failed to broadcast some notifications.", message: err.message });
  }
});
app.get("/sw.js", (req, res) => {
  const swPath = import_path.default.resolve(process.cwd(), "public", "sw.js");
  if (import_fs.default.existsSync(swPath)) {
    res.setHeader("Content-Type", "application/javascript");
    return res.sendFile(swPath);
  }
  const distSwPath = import_path.default.resolve(process.cwd(), "dist", "sw.js");
  if (import_fs.default.existsSync(distSwPath)) {
    res.setHeader("Content-Type", "application/javascript");
    return res.sendFile(distSwPath);
  }
  res.status(404).send("Service worker not found");
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
startServer().catch((err) => {
  console.error("Critical failure during server startup:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
