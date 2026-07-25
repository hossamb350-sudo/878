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

    // Unified Direct Upload to ImageKit
    const uploadAttempt = async (): Promise<UploadResponse> => {
      try {
        console.log(`[ImageUploadService] Attempting direct upload to ImageKit...`);
        
        if (!IMAGEKIT_CONFIG.privateKey) {
          throw new Error("مفتاح ImageKit الخاص غير متوفر في التطبيق");
        }
        
        const authCredentials = btoa(`${IMAGEKIT_CONFIG.privateKey}:`);
        
        if (onProgress) {
          onProgress(30);
        }

        if (isNative) {
          // Native Capacitor HTTP bypasses CORS and Webview fetch issues
          const response = await CapacitorHttp.post({
            url: "https://upload.imagekit.io/api/v1/files/upload",
            headers: {
              "Authorization": `Basic ${authCredentials}`,
              "Content-Type": "application/json"
            },
            data: {
              file: base64Data,
              fileName: fileName,
              useUniqueFileName: true,
              folder: "/uploads"
            }
          });

          console.log(`[ImageUploadService] ImageKit Native response status:`, response.status);

          if (response.status >= 200 && response.status < 300) {
            const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
            if (onProgress) onProgress(100);
            if (data && data.url) {
              return {
                url: data.url,
                thumbnail: data.thumbnailUrl || data.url,
                fileId: data.fileId
              };
            }
          }
          
          throw new Error(`خطأ من ImageKit: ${response.status} ${JSON.stringify(response.data)}`);
        } else {
          // Web Fetch
          const formData = new FormData();
          formData.append("file", base64Data);
          formData.append("fileName", fileName);
          formData.append("useUniqueFileName", "true");
          formData.append("folder", "/uploads");

          const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authCredentials}`
            },
            body: formData
          });

          console.log(`[ImageUploadService] ImageKit Web response status:`, response.status);

          if (response.ok) {
            const data = await response.json();
            if (onProgress) onProgress(100);
            if (data && data.url) {
              return {
                url: data.url,
                thumbnail: data.thumbnailUrl || data.url,
                fileId: data.fileId
              };
            }
          }
          
          const errorText = await response.text();
          throw new Error(`خطأ من ImageKit: ${response.status} ${errorText}`);
        }
      } catch (err: any) {
        console.warn(`[ImageUploadService] Failed connecting to ImageKit:`, err);
        throw new Error(err.message || "فشل الاتصال بخادم الصور");
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
