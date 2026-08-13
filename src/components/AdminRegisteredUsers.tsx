import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { motion } from "motion/react";
import {
  Users,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Sliders,
  Info,
  UserCheck,
} from "lucide-react";
import { RegisteredUsersConfig, DEFAULT_REGISTERED_CONFIG } from "../services/OnlineUsersService";

interface AdminRegisteredUsersProps {
  isAdmin: boolean;
}

export const AdminRegisteredUsers: React.FC<AdminRegisteredUsersProps> = ({ isAdmin }) => {
  const [config, setConfig] = useState<RegisteredUsersConfig>(() => {
    const cached = localStorage.getItem("registered_users_config");
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return DEFAULT_REGISTERED_CONFIG;
  });

  const [realUsersCount, setRealUsersCount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [isCustomOverride, setIsCustomOverride] = useState<boolean>(config.isCustomOverride);
  const [customCount, setCustomCount] = useState<number>(config.customCount || 14);

  // 1. Listen to actual registered users count in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setRealUsersCount(snap.size);
      },
      (err) => {
        console.warn("Could not fetch actual registered users count:", err);
      }
    );
    return () => unsub();
  }, []);

  // 2. Listen to settings/registered_users_config in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "registered_users_config"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RegisteredUsersConfig;
          const merged: RegisteredUsersConfig = {
            isCustomOverride: data.isCustomOverride ?? false,
            customCount: data.customCount ?? 14,
          };
          setConfig(merged);
          setIsCustomOverride(merged.isCustomOverride);
          setCustomCount(merged.customCount);
          localStorage.setItem("registered_users_config", JSON.stringify(merged));
          const dispCount = merged.isCustomOverride ? merged.customCount : realUsersCount;
          localStorage.setItem("registered_users_display_count", String(dispCount));
        }
      },
      (err) => {
        console.warn("Could not fetch registered_users_config from Firestore:", err);
      }
    );
    return () => unsub();
  }, [realUsersCount]);

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

  const activeDisplayedCount = isCustomOverride ? customCount : realUsersCount;

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const newConfig: RegisteredUsersConfig = {
      isCustomOverride,
      customCount: Number(customCount),
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "settings", "registered_users_config"), newConfig, { merge: true });
      localStorage.setItem("registered_users_config", JSON.stringify(newConfig));
      const dispVal = isCustomOverride ? Number(customCount) : realUsersCount;
      localStorage.setItem("registered_users_display_count", String(dispVal));
      setConfig(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save registered_users_config error:", err);
      alert("حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleRevertToReal = async () => {
    setIsCustomOverride(false);
    setSaving(true);
    const newConfig: RegisteredUsersConfig = {
      isCustomOverride: false,
      customCount: Number(customCount),
      updatedAt: Date.now(),
    };
    try {
      await setDoc(doc(db, "settings", "registered_users_config"), newConfig, { merge: true });
      localStorage.setItem("registered_users_config", JSON.stringify(newConfig));
      setConfig(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-4 sm:p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 select-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="flex flex-col text-right">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-white font-cairo leading-tight">إدارة عدد المستخدمين المسجلين</h3>
                <p className="text-[10px] sm:text-[11px] text-amber-100 font-medium font-cairo">عرض وتخصيص العدد الفعلي والمعروض للمستخدمين المسجلين بمرونة</p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 min-w-[120px]">
            <span className="text-[10px] font-extrabold text-white/80 font-cairo">الحالة الحالية</span>
            <span className={`text-xs font-black font-cairo mt-0.5 px-2.5 py-0.5 rounded-full ${isCustomOverride ? "bg-amber-300 text-slate-900" : "bg-emerald-400 text-slate-900"}`}>
              {isCustomOverride ? "عدد مخصص" : "العدد الفعلي"}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE DISPLAY PREVIEW CARD */}
      <div className="bg-slate-900 dark:bg-slate-950 p-6 sm:p-8 rounded-[28px] border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 text-xs font-extrabold font-cairo">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>العدد المعروض حالياً على المنصة</span>
            </div>
            <div className="flex items-baseline justify-center sm:justify-start gap-3">
              <span className="text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-tight text-white">
                {activeDisplayedCount.toLocaleString("ar-EG")}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300 font-cairo">
                مستخدم مسجل
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <span className={`w-3 h-3 rounded-full ${isCustomOverride ? "bg-amber-400" : "bg-emerald-400"}`}></span>
              <span className="text-xs sm:text-sm font-black font-cairo text-slate-200">
                العدد الفعلي المباشر بالقاعدة: ({realUsersCount.toLocaleString("ar-EG")})
              </span>
            </div>

            {isCustomOverride && (
              <button
                type="button"
                onClick={handleRevertToReal}
                className="text-xs font-black text-amber-400 hover:text-amber-300 underline font-cairo flex items-center gap-1.5 cursor-pointer pt-1"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>الرجوع للعدد الفعلي للأنظمة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS CARD */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Real Count Info Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="font-black text-slate-900 dark:text-white font-cairo text-base">
              العدد الحقيقي للمستخدمين المسجلين فعلياً
            </div>
            <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 font-cairo">
              إجمالي الحسابات والملفات الشخصية الموثقة في قاعدة البيانات: ({realUsersCount.toLocaleString("ar-EG")} مستخدم)
            </p>
          </div>
          <button
            type="button"
            onClick={handleRevertToReal}
            disabled={!isCustomOverride}
            className={`px-4 py-2.5 rounded-xl text-xs font-black font-cairo flex items-center gap-2 border transition-all ${
              isCustomOverride
                ? "bg-amber-500 text-white border-amber-600 shadow-sm cursor-pointer hover:bg-amber-600"
                : "bg-slate-200/60 text-slate-400 border-slate-300/60 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="w-4 h-4 stroke-[2.2]" />
            <span>اعتماد العدد الفعلي</span>
          </button>
        </div>

        {/* Custom Override Form */}
        <div className="space-y-4 pt-2">
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200 font-cairo text-base sm:text-lg">
                <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
                <span>تعديل العدد المعروض للمستخدمين (Custom Count)</span>
              </div>
              <p className="text-xs font-extrabold text-amber-700/80 dark:text-amber-400/80 font-cairo">
                عند تفعيل هذا الخيار، سيظهر الرقم المخصص للزوار ولجميع مستخدمي المنصة بدل العدد الفعلي
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setIsCustomOverride(!isCustomOverride)}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                isCustomOverride ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                  isCustomOverride ? "-translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {isCustomOverride && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2"
            >
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 font-cairo text-right">
                أدخل الرقم المطلوب عرضه
              </label>
              <input
                type="number"
                value={customCount}
                onChange={(e) => setCustomCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-right font-black text-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                placeholder="2458"
              />
            </motion.div>
          )}

        </div>

        {/* SAVE BUTTON & FEEDBACK */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black font-cairo text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5 stroke-[2.2]" />
            )}
            <span>حفظ إعدادات عدد المستخدمين</span>
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
