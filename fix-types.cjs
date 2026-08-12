const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  '  isActive?: boolean;\n}',
  '  isActive?: boolean;\n  staticExpiresAt?: number;\n  scrollingExpiresAt?: number;\n}'
);

fs.writeFileSync('src/types.ts', content);
