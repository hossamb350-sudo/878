import { useEffect, useState, useMemo } from "react";
import { SyncService } from "../services/SyncService";
import { LeaderContent } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search, Play, Calendar, Eye, FileText, Video as VideoIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

// Islamic Geometric Background Overlay Pattern
const IslamicPatternOverlay = () => (
  <svg 
    className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none mix-blend-overlay" 
    xmlns="http://www.w3.org/2000/svg" 
    width="80" 
    height="80" 
    viewBox="0 0 80 80"
  >
    <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#F1C40F" strokeWidth="1" />
    <circle cx="40" cy="40" r="16" fill="none" stroke="#F1C40F" strokeWidth="0.8" />
    <path d="M40 12 L68 40 L40 68 L12 40 Z" fill="none" stroke="#F1C40F" strokeWidth="0.6" />
    <rect x="28" y="28" width="24" height="24" fill="none" stroke="#F1C40F" strokeWidth="0.5" transform="rotate(45 40 40)" />
  </svg>
);

// Golden Corner Frame Accents for Cards
const GoldenCornerFrame = () => (
  <>
    <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#D4AF37]/70 rounded-tr-sm pointer-events-none z-10" />
    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#D4AF37]/70 rounded-tl-sm pointer-events-none z-10" />
    <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#D4AF37]/70 rounded-br-sm pointer-events-none z-10" />
    <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#D4AF37]/70 rounded-bl-sm pointer-events-none z-10" />
  </>
);

export function Leader() {
  const [content, setContent] = useState<LeaderContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "video" | "text">("all");

  useEffect(() => {
    let active = true;
    const unsubPromise = SyncService.syncCollection<LeaderContent>("leader", (leaderData) => {
      if (!active) return;
      const sorted = [...leaderData];
      sorted.sort((a, b) => {
        const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
        const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.createdAt - a.createdAt;
      });
      setContent(sorted);
      setLoading(false);
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 50 });

    return () => {
      active = false;
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === "all" || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [content, searchQuery, selectedType]);

  // Helper to format date cleanly
  const formatDateString = (timestamp: number) => {
    try {
      return format(new Date(timestamp), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "12 يوليو 2026";
    }
  };

  // Helper to get fallback duration for video items
  const getItemDuration = (item: LeaderContent, index: number) => {
    const defaultDurations = ["18:42", "16:31", "17:08", "19:15", "14:20", "22:05"];
    return defaultDurations[index % defaultDurations.length];
  };

  return (
    <div className="min-h-screen bg-white font-cairo py-4 px-2 sm:px-3 pb-12" dir="rtl">
      <div className="max-w-[760px] mx-auto w-full space-y-4">
        
        {/* Top Header Card Container with Search and Segmented Filter Control */}
        <div className="bg-surface-card rounded-[24px] sm:rounded-[28px] p-3 sm:p-4 shadow-soft border border-border-subtle space-y-3">
          
          {/* 1. Search Bar */}
          <div className="relative w-full h-[52px] sm:h-[56px] rounded-[24px] sm:rounded-[28px] bg-[#F8FAFC] border border-slate-200/80 flex items-center px-[16px] sm:px-[18px] transition-all focus-within:border-[#07152B]/50 focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(7,21,43,0.08)] group">
            <input 
              type="text" 
              placeholder="ابحث بموضوع العنوان، المحاضرة أو الوصف..."
              className="w-full bg-transparent border-0 focus:outline-none text-[#1E293B] placeholder:text-[#8E9B90] text-xs sm:text-sm font-medium pr-1 pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-500 group-focus-within:bg-[#07152B] group-focus-within:text-white transition-all">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* 2. Capsule Segmented Filter Control */}
          <div className="relative w-full h-[44px] sm:h-[48px] rounded-full bg-[#E2E8F0]/60 p-1 flex items-center justify-between gap-1 overflow-hidden">
            {[
              { id: "all", label: "الكل" },
              { id: "video", label: "فيديو" },
              { id: "text", label: "محاضرات ودروس" }
            ].map(tab => {
              const isActive = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id as any)}
                  className={`relative flex-1 h-full rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer z-10 flex items-center justify-center ${
                    isActive ? "text-white" : "text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-full bg-[#07152B] shadow-[0_2px_8px_rgba(7,21,43,0.25)] border border-[#D4AF37]/40"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#07152B] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500">جاري تحميل مواد السيد القائد...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-16 px-6 bg-surface-card rounded-[24px] border border-dashed border-slate-300/80 shadow-xs text-slate-400">
            <p className="text-sm font-bold text-slate-600">لا يوجد محتوى يطابق خيارات البحث والتصفية المحددة.</p>
          </div>
        ) : (
          /* Vertical Scrolling Cards List */
          <div className="flex flex-col gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredContent.map((item, index) => {
                const isVideo = item.type === "video";
                const itemDuration = getItemDuration(item, index);
                const dateStr = formatDateString(item.createdAt);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: index * 0.02, ease: "easeOut" }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full"
                  >
                    <Link
                      to={`/leader/${item.id}`}
                      className="group relative w-full min-h-[210px] sm:min-h-[225px] rounded-[24px] overflow-hidden bg-gradient-to-l from-[#07152B] via-[#0B2545] to-[#0A3323] border border-[#D4AF37]/35 shadow-[0_10px_25px_rgba(7,21,43,0.15)] flex items-stretch transition-all duration-300 block"
                    >
                      {/* Decorative Frame Elements */}
                      <GoldenCornerFrame />
                      <IslamicPatternOverlay />

                      {/* Side Accent Line & Rosette Medallion on Far Right Edge */}
                      <div className="absolute right-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#D4AF37]/40 via-[#D4AF37] to-[#D4AF37]/40 z-20 pointer-events-none" />
                      
                      {/* Ornate Gold Rosette Seal attached to right edge */}
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-[#07152B] border-2 border-[#D4AF37] rounded-full flex items-center justify-center text-[#D4AF37] shadow-lg z-30 pointer-events-none group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-current mr-0.5" />
                      </div>

                      {/* LEFT ZONE: Video Thumbnail Artwork (~42% width) */}
                      <div className="relative w-[42%] shrink-0 overflow-hidden bg-slate-900 border-l border-[#D4AF37]/25 flex flex-col justify-center">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#07152B] to-[#0A3323] flex items-center justify-center p-3">
                            <img 
                              src="/splash_first.png" 
                              alt="السيد القائد" 
                              className="w-full h-full object-contain opacity-90 group-hover:scale-105 transition-transform duration-700"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Top Gradient for Badge contrast */}
                        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
                        
                        {/* Bottom Gradient Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                        {/* Video Badge (Top-Right of Thumbnail) */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          {isVideo ? (
                            <span className="bg-[#E11D48] text-white text-[10px] font-black px-2 py-0.5 rounded-[8px] flex items-center gap-1 shadow-md">
                              <VideoIcon className="w-2.5 h-2.5 fill-current" />
                              <span>فيديو</span>
                            </span>
                          ) : (
                            <span className="bg-[#0284C7] text-white text-[10px] font-black px-2 py-0.5 rounded-[8px] flex items-center gap-1 shadow-md">
                              <FileText className="w-2.5 h-2.5" />
                              <span>محاضرة</span>
                            </span>
                          )}
                        </div>

                        {/* Duration Badge (Bottom-Right of Thumbnail) */}
                        <div className="absolute bottom-2.5 right-2.5 z-10">
                          <span className="bg-black/75 backdrop-blur-md text-white text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border border-white/15 shadow-sm">
                            {itemDuration}
                          </span>
                        </div>

                        {/* Glassmorphism Play Button (Bottom-Left of Thumbnail) */}
                        <motion.div 
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className="absolute bottom-2.5 left-2.5 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/40 shadow-lg flex items-center justify-center text-white group-hover:bg-white/35 transition-all"
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current mr-0.5" />
                        </motion.div>
                      </div>

                      {/* RIGHT ZONE: Title & Metadata (~58% width) */}
                      <div className="relative flex-1 p-3 sm:p-4.5 pr-4.5 sm:pr-6 flex flex-col justify-between overflow-hidden z-10">
                        
                        {/* Title Section: Centered vertically and horizontally in the middle of the card */}
                        <div className="my-auto py-2 flex items-center justify-center text-center">
                          <h2 className="text-white text-[13px] xs:text-xs sm:text-[14px] font-bold sm:font-black leading-snug sm:leading-relaxed group-hover:text-amber-200 transition-colors font-cairo text-center">
                            {item.title}
                          </h2>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex items-center justify-between text-[#CBD5E1] text-[10.5px] sm:text-xs font-medium pt-2 border-t border-white/10 mt-auto">
                          <div className="flex items-center gap-2.5 sm:gap-3 w-full justify-between">
                            {/* Date */}
                            <span className="flex items-center gap-1 text-slate-200 font-bold">
                              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                              <span>{dateStr}</span>
                            </span>

                            {/* Views */}
                            <span className="flex items-center gap-1 text-slate-200 font-bold">
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                              <span>{item.views ?? 0}</span>
                            </span>
                          </div>
                        </div>

                      </div>

                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}

