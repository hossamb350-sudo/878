import { useEffect, useState, useRef, useMemo } from "react";
import { collection, query, orderBy, getDocs, onSnapshot, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { VideoItem, LiveStream } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  PlayCircle, 
  MonitorPlay, 
  Radio, 
  Search, 
  Clock, 
  Eye, 
  Tv, 
  SlidersHorizontal,
  FolderOpen,
  Calendar,
  X,
  Play,
  MoreVertical,
  Flame,
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PullToRefresh } from "../components/PullToRefresh";

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

export function Watch() {
  const [rawVideos, setRawVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlayingLive, setIsPlayingLive] = useState(false);
  
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "popular">("newest");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showAllMostViewed, setShowAllMostViewed] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);
  
  // Temporary states for modal
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  const [tempSort, setTempSort] = useState<"newest" | "oldest" | "popular">("newest");

  const activeVideoRef = useRef<HTMLDivElement>(null);
  const prevVideoIdsRef = useRef<string[]>([]);

  // Videos sorted using custom order ranking & creation timestamp
  const videos = useMemo(() => {
    const sorted = [...rawVideos];
    sorted.sort((a, b) => {
      const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
      const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return b.createdAt - a.createdAt;
    });
    return sorted;
  }, [rawVideos]);

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
      activeChannels.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setChannels(activeChannels);
      setActiveChannelId(prev => {
        if (!prev && activeChannels.length > 0) return activeChannels[0].id || null;
        return prev;
      });
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

  // Auto-scroll to newly added videos in the Watch page list/grid
  useEffect(() => {
    if (videos.length === 0) return;

    // Check if we already loaded videos before (meaning this is a dynamic update/addition)
    if (prevVideoIdsRef.current.length > 0) {
      const newVideo = videos.find(v => !prevVideoIdsRef.current.includes(v.id));
      if (newVideo) {
        // Scroll to the newly added video smoothly
        setTimeout(() => {
          const element = document.getElementById(`watch-video-${newVideo.id}`);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest"
            });
          }
        }, 300); // Small timeout to ensure the DOM element is rendered and styled
      }
    }

    // Keep track of the current video IDs for future additions
    prevVideoIdsRef.current = videos.map(v => v.id);
  }, [videos]);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Parse embed URLs for any YouTube or Custom stream
  const getEmbedUrl = (url: string, autoplay: boolean = false) => {
    if (!url) return undefined;
    let videoId = "";
    
    // Youtube match (support live streams, normal watch, watch URL strings)
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${autoplay ? 1 : 0}&rel=0`;
      }
    }
    
    // Almasirah or generic Peertube embed link conversion
    if (url.includes("/w/") || url.includes("/videos/watch/")) {
      let embedUrl = url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
      if (autoplay) {
        embedUrl += embedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
      }
      return embedUrl;
    }
    
    return url;
  };

  // Generate dynamic categories list
  const uniqueCategories = Array.from(
    new Set(videos.map(v => v.category).filter(Boolean))
  ) as string[];

  // Process search + classification filtering
  const filteredVideos = videos
    .filter(vid => {
      const matchesSearch = vid.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategories.length === 0 || (vid.category && selectedCategories.includes(vid.category));
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortOption === "newest") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOption === "oldest") return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOption === "popular") return (b.views || 0) - (a.views || 0);
      return 0;
    });

  const mostViewedVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [filteredVideos]);

  const latestVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [filteredVideos]);

  const openFilterModal = () => {
    setTempCategories([...selectedCategories]);
    setTempSort(sortOption);
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedCategories(tempCategories);
    setSortOption(tempSort);
    setIsFilterModalOpen(false);
  };

  const toggleTempCategory = (cat: string) => {
    setTempCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleRefresh = async () => {
    try {
      const freshChannels = await SyncService.refreshCollection<LiveStream>("livestreams", { orderByField: "createdAt", orderDirection: "desc" });
      const activeChannels = freshChannels.filter(c => c.isActive);
      activeChannels.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setChannels(activeChannels);
      setActiveChannelId(prev => {
        if (!prev && activeChannels.length > 0) return activeChannels[0].id || null;
        return prev;
      });

      const freshVideos = await SyncService.refreshCollection<VideoItem>("videos", { orderByField: "createdAt", orderDirection: "desc", limit: 50 });
      setRawVideos(freshVideos);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 font-sans bg-[#f4f7fc]" ref={activeVideoRef}>
      
      {/* Immersive Header Block with Status Indicators */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2.5 rtl" style={{ direction: "rtl" }}>
        <div className="flex items-center gap-3">
          <div className="relative bg-blue-50/70 p-2 rounded-xl border border-blue-100/20">
            <Tv className="w-7 h-7 text-red-600 stroke-[2]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-red-600 fill-blue-600 translate-x-[0.5px] translate-y-[-0.5px]" />
            </div>
          </div>
          <div className="flex flex-col text-right">
            <h1 className="text-lg sm:text-xl font-black text-slate-950 font-cairo leading-none">شاهد</h1>
            <p className="text-[10px] text-slate-500 font-bold font-cairo mt-0.5">بث مباشر • محتوى مرئي متجدد</p>
          </div>
        </div>
      </div>

      {/* 1. Live TV Section Header */}
      <div className="flex items-center gap-1.5 mb-2 text-right rtl" style={{ direction: "rtl" }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
        <h2 className="text-xs font-black text-slate-900 font-cairo">البث المباشر</h2>
      </div>

      {/* Hero Live Stream Visual Frame Panel */}
      <div className="mb-4 w-full bg-[#0a0f24] rounded-3xl p-3.5 sm:p-5 shadow-xl border border-slate-800/60 relative overflow-hidden rtl" style={{ direction: "rtl" }}>
        
        {/* Background decorative elements */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col w-full h-full gap-3">
          {/* Top Bar: Live Info Panel */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 w-full">
            {/* Right Side: Channel details */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-700/25 rounded-full border border-red-500/20 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                {activeChannel?.iconUrl ? (
                  <img src={activeChannel.iconUrl} alt={activeChannel.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-[10px] font-cairo">مباشر</span>
                )}
              </div>
              <div className="text-right">
                <h3 className="text-xs sm:text-sm font-black text-white font-cairo leading-tight">
                  {activeChannel ? activeChannel.name : "قناة البث المباشر"}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400 text-[9px] font-bold font-cairo">يعمل الآن</span>
                </div>
              </div>
            </div>

            {/* Left Side: Live Badge */}
            <div className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black shadow-lg shadow-red-600/30">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
              مباشر
            </div>
          </div>

          {/* Player Area: Full Width Inside Card */}
          <div className="w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 relative shadow-2xl group">
            {activeChannel && activeChannel.url ? (
              isPlayingLive ? (
                <iframe 
                  src={getEmbedUrl(activeChannel.url, true)}
                  className="w-full h-full border-0 select-text"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div 
                  onClick={() => setIsPlayingLive(true)}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 bg-gradient-to-t from-black/80 via-slate-900/40 to-black/30 hover:from-black/90 hover:via-slate-900/30 relative"
                >
                  {/* Glowing custom play button wrapper */}
                  <div className="relative z-10 p-4 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-300 transform group-hover:scale-110 shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white translate-x-[1px]" />
                  </div>
                  
                  <p className="z-10 mt-2 text-white font-black text-xs tracking-wide font-cairo px-4">
                    انقر لتشغيل البث الحي
                  </p>
                </div>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 p-6">
                <Tv className="w-8 h-8 mb-2 text-slate-600 animate-bounce" />
                <p className="font-black text-slate-400 text-[10px] font-cairo">البث المباشر غير متاح حالياً</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. Channels Section Header */}
      <div className="flex items-center gap-1.5 mb-2 text-right rtl" style={{ direction: "rtl" }}>
        <Tv className="w-3.5 h-3.5 text-slate-800 stroke-[2.5]" />
        <h2 className="text-xs font-black text-slate-900 font-cairo">القنوات</h2>
      </div>

      {/* Horizontal Channels grid strip (displayed in 1 row) */}
      <div className="mb-0 w-full">
        <div 
          className="grid grid-cols-6 gap-1.5 sm:gap-2.5 w-full rtl" 
          style={{ direction: "rtl" }}
        >
          {(() => {
            const order = ["المسيرة", "المسيرة مباشر", "اليمن", "عدن", "الساحات", "الميادين"];
            const sortedChannels = [...channels].sort((a, b) => {
              const nameA = a.name ? a.name.trim() : "";
              const nameB = b.name ? b.name.trim() : "";
              
              const isAAlMasirah = nameA === "المسيرة" || nameA === "المسيرة مباشر";
              const isBAlMasirah = nameB === "المسيرة" || nameB === "المسيرة مباشر";

              if (isAAlMasirah && !isBAlMasirah) return -1;
              if (!isAAlMasirah && isBAlMasirah) return 1;
              if (isAAlMasirah && isBAlMasirah) {
                 if (nameA === "المسيرة") return -1;
                 return 1;
              }

              const indexA = order.findIndex(o => nameA.includes(o));
              const indexB = order.findIndex(o => nameB.includes(o));
              
              if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB);
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });

            return sortedChannels.map((ch) => {
              const isSelected = activeChannelId === ch.id;
              
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannelId(ch.id!);
                    setIsPlayingLive(true);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 sm:py-2.5 bg-white rounded-xl border transition-all duration-300 gap-1.5 w-full cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 shadow-[0_4px_12px_rgba(30,66,150,0.06)] scale-[1.02]' 
                      : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                  }`}
                >
                  <div className="relative shrink-0">
                    {ch.iconUrl ? (
                      <img src={ch.iconUrl} alt={ch.name} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover p-0.5 bg-white border border-slate-100" />
                    ) : (
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Radio className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    {/* Red live indicator dot on the bottom-right */}
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-600 rounded-full border border-white shadow-md animate-pulse" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-800 font-cairo truncate max-w-full text-center">
                    {ch.name}
                  </span>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* 3. Media Content Header Banner Divider */}
      <div className="relative flex items-center justify-center mt-2.5 mb-3.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/60"></div>
        </div>
        <div className="relative flex items-center gap-1.5 bg-[#f4f7fc] px-3.5 py-0.5 rounded-full text-slate-800 font-black font-cairo text-[10px] sm:text-xs border border-slate-100 shadow-sm">
          <MonitorPlay className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
          <span>المحتوى المرئي</span>
        </div>
      </div>

      {/* 4. Controls Block: Search & Filter */}
      <div className="flex items-center gap-3 w-full mb-5 rtl" style={{ direction: "rtl" }}>
        {/* Search Bar (appears on the right in RTL) */}
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="ابحث عن فيديو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-11 py-3.5 bg-white text-slate-800 text-xs sm:text-sm font-bold rounded-full border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-inner placeholder-slate-400 text-right font-cairo"
          />
          <Search className="absolute right-4 top-4.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Filter Button (appears on the left in RTL) */}
        <button 
          onClick={openFilterModal}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#f0f4fa] hover:bg-blue-100/50 text-[#1a56db] rounded-full transition-all text-xs sm:text-sm font-black border border-blue-50/50 cursor-pointer shrink-0 font-cairo"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
          <span>فلترة</span>
          {selectedCategories.length > 0 && (
            <span className="bg-[#e62222] text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
              {selectedCategories.length}
            </span>
          )}
        </button>
      </div>

      {/* 5. Removed redundant category filter pills */}
      
      {/* 6. Video Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">جاري تحميل المكتبة المرئية...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-8 rtl" style={{ direction: "rtl" }}>
          <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-pulse" />
          <p className="font-black text-sm text-slate-700 mb-1 font-cairo">لا توجد وسائط ومواد إعلامية تطابق خياراتك</p>
          <p className="text-xs text-slate-400 font-bold font-cairo">يرجى تجربة كلمة بحث مغايرة أو تصفية تصنيفات أخرى</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* A. Most Viewed Section */}
          {mostViewedVideos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5 mt-2 rtl" style={{ direction: "rtl" }}>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-red-50 rounded-xl text-red-500 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-red-500 text-red-500 stroke-[2]" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 font-cairo">الأكثر مشاهدة</h2>
                </div>
                <button 
                  onClick={() => setShowAllMostViewed(!showAllMostViewed)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-black text-blue-600 hover:text-blue-700 font-cairo cursor-pointer"
                >
                  <span>عرض المزيد</span>
                  <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${showAllMostViewed ? 'rotate-90' : ''}`} />
                </button>
              </div>

              <motion.div 
                layout
                className="grid grid-cols-2 gap-3 sm:gap-4 rtl"
                style={{ direction: "rtl" }}
              >
                <AnimatePresence mode="popLayout">
                  {(showAllMostViewed ? mostViewedVideos : mostViewedVideos.slice(0, 4)).map(vid => {
                    const formatArabicViews = (views: number) => {
                       const v = views || 0;
                       if (v >= 1000000) {
                         return `${(v / 1000000).toFixed(1).replace(".0", "")} مليون`;
                       }
                       if (v >= 1000) {
                         return `${(v / 1000).toFixed(1).replace(".0", "")} ألف`;
                       }
                       return `${v}`;
                    };
                    const formattedViews = formatArabicViews(vid.views);
                    const relativeTime = getRelativeTimeArabic(vid.createdAt);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        key={`mv-${vid.id}`}
                      >
                        <Link 
                          id={`watch-video-mv-${vid.id}`}
                          to={vid.isLeader ? `/leader/${vid.id}` : `/watch/${vid.id}`} 
                          className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200/80 transition-all duration-300 group block overflow-hidden flex flex-col cursor-pointer"
                        >
                          {/* Immersive Thumbnail */}
                          <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden rounded-t-xl">
                            {vid.thumbnailUrl ? (
                              <img 
                                src={vid.thumbnailUrl} 
                                alt={vid.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out" 
                                loading="lazy" 
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <Radio className="w-6 h-6 text-white/20" />
                              </div>
                            )}

                            {/* Translucent overlay for play action */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border border-white/20">
                                <Play className="w-3.5 h-3.5 fill-white text-white translate-x-[1px]" />
                              </div>
                            </div>

                            {/* Category Pill tag (top-right) - RESTORED */}
                            {vid.category && (
                              <div className="absolute top-1.5 right-1.5 flex">
                                <span className="bg-slate-950/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/5 font-cairo">
                                  {vid.category}
                                </span>
                              </div>
                            )}

                            {/* Video Duration (bottom-left) */}
                            {vid.duration && (
                              <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10 shadow-sm">
                                <Clock className="w-2.5 h-2.5 text-red-600" />
                                <span>{vid.duration}</span>
                              </div>
                            )}

                            {/* Video Views (bottom-right) */}
                            <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10 shadow-sm font-cairo">
                              <Eye className="w-2.5 h-2.5 text-red-600" />
                              <span>{formattedViews}</span>
                              <span className="hidden xs:inline">&nbsp;مشاهدة</span>
                            </div>
                          </div>

                          {/* Meta Info */}
                          <div className="p-2 sm:p-2.5 flex-1 flex flex-col gap-1 text-right justify-start">
                            <h4 className="text-slate-900 font-bold leading-tight line-clamp-3 text-[10px] sm:text-xs lg:text-[13px] group-hover:text-blue-600 transition-colors font-cairo overflow-hidden">
                              {vid.title}
                            </h4>
                            
                            <div className="flex items-center gap-1 text-[8px] sm:text-[9.5px] text-slate-400 font-medium font-cairo mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{relativeTime}</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* B. Latest Videos Section */}
          {latestVideos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5 mt-6 rtl" style={{ direction: "rtl" }}>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 rounded-xl text-blue-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-600 stroke-[2.5]" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 font-cairo">أحدث الفيديوهات</h2>
                </div>
                <button 
                  onClick={() => setShowAllLatest(!showAllLatest)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-black text-blue-600 hover:text-blue-700 font-cairo cursor-pointer"
                >
                  <span>عرض المزيد</span>
                  <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${showAllLatest ? 'rotate-90' : ''}`} />
                </button>
              </div>

              <motion.div 
                layout
                className="grid grid-cols-2 gap-3 sm:gap-4 rtl"
                style={{ direction: "rtl" }}
              >
                <AnimatePresence mode="popLayout">
                  {(showAllLatest ? latestVideos : latestVideos.slice(0, 4)).map(vid => {
                    const formatArabicViews = (views: number) => {
                      const v = views || 0;
                      if (v >= 1000000) {
                        return `${(v / 1000000).toFixed(1).replace(".0", "")} مليون`;
                      }
                      if (v >= 1000) {
                        return `${(v / 1000).toFixed(1).replace(".0", "")} ألف`;
                      }
                      return `${v}`;
                    };
                    const formattedViews = formatArabicViews(vid.views);
                    const relativeTime = getRelativeTimeArabic(vid.createdAt);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        key={`lt-${vid.id}`}
                      >
                        <Link 
                          id={`watch-video-lt-${vid.id}`}
                          to={vid.isLeader ? `/leader/${vid.id}` : `/watch/${vid.id}`} 
                          className="bg-white rounded-none border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200/80 transition-all duration-300 group block overflow-hidden flex flex-col cursor-pointer"
                        >
                          {/* Immersive Thumbnail */}
                          <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden rounded-none">
                            {vid.thumbnailUrl ? (
                              <img 
                                src={vid.thumbnailUrl} 
                                alt={vid.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out" 
                                loading="lazy" 
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <Radio className="w-6 h-6 text-white/20" />
                              </div>
                            )}

                            {/* Translucent overlay for play action */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border border-white/20">
                                <Play className="w-3.5 h-3.5 fill-white text-white translate-x-[1px]" />
                              </div>
                            </div>

                            {/* Category Pill tag (top-right) - RESTORED */}
                            {vid.category && (
                              <div className="absolute top-1.5 right-1.5 flex">
                                <span className="bg-slate-950/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/5 font-cairo">
                                  {vid.category}
                                </span>
                              </div>
                            )}

                            {/* Video Duration (bottom-left) */}
                            {vid.duration && (
                              <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10 shadow-sm">
                                <Clock className="w-2.5 h-2.5 text-red-600" />
                                <span>{vid.duration}</span>
                              </div>
                            )}

                            {/* Video Views (bottom-right) */}
                            <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10 shadow-sm font-cairo font-black">
                              <Eye className="w-2.5 h-2.5 text-red-600" />
                              <span>{formattedViews}</span>
                              <span className="hidden xs:inline">&nbsp;مشاهدة</span>
                            </div>
                          </div>

                          {/* Meta Info */}
                          <div className="p-2 sm:p-2.5 flex-1 flex flex-col gap-1 text-right justify-start">
                            <h4 className="text-slate-900 font-bold leading-tight line-clamp-3 text-[10px] sm:text-xs lg:text-[13px] group-hover:text-blue-600 transition-colors font-cairo overflow-hidden">
                              {vid.title}
                            </h4>
                            
                            <div className="flex items-center gap-1 text-[8px] sm:text-[9.5px] text-slate-400 font-medium font-cairo mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{relativeTime}</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* 7. Beautiful Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm" dir="rtl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 text-right"
             >
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                   <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
                      <SlidersHorizontal className="w-5 h-5 text-red-600 stroke-[2.5]" />
                      تصفية وتصنيف المواد
                   </h3>
                   <button onClick={() => setIsFilterModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-1">
                   {/* Sorting options */}
                   <div>
                      <span className="text-xs font-black text-slate-800 block mb-3 font-cairo">ترتيب حسب:</span>
                      <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: "newest", label: "الأحدث" },
                           { id: "oldest", label: "الأقدم" },
                           { id: "popular", label: "الرائج" }
                         ].map(opt => (
                           <button
                             key={opt.id}
                             onClick={() => setTempSort(opt.id as any)}
                             className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer font-cairo ${
                               tempSort === opt.id 
                                 ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                 : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                             }`}
                           >
                             {opt.label}
                           </button>
                         ))}
                      </div>
                   </div>

                   {/* Categories selection */}
                   <div>
                      <span className="text-xs font-black text-slate-800 block mb-3 font-cairo">التصنيفات:</span>
                      <div className="flex flex-wrap gap-2">
                         <button
                           onClick={() => setTempCategories([])}
                           className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer font-cairo ${
                             tempCategories.length === 0 
                               ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                               : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                           }`}
                         >
                           الكل
                         </button>
                         {uniqueCategories.map(cat => (
                           <button
                             key={cat}
                             onClick={() => toggleTempCategory(cat)}
                             className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer font-cairo ${
                               tempCategories.includes(cat) 
                                 ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                 : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                             }`}
                           >
                             {cat}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="mt-8 flex gap-3">
                   <button 
                     onClick={applyFilters}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-blue-500/25 transition duration-200 cursor-pointer font-cairo"
                   >
                      تطبيق التصفية
                   </button>
                   <button 
                     onClick={() => setIsFilterModalOpen(false)}
                     className="px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl text-sm font-black border border-slate-100 transition cursor-pointer font-cairo"
                   >
                      إلغاء
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
    </PullToRefresh>
  );
}
