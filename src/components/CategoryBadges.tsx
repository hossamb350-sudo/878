import React, { useEffect, useState } from "react";
import { NewsItem } from "../types";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface CategoryBadgesProps {
  item: NewsItem;
  isHero?: boolean;
  className?: string;
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ item, isHero = false, className = "" }) => {
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "newsMetadata", "categories"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const catMap: Record<string, string> = {};
        (data.items || data.list || []).forEach((c: any) => {
          if (typeof c === 'string') {
            catMap[c] = "#049EDF";
          } else if (c.name) {
            catMap[c.name] = c.color || "#049EDF";
          }
        });
        setCategories(catMap);
      }
    }, (e) => {
      console.warn("Error fetching categories for badges", e);
    });

    return () => unsub();
  }, []);

  const cats = Array.from(new Set((item.categories || (item.category ? [item.category] : [])).filter(c => !!c)));
  if (cats.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 z-20 ${className}`}>
      {cats.map((c, i) => {
        const color = categories[c] || "#049EDF";
        const isPrimary = i === 0;
        
        return (
          <span 
            key={c}
            className={`whitespace-nowrap font-black transition-all shadow-sm ${
              isPrimary 
                ? (isHero ? "text-white px-4 py-1.5 rounded-xl text-[11px] shadow-md" : "bg-white dark:bg-gray-800 border px-3 py-0.5 rounded-full text-[9px]")
                : (isHero ? "bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[9px]" : "bg-gray-50/50 dark:bg-gray-900/50 border px-2 py-0.5 rounded-lg text-[8px] opacity-90")
            }`}
            style={{ 
              backgroundColor: isPrimary && isHero ? color : undefined,
              color: isPrimary ? (isHero ? "white" : color) : (isHero ? undefined : color),
              borderColor: isHero ? "transparent" : `${color}${isPrimary ? '4D' : '26'}`
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};
