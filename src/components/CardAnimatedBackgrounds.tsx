import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// --- Shared Particle Component ---
const Particles = ({ count = 20, color = "rgba(255,255,255,0.5)", size = [2, 4], duration = 15, direction = 'up' as 'up' | 'down' | 'diagonal' }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      width: Math.random() * (size[1] - size[0]) + size[0],
      height: Math.random() * (size[1] - size[0]) + size[0],
      left: `${Math.random() * 100}%`,
      top: direction === 'down' ? `-10%` : `${Math.random() * 100}%`,
      delay: Math.random() * 10,
      duration: Math.random() * 10 + duration,
      xOffset: (Math.random() - 0.5) * 100,
      yOffset: direction === 'up' ? - (Math.random() * 100 + 100) : (direction === 'down' ? Math.random() * 100 + 100 : Math.random() * 100),
    }));
  }, [count, size, duration, direction]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: color,
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
          }}
          animate={{
            y: [0, p.yOffset],
            x: direction === 'diagonal' ? [0, p.xOffset * 2] : [0, p.xOffset * 0.5],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// --- Prayer Backgrounds ---
export const PrayerBackground = ({ prayerName }: { prayerName: string }) => {
  const theme = useMemo(() => {
    switch(prayerName) {
      case 'الفجر': return 'fajr';
      case 'الظهر': return 'dhuhr';
      case 'العصر': return 'asr';
      case 'المغرب': return 'maghrib';
      case 'العشاء': return 'isha';
      default: return 'dhuhr';
    }
  }, [prayerName]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] -z-10 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {theme === 'fajr' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2b4c] via-[#4a6b8c] to-[#e6cfcf]">
              <motion.div 
                className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4)_0%,transparent_60%)]"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              <Particles count={15} color="rgba(255,255,255,0.4)" duration={20} />
            </div>
          )}
          {theme === 'dhuhr' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ea5d9] via-[#86c6ea] to-[#d6eaf8]">
               <motion.div 
                className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.6)_0%,transparent_70%)]"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              />
              <Particles count={10} color="rgba(255,255,255,0.6)" duration={25} />
            </div>
          )}
          {theme === 'asr' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#e69831] via-[#f3c258] to-[#f9e5a1]">
               <motion.div 
                className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.5)_0%,transparent_70%)]"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <Particles count={20} color="rgba(255,230,150,0.6)" duration={18} direction="diagonal" />
            </div>
          )}
          {theme === 'maghrib' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2b1055] via-[#75225b] to-[#d76d41]">
              <motion.div 
                className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_100%,rgba(255,150,100,0.6)_0%,transparent_60%)]"
                animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <Particles count={15} color="rgba(255,200,150,0.5)" duration={20} />
            </div>
          )}
          {theme === 'isha' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1021] via-[#1b274c] to-[#2a3b63]">
              <motion.div 
                className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.3)_0%,transparent_50%)]"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Twinkling stars */}
              <Particles count={30} color="rgba(255,255,255,0.7)" size={[1, 2]} duration={10} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- Weather Backgrounds ---
export const WeatherBackground = ({ weatherCode, isNight }: { weatherCode: number, isNight: boolean }) => {
  const theme = useMemo(() => {
    if (weatherCode === 0) return isNight ? 'clear_night' : 'clear_day';
    if ([1, 2, 3].includes(weatherCode)) return 'cloudy';
    if ([45, 48].includes(weatherCode)) return 'fog';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'rain';
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'snow';
    if ([95, 96, 99].includes(weatherCode)) return 'thunderstorm';
    return isNight ? 'clear_night' : 'clear_day';
  }, [weatherCode, isNight]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] -z-10 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {theme === 'clear_day' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4facfe] to-[#00f2fe]">
              <motion.div 
                className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.4)_0%,transparent_50%)]"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              />
              <Particles count={15} color="rgba(255,255,255,0.5)" />
            </div>
          )}
          {theme === 'clear_night' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
              <Particles count={25} color="rgba(255,255,255,0.6)" size={[1, 2]} />
            </div>
          )}
          {theme === 'cloudy' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#757f9a] to-[#d7dde8]">
               <motion.div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3)_0%,transparent_70%)]"
                animate={{ x: [0, 20, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
               />
               <Particles count={10} size={[20, 40]} color="rgba(255,255,255,0.1)" duration={30} direction="diagonal" />
            </div>
          )}
          {theme === 'rain' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2b5876] to-[#4e4376]">
              <Particles count={40} color="rgba(255,255,255,0.4)" size={[1, 3]} duration={2} direction="down" />
            </div>
          )}
          {theme === 'snow' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#e0eafc] to-[#cfdef3]">
              <Particles count={50} color="rgba(255,255,255,0.8)" size={[2, 5]} duration={8} direction="down" />
            </div>
          )}
          {theme === 'thunderstorm' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#141e30] to-[#243b55]">
              <motion.div
                className="absolute inset-0 bg-white"
                animate={{ opacity: [0, 0, 0.8, 0, 0, 0.5, 0] }}
                transition={{ duration: 10, repeat: Infinity, times: [0, 0.4, 0.42, 0.45, 0.7, 0.72, 0.75] }}
              />
              <Particles count={50} color="rgba(255,255,255,0.5)" size={[1, 3]} duration={1.5} direction="down" />
            </div>
          )}
          {theme === 'fog' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#9ba3b5] to-[#c7cdd8]">
               <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_0%,transparent_80%)]"
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.2, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- Hijri Calendar Background ---
export const HijriBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] -z-10 pointer-events-none bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      {/* Islamic Pattern Overlay Placeholder - using radial gradients to simulate geometric elegance */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)'
        }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Floating golden particles */}
      <Particles count={20} color="rgba(212, 175, 55, 0.6)" size={[1, 3]} duration={20} />

      {/* Subtle crescent or geometric glow */}
      <motion.div 
        className="absolute w-32 h-32 rounded-full blur-2xl"
        style={{ background: 'rgba(212, 175, 55, 0.1)', top: '-10%', left: '-10%' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
