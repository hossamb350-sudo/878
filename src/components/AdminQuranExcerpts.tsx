import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { QuranExcerpt } from "../types";
import { SyncService } from "../services/SyncService";
import { del as delIDB } from "idb-keyval";
import {
  Quote,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  Check,
  Copy,
  BookOpen,
  User,
  Sparkles,
  CheckCircle2,
  FileText,
  X,
  Share2,
  Bookmark,
  ExternalLink,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageUpload } from "./ImageUpload";

// Ornamental Islamic Divider SVG Component
export const IslamicOrnamentDivider = ({ className = "text-amber-600/40 dark:text-amber-400/40" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-2 my-3 select-none ${className}`}>
    <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 dark:via-amber-400/30 to-transparent flex-1" />
    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L14.5 7.5L20 8L16 12.5L17.5 18L12 15L6.5 18L8 12.5L4 8L9.5 7.5L12 2Z" opacity="0.6" />
      <circle cx="12" cy="10" r="1.5" />
    </svg>
    <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 dark:via-amber-400/30 to-transparent flex-1" />
  </div>
);

// Luxury Islamic Excerpt Card (Shared for Preview & Client Display)
export const IslamicExcerptCard = ({
  excerpt,
  onEdit,
  onDelete,
  onToggleStatus,
  onSelect,
  isAdmin = false,
  showFull = false,
  isCompact = false,
}: {
  excerpt: QuranExcerpt;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  onSelect?: () => void;
  isAdmin?: boolean;
  showFull?: boolean;
  isCompact?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `« ${excerpt.title} »\n\n"${excerpt.content}"\n\n📌 ${excerpt.source || "غير محدد"}\n👤 ${excerpt.author || "غير محدد"}\nمنصة تعز الإعلامية`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: excerpt.title,
          text: `« ${excerpt.title} »\n\n"${excerpt.content}"\n\n📌 ${excerpt.source || "غير محدد"}\n👤 ${excerpt.author || "غير محدد"}`,
          url: window.location.href,
        });
      } catch (err) {
        // Share cancelled or failed
      }
    } else {
      handleCopy(e);
    }
  };

  if (isCompact) {
    return (
      <div
        onClick={onSelect}
        className="relative flex items-center gap-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-slate-200/50 dark:border-stone-800/80 shadow-2xs hover:shadow-xs hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.99] group"
        dir="rtl"
      >
        {/* Compact Image */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border border-slate-100/80 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-950 flex items-center justify-center relative">
          {excerpt.mediaUrl ? (
            <img
              src={excerpt.mediaUrl}
              alt={excerpt.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/10 to-emerald-500/10 dark:from-amber-500/5 dark:to-emerald-500/5 flex items-center justify-center">
              <Quote className="w-5 h-5 text-amber-600/70 dark:text-amber-400/60 transform scale-x-[-1]" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-right font-cairo">
          <h3 className="font-extrabold text-[12.5px] sm:text-[13.5px] text-slate-800 dark:text-white leading-snug truncate mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {excerpt.title || "مقتطف بدون عنوان"}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <User className="w-3.5 h-3.5 text-emerald-600/80 dark:text-emerald-500/80 shrink-0" />
            <span className="truncate">
              {excerpt.author || "السيد حسين بدر الدين الحوثي"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`relative group bg-white dark:bg-stone-900 rounded-2xl border border-amber-500/20 dark:border-amber-500/15 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        onSelect ? "cursor-pointer hover:border-amber-500/40 active:scale-[0.99]" : ""
      }`}
      dir="rtl"
    >
      {/* Subtle Geometric Background Watermark */}
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-emerald-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Top Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500/40 via-emerald-600/60 to-amber-500/40" />

      <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
        {/* Card Header: Title & Status / Copy */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 dark:from-amber-400/10 dark:to-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                <Quote className="w-4 h-4 transform scale-x-[-1]" />
              </div>
              <h3 className="font-extrabold text-[14px] sm:text-[15.5px] text-slate-900 dark:text-white font-cairo leading-snug truncate">
                {excerpt.title || "مقتطف بدون عنوان"}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin && excerpt.status && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.();
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors font-cairo ${
                    excerpt.status === "published"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20"
                  }`}
                  title="انقر لتغيير حالة النشر"
                >
                  {excerpt.status === "published" ? "منشور" : "مسودة"}
                </button>
              )}

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                title="نسخ نص المقتطف"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                title="مشاركة المقتطف"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Excerpt Body: High-Contrast Arabic Calligraphic Quote */}
          <div className="relative py-2 px-1">
            <Quote className="absolute -top-1 -right-1 w-6 h-6 text-amber-500/15 dark:text-amber-400/10 pointer-events-none transform scale-x-[-1]" />
            <p
              className={`text-[13px] sm:text-[14.5px] font-medium text-slate-800 dark:text-slate-200 font-cairo leading-[1.9] text-justify ${
                showFull ? "" : "line-clamp-4"
              }`}
            >
              {excerpt.content || "لا يوجد نص للمقتطف."}
            </p>
          </div>

          {/* Optional Media Image */}
          {excerpt.mediaUrl && (
            <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
              <img
                src={excerpt.mediaUrl}
                alt={excerpt.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Card Footer: Islamic Details (Source & Author) */}
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-stone-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-[11.5px] font-cairo text-slate-600 dark:text-slate-400">
            {/* Author */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <User className="w-3 h-3" />
              </div>
              <span className="truncate">
                {excerpt.author || "السيد حسين بدر الدين الحوثي"}
              </span>
            </div>

            {/* Source */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Bookmark className="w-3 h-3" />
              </div>
              <span className="truncate">
                {excerpt.source || "هدي القرآن الكريم"}
              </span>
            </div>
          </div>

          {/* Admin Edit / Delete Actions */}
          {isAdmin && (
            <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-stone-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors font-cairo"
              >
                <Edit2 className="w-3.5 h-3.5" />
                تعديل
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-cairo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function AdminQuranExcerpts() {
  const [list, setList] = useState<QuranExcerpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State - strictly independent excerpt fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [author, setAuthor] = useState("السيد حسين بدر الدين الحوثي");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [mediaUrl, setMediaUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [previewModalExcerpt, setPreviewModalExcerpt] = useState<QuranExcerpt | null>(null);

  // Listen to live excerpts from Firestore & preload cache
  useEffect(() => {
    // 1. Preload from local cache
    const cached = localStorage.getItem("taiz_quran_excerpts_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
          setLoading(false);
        }
      } catch (e) {}
    }

    const q = query(collection(db, "quran_excerpts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || "",
            content: data.content || "",
            source: data.source || "هدي القرآن الكريم",
            author: data.author || "السيد حسين بدر الدين الحوثي",
            status: data.status || "published",
            mediaUrl: data.mediaUrl || undefined,
            order: data.order || 0,
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt,
          } as QuranExcerpt;
        });
        setList(items);
        setLoading(false);
        SyncService.setCache("quran_excerpts", items);
      },
      (err) => {
        console.error("Error fetching excerpts:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openNewForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSource("");
    setAuthor("السيد حسين بدر الدين الحوثي");
    setStatus("published");
    setMediaUrl("");
    setIsFormOpen(true);
  };

  const openEditForm = (item: QuranExcerpt) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setSource(item.source || "");
    setAuthor(item.author || "السيد حسين بدر الدين الحوثي");
    setStatus(item.status || "published");
    setMediaUrl(item.mediaUrl || "");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("يرجى كتابة عنوان المقتطف");
    if (!content.trim()) return alert("يرجى كتابة نص المقتطف");
    if (!author.trim()) return alert("يرجى إدخال اسم صاحب المقتطف");

    setSaving(true);
    try {
      const id = editingId || `excerpt-${Date.now()}`;
      const payload: Partial<QuranExcerpt> = {
        id,
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || "هدي القرآن الكريم",
        author: author.trim(),
        status,
        mediaUrl: mediaUrl.trim() || undefined,
        updatedAt: Date.now(),
      };

      if (!editingId) {
        payload.createdAt = Date.now();
      }

      await setDoc(doc(db, "quran_excerpts", id), payload, { merge: true });
      await delIDB("quran_data_cache");

      closeForm();
    } catch (err) {
      console.error("Error saving excerpt:", err);
      alert("حدث خطأ أثناء حفظ المقتطف");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, excerptTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف المقتطف «${excerptTitle}»؟`)) return;
    try {
      await deleteDoc(doc(db, "quran_excerpts", id));
      await SyncService.trackDeletion("quran_excerpts", id);
      await delIDB("quran_data_cache");
    } catch (err) {
      console.error("Error deleting excerpt:", err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleToggleStatus = async (item: QuranExcerpt) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    try {
      await setDoc(
        doc(db, "quran_excerpts", item.id),
        { status: newStatus, updatedAt: Date.now() },
        { merge: true }
      );
      await delIDB("quran_data_cache");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("حدث خطأ أثناء تحديث حالة النشر");
    }
  };

  // Filtered List
  const filteredList = list.filter((item) => {
    const matchQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus =
      filterStatus === "all" || item.status === filterStatus;

    return matchQuery && matchStatus;
  });

  const publishedCount = list.filter((e) => e.status === "published").length;
  const draftCount = list.filter((e) => e.status === "draft").length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950/70 text-white p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Quote className="w-5 h-5 transform scale-x-[-1]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black font-cairo leading-tight">
              إدارة المقتطفات النورانية
            </h2>
            <p className="text-xs text-amber-200/80 font-medium font-cairo">
              نظام مستقل لإدارة ونشر الاقتباسات والمقتطفات مع مصادرها وأصحابها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm font-cairo shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مقتطف جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Stats & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-cairo">
              إجمالي المقتطفات
            </span>
          </div>
          <span className="text-base font-black text-slate-900 dark:text-white font-cairo">
            {list.length}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-cairo">
              المقتطفات المنشورة
            </span>
          </div>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-cairo">
            {publishedCount}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-cairo">
              المسودات
            </span>
          </div>
          <span className="text-base font-black text-amber-600 dark:text-amber-400 font-cairo">
            {draftCount}
          </span>
        </div>
      </div>

      {/* 3. Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في المقتطفات (العنوان، النص، المصدر، القائل)..."
            className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-cairo dark:text-white focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all ${
              filterStatus === "all"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            الكل ({list.length})
          </button>
          <button
            onClick={() => setFilterStatus("published")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all ${
              filterStatus === "published"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            منشور ({publishedCount})
          </button>
          <button
            onClick={() => setFilterStatus("draft")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all ${
              filterStatus === "draft"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            مسودة ({draftCount})
          </button>
        </div>
      </div>

      {/* 4. Modal / Form for Adding / Editing Excerpt */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-amber-500/30 shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Quote className="w-4 h-4 transform scale-x-[-1]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-cairo">
                    {editingId ? "تعديل المقتطف" : "إضافة مقتطف جديد"}
                  </h3>
                </div>
                <button
                  onClick={closeForm}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* 1. Excerpt Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                    عنوان المقتطف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: البصيرة في القرآن، عظمة الاستغفار..."
                    className="w-full p-3 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm font-cairo dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 2. Excerpt Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                      نص المقتطف الكامل <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-cairo">
                      {content.length} حرف
                    </span>
                  </div>
                  <textarea
                    required
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب أو الصق نص المقتطف أو الاقتباس هنا بوضوح..."
                    className="w-full p-3 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm font-cairo dark:text-white focus:outline-none focus:border-amber-500 leading-loose"
                  />
                </div>

                {/* 3. Source & Author Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Author */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      صاحب النص <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="مثال: السيد حسين بدر الدين الحوثي"
                      className="w-full p-2.5 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm font-cairo dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Source */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                      المرجع أو الكتاب
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="مثال: سورة البقرة - الدرس الثاني / محاضرة الهوية"
                      className="w-full p-2.5 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm font-cairo dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 4. Publication Status & Media */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Publication Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                      حالة النشر
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                      className="w-full p-2.5 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm font-cairo font-bold dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="published">منشور للجمهور مباشرة</option>
                      <option value="draft">حفظ كمسودة (غير ظاهر للجمهور)</option>
                    </select>
                  </div>

                  {/* Media / Image URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                      رابط صورة مرافقة (اختياري)
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm font-cairo dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Live Mini Preview Box */}
                {(title || content) && (
                  <div className="p-3 bg-amber-50/50 dark:bg-stone-950 rounded-xl border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 font-cairo">
                      <Sparkles className="w-3.5 h-3.5" />
                      معاينة مباشرة لشكل البطاقة
                    </div>
                    <IslamicExcerptCard
                      excerpt={{
                        id: "preview",
                        title: title || "عنوان تجريبي",
                        content: content || "نص المقتطف التجريبي يظهر هنا بالتنسيق الإسلامي الفاخر...",
                        source: source || "المصدر التجريبي",
                        author: author || "اسم صاحب المقتطف",
                        status,
                        mediaUrl: mediaUrl || undefined,
                        createdAt: Date.now(),
                      }}
                      showFull
                    />
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm font-cairo hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm font-cairo shadow-sm transition-all disabled:opacity-50"
                  >
                    {saving ? "جاري الحفظ..." : editingId ? "تحديث المقتطف" : "حفظ ونشر المقتطف"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Excerpts Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold font-cairo">
          جاري تحميل المقتطفات...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Quote className="w-6 h-6 transform scale-x-[-1]" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo">
            لا توجد مقتطفات تطابق البحث أو لم يتم إضافة أي مقتطف بعد.
          </p>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 font-cairo bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة أول مقتطف الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => (
            <IslamicExcerptCard
              key={item.id}
              excerpt={item}
              isAdmin
              onEdit={() => openEditForm(item)}
              onDelete={() => handleDelete(item.id, item.title)}
              onToggleStatus={() => handleToggleStatus(item)}
              onSelect={() => setPreviewModalExcerpt(item)}
            />
          ))}
        </div>
      )}

      {/* 6. Preview Modal for Admin inspection */}
      <AnimatePresence>
        {previewModalExcerpt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-amber-500/30 shadow-2xl max-w-lg w-full p-5 space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-stone-800">
                <span className="text-xs font-bold text-slate-500 font-cairo">معاينة المقتطف</span>
                <button
                  onClick={() => setPreviewModalExcerpt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <IslamicExcerptCard excerpt={previewModalExcerpt} showFull />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewModalExcerpt(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-stone-800 rounded-xl text-xs font-bold font-cairo text-slate-700 dark:text-slate-300"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
