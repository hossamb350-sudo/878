import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { NewsItem, VideoItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, Bookmark, Headphones, Newspaper, Clock, PlayCircle, MonitorPlay, ChevronLeft } from "lucide-react";
import { motion } from "motion/react";

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
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"top" | "following">("top");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const _news = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(30)));
        setNews(_news.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));

        const _videos = await getDocs(collection(db, "videos"));
        const videoData = _videos.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem));
        videoData.sort((a, b) => {
          const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
          const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return b.createdAt - a.createdAt;
        });
        setVideos(videoData.slice(0, 10));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

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

  // Filter items
  let filteredNews = activeTab === "following" 
    ? news.filter(n => savedArticles.includes(n.id))
    : [...news];

  // Pin manually-pinned news at top
  const pinnedNewsIndex = filteredNews.findIndex(n => n.isPinned);
  let heroItem = filteredNews[0];
  let listItems = filteredNews.slice(1);

  if (pinnedNewsIndex > 0) {
    heroItem = filteredNews[pinnedNewsIndex];
    listItems = [...filteredNews.slice(0, pinnedNewsIndex), ...filteredNews.slice(pinnedNewsIndex + 1)];
  } else if (pinnedNewsIndex === 0) {
    heroItem = filteredNews[0];
    listItems = filteredNews.slice(1);
  }

  // Define breakingNewsIndex as fallback or kept as empty if not needed
  const breakingNewsIndex = -1;

  const breakingItems = news.filter(n => n.isBreaking).slice(0, 3); // For the vertical timeline under hero

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-[760px] mx-auto w-full pb-16 bg-white dark:bg-gray-950 transition-colors"
    >
      
      {/* Brand Header Banner - Taiz Media Style with Calligraphy Droplet */}
      <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 pt-5 pb-0 sticky top-0 z-30 px-4">
        <div className="flex items-center justify-between max-w-[720px] mx-auto mb-3">
          {/* Left Side: Simple Text Branding */}
          <div className="flex items-center select-none py-1">
            <div className="flex flex-col text-left">
              <span className="font-[900] text-2xl tracking-tighter leading-none text-gray-950 dark:text-white">منصة تعز الإعلامية</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">إخبارية ثقافية |</span>
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-500 tracking-[0.15em] uppercase">Taiz Media Platform</span>
              </div>
            </div>
          </div>

          <div></div>
        </div>
        
        {/* Tab Navigation Underlines */}
        <div className="flex max-w-[720px] mx-auto border-t border-gray-50 dark:border-gray-900 overflow-x-auto">
          <div className="flex w-full gap-4">
            <button 
              onClick={() => setActiveTab("top")}
              className={`py-3.5 px-4 font-extrabold text-[16px] transition-all relative ${
                activeTab === "top" 
                  ? "text-black dark:text-white" 
                  : "text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
               أهم الأخبار
               {activeTab === "top" && (
                 <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-black dark:bg-white transition-all"></div>
               )}
            </button>
            <button 
              onClick={() => setActiveTab("following")}
              className={`py-3.5 px-4 font-extrabold text-[16px] transition-all relative ${
                activeTab === "following" 
                  ? "text-black dark:text-white" 
                  : "text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
               المتابعة
               {activeTab === "following" && (
                 <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-black dark:bg-white transition-all"></div>
               )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-0 sm:p-4">
        {loading ? (
           <div className="space-y-6 pt-4 px-4 sm:px-0">
              <div className="animate-pulse bg-gray-100 dark:bg-gray-900 h-64 sm:h-80 w-full mb-6 rounded-none"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse px-4 sm:px-0">
                   <div className="w-[110px] h-[110px] bg-gray-100 dark:bg-gray-900 shrink-0"></div>
                   <div className="flex-1 space-y-3 py-2">
                      <div className="h-6 bg-gray-100 dark:bg-gray-900 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded w-2/3"></div>
                   </div>
                </div>
              ))}
           </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-150 dark:border-gray-800 m-4 sm:m-0 rounded-2xl font-sans">
             <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-30" />
             <p className="text-lg font-bold">لا توجد أخبار هنا</p>
             <p className="text-sm mt-1 text-gray-400">احفظ الأخبار لقرائتها لاحقاً في قائمة المتابعة.</p>
          </div>
        ) : (
          <div className="space-y-0">
            
            {/* HERO FEATURED POST */}
            {heroItem && (
              <div className="block bg-white dark:bg-gray-950 pb-6 border-b border-gray-150 dark:border-gray-900 mb-6 font-sans">
                {heroItem.imageUrl && (
                  <Link to={`/news/${heroItem.id}`} className="block group w-full relative aspect-[16/10] sm:aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4 sm:rounded-sm shadow-sm">
                     <img 
                       src={heroItem.imageUrl} 
                       alt={heroItem.title} 
                       className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </Link>
                )}
                
                <div className="px-4 sm:px-0">
                  <Link to={`/news/${heroItem.id}`} className="block hover:text-blue-600 dark:hover:text-amber-400 transition-colors">
                    <h2 className="font-extrabold text-[20px] sm:text-[24px] text-[#111827] dark:text-[#f3f4f6] leading-[1.3] mb-4 text-right">
                       {heroItem.title}
                    </h2>
                  </Link>
                  
                  {/* Info Row: Blinking Live coverage + Bookmark */}
                  <div className="flex items-center justify-between mb-4 mt-2">
                    {/* Pulsing Live Cover */}
                    {heroItem.isBreaking ? (
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500 font-extrabold text-[14px] select-none">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                        </span>
                        تغطية مباشرة
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] px-2.5 py-0.5 rounded-full font-black border border-emerald-500/10">
                          {heroItem.category || "مادة بارزة"}
                        </span>
                        <span className="text-stone-400 dark:text-zinc-500 text-xs font-bold leading-none">
                          {new Date(heroItem.createdAt).toLocaleDateString("ar-YE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    {/* Bookmark on the left */}
                    <button 
                      onClick={(e) => toggleBookmark(heroItem.id, e)} 
                      className="text-gray-400 hover:text-black dark:hover:text-white transition transform active:scale-90"
                      title="حفظ للقرأة لاحقاً"
                    >
                      <Bookmark className={`w-5.5 h-5.5 ${savedArticles.includes(heroItem.id) ? "fill-black text-black dark:fill-white dark:text-white" : "stroke-[1.5]"}`} />
                    </button>
                  </div>
                  
                  {/* Vertical Connecting Live Update Timeline */}
                  {((heroItem.liveUpdates && heroItem.liveUpdates.length > 0) || (heroItem.isBreaking && breakingItems.length > 0)) && (
                    <div className="mt-4 mb-2 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-900 text-right">
                      <div className="space-y-5 relative before:absolute before:right-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 dark:before:bg-gray-800">
                        {heroItem.liveUpdates && heroItem.liveUpdates.length > 0 ? (
                          heroItem.liveUpdates.map((update) => (
                            <div key={update.id} className="relative pr-6">
                              {/* Connector dot */}
                              <span className="absolute right-0 top-1.5 w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600 border-[3px] border-white dark:border-gray-950 z-10 shadow-sm"></span>
                              <p className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                {update.text}
                              </p>
                              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1.5 block">
                                {update.time}
                              </span>
                            </div>
                          ))
                        ) : (
                          // Dynamic fallback breaking news list timeline
                          breakingItems.map((bItem) => (
                            <div key={bItem.id} className="relative pr-6">
                              <span className="absolute right-0 top-1.5 w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600 border-[3px] border-white dark:border-gray-950 z-10 shadow-sm"></span>
                              <Link to={`/news/${bItem.id}`} className="hover:text-blue-600 dark:hover:text-amber-400 transition-colors">
                                <p className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                  {bItem.title}
                                </p>
                              </Link>
                              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1.5 block">
                                {getRelativeArabicTime(bItem.createdAt)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* LIST CHANNELS */}
            <div className="flex flex-col font-sans">
              {listItems.map((item, index) => (
                <div key={item.id}>
                    <Link 
                    to={`/news/${item.id}`} 
                    className="flex gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all border-b border-gray-100 dark:border-gray-900 px-4 sm:px-0"
                  >
                    {/* Right Side News Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 text-right pr-1">
                       <div>
                          <h3 className="font-extrabold text-[14px] sm:text-[16px] text-[#111827] dark:text-[#f3f4f6] leading-[1.38] transition-colors hover:text-blue-600 dark:hover:text-amber-400 mb-1 truncate whitespace-normal line-clamp-2">
                            {item.title}
                          </h3>
                          {(item.shortDescription || (item.content && item.content.substring(0, 80))) && (
                            <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mt-1">
                              {item.shortDescription || (item.content ? item.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').substring(0, 100) + "..." : "")}
                            </p>
                          )}
                       </div>

                       {/* Bottom row: Meta right-side, Actions left-side */}
                       <div className="flex w-full min-w-0 items-start sm:items-center justify-between mt-3 text-[11px] sm:text-[12px] text-gray-400 font-medium">
                          {/* Right Side: Relative time, category, author, absolute date */}
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-gray-400 dark:text-gray-500">
                             <span className="shrink-0 font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getRelativeArabicTime(item.createdAt)}
                             </span>
                             <span className="text-gray-300 dark:text-gray-700 shrink-0 hidden sm:inline-block">•</span>
                             <span className="shrink-0 text-[10px] hidden sm:inline-block">
                                {new Date(item.createdAt).toLocaleDateString("ar-YE", { weekday: "short", day: "numeric", month: "short" })} - {new Date(item.createdAt).toLocaleTimeString("ar-YE", { hour: "numeric", minute: "2-digit" })}
                             </span>
                             <span className="text-gray-300 dark:text-gray-700 shrink-0">•</span>
                             <span className="text-blue-700 dark:text-blue-400 font-bold shrink-0">{item.category}</span>
                             {item.author && (
                               <>
                                 <span className="text-gray-300 dark:text-gray-700 shrink-0">•</span>
                                 <span className="shrink-0 text-gray-500 font-bold max-w-[80px] truncate">{item.author}</span>
                               </>
                             )}
                          </div>
                          
                          {/* Left Side: Buttons */}
                          <div className="flex items-center gap-2 pl-1 shrink-0 self-end sm:self-auto">
                            <button 
                              onClick={(e) => toggleBookmark(item.id, e)} 
                              className="text-gray-400 hover:text-[#111827] dark:hover:text-white transition p-1"
                              title="حفظ"
                            >
                              <Bookmark className={`w-[18px] h-[18px] ${savedArticles.includes(item.id) ? "fill-black text-black dark:fill-white dark:text-white" : "stroke-[1.5]"}`} />
                            </button>
                          </div>
                       </div>
                    </div>

                    {/* Left Side Compact Image */}
                    {item.imageUrl && (
                      <div className="w-[96px] h-[96px] sm:w-[110px] sm:h-[110px] rounded-sm overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-50 dark:border-gray-900">
                         <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </Link>

                  {/* Insert Video Slider Container */}
                  {index === 1 && videos.length > 0 && activeTab === 'top' && (
                    <div className="my-6 py-6 border-b border-gray-100 dark:border-gray-900 bg-gray-50/40 dark:bg-gray-900/20 rounded-xl px-4">
                      <div className="flex items-center justify-between mb-4 text-right">
                        <Link to="/watch" className="flex items-center gap-2 group cursor-pointer inline-flex">
                           <MonitorPlay className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                           <h2 className="font-extrabold text-lg select-none group-hover:text-red-600 transition-colors">أحدث الفيديوهات والتقارير</h2>
                           <span className="bg-[#facc15] text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded leading-none">جديد</span>
                        </Link>
                      </div>
                      
                      <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {videos.map(video => (
                           <Link key={video.id} to={`/watch?v=${encodeURIComponent(video.url)}`} className="snap-start shrink-0 w-[240px] sm:w-[280px] group block">
                              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-900 mb-2.5 shadow-md">
                                 {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:scale-103 transition-transform duration-500" />
                                 ) : (
                                    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black"></div>
                                 )}
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                    <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white transition-all transform group-hover:scale-105" />
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                                    <div className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 inline-block mb-2 rounded-sm uppercase tracking-wide">فيديو</div>
                                    <h4 className="text-white text-sm font-bold leading-tight line-clamp-3 text-right">{video.title}</h4>
                                 </div>
                              </div>
                           </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </motion.div>
  );
}
