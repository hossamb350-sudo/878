import React from "react";
import { Search, X } from "lucide-react";

interface LeaderFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const LeaderFilterBar: React.FC<LeaderFilterBarProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="bg-surface-card rounded-[14px] sm:rounded-[18px] p-1.5 sm:p-2 shadow-soft border border-border-light mb-3 select-none" dir="rtl">
      {/* Search Bar with compact height */}
      <div className="relative w-full h-[38px] sm:h-[42px] rounded-lg sm:rounded-xl bg-slate-100/90 dark:bg-[#14274B]/90 border border-slate-200 dark:border-[#1E355B] flex items-center px-2.5 sm:px-3 transition-all focus-within:border-taiz-sky focus-within:bg-white dark:focus-within:bg-[#0D1A33] focus-within:ring-2 focus-within:ring-taiz-sky/10 group">
        <input
          type="text"
          placeholder="ابحث بالعنوان، الكلمات المفتاحية، أو موضوع المحاضرة..."
          className="w-full bg-transparent border-0 focus:outline-none text-text-primary placeholder:text-text-muted text-xs sm:text-sm font-medium pr-1 pl-14 font-cairo"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute left-9 sm:left-10 p-1 rounded-full text-text-muted hover:text-text-primary transition-colors"
            title="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="absolute left-1.5 sm:left-2 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-white dark:bg-[#0D1A33] border border-slate-200 dark:border-[#1E355B] shadow-xs flex items-center justify-center text-slate-500 dark:text-slate-300 group-focus-within:bg-taiz-royal group-focus-within:text-white transition-all">
          <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      </div>
    </div>
  );
};
