import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Category } from "../types";
import { CategoryService } from "../services/CategoryService";
import { 
  Check, 
  Search, 
  X, 
  Loader2, 
  Plus, 
  Edit3,
  CheckSquare,
  Square,
  Layers,
  Save,
  Tag,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuickCategorySelectorProps {
  currentCategory?: string;
  currentCategories?: string[];
  itemTitle?: string;
  onUpdate: (newCategory: string, allCategories: string[]) => Promise<void> | void;
  variant?: "badge" | "button" | "pill";
  size?: "xs" | "sm" | "md";
  className?: string;
  allowAddNew?: boolean;
}

export function QuickCategorySelector({
  currentCategory = "",
  currentCategories,
  itemTitle,
  onUpdate,
  variant = "badge",
  size = "sm",
  className = "",
  allowAddNew = true
}: QuickCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "selected">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state for selected categories inside modal
  const [selectedList, setSelectedList] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute canonical initial list of categories in a stable way
  const computeActiveList = useCallback(() => {
    const list: string[] = [];
    if (currentCategories && Array.isArray(currentCategories)) {
      currentCategories.forEach(c => {
        if (c && c.trim() && !list.includes(c.trim())) list.push(c.trim());
      });
    }
    if (currentCategory && currentCategory.trim() && !list.includes(currentCategory.trim())) {
      list.unshift(currentCategory.trim());
    }
    return list;
  }, [currentCategory, currentCategories]);

  const activeCategoriesList = useMemo(() => computeActiveList(), [computeActiveList]);

  // Subscribe to system categories
  useEffect(() => {
    const unsub = CategoryService.subscribeCategories((list) => {
      setCategories(list);
    });
    return () => unsub();
  }, []);

  // Open modal handler
  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const currentList = computeActiveList();
    setSelectedList(currentList);
    setSearchQuery("");
    setFilterTab("all");
    setToastMessage(null);
    setIsOpen(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    if (isLoading) return;
    setIsOpen(false);
  };

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => window.removeEventListener("keydown", handleKeyDownGlobal);
  }, [isOpen, isLoading]);

  // Helper to get exact color for any category name
  const getCategoryColor = (catName: string) => {
    if (!catName) return "#64748B";
    const found = categories.find(c => c.name?.toLowerCase() === catName.trim().toLowerCase());
    return found?.color || CategoryService.getFallbackColor(catName);
  };

  // Combine all known category options
  const allAvailableCategories = useMemo(() => {
    const map = new Map<string, string>();
    // 1. Registered system categories
    categories.forEach(c => {
      if (c.name?.trim()) map.set(c.name.trim(), c.color || CategoryService.getFallbackColor(c.name));
    });
    // 2. Active categories
    activeCategoriesList.forEach(c => {
      if (!map.has(c)) map.set(c, CategoryService.getFallbackColor(c));
    });


    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [categories, activeCategoriesList]);

  // Filtered categories based on search and tabs
  const filteredCategories = useMemo(() => {
    let list = allAvailableCategories;
    if (filterTab === "selected") {
      list = list.filter(c => selectedList.includes(c.name));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [allAvailableCategories, filterTab, searchQuery, selectedList]);

  // Check if query exists exactly
  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return allAvailableCategories.some(c => c.name.toLowerCase() === q);
  }, [allAvailableCategories, searchQuery]);

  // Highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const trimmedQuery = query.trim();
    const regex = new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/80 text-black dark:text-white px-0.5 rounded font-black">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // Toggle category in local selection
  const handleToggleCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;

    if (selectedList.includes(trimmed)) {
      setSelectedList(selectedList.filter(c => c !== trimmed));
    } else {
      setSelectedList([...selectedList, trimmed]);
    }
  };

  // Remove category from selected list
  const handleRemoveCategory = (catName: string) => {
    setSelectedList(selectedList.filter(c => c !== catName));
  };

  // Save selected categories to Firestore
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const finalCategories = selectedList.length > 0 ? selectedList : [];
      const primaryCategory = finalCategories[0] || "";

      await onUpdate(primaryCategory, finalCategories);

      setToastMessage(`تم حفظ التعديلات بنجاح (${finalCategories.length} تصنيف)`);
      setTimeout(() => {
        setToastMessage(null);
        setIsOpen(false);
      }, 500);
    } catch (error) {
      console.error("Failed to update categories:", error);
      alert("حدث خطأ أثناء حفظ التصنيفات، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add new category and auto-select it
  const handleAddNewCategory = async () => {
    const newName = searchQuery.trim();
    if (!newName) return;

    setIsAddingNew(true);
    try {
      const fallbackColor = CategoryService.getFallbackColor(newName);
      await CategoryService.saveCategory({ name: newName, color: fallbackColor });

      if (!selectedList.includes(newName)) {
        setSelectedList(prev => [...prev, newName]);
      }
      setSearchQuery("");
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (e) {
      console.error("Error creating category:", e);
      if (!selectedList.includes(newName)) {
        setSelectedList(prev => [...prev, newName]);
      }
      setSearchQuery("");
    } finally {
      setIsAddingNew(false);
    }
  };

  // Primary category for trigger styling
  const primaryCat = activeCategoriesList[0] || "بدون تصنيف";
  const primaryColor = getCategoryColor(primaryCat);
  const extraCount = activeCategoriesList.length > 1 ? activeCategoriesList.length - 1 : 0;

  return (
    <>
      {/* TRIGGER BADGE */}
      <button
        type="button"
        onClick={handleOpenModal}
        title="انقر لتعديل تصنيفات هذا المحتوى"
        style={{
          backgroundColor: `${primaryColor}18`,
          borderColor: `${primaryColor}60`,
          color: primaryColor
        }}
        className={`group relative inline-flex items-center gap-1.5 rounded-lg border font-black transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs cursor-pointer select-none font-cairo ${className} ${
          size === "xs" 
            ? "px-2 py-0.5 text-[10px]" 
            : size === "md"
            ? "px-3 py-1.5 text-xs"
            : "px-2.5 py-1 text-[11px]"
        }`}
      >
        <span 
          className="w-1.5 h-1.5 rounded-full shrink-0 shadow-xs" 
          style={{ backgroundColor: primaryColor }} 
        />
        
        <span className="truncate max-w-[110px] sm:max-w-[140px]">{primaryCat}</span>

        {extraCount > 0 && (
          <span 
            style={{ backgroundColor: primaryColor }}
            className="text-[9px] text-white px-1.5 py-0.2 rounded-full font-bold shadow-2xs"
          >
            +{extraCount}
          </span>
        )}
        
        <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
      </button>

      {/* CENTERED DIALOG MODAL (Rendered via React Portal) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div 
              className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 font-cairo select-none"
              dir="rtl"
            >
              {/* Darkened Backdrop Blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleCloseModal}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        تعديل تصنيفات المحتوى
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400">
                        اختر تصنيفاً واحداً أو عدة تصنيفات معتمدة
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      {selectedList.length} محدد
                    </span>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content Title Banner if available */}
                {itemTitle && (
                  <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
                      📄 المحتوى: <strong className="text-slate-800 dark:text-slate-200 font-black">{itemTitle}</strong>
                    </span>
                  </div>
                )}

                {/* Toast message if any */}
                {toastMessage && (
                  <div className="mx-5 mt-3 flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{toastMessage}</span>
                  </div>
                )}

                {/* Body Content with Search & Multi-Select */}
                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  
                  {/* Selected Tags Chips Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                        التصنيفات المحددة ({selectedList.length}):
                      </span>
                      {selectedList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedList([])}
                          className="text-[11px] text-red-500 hover:text-red-600 hover:underline font-bold transition-colors"
                        >
                          مسح الكل
                        </button>
                      )}
                    </div>

                    {selectedList.length === 0 ? (
                      <div className="p-3 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                        لم يتم اختيار أي تصنيف بعد، يرجى النقر على التصنيفات بالأسفل لتحديدها
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 max-h-28 overflow-y-auto custom-scrollbar">
                        {selectedList.map((catName) => {
                          const catColor = getCategoryColor(catName);
                          return (
                            <motion.span
                              layout
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              key={catName}
                              style={{
                                backgroundColor: `${catColor}18`,
                                borderColor: `${catColor}60`,
                                color: catColor
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-2xs"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: catColor }}
                              />
                              <span>{catName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(catName)}
                                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                                title={`إزالة ${catName}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Search Bar & Filter Tabs */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم أو اكتب لإضافة تصنيف جديد..."
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-2xl pr-10 pl-8 py-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute left-3 top-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setFilterTab("all")}
                          className={`px-3 py-1 rounded-lg font-black transition-all ${
                            filterTab === "all"
                              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          كافة التصنيفات ({allAvailableCategories.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterTab("selected")}
                          className={`px-3 py-1 rounded-lg font-black transition-all ${
                            filterTab === "selected"
                              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          المحددة فقط ({selectedList.length})
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 font-bold">
                        {filteredCategories.length} نتيجة
                      </span>
                    </div>
                  </div>

                  {/* Quick Add Button if search text not found */}
                  {searchQuery.trim() && !exactMatchExists && allowAddNew && (
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      disabled={isAddingNew}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/30 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>إضافة وتحديد تصنيف جديد باسم: <strong>"{searchQuery.trim()}"</strong></span>
                      </div>
                      {isAddingNew && <Loader2 className="w-4 h-4 animate-spin" />}
                    </button>
                  )}

                  {/* Available Categories Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                    {filteredCategories.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-xs text-slate-400 font-bold">
                        لا توجد تصنيفات مطابقة للبحث
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const isSelected = selectedList.includes(c.name);
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => handleToggleCategory(c.name)}
                            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border text-right cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/40 text-slate-900 dark:text-white font-black shadow-xs"
                                : "bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                              )}
                              
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: c.color }}
                              />
                              
                              <span className="truncate">{highlightMatch(c.name, searchQuery)}</span>
                            </div>

                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md text-white shadow-2xs shrink-0 mr-2"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.name}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="px-5 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 font-bold">
                    {selectedList.length === 0 ? (
                      <span className="text-amber-500 font-black">اختر تصنيفاً واحداً على الأقل</span>
                    ) : (
                      <span>سيتم اعتماد {selectedList.length} تصنيف لهذا المحتوى</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isLoading || selectedList.length === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>حفظ التعديل</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
