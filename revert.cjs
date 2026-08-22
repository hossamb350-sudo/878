const fs = require('fs');
let code = fs.readFileSync('src/pages/home/index.tsx', 'utf-8');

const target = `                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right">
                         <div className="flex flex-col h-full">
                            <h3 className="font-bold text-[11px] sm:text-[12px] text-gray-900 leading-[1.5] transition-colors group-hover:text-taiz-sky mb-2 whitespace-normal line-clamp-3 font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                              {item.title}
                            </h3>
                            {/* Consistently aligned metadata line */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-auto w-full pt-1.5">
                               {/* 1. Author */}
                               {item.author && (
                                 <div className="flex items-center gap-1 text-slate-800 shrink-0 bg-slate-100/80 px-1.5 py-0.5 rounded-md">
                                   <PenTool className="w-2.5 h-2.5 text-taiz-sky" />
                                   <span className="font-bold text-[9px] sm:text-[10px] truncate max-w-[90px]">{item.author}</span>
                                 </div>
                               )}
                               
                               {/* 2, 3, 4. Dates & Time */}
                               <div className="flex flex-wrap items-center gap-1.5 text-slate-500 text-[9px] sm:text-[10px] font-medium shrink-0">
                                 <span className="text-slate-700 font-bold">{formatPublishInfo(item.createdAt).hDate}</span>
                                 <span className="text-slate-300 text-[8px]">•</span>
                                 <span>{formatPublishInfo(item.createdAt).mDate}</span>
                                 <span className="text-slate-300 text-[8px]">•</span>
                                 <span dir="ltr">{formatPublishInfo(item.createdAt).mTime}</span>
                               </div>
                               
                               {/* 5. Views */}
                               <div className="flex items-center gap-1 text-slate-600 bg-slate-100/80 px-1.5 py-0.5 rounded-md shrink-0 mr-auto">
                                 <Eye className="w-3 h-3 text-taiz-sky"/> 
                                 <span className="font-bold text-[9px] sm:text-[10px]">{item.views || 0}</span>
                            </div>
                                 <span className="text-[8px] sm:text-[9px]">مشاهدات</span>
                               </div>
                         </div>
                      </div>`;

const replacement = `                      {/* Left Side News Content */}
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
                               
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mDate}</span>
                               <span className="shrink-0">{formatPublishInfo(item.createdAt).mTime}</span>
                               <span className="shrink-0 text-gray-400">{formatPublishInfo(item.createdAt).hDate}</span>
                               
                               {/* Views */}
                               <span className="flex items-center gap-1 shrink-0 text-taiz-royal mr-auto">
                                 <Eye className="w-3 h-3 text-taiz-sky"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>
                      </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/home/index.tsx', code);
console.log(code.includes(replacement) ? "Fixed!" : "Not Fixed");
