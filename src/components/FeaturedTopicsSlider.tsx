import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronLeft, ChevronRight, Tag, ArrowUpRight, Flame } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FeaturedTopic } from "../types";

export function FeaturedTopicsSlider() {
  const [topics, setTopics] = useState<FeaturedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "featured_topics"),
      where("isVisible", "==", true)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedTopic));
      // Sort by order manually
      setTopics(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    
    return unsub;
  }, []);

  const scrollContainer = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    // In RTL, left scroll increases/decreases differently based on browser implementation
    const multiplier = direction === 'left' ? -1 : 1;
    scrollRef.current.scrollBy({
      left: multiplier * scrollAmount,
      behavior: 'smooth'
    });
  };

  if (loading || topics.length === 0) return null;

  return (
    <div className="pb-2 mb-6 mx-2 sm:mx-3">
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-soft rounded-[28px] p-4 sm:p-6 relative overflow-hidden backdrop-blur-md">
        {/* Ambient Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-amber-500/10 via-taiz-sky/5 to-transparent rounded-full blur-3xl pointer-events-none -mt-20 -mr-20" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none -mb-16 -ml-16" />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 relative z-10" style={{ direction: "rtl" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-taiz-sky flex items-center justify-center text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white font-cairo tracking-tight">
                  أبرز المواضيع
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-cairo">
                  <Flame className="w-3 h-3 text-amber-500" />
                  تغطيات خاصة
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 font-cairo">
                تصفح أهم القضايا والمواضيع الساخنة والمتابعات الشاملة
              </p>
            </div>
          </div>

          {/* Nav Buttons (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scrollContainer('right')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-taiz-sky hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
              title="التمرير لليمين"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollContainer('left')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-taiz-sky hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
              title="التمرير لليسار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Topics Row */}
        <div className="relative group/slider">
          {/* Subtle Edge Fade Overlays */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 rounded-r-2xl" />
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 rounded-l-2xl" />

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 sm:gap-5 px-1 py-2 snap-x snap-mandatory hide-scrollbar touch-pan-x"
            style={{ scrollBehavior: 'smooth', direction: 'rtl' }}
          >
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/topic/${topic.id}`}
                className="group/card relative flex-none w-[190px] sm:w-[220px] md:w-[235px] h-[260px] sm:h-[285px] rounded-[24px] overflow-hidden snap-start transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/15 border border-slate-200/80 dark:border-slate-800 bg-slate-950 flex flex-col justify-between p-4 active:scale-98"
              >
                {/* Image & Gradient Overlays */}
                <div className="absolute inset-0">
                  <img 
                    src={topic.imageUrl} 
                    alt={topic.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
                    loading="lazy"
                  />
                  {/* Multi-stage Gradient Overlay for Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/20 opacity-90 transition-opacity duration-300 group-hover/card:opacity-95" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                </div>

                {/* Top Badge Area */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  {topic.categories && topic.categories.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black font-cairo shadow-sm truncate max-w-[80%]">
                      <Tag className="w-3 h-3 text-amber-300 shrink-0" />
                      <span className="truncate">{topic.categories[0]}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black font-cairo shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      موضوع خاص
                    </span>
                  )}

                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 group-hover/card:bg-amber-500 group-hover/card:text-white group-hover/card:border-amber-400 transition-all shadow-md shrink-0">
                    <ArrowUpRight className="w-4 h-4 rtl:rotate-90 group-hover/card:scale-110 transition-transform" />
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-10 mt-auto pt-4">
                  <h3 className="text-white font-black text-base sm:text-lg font-cairo leading-snug drop-shadow-md group-hover/card:text-amber-300 transition-colors line-clamp-2">
                    {topic.title}
                  </h3>

                  {topic.categories && topic.categories.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {topic.categories.slice(1, 3).map((cat, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs font-cairo">
                          #{cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-amber-300/90 group-hover/card:text-amber-200 transition-colors font-cairo">
                    <span className="flex items-center gap-1">
                      <span>تصفح التغطية</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover/card:-translate-x-1 transition-transform" />
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  </div>

                  {/* Bottom Accent Bar */}
                  <div className="w-0 group-hover/card:w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-taiz-sky transition-all duration-500 rounded-full mt-2.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

