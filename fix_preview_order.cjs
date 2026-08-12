const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

code = code.replace(
  "{[...drafts].filter(d => d.text.trim() && d.displayType === 'scrolling').map((draft, i) => (",
  "{[...drafts].filter(d => d.text.trim() && d.displayType === 'scrolling').reverse().map((draft, i) => ("
);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Preview order fixed");
