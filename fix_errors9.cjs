const fs = require('fs');
let code = fs.readFileSync('src/pages/watch/[slug].tsx', 'utf8');
if (!code.includes('routes.watchItem')) { // actually it does, let's see if routes is imported
}
if (!code.includes('import { extractIdFromSlug, generateSlug, routes }')) {
  code = code.replace(/import \{ extractIdFromSlug, generateSlug \}/, 'import { extractIdFromSlug, generateSlug, routes }');
  fs.writeFileSync('src/pages/watch/[slug].tsx', code);
}

let codeE = fs.readFileSync('src/pages/events/index.tsx', 'utf8');
if (!codeE.includes('import { routes')) {
  codeE = codeE.replace(/import \{ useNavigate \}/, 'import { useNavigate } from "react-router-dom";\nimport { routes, generateSlug } from "../../utils/routes";');
}
codeE = codeE.replace(/\`/events\/activity\/\$\{act\.id\}\`/g, 'routes.activity(generateSlug(act.title || "", act.id))');
fs.writeFileSync('src/pages/events/index.tsx', codeE);

