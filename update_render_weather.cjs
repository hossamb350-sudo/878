const fs = require('fs');
let content = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

const startIndex = content.indexOf('// Dynamic 3D weather icons based on OpenWeather conditions');
if (startIndex === -1) {
  console.log("Could not find renderWeather3DIcon.");
  process.exit(1);
}
const endIndex = content.indexOf('export const HeaderWidgets');

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

content = before + after;

// Now replace usage of renderWeather3DIcon inside HeaderWidgets
content = content.replace('{renderWeather3DIcon(weatherData?.id, isNight, weatherData?.temp, time.getHours())}', '<WeatherIcon code={weatherData?.id} isNight={isNight} temp={weatherData?.temp} hours={time.getHours()} />');

fs.writeFileSync('src/components/HeaderWidgets.tsx', content);
console.log("Successfully removed renderWeather3DIcon and replaced its usage.");
