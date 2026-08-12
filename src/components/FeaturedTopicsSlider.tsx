import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FeaturedTopic } from "../types";

export function FeaturedTopicsSlider() {
  const [topics, setTopics] = useState<FeaturedTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "featured_topics"),
      where("isVisible", "==", true)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedTopic));
      // Sort by order manually since we have a where clause on another field
      setTopics(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    
    return unsub;
  }, []);

  if (loading || topics.length === 0) return null;

  return (
    <div className="pb-1 mb-3.5 mx-2 sm:mx-3">
      <div className="flex items-center justify-between mb-3 text-right relative z-10" style={{ direction: "rtl" }}>
        <div className="flex items-center gap-3 group inline-flex">
          <div className="bg-taiz-sky p-2 rounded-xl shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-black text-[18px] sm:text-[20px] select-none text-text-primary group-hover:text-taiz-sky transition-colors font-cairo">أبرز المواضيع</h2>
        </div>
      </div>

      <div className="relative -mx-2 sm:mx-0">
        <div 
          className="flex overflow-x-auto gap-3 sm:gap-4 px-2 sm:px-0 pb-4 snap-x snap-mandatory hide-scrollbar touch-pan-x"
          style={{ scrollBehavior: 'smooth', direction: 'rtl' }}
        >
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/search?q=${encodeURIComponent(topic.categories[0] || topic.title)}`}
              className="group relative flex-none w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-[24px] overflow-hidden snap-start transition-transform active:scale-95 bg-surface-card shadow-soft hover:shadow-hover border border-surface-border/50"
            >
              <div className="absolute inset-0">
                <img 
                  src={topic.imageUrl} 
                  alt={topic.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent" />
              </div>
              
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col items-center justify-end text-center z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors shadow-lg">
                   <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                     <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" strokeWidth={2.5} />
                   </div>
                </div>
                <h3 className="text-white font-bold text-sm sm:text-base font-cairo leading-tight max-w-full truncate">
                  {topic.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
