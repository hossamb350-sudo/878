import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  MapPin, 
  Calendar, 
  LogOut, 
  Bell, 
  Palette, 
  Bookmark, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  Sliders
} from "lucide-react";
import { FavoritesList } from "./FavoritesList";
import { ContactUsSection } from "./ContactUsSection";
import { getShareableUrl } from "../config/apiConfig";

interface UserProfileSectionProps {
  user: FirebaseUser;
  profile: UserProfile;
  logout: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export function UserProfileSection({ profile, logout }: UserProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<"favorites" | "preferences" | "notifications">("favorites");
  
  // Local profile state
  const [localProfile] = useState<UserProfile>(profile);

  // Preference States
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem("article_font_size") || "18");
  });

  // Notification Toggles
  const [notifSettings, setNotifSettings] = useState({
    urgent: profile.notificationSettings?.urgent ?? true,
    dailyEvents: profile.notificationSettings?.dailyEvents ?? true,
    prayerTimes: profile.notificationSettings?.prayerTimes ?? true,
    quranAudio: profile.notificationSettings?.quranAudio ?? true,
    articles: profile.notificationSettings?.articles ?? true,
  });

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats Counters from localStorage
  const [bookmarksCount, setBookmarksCount] = useState(0);

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

  const handleToggleNotif = async (key: keyof typeof notifSettings) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    try {
      const userRef = doc(db, "users", profile.uid);
      await setDoc(userRef, { notificationSettings: updated }, { merge: true });
      showToast("تم تحديث تفضيلات التنبيهات");
    } catch (e) {
      console.error(e);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem("article_font_size", size.toString());
    showToast(`تم ضبط حجم خط القراءة على ${size}px`);
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
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. LUXURY PROFILE HERO & COVER HEADER */}
      <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl mb-6">
        
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

              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/30 dark:hover:bg-red-600 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-red-200 dark:border-red-900/50 transition-all cursor-pointer active:scale-95 shadow-xs"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
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
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
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
            
            {/* Reading Font Size Customization */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white font-cairo">
                  حجم الخط في المقالات والأخبار
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر حجم الخط المناسب لك لتسهيل القراءة والمتابعة في جميع صفحات المنصة.
              </p>

              {/* Font Size Selectors */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { size: 14, label: "صغير (14px)" },
                  { size: 16, label: "عادي (16px)" },
                  { size: 18, label: "كبير (18px)" },
                  { size: 22, label: "ضخم (22px)" },
                ].map((item) => (
                  <button
                    key={item.size}
                    onClick={() => handleFontSizeChange(item.size)}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                      fontSize === item.size
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Live Preview Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">معاينة النص الحية</span>
                <p 
                  style={{ fontSize: `${fontSize}px` }} 
                  className="font-cairo leading-relaxed text-slate-800 dark:text-slate-200 transition-all"
                >
                  منصة تعز الإعلامية: التغطية الشاملة والمباشرة للأحداث السياسية، الاجتماعية، والأنشطة الثقافية في محافظة تعز واليمن.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: NOTIFICATION SETTINGS */}
        {activeTab === "notifications" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" /> إعدادات التنبيهات والإشعارات المباشرة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تخصيص أنواع الإشعارات المستلمة فور صدور الأخبار العاجلة أو التحديثات المهمة.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: "urgent", title: "الأخبار العاجلة والتحديثات الهامة", desc: "إشعارات فورية عند نشر شريط الأخبار العاجلة والأحداث الطارئة." },
                { key: "dailyEvents", title: "مناسبات تعز وتقويم اليوم", desc: "تنبيهات يومية بأهم المناسبات والتقويم الهجري والأحداث المرتقبة." },
                { key: "quranAudio", title: "دروس وهدي القرآن الكريم", desc: "تنبيهات عند إضافة سور أو محاضرات جديدة لمكتبة التلاوة." },
                { key: "articles", title: "أبرز المقالات والتحليلات السياسية", desc: "إشعارات فورية عند نشر المقالات لكبار الكتاب." },
              ].map((item) => {
                const isChecked = notifSettings[item.key as keyof typeof notifSettings];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleNotif(item.key as keyof typeof notifSettings)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-cairo">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>

                    <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isChecked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${isChecked ? "right-6" : "right-0.5"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 4. RESTORED SOCIAL LINKS SECTION (تابعنا) AT THE BOTTOM */}
      <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800">
        <ContactUsSection />
      </div>

    </div>
  );
}
