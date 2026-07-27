import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Article } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  User, 
  Calendar, 
  Share2, 
  Bookmark, 
  Eye, 
  Type, 
  Plus, 
  Minus,
  Check,
  Twitter,
  Facebook,
  MessageCircle,
  Copy,
  Star,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getShareableUrl } from "../config/apiConfig";

export function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgGalleryIndex, setImgGalleryIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Combine primary image and additional images into unified array
  const allImages = article ? [
    ...(article.imageUrl ? [article.imageUrl] : []),
    ...(article.additionalImages || [])
  ].filter(Boolean) as string[] : [];

  // Auto slide interval for the article hero card
  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [allImages.length]);

  const openGallery = (index: number) => {
    setImgGalleryIndex(index);
    window.history.pushState({ galleryOpen: true }, "");
  };

  const closeGallery = () => {
    setImgGalleryIndex(null);
    if (window.history.state?.galleryOpen) {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (imgGalleryIndex !== null) {
        setImgGalleryIndex(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [imgGalleryIndex]);

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
  
  // Starting with the default font size matching news detail page
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("article_font_size");
    return saved ? parseInt(saved, 10) : 16;
  });

  useEffect(() => {
    localStorage.setItem("article_font_size", fontSize.toString());
  }, [fontSize]);

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("favorite_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const ids = parsed.map((item: any) => (typeof item === "string" ? item : item.id));
        setSavedArticleIds(ids);
        if (id) {
          setIsBookmarked(ids.includes(id));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [id]);

  const toggleBookmark = () => {
    if (!article) return;

    const saved = localStorage.getItem("favorite_items");
    let favs: any[] = saved ? JSON.parse(saved) : [];
    const isFav = favs.some((item: any) => item.id === article.id);

    if (isFav) {
      favs = favs.filter((item: any) => item.id !== article.id);
      setSavedArticleIds((prev) => prev.filter((fid) => fid !== article.id));
      setIsBookmarked(false);
    } else {
      favs.push({
        id: article.id,
        type: "article",
        title: article.title,
        imageUrl: article.imageUrl || article.authorPhoto,
        savedAt: Date.now(),
      });
      setSavedArticleIds((prev) => [...prev, article.id]);
      setIsBookmarked(true);
    }

    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Article;
          setArticle(data);
          
          // Increment views
          updateDoc(docRef, { views: increment(1) });

          // Fetch related
          const q = query(
            collection(db, "articles"),
            where("category", "==", data.category),
            limit(4)
          );
          const relatedSnap = await getDocs(q);
          const related = relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Article))
            .filter(a => a.id !== id);
          setRelatedArticles(related);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = async (platform: string) => {
    const url = getShareableUrl(`/articles/${id || article?.id}`);
    const text = article?.title || "";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-main flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#D32027] mb-4"></div>
        <p className="font-medium text-text-secondary font-ibm text-sm">جاري تحميل المقال...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-surface-main text-text-primary flex flex-col items-center justify-center p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-4 font-ibm">المقال غير موجود</h2>
        <button onClick={() => navigate("/articles")} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold font-ibm shadow-md hover:bg-red-700 transition-all">العودة للمقالات</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-main text-text-primary pb-32 font-sans" dir="rtl">
      {/* Top Nav with matching light background */}
      <div className="sticky top-0 z-40 bg-surface-main/90 backdrop-blur-md border-b border-border-light px-4 h-16 flex items-center justify-between text-text-primary">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-text-primary">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleBookmark}
            title={isBookmarked ? "إزالة من المفضلة" : "حفظ في المفضلة"}
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
        {/* Featured Article Card Header - Integrated Animated Slider */}
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
                  alt={article.title} 
                  className="w-full h-full object-cover absolute inset-0" 
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <img 
                  src={article.authorPhoto || "https://i.pravatar.cc/150"} 
                  className="w-full h-full object-cover opacity-80" 
                  alt={article.authorName} 
                />
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

          {/* Fixed Badge on Top Left */}
          <div className="absolute top-[16px] left-0 z-10 pointer-events-none">
            <span className="bg-[#D32027] text-white text-[13px] font-bold font-ibm px-4 h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5 shadow-lg">
              <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
              مقال مميز
            </span>
          </div>

          {/* Fixed Article Card Footer Details Over the Image */}
          <div className="absolute bottom-0 left-0 right-0 p-[20px] pb-[16px] flex flex-col justify-end text-right z-10 pointer-events-none">
            <h2 className="text-[18px] font-bold font-ibm leading-[28px] w-full text-white mb-[12px]">
              {article.title}
            </h2>
            
            <div className="flex items-center justify-between w-full h-[46px]">
              <div className="flex items-center gap-[8px]">
                <img 
                  src={article.authorPhoto || "https://i.pravatar.cc/150"} 
                  className="w-[44px] h-[44px] rounded-full object-cover shrink-0 border border-white/20" 
                  alt={article.authorName} 
                />
                <span className="text-[14px] font-medium font-ibm text-white">{article.authorName}</span>
              </div>
              <div className="flex flex-col text-[12px] text-slate-300 font-normal font-ibm text-left">
                <span>{article.hijriDate || "ذو الحجة 1446 هـ"}</span>
                {article.gregorianDate && (
                  <span className="text-[10px] text-slate-400 mt-[2px]">{article.gregorianDate}</span>
                )}
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

        {/* Body content styled to match NewsDetail exactly */}
        <div 
          className="prose prose-slate max-w-none text-text-primary text-justify font-ibm [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-[1.8] [&_p]:text-justify mb-12 px-[4px]"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.8,
          }}
        >
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-border-light pt-8 mt-8">
             <h3 className="text-lg font-bold font-ibm mb-6 flex items-center gap-2 text-text-primary">
                <div className="w-[4px] h-[18px] bg-[#D32027] rounded-[2px]"></div>
                مقالات ذات صلة
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {relatedArticles.map(a => (
                  <Link key={a.id} to={`/articles/${a.id}`} className="group block bg-white rounded-none p-3 border border-border-light hover:bg-slate-50 transition-all shadow-soft">
                     <div className="aspect-video rounded-none overflow-hidden mb-3">
                        <img src={a.imageUrl || a.authorPhoto} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <h4 className="font-bold font-ibm text-xs text-text-primary line-clamp-2 leading-relaxed text-right">{a.title}</h4>
                  </Link>
                ))}
             </div>
          </div>
        )}

        {/* Full Screen Image Gallery Modal */}
        {imgGalleryIndex !== null && allImages.length > 0 && (
          <div 
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
      </div>
    </div>
  );
}
