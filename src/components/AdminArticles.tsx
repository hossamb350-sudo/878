import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  setDoc,
  getDoc
} from "firebase/firestore";
import { Article, Author, Category } from "../types";
import { CategoryService } from "../services/CategoryService";
import { ImageUpload } from "./ImageUpload";
import { 
  Calendar, 
  Eye,
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  User, 
  Image as ImageIcon, 
  ChevronRight, 
  Save, 
  X,
  LayoutGrid,
  CheckCircle,
  AlertTriangle,
  Star,
  StarOff,
  Type
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminArticles({ isAdmin }: { isAdmin?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<"list" | "add" | "edit" | "authors">("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [hijriDate, setHijriDate] = useState("");
  const [gregorianDate, setGregorianDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Author Form State
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorPhoto, setNewAuthorPhoto] = useState("");

  useEffect(() => {
    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
      setLoading(false);
    });

    const qAuthors = query(collection(db, "authors"), orderBy("name", "asc"));
    const unsubAuthors = onSnapshot(qAuthors, (snap) => {
      setAuthors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Author)));
    });

    const unsubCats = CategoryService.subscribeCategories((list) => {
      setCategories(list);
    });

    return () => {
      unsubArticles();
      unsubAuthors();
      unsubCats();
    };
  }, []);

  useEffect(() => {
    if (mode === "add" && !hijriDate) {
      const d = new Date();
      setGregorianDate(new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(d));
      try {
        setHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d));
      } catch (e) {
        setHijriDate("");
      }
    }
  }, [mode]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setImageUrl("");
    setAuthorId("");
    setIsFeatured(false);
    setHijriDate("");
    setGregorianDate("");
    setEditingId(null);
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setImageUrl(article.imageUrl || "");
    setAuthorId(article.authorId || "");
    setIsFeatured(article.isFeatured);
    setHijriDate(article.hijriDate);
    setGregorianDate(article.gregorianDate);
    setMode("edit");
  };

  const handleSave = async () => {
    if (!title || !content || !authorId) return alert("يرجى ملء جميع الحقول المطلوبة");
    setSaving(true);

    const selectedAuthor = authors.find(a => a.id === authorId);
    
    const payload = {
      title,
      content,
      category,
      imageUrl,
      authorId,
      authorName: selectedAuthor?.name || "",
      authorPhoto: selectedAuthor?.photoURL || "",
      isFeatured,
      hijriDate,
      gregorianDate,
      updatedAt: Date.now(),
      views: editingId ? articles.find(a => a.id === editingId)?.views || 0 : 0
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "articles", editingId), payload);
      } else {
        await addDoc(collection(db, "articles"), {
          ...payload,
          createdAt: Date.now(),
        });
      }
      setMode("list");
      resetForm();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return;
    try {
      await deleteDoc(doc(db, "articles", id));
    } catch (e) {
      alert("خطأ في الحذف");
    }
  };

  const toggleFeatured = async (article: Article) => {
    try {
      await updateDoc(doc(db, "articles", article.id), { isFeatured: !article.isFeatured });
    } catch (e) {
      alert("خطأ في التحديث");
    }
  };

  const handleAddAuthor = async () => {
    if (!newAuthorName) return;
    try {
      await addDoc(collection(db, "authors"), {
        name: newAuthorName,
        photoURL: newAuthorPhoto,
        createdAt: Date.now()
      });
      setNewAuthorName("");
      setNewAuthorPhoto("");
    } catch (e) {
      alert("خطأ في إضافة الكاتب");
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-amber-500/20">
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-white font-cairo leading-tight">إدارة المقالات</h3>
            <p className="text-[10px] sm:text-[11px] text-amber-100 font-medium font-cairo">إضافة وتعديل وحذف المقالات والتحكم في ظهورها</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setMode(mode === "authors" ? "list" : "authors")}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center gap-1.5 backdrop-blur-sm text-xs"
          >
            <User className="w-4 h-4" />
            {mode === "authors" ? "العودة للمقالات" : "إدارة الكتاب"}
          </button>
          <button 
            onClick={() => {
              if (mode === "add") setMode("list");
              else {
                resetForm();
                setMode("add");
              }
            }}
            className="px-6 py-3 bg-white text-amber-600 hover:bg-amber-50 rounded-2xl font-black shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            {mode === "add" ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {mode === "add" ? "إلغاء" : "إضافة مقال جديد"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "authors" ? (
          <motion.div 
            key="authors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
              <User className="w-6 h-6 text-amber-600" />
              إدارة كتاب المقالات
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
               <div className="space-y-4">
                  <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest">إضافة كاتب جديد</h4>
                  <div className="space-y-4">
                     <input 
                      placeholder="اسم الكاتب"
                      className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                      value={newAuthorName}
                      onChange={e => setNewAuthorName(e.target.value)}
                    />
                    <div className="space-y-2">
                       <label className="block text-xs font-black text-gray-500 mr-2">صورة الكاتب</label>
                       <ImageUpload label="صورة الكاتب" onChange={setNewAuthorPhoto} value={newAuthorPhoto} />
                    </div>
                    <button 
                      onClick={handleAddAuthor}
                      className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                    >
                      إضافة الكاتب
                    </button>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest">قائمة الكتاب ({authors.length})</h4>
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pl-2 custom-scrollbar">
                     {authors.map(author => (
                       <div key={author.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                             <img src={author.photoURL || "https://ui-avatars.com/api/?name=" + author.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="" />
                             <span className="font-bold">{author.name}</span>
                          </div>
                          <button 
                            onClick={async () => {
                              if(confirm("حذف الكاتب؟")) await deleteDoc(doc(db, "authors", author.id));
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (mode === "add" || mode === "edit") ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">عنوان المقال</label>
                    <input 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">التصنيف الموحد</label>
                      <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                      >
                        <option value="">اختر التصنيف</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">الكاتب</label>
                      <select 
                        value={authorId}
                        onChange={e => setAuthorId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="">اختر الكاتب</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">التاريخ الهجري</label>
                      <input 
                        value={hijriDate}
                        onChange={e => setHijriDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">التاريخ الميلادي</label>
                      <input 
                        value={gregorianDate}
                        onChange={e => setGregorianDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                     <button 
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isFeatured ? "bg-amber-500" : "bg-gray-300"}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFeatured ? "left-1" : "left-7"}`}></div>
                     </button>
                     <span className="font-black text-amber-900 dark:text-amber-200 text-sm">تمييز المقال ليظهر في الأعلى</span>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">صورة الغلاف</label>
                    <ImageUpload label="صورة المقال" onChange={setImageUrl} value={imageUrl} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">محتوى المقال (يدعم Markdown)</label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[300px] resize-none"
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-amber-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ ونشر المقال"}
              <Save className="w-6 h-6" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-4"
          >
            {articles.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 text-center space-y-4">
                 <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                 </div>
                 <p className="text-gray-400 font-bold">لا توجد مقالات مضافة حالياً</p>
                 <button onClick={() => setMode("add")} className="text-amber-500 font-black text-sm hover:underline">إضافة أول مقال الآن</button>
              </div>
            ) : (
              articles.map(article => (
                <div key={article.id} className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-full sm:w-40 aspect-video rounded-2xl overflow-hidden bg-gray-100 shrink-0 relative">
                         {article.imageUrl ? (
                           <img src={article.imageUrl} className="w-full h-full object-cover" alt="" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>
                         )}
                         {article.isFeatured && (
                           <div className="absolute top-2 right-2 bg-amber-500 p-1 rounded-lg text-white shadow-lg"><Star className="w-3 h-3 fill-current" /></div>
                         )}
                      </div>
                      
                      <div className="flex-1 text-right min-w-0">
                         <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">{article.category}</span>
                         </div>
                         <h4 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{article.title}</h4>
                         <div className="flex items-center justify-end gap-3 text-[10px] text-gray-400 font-bold">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.authorName}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.hijriDate} هـ</span>
                            <span className="flex items-center gap-1 text-taiz-sky"><Eye className="w-3 h-3 text-red-600" /> {article.views || 0}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 pr-4 border-r border-gray-100 dark:border-gray-700">
                         <button 
                          onClick={() => toggleFeatured(article)}
                          className={`p-3 rounded-2xl transition-all ${article.isFeatured ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500"}`}
                          title={article.isFeatured ? "إلغاء التمييز" : "تمييز المقال"}
                         >
                            {article.isFeatured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                         </button>
                         <button 
                          onClick={() => handleEdit(article)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all"
                         >
                            <Edit className="w-5 h-5" />
                         </button>
                         <button 
                          onClick={() => handleDelete(article.id)}
                          className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
