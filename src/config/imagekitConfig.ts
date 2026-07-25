/**
 * Unified ImageKit Configuration for the platform.
 * Used across the Android APK, WebView, and Backend API to ensure matching credentials.
 */

export const IMAGEKIT_CONFIG = {
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/scwjupjlq",
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_Zs+0QoId6cKbJ6RaYcqq/A7KRcs=+WHkfzjg=",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_hEfX4huhE9HYYoIaUwm+WHkfzjg=",
};
