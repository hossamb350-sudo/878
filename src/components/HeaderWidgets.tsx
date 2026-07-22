import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
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
        {/* Rain Drops */}
        <line x1="22" y1="44" x2="19" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="44" x2="29" y2="54" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="44" x2="39" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
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
        <g stroke="#F59E0B" strokeWidth="3" strokeLinecap="round">
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
      <g stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round">
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

// 3D Mosque Dome Vector Illustration
const MosqueDomeIllustration = () => (
  <svg className="w-full h-8 sm:h-14 md:h-18 select-none shrink-0" viewBox="0 0 160 90" fill="none">
    <defs>
      <linearGradient id="domeGrad3D" x1="80" y1="15" x2="80" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#15803D" />
        <stop offset="60%" stopColor="#166534" />
        <stop offset="100%" stopColor="#0F5128" />
      </linearGradient>
      <linearGradient id="skyWave" x1="0" y1="0" x2="0" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E2F3E7" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#D1EBD9" stopOpacity="0.75" />
      </linearGradient>
    </defs>
    <path d="M0 65 Q 40 45, 80 58 T 160 55 V 90 H 0 Z" fill="url(#skyWave)" />
    <path d="M120 70 V 38 H 126 V 70 Z M123 28 L120 38 H126 Z M123 22 L123 28" stroke="#86EFAC" strokeWidth="1.5" fill="none" opacity="0.65" />
    <path d="M58 70 C58 48 68 30 80 30 C92 30 102 48 102 70 Z" fill="url(#domeGrad3D)" />
    <path d="M72 70 C72 60 76 54 80 54 C84 54 88 60 88 70 Z" fill="#DCFCE7" opacity="0.95" />
    <line x1="80" y1="30" x2="80" y2="15" stroke="#15803D" strokeWidth="2" />
    <path d="M80 12 C82 12 84 13.5 84 15.5 C84 17.5 82 19 80 19 C82 19 83.5 17.5 83.5 15.5 C83.5 13.5 82 12 80 12 Z" fill="#15803D" />
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
        const apiKey = import.meta.env.OPENWEATHER_API_KEY;

        if (apiKey) {
          const [weatherRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=13.5795&lon=44.0203&appid=${apiKey}&units=metric&lang=ar`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=13.5795&lon=44.0203&appid=${apiKey}&units=metric&lang=ar`)
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
        }

        if (!fetched) {
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
          }
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
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
        }
      } catch (err) {
        console.error("Failed to fetch prayer times", err);
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

  // Dynamic Weather Card Background Classes Based on Condition ID
  const weatherCardTheme = useMemo(() => {
    const id = weather.id;
    if (id >= 200 && id < 600) {
      // Rain / Drizzle / Thunderstorm
      return "from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] border-[#38BDF8] hover:border-[#0284C7]";
    } else if (id === 800) {
      // Clear / Sunny
      return "from-[#FFF9E6] via-[#FFF3D1] to-[#FFE8A3] border-[#FFE082] hover:border-[#FFCA28]";
    } else if (id >= 700 && id < 800) {
      // Dust / Fog / Atmosphere
      return "from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B] border-[#FBBF24] hover:border-[#D97706]";
    }
    // Default: Clouds / Partly Cloudy
    return "from-[#EBF4FF] via-[#E5F1FF] to-[#DBEBFF] border-[#CBE3FC] hover:border-[#93C5FD]";
  }, [weather.id]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-1.5 sm:px-4 py-1.5 sm:py-3 select-none" dir="rtl">
      {/* 4 Columns Horizontal Grid - Compact & Responsive for Mobile */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 items-stretch">
        
        {/* 1. Far Right Item: Platform Logo (شعار المنصة بدون خلفية بيضاء) */}
        <div className="flex items-center justify-center min-h-[105px] sm:min-h-[160px] md:min-h-[185px] w-full h-full transition-transform duration-200 hover:scale-[1.01] overflow-hidden">
          <img 
            src="/logo3.png" 
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith("/logo3.png") && !target.src.includes("/Resources/")) {
                target.src = "/Resources/logo3.png";
              } else if (target.src.includes("/Resources/")) {
                target.src = "/resources/logo3.png";
              }
            }}
            alt="منصة تعز الإعلامية" 
            className="w-full h-full max-h-[105px] sm:max-h-[160px] md:max-h-[185px] object-contain select-none" 
          />
        </div>

        {/* 2. Second Item from Right: Prayer Times Card (كارت مواقيت الصلاة) */}
        <Link 
          to="/prayer-times" 
          className="relative bg-gradient-to-b from-[#F2F9F5] via-[#F7FCF9] to-[#EDF7F2] rounded-[14px] sm:rounded-[22px] border border-[#D2EBD9] shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-1.5 sm:p-3.5 md:p-4 flex flex-col items-center justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:border-[#A3E0B5] active:scale-[0.99] transition-all duration-200 group overflow-hidden"
        >
          {/* Top 3D Mosque Dome Graphic */}
          <div className="w-full flex justify-center">
            <MosqueDomeIllustration />
          </div>

          {/* Middle Prayer Name and Time */}
          <div className="flex flex-col items-center justify-center w-full my-auto">
            <h3 className="text-[13px] xs:text-[15px] sm:text-[22px] md:text-[27px] font-black text-[#0B6B3D] tracking-tight leading-none">
              {formattedPrayer.name}
            </h3>
            
            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-0.5 sm:mt-1.5 text-[#1E293B]">
              <span className="text-[11px] xs:text-[13px] sm:text-[18px] md:text-[21px] font-bold tracking-wider font-sans">
                {formattedPrayer.time}
              </span>
              <span className="text-[#CBD5E1] text-[9px] sm:text-[14px] font-normal">|</span>
              <span className="text-[11px] xs:text-[13px] sm:text-[18px] md:text-[21px] font-bold">
                {formattedPrayer.period}
              </span>
            </div>
          </div>

          {/* Bottom Location Pill Badge - Updated to Taiz Governorate */}
          <div className="w-full bg-[#E1F3E7] rounded-lg sm:rounded-xl py-0.5 sm:py-1 px-1 sm:px-2.5 flex items-center justify-center gap-0.5 sm:gap-1.5 mt-0.5 sm:mt-1.5 group-hover:bg-[#D4EBDC] transition-colors">
            <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#0B6B3D] fill-[#0B6B3D]/20 shrink-0" />
            <span className="text-[8.5px] xs:text-[10px] sm:text-[12px] md:text-[13px] font-bold text-[#0B6B3D] whitespace-nowrap">
              في محافظة تعز
            </span>
          </div>
        </Link>

        {/* 3. Third Item from Right: Weather Card (كارت الطقس مع خلفية ديناميكية حسب حالة الجو) */}
        <Link 
          to="/weather" 
          className={`relative bg-gradient-to-b ${weatherCardTheme} rounded-[14px] sm:rounded-[22px] border shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-1.5 sm:p-3.5 md:p-5 flex flex-col justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] active:scale-[0.99] transition-all duration-300 overflow-hidden`}
        >
          {/* Top Section: Temp + Dynamic 3D Weather Icon */}
          <div className="flex items-start justify-between w-full">
            <span className="text-[18px] xs:text-[22px] sm:text-[34px] md:text-[42px] font-black text-[#0F172A] leading-none tracking-tight font-sans">
              {weather.temp}°
            </span>
            <DynamicWeather3DIcon weatherId={weather.id} />
          </div>

          {/* Middle Weather Condition Description */}
          <div className="my-auto">
            <p className="text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[16px] font-bold text-[#1E293B] tracking-wide whitespace-nowrap leading-tight">
              {weather.condition}
            </p>
          </div>

          {/* Bottom Row: Max and Min Temperatures with Triangles */}
          <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1.5">
            <div className="flex items-center gap-0.5 text-[#DC2626] font-bold text-[9px] xs:text-[11px] sm:text-[14px]">
              <span className="text-[8px] sm:text-[10px] leading-none">▲</span>
              <span className="font-sans">{weather.tempMax}°</span>
            </div>
            <div className="flex items-center gap-0.5 text-[#2563EB] font-bold text-[9px] xs:text-[11px] sm:text-[14px]">
              <span className="text-[8px] sm:text-[10px] leading-none">▼</span>
              <span className="font-sans">{weather.tempMin}°</span>
            </div>
          </div>
        </Link>

        {/* 4. Leftmost Item: Date Card (كارت التاريخ) */}
        <Link 
          to="/calendar" 
          className="relative bg-white rounded-[14px] sm:rounded-[22px] border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-1.5 sm:p-3.5 md:p-5 flex flex-col items-center justify-between min-h-[105px] sm:min-h-[160px] md:min-h-[185px] hover:border-slate-300 active:scale-[0.99] transition-all duration-200 overflow-hidden"
        >
          {/* Floating White Badge with Red Calendar Icon at Top Right */}
          <div className="absolute top-1 sm:top-3 right-1 sm:right-3 w-5 h-5 sm:w-9 sm:h-9 rounded-[6px] sm:rounded-[12px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-slate-100 flex items-center justify-center z-10">
            <RedCalendarIcon />
          </div>

          {/* Center Date Information */}
          <div className="flex flex-col items-center justify-center w-full my-auto text-center pt-1 sm:pt-2">
            {/* Day Name */}
            <h3 className="text-[12px] xs:text-[14px] sm:text-[21px] md:text-[25px] font-black text-[#0F172A] tracking-tight leading-none">
              {dayName}
            </h3>

            {/* Hijri Date */}
            <p className="text-[9.5px] xs:text-[11px] sm:text-[15px] md:text-[17px] font-bold text-[#DC2626] leading-none mt-1 sm:mt-2 whitespace-nowrap">
              {hijriDate}
            </p>

            {/* Gregorian Date */}
            <p className="text-[8.5px] xs:text-[9.5px] sm:text-[13px] md:text-[14px] font-semibold text-[#64748B] leading-none mt-0.5 sm:mt-1.5 whitespace-nowrap">
              {gregorianDate}
            </p>
          </div>

          {/* Bottom Center Red Accent Bar */}
          <div className="w-6 sm:w-12 h-[2px] sm:h-[3.5px] bg-[#DC2626] rounded-full mt-0.5 sm:mt-1.5" />
        </Link>

      </div>
    </div>
  );
};
