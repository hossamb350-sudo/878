import { useEffect, useState } from "react";
import { SplashScreen as CapSplashScreen } from "@capacitor/splash-screen";
import { Newspaper, BookOpen, Play, User, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { UserProfile } from "../types";
import { AuthModals } from "./AuthModals";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isFirstLaunch, setIsFirstLaunch] = useState(() => {
    const alreadyLaunched = localStorage.getItem("taiz_app_already_launched");
    return alreadyLaunched !== "true";
  });

  const [imageSrc, setImageSrc] = useState<string>(() => {
    const alreadyLaunched = localStorage.getItem("taiz_app_already_launched");
    const isFirst = alreadyLaunched !== "true";
    // Prefer .webp for high performance (10x smaller), falls back to .png if unsupported
    return isFirst ? "/splash_first.webp" : "/splash_subsequent.webp";
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const cards = [
    {
      id: 0,
      title: "دروس من",
      subtitle: "هدي القرآن",
      icon: BookOpen,
    },
    {
      id: 1,
      title: "محتوى مرئي",
      subtitle: "متجدد",
      icon: Play,
    },
    {
      id: 2,
      title: "أخبار موثوقة",
      subtitle: "لحظة بلحظة",
      icon: Newspaper,
    },
  ];

  // Helper to hide native launch splash
  const hideNativeSplash = () => {
    CapSplashScreen.hide().catch((err) => {
      console.log("Not running on a native device or Capacitor SplashScreen plugin error", err);
    });
  };

  useEffect(() => {
    // Fallback safety: if image loading gets stuck or fails silently (e.g. in sandboxed iframe), force loaded state
    const loadFallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 5000);

    // Fallback safety to ensure native splash screen is hidden eventually
    const safetyTimer = setTimeout(() => {
      hideNativeSplash();
    }, 1000);

    return () => {
      clearTimeout(loadFallbackTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || isAuthenticating) return;

    const alreadyLaunched = localStorage.getItem("taiz_app_already_launched");
    
    // If it's the first launch (which shows splash_first.png), we do NOT auto-transition.
    // The user must explicitly click Google Sign-In or Skip.
    if (alreadyLaunched !== "true" || isFirstLaunch) {
      return;
    }

    // Subsequent launches auto-transition to the home screen after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoaded, onComplete, isAuthenticating, isFirstLaunch]);

  useEffect(() => {
    if (!isFirstLaunch || !isLoaded) return;

    const interval = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, [isFirstLaunch, isLoaded]);

  const handleSkip = () => {
    localStorage.setItem("taiz_app_already_launched", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b172a] flex items-center justify-center select-none overflow-hidden pb-safe">
      {imageSrc && (
        <img
          src={imageSrc}
          alt="شاشة البداية"
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            setIsLoaded(true);
            hideNativeSplash();
          }}
          onError={(e) => {
            hideNativeSplash();
            const target = e.target as HTMLImageElement;
            
            // If the webp version failed to load, try the png version
            if (target.src.endsWith(".webp")) {
              target.src = target.src.replace(".webp", ".png");
              return;
            }
            
            // If even the png fails, show the app content
            setIsLoaded(true);
          }}
        />
      )}

      {/* Interactive sliding cards for first launch only */}
      {isLoaded && isFirstLaunch && (
        <div className="absolute inset-x-0 top-[71%] -translate-y-1/2 flex flex-col items-center justify-center px-4 z-20">
          {/* Cards side-by-side horizontal track matching the uploaded reference video */}
          <div className="w-full max-w-md flex items-center justify-center gap-2 sm:gap-4 overflow-visible" dir="rtl">
            {cards.map((card, index) => {
              const isActive = index === activeCardIndex;
              const Icon = card.icon;

              return (
                <motion.div
                  key={card.id}
                  onClick={() => setActiveCardIndex(index)}
                  animate={{
                    scale: isActive ? 1.05 : 0.95,
                    y: isActive ? -4 : 4,
                    opacity: isActive ? 1 : 0.7,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 20,
                    mass: 1,
                    restDelta: 0.001
                  }}
                  style={{ 
                    willChange: "transform, opacity",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden"
                  }}
                  className="w-24 sm:w-28 h-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-300 border backdrop-blur-md bg-[#11284E]/[0.38] border-[#7DBEFF]/[0.28]"
                >
                  {/* Icon wrapper circular border */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border bg-[#5691FF]/[0.18] border-[#5CA9FF] ${
                      isActive
                        ? "shadow-[0_0_18px_rgba(78,161,255,0.35)] brightness-125"
                        : "brightness-90"
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#F5FAFF]" />
                  </div>
                  
                  {/* Main Title */}
                  <h3 className="text-[10px] sm:text-xs font-black mt-2.5 transition-colors duration-300 text-white">
                    {card.title}
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-[8px] sm:text-[9px] font-black mt-0.5 transition-colors duration-300 text-[#D9A441]">
                    {card.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2 mt-6 justify-center">
            {cards.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveCardIndex(index)}
                animate={{
                  width: index === activeCardIndex ? 20 : 6,
                  backgroundColor: index === activeCardIndex ? "#60a5fa" : "rgba(255, 255, 255, 0.2)",
                }}
                className="h-1.5 rounded-full cursor-pointer border-none focus:outline-none transition-all"
              />
            ))}
          </div>

          {/* Buttons & Auth Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col items-center w-full relative z-30"
          >
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-4/5 max-w-[320px] h-[60px] rounded-[32px] bg-gradient-to-r from-[#D9A441] to-[#BF841F] text-[#FFFFFF] font-bold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-[0_8px_20px_rgba(0,0,0,0.22)] active:scale-[0.98] active:brightness-95 relative overflow-hidden"
            >
              <div className="absolute inset-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[32px] pointer-events-none"></div>
              <User className="w-5 h-5 text-[#FFFFFF]" />
              <span>تسجيل الدخول / إنشاء حساب</span>
            </button>

            <button
              onClick={handleSkip}
              className="mt-6 flex flex-col items-center gap-2 group transition-all cursor-pointer active:scale-105"
            >
              <div className="w-12 h-12 rounded-full bg-[#5691FF]/[0.14] border border-[#5CA9FF] flex items-center justify-center shadow-[0_0_8px_rgba(127,195,255,0.1)] group-active:shadow-[0_0_15px_rgba(127,195,255,0.3)] transition-all">
                <ArrowLeft className="w-5 h-5 text-[#7FC3FF]" />
              </div>
              <span className="text-[#EAF4FF] text-sm font-medium">تخطي التسجيل</span>
            </button>

            <AuthModals
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              initialTab="login"
              onSuccess={() => {
                setIsAuthModalOpen(false);
                localStorage.setItem("taiz_app_already_launched", "true");
                onComplete();
              }}
            />
          </motion.div>
          
          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          >
            <p className="text-[#FFFFFF] font-bold text-base sm:text-lg">منصة إعلامية ثقافية متكاملة</p>
            <p className="text-[#D9A441] font-medium text-sm sm:text-[15px] leading-[1.25] mt-1">تنقل الواقع وتستنير بالقرآن والقائد</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
