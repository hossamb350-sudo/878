import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Newspaper, PlayCircle, BookOpen } from "lucide-react";

const LOGO_SRC = "logo.png";

const CARDS = [
  { id: 0, title: "أخبار موثوقة", subtitle: "لحظة بلحظة", icon: Newspaper, color: "text-[#049edf]", bg: "bg-[#049edf]/10", border: "border-[#049edf]/50" },
  { id: 1, title: "محتوى مرئي", subtitle: "متجدد", icon: PlayCircle, color: "text-[#049edf]", bg: "bg-[#049edf]/10", border: "border-[#049edf]/50" },
  { id: 2, title: "دروس من", subtitle: "هدي القرآن", icon: BookOpen, color: "text-[#049edf]", bg: "bg-[#049edf]/10", border: "border-[#049edf]/50" },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Advance carousel every 3.5 seconds
    const timer = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 3500);

    // Auto-dismiss and enter app after 10 seconds
    const autoDismissTimer = setTimeout(() => {
      localStorage.setItem("taiz_onboarding_completed", "true");
      onComplete();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoDismissTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#0b172a] via-[#07101f] to-[#040914] font-cairo text-white px-6 py-12" 
      style={{ direction: "rtl" }}
    >
      {/* AMBIENT GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-[#049edf]/10 blur-[130px] rounded-full" />
      </div>

      {/* HEADER: LOGO & TITLE */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center mt-8 z-10"
      >
        <motion.img 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          src={LOGO_SRC} 
          alt="شعار منصة تعز الإعلامية" 
          className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl mb-4" 
        />
      </motion.div>

      {/* CAROUSEL */}
      <div className="relative w-full max-w-[130px] h-[140px] md:max-w-[150px] md:h-[160px] z-10 my-auto mx-auto flex items-center justify-center">
        {CARDS.map((card, index) => {
          // Calculate offset relative to active index
          // 0 = Center, 1 = Right (Next), -1 = Left (Previous)
          let offset = (index - (activeIndex % 3)) % 3;
          if (offset > 1) offset -= 3;
          if (offset < -1) offset += 3;

          const isCenter = offset === 0;

          return (
            <motion.div
              key={card.id}
              className={`absolute inset-0 border-[1.5px] rounded-[1.5rem] shadow-lg flex flex-col items-center justify-center p-3 text-center transition-colors duration-500 ${
                isCenter 
                  ? `bg-[#0c1933] ${card.border}`
                  : "bg-[#081225] border-transparent"
              }`}
              initial={false}
              animate={{
                x: `${offset * 115}%`,
                scale: isCenter ? 1.05 : 0.85,
                opacity: isCenter ? 1 : 0.35,
                zIndex: isCenter ? 20 : 10,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className={`p-3 rounded-full mb-2 md:mb-3 shadow-inner transition-colors duration-500 ${isCenter ? card.bg : "bg-white/5"}`}>
                <card.icon className={`w-6 h-6 md:w-7 md:h-7 transition-colors duration-500 ${isCenter ? card.color : "text-gray-500"}`} />
              </div>
              <h3 className={`text-[12px] md:text-[14px] font-black leading-tight transition-colors duration-500 ${isCenter ? 'text-white' : 'text-gray-500'}`}>
                {card.title}
              </h3>
              <p className={`text-[10px] md:text-[11px] font-bold mt-1 transition-colors duration-500 ${isCenter ? 'text-gray-400' : 'text-gray-600'}`}>
                {card.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* DOTS & LOADING BAR */}
      <div className="flex flex-col items-center z-10 mb-8 space-y-10 w-full">
        {/* Dots Indicator */}
        <div className="flex items-center gap-2">
          {CARDS.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === (activeIndex % 3) ? "w-6 bg-[#049edf]" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
        
        {/* Loading Bar */}
        <div className="flex flex-col items-center space-y-3 opacity-60 w-full max-w-[200px]">
          <span className="text-[10px] tracking-widest text-gray-400 font-bold uppercase">
            جاري الدخول للتطبيق...
          </span>
          <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 w-1/2 bg-[#049edf] rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

