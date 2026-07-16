import React from "react";
import { Calendar as CalendarIcon, ChevronLeft } from "lucide-react";
import { motion } from "motion/react";

interface ModernEventCardProps {
  activity: any;
  onClick: () => void;
  statusOverride?: string;
  key?: any;
}

export function ModernEventCard({ activity, onClick, statusOverride }: ModernEventCardProps) {
  const categoryBadge = activity.type || "فعالية";
  const eventTitle = activity.title || activity.type || "فعالية بدون عنوان";

  // Default high-quality placeholder image with an Islamic/historical theme
  const defaultImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

  // Determine status (upcoming/ongoing/completed)
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

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      className="bg-white border-b border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-right flex flex-col w-full overflow-hidden select-none relative animate-in fade-in zoom-in-95 duration-200"
      style={{ direction: "rtl", borderRadius: 0 }}
    >
      {/* 1. Cover image with dark gradient, top right category badge and top left status badge */}
      {/* Matches exactly the News card size/aspect-ratio: aspect-[4/3] sm:aspect-[16/10] */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden shrink-0 bg-gray-50">
        <img
          src={activity.imageUrl || defaultImage}
          alt={eventTitle}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        {/* Dark Gradient Overlay for high text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#0b3a24]/95 via-[#0b3a24]/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

        {/* Top-Right: Category/Classification Badge */}
        {categoryBadge && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black shadow-md flex items-center gap-1 shrink-0 z-10">
            <span>{categoryBadge}</span>
            <ChevronLeft className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Top-Left: Status/Action Badge (e.g. "قادمة") */}
        <div className="absolute top-4 left-4 bg-[#0a8f5c] text-white px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black shadow-md z-10">
          {getStatusLabel()}
        </div>

        {/* Centered Event Title at the bottom of the cover */}
        <h3 
          className="absolute bottom-4 right-4 left-4 text-right text-white text-[16px] sm:text-[20px] md:text-[24px] font-bold leading-[1.5] drop-shadow-md z-10 line-clamp-3"
          style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
        >
          {eventTitle}
        </h3>
      </div>

      {/* Underneath Content Section with Padding */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* 2. Information columns (RTL: Right = Day, Middle = Hijri, Left = Gregorian) with minimized typography */}
        <div className="grid grid-cols-3 gap-1 py-3 border-b border-gray-100 mt-0.5 mb-3 text-center">
          {/* Column 1 (Right): Day */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#0a8f5c]/5 border border-[#0a8f5c]/10 flex items-center justify-center text-[#0a8f5c] mb-1">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] md:text-[10px] font-bold text-[#0a8f5c] mb-0.5">اليوم</span>
            <span className="text-[11px] font-black text-gray-800 leading-tight">
              {activity.dayName || "—"}
            </span>
          </div>

          {/* Column 2 (Middle): Hijri Date */}
          <div className="flex flex-col items-center justify-center border-r border-l border-gray-100 px-1">
            <div className="w-8 h-8 rounded-full bg-[#b89047]/8 border border-[#b89047]/15 flex items-center justify-center text-[#b89047] mb-1">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] md:text-[10px] font-bold text-[#b89047] mb-0.5">التاريخ الهجري</span>
            <span className="text-[11px] font-black text-gray-800 leading-tight">
              {activity.hijriDate || "—"}
            </span>
          </div>

          {/* Column 3 (Left): Gregorian Date */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#0a8f5c]/5 border border-[#0a8f5c]/10 flex items-center justify-center text-[#0a8f5c] mb-1">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] md:text-[10px] font-bold text-[#0a8f5c] mb-0.5">التاريخ الميلادي</span>
            <span className="text-[11px] font-black text-gray-800 leading-tight">
              {activity.gregorianDate || "—"}
            </span>
          </div>
        </div>

        {/* 4. Footer with Details Button and Subtle Dot Grid Pattern on Right */}
        <div className="flex justify-between items-end mt-2 pt-2 relative z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="border border-[#b89047] text-[#0b3a24] hover:bg-[#b89047]/5 transition-all duration-200 text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 cursor-pointer select-none shadow-sm"
          >
            <span>التفاصيل</span>
            <span className="text-sm font-sans">←</span>
          </button>

          {/* Subtle decorative dot pattern in the bottom-right corner */}
          <div className="absolute -bottom-6 -right-6 w-20 h-20 pointer-events-none opacity-[0.03] text-gray-900 select-none">
            <svg width="80" height="80" fill="currentColor">
              <pattern id="dotPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" />
              </pattern>
              <rect width="80" height="80" fill="url(#dotPattern)" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
