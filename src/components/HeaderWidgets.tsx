import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

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

const renderSunny = () => (
  <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sunnySun" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFFEEF" />
        <stop offset="30%" stopColor="#FDBA74" />
        <stop offset="100%" stopColor="#EA580C" />
      </radialGradient>
      <filter id="sunGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="15" fill="url(#sunnySun)" filter="url(#sunGlow)" />
    <g stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
      <line x1="32" y1="6" x2="32" y2="10" />
      <line x1="32" y1="54" x2="32" y2="58" />
      <line x1="6" y1="32" x2="10" y2="32" />
      <line x1="54" y1="32" x2="58" y2="32" />
      <line x1="14" y1="14" x2="17" y2="17" />
      <line x1="47" y1="47" x2="50" y2="50" />
      <line x1="14" y1="50" x2="17" y2="47" />
      <line x1="47" y1="17" x2="50" y2="14" />
    </g>
  </svg>
);

const renderPartlyCloudy = () => (
  <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-lg select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pcSun" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFFEEF" />
        <stop offset="35%" stopColor="#FDBA74" />
        <stop offset="100%" stopColor="#F97316" />
      </radialGradient>
      <linearGradient id="pcCloud" x1="20" y1="22" x2="48" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <filter id="pcShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.12" />
      </filter>
    </defs>
    {/* Sun Behind Cloud */}
    <circle cx="26" cy="24" r="11" fill="url(#pcSun)" />
    <g stroke="#EA580C" strokeWidth="2" strokeLinecap="round" opacity="0.8">
      <line x1="26" y1="6" x2="26" y2="9" />
      <line x1="8" y1="24" x2="11" y2="24" />
      <line x1="13" y1="11" x2="15.5" y2="13.5" />
      <line x1="39" y1="11" x2="36.5" y2="13.5" />
    </g>
    {/* Soft Fluffy Cloud */}
    <path d="M44 44C48.5 44 52 40.5 52 36C52 31.5 48.5 28 44 28C43 28 42.1 28.2 41.2 28.6C39.8 23.5 35 20 29.5 20C23 20 17.5 25 17 31.5C12.5 32 9 35.5 9 40C9 44.5 12.5 48 17 48H44V44Z" fill="url(#pcCloud)" filter="url(#pcShadow)" />
  </svg>
);

const renderMosqueDomeIcon = () => (
  <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Emerald Green 3D Dome Gradient */}
      <linearGradient id="domeGrad" x1="16" y1="20" x2="48" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {/* Dome Base Gradient */}
      <linearGradient id="domeBaseGrad" x1="12" y1="46" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>
      {/* Crescent Moon Gradient (Green) */}
      <linearGradient id="crescentGrad" x1="30" y1="2" x2="36" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Mosque Dome Base / Platform */}
    <rect x="12" y="46" width="40" height="4" rx="2" fill="url(#domeBaseGrad)" />
    <rect x="18" y="44" width="28" height="2" rx="1" fill="#10B981" />
    {/* Dome Body */}
    <path d="M16 44C16 31 21 19 32 19C43 19 48 31 48 44H16Z" fill="url(#domeGrad)" />
    {/* Center Spire */}
    <path d="M31.5 8H32.5V19H31.5V8Z" fill="url(#crescentGrad)" />
    {/* Small spheres on spire */}
    <circle cx="32" cy="14" r="1.5" fill="#34D399" />
    <circle cx="32" cy="11" r="1.2" fill="#34D399" />
    {/* Crescent Moon on Top */}
    <path d="M32 2C34.5 2 36.5 3.5 36.5 5.5C36.5 7.5 34.5 9 32 9C34 9 35.5 7.5 35.5 5.5C35.5 3.5 34 2 32 2Z" fill="url(#crescentGrad)" />
  </svg>
);

// Dynamic 3D weather icons based on OpenWeather conditions
const renderWeather3DIcon = (code?: number) => {
  if (!code) return renderPartlyCloudy();
  
  if (code === 800) return renderSunny();
  if (code === 801 || code === 802) return renderPartlyCloudy();
  
  // Cloudy
  if (code > 802 && code < 900) {
    return (
      <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="c1" x1="15" y1="20" x2="45" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="c2" x1="25" y1="25" x2="55" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>
        <path d="M38 42C42 42 45 39 45 35C45 31 42 28 38 28C37.2 28 36.5 28.2 35.8 28.5C34.6 24.2 30.6 21 26 21C20.5 21 16 25.5 15.5 31C11.8 31.5 9 34.5 9 38C9 41.5 11.8 44.5 15.5 44.5H38V42Z" fill="url(#c1)" />
        <path d="M46 46C50 46 53 43 53 39C53 35 50 32 46 32C45.2 32 44.5 32.2 43.8 32.5C42.6 28.2 38.6 25 34 25C28.5 25 24 29.5 23.5 35C19.8 35.5 17 38.5 17 42C17 45.5 19.8 48.5 23.5 48.5H46V46Z" fill="url(#c2)" />
      </svg>
    );
  }
  
  // Rain / Drizzle
  if (code >= 300 && code < 600) {
    return (
      <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rainCloud" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="60%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <path d="M44 40C48.5 40 52 36.5 52 32C52 27.5 48.5 24 44 24C43 24 42.1 24.2 41.2 24.6C39.8 19.5 35 16 29.5 16C23 16 17.5 21 17 27.5C12.5 28 9 31.5 9 36C9 40.5 12.5 44 17 44H44V40Z" fill="url(#rainCloud)" />
        <path d="M22 48 L20 52 M32 48 L30 52 M42 48 L40 52" stroke="url(#dropGrad)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  
  // Thunderstorm
  if (code >= 200 && code < 300) {
    return (
      <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="thunderCloud" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="boltGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>
        <path d="M44 40C48.5 40 52 36.5 52 32C52 27.5 48.5 24 44 24C43 24 42.1 24.2 41.2 24.6C39.8 19.5 35 16 29.5 16C23 16 17.5 21 17 27.5C12.5 28 9 31.5 9 36C9 40.5 12.5 44 17 44H44V40Z" fill="url(#thunderCloud)" />
        <path d="M30 42 L26 48 L31 48 L28 54 L36 46 L31 46 Z" fill="url(#boltGrad)" filter="drop-shadow(0 0 2px #EAB308)" />
      </svg>
    );
  }
  
  // Snow
  if (code >= 600 && code < 700) {
    return (
      <svg className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 drop-shadow-md select-none transform hover:scale-105 transition-transform" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="snowCloud" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
        <path d="M44 40C48.5 40 52 36.5 52 32C52 27.5 48.5 24 44 24C43 24 42.1 24.2 41.2 24.6C39.8 19.5 35 16 29.5 16C23 16 17.5 21 17 27.5C12.5 28 9 31.5 9 36C9 40.5 12.5 44 17 44H44V40Z" fill="url(#snowCloud)" />
        <circle cx="22" cy="48" r="2.5" fill="#FFFFFF" />
        <circle cx="32" cy="49" r="2" fill="#FFFFFF" />
        <circle cx="42" cy="48" r="2.5" fill="#FFFFFF" />
      </svg>
    );
  }

  return renderPartlyCloudy();
};

// Premium Separator matching the gold metallic diamond divider in reference
const GoldSeparator: React.FC = () => (
  <div className="flex flex-col items-center justify-center shrink-0 h-12 sm:h-16 md:h-20 select-none">
    <div className="w-[1px] h-[30%] bg-gradient-to-b from-transparent via-amber-400/40 to-amber-400/50" />
    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-amber-300 to-amber-600 rotate-45 my-[-2px] sm:my-[-3px] shadow-[0_1px_3px_rgba(120,53,15,0.2)] border-[0.5px] border-amber-500/30" />
    <div className="w-[1px] h-[30%] bg-gradient-to-b from-amber-400/50 via-amber-400/40 to-transparent" />
  </div>
);

export const HeaderWidgets: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string; id: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<{ name: string; time: string }[] | null>(null);
  const [apiHijriDate, setApiHijriDate] = useState<string | null>(null);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather?lat=13.5795&lon=44.0203');
        if (response.ok) {
          const data = await response.json();
          setWeatherData({
            temp: Math.round(data.main.temp),
            condition: data.weather[0].description,
            id: data.weather[0].id
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch('/api/prayer-times');
        if (response.ok) {
          const data = await response.json();
          const timings = data.data.timings;
          setPrayerTimes([
            { name: "الفجر", time: timings.Fajr },
            { name: "الظهر", time: timings.Dhuhr },
            { name: "العصر", time: timings.Asr },
            { name: "المغرب", time: timings.Maghrib },
            { name: "العشاء", time: timings.Isha },
          ]);

          // Extract and store accurate Hijri date from Aladhan API response
          const hijri = data.data.date.hijri;
          setApiHijriDate(`${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`);
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
      const year = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric'
      }).format(time);
      return { dayMonth, year };
    } catch (e) {
      return {
        dayMonth: time.toLocaleDateString("ar-SA-u-ca-islamic", { day: "numeric", month: "long" }),
        year: time.toLocaleDateString("ar-SA-u-ca-islamic", { year: "numeric" })
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

  const weather = weatherData ? {
    temp: weatherData.temp,
    condition: weatherData.condition,
  } : {
    temp: 27,
    condition: "غائم جزئي",
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
    <div className="w-full max-w-7xl mx-auto px-4 pt-3.5 pb-2 bg-surface-main select-none" dir="rtl">
      <div className="w-full bg-white rounded-none border border-slate-200/45 shadow-[0_6px_24px_-4px_rgba(7,21,43,0.03)] flex items-stretch overflow-hidden min-h-[95px] sm:min-h-[115px] md:min-h-[130px] transition-all duration-300">
        
        {/* 1. Platform Branding Card */}
        <div className="flex-[1.6] md:flex-[1.8] relative flex flex-col items-center justify-center text-center p-2 overflow-hidden select-none">
          
          {/* Custom SVG Background with S-Curve wave, Gold/Bronze metallic border outline, and world map pattern overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 220 100" preserveAspectRatio="none">
              <defs>
                {/* Royal/Deep Navy Blue Gradient matching original look */}
                <linearGradient id="navyBgGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0B1C3E" />
                  <stop offset="100%" stopColor="#051025" />
                </linearGradient>
                
                {/* Shiny Gold Gradient */}
                <linearGradient id="goldHighlightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5E3A4" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#AA7C11" />
                </linearGradient>
                
                {/* Map Dotted Pattern Overlay */}
                <pattern id="brandingDots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.75" fill="#FFFFFF" opacity="0.10" />
                  <circle cx="7" cy="7" r="0.75" fill="#FFFFFF" opacity="0.05" />
                </pattern>
              </defs>
              
              {/* Curved Navy Background shape */}
              <path 
                d="M 28 0 C 40 32, 12 68, 20 100 L 220 100 L 220 0 Z" 
                fill="url(#navyBgGrad)" 
              />
              
              {/* Clipped Dots Pattern */}
              <path 
                d="M 28 0 C 40 32, 12 68, 20 100 L 220 100 L 220 0 Z" 
                fill="url(#brandingDots)" 
              />
              
              {/* Primary Gold Line */}
              <path 
                d="M 28 0 C 40 32, 12 68, 20 100" 
                stroke="url(#goldHighlightGrad)" 
                strokeWidth="2.5" 
                fill="none" 
              />
              
              {/* Secondary deep shadow line for metallic relief effect */}
              <path 
                d="M 29.5 0 C 41.5 32, 13.5 68, 21.5 100" 
                stroke="#543003" 
                strokeWidth="0.5" 
                fill="none" 
                opacity="0.35"
              />
            </svg>
          </div>

          {/* Branding Card Content - Offset to center inside the blue area */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full ml-[11%] sm:ml-[13%] md:ml-[15%]">
            
            {/* White Metallic-reflective Platform Logo */}
            <img 
              src="/logo2.png" 
              alt="Taiz Media Platform Logo" 
              className="h-[24px] sm:h-[36px] md:h-[48px] lg:h-[54px] w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)] transform hover:scale-102 transition-transform" 
            />
            
            {/* Arabic platform name */}
            <span className="text-[8px] sm:text-[11px] md:text-[13px] lg:text-[14px] text-white font-black font-cairo block mt-1 sm:mt-1.5 leading-none">
              منصة تعز الإعلامية
            </span>
            
            {/* Elegant Golden Line Separator */}
            <div className="w-[50%] sm:w-[55%] md:w-[60%] h-[1px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent my-1 sm:my-1.5" />
            
            {/* English platform name */}
            <span className="text-[5.5px] sm:text-[7.5px] md:text-[9px] lg:text-[9.5px] text-amber-400/90 font-black tracking-[0.14em] block font-sans leading-none">
              TAIZ MEDIA PLATFORM
            </span>
          </div>

        </div>

        {/* 2. Prayer Times Card (Dynamic with 3D Emerald Mosque matching reference) */}
        <Link 
          to="/prayer-times" 
          className="flex-1 flex flex-col items-center justify-center text-center p-2 min-w-0 hover:bg-slate-50/50 active:scale-98 transition-all duration-200"
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
          className="flex-1 flex flex-col items-center justify-center text-center p-2 min-w-0 hover:bg-slate-50/50 active:scale-98 transition-all duration-200"
        >
          <div className="mb-1 sm:mb-1.5 shrink-0">
            {renderWeather3DIcon(weatherData?.id)}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-[#0B1C3E] font-cairo leading-none">
              {weather.temp}°
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 truncate max-w-full">
              {weather.condition}
            </span>
          </div>
        </Link>

        {/* Separator */}
        <GoldSeparator />

        {/* 4. Date Card */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 min-w-0">
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
        </div>

      </div>
    </div>
  );
};
