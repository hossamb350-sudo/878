import { Capacitor } from "@capacitor/core";

export interface UploadResponse {
  url: string;
  thumbnail?: string;
  fileId?: string;
}

export class ImageUploadService {
  /**
   * Uploads a file with XMLHttpRequest, progress tracking, and retries.
   * Designed specifically to bypass Android WebView/Capacitor CORS and FormData issues
   * by converting the file to Base64 first.
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

    // 1. Read file as Base64 to avoid Android WebView FormData empty file bug
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error("فشل في قراءة الملف"));
      };
      reader.readAsDataURL(file);
    });

    const payload = JSON.stringify({
      imageBase64: base64Data,
      fileName: fileName
    });

    const uploadAttempt = (): Promise<UploadResponse> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/api/upload/imagekit`, true);
        
        // Accept JSON response and set Content-Type to JSON
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        // Track progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        // Handle load
        xhr.onload = () => {
          const diagnostics = {
            event: "onload",
            status: xhr.status,
            statusText: xhr.statusText,
            responseType: xhr.responseType,
            responseText: xhr.responseText ? xhr.responseText.substring(0, 200) : null
          };
          console.log("[Diagnostic Interceptor] XHR Response:", JSON.stringify(diagnostics));

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.url) {
                resolve(res);
              } else {
                reject(new Error(`Invalid response (Missing URL). Status: ${xhr.status}, Body: ${xhr.responseText}`));
              }
            } catch (err) {
              reject(new Error(`Failed to parse server response. Status: ${xhr.status}, Body: ${xhr.responseText}`));
            }
          } else {
            reject(new Error(`Server Error ${xhr.status}: ${xhr.responseText}`));
          }
        };

        // Handle network errors
        xhr.onerror = () => {
          console.error("[Diagnostic Interceptor] XHR Network Error (CORS, DNS, or Offline). Status:", xhr.status, "ReadyState:", xhr.readyState);
          reject(new Error(`Network Error (status: ${xhr.status}, readyState: ${xhr.readyState}) - Possible CORS issue or server unreachable`));
        };

        xhr.onabort = () => {
          console.warn("[Diagnostic Interceptor] XHR Aborted");
          reject(new Error("Upload aborted"));
        };

        xhr.ontimeout = () => {
          console.error("[Diagnostic Interceptor] XHR Timeout");
          reject(new Error("Upload timed out"));
        };

        // Send the JSON payload
        try {
          xhr.send(payload);
        } catch (e: any) {
          console.error("[Diagnostic Interceptor] XHR Send Error:", e);
          reject(new Error(`XHR Send Exception: ${e.message}`));
        }
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
