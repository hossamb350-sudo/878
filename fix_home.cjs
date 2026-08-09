const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 1. Re-ordering
// Remove videos block from map
const videosBlockRegex = /\{\/\* Insert Video Slider Container \*\/\}\s*\{index === 1 && videos\.length > 0 && \([\s\S]*?\}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*\{\/\* End of news items list \*\/\}/;
content = content.replace(videosBlockRegex, '</div>\n              ))}\n              {/* End of news items list */}');

// The removed videos block
const videosBlockRaw = `{videos.length > 0 && (
              <div className="border-b-4 border-surface-card dark:border-white/5 pb-2 mb-4">
                <div className="py-2 px-4 sm:px-6 lg:px-8 bg-surface-main relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-taiz-sky/5 rounded-full blur-[40px] -mt-10 -mr-10"></div>
                  <div className="flex items-center justify-between mb-3 text-right relative z-10" style={{ direction: "rtl" }}>
                    <Link to="/watch" className="flex items-center gap-3 group cursor-pointer inline-flex">
                       <div className="bg-red-600 p-2 rounded-xl shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
                          <MonitorPlay className="w-5 h-5 text-white" />
                       </div>
                       <h2 className="font-black text-[18px] sm:text-[20px] select-none text-text-primary group-hover:text-red-600 transition-colors font-cairo">أحدث الفيديوهات</h2>
                    </Link>

                    <Link 
                      to="/watch"
                      className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-colors py-1.5 px-3 bg-red-600/10 hover:bg-red-600/20 rounded-full"
                    >
                      <span>عرض الكل</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar relative z-10" style={{ scrollbarWidth: 'none' }}>
                    {videos.map(video => (
                       <Link 
                         id={\`home-video-\${video.id}\`}
                         key={video.id} 
                         to={video.isLeader ? \`/leader/\${video.id}\` : \`/watch/\${video.id}\`} 
                         className="snap-start shrink-0 w-[240px] sm:w-[280px] group block outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-[12px]"
                       >
                          <div className="relative h-[135px] sm:h-[155px] rounded-[12px] overflow-hidden bg-gray-900 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 active:scale-95 transition-all duration-300 border border-black/5 dark:border-white/10">
                             {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                             ) : (
                                <div className="w-full h-full bg-gray-800"></div>
                             )}
                             <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                             
                             <div className="absolute top-2 right-2 z-30">
                                <div className="bg-white/95 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                   {video.category || "فيديو"}
                                </div>
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full group-hover:scale-110 group-active:scale-90 transition-transform border border-white/40 shadow-lg">
                                   <PlayCircle className="w-6 h-6 text-white ml-0.5" />
                                </div>
                             </div>
                             
                             <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-right">
                                <h4 className="text-white text-[13px] sm:text-[14px] font-bold leading-[1.4] line-clamp-2 transition-colors font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                                  {video.title}
                                </h4>
                             </div>
                             
                             {video.duration && (
                               <div className="absolute bottom-2 left-2 z-30">
                                 <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    {video.duration}
                                 </span>
                               </div>
                             )}
                          </div>
                       </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}`;

// Now remove the top bar
const topBarRegex = /\{\/\* Innovative Top Navigation Experience \*\/\}\s*<div className="pt-4 pb-3 px-4 bg-surface-main\/95[\s\S]*?<\/div>\s*<\/div>/;
const topBarMatch = content.match(topBarRegex);
if (topBarMatch) {
  content = content.replace(topBarRegex, '');
}

// And place slider, videos block, and top bar correctly
const listReplacementRegex = /\{\/\* HERO FEATURED POST SLIDER \*\/\}\s*<NewsSlider sliderList=\{sliderItems\} \/>\s*\{\/\* LIST OF OTHER POSTS \*\/\}/;
const replacementStr = `
            {/* HERO FEATURED POST SLIDER */}
            <div className="border-b-4 border-surface-card dark:border-white/5 pb-0 mb-4">
               <NewsSlider sliderList={sliderItems} />
            </div>

            {/* LATEST VIDEOS SECTION */}
            ${videosBlockRaw}

            {/* LATEST NEWS HEADER */}
            ${topBarMatch ? topBarMatch[0].replace('pt-4 pb-3 px-4', 'pt-2 pb-3 px-4 sm:px-6 lg:px-8') : ''}

            {/* LIST OF OTHER POSTS */}`;

content = content.replace(listReplacementRegex, replacementStr);


// 2. Fix the NewsSlider (increase height, move badge to top, use getCategoryColor)
content = content.replace(
  /h-\[290px\] sm:h-\[376px\]/,
  'h-[380px] sm:h-[450px]'
);

// Move badge to top and change classes
// Old: <div className="absolute top-[48%] right-4 sm:right-6 -translate-y-1/2 z-20">
// Old: <span className={`${getCategoryColor(currentItem.category)} text-white text-[10.5px] sm:text-[12px] font-bold px-3 py-1.5 rounded-full select-none tracking-wide`}>
content = content.replace(
  /<div className="absolute top-\[48%\] right-4 sm:right-6 -translate-y-1\/2 z-20">\s*<span className={`\$\{getCategoryColor\(currentItem\.category\)\} text-white text-\[10\.5px\] sm:text-\[12px\] font-bold px-3 py-1\.5 rounded-full select-none tracking-wide`}>/g,
  `<div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20">\n                  <span className={\`\${getCategoryColor(currentItem.category)} text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full select-none tracking-wide shadow-lg\`}>`
);


// 3. Fix the featured news card category (make it use getCategoryColor and smaller)
// Old: <span className="bg-red-600 text-white text-[11px] sm:text-[12.5px] font-bold px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(220,38,38,0.25)] shrink-0 select-none tracking-wide">
content = content.replace(
  /<span className="bg-red-600 text-white text-\[11px\] sm:text-\[12\.5px\] font-bold px-4 py-1\.5 rounded-full shadow-\[0_4px_12px_rgba\(220,38,38,0\.25\)\] shrink-0 select-none tracking-wide">/g,
  `<span className={\`\${getCategoryColor(item.category)} text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full shrink-0 select-none tracking-wide shadow-md\`}>`
);

// 4. Update interactions for featured news card
// Old: className="block relative w-full h-[376px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-white/5 shadow-lg mb-4 select-none group will-change-transform"
content = content.replace(
  /className="block relative w-full h-\[376px\] rounded-\[20px\] sm:rounded-\[24px\] overflow-hidden border border-white\/5 shadow-lg mb-4 select-none group will-change-transform"/g,
  `className="block relative w-full h-[376px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-black/5 dark:border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 mb-6 select-none group will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-blue-500"`
);

// 5. Update interactions for list news card
// Old: className="flex items-center bg-white rounded-[16px] shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-2.5 overflow-hidden group relative transition-\[transform,box-shadow\] duration-200 hover:shadow-md h-[110px] sm:h-[130px] will-change-transform"
content = content.replace(
  /className="flex items-center bg-white rounded-\[16px\] shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-2\.5 overflow-hidden group relative transition-\[transform,box-shadow\] duration-200 hover:shadow-md h-\[110px\] sm:h-\[130px\] will-change-transform"/g,
  `className="flex items-center bg-surface-card rounded-[16px] border border-black/5 dark:border-white/5 shadow-sm mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden group relative hover:shadow-md hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 h-[110px] sm:h-[130px] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-blue-500"`
);


// Save
fs.writeFileSync('src/pages/Home.tsx', content, 'utf8');
console.log('done');
