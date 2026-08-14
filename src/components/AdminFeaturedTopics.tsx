import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, GripVertical, Image as ImageIcon, Eye, EyeOff, Tag, Check } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { CategoryService } from "../services/CategoryService";
import { db } from "../firebase";
import { FeaturedTopic, Category } from "../types";
import { ImageUpload } from "./ImageUpload";
import { motion, Reorder } from "motion/react";

export function AdminFeaturedTopics() {
  const [topics, setTopics] = useState<FeaturedTopic[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<FeaturedTopic>>({});

  useEffect(() => {
    const unsubTopics = onSnapshot(collection(db, "featured_topics"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedTopic));
      setTopics(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });

    const unsubCats = CategoryService.subscribeCategories((list) => {
      setAvailableCategories(list);
    });

    return () => {
      unsubTopics();
      unsubCats();
    };
  }, []);

  const handleAddNew = () => {
    setEditingId("new");
    setFormData({
      title: "",
      imageUrl: "",
      categories: [],
      isVisible: true,
      order: topics.length,
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.title?.trim()) {
        alert("يرجى إدخال عنوان للموضوع");
        return;
      }
      if (!formData.imageUrl?.trim()) {
        alert("يرجى رفع أو تحديد صورة للموضوع");
        return;
      }

      if (editingId === "new") {
        const newId = `topic-${Date.now()}`;
        await setDoc(doc(db, "featured_topics", newId), {
          ...formData,
          createdAt: Date.now(),
        });
      } else if (editingId) {
        await updateDoc(doc(db, "featured_topics", editingId), {
          ...formData,
          updatedAt: Date.now(),
        });
      }
      setEditingId(null);
      setFormData({});
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الموضوع؟")) {
      await deleteDoc(doc(db, "featured_topics", id));
    }
  };

  const toggleVisibility = async (topic: FeaturedTopic) => {
    await updateDoc(doc(db, "featured_topics", topic.id), {
      isVisible: !topic.isVisible
    });
  };

  const handleReorder = async (newOrder: FeaturedTopic[]) => {
    setTopics(newOrder);
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].order !== i) {
        await updateDoc(doc(db, "featured_topics", newOrder[i].id), {
          order: i
        });
      }
    }
  };

  const toggleCategory = (catName: string) => {
    const currentCats = formData.categories || [];
    if (currentCats.includes(catName)) {
      setFormData({
        ...formData,
        categories: currentCats.filter(c => c !== catName)
      });
    } else {
      setFormData({
        ...formData,
        categories: [...currentCats, catName]
      });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold font-cairo">جاري التحميل...</div>;

  return (
    <div className="space-y-6 font-cairo" style={{ direction: "rtl" }}>
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">إدارة أبرز المواضيع</h3>
            <p className="text-[10px] sm:text-[11px] text-orange-500 font-medium font-cairo">إضافة وتعديل المواضيع البارزة وصورها المخصصة</p>
          </div>
        </div>
        {!editingId && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-md active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موضوع جديد</span>
          </button>
        )}
      </div>

      {editingId && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-md space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-black text-lg text-gray-900 dark:text-white">
              {editingId === "new" ? "إضافة موضوع بارز جديد" : "تعديل بيانات الموضوع"}
            </h3>
            <span className="text-xs text-gray-400 font-bold">
              {editingId === "new" ? "موضوع جديد" : `#${editingId}`}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-slate-300">
                عنوان الموضوع <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 text-sm font-bold bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white transition-all"
                placeholder="مثال: محافظة تعز، القدس، طوفان الأقصى..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-slate-300">
                التصنيفات المرتبطة
              </label>
              <input
                type="text"
                value={formData.categories?.join("، ") || ""}
                onChange={e => setFormData({ ...formData, categories: e.target.value.split("،").map(s => s.trim()).filter(Boolean) })}
                className="w-full px-4 py-3 text-sm font-bold bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white transition-all"
                placeholder="أدخل التصنيفات مفصولة بفاصلة (،) مثال: محليات، أخبار تعز"
              />
              <p className="text-xs text-gray-400 mt-1">
                تُستخدم هذه التصنيفات لتوجيه الزائر عند النقر إلى نتائج البحث المطابقة.
              </p>

              {/* Fast Selector Badges */}
              {availableCategories.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-2">
                    اختيار سريع من التصنيفات المتاحة:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(cat => {
                      const isSelected = formData.categories?.includes(cat.name);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-red-500 text-white shadow-sm"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Standard Image Upload Component */}
            <div className="pt-2">
              <ImageUpload
                label="صورة الموضوع (صورة مخصصة)"
                placeholder="اختر أو اسحب صورة مخصصة للموضوع هنا"
                value={formData.imageUrl || ""}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({});
              }}
              className="px-5 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الموضوع</span>
            </button>
          </div>
        </div>
      )}

      {!editingId && topics.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-slate-400 flex justify-between items-center">
            <span>اسحب وسجل لترتيب ترتيب ظهور المواضيع:</span>
            <span>الإجمالي: {topics.length} موضوع</span>
          </div>

          <Reorder.Group axis="y" values={topics} onReorder={handleReorder} className="divide-y divide-gray-100 dark:divide-slate-700">
            {topics.map((topic) => (
              <Reorder.Item
                key={topic.id}
                value={topic}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-move"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-900 shrink-0 border border-gray-200/50 dark:border-slate-700/50 shadow-inner">
                    {topic.imageUrl ? (
                      <img src={topic.imageUrl} alt={topic.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 m-4 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">{topic.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-red-500" />
                      <span>{topic.categories?.length ? topic.categories.join("، ") : "بدون تصنيف محدد"}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(topic)}
                    className={`p-2 rounded-xl transition-colors ${
                      topic.isVisible 
                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100" 
                        : "text-gray-400 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200"
                    }`}
                    title={topic.isVisible ? "ظاهر بالصفحة الرئيسية" : "مخفي"}
                  >
                    {topic.isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(topic.id);
                      setFormData(topic);
                    }}
                    className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-bold text-xs px-3"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}
      
      {!editingId && topics.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 font-bold">لا توجد مواضيع بارزة مضافة حتى الآن</p>
          <button
            onClick={handleAddNew}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول موضوع</span>
          </button>
        </div>
      )}
    </div>
  );
}

