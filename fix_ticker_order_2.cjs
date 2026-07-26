const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  "const sortedDesc = [...scrollingItems].sort((a, b) => b.createdAt - a.createdAt);\n    baseSequence = [...sortedDesc, infoItem];",
  "const sortedAsc = [...scrollingItems].sort((a, b) => a.createdAt - b.createdAt);\n    baseSequence = [infoItem, ...sortedAsc];"
);

fs.writeFileSync('src/components/Layout.tsx', code);
console.log("Ticker order fixed again");
