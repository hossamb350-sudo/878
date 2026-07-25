import { Capacitor } from "@capacitor/core";

const isProd = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.PROD) ?? (process.env.NODE_ENV === "production");
export const DEV_URL = "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
export const PROD_URL = "https://ais-pre-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";

export const API_BASE = Capacitor.isNativePlatform() ? (isProd ? PROD_URL : DEV_URL) : "";

// A robust fetch that handles cold-starts, retries, and environment URL fallbacks on mobile
export async function fetchWithFallback(path: string, options?: RequestInit, retries = 3, delay = 2000): Promise<Response> {
  const isNative = Capacitor.isNativePlatform();
  
  // Decide the order of base URLs to try
  const urlsToTry: string[] = [];
  if (isNative) {
    const primaryUrl = isProd ? PROD_URL : DEV_URL;
    const secondaryUrl = isProd ? DEV_URL : PROD_URL;
    urlsToTry.push(primaryUrl);
    urlsToTry.push(secondaryUrl);
  } else {
    // On web browser, we use the empty string (meaning relative paths to current origin)
    urlsToTry.push("");
  }

  let lastError: any = null;

  for (const baseUrl of urlsToTry) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const fullUrl = path.startsWith("http") ? path : `${baseUrl}${cleanPath}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[API_FETCH] Fetching: ${fullUrl} (Attempt ${attempt}/${retries})`);
        const response = await fetch(fullUrl, options);
        if (response.ok) {
          return response;
        }
        // If we got an error status (like 500, 502, 503, 504), it might be a cold start or transient error
        throw new Error(`HTTP status ${response.status}`);
      } catch (err: any) {
        lastError = err;
        console.warn(`[API_FETCH] Attempt ${attempt} failed for ${fullUrl}:`, err.message || err);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${path} after trying fallback URLs and retries.`);
}
