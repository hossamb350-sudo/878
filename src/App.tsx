/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { NewsDetail } from "./pages/NewsDetail";
import { Watch } from "./pages/Watch";
import { Leader } from "./pages/Leader";
import { LeaderItem } from "./pages/LeaderItem";
import { WatchItem } from "./pages/WatchItem";
import { Quran } from "./pages/Quran";
import { Events } from "./pages/Events";
import { Admin } from "./pages/Admin";
import { Search } from "./pages/Search";
import { AnimatePresence } from "motion/react";
import { Sparkles, Info, ArrowLeft } from "lucide-react";

function Splash({ onEnter }: { onEnter: () => void }) {
  const [imgSrc, setImgSrc] = useState("https://i.postimg.cc/VNJWMsgN/Picsart-26-06-22-04-24-11-439.png");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000; // Exact 5 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(calculatedProgress);
      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // When progress reaches 100%, let the user enter automatically
  useEffect(() => {
    if (progress >= 100) {
      const enterTimeout = setTimeout(() => {
        onEnter();
      }, 500);
      return () => clearTimeout(enterTimeout);
    }
  }, [progress, onEnter]);

  const isReady = progress >= 100;

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 z-[100] flex flex-col items-center justify-between p-6 md:p-12 overflow-y-auto select-none font-sans">
      
      {/* Subtle Arabic Geometric Watermark Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <svg width="600" height="600" viewBox="0 0 100 100" className="text-emerald-800">
          <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill="currentColor" />
          <polygon points="50,15 58,42 85,50 58,58 50,85 42,58 15,50 42,42" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Top section: platform notice info badge */}
      <div className="relative z-10 w-full max-w-md bg-stone-50 border border-stone-200/70 rounded-2xl p-4 text-center shadow-sm">
        <div className="flex items-start gap-2.5 text-right font-sans" dir="rtl">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-emerald-800">تنويه إعدادات الشعار:</h4>
            <p className="text-[11px] text-stone-500 leading-relaxed font-bold">
              لوضع شعارك المخصص في هذه الواجهة وفي المنصة بالكامل، يرجى رفع ملف الشعار باسم <code className="bg-stone-200 px-1 py-0.5 rounded text-red-600 font-mono">logo.png</code> ووضعه داخل مجلد <code className="bg-stone-200 px-1 py-0.5 rounded text-emerald-800 font-mono font-bold">/public</code> في ملفات المنصة. في حال عدم رفعه سيظهر الشعار التتعلق بالرابط المحدد أدناه.
            </p>
          </div>
        </div>
      </div>

      {/* Center: Brand Identity Showcase */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-8">
        <div className="relative group mb-6">
          {/* Subtle logo pulse glow aura */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition" />
          
          <div className="w-48 h-48 md:w-56 md:h-56 bg-stone-50 rounded-full border border-stone-150 p-6 shadow-md transition-transform duration-500 hover:scale-105 flex items-center justify-center overflow-hidden">
            <img 
              src={imgSrc} 
              alt="شعار منصة تعز" 
              className="w-full h-full object-contain" 
              onError={() => {
                if (imgSrc === "https://i.postimg.cc/VNJWMsgN/Picsart-26-06-22-04-24-11-439.png") {
                  setImgSrc("/logo.png");
                } else if (imgSrc === "/logo.png") {
                  setImgSrc("/logo.svg");
                }
              }} 
            />
          </div>
        </div>

        <span className="text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full border border-emerald-500/10 shadow-sm mb-4 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          المنصة القرآنية الشاملة لمعرض تعز
        </span>

        <h1 className="text-3xl md:text-4.5xl font-black text-gray-900 mb-2 leading-tight tracking-tight drop-shadow-sm font-sans">
          منصة تعز التعليمية والثقافية
        </h1>
        
        <p className="text-sm text-stone-500 font-medium max-w-sm leading-relaxed">
          الدليل المتكامل للدروس والخطابات المسموعة والمرئية والبث المباشر
        </p>
      </div>

      {/* Bottom section: Progress indicator and Enter CTA */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4 mt-auto">
        
        {/* Progress track */}
        <div className="w-full bg-stone-150 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-600 to-teal-500 h-1.5 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Enter CTA Button */}
        <button 
          onClick={isReady ? onEnter : undefined}
          disabled={!isReady}
          className={`w-full font-black py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group border border-emerald-500/10 ${
            isReady 
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white cursor-pointer hover:scale-[1.02]" 
              : "bg-stone-150 text-stone-400 cursor-not-allowed"
          }`}
        >
          {isReady ? (
            <>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300" />
              <span>الدخول إلى المنصة الميدانية</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </>
          ) : (
            <span>جاري تهيئة المنصة... ({Math.max(1, Math.ceil(5 - (progress / 20)))} ثواني)</span>
          )}
        </button>

        <p className="text-[10px] text-stone-400 font-bold pb-2 text-center" dir="rtl">
          نهدف إلى التيسير والمتابعة والتقييم للثقافة القرآنية
        </p>
      </div>

    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="watch" element={<Watch />} />
          <Route path="watch/:id" element={<WatchItem />} />
          <Route path="leader" element={<Leader />} />
          <Route path="leader/:id" element={<LeaderItem />} />
          <Route path="quran" element={<Quran />} />
          <Route path="events" element={<Events />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if session storage indicates we already viewed splash in this session
    const alreadySeen = sessionStorage.getItem("quran_splash_seen");
    if (alreadySeen === "true") {
      setShowSplash(false);
    }
  }, []);

  const handleEnter = () => {
    setFadeOut(true);
    sessionStorage.setItem("quran_splash_seen", "true");
    setTimeout(() => {
      setShowSplash(false);
    }, 500);
  };

  return (
    <BrowserRouter>
      {showSplash && (
        <div className={`transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'} fixed inset-0 z-[100]`}>
           <Splash onEnter={handleEnter} />
        </div>
      )}
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
