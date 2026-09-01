import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  FileText, 
  Video, 
  Zap, 
  Crown, 
  RefreshCw,
  AlertCircle,
  MessageSquare,
  History,
  Send,
  Check,
  X,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, ApprovalStatus } from "../types";
import { sendFCMNotification } from "../utils/sendFCM";

interface ApprovalItem {
  id: string;
  collectionName: "news" | "articles" | "videos" | "urgentNews" | "leader";
  title: string;
  shortDescription?: string;
  content?: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  authorName?: string;
  approvalStatus?: ApprovalStatus;
  createdByUid?: string;
  createdByName?: string;
  createdByRole?: "admin" | "manager" | "editor" | "user";
  submittedAt?: number;
  createdAt: number;
  approvedByUid?: string;
  approvedByName?: string;
  approvedAt?: number;
  rejectedByUid?: string;
  rejectedByName?: string;
  rejectedAt?: number;
  rejectionReason?: string;
}

interface AdminContentApprovalsProps {
  userProfile: UserProfile | null;
  isAdmin?: boolean;
}

export function AdminContentApprovals({ userProfile, isAdmin }: AdminContentApprovalsProps) {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<ApprovalItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ApprovalItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [approvingItem, setApprovingItem] = useState<ApprovalItem | null>(null);
  const [sendNotifOnApprove, setSendNotifOnApprove] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const collections: ("news" | "articles" | "videos" | "urgentNews" | "leader")[] = [
    "news", "articles", "videos", "urgentNews", "leader"
  ];

  const fetchApprovalContent = async () => {
    setLoading(true);
    try {
      const allFetched: ApprovalItem[] = [];

      for (const col of collections) {
        try {
          const snap = await getDocs(query(collection(db, col), orderBy("createdAt", "desc")));
          snap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            // Include item if it has approvalStatus or createdByRole === 'editor' or is pending
            const isEditorContent = data.createdByRole === "editor";
            const hasApprovalStatus = !!data.approvalStatus;

            if (isEditorContent || hasApprovalStatus || data.approvalStatus === "pending_approval") {
              allFetched.push({
                id: docSnap.id,
                collectionName: col,
                title: data.title || data.text || "محتوى بدون عنوان",
                shortDescription: data.shortDescription || data.description || "",
                content: data.content || "",
                imageUrl: data.imageUrl || data.thumbnailUrl || "",
                category: data.category || "",
                author: data.author || data.authorName || data.createdByName || "غير معروف",
                approvalStatus: data.approvalStatus || (isEditorContent ? "pending_approval" : "published"),
                createdByUid: data.createdByUid || "",
                createdByName: data.createdByName || data.author || data.authorName || "Editor",
                createdByRole: data.createdByRole || "editor",
                submittedAt: data.submittedAt || data.createdAt,
                createdAt: data.createdAt || Date.now(),
                approvedByUid: data.approvedByUid,
                approvedByName: data.approvedByName,
                approvedAt: data.approvedAt,
                rejectedByUid: data.rejectedByUid,
                rejectedByName: data.rejectedByName,
                rejectedAt: data.rejectedAt,
                rejectionReason: data.rejectionReason,
              });
            }
          });
        } catch (e) {
          console.warn(`Error fetching ${col} for approval list:`, e);
        }
      }

      // Sort by submittedAt or createdAt descending
      allFetched.sort((a, b) => (b.submittedAt || b.createdAt) - (a.submittedAt || a.createdAt));
      setItems(allFetched);
    } catch (e) {
      console.error("Error loading approval content:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalContent();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async () => {
    if (!approvingItem) return;
    setActionLoading(true);
    const approverName = userProfile?.displayName || "المسؤول المعين";
    const approverUid = userProfile?.uid || "";
    const now = Date.now();

    try {
      const docRef = doc(db, approvingItem.collectionName, approvingItem.id);
      await updateDoc(docRef, {
        approvalStatus: "published",
        publishStatus: "published",
        approvedByUid: approverUid,
        approvedByName: approverName,
        approvedAt: now,
      });

      // Optionally send notification
      if (sendNotifOnApprove) {
        const notifTitle = `${getTypeLabel(approvingItem.collectionName)} | ${approvingItem.title}`;
        sendFCMNotification(
          notifTitle,
          approvingItem.shortDescription || "",
          approvingItem.collectionName === "urgentNews" ? "news" : approvingItem.collectionName,
          approvingItem.id,
          approvingItem.imageUrl
        );
      }

      showToast("تمت الموافقة على المحتوى ونشره بنجاح");
      setApprovingItem(null);
      await fetchApprovalContent();
    } catch (e) {
      console.error("Error approving item:", e);
      alert("حدث خطأ أثناء الموافقة على المحتوى");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem) return;
    setActionLoading(true);
    const rejecterName = userProfile?.displayName || "المسؤول المعين";
    const rejecterUid = userProfile?.uid || "";
    const now = Date.now();

    try {
      const docRef = doc(db, rejectingItem.collectionName, rejectingItem.id);
      await updateDoc(docRef, {
        approvalStatus: "rejected",
        publishStatus: "draft",
        rejectedByUid: rejecterUid,
        rejectedByName: rejecterName,
        rejectedAt: now,
        rejectionReason: rejectionReasonInput.trim() || "لم يتم تحديد سبب الرفض",
      });

      showToast("تم رفض المحتوى وتسجيل القرار بنجاح");
      setRejectingItem(null);
      setRejectionReasonInput("");
      await fetchApprovalContent();
    } catch (e) {
      console.error("Error rejecting item:", e);
      alert("حدث خطأ أثناء رفض المحتوى");
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeLabel = (col: string) => {
    switch (col) {
      case "news": return "خبر";
      case "articles": return "مقال";
      case "videos": return "فيديو";
      case "urgentNews": return "خبر عاجل";
      case "leader": return "السيد القائد";
      default: return "محتوى";
    }
  };

  const getTypeBadgeColor = (col: string) => {
    switch (col) {
      case "news": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "articles": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "videos": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "urgentNews": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "leader": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatusBadge = (status?: ApprovalStatus) => {
    switch (status) {
      case "pending_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            بانتظار الموافقة
          </span>
        );
      case "published":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            تمت الموافقة والنشر
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-500/10 text-gray-600 border border-gray-500/20">
            <Clock className="w-3.5 h-3.5" />
            قيد المراجعة
          </span>
        );
    }
  };

  // Filter items
  const pendingItems = items.filter(i => i.approvalStatus === "pending_approval");
  const historyItems = items.filter(i => i.approvalStatus !== "pending_approval");

  const displayedList = (activeTab === "pending" ? pendingItems : historyItems).filter(i => {
    const matchesType = selectedType === "all" || i.collectionName === selectedType;
    const matchesSearch = 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.createdByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.author?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in font-cairo" dir="rtl">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl font-black text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-text-primary">
              مراجعة والموافقة على المحتوى
            </h2>
            <p className="text-xs text-text-muted font-bold">
              إدارة طلبات النشر المقدمة من المحررين (Editors) والاطلاع على سجل الموافقات
            </p>
          </div>
        </div>

        <button
          onClick={fetchApprovalContent}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-border-light hover:bg-surface-hover text-text-primary rounded-xl text-xs font-black transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث القائمة
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mb-1">بانتظار الموافقة</p>
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200">{pendingItems.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-black">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">تمت الموافقة والنشر</p>
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
              {historyItems.filter(i => i.approvalStatus === "published" || i.approvalStatus === "approved").length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/10 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold mb-1">المحتوى المرفوض</p>
            <h3 className="text-2xl font-black text-rose-900 dark:text-rose-200">
              {historyItems.filter(i => i.approvalStatus === "rejected").length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-black">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Filter & Tabs Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface-card p-3 rounded-2xl border border-border-light shadow-sm">
        {/* Main Tab Toggle */}
        <div className="flex items-center gap-1 bg-surface-main p-1 rounded-xl border border-border-light shrink-0">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Clock className="w-4 h-4" />
            بانتظار الموافقة
            {pendingItems.length > 0 && (
              <span className="bg-white/30 text-white px-2 py-0.5 rounded-full text-[10px]">
                {pendingItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "history"
                ? "bg-taiz-navy text-white shadow-md shadow-taiz-navy/20"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <History className="w-4 h-4" />
            سجل القرارات والموافقات
          </button>
        </div>

        {/* Search & Collection Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1 lg:max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-text-muted" />
            <input
              type="text"
              placeholder="بحث بالعنوان أو اسم المحرر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-surface-main border border-border-light rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-taiz-sky/20"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-2 bg-surface-main border border-border-light rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-taiz-sky/20"
          >
            <option value="all">جميع الأنواع</option>
            <option value="news">الأخبار</option>
            <option value="articles">المقالات</option>
            <option value="videos">الفيديوهات</option>
            <option value="urgentNews">الأخبار العاجلة</option>
            <option value="leader">السيد القائد</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-taiz-sky mb-3" />
          <p className="text-xs text-text-muted font-bold">جاري تحميل المحتوى للمراجعة...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-16 text-center bg-surface-card rounded-2xl border border-dashed border-border-light p-8">
          <ShieldCheck className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-black text-text-primary mb-1">
            {activeTab === "pending" ? "لا يوجد محتوى بانتظار الموافقة حالياً" : "لا يوجد سجل قرارات مطابقة للبحث"}
          </h3>
          <p className="text-xs text-text-muted font-bold max-w-sm mx-auto">
            {activeTab === "pending"
              ? "جميع المواد المنشورة من قبل المحررين تم مراجعتها واتخاذ القرار بشأنها."
              : "تأكد من اختيار نوع الفلترة المناسب أو تغيير كلمة البحث."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((item) => (
            <motion.div
              key={`${item.collectionName}-${item.id}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-card p-4 sm:p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Content Header & Badges */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-border-light"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-main flex items-center justify-center shrink-0 border border-border-light text-text-muted">
                      <FileText className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getTypeBadgeColor(item.collectionName)}`}>
                        {getTypeLabel(item.collectionName)}
                      </span>
                      {getStatusBadge(item.approvalStatus)}
                      {item.createdByRole && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-text-muted border border-border-light">
                          منشئ: {item.createdByRole}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-sm sm:text-base text-text-primary line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {item.shortDescription && (
                      <p className="text-xs text-text-muted line-clamp-2 font-bold">
                        {item.shortDescription}
                      </p>
                    )}

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] font-bold text-text-muted pt-1">
                      <div className="flex items-center gap-1 text-taiz-navy dark:text-taiz-sky">
                        <User className="w-3.5 h-3.5" />
                        <span>المحرر: <strong>{item.createdByName || item.author}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تاريخ الإرسال: {new Date(item.submittedAt || item.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-light">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-main hover:bg-surface-hover text-text-primary rounded-xl text-xs font-black transition-all border border-border-light shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-taiz-sky" />
                    معاينة التفاصيل
                  </button>

                  {item.approvalStatus === "pending_approval" && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setApprovingItem(item)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        موافقة ونشر
                      </button>

                      <button
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReasonInput("");
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/20"
                      >
                        <X className="w-4 h-4" />
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval/Rejection Log details if available */}
              {(item.approvedByName || item.rejectedByName) && (
                <div className="bg-surface-main p-3 rounded-xl border border-border-light text-xs font-bold space-y-1">
                  {item.approvedByName && (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        تمت الموافقة والنشر بواسطة: <strong>{item.approvedByName}</strong> بتاريخ{" "}
                        {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                      </span>
                    </div>
                  )}

                  {item.rejectedByName && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                        <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>
                          تم الرفض بواسطة: <strong>{item.rejectedByName}</strong> بتاريخ{" "}
                          {item.rejectedAt ? new Date(item.rejectedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                        </span>
                      </div>
                      {item.rejectionReason && (
                        <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 pr-6 italic">
                          سبب الرفض: "{item.rejectionReason}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col border border-border-light"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getTypeBadgeColor(previewItem.collectionName)}`}>
                    {getTypeLabel(previewItem.collectionName)}
                  </span>
                  {getStatusBadge(previewItem.approvalStatus)}
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-xl hover:bg-surface-hover text-text-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-right">
                <h2 className="text-xl font-black text-text-primary leading-tight">
                  {previewItem.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-text-muted bg-surface-main p-3 rounded-xl">
                  <div>المحرر: <strong>{previewItem.createdByName || previewItem.author}</strong></div>
                  <div>تاريخ الإنشاء: {new Date(previewItem.submittedAt || previewItem.createdAt).toLocaleDateString("ar-EG")}</div>
                </div>

                {previewItem.imageUrl && (
                  <img
                    src={previewItem.imageUrl}
                    alt={previewItem.title}
                    className="w-full max-h-72 object-cover rounded-xl border border-border-light shadow-sm"
                  />
                )}

                {previewItem.shortDescription && (
                  <div className="p-3 bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold border border-amber-500/20">
                    <p className="font-black mb-1">الموجز / الوصف القصير:</p>
                    <p>{previewItem.shortDescription}</p>
                  </div>
                )}

                {previewItem.content && (
                  <div className="prose dark:prose-invert max-w-none text-sm text-text-primary leading-relaxed whitespace-pre-line font-medium bg-surface-main p-4 rounded-xl border border-border-light">
                    {previewItem.content}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border-light flex items-center justify-between gap-3">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 bg-surface-main hover:bg-surface-hover text-text-primary rounded-xl text-xs font-black transition-all border border-border-light"
                >
                  إغلاق
                </button>

                {previewItem.approvalStatus === "pending_approval" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setApprovingItem(previewItem);
                        setPreviewItem(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      موافقة ونشر
                    </button>

                    <button
                      onClick={() => {
                        setRejectingItem(previewItem);
                        setRejectionReasonInput("");
                        setPreviewItem(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      رفض
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve Modal */}
      <AnimatePresence>
        {approvingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-border-light space-y-4"
            >
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle className="w-8 h-8" />
                <h3 className="text-lg font-black text-text-primary">
                  تأكيد الموافقة والنشر
                </h3>
              </div>

              <p className="text-xs font-bold text-text-muted leading-relaxed">
                هل أنت تأكد من رغبتك في الموافقة على المحتوى التالي ونشره مباشرة للمستخدمين؟
              </p>

              <div className="p-3 bg-surface-main rounded-xl border border-border-light text-xs font-bold text-text-primary">
                "{approvingItem.title}"
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none pt-2">
                <input
                  type="checkbox"
                  checked={sendNotifOnApprove}
                  onChange={(e) => setSendNotifOnApprove(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                إرسال إشعار فوري للمستخدمين عند النشر
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-light">
                <button
                  onClick={() => setApprovingItem(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-surface-main hover:bg-surface-hover text-text-primary rounded-xl text-xs font-black transition-all border border-border-light"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  تأكيد ونشر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-border-light space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <XCircle className="w-8 h-8" />
                <h3 className="text-lg font-black text-text-primary">
                  تأكيد رفض المحتوى
                </h3>
              </div>

              <p className="text-xs font-bold text-text-muted leading-relaxed">
                سيتم حفظ قرار الرفض وتوثيق اسمك وتاريخ القرار في السجل. يمكنك تدوين سبب الرفض أدناه ليطلع عليه المحرر:
              </p>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  سبب الرفض (اختياري):
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="مثال: يرجى تعديل الصياغة وإضافة المصدر الرسمي..."
                  className="w-full p-3 bg-surface-main border border-border-light rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-light">
                <button
                  onClick={() => setRejectingItem(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-surface-main hover:bg-surface-hover text-text-primary rounded-xl text-xs font-black transition-all border border-border-light"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  تأكيد الرفض
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
