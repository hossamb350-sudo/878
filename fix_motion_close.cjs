const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  /                    <\/Link>\n                  \)}\n                <\/div>\n              \)\)}\n              \{\/\* End of news items list \*\/\}/,
  '                    </Link>\n                  )}\n                </motion.div>\n              ))}\n              {/* End of news items list */}'
);

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
console.log('done');
