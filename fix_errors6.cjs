const fs = require('fs');

let code = fs.readFileSync('src/components/AdminNewsWizard.tsx', 'utf8');
if (!code.includes('import { routes, generateSlug }')) {
  code = code.replace(/import React/, 'import { routes, generateSlug } from "../utils/routes";\nimport React');
}
code = code.replace(/href=\{`\/news\/\$\{item\.id\}`\}/g, 'href={routes.news(generateSlug(item.title || "", item.id))}');
fs.writeFileSync('src/components/AdminNewsWizard.tsx', code);
