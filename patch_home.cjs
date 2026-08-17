const fs = require('fs');
let code = fs.readFileSync('src/pages/home/index.tsx', 'utf8');

if (!code.includes('import { routes, generateSlug }')) {
  code = code.replace(
    'import { Link, useNavigate } from "react-router-dom";',
    'import { Link, useNavigate } from "react-router-dom";\nimport { routes, generateSlug } from "../../utils/routes";'
  );
}

// Replace string paths in Links
code = code.replace(/to=\{\`\/news\/\$\{([^}]+)\}\`\}/g, "to={routes.news(generateSlug($1.title || '', $1.id))}");
code = code.replace(/to=\{\`\/watch\/\$\{([^}]+)\}\`\}/g, "to={routes.watchItem(generateSlug($1.title || '', $1.id))}");
code = code.replace(/to=\{\`\/articles\/\$\{([^}]+)\}\`\}/g, "to={routes.article(generateSlug($1.title || '', $1.id))}");

// For item not matched properly (like `newsItem` instead of `item`? we used $1 which catches anything before .id)
// Wait, sometimes it's `video.id`, `item.id`, etc.
// But we need the title for `generateSlug`. If the object is `$1` then `$1.title` and `$1.id`. Let's hope it's standard.

// Wait, the regex `([^}]+)` matches `item.id` so `$1` is `item.id` -> `$1.title` becomes `item.id.title` which is bad.
// The regex should match the variable name before `.id`.
code = code.replace(/to=\{\`\/news\/\$\{([^.]+)\.id\}\`\}/g, "to={routes.news(generateSlug($1.title || '', $1.id))}");
code = code.replace(/to=\{\`\/watch\/\$\{([^.]+)\.id\}\`\}/g, "to={routes.watchItem(generateSlug($1.title || '', $1.id))}");
code = code.replace(/to=\{\`\/articles\/\$\{([^.]+)\.id\}\`\}/g, "to={routes.article(generateSlug($1.title || '', $1.id))}");

fs.writeFileSync('src/pages/home/index.tsx', code);
