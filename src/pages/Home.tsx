import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem, VideoItem, LeaderContent, Article } from "../types";
import { CategoryBadges } from "../components/CategoryBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, Headphones, Newspaper, Clock, PlayCircle, MonitorPlay, ChevronLeft, X, Eye, User, Calendar, BookOpen, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

function NewsSlider({ sliderList }: { sliderList: NewsItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  // Reset index if list length changes and index is out of bounds
  useEffect(() => {
    if (currentIndex >= sliderList.length) {
      setCurrentIndex(0);
    }
  }, [sliderList.length, currentIndex]);

  // Autoplay functionality
  useEffect(() => {
    if (sliderList.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % sliderList.length);
    }, 5000); // 5 seconds autoplay
    return () => clearInterval(interval);
  }, [sliderList.length]);

  if (sliderList.length === 0) return null;

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % sliderList.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + sliderList.length) % sliderList.length);
  };

  const currentItem = sliderList[currentIndex];

  return (
    <div className="w-full relative select-none px-4 sm:px-6 lg:px-8 mb-6">
      <div className="relative w-full h-[376px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-white/5 shadow-lg bg-surface-card">
        {/* Slider viewport */}
        <div className="w-full h-full relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -300 : 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(e, info) => {
                const swipeThreshold = 50;
                if (info.offset.x > swipeThreshold) {
                  handlePrev();
                } else if (info.offset.x < -swipeThreshold) {
                  handleNext();
                }
              }}
              className="w-full h-full absolute top-0 left-0 cursor-grab active:cursor-grabbing"
            >
              <Link to={currentItem.isLeader ? `/leader/${currentItem.id}` : `/news/${currentItem.id}`} className="block w-full h-full relative">
                {currentItem.imageUrl ? (
                  <img 
                    src={currentItem.imageUrl} 
                    alt={currentItem.title} 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#141B26] flex items-center justify-center pointer-events-none">
                    <Newspaper className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.85)] via-[rgba(0,0,0,0.4)] to-transparent"></div>
                
                {/* Pinned News Tag if applicable */}
                {currentItem.isPinned && (
                  <div className="absolute top-[16px] left-0 z-10">
                    <span className="bg-blue-600 text-white text-[13px] font-bold font-ibm w-[100px] h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                      خبر مثبت
                    </span>
                  </div>
                )}

                {/* Content Container at the Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 pb-10 sm:pb-10 flex flex-col justify-end text-right z-10">
                   {/* Meta Row: Chip & Details */}
                   <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                     {/* Category Chip */}
                     <div className="bg-red-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full shadow-md shrink-0">
                        {currentItem.category}
                     </div>

                     {/* Breaking News Indicator if applicable */}
                     {currentItem.isBreaking && (
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
                        {currentItem.author && (
                          <span className="font-bold">{currentItem.author}</span>
                        )}
                        {currentItem.author && <span className="opacity-50 text-[8px]">•</span>}
                        <span>{formatPublishInfo(currentItem.createdAt).mTime}</span>
                        <span className="opacity-50 text-[8px]">•</span>
                        <span>{formatPublishInfo(currentItem.createdAt).mDate}</span>
                        <span className="opacity-50 text-[8px]">•</span>
                        <span className="text-white/70">{formatPublishInfo(currentItem.createdAt).hDate}</span>
                      </div>
                    </div>

                   {/* Title */}
                   <h2 
                     className="font-bold text-[18px] sm:text-[22px] md:text-[26px] text-white leading-[1.5] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo"
                     style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                      {currentItem.title}
                    </h2>

                    {/* Views below title - aligned to far left of the card */}
                    <div className="flex justify-start mt-2" style={{ direction: 'ltr' }}>
                      <div className="flex items-center gap-1 text-white/80 text-[10px] sm:text-[11px] font-medium">
                        <Eye className="w-3.5 h-3.5 text-red-600" />
                        <span>{currentItem.views || 0}</span>
                      </div>
                    </div>
                 </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination indicators inside the image at the bottom */}
        {sliderList.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-[8px] z-20">
            {sliderList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-300 ${
                  idx === currentIndex 
                    ? "w-[26px] h-[8px] bg-red-600 rounded-[4px]" 
                    : "w-[8px] h-[8px] bg-white/30 rounded-[4px] hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [rawNews, setRawNews] = useState<NewsItem[]>([]);
  const [rawVideos, setRawVideos] = useState<VideoItem[]>([]);
  const [rawLeader, setRawLeader] = useState<LeaderContent[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"news" | "articles">("news");
  const [sliderShowLatest, setSliderShowLatest] = useState(true);

  useEffect(() => {
    const fetchSliderConfig = async () => {
      try {
        const sliderDoc = await getDoc(doc(db, "newsMetadata", "sliderConfig"));
        if (sliderDoc.exists()) {
          setSliderShowLatest(sliderDoc.data().showLatest !== false);
        }
      } catch (e) {
        console.warn("Error fetching slider config:", e);
      }
    };
    fetchSliderConfig();
  }, []);

  useEffect(() => {
    if (activeSubTab === "articles") {
      navigate("/articles");
      setActiveSubTab("news");
    }
  }, [activeSubTab, navigate]);
  const prevVideoIdsRef = useRef<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({
    "محلية": "#34619B",
    "تعبئة عامة": "#07152B",
    "اجتماعية": "#10264A",
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

    const unsubArticlesPromise = SyncService.syncCollection<Article>("articles", (articleData) => {
      if (!active) return;
      const sliced = articleData.slice(0, 10);
      setArticles(sliced);
      localStorage.setItem("taiz_articles_cache", JSON.stringify(sliced));
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 10 });

    return () => {
      active = false;
      unsubNewsPromise.then(unsub => unsub());
      unsubVideosPromise.then(unsub => unsub());
      unsubLeaderPromise.then(unsub => unsub());
      unsubArticlesPromise.then(unsub => unsub());
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

  // Determine news items for the slider
  const sliderItems = useMemo(() => {
    const pinned = news.filter(n => n.isPinned);
    if (sliderShowLatest) {
      const combined = [...pinned];
      for (const item of news) {
        if (combined.length >= 5) break;
        if (!combined.some(c => c.id === item.id)) {
          combined.push(item);
        }
      }
      return combined;
    } else {
      return pinned;
    }
  }, [news, sliderShowLatest]);

  // Determine list items below the slider
  const listItems = useMemo(() => {
    return news;
  }, [news]);

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
      {/* Innovative Top Navigation Experience */}
      <div className="pt-4 pb-3 px-4 bg-surface-main/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100/85 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div className="max-w-[700px] mx-auto w-full flex items-center justify-between">
          {/* Right side: Active Indicator & Title with Cairo Font */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="font-black text-base text-slate-800 font-cairo tracking-tight">أحدث الأخبار والتقارير</span>
          </div>

          {/* Left side: Dedicated Direct Navigation Shortcut to Articles with Hover Micro-animations */}
          <Link 
            to="/articles" 
            title="الانتقال السريع إلى مقالات وآراء"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full border border-red-600/10 shadow-[0_4px_12px_rgba(220,38,38,0.15)] transition-all duration-300 hover:scale-105 active:scale-95 group font-cairo text-xs font-black"
          >
            <BookOpen className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform duration-300" />
            <span>مقالات وآراء</span>
            <ChevronLeft className="w-4 h-4 text-white/70 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      <div className="p-0 sm:p-4">
        <AnimatePresence mode="wait">
          {activeSubTab === "news" ? (
            <motion.div
              key="news-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -100) setActiveSubTab("articles");
              }}
            >
        {loading ? (
           <div className="space-y-6 pt-4 px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse bg-surface-card h-64 sm:h-80 w-full mb-6 rounded-3xl shadow-soft"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
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
             <Newspaper className="w-16 h-16 mx-auto mb-4 text-red-600 opacity-40" />
             <p className="text-lg font-bold text-text-primary">لا توجد أخبار حالياً</p>
          </div>
        ) : (
          <div className="space-y-0">
            
            {/* HERO FEATURED POST SLIDER */}
            <NewsSlider sliderList={sliderItems} />

            {/* LIST OF OTHER POSTS */}
            <div className="flex flex-col">
              {listItems.map((item, index) => (
                <div key={item.id} className="relative">
                  {item.isFeaturedLayout ? (
                    <div className="px-4 sm:px-6 lg:px-8">
                      <Link 
                        to={item.isLeader ? `/leader/${item.id}` : `/news/${item.id}`} 
                        className="block relative w-full h-[376px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-white/5 shadow-lg mb-4 select-none group"
                        style={{ direction: 'rtl' }}
                      >
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-[#141B26] flex items-center justify-center">
                            <Newspaper className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.85)] via-[rgba(0,0,0,0.4)] to-transparent pointer-events-none"></div>
                        
                        {/* Content Container at the Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 pb-10 sm:pb-10 flex flex-col justify-end text-right z-10">
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
                             </div>
                           </div>

                           {/* Title */}
                           <h2 
                             className="font-bold text-[18px] sm:text-[22px] md:text-[26px] text-white leading-[1.5] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo"
                             style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                              {item.title}
                           </h2>

                           {/* Views below title - aligned to far left of the card */}
                           <div className="flex justify-start mt-2" style={{ direction: 'ltr' }}>
                             <div className="flex items-center gap-1 text-white/80 text-[10px] sm:text-[11px] font-medium">
                               <Eye className="w-3.5 h-3.5 text-red-600" />
                               <span>{item.views || 0}</span>
                             </div>
                           </div>
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <Link
to={item.isLeader ? `/leader/${item.id}` : `/news/${item.id}`} 
                      className="flex items-center bg-white rounded-[16px] shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-2.5 overflow-hidden group relative transition-all hover:shadow-md h-[110px] sm:h-[130px]"
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
                            <h3 className="font-bold text-[12px] sm:text-[13px] text-gray-900 leading-[1.5] transition-colors hover:text-taiz-sky mb-2 whitespace-normal line-clamp-2 font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
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
                                 <Eye className="w-3 h-3 text-red-600"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>
                      </div>
                    </Link>
                  )}

                  {/* Insert Video Slider Container */}
                  {index === 1 && videos.length > 0 && (
                    <div className="my-2.5 py-2 px-4 sm:px-6 lg:px-8 bg-surface-main relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-taiz-sky/5 rounded-full blur-[40px] -mt-10 -mr-10"></div>
                      <div className="flex items-center justify-between mb-3 text-right relative z-10" style={{ direction: "rtl" }}>
                        <Link to="/watch" className="flex items-center gap-3 group cursor-pointer inline-flex">
                           <div className="bg-red-600 p-2 rounded-xl shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
                              <MonitorPlay className="w-5 h-5 text-white" />
                           </div>
                           <h2 className="font-black text-[18px] sm:text-[20px] select-none text-text-primary group-hover:text-red-600 transition-colors font-cairo">أحدث الفيديوهات</h2>
                        </Link>

                        <Link 
                          to="/watch"
                          className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-colors py-1.5 px-3 bg-red-600/10 hover:bg-red-600/20 rounded-full"
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
                              <div className="relative h-[135px] sm:h-[155px] rounded-none overflow-hidden bg-gray-900 shadow-sm group-hover:shadow-md transition-all border border-gray-200/50">
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
                                    <h4 className="text-white text-[13px] sm:text-[14px] font-bold leading-[1.4] line-clamp-2 transition-colors font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
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
              {/* End of news items list */}
            </div>
          </div>
        )}
      </motion.div>
      ) : (
        <motion.div
          key="articles-tab"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 100) setActiveSubTab("news");
          }}
          className="px-4 space-y-6 pt-4 min-h-[60vh]"
        >
          {/* Featured Article in Tab */}
          {articles.length > 0 && (
            <Link to={`/articles/${articles[0].id}`} className="block group">
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border border-border-light">
                {articles[0].imageUrl ? (
                  <img src={articles[0].imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4">
                  <span className="bg-status-error text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    مقال مميز
                  </span>
                </div>
                <div className="absolute bottom-6 right-6 left-6 text-right">
                  <h3 className="text-white text-xl font-black mb-4 leading-relaxed line-clamp-2 font-cairo">{articles[0].title}</h3>
                  <div className="flex items-center gap-3">
                    {articles[0].authorPhoto ? (
                      <img src={articles[0].authorPhoto} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-taiz-navy flex items-center justify-center border border-white/20">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-white text-xs font-black">{articles[0].authorName}</div>
                      <div className="text-white/60 text-[10px] font-bold mt-0.5">{articles[0].hijriDate} هـ</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Latest Articles in Tab */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black flex items-center gap-2 font-cairo">
              <div className="w-1.5 h-6 bg-taiz-sky rounded-full"></div>
              أحدث المقالات
            </h3>
            <Link to="/articles" className="text-taiz-sky text-sm font-black flex items-center gap-1">
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {articles.slice(1).map((article, idx) => (
              <Link 
                key={article.id} 
                to={`/articles/${article.id}`} 
                className="flex items-center gap-4 p-3 bg-surface-card rounded-[2rem] border border-border-light hover:bg-surface-hover transition-all"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <h4 className="font-black text-sm leading-relaxed mb-2 line-clamp-2 font-cairo">{article.title}</h4>
                  <div className="flex items-center justify-end gap-2 text-[10px] text-text-muted font-bold">
                    <span>{article.authorName}</span>
                    <span className="opacity-30">•</span>
                    <span>{article.hijriDate} هـ</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {articles.length === 0 && (
            <div className="text-center py-20 text-text-muted font-bold bg-surface-card rounded-[2.5rem] border border-border-light border-dashed">
              لا توجد مقالات متاحة حالياً
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
      </div>
    </motion.div>
    </PullToRefresh>
  );
}
