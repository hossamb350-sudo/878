const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(/focus-visible:ring-blue-500/g, 'focus-visible:ring-taiz-sky');

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
