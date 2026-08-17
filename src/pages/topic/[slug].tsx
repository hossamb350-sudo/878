import React, { useEffect, useState, useMemo } from "react";
import { updateMetadata } from "../../utils/metadata";
import { extractIdFromSlug, generateSlug, routes } from "../../utils/routes";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { FeaturedTopic, NewsItem, VideoItem, Article } from "../../types";
import { 
  ArrowRight, 
  Tag, 
  Newspaper, 
  Video, 
  BookOpen, 
  Calendar, 
  Eye, 
  Play, 
  Sparkles, 
  Clock, 
  Search,
  Filter,
  Layers
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";

export function TopicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const id = extractIdFromSlug(slug || "");
  const navigate = useNavigate();

  const [topic, setTopic] = useState<FeaturedTopic | null>(null);
  const [topicLoading, setTopicLoading] = useState(true);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"all" | "news" | "videos" | "articles">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Load Topic Metadata
  useEffect(() => {
    if (!id) return;
    setTopicLoading(true);

    const fetchTopic = async () => {
      try {
        const docRef = doc(db, "featured_topics", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setTopic({ id: snap.id, ...snap.data() } as FeaturedTopic);
        } else {
          // Fallback: search by title or query if id is encoded string
          const decoded = decodeURIComponent(id);
          const q = query(collection(db, "featured_topics"), where("title", "==", decoded));
          const querySnap = await getDoc(docRef);
          if (snap.exists()) {
            setTopic({ id: snap.id, ...snap.data() } as FeaturedTopic);
          }
        }
      } catch (err) {
        console.error("Error loading topic:", err);
      } finally {
        setTopicLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  // 2. Real-time Listeners for News, Videos, Articles
  useEffect(() => {
    let unsubNews = () => {};
    let unsubVideos = () => {};
    let unsubArticles = () => {};

    try {
      const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
      unsubNews = onSnapshot(qNews, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem));
        setNews(data);
      });

      const qVideos = query(collection(db, "videos"), orderBy("createdAt", "desc"));
      unsubVideos = onSnapshot(qVideos, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem));
        setVideos(data);
      });

      const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      unsubArticles = onSnapshot(qArticles, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Article));
        setArticles(data);
        setContentLoading(false);
      });
    } catch (err) {
      console.error("Error subscribing to content:", err);
      setContentLoading(false);
    }

    return () => {
      unsubNews();
      unsubVideos();
      unsubArticles();
    };
  }, []);

  useEffect(() => {
    if (topic) {
      updateMetadata({
        title: topic.title,
        description: "",
        imageUrl: topic.imageUrl || "",
        type: "website",
        path: window.location.pathname
      });
    }
  }, [topic]);

  // Category Target Array from Topic
  const topicCategories = useMemo(() => {
    if (!topic) return [];
    if (topic.categories && topic.categories.length > 0) {
      return topic.categories.map(c => c.trim().toLowerCase());
    }
    return [topic.title.trim().toLowerCase()];
  }, [topic]);

  // Strict category checking helper
  const matchesTopicCategory = (itemCategory?: string, itemCategories?: string[]) => {
    if (topicCategories.length === 0) return false;
    const cat = (itemCategory || "").trim().toLowerCase();
    const cats = (itemCategories || []).map(c => c.trim().toLowerCase());

    return topicCategories.some(tc => {
      if (!tc) return false;
      if (cat === tc) return true;
      if (cats.includes(tc)) return true;
      if (cat && (cat.includes(tc) || tc.includes(cat))) return true;
      if (cats.some(c => c.includes(tc) || tc.includes(c))) return true;
      return false;
    });
  };

  // Filter Matching News
  const matchedNews = useMemo(() => {
    if (topicCategories.length === 0) return [];
    return news.filter((item) => {
      const matchCategory = matchesTopicCategory(item.category, item.categories);
      const matchSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [news, topicCategories, searchQuery]);

  // Filter Matching Videos
  const matchedVideos = useMemo(() => {
    if (topicCategories.length === 0) return [];
    return videos.filter((vid) => {
      const matchCategory = matchesTopicCategory(vid.category, []);
      const matchSearch = !searchQuery || vid.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [videos, topicCategories, searchQuery]);

  // Filter Matching Articles
  const matchedArticles = useMemo(() => {
    if (topicCategories.length === 0) return [];
    return articles.filter((art) => {
      const matchCategory = matchesTopicCategory(art.category, []);
      const matchSearch = !searchQuery || art.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [articles, topicCategories, searchQuery]);

  const totalCount = matchedNews.length + matchedVideos.length + matchedArticles.length;

  if (topicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-cairo">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">جاري تحميل بيانات الموضوع...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 font-cairo text-right" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg space-y-4">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">الموضوع غير موجود</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">قد يكون تم حذف الموضوع أو التعديل عليه مؤخراً</p>
          <button 
            onClick={() => navigate("/")}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-20 text-right" dir="rtl">
      {/* Top Navigation Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <div className="text-center truncate px-2">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              تغطية خاصة
            </span>
          </div>
          <div className="text-xs font-bold text-slate-400">
            {totalCount} عنصر
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 space-y-6">
        {/* TOPIC BANNER CARD */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl border border-slate-800 min-h-[180px] sm:min-h-[220px] flex flex-col justify-end p-5 sm:p-8 group">
          {/* Background Image */}
          {topic.imageUrl && (
            <div className="absolute inset-0">
              <img 
                src={topic.imageUrl} 
                alt={topic.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
            </div>
          )}

          {/* Banner Content */}
          <div className="relative z-10 space-y-3">
            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight font-cairo drop-shadow-md">
              {topic.title}
            </h1>
          </div>
        </div>

        {/* CONTROLS: TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "all"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>الكل ({totalCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("news")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "news"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>الأخبار ({matchedNews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("videos")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "videos"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>الفيديوهات ({matchedVideos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("articles")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "articles"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>المقالات ({matchedArticles.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <input 
              type="text"
              placeholder="تصفية محتوى الموضوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 pr-8 border border-transparent focus:border-amber-500 outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>
        </div>

        {/* CONTENT DISPLAY SECTIONS */}
        {contentLoading ? (
          <div className="py-16 text-center text-slate-400 font-bold text-xs">
            جاري جلب وتحديث المحتوى المرتبط...
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">لا يوجد محتوى مرتبط حالياً</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              سيتم عرض الأخبار والفيديوهات والمقالات التي تُنشر تحت التصنيفات المحددة لهذا الموضوع تلقائياً فور إضافتها.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* NEWS SECTION */}
            {(activeTab === "all" || activeTab === "news") && matchedNews.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <Newspaper className="w-5 h-5 text-amber-500" />
                  <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    الأخبار والتقارير الميدانية ({matchedNews.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedNews.map((item) => (
                    <Link
                      key={item.id}
                      to={routes.news(generateSlug(item.title || "", item.id))}
                      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Newspaper className="w-8 h-8" />
                            </div>
                          )}
                          <span className="absolute top-2 right-2 bg-slate-950/80 text-amber-400 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black border border-amber-500/20">
                            {item.category}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div className="p-3.5 space-y-2">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
                            {item.title}
                          </h3>
                          {item.shortDescription && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                              {item.shortDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="p-3.5 pt-0 flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          {format(item.createdAt || Date.now(), "dd/MM/yyyy", { locale: ar })}
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Eye className="w-3 h-3" />
                          {item.views || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* VIDEOS SECTION */}
            {(activeTab === "all" || activeTab === "videos") && matchedVideos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <Video className="w-5 h-5 text-red-500" />
                  <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    التغطيات المرئية والفيديوهات ({matchedVideos.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedVideos.map((vid) => (
                    <Link
                      key={vid.id}
                      to={routes.watchItem(generateSlug(vid.title || "", vid.id))}
                      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        {/* Video Thumbnail */}
                        <div className="relative aspect-video bg-slate-950 overflow-hidden">
                          {vid.thumbnailUrl ? (
                            <img 
                              src={vid.thumbnailUrl} 
                              alt={vid.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Video className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                            </div>
                          </div>
                          {vid.duration && (
                            <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                              {vid.duration}
                            </span>
                          )}
                          {vid.category && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                              {vid.category}
                            </span>
                          )}
                        </div>

                        {/* Video Title */}
                        <div className="p-3.5 space-y-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-500 transition-colors">
                            {vid.title}
                          </h3>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="p-3.5 pt-0 flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-red-500" />
                          {format(vid.createdAt || Date.now(), "dd/MM/yyyy", { locale: ar })}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Eye className="w-3 h-3" />
                          {vid.views || 0} مشاهدة
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ARTICLES SECTION */}
            {(activeTab === "all" || activeTab === "articles") && matchedArticles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    المقالات والتحليلات ({matchedArticles.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchedArticles.map((art) => (
                    <Link
                      key={art.id}
                      to={routes.article(generateSlug(art.title || "", art.id))}
                      className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xs hover:shadow-lg flex items-center gap-4"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                        {art.imageUrl ? (
                          <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen className="w-6 h-6" /></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          {art.category}
                        </span>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                          {art.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          بقلم: {art.authorName || "كاتب المنصة"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
