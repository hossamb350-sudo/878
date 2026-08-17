const fs = require('fs');

function patchFile(file, regexList) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('import { routes')) {
    code = code.replace(/import \{ Link[^}]*\} from "react-router-dom";/, '$&\nimport { routes, generateSlug } from "../../utils/routes";');
  }
  regexList.forEach(r => {
    code = code.replace(r.from, r.to);
  });
  fs.writeFileSync(file, code);
}

patchFile('src/pages/articles/index.tsx', [
  {from: /to=\{\`\/articles\/\$\{currentArticle\.id\}\`\}/g, to: 'to={routes.article(generateSlug(currentArticle.title || "", currentArticle.id))}'},
  {from: /to=\{\`\/articles\/\$\{article\.id\}\`\}/g, to: 'to={routes.article(generateSlug(article.title || "", article.id))}'}
]);

patchFile('src/pages/articles/[slug].tsx', [
  {from: /to=\{\`\/articles\/\$\{a\.id\}\`\}/g, to: 'to={routes.article(generateSlug(a.title || "", a.id))}'}
]);

patchFile('src/pages/topic/[slug].tsx', [
  {from: /to=\{\`\/articles\/\$\{art\.id\}\`\}/g, to: 'to={routes.article(generateSlug(art.title || "", art.id))}'}
]);
