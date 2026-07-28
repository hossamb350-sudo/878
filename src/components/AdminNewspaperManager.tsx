import React, { useState, useEffect } from "react";
import {
  NewspaperIssue,
  NewspaperPage,
  NewspaperArticleRef,
  NewspaperAuditLog,
  NewsItem,
  Article,
  UserProfile,
} from "../types";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Sparkles,
  FileText,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  Settings,
  User,
  Quote,
  Image,
  ArrowUp,
  ArrowDown,
  Printer,
  Download,
  Share2,
  Clock,
  Shield,
  Send,
  Save,
  X,
  PlusCircle,
  HelpCircle,
  Check,
  AlertTriangle,
  History,
  Copy,
} from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { NewspaperReader } from "./NewspaperReader";
import { NewspaperTemplatesGallery } from "./NewspaperTemplatesGallery";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

interface AdminNewspaperManagerProps {
  userProfile?: UserProfile | null;
}

const STORAGE_KEY_ISSUES = "taiz_newspaper_issues_local_v1";
const STORAGE_KEY_LOGS = "taiz_newspaper_logs_local_v1";

const DEFAULT_SAMPLE_ISSUE: NewspaperIssue = {
  id: "issue-sample-1",
  title: "صحيفة تعز الإعلامية",
  subTitle: "صحيفة إلكترونية شمولية - جاهزة للطباعة والتصدير الخارجي",
  issueNumber: "العدد 1",
  publishDate: new Date().toISOString().split("T")[0],
  hijriDate: "1447 هـ",
  mainHeadline: "افتتاحية التغطية الإعلامية الخاصة بمحافظة تعز",
  mainHeadlineSummary: "تغطية شاملة وموسعة لكافة المستجدات التنموية والخدمية والمحلية جاهزة للطباعة.",
  chiefEditorName: "رئيس التحرير",
  chiefEditorTitle: "منصة تعز الإعلامية",
  editorNoteTitle: "كلمة العدد",
  editorNoteContent: "نرحب بقراء منصة تعز الإعلامية في هذا العدد الأول المجهز للطباعة والتوزيع الخارجي.",
  theme: "classic",
  accentColor: "#1e3a8a",
  status: "draft",
  createdBy: "admin",
  createdByName: "مدير النظام",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pages: [
    {
      id: "page-1",
      pageNumber: 1,
      pageType: "cover",
      title: "الغلاف الرئيسي",
      gridColumns: 3,
      items: [],
    },
    {
      id: "page-2",
      pageNumber: 2,
      pageType: "news",
      title: "الأخبار والشؤون المحلية",
      gridColumns: 3,
      items: [],
    },
    {
      id: "page-3",
      pageNumber: 3,
      pageType: "articles",
      title: "المقالات وأعمدة الرأي",
      gridColumns: 2,
      items: [],
    },
    {
      id: "page-4",
      pageNumber: 4,
      pageType: "reports",
      title: "التقارير والتحقيقات",
      gridColumns: 2,
      items: [],
    },
  ],
};

const saveIssuesToStorage = (data: NewspaperIssue[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving issues to localStorage", e);
  }
};

const saveLogsToStorage = (data: NewspaperAuditLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving logs to localStorage", e);
  }
};

export const AdminNewspaperManager: React.FC<AdminNewspaperManagerProps> = ({
  userProfile,
}) => {
  const [issues, setIssues] = useState<NewspaperIssue[]>([]);
  const [logs, setLogs] = useState<NewspaperAuditLog[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view: 'list' | 'builder' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<"list" | "builder" | "logs">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Preview State
  const [previewIssue, setPreviewIssue] = useState<NewspaperIssue | null>(null);

  // Issue Builder Form State
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState<Partial<NewspaperIssue>>({
    title: "صحيفة تعز الإعلامية",
    subTitle: "صحيفة إلكترونية شمولية تصدر عن منصة تعز الإعلامية",
    issueNumber: `العدد ${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
    publishDate: new Date().toISOString().split("T")[0],
    hijriDate: "1447 هـ",
    mainHeadline: "افتتاحية التغطية الإعلامية الخاصة بمحافظة تعز",
    mainHeadlineSummary: "تغطية شاملة وموسعة لكافة المستجدات التنموية والخدمية والمحلية.",
    chiefEditorName: "رئيس التحرير",
    chiefEditorTitle: "منصة تعز الإعلامية",
    editorNoteTitle: "كلمة العدد",
    editorNoteContent: "نرحب بقراء منصة تعز الإعلامية في هذا العدد الجديد الذي يستعرض أبرز القضايا الوطنية والمحلية بأمانة صحفية ومهنية راقية.",
    theme: "classic",
    accentColor: "#1e3a8a",
    status: "draft",
    pages: [
      {
        id: "page-1",
        pageNumber: 1,
        pageType: "cover",
        title: "الغلاف الرئيسي",
        gridColumns: 3,
        items: [],
      },
      {
        id: "page-2",
        pageNumber: 2,
        pageType: "news",
        title: "الأخبار والشؤون المحلية",
        gridColumns: 3,
        items: [],
      },
      {
        id: "page-3",
        pageNumber: 3,
        pageType: "articles",
        title: "المقالات وأعمدة الرأي",
        gridColumns: 2,
        items: [],
      },
      {
        id: "page-4",
        pageNumber: 4,
        pageType: "reports",
        title: "التقارير والتحقيقات",
        gridColumns: 2,
        items: [],
      },
    ],
  });

  // Builder Sub-Step: 1: Brand & Details | 2: Content Selection | 3: Visual Layout | 4: Finalize
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPageIdx, setSelectedPageIdx] = useState<number>(0);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showTemplatesGallery, setShowTemplatesGallery] = useState(false);

  // Content Selection Filters for Step 2
  const [contentCategoryFilter, setContentCategoryFilter] = useState<string>("all");
  const [contentSearchTerm, setContentSearchTerm] = useState("");

  // Load Local Data (decoupled from database)
  useEffect(() => {
    // Load local issues
    try {
      const savedIssuesStr = localStorage.getItem(STORAGE_KEY_ISSUES);
      if (savedIssuesStr) {
        setIssues(JSON.parse(savedIssuesStr));
      } else {
        setIssues([DEFAULT_SAMPLE_ISSUE]);
        localStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify([DEFAULT_SAMPLE_ISSUE]));
      }
    } catch (e) {
      console.error("Error reading issues from localStorage", e);
      setIssues([DEFAULT_SAMPLE_ISSUE]);
    }

    // Load local logs
    try {
      const savedLogsStr = localStorage.getItem(STORAGE_KEY_LOGS);
      if (savedLogsStr) {
        setLogs(JSON.parse(savedLogsStr));
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Error reading logs from localStorage", e);
    }

    setIsLoading(false);

    // Fetch News & Articles safely if available in site database
    let active = true;
    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubNews = onSnapshot(
      qNews,
      (snapshot) => {
        if (!active) return;
        const data: NewsItem[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as NewsItem);
        });
        setNewsList(data);
      },
      (err) => {
        console.warn("News collection listener warning:", err);
      }
    );

    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubArticles = onSnapshot(
      qArticles,
      (snapshot) => {
        if (!active) return;
        const data: Article[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Article);
        });
        setArticlesList(data);
      },
      (err) => {
        console.warn("Articles collection listener warning:", err);
      }
    );

    return () => {
      active = false;
      unsubNews();
      unsubArticles();
    };
  }, []);

  // Record audit log entry locally
  const addAuditLog = (
    issueId: string,
    issueNumber: string,
    action: NewspaperAuditLog["action"],
    details: string
  ) => {
    const newLog: NewspaperAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      issueId,
      issueNumber: issueNumber || "غير محدد",
      action,
      userId: userProfile?.uid || "admin",
      userName: userProfile?.displayName || "مدير النظام",
      userRole: userProfile?.role || "admin",
      details,
      timestamp: Date.now(),
    };
    setLogs((prev) => {
      const updated = [newLog, ...prev];
      saveLogsToStorage(updated);
      return updated;
    });
  };

  // Reset or initialize new issue form
  const handleStartNewIssue = () => {
    setEditingIssueId(null);
    setIssueForm({
      title: "صحيفة تعز الإعلامية",
      subTitle: "صحيفة إلكترونية شمولية تصدر عن منصة تعز الإعلامية - إعداد للطباعة",
      issueNumber: `العدد ${issues.length + 1}`,
      publishDate: new Date().toISOString().split("T")[0],
      hijriDate: "1447 هـ",
      mainHeadline: "أحدث التغطيات والأخبار الوطنية والمحلية",
      mainHeadlineSummary: "متابعة شاملة للمستجدات والتقارير الصحفية والتحليلات الإخبارية.",
      chiefEditorName: userProfile?.displayName || "رئيس التحرير",
      chiefEditorTitle: "منصة تعز الإعلامية",
      editorNoteTitle: "كلمة العدد",
      editorNoteContent: "نقدم لكم في هذا العدد باقة من أهم التغطيات والتقارير والمقالات التحليلية المجهزة للطباعة والتوزيع الخارجي.",
      theme: "classic",
      status: "draft",
      pages: [
        {
          id: "page-1",
          pageNumber: 1,
          pageType: "cover",
          title: "الغلاف الرئيسي",
          gridColumns: 3,
          items: [],
        },
        {
          id: "page-2",
          pageNumber: 2,
          pageType: "news",
          title: "الأخبار والشؤون المحلية",
          gridColumns: 3,
          items: [],
        },
        {
          id: "page-3",
          pageNumber: 3,
          pageType: "articles",
          title: "المقالات وأعمدة الرأي",
          gridColumns: 2,
          items: [],
        },
        {
          id: "page-4",
          pageNumber: 4,
          pageType: "reports",
          title: "التقارير والتحقيقات",
          gridColumns: 2,
          items: [],
        },
      ],
    });
    setBuilderStep(1);
    setActiveSubTab("builder");
  };

  // Edit existing issue
  const handleEditIssue = (issue: NewspaperIssue) => {
    setEditingIssueId(issue.id);
    setIssueForm({ ...issue });
    setBuilderStep(1);
    setActiveSubTab("builder");
  };

  // Save Issue (Draft or Prepared for Print)
  const handleSaveIssue = (targetStatus?: NewspaperIssue["status"]) => {
    try {
      const finalStatus = targetStatus || issueForm.status || "draft";
      const now = Date.now();
      const issueId = editingIssueId || `issue-${Date.now()}`;

      const savedIssue: NewspaperIssue = {
        id: issueId,
        title: issueForm.title || "صحيفة تعز الإعلامية",
        subTitle: issueForm.subTitle || "",
        issueNumber: issueForm.issueNumber || "العدد 1",
        publishDate: issueForm.publishDate || new Date().toISOString().split("T")[0],
        hijriDate: issueForm.hijriDate || "",
        mainHeadline: issueForm.mainHeadline || "",
        mainHeadlineSummary: issueForm.mainHeadlineSummary || "",
        coverImage: issueForm.coverImage || "",
        chiefEditorName: issueForm.chiefEditorName || "",
        chiefEditorTitle: issueForm.chiefEditorTitle || "",
        editorNoteTitle: issueForm.editorNoteTitle || "",
        editorNoteContent: issueForm.editorNoteContent || "",
        logoUrl: issueForm.logoUrl || "",
        theme: issueForm.theme || "classic",
        accentColor: issueForm.accentColor || "#1e3a8a",
        pages: issueForm.pages || [],
        status: finalStatus,
        createdBy: userProfile?.uid || "admin",
        createdByName: userProfile?.displayName || "مدير المنصة",
        createdAt: issueForm.createdAt || now,
        updatedAt: now,
        publishedAt: finalStatus === "published" ? now : issueForm.publishedAt,
      };

      setIssues((prev) => {
        let updated: NewspaperIssue[];
        if (editingIssueId) {
          updated = prev.map((item) => (item.id === editingIssueId ? savedIssue : item));
        } else {
          updated = [savedIssue, ...prev];
        }
        saveIssuesToStorage(updated);
        return updated;
      });

      addAuditLog(
        issueId,
        savedIssue.issueNumber,
        editingIssueId ? (finalStatus === "published" ? "publish" : "edit") : "create",
        editingIssueId
          ? `تم تحديث وتجهيز الإصدار للطباعة (${finalStatus})`
          : `تم إعداد مسودة إصدار جديد للطباعة (${finalStatus})`
      );

      alert(
        finalStatus === "published"
          ? "تم حفظ وتجهيز إخراج الإصدار للطباعة والتصدير الخارجي بنجاح!"
          : "تم حفظ مسودة إخراج الصحيفة محلياً بنجاح."
      );
      setActiveSubTab("list");
    } catch (err) {
      console.error("Error saving issue:", err);
      alert("حدث خطأ أثناء حفظ الإصدار محلياً.");
    }
  };

  // Delete Issue
  const handleDeleteIssue = (id: string, issueNumber: string) => {
    if (!window.confirm(`هل أنت تأكد من حذف الإصدار (${issueNumber})؟`)) return;
    setIssues((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveIssuesToStorage(updated);
      return updated;
    });
    addAuditLog(id, issueNumber, "delete", "تم حذف الإصدار محلياً من أداة الإخراج.");
  };

  // Add Item to active page in builder
  const handleAddItemToPage = (item: NewsItem | Article, sourceType: "news" | "article") => {
    if (!issueForm.pages || issueForm.pages.length === 0) return;

    const pages = [...issueForm.pages];
    const targetPage = pages[selectedPageIdx] || pages[0];

    // Check if already added
    if (targetPage.items.some((it) => it.sourceId === item.id)) {
      alert("هذه المادة مضافة بالفعل في هذه الصفحة!");
      return;
    }

    const newItem: NewspaperArticleRef = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sourceType,
      sourceId: item.id,
      title: item.title,
      subtitle: (item as NewsItem).shortDescription || "",
      content: item.content || "",
      imageUrl: item.imageUrl,
      category: item.category || "عام",
      authorName: (item as Article).authorName || (item as NewsItem).author || "",
      authorPhoto: (item as Article).authorPhoto,
      columns: 1,
      featuredBox: false,
      order: targetPage.items.length + 1,
    };

    targetPage.items.push(newItem);
    setIssueForm({ ...issueForm, pages });
  };

  // Remove item from active page
  const handleRemoveItemFromPage = (itemId: string) => {
    if (!issueForm.pages) return;
    const pages = [...issueForm.pages];
    const targetPage = pages[selectedPageIdx];
    if (!targetPage) return;

    targetPage.items = targetPage.items.filter((it) => it.id !== itemId);
    setIssueForm({ ...issueForm, pages });
  };

  // Reorder item up/down
  const handleMoveItemOrder = (itemId: string, direction: "up" | "down") => {
    if (!issueForm.pages) return;
    const pages = [...issueForm.pages];
    const targetPage = pages[selectedPageIdx];
    if (!targetPage) return;

    const idx = targetPage.items.findIndex((it) => it.id === itemId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const temp = targetPage.items[idx];
      targetPage.items[idx] = targetPage.items[idx - 1];
      targetPage.items[idx - 1] = temp;
    } else if (direction === "down" && idx < targetPage.items.length - 1) {
      const temp = targetPage.items[idx];
      targetPage.items[idx] = targetPage.items[idx + 1];
      targetPage.items[idx + 1] = temp;
    }

    setIssueForm({ ...issueForm, pages });
  };

  // Update Item Formatting
  const handleUpdateItemFormat = (
    itemId: string,
    updates: Partial<NewspaperArticleRef>
  ) => {
    if (!issueForm.pages) return;
    const pages = [...issueForm.pages];
    const targetPage = pages[selectedPageIdx];
    if (!targetPage) return;

    targetPage.items = targetPage.items.map((it) =>
      it.id === itemId ? { ...it, ...updates } : it
    );
    setIssueForm({ ...issueForm, pages });
  };

  // Add Page
  const handleAddPage = () => {
    if (!issueForm.pages) return;
    const newPageNum = issueForm.pages.length + 1;
    const newPage: NewspaperPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNum,
      pageType: "news",
      title: `صفحة جديدة (${newPageNum})`,
      gridColumns: 3,
      items: [],
    };

    setIssueForm({ ...issueForm, pages: [...issueForm.pages, newPage] });
    setSelectedPageIdx(issueForm.pages.length);
  };

  // Remove Page
  const handleRemovePage = (pIdx: number) => {
    if (!issueForm.pages || issueForm.pages.length <= 1) {
      alert("يجب أن تحتوي الصحيفة على صفحة واحدة على الأقل!");
      return;
    }
    const pages = issueForm.pages.filter((_, idx) => idx !== pIdx);
    setIssueForm({ ...issueForm, pages });
    setSelectedPageIdx(Math.max(0, pIdx - 1));
  };

  // AI Helper 1: Generate Editorial Note with Gemini API
  const handleAiGenerateEditorial = async () => {
    setAiLoading("editorial");
    try {
      const res = await fetch("/api/newspaper/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "generate_editorial",
          issueData: issueForm,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setIssueForm((prev) => ({
          ...prev,
          editorNoteTitle: data.title || "افتتاحية العدد",
          editorNoteContent: data.content,
        }));
      }
    } catch (err) {
      console.error("AI Editorial error:", err);
      alert("حدث خطأ أثناء توليد الافتتاحية بالذكاء الاصطناعي.");
    } finally {
      setAiLoading(null);
    }
  };

  // AI Helper 2: Auto Layout Distribution
  const handleAiAutoLayout = async () => {
    setAiLoading("autolayout");
    try {
      const allSelected = [...newsList.slice(0, 10), ...articlesList.slice(0, 5)];
      const res = await fetch("/api/newspaper/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "auto_layout",
          selectedItems: allSelected.map(item => ({
             ...item,
             sourceType: (item as any).authorName ? "article" : "news"
          })),
        }),
      });
      const data = await res.json();

      if (data.pages && Array.isArray(data.pages)) {
        // Automatically populate pages with AI suggestions
        const newPages: NewspaperPage[] = data.pages.map((p: any, idx: number) => ({
          id: `page-ai-${idx + 1}`,
          pageNumber: p.pageNumber || idx + 1,
          pageType: p.pageType || "news",
          title: p.title || `صفحة ${idx + 1}`,
          gridColumns: p.gridColumns || 6,
          columnGap: p.columnGap || 5,
          layoutTemplate: p.layoutTemplate,
          items: (p.items || [])
            .map((pItem: any, itemIdx: number) => {
              const newsMatch = newsList.find((n) => n.id === pItem.id);
              const articleMatch = articlesList.find((a) => a.id === pItem.id);
              const match = newsMatch || articleMatch;
              
              if (!match && pItem.sourceType !== 'ad') return null;

              if (pItem.sourceType === 'ad') {
                return {
                  id: `ref-ad-${Math.random().toString(36).substring(2, 6)}`,
                  sourceType: "ad",
                  title: "إعلان",
                  content: "مساحة إعلانية",
                  importance: pItem.importance,
                  imageSize: pItem.imageSize,
                  colSpan: pItem.colSpan,
                  rowSpan: pItem.rowSpan,
                  columns: pItem.columns,
                  order: itemIdx,
                } as NewspaperArticleRef;
              }

              return {
                id: `ref-ai-${Math.random().toString(36).substring(2, 6)}`,
                sourceType: newsMatch ? "news" : "article",
                sourceId: match!.id,
                title: match!.title,
                subtitle: (match as NewsItem).shortDescription || "",
                content: match!.content,
                imageUrl: match!.imageUrl,
                category: match!.category || "عام",
                authorName: (match as Article).authorName || (match as NewsItem).author || "",
                
                importance: pItem.importance,
                imageSize: pItem.imageSize,
                colSpan: pItem.colSpan,
                rowSpan: pItem.rowSpan,
                columns: pItem.columns,
                
                order: itemIdx,
              } as NewspaperArticleRef;
            })
            .filter(Boolean),
        }));

        if (newPages.length > 0) {
          setIssueForm((prev) => ({
            ...prev,
            theme: data.theme || prev.theme,
            pageSize: data.pageSize || "broadsheet",
            fontFamily: data.fontFamily || "IBM Plex Sans Arabic",
            marginTop: data.marginTop || 20,
            marginBottom: data.marginBottom || 20,
            marginLeft: data.marginLeft || 15,
            marginRight: data.marginRight || 15,
            safeArea: data.safeArea || 12,
            pages: newPages,
          }));
          setSelectedPageIdx(0);
          alert("تم تطبيق التوزيع والإخراج البصري المقترح من الذكاء الاصطناعي بنجاح!");
        }
      }

      if (data.editorialSuggestions) {
        alert("ملاحظات المخرج الفني (AI): " + data.editorialSuggestions);
      }
    } catch (err) {
      console.error("AI Auto Layout error:", err);
      alert("تعذر تنفيذ الإخراج التلقائي حالياً.");
    } finally {
      setAiLoading(null);
    }
  };

  // AI Helper 3: Subheadings & Pull Quotes
  const handleAiEnhanceItem = async (item: NewspaperArticleRef) => {
    setAiLoading(item.id);
    try {
      const res = await fetch("/api/newspaper/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "enhance_subheadings",
          title: item.title,
          content: item.content,
        }),
      });
      const data = await res.json();
      if (data.subtitles && data.subtitles.length > 0) {
        handleUpdateItemFormat(item.id, {
          subtitle: data.subtitles[0],
          quote: data.pullQuote || item.quote,
          featuredBox: true,
        });
      }
    } catch (err) {
      console.error("AI Enhance error:", err);
    } finally {
      setAiLoading(null);
    }
  };

  // Filtered Issues for list view
  const filteredIssues = issues.filter((iss) => {
    const matchesStatus = statusFilter === "all" || iss.status === statusFilter;
    const matchesQuery =
      searchQuery === "" ||
      iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.issueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.mainHeadline?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Top Header Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e3a8a] text-white rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d49a37] to-[#b37f2c] flex items-center justify-center text-white shadow-lg">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              نظام إنشاء وإخراج الصحيفة الإلكترونية
            </h2>
            <p className="text-xs text-white/80 font-bold mt-1">
              تصميم، إدارة، وإخراج المطبوعات الإلكترونية الشاملة بنسق صحفي عالمي
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("list")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
              activeSubTab === "list"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الإصدارات والأرشيف ({issues.length})</span>
          </button>

          <button
            onClick={handleStartNewIssue}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء إصدار جديد</span>
          </button>

          <button
            onClick={() => setActiveSubTab("logs")}
            className={`p-2.5 rounded-xl font-bold text-xs transition-all ${
              activeSubTab === "logs"
                ? "bg-white text-slate-900"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="سجل التعديلات والصلاحيات"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Issues List & Archive */}
      {activeSubTab === "list" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث بالعدد، العنوان، أو المانشيت..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#d49a37]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {[
                { id: "all", label: "الكل" },
                { id: "published", label: "منشور" },
                { id: "draft", label: "مسودة" },
                { id: "under_review", label: "قيد المراجعة" },
                { id: "archived", label: "مؤرشف" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    statusFilter === st.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Newspaper Issues */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 font-bold">
              جاري تحميل قائمة الإصدارات الصحفية...
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIssues.map((iss) => (
                <div
                  key={iss.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Cover Header Preview */}
                    <div className="h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-[#1e3a8a] p-4 relative overflow-hidden text-white flex flex-col justify-between">
                      {iss.coverImage ? (
                        <img
                          src={iss.coverImage}
                          alt="Cover"
                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : null}

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-black border border-white/20">
                          {iss.issueNumber}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            iss.status === "published"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : iss.status === "draft"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : iss.status === "review"
                              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                              : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                          }`}
                        >
                          {iss.status === "published"
                            ? "منشور إلكترونياً"
                            : iss.status === "draft"
                            ? "مسودة"
                            : iss.status === "review"
                            ? "قيد المراجعة"
                            : "مؤرشف"}
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="font-black text-lg font-serif line-clamp-1">
                          {iss.title}
                        </h3>
                        <p className="text-[11px] opacity-80 font-bold">
                          تاريخ النشر: {iss.publishDate}
                        </p>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#d49a37] block mb-1">
                          المانشيت الرئيسي
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                          {iss.mainHeadline || "لم يحدد عنوان رئيسي بعد"}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          <span>{iss.pages?.length || 0} صفحات صحفية</span>
                        </div>
                        <div>منسق القالب: {iss.theme || "كلاسيكي"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewIssue(iss)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:brightness-110 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>تصفح</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditIssue(iss)}
                        className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                        title="تعديل الإصدار"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteIssue(iss.id, iss.issueNumber)}
                        className="p-2 rounded-xl hover:bg-red-100 text-red-600 transition-all"
                        title="حذف الإصدار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">
                لا توجد إصدارات صحفية مطابقة
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-bold">
                يمكنك إنشاء أول صحيفة إلكترونية متكاملة الآن وتحديد المانشيت والغلاف
                وتوزيع المقالات والأخبار بسهولة.
              </p>
              <button
                onClick={handleStartNewIssue}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white font-black text-xs shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء إصدرا صحفي جديد</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Issue Builder & Visual Designer */}
      {activeSubTab === "builder" && (
        <div className="space-y-6">
          {/* Builder Steps Navigation */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between overflow-x-auto gap-2">
            {[
              { step: 1, title: "1. الهوية والمعلومات", icon: Settings },
              { step: 2, title: "2. اختيار المحتوى", icon: FileText },
              { step: 3, title: "3. المصمم البصري والإخراج", icon: LayoutGrid },
              { step: 4, title: "4. النشر والتصدير", icon: CheckCircle },
            ].map((st) => (
              <button
                key={st.step}
                onClick={() => setBuilderStep(st.step as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
                  builderStep === st.step
                    ? "bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white shadow-md scale-102"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <st.icon className="w-4 h-4" />
                <span>{st.title}</span>
              </button>
            ))}
          </div>

          {/* STEP 1: Branding & Metadata */}
          {builderStep === 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <h3 className="text-lg font-black border-b pb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <span>هوية وبيانات العدد الصحفي</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">اسم الصحيفة</label>
                  <input
                    type="text"
                    value={issueForm.title || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">العنوان الفرعي / الشعار اللفظي</label>
                  <input
                    type="text"
                    value={issueForm.subTitle || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, subTitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">رقم الإصدار</label>
                  <input
                    type="text"
                    value={issueForm.issueNumber || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, issueNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">تاريخ النشر (ميلادي)</label>
                  <input
                    type="date"
                    value={issueForm.publishDate || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, publishDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">التاريخ الهجري</label>
                  <input
                    type="text"
                    value={issueForm.hijriDate || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, hijriDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">نمط وقالب التصميم</label>
                  <select
                    value={issueForm.theme || "classic"}
                    onChange={(e) => setIssueForm({ ...issueForm, theme: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  >
                    <option value="classic">كلاسيكي الصحف الوطنية (Classic Broadsheet)</option>
                    <option value="modern">عصري أزرق (Modern Press)</option>
                    <option value="minimal">بسيط وراقي (Minimalist)</option>
                    <option value="tabloid">تابلويد أحمر (Tabloid Style)</option>
                    <option value="dark_luxury">داكن فخم (Dark Luxury)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">مقاس الصحيفة (Page Size)</label>
                  <select
                    value={issueForm.pageSize || "broadsheet"}
                    onChange={(e) => setIssueForm({ ...issueForm, pageSize: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  >
                    <option value="broadsheet">Broadsheet (380 × 578 mm)</option>
                    <option value="berliner">Berliner (315 × 470 mm)</option>
                    <option value="tabloid">Tabloid (280 × 430 mm)</option>
                    <option value="a3">A3 (297 × 420 mm)</option>
                    <option value="a4">A4 (210 × 297 mm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">الخط الأساسي (Typography)</label>
                  <select
                    value={issueForm.fontFamily || "IBM Plex Sans Arabic"}
                    onChange={(e) => setIssueForm({ ...issueForm, fontFamily: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  >
                    <option value="'IBM Plex Sans Arabic', sans-serif">IBM Plex Sans Arabic</option>
                    <option value="'Cairo', sans-serif">Cairo</option>
                    <option value="'Tajawal', sans-serif">Tajawal</option>
                    <option value="'Almarai', sans-serif">Almarai</option>
                    <option value="'Readex Pro', sans-serif">Readex Pro</option>
                    <option value="'Noto Naskh Arabic', serif">Noto Naskh Arabic</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-black text-amber-600 mb-3">إعدادات الهوامش والمسافات (Margins)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">الهامش العلوي (mm)</label>
                    <input
                      type="number"
                      value={issueForm.marginTop || 20}
                      onChange={(e) => setIssueForm({ ...issueForm, marginTop: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">الهامش السفلي (mm)</label>
                    <input
                      type="number"
                      value={issueForm.marginBottom || 20}
                      onChange={(e) => setIssueForm({ ...issueForm, marginBottom: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">الهامش الأيمن (mm)</label>
                    <input
                      type="number"
                      value={issueForm.marginRight || 15}
                      onChange={(e) => setIssueForm({ ...issueForm, marginRight: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">الهامش الأيسر (mm)</label>
                    <input
                      type="number"
                      value={issueForm.marginLeft || 15}
                      onChange={(e) => setIssueForm({ ...issueForm, marginLeft: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Main Headline & Cover Hero */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-black text-amber-600">مانشيت الغلاف الرئيسي والصورة</h4>

                <div>
                  <label className="block text-xs font-bold mb-1.5">المانشيت الرئيسي (Main Headline)</label>
                  <input
                    type="text"
                    value={issueForm.mainHeadline || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, mainHeadline: e.target.value })}
                    placeholder="أدخل عنوان الغلاف الفاخر العريض..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">ملخص المانشيت</label>
                  <textarea
                    rows={2}
                    value={issueForm.mainHeadlineSummary || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, mainHeadlineSummary: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">صورة الغلاف الرئيسية</label>
                  <ImageUpload
                    label="صورة الغلاف الرئيسية"
                    value={issueForm.coverImage || ""}
                    onChange={(url) => setIssueForm({ ...issueForm, coverImage: url })}
                  />
                </div>
              </div>

              {/* Chief Editor Note Box */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-600">كلمة العدد / افتتاحية رئيس التحرير</h4>
                  <button
                    onClick={handleAiGenerateEditorial}
                    disabled={aiLoading === "editorial"}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-purple-700 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading === "editorial" ? "جاري التوليد..." : "كتابة بالذكاء الاصطناعي (AI)"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">اسم رئيس التحرير</label>
                    <input
                      type="text"
                      value={issueForm.chiefEditorName || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, chiefEditorName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">عنوان الافتتاحية</label>
                    <input
                      type="text"
                      value={issueForm.editorNoteTitle || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, editorNoteTitle: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">نص الافتتاحية الكامل</label>
                  <textarea
                    rows={4}
                    value={issueForm.editorNoteContent || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, editorNoteContent: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setBuilderStep(2)}
                  className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-black text-xs hover:brightness-110"
                >
                  التالي: اختيار المحتوى →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Content Selector */}
          {builderStep === 2 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>تجميع المواد الصحفية من الأخبار والمقالات</span>
                </h3>

                <span className="text-xs font-bold opacity-75">
                  الصفحة الحالية المستهدفة: {issueForm.pages?.[selectedPageIdx]?.title}
                </span>
              </div>

              {/* Page Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {issueForm.pages?.map((p, pIdx) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPageIdx(pIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      selectedPageIdx === pIdx
                        ? "bg-[#d49a37] text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    ص {p.pageNumber}: {p.title} ({p.items?.length || 0})
                  </button>
                ))}
              </div>

              {/* Available Content List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* News Items Column */}
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>الأخبار والتقارير ({newsList.length})</span>
                  </h4>

                  <div className="max-h-96 overflow-y-auto space-y-2 border p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    {newsList.map((news) => {
                      const isAdded = issueForm.pages?.[selectedPageIdx]?.items.some(
                        (it) => it.sourceId === news.id
                      );

                      return (
                        <div
                          key={news.id}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="text-[10px] font-black text-amber-600 block">
                              {news.category}
                            </span>
                            <h5 className="font-bold line-clamp-1">{news.title}</h5>
                          </div>

                          <button
                            disabled={isAdded}
                            onClick={() => handleAddItemToPage(news, "news")}
                            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                              isAdded
                                ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:brightness-110"
                            }`}
                          >
                            {isAdded ? "مضاف" : "إضافة للصورة"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Articles Column */}
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>المقالات والأعمدة ({articlesList.length})</span>
                  </h4>

                  <div className="max-h-96 overflow-y-auto space-y-2 border p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    {articlesList.map((art) => {
                      const isAdded = issueForm.pages?.[selectedPageIdx]?.items.some(
                        (it) => it.sourceId === art.id
                      );

                      return (
                        <div
                          key={art.id}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 block">
                              بقلم: {art.authorName}
                            </span>
                            <h5 className="font-bold line-clamp-1">{art.title}</h5>
                          </div>

                          <button
                            disabled={isAdded}
                            onClick={() => handleAddItemToPage(art, "article")}
                            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                              isAdded
                                ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                          >
                            {isAdded ? "مضاف" : "إضافة للصحيفة"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4">
                <button
                  onClick={() => setBuilderStep(1)}
                  className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  ← السابق
                </button>
                <button
                  onClick={() => setBuilderStep(3)}
                  className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-black text-xs hover:brightness-110"
                >
                  التالي: المصمم البصري والإخراج →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Visual Layout & Page Designer */}
          {builderStep === 3 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-3">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-amber-500" />
                    <span>المصمم البصري التفاعلي للصفحات</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    تحكم بالترتيب، الأعمدة، الكواد، والاقتباسات لكل صفحة.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTemplatesGallery(true)}
                    className="px-3.5 py-2 bg-amber-500 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 hover:bg-amber-600 transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>قوالب التخطيط</span>
                  </button>

                  <button
                    onClick={handleAiAutoLayout}
                    disabled={aiLoading === "autolayout"}
                    className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{aiLoading === "autolayout" ? "جاري الإخراج..." : "إخراج تلقائي بالذكاء الاصطناعي"}</span>
                  </button>

                  <button
                    onClick={handleAddPage}
                    className="px-3.5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-black text-xs flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة صفحة</span>
                  </button>
                </div>
              </div>

              {/* Pages Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                {issueForm.pages?.map((p, pIdx) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all ${
                      selectedPageIdx === pIdx
                        ? "bg-[#d49a37] text-white border-[#d49a37] shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedPageIdx(pIdx)}
                      className="text-xs font-black"
                    >
                      ص {p.pageNumber}: {p.title}
                    </button>
                    {issueForm.pages && issueForm.pages.length > 1 && (
                      <button
                        onClick={() => handleRemovePage(pIdx)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                        title="حذف الصفحة"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Page Controls */}
              {issueForm.pages?.[selectedPageIdx] && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <label className="text-xs font-bold whitespace-nowrap">عنوان الصفحة:</label>
                      <input
                        type="text"
                        value={issueForm.pages[selectedPageIdx].title}
                        onChange={(e) => {
                          const pages = [...issueForm.pages!];
                          pages[selectedPageIdx].title = e.target.value;
                          setIssueForm({ ...issueForm, pages });
                        }}
                        className="p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold w-full md:w-64"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold whitespace-nowrap">تقسيم الأعمدة:</label>
                      <select
                        value={issueForm.pages[selectedPageIdx].gridColumns}
                        onChange={(e) => {
                          const pages = [...issueForm.pages!];
                          pages[selectedPageIdx].gridColumns = Number(e.target.value) as any;
                          setIssueForm({ ...issueForm, pages });
                        }}
                        className="p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold"
                      >
                        <option value={1}>عمود واحد (1 Column)</option>
                        <option value={2}>عمودان (2 Columns)</option>
                        <option value={3}>3 أعمدة صحفية (3 Columns)</option>
                        <option value={4}>4 أعمدة (4 Columns)</option>
                      </select>
                    </div>
                  </div>

                  {/* Items list inside page */}
                  <div className="space-y-3">
                    <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                      المواد المضمنة في هذه الصفحة ({issueForm.pages[selectedPageIdx].items.length})
                    </h4>

                    {issueForm.pages[selectedPageIdx].items.length > 0 ? (
                      issueForm.pages[selectedPageIdx].items.map((item, iIdx) => (
                        <div
                          key={item.id}
                          className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-xs flex items-center justify-center">
                                {iIdx + 1}
                              </span>
                              <h5 className="font-bold text-xs">{item.title}</h5>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAiEnhanceItem(item)}
                                disabled={aiLoading === item.id}
                                className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{aiLoading === item.id ? "جاري..." : "تحسين بالـ AI"}</span>
                              </button>

                              <button
                                onClick={() => handleMoveItemOrder(item.id, "up")}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-xs"
                                title="تحريك لأعلى"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveItemOrder(item.id, "down")}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-xs"
                                title="تحريك لأسفل"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRemoveItemFromPage(item.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded text-xs"
                                title="حذف المادة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Formatting options */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t text-xs">
                            <div>
                              <label className="block text-[10px] font-bold mb-1">عنوان فرعي (Deck):</label>
                              <input
                                type="text"
                                value={item.subtitle || ""}
                                onChange={(e) =>
                                  handleUpdateItemFormat(item.id, { subtitle: e.target.value })
                                }
                                className="w-full p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-[11px]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold mb-1">اقتباس بارز (Pull Quote):</label>
                              <input
                                type="text"
                                value={item.quote || ""}
                                onChange={(e) =>
                                  handleUpdateItemFormat(item.id, { quote: e.target.value })
                                }
                                className="w-full p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-[11px]"
                              />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                              <label className="flex items-center gap-1.5 font-bold text-[11px] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!item.featuredBox}
                                  onChange={(e) =>
                                    handleUpdateItemFormat(item.id, {
                                      featuredBox: e.target.checked,
                                    })
                                  }
                                />
                                <span>إبراز كـ كادر مخصص</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed rounded-2xl opacity-60 text-xs font-bold">
                        لم تضف مواد إلى هذه الصفحة بعد. انتقل لخطوة "اختيار المحتوى" لإضافة مقالات وأخبار.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t pt-4">
                <button
                  onClick={() => setBuilderStep(2)}
                  className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  ← السابق
                </button>
                <button
                  onClick={() => setBuilderStep(4)}
                  className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-black text-xs hover:brightness-110"
                >
                  التالي: المعاينة والنشر →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Finalize & Publish */}
          {builderStep === 4 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <h3 className="text-lg font-black flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>اعتماد ونشر الصحيفة الإلكترونية</span>
              </h3>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-1">
                <p>✓ تم إعداد الصحيفة بنجاح بـ {issueForm.pages?.length || 0} صفحات صحفية.</p>
                <p>يمكنك حفظها كـ مسودة للتعديل اللاحق، أو نشرها فوراً لتصبح متاحة للقراء والجمهور.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                <button
                  onClick={() => setPreviewIssue(issueForm as NewspaperIssue)}
                  className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-2 hover:bg-slate-200"
                >
                  <Eye className="w-4 h-4" />
                  <span>معاينة الصحيفة كاملة</span>
                </button>

                <button
                  onClick={() => handleSaveIssue("draft")}
                  className="px-5 py-3 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-amber-700"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ كمسودة</span>
                </button>

                <button
                  onClick={() => handleSaveIssue("published")}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110"
                >
                  <Send className="w-4 h-4" />
                  <span>اعتماد ونشر الصحيفة فوراً</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Audit History & Permissions Logs */}
      {activeSubTab === "logs" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-lg font-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span>سجل العمليات والصلاحيات الخاص بالإصدارات الصحفية</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <th className="p-3 font-black">رقم الإصدار</th>
                  <th className="p-3 font-black">الإجراء</th>
                  <th className="p-3 font-black">المستخدم</th>
                  <th className="p-3 font-black">التفاصيل</th>
                  <th className="p-3 font-black">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold">{log.issueNumber}</td>
                    <td className="p-3 font-black">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          log.action === "publish"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.action === "create"
                            ? "bg-sky-100 text-sky-800"
                            : log.action === "delete"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{log.userName} ({log.userRole})</td>
                    <td className="p-3">{log.details}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(log.timestamp).toLocaleString("ar-YE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Modal Reader Preview */}
      {previewIssue && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto">
          <NewspaperReader
            issue={previewIssue}
            onClose={() => setPreviewIssue(null)}
          />
        </div>
      )}

      {showTemplatesGallery && (
        <NewspaperTemplatesGallery
          onClose={() => setShowTemplatesGallery(false)}
          onApplyTemplate={(template) => {
            if (!issueForm.pages) return;
            const pages = [...issueForm.pages];
            // Merge the chosen template with the existing page info
            pages[selectedPageIdx] = {
              ...pages[selectedPageIdx],
              pageType: template.pageType || pages[selectedPageIdx].pageType,
              gridColumns: template.gridColumns || pages[selectedPageIdx].gridColumns,
              layoutTemplate: template.layoutTemplate,
              // We could either replace items or just apply the grid template. For now, replace it to show layout.
              items: template.items || []
            };
            setIssueForm({ ...issueForm, pages });
            setShowTemplatesGallery(false);
          }}
        />
      )}
    </div>
  );
};
