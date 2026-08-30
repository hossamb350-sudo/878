import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell, Clock, Sparkles } from "lucide-react";
import { PrayerWeatherService } from "../services/PrayerWeatherService";
import { PrayerAlertBroadcast, PrayerTimesConfig } from "../types";

const PRAYER_IMAGES: Record<string, string> = {
  Fajr: "/Fajr.jpg",
  Sunrise: "/Sunrise.jpg",
  Dhuhr: "/Dhuhr.jpg",
  Asr: "/Asr.jpg",
  Maghrib: "/Maghrib.jpg",
  Isha: "/Isha.jpg",
};

const PRAYER_ARABIC_NAMES: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

export const PrayerAdhanPopup: React.FC = () => {
  const [activePopup, setActivePopup] = useState<{
    prayerKey: string;
    prayerName: string;
    message: string;
    id: string;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [prayerConfig, setPrayerConfig] = useState<PrayerTimesConfig | null>(null);
  const [lastTriggeredPrayer, setLastTriggeredPrayer] = useState<string>("");
  const lastTriggerTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialBroadcastProcessedRef = useRef<boolean>(false);

  // Subscribe to Prayer Times Config from Firestore
  useEffect(() => {
    const unsub = PrayerWeatherService.subscribePrayerTimesConfig((config) => {
      setPrayerConfig(config);
    });
    return () => unsub();
  }, []);

  // Open the popup for 10 seconds
  const triggerPopup = (prayerKey: string, prayerName: string, customMessage?: string) => {
    const message =
      customMessage ||
      `حان الآن موعد أذان ${prayerName} حسب التوقيت المحلي لمحافظة تعز وضواحيها.`;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setTimeLeft(10);
    setActivePopup({
      prayerKey,
      prayerName,
      message,
      id: `${prayerKey}-${Date.now()}`,
    });

    // Countdown interval for visual progress bar
    let remaining = 10;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    // Auto-dismiss after 10 seconds
    timerRef.current = setTimeout(() => {
      closePopup();
    }, 10000);
  };

  const closePopup = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActivePopup(null);
  };

  // 1. Listen for Firestore Admin Adhan Broadcasts
  useEffect(() => {
    const unsub = PrayerWeatherService.subscribeAdhanBroadcast((broadcast: PrayerAlertBroadcast | null) => {
      if (!broadcast || !broadcast.timestamp) return;

      // Avoid triggering immediately on old broadcasts (older than 40 seconds)
      const ageInSeconds = (Date.now() - broadcast.timestamp) / 1000;
      if (ageInSeconds > 40) {
        initialBroadcastProcessedRef.current = true;
        return;
      }

      if (!initialBroadcastProcessedRef.current) {
        initialBroadcastProcessedRef.current = true;
        // If broadcast happened in the last 10 seconds, trigger it
        if (ageInSeconds <= 10) {
          triggerPopup(broadcast.prayerKey, broadcast.prayerName, broadcast.message);
        }
        return;
      }

      triggerPopup(broadcast.prayerKey, broadcast.prayerName, broadcast.message);
    });

    return () => unsub();
  }, []);

  // 2. Listen for custom window event (e.g. for testing/preview)
  useEffect(() => {
    const handleCustomTrigger = (e: CustomEvent) => {
      const { prayerKey, prayerName, message } = e.detail || {};
      if (prayerKey && prayerName) {
        triggerPopup(prayerKey, prayerName, message);
      }
    };

    window.addEventListener("trigger_adhan_popup" as any, handleCustomTrigger as EventListener);
    return () => {
      window.removeEventListener("trigger_adhan_popup" as any, handleCustomTrigger as EventListener);
    };
  }, []);

  // 3. Automated check for matching prayer time every 10 seconds
  useEffect(() => {
    const checkPrayerTime = () => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, "0");
      const currentM = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentH}:${currentM}`;

      // Get active timings: from manual config or fallback API timings in localstorage
      let timings: Record<string, string> = {
        Fajr: "04:27",
        Dhuhr: "12:10",
        Asr: "15:30",
        Maghrib: "18:34",
        Isha: "20:04",
      };

      if (prayerConfig?.mode === "manual" && prayerConfig.timings) {
        timings = prayerConfig.timings;
      } else {
        try {
          const cached = localStorage.getItem("cached_detail_raw_timings");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.Fajr) timings = parsed;
          }
        } catch {}
      }

      // Check each prayer
      const prayerEntries: Array<[string, string]> = [
        ["Fajr", timings.Fajr],
        ["Dhuhr", timings.Dhuhr],
        ["Asr", timings.Asr],
        ["Maghrib", timings.Maghrib],
        ["Isha", timings.Isha],
      ];

      for (const [key, rawTime] of prayerEntries) {
        if (!rawTime) continue;
        const cleanTime = rawTime.split(" ")[0].substring(0, 5); // "HH:MM"
        
        if (cleanTime === currentTimeStr) {
          const triggerKey = `${key}-${now.toDateString()}-${cleanTime}`;
          const timeSinceLast = Date.now() - lastTriggerTimeRef.current;

          // Only trigger once per prayer minute
          if (lastTriggeredPrayer !== triggerKey && timeSinceLast > 65000) {
            setLastTriggeredPrayer(triggerKey);
            lastTriggerTimeRef.current = Date.now();
            const name = PRAYER_ARABIC_NAMES[key] || key;
            triggerPopup(key, name);
            break;
          }
        }
      }
    };

    const interval = setInterval(checkPrayerTime, 10000);
    checkPrayerTime(); // Initial check
    return () => clearInterval(interval);
  }, [prayerConfig, lastTriggeredPrayer]);

  if (!activePopup) return null;

  const imageSrc = PRAYER_IMAGES[activePopup.prayerKey] || "/Fajr.jpg";

  return (
    <AnimatePresence>
      <div 
        id="prayer-adhan-popup-container"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#0F291E] via-[#091B13] to-[#040E0A] text-white rounded-3xl shadow-2xl border-2 border-amber-500/40 overflow-hidden font-cairo"
        >
          {/* Islamic Geometric Motif Top Accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-md" />

          {/* Close Button */}
          <button
            id="close-adhan-popup-btn"
            onClick={closePopup}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
            title="إغلاق التنبيه"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 10-Second Auto-dismiss Countdown Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 shadow-xs"
            />
          </div>

          {/* Prayer Header Card with Picture */}
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={imageSrc}
              alt={activePopup.prayerName}
              className="w-full h-full object-cover brightness-90 transform scale-105"
            />
            {/* Dark & Islamic Green Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F291E] via-[#0F291E]/60 to-transparent" />

            {/* Prayer Badge on Image */}
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-lg">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-amber-400 text-xs font-bold tracking-wide block">
                  نداء الصلاة المبارك
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                  أذان صلاة {activePopup.prayerName}
                </h3>
              </div>
            </div>

            {/* Timer Badge */}
            <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>يختفي خلال {timeLeft} ث</span>
            </div>
          </div>

          {/* Popup Body Content */}
          <div className="p-5 pt-3 text-center space-y-4">
            {/* Islamic Quranic Bismillah / Sub-banner */}
            <div className="flex items-center justify-center gap-2 text-amber-300/90 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            {/* Main Required Announcement Text */}
            <div className="p-4 rounded-2xl bg-white/5 border border-amber-500/20 backdrop-blur-md shadow-inner">
              <p className="text-base sm:text-lg font-bold text-amber-100 leading-relaxed font-cairo">
                {activePopup.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                id="dismiss-adhan-popup-btn"
                onClick={closePopup}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 active:scale-98 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>تقبل الله طاعتكم (إغلاق)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
