import React, { useRef, useState } from "react";
import { Upload, X, RefreshCw, AlertCircle, Image as ImageIcon, ShieldCheck, Settings, Camera as CameraIcon } from "lucide-react";
import { ImageUploadService } from "../services/ImageUploadService";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

interface ImageUploadProps {
  key?: React.Key;
  value?: string;
  onChange?: (url: string) => void;
  onUploadsComplete?: (urls: string[]) => void;
  onRemove?: () => void;
  label: string;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUploadsComplete,
  onRemove,
  label,
  placeholder = "اسحب وأفلت الصورة هنا أو انقر للاختيار",
  className = "",
  multiple = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Custom permission and source selection states
  const [showPermissionExplanation, setShowPermissionExplanation] = useState(false);
  const [showSettingsExplanation, setShowSettingsExplanation] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        uploadFiles(Array.from(files));
      } else {
        uploadFile(files[0]);
      }
    }
  };

  const uploadFiles = async (files: File[]) => {
    setError(null);
    const uploadedUrls: string[] = [];
    
    // Initialize tracking for multiple files
    setUploadingFiles(files.map(f => ({ name: f.name, progress: 0 })));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Basic validation
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      try {
        const res = await ImageUploadService.uploadFile(
          file,
          file.name,
          (percent) => {
            setUploadingFiles(prev => {
              const next = [...prev];
              if (next[i]) next[i].progress = percent;
              return next;
            });
          }
        );
        
        if (res.url) {
          uploadedUrls.push(res.url);
          setUploadingFiles(prev => {
            const next = [...prev];
            if (next[i]) next[i].progress = 100;
            return next;
          });
        }
      } catch (err: any) {
        console.error("Upload failed:", err);
        setError(`خطأ أثناء رفع الصور: ${err.message || "فشل الاتصال بالشبكة"}`);
      }
    }

    setUploadingFiles([]);
    if (uploadedUrls.length > 0 && onUploadsComplete) {
      onUploadsComplete(uploadedUrls);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = (file: File) => {
    // Basic type validation
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG, WEBP)");
      return;
    }

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة كبير جداً، الحد الأقصى المسموح به هو 10 ميجابايت");
      return;
    }

    setError(null);
    setProgress(0);

    ImageUploadService.uploadFile(
      file,
      file.name,
      (percent) => {
        setProgress(percent);
      }
    )
      .then((res) => {
        setProgress(100);
        setTimeout(() => setProgress(null), 500); // Clear progress after a short delay
        
        if (res.url && onChange) {
          onChange(res.url);
        } else {
          setError("لم يتم استلام رابط الصورة بشكل صحيح");
        }
      })
      .catch((err) => {
        console.error("Upload error:", err);
        setProgress(null);
        setError(`خطأ أثناء رفع الصورة: ${err.message || "فشل الاتصال بالشبكة"}`);
      });
  };

  const requestNativePermissions = async () => {
    setShowPermissionExplanation(false);
    try {
      console.log("[ImageUpload] Requesting camera/photo permissions...");
      const requestResult = await Camera.requestPermissions({ permissions: ["photos", "camera"] });
      console.log("[ImageUpload] Permission request result:", requestResult);
      
      if (requestResult.photos === "granted" || requestResult.camera === "granted") {
        setShowSourceSelector(true);
      } else {
        setShowSettingsExplanation(true);
      }
    } catch (err) {
      console.error("[ImageUpload] Error requesting permissions:", err);
      setError("فشل في طلب الصلاحيات اللازمة للوصول إلى الصور.");
    }
  };

  const triggerNativePick = async (source: CameraSource) => {
    setShowSourceSelector(false);
    try {
      setError(null);
      if (multiple && source === CameraSource.Photos) {
        const result = await Camera.pickImages({
          quality: 90,
          limit: 10
        });
        
        if (result.photos && result.photos.length > 0) {
          const filesToUpload: File[] = [];
          for (const photo of result.photos) {
            if (photo.webPath) {
              const res = await fetch(photo.webPath);
              const blob = await res.blob();
              const fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${photo.format || 'jpg'}`;
              const file = new File([blob], fileName, { type: blob.type });
              filesToUpload.push(file);
            }
          }
          if (filesToUpload.length > 0) {
            await uploadFiles(filesToUpload);
          }
        }
      } else {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: source
        });
        
        if (photo.webPath) {
          setProgress(0);
          const res = await fetch(photo.webPath);
          const blob = await res.blob();
          const fileName = `image_${Date.now()}.${photo.format || 'jpg'}`;
          const file = new File([blob], fileName, { type: blob.type });
          uploadFile(file);
        }
      }
    } catch (err: any) {
      console.error("[ImageUpload] Native pick error:", err);
      if (err?.message?.includes("canceled") || err?.message?.includes("cancelled") || err === "User cancelled photos app") {
        return;
      }
      setError(`خطأ أثناء اختيار الصورة: ${err.message || err}`);
    }
  };

  const triggerSelect = async () => {
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      try {
        const permissionStatus = await Camera.checkPermissions();
        console.log("[ImageUpload] Checked permissions status:", permissionStatus);
        
        if (permissionStatus.photos === "granted" || permissionStatus.camera === "granted") {
          setShowSourceSelector(true);
        } else if (permissionStatus.photos === "denied" || permissionStatus.camera === "denied") {
          setShowSettingsExplanation(true);
        } else {
          // Status is 'prompt' or 'prompt-with-rationale'
          setShowPermissionExplanation(true);
        }
      } catch (err) {
        console.error("[ImageUpload] Error checking native permissions:", err);
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) onChange("");
    if (onRemove) onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (multiple) {
        uploadFiles(Array.from(files));
      } else {
        uploadFile(files[0]);
      }
    }
  };

  return (
    <div className={`space-y-2 font-cairo ${className}`} style={{ direction: "rtl" }}>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple={multiple}
        className="hidden"
      />

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-2.5 rounded-lg text-xs font-bold animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MANUAL URL INPUT */}
      {!multiple && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="أو ضع رابط الصورة هنا مباشرة..."
            className="flex-1 p-3 text-xs font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white"
            value={value || ""}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
        </div>
      )}

      {/* UPLOAD PANEL */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(progress === null && uploadingFiles.length === 0) ? (multiple ? triggerSelect : (value ? undefined : triggerSelect)) : undefined}
        className={`relative min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
          (value && !multiple) ? "border-solid border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30" : "cursor-pointer"
        } ${
          isDragOver
            ? "border-red-500 bg-red-500/5 dark:bg-red-500/10 scale-[1.01]"
            : (value && !multiple)
            ? "border-gray-200 dark:border-gray-700"
            : "border-gray-300 dark:border-gray-700 hover:border-red-500 hover:bg-gray-50 dark:hover:bg-gray-900/40"
        }`}
      >
        {/* MULTIPLE UPLOADS STATE */}
        {uploadingFiles.length > 0 && (
          <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-sm text-center">
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
            <div className="w-full space-y-3">
              <span className="text-xs font-black text-gray-500">جاري رفع {uploadingFiles.length} صور...</span>
              {uploadingFiles.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span className="truncate max-w-[150px]">{f.name}</span>
                    <span>{f.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-150 rounded-full"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(progress !== null && uploadingFiles.length === 0) ? (
          /* SINGLE UPLOADING STATE */
          <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-xs text-center">
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>جاري رفع الصورة...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (value && !multiple) ? (
          /* IMAGE PREVIEW STATE (SINGLE) */
          <div className="relative w-full flex flex-col md:flex-row items-center gap-4">
            {/* Thumbnail preview */}
            <div className="relative w-32 h-32 md:w-40 md:h-28 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0 bg-gray-100 dark:bg-gray-950 flex items-center justify-center shadow-inner group">
              <img
                src={value}
                alt="معاينة الصورة"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = LOGO_SRC;
                }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center md:items-start space-y-2.5 w-full">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold truncate max-w-[200px] md:max-w-xs">
                  {value.split("/").pop() || "تم رفع الصورة بنجاح"}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Replace Button */}
                <button
                  type="button"
                  onClick={triggerSelect}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>استبدال الصورة</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-4 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm border border-red-200/20 dark:border-red-900/20"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY STATE OR MULTIPLE STATE */
          <div className="flex flex-col items-center justify-center space-y-3.5 text-center p-2">
            <div className="w-12 h-12 rounded-full bg-red-500/5 dark:bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm border border-red-500/10">
              <Upload className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                {placeholder}
              </span>
              <span className="block text-xs text-gray-400 font-medium">
                {multiple ? "يمكنك اختيار صور متعددة دفعة واحدة" : "يدعم صيغ PNG, JPG, JPEG, WEBP حتى 10 ميجابايت"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PERMISSION EXPLANATION MODAL */}
      {showPermissionExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200" style={{ direction: "rtl" }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-4 transform transition-all duration-300 scale-100">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500 shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-gray-900 dark:text-white">إذن الوصول إلى الصور والكاميرا</h3>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                يحتاج التطبيق إلى صلاحية الوصول إلى مكتبة الصور أو كاميرا الهاتف لتتمكن من اختيار ورفع صورة الواجبات، التسميع، أو المستندات إلى المعلم والحلقات بشكل صحيح.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={requestNativePermissions}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-xs py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-red-500/10 cursor-pointer"
              >
                موافق، السماح بالوصول
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionExplanation(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS EXPLANATION MODAL */}
      {showSettingsExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200" style={{ direction: "rtl" }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 shadow-sm">
              <Settings className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-gray-900 dark:text-white">تفعيل الصلاحيات من الإعدادات</h3>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                تم رفض صلاحية الوصول سابقاً. لتتمكن من رفع الصور، يرجى تفعيل الصلاحية يدوياً باتباع الخطوات التالية:
              </p>
              <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl text-right text-[11px] font-bold text-gray-600 dark:text-gray-300 space-y-1.5 border border-gray-100 dark:border-gray-800">
                <p>1. افتح <span className="text-red-500">إعدادات الهاتف</span>.</p>
                <p>2. اذهب إلى <span className="text-red-500">التطبيقات</span> ثم ابحث عن هذا التطبيق.</p>
                <p>3. اختر <span className="text-red-500">الأذونات (Permissions)</span>.</p>
                <p>4. قم بالسماح بالوصول إلى <span className="text-red-500">الصور والوسائط والكاميرا</span>.</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsExplanation(false)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black text-xs py-3 px-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOURCE SELECTOR MODAL */}
      {showSourceSelector && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200" style={{ direction: "rtl" }}>
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-black text-gray-800 dark:text-white">اختر مصدر الصورة</span>
              <button
                type="button"
                onClick={() => setShowSourceSelector(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 py-2">
              <button
                type="button"
                onClick={() => triggerNativePick(CameraSource.Photos)}
                className="flex flex-col items-center justify-center gap-2.5 p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-8 h-8 text-blue-500" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-300">معرض الصور</span>
              </button>
              
              <button
                type="button"
                onClick={() => triggerNativePick(CameraSource.Camera)}
                className="flex flex-col items-center justify-center gap-2.5 p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <CameraIcon className="w-8 h-8 text-emerald-500" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-300">كاميرا الهاتف</span>
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setShowSourceSelector(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple placeholder constant to prevent import failures
const LOGO_SRC = "/logo.png";
