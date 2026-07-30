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
  Printer,
  ChevronRight,
  ChevronLeft
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
  const [fontSize, setFontSize] = useState(18);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Combine primary image and additional images into unified array
  const allImages = news ? [
    ...(news.imageUrl ? [news.imageUrl] : []),
    ...(news.additionalImages || [])
  ].filter(Boolean) as string[] : [];

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
    const url = getShareableUrl(`/news/${id || news?.id}`);
    const text = news?.title || "";

    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (platform === "print") {
      window.print();
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-red-600 mb-4"></div>
        <p className="font-bold text-text-secondary font-alexandria text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-surface-main text-text-primary flex flex-col items-center justify-center p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-4 font-alexandria">الخبر غير موجود</h2>
        <button onClick={() => navigate("/")} className="btn-primary">العودة للرئيسية</button>
      </div>
    );
  }

  const { mDate, mTime, hDate } = formatPublishInfo(news.createdAt);
  const isModified = news.updatedAt && news.updatedAt > news.createdAt + 60000;
  const modInfo = isModified ? formatPublishInfo(news.updatedAt!) : null;

  return (
    <div className="min-h-screen bg-surface-main text-text-primary pb-20 font-sans relative" dir="rtl">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div 
          className="h-full bg-red-600 transition-all duration-75" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border-light px-4 h-14 flex items-center justify-between text-text-primary">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-text-primary flex items-center gap-1 font-bold text-xs font-alexandria"
        >
          <ArrowRight className="w-5 h-5 text-red-600" />
          <span>رجوع</span>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={toggleBookmark}
            className={`p-2 rounded-full transition-colors ${isBookmarked ? "text-red-600 bg-red-600/10" : "hover:bg-slate-100 text-text-primary"}`}
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

      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-6 pt-6">
        {/* Category & Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-red-600/10 text-red-600 font-bold text-xs font-alexandria px-3 py-1 rounded-full border border-red-500/20">
            {news.category || "أخبار عامة"}
          </span>

          {news.isBreaking && (
            <span className="bg-red-600 text-white font-extrabold text-xs font-alexandria px-3 py-1 rounded-full animate-pulse shadow-sm">
              خبر عاجل
            </span>
          )}

          {news.isPinned && (
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs font-alexandria px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              خبر هام
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-alexandria leading-snug text-text-primary mb-4">
          {news.title}
        </h1>

        {/* Short Description */}
        {news.shortDescription && (
          <p className="text-base sm:text-lg text-text-secondary font-ibm leading-relaxed mb-6 font-medium">
            {news.shortDescription}
          </p>
        )}

        {/* Author & Date Metadata */}
        <div className="py-4 border-y border-border-light flex flex-wrap items-center justify-between gap-4 mb-6 text-xs font-ibm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-text-primary text-sm">{news.author || "المحرر السيادي"}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5" style={{ direction: "ltr" }}>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{news.views || 0} مشاهدة</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className="font-bold text-text-primary">{hDate}</span>
            <span className="text-[11px] text-slate-400">{mDate} - الساعة {mTime}</span>
          </div>
        </div>

        {/* Image Display / Gallery Carousel */}
        {allImages.length > 0 && (
          <div className="mb-8">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border-light bg-slate-900 shadow-md">
              <img 
                src={allImages[currentSlide]} 
                alt={news.title} 
                className="w-full h-full object-cover transition-all duration-500"
              />
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentSlide(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentSlide(prev => (prev + 1) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-ibm">
                    <span>{currentSlide + 1}</span>
                    <span>/</span>
                    <span>{allImages.length}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 bg-surface-card border border-border-light p-3 rounded-xl shadow-soft">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-ibm text-slate-500 pl-2 border-l border-slate-200">حجم الخط:</span>
            <button 
              onClick={() => setFontSize(f => Math.min(f + 2, 26))} 
              className="p-1.5 hover:bg-slate-100 rounded-lg font-bold text-xs font-ibm border border-slate-200"
              title="تكبير الخط"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setFontSize(f => Math.max(f - 2, 14))} 
              className="p-1.5 hover:bg-slate-100 rounded-lg font-bold text-xs font-ibm border border-slate-200"
              title="تصغير الخط"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleShare("whatsapp")} className="p-2 text-slate-500 hover:text-emerald-600 transition-colors" title="واتساب">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button onClick={() => handleShare("twitter")} className="p-2 text-slate-500 hover:text-sky-500 transition-colors" title="إكس">
              <Twitter className="w-5 h-5" />
            </button>
            <button onClick={() => handleShare("facebook")} className="p-2 text-slate-500 hover:text-blue-600 transition-colors" title="فيسبوك">
              <Facebook className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Markdown Body */}
        <div 
          className="prose prose-slate max-w-none text-text-primary text-justify leading-relaxed mb-10"
          style={{ fontSize: `${fontSize}px`, fontFamily: '"IBM Plex Sans Arabic", Cairo, sans-serif' }}
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
                <div className="w-1 h-5 bg-red-600 rounded-full"></div>
                أخبار ذات صلة
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(rItem => (
                  <Link 
                    key={rItem.id} 
                    to={`/news/${rItem.id}`} 
                    className="group flex gap-3 bg-surface-card rounded-xl p-3 border border-border-light hover:border-red-500/30 transition-all shadow-soft"
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

      </div>
    </div>
  );
}
