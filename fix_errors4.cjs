const fs = require('fs');

function replaceAll(file, replacements) {
  let code = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    code = code.replace(r.from, r.to);
  });
  fs.writeFileSync(file, code);
}

replaceAll('src/pages/articles/[slug].tsx', [
  {from: /description: "" \|\| article\.description \|\| ""/g, to: 'description: article.description || ""'},
  {from: /description: ""/g, to: 'description: article.description || ""'} // Try this in case it's just ""
]);
// Let's just fix the hardcoded falsy expression in articles:
let codeA = fs.readFileSync('src/pages/articles/[slug].tsx', 'utf8');
codeA = codeA.replace(/description: [^,]+,/g, 'description: article.description || "",');
fs.writeFileSync('src/pages/articles/[slug].tsx', codeA);

let codeL = fs.readFileSync('src/pages/leader/[slug].tsx', 'utf8');
codeL = codeL.replace(/description: [^,]+,/g, 'description: content.description || "",');
codeL = codeL.replace(/imageUrl: [^,]+,/g, 'imageUrl: content.thumbnailUrl || "",');
fs.writeFileSync('src/pages/leader/[slug].tsx', codeL);

let codeT = fs.readFileSync('src/pages/topic/[slug].tsx', 'utf8');
codeT = codeT.replace(/description: [^,]+,/g, 'description: "",');
fs.writeFileSync('src/pages/topic/[slug].tsx', codeT);


let codeS = fs.readFileSync('src/pages/search/index.tsx', 'utf8');
if (!codeS.includes('routes.news')) {
  if (!codeS.includes('import { routes, generateSlug }')) {
    codeS = codeS.replace(/import \{ Link[^}]*\} from "react-router-dom";/, 'import { Link, useNavigate } from "react-router-dom";\nimport { routes, generateSlug } from "../../utils/routes";');
  }
}
fs.writeFileSync('src/pages/search/index.tsx', codeS);

