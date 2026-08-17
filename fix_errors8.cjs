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

fixFiles(['src/pages/topic/[slug].tsx'], [
  {from: /to=\{\`\/watch\/\$\{vid\.id\}\`\}/g, to: 'to={routes.watchItem(generateSlug(vid.title || "", vid.id))}'}
]);
fixFiles(['src/pages/watch/[slug].tsx'], [
  {from: /to=\{\`\/watch\/\$\{vid\.id\}\`\}/g, to: 'to={routes.watchItem(generateSlug(vid.title || "", vid.id))}'}
]);
