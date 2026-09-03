import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Bell,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Type,
  Eye,
} from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { useTextSize, TextSizeMode, TEXT_SIZE_MAP } from "../context/TextSizeContext";
import {
  NOTIFICATION_CHANNELS_LIST,
  NotificationChannelsState,
  getSavedNotificationChannels,
  saveNotificationChannels,
  requestNativeNotificationPermission,
} from "../services/NotificationPreferencesService";

export const ONBOARDING_STORAGE_KEY = "taiz_onboarding_completed";

interface OnboardingWizardProps {
  onComplete: () => void;
  /** If opened manually from Settings, allowing direct close */
  isManualReopen?: boolean;
}

export function OnboardingWizard({ onComplete, isManualReopen = false }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const { theme, setTheme } = useTheme();
  const { textSize, setTextSize, sliderValue, setSliderValue, getTextSizeLabel } = useTextSize();

  const [notificationChannels, setNotificationChannels] = useState<NotificationChannelsState>(() => {
    return getSavedNotificationChannels();
  });

  const [isFinishing, setIsFinishing] = useState(false);

  // Toggle single notification channel
  const handleToggleChannel = (channelId: string) => {
    setNotificationChannels((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  };

  // Toggle all channels on or off
  const handleToggleAll = (enable: boolean) => {
    const updated: NotificationChannelsState = {};
    NOTIFICATION_CHANNELS_LIST.forEach((ch) => {
      updated[ch.id] = enable;
    });
    setNotificationChannels(updated);
  };

  const areAllEnabled = NOTIFICATION_CHANNELS_LIST.every((ch) => notificationChannels[ch.id]);

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      // 1. Save notification channels
      await saveNotificationChannels(notificationChannels);

      // 2. Request native permissions if any channel is enabled
      const hasAnyEnabled = Object.values(notificationChannels).some(Boolean);
      if (hasAnyEnabled) {
        await requestNativeNotificationPermission();
      }

      // 3. Mark onboarding as completed
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      localStorage.setItem("taiz_app_already_launched", "true");

      // 4. Complete callback
      onComplete();
    } catch (e) {
      console.error("Error finalizing onboarding", e);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      onComplete();
    } finally {
      setIsFinishing(false);
    }
  };

  const steps = [
    { number: 1, title: "المظهر", subtitle: "تخصيص ألوان الواجهة" },
    { number: 2, title: "حجم النص", subtitle: "مستوى وضوح القراءة" },
    { number: 3, title: "الإشعارات", subtitle: "تنبيهات الأقسام المفضلة" },
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none font-cairo"
      dir="rtl"
    >
      {/* Background glowing ambient light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#D9A441]/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#10264A]/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-xl bg-white dark:bg-[#0A162C] rounded-[28px] sm:rounded-[36px] border border-slate-200/90 dark:border-[#1E355B] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Top Header & Progress Stepper */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-4 border-b border-slate-100 dark:border-[#172A4E] shrink-0 bg-slate-50/50 dark:bg-[#071124]/60">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D9A441] to-[#BF841F] flex items-center justify-center text-white shadow-md shadow-[#D9A441]/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  إعداد تجربة الاستخدام
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  خصص المنصة وفق تفضيلاتك الشخصية
                </p>
              </div>
            </div>

            {/* Step Counter Badge */}
            <div className="px-3 py-1 rounded-full bg-slate-200/70 dark:bg-[#132547] text-slate-700 dark:text-slate-200 text-xs font-black border border-slate-300/60 dark:border-[#223F70]">
              الخطوة {currentStep} من 3
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {steps.map((step) => {
              const isActive = step.number === currentStep;
              const isPast = step.number < currentStep;

              return (
                <div key={step.number} className="flex flex-col gap-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-[#14274B]">
                    <motion.div
                      className={`h-full ${
                        isPast
                          ? "bg-emerald-500"
                          : isActive
                          ? "bg-gradient-to-r from-[#D9A441] to-[#BF841F]"
                          : "bg-transparent"
                      }`}
                      initial={false}
                      animate={{ width: isPast || isActive ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold">
                    <span
                      className={`truncate ${
                        isActive
                          ? "text-[#D9A441] dark:text-[#E6B758] font-black"
                          : isPast
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isPast && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-5 scrollbar-thin">
          <AnimatePresence mode="wait">
            {/* ========================================================= */}
            {/* STEP 1: اختيار المظهر (THEME SELECTION) */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <motion.div
                key="step-theme"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    اختيار مظهر المنصة
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    حدد المظهر الذي يناسبك لتصفح مريح للمحتوى
                  </p>
                </div>

                {/* 3 Theme Choice Cards */}
                <div className="grid grid-cols-1 gap-3 pt-1">
                  {[
                    {
                      id: "light" as ThemeMode,
                      title: "المظهر الفاتح",
                      desc: "ألوان ناصعة وواضحة تناسب القراءة في ضوء النهار",
                      icon: Sun,
                      badge: "نهاري",
                      badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
                      previewBg: "bg-slate-100 border-slate-300 text-slate-800",
                    },
                    {
                      id: "dark" as ThemeMode,
                      title: "المظهر الداكن (Dark Navy)",
                      desc: "درجات كحلية مريحة للعينين وموفرة للبطارية",
                      icon: Moon,
                      badge: "كحلي ليلي",
                      badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300",
                      previewBg: "bg-[#070F1E] border-[#1E355B] text-slate-100",
                    },
                    {
                      id: "system" as ThemeMode,
                      title: "المظهر الافتراضي للنظام",
                      desc: "يتكيف تلقائياً مع إعدادات هاتفك",
                      icon: Smartphone,
                      badge: "تلقائي",
                      badgeColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
                      previewBg: "bg-gradient-to-r from-slate-100 via-slate-300 to-[#070F1E] text-slate-700",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setTheme(item.id)}
                        className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative flex items-start justify-between gap-3.5 ${
                          isSelected
                            ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-[#D9A441]/20 dark:via-[#132547] dark:to-[#0D1A33] border-[#D9A441] dark:border-[#D9A441] shadow-md ring-2 ring-[#D9A441]/30"
                            : "bg-slate-50/70 dark:bg-[#0D1A33]/70 border-slate-200/80 dark:border-[#1B3258] hover:bg-slate-100 dark:hover:bg-[#11223F]"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`p-2.5 rounded-2xl shrink-0 transition-colors ${
                              isSelected
                                ? "bg-gradient-to-br from-[#D9A441] to-[#BF841F] text-white shadow-sm"
                                : "bg-white dark:bg-[#14274B] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-[#223F70]"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                                {item.title}
                              </h3>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        {/* Selection Radio Indicator */}
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? "border-[#D9A441] bg-[#D9A441] text-white shadow-xs"
                              : "border-slate-300 dark:border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtle eye safety note */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    يمكنك تغيير هذا الاختيار في أي وقت لاحقاً من قسم التفضيلات والإعدادات داخل حسابك.
                  </span>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: حجم النص (TEXT SIZE SLIDER & PREVIEW) */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <motion.div
                key="step-text-size"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Type className="w-5 h-5 text-indigo-500" />
                    تحديد حجم النصوص في المنصة
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    يتم تطبيق حجم الخط المختار على كافة نصوص وعناصر المنصة بالكامل لضمان قراءة مريحة.
                  </p>
                </div>

                {/* Main Interactive Slider Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#0D1A33] border border-slate-200/80 dark:border-[#1E355B] space-y-6">
                  {/* Slider Level Display */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#D9A441]" />
                      المستوى الحالي:
                    </span>
                    <span className="px-3.5 py-1 rounded-full bg-[#D9A441]/15 text-[#BF841F] dark:text-[#E6B758] border border-[#D9A441]/30 font-black text-xs sm:text-sm">
                      {getTextSizeLabel()} ({TEXT_SIZE_MAP[textSize].px})
                    </span>
                  </div>

                  {/* Visual Slider Track */}
                  <div className="space-y-3 px-2">
                    <div className="relative flex items-center select-none py-1">
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full h-2.5 bg-slate-200 dark:bg-[#14274B] rounded-lg appearance-none cursor-pointer accent-[#D9A441] focus:outline-none"
                      />
                    </div>

                    {/* Step Labels: تكبير ————— وسط ————— تصغير */}
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      {[
                        { val: 1, mode: "small" as TextSizeMode, label: "تصغير (14px)" },
                        { val: 2, mode: "medium" as TextSizeMode, label: "وسط (16px)" },
                        { val: 3, mode: "large" as TextSizeMode, label: "تكبير (18.5px)" },
                      ].map((item) => {
                        const isCurrent = sliderValue === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSliderValue(item.val)}
                            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              isCurrent
                                ? "text-[#D9A441] dark:text-[#E6B758] font-black scale-105"
                                : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                            }`}
                          >
                            <span className="text-xs sm:text-sm">{item.label.split(" ")[0]}</span>
                            <span className="text-[10px] opacity-75">{item.label.split(" ")[1]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Text Preview Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#071124] border border-slate-200/80 dark:border-[#1E355B] space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-[#172A4E] pb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      معاينة حية للنصوص والمقالات:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                      تطبيق فوري
                    </span>
                  </div>

                  <div className="space-y-1.5 transition-all duration-200">
                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      منصة تعز الإعلامية: التغطية المباشرة للأحداث
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      متابعة حية ومستمرة لكلمات ومحاضرات قائد الثورة، وبرامج هدي القرآن، والأخبار والتقارير والأنشطة بمحافظة تعز.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: إعدادات الإشعارات (NOTIFICATIONS SECTIONS TOGGLES) */}
            {/* ========================================================= */}
            {currentStep === 3 && (
              <motion.div
                key="step-notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-rose-500" />
                      إعدادات الإشعارات والتنبيهات
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      حدد الأقسام التي ترغب في استلام إشعارات فورية منها.
                    </p>
                  </div>

                  {/* Quick toggle all action */}
                  <button
                    type="button"
                    onClick={() => handleToggleAll(!areAllEnabled)}
                    className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#132547] dark:hover:bg-[#1A315C] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#223F70] transition-colors cursor-pointer"
                  >
                    {areAllEnabled ? "تعطيل الكل" : "تفعيل الكل"}
                  </button>
                </div>

                {/* 8 Notification Channel Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {NOTIFICATION_CHANNELS_LIST.map((channel) => {
                    const Icon = channel.icon;
                    const isEnabled = !!notificationChannels[channel.id];

                    return (
                      <div
                        key={channel.id}
                        onClick={() => handleToggleChannel(channel.id)}
                        className={`p-3 sm:p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isEnabled
                            ? "bg-slate-50 dark:bg-[#0D1A33] border-slate-300 dark:border-[#1E355B] shadow-xs"
                            : "bg-slate-100/60 dark:bg-[#07101E]/60 border-slate-200/60 dark:border-slate-800/60 opacity-60 hover:opacity-80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${channel.bgColor} ${channel.borderColor} border`}>
                            <Icon className={`w-4 h-4 ${channel.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {channel.name}
                            </h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-[140px]">
                              {channel.description}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Toggle Switch */}
                        <div
                          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                            isEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <motion.div
                            layout
                            className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center ${
                              isEnabled ? "mr-auto" : "ml-auto"
                            }`}
                          >
                            {isEnabled ? (
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            ) : (
                              <X className="w-2.5 h-2.5 text-slate-400 stroke-[2.5]" />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Permission Hint Note */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    سيتم حفظ هذه التفضيلات محلياً ومزامنتها، وتستطيع تعديلها أو إيقافها في أي وقت من الإعدادات.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Bottom Navigation Bar */}
        <div className="px-5 sm:px-8 py-4 bg-slate-50/80 dark:bg-[#071124]/90 border-t border-slate-100 dark:border-[#172A4E] flex items-center justify-between gap-3 shrink-0">
          {/* Previous Button or Cancel */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-[#132547] dark:hover:bg-[#1A315C] text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : isManualReopen ? (
            <button
              type="button"
              onClick={onComplete}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-[#132547] text-slate-600 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              إلغاء
            </button>
          ) : (
            <div />
          )}

          {/* Next Button or Finish Setup Button */}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#BF841F] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#D9A441]/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isFinishing ? "جاري الحفظ..." : "إنهاء الإعداد وبدء الاستخدام"}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
