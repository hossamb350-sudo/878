import React, { useEffect, useState } from "react";
import { SEO } from "../../components/SEO";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { AppVersionConfig } from "../../types";
import { BASE_URL, routes } from "../../utils/routes";
import { CURRENT_APP_VERSION } from "../../config/version";
import {
  Download,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function DownloadPage() {
  const [versionConfig, setVersionConfig] = useState<AppVersionConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Fetch real-time app version config from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "app_version_config"),
      (snap) => {
        if (snap.exists()) {
          setVersionConfig(snap.data() as AppVersionConfig);
        }
        setLoadingConfig(false);
      },
      (err) => {
        console.warn("Could not fetch app_version_config:", err);
        setLoadingConfig(false);
      }
    );
    return () => unsub();
  }, []);

  const apkUrl = versionConfig?.updateUrl?.trim() || "";
  const imageUrl = `${BASE_URL}/TAIZMEDIAPLATFORM.jpg`;

  const handleDownloadClick = () => {
    if (!apkUrl) return;
    setDownloading(true);
    window.open(apkUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-cairo flex flex-col selection:bg-taiz-sky selection:text-white relative overflow-hidden" dir="rtl">
      {/* Dynamic SEO & Meta preview */}
      <SEO
        title="تحميل تطبيق منصة تعز الإعلامية - نسخة الأندرويد"
        description="تغطية إخبارية شاملة، وبث مباشر للقنوات الفضائية والإذاعات المحلية، ومحتوى مرئي متجدد، إلى جانب محاضرات وكلمات ودروس قائد الثورة، ودروس هدى القرآن الكريم، ومصحف إلكتروني مقروء ومسموع بصوت الشيخ المنشاوي؛ كل ذلك في تطبيق واحد، ليبقى الخبر والمعرفة والوعي بين يديك"
        imageUrl={imageUrl}
        path={routes.download()}
      />

      {/* Decorative Background Effects */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-taiz-royal/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-taiz-sky/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* HEADER BAR */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-taiz-royal to-taiz-sky p-0.5 shadow-md shadow-taiz-royal/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                <img
                  src="/TAIZMEDIAPLATFORM.jpg"
                  alt="شعار منصة تعز الإعلامية"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xs sm:text-sm text-white tracking-wide leading-tight group-hover:text-taiz-sky transition-colors">
                منصة تعز الإعلامية
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                التطبيق الرسمي للأندرويد
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full space-y-6 sm:space-y-8">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-wide"
          >
            حمل تطبيق <span className="bg-gradient-to-r from-taiz-sky via-amber-300 to-amber-500 bg-clip-text text-transparent">منصة تعز الإعلامية</span> على هاتفك
          </motion.h1>

          {/* User Requested Custom Text */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium"
          >
            تغطية إخبارية شاملة، وبث مباشر للقنوات الفضائية والإذاعات المحلية، ومحتوى مرئي متجدد، إلى جانب محاضرات وكلمات ودروس قائد الثورة، ودروس هدى القرآن الكريم، ومصحف إلكتروني مقروء ومسموع بصوت الشيخ المنشاوي؛ كل ذلك في تطبيق واحد، ليبقى الخبر والمعرفة والوعي بين يديك
          </motion.p>
        </section>

        {/* HERO CARD WITH IMAGE & DOWNLOAD BUTTON */}
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800/90 p-4 sm:p-6 shadow-xl backdrop-blur-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
            
            {/* IMAGE PREVIEW DISPLAY */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[200px] sm:max-w-[240px] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg bg-slate-950 p-1.5 transition-transform duration-300 hover:scale-[1.01]">
                <img
                  src="/TAIZMEDIAPLATFORM.jpg"
                  alt="تطبيق منصة تعز الإعلامية"
                  className="w-full h-auto rounded-lg sm:rounded-xl object-cover"
                />
              </div>
            </div>

            {/* ACTION & DOWNLOAD BOX */}
            <div className="md:col-span-7 space-y-4 text-right">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-taiz-sky" />
                  <span className="text-[10px] sm:text-xs font-bold text-taiz-sky uppercase tracking-wider">
                    نظام تشغيل أندرويد (Android)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  تنزيل ملف التثبيت المباشر (APK)
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-relaxed">
                  احصل على التحديث الأحدث برابط مباشر وآمن. مجاني بالكامل وبدون الحاجة لمتجر متقدم.
                </p>
              </div>

              {/* FEATURES BADGES (Removed 'تحديثات فورية') */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  مجاني 100%
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300">
                  <ShieldCheck className="w-3 h-3 text-taiz-sky" />
                  آمن ومعتمد
                </span>
              </div>

              {/* DOWNLOAD BUTTON */}
              <div className="pt-1">
                {apkUrl ? (
                  <button
                    onClick={handleDownloadClick}
                    disabled={downloading}
                    className="w-full sm:w-auto min-w-[240px] h-11 sm:h-12 px-6 rounded-xl bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal bg-[length:200%_auto] hover:bg-right text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md shadow-taiz-royal/20 hover:shadow-taiz-sky/30 active:scale-98 cursor-pointer"
                  >
                    <Download className={`w-4 h-4 transition-transform ${downloading ? "animate-bounce" : ""}`} />
                    <span>تحميل تطبيق الأندرويد الآن (APK)</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-2.5">
                    <Info className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      {loadingConfig
                        ? "جاري التحقق من وجود رابط التنزيل..."
                        : "يتوفر رابط التنزيل المباشر قريباً بواسطة إدارة المنصة. يرجى إعادة الزيارة لاحقاً."}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </motion.section>

        {/* INSTALLATION STEPS */}
        <section className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <div className="w-7 h-7 rounded-lg bg-taiz-sky/10 text-taiz-sky flex items-center justify-center font-bold text-xs">
              ?
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-white">
                خطوات تثبيت ملف الـ APK على الأندرويد
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                تثبيت سريع وبسيط في أقل من دقيقة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-taiz-royal text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-200">الضغط على زر التحميل</h4>
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">
                  اضغط على زر "تحميل تطبيق الأندرويد" الموضح في الأعلى لبدء تنزيل ملف الـ APK.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-taiz-royal text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-200">الموافقـة على التثبيت</h4>
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">
                  عند فتح الملف، إذا ظهر لك تنبيه أمان، اضغط "الإعدادات" ثم اختر "السماح من هذا المصدر".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-taiz-royal text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-200">فتح واستخدام التطبيق</h4>
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">
                  اضغط على "تثبيت"، ثم افتح التطبيق واستمتع بكافة الخدمات والمميزات المتاحة.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 text-center text-[11px] text-slate-500 font-medium">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center">
          <p>جميع الحقوق محفوظة © منصة تعز الإعلامية {new Date().getFullYear()}م</p>
        </div>
      </footer>
    </div>
  );
}
