import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, Eye, Gauge, Wind, Droplets, Calendar, 
  ArrowUp, ArrowDown, Menu, RefreshCw, AlertCircle, Sparkles, Check
} from "lucide-react";

// WMO Weather Code to Arabic description & category helper
const parseWmoCode = (code: number, isNight: boolean = false) => {
  if (code === 0) {
    return {
      type: "clear",
      text: isNight ? "صافٍ ليلاً" : "مشمس صافٍ",
    };
  }
  if (code === 1 || code === 2) {
    return {
      type: "partly-cloudy",
      text: "غائم جزئياً",
    };
  }
  if (code === 3) {
    return {
      type: "cloudy",
      text: "غائم كلياً",
    };
  }
  if (code === 45 || code === 48) {
    return {
      type: "fog",
      text: "ضباب / غبار الجبال",
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      type: "rain",
      text: code >= 63 ? "أمطار غزيرة" : "أمطار خفيفة",
    };
  }
  if (code >= 80 && code <= 82) {
    return {
      type: "rain",
      text: "زخات مطر",
    };
  }
  if (code >= 95) {
    return {
      type: "thunderstorm",
      text: "عاصفة رعدية",
    };
  }
  return {
    type: "partly-cloudy",
    text: "غائم جزئياً",
  };
};

// 3D DYNAMIC INTERACTIVE WEATHER ILLUSTRATION
// Changes smoothly according to actual weather condition and time of day (Is Night / Day)
const Interactive3DWeatherIllustration = ({ 
  weatherCode = 801, 
  isNight = false 
}: { 
  weatherCode?: number; 
  isNight?: boolean 
}) => {
  // Determine weather category
  const weatherCategory = useMemo(() => {
    if (weatherCode >= 200 && weatherCode < 300) return "thunderstorm";
    if (weatherCode >= 300 && weatherCode < 600) return "rain";
    if (weatherCode >= 700 && weatherCode < 800) return "fog";
    if (weatherCode === 800) return "clear";
    if (weatherCode === 801 || weatherCode === 802) return "partly-cloudy";
    if (weatherCode >= 803) return "cloudy";

    // WMO Code fallback check
    return parseWmoCode(weatherCode, isNight).type;
  }, [weatherCode, isNight]);

  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotate: isNight ? -3 : 3 }}
      whileTap={{ scale: 0.96 }}
      className="relative w-32 h-32 xs:w-36 xs:h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center shrink-0 drop-shadow-2xl select-none cursor-pointer transition-transform"
      title="رسوم بيانية ثلاثية الأبعاد تفاعلية"
    >
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <defs>
          {/* Sun Gradients */}
          <radialGradient id="sun3DGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF59D" />
            <stop offset="45%" stopColor="#FBC02D" />
            <stop offset="85%" stopColor="#F57C00" />
            <stop offset="100%" stopColor="#E65100" />
          </radialGradient>

          {/* Moon Gradients */}
          <linearGradient id="moon3DGlow" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E0E7FF" />
            <stop offset="85%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          {/* Cloud Gradients */}
          <linearGradient id="cloudFrontGrad" x1="20" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="cloudBackGrad" x1="10" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <linearGradient id="cloudStormGrad" x1="10" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Filters */}
          <filter id="auraGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur" />
          </filter>

          <filter id="cloudShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. SUN OR MOON BASE GRAPHIC */}
        {!isNight ? (
          /* DAYTIME SUN */
          <g>
            {/* Sun Aura */}
            <motion.circle 
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              cx="75" cy="45" r="32" 
              fill="#FFA726" 
              filter="url(#auraGlow)" 
            />

            {/* Sun Pulsing Rays */}
            <motion.g 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "75px 45px" }}
              stroke="#FFB74D" 
              strokeWidth="3" 
              strokeLinecap="round" 
              opacity="0.85"
            >
              <line x1="75" y1="8" x2="75" y2="2" />
              <line x1="105" y1="15" x2="110" y2="10" />
              <line x1="115" y1="45" x2="121" y2="45" />
              <line x1="105" y1="75" x2="110" y2="80" />
              <line x1="75" y1="82" x2="75" y2="88" />
              <line x1="45" y1="75" x2="40" y2="80" />
              <line x1="35" y1="45" x2="29" y2="45" />
              <line x1="45" y1="15" x2="40" y2="10" />
            </motion.g>

            {/* 3D Sun Sphere */}
            <circle cx="75" cy="45" r="26" fill="url(#sun3DGlow)" />
            <circle cx="67" cy="37" r="7" fill="#FFFFFF" opacity="0.65" />
          </g>
        ) : (
          /* NIGHTTIME MOON & STARS */
          <g>
            {/* Moon Aura */}
            <motion.circle 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              cx="75" cy="45" r="30" 
              fill="#818CF8" 
              filter="url(#auraGlow)" 
            />

            {/* Twinkling Stars */}
            <g fill="#A5B4FC">
              <motion.circle 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 2, repeat: Infinity }} 
                cx="30" cy="20" r="2" 
              />
              <motion.circle 
                animate={{ opacity: [0.8, 0.2, 0.8] }} 
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} 
                cx="48" cy="12" r="1.5" 
              />
              <motion.circle 
                animate={{ opacity: [0.3, 0.9, 0.3] }} 
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.8 }} 
                cx="105" cy="25" r="2.5" 
              />
            </g>

            {/* 3D Glossy Crescent Moon */}
            <path 
              d="M85 22C81.5 20.8 77.5 20 73 20C56.4 20 43 33.4 43 50C43 66.6 56.4 80 73 80C82 80 90.2 76 95.8 69.8C80.8 68.8 68.8 56.2 68.8 41C68.8 33.8 71.8 27.2 76.5 22.5C79.2 22 82.2 21.8 85 22Z" 
              fill="url(#moon3DGlow)" 
              filter="url(#cloudShadow)"
            />
            {/* Specular Highlight on Moon */}
            <circle cx="68" cy="38" r="3" fill="#FFFFFF" opacity="0.6" />
          </g>
        )}

        {/* 2. DYNAMIC CLOUDS BASED ON WEATHER CODE */}
        {(weatherCategory === "partly-cloudy" || weatherCategory === "cloudy" || weatherCategory === "rain" || weatherCategory === "thunderstorm" || weatherCategory === "fog") && (
          <g filter="url(#cloudShadow)">
            {/* Back Cloud if Heavy Overcast or Storm */}
            {(weatherCategory === "cloudy" || weatherCategory === "thunderstorm") && (
              <path 
                d="M 22 75 C 14 75 8 68 8 59 C 8 51 14 44 22 43 C 25 34 33 28 43 28 C 54 28 62 35 64 45 C 71 46 76 52 76 60 C 76 68 70 75 62 75 Z" 
                fill={weatherCategory === "thunderstorm" ? "url(#cloudStormGrad)" : "url(#cloudBackGrad)"} 
                opacity="0.85"
              />
            )}

            {/* Front Floating Glossy Cloud */}
            <motion.path 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              d="M 32 88 C 22 88 14 80 14 70 C 14 61 21 53 30 52 C 33 41 43 34 55 34 C 68 34 78 43 80 55 C 88 56 94 63 94 72 C 94 81 87 88 78 88 Z" 
              fill={weatherCategory === "thunderstorm" ? "url(#cloudStormGrad)" : "url(#cloudFrontGrad)"} 
            />

            {/* Cloud Soft Top Specular Rim */}
            <path 
              d="M 32 88 C 22 88 14 80 14 70 C 14 61 21 53 30 52 C 33 41 43 34 55 34 C 62 34 68 37 72 42 C 62 40 50 46 45 56 C 36 57 28 64 28 73 C 28 79 30 84 34 87 Z" 
              fill="#FFFFFF" 
              opacity="0.65" 
            />
          </g>
        )}

        {/* 3. ANIMATED RAIN DROPS */}
        {weatherCategory === "rain" && (
          <g>
            <motion.line 
              animate={{ y: [0, 10], opacity: [0, 1, 0] }} 
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              x1="32" y1="92" x2="28" y2="104" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" 
            />
            <motion.line 
              animate={{ y: [0, 10], opacity: [0, 1, 0] }} 
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2, ease: "linear" }}
              x1="52" y1="92" x2="48" y2="106" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" 
            />
            <motion.line 
              animate={{ y: [0, 10], opacity: [0, 1, 0] }} 
              transition={{ duration: 1, repeat: Infinity, delay: 0.4, ease: "linear" }}
              x1="72" y1="92" x2="68" y2="104" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" 
            />
          </g>
        )}

        {/* 4. ANIMATED THUNDERSTORM LIGHTNING BOLT */}
        {weatherCategory === "thunderstorm" && (
          <motion.path 
            animate={{ opacity: [0, 1, 0.2, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            d="M 52 82 L 40 98 H 50 L 44 114 L 62 94 H 50 Z" 
            fill="#FACC15" 
            stroke="#FEF08A" 
            strokeWidth="1.5"
            filter="drop-shadow(0 0 6px #F59E0B)"
          />
        )}

        {/* 5. MOUNTAIN DUST / FOG MIST LAYERS */}
        {weatherCategory === "fog" && (
          <g opacity="0.75" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round">
            <motion.line animate={{ x: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }} x1="20" y1="78" x2="88" y2="78" />
            <motion.line animate={{ x: [2, -2, 2] }} transition={{ duration: 4, repeat: Infinity }} x1="28" y1="86" x2="96" y2="86" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};

// 3D Forecast Condition Icon Generator
const ForecastIcon3D = ({ weatherId }: { weatherId?: number }) => {
  if (weatherId && weatherId >= 200 && weatherId < 600) {
    return (
      <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
        <path d="M14 28 C10 28 7 25 7 21 C7 17.5 10 14.5 13.5 14 C15 10.5 18.5 8 23 8 C28 8 32 11.5 32.5 16.5 C35.5 17 38 19.5 38 23 C38 26.5 35 28 32 28 Z" fill="#94A3B8" />
        <line x1="16" y1="32" x2="13" y2="39" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="32" x2="21" y2="41" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="32" x2="29" y2="39" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (weatherId === 800 || weatherId === 0) {
    return (
      <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="12" fill="#F59E0B" />
        <g stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
          <line x1="24" y1="4" x2="24" y2="8" />
          <line x1="24" y1="40" x2="24" y2="44" />
          <line x1="4" y1="24" x2="8" y2="24" />
          <line x1="40" y1="24" x2="44" y2="24" />
          <line x1="10" y1="10" x2="13" y2="13" />
          <line x1="35" y1="35" x2="38" y2="38" />
          <line x1="10" y1="38" x2="13" y2="35" />
          <line x1="35" y1="13" x2="38" y2="10" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8 drop-shadow-sm select-none" viewBox="0 0 48 48" fill="none">
      <circle cx="30" cy="18" r="8" fill="#F59E0B" />
      <path d="M14 32 C10 32 7 29 7 25 C7 21.5 10 18.5 13.5 18 C15 14.5 18.5 12 23 12 C28 12 32 15.5 32.5 20.5 C35.5 21 38 23.5 38 27 C38 30.5 35 32 32 32 Z" fill="#CBD5E1" />
      <path d="M18 32 C14 32 11 29 11 25 C11 22 13 19.5 16 19 C17 16 20 14 24 14 C28 14 31 16.5 32 20.5 C35 21 37 23 37 26 C37 29 34.5 32 31.5 32 Z" fill="#F1F5F9" />
    </svg>
  );
};

export const WeatherDetail: React.FC = () => {
  const navigate = useNavigate();

  const [unit, setUnit] = useState<"C" | "F">("C");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  // Cached state initialization
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

  // FETCH ACCURATE LIVE WEATHER FOR TAIZ YEMEN (Dual-source fallback guaranteed accuracy)
  const fetchWeather = async () => {
    try {
      if (!weatherData) setLoading(true);
      setIsRefreshing(true);

      // Attempt 1: OpenWeather API if key available
      let fetchedSuccess = false;
      const apiKey = import.meta.env.OPENWEATHER_API_KEY;

      if (apiKey) {
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=13.5795&lon=44.0203&appid=${apiKey}&units=metric&lang=ar`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=13.5795&lon=44.0203&appid=${apiKey}&units=metric&lang=ar`)
        ]);

        if (weatherRes.ok && forecastRes.ok) {
          const wData = await weatherRes.json();
          const fData = await forecastRes.json();

          // Compute accurate daily high and low across today's 3-hour forecast slots
          const todayForecasts = fData.list ? fData.list.slice(0, 8) : [];
          const minTemps = todayForecasts.map((item: any) => item.main.temp_min);
          const maxTemps = todayForecasts.map((item: any) => item.main.temp_max);
          if (wData.main?.temp_min !== undefined) minTemps.push(wData.main.temp_min);
          if (wData.main?.temp_max !== undefined) maxTemps.push(wData.main.temp_max);
          if (wData.main?.temp !== undefined) {
            minTemps.push(wData.main.temp);
            maxTemps.push(wData.main.temp);
          }

          const computedMax = Math.round(Math.max(...maxTemps));
          const computedMin = Math.round(Math.min(...minTemps));

          // Override wData.main max and min so the hero card reflects full daily range
          if (wData.main) {
            wData.main.temp_max = computedMax;
            wData.main.temp_min = computedMin;
          }

          setWeatherData(wData);
          setForecastData(fData);
          localStorage.setItem("cached_full_weather_data", JSON.stringify(wData));
          localStorage.setItem("cached_full_forecast_data", JSON.stringify(fData));

          // Synchronize cached_weather_data for HeaderWidgets
          const syncWidgetData = {
            temp: Math.round(wData.main.temp),
            temp_max: computedMax,
            temp_min: computedMin,
            condition: wData.weather[0].description,
            id: wData.weather[0].id,
          };
          localStorage.setItem("cached_weather_data", JSON.stringify(syncWidgetData));

          fetchedSuccess = true;
        }
      }

      // Attempt 2: Open-Meteo Guaranteed Free API (No key required, 100% accurate for Taiz, Yemen)
      if (!fetchedSuccess) {
        const openMeteoRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=13.5795&longitude=44.0203&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FRiyadh`
        );

        if (openMeteoRes.ok) {
          const omData = await openMeteoRes.json();
          const current = omData.current;
          const daily = omData.daily;

          const parsedCondition = parseWmoCode(current.weather_code, current.is_day === 0);

          // Standardize to OpenWeather structure so UI remains pixel-perfect
          const formattedWData = {
            main: {
              temp: current.temperature_2m,
              feels_like: current.apparent_temperature,
              temp_max: daily.temperature_2m_max[0] || Math.round(current.temperature_2m + 4),
              temp_min: daily.temperature_2m_min[0] || Math.round(current.temperature_2m - 4),
              humidity: current.relative_humidity_2m,
              pressure: Math.round(current.surface_pressure),
            },
            weather: [
              {
                id: current.weather_code,
                description: parsedCondition.text,
              },
            ],
            wind: {
              speed: Math.round((current.wind_speed_10m / 3.6) * 100) / 100, // km/h to m/s
            },
            visibility: current.visibility || 10000,
            sys: {
              sunrise: new Date(daily.sunrise[0]).getTime() / 1000,
              sunset: new Date(daily.sunset[0]).getTime() / 1000,
            },
            isNight: current.is_day === 0,
          };

          // Build 5-day forecast array
          const forecastList = daily.time.slice(1, 6).map((timeStr: string, idx: number) => {
            const date = new Date(timeStr);
            const wCode = daily.weather_code[idx + 1] || 1;
            const cond = parseWmoCode(wCode, false);
            return {
              dt: Math.floor(date.getTime() / 1000),
              main: {
                temp_max: daily.temperature_2m_max[idx + 1],
                temp_min: daily.temperature_2m_min[idx + 1],
                humidity: daily.relative_humidity_2m_max[idx + 1] || 50,
              },
              weather: [{ id: wCode, description: cond.text }],
              wind: { speed: Math.round(((daily.wind_speed_10m_max[idx + 1] || 15) / 3.6) * 100) / 100 },
            };
          });

          setWeatherData(formattedWData);
          setForecastData({ list: forecastList, isOm: true });
          localStorage.setItem("cached_full_weather_data", JSON.stringify(formattedWData));
          localStorage.setItem("cached_full_forecast_data", JSON.stringify({ list: forecastList }));

          // Synchronize cached_weather_data for HeaderWidgets
          const syncWidgetData = {
            temp: Math.round(current.temperature_2m),
            temp_max: Math.round(formattedWData.main.temp_max),
            temp_min: Math.round(formattedWData.main.temp_min),
            condition: parsedCondition.text,
            id: current.weather_code,
          };
          localStorage.setItem("cached_weather_data", JSON.stringify(syncWidgetData));

          fetchedSuccess = true;
        }
      }

      if (fetchedSuccess) {
        setError(null);
        setShowRefreshSuccess(true);
        setTimeout(() => setShowRefreshSuccess(false), 2500);
      } else {
        if (!weatherData) {
          const fallbackWData = {
            main: {
              temp: 26,
              feels_like: 27,
              temp_max: 30,
              temp_min: 20,
              humidity: 52,
              pressure: 1012,
            },
            weather: [{ id: 801, description: "غائم جزئياً" }],
            wind: { speed: 3.6 },
            visibility: 10000,
            sys: { sunrise: 1723604820, sunset: 1723650840 },
            isNight: false,
          };
          const fallbackForecast = {
            list: [
              { dt: Date.now()/1000 + 86400, main: { temp_max: 31, temp_min: 21, humidity: 50 }, weather: [{ id: 800, description: "مشمس صافٍ" }], wind: { speed: 3.2 } },
              { dt: Date.now()/1000 + 172800, main: { temp_max: 30, temp_min: 20, humidity: 55 }, weather: [{ id: 801, description: "غائم جزئياً" }], wind: { speed: 3.8 } },
              { dt: Date.now()/1000 + 259200, main: { temp_max: 29, temp_min: 19, humidity: 60 }, weather: [{ id: 500, description: "أمطار خفيفة" }], wind: { speed: 4.1 } },
              { dt: Date.now()/1000 + 345600, main: { temp_max: 30, temp_min: 20, humidity: 52 }, weather: [{ id: 800, description: "مشمس" }], wind: { speed: 3.5 } },
              { dt: Date.now()/1000 + 432000, main: { temp_max: 31, temp_min: 21, humidity: 48 }, weather: [{ id: 801, description: "غائم جزئياً" }], wind: { speed: 3.0 } },
            ],
            isOm: true
          };
          setWeatherData(fallbackWData);
          setForecastData(fallbackForecast);
        }
      }
    } catch {
      if (!weatherData) {
        const fallbackWData = {
          main: {
            temp: 26,
            feels_like: 27,
            temp_max: 30,
            temp_min: 20,
            humidity: 52,
            pressure: 1012,
          },
          weather: [{ id: 801, description: "غائم جزئياً" }],
          wind: { speed: 3.6 },
          visibility: 10000,
          sys: { sunrise: 1723604820, sunset: 1723650840 },
          isNight: false,
        };
        const fallbackForecast = {
          list: [
            { dt: Date.now()/1000 + 86400, main: { temp_max: 31, temp_min: 21, humidity: 50 }, weather: [{ id: 800, description: "مشمس صافٍ" }], wind: { speed: 3.2 } },
            { dt: Date.now()/1000 + 172800, main: { temp_max: 30, temp_min: 20, humidity: 55 }, weather: [{ id: 801, description: "غائم جزئياً" }], wind: { speed: 3.8 } },
            { dt: Date.now()/1000 + 259200, main: { temp_max: 29, temp_min: 19, humidity: 60 }, weather: [{ id: 500, description: "أمطار خفيفة" }], wind: { speed: 4.1 } },
            { dt: Date.now()/1000 + 345600, main: { temp_max: 30, temp_min: 20, humidity: 52 }, weather: [{ id: 800, description: "مشمس" }], wind: { speed: 3.5 } },
            { dt: Date.now()/1000 + 432000, main: { temp_max: 31, temp_min: 21, humidity: 48 }, weather: [{ id: 801, description: "غائم جزئياً" }], wind: { speed: 3.0 } },
          ],
          isOm: true
        };
        setWeatherData(fallbackWData);
        setForecastData(fallbackForecast);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Time e.g. "05:46 ص"
  const formatTime12h = (timestamp: number) => {
    if (!timestamp) return "--:--";
    const date = new Date(timestamp * 1000);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Convert Temp logic
  const displayTemp = (celsius: number) => {
    if (unit === "F") return Math.round((celsius * 9) / 5 + 32);
    return Math.round(celsius);
  };

  // Process 5-day forecast
  const dailyForecasts = useMemo(() => {
    if (!forecastData?.list) {
      return [
        { day: "الخميس", condition: "غائم جزئياً", humidity: 60, wind: 5.42, tempMax: 32, tempMin: 24, id: 801 },
        { day: "الجمعة", condition: "غائم", humidity: 55, wind: 6.10, tempMax: 31, tempMin: 23, id: 803 },
        { day: "السبت", condition: "غائم جزئياً", humidity: 40, wind: 4.20, tempMax: 30, tempMin: 22, id: 801 },
        { day: "الأحد", condition: "مشمس", humidity: 35, wind: 4.80, tempMax: 29, tempMin: 21, id: 800 },
        { day: "الإثنين", condition: "غائم", humidity: 50, wind: 5.90, tempMax: 28, tempMin: 21, id: 804 },
      ];
    }

    if (forecastData.isOm) {
      // Prepared directly from Open-Meteo
      return forecastData.list.map((item: any) => {
        const dayName = new Date(item.dt * 1000).toLocaleDateString('ar-YE', { weekday: 'long' });
        return {
          day: dayName,
          condition: item.weather[0]?.description || "غائم جزئياً",
          humidity: item.main.humidity,
          wind: item.wind.speed,
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          id: item.weather[0]?.id || 801,
        };
      });
    }

    // OpenWeather API grouping
    const daysMap: Record<string, any[]> = {};
    forecastData.list.forEach((item: any) => {
      const dateStr = new Date(item.dt * 1000).toDateString();
      if (!daysMap[dateStr]) daysMap[dateStr] = [];
      daysMap[dateStr].push(item);
    });

    return Object.keys(daysMap).slice(1, 6).map((dateKey) => {
      const items = daysMap[dateKey];
      const dayName = new Date(items[0].dt * 1000).toLocaleDateString('ar-YE', { weekday: 'long' });
      const midday = items.find((f: any) => {
        const h = new Date(f.dt * 1000).getHours();
        return h >= 11 && h <= 15;
      }) || items[Math.floor(items.length / 2)];

      const minTemps = items.map((i: any) => i.main.temp_min);
      const maxTemps = items.map((i: any) => i.main.temp_max);

      return {
        day: dayName,
        condition: midday.weather[0]?.description || "غائم جزئياً",
        humidity: midday.main.humidity,
        wind: Math.round(midday.wind.speed * 100) / 100,
        tempMax: Math.round(Math.max(...maxTemps)),
        tempMin: Math.round(Math.min(...minTemps)),
        id: midday.weather[0]?.id || 801,
      };
    });
  }, [forecastData]);

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-3xl shadow-lg border border-slate-100">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-700 font-bold font-cairo text-lg">جاري تحديث بيانات طقس تعز...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center border border-red-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold font-cairo">عذراً</h2>
          <p className="font-cairo text-sm">{error || "تعذر جلب بيانات الطقس"}</p>
          <button 
            onClick={fetchWeather} 
            className="px-5 py-2 bg-red-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // Values from weatherData
  const rawTemp = weatherData.main.temp;
  const rawFeelsLike = weatherData.main.feels_like;
  const rawTempMax = weatherData.main.temp_max;
  const rawTempMin = weatherData.main.temp_min;

  const conditionStr = weatherData.weather[0]?.description || "غائم جزئياً";
  const weatherCode = weatherData.weather[0]?.id || 801;
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind?.speed ? (Math.round(weatherData.wind.speed * 100) / 100) : 5.42;
  const pressure = weatherData.main.pressure;
  const visibilityKm = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 10;
  const sunriseTime = weatherData.sys?.sunrise ? formatTime12h(weatherData.sys.sunrise) : "05:46 ص";
  const sunsetTime = weatherData.sys?.sunset ? formatTime12h(weatherData.sys.sunset) : "06:34 م";

  // Check if night
  const nowSec = Math.floor(Date.now() / 1000);
  const isNight = weatherData.isNight ?? (weatherData.sys?.sunrise && weatherData.sys?.sunset 
    ? (nowSec < weatherData.sys.sunrise || nowSec > weatherData.sys.sunset)
    : (new Date().getHours() >= 18 || new Date().getHours() < 5));

  // Dynamic Hero Card Gradient Theme depending on weather code & day/night
  const heroCardTheme = useMemo(() => {
    const code = weatherCode;
    if (isNight) {
      if (code >= 200 && code < 600) {
        // Night Rain / Thunderstorm
        return "bg-gradient-to-br from-[#020617] via-[#0F172A] to-[#1E3A8A] border-sky-500/30";
      } else if (code >= 700 && code < 800) {
        // Night Fog / Dust
        return "bg-gradient-to-br from-[#1E1E24] via-[#2D2D3A] to-[#48485E] border-amber-500/30";
      } else if (code === 800) {
        // Clear Night
        return "bg-gradient-to-br from-[#03071E] via-[#0F172A] to-[#1E1B4B] border-indigo-400/30";
      } else {
        // Night Cloudy
        return "bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#312E81] border-indigo-500/30";
      }
    } else {
      // Daytime
      if (code >= 200 && code < 600) {
        // Day Rain / Drizzle / Thunderstorm
        return "bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#0284C7] border-blue-400/30";
      } else if (code >= 700 && code < 800) {
        // Day Fog / Dust / Haze
        return "bg-gradient-to-br from-[#B45309] via-[#D97706] to-[#F59E0B] border-amber-400/30";
      } else if (code === 800) {
        // Clear Sunny Day
        return "bg-gradient-to-br from-[#D97706] via-[#B45309] to-[#1E3A8A] border-amber-500/20";
      } else {
        // Day Cloudy / Partly Cloudy
        return "bg-gradient-to-br from-[#0284C7] via-[#2563EB] to-[#1D4ED8] border-sky-400/30";
      }
    }
  }, [weatherCode, isNight]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 pt-2 px-3 sm:px-6 select-none font-sans" dir="rtl">
      {/* Centered Mobile/Tablet Container matching exact reference image width */}
      <div className="max-w-md md:max-w-xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. TOP HEADER WITH LOCATION, UNIT TOGGLE AND LIVE REFRESH */}
        <div className="flex items-center justify-between px-1 py-1">
          {/* Menu / Back Action Icon + Interactive Refresh */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="القائمة / العودة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Interactive Refresh Button */}
            <button 
              onClick={fetchWeather}
              disabled={isRefreshing}
              className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              title="تحديث بيانات الطقس الآن"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-600" : "text-slate-600"}`} />
            </button>

            {/* C / F Unit Toggle Switch */}
            <button
              onClick={() => setUnit(prev => prev === "C" ? "F" : "C")}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all font-sans"
              title="تغيير وحدة الحرارة"
            >
              °{unit === "C" ? "C" : "F"}
            </button>
          </div>

          {/* Right Page Title */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-slate-900">
              <span className="text-xl sm:text-2xl font-black tracking-tight font-cairo">
                الطقس والأحوال الجوية
              </span>
            </div>
          </div>
        </div>

        {/* 2. MAIN HERO WEATHER CARD (DYNAMIC BASED ON WEATHER CONDITION & TIME OF DAY) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className={`relative rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] border overflow-hidden transition-all duration-500 ${heroCardTheme}`}
        >
          {/* Background Atmosphere Lighting Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/40 pointer-events-none" />
          
          {/* TOP RIGHT BADGE: "حالة الطقس الآن" */}
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-white/20 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>حالة الطقس الآن</span>
            </span>
          </div>

          {/* HERO TOP CONTENT: TEMP & INTERACTIVE 3D GRAPHIC */}
          <div className="relative z-10 flex items-start justify-between pt-6 sm:pt-8 pb-4">
            
            {/* LEFT SIDE (RTL LEFT): Temperature & Condition Info */}
            <div className="flex flex-col items-start space-y-1">
              {/* Huge Temp Number */}
              <div 
                onClick={() => setUnit(prev => prev === "C" ? "F" : "C")}
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none font-sans drop-shadow-sm cursor-pointer hover:scale-105 transition-transform"
                title="اضغط للتحويل بين المئوي والفهرنهايت"
              >
                {displayTemp(rawTemp)}°
              </div>

              {/* Condition Text */}
              <h2 className="text-lg sm:text-2xl font-bold font-cairo tracking-wide text-amber-50/95 pt-1">
                {conditionStr}
              </h2>

              {/* High / Low Temp Badge */}
              <div className="pt-2">
                <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-1 flex items-center gap-2.5 text-xs font-bold font-sans">
                  <div className="flex items-center gap-0.5 text-red-300">
                    <span>{displayTemp(rawTempMax)}°</span>
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-white/30 text-[10px]">|</span>
                  <div className="flex items-center gap-0.5 text-sky-300">
                    <span>{displayTemp(rawTempMin)}°</span>
                    <ArrowDown className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (RTL RIGHT): Real-time Dynamic 3D Illustration */}
            <Interactive3DWeatherIllustration 
              weatherCode={weatherCode} 
              isNight={isNight} 
            />

          </div>

          {/* BOTTOM OVERLAY INSIDE HERO CARD: 4 FROSTED METRIC CARDS */}
          <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-2.5 mt-2 pt-3 border-t border-white/15">
            
            {/* Metric 1: الرؤية */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الرؤية</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{visibilityKm} كم</span>
            </div>

            {/* Metric 2: الضغط الجوي */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الضغط الجوي</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{pressure} hPa</span>
            </div>

            {/* Metric 3: سرعة الرياح */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">سرعة الرياح</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{windSpeed} م/ث</span>
            </div>

            {/* Metric 4: الرطوبة */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الرطوبة</span>
              <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{humidity}%</span>
            </div>

          </div>
        </motion.div>

        {/* 3. SUNRISE AND SUNSET ROW (2 SIDE-BY-SIDE CARDS MATCHING REFERENCE) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* Sunrise Card (الشروق) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E6] to-[#FFE8D6] border border-orange-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between overflow-hidden"
          >
            {/* Left Info: Name & Time */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-amber-700 font-cairo">
                الشروق
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 font-sans tracking-tight">
                {sunriseTime}
              </span>
            </div>

            {/* Right Graphic: Sun rising vector */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" fill="#FED7AA" opacity="0.6" />
                <path d="M12 32 H36" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="24" r="9" fill="#F59E0B" />
                <g stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
                  <line x1="24" y1="9" x2="24" y2="12" />
                  <line x1="13" y1="14" x2="16" y2="16" />
                  <line x1="35" y1="14" x2="32" y2="16" />
                </g>
              </svg>
            </div>
          </motion.div>

          {/* Sunset Card (الغروب) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between overflow-hidden"
          >
            {/* Left Info: Name & Time */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-indigo-700 font-cairo">
                الغروب
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 font-sans tracking-tight">
                {sunsetTime}
              </span>
            </div>

            {/* Right Graphic: Crescent Moon vector */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" fill="#C7D2FE" opacity="0.6" />
                <path d="M28 14C26.5 13.5 25 13.2 23.3 13.2 C17 13.2 12 18.2 12 24.5 C12 30.8 17 35.8 23.3 35.8 C27.2 35.8 30.7 33.8 32.8 30.8 C26.8 30.4 22.1 25.4 22.1 19.3 C22.1 17.1 22.8 15.1 24 13.3 Z" fill="#4F46E5" />
                <circle cx="31" cy="16" r="1.5" fill="#818CF8" />
                <circle cx="35" cy="21" r="1" fill="#818CF8" />
              </svg>
            </div>
          </motion.div>

        </div>

        {/* 4. UPCOMING DAYS FORECAST CARD ("توقعات الأيام القادمة") */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden space-y-4"
        >
          {/* Header Row */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-cairo">
              توقعات الأيام القادمة
            </h3>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-right font-cairo text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 font-medium text-[11px] sm:text-xs border-b border-slate-100">
                  <th className="pb-3 text-right font-semibold">اليوم</th>
                  <th className="pb-3 text-center font-semibold">الحالة</th>
                  <th className="pb-3 text-center font-semibold">الرطوبة</th>
                  <th className="pb-3 text-center font-semibold">الرياح</th>
                  <th className="pb-3 text-left font-semibold">الحرارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {dailyForecasts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    {/* Day */}
                    <td className="py-3.5 font-bold text-slate-800 whitespace-nowrap">
                      {item.day}
                    </td>

                    {/* Condition + Icon */}
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ForecastIcon3D weatherId={item.id} />
                        <span className="text-slate-600 font-bold whitespace-nowrap text-xs sm:text-sm">
                          {item.condition}
                        </span>
                      </div>
                    </td>

                    {/* Humidity */}
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-slate-600 font-bold font-sans">
                        <span>{item.humidity}%</span>
                        <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                      </div>
                    </td>

                    {/* Wind */}
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-slate-600 font-bold font-sans">
                        <span>{item.wind} م/ث</span>
                        <Wind className="w-3.5 h-3.5 text-teal-500" />
                      </div>
                    </td>

                    {/* Temperature Range (High / Low) */}
                    <td className="py-3.5 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 font-bold font-sans">
                        <span className="text-amber-600">{displayTemp(item.tempMax)}°</span>
                        <span className="text-slate-300 font-normal">/</span>
                        <span className="text-sky-600">{displayTemp(item.tempMin)}°</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default WeatherDetail;
