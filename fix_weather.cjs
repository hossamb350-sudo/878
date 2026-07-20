const fs = require('fs');
let content = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

// Restore WeatherIcon to lucide-react icons
const oldWeatherIconRegex = /const WeatherIcon = \(\{ code, isNight \}: \{ code\?: number, isNight\?: boolean \}\) => \{[\s\S]*?\};\n/g;

const lucideWeatherIconCode = `const WeatherIcon = ({ code, isNight, temp = 25, hours }: { code?: number, isNight?: boolean, temp?: number, hours?: number }) => {
  const hr = hours !== undefined ? hours : new Date().getHours();
  
  const iconProps = {
    className: "w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 stroke-[1.5] drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)] transition-transform hover:scale-105",
  };

  // 1. Check for Sunrise/Sunset temporal transitions first if sky is relatively clear
  const isClearOrPartlyCloudy = !code || code === 800 || code === 801 || code === 802;
  if (isClearOrPartlyCloudy) {
    if (hr === 5 || hr === 6) return <Sunrise {...iconProps} className={\`\${iconProps.className} text-amber-400\`} />;
    if (hr === 17 || hr === 18) return <Sunset {...iconProps} className={\`\${iconProps.className} text-rose-500\`} />;
  }

  // 2. Check for Windy / Dust conditions (Atmosphere group 7xx)
  if (code && code >= 700 && code < 800) {
    if (code === 741 || code === 701 || code === 721) {
      return <CloudFog {...iconProps} className={\`\${iconProps.className} text-slate-400\`} />;
    }
    if (code === 761 || code === 751 || code === 731 || code === 762) {
      return <Tornado {...iconProps} className={\`\${iconProps.className} text-amber-600/80\`} />;
    }
    return <Wind {...iconProps} className={\`\${iconProps.className} text-slate-400\`} />;
  }

  // 3. Snow / Cold conditions (6xx)
  if (code && code >= 600 && code < 700) {
    return <Snowflake {...iconProps} className={\`\${iconProps.className} text-sky-400\`} />;
  }
  if (temp <= 10 && code && code >= 801) {
    return <Snowflake {...iconProps} className={\`\${iconProps.className} text-sky-400\`} />;
  }

  // 4. Thunderstorm conditions (2xx)
  if (code && code >= 200 && code < 300) {
    return <CloudLightning {...iconProps} className={\`\${iconProps.className} text-indigo-500\`} />;
  }

  // 5. Rain / Drizzle conditions (3xx, 5xx)
  if (code && ((code >= 300 && code < 400) || (code >= 500 && code < 600))) {
    if (code === 511) return <Snowflake {...iconProps} className={\`\${iconProps.className} text-sky-400\`} />;
    
    const isHeavy = code === 502 || code === 503 || code === 504 || code === 522 || code === 531;
    if (isHeavy) return <CloudRain {...iconProps} className={\`\${iconProps.className} text-blue-600\`} />;
    return <CloudDrizzle {...iconProps} className={\`\${iconProps.className} text-blue-400\`} />;
  }

  // 6. Clear Sky (800)
  if (code === 800) {
    if (isNight) return <Moon {...iconProps} className={\`\${iconProps.className} text-slate-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]\`} />;
    if (temp >= 32) return <ThermometerSun {...iconProps} className={\`\${iconProps.className} text-rose-500\`} />;
    return <Sun {...iconProps} className={\`\${iconProps.className} text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]\`} />;
  }

  // 7. Cloudy conditions (801 - 804)
  if (code === 801 || code === 802) {
    return isNight ? <CloudMoon {...iconProps} className={\`\${iconProps.className} text-slate-300\`} /> : <CloudSun {...iconProps} className={\`\${iconProps.className} text-amber-500\`} />;
  }
  if (code === 803 || code === 804) {
    return <Cloud {...iconProps} className={\`\${iconProps.className} text-slate-500\`} />;
  }

  return isNight ? <CloudMoon {...iconProps} className={\`\${iconProps.className} text-slate-300\`} /> : <CloudSun {...iconProps} className={\`\${iconProps.className} text-amber-500\`} />;
};
`;

content = content.replace(oldWeatherIconRegex, lucideWeatherIconCode);

// Restore <WeatherIcon /> usage to pass temp and hours
content = content.replace('<WeatherIcon code={weatherData?.id} isNight={isNight} />', '<WeatherIcon code={weatherData?.id} isNight={isNight} temp={weatherData?.temp} hours={time.getHours()} />');

// Remove {weather.temp}° and replace it with min/max as requested
const targetRenderContent = `<span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-red-600 font-cairo leading-none">
              {weather.temp}°
            </span>
            <span className="text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-slate-400 font-bold font-cairo leading-none mt-1">
              العظمى {weather.temp_max}° | الصغرى {weather.temp_min}°
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 truncate max-w-full">
              {weather.condition}
            </span>`;

// Use just the min/max numbers colored in red as requested
const newRenderContent = `<span className="text-[11px] sm:text-[14px] md:text-[18px] lg:text-[20px] font-black text-red-600 font-cairo leading-none flex items-center justify-center gap-1">
              <span>{weather.temp_min}°</span>
              <span className="text-slate-400 font-normal">/</span>
              <span>{weather.temp_max}°</span>
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-slate-500 font-bold font-cairo leading-none mt-1 truncate max-w-full">
              {weather.condition}
            </span>`;

content = content.replace(targetRenderContent, newRenderContent);

fs.writeFileSync('src/components/HeaderWidgets.tsx', content);
console.log('Done replacing.');
