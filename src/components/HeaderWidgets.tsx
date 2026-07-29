import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin, Droplets, Sunrise, Sun, SunMedium, Sunset, MoonStar, CloudRain, Calendar } from "lucide-react";
import { PrayerBackground, WeatherBackground, HijriBackground } from './CardAnimatedBackgrounds';

// Red Calendar Icon Badge for Date Card
const RedCalendarIcon = () => (
  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="26" height="22" rx="5" stroke="#DC2626" strokeWidth="2.2" fill="none" />
    <line x1="3" y1="12" x2="29" y2="12" stroke="#DC2626" strokeWidth="2" />
    <rect x="8" y="3" width="2.5" height="5" rx="1.2" fill="#DC2626" />
    <rect x="21.5" y="3" width="2.5" height="5" rx="1.2" fill="#DC2626" />
    <circle cx="9" cy="17" r="1.3" fill="#DC2626" />
    <circle cx="16" cy="17" r="1.3" fill="#DC2626" />
    <circle cx="23" cy="17" r="1.3" fill="#DC2626" />
    <circle cx="9" cy="22" r="1.3" fill="#DC2626" />
    <circle cx="16" cy="22" r="1.3" fill="#DC2626" />
    <circle cx="23" cy="22" r="1.3" fill="#DC2626" />
  </svg>
);

import { fetchWeatherData } from "../utils/weatherApi";
import { Interactive3DWeatherIllustration, parseWmoCode, getCategoryFromCode, getWeatherTheme, WeatherBackgroundEffect } from "../pages/WeatherDetail";
import { PrayerBackgroundEffect } from "./PrayerBackgroundEffect";

// 3D Mosque Dome Vector Illustration matching attached design
const MosqueDomeIllustration = () => (
  <svg className="w-full h-10 sm:h-16 md:h-20 select-none shrink-0" viewBox="0 0 160 90" fill="none">
    <defs>
      <linearGradient id="domeGreenGrad" x1="80" y1="15" x2="80" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0B6B3D" />
        <stop offset="100%" stopColor="#015028" />
      </linearGradient>
    </defs>
    {/* Soft wave background hill */}
    <path d="M0 62 Q 80 42, 160 54 V 90 H 0 Z" fill="#E2F2E7" />
    {/* Right Minaret */}
    <path d="M122 68 V 34 H 126 V 68 Z M124 24 L122 34 H126 Z M124 16 V 24" stroke="#015028" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />
    {/* Main Dome */}
    <path d="M56 68 C56 42 68 22 80 22 C92 22 104 42 104 68 Z" fill="url(#domeGreenGrad)" />
    {/* Dome Door Arch */}
    <path d="M72 68 C72 56 76 50 80 50 C84 50 88 56 88 68 Z" fill="#EEF8F1" />
    {/* Crescent Finial Top */}
    <line x1="80" y1="22" x2="80" y2="12" stroke="#015028" strokeWidth="2" strokeLinecap="round" />
    <path d="M80 8 C82 8 83.5 9.5 83.5 11.5 C83.5 13.5 82 15 80 15 C81.5 15 83 13.5 83 11.5 C83 9.5 81.5 8 80 8 Z" fill="#015028" className="animate-pulse" />
  </svg>
);

export const HeaderWidgets: React.FC = () => {
  const [time, setTime] = useState(new Date());
  
  const [weatherData, setWeatherData] = useState<{ temp: number; temp_max: number; temp_min: number; condition: string; id: number; precip_prob?: number } | null>(null);

  const [prayerTimes, setPrayerTimes] = useState<{ name: string; time: string }[] | null>(() => {
    try {
      const cached = localStorage.getItem("cached_prayer_times");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [apiHijriDate, setApiHijriDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem("cached_hijri_date");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleWeatherUpdate = (e: any) => {
      if (e?.detail?.current) {
        const current = e.detail.current;
        const forecastList = e.detail.forecast?.list || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayForecasts = forecastList.filter((f: any) => {
          const dateStr = new Date(f.dt * 1000).toISOString().split('T')[0];
          return dateStr === todayStr;
        });

        const temp_max = todayForecasts.length > 0 
          ? Math.max(...todayForecasts.map((f: any) => f.main.temp_max))
          : current.main.temp_max || (current.main.temp + 4);
          
        const temp_min = todayForecasts.length > 0 
          ? Math.min(...todayForecasts.map((f: any) => f.main.temp_min))
          : current.main.temp_min || (current.main.temp - 4);

        const pop = todayForecasts.length > 0
          ? Math.max(...todayForecasts.map((f: any) => f.pop || 0)) * 100
          : 0;

        const wCode = current.weather?.[0]?.id || 801;
        const conditionText = current.weather?.[0]?.description || "غائم جزئياً";

        setWeatherData({
          temp: Math.round(current.main.temp),
          temp_max: Math.round(temp_max),
          temp_min: Math.round(temp_min),
          condition: conditionText,
          id: wCode,
          precip_prob: Math.round(pop),
        });
      }
    };

    window.addEventListener("weather_updated", handleWeatherUpdate);

    const fetchWeather = async () => {
      try {
        const omData = await fetchWeatherData();
        const current = omData.current;
        const forecastList = omData.forecast?.list || [];
        
        // Find max and min temp for today from forecast list
        const todayStr = new Date().toISOString().split('T')[0];
        const todayForecasts = forecastList.filter((f: any) => {
          const dateStr = new Date(f.dt * 1000).toISOString().split('T')[0];
          return dateStr === todayStr;
        });

        const temp_max = todayForecasts.length > 0 
          ? Math.max(...todayForecasts.map((f: any) => f.main.temp_max))
          : current.main.temp_max || (current.main.temp + 4);
          
        const temp_min = todayForecasts.length > 0 
          ? Math.min(...todayForecasts.map((f: any) => f.main.temp_min))
          : current.main.temp_min || (current.main.temp - 4);

        const pop = todayForecasts.length > 0
          ? Math.max(...todayForecasts.map((f: any) => f.pop || 0)) * 100
          : 0;

        const wCode = current?.weather?.[0]?.id || 801;
        const conditionText = current?.weather?.[0]?.description || "غائم جزئياً";

        const newWeatherData = {
          temp: Math.round(current.main.temp),
          temp_max: Math.round(temp_max),
          temp_min: Math.round(temp_min),
          condition: conditionText,
          id: wCode,
          precip_prob: Math.round(pop),
        };

        setWeatherData(newWeatherData);
      } catch (e) {
        if (!weatherData) {
          const fallbackData = {
            temp: 26,
            temp_max: 31,
            temp_min: 20,
            condition: "غائم جزئياً",
            id: 801,
            precip_prob: 0,
          };
          setWeatherData(fallbackData);
        }
      }
    };

    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Taiz&country=Yemen&method=4`);
        if (response.ok) {
          const data = await response.json();
          const timings = data.data.timings;
          const newPrayerTimes = [
            { name: "الفجر", time: timings.Fajr },
            { name: "الظهر", time: timings.Dhuhr },
            { name: "العصر", time: timings.Asr },
            { name: "المغرب", time: timings.Maghrib },
            { name: "العشاء", time: timings.Isha },
          ];
          setPrayerTimes(newPrayerTimes);
          localStorage.setItem("cached_prayer_times", JSON.stringify(newPrayerTimes));

          const hijri = data.data.date.hijri;
          const newHijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
          setApiHijriDate(newHijriDate);
          localStorage.setItem("cached_hijri_date", newHijriDate);
        } else if (!prayerTimes || prayerTimes.length === 0) {
          const fallbackPrayers = [
            { name: "الفجر", time: "04:27" },
            { name: "الظهر", time: "12:10" },
            { name: "العصر", time: "15:30" },
            { name: "المغرب", time: "18:34" },
            { name: "العشاء", time: "20:04" },
          ];
          setPrayerTimes(fallbackPrayers);
        }
      } catch {
        if (!prayerTimes || prayerTimes.length === 0) {
          const fallbackPrayers = [
            { name: "الفجر", time: "04:27" },
            { name: "الظهر", time: "12:10" },
            { name: "العصر", time: "15:30" },
            { name: "المغرب", time: "18:34" },
            { name: "العشاء", time: "20:04" },
          ];
          setPrayerTimes(fallbackPrayers);
        }
      }
    };

    fetchWeather();
    fetchPrayerTimes();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    const prayerInterval = setInterval(fetchPrayerTimes, 12 * 60 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(prayerInterval);
    };
  }, []);

  // Format Day Name
  const dayName = useMemo(() => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return days[time.getDay()];
  }, [time]);

  // Format Gregorian Date
  const gregorianDate = useMemo(() => {
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    return `${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()} م`;
  }, [time]);

  // Hijri Date Fallback or API
  const hijriDate = useMemo(() => {
    if (apiHijriDate) return apiHijriDate;
    try {
      const dayMonth = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
      }).format(time);
      const yearStr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric'
      }).format(time);
      return `${dayMonth} ${yearStr}`;
    } catch {
      return "8 صفر 1446 هـ";
    }
  }, [apiHijriDate, time]);

  // Active / Next Prayer Determination
  const activePrayerInfo = useMemo(() => {
    const defaultPrayer = { name: "الفجر", rawTime: "04:22" };
    if (!prayerTimes || prayerTimes.length === 0) return defaultPrayer;

    const currentHour = time.getHours();
    const currentMin = time.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    for (const prayer of prayerTimes) {
      const [pHour, pMin] = prayer.time.split(":").map(Number);
      const prayerTotalMins = pHour * 60 + pMin;
      if (prayerTotalMins > currentTotalMins) {
        return { name: prayer.name, rawTime: prayer.time };
      }
    }
    return { name: prayerTimes[0].name, rawTime: prayerTimes[0].time };
  }, [time, prayerTimes]);

  // Format 12H Prayer Time
  const formattedPrayer = useMemo(() => {
    const raw = activePrayerInfo.rawTime;
    const parts = raw.split(":");
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parts[1].padStart(2, "0") : "00";
    const period = hours >= 12 ? "م" : "ص";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const formattedHours = hours.toString().padStart(2, "0");
    return {
      name: activePrayerInfo.name,
      time: `${formattedHours}:${minutes}`,
      period,
    };
  }, [activePrayerInfo]);

  // Remaining time to active prayer
  const prayerTimeRemaining = useMemo(() => {
    if (!activePrayerInfo.rawTime) return "";
    const [pHour, pMin] = activePrayerInfo.rawTime.split(":").map(Number);
    const prayerTotalSecs = (pHour * 60 + pMin) * 60;
    const currentTotalSecs = (time.getHours() * 60 + time.getMinutes()) * 60 + time.getSeconds();
    let diffSecs = prayerTotalSecs - currentTotalSecs;
    if (diffSecs < 0) {
      diffSecs += 24 * 3600;
    }
    const h = Math.floor(diffSecs / 3600);
    const m = Math.floor((diffSecs % 3600) / 60);
    const s = diffSecs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [activePrayerInfo, time]);

  // Weather values or fallback
  const weather = useMemo(() => {
    if (!weatherData) {
      return { temp: 27, tempMax: 31, tempMin: 23, condition: "غائم جزئياً", id: 801, precip_prob: 0 };
    }
    return {
      temp: weatherData.temp,
      tempMax: weatherData.temp_max,
      tempMin: weatherData.temp_min,
      condition: weatherData.condition || "غائم جزئياً",
      id: weatherData.id || 801,
      precip_prob: weatherData.precip_prob,
    };
  }, [weatherData]);

  // Check if night time
  const isNight = useMemo(() => {
    const hour = time.getHours();
    return hour >= 18 || hour < 6;
  }, [time]);

  // Dynamic Weather Card Background & Text Theme (Matching WeatherDetail.tsx exactly)
  const { weatherTheme, weatherTextColor, weatherSubtextColor, maxTempColor, minTempColor } = useMemo(() => {
    const category = getCategoryFromCode(weather.id, isNight);
    const themeObj = getWeatherTheme(category, isNight);
    return {
      weatherTheme: themeObj.theme,
      weatherTextColor: themeObj.text,
      weatherSubtextColor: themeObj.subtext,
      maxTempColor: themeObj.maxTemp,
      minTempColor: themeObj.minTemp
    };
  }, [weather.id, isNight]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-1.5 sm:px-4 py-2 sm:py-4 select-none" dir="rtl">
      {/* 4 Columns Horizontal Grid - Compact & Responsive for Mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-5 items-stretch">
        
        {/* 1. Far Right Item: Platform Logo (شعار المنصة بدون خلفية بيضاء) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center min-h-[105px] sm:min-h-[160px] md:min-h-[185px] w-full h-full overflow-hidden"
        >
          <img 
            src="/logo3.png" 
            alt="منصة تعز الإعلامية" 
            className="w-full h-full max-h-[105px] sm:max-h-[160px] md:max-h-[185px] object-contain select-none drop-shadow-xs transition-all duration-500 hover:drop-shadow-lg" 
          />
        </motion.div>

        {/* 2. Second Item from Right: Prayer Times Card (كارت مواقيت الصلاة) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Link 
            to="/prayer-times" 
            className="relative rounded-[14px] sm:rounded-[22px] border border-white/50 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:border-white/70 dark:hover:border-white/20 p-2.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] transition-all duration-500 overflow-hidden group h-full block"
          >
            <PrayerBackground prayerName={formattedPrayer.name} />
            <div className="absolute inset-0 bg-white/40 dark:bg-[#111111]/60 backdrop-blur-[4px] bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-[-5] pointer-events-none rounded-[inherit]" />
            {/* Top Section */}
            <div className="relative z-10 flex items-start justify-between w-full">
              <span className="text-[10px] sm:text-[12px] md:text-[14px] font-medium text-emerald-800 dark:text-emerald-300 leading-none tracking-wide font-[Tajawal]">
                الصلاة القادمة
              </span>
              <div className="p-1 sm:p-2 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                {formattedPrayer.name === "الفجر" && <MoonStar className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-500 dark:text-amber-300" strokeWidth={1.5} />}
                {formattedPrayer.name === "الظهر" && <Sun className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-500 dark:text-amber-300" strokeWidth={1.5} />}
                {formattedPrayer.name === "العصر" && <SunMedium className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-200" strokeWidth={1.5} />}
                {formattedPrayer.name === "المغرب" && <Sunset className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-rose-600 dark:text-rose-200" strokeWidth={1.5} />}
                {formattedPrayer.name === "العشاء" && <MoonStar className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-indigo-600 dark:text-indigo-200" strokeWidth={1.5} />}
              </div>
            </div>

            {/* Middle Prayer Name */}
            <div className="relative z-10 mt-1 sm:mt-1.5 mb-auto text-right">
              <h3 className="text-[15px] xs:text-[17px] sm:text-[22px] md:text-[26px] font-medium text-slate-900 dark:text-white tracking-tight leading-none font-[Tajawal]">
                {formattedPrayer.name}
              </h3>
            </div>

            {/* Bottom Row: Countdown */}
            <div className="relative z-10 flex items-center justify-center mt-1 sm:mt-2 bg-white/50 dark:bg-black/30 backdrop-blur-md rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 border border-white/60 dark:border-white/10 shadow-sm">
               <span className="text-[11px] xs:text-[13px] sm:text-[16px] md:text-[18px] font-medium text-emerald-900 dark:text-emerald-200 font-sans tracking-wide flex items-center gap-1.5 sm:gap-2">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
                {prayerTimeRemaining}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* 3. Third Item from Right: Weather Card (كارت الطقس) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Link 
            to="/weather" 
            className="relative rounded-[14px] sm:rounded-[22px] border border-white/50 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:border-white/70 dark:hover:border-white/20 p-2.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] transition-all duration-500 overflow-hidden group h-full block"
          >
            <WeatherBackground weatherCode={weather.id} isNight={isNight} />
            <div className="absolute inset-0 bg-white/40 dark:bg-[#111111]/60 backdrop-blur-[4px] bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-[-5] pointer-events-none rounded-[inherit]" />
            {/* Top Section: Temp + Dynamic 3D Weather Icon */}
            <div className="relative z-10 flex items-start justify-between w-full">
              <span className="text-[18px] xs:text-[22px] sm:text-[34px] md:text-[42px] font-medium text-slate-900 dark:text-white leading-none tracking-tight font-[Tajawal]">
                {weather.temp}°
              </span>
              <div className="group-hover:scale-110 transition-transform duration-500">
                <Interactive3DWeatherIllustration weatherCode={weather.id} isNight={isNight} className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-sm" />
              </div>
            </div>

            {/* Middle Weather Condition Description */}
            <div className="relative z-10 mb-auto mt-0.5 sm:mt-1">
              <p className="text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[16px] font-medium text-slate-800 dark:text-slate-200 tracking-wide leading-snug font-[Tajawal]">
                {weather.condition}
              </p>
            </div>

            {/* Bottom Row: Max/Min Temp & Precip */}
            <div className="relative z-10 flex flex-col gap-1 sm:gap-1.5 mt-auto w-full">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-medium text-[9px] xs:text-[11px] sm:text-[14px]">
                  <span className="text-[8px] sm:text-[10px] leading-none inline-block">▲</span>
                  <span className="font-[Tajawal]">{weather.tempMax}°</span>
                </div>
                <div className="flex items-center gap-0.5 text-sky-700 dark:text-sky-400 font-medium text-[9px] xs:text-[11px] sm:text-[14px]">
                  <span className="text-[8px] sm:text-[10px] leading-none inline-block">▼</span>
                  <span className="font-[Tajawal]">{weather.tempMin}°</span>
                </div>
              </div>
              {weather.precip_prob !== undefined && (
                <div className="flex items-center gap-1 text-sky-800 dark:text-sky-300 font-medium text-[9px] xs:text-[11px] sm:text-[13px]">
                  <CloudRain size={12} className="sm:w-3.5 sm:h-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="font-[Tajawal]">{weather.precip_prob}%</span>
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* 4. Leftmost Item: Date Card (كارت التاريخ الهجري) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Link 
            to="/calendar" 
            className="relative rounded-[14px] sm:rounded-[22px] border border-white/50 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:border-white/70 dark:hover:border-white/20 p-2.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] transition-all duration-500 overflow-hidden group h-full block"
          >
            <HijriBackground />
            <div className="absolute inset-0 bg-white/40 dark:bg-[#111111]/60 backdrop-blur-[4px] bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-[-5] pointer-events-none rounded-[inherit]" />
            {/* Top Section */}
            <div className="relative z-10 flex items-start justify-between w-full">
              <span className="text-[10px] sm:text-[12px] md:text-[14px] font-medium text-emerald-800 dark:text-emerald-300 leading-none tracking-wide font-[Tajawal]">
                التقويم الهجري
              </span>
              <div className="p-1 sm:p-2 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <Calendar className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>

            {/* Middle Section: Day Name & Hijri Date */}
            <div className="relative z-10 flex flex-col justify-center my-auto text-right py-1 sm:py-2">
              <h3 className="text-[15px] xs:text-[18px] sm:text-[24px] md:text-[28px] font-medium text-slate-900 dark:text-white tracking-tight leading-none font-[Tajawal]">
                {dayName}
              </h3>
              <p className="text-[10.5px] xs:text-[12.5px] sm:text-[15px] md:text-[17px] font-medium text-emerald-800 dark:text-emerald-300 leading-tight mt-1.5 sm:mt-2.5 whitespace-nowrap font-[Tajawal]">
                {hijriDate}
              </p>
            </div>

            {/* Bottom Row: Calendar Navigation Indicator */}
            <div className="relative z-10 flex items-center justify-between mt-auto pt-1 sm:pt-2 border-t border-emerald-900/10 dark:border-white/10 text-emerald-800 dark:text-emerald-300">
              <span className="text-[9px] sm:text-[11px] md:text-[12px] font-medium font-[Tajawal]">
                جدول المناسبات
              </span>
              <span className="text-[10px] sm:text-[12px] font-bold group-hover:-translate-x-1.5 transition-transform duration-300">
                ←
              </span>
            </div>
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

