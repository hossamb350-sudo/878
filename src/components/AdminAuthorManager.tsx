import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { User, X, Plus, Edit, Trash2, PlusCircle, Save } from "lucide-react";

export const AdminAuthorManager: React.FC = () => {
  const [savedAuthors, setSavedAuthors] = useState<string[]>([]);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [editingAuthor, setEditingAuthor] = useState<{oldName: string, newName: string} | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "newsMetadata", "authors"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSavedAuthors(data.list || []);
      }
    });
    return () => unsub();
  }, []);

  const addNewAuthor = async () => {
    if (!newAuthorName.trim()) return;
    if (savedAuthors.includes(newAuthorName.trim())) return alert("هذا المصدر موجود بالفعل!");
    
    try {
      const newList = [...savedAuthors, newAuthorName.trim()];
      await setDoc(doc(db, "newsMetadata", "authors"), { list: newList });
      setNewAuthorName("");
    } catch (e) {
      alert("خطأ في إضافة المصدر");
    }
  };

  const updateAuthor = async () => {
    if (!editingAuthor) return;
    const newList = savedAuthors.map(a => 
      a === editingAuthor.oldName ? editingAuthor.newName : a
    );
    try {
      await setDoc(doc(db, "newsMetadata", "authors"), { list: newList });
      setEditingAuthor(null);
    } catch (e) {
      alert("خطأ في تحديث المصدر");
    }
  };

  const deleteAuthor = async (name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المصدر "${name}"؟`)) return;
    const newList = savedAuthors.filter(a => a !== name);
    try {
      await setDoc(doc(db, "newsMetadata", "authors"), { list: newList });
    } catch (e) {
      alert("خطأ في حذف المصدر");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="relative z-10 text-right">
          <h2 className="text-3xl font-black flex items-center justify-end gap-3">
            <span>إدارة المحررين والمصادر</span>
            <User className="w-8 h-8" />
          </h2>
          <p className="text-blue-100 font-medium text-lg opacity-90 mt-2">إضافة وتعديل أسماء المحررين ومصادر الأخبار المعتمدة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8" dir="rtl">
        {/* Add New Section */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm sticky top-8">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-600" />
              إضافة مصدر جديد
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider text-right">اسم المحرر / المصدر</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-right"
                  placeholder=""
                  value={newAuthorName}
                  onChange={e => setNewAuthorName(e.target.value)}
                />
              </div>

              <button 
                onClick={addNewAuthor}
                disabled={!newAuthorName.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                حفظ المصدر
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-right">
              <User className="w-5 h-5 text-red-600" />
              المصادر الحالية ({savedAuthors.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedAuthors.map(a => (
                <div key={a} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 group hover:border-blue-500/30 transition-all text-right">
                  {editingAuthor?.oldName === a ? (
                    <div className="space-y-4 animate-fade-in">
                       <input 
                        autoFocus
                        className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-500 font-bold dark:text-white outline-none text-right"
                        value={editingAuthor.newName}
                        onChange={e => setEditingAuthor({...editingAuthor, newName: e.target.value})}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingAuthor(null)} className="px-4 py-2 text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">إلغاء</button>
                        <button onClick={updateAuthor} className="px-5 py-2 text-xs font-black bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-1">
                          <Save className="w-3.5 h-3.5" />
                          حفظ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setEditingAuthor({oldName: a, newName: a})}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteAuthor(a)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{a}</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {savedAuthors.length === 0 && (
              <div className="text-center py-12 text-gray-400 font-bold">لا توجد مصادر مضافة حالياً</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
