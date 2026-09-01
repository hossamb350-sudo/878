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
import { getShareableUrl } from "../config/apiConfig";
import { shareContent } from "../utils/share";
import { sendFCMNotification } from "../utils/sendFCM";
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

  const hasSource = Boolean(
    excerpt.source &&
      typeof excerpt.source === "string" &&
      excerpt.source.trim().length > 0 &&
      excerpt.source.trim() !== "غير محدد" &&
      excerpt.source.trim() !== "null" &&
      excerpt.source.trim() !== "undefined"
  );

  const hasAuthor = Boolean(
    excerpt.author &&
      typeof excerpt.author === "string" &&
      excerpt.author.trim().length > 0 &&
      excerpt.author.trim() !== "غير محدد" &&
      excerpt.author.trim() !== "null" &&
      excerpt.author.trim() !== "undefined"
  );

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let textToCopy = `« ${excerpt.title || "مقتطف"} »\n\n"${excerpt.content || ""}"`;
    if (hasAuthor) {
      textToCopy += `\n👤 ${excerpt.author}`;
    }
    if (hasSource) {
      textToCopy += `\n📌 ${excerpt.source}`;
    }
    textToCopy += `\nمنصة تعز الإعلامية`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareContent({
      title: excerpt.title || "مقتطف",
      type: "excerpt",
      id: excerpt.id,
      imageUrl: excerpt.mediaUrl,
    });
  };

  if (isCompact) {
    return (
      <div
        onClick={onSelect}
        className="relative group flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-gradient-to-b from-white to-amber-50/20 dark:from-stone-900 dark:to-stone-950 rounded-2xl border border-amber-500/25 dark:border-amber-500/15 shadow-2xs hover:shadow-md hover:border-amber-500/45 dark:hover:border-amber-400/40 transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.99]"
        dir="rtl"
      >
        {/* Subtle Decorative Gradient Bar */}
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-amber-500/40 via-emerald-500/50 to-amber-500/40" />

        {/* Compact Image or Icon Emblem */}
        <div className="w-full sm:w-16 sm:h-16 h-28 shrink-0 rounded-xl overflow-hidden border border-amber-500/20 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-center relative shadow-2xs">
          {excerpt.mediaUrl ? (
            <img
              src={excerpt.mediaUrl}
              alt={excerpt.title || "مقتطف"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 dark:from-amber-500/10 dark:to-emerald-500/10 flex items-center justify-center">
              <Quote className="w-6 h-6 text-amber-600 dark:text-amber-400 transform scale-x-[-1]" />
            </div>
          )}
        </div>

        {/* Text Content - Full Title Display */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-right font-cairo">
          <h3 className="font-extrabold text-[13.5px] sm:text-[14.5px] text-slate-800 dark:text-white leading-snug break-words mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {excerpt.title || "مقتطف بدون عنوان"}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {hasAuthor && (
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/15">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[150px]">{excerpt.author}</span>
              </div>
            )}

            {hasSource && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/15">
                <Bookmark className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[150px]">{excerpt.source}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 dark:bg-stone-800 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs shrink-0 self-center">
          <ExternalLink className="w-3.5 h-3.5 transform scale-x-[-1]" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`relative group bg-gradient-to-b from-white via-white to-amber-50/15 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-2xl border border-amber-500/25 dark:border-amber-500/20 shadow-sm hover:shadow-xl hover:border-amber-500/50 dark:hover:border-amber-400/40 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        onSelect ? "cursor-pointer active:scale-[0.99]" : ""
      }`}
      dir="rtl"
    >
      {/* Decorative Ambient Aura */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-emerald-500/10 via-teal-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 via-emerald-600/70 to-amber-500/50" />

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Card Header: Title & Actions */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-400/25 to-emerald-500/15 border border-amber-500/30 dark:border-amber-400/25 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 shadow-xs mt-0.5">
                <Quote className="w-4 h-4 transform scale-x-[-1]" />
              </div>
              
              {/* Full Title - Unclipped & Fully Visible */}
              <h3 className="font-extrabold text-[14.5px] sm:text-[16px] text-slate-900 dark:text-white font-cairo leading-snug break-words group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors flex-1">
                {excerpt.title || "مقتطف بدون عنوان"}
              </h3>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && excerpt.status && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.();
                  }}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors font-cairo cursor-pointer shadow-xs ${
                    excerpt.status === "published"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-500/30"
                  }`}
                  title="انقر لتغيير حالة النشر"
                >
                  {excerpt.status === "published" ? "منشور" : "مسودة"}
                </button>
              )}

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="نسخ نص المقتطف"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                title="مشاركة المقتطف"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Excerpt Body: Only shown when showFull is true (e.g. preview modal) */}
          {showFull && (
            <div className="relative my-2 p-3 sm:p-3.5 rounded-xl bg-amber-50/35 dark:bg-stone-950/50 border border-amber-500/15 dark:border-stone-800">
              <Quote className="absolute -top-1.5 -right-1.5 w-5 h-5 text-amber-500/20 dark:text-amber-400/15 pointer-events-none transform scale-x-[-1]" />
              <p className="text-[13px] sm:text-[14px] font-medium text-slate-800 dark:text-slate-200 font-cairo leading-[1.95] text-justify">
                {excerpt.content || "لا يوجد نص للمقتطف."}
              </p>
            </div>
          )}

          {/* Optional Media Image */}
          {excerpt.mediaUrl && (
            <div className="my-2.5 rounded-xl overflow-hidden border border-amber-500/20 dark:border-stone-800 max-h-48 shadow-2xs">
              <img
                src={excerpt.mediaUrl}
                alt={excerpt.title || "صورة المقتطف"}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Card Footer: Metadata (Author & Source conditionally rendered) */}
        <div className="mt-3 pt-3 border-t border-dashed border-amber-500/20 dark:border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-[11.5px] font-cairo text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              {/* Author (conditionally rendered) */}
              {hasAuthor && (
                <div className="flex items-center gap-1.5 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-2xs">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold">{excerpt.author}</span>
                </div>
              )}

              {/* Source/Book - ONLY rendered when source is present and non-empty */}
              {hasSource && (
                <div className="flex items-center gap-1.5 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/20 shadow-2xs">
                  <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-bold">{excerpt.source}</span>
                </div>
              )}
            </div>

            {/* Read More Hint on interactive cards */}
            {onSelect && !isAdmin && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-[-2px] transition-transform">
                <span>عرض التفاصيل</span>
                <ExternalLink className="w-3 h-3 transform scale-x-[-1]" />
              </div>
            )}
          </div>

          {/* Admin Edit / Delete Actions */}
          {isAdmin && (
            <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-stone-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors font-cairo cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                تعديل
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-cairo cursor-pointer"
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

      if (!editingId) {
        sendFCMNotification(
          "مقتطف جديد",
          payload.title || "مقتطف جديد من هدي القرآن",
          "excerpt",
          id,
          ""
        );
      }

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
                      <BookOpen className="w-3.5 h-3.5" />
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
