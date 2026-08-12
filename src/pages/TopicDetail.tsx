import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Eye, 
  Play, 
  Newspaper, 
  Video, 
  FileText, 
  Tag, 
  Clock, 
  Share2, 
  Layers,
  Search,
  Check
} from "lucide-react";
import { collection, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FeaturedTopic, NewsItem, VideoItem, Article } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function TopicDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<FeaturedTopic | null>(null);
  const [topicLoading, setTopicLoading] = useState(true);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"all" | "news" | "videos" | "articles">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // 1. Fetch Topic Metadata
  useEffect(() => {
    if (!topicId) return;
    setTopicLoading(true);

    const unsubTopic = onSnapshot(doc(db, "featured_topics", topicId), (docSnap) => {
      if (docSnap.exists()) {
        setTopic({ id: docSnap.id, ...docSnap.data() } as FeaturedTopic);
      } else {
        setTopic(null);
      }
      setTopicLoading(false);
    }, (err) => {
      console.warn("Error fetching topic:", err);
      setTopicLoading(false);
    });

    return () => unsubTopic();
  }, [topicId]);

  // 2. Fetch News, Videos, and Articles in real-time
  useEffect(() => {
    setContentLoading(true);

    // Subscribe to news
    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubNews = onSnapshot(qNews, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem));
      setNews(list);
    }, (err) => console.warn("Error fetching news for topic:", err));

    // Subscribe to videos
    const qVideos = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubVideos = onSnapshot(qVideos, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem));
      setVideos(list);
    }, (err) => console.warn("Error fetching videos for topic:", err));

    // Subscribe to articles
    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Article));
      setArticles(list);
      setContentLoading(false);
    }, (err) => {
      console.warn("Error fetching articles for topic:", err);
      setContentLoading(false);
    });

    return () => {
      unsubNews();
      unsubVideos();
      unsubArticles();
    };
  }, []);

  // Helper function to check if content item matches topic categories or topic title
  const matchesTopicCategories = (itemCategory?: string, itemCatLegacy?: string, itemTitle?: string) => {
    if (!topic) return false;

    // Build array of categories from the topic
    const topicCats = topic.categories || [];
    // Also include topic title in case content is tagged directly with topic title
    const matchTargets = [...topicCats, topic.title].filter(Boolean).map(c => c.trim().toLowerCase());

    if (matchTargets.length === 0) return false;

    // Collect item's category tags
    const itemCategories: string[] = [];
    if (itemCategory) itemCategories.push(...itemCategory.split(/[,/]/));
    if (itemCatLegacy) itemCategories.push(...itemCatLegacy.split(/[,/]/));

    // Check if any item category matches any topic category or topic title
    const categoryMatch = itemCategories.some(itemCat => {
      const normItemCat = itemCat.trim().toLowerCase();
      if (!normItemCat) return false;

      return matchTargets.some(target => {
        return normItemCat === target || normItemCat.includes(target) || target.includes(normItemCat);
      });
    });

    if (categoryMatch) return true;

    // Also check if item title or content explicitly mentions any topic category or topic title
    if (itemTitle) {
      const normTitle = itemTitle.toLowerCase();
      return matchTargets.some(target => target.length >= 3 && normTitle.includes(target));
    }

    return false;
  };

  // Filter content dynamically across all collections
  const filteredNews = news.filter(n => matchesTopicCategories(n.category, (n as any).cat, n.title));
  const filteredVideos = videos.filter(v => matchesTopicCategories(v.category, (v as any).cat, v.title));
  const filteredArticles = articles.filter(a => matchesTopicCategories(a.category, (a as any).cat, a.title));

  // Combine and filter by search query & active tab
  const allTopicContent = [
    ...filteredNews.map(n => ({ ...n, itemType: "news" as const })),
    ...filteredVideos.map(v => ({ ...v, itemType: "video" as const })),
    ...filteredArticles.map(a => ({ ...a, itemType: "article" as const }))
  ].sort((a, b) => {
    const timeA = a.createdAt || (a as any).timestamp || 0;
    const timeB = b.createdAt || (b as any).timestamp || 0;
    return timeB - timeA;
  });

  const displayedContent = allTopicContent.filter(item => {
    // Tab filter
    if (activeTab === "news" && item.itemType !== "news") return false;
    if (activeTab === "videos" && item.itemType !== "video") return false;
    if (activeTab === "articles" && item.itemType !== "article") return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const summaryMatch = (item as any).summary?.toLowerCase().includes(q) || (item as any).shortDescription?.toLowerCase().includes(q);
      const catMatch = item.category?.toLowerCase().includes(q);
      return titleMatch || summaryMatch || catMatch;
    }

    return true;
  });

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    try {
      return format(new Date(timestamp), "d MMMM yyyy", { locale: ar });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-cairo">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button & Share */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-taiz-sky transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>

          <button
            onClick={handleCopyShare}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-taiz-sky/50 transition-all shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-taiz-sky" />}
            <span>{copied ? "تم نسخ الرابط!" : "مشاركة الموضوع"}</span>
          </button>
        </div>

        {/* Topic Banner Loading / Empty / Content */}
        {topicLoading ? (
          <div className="w-full h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse mb-8" />
        ) : !topic ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-black mb-2">الموضوع غير موجود</h2>
            <p className="text-slate-500 text-sm mb-6">قد يكون تم حذف هذا الموضوع المتميز أو تعديل الرابط الخاص به.</p>
            <Link to="/" className="px-6 py-2.5 bg-taiz-sky text-white rounded-xl font-bold text-sm">
              العودة للرئيسية
            </Link>
          </div>
        ) : (
          <>
            {/* Header Topic Banner */}
            <div className="relative rounded-[32px] overflow-hidden mb-8 border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl">
              {/* Image Background */}
              <div className="absolute inset-0">
                <img 
                  src={topic.imageUrl} 
                  alt={topic.title}
                  className="w-full h-full object-cover opacity-35 filter blur-xs scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
              </div>

              <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
                {/* Topic Image Card */}
                <div className="w-full md:w-64 h-48 md:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0">
                  <img src={topic.imageUrl} alt={topic.title} className="w-full h-full object-cover" />
                </div>

                {/* Topic Info */}
                <div className="flex-1 text-center md:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black mb-3 backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تغطية شاملة وموضوع متميز</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-4 text-white drop-shadow-md">
                    {topic.title}
                  </h1>

                  {/* Associated Categories Badges */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                    <span className="text-xs font-bold text-slate-300 ml-1">التصنيفات المجمعة:</span>
                    {topic.categories && topic.categories.length > 0 ? (
                      topic.categories.map((cat, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 text-xs font-bold transition-all"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{cat}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">لا توجد تصنيفات محددة</span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300 font-bold border-t border-white/10 pt-4">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-taiz-sky" />
                      <span>إجمالي المواد: {allTopicContent.length}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Newspaper className="w-4 h-4 text-blue-400" />
                      <span>{filteredNews.length} أخبار</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-rose-400" />
                      <span>{filteredVideos.length} فيديوهات</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>{filteredArticles.length} مقالات</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Filtering Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "all" 
                      ? "bg-taiz-sky text-white shadow-md shadow-taiz-sky/20" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>الكل ({allTopicContent.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("news")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "news" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <span>الأخبار ({filteredNews.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("videos")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "videos" 
                      ? "bg-rose-600 text-white shadow-md shadow-rose-500/20" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Video className="w-4 h-4 text-rose-400" />
                  <span>الفيديوهات ({filteredVideos.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("articles")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "articles" 
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>المقالات ({filteredArticles.length})</span>
                </button>
              </div>

              {/* Internal Search Bar */}
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث داخل الموضوع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-taiz-sky/50"
                />
              </div>
            </div>

            {/* Content Grid */}
            {contentLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : displayedContent.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                <Tag className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                  لا يوجد محتوى مرتبط بهذا الموضوع حالياً
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  تأكد من إدراج محتوى أو أخبار أو فيديوهات تحمل أحد التصنيفات المرتبطة بالموضوع ({topic.categories?.join("، ") || "بدون تصنيف"}).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedContent.map((item) => {
                  const isVideo = item.itemType === "video";
                  const isArticle = item.itemType === "article";
                  const itemLink = isVideo 
                    ? `/watch?v=${item.id}` 
                    : isArticle 
                      ? `/article/${item.id}` 
                      : `/news/${item.id}`;

                  return (
                    <Link
                      key={`${item.itemType}-${item.id}`}
                      to={itemLink}
                      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-taiz-sky/50 transition-all shadow-xs hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                    >
                      {/* Card Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img 
                          src={(item as any).imageUrl || (item as any).thumbnailUrl || "/placeholder.jpg"} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                        {/* Item Type Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          {isVideo ? (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[11px] font-black flex items-center gap-1 shadow-md backdrop-blur-xs">
                              <Video className="w-3 h-3" />
                              فيديو
                            </span>
                          ) : isArticle ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-600/90 text-white text-[11px] font-black flex items-center gap-1 shadow-md backdrop-blur-xs">
                              <FileText className="w-3 h-3" />
                              مقال
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 text-white text-[11px] font-black flex items-center gap-1 shadow-md backdrop-blur-xs">
                              <Newspaper className="w-3 h-3" />
                              خبر
                            </span>
                          )}
                        </div>

                        {/* Category Label */}
                        {item.category && (
                          <div className="absolute bottom-3 right-3 z-10">
                            <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold border border-white/30 backdrop-blur-md">
                              {item.category}
                            </span>
                          </div>
                        )}

                        {/* Play overlay for video */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-taiz-sky transition-colors mb-2">
                            {item.title}
                          </h3>
                          {(item as any).summary && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                              {(item as any).summary}
                            </p>
                          )}
                        </div>

                        {/* Card Footer Date */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(item.createdAt || (item as any).timestamp)}</span>
                          </span>

                          <span className="text-taiz-sky font-bold group-hover:underline flex items-center gap-1">
                            <span>عرض المحتوى</span>
                            <ArrowRight className="w-3 h-3 rotate-180" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
