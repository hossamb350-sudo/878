import React, { useEffect, useState, useRef } from "react";
import { updateMetadata } from "../../utils/metadata";
import { extractIdFromSlug, generateSlug, routes } from "../../utils/routes";
import { shareContent } from "../../utils/share";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { SyncService } from "../../services/SyncService";
import { NewsItem } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Bookmark, 
  Share2, 
  Eye, 
  Plus, 
  Minus,
  Check,
  Twitter,
  Facebook,
  MessageCircle,
  Clock,
  User,
  Star,
  Printer,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Newspaper,
  Send,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getShareableUrl } from "../../config/apiConfig";
import { CategoryBadges } from "../../components/CategoryBadges";
import { SEO } from "../../components/SEO";

export function NewsDetail() {
  const { slug } = useParams();
  const id = extractIdFromSlug(slug || "");
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("news_font_size");
    return saved ? parseInt(saved, 10) : 16;
  });

  useEffect(() => {
    localStorage.setItem("news_font_size", fontSize.toString());
  }, [fontSize]);

  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgGalleryIndex, setImgGalleryIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active thumbnail into view horizontally without moving the window vertically
  useEffect(() => {
    const container = thumbnailContainerRef.current;
    const activeBtn = activeThumbnailRef.current;
    if (container && activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeBtn.getBoundingClientRect();
      
      const relativeLeft = activeRect.left - containerRect.left;
      const absoluteLeft = relativeLeft + container.scrollLeft;
      
      const targetScrollLeft = absoluteLeft - (containerRect.width / 2) + (activeRect.width / 2);
      
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    }
  }, [currentSlide]);

  // Reset zoom on slide change in gallery
  useEffect(() => {
    setZoomScale(1);
  }, [imgGalleryIndex]);

  // Combine primary image and additional images into unified array
  const allImages = news ? [
    ...(news.imageUrl ? [news.imageUrl] : []),
    ...(news.additionalImages || [])
  ].filter(Boolean) as string[] : [];

  const openGallery = (index: number) => {
    setImgGalleryIndex(index);
    if (!window.location.hash.includes("gallery")) {
      const currentState = window.history.state || {};
      window.history.pushState({ ...currentState, galleryOpen: true }, "", "#gallery");
    }
  };

  const closeGallery = () => {
    setImgGalleryIndex(null);
    if (window.location.hash.includes("gallery") || window.history.state?.galleryOpen) {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (!window.location.hash.includes("gallery")) {
        setImgGalleryIndex(null);
      }
    };

    const handleCustomClose = () => {
      setImgGalleryIndex(null);
      if (window.location.hash.includes("gallery")) {
        window.history.back();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    window.addEventListener("close-modal-gallery", handleCustomClose);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
      window.removeEventListener("close-modal-gallery", handleCustomClose);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imgGalleryIndex === null || allImages.length === 0) return;      
      if (e.key === "Escape") {
        closeGallery();
      } else if (e.key === "ArrowLeft") {
        if (imgGalleryIndex < allImages.length - 1) {
          setImgGalleryIndex(imgGalleryIndex + 1);
        }
      } else if (e.key === "ArrowRight") {
        if (imgGalleryIndex > 0) {
          setImgGalleryIndex(imgGalleryIndex - 1);
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imgGalleryIndex, allImages]);

  // Auto slide interval for the news hero card
  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [allImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("favorite_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((item: any) => typeof item === "string" ? item : item.id);
        setSavedArticles(parsed);
        if (id) {
          setIsBookmarked(parsed.includes(id));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchNews = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const cachedNews = await SyncService.getCache<NewsItem>("news");
        let foundNews = cachedNews.find(n => n.id === id) || null;

        if (foundNews) {
          setNews(foundNews);
        } else {
          const d = await getDoc(doc(db, "news", id));
          if (d.exists()) {
            foundNews = { id: d.id, ...d.data() } as NewsItem;
            setNews(foundNews);
          }
        }

        if (foundNews) {
          let rItems = cachedNews.filter(n => n.category === foundNews!.category && n.id !== id);
          if (rItems.length < 3) {
            rItems = cachedNews.filter(n => n.id !== id);
          }
          setRelated(rItems.slice(0, 4));
          
          try {
            await updateDoc(doc(db, "news", id), {
              views: increment(1)
            });
          } catch(e) {
            console.warn("Could not increment views", e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id]);

  const toggleBookmark = () => {
    if (!news) return;
    
    const saved = localStorage.getItem("favorite_items");
    let favs: any[] = saved ? JSON.parse(saved) : [];
    const isFav = favs.some((item: any) => item.id === news.id);
    
    if (isFav) {
      favs = favs.filter((item: any) => item.id !== news.id);
      setSavedArticles(savedArticles.filter(fid => fid !== news.id));
      setIsBookmarked(false);
    } else {
      favs.push({
        id: news.id,
        type: "news",
        title: news.title,
        imageUrl: news.imageUrl,
        savedAt: Date.now()
      });
      setSavedArticles([...savedArticles, news.id]);
      setIsBookmarked(true);
    }
    
    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  const handleShare = async (platform: string) => {
    if (!news) return;

    if (platform === "print") {
      window.print();
      return;
    }

    // Try Web Share API first for all share actions (if supported)
    if (typeof navigator.share !== "undefined") {
      const res = await shareContent({
        title: news.title,
        type: "news",
        id: news.id || id,
        imageUrl: news.imageUrl
      });
      if (res.native) {
        return; // Native share successful
      }
    }

    const url = getShareableUrl(`/news/${news?.id || id}`);
    const text = news?.title || "";

    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  const formatPublishInfo = (timestamp: number) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-taiz-sky mb-4"></div>
        <p className="font-bold text-text-secondary font-alexandria text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-white text-text-primary flex flex-col items-center justify-center p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-4 font-alexandria">الخبر غير موجود</h2>
        <button onClick={() => navigate("/")} className="btn-primary">العودة للرئيسية</button>
      </div>
    );
  }

  const { mDate, mTime, hDate } = formatPublishInfo(news.createdAt);
  const isModified = news.updatedAt && news.updatedAt > news.createdAt + 60000;
  const modInfo = isModified ? formatPublishInfo(news.updatedAt!) : null;

  return (
    <div className="min-h-screen bg-white text-text-primary pb-20 font-sans relative" dir="rtl">
      <SEO 
        title={news.title}
        description={news.shortDescription || ""}
        imageUrl={news.imageUrl || ""}
        type="article"
        path={window.location.pathname}
      />
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-taiz-sky to-taiz-royal transition-all duration-75" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Inline Top Navigation Actions */}
      <div className="max-w-[760px] mx-auto w-full px-4 pt-4 sm:pt-6 flex justify-between items-center text-text-primary" dir="rtl">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-text-primary flex items-center gap-1 font-bold text-xs font-alexandria"
        >
          <ArrowRight className="w-5 h-5 text-taiz-sky" />
          <span>رجوع</span>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={toggleBookmark}
            className={`p-2 rounded-full transition-colors ${isBookmarked ? "text-taiz-sky bg-taiz-sky/10" : "hover:bg-slate-100 text-text-primary"}`}
            title="حفظ الخبر"
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => handleShare("print")} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-text-primary" title="طباعة المقال">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={() => handleShare("copy")} className="p-2 hover:bg-slate-100 rounded-full transition-colors relative text-text-primary" title="نسخ الرابط">
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div className="max-w-[760px] mx-auto w-full px-4 pt-3 sm:pt-4 pb-2 text-right border-b border-slate-100/40 dark:border-stone-800/20" dir="rtl">
        <h1 className="font-extrabold text-[20px] sm:text-[24px] md:text-[26px] text-slate-900 dark:text-white leading-[1.45] font-cairo">
          {news.title}
        </h1>
      </div>

      <div className="max-w-[760px] mx-auto w-full px-0 pt-2 sm:pt-3 pb-0">
        {/* Featured News Card Header - Integrated Slider with horizontal controls */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full aspect-[16/10] sm:aspect-video overflow-hidden bg-slate-50 dark:bg-stone-950/20 mb-3 select-none group rounded-none shadow-xs border-y border-slate-200/20 dark:border-stone-800/25"
        >
          {/* Horizontal Swiping Container */}
          <div 
            className="absolute inset-0 w-full h-full cursor-zoom-in"
            onClick={() => openGallery(currentSlide)}
            title="انقر لتكبير وعرض الصورة"
          >
            {allImages.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentSlide}
                  src={allImages[currentSlide]} 
                  alt={news.title} 
                  className="w-full h-full object-cover absolute inset-0" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-[#141B26] flex items-center justify-center">
                <Newspaper className="w-12 h-12 text-white/20" />
              </div>
            )}
          </div>

          {/* Current Slide Counter Index Badge */}
          {allImages.length > 0 && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold font-sans tracking-wide z-20 flex items-center gap-1" dir="ltr">
              <span>{currentSlide + 1}</span>
              <span className="text-white/40">/</span>
              <span>{allImages.length}</span>
            </div>
          )}

          {/* Views badge - compact eye icon with views count on the far left inside the slider */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-full text-xs font-bold font-sans tracking-wide z-20 flex items-center gap-1.5 shadow-md border border-white/10" dir="ltr">
            <Eye className="w-3.5 h-3.5 stroke-[2] text-red-500 animate-pulse" />
            <span>{news.views || 4}</span>
          </div>

          {/* Left/Right manual slide buttons with compatible styles */}
          {allImages.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-20 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="p-2.5 bg-black/40 hover:bg-taiz-sky active:scale-95 text-white rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto cursor-pointer shadow-lg"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-5.5 h-5.5 stroke-[2.5]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev + 1) % allImages.length);
                }}
                className="p-2.5 bg-black/40 hover:bg-taiz-sky active:scale-95 text-white rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto cursor-pointer shadow-lg"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-5.5 h-5.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Category Pill floating at top-right area */}
          <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-2 pointer-events-none">
            <CategoryBadges item={news} isHero={true} className="drop-shadow-lg" />

            {news.isBreaking && (
              <span className="bg-red-600 text-white font-extrabold text-xs font-alexandria px-3 py-1.5 rounded-lg animate-pulse shadow-md">
                خبر عاجل
              </span>
            )}
          </div>
        </motion.div>

        {/* Dynamic Image Thumbnails underneath Slider */}
        {allImages.length > 1 && (
          <div className="px-4 sm:px-5 mb-1 flex items-center justify-center w-full">
            <div ref={thumbnailContainerRef} className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full scrollbar-none justify-start snap-x snap-mandatory scroll-smooth" dir="rtl">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  ref={idx === currentSlide ? activeThumbnailRef : undefined}
                  onClick={() => setCurrentSlide(idx)}
                  className={`relative w-14 h-10 rounded-md overflow-hidden shrink-0 snap-center transition-all ${
                    idx === currentSlide 
                      ? "ring-2 ring-taiz-sky scale-105 opacity-100" 
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-5 mt-1">
        {/* News Metadata Card - Extra Compact with Platform Navy branding & 11px Font */}
        <div className="bg-slate-50/40 dark:bg-stone-900/20 border border-slate-200/20 dark:border-stone-800/40 rounded-lg p-2 sm:p-2.5 shadow-xs mb-2 mt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 font-cairo text-right" dir="rtl">
          {/* Author info with brand circular navy badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6.5 h-6.5 bg-taiz-navy/10 dark:bg-taiz-navy/20 rounded-full flex items-center justify-center text-taiz-navy dark:text-taiz-soft shrink-0">
              <User className="w-3 h-3 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold leading-none mb-0.5">تحرير</p>
              <p className="text-[11px] font-black text-slate-800 dark:text-zinc-200">{news.author || "هيثم اليوسفي"}</p>
            </div>
          </div>

          <div className="h-px sm:h-5 w-full sm:w-px bg-slate-200/50 dark:bg-stone-800/40" />

          {/* Inline Dates & Times using 11px size & Navy Blue icons */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-zinc-400 font-bold">
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-taiz-navy dark:text-taiz-soft stroke-[2.5]" />
              <span>{mDate ? `${mDate} م` : "15 مايو 2024 م"}</span>
            </div>

            <span className="text-slate-200 dark:text-stone-800 font-normal hidden sm:inline">|</span>

            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-taiz-navy dark:text-taiz-soft stroke-[2.5]" />
              <span>{hDate || "29 ذو القعدة 1445 هـ"}</span>
            </div>
          </div>
        </div>

        {/* Interaction Bar (شريط التفاعل) matching mockup design */}
        <div className="my-2 bg-[#fafafa]/90 dark:bg-stone-900/40 border border-slate-200/50 dark:border-stone-800/80 rounded-full px-4 py-2 shadow-sm flex items-center justify-between max-w-full mx-auto backdrop-blur-sm">
          {/* Left side: Font Size Adjuster in mockup (+ 28px -) */}
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-bold text-sm font-cairo">
            <button 
              onClick={() => setFontSize(f => Math.min(f + 1, 32))} 
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-full transition-colors text-base font-bold"
              title="تكبير الخط"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="font-sans text-sm tracking-tight text-slate-700 dark:text-slate-200 min-w-[34px] text-center font-bold">
              {fontSize}px
            </span>
            <button 
              onClick={() => setFontSize(f => Math.max(f - 1, 14))} 
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-full transition-colors text-base font-bold"
              title="تصغير الخط"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Right side: Circular Social Icons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleShare("whatsapp")} 
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-emerald-500 transition-all duration-200"
              title="مشاركة عبر واتساب"
            >
              <MessageCircle className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => handleShare("twitter")} 
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-black dark:hover:text-white transition-all duration-200"
              title="مشاركة عبر إكس"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button 
              onClick={() => handleShare("facebook")} 
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-blue-600 transition-all duration-200"
              title="مشاركة عبر فيسبوك"
            >
              <Facebook className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => handleShare("telegram")} 
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-sky-400 transition-all duration-200"
              title="مشاركة عبر تليجرام"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Markdown Body */}
        <div 
          className="prose prose-slate max-w-none text-slate-800 dark:text-slate-100 text-justify leading-[2.0] mb-10 font-cairo [&_p]:mb-5"
          style={{ fontSize: `${fontSize}px` }}
        >
          <ReactMarkdown>{news.content}</ReactMarkdown>
        </div>

        {/* Last update notice */}
        {isModified && modInfo && (
          <div className="text-xs text-slate-400 flex items-center gap-1 mb-8 font-ibm">
            <Clock className="w-3.5 h-3.5" />
            <span>آخر تحديث: {modInfo.mDate} - الساعة {modInfo.mTime}</span>
          </div>
        )}

        {/* Live Updates Timeline */}
        {news.liveUpdates && news.liveUpdates.length > 0 && (
          <div className="mb-10 bg-surface-card rounded-2xl p-6 border border-border-light shadow-soft font-ibm text-text-primary">
             <div className="flex items-center gap-2 mb-6 border-b border-border-light pb-3">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
               </span>
               <h3 className="text-base font-bold text-text-primary font-alexandria">التغطية الحية والمستمرة</h3>
             </div>
             
             <div className="space-y-6 relative before:absolute before:right-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
               {[...news.liveUpdates].sort((a,b) => {
                 const timeA = typeof a.time === 'number' ? a.time : (a.timestamp || 0);
                 const timeB = typeof b.time === 'number' ? b.time : (a.timestamp || 0);
                 return timeB - timeA;
               }).map((update) => (
                 <div key={update.id} className="relative pr-7">
                   <span className="absolute right-1 top-2 w-3 h-3 rounded-full bg-red-600 z-10 border-2 border-white shadow-sm"></span>
                   
                   <div className="bg-slate-50/80 rounded-xl p-4 border border-border-subtle shadow-sm">
                     <span className="text-xs font-bold text-red-600 mb-1.5 block font-ibm">
                       {typeof update.time === 'number' || update.timestamp ? formatPublishInfo(typeof update.time === 'number' ? update.time : update.timestamp!).mTime : update.time}
                     </span>
                     <p className="font-normal text-text-primary leading-relaxed text-justify font-ibm text-sm">
                       {update.text}
                     </p>
                     
                     {update.imageUrl && (
                       <div className="mt-3 rounded-lg overflow-hidden border border-border-light bg-slate-50">
                         <a href={update.imageUrl} target="_blank" rel="noopener noreferrer">
                           <img src={update.imageUrl} alt={update.imageTitle || update.text} className="w-full h-auto max-h-[300px] object-cover hover:opacity-95 transition-opacity" />
                         </a>
                         {update.imageTitle && <p className="p-2 text-xs text-slate-500 text-center font-ibm">{update.imageTitle}</p>}
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Related News */}
        {related.length > 0 && (
          <div className="border-t border-border-light pt-8 mt-8">
             <h3 className="text-lg font-bold font-alexandria mb-4 flex items-center gap-2 text-text-primary">
                <div className="w-1 h-5 bg-taiz-sky rounded-full"></div>
                أخبار ذات صلة
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(rItem => (
                  <Link 
                    key={rItem.id} 
                    to={routes.news(generateSlug(rItem.title || "", rItem.id))} 
                    className="group flex gap-3 bg-surface-card rounded-xl p-3 border border-border-light hover:border-taiz-sky/30 transition-all shadow-soft"
                  >
                     <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                        <img src={rItem.imageUrl || "https://i.pravatar.cc/150"} alt={rItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                     </div>
                     <div className="flex flex-col justify-between flex-1 min-w-0">
                        <h4 className="font-bold font-alexandria text-xs sm:text-sm text-text-primary line-clamp-2 leading-snug">{rItem.title}</h4>
                        <span className="text-[10px] font-ibm text-slate-400 mt-1">{formatPublishInfo(rItem.createdAt).mDate}</span>
                     </div>
                  </Link>
                ))}
             </div>
          </div>
        )}

        {/* Full Screen Image Gallery Modal */}
        {imgGalleryIndex !== null && allImages.length > 0 && (
          <div 
            data-gallery-open="true"
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeGallery}
          >
               <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[210]" onClick={(e) => e.stopPropagation()}>
                  <span className="text-white/70 font-bold text-sm drop-shadow-md font-ibm" style={{ direction: "ltr" }}>
                    {imgGalleryIndex + 1} / {allImages.length}
                  </span>
                  
                  {/* Zoom and close controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setZoomScale(prev => Math.min(prev + 0.5, 4))}
                      className="text-white bg-black/50 hover:bg-white/20 p-2 rounded-full transition-colors drop-shadow-md cursor-pointer"
                      title="تكبير"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setZoomScale(prev => Math.max(prev - 0.5, 1))}
                      className="text-white bg-black/50 hover:bg-white/20 p-2 rounded-full transition-colors drop-shadow-md cursor-pointer"
                      title="تصغير"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    {zoomScale > 1 && (
                      <button 
                        onClick={() => setZoomScale(1)}
                        className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full transition-colors drop-shadow-md cursor-pointer font-cairo font-bold animate-fade-in"
                      >
                        إعادة ضبط
                      </button>
                    )}
                    <button onClick={closeGallery} className="text-white bg-black/50 hover:bg-white/20 p-2 rounded-full transition-colors drop-shadow-md cursor-pointer">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
               </div>
               
               <div className="relative flex items-center justify-center w-full max-w-4xl h-[70vh] sm:h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <AnimatePresence mode="popLayout">
                    <motion.img 
                      key={imgGalleryIndex}
                      src={allImages[imgGalleryIndex]} 
                      alt={`Gallery image ${imgGalleryIndex + 1}`} 
                      className="max-w-full max-h-full object-contain select-none cursor-grab active:cursor-grabbing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: zoomScale }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      drag={zoomScale > 1 ? true : "x"}
                      dragConstraints={zoomScale > 1 ? undefined : { left: 0, right: 0 }}
                      dragElastic={zoomScale > 1 ? 0.2 : 0.6}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setZoomScale(prev => prev > 1 ? 1 : 2.5);
                      }}
                      onDragEnd={(event, info) => {
                        if (zoomScale > 1) return;
                        const swipeThreshold = 50;
                        if (info.offset.x > swipeThreshold) {
                          if (imgGalleryIndex > 0) {
                              setImgGalleryIndex(imgGalleryIndex - 1);
                          }
                        } else if (info.offset.x < -swipeThreshold) {
                          if (imgGalleryIndex < allImages.length - 1) {
                              setImgGalleryIndex(imgGalleryIndex + 1);
                          }
                        }
                      }}
                    />
                  </AnimatePresence>
                  
                  {imgGalleryIndex > 0 && zoomScale === 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex - 1); }}
                      className="absolute right-2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer z-20"
                      title="الصورة السابقة"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                  
                  {imgGalleryIndex < allImages.length - 1 && zoomScale === 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex + 1); }}
                      className="absolute left-2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer z-20"
                      title="الصورة التالية"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
               </div>
          </div>
        )}

      </div>
    </div>
  );
}
