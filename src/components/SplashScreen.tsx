import { useEffect, useState } from "react";
import { SplashScreen as CapSplashScreen } from "@capacitor/splash-screen";
import { Newspaper, BookOpen, Play } from "lucide-react";
import { motion } from "motion/react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithCredential
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@southdevs/capacitor-google-auth";
import { UserProfile } from "../types";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isFirstLaunch = imageSrc === "/splash_first.png";

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
    // Check local storage to see if this is the first launch of the application
    const alreadyLaunched = localStorage.getItem("taiz_app_already_launched");
    
    let selectedImage = "/splash_subsequent.png";
    if (alreadyLaunched !== "true") {
      selectedImage = "/splash_first.png";
    }
    
    setImageSrc(selectedImage);

    // Fallback safety to ensure native splash screen is hidden eventually
    const safetyTimer = setTimeout(() => {
      hideNativeSplash();
    }, 1000);

    return () => {
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

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await (GoogleAuth.signIn as any)();
        if (googleUser.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          await syncUserProfile(userCredential.user);
        } else {
          throw new Error("No ID Token found");
        }
      } else {
        const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
        await syncUserProfile(userCredential.user);
      }
      localStorage.setItem("taiz_app_already_launched", "true");
      onComplete();
    } catch (err: any) {
      console.error("Google Auth error in Splash:", err);
      if (err.code === "auth/operation-not-allowed") {
        setAuthError("تسجيل الدخول عبر جوجل غير مفعل حالياً. يرجى التواصل مع الإدارة.");
      } else {
        setAuthError("حدث خطأ أثناء الاتصال بجوجل: " + (err.message || err));
      }
      setIsAuthenticating(false);
    }
  };

  const syncUserProfile = async (firebaseUser: any) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "مستخدم جديد",
          photoURL: firebaseUser.photoURL || undefined,
          role: "user",
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        await setDoc(userRef, newProfile);
      } else {
        await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not sync Firestore user profile:", e);
    }
  };

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
            // Fallback to /splash.png or /logo.png if the custom images are not yet uploaded or fail to load
            const target = e.target as HTMLImageElement;
            if (target.src.includes("splash_first") || target.src.includes("splash_subsequent")) {
              target.src = "/splash.png";
            }
          }}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Interactive sliding cards for first launch only */}
      {isLoaded && isFirstLaunch && (
        <div className="absolute inset-x-0 top-[53%] -translate-y-1/2 flex flex-col items-center justify-center px-4 z-20">
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
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                    mass: 0.8
                  }}
                  className={`w-24 sm:w-28 h-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-300 border border-transparent bg-transparent`}
                >
                  {/* Icon wrapper circular border */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-taiz-sky/15 text-taiz-sky border border-taiz-sky/30 shadow-[0_0_15px_rgba(4,158,223,0.15)]"
                        : "bg-taiz-navy/5 text-taiz-navy/30 border border-taiz-navy/10"
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  </div>
                  
                  {/* Main Title */}
                  <h3
                    className={`text-[10px] sm:text-xs font-black mt-2.5 transition-colors duration-300 ${
                      isActive ? "text-taiz-navy" : "text-taiz-navy/40"
                    }`}
                  >
                    {card.title}
                  </h3>
                  
                  {/* Subtitle */}
                  <p
                    className={`text-[8px] sm:text-[9px] font-black mt-0.5 transition-colors duration-300 ${
                      isActive ? "text-taiz-royal" : "text-taiz-royal/35"
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
                  backgroundColor: index === activeCardIndex ? "#049edf" : "rgba(3, 47, 105, 0.15)",
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
            className="text-[10px] sm:text-[11px] font-black text-taiz-navy/60 mt-5 text-center max-w-xs leading-relaxed"
          >
            منصة إخبارية ثقافية متكاملة تنقل الواقع وتستنير بالقرآن والقائد
          </motion.p>

          {/* Google Sign-In and Skip Button Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-col items-center gap-2.5 w-full max-w-[240px] relative z-30"
          >
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="w-full bg-white border border-stone-200/80 hover:bg-stone-50 active:scale-[0.98] text-stone-700 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer shadow-md disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 shrink-0" alt="Google" />
              <span>{isAuthenticating ? "جاري التحقق..." : "الدخول عبر حساب جوجل"}</span>
            </button>

            <button
              onClick={handleSkip}
              disabled={isAuthenticating}
              className="text-[11px] font-black text-taiz-royal hover:text-taiz-navy active:scale-95 transition-all cursor-pointer underline underline-offset-4 decoration-2"
            >
              تخطي تسجيل الدخول
            </button>

            {authError && (
              <p className="text-[10px] font-bold text-red-500 text-center mt-1 leading-tight max-w-[220px]">
                {authError}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
