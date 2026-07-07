import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Newspaper, PlayCircle, BookOpen, AlertCircle } from "lucide-react";
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@southdevs/capacitor-google-auth";
import { UserProfile } from "../types";

const LOGO_SRC = "logo.png";

// Official colorful Google icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 ml-2 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase transitions for staggered animation
  const [showName, setShowName] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Failsafe: Ensure the app opens after 12 seconds no matter what
    const failsafeTimer = setTimeout(() => {
      console.warn("SplashScreen failsafe triggered");
      onComplete();
    }, 12000);

    // Determine first launch status
    const completedOnboarding = localStorage.getItem("taiz_onboarding_completed");
    const isFirst = completedOnboarding !== "true";
    setIsFirstLaunch(isFirst);

    // Timeline of animations
    const nameTimer = setTimeout(() => setShowName(true), 600);
    const chipsTimer = setTimeout(() => setShowChips(true), 1200);

    let authTimer: NodeJS.Timeout | null = null;
    let autoDismissTimer: NodeJS.Timeout | null = null;

    if (isFirst) {
      // For first launch, show auth controls after chips appear
      authTimer = setTimeout(() => setShowAuth(true), 2400);
    } else {
      // For subsequent launches, auto-dismiss after exactly 5 seconds
      autoDismissTimer = setTimeout(() => {
        onComplete();
      }, 5000);
    }

    return () => {
      clearTimeout(nameTimer);
      clearTimeout(chipsTimer);
      if (authTimer) clearTimeout(authTimer);
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  }, [onComplete]);

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
      console.warn("Could not sync Firestore user profile from splash screen:", e);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
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
      
      // Save onboarding complete state and dismiss
      localStorage.setItem("taiz_onboarding_completed", "true");
      onComplete();
    } catch (err: any) {
      console.error("Google Auth error from splash:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("تسجيل الدخول عبر جوجل غير مفعل حالياً. يرجى التواصل مع الإدارة.");
      } else {
        setError("حدث خطأ أثناء الاتصال بجوجل. يرجى المحاولة لاحقاً.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("taiz_onboarding_completed", "true");
    onComplete();
  };

  if (isFirstLaunch === null) {
    return null; // Prevent flash of unstyled content
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#0b172a] via-[#07101f] to-[#040914] font-cairo text-white px-6 py-12" style={{ direction: "rtl" }}>
      {/* AMBIENT GLOW EFFECTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft cyan/blue backlight behind logo */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-[#049edf]/10 blur-[130px] rounded-full" />
      </div>

      {/* HEADER SECTION (EMPTY FOR SPACING / CENTERING) */}
      <div className="h-4" />

      {/* CENTRAL BRANDING & LOGO */}
      <div className="flex flex-col items-center text-center max-w-md w-full z-10 my-auto">
        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.0,
            ease: "easeOut"
          }}
          className="relative w-64 h-56 md:w-80 md:h-64 flex items-center justify-center mb-2"
        >
          {/* Real logo image directly on background without surrounding circle or glow layers */}
          <img
            src={LOGO_SRC}
            alt="شعار منصة تعز الإعلامية"
            className="w-full h-full object-contain relative z-20"
          />
        </motion.div>

        {/* Platform Name and Slogan */}
        <div className="space-y-4 w-full">
          <AnimatePresence>
            {showName && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-3"
              >
                <h1 className="text-[28px] md:text-3xl font-black text-white tracking-normal leading-normal">
                  منصة تعز الإعلامية
                </h1>
                <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-[#049edf] uppercase font-sans">
                  TAIZ MEDIA PLATFORM
                </p>
                <p className="text-sm md:text-base text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
                  إعلام ينقل الواقع ويستنير بالقرآن والقائد
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FEATURE CHIPS */}
        <div className="mt-10 w-full min-h-[120px] max-w-sm">
          <AnimatePresence>
            {showChips && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.2
                    }
                  }
                }}
                className="flex flex-col items-center gap-3 w-full"
              >
                {/* Row 1: Side by Side */}
                <div className="flex items-center justify-center gap-3 w-full">
                  {/* Chip 1 */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                    }}
                    className="flex items-center gap-2 bg-[#0a1528]/80 hover:bg-[#0a1528] border border-white/10 rounded-2xl py-3 px-5 transition-all duration-300 shadow-md cursor-pointer"
                  >
                    <Newspaper className="w-5 h-5 text-[#049edf]" />
                    <span className="text-xs md:text-sm font-black text-gray-100">أخبار وتقارير</span>
                  </motion.div>

                  {/* Chip 2 */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                    }}
                    className="flex items-center gap-2 bg-[#0a1528]/80 hover:bg-[#0a1528] border border-white/10 rounded-2xl py-3 px-5 transition-all duration-300 shadow-md cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5 text-red-500" />
                    <span className="text-xs md:text-sm font-black text-gray-100">محتوى مرئي متجدد</span>
                  </motion.div>
                </div>

                {/* Row 2: Centered */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                  className="flex items-center gap-2 bg-[#0a1528]/80 hover:bg-[#0a1528] border border-white/10 rounded-2xl py-3 px-6 transition-all duration-300 shadow-md cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs md:text-sm font-black text-gray-100">دروس من هدي القرآن</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER / FIRST LAUNCH SIGN IN ACTIONS */}
      <div className="w-full max-w-sm flex flex-col items-center justify-end z-20 min-h-[140px] mt-8">
        <AnimatePresence mode="wait">
          {isFirstLaunch && showAuth ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full flex flex-col items-center space-y-5"
            >
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/35 text-red-200 text-xs py-2.5 px-4 rounded-xl w-full text-right">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign In Button (MD3 Compliant) */}
              <button
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 active:scale-[0.98] transition-all duration-300 py-3.5 px-6 rounded-full font-bold shadow-[0_4px_18px_rgba(255,255,255,0.15)] disabled:opacity-75 text-sm md:text-base cursor-pointer relative overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </div>
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="font-black text-gray-900">تسجيل الدخول باستخدام Google</span>
                  </>
                )}
              </button>

              {/* Skip / تخطي Button */}
              <button
                disabled={loading}
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-black tracking-wide py-2 cursor-pointer"
              >
                تخطي والدخول للتطبيق
              </button>
            </motion.div>
          ) : (
            // On subsequent launches, or before auth shows, display a elegant progress bar or simple credit
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="flex flex-col items-center space-y-3"
            >
              {!isFirstLaunch && (
                <div className="w-24 h-[3px] bg-white/15 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 w-1/2 bg-[#049edf] rounded-full"
                  />
                </div>
              )}
              <span className="text-xs tracking-[0.25em] text-gray-400 font-bold uppercase">
                مكتب الإعلام بمحافظة تعز
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
