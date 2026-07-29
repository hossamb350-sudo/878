import React, { useMemo, useEffect, useState } from 'react';

// --- Shared Particle Component using pure CSS ---
const ParticlesCSS = ({ count = 20, color = "rgba(255,255,255,0.5)", size = [2, 4], duration = 15, direction = 'up' as 'up' | 'down' | 'diagonal' }) => {
  const [particles, setParticles] = useState<{width: number, height: number, left: string, delay: string, duration: string}[]>([]);

  const minSize = size[0];
  const maxSize = size[1];

  useEffect(() => {
    setParticles(Array.from({ length: count }).map(() => ({
      width: Math.random() * (maxSize - minSize) + minSize,
      height: Math.random() * (maxSize - minSize) + minSize,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 5 + duration}s`,
    })));
  }, [count, minSize, maxSize, duration]);

  const animationName = direction === 'down' ? 'float-particle-down' : 'float-particle';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            background: color,
            width: p.width,
            height: p.height,
            left: p.left,
            bottom: direction === 'down' ? 'auto' : '-10%',
            top: direction === 'down' ? '-10%' : 'auto',
            animation: `${animationName} ${p.duration} linear infinite`,
            animationDelay: p.delay,
            willChange: 'transform, opacity'
          }}
        />
      ))}
    </div>
  );
};

// --- Prayer Backgrounds ---
export const PrayerBackground = ({ prayerName }: { prayerName: string }) => {
  const themeClass = useMemo(() => {
    switch(prayerName) {
      case 'الفجر': return 'bg-prayer-fajr';
      case 'الظهر': return 'bg-prayer-dhuhr';
      case 'العصر': return 'bg-prayer-asr';
      case 'المغرب': return 'bg-prayer-maghrib';
      case 'العشاء': return 'bg-prayer-isha';
      default: return 'bg-prayer-dhuhr';
    }
  }, [prayerName]);

  return (
    <div className={`absolute inset-0 overflow-hidden rounded-[inherit] -z-10 pointer-events-none ${themeClass} transition-colors duration-1000`}>
       {prayerName === 'الفجر' && <ParticlesCSS count={15} color="rgba(255,255,255,0.4)" duration={15} />}
       {prayerName === 'الظهر' && <ParticlesCSS count={10} color="rgba(255,255,255,0.6)" duration={20} />}
       {prayerName === 'العصر' && <ParticlesCSS count={20} color="rgba(255,230,150,0.6)" duration={18} direction="up" />}
       {prayerName === 'المغرب' && <ParticlesCSS count={15} color="rgba(255,200,150,0.5)" duration={20} />}
       {prayerName === 'العشاء' && <ParticlesCSS count={30} color="rgba(255,255,255,0.7)" size={[1, 2]} duration={10} />}
    </div>
  );
};

// --- Weather Backgrounds ---
export const WeatherBackground = ({ weatherCode, isNight }: { weatherCode: number, isNight: boolean }) => {
  const { themeClass, isThunder, particleType } = useMemo(() => {
    if (weatherCode === 0) return { themeClass: isNight ? 'bg-weather-clear-night' : 'bg-weather-clear', isThunder: false, particleType: isNight ? 'stars' : 'sun' };
    if ([1, 2, 3].includes(weatherCode)) return { themeClass: 'bg-weather-cloudy', isThunder: false, particleType: 'none' };
    if ([45, 48].includes(weatherCode)) return { themeClass: 'bg-weather-cloudy', isThunder: false, particleType: 'none' }; // fog
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { themeClass: 'bg-weather-rain', isThunder: false, particleType: 'rain' };
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { themeClass: 'bg-weather-snow', isThunder: false, particleType: 'snow' };
    if ([95, 96, 99].includes(weatherCode)) return { themeClass: 'bg-weather-thunderstorm', isThunder: true, particleType: 'rain' };
    return { themeClass: isNight ? 'bg-weather-clear-night' : 'bg-weather-clear', isThunder: false, particleType: isNight ? 'stars' : 'sun' };
  }, [weatherCode, isNight]);

  return (
    <div className={`absolute inset-0 overflow-hidden rounded-[inherit] -z-10 pointer-events-none ${themeClass} transition-colors duration-1000`}>
      {particleType === 'sun' && <ParticlesCSS count={15} color="rgba(255,255,255,0.5)" />}
      {particleType === 'stars' && <ParticlesCSS count={25} color="rgba(255,255,255,0.6)" size={[1, 2]} />}
      {particleType === 'rain' && <ParticlesCSS count={40} color="rgba(255,255,255,0.4)" size={[1, 3]} duration={3} direction="down" />}
      {particleType === 'snow' && <ParticlesCSS count={50} color="rgba(255,255,255,0.8)" size={[2, 5]} duration={8} direction="down" />}
      
      {isThunder && (
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ animation: 'flash-lightning 10s infinite' }} 
        />
      )}
    </div>
  );
};

// --- Hijri Calendar Background ---
export const HijriBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] -z-10 pointer-events-none bg-hijri-pattern">
      <ParticlesCSS count={20} color="rgba(212, 175, 55, 0.6)" size={[1, 3]} duration={20} />
      <div 
        className="absolute w-32 h-32 rounded-full blur-2xl pointer-events-none"
        style={{ 
          background: 'rgba(212, 175, 55, 0.1)', 
          top: '-10%', 
          left: '-10%',
          animation: 'float-particle 15s infinite alternate ease-in-out'
        }}
      />
    </div>
  );
};
