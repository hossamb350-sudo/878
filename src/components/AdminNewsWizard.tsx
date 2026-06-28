import React, { useState, useEffect } from "react";
import { 
  PlusCircle, Plus, List, ChevronDown, FileText, Edit, Trash2, ArrowRight, 
  X, Save, Type, User, Clock, Bold, Italic, Highlighter, CornerDownLeft, 
  Globe, Image as ImageIcon, Video, Settings, Tag, Check, CheckCircle, Eye, 
  ChevronRight, ChevronLeft, Search 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  collection, query, orderBy, getDocs, addDoc, updateDoc, doc, 
  deleteDoc, getDoc, setDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { notificationService } from "../services/NotificationService";
import { SyncService } from "../services/SyncService";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  shortDescription?: string;
  author?: string;
  imageUrl?: string;
  additionalImages?: string[];
  category?: string;
  categories?: string[];
  isBreaking?: boolean;
  isPinned?: boolean;
  liveUpdates?: any[];
  views?: number;
  createdAt: number;
  updatedAt?: number;
  publishStatus?: "published" | "draft";
  allowComments?: boolean;
  tags?: string[];
  videoUrl?: string;
}

interface CategoryItem {
  name: string;
  color?: string;
}

export function AdminNewsWizard({ isAdmin }: { isAdmin?: boolean }) {
  const [newsMode, setNewsMode] = useState<"add" | "list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  
  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [publishStatus, setPublishStatus] = useState<"published" | "draft">("published");
  const [allowComments, setAllowComments] = useState(true);
  const [tags, setTags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingCat, setEditingCat] = useState<{oldName: string, newName: string, color: string} | null>(null);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);

  // Fields
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [additionalImagesText, setAdditionalImagesText] = useState("");
  const [cat, setCat] = useState("محلية");
  const [selectedCats, setSelectedCats] = useState<string[]>(["محلية"]);
  const [catSearch, setCatSearch] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [customCat, setCustomCat] = useState("");
  const [customCatColor, setCustomCatColor] = useState("#049EDF");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [liveUpdatesText, setLiveUpdatesText] = useState("");
  const [views, setViews] = useState<number>(0);

  // Auto-save logic
  useEffect(() => {
    if (newsMode !== "list" && (title || content || author)) {
      const timer = setTimeout(() => {
        const draftData = {
          title, author, shortDesc, content, imageUrl, additionalImagesText, cat, customCat, isPinned, isBreaking, liveUpdatesText, publishStatus, allowComments, tags, videoUrl, currentStep, editingId
        };
        localStorage.setItem("news_draft", JSON.stringify(draftData));
        setLastAutoSave(Date.now());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [title, author, shortDesc, content, imageUrl, additionalImagesText, cat, customCat, isPinned, isBreaking, liveUpdatesText, publishStatus, allowComments, tags, videoUrl, currentStep, newsMode]);

  // Restore draft
  useEffect(() => {
    const saved = localStorage.getItem("news_draft");
    if (saved && newsMode === "list") {
      try {
        const draft = JSON.parse(saved);
        if (draft.title && confirm("يوجد مسودة خبر غير مكتملة، هل تريد استعادتها؟")) {
          setTitle(draft.title || "");
          setAuthor(draft.author || "");
          setShortDesc(draft.shortDesc || "");
          setContent(draft.content || "");
          setImageUrl(draft.imageUrl || "");
          setAdditionalImagesText(draft.additionalImagesText || "");
          setCat(draft.cat || "محلية");
          setCustomCat(draft.customCat || "");
          setIsPinned(!!draft.isPinned);
          setIsBreaking(!!draft.isBreaking);
          setLiveUpdatesText(draft.liveUpdatesText || "");
          setPublishStatus(draft.publishStatus || "published");
          setAllowComments(draft.allowComments !== false);
          setTags(draft.tags || "");
          setVideoUrl(draft.videoUrl || "");
          setCurrentStep(draft.currentStep || 1);
          setEditingId(draft.editingId || null);
          setNewsMode(draft.editingId ? "edit" : "add");
        } else {
          localStorage.removeItem("news_draft");
        }
      } catch (e) {}
    }
  }, [newsMode]);
  
  const [saving, setSaving] = useState(false);
  
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Categories and Authors persistence
  const [savedCats, setSavedCats] = useState<CategoryItem[]>([
    { name: "محلية", color: "#049EDF" },
    { name: "تعبئة عامة", color: "#032F69" },
    { name: "اجتماعية", color: "#055198" },
    { name: "أنشطة وزيارات", color: "#7C3AED" },
    { name: "مشاريع", color: "#10B981" },
    { name: "مقال", color: "#F59E0B" }
  ]);
  const [savedAuthors, setSavedAuthors] = useState<string[]>([]);

  const fetchMetadata = async () => {
    try {
      const catDoc = await getDoc(doc(db, "newsMetadata", "categories"));
      if (catDoc.exists()) {
        const data = catDoc.data();
        let items: CategoryItem[] = [];
        if (data.items) {
          items = data.items;
        } else if (data.list) {
          items = data.list.map((name: string) => ({ name, color: "#049EDF" }));
        }
        
        const defaultCats: CategoryItem[] = [
          { name: "محلية", color: "#049EDF" },
          { name: "تعبئة عامة", color: "#032F69" },
          { name: "اجتماعية", color: "#055198" },
          { name: "أنشطة وزيارات", color: "#7C3AED" },
          { name: "مشاريع", color: "#10B981" },
          { name: "مقال", color: "#F59E0B" }
        ];

        let combined: CategoryItem[] = [];
        
        // Use Firestore items as the base (preserving their colors)
        combined = [...items];
        
        // Add missing default categories
        defaultCats.forEach(def => {
          if (!combined.some(c => c.name === def.name)) {
            combined.push(def);
          }
        });
        
        setSavedCats(combined);
      }
      
      const authDoc = await getDoc(doc(db, "newsMetadata", "authors"));
      if (authDoc.exists()) {
        setSavedAuthors(authDoc.data().list || []);
      }
    } catch (e) {
      console.error("Error fetching metadata:", e);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // formatting helper
  const insertText = (before: string, after: string) => {
    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + selectedText + after;
    setContent(content.substring(0, start) + replacement + content.substring(end));
  };

  const fetchNewsList = async () => {
    setLoadingList(true);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setNewsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (newsMode === "list") {
      fetchNewsList();
    }
  }, [newsMode]);

  const parseLiveUpdates = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, idx) => {
        const parts = line.split("|");
        const utext = parts[0]?.trim() || "";
        const utimeString = parts[1]?.trim() || "";
        const uimage = parts[2]?.trim() || undefined;
        
        let updateTime: string | number = Date.now();
        if (utimeString) {
          updateTime = utimeString;
        }

        const updateObj: any = {
          id: `${Date.now()}-${idx}-${Math.random()}`,
          text: utext,
          time: updateTime,
          timestamp: Date.now()
        };
        if (uimage) {
          updateObj.imageUrl = uimage;
        }
        return updateObj;
      });
  };

  const resetForm = () => {
    setTitle("");
    setShortDesc("");
    setContent("");
    setAuthor("");
    setImageUrl("");
    setAdditionalImagesText("");
    setCat("محلية");
    setSelectedCats(["محلية"]);
    setCustomCat("");
    setIsBreaking(false);
    setIsPinned(false);
    setLiveUpdatesText("");
    setViews(0);
    setEditingId(null);
    setNewsMode("add"); // Reset mode to add
    setPublishStatus("published");
    setAllowComments(true);
    setTags("");
    setVideoUrl("");
    setCurrentStep(1);
  };

  const handleEditClick = (item: NewsItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTitle(item.title || "");
    setShortDesc(item.shortDescription || "");
    setContent(item.content || "");
    setAuthor(item.author || "");
    setImageUrl(item.imageUrl || "");
    setViews(item.views || 0);
    if (item.additionalImages) {
      setAdditionalImagesText(item.additionalImages.join("\n"));
    } else {
      setAdditionalImagesText("");
    }
    
    if (item.categories && item.categories.length > 0) {
      setSelectedCats(item.categories);
      setCat(item.categories[0]);
    } else {
      setSelectedCats([item.category || "محلية"]);
      setCat(item.category || "محلية");
    }

    if (savedCats.some(c => c.name === (item.category || ""))) {
      setCustomCat("");
    } else {
      setCat("custom");
      setCustomCat(item.category || "");
    }
    
    setIsBreaking(!!item.isBreaking);
    setIsPinned(!!item.isPinned);
    
    if (item.liveUpdates && Array.isArray(item.liveUpdates)) {
      setLiveUpdatesText(item.liveUpdates.map(u => {
        let line = `${u.text}`;
        if (u.time) line += ` | ${u.time}`;
        if (u.imageUrl) line += ` | ${u.imageUrl}`;
        return line;
      }).join("\n"));
    } else {
      setLiveUpdatesText("");
    }
    
    // Wizard specific fields
    setPublishStatus(item.publishStatus || "published");
    setAllowComments(item.allowComments !== false);
    setTags(item.tags ? item.tags.join(", ") : "");
    setVideoUrl(item.videoUrl || "");
    
    setEditingId(item.id);
    setNewsMode("edit");
  };

  const save = async () => {
    if (!title || !content) return alert("يرجى تعبئة الحقول الأساسية (العنوان والمحتوى)");
    
    setSaving(true);
    const parsedUpdates = parseLiveUpdates(liveUpdatesText);
    
    // Handle custom category if specified
    let finalSelectedCats = [...selectedCats];
    const customCatName = cat === "custom" ? customCat : null;
    if (customCatName && !finalSelectedCats.includes(customCatName)) {
      finalSelectedCats.push(customCatName);
    }

    if (finalSelectedCats.length === 0) {
      setSaving(false);
      return alert("يرجى اختيار تصنيف واحد على الأقل");
    }
    
    let finalSnippet = shortDesc.trim();
    if (!finalSnippet) {
      const strippedContent = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
      finalSnippet = strippedContent.substring(0, 150) + (strippedContent.length > 150 ? "..." : "");
    }

    const additionalImages = additionalImagesText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const payload: any = {
      title,
      content,
      shortDescription: finalSnippet,
      author: author || "منصة تعز",
      imageUrl: imageUrl || null,
      additionalImages: additionalImages || null,
      category: finalSelectedCats[0] || "محلية",
      categories: finalSelectedCats,
      isBreaking,
      isPinned,
      liveUpdates: parsedUpdates || null,
      views: Number(views) || 0,
      updatedAt: Date.now(),
      publishStatus,
      allowComments,
      tags: tags.split(",").map(t => t.trim()).filter(t => t.length > 0),
      videoUrl: videoUrl || null
    };
    
    try {
      // Save Metadata (Category)
      if (cat === "custom" && customCat && !savedCats.some(c => c.name === customCat)) {
        const newItem = { name: customCat, color: customCatColor };
        const newList = [...savedCats, newItem];
        await setDoc(doc(db, "newsMetadata", "categories"), { items: newList });
        setSavedCats(newList);
      }

      // Save Metadata (Author)
      if (author && !savedAuthors.includes(author)) {
        const newList = [...savedAuthors, author];
        await setDoc(doc(db, "newsMetadata", "authors"), { list: newList });
        setSavedAuthors(newList);
      }

      let savedId = editingId;
      
      if (newsMode === "edit") {
        if (!editingId) throw new Error("لا يوجد معرّف للخبر الجاري تعديله!");
        await updateDoc(doc(db, "news", editingId), payload);
      } else {
        const docRef = await addDoc(collection(db, "news"), {
          ...payload,
          createdAt: Date.now()
        });
        savedId = docRef.id;
        
        // Only send notification for NEW posts
        await notificationService.sendNewsNotification({
          id: savedId,
          title: payload.title,
          category: payload.category,
          imageUrl: payload.imageUrl || undefined
        });
      }
      
      setLastSavedId(savedId);
      localStorage.removeItem("news_draft");
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ!");
    } finally {
      setSaving(false);
    }
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">تم العملية بنجاح!</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold">تم {newsMode === "edit" ? "تحديث" : "نشر"} الخبر بنجاح في المنصة.</p>
        
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => {
              setShowSuccessModal(false);
              window.open(`/news/${lastSavedId}`, '_blank');
              setNewsMode("list");
              resetForm();
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            عرض الخبر
          </button>
          <button 
            onClick={() => {
              setShowSuccessModal(false);
              setNewsMode("list");
              resetForm();
            }}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-white rounded-2xl font-black transition-all text-sm"
          >
            التحكم (لوحة الإدارة)
          </button>
          <button 
            onClick={() => {
              setShowSuccessModal(false);
              resetForm();
              setNewsMode("add");
              setCurrentStep(1);
            }}
            className="w-full py-3 text-emerald-600 font-black hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl transition-all text-sm border border-emerald-100 dark:border-emerald-900/30"
          >
            إضافة خبر جديد
          </button>
        </div>
      </motion.div>
    </div>
  );

  const handleDelete = async (newsId: string) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "news", newsId));
      await SyncService.trackDeletion("news", newsId);
      setNewsList(prev => prev.filter(item => item.id !== newsId));
      alert("تم حذف الخبر بنجاح");
    } catch (e) {
      console.error(e);
      alert("فشل في حذف الخبر");
    }
  };

  const deleteCategory = async (catToDelete: string) => {
    if (["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(catToDelete)) {
      return alert("لا يمكن حذف التصنيفات الافتراضية");
    }
    if (!confirm(`هل أنت متأكد من حذف تصنيف "${catToDelete}"؟ لن يتم حذف الأخبار المرتبطة به ولكن سيختفي من القائمة.`)) return;
    
    try {
      const newList = savedCats.filter(c => c.name !== catToDelete);
      await setDoc(doc(db, "newsMetadata", "categories"), { items: newList });
      setSavedCats(newList);
      if (cat === catToDelete) setCat("محلية");
    } catch (e) {
      alert("خطأ في الحذف");
    }
  };

  const updateCategory = async () => {
    if (!editingCat || !editingCat.newName.trim()) return;
    const { oldName, newName, color } = editingCat;
    
    if (["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(oldName)) {
      // Allow color update for defaults but not name? User asked for choice when adding.
      // Let's allow updating color for all if they want, but name is risky for defaults.
      // For now, allow color update for all.
    }

    try {
      const newList = savedCats.map(c => c.name === oldName ? { ...c, name: newName, color } : c);
      await setDoc(doc(db, "newsMetadata", "categories"), { items: newList });
      setSavedCats(newList);
      if (cat === oldName) setCat(newName);
      setEditingCat(null);
    } catch (e) {
      alert("خطأ في التعديل");
    }
  };

  const CategoryManagerModal = () => (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">إدارة التصنيفات</h3>
          <button onClick={() => setShowCatManager(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {savedCats.map(c => (
            <div key={c.name} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 group">
              {editingCat?.oldName === c.name ? (
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="flex-1 bg-white dark:bg-gray-900 p-2 rounded-lg border border-blue-500 font-bold dark:text-white"
                      value={editingCat.newName}
                      disabled={["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(c.name)}
                      onChange={e => setEditingCat({...editingCat, newName: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && updateCategory()}
                    />
                    <div className="flex items-center gap-1">
                      <input 
                        type="color" 
                        value={editingCat.color} 
                        onChange={e => setEditingCat({...editingCat, color: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingCat(null)} className="px-4 py-1.5 text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">إلغاء</button>
                    <button onClick={updateCategory} className="px-4 py-1.5 text-xs font-black bg-blue-600 text-white rounded-xl">حفظ التغييرات</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: c.color || "#049EDF" }}></div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setEditingCat({oldName: c.name, newName: c.name, color: c.color || "#049EDF"})}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].includes(c.name) && (
                      <button 
                        onClick={() => deleteCategory(c.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  if (newsMode !== "list") {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readTime = Math.ceil(wordCount / 200) || 1;

    const handleCancel = () => {
      if (title || content) {
        if (confirm("هل أنت متأكد من إلغاء العملية؟ سيتم حفظ مسودة للرجوع إليها لاحقاً.")) {
          setNewsMode("list");
          resetForm();
        }
      } else {
        setNewsMode("list");
        resetForm();
      }
    };

    return (
      <div className="fixed inset-0 z-[2000] bg-white dark:bg-gray-950 flex flex-col font-sans overflow-hidden">
        {/* Wizard Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 sm:px-8 flex items-center justify-between shadow-sm relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCancel}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight truncate">
                {editingId ? "تعديل الخبر" : "إنشاء خبر جديد"}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">
                الخطوة {currentStep} من 4 • {
                  currentStep === 1 ? "المعلومات الأساسية" :
                  currentStep === 2 ? "محتوى الخبر" :
                  currentStep === 3 ? "الوسائط المتعددة" :
                  "الإعدادات والنشر"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastAutoSave && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                <Save className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black">محفوظ {new Date(lastAutoSave).toLocaleTimeString('ar-SA')}</span>
              </div>
            )}
            <div className="w-24 sm:w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden hidden xs:block">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50">
          <div className="max-w-4xl mx-auto p-4 sm:p-8 md:p-12">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                          <Type className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">المعلومات الأساسية</h3>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">عنوان الخبر الرئيسي *</label>
                          <input 
                            className="w-full p-3.5 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-base placeholder:text-gray-300 dark:text-white" 
                            placeholder="اكتب العنوان هنا..." 
                            value={title} 
                            onChange={e=>setTitle(e.target.value)} 
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">المحرر أو المصدر *</label>
                            <div className="relative">
                              <input 
                                className="w-full p-3.5 pr-11 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-gray-300 dark:text-white" 
                                placeholder="مثلاً: وحدة الإعلام" 
                                value={author} 
                                onChange={e=>setAuthor(e.target.value)}
                                onFocus={() => setShowAuthorDropdown(true)}
                                onBlur={() => setTimeout(() => setShowAuthorDropdown(false), 200)}
                              />
                              <User className="absolute right-4 top-3.5 w-4 h-4 text-gray-400" />
                              
                              <AnimatePresence>
                                {showAuthorDropdown && savedAuthors.length > 0 && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-[100] top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-h-48 overflow-y-auto custom-scrollbar p-2"
                                  >
                                    {savedAuthors.filter(a => a.toLowerCase().includes(author.toLowerCase())).map(a => (
                                      <button
                                        key={a}
                                        onClick={() => { setAuthor(a); setShowAuthorDropdown(false); }}
                                        className="w-full text-right p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors"
                                      >
                                        {a}
                                      </button>
                                    ))}
                                    {savedAuthors.filter(a => a.toLowerCase().includes(author.toLowerCase())).length === 0 && (
                                      <div className="p-3 text-center text-xs text-gray-400 font-bold">لا يوجد نتائج تطابق بحثك</div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <label className="block text-sm font-black text-gray-700 dark:text-gray-300">التصنيفات (يمكنك اختيار أكثر من واحد) *</label>
                            </div>
                            
                            {/* Selected Categories Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {selectedCats.map(sc => (
                                <span 
                                  key={sc}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-black border border-blue-100 dark:border-blue-800/30"
                                >
                                  {sc}
                                  {selectedCats.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={() => setSelectedCats(prev => prev.filter(c => c !== sc))}
                                      className="hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              ))}
                              {cat === "custom" && customCat && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-[11px] font-black border border-purple-100 dark:border-purple-800/30">
                                  {customCat} (جديد)
                                  <button 
                                    type="button" 
                                    onClick={() => { setCat("محلية"); setCustomCat(""); }}
                                    className="hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              )}
                            </div>

                            {/* Searchable Dropdown */}
                            <div className="relative">
                              <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                  type="text"
                                  className="w-full p-3.5 pr-11 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm dark:text-white"
                                  placeholder="ابحث عن تصنيف أو اختر من القائمة..."
                                  value={catSearch}
                                  onChange={(e) => {
                                    setCatSearch(e.target.value);
                                    setShowCatDropdown(true);
                                  }}
                                  onFocus={() => setShowCatDropdown(true)}
                                />
                                <button 
                                  type="button"
                                  onClick={() => setShowCatDropdown(!showCatDropdown)}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} />
                                </button>
                              </div>

                              <AnimatePresence>
                                {showCatDropdown && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-[100] top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-h-56 overflow-y-auto custom-scrollbar p-2"
                                  >
                                    <div className="p-2 border-b border-gray-50 dark:border-gray-800 mb-1">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider pr-1">التصنيفات المتاحة</p>
                                    </div>
                                    {savedCats
                                      .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                                      .map(c => {
                                        const isSelected = selectedCats.includes(c.name);
                                        return (
                                          <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => {
                                              if (isSelected) {
                                                if (selectedCats.length > 1) {
                                                  setSelectedCats(prev => prev.filter(sc => sc !== c.name));
                                                }
                                              } else {
                                                setSelectedCats(prev => [...prev, c.name]);
                                              }
                                              setCatSearch("");
                                            }}
                                            className={`w-full text-right p-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                                              isSelected 
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></div>
                                              {c.name}
                                            </div>
                                            {isSelected && <Check className="w-4 h-4" />}
                                          </button>
                                        );
                                      })}
                                    
                                    <div className="mt-1 pt-1 border-t border-gray-50 dark:border-gray-800">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setCat("custom");
                                          setShowCatDropdown(false);
                                        }}
                                        className="w-full text-right p-3 rounded-xl text-sm font-black text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all flex items-center gap-2"
                                      >
                                        <PlusCircle className="w-4 h-4" />
                                        إضافة تصنيف جديد...
                                      </button>
                                    </div>

                                    {savedCats.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && catSearch && (
                                      <div className="p-4 text-center">
                                        <p className="text-xs text-gray-400 font-bold mb-2">لا يوجد تصنيف بهذا الاسم</p>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setCat("custom");
                                            setCustomCat(catSearch);
                                            setShowCatDropdown(false);
                                          }}
                                          className="text-xs font-black text-blue-600 underline"
                                        >
                                          إضافة "{catSearch}" كبتصنيف جديد؟
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {cat === "custom" && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">اسم التصنيف الجديد</label>
                              <input 
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold dark:text-white" 
                                placeholder="مثلاً: أخبار دولية" 
                                value={customCat} 
                                onChange={e=>setCustomCat(e.target.value)} 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">لون التصنيف</label>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl h-[56px]">
                                 <input 
                                   type="color" 
                                   value={customCatColor} 
                                   onChange={e => setCustomCatColor(e.target.value)}
                                   className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent shrink-0"
                                 />
                                 <span className="text-xs font-bold text-gray-500">{customCatColor}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div>
                          <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">مقدمة الخبر (اختياري)</label>
                          <textarea 
                            className="w-full p-4 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl h-32 focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-300 leading-relaxed dark:text-white" 
                            placeholder="يمكنك هنا كتابة مقدمة الخبر ليظهر بشكل متميز" 
                            value={shortDesc} 
                            onChange={e=>setShortDesc(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">محتوى الخبر</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>قراءة {readTime} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>{wordCount} كلمة</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2.5 p-2 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => insertText("<b>", "</b>")} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 text-blue-600 transition-all shadow-sm border border-gray-100 dark:border-gray-800" title="عريض">
                          <Bold className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500">عريض</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => insertText("<i>", "</i>")} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 text-blue-600 transition-all shadow-sm border border-gray-100 dark:border-gray-800" title="مائل">
                          <Italic className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500">مائل</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => insertText("<mark>", "</mark>")} className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 text-yellow-700 transition-all shadow-sm border border-yellow-100 dark:border-yellow-900/30" title="تمييز">
                          <Highlighter className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500">تمييز</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => insertText("<br/>", "")} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 text-blue-600 transition-all shadow-sm border border-gray-100 dark:border-gray-800" title="سطر جديد">
                          <CornerDownLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500">سطر جديد</span>
                      </div>
                    </div>

                    <textarea 
                      id="content-textarea"
                      className="w-full p-6 bg-gray-50 dark:bg-gray-950 border-none rounded-[2rem] h-[400px] focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg placeholder:text-gray-300 leading-[2] dark:text-white resize-none" 
                      placeholder="ابدأ في كتابة تفاصيل الخبر هنا..." 
                      value={content} 
                      onChange={e=>setContent(e.target.value)} 
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">الوسائط المتعددة</h3>
                    </div>

                    <div className="space-y-10">
                      <div>
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">الصورة الرئيسية (رابط)</label>
                        <div className="flex gap-4">
                          <div className="flex-1 relative">
                            <input 
                              className="w-full p-4 pr-11 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-300 dark:text-white" 
                              placeholder="https://example.com/image.jpg" 
                              value={imageUrl} 
                              onChange={e=>setImageUrl(e.target.value)} 
                            />
                            <Globe className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        {imageUrl && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 relative group">
                            <img src={imageUrl} className="w-full h-48 object-cover rounded-3xl shadow-md border border-gray-100 dark:border-gray-800" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                              <button onClick={()=>setImageUrl("")} className="p-3 bg-red-600 text-white rounded-full"><Trash2 className="w-6 h-6"/></button>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">معرض الصور (رابط واحد في كل سطر)</label>
                        <textarea 
                          className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl h-32 focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm placeholder:text-gray-300 dark:text-white" 
                          placeholder="ضع روابط الصور الإضافية هنا..." 
                          value={additionalImagesText} 
                          onChange={e=>setAdditionalImagesText(e.target.value)} 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">رابط فيديو (YouTube / Almasirah)</label>
                        <div className="relative">
                          <input 
                            className="w-full p-4 pr-11 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-300 dark:text-white" 
                            placeholder="مثلاً: https://www.youtube.com/watch?v=..." 
                            value={videoUrl} 
                            onChange={e=>setVideoUrl(e.target.value)} 
                          />
                          <Video className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">الإعدادات والنشر</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-transparent hover:border-blue-500/30 transition-all cursor-pointer group">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isPinned ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-700"}`}>
                              {isPinned && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={isPinned} onChange={e=>setIsPinned(e.target.checked)} />
                            <div className="flex-1">
                              <span className="block text-sm font-black text-gray-900 dark:text-white text-right">تثبيت الخبر</span>
                              <span className="text-[10px] text-gray-500 font-bold text-right block">سيظهر الخبر في قسم الأخبار المثبتة في الأعلى</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-transparent hover:border-red-500/30 transition-all cursor-pointer group">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isBreaking ? "bg-red-600 border-red-600" : "border-gray-300 dark:border-gray-700"}`}>
                              {isBreaking && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={isBreaking} onChange={e=>setIsBreaking(e.target.checked)} />
                            <div className="flex-1">
                              <span className="block text-sm font-black text-gray-900 dark:text-white text-right">تغطية مباشرة / خبر عاجل</span>
                              <span className="text-[10px] text-gray-500 font-bold text-right block">تفعيل شريط التحديثات المباشرة لهذا الخبر</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer group">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${allowComments ? "bg-emerald-600 border-emerald-600" : "border-gray-300 dark:border-gray-700"}`}>
                              {allowComments && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={allowComments} onChange={e=>setAllowComments(e.target.checked)} />
                            <div className="flex-1">
                              <span className="block text-sm font-black text-gray-900 dark:text-white text-right">تفعيل التعليقات</span>
                              <span className="text-[10px] text-gray-500 font-bold text-right block">السماح للمستخدمين بالتعليق على هذا الخبر</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">الوسوم (مفصولة بفاصلة)</label>
                          <div className="relative">
                            <input 
                              className="w-full p-4 pr-11 bg-gray-50 dark:bg-gray-950 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-300 dark:text-white" 
                              placeholder="مثلاً: اليمن، تعز، مسيرات" 
                              value={tags} 
                              onChange={e=>setTags(e.target.value)} 
                            />
                            <Tag className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2.5">حالة النشر</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => setPublishStatus("published")}
                              className={`p-3.5 rounded-2xl font-black border-2 transition-all text-sm ${publishStatus === "published" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-900 text-gray-500 border-gray-100 dark:border-gray-800"}`}
                            >
                              نشر الآن
                            </button>
                            <button 
                              onClick={() => setPublishStatus("draft")}
                              className={`p-3.5 rounded-2xl font-black border-2 transition-all text-sm ${publishStatus === "draft" ? "bg-amber-500 text-white border-amber-500" : "bg-white dark:bg-gray-900 text-gray-500 border-gray-100 dark:border-gray-800"}`}
                            >
                              حفظ كمسودة
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isBreaking && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8">
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">تحديثات التغطية المباشرة</label>
                        <textarea 
                          className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl h-32 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-gray-300 leading-relaxed dark:text-white" 
                          placeholder="النص | الوقت | رابط الصورة (اختياري)" 
                          value={liveUpdatesText} 
                          onChange={e=>setLiveUpdatesText(e.target.value)} 
                        />
                        <p className="mt-2 text-[10px] text-gray-400 font-bold leading-relaxed">اكتب كل تحديث في سطر منفصل بالتنسيق التالي: المحتوى | الوقت | الرابط</p>
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-start gap-4 text-right">
                      <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 mb-1">معاينة نهائية</h4>
                        <p className="text-xs font-bold text-blue-700/70 dark:text-blue-300/70 leading-relaxed">
                          أنت على وشك {newsMode === "edit" ? "تحديث" : "نشر"} الخبر بعنوان: <span className="text-blue-900 dark:text-white font-black">"{title}"</span>. يرجى مراجعة كافة التفاصيل قبل الضغط على زر الحفظ النهائي.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Wizard Footer */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 sm:p-6 shadow-lg relative z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button 
                  onClick={() => setCurrentStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-2xl font-black transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>
              )}
              <button 
                onClick={handleCancel}
                className="hidden sm:flex items-center gap-2 px-4 py-3 text-red-600 font-black transition-all hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl text-sm"
              >
                إلغاء
              </button>
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <button 
                  disabled={currentStep === 1 && (!title || !author)}
                  onClick={() => setCurrentStep(s => s + 1)}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all shadow-lg text-sm ${
                    currentStep === 1 && (!title || !author) 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري {newsMode === "edit" ? "التحديث" : "النشر"}...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {newsMode === "edit" ? "تحديث الخبر" : "نشر الخبر الآن"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal Overlay */}
        {showSuccessModal && <SuccessModal />}
        {showCatManager && <CategoryManagerModal />}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* Main Action Card: Add News */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black flex items-center gap-3">
              <PlusCircle className="w-8 h-8" />
              إضافة خبر جديد
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
              <p className="text-blue-100 font-medium text-lg opacity-90 text-right">قم بنشر محتوى جديد للجمهور بضغطة زر واحدة</p>
              <button 
                onClick={() => setShowCatManager(true)}
                className="flex items-center gap-1 text-[11px] font-black bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg border border-white/20 transition-all"
              >
                <Tag className="w-3 h-3" />
                إدارة التصنيفات
              </button>
            </div>
          </div>
          <button 
            onClick={() => { resetForm(); setNewsMode("add"); setCurrentStep(1); }}
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            ابدأ الكتابة الآن
          </button>
        </div>
      </div>

      {/* Collapsible News List Section */}
      <div className="bg-white dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsListExpanded(!isListExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-4 text-right">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
              <List className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">قائمة الأخبار المنشورة</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">إدارة وتعديل الأخبار السابقة ({newsList.length} خبر)</p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 transition-transform duration-300 ${isListExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </button>

        <AnimatePresence>
          {isListExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 border-t border-gray-50 dark:border-gray-700">
                {loadingList ? (
                  <div className="text-center py-10 text-gray-500 font-bold">جاري جلب قائمة الأخبار ...</div>
                ) : newsList.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-lg text-right">لا توجد أخبار مضافة حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {newsList.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-5 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all group">
                        {item.imageUrl ? (
                          <div className="w-full sm:w-[140px] h-[100px] rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                             <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full sm:w-[140px] h-[100px] rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shrink-0">
                             <FileText className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                           <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1.5 flex-wrap">
                                 <span className="text-[10px] font-bold text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString('ar-YE')}
                                 </span>
                                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${item.isBreaking ? 'bg-red-600 text-white' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {item.isBreaking ? 'مباشر' : item.category}
                                 </span>
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors text-right">{item.title}</h4>
                           </div>
                           
                           <div className="flex items-center justify-end gap-2 mt-4">
                              <button onClick={() => { handleEditClick(item); setCurrentStep(1); }} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="تعديل">
                                <Edit className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="حذف">
                                <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {showCatManager && <CategoryManagerModal />}
    </div>
  );
}
