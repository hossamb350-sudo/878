const fs = require('fs');

// ----- 1. HeaderWidgets.tsx -----
let hwContent = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

hwContent = hwContent.replace(
  'const [weatherData, setWeatherData] = useState<{ temp: number; temp_max?: number; temp_min?: number; condition: string; id: number } | null>(null);',
  'const [weatherData, setWeatherData] = useState<{ temp: number; temp_max?: number; temp_min?: number; condition: string; id: number; icon?: string } | null>(null);'
);

const oldSetWeatherData = `          setWeatherData({
            temp: Math.round(data.main.temp),
            temp_max: Math.round(data.main.temp_max),
            temp_min: Math.round(data.main.temp_min),
            condition: data.weather[0].description,
            id: data.weather[0].id
          });`;
const newSetWeatherData = `          setWeatherData({
            temp: Math.round(data.main.temp),
            temp_max: Math.round(data.main.temp_max),
            temp_min: Math.round(data.main.temp_min),
            condition: data.weather[0].description,
            id: data.weather[0].id,
            icon: data.weather[0].icon
          });`;
hwContent = hwContent.replace(oldSetWeatherData, newSetWeatherData);

const oldWeatherFallback = `  const weather = weatherData ? {
    temp: weatherData.temp,
    temp_max: weatherData.temp_max,
    temp_min: weatherData.temp_min,
    condition: weatherData.condition,
  } : {
    temp: 27,
    temp_max: 29,
    temp_min: 24,
    condition: "غائم جزئي",
  };`;
const newWeatherFallback = `  const weather = weatherData ? {
    temp: weatherData.temp,
    temp_max: weatherData.temp_max,
    temp_min: weatherData.temp_min,
    condition: weatherData.condition,
    icon: weatherData.icon,
  } : {
    temp: 27,
    temp_max: 29,
    temp_min: 24,
    condition: "غائم جزئي",
    icon: "02d"
  };`;
hwContent = hwContent.replace(oldWeatherFallback, newWeatherFallback);

// Remove the lucide WeatherIcon and its usage
const oldWeatherIconRegex = /const WeatherIcon = \(\{ code, isNight, temp = 25, hours \}: \{ code\?: number, isNight\?: boolean, temp\?: number, hours\?: number \}\) => \{[\s\S]*?\};\n/g;
hwContent = hwContent.replace(oldWeatherIconRegex, '');

// Replace its usage with the actual img tag
hwContent = hwContent.replace('<WeatherIcon code={weatherData?.id} isNight={isNight} temp={weatherData?.temp} hours={time.getHours()} />', '<img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.condition} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-md" />');

fs.writeFileSync('src/components/HeaderWidgets.tsx', hwContent);
console.log('Updated HeaderWidgets.tsx');


// ----- 2. WeatherDetail.tsx -----
let wdContent = fs.readFileSync('src/pages/WeatherDetail.tsx', 'utf8');

const getWeatherIconRegex = /\/\/ Map OpenWeather API condition codes to Lucide icons\nconst getWeatherIcon = \([\s\S]*?\} else \{\n    return <Cloud \.\.\.props \/>;\n  \}\n\};\n/g;
wdContent = wdContent.replace(getWeatherIconRegex, '');

// Replace main icon
wdContent = wdContent.replace(
  '{weatherData.weather[0] ? getWeatherIcon(weatherData.weather[0].id, "w-full h-full text-white/90") : <CloudSun className="w-full h-full text-white/90" />}',
  '{weatherData.weather[0] ? <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`} alt={weatherData.weather[0].description} className="w-full h-full object-contain filter drop-shadow-lg" /> : <CloudSun className="w-full h-full text-white/90" />}'
);

// Replace forecast icon
wdContent = wdContent.replace(
  '{forecast.weather[0] ? getWeatherIcon(forecast.weather[0].id, "w-6 h-6 text-amber-500") : <Cloud className="w-5 h-5 text-slate-400" />}',
  '{forecast.weather[0] ? <img src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`} alt={forecast.weather[0].description} className="w-8 h-8 object-contain" /> : <Cloud className="w-5 h-5 text-slate-400" />}'
);


fs.writeFileSync('src/pages/WeatherDetail.tsx', wdContent);
console.log('Updated WeatherDetail.tsx');

