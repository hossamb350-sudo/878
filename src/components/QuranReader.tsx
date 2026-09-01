import React, { useState, useEffect, useRef } from "react";
import {
  Bookmark,
  FileText,
  Edit,
  Trash2,
  Sliders,
  Eye,
  EyeOff,
  Highlighter,
  Maximize,
  Minimize2,
  ChevronLeft,
  Calendar,
  Clock,
  BookOpen,
  BookText,
  Share2,
  CornerDownLeft,
  X,
  Check,
  StickyNote,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuranLesson, QuranSeries } from "../types";
import { formatLessonDisplayTitle } from "../data/staticQuranData";
import { shareContent } from "../utils/share";

interface QuranReaderProps {
  lesson: QuranLesson;
  series: QuranSeries;
  onBack: () => void;
  bookmarks: any[];
  onToggleBookmark: (index: number, text: string) => void;
  notes: any[];
  onSaveNote: (index: number, text: string, quote?: string) => void;
  onDeleteNote: (index: number) => void;
  highlights: any[];
  onToggleHighlight: (
    index: number,
    color: string,
    text?: string,
    startOffset?: number,
    endOffset?: number
  ) => void;
  onDeleteHighlight: (index: number) => void;
  onProgressUpdate: (percentage: number) => void;
  jumpToParagraphIndex: number | null;
  jumpToExactId?: string | null;
  onClearJump: () => void;
  isLoading?: boolean;
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
  jumpToExactId,
  onClearJump,
  isLoading = false,
}: QuranReaderProps) {
  // Reading Prefs (saved in local storage)
  const [readerTheme, setReaderTheme] = useState<"day" | "night" | "sepia">(
    () => {
      return (localStorage.getItem("quran_pref_theme") as any) || "day";
    }
  );
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">(() => {
    return (localStorage.getItem("quran_pref_size") as any) || "md";
  });
  const [lineHeight, setLineHeight] = useState<"compact" | "relaxed" | "loose">(
    () => {
      return (localStorage.getItem("quran_pref_height") as any) || "relaxed";
    }
  );
  const [fontMedium, setFontMedium] = useState<boolean>(() => {
    return localStorage.getItem("quran_pref_weight") === "medium";
  });

  // Focus and helpers
  const [focusMode, setFocusMode] = useState(false);
  const focusModePushedRef = useRef(false);
  const [showSettings, setShowSettings] = useState(false);

  // Scroll details state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollStats, setScrollStats] = useState({
    percentage: 0,
    timeRemainingMinutes: 0,
    paragraphsRemaining: 0,
  });

  // Paragraph-specific interactions
  const [selectedParaIndex, setSelectedParaIndex] = useState<number | null>(
    null
  );
  const [noteEditIndex, setNoteEditIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  // Selection Menu state
  const [selectionMenu, setSelectionMenu] = useState<{
    x: number;
    y: number;
    text: string;
    paraIndex: number;
    startOffset?: number;
    endOffset?: number;
  } | null>(null);
  const [floatingNote, setFloatingNote] = useState<{
    x: number;
    y: number;
    paraIndex: number;
    quote?: string;
  } | null>(null);

  // Read content paragraphs
  const paragraphs = lesson.content
    ? lesson.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const wordCount = lesson.content
    ? lesson.content.split(/\s+/).filter(Boolean).length
    : 0;

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
    localStorage.setItem(
      "quran_pref_weight",
      fontMedium ? "medium" : "regular"
    );
  }, [fontMedium]);

  // Handle global focusMode body classes, full screen, and phone back button
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("quran-reading-focus");
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        }
      } catch (err) {}

      if (!focusModePushedRef.current) {
        focusModePushedRef.current = true;
        window.history.pushState({ lessonFocusMode: true }, "");
      }

      const handlePopState = () => {
        focusModePushedRef.current = false;
        setFocusMode(false);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        document.body.classList.remove("quran-reading-focus");
        try {
          if (document.fullscreenElement) {
            document.exitFullscreen?.();
          }
        } catch (err) {}
      };
    } else {
      document.body.classList.remove("quran-reading-focus");
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        }
      } catch (err) {}

      if (focusModePushedRef.current) {
        focusModePushedRef.current = false;
        if (window.history.state?.lessonFocusMode) {
          window.history.back();
        }
      }
    }
  }, [focusMode]);

  // Handle Reading Time Accumulation (active viewing)
  useEffect(() => {
    let lastActive = Date.now();
    const tick = setInterval(() => {
      // Check if tab is focused and user is not idle
      if (document.hasFocus() && Date.now() - lastActive < 60000) {
        const statsKey = "quran_reading_stats";
        try {
          const stats = JSON.parse(
            localStorage.getItem(statsKey) ||
              '{"lessonsReadCount":0,"totalReadingTimeSeconds":0,"totalReadingTimeMinutes":0,"lastReadTimestamp":0}'
          );
          stats.totalReadingTimeSeconds += 10;
          stats.totalReadingTimeMinutes = Math.floor(
            stats.totalReadingTimeSeconds / 60
          );
          stats.lastReadTimestamp = Date.now();
          localStorage.setItem(statsKey, JSON.stringify(stats));
        } catch (e) {}
      }
    }, 10000);

    const updateActivity = () => {
      lastActive = Date.now();
    };
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
    let autoJumpDone = false;
    if (saved && jumpToParagraphIndex === null) {
      try {
        const num = parseFloat(saved);
        if (num > 50) {
          // Auto jump to last read position
          let attempts = 0;
          const tryAutoScroll = () => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.style.scrollBehavior = "auto";
              scrollContainerRef.current.scrollTop = num;
              scrollContainerRef.current.style.scrollBehavior = "smooth";
            } else if (attempts < 20) {
              attempts++;
              setTimeout(tryAutoScroll, 100);
            }
          };
          setTimeout(tryAutoScroll, 100);
          autoJumpDone = true;
        }
      } catch (e) {}
    }

    // 2. Handle immediate jump clicked from bookmarks/notes list
    if (jumpToParagraphIndex !== null) {
      let attempts = 0;
      const tryScroll = () => {
        const exactEl = jumpToExactId
          ? document.getElementById(jumpToExactId)
          : null;
        const paraEl = document.getElementById(`para-${jumpToParagraphIndex}`);
        const el = exactEl || paraEl;
        const container = scrollContainerRef.current;
        if (el && container) {
          // Calculate precise scroll position within the scrollable container
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetScrollTop =
            container.scrollTop +
            (elRect.top - containerRect.top) -
            containerRect.height / 2 +
            elRect.height / 2;

          container.scrollTo({ top: targetScrollTop, behavior: "smooth" });

          // Add precise target highlight class
          const highlightClassList = [
            "ring-4",
            "ring-emerald-500/80",
            "ring-offset-2",
            "scale-[1.01]",
            "transition-all",
            "duration-500",
          ];
          highlightClassList.forEach((cls) => el.classList.add(cls));
          setTimeout(() => {
            highlightClassList.forEach((cls) => el.classList.remove(cls));
          }, 4000);

          setSelectedParaIndex(jumpToParagraphIndex);
          onClearJump();
        } else if (attempts < 20) {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };
      setTimeout(tryScroll, 100);
    }
  }, [lesson.id, jumpToParagraphIndex, jumpToExactId]);

  // Track scrolling to save progress
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    let percentage = 0;
    const scrollMax = scrollHeight - clientHeight;
    if (scrollMax > 0) {
      percentage = Math.min(Math.round((scrollTop / scrollMax) * 100), 100);
    } else {
      percentage = 100;
    }

    // Word calculations
    const wordsRemaining = Math.max(
      0,
      Math.ceil(wordCount * (1 - percentage / 100))
    );
    const minutesLeft = Math.ceil(wordsRemaining / 180); // Arabic average speed

    const paragraphsRead = Math.round((percentage / 100) * paragraphs.length);
    const paragraphsLeft = Math.max(0, paragraphs.length - paragraphsRead);

    setScrollStats({
      percentage,
      timeRemainingMinutes: minutesLeft,
      paragraphsRemaining: paragraphsLeft,
    });

    onProgressUpdate(percentage);

    // Save scroll position for restoring
    localStorage.setItem(`quran_last_pos_${lesson.id}`, scrollTop.toString());
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    const selectionText = selection?.toString().trim();

    if (selection && selectionText && selectionText.length > 1) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        let node = selection.anchorNode;
        while (
          node &&
          !(node instanceof HTMLElement && node.id?.startsWith("para-"))
        ) {
          node = node.parentNode;
        }

        if (node && node instanceof HTMLElement) {
          const idx = parseInt(node.id.split("-")[1]);

          // Precise offsets calculation
          let startOffset = 0;
          const preRange = range.cloneRange();
          preRange.selectNodeContents(node);
          preRange.setEnd(range.startContainer, range.startOffset);
          startOffset = preRange.toString().length;

          const menuWidth = 300;
          let x = window.innerWidth / 2; // Fixed horizontal center
          let y = rect.top - 25; // Slightly higher to avoid overlap

          // Safety check for top boundary
          if (y < 100) {
            y = rect.bottom + 85;
          }

          setSelectionMenu({
            x,
            y,
            text: selectionText,
            paraIndex: idx,
            startOffset,
            endOffset: startOffset + selectionText.length,
          });
        }
      } catch (err) {
        // Safe catch for invalid ranges
      }
    } else {
      setSelectionMenu(null);
    }
  };

  useEffect(() => {
    const onSelect = () => {
      handleSelection();
    };

    document.addEventListener("selectionchange", onSelect);
    window.addEventListener("mouseup", onSelect);
    window.addEventListener("touchend", onSelect);

    return () => {
      document.removeEventListener("selectionchange", onSelect);
      window.removeEventListener("mouseup", onSelect);
      window.removeEventListener("touchend", onSelect);
    };
  }, []);

  // Use focusMode to toggle a global class to hide the main app navigation
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("quran-reading-focus");
    } else {
      document.body.classList.remove("quran-reading-focus");
    }
    return () => {
      document.body.classList.remove("quran-reading-focus");
    };
  }, [focusMode]);

  const copyText = (txt: string) => {
    const doCopy = (str: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(str);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = str;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          document.body.removeChild(textArea);
          return Promise.resolve();
        } catch (err) {
          document.body.removeChild(textArea);
          return Promise.reject(err);
        }
      }
    };

    doCopy(txt)
      .then(() => {
        setSelectionMenu(null);
      })
      .catch((err) => {
        console.error("Copy failed", err);
      });
  };

  const renderParagraphText = (
    paraText: string,
    idx: number,
    inlineHighlights: any[],
    paragraphNotes: any[]
  ) => {
    const matchSegments: {
      start: number;
      end: number;
      type: "highlight" | "bookmark" | "note";
      id: string;
      color?: string;
      text: string;
    }[] = [];

    // 1. Gather highlights
    inlineHighlights.forEach((h) => {
      const start =
        h.startOffset !== undefined
          ? h.startOffset
          : paraText.indexOf(h.text || "");
      if (start !== -1) {
        const end =
          h.endOffset !== undefined
            ? h.endOffset
            : start + (h.text?.length || 0);
        matchSegments.push({
          start,
          end,
          type: "highlight",
          color: h.color || "yellow",
          id: `high-${h.id || start}`,
          text: h.text || "",
        });
      }
    });

    // 2. Gather bookmarks with substring selections (where text is less than paragraph text)
    bookmarks.forEach((b) => {
      if (
        b.lessonId === lesson.id &&
        b.paragraphIndex === idx &&
        b.text &&
        b.text.trim()
      ) {
        if (b.text.length < paraText.length) {
          const start = paraText.indexOf(b.text);
          if (start !== -1) {
            matchSegments.push({
              start,
              end: start + b.text.length,
              type: "bookmark",
              id: `bookmark-${b.id || b.createdAt}`,
              text: b.text,
            });
          }
        }
      }
    });

    // 3. Gather notes with quote selections
    paragraphNotes.forEach((n) => {
      if (n.quote && n.quote.trim()) {
        const start = paraText.indexOf(n.quote);
        if (start !== -1) {
          matchSegments.push({
            start,
            end: start + n.quote.length,
            type: "note",
            id: `note-inline-${n.id}`,
            text: n.quote,
          });
        }
      }
    });

    if (matchSegments.length === 0) return paraText;

    // Sort segments by start, then by length descending
    const sorted = [...matchSegments].sort(
      (a, b) => a.start - b.start || b.end - a.end
    );
    const finalSegments: typeof sorted = [];
    let lastEnd = 0;
    sorted.forEach((seg) => {
      if (seg.start >= lastEnd) {
        finalSegments.push(seg);
        lastEnd = seg.end;
      }
    });

    const elements: React.ReactNode[] = [];
    let currentPos = 0;

    finalSegments.forEach((seg, sIdx) => {
      if (seg.start > currentPos) {
        elements.push(paraText.substring(currentPos, seg.start));
      }

      if (seg.type === "highlight") {
        let hClass = "";
        if (seg.color === "yellow")
          hClass =
            "bg-yellow-300 dark:bg-yellow-500/50 px-0.5 rounded shadow-sm text-black dark:text-white border-b-2 border-yellow-600";
        else if (seg.color === "green")
          hClass =
            "bg-emerald-300 dark:bg-emerald-500/50 px-0.5 rounded shadow-sm text-black dark:text-white border-b-2 border-emerald-600";
        elements.push(
          <span
            key={`hl-${idx}-${sIdx}`}
            className={`${hClass} inline-block leading-relaxed`}
          >
            {paraText.substring(seg.start, seg.end)}
          </span>
        );
      } else if (seg.type === "bookmark") {
        elements.push(
          <span
            key={`bm-exact-${idx}-${sIdx}`}
            id={seg.id}
            className="bg-red-500/10 dark:bg-red-500/20 border-b-4 border-red-500/60 border-dashed inline-flex items-center flex-wrap gap-0.5 px-1 py-0.5 rounded select-all transition-all ring-offset-2 hover:ring-2 hover:ring-red-500/20"
            title="مرجع إشارة محفوظ"
            onClick={(e) => e.stopPropagation()}
          >
            <Bookmark className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0 inline-block align-middle ml-1 pointer-events-none" />
            {paraText.substring(seg.start, seg.end)}
          </span>
        );
      } else if (seg.type === "note") {
        elements.push(
          <span
            key={`note-exact-${idx}-${sIdx}`}
            id={seg.id}
            className="bg-amber-500/10 dark:bg-amber-500/20 border-b-4 border-amber-500/60 border-dotted inline-flex items-center flex-wrap gap-0.5 px-1.5 py-0.5 rounded select-all transition-all ring-offset-2 hover:ring-2 hover:ring-amber-500/20"
            title="موضع مذكرة"
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 inline-block align-middle ml-1 pointer-events-none" />
            {paraText.substring(seg.start, seg.end)}
          </span>
        );
      }

      currentPos = seg.end;
    });

    if (currentPos < paraText.length) {
      elements.push(paraText.substring(currentPos));
    }

    return <>{elements}</>;
  };

  // Styles formatting
  const themeClasses = {
    day: "bg-surface-main text-text-primary border-border-light",
    night: "bg-[#121214] text-zinc-100 border-zinc-800",
    sepia: "bg-[#F4ECD8] text-[#422F1E] border-[#EADFCA]",
  };

  const fontSizeClasses = {
    sm: "text-base md:text-lg",
    md: "text-lg md:text-xl",
    lg: "text-xl md:text-2xl",
    xl: "text-2xl md:text-3xl",
  };

  const lineHeightClasses = {
    compact: "leading-relaxed md:leading-loose",
    relaxed: "leading-loose md:leading-[2.2]",
    loose: "leading-[2.3] md:leading-[2.6]",
  };

  const handleShareLesson = async () => {
    const displayTitle = formatLessonDisplayTitle(
      lesson.title,
      lesson.order,
      undefined,
      series.title
    );
    await shareContent({
      title: displayTitle,
      type: "lesson",
      id: lesson.id,
      seriesId: series.id || lesson.seriesId,
    });
  };

  return (
    <div
      className={`absolute inset-0 z-[60] flex flex-col font-sans transition-colors duration-300 ${themeClasses[readerTheme]}`}
      dir="rtl"
    >
      {/* 1. Header Toolbar (Hidden in Focus Mode unless mouse hovers or active) */}
      {!focusMode && (
        <div className="bg-taiz-navy text-white px-3 sm:px-4 py-1.5 flex items-center justify-between z-40 shadow-xs shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition duration-200"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span className="text-xs sm:text-[13px] font-bold font-cairo">رجوع</span>
          </button>

          <div className="text-center max-w-[50%]">
            <h1 className="text-xs sm:text-sm font-bold font-cairo truncate leading-tight">
              {formatLessonDisplayTitle(lesson.title, lesson.order, undefined, series.title)}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-amber-400 truncate font-bold font-cairo leading-tight">
              {series.title}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareLesson}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition duration-200"
              title="مشاركة الدرس"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setFocusMode(true);
              }}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition duration-200"
              title="وضع التركيز"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition duration-200 ${
                showSettings
                  ? "bg-emerald-600 text-white"
                  : "bg-white/5 hover:bg-white/10"
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
            className="bg-taiz-navy/95 border-b border-white/10 text-white px-3 py-2.5 space-y-2 shadow-inner z-30 font-sans backdrop-blur-md"
          >
            <div className="max-w-2xl mx-auto space-y-2">
              {/* Eye-safety back-themes */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setReaderTheme("day")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all text-text-primary ${
                    readerTheme === "day"
                      ? "bg-surface-main border-taiz-royal"
                      : "bg-surface-main/80 border-transparent hover:bg-surface-main"
                  }`}
                >
                  <span>🎨 نهاراً</span>
                </button>
                <button
                  onClick={() => setReaderTheme("sepia")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all text-[#422F1E] ${
                    readerTheme === "sepia"
                      ? "bg-[#F4ECD8] border-[#7F6E5D]"
                      : "bg-[#F4ECD8]/80 border-transparent hover:bg-[#F4ECD8]"
                  }`}
                >
                  <span>👁️ دافئ</span>
                </button>
                <button
                  onClick={() => setReaderTheme("night")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all text-white ${
                    readerTheme === "night"
                      ? "bg-[#121214] border-taiz-sky"
                      : "bg-[#121214]/85 border-transparent hover:bg-[#121214]"
                  }`}
                >
                  <span>🌙 ليلاً</span>
                </button>
              </div>

              {/* Adjust font size */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] text-white/70 font-bold font-cairo shrink-0">
                  حجم نص الدرس:
                </span>
                <div className="grid grid-cols-4 gap-1 text-[11px] text-text-primary flex-1 max-w-[280px]">
                  <button
                    onClick={() => setFontSize("sm")}
                    className={`py-1 px-1.5 font-bold rounded-md transition ${
                      fontSize === "sm"
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-main hover:bg-surface-hover"
                    }`}
                  >
                    صغير
                  </button>
                  <button
                    onClick={() => setFontSize("md")}
                    className={`py-1 px-1.5 font-bold rounded-md transition ${
                      fontSize === "md"
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-main hover:bg-surface-hover"
                    }`}
                  >
                    متوسط
                  </button>
                  <button
                    onClick={() => setFontSize("lg")}
                    className={`py-1 px-1.5 font-bold rounded-md transition ${
                      fontSize === "lg"
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-main hover:bg-surface-hover"
                    }`}
                  >
                    كبير
                  </button>
                  <button
                    onClick={() => setFontSize("xl")}
                    className={`py-1 px-1.5 font-bold rounded-md transition ${
                      fontSize === "xl"
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-main hover:bg-surface-hover"
                    }`}
                  >
                    مضاعف
                  </button>
                </div>
              </div>

              {/* Height and weight */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/70 font-bold font-cairo shrink-0">
                    المسافة:
                  </span>
                  <select
                    value={lineHeight}
                    onChange={(e) => setLineHeight(e.target.value as any)}
                    className="py-1 px-2 rounded-md bg-black/20 text-xs border border-white/10 font-bold focus:outline-none w-full"
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
                        : "bg-black/20 border-white/10 text-white/70 hover:bg-black/30"
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
            {lesson.title}
          </span>
        </div>
      )}

      {/* Smart Selection Toolbar */}
      <AnimatePresence>
        {selectionMenu &&
          (() => {
            const isSelectionBookmarked = bookmarks.some(
              (b) =>
                b.lessonId === lesson.id &&
                b.paragraphIndex === selectionMenu.paraIndex
            );
            return (
              <div
                style={{
                  position: "fixed",
                  top: selectionMenu.y,
                  left: selectionMenu.x,
                  transform: "translate(-50%, -100%)",
                  zIndex: 100,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20, rotate: -5 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    rotate: 0,
                    transition: {
                      type: "spring",
                      damping: 12,
                      stiffness: 200,
                    },
                  }}
                  exit={{ opacity: 0, scale: 0.5, y: 20, rotate: 5 }}
                  className="flex items-center gap-1 bg-surface-main/95 backdrop-blur-2xl p-2 rounded-2xl shadow-strong border border-taiz-royal/30 ltr"
                >
                  <div className="flex items-center gap-2 px-2 border-r border-border-light mr-1 ltr">
                    <motion.button
                      whileHover={{ scale: 1.25 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHighlight(
                          selectionMenu.paraIndex,
                          "yellow",
                          selectionMenu.text,
                          selectionMenu.startOffset,
                          selectionMenu.endOffset
                        );
                        setSelectionMenu(null);
                        window.getSelection()?.removeAllRanges();
                      }}
                      className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white shadow-xl cursor-pointer flex items-center justify-center shrink-0"
                      title="تظليل أصفر"
                    >
                      <Highlighter className="w-5 h-5 text-amber-800" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.25 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHighlight(
                          selectionMenu.paraIndex,
                          "green",
                          selectionMenu.text,
                          selectionMenu.startOffset,
                          selectionMenu.endOffset
                        );
                        setSelectionMenu(null);
                        window.getSelection()?.removeAllRanges();
                      }}
                      className="w-10 h-10 rounded-full bg-emerald-400 border-2 border-white shadow-xl flex items-center justify-center cursor-pointer shrink-0"
                      title="تظليل أخضر"
                    >
                      <Highlighter className="w-5 h-5 text-red-600" />
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-1 px-1 ltr">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFloatingNote({
                          x: selectionMenu.x,
                          y: selectionMenu.y,
                          paraIndex: selectionMenu.paraIndex,
                          quote: selectionMenu.text,
                        });
                        setNoteText(`حول: "${selectionMenu.text}"\n`);
                        setSelectionMenu(null);
                        window.getSelection()?.removeAllRanges();
                      }}
                      className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition text-text-primary flex flex-col items-center gap-0.5"
                      title="تثبيت ملاحظة"
                    >
                      <StickyNote className="w-5 h-5" />
                      <span className="text-[10px] font-black">ملاحظة</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(
                          selectionMenu.paraIndex,
                          selectionMenu.text
                        );
                        setSelectionMenu(null);
                        window.getSelection()?.removeAllRanges();
                      }}
                      className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition flex flex-col items-center gap-0.5 ${
                        isSelectionBookmarked
                          ? "text-status-error font-extrabold"
                          : "text-text-primary"
                      }`}
                      title={
                        isSelectionBookmarked ? "إلغاء الإشارة" : "حفظ إشارة"
                      }
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          isSelectionBookmarked
                            ? "text-status-error fill-status-error"
                            : ""
                        }`}
                      />
                      <span className="text-[10px] font-black">
                        {isSelectionBookmarked ? "إشارة محفوظـة" : "حفظ إشارة"}
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => copyText(selectionMenu.text)}
                      className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition text-text-primary flex flex-col items-center gap-0.5"
                      title="نسخ"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="text-[10px] font-black">نسخ</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>

      {/* Floating Note Editor at selection point */}
      <AnimatePresence>
        {floatingNote && (
          <div
            style={{
              position: "fixed",
              top: Math.min(
                window.innerHeight - 350,
                Math.max(100, floatingNote.y)
              ),
              left: window.innerWidth / 2,
              transform: "translateX(-50%)",
              zIndex: 200,
              width: Math.min(340, window.innerWidth - 20),
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-surface-main rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)] border border-border-light overflow-hidden"
            >
              <div className="bg-surface-card px-3 py-2 border-b border-border-light flex items-center justify-between">
                <span className="text-xs font-black text-taiz-royal">
                  تدوين ملحوظة
                </span>
                <button
                  onClick={() => setFloatingNote(null)}
                  className="p-1 hover:bg-surface-hover rounded-lg transition"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>
              <div className="p-3">
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="اكتب ملحوظتك هنا..."
                  className="w-full h-32 p-3 text-sm bg-surface-main border border-border-light rounded-xl focus:ring-2 focus:ring-taiz-royal outline-none resize-none font-medium leading-relaxed"
                />
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => setFloatingNote(null)}
                    className="text-xs text-text-muted font-bold hover:underline"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      onSaveNote(
                        floatingNote.paraIndex,
                        noteText,
                        floatingNote.quote
                      );
                      setFloatingNote(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-taiz-royal hover:bg-red-700/90 text-white rounded-xl text-xs font-black shadow-lg shadow-taiz-royal/20 transition active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ الملحوظة</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main text viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className="flex-1 overflow-y-auto px-4 py-10 relative focus:outline-none"
      >
        <div className="max-w-2xl mx-auto space-y-8 py-8">
          {/* Section top info */}
          <div className="text-center pb-6 border-b border-border-light font-sans">
            <span className="text-xs font-bold text-taiz-royal border border-taiz-royal/30 px-3 py-1 rounded-full uppercase tracking-wider">
              الدرس الحالي
            </span>
            <h2 className="text-3xl font-black mt-3 mb-2">{lesson.title}</h2>
            <p className="text-xs text-text-secondary font-bold">
              سلسلة: {series.title}
            </p>
          </div>

          {/* Paragraph list loop */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-taiz-royal/20 border-t-taiz-royal rounded-full animate-spin"></div>
              <p className="text-taiz-royal font-bold animate-pulse">جاري تحميل محتوى الدرس...</p>
            </div>
          ) : paragraphs.length === 0 ? (
            <p className="text-center text-text-muted py-10 font-sans">
              لم يتم تزويد الدرس بمحتوى بعد.
            </p>
          ) : (
            <div className="space-y-6">
              {paragraphs.map((paraText, idx) => {
                const hasHighlight = highlights.find(
                  (h) => h.lessonId === lesson.id && h.paragraphIndex === idx
                );
                const isBookmarked = bookmarks.some(
                  (b) => b.lessonId === lesson.id && b.paragraphIndex === idx
                );
                const paragraphNotes = notes.filter(
                  (n) => n.lessonId === lesson.id && n.paragraphIndex === idx
                );

                const globalHighlights = highlights.filter(
                  (h) =>
                    h.lessonId === lesson.id &&
                    h.paragraphIndex === idx &&
                    !h.text
                );
                const inlineHighlights = highlights.filter(
                  (h) =>
                    h.lessonId === lesson.id &&
                    h.paragraphIndex === idx &&
                    h.text
                );

                let blockHighlightClass = "";
                if (globalHighlights.length > 0) {
                  const h = globalHighlights[globalHighlights.length - 1];
                  if (h.color === "yellow") {
                    blockHighlightClass =
                      "bg-yellow-100/70 dark:bg-yellow-950/30 border-r-4 border-yellow-500 rounded-l-xl px-3 py-2";
                  } else if (h.color === "green") {
                    blockHighlightClass =
                      "bg-emerald-100/70 dark:bg-emerald-950/30 border-r-4 border-emerald-500 rounded-l-xl px-3 py-2";
                  }
                }

                return (
                  <div
                    id={`para-${idx}`}
                    key={idx}
                    onClick={() => {
                      setSelectedParaIndex(
                        selectedParaIndex === idx ? null : idx
                      );
                      if (noteEditIndex !== idx) setNoteEditIndex(null);
                    }}
                    className={`relative group px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-border-light hover:bg-surface-hover ${
                      fontSizeClasses[fontSize]
                    } ${lineHeightClasses[lineHeight]} ${
                      fontMedium ? "font-medium" : "font-natural"
                    } text-justify ${blockHighlightClass}`}
                  >
                    {/* Floating top flags for bookmark or note indicator */}
                    <div className="absolute top-1 left-2 flex items-center gap-1 pointer-events-none scale-90">
                      {isBookmarked && (
                        <Bookmark className="w-4 h-4 text-status-error fill-status-error" />
                      )}
                      {paragraphNotes.length > 0 && (
                        <FileText className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    {/* Main paragraph Text body */}
                    <div
                      className={`flex-1 transition-colors ${
                        selectedParaIndex === idx
                          ? "text-text-primary"
                          : "text-text-primary/90"
                      }`}
                    >
                      {renderParagraphText(
                        paraText,
                        idx,
                        inlineHighlights,
                        paragraphNotes
                      )}
                    </div>

                    {/* Render Multiple Notes Sticky below */}
                    {paragraphNotes.map((note, nIdx) => {
                      console.log("QuranReader: rendering note:", note);
                      return (
                        <div
                          key={note.id || `note-${idx}-${nIdx}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 bg-surface-card p-3 rounded-xl border-r-4 border-taiz-royal text-text-primary text-sm shadow-sm flex items-start gap-3"
                        >
                          <FileText className="w-4 h-4 shrink-0 text-red-600 mt-1" />
                          <div className="flex-1">
                            <span className="font-bold text-xs text-text-muted block mb-1">
                              ملاحظة {paragraphNotes.length > 1 ? nIdx + 1 : ""}:
                            </span>
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {note.noteText}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              console.log("QuranReader: deleting note:", note.id);
                              onDeleteNote(note.id);
                            }}
                            className="text-text-muted hover:text-status-error transition-colors p-1 bg-surface-hover rounded-lg shrink-0"
                            title="حذف الملاحظة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Action box expanders inside paragraph click */}
                    <AnimatePresence>
                      {selectedParaIndex === idx && (
                        <motion.div
                          onClick={(e) => e.stopPropagation()}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 border-t border-border-light pt-3 flex flex-wrap items-center gap-2"
                        >
                          {/* التظليل والحفظ سريع */}
                          <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-full border border-border-light">
                            <button
                              onClick={() => onToggleHighlight(idx, "yellow")}
                              className={`w-6 h-6 rounded-full bg-yellow-400 border border-white hover:scale-110 transition ${
                                globalHighlights.some(
                                  (h) => h.color === "yellow"
                                )
                                  ? "ring-2 ring-amber-500"
                                  : ""
                              }`}
                              title="تظليل الفقرة بالأصفر"
                            />
                            <button
                              onClick={() => onToggleHighlight(idx, "green")}
                              className={`w-6 h-6 rounded-full bg-emerald-400 border border-white hover:scale-110 transition ${
                                globalHighlights.some(
                                  (h) => h.color === "green"
                                )
                                  ? "ring-2 ring-emerald-500"
                                  : ""
                              }`}
                              title="تظليل الفقرة بالأخضر"
                            />
                            {(globalHighlights.length > 0 ||
                              inlineHighlights.length > 0) && (
                              <button
                                onClick={() => onDeleteHighlight(idx)}
                                className="text-[10px] text-status-error font-black px-1.5 hover:underline"
                              >
                                حذف التظليل
                              </button>
                            )}
                          </div>

                          <span className="text-text-muted text-xs">|</span>

                          {/* Bookmark add */}
                          <button
                            onClick={() => onToggleBookmark(idx, paraText)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-bold border transition ${
                              isBookmarked
                                ? "bg-status-error text-white border-status-error"
                                : "bg-black/10 text-text-primary dark:bg-white/5 border-transparent"
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isBookmarked ? "fill-white" : ""
                              }`}
                            />
                            <span>
                              {isBookmarked ? "إشارة محفوظة" : "حفظ إشارة"}
                            </span>
                          </button>

                          {/* Write Notes button */}
                          <button
                            onClick={() => {
                              setNoteEditIndex(idx);
                              setNoteText(
                                paragraphNotes.length > 0
                                  ? paragraphNotes[paragraphNotes.length - 1]
                                      ?.noteText || ""
                                  : ""
                              );
                            }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-black/10 text-text-primary dark:bg-white/5 border-transparent font-bold"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ملحوظة</span>
                          </button>

                          {/* Copy paragraph text */}
                          <button
                            onClick={() => copyText(paraText)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-black/10 text-text-primary dark:bg-white/5 border-transparent font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inline Notes update area */}
                    {noteEditIndex === idx && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 bg-surface-card p-3 rounded-2xl border border-taiz-royal font-sans shadow-sm"
                      >
                        <span className="text-xs font-bold text-text-muted block mb-1">
                          دون ملحوظتك على هذه الفقرة:
                        </span>
                        <textarea
                          autoFocus
                          rows={3}
                          className="w-full text-sm p-3 bg-surface-main text-text-primary rounded-xl outline-none border border-border-light font-bold focus:border-taiz-royal"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="اكتب ملاحظاتك هنا..."
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setNoteEditIndex(null)}
                            className="px-3 py-1 bg-surface-hover text-text-secondary text-xs rounded-lg font-bold"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => {
                              onSaveNote(idx, noteText);
                              setNoteEditIndex(null);
                            }}
                            className="px-3 py-1 bg-taiz-royal hover:bg-red-700/90 text-white text-xs rounded-lg font-bold"
                          >
                            حفظ الملاحظة
                          </button>
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

      {/* 2. Interactive Bottom Reading HUD Indicators (Compact & Harmonized) */}
      {!focusMode && (
        <div 
          className={`border-t px-3 py-1 sm:py-1.5 flex items-center justify-between text-[10.5px] sm:text-[11.5px] font-cairo shrink-0 transition-colors duration-300 ${
            readerTheme === 'day'
              ? 'bg-slate-50/95 border-slate-200/80 text-slate-700'
              : readerTheme === 'sepia'
              ? 'bg-[#EFE6D5]/95 border-[#E2D6BF] text-[#4A3B2C]'
              : 'bg-[#18181A]/95 border-zinc-800 text-zinc-300'
          }`}
        >
          {/* Right item: Remaining time */}
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${
              readerTheme === 'day' ? 'text-amber-600' : readerTheme === 'sepia' ? 'text-amber-700' : 'text-amber-400'
            }`} />
            <span className="font-semibold">
              بقي حوالي:{" "}
              <span className={`font-black ${
                readerTheme === 'day' ? 'text-emerald-700' : readerTheme === 'sepia' ? 'text-emerald-800' : 'text-emerald-400'
              }`}>
                {scrollStats.timeRemainingMinutes} دقائق
              </span>
            </span>
          </div>

          {/* Middle item: Reading percentage and progress bar */}
          <div className="flex flex-col items-center">
            <span className={`font-bold ${
              readerTheme === 'day' ? 'text-slate-800' : readerTheme === 'sepia' ? 'text-[#3D2C1E]' : 'text-zinc-100'
            }`}>
              تمت قراءة <span className="font-black text-[#F26522]">{scrollStats.percentage}%</span> من الدرس
            </span>
            <div className={`w-20 sm:w-24 h-1 rounded-full overflow-hidden mt-0.5 ${
              readerTheme === 'day' ? 'bg-slate-200' : readerTheme === 'sepia' ? 'bg-[#DCD0B9]' : 'bg-zinc-700'
            }`}>
              <div
                className="h-full bg-[#F26522] rounded-full transition-all duration-300"
                style={{ width: `${scrollStats.percentage}%` }}
              />
            </div>
          </div>

          {/* Left item: Remaining paragraphs */}
          <div className="flex items-center gap-1.5">
            <BookText className={`w-3.5 h-3.5 ${
              readerTheme === 'day' ? 'text-amber-600' : readerTheme === 'sepia' ? 'text-amber-700' : 'text-amber-400'
            }`} />
            <span className="font-semibold">
              متبقي:{" "}
              <span className={`font-black ${
                readerTheme === 'day' ? 'text-sky-700' : readerTheme === 'sepia' ? 'text-sky-800' : 'text-sky-400'
              }`}>
                {scrollStats.paragraphsRemaining} فقرات
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
