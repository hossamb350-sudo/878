const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const leftover = `  if (cat.includes("تعز") || cat.includes("أخبار")) {
    return "bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)]";
  }
  if (cat.includes("ثقافة")) {`;

content = content.replace(leftover, '');

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
