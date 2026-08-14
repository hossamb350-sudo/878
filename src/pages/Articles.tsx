import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Article } from "../types";
import { motion } from "motion/react";
import { Search, Star, Bookmark, ChevronLeft, CalendarDays, Newspaper, BookOpen, X, LayoutGrid, List } from "lucide-react";
import { CategoryBadges } from "../components/CategoryBadges";

// Dynamic title font size helper based on title character length
function getDynamicArticleTitleStyle(title: string = "", mode: "grid" | "list" = "grid") {
  const len = title.trim().length;

  if (mode === "grid") {
    if (len <= 20) {
      return "text-[16px] sm:text-[18px] leading-[1.35] font-black line-clamp-2";
    } else if (len <= 35) {
      return "text-[14px] sm:text-[15.5px] leading-[1.35] font-bold line-clamp-3";
    } else if (len <= 55) {
      return "text-[12.5px] sm:text-[13.5px] leading-[1.35] font-bold line-clamp-3";
    } else if (len <= 75) {
      return "text-[11px] sm:text-[12px] leading-[1.35] font-medium line-clamp-3";
    } else {
      return "text-[10px] sm:text-[11px] leading-[1.3] font-medium line-clamp-3";
    }
  } else {
    if (len <= 20) {
      return "text-[14.5px] sm:text-[16px] leading-[1.35] font-black line-clamp-2";
    } else if (len <= 35) {
      return "text-[13px] sm:text-[14.5px] leading-[1.35] font-bold line-clamp-2";
    } else if (len <= 55) {
      return "text-[12px] sm:text-[13px] leading-[1.35] font-bold line-clamp-2";
    } else if (len <= 75) {
      return "text-[11px] sm:text-[12px] leading-[1.35] font-medium line-clamp-3";
    } else {
      return "text-[10px] sm:text-[11px] leading-[1.3] font-medium line-clamp-3";
    }
  }
}

// Custom Featured Articles Slider matching NewsSlider design, spacing and font hierarchy
function FeaturedArticlesSlider({ featuredList }: { featuredList: Article[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (currentIndex >= featuredList.length) {
      setCurrentIndex(0);
    }
  }, [featuredList.length, currentIndex]);

  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  if (featuredList.length === 0) return null;

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredList.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const currentArticle = featuredList[currentIndex];

  return (
    <div className="w-full relative select-none">
      <div className="relative w-full h-[320px] sm:h-[350px] rounded-[18px] sm:rounded-[22px] overflow-hidden border border-black/5 dark:border-white/10 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="w-full h-full relative overflow-hidden">
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
            <Link to={`/articles/${currentArticle.id}`} className="block w-full h-full relative group">
              {currentArticle.imageUrl ? (
                <img 
                  src={currentArticle.imageUrl} 
                  alt={currentArticle.title} 
                  className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-[#141B26] flex items-center justify-center pointer-events-none">
                  <img 
                    src={currentArticle.authorPhoto || "https://i.pravatar.cc/150"} 
                    className="w-full h-full object-cover opacity-80" 
                    alt={currentArticle.authorName} 
                  />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/85 via-taiz-royal/40 to-transparent pointer-events-none"></div>
              
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-[#D32027] text-white text-[11px] sm:text-[12px] font-bold font-cairo px-3 py-1 rounded-lg shadow-md flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current animate-pulse text-amber-300" />
                  مقال مميز
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 pb-6 flex flex-col justify-end text-right z-10 pointer-events-none" dir="rtl">
                <h2 
                  className="font-bold text-[16px] sm:text-[19px] md:text-[22px] text-white leading-[1.4] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo text-right w-full mb-2"
                  style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
                >
                  {currentArticle.title}
                </h2>
                
                <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1 mt-2 text-white/90 text-[11px] sm:text-[12px] font-medium w-full" dir="rtl">
                  {currentArticle.authorName && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <img src={currentArticle.authorPhoto || "https://i.pravatar.cc/150"} className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/30" alt="" />
                      <span className="font-cairo font-bold">{currentArticle.authorName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-white/90" />
                    <span className="font-cairo">{currentArticle.hijriDate || "ذو الحجة 1446 هـ"}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {featuredList.length > 1 && (
          <div className="flex justify-center items-center absolute bottom-2 left-0 right-0 z-20 gap-1.5">
            {featuredList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? "w-5 h-1.5 bg-taiz-sky shadow-xs"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`انتقال إلى الشريحة ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    const saved = localStorage.getItem("favorite_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const ids = parsed.map((item: any) => (typeof item === "string" ? item : item.id));
        setSavedArticleIds(ids);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleBookmark = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();

    const saved = localStorage.getItem("favorite_items");
    let favs: any[] = saved ? JSON.parse(saved) : [];
    const isFav = favs.some((item: any) => item.id === article.id);

    if (isFav) {
      favs = favs.filter((item: any) => item.id !== article.id);
      setSavedArticleIds((prev) => prev.filter((fid) => fid !== article.id));
    } else {
      favs.push({
        id: article.id,
        type: "article",
        title: article.title,
        imageUrl: article.imageUrl || article.authorPhoto,
        savedAt: Date.now(),
      });
      setSavedArticleIds((prev) => [...prev, article.id]);
    }

    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  useEffect(() => {
    const q = query(
      collection(db, "articles"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Article[];
      setArticles(data);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore articles snapshot error/offline:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-taiz-sky mb-3"></div>
        <p className="font-bold text-slate-600 dark:text-slate-300 font-cairo text-xs">جاري تحميل المقالات...</p>
      </div>
    );
  }

  // Raw list combining loaded articles or fallback mockup data
  const rawList = articles.length > 0 ? articles : [
    {
      id: "dummy-1",
      title: "تعز بين التحديات والفرص نحو مستقبل أفضل",
      category: "سياسي",
      imageUrl: "https://images.unsplash.com/photo-1604044991191-dd41a9bc49fa?w=800&q=80",
      authorName: "أ. جميل المقرمي",
      authorPhoto: "https://i.pravatar.cc/150?u=jameel",
      hijriDate: "2 ذو الحجة 1446 هـ",
      gregorianDate: "21 يونيو 2025 م",
      isFeatured: true
    },
    {
      id: "dummy-2",
      title: "هوية تعز التاريخية بين الأصالة والتحديات",
      category: "اجتماعي",
      imageUrl: "https://images.unsplash.com/photo-1542152778-5743c7b60e6b?w=400&q=80",
      authorName: "أ. فؤاد الحكيمي",
      authorPhoto: "https://i.pravatar.cc/150?u=fouad",
      hijriDate: "20 ذو الحجة 1446 هـ",
      gregorianDate: "16 يونيو 2025 م"
    },
    {
      id: "dummy-3",
      title: "الاقتصاد المحلي في تعز.. الواقع والمأمول",
      category: "اقتصادي",
      imageUrl: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&q=80",
      authorName: "د. عبد الكريم الشيباني",
      authorPhoto: "https://i.pravatar.cc/150?u=karim",
      hijriDate: "19 ذو الحجة 1446 هـ",
      gregorianDate: "15 يونيو 2025 م"
    },
    {
      id: "dummy-4",
      title: "دور الثقافة في بناء الوعي المجتمعي",
      category: "ثقافي",
      imageUrl: "https://images.unsplash.com/photo-1590481230485-613d5ee1cbfa?w=400&q=80",
      authorName: "أ. هدى السامعي",
      authorPhoto: "https://i.pravatar.cc/150?u=hoda",
      hijriDate: "18 ذو الحجة 1446 هـ",
      gregorianDate: "14 يونيو 2025 م"
    },
    {
      id: "dummy-5",
      title: "قراءة في المشهد السياسي اليمني",
      category: "تحليلات",
      imageUrl: "https://images.unsplash.com/photo-1541280910158-c4e14f9c94a3?w=400&q=80",
      authorName: "أ. محمد القدسي",
      authorPhoto: "https://i.pravatar.cc/150?u=mohammed",
      hijriDate: "17 ذو الحجة 1446 هـ",
      gregorianDate: "13 يونيو 2025 م"
    }
  ] as Article[];

  // Filter list by searchQuery
  const filteredArticles = rawList.filter((a) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(query) ||
      a.category?.toLowerCase().includes(query) ||
      a.authorName?.toLowerCase().includes(query)
    );
  });

  const featuredArticles = filteredArticles.filter((a) => a.isFeatured === true);
  const displayLatest = filteredArticles;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-8" dir="rtl">
      <div className="max-w-[760px] mx-auto w-full">
        {/* LATEST ARTICLES TOP NAVIGATION HEADER */}
        {/* Innovative Creative Dual Segmented Navigation Switcher */}
        <div className="pt-1.5 pb-2 px-2 sm:px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="max-w-[760px] mx-auto w-full flex items-center justify-between gap-2 px-1">
            {/* Right side: Live Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-1 rounded-xl shadow-2xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 font-cairo tracking-tight whitespace-nowrap">
                  تحليلات ورؤى فكرية
                </span>
              </div>
            </div>

            {/* Left side: Premium Segmented Switcher Pills */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-700/80 flex items-center gap-1 shadow-inner select-none">
              {/* News Tab (Inactive) */}
              <Link
                to="/"
                title="قسم الأخبار والتقارير"
                className="relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold font-cairo transition-all duration-300 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-taiz-sky transition-colors" />
                  <span className="whitespace-nowrap">الأخبار والتقارير</span>
                </span>
              </Link>

              {/* Articles Tab (Active) */}
              <Link
                to="/articles"
                title="قسم المقالات والآراء"
                className="relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black font-cairo transition-all duration-300 active:scale-95 text-white"
              >
                <motion.div
                  layoutId="news-articles-tab-pill"
                  className="absolute inset-0 bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal rounded-lg sm:rounded-xl shadow-xs border border-taiz-sky/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <span className="relative z-10 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span className="whitespace-nowrap">مقالات وآراء</span>
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* SEARCH INPUT BAR (Matching News/Quran Search style) */}
        <div className="py-2 px-3 sm:px-4 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 z-40">
          <div className="relative max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="ابحث في المقالات والتحليلات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 focus:border-taiz-sky focus:bg-white dark:focus:bg-slate-800 outline-none py-2 pr-9 pl-8 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-cairo transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* HERO FEATURED ARTICLES SLIDER */}
        {featuredArticles.length > 0 && (
          <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-1 mb-2 px-2 sm:px-3 pt-2">
            <FeaturedArticlesSlider featuredList={featuredArticles} />
          </div>
        )}

        {/* VISUAL SEPARATOR FOR ARTICLES (Matching News Section Visual Separator) */}
        <div className="flex items-center gap-2 px-3 sm:px-4 my-2.5 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">أحدث المقالات</h3>
            <p className="text-[10px] sm:text-[11px] text-orange-500 font-medium font-cairo">تحليلات ورؤى فكرية وسياسية متميزة</p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2 mr-4"></div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 text-taiz-sky shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
              title="عرض القائمة"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 text-taiz-sky shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
              title="عرض الشبكة"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ARTICLES LIST / GRID (Matching News Cards Design) */}
        {displayLatest.length > 0 ? (
          viewMode === "list" ? (
            <div className="flex flex-col">
              {displayLatest.map((article, idx) => {
                const coverSource = article.imageUrl || article.authorPhoto || "https://i.pravatar.cc/150";

                return (
                  <motion.div 
                    key={article.id} 
                    className="relative" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.3, delay: idx * 0.04, ease: "easeOut" }}
                  >
                    <Link
                      to={`/articles/${article.id}`} 
                      className="flex items-center bg-white dark:bg-slate-900 rounded-[14px] border border-slate-200/80 dark:border-slate-800 shadow-soft mx-2 sm:mx-3 mb-2 overflow-hidden group relative hover:shadow-medium hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ease-out h-[105px] sm:h-[120px] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky touch-manipulation"
                      style={{ direction: 'rtl', transform: 'translateZ(0)' }}
                    >
                      {/* Right Side Compact Image */}
                      <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <img src={coverSource} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10 pointer-events-none">
                          <CategoryBadges item={article} isSecondary={true} />
                        </div>
                      </div>

                      {/* Left Side Article Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-2 px-3 text-right h-full">
                        <div className="flex-1 flex flex-col justify-center min-h-0 my-auto">
                          <h3 
                            className={`text-slate-900 dark:text-white transition-colors group-hover:text-taiz-sky whitespace-normal font-cairo ${getDynamicArticleTitleStyle(article.title, "list")}`} 
                            style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
                          >
                            {article.title}
                          </h3>
                        </div>

                        {/* Consistently aligned metadata line */}
                        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img src={article.authorPhoto || "https://i.pravatar.cc/150"} className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-200/80 dark:border-slate-700" alt="" />
                            <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[80px] sm:max-w-[120px] font-cairo">{article.authorName}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="shrink-0 text-slate-400 dark:text-slate-500 font-cairo">{article.hijriDate || "ذو الحجة 1446 هـ"}</span>
                          </div>

                          <button 
                            onClick={(e) => toggleBookmark(e, article)}
                            title={savedArticleIds.includes(article.id) ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                            className={`p-1 rounded-md transition-all shrink-0 active:scale-90 ${
                              savedArticleIds.includes(article.id)
                                ? "text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/40"
                                : "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(article.id) ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 px-2 sm:px-3">
              {displayLatest.map((article, idx) => (
                <motion.div key={article.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Link 
                    to={`/articles/${article.id}`} 
                    className="block group bg-white dark:bg-slate-900 rounded-[14px] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-300 h-[260px] flex flex-col justify-between"
                  >
                    <div className="relative w-full h-[115px] shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img src={article.imageUrl || article.authorPhoto || "https://i.pravatar.cc/150"} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 z-10">
                        <button 
                          onClick={(e) => toggleBookmark(e, article)}
                          className={`p-1 rounded-md backdrop-blur-md transition-all active:scale-90 ${
                            savedArticleIds.includes(article.id) ? "bg-red-600 text-white" : "bg-black/40 text-white hover:bg-black/60"
                          }`}
                        >
                          <Bookmark className={`w-3 h-3 ${savedArticleIds.includes(article.id) ? "fill-current" : ""}`} />
                        </button>
                      </div>
                      <div className="absolute bottom-1 right-1 z-10 pointer-events-none">
                        <CategoryBadges item={article} isSecondary={true} />
                      </div>
                    </div>
                    
                    <div className="p-2.5 flex flex-col justify-between flex-1 text-right min-h-0">
                      <div className="flex-1 flex flex-col justify-center min-h-0 my-auto py-1">
                        <h4 
                          className={`text-slate-900 dark:text-white transition-colors group-hover:text-taiz-sky font-cairo ${getDynamicArticleTitleStyle(article.title, "grid")}`}
                          style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
                        >
                          {article.title}
                        </h4>
                      </div>
                      
                      <div className="shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-cairo">
                        <div className="flex items-center gap-1.5 truncate">
                          <img src={article.authorPhoto || "https://i.pravatar.cc/150"} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" alt="" />
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{article.authorName}</span>
                        </div>
                        <span className="text-[9px] text-slate-400">{article.hijriDate || "ذو الحجة 1446 هـ"}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-slate-400 font-cairo text-sm">لا توجد مقالات تطابق هذا البحث</div>
        )}
      </div>
    </div>
  );
}



