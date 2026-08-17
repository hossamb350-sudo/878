import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { HeaderWidgets } from "./HeaderWidgets";
import { Newspaper, Tv, BookOpen, Calendar as CalendarIcon, User, LogIn, AlertTriangle, X, Play, Pause, Volume2, ArrowLeft, Radio } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { UrgentNews } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { routes } from "../utils/routes";
import { useQuranAudio } from "../context/QuranAudioContext";
import { useLiveStream } from "../context/LiveStreamContext";
import { VolumeX } from "lucide-react";
import { getEmbedUrl } from "../utils/embed";

function NotificationCenter() {
  return null;
}

// Custom dual-color icons matching the exact image design
function NewsNavIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2.5" className="text-slate-700" />
      <line x1="7" y1="8" x2="17" y2="8" className="text-[#F26522]" strokeWidth="2.5" />
      <line x1="12" y1="12" x2="17" y2="12" className="text-slate-700" />
      <line x1="12" y1="15" x2="17" y2="15" className="text-slate-700" />
      <rect x="7" y="11" width="3.5" height="4" rx="0.5" className="text-slate-700" strokeWidth="1.5" />
    </svg>
  );
}

function MediaNavIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l3.5 4M16 3l-3.5 4" className="text-slate-700" />
      <rect x="2" y="7" width="20" height="14" rx="3.5" className="text-slate-700" />
      <polygon points="10,11 15,14 10,17" className="text-[#F26522]" fill="#F26522" stroke="none" />
    </svg>
  );
}

function LeaderNavIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" className="text-slate-700" />
      <path d="M5 21v-1.5a6 6 0 0 1 12 0V21" className="text-slate-700" />
      <line x1="9.5" y1="16.5" x2="14.5" y2="16.5" className="text-[#F26522]" strokeWidth="2.5" />
      <line x1="12" y1="16.5" x2="12" y2="20" className="text-[#F26522]" strokeWidth="2" />
    </svg>
  );
}

function QuranNavIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5.5C4.5 4 7.5 4 12 6.5C16.5 4 19.5 4 22 5.5V18.5C19.5 17 16.5 17 12 19.5C7.5 17 4.5 17 2 18.5V5.5Z" className="text-slate-700" />
      <path d="M12 6.5V19.5" className="text-[#F26522]" strokeWidth="2.5" />
    </svg>
  );
}

function EventsNavIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="15" rx="3" className="text-slate-700" />
      <line x1="8" y1="3" x2="8" y2="7" className="text-[#F26522]" strokeWidth="2.5" />
      <line x1="16" y1="3" x2="16" y2="7" className="text-[#F26522]" strokeWidth="2.5" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" className="text-slate-700" />
    </svg>
  );
}

function AccountNavIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" className="text-slate-700" />
      <path d="M5 21v-1.5a6 6 0 0 1 12 0V21" className="text-slate-700" />
      <path d="M7.5 17.5l3.5 1.5" className="text-[#F26522]" strokeWidth="2.5" />
    </svg>
  );
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

  const {
    activeStream,
    isPlaying: isLiveStreamPlaying,
    isMuted,
    volume,
    isPlayingInHero,
    stopStream,
    togglePlay: toggleLiveStreamPlay,
    setVolume,
    toggleMute
  } = useLiveStream();

  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const mainScroll = mainRef.current ? mainRef.current.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollPos = Math.max(mainScroll, windowScroll);
      const scrolled = scrollPos > 120;
      setIsScrolled(scrolled);
    };

    const mainEl = mainRef.current;
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mainEl) mainEl.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const isWatchPage = location.pathname === "/watch";
  const shouldShowTopBar = !!(activeStream && (!isWatchPage || isScrolled || !isPlayingInHero));

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
    <div className="flex flex-col min-h-screen bg-white text-text-primary transition-colors" dir="rtl">
      <UrgentNewsBanner />

      {/* Platform Logo & Widgets Area */}
      <div className="w-full bg-white relative z-30 border-b border-slate-200/40">
          <HeaderWidgets />
          {/* Visual Separator: thin crisp border with no extra vertical spacing */}
          <div className="w-full" />
          
          {/* Global Ultra-Tech Luxury Floating Audio/Video Capsule for Live Streams */}
          <AnimatePresence mode="wait">
            {shouldShowTopBar && activeStream && (
              <motion.div
                key={isScrolled ? "floating-topbar-scrolled" : "floating-topbar-top"}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={
                  isScrolled
                    ? "fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md bg-slate-950/95 text-white backdrop-blur-2xl px-3.5 py-2.5 rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,0.65),0_0_25px_rgba(245,158,11,0.2)] border border-amber-500/35 flex items-center justify-between z-[60] gap-2.5 ring-1 ring-amber-500/20"
                    : "my-2 mx-auto w-[calc(100%-1.25rem)] max-w-md bg-slate-950/95 text-white backdrop-blur-2xl px-3.5 py-2.5 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.45),0_0_20px_rgba(245,158,11,0.18)] border border-amber-500/30 flex items-center justify-between z-40 gap-2.5 ring-1 ring-amber-500/15"
                }
              >
                {/* 1. Channel Info & Live Equalizer */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 text-right select-none">
                  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/60 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    {isLiveStreamPlaying ? (
                      <div className="flex items-end justify-center gap-[2px] h-3.5 w-3.5">
                        <span className="w-[2.5px] bg-amber-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                        <span className="w-[2.5px] bg-yellow-300 rounded-full animate-[bounce_1s_infinite_300ms] h-2/3" />
                        <span className="w-[2.5px] bg-amber-400 rounded-full animate-[bounce_1s_infinite_200ms] h-5/6" />
                      </div>
                    ) : (
                      activeStream.type === "radio" ? (
                        <Radio className="w-4 h-4 text-amber-400 opacity-90" />
                      ) : (
                        <Tv className="w-4 h-4 text-amber-400 opacity-90" />
                      )
                    )}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black font-cairo leading-tight bg-gradient-to-r from-amber-300 via-amber-100 to-yellow-400 bg-clip-text text-transparent truncate">
                      {activeStream.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <div className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
                      </div>
                      <span className="text-[9.5px] font-extrabold font-cairo text-amber-300/90 leading-none truncate">
                        {isLiveStreamPlaying ? "بث مباشر الآن" : "متوقف مؤقتاً"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Controls & Custom Slider */}
                <div className="flex items-center gap-2 shrink-0 select-none">
                  {/* Volume Slider Pill */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
                    <button 
                      onClick={toggleMute} 
                      className={`p-0.5 rounded-lg transition-all active:scale-90 ${
                        isMuted || volume === 0 
                          ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" 
                          : "text-amber-400 hover:text-amber-300"
                      }`}
                      title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="luxury-slider w-10 xs:w-14 sm:w-16"
                    />
                  </div>

                  {/* Play / Pause Metallic Circle */}
                  <button 
                    onClick={toggleLiveStreamPlay}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.45)] transition-all active:scale-90 hover:scale-105"
                    title={isLiveStreamPlaying ? "إيقاف مؤقت" : "تشغيل"}
                  >
                    {isLiveStreamPlaying ? <Pause className="w-4 h-4 fill-slate-950 stroke-none" /> : <Play className="w-4 h-4 fill-slate-950 stroke-none translate-x-[-0.5px]" />}
                  </button>

                  <div className="w-px h-5 bg-slate-800/80" />

                  {/* Close Button */}
                  <button 
                    onClick={stopStream} 
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors active:scale-90" 
                    title="إغلاق البث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background TV Stream Player ONLY for other pages (never on Watch page to prevent duplicate audio) */}
          {!isWatchPage && shouldShowTopBar && isLiveStreamPlaying && activeStream && activeStream.type !== "radio" && (
            <iframe
              src={getEmbedUrl(activeStream.streamUrl || activeStream.url, true, isMuted)}
              className="w-1 h-1 opacity-0 pointer-events-none fixed -top-[9999px] left-0 z-[-100]"
              allow="autoplay; encrypted-media"
              title="background-tv-stream"
            />
          )}
      </div>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto pb-16 min-w-0 w-full overflow-x-hidden">
        {children || <Outlet />}
      </main>

      {/* Global Mini Audio Player for background playback when not in Quran page */}
      <AnimatePresence>
        {location.pathname !== "/quran" && selectedSurah && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-[68px] sm:bottom-[72px] left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-sm bg-slate-950/95 text-white backdrop-blur-2xl px-3.5 py-2 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/30 flex items-center justify-between z-50 gap-2.5 ring-1 ring-emerald-500/15"
          >
            {/* Clickable Area to return to Quran page and open Surah */}
            <button
              onClick={() => navigate("/quran?view=quran")}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-right group active:scale-[0.98] transition"
              title="الذهاب للسورة وتتبع الآية"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-900/70 to-slate-900 flex items-center justify-center shrink-0 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover:border-emerald-400 transition">
                {isPlaying ? (
                  <div className="flex items-end justify-center gap-[2px] h-3.5 w-3.5">
                    <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                    <span className="w-[2.5px] bg-teal-300 rounded-full animate-[bounce_1s_infinite_300ms] h-2/3" />
                    <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-5/6" />
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400 opacity-80" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black font-cairo leading-none bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-200 group-hover:to-teal-200 transition flex items-center gap-1">
                  <span>سورة {selectedSurah.name}</span>
                  <ArrowLeft className="w-2.5 h-2.5 text-emerald-400 group-hover:translate-x-[-2px] transition-transform" />
                </span>
                <span className="text-[9.5px] text-slate-300 font-bold font-cairo mt-1 leading-none truncate">
                  {surahDetail ? `الآية ${toArabicNumerals(surahDetail.ayahs[currentAyahIndex]?.numberInSurah || 1)}` : "جاري تلاوة السورة..."}
                </span>
              </div>
            </button>

            {/* Play/Pause & Close Controls */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-90 hover:scale-105 transition-all"
                title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950 stroke-none" /> : <Play className="w-4 h-4 fill-slate-950 stroke-none translate-x-[-0.5px]" />}
              </button>

              <div className="w-px h-5 bg-slate-800" />

              <button
                onClick={closePlayer}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-90"
                title="إغلاق المشغل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation for All Devices */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_25px_rgba(0,0,0,0.06)] border-t border-slate-100 z-40 pb-safe transition-transform duration-300 h-[62px] sm:h-[66px] ${isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="grid grid-cols-6 w-full max-w-2xl mx-auto h-full px-0.5 relative">
          {[
            { to: routes.home(), icon: NewsNavIcon, label: "الرئيسية" },
            { to: routes.watch(), icon: MediaNavIcon, label: "ميديا" },
            { to: routes.leader(), icon: LeaderNavIcon, label: "السيد القائد" },
            { to: routes.quran(), icon: QuranNavIcon, label: "هدي القرآن" },
            { to: routes.events(), icon: EventsNavIcon, label: "أنشطة ومناسبات" },
            { to: routes.admin(), icon: AccountNavIcon, label: "حسابي" }
          ].map((item, index) => {
            const isItemActive = item.to === "/"
              ? (location.pathname === "/" || location.pathname.startsWith("/articles"))
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center w-full relative h-full px-0.5 ${
                  index < 5 ? 'border-l border-slate-200/50' : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center w-full py-1 transition-all duration-300">
                  <div className="h-5 sm:h-5.5 flex items-center justify-center mb-0.5 shrink-0">
                    <item.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] font-bold text-center leading-tight tracking-tight px-0.5 w-full font-cairo text-slate-800 line-clamp-2">
                    {item.label}
                  </span>
                  <div className="mt-1 flex items-center justify-center h-1.5">
                    {isItemActive ? (
                      <div className="w-6 h-[3px] bg-[#F26522] rounded-full" />
                    ) : null}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

