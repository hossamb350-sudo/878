const fs = require('fs');

function replaceFile(path, replacements) {
  let code = fs.readFileSync(path, 'utf8');
  replacements.forEach(r => {
    code = code.replace(r.from, r.to);
  });
  fs.writeFileSync(path, code);
}

// Articles
replaceFile('src/pages/articles/[slug].tsx', [
  {from: /article\.shortDescription \|\| article\.description/g, to: '""'},
  {from: /article\.imageUrl \|\| article\.thumbnailUrl/g, to: 'article.imageUrl || ""'},
  {from: /to=\{routes\.article/g, to: 'to={routes.article'}
]);
// Let me verify if routes import is missing in articles/[slug].tsx
let codeA = fs.readFileSync('src/pages/articles/[slug].tsx', 'utf8');
if (!codeA.includes('import { routes')) {
  codeA = codeA.replace('import { extractIdFromSlug }', 'import { extractIdFromSlug, generateSlug, routes }');
  fs.writeFileSync('src/pages/articles/[slug].tsx', codeA);
}

// Leader - I used `leader` but the state variable in leader/[slug].tsx might be `item`
// Wait, I should check the state variable in `leader/[slug].tsx`.
let codeL = fs.readFileSync('src/pages/leader/[slug].tsx', 'utf8');
if (codeL.includes('const [item, setItem]')) {
  codeL = codeL.replace(/leader/g, 'item');
  fs.writeFileSync('src/pages/leader/[slug].tsx', codeL);
}

// News
replaceFile('src/pages/news/[slug].tsx', [
  {from: /news\.shortDescription \|\| news\.description/g, to: 'news.shortDescription || ""'},
  {from: /news\.imageUrl \|\| news\.thumbnailUrl/g, to: 'news.imageUrl || ""'}
]);
let codeN = fs.readFileSync('src/pages/news/[slug].tsx', 'utf8');
if (!codeN.includes('routes.news(')) {
  // It's complaining about `routes`. Did I not import `routes`?
  if (!codeN.includes('import { routes')) {
    codeN = codeN.replace('import { extractIdFromSlug, generateSlug }', 'import { extractIdFromSlug, generateSlug, routes }');
    fs.writeFileSync('src/pages/news/[slug].tsx', codeN);
  }
}

// Search
let codeS = fs.readFileSync('src/pages/search/index.tsx', 'utf8');
if (!codeS.includes('import { routes')) {
  codeS = codeS.replace('import { Link, useNavigate', 'import { Link, useNavigate } from "react-router-dom";\nimport { routes, generateSlug');
  fs.writeFileSync('src/pages/search/index.tsx', codeS);
}

// Topic
replaceFile('src/pages/topic/[slug].tsx', [
  {from: /topic\.shortDescription \|\| topic\.description/g, to: '""'},
  {from: /topic\.imageUrl \|\| topic\.thumbnailUrl/g, to: 'topic.imageUrl || ""'}
]);
let codeT = fs.readFileSync('src/pages/topic/[slug].tsx', 'utf8');
if (!codeT.includes('import { routes')) {
  codeT = codeT.replace('import { extractIdFromSlug, generateSlug }', 'import { extractIdFromSlug, generateSlug, routes }');
  fs.writeFileSync('src/pages/topic/[slug].tsx', codeT);
}

// Watch
replaceFile('src/pages/watch/[slug].tsx', [
  {from: /video\.shortDescription \|\| video\.description/g, to: 'video.description || ""'},
  {from: /video\.imageUrl \|\| video\.thumbnailUrl/g, to: 'video.thumbnailUrl || ""'}
]);

