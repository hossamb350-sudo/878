const fs = require('fs');
let code = fs.readFileSync('src/config/apiConfig.ts', 'utf8');
code = code.replace(
/export function getShareableUrl\([\s\S]*?return `\$\{siteBase\}\$\{cleanPath\}`;/m,
`export function getShareableUrl(currentPath?: string): string {
  const path = currentPath || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "");
  const cleanPath = path.startsWith('/') ? path : \`/\${path}\`;
  return \`\${BASE_URL}\${cleanPath}\`;`
);
fs.writeFileSync('src/config/apiConfig.ts', code);
