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
  orderBy 
} from "firebase/firestore";
import { VideoItem, Category } from "../types";
import { CategoryService } from "../services/CategoryService";
import { SyncService } from "../services/SyncService";
import { ImageUpload } from "./ImageUpload";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { QuickCategorySelector } from "./QuickCategorySelector";
import { 
  Calendar, 
  Eye,
  Plus, 
  Edit, 
  Trash2, 
  Video, 
  Film,
  Play,
  Image as ImageIcon, 
  ChevronRight, 
  ChevronLeft,
  X,
  CheckCircle,
  Type,
  Bold,
  Italic,
  Highlighter,
  CornerDownLeft,
  Search,
  PlusCircle,
  Sparkles,
  Clock,
  Tag,
  FileText,
  Settings,
  LayoutGrid,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminVideos({ isAdmin }: { isAdmin?: boolean }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<"list" | "wizard">("list");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewModalVideo, setPreviewModalVideo] = useState<VideoItem | null>(null);

  // Form State for Video Wizard
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [views, setViews] = useState<number>(0);
  const [hijriDate, setHijriDate] = useState("");
  const [gregorianDate, setGregorianDate] = useState("");
  const [duration, setDuration] = useState("");
  const [showInSlider, setShowInSlider] = useState(false);
  const [selectedDatePicker, setSelectedDatePicker] = useState("");

  const handleDatePickerChange = (dateStr: string) => {
    setSelectedDatePicker(dateStr);
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) {
        const greg = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        setGregorianDate(greg);
        try {
          const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
          setHijriDate(hijri);
        } catch (e) {
          console.warn("Hijri conversion error", e);
        }
      }
    }
  };

  // Custom Category State
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [customCatName, setCustomCatName] = useState("");

  // Realtime subscriptions
  useEffect(() => {
    const qVideos = query(collection(db, "videos"));
    const unsubVideos = onSnapshot(
      qVideos,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as VideoItem)
        );
        data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setVideos(data);
        setLoading(false);
      },
      (error) => {
        console.warn("Error fetching admin videos:", error);
        setLoading(false);
      }
    );

    const unsubCats = CategoryService.subscribeCategories((list) => {
      setCategories(list);
    });

    return () => {
      unsubVideos();
      unsubCats();
    };
  }, []);

  // Auto-generate dates for new video
  useEffect(() => {
    if (mode === "wizard" && !editingId && !hijriDate) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDatePicker(`${yyyy}-${mm}-${dd}`);
      setGregorianDate(new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(d));
      try {
        setHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d));
      } catch (e) {
        setHijriDate("");
      }
    }
  }, [mode, editingId, hijriDate]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrl("");
    setThumbnailUrl("");
    setCategory("");
    setCategoriesList([]);
    setViews(0);
    setHijriDate("");
    setGregorianDate("");
    setDuration("");
    setShowInSlider(false);
    setSelectedDatePicker("");
    setEditingId(null);
    setCurrentStep(1);
  };

  const startNewWizard = () => {
    resetForm();
    setMode("wizard");
  };

  const handleEditVideo = (v: VideoItem) => {
    setEditingId(v.id);
    setTitle(v.title || "");
    setDescription(v.description || "");
    setUrl(v.url || "");
    setThumbnailUrl(v.thumbnailUrl || "");
    setCategory(v.category || "");
    setCategoriesList(v.categories || (v.category ? [v.category] : []));
    setViews(v.views || 0);
    setHijriDate(v.hijriDate || "");
    setGregorianDate(v.gregorianDate || "");
    setDuration(v.duration || "");
    setShowInSlider(!!v.showInSlider || !!v.isFeatured || !!v.isPinned);
    setMode("wizard");
    setCurrentStep(1);
  };

  // Helper to convert embed URL
  const getEmbedUrl = (rawUrl: string, autoPlay: boolean = false) => {
    if (!rawUrl) return "";
    let vidId = "";
    if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = rawUrl.match(regExp);
      if (match && match[2].length === 11) {
        vidId = match[2];
        return `https://www.youtube.com/embed/${vidId}?rel=0&enablejsapi=1&autoplay=${autoPlay ? 1 : 0}`;
      }
    }
    if (rawUrl.includes("/w/") || rawUrl.includes("/videos/watch/")) {
      return rawUrl.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
    }
    return rawUrl;
  };

  // Auto extract YouTube thumbnail if possible
  const handleAutoExtractYouTubeThumb = () => {
    if (!url) return;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      alert("الرابط ليس من يوتيوب، يرجى رفع صورة الغلاف يدوياً");
    }
  };

  const handleSaveVideo = async () => {
    if (!title.trim()) {
      alert("يرجى إدخال عنوان الفيديو / التقرير المرئي");
      setCurrentStep(1);
      return;
    }
    if (!url.trim()) {
      alert("يرجى إدخال رابط الفيديو المباشر");
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    try {
      const finalCategories = categoriesList.length > 0 ? categoriesList : (category ? [category] : []);
      const primaryCategory = finalCategories[0] || "";

      const payload = {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        thumbnailUrl: thumbnailUrl.trim() || null,
        category: primaryCategory,
        categories: finalCategories,
        views: Number(views) || 0,
        hijriDate: hijriDate.trim(),
        gregorianDate: gregorianDate.trim(),
        duration: duration.trim() || null,
        showInSlider,
        isFeatured: showInSlider,
        isPinned: showInSlider,
        updatedAt: Date.now()
      };

      if (editingId) {
        await updateDoc(doc(db, "videos", editingId), payload);
        alert("تم حفظ تعديلات الفيديو بنجاح");
      } else {
        await addDoc(collection(db, "videos"), {
          ...payload,
          createdAt: Date.now()
        });
        alert("تم إضافة ونشر الفيديو بنجاح");
      }

      setMode("list");
      resetForm();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ الفيديو، يرجى المحاولة مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "videos", id));
      await SyncService.trackDeletion("videos", id);
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حذف الفيديو");
    }
  };

  // Quick Inline Category Update
  const handleQuickUpdateCategory = async (id: string, newCategory: string, allCategories: string[]) => {
    try {
      const docRef = doc(db, "videos", id);
      const finalCats = allCategories && allCategories.length > 0 ? allCategories : [newCategory];
      const updateData = {
        category: newCategory,
        categories: finalCats,
        updatedAt: Date.now()
      };
      await updateDoc(docRef, updateData);
      setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updateData } : v));
    } catch (error) {
      console.error("Error updating video category:", error);
      throw error;
    }
  };

  // Create Custom Category
  const handleAddCustomCategory = async () => {
    if (!customCatName.trim()) return;
    try {
      const newCatName = customCatName.trim();
      await CategoryService.saveCategory({ name: newCatName, color: "#EF4444" });
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

  // Helper formatting for editor toolbar
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("video-desc-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const replacement = `${prefix}${selectedText || "نص مخصص"}${suffix}`;
    const newDesc = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newDesc);
  };

  // Filtered videos list
  const filteredVideos = videos.filter((v) => {
    const matchQuery =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCat =
      selectedCategoryFilter === "all" ||
      v.category === selectedCategoryFilter ||
      (v.categories && v.categories.includes(selectedCategoryFilter));

    return matchQuery && matchCat;
  });

  if (loading) {
    return (
      <div className="p-12 text-center font-cairo font-bold text-slate-500">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        جاري تحميل قسم الفيديوهات والمواد المرئية...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo text-right" dir="rtl">
      {/* Top Navigation Controls - Without background card */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: قائمة الفيديوهات */}
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "list"
                ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/25 ring-2 ring-rose-500/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <Film className={`w-4 h-4 transition-transform duration-200 ${mode === "list" ? "scale-110" : "opacity-70"}`} />
            <span>قائمة الفيديوهات</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black transition-colors ${
                mode === "list"
                  ? "bg-black/30 text-white"
                  : "bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300"
              }`}
            >
              {videos.length}
            </span>
          </button>

          {/* Tab 2: إضافة فيديو جديد */}
          <button
            type="button"
            onClick={startNewWizard}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "wizard"
                ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/25 ring-2 ring-rose-500/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <PlusCircle className={`w-4 h-4 transition-transform duration-200 ${mode === "wizard" ? "scale-110" : "opacity-70"}`} />
            <span>إضافة فيديو جديد</span>
          </button>
        </div>
      </div>

      {/* MODE 1: LIST VIEW */}
      {mode === "list" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full lg:w-80">
              <input
                type="text"
                placeholder="البحث في الفيديوهات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                <span className="text-xs font-bold text-slate-400 shrink-0">التصنيف:</span>
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    selectedCategoryFilter === "all"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  الكل
                </button>
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      selectedCategoryFilter === cat.name
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* View Layout Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setViewLayout("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewLayout === "grid" ? "bg-white dark:bg-slate-700 text-rose-600 shadow-xs" : "text-slate-400"
                  }`}
                  title="عرض شبكي"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewLayout === "list" ? "bg-white dark:bg-slate-700 text-rose-600 shadow-xs" : "text-slate-400"
                  }`}
                  title="عرض أفقي"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Videos Grid / List */}
          {filteredVideos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <Film className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-500">لا توجد فيديوهات مطابقة للبحث أو الفلتر</p>
              <button
                onClick={startNewWizard}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors"
              >
                إضافة فيديو جديد الآن
              </button>
            </div>
          ) : viewLayout === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((v) => (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Image / Video Header */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      {/* Main Slider Badge if applicable */}
                      {(v.showInSlider || v.isFeatured || v.isPinned) && (
                        <span className="absolute top-2 left-2 bg-rose-600/90 text-white text-[10px] font-black px-2 py-1 rounded-full backdrop-blur-md shadow-xs flex items-center gap-1 z-10">
                          <Sparkles className="w-3 h-3" />
                          <span>في السلايدر الرئيسي</span>
                        </span>
                      )}

                      {v.thumbnailUrl ? (
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-900 to-slate-800">
                          <Video className="w-10 h-10 opacity-30 text-rose-500 mb-1" />
                          <span className="text-[11px] font-bold text-slate-400">بدون صورة غلاف</span>
                        </div>
                      )}

                      {/* Play button overlay */}
                      <button
                        onClick={() => setPreviewModalVideo(v)}
                        className="absolute inset-0 m-auto w-12 h-12 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center backdrop-blur-xs transition-all transform group-hover:scale-110 shadow-lg cursor-pointer"
                        title="تشغيل ومعاينة الفيديو"
                      >
                        <Play className="w-5 h-5 fill-current text-white mr-0.5" />
                      </button>

                      {/* Quick Category Selector Badge */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <QuickCategorySelector
                          currentCategory={v.category}
                          currentCategories={v.categories}
                          itemTitle={v.title}
                          size="xs"
                          onUpdate={(newCat, allCats) => handleQuickUpdateCategory(v.id, newCat, allCats)}
                        />
                      </div>

                      {v.duration && (
                        <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                          {v.duration}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {v.title}
                      </h3>

                      {v.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        {v.hijriDate || v.gregorianDate || (v.createdAt ? new Date(v.createdAt).toLocaleDateString("ar-EG") : "اليوم")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {v.views || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewModalVideo(v)}
                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="مشاهدة الفيديو"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() => handleEditVideo(v)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors"
                        title="تعديل بيانات الفيديو"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {deletingId === v.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 p-1 rounded-lg">
                          <button
                            onClick={() => handleDeleteVideo(v.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                          >
                            حذف
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-1.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 text-[10px] rounded"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(v.id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition-colors"
                          title="حذف الفيديو"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="space-y-3">
              {filteredVideos.map((v) => (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      onClick={() => setPreviewModalVideo(v)}
                      className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group/thumb"
                    >
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Video className="w-6 h-6 text-rose-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <QuickCategorySelector
                          currentCategory={v.category}
                          currentCategories={v.categories}
                          itemTitle={v.title}
                          size="xs"
                          onUpdate={(newCat, allCats) => handleQuickUpdateCategory(v.id, newCat, allCats)}
                        />
                        {v.duration && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            {v.duration}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {v.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                        <span>{v.views || 0} مشاهدة</span>
                        <span>•</span>
                        <span>{v.hijriDate || v.gregorianDate || (v.createdAt ? new Date(v.createdAt).toLocaleDateString("ar-EG") : "اليوم")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleEditVideo(v)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>

                    {deletingId === v.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 p-1 rounded-xl">
                        <button
                          onClick={() => handleDeleteVideo(v.id)}
                          className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 text-xs rounded-lg font-bold"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(v.id)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: VIDEO WIZARD (3 STEPS) */}
      {mode === "wizard" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-6">
          {/* Step Indicator Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <span>{editingId ? "تعديل تقرير وفيديو حالي" : "معالج إضافة فيديو وتقرير مرئي جديد"}</span>
              </h2>
              <button
                onClick={() => setMode("list")}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { num: 1, label: "المعلومات الأساسية والتصنيف", icon: FileText },
                { num: 2, label: "رابط ومحتوى الفيديو", icon: Video },
                { num: 3, label: "الغلاف والنشر", icon: ImageIcon },
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
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                        : isDone
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? "bg-white text-rose-600"
                          : isDone
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}
                    >
                      {step.num}
                    </div>
                    <span className="truncate">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 1: BASIC INFO & CATEGORIES */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Video Title */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  عنوان الفيديو / التقرير المرئي الرئيسي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ادخل عنواناً جذاباً وواضحاً للفيديو هنا..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                />
              </div>

              {/* Categories Section */}
              <CategoryMultiSelect
                title="تصنيفات الفيديو"
                accentColor="rose"
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
                helperText="ملاحظة: اختيار التصنيفات يربط الفيديو تلقائياً بأبرز المواضيع والمصنفات المطابقة لتسميات التصانيف المحددة."
              />

              {/* Dates & Duration with Manual Date Selector */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span>تحديد تاريخ الفيديو من التقويم (تلقائي للهجري والميلادي)</span>
                  </label>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    يمكنك اختيار التاريخ أو إدخاله يدوياً
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDatePicker}
                    onChange={(e) => handleDatePickerChange(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    حدد التاريخ من القائمة التقويمية ليتم تحويله مباشرة للهجري والميلادي
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">
                      التاريخ الهجري (قابل للتعديل)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 15 صفر 1448 هـ"
                      value={hijriDate}
                      onChange={(e) => setHijriDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">
                      التاريخ الميلادي (قابل للتعديل)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 15 أغسطس 2026"
                      value={gregorianDate}
                      onChange={(e) => setGregorianDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">
                      مدة الفيديو (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 05:30 أو 12 دقيقة"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: VIDEO URL & DESCRIPTION & LIVE PREVIEW */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Video URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  رابط الفيديو المباشر (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://meyon.com.ye/w/... أو https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500 text-left"
                  dir="ltr"
                />
              </div>

              {/* Live Preview Embed Player */}
              {url && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-white text-xs font-bold mb-2">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <Play className="w-4 h-4 fill-current" />
                      <span>معاينة حية لمشغل الفيديو:</span>
                    </span>
                    <span className="text-[11px] text-slate-400">تأكد من تشغيل الفيديو بسلاسة قبل النشر</span>
                  </div>

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black max-w-xl mx-auto shadow-2xl">
                    {url.includes("youtube.com") || url.includes("youtu.be") || url.includes("/w/") || url.includes("/videos/watch/") || url.includes("/videos/embed/") ? (
                      <iframe
                        src={getEmbedUrl(url)}
                        title="معاينة الفيديو"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Video Description & Formatting Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    وصف ومحتوى التقرير المرئي (اختياري)
                  </label>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                    <span>الكلمات: {description.trim() ? description.trim().split(/\s+/).length : 0}</span>
                  </div>
                </div>

                {/* Formatting Quick Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="عريض"
                  >
                    <Bold className="w-3.5 h-3.5" />
                    <span>عريض</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*")}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="مائل"
                  >
                    <Italic className="w-3.5 h-3.5" />
                    <span>مائل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("### ")}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="عنوان فرعي"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>عنوان فرعي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("<mark>", "</mark>")}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="تظليل"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>تظليل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("> ")}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="اقتباس"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>اقتباس</span>
                  </button>
                </div>

                <textarea
                  id="video-desc-editor"
                  rows={5}
                  placeholder="ادخل نبذة تفصيلية أو محتوى وتفريغ التقرير المرئي هنا..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500 font-cairo resize-y min-h-[140px]"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: THUMBNAIL & PUBLISHING */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Main Thumbnail Upload */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                      الصورة المصغرة (غلاف الفيديو الرئيسي)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      الصورة التي ستظهر للمشاهدين في قائمة الفيديوهات والواجهة الرئيسية
                    </span>
                  </div>

                  {url && (url.includes("youtube.com") || url.includes("youtu.be")) && (
                    <button
                      type="button"
                      onClick={handleAutoExtractYouTubeThumb}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>جلب غلاف يوتيوب تلقائياً</span>
                    </button>
                  )}
                </div>

                <ImageUpload
                  value={thumbnailUrl}
                  onChange={(url) => setThumbnailUrl(url)}
                />
              </div>

              {/* Views Counter Input (Admin only) */}
              {isAdmin && (
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    عدد المشاهدات الابتدائي (خاص بالمدير)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={views}
                    onChange={(e) => setViews(parseInt(e.target.value, 10) || 0)}
                    className="w-full max-w-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Main Slider Display Toggle */}
              <label className="flex items-center justify-between p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/30 rounded-2xl cursor-pointer hover:border-rose-500 transition-colors font-bold text-xs select-none">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${showInSlider ? "bg-rose-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-slate-900 dark:text-white font-black text-sm">عرض المحتوى في السلايدر الرئيسي للمنصة</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      عند التفعيل، سيظهر هذا الفيديو بشكل بارز في السلايدر المتحرك في أعلى الصفحة الرئيسية للموقع.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showInSlider}
                  onChange={(e) => setShowInSlider(e.target.checked)}
                  className="w-5 h-5 accent-rose-600 rounded shrink-0 cursor-pointer"
                />
              </label>

              {/* Summary Overview */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ملخص بيانات الفيديو قبل النشر:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold">العنوان: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{title || "لم يحدد"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">التصنيف: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{categoriesList[0] || category || "بدون تصنيف"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                إلغاء
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && !title.trim()) {
                      alert("يرجى إدخال عنوان الفيديو");
                      return;
                    }
                    if (currentStep === 2 && !url.trim()) {
                      alert("يرجى إدخال رابط الفيديو");
                      return;
                    }
                    setCurrentStep((prev) => (prev + 1) as any);
                  }}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveVideo}
                  disabled={saving}
                  className="px-7 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري حفظ ونشر الفيديو...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingId ? "حفظ التعديلات" : "حفظ ونشر الفيديو"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP PREVIEW VIDEO MODAL */}
      <AnimatePresence>
        {previewModalVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-rose-500 fill-current" />
                  <h3 className="font-bold text-sm text-white line-clamp-1">
                    {previewModalVideo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewModalVideo(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                {previewModalVideo.url.includes("youtube.com") || previewModalVideo.url.includes("youtu.be") || previewModalVideo.url.includes("/w/") || previewModalVideo.url.includes("/videos/watch/") || previewModalVideo.url.includes("/videos/embed/") ? (
                  <iframe
                    src={getEmbedUrl(previewModalVideo.url, true)}
                    title={previewModalVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={previewModalVideo.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Modal Footer Info */}
              <div className="p-4 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
                <span>{previewModalVideo.category || "بدون تصنيف"}</span>
                <button
                  onClick={() => {
                    handleEditVideo(previewModalVideo);
                    setPreviewModalVideo(null);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors"
                >
                  تعديل هذا الفيديو
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
