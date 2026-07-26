const fs = require('fs');

let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');

console.log(layoutCode.indexOf('function UrgentNewsBanner'));

