import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, FileText, User, Trash2, Video, BookOpen, Layers } from "lucide-react";
import { FavoriteItem } from "../types";

export function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const saved = localStorage.getItem("favorite_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validItems = parsed.filter((item: any) => typeof item === "object" && item.id);
        setFavorites(validItems.sort((a: FavoriteItem, b: FavoriteItem) => b.savedAt - a.savedAt));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(item => item.id !== id);
    setFavorites(updated);
    localStorage.setItem("favorite_items", JSON.stringify(updated));
  };

  const groupedFavorites = {
    news: favorites.filter(f => f.type === "news"),
    article: favorites.filter(f => f.type === "article"),
    watch: favorites.filter(f => f.type === "watch"),
    leader: favorites.filter(f => f.type === "leader"),
  };

  const filteredFavorites = selectedCategory === "all" 
    ? favorites 
    : favorites.filter(f => f.type === selectedCategory);

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* 1. Header with Red Bookmark Icon and Title "مفضلتي" */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5 text-red-600 fill-red-600" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-cairo flex items-center gap-2">
              <span>مفضلتي</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الأخبار، المقالات، المحاضرات، والفيديوهات التي قمت بحفظها للوصول السريع
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700">
          <Bookmark className="w-3.5 h-3.5 text-red-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {favorites.length} {favorites.length === 1 ? "عنصر محفوظ" : "عناصر محفوظة"}
          </span>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "all", label: "الكل", count: favorites.length, icon: Layers },
            { id: "news", label: "الأخبار", count: groupedFavorites.news.length, icon: FileText },
            { id: "article", label: "المقالات", count: groupedFavorites.article.length, icon: BookOpen },
            { id: "watch", label: "الفيديوهات (شاهد)", count: groupedFavorites.watch.length, icon: Video },
            { id: "leader", label: "السيد القائد", count: groupedFavorites.leader.length, icon: User },
          ].map((tab) => {
            if (tab.id !== "all" && tab.count === 0) return null;
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Favorite Items Grid */}
      {filteredFavorites.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
            <Bookmark className="w-8 h-8 opacity-60" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 font-cairo">
            لا توجد عناصر محفوظة في مفضلتك
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            يمكنك حفظ الأخبار، المقالات، الفيديوهات والدروس أثناء تصفحك بالضغط على زر الإشارة المرجعية لتظهر لك هنا في أي وقت.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map((item) => (
            <FavoriteItemCard key={item.id} item={item} onRemove={removeFavorite} />
          ))}
        </div>
      )}

    </div>
  );
}

function FavoriteItemCard({ item, onRemove }: { item: FavoriteItem; onRemove: (id: string) => void }) {
  const linkTo = 
    item.type === "news" ? `/news/${item.id}` 
    : item.type === "article" ? `/articles/${item.id}` 
    : item.type === "watch" ? `/watch/${item.id}` 
    : `/leader/${item.id}`;

  const badgeConfig = {
    news: { label: "خبر", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800", icon: FileText },
    article: { label: "مقال", bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800", icon: BookOpen },
    watch: { label: "فيديو", bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800", icon: Video },
    leader: { label: "محاضرة", bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800", icon: User },
  }[item.type] || { label: "مادة", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Bookmark };

  const TypeIcon = badgeConfig.icon;

  const dateFormatted = item.savedAt ? new Date(item.savedAt).toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  }) : "";

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-300 shadow-xs hover:shadow-md flex gap-3.5 items-center">
      {/* Thumbnail */}
      <Link to={linkTo} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 group-hover:scale-102 transition-transform">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <TypeIcon className="w-8 h-8 opacity-40" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badgeConfig.bg}`}>
            <TypeIcon className="w-3 h-3" />
            <span>{badgeConfig.label}</span>
          </span>

          {dateFormatted && (
            <span className="text-[10px] font-medium text-slate-400">
              {dateFormatted}
            </span>
          )}
        </div>

        <Link to={linkTo} className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-red-600 dark:hover:text-red-400 transition-colors font-cairo leading-snug">
          {item.title}
        </Link>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
        title="إزالة من المفضلة"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
