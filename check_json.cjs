const fs = require('fs');
const content = fs.readFileSync('public/quranData.json', 'utf8');

try {
  JSON.parse(content);
  console.log('JSON is valid');
} catch (e) {
  console.error('Error parsing JSON:', e.message);
  const position = parseInt(e.message.match(/position (\d+)/)[1]);
  console.log('Context around error:');
  console.log(content.substring(position - 50, position + 50));
}
