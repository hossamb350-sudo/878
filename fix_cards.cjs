const fs = require('fs');
let code = fs.readFileSync('src/pages/home/index.tsx', 'utf-8');

const target = `                    <Link
                      to={item.isLeader ? routes.leaderItem(generateSlug(item.title || "", item.id)) : routes.news(generateSlug(item.title || "", item.id))} 
                      className="flex items-center bg-white rounded-[14px] border border-slate-200/80 shadow-soft mx-2 sm:mx-3 mb-2 overflow-hidden group relative hover:shadow-medium hover:bg-slate-50/50 hover:-translate-y-0.5 active:scale-[0.98] active:opacity-90 transition-all duration-300 ease-out h-[105px] sm:h-[120px] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky touch-manipulation"
                      style={{ direction: 'rtl', transform: 'translateZ(0)' }}
                    >
                      {/* Right Side Compact Image */}
                      {item.imageUrl ? (
                        <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 overflow-hidden">
                           <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                           <div className="absolute bottom-1.5 inset-x-1 flex justify-center z-10 pointer-events-none">
                             <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                           </div>
                        </div>
                      ) : (
                        <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center">
                           <div className="absolute bottom-1.5 inset-x-1 flex justify-center z-10 pointer-events-none">
                             <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                           </div>
                        </div>
                      )}
                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right">
                         <div>
                            <h3 className="font-bold text-[11px] sm:text-[12px] text-gray-900 leading-[1.5] transition-colors group-hover:text-taiz-sky mb-2 whitespace-normal line-clamp-3 font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                              {item.title}
                            </h3>
                            {/* Consistently aligned metadata line */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] font-medium text-gray-500 mt-auto">
                               {item.author && (
                                 <span className="text-gray-700 font-bold truncate max-w-[80px]">{item.author}</span>
                               )}
                               
                               <span className="shrink-0 text-gray-400">{formatPublishInfo(item.createdAt).hDate}</span>
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mDate}</span>
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mTime}</span>
                               
                               {/* Views */}
                               <span className="flex items-center gap-1 shrink-0 text-taiz-royal mr-auto">
                                 <Eye className="w-3 h-3 text-taiz-sky"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>
                      </div>
                    </Link>`;

const replacement = `                    <Link
                      to={item.isLeader ? routes.leaderItem(generateSlug(item.title || "", item.id)) : routes.news(generateSlug(item.title || "", item.id))} 
                      className="flex items-center bg-white rounded-[14px] border border-slate-200/70 shadow-sm mx-2 sm:mx-3 mb-2 overflow-hidden group relative hover:shadow-md hover:border-slate-300/80 active:scale-[0.97] active:bg-slate-50 transition-all duration-300 active:duration-100 ease-out h-[105px] sm:h-[120px] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-taiz-sky touch-manipulation"
                      style={{ direction: 'rtl', transform: 'translateZ(0)' }}
                    >
                      {/* Elegant Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-l from-slate-400/0 via-slate-400/5 to-slate-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"></div>
                      
                      {/* Active Press Overlay */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-active:opacity-100 transition-opacity duration-100 pointer-events-none z-20"></div>

                      {/* Right Side Compact Image */}
                      {item.imageUrl ? (
                        <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 overflow-hidden">
                           <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                           <div className="absolute bottom-1.5 inset-x-1 flex justify-center z-10 pointer-events-none">
                             <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                           </div>
                        </div>
                      ) : (
                        <div className="relative w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center">
                           <div className="absolute bottom-1.5 inset-x-1 flex justify-center z-10 pointer-events-none">
                             <CategoryBadges item={item} isSecondary={true} className="drop-shadow-md" />
                           </div>
                        </div>
                      )}
                      
                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right z-10">
                         <div>
                            <h3 className="font-bold text-[11px] sm:text-[12px] text-gray-900 leading-[1.5] transition-colors group-hover:text-taiz-sky mb-2 whitespace-normal line-clamp-3 font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                              {item.title}
                            </h3>
                            {/* Consistently aligned metadata line - Reduced size & unified color */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8.5px] sm:text-[9px] font-bold text-slate-500 mt-auto transition-colors duration-300 group-hover:text-slate-600">
                               {item.author && (
                                 <span className="truncate max-w-[80px]">{item.author}</span>
                               )}
                               
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).hDate}</span>
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mDate}</span>
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mTime}</span>
                               
                               {/* Views */}
                               <span className="flex items-center gap-1 shrink-0 mr-auto">
                                 <Eye className="w-2.5 h-2.5"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>
                      </div>
                    </Link>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/home/index.tsx', code);
    console.log("Updated cards successfully!");
} else {
    console.log("Target not found!");
}
