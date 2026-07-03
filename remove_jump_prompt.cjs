const fs = require('fs');

let content = fs.readFileSync('src/components/QuranReader.tsx', 'utf8');

content = content.replace(/const \[jumpPrompt, setJumpPrompt\] = useState<number \| null>\(null\);/g, '');
content = content.replace(/setJumpPrompt\(null\);/g, '');
content = content.replace(/const handleApplyJumpRestore = \(\) => \{[\s\S]*?\};\n/g, '');
content = content.replace(/\{\/\* Jump Restore Prompt \*\/\}[\s\S]*?<\/div>\n      \)\}/g, '');

fs.writeFileSync('src/components/QuranReader.tsx', content);
console.log('Done removing jump prompt');
