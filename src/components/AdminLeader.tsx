import { sendFCMNotification } from "../utils/sendFCM";
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
import { LeaderContent, Category } from "../types";
import { CategoryService } from "../services/CategoryService";
import { SyncService } from "../services/SyncService";
import { PushNotificationService } from "../services/PushNotificationService";
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
  FileText, 
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
  Settings, 
  LayoutGrid, 
  List, 
  Bell, 
  BookOpen, 
  Quote, 
  ArrowUpDown, 
  Layers 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminLeader({ isAdmin }: { isAdmin?: boolean }) {
  const [leaderContents, setLeaderContents] = useState<LeaderContent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<"list" | "wizard">("list");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "video" | "text">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewModalItem, setPreviewModalItem] = useState<LeaderContent | null>(null);

  // Form State for Leader Content Wizard
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "text">("video");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [order, setOrder] = useState<string>("");
  const [views, setViews] = useState<number>(0);
  const [hijriDate, setHijriDate] = useState("");
  const [gregorianDate, setGregorianDate] = useState("");
  const [duration, setDuration] = useState("");
  const [notify, setNotify] = useState(true);
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

  // Realtime subscriptions
  useEffect(() => {
    const qLeader = query(collection(db, "leader"));
    const unsubLeader = onSnapshot(
      qLeader,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as LeaderContent)
        );
        data.sort((a, b) => {
          const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
          const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setLeaderContents(data);
        setLoading(false);
      },
      (error) => {
        console.warn("Error fetching leader content:", error);
        setLoading(false);
      }
    );

    const unsubCats = CategoryService.subscribeCategories((list) => {
      setCategories(list);
    });

    return () => {
      unsubLeader();
      unsubCats();
    };
  }, []);

  // Auto-generate dates for new content
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
    setType("video");
    setContent("");
    setDescription("");
    setThumbnailUrl("");
    setCategory("");
    setCategoriesList([]);
    setOrder("");
    setViews(0);
    setHijriDate("");
    setGregorianDate("");
    setDuration("");
    setNotify(true);
    setShowInSlider(false);
    setSelectedDatePicker("");
    setEditingId(null);
    setCurrentStep(1);
  };

  const startNewWizard = () => {
    resetForm();
    setMode("wizard");
  };

  const handleEditItem = (item: LeaderContent) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setType(item.type || "video");
    setContent(item.content || "");
    setDescription(item.description || "");
    setThumbnailUrl(item.thumbnailUrl || "");
    setCategory(item.category || "");
    setCategoriesList(item.categories || (item.category ? [item.category] : []));
    setOrder(item.order !== undefined && item.order !== null && item.order !== 9999 ? String(item.order) : "");
    setViews(item.views || 0);
    setHijriDate(item.hijriDate || "");
    setGregorianDate(item.gregorianDate || "");
    setDuration(item.duration || "");
    setShowInSlider(!!item.showInSlider || !!item.isFeatured || !!item.isPinned);
    setMode("wizard");
    setCurrentStep(1);
  };

  // Helper to convert embed URL for video player preview
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
    if (!content || type !== "video") return;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = content.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      alert("الرابط ليس من يوتيوب، يرجى رفع صورة الغلاف يدوياً");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("يرجى إدخال عنوان الكلمة أو المحاضرة");
      setCurrentStep(1);
      return;
    }
    if (!content.trim()) {
      alert(type === "video" ? "يرجى إدخال رابط الفيديو المباشر" : "يرجى كتابة محتوى النص أو المحاضرة");
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    try {
      const finalCategories = categoriesList.length > 0 ? categoriesList : (category ? [category] : []);
      const primaryCategory = finalCategories[0] || "";
      const parsedOrder = order.trim() ? Number(order) : 9999;

      const payload = {
        title: title.trim(),
        type,
        content: content.trim(),
        description: type === "video" ? description.trim() : "",
        thumbnailUrl: thumbnailUrl.trim() || null,
        category: primaryCategory,
        categories: finalCategories,
        order: parsedOrder,
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
        await updateDoc(doc(db, "leader", editingId), payload);
        alert("تم حفظ تعديلات محتوى القائد بنجاح");
      } else {
        const docRef = await addDoc(collection(db, "leader"), {
          ...payload,
          createdAt: Date.now()
        });
        sendFCMNotification(
          "السيد القائد | " + title,
          "تمت إضافة مرئية جديدة للسيد القائد",
          "leader",
          docRef.id,
          thumbnailUrl
        );

        if (notify) {
          try {
            await PushNotificationService.triggerPushNotification(
              type === "video" ? "خطاب جديد للمناسبة 🎥" : "محتوى ثقافي جديد 📖",
              title.trim(),
              `/leader?leaderContentId=${docRef.id}`
            );
          } catch (pushErr) {
            console.error("Failed to send leader push notification:", pushErr);
          }
        }

        alert("تم إضافة ونشر محتوى السيد القائد بنجاح");
      }

      setMode("list");
      resetForm();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leader", id));
      await SyncService.trackDeletion("leader", id);
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  // Quick Inline Category Update
  const handleQuickUpdateCategory = async (id: string, newCategory: string, allCategories: string[]) => {
    try {
      const docRef = doc(db, "leader", id);
      const finalCats = allCategories && allCategories.length > 0 ? allCategories : [newCategory];
      const updateData = {
        category: newCategory,
        categories: finalCats,
        updatedAt: Date.now()
      };
      await updateDoc(docRef, updateData);
      setLeaderContents(prev => prev.map(item => item.id === id ? { ...item, ...updateData } : item));
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  };

  // Helper formatting for editor toolbar
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const targetId = type === "video" ? "leader-desc-editor" : "leader-content-editor";
    const textarea = document.getElementById(targetId) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const targetValue = type === "video" ? description : content;
    const selectedText = targetValue.substring(start, end);
    const replacement = `${prefix}${selectedText || "نص مخصص"}${suffix}`;
    const newValue = targetValue.substring(0, start) + replacement + targetValue.substring(end);
    if (type === "video") {
      setDescription(newValue);
    } else {
      setContent(newValue);
    }
  };

  // Filtered leader contents list
  const filteredContents = leaderContents.filter((item) => {
    const matchQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType =
      selectedTypeFilter === "all" || item.type === selectedTypeFilter;

    const matchCat =
      selectedCategoryFilter === "all" ||
      item.category === selectedCategoryFilter ||
      (item.categories && item.categories.includes(selectedCategoryFilter));

    return matchQuery && matchType && matchCat;
  });

  if (loading) {
    return (
      <div className="p-12 text-center font-cairo font-bold text-slate-500">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        جاري تحميل قسم محتوى السيد القائد...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo text-right" dir="rtl">
      {/* Top Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: قائمة محتوى القائد */}
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "list"
                ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/25 ring-2 ring-amber-500/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <BookOpen className={`w-4 h-4 transition-transform duration-200 ${mode === "list" ? "scale-110" : "opacity-70"}`} />
            <span>قائمة محتوى السيد القائد</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black transition-colors ${
                mode === "list"
                  ? "bg-black/30 text-white"
                  : "bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300"
              }`}
            >
              {leaderContents.length}
            </span>
          </button>

          {/* Tab 2: إضافة محتوى جديد */}
          <button
            type="button"
            onClick={startNewWizard}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer border ${
              mode === "wizard"
                ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/25 ring-2 ring-amber-500/40 scale-[1.02]"
                : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            }`}
          >
            <PlusCircle className={`w-4 h-4 transition-transform duration-200 ${mode === "wizard" ? "scale-110" : "opacity-70"}`} />
            <span>إضافة محتوى جديد</span>
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
                placeholder="البحث في الكلمات والمحاضرات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 flex-1">
              {/* Type Filter Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedTypeFilter === "all" ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setSelectedTypeFilter("video")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    selectedTypeFilter === "video" ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>كلمات ومرئيات</span>
                </button>
                <button
                  onClick={() => setSelectedTypeFilter("text")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    selectedTypeFilter === "text" ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>محاضرات ودروس</span>
                </button>
              </div>

              {/* View Layout Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setViewLayout("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewLayout === "grid" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs" : "text-slate-400"
                  }`}
                  title="عرض شبكي"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewLayout === "list" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs" : "text-slate-400"
                  }`}
                  title="عرض أفقي"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Leader Content Grid / List */}
          {filteredContents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-500">لا توجد عناصر مطابقة للبحث أو الفلتر المحدد</p>
              <button
                onClick={startNewWizard}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-700 transition-colors"
              >
                إضافة محتوى جديد الآن
              </button>
            </div>
          ) : viewLayout === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContents.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Image / Badge */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 p-4 text-center">
                          {item.type === "video" ? (
                            <Video className="w-10 h-10 opacity-40 text-amber-500 mb-1" />
                          ) : (
                            <FileText className="w-10 h-10 opacity-40 text-amber-500 mb-1" />
                          )}
                          <span className="text-[11px] font-bold text-slate-400">
                            {item.type === "video" ? "كلمة مرئية" : "محاضرة ودرس ثقافي"}
                          </span>
                        </div>
                      )}

                      {/* Type Pill Badge */}
                      <span className={`absolute top-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${
                        item.type === "video"
                          ? "bg-rose-600/90 text-white"
                          : "bg-amber-600/90 text-white"
                      }`}>
                        {item.type === "video" ? "فيديو" : "محاضرة / نص"}
                      </span>

                      {/* Main Slider Badge if applicable */}
                      {(item.showInSlider || item.isFeatured || item.isPinned) && (
                        <span className="absolute top-2 left-2 bg-amber-600/90 text-white text-[10px] font-black px-2 py-1 rounded-full backdrop-blur-md shadow-xs flex items-center gap-1 z-10">
                          <Sparkles className="w-3 h-3" />
                          <span>في السلايدر الرئيسي</span>
                        </span>
                      )}

                      {/* Preview Overlay Button */}
                      <button
                        onClick={() => setPreviewModalItem(item)}
                        className="absolute inset-0 m-auto w-12 h-12 bg-black/60 hover:bg-amber-600 text-white rounded-full flex items-center justify-center backdrop-blur-xs transition-all transform group-hover:scale-110 shadow-lg cursor-pointer"
                        title={item.type === "video" ? "مشاهدة الفيديو" : "قراءة النص"}
                      >
                        {item.type === "video" ? (
                          <Play className="w-5 h-5 fill-current text-white mr-0.5" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-white" />
                        )}
                      </button>

                      {/* Quick Category Selector Badge */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <QuickCategorySelector
                          currentCategory={item.category}
                          currentCategories={item.categories}
                          itemTitle={item.title}
                          size="xs"
                          onUpdate={(newCat, allCats) => handleQuickUpdateCategory(item.id, newCat, allCats)}
                        />
                      </div>

                      {item.order !== undefined && item.order !== 9999 && (
                        <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                          ترتيب: {item.order}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description || item.content}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        {item.hijriDate || item.gregorianDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("ar-EG") : "اليوم")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.views || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewModalItem(item)}
                        className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 rounded-lg transition-colors"
                        title={item.type === "video" ? "مشاهدة" : "قراءة"}
                      >
                        {item.type === "video" ? <Play className="w-4 h-4 fill-current" /> : <BookOpen className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors"
                        title="تعديل المحتوى"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {deletingId === item.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 p-1 rounded-lg">
                          <button
                            onClick={() => handleDelete(item.id)}
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
                          onClick={() => setDeletingId(item.id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition-colors"
                          title="حذف المحتوى"
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
              {filteredContents.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      onClick={() => setPreviewModalItem(item)}
                      className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group/thumb"
                    >
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          {item.type === "video" ? <Video className="w-6 h-6 text-amber-500" /> : <FileText className="w-6 h-6 text-amber-500" />}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        {item.type === "video" ? <Play className="w-6 h-6 text-white fill-current" /> : <BookOpen className="w-6 h-6 text-white" />}
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          item.type === "video" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {item.type === "video" ? "فيديو" : "محاضرة / نص"}
                        </span>
                        <QuickCategorySelector
                          currentCategory={item.category}
                          currentCategories={item.categories}
                          itemTitle={item.title}
                          size="xs"
                          onUpdate={(newCat, allCats) => handleQuickUpdateCategory(item.id, newCat, allCats)}
                        />
                        {item.order !== undefined && item.order !== 9999 && (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                            الترتيب: {item.order}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                        <span>{item.views || 0} مشاهدة</span>
                        <span>•</span>
                        <span>{item.hijriDate || item.gregorianDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("ar-EG") : "اليوم")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>

                    {deletingId === item.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 p-1 rounded-xl">
                        <button
                          onClick={() => handleDelete(item.id)}
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
                        onClick={() => setDeletingId(item.id)}
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

      {/* MODE 2: LEADER WIZARD (3 STEPS) */}
      {mode === "wizard" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-6">
          {/* Step Indicator Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{editingId ? "تعديل محتوى السيد القائد الحالي" : "معالج إضافة كلمة / محاضرة جديدة للسيد القائد"}</span>
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
                { num: 1, label: "المعلومات الأساسية والنوع", icon: FileText },
                { num: 2, label: type === "video" ? "رابط ووصف الفيديو" : "نص الكلمة أو المحاضرة", icon: type === "video" ? Video : BookOpen },
                { num: 3, label: "الغلاف والترتيب والنشر", icon: ImageIcon },
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
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
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
                          ? "bg-amber-600 text-white"
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

          {/* STEP 1: BASIC INFO, TYPE & CATEGORIES */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Type Selector Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  حدد نوع المحتوى المراد إضافته <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("video")}
                    className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 ${
                      type === "video"
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${type === "video" ? "bg-rose-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600"}`}>
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">كلمة / تقرير مرئي (فيديو)</h4>
                      <p className="text-[11px] opacity-80 mt-0.5">خطابات متلفزة، مقاطع مرئية، وتغطيات مباشرة</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("text")}
                    className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 ${
                      type === "text"
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${type === "text" ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600"}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">محاضرة / درس / نص ثقافي</h4>
                      <p className="text-[11px] opacity-80 mt-0.5">دروس هدى القرآن، تفريغ الخطابات، والمقالات المكتوبة</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Leader Content Title */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  عنوان المحاضرة / الكلمة الرئيسي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ادخل عنوان الكلمة أو الدرس الثقافي بوضوح..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              {/* Categories Section */}
              <CategoryMultiSelect
                title="تصنيفات المحتوى"
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
                presetSuggestions={["خطابات ومحاضرات", "دروس من هدى القرآن", "بيانات موقف", "مناسبات دينية"]}
                helperText="ملاحظة: اختيار التصنيفات يربط هذا المحتوى بتصنيفات المنصة ومحركات البحث الداخلية."
              />

              {/* Dates & Duration with Manual Date Selector */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>تحديد تاريخ المحتوى من التقويم (تلقائي للهجري والميلادي)</span>
                  </label>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    يمكنك اختيار التاريخ أو إدخاله يدوياً
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDatePicker}
                    onChange={(e) => handleDatePickerChange(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 cursor-pointer shadow-xs"
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
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
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
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">
                      مدة المادة (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 45 دقيقة"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: VIDEO URL OR TEXT CONTENT */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {type === "video" ? (
                /* VIDEO TYPE STEP 2 */
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                      رابط الفيديو المباشر (URL) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ضع رابط الفيديو هنا (يدعم يوتيوب، ميون، درايف، تيليجرام، والمسيرة)..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 text-left"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      يدعم الروابط المباشرة واليوتيوب (YouTube)، جوجل درايف (Drive)، تيليجرام (Telegram)، والمسيرة (Almasirah) وسيتم معالجتها تلقائياً للعرض بالشكل الصحيح.
                    </p>
                  </div>

                  {/* Live Preview Embed Player */}
                  {content && (
                    <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between text-white text-xs font-bold mb-2">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Play className="w-4 h-4 fill-current" />
                          <span>معاينة حية لمشغل الفيديو:</span>
                        </span>
                        <span className="text-[11px] text-slate-400">تأكد من تشغيل الفيديو بسلاسة قبل النشر</span>
                      </div>

                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black max-w-xl mx-auto shadow-2xl">
                        {content.includes("youtube.com") || content.includes("youtu.be") || content.includes("/w/") || content.includes("/videos/watch/") || content.includes("/videos/embed/") ? (
                          <iframe
                            src={getEmbedUrl(content)}
                            title="معاينة الفيديو"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={content}
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
                        وصف ونبذة عن الكلمة المرئية (اختياري)
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
                      id="leader-desc-editor"
                      rows={4}
                      placeholder="ادخل تفاصيل أو تفريغاً موجزاً عن الكلمة المرئية..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 font-cairo resize-y min-h-[120px]"
                    />
                  </div>
                </>
              ) : (
                /* TEXT TYPE STEP 2 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                      نص المحاضرة أو الدرس الثقافي الكامل <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                      <span>الكلمات: {content.trim() ? content.trim().split(/\s+/).length : 0}</span>
                      <span>الحروف: {content.length}</span>
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
                    id="leader-content-editor"
                    rows={10}
                    placeholder="اكتب أو ألصق النص الكامل للمحاضرة أو الدرس الثقافي هنا..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed rounded-2xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 font-cairo resize-y min-h-[220px]"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: THUMBNAIL, ORDER & PUBLISHING */}
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
                      {type === "video" ? "الصورة المصغرة (غلاف الفيديو الرئيسي)" : "صورة المحاضرة أو المادة الثقافية"}
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      الصورة التي ستظهر للمشاهدين والقراء في قائمة المحتوى
                    </span>
                  </div>

                  {type === "video" && content && (content.includes("youtube.com") || content.includes("youtu.be")) && (
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

              {/* Order Priority */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  ترتيب العرض والأولوية (الأصغر يظهر أولاً في المقدمة)
                </label>
                <input
                  type="number"
                  placeholder="مثال: 1 للظهور أولاً، 2 للظهور ثانياً..."
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full max-w-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                  كلما كان الرقم أصغر كلما تمت موازنته والظهور في المقدمة (رقم 1 في البداية). يُرتب تلقائياً حسب التاريخ إذا تُرك فارغاً.
                </p>
              </div>

              {/* Views Counter Input (Admin only) */}
              {isAdmin && (
                <div className="space-y-1.5 bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                  <label className="block text-xs font-black text-blue-900 dark:text-blue-300">
                    عدد المشاهدات الابتدائي (خاص بالمدير)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={views}
                    onChange={(e) => setViews(parseInt(e.target.value, 10) || 0)}
                    className="w-full max-w-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-3 border border-blue-200 dark:border-blue-800 outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Main Slider Display Toggle */}
              <label className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl cursor-pointer hover:border-amber-500 transition-colors font-bold text-xs select-none">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${showInSlider ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-slate-900 dark:text-white font-black text-sm">عرض المحتوى في السلايدر الرئيسي للمنصة</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      عند التفعيل، سيظهر هذا الموضوع بشكل بارز في السلايدر المتحرك في أعلى الصفحة الرئيسية للموقع.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showInSlider}
                  onChange={(e) => setShowInSlider(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded shrink-0 cursor-pointer"
                />
              </label>

              {/* Push Notification Toggle */}
              <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-colors font-bold text-xs select-none">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded"
                />
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>إرسال تنبيه فوري للمشتركين (Push Notification) بخصوص هذا المحتوى</span>
                </div>
              </label>

              {/* Summary Overview */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ملخص البيانات قبل النشر:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold">العنوان: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{title || "لم يحدد"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">النوع: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{type === "video" ? "كلمة / تقرير مرئي" : "محاضرة / نص ثقافي"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">التصنيف: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{categoriesList[0] || category || "بدون تصنيف"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">الأولوية: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{order || "تلقائي حسب الأحدث"}</span>
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
                      alert("يرجى إدخال عنوان الكلمة أو المحاضرة");
                      return;
                    }
                    if (currentStep === 2 && !content.trim()) {
                      alert(type === "video" ? "يرجى إدخال رابط الفيديو" : "يرجى كتابة محتوى النص");
                      return;
                    }
                    setCurrentStep((prev) => (prev + 1) as any);
                  }}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-7 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري حفظ ونشر المحتوى...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingId ? "حفظ التعديلات" : "حفظ ونشر المحتوى"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP PREVIEW MODAL */}
      <AnimatePresence>
        {previewModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  {previewModalItem.type === "video" ? (
                    <Play className="w-5 h-5 text-amber-500 fill-current" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-amber-500" />
                  )}
                  <h3 className="font-bold text-sm text-white line-clamp-1">
                    {previewModalItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewModalItem(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 space-y-4">
                {previewModalItem.type === "video" ? (
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                    {previewModalItem.content.includes("youtube.com") || previewModalItem.content.includes("youtu.be") || previewModalItem.content.includes("/w/") || previewModalItem.content.includes("/videos/watch/") || previewModalItem.content.includes("/videos/embed/") ? (
                      <iframe
                        src={getEmbedUrl(previewModalItem.content, true)}
                        title={previewModalItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={previewModalItem.content}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-slate-200 p-2">
                    {previewModalItem.thumbnailUrl && (
                      <img
                        src={previewModalItem.thumbnailUrl}
                        alt={previewModalItem.title}
                        className="w-full max-h-64 object-cover rounded-2xl"
                      />
                    )}
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-cairo">
                      {previewModalItem.content}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Info */}
              <div className="p-4 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 shrink-0">
                <span>{previewModalItem.category || "بدون تصنيف"}</span>
                <button
                  onClick={() => {
                    handleEditItem(previewModalItem);
                    setPreviewModalItem(null);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors"
                >
                  تعديل هذا المحتوى
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
