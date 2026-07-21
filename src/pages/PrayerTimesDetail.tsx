import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { API_BASE, fetchWithFallback } from "../config/apiConfig";
import { Sunrise, Sun, Sunset, Moon, MapPin, Clock } from "lucide-react";

export const PrayerTimesDetail: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<{ name: string; time: string; icon: React.ReactNode }[] | null>(() => {
    try {
      const cached = localStorage.getItem("cached_detail_prayer_times");
      if (cached) {
        // Since ReactNodes (JSX elements like Sunrise, Sun) can't be stored in JSON, we need to reconstruct them
        const parsed = JSON.parse(cached);
        return parsed.map((p: any) => {
          let icon: React.ReactNode = null;
          if (p.name === "الفجر") icon = <Sunrise className="w-6 h-6 text-indigo-500" />;
          else if (p.name === "الشروق") icon = <Sunrise className="w-6 h-6 text-amber-500" />;
          else if (p.name === "الظهر") icon = <Sun className="w-6 h-6 text-amber-500" />;
          else if (p.name === "العصر") icon = <Sun className="w-6 h-6 text-orange-500" />;
          else if (p.name === "المغرب") icon = <Sunset className="w-6 h-6 text-rose-500" />;
          else if (p.name === "العشاء") icon = <Moon className="w-6 h-6 text-blue-500" />;
          return { name: p.name, time: p.time, icon };
        });
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!prayerTimes);
  const [error, setError] = useState<string | null>(null);
  const [hijriDate, setHijriDate] = useState<string>(() => {
    try {
      return localStorage.getItem("cached_detail_hijri_date") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        if (!prayerTimes) setLoading(true);
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Taiz&country=Yemen&method=4`);
        if (response.ok) {
          const data = await response.json();
          const timings = data.data.timings;
          
          const newPrayerTimes = [
            { name: "الفجر", time: timings.Fajr },
            { name: "الشروق", time: timings.Sunrise },
            { name: "الظهر", time: timings.Dhuhr },
            { name: "العصر", time: timings.Asr },
            { name: "المغرب", time: timings.Maghrib },
            { name: "العشاء", time: timings.Isha },
          ];
          
          setPrayerTimes(newPrayerTimes.map((p: any) => {
            let icon: React.ReactNode = null;
            if (p.name === "الفجر") icon = <Sunrise className="w-6 h-6 text-indigo-500" />;
            else if (p.name === "الشروق") icon = <Sunrise className="w-6 h-6 text-amber-500" />;
            else if (p.name === "الظهر") icon = <Sun className="w-6 h-6 text-amber-500" />;
            else if (p.name === "العصر") icon = <Sun className="w-6 h-6 text-orange-500" />;
            else if (p.name === "المغرب") icon = <Sunset className="w-6 h-6 text-rose-500" />;
            else if (p.name === "العشاء") icon = <Moon className="w-6 h-6 text-blue-500" />;
            return { name: p.name, time: p.time, icon };
          }));
          
          localStorage.setItem("cached_detail_prayer_times", JSON.stringify(newPrayerTimes));

          const hijri = data.data.date.hijri;
          const newHijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;
          setHijriDate(newHijriDate);
          localStorage.setItem("cached_detail_hijri_date", newHijriDate);
          setError(null);
        } else {
          setError("تعذر جلب مواقيت الصلاة");
        }
      } catch (err) {
        console.error("Failed to fetch prayer times", err);
        if (!prayerTimes) {
          setError("حدث خطأ أثناء جلب البيانات");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrayerTimes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium font-cairo">جاري تحميل مواقيت الصلاة...</p>
        </div>
      </div>
    );
  }

  if (error || !prayerTimes) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex flex-col items-center gap-4 max-w-sm text-center">
          <p className="font-cairo">{error || "تعذر جلب مواقيت الصلاة"}</p>
        </div>
      </div>
    );
  }

  // Convert 24h format to 12h format for display
  const formatTime12h = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-4xl mx-auto px-4 py-8"
      dir="rtl"
    >
      <div className="flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo text-slate-800 mb-2">مواقيت الصلاة</h1>
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="font-cairo">تعز، اليمن</span>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-emerald-600/80 font-cairo font-bold mb-0.5">التاريخ الهجري</p>
              <p className="font-cairo font-bold text-emerald-900">{hijriDate}</p>
            </div>
          </div>
        </div>

        {/* Times Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prayerTimes.map((prayer, idx) => (
            <motion.div
              key={prayer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 group-hover:bg-emerald-50 transition-colors rounded-2xl flex items-center justify-center">
                  {prayer.icon}
                </div>
                <span className="text-xl font-bold font-cairo text-slate-800">
                  {prayer.name}
                </span>
              </div>
              
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-800 tabular-nums" dir="ltr">
                  {formatTime12h(prayer.time)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
