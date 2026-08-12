const fs = require('fs');

let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /function AdminUrgentNews\(\) \{[\s\S]*?\n\} \/\/ Simple Admin Components/m;
const match = code.match(regex);
if (match) {
  console.log("Matched AdminUrgentNews");
} else {
  const funcRegex = /function AdminUrgentNews\(\) \{[\s\S]*?^\}(?=\n\n\/\/ Simple Admin Components|\n\nfunction AdminNews)/m;
  const match2 = code.match(funcRegex);
  if(match2) {
    fs.writeFileSync('admin_urgent_news.txt', match2[0]);
    console.log("Matched with secondary regex");
  } else {
    console.log("Not found");
  }
}
