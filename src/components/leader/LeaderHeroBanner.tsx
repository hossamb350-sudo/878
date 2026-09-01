import React from "react";
import { IslamicGeometricPattern, GoldenCornerFrame } from "./LeaderIslamicOrnaments";
import { Video, BookOpen, Layers, User } from "lucide-react";
import { motion } from "motion/react";

interface LeaderHeroBannerProps {
  totalCount: number;
  videoCount: number;
  textCount: number;
}

export const LeaderHeroBanner: React.FC<LeaderHeroBannerProps> = ({
  totalCount,
  videoCount,
  textCount
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative w-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-gradient-to-r from-taiz-navy via-taiz-royal to-taiz-sky border border-slate-200/20 shadow-lg p-4 sm:p-5 text-white select-none mb-3"
      dir="rtl"
    >
      {/* Background Geometric Pattern & Subtle Lighting */}
      <IslamicGeometricPattern opacity={0.08} className="text-white" />
      <GoldenCornerFrame size={18} />

      {/* Decorative Radial Ambient Glows matching platform palette */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-taiz-cyan/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-taiz-sky/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Right Section: Calligraphy & Title */}
        <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          {/* Platform Icon Badge */}
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-md shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-amber-300 text-[10px] sm:text-[11px] font-bold font-cairo shadow-xs">
                منصة تعز الإعلامية الرسمية
              </span>
              <span className="text-[10px] sm:text-[11px] text-white/80 font-medium">خطابات ومحاضرات</span>
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white mt-1 leading-tight font-cairo tracking-wide flex items-center gap-2">
              <span>السيد القائد</span>
              <span className="text-amber-200/90 font-serif text-xs sm:text-sm font-normal">
                (عبدالملك بدرالدين الحوثي)
              </span>
            </h1>

            <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 font-medium line-clamp-1 font-cairo">
              مكتبة التوثيق الشاملة للخطابات والمحاضرات والدروس الهدائية والتوجيهية
            </p>
          </div>
        </div>

        {/* Left Section: Stats Capsule Counters */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
          {/* Total Badge */}
          <div className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xs">
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[9px] text-white/70">الإجمالي</span>
              <span className="text-xs sm:text-sm font-black font-mono text-white">{totalCount}</span>
            </div>
          </div>

          {/* Video Count */}
          <div className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/30 backdrop-blur-md border border-rose-400/30 text-white shadow-xs">
            <Video className="w-3.5 h-3.5 text-rose-300" />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[9px] text-rose-200">مرئيات</span>
              <span className="text-xs sm:text-sm font-black font-mono text-white">{videoCount}</span>
            </div>
          </div>

          {/* Text Count */}
          <div className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-xl bg-taiz-sky/40 backdrop-blur-md border border-taiz-soft/30 text-white shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-sky-300" />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[9px] text-sky-200">محاضرات</span>
              <span className="text-xs sm:text-sm font-black font-mono text-white">{textCount}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
