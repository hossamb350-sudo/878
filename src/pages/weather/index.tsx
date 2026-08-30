import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, Eye, Gauge, Wind, Droplets, Calendar, 
  ArrowUp, ArrowDown, RefreshCw, AlertCircle, Check, CloudRain,
  X, Clock, Sun, Sunrise, Sunset, Moon, Cloud, ShieldCheck, Thermometer, Compass, 
  CloudLightning, Info, ChevronLeft, Activity, ShieldAlert, BarChart3, Layers, Palette,
  TrendingUp, Sliders, Wind as WindIcon, HeartPulse, ChevronRight
} from "lucide-react";

import { fetchWeatherData } from "../../utils/weatherApi";
import { PrayerWeatherService } from "../../services/PrayerWeatherService";
import { WeatherConfig } from "../../types";

// --- TIME PERIOD OF DAY ENGINE ---
export type TimePeriod = "dawn" | "morning" | "noon" | "afternoon" | "sunset" | "evening" | "night";

export interface TimePeriodInfo {
  period: TimePeriod;
  labelAr: string;        // e.g. "الفجر", "الصباح", "الظهيرة", "العصر", "المغرب", "المساء", "الليل"
  descriptionAr: string; // e.g. "أجواء الفجر والسكينة"
  isNight: boolean;
}

export const getTimePeriod = (dtSec?: number, sunriseSec?: number, sunsetSec?: number): TimePeriodInfo => {
  const date = dtSec ? new Date(dtSec * 1000) : new Date();
  
  // Local Yemen Hour (UTC+3 / Asia/Aden)
  let hour = date.getHours();
  try {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Aden', hour: 'numeric', hour12: false };
    const hourStr = new Intl.DateTimeFormat('en-US', options).format(date);
    hour = parseInt(hourStr, 10) % 24;
  } catch {
    hour = date.getHours();
  }

  if (hour >= 4 && hour < 6) {
    return { period: "dawn", labelAr: "الفجر", descriptionAr: "أجواء الفجر والسكينة", isNight: true };
  } else if (hour >= 6 && hour < 11) {
    return { period: "morning", labelAr: "الصباح", descriptionAr: "إشراقة الصباح المشرقة", isNight: false };
  } else if (hour >= 11 && hour < 15) {
    return { period: "noon", labelAr: "الظهيرة", descriptionAr: "منتصف النهار والشمس الساطعة", isNight: false };
  } else if (hour >= 15 && hour < 18) {
    return { period: "afternoon", labelAr: "العصر", descriptionAr: "أجواء فترة العصر الذهبية", isNight: false };
  } else if (hour >= 18 && hour < 19.5) {
    return { period: "sunset", labelAr: "المغرب", descriptionAr: "وقت غروب الشمس وسحر الأفق", isNight: false };
  } else if (hour >= 19.5 && hour < 22) {
    return { period: "evening", labelAr: "المساء", descriptionAr: "بداية المساء وسكون الجو", isNight: true };
  } else {
    return { period: "night", labelAr: "الليل", descriptionAr: "سكون الليل وجمال النجوم", isNight: true };
  }
};

// Wind direction compass translation to Arabic
export const getWindDirectionArabic = (deg?: number): string => {
  if (deg === undefined || deg === null) return "شمالية شرقية";
  const directions = [
    "شمالية", "شمالية شرقية", "شرقية", "جنوبية شرقية",
    "جنوبية", "جنوبية غربية", "غربية", "شمالية غربية"
  ];
  const index = Math.round((deg % 360) / 45) % 8;
  return directions[index];
};

// Dew Point Calculation using Magnus Formula
export const calculateDewPoint = (tempC: number, humidityPercent: number): number => {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidityPercent / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint * 10) / 10;
};

// Air Quality Index Details
export const getAqiDetails = (aqiCode: number = 2) => {
  switch (aqiCode) {
    case 1:
      return {
        label: "ممتاز جداً",
        description: "جودة الهواء ممتازة ونقية، ملائمة لجميع الأنشطة الخارجية والتنزه.",
        bg: "bg-emerald-500",
        text: "text-emerald-700",
        border: "border-emerald-300",
        badgeBg: "bg-emerald-50 text-emerald-700",
        percent: 95
      };
    case 2:
      return {
        label: "مقبول وطبيعي",
        description: "جودة الهواء معتدلة، لا توجد مخاطر صحية تذكر على الشريحة العامة.",
        bg: "bg-emerald-400",
        text: "text-emerald-600",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-50 text-emerald-600",
        percent: 80
      };
    case 3:
      return {
        label: "متوسط (حساس)",
        description: "قد يشعر الأشخاص المصابون بالحساسية أو الأزمات التنفسية بإجهاد خفيف عند التمارين المجهدة.",
        bg: "bg-amber-500",
        text: "text-amber-700",
        border: "border-amber-300",
        badgeBg: "bg-amber-50 text-amber-700",
        percent: 60
      };
    case 4:
      return {
        label: "غير صحي",
        description: "ينصح بحد الأنشطة المجهدة في الهواء الطلق، خاصة لكبار السن والأطفال.",
        bg: "bg-orange-500",
        text: "text-orange-700",
        border: "border-orange-300",
        badgeBg: "bg-orange-50 text-orange-700",
        percent: 40
      };
    case 5:
      return {
        label: "خطير جداً",
        description: "تنبيه صحي: يفضل البقاء داخل الأماكن المغلقة واستخدام كمامات حماية عند الخروج.",
        bg: "bg-rose-600",
        text: "text-rose-700",
        border: "border-rose-300",
        badgeBg: "bg-rose-50 text-rose-700",
        percent: 20
      };
    default:
      return {
        label: "مقبول",
        description: "جودة الهواء في المعدل الطبيعي.",
        bg: "bg-emerald-500",
        text: "text-emerald-700",
        border: "border-emerald-300",
        badgeBg: "bg-emerald-50 text-emerald-700",
        percent: 80
      };
  }
};

// WMO Weather Code to Arabic description & category helper
export const parseWmoCode = (code: number, isNight: boolean = false) => {
  if (code === 0) {
    return {
      type: "clear",
      text: isNight ? "صافٍ ليلاً" : "مشمس صافٍ",
    };
  }
  if (code === 1 || code === 2) {
    return {
      type: "partly-cloudy",
      text: "غائم جزئياً",
    };
  }
  if (code === 3) {
    return {
      type: "mostly-cloudy",
      text: "غائم في الغالب",
    };
  }
  if (code === 4) {
    return {
      type: "overcast",
      text: "غائم كلياً",
    };
  }
  if (code === 45 || code === 48) {
    return {
      type: "fog",
      text: "ضباب / غبار الجبال",
    };
  }
  if (code === 51 || code === 53) {
    return {
      type: "light-rain",
      text: "زخات مطر خفيفة",
    };
  }
  if (code === 55 || code === 56 || code === 57) {
    return {
      type: "frost",
      text: "صقيع / رذاذ متجمد",
    };
  }
  if (code === 61) {
    return {
      type: "light-rain",
      text: "أمطار خفيفة",
    };
  }
  if (code === 63) {
    return {
      type: "rain",
      text: "أمطار متوسطة",
    };
  }
  if (code === 65 || code === 67) {
    return {
      type: "heavy-rain",
      text: "أمطار غزيرة",
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      type: "snow",
      text: "تساقط ثلوج",
    };
  }
  if (code === 80) {
    return {
      type: "light-rain",
      text: "زخات مطر خفيفة",
    };
  }
  if (code === 81) {
    return {
      type: "rain",
      text: "زخات مطر متوسطة",
    };
  }
  if (code === 82) {
    return {
      type: "heavy-rain",
      text: "زخات مطر غزيرة",
    };
  }
  if (code === 85 || code === 86) {
    return {
      type: "snow",
      text: "زخات ثلجية",
    };
  }
  if (code === 95) {
    return {
      type: "thunderstorm",
      text: "عاصفة رعدية",
    };
  }
  if (code === 96 || code === 99) {
    return {
      type: "hail",
      text: "عاصفة رعدية مع بَرَد",
    };
  }
  return {
    type: "partly-cloudy",
    text: "غائم جزئياً",
  };
};

export const getCategoryFromCode = (weatherCode: number, isNight: boolean) => {
  if (weatherCode <= 99) {
    return parseWmoCode(weatherCode, isNight).type;
  }
  if (weatherCode >= 200 && weatherCode < 300) {
    if (weatherCode === 230 || weatherCode === 231 || weatherCode === 232) return "hail";
    return "thunderstorm";
  }
  if (weatherCode >= 300 && weatherCode < 400) return "light-rain";
  if (weatherCode >= 500 && weatherCode < 600) {
    if (weatherCode === 500 || weatherCode === 520) return "light-rain";
    if (weatherCode === 501 || weatherCode === 521) return "rain";
    if (weatherCode >= 502) return "heavy-rain";
    return "rain";
  }
  if (weatherCode >= 600 && weatherCode < 700) return "snow";
  if (weatherCode === 701 || weatherCode === 721) return "mist";
  if (weatherCode === 731 || weatherCode === 761) return "dust";
  if (weatherCode === 741) return "fog";
  if (weatherCode === 751 || weatherCode === 781) return "sandstorm";
  if (weatherCode === 771) return "windy";
  if (weatherCode === 800) return "clear";
  if (weatherCode === 801 || weatherCode === 802) return "partly-cloudy";
  if (weatherCode === 803) return "mostly-cloudy";
  if (weatherCode === 804) return "overcast";
  return parseWmoCode(weatherCode, isNight).type;
};

// Dynamic Weather Theme palette based on Category & Time of Day Period
export const getWeatherTheme = (category: string, periodOrNight: TimePeriodInfo | boolean) => {
  let period: TimePeriod = "noon";
  if (typeof periodOrNight === "boolean") {
    period = periodOrNight ? "night" : "noon";
  } else if (periodOrNight && periodOrNight.period) {
    period = periodOrNight.period;
  }

  // 1. DAWN (الفجر)
  if (period === "dawn") {
    if (category.includes("rain") || category === "thunderstorm" || category === "hail") {
      return {
        theme: "from-[#1E1B4B] via-[#312E81] to-[#020617] border-indigo-500/40",
        text: "text-white",
        subtext: "text-indigo-200",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else if (category === "fog" || category === "mist") {
      return {
        theme: "from-[#2E1065] via-[#4C1D95]/90 via-[#701A75]/70 to-[#334155] border-purple-400/30",
        text: "text-purple-50",
        subtext: "text-purple-200",
        maxTemp: "text-rose-300",
        minTemp: "text-sky-300"
      };
    } else {
      return {
        theme: "from-[#1E1B4B] via-[#4C1D95]/80 via-[#831843]/60 to-[#1E293B] border-rose-400/30",
        text: "text-white",
        subtext: "text-rose-200",
        maxTemp: "text-amber-300",
        minTemp: "text-sky-300"
      };
    }
  }

  // 2. MORNING (الصباح)
  if (period === "morning") {
    if (category.includes("rain") || category === "thunderstorm") {
      return {
        theme: "from-[#1E3A8A] via-[#2563EB] to-[#0284C7] border-sky-400/40",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    } else if (category.includes("cloud") || category === "overcast") {
      return {
        theme: "from-[#0EA5E9]/80 via-[#38BDF8]/60 to-[#475569] border-sky-300/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-amber-200",
        minTemp: "text-sky-200"
      };
    } else {
      // Clear Morning
      return {
        theme: "from-[#0284C7] via-[#0EA5E9] to-[#F59E0B]/80 border-amber-300/40",
        text: "text-white",
        subtext: "text-amber-100",
        maxTemp: "text-amber-300",
        minTemp: "text-sky-200"
      };
    }
  }

  // 3. NOON (الظهيرة)
  if (period === "noon") {
    if (category.includes("rain") || category === "thunderstorm") {
      return {
        theme: "from-[#1D4ED8] via-[#0284C7] to-[#0F172A] border-blue-400/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    } else if (category.includes("cloud") || category === "overcast") {
      return {
        theme: "from-[#38BDF8] via-[#0284C7] to-[#475569] border-sky-300/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    } else {
      // Clear Midday High Sun
      return {
        theme: "from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] border-amber-300/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-amber-300",
        minTemp: "text-sky-200"
      };
    }
  }

  // 4. AFTERNOON (العصر)
  if (period === "afternoon") {
    if (category.includes("rain") || category === "thunderstorm") {
      return {
        theme: "from-[#9A3412] via-[#1E3A8A] to-[#0F172A] border-amber-500/30",
        text: "text-white",
        subtext: "text-amber-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    } else if (category === "dust" || category === "sandstorm") {
      return {
        theme: "from-[#B45309] via-[#D97706] to-[#78350F] border-amber-500/40",
        text: "text-white",
        subtext: "text-amber-100",
        maxTemp: "text-red-200",
        minTemp: "text-amber-200"
      };
    } else {
      // Warm Golden Afternoon Sky
      return {
        theme: "from-[#F59E0B]/80 via-[#2563EB] to-[#1E3A8A] border-amber-400/40",
        text: "text-white",
        subtext: "text-amber-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    }
  }

  // 5. SUNSET (المغرب)
  if (period === "sunset") {
    if (category.includes("rain") || category === "thunderstorm") {
      return {
        theme: "from-[#991B1B] via-[#6B21A8] via-[#1E3A8A] to-[#020617] border-rose-500/40",
        text: "text-white",
        subtext: "text-rose-200",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else {
      // Fiery Crimson Sunset
      return {
        theme: "from-[#DC2626] via-[#B91C1C] via-[#7C3AED] to-[#0F172A] border-rose-400/40",
        text: "text-white",
        subtext: "text-rose-100",
        maxTemp: "text-amber-300",
        minTemp: "text-sky-300"
      };
    }
  }

  // 6 & 7. EVENING / NIGHT (المساء / الليل)
  if (category.includes("rain") || category === "thunderstorm" || category === "hail") {
    return {
      theme: "from-[#020617] via-[#0F172A] to-[#1E3A8A] border-sky-500/30",
      text: "text-white",
      subtext: "text-sky-200",
      maxTemp: "text-red-300",
      minTemp: "text-sky-300"
    };
  } else if (category === "fog" || category === "mist" || category === "dust") {
    return {
      theme: "from-[#1E1E24] via-[#2D2D3A] to-[#48485E] border-slate-500/30",
      text: "text-amber-50",
      subtext: "text-amber-200",
      maxTemp: "text-red-300",
      minTemp: "text-sky-300"
    };
  } else {
    // Midnight Starry Night
    return {
      theme: "from-[#020617] via-[#0F172A] to-[#1E1B4B] border-indigo-400/30",
      text: "text-white",
      subtext: "text-indigo-200",
      maxTemp: "text-red-300",
      minTemp: "text-sky-300"
    };
  }
};


// --- CELESTIAL & ATMOSPHERIC GRAPHICS ---

// Photorealistic Morning/Overhead Sun with radiant glow
const SunElement = ({ position = "top-right", scale = 1, dimmed = false }: { position?: "top-right" | "center" | "slanted"; scale?: number; dimmed?: boolean }) => {
  const posClasses = position === "center" 
    ? "top-4 left-1/2 -translate-x-1/2" 
    : position === "slanted" 
      ? "top-6 right-10" 
      : "top-3 right-4 sm:top-4 sm:right-6";

  return (
    <div className={`absolute ${posClasses} pointer-events-none z-10 select-none`}>
      <div className={`absolute -inset-4 rounded-full blur-lg bg-amber-300/50 ${dimmed ? 'opacity-20' : 'opacity-85'} animate-pulse`} />
      <div className={`relative rounded-full bg-gradient-to-br from-[#FFFFFF] via-[#FDE047] to-[#F59E0B] shadow-[0_0_24px_rgba(251,191,36,0.95)] border border-amber-100 ${dimmed ? 'opacity-40' : 'opacity-100'}`}
        style={{ width: `${28 * scale}px`, height: `${28 * scale}px` }}
      />
    </div>
  );
};

// Sinking Golden Sunset Sun on Horizon
const SunsetSunElement = ({ dimmed = false }: { dimmed?: boolean }) => (
  <div className="absolute bottom-6 right-12 pointer-events-none z-10 select-none">
    <div className={`absolute -inset-6 rounded-full blur-xl bg-red-500/60 ${dimmed ? 'opacity-25' : 'opacity-90'}`} />
    <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-t from-[#F97316] via-[#F59E0B] to-[#FEF08A] shadow-[0_0_30px_rgba(239,68,68,0.95)] border border-amber-200 ${dimmed ? 'opacity-40' : 'opacity-100'}`} />
  </div>
);

// Photorealistic Pearl Silver Moon Core
const MoonElement = ({ dimmed = false }: { dimmed?: boolean }) => (
  <div className="absolute top-3 right-4 sm:top-4 sm:right-6 pointer-events-none z-10 select-none">
    <div className={`absolute -inset-3 rounded-full blur-md bg-slate-100/40 ${dimmed ? 'opacity-20' : 'opacity-75'}`} />
    <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#CBD5E1] shadow-[0_0_20px_rgba(255,255,255,0.95)] border border-white/95 ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
      <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-300/45 blur-[0.2px]" />
      <div className="absolute bottom-1.5 left-1.5 w-1 h-1 rounded-full bg-slate-300/35 blur-[0.2px]" />
    </div>
  </div>
);

// Drifting Cloud with volumetric soft shading
const DriftingCloud = ({
  top = "10%",
  scale = 0.75,
  duration = 18,
  delay = 0,
  isNight = false,
  isHeavy = false,
  zIndex = 20
}: {
  top?: string;
  scale?: number;
  duration?: number;
  delay?: number;
  isNight?: boolean;
  isHeavy?: boolean;
  zIndex?: number;
}) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={{ top, zIndex }}
    initial={{ x: "120%" }}
    animate={{ x: ["120%", "-120%"] }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "linear",
      delay,
    }}
  >
    <div
      className={`relative rounded-full filter blur-[0.3px] transition-all duration-300 ${
        isNight
          ? isHeavy
            ? "bg-gradient-to-b from-slate-700/90 via-slate-800/95 to-slate-900/95 shadow-[0_4px_20px_rgba(0,0,0,0.7)] border-t border-slate-500/25"
            : "bg-gradient-to-b from-slate-600/80 via-slate-700/85 to-slate-800/90 shadow-[0_3px_12px_rgba(0,0,0,0.5)] border-t border-slate-400/20"
          : isHeavy
            ? "bg-gradient-to-b from-slate-300/95 via-slate-400/95 to-slate-500/95 shadow-[0_4px_18px_rgba(0,0,0,0.25)] border-t border-white/40"
            : "bg-gradient-to-b from-white via-slate-100/95 to-slate-200/90 shadow-[0_4px_16px_rgba(255,255,255,0.6)] border-t border-white/80"
      }`}
      style={{
        width: `${90 * scale}px`,
        height: `${32 * scale}px`,
      }}
    >
      <div
        className={`absolute -top-3.5 left-3 rounded-full ${
          isNight
            ? isHeavy ? "bg-slate-800/95" : "bg-slate-700/90"
            : isHeavy ? "bg-slate-300/95" : "bg-white"
        }`}
        style={{ width: `${38 * scale}px`, height: `${38 * scale}px` }}
      />
      <div
        className={`absolute -top-5 left-7 rounded-full ${
          isNight
            ? isHeavy ? "bg-slate-900/95" : "bg-slate-800/90"
            : isHeavy ? "bg-slate-200/95" : "bg-white"
        }`}
        style={{ width: `${44 * scale}px`, height: `${44 * scale}px` }}
      />
    </div>
  </motion.div>
);

// Jagged Branching Lightning Bolts & Strobe Flashes for Thunderstorms
const LightningBoltEffect = () => (
  <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[inherit]">
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-cyan-100/90 via-sky-200/80 to-white/70 mix-blend-screen z-30"
      animate={{
        opacity: [
          0, 0, 0.95, 0.15, 0.85, 0.05, 0, 0, 
          0, 0.9, 0.1, 0, 0, 0, 0.75, 0.05, 0.8, 0
        ],
      }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: "linear",
      }}
    />
    <motion.svg
      viewBox="0 0 120 180"
      className="absolute -top-2 left-[12%] w-28 h-44 sm:w-36 sm:h-56 text-cyan-200 z-35 filter drop-shadow-[0_0_16px_rgba(56,189,248,1)]"
      animate={{
        opacity: [0, 0, 1, 0.15, 0.95, 0, 0, 0, 0, 0],
        scale: [0.95, 1, 1.05, 1, 1.02, 0.95, 0.95, 0.95, 0.95, 0.95],
      }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <path
        d="M 60 0 L 42 45 L 56 47 L 22 95 L 58 90 L 32 140 L 78 75 L 58 73 L 85 28 Z"
        fill="currentColor"
      />
    </motion.svg>
  </div>
);


// --- DYNAMIC WEATHER & TIME PERIOD BACKGROUND EFFECT ---
export const WeatherBackgroundEffect = ({ 
  weatherCode, 
  isNight = false,
  dtSec,
  sunriseSec,
  sunsetSec,
  className = ""
}: { 
  weatherCode: number; 
  isNight?: boolean;
  dtSec?: number;
  sunriseSec?: number;
  sunsetSec?: number;
  className?: string;
}) => {
  const periodInfo = useMemo(() => {
    return getTimePeriod(dtSec, sunriseSec, sunsetSec);
  }, [dtSec, sunriseSec, sunsetSec]);

  const category = getCategoryFromCode(weatherCode, periodInfo.isNight);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[inherit] w-full h-full select-none ${className}`}>
      
      {/* TIME PERIOD SPECIFIC VISUAL LAYERS */}

      {/* 1. DAWN (الفجر) SPECIAL VISUAL LAYER */}
      {periodInfo.period === "dawn" && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-rose-500/20 via-purple-600/15 to-transparent blur-xl" />
          <motion.div 
            className="absolute top-4 left-1/4 w-1.5 h-1.5 bg-amber-200 rounded-full shadow-[0_0_10px_rgba(253,230,138,1)]"
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {/* 2. MORNING (الصباح) SPECIAL SUN RAYS */}
      {periodInfo.period === "morning" && category === "clear" && (
        <motion.div 
          className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-amber-300/40 via-amber-200/20 to-transparent rounded-full blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* 3. NOON (الظهيرة) INTENSE OVERHEAD SOLAR GLOW */}
      {periodInfo.period === "noon" && category === "clear" && (
        <SunElement position="center" scale={1.2} />
      )}

      {/* 4. AFTERNOON (العصر) SLANTED WARM LIGHT BEAMS */}
      {periodInfo.period === "afternoon" && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-transparent to-blue-900/30 pointer-events-none" />
      )}

      {/* 5. SUNSET (المغرب) FIERY HORIZON GLOW */}
      {periodInfo.period === "sunset" && (
        <>
          <SunsetSunElement />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-600/40 via-amber-500/25 to-transparent blur-lg" />
        </>
      )}

      {/* 6 & 7. EVENING / NIGHT (المساء / الليل) STARS & MOON */}
      {(periodInfo.period === "evening" || periodInfo.period === "night") && (
        <>
          {/* Hide Moon if heavy overcast/storm/fog, else show dimmed if cloudy */}
          {!(category === "overcast" || category === "heavy-rain" || category === "thunderstorm" || category === "fog" || category === "sandstorm") && (
            <MoonElement dimmed={category === "cloudy" || category === "mostly-cloudy" || category === "rain"} />
          )}

          {/* Stars: ONLY visible when sky is clear or partly cloudy (STRICTLY HIDDEN when overcast/cloudy/rain/fog/storm) */}
          {(category === "clear" || category === "partly-cloudy") && (
            <div className="absolute inset-0 w-full h-full">
              {[...Array(category === "partly-cloudy" ? 8 : 20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                  style={{ top: `${((i * 17) % 88) + 4}%`, left: `${((i * 23) % 92) + 4}%` }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.75, 1.3, 0.75] }}
                  transition={{ duration: 1.8 + (i % 4) * 0.5, repeat: Infinity, delay: (i % 5) * 0.3 }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* WEATHER CONDITION OVERLAYS */}

      {/* CLEAR / SUNNY */}
      {category === "clear" && (
        <div className="absolute inset-0 w-full h-full">
          {!periodInfo.isNight && periodInfo.period !== "noon" && periodInfo.period !== "sunset" && (
            <SunElement />
          )}
          <DriftingCloud top="15%" scale={0.65} duration={32} delay={0} isNight={periodInfo.isNight} zIndex={15} />
        </div>
      )}

      {/* PARTLY CLOUDY */}
      {category === "partly-cloudy" && (
        <div className="absolute inset-0 w-full h-full">
          {!periodInfo.isNight && <SunElement />}
          <DriftingCloud top="4%" scale={1.1} duration={20} delay={0} isNight={periodInfo.isNight} zIndex={20} />
          <DriftingCloud top="14%" scale={1.3} duration={26} delay={8} isNight={periodInfo.isNight} zIndex={20} />
        </div>
      )}

      {/* CLOUDY / OVERCAST */}
      {(category === "cloudy" || category === "mostly-cloudy" || category === "overcast") && (
        <div className="absolute inset-0 w-full h-full">
          <DriftingCloud top="0%" scale={1.6} duration={14} delay={0} isNight={periodInfo.isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="8%" scale={1.9} duration={18} delay={3} isNight={periodInfo.isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="16%" scale={1.5} duration={22} delay={11} isNight={periodInfo.isNight} isHeavy={true} zIndex={20} />
        </div>
      )}

      {/* FOG / MIST */}
      {(category === "fog" || category === "mist") && (
        <div className="absolute inset-0 w-full h-full">
          <motion.div
            className="absolute inset-0 bg-slate-300/35 dark:bg-slate-700/40 blur-2xl"
            animate={{ opacity: [0.5, 0.85, 0.5], x: ["-10%", "10%", "-10%"] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* RAIN / HEAVY RAIN */}
      {(category === "light-rain" || category === "rain" || category === "heavy-rain") && (
        <div className="absolute inset-0 w-full h-full">
          <DriftingCloud top="-8%" scale={2.2} duration={20} delay={0} isNight={periodInfo.isNight} isHeavy={true} zIndex={20} />
          <div className="absolute inset-0 flex justify-between w-full h-full overflow-hidden z-25">
            {[...Array(32)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[2px] bg-gradient-to-b from-transparent via-sky-300 to-transparent rounded-full shadow-[0_0_4px_rgba(14,165,233,0.6)]"
                style={{ left: `${(i / 32) * 100}%`, height: '38%', top: '-38%' }}
                animate={{ y: ["0%", "420%"], opacity: [0, 1, 0] }}
                transition={{ duration: 0.45 + (i % 5) * 0.08, repeat: Infinity, ease: "linear", delay: (i % 7) * 0.12 }}
              />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-sky-500/20 via-sky-400/10 to-transparent blur-md z-15" />
        </div>
      )}

      {/* THUNDERSTORM */}
      {category === "thunderstorm" && (
        <div className="absolute inset-0 w-full h-full">
          <DriftingCloud top="-8%" scale={2.5} duration={14} delay={0} isNight={true} isHeavy={true} zIndex={20} />
          <div className="absolute inset-0 w-full h-full overflow-hidden z-25">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[2px] bg-gradient-to-b from-transparent via-cyan-200 to-transparent rounded-full rotate-[-8deg]"
                style={{ left: `${(i / 40) * 105 - 2}%`, height: '48%', top: '-48%' }}
                animate={{ y: ["0%", "420%"], opacity: [0, 1, 0] }}
                transition={{ duration: 0.35 + (i % 5) * 0.08, repeat: Infinity, ease: "linear", delay: (i % 9) * 0.1 }}
              />
            ))}
          </div>
          <LightningBoltEffect />
        </div>
      )}

      {/* SANDSTORM / DUST */}
      {(category === "sandstorm" || category === "dust") && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-amber-700/25 blur-md" />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-amber-300/80 rounded-full blur-[0.5px]"
              style={{ top: `${(i * 12) % 90}%`, left: `${(i * 15) % 95}%` }}
              animate={{ x: ["0px", "120px", "0px"], opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            />
          ))}
        </div>
      )}

    </div>
  );
};


// --- 3D DYNAMIC INTERACTIVE WEATHER ILLUSTRATION ---
export const Interactive3DWeatherIllustration = ({ 
  weatherCode = 801, 
  isNight = false,
  className = "w-28 h-28 sm:w-36 sm:h-36"
}: { 
  weatherCode?: number; 
  isNight?: boolean;
  className?: string;
}) => {
  const category = getCategoryFromCode(weatherCode, isNight);

  return (
    <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`}>
      <motion.div 
        className="w-full h-full flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <defs>
            <linearGradient id="sun3dGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF59D" />
              <stop offset="50%" stopColor="#FBC02D" />
              <stop offset="100%" stopColor="#F57F17" />
            </linearGradient>
            <linearGradient id="cloudFrontGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="cloudBackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="cloudStormGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          {/* Sun / Celestial Body */}
          {(!isNight && (category === "clear" || category === "partly-cloudy" || category === "mostly-cloudy")) && (
            <circle cx="60" cy="50" r="26" fill="url(#sun3dGrad)" />
          )}

          {/* Moon */}
          {(isNight && (category === "clear" || category === "partly-cloudy")) && (
            <g>
              <circle cx="60" cy="50" r="24" fill="#F8FAFC" />
              <circle cx="70" cy="44" r="20" fill="#0F172A" />
            </g>
          )}

          {/* Cloud Layer */}
          {(category === "partly-cloudy" || category === "mostly-cloudy" || category === "cloudy" || category === "overcast" || category.includes("rain") || category === "thunderstorm" || category === "fog") && (
            <g>
              <path 
                d="M30 75 C30 65 38 58 48 58 C51 58 54 59 56 61 C60 52 69 46 80 46 C93 46 104 56 104 69 C104 70 104 71 104 72 C108 72 112 76 112 81 C112 87 107 92 101 92 L30 92 C21 92 14 85 14 76 C14 67 21 60 30 60 Z" 
                fill={category === "thunderstorm" ? "url(#cloudStormGrad)" : "url(#cloudFrontGrad)"} 
              />
            </g>
          )}

          {/* Rain Drops */}
          {(category.includes("rain") || category === "thunderstorm") && (
            <g>
              <line x1="40" y1="96" x2="35" y2="108" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
              <line x1="60" y1="96" x2="55" y2="108" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
              <line x1="80" y1="96" x2="75" y2="108" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* Lightning Bolt */}
          {category === "thunderstorm" && (
            <polygon points="58,92 48,104 55,104 50,116 66,101 58,101" fill="#FDE047" />
          )}
        </svg>
      </motion.div>
    </div>
  );
};


// 3D Forecast Icon Badge for Daily / Hourly Cards
const ForecastIcon3D = ({ weatherId, isNight = false }: { weatherId?: number; isNight?: boolean }) => {
  const isThunder = weatherId !== undefined && (weatherId >= 200 && weatherId < 300);
  const isRain = weatherId !== undefined && ((weatherId >= 300 && weatherId < 700) || (weatherId >= 51 && weatherId <= 99));
  const isCloudy = weatherId !== undefined && (weatherId >= 801 && weatherId <= 804);

  return (
    <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 select-none">
      {isThunder ? (
        <motion.div 
          animate={{ scale: [1, 1.12, 1], rotate: [-2, 2, -2] }} 
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <CloudLightning className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300 filter drop-shadow-[0_0_8px_rgba(252,211,77,0.85)]" />
        </motion.div>
      ) : isRain ? (
        <motion.div 
          animate={{ y: [0, -3, 0] }} 
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <CloudRain className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
        </motion.div>
      ) : isCloudy ? (
        <motion.div 
          animate={{ x: [-2, 2, -2], y: [0, -2, 0] }} 
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Cloud className="w-6 h-6 sm:w-8 sm:h-8 text-slate-100 filter drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
        </motion.div>
      ) : isNight ? (
        <motion.div 
          animate={{ rotate: [-8, 8, -8] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Moon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-200 filter drop-shadow-[0_0_10px_rgba(199,210,254,0.85)]" />
        </motion.div>
      ) : (
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        >
          <Sun className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
        </motion.div>
      )}
    </div>
  );
};


// --- CUSTOM INTERACTIVE SVG HOURLY TEMPERATURE & RAIN CHART ---
const InteractiveHourlyChart = ({ hourlyData, unit = "C" }: { hourlyData: any[]; unit?: "C" | "F" }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!hourlyData || hourlyData.length === 0) return null;

  const points = hourlyData.slice(0, 10).map((item, idx) => {
    const rawT = item.main?.temp ?? 25;
    const temp = unit === "F" ? Math.round((rawT * 9) / 5 + 32) : Math.round(rawT);
    const pop = Math.round((item.pop || 0) * 100);
    const hourDate = new Date(item.dt * 1000);
    const timeLabel = hourDate.toLocaleTimeString('ar-YE', { hour: 'numeric', hour12: true });
    return { idx, temp, pop, timeLabel, rawItem: item };
  });

  const temps = points.map(p => p.temp);
  const minT = Math.min(...temps) - 2;
  const maxT = Math.max(...temps) + 2;
  const rangeT = maxT - minT || 1;

  const width = 600;
  const height = 160;
  const paddingX = 30;
  const paddingY = 30;

  const getX = (idx: number) => paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX);
  const getY = (temp: number) => height - paddingY - ((temp - minT) / rangeT) * (height - 2 * paddingY);

  const pathD = points.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.temp);
    if (i === 0) return `M ${x} ${y}`;
    const prevX = getX(i - 1);
    const prevY = getY(points[i - 1].temp);
    const cpX1 = prevX + (x - prevX) / 2;
    const cpX2 = prevX + (x - prevX) / 2;
    return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
  }, "");

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - 10} L ${getX(0)} ${height - 10} Z`;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[0];

  return (
    <div className="bg-slate-900/90 text-white rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-cairo flex items-center gap-2 text-sky-400">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            المنحنى الحراري وهطول الأمطار التفاعلي
          </h3>
          <p className="text-[11px] text-slate-400 font-cairo">مرر اللمس على النقاط لعرض تفاصيل كل ساعة</p>
        </div>
        <div className="bg-sky-500/20 text-sky-300 text-xs font-bold px-3 py-1 rounded-full border border-sky-500/30 font-sans">
          {activePoint.timeLabel}: {activePoint.temp}°{unit} ({activePoint.pop}% أمطار)
        </div>
      </div>

      <div className="relative w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[480px]">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under line */}
          <path d={areaD} fill="url(#chartGrad)" />

          {/* Smooth Curve */}
          <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />

          {/* Points & Touch Targets */}
          {points.map((p, i) => {
            const x = getX(i);
            const y = getY(p.temp);
            const isHovered = hoverIndex === i;

            return (
              <g 
                key={i} 
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onClick={() => setHoverIndex(i)}
              >
                {/* Rain Bar at bottom */}
                <rect 
                  x={x - 6} 
                  y={height - 25 - (p.pop / 100) * 35} 
                  width="12" 
                  height={(p.pop / 100) * 35 + 2} 
                  rx="3"
                  className={p.pop > 30 ? "fill-sky-400/80" : "fill-slate-700/50"}
                />

                {/* Point Node */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isHovered ? 7 : 4.5} 
                  className={isHovered ? "fill-amber-400 stroke-white stroke-2" : "fill-sky-400 stroke-slate-900 stroke-2"} 
                />

                {/* Temp Label above */}
                <text 
                  x={x} 
                  y={y - 10} 
                  textAnchor="middle" 
                  className="fill-slate-200 text-[11px] font-bold font-sans"
                >
                  {p.temp}°
                </text>

                {/* Time Label bottom */}
                <text 
                  x={x} 
                  y={height - 4} 
                  textAnchor="middle" 
                  className="fill-slate-400 text-[10px] font-cairo"
                >
                  {p.timeLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};


// --- MAIN WEATHER DETAIL PAGE COMPONENT ---
export const WeatherDetail: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"live" | "hourly" | "daily" | "air" | "design">("live");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  // Selected item modal state
  const [activeModalData, setActiveModalData] = useState<{
    title: string;
    subtitle: string;
    metrics: { label: string; value: string; icon: any; color?: string }[];
    description?: string;
  } | null>(null);

  // Dedicated Day Hourly Forecast Page Modal State
  const [selectedDayModalData, setSelectedDayModalData] = useState<{
    dayItem: any;
    dayName: string;
    dateFormatted: string;
    dayDateStr: string;
    hourlyList: any[];
  } | null>(null);

  // Live state initialization (No caching)
  const [weatherConfig, setWeatherConfig] = useState<WeatherConfig | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [airPollutionData, setAirPollutionData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to manual weather config
  useEffect(() => {
    const unsub = PrayerWeatherService.subscribeWeatherConfig((cfg) => {
      setWeatherConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Helper function to extract YYYY-MM-DD string in local format
  const getLocalDateStr = (dtSec?: number) => {
    if (!dtSec) return new Date().toISOString().split('T')[0];
    const d = new Date(dtSec * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // FETCH ACCURATE LIVE WEATHER FOR TAIZ YEMEN FROM OPENWEATHERMAP
  const fetchWeather = async () => {
    try {
      if (!weatherData) setLoading(true);
      setIsRefreshing(true);

      const omData = await fetchWeatherData();
      const current = omData.current;
      const forecastDataList = omData.forecast?.list || [];
      const pollution = omData.airPollution;

      // Calculate isNight based on sunrise/sunset
      const nowSec = Math.floor(Date.now() / 1000);
      const isNight = current.sys?.sunrise && current.sys?.sunset 
        ? (nowSec < current.sys.sunrise || nowSec > current.sys.sunset)
        : false;

      // Find today's forecasts
      const todayStr = getLocalDateStr(current.dt || nowSec);
      const todayForecasts = forecastDataList.filter((f: any) => {
        return getLocalDateStr(f.dt) === todayStr;
      });

      const temp_max = todayForecasts.length > 0 
        ? Math.max(...todayForecasts.map((f: any) => f.main?.temp_max ?? f.main?.temp ?? 28))
        : current?.main?.temp_max || ((current?.main?.temp ?? 26) + 4);
        
      const temp_min = todayForecasts.length > 0 
        ? Math.min(...todayForecasts.map((f: any) => f.main?.temp_min ?? f.main?.temp ?? 20))
        : current?.main?.temp_min || ((current?.main?.temp ?? 26) - 4);

      const pop = todayForecasts.length > 0
        ? Math.max(...todayForecasts.map((f: any) => f.pop || 0)) * 100
        : 0;

      const formattedWData = {
        main: {
          temp: current?.main?.temp ?? 26,
          feels_like: current?.main?.feels_like ?? 27,
          temp_max,
          temp_min,
          humidity: current?.main?.humidity ?? 55,
          pressure: current?.main?.pressure ?? 1014,
          sea_level: current?.main?.sea_level ?? 1014,
          grnd_level: current?.main?.grnd_level ?? 860,
        },
        weather: current?.weather || [{ id: 801, description: "غائم جزئياً", icon: "02d" }],
        wind: { speed: current?.wind?.speed ?? 3.8, deg: current?.wind?.deg ?? 140, gust: current?.wind?.gust ?? 5.2 },
        clouds: { all: current?.clouds?.all || 0 },
        visibility: current?.visibility || 10000,
        sys: {
          sunrise: current?.sys?.sunrise,
          sunset: current?.sys?.sunset,
          country: current?.sys?.country || "YE"
        },
        dt: current?.dt || nowSec,
        name: current?.name || "تعز",
        isNight,
        pop: pop / 100,
      };

      // Daily aggregates
      const daysMap = new Map();
      forecastDataList.forEach((f: any) => {
        const dateStr = getLocalDateStr(f.dt);
        if (!daysMap.has(dateStr)) {
          daysMap.set(dateStr, []);
        }
        daysMap.get(dateStr).push(f);
      });

      const forecastList = Array.from(daysMap.entries()).slice(0, 7).map(([date, items]: [string, any[]]) => {
        const midday = items.find((i) => {
          const hour = new Date(i.dt * 1000).getHours();
          return hour >= 11 && hour <= 15;
        }) || items[0];

        const day_temp_max = Math.max(...items.map((i) => i.main.temp_max));
        const day_temp_min = Math.min(...items.map((i) => i.main.temp_min));
        const day_pop = Math.max(...items.map((i) => i.pop || 0));

        return {
          dt: midday.dt,
          dateStr: date,
          main: {
            temp_max: day_temp_max,
            temp_min: day_temp_min,
            humidity: midday.main.humidity,
            pressure: midday.main.pressure,
            feels_like: midday.main.feels_like,
          },
          weather: midday.weather,
          wind: { speed: midday.wind?.speed, deg: midday.wind?.deg },
          clouds: { all: midday.clouds?.all || 0 },
          pop: day_pop
        };
      });

      setWeatherData(formattedWData);
      setForecastData({ 
        list: forecastList, 
        isOm: true, 
        hourly: forecastDataList.slice(0, 16),
        rawList: forecastDataList 
      });
      if (pollution) setAirPollutionData(pollution);
      
      setError(null);
      setShowRefreshSuccess(true);
      setTimeout(() => setShowRefreshSuccess(false), 2500);

    } catch (e) {
      console.error("Weather fetch failed, utilizing safety fallback:", e);
      setError(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Time e.g. "05:46 ص"
  const formatTime12h = (timestamp: number) => {
    if (!timestamp) return "--:--";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('ar-YE', { 
      timeZone: 'Asia/Aden', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Convert Temp logic
  const displayTemp = (celsius: number) => {
    if (celsius === undefined || celsius === null) return 0;
    if (unit === "F") return Math.round((celsius * 9) / 5 + 32);
    return Math.round(celsius);
  };

  // Current Weather values
  const isManualMode = weatherConfig?.mode === "manual";
  const rawTemp = isManualMode ? (weatherConfig?.temp ?? 26) : (weatherData?.main?.temp ?? 26);
  const rawFeelsLike = isManualMode ? (weatherConfig?.feelsLike ?? rawTemp) : (weatherData?.main?.feels_like ?? 27);
  const rawTempMax = isManualMode ? (weatherConfig?.tempMax ?? (rawTemp + 3)) : (weatherData?.main?.temp_max ?? 30);
  const rawTempMin = isManualMode ? (weatherConfig?.tempMin ?? (rawTemp - 4)) : (weatherData?.main?.temp_min ?? 20);

  const conditionStr = isManualMode 
    ? (weatherConfig?.conditionText || "صافٍ") 
    : (weatherData?.weather?.[0]?.description || "غائم جزئياً");
  const weatherCode = isManualMode 
    ? (weatherConfig?.weatherCode ?? 800) 
    : (weatherData?.weather?.[0]?.id || 801);
  const humidity = Math.round(isManualMode ? (weatherConfig?.humidity ?? 50) : (weatherData?.main?.humidity ?? 52));
  const windSpeed = isManualMode 
    ? (weatherConfig?.windSpeed ?? 3.5) 
    : (weatherData?.wind?.speed ? (Math.round(weatherData.wind.speed * 100) / 100) : 3.8);
  const windDeg = isManualMode ? (weatherConfig?.windDeg ?? 70) : (weatherData?.wind?.deg ?? 70);
  const pressure = Math.round(isManualMode ? (weatherConfig?.pressure ?? 1010) : (weatherData?.main?.pressure ?? 1010));
  const visibilityKm = isManualMode ? (weatherConfig?.visibilityKm ?? 10) : (weatherData?.visibility ? Math.round(weatherData.visibility / 1000) : 10);
  const sunriseTime = weatherData?.sys?.sunrise ? formatTime12h(weatherData.sys.sunrise) : "05:46 ص";
  const sunsetTime = weatherData?.sys?.sunset ? formatTime12h(weatherData.sys.sunset) : "06:34 م";
  const precipProb = isManualMode ? (weatherConfig?.precipProb ?? 0) : (weatherData?.pop !== undefined ? Math.round(weatherData.pop * 100) : 0);
  const cloudiness = isManualMode ? (weatherConfig?.cloudiness ?? 20) : (weatherData?.clouds?.all ?? 40);
  const dewPoint = calculateDewPoint(rawTemp, humidity);
  const aqiCode = airPollutionData?.list?.[0]?.main?.aqi ?? 2;
  const aqiObj = getAqiDetails(aqiCode);

  // Time Period Info
  const periodInfo = useMemo(() => {
    return getTimePeriod(weatherData?.dt, weatherData?.sys?.sunrise, weatherData?.sys?.sunset);
  }, [weatherData]);

  // Dynamic Theme string
  const heroThemeObj = useMemo(() => {
    const category = getCategoryFromCode(weatherCode, periodInfo.isNight);
    return getWeatherTheme(category, periodInfo);
  }, [weatherCode, periodInfo]);

  // Handle Opening Modal Details for Current Weather Card
  const openCurrentWeatherModal = () => {
    setActiveModalData({
      title: "تفاصيل الطقس الحالي الكاملة في تعز",
      subtitle: `${periodInfo.descriptionAr} • تحديث مباشر`,
      description: `الحالة الجوية الحالية هي (${conditionStr}) بجهة رياح ${getWindDirectionArabic(windDeg)} (${windDeg}°) وسرعة ${windSpeed} م/ث مع مستوى رطوبة ${humidity}%.`,
      metrics: [
        { label: "درجة الحرارة", value: `${displayTemp(rawTemp)}°${unit}`, icon: Thermometer, color: "text-amber-500" },
        { label: "الشعور الحراري", value: `${displayTemp(rawFeelsLike)}°${unit}`, icon: Sun, color: "text-orange-500" },
        { label: "أعلى درجة اليوم", value: `${displayTemp(rawTempMax)}°${unit}`, icon: ArrowUp, color: "text-red-500" },
        { label: "أدنى درجة اليوم", value: `${displayTemp(rawTempMin)}°${unit}`, icon: ArrowDown, color: "text-sky-500" },
        { label: "الرطوبة النسبية", value: `${humidity}%`, icon: Droplets, color: "text-cyan-500" },
        { label: "نقطة الندى", value: `${dewPoint}°C`, icon: HeartPulse, color: "text-blue-500" },
        { label: "سرعة الرياح", value: `${windSpeed} م/ث (${Math.round(windSpeed * 3.6)} كم/س)`, icon: Wind, color: "text-teal-500" },
        { label: "اتجاه الرياح", value: `${getWindDirectionArabic(windDeg)} (${windDeg}°)`, icon: Compass, color: "text-indigo-500" },
        { label: "الضغط الجوي", value: `${pressure} hPa`, icon: Gauge, color: "text-purple-500" },
        { label: "مستوى الرؤية الأفقية", value: `${visibilityKm} كم`, icon: Eye, color: "text-emerald-500" },
        { label: "نسبة التغطية بالغيوم", value: `${cloudiness}%`, icon: Cloud, color: "text-slate-500" },
        { label: "احتمالية هطول الأمطار", value: `${precipProb}%`, icon: CloudRain, color: "text-blue-500" },
        { label: "مؤشر جودة الهواء (AQI)", value: `${aqiCode} - ${aqiObj.label}`, icon: Activity, color: "text-emerald-600" },
        { label: "وقت الشروق المحلي", value: sunriseTime, icon: Sunrise, color: "text-amber-600" },
        { label: "وقت الغروب المحلي", value: sunsetTime, icon: Sunset, color: "text-indigo-600" },
      ]
    });
  };

  // Handle Opening Modal Details for an Hour item
  const openHourDetailModal = (hourItem: any) => {
    const hourDate = new Date(hourItem.dt * 1000);
    const timeFormatted = hourDate.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateFormatted = hourDate.toLocaleDateString('ar-YE', { month: 'short', day: 'numeric' });
    const hPeriod = getTimePeriod(hourItem.dt);
    const hCode = hourItem.weather?.[0]?.id || 800;
    const hDesc = hourItem.weather?.[0]?.description || "صافٍ";
    const hTemp = hourItem.main?.temp;
    const hFeels = hourItem.main?.feels_like;
    const hPop = Math.round((hourItem.pop || 0) * 100);
    const hWind = hourItem.wind?.speed ? Math.round(hourItem.wind.speed * 100) / 100 : 3.5;
    const hDeg = hourItem.wind?.deg ?? 65;
    const hHum = Math.round(hourItem.main?.humidity || 50);
    const hPress = Math.round(hourItem.main?.pressure || 1010);
    const hDew = calculateDewPoint(hTemp, hHum);

    setActiveModalData({
      title: `توقعات طقس الساعة ${timeFormatted}`,
      subtitle: `${dateFormatted} • فترة ${hPeriod.labelAr}`,
      description: `تشير التوقعات الجوية للساعة ${timeFormatted} إلى حالة (${hDesc}) مع احتمالية أمطار بنسبة ${hPop}% ورطوبة ${hHum}%.`,
      metrics: [
        { label: "درجة الحرارة المتوقعة", value: `${displayTemp(hTemp)}°${unit}`, icon: Thermometer, color: "text-amber-500" },
        { label: "الشعور الحراري", value: `${displayTemp(hFeels)}°${unit}`, icon: Sun, color: "text-orange-500" },
        { label: "الحالة العامة", value: hDesc, icon: Cloud, color: "text-sky-500" },
        { label: "احتمال الأمطار", value: `${hPop}%`, icon: CloudRain, color: "text-blue-500" },
        { label: "سرعة الرياح", value: `${hWind} م/ث (${Math.round(hWind * 3.6)} كم/س)`, icon: Wind, color: "text-teal-500" },
        { label: "اتجاه الرياح", value: `${getWindDirectionArabic(hDeg)} (${hDeg}°)`, icon: Compass, color: "text-indigo-500" },
        { label: "مستوى الرطوبة", value: `${hHum}%`, icon: Droplets, color: "text-cyan-500" },
        { label: "نقطة الندى", value: `${hDew}°C`, icon: HeartPulse, color: "text-blue-500" },
        { label: "الضغط الجوي", value: `${hPress} hPa`, icon: Gauge, color: "text-purple-500" },
      ]
    });
  };

  // Handle Opening Modal Details for a Day item
  const openDayDetailModal = (dayItem: any) => {
    openDayHourlyPage(dayItem);
  };

  // Handle Opening Dedicated Day Hourly Forecast Page Modal
  const openDayHourlyPage = (dayItem: any) => {
    const dayDate = new Date(dayItem.dt * 1000);
    const dayDateStr = getLocalDateStr(dayItem.dt);
    const dayName = dayDate.toLocaleDateString('ar-YE', { weekday: 'long' });
    const dateFormatted = dayDate.toLocaleDateString('ar-YE', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const rawList = forecastData?.rawList || forecastData?.hourly || [];
    let dayHourlyItems = rawList.filter((f: any) => getLocalDateStr(f.dt) === dayDateStr);
    
    if ((dayDateStr === todayStr || !dayHourlyItems.length) && todayHourlyList.length > 0) {
      if (!dayHourlyItems.length || todayHourlyList.length > dayHourlyItems.length) {
        dayHourlyItems = todayHourlyList;
      }
    }
    
    setSelectedDayModalData({
      dayItem,
      dayName,
      dateFormatted,
      dayDateStr,
      hourlyList: dayHourlyItems.length > 0 ? dayHourlyItems : [dayItem],
    });
  };

  // Date Helpers for Dynamic Day Titles
  const dateHelper = useMemo(() => {
    const currentDt = weatherData?.dt || Math.floor(Date.now() / 1000);
    const now = new Date(currentDt * 1000);
    
    const todayStr = getLocalDateStr(currentDt);
    
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getLocalDateStr(Math.floor(tomorrowDate.getTime() / 1000));

    const dayAfterDate = new Date(now);
    dayAfterDate.setDate(dayAfterDate.getDate() + 2);
    const dayAfterStr = getLocalDateStr(Math.floor(dayAfterDate.getTime() / 1000));

    return { todayStr, tomorrowStr, dayAfterStr };
  }, [weatherData]);

  // Today Date Strings & Memoized Hourly List strictly for Today's 24 Hours
  const todayStr = dateHelper.todayStr;

  const todayDateInfo = useMemo(() => {
    const dt = weatherData?.dt || Math.floor(Date.now() / 1000);
    const date = new Date(dt * 1000);
    const dayName = date.toLocaleDateString('ar-YE', { weekday: 'long' });
    const dateFormatted = date.toLocaleDateString('ar-YE', { month: 'long', day: 'numeric', year: 'numeric' });
    return { dayName, dateFormatted };
  }, [weatherData]);

  // Grouped Hourly Forecasts by Day (Automatically segmented into Today, Tomorrow, etc.)
  const groupedHourlyForecasts = useMemo(() => {
    const rawList = forecastData?.rawList || forecastData?.hourly || [];
    if (!rawList || rawList.length === 0) return [];

    // Slice upcoming forecast points (e.g. 16-20 forecast intervals covering today & tomorrow)
    const upcomingItems = rawList.slice(0, 16);

    const groups: Array<{
      dayKey: string;
      dayLabel: string; // "اليوم", "غداً", "بعد غد", or Day Name
      dayName: string; // e.g. "الإثنين"
      dateFormatted: string; // e.g. "27 يوليو"
      isToday: boolean;
      isTomorrow: boolean;
      hours: any[];
    }> = [];

    upcomingItems.forEach((hourItem: any) => {
      const dStr = getLocalDateStr(hourItem.dt);

      // Only include forecast items for Today and Tomorrow (exclude day after tomorrow)
      if (dStr !== dateHelper.todayStr && dStr !== dateHelper.tomorrowStr) {
        return;
      }

      let group = groups.find(g => g.dayKey === dStr);

      if (!group) {
        const hDate = new Date(hourItem.dt * 1000);
        const dayName = hDate.toLocaleDateString('ar-YE', { weekday: 'long' });
        const dateFormatted = hDate.toLocaleDateString('ar-YE', { day: 'numeric', month: 'long' });

        let dayLabel = "اليوم";
        let isToday = false;
        let isTomorrow = false;

        if (dStr === dateHelper.todayStr) {
          dayLabel = "اليوم";
          isToday = true;
        } else if (dStr === dateHelper.tomorrowStr) {
          dayLabel = "غداً";
          isTomorrow = true;
        }

        group = {
          dayKey: dStr,
          dayLabel,
          dayName,
          dateFormatted,
          isToday,
          isTomorrow,
          hours: []
        };
        groups.push(group);
      }

      group.hours.push(hourItem);
    });

    return groups;
  }, [forecastData, dateHelper]);

  const todayHourlyList = useMemo(() => {
    const rawList = forecastData?.rawList || forecastData?.hourly || [];
    if (!rawList || rawList.length === 0) return [];
    
    // Filter strictly for items whose local YYYY-MM-DD matches todayStr
    const itemsForToday = rawList.filter((f: any) => getLocalDateStr(f.dt) === todayStr);
    
    // If items exist for today, return them.
    if (itemsForToday.length > 0) {
      return itemsForToday;
    }
    
    // Fallback if day boundaries rolled over
    return rawList.slice(0, 8);
  }, [forecastData, todayStr]);

  const todaySummaryItem = useMemo(() => {
    const item = forecastData?.list?.[0] || {};
    return {
      dt: weatherData?.dt || Math.floor(Date.now() / 1000),
      main: {
        temp: rawTemp,
        temp_max: rawTempMax,
        temp_min: rawTempMin,
        humidity: humidity,
        pressure: pressure,
      },
      weather: weatherData?.weather || [{ id: weatherCode, description: conditionStr }],
      wind: { speed: windSpeed, deg: weatherData?.wind?.deg },
      pop: (precipProb || 0) / 100,
      ...item
    };
  }, [forecastData, weatherData, rawTemp, rawTempMax, rawTempMin, humidity, pressure, weatherCode, conditionStr, windSpeed, precipProb]);

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-surface-main" dir="rtl">
        <div className="flex flex-col items-center gap-3 p-6">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-slate-600 font-medium font-cairo text-sm">جاري جلب حالة الطقس...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-surface-main" dir="rtl">
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center border border-red-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold font-cairo">عذراً</h2>
          <p className="font-cairo text-sm">{error || "تعذر جلب بيانات الطقس"}</p>
          <button 
            onClick={fetchWeather} 
            className="px-5 py-2 bg-red-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface-main text-text-primary pb-16 pt-4 px-3 sm:px-6 select-none font-sans overflow-hidden" dir="rtl">
      {/* BACKGROUND ACCENTS MATCHING NEWS SECTION */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl -mt-20 -mr-20" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -mb-20 -ml-20" />
      </div>

      {/* Centered Container */}
      <div className="relative z-10 max-w-md md:max-w-2xl mx-auto space-y-4 sm:space-y-6">

        {/* TOP NAVBAR ROW */}
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/")}
              className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-800 hover:bg-slate-50 transition-all shadow-xs"
              title="العودة للرئيسية"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 font-cairo leading-none tracking-tight">حالة الطقس المباشرة</h1>
              <span className="text-[11px] font-bold text-slate-500 font-cairo flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-red-500" />
                محافظة تعز • اليمن
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Switcher C/F */}
            <button
              onClick={() => setUnit(prev => prev === "C" ? "F" : "C")}
              className="bg-white border border-slate-200/80 shadow-xs rounded-2xl px-3.5 py-1.5 text-xs font-black text-slate-800 hover:bg-slate-50 transition-all font-sans"
            >
              °{unit}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchWeather}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-sky-600 text-white shadow-xs rounded-2xl px-3.5 py-1.5 hover:bg-sky-700 transition-all disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-white" : ""}`} />
              <span className="text-xs font-bold font-cairo hidden sm:inline-block">
                {isRefreshing ? "جاري التحديث..." : "تحديث"}
              </span>
            </button>
          </div>
        </div>

        {/* MAIN WEATHER CONTENT STACK */}
        
        {/* 1. CURRENT WEATHER HERO CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          onClick={openCurrentWeatherModal}
          className={`relative rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] border overflow-hidden transition-all duration-500 bg-gradient-to-br cursor-pointer group ${heroThemeObj.theme}`}
          title="اضغط لعرض تفاصيل الطقس الحالي الكاملة"
        >
          {/* Live Dynamic Weather Effect across full card background */}
          <WeatherBackgroundEffect 
            weatherCode={weatherCode} 
            isNight={periodInfo.isNight}
            dtSec={weatherData?.dt}
            sunriseSec={weatherData?.sys?.sunrise}
            sunsetSec={weatherData?.sys?.sunset}
          />

          {/* Overlay for pristine high-contrast legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-black/20 pointer-events-none" />

          {/* TIME PERIOD BADGE */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/25 text-xs font-bold flex items-center gap-2 shadow-sm text-white font-cairo">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              الطقس الآن • فترة {periodInfo.labelAr}
            </div>
            <span className="text-[10px] font-extrabold text-white/90 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 font-cairo group-hover:bg-white/25 transition-colors">
              اضغط للتفاصيل ↗
            </span>
          </div>

          {/* MAIN HERO CONTENT */}
          <div className="relative z-10 mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black font-sans tracking-tight">
                  {displayTemp(rawTemp)}
                </span>
                <span className="text-2xl font-bold font-sans text-amber-300">°{unit}</span>
              </div>
              <p className="text-lg font-bold font-cairo text-white/95 mt-1">{conditionStr}</p>
              
              {/* Max/Min Colored Numbers with Icons ONLY - NO TEXT LABELS / NO REAL FEEL */}
              <div className="flex items-center gap-2.5 mt-2 font-sans font-black text-xs sm:text-sm">
                <div className="flex items-center gap-1 text-rose-400 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-rose-400/30 shadow-xs" title="الحرارة العظمى">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{displayTemp(rawTempMax)}°</span>
                </div>
                <div className="flex items-center gap-1 text-sky-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-sky-300/30 shadow-xs" title="الحرارة الصغرى">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{displayTemp(rawTempMin)}°</span>
                </div>
              </div>
            </div>

            <Interactive3DWeatherIllustration 
              weatherCode={weatherCode} 
              isNight={periodInfo.isNight} 
              className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-xl"
            />
          </div>

          {/* ESSENTIAL METRICS GRID OVERLAY */}
          <div className="relative z-10 mt-6 grid grid-cols-4 gap-2 pt-4 border-t border-white/20 text-center">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-2 border border-white/10">
              <span className="text-[10px] text-white/70 block font-cairo">الرياح</span>
              <span className="text-xs font-black font-sans text-white">{windSpeed} م/ث</span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-2 border border-white/10">
              <span className="text-[10px] text-white/70 block font-cairo">الرطوبة</span>
              <span className="text-xs font-black font-sans text-white">{humidity}%</span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-2 border border-white/10">
              <span className="text-[10px] text-white/70 block font-cairo">الأمطار</span>
              <span className="text-xs font-black font-sans text-white">{precipProb}%</span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-2 border border-white/10">
              <span className="text-[10px] text-white/70 block font-cairo">الضغط</span>
              <span className="text-xs font-black font-sans text-white">{pressure}</span>
            </div>
          </div>

          {/* EMBEDDED SUN MOVEMENT & DAYLIGHT SUB-PANEL */}
          <div className="relative z-10 mt-5 pt-4 border-t border-white/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
                <span className="text-xs font-bold font-cairo text-white">حركة الشمس وقوس النهار</span>
              </div>
              <span className="text-[10px] font-bold text-amber-200 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                تعز (UTC+3)
              </span>
            </div>

            <div className="relative pt-2 pb-1 bg-black/30 backdrop-blur-md px-4 rounded-2xl border border-white/15">
              <svg viewBox="0 0 200 65" className="w-full h-auto">
                <path d="M 10 55 Q 100 8 190 55" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeDasharray="3 3" />
                <path d="M 10 55 Q 100 8 120 30" fill="none" stroke="#FBBF24" strokeWidth="3" />
                <circle cx="120" cy="30" r="6" fill="#FBBF24" className="shadow-md animate-pulse" />
              </svg>

              <div className="flex items-center justify-between text-xs font-bold font-cairo text-white/95 pt-2 border-t border-white/10 mt-1 pb-1">
                <div className="flex items-center gap-1.5">
                  <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                  <span>الشروق: {sunriseTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sunset className="w-3.5 h-3.5 text-indigo-300" />
                  <span>الغروب: {sunsetTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* EMBEDDED AIR QUALITY INDEX (AQI) SUB-PANEL */}
          <div className="relative z-10 mt-4 pt-4 border-t border-white/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-cairo text-white">مؤشر جودة الهواء (AQI)</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-400/40`}>
                {aqiObj.label}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/15">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#34D399" strokeWidth="3.5" strokeDasharray={`${aqiObj.percent}, 100`} />
                </svg>
                <span className="absolute text-sm font-black font-sans text-white">{aqiCode}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold font-cairo text-white">{aqiObj.label}</p>
                <p className="text-[11px] text-white/80 font-cairo leading-relaxed mt-0.5">
                  {aqiObj.description}
                </p>
              </div>
            </div>

            {/* Pollutants Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-cairo">
              <div className="bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/10">
                <span className="text-[9px] text-white/60 block">PM2.5</span>
                <span className="font-bold font-sans text-white text-xs">{airPollutionData?.list?.[0]?.components?.pm2_5 ?? 23.9}</span>
              </div>
              <div className="bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/10">
                <span className="text-[9px] text-white/60 block">PM10</span>
                <span className="font-bold font-sans text-white text-xs">{airPollutionData?.list?.[0]?.components?.pm10 ?? 96.9}</span>
              </div>
              <div className="bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/10">
                <span className="text-[9px] text-white/60 block">NO2</span>
                <span className="font-bold font-sans text-white text-xs">{airPollutionData?.list?.[0]?.components?.no2 ?? 1.1}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TODAY'S INTERACTIVE WEATHER CARD (SINGLE CARD - CLICK TO VIEW HOURLY FORECAST) */}
        <motion.div
          onClick={() => openDayHourlyPage(todaySummaryItem)}
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="relative rounded-[28px] p-5 text-white shadow-lg border border-slate-200/90 overflow-hidden cursor-pointer group bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-800 transition-all duration-300 hover:shadow-xl hover:border-white/50"
          title="اضغط لعرض توقعات الساعات القادمة لليوم نفسه"
        >
          {/* Dynamic Background Effect */}
          <WeatherBackgroundEffect 
            weatherCode={weatherCode} 
            isNight={periodInfo.isNight} 
            dtSec={weatherData?.dt}
            className="opacity-40 pointer-events-none" 
          />
          <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black font-cairo bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/25 text-white">
                  توقعات طقس اليوم ({todayDateInfo.dayName} - {todayDateInfo.dateFormatted})
                </span>
              </div>
              <span className="text-xs font-extrabold font-cairo text-amber-300 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-1 group-hover:bg-amber-400/20 transition-all">
                عرض تفاصيل الساعات ↗
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight">
                    {displayTemp(rawTemp)}°
                  </span>
                  <span className="text-xs font-bold font-cairo text-amber-300">°{unit}</span>
                </div>

                <p className="text-sm font-bold font-cairo text-white/95 mt-1">{conditionStr}</p>

                <div className="flex items-center gap-2.5 mt-2 font-sans font-black text-xs sm:text-sm">
                  <div className="flex items-center gap-1 text-rose-400 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-rose-400/30 shadow-xs" title="الحرارة العظمى">
                    <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{displayTemp(rawTempMax)}°</span>
                  </div>
                  <div className="flex items-center gap-1 text-sky-300 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-sky-300/30 shadow-xs" title="الحرارة الصغرى">
                    <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{displayTemp(rawTempMin)}°</span>
                  </div>
                </div>
              </div>

              <Interactive3DWeatherIllustration 
                weatherCode={weatherCode} 
                isNight={periodInfo.isNight} 
                className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg" 
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/20 text-xs font-cairo">
              <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-white/75 block">احتمال الأمطار</span>
                  <span className="font-black font-sans text-white text-xs">{precipProb}%</span>
                </div>
              </div>

              <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <Wind className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-white/75 block">سرعة الرياح</span>
                  <span className="font-black font-sans text-white text-xs">{windSpeed} م/ث</span>
                </div>
              </div>

              <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-white/75 block">الرطوبة النسبية</span>
                  <span className="font-black font-sans text-white text-xs">{humidity}%</span>
                </div>
              </div>

              <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-white/75 block">الضغط الجوي</span>
                  <span className="font-black font-sans text-white text-xs">{pressure} hPa</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. EXTENDED DAILY FORECAST (توقعات الـ 7 أيام) */}
        <div className="rounded-[28px] p-5 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-cairo text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              توقعات الطقس للأيام الـ 7 القادمة
            </h2>
            <span className="text-[11px] font-bold text-indigo-600 font-cairo">تحديث يومي مستمر</span>
          </div>

          <div className="space-y-2">
            {forecastData?.list?.map((item: any, idx: number) => {
              const dayDate = new Date(item.dt * 1000);
              const dayName = idx === 0 ? "اليوم" : dayDate.toLocaleDateString('ar-YE', { weekday: 'long' });
              const dateShort = dayDate.toLocaleDateString('ar-YE', { month: 'numeric', day: 'numeric' });
              const wCode = item.weather?.[0]?.id || 801;
              const dPop = Math.round((item.pop || 0) * 100);

              return (
                <motion.div
                  key={idx}
                  onClick={() => openDayDetailModal(item)}
                  whileHover={{ scale: 1.015, x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative rounded-2xl p-3.5 bg-slate-50/90 border border-slate-200/70 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between overflow-hidden group shadow-xs hover:shadow-md"
                >
                  {/* Dynamic Weather Day Card Background Effect */}
                  <WeatherBackgroundEffect weatherCode={wCode} isNight={false} className="opacity-25 pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-3">
                    <ForecastIcon3D weatherId={wCode} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-cairo">{dayName}</h4>
                      <p className="text-[10px] text-slate-500 font-cairo">{dateShort} • {item.weather?.[0]?.description}</p>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-4">
                    {dPop > 15 && (
                      <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 flex items-center gap-1">
                        <CloudRain className="w-3 h-3" />
                        {dPop}%
                      </span>
                    )}
                    <div className="text-left font-sans">
                      <span className="text-sm font-black text-red-600">{displayTemp(item.main?.temp_max)}°</span>
                      <span className="text-xs text-slate-400 font-bold mx-1">/</span>
                      <span className="text-xs font-bold text-sky-600">{displayTemp(item.main?.temp_min)}°</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>




        {/* TAB 4: DESIGN SYSTEM & TECHNICAL SPECIFICATION GUIDE */}
        {activeTab === "design" && (
          <div className="rounded-[28px] p-6 bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black font-cairo text-purple-400 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-400" />
                  دليل نظام التصميم والتقرير الفني (UI Kit & Architecture)
                </h2>
                <p className="text-xs text-slate-400 font-cairo mt-1">المواصفات الفنية المعتمدة لقسم الطقس</p>
              </div>
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                إصدار v2.5 الفاخر
              </span>
            </div>

            {/* Philosophy */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-cairo text-sky-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                1. فلسفة التصميم (Design Philosophy)
              </h3>
              <p className="text-xs text-slate-300 font-cairo leading-relaxed bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                تعتمد التجربة على المزاوجة بين الخلفيات الديناميكية التفاعلية التي تحاكي حالة الطقس الفعلية وفترة اليوم الزمنية (الفجر، الصباح، الظهيرة، العصر، المغرب، المساء، الليل)، مع طبقات شفافة لضمان الوضوح البصري المطلق للنصوص والأرقام القياسية بتباين عالي يطابق معايير WCAG AA.
              </p>
            </div>

            {/* Color System */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-cairo text-amber-400 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                2. نظام الألوان والفترات الزمنية (Color & Time Period System)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-cairo">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-700/50">
                  <span className="font-bold text-purple-200 block">الفجر (Dawn)</span>
                  <span className="text-[10px] text-purple-300">أرجواني دافئ + ضباب خفيف</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-sky-600 to-amber-500 border border-amber-500/50">
                  <span className="font-bold text-white block">الصباح (Morning)</span>
                  <span className="text-[10px] text-amber-100">أزرق سماوي + أشعة ذهبية</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 border border-sky-400/50">
                  <span className="font-bold text-white block">الظهيرة (Noon)</span>
                  <span className="text-[10px] text-sky-100">شمس ساطعة فوق الرأس</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-600 to-blue-800 border border-amber-600/50">
                  <span className="font-bold text-amber-100 block">العصر (Afternoon)</span>
                  <span className="text-[10px] text-amber-200">ضوء دافئ مائل</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-purple-900 border border-red-500/50">
                  <span className="font-bold text-rose-200 block">المغرب (Sunset)</span>
                  <span className="text-[10px] text-rose-300">تدرج أحمر وأرجواني شفق</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 border border-indigo-800/50">
                  <span className="font-bold text-indigo-200 block">الليل (Night)</span>
                  <span className="text-[10px] text-indigo-300">سماء ليلية مع نجوم وقمر</span>
                </div>
              </div>
            </div>

            {/* Technical Architecture */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-cairo text-emerald-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                3. البنية التقنية والتزامن (Data Architecture & Sync)
              </h3>
              <p className="text-xs text-slate-300 font-cairo leading-relaxed bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                تعتمد جميع بطاقات الطقس في الهيدر والصفحات الرئيسية والتفصيلية بيانات طقس دقيقة مع تزامن فوري في التخزين المحلي وأحداث متصفح مخصصة (<code className="text-amber-300">weather_updated</code>).
              </p>
            </div>
          </div>
        )}

      </div>


      {/* FULL METRICS DETAIL MODAL */}
      <AnimatePresence>
        {activeModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black font-cairo text-slate-800">{activeModalData.title}</h3>
                  <p className="text-xs text-sky-600 font-bold font-cairo mt-0.5">{activeModalData.subtitle}</p>
                </div>
                <button
                  onClick={() => setActiveModalData(null)}
                  className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeModalData.description && (
                <p className="text-xs font-cairo text-slate-600 bg-sky-50/80 p-3.5 rounded-2xl border border-sky-100 leading-relaxed">
                  {activeModalData.description}
                </p>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeModalData.metrics.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${m.color || "text-slate-600"}`} />
                        <span className="text-[10px] font-bold text-slate-500 font-cairo">{m.label}</span>
                      </div>
                      <span className="text-sm font-black font-sans text-slate-800 mt-1">{m.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveModalData(null)}
                  className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs font-cairo hover:bg-slate-800 transition-colors shadow-md"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED DAY HOURLY FORECAST FULL PAGE VIEW */}
      <AnimatePresence>
        {selectedDayModalData && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-[#0F172A] text-white overflow-y-auto p-4 sm:p-6 md:p-8 select-none font-sans"
            dir="rtl"
          >
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
              <WeatherBackgroundEffect
                weatherCode={selectedDayModalData.dayItem?.weather?.[0]?.id || 800}
                isNight={false}
                dtSec={selectedDayModalData.dayItem?.dt}
              />
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xl" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-5 pb-16">
              {/* Sticky Top Bar / Header with Prominent Back Button */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 sticky top-0 bg-[#0F172A]/90 backdrop-blur-xl z-30 pt-2 -mx-2 px-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedDayModalData(null)}
                    className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 text-xs font-bold font-cairo shadow-md cursor-pointer"
                    title="العودة للصفحة الرئيسية"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                    <span className="hidden sm:inline">العودة للرئيسية</span>
                  </button>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black font-cairo text-white flex items-center gap-2">
                      توقعات الساعات القادمة ليوم {selectedDayModalData.dayName}
                    </h2>
                    <p className="text-xs text-sky-400 font-bold font-cairo mt-0.5">
                      {selectedDayModalData.dateFormatted} • حالة الطقس المباشرة
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full font-cairo shrink-0">
                  تفاصيل الساعات
                </span>
              </div>

              {/* Day Summary Banner */}
              <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-5 rounded-3xl border border-indigo-500/30 flex items-center justify-between flex-wrap gap-3 shadow-lg">
                <div>
                  <span className="text-[11px] font-bold text-indigo-300 block font-cairo">الملخص اليومي المتوقع</span>
                  <span className="text-base font-bold font-cairo text-white mt-0.5 block">
                    {selectedDayModalData.dayItem?.weather?.[0]?.description || "حالة جوية مستقرة"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 font-sans font-black text-sm sm:text-base">
                  <div className="flex items-center gap-1.5 text-rose-400 bg-black/40 px-3 py-1 rounded-full border border-rose-400/40" title="الحرارة العظمى">
                    <ArrowUp className="w-4 h-4 stroke-[3]" />
                    <span>{displayTemp(selectedDayModalData.dayItem?.main?.temp_max)}°</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-300 bg-black/40 px-3 py-1 rounded-full border border-sky-300/40" title="الحرارة الصغرى">
                    <ArrowDown className="w-4 h-4 stroke-[3]" />
                    <span>{displayTemp(selectedDayModalData.dayItem?.main?.temp_min)}°</span>
                  </div>
                </div>
              </div>

              {/* Sub-Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold font-cairo text-slate-300">
                  جدول أوقات اليوم المتوقعة ({selectedDayModalData.hourlyList.length} أوقات)
                </span>
                <span className="text-[11px] font-extrabold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 font-cairo">
                  تحديث حقيقي
                </span>
              </div>

              {/* Hourly Cards Vertical List */}
              <div className="flex flex-col gap-3.5">
                {selectedDayModalData.hourlyList.map((hour: any, idx: number) => {
                  const hourDate = new Date(hour.dt * 1000);
                  const timeFormatted = hourDate.toLocaleTimeString('ar-YE', { hour: 'numeric', hour12: true });
                  const wCode = hour.weather?.[0]?.id || 800;
                  const hPeriod = getTimePeriod(hour.dt);
                  const hCategory = getCategoryFromCode(wCode, hPeriod.isNight);
                  const hTheme = getWeatherTheme(hCategory, hPeriod);
                  const hPop = Math.round((hour.pop || 0) * 100);
                  const hTemp = hour.main?.temp ?? hour.temp;
                  
                  let hMax = hour.main?.temp_max;
                  let hMin = hour.main?.temp_min;
                  if (hMax === undefined || hMin === undefined || hMax === hMin) {
                    const base = hTemp ?? 25;
                    hMax = base + 1;
                    hMin = base - 1;
                  }

                  const hWindSpeed = hour.wind?.speed ?? hour.wind_speed ?? 3.5;
                  const hWindDeg = hour.wind?.deg ?? hour.wind_deg;
                  const hWindDir = getWindDirectionArabic(hWindDeg);
                  const hHumidity = hour.main?.humidity ?? hour.humidity ?? 60;
                  const hPressure = hour.main?.pressure ?? hour.pressure ?? 1012;
                  const hDesc = hour.weather?.[0]?.description || parseWmoCode(wCode, hPeriod.isNight).text;

                  return (
                    <div
                      key={idx}
                      className={`relative rounded-3xl p-4 sm:p-5 text-white shadow-md border overflow-hidden bg-gradient-to-r ${hTheme.theme}`}
                    >
                      <WeatherBackgroundEffect 
                        weatherCode={wCode} 
                        isNight={hPeriod.isNight} 
                        dtSec={hour.dt}
                        className="opacity-40 pointer-events-none" 
                      />
                      <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] pointer-events-none" />

                      <div className="relative z-10 flex flex-col gap-3">
                        {/* Top Row */}
                        <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-sans bg-black/35 backdrop-blur-md px-3 py-1 rounded-full border border-white/25 text-white">
                              {timeFormatted}
                            </span>
                            <span className="text-[11px] font-bold font-cairo bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-white/95">
                              فترة {hPeriod.labelAr}
                            </span>
                          </div>

                          <span className="text-xs font-bold font-cairo text-amber-200 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                            {hDesc}
                          </span>
                        </div>

                        {/* Middle Row: Temp & Max/Min Colored Numbers with Icons ONLY */}
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight">
                                {displayTemp(hTemp)}°
                              </span>
                              <span className="text-xs font-bold font-cairo text-amber-300">°{unit}</span>
                            </div>

                            {/* Max/Min Colored Numbers with Icons ONLY - NO TEXT LABELS */}
                            <div className="flex items-center gap-2 mt-1.5 font-sans font-black text-xs sm:text-sm">
                              <div className="flex items-center gap-1 text-rose-400 bg-black/30 px-2.5 py-0.5 rounded-full border border-rose-400/30" title="الحرارة العظمى">
                                <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{displayTemp(hMax)}°</span>
                              </div>
                              <div className="flex items-center gap-1 text-sky-300 bg-black/30 px-2.5 py-0.5 rounded-full border border-sky-300/30" title="الحرارة الصغرى">
                                <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{displayTemp(hMin)}°</span>
                              </div>
                            </div>
                          </div>

                          <Interactive3DWeatherIllustration 
                            weatherCode={wCode} 
                            isNight={hPeriod.isNight} 
                            className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" 
                          />
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/20 text-xs font-cairo">
                          <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                            <CloudRain className="w-4 h-4 text-sky-300 shrink-0" />
                            <div>
                              <span className="text-[10px] text-white/75 block">احتمال الأمطار</span>
                              <span className="font-black font-sans text-white text-xs">{hPop}%</span>
                            </div>
                          </div>

                          <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                            <Wind className="w-4 h-4 text-emerald-300 shrink-0" />
                            <div>
                              <span className="text-[10px] text-white/75 block">الرياح ({hWindDir})</span>
                              <span className="font-black font-sans text-white text-xs">{hWindSpeed} م/ث</span>
                            </div>
                          </div>

                          <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-300 shrink-0" />
                            <div>
                              <span className="text-[10px] text-white/75 block">الرطوبة النسبية</span>
                              <span className="font-black font-sans text-white text-xs">{hHumidity}%</span>
                            </div>
                          </div>

                          <div className="bg-black/25 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-purple-300 shrink-0" />
                            <div>
                              <span className="text-[10px] text-white/75 block">الضغط الجوي</span>
                              <span className="font-black font-sans text-white text-xs">{hPressure} hPa</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 pb-8">
                <button
                  onClick={() => setSelectedDayModalData(null)}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xs sm:text-sm font-cairo hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  <span>إغلاق هذه الصفحة والعودة لتفاصيل الطقس</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default WeatherDetail;
