import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";

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

// Glossy 3D Weather Icon Renderer based on Condition Type
const DynamicWeather3DIcon = ({ weatherId }: { weatherId?: number }) => {
  // Rain / Drizzle / Thunder (200-599)
  if (weatherId && weatherId >= 200 && weatherId < 600) {
    return (
      <svg className="w-7 h-7 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none shrink-0" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="rainCloudGrad" x1="16" y1="20" x2="52" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <path d="M20 40 C15 40 11 36 11 31 C11 26.5 14.5 22.8 19 22.1 C20.8 17.5 25.2 14 30.5 14 C36.8 14 42 18.8 42.8 25 C46.8 25.5 50 29 50 33.5 C50 38 46.4 40 42 40 Z" fill="url(#rainCloudGrad)" />
        {/* Animated Rain Drops */}
        <line x1="22" y1="44" x2="19" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
        <line x1="32" y1="44" x2="29" y2="54" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse [animation-delay:200ms]" />
        <line x1="42" y1="44" x2="39" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse [animation-delay:400ms]" />
      </svg>
    );
  }

  // Clear / Sunny (800)
  if (weatherId === 800) {
    return (
      <svg className="w-7 h-7 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none shrink-0" viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id="pureSunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF176" />
            <stop offset="65%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#F57F17" />
          </radialGradient>
        </defs>
        <g stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" className="animate-[spin_12s_linear_infinite] origin-[32px_32px]">
          <line x1="32" y1="8" x2="32" y2="2" />
          <line x1="32" y1="62" x2="32" y2="56" />
          <line x1="8" y1="32" x2="2" y2="32" />
          <line x1="62" y1="32" x2="56" y2="32" />
          <line x1="15" y1="15" x2="10" y2="10" />
          <line x1="54" y1="54" x2="49" y2="49" />
          <line x1="15" y1="49" x2="10" y2="54" />
          <line x1="54" y1="10" x2="49" y2="15" />
        </g>
        <circle cx="32" cy="32" r="16" fill="url(#pureSunGlow)" />
      </svg>
    );
  }

  // Default: Sun + Cloud (Partly Cloudy / General)
  return (
    <svg className="w-7 h-7 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none shrink-0" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="sunGlow3D" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFEE55" />
          <stop offset="60%" stopColor="#FFAA00" />
          <stop offset="100%" stopColor="#E65100" />
        </radialGradient>
        <linearGradient id="cloudGrad3D" x1="16" y1="26" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <filter id="cloudDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>
      <g stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" className="animate-[spin_16s_linear_infinite] origin-[42px_22px]">
        <line x1="42" y1="10" x2="42" y2="6" />
        <line x1="51" y1="13" x2="54" y2="10" />
        <line x1="55" y1="22" x2="59" y2="22" />
        <line x1="51" y1="31" x2="54" y2="34" />
        <line x1="33" y1="13" x2="30" y2="10" />
        <line x1="28" y1="22" x2="24" y2="22" />
      </g>
      <circle cx="42" cy="22" r="11" fill="url(#sunGlow3D)" />
      <g filter="url(#cloudDropShadow)">
        <path d="M20 46 C15 46 11 42 11 37 C11 32.5 14.5 28.8 19 28.1 C20.8 23.5 25.2 20 30.5 20 C36.8 20 42 24.8 42.8 31 C46.8 31.5 50 35 50 39.5 C50 44 46.4 46 42 46 Z" fill="url(#cloudGrad3D)" />
      </g>
    </svg>
  );
};

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
  
  const [weatherData, setWeatherData] = useState<{ temp: number; temp_max: number; temp_min: number; condition: string; id: number } | null>(() => {
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
        let fetched = false;
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(`/api/weather?lat=13.5795&lon=44.0203`),
          fetch(`/api/forecast?lat=13.5795&lon=44.0203`)
        ]);

        if (weatherRes.ok && forecastRes.ok) {
            const wData = await weatherRes.json();
            const fData = await forecastRes.json();

            const todayForecasts = fData.list ? fData.list.slice(0, 8) : [];
            const minTemps = todayForecasts.map((item: any) => item.main.temp_min);
            const maxTemps = todayForecasts.map((item: any) => item.main.temp_max);
            if (wData.main?.temp_min !== undefined) minTemps.push(wData.main.temp_min);
            if (wData.main?.temp_max !== undefined) maxTemps.push(wData.main.temp_max);

            const newWeatherData = {
              temp: Math.round(wData.main.temp),
              temp_max: Math.round(Math.max(...maxTemps)),
              temp_min: Math.round(Math.min(...minTemps)),
              condition: wData.weather[0].description,
              id: wData.weather[0].id,
            };

            setWeatherData(newWeatherData);
            localStorage.setItem("cached_weather_data", JSON.stringify(newWeatherData));
            fetched = true;
          }

          if (!fetched) {
            try {
            const openMeteoRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=13.5795&longitude=44.0203&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FRiyadh`
            );
            if (openMeteoRes.ok) {
              const omData = await openMeteoRes.json();
              const current = omData.current;
              const daily = omData.daily;

              const wCode = current.weather_code;
              let conditionText = current.is_day === 0 ? "صافٍ ليلاً" : "مشمس صافٍ";
              if (wCode === 1 || wCode === 2) conditionText = "غائم جزئياً";
              else if (wCode === 3) conditionText = "غائم كلياً";
              else if (wCode >= 51 && wCode <= 67) conditionText = "أمطار خفيفة";
              else if (wCode >= 80) conditionText = "زخات مطر";

              const newWeatherData = {
                temp: Math.round(current.temperature_2m),
                temp_max: Math.round(daily.temperature_2m_max[0]),
                temp_min: Math.round(daily.temperature_2m_min[0]),
                condition: conditionText,
                id: wCode,
              };

              setWeatherData(newWeatherData);
              localStorage.setItem("cached_weather_data", JSON.stringify(newWeatherData));
              fetched = true;
            }
          } catch {
            // Quiet network fallback
          }
        }

        if (!fetched && !weatherData) {
          const fallbackData = {
            temp: 26,
            temp_max: 31,
            temp_min: 20,
            condition: "غائم جزئياً",
            id: 801,
          };
          setWeatherData(fallbackData);
          localStorage.setItem("cached_weather_data", JSON.stringify(fallbackData));
        }
      } catch {
        if (!weatherData) {
          const fallbackData = {
            temp: 26,
            temp_max: 31,
            temp_min: 20,
            condition: "غائم جزئياً",
            id: 801,
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
        } else if (prayerTimes.length === 0) {
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
        if (prayerTimes.length === 0) {
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
      return { temp: 27, tempMax: 31, tempMin: 23, condition: "غائم جزئياً", id: 801 };
    }
    return {
      temp: weatherData.temp,
      tempMax: weatherData.temp_max,
      tempMin: weatherData.temp_min,
      condition: weatherData.condition || "غائم جزئياً",
      id: weatherData.id || 801,
    };
  }, [weatherData]);

  // Check if night time
  const isNight = useMemo(() => {
    const hour = time.getHours();
    return hour >= 18 || hour < 6;
  }, [time]);

  // Dynamic Weather Card Background & Text Theme (Matching WeatherDetail.tsx exactly)
  const { weatherTheme, weatherTextColor, weatherSubtextColor, maxTempColor, minTempColor } = useMemo(() => {
    const id = weather.id;
    if (isNight) {
      if (id >= 200 && id < 600) {
        // Rain / Drizzle / Thunderstorm Night
        return {
          weatherTheme: "from-[#020617] via-[#0F172A] to-[#1E3A8A] border-sky-500/30",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-sky-200/90",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-300"
        };
      } else if (id >= 700 && id < 800) {
        // Fog / Dust Night
        return {
          weatherTheme: "from-[#1E1E24] via-[#2D2D3A] to-[#48485E] border-amber-500/30",
          weatherTextColor: "text-amber-50",
          weatherSubtextColor: "text-amber-200/90",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-300"
        };
      } else if (id === 800) {
        // Clear Night
        return {
          weatherTheme: "from-[#03071E] via-[#0F172A] to-[#1E1B4B] border-indigo-400/30",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-indigo-200/90",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-300"
        };
      } else {
        // Night Cloudy
        return {
          weatherTheme: "from-[#0F172A] via-[#1E293B] to-[#312E81] border-indigo-500/30",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-indigo-200/90",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-300"
        };
      }
    } else {
      // Daytime
      if (id >= 200 && id < 600) {
        // Day Rain / Drizzle / Thunderstorm
        return {
          weatherTheme: "from-[#1E3A8A] via-[#2563EB] to-[#0284C7] border-blue-400/30",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-sky-100",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-200"
        };
      } else if (id >= 700 && id < 800) {
        // Day Fog / Dust / Haze
        return {
          weatherTheme: "from-[#B45309] via-[#D97706] to-[#F59E0B] border-amber-400/30",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-amber-100",
          maxTempColor: "text-red-200",
          minTempColor: "text-sky-200"
        };
      } else if (id === 800) {
        // Clear Sunny Day
        return {
          weatherTheme: "from-[#D97706] via-[#B45309] to-[#1E3A8A] border-amber-500/20",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-amber-100",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-200"
        };
      } else {
        // Day Cloudy / Partly Cloudy
        return {
          weatherTheme: "from-[#0284C7] via-[#2563EB] to-[#1D4ED8] border-sky-400/30",
          weatherTextColor: "text-white",
          weatherSubtextColor: "text-sky-100",
          maxTempColor: "text-red-300",
          minTempColor: "text-sky-200"
        };
      }
    }
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
          whileHover={{ scale: 1.025, y: -3 }}
          whileTap={{ scale: 0.975 }}
          className="w-full h-full"
        >
          <Link 
            to="/prayer-times" 
            className="relative bg-white rounded-[14px] sm:rounded-[22px] border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sm:shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-1.5 sm:p-3.5 md:p-4 flex flex-col items-center justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:border-emerald-300 hover:shadow-md transition-all duration-300 group overflow-hidden h-full block"
          >
            {/* Soft Shimmer Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Top Mosque Dome Graphic */}
            <div className="relative z-10 w-full flex justify-center group-hover:scale-105 transition-transform duration-300">
              <MosqueDomeIllustration />
            </div>

            {/* Middle Prayer Name */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full my-auto text-center">
              <h3 className="text-[12px] xs:text-[14px] sm:text-[21px] md:text-[25px] font-black text-[#015028] tracking-tight leading-none font-cairo group-hover:text-emerald-700 transition-colors">
                {formattedPrayer.name}
              </h3>
              
              {/* Dynamic Countdown Timer with Pulse Indicator */}
              <span className="text-[10px] xs:text-[12px] sm:text-[16px] md:text-[18px] font-black text-[#015028] font-sans mt-1 sm:mt-2.5 whitespace-nowrap tracking-tight inline-flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {prayerTimeRemaining}
              </span>
            </div>

            {/* Bottom Center Green Accent Bar */}
            <div className="relative z-10 w-6 sm:w-12 h-[2px] sm:h-[3px] bg-[#015028]/40 rounded-full my-1 sm:my-1.5 group-hover:w-10 sm:group-hover:w-16 group-hover:bg-[#015028] transition-all duration-300" />
          </Link>
        </motion.div>

        {/* 3. Third Item from Right: Weather Card (كارت الطقس) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          whileHover={{ scale: 1.025, y: -3 }}
          whileTap={{ scale: 0.975 }}
          className="w-full h-full"
        >
          <Link 
            to="/weather" 
            className={`relative bg-gradient-to-br ${weatherTheme} rounded-[14px] sm:rounded-[22px] border shadow-[0_4px_20px_rgba(0,0,0,0.12)] p-1.5 sm:p-3.5 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:shadow-lg transition-all duration-300 overflow-hidden group h-full block`}
          >
            {/* Atmosphere Radial Lighting Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top Section: Temp + Dynamic 3D Weather Icon */}
            <div className="relative z-10 flex items-start justify-between w-full">
              <span className={`text-[18px] xs:text-[22px] sm:text-[34px] md:text-[42px] font-black ${weatherTextColor} leading-none tracking-tight font-sans drop-shadow-xs group-hover:scale-105 transition-transform duration-300 origin-left`}>
                {weather.temp}°
              </span>
              <div className="group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <DynamicWeather3DIcon weatherId={weather.id} />
              </div>
            </div>

            {/* Middle Weather Condition Description */}
            <div className="relative z-10 my-auto">
              <p className={`text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[16px] font-bold ${weatherSubtextColor} tracking-wide whitespace-nowrap leading-tight drop-shadow-xs font-cairo`}>
                {weather.condition}
              </p>
            </div>

            {/* Bottom Row: Max and Min Temperatures */}
            <div className="relative z-10 flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1.5">
              <div className={`flex items-center gap-0.5 ${maxTempColor} font-bold text-[9px] xs:text-[11px] sm:text-[14px]`}>
                <span className="text-[8px] sm:text-[10px] leading-none inline-block group-hover:-translate-y-0.5 transition-transform">▲</span>
                <span className="font-sans">{weather.tempMax}°</span>
              </div>
              <div className={`flex items-center gap-0.5 ${minTempColor} font-bold text-[9px] xs:text-[11px] sm:text-[14px]`}>
                <span className="text-[8px] sm:text-[10px] leading-none inline-block group-hover:translate-y-0.5 transition-transform">▼</span>
                <span className="font-sans">{weather.tempMin}°</span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 4. Leftmost Item: Date Card (كارت التاريخ الهجري) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          whileHover={{ scale: 1.025, y: -3 }}
          whileTap={{ scale: 0.975 }}
          className="w-full h-full"
        >
          <Link 
            to="/calendar" 
            className="relative bg-gradient-to-br from-[#0B6B3D] via-[#054E29] to-[#00341B] rounded-[14px] sm:rounded-[22px] border-2 border-[#E5A921]/60 shadow-[0_4px_20px_rgba(1,80,40,0.25)] p-1.5 sm:p-3.5 md:p-5 flex flex-col items-center justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:border-[#E5A921] hover:shadow-[0_6px_24px_rgba(229,169,33,0.35)] transition-all duration-300 overflow-hidden group h-full block"
          >
            {/* Atmosphere Lighting Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300/25 via-transparent to-black/50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Floating Gold Badge with Crescent Icon at Top Right */}
            <div className="absolute top-1 sm:top-2.5 right-1 sm:right-2.5 w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-[#002814]/80 backdrop-blur-md border border-[#E5A921]/70 shadow-2xs flex items-center justify-center z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <img 
                src="/crescentcalendarhahri.png" 
                alt="هلال" 
                className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain"
              />
            </div>

            {/* Center Date Information */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full my-auto text-center pt-1 sm:pt-2">
              {/* Day Name */}
              <h3 className="text-[12px] xs:text-[14px] sm:text-[21px] md:text-[25px] font-black text-white tracking-tight leading-none drop-shadow-xs font-cairo group-hover:text-amber-100 transition-colors">
                {dayName}
              </h3>

              {/* Hijri Date */}
              <p className="text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[17px] font-black text-[#FFF2A8] leading-none mt-1 sm:mt-2 whitespace-nowrap drop-shadow-xs font-cairo group-hover:scale-105 transition-transform duration-300">
                {hijriDate}
              </p>

              {/* Gregorian Date */}
              <p className="text-[8.5px] xs:text-[9.5px] sm:text-[13px] md:text-[14px] font-bold text-emerald-100/90 leading-none mt-0.5 sm:mt-1.5 whitespace-nowrap">
                {gregorianDate}
              </p>
            </div>

            {/* Bottom Center Gold Accent Bar */}
            <div className="relative z-10 w-6 sm:w-12 h-[2px] sm:h-[3.5px] bg-[#E5A921] rounded-full mt-0.5 sm:mt-1.5 shadow-2xs group-hover:w-10 sm:group-hover:w-16 group-hover:bg-[#FFF2A8] transition-all duration-300" />
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

