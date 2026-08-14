import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { SURAHS_METADATA, SurahMetadata } from "../data/surahData";

export interface Ayah {
  number: number;
  audio: string;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Ayah[];
}

export interface QuranProgressData {
  startedSurahs: {
    [key: number]: {
      lastIndex: number;
      total: number;
      timestamp: number;
    };
  };
  completedSurahs: number[];
  bookmarks: {
    surahNumber: number;
    surahName: string;
    ayahIndex: number;
    ayahNumberInSurah: number;
    text: string;
    timestamp: number;
  }[];
  totalAyahsListenedCount: number;
}

interface QuranAudioContextType {
  selectedSurah: SurahMetadata | null;
  setSelectedSurah: (surah: SurahMetadata | null) => void;
  surahDetail: SurahDetail | null;
  setSurahDetail: (detail: SurahDetail | null) => void;
  loading: boolean;
  error: string | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentAyahIndex: number;
  setCurrentAyahIndex: (index: number) => void;
  resumeAyahIndex: number;
  setResumeAyahIndex: (index: number) => void;
  
  // Settings
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  readerTheme: "day" | "sepia" | "night";
  setReaderTheme: (theme: "day" | "sepia" | "night") => void;
  fontSize: "sm" | "md" | "lg" | "xl";
  setFontSize: (size: "sm" | "md" | "lg" | "xl") => void;
  lineHeight: "compact" | "relaxed" | "loose";
  setLineHeight: (height: "compact" | "relaxed" | "loose") => void;
  fontMedium: boolean;
  setFontMedium: (medium: boolean) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  autoPlayNext: boolean;
  setAutoPlayNext: (autoplay: boolean) => void;
  
  // Player functions
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playNextSurah: () => void;
  selectVerseDirectly: (index: number) => void;
  toggleBookmarkCurrentVerse: () => void;
  isCurrentVerseBookmarked: boolean;
  closePlayer: () => void;
  
  // Progress
  qProgress: QuranProgressData;
  setQProgress: React.Dispatch<React.SetStateAction<QuranProgressData>>;
  toArabicNumerals: (num: number) => string;
  getRevelationArabic: (type: string) => string;
  shouldShowBasmalah: (surahNum: number) => boolean;
}

const QuranAudioContext = createContext<QuranAudioContextType | undefined>(undefined);

export function QuranAudioProvider({ children }: { children: React.ReactNode }) {
  const [selectedSurah, setSelectedSurah] = useState<SurahMetadata | null>(null);
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(-1);
  const [resumeAyahIndex, setResumeAyahIndex] = useState<number>(-1);

  // Reader Settings States
  const [showSettings, setShowSettings] = useState(false);
  const [readerTheme, setReaderTheme] = useState<"day" | "sepia" | "night">(() => {
    try {
      const stored = localStorage.getItem("quran_kareem_reader_theme");
      if (stored === "day" || stored === "sepia" || stored === "night") return stored;
    } catch (e) {}
    return "day";
  });
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">(() => {
    try {
      const stored = localStorage.getItem("quran_kareem_font_size");
      if (stored === "sm" || stored === "md" || stored === "lg" || stored === "xl") return stored;
    } catch (e) {}
    return "md";
  });
  const [lineHeight, setLineHeight] = useState<"compact" | "relaxed" | "loose">(() => {
    try {
      const stored = localStorage.getItem("quran_kareem_line_height");
      if (stored === "compact" || stored === "relaxed" || stored === "loose") return stored;
    } catch (e) {}
    return "relaxed";
  });
  const [fontMedium, setFontMedium] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("quran_kareem_font_medium");
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {}
    return true;
  });
  const [focusMode, setFocusMode] = useState(false);
  const focusModePushedRef = useRef(false);

  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("quran_auto_play_next");
      return stored !== null ? JSON.parse(stored) : true;
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem("quran_auto_play_next", JSON.stringify(autoPlayNext));
  }, [autoPlayNext]);

  useEffect(() => {
    localStorage.setItem("quran_kareem_reader_theme", readerTheme);
  }, [readerTheme]);

  useEffect(() => {
    localStorage.setItem("quran_kareem_font_size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("quran_kareem_line_height", lineHeight);
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem("quran_kareem_font_medium", JSON.stringify(fontMedium));
  }, [fontMedium]);

  // Handle focusMode global body class and phone back button
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("quran-reading-focus");

      if (!focusModePushedRef.current) {
        focusModePushedRef.current = true;
        window.history.pushState({ quranFocusMode: true }, "");
      }

      const handlePopState = () => {
        focusModePushedRef.current = false;
        setFocusMode(false);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        document.body.classList.remove("quran-reading-focus");
      };
    } else {
      document.body.classList.remove("quran-reading-focus");
      if (focusModePushedRef.current) {
        focusModePushedRef.current = false;
        if (window.history.state?.quranFocusMode) {
          window.history.back();
        }
      }
    }
  }, [focusMode]);

  // Recitation progress saved in localStorage
  const [qProgress, setQProgress] = useState<QuranProgressData>(() => {
    try {
      const stored = localStorage.getItem("quran_recitation_progress");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      startedSurahs: {},
      completedSurahs: [],
      bookmarks: [],
      totalAyahsListenedCount: 0,
    };
  });

  // Save progress changes
  useEffect(() => {
    localStorage.setItem("quran_recitation_progress", JSON.stringify(qProgress));
  }, [qProgress]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Setup audio player listener once
  const handleAudioEndedRef = useRef<() => void>(undefined);
  
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onEndedListener = () => {
      if (handleAudioEndedRef.current) {
        handleAudioEndedRef.current();
      }
    };

    audio.addEventListener("ended", onEndedListener);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("ended", onEndedListener);
    };
  }, []);

  // Update the ref whenever dependencies change
  useEffect(() => {
    handleAudioEndedRef.current = handleAudioEnded;
  }, [surahDetail, currentAyahIndex, autoPlayNext, selectedSurah]);

  // Fetch Surah Details with Minshawi Audio
  useEffect(() => {
    if (!selectedSurah) {
      // If we cleared the surah but are still playing in background, don't clear details unless we explicitly close
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah.number}/ar.minshawi`)
      .then((res) => {
        if (!res.ok) throw new Error("فشل في جلب آيات السورة. يرجى التحقق من اتصالك بالإنترنت.");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data.code === 200 && data.data) {
          setSurahDetail(data.data);
          if (resumeAyahIndex >= 0) {
            setCurrentAyahIndex(resumeAyahIndex);
            setResumeAyahIndex(-1); // Reset trigger
          } else {
            setCurrentAyahIndex(0); // Default to first Ayah
          }
        } else {
          throw new Error("بيانات غير صالحة من المصدر.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "حدث خطأ غير متوقع.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSurah]);

  // Handle event listener to stop Quran audio from other players
  useEffect(() => {
    const handleStopQuran = () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    window.addEventListener("stop-quran-audio", handleStopQuran);
    return () => window.removeEventListener("stop-quran-audio", handleStopQuran);
  }, []);

  // Handle Play/Pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      window.dispatchEvent(new CustomEvent("stop-live-stream"));
      audio.play().catch((err) => {
        console.warn("Playback failed:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Update audio source and progress when index or surah detail changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !surahDetail || currentAyahIndex < 0 || currentAyahIndex >= surahDetail.ayahs.length) {
      return;
    }

    const currentAyah = surahDetail.ayahs[currentAyahIndex];
    
    // Check if source actually changed to avoid restarting same track
    if (audio.src !== currentAyah.audio) {
      audio.src = currentAyah.audio;
    }

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Audio playback failed:", err);
        setIsPlaying(false);
      });
    }

    // Accumulate recitation progress
    setQProgress((prev) => {
      const surahNum = surahDetail.number;
      const total = surahDetail.ayahs.length;
      
      const updatedStarted = { ...prev.startedSurahs };
      const currentRecord = updatedStarted[surahNum] || { lastIndex: 0, total, timestamp: Date.now() };
      
      if (currentAyahIndex > currentRecord.lastIndex) {
        currentRecord.lastIndex = currentAyahIndex;
        currentRecord.timestamp = Date.now();
        updatedStarted[surahNum] = currentRecord;
      } else if (!updatedStarted[surahNum]) {
        updatedStarted[surahNum] = currentRecord;
      }

      const completed = [...prev.completedSurahs];
      if (currentAyahIndex === total - 1 && !completed.includes(surahNum)) {
        completed.push(surahNum);
      }

      return {
        ...prev,
        startedSurahs: updatedStarted,
        completedSurahs: completed,
        totalAyahsListenedCount: prev.totalAyahsListenedCount + 1
      };
    });

  }, [surahDetail, currentAyahIndex]);

  // Helper function for ended audio
  const handleAudioEnded = () => {
    if (!surahDetail) return;
    
    if (currentAyahIndex + 1 < surahDetail.ayahs.length) {
      setCurrentAyahIndex(currentAyahIndex + 1);
      setIsPlaying(true);
    } else {
      // Current Surah completed! Auto-advance to Next Surah if enabled!
      if (autoPlayNext) {
        playNextSurah();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const playNextSurah = () => {
    if (!selectedSurah) return;
    const currentIndex = SURAHS_METADATA.findIndex(s => s.number === selectedSurah.number);
    if (currentIndex !== -1 && currentIndex + 1 < SURAHS_METADATA.length) {
      const nextSurah = SURAHS_METADATA[currentIndex + 1];
      // Set playing true first so fetch effect knows to start playing when ready
      setIsPlaying(true);
      setSelectedSurah(nextSurah);
      setCurrentAyahIndex(0);
      setSurahDetail(null); // Clear old detail to show loader
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (!surahDetail) return;
    if (currentAyahIndex < surahDetail.ayahs.length - 1) {
      setCurrentAyahIndex(currentAyahIndex + 1);
    } else {
      playNextSurah();
    }
  };

  const playPrevious = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(currentAyahIndex - 1);
    }
  };

  const selectVerseDirectly = (index: number) => {
    setCurrentAyahIndex(index);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSelectedSurah(null);
    setSurahDetail(null);
    setCurrentAyahIndex(-1);
  };

  // Convert English revelation types to Arabic
  const getRevelationArabic = (type: string) => {
    return type === "Meccan" || type === "meccan" ? "مكية" : "مدنية";
  };

  // Render Eastern Arabic numerals
  const toArabicNumerals = (num: number) => {
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return num
      .toString()
      .split("")
      .map((digit) => arabicDigits[parseInt(digit, 10)] || digit)
      .join("");
  };

  // Format Surah name for displaying Basmalah
  const shouldShowBasmalah = (surahNum: number) => {
    return surahNum !== 9;
  };

  // Bookmarking handler
  const isCurrentVerseBookmarked = !!(selectedSurah && qProgress.bookmarks.some(
    (b) => b.surahNumber === selectedSurah.number && b.ayahIndex === currentAyahIndex
  ));

  const toggleBookmarkCurrentVerse = () => {
    if (!selectedSurah || !surahDetail || currentAyahIndex < 0) return;
    
    setQProgress((prev) => {
      const isBookmarked = prev.bookmarks.some(
        (b) => b.surahNumber === selectedSurah.number && b.ayahIndex === currentAyahIndex
      );
      
      let updatedBookmarks: typeof prev.bookmarks = [];
      if (isBookmarked) {
        updatedBookmarks = prev.bookmarks.filter(
          (b) => !(b.surahNumber === selectedSurah.number && b.ayahIndex === currentAyahIndex)
        );
      } else {
        const currentAyah = surahDetail.ayahs[currentAyahIndex];
        updatedBookmarks = [
          ...prev.bookmarks,
          {
            surahNumber: selectedSurah.number,
            surahName: selectedSurah.name,
            ayahIndex: currentAyahIndex,
            ayahNumberInSurah: currentAyah.numberInSurah,
            text: currentAyah.text,
            timestamp: Date.now(),
          },
        ];
      }
      
      return {
        ...prev,
        bookmarks: updatedBookmarks,
      };
    });
  };

  return (
    <QuranAudioContext.Provider
      value={{
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
      }}
    >
      {children}
    </QuranAudioContext.Provider>
  );
}

export function useQuranAudio() {
  const context = useContext(QuranAudioContext);
  if (context === undefined) {
    throw new Error("useQuranAudio must be used within a QuranAudioProvider");
  }
  return context;
}
