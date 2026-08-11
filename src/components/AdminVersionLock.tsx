import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Info,
  Lock,
  Download,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { AppVersionConfig } from "../types";
import { CURRENT_APP_VERSION } from "../config/version";

interface AdminVersionLockProps {
  isAdmin?: boolean;
}

export const AdminVersionLock: React.FC<AdminVersionLockProps> = ({ isAdmin = true }) => {
  const [config, setConfig] = useState<AppVersionConfig>({
    minRequiredVersion: "1.0.0",
    updateUrl: "",
    lockMessage: "يتوفر إصدار جديد من التطبيق بمميزات وتحسينات جديدة. يرجى التحديث لمتابعة الاستخدام.",
    isEnabled: false,
    updatedAt: 0,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [minRequiredVersion, setMinRequiredVersion] = useState("1.0.0");
  const [updateUrl, setUpdateUrl] = useState("");
  const [lockMessage, setLockMessage] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  // Listen to settings/app_version_config in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "app_version_config"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppVersionConfig;
          const merged: AppVersionConfig = {
            minRequiredVersion: data.minRequiredVersion || "1.0.0",
            updateUrl: data.updateUrl || "",
            lockMessage: data.lockMessage || "يتوفر إصدار جديد من التطبيق بمميزات وتحسينات جديدة. يرجى التحديث لمتابعة الاستخدام.",
            isEnabled: data.isEnabled ?? false,
            updatedAt: data.updatedAt || 0,
            updatedBy: data.updatedBy || "",
          };
          setConfig(merged);
          setMinRequiredVersion(merged.minRequiredVersion);
          setUpdateUrl(merged.updateUrl);
          setLockMessage(merged.lockMessage);
          setIsEnabled(merged.isEnabled);
        }
      },
      (err) => {
        console.warn("Could not fetch app_version_config from Firestore:", err);
      }
    );
    return () => unsub();
  }, []);

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
    setSaving(true);
    setSaveSuccess(false);

    const newConfig: AppVersionConfig = {
      minRequiredVersion: minRequiredVersion.trim() || "1.0.0",
      updateUrl: updateUrl.trim(),
      lockMessage: lockMessage.trim() || "يتوفر إصدار جديد من التطبيق بمميزات وتحسينات جديدة. يرجى التحديث لمتابعة الاستخدام.",
      isEnabled,
      updatedAt: Date.now(),
      updatedBy: auth.currentUser?.email || "مدير النظام",
    };

    try {
      await setDoc(doc(db, "settings", "app_version_config"), newConfig, { merge: true });
      setConfig(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save app_version_config error:", err);
      alert("حدث خطأ أثناء حفظ إعدادات إصدار التطبيق في قاعدة البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMinRequiredVersion(config.minRequiredVersion);
    setUpdateUrl(config.updateUrl);
    setLockMessage(config.lockMessage);
    setIsEnabled(config.isEnabled);
  };

  return (
    <div className="space-y-6 text-right font-cairo" dir="rtl">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#BF841F]" />
            إصدارات التطبيق والتحكم بالقفل (Force Update)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            تحكم في إصدارات تطبيق الأندرويد وإجبار المستخدمين على التحديث عند إطلاق نسخة جديدة.
          </p>
        </div>
        
        {/* Real-time Version Info Banner */}
        <div className="bg-[#5691FF]/10 dark:bg-[#5691FF]/20 px-4 py-2 rounded-2xl border border-[#5CA9FF]/30 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#5CA9FF]" />
          <span>نسخة الـ APK الحالية في الكود:</span>
          <span className="bg-[#5CA9FF] text-white px-2 py-0.5 rounded-lg text-xs font-mono">{CURRENT_APP_VERSION}</span>
        </div>
      </div>

      {/* 2. STATS & STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Version Lock Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEnabled ? "bg-red-500/10 text-red-500" : "bg-slate-300/10 text-slate-400 dark:text-slate-500"}`}>
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">حالة تفعيل القفل</span>
            <span className={`text-base font-black ${isEnabled ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}>
              {isEnabled ? "مفعّل ونشط ⚠️" : "غير نشط (مغلق)"}
            </span>
          </div>
        </div>

        {/* Required Version */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">الحد الأدنى المطلوب</span>
            <span className="text-base font-mono font-black text-slate-800 dark:text-white">
              v{config.minRequiredVersion}
            </span>
          </div>
        </div>

        {/* Update URL Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.updateUrl ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-300/10 text-slate-400 dark:text-slate-500"}`}>
            <Download className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">رابط تحميل التحديث</span>
            <span className="text-xs font-medium block truncate text-slate-600 dark:text-slate-300">
              {config.updateUrl ? config.updateUrl : "لا يوجد رابط مضاف"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SETTINGS FORM CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-5">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#BF841F]" />
          تعديل إعدادات التحقق من الإصدار
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Min Required Version Input */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>الحد الأدنى للإصدار المطلوب (من نوع Semantic Versioning)</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: 1.0.1"
              value={minRequiredVersion}
              onChange={(e) => setMinRequiredVersion(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#5CA9FF] font-mono text-left"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              سيتم قفل وإجبار أي مستخدم لديه تطبيق بإصدار أقل من هذا الرقم على التحديث فورياً.
            </p>
          </div>

          {/* Update Download Link Input */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              رابط تحميل ملف الـ APK للتحديث الجديد
            </label>
            <input
              type="url"
              placeholder="مثال: https://github.com/username/repo/releases/latest"
              value={updateUrl}
              onChange={(e) => setUpdateUrl(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#5CA9FF] text-left"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              الرابط الذي سيتم توجيه المستخدمين إليه عند نقرهم على زر "تحميل التحديث الآن".
            </p>
          </div>
        </div>

        {/* Lock Custom Message Textarea */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            رسالة القفل والتحديث المعروضة للمستخدمين 
          </label>
          <textarea
            rows={3}
            placeholder="أدخل الرسالة التي ستظهر للمستخدم في الواجهة المقفلة..."
            value={lockMessage}
            onChange={(e) => setLockMessage(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#5CA9FF] leading-relaxed resize-none text-right"
          />
        </div>

        {/* Toggle Switch */}
        <div className="p-4 rounded-2xl bg-[#BF841F]/5 border border-[#BF841F]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BF841F]/10 flex items-center justify-center text-[#BF841F] flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white block">تفعيل نظام التحقق وإجبار التحديث</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                عند تفعيله، سيتم منع أي مستخدم يملك إصداراً قديماً من استخدام التطبيق حتى يقوم بتحميل التحديث.
              </span>
            </div>
          </div>
          
          {/* Custom Toggle Switch */}
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 focus:outline-none ${isEnabled ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"}`}
          >
            <motion.div
              layout
              className="w-6 h-6 rounded-full bg-white shadow-sm"
              animate={{ x: isEnabled ? -24 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </button>
        </div>

        {/* 4. ACTIONS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          {/* Last modified summary */}
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <Info className="w-4 h-4 flex-shrink-0" />
            {config.updatedAt > 0 ? (
              <span>
                آخر تحديث بواسطة <strong className="text-slate-500 dark:text-slate-300">{config.updatedBy}</strong> في{" "}
                {new Date(config.updatedAt).toLocaleString("ar-YE")}
              </span>
            ) : (
              <span>لم يتم تهيئة الإعدادات بعد في قاعدة البيانات.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Revert Button */}
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-initial h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center gap-2 font-bold text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
              تراجع عن التعديلات
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-[#BF841F] hover:bg-[#A67119] text-white flex items-center justify-center gap-2 font-black text-xs transition-colors shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </div>
        </div>
      </div>

      {/* 5. SUCCESS SUCCESS ALERTS */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs sm:text-sm font-bold">
              تم حفظ إعدادات إصدار التطبيق والتحكم بالقفل بنجاح في قاعدة البيانات (Firestore)!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
