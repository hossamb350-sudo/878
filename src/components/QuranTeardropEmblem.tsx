import React from "react";

interface QuranTeardropEmblemProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const QuranTeardropEmblem: React.FC<QuranTeardropEmblemProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  const sizeMap = {
    sm: "w-10 h-14",
    md: "w-14 h-20",
    lg: "w-20 h-28",
    xl: "w-28 h-40",
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Teardrop with Islamic Calligraphic Motif */}
      <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 160"
          className="w-full h-full drop-shadow-sm filter"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Teardrop outer outline */}
          <path
            d="M60 6C60 6 10 75 10 110C10 137.6 32.4 154 60 154C87.6 154 110 137.6 110 110C110 75 60 6 60 6Z"
            fill="none"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Inner decorative contour */}
          <path
            d="M60 18C60 18 18 78 18 110C18 132.8 36.8 146 60 146C83.2 146 102 132.8 102 110C102 78 60 18 60 18Z"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
          />

          {/* Central Calligraphic Shape (Stylized Quranic script) */}
          <g fill="rgba(255, 255, 255, 0.95)">
            {/* Top flame / alef curves */}
            <path d="M60 28 C57 42 63 50 60 62 C57 50 63 42 60 28 Z" />
            
            {/* Elegant Arabic Calligraphy Curves representing "هدي القرآن" */}
            <path d="M42 68 C35 76 34 88 43 96 C50 102 59 100 66 94 C74 86 78 74 70 66 C64 60 52 60 42 68 Z M48 76 C54 72 62 74 65 80 C68 86 64 92 58 94 C52 96 46 90 45 84 C44 80 46 77 48 76 Z" />
            
            <path d="M72 90 C78 94 85 102 82 112 C79 122 68 128 58 128 C46 128 36 120 35 110 C34 104 38 98 44 98 C50 98 52 104 50 108 C48 112 52 116 58 116 C64 116 70 112 72 104 C74 98 70 94 66 92 L72 90 Z" />
            
            <path d="M52 64 C56 58 64 58 68 64 C64 66 56 66 52 64 Z" />
            <path d="M38 102 C30 110 32 124 45 132 C55 138 68 138 78 130 C88 122 88 108 80 100 C76 96 74 98 76 102 C82 108 80 118 72 122 C64 126 54 126 46 120 C40 116 38 108 42 104 L38 102 Z" />
            
            {/* Decorative dots */}
            <circle cx="60" cy="52" r="2.5" />
            <circle cx="50" cy="74" r="2" />
            <circle cx="70" cy="74" r="2" />
          </g>
        </svg>
      </div>

      {/* Ribbon / Subtitle text: إِنَّ هُدَى اللَّهِ هُوَ الْهُدَىٰ */}
      {showText && (
        <div className="mt-1 text-center whitespace-nowrap">
          <span className="text-[10px] sm:text-[11px] font-bold text-white/95 font-cairo tracking-wide drop-shadow-sm">
            إِنَّ هُدَى اللَّهِ هُوَ الْهُدَىٰ
          </span>
        </div>
      )}
    </div>
  );
};

export const IslamicBannerHeader = ({
  title = "دروس من هدي القرآن الكريم",
  className = "",
}: {
  title?: string;
  className?: string;
}) => {
  return (
    <div className={`relative flex items-center justify-center my-2 sm:my-3 ${className}`} dir="rtl">
      {/* Light Mode Banner Artwork */}
      <img
        src="/Hudaah1.webp"
        alt={title}
        className="w-full max-w-[280px] sm:max-w-[330px] md:max-w-[360px] h-auto object-contain block dark:hidden select-none drop-shadow-xs hover:scale-[1.02] transition-transform duration-300"
        loading="eager"
      />
      {/* Dark Mode Banner Artwork */}
      <img
        src="/Hudaah2.webp"
        alt={title}
        className="w-full max-w-[280px] sm:max-w-[330px] md:max-w-[360px] h-auto object-contain hidden dark:block select-none drop-shadow-xs hover:scale-[1.02] transition-transform duration-300"
        loading="eager"
      />
    </div>
  );
};
