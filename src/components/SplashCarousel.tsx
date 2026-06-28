import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashCarouselProps {
  activeIndex: number;
  onChangeIndex: (index: number) => void;
}

export function SplashCarousel({ activeIndex, onChangeIndex }: SplashCarouselProps) {
  useEffect(() => {
    const timer = setInterval(() => {
      onChangeIndex((activeIndex + 1) % 5);
    }, 1550); // Each text shown for ~1.55s (7.75s total)
    return () => clearInterval(timer);
  }, [activeIndex, onChangeIndex]);

  const slides = [
    { id: 0, text: "تغطية إعلامية شاملة" },
    { id: 1, text: "نوافيكم بالأخبار والتقارير لحظة بلحظة" },
    { id: 2, text: "محتوى مرئي متجدد" },
    { id: 3, text: "بث مباشر للقنوات الوطنية على مدار الساعة" },
    { id: 4, text: "دروس هدي القرآن" },
  ];

  return (
    <div className="w-full flex flex-col items-center select-none" dir="rtl">
      <div className="relative h-20 w-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <div className="text-taiz-navy text-xl sm:text-[1.75rem] font-[900] tracking-tight leading-relaxed drop-shadow-md">
              <span className="bg-gradient-to-l from-taiz-navy via-taiz-navy to-taiz-royal bg-clip-text text-transparent">
                {slides[activeIndex].text}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
