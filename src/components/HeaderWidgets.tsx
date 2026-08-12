import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Search, X, Calendar, BookOpen, Tv, Newspaper, Clock, Cloud, Mic, Settings, ChevronLeft, Sun, Moon, CloudRain, CloudLightning, CloudSnow } from "lucide-react";

export const HeaderWidgets: React.FC = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  // UI state managers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hijri Date & Prayer Times State
  const [apiData, setApiData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [apiHijriDate, setApiHijriDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem("cached_hijri_date");
    } catch {
      return null;
    }
  });

  // Real-time tick for clock/day calculation (1 second for countdown)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Hijri date and prayer times
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Taiz&country=Yemen&method=4`);
        if (response.ok) {
          const data = await response.json();
          setApiData(data.data);
          const hijri = data.data.date.hijri;
          const newHijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
          setApiHijriDate(newHijriDate);
          localStorage.setItem("cached_hijri_date", newHijriDate);
        }
      } catch (e) {
        console.warn("API fetch failed", e);
      }
    };
    fetchData();
  }, []);

  // Fetch Weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Taiz coordinates: 13.5795, 44.0209
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.5795&longitude=44.0209&current_weather=true&timezone=auto');
        if (response.ok) {
          const data = await response.json();
          setWeatherData(data.current_weather);
        }
      } catch (e) {
        console.warn("Weather API fetch failed", e);
      }
    };
    fetchWeather();
    
    // update every 30 mins
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Next Prayer and Countdown
  const nextPrayerInfo = useMemo(() => {
    if (!apiData) return { name: "الفجر", countdown: "--:--:--" };
    const timings = apiData.timings;
    
    const timeToMs = (timeStr: string) => {
      const timePart = timeStr.split(' ')[0];
      const [h, m] = timePart.split(':').map(Number);
      const d = new Date(time);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };

    const schedule = [
      { name: "الفجر", ms: timeToMs(timings.Fajr) },
      { name: "الظهر", ms: timeToMs(timings.Dhuhr) },
      { name: "العصر", ms: timeToMs(timings.Asr) },
      { name: "المغرب", ms: timeToMs(timings.Maghrib) },
      { name: "العشاء", ms: timeToMs(timings.Isha) }
    ];

    const currentMs = time.getTime();
    let next = schedule.find(p => p.ms > currentMs);

    if (!next) {
      // Next is Fajr of tomorrow
      next = schedule[0];
      next.ms += 24 * 60 * 60 * 1000;
    }

    const diff = next.ms - currentMs;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const countdownStr = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');

    return { name: next.name, countdown: countdownStr };
  }, [apiData, time]);

  // Weather Display Mapping
  const weatherDisplay = useMemo(() => {
    if (!weatherData) return { text: "جاري التحديث...", icon: Cloud };
    
    const { temperature, weathercode, is_day } = weatherData;
    let text = "صافٍ";
    let IconComponent = Cloud;
    
    if (weathercode === 0) {
      text = is_day ? "صافٍ ومشمس" : "صافٍ ليلاً";
      IconComponent = is_day ? Sun : Moon;
    } else if (weathercode === 1 || weathercode === 2) {
      text = is_day ? "غائم جزئياً" : "غائم جزئياً ليلاً";
      IconComponent = Cloud;
    } else if (weathercode === 3) {
      text = is_day ? "غائم" : "غائم ليلاً";
      IconComponent = Cloud;
    } else if (weathercode >= 45 && weathercode <= 48) {
      text = "ضباب";
      IconComponent = Cloud;
    } else if (weathercode >= 51 && weathercode <= 67) {
      text = "أمطار خفيفة";
      IconComponent = CloudRain;
    } else if (weathercode >= 71 && weathercode <= 77) {
      text = "ثلوج";
      IconComponent = CloudSnow;
    } else if (weathercode >= 80 && weathercode <= 99) {
      text = "أمطار وعواصف";
      IconComponent = CloudLightning;
    }

    return { text: `${Math.round(temperature)}°C - ${text}`, icon: IconComponent };
  }, [weatherData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  // Format Day Name
  const dayName = useMemo(() => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return days[time.getDay()];
  }, [time]);

  // Hijri Date display
  const hijriDate = useMemo(() => {
    if (apiHijriDate) return apiHijriDate;
    return "25 صفر 1448 هـ";
  }, [apiHijriDate]);

  return (
    <div className="w-full max-w-[760px] mx-auto select-none" dir="rtl">
      {/* 
        Main Header: Platform Title (Right) and Buttons (Left)
      */}
      <div className="relative w-full bg-white border-x border-t border-slate-200/40 shadow-xs px-4 sm:px-5 py-3 flex items-center justify-between min-h-[60px] sm:min-h-[76px] transition-all overflow-hidden">
        
        {/* Right Area (visually Right in RTL): Platform Text Title */}
        <Link to="/" className="flex flex-col text-right items-start group transition-transform hover:scale-[1.01] active:scale-99">
          <span className="text-taiz-sky font-black text-sm sm:text-base md:text-lg leading-none font-cairo">منصة تعز الإعلامية</span>
          <span className="text-amber-500 font-bold text-[9px] sm:text-[10px] md:text-[11px] leading-tight tracking-widest font-sans mt-1">TAIZ MEDIA PLATFORM</span>
        </Link>

        {/* Left Area (visually Left in RTL): Menu & Search */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-white border border-slate-200/60 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center text-slate-800 cursor-pointer"
          >
            <Search className="w-[18px] h-[18px] text-slate-700" strokeWidth={1.8} />
          </button>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-white border border-slate-200/60 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center text-slate-800 cursor-pointer"
            id="header-hamburger-menu"
          >
            <Menu className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Search Panel Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 bg-white z-40 px-3 flex items-center gap-2"
            >
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 relative">
                <Search className="absolute right-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن الأخبار أو الموضوعات..."
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-cairo font-semibold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 h-10 bg-[#D32027] text-white rounded-xl font-bold font-cairo text-sm hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  بحث
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 
        Bottom Row: Widgets (Date, Prayer, Weather)
      */}
      <div className="w-full bg-slate-50/80 border-x border-b border-slate-200/40 px-4 py-2.5 flex items-center justify-between gap-3 overflow-hidden shadow-inner-sm">
        
        {/* Date/Day Widget */}
        <Link 
          to="/calendar" 
          title="الذهاب إلى التقويم الهجري"
          className="flex items-center gap-2 flex-1 hover:opacity-80 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-xs group-hover:border-[#D32027]/40">
            <Calendar className="w-4 h-4 text-[#D32027]" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-850 font-black text-[10px] sm:text-[11px] leading-tight font-cairo">{dayName}</span>
            <span className="text-[#D32027] font-bold text-[9px] sm:text-[10px] leading-none font-cairo mt-0.5">{hijriDate}</span>
          </div>
        </Link>

        {/* Next Prayer Widget (Countdown) */}
        <Link 
          to="/prayer-times" 
          title="الذهاب إلى مواقيت الصلاة"
          className="flex items-center gap-2 flex-1 justify-center border-x border-slate-200/40 px-2 hover:opacity-80 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-xs group-hover:border-emerald-500/40">
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex flex-col text-right w-[50px] sm:w-[60px]">
            <span className="text-slate-850 font-black text-[10px] sm:text-[11px] leading-tight font-cairo">{nextPrayerInfo.name}</span>
            <span className="text-emerald-600 font-bold text-[10px] sm:text-[11px] leading-none font-sans mt-0.5 tracking-wider">{nextPrayerInfo.countdown}</span>
          </div>
        </Link>

        {/* Weather Widget */}
        <Link 
          to="/weather" 
          title="الذهاب إلى حالة الطقس"
          className="flex items-center gap-2 flex-1 justify-end hover:opacity-80 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-xs group-hover:border-sky-500/40">
            <weatherDisplay.icon className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-850 font-black text-[10px] sm:text-[11px] leading-tight font-cairo">الطقس الآن</span>
            <span className="text-sky-500 font-bold text-[9px] sm:text-[10px] leading-none font-cairo mt-0.5 whitespace-nowrap">{weatherDisplay.text}</span>
          </div>
        </Link>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] cursor-pointer"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[360px] bg-white shadow-2xl z-[70] flex flex-col p-6 overflow-y-auto no-scrollbar"
              dir="rtl"
            >
              {/* Drawer Header: Larger Logo, No text */}
              <div className="flex items-center justify-between mb-8">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1 flex justify-center pr-8"
                >
                  <img src="/logo3.png" alt="منصة تعز" className="h-20 sm:h-24 w-auto object-contain drop-shadow-lg" />
                </motion.div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation sections with icons and animations */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] font-cairo mb-2 px-1">أقسام المنصة</span>
                {[
                  { to: "/", label: "الأخبار والمقالات", info: "تغطية شاملة وتحليل للأحداث", icon: Newspaper, color: "text-red-600", bg: "bg-red-50" },
                  { to: "/watch", label: "البث التلفزيوني والمرئي", info: "بث مباشر وقنوات وطنية", icon: Tv, color: "text-blue-600", bg: "bg-blue-50" },
                  { to: "/leader", label: "محاضرات وكلمات السيد القائد", info: "عبدالملك بن بدرالدين الحوثي", icon: Mic, color: "text-amber-600", bg: "bg-amber-50" },
                  { to: "/quran", label: "هدي القرآن", info: "ملازم الشهيد القائد ومصحف مسموع", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { to: "/events", label: "الفعاليات والمناسبات الوطنية", info: "أنشطة وفعاليات ومناسبات تعز", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
                  { to: "/admin", label: "لوحة تحكم حسابي", info: "إدارة الحساب والإعدادات", icon: Settings, color: "text-slate-600", bg: "bg-slate-50" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: -8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-start gap-4 p-3.5 rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-sm transition-all group ${item.bg}/30`}
                    >
                      <div className={`w-11 h-11 shrink-0 rounded-xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                        <item.icon className="w-5.5 h-5.5" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800 group-hover:text-slate-900 transition-colors font-cairo">
                            {item.label}
                          </span>
                          <ChevronLeft className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 font-cairo">
                          {item.info}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Quick Access Grid */}
              <div className="mt-8 mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] font-cairo mb-4 px-1 block">وصول سريع</span>
                <div className="grid grid-cols-3 gap-3">
                  <Link to="/prayer-times" onClick={() => setIsDrawerOpen(false)} className="flex flex-col items-center gap-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/40 hover:bg-emerald-50 transition-colors">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-800 font-cairo text-center">المواقيت</span>
                  </Link>
                  <Link to="/weather" onClick={() => setIsDrawerOpen(false)} className="flex flex-col items-center gap-2 p-3 bg-sky-50/50 rounded-2xl border border-sky-100/40 hover:bg-sky-50 transition-colors">
                    <Cloud className="w-5 h-5 text-sky-600" />
                    <span className="text-[9px] font-bold text-sky-800 font-cairo text-center">الطقس</span>
                  </Link>
                  <Link to="/calendar" onClick={() => setIsDrawerOpen(false)} className="flex flex-col items-center gap-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/40 hover:bg-amber-50 transition-colors">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span className="text-[9px] font-bold text-amber-800 font-cairo text-center">التقويم</span>
                  </Link>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 font-cairo">
                   © منصة تعز الإعلامية - جميع الحقوق محفوظة
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
