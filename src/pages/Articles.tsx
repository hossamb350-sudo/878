import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Article } from "../types";
import { motion } from "motion/react";
import { Search, Star, Bookmark, ChevronLeft, CalendarDays, Newspaper, BookOpen } from "lucide-react";

// Helper function to scale font size dynamically based on length, preventing overflow beyond 4 lines without truncation
const getTitleStyle = (title: string) => {
  const len = title?.length || 0;
  if (len < 35) return { fontSize: "12px", lineHeight: "17px" };
  if (len < 65) return { fontSize: "11px", lineHeight: "15px" };
  if (len < 95) return { fontSize: "10px", lineHeight: "14px" };
  if (len < 130) return { fontSize: "9px", lineHeight: "13px" };
  return { fontSize: "8px", lineHeight: "11px" };
};

// Custom Featured Articles Slider with smooth autoplay and swipe navigation support using Framer Motion
function FeaturedArticlesSlider({ featuredList }: { featuredList: Article[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  // Reset index if list length changes and index is out of bounds
  useEffect(() => {
    if (currentIndex >= featuredList.length) {
      setCurrentIndex(0);
    }
  }, [featuredList.length, currentIndex]);

  // Autoplay functionality
  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 5000); // 5 seconds autoplay
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
      <div className="relative w-full h-[376px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-white/5 shadow-lg">
        {/* Slider viewport */}
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
            <Link to={`/articles/${currentArticle.id}`} className="block w-full h-full relative">
              {currentArticle.imageUrl ? (
                <img 
                  src={currentArticle.imageUrl} 
                  alt={currentArticle.title} 
                  className="w-full h-full object-cover pointer-events-none" 
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
              
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.85)] via-[rgba(0,0,0,0.4)] to-transparent"></div>
              
              <div className="absolute top-[16px] left-0 z-10">
                <span className="bg-[#D32027] text-white text-[13px] font-bold font-ibm w-[100px] h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                  مقال مميز
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-[20px] pb-[16px] flex flex-col justify-end text-right z-10">
                <h2 className="text-[18px] font-bold font-ibm leading-[28px] w-full text-white mb-[12px] line-clamp-2">
                  {currentArticle.title}
                </h2>
                
                <div className="flex items-center justify-between w-full h-[46px]">
                  <div className="flex items-center gap-[8px]">
                    <img 
                      src={currentArticle.authorPhoto || "https://i.pravatar.cc/150"} 
                      className="w-[44px] h-[44px] rounded-full object-cover shrink-0" 
                      alt={currentArticle.authorName} 
                    />
                    <span className="text-[14px] font-medium font-ibm text-white">{currentArticle.authorName}</span>
                  </div>
                  <div className="flex flex-col text-[12px] text-[#A8A8A8] font-normal font-ibm text-left">
                    <span>{currentArticle.hijriDate || "ذو الحجة 1446 هـ"}</span>
                    {currentArticle.gregorianDate && (
                      <span className="text-[10px] text-[#8F98A7] mt-[2px]">{currentArticle.gregorianDate}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Pagination indicators under the slider */}
      {featuredList.length > 1 && (
        <div className="flex justify-center items-center gap-[8px] mt-[16px] mb-[8px]">
          {featuredList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`transition-all duration-300 ${
                idx === currentIndex 
                  ? "w-[26px] h-[8px] bg-[#D32027] rounded-[4px]" 
                  : "w-[8px] h-[8px] bg-slate-300 rounded-[4px] hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-main flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#D32027] mb-4"></div>
        <p className="font-medium text-text-secondary font-ibm text-sm">جاري تحميل المقالات...</p>
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

  // Helper to ensure Gregorian date exists
  const getGregorianDate = (article: Article) => {
    if (article.gregorianDate) return article.gregorianDate;
    if (article.hijriDate === "20 ذو الحجة 1446 هـ") return "16 يونيو 2025 م";
    if (article.hijriDate === "19 ذو الحجة 1446 هـ") return "15 يونيو 2025 م";
    if (article.hijriDate === "18 ذو الحجة 1446 هـ") return "14 يونيو 2025 م";
    if (article.hijriDate === "17 ذو الحجة 1446 هـ") return "13 يونيو 2025 م";
    return "2025 م";
  };

  return (
    <div className="min-h-screen bg-surface-main text-text-primary pb-[24px]" dir="rtl">
      <div className="max-w-[760px] mx-auto w-full">
        {/* Innovative Top Navigation Experience */}
        <div className="pt-4 pb-3 px-4 bg-surface-main/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100/85 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <div className="max-w-[700px] mx-auto w-full flex items-center justify-between">
            {/* Right side: Active Indicator & Title with Cairo Font */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="font-black text-base text-slate-800 font-cairo tracking-tight">مقالات وآراء</span>
            </div>

            {/* Left side: Dedicated Direct Navigation Shortcut back to News with Hover Micro-animations */}
            <Link 
              to="/" 
              title="الانتقال السريع إلى أحدث الأخبار والتقارير"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-full border border-slate-800/10 shadow-[0_4px_12px_rgba(15,23,42,0.15)] transition-all duration-300 hover:scale-105 active:scale-95 group font-cairo text-xs font-black"
            >
              <Newspaper className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform duration-300" />
              <span>أحدث الأخبار والتقارير</span>
              <ChevronLeft className="w-4 h-4 text-white/70 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="px-4 sm:px-6 lg:px-8 pt-[12px] pb-[8px]">
          <div className="relative flex items-center bg-white rounded-full px-4 py-2.5 w-full focus-within:ring-1 focus-within:ring-[#D32027] border border-border-subtle transition-all shadow-soft">
            <Search className="w-5 h-5 text-text-muted shrink-0 ml-2" />
            <input 
              type="text" 
              placeholder="بحث في المقالات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-text-primary text-[14px] w-full placeholder-text-muted font-ibm"
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pt-[10px]">
          {/* Featured Articles Carousel / Slider */}
          {featuredArticles.length > 0 && (
            <div className="mb-6">
              <FeaturedArticlesSlider featuredList={featuredArticles} />
            </div>
          )}

          {/* Section Title */}
          <div className="flex items-center justify-between h-[42px] mt-[16px] mb-[16px]">
            <h3 className="text-[20px] font-bold font-ibm flex items-center gap-[8px] text-text-primary">
              <div className="w-[4px] h-[20px] bg-[#D32027] rounded-[2px]"></div>
              أحدث المقالات
            </h3>
            <Link to="/articles" className="text-[#D32027] text-[14px] font-medium font-ibm flex items-center gap-1 hover:gap-2 transition-all">
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Articles Grid */}
          {displayLatest.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-[12px] gap-y-[14px] ">
              {displayLatest.map((article, idx) => {
                const coverSource = article.imageUrl || article.authorPhoto || "https://i.pravatar.cc/150";

                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link 
                      to={`/articles/${article.id}`} 
                      className="block group bg-white rounded-[18px] w-full flex flex-col h-[275px] overflow-hidden hover:bg-slate-50 transition-all border border-border-light shadow-soft"
                    >
                      {/* Image Area on Top */}
                      <div className="relative w-full h-[120px] shrink-0">
                        <img 
                          src={coverSource} 
                          alt={article.title} 
                          className="w-full h-full object-cover rounded-t-[18px]" 
                        />
                        
                        {/* Bookmark Button top-left of image */}
                        <button className="absolute top-[8px] left-[8px] bg-black/40 backdrop-blur-md w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10">
                          <Bookmark className="w-[12px] h-[12px]" />
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="p-[12px] flex flex-col justify-between flex-1 text-right">
                        {/* Title: Occupies top area of content, scales font size to ensure all text fits fully without clipping within 4 lines max */}
                        <h4 
                          className="font-semibold font-ibm text-text-primary text-right"
                          style={getTitleStyle(article.title)}
                        >
                          {article.title}
                        </h4>

                        <div className="flex flex-col gap-1.5 mt-auto">
                          {/* Date: Hijri & Gregorian stacked */}
                          <div className="flex flex-col text-[10px] text-text-secondary font-normal font-ibm gap-[1px]">
                            <div className="flex items-center gap-[4px] justify-start text-right">
                              <CalendarDays className="w-3.5 h-3.5 text-text-muted" />
                              <span>{article.hijriDate || "ذو الحجة 1446 هـ"}</span>
                            </div>
                            <span className="text-[9px] text-text-muted pr-[18px] text-right">
                              {getGregorianDate(article)}
                            </span>
                          </div>

                          {/* Author Info */}
                          <div className="flex items-center gap-[6px] h-[24px] justify-start">
                            <img 
                              src={article.authorPhoto || "https://i.pravatar.cc/150"} 
                              className="w-[20px] h-[20px] rounded-full object-cover shrink-0" 
                              alt={article.authorName} 
                            />
                            <span className="text-[10px] sm:text-[11px] font-medium font-ibm text-text-primary truncate text-right">
                              {article.authorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 font-ibm">لا توجد مقالات تطابق هذا البحث</div>
          )}
        </div>
      </div>
    </div>
  );
}


