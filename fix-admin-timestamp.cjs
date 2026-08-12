const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
code = code.replace('createdAt: now - i,', 'createdAt: now + i,');
fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Updated timestamp to now + i");
