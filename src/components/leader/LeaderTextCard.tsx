import React from "react";
import { LeaderContent } from "../../types";
import { Link } from "react-router-dom";
import { routes, generateSlug } from "../../utils/routes";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { BookOpen, Calendar, Eye, ArrowLeft, Share2, Bookmark } from "lucide-react";
import { motion } from "motion/react";
import { shareContent } from "../../utils/share";

interface LeaderTextCardProps {
  item: LeaderContent;
  index: number;
  isFavorited?: boolean;
  onToggleFavorite?: (item: LeaderContent) => void;
}

export const LeaderTextCard: React.FC<LeaderTextCardProps> = ({
  item,
  index,
  isFavorited = false,
  onToggleFavorite,
}) => {
  const itemSlug = routes.leaderItem(generateSlug(item.title || "", item.id));

  // Clean date formatting
  const formatDateString = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      const mDate = format(d, "dd MMMM yyyy", { locale: ar });
      let hDate = "";
      try {
        const formatted = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }).format(d).trim();
        hDate = formatted.endsWith("هـ") ? formatted : `${formatted} هـ`;
      } catch (e) {
        hDate = "";
      }
      return { mDate, hDate };
    } catch {
      return { mDate: "12 يوليو 2026", hDate: "27 محرم 1448 هـ" };
    }
  };

  const { mDate, hDate } = formatDateString(item.createdAt);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await shareContent({
      title: item.title,
      type: "leader",
      id: item.id,
      imageUrl: item.thumbnailUrl
    });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(item);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
      className="w-full select-none"
      dir="rtl"
    >
      <Link
        to={itemSlug}
        className="group relative w-full rounded-[16px] sm:rounded-[20px] overflow-hidden bg-surface-card border border-border-light hover:border-taiz-sky/50 shadow-soft hover:shadow-medium p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-4 transition-all duration-300 block"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />

        {/* RIGHT SIDE: Uploaded Image */}
        <div className="w-24 h-24 sm:w-32 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#14274B] border border-slate-200/70 dark:border-[#1E355B] relative">
          <img
            src={item.thumbnailUrl || "/splash_first.png"}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* LEFT SIDE (in RTL): Content & Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          {/* TOP ROW: Badge & Quick Actions */}
          <div className="flex items-center justify-between gap-2 z-10 mb-1">
            <div className="flex items-center gap-2">
              {/* Category Tag */}
              <span className="bg-taiz-royal/10 dark:bg-taiz-sky/20 text-taiz-royal dark:text-sky-300 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-cairo">
                <BookOpen className="w-3 h-3 text-taiz-sky dark:text-sky-400" />
                <span>نص</span>
              </span>
              {hDate && (
                <span className="text-slate-500 dark:text-amber-400 text-[10px] sm:text-[11px] font-medium font-cairo">
                  {hDate}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleBookmark}
                className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-[#1E355B] transition-all ${
                  isFavorited
                    ? "bg-taiz-sky text-white"
                    : "bg-slate-50 dark:bg-[#14274B] text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C3666]"
                }`}
                title="حفظ في المفضلة"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={handleShare}
                className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-slate-50 dark:bg-[#14274B] hover:bg-slate-100 dark:hover:bg-[#1C3666] text-slate-500 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-[#1E355B] transition-all"
                title="مشاركة"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MIDDLE: Title */}
          <div className="relative z-10 my-0.5">
            <h2 className="text-text-primary text-xs sm:text-sm font-bold leading-snug group-hover:text-taiz-sky transition-colors font-cairo line-clamp-2">
              {item.title}
            </h2>
          </div>

          {/* BOTTOM METADATA & READ BUTTON ROW */}
          <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-border-light mt-1 text-text-muted text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-2.5 sm:gap-3 font-medium">
              {/* Gregorian Date */}
              <span className="flex items-center gap-1 text-slate-500 dark:text-amber-400">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-amber-400" />
                <span>{mDate}</span>
              </span>

              {/* Views */}
              <span className="flex items-center gap-1 text-slate-500 dark:text-[#F26522]">
                <Eye className="w-3 h-3 text-red-500 dark:text-[#F26522] animate-pulse" />
                <span>{(item.views || 0).toLocaleString("ar-EG")} مشاهدة</span>
              </span>
            </div>

            {/* Read CTA with Animated Arrow */}
            <div className="flex items-center gap-1 text-taiz-sky font-bold text-[11px] sm:text-xs font-cairo group-hover:translate-x-[-2px] transition-transform">
              <span>قراءة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
