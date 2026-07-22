import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, Calendar, Volume2, VolumeX, ChevronLeft, Share2, Sparkles, Check, Play, Pause, RefreshCw } from "lucide-react";

// 3D Custom Styled Vector Icons for each Prayer Time
const FajrIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" fill="url(#fajrGradBg)" />
    <path d="M18 22V10M18 10L13 15M18 10L23 15" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="9" y1="26" x2="27" y2="26" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="fajrGradBg" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EEF2FF" />
        <stop offset="1" stopColor="#E0E7FF" />
      </linearGradient>
    </defs>
  </svg>
);

const SunriseIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" fill="url(#sunriseGradBg)" />
    <path d="M18 21V11M18 11L14 15M18 11L22 15" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="25" x2="28" y2="25" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="18" cy="18" r="4" fill="#F59E0B" />
    <defs>
      <linearGradient id="sunriseGradBg" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF3C7" />
        <stop offset="1" stopColor="#FDE68A" />
      </linearGradient>
    </defs>
  </svg>
);

const DhuhrIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" fill="url(#dhuhrGradBg)" />
    <circle cx="18" cy="18" r="7" fill="#F59E0B" />
    <g stroke="#D97706" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="5" x2="18" y2="8" />
      <line x1="18" y1="28" x2="18" y2="31" />
      <line x1="5" y1="18" x2="8" y2="18" />
      <line x1="28" y1="18" x2="31" y2="18" />
      <line x1="9" y1="9" x2="11" y2="11" />
      <line x1="25" y1="25" x2="27" y2="27" />
      <line x1="9" y1="27" x2="11" y2="25" />
      <line x1="25" y1="11" x2="27" y2="9" />
    </g>
    <defs>
      <linearGradient id="dhuhrGradBg" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFBEB" />
        <stop offset="1" stopColor="#FEF3C7" />
      </linearGradient>
    </defs>
  </svg>
);

const AsrIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" fill="url(#asrGradBg)" />
    <circle cx="18" cy="18" r="6.5" fill="#EA580C" />
    <g stroke="#F97316" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="18" y2="8.5" />
      <line x1="18" y1="27.5" x2="18" y2="30" />
      <line x1="6" y1="18" x2="8.5" y2="18" />
      <line x1="27.5" y1="18" x2="30" y2="18" />
      <line x1="9.5" y1="9.5" x2="11.5" y2="11.5" />
      <line x1="24.5" y1="24.5" x2="26.5" y2="26.5" />
      <line x1="9.5" y1="26.5" x2="11.5" y2="24.5" />
      <line x1="24.5" y1="11.5" x2="26.5" y2="9.5" />
    </g>
    <defs>
      <linearGradient id="asrGradBg" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFEDD5" />
        <stop offset="1" stopColor="#FED7AA" />
      </linearGradient>
    </defs>
  </svg>
);

const MaghribIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" fill="url(#maghribGradBg)" />
    <path d="M18 12V22M18 22L14 18M18 22L22 18" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="25" x2="28" y2="25" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 16C12 13 14.5 11 18 11C21.5 11 24 13 24 16" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="maghribGradBg" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFE4E6" />
        <stop offset="1" stopColor="#FECDD3" />
      </linearGradient>
    </defs>
  </svg>
);

const IshaIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" fill="url(#ishaGradBg)" />
    <path d="M22.5 10.5C21.2 10.1 19.8 10 18.3 10C12.6 10 8 14.6 8 20.3C8 26 12.6 30.6 18.3 30.6C21.8 30.6 24.9 28.9 26.8 26.2C21.4 25.8 17.2 21.3 17.2 15.8C17.2 13.8 17.8 12 18.8 10.4C20 10.2 21.3 10.2 22.5 10.5Z" fill="#2563EB" />
    <path d="M25 11L25.8 12.6L27.5 12.8L26.2 14L26.6 15.7L25 14.8L23.4 15.7L23.8 14L22.5 12.8L24.2 12.6L25 11Z" fill="#60A5FA" />
    <defs>
      <linearGradient id="ishaGradBg" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DBEAFE" />
        <stop offset="1" stopColor="#BFDBFE" />
      </linearGradient>
    </defs>
  </svg>
);

// Mosque Header Hero Art Illustration
const MosqueHeaderIllustration = () => (
  <div className="relative w-full h-36 sm:h-48 overflow-hidden rounded-3xl bg-gradient-to-b from-[#E2F0D9]/60 via-[#F3F9EE]/80 to-white/95 border border-emerald-100/60 shadow-sm mb-4">
    {/* Background Islamic Watermark Pattern */}
    <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
    
    {/* Soft Sun Glow in Center */}
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />

    {/* Mosque Dome Vector Graphics */}
    <svg className="absolute bottom-0 inset-x-0 w-full h-28 sm:h-36 drop-shadow-md" viewBox="0 0 500 160" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="mainDome" x1="250" y1="20" x2="250" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803D" />
          <stop offset="0.7" stopColor="#166534" />
          <stop offset="1" stopColor="#0B3C1F" />
        </linearGradient>
        <linearGradient id="sideDome" x1="0" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DCFCE7" />
          <stop offset="1" stopColor="#86EFAC" />
        </linearGradient>
        <linearGradient id="skyCloud" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#F1F5F9" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Cloud silhouettes */}
      <path d="M 30 70 Q 50 40 80 60 T 130 65 T 180 50 Q 210 20 250 40 T 320 30 Q 360 10 400 45 T 470 60 L 500 160 L 0 160 Z" fill="url(#skyCloud)" />

      {/* Left Minaret */}
      <rect x="75" y="45" width="14" height="115" rx="2" fill="#15803D" />
      <path d="M 72 45 L 82 20 L 92 45 Z" fill="#166534" />
      <circle cx="82" cy="18" r="3" fill="#EAB308" />

      {/* Right Minaret */}
      <rect x="410" y="45" width="14" height="115" rx="2" fill="#15803D" />
      <path d="M 407 45 L 417 20 L 427 45 Z" fill="#166534" />
      <circle cx="417" cy="18" r="3" fill="#EAB308" />

      {/* Main Mosque Center Building */}
      <rect x="180" y="90" width="140" height="70" fill="#166534" />

      {/* Main Central Dome */}
      <path d="M 200 90 C 200 40 220 20 250 20 C 280 20 300 40 300 90 Z" fill="url(#mainDome)" />
      
      {/* Dome Crescent Top */}
      <line x1="250" y1="20" x2="250" y2="6" stroke="#FEF08A" strokeWidth="2.5" />
      <path d="M 250 4 C 252.5 4 254.5 5.5 254.5 8 C 254.5 10.5 252.5 12 250 12 C 252 12 253.5 10.5 253.5 8 C 253.5 5.5 252 4 250 4 Z" fill="#FEF08A" />

      {/* Arched Mosque Windows */}
      <path d="M 235 125 C 235 110 242 102 250 102 C 258 102 265 110 265 125 V 160 H 235 Z" fill="#FEF08A" opacity="0.9" />
      <path d="M 195 130 C 195 120 200 114 206 114 C 212 114 217 120 217 130 V 160 H 195 Z" fill="#DCFCE7" opacity="0.8" />
      <path d="M 283 130 C 283 120 288 114 294 114 C 300 114 305 120 305 130 V 160 H 283 Z" fill="#DCFCE7" opacity="0.8" />

      {/* Side Palms silhouettes */}
      <path d="M 30 160 Q 40 120 25 90 M 25 90 Q 10 80 0 85 M 25 90 Q 20 70 35 75 M 25 90 Q 45 70 40 85 M 25 90 Q 50 95 35 105" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M 470 160 Q 460 120 475 90 M 475 90 Q 490 80 500 85 M 475 90 Q 480 70 465 75 M 475 90 Q 455 70 460 85 M 475 90 Q 450 95 465 105" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>

    {/* Flying Birds silhouette */}
    <div className="absolute top-4 left-10 opacity-40">
      <svg className="w-10 h-6" viewBox="0 0 50 30" fill="none" stroke="#065F46" strokeWidth="2">
        <path d="M 5 15 Q 15 5 25 15 Q 35 5 45 15" />
      </svg>
    </div>
  </div>
);

type PrayerItem = {
  key: string;
  name: string;
  time: string; // "04:27"
  icon: React.ReactNode;
  theme: {
    accentColor: string;
    borderAccent: string;
    badgeBg: string;
    textColor: string;
  };
};

export const PrayerTimesDetail: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [mutedPrayers, setMutedPrayers] = useState<Record<string, boolean>>({});
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);

  const [rawTimings, setRawTimings] = useState<Record<string, string> | null>(() => {
    try {
      const cached = localStorage.getItem("cached_detail_raw_timings");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [hijriDate, setHijriDate] = useState<string>(() => {
    try {
      return localStorage.getItem("cached_detail_hijri_date") || "8 صفر 1448 هـ";
    } catch {
      return "8 صفر 1448 هـ";
    }
  });

  const [loading, setLoading] = useState(!rawTimings);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Prayer Times for Taiz, Yemen
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        if (!rawTimings) setLoading(true);
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Taiz&country=Yemen&method=4`);
        if (response.ok) {
          const data = await response.json();
          const timings = data.data.timings;
          setRawTimings(timings);
          localStorage.setItem("cached_detail_raw_timings", JSON.stringify(timings));

          const hijri = data.data.date.hijri;
          const newHijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
          setHijriDate(newHijriDate);
          localStorage.setItem("cached_detail_hijri_date", newHijriDate);
        }
      } catch (err) {
        console.error("Failed to fetch prayer times:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, []);

  // Format 24h string e.g. "04:27" to 12h Arabic string e.g. "4:27 ص"
  const formatTime12h = (time24?: string) => {
    if (!time24) return "--:--";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "م" : "ص";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Gregorian Date string
  const gregorianDateStr = useMemo(() => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${days[time.getDay()]} ${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()} م`;
  }, [time]);

  // Defined Prayer List matching exact UI in screenshot
  const prayerList: PrayerItem[] = useMemo(() => {
    const defaultTimings = {
      Fajr: "04:27",
      Sunrise: "05:46",
      Dhuhr: "12:10",
      Asr: "15:30",
      Maghrib: "18:34",
      Isha: "20:04",
    };

    const t = rawTimings || defaultTimings;

    return [
      {
        key: "Fajr",
        name: "الفجر",
        time: t.Fajr || "04:27",
        icon: <FajrIcon />,
        theme: {
          accentColor: "from-indigo-500 to-purple-600",
          borderAccent: "border-r-4 border-r-indigo-500",
          badgeBg: "bg-indigo-50 text-indigo-700",
          textColor: "text-indigo-900",
        },
      },
      {
        key: "Dhuhr",
        name: "الظهر",
        time: t.Dhuhr || "12:10",
        icon: <DhuhrIcon />,
        theme: {
          accentColor: "from-amber-400 to-amber-600",
          borderAccent: "border-r-4 border-r-amber-500",
          badgeBg: "bg-amber-50 text-amber-700",
          textColor: "text-amber-900",
        },
      },
      {
        key: "Asr",
        name: "العصر",
        time: t.Asr || "15:30",
        icon: <AsrIcon />,
        theme: {
          accentColor: "from-orange-400 to-orange-600",
          borderAccent: "border-r-4 border-r-orange-500",
          badgeBg: "bg-orange-50 text-orange-700",
          textColor: "text-orange-900",
        },
      },
      {
        key: "Maghrib",
        name: "المغرب",
        time: t.Maghrib || "18:34",
        icon: <MaghribIcon />,
        theme: {
          accentColor: "from-rose-400 to-rose-600",
          borderAccent: "border-r-4 border-r-rose-500",
          badgeBg: "bg-rose-50 text-rose-700",
          textColor: "text-rose-900",
        },
      },
      {
        key: "Isha",
        name: "العشاء",
        time: t.Isha || "20:04",
        icon: <IshaIcon />,
        theme: {
          accentColor: "from-blue-500 to-indigo-600",
          borderAccent: "border-r-4 border-r-blue-500",
          badgeBg: "bg-blue-50 text-blue-700",
          textColor: "text-blue-900",
        },
      },
      {
        key: "Sunrise",
        name: "الشروق",
        time: t.Sunrise || "05:46",
        icon: <SunriseIcon />,
        theme: {
          accentColor: "from-amber-300 to-yellow-500",
          borderAccent: "border-r-4 border-r-yellow-500",
          badgeBg: "bg-yellow-50 text-yellow-800",
          textColor: "text-yellow-950",
        },
      },
    ];
  }, [rawTimings]);

  // Determine Active / Next Prayer and Remaining Time
  const { nextPrayer, countdownText } = useMemo(() => {
    const nowMins = time.getHours() * 60 + time.getMinutes();

    let foundNext: PrayerItem | null = null;
    let diffMins = 0;

    // Filter main prayers (excluding Sunrise for active countdown)
    const activePrayersOnly = prayerList.filter((p) => p.key !== "Sunrise");

    for (const p of activePrayersOnly) {
      const [h, m] = p.time.split(":").map(Number);
      const pMins = h * 60 + m;
      if (pMins > nowMins) {
        foundNext = p;
        diffMins = pMins - nowMins;
        break;
      }
    }

    // If past Isha, next is Fajr tomorrow
    if (!foundNext && activePrayersOnly.length > 0) {
      foundNext = activePrayersOnly[0]; // Fajr
      const [h, m] = foundNext.time.split(":").map(Number);
      const pMins = h * 60 + m;
      diffMins = 24 * 60 - nowMins + pMins;
    }

    const hLeft = Math.floor(diffMins / 60);
    const mLeft = diffMins % 60;
    const sLeft = 59 - time.getSeconds();

    const formattedCountdown = `${hLeft > 0 ? `${hLeft} ساعة و ` : ""}${mLeft} دقيقة و ${sLeft} ثانية`;

    return {
      nextPrayer: foundNext || activePrayersOnly[0],
      countdownText: formattedCountdown,
    };
  }, [time, prayerList]);

  // Toggle Mute Audio Notification
  const toggleMute = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedPrayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy Verse Text
  const copyVerse = () => {
    navigator.clipboard.writeText("إن الصلاة كانت على المؤمنين كتاباً موقوتاً (سورة النساء: 103)");
    setCopiedVerse(true);
    setTimeout(() => setCopiedVerse(false), 2500);
  };

  // Toggle Adhan Audio Simulation
  const toggleAdhan = () => {
    setIsPlayingAdhan((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#FAF8F5]" dir="rtl">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-3xl shadow-lg border border-emerald-100">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-emerald-900 font-bold font-cairo text-lg">جاري تحميل مواقيت الصلاة بتعز...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 pt-2 px-3 sm:px-6 select-none font-sans" dir="rtl">
      {/* Centered Mobile & Tablet Frame for Pixel-Perfect Layout */}
      <div className="max-w-md md:max-w-xl mx-auto space-y-4">
        
        {/* TOP TITLE HEADER WITH LOCATION */}
        <div className="text-center pt-2 pb-1 space-y-1">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none"
          >
            مواقيت الصلاة
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1.5 text-slate-600 pt-1"
          >
            <MapPin className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span className="text-sm font-bold tracking-wide">تعز، اليمن</span>
          </motion.div>
        </div>

        {/* HERO MOSQUE ILLUSTRATION BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <MosqueHeaderIllustration />
        </motion.div>

        {/* GREEN ISLAMIC DATE BANNER (MATCHING THE SCREENSHOT EXACTLY) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-[#0C4A34] via-[#0F5A3F] to-[#0A3C2A] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 text-white shadow-lg border border-emerald-600/30 overflow-hidden"
        >
          {/* Subtle Decorative Star Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:12px_12px]" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Left Button: Calendar Icon Badge */}
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-200 shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Center: Hijri & Gregorian Dates */}
            <div className="text-center space-y-0.5 my-auto">
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-bold tracking-wider">
                التاريخ الهجري
              </p>
              <h2 className="text-lg sm:text-2xl font-black text-amber-300 tracking-tight leading-tight">
                {hijriDate}
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium">
                {gregorianDateStr}
              </p>
            </div>

            {/* Right Button: Clock Icon Badge / Interactive Adhan Trigger */}
            <button
              onClick={toggleAdhan}
              className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
                isPlayingAdhan ? "text-amber-300 ring-2 ring-amber-400" : "text-emerald-200"
              }`}
              title="تشغيل الأذان"
            >
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Countdown Bar to Next Prayer */}
          {nextPrayer && (
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100">
              <div className="flex items-center gap-1.5 font-bold text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>المتبقي على أذان {nextPrayer.name}:</span>
              </div>
              <span className="font-bold font-mono tracking-wider text-amber-300 bg-black/20 px-2 py-0.5 rounded-lg border border-white/10">
                {countdownText}
              </span>
            </div>
          )}
        </motion.div>

        {/* PRAYER CARDS LIST (6 ITEMS REPLICATING SCREENSHOT BEAUTIFULLY) */}
        <div className="space-y-2.5 sm:space-y-3">
          {prayerList.map((prayer, index) => {
            const isNext = nextPrayer?.key === prayer.key;
            const isMuted = mutedPrayers[prayer.key];

            return (
              <motion.div
                key={prayer.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-all duration-200 flex items-center justify-between overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border ${
                  isNext
                    ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.12)] bg-gradient-to-r from-emerald-50/50 via-white to-white"
                    : "border-slate-100 hover:border-slate-200"
                } ${prayer.theme.borderAccent}`}
              >
                {/* Active Next Prayer Highlight Badge */}
                {isNext && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9.5px] font-bold px-2.5 py-0.5 rounded-bl-xl shadow-sm">
                    الصلاة القادمة
                  </div>
                )}

                {/* LEFT SIDE: CHEVRON + TIME */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={(e) => toggleMute(prayer.key, e)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title={isMuted ? "كتم التنبيه" : "تفعيل التنبيه"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-500" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    )}
                  </button>

                  {/* Prayer Time formatted 12H */}
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                    {formatTime12h(prayer.time)}
                  </span>
                </div>

                {/* RIGHT SIDE: ICON BADGE + PRAYER NAME */}
                <div className="flex items-center gap-3">
                  {/* Styled Icon Badge in Pastel Circle */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                    {prayer.icon}
                  </div>

                  {/* Prayer Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                    {prayer.name}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM QURANIC VERSE / AYAH QUOTE CARD (REPLICATING SCREENSHOT EXACTLY) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={copyVerse}
          className="relative bg-gradient-to-r from-[#F0F7F2] via-[#F6FAF7] to-[#EDF5EF] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#D1E8D7] shadow-sm flex items-center justify-between gap-3 cursor-pointer group hover:border-[#A8DABC] transition-all"
        >
          {/* Subtle Watermark Frame */}
          <div className="absolute top-2 left-2 text-emerald-900/10 text-3xl font-serif pointer-events-none">
            “
          </div>

          {/* Left Side: Quote Text */}
          <div className="flex-1 space-y-1">
            <p className="text-xs sm:text-base font-bold text-[#0B5C35] leading-relaxed tracking-wide">
              “إن الصلاة كانت على المؤمنين كتاباً موقوتاً”
            </p>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-emerald-700/80 font-medium">
              <span>النساء : 103</span>
              {copiedVerse && (
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> تم النسخ!
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Circular Mosque Illustration Icon */}
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#107040] text-white flex items-center justify-center shrink-0 shadow-md border-2 border-[#86EFAC] group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 19 8 19 12 H13 C13 8 16 4 16 4Z" fill="#DCFCE7" />
              <path d="M11 12 H21 V24 H11 Z" fill="#FFFFFF" />
              <path d="M14 24 V18 C14 17 15 16 16 16 C17 16 18 17 18 18 V24 Z" fill="#107040" />
              <line x1="16" y1="2" x2="16" y2="4" stroke="#DCFCE7" strokeWidth="1.5" />
            </svg>
          </div>
        </motion.div>

        {/* SIMULATED ADHAN AUDIO PLAYER BANNER */}
        <AnimatePresence>
          {isPlayingAdhan && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-900 text-white rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xl border border-emerald-700 overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAdhan}
                  className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shrink-0"
                >
                  <Pause className="w-5 h-5 fill-current" />
                </button>
                <div>
                  <p className="text-xs font-bold text-amber-300">أذان تعز - بصوت ندي</p>
                  <p className="text-[10px] text-emerald-200">الله أكبر، الله أكبر...</p>
                </div>
              </div>

              {/* Sound equalizer animation */}
              <div className="flex items-center gap-1 h-6">
                <span className="w-1 bg-amber-400 rounded-full h-full animate-bounce" />
                <span className="w-1 bg-amber-400 rounded-full h-3 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 bg-amber-400 rounded-full h-5 animate-bounce [animation-delay:0.3s]" />
                <span className="w-1 bg-amber-400 rounded-full h-2 animate-bounce [animation-delay:0.45s]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default PrayerTimesDetail;
