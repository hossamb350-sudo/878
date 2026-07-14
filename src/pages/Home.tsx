import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem, VideoItem, LeaderContent } from "../types";
import { CategoryBadges } from "../components/CategoryBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, Headphones, Newspaper, Clock, PlayCircle, MonitorPlay, ChevronLeft, X, Eye, User, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { PullToRefresh } from "../components/PullToRefresh";

function getRelativeArabicTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "الآن";
  if (diffMin < 60) {
    if (diffMin === 1) return "منذ دقيقة";
    if (diffMin === 2) return "منذ دقيقتين";
    if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
    return `منذ ${diffMin} دقيقة`;
  }
  if (diffHours < 24) {
    if (diffHours === 1) return "منذ ساعة";
    if (diffHours === 2) return "منذ ساعتين";
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  }
  if (diffDays === 1) return "أمس";
  if (diffDays === 2) return "منذ يومين";
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  return format(timestamp, "dd MMMM yyyy", { locale: ar });
}

function formatPublishInfo(timestamp: number) {
  const d = new Date(timestamp);
  const mDate = format(d, "dd MMMM yyyy'م'", { locale: ar });
  const mTime = format(d, "hh:mm a", { locale: ar });
  
  let hDate = "";
  try {
    const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d).trim();
    hDate = formatted.endsWith("هـ") ? formatted : `${formatted} هـ`;
  } catch (e) {
    hDate = "";
  }
  
  return { mDate, mTime, hDate };
}

export function Home() {
  const [rawNews, setRawNews] = useState<NewsItem[]>([]);
  const [rawVideos, setRawVideos] = useState<VideoItem[]>([]);
  const [rawLeader, setRawLeader] = useState<LeaderContent[]>([]);
  const [loading, setLoading] = useState(true);
  const prevVideoIdsRef = useRef<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({
    "محلية": "#049EDF",
    "تعبئة عامة": "#032F69",
    "اجتماعية": "#055198",
    "أنشطة وزيارات": "#7C3AED",
    "مشاريع": "#10B981",
    "مقال": "#F59E0B"
  });

  // Derived combined news items (regular news + leader lectures/lessons)
  const news = useMemo(() => {
    const mappedLeaderTexts: NewsItem[] = rawLeader
      .filter(item => item.type === "text")
      .map(item => ({
        id: item.id,
        title: item.title,
        shortDescription: item.description || "",
        content: item.content,
        imageUrl: item.thumbnailUrl || "",
        category: "السيد القائد",
        isBreaking: false,
        createdAt: item.createdAt,
        views: item.views || 0,
        isLeader: true,
      }));
    
    const combined = [...rawNews, ...mappedLeaderTexts];
    combined.sort((a, b) => b.createdAt - a.createdAt);
    return combined.slice(0, 30);
  }, [rawNews, rawLeader]);

  // Derived combined videos (regular videos + leader videos)
  const videos = useMemo(() => {
    const mappedLeaderVideos: VideoItem[] = rawLeader
      .filter(item => item.type === "video")
      .map(item => ({
        id: item.id,
        title: item.title,
        url: item.content,
        thumbnailUrl: item.thumbnailUrl,
        category: "السيد القائد",
        views: item.views || 0,
        createdAt: item.createdAt,
        order: item.order,
        isLeader: true,
      }));

    const combined = [...rawVideos, ...mappedLeaderVideos];
    combined.sort((a, b) => {
      const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
      const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return b.createdAt - a.createdAt;
    });
    return combined.slice(0, 5);
  }, [rawVideos, rawLeader]);

  useEffect(() => {
    const fetchCats = async () => {
      const cached = localStorage.getItem("news_categories_color_cache");
      if (cached) {
        try {
          setCategories(JSON.parse(cached));
        } catch {}
      }
      try {
        const catDoc = await getDoc(doc(db, "newsMetadata", "categories"));
        if (catDoc.exists()) {
          const data = catDoc.data();
          const catMap: Record<string, string> = { ...categories };
          if (data.items) {
            data.items.forEach((item: any) => {
              if (item.name && item.color) catMap[item.name] = item.color;
            });
          }
          setCategories(catMap);
          localStorage.setItem("news_categories_color_cache", JSON.stringify(catMap));
        }
      } catch (e) {
        console.warn("Error fetching category colors (using cache fallback):", e);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    // Load from cache first
    const cachedNews = localStorage.getItem("taiz_news_cache");
    const cachedVideos = localStorage.getItem("taiz_videos_cache");
    const cachedLeader = localStorage.getItem("taiz_leader_cache");

    let hasCache = false;

    if (cachedNews) {
      try {
        const parsed = JSON.parse(cachedNews);
        if (parsed.length > 0) {
          setRawNews(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing news cache", e);
      }
    }
    if (cachedVideos) {
      try {
        const parsed = JSON.parse(cachedVideos);
        if (parsed.length > 0) {
          setRawVideos(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing videos cache", e);
      }
    }
    if (cachedLeader) {
      try {
        const parsed = JSON.parse(cachedLeader);
        if (parsed.length > 0) {
          setRawLeader(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing leader cache", e);
      }
    }

    if (hasCache) {
      setLoading(false);
    }

    let active = true;
    let newsDone = false;
    let videosDone = false;
    let leaderDone = false;

    const checkLoading = () => {
      if (active && newsDone && videosDone && leaderDone) {
        setLoading(false);
      }
    };

    const unsubNewsPromise = SyncService.syncCollection<NewsItem>("news", (newsData) => {
      if (!active) return;
      const sliced = newsData.slice(0, 30);
      setRawNews(sliced);
      localStorage.setItem("taiz_news_cache", JSON.stringify(sliced));
      newsDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 30 });

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
      const sliced = sorted.slice(0, 5);
      setRawVideos(sliced);
      localStorage.setItem("taiz_videos_cache", JSON.stringify(sliced));
      videosDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 30 });

    const unsubLeaderPromise = SyncService.syncCollection<LeaderContent>("leader", (leaderData) => {
      if (!active) return;
      const sorted = [...leaderData];
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      const sliced = sorted.slice(0, 30);
      setRawLeader(sliced);
      localStorage.setItem("taiz_leader_cache", JSON.stringify(sliced));
      leaderDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 30 });

    return () => {
      active = false;
      unsubNewsPromise.then(unsub => unsub());
      unsubVideosPromise.then(unsub => unsub());
      unsubLeaderPromise.then(unsub => unsub());
    };
  }, []);

  // Auto-scroll to newly added videos in the latest videos slider
  useEffect(() => {
    if (videos.length === 0) return;

    // Check if we already loaded videos before (meaning this is a dynamic update/addition)
    if (prevVideoIdsRef.current.length > 0) {
      const newVideo = videos.find(v => !prevVideoIdsRef.current.includes(v.id));
      if (newVideo) {
        // Scroll to the newly added video smoothly
        setTimeout(() => {
          const element = document.getElementById(`home-video-${newVideo.id}`);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center"
            });
          }
        }, 300); // Small timeout to ensure the DOM element is rendered and styled
      }
    }

    // Keep track of the current video IDs for future additions
    prevVideoIdsRef.current = videos.map(v => v.id);
  }, [videos]);

  // Filter items
  let filteredNews = [...news];

  // Pin manually-pinned news at top
  const pinnedNewsIndex = filteredNews.findIndex(n => n.isPinned);
  let heroItem = filteredNews[0];
  let listItems = filteredNews.slice(1);

  if (pinnedNewsIndex > 0) {
    heroItem = filteredNews[pinnedNewsIndex];
    listItems = [...filteredNews.slice(0, pinnedNewsIndex), ...filteredNews.slice(pinnedNewsIndex + 1)];
  } else if (pinnedNewsIndex === 0) {
    heroItem = filteredNews[0];
    listItems = filteredNews.slice(1);
  }

  // Define breakingNewsIndex as fallback or kept as empty if not needed
  const breakingNewsIndex = -1;

  const breakingItems = news.filter(n => n.isBreaking).slice(0, 3); // For the vertical timeline under hero

  const handleRefresh = async () => {
    try {
      const freshNews = await SyncService.refreshCollection<NewsItem>("news", { orderByField: "createdAt", orderDirection: "desc", limit: 30 });
      setRawNews(freshNews);
      
      const freshVideos = await SyncService.refreshCollection<VideoItem>("videos", { orderByField: "createdAt", orderDirection: "desc", limit: 30 });
      setRawVideos(freshVideos);

      const freshLeader = await SyncService.refreshCollection<LeaderContent>("leader", { orderByField: "createdAt", orderDirection: "desc", limit: 30 });
      setRawLeader(freshLeader);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-[760px] mx-auto w-full pb-16 bg-surface-main text-text-primary transition-colors"
    >
      
      <div className="p-0 sm:p-4">
        {loading ? (
           <div className="space-y-6 pt-4 px-4 sm:px-0">
              <div className="animate-pulse bg-surface-card h-64 sm:h-80 w-full mb-6 rounded-3xl shadow-soft"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse px-4 sm:px-0">
                   <div className="w-[110px] h-[110px] bg-surface-card rounded-2xl shrink-0 shadow-soft"></div>
                   <div className="flex-1 space-y-3 py-2">
                      <div className="h-6 bg-surface-card rounded-lg w-full"></div>
                      <div className="h-4 bg-surface-card rounded-lg w-2/3"></div>
                   </div>
                </div>
              ))}
           </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-24 card m-4 sm:m-0 font-sans">
             <Newspaper className="w-16 h-16 mx-auto mb-4 text-taiz-sky opacity-40" />
             <p className="text-lg font-bold text-text-primary">لا توجد أخبار حالياً</p>
          </div>
        ) : (
          <div className="space-y-0">
            
            {/* HERO FEATURED POST */}
            {heroItem && (
              <Link 
                to={heroItem.isLeader ? `/leader/${heroItem.id}` : `/news/${heroItem.id}`} 
                className="block relative w-full overflow-hidden mb-2.5 group aspect-[4/3] sm:aspect-[16/10]"
                style={{ direction: 'rtl', borderRadius: 0 }}
              >
                {/* Background Image */}
                {heroItem.imageUrl ? (
                  <img 
                    src={heroItem.imageUrl} 
                    alt={heroItem.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-200"></div>
                )}
                
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-taiz-navy/90 via-taiz-navy/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                
                {/* Content Container at the Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col justify-end">
                   {/* Meta Row: Chip & Details */}
                   <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                     {/* Category Chip */}
                     <div className="bg-red-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full shadow-md shrink-0">
                        {heroItem.category}
                     </div>

                     {/* Breaking News Indicator if applicable */}
                     {heroItem.isBreaking && (
                       <div className="flex items-center gap-1 text-status-error font-bold text-[10px] sm:text-[11px] bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-error"></span>
                          </span>
                          تغطية مباشرة
                       </div>
                     )}

                     {/* Meta Details */}
                     <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-white/90">
                        {heroItem.author && (
                          <span className="font-bold">{heroItem.author}</span>
                        )}
                        {heroItem.author && <span className="opacity-50 text-[8px]">•</span>}
                        <span>{formatPublishInfo(heroItem.createdAt).mTime}</span>
                        <span className="opacity-50 text-[8px]">•</span>
                        <span>{formatPublishInfo(heroItem.createdAt).mDate}</span>
                        <span className="opacity-50 text-[8px]">•</span>
                        <span className="text-white/70">{formatPublishInfo(heroItem.createdAt).hDate}</span>
                      </div>
                    </div>

                   {/* Title */}
                   <h2 
                     className="font-bold text-[18px] sm:text-[22px] md:text-[26px] text-white leading-[1.5] transition-colors group-hover:text-taiz-sky line-clamp-3"
                     style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                      {heroItem.title}
                    </h2>

                    {/* Views below title - aligned to far left of the card */}
                    <div className="flex justify-start mt-2" style={{ direction: 'ltr' }}>
                      <div className="flex items-center gap-1 text-white/80 text-[10px] sm:text-[11px] font-medium">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{heroItem.views || 0}</span>
                      </div>
                    </div>
                 </div>
               </Link>
            )}

            {/* LIST OF OTHER POSTS */}
            <div className="flex flex-col">
              {listItems.map((item, index) => (
                <div key={item.id} className="relative">
                  {item.isFeaturedLayout ? (
                    <Link 
                      to={item.isLeader ? `/leader/${item.id}` : `/news/${item.id}`} 
                      className="block relative w-full overflow-hidden mb-2.5 group aspect-[16/10] sm:aspect-[21/9]"
                      style={{ direction: 'rtl', borderRadius: 0 }}
                    >
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gray-200"></div>
                      )}
                      
                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-taiz-navy/90 via-taiz-navy/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                      
                      {/* Content Container at the Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col justify-end">
                         {/* Meta Row: Chip & Details */}
                         <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                           {/* Category Chip */}
                           <div className="bg-red-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full shadow-md shrink-0">
                              {item.category}
                           </div>

                           {/* Breaking News Indicator if applicable */}
                           {item.isBreaking && (
                             <div className="flex items-center gap-1 text-status-error font-bold text-[10px] sm:text-[11px] bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm shrink-0">
                                <span className="relative flex h-1.5 w-1.5">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-error"></span>
                                </span>
                                تغطية مباشرة
                             </div>
                           )}

                           {/* Meta Details */}
                           <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-white/90">
                              {item.author && (
                                <span className="font-bold">{item.author}</span>
                              )}
                              {item.author && <span className="opacity-50 text-[8px]">•</span>}
                              <span>{formatPublishInfo(item.createdAt).mTime}</span>
                              <span className="opacity-50 text-[8px]">•</span>
                              <span>{formatPublishInfo(item.createdAt).mDate}</span>
                              <span className="opacity-50 text-[8px]">•</span>
                              <span className="text-white/70">{formatPublishInfo(item.createdAt).hDate}</span>
                              
                              {/* Views */}
                              <div className="flex items-center gap-1 text-white/90 mr-auto pl-2">
                                 <Eye className="w-3 h-3"/> 
                                 <span>{item.views || 0}</span>
                              </div>
                           </div>
                         </div>

                         {/* Title */}
                         <h2 
                           className="font-bold text-[18px] sm:text-[22px] md:text-[26px] text-white leading-[1.5] transition-colors group-hover:text-taiz-sky line-clamp-3"
                           style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                            {item.title}
                          </h2>
                       </div>
                     </Link>
                  ) : (
                    <Link
to={item.isLeader ? `/leader/${item.id}` : `/news/${item.id}`} 
                      className="flex items-center bg-white rounded-none shadow-sm mb-2.5 group relative transition-all hover:shadow-md h-[110px] sm:h-[130px]"
                      style={{ direction: 'rtl' }}
                    >
                      {/* Right Side Compact Image */}
                      {item.imageUrl ? (
                        <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 overflow-hidden">
                           <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                           <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10 pointer-events-none pb-0">
                             <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                           </div>
                        </div>
                      ) : (
                        <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center">
                           <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10 pointer-events-none pb-0">
                             <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                           </div>
                        </div>
                      )}

                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right">
                         <div>
                            <h3 className="font-bold text-[12px] sm:text-[13px] text-gray-900 leading-[1.5] transition-colors hover:text-taiz-sky mb-2 whitespace-normal line-clamp-2" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                              {item.title}
                            </h3>

                            {/* Consistently aligned metadata line */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] font-medium text-gray-500 mt-auto">
                               {item.author && (
                                 <span className="text-gray-700 font-bold truncate max-w-[80px]">{item.author}</span>
                                )}
                               
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mDate}</span>
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mTime}</span>
                               <span className="shrink-0 text-gray-400">{formatPublishInfo(item.createdAt).hDate}</span>
                               
                               {/* Views */}
                               <span className="flex items-center gap-1 shrink-0 text-taiz-royal mr-auto">
                                 <Eye className="w-3 h-3"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>
                      </div>
                    </Link>
                  )}

                  {/* Insert Video Slider Container */}
                  {index === 1 && videos.length > 0 && (
                    <div className="my-2.5 py-2 px-4 sm:px-0 bg-surface-main relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-taiz-sky/5 rounded-full blur-[40px] -mt-10 -mr-10"></div>
                      <div className="flex items-center justify-between mb-3 text-right relative z-10" style={{ direction: "rtl" }}>
                        <Link to="/watch" className="flex items-center gap-3 group cursor-pointer inline-flex">
                           <div className="bg-gradient-to-br from-taiz-navy to-taiz-royal p-2 rounded-xl shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
                              <MonitorPlay className="w-5 h-5 text-white" />
                           </div>
                           <h2 className="font-black text-[18px] sm:text-[20px] select-none text-text-primary group-hover:text-taiz-sky transition-colors">أحدث الفيديوهات</h2>
                        </Link>

                        <Link 
                          to="/watch"
                          className="flex items-center gap-1 text-xs font-bold text-taiz-sky hover:text-taiz-navy transition-colors py-1.5 px-3 bg-taiz-sky/10 hover:bg-taiz-sky/20 rounded-full"
                        >
                          <span>عرض الكل</span>
                          <ChevronLeft className="w-4 h-4" />
                        </Link>
                      </div>
                      
                      <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar relative z-10" style={{ scrollbarWidth: 'none' }}>
                        {videos.map(video => (
                           <Link 
                             id={`home-video-${video.id}`}
                             key={video.id} 
                             to={video.isLeader ? `/leader/${video.id}` : `/watch/${video.id}`} 
                             className="snap-start shrink-0 w-[240px] sm:w-[280px] group block"
                           >
                              <div className="relative h-[135px] sm:h-[155px] rounded-lg overflow-hidden bg-gray-900 shadow-sm group-hover:shadow-md transition-all border border-gray-200/50">
                                 {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                 ) : (
                                    <div className="w-full h-full bg-gray-800"></div>
                                 )}
                                 <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                 
                                 <div className="absolute top-2 right-2 z-30">
                                    <div className="bg-white/95 text-gray-900 text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                                       {video.category || "فيديو"}
                                    </div>
                                 </div>
                                 
                                 <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full group-hover:scale-110 transition-transform border border-white/40">
                                       <PlayCircle className="w-6 h-6 text-white ml-0.5" />
                                    </div>
                                 </div>
                                 
                                 <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-right">
                                    <h4 className="text-white text-[13px] sm:text-[14px] font-bold leading-[1.4] line-clamp-2 transition-colors" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                                      {video.title}
                                    </h4>
                                 </div>
                                 
                                 {video.duration && (
                                   <div className="absolute bottom-2 left-2 z-30">
                                     <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                        {video.duration}
                                     </span>
                                   </div>
                                 )}
                              </div>
                           </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </motion.div>
    </PullToRefresh>
  );
}
