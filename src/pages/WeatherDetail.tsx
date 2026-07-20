import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { API_BASE, fetchWithFallback } from "../config/apiConfig";
import { 
  CloudSun, Wind, Droplets, Gauge, 
  Sunrise, Sunset, MapPin, Cloud, AlertCircle, CalendarDays,
  Sun, CloudRain, CloudLightning, CloudSnow, CloudDrizzle, CloudFog
} from "lucide-react";

export const WeatherDetail: React.FC = () => {
  const [weatherData, setWeatherData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("cached_full_weather_data");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [forecastData, setForecastData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("cached_full_forecast_data");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!weatherData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!weatherData) setLoading(true);
        const [weatherRes, forecastRes] = await Promise.all([
          fetchWithFallback(`/api/weather?lat=13.5795&lon=44.0203`),
          fetchWithFallback(`/api/forecast?lat=13.5795&lon=44.0203`)
        ]);
        
        if (weatherRes.ok && forecastRes.ok) {
          const wData = await weatherRes.json();
          const fData = await forecastRes.json();
          setWeatherData(wData);
          setForecastData(fData);
          localStorage.setItem("cached_full_weather_data", JSON.stringify(wData));
          localStorage.setItem("cached_full_forecast_data", JSON.stringify(fData));
          setError(null);
        } else {
          setError("تعذر جلب بيانات الطقس");
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
        if (!weatherData) {
          setError("حدث خطأ أثناء جلب البيانات");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium font-cairo">جاري تحميل بيانات الطقس...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold font-cairo">عذراً</h2>
          <p className="font-cairo">{error || "تعذر جلب بيانات الطقس"}</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('ar-YE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const processForecastData = () => {
    if (!forecastData?.list) return [];
    
    // Group forecast by day and get a midday reading for each day
    const dailyData = forecastData.list.reduce((acc: any, item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-US');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});

    const processed = Object.keys(dailyData).map(date => {
      const dayForecasts = dailyData[date];
      // Try to find a forecast close to 12:00 PM, or just take the middle one
      const middayForecast = dayForecasts.find((f: any) => {
        const hour = new Date(f.dt * 1000).getHours();
        return hour >= 11 && hour <= 15;
      }) || dayForecasts[Math.floor(dayForecasts.length / 2)];
      
      const minTemp = Math.min(...dayForecasts.map((f: any) => f.main.temp_min));
      const maxTemp = Math.max(...dayForecasts.map((f: any) => f.main.temp_max));
      
      return {
        ...middayForecast,
        dailyMin: minTemp,
        dailyMax: maxTemp,
      };
    });

    // Skip today to only show upcoming 5 days
    return processed.slice(1, 6);
  };

  const dailyForecasts = processForecastData();

  const getDayName = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ar-YE', { weekday: 'long' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-4xl mx-auto px-4 py-8"
      dir="rtl"
    >
      <div className="flex flex-col gap-6">
        {/* Header / Location */}
        <div className="flex items-center gap-2 text-slate-800">
          <MapPin className="w-6 h-6 text-amber-500" />
          <h1 className="text-3xl font-bold font-cairo">
            تعز، اليمن
          </h1>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="text-7xl font-bold tracking-tighter">
                {Math.round(weatherData.main.temp)}°
              </div>
              <p className="text-xl font-medium font-cairo opacity-90">
                {weatherData.weather[0]?.description || 'غير متوفر'}
              </p>
              <div className="text-sm opacity-80 mt-2 font-cairo">
                الاحساس الفعلي: {Math.round(weatherData.main.feels_like)}°
              </div>
            </div>
            
            <div className="w-32 h-32 md:w-48 md:h-48 drop-shadow-lg flex items-center justify-center">
              {weatherData.weather[0] ? getWeatherIcon(weatherData.weather[0].id, "w-full h-full text-white/90") : <CloudSun className="w-full h-full text-white/90" />}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Wind className="w-6 h-6 text-blue-500" />}
            title="سرعة الرياح"
            value={`${weatherData.wind.speed} م/ث`}
          />
          <StatCard 
            icon={<Droplets className="w-6 h-6 text-cyan-500" />}
            title="الرطوبة"
            value={`${weatherData.main.humidity}%`}
          />
          <StatCard 
            icon={<Gauge className="w-6 h-6 text-purple-500" />}
            title="الضغط الجوي"
            value={`${weatherData.main.pressure} hPa`}
          />
          <StatCard 
            icon={<Cloud className="w-6 h-6 text-slate-400" />}
            title="الغطاء السحابي"
            value={`${weatherData.clouds.all}%`}
          />
        </div>

        {/* Sun Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <Sunrise className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium font-cairo text-sm">الشروق</span>
                <span className="text-xl font-bold text-slate-800">{formatTime(weatherData.sys.sunrise)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                <Sunset className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium font-cairo text-sm">الغروب</span>
                <span className="text-xl font-bold text-slate-800">{formatTime(weatherData.sys.sunset)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        {dailyForecasts.length > 0 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm mt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-xl">
                <CalendarDays className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">توقعات الأيام الـ 5 القادمة</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right font-cairo">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-sm">
                    <th className="pb-4 font-medium">اليوم</th>
                    <th className="pb-4 font-medium">الحالة</th>
                    <th className="pb-4 font-medium text-center">الرطوبة</th>
                    <th className="pb-4 font-medium text-center">الرياح</th>
                    <th className="pb-4 font-medium min-w-[120px] text-left">الحرارة (صغرى / كبرى)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyForecasts.map((forecast: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-800">
                        {getDayName(forecast.dt)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-amber-500">
                            {forecast.weather[0] ? getWeatherIcon(forecast.weather[0].id, "w-6 h-6 text-amber-500") : <Cloud className="w-5 h-5 text-slate-400" />}
                          </div>
                          <span className="text-slate-600 font-medium">{forecast.weather[0]?.description}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600">
                          <Droplets className="w-4 h-4 text-cyan-500" />
                          <span>{forecast.main.humidity}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-slate-600">{Math.round(forecast.wind.speed)} م/ث</span>
                      </td>
                      <td className="py-4 text-left">
                        <div className="flex items-center justify-end gap-2 font-bold">
                          <span className="text-blue-500">{Math.round(forecast.dailyMin)}°</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-orange-500">{Math.round(forecast.dailyMax)}°</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
    <div className="bg-slate-50 p-3 rounded-full">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-slate-500 font-medium font-cairo text-xs mb-1">{title}</span>
      <span className="text-lg font-bold text-slate-800">{value}</span>
    </div>
  </div>
);

// Map OpenWeather API condition codes to Lucide icons
// See: https://openweathermap.org/weather-conditions
const getWeatherIcon = (code: number, className: string) => {
  if (code >= 200 && code < 300) return <CloudLightning className={className} />;
  if (code >= 300 && code < 400) return <CloudDrizzle className={className} />;
  if (code >= 500 && code < 600) return <CloudRain className={className} />;
  if (code >= 600 && code < 700) return <CloudSnow className={className} />;
  if (code >= 700 && code < 800) return <CloudFog className={className} />;
  if (code === 800) return <Sun className={className} />;
  if (code === 801 || code === 802) return <CloudSun className={className} />;
  return <Cloud className={className} />; // 803, 804 (mostly cloudy/overcast)
};
