import React, { useEffect, useState } from "react";
import { CategoryService } from "../services/CategoryService";

interface CategoryBadgesProps {
  item?: { category?: string; categories?: string[] };
  category?: string;
  categories?: string[];
  isHero?: boolean;
  isSecondary?: boolean;
  className?: string;
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ 
  item, 
  category, 
  categories: categoriesProp, 
  isHero = false, 
  isSecondary = false, 
  className = "" 
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
  const cats = Array.from(new Set(rawCats.filter((c): c is string => !!c && c.trim().length > 0)));

  if (cats.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 z-20 ${className}`}>
      {cats.map((c, i) => {
        const color = categoriesMap[c] || CategoryService.getFallbackColor(c);
        const isPrimary = i === 0;
        
        if (isSecondary) {
          return (
            <span
              key={c}
              className="whitespace-nowrap font-bold font-cairo transition-all px-1.5 py-0.5 rounded-[4px] text-[7.5px] sm:text-[8px] tracking-wide select-none shadow-xs"
              style={{
                backgroundColor: color,
                color: "white",
                textShadow: "0 0.5px 1px rgba(0,0,0,0.3)"
              }}
            >
              {c}
            </span>
          );
        }

        // Tinted styling for normal non-overlay badges (bbc/al-jazeera style)
        const isDarkTheme = document.documentElement.classList.contains("dark");
        const tintBackground = `${color}15`; // 8% - 10% opacity
        const tintBorder = `${color}30`; // 18% opacity for subtle border

        return (
          <span 
            key={c}
            className={`whitespace-nowrap font-black font-cairo transition-all px-2 py-[2.5px] rounded-[5px] text-[8px] sm:text-[9px] border select-none`}
            style={{ 
              backgroundColor: isHero ? color : tintBackground,
              color: isHero ? "white" : color,
              borderColor: isHero ? "transparent" : tintBorder,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};
