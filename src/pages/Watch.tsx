import { useEffect, useState, useRef } from "react";
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
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

export function Watch() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
      const sorted = [...videoData];
      sorted.sort((a, b) => {
        const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
        const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.createdAt - a.createdAt;
      });
      setVideos(sorted);
      videosDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 50 });

    return () => {
      active = false;
      unsubChannelsPromise.then(unsub => unsub());
      unsubVideosPromise.then(unsub => unsub());
    };
  }, []);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Parse embed URLs for any YouTube or Custom stream
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    
    // Youtube match (support live streams, normal watch, watch URL strings)
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
      }
    }
    
    // Almasirah or generic Peertube embed link conversion
    if (url.includes("/w/") || url.includes("/videos/watch/")) {
      return url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
    }
    
    return url;
  };

  // Generate dynamic categories list
  const uniqueCategories = Array.from(
    new Set(videos.map(v => v.category).filter(Boolean))
  ) as string[];

  // Process search + classification filtering
  const filteredVideos = videos.filter(vid => {
    const matchesSearch = vid.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || vid.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-5 pb-20 font-sans" ref={activeVideoRef}>
      
      {/* Immersive Header Block with Status Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-zinc-900 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] dark:text-white select-none">البث المباشر الميداني</h1>
        </div>

        {channels.length > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 px-3 py-1 rounded-xl text-xs font-black border border-red-500/20 shadow-sm">
             <Radio className="w-3.5 h-3.5 animate-pulse" />
             <span>{channels.length} قنوات بث</span>
          </div>
        )}
      </div>

      {/* Hero Live Stream Visual Frame Panel */}
      <div className="mb-12 w-full bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-150 dark:border-zinc-900/40 relative">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600/95 text-white px-3 py-1.5 rounded-full text-[11px] font-black shadow-md tracking-wider">
           <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
           مباشر
        </div>
        
        <div className="aspect-video w-full bg-zinc-900">
           {activeChannel && activeChannel.url ? (
              <iframe 
                 src={getEmbedUrl(activeChannel.url)}
                 className="w-full h-full border-0 select-text"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                 allowFullScreen
              ></iframe>
           ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-3 border-b border-zinc-900">
                 <Tv className="w-12 h-12 mb-2 text-zinc-600 dark:text-zinc-800 animate-bounce" />
                 <p className="font-extrabold text-stone-300 dark:text-zinc-500 text-sm">البث المباشر لهذه القناة غير متاح في الوقت الحالي</p>
                 <p className="text-xs text-stone-400 dark:text-zinc-600">الرجاء اختيار قناة أخرى أو مراجعة الجدول لاحقاً</p>
              </div>
           )}
        </div>

        {/* Channel Metadata & Interactive Custom Scroller */}
        <div className="bg-white dark:bg-black p-5 sm:p-6 border-t border-stone-100 dark:border-zinc-950 pb-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
               <h2 className="text-lg sm:text-1.5xl font-black text-[#111827] dark:text-white flex items-center gap-2">
                 {activeChannel?.iconUrl && (
                    <img src={activeChannel.iconUrl} alt={activeChannel.name} className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-zinc-900 border" />
                 )}
                 {activeChannel ? `قناة البث: ${activeChannel.name}` : "اختر قناة للبث المباشر"}
               </h2>
               <p className="text-xs text-stone-400 dark:text-zinc-500 font-bold mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" />
                  يتم سحب التحديثات والبث التشاركي في الوقت الفعلي
               </p>
            </div>
          </div>

          {/* Quick Mini Channels selector slider with custom aesthetic items */}
          <div className="overflow-x-auto select-none no-scrollbar pb-1">
            <div className="flex items-center gap-3.5 min-w-max">
              {channels.map((ch) => {
                const isSelected = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id!)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shadow-sm ${
                      isSelected 
                        ? 'bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/35 ring-2 ring-red-500/10' 
                        : 'bg-stone-50/70 hover:bg-stone-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border-stone-200/60 dark:border-zinc-900 text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    {ch.iconUrl ? (
                      <img src={ch.iconUrl} alt={ch.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <Radio className="w-4 h-4 shrink-0" />
                    )}
                    <span className="text-xs font-black truncate max-w-[120px]">
                      {ch.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= VIDEOS & COGNATE REPORTS SECTION ================= */}
      <div className="space-y-6">
        
        {/* Top Control Panel Wrapper: Heading, category tabs, and real search */}
        <div className="bg-stone-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-3xl border border-stone-150 dark:border-zinc-900/60 shadow-sm space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-red-600 shrink-0" />
              <h2 className="font-extrabold text-xl text-[#111827] dark:text-white select-none">المكتبة الإعلامية والتقارير</h2>
              <span className="text-[10px] bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded shadow-sm mr-2 animate-bounce">محدّث</span>
            </div>

            {/* Innovative Search input inside Watch section */}
            <div className="relative w-full md:max-w-xs">
              <input 
                type="text"
                placeholder="ابحث عن تقرير، زامل، أو وثائقي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 text-sm font-semibold rounded-2xl border border-stone-200/70 dark:border-zinc-800/60 focus:outline-red-500/80 transition shadow-inner dark:shadow-none placeholder-stone-400 dark:placeholder-zinc-500"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Filtering Tabs (المصنفات السلسة) */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-stone-200/50 dark:border-zinc-900 pt-3">
            <span className="text-[11px] font-black text-stone-400 dark:text-zinc-500 flex items-center gap-1 ml-3 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              تصنيف المواد:
            </span>
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none font-bold">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${selectedCategory === "all" ? "bg-red-600 text-white shadow" : "bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 border dark:border-zinc-800"}`}
                >
                  الكل
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${selectedCategory === cat ? "bg-red-600 text-white shadow" : "bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 border dark:border-zinc-800"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
          </div>
        </div>

        {/* VIDEOS LIST GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-400">جاري إرساء المكتبة الإعلامية...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 text-stone-500 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-dashed border-stone-200 dark:border-zinc-900 p-8">
            <FolderOpen className="w-12 h-12 mx-auto text-stone-300 dark:text-zinc-800 mb-3 animate-pulse" />
            <p className="font-extrabold text-sm mb-1">لا توجد وسائط ومواد إعلامية تطابق بحثك</p>
            <p className="text-xs text-stone-400">يرجى تجربة البحث بكلمات أخرى أو الانتقال لتصاميم الكل</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredVideos.map(vid => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  key={vid.id}
                >
                  <Link 
                    to={`/watch/${vid.id}`} 
                    className="group block bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-100 dark:border-zinc-900 hover:border-red-500/20 hover:scale-[1.01] transition-all duration-300 transform"
                  >
                    {/* Immersive Thumbnail card */}
                    <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                      {vid.thumbnailUrl ? (
                        <img 
                          src={vid.thumbnailUrl} 
                          alt={vid.title} 
                          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-104 transition duration-700 ease-out" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black shrink-0 flex items-center justify-center">
                          <Radio className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}

                      {/* Floating Overlays */}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/35 transition-all duration-500 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition transform group-hover:scale-110">
                          <PlayCircle className="w-7 h-7 fill-white/10" />
                        </div>
                      </div>

                      {/* Category Pill Tag Overlay */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-red-600/95 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                          {vid.category || "شاهد"}
                        </span>
                      </div>

                      {/* Video Duration tag overlay */}
                      {vid.duration && (
                        <div className="absolute bottom-3 right-3 bg-black/85 text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded flex items-center gap-1 border border-zinc-800 shadow-lg">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{vid.duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info below image */}
                    <div className="p-4 space-y-2.5">
                      <h4 className="text-[#111827] dark:text-zinc-100 font-extrabold leading-snug line-clamp-2 text-right text-[13px] sm:text-[14px] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors h-10 overflow-hidden">
                        {vid.title}
                      </h4>
                      
                      <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-500 pt-2 border-t border-stone-100 dark:border-zinc-900/40">
                        <span className="font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-300 dark:text-zinc-600" />
                          {format(vid.createdAt || Date.now(), "d MMMM yyyy", { locale: ar })}
                        </span>
                        
                        <span className="font-bold flex items-center gap-1 bg-stone-50 dark:bg-zinc-900 px-2 py-0.5 rounded">
                          <Eye className="w-3.5 h-3.5" />
                          {vid.views || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

    </div>
  );
}
