const fs = require('fs');
const file = 'src/components/AdminNewsWizard.tsx';
let code = fs.readFileSync(file, 'utf8');

// We need to add state variables at the top of the component for the filters and pagination.
// Let's find a good place to inject them.
const stateInjection = `
  // List View States
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listCategoryFilter, setListCategoryFilter] = useState("all");
  const [listStatusFilter, setListStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
`;

code = code.replace(/const \[lastAutoSave, setLastAutoSave\] = useState<number \| null>\(null\);/, `const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);\n` + stateInjection);

// Calculate filtered and paginated list
const filterLogicInjection = `
  const filteredNewsList = newsList.filter(item => {
    const matchesSearch = !listSearchQuery || item.title.toLowerCase().includes(listSearchQuery.toLowerCase());
    const matchesCategory = listCategoryFilter === "all" || item.category === listCategoryFilter || (item.categories && item.categories.includes(listCategoryFilter));
    const status = item.publishStatus || "published";
    const matchesStatus = listStatusFilter === "all" || status === listStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredNewsList.length / itemsPerPage);
  const paginatedNewsList = filteredNewsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
`;

code = code.replace(/const filteredNewsList = \[\];/, filterLogicInjection); // In case it exists, but it doesn't.
// Let's inject it before the return statement.
code = code.replace(/  return \(/, filterLogicInjection + `\n  return (`);

const newListView = `
      {/* Collapsible News List Section */}
      <div className="bg-white dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
        <button 
          onClick={() => setIsListExpanded(!isListExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-4 text-right">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
              <List className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">إدارة الأخبار المنشورة</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">مركز التحكم الشامل وتعديل الأخبار ({newsList.length} خبر)</p>
            </div>
          </div>
          <div className={\`p-2 rounded-full bg-gray-100 dark:bg-gray-700 transition-transform duration-300 \${isListExpanded ? 'rotate-180' : ''}\`}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </button>

        <AnimatePresence>
          {isListExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                
                {/* Filters and Search Toolbar */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shrink-0">
                      <button onClick={() => setViewMode("list")} className={\`p-2 rounded-lg transition-colors \${viewMode === 'list' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}\`} title="عرض كقائمة"><List className="w-4 h-4" /></button>
                      <button onClick={() => setViewMode("grid")} className={\`p-2 rounded-lg transition-colors \${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}\`} title="عرض كشبكة"><LayoutGrid className="w-4 h-4" /></button>
                    </div>
                    
                    {/* Category Filter */}
                    <select 
                      value={listCategoryFilter} 
                      onChange={(e) => { setListCategoryFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 shrink-0"
                    >
                      <option value="all">كل التصنيفات</option>
                      {savedCats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>

                    {/* Status Filter */}
                    <select 
                      value={listStatusFilter} 
                      onChange={(e) => { setListStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 shrink-0"
                    >
                      <option value="all">كل الحالات</option>
                      <option value="published">منشور</option>
                      <option value="draft">مسودة</option>
                    </select>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full xl:w-80">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="ابحث في الأخبار..."
                      value={listSearchQuery}
                      onChange={(e) => { setListSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {loadingList ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-bold">جاري تحميل الأخبار...</p>
                  </div>
                ) : paginatedNewsList.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="font-bold text-lg text-gray-500 dark:text-gray-400">لا توجد أخبار مطابقة لبحثك</p>
                  </div>
                ) : (
                  <>
                    <div className={\`grid gap-4 \${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}\`}>
                      {paginatedNewsList.map((item) => {
                        const status = item.publishStatus || 'published';
                        const isDraft = status === 'draft';
                        
                        return (
                          <div key={item.id} className={\`flex \${viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group\`}>
                            {/* Image Container */}
                            <div className={\`relative overflow-hidden rounded-xl shrink-0 bg-gray-100 dark:bg-gray-900 \${viewMode === 'grid' ? 'w-full aspect-[16/9]' : 'w-full sm:w-[160px] h-[120px]'}\`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                </div>
                              )}
                              
                              {/* Overlay Badges */}
                              <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                                {isDraft && (
                                  <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                    <Edit2 className="w-3 h-3" /> مسودة
                                  </span>
                                )}
                                {item.isBreaking && (
                                  <span className="bg-red-600/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> عاجل
                                  </span>
                                )}
                                {item.isPinned && (
                                  <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm">
                                    مثبت
                                  </span>
                                )}
                                {item.isFeaturedLayout && (
                                  <span className="bg-purple-600/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm">
                                    مميز
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Content Container */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div className="text-right">
                                {/* Meta Row */}
                                <div className="flex items-center justify-end gap-2 mb-2 flex-wrap">
                                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.createdAt).toLocaleString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {item.author && (
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-900/50 px-2 py-0.5 rounded-md flex items-center gap-1 line-clamp-1 max-w-[100px]">
                                      <User className="w-3 h-3" />
                                      {item.author}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    {item.category || "عام"}
                                  </span>
                                </div>
                                
                                {/* Title */}
                                <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors text-right leading-relaxed text-sm mb-2">{item.title}</h4>
                                
                                {/* Stats */}
                                <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-gray-400">
                                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views || 0}</span>
                                  {item.liveUpdates && item.liveUpdates.length > 0 && (
                                    <span className="flex items-center gap-1 text-red-500"><Activity className="w-3 h-3" /> {item.liveUpdates.length} تحديث</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className={\`flex items-center justify-end gap-2 \${viewMode === 'grid' ? 'mt-4 pt-4 border-t border-gray-100 dark:border-gray-700' : 'mt-2'}\`}>
                                <a 
                                  href={\`/news/\${item.id}\`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-all" 
                                  title="معاينة الخبر"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button 
                                  onClick={() => { handleEditClick(item); setCurrentStep(1); }} 
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-all font-bold text-xs"
                                >
                                  <Edit className="w-4 h-4" /> تعديل
                                </button>
                                <button 
                                  onClick={() => handleDelete(item.id)} 
                                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all" 
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            // Smart pagination dots logic could go here, but simple for now
                            let pageNum = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                              pageNum = currentPage - 2 + i;
                              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={\`w-10 h-10 rounded-lg font-bold text-sm transition-all \${
                                  currentPage === pageNum 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }\`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
`;

// Replace the old list view with the new list view
// The old list view starts with `{/* Collapsible News List Section */}` and ends before `    </div>\n  );\n}`
const startRegex = /\{\/\* Collapsible News List Section \*\/\}/;
// find index of start
const startIndex = code.indexOf('{/* Collapsible News List Section */}');
if (startIndex !== -1) {
    const endMatch = code.lastIndexOf('</div>\n    </div>\n  );\n}');
    if (endMatch !== -1) {
        code = code.substring(0, startIndex) + newListView + code.substring(endMatch + 6);
    } else {
      console.log("Could not find end match for replacement");
    }
} else {
    console.log("Could not find start index for replacement");
}

fs.writeFileSync(file, code);
