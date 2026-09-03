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
  Share2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Bell,
  Tv,
  Newspaper,
  BookOpen,
  ArrowRight,
  Info,
  QrCode,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function DownloadPage() {
  const [versionConfig, setVersionConfig] = useState<AppVersionConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [copied, setCopied] = useState(false);
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
  const pageShareUrl = routes.absolute(routes.download());
  const imageUrl = `${BASE_URL}/TAIZMEDIAPLATFORM.jpg`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pageShareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = pageShareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "تطبيق منصة تعز الإعلامية",
          text: "حمل تطبيق منصة تعز الإعلامية للأندرويد",
          url: pageShareUrl,
        });
      } catch {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

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
        description="حمل تطبيق منصة تعز الإعلامية"
        imageUrl={imageUrl}
        path={routes.download()}
      />

      {/* Decorative Background Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-taiz-royal/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-taiz-sky/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* HEADER BAR */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-taiz-royal to-taiz-sky p-0.5 shadow-lg shadow-taiz-royal/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                <img
                  src="/TAIZMEDIAPLATFORM.jpg"
                  alt="شعار منصة تعز الإعلامية"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base text-white tracking-wide leading-tight group-hover:text-taiz-sky transition-colors">
                منصة تعز الإعلامية
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                التطبيق الرسمي للأندرويد
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4 text-taiz-sky" />
              <span className="hidden sm:inline">مشاركة الصفحة</span>
            </button>
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-taiz-sky/10 text-taiz-sky border border-taiz-sky/20 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-taiz-sky/20 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الموقع الإلكتروني</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full space-y-10 sm:space-y-14">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-taiz-royal/30 via-taiz-sky/20 to-amber-500/20 border border-taiz-sky/30 shadow-inner text-xs sm:text-sm font-bold text-slate-200"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>النسخة المعتمدة والمباشرة للأندرويد (APK)</span>
            <span className="bg-taiz-sky text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-black font-mono">
              v{versionConfig?.minRequiredVersion || CURRENT_APP_VERSION}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight sm:leading-snug tracking-wide"
          >
            حمل تطبيق <span className="bg-gradient-to-r from-taiz-sky via-amber-300 to-amber-500 bg-clip-text text-transparent">منصة تعز الإعلامية</span> على هاتفك
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium"
          >
            استمتع بتغطية إخبارية شاملة، بث مباشر للقنوات الفضائية والأنشطة، مقاطع ميديا ومحاضرات، ودروس هدي القرآن الكريم في تطبيق واحد سريع وبدون إعلانات.
          </motion.p>
        </section>

        {/* HERO CARD WITH IMAGE & DOWNLOAD BUTTON */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="relative rounded-3xl sm:rounded-[2.5rem] bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* IMAGE PREVIEW DISPLAY */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative group w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl shadow-taiz-sky/10 bg-slate-950 p-2 transform transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src="/TAIZMEDIAPLATFORM.jpg"
                  alt="تطبيق منصة تعز الإعلامية"
                  className="w-full h-auto rounded-xl sm:rounded-2xl object-cover shadow-md"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none rounded-xl sm:rounded-2xl" />
                <div className="absolute bottom-4 right-4 left-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-bold shadow-lg">
                    📱 واجهة التطبيق الرسمية
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION & DOWNLOAD BOX */}
            <div className="md:col-span-7 space-y-6 text-right">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-taiz-sky" />
                  <span className="text-xs font-bold text-taiz-sky uppercase tracking-wider">
                    نظام تشغيل أندرويد (Android)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  تنزيل ملف التثبيت المباشر (APK)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                  احصل على التحديث الأحدث برابط مباشر وآمن. مجاني بالكامل وبدون الحاجة لمتجر متقدم.
                </p>
              </div>

              {/* FEATURES BADGES */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  مجاني 100%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-taiz-sky" />
                  آمن ومعتمد
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  تحديثات فورية
                </span>
              </div>

              {/* DOWNLOAD BUTTON */}
              <div className="pt-2 space-y-3">
                {apkUrl ? (
                  <button
                    onClick={handleDownloadClick}
                    disabled={downloading}
                    className="w-full sm:w-auto min-w-[280px] h-14 px-8 rounded-2xl bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal bg-[length:200%_auto] hover:bg-right text-white font-black text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-taiz-royal/30 hover:shadow-taiz-sky/40 active:scale-98 group cursor-pointer"
                  >
                    <Download className={`w-6 h-6 transition-transform group-hover:translate-y-0.5 ${downloading ? "animate-bounce" : ""}`} />
                    <span>تحميل تطبيق الأندرويد الآن (APK)</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-3">
                    <Info className="w-5 h-5 shrink-0 text-amber-400" />
                    <span>
                      {loadingConfig
                        ? "جاري التحقق من وجود رابط التنزيل..."
                        : "يتوفر رابط التنزيل المباشر قريباً بواسطة إدارة المنصة. يرجى إعادة الزيارة لاحقاً."}
                    </span>
                  </div>
                )}

                {/* COPY PAGE LINK OPTION */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">تم نسخ رابط التحميل</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>نسخ رابط الصفحة للمشاركة</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>مشاركة عبر واتساب والتطبيقات</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </motion.section>

        {/* FEATURES GRID SECTION */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              لماذا تستخدم تطبيق منصة تعز الإعلامية؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              تجربة مخصصة ومصممة بعناية لمواكبة كافة الأحداث والمحتوى التوعوي
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-taiz-sky/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-taiz-royal/20 text-taiz-sky flex items-center justify-center">
                <Newspaper className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white">تغطية إخبارية شاملة</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                أحدث الأخبار المحلية والسياسية والثقافية في تعز واليمن على مدار الساعة.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-taiz-sky/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Tv className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white">بث مباشر وميديا</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                شاهد القنوات الفضائية والكلمات والخطابات ومقاطع الميديا بدقة عالية وسرعة فائقة.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-taiz-sky/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white">قسم هدي القرآن الكريم</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                مكتبة هداية شاملة تضم المحاضرات والدروس والقرآن الكريم مكتوباً ومسموعاً.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-taiz-sky/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white">إشعارات عاجلة وقتية</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                استقبل تنبيهات فورية للأخبار العاجلة والفعاليات والأحداث المهمة فور حدوثها.
              </p>
            </div>
          </div>
        </section>

        {/* INSTALLATION STEPS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-xl bg-taiz-sky/10 text-taiz-sky flex items-center justify-center font-bold">
              ?
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                خطوات تثبيت ملف الـ APK على الأندرويد
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                تثبيت سريع وبسيط في أقل من دقيقة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-7 h-7 rounded-full bg-taiz-royal text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-200">الضغط على زر التحميل</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  اضغط على زر "تحميل تطبيق الأندرويد" الموضح في الأعلى لبدء تنزيل ملف الـ APK.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-7 h-7 rounded-full bg-taiz-royal text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-200">الموافقـة على التثبيت</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  عند فتح الملف، إذا ظهر لك تنبيه أمان، اضغط "الإعدادات" ثم اختر "السماح من هذا المصدر".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-7 h-7 rounded-full bg-taiz-royal text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-200">فتح واستخدام التطبيق</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  اضغط على "تثبيت"، ثم افتح التطبيق واستمتع بكافة الخدمات والمميزات المتاحة.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>جميع الحقوق محفوظة © منصة تعز الإعلامية {new Date().getFullYear()}م</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/" className="hover:text-taiz-sky transition-colors">الرئيسية</Link>
            <span>•</span>
            <Link to="/news" className="hover:text-taiz-sky transition-colors">الأخبار</Link>
            <span>•</span>
            <Link to="/quran" className="hover:text-taiz-sky transition-colors">هدي القرآن</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
