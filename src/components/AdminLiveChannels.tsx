import React, { useState, useEffect } from "react";
import { 
  Tv, 
  Radio, 
  Plus, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Trash2, 
  Save, 
  Play, 
  Check, 
  LayoutGrid, 
  SlidersHorizontal, 
  CreditCard, 
  Tag, 
  Eye, 
  EyeOff, 
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { LiveStream, ChannelDisplayMode, LiveStreamSettings } from "../types";
import { SyncService } from "../services/SyncService";
import { ImageUpload } from "./ImageUpload";
import { sendFCMNotification } from "../utils/sendFCM";
import { motion, Reorder } from "motion/react";

const DISPLAY_MODES: { id: ChannelDisplayMode; title: string; desc: string; icon: any }[] = [
  {
    id: "grid",
    title: "شبكة كبسولات دائرية",
    desc: "عرض أيقونات وشعارات القنوات في شبكة دائرية مدمجة مع شارة البث الحي",
    icon: LayoutGrid
  },
  {
    id: "carousel",
    title: "شريط تمرير أفقي",
    desc: "سلايدر أفقي انسيابي قابل للسحب والتمرير السريع مناسب للشاشات والهواتف",
    icon: SlidersHorizontal
  },
  {
    id: "cards",
    title: "بطاقات استعراض فاخرة",
    desc: "بطاقات غنية تعرض شعار القناة واسمها ووصفها مع زر تشغيل مباشر",
    icon: CreditCard
  },
  {
    id: "compact",
    title: "كبسولات نصية مدمجة",
    desc: "أزرار بيضاوية مدمجة وعصرية تعرض اسم القناة وشارة البث بدقة",
    icon: Layers
  }
];

const PRESET_BADGES = ["رئيسية", "إخبارية", "HD", "بث مباشر", "ثقافية", "منوعات", "شعبية"];

export function AdminLiveChannels() {
  const [channels, setChannels] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tv" | "radio" | "all" | "display">("tv");
  
  // Display Mode Settings
  const [displaySettings, setDisplaySettings] = useState<LiveStreamSettings>({
    tvDisplayMode: "grid",
    showBadges: true,
    showChannelCount: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Form states for creating / editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"tv" | "radio">("tv");
  const [badge, setBadge] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [savingChannel, setSavingChannel] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Reorder notification state
  const [orderSavedToast, setOrderSavedToast] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [previewStreamUrl, setPreviewStreamUrl] = useState<string | null>(null);

  // Load channels and global display settings
  useEffect(() => {
    // 1. Subscribe to channels
    const q = query(collection(db, "livestreams"), orderBy("createdAt", "desc"));
    const unsubChannels = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LiveStream));
      // Sort primarily by order if exists, otherwise by createdAt
      docs.sort((a, b) => {
        const orderA = a.order !== undefined && a.order !== null ? a.order : 999;
        const orderB = b.order !== undefined && b.order !== null ? b.order : 999;
        if (orderA !== orderB) return orderA - orderB;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setChannels(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Error fetching livestreams in admin:", err);
      setLoading(false);
    });

    // 2. Subscribe to display settings
    const unsubSettings = onSnapshot(doc(db, "settings", "livestream"), (snapshot) => {
      if (snapshot.exists()) {
        setDisplaySettings(snapshot.data() as LiveStreamSettings);
      }
    });

    return () => {
      unsubChannels();
      unsubSettings();
    };
  }, []);

  // Filtered lists
  const tvChannels = channels.filter(c => (c.type || "tv") === "tv");
  const radioChannels = channels.filter(c => c.type === "radio");
  const displayedChannels = activeTab === "tv" ? tvChannels : activeTab === "radio" ? radioChannels : channels;

  // Handle Drag & Drop reorder
  const handleReorderList = async (newOrderList: LiveStream[]) => {
    // Update local state smoothly
    if (activeTab === "tv") {
      const otherChannels = channels.filter(c => c.type === "radio");
      const updatedTvList = newOrderList.map((item, idx) => ({ ...item, order: idx + 1 }));
      setChannels([...updatedTvList, ...otherChannels]);
      await persistOrderToDb(updatedTvList);
    } else if (activeTab === "radio") {
      const otherChannels = channels.filter(c => (c.type || "tv") === "tv");
      const updatedRadioList = newOrderList.map((item, idx) => ({ ...item, order: idx + 1 }));
      setChannels([...otherChannels, ...updatedRadioList]);
      await persistOrderToDb(updatedRadioList);
    } else {
      const updatedList = newOrderList.map((item, idx) => ({ ...item, order: idx + 1 }));
      setChannels(updatedList);
      await persistOrderToDb(updatedList);
    }
  };

  // Batch persist order to Firestore
  const persistOrderToDb = async (items: LiveStream[]) => {
    setIsSavingOrder(true);
    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        if (item.id) {
          const ref = doc(db, "livestreams", item.id);
          batch.update(ref, { 
            order: index + 1,
            updatedAt: Date.now()
          });
        }
      });
      await batch.commit();
      setOrderSavedToast(true);
      setTimeout(() => setOrderSavedToast(false), 2500);
    } catch (e) {
      console.error("Failed to batch update orders:", e);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Move channel Up or Down
  const handleMoveStep = async (item: LiveStream, direction: "up" | "down") => {
    const listToWork = [...(activeTab === "radio" ? radioChannels : tvChannels)];
    const currentIndex = listToWork.findIndex(c => c.id === item.id);
    if (currentIndex === -1) return;

    if (direction === "up" && currentIndex > 0) {
      const target = listToWork[currentIndex - 1];
      listToWork[currentIndex - 1] = listToWork[currentIndex];
      listToWork[currentIndex] = target;
      await handleReorderList(listToWork);
    } else if (direction === "down" && currentIndex < listToWork.length - 1) {
      const target = listToWork[currentIndex + 1];
      listToWork[currentIndex + 1] = listToWork[currentIndex];
      listToWork[currentIndex] = target;
      await handleReorderList(listToWork);
    }
  };

  // Save Display Settings
  const handleSaveDisplaySettings = async (newMode?: ChannelDisplayMode) => {
    setSavingSettings(true);
    try {
      const payload: LiveStreamSettings = {
        ...displaySettings,
        tvDisplayMode: newMode || displaySettings.tvDisplayMode || "grid",
        updatedAt: Date.now()
      };
      await setDoc(doc(db, "settings", "livestream"), payload, { merge: true });
      setDisplaySettings(payload);
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving livestream display settings:", err);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSavingSettings(false);
    }
  };

  // Save or Update Channel
  const handleSaveChannel = async () => {
    if (!name.trim() || !url.trim()) {
      alert("يرجى إدخال اسم القناة ورابط البث المباشر");
      return;
    }

    setSavingChannel(true);
    try {
      // Process Stream URL
      let finalUrl = url.trim();
      if (
        finalUrl.includes("youtube.com/watch?v=") ||
        finalUrl.includes("youtu.be/") ||
        finalUrl.includes("youtube.com/live/")
      ) {
        const videoIdMatch = finalUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch && videoIdMatch[1]) {
          finalUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=1`;
        }
      } else if (finalUrl.includes("/w/") || finalUrl.includes("/videos/watch/")) {
        finalUrl = finalUrl.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
      }

      const calculatedOrder = orderIndex > 0 
        ? Number(orderIndex) 
        : (editingId ? (channels.find(c => c.id === editingId)?.order || channels.length + 1) : channels.length + 1);

      const payload: Partial<LiveStream> = {
        name: name.trim(),
        url: finalUrl,
        iconUrl: iconUrl.trim(),
        description: description.trim() || "",
        type,
        badge: badge.trim() || "",
        order: calculatedOrder,
        isActive,
        updatedAt: Date.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "livestreams", editingId), payload);
      } else {
        const newDocRef = await addDoc(collection(db, "livestreams"), {
          ...payload,
          createdAt: Date.now(),
        });

        // Trigger notification for new channel addition
        const cleanName = name.trim();
        const notifTitle = `بث مباشر | ${cleanName}`;
        const notifBody = type === "tv" ? `تمت إضافة قناة تلفزيونية جديدة: ${cleanName}` : `تمت إضافة إذاعة جديدة: ${cleanName}`;
        sendFCMNotification(
          notifTitle,
          notifBody,
          "tv",
          newDocRef.id,
          iconUrl.trim() || ""
        );
      }

      // Reset form
      resetForm();
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error saving livestream channel:", err);
      alert("حدث خطأ أثناء حفظ القناة");
    } finally {
      setSavingChannel(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setUrl("");
    setIconUrl("");
    setDescription("");
    setType("tv");
    setBadge("");
    setOrderIndex(channels.length + 1);
    setIsActive(true);
  };

  const handleEdit = (channel: LiveStream) => {
    setEditingId(channel.id);
    setName(channel.name || "");
    setUrl(channel.url || channel.streamUrl || "");
    setIconUrl(channel.iconUrl || "");
    setDescription(channel.description || "");
    setType(channel.type || "tv");
    setBadge(channel.badge || "");
    setOrderIndex(channel.order || 1);
    setIsActive(channel.isActive ?? true);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "livestreams", id));
      await SyncService.trackDeletion("livestreams", id);
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting livestream channel:", err);
      alert("خطأ أثناء حذف القناة");
    }
  };

  const toggleChannelActive = async (channel: LiveStream) => {
    try {
      await updateDoc(doc(db, "livestreams", channel.id), {
        isActive: !channel.isActive,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error("Error toggling channel active state:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-l from-red-700 via-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-red-900/10 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20">
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span>نظام إدارة البث والترتيب الذكي</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-cairo">
            إدارة وترتيب القنوات التلفزيونية والإذاعية
          </h2>
          <p className="text-xs sm:text-sm text-red-100 font-medium font-cairo max-w-xl">
            تحكم كامل في ترتيب ظهور القنوات بالسحب والإفلات، واختيار طريقة عرضها الفنية المناسبة لزوار المنصة.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 px-5 py-3 rounded-2xl font-black font-cairo text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>إضافة قناة جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-soft flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tab 1: TV */}
          <button
            onClick={() => setActiveTab("tv")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-cairo text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "tv"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>قنوات التلفزيون</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeTab === "tv" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {tvChannels.length}
            </span>
          </button>

          {/* Tab 2: Radio */}
          <button
            onClick={() => setActiveTab("radio")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-cairo text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "radio"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>الإذاعات</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeTab === "radio" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {radioChannels.length}
            </span>
          </button>

          {/* Tab 3: Display Settings */}
          <button
            onClick={() => setActiveTab("display")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-cairo text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "display"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>طريقة العرض في المنصة</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          </button>
        </div>

        {/* Reorder Helper Tip / Indicator */}
        {activeTab !== "display" && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
            <span>اسحب أي بطاقة لإعادة الترتيب المباشر</span>
          </div>
        )}
      </div>

      {/* Floating Save Toast for Reordering */}
      {orderSavedToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold font-cairo flex items-center gap-2 text-sm border border-emerald-400/30"
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>تم حفظ الترتيب الجديد للقنوات بنجاح!</span>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION: DISPLAY SETTINGS & PRESENTATION STYLES */}
      {/* ---------------------------------------------------- */}
      {activeTab === "display" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black font-cairo text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  <span>تحديد نمط وطريقة عرض قنوات التلفزيون</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-cairo">
                  اختر الشكل الفني الذي ستظهر به القنوات التلفزيونية للمستخدمين في صفحة المشاهدة
                </p>
              </div>

              {settingsSavedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <Check className="w-4 h-4" />
                  <span>تم التطبيق في الموقع</span>
                </div>
              )}
            </div>

            {/* Display Modes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DISPLAY_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = (displaySettings.tvDisplayMode || "grid") === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setDisplaySettings(prev => ({ ...prev, tvDisplayMode: mode.id }));
                      handleSaveDisplaySettings(mode.id);
                    }}
                    className={`text-right p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer relative group ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                        : "bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-slate-600"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-cairo">
                            {mode.title}
                          </h4>
                          <span className={`text-[10px] font-bold ${
                            isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                          }`}>
                            {isSelected ? "النمط المفعل حالياً" : "انقر للتفعيل"}
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-600 text-white" 
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium font-cairo leading-relaxed">
                      {mode.desc}
                    </p>

                    {/* Visual Mini Preview Representation */}
                    <div className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-inner">
                      {mode.id === "grid" && (
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40" />
                              <div className="w-7 h-1.5 bg-slate-300 dark:bg-slate-600 rounded" />
                            </div>
                          ))}
                        </div>
                      )}

                      {mode.id === "carousel" && (
                        <div className="flex items-center gap-2 overflow-hidden">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0 border border-slate-200 dark:border-slate-700">
                              <div className="w-3.5 h-3.5 rounded-full bg-red-500/30" />
                              <div className="w-8 h-1.5 bg-slate-300 dark:bg-slate-600 rounded" />
                            </div>
                          ))}
                        </div>
                      )}

                      {mode.id === "cards" && (
                        <div className="grid grid-cols-2 gap-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="w-6 h-6 rounded-md bg-red-500/20 border border-red-500/40 shrink-0" />
                              <div className="flex flex-col gap-1 w-full">
                                <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-500 rounded" />
                                <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {mode.id === "compact" && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Extra Display Options */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white font-cairo">
                    إظهار شارات القنوات (Badges)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-cairo">
                    إبراز علامات مثل "رئيسية" أو "إخبارية" أو "HD" فوق الشعار
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={displaySettings.showBadges ?? true}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setDisplaySettings(prev => ({ ...prev, showBadges: val }));
                    setDoc(doc(db, "settings", "livestream"), { showBadges: val }, { merge: true });
                  }}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white font-cairo">
                    إظهار عداد القنوات المتاحة
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-cairo">
                    عرض إجمالي القنوات المتاحة للمشاهدة في ترويسة القسم
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={displaySettings.showChannelCount ?? true}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setDisplaySettings(prev => ({ ...prev, showChannelCount: val }));
                    setDoc(doc(db, "settings", "livestream"), { showChannelCount: val }, { merge: true });
                  }}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION: CHANNEL CREATION / EDIT MODAL & FORM */}
      {/* ---------------------------------------------------- */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-red-500/30 dark:border-red-500/40 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shadow-sm">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white font-cairo">
                  {editingId ? "تعديل بيانات القناة / الإذاعة" : "إضافة قناة بث مباشر جديدة"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                  املأ البيانات التالية لربط القناة بالبث وتحديد ترتيبها وظهورها
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold font-cairo px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                اسم القناة أو الإذاعة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: قناة المسيرة مباشر، إذاعة تعز FM..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                نوع البث <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("tv")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-cairo text-xs transition-all cursor-pointer ${
                    type === "tv"
                      ? "bg-red-50 dark:bg-red-950/50 border-red-500 text-red-600 dark:text-red-400 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>تلفزيون (TV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("radio")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-cairo text-xs transition-all cursor-pointer ${
                    type === "radio"
                      ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-600 dark:text-amber-400 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>إذاعة (Radio)</span>
                </button>
              </div>
            </div>

            {/* Stream URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                رابط البث المباشر (Stream / Embed URL) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="رابط يوتيوب مباشر أو تضمين Embed أو رابط M3U8 أو بث صوتي..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/40 text-left"
                  dir="ltr"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setPreviewStreamUrl(url)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold font-cairo text-xs flex items-center gap-1 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-red-600" />
                    <span>تجربة</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-cairo">
                النظام يدعم تلقائياً روابط YouTube Live وتحويلها إلى مشغل مباشر مدمج بدون إعلانات مزعجة.
              </p>
            </div>

            {/* Icon URL & Upload */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                شعار القناة / أيقونة العرض (URL أو رفع ملف)
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {iconUrl ? (
                    <img src={iconUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Tv className="w-6 h-6 text-slate-400 opacity-60" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    placeholder="ضع رابط صورة الشعار هنا أو استخدم زر الرفع أدناه..."
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/40 text-left"
                    dir="ltr"
                  />
                  <ImageUpload 
                    value={iconUrl}
                    onChange={(url) => setIconUrl(url)}
                    onRemove={() => setIconUrl("")}
                    label="أو رفع شعار من جهازك"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                وصف موجز للقناة (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="نبذة سريعة تظهر للمستخدم عند تحديد القناة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-cairo focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            {/* Order & Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                رقم الترتيب في القائمة (1 للأعلى)
              </label>
              <input
                type="number"
                min="1"
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-cairo focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            {/* Custom Badge Tag */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                شارة القناة (Badge)
              </label>
              <input
                type="text"
                placeholder="مثال: رئيسية، إخبارية، HD..."
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-cairo focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {PRESET_BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBadge(b)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    +{b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
              <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white font-cairo">
                القناة مفعلة وتظهر للزوار في صفحة المشاهدة
              </span>
            </label>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSaveChannel}
              disabled={savingChannel}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold font-cairo text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4.5 h-4.5" />
              <span>{savingChannel ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة القناة"}</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold font-cairo text-sm transition-colors"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      )}

      {/* Stream Quick Tester Modal */}
      {previewStreamUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-2xl w-full space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm font-cairo flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500" />
                <span>معاينة مشغل البث</span>
              </h4>
              <button
                onClick={() => setPreviewStreamUrl(null)}
                className="text-slate-400 hover:text-white text-xs font-bold font-cairo"
              >
                إغلاق
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
              <iframe
                src={previewStreamUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION: REORDERABLE CHANNELS LIST */}
      {/* ---------------------------------------------------- */}
      {activeTab !== "display" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <ArrowUpDown className="w-4.5 h-4.5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white font-cairo">
                  ترتيب {activeTab === "tv" ? "قنوات التلفزيون" : activeTab === "radio" ? "الإذاعات" : "جميع القنوات"} ({displayedChannels.length})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-cairo">
                  القناة الأولى في الترتيب هي القناة الافتراضية التي تعمل تلقائياً عند فتح القسم
                </p>
              </div>
            </div>

            {/* Quick Sort Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const sorted = [...displayedChannels].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                  handleReorderList(sorted);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs font-bold font-cairo transition-colors"
                title="ترتيب حسب الأحدث"
              >
                الأحدث أولاً
              </button>

              <button
                onClick={() => {
                  const sorted = [...displayedChannels].sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
                  handleReorderList(sorted);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs font-bold font-cairo transition-colors"
                title="ترتيب أبجدي"
              >
                أبجدياً (أ-ي)
              </button>

              <button
                onClick={() => persistOrderToDb(displayedChannels)}
                disabled={isSavingOrder}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-cairo shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingOrder ? "جاري الحفظ..." : "حفظ الترتيب"}</span>
              </button>
            </div>
          </div>

          {/* Reorder Group */}
          {displayedChannels.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Tv className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 font-cairo">
                لا توجد قنوات مضافة في هذا القسم حالياً
              </h4>
              <p className="text-xs text-slate-400 font-cairo">
                انقر على زر "إضافة قناة جديدة" لإضافة أول قناة وبدء البث
              </p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={displayedChannels}
              onReorder={handleReorderList}
              className="space-y-3"
            >
              {displayedChannels.map((channel, index) => (
                <Reorder.Item
                  key={channel.id}
                  value={channel}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-medium hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-grab active:cursor-grabbing select-none"
                >
                  {/* Left: Drag Handle, Number, Icon & Name */}
                  <div className="flex items-center gap-3.5">
                    {/* Drag Grip Handle */}
                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-grab active:cursor-grabbing shrink-0">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Order Index Badge */}
                    <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 font-black text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    {/* Channel Logo */}
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                      {channel.iconUrl ? (
                        <img 
                          src={channel.iconUrl} 
                          alt={channel.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=120&q=80';
                          }}
                        />
                      ) : (
                        channel.type === "radio" ? <Radio className="w-5 h-5 text-amber-500" /> : <Tv className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-cairo">
                          {channel.name}
                        </h4>

                        {/* Badges */}
                        {channel.badge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            {channel.badge}
                          </span>
                        )}

                        {channel.type === "radio" ? (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            FM
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
                            HD
                          </span>
                        )}

                        {index === 0 && (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            القناة الافتراضية
                          </span>
                        )}
                      </div>

                      {channel.description ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-cairo max-w-md">
                          {channel.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-mono line-clamp-1 max-w-md" dir="ltr">
                          {channel.url || channel.streamUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Ordering Buttons & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Up & Down Step Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStep(channel, "up");
                        }}
                        disabled={index === 0}
                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStep(channel, "down");
                        }}
                        disabled={index === displayedChannels.length - 1}
                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Active Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChannelActive(channel);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-cairo flex items-center gap-1.5 transition-colors cursor-pointer ${
                        channel.isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                      title={channel.isActive ? "القناة مفعلة (انقر للتعطيل)" : "القناة معطلة (انقر للتفعيل)"}
                    >
                      {channel.isActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>مفعلة</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>مخفية</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(channel);
                      }}
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      title="تعديل القناة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete with Confirm */}
                    {deletingId === channel.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 rounded-xl border border-red-200 dark:border-red-800">
                        <span className="text-[11px] font-bold text-red-600 px-1">حذف؟</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(channel.id);
                          }}
                          className="bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold"
                        >
                          نعم
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-lg font-bold"
                        >
                          لا
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(channel.id);
                        }}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="حذف القناة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      )}
    </div>
  );
}
