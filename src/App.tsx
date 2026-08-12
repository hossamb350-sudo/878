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
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { CURRENT_APP_VERSION, isVersionOutdated } from "./config/version";
import { AppVersionConfig } from "./types";
import { AlertTriangle, Download } from "lucide-react";

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
  const [versionConfig, setVersionConfig] = useState<AppVersionConfig | null>(null);
  const [isOutdated, setIsOutdated] = useState(false);

  // Real-time Firestore check for app version settings
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "app_version_config"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppVersionConfig;
          setVersionConfig(data);
          if (data.isEnabled) {
            const outdated = isVersionOutdated(CURRENT_APP_VERSION, data.minRequiredVersion);
            setIsOutdated(outdated);
          } else {
            setIsOutdated(false);
          }
        }
      },
      (err) => {
        console.warn("Could not fetch app version config:", err);
      }
    );
    return () => unsub();
  }, []);

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

  // Check if we should block access (outdated app & not on admin panel)
  const isBlocked = isOutdated && !window.location.pathname.startsWith("/admin");

  if (isBlocked) {
    return (
      <div 
        className="fixed inset-0 z-[100000] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#060F21] via-[#0D1D3A] to-[#040914] text-white text-right font-cairo select-none"
        dir="rtl"
      >
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
          }}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] bg-[#112347]/60 border border-[#5CA9FF]/20 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center relative overflow-hidden"
        >
          {/* Top glowing orb */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#5CA9FF]/10 blur-3xl pointer-events-none" />

          {/* Warning Icon Container with pulses */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#D9A441]/10 animate-ping" />
            <div className="absolute -inset-2 rounded-full bg-[#D9A441]/5 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D9A441] to-[#BF841F] flex items-center justify-center shadow-[0_8px_20px_rgba(217,164,65,0.3)]">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-white mb-3">
            تحديث إجباري جديد مطلوب!
          </h2>

          {/* Message */}
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-6 font-medium text-center">
            {versionConfig?.lockMessage || "يتوفر إصدار جديد من التطبيق بمميزات وتحسينات جديدة. يرجى التحديث لمتابعة الاستخدام."}
          </p>

          {/* Version Details Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#091428]/80 border border-[#5CA9FF]/10 mb-6 font-mono text-xs text-slate-300">
            <div className="text-center border-l border-slate-800">
              <span className="text-[10px] text-slate-500 block font-bold font-cairo mb-0.5">إصدارك الحالي</span>
              <span className="font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                v{CURRENT_APP_VERSION}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-500 block font-bold font-cairo mb-0.5">الإصدار المطلوب</span>
              <span className="font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[11px] border border-red-500/20">
                v{versionConfig?.minRequiredVersion}
              </span>
            </div>
          </div>

          {/* Download Action Button */}
          {versionConfig?.updateUrl ? (
            <a
              href={versionConfig.updateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#BF841F] text-white font-black text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-[0_8px_24px_rgba(191,132,31,0.25)] hover:brightness-110 active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              تحميل التحديث الآن (APK)
            </a>
          ) : (
            <div className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-xs font-bold text-red-400">
              يرجى التواصل مع إدارة المنصة لتوفير رابط التنزيل.
            </div>
          )}

          {/* Subtle footer */}
          <p className="text-[10px] text-slate-500 mt-5 font-medium">
            منصة تعز الإعلامية الثقافية المتكاملة © {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    );
  }

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
