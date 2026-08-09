const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 1. Remove getCategoryColor function
content = content.replace(/function getCategoryColor\([\s\S]*?\}\n/, '');

// 2. Replace getCategoryColor usages with CategoryBadges
// In Slider:
const sliderBadgeRegex = /<div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20">\s*<span className=\{\`\$\{getCategoryColor\(currentItem\.category\)\} text-white text-\[10px\] sm:text-\[11px\] font-bold px-3 py-1 rounded-full select-none tracking-wide shadow-lg\`\}>\s*\{displayCategory\}\s*<\/span>\s*<\/div>/g;
content = content.replace(sliderBadgeRegex, '<div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20">\n                  <CategoryBadges item={currentItem} isHero={true} className="drop-shadow-lg" />\n                </div>');

// In Featured News Card:
const featuredBadgeRegex = /<span className=\{\`\$\{getCategoryColor\(item\.category\)\} text-white text-\[10px\] sm:text-\[11px\] font-bold px-3 py-1 rounded-full shrink-0 select-none tracking-wide shadow-md\`\}>\s*\{item\.category === "المولد النبوي الشريف" \? "المولد النبوي الشريف 1446هـ" : item\.category\}\s*<\/span>/g;
content = content.replace(featuredBadgeRegex, '<CategoryBadges item={item} isHero={true} className="drop-shadow-md shrink-0" />');

// 3. Update Colors in the video header and news header to platform colors
content = content.replace(/bg-red-600/g, 'bg-taiz-sky');
content = content.replace(/text-red-600/g, 'text-taiz-sky');
content = content.replace(/text-red-700/g, 'text-taiz-royal');
content = content.replace(/hover:text-red-600/g, 'hover:text-taiz-royal');
content = content.replace(/hover:text-red-700/g, 'hover:text-taiz-navy');
content = content.replace(/bg-red-400/g, 'bg-taiz-soft');
content = content.replace(/from-red-600 to-red-700/g, 'from-taiz-sky to-taiz-royal');
content = content.replace(/hover:from-red-700 hover:to-red-800/g, 'hover:from-taiz-royal hover:to-taiz-navy');
content = content.replace(/rgba\(220,38,38,/g, 'rgba(30,66,117,'); // shadow color

// Make sure that CategoryBadges is imported. It is already imported.
// Make sure formatPublishInfo is correct.

// 4. Improve card interactions (Next.js 15 / Material Design 3 style) for list items
// Already updated earlier but let's make it robust
// className="flex items-center bg-surface-card rounded-[16px] border border-black/5 dark:border-white/5 shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden group relative hover:shadow-md hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 h-[110px] sm:h-[130px] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
// No need to change since it was updated to MD3 style (hover translate, shadow, active scale).

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
console.log('done');
