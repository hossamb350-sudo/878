import { Outlet, NavLink, useLocation } from "react-router-dom";
import { HeaderWidgets } from "./HeaderWidgets";
import { Newspaper, Tv, BookOpen, Calendar as CalendarIcon, User, LogIn, AlertTriangle, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { UrgentNews } from "../types";
import { motion, AnimatePresence } from "motion/react";

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
  const [urgentNews, setUrgentNews] = useState<UrgentNews | null>(null);
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
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
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
    let timerId: any = null;

    const unsubPromise = SyncService.syncCollection<UrgentNews>("urgentNews", (dataList) => {
      if (!active) return;
      if (timerId) clearTimeout(timerId);

      const latest = dataList[0];
      if (latest) {
        const now = Date.now();
        if (latest.expiresAt > now) {
          setUrgentNews(latest);
          
          // Only play sound and notify if the news is extremely fresh (e.g. added in the last 15 seconds)
          if (latest.createdAt && now - latest.createdAt < 15000) {
            playAlertSound();
          }

          const timeRemaining = latest.expiresAt - now;
          timerId = setTimeout(() => {
            setUrgentNews(null);
          }, timeRemaining);
        } else {
          setUrgentNews(null);
        }
      } else {
        setUrgentNews(null);
      }
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 1 });

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  return (
    <AnimatePresence>
       {urgentNews && (
         <motion.div 
           initial={{ y: -50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -50, opacity: 0 }}
           className="bg-status-error text-white shadow-md relative z-50 overflow-hidden"
         >
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-white opacity-40 animate-pulse"></div>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between min-w-0 gap-2">
               <div className="flex items-center gap-3 w-full min-w-0">
                  <div className="bg-white/20 p-1.5 rounded-lg shrink-0 shadow-inner">
                     <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight w-full text-right truncate whitespace-normal line-clamp-2">
                    <span className="font-black text-xs sm:text-sm bg-white text-status-error px-2 py-0.5 rounded-md ml-2 hidden sm:inline-block">عاجل</span>
                    {urgentNews.text}
                  </h3>
               </div>
               <button onClick={() => setUrgentNews(null)} className="p-1 hover:bg-white/20 rounded-full shrink-0 mr-2 transition">
                 <X className="w-5 h-5" />
               </button>
            </div>
         </motion.div>
       )}
    </AnimatePresence>
  );
}

export function Layout() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const location = useLocation();
  const isArticlesPage = location.pathname.startsWith("/articles");

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
      <div className="w-full bg-surface-main">
          <HeaderWidgets />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-20 min-w-0 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Navigation for All Devices */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-slate-100/80 px-2 flex justify-center items-center z-40 pb-safe transition-transform duration-300 h-[72px] sm:h-[76px] ${isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="grid grid-cols-6 w-full max-w-2xl mx-auto px-1">
          {[
            { to: "/", icon: Newspaper, label: "الأخبار" },
            { to: "/watch", icon: Tv, label: "شاهد" },
            { to: "/leader", icon: User, label: "القائد" },
            { to: "/quran", icon: BookOpen, label: "الهدى" },
            { to: "/events", icon: CalendarIcon, label: "تقويم" },
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

