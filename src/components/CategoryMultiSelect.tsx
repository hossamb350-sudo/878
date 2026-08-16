import React, { useState, useEffect, useMemo, useRef } from "react";
import { Category } from "../types";
import { CategoryService } from "../services/CategoryService";
import { 
  Search, 
  Plus, 
  X, 
  Check, 
  Tag, 
  ChevronDown,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CategoryMultiSelectProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  accentColor?: "amber" | "rose" | "blue" | "emerald";
  title?: string;
  presetSuggestions?: string[];
  helperText?: string;
  defaultExpanded?: boolean;
}

export function CategoryMultiSelect({
  selectedCategories = [],
  onChange,
  accentColor = "amber",
  title = "تصنيفات المحتوى",
  presetSuggestions = [],
  helperText = "ملاحظة: اختيار التصنيفات يربط المحتوى تلقائياً بأبرز المواضيع والمصنفات المطابقة.",
  defaultExpanded = false
}: CategoryMultiSelectProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "selected" | "suggested">("all");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Accent styling mapping
  const colorMap = {
    amber: {
      activeBorder: "border-amber-500",
      activeBg: "bg-amber-500/15",
      activeText: "text-amber-600 dark:text-amber-400",
      btnBg: "bg-amber-500 hover:bg-amber-600 text-slate-950",
      badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      focusRing: "focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
      accentHex: "#F59E0B"
    },
    rose: {
      activeBorder: "border-rose-500",
      activeBg: "bg-rose-500/15",
      activeText: "text-rose-600 dark:text-rose-400",
      btnBg: "bg-rose-600 hover:bg-rose-700 text-white",
      badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      focusRing: "focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
      accentHex: "#E11D48"
    },
    blue: {
      activeBorder: "border-blue-500",
      activeBg: "bg-blue-500/15",
      activeText: "text-blue-600 dark:text-blue-400",
      btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
      badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
      focusRing: "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
      accentHex: "#2563EB"
    },
    emerald: {
      activeBorder: "border-emerald-500",
      activeBg: "bg-emerald-500/15",
      activeText: "text-emerald-600 dark:text-emerald-400",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      focusRing: "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
      accentHex: "#10B981"
    }
  };

  const theme = colorMap[accentColor] || colorMap.amber;

  // Real-time categories subscription
  useEffect(() => {
    const unsub = CategoryService.subscribeCategories((list) => {
      setCategories(list);
    });
    return () => unsub();
  }, []);

  // Helper to get category color
  const getCategoryColor = (catName: string) => {
    if (!catName) return theme.accentHex;
    const found = categories.find(c => c.name?.toLowerCase() === catName.trim().toLowerCase());
    return found?.color || CategoryService.getFallbackColor(catName);
  };

  // Combine unique category names
  const allCategoryNames = useMemo(() => {
    const names = new Set<string>();
    // 1. Preset suggestions first
    presetSuggestions.forEach(n => {
      if (n && n.trim()) names.add(n.trim());
    });
    // 2. Existing selected categories
    selectedCategories.forEach(n => {
      if (n && n.trim()) names.add(n.trim());
    });
    // 3. Database categories
    categories.forEach(c => {
      if (c.name && c.name.trim()) names.add(c.name.trim());
    });
    return Array.from(names);
  }, [categories, presetSuggestions, selectedCategories]);

  // Filtered categories based on search query and active tab
  const filteredCategories = useMemo(() => {
    let result = allCategoryNames;

    // Apply tab filter
    if (filterTab === "selected") {
      result = result.filter(name => selectedCategories.includes(name));
    } else if (filterTab === "suggested") {
      result = result.filter(name => presetSuggestions.includes(name));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(name => name.toLowerCase().includes(q));
    }

    return result;
  }, [allCategoryNames, selectedCategories, presetSuggestions, filterTab, searchQuery]);

  // Highlight matching text in category names
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const trimmedQuery = query.trim();
    const regex = new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/90 text-slate-950 font-black px-0.5 rounded shadow-2xs">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // Check if search query exactly matches an existing category
  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return allCategoryNames.some(name => name.toLowerCase() === q);
  }, [allCategoryNames, searchQuery]);

  // Toggle selection of a category
  const toggleCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;

    if (selectedCategories.includes(trimmed)) {
      onChange(selectedCategories.filter(c => c !== trimmed));
    } else {
      onChange([...selectedCategories, trimmed]);
    }
  };

  // Remove category from selected
  const removeCategory = (catName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(selectedCategories.filter(c => c !== catName));
  };

  // Clear all selected
  const clearAllSelected = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  // Add new category
  const handleAddNewCategory = async () => {
    const newName = searchQuery.trim();
    if (!newName) return;

    setIsAddingNew(true);
    try {
      const fallbackColor = CategoryService.getFallbackColor(newName);
      await CategoryService.saveCategory({ name: newName, color: fallbackColor });

      if (!selectedCategories.includes(newName)) {
        onChange([...selectedCategories, newName]);
      }

      setSearchQuery("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (e) {
      console.error("Error creating category:", e);
      if (!selectedCategories.includes(newName)) {
        onChange([...selectedCategories, newName]);
      }
      setSearchQuery("");
    } finally {
      setIsAddingNew(false);
    }
  };

  // Handle input changes - auto expand when typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Handle key down in search input (Enter to select/add, Escape to clear)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (!searchQuery.trim()) return;

      if (!exactMatchExists) {
        handleAddNewCategory();
      } else {
        const firstMatch = filteredCategories[0];
        if (firstMatch) {
          toggleCategory(firstMatch);
          setSearchQuery("");
        }
      }
    }
  };

  return (
    <div className="space-y-2 font-cairo text-right select-none" dir="rtl">
      {/* Main Collapsible Box Card (Accordion) */}
      <motion.div 
        layout
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200"
      >
        {/* Clickable Header Bar (Fold/Unfold Toggle) */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <Tag className="w-4 h-4" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {title}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border transition-all duration-300 ${
                  selectedCategories.length > 0 ? theme.badge : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                }`}>
                  {selectedCategories.length} محدد
                </span>
              </div>

              {/* Collapsed view summary preview */}
              {!isExpanded && selectedCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {selectedCategories.slice(0, 3).map(catName => {
                    const color = getCategoryColor(catName);
                    return (
                      <span
                        key={catName}
                        style={{
                          backgroundColor: `${color}15`,
                          borderColor: `${color}40`,
                          color: color
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{catName}</span>
                      </span>
                    );
                  })}
                  {selectedCategories.length > 3 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      +{selectedCategories.length - 3} إضافي
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedCategories.length > 0 && isExpanded && (
              <button
                type="button"
                onClick={clearAllSelected}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-bold transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                مسح الكل
              </button>
            )}

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>

        {/* Expandable Content Panel with Smooth Transition */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.25, delay: 0.05 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.15 }
                }
              }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40"
            >
              <div className="p-3.5 sm:p-4 space-y-3">
                {/* Search Bar Input */}
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="ابحث بالاسم أو اكتب لإضافة تصنيف جديد واضغط Enter..."
                      value={searchQuery}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className={`w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl pr-9 pl-8 py-2.5 border border-slate-200 dark:border-slate-700 outline-none transition-all duration-200 shadow-2xs ${theme.focusRing}`}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute left-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {searchQuery.trim() && !exactMatchExists && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      type="button"
                      onClick={handleAddNewCategory}
                      disabled={isAddingNew}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer ${theme.btnBg}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة "{searchQuery.trim()}"</span>
                    </motion.button>
                  )}
                </div>

                {/* Selected Categories Chips (if any selected) */}
                <AnimatePresence>
                  {selectedCategories.length > 0 && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex flex-wrap items-center gap-1.5 pt-1 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5"
                    >
                      <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">
                        المحددة ({selectedCategories.length}):
                      </span>
                      {selectedCategories.map((catName) => {
                        const catColor = getCategoryColor(catName);
                        return (
                          <motion.span
                            key={catName}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            style={{
                              backgroundColor: `${catColor}18`,
                              borderColor: `${catColor}60`,
                              color: catColor
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs"
                          >
                            <span
                              className="w-2 h-2 rounded-full shadow-2xs"
                              style={{ backgroundColor: catColor }}
                            />
                            <span>{catName}</span>
                            <button
                              type="button"
                              onClick={(e) => removeCategory(catName, e)}
                              className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                              title={`إزالة تصنيف ${catName}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filter Tabs */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFilterTab("all")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                        filterTab === "all"
                          ? `${theme.badge} font-black shadow-xs scale-100`
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      الكل ({allCategoryNames.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterTab("selected")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                        filterTab === "selected"
                          ? `${theme.badge} font-black shadow-xs scale-100`
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      المختارة ({selectedCategories.length})
                    </button>

                    {presetSuggestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterTab("suggested")}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                          filterTab === "suggested"
                            ? `${theme.badge} font-black shadow-xs scale-100`
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        المقترحة ({presetSuggestions.length})
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-bold">
                    {filteredCategories.length} خيار
                  </span>
                </div>

                {/* Filtered Categories Bubbles Grid with Micro-Animations */}
                <motion.div layout className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {filteredCategories.length === 0 ? (
                    <div className="w-full py-4 text-center text-xs font-bold text-slate-400 space-y-2">
                      <p>لا يوجد تصنيف مطابق لـ "{searchQuery}"</p>
                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${theme.btnBg}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة وتحديد "{searchQuery.trim()}" الآن</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredCategories.map((catName) => {
                      const isSelected = selectedCategories.includes(catName);
                      const catColor = getCategoryColor(catName);

                      return (
                        <motion.button
                          layout
                          key={catName}
                          type="button"
                          onClick={() => toggleCategory(catName)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${catColor}18`,
                                  color: catColor,
                                  borderColor: catColor
                                }
                              : {}
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
                            isSelected
                              ? "border-2 shadow-md ring-2 ring-offset-1 dark:ring-offset-slate-900 font-black"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs"
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {isSelected ? (
                              <motion.span
                                key="checked"
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 45 }}
                                transition={{ type: "spring", stiffness: 600, damping: 25 }}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white shadow-2xs shrink-0"
                                style={{ backgroundColor: catColor }}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="dot"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full opacity-60 shrink-0"
                                style={{ backgroundColor: catColor }}
                              />
                            )}
                          </AnimatePresence>
                          <span>{highlightMatch(catName, searchQuery)}</span>
                        </motion.button>
                      );
                    })
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Helper Note */}
      {helperText && (
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
