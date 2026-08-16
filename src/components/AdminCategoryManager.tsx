import React, { useState, useEffect } from "react";
import { Category } from "../types";
import { CategoryService, PRESET_CATEGORY_COLORS } from "../services/CategoryService";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Search, 
  X, 
  Check, 
  Palette, 
  Layers, 
  Sparkles,
  Info,
  RefreshCw,
  RotateCcw,
  Scissors
} from "lucide-react";

export const AdminCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingBulk, setProcessingBulk] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formDescription, setFormDescription] = useState("");
  const [formOrder, setFormOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = CategoryService.subscribeCategories((list) => {
      setCategories(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormColor(PRESET_CATEGORY_COLORS[Math.floor(Math.random() * PRESET_CATEGORY_COLORS.length)]);
    setFormDescription("");
    setFormOrder(categories.length);
    setErrorMessage("");
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.color || "#3B82F6");
    setFormDescription(cat.description || "");
    setFormOrder(cat.order ?? 0);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage("يرجى إدخال اسم التصنيف");
      return;
    }

    // Check duplicate name
    const isDuplicate = categories.some(
      c => c.name.trim().toLowerCase() === formName.trim().toLowerCase() && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      setErrorMessage("يوجد تصنيف آخر بنفس هذا الاسم بالفعل!");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      await CategoryService.saveCategory({
        id: editingCategory?.id,
        name: formName.trim(),
        color: formColor,
        description: formDescription.trim(),
        order: Number(formOrder) || 0
      });
      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ أثناء حفظ التصنيف");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`هل أنت متأكد من حذف تصنيف "${cat.name}"؟\nسيؤدي هذا إلى إزالته من جميع قوائم التصنيفات بالمنصة.`)) {
      return;
    }

    setDeletingId(cat.id);
    try {
      await CategoryService.deleteCategory(cat.id);
    } catch (err) {
      alert("فشل في حذف التصنيف");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`تحذير هام جدًا!\nهل أنت متأكد من حذف جميع التصنيفات الحالية (${categories.length} تصنيف) بالكامل من المنصة؟\nهذا الإجراء لا يمكن التراجع عنه!`)) {
      return;
    }

    setProcessingBulk(true);
    setBulkNotice("جاري حذف جميع التصنيفات من قاعدة البيانات...");
    try {
      const count = await CategoryService.deleteAllCategories();
      setBulkNotice(`تم حذف جميع التصنيفات بنجاح (عدد التصنيفات المحذوفة: ${count}).`);
      setTimeout(() => setBulkNotice(null), 5000);
    } catch (e: any) {
      alert("حدث خطأ أثناء حذف جميع التصنيفات: " + e.message);
    } finally {
      setProcessingBulk(false);
    }
  };

  const handlePurgeAndUnlinkAll = async () => {
    if (!confirm(`إجراء حاسم وطهيّر كامل!\nهل أنت متأكد من حذف جميع التصنيفات القديمة نهائيًا، وإلغاء ارتباط كافة الأخبار والفيديوهات والمقالات والمواضيع بها؟\n\nسيدخل النظام بعد هذا الإجراء في حالة جاهزية تامة لتصنيفات جديدة دون أي أثر للتصنيفات القديمة.`)) {
      return;
    }

    setProcessingBulk(true);
    setBulkNotice("جاري حذف التصنيفات القديمة وإلغاء ارتباط كافة الأخبار والفيديوهات والمقالات...");
    try {
      const res = await CategoryService.purgeAllOldCategoriesAndUnlinkContent();
      setBulkNotice(`تمت عملية التطهير بنجاح! تم حذف ${res.deletedCategories} تصنيف قديم، وتم إلغاء الارتباط من ${res.unlinkedContentItems} عنصر محتوى في كافة الأقسام.`);
      setTimeout(() => setBulkNotice(null), 8000);
    } catch (e: any) {
      alert("حدث خطأ أثناء عملية التطهير: " + e.message);
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleDeduplicate = async () => {
    setProcessingBulk(true);
    setBulkNotice("جاري فحص وإزالة التصنيفات المكررة...");
    try {
      const res = await CategoryService.deduplicateCategories();
      if (res.totalRemoved === 0) {
        setBulkNotice("لم يتم العثور على أي تصنيفات مكررة! جميع التصنيفات الحالية فريدة.");
      } else {
        setBulkNotice(`تم تنظيف المنصة بنجاح: تم حذف ${res.totalRemoved} تصنيف مكرر، ويتبقى الآن ${res.uniqueCount} تصنيف فريد.`);
      }
      setTimeout(() => setBulkNotice(null), 6000);
    } catch (e: any) {
      alert("حدث خطأ أثناء تصفية التصنيفات المكررة: " + e.message);
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleResetDefault = async () => {
    if (!confirm("هل تريد إزالة كافة التصنيفات الحالية وإعادة الضبط إلى الـ 10 تصنيفات الافتراضية المعتمدة فقط؟")) {
      return;
    }

    setProcessingBulk(true);
    setBulkNotice("جاري إعادة الضبط للتصنيفات الافتراضية...");
    try {
      await CategoryService.resetToDefaultCategories();
      setBulkNotice("تمت إعادة ضبط التصنيفات إلى القائمة الافتراضية المعتمدة بنجاح.");
      setTimeout(() => setBulkNotice(null), 5000);
    } catch (e: any) {
      alert("حدث خطأ أثناء إعادة الضبط: " + e.message);
    } finally {
      setProcessingBulk(false);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const trimmedQuery = query.trim();
    const regex = new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/80 text-black dark:text-white px-0.5 rounded font-black">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 text-white shadow-2xl shadow-purple-900/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-purple-500/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 select-none" dir="rtl">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="flex flex-col text-right">
              <h3 className="font-bold text-[13px] sm:text-[14px] text-white font-cairo leading-tight">إدارة التصنيفات الموحدة</h3>
              <p className="text-[10px] sm:text-[11px] text-purple-200 font-medium font-cairo">إنشاء وإدارة وتلوين تصنيفات الأخبار والفيديوهات والمقالات</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={handlePurgeAndUnlinkAll}
              disabled={processingBulk}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-40 active:scale-95"
              title="حذف التصنيفات القديمة نهائيًا وإلغاء ارتباط الأخبار والفيديوهات والمقالات بها"
            >
              <Trash2 className="w-4 h-4 text-white" />
              حذف وفك ارتباط الكل
            </button>

            <button
              onClick={handleDeduplicate}
              disabled={processingBulk || categories.length === 0}
              className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-2xl font-black text-xs transition-all flex items-center gap-2 disabled:opacity-40"
              title="إزالة التصنيفات المكررة وإبقاء نسخة واحدة فقط لكل تصنيف"
            >
              <Scissors className="w-4 h-4 text-amber-400" />
              تنظيف المكررات
            </button>

            <button
              onClick={handleResetDefault}
              disabled={processingBulk}
              className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 rounded-2xl font-black text-xs transition-all flex items-center gap-2 disabled:opacity-40"
              title="إعادة ضبط التصنيفات إلى الـ 10 تصنيفات الافتراضية المعتمدة"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" />
              ضبط افتراضي
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={processingBulk || categories.length === 0}
              className="px-4 py-3 bg-red-500/20 hover:bg-red-600/40 text-red-200 border border-red-500/40 rounded-2xl font-black text-xs transition-all flex items-center gap-2 disabled:opacity-40"
              title="حذف جميع التصنيفات الحالية دفعة واحدة"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              حذف الكل ({categories.length})
            </button>

            <button
              onClick={openAddModal}
              disabled={processingBulk}
              className="px-6 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2.5 active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              إضافة تصنيف
            </button>
          </div>
        </div>
      </div>

      {bulkNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-purple-900/90 border border-purple-500/50 text-white rounded-2xl text-xs font-black flex items-center justify-between gap-3 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-4 h-4 text-amber-400 ${processingBulk ? "animate-spin" : ""}`} />
            <span>{bulkNotice}</span>
          </div>
          {!processingBulk && (
            <button onClick={() => setBulkNotice(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </motion.div>
      )}

      {/* Control & Search Bar */}
      <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="بحث في التصنيفات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {searchQuery ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Search className="w-4 h-4 text-amber-500" />
              <span>النتائج المطابقة: <strong className="font-black text-amber-900 dark:text-amber-100">{filteredCategories.length}</strong> من {categories.length}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-700 dark:text-purple-300 text-xs font-bold">
              <Layers className="w-4 h-4" />
              <span>إجمالي التصنيفات: <strong className="font-black text-purple-900 dark:text-purple-100">{categories.length}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <Palette className="w-4 h-4" />
            <span>ألوان مخصصة نشطة</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-bold text-sm">جاري تحميل التصنيفات...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-700 text-center">
          <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">
            {searchQuery ? "لا توجد تصنيفات تطابق نتيجة البحث" : "لا توجد تصنيفات معرفة حتى الآن"}
          </h3>
          <p className="text-gray-500 text-xs font-bold max-w-md mx-auto mb-6">
            {searchQuery ? "جرّب البحث بكلمة مختلفة أو قم بإلغاء فلتر البحث." : "قم بإضافة التصنيف الأول ليكون متاحاً عبر جميع الأقسام في لوحة الإدارة."}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة تصنيف جديد
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredCategories.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800/90 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Accent Bar matching category color */}
                <div 
                  className="absolute top-0 right-0 left-0 h-1.5 transition-all"
                  style={{ backgroundColor: cat.color || "#3B82F6" }}
                ></div>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      {/* Color Circle */}
                      <div 
                        className="w-10 h-10 rounded-2xl shadow-inner flex items-center justify-center shrink-0 border border-white/20 dark:border-gray-700/50"
                        style={{ backgroundColor: cat.color || "#3B82F6" }}
                      >
                        <Tag className="w-4 h-4 text-white" />
                      </div>

                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {highlightMatch(cat.name, searchQuery)}
                        </h4>
                        <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          {cat.color || "#3B82F6"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                        title="تعديل التصنيف"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-50"
                        title="حذف التصنيف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {cat.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold line-clamp-2 mb-4 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800">
                      {highlightMatch(cat.description, searchQuery)}
                    </p>
                  )}
                </div>

                {/* Badge Visual Preview */}
                <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">معاينة الشارة:</span>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-black text-white shadow-sm transition-all"
                      style={{ backgroundColor: cat.color || "#3B82F6" }}
                    >
                      {cat.name}
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-black border transition-all"
                      style={{ 
                        color: cat.color || "#3B82F6", 
                        borderColor: `${cat.color || "#3B82F6"}40`,
                        backgroundColor: `${cat.color || "#3B82F6"}10`
                      }}
                    >
                      {cat.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    {editingCategory ? "تعديل بيانات التصنيف" : "إضافة تصنيف جديد"}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    {editingCategory ? "تعديل اسم التصنيف أو لونه المخصص" : "إدخال اسم التصنيف واختيار لونه الموحد"}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Category Name */}
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  اسم التصنيف <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="مثلاً: أخبار عاجلة، تقارير، ثقافة..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold dark:text-white focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  لون التصنيف المخصص <span className="text-red-500">*</span>
                </label>
                
                {/* Color Swatches Grid */}
                <div className="mb-3">
                  <span className="text-[11px] font-bold text-gray-400 mb-2 block">ألوان جاهزة مقترحة:</span>
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_CATEGORY_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        className={`w-9 h-9 rounded-xl transition-all relative flex items-center justify-center shadow-sm ${
                          formColor.toLowerCase() === color.toLowerCase() 
                            ? "ring-4 ring-purple-500/30 scale-110 z-10" 
                            : "hover:scale-105 opacity-90"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {formColor.toLowerCase() === color.toLowerCase() && (
                          <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Picker & Hex Input */}
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <input 
                    type="color"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">رمز اللون Hex</span>
                    <input 
                      type="text"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="bg-transparent border-0 font-mono font-bold text-sm text-gray-800 dark:text-white uppercase outline-none p-0 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-xs font-black text-gray-400 block mb-2">المعاينة المباشرة لشارة التصنيف:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <span 
                    className="px-4 py-1.5 rounded-full text-xs font-black text-white shadow-md transition-all"
                    style={{ backgroundColor: formColor }}
                  >
                    {formName || "معاينة التصنيف"}
                  </span>

                  <span 
                    className="px-4 py-1.5 rounded-full text-xs font-black border transition-all"
                    style={{ 
                      color: formColor, 
                      borderColor: `${formColor}40`,
                      backgroundColor: `${formColor}10`
                    }}
                  >
                    {formName || "معاينة التصنيف"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  وصف التصنيف (اختياري)
                </label>
                <textarea 
                  rows={2}
                  placeholder="وصف مختصر للهدف من هذا التصنيف..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold dark:text-white focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-xs resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3.5 text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "جاري الحفظ..." : "حفظ التصنيف"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
