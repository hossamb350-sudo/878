/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { NewsDetail } from "./pages/NewsDetail";
import { Watch } from "./pages/Watch";
import { Leader } from "./pages/Leader";
import { LeaderItem } from "./pages/LeaderItem";
import { WatchItem } from "./pages/WatchItem";
import { Quran } from "./pages/Quran";
import { Events } from "./pages/Events";
import { Articles } from "./pages/Articles";
import { ArticleDetail } from "./pages/ArticleDetail";
import { Admin } from "./pages/Admin";
import { ActivityDetail } from "./pages/ActivityDetail";
import { Search } from "./pages/Search";
import { AnimatePresence, motion } from "motion/react";
import { NavigationController } from "./components/NavigationController";
import { SplashScreen } from "./components/SplashScreen";

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
          <Route path="articles" element={<Articles />} />
          <Route path="articles/:id" element={<ArticleDetail />} />
          <Route path="watch" element={<Watch />} />
          <Route path="watch/:id" element={<WatchItem />} />
          <Route path="leader" element={<Leader />} />
          <Route path="leader/:id" element={<LeaderItem />} />
          <Route path="quran" element={<Quran />} />
          <Route path="events" element={<Events />} />
          <Route path="events/activity/:id" element={<ActivityDetail />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <BrowserRouter>
      <NavigationController />
      <div className="relative min-h-screen">
        <AnimatedRoutes />
        <AnimatePresence>
          {showSplash && (
            <motion.div
              key="splash-screen-container"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="fixed inset-0 z-[9999]"
            >
              <SplashScreen onComplete={() => setShowSplash(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
