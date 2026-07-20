const fs = require('fs');
let content = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

const goldSeparatorCode = `
// Premium Gold Separator
const GoldSeparator = () => (
  <div className="w-[1px] my-3 sm:my-4 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent self-stretch shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
);

export const HeaderWidgets`;

content = content.replace('export const HeaderWidgets', goldSeparatorCode);

fs.writeFileSync('src/components/HeaderWidgets.tsx', content);
console.log("Successfully added GoldSeparator back.");
