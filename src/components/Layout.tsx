import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { HeaderWidgets } from "./HeaderWidgets";
import { Newspaper, Tv, BookOpen, Calendar as CalendarIcon, User, LogIn, AlertTriangle, X, Play, Pause, Volume2, ArrowLeft } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { UrgentNews } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useQuranAudio } from "../context/QuranAudioContext";

function NotificationCenter() {
  return null;
}

/*
function NotificationCenterDeprecated() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("read_notifications");
    if (saved) {
      try { setReadIds(JSON.parse(saved)); } catch(e) {}
    }

    let active = true;
    const unsubPromise = SyncService.syncCollection<AppNotification>("notifications", (data) => {
      if (!active) return;
      setNotifications(data.slice(0, 20));
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 20 });

    return () => {
      active = false;
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => !readIds.includes(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, readIds]);

  const toggle = () => {
    if (!isOpen) {
      const allIds = notifications.map(n => n.id);
      setReadIds(allIds);
      localStorage.setItem("read_notifications", JSON.stringify(allIds));
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative z-[60]">
      <button 
        onClick={toggle} 
        className="p-2.5 bg-surface-main hover:bg-surface-hover rounded-xl border border-border-light hover:scale-105 active:scale-95 transition-all group relative"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-taiz-sky animate-pulse' : 'text-text-secondary'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-status-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsOpen(false)}
               className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute left-0 top-full mt-3 w-[85vw] max-w-[340px] glass-panel rounded-2xl z-50 overflow-hidden rtl"
              dir="rtl"
            >
              <div className="p-5 border-b border-border-light flex justify-between items-center bg-surface-main/80">
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 bg-taiz-sky rounded-full animate-pulse shadow-glow"></div>
                   <h3 className="font-bold text-text-primary">جديد المنصة</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto scrollbar-hide py-2">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                     <Bell className="w-12 h-12 text-text-muted opacity-50" />
                     <p className="text-text-muted text-sm font-bold">لا يوجد تنبيهات حالياً</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="mx-3 my-2 p-4 card card-hover">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="font-bold text-sm text-text-primary leading-[1.4]">{n.title}</span>
                        <span className="text-[10px] font-bold text-text-secondary whitespace-nowrap bg-surface-main px-2 py-1 rounded-md">
                          {new Date(n.createdAt).toLocaleDateString("ar-SA", { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
*/

function UrgentNewsBanner() {
  const [urgentNewsList, setUrgentNewsList] = useState<UrgentNews[]>([]);
  const [tickerSpeed, setTickerSpeed] = useState(25);
  const [tickerTitle, setTickerTitle] = useState("خبر عاجل");
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const audioContextReft = useRef<AudioContext | null>(null);

  const playAlertSound = () => {
    try {
      if (!audioContextReft.current) {
        audioContextReft.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextReft.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio play failed", e);
    }
  };

  useEffect(() => {
    let active = true;

    // Sync active urgent news (filtering out manually cancelled items) using real-time listener
    const q = query(
      collection(db, "urgentNews"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubUrgent = onSnapshot(q, (snap) => {
      if (!active) return;
      const validItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UrgentNews))
        .filter(item => item.isActive !== false);
      
      setUrgentNewsList(validItems);
      
      // Notify for very fresh news
      if (validItems.length > 0) {
        const now = Date.now();
        const latest = validItems[0];
        if (latest.createdAt && now - latest.createdAt < 15000) {
          playAlertSound();
        }
      }
    }, (error) => {
      console.error("Error fetching urgent news:", error);
    });

    // Load speed settings
    const loadSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "urgentNews"));
        if (docSnap.exists()) {
          setTickerSpeed(docSnap.data().speed || 25);
          setTickerTitle(docSnap.data().title || "خبر عاجل");
        }
      } catch (e) {}
    };

    loadSettings();

    // Re-render periodically to handle expiration
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);

    return () => {
      active = false;
      unsubUrgent();
      clearInterval(interval);
    };
  }, []);

  if (!isVisible || urgentNewsList.length === 0) return null;

  // Normalize items for backward compatibility
  const normalizedList = urgentNewsList.map(item => ({
    ...item,
    staticExpiresAt: item.staticExpiresAt !== undefined ? item.staticExpiresAt : (item.expiresAt || 0),
    scrollingExpiresAt: item.scrollingExpiresAt !== undefined ? item.scrollingExpiresAt : (item.expiresAt || 0),
  }));

  // Find the static item: the newest active item that is meant to be static
  const staticItem = normalizedList.find(item => item.staticExpiresAt > currentTime);
  
  // The rest go to the scrolling marquee if they haven't expired for scrolling
  const scrollingItems = normalizedList.filter(item => 
    item.scrollingExpiresAt > currentTime && item.id !== staticItem?.id
  );

  // If there's nothing to show in the marquee and no static item, return null
  if (scrollingItems.length === 0 && !staticItem) return null;

  // Prepare marquee items
  const infoText = "منصة تعز الإعلامية | X.COM/Taizgio11 | t.me/taizgio | t.me/TaizOI | البث الإذاعي لإذاعة تعز على موجة 88.1 FM | خدمة الأخبار النصية عبر رسائل SMS: أرسل كلمة (تعز) في رسالة نصية إلى الرقم 5552 |";
  let baseSequence: any[] = [];
  const infoItem = { id: 'info-static-text', text: infoText, type: 'scrolling', createdAt: 0 };
  const sortedAsc = [...scrollingItems].sort((a, b) => a.createdAt - b.createdAt);
  baseSequence = [infoItem, ...sortedAsc];

  const displayItems = [...baseSequence, ...baseSequence, ...baseSequence, ...baseSequence];
  const baseChars = baseSequence.reduce((acc, item) => acc + (item.text?.length || 0), 0);
  const effectiveLength = baseChars + baseSequence.length * 20; // 20 chars equivalent for separator
  const totalLengthToAnimate = 2 * effectiveLength;
  const calculatedDuration = Math.max(5, (totalLengthToAnimate / 100) * tickerSpeed);

  return (
    <AnimatePresence>
      <motion.div 
        key="urgent-news-ticker-container"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative z-50 w-full flex flex-col select-none"
        dir="rtl"
      >
        {/* The Scrolling Marquee */}
        {baseSequence.length > 0 && (
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white shadow-2xl border-b-2 sm:border-b-4 border-red-900 overflow-hidden w-full">
            <div className="w-full flex flex-col relative pt-0.5 pb-0">
              <div className="flex items-center justify-between px-3 sm:px-5 z-20 shrink-0 font-cairo">
                <div className="flex items-center">
                  <span className="font-black text-sm sm:text-base text-amber-400 uppercase tracking-wider whitespace-nowrap drop-shadow-md">
                    {tickerTitle}
                  </span>
                </div>
                
                <button 
                  onClick={() => setIsVisible(false)} 
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                  title="إغلاق الشريط"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full overflow-hidden relative flex items-center group px-0 -mt-2 sm:-mt-2.5 mb-1" dir="ltr">
                <motion.div
                  className="flex items-center whitespace-nowrap min-w-max"
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: calculatedDuration,
                  }}
                >
                  {displayItems.map((newsItem, index) => (
                    <React.Fragment key={`${newsItem.id}-${index}`}>
                      <span className="font-bold text-sm sm:text-base text-white tracking-wide font-cairo whitespace-nowrap px-2 sm:px-3 drop-shadow-sm" dir="rtl">
                        {newsItem.text}
                      </span>
                      <div className="inline-flex items-center px-1.5 sm:px-2 shrink-0">
                        <img 
                          src="/tape.png" 
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute("src", "/logo3.png");
                          }}
                          alt="شعار منصة تعز" 
                          className="w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-lg mx-1" 
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* The Static Breaking News Bar */}
        {staticItem && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-900/95 backdrop-blur-md border-b border-red-500/20 py-1.5 px-3 sm:px-5 flex items-center shadow-inner"
          >
            <div className="flex items-center gap-3 w-full max-w-[2000px] mx-auto items-start">
              <span className="shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 bg-white text-red-700 font-black text-[10px] sm:text-xs rounded shadow-sm animate-pulse font-cairo">
                عاجل
              </span>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base font-cairo break-words leading-relaxed w-full">
                {staticItem.text}
              </p>
            </div>
            
            {/* If there's NO scrolling items, show the close button here */}
            {scrollingItems.length === 0 && (
              <button 
                onClick={() => setIsVisible(false)} 
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white shrink-0 mr-2"
                title="إغلاق الشريط"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isArticlesPage = location.pathname.startsWith("/articles");
  const { 
    selectedSurah, 
    surahDetail, 
    isPlaying, 
    togglePlay, 
    closePlayer, 
    currentAyahIndex,
    toArabicNumerals
  } = useQuranAudio();

  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleResize);
    document.addEventListener('focusout', () => setIsKeyboardVisible(false));
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleResize);
      document.removeEventListener('focusout', () => setIsKeyboardVisible(false));
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-main text-text-primary transition-colors" dir="rtl">
      <UrgentNewsBanner />

      {/* Platform Logo & Widgets Area */}
      <div className="w-full bg-surface-main relative z-30">
          <HeaderWidgets />
          {/* Visual Separator: line + subtle premium drop shadow */}
          <div className="w-full h-1.5 bg-gradient-to-b from-slate-100 to-transparent border-t border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.02)]" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-20 min-w-0 w-full overflow-x-hidden">
        {children || <Outlet />}
      </main>

      {/* Global Mini Audio Player for background playback when not in Quran page */}
      <AnimatePresence>
        {location.pathname !== "/quran" && selectedSurah && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-[84px] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm bg-slate-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-slate-800/80 dark:border-stone-800/80 flex items-center justify-between z-50 gap-3"
          >
            {/* Clickable Area to return to Quran page and open Surah */}
            <button
              onClick={() => navigate("/quran?view=quran")}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-right group active:scale-[0.98] transition"
              title="الذهاب للسورة وتتبع الآية"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-950/80 flex items-center justify-center shrink-0 border border-emerald-800/30 group-hover:bg-emerald-900 transition">
                <Volume2 className={`w-4 h-4 text-emerald-400 ${isPlaying ? "animate-pulse" : ""}`} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black font-cairo leading-none text-emerald-400 group-hover:text-emerald-300 transition flex items-center gap-1">
                  <span>سورة {selectedSurah.name}</span>
                  <ArrowLeft className="w-2.5 h-2.5 text-emerald-500/80 group-hover:translate-x-[-1px] transition-transform" />
                </span>
                <span className="text-[9px] text-slate-300 font-bold font-cairo mt-1 leading-none truncate">
                  {surahDetail ? `الآية ${toArabicNumerals(surahDetail.ayahs[currentAyahIndex]?.numberInSurah || 1)}` : "جاري تلاوة السورة..."}
                </span>
              </div>
            </button>

            {/* Play/Pause & Close Controls */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <button
                onClick={togglePlay}
                className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md active:scale-90 transition"
                title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white translate-x-[-0.5px]" />}
              </button>

              <div className="w-px h-5 bg-slate-700/60" />

              <button
                onClick={closePlayer}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition active:scale-90"
                title="إغلاق المشغل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation for All Devices */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-slate-100/80 px-2 flex justify-center items-center z-40 pb-safe transition-transform duration-300 h-[72px] sm:h-[76px] ${isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="grid grid-cols-6 w-full max-w-2xl mx-auto px-1">
          {[
            { to: "/", icon: Newspaper, label: "الأخبار" },
            { to: "/watch", icon: Tv, label: "شاهد" },
            { to: "/leader", icon: User, label: "السيد القائد" },
            { to: "/quran", icon: BookOpen, label: "هدي القرآن" },
            { to: "/events", icon: CalendarIcon, label: "أنشطة ومناسبات" },
            { to: "/admin", icon: User, label: "حسابي" }
          ].map((item) => {
            const isItemActive = item.to === "/"
              ? (location.pathname === "/" || location.pathname.startsWith("/articles"))
              : location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center w-full relative"
              >
                <div 
                  className={`flex flex-col items-center justify-center w-[90%] py-1.5 transition-all duration-300 relative ${
                    isItemActive 
                      ? "text-red-600 font-bold" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="h-6 w-full flex items-center justify-center mb-0.5 shrink-0 relative">
                    <item.icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all duration-300 ${isItemActive ? 'stroke-[2.5] text-red-600' : 'stroke-[2]'}`} />
                  </div>
                  <span className={`text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold text-center leading-tight tracking-tight px-0.5 w-full font-cairo ${isItemActive ? 'text-red-600' : ''}`}>
                    {item.label}
                  </span>
                  {isItemActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-red-600 rounded-t-full" />
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

