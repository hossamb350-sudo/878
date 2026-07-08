import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Newspaper, PlayCircle, BookOpen } from "lucide-react";

const LOGO_SRC = "logo.png";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showName, setShowName] = useState(false);
  const [showChips, setShowChips] = useState(false);

  useEffect(() => {
    // Failsafe: Ensure the app opens after 12 seconds no matter what
    const failsafeTimer = setTimeout(() => {
      console.warn("SplashScreen failsafe triggered");
      onComplete();
    }, 120000);

    // Timeline of animations
    const nameTimer = setTimeout(() => setShowName(true), 600);
    const chipsTimer = setTimeout(() => setShowChips(true), 1200);

    // Auto-dismiss after exactly 5 seconds for everyone
    const autoDismissTimer = setTimeout(() => {
      localStorage.setItem("taiz_onboarding_completed", "true");
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(failsafeTimer);
      clearTimeout(nameTimer);
      clearTimeout(chipsTimer);
      clearTimeout(autoDismissTimer);
    };
  }, [onComplete]);

  const handleEnterApp = () => {
    localStorage.setItem("taiz_onboarding_completed", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#0b172a] via-[#07101f] to-[#040914] font-cairo text-white px-6 py-12" style={{ direction: "rtl" }}>
      {/* AMBIENT GLOW EFFECTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-[#049edf]/10 blur-[130px] rounded-full" />
      </div>

      <div className="h-4" />

      {/* CENTRAL BRANDING & LOGO */}
      <div className="flex flex-col items-center text-center max-w-md w-full z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative w-64 h-56 md:w-80 md:h-64 flex items-center justify-center mb-2"
        >
          <img
            src={LOGO_SRC}
            alt="شعار منصة تعز الإعلامية"
            className="w-full h-full object-contain relative z-20"
          />
        </motion.div>

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

        <div className="mt-10 w-full min-h-[120px] max-w-sm">
          <AnimatePresence>
            {showChips && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.2 } }
                }}
                className="flex flex-col items-center gap-3 w-full"
              >
                <div className="flex items-center justify-center gap-3 w-full">
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

      {/* FOOTER ACTIONS */}
      <div className="w-full max-w-sm flex flex-col items-center justify-end z-20 min-h-[140px] mt-8">
        <AnimatePresence mode="wait">
          {showChips ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full flex flex-col items-center"
            >
              <button
                onClick={handleEnterApp}
                className="w-full flex items-center justify-center gap-3 bg-[#049edf] text-white hover:bg-[#049edf]/90 active:scale-[0.98] transition-all duration-300 py-3.5 px-6 rounded-full font-bold shadow-[0_4px_18px_rgba(4,158,223,0.25)] text-sm md:text-base cursor-pointer relative overflow-hidden"
              >
                <span className="font-black">دخول التطبيق</span>
              </button>
            </motion.div>
          ) : (
            <div className="w-24 h-[3px] bg-white/15 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-1/2 bg-[#049edf] rounded-full"
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
