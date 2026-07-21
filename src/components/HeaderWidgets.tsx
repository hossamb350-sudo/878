import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { API_BASE, fetchWithFallback } from "../config/apiConfig";
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  Wind, 
  Snowflake, 
  CloudLightning, 
  CloudRain, 
  CloudDrizzle, 
  Moon, 
  CloudMoon, 
  Sunrise, 
  Sunset, 
  Tornado,
  ThermometerSun
} from 'lucide-react';

// 3D-styled SVG Icon Renderers to match the premium reference image style

const render3DCalendarIcon = () => (
  <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="calBg" x1="8" y1="14" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <linearGradient id="calHeader" x1="8" y1="14" x2="56" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.1" />
      </filter>
    </defs>
    
    {/* Calendar body base */}
    <rect x="8" y="14" width="48" height="42" rx="10" fill="url(#calBg)" filter="url(#softShadow)" />
    
    {/* Blue Header Bar */}
    <path d="M8 24C8 18.4772 12.4772 14 18 14H46C51.5228 14 56 18.4772 56 24V28H8V24Z" fill="url(#calHeader)" />
    
    {/* Rings / Binder loops */}
    <rect x="18" y="8" width="5" height="11" rx="2.5" fill="url(#ringGrad)" />
    <rect x="41" y="8" width="5" height="11" rx="2.5" fill="url(#ringGrad)" />
    
    {/* Grid dots on the calendar page representing events/dates */}
    <g fill="#3B82F6" opacity="0.8">
      <rect x="16" y="34" width="6" height="5" rx="1.5" />
      <rect x="26" y="34" width="6" height="5" rx="1.5" />
      <rect x="36" y="34" width="6" height="5" rx="1.5" />
      <rect x="46" y="34" width="6" height="5" rx="1.5" />
      
      <rect x="16" y="44" width="6" height="5" rx="1.5" />
      <rect x="26" y="44" width="6" height="5" rx="1.5" />
      <rect x="36" y="44" width="6" height="5" rx="1.5" />
      <rect x="46" y="44" width="6" height="5" rx="1.5" />
    </g>
  </svg>
);


const renderMosqueDomeIcon = () => (
  <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="domeGrad" x1="16" y1="20" x2="48" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="domeBaseGrad" x1="12" y1="46" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>
      <linearGradient id="crescentGrad" x1="30" y1="2" x2="36" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect x="12" y="46" width="40" height="4" rx="2" fill="url(#domeBaseGrad)" />
    <rect x="18" y="44" width="28" height="2" rx="1" fill="#10B981" />
    <path d="M16 44C16 31 21 19 32 19C43 19 48 31 48 44H16Z" fill="url(#domeGrad)" />
    <path d="M31.5 8H32.5V19H31.5V8Z" fill="url(#crescentGrad)" />
    <circle cx="32" cy="14" r="1.5" fill="#34D399" />
    <circle cx="32" cy="11" r="1.2" fill="#34D399" />
    <path d="M32 2C34.5 2 36.5 3.5 36.5 5.5C36.5 7.5 34.5 9 32 9C34 9 35.5 7.5 35.5 5.5C35.5 3.5 34 2 32 2Z" fill="url(#crescentGrad)" />
  </svg>
);


// Premium Gold Separator
const GoldSeparator = () => (
  <div className="w-[1px] my-3 sm:my-4 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent self-stretch shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
);

const WeatherIcon = ({ code, isNight, temp = 25, hours }: { code?: number, isNight?: boolean, temp?: number, hours?: number }) => {
  const hr = hours !== undefined ? hours : new Date().getHours();
  
  const iconProps = {
    className: "w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 stroke-[1.5] drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)] transition-transform hover:scale-105",
  };

  // 1. Check for Sunrise/Sunset temporal transitions first if sky is relatively clear
  const isClearOrPartlyCloudy = !code || code === 800 || code === 801 || code === 802;
  if (isClearOrPartlyCloudy) {
    if (hr === 5 || hr === 6) return <Sunrise {...iconProps} className={`${iconProps.className} text-amber-400`} />;
    if (hr === 17 || hr === 18) return <Sunset {...iconProps} className={`${iconProps.className} text-rose-500`} />;
  }

  // 2. Check for Windy / Dust conditions (Atmosphere group 7xx)
  if (code && code >= 700 && code < 800) {
    if (code === 741 || code === 701 || code === 721) {
      return <CloudFog {...iconProps} className={`${iconProps.className} text-slate-400`} />;
    }
    if (code === 761 || code === 751 || code === 731 || code === 762) {
      return <Tornado {...iconProps} className={`${iconProps.className} text-amber-600/80`} />;
    }
    return <Wind {...iconProps} className={`${iconProps.className} text-slate-400`} />;
  }

  // 3. Snow / Cold conditions (6xx)
  if (code && code >= 600 && code < 700) {
    return <Snowflake {...iconProps} className={`${iconProps.className} text-sky-400`} />;
  }
  if (temp <= 10 && code && code >= 801) {
    return <Snowflake {...iconProps} className={`${iconProps.className} text-sky-400`} />;
  }

  // 4. Thunderstorm conditions (2xx)
  if (code && code >= 200 && code < 300) {
    return <CloudLightning {...iconProps} className={`${iconProps.className} text-indigo-500`} />;
  }

  // 5. Rain / Drizzle conditions (3xx, 5xx)
  if (code && ((code >= 300 && code < 400) || (code >= 500 && code < 600))) {
    if (code === 511) return <Snowflake {...iconProps} className={`${iconProps.className} text-sky-400`} />;
    
    const isHeavy = code === 502 || code === 503 || code === 504 || code === 522 || code === 531;
    if (isHeavy) return <CloudRain {...iconProps} className={`${iconProps.className} text-blue-600`} />;
    return <CloudDrizzle {...iconProps} className={`${iconProps.className} text-blue-400`} />;
  }

  // 6. Clear Sky (800)
  if (code === 800) {
    if (isNight) return <Moon {...iconProps} className={`${iconProps.className} text-slate-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]`} />;
    if (temp >= 32) return <ThermometerSun {...iconProps} className={`${iconProps.className} text-rose-500`} />;
    return <Sun {...iconProps} className={`${iconProps.className} text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]`} />;
  }

  // 7. Cloudy conditions (801 - 804)
  if (code === 801 || code === 802) {
    return isNight ? <CloudMoon {...iconProps} className={`${iconProps.className} text-slate-300`} /> : <CloudSun {...iconProps} className={`${iconProps.className} text-amber-500`} />;
  }
  if (code === 803 || code === 804) {
    return <Cloud {...iconProps} className={`${iconProps.className} text-slate-500`} />;
  }

  return isNight ? <CloudMoon {...iconProps} className={`${iconProps.className} text-slate-300`} /> : <CloudSun {...iconProps} className={`${iconProps.className} text-amber-500`} />;
};

export const HeaderWidgets: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState<{ temp: number; temp_max?: number; temp_min?: number; condition: string; id: number; icon?: string } | null>(() => {
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
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=13.5795&lon=44.0203&appid=${import.meta.env.OPENWEATHER_API_KEY}&units=metric&lang=ar`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=13.5795&lon=44.0203&appid=${import.meta.env.OPENWEATHER_API_KEY}&units=metric&lang=ar`)
        ]);
        
        if (weatherRes.ok && forecastRes.ok) {
          const wData = await weatherRes.json();
          const fData = await forecastRes.json();
          
          // Compute today's actual min and max from the next 24 hours of forecast
          const todayForecasts = fData.list.slice(0, 8);
          const minTemps = todayForecasts.map((item: any) => item.main.temp_min);
          const maxTemps = todayForecasts.map((item: any) => item.main.temp_max);
          
          // Include current weather temp readings to cover all bases
          minTemps.push(wData.main.temp_min);
          maxTemps.push(wData.main.temp_max);

          const temp_min = Math.round(Math.min(...minTemps));
          const temp_max = Math.round(Math.max(...maxTemps));

          const newWeatherData = {
            temp: Math.round(wData.main.temp),
            temp_max: temp_max,
            temp_min: temp_min,
            condition: wData.weather[0].description,
            id: wData.weather[0].id,
            icon: wData.weather[0].icon
          };

          setWeatherData(newWeatherData);
          localStorage.setItem("cached_weather_data", JSON.stringify(newWeatherData));
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

          // Extract and store accurate Hijri date from Aladhan API response
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
    const prayerInterval = setInterval(fetchPrayerTimes, 12 * 60 * 60 * 1000); // every 12 hours
    return () => {
      clearInterval(interval);
      clearInterval(prayerInterval);
    };
  }, []);

  // Local robust Hijri Date calculation fallback
  const hijriParts = useMemo(() => {
    try {
      const dayMonth = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
      }).format(time);
      const yearStr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric'
      }).format(time);
      
      const numericMonth = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        month: 'numeric'
      }).format(time);
      const numericYear = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        year: 'numeric'
      }).format(time);

      return { dayMonth, year: yearStr, m: parseInt(numericMonth), y: parseInt(numericYear) };
    } catch (e) {
      return {
        dayMonth: time.toLocaleDateString("ar-SA-u-ca-islamic", { day: "numeric", month: "long" }),
        year: time.toLocaleDateString("ar-SA-u-ca-islamic", { year: "numeric" }),
        m: 1,
        y: 1448
      };
    }
  }, [time]);

  const displayHijri = useMemo(() => {
    if (apiHijriDate) return apiHijriDate;
    return `${hijriParts.dayMonth} ${hijriParts.year}`;
  }, [apiHijriDate, hijriParts]);

  const getArabicDayName = (date: Date) => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return days[date.getDay()];
  };

  const isNight = useMemo(() => {
    const hours = time.getHours();
    return hours < 6 || hours >= 18;
  }, [time]);

  const weather = weatherData ? {
    temp: weatherData.temp,
    temp_max: weatherData.temp_max,
    temp_min: weatherData.temp_min,
    condition: weatherData.condition,
    icon: weatherData.icon,
  } : {
    temp: 27,
    temp_max: 29,
    temp_min: 24,
    condition: "غائم جزئي",
    icon: "02d"
  };

  // Calculate Next Prayer Countdown (always displaying hours and minutes)
  const nextPrayerInfo = useMemo(() => {
    const currentHour = time.getHours();
    const currentMin = time.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    const defaultPrayer = { name: "الفجر", countdown: "... " };
    
    if (!prayerTimes) return defaultPrayer;

    for (const prayer of prayerTimes) {
      const [pHour, pMin] = prayer.time.split(":").map(Number);
      const prayerTotalMins = pHour * 60 + pMin;
      
      if (prayerTotalMins > currentTotalMins) {
        const diff = prayerTotalMins - currentTotalMins;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return { 
          name: prayer.name, 
          countdown: hours > 0 ? `${hours} س و ${mins} د` : `${mins} د`,
        };
      }
    }
    
    // Calculate difference to next day's Fajr
    const fajr = prayerTimes[0];
    const [fHour, fMin] = fajr.time.split(":").map(Number);
    const fajrTotalMinsNextDay = fHour * 60 + fMin + (24 * 60);
    const diff = fajrTotalMinsNextDay - currentTotalMins;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    
    return { 
      name: fajr.name, 
      countdown: hours > 0 ? `${hours} س و ${mins} د` : `${mins} د`, 
    };
  }, [time, prayerTimes]);

  return (
    <div className="w-full max-w-full mx-auto px-0 pt-0 pb-0 select-none" dir="rtl">
      <div className="w-full bg-slate-50/95 backdrop-blur-md rounded-none border-b border-slate-200/60 shadow-sm flex items-stretch p-1 sm:p-1.5 overflow-hidden min-h-[95px] sm:min-h-[115px] md:min-h-[130px] transition-all duration-300">
        
        {/* 1. Platform Branding Card */}
        <div className="flex-[1.6] md:flex-[1.8] relative flex flex-col items-center justify-center text-center p-2 select-none bg-transparent m-1">
          
          {/* Logo container without any background overlay or separators */}
          <div className="flex flex-col items-center justify-center w-full">
            {/* Platform Logo */}
            <img 
              src="/Resources/logo3.png" 
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.includes("/Resources/")) {
                  target.src = "/resources/logo3.png";
                } else if (target.src.includes("/resources/")) {
                  target.src = "/logo3.png";
                } else if (target.src.includes("/logo3.png")) {
                  target.src = "Resources/logo3.png";
                }
              }}
              alt="Taiz Media Platform Logo" 
              className="h-[58px] sm:h-[78px] md:h-[94px] lg:h-[106px] w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-102 transition-transform" 
            />
          </div>

        </div>

        {/* Separator */}
        <GoldSeparator />

        {/* 2. Prayer Times Card (Dynamic with 3D Emerald Mosque matching reference) */}
        <Link 
          to="/prayer-times" 
          className="flex-1 flex flex-col items-center justify-center text-center p-2 min-w-0 bg-white border border-slate-200/60 rounded-none shadow-sm m-1 hover:bg-slate-50 active:scale-98 transition-all duration-200"
        >
          <div className="mb-1 sm:mb-1.5 shrink-0">
            {renderMosqueDomeIcon()}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-[#10B981] font-cairo leading-none">
              {nextPrayerInfo.name}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-[#10B981] font-black font-cairo leading-none mt-1 whitespace-nowrap">
              {nextPrayerInfo.countdown}
            </span>
          </div>
        </Link>

        {/* Separator */}
        <GoldSeparator />

        {/* 3. Weather Card (Dynamic with 3D Cloud/Sun matching reference) */}
        <Link 
          to="/weather" 
          className="flex-1 flex flex-col items-center justify-center text-center p-2 min-w-0 bg-white border border-slate-200/60 rounded-none shadow-sm m-1 hover:bg-slate-50 active:scale-98 transition-all duration-200"
        >
          <div className="mb-1 sm:mb-1.5 shrink-0">
            <WeatherIcon code={weatherData?.id} isNight={isNight} temp={weatherData?.temp} hours={time.getHours()} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-red-600 font-cairo leading-none flex items-center justify-center gap-1">
              <span>{weather.temp_min}°</span>
              <span className="text-slate-400 font-normal">/</span>
              <span>{weather.temp_max}°</span>
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 truncate max-w-full">
              {weather.condition}
            </span>
          </div>
        </Link>

        {/* Separator */}
        <GoldSeparator />

        {/* 4. Date Card */}
        <Link 
          to={`/calendar/${hijriParts.m}/${hijriParts.y}`} 
          className="flex-1 flex flex-col items-center justify-center text-center p-2 min-w-0 bg-white border border-slate-200/60 rounded-none shadow-sm m-1 hover:bg-slate-50 active:scale-98 transition-all duration-200"
        >
          <div className="mb-1 sm:mb-1.5 shrink-0">
            {render3DCalendarIcon()}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-[#0B1C3E] font-cairo leading-none">
              {getArabicDayName(time)}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 whitespace-nowrap">
              {displayHijri}
            </span>
          </div>
        </Link>

      </div>
    </div>
  );
};
