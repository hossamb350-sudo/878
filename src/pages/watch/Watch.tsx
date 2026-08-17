import { useEffect, useState, useRef, useMemo } from "react";
import { SyncService } from "../../services/SyncService";
import { VideoItem, LiveStream, ChannelDisplayMode, LiveStreamSettings } from "../../types";
import { CategoryBadges } from "../../components/CategoryBadges";
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
  ChevronRight,
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
  Loader2,
  LayoutGrid,
  CreditCard,
  Layers,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PullToRefresh } from "../../components/PullToRefresh";
import { getEmbedUrl } from "../../utils/embed";
import { getRadioScheduleInfo } from "../../utils/yemenTime";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

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
    type: "tv",
    isActive: true 
  },
  { 
    id: "rad-1", 
    name: "إذاعة تعز FM", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%23D97706'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23F59E0B' stroke-width='2'/><path d='M30 40Q50 20 70 40' stroke='white' stroke-width='4' stroke-linecap='round'/><path d='M35 50Q50 35 65 50' stroke='white' stroke-width='4' stroke-linecap='round'/><circle cx='50' cy='62' r='8' fill='white'/><text x='50' y='88' font-family='sans-serif' font-weight='900' font-size='10' fill='white' text-anchor='middle'>إذاعة تعز FM</text></svg>", 
    streamUrl: "https://dc5.serverse.com/proxy/pbmhbvxs/stream",
    type: "radio",
    description: "",
    isActive: true 
  },
  { 
    id: "rad-2", 
    name: "إذاعة تعز العامة", 
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><circle cx='50' cy='50' r='50' fill='%230F172A'/><circle cx='50' cy='50' r='46' fill='none' stroke='%23D97706' stroke-width='2'/><path d='M30 45Q50 25 70 45' stroke='%23F59E0B' stroke-width='4' stroke-linecap='round'/><circle cx='50' cy='60' r='8' fill='%23F59E0B'/><text x='50' y='86' font-family='sans-serif' font-weight='900' font-size='9' fill='%23F59E0B' text-anchor='middle'>إذاعة تعز</text></svg>", 
    streamUrl: "http://168.119.10.136/proxy/taizradio?mp=/stream",
    type: "radio",
    description: "البث متوقف حالياً • يبدأ البث الإذاعي لإذاعة تعز يوميًا من الساعة الثامنة صباحًا وحتى الساعة العاشرة مساءً.",
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

import { useLiveStream } from "../../context/LiveStreamContext";

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
    toggleMute: globalToggleMute,
    streamError,
    isOutsideBroadcastHours
  } = useLiveStream();
  
  const [activeTvId, setActiveTvId] = useState<string | null>(() => {
    if (activeStream && (activeStream.type || "tv") === "tv") {
      return activeStream.id || null;
    }
    return null;
  });
  const [activeRadioId, setActiveRadioId] = useState<string | null>(() => {
    if (activeStream && activeStream.type === "radio") {
      return activeStream.id || null;
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "popular">("newest");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showAllMostViewed, setShowAllMostViewed] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);

  const [tvDisplayMode, setTvDisplayMode] = useState<ChannelDisplayMode>("grid");
  const [showBadges, setShowBadges] = useState<boolean>(true);
  const [showChannelCount, setShowChannelCount] = useState<boolean>(true);

  // Temporary states for modal
  const [tempSort, setTempSort] = useState<"newest" | "oldest" | "popular">("newest");

  const activeVideoRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let channelsDone = false;
    let videosDone = false;

    const checkLoading = () => {
      if (active && channelsDone && videosDone) {
        setLoading(false);
      }
    };

    // 1. Sync Channels with smart order sorting
    const unsubChannelsPromise = SyncService.syncCollection<LiveStream>("livestreams", (dbChannels) => {
      if (!active) return;
      const activeChannels = dbChannels.filter(c => c.isActive);
      if (activeChannels.length > 0) {
        // Sort by custom order primarily, then by createdAt
        activeChannels.sort((a, b) => {
          const orderA = a.order !== undefined && a.order !== null ? a.order : 999;
          const orderB = b.order !== undefined && b.order !== null ? b.order : 999;
          if (orderA !== orderB) return orderA - orderB;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
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

    // 2. Subscribe to Global LiveStream Display Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "livestream"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as LiveStreamSettings;
        if (data.tvDisplayMode) setTvDisplayMode(data.tvDisplayMode);
        if (data.showBadges !== undefined) setShowBadges(data.showBadges);
        if (data.showChannelCount !== undefined) setShowChannelCount(data.showChannelCount);
      }
    }, (err) => {
      console.warn("Could not read livestream settings:", err);
    });

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
      unsubSettings();
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

  // Sync selected channel/radio with global activeStream whenever activeStream changes
  useEffect(() => {
    if (activeStream) {
      if ((activeStream.type || "tv") === "tv") {
        setActiveTvId(activeStream.id || null);
      } else if (activeStream.type === "radio") {
        setActiveRadioId(activeStream.id || null);
      }
    }
  }, [activeStream]);

  const activeTvChannel = useMemo(() => {
    if (activeTvId) {
      const found = tvChannels.find(c => c.id === activeTvId || (c.name && c.name === activeTvId));
      if (found) return found;
    }
    return tvChannels[0] || null;
  }, [tvChannels, activeTvId]);

  const activeRadioStation = useMemo(() => {
    if (activeRadioId) {
      const found = radioChannels.find(c => c.id === activeRadioId || (c.name && c.name === activeRadioId));
      if (found) return found;
    }
    return radioChannels[0] || null;
  }, [radioChannels, activeRadioId]);

  useEffect(() => {
    if (isGlobalPlaying && !isPlayingInHero) {
      setIsPlayingInHero(true);
    } else if (!isGlobalPlaying && isPlayingInHero) {
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
        <div className="max-w-[760px] mx-auto space-y-3.5">

          {/* 0. HEADER & TAB SWITCHER (MOVED TO TOP) */}
          <div className="space-y-2 mb-3">
            {/* TAB SWITCHER: TV vs RADIO - COMPACT LUXURY BROADCAST CAPSULE */}
            <div className="relative p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-inner select-none" dir="rtl">
              <div className="flex items-center gap-1 relative z-10">
                {/* Tab 1: قنوات التلفزيون */}
                <button
                  type="button"
                  id="tab-switcher-tv"
                  onClick={() => setChannelTab("tv")}
                  className={`relative flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-between gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 active:scale-[0.98] ${
                    channelTab === "tv"
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {channelTab === "tv" && (
                    <motion.div
                      layoutId="activeBroadcastPill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-md shadow-slate-900/10 dark:shadow-black/50 border border-slate-200/80 dark:border-slate-700/80 -z-10"
                    />
                  )}
                  
                  {/* Right Side: Icon & Title */}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all ${
                      channelTab === "tv"
                        ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 shadow-2xs"
                        : "bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                    }`}>
                      <Tv className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        channelTab === "tv" ? "scale-110" : ""
                      }`} />
                    </div>

                    <span className="text-xs sm:text-sm font-black font-cairo leading-none">
                      قنوات التلفزيون
                    </span>
                  </div>

                  {/* Left Side: Live Indicator & Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-[5px] border ${
                      channelTab === "tv" 
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 border-slate-300/40 dark:border-slate-700"
                    }`}>
                      HD
                    </span>
                    <span className="relative flex h-2 w-2 shrink-0">
                      {channelTab === "tv" && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        channelTab === "tv" ? "bg-red-600 dark:bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.6)]" : "bg-slate-300 dark:bg-slate-600"
                      }`} />
                    </span>
                  </div>
                </button>

                {/* Tab 2: الإذاعات المتاحة */}
                <button
                  type="button"
                  id="tab-switcher-radio"
                  onClick={() => setChannelTab("radio")}
                  className={`relative flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-between gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 active:scale-[0.98] ${
                    channelTab === "radio"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {channelTab === "radio" && (
                    <motion.div
                      layoutId="activeBroadcastPill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-md shadow-slate-900/10 dark:shadow-black/50 border border-slate-200/80 dark:border-slate-700/80 -z-10"
                    />
                  )}
                  
                  {/* Right Side: Icon & Title */}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all ${
                      channelTab === "radio"
                        ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shadow-2xs"
                        : "bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                    }`}>
                      <Radio className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        channelTab === "radio" ? "scale-110" : ""
                      }`} />
                    </div>

                    <span className="text-xs sm:text-sm font-black font-cairo leading-none">
                      الإذاعات المتاحة
                    </span>
                  </div>

                  {/* Left Side: Audio Waves & FM Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-[5px] border ${
                      channelTab === "radio" 
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 border-slate-300/40 dark:border-slate-700"
                    }`}>
                      FM
                    </span>
                    {channelTab === "radio" ? (
                      <div className="flex items-end gap-0.5 h-3 shrink-0">
                        <span className="w-0.5 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]" style={{ animationDuration: '0.6s' }} />
                        <span className="w-0.5 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]" style={{ animationDuration: '0.9s' }} />
                        <span className="w-0.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]" style={{ animationDuration: '0.7s' }} />
                      </div>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300 dark:bg-slate-600 shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 1. HERO SECTION: DEDICATED TV AND RADIO VIEWERS */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2 pt-0.5"
          >
            {channelTab === "tv" ? (
              /* ================= TV VIEWER ================= */
              <div className="space-y-2">
                <div className="relative w-full aspect-video sm:aspect-[21/9] min-h-[240px] rounded-[28px] overflow-hidden bg-gradient-to-br from-[#061224] via-[#081b38] to-[#030914] border border-slate-800 shadow-[0_16px_40px_rgba(0,0,0,0.25)] flex flex-col justify-between p-4 sm:p-5 group">
                  
                  {/* Embedded Video Player Frame when Playing TV */}
                  {activeTvChannel && (activeTvChannel.url || activeTvChannel.streamUrl) && isPlayingInHero && activeStream?.id === activeTvChannel.id ? (
                    <div className="absolute inset-0 z-30 w-full h-full bg-black rounded-[28px] overflow-hidden flex flex-col items-center justify-center">
                      <iframe 
                        src={getEmbedUrl(activeTvChannel.url || activeTvChannel.streamUrl, true, isGlobalMuted) || undefined}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />

                      {/* Top Left Channel Logo & HD Badge (Overlay on TV Stream) */}
                      <div className="absolute top-2.5 left-2.5 z-40 flex items-center gap-1.5 bg-transparent pointer-events-none select-none drop-shadow-md" dir="ltr">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/80 border border-white/30 p-0.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                          <img 
                            src={activeTvChannel?.iconUrl || "/splash_first.png"} 
                            alt={activeTvChannel?.name} 
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <h3 className="text-[11px] sm:text-xs font-black text-white leading-tight font-cairo drop-shadow-sm">
                            {activeTvChannel?.name || "القناة التلفزيونية"}
                          </h3>
                          <span className="text-[8px] sm:text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5 leading-none drop-shadow-sm">
                            <span>جودة HD المرئية</span>
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          </span>
                        </div>
                      </div>

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

                  {/* Top Bar inside TV Viewer (Top Left Badge) */}
                  <div className="relative z-10 flex items-center justify-start w-full">
                    <div className="flex items-center gap-1.5 bg-transparent drop-shadow-md select-none" dir="ltr">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/80 border border-white/30 p-0.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={activeTvChannel?.iconUrl || "/splash_first.png"} 
                          alt={activeTvChannel?.name} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <h3 className="text-[11px] sm:text-xs font-black text-white leading-tight font-cairo truncate drop-shadow-sm">
                          {activeTvChannel?.name || "القناة التلفزيونية"}
                        </h3>
                        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5 leading-none drop-shadow-sm">
                          <span>جودة HD المرئية</span>
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        </span>
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
                      انقر لتشغيل البث التلفزيوني المباشر
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= RADIO VIEWER ================= */
              <div className="font-cairo" dir="rtl">
                {/* Main Card */}
                <div className="relative w-full rounded-[24px] overflow-hidden bg-[#fafafa] dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col items-center pt-6 pb-5 px-4">
                  {/* Dotted Pattern Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] dark:bg-[radial-gradient(#334155_2px,transparent_2px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

                  {/* Vertical faded lines under logo */}
                  <div className="absolute top-[90px] left-1/2 -translate-x-1/2 flex gap-[10px] h-[60px] opacity-30 dark:opacity-20 pointer-events-none">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-[2px] bg-gradient-to-b from-amber-300 to-transparent rounded-full" />
                    ))}
                  </div>

                  {/* Logo Area */}
                  <div className="relative z-10 flex items-center justify-center mb-4 mt-1">
                    {/* Outer Dashed Circle */}
                    <div className="absolute w-[120px] h-[120px] rounded-full border border-dashed border-amber-300 dark:border-amber-700/50 animate-[spin_30s_linear_infinite]" />
                    
                    {/* Dot on outer circle */}
                    <div className="absolute w-[120px] h-[120px] rounded-full animate-[spin_30s_linear_infinite]">
                      <div className="absolute top-1/2 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    </div>

                    {/* Inner Solid Circle */}
                    <div className="absolute w-[94px] h-[94px] rounded-full border border-amber-200 dark:border-amber-800/60" />

                    {/* Center Logo Card */}
                    <div className="relative w-[72px] h-[72px] bg-white dark:bg-slate-800 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.06)] dark:shadow-black/50 p-1.5 z-20">
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-700 relative">
                        <img 
                          src={activeRadioStation?.iconUrl || "/splash_first.png"} 
                          alt={activeRadioStation?.name} 
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Radio Name */}
                  <h3 className="relative z-10 text-2xl sm:text-[26px] font-black text-[#1e293b] dark:text-white mb-3 tracking-tight">
                    {activeRadioStation?.name || "إذاعة تعز"}
                  </h3>

                  {/* Live Status Badge */}
                  <div className="relative z-10 bg-[#fffbeb] dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 mb-4 shadow-sm border border-amber-100 dark:border-amber-800/50">
                    <span>استماع مباشر</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  </div>

                  {/* Description */}
                  {activeRadioStation?.description && (
                    <p className="relative z-10 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium max-w-[280px] sm:max-w-sm mb-5 leading-relaxed px-4">
                      {activeRadioStation.description}
                    </p>
                  )}

                  {/* Play/Listen Button */}
                  <button className="relative z-10 bg-white dark:bg-slate-800 rounded-full p-1.5 pr-2 pl-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-black/40 flex items-center justify-between min-w-[170px] border border-slate-100 dark:border-slate-700 mb-5 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
                    onClick={() => {
                      if (activeStream?.id === activeRadioStation?.id) {
                        globalTogglePlay();
                        setIsPlayingInHero(true);
                      } else if (activeRadioStation) {
                        globalPlayStream(activeRadioStation);
                        setIsPlayingInHero(true);
                      }
                    }}
                  >
                    {/* Play Button Icon */}
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                      {activeStream?.id === activeRadioStation?.id && isGlobalLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : activeStream?.id === activeRadioStation?.id && isGlobalPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                      )}
                    </div>

                    <span className="text-amber-600 dark:text-amber-500 font-bold text-sm px-3 flex-1 text-center">
                      {activeStream?.id === activeRadioStation?.id && isGlobalPlaying ? "إيقاف مؤقت" : "استمع الآن"}
                    </span>

                    {/* Equalizer / Loading */}
                    <div className="flex items-end gap-0.5 h-4 shrink-0 opacity-80">
                      {activeStream?.id === activeRadioStation?.id && isGlobalPlaying ? (
                        <>
                          <motion.div className="w-0.5 bg-amber-500 rounded-full" animate={{ height: ["40%", "100%", "60%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} />
                          <motion.div className="w-0.5 bg-amber-500 rounded-full" animate={{ height: ["80%", "40%", "100%", "60%", "80%"] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }} />
                          <motion.div className="w-0.5 bg-amber-500 rounded-full" animate={{ height: ["50%", "90%", "30%", "80%", "50%"] }} transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }} />
                        </>
                      ) : activeStream?.id === activeRadioStation?.id && isGlobalLoading ? (
                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                      ) : (
                        <>
                          <div className="w-0.5 h-2 bg-amber-500/40 rounded-full" />
                          <div className="w-0.5 h-3 bg-amber-500/40 rounded-full" />
                          <div className="w-0.5 h-1.5 bg-amber-500/40 rounded-full" />
                        </>
                      )}
                    </div>
                  </button>

                  {/* Volume Control */}
                  <div className="relative z-10 flex items-center justify-between w-full max-w-[220px] px-2 gap-3 mb-5">
                    <button 
                      onClick={globalToggleMute}
                      className="text-slate-500 hover:text-amber-500 transition-colors shrink-0"
                      title={isGlobalMuted ? "إلغاء الكتم" : "كتم الصوت"}
                    >
                      {isGlobalMuted || globalVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1 flex items-center" dir="ltr">
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isGlobalMuted ? 0 : globalVolume}
                        onChange={(e) => globalSetVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 outline-none focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* MERGED RADIO CHANNELS */}
                  <div className="relative z-10 w-full pt-3 mt-1">
                    <div className="flex flex-wrap gap-2 w-full justify-center items-center">
                      {radioChannels.map((ch) => {
                        const isSelected = !!activeRadioStation && (activeRadioStation.id === ch.id || activeRadioStation.name === ch.name);
                        return (
                          <button
                            key={ch.id || ch.name}
                            onClick={() => {
                              setActiveRadioId(ch.id || ch.name || null);
                              globalPlayStream(ch);
                              setIsPlayingInHero(true);
                            }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30 scale-105"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-white shadow-sm border border-slate-100 dark:border-slate-600">
                              <img
                                src={ch.iconUrl || "/splash_first.png"}
                                alt={ch.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs font-bold whitespace-nowrap leading-none pt-0.5">
                              {ch.name}
                            </span>
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* 2. CHANNELS SECTION (MULTI-MODE - TV ONLY) */}
          {channelTab === "tv" && (
            <div className="space-y-2.5">
              {/* View Mode Selector Icons */}
              <div className="flex items-center justify-end px-1">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => setTvDisplayMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tvDisplayMode === "grid" 
                        ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                    title="عرض شبكي"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setTvDisplayMode("carousel")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tvDisplayMode === "carousel" 
                        ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                    title="عرض شريط تمرير أفقي"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setTvDisplayMode("cards")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tvDisplayMode === "cards" 
                        ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                    title="عرض بطاقات فاخرة"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setTvDisplayMode("compact")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tvDisplayMode === "compact" 
                        ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                    title="عرض كبسولات مدمجة"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 1. GRID LAYOUT MODE */}
              {tvDisplayMode === "grid" && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-2.5 w-full">
                  {displayChannels.length > 0 ? (
                    displayChannels.map((ch) => {
                      const isSelected = !!activeTvChannel && (activeTvChannel.id === ch.id || activeTvChannel.name === ch.name);
                      return (
                        <button
                          key={ch.id || ch.name}
                          onClick={() => {
                            setActiveTvId(ch.id || ch.name || null);
                            globalPlayStream(ch);
                            setIsPlayingInHero(true);
                            if (isScrolled) {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              const mainEl = document.querySelector('main');
                              if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer gap-1.5 relative ${
                            isSelected 
                              ? 'bg-red-50/90 dark:bg-red-950/40 border-red-500 shadow-sm ring-1.5 ring-red-500/20 scale-[1.02]'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:scale-[1.01]'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-white dark:border-slate-900" />
                            </span>
                          )}

                          {showBadges && ch.badge && (
                            <span className="absolute -top-1.5 left-1 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white shadow-2xs">
                              {ch.badge}
                            </span>
                          )}

                          <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 border shadow-2xs flex items-center justify-center overflow-hidden shrink-0 transition-transform ${
                            isSelected 
                              ? 'border-red-500 bg-white ring-1.5 ring-red-500/20'
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
                          </div>

                          <span className={`text-[10px] sm:text-[11px] font-bold font-cairo truncate max-w-full text-center px-0.5 leading-tight ${
                            isSelected 
                              ? "text-red-700 dark:text-red-400 font-black"
                              : "text-slate-700 dark:text-slate-300"
                          }`}>
                            {ch.name}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-xs font-bold text-slate-400">
                      لا توجد قنوات متاحة حالياً
                    </div>
                  )}
                </div>
              )}

              {/* 2. CAROUSEL / SLIDER LAYOUT MODE */}
              {tvDisplayMode === "carousel" && (
                <div className="relative group w-full">
                  {/* Left & Right Scroll Buttons */}
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollBy({ left: -200, behavior: "smooth" });
                      }
                    }}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-white shadow-md border border-slate-200 dark:border-slate-700 hidden sm:flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollBy({ left: 200, behavior: "smooth" });
                      }
                    }}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-white shadow-md border border-slate-200 dark:border-slate-700 hidden sm:flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth snap-x"
                  >
                    {displayChannels.map((ch) => {
                      const isSelected = !!activeTvChannel && (activeTvChannel.id === ch.id || activeTvChannel.name === ch.name);
                      return (
                        <button
                          key={ch.id || ch.name}
                          onClick={() => {
                            setActiveTvId(ch.id || ch.name || null);
                            globalPlayStream(ch);
                            setIsPlayingInHero(true);
                            if (isScrolled) {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              const mainEl = document.querySelector('main');
                              if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 shrink-0 cursor-pointer snap-start ${
                            isSelected
                              ? "bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-500/20 scale-[1.03]"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-white overflow-hidden shrink-0 shadow-2xs border border-slate-100 dark:border-slate-700">
                            <img
                              src={ch.iconUrl || "/splash_first.png"}
                              alt={ch.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex flex-col text-right">
                            <span className="text-xs font-bold font-cairo whitespace-nowrap leading-tight">
                              {ch.name}
                            </span>
                            {showBadges && ch.badge && (
                              <span className={`text-[9px] font-black ${
                                isSelected ? "text-red-100" : "text-red-600 dark:text-red-400"
                              }`}>
                                {ch.badge}
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. LUXURY CARDS LAYOUT MODE */}
              {tvDisplayMode === "cards" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {displayChannels.map((ch) => {
                    const isSelected = !!activeTvChannel && (activeTvChannel.id === ch.id || activeTvChannel.name === ch.name);
                    return (
                      <div
                        key={ch.id || ch.name}
                        onClick={() => {
                          setActiveTvId(ch.id || ch.name || null);
                          globalPlayStream(ch);
                          setIsPlayingInHero(true);
                          if (isScrolled) {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            const mainEl = document.querySelector('main');
                            if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? "bg-red-50/80 dark:bg-red-950/40 border-red-500 shadow-md ring-2 ring-red-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-red-300 dark:hover:border-slate-700 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl p-0.5 border flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${
                            isSelected
                              ? "border-red-500 bg-white ring-2 ring-red-500/30"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          }`}>
                            <img
                              src={ch.iconUrl || "/splash_first.png"}
                              alt={ch.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          </div>

                          <div className="space-y-0.5 text-right">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-cairo">
                                {ch.name}
                              </h4>
                              {showBadges && ch.badge && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                                  {ch.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-cairo line-clamp-1 max-w-[170px]">
                              {ch.description || "بث مباشر عالي الجودة HD"}
                            </p>
                          </div>
                        </div>

                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. COMPACT PILLS LAYOUT MODE */}
              {tvDisplayMode === "compact" && (
                <div className="flex flex-wrap gap-2 w-full justify-center items-center py-1">
                  {displayChannels.map((ch) => {
                    const isSelected = !!activeTvChannel && (activeTvChannel.id === ch.id || activeTvChannel.name === ch.name);
                    return (
                      <button
                        key={ch.id || ch.name}
                        onClick={() => {
                          setActiveTvId(ch.id || ch.name || null);
                          globalPlayStream(ch);
                          setIsPlayingInHero(true);
                          if (isScrolled) {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            const mainEl = document.querySelector('main');
                            if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-600/20 scale-[1.03]"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-white border border-slate-100">
                          <img
                            src={ch.iconUrl || "/splash_first.png"}
                            alt={ch.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-bold font-cairo whitespace-nowrap leading-none">
                          {ch.name}
                        </span>
                        {showBadges && ch.badge && (
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${
                            isSelected ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                          }`}>
                            {ch.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION TITLE SEPARATOR: "المحتوى المرئي" */}
          <div className="relative flex items-center justify-center pt-1 pb-0.5 my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
            </div>
            <div className="relative bg-white dark:bg-slate-900 px-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 font-cairo">
              <VideoIcon className="w-3.5 h-3.5 text-taiz-sky" />
              <span>المحتوى المرئي</span>
            </div>
          </div>

          {/* 4. FLOATING SEARCH FIELD & FILTER BUTTON ROW */}
          <div className="flex items-center gap-2 w-full pt-0.5">
            {/* Filter Circle Button (Far Left in RTL) */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-taiz-sky dark:hover:bg-taiz-sky transition-colors cursor-pointer"
              title="تصفية الفيديوهات"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Search Input Bar (Floating White Capsule) */}
            <div className="relative flex-1 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center px-3.5">
              <input 
                type="text"
                placeholder="ابحث عن فيديو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs font-medium pr-1 pl-8"
              />
              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Search className="absolute left-3.5 w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </div>

          {/* 5. MOST WATCHED SECTION (الأكثر مشاهدة) */}
          <div className="space-y-2 pt-1 border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-2">
            <div className="flex items-center gap-2 px-1 select-none" dir="rtl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current" />
              </div>
              <div className="flex flex-col text-right">
                <h2 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">الأكثر مشاهدة</h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">الفيديوهات والتغطيات الأكثر رواجاً وتفاعلاً</p>
              </div>
              
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2 mr-3"></div>

              <button 
                onClick={() => setShowAllMostViewed(!showAllMostViewed)}
                className="text-[10px] sm:text-[11px] font-bold text-taiz-sky dark:text-taiz-sky flex items-center gap-1 hover:underline cursor-pointer bg-taiz-sky/5 dark:bg-taiz-sky/10 px-2.5 py-1 rounded-full border border-taiz-sky/10 transition-all hover:scale-105 shrink-0"
              >
                <span>{showAllMostViewed ? "عرض أقل" : "عرض المزيد"}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2x2 Grid Layout identical to Latest Videos */}
            <div className="grid grid-cols-2 gap-3">
              {(showAllMostViewed ? mostViewedList : mostViewedList.slice(0, 4)).map((vid, vIdx) => (
                <motion.div
                  key={vid.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.45, delay: vIdx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
                  className="h-full"
                >
                  <Link
                    to={vid.isLeader ? `/leader/${vid.id}` : `/watch/${vid.id}`}
                    className="group flex flex-col bg-white dark:bg-slate-900 rounded-[14px] border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-medium hover:border-taiz-sky/30 transition-all duration-300 p-2.5 gap-2.5 h-full"
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
                          <CategoryBadges category={vid.category} isSecondary={true} className="drop-shadow-sm" />
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
                </motion.div>
              ))}
            </div>
          </div>

          {/* 6. LATEST VIDEOS SECTION (أحدث الفيديوهات) */}
          <div className="space-y-2 pt-1 pb-2">
            <div className="flex items-center gap-2 px-1 select-none" dir="rtl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
              </div>
              <div className="flex flex-col text-right">
                <h2 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">أحدث الفيديوهات</h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">شاهد آخر التغطيات والتقارير المرئية</p>
              </div>
              
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2 mr-3"></div>

              <button 
                onClick={() => setShowAllLatest(!showAllLatest)}
                className="text-[10px] sm:text-[11px] font-bold text-taiz-sky dark:text-taiz-sky flex items-center gap-1 hover:underline cursor-pointer bg-taiz-sky/5 dark:bg-taiz-sky/10 px-2.5 py-1 rounded-full border border-taiz-sky/10 transition-all hover:scale-105 shrink-0"
              >
                <span>{showAllLatest ? "عرض أقل" : "عرض المزيد"}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-3">
              {(showAllLatest ? latestList : latestList.slice(0, 4)).map((vid, vIdx) => (
                <motion.div
                  key={vid.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.45, delay: vIdx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
                  className="h-full"
                >
                  <Link
                    to={vid.isLeader ? `/leader/${vid.id}` : `/watch/${vid.id}`}
                    className="group flex flex-col bg-white dark:bg-slate-900 rounded-[14px] border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-medium hover:border-taiz-sky/30 transition-all duration-300 p-2.5 gap-2.5 h-full"
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
                          <CategoryBadges category={vid.category} isSecondary={true} className="drop-shadow-sm" />
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
                </motion.div>
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
