import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin, Droplets, Sunrise, Sun, SunMedium, Sunset, MoonStar, CloudRain, Calendar } from "lucide-react";

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

import { fetchOpenMeteoData } from "../utils/weatherApi";
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
  
  const [weatherData, setWeatherData] = useState<{ temp: number; temp_max: number; temp_min: number; condition: string; id: number; precip_prob?: number } | null>(() => {
    try {
      const cached = localStorage.getItem("cached_weather_data");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

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
    const fetchWeather = async () => {
      try {
        const omData = await fetchOpenMeteoData();
        const current = omData.current;
        const daily = omData.daily;

        const wCode = current.weather_code;
        const isNightTime = current.is_day === 0;
        const parsedCondition = parseWmoCode(wCode, isNightTime);
        const conditionText = parsedCondition.text;

        const newWeatherData = {
          temp: Math.round(current.temperature_2m),
          temp_max: Math.round(daily.temperature_2m_max[0]),
          temp_min: Math.round(daily.temperature_2m_min[0]),
          condition: conditionText,
          id: wCode,
          precip_prob: daily.precipitation_probability_max && daily.precipitation_probability_max.length > 0 ? Math.round(daily.precipitation_probability_max[0]) : 0,
        };

        setWeatherData(newWeatherData);
        localStorage.setItem("cached_weather_data", JSON.stringify(newWeatherData));
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
    <div className="w-full max-w-[1400px] mx-auto px-1.5 sm:px-4 py-1.5 sm:py-3 select-none" dir="rtl">
      {/* 4 Columns Horizontal Grid - Compact & Responsive for Mobile */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 items-stretch">
        
        {/* 1. Far Right Item: Platform Logo (شعار المنصة بدون خلفية بيضاء) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center min-h-[105px] sm:min-h-[160px] md:min-h-[185px] w-full h-full overflow-hidden"
        >
          <img 
            src="/logo3.png" 
            alt="منصة تعز الإعلامية" 
            className="w-full h-full max-h-[105px] sm:max-h-[160px] md:max-h-[185px] object-contain select-none drop-shadow-xs transition-all duration-300 hover:drop-shadow-md" 
          />
        </motion.div>

        {/* 2. Second Item from Right: Prayer Times Card (كارت مواقيت الصلاة) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Link 
            to="/prayer-times" 
            className="relative bg-transparent rounded-[14px] sm:rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 p-2 sm:p-3.5 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:shadow-md transition-all duration-300 overflow-hidden group h-full block"
          >
            {/* Top Section */}
            <div className="relative z-10 flex items-start justify-between w-full">
              <span className="text-[10px] sm:text-[12px] md:text-[14px] font-bold text-emerald-700 dark:text-emerald-400 leading-none tracking-wide font-cairo">
                الصلاة القادمة
              </span>
              <div className="p-1 sm:p-2 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-all duration-300 shadow-xs">
                {formattedPrayer.name === "الفجر" && <MoonStar className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-500 dark:text-amber-300" strokeWidth={1.5} />}
                {formattedPrayer.name === "الظهر" && <Sun className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-500 dark:text-amber-300" strokeWidth={1.5} />}
                {formattedPrayer.name === "العصر" && <SunMedium className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-200" strokeWidth={1.5} />}
                {formattedPrayer.name === "المغرب" && <Sunset className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-rose-600 dark:text-rose-200" strokeWidth={1.5} />}
                {formattedPrayer.name === "العشاء" && <MoonStar className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-indigo-600 dark:text-indigo-200" strokeWidth={1.5} />}
              </div>
            </div>

            {/* Middle Prayer Name */}
            <div className="relative z-10 mt-1 sm:mt-1.5 mb-auto text-right">
              <h3 className="text-[15px] xs:text-[17px] sm:text-[22px] md:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-none font-cairo">
                {formattedPrayer.name}
              </h3>
            </div>

            {/* Bottom Row: Countdown */}
            <div className="relative z-10 flex items-center justify-center mt-1 sm:mt-2 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 border border-emerald-200/80 dark:border-emerald-800/60">
               <span className="text-[11px] xs:text-[13px] sm:text-[16px] md:text-[18px] font-bold text-emerald-800 dark:text-emerald-300 font-sans tracking-wide flex items-center gap-1.5 sm:gap-2">
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Link 
            to="/weather" 
            className="relative bg-transparent rounded-[14px] sm:rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-400/50 p-1.5 sm:p-3.5 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:shadow-md transition-all duration-300 overflow-hidden group h-full block"
          >
            {/* Top Section: Temp + Dynamic 3D Weather Icon */}
            <div className="relative z-10 flex items-start justify-between w-full">
              <span className="text-[18px] xs:text-[22px] sm:text-[34px] md:text-[42px] font-black text-slate-900 dark:text-white leading-none tracking-tight font-sans">
                {weather.temp}°
              </span>
              <div className="group-hover:scale-105 transition-transform duration-300">
                <Interactive3DWeatherIllustration weatherCode={weather.id} isNight={isNight} className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20" />
              </div>
            </div>

            {/* Middle Weather Condition Description */}
            <div className="relative z-10 mb-auto mt-0.5 sm:mt-1">
              <p className="text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[16px] font-bold text-slate-700 dark:text-slate-300 tracking-wide leading-snug font-cairo">
                {weather.condition}
              </p>
            </div>

            {/* Bottom Row: Max/Min Temp & Precip */}
            <div className="relative z-10 flex flex-col gap-1 sm:gap-1.5 mt-auto w-full">
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] xs:text-[11px] sm:text-[14px]">
                  <span className="text-[8px] sm:text-[10px] leading-none inline-block">▲</span>
                  <span className="font-sans">{weather.tempMax}°</span>
                </div>
                <div className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-extrabold text-[9px] xs:text-[11px] sm:text-[14px]">
                  <span className="text-[8px] sm:text-[10px] leading-none inline-block">▼</span>
                  <span className="font-sans">{weather.tempMin}°</span>
                </div>
              </div>
              {weather.precip_prob !== undefined && (
                <div className="flex items-center gap-1 text-sky-700 dark:text-sky-300 font-bold text-[9px] xs:text-[11px] sm:text-[13px]">
                  <CloudRain size={12} className="sm:w-3.5 sm:h-3.5 text-sky-500" />
                  <span className="font-sans">{weather.precip_prob}%</span>
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* 4. Leftmost Item: Date Card (كارت التاريخ الهجري) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Link 
            to="/calendar" 
            className="relative bg-transparent rounded-[14px] sm:rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 p-1.5 sm:p-3.5 md:p-5 flex flex-col items-center justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:shadow-md transition-all duration-300 overflow-hidden group h-full block"
          >
            {/* Center Date Information */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full my-auto text-center py-1 sm:py-2">
              {/* Calendar Icon Top Center */}
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2 shrink-0" strokeWidth={1.8} />

              {/* Day Name */}
              <h3 className="text-[12px] xs:text-[14px] sm:text-[21px] md:text-[25px] font-black text-slate-900 dark:text-white tracking-tight leading-none font-cairo">
                {dayName}
              </h3>

              {/* Hijri Date */}
              <p className="text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[17px] font-extrabold text-emerald-700 dark:text-emerald-400 leading-none mt-1.5 sm:mt-2.5 whitespace-nowrap font-cairo">
                {hijriDate}
              </p>

              {/* Gregorian Date */}
              <p className="text-[8.5px] xs:text-[9.5px] sm:text-[13px] md:text-[14px] font-bold text-slate-500 dark:text-slate-400 leading-none mt-1 sm:mt-2 whitespace-nowrap">
                {gregorianDate}
              </p>
            </div>

            {/* Bottom Center Subtle Accent Bar */}
            <div className="relative z-10 w-6 sm:w-12 h-[2px] sm:h-[3px] bg-emerald-500/60 rounded-full mt-0.5 sm:mt-1.5 group-hover:w-10 sm:group-hover:w-16 transition-all duration-300" />
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

