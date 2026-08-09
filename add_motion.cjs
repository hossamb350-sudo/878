const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// For the news map:
content = content.replace(
  /<div key=\{item.id\} className="relative">/g,
  '<motion.div key={item.id} className="relative" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}>'
);
content = content.replace(
  /<\/Link>\s*<\/div>\s*\)\)/g,
  '</Link>\n                  </motion.div>\n                ))'
);

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
console.log('done');
