import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit, where } from "firebase/firestore";
import { db } from "../firebase";
import { NewsItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, Flame, Volume2, Newspaper, Clock } from "lucide-react";

function getRelativeArabicTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "الآن";
  if (diffMin < 60) {
    if (diffMin === 1) return "منذ دقيقة";
    if (diffMin === 2) return "منذ دقيقتين";
    if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
    return `منذ ${diffMin} دقيقة`;
  }
  if (diffHours < 24) {
    if (diffHours === 1) return "منذ ساعة";
    if (diffHours === 2) return "منذ ساعتين";
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  }
  if (diffDays === 1) return "أمس";
  if (diffDays === 2) return "منذ يومين";
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  return format(timestamp, "dd MMMM yyyy", { locale: ar });
}

export function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "local" | "breaking">("all");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const _news = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(30)));
        setNews(_news.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();

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

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated = [...savedArticles];
    if (updated.includes(id)) {
      updated = updated.filter(item => item !== id);
    } else {
      updated.push(id);
    }
    setSavedArticles(updated);
    localStorage.setItem("saved_news", JSON.stringify(updated));
  };

  const handleShare = async (item: NewsItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.shortDescription,
          url: `${window.location.origin}/news/${item.id}`,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/news/${item.id}`);
      alert("تم نسخ رابط الخبر للمشاركة!");
    }
  };

  // Filter items based on activeTab
  const breakingNews = news.filter(n => n.isBreaking);
  const filteredNews = news.filter(n => {
    if (activeTab === "breaking") return n.isBreaking;
    if (activeTab === "local") return n.category === "محلية" || n.category === "خدمات";
    return true; // "all"
  });

  const heroItem = filteredNews[0];
  const listItems = filteredNews.slice(1);

  return (
    <div className="max-w-3xl mx-auto w-full pb-16 bg-white dark:bg-gray-950 transition-colors">
      
      {/* Dynamic Breaking News Alert Bar */}
      {breakingNews.length > 0 && (
        <div className="bg-red-600 text-white flex items-center px-4 py-2 text-sm overflow-hidden whitespace-nowrap sticky top-16 z-10 shadow-md">
          <span className="font-extrabold shrink-0 ml-3 bg-white text-red-700 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-red-700" />
            عاجل
          </span>
          <div className="animate-marquee inline-block overflow-hidden relative w-full text-xs sm:text-sm font-medium">
             <div className="flex gap-8 whitespace-nowrap animate-infinite-scroll">
               {breakingNews.map(n => (
                 <Link key={n.id} to={`/news/${n.id}`} className="hover:underline transition-all">
                   • {n.title}
                 </Link>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Premium Al Jazeera Theme Tabs */}
      <div className="border-b border-gray-100 dark:border-gray-800 flex justify-center sticky top-[104px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-md z-10">
         <div className="flex w-full px-4 max-w-lg">
            <button 
              onClick={() => setActiveTab("all")}
              className={`flex-1 text-center py-3.5 font-bold text-base transition-all relative ${
                activeTab === "all" 
                  ? "text-gray-900 dark:text-white border-b-2 border-red-600 font-extrabold" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
               أهم الأخبار
            </button>
            <button 
              onClick={() => setActiveTab("local")}
              className={`flex-1 text-center py-3.5 font-bold text-base transition-all relative ${
                activeTab === "local" 
                  ? "text-gray-900 dark:text-white border-b-2 border-red-600 font-extrabold" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
               أخبار تعز والمحلية
            </button>
            <button 
              onClick={() => setActiveTab("breaking")}
              className={`flex-1 text-center py-3.5 font-bold text-base transition-all relative ${
                activeTab === "breaking" 
                  ? "text-gray-950 dark:text-gray-100 border-b-2 border-red-600 font-extrabold" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
               عاجل تعز
            </button>
         </div>
      </div>

      <div className="p-4">
        {loading ? (
           <div className="space-y-6">
              {/* Skeleton loading matching our new list design */}
              <div className="animate-pulse bg-gray-100 dark:bg-gray-900 rounded-2xl h-80 w-full mb-6"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                   <div className="w-28 h-28 sm:w-36 sm:h-36 bg-gray-100 dark:bg-gray-900 rounded-xl shrink-0"></div>
                   <div className="flex-1 space-y-3 py-2">
                      <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-100 dark:bg-gray-900 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded w-2/3"></div>
                   </div>
                </div>
              ))}
           </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-150 dark:border-gray-800">
             <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30" />
             <p className="text-lg font-bold">يرجى إضافة أخبار من لوحة التحكم</p>
             <p className="text-xs mt-1">لا توجد أخبار مدرجة في هذا القسم حالياً.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* HERO FEATURED POST - Al Jazeera Style */}
            {heroItem && (
              <Link 
                to={`/news/${heroItem.id}`} 
                className="block group bg-white dark:bg-gray-950 overflow-hidden pb-6 border-b border-gray-100 dark:border-gray-800"
              >
                {heroItem.imageUrl && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 group-hover:shadow-md transition-shadow">
                     <img 
                       src={heroItem.imageUrl} 
                       alt={heroItem.title} 
                       className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-550 ease-out" 
                     />
                     <span className="absolute bottom-3 right-3 bg-blue-600 text-white text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                       {heroItem.category}
                     </span>
                  </div>
                )}
                
                <div className="pt-4 px-1">
                  
                  {/* Category and live status line */}
                  <div className="flex items-center gap-2 mb-2">
                    {heroItem.isBreaking ? (
                      <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                         <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                         تغطية عاجلة ومباشرة
                      </span>
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                         {heroItem.category}
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                     {heroItem.title}
                  </h2>
                  
                  {/* Summary / Bullet indicators */}
                  <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {heroItem.shortDescription}
                  </p>

                  <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                     <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getRelativeArabicTime(heroItem.createdAt)}
                     </span>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => toggleBookmark(heroItem.id, e)} 
                          className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all"
                        >
                          <Bookmark className={`w-5 h-5 ${savedArticles.includes(heroItem.id) ? "fill-red-600 text-red-600" : ""}`} />
                        </button>
                        <button 
                          onClick={(e) => handleShare(heroItem, e)} 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                </div>
              </Link>
            )}

            {/* LIST CHANNELS - Al Jazeera Left-Thumb Style */}
            <div className="space-y-5">
              {listItems.map(item => (
                <Link 
                  key={item.id} 
                  to={`/news/${item.id}`} 
                  className="flex gap-4 p-1 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all border-b border-gray-100 dark:border-gray-850 pb-5 last:border-0"
                >
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                     <div>
                        {/* Meta Category & Time */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`${item.isBreaking ? 'text-red-600 font-extrabold' : 'text-gray-500 font-bold'} text-xs`}>
                            {item.isBreaking ? 'خبر عاجل' : item.category}
                          </span>
                          <span className="text-gray-350 dark:text-gray-600 text-xs">•</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs">
                            {getRelativeArabicTime(item.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-base sm:text-lg text-gray-950 dark:text-gray-50 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>

                        {/* Short text description (screen md+) */}
                        <p className="text-gray-500 dark:text-gray-300 text-xs mt-1.5 hidden sm:line-clamp-2">
                           {item.shortDescription}
                        </p>
                     </div>

                     {/* Article Footer with Share/Save Buttons */}
                     <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                        <span className="text-[11px] text-gray-400">منصة تعز</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => toggleBookmark(item.id, e)} 
                            className="p-1 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded transition"
                          >
                            <Bookmark className={`w-4 h-4 ${savedArticles.includes(item.id) ? "fill-red-600 text-red-600" : ""}`} />
                          </button>
                          <button 
                            onClick={(e) => handleShare(item, e)} 
                            className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 rounded transition"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                  </div>

                  {item.imageUrl && (
                    <div className="w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 shadow-sm">
                       <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                </Link>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
