import { Capacitor } from "@capacitor/core";

export const ANDROID_PACKAGE_NAME = "com.taiz.platform";
export const APP_SCHEME = "taizmedia";
export const DEFAULT_FALLBACK_URL = "https://taiz-media-ye.vercel.app";

/**
 * Checks if current user is on an Android browser (web, not running inside native capacitor app)
 */
export function isAndroidWebBrowser(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent || "");
}

/**
 * Generates an Android Intent URL that asks the Android OS to open the content in the installed app.
 * If not installed, it falls back to the web browser or download URL.
 */
export function buildAndroidIntentUrl(path: string, fallbackUrl?: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const host = typeof window !== "undefined" ? window.location.host : "taiz-media-ye.vercel.app";
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
