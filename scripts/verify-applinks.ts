import fs from "fs";
import path from "path";
import { parseAndResolveDeepLink } from "../src/utils/deepLink";

console.log("==========================================================================");
console.log("🔍 TESTING & VERIFYING ANDROID APP LINKS + DEEP LINKING CONFIGURATION");
console.log("==========================================================================\n");

let hasErrors = false;

// 1. Verify public/.well-known/assetlinks.json
const assetlinksPath = path.join(process.cwd(), "public/.well-known/assetlinks.json");
console.log("1️⃣ Checking Digital Asset Links File:", assetlinksPath);
if (!fs.existsSync(assetlinksPath)) {
  console.error("❌ public/.well-known/assetlinks.json does not exist!");
  hasErrors = true;
} else {
  try {
    const raw = fs.readFileSync(assetlinksPath, "utf8");
    const json = JSON.parse(raw);
    if (!Array.isArray(json) || json.length === 0) {
      console.error("❌ assetlinks.json must be a non-empty array!");
      hasErrors = true;
    } else {
      const entry = json[0];
      const pkg = entry?.target?.package_name;
      const fingerprints = entry?.target?.sha256_cert_fingerprints;
      
      console.log(`   - Namespace: ${entry?.target?.namespace} (Expected: android_app)`);
      console.log(`   - Package Name: ${pkg}`);
      console.log(`   - SHA-256 Fingerprints count: ${fingerprints?.length || 0}`);
      
      if (pkg !== "com.taiz.platform") {
        console.error(`❌ Unexpected package_name "${pkg}"! Expected "com.taiz.platform"`);
        hasErrors = true;
      }
      if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
        console.error("❌ sha256_cert_fingerprints is missing or empty!");
        hasErrors = true;
      } else {
        fingerprints.forEach((fp: string, i: number) => {
          const isValidFormat = /^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/.test(fp);
          console.log(`     [${i + 1}] ${fp} => Format Valid: ${isValidFormat}`);
          if (!isValidFormat) {
            console.error(`❌ Fingerprint #${i + 1} has invalid format!`);
            hasErrors = true;
          }
        });
      }
    }
    console.log("✅ Digital Asset Links file syntax is valid!\n");
  } catch (err: any) {
    console.error("❌ Failed to parse assetlinks.json:", err.message);
    hasErrors = true;
  }
}

// 2. Verify AndroidManifest.xml
const manifestPath = path.join(process.cwd(), "android/app/src/main/AndroidManifest.xml");
console.log("2️⃣ Checking AndroidManifest.xml Intent Filters:", manifestPath);
if (!fs.existsSync(manifestPath)) {
  console.error("❌ AndroidManifest.xml not found!");
  hasErrors = true;
} else {
  const manifest = fs.readFileSync(manifestPath, "utf8");
  
  const hasAutoVerify = manifest.includes('android:autoVerify="true"');
  const hasActionView = manifest.includes('android.intent.action.VIEW');
  const hasDefaultCategory = manifest.includes('android.intent.category.DEFAULT');
  const hasBrowsableCategory = manifest.includes('android.intent.category.BROWSABLE');
  const hasHost = manifest.includes('taiz-media-ye.vercel.app');
  const hasLaunchModeSingleTask = manifest.includes('android:launchMode="singleTask"');

  console.log(`   - android:autoVerify="true": ${hasAutoVerify ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - Action VIEW: ${hasActionView ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - Category DEFAULT: ${hasDefaultCategory ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - Category BROWSABLE: ${hasBrowsableCategory ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - Host taiz-media-ye.vercel.app: ${hasHost ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - Activity launchMode="singleTask": ${hasLaunchModeSingleTask ? "✅ Present" : "❌ Missing"}`);

  if (!hasAutoVerify || !hasActionView || !hasDefaultCategory || !hasBrowsableCategory || !hasHost || !hasLaunchModeSingleTask) {
    console.error("❌ AndroidManifest.xml is missing required App Links configurations!");
    hasErrors = true;
  } else {
    console.log("✅ AndroidManifest.xml App Links intent filters are valid!\n");
  }
}

// 3. Verify vercel.json
const vercelPath = path.join(process.cwd(), "vercel.json");
console.log("3️⃣ Checking vercel.json headers & rewrites:", vercelPath);
if (!fs.existsSync(vercelPath)) {
  console.error("❌ vercel.json not found!");
  hasErrors = true;
} else {
  const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
  const assetlinksHeader = vercel.headers?.find((h: any) => h.source === "/.well-known/assetlinks.json");
  const assetlinksRewrite = vercel.rewrites?.find((r: any) => r.source === "/.well-known/assetlinks.json");
  
  console.log(`   - assetlinks.json custom headers: ${assetlinksHeader ? "✅ Configured" : "❌ Missing"}`);
  console.log(`   - assetlinks.json static bypass rewrite: ${assetlinksRewrite ? "✅ Configured" : "❌ Missing"}`);

  if (!assetlinksHeader || !assetlinksRewrite) {
    console.error("❌ vercel.json missing required assetlinks rules!");
    hasErrors = true;
  } else {
    console.log("✅ vercel.json configuration is valid!\n");
  }
}

// 4. Test Deep Link Resolver with Various Real-World URLs
console.log("4️⃣ Testing Deep Link URL Resolution Logic:");
const testUrls = [
  { url: "https://taiz-media-ye.vercel.app/", expectedPath: "/", expectedType: "home" },
  { url: "https://taiz-media-ye.vercel.app/news/economic-report-2026", expectedPath: "/news/economic-report-2026", expectedType: "news" },
  { url: "https://taiz-media-ye.vercel.app/news/%D8%AE%D8%A8%D8%B1-%D8%B9%D8%A7%D8%AC%D9%84?ref=fcm#main", expectedPath: "/news/%D8%AE%D8%A8%D8%B1-%D8%B9%D8%A7%D8%AC%D9%84?ref=fcm#main", expectedType: "news" },
  { url: "https://taiz-media-ye.vercel.app/articles/history-of-taiz", expectedPath: "/articles/history-of-taiz", expectedType: "articles" },
  { url: "https://taiz-media-ye.vercel.app/watch/taiz-documentary-ep1", expectedPath: "/watch/taiz-documentary-ep1", expectedType: "watch" },
  { url: "https://taiz-media-ye.vercel.app/watch/channel/live1", expectedPath: "/watch/channel/live1", expectedType: "watch" },
  { url: "https://taiz-media-ye.vercel.app/leader/statement-44", expectedPath: "/leader/statement-44", expectedType: "leader" },
  { url: "https://taiz-media-ye.vercel.app/events/activity/youth-summit", expectedPath: "/events/activity/youth-summit", expectedType: "events" },
  { url: "https://taiz-media-ye.vercel.app/topic/culture-heritage", expectedPath: "/topic/culture-heritage", expectedType: "topic" },
  { url: "https://taiz-media-ye.vercel.app/quran", expectedPath: "/quran", expectedType: "quran" },
  { url: "https://taiz-media-ye.vercel.app/prayer-times", expectedPath: "/prayer-times", expectedType: "prayer-times" },
  { url: "https://taiz-media-ye.vercel.app/weather", expectedPath: "/weather", expectedType: "weather" },
  { url: "https://taiz-media-ye.vercel.app/calendar/9/1447", expectedPath: "/calendar/9/1447", expectedType: "calendar" },
  { url: "https://taiz-media-ye.vercel.app/search?q=taiz", expectedPath: "/search?q=taiz", expectedType: "search" },
  { url: "taizmedia://news/custom-scheme-news-1", expectedPath: "/news/custom-scheme-news-1", expectedType: "news" },
  { url: "taizapp://watch/custom-scheme-video-2", expectedPath: "/watch/custom-scheme-video-2", expectedType: "watch" },
];

let passCount = 0;
testUrls.forEach((test, idx) => {
  const result = parseAndResolveDeepLink(test.url);
  const pathMatches = result.fullPath === test.expectedPath;
  const typeMatches = result.contentType === test.expectedType;

  if (pathMatches && typeMatches) {
    passCount++;
    console.log(`   ✅ Test #${idx + 1}: ${test.url} => ${result.fullPath} (${result.contentType})`);
  } else {
    console.error(`   ❌ Test #${idx + 1} Failed! Input: ${test.url}`);
    console.error(`      Expected: path="${test.expectedPath}", type="${test.expectedType}"`);
    console.error(`      Actual:   path="${result.fullPath}", type="${result.contentType}"`);
    hasErrors = true;
  }
});

console.log(`\nURL Resolution Score: ${passCount}/${testUrls.length} passed.`);

console.log("\n==========================================================================");
if (hasErrors) {
  console.error("❌ VERIFICATION FAILED! Review the errors above.");
  process.exit(1);
} else {
  console.log("🎉 ALL ANDROID APP LINKS & DEEP LINKING CHECKS PASSED SUCCESSFULLY!");
  console.log("==========================================================================");
}
