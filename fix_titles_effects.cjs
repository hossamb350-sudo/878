const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Slider Title
content = content.replace(
  /className="font-bold text-\[17px\] sm:text-\[22px\] md:text-\[25px\] text-white leading-\[1\.35\] transition-colors group-hover:text-taiz-sky line-clamp-2 font-cairo text-right w-full mb-3 shadow-text"/,
  'className="font-bold text-[16px] sm:text-[19px] md:text-[22px] text-white leading-[1.35] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo text-right w-full mb-3 shadow-text"'
);

// Videos Title
content = content.replace(
  /className="text-white text-\[13px\] sm:text-\[14px\] font-bold leading-\[1\.4\] line-clamp-2 transition-colors font-cairo"/,
  'className="text-white text-[12px] sm:text-[13px] font-bold leading-[1.4] line-clamp-3 transition-colors font-cairo"'
);

// Featured News Title
content = content.replace(
  /className="font-bold text-\[18px\] sm:text-\[22px\] md:text-\[25px\] text-white leading-\[1\.4\] transition-colors group-hover:text-taiz-sky line-clamp-2 font-cairo text-right w-full"/,
  'className="font-bold text-[16px] sm:text-[19px] md:text-[22px] text-white leading-[1.4] transition-colors group-hover:text-taiz-sky line-clamp-3 font-cairo text-right w-full"'
);

// Normal News Title
content = content.replace(
  /className="font-bold text-\[12px\] sm:text-\[13px\] text-gray-900 leading-\[1\.5\] transition-colors hover:text-taiz-sky mb-2 whitespace-normal line-clamp-2 font-cairo"/g,
  'className="font-bold text-[11px] sm:text-[12px] text-gray-900 leading-[1.5] transition-colors group-hover:text-taiz-sky mb-2 whitespace-normal line-clamp-3 font-cairo"'
);

// Featured Article Title
content = content.replace(
  /className="text-white text-xl font-black mb-4 leading-relaxed line-clamp-2 font-cairo"/,
  'className="text-white text-lg font-black mb-4 leading-[1.5] line-clamp-3 font-cairo"'
);

// Normal Article Title
content = content.replace(
  /className="font-black text-sm leading-relaxed mb-2 line-clamp-2 font-cairo"/g,
  'className="font-black text-[13px] leading-[1.5] mb-2 line-clamp-3 transition-colors group-hover:text-taiz-sky font-cairo"'
);

// Update Effects

// Featured News Card Effects
content = content.replace(
  /className="block relative w-full h-\[376px\] rounded-\[20px\] sm:rounded-\[24px\] overflow-hidden border border-black\/5 dark:border-white\/10 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-\[0\.98\] transition-all duration-300 mb-6 select-none group will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky"/,
  'className="block relative w-full h-[376px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-black/5 dark:border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:opacity-90 transition-all duration-300 ease-out mb-6 select-none group will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky touch-manipulation"'
);

// Normal News Card Effects
content = content.replace(
  /className="flex items-center bg-surface-card rounded-\[16px\] border border-black\/5 dark:border-white\/5 shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden group relative hover:shadow-md hover:-translate-y-1 active:scale-\[0\.98\] transition-all duration-300 h-\[110px\] sm:h-\[130px\] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky"/g,
  'className="flex items-center bg-surface-card rounded-[16px] border border-black/5 dark:border-white/5 shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden group relative hover:shadow-md hover:bg-surface-hover/50 hover:-translate-y-0.5 active:scale-[0.98] active:opacity-90 transition-all duration-300 ease-out h-[110px] sm:h-[130px] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky touch-manipulation"'
);

fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
console.log('done');
