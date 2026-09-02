import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Layers, ArrowUpLeft, MoveHorizontal } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FeaturedTopic } from "../types";

export function FeaturedTopicsSlider() {
  const [topics, setTopics] = useState<FeaturedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "featured_topics"),
      where("isVisible", "==", true)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedTopic));
      setTopics(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    
    return unsub;
  }, []);

  // Timer to automatically hide the scroll hint after 3 seconds on page load
  useEffect(() => {
    if (!loading && topics.length > 0) {
      const timer = setTimeout(() => {
        setShowScrollHint(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [loading, topics]);

  const scrollContainer = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const multiplier = direction === 'left' ? -1 : 1;
    scrollRef.current.scrollBy({
      left: multiplier * scrollAmount,
      behavior: 'smooth'
    });
    setHasScrolled(true);
  };

  if (loading || topics.length === 0) return null;

  return (
    <section className="py-1 relative" aria-label="أبرز المواضيع">
      {/* Header aligned with News Section Identity */}
      <div className="flex items-center gap-2 px-3 sm:px-4 mb-2.5 select-none" dir="rtl">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky dark:from-transparent dark:to-transparent dark:bg-[#F26522]/15 dark:border dark:border-[#F26522]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors">
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-[#F26522]" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">أبرز المواضيع</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">تغطيات شاملة لأبرز الأحداث.</p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2"></div>
        
        {/* Navigation Controls */}
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          <button
            onClick={() => scrollContainer('right')}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#0D1A33] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14274B] hover:text-[#F26522] dark:hover:text-[#F26522] hover:border-[#F26522]/40 dark:hover:border-[#F26522]/40 transition-all active:scale-95 shadow-xs"
            aria-label="التمرير لليمين"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollContainer('left')}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#0D1A33] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14274B] hover:text-[#F26522] dark:hover:text-[#F26522] hover:border-[#F26522]/40 dark:hover:border-[#F26522]/40 transition-all active:scale-95 shadow-xs"
            aria-label="التمرير لليسار"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative">
        <div 
          ref={scrollRef}
          onScroll={() => { if (!hasScrolled) setHasScrolled(true); }}
          className="flex overflow-x-auto gap-2.5 sm:gap-3 pb-2 px-3 sm:px-4 snap-x snap-mandatory hide-scrollbar overscroll-x-contain"
          style={{ scrollBehavior: 'smooth', direction: 'rtl', WebkitOverflowScrolling: 'touch' }}
        >
          {topics.map((topic, index) => (
            <Link
              key={topic.id}
              to={`/topic/${topic.id}`}
              className="block relative flex-none w-[140px] sm:w-[165px] md:w-[190px] h-[170px] sm:h-[200px] rounded-[14px] sm:rounded-[16px] overflow-hidden snap-start border border-black/5 dark:border-white/10 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.96] active:brightness-95 transition-all duration-300 ease-out group will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky"
              style={{ transform: 'translateZ(0)' }}
            >
              {/* Background Image */}
              <img 
                src={topic.imageUrl} 
                alt={topic.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 group-active:scale-100 transition-transform duration-700 ease-out pointer-events-none"
                loading="lazy"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none group-hover:via-black/40 transition-all duration-500"></div>

              {/* Press Feedback Ripple Layer */}
              <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-colors duration-150 pointer-events-none z-20"></div>

              {/* Temporary Visual Scroll Indicator upon Page Load (Fades out after 3s or on scroll) */}
              {index === 1 && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-700 ease-in-out ${
                  showScrollHint && !hasScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}>
                  <div className="bg-slate-900/85 backdrop-blur-md border border-white/20 text-white px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl animate-pulse">
                    <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold tracking-wider font-cairo drop-shadow-md">اسحب للتمرير</span>
                    <ChevronLeft className="w-3 h-3 text-amber-400 -ml-0.5 animate-bounce" />
                  </div>
                </div>
              )}

              {/* Top Left Icon */}
              <div className="absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xs group-hover:bg-amber-400 group-hover:text-slate-900 transition-all duration-300 group-hover:scale-110">
                <ArrowUpLeft className="w-3 h-3 text-white group-hover:text-slate-900 -rotate-90 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              {/* Content Container at the Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 flex flex-col justify-end text-right z-10 select-none">
                {/* Browse Coverage Link */}
                <div className="flex items-center justify-start gap-1 text-amber-400 font-cairo">
                  <div className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] group-hover:scale-125 transition-transform"></div>
                  <span className="text-[11px] sm:text-[12px] font-bold">تصفح التغطية</span>
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

