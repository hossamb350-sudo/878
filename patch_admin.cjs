const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

code = code.replace(
  'label: "البث الإذاعي الإف إم",',
  'label: "البث الإذاعي لإذاعة تعز",'
);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Admin patch applied successfully!");
