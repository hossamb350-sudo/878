import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { routes, generateSlug } from "../../utils/routes";
import { collection, query, orderBy, getDocs, limit, doc, getDoc, where } from "firebase/firestore";
import { db } from "../../firebase";
import { SyncService } from "../../services/SyncService";
import { CategoryService } from "../../services/CategoryService";
import { NewsItem, VideoItem, LeaderContent, Article } from "../../types";
import { CategoryBadges } from "../../components/CategoryBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, Headphones, Newspaper, Clock, PlayCircle, Play, MonitorPlay, ChevronLeft, X, Eye, User, Calendar, BookOpen, Star, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PullToRefresh } from "../../components/PullToRefresh";
import { FeaturedTopicsSlider } from "../../components/FeaturedTopicsSlider";
import { SEO } from "../../components/SEO";

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

function formatViews(views: number): string {
  if (!views) return "0";
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return views.toString();
}

function ShimmerNewsImage({
  src,
  alt,
  className = "",
  containerClassName = "",
}: {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${containerClassName}`}>
      {/* Animated Shimmer beam during image loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-0 bg-slate-200/90 dark:bg-slate-700/80 overflow-hidden">
          <div 
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent"
            style={{ willChange: "transform" }}
          />
        </div>
      )}

      {src && !error ? (
        <img
          src={src}
          alt={alt || ""}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Newspaper className="w-8 h-8 opacity-35" />
        </div>
      )}

      {/* Gentle ambient light reflection sweep over the image on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
    </div>
  );
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

  const getSliderItemUrl = (item: NewsItem) => {
    if (item.isLeader) {
      return routes.leaderItem(generateSlug(item.title || "", item.id));
    }
    if ((item as any).isVideoSliderItem || (item as any).type === "video" || (item as any).videoUrl) {
      return routes.watchItem(generateSlug(item.title || "", item.id));
    }
    return routes.news(generateSlug(item.title || "", item.id));
  };

  const isVideo = !!((currentItem as any).isVideoSliderItem || (currentItem as any).type === "video" || (currentItem as any).videoUrl);

  const displayCategory = currentItem.category === "المولد النبوي الشريف" 
    ? "المولد النبوي الشريف 1446هـ" 
    : currentItem.category;

  const { mDate, hDate } = formatPublishInfo(currentItem.createdAt);

  return (
    <div className="w-full relative select-none mb-2 px-2 sm:px-3 mt-1">
      <div className="relative w-full h-[376px] overflow-hidden bg-surface-card shadow-lg rounded-[20px] sm:rounded-[24px]">
        {/* Slider viewport */}
        <div className="w-full h-full relative overflow-hidden rounded-[20px] sm:rounded-[24px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ 
                duration: 0.6,
                ease: "easeInOut"
              }}
              style={{ 
                willChange: "transform, opacity",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)"
              }}
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
              <Link to={getSliderItemUrl(currentItem)} className="block w-full h-full relative group">
                {currentItem.imageUrl ? (
                  <img 
                    src={currentItem.imageUrl} 
                    alt={currentItem.title} 
                    className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#141B26] flex items-center justify-center pointer-events-none">
                    <Newspaper className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* Deeper multi-stop gradient overlay in Taiz brand colors for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/85 via-taiz-royal/40 to-transparent pointer-events-none"></div>
                
                {/* Play Button Overlay in center for Videos */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="relative flex items-center justify-center">
                      {/* Subtle outer pulse wave */}
                      <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 animate-ping opacity-30 pointer-events-none" />

                      {/* Play Button Icon */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/30 backdrop-blur-md border-2 border-white/80 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white/45 group-hover:border-white transition-all duration-300">
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1 drop-shadow-md" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Pill floating at middle-right height of the slider card */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20">
                  <CategoryBadges item={currentItem} isHero={true} className="drop-shadow-lg" />
                </div>

                {/* Pinned News Tag if applicable */}
                {currentItem.isPinned && !(currentItem as any).isVideoSliderItem && (
                  <div className="absolute top-[16px] left-0 z-10">
                    <span className="bg-blue-600 text-white text-[11px] sm:text-[13px] font-bold font-ibm w-[90px] sm:w-[100px] h-[30px] sm:h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5 shadow-md">
                      <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                      خبر مثبت
                    </span>
                  </div>
                )}

                {/* Content Container at the Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-12 sm:pb-14 flex flex-col justify-end text-right z-10 select-none" dir="rtl">
                   {/* Title / Headline */}
                   <h2 
                     className="font-bold text-[16px] sm:text-[19px] md:text-[22px] text-white leading-[1.35] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo text-right w-full mb-3 shadow-text"
                     style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                      {currentItem.title}
                    </h2>

                    {/* Metadata Row: Aligned beautifully in a single line RTL */}
                    <div className="flex flex-wrap items-center justify-start gap-x-4 sm:gap-x-5 gap-y-1.5 text-white/90 text-[10.5px] sm:text-[12.5px] font-medium w-full" dir="rtl">

                      {/* Hijri Date */}
                      {hDate && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-4 h-4 text-white/90 stroke-[1.75]" />
                          <span>{hDate}</span>
                        </div>
                      )}

                      {/* Gregorian Date */}
                      {mDate && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-4 h-4 text-white/90 stroke-[1.75]" />
                          <span>{mDate}</span>
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Views Badge - Positioned at bottom-left of the slider */}
                 <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-white text-[10.5px] sm:text-[12px] font-bold shadow-md pointer-events-none select-none">
                   <Eye className="w-3.5 h-3.5 text-red-400 dark:text-[#F26522] animate-pulse stroke-[2]" />
                   <span className="dark:text-[#F26522]">{formatViews(currentItem.views || 0)}</span>
                 </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Circular Pagination dots inside the image at the bottom center with dynamic size */}
        {sliderList.length > 1 && (
          <div 
            className={`absolute bottom-3 left-0 right-0 flex justify-center items-center z-20 pointer-events-auto ${
              sliderList.length > 8 ? "gap-1" : sliderList.length > 5 ? "gap-1.5" : "gap-2"
            }`}
          >
            {sliderList.map((_, idx) => {
              const isActive = idx === currentIndex;
              const total = sliderList.length;
              const dotSizeClass = total <= 3 
                ? (isActive ? "w-2.5 h-2.5 bg-taiz-sky shadow-[0_0_8px_rgba(30,66,117,0.5)] scale-110" : "w-2 h-2 bg-white/40 hover:bg-white/70")
                : total <= 5
                ? (isActive ? "w-2 h-2 bg-taiz-sky shadow-[0_0_6px_rgba(30,66,117,0.5)] scale-110" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70")
                : total <= 8
                ? (isActive ? "w-1.5 h-1.5 bg-taiz-sky shadow-[0_0_5px_rgba(30,66,117,0.5)] scale-110" : "w-1 h-1 bg-white/40 hover:bg-white/70")
                : (isActive ? "w-1.25 h-1.25 bg-taiz-sky shadow-[0_0_4px_rgba(30,66,117,0.5)] scale-110" : "w-1 h-1 bg-white/30 hover:bg-white/60");

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full ${dotSizeClass}`}
                  aria-label={`انتقال إلى الشريحة ${idx + 1}`}
                />
              );
            })}
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

  // Pagination / Infinite Scroll states for news
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [loadingMoreNews, setLoadingMoreNews] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMoreNews = async () => {
    if (loadingMoreNews || !hasMoreNews) return;
    setLoadingMoreNews(true);
    try {
      let minCreatedAt = Date.now();
      if (rawNews.length > 0) {
        minCreatedAt = Math.min(...rawNews.map(n => n.createdAt || Date.now()));
      }

      const q = query(
        collection(db, "news"),
        orderBy("createdAt", "desc"),
        where("createdAt", "<", minCreatedAt),
        limit(20)
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        setHasMoreNews(false);
      } else {
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
        const approvedOnly = fetched.filter(item => item.approvalStatus !== "pending_approval");
        
        setRawNews(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newUnique = approvedOnly.filter(i => !existingIds.has(i.id));
          const updated = [...prev, ...newUnique];
          localStorage.setItem("taiz_news_cache", JSON.stringify(updated.slice(0, 100)));
          return updated;
        });

        if (fetched.length < 20) {
          setHasMoreNews(false);
        }
      }
    } catch (err) {
      console.warn("Error loading more news:", err);
      setHasMoreNews(false);
    } finally {
      setLoadingMoreNews(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreNews && !loadingMoreNews && !loading) {
          loadMoreNews();
        }
      },
      { rootMargin: "300px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreNews, loadingMoreNews, loading, rawNews]);

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
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubCats = CategoryService.subscribeCategories((list) => {
      const catMap: Record<string, string> = {};
      list.forEach(c => {
        catMap[c.name] = c.color || "#3B82F6";
      });
      setCategories(catMap);
      localStorage.setItem("news_categories_color_cache", JSON.stringify(catMap));
    });
    return () => unsubCats();
  }, []);

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
        isPinned: !!(item.showInSlider || item.isFeatured || item.isPinned),
        isFeatured: !!(item.showInSlider || item.isFeatured),
        createdAt: item.createdAt,
        views: item.views || 0,
        isLeader: true,
      }));
    
    const combined = [...rawNews, ...mappedLeaderTexts];
    combined.sort((a, b) => b.createdAt - a.createdAt);
    return combined.filter(item => item.approvalStatus !== "pending_approval");
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
    combined.sort((a, b) => b.createdAt - a.createdAt);
    return combined.slice(0, 10);
  }, [rawVideos, rawLeader]);



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
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      const sliced = sorted.slice(0, 30);
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

  // Determine news/video/leader items for the slider (strictly latest 5 items)
  const sliderItems = useMemo(() => {
    // Leader video items flagged specifically for slider
    const featuredLeaderVideos: NewsItem[] = rawLeader
      .filter(item => item.type === "video" && !!item.showInSlider)
      .map(item => ({
        id: item.id,
        title: item.title,
        shortDescription: item.description || "",
        content: item.description || item.title,
        imageUrl: item.thumbnailUrl || "",
        category: "السيد القائد",
        isBreaking: false,
        createdAt: item.createdAt,
        views: item.views || 0,
        isLeader: true,
        videoUrl: item.content,
        isVideoSliderItem: true
      }));

    // Regular videos flagged specifically for slider
    const featuredVideos: NewsItem[] = rawVideos
      .filter(item => !!item.showInSlider)
      .map(item => ({
        id: item.id,
        title: item.title,
        shortDescription: item.description || "",
        content: item.description || item.title,
        imageUrl: item.thumbnailUrl || "",
        category: item.category || "فيديو",
        isBreaking: false,
        createdAt: item.createdAt,
        views: item.views || 0,
        videoUrl: item.url,
        isVideoSliderItem: true
      }));

    const getTime = (val: any): number => {
      if (!val) return 0;
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const parsed = Date.parse(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (typeof val === "object") {
        if (typeof val.toDate === "function") return val.toDate().getTime();
        if (typeof val.seconds === "number") return val.seconds * 1000;
      }
      return 0;
    };

    // Combine all candidate items: latest news + videos with showInSlider enabled
    const allCandidateItems = [...news, ...featuredLeaderVideos, ...featuredVideos];
    const uniqueMap = new Map<string, NewsItem>();
    allCandidateItems.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    const combinedList = Array.from(uniqueMap.values());

    // Sort strictly by createdAt descending so slider always shows newest items first
    combinedList.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

    // Limit to latest 5 items only
    return combinedList.slice(0, 5);
  }, [news, rawLeader, rawVideos]);

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
    <SEO 
      title="منصة تعز الإعلامية" 
      description="إعلام ينقل الواقع ويستنير بالقرآن والقائد" 
      imageUrl="https://taiz-media-ye.vercel.app/TAIZMEDIAPLATFORM.jpg" 
      path="/" 
    />
    <motion.div 
      id="home-main-section"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-[760px] mx-auto w-full pb-16 bg-white dark:bg-[#070F1E] text-text-primary transition-colors duration-200"
    >
      
      
      <div className="p-0">
        <AnimatePresence mode="wait">
          {activeSubTab === "news" ? (
            <motion.div
              key="news-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ willChange: "opacity" }}
              className="touch-pan-y"
            >
        {loading ? (
           <div className="space-y-6 pt-4 px-2 sm:px-3">
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
             <Newspaper className="w-16 h-16 mx-auto mb-4 text-taiz-sky opacity-40" />
             <p className="text-lg font-bold text-text-primary">لا توجد أخبار حالياً</p>
          </div>
        ) : (
          <div className="space-y-0">
            
            {/* LATEST NEWS HEADER */}
            {/* Innovative Creative Dual Segmented Navigation Switcher */}
            <div className="pt-1.5 pb-2 px-2 sm:px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="max-w-[760px] mx-auto w-full px-1">
                {/* Premium Segmented Switcher Pills (Full Width) */}
                <div id="tour-home-tabs" className="w-full bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-700/80 grid grid-cols-2 gap-1 shadow-inner select-none">
                  {/* News Tab (Active) */}
                  <Link
                    to="/"
                    title="قسم الأخبار والتقارير"
                    className="relative flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black font-cairo transition-all duration-300 active:scale-95 text-white"
                  >
                    <motion.div
                      layoutId="news-articles-tab-pill"
                      className="absolute inset-0 bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal rounded-lg sm:rounded-xl shadow-xs border border-taiz-sky/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <Newspaper className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span className="whitespace-nowrap">الأخبار والتقارير</span>
                    </span>
                  </Link>

                  {/* Articles Tab (Inactive) */}
                  <Link
                    to="/articles"
                    title="قسم المقالات والآراء"
                    className="relative flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold font-cairo transition-all duration-300 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <PenTool className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-teal-400 transition-colors" />
                      <span className="whitespace-nowrap">مقالات وآراء</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* HERO FEATURED POST SLIDER */}
            <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-1 mb-2 px-0">
               <NewsSlider sliderList={sliderItems} />
            </div>

            {/* FEATURED TOPICS SLIDER */}
            <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-1 mb-2">
              <FeaturedTopicsSlider />
            </div>

            {/* LATEST VIDEOS SECTION */}
            {videos.length > 0 && (
              <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-2 mb-2 mx-0 sm:mx-0">
                <div className="py-1 px-3 sm:px-4 relative">
                  <div className="flex items-center gap-2 mb-2.5 select-none" dir="rtl">
                    <Link to="/watch" className="flex items-center gap-2 group cursor-pointer shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky dark:from-transparent dark:to-transparent dark:bg-[#F26522]/15 dark:border dark:border-[#F26522]/40 flex items-center justify-center shadow-sm transition-colors">
                        <MonitorPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-[#F26522]" />
                      </div>
                      <div className="flex flex-col text-right">
                        <h2 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight group-hover:text-taiz-sky dark:group-hover:text-[#F26522] transition-colors">أحدث الفيديوهات</h2>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">شاهد آخر التغطيات والتقارير المرئية</p>
                      </div>
                    </Link>
                    
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2"></div>

                    <div className="hidden sm:flex items-center gap-1.5 mr-2">
                      <Link 
                        to="/watch"
                        className="text-[10px] sm:text-[11px] font-bold text-taiz-sky hover:text-taiz-royal transition-colors py-0.5 px-2.5 bg-taiz-sky/10 hover:bg-taiz-sky/20 rounded-md whitespace-nowrap"
                      >
                        عرض الكل
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar relative z-10 overscroll-x-contain" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {videos.map((video, vIdx) => (
                       <motion.div
                         key={video.id}
                         initial={{ opacity: 0, y: 14 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true, amount: 0.15 }}
                         transition={{ duration: 0.45, delay: vIdx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                         whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
                         className="snap-start shrink-0 w-[240px] sm:w-[280px]"
                       >
                         <Link 
                           id={`home-video-${video.id}`}
                           to={video.isLeader ? routes.leaderItem(generateSlug(video.title || "", video.id)) : routes.watchItem(generateSlug(video.title || "", video.id))} 
                           className="group block outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky rounded-[12px] h-full"
                         >
                            <div className="relative h-[135px] sm:h-[155px] rounded-[12px] overflow-hidden bg-gray-900 shadow-sm group-hover:shadow-lg active:scale-95 transition-all duration-300 border border-slate-200/50">
                               {video.thumbnailUrl ? (
                                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                               ) : (
                                  <div className="w-full h-full bg-gray-800"></div>
                               )}
                               <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                               
                               <div className="absolute top-2 right-2 z-30">
                                  <CategoryBadges category={video.category || "فيديو"} isSecondary={true} className="drop-shadow-sm" />
                               </div>
                               
                               <div className="absolute top-2 left-2 z-30 pointer-events-none">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-taiz-sky group-hover:border-white transition-all duration-300">
                                     <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white ml-0.5 drop-shadow-sm" />
                                  </div>
                               </div>
                               
                               <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-right">
                                  <h4 className="text-white text-[12px] sm:text-[13px] font-bold leading-[1.4] line-clamp-3 transition-colors font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
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
                       </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VISUAL SEPARATOR FOR NEWS CARDS */}
            <div className="flex items-center gap-2 px-3 sm:px-4 my-2.5 select-none" dir="rtl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky dark:from-transparent dark:to-transparent dark:bg-[#F26522]/15 dark:border dark:border-[#F26522]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors">
                <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-[#F26522]" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">أخبار وتقارير</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">تغطية إخبارية مفصلة للأحداث</p>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2 mr-4"></div>
            </div>

            {/* LIST OF OTHER POSTS */}
            <div className="flex flex-col">
              {news.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  className="relative" 
                  initial={{ opacity: 0, y: 18 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, transition: { duration: 0.25, ease: "easeOut" } }}
                >
                  {item.isFeaturedLayout ? (
                    <div className="w-full relative select-none mb-3 px-2 sm:px-3 mt-1">
                      <div className="relative w-full h-[376px] overflow-hidden bg-surface-card shadow-lg rounded-[20px] sm:rounded-[24px] border border-black/5 dark:border-white/10 hover:border-red-500 dark:hover:border-red-500 hover:shadow-[0_8px_30px_rgba(239,68,68,0.18)] active:scale-[0.98] active:opacity-95 transition-all duration-300 ease-out group will-change-transform outline-none touch-manipulation cursor-pointer">
                        <Link 
                          to={item.isLeader ? routes.leaderItem(generateSlug(item.title || "", item.id)) : routes.news(generateSlug(item.title || "", item.id))} 
                          className="block w-full h-full relative"
                          style={{ direction: 'rtl', transform: 'translateZ(0)' }}
                        >
                          {/* Transparent Gradient Overlay across entire card on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-red-600/25 via-red-500/10 to-red-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
                          <div className="absolute inset-0 bg-gradient-to-r from-red-600/[0.08] via-transparent to-red-600/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
                          
                          {/* Active Press Feedback */}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-active:opacity-100 transition-opacity duration-100 pointer-events-none z-30" />
                          
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105" 
                            />
                          ) : (
                            <div className="w-full h-full bg-[#141B26] flex items-center justify-center pointer-events-none">
                              <Newspaper className="w-12 h-12 text-white/20" />
                            </div>
                          )}
                          
                          {/* Deeper multi-stop gradient overlay in Taiz brand colors for readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/85 via-taiz-royal/40 to-transparent pointer-events-none"></div>
                          
                          {/* Category Pill floating at top-right of the card */}
                          <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20">
                            <CategoryBadges item={item} isHero={true} className="drop-shadow-lg" />
                          </div>

                          {/* Pinned News Tag if applicable */}
                          {item.isPinned && !(item as any).isVideoSliderItem && (
                            <div className="absolute top-[16px] left-0 z-20">
                              <span className="bg-blue-600 text-white text-[11px] sm:text-[13px] font-bold font-ibm w-[90px] sm:w-[100px] h-[30px] sm:h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5 shadow-md">
                                <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                                خبر مثبت
                              </span>
                            </div>
                          )}

                          {/* Content Container at the Bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-12 sm:pb-14 flex flex-col justify-end text-right z-10 select-none" dir="rtl">
                             {/* Title / Headline */}
                             <h2 
                               className="font-bold text-[16px] sm:text-[19px] md:text-[22px] text-white leading-[1.35] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo text-right w-full mb-3 shadow-text"
                               style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                                {item.title}
                              </h2>

                              {/* Metadata Row: Aligned in a single line RTL */}
                              <div className="flex flex-wrap items-center justify-start gap-x-4 sm:gap-x-5 gap-y-1.5 text-white/90 text-[10.5px] sm:text-[12.5px] font-medium w-full" dir="rtl">

                                {/* Hijri Date */}
                                {formatPublishInfo(item.createdAt).hDate && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Calendar className="w-4 h-4 text-white/90 stroke-[1.75]" />
                                    <span>{formatPublishInfo(item.createdAt).hDate}</span>
                                  </div>
                                )}

                                {/* Gregorian Date */}
                                {formatPublishInfo(item.createdAt).mDate && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Calendar className="w-4 h-4 text-white/90 stroke-[1.75]" />
                                    <span>{formatPublishInfo(item.createdAt).mDate}</span>
                                  </div>
                                )}
                              </div>
                           </div>

                           {/* Views Badge - Positioned at bottom-left of the card */}
                           <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-white text-[10.5px] sm:text-[12px] font-bold shadow-md pointer-events-none select-none">
                             <Eye className="w-3.5 h-3.5 text-red-400 dark:text-[#F26522] animate-pulse stroke-[2]" />
                             <span className="dark:text-[#F26522]">{formatViews(item.views || 0)}</span>
                           </div>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={item.isLeader ? routes.leaderItem(generateSlug(item.title || "", item.id)) : routes.news(generateSlug(item.title || "", item.id))} 
                      className="flex items-center bg-white dark:bg-slate-900 rounded-[14px] mx-2 sm:mx-3 mb-2 overflow-hidden group relative border border-slate-200/80 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:shadow-[0_4px_18px_rgba(239,68,68,0.12)] hover:-translate-y-0.5 active:scale-[0.98] active:bg-slate-50 transition-all duration-300 ease-out h-[105px] sm:h-[120px] will-change-transform outline-none touch-manipulation cursor-pointer"
                      style={{ direction: 'rtl', transform: 'translateZ(0)' }}
                    >
                      {/* Transparent Gradient Overlay across entire card on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-l from-red-500/[0.09] via-red-500/[0.03] to-red-500/[0.01] pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20" />
                      <div className="absolute inset-0 bg-gradient-to-t from-red-500/[0.06] via-transparent to-transparent pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20" />
                      
                      {/* Active Press Feedback */}
                      <div className="absolute inset-0 bg-red-950/5 opacity-0 group-active:opacity-100 transition-opacity duration-75 pointer-events-none z-30" />

                      {/* Right Side Compact Image with Shimmer */}
                      <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 overflow-hidden">
                        <ShimmerNewsImage 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="group-hover:scale-105"
                          containerClassName="w-full h-full"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
                        <div className="absolute bottom-1.5 inset-x-1 flex justify-center z-20 pointer-events-none">
                          <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                        </div>
                      </div>

                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right z-10">
                         <div>
                            <h3 
                              className="font-bold text-[11px] sm:text-[12px] leading-[1.5] transition-colors duration-300 group-hover:text-red-600 mb-2 whitespace-normal line-clamp-3 font-cairo text-gray-900 dark:text-gray-100"
                              style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
                            >
                              {item.title}
                            </h3>
                            {/* Consistently aligned metadata line */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] sm:text-[9px] font-bold text-slate-500 mt-auto transition-colors duration-300 group-hover:text-slate-600">
                               
                               <span className="shrink-0 dark:text-amber-400">{formatPublishInfo(item.createdAt).hDate}</span>
                               <span className="shrink-0 dark:text-amber-400">{formatPublishInfo(item.createdAt).mDate}</span>
                               <span className="shrink-0 dark:text-amber-400">{formatPublishInfo(item.createdAt).mTime}</span>
                               
                               {/* Views with Red Continuous Pulsing Eye Icon */}
                               <span className="flex items-center gap-1 shrink-0 mr-auto dark:text-[#F26522]">
                                 <Eye className="w-3 h-3 text-red-500 dark:text-[#F26522] animate-pulse shrink-0"/> 
                                 <span>{item.views || 0}</span>
                               </span>
                            </div>
                         </div>
                      </div>
                    </Link>
                  )}
                </motion.div>
              ))}
              {/* End of news items list */}
            </div>

            {/* News Infinite Scroll Sentinel & Loader */}
            <div ref={loadMoreRef} className="py-6 text-center select-none font-cairo my-2">
              {loadingMoreNews && (
                <div className="flex items-center justify-center gap-2 text-taiz-sky font-bold text-sm bg-slate-50 dark:bg-slate-800/60 py-3 px-4 rounded-xl mx-3 shadow-xs border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-5 h-5 border-2 border-taiz-sky border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تحميل المزيد من الأخبار...</span>
                </div>
              )}
              {!hasMoreNews && news.length > 0 && (
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 py-2">
                  تم عرض جميع الأخبار
                </p>
              )}
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
          className="px-2 sm:px-3 space-y-6 pt-4 min-h-[60vh]"
        >
          {/* Featured Article in Tab */}
          {articles.length > 0 && (
            <Link to={routes.article(generateSlug(articles[0].title || '', articles[0].id))} className="block group">
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border border-border-light">
                {articles[0].imageUrl ? (
                  <img src={articles[0].imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/85 via-taiz-royal/40 to-transparent pointer-events-none"></div>
                <div className="absolute top-4 right-4">
                  <span className="bg-status-error text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    مقال مميز
                  </span>
                </div>
                <div className="absolute bottom-6 right-6 left-6 text-right">
                  <h3 className="text-white text-lg font-black mb-4 leading-[1.5] line-clamp-3 font-cairo">{articles[0].title}</h3>
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
                to={routes.article(generateSlug(article.title || '', article.id))} 
                className="flex items-center gap-4 p-3 bg-white rounded-[14px] border border-slate-200/80 shadow-soft hover:shadow-medium hover:bg-slate-50/50 transition-all duration-300"
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
                  <h4 className="font-black text-[13px] leading-[1.5] mb-2 line-clamp-3 transition-colors group-hover:text-taiz-sky font-cairo">{article.title}</h4>
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
