import { useState, useEffect, useRef } from "react";
import { 
  Bookmark, Quote, FileText, Edit, Trash2, Sliders, Eye, EyeOff, Sparkles, 
  Maximize, Minimize2, ChevronLeft, Calendar, Clock, BookOpen, Share2, CornerDownLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuranLesson, QuranSeries } from "../types";

interface QuranReaderProps {
  lesson: QuranLesson;
  series: QuranSeries;
  onBack: () => void;
  bookmarks: any[];
  onToggleBookmark: (index: number, text: string) => void;
  notes: any[];
  onSaveNote: (index: number, text: string) => void;
  onDeleteNote: (index: number) => void;
  highlights: any[];
  onToggleHighlight: (index: number, color: string) => void;
  onDeleteHighlight: (index: number) => void;
  onProgressUpdate: (percentage: number) => void;
  jumpToParagraphIndex: number | null;
  onClearJump: () => void;
}

export function QuranReader({
  lesson,
  series,
  onBack,
  bookmarks,
  onToggleBookmark,
  notes,
  onSaveNote,
  onDeleteNote,
  highlights,
  onToggleHighlight,
  onDeleteHighlight,
  onProgressUpdate,
  jumpToParagraphIndex,
  onClearJump
}: QuranReaderProps) {
  // Reading Prefs (saved in local storage)
  const [readerTheme, setReaderTheme] = useState<'day' | 'night' | 'sepia'>(() => {
    return (localStorage.getItem("quran_pref_theme") as any) || 'day';
  });
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem("quran_pref_size") as any) || 'md';
  });
  const [lineHeight, setLineHeight] = useState<'compact' | 'relaxed' | 'loose'>(() => {
    return (localStorage.getItem("quran_pref_height") as any) || 'relaxed';
  });
  const [fontMedium, setFontMedium] = useState<boolean>(() => {
    return localStorage.getItem("quran_pref_weight") === 'medium';
  });

  // Focus and helpers
  const [focusMode, setFocusMode] = useState(false);
  const [readingRuler, setReadingRuler] = useState(false);
  const [rulerTop, setRulerTop] = useState(45); // vertical position percentage
  const [showSettings, setShowSettings] = useState(false);

  // Scroll details state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollStats, setScrollStats] = useState({
    percentage: 0,
    timeRemainingMinutes: 0,
    paragraphsRemaining: 0
  });

  // Paragraph-specific interactions
  const [selectedParaIndex, setSelectedParaIndex] = useState<number | null>(null);
  const [noteEditIndex, setNoteEditIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [jumpPrompt, setJumpPrompt] = useState<number | null>(null);

  // Read content paragraphs
  const paragraphs = lesson.content 
    ? lesson.content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    : [];

  const wordCount = lesson.content ? lesson.content.split(/\s+/).filter(Boolean).length : 0;

  // Persist Preferences
  useEffect(() => {
    localStorage.setItem("quran_pref_theme", readerTheme);
  }, [readerTheme]);
  useEffect(() => {
    localStorage.setItem("quran_pref_size", fontSize);
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem("quran_pref_height", lineHeight);
  }, [lineHeight]);
  useEffect(() => {
    localStorage.setItem("quran_pref_weight", fontMedium ? 'medium' : 'regular');
  }, [fontMedium]);

  // Handle Reading Time Accumulation (active viewing)
  useEffect(() => {
    let lastActive = Date.now();
    const tick = setInterval(() => {
      // Check if tab is focused and user is not idle
      if (document.hasFocus() && (Date.now() - lastActive < 60000)) {
        const statsKey = "quran_reading_stats";
        try {
          const stats = JSON.parse(localStorage.getItem(statsKey) || '{"lessonsReadCount":0,"totalReadingTimeSeconds":0,"totalReadingTimeMinutes":0,"lastReadTimestamp":0}');
          stats.totalReadingTimeSeconds += 10;
          stats.totalReadingTimeMinutes = Math.floor(stats.totalReadingTimeSeconds / 60);
          stats.lastReadTimestamp = Date.now();
          localStorage.setItem(statsKey, JSON.stringify(stats));
        } catch(e) {}
      }
    }, 10000);

    const updateActivity = () => { lastActive = Date.now(); };
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("scroll", updateActivity, true);
    window.addEventListener("touchstart", updateActivity);

    return () => {
      clearInterval(tick);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("scroll", updateActivity, true);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, []);

  // Jump restoration or explicit jumpToParagraphIndex
  useEffect(() => {
    // 1. Check for lesson specific last saved position
    const key = `quran_last_pos_${lesson.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const num = parseFloat(saved);
        if (num > 50) {
          setJumpPrompt(num);
        }
      } catch(e){}
    }

    // 2. Handle immediate jump clicked from bookmarks/notes list
    if (jumpToParagraphIndex !== null) {
      setJumpPrompt(null);
      setTimeout(() => {
        const el = document.getElementById(`para-${jumpToParagraphIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-amber-500/50', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500/50', 'ring-offset-2'), 4000);
          setSelectedParaIndex(jumpToParagraphIndex);
          onClearJump();
        }
      }, 700);
    }
  }, [lesson.id, jumpToParagraphIndex]);

  // Track scrolling to save progress
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    let percentage = 0;
    const scrollMax = scrollHeight - clientHeight;
    if (scrollMax > 0) {
      percentage = Math.min(Math.round((scrollTop / scrollMax) * 100), 100);
    } else {
      percentage = 100;
    }

    // Word calculations
    const wordsRemaining = Math.max(0, Math.ceil(wordCount * (1 - percentage / 100)));
    const minutesLeft = Math.ceil(wordsRemaining / 180); // Arabic average speed

    const paragraphsRead = Math.round((percentage / 100) * paragraphs.length);
    const paragraphsLeft = Math.max(0, paragraphs.length - paragraphsRead);

    setScrollStats({
      percentage,
      timeRemainingMinutes: minutesLeft,
      paragraphsRemaining: paragraphsLeft
    });

    onProgressUpdate(percentage);

    // Save scroll position for restoring
    localStorage.setItem(`quran_last_pos_${lesson.id}`, scrollTop.toString());
  };

  const handleApplyJumpRestore = () => {
    if (jumpPrompt && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = jumpPrompt;
      setJumpPrompt(null);
    }
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => {
      alert("تم نسخ الفقرة بنجاح!");
    });
  };

  const shareQuote = (txt: string) => {
    const formatted = `« ${txt} »\n\nمن درس: ${lesson.title}\nمن هدي القرآن الكريم للشهيد القائد السيد حسين بدرالدين الحوثي`;
    navigator.clipboard.writeText(formatted).then(() => {
      alert("تم نسخ الاقتباس المنسق لمشاركته!");
    });
  };

  // Styles formatting
  const themeClasses = {
    day: "bg-[#FAF8F5] text-stone-900 border-stone-200",
    night: "bg-[#121214] text-zinc-100 border-zinc-800",
    sepia: "bg-[#F4ECD8] text-[#422F1E] border-[#EADFCA]"
  };

  const fontSizeClasses = {
    sm: "text-base md:text-lg",
    md: "text-lg md:text-xl",
    lg: "text-xl md:text-2xl",
    xl: "text-2xl md:text-3xl"
  };

  const lineHeightClasses = {
    compact: "leading-relaxed md:leading-loose",
    relaxed: "leading-loose md:leading-[2.2]",
    loose: "leading-[2.3] md:leading-[2.6]"
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col font-sans transition-colors duration-300 ${themeClasses[readerTheme]}`} dir="rtl">
      {/* 1. Header Toolbar (Hidden in Focus Mode unless mouse hovers or active) */}
      {!focusMode && (
        <div className="bg-[#1e293b] text-white px-4 py-3 flex items-center justify-between z-40 shadow-md shrink-0">
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition duration-200">
            <ChevronLeft className="w-5 h-5 rotate-180" />
            <span className="text-sm font-bold">رجوع</span>
          </button>
          
          <div className="text-center max-w-[50%]">
             <h1 className="text-sm md:text-base font-black truncate">{lesson.title}</h1>
             <p className="text-[10px] text-gray-300 truncate font-semibold">{series.title}</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setReadingRuler(!readingRuler)} 
              className={`p-2 rounded-xl transition duration-200 ${readingRuler ? 'bg-amber-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
              title="مسطرة التركيز"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setFocusMode(true); }} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition duration-200"
              title="وضع التركيز"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-xl transition duration-200 ${showSettings ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
              title="تنسيق الألوان والخط"
            >
              <Sliders className="w-5 h-5" />
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
            className="bg-slate-850 bg-slate-900 border-b border-gray-700 text-white px-4 py-4 space-y-4 shadow-inner z-30 font-sans"
          >
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Eye-safety back-themes */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setReaderTheme('day')} className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border text-black ${readerTheme === 'day' ? 'bg-[#FAF8F5] border-yellow-600' : 'bg-[#FAF8F5]/80 border-transparent'}`}>
                  🎨 نهاراً
                </button>
                <button onClick={() => setReaderTheme('sepia')} className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border text-[#422F1E] ${readerTheme === 'sepia' ? 'bg-[#F4ECD8] border-yellow-700' : 'bg-[#F4ECD8]/80 border-transparent'}`}>
                  👁️ دافئ
                </button>
                <button onClick={() => setReaderTheme('night')} className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border text-white ${readerTheme === 'night' ? 'bg-[#121214] border-blue-500' : 'bg-[#121214]/85 border-transparent'}`}>
                  🌙 ليلاً
                </button>
              </div>

              {/* Adjust font size */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-bold">حجم نص الدرس:</span>
                <div className="grid grid-cols-4 gap-1.5 text-xs text-black">
                  <button onClick={() => setFontSize('sm')} className={`py-1.5 px-2 font-bold rounded-lg ${fontSize === 'sm' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>صغير</button>
                  <button onClick={() => setFontSize('md')} className={`py-1.5 px-2 font-bold rounded-lg ${fontSize === 'md' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>متوسط</button>
                  <button onClick={() => setFontSize('lg')} className={`py-1.5 px-2 font-bold rounded-lg ${fontSize === 'lg' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>كبير</button>
                  <button onClick={() => setFontSize('xl')} className={`py-1.5 px-2 font-bold rounded-lg ${fontSize === 'xl' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>مضاعف</button>
                </div>
              </div>

              {/* Height and weight */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400 font-bold">المسافة بين السطور:</span>
                  <select 
                    value={lineHeight} 
                    onChange={e => setLineHeight(e.target.value as any)} 
                    className="p-2 rounded bg-slate-800 text-sm border border-gray-600 font-bold"
                  >
                    <option value="compact">مضغوط</option>
                    <option value="relaxed">مريح</option>
                    <option value="loose">واسع جداً</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button 
                    onClick={() => setFontMedium(!fontMedium)} 
                    className={`p-2.5 rounded border text-xs font-bold transition ${fontMedium ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-800 border-gray-600 text-gray-300'}`}
                  >
                     تفعيل خط عريض (Medium/Medium)
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode floating header inside the reader */}
      {focusMode && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <button 
            onClick={() => setFocusMode(false)} 
            className="flex items-center gap-1 px-4 py-2 bg-amber-600/90 hover:bg-amber-600 backdrop-blur text-white font-bold rounded-full text-xs shadow-lg transition duration-200"
          >
            <Minimize2 className="w-4 h-4" />
            <span>خروج من وضع التركيز</span>
          </button>
        </div>
      )}

      {/* Reading Ruler Adjustable Slider overlay */}
      {readingRuler && (
        <div className="absolute top-18 right-4 z-40 bg-black/75 hover:bg-black text-white p-2.5 rounded-2xl flex flex-col items-center gap-1 gap-2 shadow-xl border border-gray-700 min-w-[70px]">
          <span className="text-[10px] font-extrabold text-amber-500">موقع المَسطرة</span>
          <input 
            type="range" 
            min="15" 
            max="80" 
            value={rulerTop} 
            onChange={e => setRulerTop(parseInt(e.target.value))} 
            className="h-28 accent-yellow-500 rounded-lg cursor-pointer" 
            style={{ writingMode: "bt-lr", appearance: "slider-vertical" }}
          />
          <button onClick={() => setReadingRuler(false)} className="text-[10px] text-red-400 font-bold px-1.5 hover:underline">إخفاء</button>
        </div>
      )}

      {/* Visual Ruler Guide Overlay Line */}
      {readingRuler && (
        <div 
          className="fixed left-0 right-0 h-10 pointer-events-none bg-yellow-500/10 dark:bg-yellow-400/10 border-y border-yellow-500/30 z-30 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all"
          style={{ top: `${rulerTop}%` }}
        />
      )}

      {/* Jump Restore Prompt */}
      {jumpPrompt !== null && (
        <div className="flex justify-between items-center bg-amber-500/90 backdrop-blur text-white px-4 py-3 z-40 shadow-md font-sans text-xs md:text-sm">
          <span>لقد توقفت هنا في آخر قراءة لك. هل تود العودة للموضع السابق؟</span>
          <div className="flex gap-2">
            <button onClick={() => setJumpPrompt(null)} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-bold">لا، شكراً</button>
            <button onClick={handleApplyJumpRestore} className="px-3 py-1 bg-white text-amber-900 rounded font-bold hover:bg-gray-100 transition-colors">نعم، المتابعة</button>
          </div>
        </div>
      )}

      {/* Main text viewport */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-10 relative scroll-smooth focus:outline-none"
      >
        <div className="max-w-2xl mx-auto space-y-8 py-8">
           {/* Section top info */}
           <div className="text-center pb-6 border-b border-gray-300 dark:border-gray-700/60 font-sans">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-600/30 px-3 py-1 rounded-full uppercase tracking-wider">الدرس الحالي</span>
              <h2 className="text-3xl font-black mt-3 mb-2">{lesson.title}</h2>
              <p className="text-xs text-gray-500 font-bold">سلسلة: {series.title}</p>
           </div>

           {/* Paragraph list loop */}
           {paragraphs.length === 0 ? (
             <p className="text-center text-gray-500 py-10 font-sans">لم يتم تزويد الدرس بمحتوى بعد.</p>
           ) : (
             <div className="space-y-6">
               {paragraphs.map((paraText, idx) => {
                 const hasHighlight = highlights.find(h => h.lessonId === lesson.id && h.paragraphIndex === idx);
                 const isBookmarked = bookmarks.some(b => b.lessonId === lesson.id && b.paragraphIndex === idx);
                 const hasNote = notes.find(n => n.lessonId === lesson.id && n.paragraphIndex === idx);

                 // Highlighting styled block classes
                 let highlightStyleClass = "";
                 if (hasHighlight) {
                   if (hasHighlight.color === 'yellow') {
                     highlightStyleClass = "bg-yellow-100/90 dark:bg-yellow-950/40 text-black dark:text-white border-r-4 border-yellow-500 px-3 py-2.5 rounded-l-xl";
                   } else if (hasHighlight.color === 'green') {
                     highlightStyleClass = "bg-emerald-100/95 dark:bg-emerald-950/40 text-black dark:text-white border-r-4 border-emerald-500 px-3 py-2.5 rounded-l-xl";
                   } else if (hasHighlight.color === 'underline') {
                     highlightStyleClass = "underline decoration-sky-500/80 decoration-2 underline-offset-8 py-1.5";
                   }
                 }

                 return (
                   <div 
                     id={`para-${idx}`}
                     key={idx}
                     onClick={() => {
                        setSelectedParaIndex(selectedParaIndex === idx ? null : idx);
                        // Close editing on another paragraph
                        if (noteEditIndex !== idx) setNoteEditIndex(null);
                     }}
                     className={`relative group px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-gray-300/40 hover:bg-black/5 dark:hover:bg-white/5 ${fontSizeClasses[fontSize]} ${lineHeightClasses[lineHeight]} ${fontMedium ? 'font-medium' : 'font-natural'} text-justify`}
                   >
                     {/* Floating top flags for bookmark or note indicator */}
                     <div className="absolute top-1 left-2 flex items-center gap-1 pointer-events-none scale-90">
                       {isBookmarked && <Bookmark className="w-4 h-4 text-red-500 fill-red-500" />}
                       {hasNote && <FileText className="w-4 h-4 text-amber-500" />}
                     </div>

                     {/* Main paragraph Text body */}
                     <span className={highlightStyleClass}>
                       {paraText}
                     </span>

                     {/* Render Note Sticky below */}
                     {hasNote && (
                       <div onClick={(e) => e.stopPropagation()} className="mt-3 bg-[#FCF6E0] dark:bg-zinc-800 p-3 rounded-xl border-r-4 border-amber-500 text-[#4E3D21] dark:text-amber-200 text-sm shadow-sm flex items-start gap-3">
                         <FileText className="w-4 h-4 shrink-0 text-amber-600 mt-1" />
                         <div className="flex-1">
                           <span className="font-bold text-xs text-amber-800 dark:text-amber-300 block mb-1">ملاحظتي:</span>
                           <p className="leading-relaxed whitespace-pre-wrap">{hasNote.noteText}</p>
                         </div>
                         <button 
                           onClick={() => onDeleteNote(idx)} 
                           className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-black/5 rounded-lg shrink-0"
                           title="حذف الملاحظة"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     )}

                     {/* Action box expanders inside paragraph click */}
                     <AnimatePresence>
                       {selectedParaIndex === idx && (
                         <motion.div 
                           onClick={(e) => e.stopPropagation()}
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="mt-4 border-t border-gray-400/20 pt-3 flex flex-wrap items-center gap-2"
                         >
                           {/* Quick colors selection */}
                           <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-full border border-gray-400/20">
                             <button onClick={() => onToggleHighlight(idx, 'yellow')} className={`w-5 h-5 rounded-full bg-yellow-400 border border-white hover:scale-110 transition ${hasHighlight?.color === 'yellow' ? 'ring-2 ring-amber-500' : ''}`} title="أصفر" />
                             <button onClick={() => onToggleHighlight(idx, 'green')} className={`w-5 h-5 rounded-full bg-emerald-400 border border-white hover:scale-110 transition ${hasHighlight?.color === 'green' ? 'ring-2 ring-emerald-500' : ''}`} title="أخضر" />
                             <button onClick={() => onToggleHighlight(idx, 'underline')} className={`w-5 h-5 rounded-full bg-sky-200 dark:bg-sky-900 border border-white hover:scale-110 transition flex items-center justify-center ${hasHighlight?.color === 'underline' ? 'ring-2 ring-sky-500' : ''}`} title="تسطير">
                               <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-200">U</span>
                             </button>
                             {hasHighlight && (
                               <button onClick={() => onDeleteHighlight(idx)} className="text-[10px] text-red-500 font-black px-1.5 hover:underline">حذف</button>
                             )}
                           </div>

                           <span className="text-gray-400 text-xs">|</span>

                           {/* Bookmark add */}
                           <button 
                             onClick={() => onToggleBookmark(idx, paraText)}
                             className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-bold border transition ${isBookmarked ? 'bg-red-500 text-white border-red-500' : 'bg-black/10 text-gray-700 dark:bg-white/5 dark:text-gray-300 border-transparent'}`}
                           >
                             <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
                             <span>{isBookmarked ? 'إشارة محفوظة' : 'حفظ إشارة'}</span>
                           </button>

                           {/* Write Notes button */}
                           <button 
                             onClick={() => {
                               setNoteEditIndex(idx);
                               setNoteText(hasNote?.noteText || "");
                             }}
                             className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-black/10 text-gray-700 dark:bg-white/5 dark:text-gray-300 border-transparent font-bold"
                           >
                             <Edit className="w-3.5 h-3.5" />
                             <span>ملحوظة</span>
                           </button>

                           {/* Copy paragraph text */}
                           <button 
                             onClick={() => copyText(paraText)}
                             className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-black/10 text-gray-700 dark:bg-white/5 dark:text-gray-300 border-transparent font-bold"
                           >
                             <FileText className="w-3.5 h-3.5" />
                             <span>نسخ</span>
                           </button>

                           {/* Share citation quote */}
                           <button 
                             onClick={() => shareQuote(paraText)}
                             className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-black/10 text-gray-700 dark:bg-white/5 dark:text-gray-300 border-transparent font-bold animate-pulse"
                           >
                             <Quote className="w-3.5 h-3.5" />
                             <span>مشاركة اقتباس</span>
                           </button>
                         </motion.div>
                       )}
                     </AnimatePresence>

                     {/* Inline Notes update area */}
                     {noteEditIndex === idx && (
                       <div onClick={(e) => e.stopPropagation()} className="mt-3 bg-yellow-50/50 dark:bg-zinc-800 p-3 rounded-2xl border border-yellow-200 dark:border-zinc-700 font-sans shadow-sm">
                         <span className="text-xs font-bold text-gray-500 dark:text-gray-300 block mb-1">دون ملحوظتك على هذه الفقرة:</span>
                         <textarea 
                           rows={3}
                           className="w-full text-sm p-3 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 rounded-xl outline-none border border-gray-300 dark:border-gray-700 font-bold"
                           value={noteText}
                           onChange={e => setNoteText(e.target.value)}
                           placeholder="اكتب ملاحظاتك هنا..."
                         />
                         <div className="flex justify-end gap-2 mt-2">
                           <button onClick={() => setNoteEditIndex(null)} className="px-3 py-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg font-bold">إلغاء</button>
                           <button onClick={() => { onSaveNote(idx, noteText); setNoteEditIndex(null); }} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg font-bold">حفظ الملاحظة</button>
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>

      {/* 2. Interactive Bottom Reading HUD Indicators (Time left, progress remaining) */}
      <div className="bg-[#1e293b] border-t border-gray-700 text-white px-4 py-2.5 flex items-center justify-between shadow-lg text-xs font-sans shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">بقي حوالي: <span className="text-emerald-400 font-black">{scrollStats.timeRemainingMinutes} دقائق</span></span>
        </div>

        <div className="text-center">
          <span className="font-extrabold text-[#38bdf8]">تمت قراءة {scrollStats.percentage}% من الدرس</span>
          {/* Progress bar line */}
          <div className="w-32 bg-gray-700 h-1 rounded-full overflow-hidden mt-1 mx-auto">
            <div className="h-full bg-[#38bdf8]" style={{ width: `${scrollStats.percentage}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="font-bold">متبقي: <span className="text-blue-400 font-black">{scrollStats.paragraphsRemaining} فِقرات</span></span>
        </div>
      </div>
    </div>
  );
}
