const fs = require('fs');
let code = fs.readFileSync('src/pages/WeatherDetail.tsx', 'utf8');

// 1. Add restOfDayThemeStr
code = code.replace(
  "  const heroCardThemeStr = useMemo(() => {\n    const category = getCategoryFromCode(weatherCode, isNight);\n    return getWeatherTheme(category, isNight).theme;\n  }, [weatherCode, isNight]);",
  `  const heroCardThemeStr = useMemo(() => {
    const category = getCategoryFromCode(weatherCode, isNight);
    return getWeatherTheme(category, isNight).theme;
  }, [weatherCode, isNight]);

  const restOfDayThemeStr = useMemo(() => {
    const today = dailyForecasts?.[0];
    if (!today) return "from-sky-400 to-blue-500";
    const category = getCategoryFromCode(today.id, false);
    return getWeatherTheme(category, false).theme;
  }, [dailyForecasts]);`
);

// 2. Replace MAIN HERO WEATHER CARD with both cards
const originalCardRegex = /\{\/\* 2\. MAIN HERO WEATHER CARD.*?<\/motion\.div>/s;
const match = code.match(originalCardRegex);
if (!match) {
    console.error("Could not find hero card block");
    process.exit(1);
}

const originalCard = match[0];
const updatedCard = originalCard.replace(
  '{/* LEFT SIDE (RTL LEFT): Temperature & Condition Info */}\n            <div className="flex flex-col items-start space-y-1">',
  `{/* LEFT SIDE (RTL LEFT): Temperature & Condition Info */}
            <div className="flex flex-col items-start space-y-1">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-xs font-bold flex items-center gap-1.5 shadow-sm mb-2 text-white">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                الطقس الآن
              </div>`
);

const newCard = `
        {/* EXPECTED WEATHER FOR THE REST OF THE DAY */}
        {dailyForecasts?.[0] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className={\`relative rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] border overflow-hidden transition-all duration-500 bg-gradient-to-br \${restOfDayThemeStr}\`}
          >
            <WeatherBackgroundEffect weatherCode={dailyForecasts[0].id} isNight={false} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/40 pointer-events-none" />
            
            <div className="relative z-10 flex items-start justify-between pt-6 sm:pt-8 pb-4">
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-xs font-bold flex items-center gap-1.5 shadow-sm mb-2 text-white">
                  بقية اليوم
                </div>
                <div className="text-5xl sm:text-6xl font-black tracking-tight leading-none font-sans drop-shadow-sm">
                  {displayTemp(dailyForecasts[0].tempMax)}°
                </div>
                <h2 className="text-lg sm:text-2xl font-bold font-cairo tracking-wide text-amber-50/95 pt-1 max-w-[200px] sm:max-w-xs leading-snug">
                  {dailyForecasts[0].condition}
                </h2>
                <div className="pt-2 flex flex-col items-start gap-2">
                  <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-1 flex items-center gap-2.5 text-xs font-bold font-sans">
                    <div className="flex items-center gap-0.5 text-red-300">
                      <span>{displayTemp(dailyForecasts[0].tempMax)}°</span>
                      <ArrowUp className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-white/30 text-[10px]">|</span>
                    <div className="flex items-center gap-0.5 text-sky-300">
                      <span>{displayTemp(dailyForecasts[0].tempMin)}°</span>
                      <ArrowDown className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>
              <Interactive3DWeatherIllustration 
                weatherCode={dailyForecasts[0].id} 
                isNight={false} 
              />
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-1.5 sm:gap-2.5 mt-2 pt-3 border-t border-white/15">
              <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
                <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
                <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">سرعة الرياح</span>
                <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{dailyForecasts[0].wind} م/ث</span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 hover:bg-black/30 transition-colors">
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold font-cairo">الرطوبة</span>
                <span className="text-xs sm:text-sm font-extrabold font-sans tracking-tight">{dailyForecasts[0].humidity}%</span>
              </div>
            </div>
          </motion.div>
        )}
`;

code = code.replace(originalCard, updatedCard + newCard);

fs.writeFileSync('src/pages/WeatherDetail.tsx', code);
console.log("Weather patch applied successfully!");
