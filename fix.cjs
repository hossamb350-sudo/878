const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
code = code.replace(/<span className="font-black text-xs md:text-sm text-white tracking-wide leading-none font-cairo w.*?dow-red-500\/20 transition-all"\s*>/s, 
`<span className="font-black text-xs md:text-sm text-white tracking-wide leading-none font-cairo whitespace-nowrap px-2 drop-shadow-sm" dir="rtl">
                                {newsText}
                              </span>
                              <div className="inline-flex items-center gap-2 px-4 shrink-0 opacity-90">
                                <div className="flex items-center justify-center p-1">
                                  <div className="w-4 h-4 bg-white/30 rounded-full"></div>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={saveNews}
                disabled={saving || !text}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all"
              >`);
fs.writeFileSync('src/pages/Admin.tsx', code);
