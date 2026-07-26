import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Radio,
  Zap,
  Activity,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Save,
  RotateCcw,
  Shield,
  Users,
  Info,
  Clock,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";
import { OnlineUsersConfig, DEFAULT_ONLINE_CONFIG } from "../services/OnlineUsersService";

interface AdminOnlineUsersProps {
  isAdmin: boolean;
}

export const AdminOnlineUsers: React.FC<AdminOnlineUsersProps> = ({ isAdmin }) => {
  const [config, setConfig] = useState<OnlineUsersConfig>(() => {
    const cached = localStorage.getItem("online_users_config");
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return DEFAULT_ONLINE_CONFIG;
  });

  const [realOnlineCount, setRealOnlineCount] = useState<number>(0);
  const [displayedCount, setDisplayedCount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [isSimulated, setIsSimulated] = useState<boolean>(config.isSimulated);
  const [minCount, setMinCount] = useState<number>(config.minCount);
  const [maxCount, setMaxCount] = useState<number>(config.maxCount);
  const [updateIntervalSec, setUpdateIntervalSec] = useState<number>(config.updateIntervalSec || 4);

  // 1. Fetch real online users count from Firestore (users active in last 10 mins)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const now = Date.now();
        const tenMinsAgo = now - 10 * 60 * 1000;
        let count = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.lastLogin && data.lastLogin > tenMinsAgo) {
            count++;
          }
        });
        // Ensure at least 1 (the current logged in admin session)
        setRealOnlineCount(Math.max(count, 1));
      },
      (err) => {
        console.warn("Could not fetch real users online count:", err);
        setRealOnlineCount(1);
      }
    );
    return () => unsub();
  }, []);

  // 2. Fetch config from Firestore settings/online_users_config
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "online_users_config"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as OnlineUsersConfig;
          const merged: OnlineUsersConfig = {
            isSimulated: data.isSimulated ?? false,
            minCount: data.minCount ?? 15,
            maxCount: data.maxCount ?? 45,
            updateIntervalSec: data.updateIntervalSec ?? 4,
          };
          setConfig(merged);
          setIsSimulated(merged.isSimulated);
          setMinCount(merged.minCount);
          setMaxCount(merged.maxCount);
          setUpdateIntervalSec(merged.updateIntervalSec);
          localStorage.setItem("online_users_config", JSON.stringify(merged));
        }
      },
      (err) => {
        console.warn("Could not load online_users_config from Firestore:", err);
      }
    );
    return () => unsub();
  }, []);

  // 3. Fluctuation simulation loop when simulated mode is enabled
  useEffect(() => {
    if (!isSimulated) {
      setDisplayedCount(realOnlineCount);
      return;
    }

    // Initial value in range
    const initial = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    setDisplayedCount(initial);

    let currentVal = initial;

    const interval = setInterval(() => {
      // Small realistic variation: -3 to +3
      const delta = Math.floor(Math.random() * 7) - 3;
      let nextVal = currentVal + delta;
      if (nextVal < minCount) nextVal = minCount + Math.floor(Math.random() * 3);
      if (nextVal > maxCount) nextVal = maxCount - Math.floor(Math.random() * 3);
      currentVal = nextVal;
      setDisplayedCount(nextVal);
    }, (updateIntervalSec || 4) * 1000);

    return () => clearInterval(interval);
  }, [isSimulated, minCount, maxCount, updateIntervalSec, realOnlineCount]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 rounded-3xl border border-red-200 dark:border-red-900/50">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-black text-red-700 dark:text-red-400 font-cairo">
          عذراً، هذه الصفحة مقتصرة على مدير النظام فقط
        </h3>
      </div>
    );
  }

  const handleSave = async () => {
    if (minCount < 0 || maxCount < minCount) {
      alert("يرجى إدخال حد أدنى وأعلى صحيحين (الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأعلى)");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const newConfig: OnlineUsersConfig = {
      isSimulated,
      minCount: Number(minCount),
      maxCount: Number(maxCount),
      updateIntervalSec: Number(updateIntervalSec),
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "settings", "online_users_config"), newConfig, { merge: true });
      localStorage.setItem("online_users_config", JSON.stringify(newConfig));
      setConfig(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save online_users_config error:", err);
      alert("حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 p-5 sm:p-6 rounded-[26px] text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <Radio className="w-6 h-6 text-white stroke-[2.2] animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-cairo tracking-tight">
                إدارة المتصلين حالياً
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-red-100 font-cairo leading-relaxed max-w-xl">
              التحكم في العدد المعروض للمستخدمين المتواجدين حالياً في المنصة، وتفعيل وضع المحاكاة التلقائية لإبراز حركة الاتصال الحية.
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 min-w-[120px]">
            <span className="text-[10px] font-extrabold text-white/80 font-cairo">الحالة الحالية</span>
            <span className={`text-xs font-black font-cairo mt-0.5 px-2.5 py-0.5 rounded-full ${isSimulated ? "bg-amber-400 text-slate-900" : "bg-emerald-400 text-slate-900"}`}>
              {isSimulated ? "وضع المحاكاة" : "العدد الفعلي"}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE DISPLAY PREVIEW CARD */}
      <div className="bg-slate-900 dark:bg-slate-950 p-6 sm:p-8 rounded-[28px] border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 text-xs font-extrabold font-cairo">
              <Activity className="w-4 h-4 text-red-400" />
              <span>معاينة العرض الحي للمستخدمين</span>
            </div>
            <div className="flex items-baseline justify-center sm:justify-start gap-3">
              <span className="text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-tight text-white">
                {displayedCount.toLocaleString("ar-EG")}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300 font-cairo">
                متصل الآن
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <span className={`w-3 h-3 rounded-full ${isSimulated ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"}`}></span>
              <span className="text-xs sm:text-sm font-black font-cairo text-slate-200">
                {isSimulated ? `محاكاة نطاق (${minCount} - ${maxCount})` : `العدد الفعلي المباشر (${realOnlineCount})`}
              </span>
            </div>
            {isSimulated && (
              <span className="text-[11px] font-bold text-amber-400/90 font-cairo flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                يتغير تلقائياً كل {updateIntervalSec} ثوانٍ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS CARD */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Toggle Simulation Mode */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white font-cairo text-base sm:text-lg">
              <Zap className={`w-5 h-5 ${isSimulated ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
              <span>تفعيل وضع المحاكاة التلقائية</span>
            </div>
            <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 font-cairo">
              توليد أرقام متغيرة بعشوائية ضمن نطاق محدد لإبراز نمو وتفاعل المنصة
            </p>
          </div>

          {/* Switch Switch Button */}
          <button
            type="button"
            onClick={() => setIsSimulated(!isSimulated)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              isSimulated ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                isSimulated ? "-translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Real Count Option vs Simulation Inputs */}
        <AnimatePresence mode="wait">
          {isSimulated ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 pt-2"
            >
              <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 font-cairo bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <Info className="w-4 h-4 shrink-0" />
                <span>قم بتحديد الحد الأدنى والأعلى، وسيحدد النظام رقم متغير بشكل واقعي ودوري.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Min Count Input */}
                <div className="space-y-2 text-right">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 font-cairo">
                    الحد الأدنى للمتصلين (Min)
                  </label>
                  <input
                    type="number"
                    value={minCount}
                    onChange={(e) => setMinCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-center font-black text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                    placeholder="20"
                  />
                </div>

                {/* Max Count Input */}
                <div className="space-y-2 text-right">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 font-cairo">
                    الحد الأعلى للمتصلين (Max)
                  </label>
                  <input
                    type="number"
                    value={maxCount}
                    onChange={(e) => setMaxCount(Math.max(minCount, parseInt(e.target.value) || minCount))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-center font-black text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                    placeholder="50"
                  />
                </div>

                {/* Update Frequency Input */}
                <div className="space-y-2 text-right">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 font-cairo">
                    معدل التجديد (بالثواني)
                  </label>
                  <select
                    value={updateIntervalSec}
                    onChange={(e) => setUpdateIntervalSec(parseInt(e.target.value) || 4)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-center font-black text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                    dir="rtl"
                  >
                    <option value={2}>كل ثانتين (سريع)</option>
                    <option value={4}>كل 4 ثوانٍ (متوازن)</option>
                    <option value={6}>كل 6 ثوانٍ</option>
                    <option value={10}>كل 10 ثوانٍ (هادئ)</option>
                  </select>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-4"
            >
              <div className="space-y-1 text-right">
                <div className="font-black text-emerald-800 dark:text-emerald-300 font-cairo text-base">
                  وضع العدد الفعلي الحقيقي نشط
                </div>
                <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-cairo">
                  يتم حساب المتصلين تلقائياً من جلسات المستخدمين النشطة في الوقت الحالي: ({realOnlineCount} متصل)
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* SAVE BUTTON & FEEDBACK */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black font-cairo text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5 stroke-[2.2]" />
            )}
            <span>حفظ إعدادات المتصلين</span>
          </button>

          {saveSuccess && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-cairo bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>تم الحفظ بنجاح!</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
