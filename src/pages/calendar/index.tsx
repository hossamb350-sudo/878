import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { SyncService } from "../../services/SyncService";
import { EventItem, ActivityItem } from "../../types";
import { BASE_EVENTS } from "../../data/staticEvents";
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
  Bookmark,
  ExternalLink,
  CalendarDays,
  Info
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

// Helper to normalize Arabic text
const normalizeArabic = (text: string) => {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F]/g, "") // remove tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
};

// Helper to parse Hijri Date String and return Month Number (1-12) and Day Numbers
const parseHijriDateInfo = (hijriDateStr: string): { month: number | null; days: number[] } => {
  if (!hijriDateStr) return { month: null, days: [] };
  
  const norm = normalizeArabic(hijriDateStr);
  let month: number | null = null;

  if (norm.includes("محرم")) month = 1;
  else if (norm.includes("صفر")) month = 2;
  else if (norm.includes("ربيع الاول") || norm.includes("ربيع 1")) month = 3;
  else if (norm.includes("ربيع الثاني") || norm.includes("ربيع الاخر") || norm.includes("ربيع 2")) month = 4;
  else if (norm.includes("جمادى الاولى") || norm.includes("جمادى 1")) month = 5;
  else if (norm.includes("جمادى الاخره") || norm.includes("جمادى الثانية") || norm.includes("جمادى 2")) month = 6;
  else if (norm.includes("رجب")) month = 7;
  else if (norm.includes("شعبان")) month = 8;
  else if (norm.includes("رمضان")) month = 9;
  else if (norm.includes("شوال")) month = 10;
  else if (norm.includes("ذو القعدة") || norm.includes("ذو القعده")) month = 11;
  else if (norm.includes("ذو الحجة") || norm.includes("ذو الحجه")) month = 12;

  const days: number[] = [];

  // Range check e.g. "13-19"
  const rangeMatch = norm.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    for (let d = start; d <= end; d++) {
      days.push(d);
    }
  } else {
    // Single number match e.g. "6" or "12" or "25"
    const numMatch = norm.match(/\d+/);
    if (numMatch) {
      days.push(parseInt(numMatch[0]));
    } else {
      if (norm.includes("اول جمعة") || norm.includes("اول جمعه")) {
        days.push(1, 8);
      } else if (norm.includes("اخر جمعة") || norm.includes("اخر جمعه")) {
        days.push(25, 28);
      }
    }
  }

  return { month, days };
};

// Helper to extract day details safely
const getAladhanDayData = (d: AladhanDay | null) => {
  if (!d) return { gregorian: null, hijri: null, timestamp: "" };
  const gregorian = d.gregorian || d.date?.gregorian || null;
  const hijri = d.hijri || d.date?.hijri || null;
  const timestamp = d.timestamp || d.date?.timestamp || (gregorian?.date ? `${gregorian.date}` : "");
  return { gregorian, hijri, timestamp };
};

// Interactive Crescent Calendar Icon
const Interactive3DHijriIllustration = () => (
  <motion.div 
    whileHover={{ scale: 1.05, rotate: -2 }}
    whileTap={{ scale: 0.96 }}
    className="relative w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 flex items-center justify-center shrink-0 drop-shadow-2xl select-none cursor-pointer transition-transform"
  >
    <img 
      src="/crescentcalendarhahri.png" 
      alt="الهلال والتقويم الهجري" 
      className="w-full h-full object-contain drop-shadow-md"
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
  
  // Selected Hijri day number
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(6);
  
  // Current view Hijri Month and Year (Default Safar 1448 H)
  const [hijriMonth, setHijriMonth] = useState<number>(2);
  const [hijriYear, setHijriYear] = useState<number>(1448);

  // Real-time actual Today Hijri Date
  const [todayHijri, setTodayHijri] = useState<{ day: number; month: number; year: number }>({
    day: 6,
    month: 2,
    year: 1448
  });

  // Sync Events from Firestore (Single Source of Truth - strictly occasions/events, no activities)
  useEffect(() => {
    let active = true;
    const unsubEventsPromise = SyncService.syncCollection<EventItem>("events", (data) => {
      if (active) setDbEvents(data);
    });
    return () => {
      active = false;
      unsubEventsPromise.then(unsub => unsub());
    };
  }, []);

  // Single Source of Truth dataset containing strictly events / occasions (تقويم المناسبات)
  const allEvents = useMemo(() => {
    const dbTitles = new Set(dbEvents.map((e) => e.title));
    const merged: (EventItem | { id: string; title: string; hijriDate: string; gregorianDate?: string; category?: string; description?: string })[] = [...dbEvents];
    
    BASE_EVENTS.forEach((be, i) => {
      if (!dbTitles.has(be.title)) {
        merged.push({ id: `static-${i}`, ...be } as EventItem);
      }
    });
    return merged;
  }, [dbEvents]);

  // Filter events STRICTLY for the currently selected Hijri Month
  const currentMonthEvents = useMemo(() => {
    return allEvents
      .filter((e) => {
        if (!e.hijriDate) return false;
        const { month } = parseHijriDateInfo(e.hijriDate);
        return month === hijriMonth;
      })
      .map((e) => {
        const { days } = parseHijriDateInfo(e.hijriDate);
        const primaryDay = days[0] || 1;
        return {
          ...e,
          days,
          primaryDay,
          hijriDayTag: days.length > 1 ? `${days[0]}-${days[days.length - 1]}` : `${primaryDay}`,
          hijriMonthTag: HIJRI_MONTH_NAMES[hijriMonth - 1] || ""
        };
      })
      .sort((a, b) => a.primaryDay - b.primaryDay);
  }, [allEvents, hijriMonth]);

  // Events that fall on the currently selected day
  const selectedDayEvents = useMemo(() => {
    return currentMonthEvents.filter(ev => ev.days.includes(selectedDayNumber));
  }, [currentMonthEvents, selectedDayNumber]);

  // Initialize with params or current Hijri date
  useEffect(() => {
    const today = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(today);
      const d = parts.find(p => p.type === 'day')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const y = parts.find(p => p.type === 'year')?.value;
      
      if (d && m && y) {
        const realDay = parseInt(d);
        const realMonth = parseInt(m);
        const realYear = parseInt(y);
        setTodayHijri({ day: realDay, month: realMonth, year: realYear });

        if (!paramMonth && !paramYear) {
          setHijriMonth(realMonth);
          setHijriYear(realYear);
          setSelectedDayNumber(realDay);
        }
      }
    } catch {
      setTodayHijri({ day: 6, month: 2, year: 1448 });
    }

    if (paramMonth && paramYear) {
      setHijriMonth(parseInt(paramMonth));
      setHijriYear(parseInt(paramYear));
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

    // Fallback calendar month generation
    const fallbackDays: AladhanDay[] = [];
    const monthNameAr = HIJRI_MONTH_NAMES[month - 1] || "صفر";
    // Calculate approximate start date offset for fallback
    const baseDate = new Date(2026, 5, 16); // 1 Muharram 1448 = June 16, 2026
    const daysOffset = (month - 1) * 29.5;
    const startDate = new Date(baseDate.getTime() + daysOffset * 86400000);
    
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
    // Reset selected day to 1 when changing month
    setSelectedDayNumber(1);
  };

  const weekDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  const currentMonthName = HIJRI_MONTH_NAMES[hijriMonth - 1] || "صفر";

  // Derive selected day info for hero metrics
  const selectedDayData = useMemo(() => {
    const day = calendarData.find(d => {
      const { hijri } = getAladhanDayData(d);
      return hijri?.day && parseInt(hijri.day) === selectedDayNumber;
    });
    return getAladhanDayData(day || calendarData[selectedDayNumber - 1] || null);
  }, [calendarData, selectedDayNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8F3] via-[#E6F4EA] to-[#DCF0E3] pb-16 pt-2 px-3 sm:px-6 select-none font-sans" dir="rtl">
      {/* Centered Mobile/Tablet Container matching Weather & Events page width */}
      <div className="max-w-md md:max-w-xl mx-auto space-y-3.5 sm:space-y-4">



        {/* 2. MAIN HERO ISLAMIC CARD */}
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
                المقابل الميلادي: {selectedDayData.gregorian?.date || `2026-07-20`} ({selectedDayData.hijri?.weekday?.ar || 'الإثنين'})
              </p>
            </div>

            {/* RIGHT SIDE: Interactive Crescent Calendar Icon */}
            <Interactive3DHijriIllustration />

          </div>

          {/* BOTTOM OVERLAY INSIDE HERO CARD: 4 FROSTED METRIC CARDS */}
          <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-2 mt-2 pt-3 border-t border-[#E5A921]/25">
            
            {/* Metric 1: اليوم */}
            <div className="bg-[#002814]/50 backdrop-blur-md border border-[#E5A921]/30 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-0.5 hover:bg-[#002814]/70 transition-colors">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold font-cairo">اليوم</span>
              <span className="text-xs sm:text-sm font-black font-cairo tracking-tight text-white">
                {selectedDayData.hijri?.weekday?.ar || 'الإثنين'}
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
                {currentMonthEvents.length} مناسبة
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
                {calendarData[0]?.hijri?.weekday?.ar || 'الأربعاء'} (1 {currentMonthName})
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
                {calendarData[calendarData.length - 1]?.hijri?.weekday?.ar || 'الخميس'} ({calendarData.length || 30} {currentMonthName})
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
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#E5A921]/30 border border-[#E5A921]/40 text-amber-200 flex items-center justify-center transition-colors shrink-0 active:scale-95 cursor-pointer"
              title="الشهر التالي"
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
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#E5A921]/30 border border-[#E5A921]/40 text-amber-200 flex items-center justify-center transition-colors shrink-0 active:scale-95 cursor-pointer"
              title="الشهر السابق"
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
              {Array.from({ length: calendarData.length || 30 }).map((_, idx) => {
                const hDayNum = idx + 1;
                let gDayNum = 15 + idx;
                if (gDayNum > 31) {
                  gDayNum = gDayNum - 31;
                }

                const isSelected = selectedDayNumber === hDayNum;
                const isToday = todayHijri && todayHijri.day === hDayNum && todayHijri.month === hijriMonth && todayHijri.year === hijriYear;
                
                // Check if this day has an event/occasion
                const dayEvs = currentMonthEvents.filter(ev => ev.days.includes(hDayNum));
                const hasEvent = dayEvs.length > 0;

                return (
                  <button 
                    key={`hday-${hDayNum}`}
                    onClick={() => setSelectedDayNumber(hDayNum)}
                    className="relative aspect-square flex flex-col items-center justify-center transition-all duration-150 group cursor-pointer"
                  >
                    {/* Event Indicator Dot / Star Badge (Top-Right) */}
                    {hasEvent && (
                      <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5 z-10" title="يوجد مناسبة">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A921] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E5A921] border border-white dark:border-slate-900 shadow-xs"></span>
                      </span>
                    )}

                    {/* Today Badge (Top-Left) - Distinct design, stays visible even if hasEvent is true */}
                    {isToday && (
                      <span className="absolute -top-1.5 -left-1 z-20 flex items-center justify-center bg-[#015028] text-[#FFF2A8] font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full border border-[#E5A921] shadow-md font-cairo leading-none tracking-tight animate-pulse" title="اليوم الحالي">
                        اليوم
                      </span>
                    )}

                    {isSelected ? (
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#0B6B3D] via-[#054E29] to-[#00341B] text-white flex flex-col items-center justify-center transition-transform scale-105 ${
                        isToday 
                          ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.5)]' 
                          : 'ring-2 ring-[#E5A921] shadow-[0_4px_16px_rgba(229,169,33,0.4)]'
                      }`}>
                        <span className="text-xs sm:text-sm font-black font-cairo leading-none text-[#FFF2A8]">
                          {hDayNum}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-100 mt-0.5 leading-none">
                          {gDayNum}
                        </span>
                      </div>
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center rounded-xl transition-all ${
                        isToday
                          ? 'bg-gradient-to-br from-[#E6F7ED] via-[#D8F2E2] to-[#C7EBD3] border-2 border-emerald-600 text-[#015028] shadow-md ring-2 ring-emerald-500/40'
                          : hasEvent 
                            ? 'bg-[#FEF9E6] dark:bg-amber-950/40 border-2 border-[#E5A921]/70 text-[#015028] shadow-xs hover:bg-[#FDEEB3]' 
                            : 'hover:bg-[#EBF7EF]'
                      }`}>
                        <span className={`text-xs sm:text-sm font-black font-cairo leading-none ${isToday ? 'text-emerald-950 font-black' : hasEvent ? 'text-[#015028]' : 'text-slate-800'}`}>
                          {hDayNum}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] font-bold mt-0.5 leading-none ${isToday ? 'text-emerald-700 font-extrabold' : hasEvent ? 'text-[#A36A00]' : 'text-slate-400'}`}>
                          {gDayNum}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. OCCASION DETAILS FOR SELECTED DAY (IF ANY) */}
          <AnimatePresence mode="wait">
            {selectedDayEvents.length > 0 && (
              <motion.div 
                key={`day-ev-${selectedDayNumber}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="bg-gradient-to-br from-[#FFFDF2] via-[#FEF9E6] to-[#FDEEB3] border-2 border-[#E5A921] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-md space-y-2.5 text-right mt-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E5A921]/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E5A921] shrink-0" />
                    <span className="text-xs sm:text-sm font-black text-[#015028] font-cairo">
                      مناسبة هذا اليوم ({selectedDayNumber} {currentMonthName})
                    </span>
                  </div>
                  <span className="bg-[#0B6B3D] text-[#FFF2A8] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#E5A921]/40">
                    {selectedDayEvents[0].category === "national" ? "مناسبة وطنية" : "مناسبة دينية"}
                  </span>
                </div>

                {/* Details */}
                {selectedDayEvents.map((ev, i) => (
                  <div key={i} className="space-y-1.5 pt-0.5">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 font-cairo leading-snug">
                      {ev.title}
                    </h4>
                    {ev.description && (
                      <p className="text-xs font-medium text-slate-700 font-cairo leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1">
                      <span className="text-[#015028]">التاريخ: {ev.hijriDate} {ev.gregorianDate ? `(${ev.gregorianDate})` : ''}</span>
                      <Link 
                        to="/events" 
                        className="inline-flex items-center gap-1 text-[#015028] hover:text-[#0B6B3D] font-extrabold text-[11px] hover:underline"
                      >
                        <span>عرض في قسم المناسبات</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 6. UPCOMING EVENTS IN THIS MONTH SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-md rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-5 border border-[#0B6B3D]/20 shadow-[0_8px_30px_rgba(1,80,40,0.06)] overflow-hidden space-y-3"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E4F4EB] text-[#015028] flex items-center justify-center shrink-0 border border-[#E5A921]/30">
                <Bookmark className="w-4 h-4 text-[#E5A921]" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#015028] font-cairo">
                المناسبات في هذا الشهر ({currentMonthName})
              </h3>
            </div>
            
            <span className="text-xs font-black text-[#A36A00] bg-[#FFFDF2] border border-[#E5A921]/40 px-2.5 py-1 rounded-full font-cairo">
              {currentMonthEvents.length} مناسبة
            </span>
          </div>

          {/* Events List Cards */}
          {currentMonthEvents.length === 0 ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-2 bg-[#FAFCFA] rounded-2xl border border-dashed border-slate-200">
              <CalendarDays className="w-8 h-8 text-slate-300" />
              <p className="text-xs sm:text-sm font-bold text-slate-500 font-cairo">
                لا توجد مناسبات مسجلة في شهر {currentMonthName}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentMonthEvents.map((ev, idx) => {
                const isSelectedDayEv = ev.days.includes(selectedDayNumber);
                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDayNumber(ev.primaryDay)}
                    className={`rounded-xl p-2.5 sm:p-3 border flex items-center justify-between gap-2.5 transition-all cursor-pointer group ${
                      isSelectedDayEv
                        ? 'bg-[#FEF9E6] border-2 border-[#E5A921] shadow-md ring-2 ring-[#E5A921]/30 scale-[1.01]'
                        : 'bg-gradient-to-r from-[#FAFCFA] to-[#F0FAF4] border-[#0B6B3D]/15 hover:border-[#E5A921]/60 hover:shadow-xs'
                    }`}
                  >
                    {/* Right Tag: Hijri Day/Month Badge */}
                    <div className="bg-gradient-to-b from-[#0B6B3D] to-[#015028] text-white px-2.5 py-1.5 rounded-lg flex flex-col items-center justify-center shrink-0 min-w-[64px] text-center font-cairo border border-[#E5A921]/40 shadow-xs">
                      <span className="text-sm font-black leading-none text-[#FFF2A8]">{ev.hijriDayTag}</span>
                      <span className="text-[10px] font-bold leading-none mt-0.5 text-emerald-100">{ev.hijriMonthTag}</span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col flex-1 text-right space-y-0.5">
                      <span className="font-black text-slate-800 text-xs sm:text-sm font-cairo group-hover:text-[#015028] transition-colors leading-snug">
                        {ev.title}
                      </span>
                      {ev.gregorianDate && (
                        <span className="text-slate-500 text-[10px] sm:text-xs font-bold">
                          المقابل: {ev.gregorianDate}
                        </span>
                      )}
                    </div>

                    {/* Left Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#015028] text-[#FFF2A8] flex items-center justify-center shrink-0 shadow-xs border border-[#E5A921]/40 group-hover:scale-105 transition-transform">
                      <Moon className="w-4 h-4 fill-[#FFF2A8]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

