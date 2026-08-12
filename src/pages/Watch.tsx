import { useEffect, useState, useRef, useMemo } from "react";
import { SyncService } from "../services/SyncService";
import { VideoItem, LiveStream } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Play, 
  Radio, 
  Search, 
  Clock, 
  Eye, 
  Tv, 
  SlidersHorizontal, 
  FolderOpen, 
  X, 
  Flame, 
  ChevronLeft,
  Star,
  Building2,
  Shield,
  FileText,
  Users,
  Video as VideoIcon,
  Filter,
  Sparkles,
  Pause,
  Volume2,
  VolumeX,
  Info,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PullToRefresh } from "../components/PullToRefresh";
import { getEmbedUrl } from "../utils/embed";

const getRelativeTimeArabic = (timestamp: any) => {
  if (!timestamp) return "منذ فترة";
  const now = Date.now();
  const diffMs = now - Number(timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "الآن";
  if (diffMin < 60) {
    if (diffMin === 1) return "منذ دقيقة";
    if (diffMin === 2) return "منذ دقيقتين";
    if (diffMin >= 3 && diffMin <= 10) return `منذ ${diffMin} دقائق`;
    return `منذ ${diffMin} دقيقة`;
  }
  if (diffHr < 24) {
    if (diffHr === 1) return "منذ ساعة";
    if (diffHr === 2) return "منذ ساعتين";
    if (diffHr >= 3 && diffHr <= 10) return `منذ ${diffHr} ساعات`;
    return `منذ ${diffHr} ساعة`;
  }
  if (diffDay < 30) {
    if (diffDay === 1) return "منذ يوم";
    if (diffDay === 2) return "منذ يومين";
    if (diffDay >= 3 && diffDay <= 10) return `منذ ${diffDay} أيام`;
    return `منذ ${diffDay} يوماً`;
  }
  try {
    return format(timestamp, "d MMMM yyyy", { locale: ar });
  } catch (e) {
    return "منذ فترة";
  }
};

const formatViewsArabic = (views: number = 0) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1).replace(".0", "")} مليون`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(".0", "")} ألف`;
  }
  return `${views}`;
};

// Fallback channels matching the original reference design (Image 1)
const DEFAULT_CHANNELS: Partial<LiveStream>[] = [
  { 
    id: "ch-1", 
    name: "المسيرة مباشر", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%23B91C1C'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23EF4444' stroke-width='2'/><path d='M22 52C25 38 38 30 50 30C62 30 75 38 78 52C70 47 60 45 50 45C40 45 30 47 22 52Z' fill='white'/><text x='50' y='48' font-family='sans-serif' font-weight='900' font-size='18' fill='white' text-anchor='middle'>المسيرة</text><rect x='25' y='58' width='50' height='16' rx='8' fill='white'/><text x='50' y='70' font-family='sans-serif' font-weight='900' font-size='10' fill='%23B91C1C' text-anchor='middle'>مباشر</text></svg>", 
    streamUrl: "https://almasirah.net.ye/live",
    type: "tv",
    isActive: true 
  },
  { 
    id: "ch-2", 
    name: "المسيرة", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%23B91C1C'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23EF4444' stroke-width='2'/><path d='M20 58C25 38 38 30 50 30C62 30 75 38 80 58C72 52 61 50 50 50C39 50 28 52 20 58Z' fill='white'/><text x='50' y='58' font-family='sans-serif' font-weight='900' font-size='22' fill='white' text-anchor='middle'>المسيرة</text></svg>", 
    streamUrl: "https://almasirah.net.ye/live",
    isActive: true 
  },
  { 
    id: "ch-3", 
    name: "الساحات", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%230F172A'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23334155' stroke-width='2'/><path d='M30 40Q50 20 70 40Q50 35 30 40Z' fill='%23DC2626'/><path d='M25 50Q50 30 75 50Q50 45 25 50Z' fill='%230284C7'/><text x='50' y='68' font-family='sans-serif' font-weight='900' font-size='15' fill='white' text-anchor='middle'>الساحات</text></svg>", 
    streamUrl: "https://alsahat.tv/live",
    isActive: true 
  },
  { 
    id: "ch-4", 
    name: "عدن", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%23F1F5F9'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23CBD5E1' stroke-width='2'/><path d='M46 70V30L50 20L54 30V70H46Z' fill='%2364748B'/><rect x='42' y='55' width='16' height='4' fill='%23DC2626'/><text x='50' y='45' font-family='sans-serif' font-weight='900' font-size='11' fill='%23DC2626' text-anchor='middle'>ADEN TV</text><text x='50' y='78' font-family='sans-serif' font-weight='900' font-size='10' fill='%230F172A' text-anchor='middle'>قناة عدن</text></svg>", 
    streamUrl: "https://aden-tv.net/live",
    isActive: true 
  },
  { 
    id: "ch-5", 
    name: "اليمن", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%230C2340'/><circle cx='50' cy='50' r='46' fill='none' stroke='%231E3A8A' stroke-width='2'/><text x='50' y='52' font-family='sans-serif' font-weight='900' font-size='22' fill='%23F59E0B' text-anchor='middle'>اليمن</text><text x='50' y='72' font-family='sans-serif' font-weight='700' font-size='11' fill='%2393C5FD' text-anchor='middle'>YEMEN</text></svg>", 
    streamUrl: "https://yementv.tv/live",
    isActive: true 
  },
  { 
    id: "ch-6", 
    name: "الميادين", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%23D97706'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23F59E0B' stroke-width='2'/><path d='M25 45Q50 25 75 45Q50 40 25 45Z' fill='white'/><text x='50' y='62' font-family='sans-serif' font-weight='900' font-size='15' fill='white' text-anchor='middle'>الميادين</text><text x='50' y='78' font-family='sans-serif' font-weight='700' font-size='9' fill='%23FEF3C7' text-anchor='middle'>MAYADEEN</text></svg>", 
    streamUrl: "https://almayadeen.net/live",
    isActive: true 
  },
];

// Fallback items to guarantee visually striking reference layout if database is sparse
const fallbackMostViewed: VideoItem[] = [
  {
    id: "mv-1",
    title: "مسيرات جماهيرية حاشدة في مناصرة الشعب الفلسطيني",
    category: "فعاليات",
    duration: "07:19",
    views: 32000,
    createdAt: Date.now() - 5 * 86400000,
    thumbnailUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80",
    url: "#",
  },
  {
    id: "mv-2",
    title: "الملاوي: نحن في مرحلة انتصار جديدة بتوفيق من الله",
    category: "لقاء خاص",
    duration: "12:36",
    views: 18000,
    createdAt: Date.now() - 3 * 86400000,
    thumbnailUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80",
    url: "#",
  },
  {
    id: "mv-3",
    title: "جهود القبائل اليمنية لفك الحصار عن محافظة تعز",
    category: "تقرير ميداني",
    duration: "08:45",
    views: 25000,
    createdAt: Date.now() - 2 * 86400000,
    thumbnailUrl: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80",
    url: "#",
  }
];

const fallbackLatest: VideoItem[] = [
  {
    id: "lt-1",
    title: "آثار العدوان في مديرية حيفان بعد القصف",
    category: "تقارير خاصة",
    duration: "05:18",
    views: 8000,
    createdAt: Date.now() - 4 * 3600000,
    thumbnailUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=500&q=80",
    url: "#",
  },
  {
    id: "lt-2",
    title: "قبائل اليمن تعلن الجاهزية لثورة الجياع",
    category: "تقرير ميداني",
    duration: "06:24",
    views: 11000,
    createdAt: Date.now() - 2 * 3600000,
    thumbnailUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=500&q=80",
    url: "#",
  },
  {
    id: "lt-3",
    title: "مشروع طريق عقبة القهر في مراحل متقدمة",
    category: "مشاريع حيوية",
    duration: "07:02",
    views: 9000,
    createdAt: Date.now() - 8 * 3600000,
    thumbnailUrl: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=500&q=80",
    url: "#",
  },
  {
    id: "lt-4",
    title: "الجهود الهندسية في إزالة المخلفات",
    category: "تقارير ميدانية",
    duration: "04:31",
    views: 6000,
    createdAt: Date.now() - 6 * 3600000,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80",
    url: "#",
  }
];

import { useLiveStream } from "../context/LiveStreamContext";

export function Watch() {
  const [rawVideos, setRawVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelTab, setChannelTab] = useState<"tv" | "radio">("tv");
  
  const {
    activeStream,
    isPlaying: isGlobalPlaying,
    isLoading: isGlobalLoading,
    isMuted: isGlobalMuted,
    volume: globalVolume,
    isPlayingInHero,
    setIsPlayingInHero,
    playStream: globalPlayStream,
    stopStream: globalStopStream,
    togglePlay: globalTogglePlay,
    setVolume: globalSetVolume,
    toggleMute: globalToggleMute
  } = useLiveStream();
  
  const [activeTvId, setActiveTvId] = useState<string | null>("ch-1");
  const [activeRadioId, setActiveRadioId] = useState<string | null>("rad-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "popular">("newest");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showAllMostViewed, setShowAllMostViewed] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);

  // Temporary states for modal
  const [tempSort, setTempSort] = useState<"newest" | "oldest" | "popular">("newest");

  const activeVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let channelsDone = false;
    let videosDone = false;

    const checkLoading = () => {
      if (active && channelsDone && videosDone) {
        setLoading(false);
      }
    };

    const unsubChannelsPromise = SyncService.syncCollection<LiveStream>("livestreams", (dbChannels) => {
      if (!active) return;
      const activeChannels = dbChannels.filter(c => c.isActive);
      if (activeChannels.length > 0) {
        activeChannels.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setChannels(activeChannels);
        const tv = activeChannels.filter(c => (c.type || "tv") === "tv");
        const radio = activeChannels.filter(c => c.type === "radio");
        if (tv.length > 0) setActiveTvId(prev => prev || tv[0].id || null);
        if (radio.length > 0) setActiveRadioId(prev => prev || radio[0].id || null);
      } else {
        setChannels(DEFAULT_CHANNELS as LiveStream[]);
      }
      channelsDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc" });

    const unsubVideosPromise = SyncService.syncCollection<VideoItem>("videos", (videoData) => {
      if (!active) return;
      setRawVideos(videoData);
      videosDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 50 });

    return () => {
      active = false;
      unsubChannelsPromise.then(unsub => unsub());
      unsubVideosPromise.then(unsub => unsub());
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.querySelector('main');
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollPos = Math.max(mainScroll, windowScroll);
      setIsScrolled(scrollPos > 120);
    };

    const mainEl = document.querySelector('main');
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mainEl) mainEl.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const tvChannels = useMemo(() => {
    return channels.filter(c => (c.type || "tv") === "tv");
  }, [channels]);

  const radioChannels = useMemo(() => {
    return channels.filter(c => c.type === "radio");
  }, [channels]);

  const displayChannels = useMemo(() => {
    return channelTab === "tv" ? tvChannels : radioChannels;
  }, [channelTab, tvChannels, radioChannels]);

  const activeTvChannel = useMemo(() => {
    return tvChannels.find(c => c.id === activeTvId) || tvChannels[0];
  }, [tvChannels, activeTvId]);

  const activeRadioStation = useMemo(() => {
    return radioChannels.find(c => c.id === activeRadioId) || radioChannels[0];
  }, [radioChannels, activeRadioId]);

  useEffect(() => {
    if (isScrolled && isPlayingInHero) {
      setIsPlayingInHero(false);
    }
  }, [isScrolled, isPlayingInHero, setIsPlayingInHero]);

  useEffect(() => {
    if (!isGlobalPlaying && isPlayingInHero) {
      setIsPlayingInHero(false);
    }
  }, [isGlobalPlaying, isPlayingInHero, setIsPlayingInHero]);

  const activeChannel = channelTab === "tv" ? activeTvChannel : activeRadioStation;

  // Dynamic category list extracted from actual video data
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    rawVideos.forEach(v => {
      if (v.category) {
        v.category.split(/[,/]/).forEach(c => {
          const trimmed = c.trim();
          if (trimmed) cats.add(trimmed);
        });
      }
    });
    return ["الكل", "الأحدث", ...Array.from(cats)];
  }, [rawVideos]);

  // Process search + classification filtering
  const filteredVideos = useMemo(() => {
    return rawVideos
      .filter(vid => {
        const matchesSearch = !searchQuery || vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || (vid.description && vid.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCat = selectedCategory === "الكل" || selectedCategory === "الأحدث" || !vid.category || vid.category.includes(selectedCategory);
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortOption === "newest") return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortOption === "oldest") return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortOption === "popular") return (b.views || 0) - (a.views || 0);
        return 0;
      });
  }, [rawVideos, searchQuery, selectedCategory, sortOption]);

  const mostViewedList = useMemo(() => {
    if (filteredVideos.length >= 3) {
      return [...filteredVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return fallbackMostViewed;
  }, [filteredVideos]);

  const latestList = useMemo(() => {
    if (filteredVideos.length >= 4) {
      return [...filteredVideos].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return fallbackLatest;
  }, [filteredVideos]);

  const handleRefresh = async () => {
    try {
      const freshChannels = await SyncService.refreshCollection<LiveStream>("livestreams", { orderByField: "createdAt", orderDirection: "desc" });
      const activeChannels = freshChannels.filter(c => c.isActive);
      if (activeChannels.length > 0) setChannels(activeChannels);

      const freshVideos = await SyncService.refreshCollection<VideoItem>("videos", { orderByField: "createdAt", orderDirection: "desc", limit: 50 });
      setRawVideos(freshVideos);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-white font-cairo px-2 sm:px-3 pt-3 pb-24 text-right transition-colors" dir="rtl" ref={activeVideoRef}>
        <div className="max-w-[760px] mx-auto space-y-6">

          {/* 1. HERO SECTION: DEDICATED TV AND RADIO VIEWERS */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3 pt-1"
          >
            {channelTab === "tv" ? (
              /* ================= TV VIEWER ================= */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white font-cairo">البث التلفزيوني</h2>
                  </div>
                </div>

                <div className="relative w-full aspect-video sm:aspect-[21/9] min-h-[240px] rounded-[28px] overflow-hidden bg-gradient-to-br from-[#061224] via-[#081b38] to-[#030914] border border-slate-800 shadow-[0_16px_40px_rgba(0,0,0,0.25)] flex flex-col justify-between p-4 sm:p-5 group">
                  
                  {/* Embedded Video Player Frame when Playing TV */}
                  {activeTvChannel && (activeTvChannel.url || activeTvChannel.streamUrl) && isPlayingInHero && activeStream?.id === activeTvChannel.id ? (
                    <div className="absolute inset-0 z-30 w-full h-full bg-black rounded-[28px] overflow-hidden flex flex-col items-center justify-center">
                      <iframe 
                        src={getEmbedUrl(activeTvChannel.url || activeTvChannel.streamUrl, true) || undefined}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />
                      <button 
                        onClick={() => {
                          setIsPlayingInHero(false);
                          globalStopStream();
                        }}
                        className="absolute top-3 right-3 z-40 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full border border-white/20 transition backdrop-blur-md cursor-pointer shadow-xl"
                        title="إغلاق البث"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}

                  {/* Ambient Glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Bar inside TV Viewer */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-3.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-lg border border-white/20">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span>قناة تلفزيونية • مباشر</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right max-w-[200px] sm:max-w-[260px]">
                        <h3 className="text-xs sm:text-sm font-black text-white leading-tight font-cairo truncate">
                          {activeTvChannel?.name || "القناة التلفزيونية"}
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>جودة HD المرئية</span>
                        </span>
                      </div>

                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 p-0.5 shadow-xl shrink-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={activeTvChannel?.iconUrl || "/splash_first.png"} 
                          alt={activeTvChannel?.name} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center Play Button for TV Viewer */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center pt-2 pb-1">
                    <motion.button 
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        if (activeTvChannel) {
                          globalPlayStream(activeTvChannel);
                          setIsPlayingInHero(true);
                          window.dispatchEvent(new CustomEvent("stop-quran-audio"));
                        }
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_0_35px_rgba(255,255,255,0.25)] flex items-center justify-center text-white cursor-pointer hover:bg-red-600/80 hover:border-red-400 transition-all duration-300"
                    >
                      <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current translate-x-[-2px]" />
                    </motion.button>
                  </div>

                  {/* Bottom Bar */}
                  <div className="relative z-10 flex items-center justify-center w-full pt-1">
                    <p className="text-white/90 text-xs sm:text-sm font-black text-center font-cairo backdrop-blur-sm bg-black/30 px-4 py-1 rounded-full border border-white/10">
                      انقر لتشغيل البث التلفزيوني المرئي
                    </p>
                  </div>
                </div>

                {/* TV Description */}
                {activeTvChannel?.description && (
                  <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl text-right shadow-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 font-cairo">
                      <Info className="w-4 h-4 text-red-500 shrink-0" />
                      <span>عن {activeTvChannel.name}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium font-cairo leading-relaxed">
                      {activeTvChannel.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ================= RADIO VIEWER ================= */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white font-cairo">البث الإذاعي</h2>
                  </div>
                </div>

                <div className="relative w-full rounded-[28px] overflow-hidden bg-gradient-to-br from-[#0c162c] via-[#101e3b] to-[#070e1c] border border-amber-500/20 shadow-[0_16px_40px_rgba(0,0,0,0.3)] p-5 sm:p-6 space-y-5 text-white">
                  {/* Subtle Background Soundwaves Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                  {/* Radio Header Info */}
                  <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-1 shrink-0 overflow-hidden shadow-lg">
                        <img 
                          src={activeRadioStation?.iconUrl || "/splash_first.png"} 
                          alt={activeRadioStation?.name} 
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div className="text-right min-w-0">
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1 border border-amber-500/30">
                          <Radio className="w-3 h-3 text-amber-400" />
                          <span>إذاعة صوتية</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white font-cairo truncate leading-tight">
                          {activeRadioStation?.name || "الإذاعة الصوتية"}
                        </h3>
                        <p className="text-xs text-slate-300 font-medium font-cairo truncate mt-0.5">
                          {activeRadioStation?.description || "بث إذاعي مباشر مستمر على مدار الساعة"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                      <span className="hidden sm:inline">بث مباشر</span>
                    </div>
                  </div>

                  {/* Animated Equalizer Waveform */}
                  <div className="relative z-10 flex items-center justify-center gap-1.5 h-10 py-1 opacity-90">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 sm:w-2 bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300 rounded-full"
                        animate={{ 
                          height: (activeStream?.id === activeRadioStation?.id && isGlobalPlaying) 
                            ? ["20%", "90%", "30%", "100%", "25%"] 
                            : "15%" 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.9, 
                          delay: i * 0.07, 
                          ease: "easeInOut" 
                        }}
                      />
                    ))}
                  </div>

                  {/* INTEGRATED RADIO AUDIO PLAYER CONTROLS */}
                  <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/15 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    
                    {/* Status Badge */}
                    <div className="text-right flex items-center gap-2">
                      {activeStream?.id === activeRadioStation?.id ? (
                        isGlobalLoading ? (
                          <div className="flex items-center gap-2 text-amber-400 font-black text-xs font-cairo">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري التحميل... أو الاتصال ضعيف</span>
                          </div>
                        ) : isGlobalPlaying ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs font-cairo">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span>جاري البث الصوتي المباشر الآن</span>
                          </div>
                        ) : (
                          <span className="text-amber-400/90 text-xs font-bold font-cairo">
                            اضغط للاستماع للبث الإذاعي المباشر
                          </span>
                        )
                      ) : (
                        <span className="text-amber-400/90 text-xs font-bold font-cairo">
                          اضغط للاستماع للبث الإذاعي المباشر
                        </span>
                      )}
                    </div>

                    {/* Audio Controls */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Volume Controls */}
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                        <button 
                          onClick={globalToggleMute}
                          className="text-slate-300 hover:text-white transition-colors p-1"
                          title={isGlobalMuted ? "إلغاء الكتم" : "كتم الصوت"}
                        >
                          {isGlobalMuted || globalVolume === 0 ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isGlobalMuted ? 0 : globalVolume}
                          onChange={(e) => globalSetVolume(parseFloat(e.target.value))}
                          className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {/* Main Play / Pause Button */}
                      <button
                        onClick={() => {
                          if (activeStream?.id === activeRadioStation?.id) {
                            globalTogglePlay();
                            setIsPlayingInHero(true);
                          } else if (activeRadioStation) {
                            globalPlayStream(activeRadioStation);
                            setIsPlayingInHero(true);
                          }
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0"
                        title={activeStream?.id === activeRadioStation?.id && isGlobalPlaying ? "إيقاف مؤقت" : "تشغيل الإذاعة"}
                        disabled={activeStream?.id === activeRadioStation?.id && isGlobalLoading}
                      >
                        {activeStream?.id === activeRadioStation?.id && isGlobalLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                        ) : activeStream?.id === activeRadioStation?.id && isGlobalPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Radio Description */}
                {activeRadioStation?.description && (
                  <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl text-right shadow-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 font-cairo">
                      <Radio className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>عن {activeRadioStation.name}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium font-cairo leading-relaxed">
                      {activeRadioStation.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* 2. CHANNELS / RADIOS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {channelTab === "tv" ? (
                  <Tv className="w-4 h-4 text-slate-800 dark:text-slate-200 stroke-[2.5]" />
                ) : (
                  <Radio className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                )}
                <h2 className="text-sm font-black text-slate-900 dark:text-white font-cairo">
                  {channelTab === "tv" ? "القنوات الفضائية المتاحة" : "الإذاعات الصوتية المتاحة"}
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {displayChannels.length} {channelTab === "tv" ? "قنوات" : "إذاعات"}
              </span>
            </div>

            {/* TAB SWITCHER: TV vs RADIO */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <button
                onClick={() => setChannelTab("tv")}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  channelTab === "tv" 
                    ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-md border border-slate-200/80 dark:border-slate-800" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>قنوات التلفزيون</span>
              </button>
              <button
                onClick={() => setChannelTab("radio")}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  channelTab === "radio" 
                    ? "bg-white dark:bg-slate-900 text-amber-500 dark:text-amber-400 shadow-md border border-slate-200/80 dark:border-slate-800" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>الإذاعات الصوتية</span>
              </button>
            </div>

            {/* CHANNELS GRID */}
            <div className="grid grid-cols-3 xs:grid-cols-6 gap-2 w-full">
              {displayChannels.length > 0 ? (
                displayChannels.map((ch) => {
                  const isSelected = channelTab === "tv" ? activeTvId === ch.id : activeRadioId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        if (channelTab === "tv") {
                          setActiveTvId(ch.id!);
                          globalPlayStream(ch);
                          setIsPlayingInHero(true);
                        } else {
                          setActiveRadioId(ch.id!);
                          globalPlayStream(ch);
                          setIsPlayingInHero(true);
                        }
                        if (isScrolled) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          const mainEl = document.querySelector('main');
                          if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`flex flex-col items-center justify-center py-3 px-1 rounded-[20px] bg-white dark:bg-slate-900 border transition-all cursor-pointer gap-2 shadow-xs ${
                        isSelected 
                          ? (channelTab === "tv" 
                              ? 'border-red-600 dark:border-red-500 bg-red-50/50 dark:bg-red-950/30 shadow-md ring-2 ring-red-600/20 scale-[1.03]'
                              : 'border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20 scale-[1.03]')
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 border shadow-2xs flex items-center justify-center overflow-hidden shrink-0 ${
                        isSelected 
                          ? (channelTab === "tv" ? 'border-red-500 bg-white' : 'border-amber-500 bg-white') 
                          : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <img 
                          src={ch.iconUrl || "/splash_first.png"} 
                          alt={ch.name} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=120&q=80';
                          }}
                        />
                        {isSelected && (
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            channelTab === "tv" ? "bg-red-600" : "bg-amber-500"
                          }`} />
                        )}
                      </div>
                      <span className={`text-[11px] font-bold font-cairo truncate max-w-full text-center px-1 ${
                        isSelected 
                          ? (channelTab === "tv" ? "text-red-700 dark:text-red-400 font-black" : "text-amber-600 dark:text-amber-400 font-black") 
                          : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {ch.name}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs font-bold text-slate-400">
                  لا توجد {channelTab === "tv" ? "قنوات" : "إذاعات"} متاحة حالياً
                </div>
              )}
            </div>
          </div>

          {/* SECTION TITLE SEPARATOR: "المحتوى المرئي" */}
          <div className="relative flex items-center justify-center pt-3 pb-1 my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative bg-white px-4 flex items-center gap-2 text-xs font-bold text-slate-500 font-cairo">
              <VideoIcon className="w-3.5 h-3.5 text-taiz-sky" />
              <span>المحتوى المرئي</span>
            </div>
          </div>

          {/* 4. FLOATING SEARCH FIELD & FILTER BUTTON ROW */}
          <div className="flex items-center gap-2.5 w-full pt-1">
            {/* Filter Circle Button (Far Left in RTL) */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md hover:bg-taiz-sky dark:hover:bg-taiz-sky transition-colors cursor-pointer"
              title="تصفية الفيديوهات"
            >
              <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Search Input Bar (Floating White Capsule) */}
            <div className="relative flex-1 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center px-4">
              <input 
                type="text"
                placeholder="ابحث عن فيديو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm font-medium pr-1 pl-8"
              />
              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute left-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="absolute left-4 w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* 5. MOST WATCHED SECTION (الأكثر مشاهدة) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-taiz-sky/10 dark:bg-taiz-sky/20 flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-taiz-sky fill-current" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-cairo">الأكثر مشاهدة</h2>
              </div>
              <button 
                onClick={() => setShowAllMostViewed(!showAllMostViewed)}
                className="text-[11px] font-black text-taiz-sky dark:text-taiz-sky flex items-center gap-1 hover:underline cursor-pointer bg-taiz-sky/5 dark:bg-taiz-sky/10 px-3 py-1.5 rounded-full border border-taiz-sky/10 transition-all hover:scale-105"
              >
                <span>{showAllMostViewed ? "عرض أقل" : "عرض المزيد"}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2x2 Grid Layout identical to Latest Videos */}
            <div className="grid grid-cols-2 gap-3">
              {(showAllMostViewed ? mostViewedList : mostViewedList.slice(0, 4)).map((vid) => (
                <Link
                  key={vid.id}
                  to={vid.isLeader ? `/leader/${vid.id}` : `/watch/${vid.id}`}
                  className="group flex flex-col bg-white rounded-[14px] border border-slate-200/80 shadow-soft hover:shadow-medium hover:border-taiz-sky/30 transition-all duration-300 p-2.5 gap-2.5"
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-video w-full rounded-[16px] overflow-hidden bg-slate-900">
                    <img 
                      src={vid.thumbnailUrl || "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=500&q=80"} 
                      alt={vid.title} 
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Category Pill Tag */}
                    {vid.category && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-gradient-to-r from-taiz-sky to-taiz-royal text-white text-[7px] sm:text-[7.5px] font-black px-1.5 py-[2px] rounded-[4px] shadow-sm tracking-wide">
                          {vid.category}
                        </span>
                      </div>
                    )}

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-taiz-sky shadow-md transition-all border border-white/40">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {vid.duration && (
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="bg-black/80 backdrop-blur-md text-white text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-white/20">
                          {vid.duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="flex flex-col justify-between flex-1 space-y-2">
                    {/* Formatted Title */}
                    <h3 className="text-slate-900 dark:text-white font-medium text-[11.5px] sm:text-xs leading-snug text-right line-clamp-2 group-hover:text-taiz-sky transition-colors min-h-[2.4em] flex items-start font-cairo">
                      {vid.title}
                    </h3>

                    {/* Bottom Metadata: Views count in brand color + Date */}
                    <div className="flex items-center justify-between text-[9.5px] sm:text-[10px] font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
                      {/* Views Badge */}
                      <span className="flex items-center gap-1 text-taiz-sky font-black">
                        <Eye className="w-3.5 h-3.5 text-taiz-sky shrink-0" />
                        <span>{formatViewsArabic(vid.views)} مشاهدة</span>
                      </span>

                      {/* Time ago */}
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{getRelativeTimeArabic(vid.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 6. LATEST VIDEOS SECTION (أحدث الفيديوهات) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-taiz-sky/10 dark:bg-taiz-sky/20 flex items-center justify-center">
                  <Clock className="w-4.5 h-4.5 text-taiz-sky stroke-[2.5]" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-cairo">أحدث الفيديوهات</h2>
              </div>
              <button 
                onClick={() => setShowAllLatest(!showAllLatest)}
                className="text-[11px] font-black text-taiz-sky dark:text-taiz-sky flex items-center gap-1 hover:underline cursor-pointer bg-taiz-sky/5 dark:bg-taiz-sky/10 px-3 py-1.5 rounded-full border border-taiz-sky/10 transition-all hover:scale-105"
              >
                <span>{showAllLatest ? "عرض أقل" : "عرض المزيد"}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-3">
              {(showAllLatest ? latestList : latestList.slice(0, 4)).map((vid) => (
                <Link
                  key={vid.id}
                  to={vid.isLeader ? `/leader/${vid.id}` : `/watch/${vid.id}`}
                  className="group flex flex-col bg-white rounded-[14px] border border-slate-200/80 shadow-soft hover:shadow-medium hover:border-taiz-sky/30 transition-all duration-300 p-2.5 gap-2.5"
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-video w-full rounded-[16px] overflow-hidden bg-slate-900">
                    <img 
                      src={vid.thumbnailUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=500&q=80"} 
                      alt={vid.title} 
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Category Pill Tag */}
                    {vid.category && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-gradient-to-r from-taiz-sky to-taiz-royal text-white text-[7px] sm:text-[7.5px] font-black px-1.5 py-[2px] rounded-[4px] shadow-sm tracking-wide">
                          {vid.category}
                        </span>
                      </div>
                    )}

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-taiz-sky shadow-md transition-all border border-white/40">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {vid.duration && (
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="bg-black/80 backdrop-blur-md text-white text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-white/20">
                          {vid.duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="flex flex-col justify-between flex-1 space-y-2">
                    {/* Formatted Title */}
                    <h3 className="text-slate-900 dark:text-white font-medium text-[11.5px] sm:text-xs leading-snug text-right line-clamp-2 group-hover:text-taiz-sky transition-colors min-h-[2.4em] flex items-start font-cairo">
                      {vid.title}
                    </h3>

                    {/* Bottom Metadata: Views count in brand color + Date */}
                    <div className="flex items-center justify-between text-[9.5px] sm:text-[10px] font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
                      {/* Views Badge */}
                      <span className="flex items-center gap-1 text-taiz-sky font-black">
                        <Eye className="w-3.5 h-3.5 text-taiz-sky shrink-0" />
                        <span>{formatViewsArabic(vid.views)} مشاهدة</span>
                      </span>

                      {/* Time ago */}
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{getRelativeTimeArabic(vid.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* FILTER MODAL */}
          <AnimatePresence>
            {isFilterModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 text-right space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 font-cairo">
                      <Filter className="w-5 h-5 text-taiz-sky" />
                      تصفية الفيديوهات
                    </h3>
                    <button 
                      onClick={() => setIsFilterModalOpen(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sorting */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">ترتيب حسب:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "newest", label: "الأحدث" },
                        { id: "oldest", label: "الأقدم" },
                        { id: "popular", label: "الرائج" }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setTempSort(opt.id as any)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            tempSort === opt.id 
                              ? 'bg-taiz-sky text-white shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply / Close buttons */}
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setSortOption(tempSort);
                        setIsFilterModalOpen(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-taiz-sky to-taiz-royal hover:scale-[1.02] text-white py-3 rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                    >
                      تطبيق التصفية
                    </button>
                    <button 
                      onClick={() => setIsFilterModalOpen(false)}
                      className="px-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </PullToRefresh>
  );
}
