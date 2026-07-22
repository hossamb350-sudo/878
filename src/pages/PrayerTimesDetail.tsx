import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, Calendar, ChevronLeft, 
  Sun, Moon, CloudSun, Check, ArrowRight
} from "lucide-react";

// ==========================================
// 1. DISTINCT CUSTOM PRAYER ICONS FOR EACH PRAYER
// ==========================================

const FajrBadgeIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs">
    {/* Fajr / Dawn Sky & Rising Sun Arc */}
    <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
      <path d="M8 18a4 4 0 0 1 8 0" fill="currentColor" fillOpacity="0.25" strokeWidth="1.8" />
      <line x1="12" y1="10" x2="12" y2="6" strokeWidth="2" />
      <line x1="7" y1="12" x2="4" y2="10" strokeWidth="2" />
      <line x1="17" y1="12" x2="20" y2="10" strokeWidth="2" />
      <path d="M16 4a3 3 0 0 1-3 3 3 3 0 0 1-1-.17 3.5 3.5 0 1 0 4-2.83" fill="currentColor" stroke="none" />
    </svg>
  </div>
);

const SunriseBadgeIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
    {/* Sunrise / Shuruk Horizon & Upward Rays */}
    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="18" x2="22" y2="18" strokeWidth="2" />
      <path d="M6 18a6 6 0 0 1 12 0" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="4" strokeWidth="2" />
      <line x1="6.34" y1="10.34" x2="3.51" y2="7.51" strokeWidth="2" />
      <line x1="17.66" y1="10.34" x2="20.49" y2="7.51" strokeWidth="2" />
      <polyline points="9 5 12 2 15 5" strokeWidth="2" />
    </svg>
  </div>
);

const DhuhrBadgeIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
    {/* Dhuhr / High Zenith Sun */}
    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
      <line x1="12" y1="2" x2="12" y2="5" strokeWidth="2" />
      <line x1="12" y1="19" x2="12" y2="22" strokeWidth="2" />
      <line x1="2" y1="12" x2="5" y2="12" strokeWidth="2" />
      <line x1="19" y1="12" x2="22" y2="12" strokeWidth="2" />
      <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" strokeWidth="2" />
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" strokeWidth="2" />
      <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" strokeWidth="2" />
      <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" strokeWidth="2" />
    </svg>
  </div>
);

const AsrBadgeIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/60 shadow-2xs">
    {/* Asr / Afternoon Sun & Extended Object Shadow */}
    <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="20" x2="22" y2="20" strokeWidth="2" />
      <circle cx="7" cy="8" r="3" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
      <line x1="7" y1="3" x2="7" y2="1" strokeWidth="2" />
      <line x1="2" y1="8" x2="1" y2="8" strokeWidth="2" />
      <line x1="3.5" y1="4.5" x2="2.1" y2="3.1" strokeWidth="2" />
      <line x1="10.5" y1="4.5" x2="11.9" y2="3.1" strokeWidth="2" />
      <line x1="15" y1="20" x2="15" y2="11" strokeWidth="2" />
      <line x1="15" y1="20" x2="21" y2="20" strokeWidth="2.5" />
    </svg>
  </div>
);

const MaghribBadgeIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60 shadow-2xs">
    {/* Maghrib / Sunset Sun Dipping Below Horizon */}
    <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="16" x2="22" y2="16" strokeWidth="2" />
      <path d="M6 16a6 6 0 0 1 12 0" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
      <line x1="12" y1="7" x2="12" y2="11" strokeWidth="2" />
      <line x1="6.34" y1="9.34" x2="8.46" y2="11.46" strokeWidth="2" />
      <line x1="17.66" y1="9.34" x2="15.54" y2="11.46" strokeWidth="2" />
      <polyline points="9 11 12 14 15 11" strokeWidth="2" />
    </svg>
  </div>
);

const IshaBadgeIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
    {/* Isha / Night Crescent Moon & Stars */}
    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
      <path d="M18 4l.5 1.5L20 6l-1.5.5L18 8l-.5-1.5L16 6l1.5-.5z" fill="currentColor" stroke="none" />
      <path d="M9 18l.3 1L10 19.3l-1 .3L8.7 21l-.3-1L7.3 19.7l1-.3z" fill="currentColor" stroke="none" />
    </svg>
  </div>
);

type PrayerItem = {
  key: string;
  name: string;
  time: string;
  badgeIcon: React.ReactNode;
  centerIcon: React.ReactNode;
  accentBarColor: string;
};

export const PrayerTimesDetail: React.FC = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [copiedVerse, setCopiedVerse] = useState(false);

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

  // Ticker for current time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Prayer Times for Taiz, Yemen
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
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
        } else {
          if (!rawTimings) {
            setRawTimings({
              Fajr: "04:27",
              Sunrise: "05:46",
              Dhuhr: "12:10",
              Asr: "15:30",
              Maghrib: "18:34",
              Isha: "20:04",
            });
          }
        }
      } catch {
        if (!rawTimings) {
          setRawTimings({
            Fajr: "04:27",
            Sunrise: "05:46",
            Dhuhr: "12:10",
            Asr: "15:30",
            Maghrib: "18:34",
            Isha: "20:04",
          });
        }
      }
    };

    fetchPrayerTimes();
  }, []);

  // Format 24h string to 12h Arabic format e.g. "12:10 م"
  const formatTime12h = (time24?: string) => {
    if (!time24) return "--:--";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "م" : "ص";
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Gregorian Date string
  const gregorianDateStr = useMemo(() => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${days[time.getDay()]} ${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
  }, [time]);

  // Prayer list:
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
        badgeIcon: <FajrBadgeIcon />,
        centerIcon: <FajrBadgeIcon />,
        accentBarColor: "bg-indigo-500",
      },
      {
        key: "Sunrise",
        name: "الشروق",
        time: t.Sunrise || "05:46",
        badgeIcon: <SunriseBadgeIcon />,
        centerIcon: <SunriseBadgeIcon />,
        accentBarColor: "bg-amber-400",
      },
      {
        key: "Dhuhr",
        name: "الظهر",
        time: t.Dhuhr || "12:10",
        badgeIcon: <DhuhrBadgeIcon />,
        centerIcon: <DhuhrBadgeIcon />,
        accentBarColor: "bg-emerald-500",
      },
      {
        key: "Asr",
        name: "العصر",
        time: t.Asr || "15:30",
        badgeIcon: <AsrBadgeIcon />,
        centerIcon: <AsrBadgeIcon />,
        accentBarColor: "bg-orange-500",
      },
      {
        key: "Maghrib",
        name: "المغرب",
        time: t.Maghrib || "18:34",
        badgeIcon: <MaghribBadgeIcon />,
        centerIcon: <MaghribBadgeIcon />,
        accentBarColor: "bg-rose-500",
      },
      {
        key: "Isha",
        name: "العشاء",
        time: t.Isha || "20:04",
        badgeIcon: <IshaBadgeIcon />,
        centerIcon: <IshaBadgeIcon />,
        accentBarColor: "bg-blue-500",
      },
    ];
  }, [rawTimings]);

  // Determine Active / Next Prayer and Countdown
  const { nextPrayer, countdownText } = useMemo(() => {
    const nowMins = time.getHours() * 60 + time.getMinutes();

    let foundNext: PrayerItem | null = null;
    let diffMins = 0;

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

    if (!foundNext && activePrayersOnly.length > 0) {
      foundNext = activePrayersOnly[0];
      const [h, m] = foundNext.time.split(":").map(Number);
      const pMins = h * 60 + m;
      diffMins = 24 * 60 - nowMins + pMins;
    }

    const hLeft = Math.floor(diffMins / 60);
    const mLeft = diffMins % 60;
    const sLeft = 59 - time.getSeconds();

    const formattedCountdown = `${hLeft.toString().padStart(2, "0")}:${mLeft.toString().padStart(2, "0")}:${sLeft.toString().padStart(2, "0")}`;

    return {
      nextPrayer: foundNext || activePrayersOnly[2],
      countdownText: formattedCountdown,
    };
  }, [time, prayerList]);

  // Copy Verse Text
  const copyVerse = () => {
    navigator.clipboard.writeText("إن الصلاة كانت على المؤمنين كتاباً موقوتاً (سورة النساء: 103)");
    setCopiedVerse(true);
    setTimeout(() => setCopiedVerse(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-12 pt-2 px-3 sm:px-5 select-none font-sans" dir="rtl">
      <div className="max-w-md md:max-w-lg mx-auto space-y-3">
        
        {/* TOP COMPACT BACK NAVIGATION BAR */}
        <div className="flex items-center justify-between py-1">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors font-cairo"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>

        {/* HERO BANNER CARD WITH MOSQUE.PNG & TRANSPARENT FLOATING CARD */}
        <div className="relative w-full h-[230px] sm:h-[250px] rounded-xl overflow-hidden shadow-md border border-slate-200/80 p-3.5 flex flex-col justify-between">
          
          {/* Background Mosque Image */}
          <img 
            src="/mosque.png" 
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith("/mosque.png") && !target.src.includes("/Resources/")) {
                target.src = "/Resources/mosque.png";
              } else if (target.src.includes("/Resources/")) {
                target.src = "/mosque.png";
              } else if (target.src.includes("/mosque.png")) {
                target.src = "/mosque_bg.jpg";
              }
            }}
            alt="جامع تعز" 
            className="absolute inset-0 w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

          {/* Top Info Overlay: Title Right, Weather Badge Left */}
          <div className="relative z-10 flex items-start justify-between">
            {/* Right: Title & City */}
            <div className="text-right space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-cairo drop-shadow-md">
                مواقيت الصلاة
              </h1>
              <div className="flex items-center gap-1 text-emerald-200 text-xs font-bold font-cairo drop-shadow-xs">
                <MapPin className="w-3 h-3 text-amber-300 fill-amber-300/30" />
                <span>تعز، اليمن</span>
              </div>
            </div>

            {/* Left: Weather Glassmorphism Badge */}
            <div className="bg-black/30 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg text-white shadow-xs flex items-center gap-1 font-bold text-xs">
              <span>24°</span>
              <CloudSun className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
            </div>
          </div>

          {/* Bottom Floating Transparent Green Next Prayer Card (Aligned Left in RTL) */}
          <div className="relative z-10 self-end w-[155px] sm:w-[165px] bg-[#0C543A]/55 backdrop-blur-md rounded-lg p-2 text-white shadow-lg border border-emerald-300/30 space-y-1">
            
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-emerald-200/90 font-cairo">
                الصلاة القادمة
              </p>
              
              <div className="flex items-center gap-1">
                <h2 className="text-base font-black text-white font-cairo">
                  {nextPrayer.name}
                </h2>
                <Sun className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
              </div>

              <p className="text-base font-black text-white font-sans tracking-tight">
                {formatTime12h(nextPrayer.time)}
              </p>

              <p className="text-[9px] font-medium text-emerald-200/90 font-cairo">
                بعد {countdownText}
              </p>
            </div>

            {/* Date Box */}
            <div className="pt-1 border-t border-emerald-400/20 flex items-center justify-between text-[8px] text-emerald-100/90 font-cairo">
              <div className="space-y-0.2">
                <p className="font-medium text-white/95">{gregorianDateStr}</p>
                <p className="font-bold text-amber-200">{hijriDate}</p>
              </div>
              <div className="p-0.5 rounded-md bg-black/30 border border-emerald-400/20 text-amber-300">
                <Calendar className="w-3 h-3 stroke-[2]" />
              </div>
            </div>

          </div>
        </div>

        {/* DAILY PRAYERS LIST WITH REDUCED FONT SIZE & SMALLER BORDER RADIUS */}
        <div className="space-y-2 pt-0.5">
          {prayerList.map((prayer, index) => {
            const isNext = nextPrayer?.key === prayer.key;

            // Calculate countdown / time diff
            const [h, m] = prayer.time.split(":").map(Number);
            const prayerMins = h * 60 + m;
            const nowMins = time.getHours() * 60 + time.getMinutes();
            let diffMins = prayerMins - nowMins;

            let countdownBadge = null;

            if (diffMins < 0) {
              // Passed
              const pastMins = Math.abs(diffMins);
              const pastHours = Math.floor(pastMins / 60);
              const remMins = pastMins % 60;
              const label = pastHours > 0 ? `مضت منذ ${pastHours}س و ${remMins}د` : `مضت منذ ${remMins}د`;
              countdownBadge = (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                  {label}
                </span>
              );
            } else if (diffMins === 0) {
              countdownBadge = (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 animate-pulse">
                  حان الآن
                </span>
              );
            } else {
              // Future
              const hoursLeft = Math.floor(diffMins / 60);
              const minsLeft = diffMins % 60;
              const secsLeft = 59 - time.getSeconds();

              if (isNext) {
                const liveLabel = hoursLeft > 0 
                  ? `متبقي ${hoursLeft}:${minsLeft.toString().padStart(2, "0")}:${secsLeft.toString().padStart(2, "0")}`
                  : `متبقي ${minsLeft}:${secsLeft.toString().padStart(2, "0")}`;

                countdownBadge = (
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 font-mono shadow-2xs tracking-tight">
                    {liveLabel}
                  </span>
                );
              } else {
                const label = hoursLeft > 0 ? `متبقي ${hoursLeft}س و ${minsLeft}د` : `متبقي ${minsLeft}د`;
                countdownBadge = (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                    {label}
                  </span>
                );
              }
            }

            return (
              <motion.div
                key={prayer.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`relative rounded-lg p-2.5 transition-all duration-200 flex items-center justify-between shadow-2xs border overflow-hidden ${
                  isNext
                    ? "bg-[#F0FDF4] border-emerald-300 ring-1 ring-emerald-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* RIGHT VERTICAL ACCENT BAR ON RIGHT EDGE */}
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${prayer.accentBarColor}`} />

                {/* RIGHT SIDE: PRAYER NAME ONLY (NO ICON BEFORE NAME) */}
                <div className="flex items-center gap-2 pr-2">
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight font-cairo ${
                    isNext ? "text-emerald-900 font-black text-base" : "text-slate-800"
                  }`}>
                    {prayer.name}
                  </h3>
                </div>

                {/* CENTER: CUSTOM SVG PRAYER ICON */}
                <div className="flex items-center justify-center shrink-0">
                  {prayer.badgeIcon}
                </div>

                {/* LEFT SIDE: REMAINING TIME BADGE + TIME + CHEVRON */}
                <div className="flex items-center gap-2">
                  {countdownBadge}

                  <span className={`text-sm sm:text-base font-bold font-sans tracking-tight dir-ltr ${
                    isNext ? "text-emerald-800 font-black" : "text-slate-900"
                  }`}>
                    {formatTime12h(prayer.time)}
                  </span>

                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM QURANIC VERSE AYAH QUOTE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={copyVerse}
          className="relative bg-[#F4F9F6] rounded-lg p-3 border border-[#D1E7D7] shadow-2xs flex items-center justify-between gap-3 cursor-pointer group hover:border-[#A3D7B2] transition-all"
        >
          {/* Right Side: Dark Green Circle with White Mosque Icon */}
          <div className="w-9 h-9 rounded-lg bg-[#0C543A] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#86EFAC]/40 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 19 8 19 12 H13 C13 8 16 4 16 4Z" fill="#DCFCE7" />
              <path d="M11 12 H21 V24 H11 Z" fill="#FFFFFF" />
              <path d="M14 24 V18 C14 17 15 16 16 16 C17 16 18 17 18 18 V24 Z" fill="#0C543A" />
              <line x1="16" y1="2" x2="16" y2="4" stroke="#DCFCE7" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Center/Right Text */}
          <div className="flex-1 text-right space-y-0.5">
            <p className="text-sm sm:text-base font-bold text-[#0C543A] leading-snug tracking-wide font-cairo">
              “ إن الصلاة كانت على المؤمنين كتاباً موقوتاً ”
            </p>
            <div className="flex items-center justify-start gap-2 text-[11px] text-emerald-700 font-bold font-cairo">
              {copiedVerse && (
                <span className="text-emerald-800 font-black flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> تم النسخ!
                </span>
              )}
              <span>النساء : 103</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PrayerTimesDetail;

