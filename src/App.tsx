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
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { SplashCarousel } from "./components/SplashCarousel";

import { NavigationController } from "./components/NavigationController";
const splashImg = "/Resources/splash.png";

// Synthetic chime click sound generator via Web Audio API 
const playPremiumClick = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth chime sound
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard tuning A4
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // Sweeps upwards
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); // decay smoothly
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn("Audio feedback blocked or not supported yet:", err);
  }
};

function Splash({ onEnter }: { onEnter: () => void }) {
  const [clicked, setClicked] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleAction = () => {
    if (clicked) return;
    setClicked(true);
    playPremiumClick();
    setTimeout(() => {
      onEnter();
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 z-[100] flex flex-col items-center justify-between py-10 px-6 sm:p-12 select-none font-sans overflow-y-auto overflow-x-hidden leading-relaxed">
      
      {/* 1. LUXURY GEOMETRIC ISLAMIC BACKGROUND VECTORS (Matching the design image) */}
      
      {/* Decorative Rotating Geometric Background Star (Faint Islamic Art Motif) */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <motion.svg 
          width="750" 
          height="750" 
          viewBox="0 0 100 100" 
          className="text-[#d49a37]"
          animate={{ rotate: 360 }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
        >
          <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill="currentColor" />
          <polygon points="50,15 58,42 85,50 58,58 50,85 42,58 15,50 42,42" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </motion.svg>
      </div>

      {/* Top-Left Dots Grid */}
      <svg viewBox="0 0 100 100" className="absolute top-[4%] left-[4%] w-20 h-20 sm:w-24 sm:h-24 text-[#d49a37]/35 opacity-70 pointer-events-none z-0">
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`tl-${r}-${c}`} cx={10 + c * 16} cy={10 + r * 16} r="1.5" fill="currentColor" />
          ))
        )}
      </svg>

      {/* Bottom-Right Dots Grid */}
      <svg viewBox="0 0 100 100" className="absolute bottom-[4%] right-[4%] w-24 h-24 sm:w-32 sm:h-32 text-[#d49a37]/25 opacity-75 pointer-events-none z-0">
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 8 }).map((_, c) => (
            <circle key={`br-${r}-${c}`} cx={10 + c * 12} cy={10 + r * 12} r="1.2" fill="currentColor" />
          ))
        )}
      </svg>

      {/* Elegant concentric gold rings */}
      <div className="absolute top-[8%] right-[-5%] w-36 h-36 rounded-full border border-[#d49a37]/10 pointer-events-none z-0 flex items-center justify-center">
        <div className="w-28 h-28 rounded-full border border-dashed border-[#d49a37]/8" />
      </div>

      <div className="absolute bottom-[18%] left-[-4%] w-24 h-24 rounded-full border border-[#d49a37]/12 pointer-events-none z-0" />

      {/* Subtle glowing warm amber dust */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[28%] right-[15%] w-2 h-2 rounded-full bg-[#d49a37]/30 blur-[1px] animate-pulse" />
        <div className="absolute bottom-[38%] left-[10%] w-1.5 h-1.5 rounded-full bg-[#d49a37]/20 blur-[1.5px] animate-pulse" />
      </div>

      {/* 2. PLATFORM LOGO PLATE CARD (Matches Center of Graphic Design) */}
      <div className="my-auto relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full px-2 sm:px-4">
        
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center mb-4">
          
          {/* Pulsing Aura */}
          <motion.div 
            className="absolute -inset-6 bg-gradient-to-r from-[#d49a37]/5 to-[#b37f2c]/5 rounded-full blur-3xl opacity-60"
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Golden Outer Rotating Ring line */}
          <motion.div 
            className="absolute -inset-2.5 rounded-full border border-dashed border-[#d49a37]/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          />

          {/* Static outer accent ring */}
          <div className="absolute -inset-4 rounded-full border border-[#d49a37]/5" />

          {/* Natural Centered Logo Container without borders or padding */}
          <motion.div 
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative w-full h-full flex items-center justify-center pointer-events-auto"
          >
            <img 
              src={splashImg} 
              alt="شعار شاشة البداية" 
              className="w-full h-full object-contain filter drop-shadow-md select-none" 
            />
          </motion.div>
        </div>

        {/* 3. FEATURES SLIDING CAROUSEL (Implementing Slide cards and dots from Graphic Design) */}
        <div className="w-full mt-6 mb-8 transform">
          <SplashCarousel 
            activeIndex={carouselIndex} 
            onChangeIndex={setCarouselIndex} 
          />
        </div>
      </div>

      {/* 4. PREMIUM ENTRY BUTTONS (Strictly implements the gold flow in mock graphic) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 w-full max-w-sm px-4 pb-8 mt-auto"
      >
        {/* GOLD BUTTON: الدخول */}
        <button 
          onClick={handleAction}
          disabled={clicked}
          className={`w-full relative overflow-hidden font-black text-base sm:text-lg py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 border cursor-pointer ${
            clicked 
              ? "bg-stone-50 text-stone-300 scale-[0.98] border-stone-100" 
              : "bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white hover:from-[#e3ab4a] hover:to-[#c48f33] border-[#d49e3c]/30 shadow-amber-600/10"
          }`}
        >
          {clicked ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-300 animate-ping" />
              جاري الدخول...
            </span>
          ) : (
            <>
              <span>الدخول</span>
              <ArrowLeft className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1" />
            </>
          )}
        </button>
      </motion.div>

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
    }, 450); // Match transit delay
  };

  return (
    <BrowserRouter>
      <NavigationController />
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.08,
              filter: "blur(8px)",
              transition: { duration: 0.65, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-[100]"
          >
            <Splash onEnter={handleEnter} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
