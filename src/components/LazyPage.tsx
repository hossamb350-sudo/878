import React, { useRef, useEffect, useState } from "react";

export const LazyPage: React.FC<{ children: React.ReactNode; width: string; minHeight: string; className: string; style: any; forceLoad: boolean; id?: string }> = ({ children, width, minHeight, className, style, forceLoad, id }) => {
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (forceLoad) {
      setHasIntersected(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      { rootMargin: "1000px" } // Load well in advance
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [forceLoad]);

  const shouldRender = hasIntersected || forceLoad;

  return (
    <article
      ref={ref}
      className={className}
      style={{ ...style, width, minHeight }}
      id={id}
    >
      {shouldRender ? children : <div className="w-full h-full min-h-[500px] flex items-center justify-center opacity-30 text-xs">جاري تحميل الصفحة...</div>}
    </article>
  );
};
