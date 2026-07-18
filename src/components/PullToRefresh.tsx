import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const threshold = 120; // max pull distance

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only start if we are at the top of the scroll container
      if (window.scrollY <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentY.current = e.touches[0].clientY;
      const dy = currentY.current - startY.current;
      
      // Only pull if swiping down
      if (dy > 0 && window.scrollY <= 0) {
        // Prevent default scrolling when pulling down at the top
        if (e.cancelable) {
          e.preventDefault();
        }
        
        // Add resistance/elastic effect
        const pullDistance = dy * 0.4;
        
        const progress = Math.min(pullDistance / threshold, 1.2);
        setPullProgress(progress);
        controls.set({ y: pullDistance });
      } else {
        // If they scroll back up or are not at top
        setPullProgress(0);
        controls.set({ y: 0 });
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      if (pullProgress >= 0.8) {
        setIsRefreshing(true);
        // Animate to loading position
        await controls.start({ y: threshold * 0.5, transition: { type: 'spring', bounce: 0.2, duration: 0.3 } });
        
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh error", error);
          alert("تعذر تحديث المحتوى، يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.");
        } finally {
          setIsRefreshing(false);
          setPullProgress(0);
          controls.start({ y: 0, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
        }
      } else {
        // Reset if not reached threshold
        setPullProgress(0);
        controls.start({ y: 0, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isDragging, pullProgress, isRefreshing, controls, onRefresh]);

  return (
    <div ref={containerRef} className="relative min-h-[100vh]">
      {/* Loading Indicator - Positioned relative to the container, stays at top */}
      <div className="absolute top-0 left-0 right-0 h-0 flex items-start justify-center z-50 pointer-events-none">
         <motion.div 
            initial={{ y: -60, opacity: 0, scale: 0.8 }}
            animate={{ 
               y: isRefreshing ? 30 : (isDragging ? (pullProgress * 60) - 20 : -60),
               rotate: isRefreshing ? 360 : (pullProgress * 200),
               opacity: isRefreshing ? 1 : Math.max(0, pullProgress),
               scale: isRefreshing ? 1 : Math.max(0.8, pullProgress)
            }}
            transition={isRefreshing ? { rotate: { repeat: Infinity, duration: 1, ease: 'linear' }, y: { type: 'spring', stiffness: 300, damping: 20 } } : { type: 'tween', duration: 0.1 }}
            className="bg-white dark:bg-zinc-800 shadow-lg rounded-full p-2 border border-gray-100 dark:border-zinc-700 mt-2"
         >
            <RefreshCw className="w-6 h-6 text-blue-600 dark:text-red-600" />
         </motion.div>
      </div>

      {/* Main Content Area */}
      <motion.div animate={controls} className="min-h-full">
        {children}
      </motion.div>
    </div>
  );
}
