import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone,
  Newspaper,
  Tv,
  User,
  BookOpen,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  List,
  Clock,
  Cloud,
  Radio,
  Menu,
  FileText,
  Volume2,
  Check
} from "lucide-react";

export const TOUR_STORAGE_KEY = "taiz_interactive_tour_completed";

export interface TourStep {
  id: string;
  targetPath: string;
  spotlightSelector: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  bullets: Array<{
    title: string;
    text: string;
  }>;
  positionPreference?: "top" | "bottom" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "step-bottom-nav",
    targetPath: "/",
    spotlightSelector: "#tour-bottom-nav",
    badge: "1 من 7",
    title: "شريط التنقل السفلي الرئيسي",
    icon: Smartphone,
    description: "شريط التنقل السفلي متاح دائماً بأسفل الشاشة لتمكينك من الوصول السريع والتنقل السلس بين الأقسام الرئيسية للمنصة:",
    bullets: [
      { title: "الرئيسية", text: "متابعة الأخبار والتقارير الميدانية والمقالات." },
      { title: "ميديا", text: "مشاهدة البث الفضائي والاستماع للإذاعات الصوتية." },
      { title: "السيد القائد", text: "استعراض خطابات وكلمات ومحاضرات قائد الثورة." },
      { title: "هدي القرآن", text: "متابعة دروس الهداية، المصحف، والمقرر اليومي." },
      { title: "أنشطة ومناسبات", text: "استعراض التغطيات الميدانية والتقويم الهجري." }
    ],
    positionPreference: "top"
  },
  {
    id: "step-home",
    targetPath: "/",
    spotlightSelector: "#home-main-section",
    badge: "2 من 7",
    title: "قسم الرئيسية - الأخبار والمقالات",
    icon: Newspaper,
    description: "الواجهة الإخبارية التفاعلية المحدثة على مدار الساعة لتغطية كافة المستجدات الأحداث المحلية والدولية:",
    bullets: [
      { title: "التنقل بين التبويبات", text: "التبديل بسهولة بين «الأخبار والتقارير» و «مقالات وآراء»." },
      { title: "محتويات القسم", text: "شريط الأخبار العاجلة، السلايدر الرئيسي، التغطيات، وأحدث الفيديوهات." },
      { title: "التفاعل مع المحتوى", text: "الضغط على أي خبر لقراءته كاملاً، مشاركته، أو حفظه في مفضلتك." }
    ],
    positionPreference: "center"
  },
  {
    id: "step-watch",
    targetPath: "/watch",
    spotlightSelector: "#watch-main-section",
    badge: "3 من 7",
    title: "قسم ميديا - البث المباشر والإذاعات",
    icon: Tv,
    description: "مركزم المرئي والصوتي الشامل لمتابعة البث التلفزيوني المباشر والإذاعات الصوتية:",
    bullets: [
      { title: "تبويب البث التلفزيوني", text: "اختيار القناة الفضائية المناسبة ومتابعة البث المباشر والتنقل بين القنوات." },
      { title: "تبويب الإذاعات الصوتية", text: "اختيار الإذاعة المحلية أو إذاعة القرآن الكريم وتشغيل الاستماع الصوتي فوراً." },
      { title: "الأرشيف المرئي والمسموع", text: "استعراض البرامج المصورة، المقابلات الميدانية، والتقارير المرئية." }
    ],
    positionPreference: "center"
  },
  {
    id: "step-leader",
    targetPath: "/leader",
    spotlightSelector: "#leader-main-section",
    badge: "4 من 7",
    title: "قسم مكتبة قائد الثورة",
    icon: User,
    description: "المكتبة الهدائية الشاملة لجميع خطابات، كلمات، ومحاضرات السيد القائد عبدالملك بدرالدين الحوثي:",
    bullets: [
      { title: "بطاقات المحتوى", text: "بطاقات مصممة ومنظمة حسب طبيعة المحتوى (الخطابات، الكلمات، والمحاضرات)." },
      { title: "طريقة الاستعراض", text: "اختيار البطاقة بنقرة واحدة والتنقل بين الأرشيف والمحتويات المرتبطة بها." },
      { title: "وسائط متعددة", text: "القراءة النصية، الاستماع الصوتي، أو مشاهدة التسجيل المرئي للخطابات." }
    ],
    positionPreference: "center"
  },
  {
    id: "step-quran",
    targetPath: "/quran",
    spotlightSelector: "#quran-main-section",
    badge: "5 من 7",
    title: "قسم هدى القرآن والدروس",
    icon: BookOpen,
    description: "مكتبة قرآنية ودروس هداية متكاملة تهدف للتزكية والاستنارة بكتاب الله وهديه:",
    bullets: [
      { title: "تبويب الدروس", text: "استعراض السلاسل والمحاضرات، والدخول إلى «مقرر الدروس» المعتمد لمتابعة برنامج اليوم." },
      { title: "تبويب القرآن الكريم", text: "قراءة المصحف الشريف، اختيار السور، والاستماع إلى التلاوات العذبة." },
      { title: "القائمة الجانبية (☰)", text: "الوصول عبر زر القائمة أعلى القسم للبحث، الفهارس، والتلاوات الصوتية." }
    ],
    positionPreference: "center"
  },
  {
    id: "step-events",
    targetPath: "/events",
    spotlightSelector: "#events-main-section",
    badge: "6 من 7",
    title: "قسم أنشطة ومناسبات والتقويم الهجري",
    icon: Calendar,
    description: "تغطية كاملة للفعاليات الميدانية والأنشطة المجتمعية مع تقويم هجري معتمد:",
    bullets: [
      { title: "الأنشطة والفعاليات", text: "استعراض الفعاليات الثقافية والاجتماعية والوقفات التضامنية بصلب المحافظة." },
      { title: "التقويم الهجري", text: "تقويم هجري محدث متزامن مع المناسبات الدينية والوطنية لاستعراض تواريخها وأحداثها." }
    ],
    positionPreference: "center"
  },
  {
    id: "step-header-widgets",
    targetPath: "/",
    spotlightSelector: "#tour-top-header",
    badge: "7 من 7",
    title: "الهيدر العلوي - خدمات سريعة",
    icon: Sparkles,
    description: "الشريط العلوي الموحد بأعلى الشاشة يمنحك أدوات ومعلومات مفيدة ومحدثة باستمرار:",
    bullets: [
      { title: "التاريخ الهجري", text: "يعرض اليوم والشهر والتاريخ الهجري المعتمد." },
      { title: "مؤقت الصلاة", text: "يوضح مواقيت الصلوات الخمس والعد التنازلي للصلاة القادمة والتنبيه بالأذان." },
      { title: "حالة الطقس", text: "يعرض درجات الحرارة والأجواء الحالية المتوقعة لمحافظة تعز." }
    ],
    positionPreference: "bottom"
  }
];

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Auto navigate to the step's page when current step changes
  useEffect(() => {
    if (!isOpen) return;

    if (step && location.pathname !== step.targetPath) {
      navigate(step.targetPath);
    }
  }, [currentStepIndex, isOpen, step, location.pathname, navigate]);

  // Recalculate target element bounding rectangle for highlight overlay
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (!step?.spotlightSelector) {
        setRect(null);
        return;
      }

      const el = document.querySelector(step.spotlightSelector);
      if (el) {
        // Bring into soft view
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const bounds = el.getBoundingClientRect();
        setRect(bounds);
      } else {
        setRect(null);
      }
    };

    // Immediate check + delay check for page transition completion
    updateRect();
    const timer = setTimeout(updateRect, 350);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStepIndex, isOpen, step, location.pathname]);

  if (!isOpen) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch (e) {
      console.warn("Unable to write tour state to storage", e);
    }
    onClose();
  };

  const IconComp = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        key="interactive-tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[99999] overflow-hidden select-none font-sans"
        dir="rtl"
      >
        {/* Dimming Backdrop Mask */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto" />

        {/* Glowing Highlight Box on Targeted UI Element if found */}
        {rect && rect.width > 0 && rect.height > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              top: `${Math.max(0, rect.top - 6)}px`,
              left: `${Math.max(0, rect.left - 6)}px`,
              width: `${rect.width + 12}px`,
              height: `${rect.height + 12}px`,
            }}
            className="absolute rounded-2xl pointer-events-none z-10 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] bg-white/5 dark:bg-amber-400/10 animate-pulse"
          />
        )}

        {/* Center/Floating Responsive Tour Card */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end sm:justify-center items-center p-3 sm:p-4 z-20">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-lg bg-white dark:bg-[#0C1A32] border-2 border-amber-500/40 dark:border-amber-500/50 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col my-auto max-h-[85vh]"
          >
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-[#015028] via-[#086B3A] to-[#015028] dark:from-[#09152B] dark:via-[#132549] dark:to-[#09152B] p-4 sm:p-5 text-white flex items-center justify-between border-b border-amber-400/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black font-cairo text-amber-300 uppercase tracking-widest">
                    الجولة التعريفية • {step.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-black font-cairo text-white leading-tight">
                    {step.title}
                  </h3>
                </div>
              </div>

              {/* Skip Tour Button */}
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold font-cairo text-amber-200 border border-amber-300/30 transition-all cursor-pointer shrink-0"
                title="إنهاء الجولة والبدء باستخدام المنصة"
              >
                <span>تخطي</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Card Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-right leading-relaxed font-cairo">
              {/* Step Description */}
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-normal">
                {step.description}
              </p>

              {/* Bullet Points */}
              <div className="space-y-2.5 pt-1">
                {step.bullets.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-[#071020] border border-slate-200/80 dark:border-[#1E355B]/60 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-xs font-black text-slate-900 dark:text-amber-300">
                        {b.title}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">
                        {b.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons Bar */}
            <div className="bg-slate-100/80 dark:bg-[#081223] px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-200 dark:border-[#1E355B] flex items-center justify-between gap-3 shrink-0">
              {/* Back Button */}
              {!isFirstStep ? (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-2xl bg-white dark:bg-[#13233F] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#223B69] font-bold text-xs font-cairo active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              ) : (
                <div />
              )}

              {/* Steps Progress Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? "w-6 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        : "w-2 bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* Next / Finish Button */}
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 h-10 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs font-cairo transition-all cursor-pointer shadow-[0_4px_16px_rgba(245,158,11,0.35)] shrink-0"
              >
                <span>{isLastStep ? "ابدأ الاستخدام" : "التالي"}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
