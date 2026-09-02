import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Search, X, Calendar, BookOpen, Tv, Newspaper, Clock, Cloud, Mic, Settings, ChevronLeft, Sun, Moon, CloudRain, CloudLightning, CloudSnow } from "lucide-react";
import { PrayerWeatherService } from "../services/PrayerWeatherService";
import { PrayerTimesConfig, WeatherConfig } from "../types";
import { useTheme } from "../context/ThemeContext";

export const HeaderWidgets: React.FC = () => {
  const navigate = useNavigate();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const [time, setTime] = useState(new Date());

  // UI state managers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hijri Date & Prayer Times State
  const [apiData, setApiData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [prayerConfig, setPrayerConfig] = useState<PrayerTimesConfig | null>(null);
  const [weatherConfig, setWeatherConfig] = useState<WeatherConfig | null>(null);
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

  // Listen to Firestore Manual Configs
  useEffect(() => {
    const unsubPrayer = PrayerWeatherService.subscribePrayerTimesConfig((cfg) => {
      setPrayerConfig(cfg);
    });
    const unsubWeather = PrayerWeatherService.subscribeWeatherConfig((cfg) => {
      setWeatherConfig(cfg);
    });
    return () => {
      unsubPrayer();
      unsubWeather();
    };
  }, []);

  // Fetch Hijri date and prayer times (for auto mode)
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

  // Fetch Weather data (for auto mode)
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
    let timings = apiData?.timings;

    // If manual mode is configured, override timings
    if (prayerConfig?.mode === "manual" && prayerConfig.timings) {
      timings = prayerConfig.timings;
    }

    if (!timings) return { name: "الفجر", countdown: "--:--:--" };
    
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
  }, [apiData, prayerConfig, time]);

  // Weather Display Mapping
  const weatherDisplay = useMemo(() => {
    // If manual weather mode is enabled, display manual admin settings
    if (weatherConfig?.mode === "manual") {
      const temp = Math.round(weatherConfig.temp);
      const condition = weatherConfig.conditionText || "صافٍ";
      const isNight = weatherConfig.isNight ?? false;
      const code = weatherConfig.weatherCode ?? 0;

      let IconComponent = Cloud;
      if (code === 0) {
        IconComponent = isNight ? Moon : Sun;
      } else if (code >= 51 && code <= 67) {
        IconComponent = CloudRain;
      } else if (code >= 80 && code <= 99) {
        IconComponent = CloudLightning;
      }

      return { text: `${temp}°C - ${condition}`, icon: IconComponent };
    }

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
  }, [weatherData, weatherConfig]);

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
    try {
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(time);
      const d = parts.find(p => p.type === 'day')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const y = parts.find(p => p.type === 'year')?.value;
      if (d && m && y) {
        return `${d} ${m} ${y} هـ`;
      }
    } catch {}
    return "17 ربيع الأول 1448 هـ";
  }, [apiHijriDate, time]);

  return (
    <div className="w-full max-w-[760px] mx-auto select-none bg-transparent" dir="rtl">
      {/* 
        Master Header
      */}
      <div className="relative w-full bg-white dark:bg-[#0A1324] border-b border-slate-100 dark:border-[#1E355B]/40 px-3 sm:px-4.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors overflow-hidden">
        
        {/* Right Area (visually Right in RTL): Two-line Platform Typography */}
        <Link 
          to="/" 
          className="relative z-10 flex items-center gap-2.5 sm:gap-3 group transition-transform hover:scale-[1.01] active:scale-99 min-w-0"
        >
          {/* Platform Title & Subtitle */}
          <div className="flex flex-col text-right items-start min-w-0">
            {/* Top Line: Title + Pill Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-[#0D1E36] dark:text-white font-black text-xs sm:text-sm md:text-[15px] leading-tight font-cairo tracking-tight drop-shadow-xs group-hover:text-amber-500 transition-colors truncate">
                منصة تعز الإعلامية
              </span>
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-[7.5px] sm:text-[8.5px] px-1.5 sm:px-2 py-0.5 rounded-full font-cairo shadow-xs shrink-0">
                إخبارية ثقافية
              </span>
            </div>

            {/* Bottom Line: Slogan */}
            <span className="text-slate-600 dark:text-slate-300 font-medium text-[10px] sm:text-[11.5px] leading-tight font-cairo mt-0.5 opacity-90 truncate max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-md">
              إعلام ينقل الواقع ويستنير بالقرآن والقائد
            </span>
          </div>
        </Link>

        {/* Left Area (visually Left in RTL): Quick Dark Mode Toggle + Search Trigger Button */}
        <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/80 dark:hover:bg-[#14274B] transition-colors cursor-pointer"
            title={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 stroke-[2.2]" />
            )}
          </button>

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-slate-800 hover:text-amber-600 dark:text-slate-200 dark:hover:text-amber-400 font-bold text-xs sm:text-sm transition-colors cursor-pointer font-cairo py-1.5 px-2 sm:px-2.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-[#14274B]"
            title="بحث في المنصة"
          >
            <Search className="w-4 h-4 text-amber-500 dark:text-amber-400 stroke-[2.2]" />
            <span className="hidden xs:inline">بحث في المنصة</span>
          </button>
        </div>

        {/* Search Panel Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="absolute inset-0 bg-white/98 dark:bg-[#0D1A33]/98 backdrop-blur-md z-40 px-3 sm:px-4 flex items-center gap-2 border-b border-slate-200 dark:border-[#1E355B]"
            >
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 relative">
                <Search className="absolute right-3.5 w-4 h-4 text-amber-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن الأخبار، المحاضرات، المقالات أو الوسائط..."
                  className="w-full h-8 sm:h-9 bg-slate-50 dark:bg-[#070F1E] border border-amber-500/30 dark:border-amber-500/40 rounded-full pr-10 pl-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all font-cairo font-semibold shadow-inner"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3.5 sm:px-4 h-8 sm:h-9 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-full font-black font-cairo text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
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
                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold font-cairo rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                إلغاء
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 
        Bottom Row: Widgets (Date, Prayer, Weather) - Integrated seamlessly into the master header
      */}
      <div className="w-full bg-white dark:bg-[#0A1324] px-3 sm:px-4.5 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2 overflow-hidden transition-colors">
        
        {/* Date/Day Widget */}
        <Link 
          to="/calendar" 
          title="الذهاب إلى التقويم الهجري"
          className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-start hover:opacity-80 active:scale-98 transition-all cursor-pointer group min-w-0"
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D32027] dark:text-[#F26522] shrink-0" />
          <div className="flex flex-col text-right min-w-0">
            <span className="text-slate-800 dark:text-slate-100 font-bold text-[9px] sm:text-[10px] leading-tight font-cairo truncate">{dayName}</span>
            <span className="text-[#D32027] dark:text-[#F26522] font-semibold text-[8px] sm:text-[9px] leading-tight font-cairo mt-0.5 truncate">{hijriDate}</span>
          </div>
        </Link>

        {/* Subtle Divider */}
        <div className="h-4.5 w-px bg-slate-200/60 dark:bg-[#1E355B]/50 shrink-0" />

        {/* Next Prayer Widget (Countdown) */}
        <Link 
          to="/prayer-times" 
          title="الذهاب إلى مواقيت الصلاة"
          className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center hover:opacity-80 active:scale-98 transition-all cursor-pointer group min-w-0"
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex flex-col text-right min-w-0">
            <span className="text-slate-800 dark:text-slate-100 font-bold text-[9px] sm:text-[10px] leading-tight font-cairo truncate">{nextPrayerInfo.name}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[8px] sm:text-[9px] leading-tight font-sans tracking-wider mt-0.5 truncate">{nextPrayerInfo.countdown}</span>
          </div>
        </Link>

        {/* Subtle Divider */}
        <div className="h-4.5 w-px bg-slate-200/60 dark:bg-[#1E355B]/50 shrink-0" />

        {/* Weather Widget */}
        <Link 
          to="/weather" 
          title="الذهاب إلى حالة الطقس"
          className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end hover:opacity-80 active:scale-98 transition-all cursor-pointer group min-w-0"
        >
          <div className="flex flex-col text-right min-w-0 items-end">
            <span className="text-slate-800 dark:text-slate-100 font-bold text-[9px] sm:text-[10px] leading-tight font-cairo truncate">الطقس الآن</span>
            <span className="text-sky-500 dark:text-sky-400 font-semibold text-[8px] sm:text-[9px] leading-tight font-cairo mt-0.5 truncate">{weatherDisplay.text}</span>
          </div>
          <weatherDisplay.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 dark:text-sky-400 shrink-0" />
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
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[360px] bg-white dark:bg-[#0A1324] border-l border-slate-100 dark:border-[#1E355B] shadow-2xl z-[70] flex flex-col p-6 overflow-y-auto no-scrollbar"
              dir="rtl"
            >
              {/* Drawer Header: Larger Logo, No text */}
              <div className="flex items-center justify-between mb-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1 flex justify-center pr-8"
                >
                  <img src="/ic_launcher.png" alt="منصة تعز" className="h-20 sm:h-24 w-auto object-contain drop-shadow-lg" />
                </motion.div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-[#14274B] text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-[#1E355B] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Toggle Card in Drawer */}
              <div className="mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1B33] border border-slate-200/80 dark:border-[#1E355B] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-cairo block">
                      {isDark ? "الوضع الداكن الكحلي" : "الوضع الفاتح"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-cairo">
                      انقر للتبديل السريع
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isDark ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all flex items-center justify-center text-[9px] ${
                      isDark ? "right-6 text-indigo-600" : "right-0.5 text-amber-500"
                    }`}
                  >
                    {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  </div>
                </button>
              </div>

              {/* Navigation sections with icons and animations */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] font-cairo mb-2 px-1">أقسام المنصة</span>
                {[
                  { to: "/", label: "الأخبار والمقالات", info: "تغطية شاملة وتحليل للأحداث", icon: Newspaper, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
                  { to: "/watch", label: "البث التلفزيوني والمرئي", info: "بث مباشر وقنوات وطنية", icon: Tv, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
                  { to: "/leader", label: "محاضرات وكلمات السيد القائد", info: "عبدالملك بن بدرالدين الحوثي", icon: Mic, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
                  { to: "/quran", label: "هدي القرآن", info: "ملازم الشهيد القائد ومصحف مسموع", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                  { to: "/events", label: "الفعاليات والمناسبات الوطنية", info: "أنشطة وفعاليات ومناسبات تعز", icon: Calendar, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
                  { to: "/admin", label: "لوحة تحكم حسابي", info: "إدارة الحساب والإعدادات", icon: Settings, color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-50 dark:bg-slate-800/40" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: -8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-start gap-4 p-3.5 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-[#1E355B] hover:shadow-sm transition-all group ${item.bg}/30`}
                    >
                      <div className={`w-11 h-11 shrink-0 rounded-xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                        <item.icon className="w-5.5 h-5.5" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors font-cairo">
                            {item.label}
                          </span>
                          <ChevronLeft className="w-4 h-4 text-slate-300 dark:text-slate-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
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
                  <Link to="/prayer-times" onClick={() => setIsDrawerOpen(false)} className="flex flex-col items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100/40 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 font-cairo text-center">المواقيت</span>
                  </Link>
                  <Link to="/weather" onClick={() => setIsDrawerOpen(false)} className="flex flex-col items-center gap-2 p-3 bg-sky-50/50 dark:bg-sky-950/30 rounded-2xl border border-sky-100/40 dark:border-sky-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors">
                    <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <span className="text-[9px] font-bold text-sky-800 dark:text-sky-300 font-cairo text-center">الطقس</span>
                  </Link>
                  <Link to="/calendar" onClick={() => setIsDrawerOpen(false)} className="flex flex-col items-center gap-2 p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-100/40 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 font-cairo text-center">التقويم</span>
                  </Link>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-cairo">
                   © منصة تعز الإعلامية 1448هـ - 2026م
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
