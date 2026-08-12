import React, { useEffect, useState } from "react";
import { NewsItem } from "../types";
import { CategoryService } from "../services/CategoryService";

interface CategoryBadgesProps {
  item: NewsItem;
  isHero?: boolean;
  isSecondary?: boolean;
  className?: string;
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ item, isHero = false, isSecondary = false, className = "" }) => {
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = CategoryService.subscribeCategories((list) => {
      const catMap: Record<string, string> = {};
      list.forEach(c => {
        catMap[c.name] = c.color || "#3B82F6";
      });
      setCategories(catMap);
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
                ? (isHero ? "text-white px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] shadow-md" : "bg-white border border-gray-200 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] shadow-sm")
                : (isHero ? "bg-white/90 text-gray-700 px-2 py-0.5 rounded-md text-[8px] sm:text-[9px]" : "bg-gray-50/50 border border-gray-100 px-2 py-0.5 rounded-md text-[8px] opacity-90")
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
