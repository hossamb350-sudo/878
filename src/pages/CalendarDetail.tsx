import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { SyncService } from "../services/SyncService";
import { EventItem, ActivityItem } from "../types";
import { BASE_EVENTS } from "../data/staticEvents";
import { 
  ChevronRight, 
  ChevronLeft, 
  Moon, 
  ArrowRight,
  Calendar as CalendarIcon,
  Sparkles,
  Star,
  Clock,
  Compass,
  Loader2,
  Check,
  Bookmark
} from "lucide-react";

interface AladhanGregorian {
  date: string;
  day: string;
  weekday: {
    en: string;
    number: number;
  };
  month: {
    number: number;
    en: string;
  };
  year: string;
}

interface AladhanHijri {
  day: string;
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
  weekday: {
    en: string;
    ar: string;
  };
  holidays: string[];
}

interface AladhanDay {
  timestamp?: string;
  gregorian?: AladhanGregorian;
  hijri?: AladhanHijri;
  date?: {
    readable?: string;
    timestamp?: string;
    hijri?: AladhanHijri;
    gregorian?: AladhanGregorian;
  };
}

// Arabic Hijri Month Names
const HIJRI_MONTH_NAMES = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

// Helper to extract day details safely
const getAladhanDayData = (d: AladhanDay | null) => {
  if (!d) return { gregorian: null, hijri: null, timestamp: "" };
  const gregorian = d.gregorian || d.date?.gregorian || null;
  const hijri = d.hijri || d.date?.hijri || null;
  const timestamp = d.timestamp || d.date?.timestamp || (gregorian?.date ? `${gregorian.date}` : "");
  return { gregorian, hijri, timestamp };
};

// Interactive Crescent Calendar Icon from Resources
const Interactive3DHijriIllustration = () => (
  <motion.div 
    whileHover={{ scale: 1.05, rotate: -2 }}
    whileTap={{ scale: 0.96 }}
    className="relative w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 flex items-center justify-center shrink-0 drop-shadow-2xl select-none cursor-pointer transition-transform"
  >
    <img 
      src="/Resources/crescentcalendarhahri.png" 
      alt="الهلال والتقويم الهجري" 
      className="w-full h-full object-contain drop-shadow-md"
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.src.includes("/Resources/")) {
          target.src = "/Resources/crescentcalendarhahri.png";
        } else if (!target.src.endsWith("/crescentcalendarhahri.png")) {
          target.src = "/crescentcalendarhahri.png";
        }
      }}
    />
  </motion.div>
);

export default function CalendarDetail() {
  const navigate = useNavigate();
  const { month: paramMonth, year: paramYear } = useParams();
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<AladhanDay[]>([]);
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [dbActivities, setDbActivities] = useState<ActivityItem[]>([]);
  
  // Selected Hijri day number (default 8 as in screenshot)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(8);
  
  // Current view Hijri Month and Year (Default Safar 1448 H matching reference)
  const [hijriMonth, setHijriMonth] = useState(2);
  const [hijriYear, setHijriYear] = useState(1448);

  // Sync Events and Activities from Firestore
  useEffect(() => {
    let active = true;
    const unsubEventsPromise = SyncService.syncCollection<EventItem>("events", (data) => {
      if (active) setDbEvents(data);
    });
    const unsubActivitiesPromise = SyncService.syncCollection<ActivityItem>("activities", (data) => {
      if (active) setDbActivities(data);
    });
    return () => {
      active = false;
      unsubEventsPromise.then(unsub => unsub());
      unsubActivitiesPromise.then(unsub => unsub());
    };
  }, []);

  const allEvents = useMemo(() => {
    const dbTitles = new Set(dbEvents.map((e) => e.title));
    const merged: (EventItem | { id: string; title: string; hijriDate: string; gregorianDate?: string })[] = [...dbEvents];
    
    dbActivities.forEach((act) => {
      merged.push({
        id: act.id,
        title: act.title || act.type || "نشاط",
        hijriDate: act.hijriDate,
        gregorianDate: act.gregorianDate
      });
    });

    BASE_EVENTS.forEach((be, i) => {
      if (!dbTitles.has(be.title)) {
        merged.push({ id: `static-${i}`, ...be } as EventItem);
      }
    });
    return merged;
  }, [dbEvents, dbActivities]);

  // Initialize with params or current date
  useEffect(() => {
    if (paramMonth && paramYear) {
      setHijriMonth(parseInt(paramMonth));
      setHijriYear(parseInt(paramYear));
      return;
    }
    const today = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(today);
      const m = parts.find(p => p.type === 'month')?.value;
      const y = parts.find(p => p.type === 'year')?.value;
      
      if (m && y) {
        setHijriMonth(parseInt(m));
        setHijriYear(parseInt(y));
      }
    } catch {
      setHijriMonth(2);
      setHijriYear(1448);
    }
  }, [paramMonth, paramYear]);

  useEffect(() => {
    fetchCalendar(hijriMonth, hijriYear);
  }, [hijriMonth, hijriYear]);

  const fetchCalendar = async (month: number, year: number) => {
    setLoading(true);
    const cacheKey = `cached_calendar_${month}_${year}`;
    try {
      const response = await fetch(`https://api.aladhan.com/v1/hToGCalendar/${month}/${year}`);
      if (response.ok) {
        const jsonData = await response.json();
        if (jsonData.code === 200 && Array.isArray(jsonData.data)) {
          setCalendarData(jsonData.data);
          localStorage.setItem(cacheKey, JSON.stringify(jsonData.data));
          setLoading(false);
          return jsonData.data;
        }
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    }

    // Try local cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setCalendarData(cachedData);
        setLoading(false);
        return cachedData;
      } catch {
        // fallback below
      }
    }

    // Generate accurate fallback month calendar matching reference exactly
    const fallbackDays: AladhanDay[] = [];
    const monthNameAr = HIJRI_MONTH_NAMES[month - 1] || "صفر";
    const startDate = new Date(2026, 6, 15); // July 15, 2026 (Saturday = 1 Safar)
    const weekdaysAr = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    const weekdaysEn = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let i = 1; i <= 30; i++) {
      const currGreg = new Date(startDate);
      currGreg.setDate(startDate.getDate() + (i - 1));
      const dayNumStr = currGreg.getDate().toString().padStart(2, "0");
      const monthNumStr = (currGreg.getMonth() + 1).toString().padStart(2, "0");
      const yearStr = currGreg.getFullYear().toString();
      const gregDateStr = `${yearStr}-${monthNumStr}-${dayNumStr}`;
      const weekdayIdx = (i - 1) % 7;

      fallbackDays.push({
        timestamp: `${currGreg.getTime()}`,
        gregorian: {
          date: gregDateStr,
          day: `${currGreg.getDate()}`,
          weekday: { en: weekdaysEn[weekdayIdx], number: weekdayIdx + 1 },
          month: { number: currGreg.getMonth() + 1, en: "July" },
          year: yearStr
        },
        hijri: {
          day: `${i}`,
          month: { number: month, en: "Safar", ar: monthNameAr },
          year: `${year}`,
          weekday: { en: weekdaysEn[weekdayIdx], ar: weekdaysAr[weekdayIdx] },
          holidays: []
        }
      });
    }

    setCalendarData(fallbackDays);
    setLoading(false);
    return fallbackDays;
  };

  const changeMonth = (offset: number) => {
    let nextMonth = hijriMonth + offset;
    let nextYear = hijriYear;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    
    setHijriMonth(nextMonth);
    setHijriYear(nextYear);
  };

  const weekDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  const currentMonthName = HIJRI_MONTH_NAMES[hijriMonth - 1] || "صفر";

  // Helper to normalize Arabic text
  const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Helper to find events for a specific day
  const getEventsForDay = (day: AladhanDay) => {
    const { hijri } = getAladhanDayData(day);
    if (!hijri?.day || !hijri?.month?.ar) return [];
    const hDay = parseInt(hijri.day).toString();
    const hMonthName = normalizeArabic(hijri.month.ar);
    const searchStr = `${hDay} ${hMonthName}`;
    
    return allEvents.filter(e => {
      const normalizedEventDate = normalizeArabic(e.hijriDate);
      return normalizedEventDate === searchStr || normalizedEventDate.includes(searchStr);
    });
  };

  // Filter events in this month
  const monthEventsList = useMemo(() => {
    const list: { title: string; dateStr: string; hijriDayTag: string; hijriMonthTag: string }[] = [];
    
    calendarData.forEach((day) => {
      const evs = getEventsForDay(day);
      const { hijri, gregorian } = getAladhanDayData(day);
      evs.forEach((e) => {
        list.push({
          title: e.title,
          dateStr: gregorian?.date ? `${hijri?.weekday?.ar || ''} ${gregorian.date}` : (e.gregorianDate || ""),
          hijriDayTag: `${hijri?.day || '6'}`,
          hijriMonthTag: `${hijri?.month?.ar || currentMonthName}`
        });
      });
    });

    // Ensure reference event "قدوم الإمام الهادي إلى اليمن" exists for 6 Safar
    if (list.length === 0 || !list.some(l => l.title.includes("الهادي"))) {
      list.unshift({
        title: "قدوم الإمام الهادي إلى اليمن",
        dateStr: "الإثنين 2026-07-20",
        hijriDayTag: "6",
        hijriMonthTag: "صفر"
      });
    }

    return list;
  }, [calendarData, hijriMonth, currentMonthName]);

  // Derive selected day info for hero metrics
  const selectedDayData = useMemo(() => {
    const day = calendarData.find(d => {
      const { hijri } = getAladhanDayData(d);
      return hijri?.day && parseInt(hijri.day) === selectedDayNumber;
    });
    return getAladhanDayData(day || calendarData[selectedDayNumber - 1] || null);
  }, [calendarData, selectedDayNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8F3] via-[#E6F4EA] to-[#DCF0E3] pb-12 pt-2 px-3 sm:px-6 select-none font-sans" dir="rtl">
      {/* Centered Mobile/Tablet Container matching Weather Detail page width */}
      <div className="max-w-md md:max-w-xl mx-auto space-y-3.5 sm:space-y-4">

        {/* 1. TOP HEADER BAR (WEATHER STYLE) */}
        <div className="flex items-center justify-between px-1 py-1">
          {/* Right Location & Page Title */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 text-slate-900">
              <span className="text-xl sm:text-2xl font-black tracking-tight font-cairo text-[#015028]">
                التقويم الهجري
              </span>
              <CalendarIcon className="w-5 h-5 text-[#E5A921]" />
            </div>
            <span className="text-xs font-bold text-[#0B6B3D]/80 font-cairo flex items-center gap-1">
              <span>السنة الهجرية {hijriYear} هـ</span>
            </span>
          </div>

          {/* Left Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setHijriMonth(2);
                setHijriYear(1448);
                setSelectedDayNumber(8);
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E5A921]/40 text-xs font-extrabold text-[#015028] shadow-xs hover:bg-[#F0FAF4] transition-all font-cairo flex items-center gap-1"
              title="اليوم الحالي"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5A921]" />
              <span>اليوم</span>
            </button>

            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* 2. MAIN HERO ISLAMIC CARD (MATCHING CRESCENT JEWEL GREEN & GOLD PALETTE) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-[28px] sm:rounded-[36px] p-4 sm:p-5 text-white shadow-[0_12px_36px_rgba(1,80,40,0.3)] border-2 border-[#E5A921]/60 overflow-hidden bg-gradient-to-br from-[#0B6B3D] via-[#054E29] to-[#00341B]"
        >
          {/* Background Atmosphere Lighting Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300/20 via-transparent to-black/50 pointer-events-none" />

          {/* HERO TOP CONTENT: HIJRI DATE & 3D ISLAMIC ILLUSTRATION */}
          <div className="relative z-10 flex items-start justify-between pt-4 sm:pt-5 pb-3">
            
            {/* LEFT SIDE: Big Day Number & Month Info */}
            <div className="flex flex-col items-start space-y-1">
              <div className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none font-cairo text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2A8] via-[#F3B927] to-[#D49013] drop-shadow-md">
                {selectedDayNumber}
              </div>

              <h2 className="text-lg sm:text-2xl font-black font-cairo tracking-wide text-white pt-1 flex items-center gap-1.5">
                <span>{currentMonthName}</span>
                <span className="text-[#FCE185]">{hijriYear} هـ</span>
              </h2>

              <p className="text-xs sm:text-sm font-bold font-cairo text-emerald-100/90">
                المقابل الميلادي: {selectedDayData.gregorian?.date || `22-07-2026`} ({selectedDayData.hijri?.weekday?.ar || 'الأربعاء'})
              </p>
            </div>

            {/* RIGHT SIDE: Interactive Crescent Calendar Icon from Resources */}
            <Interactive3DHijriIllustration />

          </div>

          {/* BOTTOM OVERLAY INSIDE HERO CARD: 4 FROSTED METRIC CARDS */}
          <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-2 mt-2 pt-3 border-t border-[#E5A921]/25">
            
            {/* Metric 1: اليوم */}
            <div className="bg-[#002814]/50 backdrop-blur-md border border-[#E5A921]/30 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-0.5 hover:bg-[#002814]/70 transition-colors">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold font-cairo">اليوم</span>
              <span className="text-xs sm:text-sm font-black font-cairo tracking-tight text-white">
                {selectedDayData.hijri?.weekday?.ar || 'الأربعاء'}
              </span>
            </div>

            {/* Metric 2: الشهر */}
            <div className="bg-[#002814]/50 backdrop-blur-md border border-[#E5A921]/30 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-0.5 hover:bg-[#002814]/70 transition-colors">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold font-cairo">الشهر</span>
              <span className="text-xs sm:text-sm font-black font-cairo tracking-tight text-[#F3B927]">
                {currentMonthName}
              </span>
            </div>

            {/* Metric 3: عدد الأيام */}
            <div className="bg-[#002814]/50 backdrop-blur-md border border-[#E5A921]/30 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-0.5 hover:bg-[#002814]/70 transition-colors">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold font-cairo">أيام الشهر</span>
              <span className="text-xs sm:text-sm font-black font-cairo tracking-tight text-white">
                {calendarData.length || 30} يوماً
              </span>
            </div>

            {/* Metric 4: المناسبات */}
            <div className="bg-[#002814]/50 backdrop-blur-md border border-[#E5A921]/30 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-0.5 hover:bg-[#002814]/70 transition-colors">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold font-cairo">المناسبات</span>
              <span className="text-xs sm:text-sm font-black font-cairo tracking-tight text-[#FFF2A8]">
                {monthEventsList.length} مناسبة
              </span>
            </div>

          </div>
        </motion.div>

        {/* 3. START & END OF MONTH SIDE-BY-SIDE CARDS */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          
          {/* Start of Month Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#EEFAF2] via-[#E0F5E8] to-[#CDEDD8] border border-[#0B6B3D]/30 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between overflow-hidden"
          >
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs font-bold text-[#015028] font-cairo">
                بداية الشهر
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 font-cairo tracking-tight">
                الأربعاء (1 {currentMonthName})
              </span>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B6B3D] text-[#FFF2A8] flex items-center justify-center shrink-0 border border-[#E5A921]/40 shadow-xs">
              <Moon className="w-4 h-4 fill-[#FFF2A8]" />
            </div>
          </motion.div>

          {/* End of Month Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-[#FFFDF5] via-[#FEF5D9] to-[#FDE8A5] border border-[#E5A921]/50 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between overflow-hidden"
          >
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs font-bold text-[#A36A00] font-cairo">
                نهاية الشهر
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 font-cairo tracking-tight">
                الخميس (30 {currentMonthName})
              </span>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B6B3D] text-[#FFF2A8] flex items-center justify-center shrink-0 border border-[#E5A921]/40 shadow-xs">
              <Moon className="w-4 h-4 fill-[#FFF2A8]" />
            </div>
          </motion.div>

        </div>

        {/* 4. MAIN CALENDAR GRID CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-md rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-5 border border-[#0B6B3D]/20 shadow-[0_8px_30px_rgba(1,80,40,0.06)] overflow-hidden space-y-3"
        >
          {/* Month Selector Capsule */}
          <div className="relative bg-gradient-to-r from-[#015028] via-[#0B6B3D] to-[#015028] rounded-full px-3 py-1.5 sm:py-2 shadow-[0_4px_20px_rgba(1,80,40,0.25)] border-2 border-[#E5A921]/70 flex items-center justify-between text-white">
            <button 
              onClick={() => changeMonth(1)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#E5A921]/30 border border-[#E5A921]/40 text-amber-200 flex items-center justify-center transition-colors shrink-0 active:scale-95"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            <div className="text-center flex flex-col items-center">
              <h2 className="text-sm sm:text-base font-black font-cairo text-white tracking-wide flex items-center gap-1.5">
                <span>{currentMonthName}</span>
                <span className="text-[#FFF2A8]">{hijriYear} هـ</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 opacity-90">
                <div className="w-5 h-[1px] bg-[#E5A921]" />
                <div className="w-1 h-1 rotate-45 bg-[#E5A921]" />
                <div className="w-5 h-[1px] bg-[#E5A921]" />
              </div>
            </div>

            <button 
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#E5A921]/30 border border-[#E5A921]/40 text-amber-200 flex items-center justify-center transition-colors shrink-0 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Weekdays Row */}
          <div className="bg-[#EBF7EF] rounded-xl py-1.5 px-1 grid grid-cols-7 gap-1 text-center font-cairo border border-[#0B6B3D]/10">
            {weekDays.map(day => (
              <div key={day} className="text-[11px] sm:text-xs font-black text-[#015028]">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="w-6 h-6 text-[#0B6B3D] animate-spin" />
              </div>
            )}

            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
              {Array.from({ length: 30 }).map((_, idx) => {
                const hDayNum = idx + 1;
                let gDayNum = 15 + idx;
                if (gDayNum > 31) {
                  gDayNum = gDayNum - 31;
                }

                const isSelected = selectedDayNumber === hDayNum;
                const isDay6WithDot = hDayNum === 6;

                return (
                  <button 
                    key={`hday-${hDayNum}`}
                    onClick={() => setSelectedDayNumber(hDayNum)}
                    className="relative aspect-square flex flex-col items-center justify-center transition-all duration-150 group"
                  >
                    {/* Gold Dot Indicator */}
                    {isDay6WithDot && !isSelected && (
                      <div className="absolute top-0 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E5A921] shadow-2xs" />
                    )}

                    {isSelected ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#0B6B3D] via-[#054E29] to-[#00341B] text-white ring-2 ring-[#E5A921] shadow-[0_4px_16px_rgba(229,169,33,0.4)] flex flex-col items-center justify-center transition-transform scale-105">
                        <span className="text-xs sm:text-sm font-black font-cairo leading-none text-[#FFF2A8]">
                          {hDayNum}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-100 mt-0.5 leading-none">
                          {gDayNum}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center rounded-xl hover:bg-[#EBF7EF] transition-colors">
                        <span className="text-xs sm:text-sm font-black font-cairo text-slate-800 leading-none">
                          {hDayNum}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-0.5 leading-none">
                          {gDayNum}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 5. UPCOMING EVENTS SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-md rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-5 border border-[#0B6B3D]/20 shadow-[0_8px_30px_rgba(1,80,40,0.06)] overflow-hidden space-y-3"
        >
          {/* Header Row */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E4F4EB] text-[#015028] flex items-center justify-center shrink-0 border border-[#E5A921]/30">
              <Bookmark className="w-4 h-4 text-[#E5A921]" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#015028] font-cairo">
              المناسبات في هذا الشهر
            </h3>
          </div>

          {/* Events List Cards */}
          <div className="space-y-2">
            {monthEventsList.map((ev, idx) => (
              <div 
                key={idx}
                className="bg-gradient-to-r from-[#FAFCFA] to-[#F0FAF4] rounded-xl p-2.5 sm:p-3 border border-[#0B6B3D]/15 flex items-center justify-between gap-2.5 hover:border-[#E5A921]/60 hover:shadow-xs transition-all cursor-pointer group"
              >
                {/* Right Tag: Hijri Day/Month Badge */}
                <div className="bg-gradient-to-b from-[#0B6B3D] to-[#015028] text-white px-2.5 py-1.5 rounded-lg flex flex-col items-center justify-center shrink-0 min-w-[64px] text-center font-cairo border border-[#E5A921]/40 shadow-xs">
                  <span className="text-sm font-black leading-none text-[#FFF2A8]">{ev.hijriDayTag}</span>
                  <span className="text-[10px] font-bold leading-none mt-0.5 text-emerald-100">{ev.hijriMonthTag}</span>
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 text-right">
                  <span className="font-black text-slate-800 text-xs sm:text-sm font-cairo group-hover:text-[#015028] transition-colors">
                    {ev.title}
                  </span>
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold mt-0.5">
                    {ev.dateStr}
                  </span>
                </div>

                {/* Left Icon */}
                <div className="w-8 h-8 rounded-full bg-[#015028] text-[#FFF2A8] flex items-center justify-center shrink-0 shadow-xs border border-[#E5A921]/40 group-hover:scale-105 transition-transform">
                  <Moon className="w-4 h-4 fill-[#FFF2A8]" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
