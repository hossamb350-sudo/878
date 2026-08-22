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
  where,
  writeBatch
} from "firebase/firestore";
import { Article, Author, Category } from "../types";
import { CategoryService } from "../services/CategoryService";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { QuickCategorySelector } from "./QuickCategorySelector";
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
  ChevronLeft,
  Save, 
  X,
  CheckCircle,
  AlertTriangle,
  Star,
  Type,
  Bold,
  Italic,
  Highlighter,
  CornerDownLeft,
  Search,
  PlusCircle,
  ArrowRight,
  Layers,
  Sparkles,
  Clock,
  Tag,
  FileText,
  Settings,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminArticles({ isAdmin }: { isAdmin?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<"list" | "wizard" | "authors">("list");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Form State for Wizard
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [authorId, setAuthorId] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorPhoto, setAuthorPhoto] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [hijriDate, setHijriDate] = useState("");
  const [gregorianDate, setGregorianDate] = useState("");
  const [views, setViews] = useState<number>(0);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Author Management Form State
  const [authorEditingId, setAuthorEditingId] = useState<string | null>(null);
  const [editingAuthorName, setEditingAuthorName] = useState("");
  const [editingAuthorPhoto, setEditingAuthorPhoto] = useState("");
  const [editingAuthorBio, setEditingAuthorBio] = useState("");
  const [savingAuthor, setSavingAuthor] = useState(false);

  // Custom Category State
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [customCatName, setCustomCatName] = useState("");

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

  // Auto-generate today's dates when starting a new article
  useEffect(() => {
    if ((mode === "wizard" && !editingId && !hijriDate)) {
      const d = new Date();
      setGregorianDate(new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(d));
      try {
        setHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d));
      } catch (e) {
        setHijriDate("");
      }
    }
  }, [mode, editingId]);

  // When author selection changes in wizard
  const handleSelectAuthor = (id: string) => {
    setAuthorId(id);
    const found = authors.find(a => a.id === id);
    if (found) {
      setAuthorName(found.name);
      setAuthorPhoto(found.photoURL || "");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setCategoriesList([]);
    setImageUrl("");
    setAdditionalImages([]);
    setAuthorId("");
    setAuthorName("");
    setAuthorPhoto("");
    setIsFeatured(false);
    setHijriDate("");
    setGregorianDate("");
    setViews(0);
    setTags([]);
    setTagInput("");
    setEditingId(null);
    setCurrentStep(1);
  };

  const startNewWizard = () => {
    resetForm();
    setMode("wizard");
  };

  const handleEditArticle = (art: Article) => {
    setEditingId(art.id);
    setTitle(art.title || "");
    setContent(art.content || "");
    setCategory(art.category || "");
    setCategoriesList(art.categories || (art.category ? [art.category] : []));
    setImageUrl(art.imageUrl || "");
    setAdditionalImages(art.additionalImages || []);
    setAuthorId(art.authorId || "");
    setAuthorName(art.authorName || "");
    setAuthorPhoto(art.authorPhoto || "");
    setIsFeatured(art.isFeatured || false);
    setHijriDate(art.hijriDate || "");
    setGregorianDate(art.gregorianDate || "");
    setViews(art.views || 0);
    setMode("wizard");
    setCurrentStep(1);
  };

  const handleSaveArticle = async () => {
    if (!title.trim()) {
      alert("يرجى إدخال عنوان المقال");
      setCurrentStep(1);
      return;
    }
    if (!content.trim()) {
      alert("يرجى كتابة محتوى المقال");
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    try {
      let finalAuthorId = authorId;
      let finalAuthorName = authorName.trim();
      let finalAuthorPhoto = authorPhoto.trim();

      // If user typed a new author name not in existing authors list, create author doc automatically
      if (finalAuthorName && (!finalAuthorId || !authors.some(a => a.id === finalAuthorId))) {
        const newAuthorRef = await addDoc(collection(db, "authors"), {
          name: finalAuthorName,
          photoURL: finalAuthorPhoto,
          createdAt: Date.now()
        });
        finalAuthorId = newAuthorRef.id;
      }

      const finalCategories = categoriesList.length > 0 ? categoriesList : (category ? [category] : []);
      const primaryCategory = finalCategories[0] || "";

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: primaryCategory,
        categories: finalCategories,
        imageUrl: imageUrl.trim() || null,
        additionalImages: additionalImages.filter(img => img.trim() !== ""),
        authorId: finalAuthorId || null,
        authorName: finalAuthorName || "كاتب المنصة",
        authorPhoto: finalAuthorPhoto || null,
        isFeatured,
        hijriDate: hijriDate.trim(),
        gregorianDate: gregorianDate.trim(),
        views: Number(views) || 0,
        updatedAt: Date.now()
      };

      if (editingId) {
        await updateDoc(doc(db, "articles", editingId), payload);
      } else {
        await addDoc(collection(db, "articles"), {
          ...payload,
          createdAt: Date.now()
        });
      }

      setMode("list");
      resetForm();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ المقال، يرجى المحاولة مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "articles", id));
    } catch (e) {
      alert("حدث خطأ أثناء عملية الحذف");
    }
  };

  const toggleFeaturedArticle = async (art: Article) => {
    try {
      await updateDoc(doc(db, "articles", art.id), {
        isFeatured: !art.isFeatured
      });
    } catch (e) {
      alert("خطأ في تغيير حالة المقال المميز");
    }
  };

  // Quick Inline Category Update
  const handleQuickUpdateCategory = async (id: string, newCategory: string, allCategories: string[]) => {
    try {
      const docRef = doc(db, "articles", id);
      const finalCats = allCategories && allCategories.length > 0 ? allCategories : [newCategory];
      const updateData = {
        category: newCategory,
        categories: finalCats,
        updatedAt: Date.now()
      };
      await updateDoc(docRef, updateData);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updateData } : a));
    } catch (error) {
      console.error("Error updating article category:", error);
      throw error;
    }
  };

  // Author Management Functions with Realtime Article Sync
  const handleSaveAuthor = async () => {
    if (!editingAuthorName.trim()) return alert("يرجى إدخال اسم الكاتب");
    setSavingAuthor(true);
    try {
      if (authorEditingId) {
        // 1. Update Author doc
        await updateDoc(doc(db, "authors", authorEditingId), {
          name: editingAuthorName.trim(),
          photoURL: editingAuthorPhoto.trim() || null,
          bio: editingAuthorBio.trim() || null,
          updatedAt: Date.now()
        });

        // 2. Sync all articles associated with this authorId
        const qArt = query(collection(db, "articles"), where("authorId", "==", authorEditingId));
        const artSnap = await getDocs(qArt);
        if (!artSnap.empty) {
          const batch = writeBatch(db);
          artSnap.docs.forEach(d => {
            batch.update(d.ref, {
              authorName: editingAuthorName.trim(),
              authorPhoto: editingAuthorPhoto.trim() || null
            });
          });
          await batch.commit();
        }
      } else {
        // Create new author
        await addDoc(collection(db, "authors"), {
          name: editingAuthorName.trim(),
          photoURL: editingAuthorPhoto.trim() || null,
          bio: editingAuthorBio.trim() || null,
          createdAt: Date.now()
        });
      }

      setAuthorEditingId(null);
      setEditingAuthorName("");
      setEditingAuthorPhoto("");
      setEditingAuthorBio("");
    } catch (e) {
      console.error("Error saving author:", e);
      alert("خطأ في حفظ بيانات الكاتب ومزامنتها");
    } finally {
      setSavingAuthor(false);
    }
  };

  const handleDeleteAuthor = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكاتب؟ ستبقى المقالات الحالية مرتبطة باسم الكاتب")) return;
    try {
      await deleteDoc(doc(db, "authors", id));
    } catch (e) {
      alert("خطأ في حذف الكاتب");
    }
  };

  // Helper formatting for editor toolbar
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("article-content-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || "نص مخصص"}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  // Create Custom Category
  const handleAddCustomCategory = async () => {
    if (!customCatName.trim()) return;
    try {
      const newCatName = customCatName.trim();
      await CategoryService.saveCategory({ name: newCatName, color: "#3B82F6" });
      setCategory(newCatName);
      setCategoriesList(prev => {
        if (!prev.includes(newCatName)) {
          return [...prev, newCatName];
        }
        return prev;
      });
      setCustomCatName("");
      setShowAddCatInput(false);
    } catch (e) {
      alert("حدث خطأ في إضافة التصنيف");
    }
  };

  const handleToggleCategory = (catName: string) => {
    setCategoriesList(prev => {
      if (prev.includes(catName)) {
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  // Filtered articles list
  const filteredArticles = articles.filter(a => {
    const matchQuery = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || (a.authorName && a.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategoryFilter === "all" || a.category === selectedCategoryFilter;
    return matchQuery && matchCat;
  });

  if (loading) {
    return (
      <div className="p-12 text-center font-cairo font-bold text-slate-500">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        جاري تحميل قسم المقالات والكتاب...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo text-right" dir="rtl">
      {/* Top Navigation Controls - Without background card */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: قائمة المقالات */}
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "list"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <BookOpen className={`w-4 h-4 transition-transform duration-200 ${mode === "list" ? "scale-110" : "opacity-70"}`} />
            <span>قائمة المقالات</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black transition-colors ${
                mode === "list"
                  ? "bg-slate-950 text-amber-400"
                  : "bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300"
              }`}
            >
              {articles.length}
            </span>
          </button>

          {/* Tab 2: إضافة مقال جديد */}
          <button
            type="button"
            onClick={startNewWizard}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "wizard"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <PlusCircle className={`w-4 h-4 transition-transform duration-200 ${mode === "wizard" ? "scale-110" : "opacity-70"}`} />
            <span>إضافة مقال جديد</span>
          </button>

          {/* Tab 3: إدارة الكتاب */}
          <button
            type="button"
            onClick={() => setMode("authors")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "authors"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <Users className={`w-4 h-4 transition-transform duration-200 ${mode === "authors" ? "scale-110" : "opacity-70"}`} />
            <span>إدارة الكتاب</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black transition-colors ${
                mode === "authors"
                  ? "bg-slate-950 text-amber-400"
                  : "bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300"
              }`}
            >
              {authors.length}
            </span>
          </button>
        </div>
      </div>

      {/* MODE 1: LIST VIEW */}
      {mode === "list" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="البحث في المقالات وأسماء الكتاب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 shrink-0">التصنيف:</span>
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryFilter === "all"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    selectedCategoryFilter === cat.name
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Table Grid */}
          {filteredArticles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-500">لا توجد مقالات مطابقة</p>
              <button
                onClick={startNewWizard}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-600 transition-colors"
              >
                إنشاء مقال جديد الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {art.imageUrl ? (
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-900/5 dark:bg-slate-800">
                          <BookOpen className="w-10 h-10 opacity-30" />
                          <span className="text-xs font-bold mr-2 text-slate-400">بدون صورة غلاف</span>
                        </div>
                      )}

                      {/* Featured Badge */}
                      {art.isFeatured && (
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-white" />
                          مقال مميز
                        </span>
                      )}

                      {/* Quick Category Selector Badge */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <QuickCategorySelector
                          currentCategory={art.category}
                          currentCategories={art.categories}
                          itemTitle={art.title}
                          size="xs"
                          onUpdate={(newCat, allCats) => handleQuickUpdateCategory(art.id, newCat, allCats)}
                        />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {art.title}
                      </h3>

                      {/* Author Info */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        {art.authorPhoto ? (
                          <img
                            src={art.authorPhoto}
                            alt={art.authorName}
                            className="w-7 h-7 rounded-full object-cover border border-amber-500/30"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {art.authorName || "كاتب المنصة"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {art.hijriDate || art.gregorianDate || "اليوم"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleFeaturedArticle(art)}
                        className={`p-2 rounded-lg transition-colors ${
                          art.isFeatured
                            ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                            : "bg-slate-200/50 dark:bg-slate-700/50 text-slate-400 hover:text-amber-500"
                        }`}
                        title={art.isFeatured ? "إلغاء التمييز" : "تمييز المقال"}
                      >
                        <Star className={`w-4 h-4 ${art.isFeatured ? "fill-current" : ""}`} />
                      </button>

                      <button
                        onClick={() => handleEditArticle(art)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors"
                        title="تعديل المقال"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition-colors"
                        title="حذف المقال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: ARTICLE WIZARD (4 STEPS) */}
      {mode === "wizard" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-6">
          {/* Step Indicator Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{editingId ? "تعديل مقال حالي" : "معالج إنشاء مقال جديد"}</span>
              </h2>
              <button
                onClick={() => setMode("list")}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { num: 1, label: "المعلومات الأساسية", icon: FileText },
                { num: 2, label: "محتوى المقال", icon: Type },
                { num: 3, label: "الوسائط والصور", icon: ImageIcon },
                { num: 4, label: "النشر والإعدادات", icon: Settings },
              ].map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.num;
                const isDone = currentStep > step.num;

                return (
                  <button
                    key={step.num}
                    onClick={() => setCurrentStep(step.num as any)}
                    className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition-all text-right ${
                      isActive
                        ? "bg-amber-500 text-white shadow-md"
                        : isDone
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? "bg-white text-amber-600"
                          : isDone
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}
                    >
                      {step.num}
                    </div>
                    <span className="hidden sm:inline truncate">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 1: BASIC INFO */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Article Title */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  عنوان المقال الرئيسي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="أدخل عنواناً واضحاً ومعبراً للمقال..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              {/* Author Data Sync Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>بيانات الكاتب والمؤلف</span>
                  </label>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    مزامنة تلقائية مع قاعدة البيانات
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Author Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">اختر كاتب مسجل:</label>
                    <select
                      value={authorId}
                      onChange={(e) => handleSelectAuthor(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                    >
                      <option value="">-- كاتب جديد / إدخال يدوي --</option>
                      {authors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual Author Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">اسم الكاتب الظاهر:</label>
                    <input
                      type="text"
                      placeholder="أدخل اسم الكاتب..."
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Author Photo Upload */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <label className="text-[11px] font-bold text-slate-500">صورة الكاتب (اختياري):</label>
                  <ImageUpload
                    value={authorPhoto}
                    onChange={(url) => setAuthorPhoto(url)}
                  />
                </div>
              </div>

              {/* Category & Featured Topics Linking */}
              <CategoryMultiSelect
                title="تصنيفات المقال"
                accentColor="amber"
                selectedCategories={categoriesList}
                onChange={(newList) => {
                  setCategoriesList(newList);
                  if (newList.length > 0) {
                    setCategory(newList[0]);
                  } else {
                    setCategory("");
                  }
                }}
                presetSuggestions={[]}
                helperText="ملاحظة: اختيار التصنيفات يربط المقال تلقائياً بأبرز المواضيع والمصنفات المطابقة لتسميات التصانيف المحددة."
              />

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    التاريخ الهجري
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 15 صفر 1448 هـ"
                    value={hijriDate}
                    onChange={(e) => setHijriDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    التاريخ الميلادي
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 15 أغسطس 2026"
                    value={gregorianDate}
                    onChange={(e) => setGregorianDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CONTENT EDITOR */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  محتوى المقال والتحرير النصي <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <span>الكلمات: {content.trim() ? content.trim().split(/\s+/).length : 0}</span>
                  <span>|</span>
                  <span>زمن القراءة: {Math.max(1, Math.ceil((content.trim().split(/\s+/).length || 1) / 200))} د</span>
                </div>
              </div>

              {/* Formatting Quick Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => insertFormatting("**", "**")}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                  title="عريض (Bold)"
                >
                  <Bold className="w-3.5 h-3.5" />
                  <span>عريض</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("*", "*")}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                  title="مائل (Italic)"
                >
                  <Italic className="w-3.5 h-3.5" />
                  <span>مائل</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("### ")}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                  title="عنوان رئيسي (H3)"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>عنوان فرعي</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("<mark>", "</mark>")}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                  title="تظليل النص"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>تظليل</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("> ")}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                  title="اقتباس"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span>اقتباس</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("\n<br/>\n")}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                  title="سطر جديد"
                >
                  <span>سطر جديد</span>
                </button>
              </div>

              <textarea
                id="article-content-editor"
                rows={12}
                placeholder="اكتب محتوى المقال الكامل هنا..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 font-cairo resize-y min-h-[300px]"
              />
            </motion.div>
          )}

          {/* STEP 3: MEDIA & MULTIPLE IMAGES */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Main Cover Image */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    صورة الغلاف الرئيسية للمقال (اختياري)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    إذا تركت فارغة، سينشر المقال بدون إطار أو عنصر صورة فارغ
                  </span>
                </div>
                <ImageUpload
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                />
              </div>

              {/* Additional Gallery Images */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    معرض الصور الإضافية للمقال (دعم أكثر من صورة)
                  </label>
                  <button
                    onClick={() => setAdditionalImages([...additionalImages, ""])}
                    className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة حقل صورة جديد</span>
                  </button>
                </div>

                {additionalImages.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">
                    لم تقم بإضافة صور إضافية. يمكنك رفع صورة الغلاف أو إضافة صور للمعرض هنا.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {additionalImages.map((img, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <ImageUpload
                            value={img}
                            onChange={(url) => {
                              const updated = [...additionalImages];
                              updated[idx] = url;
                              setAdditionalImages(updated);
                            }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            setAdditionalImages(additionalImages.filter((_, i) => i !== idx));
                          }}
                          className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          title="حذف هذه الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: SETTINGS & PUBLISH */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Featured Article Toggle */}
              <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">تمييز المقال</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    عرض المقال في الشريحة الرئيسية للمقالات المميزة بأعلى الصفحة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    isFeatured ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isFeatured ? "translate-x-[-24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Views Counter Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  عدد المشاهدات الابتدائي (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  value={views}
                  onChange={(e) => setViews(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              {/* Summary Overview */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ملخص بيانات المقال قبل النشر:</h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside font-medium">
                  <li>العنوان: <span className="font-bold">{title || "غير محدد"}</span></li>
                  <li>الكاتب: <span className="font-bold">{authorName || "غير محدد"}</span></li>
                  <li>التصنيف: <span className="font-bold">{category || "بدون تصنيف"}</span></li>
                  <li>الصور: <span className="font-bold">{imageUrl ? "صورة غلاف موجودة" : "بدون صورة غلاف"} + ({additionalImages.filter(Boolean).length} صورة معرض)</span></li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as any)}
              disabled={currentStep === 1}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <div className="flex items-center gap-2">
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1) as any)}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSaveArticle}
                  disabled={saving}
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "جاري الحفظ والرفع..." : "حفظ ونشر المقال"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: AUTHOR MANAGER WITH REALTIME ARTICLE SYNC */}
      {mode === "authors" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>إدارة قائمة الكتاب والمؤلفين</span>
            </h2>
            <button
              onClick={() => {
                setAuthorEditingId(null);
                setEditingAuthorName("");
                setEditingAuthorPhoto("");
                setEditingAuthorBio("");
              }}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كاتب جديد</span>
            </button>
          </div>

          {/* Author Form Modal / Panel */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
              {authorEditingId ? "تعديل بيانات الكاتب (سيتم المزامنة تلقائياً مع مقالاته)" : "بيانات الكاتب الجديد"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">اسم الكاتب كامل:</label>
                <input
                  type="text"
                  placeholder="مثال: د. هيثم اليوسفي"
                  value={editingAuthorName}
                  onChange={(e) => setEditingAuthorName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">نبذة مختصرة عن الكاتب (اختياري):</label>
                <input
                  type="text"
                  placeholder="محلل سياسي وباحث في الشؤون اليمنية..."
                  value={editingAuthorBio}
                  onChange={(e) => setEditingAuthorBio(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500">صورة الكاتب الشخصية:</label>
              <ImageUpload
                value={editingAuthorPhoto}
                onChange={(url) => setEditingAuthorPhoto(url)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {authorEditingId && (
                <button
                  onClick={() => {
                    setAuthorEditingId(null);
                    setEditingAuthorName("");
                    setEditingAuthorPhoto("");
                    setEditingAuthorBio("");
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>
              )}
              <button
                onClick={handleSaveAuthor}
                disabled={savingAuthor}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                {savingAuthor ? "جاري المزامنة والحفظ..." : "حفظ بيانات الكاتب"}
              </button>
            </div>
          </div>

          {/* Authors List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {authors.map((a) => {
              const authorArticlesCount = articles.filter(art => art.authorId === a.id || art.authorName === a.name).length;

              return (
                <div
                  key={a.id}
                  className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {a.photoURL ? (
                      <img
                        src={a.photoURL}
                        alt={a.name}
                        className="w-12 h-12 rounded-full object-cover border border-amber-500/30"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center font-bold">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{a.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{authorArticlesCount} مقال نشر</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAuthorEditingId(a.id);
                        setEditingAuthorName(a.name);
                        setEditingAuthorPhoto(a.photoURL || "");
                        setEditingAuthorBio(a.bio || "");
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="تعديل الكاتب"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAuthor(a.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="حذف الكاتب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
