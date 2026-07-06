const fs = require('fs');
let code = fs.readFileSync('src/pages/Quran.tsx', 'utf8');

code = code.replace(
  /\(a, b\) => \(a\.order \|\| 0\) - \(b\.order \|\| 0\)/g,
  '(a, b) => ((a as any).order || 0) - ((b as any).order || 0)'
);

fs.writeFileSync('src/pages/Quran.tsx', code);
