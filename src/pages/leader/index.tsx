import React, { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { LeaderContent } from "../../types";
import { updateMetadata } from "../../utils/metadata";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LeaderFilterBar } from "../../components/leader/LeaderFilterBar";
import { LeaderVideoCard } from "../../components/leader/LeaderVideoCard";
import { LeaderTextCard } from "../../components/leader/LeaderTextCard";
import { IslamicDivider } from "../../components/leader/LeaderIslamicOrnaments";

export function Leader() {
  const [content, setContent] = useState<LeaderContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("favorite_items");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => item.id);
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    updateMetadata({
      title: "السيد القائد - مكتبة الخطابات والمحاضرات الهدائية",
      description: "المكتبة التوثيقية الشاملة لخطابات ومحاضرات ودروس السيد القائد عبدالملك بدرالدين الحوثي المرئية والمكتوبة.",
      type: "website",
      path: window.location.pathname,
    });
  }, []);

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "leader"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LeaderContent[];
        setContent(items);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Leader listener error:", error);
        // Fallback fetch
        getDocs(q)
          .then((snap) => {
            setContent(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderContent)));
          })
          .catch((err) => console.error("Leader fallback error:", err))
          .finally(() => setLoading(false));
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtering Logic
  const filteredAndSortedContent = useMemo(() => {
    return content
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = item.title?.toLowerCase().includes(q);
          const descMatch = item.description?.toLowerCase().includes(q);
          const contentMatch = item.content?.toLowerCase().includes(q);
          return Boolean(titleMatch || descMatch || contentMatch);
        }

        return true;
      })
      .sort((a, b) => {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [content, searchQuery]);

  const handleToggleFavorite = (item: LeaderContent) => {
    try {
      const saved = localStorage.getItem("favorite_items");
      let favList = saved ? JSON.parse(saved) : [];

      if (favorites.includes(item.id)) {
        favList = favList.filter((f: any) => f.id !== item.id);
        setFavorites((prev) => prev.filter((id) => id !== item.id));
      } else {
        favList.push({
          id: item.id,
          type: "leader",
          title: item.title,
          imageUrl: item.thumbnailUrl || "",
          savedAt: Date.now(),
        });
        setFavorites((prev) => [...prev, item.id]);
      }
      localStorage.setItem("favorite_items", JSON.stringify(favList));
    } catch (e) {
      console.warn("Favorite error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-surface-main text-text-primary py-3 sm:py-5 px-3 sm:px-4 md:px-6 font-cairo transition-colors duration-300" dir="rtl">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Unified Search Bar */}
        <LeaderFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 3. Dynamic Content Rendering */}
        {loading ? (
          /* High-Fidelity Skeleton Loader matching platform style */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-32 sm:h-36 rounded-[18px] bg-white border border-slate-200/80 p-4 shadow-soft animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-28 bg-slate-200 rounded-md" />
                  <div className="h-5 w-20 bg-slate-200 rounded-md" />
                </div>
                <div className="space-y-2 my-auto">
                  <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                  <div className="h-3.5 w-1/2 bg-slate-100 rounded-md" />
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                  <div className="h-3.5 w-24 bg-slate-200 rounded" />
                  <div className="h-3.5 w-20 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedContent.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-14 px-6 bg-surface-card rounded-[20px] border border-dashed border-slate-300 shadow-soft text-slate-400 space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-taiz-sky">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-text-primary">
              لم يتم العثور على أي نتائج
            </h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              جرب تغيير عبارة البحث أو التبديل بين أقسام الخطابات المرئية والمحاضرات المكتوبة.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 px-4 py-1.5 rounded-full bg-taiz-royal text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                إعادة ضبط البحث
              </button>
            )}
          </motion.div>
        ) : (
          /* Cards List with spacing matching news cards */
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedContent.map((item, index) => {
                const isFavorited = favorites.includes(item.id);

                return (
                  <div key={item.id} className="w-full">
                    {item.type === "video" ? (
                      <LeaderVideoCard
                        item={item}
                        index={index}
                        isFavorited={isFavorited}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ) : (
                      <LeaderTextCard
                        item={item}
                        index={index}
                        isFavorited={isFavorited}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
export default Leader;
