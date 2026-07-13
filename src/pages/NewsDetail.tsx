import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem } from "../types";
import { CategoryBadges } from "../components/CategoryBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, ArrowRight, Clock, User, ChevronRight, ChevronLeft, X, Eye, Plus, Minus, Calendar, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Customization states
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("news_font_size");
    return saved ? parseInt(saved, 10) : 18;
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [imgGalleryIndex, setImgGalleryIndex] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Save font size preference
    localStorage.setItem("news_font_size", fontSize.toString());
  }, [fontSize]);

  const toggleDarkMode = () => {
    const current = document.documentElement.classList.contains("dark");
    if (current) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

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
    // Load saved bookmarks status
    const saved = localStorage.getItem("favorite_items");
    if (saved) {
      try {
        setSavedArticles(JSON.parse(saved).map((item: any) => typeof item === "string" ? item : item.id));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchNews = async () => {
      setLoading(true);
      window.scrollTo(0, 0); // Scroll to top on navigation
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

        // Suggestions from cachedNews
        if (foundNews) {
          let rItems = cachedNews.filter(n => n.category === foundNews!.category && n.id !== id);
          if (rItems.length < 3) {
            rItems = cachedNews.filter(n => n.id !== id);
          }
          setRelated(rItems.slice(0, 3));
          
          // Increment views in background
          try {
            const { updateDoc, increment } = await import("firebase/firestore");
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imgGalleryIndex === null || !news?.additionalImages) return;
      
      if (e.key === "Escape") {
        setImgGalleryIndex(null);
      } else if (e.key === "ArrowLeft") {
        if (imgGalleryIndex < news.additionalImages.length - 1) {
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
  }, [imgGalleryIndex, news]);

  const toggleBookmark = () => {
    if (!news) return;
    
    // Get existing favorites
    const saved = localStorage.getItem("favorite_items");
    let favs: any[] = saved ? JSON.parse(saved) : [];
    
    // Check if already favorited
    const isFav = favs.some((item: any) => item.id === news.id);
    
    if (isFav) {
      favs = favs.filter((item: any) => item.id !== news.id);
      setSavedArticles(savedArticles.filter(id => id !== news.id));
    } else {
      favs.push({
        id: news.id,
        type: "news",
        title: news.title,
        imageUrl: news.imageUrl,
        savedAt: Date.now()
      });
      setSavedArticles([...savedArticles, news.id]);
    }
    
    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  const handleShare = async () => {
    if (!news) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.shortDescription,
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ الرابط!");
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
        <div className="max-w-3xl mx-auto p-4 pt-10 space-y-6 animate-pulse">
          <div className="h-4 bg-surface-card rounded-lg w-1/4"></div>
          <div className="h-10 bg-surface-card rounded-xl w-full"></div>
          <div className="h-10 bg-surface-card rounded-xl w-3/4"></div>
          <div className="h-64 sm:h-96 bg-surface-card rounded-3xl w-full shadow-soft"></div>
          <div className="space-y-4">
             <div className="h-4 bg-surface-card rounded-lg w-full"></div>
             <div className="h-4 bg-surface-card rounded-lg w-full"></div>
             <div className="h-4 bg-surface-card rounded-lg w-5/6"></div>
          </div>
        </div>
      );
   }

  if (!news) return <div className="p-8 text-center text-text-secondary font-bold">لم يتم العثور على الخبر</div>;

  const { mDate, mTime, hDate } = formatPublishInfo(news.createdAt);
  const isModified = news.updatedAt && news.updatedAt > news.createdAt + 60000;
  const modInfo = isModified ? formatPublishInfo(news.updatedAt!) : null;

  const toggleSpeech = () => {
    if (!news) return;
    if (!window.speechSynthesis) {
      alert("ميزه قراءة الأخبار غير مدعومة في متصفحك الحالي.");
      return;
    }

    if (isSpeechPlaying) {
      window.speechSynthesis.cancel();
      setIsSpeechPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      
      // Strip HTML tags safely for reading
      const contentText = news.content ? news.content.replace(/<[^>]*>/g, ' ') : '';
      const textToRead = `${news.title} . ${news.shortDescription || ''} . ${contentText}`;
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "ar-SA"; // Arabic Saudi Arabia
      
      // Try to find an Arabic voice if possible
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(voice => voice.lang.startsWith("ar"));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utterance.onend = () => {
        setIsSpeechPlaying(false);
      };
      utterance.onerror = () => {
        setIsSpeechPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeechPlaying(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-3xl mx-auto w-full bg-white dark:bg-stone-900 min-h-screen font-ibm transition-colors duration-300 relative"
    >
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100/10 dark:bg-stone-800/20 z-50">
        <div 
          className="h-full bg-taiz-sky transition-all duration-75 shadow-sm" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="w-full">
        {/* Edge-to-Edge Header (Image or Gradient Fallback) */}
        {news.imageUrl ? (
          <div className="w-full relative aspect-[4/3] sm:aspect-video md:aspect-[16/9] max-h-[500px] bg-stone-950 overflow-hidden">
            <img 
              src={news.imageUrl} 
              alt={news.title} 
              className="w-full h-full object-cover select-none" 
            />
            
            {/* Gradient Overlay for supreme text readability */}
            <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0 pointer-events-none" />
            
            {/* Floating Back Button (Right Side) */}
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-6 right-6 z-10 flex items-center justify-center bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-all cursor-pointer border border-white/10 shadow-lg"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>

            {/* Floating Share & Bookmark Buttons (Left Side) */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
              <button 
                onClick={handleShare} 
                className="flex items-center justify-center bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-all cursor-pointer border border-white/10 shadow-lg"
                title="مشاركة"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleBookmark} 
                className={`flex items-center justify-center rounded-full p-3 transition-all cursor-pointer border shadow-lg ${savedArticles.includes(news.id) ? "text-[#00e5ff] bg-black/70 border-[#00e5ff]/30" : "text-white bg-black/60 hover:bg-black/80 border-white/10"}`}
                title="حفظ الخبر"
              >
                <Bookmark className={`w-5 h-5 ${savedArticles.includes(news.id) ? "fill-[#00e5ff]" : ""}`} />
              </button>
            </div>

            {/* Title & Category overlaid beautifully inside the image */}
            <div className="absolute bottom-6 left-0 right-0 px-6 sm:px-8 z-10 flex flex-col items-start text-right pb-2" style={{ direction: "rtl" }}>
              {/* Category tag */}
              <span className="inline-block px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] sm:text-xs rounded mb-2 shadow-md select-none font-cairo">
                {news.category || "أخبار"}
              </span>
              
              {/* Overlaid Title */}
              <h1 
                className="font-bold text-white leading-normal drop-shadow mb-3 tracking-normal max-w-full font-cairo"
                style={{ fontSize: `${fontSize}px` }}
              >
                {news.title}
              </h1>
              
              {/* Under-title meta row */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-white/80 font-normal font-ibm">
                {news.author && (
                  <>
                    <span>{news.author}</span>
                    <span className="text-white/30">|</span>
                  </>
                )}
                <span>{mDate}</span>
                <span className="text-white/30">|</span>
                <span>{hDate}</span>
                <span className="text-white/30">|</span>
                <span>{mTime}</span>
                <span className="text-white/30">|</span>
                <span className="text-[#00e5ff] flex items-center gap-1 font-semibold animate-pulse">
                  <Eye className="w-3 h-3 text-[#00e5ff] fill-none shrink-0" />
                  <span>{(news.views || 0) + 1} مشاهدة</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Abstract visual gradient fallback when no image exists */
          <div className="w-full relative py-20 px-6 sm:px-8 bg-gradient-to-tr from-stone-950 via-slate-900 to-stone-900 overflow-hidden flex items-end min-h-[320px]">
            {/* Floating Back Button */}
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-6 right-6 z-10 flex items-center justify-center bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-all cursor-pointer border border-white/10 shadow-lg"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>

            {/* Floating Share & Bookmark Buttons */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
              <button 
                onClick={handleShare} 
                className="flex items-center justify-center bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-all cursor-pointer border border-white/10 shadow-lg"
                title="مشاركة"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleBookmark} 
                className={`flex items-center justify-center rounded-full p-3 transition-all cursor-pointer border shadow-lg ${savedArticles.includes(news.id) ? "text-[#00e5ff] bg-black/70 border-[#00e5ff]/30" : "text-white bg-black/60 hover:bg-black/80 border-white/10"}`}
                title="حفظ الخبر"
              >
                <Bookmark className={`w-5 h-5 ${savedArticles.includes(news.id) ? "fill-[#00e5ff]" : ""}`} />
              </button>
            </div>

            {/* Overlaid Title block */}
            <div className="z-10 w-full flex flex-col items-start text-right pb-2" style={{ direction: "rtl" }}>
              <span className="inline-block px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] sm:text-xs rounded mb-2 shadow-md select-none font-cairo">
                {news.category || "أخبار"}
              </span>
              
              <h1 
                className="font-bold text-white leading-normal drop-shadow mb-3 tracking-normal max-w-full font-cairo"
                style={{ fontSize: `${fontSize}px` }}
              >
                {news.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-white/80 font-normal font-ibm">
                {news.author && (
                  <>
                    <span>{news.author}</span>
                    <span className="text-white/30">|</span>
                  </>
                )}
                <span>{mDate}</span>
                <span className="text-white/30">|</span>
                <span>{hDate}</span>
                <span className="text-white/30">|</span>
                <span>{mTime}</span>
                <span className="text-white/30">|</span>
                <span className="text-[#00e5ff] flex items-center gap-1 font-semibold animate-pulse">
                  <Eye className="w-3 h-3 text-[#00e5ff] fill-none shrink-0" />
                  <span>{(news.views || 0) + 1} مشاهدة</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reading Options toolbar (right below the image) */}
        <div className="flex items-center justify-between py-4 px-6 sm:px-8 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800/80 transition-colors duration-300" style={{ direction: "rtl" }}>
          {/* Right side: Mode Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-stone-300 hover:opacity-80 transition cursor-pointer select-none font-ibm"
            >
              <span>{isDarkMode ? "ليلي" : "نهاري"}</span>
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500 fill-amber-500" />
              )}
            </button>
          </div>

          {/* Left side: Font scale controls */}
          <div className="flex items-center border border-gray-200 dark:border-stone-800 rounded-lg px-3 py-1 bg-white dark:bg-stone-900 shadow-sm text-sm font-bold text-gray-700 dark:text-stone-300 select-none font-ibm">
            <button 
              onClick={() => setFontSize(prev => Math.min(prev + 1, 26))} 
              className="p-1 text-gray-500 hover:text-gray-950 dark:hover:text-white transition cursor-pointer font-black text-lg"
              title="تكبير الخط"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
            </button>
            <span className="mx-4 text-sm font-bold min-w-[36px] text-center">
              {fontSize}px
            </span>
            <button 
              onClick={() => setFontSize(prev => Math.max(prev - 1, 14))} 
              className="p-1 text-gray-500 hover:text-gray-950 dark:hover:text-white transition cursor-pointer font-black text-lg"
              title="تصغير الخط"
            >
              <Minus className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Flat Text Content Area */}
        <div className="bg-white dark:bg-stone-900 transition-colors duration-300 pt-8 pb-16">
          <div className="px-6 sm:px-8">

            {/* Main content body */}
            <div className="mb-12" style={{ direction: "rtl" }}>
              <div 
                className="prose prose-stone dark:prose-invert max-w-none text-gray-800 dark:text-stone-100 text-justify font-ibm [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-relaxed"
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ 
                  __html: (() => {
                    if (!news.content) return "";
                    // Split content into paragraphs by double newlines to manage paragraph separation cleanly
                    const paragraphs = news.content.split(/\r?\n\s*\r?\n/);
                    return paragraphs
                      .map(p => p.trim())
                      .filter(p => p.length > 0)
                      .map(p => `<p class="whitespace-pre-line">${p}</p>`)
                      .join("");
                  })()
                }} 
              />
            </div>

            {/* Modified text (last update) */}
            {isModified && modInfo && (
              <div className="text-[10px] font-bold text-gray-400 dark:text-stone-500 flex items-center gap-1 mb-8 font-ibm" style={{ direction: "rtl" }}>
                <Clock className="w-3 h-3" />
                <span>آخر تحديث: {modInfo.mDate} - {modInfo.mTime}</span>
              </div>
            )}

            {/* Live Coverage Section */}
            {news.liveUpdates && news.liveUpdates.length > 0 && (
              <div className="mb-12 bg-gray-50 dark:bg-stone-800/30 rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-stone-800/40 shadow-sm font-ibm" style={{ direction: "rtl" }}>
                 <div className="flex items-center gap-3 mb-8">
                   <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-taiz-sky opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-taiz-royal"></span>
                   </span>
                   <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-ibm">تغطية مباشرة وتحديثات</h2>
                 </div>
                 
                 <div className="space-y-8 relative before:absolute before:right-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 dark:before:bg-stone-700">
                   {[...news.liveUpdates].sort((a,b) => {
                     const timeA = typeof a.time === 'number' ? a.time : (a.timestamp || 0);
                     const timeB = typeof b.time === 'number' ? b.time : (b.timestamp || 0);
                     return timeB - timeA;
                   }).map((update) => (
                     <div key={update.id} className="relative pr-10">
                       <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-white dark:bg-stone-900 border-[4px] border-taiz-sky z-10 shadow-sm"></span>
                       
                       <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-5 border border-gray-100 dark:border-stone-800/50 shadow-sm">
                         <span className="text-[12px] font-bold tracking-wide text-taiz-sky mb-3 block font-ibm">
                           {typeof update.time === 'number' || update.timestamp ? formatPublishInfo(typeof update.time === 'number' ? update.time : update.timestamp!).mTime : update.time}
                         </span>
                         <p className="font-medium text-gray-800 dark:text-stone-200 leading-relaxed text-justify font-ibm" style={{ fontSize: `${fontSize}px` }}>
                           {update.text}
                         </p>
                         
                         {update.imageUrl && (
                           <div className="mt-4 rounded-lg overflow-hidden border border-gray-100 dark:border-stone-800/60 bg-gray-50 dark:bg-stone-900">
                             <a href={update.imageUrl} target="_blank" rel="noopener noreferrer">
                               <img src={update.imageUrl} alt={update.imageTitle || update.text} className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity" />
                             </a>
                             {update.imageTitle && <p className="p-3 text-sm font-bold text-gray-500 dark:text-stone-400 text-center font-ibm">{update.imageTitle}</p>}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {/* Image Gallery Section */}
            {news.additionalImages && news.additionalImages.length > 0 && (
              <div className="mb-12 pt-8 border-t border-gray-100 dark:border-stone-800" style={{ direction: "rtl" }}>
                 <h3 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white font-ibm">معرض الصور</h3>
                 {(() => {
                   const images = news.additionalImages;
                   const count = images.length;
                   const handleImageClick = (index: number) => {
                     setImgGalleryIndex(index);
                   };

                   if (count === 1) {
                     return (
                       <div className="w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-100 dark:bg-stone-900 aspect-video relative group">
                         <button
                           onClick={() => handleImageClick(0)}
                           className="w-full h-full block cursor-zoom-in overflow-hidden"
                         >
                           <img
                             src={images[0]}
                             alt="صورة المعرض 1"
                             className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                             loading="lazy"
                           />
                         </button>
                       </div>
                     );
                   }

                   if (count === 2) {
                     return (
                       <div className="grid grid-cols-2 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-100 dark:bg-stone-900 aspect-[16/10]">
                         {images.slice(0, 2).map((img, idx) => (
                           <button
                             key={idx}
                             onClick={() => handleImageClick(idx)}
                             className="w-full h-full cursor-zoom-in overflow-hidden relative group"
                           >
                             <img
                               src={img}
                               alt={`صورة المعرض ${idx + 1}`}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                               loading="lazy"
                             />
                           </button>
                         ))}
                       </div>
                     );
                   }

                   if (count === 3) {
                     return (
                       <div className="grid grid-cols-3 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-100 dark:bg-stone-900 aspect-[16/10]">
                         <button
                           onClick={() => handleImageClick(0)}
                           className="col-span-2 w-full h-full cursor-zoom-in overflow-hidden relative group"
                         >
                           <img
                             src={images[0]}
                             alt="صورة المعرض رئيسية"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             loading="lazy"
                           />
                         </button>
                         <div className="col-span-1 grid grid-rows-2 gap-3 h-full">
                           {images.slice(1, 3).map((img, idx) => (
                             <button
                               key={idx + 1}
                               onClick={() => handleImageClick(idx + 1)}
                               className="w-full h-full cursor-zoom-in overflow-hidden relative group"
                             >
                               <img
                                 src={img}
                                 alt={`صورة المعرض ${idx + 2}`}
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                 loading="lazy"
                               />
                             </button>
                           ))}
                         </div>
                       </div>
                     );
                   }

                   if (count === 4) {
                     return (
                       <div className="grid grid-cols-4 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-100 dark:bg-stone-900 aspect-[16/10]">
                         <button
                           onClick={() => handleImageClick(0)}
                           className="col-span-2 w-full h-full cursor-zoom-in overflow-hidden relative group"
                         >
                           <img
                             src={images[0]}
                             alt="صورة المعرض رئيسية"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             loading="lazy"
                           />
                         </button>
                         <div className="col-span-2 grid grid-cols-1 grid-rows-3 gap-3 h-full">
                           {images.slice(1, 4).map((img, idx) => (
                             <button
                               key={idx + 1}
                               onClick={() => handleImageClick(idx + 1)}
                               className="w-full h-full cursor-zoom-in overflow-hidden relative group"
                             >
                               <img
                                 src={img}
                                 alt={`صورة المعرض ${idx + 2}`}
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                 loading="lazy"
                               />
                             </button>
                           ))}
                         </div>
                       </div>
                     );
                   }

                   return (
                     <div className="grid grid-cols-4 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-100 dark:bg-stone-900 aspect-[16/10]">
                       <button
                         onClick={() => handleImageClick(0)}
                         className="col-span-2 row-span-2 w-full h-full cursor-zoom-in overflow-hidden relative group"
                       >
                         <img
                           src={images[0]}
                           alt="صورة المعرض رئيسية"
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           loading="lazy"
                         />
                       </button>
                       <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-3 h-full">
                         {images.slice(1, 4).map((img, idx) => (
                           <button
                             key={idx + 1}
                             onClick={() => handleImageClick(idx + 1)}
                             className="w-full h-full cursor-zoom-in overflow-hidden relative group"
                           >
                             <img
                               src={img}
                               alt={`صورة المعرض ${idx + 2}`}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                               loading="lazy"
                             />
                           </button>
                         ))}
                         <button
                           onClick={() => handleImageClick(4)}
                           className="w-full h-full cursor-zoom-in overflow-hidden relative group bg-black"
                         >
                           <img
                             src={images[4]}
                             alt="صورة المعرض إضافية"
                             className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                             loading="lazy"
                           />
                           {count > 5 && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                               <span className="text-white text-lg md:text-2xl font-bold font-ibm tracking-wide">
                                 +{count - 4}
                               </span>
                             </div>
                           )}
                         </button>
                       </div>
                     </div>
                   );
                 })()}
              </div>
            )}

            {/* Full Screen Image Gallery Modal */}
            {imgGalleryIndex !== null && news.additionalImages && (
              <div 
                className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
                onClick={() => setImgGalleryIndex(null)}
              >
                   <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[210]" onClick={(e) => e.stopPropagation()}>
                     <span className="text-white/60 font-medium text-sm drop-shadow-md font-ibm">
                       {imgGalleryIndex + 1} / {news.additionalImages.length}
                     </span>
                     <button onClick={() => setImgGalleryIndex(null)} className="text-white bg-black/50 hover:bg-white/20 p-2 rounded-full transition-colors drop-shadow-md cursor-pointer">
                       <X className="w-6 h-6" />
                     </button>
                   </div>
                   
                   <div className="relative flex items-center justify-center w-full max-w-4xl h-[70vh] sm:h-[80vh]" onClick={(e) => e.stopPropagation()}>
                      <AnimatePresence mode="popLayout">
                        <motion.img 
                          key={imgGalleryIndex}
                          src={news.additionalImages[imgGalleryIndex]} 
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
                              if (imgGalleryIndex < news.additionalImages.length - 1) {
                                  setImgGalleryIndex(imgGalleryIndex + 1);
                              }
                            }
                          }}
                        />
                      </AnimatePresence>
                      
                      {imgGalleryIndex > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex - 1); }}
                          className="absolute right-2 sm:right-4 p-2.5 sm:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer z-20"
                          title="الصورة السابقة"
                        >
                          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                      )}
                      
                      {imgGalleryIndex < news.additionalImages.length - 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex + 1); }}
                          className="absolute left-2 sm:left-4 p-2.5 sm:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer z-20"
                          title="الصورة التالية"
                        >
                          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                      )}
                   </div>
              </div>
            )}

            {/* Related News with List Items */}
            <div className="border-t border-gray-100 dark:border-stone-850 mt-12 pt-8" style={{ direction: "rtl" }}>
              <h3 className="font-bold text-lg sm:text-xl mb-6 text-gray-900 dark:text-white relative inline-block pb-1 font-ibm">
                أخبار ذات صلة
                <span className="absolute bottom-0 right-0 left-0 h-1 bg-taiz-sky rounded-full"></span>
              </h3>
              
              <div className="divide-y divide-gray-100 dark:divide-stone-850">
                {related.map((rItem) => (
                  <Link 
                    key={rItem.id} 
                    to={`/news/${rItem.id}`} 
                    className="group flex gap-4 py-4 first:pt-0 last:pb-0 items-start hover:bg-gray-50/50 dark:hover:bg-stone-800/30 transition-colors rounded-xl px-2 -mx-2"
                  >
                    <div className="w-24 h-16 sm:w-32 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-stone-850 border border-gray-100 dark:border-stone-800/60">
                      {rItem.imageUrl ? (
                        <img 
                          src={rItem.imageUrl} 
                          alt={rItem.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Bookmark className="w-5 h-5 text-gray-300 dark:text-stone-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-taiz-sky transition-colors line-clamp-2 leading-snug font-ibm">
                        {rItem.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-gray-400 dark:text-stone-500 font-ibm">
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-400 rounded text-[10px] font-ibm">
                          {rItem.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-ibm">
                          <Eye className="w-3 h-3" />
                          <span>{rItem.views || 0}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

      </article>
    </motion.div>
  );
}
