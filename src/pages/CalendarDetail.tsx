import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { SyncService } from "../services/SyncService";
import { EventItem } from "../types";
import { BASE_EVENTS } from "../data/staticEvents";
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Moon, 
  Sun, 
  Clock, 
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Info
} from "lucide-react";

interface AladhanDay {
  date: {
    readable: string;
    timestamp: string;
    hijri: {
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
    };
    gregorian: {
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
    };
  };
}

export default function CalendarDetail() {
  const navigate = useNavigate();
  const { month: paramMonth, year: paramYear } = useParams();
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<AladhanDay[]>([]);
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<AladhanDay | null>(null);
  
  // Current view Hijri Month and Year
  const [hijriMonth, setHijriMonth] = useState(1);
  const [hijriYear, setHijriYear] = useState(1448);
  
  // Sync Events from Firestore
  useEffect(() => {
    let active = true;
    const unsubPromise = SyncService.syncCollection<EventItem>("events", (data) => {
      if (active) setDbEvents(data);
    });
    return () => {
      active = false;
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  const allEvents = useMemo(() => {
    const dbTitles = new Set(dbEvents.map((e) => e.title));
    const merged = [...dbEvents];
    BASE_EVENTS.forEach((be, i) => {
      if (!dbTitles.has(be.title)) {
        merged.push({ id: `static-${i}`, ...be } as EventItem);
      }
    });
    return merged;
  }, [dbEvents]);

  // Initialize with current date or params
  useEffect(() => {
    if (paramMonth && paramYear) {
      setHijriMonth(parseInt(paramMonth));
      setHijriYear(parseInt(paramYear));
      return;
    }
    const today = new Date();
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
  }, []);

  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(today);
    const m = parts.find(p => p.type === 'month')?.value;
    const y = parts.find(p => p.type === 'year')?.value;
    return parseInt(m || "0") === hijriMonth && parseInt(y || "0") === hijriYear;
  }, [hijriMonth, hijriYear]);

  useEffect(() => {
    fetchCalendar(hijriMonth, hijriYear).then((data) => {
      if (data && isCurrentMonth) {
        const todayStr = new Date().toLocaleDateString('en-GB').split('/').join('-'); // DD-MM-YYYY
        const todayDay = data.find((d: AladhanDay) => d.date.gregorian.date === todayStr);
        if (todayDay) {
          setSelectedDay(todayDay);
        }
      }
    });
  }, [hijriMonth, hijriYear, isCurrentMonth]);

  const fetchCalendar = async (month: number, year: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/calendar?month=${month}&year=${year}`);
      if (response.data.code === 200) {
        setCalendarData(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
    return null;
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

  const goToToday = () => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
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
  };

  const weekDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  // Prepare grid
  const firstDay = calendarData[0];
  let emptyCells = 0;
  if (firstDay?.date?.gregorian?.weekday) {
    // Aladhan greg weekday number: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7
    // Our weekDays: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
    const gregDayNum = firstDay.date.gregorian.weekday.number; // 1-7
    
    // Mapping:
    // Mon: 1 -> 2
    // Tue: 2 -> 3
    // Wed: 3 -> 4
    // Thu: 4 -> 5
    // Fri: 5 -> 6
    // Sat: 6 -> 0
    // Sun: 7 -> 1
    const mapToOurIndex: Record<number, number> = {
      6: 0, // Sat
      7: 1, // Sun
      1: 2, // Mon
      2: 3, // Tue
      3: 4, // Wed
      4: 5, // Thu
      5: 6  // Fri
    };
    emptyCells = mapToOurIndex[gregDayNum] ?? 0;
  }

  const currentMonthName = calendarData[0]?.date?.hijri?.month?.ar || "";

  // Helper to normalize Arabic text (remove diacritics and normalize alefs)
  const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text
      .replace(/[\u064B-\u065F]/g, "") // Remove diacritics
      .replace(/[أإآ]/g, "ا") // Normalize Alefs
      .replace(/ة/g, "ه") // Normalize Teh Marbuta
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
  };

  // Helper to find events for a specific Hijri day
  const getEventsForDay = (day: AladhanDay) => {
    const hDay = parseInt(day.date.hijri.day).toString(); // remove leading zero
    const hMonthName = normalizeArabic(day.date.hijri.month.ar);
    const searchStr = `${hDay} ${hMonthName}`;
    
    return allEvents.filter(e => {
      const normalizedEventDate = normalizeArabic(e.hijriDate);
      // Try exact match or inclusion
      return normalizedEventDate === searchStr || normalizedEventDate.includes(searchStr);
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] dark:bg-[#0F0F10] text-slate-900 dark:text-zinc-100 font-cairo pb-12" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black tracking-tight">التقويم الهجري</h1>
          <button 
            onClick={goToToday}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${isCurrentMonth ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-default' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 active:scale-95'}`}
            disabled={isCurrentMonth}
          >
            اليوم
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-zinc-800/60">
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {currentMonthName} {hijriYear}
            </h2>
          </div>

          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-xl shadow-emerald-900/5 border border-slate-200/60 dark:border-zinc-800/60 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center py-3 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: emptyCells }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {calendarData.map((day) => {
              const isToday = new Date().toLocaleDateString('en-GB') === day.date.gregorian.date;
              const isSelected = selectedDay?.date?.timestamp === day.date.timestamp;
              const dayEvents = getEventsForDay(day);
              
              return (
                <button 
                  key={day.date.timestamp}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300 group
                    ${isToday 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-600/10 z-10' 
                      : isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/50'
                        : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }
                  `}
                >
                  <span className={`text-lg font-black ${isSelected && !isToday ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                    {parseInt(day.date.hijri.day)}
                  </span>
                  <span className={`text-[9px] font-bold mt-0.5 ${isToday ? 'text-white/80' : isSelected ? 'text-emerald-600/60' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {parseInt(day.date.gregorian.day)}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-red-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Info (Optional) */}
        <AnimatePresence mode="wait">
          {!loading && calendarData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-[2rem] p-6 flex items-center gap-6"
            >
              <div className="w-14 h-14 bg-white dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 dark:text-emerald-400">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-emerald-900 dark:text-emerald-100">تفاصيل الشهر</h4>
                <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-400/70 leading-relaxed">
                  هذا الشهر {calendarData.length} يوماً. يبدأ يوم {calendarData[0]?.date?.hijri?.weekday?.ar || '...'} وينتهي يوم {calendarData[calendarData.length - 1]?.date?.hijri?.weekday?.ar || '...'}.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Occasions List (From Firestore/Static) */}
        {!loading && (
          <div className="space-y-4">
            <h3 className="text-lg font-black px-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>المناسبات في هذا الشهر</span>
            </h3>
            <div className="grid gap-3">
              {calendarData
                .map(day => ({ day, events: getEventsForDay(day) }))
                .filter(item => item.events.length > 0)
                .map(({ day, events }, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDay(day)}
                    className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl cursor-pointer hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-zinc-200">{events.map(e => e.title).join('، ')}</span>
                        <span className="text-[10px] text-slate-400">{day.date.hijri?.weekday?.ar || ''}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm block">
                        {day.date.hijri?.day} {day.date.hijri?.month?.ar}
                      </span>
                      <span className="text-[10px] text-slate-400">{day.date.gregorian?.date}</span>
                    </div>
                  </div>
                ))}
              {calendarData.every(day => getEventsForDay(day).length === 0) && (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-bold">لا توجد مناسبات مسجلة لهذا الشهر</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Day Detail Modal */}
        <AnimatePresence>
          {selectedDay && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDay(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="absolute top-6 left-6 p-2 bg-slate-100 dark:bg-zinc-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <CalendarIcon className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black">{selectedDay.date.hijri.weekday.ar}</h3>
                    <p className="text-emerald-600 font-black text-lg">
                      {parseInt(selectedDay.date.hijri.day)} {selectedDay.date.hijri.month.ar} {selectedDay.date.hijri.year} هـ
                    </p>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-zinc-800 w-full" />

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">التاريخ الميلادي الموافق</p>
                    <p className="text-xl font-black text-slate-800 dark:text-zinc-100">
                      {selectedDay.date.gregorian.day} {selectedDay.date.gregorian.month.en} {selectedDay.date.gregorian.year} م
                    </p>
                    <p className="text-sm font-bold text-slate-500">
                      {selectedDay.date.gregorian.date}
                    </p>
                  </div>

                  {getEventsForDay(selectedDay).length > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="text-xs font-black text-red-500 flex items-center justify-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        <span>مناسبات مسجلة</span>
                      </div>
                      <div className="space-y-2">
                        {getEventsForDay(selectedDay).map((e, idx) => (
                          <div key={idx} className="bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-black">
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
