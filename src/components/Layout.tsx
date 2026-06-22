import { Outlet, NavLink } from "react-router-dom";
import { Newspaper, Tv, BookOpen, Calendar as CalendarIcon, User, LogIn, AlertTriangle, X, Bell } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { UrgentNews, AppNotification } from "../types";
import { motion, AnimatePresence } from "motion/react";

function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("read_notifications");
    if (saved) {
      try { setReadIds(JSON.parse(saved)); } catch(e) {}
    }

    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(data);
    });
    return unsub;
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
    <div className="fixed bottom-24 left-4 z-[60]">
      <button 
        onClick={toggle} 
        className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white dark:border-gray-700 hover:scale-105 active:scale-95 transition-all group"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-blue-600 dark:text-blue-400 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-800">
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
               className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute left-0 bottom-full mb-3 w-[85vw] max-w-[340px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white dark:border-gray-800 z-50 overflow-hidden rtl"
              dir="rtl"
            >
              <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                   <h3 className="font-black text-gray-900 dark:text-white">جديد المنصة</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto scrollbar-hide py-2">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                     <Bell className="w-12 h-12 text-gray-200 dark:text-gray-800" />
                     <p className="text-gray-400 text-sm font-bold">لا يوجد تنبيهات حالياً</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="mx-3 my-2 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700/50 hover:border-blue-500 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{n.title}</span>
                        <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {new Date(n.createdAt).toLocaleDateString("ar-SA", { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{n.body}</p>
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
    // Check Notification API permission
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    const q = query(collection(db, "urgentNews"), orderBy("createdAt", "desc"), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UrgentNews;
        
        // Check if expired
        const now = Date.now();
        if (data.expiresAt > now) {
           setUrgentNews(data);
           playAlertSound();
           
           if ("Notification" in window && Notification.permission === "granted") {
             new Notification("خبر عاجل 🔴", { body: data.text });
           }
           
           // Automatically hide when expires 
           const timeRemaining = data.expiresAt - now;
           const timer = setTimeout(() => {
             setUrgentNews(null);
           }, timeRemaining);
           
           return () => clearTimeout(timer);
        } else {
           setUrgentNews(null);
        }
      } else {
        setUrgentNews(null);
      }
    }, (error) => {
      console.error("Firestore snapshot error:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence>
       {urgentNews && (
         <motion.div 
           initial={{ y: -50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -50, opacity: 0 }}
           className="bg-red-600 text-white shadow-md relative z-50 overflow-hidden"
         >
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-white opacity-40 animate-pulse"></div>
            <div className="max-w-[800px] mx-auto px-4 py-3 flex items-center justify-between min-w-0 gap-2">
               <div className="flex items-center gap-3 w-full min-w-0">
                  <div className="bg-white/20 p-1.5 rounded-sm shrink-0 shadow-inner">
                     <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base md:text-lg leading-tight w-full text-right truncate whitespace-normal line-clamp-2">
                    <span className="font-black text-xs sm:text-sm bg-white text-red-600 px-1.5 py-0.5 rounded-sm ml-2 hidden sm:inline-block">عاجل</span>
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <NotificationCenter />
      <UrgentNewsBanner />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-24 min-w-0 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Navigation for All Devices */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-1 flex justify-center items-center z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)] transition-transform duration-300 ${isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="grid grid-cols-6 w-full max-w-[600px] justify-items-center">
          {[
            { to: "/", icon: Newspaper, label: "الأخبار" },
            { to: "/watch", icon: Tv, label: "شاهد" },
            { to: "/leader", icon: User, label: "السيد القائد" },
            { to: "/quran", icon: BookOpen, label: "هدي القرآن" },
            { to: "/events", icon: CalendarIcon, label: "تقويم المناسبات" },
            { to: "/admin", icon: User, label: "حسابي" }
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-start pt-2 pb-2 w-full transition-colors relative min-h-[4.25rem] sm:min-h-[4.5rem] ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></div>}
                  <div className="h-6 w-full flex items-center justify-center mb-1 shrink-0">
                    <item.icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isActive ? 'fill-blue-100 dark:fill-blue-900/30' : ''}`} />
                  </div>
                  <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 px-0.5 tracking-tight w-full">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

