const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /\{\/\* Insert Video Slider Container \*\/\}\s*\{index === 1 && videos\.length > 0 && \([\s\S]*?\}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*\{\/\* End of news items list \*\/\}/;
content = content.replace(regex, '</div>\n              ))}\n              {/* End of news items list */}');

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
