import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem, VideoItem } from "../types";
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
    hDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d) + "هـ";
  } catch (e) {
    hDate = "";
  }
  
  return { mDate, mTime, hDate };
}

export function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Record<string, string>>({
    "محلية": "#049EDF",
    "تعبئة عامة": "#032F69",
    "اجتماعية": "#055198",
    "أنشطة وزيارات": "#7C3AED",
    "مشاريع": "#10B981",
    "مقال": "#F59E0B"
  });

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

    let hasCache = false;

    if (cachedNews) {
      try {
        const parsed = JSON.parse(cachedNews);
        if (parsed.length > 0) {
          setNews(parsed);
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
          setVideos(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing videos cache", e);
      }
    }

    if (hasCache) {
      setLoading(false);
    }

    let active = true;
    let newsDone = false;
    let videosDone = false;

    const checkLoading = () => {
      if (active && newsDone && videosDone) {
        setLoading(false);
      }
    };

    const unsubNewsPromise = SyncService.syncCollection<NewsItem>("news", (newsData) => {
      if (!active) return;
      const sliced = newsData.slice(0, 30);
      setNews(sliced);
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
      setVideos(sliced);
      localStorage.setItem("taiz_videos_cache", JSON.stringify(sliced));
      videosDone = true;
      checkLoading();
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 30 });

    return () => {
      active = false;
      unsubNewsPromise.then(unsub => unsub());
      unsubVideosPromise.then(unsub => unsub());
    };
  }, []);

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
      setNews(freshNews);
      
      const freshVideos = await SyncService.refreshCollection<VideoItem>("videos", { orderByField: "createdAt", orderDirection: "desc", limit: 30 });
      const sortedVideos = [...freshVideos].sort((a, b) => {
        const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
        const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setVideos(sortedVideos.slice(0, 5));
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
              <div className="block bg-surface-main pb-1.5 mb-4 font-sans">
                {heroItem.imageUrl && (
                  <Link to={`/news/${heroItem.id}`} className="block group w-full relative aspect-[16/10] sm:aspect-video overflow-hidden bg-surface-card mb-4 sm:rounded-3xl shadow-soft">
                     <img 
                       src={heroItem.imageUrl} 
                       alt={heroItem.title} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
                     
                     {/* Category Labels Attached to Center-Top (Outside) */}
                     <CategoryBadges item={heroItem} isHero={true} className="absolute top-2 left-1/2 -translate-x-1/2" />
                  </Link>
                )}
                
                <div className="px-5 sm:px-2">
                  {/* Info Row: News Meta (Above Title) */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2.5 text-[9px] sm:text-[10px] font-bold text-text-secondary/80">
                    {heroItem.isBreaking && (
                      <div className="flex items-center gap-1.5 text-status-error font-extrabold select-none bg-status-error/5 px-2 py-0.5 rounded-full shrink-0">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-error"></span>
                        </span>
                        تغطية مباشرة
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-2.5 h-2.5 text-taiz-sky/50" />
                        <span>{formatPublishInfo(heroItem.createdAt).mDate}</span>
                      </span>
                      
                      <span className="shrink-0 text-text-muted/60">{formatPublishInfo(heroItem.createdAt).hDate}</span>
                      
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-taiz-sky/50" />
                        <span>{formatPublishInfo(heroItem.createdAt).mTime}</span>
                      </span>
                      
                      {heroItem.author && (
                        <span className="flex items-center gap-1 text-text-muted shrink-0 max-w-[120px] truncate">
                          <User className="w-2.5 h-2.5 text-taiz-sky/50"/> 
                          {heroItem.author}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/news/${heroItem.id}`} className="block hover:text-taiz-sky transition-colors group">
                    <h2 className="font-black text-[17px] sm:text-[20px] text-text-primary leading-[1.4] mb-2.5 text-right tracking-tight group-hover:text-taiz-sky transition-colors">
                       {heroItem.title}
                    </h2>
                  </Link>
                  
                  <div className="flex items-center mt-2">
                    <div className="mr-auto flex items-center gap-1 text-taiz-royal shrink-0 text-[10px] sm:text-[11px] font-black bg-taiz-royal/5 w-fit px-2 py-0.5 rounded-lg border border-taiz-royal/10">
                      <Eye className="w-3 h-3"/> 
                      <span>{heroItem.views || 0} مشاهدة</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIST CHANNELS */}
            <div className="flex flex-col font-sans">
              {listItems.map((item, index) => (
                <div key={item.id} className="pt-2">
                  <Link 
                    to={`/news/${item.id}`} 
                    className="flex gap-4 p-3.5 hover:bg-surface-hover transition-all bg-surface-card rounded-2xl shadow-soft mb-4 mx-4 sm:mx-0 group relative"
                  >
                    {/* Category Tags Attached to Center-Top (Outside) */}
                    <CategoryBadges item={item} isHero={false} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                    {/* Right Side News Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 text-right pr-0.5">
                       <div>
                          <h3 className="font-bold text-[12px] sm:text-[13px] text-text-primary leading-[1.35] transition-colors hover:text-taiz-sky mb-2 whitespace-normal line-clamp-3 tracking-tight">
                            {item.title}
                          </h3>

                          {/* Consistently aligned metadata line */}
                          <div className="flex items-center justify-between gap-3 text-[9px] sm:text-[10px] font-bold text-text-muted/80">
                             {/* Date/Time/Author */}
                             <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="flex items-center gap-1 shrink-0">
                                  <Calendar className="w-2.5 h-2.5 text-taiz-sky/40" />
                                  <span>{formatPublishInfo(item.createdAt).mDate}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-taiz-sky/40" />
                                  <span>{formatPublishInfo(item.createdAt).mTime}</span>
                                </div>
                                {item.author && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <User className="w-2.5 h-2.5 text-taiz-sky/40" />
                                    <span className="text-[9px] sm:text-[10px] opacity-90">{item.author}</span>
                                  </div>
                                )}
                             </div>

                             {/* Views */}
                             <span className="flex items-center gap-1 text-taiz-royal shrink-0 bg-taiz-royal/5 px-1.5 py-0.5 rounded-md border border-taiz-royal/10">
                               <Eye className="w-2.5 h-2.5"/> 
                               {item.views || 0}
                             </span>
                          </div>
                       </div>
                    </div>

                    {/* Left Side Compact Image */}
                    {item.imageUrl && (
                      <div className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] rounded-2xl overflow-hidden shrink-0 bg-surface-main shadow-soft">
                         <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                  </Link>

                  {/* Insert Video Slider Container */}
                  {index === 1 && videos.length > 0 && (
                    <div className="my-2 py-4 bg-surface-main px-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-taiz-sky/5 rounded-full blur-[40px] -mt-10 -mr-10"></div>
                      <div className="flex items-center justify-between mb-4 text-right relative z-10" style={{ direction: "rtl" }}>
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
                      
                      <div className="flex overflow-x-auto gap-5 pb-4 snap-x hide-scrollbar relative z-10" style={{ scrollbarWidth: 'none' }}>
                        {videos.map(video => (
                           <Link key={video.id} to={`/watch/${video.id}`} className="snap-start shrink-0 w-[280px] sm:w-[320px] group block">
                              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-taiz-navy mb-4 shadow-medium group-hover:shadow-strong group-hover:border-taiz-sky/30 transition-all">
                                 {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                                 ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-taiz-navy to-taiz-royal"></div>
                                 )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
                                 <div className="absolute top-3 right-3 z-30">
                                    <div className="bg-white/90 backdrop-blur-md text-taiz-navy text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-white/50">
                                       {video.category || "فيديو"}
                                    </div>
                                 </div>
                                 <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-full shadow-strong group-hover:scale-110 transition-transform border border-white/30">
                                       <PlayCircle className="w-8 h-8 text-white ml-0.5" />
                                    </div>
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                    <h4 className="text-white text-[15px] font-bold leading-[1.4] line-clamp-2 text-right group-hover:text-taiz-sky transition-colors">{video.title}</h4>
                                 </div>
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
