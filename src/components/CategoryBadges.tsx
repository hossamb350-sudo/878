import React, { useEffect, useState } from "react";
import { NewsItem } from "../types";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface CategoryBadgesProps {
  item: NewsItem;
  isHero?: boolean;
  className?: string;
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ item, isHero = false, className = "" }) => {
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catDoc = await getDoc(doc(db, "newsMetadata", "categories"));
        if (catDoc.exists()) {
          const data = catDoc.data();
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
      } catch (e) {
        console.warn("Error fetching categories for badges", e);
      }
    };
    fetchCats();
  }, []);

  const cats = (item.categories || [item.category]).filter(c => !!c);
  if (cats.length === 0) return null;

  const primary = cats[0] || "محلية";
  const extras = cats.slice(1);

  return (
    <div className={`flex items-center justify-center gap-1.5 z-20 w-max ${className}`}>
      {/* Left side extras (even indices) */}
      {extras.filter((_, i) => i % 2 === 0).reverse().map(c => (
        <span 
          key={c}
          className={`whitespace-nowrap px-2 py-0.5 rounded-lg text-[8px] font-black shadow-sm border border-border-light ${
            isHero ? "bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-300" : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
          }`}
        >
          {c}
        </span>
      ))}

      {/* Primary (Middle) */}
      <span 
        className={`whitespace-nowrap font-black shadow-md ${
          isHero ? "text-white px-4 py-1.5 rounded-xl text-[11px]" : "bg-white dark:bg-gray-800 border px-3 py-0.5 rounded-full text-[9px]"
        }`}
        style={{ 
          backgroundColor: isHero ? (categories[primary] || "#049EDF") : "transparent",
          color: isHero ? "white" : (categories[primary] || "#049EDF"),
          borderColor: isHero ? "transparent" : `${categories[primary] || "#049EDF"}4D`
        }}
      >
        {primary}
      </span>

      {/* Right side extras (odd indices) */}
      {extras.filter((_, i) => i % 2 !== 0).map(c => (
        <span 
          key={c}
          className={`whitespace-nowrap px-2 py-0.5 rounded-lg text-[8px] font-black shadow-sm border border-border-light ${
            isHero ? "bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-300" : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
          }`}
        >
          {c}
        </span>
      ))}
    </div>
  );
};
