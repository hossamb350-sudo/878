import { useEffect, useState } from "react";
import { SplashScreen as CapSplashScreen } from "@capacitor/splash-screen";
import { Newspaper, BookOpen, Play } from "lucide-react";
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
            
            // If the webp version failed to load, try the png version of the same splash screen
            if (target.src.endsWith(".webp")) {
              target.src = target.src.replace(".webp", ".png");
              return;
            }
            
            // If the png custom splash failed, fall back to the general splash.png
            if (target.src.includes("splash_first") || target.src.includes("splash_subsequent")) {
              target.src = "/splash.png";
              return;
            }
            
            // If even the fallback splash.png fails, show the app content
            setIsLoaded(true);
          }}
        />
      )}

      {/* Interactive sliding cards for first launch only */}
      {isLoaded && isFirstLaunch && (
        <div className="absolute inset-x-0 top-[58%] -translate-y-1/2 flex flex-col items-center justify-center px-4 z-20">
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
                    scale: isActive ? 1.1 : 0.9,
                    y: isActive ? -6 : 6,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                    mass: 0.8
                  }}
                  className={`w-24 sm:w-28 h-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? "bg-[#162a45]/95 border-[#34619b]/80 shadow-[0_0_20px_rgba(52,97,155,0.4)] text-white"
                      : "bg-[#0f1b2d]/80 border-white/10 text-white/60 hover:bg-[#162a45]/50"
                  }`}
                >
                  {/* Icon wrapper circular border */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#34619b]/30 text-[#60a5fa] border border-[#34619b]/50 shadow-[0_0_15px_rgba(52,97,155,0.3)]"
                        : "bg-white/5 text-white/30 border border-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  </div>
                  
                  {/* Main Title */}
                  <h3
                    className={`text-[10px] sm:text-xs font-black mt-2.5 transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/70"
                    }`}
                  >
                    {card.title}
                  </h3>
                  
                  {/* Subtitle */}
                  <p
                    className={`text-[8px] sm:text-[9px] font-black mt-0.5 transition-colors duration-300 ${
                      isActive ? "text-[#eab355]" : "text-white/50"
                    }`}
                  >
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

          {/* Slogan phrase below the cards */}
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] sm:text-[11px] font-black text-white mt-6 text-center max-w-xs leading-relaxed"
          >
            منصة إخبارية ثقافية متكاملة تنقل الواقع وتستنير بالقرآن والقائد
          </motion.p>

          {/* Google Sign-In and Skip Button Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-2.5 w-full max-w-[240px] relative z-30"
          >
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-gradient-to-r from-[#d49a37] to-[#b37f2c] hover:from-[#e3ab4a] hover:to-[#c48f33] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer shadow-md active:scale-95 duration-200"
            >
              <span>تسجيل الدخول / إنشاء حساب</span>
            </button>

            <button
              onClick={handleSkip}
              className="text-[11px] font-black text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer underline underline-offset-4 decoration-2"
            >
              تخطي تسجيل الدخول
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
        </div>
      )}
    </div>
  );
}
