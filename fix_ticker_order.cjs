const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// The line is:
// const infoItem = { id: 'info-static-text', text: infoText, type: 'scrolling', createdAt: 0 };
// const reversedNews = [...scrollingItems].reverse();
// baseSequence = [infoItem, ...reversedNews];

code = code.replace(
  "const reversedNews = [...scrollingItems].reverse();\n    baseSequence = [infoItem, ...reversedNews];",
  "const sortedDesc = [...scrollingItems].sort((a, b) => b.createdAt - a.createdAt);\n    baseSequence = [...sortedDesc, infoItem];"
);

fs.writeFileSync('src/components/Layout.tsx', code);
console.log("Ticker order fixed");
