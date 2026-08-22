const fs = require('fs');
let code = fs.readFileSync('src/pages/home/index.tsx', 'utf-8');

const target2 = `                            </div>
                             {/* Views */}
                               <span className="flex items-center gap-1 shrink-0 text-taiz-royal mr-auto">
                                 <Eye className="w-3 h-3 text-taiz-sky"/> 
                                 {item.views || 0}
                               </span>
                            </div>
                         </div>`;

const replacement2 = `                            </div>
                         </div>`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/pages/home/index.tsx', code);
console.log("Cleanup done");
