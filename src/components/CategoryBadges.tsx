import React, { useEffect, useState } from "react";
import { CategoryService } from "../services/CategoryService";

interface CategoryBadgesProps {
  item?: { category?: string; categories?: string[] };
  category?: string;
  categories?: string[];
  isHero?: boolean;
  isSecondary?: boolean;
  className?: string;
  maxBadges?: number;
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ 
  item, 
  category, 
  categories: categoriesProp, 
  isHero = false, 
  isSecondary = false, 
  className = "",
  maxBadges = isSecondary ? 2 : 3
}) => {
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = CategoryService.subscribeCategories((list) => {
      const catMap: Record<string, string> = {};
      list.forEach(c => {
        catMap[c.name] = c.color || "#3B82F6";
      });
      setCategoriesMap(catMap);
    });

    return () => unsub();
  }, []);

  const rawCats = categoriesProp || item?.categories || (category ? [category] : (item?.category ? [item.category] : []));
  const uniqueCats = Array.from(new Set(rawCats.filter((c): c is string => !!c && c.trim().length > 0)));
  const cats = uniqueCats.slice(0, maxBadges);

  if (cats.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 z-20 ${className}`}>
      {cats.map((c) => {
        const color = categoriesMap[c] || CategoryService.getFallbackColor(c);
        
        if (isSecondary) {
          return (
            <span
              key={c}
              className="inline-flex items-center justify-center whitespace-nowrap font-bold font-cairo transition-all px-1.5 py-0.5 rounded-[4px] text-[7.5px] sm:text-[8px] tracking-tight select-none shadow-2xs border border-white/20 max-w-[100px] truncate leading-tight"
              style={{
                backgroundColor: color,
                color: "white",
                textShadow: "0 0.5px 1px rgba(0,0,0,0.35)"
              }}
              title={c}
            >
              {c}
            </span>
          );
        }

        if (isHero) {
          return (
            <span
              key={c}
              className="inline-flex items-center justify-center whitespace-nowrap font-bold font-cairo transition-all px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9.5px] tracking-tight select-none shadow-xs border border-white/25 max-w-[140px] truncate leading-tight"
              style={{
                backgroundColor: color,
                color: "white",
                textShadow: "0 0.5px 1.5px rgba(0,0,0,0.4)"
              }}
              title={c}
            >
              {c}
            </span>
          );
        }

        // Tinted styling for normal non-overlay badges
        const tintBackground = `${color}15`; // 8% - 10% opacity
        const tintBorder = `${color}30`; // 18% opacity for subtle border

        return (
          <span 
            key={c}
            className="inline-flex items-center justify-center whitespace-nowrap font-bold font-cairo transition-all px-1.5 py-0.5 rounded-[4px] text-[8px] sm:text-[8.5px] border select-none max-w-[120px] truncate leading-tight"
            style={{ 
              backgroundColor: tintBackground,
              color: color,
              borderColor: tintBorder,
            }}
            title={c}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

