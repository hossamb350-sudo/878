import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { NewsItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, ArrowRight, Clock, User, ChevronRight, ChevronLeft, X, Eye } from "lucide-react";
import { motion } from "motion/react";

const FONT_SIZES = {
  sm: "text-base sm:text-lg",
  md: "text-lg sm:text-xl",
  lg: "text-xl sm:text-2xl",
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
    const saved = localStorage.getItem("saved_news");
    if (saved) {
      try {
        setSavedArticles(JSON.parse(saved));
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
        const d = await getDoc(doc(db, "news", id));
        if (d.exists()) {
          const newsData = { id: d.id, ...d.data() } as NewsItem;
          setNews(newsData);
          
          // Increment views
          try {
            const { updateDoc, increment } = await import("firebase/firestore");
            await updateDoc(doc(db, "news", id), {
              views: increment(1)
            });
          } catch(e) {
            console.warn("Could not increment views", e);
          }
          
          // Fetch related
          let catQuery = query(collection(db, "news"), where("category", "==", newsData.category), limit(4));
          let relatedDocs = await getDocs(catQuery);
          let rItems = relatedDocs.docs.map(rd => ({ id: rd.id, ...rd.data() } as NewsItem)).filter(i => i.id !== id);
          if (rItems.length < 3) {
            // fallback to any latest if not enough related
            let fallbackQ = query(collection(db, "news"), limit(4));
            let fbDocs = await getDocs(fallbackQ);
            rItems = fbDocs.docs.map(rd => ({ id: rd.id, ...rd.data() } as NewsItem)).filter(i => i.id !== id);
          }
          setRelated(rItems.slice(0, 3));
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
    let updated = [...savedArticles];
    if (updated.includes(news.id)) {
      updated = updated.filter(item => item !== news.id);
    } else {
      updated.push(news.id);
    }
    setSavedArticles(updated);
    localStorage.setItem("saved_news", JSON.stringify(updated));
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
         <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
         <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
         <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
         <div className="h-64 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
         <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
         </div>
       </div>
     );
  }

  if (!news) return <div className="p-8 text-center text-gray-500 font-bold">لم يتم العثور على الخبر</div>;

  const { mDate, mTime, hDate } = formatPublishInfo(news.createdAt);
  const isModified = news.updatedAt && news.updatedAt > news.createdAt + 60000;
  const modInfo = isModified ? formatPublishInfo(news.updatedAt!) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-[800px] mx-auto w-full bg-white dark:bg-gray-950 min-h-screen font-sans"
    >
       <article className="p-4 sm:p-6 md:p-8">
          
          {news.imageUrl && (
             <div className="mb-6 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                <img src={news.imageUrl} alt={news.title} className="w-full h-auto object-cover max-h-[500px]" />
             </div>
          )}
          
          {/* New Minimal Article Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800/50">
             <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-bold hover:text-black dark:hover:text-white px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <ArrowRight className="w-5 h-5" />
                <span>العودة</span>
             </button>

             <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm font-bold">
                   <button 
                     onClick={() => setFontSize("sm")}
                     className={`px-3 py-1.5 rounded-lg transition-colors ${fontSize === "sm" ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
                   >
                     أ-
                   </button>
                   <button 
                     onClick={() => setFontSize("md")}
                     className={`px-3 py-1.5 rounded-lg transition-colors ${fontSize === "md" ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
                   >
                     أ
                   </button>
                   <button 
                     onClick={() => setFontSize("lg")}
                     className={`px-3 py-1.5 rounded-lg transition-colors text-lg leading-none pt-2 ${fontSize === "lg" ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
                   >
                     أ+
                   </button>
                </div>
                
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

                <div className="flex items-center gap-1">
                   <button onClick={toggleBookmark} className={`p-2.5 rounded-xl transition-colors ${savedArticles.includes(news.id) ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"}`}>
                      <Bookmark className={`w-5 h-5 ${savedArticles.includes(news.id) ? "fill-current" : ""}`} />
                   </button>
                   <button onClick={handleShare} className="p-2.5 text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-xl transition-colors">
                      <Share2 className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>

          {/* Title */}
          <h1 className={`font-extrabold mb-4 text-[#111827] dark:text-[#f3f4f6] tracking-tight leading-[1.3] ${fontSize === 'lg' ? 'text-4xl sm:text-5xl' : fontSize === 'md' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
            {news.title}
          </h1>

          {/* Publishing Info Line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-8 text-[12px] sm:text-[13px] font-bold text-gray-400 dark:text-gray-500">
             <span className="text-amber-600 dark:text-amber-400">{news.category}</span>
             <span className="text-gray-300 dark:text-gray-700">|</span>
             <span>{mDate}</span>
             <span className="text-gray-300 dark:text-gray-700">|</span>
             <span>{hDate}</span>
             <span className="text-gray-300 dark:text-gray-700">|</span>
             <span>{mTime}</span>
             {news.author && (
               <>
                 <span className="text-gray-300 dark:text-gray-700">|</span>
                 <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><User className="w-3.5 h-3.5"/> {news.author}</span>
               </>
             )}
             <span className="text-gray-300 dark:text-gray-700">|</span>
             <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Eye className="w-3.5 h-3.5"/> {(news.views || 0) + 1}</span>
          </div>
          {isModified && modInfo && (
            <div className="mb-8 -mt-5 text-[11px] font-medium text-gray-400 opacity-80 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>آخر تحديث: {modInfo.mDate} - {modInfo.mTime}</span>
            </div>
          )}

          {/* Content */}
          <div className="mb-12">
            {news.shortDescription && (
              <p className={`text-gray-500 dark:text-gray-400 font-bold leading-relaxed mb-8 border-r-4 border-gray-300 dark:border-gray-700 pr-4 ${FONT_SIZES[fontSize]}`}>
                {news.shortDescription}
              </p>
            )}

            <div 
              className={`prose dark:prose-invert prose-gray max-w-none text-[#111827] dark:text-[#f3f4f6] leading-[2.1] font-medium ${FONT_SIZES[fontSize]}`}
              dangerouslySetInnerHTML={{ __html: news.content }} 
            />
          </div>
          
          {/* Live Coverage Section */}
          {news.liveUpdates && news.liveUpdates.length > 0 && (
            <div className="mb-12 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-4 sm:p-6 border border-gray-150 dark:border-gray-800">
               <div className="flex items-center gap-2 mb-8">
                 <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                 </span>
                 <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">تغطية مباشرة وتحديثات</h2>
               </div>
               
               <div className="space-y-8 relative before:absolute before:right-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 dark:before:bg-gray-800">
                 {/* Sort descending (newest first) */}
                 {[...news.liveUpdates].sort((a,b) => {
                   const timeA = typeof a.time === 'number' ? a.time : (a.timestamp || 0);
                   const timeB = typeof b.time === 'number' ? b.time : (b.timestamp || 0);
                   return timeB - timeA;
                 }).map((update) => (
                   <div key={update.id} className="relative pr-10">
                     <span className="absolute right-2 top-2 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 border-[4px] border-red-600 dark:border-red-500 z-10 shadow-sm"></span>
                     
                     <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                       <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 mb-2 block">
                         {typeof update.time === 'number' || update.timestamp ? formatPublishInfo(typeof update.time === 'number' ? update.time : update.timestamp!).mTime : update.time}
                       </span>
                       <p className={`font-bold text-[#111827] dark:text-gray-200 leading-relaxed ${FONT_SIZES[fontSize]}`}>
                         {update.text}
                       </p>
                       
                       {update.imageUrl && (
                         <div className="mt-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                           <a href={update.imageUrl} target="_blank" rel="noopener noreferrer">
                             <img src={update.imageUrl} alt={update.imageTitle || update.text} className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity" />
                           </a>
                           {update.imageTitle && <p className="p-3 text-sm font-semibold text-gray-500 text-center">{update.imageTitle}</p>}
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
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                 {news.additionalImages.map((img, idx) => (
                   <button key={idx} onClick={() => setImgGalleryIndex(idx)} className="block w-full h-full group rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 aspect-[4/3] bg-gray-100 dark:bg-gray-900 cursor-zoom-in">
                     <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 text-transparent" loading="lazy" />
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* Full Screen Image Gallery Modal */}
          {imgGalleryIndex !== null && news.additionalImages && (
            <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[210]">
                  <span className="text-white/60 font-medium text-sm drop-shadow-md">
                    {imgGalleryIndex + 1} / {news.additionalImages.length}
                  </span>
                  <button onClick={() => setImgGalleryIndex(null)} className="text-white bg-black/50 hover:bg-white/20 p-2 rounded-full transition-colors drop-shadow-md">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="relative flex items-center justify-center w-full max-w-6xl max-h-[85vh]">
                   <img 
                     src={news.additionalImages[imgGalleryIndex]} 
                     alt={`Gallery image ${imgGalleryIndex + 1}`} 
                     className="max-w-full max-h-[85vh] object-contain select-none"
                   />
                   
                   {imgGalleryIndex > 0 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex - 1); }}
                       className="absolute right-2 sm:right-6 lg:-right-12 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
                       title="الصورة السابقة"
                     >
                       <ChevronRight className="w-8 h-8" />
                     </button>
                   )}
                   
                   {imgGalleryIndex < news.additionalImages.length - 1 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setImgGalleryIndex(imgGalleryIndex + 1); }}
                       className="absolute left-2 sm:left-6 lg:-left-12 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
                       title="الصورة التالية"
                     >
                       <ChevronLeft className="w-8 h-8" />
                     </button>
                   )}
                </div>
            </div>
          )}
          
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 pb-12">
            <h3 className="font-extrabold text-2xl mb-6 relative inline-block before:absolute before:-bottom-2 before:right-0 before:w-12 before:h-1 before:bg-[#d49a37] dark:before:bg-amber-400 text-[#111827] dark:text-white">
               مواضيع ذات صلة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(rItem => (
                <Link key={rItem.id} to={`/news/${rItem.id}`} className="group block">
                   {rItem.imageUrl ? (
                     <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 mb-3 shadow-sm border border-gray-100 dark:border-gray-800">
                        <img src={rItem.imageUrl} alt={rItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                   ) : (
                     <div className="aspect-[4/3] w-full rounded-xl bg-gray-50 dark:bg-gray-900 mb-3 flex items-center justify-center border border-gray-100 dark:border-gray-800">
                        <Bookmark className="w-8 h-8 text-gray-300" />
                     </div>
                   )}
                   <h4 className="font-bold text-[15px] text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
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
