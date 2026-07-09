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
    file: File | Blob,
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

    // Convert file to Base64 to bypass any binary or multipart/form-data CORS issues on Android WebView
    const fileToBase64 = async (f: File | Blob): Promise<string> => {
      try {
        console.log("[ImageUploadService] Converting file via modern arrayBuffer...");
        const buffer = await f.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const chunks: string[] = [];
        const chunkSize = 0xffff; // 64k chunks
        for (let i = 0; i < bytes.length; i += chunkSize) {
          chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any));
        }
        const base64 = btoa(chunks.join(""));
        return `data:${f.type || "image/jpeg"};base64,${base64}`;
      } catch (arrayBufferErr: any) {
        console.warn("[ImageUploadService] arrayBuffer conversion failed, trying FileReader fallback:", arrayBufferErr);
        
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("محتوى الملف المقروء غير صالح (ليس سلسلة نصية)"));
            }
          };
          reader.onerror = () => {
            const domErr = reader.error;
            const detailMsg = domErr 
              ? `${domErr.name}: ${domErr.message}` 
              : "فشل غير معروف أثناء استخدام FileReader";
            console.error("[ImageUploadService] FileReader onerror triggered:", domErr);
            reject(new Error(detailMsg));
          };
          reader.readAsDataURL(f);
        });
      }
    };

    let base64Data: string;
    try {
      base64Data = await fileToBase64(file);
    } catch (err: any) {
      console.error("[ImageUploadService] fileToBase64 conversion exception:", err);
      throw new Error(`فشل في معالجة ملف الصورة: ${err.message || err}`);
    }

    // Helper to fetch authorization parameters from our backend (securing the private key on the server)
    const fetchAuthParameters = async (): Promise<{ token: string; signature: string; expire: number }> => {
      const authUrl = `${API_BASE}/api/imagekit/auth`;
      console.log(`[ImageUploadService] Fetching secure auth parameters from ${authUrl}`);
      
      if (isNative) {
        const response = await CapacitorHttp.get({
          url: authUrl,
          headers: { "Accept": "application/json" }
        });
        if (response.status >= 200 && response.status < 300 && response.data) {
          return response.data;
        }
        throw new Error(`فشل الحصول على تصريح الرفع من الخادم: كود ${response.status}`);
      } else {
        const response = await fetch(authUrl, {
          headers: { "Accept": "application/json" }
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error(`فشل الحصول على تصريح الرفع من الخادم: كود ${response.status}`);
      }
    };

    // 1. Native Upload Implementation (Bypasses WebView Sandbox and CORS)
    if (isNative) {
      const uploadAttemptNative = async (): Promise<UploadResponse> => {
        try {
          const authParams = await fetchAuthParameters();
          console.log("[ImageUploadService] Starting direct ImageKit upload on mobile...");

          const response = await CapacitorHttp.post({
            url: "https://upload.imagekit.io/api/v1/files/upload",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            data: {
              file: base64Data,
              fileName: fileName,
              publicKey: IMAGEKIT_CONFIG.publicKey,
              signature: authParams.signature,
              expire: authParams.expire,
              token: authParams.token,
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
          throw new Error(`فشل الرفع من ImageKit: كود ${response.status}`);
        } catch (err: any) {
          console.error("[ImageUploadService] Native direct upload failed:", err);
          throw new Error(err.message || "فشلت عملية الرفع من خلال تطبيق أندرويد");
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

    // 2. Web Upload Implementation (Direct Client-Side with Secure Signature fallback)
    const uploadAttempt = async (): Promise<UploadResponse> => {
      try {
        const authParams = await fetchAuthParameters();
        console.log("[ImageUploadService] Starting direct ImageKit upload on web...");

        return new Promise<UploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload", true);
          xhr.setRequestHeader("Content-Type", "application/json");
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
                if (res.url) {
                  resolve({
                    url: res.url,
                    thumbnail: res.thumbnailUrl || res.url,
                    fileId: res.fileId
                  });
                } else {
                  reject(new Error("استجابة غير صالحة من ImageKit (رابط الصورة مفقود)."));
                }
              } catch (err) {
                reject(new Error("فشل في تحليل استجابة ImageKit."));
              }
            } else {
              reject(new Error(`خطأ من ImageKit: ${xhr.status} - ${xhr.responseText}`));
            }
          };

          xhr.onerror = () => reject(new Error("حدث خطأ في الاتصال بـ ImageKit."));
          xhr.onabort = () => reject(new Error("تم إلغاء الرفع."));
          xhr.ontimeout = () => reject(new Error("انتهت مهلة الرفع."));

          xhr.send(JSON.stringify({
            file: base64Data,
            fileName: fileName,
            publicKey: IMAGEKIT_CONFIG.publicKey,
            signature: authParams.signature,
            expire: authParams.expire,
            token: authParams.token,
            folder: "/uploads"
          }));
        });
      } catch (err: any) {
        console.error("[ImageUploadService] Web upload failed:", err);
        throw err;
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
