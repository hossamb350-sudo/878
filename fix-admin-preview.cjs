const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// The line is: {drafts.filter(d => d.text.trim()).map((draft, i) => (
code = code.replace(
  "{drafts.filter(d => d.text.trim()).map((draft, i) => (",
  "{[...drafts].filter(d => d.text.trim()).reverse().map((draft, i) => ("
);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Updated live preview to match ticker order");
