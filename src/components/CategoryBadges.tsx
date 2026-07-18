import React, { useEffect, useState } from "react";
import { NewsItem } from "../types";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface CategoryBadgesProps {
  item: NewsItem;
  isHero?: boolean;
  isSecondary?: boolean;
  className?: string;
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ item, isHero = false, isSecondary = false, className = "" }) => {
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "newsMetadata", "categories"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const catMap: Record<string, string> = {};
        (data.items || data.list || []).forEach((c: any) => {
          if (typeof c === 'string') {
            catMap[c] = "#34619B";
          } else if (c.name) {
            catMap[c.name] = c.color || "#34619B";
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
        const color = categories[c] || "#34619B";
        const isPrimary = i === 0;
        
        if (isSecondary) {
          return (
            <span
              key={c}
              className="whitespace-nowrap font-black transition-all px-1.5 py-[1px] rounded-t-[4px] rounded-b-none text-[7px] sm:text-[7.5px] shadow-sm tracking-wide"
              style={{
                backgroundColor: color,
                color: "white",
                textShadow: "0 1px 1px rgba(0,0,0,0.4)"
              }}
            >
              {c}
            </span>
          );
        }

        return (
          <span 
            key={c}
            className={`whitespace-nowrap font-black transition-all ${
              isPrimary 
                ? (isHero ? "text-white px-4 py-1.5 rounded-xl text-[11px] shadow-md" : "bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] shadow-sm")
                : (isHero ? "bg-white/90 text-gray-700 px-2.5 py-1 rounded-lg text-[9px]" : "bg-gray-50/50 border border-gray-100 px-2 py-0.5 rounded-lg text-[8px] opacity-90")
            }`}
            style={{ 
              backgroundColor: isPrimary && isHero ? color : undefined,
              color: isPrimary ? (isHero ? "white" : color) : (isHero ? undefined : color),
              borderColor: isPrimary && !isHero ? "#e5e7eb" : isHero ? "transparent" : `${color}26`
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};
