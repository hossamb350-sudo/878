import { Outlet, NavLink } from "react-router-dom";
import { Newspaper, Tv, BookOpen, Calendar as CalendarIcon, User, LogIn, AlertTriangle, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { UrgentNews } from "../types";
import { motion, AnimatePresence } from "motion/react";

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
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <UrgentNewsBanner />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 min-w-0 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Navigation for All Devices */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 flex justify-center items-center z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center w-full max-w-[600px]">
          {[
            { to: "/", icon: Newspaper, label: "الأخبار" },
            { to: "/watch", icon: Tv, label: "شاهد" },
            { to: "/leader", icon: User, label: "القائد" },
            { to: "/quran", icon: BookOpen, label: "القرآن" },
            { to: "/events", icon: CalendarIcon, label: "الفعاليات" },
            { to: "/admin", icon: User, label: "حسابي" }
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 pt-3 pb-3 min-w-[3.5rem] sm:min-w-[4.5rem] transition-colors relative ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></div>}
                  <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-blue-100 dark:fill-blue-900/30' : ''}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

