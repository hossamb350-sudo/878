const fs = require('fs');
let code = fs.readFileSync('src/pages/home/index.tsx', 'utf-8');

const target = `                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right">
                         <div>
                                   {/* Consistently aligned metadata line */}`;

const replacement = `                      {/* Left Side News Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right">
                         <div className="flex flex-col h-full">
                            <h3 className="font-bold text-[11px] sm:text-[12px] text-gray-900 leading-[1.5] transition-colors group-hover:text-taiz-sky mb-2 whitespace-normal line-clamp-3 font-cairo" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                              {item.title}
                            </h3>
                            {/* Consistently aligned metadata line */}`;

code = code.replace(target, replacement);

const target2 = `                            </div>
                             {/* Views */}
                               <span className="flex items-center gap-1 shrink-0 text-taiz-royal mr-auto">
                                 <Eye className="w-3 h-3 text-taiz-sky"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>
                      </div>`;

const replacement2 = `                            </div>
                         </div>
                      </div>`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/pages/home/index.tsx', code);
console.log(code.includes("h3") ? "Fixed!" : "Not Fixed");
