const fs = require('fs');

let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /function UrgentNewsSection[\s\S]*?\n\} \/\/ End of UrgentNewsSection/m;
const match = code.match(regex);
if (match) {
  console.log("Found");
} else {
  const funcRegex = /function UrgentNewsSection[\s\S]*?^}$/m;
  const match2 = code.match(funcRegex);
  if(match2) {
    console.log("Found without explicit end comment");
    // Just find the lines where UrgentNewsSection is defined.
  } else {
    console.log("Not found");
  }
}
