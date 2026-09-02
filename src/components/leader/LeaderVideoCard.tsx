import React from "react";
import { LeaderContent } from "../../types";
import { Link } from "react-router-dom";
import { routes, generateSlug } from "../../utils/routes";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Play, Calendar, Eye } from "lucide-react";
import { motion } from "motion/react";

interface LeaderVideoCardProps {
  item: LeaderContent;
  index: number;
  isFavorited?: boolean;
  onToggleFavorite?: (item: LeaderContent) => void;
}

export const LeaderVideoCard: React.FC<LeaderVideoCardProps> = ({
  item,
  index,
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

  // Helper duration estimation
  const defaultDurations = ["18:42", "24:15", "15:30", "32:10", "19:45", "27:08"];
  const duration = defaultDurations[index % defaultDurations.length];

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
        className="group relative w-full rounded-[16px] sm:rounded-[20px] overflow-hidden bg-surface-card border border-border-light hover:border-taiz-sky/50 shadow-soft hover:shadow-medium flex flex-col md:flex-row items-stretch transition-all duration-300 block"
      >
        {/* THUMBNAIL ZONE */}
        <div className="relative w-full md:w-[42%] shrink-0 aspect-video md:aspect-auto min-h-[175px] sm:min-h-[200px] overflow-hidden bg-slate-900 border-b md:border-b-0 md:border-l border-border-light flex items-center justify-center">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-taiz-navy to-taiz-royal flex items-center justify-center p-4">
              <img
                src="/splash_first.png"
                alt="السيد القائد"
                className="w-full h-full object-contain opacity-85 group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Vignette & Contrast Gradients matching Home Video Slider */}
          <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy/90 via-taiz-navy/40 to-transparent pointer-events-none" />

          {/* Duration Badge on Thumbnail */}
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 shadow-sm">
              {duration}
            </span>
          </div>

          {/* Centered Play Circle Icon matching platform */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/70 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-white/45 transition-all duration-300">
              <Play className="w-5 h-5 fill-white ml-0.5 drop-shadow-sm" />
            </div>
          </div>
        </div>

        {/* CONTENT & METADATA ZONE */}
        <div className="relative flex-1 p-3.5 sm:p-4.5 flex flex-col justify-between overflow-hidden z-10">
          {/* Header Row: Hijri date */}
          {hDate && (
            <div className="flex items-center justify-end text-text-muted text-[11px] mb-1">
              <span className="text-slate-500 font-medium text-[10.5px] sm:text-[11px]">{hDate}</span>
            </div>
          )}

          {/* Title */}
          <div className="my-auto py-1">
            <h2 className="text-text-primary text-xs sm:text-sm md:text-base font-bold leading-snug sm:leading-relaxed group-hover:text-taiz-sky transition-colors font-cairo line-clamp-2">
              {item.title}
            </h2>
            {item.description && (
              <p className="text-text-muted text-[11px] sm:text-xs mt-1.5 line-clamp-2 font-cairo leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* Footer Metadata Row */}
          <div className="flex items-center justify-between text-text-muted text-[10px] sm:text-[11px] font-medium pt-2.5 border-t border-border-light mt-2">
            {/* Gregorian Date */}
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{mDate}</span>
            </span>

            {/* Views Count */}
            <span className="flex items-center gap-1 text-slate-500">
              <Eye className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>{(item.views || 0).toLocaleString("ar-EG")} مشاهدة</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
