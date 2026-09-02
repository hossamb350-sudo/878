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
        className="group relative w-full rounded-[14px] sm:rounded-[18px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:shadow-[0_4px_18px_rgba(239,68,68,0.12)] hover:-translate-y-0.5 active:scale-[0.98] shadow-soft p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-4 transition-all duration-300 block"
      >
        {/* Transparent Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-red-500/[0.09] via-red-500/[0.03] to-red-500/[0.01] pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/[0.06] via-transparent to-transparent pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20" />

        {/* RIGHT SIDE: Uploaded Image */}
        <div className="w-24 h-24 sm:w-32 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 relative">
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
                className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border transition-all ${
                  isFavorited
                    ? "bg-taiz-sky text-white border-taiz-sky"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                title="حفظ في المفضلة"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={handleShare}
                className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all"
                title="مشاركة"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MIDDLE: Title */}
          <div className="relative z-10 my-0.5">
            <h2 className="text-slate-900 dark:text-gray-100 text-xs sm:text-sm font-bold leading-snug group-hover:text-red-600 dark:group-hover:text-taiz-sky transition-colors font-cairo line-clamp-2">
              {item.title}
            </h2>
          </div>

          {/* BOTTOM METADATA & READ BUTTON ROW */}
          <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-800 mt-1 text-[10px] sm:text-[11px]">
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
            <div className="flex items-center gap-1 text-taiz-royal dark:text-taiz-sky font-bold text-[11px] sm:text-xs font-cairo group-hover:translate-x-[-2px] transition-transform">
              <span>قراءة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
