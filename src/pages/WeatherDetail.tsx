import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, Eye, Gauge, Wind, Droplets, Calendar, 
  ArrowUp, ArrowDown, Menu, RefreshCw, AlertCircle, Sparkles, Check, CloudRain
} from "lucide-react";

import { fetchOpenMeteoData } from "../utils/weatherApi";

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

export const getWeatherTheme = (category: string, isNight: boolean) => {
  if (isNight) {
    if (category.includes("rain") || category === "thunderstorm" || category === "hail") {
      return {
        theme: "from-[#020617] via-[#0F172A] to-[#1E3A8A] border-sky-500/30",
        text: "text-white",
        subtext: "text-sky-200/90",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else if (category === "fog" || category === "mist" || category === "dust" || category === "sandstorm") {
      return {
        theme: "from-[#1E1E24] via-[#2D2D3A] to-[#48485E] border-amber-500/30",
        text: "text-amber-50",
        subtext: "text-amber-200/90",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else if (category === "clear" || category === "clear-after-rain") {
      return {
        theme: "from-[#03071E] via-[#0F172A] to-[#1E1B4B] border-indigo-400/30",
        text: "text-white",
        subtext: "text-indigo-200/90",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else if (category.includes("cloud") || category === "overcast" || category === "windy") {
      return {
        theme: "from-[#0F172A] via-[#1E293B] to-[#334155] border-slate-600/30",
        text: "text-white",
        subtext: "text-slate-200/90",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else if (category === "snow" || category === "frost") {
      return {
        theme: "from-[#0F172A] via-[#1E293B] to-[#312E81] border-sky-400/30",
        text: "text-white",
        subtext: "text-sky-200/90",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    } else {
      return {
        theme: "from-[#0F172A] via-[#1E293B] to-[#312E81] border-indigo-500/30",
        text: "text-white",
        subtext: "text-indigo-200/90",
        maxTemp: "text-red-300",
        minTemp: "text-sky-300"
      };
    }
  } else {
    if (category.includes("rain") || category === "thunderstorm" || category === "hail") {
      return {
        theme: "from-[#1E3A8A] via-[#2563EB] to-[#0284C7] border-blue-400/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    } else if (category === "fog" || category === "mist") {
      return {
        theme: "from-[#475569] via-[#64748B] to-[#94A3B8] border-slate-300/30",
        text: "text-white",
        subtext: "text-slate-100",
        maxTemp: "text-red-200",
        minTemp: "text-sky-200"
      };
    } else if (category === "dust" || category === "sandstorm") {
      return {
        theme: "from-[#B45309] via-[#D97706] to-[#F59E0B] border-amber-400/30",
        text: "text-white",
        subtext: "text-amber-100",
        maxTemp: "text-red-200",
        minTemp: "text-sky-200"
      };
    } else if (category === "clear" || category === "clear-after-rain") {
      return {
        theme: "from-[#D97706] via-[#B45309] to-[#1E3A8A] border-amber-500/20",
        text: "text-white",
        subtext: "text-amber-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    } else if (category.includes("cloud") || category === "overcast" || category === "windy") {
      return {
        theme: "from-[#475569] via-[#64748B] to-[#94A3B8] border-slate-400/30",
        text: "text-white",
        subtext: "text-slate-100",
        maxTemp: "text-red-200",
        minTemp: "text-sky-200"
      };
    } else if (category === "snow" || category === "frost") {
      return {
        theme: "from-[#0284C7] via-[#2563EB] to-[#38BDF8] border-sky-300/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-red-200",
        minTemp: "text-sky-200"
      };
    } else {
      return {
        theme: "from-[#0284C7] via-[#2563EB] to-[#1D4ED8] border-sky-400/30",
        text: "text-white",
        subtext: "text-sky-100",
        maxTemp: "text-red-300",
        minTemp: "text-sky-200"
      };
    }
  }
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

// 3D DYNAMIC INTERACTIVE WEATHER ILLUSTRATION
// Changes smoothly according to actual weather condition and time of day (Is Night / Day)


// --- REALISTIC CELESTIAL & ATMOSPHERIC GRAPHICS FOR WEATHER CARDS ---
// Fixed stationary sun - natural proportional scale (~24px to 28px) with radiant solar core
const SunElement = ({ dimmed = false }: { dimmed?: boolean }) => (
  <div className="absolute top-3 right-4 sm:top-4 sm:right-6 pointer-events-none z-10 select-none">
    {/* Soft radiant static solar aura */}
    <div className={`absolute -inset-2.5 rounded-full blur-md bg-amber-300/40 ${dimmed ? 'opacity-25' : 'opacity-75'}`} />
    {/* Photorealistic Sun Body */}
    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFFFFF] via-[#FDE047] to-[#F59E0B] shadow-[0_0_18px_rgba(251,191,36,0.9)] border border-amber-100 ${dimmed ? 'opacity-40' : 'opacity-100'}`} />
  </div>
);

// Fixed stationary moon - realistic pearl silver colors & natural crater surface shading
const MoonElement = ({ dimmed = false }: { dimmed?: boolean }) => (
  <div className="absolute top-3 right-4 sm:top-4 sm:right-6 pointer-events-none z-10 select-none">
    {/* Soft silver/white static aura glow */}
    <div className={`absolute -inset-2.5 rounded-full blur-md bg-slate-100/35 ${dimmed ? 'opacity-20' : 'opacity-70'}`} />
    {/* Photorealistic Pearl Silver Moon Core */}
    <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#CBD5E1] shadow-[0_0_16px_rgba(255,255,255,0.95)] border border-white/95 ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
      {/* Real moon craters texture */}
      <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-300/45 blur-[0.2px]" />
      <div className="absolute bottom-1.5 left-1.5 w-1 h-1 rounded-full bg-slate-300/35 blur-[0.2px]" />
      <div className="absolute top-2.5 left-1 w-0.8 h-0.8 rounded-full bg-slate-300/30 blur-[0.2px]" />
    </div>
  </div>
);

// Photorealistic drifting cloud floating in front of Sun/Moon with volumetric soft shading
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
      <div
        className={`absolute -top-3 right-2.5 rounded-full ${
          isNight
            ? isHeavy ? "bg-slate-800/95" : "bg-slate-700/90"
            : isHeavy ? "bg-slate-300/95" : "bg-white"
        }`}
        style={{ width: `${32 * scale}px`, height: `${32 * scale}px` }}
      />
    </div>
  </motion.div>
);

// Photorealistic Jagged Branching Lightning Bolts & Rapid Background Flash Engine for Thunderstorms
const LightningBoltEffect = () => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[inherit]">
      {/* 1. Full-Card Rapid Strobe Background Flash (Drives instant illumination of background & dark storm clouds) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-cyan-100/90 via-sky-200/80 to-white/70 dark:from-white/90 dark:via-cyan-300/80 dark:to-sky-200/60 mix-blend-screen z-30"
        animate={{
          opacity: [
            0, 0, 0.95, 0.15, 0.85, 0.05, 0, 0, 
            0, 0.9, 0.1, 0, 0, 0, 0.75, 0.05, 0.8, 0, 0
          ],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "linear",
          times: [
            0, 0.12, 0.14, 0.16, 0.18, 0.22, 0.25, 0.45,
            0.5, 0.52, 0.54, 0.58, 0.75, 0.78, 0.8, 0.82, 0.84, 0.88, 1
          ],
        }}
      />

      {/* 2. Primary Jagged Branching Lightning Bolt 1 (Left Strike) */}
      <motion.svg
        viewBox="0 0 120 180"
        className="absolute -top-2 left-[12%] w-28 h-44 sm:w-36 sm:h-56 text-cyan-200 z-35 filter drop-shadow-[0_0_16px_rgba(56,189,248,1)] drop-shadow-[0_0_30px_rgba(255,255,255,1)]"
        animate={{
          opacity: [0, 0, 1, 0.15, 0.95, 0, 0, 0, 0, 0, 0, 0],
          scale: [0.95, 1, 1.05, 1, 1.02, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.12, 0.14, 0.16, 0.18, 0.22, 0.5, 0.7, 0.8, 0.9, 0.95, 1],
        }}
      >
        <path
          d="M 60 0 L 42 45 L 56 47 L 22 95 L 58 90 L 32 140 L 78 75 L 58 73 L 85 28 Z"
          fill="currentColor"
        />
        <path
          d="M 60 0 L 42 45 L 56 47 L 22 95 L 58 90 L 32 140 L 78 75 L 58 73 L 85 28 Z"
          fill="#FFFFFF"
          className="blur-[0.5px]"
        />
        <path
          d="M 42 45 L 20 70 L 28 71 L 12 95"
          stroke="rgba(186,230,253,0.9)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 58 90 L 75 110 L 70 111 L 82 130"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* 3. Secondary Jagged Branching Lightning Bolt 2 (Right Strike) */}
      <motion.svg
        viewBox="0 0 120 180"
        className="absolute top-1 right-[15%] w-24 h-40 sm:w-32 sm:h-52 text-white z-35 filter drop-shadow-[0_0_18px_rgba(255,255,255,1)] drop-shadow-[0_0_28px_rgba(6,182,212,0.9)]"
        animate={{
          opacity: [0, 0, 0, 0, 1, 0.1, 0.85, 0, 0, 0, 0, 0],
          scale: [0.95, 0.95, 0.95, 0.98, 1.04, 0.99, 1.02, 0.95, 0.95, 0.95, 0.95, 0.95],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.45, 0.49, 0.5, 0.52, 0.54, 0.57, 0.62, 0.8, 0.9, 0.95, 1],
        }}
      >
        <path
          d="M 70 0 L 48 40 L 62 42 L 30 85 L 62 82 L 40 130 L 82 65 L 64 63 L 92 22 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 48 40 L 28 65 L 35 66 L 18 90"
          stroke="rgba(56,189,248,0.9)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* 4. Center Distant Lightning Bolt 3 */}
      <motion.svg
        viewBox="0 0 100 150"
        className="absolute top-2 left-[48%] w-20 h-32 sm:w-28 sm:h-40 text-cyan-100 z-35 filter drop-shadow-[0_0_14px_rgba(186,230,253,0.9)]"
        animate={{
          opacity: [0, 0, 0, 0, 0, 0, 0, 0.9, 0.1, 0.8, 0],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.6, 0.7, 0.75, 0.78, 0.79, 0.8, 0.82, 0.84, 0.86, 0.9],
        }}
      >
        <path
          d="M 50 0 L 35 35 L 45 37 L 22 75 L 48 72 L 30 115 L 68 55 L 52 53 L 75 18 Z"
          fill="#E0F2FE"
        />
      </motion.svg>

      {/* 5. In-Cloud Glow / Sheet Lightning Radial Glow (Shines through dark storm clouds) */}
      <motion.div
        className="absolute -top-10 inset-x-0 h-3/4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-300/80 via-sky-400/50 to-transparent blur-xl z-15"
        animate={{
          opacity: [0.1, 0.2, 0.9, 0.2, 0.85, 0.1, 0.8, 0.15, 0.9, 0.1],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.1, 0.14, 0.17, 0.2, 0.48, 0.52, 0.55, 0.8, 1],
        }}
      />
    </div>
  );
};

// --- DYNAMIC WEATHER BACKGROUND EFFECTS ---
export const WeatherBackgroundEffect = ({ 
  weatherCode, 
  isNight,
  className = ""
}: { 
  weatherCode: number; 
  isNight: boolean;
  className?: string;
}) => {
  const category = getCategoryFromCode(weatherCode, isNight);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[inherit] w-full h-full select-none ${className}`}>
      
      {/* 1. SUNNY / CLEAR DAY OR CLEAR NIGHT */}
      {category === "clear" && (
        <div className="absolute inset-0 w-full h-full">
          {!isNight ? (
            <>
              <SunElement />
              <motion.div
                className="absolute -top-[35%] -right-[25%] w-[130%] h-[130%] bg-gradient-to-br from-amber-400/35 via-amber-300/20 to-transparent rounded-full blur-[60px]"
                animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.95, 0.7] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-[20%] -left-[15%] w-[70%] h-[70%] bg-orange-400/20 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <DriftingCloud top="15%" scale={0.6} duration={35} delay={0} isNight={false} isHeavy={false} zIndex={15} />
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 sm:w-1.5 h-1 sm:h-1.5 bg-amber-400 dark:bg-amber-200 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                  style={{ top: `${12 + (i * 7)}%`, left: `${8 + (i * 8)}%` }}
                  animate={{ y: ["0px", "-14px", "0px"], opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.5 }}
                />
              ))}
            </>
          ) : (
            <>
              <MoonElement />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-sky-950/20" />
              <div className="absolute inset-0 w-full h-full">
                {[...Array(28)].map((_, i) => {
                  const x = ((i * 13) % 94) + 3;
                  const y = ((i * 19) % 92) + 4;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                      style={{ top: `${y}%`, left: `${x}%` }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.75, 1.3, 0.75] }}
                      transition={{ duration: 1.8 + (i % 4) * 0.6, repeat: Infinity, ease: "easeInOut", delay: (i % 6) * 0.35 }}
                    />
                  );
                })}
              </div>
              <motion.div
                className="absolute w-16 h-[1.5px] bg-gradient-to-r from-transparent via-white to-sky-400 rounded-full rotate-[-25deg]"
                style={{ top: "15%", left: "70%" }}
                animate={{ x: ["0px", "-180px"], y: ["0px", "90px"], opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 5.5, ease: "easeOut" }}
              />
            </>
          )}
        </div>
      )}

      {/* 2. PARTLY CLOUDY */}
      {category === "partly-cloudy" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement /> : <SunElement />}
          {isNight && (
            <div className="absolute inset-0 w-full h-full z-0">
              {[...Array(14)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                  style={{ top: `${(i * 17) % 85}%`, left: `${(i * 23) % 90}%` }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          )}
          <DriftingCloud top="4%" scale={1.1} duration={20} delay={0} isNight={isNight} isHeavy={false} zIndex={20} />
          <DriftingCloud top="12%" scale={1.3} duration={26} delay={8} isNight={isNight} isHeavy={false} zIndex={20} />
          <DriftingCloud top="20%" scale={0.9} duration={22} delay={15} isNight={isNight} isHeavy={false} zIndex={20} />
        </div>
      )}

      {/* 3. MOSTLY CLOUDY */}
      {category === "mostly-cloudy" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <DriftingCloud top="-2%" scale={1.4} duration={16} delay={0} isNight={isNight} isHeavy={false} zIndex={20} />
          <DriftingCloud top="6%" scale={1.7} duration={21} delay={4} isNight={isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="14%" scale={1.2} duration={18} delay={9} isNight={isNight} isHeavy={false} zIndex={20} />
          <DriftingCloud top="22%" scale={1.5} duration={25} delay={14} isNight={isNight} isHeavy={true} zIndex={20} />
        </div>
      )}

      {/* 4. OVERCAST / CLOUDY */}
      {(category === "overcast" || category === "cloudy") && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <DriftingCloud top="0%" scale={1.6} duration={14} delay={0} isNight={isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="8%" scale={1.9} duration={18} delay={3} isNight={isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="4%" scale={1.4} duration={12} delay={7} isNight={isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="16%" scale={1.7} duration={22} delay={11} isNight={isNight} isHeavy={true} zIndex={20} />
          <DriftingCloud top="-5%" scale={2.1} duration={25} delay={15} isNight={isNight} isHeavy={true} zIndex={20} />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-400/20 via-slate-300/10 to-transparent dark:from-slate-900/40 blur-xl z-25" />
        </div>
      )}

      {/* 5. FOG (ضباب) */}
      {category === "fog" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <motion.div
            className="absolute inset-0 bg-slate-300/35 dark:bg-slate-700/40 blur-2xl"
            animate={{ opacity: [0.6, 0.9, 0.6], x: ["-10%", "10%", "-10%"] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/40 dark:via-slate-600/35 to-transparent blur-xl"
            animate={{ x: ["-20%", "20%", "-20%"] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* 6. MIST (شبورة) */}
      {category === "mist" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <motion.div
            className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-slate-200/40 via-slate-100/20 to-transparent dark:from-slate-800/50 dark:via-slate-700/20 blur-md z-15"
            animate={{ opacity: [0.4, 0.75, 0.4], y: ["0px", "-8px", "0px"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* 7. WINDY (رياح قوية) */}
      {category === "windy" && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {isNight ? <MoonElement /> : <SunElement />}
          <DriftingCloud top="2%" scale={1.2} duration={9} delay={0} isNight={isNight} isHeavy={false} zIndex={20} />
          <DriftingCloud top="12%" scale={1.5} duration={11} delay={3} isNight={isNight} isHeavy={true} zIndex={20} />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              style={{
                top: `${15 + (i * 10)}%`,
                width: `${120 + (i * 30)}px`,
                left: "-30%"
              }}
              animate={{ x: ["0%", "450%"] }}
              transition={{ duration: 1.2 + (i % 3) * 0.3, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
            />
          ))}
        </div>
      )}

      {/* 8. BLOWING DUST (أتربة مثارة) */}
      {category === "dust" && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-amber-600/15 dark:bg-amber-900/25 blur-md" />
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-amber-400/80 rounded-full blur-[0.5px] shadow-[0_0_4px_rgba(217,119,6,0.8)]"
              style={{ top: `${(i * 12) % 90}%`, left: `${(i * 15) % 95}%` }}
              animate={{ x: ["0px", "120px", "0px"], y: ["0px", "-15px", "0px"], opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            />
          ))}
        </div>
      )}

      {/* 9. SANDSTORM (عاصفة رملية) */}
      {category === "sandstorm" && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-700/40 via-amber-600/30 to-amber-800/40 blur-xl" />
          <DriftingCloud top="-5%" scale={2.2} duration={8} delay={0} isNight={true} isHeavy={true} zIndex={20} />
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full"
              style={{ top: `${10 + (i * 6)}%`, width: "160px", left: "-40%" }}
              animate={{ x: ["0%", "500%"] }}
              transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* 10. LIGHT RAIN / LIGHT SHOWERS */}
      {category === "light-rain" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <DriftingCloud top="-8%" scale={1.8} duration={24} delay={0} isNight={isNight} isHeavy={true} zIndex={20} />
          <div className="absolute inset-0 flex justify-between w-full h-full overflow-hidden z-25">
            {[...Array(22)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-sky-300 to-transparent rounded-full"
                style={{ left: `${(i / 22) * 100}%`, height: '30%', top: '-30%' }}
                animate={{ y: ["0%", "450%"], opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.7 + (i % 4) * 0.1, repeat: Infinity, ease: "linear", delay: (i % 5) * 0.2 }}
              />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-sky-400/15 to-transparent blur-sm z-15" />
        </div>
      )}

      {/* 11. MODERATE RAIN */}
      {category === "rain" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <DriftingCloud top="-10%" scale={2.2} duration={22} delay={0} isNight={isNight} isHeavy={true} zIndex={20} />
          <div className="absolute inset-0 flex justify-between w-full h-full overflow-hidden z-25">
            {[...Array(34)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[2px] bg-gradient-to-b from-transparent via-sky-400 dark:via-sky-200 to-transparent rounded-full shadow-[0_0_4px_rgba(14,165,233,0.5)]"
                style={{ left: `${(i / 34) * 100}%`, height: '38%', top: '-38%' }}
                animate={{ y: ["0%", "420%"], opacity: [0, 1, 0] }}
                transition={{ duration: 0.5 + (i % 5) * 0.1, repeat: Infinity, ease: "linear", delay: (i % 7) * 0.15 }}
              />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-sky-500/20 via-sky-400/10 to-transparent blur-md z-15" />
        </div>
      )}

      {/* 12. HEAVY RAIN */}
      {category === "heavy-rain" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <DriftingCloud top="-10%" scale={2.5} duration={18} delay={0} isNight={true} isHeavy={true} zIndex={20} />
          <div className="absolute inset-0 flex justify-between w-full h-full overflow-hidden z-25">
            {[...Array(48)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[2.5px] bg-gradient-to-b from-transparent via-cyan-300 to-transparent rounded-full shadow-[0_0_6px_rgba(6,182,212,0.7)]"
                style={{ left: `${(i / 48) * 100}%`, height: '48%', top: '-48%' }}
                animate={{ y: ["0%", "380%"], opacity: [0, 1, 0] }}
                transition={{ duration: 0.38 + (i % 4) * 0.08, repeat: Infinity, ease: "linear", delay: (i % 8) * 0.1 }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] pointer-events-none z-20" />
        </div>
      )}

      {/* 13. THUNDERSTORM (عاصفة رعدية مع صواعق برق ومضات إضاءة وأمطار غريزة) */}
      {category === "thunderstorm" && (
        <div className="absolute inset-0 w-full h-full">
          {/* Dimmed Celestial Body behind dark clouds */}
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}

          {/* Dark Storm Clouds Floating in Front */}
          <DriftingCloud top="-8%" scale={2.5} duration={14} delay={0} isNight={true} isHeavy={true} zIndex={20} />
          <DriftingCloud top="4%" scale={2.1} duration={18} delay={5} isNight={true} isHeavy={true} zIndex={20} />

          {/* Torrential Heavy Rain Drops */}
          <div className="absolute inset-0 w-full h-full overflow-hidden z-25">
            {[...Array(52)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[2px] bg-gradient-to-b from-transparent via-cyan-300 dark:via-cyan-200 to-transparent rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)] rotate-[-8deg]"
                style={{ left: `${(i / 52) * 105 - 2}%`, height: '48%', top: '-48%' }}
                animate={{ y: ["0%", "420%"], opacity: [0, 1, 0] }}
                transition={{ duration: 0.35 + (i % 5) * 0.08, repeat: Infinity, ease: "linear", delay: (i % 9) * 0.1 }}
              />
            ))}
          </div>

          {/* Realistic Lightning Bolts & Strobe Flashes Engine */}
          <LightningBoltEffect />

          {/* Wet Ground Splash Reflection Glow */}
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-cyan-400/30 via-sky-500/15 to-transparent blur-md z-15" />
        </div>
      )}

      {/* 14. HAIL (برد وعواصف) */}
      {category === "hail" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement dimmed={true} /> : <SunElement dimmed={true} />}
          <DriftingCloud top="-10%" scale={2.2} duration={20} delay={0} isNight={true} isHeavy={true} zIndex={20} />
          
          <div className="absolute inset-0 w-full h-full overflow-hidden z-25">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                style={{ left: `${(i * 14) % 95}%`, top: '-10%' }}
                animate={{ y: ["0%", "500%"], x: ["0px", "-20px"] }}
                transition={{ duration: 0.5 + (i % 3) * 0.1, repeat: Infinity, ease: "easeIn", delay: i * 0.15 }}
              />
            ))}
          </div>

          {/* Lightning Flashes for Hail Storms */}
          <LightningBoltEffect />
        </div>
      )}

      {/* 15. SNOW (ثلوج) */}
      {category === "snow" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement /> : <SunElement />}
          <DriftingCloud top="-5%" scale={1.5} duration={30} delay={0} isNight={isNight} isHeavy={false} zIndex={20} />
          <div className="absolute inset-0 w-full h-full overflow-hidden z-25">
            {[...Array(32)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] ${
                  i % 3 === 0 ? "w-2 h-2" : i % 2 === 0 ? "w-1.5 h-1.5" : "w-1 h-1"
                }`}
                style={{ left: `${(i * 11) % 96}%`, top: '-10%' }}
                animate={{
                  y: ["0%", "450%"],
                  x: ["-10px", "10px", "-10px"],
                  opacity: [0.3, 0.95, 0.2]
                }}
                transition={{
                  duration: 3 + (i % 5) * 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 16. FROST (صقيع) */}
      {category === "frost" && (
        <div className="absolute inset-0 w-full h-full">
          {isNight ? <MoonElement /> : <SunElement />}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 via-transparent to-sky-300/25 border-2 border-sky-200/30 rounded-[inherit] z-10" />
          <motion.div
            className="absolute inset-0 bg-sky-100/15 blur-lg"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* 17. CLEAR AFTER RAIN (صحو بعد المطر) */}
      {category === "clear-after-rain" && (
        <div className="absolute inset-0 w-full h-full">
          <SunElement />
          <motion.div
            className="absolute top-2 inset-x-8 h-20 bg-gradient-to-r from-red-500/25 via-amber-400/25 via-green-400/25 via-sky-400/25 to-purple-500/25 rounded-full blur-xs z-15"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <DriftingCloud top="10%" scale={0.8} duration={30} delay={0} isNight={false} isHeavy={false} zIndex={20} />
        </div>
      )}

    </div>
  );
};
export const Interactive3DWeatherIllustration = ({ 
  weatherCode = 801, 
  isNight = false,
  className = "w-32 h-32 xs:w-36 xs:h-36 sm:w-44 sm:h-44 md:w-52 md:h-52"
}: { 
  weatherCode?: number; 
  isNight?: boolean;
  className?: string;
}) => {
  // Determine weather category
  const weatherCategory = useMemo(() => {
    return getCategoryFromCode(weatherCode, isNight);
  }, [weatherCode, isNight]);

  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotate: isNight ? -3 : 3 }}
      whileTap={{ scale: 0.96 }}
      className={`relative flex items-center justify-center shrink-0 drop-shadow-2xl select-none cursor-pointer transition-transform ${className}`}
      title="رسوم بيانية ثلاثية الأبعاد تفاعلية"
    >
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <defs>
          {/* Sun Gradients */}
          <radialGradient id="sun3DGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF59D" />
            <stop offset="45%" stopColor="#FBC02D" />
            <stop offset="85%" stopColor="#F57C00" />
            <stop offset="100%" stopColor="#E65100" />
          </radialGradient>

          {/* Moon Gradients */}
          <linearGradient id="moon3DGlow" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E0E7FF" />
            <stop offset="85%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          {/* Cloud Gradients */}
          <linearGradient id="cloudFrontGrad" x1="20" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="cloudBackGrad" x1="10" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <linearGradient id="cloudStormGrad" x1="10" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Filters */}
          <filter id="auraGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur" />
          </filter>

          <filter id="cloudShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. SUN OR MOON BASE GRAPHIC */}
        {!isNight ? (
          /* DAYTIME SUN */
          <g>
            {/* Sun Aura */}
            <motion.circle 
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              cx="75" cy="45" r="32" 
              fill="#FFA726" 
              filter="url(#auraGlow)" 
            />

            {/* Sun Pulsing Rays */}
            <motion.g 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "75px 45px" }}
              stroke="#FFB74D" 
              strokeWidth="3" 
              strokeLinecap="round" 
              opacity="0.85"
            >
              <line x1="75" y1="8" x2="75" y2="2" />
              <line x1="105" y1="15" x2="110" y2="10" />
              <line x1="115" y1="45" x2="121" y2="45" />
              <line x1="105" y1="75" x2="110" y2="80" />
              <line x1="75" y1="82" x2="75" y2="88" />
              <line x1="45" y1="75" x2="40" y2="80" />
              <line x1="35" y1="45" x2="29" y2="45" />
              <line x1="45" y1="15" x2="40" y2="10" />
            </motion.g>

            {/* 3D Sun Sphere */}
            <circle cx="75" cy="45" r="26" fill="url(#sun3DGlow)" />
            <circle cx="67" cy="37" r="7" fill="#FFFFFF" opacity="0.65" />
          </g>
        ) : (
          /* NIGHTTIME MOON & STARS */
          <g>
            {/* Moon Aura */}
            <motion.circle 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              cx="75" cy="45" r="30" 
              fill="#818CF8" 
              filter="url(#auraGlow)" 
            />

            {/* Twinkling Stars */}
            <g fill="#A5B4FC">
              <motion.circle 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 2, repeat: Infinity }} 
                cx="30" cy="20" r="2" 
              />
              <motion.circle 
                animate={{ opacity: [0.8, 0.2, 0.8] }} 
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} 
                cx="48" cy="12" r="1.5" 
              />
              <motion.circle 
                animate={{ opacity: [0.3, 0.9, 0.3] }} 
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.8 }} 
                cx="105" cy="25" r="2.5" 
              />
            </g>

            {/* 3D Glossy Crescent Moon */}
            <path 
              d="M85 22C81.5 20.8 77.5 20 73 20C56.4 20 43 33.4 43 50C43 66.6 56.4 80 73 80C82 80 90.2 76 95.8 69.8C80.8 68.8 68.8 56.2 68.8 41C68.8 33.8 71.8 27.2 76.5 22.5C79.2 22 82.2 21.8 85 22Z" 
              fill="url(#moon3DGlow)" 
              filter="url(#cloudShadow)"
            />
            {/* Specular Highlight on Moon */}
            <circle cx="68" cy="38" r="3" fill="#FFFFFF" opacity="0.6" />
          </g>
        )}

        {/* 2. DYNAMIC CLOUDS BASED ON WEATHER CODE */}
        {(weatherCategory === "partly-cloudy" || weatherCategory === "cloudy" || weatherCategory === "rain" || weatherCategory === "thunderstorm" || weatherCategory === "fog") && (
          <g filter="url(#cloudShadow)">
            {/* Back Cloud if Heavy Overcast or Storm */}
            {(weatherCategory === "cloudy" || weatherCategory === "thunderstorm") && (
              <path 
                d="M 22 75 C 14 75 8 68 8 59 C 8 51 14 44 22 43 C 25 34 33 28 43 28 C 54 28 62 35 64 45 C 71 46 76 52 76 60 C 76 68 70 75 62 75 Z" 
                fill={weatherCategory === "thunderstorm" ? "url(#cloudStormGrad)" : "url(#cloudBackGrad)"} 
                opacity="0.85"
              />
            )}

            {/* Front Floating Glossy Cloud */}
            <motion.path 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              d="M 32 88 C 22 88 14 80 14 70 C 14 61 21 53 30 52 C 33 41 43 34 55 34 C 68 34 78 43 80 55 C 88 56 94 63 94 72 C 94 81 87 88 78 88 Z" 
              fill={weatherCategory === "thunderstorm" ? "url(#cloudStormGrad)" : "url(#cloudFrontGrad)"} 
            />

            {/* Cloud Soft Top Specular Rim */}
            <path 
              d="M 32 88 C 22 88 14 80 14 70 C 14 61 21 53 30 52 C 33 41 43 34 55 34 C 62 34 68 37 72 42 C 62 40 50 46 45 56 C 36 57 28 64 28 73 C 28 79 30 84 34 87 Z" 
              fill="#FFFFFF" 
              opacity="0.65" 
            />
          </g>
        )}

        {/* 3. ANIMATED RAIN DROPS */}
        {weatherCategory === "rain" && (
          <g>
            <motion.line 
              animate={{ y: [0, 10], opacity: [0, 1, 0] }} 
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              x1="32" y1="92" x2="28" y2="104" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" 
            />
            <motion.line 
              animate={{ y: [0, 10], opacity: [0, 1, 0] }} 
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2, ease: "linear" }}
              x1="52" y1="92" x2="48" y2="106" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" 
            />
            <motion.line 
              animate={{ y: [0, 10], opacity: [0, 1, 0] }} 
              transition={{ duration: 1, repeat: Infinity, delay: 0.4, ease: "linear" }}
              x1="72" y1="92" x2="68" y2="104" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" 
            />
          </g>
        )}

        {/* 4. ANIMATED THUNDERSTORM LIGHTNING BOLT */}
        {weatherCategory === "thunderstorm" && (
          <motion.path 
            animate={{ opacity: [0, 1, 0.2, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            d="M 52 82 L 40 98 H 50 L 44 114 L 62 94 H 50 Z" 
            fill="#FACC15" 
            stroke="#FEF08A" 
            strokeWidth="1.5"
            filter="drop-shadow(0 0 6px #F59E0B)"
          />
        )}

        {/* 5. MOUNTAIN DUST / FOG MIST LAYERS */}
        {weatherCategory === "fog" && (
          <g opacity="0.75" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round">
            <motion.line animate={{ x: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }} x1="20" y1="78" x2="88" y2="78" />
            <motion.line animate={{ x: [2, -2, 2] }} transition={{ duration: 4, repeat: Infinity }} x1="28" y1="86" x2="96" y2="86" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};

// 3D Forecast Condition Icon Generator
const ForecastIcon3D = ({ weatherId }: { weatherId?: number }) => {
  const isRainOrStorm = weatherId !== undefined && (
    (weatherId >= 200 && weatherId < 700) || 
    (weatherId >= 51 && weatherId <= 67) || 
    (weatherId >= 71 && weatherId <= 99)
  );

  if (isRainOrStorm) {
    return (
      <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
        <path d="M14 28 C10 28 7 25 7 21 C7 17.5 10 14.5 13.5 14 C15 10.5 18.5 8 23 8 C28 8 32 11.5 32.5 16.5 C35.5 17 38 19.5 38 23 C38 26.5 35 28 32 28 Z" fill="#94A3B8" />
        <line x1="16" y1="32" x2="13" y2="39" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="32" x2="21" y2="41" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="32" x2="29" y2="39" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (weatherId === 800 || weatherId === 0) {
    return (
      <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="12" fill="#F59E0B" />
        <g stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
          <line x1="24" y1="4" x2="24" y2="8" />
          <line x1="24" y1="40" x2="24" y2="44" />
          <line x1="4" y1="24" x2="8" y2="24" />
          <line x1="40" y1="24" x2="44" y2="24" />
          <line x1="10" y1="10" x2="13" y2="13" />
          <line x1="35" y1="35" x2="38" y2="38" />
          <line x1="10" y1="38" x2="13" y2="35" />
          <line x1="35" y1="13" x2="38" y2="10" />
        </g>
      </svg>
    );
  }

  if (weatherId === 3 || weatherId === 45 || weatherId === 48 || (weatherId !== undefined && weatherId >= 803 && weatherId <= 804)) {
    return (
      <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
        <path d="M14 32 C10 32 7 29 7 25 C7 21.5 10 18.5 13.5 18 C15 14.5 18.5 12 23 12 C28 12 32 15.5 32.5 20.5 C35.5 21 38 23.5 38 27 C38 30.5 35 32 32 32 Z" fill="#94A3B8" />
        <path d="M18 32 C14 32 11 29 11 25 C11 22 13 19.5 16 19 C17 16 20 14 24 14 C28 14 31 16.5 32 20.5 C35 21 37 23 37 26 C37 29 34.5 32 31.5 32 Z" fill="#CBD5E1" />
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
      <circle cx="30" cy="18" r="8" fill="#F59E0B" />
      <path d="M14 32 C10 32 7 29 7 25 C7 21.5 10 18.5 13.5 18 C15 14.5 18.5 12 23 12 C28 12 32 15.5 32.5 20.5 C35.5 21 38 23.5 38 27 C38 30.5 35 32 32 32 Z" fill="#CBD5E1" />
      <path d="M18 32 C14 32 11 29 11 25 C11 22 13 19.5 16 19 C17 16 20 14 24 14 C28 14 31 16.5 32 20.5 C35 21 37 23 37 26 C37 29 34.5 32 31.5 32 Z" fill="#F1F5F9" />
    </svg>
  );
};

export const WeatherDetail: React.FC = () => {
  const navigate = useNavigate();

  const [unit, setUnit] = useState<"C" | "F">("C");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  // Cached state initialization
  const [weatherData, setWeatherData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("cached_full_weather_data");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [forecastData, setForecastData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("cached_full_forecast_data");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(!weatherData);
  const [error, setError] = useState<string | null>(null);

  // FETCH ACCURATE LIVE WEATHER FOR TAIZ YEMEN (Dual-source fallback guaranteed accuracy)
  const fetchWeather = async () => {
    try {
      if (!weatherData) setLoading(true);
      setIsRefreshing(true);

      const omData = await fetchOpenMeteoData();
      const current = omData.current;
      const daily = omData.daily;

      const parsedCondition = parseWmoCode(current.weather_code, current.is_day === 0);

      const formattedWData = {
        main: {
          temp: current.temperature_2m,
          feels_like: current.apparent_temperature,
          temp_max: daily.temperature_2m_max[0] || Math.round(current.temperature_2m + 4),
          temp_min: daily.temperature_2m_min[0] || Math.round(current.temperature_2m - 4),
          humidity: current.relative_humidity_2m,
          pressure: Math.round(current.surface_pressure),
        },
        weather: [
          {
            id: current.weather_code,
            description: parsedCondition.text,
          },
        ],
        wind: {
          speed: Math.round((current.wind_speed_10m / 3.6) * 100) / 100, // km/h to m/s
        },
        visibility: current.visibility || 10000,
        sys: {
          sunrise: new Date(daily.sunrise[0]).getTime() / 1000,
          sunset: new Date(daily.sunset[0]).getTime() / 1000,
        },
        isNight: current.is_day === 0,
        pop: daily.precipitation_probability_max && daily.precipitation_probability_max.length > 0 ? (Math.round(daily.precipitation_probability_max[0]) / 100) : 0,
      };

      // Build 5-day forecast array
      const forecastList = daily.time.slice(1, 6).map((timeObj: Date, idx: number) => {
        const wCode = daily.weather_code[idx + 1] || 1;
        const cond = parseWmoCode(wCode, false);
        return {
          dt: Math.floor(timeObj.getTime() / 1000),
          main: {
            temp_max: daily.temperature_2m_max[idx + 1],
            temp_min: daily.temperature_2m_min[idx + 1],
            humidity: daily.relative_humidity_2m_max[idx + 1] || 50,
          },
          weather: [{ id: wCode, description: cond.text }],
          wind: { speed: Math.round(((daily.wind_speed_10m_max[idx + 1] || 15) / 3.6) * 100) / 100 },
        };
      });

      setWeatherData(formattedWData);
      setForecastData({ list: forecastList, isOm: true });
      localStorage.setItem("cached_full_weather_data", JSON.stringify(formattedWData));
      localStorage.setItem("cached_full_forecast_data", JSON.stringify({ list: forecastList }));

      // Synchronize cached_weather_data for HeaderWidgets
      const syncWidgetData = {
        temp: Math.round(current.temperature_2m),
        temp_max: Math.round(formattedWData.main.temp_max),
        temp_min: Math.round(formattedWData.main.temp_min),
        condition: parsedCondition.text,
        id: current.weather_code,
        precip_prob: daily.precipitation_probability_max && daily.precipitation_probability_max.length > 0 ? Math.round(daily.precipitation_probability_max[0]) : 0,
      };
      localStorage.setItem("cached_weather_data", JSON.stringify(syncWidgetData));

      setError(null);
      setShowRefreshSuccess(true);
      setTimeout(() => setShowRefreshSuccess(false), 2500);

    } catch (e) {
      console.error("OpenMeteo fetch failed", e);
      if (!weatherData) {
        const fallbackWData = {
          main: {
            temp: 26,
            feels_like: 27,
            temp_max: 30,
            temp_min: 20,
            humidity: 52,
            pressure: 1012,
          },
          weather: [{ id: 801, description: "غائم جزئياً" }],
          wind: { speed: 3.6 },
          visibility: 10000,
          sys: { sunrise: 1723604820, sunset: 1723650840 },
          isNight: false,
          pop: 0,
        };
        const fallbackForecast = {
          list: [
            { dt: Date.now()/1000 + 86400, main: { temp_max: 31, temp_min: 21, humidity: 50 }, weather: [{ id: 800, description: "مشمس صافٍ" }], wind: { speed: 3.2 } },
            { dt: Date.now()/1000 + 172800, main: { temp_max: 30, temp_min: 20, humidity: 55 }, weather: [{ id: 801, description: "غائم جزئياً" }], wind: { speed: 3.8 } },
            { dt: Date.now()/1000 + 259200, main: { temp_max: 29, temp_min: 19, humidity: 60 }, weather: [{ id: 500, description: "أمطار خفيفة" }], wind: { speed: 4.1 } },
            { dt: Date.now()/1000 + 345600, main: { temp_max: 30, temp_min: 20, humidity: 52 }, weather: [{ id: 800, description: "مشمس" }], wind: { speed: 3.5 } },
            { dt: Date.now()/1000 + 432000, main: { temp_max: 31, temp_min: 21, humidity: 48 }, weather: [{ id: 801, description: "غائم جزئياً" }], wind: { speed: 3.0 } },
          ],
          isOm: true
        };
        setWeatherData(fallbackWData);
        setForecastData(fallbackForecast);
      }
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
    if (unit === "F") return Math.round((celsius * 9) / 5 + 32);
    return Math.round(celsius);
  };

  // Process 7-day forecast (أسبوع كامل)
  const dailyForecasts = useMemo(() => {
    if (!forecastData?.list) {
      return [
        { day: "الخميس", condition: "غائم جزئياً", humidity: 60, wind: 5.42, tempMax: 32, tempMin: 24, id: 801 },
        { day: "الجمعة", condition: "غائم", humidity: 55, wind: 6.10, tempMax: 31, tempMin: 23, id: 803 },
        { day: "السبت", condition: "غائم جزئياً", humidity: 40, wind: 4.20, tempMax: 30, tempMin: 22, id: 801 },
        { day: "الأحد", condition: "مشمس", humidity: 35, wind: 4.80, tempMax: 29, tempMin: 21, id: 800 },
        { day: "الإثنين", condition: "غائم", humidity: 50, wind: 5.90, tempMax: 28, tempMin: 21, id: 804 },
        { day: "الثلاثاء", condition: "زخات مطر", humidity: 65, wind: 6.40, tempMax: 27, tempMin: 20, id: 500 },
        { day: "الأربعاء", condition: "صافٍ", humidity: 38, wind: 4.10, tempMax: 30, tempMin: 22, id: 800 },
      ];
    }

    if (forecastData.isOm) {
      // Prepared directly from Open-Meteo
      return forecastData.list.slice(0, 7).map((item: any) => {
        const dayName = new Date(item.dt * 1000).toLocaleDateString('ar-YE', { weekday: 'long' });
        return {
          day: dayName,
          condition: item.weather[0]?.description || "غائم جزئياً",
          humidity: Math.round(item.main.humidity),
          wind: item.wind.speed,
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          id: item.weather[0]?.id || 801,
        };
      });
    }

    // OpenWeather API grouping
    const daysMap: Record<string, any[]> = {};
    forecastData.list.forEach((item: any) => {
      const dateStr = new Date(item.dt * 1000).toDateString();
      if (!daysMap[dateStr]) daysMap[dateStr] = [];
      daysMap[dateStr].push(item);
    });

    const keys = Object.keys(daysMap);
    const selectedKeys = keys.length >= 7 ? keys.slice(0, 7) : keys;

    return selectedKeys.map((dateKey) => {
      const items = daysMap[dateKey];
      const dayName = new Date(items[0].dt * 1000).toLocaleDateString('ar-YE', { weekday: 'long' });
      const midday = items.find((f: any) => {
        const h = new Date(f.dt * 1000).getHours();
        return h >= 11 && h <= 15;
      }) || items[Math.floor(items.length / 2)];

      const minTemps = items.map((i: any) => i.main.temp_min);
      const maxTemps = items.map((i: any) => i.main.temp_max);

      return {
        day: dayName,
        condition: midday.weather[0]?.description || "غائم جزئياً",
        humidity: Math.round(midday.main.humidity),
        wind: Math.round(midday.wind.speed * 100) / 100,
        tempMax: Math.round(Math.max(...maxTemps)),
        tempMin: Math.round(Math.min(...minTemps)),
        id: midday.weather[0]?.id || 801,
      };
    });
  }, [forecastData]);

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-3xl shadow-lg border border-slate-100">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-700 font-bold font-cairo text-lg">جاري تحديث بيانات طقس تعز...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
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

  // Values from weatherData
  const rawTemp = weatherData.main.temp;
  const rawFeelsLike = weatherData.main.feels_like;
  const rawTempMax = weatherData.main.temp_max;
  const rawTempMin = weatherData.main.temp_min;

  const conditionStr = weatherData.weather[0]?.description || "غائم جزئياً";
  const weatherCode = weatherData.weather[0]?.id || 801;
  const humidity = Math.round(weatherData.main.humidity);
  const windSpeed = weatherData.wind?.speed ? (Math.round(weatherData.wind.speed * 100) / 100) : 5.42;
  const pressure = Math.round(weatherData.main.pressure);
  const visibilityKm = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 10;
  const sunriseTime = weatherData.sys?.sunrise ? formatTime12h(weatherData.sys.sunrise) : "05:46 ص";
  const sunsetTime = weatherData.sys?.sunset ? formatTime12h(weatherData.sys.sunset) : "06:34 م";
  const precipProb = weatherData.pop !== undefined ? Math.round(weatherData.pop * 100) : 0;

  // Check if night
  const nowSec = Math.floor(Date.now() / 1000);
  const isNight = weatherData.isNight ?? (weatherData.sys?.sunrise && weatherData.sys?.sunset 
    ? (nowSec < weatherData.sys.sunrise || nowSec > weatherData.sys.sunset)
    : (new Date().getHours() >= 18 || new Date().getHours() < 5));

  // Dynamic Hero Card Gradient Theme depending on weather code & day/night
  const heroCardThemeStr = useMemo(() => {
    const category = getCategoryFromCode(weatherCode, isNight);
    return getWeatherTheme(category, isNight).theme;
  }, [weatherCode, isNight]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 pt-2 px-3 sm:px-6 select-none font-sans" dir="rtl">
      {/* Centered Mobile/Tablet Container matching exact reference image width */}
      <div className="max-w-md md:max-w-xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. TOP HEADER WITH LOCATION, UNIT TOGGLE AND LIVE REFRESH */}
        <div className="flex items-center justify-between px-1 py-1">
          {/* Menu / Back Action Icon + Interactive Refresh */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="القائمة / العودة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Interactive Refresh Button */}
            <button 
              onClick={fetchWeather}
              disabled={isRefreshing}
              className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              title="تحديث بيانات الطقس الآن"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-600" : "text-slate-600"}`} />
            </button>

            {/* C / F Unit Toggle Switch */}
            <button
              onClick={() => setUnit(prev => prev === "C" ? "F" : "C")}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all font-sans"
              title="تغيير وحدة الحرارة"
            >
              °{unit === "C" ? "C" : "F"}
            </button>
          </div>

          {/* Right Page Title */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-slate-900">
              <span className="text-xl sm:text-2xl font-black tracking-tight font-cairo">
                الطقس والأحوال الجوية
              </span>
            </div>
          </div>
        </div>

        {/* 2. MAIN HERO WEATHER CARD (DYNAMIC BASED ON WEATHER CONDITION & TIME OF DAY) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className={`relative rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] border overflow-hidden transition-all duration-500 bg-gradient-to-br ${heroCardThemeStr}`}
        >
          {/* Dynamic Weather Full-Card Background Effect */}
          <WeatherBackgroundEffect weatherCode={weatherCode} isNight={isNight} />

          {/* Background Atmosphere Lighting Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/40 pointer-events-none" />

          {/* HERO TOP CONTENT: TEMP & INTERACTIVE 3D GRAPHIC */}
          <div className="relative z-10 flex items-start justify-between pt-6 sm:pt-8 pb-4">
            
            {/* LEFT SIDE (RTL LEFT): Temperature & Condition Info */}
            <div className="flex flex-col items-start space-y-1">
              {/* Huge Temp Number */}
              <div 
                onClick={() => setUnit(prev => prev === "C" ? "F" : "C")}
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none font-sans drop-shadow-sm cursor-pointer hover:scale-105 transition-transform"
                title="اضغط للتحويل بين المئوي والفهرنهايت"
              >
                {displayTemp(rawTemp)}°
              </div>

              {/* Condition Text */}
              <h2 className="text-lg sm:text-2xl font-bold font-cairo tracking-wide text-amber-50/95 pt-1 max-w-[200px] sm:max-w-xs leading-snug">
                {conditionStr}
              </h2>

              {/* High / Low Temp Badge */}
              <div className="pt-2 flex flex-col items-start gap-2">
                <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-1 flex items-center gap-2.5 text-xs font-bold font-sans">
                  <div className="flex items-center gap-0.5 text-red-300">
                    <span>{displayTemp(rawTempMax)}°</span>
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-white/30 text-[10px]">|</span>
                  <div className="flex items-center gap-0.5 text-sky-300">
                    <span>{displayTemp(rawTempMin)}°</span>
                    <ArrowDown className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                {/* Precip Prob Badge */}
                {precipProb > 0 && (
                  <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-1 flex items-center gap-1.5 text-xs font-bold font-sans">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sky-300">{precipProb}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE (RTL RIGHT): Real-time Dynamic 3D Illustration */}
            <Interactive3DWeatherIllustration 
              weatherCode={weatherCode} 
              isNight={isNight} 
            />

          </div>

          {/* BOTTOM OVERLAY INSIDE HERO CARD: 4 FROSTED METRIC CARDS */}
          <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-2.5 mt-2 pt-3 border-t border-white/15">
            
            {/* Metric 1: الرؤية */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الرؤية</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{visibilityKm} كم</span>
            </div>

            {/* Metric 2: الضغط الجوي */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الضغط الجوي</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{pressure} hPa</span>
            </div>

            {/* Metric 3: سرعة الرياح */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">سرعة الرياح</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{windSpeed} م/ث</span>
            </div>

            {/* Metric 4: الرطوبة */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الرطوبة</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{humidity}%</span>
            </div>

          </div>
        </motion.div>

        {/* 3. SUNRISE AND SUNSET ROW (2 SIDE-BY-SIDE CARDS MATCHING REFERENCE) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* Sunrise Card (الشروق) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E6] to-[#FFE8D6] border border-orange-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between overflow-hidden"
          >
            {/* Left Info: Name & Time */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-amber-700 font-cairo">
                الشروق
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 font-sans tracking-tight">
                {sunriseTime}
              </span>
            </div>

            {/* Right Graphic: Sun rising vector */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" fill="#FED7AA" opacity="0.6" />
                <path d="M12 32 H36" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="24" r="9" fill="#F59E0B" />
                <g stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
                  <line x1="24" y1="9" x2="24" y2="12" />
                  <line x1="13" y1="14" x2="16" y2="16" />
                  <line x1="35" y1="14" x2="32" y2="16" />
                </g>
              </svg>
            </div>
          </motion.div>

          {/* Sunset Card (الغروب) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between overflow-hidden"
          >
            {/* Left Info: Name & Time */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-indigo-700 font-cairo">
                الغروب
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 font-sans tracking-tight">
                {sunsetTime}
              </span>
            </div>

            {/* Right Graphic: Crescent Moon vector */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" fill="#C7D2FE" opacity="0.6" />
                <path d="M28 14C26.5 13.5 25 13.2 23.3 13.2 C17 13.2 12 18.2 12 24.5 C12 30.8 17 35.8 23.3 35.8 C27.2 35.8 30.7 33.8 32.8 30.8 C26.8 30.4 22.1 25.4 22.1 19.3 C22.1 17.1 22.8 15.1 24 13.3 Z" fill="#4F46E5" />
                <circle cx="31" cy="16" r="1.5" fill="#818CF8" />
                <circle cx="35" cy="21" r="1" fill="#818CF8" />
              </svg>
            </div>
          </motion.div>

        </div>

        {/* 4. UPCOMING DAYS FORECAST CARD ("توقعات الأيام القادمة") */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 shadow-[0_12px_36px_rgba(14,165,233,0.08)] border border-sky-100/80 overflow-hidden bg-gradient-to-br from-white/95 via-sky-50/60 to-blue-50/40 backdrop-blur-xl"
        >
          {/* Header Row */}
          <div className="relative z-10 flex items-center justify-between pb-3.5 sm:pb-4 border-b border-sky-100/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-300/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-sky-950 dark:text-sky-100 font-cairo">
                  توقعات الأيام القادمة
                </h3>
              </div>
            </div>
          </div>

          {/* Dynamic Weather Day Cards */}
          <div className="relative z-10 space-y-2.5 sm:space-y-3 mt-4">
            {dailyForecasts.map((item, idx) => {
              const itemCategory = getCategoryFromCode(item.id, false);
              
              // Soft, weather-inspired card highlights for each day
              let rowTheme = "bg-gradient-to-r from-white via-sky-50/40 to-white border-sky-100 hover:border-sky-300";
              let iconBg = "bg-sky-50 border-sky-100";
              
              if (itemCategory === "clear") {
                rowTheme = "bg-gradient-to-r from-amber-50/60 via-white to-sky-50/40 border-amber-200/60 hover:border-amber-300";
                iconBg = "bg-amber-100/50 border-amber-200/60";
              } else if (itemCategory === "rain") {
                rowTheme = "bg-gradient-to-r from-cyan-50/60 via-white to-blue-50/40 border-cyan-200/60 hover:border-cyan-300";
                iconBg = "bg-cyan-100/50 border-cyan-200/60";
              } else if (itemCategory === "thunderstorm") {
                rowTheme = "bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/40 border-indigo-200/60 hover:border-indigo-300";
                iconBg = "bg-indigo-100/50 border-indigo-200/60";
              } else if (itemCategory === "fog") {
                rowTheme = "bg-gradient-to-r from-amber-50/50 via-white to-stone-50/40 border-stone-200/60 hover:border-amber-200";
                iconBg = "bg-amber-100/40 border-amber-200/50";
              }

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * idx }}
                  className={`relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border shadow-xs backdrop-blur-md overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3 ${rowTheme} transition-all duration-300 hover:shadow-md`}
                >
                  {/* Live Dynamic Weather Effect across full card row */}
                  <WeatherBackgroundEffect weatherCode={item.id} isNight={false} className="opacity-70 pointer-events-none" />

                  {/* Day Name + 3D Weather Icon + Condition Text */}
                  <div className="relative z-10 flex items-center gap-3.5 w-full sm:w-auto">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}>
                      <ForecastIcon3D weatherId={item.id} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black text-slate-900 font-cairo">
                        {item.day}
                      </div>
                      <div className="text-xs font-bold text-slate-600 font-cairo">
                        {item.condition}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Humidity & Wind Speed Frosted Badges */}
                  <div className="relative z-10 flex items-center gap-2 sm:gap-3 text-xs font-bold font-sans w-full sm:w-auto justify-between sm:justify-center">
                    <div className="bg-sky-50/90 border border-sky-200/70 text-sky-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <span>{item.humidity}%</span>
                    </div>
                    <div className="bg-teal-50/90 border border-teal-200/70 text-teal-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-teal-500" />
                      <span>{item.wind} م/ث</span>
                    </div>
                  </div>

                  {/* High / Low Temperature Range Capsule */}
                  <div className="relative z-10 bg-white/90 border border-slate-200/80 shadow-xs rounded-full px-4 py-1.5 flex items-center gap-3 text-xs sm:text-sm font-extrabold font-sans">
                    <div className="flex items-center gap-1 text-amber-600">
                      <span>{displayTemp(item.tempMax)}°</span>
                      <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-slate-300 text-xs">|</span>
                    <div className="flex items-center gap-1 text-sky-600">
                      <span>{displayTemp(item.tempMin)}°</span>
                      <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default WeatherDetail;
