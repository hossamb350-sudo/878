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

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 z-[100] flex flex-col items-center justify-between p-8 select-none font-sans overflow-hidden">
      
      {/* Subtle Arabic/Islamic Star Geometry Watermark (extremely faint on white back) */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <svg width="600" height="600" viewBox="0 0 100 100" className="text-emerald-800 animate-spin-slow">
          <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill="currentColor" />
          <polygon points="50,15 58,42 85,50 58,58 50,85 42,58 15,50 42,42" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="my-auto relative z-10 flex flex-col items-center justify-center text-center">
        {/* Beautiful Logo Container with soft elegant shadows */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
          <div className="absolute -inset-4 bg-emerald-500/5 rounded-full blur-3xl opacity-60" />
          
          <div className="relative w-full h-full bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-xl flex items-center justify-center transition-all duration-500">
            <img 
              src={imgSrc} 
              alt="شعار منصة تعز" 
              className="w-full h-full object-contain filter drop-shadow-sm select-none" 
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
      </div>

      {/* Touch-optimized modern Button titled: 'الدخول' */}
      <div className="relative z-10 w-full max-w-sm px-4 pb-12 mt-auto">
        <button 
          onClick={onEnter}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-black text-lg py-4.5 px-8 rounded-2xl shadow-lg hover:shadow-emerald-600/10 active:shadow-md transition-all duration-300 flex items-center justify-center gap-3 border border-emerald-500/10 cursor-pointer"
        >
          <span>الدخول</span>
          <ArrowLeft className="w-5 h-5 transition-transform" />
        </button>
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
