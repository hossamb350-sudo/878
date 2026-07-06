const fs = require('fs');

let content = fs.readFileSync('src/pages/Quran.tsx', 'utf8');
content = content.replace(/progressList={lessonProgress}/g, 'lessonProgress={lessonProgress}');
fs.writeFileSync('src/pages/Quran.tsx', content);

