import React, { useState, useEffect, useMemo } from "react";
import { CloudSun, Clock, Calendar, Moon, Sun, Sunrise, Sunset, MapPin, Timer } from "lucide-react";

export const HeaderWidgets: React.FC = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Robust Hijri Date calculation
  const hijriParts = useMemo(() => {
    try {
      const dayMonth = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
      }).format(time);
      const year = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric'
      }).format(time);
      return { dayMonth, year };
    } catch (e) {
      return {
        dayMonth: time.toLocaleDateString("ar-SA-u-ca-islamic", { day: "numeric", month: "long" }),
        year: time.toLocaleDateString("ar-SA-u-ca-islamic", { year: "numeric" })
      };
    }
  }, [time]);

  const weather = {
    temp: 26,
    condition: "صافٍ",
    icon: <CloudSun className="w-4 h-4 text-amber-500" />,
  };

  const prayerTimes = useMemo(() => [
    { name: "الفجر", time: "04:32", icon: <Sunrise className="w-3.5 h-3.5 text-indigo-400" /> },
    { name: "الظهر", time: "12:15", icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { name: "العصر", time: "15:38", icon: <Sun className="w-3.5 h-3.5 text-orange-400" /> },
    { name: "المغرب", time: "18:45", icon: <Sunset className="w-3.5 h-3.5 text-rose-400" /> },
    { name: "العشاء", time: "20:02", icon: <Moon className="w-3.5 h-3.5 text-blue-400" /> },
  ], []);

  // Calculate Next Prayer
  const nextPrayerInfo = useMemo(() => {
    const currentHour = time.getHours();
    const currentMin = time.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    for (const prayer of prayerTimes) {
      const [pHour, pMin] = prayer.time.split(":").map(Number);
      const prayerTotalMins = pHour * 60 + pMin;
      
      if (prayerTotalMins > currentTotalMins) {
        const diff = prayerTotalMins - currentTotalMins;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return { 
          name: prayer.name, 
          countdown: hours > 0 ? `${hours} س و ${mins} د` : `${mins} د`,
          icon: prayer.icon
        };
      }
    }
    return { name: "الفجر", countdown: "غداً", icon: <Sunrise className="w-3.5 h-3.5 text-indigo-400" /> };
  }, [time, prayerTimes]);

  return (
    <div className="w-full flex items-center justify-between gap-2 bg-surface-main border-b border-slate-200/60 px-4 md:px-6 py-2 shadow-sm overflow-hidden" dir="rtl">
      
      <div className="flex items-center gap-4 md:gap-8 flex-nowrap min-w-0">
        {/* Platform Logo */}
        <div className="border-l border-slate-200/60 pl-3 shrink-0">
          <img src="/logo.png" alt="Platform Logo" className="h-11 w-auto object-contain" />
        </div>

        {/* Next Prayer Section */}
        <div className="flex items-center gap-2 border-l border-slate-200/60 pl-3 whitespace-nowrap shrink-0">
          <div className="bg-emerald-50 p-1.5 rounded-lg">
            {nextPrayerInfo.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-700 font-black leading-none mb-0.5">{nextPrayerInfo.name}</span>
            <span className="text-[9px] text-slate-500 font-bold leading-none">{nextPrayerInfo.countdown}</span>
          </div>
        </div>

        {/* Weather Section */}
        <div className="flex items-center gap-2 border-l border-slate-200/60 pl-3 whitespace-nowrap shrink-0">
          <div className="bg-amber-50 p-1.5 rounded-lg">
            {weather.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-800 font-black leading-none mb-0.5">{weather.temp}°</span>
            <span className="text-[9px] text-amber-600 font-bold leading-none">{weather.condition}</span>
          </div>
        </div>
      </div>

      {/* Hijri Date Section */}
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <Calendar className="w-4 h-4 text-blue-500" />
        <div className="flex flex-col">
          <span className="text-[11px] text-blue-700 font-black leading-none mb-0.5">{hijriParts.dayMonth}</span>
          <span className="text-[9px] text-slate-500 font-bold leading-none">{hijriParts.year}</span>
        </div>
      </div>

    </div>
  );
};
