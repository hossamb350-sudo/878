import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem } from "../types";
import { CategoryBadges } from "../components/CategoryBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, ArrowRight, Clock, User, ChevronRight, ChevronLeft, X, Eye, Plus, Minus, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FONT_SIZES = {
  sm: "text-[16px] sm:text-[17px] leading-[1.8] text-justify",
  md: "text-[18px] sm:text-[19px] leading-[1.85] text-justify",
  lg: "text-[20px] sm:text-[21px] leading-[1.9] text-justify",
};

export function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Customization states
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("sm");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [imgGalleryIndex, setImgGalleryIndex] = useState<number | null>(null);
  
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
      hDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d) + "هـ";
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

  return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-[800px] mx-auto w-full bg-surface-main min-h-screen font-sans"
      >
         <article className="p-4 sm:p-6 md:p-8 bg-surface-card sm:rounded-3xl shadow-soft border border-border-light sm:mt-4">
            
            {news.imageUrl && (
               <div className="mb-6 w-full bg-surface-main rounded-3xl overflow-hidden shadow-soft border border-border-light">
                  <img src={news.imageUrl} alt={news.title} className="w-full h-auto object-cover max-h-[500px]" />
               </div>
            )}
            
            {/* Minimal Article Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-2">
               <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-secondary font-bold hover:text-taiz-sky transition-all text-sm">
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة</span>
               </button>

               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                     <button 
                       onClick={() => setFontSize("sm")}
                       className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${fontSize === "sm" ? "bg-taiz-sky/10 text-taiz-sky" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}
                       title="تصغير الخط"
                     >
                       <Minus className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => setFontSize("md")}
                       className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all font-bold ${fontSize === "md" ? "bg-taiz-sky/10 text-taiz-sky" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}
                       title="الخط الافتراضي"
                     >
                       <span className="text-sm">A</span>
                     </button>
                     <button 
                       onClick={() => setFontSize("lg")}
                       className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${fontSize === "lg" ? "bg-taiz-sky/10 text-taiz-sky" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}
                       title="تكبير الخط"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="h-4 w-px bg-border-light"></div>

                  <div className="flex items-center gap-1">
                     <button onClick={toggleBookmark} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${savedArticles.includes(news.id) ? "text-taiz-sky bg-taiz-sky/10" : "text-text-muted hover:bg-surface-hover hover:text-text-primary"}`} title="حفظ الخبر">
                        <Bookmark className={`w-4 h-4 ${savedArticles.includes(news.id) ? "fill-current" : ""}`} />
                     </button>
                     <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-text-primary rounded-lg transition-all" title="مشاركة">
                        <Share2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Title */}
            <h1 className="font-black mb-1.5 text-text-primary tracking-tight leading-[1.3] text-lg sm:text-xl">
              {news.title}
            </h1>

            {/* Publishing Info Line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-[11px] sm:text-[12px] font-bold text-text-secondary">
               <CategoryBadges item={news} className="!justify-start" />
               <span className="text-border-subtle">•</span>
               
               <span className="flex items-center gap-1">
                 <Calendar className="w-3 h-3" />
                 <span>{mDate}</span>
               </span>
               
               <span className="text-border-subtle">•</span>
               <span>{hDate}</span>
               
               <span className="text-border-subtle">•</span>
               <span className="flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 <span>{mTime}</span>
               </span>

               {news.author && (
                 <>
                   <span className="text-border-subtle">•</span>
                   <span className="flex items-center gap-1 text-text-muted">
                     <User className="w-3 h-3"/> 
                     {news.author}
                   </span>
                 </>
               )}
               
               <span className="text-border-subtle">•</span>
               <span className="flex items-center gap-1 text-taiz-royal">
                 <Eye className="w-3 h-3"/> 
                 {(news.views || 0) + 1}
               </span>
            </div>
            {isModified && modInfo && (
              <div className="mb-3 -mt-2 text-[10px] font-bold text-text-muted opacity-80 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>آخر تحديث: {modInfo.mDate} - {modInfo.mTime}</span>
              </div>
            )}

            {/* Content */}
            <div className="mb-8">
              {news.shortDescription && (
                <div className="mb-6 p-5 sm:p-6 bg-surface-main rounded-2xl border-r-4 border-taiz-sky shadow-sm">
                  <p className={`text-taiz-navy font-[800] leading-[1.7] ${FONT_SIZES[fontSize]}`}>
                    {news.shortDescription}
                  </p>
                </div>
              )}

              <div 
                className={`prose prose-gray max-w-none text-taiz-navy font-medium space-y-6 ${FONT_SIZES[fontSize]}`}
                dangerouslySetInnerHTML={{ __html: news.content }} 
              />
            </div>
            
            {/* Live Coverage Section */}
            {news.liveUpdates && news.liveUpdates.length > 0 && (
              <div className="mb-12 bg-[#f8fafc] rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-8">
                   <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-taiz-sky opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-taiz-royal"></span>
                   </span>
                   <h2 className="text-2xl font-[900] text-taiz-navy">تغطية مباشرة وتحديثات</h2>
                 </div>
                 
                 <div className="space-y-8 relative before:absolute before:right-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                   {/* Sort descending (newest first) */}
                   {[...news.liveUpdates].sort((a,b) => {
                     const timeA = typeof a.time === 'number' ? a.time : (a.timestamp || 0);
                     const timeB = typeof b.time === 'number' ? b.time : (b.timestamp || 0);
                     return timeB - timeA;
                   }).map((update) => (
                     <div key={update.id} className="relative pr-10">
                       <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-white border-[4px] border-taiz-sky z-10 shadow-sm"></span>
                       
                       <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                         <span className="text-[12px] font-black tracking-wide text-taiz-sky mb-3 block">
                           {typeof update.time === 'number' || update.timestamp ? formatPublishInfo(typeof update.time === 'number' ? update.time : update.timestamp!).mTime : update.time}
                         </span>
                         <p className={`font-bold text-taiz-navy leading-relaxed ${FONT_SIZES[fontSize]}`}>
                           {update.text}
                         </p>
                         
                         {update.imageUrl && (
                           <div className="mt-4 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                             <a href={update.imageUrl} target="_blank" rel="noopener noreferrer">
                               <img src={update.imageUrl} alt={update.imageTitle || update.text} className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity" />
                             </a>
                             {update.imageTitle && <p className="p-3 text-sm font-bold text-taiz-soft text-center">{update.imageTitle}</p>}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

                    {/* Multiple Pictures Gallery Section */}
          {news.additionalImages && news.additionalImages.length > 0 && (
            <div className="mb-12 pt-8 border-t border-gray-100 dark:border-gray-800">
               <h3 className="font-extrabold text-2xl mb-6 text-[#111827] dark:text-white">معرض الصور</h3>
               {(() => {
                 const images = news.additionalImages;
                 const count = images.length;
                 const handleImageClick = (index: number) => {
                   setImgGalleryIndex(index);
                 };

                 if (count === 1) {
                   return (
                     <div className="w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 aspect-video relative group">
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
                     <div className="grid grid-cols-2 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 aspect-[16/10]">
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
                     <div className="grid grid-cols-3 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 aspect-[16/10]">
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
                     <div className="grid grid-cols-4 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 aspect-[16/10]">
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
                   <div className="grid grid-cols-4 gap-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 aspect-[16/10]">
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
                             <span className="text-white text-lg md:text-2xl font-black font-sans tracking-wide">
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
                   <span className="text-white/60 font-medium text-sm drop-shadow-md">
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

          <div className="border-t border-gray-100 pt-8 pb-12">
            <h3 className="font-black text-2xl mb-6 relative inline-block before:absolute before:-bottom-2 before:right-0 before:w-12 before:h-1 before:bg-taiz-sky text-taiz-navy">
               مواضيع ذات صلة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(rItem => (
                <Link key={rItem.id} to={`/news/${rItem.id}`} className="group block">
                   {rItem.imageUrl ? (
                     <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-50 mb-3 shadow-sm border border-gray-50">
                        <img src={rItem.imageUrl} alt={rItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                   ) : (
                     <div className="aspect-[4/3] w-full rounded-xl bg-gray-50 mb-3 flex items-center justify-center border border-gray-50">
                        <Bookmark className="w-8 h-8 text-gray-200" />
                     </div>
                   )}
                   <h4 className="font-bold text-[15px] text-taiz-navy group-hover:text-taiz-royal transition-colors line-clamp-2 leading-snug">
                     {rItem.title}
                   </h4>
                </Link>
              ))}
            </div>
          </div>
       </article>

    </motion.div>
  );
}
