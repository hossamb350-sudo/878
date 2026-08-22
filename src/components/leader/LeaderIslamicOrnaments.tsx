import React from "react";

/**
 * Islamic Geometric Arabesque Background Pattern matching platform theme
 */
export const IslamicGeometricPattern: React.FC<{ className?: string; opacity?: number }> = ({ 
  className = "", 
  opacity = 0.05 
}) => (
  <svg
    className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    style={{ opacity }}
    xmlns="http://www.w3.org/2000/svg"
    width="100"
    height="100"
    viewBox="0 0 100 100"
  >
    <defs>
      <pattern id="islamic-star-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
        {/* 8-point Islamic Star Grid */}
        <path
          d="M25 0 L32.5 17.5 L50 25 L32.5 32.5 L25 50 L17.5 32.5 L0 25 L17.5 17.5 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
        />
        <circle cx="25" cy="25" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect
          x="15"
          y="15"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          transform="rotate(45 25 25)"
        />
        <path
          d="M0 0 L10 10 M50 0 L40 10 M0 50 L10 40 M50 50 L40 40"
          stroke="currentColor"
          strokeWidth="0.4"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic-star-pattern)" />
  </svg>
);

/**
 * Corner Frame matching platform borders
 */
export const GoldenCornerFrame: React.FC<{ size?: number; className?: string }> = ({ 
  size = 18, 
  className = "" 
}) => (
  <>
    {/* Top Right */}
    <div
      className={`absolute top-2.5 right-2.5 pointer-events-none z-10 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-taiz-sky/40">
        <path d="M24 0 H8 C3.58 0 0 3.58 0 8 V24 H3 V8 C3 5.24 5.24 3 8 3 H24 V0 Z" fill="currentColor" />
        <circle cx="9" cy="9" r="1.75" fill="currentColor" />
      </svg>
    </div>

    {/* Top Left */}
    <div
      className={`absolute top-2.5 left-2.5 pointer-events-none z-10 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-taiz-sky/40 -scale-x-100">
        <path d="M24 0 H8 C3.58 0 0 3.58 0 8 V24 H3 V8 C3 5.24 5.24 3 8 3 H24 V0 Z" fill="currentColor" />
        <circle cx="9" cy="9" r="1.75" fill="currentColor" />
      </svg>
    </div>

    {/* Bottom Right */}
    <div
      className={`absolute bottom-2.5 right-2.5 pointer-events-none z-10 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-taiz-sky/40 -scale-y-100">
        <path d="M24 0 H8 C3.58 0 0 3.58 0 8 V24 H3 V8 C3 5.24 5.24 3 8 3 H24 V0 Z" fill="currentColor" />
        <circle cx="9" cy="9" r="1.75" fill="currentColor" />
      </svg>
    </div>

    {/* Bottom Left */}
    <div
      className={`absolute bottom-2.5 left-2.5 pointer-events-none z-10 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-taiz-sky/40 -scale-x-100 -scale-y-100">
        <path d="M24 0 H8 C3.58 0 0 3.58 0 8 V24 H3 V8 C3 5.24 5.24 3 8 3 H24 V0 Z" fill="currentColor" />
        <circle cx="9" cy="9" r="1.75" fill="currentColor" />
      </svg>
    </div>
  </>
);

/**
 * 8-Point Islamic Star Medallion Badge in platform colors
 */
export const IslamicStarMedallion: React.FC<{ 
  className?: string; 
  children?: React.ReactNode;
  size?: string;
}> = ({ className = "", children, size = "w-10 h-10" }) => (
  <div className={`relative inline-flex items-center justify-center ${size} ${className}`}>
    <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full drop-shadow-sm">
      <path
        d="M20 0 L25.8 7.5 L34.1 5.9 L34.1 14.2 L40 20 L34.1 25.8 L34.1 34.1 L25.8 34.1 L20 40 L14.2 34.1 L5.9 34.1 L5.9 25.8 L0 20 L5.9 14.2 L5.9 5.9 L14.2 5.9 Z"
        fill="url(#taiz-gradient-medallion)"
        stroke="#1E4275"
        strokeWidth="0.8"
      />
      <circle cx="20" cy="20" r="13" fill="#07152B" stroke="#34619B" strokeWidth="0.6" />
      <defs>
        <linearGradient id="taiz-gradient-medallion" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E4275" />
          <stop offset="50%" stopColor="#10264A" />
          <stop offset="100%" stopColor="#07152B" />
        </linearGradient>
      </defs>
    </svg>
    <div className="relative z-10 flex items-center justify-center text-amber-300">
      {children}
    </div>
  </div>
);

/**
 * Platform divider with subtle gradient
 */
export const IslamicDivider: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center justify-center gap-3 my-3 select-none px-4 ${className}`} dir="rtl">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200/40" />
    <div className="flex items-center gap-1.5 text-taiz-sky text-xs">
      <span className="text-[10px] opacity-60">❖</span>
      <span className="w-1.5 h-1.5 rotate-45 border border-taiz-sky/50 bg-white shadow-xs" />
      <span className="text-[10px] opacity-60">❖</span>
    </div>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-slate-200/40" />
  </div>
);
