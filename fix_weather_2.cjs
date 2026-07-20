const fs = require('fs');
let hwContent = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

// The remaining code is:
// const WeatherIcon = ({ code, isNight, temp = 25, hours }: { code?: number, isNight?: boolean, temp?: number, hours?: number }) => {
// ...
// };
// Let's remove from 'const WeatherIcon =' down to '};\n\nconst renderMosqueDomeIcon'

const startIndex = hwContent.indexOf('const WeatherIcon =');
if (startIndex !== -1) {
    const endIndex = hwContent.indexOf('const renderMosqueDomeIcon');
    if (endIndex !== -1) {
        const before = hwContent.substring(0, startIndex);
        const after = hwContent.substring(endIndex);
        hwContent = before + after;
        fs.writeFileSync('src/components/HeaderWidgets.tsx', hwContent);
        console.log("Removed leftover WeatherIcon code");
    }
}
