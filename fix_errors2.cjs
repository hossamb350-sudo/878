const fs = require('fs');

function replaceAll(file, replacements) {
  let code = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    code = code.replace(r.from, r.to);
  });
  fs.writeFileSync(file, code);
}

replaceAll('src/pages/articles/[slug].tsx', [
  {from: /title: article\.title,\n\s*description: ""/g, to: 'title: article.title,\n        description: ""'},
  {from: /to=\{routes\.article\(/g, to: 'to={routes.article('} // already fixed probably
]);

replaceAll('src/pages/search/index.tsx', [
  {from: /routes\.news\(generateSlug\(item\.title \|\| "", item\.id\)\)/g, to: 'routes.news(generateSlug(item.title || "", item.id))'}
]);

let codeS = fs.readFileSync('src/pages/search/index.tsx', 'utf8');
if (!codeS.includes('import { routes, generateSlug }')) {
  codeS = codeS.replace(/import \{ Link[^}]*\} from "react-router-dom";/, 'import { Link, useNavigate } from "react-router-dom";\nimport { routes, generateSlug } from "../../utils/routes";');
  fs.writeFileSync('src/pages/search/index.tsx', codeS);
}

let codeA = fs.readFileSync('src/pages/articles/[slug].tsx', 'utf8');
if (!codeA.includes('routes.article')) {
  // wait we need to check if routes is imported
}
if (codeA.includes('error TS2304: Cannot find name \'routes\'.')) {
   // Wait, TS error was in src/pages/articles/[slug].tsx(542,40): error TS2304: Cannot find name 'routes'.
}
codeA = codeA.replace(/routes\.article/g, 'routes.article');
if (!codeA.includes('import { extractIdFromSlug, generateSlug, routes }')) {
  codeA = codeA.replace('import { extractIdFromSlug, generateSlug }', 'import { extractIdFromSlug, generateSlug, routes }');
}
fs.writeFileSync('src/pages/articles/[slug].tsx', codeA);

let codeN = fs.readFileSync('src/pages/news/[slug].tsx', 'utf8');
if (!codeN.includes('import { extractIdFromSlug, generateSlug, routes }')) {
  codeN = codeN.replace('import { extractIdFromSlug, generateSlug }', 'import { extractIdFromSlug, generateSlug, routes }');
}
fs.writeFileSync('src/pages/news/[slug].tsx', codeN);

let codeT = fs.readFileSync('src/pages/topic/[slug].tsx', 'utf8');
codeT = codeT.replace(/description: ""/g, 'description: ""'); // Fix falsy expression by just providing ""
fs.writeFileSync('src/pages/topic/[slug].tsx', codeT);

