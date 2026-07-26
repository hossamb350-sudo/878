const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Find the quick stats grid and remove it.
const statsStart = code.indexOf('{/* Quick Stats Grid */}');
const statsEnd = code.indexOf('{/* Master Tabs */}');

if (statsStart > -1 && statsEnd > -1) {
  const piece = code.substring(statsStart, statsEnd);
  code = code.replace(piece, '');
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log('Removed Quick Stats Grid');
} else {
  console.log('Could not find stats grid');
}
