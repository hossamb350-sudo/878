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

function Splash() {
  return (
    <div className="fixed inset-0 bg-blue-700 z-[100] flex flex-col items-center justify-center text-white">
       <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 overflow-hidden shadow-2xl p-2 animate-bounce">
          <img src="/logo.png" alt="منصة تعز" className="w-full h-full object-cover rounded-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
       </div>
       <h1 className="text-5xl font-black mb-3 tracking-tight drop-shadow-lg">منصة تعز</h1>
       <p className="text-blue-100 text-lg font-medium tracking-wide">منصة إخبارية ثقافية</p>
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
    const t1 = setTimeout(() => setFadeOut(true), 2500);
    const t2 = setTimeout(() => setShowSplash(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <BrowserRouter>
      {showSplash && (
        <div className={`transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'} fixed inset-0 z-[100]`}>
           <Splash />
        </div>
      )}
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
