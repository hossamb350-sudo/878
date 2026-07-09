import { Capacitor } from "@capacitor/core";

export interface UploadResponse {
  url: string;
  thumbnail?: string;
  fileId?: string;
}

export class ImageUploadService {
  /**
   * Converts a File or Blob into a Base64 string.
   */
  private static fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error("[ImageUploadService] FileReader error:", error);
        reject(new Error("فشل في قراءة ملف الصورة"));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Uploads a file with progress tracking, adaptive fallback, and multi-strategy support.
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

    console.log(`[ImageUploadService] Starting upload. File: ${fileName}, Size: ${file.size} bytes, Native Platform: ${isNative}`);

    // Strategy 1: Base64 JSON Upload (Highly robust, completely immune to multipart/FormData Capacitor WebView bugs)
    const uploadWithBase64 = async (): Promise<UploadResponse> => {
      console.log("[ImageUploadService] Executing Strategy: Base64 JSON Upload...");
      if (onProgress) onProgress(10);

      console.log("[ImageUploadService] Converting file to Base64...");
      const base64Data = await this.fileToBase64(file);
      console.log(`[ImageUploadService] File converted successfully. Base64 length: ${base64Data.length}`);
      
      if (onProgress) onProgress(40);

      console.log(`[ImageUploadService] Sending POST request to: ${API_BASE}/api/upload/imagekit`);
      const response = await fetch(`${API_BASE}/api/upload/imagekit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          fileName: fileName,
        }),
      });

      if (onProgress) onProgress(80);

      console.log(`[ImageUploadService] Received response status: ${response.status}`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error ${response.status}: ${errText || "Unknown error"}`);
      }

      const res = await response.json();
      console.log("[ImageUploadService] Response JSON parsed:", JSON.stringify(res));

      if (res.url) {
        if (onProgress) onProgress(100);
        return res;
      } else {
        throw new Error("Invalid server response: Missing image URL");
      }
    };

    // Strategy 2: XMLHttpRequest FormData Upload (Allows real-time progress)
    const uploadWithXHR = (): Promise<UploadResponse> => {
      return new Promise((resolve, reject) => {
        console.log("[ImageUploadService] Executing Strategy: XMLHttpRequest FormData Upload...");
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
          console.log(`[ImageUploadService] XHR response status: ${xhr.status}`);
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

    const uploadAttempt = async (): Promise<UploadResponse> => {
      if (isNative) {
        // Native (APK) -> Prefer Base64 upload to bypass all WebView FormData native serialization bugs
        try {
          return await uploadWithBase64();
        } catch (err: any) {
          console.warn("[ImageUploadService] Native Base64 upload failed. Trying FormData fallback...", err.message);
          return await uploadWithXHR();
        }
      } else {
        // Web -> Prefer standard XHR (binary stream, supports progress, more lightweight)
        try {
          return await uploadWithXHR();
        } catch (err: any) {
          console.warn("[ImageUploadService] Web XHR upload failed. Trying Base64 fallback...", err.message);
          return await uploadWithBase64();
        }
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
