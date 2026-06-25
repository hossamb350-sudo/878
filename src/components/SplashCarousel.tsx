import { useEffect } from "react";
import { motion } from "motion/react";

interface SplashCarouselProps {
  activeIndex: number;
  onChangeIndex: (index: number) => void;
}

export function SplashCarousel({ activeIndex, onChangeIndex }: SplashCarouselProps) {
  // Option: auto-rotate active index slowly for dynamic visual appeal
  useEffect(() => {
    const timer = setInterval(() => {
      onChangeIndex((activeIndex + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeIndex, onChangeIndex]);

  // High-fidelity custom inline SVG symbols matching the luxury golden design of the logo on the platform
  const renderIcon = (type: "news" | "video" | "quran", isActive: boolean) => {
    const activeColor = isActive ? "text-[#d49a37]" : "text-stone-400 group-hover:text-[#d49a37]";
    
    switch (type) {
      case "news":
        return (
          <svg 
            viewBox="0 0 100 100" 
            className={`w-10 h-10 md:w-12 md:h-12 ${activeColor} transition-colors duration-300`}
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Elegant newspaper template with header and photo placeholder */}
            <rect x="22" y="16" width="56" height="68" rx="8" fill={isActive ? "rgba(212, 154, 55, 0.04)" : "none"} />
            {/* Header banner bars */}
            <line x1="32" y1="28" x2="68" y2="28" strokeWidth="4" />
            <line x1="32" y1="36" x2="52" y2="36" strokeWidth="3.5" />
            
            {/* Small ID badge box on the left */}
            <rect x="32" y="46" width="16" height="14" rx="2" strokeWidth="2" />
            <circle cx="40" cy="53" r="3" fill="currentColor" stroke="none" />

            {/* Tiny news text placeholders */}
            <line x1="54" y1="46" x2="68" y2="46" strokeWidth="2.5" />
            <line x1="54" y1="53" x2="68" y2="53" strokeWidth="2.5" />
            
            {/* Bottom text blocks */}
            <line x1="32" y1="68" x2="68" y2="68" strokeWidth="2" />
            <line x1="32" y1="74" x2="68" y2="74" strokeWidth="2" />
          </svg>
        );

      case "video":
        return (
          <svg 
            viewBox="0 0 100 100" 
            className={`w-10 h-10 md:w-12 md:h-12 ${activeColor} transition-colors duration-300`}
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Double ring circular play halo */}
            <circle cx="50" cy="50" r="32" strokeWidth="2" strokeDasharray="2 2" className="opacity-60" />
            <circle cx="50" cy="50" r="26" strokeWidth="3" fill={isActive ? "rgba(212, 154, 55, 0.05)" : "none"} />
            {/* Play triangle inside */}
            <polygon 
              points="44,38 62,50 44,62" 
              fill="currentColor" 
              className="drop-shadow-sm" 
            />
          </svg>
        );

      case "quran":
        return (
          <svg 
            viewBox="0 0 100 100" 
            className={`w-10 h-10 md:w-12 md:h-12 ${activeColor} transition-colors duration-300`}
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Crescent Moon symbolizing Islamic lessons */}
            <path 
              d="M50,12 c4.5,0 8.1,3.2 8.8,7.5 c-3.5,-0.6 -6.9,0.8 -8.8,3.6 c-1.9,-2.8 -5.3,-4.2 -8.8,-3.6 c0.7,-4.3 4.3,-7.5 8.8,-7.5 z" 
              fill="currentColor" 
              stroke="none" 
              className="opacity-90"
            />
            
            {/* Open Book pages of the Holy Quran */}
            <path 
              d="M50,38 C42,32 30,34 22,40 L22,58 C30,52 42,50 50,56 C58,50 70,52 78,58 L78,40 C70,34 58,32 50,38 Z" 
              fill={isActive ? "rgba(212, 154, 55, 0.05)" : "none"} 
            />
            {/* Center seam line */}
            <line x1="50" y1="38" x2="50" y2="56" strokeWidth="3" />
            
            {/* Traditional Rehal stands (Crossed book legs) */}
            <path d="M34,58 L66,76" strokeWidth="3" />
            <path d="M66,58 L34,76" strokeWidth="3" />
          </svg>
        );
    }
  };

  const slides = [
    {
      id: 0,
      type: "quran" as const,
      title: "دروس من",
      sub: "هدي القرآن",
    },
    {
      id: 1,
      type: "video" as const,
      title: "محتوى مرئي",
      sub: "متجدد",
    },
    {
      id: 2,
      type: "news" as const,
      title: "أخبار موثوقة",
      sub: "لحظة بلحظة",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center select-none" dir="rtl">
      {/* Cards Row in horizontal sequence */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-md px-1.5 sm:px-4">
        {slides.map((slide) => {
          const isActive = activeIndex === slide.id;
          return (
            <motion.div
              key={slide.id}
              onClick={() => onChangeIndex(slide.id)}
              whileTap={{ scale: 0.97 }}
              className={`group flex flex-col items-center justify-between p-3.5 sm:p-5 bg-white rounded-3xl cursor-pointer select-none transition-all duration-300 flex-1 relative ${
                isActive
                  ? "shadow-xl shadow-stone-200/90 border border-amber-500/20 scale-[1.03] ring-1 ring-amber-500/10"
                  : "border border-stone-100/60 shadow-sm hover:shadow-md hover:border-stone-200"
              }`}
            >
              {/* Highlight Halo for active card */}
              {isActive && (
                <motion.div
                  layoutId="activeCardGlow"
                  className="absolute -inset-0.5 rounded-[1.8rem] bg-gradient-to-r from-amber-500/5 to-yellow-500/5 -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Vector Icon */}
              <div className="mb-4 text-center shrink-0 flex items-center justify-center">
                {renderIcon(slide.type, isActive)}
              </div>

              {/* Labels */}
              <div className="text-center font-bold tracking-tight">
                <span className={`block text-[11px] sm:text-xs md:text-sm font-black transition-colors ${
                  isActive ? "text-stone-900" : "text-[#1d3d63]"
                }`}>
                  {slide.title}
                </span>
                <span className={`block text-[9.5px] sm:text-[11px] font-black mt-0.5 whitespace-nowrap transition-colors ${
                  isActive ? "text-[#c28d32]" : "text-stone-400 group-hover:text-[#c28d32]"
                }`}>
                  {slide.sub}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pages Dot Indicator */}
      <div className="flex gap-2 mt-6 select-none shrink-0">
        {[0, 1, 2].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChangeIndex(id)}
            className={`transition-all duration-300 h-2.5 rounded-full cursor-pointer ${
              activeIndex === id
                ? "w-6 bg-[#d49a37] shadow-sm shadow-[#d49a37]/30"
                : "w-2.5 bg-stone-200 hover:bg-stone-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
