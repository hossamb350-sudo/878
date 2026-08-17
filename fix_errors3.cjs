const fs = require('fs');

let leaderCode = fs.readFileSync('src/pages/leader/[slug].tsx', 'utf8');
leaderCode = leaderCode.replace(/leader/g, 'content');
fs.writeFileSync('src/pages/leader/[slug].tsx', leaderCode);

// Wait, the previous sed command changed `const [content, setContent]` to `const [content, setContent]` but maybe we missed something. Let's just fix the imports if needed.

let topicCode = fs.readFileSync('src/pages/topic/[slug].tsx', 'utf8');
if (!topicCode.includes('import { extractIdFromSlug, generateSlug, routes }')) {
  topicCode = topicCode.replace(/import \{ extractIdFromSlug, generateSlug \}/, 'import { extractIdFromSlug, generateSlug, routes }');
  fs.writeFileSync('src/pages/topic/[slug].tsx', topicCode);
}

