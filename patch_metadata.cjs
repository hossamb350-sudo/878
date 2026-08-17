const fs = require('fs');
const path = require('path');

function patchFile(file, objectVar, typeStr) {
  const fullPath = path.join(__dirname, 'src/pages', file);
  if (!fs.existsSync(fullPath)) return;
  
  let code = fs.readFileSync(fullPath, 'utf8');
  
  if (!code.includes('updateMetadata')) {
    code = code.replace(/import \{ extractIdFromSlug/g, 'import { updateMetadata } from "../../utils/metadata";\nimport { extractIdFromSlug');
  }

  // Find where setItem(data) is called or where the data is loaded and not loading anymore
  // Or just put it in an effect that depends on the item
  const effectCode = `
  useEffect(() => {
    if (${objectVar}) {
      updateMetadata({
        title: ${objectVar}.title,
        description: ${objectVar}.shortDescription || ${objectVar}.description || "",
        imageUrl: ${objectVar}.imageUrl || ${objectVar}.thumbnailUrl || "",
        type: "${typeStr}",
        path: window.location.pathname
      });
    }
  }, [${objectVar}]);
`;

  // Insert before return (
  code = code.replace(/return \(/, effectCode + '\n  return (');
  
  fs.writeFileSync(fullPath, code);
}

patchFile('news/[slug].tsx', 'news', 'article');
patchFile('articles/[slug].tsx', 'article', 'article');
patchFile('watch/[slug].tsx', 'video', 'video.other');
patchFile('leader/[slug].tsx', 'leader', 'article');
patchFile('topic/[slug].tsx', 'topic', 'website');

// Activity has slightly different structure
patchFile('events/activity/[slug].tsx', 'activity', 'article');

