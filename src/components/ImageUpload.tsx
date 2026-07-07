import React, { useRef, useState } from "react";
import { Upload, X, RefreshCw, AlertCircle, Image as ImageIcon } from "lucide-react";

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
        const url = await new Promise<string>((resolve, reject) => {
          const formData = new FormData();
          formData.append("image", file);

          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload/imagekit", true);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadingFiles(prev => {
                const next = [...prev];
                if (next[i]) next[i].progress = percent;
                return next;
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const res = JSON.parse(xhr.responseText);
              resolve(res.url);
            } else {
              reject(new Error(`Failed to upload ${file.name}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });

        uploadedUrls.push(url);
      } catch (err) {
        console.error(err);
        setError(`فشل رفع بعض الملفات`);
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

    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/imagekit", true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setProgress(null);
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.url && onChange) {
            onChange(res.url);
          } else {
            setError("لم يتم استلام رابط الصورة بشكل صحيح");
          }
        } catch (err) {
          setError("خطأ في معالجة استجابة الخادم");
        }
      } else {
        setError(`فشل الرفع: كود الخطأ ${xhr.status}`);
      }
    };

    xhr.onerror = () => {
      setProgress(null);
      setError("حدث خطأ في الشبكة أثناء رفع الصورة");
    };

    xhr.send(formData);
  };

  const triggerSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    </div>
  );
}

// Simple placeholder constant to prevent import failures
const LOGO_SRC = "/logo.png";
