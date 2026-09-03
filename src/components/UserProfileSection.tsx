import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { 
  Mail, 
  MapPin, 
  Calendar, 
  LogOut, 
  Bell, 
  Palette, 
  Bookmark, 
  CheckCircle2, 
  Share2, 
  Sliders,
  BellRing,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  Type,
  Sparkles,
  RotateCcw,
  Eye,
  Check,
  X
} from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { useTextSize, TextSizeMode, TEXT_SIZE_MAP } from "../context/TextSizeContext";
import { 
  NOTIFICATION_CHANNELS_LIST, 
  NotificationChannelsState, 
  getSavedNotificationChannels, 
  saveNotificationChannels,
  requestNativeNotificationPermission 
} from "../services/NotificationPreferencesService";
import { OnboardingWizard } from "./OnboardingWizard";
import { FavoritesList } from "./FavoritesList";
import { ContactUsSection } from "./ContactUsSection";
import { getShareableUrl } from "../config/apiConfig";

interface UserProfileSectionProps {
  user: FirebaseUser;
  profile: UserProfile;
  logout: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
  hideHeaderLogout?: boolean;
}

export function UserProfileSection({ profile, logout, hideHeaderLogout = false, onProfileUpdated }: UserProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<"favorites" | "preferences" | "notifications">("favorites");
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const { textSize, setTextSize, sliderValue, setSliderValue, getTextSizeLabel } = useTextSize();
  
  // Local profile state
  const [localProfile] = useState<UserProfile>(profile);

  // Show Onboarding Wizard Modal state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Notification Channels (All 8 Sections)
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannelsState>(() => {
    return getSavedNotificationChannels();
  });

  // Single Notification Toggle State
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    const localVal = localStorage.getItem("push_notifications_enabled");
    if (localVal !== null) return localVal === "true";
    if (profile.notificationSettings?.enabled !== undefined) {
      return !!profile.notificationSettings.enabled;
    }
    return false;
  });

  const [isRequestingNotif, setIsRequestingNotif] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats Counters from localStorage
  const [bookmarksCount, setBookmarksCount] = useState(0);

  useEffect(() => {
    // Check initial native or web permission status
    if (Capacitor.isNativePlatform()) {
      PushNotifications.checkPermissions().then((status) => {
        if (status?.receive === "granted") {
          const localVal = localStorage.getItem("push_notifications_enabled");
          if (localVal !== "false") {
            setNotifEnabled(true);
          }
        } else {
          setNotifEnabled(false);
        }
      }).catch(() => {});
    } else if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const localVal = localStorage.getItem("push_notifications_enabled");
        if (localVal !== "false") {
          setNotifEnabled(true);
        }
      } else if (Notification.permission === "denied") {
        setNotifEnabled(false);
      }
    }
  }, []);

  useEffect(() => {
    // Read stats
    const favs = localStorage.getItem("favorite_items");
    if (favs) {
      try {
        setBookmarksCount(JSON.parse(favs).length);
      } catch {}
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleChannel = async (channelId: string) => {
    const updated = {
      ...notificationChannels,
      [channelId]: !notificationChannels[channelId],
    };
    setNotificationChannels(updated);
    await saveNotificationChannels(updated);
    showToast(`تم تحديث إعدادات تنبيهات ${NOTIFICATION_CHANNELS_LIST.find(c => c.id === channelId)?.name || ""}`);
  };

  const handleToggleAllChannels = async (enable: boolean) => {
    const updated: NotificationChannelsState = {};
    NOTIFICATION_CHANNELS_LIST.forEach((ch) => {
      updated[ch.id] = enable;
    });
    setNotificationChannels(updated);
    await saveNotificationChannels(updated);
    showToast(enable ? "تم تفعيل إشعارات كافة الأقسام" : "تم تعطيل إشعارات كافة الأقسام");
  };

  const areAllChannelsEnabled = NOTIFICATION_CHANNELS_LIST.every((ch) => notificationChannels[ch.id]);

  const handleToggleNotifications = async () => {
    if (isRequestingNotif) return;

    if (!notifEnabled) {
      // User is enabling notifications -> Trigger native permissions dialog
      setIsRequestingNotif(true);
      try {
        const granted = await requestNativeNotificationPermission();
        if (granted) {
          setNotifEnabled(true);
          localStorage.setItem("push_notifications_enabled", "true");
          await saveNotificationChannels(notificationChannels);
          showToast("تم تفعيل الإشعارات والتنبيهات المباشرة بنجاح 🔔");
        } else {
          setNotifEnabled(false);
          localStorage.setItem("push_notifications_enabled", "false");
          showToast("لم يتم منح إذن الإشعارات من النظام");
        }
      } catch (e) {
        console.error("Notification permission error:", e);
        showToast("حدث خطأ أثناء طلب الإذن، يرجى المحاولة لاحقاً");
      } finally {
        setIsRequestingNotif(false);
      }
    } else {
      // User is disabling notifications
      setNotifEnabled(false);
      localStorage.setItem("push_notifications_enabled", "false");
      try {
        if (profile?.uid) {
          const userRef = doc(db, "users", profile.uid);
          await setDoc(userRef, { 
            notificationSettings: { 
              enabled: false,
              urgent: false,
              news: false,
              articles: false,
              videos: false,
              leader: false,
              live: false,
              lessons: false,
              activities: false,
            } 
          }, { merge: true });
        }
        showToast("تم إيقاف استقبال الإشعارات");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const exportUserData = () => {
    const data = {
      profile: localProfile,
      favorites: localStorage.getItem("favorite_items"),
      quranBookmarks: localStorage.getItem("quran_bookmarks"),
      exportDate: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `Taiz_Platform_Profile_${profile.uid.substring(0, 6)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("تم تحميل ملف نسخ البيانات الاحتياطي 📦");
  };

  const createdDateFormatted = new Date(localProfile.createdAt || Date.now()).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-6 pb-28 font-sans animate-fade-in text-slate-800 dark:text-slate-100" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. LUXURY PROFILE HERO & COVER HEADER */}
      <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden bg-white dark:bg-[#0D1A33] border border-slate-200/80 dark:border-[#1E355B] shadow-xl mb-6">
        
        {/* Cover Background with Royal Gradient Pattern */}
        <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 relative overflow-hidden">
          {/* Subtle Decorative Geometric Circles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        </div>

        {/* User Details Area */}
        <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 mb-5 gap-4">
            
            {/* Avatar & Status Pulse */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                {localProfile.photoURL ? (
                  <img 
                    src={localProfile.photoURL} 
                    alt={localProfile.displayName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center text-white text-3xl font-black">
                    {localProfile.displayName.charAt(0) || "U"}
                  </div>
                )}
              </div>
              
              {/* Active Pulse Dot */}
              <div className="absolute bottom-1 right-2 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center" title="متصل الآن">
                <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
              </div>
            </div>

            {/* Quick Actions (Share & Logout) */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getShareableUrl());
                  showToast("تم نسخ رابط الحساب الشخصي 📋");
                }}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
                title="مشاركة الحساب"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة</span>
              </button>

              {!hideHeaderLogout && (
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/30 dark:hover:bg-red-600 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-red-200 dark:border-red-900/50 transition-all cursor-pointer active:scale-95 shadow-xs"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </div>
          </div>

          {/* User Text Info */}
          <div className="text-center sm:text-right space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-cairo">
                {localProfile.displayName}
              </h1>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 dark:fill-emerald-900" />
                <span>عضو موثق</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              {localProfile.bio || "متابع شغوف للأنشطة والأخبار المحلية والتحديثات المباشرة على منصة تعز الإعلامية."}
            </p>

            {/* Meta Tags List */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-5 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{localProfile.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{localProfile.city || "تعز، اليمن"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>عضو منذ: {createdDateFormatted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABBED NAVIGATION MENU */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: "favorites", label: "المفضلة", icon: Bookmark, badge: bookmarksCount },
          { id: "preferences", label: "التفضيلات والمظهر", icon: Palette },
          { id: "notifications", label: "إعدادات التنبيهات", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/25 scale-[1.02]"
                  : "bg-white dark:bg-[#0D1A33] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#14274B] border border-slate-200/60 dark:border-[#1E355B]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN TAB CONTENTS */}
      <div className="space-y-8">

        {/* TAB: FAVORITES SHOWCASE */}
        {activeTab === "favorites" && (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
            <FavoritesList />
          </div>
        )}

        {/* TAB 2: PREFERENCES & CUSTOMIZATION */}
        {activeTab === "preferences" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 animate-fade-in">
            
            {/* 1. Dark Mode / Theme Mode Customization */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/80 pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-cairo">
                      مظهر وثيم المنصة (Dark Mode)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      التبديل بين الوضع الفاتح والوضع الداكن الكحلي المريح للعينين في جميع أقسام المنصة.
                    </p>
                  </div>
                </div>

                {/* Quick Toggle Switch */}
                <button
                  onClick={toggleTheme}
                  className={`w-14 h-7 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    isDark ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  title={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-0.5 transition-all flex items-center justify-center text-[10px] ${
                      isDark ? "right-7 text-indigo-600" : "right-0.5 text-amber-500"
                    }`}
                  >
                    {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  </div>
                </button>
              </div>

              {/* Theme Mode Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  {
                    id: "light",
                    title: "الوضع الفاتح",
                    desc: "ألوان كلاسيكية ناصعة وواضحة",
                    icon: Sun,
                    badge: "نهاري",
                    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  },
                  {
                    id: "dark",
                    title: "الوضع الداكن (كحلي)",
                    desc: "ألوان كحلية عميقة ومريحة للعينين",
                    icon: Moon,
                    badge: "Dark Navy",
                    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
                  },
                  {
                    id: "system",
                    title: "تلقائي حسب الجهاز",
                    desc: "يتكيف تلقائياً مع إعدادات هاتفك",
                    icon: Laptop,
                    badge: "تلقائي",
                    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTheme(item.id as ThemeMode);
                        showToast(`تم تفعيل: ${item.title}`);
                      }}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-500/10 via-slate-50 to-indigo-500/5 dark:from-indigo-950/50 dark:via-[#0E1B33] dark:to-indigo-900/30 border-indigo-500 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/20"
                          : "bg-slate-50/70 dark:bg-[#0A1324]/80 border-slate-200/80 dark:border-[#1E355B] hover:bg-slate-100 dark:hover:bg-[#11223F]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white font-cairo flex items-center gap-1.5">
                          {item.title}
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 inline" />}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-cairo mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Theme description callout */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-200/50 dark:border-indigo-900/40 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <span className="leading-relaxed">
                  يعتمد الوضع الداكن للمنصة على درجات <strong className="font-black text-indigo-700 dark:text-indigo-300">الكحلي الغامق الفاخر (Dark Navy)</strong> مع درجات تباين متناسقة تضمن راحة العين أثناء القراءة ليلاً وتوفير طاقة البطارية.
                </span>
              </div>
            </div>
            
            {/* 2. Reading Font Size Customization with Global Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-[#D9A441]" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white font-cairo">
                    حجم النصوص في المنصة بالكامل
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#D9A441]/15 text-[#BF841F] dark:text-[#E6B758] border border-[#D9A441]/30 font-black text-xs">
                  {getTextSizeLabel()} ({TEXT_SIZE_MAP[textSize].px})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يتم تطبيق حجم الخط المختار على كافة نصوص وعناصر وأخبار المنصة بالكامل وبشكل فوري.
              </p>

              {/* Interactive Slider Track */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                <div className="relative flex items-center select-none py-1">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={sliderValue}
                    onChange={(e) => {
                      setSliderValue(Number(e.target.value));
                      showToast(`تم ضبط حجم النص على: ${getTextSizeLabel()}`);
                    }}
                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#D9A441] focus:outline-none"
                  />
                </div>

                {/* Step Labels: تكبير ————— وسط ————— تصغير */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {[
                    { val: 1, label: "تصغير", sub: "14px" },
                    { val: 2, label: "وسط (الافتراضي)", sub: "16px" },
                    { val: 3, label: "تكبير", sub: "18.5px" },
                  ].map((item) => {
                    const isCurrent = sliderValue === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setSliderValue(item.val);
                          showToast(`تم ضبط حجم النص على: ${item.label}`);
                        }}
                        className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                          isCurrent
                            ? "text-[#D9A441] dark:text-[#E6B758] font-black scale-105"
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{item.label}</span>
                        <span className="text-[10px] opacity-75">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    معاينة النص الحية
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    مطبق على التطبيق بالكامل
                  </span>
                </div>
                <p className="font-cairo leading-relaxed text-slate-800 dark:text-slate-200 transition-all text-base">
                  منصة تعز الإعلامية: التغطية الشاملة والمباشرة للأحداث السياسية، الاجتماعية، والأنشطة الثقافية في محافظة تعز واليمن.
                </p>
              </div>
            </div>

            {/* 3. Re-run Onboarding Wizard Banner & Interactive Tour */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#D9A441]/10 via-slate-50 to-transparent dark:from-[#D9A441]/15 dark:via-slate-800/40 dark:to-transparent border border-[#D9A441]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D9A441]" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-cairo">
                      معالج الإعداد الأولي (Onboarding Wizard)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                    يمكنك إعادة تشغيل المعالج الاسترشادي المكون من 3 خطوات لضبط المظهر وحجم الخط والإشعارات دفعة واحدة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOnboardingModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#BF841F] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#D9A441]/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة تشغيل المعالج</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-transparent dark:from-emerald-500/15 dark:via-slate-800/40 dark:to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-cairo">
                      الجولة التعريفية التفاعلية (Interactive Tour)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                    استعراض الشرح التفاعلي لأهم أقسام ووظائف المنصة وشريط التنقل والهيدر العلوي.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("reopen_interactive_tour"));
                    showToast("جاري بدء الجولة التعريفية...");
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>بدء الجولة التعريفية</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: NOTIFICATION SETTINGS */}
        {activeTab === "notifications" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" /> إعدادات التنبيهات والإشعارات المباشرة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  التحكم في استقبال الإشعارات والتنبيهات المباشرة لكافة أقسام وأنشطة المنصة.
                </p>
              </div>

              {/* Master Push Toggle Button */}
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  notifEnabled
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                <BellRing className="w-4 h-4" />
                <span>{notifEnabled ? "خدمة الإشعارات مفعلة" : "تفعيل خدمة الإشعارات"}</span>
              </button>
            </div>

            {/* Notification Sections Grid (All 8 Channels) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تخصيص تنبيهات الأقسام (8 أقسام):
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleAllChannels(!areAllChannelsEnabled)}
                  className="text-xs font-bold text-[#D9A441] dark:text-[#E6B758] hover:underline cursor-pointer"
                >
                  {areAllChannelsEnabled ? "تعطيل الكل" : "تفعيل الكل"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NOTIFICATION_CHANNELS_LIST.map((channel) => {
                  const Icon = channel.icon;
                  const isEnabled = !!notificationChannels[channel.id];

                  return (
                    <div
                      key={channel.id}
                      onClick={() => handleToggleChannel(channel.id)}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isEnabled
                          ? "bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-xs"
                          : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${channel.bgColor} ${channel.borderColor} border`}>
                          <Icon className={`w-4 h-4 ${channel.color}`} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {channel.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-[150px]">
                            {channel.description}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                          isEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all ${
                            isEnabled ? "mr-auto" : "ml-auto"
                          }`}
                        >
                          {isEnabled ? (
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-slate-400 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Note */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <p className="leading-relaxed">
                  يتم حفظ تفضيلات التنبيهات محلياً ومزامنتها مع حسابك. ستصلك الإشعارات الفورية للأقسام المحددة أعلاه فقط.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Manual Onboarding Wizard Modal */}
      <AnimatePresence>
        {showOnboardingModal && (
          <OnboardingWizard
            onComplete={() => {
              setShowOnboardingModal(false);
              showToast("تم تحديث وحفظ كافة التفضيلات بنجاح ✨");
            }}
            isManualReopen
          />
        )}
      </AnimatePresence>

      {/* 4. RESTORED SOCIAL LINKS SECTION (تابعنا) AT THE BOTTOM */}
      <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800">
        <ContactUsSection />
      </div>

    </div>
  );
}

