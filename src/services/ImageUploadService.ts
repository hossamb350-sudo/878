import { Capacitor } from "@capacitor/core";

export interface UploadResponse {
  url: string;
  thumbnail?: string;
  fileId?: string;
}

export class ImageUploadService {
  /**
   * Uploads a file with XMLHttpRequest, progress tracking, and retries.
   * Designed specifically to bypass Android WebView/Capacitor CORS issues.
   */
  static async uploadFile(
    file: File | Blob,
    fileName: string,
    onProgress?: (progress: number) => void,
    retries: number = 3
  ): Promise<UploadResponse> {
    const isNative = Capacitor.isNativePlatform();
    const API_BASE = isNative
      ? (import.meta.env.VITE_API_BASE_URL || "https://ais-pre-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app")
      : "";

    const uploadAttempt = (): Promise<UploadResponse> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        // Ensure it's treated as a Blob/File with the correct name
        formData.append("image", file, fileName);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/api/upload/imagekit`, true);
        
        // Accept JSON response
        xhr.setRequestHeader("Accept", "application/json");

        // Track progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        // Handle load
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.url) {
                resolve(res);
              } else {
                reject(new Error("Invalid response: Missing URL"));
              }
            } catch (err) {
              reject(new Error("Failed to parse server response"));
            }
          } else {
            reject(new Error(`Server error: ${xhr.status} - ${xhr.responseText}`));
          }
        };

        // Handle network errors
        xhr.onerror = () => {
          reject(new Error("Network Error - CORS or connection issue"));
        };

        xhr.onabort = () => {
          reject(new Error("Upload aborted"));
        };

        xhr.ontimeout = () => {
          reject(new Error("Upload timed out"));
        };

        // Send the FormData
        xhr.send(formData);
      });
    };

    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) {
          console.log(`[ImageUploadService] Retrying upload... Attempt ${i + 1}/${retries}`);
        }
        return await uploadAttempt();
      } catch (err: any) {
        lastError = err;
        console.warn(`[ImageUploadService] Upload failed on attempt ${i + 1}:`, err);
        
        // Don't wait on the last attempt
        if (i < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s...
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}
