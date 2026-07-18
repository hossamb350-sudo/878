import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { Tag, X, Plus, Edit, Trash2, PlusCircle, Save } from "lucide-react";

export const AdminCategoryManager: React.FC = () => {
  const [savedCats, setSavedCats] = useState<{name: string, color: string}[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#34619B");
  const [editingCat, setEditingCat] = useState<{oldName: string, newName: string, color: string} | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "newsMetadata", "categories"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const list = (data.items || data.list || []).map((c: any) => 
          typeof c === 'string' ? { name: c, color: "#34619B" } : c
        );
        setSavedCats(list);
      }
    });
    return () => unsub();
  }, []);

  const addNewCategory = async () => {
    if (!newCatName.trim()) return;
    if (savedCats.some(c => c.name === newCatName.trim())) return alert("هذا التصنيف موجود بالفعل!");
    
    try {
      const newItem = { name: newCatName.trim(), color: newCatColor };
      const newList = [...savedCats, newItem];
      await setDoc(doc(db, "newsMetadata", "categories"), { items: newList });
      setNewCatName("");
      setNewCatColor("#34619B");
    } catch (e) {
      alert("خطأ في إضافة التصنيف");
    }
  };

  const updateCategory = async () => {
    if (!editingCat) return;
    const newList = savedCats.map(c => 
      c.name === editingCat.oldName ? { name: editingCat.newName, color: editingCat.color } : c
    );
    try {
      await setDoc(doc(db, "newsMetadata", "categories"), { items: newList });
      setEditingCat(null);
    } catch (e) {
      alert("خطأ في تحديث التصنيف");
    }
  };

  const deleteCategory = async (name: string) => {
    if (["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(name)) {
      return alert("هذا التصنيف أساسي ولا يمكن حذفه");
    }
    if (!confirm(`هل أنت متأكد من حذف تصنيف "${name}"؟`)) return;
    const newList = savedCats.filter(c => c.name !== name);
    try {
      await setDoc(doc(db, "newsMetadata", "categories"), { items: newList });
    } catch (e) {
      alert("خطأ في حذف التصنيف");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Tag className="w-8 h-8" />
            إدارة تصنيفات الأخبار
          </h2>
          <p className="text-purple-100 font-medium text-lg opacity-90 mt-2">تخصيص الألوان والأسماء لتصنيفات الأخبار في المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8" dir="rtl">
        {/* Add New Section */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm sticky top-8">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-600" />
              إضافة تصنيف جديد
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">اسم التصنيف</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 font-bold dark:text-white focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  placeholder=""
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">لون التصنيف</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={newCatColor} 
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-gray-50 dark:bg-gray-900 p-1 shadow-inner"
                  />
                  <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 font-mono text-xs text-gray-500 uppercase flex items-center justify-center">
                    {newCatColor}
                  </div>
                </div>
              </div>

              <button 
                onClick={addNewCategory}
                disabled={!newCatName.trim()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                حفظ التصنيف
              </button>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              التصنيفات الحالية ({savedCats.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedCats.map(c => (
                <div key={c.name} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 group hover:border-purple-500/30 transition-all">
                  {editingCat?.oldName === c.name ? (
                    <div className="space-y-4 animate-fade-in">
                       <input 
                        autoFocus
                        className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-500 font-bold dark:text-white outline-none"
                        value={editingCat.newName}
                        disabled={["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(c.name)}
                        onChange={e => setEditingCat({...editingCat, newName: e.target.value})}
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={editingCat.color} 
                          onChange={e => setEditingCat({...editingCat, color: e.target.value})}
                          className="w-10 h-10 rounded-xl cursor-pointer border-none bg-white dark:bg-gray-800 p-1 shadow-sm"
                        />
                        <div className="flex-1 flex justify-end gap-2">
                          <button onClick={() => setEditingCat(null)} className="px-4 py-2 text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">إلغاء</button>
                          <button onClick={updateCategory} className="px-5 py-2 text-xs font-black bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1">
                            <Save className="w-3.5 h-3.5" />
                            حفظ
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl shadow-inner border-2 border-white dark:border-gray-800" style={{ backgroundColor: c.color || "#34619B" }}></div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingCat({oldName: c.name, newName: c.name, color: c.color || "#34619B"})}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(c.name) && (
                          <button 
                            onClick={() => deleteCategory(c.name)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
