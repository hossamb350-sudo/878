const fs = require('fs');
const path = require('path');

const files = [
  'news/[slug].tsx',
  'articles/[slug].tsx',
  'watch/[slug].tsx',
  'leader/[slug].tsx',
  'events/activity/[slug].tsx',
  'topic/[slug].tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, 'src/pages', file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Add generateSlug to routes import
  if (!content.includes('generateSlug')) {
    content = content.replace(/import \{ extractIdFromSlug \} from "([^"]+)";/, 'import { extractIdFromSlug, generateSlug } from "$1";');
  }
  
  // Replace getShareableUrl(`/something/${id}`) with getShareableUrl(`/something/${generateSlug(item.title, id)}`)
  // First, we need to find what the item object is called.
  // In news: news
  // In articles: article
  // In watch: video
  // In leader: leader
  // In events: activity
  // In topic: topic
  
  let itemVar = '';
  let routeType = '';
  
  if (file.includes('news')) { itemVar = 'news'; routeType = 'news'; }
  if (file.includes('articles')) { itemVar = 'article'; routeType = 'article'; }
  if (file.includes('watch')) { itemVar = 'video'; routeType = 'watchItem'; }
  if (file.includes('leader')) { itemVar = 'leader'; routeType = 'leaderItem'; }
  if (file.includes('events')) { itemVar = 'activity'; routeType = 'activity'; }
  if (file.includes('topic')) { itemVar = 'topic'; routeType = 'topic'; }

  // We will replace getShareableUrl(...) with routes.absolute(routes.something(generateSlug(item?.title, item?.id)))
  // Actually, wait, some use getShareableUrl(\`/news/\${id || news?.id}\`)
  
  content = content.replace(
    /const url = getShareableUrl\([^)]+\);/,
    `const url = getShareableUrl(\`/\${"${routeType === 'watchItem' ? 'watch' : routeType === 'activity' ? 'events/activity' : routeType === 'leaderItem' ? 'leader' : routeType}"}/\${generateSlug(${itemVar}?.title || "", ${itemVar}?.id || id)}\`);`
  );

  fs.writeFileSync(fullPath, content);
});
