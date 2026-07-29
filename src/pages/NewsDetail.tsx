import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem } from "../types";
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
  X,
  ChevronRight,
  ChevronLeft,
  Newspaper
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getShareableUrl } from "../config/apiConfig";

export function NewsDetail() {
  const { id } = useParams();
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
  const [imgGalleryIndex, setImgGalleryIndex] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Combine primary image and additional images into unified array
  const allImages = news ? [
    ...(news.imageUrl ? [news.imageUrl] : []),
    ...(news.additionalImages || [])
  ].filter(Boolean) as string[] : [];

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
          setRelated(rItems.slice(0, 3));
          
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
    const url = getShareableUrl(`/news/${id || news?.id}`);
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
    }
    window.open(shareUrl, "_blank");
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
      <div className="min-h-screen bg-surface-main flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#D32027] mb-4"></div>
        <p className="font-medium text-text-secondary font-ibm text-sm">جاري تحميل الخبر...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-surface-main text-text-primary flex flex-col items-center justify-center p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-4 font-ibm">الخبر غير موجود</h2>
        <button onClick={() => navigate("/")} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold font-ibm shadow-md hover:bg-red-700 transition-all">العودة للرئيسية</button>
      </div>
    );
  }

  const { mDate, mTime, hDate } = formatPublishInfo(news.createdAt);
  const isModified = news.updatedAt && news.updatedAt > news.createdAt + 60000;
  const modInfo = isModified ? formatPublishInfo(news.updatedAt!) : null;

  return (
    <div className="min-h-screen bg-surface-main text-text-primary pb-32 font-sans relative" dir="rtl">
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div 
          className="h-full bg-[#D32027] transition-all duration-75 shadow-sm" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Nav with matching light background */}
      <div className="sticky top-0 z-40 bg-surface-main/90 backdrop-blur-md border-b border-border-light px-4 h-16 flex items-center justify-between text-text-primary">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-text-primary">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleBookmark}
            className={`p-2 rounded-xl transition-all ${isBookmarked ? "text-[#D32027] bg-[#D32027]/10" : "hover:bg-slate-200/50 text-text-primary"}`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => handleShare("copy")} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors relative text-text-primary">
            {copied ? <Check className="w-6 h-6 text-red-600" /> : <Share2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* News Card Header - Integrated Animated Slider with Fixed News Elements */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-[376px] sm:h-[420px] rounded-[24px] overflow-hidden border border-border-light shadow-medium mb-6 select-none group"
        >
          {/* Sliding Background Images Layer */}
          <div 
            className="absolute inset-0 w-full h-full cursor-zoom-in"
            onClick={() => openGallery(currentSlide)}
            title="انقر لتكبير الصورة"
          >
            {allImages.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <motion.img 
                  key={currentSlide}
                  src={allImages[currentSlide]} 
                  alt={news.title} 
                  className="w-full h-full object-cover absolute inset-0" 
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <Newspaper className="w-12 h-12 text-slate-300" />
              </div>
            )}
          </div>
          
          {/* Fixed Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.88)] via-[rgba(0,0,0,0.42)] to-transparent pointer-events-none"></div>

          {/* Left/Right manual slide buttons on hover */}
          {allImages.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between items-center z-20 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="p-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto cursor-pointer"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev + 1) % allImages.length);
                }}
                className="p-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto cursor-pointer"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Fixed Category / Live Badge at Top Left */}
          <div className="absolute top-[16px] left-0 z-10 pointer-events-none">
            {news.isBreaking ? (
              <span className="bg-[#D32027] text-white text-[13px] font-bold font-ibm px-3 h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                تغطية مباشرة
              </span>
            ) : news.isPinned ? (
              <span className="bg-red-600 text-white text-[13px] font-bold font-ibm w-[100px] h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                خبر عاجل
              </span>
            ) : (
              <span className="bg-red-600 text-white text-[13px] font-bold font-ibm px-4 h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5 shadow-lg">
                {news.category || "أخبار"}
              </span>
            )}
          </div>

          {/* Fixed News Card Footer Details Over the Slider */}
          <div className="absolute bottom-0 left-0 right-0 p-[20px] pb-[16px] flex flex-col justify-end text-right z-10 pointer-events-none">
            {/* Overlaid Title */}
            <h1 
              className="font-bold text-white leading-normal drop-shadow mb-3 tracking-normal max-w-full font-cairo text-[18px]"
              style={{ fontSize: `${fontSize > 18 ? 18 + (fontSize - 18) * 0.5 : fontSize}px` }}
            >
              {news.title}
            </h1>
            
            <div className="flex items-center justify-between w-full h-[46px] mt-2">
              <div className="flex items-center gap-[8px]">
                <div className="w-[40px] h-[40px] rounded-full bg-white/10 flex items-center justify-center border border-white/15 text-white font-bold text-sm select-none shrink-0 font-ibm">
                  <User className="w-4 h-4 text-white/85" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[13px] font-bold font-ibm text-white leading-tight">{news.author || "رئيس التحرير"}</span>
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5" style={{ direction: "ltr" }}>
                    <span>{news.views || 0} مشاهدة</span>
                    <Eye className="w-3 h-3 text-red-500" />
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-[12px] text-slate-300 font-normal font-ibm text-left shrink-0">
                <span>{hDate}</span>
                <span className="text-[10px] text-slate-400 mt-[2px]">{mDate} • {mTime}</span>
              </div>
            </div>

            {/* Slider Dots indicators */}
            {allImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2.5 pointer-events-auto">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? "w-6 bg-red-600" : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Content Controls */}
        <div className="sticky top-20 z-40 mb-6 flex justify-center">
           <div className="bg-white/95 border border-border-light rounded-2xl px-4 py-2 flex items-center gap-6 shadow-medium backdrop-blur-sm text-text-primary">
              <div className="flex items-center gap-2">
                 <button onClick={() => setFontSize(f => Math.min(f + 1, 30))} className="p-1.5 hover:bg-slate-100 rounded-lg text-text-primary"><Plus className="w-4 h-4" /></button>
                 <span className="text-sm font-bold min-w-[36px] text-center font-ibm text-text-primary">{fontSize}px</span>
                 <button onClick={() => setFontSize(f => Math.max(f - 1, 12))} className="p-1.5 hover:bg-slate-100 rounded-lg text-text-primary"><Minus className="w-4 h-4" /></button>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="flex items-center gap-4">
                 <button onClick={() => handleShare("whatsapp")} className="text-slate-400 hover:text-green-500 transition-colors"><MessageCircle className="w-5 h-5" /></button>
                 <button onClick={() => handleShare("twitter")} className="text-slate-400 hover:text-sky-400 transition-colors"><Twitter className="w-5 h-5" /></button>
                 <button onClick={() => handleShare("facebook")} className="text-slate-400 hover:text-blue-500 transition-colors"><Facebook className="w-5 h-5" /></button>
              </div>
           </div>
        </div>

        {/* Body content styled to match ArticleDetail exactly */}
        <div 
          className="prose prose-slate max-w-none text-text-primary text-justify font-ibm [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-[1.8] [&_p]:text-justify mb-12 px-[4px]"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.8,
          }}
        >
          <ReactMarkdown>{news.content}</ReactMarkdown>
        </div>

        {/* Modified text (last update) */}
        {isModified && modInfo && (
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-8 font-ibm" style={{ direction: "rtl" }}>
            <Clock className="w-3 h-3" />
            <span>آخر تحديث: {modInfo.mDate} - {modInfo.mTime}</span>
          </div>
        )}

        {/* Live Coverage Section */}
        {news.liveUpdates && news.liveUpdates.length > 0 && (
          <div className="mb-12 bg-white rounded-[2rem] p-6 border border-border-light shadow-soft font-ibm text-text-primary" style={{ direction: "rtl" }}>
             <div className="flex items-center gap-3 mb-6">
               <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
               </span>
               <h2 className="text-lg font-bold text-text-primary font-ibm">تغطية مباشرة وتحديثات</h2>
             </div>
             
             <div className="space-y-6 relative before:absolute before:right-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
               {[...news.liveUpdates].sort((a,b) => {
                 const timeA = typeof a.time === 'number' ? a.time : (a.timestamp || 0);
                 const timeB = typeof b.time === 'number' ? b.time : (b.timestamp || 0);
                 return timeB - timeA;
               }).map((update) => (
                 <div key={update.id} className="relative pr-8">
                   <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-white border-[4px] border-[#D32027] z-10 shadow-sm"></span>
                   
                   <div className="bg-slate-50/85 rounded-[1.5rem] p-4 border border-border-subtle shadow-sm">
                     <span className="text-[11px] font-bold tracking-wide text-[#D32027] mb-2 block font-ibm">
                       {typeof update.time === 'number' || update.timestamp ? formatPublishInfo(typeof update.time === 'number' ? update.time : update.timestamp!).mTime : update.time}
                     </span>
                     <p className="font-medium text-text-primary leading-relaxed text-justify font-ibm" style={{ fontSize: `${fontSize}px` }}>
                       {update.text}
                     </p>
                     
                     {update.imageUrl && (
                       <div className="mt-4 rounded-xl overflow-hidden border border-border-light bg-slate-50">
                         <a href={update.imageUrl} target="_blank" rel="noopener noreferrer">
                           <img src={update.imageUrl} alt={update.imageTitle || update.text} className="w-full h-auto max-h-[300px] object-cover hover:opacity-90 transition-opacity" />
                         </a>
                         {update.imageTitle && <p className="p-3 text-xs font-bold text-slate-500 text-center font-ibm">{update.imageTitle}</p>}
                       </div>
                     )}
                   </div>
                 </div>
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
                  <span className="text-white/70 font-bold text-sm drop-shadow-md font-ibm">
                    {imgGalleryIndex + 1} / {allImages.length}
                  </span>
                  <button onClick={closeGallery} className="text-white bg-black/50 hover:bg-white/20 p-2 rounded-full transition-colors drop-shadow-md cursor-pointer">
                    <X className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="relative flex items-center justify-center w-full max-w-4xl h-[70vh] sm:h-[80vh]" onClick={(e) => e.stopPropagation()}>
                  <AnimatePresence mode="popLayout">
                    <motion.img 
                      key={imgGalleryIndex}
                      src={allImages[imgGalleryIndex]} 
                      alt={`Gallery image ${imgGalleryIndex + 1}`} 
                      className="max-w-full max-h-full object-contain select-none cursor-grab active:cursor-grabbing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.6}
                      onDragEnd={(event, info) => {
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
                  
                  {imgGalleryIndex > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex - 1); }}
                      className="absolute right-2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer z-20"
                      title="الصورة السابقة"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                  
                  {imgGalleryIndex < allImages.length - 1 && (
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

        {/* Related News with List Items */}
        {related.length > 0 && (
          <div className="border-t border-border-light pt-8 mt-8">
             <h3 className="text-lg font-bold font-ibm mb-6 flex items-center gap-2 text-text-primary">
                <div className="w-[4px] h-[18px] bg-[#D32027] rounded-[2px]"></div>
                أخبار ذات صلة
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {related.map(rItem => (
                  <Link key={rItem.id} to={`/news/${rItem.id}`} className="group block bg-white rounded-none p-3 border border-border-light hover:bg-slate-50 transition-all shadow-soft">
                     <div className="aspect-video rounded-none overflow-hidden mb-3">
                        <img src={rItem.imageUrl || "https://i.pravatar.cc/150"} alt={rItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <h4 className="font-bold font-ibm text-xs text-text-primary line-clamp-2 leading-relaxed text-right">{rItem.title}</h4>
                  </Link>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
