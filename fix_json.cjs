const fs = require('fs');
const content = fs.readFileSync('public/quranData.json', 'utf8');

// The file ends with an unclosed string. 
// We want to find the last valid lesson object.
// A lesson object likely ends with "}"

const lastIndex = content.lastIndexOf('},');
if (lastIndex !== -1) {
  // It might be followed by more lessons if I'm not careful.
  // Actually, I just need to find the last complete lesson object.
  // Assuming lessons are an array of objects.
  
  // Let's try to just truncate and add ]}
  const truncated = content.substring(0, lastIndex + 1) + ']}';
  
  try {
    JSON.parse(truncated);
    fs.writeFileSync('public/quranData.json', truncated);
    console.log('Fixed JSON');
  } catch(e) {
    console.error('Failed to fix:', e.message);
  }
}
