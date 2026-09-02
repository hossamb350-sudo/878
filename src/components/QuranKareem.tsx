import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ChevronRight, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  BookOpen, 
  Volume2, 
  Loader2, 
  AlertCircle,
  BookOpenCheck,
  Bookmark,
  Calendar,
  Clock,
  Trash2,
  History,
  BookMarked,
  Sliders,
  Maximize,
  Minimize2,
  Check,
  Repeat
} from "lucide-react";
import { SURAHS_METADATA, SurahMetadata } from "../data/surahData";
import { useQuranAudio } from "../context/QuranAudioContext";

interface Ayah {
  number: number;
  audio: string;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Ayah[];
}

interface QuranProgressData {
  startedSurahs: { [number: number]: { lastIndex: number; total: number; timestamp: number } };
  completedSurahs: number[]; // surah numbers
  bookmarks: { surahNumber: number; surahName: string; ayahIndex: number; verseText: string; timestamp: number }[];
  totalAyahsListenedCount: number;
}

const themeClasses = {
  day: "bg-white text-slate-950 border-slate-200",
  night: "bg-[#070F1E] text-slate-100 border-[#1E355B]",
  sepia: "bg-[#FAF4E8] text-[#7C2D12] border-[#E8DCC4]",
};

const fontSizeClasses = {
  sm: "text-lg sm:text-xl",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-3xl sm:text-4xl",
};

const lineHeightClasses = {
  compact: "leading-[2.0]",
  relaxed: "leading-[2.6]",
  loose: "leading-[3.2]",
};

export function QuranKareem() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    selectedSurah,
    setSelectedSurah,
    surahDetail,
    setSurahDetail,
    loading,
    error,
    isPlaying,
    setIsPlaying,
    currentAyahIndex,
    setCurrentAyahIndex,
    resumeAyahIndex,
    setResumeAyahIndex,
    showSettings,
    setShowSettings,
    readerTheme,
    setReaderTheme,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    fontMedium,
    setFontMedium,
    focusMode,
    setFocusMode,
    autoPlayNext,
    setAutoPlayNext,
    togglePlay,
    playNext,
    playPrevious,
    playNextSurah,
    selectVerseDirectly,
    toggleBookmarkCurrentVerse,
    isCurrentVerseBookmarked,
    closePlayer,
    qProgress,
    setQProgress,
    toArabicNumerals,
    getRevelationArabic,
    shouldShowBasmalah
  } = useQuranAudio();

  // Full screen support for focusMode in QuranKareem matching QuranReader
  useEffect(() => {
    if (focusMode) {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        }
      } catch (err) {
        console.warn("Could not request full screen:", err);
      }
    } else {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        }
      } catch (err) {
        console.warn("Could not exit full screen:", err);
      }
    }
  }, [focusMode]);

  const verseRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Filter Surahs based on search query
  const filteredSurahs = SURAHS_METADATA.filter(
    (surah) =>
      surah.name.includes(searchQuery) ||
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery
  );

  // Tabs for the main view
  const [quranTab, setQuranTab] = useState<"surahs" | "progress">("surahs");
  const [progressSubTab, setProgressSubTab] = useState<"history" | "bookmarks">("history");

  // Scroll active verse into view
  useEffect(() => {
    if (surahDetail && currentAyahIndex >= 0 && verseRefs.current[currentAyahIndex]) {
      const scrollTimer = setTimeout(() => {
        verseRefs.current[currentAyahIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [currentAyahIndex, selectedSurah, surahDetail]);

  // Clear Bookmarks or Reset Dashboard
  const handleClearBookmark = (surahNum: number, ayahIdx: number) => {
    setQProgress((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => !(b.surahNumber === surahNum && b.ayahIndex === ayahIdx))
    }));
  };

  const handleResetProgress = () => {
    if (confirm("هل أنت متأكد من تصفير لوحة تقدم تلاوة القرآن الكريم بالكامل؟")) {
      setQProgress({
        startedSurahs: {},
        completedSurahs: [],
        bookmarks: [],
        totalAyahsListenedCount: 0,
      });
    }
  };

  // Action to jump and play a bookmarked verse or resume surah
  const handleGoToBookmark = (surahNum: number, ayahIndex: number) => {
    const surah = SURAHS_METADATA.find((s) => s.number === surahNum);
    if (surah) {
      setSelectedSurah(surah);
      setResumeAyahIndex(ayahIndex);
      setIsPlaying(true);
    }
  };

  const handleResumeSurah = (surahNum: number, lastIndex: number) => {
    const surah = SURAHS_METADATA.find((s) => s.number === surahNum);
    if (surah) {
      setSelectedSurah(surah);
      setResumeAyahIndex(lastIndex);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-stone-950 font-sans min-h-0 relative">
      <AnimatePresence mode="wait">
        {!selectedSurah ? (
          // --- MAIN QURAN INTERFACE (SURAHS LIST) ---
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Search Box */}
                <div className="py-2 px-3 sm:px-4 bg-white dark:bg-stone-900 border-b border-slate-200/50 dark:border-stone-800">
                  <div className="relative max-w-md mx-auto">
                    <input
                      type="text"
                      placeholder="ابحث باسم السورة، أو رقمها..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-stone-800 border-none outline-none py-1.5 pr-8 pl-3 rounded-lg text-xs sm:text-[13px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Chapters Grid */}
                <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide pb-28">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-3 px-1 py-1 select-none mb-2" dir="rtl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky dark:from-transparent dark:to-transparent dark:bg-[#F26522]/15 dark:border dark:border-[#F26522]/40 flex items-center justify-center shadow-xs shrink-0 text-white dark:text-[#F26522] transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-right">
                          <h2 className="font-extrabold text-[14px] sm:text-[15px] text-slate-900 dark:text-white font-cairo leading-tight">
                            سور القرآن الكريم
                          </h2>
                          <p className="text-[10.5px] sm:text-[11px] text-orange-500 font-bold font-cairo">
                            تلاوة واستماع لآيات الذكر الحكيم
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg font-cairo shrink-0">
                        {filteredSurahs.length} سورة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                    {filteredSurahs.length === 0 ? (
                      <div className="col-span-full text-center py-16">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold font-cairo">لم يتم العثور على أي سورة مطابقة للبحث</p>
                      </div>
                    ) : (
                      filteredSurahs.map((surah) => (
                        <button
                          key={surah.number}
                          onClick={() => setSelectedSurah(surah)}
                          className="w-full bg-white dark:bg-stone-900 border border-slate-200/60 dark:border-stone-800 p-2.5 sm:p-3 flex items-center justify-between text-right transition-all duration-300 hover:shadow-md hover:border-taiz-sky/40 dark:hover:border-taiz-sky/40 hover:-translate-y-0.5 active:scale-[0.99] rounded-[12px] sm:rounded-[14px] shadow-xs group"
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-stone-800 border border-slate-200/60 dark:border-stone-700 text-slate-700 dark:text-stone-300 font-bold text-[11px] sm:text-xs font-mono group-hover:bg-gradient-to-br group-hover:from-taiz-royal group-hover:to-taiz-sky group-hover:text-white group-hover:border-transparent transition-all shadow-xs">
                              {surah.number}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-stone-100 font-cairo leading-snug group-hover:text-taiz-sky transition-colors">
                                {surah.name}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-cairo">
                                {surah.englishName}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-full font-cairo">
                              {getRevelationArabic(surah.revelationType)}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-stone-400 font-medium font-cairo">
                              {surah.numberOfAyahs} آية
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                    </div>
                  </div>
                </div>
          </motion.div>
        ) : (
          // --- SURAH DETAIL / READER VIEW ---
          <motion.div
            key="reader"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className={`flex-1 flex flex-col min-h-0 relative transition-colors duration-300 ${themeClasses[readerTheme]}`}
          >
            {/* Top Toolbar */}
            {!focusMode && (
              <div className={`border-b py-1.5 px-3 sm:px-4 flex items-center justify-between shrink-0 relative z-20 shadow-xs transition-colors duration-300 ${
                readerTheme === 'day' ? 'bg-white border-slate-200/50 text-slate-800' : 
                readerTheme === 'sepia' ? 'bg-[#EADFCA] border-[#7F6E5D]/20 text-[#422F1E]' : 
                'bg-[#1e1e21] border-stone-800 text-stone-100'
              }`}>
                <button
                  onClick={() => {
                    setSelectedSurah(null);
                    setSurahDetail(null);
                  }}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition font-bold text-xs sm:text-[13px] font-cairo"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>العودة للقائمة</span>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-sm sm:text-base font-bold font-cairo leading-tight">
                    سورة {selectedSurah.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-amber-500 font-bold font-cairo leading-tight">
                    {selectedSurah.englishName} • {getRevelationArabic(selectedSurah.revelationType)} • {selectedSurah.numberOfAyahs} آية
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFocusMode(true)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition duration-200 text-slate-500 dark:text-slate-300"
                    title="وضع التركيز"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 rounded-lg transition duration-200 ${
                      showSettings
                        ? "bg-emerald-600 text-white"
                        : "hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-500 dark:text-slate-300"
                    }`}
                    title="تنسيق الألوان والخط"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Settings Options drawer */}
            <AnimatePresence>
              {showSettings && !focusMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`border-b px-3 py-2.5 space-y-2 shadow-xs z-30 font-sans backdrop-blur-md ${
                    readerTheme === 'day' ? 'bg-white border-slate-200/70' : 
                    readerTheme === 'sepia' ? 'bg-[#FCF6E5] border-[#E5DEC9]' : 
                    'bg-[#1a1a1c] border-stone-800'
                  }`}
                >
                  <div className="max-w-2xl mx-auto space-y-2">
                    {/* Eye-safety back-themes */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setReaderTheme("day")}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                          readerTheme === "day"
                            ? "bg-emerald-50 border-emerald-600 text-emerald-700 shadow-2xs"
                            : "bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>🎨 نهاراً</span>
                      </button>
                      <button
                        onClick={() => setReaderTheme("sepia")}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                          readerTheme === "sepia"
                            ? "bg-[#F4ECD8] border-[#7F6E5D] text-[#422F1E] shadow-2xs"
                            : "bg-[#F4ECD8]/70 border-transparent text-[#422F1E]/80 hover:bg-[#F4ECD8]"
                        }`}
                      >
                        <span>👁️ دافئ</span>
                      </button>
                      <button
                        onClick={() => setReaderTheme("night")}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                          readerTheme === "night"
                            ? "bg-[#121214] border-emerald-500 text-white shadow-2xs"
                            : "bg-[#121214]/85 border-transparent text-zinc-300 hover:bg-[#121214]"
                        }`}
                      >
                        <span>🌙 ليلاً</span>
                      </button>
                    </div>

                    {/* Adjust font size */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-500 dark:text-stone-400 font-bold font-cairo shrink-0">
                        حجم نص الآيات:
                      </span>
                      <div className="grid grid-cols-4 gap-1 text-[11px] flex-1 max-w-[280px]">
                        <button
                          onClick={() => setFontSize("sm")}
                          className={`py-1 px-1.5 font-bold rounded-md transition ${
                            fontSize === "sm"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-stone-800 dark:text-stone-300"
                          }`}
                        >
                          صغير
                        </button>
                        <button
                          onClick={() => setFontSize("md")}
                          className={`py-1 px-1.5 font-bold rounded-md transition ${
                            fontSize === "md"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-stone-800 dark:text-stone-300"
                          }`}
                        >
                          متوسط
                        </button>
                        <button
                          onClick={() => setFontSize("lg")}
                          className={`py-1 px-1.5 font-bold rounded-md transition ${
                            fontSize === "lg"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-stone-800 dark:text-stone-300"
                          }`}
                        >
                          كبير
                        </button>
                        <button
                          onClick={() => setFontSize("xl")}
                          className={`py-1 px-1.5 font-bold rounded-md transition ${
                            fontSize === "xl"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-stone-800 dark:text-stone-300"
                          }`}
                        >
                          مضاعف
                        </button>
                      </div>
                    </div>

                    {/* Height and weight */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-stone-400 font-bold font-cairo shrink-0">
                          المسافة:
                        </span>
                        <select
                          value={lineHeight}
                          onChange={(e) => setLineHeight(e.target.value as any)}
                          className="py-1 px-2 rounded-md bg-slate-100 dark:bg-stone-800 text-xs border border-slate-200/70 dark:border-stone-700 font-bold focus:outline-none dark:text-stone-100 w-full"
                        >
                          <option value="compact">مضغوط</option>
                          <option value="relaxed">مريح</option>
                          <option value="loose">واسع جداً</option>
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => setFontMedium(!fontMedium)}
                          className={`w-full py-1 px-2 rounded-md border text-[11px] font-bold transition font-cairo ${
                            fontMedium
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-slate-100 border-slate-200/70 text-slate-700 hover:bg-slate-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
                          }`}
                        >
                          خط عريض (Medium)
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Focus Mode top bar - Never covers content */}
            {focusMode && (
              <div className={`sticky top-0 z-[100] w-full px-4 py-2.5 flex items-center justify-between border-b backdrop-blur-md shadow-xs transition-colors duration-300 ${
                readerTheme === 'day' 
                  ? 'bg-white/95 border-slate-200 text-slate-900' 
                  : readerTheme === 'sepia' 
                  ? 'bg-[#F4ECD8]/95 border-[#EADFCA] text-[#3D2C1E]' 
                  : 'bg-[#121214]/95 border-zinc-800 text-zinc-100'
              }`}>
                <button
                  onClick={() => setFocusMode(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-xs transition-all active:scale-95 font-cairo"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>خروج من وضع التركيز</span>
                </button>
                <span className="text-xs font-black font-cairo opacity-80 truncate max-w-[200px]">
                  سورة {selectedSurah?.name}
                </span>
              </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 scroll-smooth transition-colors duration-300 ${themeClasses[readerTheme]}`}>
              {loading && (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
                  <p className="text-slate-500 text-sm font-bold font-cairo">جاري تحميل السورة الكريمة وصوت القارئ...</p>
                </div>
              )}

              {error && (
                <div className="max-w-md mx-auto my-12 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-6 rounded-2xl flex flex-col items-center text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 mb-3 animate-pulse" />
                  <p className="text-slate-800 dark:text-red-200 font-bold text-sm mb-4 leading-relaxed font-cairo">{error}</p>
                  <button
                    onClick={() => selectedSurah && setSelectedSurah({ ...selectedSurah })}
                    className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold font-cairo shadow-md hover:bg-red-700 active:scale-95 transition"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {surahDetail && (
                <div className="max-w-2xl mx-auto space-y-2 sm:space-y-2.5 pb-28">
                  {/* Basmalah */}
                  {shouldShowBasmalah(selectedSurah.number) && (
                    <div className={`text-center py-2 sm:py-3 text-2xl sm:text-3xl font-ibm font-black tracking-wide select-none transition-colors duration-300 mb-2 ${
                      readerTheme === 'day' ? 'text-slate-900' :
                      readerTheme === 'sepia' ? 'text-[#3D2C1E]' :
                      'text-zinc-100'
                    }`}>
                      ﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ﴾
                    </div>
                  )}

                  {/* Verses Layout (Block/Continuous reading style with distinct verse numbers) */}
                  <div 
                    className={`p-4 sm:p-6 transition-all duration-300 rounded-[14px] sm:rounded-[18px] font-ibm ${
                      focusMode 
                        ? 'border-transparent bg-transparent shadow-none' 
                        : readerTheme === 'day' 
                        ? 'bg-white border border-slate-200/70 shadow-xs text-slate-800' 
                        : readerTheme === 'sepia' 
                        ? 'bg-[#FCF9F2] border border-[#E5DEC9] shadow-xs text-[#3D2C1E]' 
                        : 'bg-[#18181A] border border-[#2E2E33] shadow-xs text-zinc-100'
                    } ${fontSizeClasses[fontSize]} ${lineHeightClasses[lineHeight]} ${fontMedium ? 'font-medium' : 'font-normal'}`}
                    style={{ 
                      textJustify: "inter-word", 
                      direction: "rtl",
                      textAlign: "justify",
                      maxWidth: "100%"
                    }}
                  >
                    {surahDetail.ayahs.map((ayah, idx) => {
                      const isActive = idx === currentAyahIndex;
                      
                      // Remove Basmalah prefix from first verse text if it is included
                      let verseText = ayah.text;
                      if (idx === 0 && shouldShowBasmalah(selectedSurah.number)) {
                        // More robust stripping of Basmalah using regex to handle different character variants (diacritics, Alef-Wasla)
                        const basmalahRegex = /^(بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ|بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ|بِسْمِ\s+اللهِ\s+الرَّحْمَنِ\s+الرَّحِيمِ)\s*/;
                        verseText = verseText.replace(basmalahRegex, "").trim();
                      }

                      // If verse is empty after stripping (like Al-Fatiha Ayah 1), 
                      // we skip it in the loop because it's already shown as a separate line header
                      if (idx === 0 && verseText === "" && shouldShowBasmalah(selectedSurah.number)) {
                        return null;
                      }

                      return (
                        <span
                          key={ayah.number}
                          ref={(el) => {
                            verseRefs.current[idx] = el;
                          }}
                          onClick={() => selectVerseDirectly(idx)}
                          className={`inline cursor-pointer px-1 py-0.5 rounded transition-all duration-300 select-none ${
                            isActive
                              ? readerTheme === "day"
                                ? "bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400 font-bold scale-[1.01] shadow-sm mx-1"
                                : readerTheme === "sepia"
                                ? "bg-emerald-900/15 text-emerald-950 ring-2 ring-emerald-600/40 font-bold scale-[1.01] shadow-sm mx-1"
                                : "bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/50 font-bold scale-[1.01] shadow-sm mx-1"
                              : readerTheme === "day"
                              ? "text-slate-800 hover:bg-slate-100"
                              : readerTheme === "sepia"
                              ? "text-[#3D2C1E] hover:bg-[#EADFCA]/40"
                              : "text-zinc-100 hover:bg-stone-800/60"
                          }`}
                        >
                          {verseText}
                          <span className="inline-block text-emerald-600 dark:text-emerald-400 mx-1.5 font-sans font-bold text-sm select-none">
                            ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ultra-Tech Luxury Floating Audio Player Capsule */}
            {surahDetail && !focusMode && (
              <div className="fixed bottom-[66px] sm:bottom-[70px] left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md bg-slate-950/90 dark:bg-zinc-950/95 text-white backdrop-blur-2xl px-3 sm:px-4 py-2 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.12)] border border-emerald-500/30 flex items-center justify-between z-40 gap-2 ring-1 ring-emerald-500/15">
                
                {/* 1. Surah & Ayah Info with Equalizer */}
                <div className="flex items-center gap-2 min-w-0 max-w-[32%] text-right select-none">
                  {/* Glowing Equalizer Icon Ring */}
                  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-900/60 to-slate-900 flex items-center justify-center shrink-0 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                    {isPlaying ? (
                      <div className="flex items-end justify-center gap-[2px] h-3.5 w-3.5">
                        <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                        <span className="w-[2.5px] bg-teal-300 rounded-full animate-[bounce_1s_infinite_300ms] h-2/3" />
                        <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-5/6" />
                      </div>
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400 opacity-80" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black font-cairo leading-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent truncate">
                      سورة {selectedSurah.name}
                    </span>
                    <span className="text-[9.5px] text-slate-300 font-bold font-cairo leading-none truncate mt-0.5">
                      الآية <span className="text-emerald-400 font-mono font-black">{toArabicNumerals(surahDetail.ayahs[currentAyahIndex]?.numberInSurah || 1)}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Audio Transport Controls */}
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <button
                    onClick={playPrevious}
                    disabled={currentAyahIndex === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition active:scale-90 hover:bg-white/5 rounded-lg"
                    title="الآية السابقة"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.5)] active:scale-90 hover:scale-105 transition-all"
                    title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-slate-950 stroke-none" /> : <Play className="w-4 h-4 fill-slate-950 stroke-none translate-x-[-0.5px]" />}
                  </button>

                  <button
                    onClick={playNext}
                    disabled={currentAyahIndex === surahDetail.ayahs.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition active:scale-90 hover:bg-white/5 rounded-lg"
                    title="الآية التالية"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setAutoPlayNext(!autoPlayNext)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl transition-all active:scale-95 text-[10px] font-extrabold font-cairo border ${
                      autoPlayNext 
                        ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                        : "text-slate-400 bg-slate-900/80 border-slate-800 hover:text-slate-200"
                    }`}
                    title={autoPlayNext ? "إيقاف التتابع التلقائي" : "تشغيل التابع تلقائياً"}
                  >
                    <Repeat className={`w-3 h-3 ${autoPlayNext ? "animate-pulse text-emerald-400" : ""}`} />
                    <span>التالي</span>
                  </button>
                </div>

                {/* 3. Luxury Utilities (Bookmark & Progress) */}
                <div className="flex items-center gap-2 shrink-0 select-none border-r border-slate-800/80 pr-2">
                  <button
                    onClick={toggleBookmarkCurrentVerse}
                    className={`p-1.5 rounded-xl transition-all active:scale-90 ${
                      isCurrentVerseBookmarked 
                        ? "text-amber-400 bg-amber-400/15 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                    title={isCurrentVerseBookmarked ? "إلغاء الحفظ" : "حفظ المرجعية"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isCurrentVerseBookmarked ? "fill-current" : ""}`} />
                  </button>

                  <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-xl">
                    <span className="text-[7.5px] text-slate-400 font-bold font-cairo leading-none">
                      التقدم
                    </span>
                    <span className="text-[9.5px] font-black text-emerald-400 font-mono leading-none mt-0.5">
                      {currentAyahIndex + 1}/{surahDetail.ayahs.length}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
