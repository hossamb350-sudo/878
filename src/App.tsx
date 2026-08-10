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
import { WeatherDetail } from "./pages/WeatherDetail";
import { PrayerTimesDetail } from "./pages/PrayerTimesDetail";
import CalendarDetail from "./pages/CalendarDetail";
import { AnimatePresence, motion } from "motion/react";
import { NavigationController } from "./components/NavigationController";
import { SplashScreen } from "./components/SplashScreen";
import { QuranAudioProvider } from "./context/QuranAudioContext";
import { LiveStreamProvider } from "./context/LiveStreamContext";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@southdevs/capacitor-google-auth";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
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
        <Route path="weather" element={<WeatherDetail />} />
        <Route path="prayer-times" element={<PrayerTimesDetail />} />
        <Route path="calendar" element={<CalendarDetail />} />
        <Route path="calendar/:month/:year" element={<CalendarDetail />} />
        <Route path="admin" element={<Admin />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        GoogleAuth.initialize({
          clientId: '565624301516-17egbf55cbcp1vsdhd3mh024n2m5bqtp.apps.googleusercontent.com',
          scopes: ["profile", "email"],
          grantOfflineAccess: true,
        });
      } catch (e) {
        console.warn("GoogleAuth init error:", e);
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <LiveStreamProvider>
        <QuranAudioProvider>
          <NavigationController />
          <div className="relative min-h-screen">
            <Layout>
              <AnimatedRoutes />
            </Layout>
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
        </QuranAudioProvider>
      </LiveStreamProvider>
    </BrowserRouter>
  );
}
