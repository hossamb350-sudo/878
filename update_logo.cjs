const fs = require('fs');
let content = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

const targetContent = `<div className="flex flex-col items-center justify-center w-full">
            {/* Platform Logo */}
            <img 
              src="/logo2.png" 
              alt="Taiz Media Platform Logo" 
              className="h-[48px] sm:h-[68px] md:h-[84px] lg:h-[96px] w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-102 transition-transform" 
            />
            
            {/* Arabic platform name */}
            <span className="text-[8px] sm:text-[11px] md:text-[13px] lg:text-[14px] text-[#07152B] font-black font-cairo block mt-1 sm:mt-1.5 leading-none">
              منصة تعز الإعلامية
            </span>
            
            {/* English platform name (with rich golden shade for contrast) */}
            <span className="text-[5.5px] sm:text-[7.5px] md:text-[9px] lg:text-[9.5px] text-amber-600 font-black tracking-[0.14em] block font-sans mt-1 leading-none">
              TAIZ MEDIA PLATFORM
            </span>
          </div>`;

const replacementContent = `<div className="flex flex-col items-center justify-center w-full">
            {/* Platform Logo */}
            <img 
              src="/logo3.png" 
              alt="Taiz Media Platform Logo" 
              className="h-[58px] sm:h-[78px] md:h-[94px] lg:h-[106px] w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-102 transition-transform" 
            />
          </div>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/components/HeaderWidgets.tsx', content);
  console.log("Successfully replaced logo and removed text.");
} else {
  console.log("Target content not found. Outputting surrounding content for debugging:");
  console.log(content.substring(content.indexOf('alt="Taiz Media Platform Logo"') - 200, content.indexOf('alt="Taiz Media Platform Logo"') + 600));
}
