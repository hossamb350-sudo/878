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

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-3xl border border-border-light shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row w-full font-ibm"
      dir="rtl"
    >
      <div className="relative w-full sm:w-40 aspect-video sm:aspect-square overflow-hidden shrink-0 bg-slate-50">
        <img
          src={activity.imageUrl || defaultImage}
          alt={eventTitle}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2">
           <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black shadow-lg text-white ${
             getStatusLabel() === 'حالية' ? 'bg-red-600 animate-pulse' : 
             getStatusLabel() === 'قادمة' ? 'bg-blue-600' : 'bg-slate-500'
           }`}>
             {getStatusLabel()}
           </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 text-right">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            <span className="text-red-600 text-[10px] font-black uppercase tracking-wider">{categoryBadge}</span>
          </div>
          <h3 className="text-slate-900 text-sm sm:text-base font-black leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {eventTitle}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
           <div className="flex gap-4">
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400">التاريخ الهجري</span>
                <span className="text-[10px] font-black text-slate-700">{activity.hijriDate || "—"}</span>
             </div>
             <div className="flex flex-col border-r border-slate-100 pr-4">
                <span className="text-[9px] font-bold text-slate-400">التاريخ الميلادي</span>
                <span className="text-[10px] font-black text-slate-700">{activity.gregorianDate || "—"}</span>
             </div>
           </div>
           
           <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all">
             <ChevronLeft className="w-4 h-4" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
