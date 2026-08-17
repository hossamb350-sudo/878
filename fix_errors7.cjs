const fs = require('fs');

function fixFiles(files, fixers) {
  files.forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    fixers.forEach(fix => {
      code = code.replace(fix.from, fix.to);
    });
    fs.writeFileSync(f, code);
  });
}

fixFiles(['src/pages/leader/index.tsx'], [
  {from: /to=\{\`\/leader\/\$\{item\.id\}\`\}/g, to: 'to={routes.leaderItem(generateSlug(item.title || "", item.id))}'}
]);
let codeL = fs.readFileSync('src/pages/leader/index.tsx', 'utf8');
if (!codeL.includes('import { routes')) {
  codeL = codeL.replace(/import \{ Link /g, 'import { routes, generateSlug } from "../../utils/routes";\nimport { Link ');
  fs.writeFileSync('src/pages/leader/index.tsx', codeL);
}

fixFiles(['src/pages/watch/index.tsx'], [
  {from: /`\/leader\/\$\{vid\.id\}`/g, to: 'routes.leaderItem(generateSlug(vid.title || "", vid.id))'},
  {from: /`\/watch\/\$\{vid\.id\}`/g, to: 'routes.watchItem(generateSlug(vid.title || "", vid.id))'}
]);
let codeW = fs.readFileSync('src/pages/watch/index.tsx', 'utf8');
if (!codeW.includes('import { routes')) {
  codeW = codeW.replace(/import \{ Link /g, 'import { routes, generateSlug } from "../../utils/routes";\nimport { Link ');
  fs.writeFileSync('src/pages/watch/index.tsx', codeW);
}

fixFiles(['src/pages/home/index.tsx'], [
  {from: /`\/leader\/\$\{video\.id\}`/g, to: 'routes.leaderItem(generateSlug(video.title || "", video.id))'}
]);
