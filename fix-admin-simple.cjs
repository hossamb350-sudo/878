const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const start = code.indexOf('function AdminUrgentNews() {');
const end = code.indexOf('\n// Simple Admin Components');

if (start > -1 && end > -1) {
  const piece = code.substring(start, end);
  const componentCode = fs.readFileSync('componentCode.txt', 'utf8');
  code = code.replace(piece, componentCode);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log("Successfully replaced");
} else {
  console.log("Failed to find start and end");
}
