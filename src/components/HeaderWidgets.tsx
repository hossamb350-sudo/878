import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Search, Bell, Sun, X, Calendar, BookOpen, Tv, User, Newspaper } from "lucide-react";

export const HeaderWidgets: React.FC = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  // UI state managers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hijri Date State (API + local fallback)
  const [apiHijriDate, setApiHijriDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem("cached_hijri_date");
    } catch {
      return null;
    }
  });

  // Real-time tick for clock/day calculation
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // 1 minute interval is enough
    return () => clearInterval(timer);
  }, []);

  // Fetch Hijri date on mount
  useEffect(() => {
    const fetchHijriDate = async () => {
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Taiz&country=Yemen&method=4`);
        if (response.ok) {
          const data = await response.json();
          const hijri = data.data.date.hijri;
          const newHijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
          setApiHijriDate(newHijriDate);
          localStorage.setItem("cached_hijri_date", newHijriDate);
        }
      } catch (e) {
        console.warn("Hijri date API fetch failed", e);
      }
    };
    fetchHijriDate();
  }, []);

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

  // Hijri Date display (formatted)
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
      return "25 صفر 1448 هـ";
    }
  }, [apiHijriDate, time]);

  return (
    <div className="w-full max-w-[760px] mx-auto select-none" dir="rtl">
      {/* 
        Unified Pure White Header container with no rounded corners 
        Matches the reference design exactly: no decorations, flat white background, rounded-none
      */}
      <div className="relative w-full bg-white border-x border-slate-200/40 shadow-soft px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between min-h-[60px] sm:min-h-[76px] rounded-none transition-all overflow-hidden">
        
        {/* Right Area: Hamburger Menu & Logo & Date Info */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-white border border-slate-200/60 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center text-slate-800 cursor-pointer"
            id="header-hamburger-menu"
            aria-label="القائمة الرئيسية"
          >
            <Menu className="w-5 h-5" strokeWidth={1.8} />
          </button>

          {/* Logo with clean scaling */}
          <Link to="/" className="hover:scale-[1.01] active:scale-99 transition-all shrink-0">
            <img 
              src="/logo3.png" 
              alt="منصة تعز الإعلامية" 
              className="h-[38px] xs:h-[44px] sm:h-[54px] md:h-[64px] w-auto object-contain" 
            />
          </Link>

          {/* Date display stacked directly next to the logo as shown in reference */}
          <div className="flex flex-col text-right justify-center font-cairo pr-1 sm:pr-2 select-text">
            <span className="text-slate-850 font-extrabold text-[11px] sm:text-[13px] md:text-[15px] leading-tight">
              {dayName}
            </span>
            <span className="text-[#D32027] font-bold text-[9px] sm:text-[11px] md:text-[12px] mt-0.5 leading-none whitespace-nowrap">
              {hijriDate}
            </span>
          </div>
        </div>

        {/* Left Area: Compact Group of Utility Buttons matching the reference image */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* 2. Font Sizing button "Aع" */}
          <button
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-white border border-slate-200/60 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center text-slate-800 font-semibold font-cairo cursor-pointer"
            title="حجم الخط"
            id="header-font-size-btn"
          >
            <span className="text-xs sm:text-[14px] flex items-baseline gap-[1px] font-black">
              <span className="font-sans">A</span>
              <span className="text-[9px] sm:text-[10px] font-bold font-cairo text-slate-500">ع</span>
            </span>
          </button>

          {/* 1. Search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-white border border-slate-200/60 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center text-slate-800 cursor-pointer"
            title="البحث"
            id="header-search"
          >
            <Search className="w-[18px] h-[18px] text-slate-700" strokeWidth={1.8} />
          </button>
        </div>

        {/* Search Panel Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="absolute inset-0 bg-white z-40 px-3 flex items-center gap-2 rounded-[20px]"
            >
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 relative">
                <Search className="absolute right-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن الأخبار أو الموضوعات..."
                  className="w-full h-9 sm:h-10 bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-cairo font-semibold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3.5 h-9 sm:h-10 bg-[#D32027] text-white rounded-xl font-bold font-cairo text-xs sm:text-sm hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-sm"
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
                className="p-1.5 bg-slate-50 text-slate-500 rounded-xl hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Hamburger Sidebar Menu Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 cursor-pointer"
            />
            
            {/* Drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[340px] bg-white shadow-2xl z-50 flex flex-col p-5 overflow-y-auto"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <img src="/logo3.png" alt="منصة تعز" className="h-9 w-auto object-contain" />
                  <span className="font-extrabold text-sm text-slate-800 font-cairo">منصة تعز</span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-cairo mb-1">أقسام المنصة</span>
                {[
                  { to: "/", label: "الأخبار الرئيسية", info: "تغطية شاملة ومباشرة للأحداث" },
                  { to: "/watch", label: "البث التلفزيوني والمرئي", info: "شاهد البث الحي والتقارير المرئية" },
                  { to: "/leader", label: "مستودع محاضرات القائد", info: "كلمات ومحاضرات السيد القائد" },
                  { to: "/quran", label: "المصحف الشريف وتتبع التلاوة", info: "هدي القرآن وقراءات تفاعلية" },
                  { to: "/events", label: "الفعاليات والمناسبات الوطنية", info: "أنشطة وفعاليات ومناسبات تعز" },
                  { to: "/admin", label: "لوحة تحكم حسابي", info: "إدارة الحساب والمفضلات والإعدادات" }
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.to}
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex flex-col p-2.5 bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-xl group transition-all"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#D32027] transition-colors font-cairo">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-bold leading-relaxed font-cairo">
                      {item.info}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Separator */}
              <div className="w-full h-px bg-slate-100 my-5" />

              {/* Quick Services Grid */}
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-cairo mb-1">خدمات سريعة</span>
                <div className="grid grid-cols-3 gap-2">
                  <Link 
                    to="/prayer-times" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-emerald-50/50 border border-emerald-100/60 rounded-xl gap-1 hover:scale-102 transition-transform"
                  >
                    <span className="text-[10px] font-bold text-emerald-800 font-cairo text-center">مواقيت الصلاة</span>
                  </Link>
                  <Link 
                    to="/weather" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-sky-50/50 border border-sky-100/60 rounded-xl gap-1 hover:scale-102 transition-transform"
                  >
                    <span className="text-[10px] font-bold text-sky-800 font-cairo text-center">الطقس اليوم</span>
                  </Link>
                  <Link 
                    to="/calendar" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-amber-50/50 border border-amber-100/60 rounded-xl gap-1 hover:scale-102 transition-transform"
                  >
                    <span className="text-[10px] font-bold text-amber-800 font-cairo text-center">التقويم الهجري</span>
                  </Link>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-auto border-t border-slate-100 pt-4 text-center flex flex-col gap-1 select-none">
                <p className="text-[9px] font-bold text-slate-400 font-cairo">
                  جميع الحقوق محفوظة © منصة تعز الإعلامية 1448 هـ
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
