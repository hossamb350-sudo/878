import React from "react";
import { motion } from "framer-motion";

interface PrayerBackgroundEffectProps {
  prayerName: string;
  className?: string;
}

export const PrayerBackgroundEffect: React.FC<PrayerBackgroundEffectProps> = ({
  prayerName,
  className = "",
}) => {
  let key = "Fajr";
  if (prayerName.includes("فجر") || prayerName.toLowerCase().includes("fajr")) {
    key = "Fajr";
  } else if (prayerName.includes("شروق") || prayerName.toLowerCase().includes("sunrise")) {
    key = "Sunrise";
  } else if (prayerName.includes("ظهر") || prayerName.toLowerCase().includes("dhuhr")) {
    key = "Dhuhr";
  } else if (prayerName.includes("عصر") || prayerName.toLowerCase().includes("asr")) {
    key = "Asr";
  } else if (prayerName.includes("مغرب") || prayerName.toLowerCase().includes("maghrib")) {
    key = "Maghrib";
  } else if (prayerName.includes("عشاء") || prayerName.toLowerCase().includes("isha")) {
    key = "Isha";
  }

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[inherit] w-full h-full select-none ${className}`}>
      {/* 1. FAJR (الفجر) - Quiet Dawn Twilight with Horizon Cyan-Rose Glow & Gentle Stars */}
      {key === "Fajr" && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B]">
          {/* Cyan-Rose Horizon Dawn Mist */}
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-cyan-400/25 via-pink-400/15 to-transparent blur-md" />
          {/* Twinkling Morning Stars */}
          <motion.div 
            className="absolute top-2 right-4 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_8px_rgba(165,243,252,0.9)]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-5 left-6 w-1 h-1 bg-white/80 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
          />
        </div>
      )}

      {/* 2. SUNRISE (الشروق) - Golden Morning Horizon & Rising Sun Rays */}
      {key === "Sunrise" && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1E1B4B] via-[#431407] to-[#78350F]">
          {/* Golden Amber Horizon Flare */}
          <div className="absolute bottom-0 inset-x-0 h-3/4 bg-gradient-to-t from-amber-500/35 via-orange-500/20 to-transparent blur-lg" />
          {/* Rising Sun Disk at Horizon */}
          <motion.div 
            className="absolute -bottom-2 right-5 w-11 h-11 bg-gradient-to-t from-amber-300 via-amber-200 to-yellow-100 rounded-full blur-[1px] shadow-[0_0_28px_rgba(251,191,36,0.95)]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* 3. DHUHR (الظهر) - Bright Crisp Noon Sky & Overhead Solar Flare */}
      {key === "Dhuhr" && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#075985]">
          {/* Overhead Solar Radiance Aura */}
          <motion.div 
            className="absolute -top-6 -right-6 w-28 h-28 bg-amber-200/40 rounded-full blur-xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute top-1.5 right-3 w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-300 rounded-full blur-[1px] shadow-[0_0_22px_rgba(253,224,71,0.85)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/15 via-transparent to-black/20" />
        </div>
      )}

      {/* 4. ASR (العصر) - Slanted Warm Golden Afternoon Light */}
      {key === "Asr" && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0369A1] via-[#1E3A8A] to-[#B45309]">
          {/* Slanted Golden Sunlight Gradient */}
          <div className="absolute top-0 right-0 w-4/5 h-full bg-gradient-to-bl from-amber-500/30 via-amber-600/15 to-transparent blur-md" />
          <motion.div 
            className="absolute top-3 right-4 w-7 h-7 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full blur-[1px] shadow-[0_0_18px_rgba(245,158,11,0.9)]"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* 5. MAGHRIB (المغرب) - Rich Crimson & Sunset Orange Twilight */}
      {key === "Maghrib" && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#2E1065] via-[#701A75] to-[#C2410C]">
          {/* Deep Crimson Sunset Horizon Glow */}
          <div className="absolute bottom-0 inset-x-0 h-3/4 bg-gradient-to-t from-orange-500/40 via-rose-600/25 to-transparent blur-md" />
          <motion.div 
            className="absolute -bottom-1 left-6 w-10 h-10 bg-amber-400/80 rounded-full blur-[2px] shadow-[0_0_24px_rgba(251,146,60,0.9)]"
            animate={{ opacity: [0.7, 0.95, 0.7] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* 6. ISHA (العشاء) - Serene Deep Night Sky & Silver Crescent Moon Glow */}
      {key === "Isha" && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#090D16] via-[#0F172A] to-[#1E1B4B]">
          {/* Soft indigo ambient glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/15 rounded-full blur-xl" />
          {/* Silver Crescent Moon Glow */}
          <div className="absolute top-2.5 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-200 shadow-[0_0_12px_rgba(241,245,249,0.9)] border border-white/80" />
          {/* Twinkling Stars */}
          <motion.div 
            className="absolute top-3 left-4 w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.9)]"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-4 right-8 w-1 h-1 bg-indigo-200 rounded-full shadow-[0_0_4px_rgba(199,210,254,0.8)]"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      )}
    </div>
  );
};

export default PrayerBackgroundEffect;
