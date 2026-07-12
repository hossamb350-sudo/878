import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Newspaper, BookOpen, Tv } from "lucide-react";

interface OnboardingCard {
  id: number;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const CARDS: OnboardingCard[] = [
  {
    id: 0,
    title: "أخبار وتقارير لحظة بلحظة",
    description: "تغطية شاملة وموثوقة لكافة المستجدات المحلية والدولية فور حدوثها",
    icon: Newspaper,
  },
  {
    id: 1,
    title: "محاضرات السيد القائد ودروس هدي القرآن",
    description: "متابعة متكاملة لكافة الكلمات والدروس والمحاضرات الثقافية والقرآنية",
    icon: BookOpen,
  },
  {
    id: 2,
    title: "محتوى مرئي متجدد",
    description: "مجموعة غنية من التقارير المصورة، الفلاشات، والمقاطع الحصرية بجودة عالية",
    icon: Tv,
  },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if the app has been launched before
    const alreadyLaunched = localStorage.getItem("taiz_app_already_launched");
    const isFirst = alreadyLaunched !== "true";
    setIsFirstLaunch(isFirst);

    if (isFirst) {
      // First launch: Cycle through the 3 cards.
      // Each card displays for 3 seconds. Total 9 seconds.
      const interval = setInterval(() => {
        setActiveCardIndex((prev) => {
          if (prev < CARDS.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            // Transition to main app automatically after 9 seconds total
            localStorage.setItem("taiz_app_already_launched", "true");
            onComplete();
            return prev;
          }
        });
      }, 3000);

      return () => clearInterval(interval);
    } else {
      // Subsequent launch: display background only for 3 seconds, then transition
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  // Use the subsequent image for both first and subsequent launches as requested
  const imageSrc = "/splash_subsequent.png";

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070d19] flex flex-col justify-between select-none overflow-hidden pb-safe">
      {/* Background Image (fills the screen completely, maintain ratio, no distortion) */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageSrc}
          alt="شاشة البداية"
          className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            isLoaded ? "opacity-35" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/splash.png"; // Fallback to original splash image if needed
          }}
          referrerPolicy="no-referrer"
        />
        {/* Rich gradient overlay to enhance text readability on top of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d19] via-[#070d19]/80 to-transparent" />
      </div>

      {/* Top Brand Branding */}
      <div className="relative z-10 w-full pt-16 flex flex-col items-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <span className="font-black text-2xl sm:text-3xl text-white tracking-wide mb-1 drop-shadow-md">
            منصة تعز الإعلامية
          </span>
          <span className="text-xs font-bold text-taiz-sky tracking-widest uppercase opacity-90">
            إخبارية .. ثقافية | TAIZ MEDIA PLATFORM
          </span>
        </motion.div>
      </div>

      {/* Center Onboarding Cards Carousel (Only for First Launch) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8">
        {isFirstLaunch && (
          <div className="w-full max-w-md flex flex-col items-center" dir="rtl">
            <div className="relative w-full h-56 flex items-center justify-center overflow-visible">
              <AnimatePresence mode="popLayout">
                {CARDS.map((card, idx) => {
                  const offset = idx - activeCardIndex;
                  const isActive = idx === activeCardIndex;

                  // Only render the card if it is close to the active card to maintain sliding visual sequence
                  if (Math.abs(offset) > 1) return null;

                  return (
                    <motion.div
                      key={card.id}
                      style={{
                        position: "absolute",
                        zIndex: isActive ? 30 : 20 - Math.abs(offset),
                      }}
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                        x: offset > 0 ? 150 : -150,
                      }}
                      animate={{
                        opacity: isActive ? 1 : 0.4,
                        scale: isActive ? 1.05 : 0.9,
                        x: offset * 110, // side displacement for sequence visualization
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                        x: offset < 0 ? -150 : 150,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`w-[85%] max-w-xs p-6 rounded-3xl backdrop-blur-md flex flex-col items-center text-center transition-all ${
                        isActive
                          ? "bg-white/10 border-2 border-taiz-sky/60 shadow-lg shadow-taiz-sky/10"
                          : "bg-white/5 border border-white/5"
                      }`}
                    >
                      <div
                        className={`p-4 rounded-2xl mb-4 ${
                          isActive
                            ? "bg-taiz-sky/20 text-taiz-sky"
                            : "bg-white/5 text-white/40"
                        }`}
                      >
                        <card.icon className="w-8 h-8" />
                      </div>
                      <h4
                        className={`font-black text-base sm:text-lg mb-2 transition-colors duration-300 ${
                          isActive ? "text-white" : "text-white/60"
                        }`}
                      >
                        {card.title}
                      </h4>
                      <p className="text-xs text-white/70 leading-relaxed font-medium">
                        {card.description}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-2.5 mt-8 justify-center items-center">
              {CARDS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeCardIndex
                      ? "w-8 bg-taiz-sky"
                      : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright section */}
      <div className="relative z-10 w-full pb-8 flex justify-center text-center">
        <span className="text-[10px] font-bold text-white/40 tracking-wider">
          جميع الحقوق محفوظة © {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}
