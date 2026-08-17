import React, { useEffect, useState, useRef } from "react";
import { updateMetadata } from "../../utils/metadata";
import { extractIdFromSlug, generateSlug, routes } from "../../utils/routes";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Article } from "../../types";
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
  ChevronLeft,
  Clock,
  Newspaper
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getShareableUrl } from "../../config/apiConfig";
import { CategoryBadges } from "../../components/CategoryBadges";

export function ArticleDetail() {
  const { slug } = useParams();
  const id = extractIdFromSlug(slug || "");
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgGalleryIndex, setImgGalleryIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
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
  const allImages = article ? [
    ...(article.imageUrl ? [article.imageUrl] : []),
    ...(article.additionalImages || [])
  ].filter(Boolean) as string[] : [];

  // Live Author Sync: Keep author photo and name up to date if authorId matches
  useEffect(() => {
    if (!article?.authorId) return;
    const unsub = onSnapshot(doc(db, "authors", article.authorId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setArticle(prev => prev ? {
          ...prev,
          authorName: data.name || prev.authorName,
          authorPhoto: data.photoURL || prev.authorPhoto
        } : null);
      }
    });
    
  useEffect(() => {
    if (article) {
      updateMetadata({
        title: article.title,
        description: "",
        imageUrl: article.imageUrl || "" || "",
        type: "article",
        path: window.location.pathname
      });
    }
  }, [article]);

  return () => unsub();
  }, [article?.authorId]);

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
    const url = getShareableUrl(`/${"article"}/${generateSlug(article?.title || "", article?.id || id)}`);
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-taiz-sky mb-4"></div>
        <p className="font-medium text-text-secondary font-ibm text-sm">جاري تحميل المقال...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white text-text-primary flex flex-col items-center justify-center p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-4 font-ibm">المقال غير موجود</h2>
        <button onClick={() => navigate("/articles")} className="bg-gradient-to-r from-taiz-sky to-taiz-royal text-white px-6 py-2.5 rounded-xl font-bold font-ibm shadow-md hover:scale-[1.02] transition-all">العودة للمقالات</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-text-primary pb-32 font-sans" dir="rtl">
      {/* Top Nav with matching light background */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-soft px-4 h-16 flex items-center justify-between text-text-primary">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-text-primary">
          <ArrowRight className="w-6 h-6 text-taiz-sky" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleBookmark}
            title={isBookmarked ? "إزالة من المفضلة" : "حفظ في المفضلة"}
            className={`p-2 rounded-xl transition-all ${isBookmarked ? "text-taiz-sky bg-taiz-sky/10" : "hover:bg-slate-200/50 text-text-primary"}`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => handleShare("copy")} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors relative text-text-primary">
            {copied ? <Check className="w-6 h-6 text-emerald-600" /> : <Share2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Article Title Section Above the Slider */}
      <div className="max-w-[760px] mx-auto w-full px-4 pt-5 sm:pt-8 pb-3 sm:pb-5 text-right border-b border-slate-100/40 dark:border-stone-800/20" dir="rtl">
        <h1 className="font-extrabold text-[20px] sm:text-[24px] md:text-[26px] text-slate-900 dark:text-white leading-[1.45] font-cairo">
          {article.title}
        </h1>
      </div>

      {/* Render Image Gallery Slider ONLY if article has images */}
      {allImages.length > 0 && (
        <div className="max-w-[760px] mx-auto w-full px-0 pt-4 sm:pt-6 pb-2">
          {/* Featured Article Card Header - Integrated Slider with horizontal controls */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full h-[320px] sm:h-[400px] md:h-[450px] overflow-hidden bg-slate-900 mb-3 select-none group rounded-2xl shadow-md border border-slate-200/20 dark:border-slate-800/80"
          >
            {/* Horizontal Swiping Container */}
            <div 
              className="absolute inset-0 w-full h-full cursor-zoom-in"
              onClick={() => openGallery(currentSlide)}
              title="انقر لتكبير وعرض الصورة"
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentSlide}
                  src={allImages[currentSlide]} 
                  alt={article.title} 
                  className="w-full h-full object-cover absolute inset-0" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </AnimatePresence>
            </div>

            {/* Current Slide Counter Index Badge */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold font-sans tracking-wide z-20 flex items-center gap-1" dir="ltr">
              <span>{currentSlide + 1}</span>
              <span className="text-white/40">/</span>
              <span>{allImages.length}</span>
            </div>

            {/* Views badge */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-full text-xs font-bold font-sans tracking-wide z-20 flex items-center gap-1.5 shadow-md border border-white/10" dir="ltr">
              <Eye className="w-3.5 h-3.5 stroke-[2] text-white/80" />
              <span>{article.views || 0}</span>
            </div>

            {/* Left/Right manual slide buttons */}
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
              <CategoryBadges item={article as any} isHero={true} className="drop-shadow-lg" />
            </div>
          </motion.div>

          {/* Dynamic Image Thumbnails underneath Slider */}
          {allImages.length > 1 && (
            <div className="px-4 sm:px-5 mb-4 flex items-center justify-center w-full">
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
      )}

      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-5 mt-4">
        {/* Article Metadata Card - Re-designed, Elegant, Structured */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-cairo text-right" dir="rtl">
          {/* Author info with author avatar, prefix badge & name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              {article.authorPhoto ? (
                <img 
                  src={article.authorPhoto} 
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-taiz-sky/30 shadow-xs" 
                  alt={article.authorName} 
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 ring-2 ring-taiz-sky/20 shadow-xs shrink-0">
                  <User className="w-5 h-5 stroke-[2]" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block w-fit mb-0.5">
                بقلم الكاتب
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {article.authorName || "كاتب المنصة"}
              </p>
            </div>
          </div>

          <div className="h-px sm:h-8 w-full sm:w-px bg-slate-200 dark:bg-slate-800" />

          {/* Dates & Views Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300 font-bold">
            <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <Calendar className="w-3.5 h-3.5 text-taiz-sky stroke-[2]" />
              <span>{article.hijriDate || "15 صفر 1448 هـ"}</span>
            </div>

            {article.gregorianDate && (
              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-taiz-sky stroke-[2]" />
                <span>{article.gregorianDate}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-slate-500">
              <Eye className="w-3.5 h-3.5 text-emerald-500 stroke-[2]" />
              <span>{article.views || 0} مشاهدة</span>
            </div>
          </div>
        </div>
        {/* Floating Interaction Bar (شريط التفاعل) matching screenshot */}
        <div className="my-6 bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 rounded-full px-6 py-2.5 shadow-sm flex items-center justify-between max-w-xl mx-auto backdrop-blur-sm">
          {/* Social Share Icons */}
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <button onClick={() => handleShare("facebook")} className="hover:text-blue-600 transition-colors p-1" title="فيسبوك">
              <Facebook className="w-5 h-5" />
            </button>
            <button onClick={() => handleShare("twitter")} className="hover:text-sky-500 transition-colors p-1" title="إكس">
              <Twitter className="w-5 h-5" />
            </button>
            <button onClick={() => handleShare("whatsapp")} className="hover:text-emerald-500 transition-colors p-1" title="واتساب">
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Separator Line */}
          <div className="h-5 w-px bg-slate-300 dark:bg-zinc-600 mx-2" />

          {/* Font Size Adjuster */}
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-bold text-sm font-ibm">
            <button onClick={() => setFontSize(f => Math.max(f - 1, 12))} className="p-1 hover:bg-slate-200/60 dark:hover:bg-zinc-700 rounded-full transition-colors" title="تصغير الخط">
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono text-sm tracking-tight text-slate-800 dark:text-slate-100 min-w-[36px] text-center font-bold">
              {fontSize}px
            </span>
            <button onClick={() => setFontSize(f => Math.min(f + 1, 28))} className="p-1 hover:bg-slate-200/60 dark:hover:bg-zinc-700 rounded-full transition-colors" title="تكبير الخط">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body content styled to match NewsDetail exactly */}
        <div 
          className="prose prose-slate max-w-none text-slate-800 dark:text-slate-100 text-justify leading-[2.0] mb-10 font-cairo [&_p]:mb-5"
          style={{ fontSize: `${fontSize}px` }}
        >
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-border-light pt-8 mt-8">
             <h3 className="text-lg font-bold font-alexandria mb-4 flex items-center gap-2 text-text-primary">
                <div className="w-1 h-5 bg-taiz-sky rounded-full"></div>
                مقالات ذات صلة
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {relatedArticles.map(a => (
                  <Link key={a.id} to={routes.article(generateSlug(a.title || "", a.id))} className="group block bg-white rounded-none p-3 border border-border-light hover:border-taiz-sky/30 hover:bg-slate-50 transition-all shadow-soft">
                     <div className="aspect-video rounded-none overflow-hidden mb-3">
                        <img src={a.imageUrl || a.authorPhoto} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <h4 className="font-bold font-alexandria text-xs sm:text-sm text-text-primary line-clamp-2 leading-snug text-right">{a.title}</h4>
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
