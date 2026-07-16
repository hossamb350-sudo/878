import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { IMAGEKIT_CONFIG } from "../config/imagekitConfig";

export interface UploadResponse {
  url: string;
  thumbnail?: string;
  fileId?: string;
}

export class ImageUploadService {
  /**
   * Uploads a file with progress tracking and retries.
   * Uses native CapacitorHttp on mobile to completely bypass WebView CORS restrictions,
   * and falls back to robust XMLHttpRequest on web.
   */
  static async uploadFile(
    file: File | Blob | string,
    fileName: string,
    onProgress?: (progress: number) => void,
    retries: number = 3
  ): Promise<UploadResponse> {
    const isNative = Capacitor.isNativePlatform();
    const isProd = import.meta.env.PROD;
    const DEV_URL = "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
    const PROD_URL = "https://ais-pre-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
    const API_BASE = isNative
      ? (import.meta.env.VITE_API_BASE_URL || (isProd ? PROD_URL : DEV_URL))
      : "";

    const fileToBase64 = async (f: File | Blob, retries = 2): Promise<string> => {
      const readWithFileReader = (file: File | Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("محتوى الملف المقروء غير صالح"));
            }
          };
          reader.onerror = () => {
            const domErr = reader.error;
            const detailMsg = domErr 
              ? `${domErr.name}: ${domErr.message}` 
              : "فشل في قراءة ملف الصورة (NotReadableError). يرجى محاولة اختيار الصورة مرة أخرى.";
            console.error("[ImageUploadService] FileReader error:", domErr);
            reject(new Error(detailMsg));
          };
          reader.readAsDataURL(file);
        });
      };

      // Try arrayBuffer if available (modern browsers, more robust)
      try {
        if (typeof f.arrayBuffer === 'function') {
          const buffer = await f.arrayBuffer();
          // Still use FileReader to convert to DataURL because it's efficient for large files
          // and usually works fine with an in-memory buffer
          const blob = new Blob([buffer], { type: f.type });
          return await readWithFileReader(blob);
        }
      } catch (e) {
        console.warn("[ImageUploadService] arrayBuffer read failed, trying standard FileReader", e);
      }

      // Standard fallback with retry
      let lastErr: any;
      for (let i = 0; i < retries; i++) {
        try {
          return await readWithFileReader(f);
        } catch (err) {
          lastErr = err;
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 200 * (i + 1)));
          }
        }
      }
      throw lastErr;
    };

    let base64Data: string;
    if (typeof file === "string") {
      if (file.startsWith("http://") || file.startsWith("https://")) {
        // If it's already an online URL, return it directly
        return {
          url: file,
          thumbnail: file,
          fileId: ""
        };
      }
      // It's a base64 string
      base64Data = file.startsWith("data:") ? file : `data:image/jpeg;base64,${file}`;
    } else {
      try {
        base64Data = await fileToBase64(file as File | Blob);
      } catch (err: any) {
        console.error("[ImageUploadService] fileToBase64 conversion exception:", err);
        throw new Error(`فشل في معالجة ملف الصورة: ${err.message || err}`);
      }
    }

    // 1. Native Upload Implementation (Bypasses WebView Sandbox and CORS)
    if (isNative) {
      const uploadAttemptNative = async (): Promise<UploadResponse> => {
        // Try direct upload first as it is the most robust and bypasses any backend routing/404 issues
        try {
          console.log("[ImageUploadService] Attempting direct upload to ImageKit API...");
          
          // Generate Basic Auth token using private key from unified configuration
          const authCredentials = btoa(`${IMAGEKIT_CONFIG.privateKey}:`);
          
          const response = await CapacitorHttp.post({
            url: "https://upload.imagekit.io/api/v1/files/upload",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${authCredentials}`,
              "Accept": "application/json"
            },
            data: {
              file: base64Data,
              fileName: fileName,
              folder: "/uploads"
            }
          });

          console.log("[ImageUploadService] ImageKit direct API response status:", response.status);

          if (response.status >= 200 && response.status < 300) {
            const data = response.data;
            if (data && data.url) {
              console.log("[ImageUploadService] Direct ImageKit upload succeeded:", data.url);
              return {
                url: data.url,
                thumbnail: data.thumbnailUrl || data.url,
                fileId: data.fileId
              };
            }
          }
          
          console.warn("[ImageUploadService] Direct upload returned unsuccessful status, trying backend fallback...", response.status);
        } catch (directErr) {
          console.error("[ImageUploadService] Direct ImageKit upload failed, trying backend fallback...", directErr);
        }

        // Fallback to Backend proxy if direct upload failed
        try {
          console.log(`[ImageUploadService] Attempting backend fallback upload to ${API_BASE}/api/upload/imagekit`);
          
          const response = await CapacitorHttp.post({
            url: `${API_BASE}/api/upload/imagekit`,
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            data: {
              imageBase64: base64Data,
              fileName: fileName
            }
          });

          console.log("[ImageUploadService] Backend fallback response status:", response.status);

          if (response.status >= 200 && response.status < 300) {
            const data = response.data;
            if (data && data.url) {
              return {
                url: data.url,
                thumbnail: data.thumbnail || data.url,
                fileId: data.fileId
              };
            } else {
              throw new Error(`استجابة غير صالحة من الخادم (رابط الصورة مفقود).`);
            }
          } else {
            const errorMsg = response.data?.message || response.data?.error || `كود الخطأ: ${response.status}`;
            throw new Error(`فشل الرفع من الخادم: ${errorMsg}`);
          }
        } catch (backendErr: any) {
          console.error("[ImageUploadService] Backend fallback upload failed:", backendErr);
          throw new Error(backendErr.message || "فشلت عملية الرفع من خلال تطبيق أندرويد");
        }
      };

      let lastError: any;
      for (let i = 0; i < retries; i++) {
        try {
          if (i > 0) {
            console.log(`[ImageUploadService] Retrying native upload... Attempt ${i + 1}/${retries}`);
          }
          if (onProgress) onProgress(20 + i * 20); // Simulate progress for better UX on retry
          const res = await uploadAttemptNative();
          if (onProgress) onProgress(100);
          return res;
        } catch (err) {
          lastError = err;
          console.warn(`[ImageUploadService] Native upload failed on attempt ${i + 1}:`, err);
          if (i < retries - 1) {
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
          }
        }
      }
      throw lastError || new Error("فشلت عملية الرفع من خلال التطبيق");
    }

    // 2. Web Upload Implementation (Uses standard XMLHttpRequest)
    const uploadAttempt = (): Promise<UploadResponse> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/api/upload/imagekit`, true);
        
        // Use JSON content type to ensure standard, robust headers
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        // Track progress (since payload is sent as JSON body, modern browsers still emit upload progress)
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
          xhr.send(JSON.stringify({
            imageBase64: base64Data,
            fileName: fileName
          }));
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
