import React from "react";
import { Calendar, Clock, MapPin, ChevronLeft, Tag } from "lucide-react";
import { motion } from "motion/react";

interface ModernEventCardProps {
  activity: any;
  onClick: () => void;
  statusOverride?: string;
  key?: any;
}

export function ModernEventCard({ activity, onClick, statusOverride }: ModernEventCardProps) {
  const categoryBadge = activity.category || activity.type || "فعالية";
  const eventTitle = activity.title || activity.type || "فعالية بدون عنوان";
  const description = activity.description || activity.summary || "";
  const location = activity.location || activity.venue || activity.place || "";

  const defaultImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

  const getStatusLabel = () => {
    if (statusOverride) return statusOverride;
    if (activity.status) return activity.status;
    
    if (activity.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const actDate = new Date(activity.startDate);
      actDate.setHours(0, 0, 0, 0);
      
      if (actDate.getTime() === today.getTime()) {
        return "حالية";
      } else if (actDate.getTime() > today.getTime()) {
        return "قادمة";
      } else {
        return "سابقة";
      }
    }
    return "قادمة";
  };

  const status = getStatusLabel();

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      className="group bg-white dark:bg-[#0A1324] rounded-3xl border border-slate-200/80 dark:border-[#1E355B] shadow-xs hover:shadow-lg hover:border-[#015028]/50 dark:hover:border-emerald-500/40 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row w-full font-ibm relative"
      dir="rtl"
    >
      {/* Visual Image Banner */}
      <div className="relative w-full sm:w-48 aspect-[16/9] sm:aspect-auto overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
        <img
          src={activity.imageUrl || defaultImage}
          alt={eventTitle}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-md flex items-center gap-1.5 backdrop-blur-md border ${
            status === 'حالية' 
              ? 'bg-[#015028]/90 text-white border-emerald-400/50 ring-2 ring-emerald-500/30 animate-pulse' 
              : status === 'قادمة' 
                ? 'bg-blue-600/90 text-white border-blue-400/50' 
                : 'bg-slate-700/85 text-slate-200 border-slate-500/50'
          }`}>
            {status === 'حالية' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>}
            <span>{status}</span>
          </span>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 text-right gap-3">
        <div>
          {/* Header Row: Category Badge & Location */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-[#FEF9E6] dark:bg-amber-950/40 text-[#8C6200] dark:text-amber-300 border border-[#E5A921]/40 dark:border-amber-700/50 px-2.5 py-0.5 rounded-lg text-[10px] font-black font-cairo">
              <Tag className="w-3 h-3 text-[#E5A921]" />
              {categoryBadge}
            </span>

            {location && (
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate max-w-[140px]">{location}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-slate-900 dark:text-white text-base sm:text-lg font-black leading-snug group-hover:text-[#015028] dark:group-hover:text-emerald-400 transition-colors font-cairo line-clamp-2">
            {eventTitle}
          </h3>

          {/* Description Preview */}
          {description && (
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium line-clamp-2 mt-1.5">
              {description}
            </p>
          )}
        </div>

        {/* Footer: Dates & Chevron Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#14274B] flex items-center justify-between gap-2 mt-1">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
            {activity.hijriDate && (
              <div className="flex items-center gap-1 text-[11px] font-bold bg-slate-50 dark:bg-[#070F1E] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-[#1E355B]">
                <Calendar className="w-3.5 h-3.5 text-[#015028] dark:text-emerald-400" />
                <span className="text-slate-800 dark:text-slate-200 font-extrabold">{activity.hijriDate}</span>
              </div>
            )}
            {activity.gregorianDate && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{activity.gregorianDate}</span>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#070F1E] text-slate-600 dark:text-slate-300 group-hover:bg-[#015028] dark:group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 shadow-xs border border-transparent dark:border-[#1E355B]">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

