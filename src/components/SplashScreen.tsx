import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const LOGO_SRC = "/logo.png";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [sweep, setSweep] = useState(0); // 0: none, 1: first, 2: second
  const [sparkles, setSparkles] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // 1.2s: First Light Sweep
    const sweep1 = setTimeout(() => setSweep(1), 1200);
    const sweep1End = setTimeout(() => setSweep(0), 2000);

    // 1.8s: First Sparkles
    const sparkle1 = setTimeout(() => setSparkles(true), 1800);
    const sparkle1End = setTimeout(() => setSparkles(false), 2600);

    // 4s: Start Halo Pulse
    const pulseStart = setTimeout(() => setPulse(true), 4000);

    // 5s: Second Light Sweep + Sparkle
    const sweep2 = setTimeout(() => setSweep(2), 5000);
    const sweep2End = setTimeout(() => setSweep(0), 5800);
    const sparkle2 = setTimeout(() => setSparkles(true), 5000);
    const sparkle2End = setTimeout(() => setSparkles(false), 5800);

    // Periodic sweep every 4 seconds after the first ones
    const recurringSweep = setInterval(() => {
      setSweep(prev => (prev === 0 ? 3 : 0));
      setTimeout(() => setSweep(0), 1000);
    }, 4000);

    // 9s: Complete
    const timer = setTimeout(() => {
      onComplete();
    }, 9500);

    return () => {
      clearTimeout(sweep1);
      clearTimeout(sweep1End);
      clearTimeout(sparkle1);
      clearTimeout(sparkle1End);
      clearTimeout(pulseStart);
      clearTimeout(sweep2);
      clearTimeout(sweep2End);
      clearTimeout(sparkle2);
      clearTimeout(sparkle2End);
      clearInterval(recurringSweep);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f8f9fa] font-cairo">
      {/* BACKGROUND LAYER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0"
      >
        {/* Radial Gradient: Center White to Gray Edge */}
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,rgba(220,225,230,1)_80%,rgba(200,205,210,1)_100%)]" 
        />
        
        {/* Vignette Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.03)_100%)]" />

        {/* Soft Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Bloom / Halo behind Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 0.6,
            scale: pulse ? [1, 1.05, 1] : 1
          }}
          transition={{ 
            opacity: { delay: 0.3, duration: 1.5 },
            scale: { repeat: pulse ? Infinity : 0, duration: 3, ease: "easeInOut" }
          }}
          className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] bg-white blur-[120px] rounded-full"
        />

        {/* Floating Particles (Max 20) */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              x: `${Math.random() * 100 - 50}%`, 
              y: `${Math.random() * 100 - 50}%` 
            }}
            animate={{ 
              opacity: [0, 0.4, 0],
              y: [`${Math.random() * 20 - 10}%`, `${Math.random() * 20 - 10}%`],
              x: [`${Math.random() * 20 - 10}%`, `${Math.random() * 20 - 10}%`]
            }}
            transition={{ 
              duration: 8 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 5 
            }}
            className="absolute w-[2px] h-[2px] bg-white rounded-full blur-[0.5px]"
          />
        ))}
      </motion.div>

      {/* CONTENT CONTAINER */}
      <div className="relative flex flex-col items-center justify-center text-center w-full max-w-lg z-10">
        
        {/* LOGO & EFFECTS SECTION */}
        <div className="relative mb-16">
          {/* Logo Halo (Blue Glow) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 0.3,
              scale: pulse ? [1.35, 1.42, 1.35] : 1.35
            }}
            transition={{ 
              opacity: { delay: 0.8, duration: 2 },
              scale: { repeat: pulse ? Infinity : 0, duration: 3, ease: "easeInOut" }
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#049EDF] blur-[60px] rounded-full pointer-events-none"
          />

          {/* Oval Shadow below Logo */}
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 0.25, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-8 bg-[#032F69] blur-[25px] rounded-[100%]"
          />

          {/* Main Logo Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.3, 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="relative w-80 h-80 md:w-[450px] md:h-[450px] flex items-center justify-center"
          >
            {/* Logo Image */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img 
                src={LOGO_SRC} 
                alt="Logo" 
                className="w-full h-full object-contain relative z-20"
              />

              {/* Light Sweep Effect */}
              <AnimatePresence>
                {sweep > 0 && (
                  <motion.div 
                    initial={{ x: "-150%", rotate: 25 }}
                    animate={{ x: "150%" }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 z-30 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                      width: "100%",
                      height: "200%",
                      top: "-50%"
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Glass Reflection effect overlay */}
              <div className="absolute inset-0 z-25 bg-gradient-to-tr from-white/15 to-transparent opacity-50 pointer-events-none rounded-full" />
            </div>

            {/* Sparkles Layer */}
            <AnimatePresence>
              {sparkles && (
                <div className="absolute inset-0 z-40 pointer-events-none">
                  {/* Top Right Sparkle */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                    transition={{ duration: 0.6 }}
                    className="absolute top-10 right-16 w-6 h-6"
                  >
                    <div className="absolute inset-0 bg-white blur-[3px] rounded-full" />
                    <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-white shadow-[0_0_8px_white]" />
                    <div className="absolute top-0 left-1/2 w-[1.5px] h-full bg-white shadow-[0_0_8px_white]" />
                  </motion.div>
                  
                  {/* Additional Sparkle */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="absolute bottom-20 left-10 w-4 h-4"
                  >
                    <div className="absolute inset-0 bg-white blur-[2px] rounded-full" />
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white" />
                    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white" />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* TEXT CONTENT SECTION */}
        <div className="flex flex-col items-center space-y-6">
          {/* Arabic Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-black text-[#032F69] font-cairo tracking-tight"
            style={{ direction: 'rtl' }}
          >
            منصة تعز الإعلامية
          </motion.h1>

          {/* English Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0, duration: 1, ease: "easeOut" }}
            className="text-sm md:text-base font-bold text-[#032F69] tracking-[0.5em] uppercase font-sans"
          >
            TAIZ MEDIA PLATFORM
          </motion.h2>

          {/* Slogan / Definition */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 1.2 }}
            className="text-sm md:text-base text-[#475569]/80 font-medium mt-6 font-cairo"
            style={{ direction: 'rtl' }}
          >
            إعلام ينقل الواقع، ويستنير بالقرآن والقائد
          </motion.p>
        </div>
      </div>

      {/* BOTTOM FOOTER / SYSTEM INFO */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 7 }}
        className="absolute bottom-10 text-xs tracking-[0.2em] text-[#032F69] font-bold font-cairo"
      >
        مكتب الإعلام محافظة تعز
      </motion.div>
    </div>
  );
}
