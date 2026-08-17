const fs = require('fs');
const path = require('path');

function processFile(filePath, levelIncrease) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Replace imports like from "../components/..." or "../firebase"
  // If levelIncrease is 1, "../" becomes "../../"
  // If levelIncrease is 2, "../" becomes "../../../"
  
  const replacer = (match, p1) => {
    let prefix = '../';
    for (let i = 0; i < levelIncrease; i++) prefix += '../';
    return `from "${prefix}${p1}"`;
  };

  newContent = newContent.replace(/from\s+"\.\.\/([^"]+)"/g, replacer);
  newContent = newContent.replace(/from\s+'\.\.\/([^']+)'/g, replacer);
  
  fs.writeFileSync(filePath, newContent);
}

// Level 1 (moved from src/pages to src/pages/folder/)
const level1Files = [
  'home/index.tsx',
  'news/[slug].tsx',
  'articles/index.tsx',
  'articles/[slug].tsx',
  'watch/index.tsx',
  'watch/[slug].tsx',
  'leader/index.tsx',
  'leader/[slug].tsx',
  'events/index.tsx',
  'search/index.tsx',
  'quran/index.tsx',
  'weather/index.tsx',
  'prayer-times/index.tsx',
  'calendar/index.tsx',
  'topic/[slug].tsx',
  'admin/index.tsx'
];

level1Files.forEach(file => {
  const fullPath = path.join(__dirname, 'src/pages', file);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath, 1);
  }
});

// Level 2 (moved from src/pages to src/pages/folder/subfolder/)
const level2Files = [
  'events/activity/[slug].tsx'
];

level2Files.forEach(file => {
  const fullPath = path.join(__dirname, 'src/pages', file);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath, 2);
  }
});
