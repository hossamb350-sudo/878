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
      ? (import.meta.env.VITE_API_BASE_URL || "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app")
      : "";

    // Primary method: XMLHttpRequest (allows progress tracking)
    const uploadWithXHR = (): Promise<UploadResponse> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("image", file, fileName);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/api/upload/imagekit`, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.url) resolve(res);
              else reject(new Error(`Invalid response (Missing URL). Status: ${xhr.status}`));
            } catch (err) {
              reject(new Error(`Failed to parse response. Status: ${xhr.status}`));
            }
          } else {
            reject(new Error(`Server Error ${xhr.status}: ${xhr.responseText || "Unknown error"}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error(`Network Error (status: ${xhr.status}, readyState: ${xhr.readyState})`));
        };

        xhr.onabort = () => reject(new Error("Upload aborted"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));

        try {
          xhr.send(formData);
        } catch (e: any) {
          reject(e);
        }
      });
    };

    // Fallback method: fetch (highly robust, fully routed by CapacitorHttp native bridge bypassing CORS)
    const uploadWithFetch = async (): Promise<UploadResponse> => {
      console.log("[ImageUploadService] Falling back to fetch upload...");
      const formData = new FormData();
      formData.append("image", file, fileName);

      if (onProgress) onProgress(15);

      const response = await fetch(`${API_BASE}/api/upload/imagekit`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: formData,
      });

      if (onProgress) onProgress(75);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error ${response.status}: ${text || "Unknown error"}`);
      }

      const res = await response.json();
      if (!res.url) {
        throw new Error("Invalid response from server (Missing URL).");
      }

      if (onProgress) onProgress(100);
      return res;
    };

    const uploadAttempt = async (): Promise<UploadResponse> => {
      try {
        return await uploadWithXHR();
      } catch (xhrError: any) {
        // If the error is a status 0 / network error, fall back to native-friendly fetch
        const isNetworkError = xhrError.message?.includes("Network Error") || xhrError.message?.includes("status: 0");
        if (isNetworkError) {
          console.warn("[ImageUploadService] XHR upload returned status 0. Attempting fallback via native fetch:", xhrError.message);
          try {
            return await uploadWithFetch();
          } catch (fetchError: any) {
            throw new Error(`Upload failed on both XHR and Fetch fallback. XHR: ${xhrError.message}, Fetch: ${fetchError.message}`);
          }
        }
        throw xhrError;
      }
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
        
        if (i < retries - 1) {
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}
