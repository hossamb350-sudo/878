import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import ImageKit from "imagekit";
import os from "os";
import cors from "cors";
import https from "https";
import webPush from "web-push";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { injectDynamicMetaTags } from "./src/ogInjector";
import { IMAGEKIT_CONFIG } from "./src/config/imagekitConfig";

dotenv.config();

// Load Firebase Config
let firebaseConfig: any = { projectId: process.env.FIREBASE_PROJECT_ID || "taiz-media" };
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json, falling back to env var.");
}

// Initialize Firebase Admin lazily
let adminApp: App | null = null;
let dbInstance: any = null;

function getDb() {
  if (!dbInstance) {
    try {
      if (getApps().length === 0) {
        const adminConfig: any = {
          projectId: firebaseConfig.projectId,
        };
        
        // Use environment credentials if available (required for Vercel/FCM)
        if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
          try {
            const { cert } = require("firebase-admin/app");
            adminConfig.credential = cert({
              projectId: firebaseConfig.projectId,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
            console.log("Firebase Admin initialized with explicit service account credentials.");
          } catch (e) {
            console.error("Error setting up Firebase Admin credentials:", e);
          }
        }
        
        adminApp = initializeApp(adminConfig);
      } else {
        adminApp = getApps()[0];
      }
      dbInstance = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || "(default)");
    } catch (err) {
      console.error("Failed to initialize Firebase Admin / Firestore:", err);
      return null;
    }
  }
  return dbInstance;
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Safe CJS/ESM interop helpers
const webPushClient: typeof webPush = (webPush as any).default || webPush;
const ImageKitConstructor: typeof ImageKit = (ImageKit as any).default || ImageKit;

// Configure web-push details safely
function isValidVapidKey(publicKey: string): boolean {
  if (!publicKey || typeof publicKey !== "string") return false;
  try {
    const normalized = publicKey.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(normalized, "base64");
    return buf.length === 65;
  } catch (e) {
    return false;
  }
}

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hossamb350@gmail.com";

try {
  let pubKey = process.env.VITE_VAPID_PUBLIC_KEY;
  let privKey = process.env.VAPID_PRIVATE_KEY;

  if (!pubKey || !privKey || !isValidVapidKey(pubKey)) {
    console.warn("Generating dynamic fallback VAPID keys since environment keys are missing or invalid.");
    const generated = webPushClient.generateVAPIDKeys();
    pubKey = generated.publicKey;
    privKey = generated.privateKey;
  }

  webPushClient.setVapidDetails(VAPID_SUBJECT, pubKey, privKey);
  console.log("Web-Push VAPID details configured successfully.");
} catch (e) {
  console.error("Failed to set VAPID details (Push notifications disabled):", e);
}

// Enable CORS for all origins dynamically
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"]
}));

// Initialize ImageKit
const imagekit = new ImageKitConstructor({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || IMAGEKIT_CONFIG.publicKey,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || IMAGEKIT_CONFIG.privateKey,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || IMAGEKIT_CONFIG.urlEndpoint,
});

// Initialize Gemini
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  }
  return aiClient;
}

app.use(express.json({ limit: "50mb" }));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Android App Links verification
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const filePath = path.join(process.cwd(), "public/.well-known/assetlinks.json");
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.taiz.platform",
        sha256_cert_fingerprints: [
          "96:68:87:11:35:F0:97:ED:FF:47:DB:45:D9:FB:80:65:55:89:4C:CF:A2:83:73:59:2B:7D:A8:E4:76:2D:4B:E0",
          "14:6D:E9:75:5F:52:12:D7:4E:20:97:E2:51:14:6B:0B:08:42:34:64:1B:32:49:50:4E:0F:81:9F:60:A2:69:DA"
        ]
      }
    }
  ]);
});

// Quran Data API
app.get("/api/quran-data", (req, res) => {
  const filePath = path.join(process.cwd(), "public/quranData.json");
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);
      return res.json(data);
    } catch (e) {
      console.error("Error parsing quranData.json:", e);
      return res.status(500).json({ error: "Failed to parse Quran data" });
    }
  }
  res.status(404).json({ error: "Quran data not found" });
});

// Weather API
app.get("/api/weather", async (req, res) => {
  try {
    const { lat = "13.660174", lon = "44.131802" } = req.query; // Exact location coordinates
    const apiKey = process.env.OPENWEATHER_API_KEY || "";

    // Disable caching headers for live real-time updates
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: "metric",
        lang: "ar" // Arabic for condition descriptions
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching weather data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch weather data", details: error.message });
  }
});

// Forecast API
app.get("/api/forecast", async (req, res) => {
  try {
    const { lat = "13.660174", lon = "44.131802" } = req.query; // Exact location coordinates
    const apiKey = process.env.OPENWEATHER_API_KEY || "";

    // Disable caching headers for live real-time updates
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: "metric",
        lang: "ar" // Arabic for condition descriptions
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching forecast data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch forecast data", details: error.message });
  }
});

// Air Pollution API (OpenWeatherMap)
app.get("/api/air_pollution", async (req, res) => {
  try {
    const { lat = "13.660174", lon = "44.131802" } = req.query; // Exact location coordinates
    const apiKey = process.env.OPENWEATHER_API_KEY || "";

    // Disable caching headers for live real-time updates
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution`, {
      params: {
        lat,
        lon,
        appid: apiKey
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching air pollution data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch air pollution data", details: error.message });
  }
});

// Prayer Times API
app.get("/api/prayer-times", async (req, res) => {
  try {
    const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity`, {
      params: {
        city: 'Taiz',
        country: 'Yemen',
        method: 4 // Umm Al-Qura University, Makkah
      }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching prayer times:", error.message);
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});

// Hijri Calendar API
app.get("/api/calendar", async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }
    
    const response = await axios.get(`https://api.aladhan.com/v1/hijriCalendarByCity/${year}/${month}`, {
      params: {
        city: 'Taiz',
        country: 'Yemen',
        method: 4
      }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching calendar:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch calendar" });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Cache directory setup
const CACHE_DIR = process.env.NODE_ENV === "production" ? path.join(os.tmpdir(), "cache") : path.join(process.cwd(), "cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Uploads directory setup
const UPLOADS_DIR = process.env.NODE_ENV === "production" ? path.join(os.tmpdir(), "uploads") : path.join(process.cwd(), "public/uploads");
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

// Serve uploads and public statically
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(path.join(process.cwd(), "public")));

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
    if (process.env.NODE_ENV !== "production") {
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tempPath, filePath);
    }
    
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

// AI Generation route for Series Descriptions
app.post("/api/admin/generate-series-descriptions", async (req, res) => {
  console.log("Environment keys:", Object.keys(process.env));
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing from environment");
    return res.status(500).json({ error: "مفتاح الذكاء الاصطناعي مفقود", keys: Object.keys(process.env) });
  }

  const filePath = path.join(process.cwd(), "public/quranData.json");
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "ملف البيانات غير موجود" });
    }

    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    const { series, lessons } = data;

    if (!series || !Array.isArray(series)) {
      return res.status(400).json({ error: "تنسيق البيانات غير صحيح" });
    }

    console.log(`Starting AI description generation for ${series.length} series...`);

    const updatedSeries = await Promise.all(series.map(async (s: any) => {
      console.log(`Processing series: ${s.title} (${s.id})`);
      // Find related lessons
      const relatedLessons = lessons.filter((l: any) => l.seriesId === s.id);
      if (relatedLessons.length === 0) {
        console.log(`No lessons found for series ${s.id}`);
        return s;
      }

      const lessonTitles = relatedLessons.map((l: any) => l.title).join("، ");
      const ai = getAiClient();
    const prompt = `أنت خبير في محتوى هدي القرآن الكريم. بناءً على عناوين الدروس التالية التابعة لسلسلة بعنوان "${s.title}":
      
      عناوين الدروس:
      ${lessonTitles}
      
      اكتب وصفاً جذاباً ومختصراً جداً (بين 15 إلى 25 كلمة) لهذه السلسلة باللغة العربية. ركز على الفائدة الإيمانية والتربوية للمحتوى. لا تزد عن 25 كلمة.`;

      try {
        console.log(`Calling Gemini for series ${s.id}...`);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const description = response.text?.trim() || s.description;
        console.log(`Generated description for ${s.id}: ${description?.substring(0, 50)}...`);
        
        // Update in Firestore
        try {
          const db = getDb();
          if (db) {
            console.log(`Updating Firestore for series ${s.id}...`);
            await db.collection("quran_series").doc(s.id).update({
              description: description,
              updatedAt: FieldValue.serverTimestamp()
            });
            console.log(`Firestore updated for series ${s.id}`);
          }
        } catch (fsErr: any) {
          console.error(`Firestore update failed for series ${s.id}:`, fsErr.message);
        }

        return { ...s, description };
      } catch (err: any) {
        console.error(`Error generating description for series ${s.id}:`, err.message);
        return s;
      }
    }));

    data.series = updatedSeries;
    
    // Save locally
    if (process.env.NODE_ENV !== "production") {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    }
    
    // Sync with GitHub if configured
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
            message: "تحديث أوصاف السلاسل عبر الذكاء الاصطناعي",
            content: base64Content,
            sha,
            branch,
          }),
        });
      } catch (ghErr) {
        console.error("GitHub sync error for AI descriptions:", ghErr);
      }
    }

    res.json({ success: true, updatedCount: series.length });
  } catch (error) {
    console.error("Error in generate-series-descriptions:", error);
    res.status(500).json({ error: "فشل في توليد الأوصاف عبر الذكاء الاصطناعي" });
  }
});

// Stream Proxy API (For HTTP radio streams to avoid Mixed Content / CORS on Web browsers)
app.get("/api/proxy/stream", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const isHttps = targetUrl.startsWith("https://");
    const response = await axios({
      method: "get",
      url: targetUrl,
      responseType: "stream",
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 400,
      httpsAgent: isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Icy-MetaData": "0"
      }
    });

    // Copy relevant headers for HTML5 Audio playback
    const contentType = response.headers["content-type"] || "audio/mpeg";
    res.setHeader("Content-Type", String(contentType));

    if (response.headers["icy-metaint"]) {
      res.setHeader("icy-metaint", String(response.headers["icy-metaint"]));
    }
    if (response.headers["icy-name"]) {
      res.setHeader("icy-name", String(response.headers["icy-name"]));
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Access-Control-Allow-Origin", "*");

    response.data.pipe(res);

    // Cleanly close upstream stream when browser pauses or disconnects
    req.on("close", () => {
      if (response.data && !response.data.destroyed) {
        response.data.destroy();
      }
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    if (status === 404) {
      res.status(404).json({ error: "Stream offline or outside broadcast hours" });
    } else {
      console.warn("Stream proxy notice:", error.message || error);
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: "Failed to connect to stream"
      });
    }
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
  console.log(`[Server] ImageKit upload request received. req.file: ${!!req.file}, req.body.imageBase64: ${!!req.body?.imageBase64}`);
  
  let fileContent;
  let originalName = "uploaded_image.jpg";
  let isTempFile = false;
  let tempFilePath = "";

  if (req.file) {
    console.log(`[Server] Received file via Multer: ${req.file.originalname}, size: ${req.file.size}`);
    fileContent = fs.readFileSync(req.file.path);
    originalName = req.file.originalname;
    isTempFile = true;
    tempFilePath = req.file.path;
  } else if (req.body && req.body.imageBase64) {
    console.log(`[Server] Received base64 image string, length: ${req.body.imageBase64.length}`);
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
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    return res.status(500).json({ error: "خدمة رفع الصور غير مهيأة (بيانات ImageKit مفقودة)" });
  }

  try {
    console.log(`[Server] Sending to ImageKit: fileName=${originalName}, size=${fileContent.length}`);
    const uploadResponse = await imagekit.upload({
      file: fileContent,
      fileName: originalName,
      folder: "/uploads",
    });

    console.log("[Server] ImageKit upload success:", uploadResponse.url);

    if (isTempFile) {
      try {
        fs.unlinkSync(tempFilePath);
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
  } catch (error: any) {
    console.error("[Server] ImageKit upload error details:", error);
    
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

// Cache file path for subscriptions
const SUBSCRIPTIONS_FILE = path.join(CACHE_DIR, "push_subscriptions.json");

// Helper to read subscriptions from local cache
function getStoredSubscriptions(): any[] {
  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    try {
      const content = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf8");
      return JSON.parse(content) || [];
    } catch (e) {
      console.error("Error reading subscriptions cache:", e);
    }
  }
  return [];
}

// Helper to save subscriptions to local cache
function saveStoredSubscriptions(subs: any[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving subscriptions cache:", e);
  }
}

// Subscribe route
app.post("/api/push/subscribe", (req, res) => {

  const subscription = req.body;
  
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription payload." });
  }

  let subs = getStoredSubscriptions();
  // Avoid duplicate subscriptions
  if (!subs.find((s: any) => s.endpoint === subscription.endpoint)) {
    subs.push(subscription);
    saveStoredSubscriptions(subs);
    console.log(`New push subscription added. Total active local subscriptions: ${subs.length}`);
  }

  res.status(201).json({ success: true });
});

// Unsubscribe route
app.post("/api/push/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint required." });
  }

  let subs = getStoredSubscriptions();
  const initialLength = subs.length;
  subs = subs.filter((s: any) => s.endpoint !== endpoint);
  
  if (subs.length < initialLength) {
    saveStoredSubscriptions(subs);
    console.log(`Push subscription removed. Total active local subscriptions: ${subs.length}`);
  }

  res.json({ success: true });
});

// Trigger route to send push notification to all subscribers
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
    image: image || undefined,
  });

  const subs = getStoredSubscriptions();
  console.log(`Attempting to broadcast push notification to ${subs.length} local subscribers.`);

  const notificationsPromises = subs.map((sub: any) => {
    return webPushClient.sendNotification(sub, payload)
      .catch((err) => {
        console.error(`Error sending push notification to endpoint ${sub.endpoint}:`, err);
        // If the endpoint is no longer active (404 or 410 Gone), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          return { error: true, endpoint: sub.endpoint };
        }
        return null;
      });
  });

  try {
    const results = await Promise.all(notificationsPromises);
    
    // Clean up expired subscriptions
    const endpointsToRemove = results
      .filter((r: any) => r && r.error)
      .map((r: any) => r.endpoint);
      
    if (endpointsToRemove.length > 0) {
      const activeSubs = subs.filter((s: any) => !endpointsToRemove.includes(s.endpoint));
      saveStoredSubscriptions(activeSubs);
      console.log(`Removed ${endpointsToRemove.length} expired subscriptions. Active remaining: ${activeSubs.length}`);
    }

    res.json({ success: true, sentCount: subs.length - endpointsToRemove.length });
  } catch (err: any) {
    console.error("Error broadcasting push notifications:", err);
    res.status(500).json({ error: "Failed to broadcast some notifications.", message: err.message });
  }
});

app.post("/api/push/fcm-broadcast", async (req, res) => {
  const { title, body, image, data } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const db = getDb();
    if (!db || !adminApp) {
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }

    const messaging = getMessaging(adminApp);

    // Fetch all tokens from fcm_tokens collection
    const snapshot = await db.collection("fcm_tokens").get();
    const tokens = snapshot.docs.map((doc: any) => doc.id);

    if (tokens.length === 0) {
      return res.json({ success: true, message: "No FCM tokens found" });
    }

    // Split tokens into chunks of 500 (Firebase Admin SDK limit)
    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const tokenChunk = tokens.slice(i, i + chunkSize);
      const message: any = {
        notification: {
          title: title,
          body: body || "",
        },
        data: data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "fcm_high_priority_channel",
            visibility: "PUBLIC",
            notificationPriority: "PRIORITY_MAX",
            defaultSound: true,
            defaultVibrateTimings: true,
            defaultLightSettings: true,
          },
        },
        tokens: tokenChunk,
      };

      if (image) {
        message.notification.imageUrl = image;
      }

      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokenChunk[idx]);
          }
        });
      }
    }

    // Clean up failed tokens (e.g. unregistered devices)
    if (failedTokens.length > 0) {
      console.log(`Cleaning up ${failedTokens.length} invalid FCM tokens.`);
      const batch = db.batch();
      failedTokens.forEach((token) => {
        batch.delete(db.collection("fcm_tokens").doc(token));
      });
      await batch.commit();
    }

    res.json({ success: true, successCount, failureCount });
  } catch (error: any) {
    console.error("Error broadcasting FCM notification:", error);
    if (error.message && error.message.includes("PERMISSION_DENIED")) {
      return res.status(500).json({ 
        error: "Permission Denied: Missing Firebase Admin Credentials.", 
        message: "لم يتم العثور على صلاحيات إرسال الإشعارات. إذا كنت تختبر من بيئة التطوير، فهذا طبيعي. يرجى التأكد من إضافة المتغيرات (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) في Vercel وتجربة الإرسال من المنصة الحية." 
      });
    }
    res.status(500).json({ error: "Failed to broadcast FCM notifications.", message: error.message });
  }
});

// AI Newspaper Assistant Route
app.post("/api/admin/send-notification", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const idToken = authHeader.split("Bearer ")[1];

  try {
    const db = getDb();
    if (!db || !adminApp) {
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }

    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email?.toLowerCase();

    const isSuperAdmin = email === "hossamb350@gmail.com";
    const userDoc = await db.collection("users").doc(uid).get();
    const userRole = userDoc.exists ? userDoc.data()?.role : null;

    if (!isSuperAdmin && userRole !== "admin" && userRole !== "manager") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    const { title, body, image, data, contentType, contentId, contentTitle } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    const messaging = getMessaging(adminApp);

    // Fetch all tokens
    const snapshot = await db.collection("fcm_tokens").get();
    const tokens = snapshot.docs.map((doc: any) => doc.id);

    if (tokens.length === 0) {
      return res.json({ success: true, message: "No FCM tokens found" });
    }

    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const tokenChunk = tokens.slice(i, i + chunkSize);
      const message: any = {
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "fcm_high_priority_channel",
            visibility: "PUBLIC",
            notificationPriority: "PRIORITY_MAX",
            defaultSound: true,
            defaultVibrateTimings: true,
            defaultLightSettings: true,
          },
        },
        tokens: tokenChunk,
      };

      if (image) {
        message.notification.imageUrl = image;
      }

      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokenChunk[idx]);
          }
        });
      }
    }

    if (failedTokens.length > 0) {
      const batch = db.batch();
      failedTokens.forEach((token) => {
        batch.delete(db.collection("fcm_tokens").doc(token));
      });
      await batch.commit();
    }

    // Save to history
    await db.collection("notifications_history").add({
      title,
      body,
      contentType: contentType || "general",
      contentId: contentId || "",
      contentTitle: contentTitle || "",
      sentBy: uid,
      successCount,
      failureCount,
      createdAt: Date.now(),
    });

    res.json({ success: true, successCount, failureCount });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    
    // Check for Permission Denied error (usually due to missing Service Account credentials)
    if (error.message && error.message.includes("PERMISSION_DENIED")) {
      return res.status(500).json({ 
        error: "Permission Denied: Missing Firebase Admin Credentials.", 
        message: "لم يتم العثور على صلاحيات إرسال الإشعارات. إذا كنت تختبر من بيئة التطوير، فهذا طبيعي. يرجى التأكد من إضافة المتغيرات (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) في Vercel وتجربة الإرسال من المنصة الحية." 
      });
    }

    res.status(500).json({ error: "Failed to send notification.", message: error.message });
  }
});

app.post("/api/newspaper/ai-assist", async (req, res) => {
  try {
    const { task, issueData, selectedItems } = req.body;
    const ai = getAiClient();

    if (task === "generate_editorial") {
      const prompt = `أنت رئيس تحرير صحيفة إلكترونية يمنية احترافية باسم "${issueData?.title || 'صحيفة تعز الإعلامية'}".
يرجى كتابة افتتاحية عدد برصانة وبلاغة صحفية عالية تحت عنوان رئيسي أو موضوع العدد: "${issueData?.mainHeadline || 'الأحداث والتطورات الجارية'}".
المطلوب:
1. عنوان للافتتاحية (مثال: كلمة العدد / رؤية إعلامية).
2. نص الافتتاحية في فقرات متناسقة (حوالي 150 - 250 كلمة) تغطي أهمية الرسالة الإعلامية وتستعرض التطورات بأسلوب صحفي راقٍ.
أعد النتيجة بصيغة JSON كالتالي:
{
  "title": "عنوان الافتتاحية",
  "content": "نص الافتتاحية الكامل هنا..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      return res.json(JSON.parse(text));
    }

    if (task === "auto_layout") {
      const prompt = `أنت مخرج صحفي احترافي (Art Director) لصحيفة كبرى بمهارة عالمية. 
مطلوب منك إنشاء تخطيط متكامل (Layout) لإصدار صحيفة مطبوعة/إلكترونية بناءً على المواد التالية:
${JSON.stringify((selectedItems || []).slice(0, 15).map((item: any) => ({
  id: item.id,
  title: item.title,
  category: item.category || 'عام',
  sourceType: item.sourceType || 'news',
  summary: item.summary || item.shortDescription || item.content?.substring(0, 100),
  hasImage: !!(item.imageUrl || item.image)
})))}

المعايير الفنية والطباعية الصارمة:
1. **مقاسات الصفحات:** الصحيفة تعتمد بشكل افتراضي مقاس "Broadsheet" أو يمكن تغييرها.
2. **الشبكة الإخراجية (Grid):** 6 إلى 8 أعمدة للصفحات الداخلية، و4 إلى 6 أعمدة للغلاف. المسافة بين الأعمدة 4-6 مم.
3. **أحجام الخطوط والتسلسل البصري:**
   - اسم الصحيفة: 80-130pt
   - عنوان الصفحة: 24-34pt
   - العنوان الرئيسي (الغلاف): 42-72pt
   - العنوان الداخلي: 30-48pt
   - العناوين الفرعية: 18-26pt
   - متن الأخبار: 9.5-11pt
4. **الصور:** حدد حجم الصورة (full, half, quarter, inline, square, rect, pano).
5. **التخطيطات (Templates):** لا تعتمد قالباً ثابتاً، ابتكر توزيعاً ديناميكياً يوازن المساحات البيضاء، وأعمدة النصوص، والإعلانات، والاقتباسات.
6. **الذكاء الاصطناعي الإخراجي:** حلل أهمية الخبر وحدد (importance: high/medium/low) ليتم تخصيص عدد الأعمدة (colSpan) و(rowSpan).

أعد النتيجة حصراً بصيغة JSON متوافقة مع هذا الهيكل:
{
  "theme": "classic",
  "pageSize": "broadsheet",
  "fontFamily": "IBM Plex Sans Arabic",
  "marginTop": 20, "marginBottom": 20, "marginLeft": 15, "marginRight": 15, "safeArea": 12,
  "pages": [
    {
      "pageNumber": 1,
      "pageType": "cover",
      "title": "الغلاف الرئيسي",
      "gridColumns": 6,
      "columnGap": 5,
      "layoutTemplate": "dynamic-cover-v1",
      "items": [
        {
          "id": "item_id_here",
          "importance": "high",
          "imageSize": "pano",
          "columns": 4,
          "colSpan": 4,
          "rowSpan": 2,
          "featuredBox": false
        }
        // ... (توزيع باقي المواد أو إعلانات id="ad-1" مثلاً)
      ],
      "notes": "تعليمات للمخرج حول توازن الغلاف"
    }
  ],
  "editorialSuggestions": "نصائح إخراجية لضمان التوازن البصري والجاذبية"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      return res.json(JSON.parse(text));
    }

    if (task === "enhance_subheadings") {
      const { title, content } = req.body;
      const prompt = `أنت محرر صحفي متمرس. قم بإنشاء 3 عناوين فرعية شارحة وموجزة (Deck / Subheadlines) واقتباس بارز (Pull Quote) للعنوان التالي:
العنوان: "${title}"
النص المختصر: "${(content || '').substring(0, 300)}"

أعد النتيجة بصيغة JSON:
{
  "subtitles": ["عنوان فرعي 1", "عنوان فرعي 2"],
  "pullQuote": "نص الاقتباس البارز لاستخدامه في كادر إخراجي"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      return res.json(JSON.parse(text));
    }

    return res.status(400).json({ error: "المهام المتاحة: generate_editorial, auto_layout, enhance_subheadings" });
  } catch (error: any) {
    console.error("AI Newspaper Assist Error:", error);
    res.status(500).json({ error: error.message || "فشل معالجة طلب الذكاء الاصطناعي للصحيفة" });
  }
});

// Serve Service Worker explicitly to avoid MIME type issues
app.get("/sw.js", (req, res) => {
  const swPath = path.resolve(process.cwd(), "public", "sw.js");
  if (fs.existsSync(swPath)) {
    res.setHeader("Content-Type", "application/javascript");
    return res.sendFile(swPath);
  }
  // Fallback for production build
  const distSwPath = path.resolve(process.cwd(), "dist", "sw.js");
  if (fs.existsSync(distSwPath)) {
    res.setHeader("Content-Type", "application/javascript");
    return res.sendFile(distSwPath);
  }
  res.status(404).send("Service worker not found");
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
  const isProduction = process.env.NODE_ENV === "production" || process.env.VITE_USER_NODE_ENV === "production" || !process.argv[1]?.endsWith("server.ts");

  console.log(`Starting server in ${isProduction ? 'production' : 'development'} mode...`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`CWD: ${process.cwd()}`);

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const publicPath = path.join(process.cwd(), "public");
    app.use(express.static(distPath));
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    app.get("*", async (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf-8");
        const host = req.headers.host || "taiz-media-ye.vercel.app";
        html = await injectDynamicMetaTags(req.path, html, getDb(), host);
        res.send(html);
      } else {
        res.status(404).send("Not found");
      }
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
