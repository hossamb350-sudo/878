const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  "if (scrollingItems.length > 0) {\n    const infoItem = { id: 'info-static-text', text: infoText, type: 'scrolling', createdAt: 0 };\n    const sortedAsc = [...scrollingItems].sort((a, b) => a.createdAt - b.createdAt);\n    baseSequence = [infoItem, ...sortedAsc];\n  }",
  `const infoItem = { id: 'info-static-text', text: infoText, type: 'scrolling', createdAt: 0 };
  const sortedAsc = [...scrollingItems].sort((a, b) => a.createdAt - b.createdAt);
  baseSequence = [infoItem, ...sortedAsc];`
);

fs.writeFileSync('src/components/Layout.tsx', code);
console.log("Ticker logic fixed");
