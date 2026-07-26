const fs = require('fs');

let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /function AdminUrgentNews\(\) \{[\s\S]*?\n\}(?=\n\n\/\/ Simple Admin Components|\n\nfunction AdminNews)/m;
const match = code.match(regex);
if (match) {
  console.log("Matched");
} else {
  // Just find where it starts and ends
  const start = code.indexOf('function AdminUrgentNews() {');
  const end = code.indexOf('\n// Simple Admin Components');
  if (start > -1 && end > -1) {
    console.log("Found start and end");
    const piece = code.substring(start, end);
    const fs = require('fs');
    let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
    content = content.replace(piece, require('fs').readFileSync('componentCode.txt', 'utf8')); // Wait I haven't written it yet
  } else {
    console.log("Not found index");
  }
}
