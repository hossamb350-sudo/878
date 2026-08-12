const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(/focus-visible:ring-red-600/g, 'focus-visible:ring-taiz-sky');
content = content.replace(/border-red-600\/10/g, 'border-taiz-sky/10');
content = content.replace(/border-red-600/g, 'border-taiz-sky');

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
