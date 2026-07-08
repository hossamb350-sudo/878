import { useState, useEffect } from "react";
import { ImageUpload } from "../components/ImageUpload";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithCredential,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { Capacitor } from "@capacitor/core";

const API_BASE = Capacitor.isNativePlatform() ? "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app" : "";

import { GoogleAuth } from "@southdevs/capacitor-google-auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  deleteDoc,
  orderBy,
  query,
  limit,
  onSnapshot,
  writeBatch,
  setDoc,
  getDoc,
} from "firebase/firestore";
import {
  LogOut,
  FileText,
  Video,
  Radio,
  Shield,
  BookOpen,
  Calendar as CalendarIcon,
  Trash2,
  Plus,
  List,
  Edit,
  AlertTriangle,
  Clock,
  User,
  Settings,
  Heart,
  LayoutGrid,
  Send,
  MessageCircle,
  Globe,
  Bell,
  MonitorPlay,
  Share2,
  Users,
  Search,
  Filter,
  ExternalLink,
  Menu,
  ChevronDown,
  PlusCircle,
  ArrowRight,
  Image,
  Bold,
  Italic,
  Highlighter,
  CornerDownLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Type,
  Tag,
  MessageSquare,
  X,
  Check,
  Save,
} from "lucide-react";
import {
  NewsItem,
  VideoItem,
  LiveStream,
  EventItem,
  UserProfile,
  LeaderContent,
  SocialLink,
} from "../types";
import { motion, AnimatePresence } from "motion/react";
import { SyncService, handleFirestoreError } from "../services/SyncService";
import { GitHubClient } from "../services/githubClient";
import { del as delIDB } from "idb-keyval";

import { AdminNewsWizard } from "../components/AdminNewsWizard";
import { STATIC_QURAN_LESSONS, STATIC_QURAN_SERIES } from "../data/staticQuranData";
import { AdminCategoryManager } from "../components/AdminCategoryManager";

const ContactUsSection = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    let active = true;
    const unsubPromise = SyncService.syncCollection<SocialLink>(
      "social_links",
      (data) => {
        if (!active) return;
        setLinks(data);
      },
      { orderByField: "order", orderDirection: "asc" }
    );

    return () => {
      active = false;
      unsubPromise.then((unsub) => unsub());
    };
  }, []);

  const displayLinks =
    links.length > 0
      ? links
      : [
          {
            id: "1",
            platform: "whatsapp",
            label: "قناة الواتساب",
            url: "https://whatsapp.com/channel/0029Vahhp6S7z4kYmZrjNf3W",
            description: "انضم لقناتنا للمتابعة أولاً بأول",
            order: 1,
            createdAt: 0,
          },
          {
            id: "2",
            platform: "telegram",
            label: "قناة التيليجرام الأولى",
            url: "https://t.me/taizgio",
            description: "@taizgio",
            order: 2,
            createdAt: 0,
          },
          {
            id: "3",
            platform: "telegram",
            label: "قناة التيليجرام الثانية",
            url: "https://t.me/TaizOI",
            description: "@TaizOI",
            order: 3,
            createdAt: 0,
          },
          {
            id: "4",
            platform: "meyon",
            label: "منصة ميون",
            url: "https://meyon.com.ye/c/taizgio/",
            description: "مشاهدة الفيديوهات والتقارير الحصرية",
            order: 4,
            createdAt: 0,
          },
        ];

  return (
    <div className="space-y-4">
      <div className="p-6 md:p-8 bg-taiz-gradient text-white rounded-[2rem] text-right relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(3,47,105,0.2)]">
        {/* Subtle pattern to match branding */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
          }}
        />

        <h3
          className="relative z-10 text-xl font-black text-white mb-6 flex items-center justify-end gap-2"
          dir="rtl"
        >
          <span>تابعنا</span>
          <Share2 className="w-5 h-5 text-white/80" />
        </h3>
        <div
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
          dir="rtl"
        >
          {displayLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="referrerPolicy"
              className={`p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition flex items-center justify-between ${
                link.platform === "whatsapp" || link.platform === "meyon"
                  ? "sm:col-span-2"
                  : ""
              } hover:shadow-md active:scale-[0.98] transition-all`}
              style={{
                borderRightWidth: "4px",
                borderRightColor:
                  link.platform === "whatsapp"
                    ? "#22c55e"
                    : link.platform === "telegram"
                    ? "#0ea5e9"
                    : link.platform === "meyon"
                    ? "#ef4444"
                    : "#6366f1",
              }}
            >
              <div className="flex-1 text-right">
                <span
                  className={`font-extrabold ${
                    link.platform === "whatsapp"
                      ? "text-green-600"
                      : link.platform === "telegram"
                      ? "text-sky-500"
                      : link.platform === "meyon"
                      ? "text-red-600"
                      : "text-indigo-600"
                  }`}
                >
                  {link.label}
                </span>
                {link.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
                    {link.description}
                  </p>
                )}
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  link.platform === "whatsapp"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                    : link.platform === "telegram"
                    ? "bg-sky-50 dark:bg-sky-900/20 text-sky-500"
                    : link.platform === "meyon"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                    : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                }`}
              >
                {link.platform === "whatsapp" ? (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                ) : link.platform === "telegram" ? (
                  <Send className="w-5 h-5" />
                ) : link.platform === "meyon" ? (
                  <MonitorPlay className="w-5 h-5" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Copyright Footer Section */}
      <div className="w-full flex flex-col items-center justify-center py-6 px-4 gap-4">
        <div className="w-full max-w-md">
          <img
            src="/copyright.png"
            alt="حقوق النشر"
            className="w-full h-auto opacity-80 dark:opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
          />
        </div>
        <div className="text-center pt-2">
          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-wider flex flex-wrap items-center justify-center gap-1.5 opacity-80">
            <span className="uppercase">
              Designed & Developed by : Al Basha Taiz
            </span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="font-bold">تصميم، إعداد وبرمجة : الباشا تعز</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(() => {
    const savedUser = localStorage.getItem("admin_user");
    try {
      return savedUser ? (JSON.parse(savedUser) as FirebaseUser) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const savedProfile = localStorage.getItem("admin_profile");
    try {
      return savedProfile ? (JSON.parse(savedProfile) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    const savedProfile = localStorage.getItem("admin_profile");
    return savedProfile ? false : true;
  });
  const [activeTab, setActiveTab] = useState("dashboard");

  // Admin/Manager View Logic (Moved to top to follow Rules of Hooks)
  const isManager = profile?.role === "manager";
  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor";
  const hasPermission = (sectionId: string) =>
    profile?.permissions?.includes(sectionId);

  const sidebarTabs = [
    {
      id: "news",
      icon: FileText,
      label: "الأخبار",
      access: isAdmin || isManager || (isEditor && hasPermission("news")),
    },
    {
      id: "urgent",
      icon: AlertTriangle,
      label: "الأخبار العاجلة",
      access: isAdmin || isManager || (isEditor && hasPermission("urgentNews")),
    },
    {
      id: "videos",
      icon: Video,
      label: "الفيديوهات",
      access: isAdmin || isManager || (isEditor && hasPermission("videos")),
    },
    { id: "live", icon: Radio, label: "البث المباشر", access: isAdmin },
    {
      id: "leader",
      icon: Shield,
      label: "السيد القائد",
      access: isAdmin || isManager || (isEditor && hasPermission("leader")),
    },
    {
      id: "quran",
      icon: Settings,
      label: "إعداد محتوى المنصة",
      access: isAdmin || isManager,
    },
    {
      id: "events",
      icon: CalendarIcon,
      label: "تقويم المناسبات",
      access: isAdmin,
    },
    {
      id: "social",
      icon: Share2,
      label: "روابط تابعنا",
      access: isAdmin || isManager,
    },
    { id: "roles", icon: Users, label: "إدارة الصلاحيات", access: isAdmin },
  ];

  const filteredTabs = sidebarTabs.filter((tab) => tab.access);

  // Set default tab if current is not allowed
  useEffect(() => {
    const currentTabAllowed =
      (isAdmin && activeTab === "dashboard") ||
      filteredTabs.some((t) => t.id === activeTab);
    if (!currentTabAllowed && filteredTabs.length > 0) {
      setActiveTab(filteredTabs[0].id);
    }
  }, [isAdmin, activeTab, filteredTabs]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        scopes: ["profile", "email"],
        grantOfflineAccess: true,
      });
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const simpleUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        localStorage.setItem("admin_user", JSON.stringify(simpleUser));
        await checkProfile(firebaseUser);
      } else {
        setProfile(null);
        localStorage.removeItem("admin_profile");
        localStorage.removeItem("admin_user");
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const checkProfile = async (firebaseUser: FirebaseUser) => {
    const cachedProfile = localStorage.getItem("admin_profile");
    if (!cachedProfile) {
      setLoading(true);
    }
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;

        // Force admin role for hossamb350@gmail.com to restore full access
        if (firebaseUser.email?.toLowerCase() === "hossamb350@gmail.com") {
          if (data.role !== "admin") {
            data.role = "admin";
            try {
              await setDoc(userRef, { role: "admin" }, { merge: true });
            } catch (err) {
              console.error("Could not auto-promote user to admin:", err);
            }
          }
        }

        setProfile(data);
        localStorage.setItem("admin_profile", JSON.stringify(data));
        // Update last login using setDoc with merge to be more robust
        try {
          await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
        } catch (updateErr) {
          console.warn("Could not update last login timestamp:", updateErr);
        }
      } else {
        const isHossam =
          firebaseUser.email?.toLowerCase() === "hossamb350@gmail.com";
        // Create new profile for common user
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "مستخدم",
          photoURL: firebaseUser.photoURL || undefined,
          role: isHossam ? "admin" : "user",
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
        localStorage.setItem("admin_profile", JSON.stringify(newProfile));
      }
    } catch (e) {
      console.warn("Error fetching profile (using cache fallback):", e);
      const cachedProfileStr = localStorage.getItem("admin_profile");
      if (cachedProfileStr) {
        try {
          const cached = JSON.parse(cachedProfileStr) as UserProfile;
          if (firebaseUser.email?.toLowerCase() === "hossamb350@gmail.com") {
            cached.role = "admin";
          }
          setProfile(cached);
        } catch {}
      } else {
        const isHossam =
          firebaseUser.email?.toLowerCase() === "hossamb350@gmail.com";
        const fallbackProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "مستخدم",
          photoURL: firebaseUser.photoURL || undefined,
          role: isHossam ? "admin" : "user",
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };
        setProfile(fallbackProfile);
        localStorage.setItem("admin_profile", JSON.stringify(fallbackProfile));
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await (GoogleAuth.signIn as any)();
        if (googleUser.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(
            googleUser.authentication.idToken
          );
          await signInWithCredential(auth, credential);
        } else {
          throw new Error("No ID Token found");
        }
      } else {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }
    } catch (error: any) {
      if (error.code === "auth/operation-not-allowed") {
        alert(
          "تسجيل الدخول عبر جوجل غير مفعل حالياً. يرجى التواصل مع الإدارة."
        );
      } else {
        alert(
          "حدث خطأ أثناء تسجيل الدخول: " +
            error.message +
            " | كود الخطأ: " +
            error.code +
            " | " +
            JSON.stringify(error)
        );
      }
    }
  };
  const logout = () => {
    localStorage.removeItem("admin_profile");
    localStorage.removeItem("admin_user");
    return signOut(auth);
  };

  if (loading && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold">جاري تسجيل الدخول...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-950/40 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">
          مرحباً بك في منصة تعز الإعلامية
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
          سجل دخولك عبر حساب جوجل للوصول إلى تفضيلاتك وإدارة حسابك الشخصي.
        </p>

        <button
          onClick={login}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-3 active:scale-95 mb-16"
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="w-5 h-5"
            alt=""
          />
          تسجيل الدخول عبر جوجل
        </button>

        <div className="w-full max-w-2xl text-right">
          <ContactUsSection />
        </div>
      </div>
    );
  }

  // If user is logged in but not an admin
  if (profile?.role === "user") {
    return <UserProfileView user={user} profile={profile} logout={logout} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 flex flex-col md:flex-row gap-6 md:gap-8 animate-fade-in overflow-x-hidden">
      {/* Admin Sidebar */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
        <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl mb-2 md:mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 mb-5 relative z-10 text-right">
            <div className="relative shrink-0">
              <img
                src={user.photoURL || ""}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-blue-500 shadow-lg object-cover"
                alt=""
              />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <div className="min-w-0">
              <div className="font-black text-base md:text-lg truncate text-gray-900 dark:text-white">
                {user.displayName}
              </div>
              <div
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full w-max mt-1 ${
                  isAdmin
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/40"
                    : isManager
                    ? "text-amber-600 bg-amber-50 dark:bg-amber-900/40"
                    : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40"
                }`}
              >
                <Shield className="w-3 h-3" />{" "}
                {isAdmin
                  ? "مدير النظام"
                  : isManager
                  ? "مسؤول المنصة"
                  : profile?.jobTitle || "محرر"}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-sm font-black text-white bg-red-500 hover:bg-red-600 px-5 py-3 md:py-3.5 rounded-2xl shadow-lg shadow-red-500/30 transition-all active:scale-95 relative z-10"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl">
          <div className="md:mt-4">
            <div className="flex items-center justify-end gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-3 opacity-70">
              القائمة السريعة
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            </div>

            <div className="relative group">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 pr-12 font-black text-sm text-gray-900 dark:text-white appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                dir="rtl"
              >
                <option value="dashboard">لوحة التحكم الرئيسية</option>
                {filteredTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
                <Menu className="w-5 h-5" />
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 min-h-[600px] overflow-hidden w-full"
          >
            {activeTab === "dashboard" && (
              <AdminSummaryDashboard
                onNavigate={setActiveTab}
                isAdmin={isAdmin}
                isManager={isManager}
                isEditor={isEditor}
                filteredTabs={filteredTabs}
              />
            )}
            {activeTab === "news" && (
              <AdminNews
                isAdmin={isAdmin}
                onBackToDashboard={() => setActiveTab("dashboard")}
              />
            )}
            {activeTab === "categories" && (isAdmin || isManager) && (
              <AdminCategoryManager />
            )}
            {activeTab === "urgent" && <AdminUrgentNews />}
            {activeTab === "videos" && <AdminVideos isAdmin={isAdmin} />}
            {activeTab === "live" && isAdmin && <AdminLive />}
            {activeTab === "leader" && <AdminLeader isAdmin={isAdmin} />}
            {activeTab === "quran" && (isAdmin || isManager) && <AdminQuran />}
            {activeTab === "events" && isAdmin && <AdminEvents />}
            {activeTab === "social" && (isAdmin || isManager) && (
              <AdminSocialLinks />
            )}
            {activeTab === "roles" && isAdmin && <AdminRoles />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AdminSummaryDashboard({
  onNavigate,
  isAdmin,
  isManager,
  isEditor,
  filteredTabs,
}: {
  onNavigate: (tabId: string) => void;
  isAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  filteredTabs: any[];
}) {
  const [stats, setStats] = useState({
    news: 0,
    videos: 0,
    leader: 0,
  });

  useEffect(() => {
    // 1. Load initial stats from cache to show something immediately and act as fallback
    const loadCachedStats = async () => {
      try {
        const newsCache = await SyncService.getCache("news");
        const videosCache = await SyncService.getCache("videos");
        const leaderCache = await SyncService.getCache("leader");

        setStats({
          news: newsCache.length || 0,
          videos: videosCache.length || 0,
          leader: leaderCache.length || 0,
        });
      } catch (e) {
        console.warn("Could not load cached stats:", e);
      }
    };
    loadCachedStats();

    // 2. Set up real-time listener, but handle errors gracefully
    const collectionsMap = { news: "news", videos: "videos", leader: "leader" };
    const unsubs = Object.entries(collectionsMap).map(([key, col]) => {
      try {
        return onSnapshot(
          collection(db, col),
          (snap) => {
            setStats((prev) => ({ ...prev, [key]: snap.size }));
          },
          (err) => {
            console.warn(
              `Admin stats fetch error for ${col} (using cache fallback):`,
              err
            );
          }
        );
      } catch (err) {
        console.warn(`Admin stats listener error for ${col}:`, err);
        return () => {};
      }
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  const adminSections = [
    {
      id: "news",
      label: "الأخبار",
      icon: FileText,
      color: "sky",
      access: filteredTabs.some((t) => t.id === "news"),
    },
    {
      id: "urgent",
      label: "الأخبار العاجلة",
      icon: AlertTriangle,
      color: "amber",
      access: filteredTabs.some((t) => t.id === "urgent"),
    },
    {
      id: "videos",
      label: "الفيديوهات",
      icon: Video,
      color: "blue",
      access: filteredTabs.some((t) => t.id === "videos"),
    },
    {
      id: "live",
      label: "البث المباشر",
      icon: Radio,
      color: "red",
      access: filteredTabs.some((t) => t.id === "live"),
    },
    {
      id: "leader",
      label: "السيد القائد",
      icon: Shield,
      color: "indigo",
      access: filteredTabs.some((t) => t.id === "leader"),
    },
    {
      id: "quran",
      label: "إعداد محتوى المنصة",
      icon: BookOpen,
      color: "emerald",
      access: filteredTabs.some((t) => t.id === "quran"),
    },
    {
      id: "events",
      label: "تقويم المناسبات",
      icon: CalendarIcon,
      color: "rose",
      access: filteredTabs.some((t) => t.id === "events"),
    },
    {
      id: "social",
      label: "روابط تابعنا",
      icon: Share2,
      color: "teal",
      access: filteredTabs.some((t) => t.id === "social"),
    },
    {
      id: "roles",
      label: "إدارة الصلاحيات",
      icon: Users,
      color: "purple",
      access: filteredTabs.some((t) => t.id === "roles"),
    },
  ];

  const filteredSections = adminSections.filter((s) => s.access);

  return (
    <div className="space-y-6 md:space-y-10 w-full animate-fade-in" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-taiz-navy to-taiz-royal p-6 md:p-10 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 text-right">
          <h1 className="text-2xl md:text-4xl font-black mb-3">
            لوحة التحكم {isAdmin ? "الرئيسية" : "المنصة"} ⚡️
          </h1>
          <p className="text-blue-100/80 text-sm md:text-base font-bold max-w-xl leading-relaxed">
            مرحباً بك مجدداً. يمكنك الوصول السريع للأقسام وإدارة محتويات المنصة
            من هنا.
          </p>
        </div>
      </div>

      {/* Navigation Grid - 2/3/4 columns, vertical style matching channels */}
      <div className="flex flex-col gap-6">
        <h3 className="text-lg font-black text-text-primary px-2 flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-taiz-sky" />
          أقسام الإدارة
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredSections.map((section) => (
            <motion.button
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.92, scaleX: 0.98 }}
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className="flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-card hover:bg-surface-hover border border-border-light rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-500 shadow-soft group hover:shadow-strong active:ring-4 active:ring-taiz-sky/10"
            >
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-main flex items-center justify-center text-${section.color}-600 group-hover:scale-110 transition-transform shadow-sm ring-1 ring-border-light group-hover:ring-taiz-sky/30 relative`}
              >
                <section.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <div
                  className={`absolute inset-0 bg-${section.color}-500/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
                ></div>
              </div>
              <div className="text-center mt-3">
                <div className="text-xs sm:text-sm font-black text-text-primary group-hover:text-taiz-sky transition-colors">
                  {section.label}
                </div>
                <div className="text-[8px] text-text-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
                  إدارة
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "الأخبار",
            value: stats.news,
            icon: FileText,
            color: "blue",
          },
          {
            label: "الفيديوهات",
            value: stats.videos,
            icon: Video,
            color: "red",
          },
          {
            label: "محتوى القائد",
            value: stats.leader,
            icon: Shield,
            color: "indigo",
          },
          { label: "دروس القرآن", value: 6, icon: BookOpen, color: "emerald" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-surface-card border border-border-light p-5 rounded-2xl shadow-soft"
          >
            <div className="text-2xl font-black text-text-primary mb-1">
              {s.value}
            </div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserProfileView({
  user,
  profile,
  logout,
}: {
  user: FirebaseUser;
  profile: UserProfile;
  logout: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto p-4 py-12 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <div className="px-6 pb-10">
          <div className="relative -mt-16 mb-6 flex justify-between items-end">
            <img
              src={user.photoURL || ""}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover bg-gray-100"
              alt=""
            />
            <button
              onClick={logout}
              className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
              {profile.displayName}
            </h2>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                {profile.email}
              </span>
              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">
                حساب قارئ
              </span>
            </div>

            <div className="mt-12">
              <ContactUsSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUrgentNews() {
  const [text, setText] = useState("");
  const [duration, setDuration] = useState(1); // minutes
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text) return alert("يرجى إدخال نص الخبر العاجل");
    setSaving(true);
    try {
      await addDoc(collection(db, "urgentNews"), {
        text,
        createdAt: Date.now(),
        expiresAt: Date.now() + duration * 60000,
      });
      alert(
        `تم نشر الخبر العاجل بنجاح (سيختفي تلقائياً بعد ${duration} دقيقة)`
      );
      setText("");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء النشر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 border-b dark:border-gray-700 pb-3">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        <h2 className="text-xl font-bold text-red-600">نظام الأخبار العاجلة</h2>
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
        <h3 className="font-bold text-red-800 dark:text-red-400 mb-2">
          تعليمات هامة:
        </h3>
        <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 font-medium">
          <li>سيظهر هذا الخبر بشكل فوري وتلقائي في جميع أقسام المنصة.</li>
          <li>مدة بقاء الخبر العاجل يتم تحديدها مسبقاً.</li>
          <li>نشر خبر جديد سيستبدل على الفور أي خبر عاجل سابق.</li>
          <li>سيتم إرسال إشعار للمتصفحين وإصدار تنبيه صوتي.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-bold">نص الخبر العاجل:</label>
            <textarea
              className="w-full p-4 text-xl font-bold bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 rounded-xl h-32 focus:outline-none focus:border-red-500"
              placeholder=""
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block font-bold">مدة ظهور الخبر:</label>
            <select
              className="w-full p-4 text-lg font-bold bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 rounded-xl focus:outline-none focus:border-red-500"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={1}>1 = دقيقة واحدة</option>
              <option value={2}>2 = دقيقتان</option>
              <option value={3}>3 = ثلاث دقائق</option>
              <option value={4}>4 = أربع دقائق</option>
            </select>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || !text}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-lg"
        >
          {saving ? "جاري النشر..." : "نشر كخبر عاجل الآن"}
        </button>
      </div>
    </div>
  );
}

// Simple Admin Components

function AdminNews({
  isAdmin,
  onBackToDashboard,
}: {
  isAdmin?: boolean;
  onBackToDashboard: () => void;
}) {
  return (
    <AdminNewsWizard isAdmin={isAdmin} onBackToDashboard={onBackToDashboard} />
  );
}

function OldAdminNews({ isAdmin }: { isAdmin?: boolean }) {
  const [newsMode, setNewsMode] = useState<"add" | "list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [publishStatus, setPublishStatus] = useState<"published" | "draft">(
    "published"
  );
  const [tags, setTags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  // Fields
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [additionalImagesText, setAdditionalImagesText] = useState("");
  const [cat, setCat] = useState("محلية");
  const [customCat, setCustomCat] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [liveUpdatesText, setLiveUpdatesText] = useState("");
  const [views, setViews] = useState<number>(0);

  // Auto-save logic
  useEffect(() => {
    if (newsMode !== "list" && (title || content || author)) {
      const timer = setTimeout(() => {
        const draftData = {
          title,
          author,
          shortDesc,
          content,
          imageUrl,
          additionalImagesText,
          cat,
          customCat,
          isPinned,
          isBreaking,
          liveUpdatesText,
          publishStatus,
          tags,
          videoUrl,
          currentStep,
          editingId,
        };
        localStorage.setItem("news_draft", JSON.stringify(draftData));
        setLastAutoSave(Date.now());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [
    title,
    author,
    shortDesc,
    content,
    imageUrl,
    additionalImagesText,
    cat,
    customCat,
    isPinned,
    isBreaking,
    liveUpdatesText,
    publishStatus,
    tags,
    videoUrl,
    currentStep,
    newsMode,
  ]);

  // Restore draft
  useEffect(() => {
    const saved = localStorage.getItem("news_draft");
    if (saved && newsMode === "list") {
      try {
        const draft = JSON.parse(saved);
        if (
          draft.title &&
          confirm("يوجد مسودة خبر غير مكتملة، هل تريد استعادتها؟")
        ) {
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
  const [savedCats, setSavedCats] = useState<string[]>([
    "محلية",
    "تعبئة عامة",
    "اجتماعية",
    "أنشطة وزيارات",
    "مشاريع",
    "مقال",
  ]);
  const [savedAuthors, setSavedAuthors] = useState<string[]>([]);

  const fetchMetadata = async () => {
    // Load initial metadata from cache
    const cachedCats = localStorage.getItem("admin_saved_cats");
    const cachedAuthors = localStorage.getItem("admin_saved_authors");
    if (cachedCats) {
      try {
        setSavedCats(JSON.parse(cachedCats));
      } catch {}
    }
    if (cachedAuthors) {
      try {
        setSavedAuthors(JSON.parse(cachedAuthors));
      } catch {}
    }

    try {
      const catDoc = await getDoc(doc(db, "newsMetadata", "categories"));
      if (catDoc.exists()) {
        const list = catDoc.data().list || [];
        const combined = Array.from(
          new Set([
            ...[
              "محلية",
              "تعبئة عامة",
              "اجتماعية",
              "أنشطة وزيارات",
              "مشاريع",
              "مقال",
            ],
            ...list,
          ])
        );
        setSavedCats(combined);
        localStorage.setItem("admin_saved_cats", JSON.stringify(combined));
      }

      const authDoc = await getDoc(doc(db, "newsMetadata", "authors"));
      if (authDoc.exists()) {
        const auths = authDoc.data().list || [];
        setSavedAuthors(auths);
        localStorage.setItem("admin_saved_authors", JSON.stringify(auths));
      }
    } catch (e) {
      console.warn("Error fetching metadata (using cache fallback):", e);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // formatting helper
  const insertText = (before: string, after: string) => {
    const textarea = document.getElementById(
      "content-textarea"
    ) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + selectedText + after;
    setContent(
      content.substring(0, start) + replacement + content.substring(end)
    );
  };

  const fetchNewsList = async () => {
    setLoadingList(true);
    try {
      // Load from local storage cache first
      const cached = await SyncService.getCache<NewsItem>("news");
      if (cached && cached.length > 0) {
        setNewsList(cached);
      }

      // Try to fetch latest from Firestore and update cache
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedList = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as NewsItem)
        );
        setNewsList(fetchedList);
        await SyncService.setCache("news", fetchedList);
      } catch (fireErr) {
        console.warn(
          "Firestore fetch error for news list, relying on local storage cache:",
          fireErr
        );
      }
    } catch (e) {
      console.error("Error loading news list from cache/Firestore:", e);
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
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
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
          timestamp: Date.now(),
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
    setCustomCat("");
    setIsBreaking(false);
    setIsPinned(false);
    setLiveUpdatesText("");
    setViews(0);
    setEditingId(null);
  };

  const handleEditClick = (item: NewsItem) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    if (savedCats.includes(item.category || "")) {
      setCat(item.category || "محلية");
      setCustomCat("");
    } else {
      setCat("custom");
      setCustomCat(item.category || "");
    }

    setIsBreaking(!!item.isBreaking);
    setIsPinned(!!item.isPinned);

    if (item.liveUpdates && Array.isArray(item.liveUpdates)) {
      setLiveUpdatesText(
        item.liveUpdates
          .map((u) => {
            let line = `${u.text}`;
            if (u.time) line += ` | ${u.time}`;
            if (u.imageUrl) line += ` | ${u.imageUrl}`;
            return line;
          })
          .join("\n")
      );
    } else {
      setLiveUpdatesText("");
    }

    setEditingId(item.id);
    setNewsMode("edit");
  };

  const save = async () => {
    if (!title || !content)
      return alert("يرجى تعبئة الحقول الأساسية (العنوان والمحتوى)");
    const finalCat = cat === "custom" ? customCat : cat;
    if (!finalCat) return alert("يرجى إدخال تصنيف الخبر");

    setSaving(true);
    const parsedUpdates = parseLiveUpdates(liveUpdatesText);

    let finalSnippet = shortDesc.trim();
    if (!finalSnippet) {
      const strippedContent = content
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ");
      finalSnippet =
        strippedContent.substring(0, 150) +
        (strippedContent.length > 150 ? "..." : "");
    }

    const additionalImages = additionalImagesText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const payload: any = {
      title,
      content,
      shortDescription: finalSnippet,
      author: author || "منصة تعز",
      imageUrl: imageUrl || null,
      additionalImages: additionalImages || null,
      category: finalCat,
      isBreaking,
      isPinned,
      liveUpdates: parsedUpdates || null,
      views: Number(views) || 0,
      updatedAt: Date.now(),
      publishStatus,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      videoUrl: videoUrl || null,
    };

    try {
      // Save Metadata (Category)
      if (cat === "custom" && customCat && !savedCats.includes(customCat)) {
        const newList = [...savedCats, customCat];
        const customOnlyList = newList.filter(
          (c) =>
            ![
              "محلية",
              "تعبئة عامة",
              "اجتماعية",
              "أنشطة وزيارات",
              "مشاريع",
              "مقال",
            ].includes(c)
        );
        await setDoc(doc(db, "newsMetadata", "categories"), {
          list: customOnlyList,
        });
        setSavedCats(newList);
      }

      // Save Metadata (Author)
      if (author && !savedAuthors.includes(author)) {
        const newList = [...savedAuthors, author];
        await setDoc(doc(db, "newsMetadata", "authors"), { list: newList });
        setSavedAuthors(newList);
      }

      let savedId = editingId;
      if (newsMode === "edit" && editingId) {
        await updateDoc(doc(db, "news", editingId), payload);
      } else {
        const docRef = await addDoc(collection(db, "news"), {
          ...payload,
          createdAt: Date.now(),
        });
        savedId = docRef.id;
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
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          تم العملية بنجاح!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold">
          تم {editingId ? "تحديث" : "نشر"} الخبر بنجاح في المنصة.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              setShowSuccessModal(false);
              window.open(`/news/${lastSavedId}`, "_blank");
            }}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            عرض الخبر
          </button>
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setNewsMode("list");
              resetForm();
            }}
            className="w-full py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-white rounded-2xl font-black transition-all"
          >
            العودة للوحة الإدارة
          </button>
          {!editingId && (
            <button
              onClick={() => {
                setShowSuccessModal(false);
                resetForm();
                setCurrentStep(1);
              }}
              className="w-full py-4 text-blue-600 font-black hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
            >
              إضافة خبر جديد آخر
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );

  const handleDelete = async (newsId: string) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً؟"))
      return;
    try {
      await deleteDoc(doc(db, "news", newsId));
      await SyncService.trackDeletion("news", newsId);
      setNewsList((prev) => prev.filter((item) => item.id !== newsId));
      alert("تم حذف الخبر بنجاح");
    } catch (e) {
      console.error(e);
      alert("فشل في حذف الخبر");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* View Controller: If in List Mode, show the main dashboard layout */}
      {newsMode === "list" ? (
        <div className="space-y-8">
          {/* Main Action Card: Add News */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <PlusCircle className="w-8 h-8" />
                  إضافة خبر جديد
                </h2>
                <p className="text-blue-100 font-medium text-lg opacity-90">
                  قم بنشر محتوى جديد للجمهور بضغطة زر واحدة
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setNewsMode("add");
                }}
                className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-5 rounded-2xl font-black text-xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
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
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                  <List className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    قائمة الأخبار المنشورة
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    إدارة وتعديل الأخبار السابقة ({newsList.length} خبر)
                  </p>
                </div>
              </div>
              <div
                className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 transition-transform duration-300 ${
                  isListExpanded ? "rotate-180" : ""
                }`}
              >
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
                      <div className="text-center py-10 text-gray-500 font-bold">
                        جاري جلب قائمة الأخبار ...
                      </div>
                    ) : newsList.length === 0 ? (
                      <div className="text-center py-20 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="font-bold text-lg">
                          لا توجد أخبار مضافة حالياً
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {newsList.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row gap-4 p-5 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all group"
                          >
                            {item.imageUrl ? (
                              <div className="w-full sm:w-[140px] h-[100px] rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full sm:w-[140px] h-[100px] rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shrink-0">
                                <FileText className="w-6 h-6 text-gray-300" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                      item.isBreaking
                                        ? "bg-red-600 text-white"
                                        : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    }`}
                                  >
                                    {item.isBreaking ? "مباشر" : item.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">
                                    {new Date(
                                      item.createdAt
                                    ).toLocaleDateString("ar-YE")}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                                  {item.title}
                                </h4>
                              </div>

                              <div className="flex items-center justify-end gap-2 mt-4">
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                  title="تعديل"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                  title="حذف"
                                >
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
        </div>
      ) : (
        /* Independent Form View for Add/Edit */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Form Header */}
          <div className="flex items-center justify-between pb-6 border-b dark:border-gray-800">
            <div>
              <button
                onClick={() => {
                  resetForm();
                  setNewsMode("list");
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-bold mb-2 group"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                العودة للوحة الإدارة
              </button>
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                {newsMode === "edit" ? "تعديل الخبر المنشور" : "إنشاء خبر جديد"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setNewsMode("list");
                }}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "نشر الخبر"}
              </button>
            </div>
          </div>

          {/* Simplified & Polished Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">
                    عنوان الخبر الرئيسي
                  </label>
                  <input
                    className="w-full p-4 text-lg font-black bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300"
                    placeholder="اكتب العنوان هنا..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">
                    مقدمة الخبر (إختياري)
                  </label>
                  <textarea
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300 font-bold"
                    placeholder="يمكنك هنا كتابة مقدمة الخبر ليظهر بشكل متميز"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3">
                    نص الخبر الكامل
                  </label>
                  <div className="mb-3 flex flex-wrap gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => insertText("<b>", "</b>")}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 text-blue-600 transition-all shadow-sm border border-gray-100 dark:border-gray-800"
                        title="عريض"
                      >
                        <Bold className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-bold text-gray-500">
                        عريض
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => insertText("<i>", "</i>")}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 text-blue-600 transition-all shadow-sm border border-gray-100 dark:border-gray-800"
                        title="مائل"
                      >
                        <Italic className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-bold text-gray-500">
                        مائل
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => insertText("<mark>", "</mark>")}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 text-yellow-700 transition-all shadow-sm border border-yellow-100 dark:border-yellow-900/30"
                        title="تمييز"
                      >
                        <Highlighter className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-bold text-gray-500">
                        تمييز
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => insertText("<br/>", "")}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 text-blue-600 transition-all shadow-sm border border-gray-100 dark:border-gray-800"
                        title="سطر جديد"
                      >
                        <CornerDownLeft className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-bold text-gray-500">
                        سطر جديد
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="content-textarea"
                    className="w-full p-5 text-lg font-medium leading-relaxed bg-gray-50 dark:bg-gray-900 border-none rounded-2xl h-[500px] focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-300"
                    placeholder="ابدأ بكتابة تفاصيل الخبر هنا..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>

              {/* Updates Section (Conditional) */}
              {isBreaking && (
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-black">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    التحديثات المباشرة
                  </div>
                  <textarea
                    className="w-full p-4 bg-white dark:bg-gray-900 border-none rounded-2xl h-40 focus:ring-2 focus:ring-red-500 transition-all text-sm leading-relaxed placeholder:text-red-200"
                    placeholder=""
                    value={liveUpdatesText}
                    onChange={(e) => setLiveUpdatesText(e.target.value)}
                  />
                  <p className="text-[10px] text-red-400 font-bold">
                    كل سطر يمثل تحديثاً جديداً يظهر في شريط التغطية المباشرة.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-6">
              {/* Media Settings */}
              <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-blue-600" />
                  الوسائط والصور
                </h4>

                <div className="space-y-4">
                  <ImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    label="الصورة الرئيسية للخبر"
                    placeholder="اختر أو اسحب صورة الخبر الرئيسية"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    معرض صور الخبر (إضافي)
                  </label>
                  
                  <div className="space-y-3">
                    {(() => {
                      const imgList = (additionalImagesText || "")
                        .split("\n")
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      
                      return imgList.map((img: string, idx: number) => (
                        <ImageUpload
                          key={idx}
                          value={img}
                          label={`صورة المعرض #${idx + 1}`}
                          onChange={(url: string) => {
                            const newArr = [...imgList];
                            if (url) {
                              newArr[idx] = url;
                            } else {
                              newArr.splice(idx, 1);
                            }
                            setAdditionalImagesText(newArr.join("\n"));
                          }}
                        />
                      ));
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const arr = additionalImagesText
                        .split("\n")
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      setAdditionalImagesText([...arr, ""].join("\n"));
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>إضافة صورة جديدة لمعرض الصور</span>
                  </button>
                </div>
              </div>

              {/* Classification & Meta */}
              <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  الإعدادات والتصنيف
                </h4>

                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">
                    التصنيف
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                  >
                    {savedCats.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="custom">تصنيف جديد...</option>
                  </select>
                  {cat === "custom" && (
                    <input
                      className="w-full mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 animate-fade-in"
                      placeholder=""
                      value={customCat}
                      onChange={(e) => setCustomCat(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">
                    الكاتب
                  </label>
                  <input
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    placeholder=""
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    list="authors-list"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        isPinned
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          isPinned ? "right-5" : "right-1"
                        }`}
                      ></div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      تثبيت الخبر
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        isBreaking
                          ? "bg-red-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          isBreaking ? "right-5" : "right-1"
                        }`}
                      ></div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      تغطية مباشرة
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AdminVideos({ isAdmin }: { isAdmin?: boolean }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState<string>("");
  const [views, setViews] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [categoriesList, setCategoriesList] = useState<string[]>([
    "تقارير ميدانية",
    "زوامل وأناشيد",
    "محاضرات ودروس",
    "أفلام وثائقية",
  ]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const list = await GitHubClient.fetchContent<string>("video_categories");
        if (active && list && list.length > 0) {
          setCategoriesList(list);
        }
      } catch (err) {
        console.warn("Failed to load categories from GitHub:", err);
      }
    };
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "videos"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as VideoItem)
        );
        data.sort((a, b) => {
          const aOrder =
            a.order !== undefined && a.order !== null
              ? Number(a.order)
              : Infinity;
          const bOrder =
            b.order !== undefined && b.order !== null
              ? Number(b.order)
              : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return b.createdAt - a.createdAt;
        });
        setVideos(data);
      },
      (error) => console.warn("Error fetching admin videos:", error)
    );
    return () => unsub();
  }, []);

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setThumb("");
    setCategory("");
    setOrder("");
    setViews(0);
    setEditingId(null);
  };

  const save = async () => {
    if (!title || !url) return alert("بيانات ناقصة");
    setSaving(true);
    const parsedOrder = order.trim() ? Number(order) : 9999;
    const trimmedCategory = category.trim();
    try {
      // Sync video categories with GitHub if it is a new category
      if (trimmedCategory && !categoriesList.some(cat => cat.toLowerCase() === trimmedCategory.toLowerCase())) {
        const updatedCategories = [...categoriesList, trimmedCategory];
        setCategoriesList(updatedCategories);
        try {
          console.log("Saving new category to GitHub...", trimmedCategory);
          await GitHubClient.saveContent("video_categories", updatedCategories);
        } catch (githubErr) {
          console.warn("Failed to save new category to GitHub:", githubErr);
        }
      }

      const payload = {
        title,
        url,
        thumbnailUrl: thumb,
        category: trimmedCategory,
        order: parsedOrder,
        views: Number(views) || 0,
      };

      if (editingId) {
        await updateDoc(doc(db, "videos", editingId), payload);
        alert("تم تعديل الفيديو بنجاح");
      } else {
        await addDoc(collection(db, "videos"), {
          ...payload,
          createdAt: Date.now(),
        });
        alert("تم إضافة الفيديو بنجاح");
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "videos", id));
      await SyncService.trackDeletion("videos", id);
      alert("تم حذف الفيديو بنجاح");
      setDeletingId(null);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleEdit = (video: VideoItem) => {
    setTitle(video.title);
    setUrl(video.url);
    setThumb(video.thumbnailUrl || "");
    setCategory(video.category || "");
    setOrder(
      video.order !== undefined && video.order !== null
        ? String(video.order)
        : ""
    );
    setViews(video.views || 0);
    setEditingId(video.id);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-red-600" />{" "}
          {editingId ? "تعديل فيديو" : "إضافة فيديو"}
        </h2>

        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg text-sm border border-blue-100 dark:border-blue-900">
          <strong className="block mb-1 text-blue-800 dark:text-blue-200">
            تعليمات هامة:
          </strong>
          لرفع الفيديو، يرجى رفع الفيديو أولاً إلى{" "}
          <a
            href="https://meyon.com.ye/c/taizgio/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold hover:text-blue-500 transition-colors"
          >
            منصة ميون
          </a>
          ، ثم نسخ رابط الفيديو ولصقه في الحقل المخصص.
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            عنوان الفيديو / التقرير المرئي:
          </label>
          <input
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
            placeholder="ادخل عنواناً جذاباً وواضحاً للفيديو هنا..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            رابط الفيديو (يدعم منصة ميون، يوتيوب، إلخ):
          </label>
          <input
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm font-mono"
            placeholder="الصق رابط الفيديو المباشر هنا (مثال: https://meyon.com.ye/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <ImageUpload
            value={thumb}
            onChange={setThumb}
            label="الصورة المصغرة (الغلاف)"
            placeholder="اختر أو اسحب صورة غلاف الفيديو"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            ترتيب العرض والأولوية (الأصغر يظهر أولاً):
          </label>
          <input
            type="number"
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm font-bold"
            placeholder="مثال: 1 للظهور أولاً، 2 للظهور ثانياً، 3 للظهور ثالثاً..."
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <p className="text-[11px] text-emerald-600 font-medium">
            كلما كان الرقم أصغر كلما تمت موازنته والظهور في المقدمة (رقم 1 في
            البداية). يُرتب تلقائياً حسب الأقدم/الأحدث إذا كان فارغاً.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            التصنيف (اكتب التصنيف يدوياً أو اختر من المقترحة):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
              placeholder="اكتب تصنيفاً جديداً هنا..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <select
              className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-xs font-bold"
              onChange={(e) => {
                if (e.target.value) setCategory(e.target.value);
              }}
              value=""
            >
              <option value="" disabled>
                تصنيفات مقترحة
              </option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-2 bg-red-50/30 dark:bg-red-950/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
            <label className="block text-sm font-bold text-red-800 dark:text-red-400">
              تعديل عدد المشاهدات يدوياً:
            </label>
            <input
              type="number"
              className="w-full max-w-[150px] p-3 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm font-mono font-bold"
              value={views}
              onChange={(e) => setViews(parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-gray-500">
              خاص بالمدير فقط. سيظهر هذا الرقم للجمهور.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-colors font-bold w-full sm:w-auto"
          >
            {saving
              ? "جاري الحفظ..."
              : editingId
              ? "حفظ التعديلات"
              : "حفظ الفيديو"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-lg font-bold"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-[#111827] dark:text-white flex items-center gap-2">
          <List className="w-5 h-5 text-gray-500" /> الفيديوهات المضافة
        </h3>
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <div className="flex gap-4 items-center">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="w-16 h-12 object-cover rounded-md bg-gray-100 dark:bg-gray-900"
                  />
                ) : (
                  <div className="w-16 h-12 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#111827] dark:text-white line-clamp-1">
                    {video.title}
                  </span>
                  <div className="text-xs text-gray-400 dark:text-gray-400 flex flex-wrap gap-2 items-center">
                    <span>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{video.views || 0} مشاهدة</span>
                    {video.category && (
                      <>
                        <span>•</span>
                        <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-black">
                          {video.category}
                        </span>
                      </>
                    )}
                    {video.order !== undefined && video.order !== 9999 && (
                      <>
                        <span>•</span>
                        <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/15">
                          الترتيب: {video.order}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deletingId === video.id ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-2">
                      تأكيد الحذف؟
                    </span>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      نعم
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      لا
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(video)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" /> تعديل
                    </button>
                    <button
                      onClick={() => setDeletingId(video.id)}
                      className="text-red-500 hover:text-red-700 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 font-bold text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              لا توجد فيديوهات مضافة بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLive() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "livestreams"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setStreams(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as LiveStream))
        );
      },
      (error) => console.warn("Error fetching livestreams on admin:", error)
    );
    return () => unsub();
  }, []);

  const save = async () => {
    if (!name || !url) return alert("الرجاء إدخال اسم القناة ورابط البث");
    setSaving(true);
    try {
      // Transform YouTube URL to embed format if needed
      let finalUrl = url;
      if (
        url.includes("youtube.com/watch?v=") ||
        url.includes("youtu.be/") ||
        url.includes("youtube.com/live/")
      ) {
        const videoIdMatch = url.match(
          /(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/
        );
        if (videoIdMatch && videoIdMatch[1]) {
          finalUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=1`;
        }
      } else if (url.includes("/w/") || url.includes("/videos/watch/")) {
        // Handle PeerTube instances like meyon.com.ye
        finalUrl = url
          .replace("/w/", "/videos/embed/")
          .replace("/videos/watch/", "/videos/embed/");
      }

      const payload = {
        name,
        url: finalUrl,
        iconUrl,
        isActive: active,
        updatedAt: Date.now(),
      };
      if (editingId) {
        await updateDoc(doc(db, "livestreams", editingId), payload);
        alert("تم تعديل البث بنجاح");
      } else {
        await addDoc(collection(db, "livestreams"), {
          ...payload,
          createdAt: Date.now(),
        });
        alert("تم إضافة البث بنجاح");
      }

      // Reset form
      setName("");
      setUrl("");
      setIconUrl("");
      setActive(true);
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (stream: LiveStream) => {
    setName(stream.name || "");
    setUrl(stream.url || "");
    setIconUrl(stream.iconUrl || "");
    setActive(stream.isActive);
    setEditingId(stream.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "livestreams", id));
      await SyncService.trackDeletion("livestreams", id);
      alert("تم حذف البث بنجاح");
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      alert("خطأ أثناء الحذف");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-600" />
          {editingId ? "تعديل بث مباشر" : "إضافة بث مباشر جديد"}
        </h2>
        <input
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
          placeholder=""
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
          placeholder=""
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-[10px] text-gray-400 -mt-2 pr-1">
          يمكنك وضع رابط يوتيوب مباشر أو رابط تضمين (Embed) أو رابط M3U8.
        </p>
        <input
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
          placeholder=""
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
        />

        <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-fit">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-5 h-5 accent-red-600 rounded"
          />
          <span className="font-bold text-gray-800 dark:text-gray-200 select-none">
            القناة مفعلة حالياً وتظهر للزوار
          </span>
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-lg transition-colors font-bold shrink-0"
          >
            {saving
              ? "جاري الحفظ..."
              : editingId
              ? "حفظ التعديلات"
              : "إضافة البث المباشر"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setName("");
                setUrl("");
                setIconUrl("");
                setActive(true);
                setEditingId(null);
              }}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white px-8 py-2.5 rounded-lg font-bold shrink-0 transition-colors"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-[#111827] dark:text-white flex items-center gap-2">
          <List className="w-5 h-5 text-gray-500" /> القنوات المضافة في النظام
        </h3>
        <div className="space-y-3">
          {streams.map((stream) => (
            <div
              key={stream.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="flex items-center gap-4">
                {stream.iconUrl ? (
                  <img
                    src={stream.iconUrl}
                    alt={stream.name}
                    className="w-12 h-12 rounded object-cover bg-white shadow-sm border border-gray-100 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 font-bold text-sm shadow-inner hidden sm:flex">
                    <Radio className="w-6 h-6 opacity-50" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-[#111827] dark:text-white">
                    {stream.name}
                  </h4>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-sm mt-1.5 inline-block ${
                      stream.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400"
                    }`}
                  >
                    {stream.isActive ? "مفعل (يظهر للزوار)" : "معطل (مخفي)"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(stream)}
                  className="text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" /> تعديل
                </button>

                {deletingId === stream.id ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg border border-red-100 dark:border-red-900/30">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-1">
                      تأكيد؟
                    </span>
                    <button
                      onClick={() => handleDelete(stream.id!)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      نعم
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      لا
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(stream.id!)}
                    className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> حذف
                  </button>
                )}
              </div>
            </div>
          ))}
          {streams.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              لا توجد قنوات بث مضافة في النظام.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLeader({ isAdmin }: { isAdmin?: boolean }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "text">("video");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [order, setOrder] = useState<string>("");
  const [views, setViews] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState(true);
  const [leaderContents, setLeaderContents] = useState<LeaderContent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "leader"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as LeaderContent)
        );
        data.sort((a, b) => {
          const aOrder =
            a.order !== undefined && a.order !== null
              ? Number(a.order)
              : Infinity;
          const bOrder =
            b.order !== undefined && b.order !== null
              ? Number(b.order)
              : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return b.createdAt - a.createdAt;
        });
        setLeaderContents(data);
      },
      (error) => console.warn("Error fetching leader content:", error)
    );
    return () => unsub();
  }, []);

  const save = async () => {
    if (!title || !content) return alert("يرجى تعبئة جميع الحقول");
    setSaving(true);
    const parsedOrder = order.trim() ? Number(order) : 9999;
    try {
      if (editingId) {
        await updateDoc(doc(db, "leader", editingId), {
          title,
          type,
          content,
          description: type === "video" ? description.trim() : "",
          thumbnailUrl: thumbnailUrl.trim(),
          order: parsedOrder,
          views: Number(views) || 0,
        });
        alert("تم التعديل بنجاح!");
      } else {
        await addDoc(collection(db, "leader"), {
          title,
          type,
          content,
          description: type === "video" ? description.trim() : "",
          thumbnailUrl: thumbnailUrl.trim(),
          order: parsedOrder,
          views: Number(views) || 0,
          createdAt: Date.now(),
        });

        alert("تمت الإضافة بنجاح!");
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setDescription("");
    setThumbnailUrl("");
    setOrder("");
    setViews(0);
    setType("video");
    setEditingId(null);
  };

  const handleEdit = (item: LeaderContent) => {
    setTitle(item.title);
    setContent(item.content);
    setDescription(item.description || "");
    setThumbnailUrl(item.thumbnailUrl || "");
    setOrder(
      item.order !== undefined && item.order !== null ? String(item.order) : ""
    );
    setViews(item.views || 0);
    setType(item.type);
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leader", id));
      await SyncService.trackDeletion("leader", id);
      alert("تم الحذف بنجاح");
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      alert("خطأ في الحذف");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between border-b dark:border-gray-700 pb-3">
        <h2 className="text-xl font-bold">
          {editingId ? "تعديل محتوى السيد القائد" : "إضافة محتوى السيد القائد"}
        </h2>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">العنوان:</label>
          <input
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500 font-bold"
            placeholder=""
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">النوع:</label>
          <select
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500 font-bold"
            value={type}
            onChange={(e) => setType(e.target.value as "video" | "text")}
          >
            <option value="text">محاضرات ودروس</option>
            <option value="video">ضع رابط الفيديو</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            {type === "text" ? "المحتوى:" : "رابط الفيديو:"}
          </label>
          <textarea
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl h-32 focus:outline-blue-500"
            placeholder={
              type === "text"
                ? "اكتب المحتوى هنا..."
                : "ضع رابط الفيديو هنا (يدعم يوتيوب، درايف، تيليجرام، والمسيرة)..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {type === "video" && (
            <p className="text-[11px] text-emerald-600 mt-2 font-medium">
              يدعم الروابط المباشرة واليوتيوب (YouTube)، جوجل درايف (Drive)،
              تيليجرام (Telegram)، والمسيرة (Almasirah) وسيتم معالجتها تلقائياً
              للعرض بالشكل الصحيح.
            </p>
          )}
        </div>

        {type === "video" && (
          <div>
            <label className="block text-sm font-bold mb-2">وصف الفيديو:</label>
            <textarea
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl h-24 focus:outline-blue-500 text-sm"
              placeholder=""
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        <div>
          <ImageUpload
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            label={type === "text" ? "صورة المحاضرة أو النص (اختياري)" : "الصورة المصغرة للفيديو (اختياري)"}
            placeholder={type === "text" ? "اختر أو اسحب صورة للمحاضرة" : "اختر أو اسحب صورة مصغرة للفيديو"}
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            ترتيب العرض والأولوية (الأصغر يظهر أولاً):
          </label>
          <input
            type="number"
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500 text-sm font-bold"
            placeholder="مثال: 1 للظهور أولاً، 2 للظهور ثانياً، 3 للظهور ثالثاً..."
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">
            كلما كان الرقم أصغر كلما تمت موازنته والظهور في المقدمة (رقم 1 في
            البداية). يُرتب تلقائياً حسب الأقدم/الأحدث إذا كان فارغاً.
          </p>
        </div>

        {isAdmin && (
          <div className="space-y-2 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <label className="block text-sm font-bold text-blue-800 dark:text-blue-400">
              تعديل عدد المشاهدات يدوياً:
            </label>
            <input
              type="number"
              className="w-full max-w-[200px] p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-lg font-mono font-bold"
              value={views}
              onChange={(e) => setViews(parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-gray-500">خاص بالمدير فقط.</p>
          </div>
        )}

        <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-500/30 transition-colors font-bold text-sm">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="w-5 h-5 accent-blue-600 rounded"
          />
          <span className="text-gray-700 dark:text-gray-200">
            إرسال تنبيه للمشتركين بخصوص هذا المحتوى
          </span>
        </label>

        <div className="flex gap-3 mt-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {saving
              ? "جاري الحفظ..."
              : editingId
              ? "حفظ التعديلات"
              : "إضافة المحتوى الآن"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-xl font-bold"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <List className="w-5 h-5 text-gray-500" /> المحتوى المضاف مرتباً حسب
          الأولويات والعرض
        </h3>
        <div className="space-y-3">
          {leaderContents.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#111827] dark:text-white line-clamp-1">
                  {item.title}
                </span>
                <div className="text-xs text-gray-400 dark:text-gray-400 flex flex-wrap gap-2 items-center">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>
                    {item.type === "video" ? "فيديو" : "محاضرات ودروس"}
                  </span>
                  <span>•</span>
                  <span>{item.views || 0} مشاهدة</span>
                  {item.order !== undefined && item.order !== 9999 && (
                    <>
                      <span>•</span>
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/15">
                        الترتيب: {item.order}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deletingId === item.id ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-2">
                      تأكيد الحذف؟
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      نعم
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      لا
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" /> تعديل
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="text-red-500 hover:text-red-700 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 font-bold text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {leaderContents.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              لا يوجد محتوى مضاف بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import {
  QuranSeries,
  QuranLesson,
  QuranSyllabus,
  QuranExcerpt,
} from "../types";

function AdminQuran() {
  const [subTab, setSubTab] = useState<"syllabuses" | "series" | "lessons" | "excerpts">("series");
  const [migrating, setMigrating] = useState(false);

  const migrateToFirestore = async () => {
    if (!confirm("هل تريد مزامنة كافة البيانات الحالية من الملفات إلى Firestore؟ سيؤدي هذا إلى الكتابة فوق البيانات الموجودة في Firestore.")) return;
    setMigrating(true);
    try {
      const res = await fetch(`${API_BASE}/api/quran-data`);
      const data = await res.json();
      
      const batch = writeBatch(db);
      
      // Migrate Series
      (data.series || []).forEach((s: any) => {
        batch.set(doc(db, "quran_series", s.id), s);
      });
      
      // Migrate Lessons
      (data.lessons || []).forEach((l: any) => {
        batch.set(doc(db, "quran_lessons", l.id), l);
      });
      
      // Migrate Excerpts
      (data.excerpts || []).forEach((e: any) => {
        batch.set(doc(db, "quran_excerpts", e.id), e);
      });
      
      // Migrate Syllabuses
      (data.syllabuses || []).forEach((s: any) => {
        batch.set(doc(db, "quran_syllabuses", s.id), s);
      });
      
      await batch.commit();
      alert("تمت المزامنة بنجاح إلى Firestore!");
      // Clear local cache to force refresh
      await delIDB('quran_data_cache');
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء المزامنة");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-gray-700 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold">إعداد محتوى المنصة (هدي القرآن)</h2>
          </div>
          <button
            onClick={migrateToFirestore}
            disabled={migrating}
            className="text-[10px] bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            {migrating ? "جاري المزامنة..." : "مزامنة الملفات إلى Firestore"}
          </button>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shrink-0" dir="rtl">
          <button
            onClick={() => setSubTab("series")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              subTab === "series" 
                ? "bg-white dark:bg-gray-800 text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            السلاسل
          </button>
          <button
            onClick={() => setSubTab("lessons")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              subTab === "lessons" 
                ? "bg-white dark:bg-gray-800 text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            الدروس
          </button>
          <button
            onClick={() => setSubTab("excerpts")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              subTab === "excerpts" 
                ? "bg-white dark:bg-gray-800 text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            المقتطفات
          </button>
          <button
            onClick={() => setSubTab("syllabuses")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              subTab === "syllabuses" 
                ? "bg-white dark:bg-gray-800 text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            المقررات
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
        {subTab === "series" && <AdminQuranSeries />}
        {subTab === "lessons" && <AdminQuranLessons />}
        {subTab === "syllabuses" && <AdminQuranSyllabuses />}
        {subTab === "excerpts" && <AdminQuranExcerpts />}
      </div>
    </div>
  );
}

function AdminQuranSeries() {
  const [list, setList] = useState<QuranSeries[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "quran_series"), orderBy("order", "asc")),
      (snap) => {
        setList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranSeries)));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const save = async () => {
    if (!title) return;
    setSaving(true);
    try {
      const id = editingId || Date.now().toString();
      const data = {
        title,
        description: desc,
        order: Number(order),
        createdAt: editingId ? undefined : Date.now()
      };
      
      await setDoc(doc(db, "quran_series", id), data, { merge: true });
      
      // Clear local cache
      await delIDB('quran_data_cache');
      
      alert("تم الحفظ في Firebase");
      resetForm();
    } catch (e) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (updatedList?: QuranSeries[]) => {
    setEditingId(null);
    setTitle("");
    setDesc("");
    setOrder(newListOrder(updatedList || list));
  };

  const newListOrder = (l: QuranSeries[]) => {
    if (l.length === 0) return 1;
    return Math.max(...l.map(s => s.order || 0)) + 1;
  };

  useEffect(() => {
    if (!editingId && list.length > 0) {
      setOrder(newListOrder(list));
    }
  }, [list, editingId]);

  const del = async (id: string) => {
    if (confirm("تأكيد الحذف من Firebase؟")) {
      try {
        await deleteDoc(doc(db, "quran_series", id));
        await delIDB('quran_data_cache');
        alert("تم الحذف بنجاح");
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل البيانات من Firebase...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" dir="rtl">
        <h3 className="font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5 text-blue-500" /> : <PlusCircle className="w-5 h-5 text-emerald-500" />}
          {editingId ? "تعديل سلسلة" : "إضافة سلسلة جديدة يدوياً"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 pr-1">عنوان السلسلة</label>
            <input
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              placeholder="مثال: دروس من هدي القرآن الكريم"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 pr-1">الترتيب</label>
            <input
              type="number"
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-gray-500 pr-1">وصف السلسلة (اختياري)</label>
          <textarea
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-24 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            placeholder="وصف مختصر لمحتوى السلسلة..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving || !title}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ في ملفات المنصة"}
          </button>
          {editingId && (
            <button
              onClick={() => resetForm()}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-black transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-6" dir="rtl">
        <div className="flex items-center justify-between px-2 mb-2">
          <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">السلاسل الحالية ({list.length})</h4>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">بيانات Firebase</span>
        </div>
        
        {list.sort((a, b) => (a.order || 0) - (b.order || 0)).map((s) => (
          <div
            key={s.id}
            className="flex justify-between items-center p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-emerald-500/30 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-black text-gray-400 group-hover:text-emerald-500 transition-colors border border-gray-100 dark:border-gray-800">
                {s.order}
              </div>
              <div>
                <div className="font-black dark:text-white text-lg">{s.title}</div>
                {s.description && <div className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">{s.description}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(s.id);
                  setTitle(s.title);
                  setDesc(s.description || "");
                  setOrder(s.order);
                }}
                className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-90"
                title="تعديل"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => del(s.id)}
                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                title="حذف"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        
        {list.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-20" />
            <p className="text-gray-400 font-bold">لا توجد سلاسل مضافة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminQuranLessons() {
  const [seriesList, setSeriesList] = useState<QuranSeries[]>([]);
  const [list, setList] = useState<QuranLesson[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [seriesId, setSeriesId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSeries = onSnapshot(
      query(collection(db, "quran_series"), orderBy("order", "asc")),
      (snap) => {
        const sList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranSeries));
        setSeriesList(sList);
        if (sList.length > 0 && !seriesId) {
          setSeriesId(sList[0].id);
        }
      }
    );

    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons"), orderBy("order", "asc")),
      (snap) => {
        setList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranLesson)));
        setLoading(false);
      }
    );

    return () => {
      unsubSeries();
      unsubLessons();
    };
  }, []);

  const save = async () => {
    if (!title || !seriesId || !content) return alert("أكمل البيانات");
    setSaving(true);
    try {
      const id = editingId || Date.now().toString();
      const data = {
        seriesId,
        title,
        content,
        order: Number(order),
        createdAt: editingId ? undefined : Date.now()
      };
      
      await setDoc(doc(db, "quran_lessons", id), data, { merge: true });
      await delIDB('quran_data_cache');
      
      alert("تم حفظ الدرس في Firebase");
      resetForm();
    } catch (e) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (updatedList?: QuranLesson[]) => {
    setEditingId(null);
    setTitle("");
    setContent("");
    const lessonsInSeries = (updatedList || list).filter(l => l.seriesId === seriesId);
    setOrder(lessonsInSeries.length + 1);
  };

  useEffect(() => {
    if (!editingId) {
      const lessonsInSeries = list.filter(l => l.seriesId === seriesId);
      setOrder(lessonsInSeries.length + 1);
    }
  }, [seriesId, list, editingId]);

  const del = async (id: string) => {
    if (confirm("تأكيد الحذف من Firebase؟")) {
      try {
        await deleteDoc(doc(db, "quran_lessons", id));
        localStorage.removeItem('quran_data_cache');
        alert("تم الحذف");
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل الدروس من Firebase...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" dir="rtl">
        <h3 className="font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5 text-blue-500" /> : <PlusCircle className="w-5 h-5 text-emerald-500" />}
          {editingId ? "تعديل محتوى الدرس" : "إضافة درس جديد يدوياً"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 pr-1">اختر السلسلة</label>
            <select
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
            >
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-black text-gray-500 pr-1">عنوان الدرس</label>
            <input
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              placeholder="مثال: الدرس الأول - فضل القرآن"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 pr-1">الترتيب في السلسلة</label>
            <input
              type="number"
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-gray-500 pr-1">محتوى الدرس الكامل</label>
          <textarea
            className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-64 leading-loose dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-y"
            placeholder="اكتب أو الصق محتوى الدرس هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving || !title || !content}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ الدرس في Firebase"}
          </button>
          {editingId && (
            <button
              onClick={() => resetForm()}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-black transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-6" dir="rtl">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">
              الدروس في السلسلة المختارة ({list.filter(l => l.seriesId === seriesId).length})
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">بيانات Firebase</span>
        </div>
        
        {list
          .filter((l) => l.seriesId === seriesId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((l) => (
            <div
              key={l.id}
              className="flex justify-between items-center p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-emerald-500/30 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-black text-gray-400 group-hover:text-emerald-500 transition-colors border border-gray-100 dark:border-gray-800">
                  {l.order}
                </div>
                <div>
                  <div className="font-black dark:text-white text-lg">{l.title}</div>
                  <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(l.createdAt || 0).toLocaleDateString('ar-YE')}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(l.id);
                    setSeriesId(l.seriesId);
                    setTitle(l.title);
                    setContent(l.content);
                    setOrder(l.order);
                  }}
                  className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-90"
                  title="تعديل"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => del(l.id)}
                  className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                  title="حذف"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
        {seriesList.length === 0 && (
          <div className="text-center py-10 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 p-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-amber-800 dark:text-amber-400 font-black">يجب إضافة سلسلة أولاً قبل إضافة الدروس</p>
          </div>
        )}
        
        {seriesList.length > 0 && list.filter(l => l.seriesId === seriesId).length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-20" />
            <p className="text-gray-400 font-bold">لا توجد دروس في هذه السلسلة بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}


function AdminQuranSyllabuses() {
  const [list, setList] = useState<QuranSyllabus[]>([]);
  const [lessons, setLessons] = useState<QuranLesson[]>([]);
  const [series, setSeries] = useState<QuranSeries[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [durationVal, setDurationVal] = useState<string>("1");
  const [durationType, setDurationType] = useState<"weeks" | "months">("weeks");
  const [eventId, setEventId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSeries = onSnapshot(
      query(collection(db, "quran_series"), orderBy("order", "asc")),
      (snap) => {
        setSeries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranSeries)));
      }
    );

    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons"), orderBy("order", "asc")),
      (snap) => {
        setLessons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranLesson)));
      }
    );

    const unsubSyllabuses = onSnapshot(
      query(collection(db, "quran_syllabuses"), orderBy("createdAt", "desc")),
      (snap) => {
        setList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranSyllabus)));
        setLoading(false);
      }
    );

    // Initial fetch from API if Firestore fails or empty
    const fetchApiData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quran-data`);
        if (res.ok) {
          const data = await res.json();
          // Use this data if Firestore yields nothing later
        }
      } catch (e) {}
    };
    fetchApiData();

    const unsubEvents = onSnapshot(
      query(collection(db, "events"), orderBy("timestamp", "desc")),
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem)));
      }
    );

    return () => {
      unsubSeries();
      unsubLessons();
      unsubSyllabuses();
      unsubEvents();
    };
  }, []);

  const save = async () => {
    if (!lessonId || !durationVal)
      return alert("الرجاء تحديد الدرس وتحديد مدة النشر");
    
    const num = parseInt(durationVal);
    if (isNaN(num) || num <= 0) {
      return alert("الرجاء إدخال عدد صحيح للمدة");
    }

    const selectedLesson = lessons.find(l => l.id === lessonId);
    if (!selectedLesson) {
      return alert("الدرس المحدد غير موجود");
    }

    const selectedSeries = series.find(s => s.id === selectedLesson.seriesId);
    const seriesTitle = selectedSeries ? selectedSeries.title : "سلسلة غير معروفة";
    const seriesId = selectedLesson.seriesId;
    const lessonTitle = selectedLesson.title;

    setSaving(true);
    try {
      const now = Date.now();
      const durationMs = durationType === 'weeks' 
        ? num * 7 * 24 * 60 * 60 * 1000 
        : num * 30 * 24 * 60 * 60 * 1000;
      const expiresAt = now + durationMs;

      const id = editingId || Date.now().toString();
      const payload = {
        lessonId,
        lessonTitle,
        seriesId,
        seriesTitle,
        durationVal: num,
        durationType,
        expiresAt,
        eventId: eventId || null,
        createdAt: editingId ? undefined : now,
      };

      await setDoc(doc(db, "quran_syllabuses", id), payload, { merge: true });
      await delIDB('quran_data_cache');

      alert("تم الحفظ بنجاح في Firebase");
      setEditingId(null);
      setLessonId("");
      setDurationVal("1");
      setDurationType("weeks");
      setEventId("");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (confirm("تأكيد الحذف من Firebase؟")) {
      try {
        await deleteDoc(doc(db, "quran_syllabuses", id));
        await delIDB('quran_data_cache');
        alert("تم الحذف بنجاح");
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل البيانات من Firebase...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl text-sm leading-relaxed border border-emerald-200 dark:border-emerald-800">
        يتم اختيار المقرر من الدروس المخزنة في Firebase. يتم حفظ هذه البيانات في Firebase وتظهر لجميع المستخدمين.
        بعد انتهاء المدة المحددة، يتم إخفاء المقرر تلقائياً.
      </div>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
          {editingId ? "تعديل مقرر" : "اعتماد مقرر جديد"}
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 pr-1">
            الدرس المقرر
          </label>
          <select
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-bold dark:text-white"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">-- اختر الدرس --</option>
            {lessons.map((l) => {
              const s = series.find(x => x.id === l.seriesId);
              return (
                <option key={l.id} value={l.id}>
                  {s ? `[${s.title}] ` : ""}{l.title}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">
              المدة المطلوبة
            </label>
            <input
              type="number"
              min="1"
              className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white font-bold"
              value={durationVal}
              onChange={(e) => setDurationVal(e.target.value)}
              placeholder="مثال: 3"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">
              نوع المدة
            </label>
            <select
              className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white font-bold"
              value={durationType}
              onChange={(e) => setDurationType(e.target.value as any)}
            >
              <option value="weeks">أسابيع</option>
              <option value="months">أشهر</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 pr-1">
            ربط بمناسبة (اختياري)
          </label>
          <select
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">-- بدون ربط --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            {saving ? "جاري..." : "حفظ"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setLessonId("");
                setDurationVal("1");
                setDurationType("weeks");
                setEventId("");
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {list.map((s) => {
          const isExpired = s.expiresAt ? Date.now() > s.expiresAt : false;
          const durationLabel = s.durationType === 'weeks' 
            ? `${s.durationVal} أسابيع` 
            : `${s.durationVal} أشهر`;
          
          return (
            <div
              key={s.id}
              className={`flex justify-between items-center p-4 bg-white dark:bg-gray-900/30 border rounded-xl hover:border-emerald-500/30 transition-colors group ${
                isExpired ? "border-red-200 bg-red-50/10" : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold dark:text-white">
                    {s.lessonTitle || "درس غير معروف"}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({s.seriesTitle || "سلسلة غير معروفة"})
                  </span>
                  {isExpired && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      منتهي الصلاحية
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex gap-4">
                  <span>المدة: {durationLabel}</span>
                  {s.expiresAt && (
                    <span>ينتهي في: {new Date(s.expiresAt).toLocaleDateString("ar-YE")}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingId(s.id);
                    setLessonId(s.lessonId);
                    setDurationVal(String(s.durationVal || 1));
                    setDurationType(s.durationType || "weeks");
                    setEventId(s.eventId || "");
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => del(s.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminQuranExcerpts() {
  const [list, setList] = useState<QuranExcerpt[]>([]);
  const [lessons, setLessons] = useState<QuranLesson[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons"), orderBy("order", "asc")),
      (snap) => {
        setLessons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranLesson)));
      }
    );

    const unsubExcerpts = onSnapshot(
      query(collection(db, "quran_excerpts"), orderBy("createdAt", "desc")),
      (snap) => {
        setList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranExcerpt)));
        setLoading(false);
      }
    );

    return () => {
      unsubLessons();
      unsubExcerpts();
    };
  }, []);

  const save = async () => {
    if (!lessonId || !title || !content)
      return alert("أكمل البيانات المطلوبة (الدرس، العنوان، النص)");
    setSaving(true);
    try {
      const id = editingId || Date.now().toString();
      const payload = {
        lessonId,
        title,
        content,
        mediaUrl,
        createdAt: editingId ? undefined : Date.now(),
      };

      await setDoc(doc(db, "quran_excerpts", id), payload, { merge: true });
      await delIDB('quran_data_cache');

      alert("تم الحفظ في Firebase");
      setEditingId(null);
      setLessonId("");
      setTitle("");
      setContent("");
      setMediaUrl("");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (confirm("تأكيد الحذف من Firebase؟")) {
      try {
        await deleteDoc(doc(db, "quran_excerpts", id));
        await delIDB('quran_data_cache');
        alert("تم الحذف بنجاح");
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل المقتطفات من Firebase...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-700 dark:text-white mb-2">
          {editingId ? "تعديل مقتطف" : "إضافة مقتطف جديد إلى Firebase"}
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 pr-1">
            الدرس (إلزامي)
          </label>
          <select
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-bold dark:text-white"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">-- اختر الدرس --</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 pr-1">
            عنوان المقتطف
          </label>
          <input
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 pr-1">النص</label>
          <textarea
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg h-32 leading-loose dark:text-white"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 pr-1">
            الوسائط (اختياري - رابط)
          </label>
          <input
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            {saving ? "جاري..." : "حفظ"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setLessonId("");
                setTitle("");
                setContent("");
                setMediaUrl("");
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {list.map((s) => {
          const l = lessons.find((x) => x.id === s.lessonId);
          return (
            <div
              key={s.id}
              className="flex justify-between items-center p-4 bg-white dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-emerald-500/30 transition-colors group"
            >
              <div>
                <span className="font-bold dark:text-white">{s.title}</span>
                <div className="text-xs text-gray-500 mt-1">
                  الدرس: {l ? l.title : "غير معروف"}
                </div>
              </div>
              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingId(s.id);
                    setLessonId(s.lessonId);
                    setTitle(s.title);
                    setContent(s.content);
                    setMediaUrl(s.mediaUrl || "");
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => del(s.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function AdminEvents() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayName, setDayName] = useState("");
  const [hijriDate, setHijriDate] = useState("");
  const [gregorianDate, setGregorianDate] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [category, setCategory] = useState<
    "religious" | "national" | "historical" | "all"
  >("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCached = async () => {
      try {
        const cached = await SyncService.getCache<EventItem>("events");
        if (cached && cached.length > 0) {
          setEvents(cached);
        }
      } catch (e) {
        console.warn("Could not load cached events:", e);
      }
    };
    loadCached();

    const unsub = onSnapshot(
      query(collection(db, "events"), orderBy("timestamp", "asc")),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as EventItem)
        );
        setEvents(items);
        SyncService.setCache("events", items).catch(() => {});
      },
      (err) => {
        console.warn("Admin events fetch error (using cache fallback):", err);
      }
    );
    return unsub;
  }, []);

  const save = async () => {
    if (!title || !timestamp) return alert("يرجى إدخال العنوان والتاريخ");
    setSaving(true);
    const data = {
      title,
      description,
      dayName,
      hijriDate,
      gregorianDate,
      timestamp: new Date(timestamp).getTime(),
      category,
      type: category, // for compatibility
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "events", editingId), {
          ...data,
          updatedAt: Date.now(),
        });
        alert("تم التعديل");
      } else {
        await addDoc(collection(db, "events"), {
          ...data,
          createdAt: Date.now(),
        });
        alert("تمت الإضافة");
      }
      reset();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDayName("");
    setHijriDate("");
    setGregorianDate("");
    setTimestamp("");
    setCategory("all");
  };

  const edit = (e: EventItem) => {
    setEditingId(e.id);
    setTitle(e.title);
    setDescription(e.description || "");
    setDayName(e.dayName);
    setHijriDate(e.hijriDate);
    setGregorianDate(e.gregorianDate);
    setCategory(e.category);
    setTimestamp(new Date(e.timestamp).toISOString().split("T")[0] + "T00:00");
  };

  const remove = async (id: string) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      await deleteDoc(doc(db, "events", id));
      await SyncService.trackDeletion("events", id);
    }
  };

  const seed = async () => {
    if (!confirm("سيتم إضافة 24 مناسبة أساسية إلى النظام. هل تستمر؟")) return;
    setSaving(true);
    const basicEvents = [
      {
        title: "ذكرى الهجرة النبوية",
        day: "الثلاثاء",
        hijri: "1 محرم",
        greg: "16 يونيو",
        month: 6,
        dayNum: 16,
        cat: "religious",
      },
      {
        title: "عاشوراء (استشهاد الإمام الحسين)",
        day: "الخميس",
        hijri: "10 محرم",
        greg: "25 يونيو",
        month: 6,
        dayNum: 25,
        cat: "religious",
      },
      {
        title: "ذكرى استشهاد الإمام زيد عليه السلام",
        day: "الجمعة",
        hijri: "25 محرم",
        greg: "10 يوليو",
        month: 7,
        dayNum: 10,
        cat: "religious",
      },
      {
        title: "قدوم الإمام الهادي إلى اليمن",
        day: "الإثنين",
        hijri: "6 صفر",
        greg: "20 يوليو",
        month: 7,
        dayNum: 20,
        cat: "religious",
      },
      {
        title: "المولد النبوي الشريف",
        day: "الثلاثاء",
        hijri: "12 ربيع الأول",
        greg: "25 أغسطس",
        month: 8,
        dayNum: 25,
        cat: "religious",
      },
      {
        title: "ذكرى مجزرة القاعة الكبرى",
        day: "الثلاثاء",
        hijri: "28 صفر",
        greg: "11 سبتمبر",
        month: 9,
        dayNum: 11,
        cat: "historical",
      },
      {
        title: "ثورة 21 سبتمبر",
        day: "الإثنين",
        hijri: "10 ربيع الثاني",
        greg: "21 سبتمبر",
        month: 9,
        dayNum: 21,
        cat: "national",
      },
      {
        title: "ثورة 26 سبتمبر",
        day: "السبت",
        hijri: "15 ربيع الثاني",
        greg: "26 سبتمبر",
        month: 9,
        dayNum: 26,
        cat: "national",
      },
      {
        title: "عملية طوفان الأقصى",
        day: "الأربعاء",
        hijri: "26 ربيع الثاني",
        greg: "7 أكتوبر",
        month: 10,
        dayNum: 7,
        cat: "national",
      },
      {
        title: "ثورة 14 أكتوبر",
        day: "الأربعاء",
        hijri: "3 جمادى الأولى",
        greg: "14 أكتوبر",
        month: 10,
        dayNum: 14,
        cat: "national",
      },
      {
        title: "الذكرى السنوية للشهيد",
        day: "24-30 نوفمبر",
        hijri: "13-19 جمادى الأولى",
        greg: "24-30 نوفمبر",
        month: 11,
        dayNum: 24,
        cat: "national",
      },
      {
        title: "عيد الجلاء (30 نوفمبر)",
        day: "الإثنين",
        hijri: "20 جمادى الآخرة",
        greg: "30 نوفمبر",
        month: 11,
        dayNum: 30,
        cat: "national",
      },
      {
        title: "مولد فاطمة الزهراء (عليها السلام)",
        day: "الإثنين",
        hijri: "20 جمادى الآخرة",
        greg: "30 نوفمبر",
        month: 11,
        dayNum: 30,
        cat: "religious",
      },
      {
        title: "جمعة رجب (عيد اليمنيين)",
        day: "الجمعة",
        hijri: "أول جمعة من رجب",
        greg: "11 ديسمبر",
        month: 12,
        dayNum: 11,
        cat: "religious",
      },
      {
        title: "استشهاد السيد حسين بدر الدين الحوثي",
        day: "الإثنين",
        hijri: "26 رجب",
        greg: "4 يناير",
        month: 1,
        dayNum: 4,
        cat: "religious",
      },
      {
        title: "ذكرى استشهاد الشهيد الصماد",
        day: "الخميس",
        hijri: "3 شعبان",
        greg: "22 يناير",
        month: 1,
        dayNum: 22,
        cat: "national",
      },
      {
        title: "ذكرى غزوة بدر الكبرى",
        day: "الأربعاء",
        hijri: "17 رمضان",
        greg: "24 فبراير",
        month: 2,
        dayNum: 24,
        cat: "religious",
      },
      {
        title: "استشهاد الإمام علي بن أبي طالب",
        day: "الأحد",
        hijri: "21 رمضان",
        greg: "28 فبراير",
        month: 2,
        dayNum: 28,
        cat: "religious",
      },
      {
        title: "يوم القدس العالمي",
        day: "الجمعة",
        hijri: "آخر جمعة من رمضان",
        greg: "5 مارس",
        month: 3,
        dayNum: 5,
        cat: "religious",
      },
      {
        title: "يوم الصمود الوطني (26 مارس)",
        day: "الجمعة",
        hijri: "18 شوال",
        greg: "26 مارس",
        month: 3,
        dayNum: 26,
        cat: "national",
      },
      {
        title: "ذكرى الصرخة",
        day: "الجمعة",
        hijri: "آخر جمعة من شوال",
        greg: "2 أبريل",
        month: 4,
        dayNum: 2,
        cat: "religious",
      },
      {
        title: "عيد الوحدة اليمنية",
        day: "السبت",
        hijri: "16 ذو الحجة",
        greg: "22 مايو",
        month: 5,
        dayNum: 22,
        cat: "national",
      },
      {
        title: "ذكرى عيد الغدير (يوم الولاية)",
        day: "الإثنين",
        hijri: "18 ذو الحجة",
        greg: "24 مايو",
        month: 5,
        dayNum: 24,
        cat: "religious",
      },
      {
        title: "رحيل السيد العلامة بدر الدين الحوثي",
        day: "الخميس",
        hijri: "21 ذو الحجة",
        greg: "27 مايو",
        month: 5,
        dayNum: 27,
        cat: "religious",
      },
    ];

    try {
      const batch = writeBatch(db);
      const year = new Date().getFullYear();

      for (const b of basicEvents) {
        let finalYear = year;
        const eventDateThisYear = new Date(year, b.month - 1, b.dayNum);
        if (eventDateThisYear < new Date()) {
          finalYear += 1;
        }

        const newDocRef = doc(collection(db, "events"));
        batch.set(newDocRef, {
          title: b.title,
          dayName: b.day,
          hijriDate: b.hijri,
          gregorianDate: b.greg,
          timestamp: new Date(finalYear, b.month - 1, b.dayNum).getTime(),
          category: b.cat,
          type: b.cat,
          createdAt: Date.now(),
        });
      }

      await batch.commit();
      alert("تمت إضافة 24 مناسبة بنجاح إلى النظام.");
    } catch (e) {
      console.error("Seed Error:", e);
      alert(
        "خطأ أثناء الإضافة: " + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          إدارة تقويم المناسبات
        </h2>
        <button
          onClick={seed}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
        >
          إضافة المناسبات الأساسية (24 مناسبة)
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
          {editingId ? "تعديل مناسبة" : "إضافة مناسبة جديدة"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition"
            placeholder="اسم المناسبة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition"
            placeholder="اليوم (مثلاً: الثلاثاء)"
            value={dayName}
            onChange={(e) => setDayName(e.target.value)}
          />
          <input
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition"
            placeholder="التاريخ الهجري (مثلاً: 1 محرم)"
            value={hijriDate}
            onChange={(e) => setHijriDate(e.target.value)}
          />
          <input
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition"
            placeholder="التاريخ الميلادي (مثلاً: 16 يونيو)"
            value={gregorianDate}
            onChange={(e) => setGregorianDate(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 mr-2">
              تاريخ المناسبة (للحسابات الزمنية):
            </label>
            <input
              type="datetime-local"
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 mr-2">
              التصنيف:
            </label>
            <select
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <option value="all">عام</option>
              <option value="religious">دينية</option>
              <option value="national">وطنية</option>
              <option value="historical">تاريخية</option>
            </select>
          </div>
        </div>
        <textarea
          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition h-24"
          placeholder="وصف تفصيلي للمناسبة"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {saving
              ? "جاري الحفظ..."
              : editingId
              ? "تحديث المناسبة"
              : "حفظ المناسبة"}
          </button>
          {editingId && (
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <List className="w-5 h-5" /> المناسبات المضافة ({events.length})
        </h3>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-500/30 transition-all"
            >
              <div>
                <div className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  {event.title}
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded text-gray-500">
                    {event.category}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {event.dayName} • {event.hijriDate} • {event.gregorianDate}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => edit(event)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(event.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              لا توجد مناسبات مضافة حالياً.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminRoles() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(true);

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<string>("user");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editJobTitle, setEditJobTitle] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const SECTIONS = [
    { id: "news", label: "الأخبار" },
    { id: "urgent", label: "الأخبار العاجلة" },
    { id: "videos", label: "الفيديوهات" },
    { id: "leader", label: "السيد القائد" },
    { id: "quran", label: "هدى القرآن" },
  ];

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map((d) => d.data() as UserProfile));
        setLoading(false);
      },
      (err) => {
        console.error("Admin users fetch err:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const isOnline = (lastLogin?: number) => {
    if (!lastLogin) return false;
    return Date.now() - lastLogin < 10 * 60 * 1000; // 10 minutes threshold
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", editingUser.uid), {
        role: editRole,
        permissions: editRole === "editor" ? editPermissions : null,
        jobTitle: editRole === "editor" ? editJobTitle : null,
      });
      alert("تم تحديث الصلاحيات بنجاح");
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const matchesSearch = (u: UserProfile) =>
    (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase());

  const matchesRole = (u: UserProfile) =>
    filterRole === "all" || u.role === filterRole;

  const staff = users.filter(
    (u) => u.role !== "user" && matchesSearch(u) && matchesRole(u)
  );
  const regularUsers = users.filter(
    (u) => u.role === "user" && matchesSearch(u) && matchesRole(u)
  );

  const onlineStaff = staff.filter((u) => isOnline(u.lastLogin)).length;
  const onlineUsers = regularUsers.filter((u) => isOnline(u.lastLogin)).length;

  const UserCard = ({
    u,
    isStaff = false,
  }: {
    u: UserProfile;
    isStaff?: boolean;
    key?: string;
  }) => (
    <div
      key={u.uid}
      className={`bg-surface-card p-4 rounded-2xl border transition-all ${
        isStaff
          ? "border-taiz-sky/30 shadow-md ring-1 ring-taiz-sky/5 scale-[1.01]"
          : "border-border-light shadow-sm"
      } flex items-center gap-4`}
    >
      <div className="relative shrink-0">
        {u.photoURL ? (
          <img
            src={u.photoURL}
            alt={u.displayName}
            className={`${
              isStaff ? "w-14 h-14" : "w-10 h-10"
            } rounded-full object-cover shadow-sm`}
          />
        ) : (
          <div
            className={`${
              isStaff ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm"
            } rounded-full bg-taiz-navy/10 text-taiz-navy flex items-center justify-center font-black`}
          >
            {u.displayName?.charAt(0)}
          </div>
        )}
        <div
          className={`absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-card ${
            isOnline(u.lastLogin)
              ? "bg-status-success animate-pulse"
              : "bg-text-muted opacity-50"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center justify-end gap-2">
          <h3
            className={`font-black text-text-primary truncate ${
              isStaff ? "text-base" : "text-sm"
            }`}
          >
            {u.displayName}
          </h3>
          {isOnline(u.lastLogin) && (
            <span className="text-[8px] bg-status-success/10 text-status-success px-1.5 py-0.5 rounded-full font-black animate-bounce">
              ON
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-muted truncate mb-1">{u.email}</p>
        <div className="flex items-center justify-end gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              u.role === "admin"
                ? "bg-status-error/10 text-status-error"
                : u.role === "manager"
                ? "bg-purple-100 text-purple-600"
                : u.role === "editor"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {u.role === "admin"
              ? "Admin"
              : u.role === "manager"
              ? "Manager"
              : u.role === "editor"
              ? "Editor"
              : "User"}
          </span>
        </div>
      </div>

      <button
        onClick={() => {
          setEditingUser(u);
          setEditRole(u.role);
          setEditPermissions(u.permissions || []);
          setEditJobTitle(u.jobTitle || "");
        }}
        className="p-2 hover:bg-surface-hover rounded-xl text-taiz-sky transition-colors"
        title="تعديل"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-taiz-sky" />
          <div>
            <h2 className="text-2xl font-black text-text-primary">
              إدارة الصلاحيات
            </h2>
            <p className="text-xs text-text-muted font-bold">
              إدارة وتخصيص صلاحيات الوصول للمنصة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-text-muted group-focus-within:text-taiz-sky transition-colors" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 p-2.5 bg-surface-main border border-border-light rounded-xl text-xs focus:ring-2 focus:ring-taiz-sky/20 outline-none font-bold shadow-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-2.5 bg-surface-main border border-border-light rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-taiz-sky/20 shadow-sm"
          >
            <option value="all">جميع الرتب</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="editor">Editor</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* ADMINS & MANAGERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-taiz-navy px-1">
          <Shield className="w-5 h-5" />
          <h3 className="font-black text-lg">مسؤولو النظام والمنصة</h3>
          <span className="mr-auto text-[10px] bg-taiz-navy text-white px-2 py-0.5 rounded-full">
            {staff.length} مسؤول
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((u) => (
            <UserCard key={u.uid} u={u} isStaff={true} />
          ))}
        </div>
      </div>

      {/* REGULAR USERS SECTION (Collapsible) */}
      <div className="bg-surface-main rounded-2xl border border-border-light overflow-hidden">
        <button
          onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
          className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-text-muted" />
            <h3 className="font-black text-text-primary">
              المستخدمون المسجلون
            </h3>
            <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-lg font-bold">
              {regularUsers.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-bold text-text-muted">
              متصل: <span className="text-status-success">{onlineUsers}</span> |
              غير متصل: <span>{regularUsers.length - onlineUsers}</span>
            </div>
            <motion.div animate={{ rotate: isUsersCollapsed ? 0 : 180 }}>
              <Plus
                className={`w-5 h-5 transition-transform ${
                  isUsersCollapsed ? "" : "rotate-45"
                }`}
              />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {!isUsersCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-5 space-y-4 border-t border-border-light bg-gray-50/50"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {regularUsers.map((u) => (
                  <UserCard key={u.uid} u={u} />
                ))}
              </div>
              {regularUsers.length === 0 && (
                <div className="text-center py-10 text-text-muted font-bold text-xs">
                  لا يوجد مستخدمين يطابقون البحث
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b dark:border-gray-700 pb-3 text-right">
                تعديل صلاحيات ({editingUser.displayName})
              </h3>

              <div
                className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-hide text-right"
                dir="rtl"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    الصلاحية
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-taiz-sky font-bold"
                  >
                    <option value="user">مستخدم عادي (User)</option>
                    <option value="editor">محرر مخصص (Editor)</option>
                    <option value="manager">مسؤول منصة (Manager)</option>
                    <option value="admin">مسؤول نظام (Admin)</option>
                  </select>
                </div>

                {editRole === "editor" && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        المسمى الوظيفي
                      </label>
                      <input
                        type="text"
                        value={editJobTitle}
                        placeholder="مثال: محرر أخبار عاجلة"
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-taiz-sky text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        الأقسام المسموح بإدارتها
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SECTIONS.map((sec) => (
                          <label
                            key={sec.id}
                            className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                              editPermissions.includes(sec.id)
                                ? "border-taiz-sky bg-taiz-sky/5"
                                : "border-border-light hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={editPermissions.includes(sec.id)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setEditPermissions([
                                    ...editPermissions,
                                    sec.id,
                                  ]);
                                else
                                  setEditPermissions(
                                    editPermissions.filter((p) => p !== sec.id)
                                  );
                              }}
                              className="w-4 h-4 rounded text-taiz-sky focus:ring-taiz-sky"
                            />
                            <span className="text-xs font-black text-text-primary">
                              {sec.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-2 font-bold leading-relaxed">
                        المحرر سيتمكن فقط من رؤية الأقسام المختارة في لوحة
                        التحكم الخاصة به.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 pt-3 border-t dark:border-gray-700 shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-taiz-sky text-white rounded-xl font-bold hover:bg-taiz-navy transition-colors disabled:opacity-50"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("whatsapp");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "social_links"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      setLinks(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SocialLink))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const save = async () => {
    if (!label || !url) return alert("يرجى تعبئة جميع الحقول المطلوبة");
    setSaving(true);
    try {
      const payload = {
        platform,
        label,
        url,
        description,
        order: Number(order),
        createdAt: Date.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "social_links", editingId), payload);
        alert("تم التعديل بنجاح");
      } else {
        await addDoc(collection(db, "social_links"), payload);
        alert("تم الإضافة بنجاح");
      }

      setLabel("");
      setUrl("");
      setDescription("");
      setOrder(links.length + 2);
      setEditingId(null);
      fetchLinks();
    } catch (e) {
      handleFirestoreError(
        e,
        "social_links",
        editingId ? "write" : "write",
        editingId || undefined
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await deleteDoc(doc(db, "social_links", id));
      await SyncService.trackDeletion("social_links", id);
      fetchLinks();
    } catch (e) {
      handleFirestoreError(e, "social_links", "delete", id);
    }
  };

  const edit = (link: SocialLink) => {
    setEditingId(link.id);
    setPlatform(link.platform);
    setLabel(link.label);
    setUrl(link.url);
    setDescription(link.description || "");
    setOrder(link.order);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      <div className="border-b dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-end gap-2">
          <span>إدارة روابط تابعنا</span>
          <Share2 className="w-6 h-6 text-blue-600" />
        </h2>
        <p className="text-gray-500 text-sm mt-1 font-bold">
          هذه الروابط تظهر في قسم "تابعنا" في صفحة حسابي لجميع المستخدمين.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="font-black text-lg text-blue-600 mb-4">
          {editingId ? "تعديل رابط" : "إضافة رابط جديد"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-black">المنصة:</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold"
            >
              <option value="whatsapp">واتساب (WhatsApp)</option>
              <option value="telegram">تيليجرام (Telegram)</option>
              <option value="meyon">ميون (Meyon)</option>
              <option value="facebook">فيسبوك (Facebook)</option>
              <option value="twitter">تويتر / X</option>
              <option value="youtube">يوتيوب (YouTube)</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-black">الاسم / التسمية:</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: قناة الواتساب"
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-black">الرابط (URL):</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-mono text-xs text-left"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-black">وصف قصير:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: انضم لقناتنا للمتابعة..."
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-black">الترتيب:</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving
              ? "جاري الحفظ..."
              : editingId
              ? "حفظ التعديلات"
              : "إضافة الرابط"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setLabel("");
                setUrl("");
                setDescription("");
              }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-8 rounded-2xl font-black hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-lg text-gray-900 dark:text-white">
          الروابط الحالية
        </h3>
        {loading ? (
          <div className="py-10 text-center text-gray-500 font-bold">
            جاري التحميل...
          </div>
        ) : links.length === 0 ? (
          <div className="py-10 text-center text-gray-500 font-bold bg-gray-50 dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            لا توجد روابط مضافة حالياً. سيتم عرض الروابط الافتراضية للمستخدمين.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      link.platform === "whatsapp"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                        : link.platform === "telegram"
                        ? "bg-sky-50 dark:bg-sky-900/20 text-sky-500"
                        : link.platform === "meyon"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                        : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                    }`}
                  >
                    {link.platform === "whatsapp" ? (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                    ) : link.platform === "telegram" ? (
                      <Send className="w-5 h-5" />
                    ) : link.platform === "meyon" ? (
                      <MonitorPlay className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                      {link.label}
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-400">
                        #{link.order}
                      </span>
                    </h4>
                    <p className="text-xs text-gray-500 font-bold truncate max-w-[200px]">
                      {link.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => edit(link)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
