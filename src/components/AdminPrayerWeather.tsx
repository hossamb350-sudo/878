import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Cloud,
  Sun,
  Moon,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Save,
  RotateCcw,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Calendar,
  Layers,
  ThermometerSun,
} from "lucide-react";
import { PrayerWeatherService } from "../services/PrayerWeatherService";
import { PrayerTimesConfig, WeatherConfig } from "../types";

export const AdminPrayerWeather: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const [activeSection, setActiveSection] = useState<"prayer" | "weather" | "broadcast">("prayer");

  // --- Prayer Times State ---
  const [prayerMode, setPrayerMode] = useState<"auto" | "manual">("auto");
  const [prayerTimings, setPrayerTimings] = useState({
    Fajr: "04:27",
    Sunrise: "05:46",
    Dhuhr: "12:10",
    Asr: "15:30",
    Maghrib: "18:34",
    Isha: "20:04",
  });
  const [hijriOverride, setHijriOverride] = useState("");
  const [savingPrayer, setSavingPrayer] = useState(false);

  // --- Weather State ---
  const [weatherMode, setWeatherMode] = useState<"auto" | "manual">("auto");
  const [weatherData, setWeatherData] = useState<WeatherConfig>({
    mode: "auto",
    temp: 26,
    feelsLike: 27,
    conditionText: "صافٍ ومشمس",
    weatherCode: 0,
    humidity: 52,
    windSpeed: 3.8,
    tempMax: 30,
    tempMin: 20,
    isNight: false,
    rainProb: 0,
    updatedAt: Date.now(),
  });
  const [savingWeather, setSavingWeather] = useState(false);

  // --- Adhan Broadcast State ---
  const [broadcastPrayerKey, setBroadcastPrayerKey] = useState<"Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha">("Dhuhr");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [lastBroadcastInfo, setLastBroadcastInfo] = useState<string | null>(null);

  // --- Toast notifications ---
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load current settings from Firestore
  useEffect(() => {
    const unsubPrayer = PrayerWeatherService.subscribePrayerTimesConfig((config) => {
      if (config) {
        setPrayerMode(config.mode || "auto");
        if (config.timings) setPrayerTimings(config.timings);
        if (config.hijriDateOverride) setHijriOverride(config.hijriDateOverride);
      }
    });

    const unsubWeather = PrayerWeatherService.subscribeWeatherConfig((config) => {
      if (config) {
        setWeatherMode(config.mode || "auto");
        setWeatherData((prev) => ({
          ...prev,
          ...config,
        }));
      }
    });

    const unsubBroadcast = PrayerWeatherService.subscribeAdhanBroadcast((b) => {
      if (b) {
        const timeStr = new Date(b.timestamp).toLocaleTimeString("ar-YE");
        setLastBroadcastInfo(`تم إرسال تنبيه أذان (${b.prayerName}) في ${timeStr}`);
      }
    });

    return () => {
      unsubPrayer();
      unsubWeather();
      unsubBroadcast();
    };
  }, []);

  // Save Prayer Times
  const handleSavePrayer = async () => {
    setSavingPrayer(true);
    try {
      const success = await PrayerWeatherService.savePrayerTimesConfig({
        mode: prayerMode,
        timings: prayerTimings,
        hijriDateOverride: hijriOverride,
      });

      if (success) {
        showToast("تم حفظ إعدادات مواقيت الصلاة بنجاح ✅");
      } else {
        showToast("فشل حفظ إعدادات مواقيت الصلاة ❌", "error");
      }
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSavingPrayer(false);
    }
  };

  // Save Weather Config
  const handleSaveWeather = async () => {
    setSavingWeather(true);
    try {
      const success = await PrayerWeatherService.saveWeatherConfig({
        ...weatherData,
        mode: weatherMode,
      });

      if (success) {
        showToast("تم حفظ إعدادات وبيانات الطقس بنجاح ✅");
      } else {
        showToast("فشل حفظ إعدادات الطقس ❌", "error");
      }
    } catch {
      showToast("حدث خطأ أثناء حفظ الطقس", "error");
    } finally {
      setSavingWeather(false);
    }
  };

  // Trigger Adhan Broadcast for all users
  const handleSendAdhanBroadcast = async () => {
    const prayerNames: Record<string, string> = {
      Fajr: "الفجر",
      Sunrise: "الشروق",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء",
    };
    const pName = prayerNames[broadcastPrayerKey] || broadcastPrayerKey;

    setSendingBroadcast(true);
    try {
      const success = await PrayerWeatherService.broadcastAdhan(
        broadcastPrayerKey,
        pName,
        isAdmin ? "المسؤول العام" : "إدارة المنصة"
      );

      if (success) {
        showToast(`تم بث نداء أذان (${pName}) لجميع مستخدمي المنصة بنجاح 📢`);
      } else {
        showToast("فشل بث نداء الأذان ❌", "error");
      }
    } catch {
      showToast("حدث خطأ أثناء إرسال التنبيه", "error");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Local Preview of Adhan Popup
  const handlePreviewAdhan = () => {
    const prayerNames: Record<string, string> = {
      Fajr: "الفجر",
      Sunrise: "الشروق",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء",
    };
    const pName = prayerNames[broadcastPrayerKey] || broadcastPrayerKey;

    window.dispatchEvent(
      new CustomEvent("trigger_adhan_popup", {
        detail: {
          prayerKey: broadcastPrayerKey,
          prayerName: pName,
          message: `حان الآن موعد أذان ${pName} حسب التوقيت المحلي لمحافظة تعز وضواحيها.`,
        },
      })
    );
  };

  const weatherPresets = [
    { label: "صافٍ ومشمس", code: 0, icon: Sun, night: false },
    { label: "صافٍ ليلاً", code: 0, icon: Moon, night: true },
    { label: "غائم جزئياً", code: 1, icon: Cloud, night: false },
    { label: "غائم بالكامل", code: 3, icon: Cloud, night: false },
    { label: "أمطار خفيفة", code: 51, icon: CloudRain, night: false },
    { label: "أمطار وعواصف رعدية", code: 95, icon: CloudLightning, night: false },
    { label: "ضباب كثيف", code: 45, icon: Wind, night: false },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-cairo" dir="rtl">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-sm font-bold animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-500/50 backdrop-blur-md"
              : "bg-red-900/90 text-red-100 border-red-500/50 backdrop-blur-md"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative bg-gradient-to-l from-slate-900 via-slate-800 to-[#0F291E] p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl overflow-hidden text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة الإدارة والتحكم المركزي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة مواقيت الصلاة وحالة الطقس المباشرة
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تحكم كامل في طريقة تحديث مواقيت الصلاة وحالة الطقس لمدينة تعز وضواحيها، مع إمكانية التبديل بين التحديث التلقائي واليدوي، وبث إشعارات الأذان الفورية لجميع المستخدمين.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">حالة المواقيت</span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                  prayerMode === "manual" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {prayerMode === "manual" ? "يدوي" : "تلقائي"}
              </span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">حالة الطقس</span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                  weatherMode === "manual" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {weatherMode === "manual" ? "يدوي" : "تلقائي"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          id="admin-tab-prayer"
          onClick={() => setActiveSection("prayer")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === "prayer"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>إدارة مواقيت الصلاة</span>
        </button>

        <button
          id="admin-tab-weather"
          onClick={() => setActiveSection("weather")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === "weather"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>إدارة حالة الطقس</span>
        </button>

        <button
          id="admin-tab-broadcast"
          onClick={() => setActiveSection("broadcast")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === "broadcast"
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>بث نداء الأذان الفوري</span>
        </button>
      </div>

      {/* SECTION 1: PRAYER TIMES */}
      {activeSection === "prayer" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">طريقة تحديث مواقيت الصلاة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                حدد ما إذا كنت تريد جلب المواقيت تلقائياً عبر الإنترنت أو اعتماد أوقات مخصصة تدخلها يدوياً.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="prayer-mode-auto"
                type="button"
                onClick={() => setPrayerMode("auto")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  prayerMode === "auto"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                تلقائي (عبر الإنترنت)
              </button>
              <button
                id="prayer-mode-manual"
                type="button"
                onClick={() => setPrayerMode("manual")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  prayerMode === "manual"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                يدوي (إدخال مخصص)
              </button>
            </div>
          </div>

          {/* Manual Timings Inputs */}
          <div className={`space-y-4 transition-opacity ${prayerMode === "auto" ? "opacity-60" : "opacity-100"}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>مواقيت الصلوات الخمس والشروق (توقيت تعز)</span>
              </h4>
              {prayerMode === "auto" && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-semibold">
                  الوضع التلقائي نشط حالياً (البيانات اليدوية محفوظة ولكن غير مفعّلة)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: "Fajr", label: "صلاة الفجر", img: "/Fajr.jpg" },
                { key: "Sunrise", label: "شروق الشمس", img: "/Sunrise.jpg" },
                { key: "Dhuhr", label: "صلاة الظهر", img: "/Dhuhr.jpg" },
                { key: "Asr", label: "صلاة العصر", img: "/Asr.jpg" },
                { key: "Maghrib", label: "صلاة المغرب", img: "/Maghrib.jpg" },
                { key: "Isha", label: "صلاة العشاء", img: "/Isha.jpg" },
              ].map((prayer) => (
                <div
                  key={prayer.key}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <img src={prayer.img} alt={prayer.label} className="w-7 h-7 rounded-lg object-cover" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prayer.label}</span>
                  </div>

                  <input
                    type="time"
                    value={prayerTimings[prayer.key as keyof typeof prayerTimings] || "12:00"}
                    onChange={(e) =>
                      setPrayerTimings({
                        ...prayerTimings,
                        [prayer.key]: e.target.value,
                      })
                    }
                    className="w-full text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-1.5 px-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Hijri Date Override */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>تعديل التاريخ الهجري يدوياً (اختياري)</span>
              </label>
              <input
                type="text"
                value={hijriOverride}
                onChange={(e) => setHijriOverride(e.target.value)}
                placeholder="مثال: 17 ربيع الأول 1448 هـ"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                اترك هذا الحقل فارغاً للاعتماد على التاريخ الهجري التلقائي المحسوب.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              id="save-prayer-config-btn"
              type="button"
              onClick={handleSavePrayer}
              disabled={savingPrayer}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingPrayer ? "جاري الحفظ..." : "حفظ إعدادات المواقيت"}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* SECTION 2: WEATHER MANAGEMENT */}
      {activeSection === "weather" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">طريقة تحديث حالة الطقس</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                حدد ما إذا كنت تريد جلب الطقس تلقائياً من محطات الأرصاد أو تعيين درجات الحرارة وحالة الجو يدوياً.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="weather-mode-auto"
                type="button"
                onClick={() => setWeatherMode("auto")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  weatherMode === "auto"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                تلقائي (الأرصاد المباشرة)
              </button>
              <button
                id="weather-mode-manual"
                type="button"
                onClick={() => setWeatherMode("manual")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  weatherMode === "manual"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                يدوي (تحكم مخصص)
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نماذج طقس سريعة جاهزة:</label>
            <div className="flex flex-wrap gap-2">
              {weatherPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setWeatherData({
                      ...weatherData,
                      conditionText: preset.label,
                      weatherCode: preset.code,
                      isNight: preset.night,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <preset.icon className="w-3.5 h-3.5 text-sky-500" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Weather Inputs */}
          <div className={`space-y-5 transition-opacity ${weatherMode === "auto" ? "opacity-60" : "opacity-100"}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Temperature */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ThermometerSun className="w-4 h-4 text-amber-500" />
                  <span>درجة الحرارة الحالية (°C)</span>
                </label>
                <input
                  type="number"
                  value={weatherData.temp}
                  onChange={(e) => setWeatherData({ ...weatherData, temp: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Feels Like */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ThermometerSun className="w-4 h-4 text-orange-500" />
                  <span>الحرارة المحسوسة (°C)</span>
                </label>
                <input
                  type="number"
                  value={weatherData.feelsLike ?? weatherData.temp}
                  onChange={(e) => setWeatherData({ ...weatherData, feelsLike: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Condition Text */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-500" />
                  <span>وصف الحالة الجوية</span>
                </label>
                <input
                  type="text"
                  value={weatherData.conditionText}
                  onChange={(e) => setWeatherData({ ...weatherData, conditionText: e.target.value })}
                  placeholder="مثال: صافٍ ومشمس، غائم جزئياً..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Humidity */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>نسبة الرطوبة (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weatherData.humidity}
                  onChange={(e) => setWeatherData({ ...weatherData, humidity: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Wind Speed */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-teal-500" />
                  <span>سرعة الرياح (كم/ساعة)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weatherData.windSpeed}
                  onChange={(e) => setWeatherData({ ...weatherData, windSpeed: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Max / Min Temp */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الحرارة العظمى / الصغرى (°C)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="العظمى"
                    value={weatherData.tempMax ?? 30}
                    onChange={(e) => setWeatherData({ ...weatherData, tempMax: Number(e.target.value) })}
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-2 text-center text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    placeholder="الصغرى"
                    value={weatherData.tempMin ?? 20}
                    onChange={(e) => setWeatherData({ ...weatherData, tempMin: Number(e.target.value) })}
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-2 text-center text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Is Night Toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {weatherData.isNight ? (
                  <Moon className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">فترة الطقس (نهار / ليل)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {weatherData.isNight ? "الفترة الحالية: ليلية (قمر)" : "الفترة الحالية: نهارية (شمس)"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWeatherData({ ...weatherData, isNight: !weatherData.isNight })}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  weatherData.isNight
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-amber-500 text-slate-950 border-amber-400"
                }`}
              >
                {weatherData.isNight ? "تبديل إلى نهاري ☀️" : "تبديل إلى ليلي 🌙"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              id="save-weather-config-btn"
              type="button"
              onClick={handleSaveWeather}
              disabled={savingWeather}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingWeather ? "جاري الحفظ..." : "حفظ إعدادات الطقس"}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* SECTION 3: ADHAN BROADCAST TRIGGER */}
      {activeSection === "broadcast" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>بث وإظهار تنبيه الأذان للمستخدمين يدوياً</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              يتيح لك هذا القسم إرسال نافذة منبثقة فورية بتصميم إسلامي لجميع زوار ومستخدمي المنصة المتصلين الآن، لإعلان دخول وقت الصلاة.
            </p>
          </div>

          {/* Prayer Choice */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">اختر الصلاة المراد إعلان أذانها:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: "Fajr", label: "صلاة الفجر", img: "/Fajr.jpg" },
                { key: "Dhuhr", label: "صلاة الظهر", img: "/Dhuhr.jpg" },
                { key: "Asr", label: "صلاة العصر", img: "/Asr.jpg" },
                { key: "Maghrib", label: "صلاة المغرب", img: "/Maghrib.jpg" },
                { key: "Isha", label: "صلاة العشاء", img: "/Isha.jpg" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setBroadcastPrayerKey(p.key as any)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    broadcastPrayerKey === p.key
                      ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100"
                  }`}
                >
                  <img src={p.img} alt={p.label} className="w-12 h-12 rounded-xl object-cover shadow-xs" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Announcement Preview Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0F291E] to-[#06150F] text-amber-100 border border-amber-500/30 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
              <span>نص الرسالة التي ستظهر للمستخدمين:</span>
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                مدة العرض: 10 ثوانٍ
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed p-3 bg-white/5 rounded-xl border border-white/10">
              "حان الآن موعد أذان {
                {
                  Fajr: "الفجر",
                  Sunrise: "الشروق",
                  Dhuhr: "الظهر",
                  Asr: "العصر",
                  Maghrib: "المغرب",
                  Isha: "العشاء",
                }[broadcastPrayerKey]
              } حسب التوقيت المحلي لمحافظة تعز وضواحيها."
            </p>
          </div>

          {/* Last Broadcast Info */}
          {lastBroadcastInfo && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{lastBroadcastInfo}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              id="preview-adhan-btn"
              type="button"
              onClick={handlePreviewAdhan}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
            >
              <Eye className="w-4 h-4 text-amber-500" />
              <span>معاينة وتجربة التنبيه على شاشتي 👁️</span>
            </button>

            <button
              id="send-adhan-broadcast-btn"
              type="button"
              onClick={handleSendAdhanBroadcast}
              disabled={sendingBroadcast}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sendingBroadcast ? "جاري البث..." : "إرسال نداء الأذان فوراً لجميع المستخدمين 📢"}</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
