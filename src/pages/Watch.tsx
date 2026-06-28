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
  Calendar,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PullToRefresh } from "../components/PullToRefresh";

export function Watch() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "popular">("newest");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Temporary states for modal
  const [tempCategories, setTempCategories] = useState<string[]>([]);
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
      const sortedVideos = [...freshVideos].sort((a, b) => {
        const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
        const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setVideos(sortedVideos);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-5 pb-20 font-sans" ref={activeVideoRef}>
      
      {/* Immersive Header Block with Status Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border-light pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-taiz-sky opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-taiz-royal"></span>
          </div>
          <h1 className="text-2xl font-black text-text-primary select-none">البث المباشر</h1>
        </div>

        {channels.length > 0 && (
          <div className="flex items-center gap-2 bg-taiz-royal/5 text-taiz-royal px-3 py-1 rounded-xl text-xs font-black border border-taiz-royal/10 shadow-sm">
             <Radio className="w-3.5 h-3.5 animate-pulse" />
             <span>{channels.length} قنوات</span>
          </div>
        )}
      </div>

      {/* Hero Live Stream Visual Frame Panel */}
      <div className="mb-12 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Player Area */}
        <div className="lg:col-span-3 bg-taiz-navy rounded-3xl overflow-hidden shadow-strong border border-taiz-navy/10 relative h-fit">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-taiz-sky/95 text-white px-3 py-1.5 rounded-full text-[11px] font-black shadow-md tracking-wider">
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
                <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-3 border-b border-white/5 py-20">
                   <Tv className="w-12 h-12 mb-2 text-white/20 animate-bounce" />
                   <p className="font-black text-white/60 text-sm">البث المباشر لهذه القناة غير متاح في الوقت الحالي</p>
                   <p className="text-xs text-white/40">الرجاء اختيار قناة أخرى أو مراجعة الجدول لاحقاً</p>
                </div>
             )}
          </div>

          <div className="bg-surface-main p-5 sm:p-6 border-t border-border-light">
             <h2 className="text-lg sm:text-xl font-black text-text-primary flex items-center gap-2">
               {activeChannel?.iconUrl && (
                  <img src={activeChannel.iconUrl} alt={activeChannel.name} className="w-8 h-8 rounded-full object-cover shadow-sm bg-surface-card border border-border-light" />
               )}
               {activeChannel ? `قناة البث: ${activeChannel.name}` : "اختر قناة للبث المباشر"}
             </h2>
             <p className="text-xs text-text-muted font-bold mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-taiz-sky rounded-full animate-ping" />
                يتم سحب التحديثات والبث التشاركي في الوقت الفعلي
             </p>
          </div>
        </div>

        {/* Vertical Channel Selector Area */}
        <div className="lg:col-span-1 bg-surface-main p-5 rounded-3xl border border-border-light shadow-soft h-fit">
          <h3 className="font-black text-text-primary mb-4 text-right flex items-center justify-end gap-2 text-sm">
             <span>قنوات البث المباشر</span>
             <MonitorPlay className="w-4 h-4 text-taiz-sky" />
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const order = ["المسيرة", "المسيرة مباشر", "اليمن", "عدن", "الساحات", "الميادين"];
              const sortedChannels = [...channels].sort((a, b) => {
                const nameA = a.name.trim();
                const nameB = b.name.trim();
                
                // Prioritize Al-Masirah and Al-Masirah Mubasher
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
                      window.scrollTo({ top: activeVideoRef.current?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 gap-2 ${
                      isSelected 
                        ? 'bg-surface-hover text-taiz-navy border-taiz-sky/60 shadow-glow ring-1 ring-taiz-sky/30 scale-[1.02]' 
                        : 'bg-surface-main hover:bg-surface-hover border-border-light text-text-secondary hover:shadow-sm'
                    }`}
                    dir="rtl"
                  >
                    <div className="relative">
                      {ch.iconUrl ? (
                        <img src={ch.iconUrl} alt={ch.name} className={`w-10 h-10 rounded-full object-cover shrink-0 bg-surface-card p-1 shadow-sm ${isSelected ? 'ring-2 ring-taiz-sky/50' : ''}`} />
                      ) : (
                        <Radio className="w-6 h-6 shrink-0" />
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-taiz-sky rounded-full animate-pulse shadow-glow border-2 border-surface-main" />
                      )}
                    </div>
                    <span className="text-[10px] font-black truncate max-w-full">
                      {ch.name}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* ================= VIDEOS & COGNATE REPORTS SECTION ================= */}
      <div className="space-y-6">
        
        {/* Top Control Panel Wrapper: Heading, category tabs, and real search */}
        <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-border-light shadow-soft space-y-5">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-taiz-navy to-taiz-royal p-2 rounded-xl shadow-md">
                 <MonitorPlay className="w-5 h-5 text-white shrink-0" />
              </div>
              <h2 className="font-black text-xl text-text-primary select-none">المحتوى المرئي</h2>
              <span className="text-[10px] bg-taiz-sky text-white font-black px-2 py-0.5 rounded-full shadow-sm mr-2 animate-bounce">محدّث</span>
            </div>

            {/* Innovative Search input inside Watch section */}
            <div className="relative w-full md:max-w-xs">
              <input 
                type="text"
                placeholder="ابحث عن تقرير، زامل، أو وثائقي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-main text-sm font-bold rounded-2xl border border-border-light focus:outline-taiz-sky/80 transition shadow-inner placeholder-text-muted"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
            </div>
          </div>

          {/* Filtering Tabs (المصنفات السلسة) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-light pt-4">
             <button
                onClick={openFilterModal}
                className="flex items-center gap-2 px-4 py-2 bg-surface-main hover:bg-surface-hover border border-border-light rounded-xl transition-all group"
             >
                <SlidersHorizontal className="w-4 h-4 text-taiz-sky group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-xs font-black text-text-primary">تصنيف المواد</span>
                {selectedCategories.length > 0 && (
                  <span className="bg-taiz-sky text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
             </button>

             {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                   {selectedCategories.map(cat => (
                     <span key={cat} className="bg-taiz-sky/10 text-taiz-sky text-[10px] font-black px-2 py-1 rounded-lg border border-taiz-sky/20">
                        {cat}
                     </span>
                   ))}
                   <button 
                    onClick={() => setSelectedCategories([])}
                    className="text-[10px] font-black text-text-muted hover:text-status-error underline underline-offset-2"
                   >
                    مسح الكل
                   </button>
                </div>
             )}
          </div>
        </div>

        {/* Filter Modal */}
        <AnimatePresence>
          {isFilterModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="relative w-full max-w-md bg-surface-card rounded-[2rem] shadow-2xl border border-border-light overflow-hidden flex flex-col p-6"
               >
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-taiz-sky" />
                        تصفية وتصنيف المواد
                     </h3>
                     <button onClick={() => setIsFilterModalOpen(false)} className="p-2 hover:bg-surface-main rounded-xl transition text-text-muted">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1">
                     {/* Sorting */}
                     <div>
                        <span className="text-xs font-black text-text-secondary block mb-3">ترتيب حسب:</span>
                        <div className="grid grid-cols-3 gap-2">
                           {[
                             { id: "newest", label: "الأحدث" },
                             { id: "oldest", label: "الأقدم" },
                             { id: "popular", label: "الرائج" }
                           ].map(opt => (
                             <button
                               key={opt.id}
                               onClick={() => setTempSort(opt.id as any)}
                               className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                 tempSort === opt.id 
                                   ? 'bg-taiz-navy text-white border-taiz-navy shadow-md' 
                                   : 'bg-surface-main text-text-secondary border-border-light hover:bg-surface-hover'
                               }`}
                             >
                               {opt.label}
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Categories */}
                     <div>
                        <span className="text-xs font-black text-text-secondary block mb-3">التصنيفات:</span>
                        <div className="flex flex-wrap gap-2">
                           <button
                             onClick={() => setTempCategories([])}
                             className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                               tempCategories.length === 0 
                                 ? 'bg-taiz-navy text-white border-taiz-navy shadow-md' 
                                 : 'bg-surface-main text-text-secondary border-border-light hover:bg-surface-hover'
                             }`}
                           >
                             الكل
                           </button>
                           {uniqueCategories.map(cat => (
                             <button
                               key={cat}
                               onClick={() => toggleTempCategory(cat)}
                               className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                 tempCategories.includes(cat) 
                                   ? 'bg-taiz-sky text-white border-taiz-sky shadow-md' 
                                   : 'bg-surface-main text-text-secondary border-border-light hover:bg-surface-hover'
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
                       className="flex-1 bg-taiz-navy hover:bg-taiz-royal text-white py-3.5 rounded-2xl text-sm font-black shadow-lg transition duration-200"
                     >
                        تطبيق
                     </button>
                     <button 
                       onClick={() => setIsFilterModalOpen(false)}
                       className="px-6 bg-surface-main hover:bg-surface-hover text-text-secondary py-3.5 rounded-2xl text-sm font-black border border-border-light transition"
                     >
                        إلغاء
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VIDEOS LIST GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-taiz-royal border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-text-muted">جاري إرساء المكتبة الإعلامية...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-surface-main rounded-3xl border border-dashed border-border-light p-8">
            <FolderOpen className="w-12 h-12 mx-auto text-border-subtle mb-3 animate-pulse" />
            <p className="font-black text-sm mb-1">لا توجد وسائط ومواد إعلامية تطابق بحثك</p>
            <p className="text-xs text-text-muted font-bold">يرجى تجربة البحث بكلمات أخرى أو الانتقال لتصاميم الكل</p>
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
                    className="card card-hover group block p-0"
                  >
                    {/* Immersive Thumbnail card */}
                    <div className="relative aspect-video bg-surface-main overflow-hidden rounded-t-2xl">
                      {vid.thumbnailUrl ? (
                        <img 
                          src={vid.thumbnailUrl} 
                          alt={vid.title} 
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-700 ease-out" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-taiz-navy to-taiz-royal shrink-0 flex items-center justify-center">
                          <Radio className="w-8 h-8 text-white/20" />
                        </div>
                      )}

                      {/* Floating Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/40 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-strong transition transform group-hover:scale-110 border border-white/20">
                          <PlayCircle className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Category Pill Tag Overlay */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-taiz-navy/80 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-white/10">
                          {vid.category || "شاهد"}
                        </span>
                      </div>

                      {/* Video Duration tag overlay */}
                      {vid.duration && (
                        <div className="absolute bottom-3 right-3 bg-taiz-navy/80 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-md">
                          <Clock className="w-3.5 h-3.5 text-taiz-sky" />
                          <span>{vid.duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info below image */}
                    <div className="p-5 space-y-3">
                      <h4 className="text-text-primary font-black leading-[1.45] line-clamp-2 text-right text-[14px] sm:text-[15px] group-hover:text-taiz-royal transition-colors h-10 overflow-hidden">
                        {vid.title}
                      </h4>
                      
                      <div className="flex items-center justify-between text-[11px] text-text-muted pt-3 border-t border-border-light">
                        <span className="font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          {format(vid.createdAt || Date.now(), "d MMMM yyyy", { locale: ar })}
                        </span>
                        
                        <span className="font-black flex items-center gap-1.5 bg-surface-main px-2.5 py-1 rounded-full text-taiz-royal">
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
    </PullToRefresh>
  );
}
