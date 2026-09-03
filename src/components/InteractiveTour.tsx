import React, { useState, useEffect, useRef } from "react";
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
  preferredPlacement?: "top" | "bottom" | "auto";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "step-bottom-nav",
    targetPath: "/",
    spotlightSelector: "#tour-bottom-nav",
    badge: "1 من 7",
    title: "شريط التنقل السفلي الرئيسي",
    icon: Smartphone,
    description: "شريط التنقل ثابت أسفل الشاشة ليتيح لك التنقل السريع والمباشر بين كافة أقسام المنصة:",
    bullets: [
      { title: "الرئيسية", text: "الأخبار والتقارير الميدانية والمقالات." },
      { title: "ميديا", text: "البث التلفزيوني المباشر والإذاعات الصوتية." },
      { title: "السيد القائد", text: "خطابات، كلمات، ومحاضرات قائد الثورة." },
      { title: "هدي القرآن", text: "دروس الهداية الثقافية والمصحف الشريف." },
      { title: "أنشطة ومناسبات", text: "التغطيات الميدانية والتقويم الهجري." }
    ],
    preferredPlacement: "top"
  },
  {
    id: "step-home-tabs",
    targetPath: "/",
    spotlightSelector: "#tour-home-tabs",
    badge: "2 من 7",
    title: "تبويبات الأخبار والمقالات",
    icon: Newspaper,
    description: "متابعة التغطية الإخبارية اليومية الشاملة والتحليلات السياسية والفكرية:",
    bullets: [
      { title: "الأخبار والتقارير", text: "الأخبار العاجلة والتغطيات الميدانية للحدث." },
      { title: "مقالات وآراء", text: "مقالات تحليلية ورؤى كتابية ومستجدات الرأي." },
      { title: "التفاعل مع المحتوى", text: "نقرة واحدة لقراءة المقال أو الخبر ومشاركته." }
    ],
    preferredPlacement: "bottom"
  },
  {
    id: "step-watch-channels",
    targetPath: "/watch",
    spotlightSelector: "#tour-watch-channels",
    badge: "3 من 7",
    title: "قسم ميديا - البث المباشر والإذاعات",
    icon: Tv,
    description: "المركز المرئي والصوتي لمتابعة القنوات الفضائية والإذاعات المحلية:",
    bullets: [
      { title: "البث التلفزيوني", text: "مشاهدة البث المباشر للقنوات الفضائية وتغيير القناة بسهولة." },
      { title: "الإذاعات الصوتية", text: "الاستماع المباشر لإذاعات القرآن الكريم والإذاعات المحلية." },
      { title: "الأرشيف التفاعلي", text: "استعراض البرامج المصورة والمقابلات الميدانية." }
    ],
    preferredPlacement: "bottom"
  },
  {
    id: "step-leader",
    targetPath: "/leader",
    spotlightSelector: "#leader-main-section",
    badge: "4 من 7",
    title: "مكتبة السيد القائد",
    icon: User,
    description: "مكتبة هداية شاملة لجميع خطابات وكلمات ومحاضرات السيد القائد عبدالملك بدرالدين الحوثي:",
    bullets: [
      { title: "بطاقات المحتوى", text: "بطاقات منظمة حسب طبيعة المحتوى (خطابات، كلمات، محاضرات)." },
      { title: "وسائط متعددة", text: "قراءة النص، الاستماع للصوت، أو مشاهدة الفيديو." }
    ],
    preferredPlacement: "bottom"
  },
  {
    id: "step-quran",
    targetPath: "/quran",
    spotlightSelector: "#tour-quran-tabs",
    badge: "5 من 7",
    title: "قسم هدى القرآن والدروس",
    icon: BookOpen,
    description: "مكتبة الدروس والبرامج الثقافية للقرآن الكريم مع زر القائمة الجانبية (☰):",
    bullets: [
      { title: "تبويب الدروس", text: "استعراض السلاسل والمقرر اليومي المعتمد." },
      { title: "تبويب القرآن الكريم", text: "قراءة وتلاوة المصحف الشريف بالكامل." },
      { title: "زر القائمة (☰)", text: "الوصول للفهارس، التلاوات، والبحث السريع." }
    ],
    preferredPlacement: "bottom"
  },
  {
    id: "step-events",
    targetPath: "/events",
    spotlightSelector: "#events-main-section",
    badge: "6 من 7",
    title: "أنشطة ومناسبات والتقويم الهجري",
    icon: Calendar,
    description: "تغطية الأنشطة الميدانية المجتمعية مع تقويم هجري معتمد للمناسبات:",
    bullets: [
      { title: "الفعاليات والأنشطة", text: "استعراض الأنشطة والوقفات الميدانية في محافظة تعز." },
      { title: "التقويم الهجري", text: "جدول هجري محدث بالمناسبات الدينية والوطنية." }
    ],
    preferredPlacement: "bottom"
  },
  {
    id: "step-header-widgets",
    targetPath: "/",
    spotlightSelector: "#tour-top-header",
    badge: "7 من 7",
    title: "الهيدر العلوي - خدمات سريعة",
    icon: Sparkles,
    description: "شريط المعلومات التفاعلي بالأعلى يمنحك التوقيت والأحوال الجوية فورياً:",
    bullets: [
      { title: "التاريخ الهجري", text: "يعرض اليوم والتاريخ الهجري والميلادي المعتمد." },
      { title: "مؤقت الصلاة", text: "مواقيت الصلوات الخمس والعد التنازلي لموعد الأذان." },
      { title: "حالة الطقس", text: "درجات الحرارة والأجواء الحالية لمحافظة تعز." }
    ],
    preferredPlacement: "bottom"
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [measuredTooltipHeight, setMeasuredTooltipHeight] = useState(240);

  const step = TOUR_STEPS[currentStepIndex];

  // Navigate to target route if needed
  useEffect(() => {
    if (!isOpen || !step) return;

    if (location.pathname !== step.targetPath) {
      navigate(step.targetPath);
    }
  }, [currentStepIndex, isOpen, step, location.pathname, navigate]);

  // Recalculate target element bounding rect
  useEffect(() => {
    if (!isOpen || !step) return;

    const updateRect = () => {
      const el = document.querySelector(step.spotlightSelector);
      if (el) {
        // Bring element cleanly into view
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const bounds = el.getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0) {
          setRect(bounds);
        } else {
          setRect(null);
        }
      } else {
        setRect(null);
      }
    };

    updateRect();
    const t1 = setTimeout(updateRect, 300);
    const t2 = setTimeout(updateRect, 650);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStepIndex, isOpen, step, location.pathname]);

  // Measure tooltip actual height
  useEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.offsetHeight;
      if (h > 60 && h !== measuredTooltipHeight) {
        setMeasuredTooltipHeight(h);
      }
    }
  }, [currentStepIndex, measuredTooltipHeight, rect]);

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

  // Calculate Tooltip Position & Arrow Pointer
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 380;
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 600;
  const tooltipWidth = Math.min(380, screenWidth - 24);

  let placement: "above" | "below" = "below";
  let tooltipY = 20;
  let tooltipX = (screenWidth - tooltipWidth) / 2;
  let arrowX = tooltipWidth / 2;

  if (rect) {
    const targetCenterX = rect.left + rect.width / 2;
    const spaceBelow = screenHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Decide whether to place ABOVE or BELOW element
    if (
      rect.bottom >= screenHeight - 90 ||
      step.preferredPlacement === "top" ||
      (spaceBelow < measuredTooltipHeight + 20 && spaceAbove > measuredTooltipHeight)
    ) {
      placement = "above";
      tooltipY = rect.top - measuredTooltipHeight - 14;
    } else {
      placement = "below";
      tooltipY = rect.bottom + 14;
    }

    // Clamp Y to stay inside screen padding
    tooltipY = Math.max(12, Math.min(screenHeight - measuredTooltipHeight - 12, tooltipY));

    // Calculate X position
    tooltipX = targetCenterX - tooltipWidth / 2;
    tooltipX = Math.max(12, Math.min(screenWidth - tooltipWidth - 12, tooltipX));

    // Calculate Arrow pointer X relative to tooltip
    arrowX = targetCenterX - tooltipX;
    arrowX = Math.max(24, Math.min(tooltipWidth - 24, arrowX));
  }

  return (
    <AnimatePresence>
      <motion.div
        key="interactive-coach-mark-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[99990] overflow-hidden select-none font-cairo"
        dir="rtl"
      >
        {/* Dimming Backdrop SVG Mask with Cutout Hole over Target Element */}
        {rect ? (
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[99991]">
            <defs>
              <mask id="tour-spotlight-cutout">
                {/* Dimmed background */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Black cutout = 100% transparent spotlight over element */}
                <rect
                  x={Math.max(0, rect.left - 6)}
                  y={Math.max(0, rect.top - 6)}
                  width={rect.width + 12}
                  height={rect.height + 12}
                  rx={16}
                  ry={16}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.70)"
              mask="url(#tour-spotlight-cutout)"
            />
          </svg>
        ) : (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none z-[99991]" />
        )}

        {/* Glowing Highlight Box Frame around Targeted UI Element */}
        {rect && (
          <motion.div
            layoutId="tour-glowing-frame"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{
              position: "fixed",
              top: `${Math.max(0, rect.top - 6)}px`,
              left: `${Math.max(0, rect.left - 6)}px`,
              width: `${rect.width + 12}px`,
              height: `${rect.height + 12}px`,
            }}
            className="fixed pointer-events-none z-[99992] rounded-2xl border-2 border-amber-400 dark:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] ring-4 ring-amber-400/25 animate-pulse"
          />
        )}

        {/* Floating Tooltip / Coach Mark Popover */}
        <motion.div
          ref={tooltipRef}
          key={step.id}
          initial={{ opacity: 0, y: placement === "below" ? 15 : -15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: placement === "below" ? -10 : 10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          style={{
            position: "fixed",
            top: `${tooltipY}px`,
            left: `${tooltipX}px`,
            width: `${tooltipWidth}px`,
          }}
          className="z-[99995] pointer-events-auto bg-white dark:bg-[#0C1A32] border-2 border-amber-500/50 dark:border-amber-500/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col font-cairo"
        >
          {/* Arrow Pointer pointing directly to the highlighted element */}
          {rect && (
            <div
              style={{ left: `${arrowX}px` }}
              className={`absolute w-3.5 h-3.5 bg-white dark:bg-[#0C1A32] border-amber-500/50 dark:border-amber-500/60 rotate-45 z-10 -translate-x-1/2 ${
                placement === "below"
                  ? "-top-2 border-t-2 border-r-0 border-b-0 border-l-2"
                  : "-bottom-2 border-t-0 border-r-2 border-b-2 border-l-0"
              }`}
            />
          )}

          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#015028] via-[#086B3A] to-[#015028] dark:from-[#09152B] dark:via-[#132549] dark:to-[#09152B] p-3 sm:p-3.5 text-white flex items-center justify-between border-b border-amber-400/30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                <IconComp className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">
                  تلميح تفاعلي • {step.badge}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                  {step.title}
                </h3>
              </div>
            </div>

            {/* Skip Button */}
            <button
              onClick={handleComplete}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-bold text-amber-200 border border-amber-300/30 transition-all cursor-pointer shrink-0"
              title="إنهاء الجولة"
            >
              <span>تخطي</span>
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3.5 space-y-2.5 overflow-y-auto max-h-[42vh] text-right text-slate-800 dark:text-slate-100">
            <p className="text-xs font-bold leading-normal text-slate-700 dark:text-slate-200">
              {step.description}
            </p>

            <div className="space-y-1.5 pt-0.5">
              {step.bullets.map((b, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#071020] border border-slate-200/80 dark:border-[#1E355B]/60 flex items-start gap-2 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <div className="flex flex-col space-y-0.5 min-w-0">
                    <span className="text-[11px] font-black text-slate-900 dark:text-amber-300 leading-tight">
                      {b.title}
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
                      {b.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Navigation Bar */}
          <div className="bg-slate-100/90 dark:bg-[#081223] px-3 py-2 border-t border-slate-200 dark:border-[#1E355B] flex items-center justify-between gap-2 shrink-0">
            {/* Back Button */}
            {!isFirstStep ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 h-8 rounded-xl bg-white dark:bg-[#13233F] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#223B69] font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            ) : (
              <div />
            )}

            {/* Step Dots Indicator */}
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? "w-5 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                      : "w-1.5 bg-slate-300 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>

            {/* Next / Finish Button */}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 h-8 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shrink-0"
            >
              <span>{isLastStep ? "إنهاء" : "التالي"}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
