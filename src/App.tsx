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
  const [imgSrc, setImgSrc] = useState("https://i.postimg.cc/VNJWMsgN/Picsart-26-06-22-04-24-11-439.png");
  const [clicked, setClicked] = useState(false);

  const handleAction = () => {
    if (clicked) return;
    setClicked(true);
    playPremiumClick();
    setTimeout(() => {
      onEnter();
    }, 400); // Wait for the visual pop and chime to peak
  };

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 z-[100] flex flex-col items-center justify-between p-8 select-none font-sans overflow-hidden">
      
      {/* Decorative Rotating Geometric Background Star (Faint Islamic Art Motif) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <motion.svg 
          width="750" 
          height="750" 
          viewBox="0 0 100 100" 
          className="text-emerald-800"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill="currentColor" />
          <polygon points="50,15 58,42 85,50 58,58 50,85 42,58 15,50 42,42" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </motion.svg>
      </div>

      {/* Subtle modern warm ambient particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-500/20 blur-[1px] animate-pulse" />
        <div className="absolute bottom-[25%] right-[20%] w-3 h-3 rounded-full bg-amber-500/15 blur-[2px] animate-bounce" />
        <div className="absolute top-[60%] right-[10%] w-2 h-2 rounded-full bg-teal-500/25 blur-[1px] animate-pulse" />
      </div>



      {/* Center Showcase Area */}
      <div className="my-auto relative z-10 flex flex-col items-center justify-center text-center max-w-lg px-4">
        
        {/* Animated circular plate framing the logo */}
        <div className="relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center">
          
          {/* Pulsing Aura */}
          <motion.div 
            className="absolute -inset-6 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl opacity-70"
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Golden/Emerald Outer Rotating Ring line */}
          <motion.div 
            className="absolute -inset-1.5 rounded-full border-2 border-dashed border-emerald-600/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Thin static gold/amber accent ring */}
          <div className="absolute -inset-3 rounded-full border border-amber-500/10" />

          {/* Pure Premium Logo Plate Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.03 }}
            className="relative w-full h-full bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-2xl shadow-stone-200/60 flex items-center justify-center transition-all duration-300 pointer-events-auto"
          >
            <img 
              src={imgSrc} 
              alt="شعار منصة تعز" 
              className="w-full h-full object-contain filter drop-shadow-md select-none" 
              onError={() => {
                if (imgSrc === "https://i.postimg.cc/VNJWMsgN/Picsart-26-06-22-04-24-11-439.png") {
                  setImgSrc("/logo.png");
                } else if (imgSrc === "/logo.png") {
                  setImgSrc("/logo.svg");
                }
              }} 
            />
          </motion.div>
        </div>


      </div>

      {/* Button to click 'الدخول' with sound and beautiful motion feedback */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 w-full max-w-sm px-4 pb-8 sm:pb-12 mt-auto"
      >
        <button 
          onClick={handleAction}
          disabled={clicked}
          className={`w-full relative overflow-hidden font-black text-lg py-4 sm:py-4.5 px-8 rounded-2xl shadow-xl hover:shadow-emerald-600/10 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 border border-emerald-500/10 cursor-pointer ${
            clicked 
              ? "bg-stone-100 text-stone-400 scale-[0.98] border-transparent" 
              : "bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
          }`}
        >
          {clicked ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-ping" />
              جاري دخول المنصة...
            </span>
          ) : (
            <>
              <span>الدخول</span>
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
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
