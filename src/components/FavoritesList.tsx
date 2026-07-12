import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, FileText, User, Trash2, Video, X, Menu } from "lucide-react";
import { FavoriteItem } from "../types";

export function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

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
    leader: favorites.filter(f => f.type === "leader"),
    watch: favorites.filter(f => f.type === "watch"),
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-2.5 left-4 z-[60] p-2 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-border-light transition-all active:scale-95"
        title="المفضلة"
      >
        <Menu className="w-6 h-6 text-taiz-navy dark:text-white" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in" onClick={() => setIsOpen(false)}></div>
          <div className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-surface-card z-[70] shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0" dir="rtl">
            <div className="p-4 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-taiz-royal" />
                <h3 className="text-xl font-bold text-text-primary">مفضلتي</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-surface-main hover:bg-surface-hover rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
              {favorites.length === 0 ? (
                <div className="text-center text-text-muted mt-10">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد عناصر في المفضلة بعد.</p>
                </div>
              ) : (
                <>
                  {groupedFavorites.news.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-taiz-navy flex items-center gap-2 border-b border-border-light pb-2">
                        <FileText className="w-4 h-4 text-taiz-sky" /> الأخبار والمقالات
                      </h4>
                      {groupedFavorites.news.map(item => <FavoriteCard key={item.id} item={item} onRemove={removeFavorite} onClick={() => setIsOpen(false)} />)}
                    </div>
                  )}

                  {groupedFavorites.watch.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-taiz-navy flex items-center gap-2 border-b border-border-light pb-2">
                        <Video className="w-4 h-4 text-taiz-sky" /> شاهد
                      </h4>
                      {groupedFavorites.watch.map(item => <FavoriteCard key={item.id} item={item} onRemove={removeFavorite} onClick={() => setIsOpen(false)} />)}
                    </div>
                  )}

                  {groupedFavorites.leader.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-taiz-navy flex items-center gap-2 border-b border-border-light pb-2">
                        <User className="w-4 h-4 text-taiz-sky" /> السيد القائد
                      </h4>
                      {groupedFavorites.leader.map(item => <FavoriteCard key={item.id} item={item} onRemove={removeFavorite} onClick={() => setIsOpen(false)} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FavoriteCard({ item, onRemove, onClick }: { item: FavoriteItem; onRemove: (id: string) => void; onClick: () => void; key?: React.Key }) {
  const linkTo = item.type === "news" ? `/news/${item.id}` : item.type === "watch" ? `/watch/${item.id}` : `/leader/${item.id}`;
  return (
    <div className="bg-surface-main rounded-xl border border-border-light p-2 flex gap-3 relative group">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.title} className="w-14 h-14 object-cover rounded-lg shrink-0" />
      ) : (
        <div className="w-14 h-14 bg-taiz-royal/5 rounded-lg flex items-center justify-center shrink-0">
          <Bookmark className="w-6 h-6 text-taiz-royal/50" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Link to={linkTo} onClick={onClick} className="font-bold text-xs text-text-primary line-clamp-2 hover:text-taiz-royal transition-colors before:absolute before:inset-0">
          {item.title}
        </Link>
      </div>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="absolute top-1 left-1 p-1.5 rounded-md text-text-muted hover:text-status-danger hover:bg-status-danger/10 z-10"
        title="إزالة من المفضلة"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
