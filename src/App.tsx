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
      const calculatedProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(calculatedProgress);
      if (elapsed >= duration) {
        clearInterval(interval);
        onEnter();
      }
    }, 16); // smooth update
    return () => clearInterval(interval);
  }, [onEnter]);

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 z-[100] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      
      {/* Center: Clean Platform Logo ONLY */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center p-4">
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

      {/* Bottom: Sleek minimal progress bar (Indicator for 5 seconds) */}
      <div className="absolute bottom-20 left-0 right-0 max-w-xs mx-auto px-4">
        <div className="w-full bg-stone-100 rounded-full h-1 overflow-hidden">
          <div 
            className="bg-emerald-600 h-1/2 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%`, height: "100%" }}
          />
        </div>
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
