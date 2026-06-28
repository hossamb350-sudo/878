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
const splashImg = "/splash.png";

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
    }, 600);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAction();
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#eef1f5] text-taiz-navy z-[100] flex flex-col items-center justify-center select-none font-sans overflow-hidden">
      
      {/* Cinematic Background Atmosphere - Matching the Logo Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Soft radial glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial from-white via-white/40 to-transparent opacity-80" />
        
        {/* Subtle atmospheric vignettes */}
        <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-taiz-sky/10 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-taiz-royal/10 blur-[150px] rounded-full" />
        
        {/* Refined texture overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full px-6 min-h-[500px]">
        
        {/* Premium Logo Presentation with Shimmer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center"
        >
          {/* Animated Halos with Logo Colors */}
          <motion.div 
            className="absolute -inset-10 border border-taiz-sky/15 rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -inset-20 border border-taiz-royal/10 rounded-full"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* Logo Container with Shimmer Effect */}
          <div className="relative w-full h-full drop-shadow-[0_20px_50px_rgba(3,47,105,0.15)]">
            <div className="shimmer w-full h-full flex items-center justify-center rounded-[3rem] overflow-hidden">
              <motion.img 
                src={splashImg} 
                alt="Logo" 
                className="w-full h-full object-contain select-none p-4" 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Content Carousel - Positioned below logo with negative margin for tightness */}
        <div className="w-full -mt-6 sm:-mt-10 relative z-0">
          <SplashCarousel 
            activeIndex={carouselIndex} 
            onChangeIndex={setCarouselIndex} 
          />
        </div>
      </div>

      {/* Modern minimal footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 text-[10px] font-black tracking-[0.2em] text-taiz-navy/40 uppercase"
      >
        Taiz Media Platform • 2026
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
