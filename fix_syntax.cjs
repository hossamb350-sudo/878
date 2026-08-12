const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// The remaining parts of getCategoryColor:
const remaining = `    return "bg-amber-600 shadow-[0_4px_12px_rgba(217,119,6,0.3)]";
  }
  if (cat.includes("رياضة")) {
    return "bg-emerald-600 shadow-[0_4px_12px_rgba(5,150,105,0.3)]";
  }
  if (cat.includes("اقتصاد") || cat.includes("مال")) {
    return "bg-cyan-600 shadow-[0_4px_12px_rgba(8,145,178,0.3)]";
  }
  return "bg-taiz-sky shadow-[0_4px_12px_rgba(30,66,117,0.3)]";
}`;
content = content.replace(remaining, '');

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
