import React from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon, 
  BookOpen, 
  Share2, 
  Bookmark, 
  RotateCcw,
} from "lucide-react";

export type ReaderThemeMode = "light" | "dark" | "parchment";

interface LeaderReaderToolbarProps {
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  readerTheme: ReaderThemeMode;
  onThemeChange: (theme: ReaderThemeMode) => void;
  onCopyText: () => void;
  copied: boolean;
  onShare: () => void;
  isFavorited: boolean;
  onToggleBookmark: () => void;
  readingTime: string;
}

export const LeaderReaderToolbar: React.FC<LeaderReaderToolbarProps> = ({
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  readerTheme,
  onThemeChange,
  onCopyText,
  copied,
  onShare,
  isFavorited,
  onToggleBookmark,
  readingTime,
}) => {
  return (
    <div
      className="sticky top-14 z-30 w-full bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-200 shadow-soft p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 my-3 select-none"
      dir="rtl"
    >
      {/* 1. Font Size Controls */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-slate-200/80">
        <button
          onClick={onDecreaseFontSize}
          disabled={fontSize <= 14}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-40 transition-all font-bold cursor-pointer"
          title="تصغير الخط"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <span className="text-xs font-mono font-bold text-taiz-royal px-1.5 min-w-[32px] text-center">
          {fontSize}px
        </span>

        <button
          onClick={onIncreaseFontSize}
          disabled={fontSize >= 30}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-40 transition-all font-bold cursor-pointer"
          title="تكبير الخط"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {fontSize !== 18 && (
          <button
            onClick={onResetFontSize}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors mr-0.5 cursor-pointer"
            title="إعادة ضبط حجم الخط الافتراضي"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 2. Reading Theme Selector */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-slate-200/80 font-cairo">
        {/* Light Theme */}
        <button
          onClick={() => onThemeChange("light")}
          className={`px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            readerTheme === "light"
              ? "bg-white text-taiz-royal shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="وضع القراءة الفاتح"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">فاتح</span>
        </button>

        {/* Parchment Theme (Warm Ivory) */}
        <button
          onClick={() => onThemeChange("parchment")}
          className={`px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            readerTheme === "parchment"
              ? "bg-[#FBF0D9] text-[#4A3B2C] shadow-xs border border-[#E4D1B0]"
              : "text-slate-600 hover:text-[#B8860B]"
          }`}
          title="وضع الورق العاجي المريح للعين"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#B8860B]" />
          <span className="hidden sm:inline">عاجي</span>
        </button>

        {/* Royal Dark Theme */}
        <button
          onClick={() => onThemeChange("dark")}
          className={`px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            readerTheme === "dark"
              ? "bg-taiz-royal text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="وضع القراءة الليلي"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-300" />
          <span className="hidden sm:inline">ليلي</span>
        </button>
      </div>

      {/* 3. Action Buttons (Copy, Bookmark, Share) */}
      <div className="flex items-center gap-1.5">
        {/* Copy text */}
        <button
          onClick={onCopyText}
          className={`h-7 sm:h-8 px-2.5 rounded-lg sm:rounded-xl border flex items-center gap-1 text-xs font-bold font-cairo transition-all cursor-pointer ${
            copied
              ? "bg-emerald-500 text-white border-emerald-600"
              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
          }`}
          title="نسخ النص كاملاً"
        >
          <span>{copied ? "تم النسخ" : "نسخ"}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={onToggleBookmark}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            isFavorited
              ? "bg-taiz-sky text-white border-taiz-sky"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
          title="حفظ في المفضلة"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
          title="مشاركة"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
