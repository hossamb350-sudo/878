/**
 * Unified ImageKit Configuration for the platform.
 * Used across the Android APK, WebView, and Backend API to ensure matching credentials.
 */

const getEnv = (key: string, fallback: string) => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return fallback;
};

export const IMAGEKIT_CONFIG = {
  urlEndpoint: getEnv("IMAGEKIT_URL_ENDPOINT", "https://ik.imagekit.io/scwjupjlq"),
  publicKey: getEnv("IMAGEKIT_PUBLIC_KEY", "public_Zs+0QoId6cKbJ6RaYcqq/A7KRcs=+WHkfzjg="),
  privateKey: getEnv("IMAGEKIT_PRIVATE_KEY", "private_hEfX4huhE9HYYoIaUwm+WHkfzjg="),
};
