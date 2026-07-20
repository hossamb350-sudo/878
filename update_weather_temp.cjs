const fs = require('fs');
let content = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

const targetContent = `<WeatherIcon code={weatherData?.id} isNight={isNight} temp={weatherData?.temp} hours={time.getHours()} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-[#0B1C3E] font-cairo leading-none">
              {weather.temp}°
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 truncate max-w-full">
              {weather.condition}
            </span>`;

const newContent = `<WeatherIcon code={weatherData?.id} isNight={isNight} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-red-600 font-cairo leading-none">
              {weather.temp}°
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 truncate max-w-full">
              {weather.condition}
            </span>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, newContent);
  fs.writeFileSync('src/components/HeaderWidgets.tsx', content);
  console.log("Successfully updated temperature color and WeatherIcon props.");
} else {
  console.log("Target content not found. Outputting surrounding content for debugging:");
  console.log(content.substring(content.indexOf('<WeatherIcon') - 200, content.indexOf('<WeatherIcon') + 600));
}
