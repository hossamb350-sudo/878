import { Capacitor } from "@capacitor/core";

export const ANDROID_PACKAGE_NAME = "com.taiz.platform";
export const APP_SCHEME = "taizmedia";
export const SECONDARY_APP_SCHEME = "taizapp";
export const PRIMARY_DOMAIN = "taiz-media-ye.vercel.app";
export const DEFAULT_FALLBACK_URL = `https://${PRIMARY_DOMAIN}`;

export interface ParsedDeepLink {
  pathname: string;
  search: string;
  hash: string;
  fullPath: string;
  originalUrl: string;
  isSupportedRoute: boolean;
  contentType?: "news" | "articles" | "watch" | "leader" | "events" | "topic" | "quran" | "weather" | "prayer-times" | "calendar" | "search" | "home" | "admin" | "other";
  slugOrId?: string;
}

/**
 * Checks if current user is on an Android browser (web, not running inside native capacitor app)
 */
export function isAndroidWebBrowser(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent || "");
}

/**
 * Robustly parses and extracts the internal application route from any incoming App Link or Custom Scheme.
 * Handles HTTPS/HTTP App Links, custom schemes (taizmedia://, taizapp://), query parameters, hash fragments,
 * and decoded Arabic slugs.
 */
export function parseAndResolveDeepLink(rawUrl: string): ParsedDeepLink {
  const fallbackResult: ParsedDeepLink = {
    pathname: "/",
    search: "",
    hash: "",
    fullPath: "/",
    originalUrl: rawUrl || "",
    isSupportedRoute: true,
    contentType: "home",
  };

  if (!rawUrl || typeof rawUrl !== "string") {
    return fallbackResult;
  }

  let cleanUrl = rawUrl.trim();

  // 1. Handle nested schemes like "taizmedia://https://taiz-media-ye.vercel.app/news/123"
  if (cleanUrl.startsWith("taizmedia://http") || cleanUrl.startsWith("taizapp://http")) {
    cleanUrl = cleanUrl.replace(/^taiz(media|app):\/\//, "");
  }

  let pathname = "/";
  let search = "";
  let hash = "";

  try {
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      const parsed = new URL(cleanUrl);
      pathname = parsed.pathname || "/";
      search = parsed.search || "";
      hash = parsed.hash || "";
    } else if (cleanUrl.startsWith("taizmedia://") || cleanUrl.startsWith("taizapp://")) {
      // Remove custom scheme
      const withoutScheme = cleanUrl.replace(/^taiz(media|app):\/\//, "");
      // Construct dummy url to parse path, search and hash cleanly
      const parsed = new URL("https://taiz-media-ye.vercel.app/" + withoutScheme.replace(/^\/+/, ""));
      pathname = parsed.pathname || "/";
      search = parsed.search || "";
      hash = parsed.hash || "";
    } else if (cleanUrl.startsWith("/")) {
      const parsed = new URL("https://taiz-media-ye.vercel.app" + cleanUrl);
      pathname = parsed.pathname || "/";
      search = parsed.search || "";
      hash = parsed.hash || "";
    } else {
      const parsed = new URL("https://taiz-media-ye.vercel.app/" + cleanUrl);
      pathname = parsed.pathname || "/";
      search = parsed.search || "";
      hash = parsed.hash || "";
    }
  } catch (err) {
    console.warn("[DeepLink] Error parsing raw URL:", rawUrl, err);
    pathname = cleanUrl.startsWith("/") ? cleanUrl : "/" + cleanUrl;
  }

  // Normalize pathname: ensure single leading slash, remove trailing slash if not root
  if (!pathname.startsWith("/")) pathname = "/" + pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const fullPath = `${pathname}${search}${hash}`;

  // Analyze content type and slug/ID
  const segments = pathname.split("/").filter(Boolean);
  let contentType: ParsedDeepLink["contentType"] = "other";
  let slugOrId: string | undefined = undefined;

  if (segments.length === 0) {
    contentType = "home";
  } else {
    const first = segments[0].toLowerCase();
    switch (first) {
      case "news":
        contentType = "news";
        slugOrId = segments[1] ? decodeURIComponent(segments[1]) : undefined;
        break;
      case "articles":
        contentType = "articles";
        slugOrId = segments[1] ? decodeURIComponent(segments[1]) : undefined;
        break;
      case "watch":
        contentType = "watch";
        slugOrId = segments[1] === "channel" ? (segments[2] ? decodeURIComponent(segments[2]) : undefined) : (segments[1] ? decodeURIComponent(segments[1]) : undefined);
        break;
      case "leader":
        contentType = "leader";
        slugOrId = segments[1] ? decodeURIComponent(segments[1]) : undefined;
        break;
      case "events":
        contentType = "events";
        slugOrId = segments[1] === "activity" ? (segments[2] ? decodeURIComponent(segments[2]) : undefined) : undefined;
        break;
      case "topic":
        contentType = "topic";
        slugOrId = segments[1] ? decodeURIComponent(segments[1]) : undefined;
        break;
      case "quran":
        contentType = "quran";
        break;
      case "weather":
        contentType = "weather";
        break;
      case "prayer-times":
        contentType = "prayer-times";
        break;
      case "calendar":
        contentType = "calendar";
        break;
      case "search":
        contentType = "search";
        break;
      case "admin":
        contentType = "admin";
        break;
      default:
        contentType = "other";
    }
  }

  const isSupportedRoute = contentType !== "other" || pathname === "/";

  return {
    pathname,
    search,
    hash,
    fullPath,
    originalUrl: rawUrl,
    isSupportedRoute,
    contentType,
    slugOrId,
  };
}

/**
 * Generates an Android Intent URL that asks the Android OS to open the content in the installed app.
 * If not installed, it falls back to the web browser or download URL.
 */
export function buildAndroidIntentUrl(path: string, fallbackUrl?: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const host = typeof window !== "undefined" ? window.location.host : PRIMARY_DOMAIN;
  const scheme = "https";
  const fallback = fallbackUrl || `${DEFAULT_FALLBACK_URL}${cleanPath}`;

  // Standard Chrome Android Intent URL
  // intent://<host><path>#Intent;scheme=https;package=com.taiz.platform;S.browser_fallback_url=<fallback>;end
  return `intent://${host}${cleanPath}#Intent;scheme=${scheme};package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

/**
 * Tries to open the content in the Android App.
 * If the app is installed, Android will intercept and launch the native app.
 * If not installed, it triggers the fallback download or continues in browser.
 */
export function openInAndroidApp(path: string, downloadUrl?: string): void {
  if (typeof window === "undefined") return;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const intentUrl = buildAndroidIntentUrl(cleanPath, downloadUrl);

  // Attempt opening via intent
  window.location.href = intentUrl;
}

