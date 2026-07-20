const fs = require('fs');
let content = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

const targetContent = `const WeatherIcon = ({ code, isNight, temp = 25, hours }: { code?: number, isNight?: boolean, temp?: number, hours?: number }) => {
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
};`;

const newWeatherCode = `const WeatherIcon = ({ code, isNight }: { code?: number, isNight?: boolean }) => {
  const getFluentEmojiUrl = (path: string, file: string) => 
    \`https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/\${path}/3D/\${file}\`;

  let iconUrl = getFluentEmojiUrl('Sun', 'sun_3d.png'); // Default

  // Atmosphere / Fog / Wind
  if (code && code >= 700 && code < 800) {
    if (code === 741 || code === 701 || code === 721) {
      iconUrl = getFluentEmojiUrl('Fog', 'fog_3d.png');
    } else if (code === 761 || code === 751 || code === 731 || code === 762) {
      iconUrl = getFluentEmojiUrl('Tornado', 'tornado_3d.png');
    } else {
      iconUrl = getFluentEmojiUrl('Fog', 'fog_3d.png');
    }
  }
  // Snow
  else if (code && code >= 600 && code < 700) {
    iconUrl = getFluentEmojiUrl('Snowflake', 'snowflake_3d.png');
  }
  // Thunderstorm
  else if (code && code >= 200 && code < 300) {
    iconUrl = getFluentEmojiUrl('Cloud%20with%20lightning%20and%20rain', 'cloud_with_lightning_and_rain_3d.png');
  }
  // Rain / Drizzle
  else if (code && ((code >= 300 && code < 400) || (code >= 500 && code < 600))) {
    iconUrl = getFluentEmojiUrl('Cloud%20with%20rain', 'cloud_with_rain_3d.png');
  }
  // Clear Sky
  else if (code === 800) {
    if (isNight) {
      iconUrl = getFluentEmojiUrl('Crescent%20moon', 'crescent_moon_3d.png');
    } else {
      iconUrl = getFluentEmojiUrl('Sun', 'sun_3d.png');
    }
  }
  // Cloudy
  else if (code === 801 || code === 802) {
    if (isNight) {
      iconUrl = getFluentEmojiUrl('Cloud', 'cloud_3d.png');
    } else {
      iconUrl = getFluentEmojiUrl('Sun%20behind%20cloud', 'sun_behind_cloud_3d.png');
    }
  }
  else if (code === 803 || code === 804) {
    iconUrl = getFluentEmojiUrl('Cloud', 'cloud_3d.png');
  }

  return (
    <img 
      src={iconUrl} 
      alt="Weather Icon" 
      className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] transition-transform hover:scale-110"
      onError={(e) => {
        // Fallback in case of broken image link
        (e.target as HTMLImageElement).src = getFluentEmojiUrl('Sun', 'sun_3d.png');
      }}
    />
  );
};`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, newWeatherCode);
  fs.writeFileSync('src/components/HeaderWidgets.tsx', content);
  console.log("Successfully replaced WeatherIcon with 3D fluent icons.");
} else {
  console.log("Target content not found. Outputting surrounding content for debugging:");
  console.log(content.substring(content.indexOf('const WeatherIcon =') - 200, content.indexOf('const WeatherIcon =') + 600));
}
