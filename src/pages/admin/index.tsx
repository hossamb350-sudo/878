import { sendFCMNotification } from "../../utils/sendFCM";
import React, { useState, useEffect, ChangeEvent } from "react";
import { ImageUpload } from "../../components/ImageUpload";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithCredential,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { CategoryService } from "../../services/CategoryService";
import { Capacitor } from "@capacitor/core";

const isProd = import.meta.env.PROD;
const DEV_URL = "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
const PROD_URL = "https://ais-pre-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
const API_BASE = Capacitor.isNativePlatform() ? (isProd ? PROD_URL : DEV_URL) : "";

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
  Activity,
  Archive,
  Zap,
  ArrowLeftRight,
  Edit2,
  Loader2,
  RotateCcw,
  Plus,
  List,
  Edit,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Newspaper,
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
  Quote,
} from "lucide-react";
import {
  NewsItem,
  VideoItem,
  LiveStream,
  EventItem,
  UserProfile,
  LeaderContent,
  SocialLink,
} from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { SyncService, handleFirestoreError } from "../../services/SyncService";
import { GitHubClient } from "../../services/githubClient";
import { del as delIDB } from "idb-keyval";
import { PushNotificationService } from "../../services/PushNotificationService";
import { AuthModals } from "../../components/AuthModals";

import { FavoritesList } from "../../components/FavoritesList";
import { UserProfileSection } from "../../components/UserProfileSection";

import { AdminNewsWizard } from "../../components/AdminNewsWizard";
import { STATIC_QURAN_LESSONS, STATIC_QURAN_SERIES, sortQuranLessons } from "../../data/staticQuranData";
import { loadQuranMetadata } from "../../data/importedQuranData";
import { AdminCategoryManager } from "../../components/AdminCategoryManager";
import { AdminArticles } from "../../components/AdminArticles";
import { AdminVideos } from "../../components/AdminVideos";
import { AdminLeader } from "../../components/AdminLeader";
import { AdminOnlineUsers } from "../../components/AdminOnlineUsers";
import { AdminRegisteredUsers } from "../../components/AdminRegisteredUsers";
import { AdminVersionLock } from "../../components/AdminVersionLock";
import { AdminFeaturedTopics } from "../../components/AdminFeaturedTopics";
import { AdminLiveChannels } from "../../components/AdminLiveChannels";
import { AdminQuranExcerpts } from "../../components/AdminQuranExcerpts";
import { OnlineUsersConfig, RegisteredUsersConfig } from "../../services/OnlineUsersService";
import { ContactUsSection } from "../../components/ContactUsSection";

const OldContactUsSection = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [imageError, setImageError] = useState(false);
  const [footerImage, setFooterImage] = useState<string>(() => {
    return localStorage.getItem("custom_footer_cached_image") || "/custom_footer.png";
  });

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

    // Load and cache custom footer image from Firestore
    const loadAndCacheFooterImage = async () => {
      try {
        const cachedTime = localStorage.getItem("custom_footer_cached_time") || "0";
        const docRef = doc(db, "settings", "custom_footer");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const imageUrl = data.imageUrl;
          const updatedAt = data.updatedAt || 0;
          
          if (imageUrl && (String(updatedAt) !== cachedTime || !localStorage.getItem("custom_footer_cached_image"))) {
            localStorage.setItem("custom_footer_cached_image", imageUrl);
            localStorage.setItem("custom_footer_cached_time", String(updatedAt));
            if (active) {
              setFooterImage(imageUrl);
              setImageError(false);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load custom footer image from Firestore, using cache if available:", e);
      }
    };
    loadAndCacheFooterImage();

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

  const allItems = [
    ...displayLinks,
    {
      id: "sms-service",
      platform: "sms",
      label: "خدمة رسائل SMS",
      url: "sms:5552?body=%D8%AA%D8%B9%D8%B2",
      description: "أرسل تعز برسالة نصية إلى الرقم 5552",
      order: 10,
      createdAt: 0,
    },
    {
      id: "radio-broadcast",
      platform: "radio",
      label: "البث الإذاعي لإذاعة تعز",
      url: "#",
      description: "على موجة FM 88.1",
      order: 11,
      createdAt: 0,
    }
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
          {allItems.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target={link.id === "radio-broadcast" ? undefined : "_blank"}
              onClick={link.id === "radio-broadcast" ? (e) => e.preventDefault() : undefined}
              rel="referrerPolicy"
              className={`p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition flex items-center justify-between ${
                link.platform === "whatsapp" || link.platform === "meyon" || link.platform === "sms" || link.platform === "radio"
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
                    : link.platform === "sms"
                    ? "#a855f7"
                    : link.platform === "radio"
                    ? "#f97316"
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
                      : link.platform === "sms"
                      ? "text-purple-600"
                      : link.platform === "radio"
                      ? "text-orange-600"
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
                    : link.platform === "sms"
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                    : link.platform === "radio"
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
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
                ) : link.platform === "sms" ? (
                  <MessageSquare className="w-5 h-5" />
                ) : link.platform === "radio" ? (
                  <Radio className="w-5 h-5" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* قسم الصورة المخصصة في الأسفل */}
      <div className="w-full flex flex-col items-center justify-center pt-4 pb-2 px-2">
        <div className="w-full max-w-md bg-[#0c1933]/40 dark:bg-gray-800/40 border border-white/5 dark:border-gray-700/50 rounded-[2rem] p-5 flex flex-col items-center shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="w-full flex flex-col items-center">
            <img
              src={footerImage}
              alt="المحتوى الخاص"
              className="w-full h-auto rounded-2xl object-contain opacity-95 hover:opacity-100 transition-all duration-500 shadow-md"
              onError={() => {
                // If the firestore/cached image fails, fall back to /custom_footer.png
                if (footerImage !== "/custom_footer.png") {
                  setFooterImage("/custom_footer.png");
                } else {
                  setImageError(true);
                }
              }}
            />
            <div className="text-center pt-3 opacity-60">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                تصميم وإعداد خاص بالمنصة
              </p>
            </div>
          </div>
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Admin/Manager/Editor View Logic (Moved to top to follow Rules of Hooks)
  const isManager = profile?.role === "manager";
  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor";
  const isPrivileged = isAdmin || isManager || isEditor;

  // Mode Switcher state: "admin" vs "member" (exclusively for Admin, Manager, Editor)
  const [portalMode, setPortalMode] = useState<"admin" | "member">(() => {
    const saved = localStorage.getItem("admin_portal_mode");
    return saved === "member" ? "member" : "admin";
  });
  const hasPermission = (sectionId: string) => {
    if (!profile?.permissions || !Array.isArray(profile.permissions)) return false;
    if (profile.permissions.includes("all")) return true;
    if (profile.permissions.includes(sectionId)) return true;
    if (sectionId === "urgent" && profile.permissions.includes("urgentNews")) return true;
    if (sectionId === "urgentNews" && profile.permissions.includes("urgent")) return true;
    if (sectionId === "live" && profile.permissions.includes("livestreams")) return true;
    return false;
  };

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
      access: isAdmin || isManager || (isEditor && hasPermission("urgent")),
    },
    {
      id: "featuredTopics",
      icon: Zap,
      label: "أبرز المواضيع",
      access: isAdmin || isManager,
    },
    {
      id: "videos",
      icon: Video,
      label: "الفيديوهات",
      access: isAdmin || isManager || (isEditor && hasPermission("videos")),
    },
    {
      id: "live",
      icon: Radio,
      label: "البث المباشر",
      access: isAdmin || isManager || (isEditor && hasPermission("live")),
    },
    {
      id: "leader",
      icon: Shield,
      label: "السيد القائد",
      access: isAdmin || isManager || (isEditor && hasPermission("leader")),
    },
    {
      id: "quran",
      icon: Settings,
      label: "إعداد مقررات هدي القرآن",
      access: isAdmin || isManager || (isEditor && hasPermission("quran")),
    },
    {
      id: "excerpts",
      icon: Quote,
      label: "إدارة المقتطفات",
      access: isAdmin || isManager || (isEditor && (hasPermission("excerpts") || hasPermission("quran"))),
    },
    {
      id: "articles",
      icon: BookOpen,
      label: "إدارة المقالات",
      access: isAdmin || isManager || (isEditor && hasPermission("articles")),
    },
    {
      id: "events",
      icon: CalendarIcon,
      label: "تقويم المناسبات",
      access: isAdmin || isManager || (isEditor && hasPermission("events")),
    },
    {
      id: "social",
      icon: Share2,
      label: "روابط تابعنا",
      access: isAdmin || isManager || (isEditor && hasPermission("social")),
    },
    {
      id: "categories",
      icon: List,
      label: "إدارة التصنيفات",
      access: isAdmin || isManager || (isEditor && hasPermission("categories")),
    },
    { id: "registered-users", icon: Users, label: "إدارة عدد المستخدمين", access: isAdmin },
    { id: "version-lock", icon: Shield, label: "قفل وإصدار التطبيق", access: isAdmin },
    { id: "roles", icon: Users, label: "إدارة الصلاحيات", access: isAdmin },
  ];

  const filteredTabs = sidebarTabs.filter((tab) => tab.access);

  // Set default tab if current is not allowed
  useEffect(() => {
    const isStaff = isAdmin || isManager || isEditor;
    const currentTabAllowed =
      (isStaff && activeTab === "dashboard") ||
      filteredTabs.some((t) => t.id === activeTab);
    if (!currentTabAllowed) {
      setActiveTab("dashboard");
    }
  }, [isAdmin, isManager, isEditor, activeTab, filteredTabs]);

  // Ensure login for Admin, Manager, or Editor always opens the main Control Panel dashboard
  useEffect(() => {
    if (user && (isAdmin || isManager || isEditor)) {
      setActiveTab("dashboard");
    }
  }, [user?.uid, profile?.role]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '565624301516-17egbf55cbcp1vsdhd3mh024n2m5bqtp.apps.googleusercontent.com',
        scopes: ["profile", "email"],
        grantOfflineAccess: true,
      }).catch(e => console.log("GoogleAuth already initialized:", e));
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
        try {
          await GoogleAuth.initialize({
            clientId: '565624301516-17egbf55cbcp1vsdhd3mh024n2m5bqtp.apps.googleusercontent.com',
          });
        } catch (e) {
          console.log("GoogleAuth already initialized or skip:", e);
        }
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
      console.error("Login error:", error);
      if (error.code === "auth/operation-not-allowed") {
        alert(
          "تسجيل الدخول عبر جوجل غير مفعل حالياً. يرجى التواصل مع الإدارة."
        );
      } else {
        const detail = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
        alert(
          "حدث خطأ أثناء تسجيل الدخول: " +
            detail +
            " | كود الخطأ: " +
            (error.code || "N/A")
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
          <User className="w-10 h-10 text-blue-600 dark:text-red-600" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">
          مرحباً بك في منصة تعز الإعلامية
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
          سجل دخولك للوصول إلى تفضيلاتك وإدارة حسابك الشخصي والوصول إلى كافة المميزات.
        </p>

        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-gradient-to-r from-[#d49a37] to-[#b37f2c] hover:from-[#e3ab4a] hover:to-[#c48f33] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-amber-600/10 hover:shadow-xl transition-all flex items-center gap-3 active:scale-95 mb-16 cursor-pointer"
        >
          <User className="w-5 h-5 text-white" />
          <span>تسجيل الدخول / إنشاء حساب</span>
        </button>

        <AuthModals
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab="login"
          onSuccess={() => setIsAuthModalOpen(false)}
        />

        <div className="w-full max-w-2xl text-right">
          <ContactUsSection />
        </div>
      </div>
    );
  }

  // If user is a regular member (not Admin, Manager, or Editor)
  // OR if a privileged staff user has switched to "member" mode:
  if (!isPrivileged || (isPrivileged && portalMode === "member")) {
    return (
      <div className="w-full max-w-4xl mx-auto p-3 sm:p-5 md:p-6 pb-24 space-y-3.5 sm:space-y-4 animate-fade-in font-sans select-none" dir="rtl">
        {isPrivileged && (
          <>
            {/* 1. TOP RED LOGOUT BUTTON */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2.5 text-base sm:text-lg font-black text-white bg-gradient-to-r from-red-500 via-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.99] transition-all shadow-lg shadow-red-500/25 rounded-[22px] sm:rounded-2xl py-3.5 sm:py-4 px-6 border border-red-400/30 cursor-pointer font-cairo shrink-0"
            >
              <LogOut className="w-5 h-5 stroke-[2.2] shrink-0" />
              <span>تسجيل الخروج</span>
            </button>

            {/* 2. MODE SWITCHER BAR: Exclusively for Admin, Manager, Editor */}
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-[22px] sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPortalMode("admin");
                  localStorage.setItem("admin_portal_mode", "admin");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-cairo text-xs sm:text-sm md:text-base transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-[0.98]"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <span>الدخول كمسؤول</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPortalMode("member");
                  localStorage.setItem("admin_portal_mode", "member");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-cairo text-xs sm:text-sm md:text-base transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 active:scale-[0.98]"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>الدخول كعضو</span>
                <span className="text-[10px] bg-white/25 text-white px-2 py-0.5 rounded-full font-sans font-bold">نشط</span>
              </button>
            </div>
          </>
        )}

        <UserProfileSection
          user={user}
          profile={
            profile || {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "مستخدم",
              photoURL: user.photoURL || undefined,
              role: "user",
              createdAt: Date.now(),
              lastLogin: Date.now(),
            }
          }
          logout={logout}
          onProfileUpdated={(updated) => setProfile(updated)}
          hideHeaderLogout={isPrivileged}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-5 md:p-6 pb-24 space-y-3.5 sm:space-y-4 animate-fade-in font-sans select-none" dir="rtl">
      
      {/* 1. TOP RED LOGOUT BUTTON */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2.5 text-base sm:text-lg font-black text-white bg-gradient-to-r from-red-500 via-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.99] transition-all shadow-lg shadow-red-500/25 rounded-[22px] sm:rounded-2xl py-3.5 sm:py-4 px-6 border border-red-400/30 cursor-pointer font-cairo shrink-0"
      >
        <LogOut className="w-5 h-5 stroke-[2.2] shrink-0" />
        <span>تسجيل الخروج</span>
      </button>

      {/* 2. MODE SWITCHER BAR: Exclusively for Admin, Manager, Editor */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-[22px] sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPortalMode("admin");
            localStorage.setItem("admin_portal_mode", "admin");
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-cairo text-xs sm:text-sm md:text-base transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]"
        >
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span>الدخول كمسؤول</span>
          <span className="text-[10px] bg-white/25 text-white px-2 py-0.5 rounded-full font-sans font-bold">نشط</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPortalMode("member");
            localStorage.setItem("admin_portal_mode", "member");
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-cairo text-xs sm:text-sm md:text-base transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-[0.98]"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
          <span>الدخول كعضو</span>
        </button>
      </div>

      {/* 3. SUB-HEADER FLOATING BAR: MAIN TITLE & QUICK MENU DROPDOWN */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 px-4 sm:px-5 rounded-[22px] sm:rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
        
        {/* Right Side: Title with Menu Hamburger Icon */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className="text-indigo-600 dark:text-indigo-400 p-1 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
            title="القائمة الرئيسية"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight font-cairo">
            لوحة التحكم الرئيسية
          </h1>
        </div>

        {/* Left Side: Quick Menu Pill Indicator & Select */}
        <div className="relative flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-400 dark:text-slate-500 font-cairo">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span>القائمة السريعة</span>
          </div>

          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20"
              dir="rtl"
            >
              <option value="dashboard">لوحة التحكم الرئيسية</option>
              {filteredTabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 pointer-events-none hover:bg-slate-200 transition-colors">
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT OR MAIN DASHBOARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {activeTab === "dashboard" ? (
            <AdminSummaryDashboard
              onNavigate={setActiveTab}
              isAdmin={isAdmin}
              isManager={isManager}
              isEditor={isEditor}
              filteredTabs={filteredTabs}
              user={user}
              profile={profile}
            />
          ) : (
            <div className="space-y-4">
              {/* Top Navigation Back Banner when viewing a specific sub-section */}
              <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-[22px] border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-cairo"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  <span>العودة للوحة التحكم</span>
                </button>

                <div className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 font-cairo">
                  {filteredTabs.find(t => t.id === activeTab)?.label || "إدارة القسم"}
                </div>
              </div>

              {/* Sub Tab Component Container */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[500px]">
                {activeTab === "news" && (
                  <AdminNews
                    isAdmin={isAdmin}
                    onBackToDashboard={() => setActiveTab("dashboard")}
                  />
                )}
                {activeTab === "categories" && <AdminCategoryManager />}
                {activeTab === "urgent" && <AdminUrgentNews />}
                {activeTab === "featuredTopics" && <AdminFeaturedTopics />}
                {activeTab === "videos" && <AdminVideos isAdmin={isAdmin} />}
                {activeTab === "live" && <AdminLiveChannels />}
                {activeTab === "leader" && <AdminLeader isAdmin={isAdmin} />}
                {activeTab === "articles" && <AdminArticles isAdmin={isAdmin} />}
                {activeTab === "quran" && <AdminQuran />}
                {activeTab === "excerpts" && <AdminQuranExcerpts />}
                {activeTab === "events" && <AdminEvents />}
                {activeTab === "social" && <AdminSocialLinks />}
                {activeTab === "roles" && isAdmin && <AdminRoles />}
                {activeTab === "registered-users" && isAdmin && <AdminRegisteredUsers isAdmin={isAdmin} />}
                {activeTab === "version-lock" && isAdmin && <AdminVersionLock isAdmin={isAdmin} />}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 4. FOOTER WATERMARK WITH DECORATIVE WAVE */}
      <div className="pt-8 pb-4 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
          <div className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-300 font-cairo tracking-wide">
            منصة تعز الإعلامية
          </div>
          <div className="text-xs font-extrabold text-slate-400 dark:text-slate-500 font-cairo">
            لوحة الإدارة
          </div>
          {/* Glowing 3 Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          </div>
        </div>

        {/* Soft Background Wave Background */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-100/40 via-sky-50/20 to-transparent dark:from-slate-900/50 dark:to-transparent pointer-events-none rounded-b-3xl"></div>
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
  user,
  profile,
}: {
  onNavigate: (tabId: string) => void;
  isAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  filteredTabs: any[];
  user?: FirebaseUser | null;
  profile?: UserProfile | null;
}) {
  const [stats, setStats] = useState({
    news: 0,
    articles: 0,
    videos: 0,
    leader: 0,
    live: 0,
    events: 0,
  });

  const [onlineCountDisplay, setOnlineCountDisplay] = useState<number>(34);
  const [registeredCountDisplay, setRegisteredCountDisplay] = useState<number>(() => {
    const savedDisplay = localStorage.getItem("registered_users_display_count");
    if (savedDisplay && !isNaN(Number(savedDisplay))) {
      return Number(savedDisplay);
    }
    const savedCfg = localStorage.getItem("registered_users_config");
    if (savedCfg) {
      try {
        const parsed = JSON.parse(savedCfg);
        if (parsed.isCustomOverride && parsed.customCount != null) {
          return Number(parsed.customCount);
        }
      } catch {}
    }
    return 14;
  });

  // Real-time online users & registered users config listeners
  useEffect(() => {
    // 1. Registered Users Config & Count
    const unsubRegConfig = onSnapshot(doc(db, "settings", "registered_users_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as RegisteredUsersConfig;
        localStorage.setItem("registered_users_config", JSON.stringify(data));
        if (data.isCustomOverride) {
          const cnt = data.customCount ?? 14;
          setRegisteredCountDisplay(cnt);
          localStorage.setItem("registered_users_display_count", String(cnt));
        } else {
          getDocs(collection(db, "users")).then((usersSnap) => {
            const cnt = usersSnap.size || 1;
            setRegisteredCountDisplay(cnt);
            localStorage.setItem("registered_users_display_count", String(cnt));
          }).catch(() => {});
        }
      }
    }, (err) => {
      console.warn("Could not fetch registered_users_config:", err);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const docRef = doc(db, "settings", "registered_users_config");
      getDoc(docRef).then((cfgSnap) => {
        if (!cfgSnap.exists() || !(cfgSnap.data() as RegisteredUsersConfig).isCustomOverride) {
          const cnt = snap.size || 1;
          setRegisteredCountDisplay(cnt);
          localStorage.setItem("registered_users_display_count", String(cnt));
        }
      }).catch(() => {});
    }, (err) => {
      console.warn("Could not listen to users collection:", err);
    });

    return () => {
      unsubRegConfig();
      unsubUsers();
    };
  }, []);

  useEffect(() => {
    // 2. Online Users Config & Simulation Fluctuations
    let interval: any = null;

    const unsubOnlineConfig = onSnapshot(doc(db, "settings", "online_users_config"), (snap) => {
      if (interval) clearInterval(interval);

      if (snap.exists()) {
        const data = snap.data() as OnlineUsersConfig;
        if (data.isSimulated) {
          const min = data.minCount || 15;
          const max = data.maxCount || 45;
          const initial = Math.floor(Math.random() * (max - min + 1)) + min;
          setOnlineCountDisplay(initial);

          let current = initial;
          interval = setInterval(() => {
            const delta = Math.floor(Math.random() * 7) - 3;
            let next = current + delta;
            if (next < min) next = min + Math.floor(Math.random() * 3);
            if (next > max) next = max - Math.floor(Math.random() * 3);
            current = next;
            setOnlineCountDisplay(next);
          }, (data.updateIntervalSec || 4) * 1000);

        } else {
          const now = Date.now();
          const tenMinsAgo = now - 10 * 60 * 1000;
          getDocs(collection(db, "users")).then((userSnap) => {
            let active = 0;
            userSnap.forEach((d) => {
              if (d.data().lastLogin && d.data().lastLogin > tenMinsAgo) active++;
            });
            setOnlineCountDisplay(Math.max(active, 1));
          }).catch(() => setOnlineCountDisplay(1));
        }
      } else {
        setOnlineCountDisplay(34);
      }
    }, (err) => {
      console.warn("Could not fetch online_users_config:", err);
      setOnlineCountDisplay(34);
    });

    return () => {
      unsubOnlineConfig();
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // 1. Load initial stats from cache to show something immediately and act as fallback
    const loadCachedStats = async () => {
      try {
        const newsCache = await SyncService.getCache("news");
        const articlesCache = await SyncService.getCache("articles");
        const videosCache = await SyncService.getCache("videos");
        const leaderCache = await SyncService.getCache("leader");
        const liveCache = await SyncService.getCache("livestreams");
        const eventsCache = await SyncService.getCache("events");

        setStats({
          news: newsCache.length || 0,
          articles: articlesCache.length || 0,
          videos: videosCache.length || 0,
          leader: leaderCache.length || 0,
          live: liveCache.length || 0,
          events: eventsCache.length || 0,
        });
      } catch (e) {
        console.warn("Could not load cached stats:", e);
      }
    };
    loadCachedStats();

    // 2. Set up real-time listener, but handle errors gracefully
    const collectionsMap = { 
      news: "news", 
      articles: "articles",
      videos: "videos", 
      leader: "leader",
      live: "livestreams",
      events: "events",
    };
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

  // Sections matching exact visual arrangement from reference image
  const adminSections = [
    {
      id: "news",
      label: "الأخبار",
      icon: FileText,
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      textColor: "text-blue-600 dark:text-blue-400",
      access: filteredTabs.some((t) => t.id === "news"),
    },
    {
      id: "articles",
      label: "إدارة المقالات",
      icon: BookOpen,
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      textColor: "text-amber-600 dark:text-amber-400",
      access: filteredTabs.some((t) => t.id === "articles"),
    },
    {
      id: "urgent",
      label: "الأخبار العاجلة",
      icon: AlertTriangle,
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      textColor: "text-orange-600 dark:text-orange-400",
      access: filteredTabs.some((t) => t.id === "urgent"),
    },
    {
      id: "live",
      label: "البث المباشر",
      icon: Radio,
      bgColor: "bg-red-50 dark:bg-red-950/50",
      textColor: "text-red-600 dark:text-red-400",
      access: filteredTabs.some((t) => t.id === "live"),
    },
    {
      id: "leader",
      label: "السيد القائد",
      icon: Shield,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      textColor: "text-emerald-600 dark:text-emerald-400",
      access: filteredTabs.some((t) => t.id === "leader"),
    },
    {
      id: "videos",
      label: "الفيديوهات",
      icon: Video,
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
      textColor: "text-indigo-600 dark:text-indigo-400",
      access: filteredTabs.some((t) => t.id === "videos"),
    },
    {
      id: "roles",
      label: "إدارة الصلاحيات",
      icon: Users,
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      textColor: "text-purple-600 dark:text-purple-400",
      access: filteredTabs.some((t) => t.id === "roles"),
    },
    {
      id: "events",
      label: "تقويم المناسبات",
      icon: CalendarIcon,
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      textColor: "text-rose-600 dark:text-rose-400",
      access: filteredTabs.some((t) => t.id === "events"),
    },
    {
      id: "quran",
      label: "إعداد مقررات هدي القرآن",
      icon: BookOpen,
      bgColor: "bg-green-50 dark:bg-green-950/50",
      textColor: "text-green-600 dark:text-green-400",
      access: filteredTabs.some((t) => t.id === "quran"),
    },
    {
      id: "social",
      label: "روابط تابعنا",
      icon: Share2,
      bgColor: "bg-teal-50 dark:bg-teal-950/50",
      textColor: "text-teal-600 dark:text-teal-400",
      access: filteredTabs.some((t) => t.id === "social"),
    },
    {
      id: "categories",
      label: "إدارة التصنيفات",
      icon: List,
      bgColor: "bg-sky-50 dark:bg-sky-950/50",
      textColor: "text-sky-600 dark:text-sky-400",
      access: filteredTabs.some((t) => t.id === "categories"),
    },
  ];

  const filteredSections = adminSections.filter((s) => s.access);
  const displayName = user?.displayName || profile?.displayName || "حسام باشا المتوكل";

  return (
    <div className="space-y-5 sm:space-y-6 w-full animate-fade-in" dir="rtl">
      
      {/* HERO WELCOME & STATS CARD WITH TAIS CASTLE BACKGROUND */}
      <div className="relative rounded-[28px] sm:rounded-[34px] overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl text-white">
        
        {/* Background Castle Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/taiz_castle.jpg" 
            alt="Taiz Castle" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/30"></div>
        </div>

        {/* Hero Top Content */}
        <div className="relative z-10 p-5 sm:p-7 md:p-8 pb-4 sm:pb-6 flex items-start justify-between">
          {/* User Info Stack */}
          <div className="space-y-1 sm:space-y-1.5 text-right">
            <div className="text-slate-300 font-extrabold text-xs sm:text-sm font-cairo flex items-center gap-1.5">
              <span>مرحباً بك</span>
              <span>👋</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-cairo text-white tracking-tight drop-shadow-md">
              {displayName}
            </h2>

            {/* Role Badge */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black font-cairo backdrop-blur-md shadow-xs">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isAdmin ? "مدير النظام" : isManager ? "مسؤول المنصة" : profile?.jobTitle || "محرر"}
                </span>
              </span>
            </div>
          </div>

          {/* Yellow Lightning Icon Top Right Accent */}
          <div className="text-amber-400 p-2 bg-amber-500/10 rounded-2xl border border-amber-500/20 backdrop-blur-md">
            <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-400" />
          </div>
        </div>

        {/* Hero Bottom Integrated Frosted Glass Stats Bar */}
        <div className="relative z-10 m-3 sm:m-4 mt-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[22px] sm:rounded-[26px] p-3 sm:p-4 shadow-xl">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
            
            {/* ROW 1: الأخبار | المقالات | الفيديوهات */}

            {/* 1. الأخبار */}
            <div 
              onClick={() => onNavigate("news")}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                  {(stats.news || 128).toLocaleString("ar-EG")}
                </span>
                <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                الأخبار
              </span>
              <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-blue-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                <span>عرض الكل</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 2. المقالات */}
            <div 
              onClick={() => onNavigate("articles")}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                  {(stats.articles || 35).toLocaleString("ar-EG")}
                </span>
                <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                المقالات
              </span>
              <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-amber-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                <span>عرض الكل</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 3. الفيديوهات */}
            <div 
              onClick={() => onNavigate("videos")}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                  {(stats.videos || 56).toLocaleString("ar-EG")}
                </span>
                <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                الفيديوهات
              </span>
              <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-emerald-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                <span>عرض الكل</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>

            {/* ROW 2: السيد القائد | البث المباشر | المناسبات */}

            {/* 4. السيد القائد */}
            <div 
              onClick={() => onNavigate("leader")}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                  {(stats.leader || 18).toLocaleString("ar-EG")}
                </span>
                <div className="p-1 sm:p-1.5 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                السيد القائد
              </span>
              <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-teal-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                <span>عرض الكل</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 5. البث المباشر */}
            <div 
              onClick={() => onNavigate("live")}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                  {(stats.live || 4).toLocaleString("ar-EG")}
                </span>
                <div className="p-1 sm:p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                  <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                البث المباشر
              </span>
              <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-red-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                <span>عرض القنوات</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 6. المناسبات */}
            <div 
              onClick={() => onNavigate("events")}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                  {(stats.events || 12).toLocaleString("ar-EG")}
                </span>
                <div className="p-1 sm:p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                المناسبات
              </span>
              <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-rose-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                <span>عرض الكل</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>

            {/* ROW 3: 7. المستخدمين المسجلين (في المنتصف) */}
            <div className="col-span-3 flex justify-center pt-1">
              <div 
                onClick={isAdmin ? () => onNavigate("registered-users") : undefined}
                className={`w-full sm:w-1/2 md:w-1/3 flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-white/5 border border-amber-500/30 transition-all ${
                  isAdmin ? "hover:bg-white/10 hover:border-amber-500/60 cursor-pointer group shadow-sm" : "cursor-default"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-base sm:text-lg md:text-xl font-black font-sans text-white tracking-tight">
                    {registeredCountDisplay.toLocaleString("ar-EG")}
                  </span>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <span className="text-[11px] sm:text-xs font-black text-slate-200 mt-1 font-cairo">
                  المستخدمون المسجلون
                </span>
                <div className="h-0.5 sm:h-1 w-8 sm:w-12 bg-amber-500 rounded-full my-1 sm:my-1.5 opacity-90"></div>
                {isAdmin ? (
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-0.5 font-cairo">
                    <span>إدارة العدد</span>
                    <ChevronLeft className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[11px] font-bold text-amber-400/80 font-cairo">
                    <span>عدد المسجلين</span>
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SECTIONS HEADER: "أقسام الإدارة" */}
      <div className="flex items-center gap-2 px-1 my-2.5 select-none" dir="rtl">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
          <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <div className="flex flex-col text-right">
          <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">أقسام الإدارة</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">التحكم في محتوى وأقسام المنصة</p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent ml-2 mr-4"></div>
      </div>

      {/* 3-COLUMN GRID OF MANAGEMENT SECTION CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {filteredSections.map((section) => (
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-[22px] sm:rounded-[26px] shadow-xs hover:shadow-md border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer relative flex items-center justify-between group"
          >
            {/* Right Side: Icon & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${section.bgColor} ${section.textColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                <section.icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              
              <div className="flex flex-col text-right min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 font-cairo whitespace-normal">
                  {section.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-cairo">
                  إدارة
                </span>
              </div>
            </div>

            {/* Left Side: Chevron Arrow */}
            <div className="pr-1 shrink-0">
              <ChevronLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
            </div>
          </motion.div>
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
  return <UserProfileSection user={user} profile={profile} logout={logout} />;
}

function AdminUrgentNews() {
  interface DraftNews {
    id: string;
    text: string;
    displayType: "static" | "scrolling";
    durationMinutes: number;
    scrollingAfterStaticMinutes: number;
  }

  const defaultDraft = (): DraftNews => ({
    id: Math.random().toString(36).substring(7),
    text: "",
    displayType: "scrolling",
    durationMinutes: 1440,
    scrollingAfterStaticMinutes: 1440
  });

  const [drafts, setDrafts] = useState<DraftNews[]>([defaultDraft()]);
  
  const [tickerSpeed, setTickerSpeed] = useState(25);
  const [tickerTitle, setTickerTitle] = useState("خبر عاجل");
  const [saving, setSaving] = useState(false);
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Tabs and Filters
  const [activeTab, setActiveTab] = useState<"add" | "active" | "archive">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "cancelled">("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "urgentNews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUrgentItems(items);
    });

    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", "urgentNews");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTickerSpeed(docSnap.data().speed || 25);
          setTickerTitle(docSnap.data().title || "خبر عاجل");
        }
      } catch (e) {}
    };
    loadSettings();

    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "urgentNews"), { speed: tickerSpeed, title: tickerTitle }, { merge: true });
      alert("تم حفظ إعدادات الشريط بنجاح");
    } catch (e) {
      alert("خطأ في الحفظ");
    }
  };

  const updateDraft = (id: string, updates: Partial<DraftNews>) => {
    setDrafts(drafts.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addDraft = () => {
    setDrafts([...drafts, defaultDraft()]);
  };

  const removeDraft = (id: string) => {
    if (drafts.length > 1) {
      setDrafts(drafts.filter(d => d.id !== id));
    }
  };

  const saveNews = async () => {
    const validDrafts = drafts.filter(d => d.text.trim());
    if (validDrafts.length === 0) return alert("يرجى إدخال نص الخبر العاجل");
    if (validDrafts.some(d => d.durationMinutes <= 0)) return alert("يرجى إدخال مدة صحيحة لجميع الأخبار");
    
    setSaving(true);
    try {
      const now = Date.now();
      
      const staticDrafts = validDrafts.filter(d => d.displayType === "static");
      if (staticDrafts.length > 0) {
        const currentStatics = urgentItems.filter(i => i.isActive !== false && i.id !== editingId && i.staticExpiresAt > now);
        for (const item of currentStatics) {
          const currentScrollEnd = item.scrollingExpiresAt || item.expiresAt || (now + 1440 * 60000);
          await updateDoc(doc(db, "urgentNews", item.id), { staticExpiresAt: 0, scrollingExpiresAt: currentScrollEnd });
        }
      }

      if (editingId && validDrafts.length === 1) {
        const draft = validDrafts[0];
        let newStaticExpiresAt = 0;
        let newScrollingExpiresAt = 0;
        
        if (draft.displayType === "static") {
          newStaticExpiresAt = now + draft.durationMinutes * 60000;
          newScrollingExpiresAt = newStaticExpiresAt + draft.scrollingAfterStaticMinutes * 60000;
        } else {
          newScrollingExpiresAt = now + draft.durationMinutes * 60000;
        }

        await updateDoc(doc(db, "urgentNews", editingId), {
          text: draft.text,
          staticExpiresAt: newStaticExpiresAt,
          scrollingExpiresAt: newScrollingExpiresAt,
          expiresAt: newScrollingExpiresAt,
          isActive: true
        });
        alert(`تم تعديل الخبر العاجل بنجاح`);
        setEditingId(null);
      } else {
        let createdCount = 0;
        for (let i = 0; i < validDrafts.length; i++) {
          const draft = validDrafts[i];
          let newStaticExpiresAt = 0;
          let newScrollingExpiresAt = 0;
          
          if (draft.displayType === "static") {
            newStaticExpiresAt = now + draft.durationMinutes * 60000;
            newScrollingExpiresAt = newStaticExpiresAt + draft.scrollingAfterStaticMinutes * 60000;
          } else {
            newScrollingExpiresAt = now + draft.durationMinutes * 60000;
          }

          // Offset createdAt slightly to preserve exact input order (newest goes first, so we might want to offset negatively so they sort naturally)
          await addDoc(collection(db, "urgentNews"), {
            text: draft.text,
            isActive: true,
            createdAt: now + i, 
            staticExpiresAt: newStaticExpiresAt,
            scrollingExpiresAt: newScrollingExpiresAt,
            expiresAt: newScrollingExpiresAt,
          });
          createdCount++;
        }
        alert(`تم إضافة ${createdCount} خبر عاجل بنجاح`);
      }
      
      setDrafts([defaultDraft()]);
      setActiveTab("active");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء النشر");
    } finally {
      setSaving(false);
    }
  };

  const toggleCancelItem = async (id: string, currentIsActive: boolean) => {
    try {
      if (currentIsActive) {
        await updateDoc(doc(db, "urgentNews", id), { isActive: false });
      } else {
        await updateDoc(doc(db, "urgentNews", id), { 
          isActive: true, 
          staticExpiresAt: 0,
          scrollingExpiresAt: Date.now() + 60 * 60000,
          expiresAt: Date.now() + 60 * 60000
        });
      }
    } catch (e) {
      alert("خطأ في تحديث حالة الخبر العاجل");
    }
  };
  
  const moveToMarquee = async (item: any) => {
    if (!confirm("هل أنت متأكد من إنهاء المدة الثابتة للخبر ونقله للشريط المتحرك فوراً؟")) return;
    try {
      const scrollEnd = item.scrollingExpiresAt || item.expiresAt || (Date.now() + 1440 * 60000);
      await updateDoc(doc(db, "urgentNews", item.id), { 
        staticExpiresAt: 0, 
        scrollingExpiresAt: Math.max(scrollEnd, Date.now() + 60 * 60000) 
      });
    } catch (e) {
      alert("خطأ في النقل");
    }
  };

  const makeStatic = async (item: any) => {
    const mins = prompt("أدخل مدة بقاء الخبر كخبر ثابت (بالدقائق):", "60");
    if (!mins) return;
    const duration = parseInt(mins);
    if (isNaN(duration) || duration <= 0) return;
    
    try {
      const now = Date.now();
      const currentStatics = urgentItems.filter(i => i.isActive !== false && i.id !== item.id && i.staticExpiresAt > now);
      for (const other of currentStatics) {
        const scrollEnd = other.scrollingExpiresAt || other.expiresAt || (now + 1440 * 60000);
        await updateDoc(doc(db, "urgentNews", other.id), { staticExpiresAt: 0, scrollingExpiresAt: scrollEnd });
      }
      
      const newStaticExp = now + duration * 60000;
      const currentScroll = item.scrollingExpiresAt || item.expiresAt || now;
      await updateDoc(doc(db, "urgentNews", item.id), { 
        staticExpiresAt: newStaticExp,
        scrollingExpiresAt: Math.max(currentScroll, newStaticExp + 60 * 60000)
      });
      alert("تم تحويل الخبر إلى ثابت بنجاح");
    } catch(e) {
      alert("خطأ في تحديث الخبر");
    }
  };

  const makeScrolling = async (item: any) => {
    const mins = prompt("أدخل مدة بقاء الخبر في الشريط المتحرك (بالدقائق):", "1440");
    if (!mins) return;
    const duration = parseInt(mins);
    if (isNaN(duration) || duration <= 0) return;
    
    try {
      await updateDoc(doc(db, "urgentNews", item.id), { 
        staticExpiresAt: 0,
        scrollingExpiresAt: Date.now() + duration * 60000,
        expiresAt: Date.now() + duration * 60000
      });
      alert("تم تحويل الخبر إلى متحرك بنجاح");
    } catch(e) {
      alert("خطأ في تحديث الخبر");
    }
  };

  const editItem = (item: any) => {
    setEditingId(item.id);
    const now = Date.now();
    const isStatic = item.staticExpiresAt > now;
    
    let durationMinutes = 1440;
    let scrollingAfterStaticMinutes = 1440;
    
    if (isStatic) {
      durationMinutes = Math.max(0, Math.ceil((item.staticExpiresAt - now) / 60000));
      const scrollEnd = item.scrollingExpiresAt || item.expiresAt || now;
      scrollingAfterStaticMinutes = Math.max(0, Math.ceil((scrollEnd - item.staticExpiresAt) / 60000));
    } else {
      const scrollEnd = item.scrollingExpiresAt || item.expiresAt || now;
      durationMinutes = Math.max(0, Math.ceil((scrollEnd - now) / 60000));
    }
    
    setDrafts([{
      id: "edit",
      text: item.text,
      displayType: isStatic ? "static" : "scrolling",
      durationMinutes,
      scrollingAfterStaticMinutes
    }]);
    
    setActiveTab("add");
  };

  const republishItem = (item: any, type?: "static" | "scrolling") => {
    setEditingId(null);
    setDrafts([{
      id: Math.random().toString(36).substring(7),
      text: item.text,
      displayType: type || "scrolling",
      durationMinutes: type === "static" ? 60 : 1440,
      scrollingAfterStaticMinutes: 1440
    }]);
    setActiveTab("add");
  };

  const cancelAllActiveNews = async () => {
    const activeDocs = urgentItems.filter(i => i.isActive !== false && (i.staticExpiresAt > currentTime || i.scrollingExpiresAt > currentTime));
    if (activeDocs.length === 0) return alert("لا توجد أخبار عاجلة نشطة حالياً لإلغائها.");
    if (!confirm(`هل أنت متأكد من إلغاء جميع الأخبار العاجلة النشطة (${activeDocs.length} خبر) فوراً؟`)) return;
    try {
      for (const item of activeDocs) {
        await updateDoc(doc(db, "urgentNews", item.id), { isActive: false });
      }
      alert("تم إلغاء عرض جميع الأخبار العاجلة");
    } catch (e) {
      alert("خطأ في إلغاء الأخبار");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الخبر نهائياً؟ لا يمكن التراجع.")) return;
    try {
      await deleteDoc(doc(db, "urgentNews", id));
    } catch (e) {
      alert("خطأ في الحذف");
    }
  };

  const normalizeItem = (item: any) => ({
    ...item,
    staticExpiresAt: item.staticExpiresAt !== undefined ? item.staticExpiresAt : (item.expiresAt || 0),
    scrollingExpiresAt: item.scrollingExpiresAt !== undefined ? item.scrollingExpiresAt : (item.expiresAt || 0),
  });

  const normalizedItems = urgentItems.map(normalizeItem);
  const activeDocs = normalizedItems.filter(i => i.isActive !== false && (i.staticExpiresAt > currentTime || i.scrollingExpiresAt > currentTime));
  const staticNews = activeDocs.find(i => i.staticExpiresAt > currentTime); 
  const scrollingDocs = activeDocs.filter(i => i.scrollingExpiresAt > currentTime && i.id !== staticNews?.id);
  
  const filteredArchive = normalizedItems.filter(item => {
    const isExpired = item.staticExpiresAt <= currentTime && item.scrollingExpiresAt <= currentTime;
    const isCancelled = item.isActive === false;
    const isActive = !isExpired && !isCancelled;
    
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                          (filterStatus === "active" && isActive) ||
                          (filterStatus === "expired" && isExpired && !isCancelled) ||
                          (filterStatus === "cancelled" && isCancelled);
                          
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto font-cairo">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center shadow-sm shrink-0">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">نظام الأخبار العاجلة</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">إدارة وتتبع الأخبار العاجلة وإعدادات العرض</p>
          </div>
        </div>
        {activeDocs.length > 0 && (
          <button
            onClick={cancelAllActiveNews}
            className="bg-white hover:bg-red-50 text-red-600 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-red-200 transition-all shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>إلغاء النشطة</span>
          </button>
        )}
      </div>

      {/* Master Tabs */}
      <div className="bg-gray-100/50 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-gray-200">
        <button 
          onClick={() => setActiveTab("active")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "active" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Activity className="w-4 h-4" /> النشطة الآن
        </button>
        <button 
          onClick={() => { setActiveTab("add"); setEditingId(null); setDrafts([defaultDraft()]); }}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "add" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Plus className="w-4 h-4" /> {editingId ? "تعديل الخبر" : "إضافة خبر"}
        </button>
        <button 
          onClick={() => setActiveTab("archive")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "archive" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Archive className="w-4 h-4" /> الأرشيف الشامل
        </button>
      </div>

      {/* Tab Content: ACTIVE NEWS */}
      {activeTab === "active" && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            الأخبار الجارية
          </h3>
          
          <div className="space-y-4">
            {activeDocs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">لا توجد أخبار نشطة</h4>
                <p className="text-gray-500 font-bold mb-6">لم يتم إضافة أي خبر عاجل ليظهر للمستخدمين حالياً.</p>
                <button onClick={() => setActiveTab("add")} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all">
                  إضافة خبر جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeDocs.map((item) => {
                  const isStatic = staticNews?.id === item.id;
                  const isScrolling = !isStatic && item.scrollingExpiresAt > currentTime;
                  const remainingStatic = Math.max(0, Math.ceil((item.staticExpiresAt - currentTime) / 60000));
                  const remainingScrolling = Math.max(0, Math.ceil((item.scrollingExpiresAt - currentTime) / 60000));
                  
                  return (
                    <div key={item.id} className={`bg-white p-5 rounded-2xl border ${isStatic ? 'border-red-300 shadow-md ring-2 ring-red-50' : 'border-gray-200 shadow-sm'} transition-all`}>
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        <div className={`p-3 rounded-xl shrink-0 flex flex-col items-center justify-center min-w-[80px] ${isStatic ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {isStatic ? <AlertTriangle className="w-7 h-7 mb-1" /> : <Activity className="w-7 h-7 mb-1" />}
                          <span className="text-[10px] font-black uppercase tracking-wider">{isStatic ? 'ثابت' : 'متحرك'}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {isStatic && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                خبر ثابت حالياً (متبقي {remainingStatic} دقيقة)
                              </span>
                            )}
                            {isScrolling && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                في الشريط المتحرك (متبقي {remainingScrolling} دقيقة)
                              </span>
                            )}
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                              نشر: {new Date(item.createdAt).toLocaleTimeString('ar-YE', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="font-bold text-base md:text-lg text-gray-900 leading-relaxed mt-3">
                            {item.text}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <div className="flex flex-row gap-2">
                            {isStatic ? (
                              <button onClick={() => moveToMarquee(item)} className="flex-1 justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                                <ArrowLeftRight className="w-4 h-4" /> نقل للمتحرك فوراً
                              </button>
                            ) : (
                              <button onClick={() => makeStatic(item)} className="flex-1 justify-center bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                                <AlertTriangle className="w-4 h-4" /> جعله ثابتاً
                              </button>
                            )}
                            {!isScrolling && (
                              <button onClick={() => makeScrolling(item)} className="flex-1 justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                                <Activity className="w-4 h-4" /> جعله متحركاً
                              </button>
                            )}
                          </div>
                          <div className="flex flex-row gap-2">
                            <button onClick={() => editItem(item)} className="flex-1 justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                              <Edit2 className="w-4 h-4" /> تعديل
                            </button>
                            <button onClick={() => toggleCancelItem(item.id, true)} className="flex-1 justify-center bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                              <XCircle className="w-4 h-4" /> إيقاف
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: ADD & SETTINGS */}
      {activeTab === "add" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* News Entry Form */}
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-red-600" />
                  {editingId ? "تعديل الخبر العاجل" : "إنشاء أخبار عاجلة"}
                </h3>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setDrafts([defaultDraft()]); }} className="text-gray-500 hover:text-red-600 text-sm font-bold flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <X className="w-4 h-4" /> إلغاء التعديل
                  </button>
                )}
                {!editingId && (
                  <button onClick={addDraft} className="text-red-600 bg-red-50 hover:bg-red-100 text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> إضافة خبر جديد ضمن الدفعة
                  </button>
                )}
              </div>
              
              <div className="space-y-8">
                {drafts.map((draft, idx) => (
                  <div key={draft.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-5 relative">
                    {drafts.length > 1 && (
                      <button onClick={() => removeDraft(draft.id)} className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center">{idx + 1}</span>
                      إعدادات الخبر
                    </h4>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">النص الكامل للخبر:</label>
                      <textarea
                        className="w-full p-4 text-base font-bold bg-white border border-gray-200 rounded-xl h-28 focus:ring-2 focus:ring-red-500 transition-all resize-none shadow-sm"
                        placeholder="اكتب هنا الخبر الذي سيظهر للمستخدمين..."
                        value={draft.text}
                        onChange={(e) => updateDraft(draft.id, { text: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">طريقة العرض:</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 cursor-pointer p-3 rounded-xl border flex items-center gap-2 transition-all ${draft.displayType === 'static' ? 'bg-red-50 border-red-300 ring-1 ring-red-200' : 'bg-white border-gray-200'}`}>
                          <input 
                            type="radio" 
                            checked={draft.displayType === 'static'}
                            onChange={() => updateDraft(draft.id, { displayType: 'static', durationMinutes: 60 })}
                            className="w-4 h-4 text-red-600"
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">خبر ثابت</div>
                          </div>
                        </label>
                        <label className={`flex-1 cursor-pointer p-3 rounded-xl border flex items-center gap-2 transition-all ${draft.displayType === 'scrolling' ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-gray-200'}`}>
                          <input 
                            type="radio" 
                            checked={draft.displayType === 'scrolling'}
                            onChange={() => updateDraft(draft.id, { displayType: 'scrolling', durationMinutes: 1440 })}
                            className="w-4 h-4 text-amber-600"
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">خبر متحرك</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" /> 
                        {draft.displayType === 'static' ? 'مدة العرض كخبر ثابت (بالدقائق):' : 'مدة العرض في الشريط المتحرك (بالدقائق):'}
                      </label>
                      <input 
                        type="number"
                        className="w-full p-3 text-base font-bold bg-white border border-gray-200 rounded-xl shadow-sm"
                        value={draft.durationMinutes}
                        onChange={(e) => updateDraft(draft.id, { durationMinutes: Number(e.target.value) })}
                        min={1}
                      />
                    </div>

                    {draft.displayType === 'static' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" /> 
                          مدة العرض في الشريط المتحرك لاحقاً (بالدقائق):
                        </label>
                        <input 
                          type="number"
                          className="w-full p-3 text-base font-bold bg-white border border-gray-200 rounded-xl shadow-sm"
                          value={draft.scrollingAfterStaticMinutes}
                          onChange={(e) => updateDraft(draft.id, { scrollingAfterStaticMinutes: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                    )}
                    
                    {!editingId && (
                      <div className="pt-2">
                        <button onClick={addDraft} className="w-full text-center py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                          <Plus className="w-4 h-4" /> إضافة خبر جديد
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={saveNews}
                  disabled={saving || drafts.every(d => !d.text.trim())}
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  {editingId ? "حفظ التعديلات" : "نشر الأخبار الآن"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Settings & Preview */}
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-500" />
                  إعدادات المظهر والشريط المتحرك
                </h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">شارة الشريط المتحرك:</label>
                  <input 
                    type="text"
                    className="w-full p-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-2xl shadow-inner"
                    value={tickerTitle}
                    onChange={(e) => setTickerTitle(e.target.value)}
                    placeholder="مثال: خبر عاجل، بيان هام..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سرعة الشريط المتحرك (أصغر = أسرع):</label>
                  <input 
                    type="number"
                    className="w-full p-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-2xl shadow-inner"
                    value={tickerSpeed}
                    onChange={(e) => setTickerSpeed(Number(e.target.value))}
                    min={5}
                    max={120}
                  />
                </div>
                
                <button
                  onClick={saveSettings}
                  className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> حفظ الإعدادات
                </button>
              </div>
            </div>

            {/* Live Preview snippet */}
            {drafts.some(d => d.text.trim() && d.displayType === 'static') && (
              <div className="border border-red-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-red-50 px-4 py-3 text-sm font-black text-red-600 border-b border-red-200 flex items-center justify-between">
                  <span>معاينة الخبر الثابت</span>
                  <span className="animate-pulse">🔴</span>
                </div>
                <div className="bg-gray-50 p-4 space-y-2">
                  {[...drafts].filter(d => d.text.trim() && d.displayType === 'static').reverse().map((draft, i) => (
                    <div key={draft.id} className={`w-full bg-red-900 rounded-lg py-1.5 px-3 flex items-start shadow-inner`}>
                      <span className={`shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 bg-white text-red-700 font-black text-[10px] sm:text-xs rounded shadow-sm`}>
                        عاجل
                      </span>
                      <p className="text-white font-bold text-xs sm:text-sm mr-2 break-words leading-relaxed w-full">
                        {draft.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drafts.some(d => d.text.trim() && d.displayType === 'scrolling') && (
              <div className="border border-amber-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-amber-50 px-4 py-3 text-sm font-black text-amber-600 border-b border-amber-200 flex items-center justify-between">
                  <span>معاينة الشريط المتحرك (يظهر من الأحدث إلى الأقدم)</span>
                  <span className="animate-pulse">🔴</span>
                </div>
                <div className="bg-gray-50 p-4 space-y-2">
                  {[...drafts].filter(d => d.text.trim() && d.displayType === 'scrolling').reverse().map((draft, i) => (
                    <div key={draft.id} className="w-full bg-gradient-to-r from-red-800 via-red-700 to-red-900 rounded-lg py-2 px-3 flex items-center shadow-inner overflow-hidden relative">
                      <p className="text-white font-bold text-xs sm:text-sm break-words leading-relaxed w-full whitespace-nowrap overflow-hidden text-ellipsis z-0" dir="rtl">
                        {draft.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: ARCHIVE */}
      {activeTab === "archive" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="ابحث في أرشيف الأخبار العاجلة..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="w-full sm:w-auto py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-700 focus:ring-2 focus:ring-red-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="all">جميع الحالات</option>
              <option value="active">النشطة حالياً</option>
              <option value="expired">منتهية الصلاحية</option>
              <option value="cancelled">ملغاة يدويًا</option>
            </select>
          </div>
          
          <div className="space-y-3">
            {filteredArchive.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">الأرشيف فارغ أو لا توجد نتائج</h4>
                <p className="text-gray-500 font-bold mb-6">جرب تغيير كلمات البحث أو الفلتر.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArchive.map((item) => {
                  const isExpired = item.staticExpiresAt <= currentTime && item.scrollingExpiresAt <= currentTime;
                  const isCancelled = item.isActive === false;
                  const isActive = !isExpired && !isCancelled;
                  const isStatic = isActive && item.staticExpiresAt > currentTime;

                  return (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {isCancelled ? (
                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> تم الإيقاف
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-black text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> انتهت المدة
                            </span>
                          ) : isStatic ? (
                            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> خبر ثابت
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> خبر متحرك
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-gray-700 leading-relaxed mb-4 line-clamp-3">
                          {item.text}
                        </p>
                      </div>
                      
                      {/* Archive actions - direct republish as static or scrolling */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                        <button onClick={() => republishItem(item, 'static')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <AlertTriangle className="w-4 h-4" /> كخبر ثابت
                        </button>
                        <button onClick={() => republishItem(item, 'scrolling')} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <Activity className="w-4 h-4" /> كخبر متحرك
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="حذف نهائي">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
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
  const [cat, setCat] = useState("");
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
          setCat(draft.cat || "");
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
  const [savedCats, setSavedCats] = useState<string[]>([]);
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
        const data = catDoc.data();
        let list: string[] = [];
        if (data.items) {
          list = data.items.map((i: any) => typeof i === "string" ? i : i.name);
        } else if (data.list) {
          list = data.list;
        }
        setSavedCats(list);
        localStorage.setItem("admin_saved_cats", JSON.stringify(list));
      } else {
        setSavedCats([]);
        localStorage.removeItem("admin_saved_cats");
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
    setCat("");
    setCustomCat("");
    setIsBreaking(false);
    setIsPinned(false);
    setLiveUpdatesText("");
    setViews(0);
    setTags("");
    setVideoUrl("");
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
    setTags(item.tags ? item.tags.join(", ") : "");
    setVideoUrl(item.videoUrl || "");
    if (item.additionalImages) {
      setAdditionalImagesText(item.additionalImages.join("\n"));
    } else {
      setAdditionalImagesText("");
    }

    if (savedCats.includes(item.category || "")) {
      setCat(item.category || "");
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
        await setDoc(doc(db, "newsMetadata", "categories"), {
          list: newList,
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

        // Send push notification to all subscribers
        try {
          await PushNotificationService.triggerPushNotification(
            "خبر جديد 📰",
            payload.title || "تحديث جديد في الأخبار",
            `/?newsId=${savedId}`
          );
        } catch (pushErr) {
          console.error("Failed to send news push notification:", pushErr);
        }
      }

      setLastSavedId(savedId);
      localStorage.removeItem("news_draft");
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        setNewsMode("list");
        resetForm();
      }, 1500);
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
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-emerald-500/20"
      >
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-2">
          {editingId ? "تم تعديل الخبر بنجاح" : "تم نشر الخبر بنجاح"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold flex items-center justify-center gap-2 mt-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          جاري الانتقال إلى لوحة الإدارة...
        </p>
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
                  <Image className="w-5 h-5 text-red-600" />
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
                    <Plus className="w-4 h-4 text-red-600" />
                    <span>إضافة صورة جديدة لمعرض الصور</span>
                  </button>
                </div>
              </div>

              {/* Classification & Meta */}
              <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-600" />
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

function AdminLive() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"tv" | "radio">("tv");
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
        description: description.trim() || "",
        type,
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
      setDescription("");
      setType("tv");
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
    setDescription(stream.description || "");
    setType(stream.type || "tv");
    setActive(stream.isActive ?? true);
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
        <div className="flex items-center gap-2 my-2.5 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center shadow-sm shrink-0">
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">
              {editingId ? "تعديل قناة البث المباشر" : "إضافة بث مباشر جديد"}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">إدارة قنوات البث التلفزيوني والإذاعي الحي</p>
          </div>
        </div>
        <input
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
          placeholder="اسم القناة أو الإذاعة"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
          placeholder="رابط البث المباشر"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-[10px] text-gray-400 -mt-2 pr-1">
          يمكنك وضع رابط يوتيوب مباشر أو رابط تضمين (Embed) أو رابط M3U8.
        </p>
        <input
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
          placeholder="صورة أو شعار القناة/الإذاعة (رابط URL)"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
        />
        <textarea
          rows={2}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm font-cairo"
          placeholder="وصف اختياري للقناة أو الإذاعة (يظهر للمستخدم عند تحديد القناة)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-1">
            <input
              type="radio"
              name="streamType"
              value="tv"
              checked={type === "tv"}
              onChange={() => setType("tv")}
              className="w-4 h-4 accent-red-600"
            />
            <span className="font-bold text-gray-800 dark:text-gray-200">تلفزيون (TV)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-1">
            <input
              type="radio"
              name="streamType"
              value="radio"
              checked={type === "radio"}
              onChange={() => setType("radio")}
              className="w-4 h-4 accent-red-600"
            />
            <span className="font-bold text-gray-800 dark:text-gray-200">إذاعة (Radio)</span>
          </label>
        </div>

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
                  {stream.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 font-cairo">
                      {stream.description}
                    </p>
                  )}
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

// AdminLeader is imported from components/AdminLeader.tsx

import {
  QuranSeries,
  QuranLesson,
  QuranSyllabus,
  QuranExcerpt,
} from "../../types";

function AdminQuran() {
  const [subTab, setSubTab] = useState<"syllabuses" | "series" | "lessons" | "excerpts">("syllabuses");
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
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">إعداد مقررات هدي القرآن</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">التحكم بمقررات وسلاسل ودروس هدي القرآن الكريم</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shrink-0" dir="rtl">
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

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" dir="rtl">
        <h3 className="font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5 text-red-600" /> : <PlusCircle className="w-5 h-5 text-red-600" />}
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
                  setTitle(s.title || "");
                  setDesc(s.description || "");
                  setOrder(s.order ?? 0);
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
        const lessons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranLesson));
        setList(sortQuranLessons(lessons));
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
      if (!editingId) { // Only send push on new lesson
        sendFCMNotification(
          "هدى القرآن | " + data.title,
          "تمت إضافة درس جديد",
          "quran",
          id,
          ""
        );
      }
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
          {editingId ? <Edit className="w-5 h-5 text-red-600" /> : <PlusCircle className="w-5 h-5 text-red-600" />}
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
                    setSeriesId(l.seriesId || "");
                    setTitle(l.title || "");
                    setContent(l.content || "");
                    setOrder(l.order ?? 0);
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
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [durationVal, setDurationVal] = useState<string>("1");
  const [durationType, setDurationType] = useState<"weeks" | "months">("weeks");
  const [eventId, setEventId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessonSearch, setLessonSearch] = useState("");

  // Helper to calculate end date from duration
  const applyDuration = (val: string, type: "weeks" | "months", baseStart?: string) => {
    const num = parseInt(val) || 1;
    const start = baseStart ? new Date(baseStart) : new Date(startDate || Date.now());
    const baseTime = isNaN(start.getTime()) ? Date.now() : start.getTime();
    const durationMs = type === "weeks" 
      ? num * 7 * 24 * 60 * 60 * 1000 
      : num * 30 * 24 * 60 * 60 * 1000;
    const targetDate = new Date(baseTime + durationMs);
    setEndDate(targetDate.toISOString().split("T")[0]);
  };

  const filteredLessons = React.useMemo(() => {
    const q = lessonSearch.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => {
      const s = series.find(x => x.id === l.seriesId);
      const seriesTitle = s ? s.title.toLowerCase() : "";
      return l.title.toLowerCase().includes(q) || seriesTitle.includes(q) || l.id === lessonId;
    });
  }, [lessons, series, lessonSearch, lessonId]);

  useEffect(() => {
    // 1. Load built-in platform Quran lessons and series
    loadQuranMetadata()
      .then((data) => {
        if (data) {
          if (data.series && data.series.length > 0) {
            setSeries((prev) => {
              const map = new Map<string, QuranSeries>();
              data.series.forEach((s: QuranSeries) => map.set(s.id, s));
              prev.forEach((s) => map.set(s.id, s));
              return Array.from(map.values());
            });
          }
          if (data.lessons && data.lessons.length > 0) {
            setLessons((prev) => {
              const map = new Map<string, QuranLesson>();
              data.lessons.forEach((l: QuranLesson) => map.set(l.id, l));
              prev.forEach((l) => map.set(l.id, l));
              return Array.from(map.values());
            });
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load local Quran metadata for syllabus admin:", err);
      });

    // 2. Listen to Firestore series & lessons if any extra exist
    const unsubSeries = onSnapshot(
      query(collection(db, "quran_series"), orderBy("order", "asc")),
      (snap) => {
        if (!snap.empty) {
          const fsSeries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranSeries));
          setSeries((prev) => {
            const map = new Map<string, QuranSeries>();
            prev.forEach(s => map.set(s.id, s));
            fsSeries.forEach(s => map.set(s.id, s));
            return Array.from(map.values());
          });
        }
      }
    );

    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons"), orderBy("order", "asc")),
      (snap) => {
        if (!snap.empty) {
          const fsLessons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranLesson));
          setLessons((prev) => {
            const map = new Map<string, QuranLesson>();
            prev.forEach(l => map.set(l.id, l));
            fsLessons.forEach(l => map.set(l.id, l));
            return Array.from(map.values());
          });
        }
      }
    );

    // 3. Preload from local cache and listen to syllabuses collection
    const cachedSyllabuses = localStorage.getItem("taiz_quran_syllabuses_cache");
    if (cachedSyllabuses) {
      try {
        const parsed = JSON.parse(cachedSyllabuses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
          setLoading(false);
        }
      } catch (e) {}
    }

    const unsubSyllabuses = onSnapshot(
      query(collection(db, "quran_syllabuses"), orderBy("createdAt", "desc")),
      (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuranSyllabus));
        setList(items);
        setLoading(false);
        SyncService.setCache("quran_syllabuses", items);
      }
    );

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
    if (!lessonId) {
      return alert("الرجاء اختيار الدرس من القائمة");
    }

    const selectedLesson = lessons.find(l => l.id === lessonId);
    if (!selectedLesson) {
      return alert("الدرس المحدد غير موجود في بيانات المنصة");
    }

    const selectedSeries = series.find(s => s.id === selectedLesson.seriesId);
    const seriesTitle = selectedSeries ? selectedSeries.title : (selectedLesson as any).seriesTitle || "هدي القرآن الكريم";
    const seriesId = selectedLesson.seriesId || "";
    const lessonTitle = selectedLesson.title;

    // Calculate dates & timestamps
    const startMs = startDate ? new Date(startDate).getTime() : Date.now();
    let endMs: number;
    if (endDate) {
      const d = new Date(endDate);
      d.setHours(23, 59, 59, 999);
      endMs = d.getTime();
    } else {
      const num = parseInt(durationVal) || 1;
      const durationMs = durationType === 'weeks' 
        ? num * 7 * 24 * 60 * 60 * 1000 
        : num * 30 * 24 * 60 * 60 * 1000;
      endMs = startMs + durationMs;
    }

    const finalStartDate = startDate || new Date(startMs).toISOString().split("T")[0];
    const finalEndDate = endDate || new Date(endMs).toISOString().split("T")[0];

    setSaving(true);
    try {
      const id = editingId || Date.now().toString();
      // Store ONLY the syllabus metadata and the platform lesson ID reference in Firebase
      const payload = {
        lessonId: selectedLesson.id, // المرجع الأصلي للدرس المخزن في المنصة
        lessonTitle: lessonTitle, // عنوان الدرس
        seriesId: seriesId, // معرف السلسلة
        seriesTitle: seriesTitle, // اسم السلسلة
        startDate: finalStartDate, // تاريخ بدء المقرر
        endDate: finalEndDate, // تاريخ انتهاء المقرر
        expiresAt: endMs, // طابع زمني لانتهاء المقرر
        durationVal: parseInt(durationVal) || 1,
        durationType: durationType,
        eventId: eventId || null,
        createdAt: editingId ? undefined : Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, "quran_syllabuses", id), payload, { merge: true });
      await delIDB('quran_data_cache');

      alert("تم اعتماد المقرر بنجاح وربطه بالدرس المخزن مسبقًا في المنصة");
      setEditingId(null);
      setLessonId("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setDurationVal("1");
      setDurationType("weeks");
      setEventId("");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ المقرر");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (confirm("تأكيد حذف المقرر الدراسي؟")) {
      try {
        await deleteDoc(doc(db, "quran_syllabuses", id));
        await SyncService.trackDeletion("quran_syllabuses", id);
        await delIDB('quran_data_cache');
        alert("تم الحذف بنجاح");
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold font-cairo">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base sm:text-lg font-cairo mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>{editingId ? "تعديل مقرر دراسي" : "اعتماد مقرر دراسي جديد"}</span>
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 font-cairo pr-1">
            البحث في دروس المنصة ({lessons.length} درس متاح)
          </label>
          <input
            type="text"
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold placeholder-gray-400 dark:text-white mb-2 outline-none focus:ring-2 focus:ring-emerald-500/50 font-cairo"
            value={lessonSearch}
            onChange={(e) => setLessonSearch(e.target.value)}
            placeholder="اكتب اسم الدرس أو السلسلة لتصفية القائمة..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 font-cairo pr-1">
            الدرس المطلوب اعتماده كمقرر <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold dark:text-white font-cairo focus:ring-2 focus:ring-emerald-500/50 outline-none"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">-- اختر الدرس المراد اعتماده --</option>
            {filteredLessons.map((l) => {
              const s = series.find(x => x.id === l.seriesId);
              return (
                <option key={l.id} value={l.id}>
                  {s ? `[${s.title}] ` : ""}{l.title}
                </option>
              );
            })}
          </select>
          {lessonId && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-cairo mt-1">
              ✓ سيتم ربط المقرر مباشرة بالدرس الأصلي المخزن في المنصة (المعرف: {lessonId})
            </p>
          )}
        </div>

        {/* Date Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 font-cairo pr-1">
              تاريخ بدء المقرر
            </label>
            <input
              type="date"
              className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white font-bold font-cairo outline-none focus:ring-2 focus:ring-emerald-500/50"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (durationVal) {
                  applyDuration(durationVal, durationType, e.target.value);
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 font-cairo pr-1">
              تاريخ انتهاء المقرر
            </label>
            <input
              type="date"
              className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white font-bold font-cairo outline-none focus:ring-2 focus:ring-emerald-500/50"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Quick duration helpers */}
        <div className="bg-white dark:bg-gray-900/70 p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 font-cairo block">
            أو حدد مدة تلقائية لانتهاء المقرر:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setDurationVal("1");
                setDurationType("weeks");
                applyDuration("1", "weeks");
              }}
              className="p-2 text-xs font-bold font-cairo rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition text-slate-700 dark:text-slate-300"
            >
              أسبوع واحد
            </button>
            <button
              type="button"
              onClick={() => {
                setDurationVal("2");
                setDurationType("weeks");
                applyDuration("2", "weeks");
              }}
              className="p-2 text-xs font-bold font-cairo rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition text-slate-700 dark:text-slate-300"
            >
              أسبوعان
            </button>
            <button
              type="button"
              onClick={() => {
                setDurationVal("1");
                setDurationType("months");
                applyDuration("1", "months");
              }}
              className="p-2 text-xs font-bold font-cairo rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition text-slate-700 dark:text-slate-300"
            >
              شهر كامل
            </button>
            <button
              type="button"
              onClick={() => {
                setDurationVal("3");
                setDurationType("months");
                applyDuration("3", "months");
              }}
              className="p-2 text-xs font-bold font-cairo rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition text-slate-700 dark:text-slate-300"
            >
              3 أشهر
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold font-cairo transition-all shadow-sm active:scale-95"
          >
            {saving ? "جاري الاعتماد..." : editingId ? "تحديث المقرر" : "اعتماد المقرر"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setLessonId("");
                setStartDate(new Date().toISOString().split("T")[0]);
                setEndDate("");
                setDurationVal("1");
                setDurationType("weeks");
                setEventId("");
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2.5 rounded-xl font-bold font-cairo transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 font-cairo">
          المقررات المعتمدة الحالية ({list.length}):
        </h4>
        {list.map((s) => {
          const isExpired = s.expiresAt ? Date.now() > s.expiresAt : false;
          
          return (
            <div
              key={s.id}
              className={`flex justify-between items-center p-4 bg-white dark:bg-gray-900/50 border rounded-2xl hover:border-emerald-500/40 transition-colors group ${
                isExpired ? "border-red-200 bg-red-50/10" : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white font-cairo text-sm sm:text-base">
                    {s.lessonTitle || "درس غير معروف"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-cairo bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {s.seriesTitle || "هدي القرآن الكريم"}
                  </span>
                  {isExpired ? (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-cairo">
                      منتهي الصلاحية
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-cairo">
                      ساري
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3 font-cairo">
                  {s.startDate && (
                    <span>تاريخ البدء: {typeof s.startDate === 'number' ? new Date(s.startDate).toLocaleDateString("ar-EG") : s.startDate}</span>
                  )}
                  {s.endDate ? (
                    <span>تاريخ الانتهاء: {typeof s.endDate === 'number' ? new Date(s.endDate).toLocaleDateString("ar-EG") : s.endDate}</span>
                  ) : s.expiresAt ? (
                    <span>ينتهي في: {new Date(s.expiresAt).toLocaleDateString("ar-YE")}</span>
                  ) : null}
                  <span className="text-gray-400 font-mono text-[10px]">ID: {s.lessonId}</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => {
                    setEditingId(s.id);
                    setLessonId(s.lessonId || "");
                    if (s.startDate) {
                      setStartDate(typeof s.startDate === 'number' ? new Date(s.startDate).toISOString().split('T')[0] : s.startDate);
                    }
                    if (s.endDate) {
                      setEndDate(typeof s.endDate === 'number' ? new Date(s.endDate).toISOString().split('T')[0] : s.endDate);
                    } else if (s.expiresAt) {
                      setEndDate(new Date(s.expiresAt).toISOString().split('T')[0]);
                    }
                    setDurationVal(String(s.durationVal || 1));
                    setDurationType(s.durationType || "weeks");
                    setEventId(s.eventId || "");
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                  title="تعديل المقرر"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => del(s.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  title="حذف المقرر"
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


function AdminEventsContent() {
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
        
        // Send push notification to all subscribers
        try {
          await PushNotificationService.triggerPushNotification(
            "مناسبة جديدة في التقويم 📅",
            title,
            "/events"
          );
        } catch (pushErr) {
          console.error("Failed to send event push notification:", pushErr);
        }
        
        alert("تمت الإضافة بنجاح");
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
    setTitle(e.title || "");
    setDescription(e.description || "");
    setDayName(e.dayName || "");
    setHijriDate(e.hijriDate || "");
    setGregorianDate(e.gregorianDate || "");
    setCategory(e.category || "all");
    setTimestamp(e.timestamp ? new Date(e.timestamp).toISOString().split("T")[0] + "T00:00" : "");
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
              <div className="flex items-center gap-2">
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


function AdminActivitiesContent() {
  const [actTitle, setActTitle] = useState("");
  const [actType, setActType] = useState("");
  const [actDate, setActDate] = useState("");
  const [actDayName, setActDayName] = useState("");
  const [actHijriDate, setActHijriDate] = useState("");
  const [actGregorianDate, setActGregorianDate] = useState("");
  const [actStartTime, setActStartTime] = useState("");
  const [actEndTime, setActEndTime] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actImageUrl, setActImageUrl] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [actEditingId, setActEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const cached = await SyncService.getCache<any>("activities");
        if (cached && active) setActivities(cached);
      } catch (e) {}
    };
    load();
    const unsub = SyncService.syncCollection<any>(
      "activities",
      (data) => {
        if (!active) return;
        setActivities(data);
      },
      { orderByField: "startDate", orderDirection: "asc" }
    );
    return () => {
      active = false;
      unsub.then((u) => u());
    };
  }, []);

  const handleDateChange = (val: string) => {
    setActDate(val);
    if (!val) return;
    const newDate = new Date(val);
    if (!isNaN(newDate.getTime())) {
      setActDayName(new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(newDate));
      setActHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(newDate) + " هـ");
      setActGregorianDate(new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(newDate));
    }
  };

  const save = async () => {
    if (!actTitle || !actType || !actDate) return alert("يرجى إدخال عنوان ونوع الفعالية والتاريخ");
    
    if (actStartTime && actEndTime) {
      if (actEndTime < actStartTime) {
        return alert("وقت الانتهاء لا يمكن أن يسبق وقت البدء");
      }
    }

    setSaving(true);
    try {
      let startDateMs = new Date(actDate).getTime();
      if (actStartTime) {
        startDateMs = new Date(`${actDate}T${actStartTime}`).getTime();
      }

      const data = {
        title: actTitle,
        type: actType,
        dayName: actDayName,
        hijriDate: actHijriDate,
        gregorianDate: actGregorianDate,
        startTime: actStartTime || null,
        endTime: actEndTime || null,
        description: actDesc,
        imageUrl: actImageUrl,
        startDate: startDateMs,
        updatedAt: Date.now(),
      };
      
      if (actEditingId) {
        await updateDoc(doc(db, "activities", actEditingId), data);
        alert("تم تعديل الفعالية بنجاح");
      } else {
        const docRef = await addDoc(collection(db, "activities"), { ...data, createdAt: Date.now() });
        sendFCMNotification(
          "نشاط جديد | " + data.title,
          "تابع أحدث الأنشطة والفعاليات",
          "activity",
          docRef.id,
          data.imageUrl
        );
        alert("تم إضافة الفعالية بنجاح");
      }
      
      setActTitle("");
      setActType("");
      setActDate("");
      setActDayName("");
      setActHijriDate("");
      setActGregorianDate("");
      setActStartTime("");
      setActEndTime("");
      setActDesc("");
      setActImageUrl("");
      setActEditingId(null);
    } catch (e) {
      alert("خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفعالية؟")) return;
    try {
      await deleteDoc(doc(db, "activities", id));
      alert("تم حذف الفعالية");
    } catch (e) {
      alert("خطأ أثناء الحذف");
    }
  };

  const edit = (act: any) => {
    setActEditingId(act.id);
    setActTitle(act.title || "");
    setActType(act.type || "");
    if (act.startDate) {
      const d = new Date(act.startDate);
      setActDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      setActDate("");
    }
    setActDayName(act.dayName || "");
    setActHijriDate(act.hijriDate || "");
    setActGregorianDate(act.gregorianDate || "");
    setActStartTime(act.startTime || "");
    setActEndTime(act.endTime || "");
    setActDesc(act.description || "");
    setActImageUrl(act.imageUrl || "");
  };

  const baseTypes = ["مسيرة", "وقفة", "أمسية", "مؤتمر", "ندوة", "مهرجان"];
  const uniqueTypes = Array.from(new Set([...baseTypes, ...activities.map(a => a.type).filter(Boolean)]));

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
          {actEditingId ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
        </h3>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">عنوان الفعالية <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
            placeholder="اكتب عنوان الفعالية هنا..."
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">نوع الفعالية <span className="text-red-500">*</span></label>
            <input
              type="text"
              list="activity-types"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              placeholder="مثال: مسيرة، وقفة، مؤتمر..."
              value={actType}
              onChange={(e) => setActType(e.target.value)}
              required
            />
            <datalist id="activity-types">
              {uniqueTypes.map((t, idx) => (
                <option key={idx} value={t} />
              ))}
            </datalist>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الفعالية <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">اليوم</label>
            <input
              type="text"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actDayName}
              onChange={(e) => setActDayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">التاريخ الهجري</label>
            <input
              type="text"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actHijriDate}
              onChange={(e) => setActHijriDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">التاريخ الميلادي</label>
            <input
              type="text"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actGregorianDate}
              onChange={(e) => setActGregorianDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">وقت البدء (اختياري)</label>
            <input
              type="time"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actStartTime}
              onChange={(e) => setActStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">وقت الانتهاء (اختياري)</label>
            <input
              type="time"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actEndTime}
              onChange={(e) => setActEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">وصف الفعالية (اختياري)</label>
          <textarea
            className="w-full p-5 text-lg font-medium leading-relaxed bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-2xl h-64 focus:ring-2 focus:ring-blue-500 transition-all resize-y placeholder:text-gray-300"
            placeholder="اكتب وصفاً تفصيلياً للفعالية هنا..."
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
          />
        </div>

        <div>
          <ImageUpload
            label="صورة الفعالية (اختياري)"
            placeholder="اضغط لرفع صورة رئيسية للفعالية"
            value={actImageUrl}
            onChange={(url) => setActImageUrl(url)}
            onRemove={() => setActImageUrl("")}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-blue-600/20"
          >
            {saving ? "جاري الحفظ..." : actEditingId ? "حفظ التعديلات" : "إضافة فعالية"}
          </button>
          {actEditingId && (
            <button
              onClick={() => {
                setActEditingId(null);
                setActTitle("");
                setActType("");
                setActDate("");
                setActDayName("");
                setActHijriDate("");
                setActGregorianDate("");
                setActStartTime("");
                setActEndTime("");
                setActDesc("");
                setActImageUrl("");
              }}
              className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-4">
            <div className="flex items-center gap-4 flex-1">
              {act.imageUrl && (
                <img src={act.imageUrl} alt={act.title} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{act.title} <span className="text-sm font-normal text-gray-500">({act.type})</span></h4>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2 font-bold">
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-lg">{act.dayName}</span>
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-lg">{act.hijriDate}</span>
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-lg">{act.gregorianDate}</span>
                  {act.startTime && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-lg">بدء: {act.startTime}</span>}
                  {act.endTime && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 px-2 py-1 rounded-lg">انتهاء: {act.endTime}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => edit(act)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              >
                تعديل
              </button>
              <button
                onClick={() => remove(act.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            لا توجد فعاليات مضافة حالياً.
          </p>
        )}
      </div>
    </div>
  );
}
function AdminEvents() {
  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "activities">("calendar");

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center my-2.5">
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">قسم المناسبات والفعاليات</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">إدارة المناسبات والتقويم السنوي والفعاليات والأنشطة المرتبطة بها</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl flex gap-1 w-max">
        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === "calendar" 
              ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          إدارة التقويم (المناسبات)
        </button>
        <button
          onClick={() => setActiveSubTab("activities")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === "activities" 
              ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          إدارة الفعاليات
        </button>
      </div>

      {activeSubTab === "calendar" ? <AdminEventsContent /> : <AdminActivitiesContent />}
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
    { id: "articles", label: "المقالات" },
    { id: "urgent", label: "الأخبار العاجلة" },
    { id: "videos", label: "الفيديوهات" },
    { id: "live", label: "البث المباشر" },
    { id: "leader", label: "السيد القائد" },
    { id: "quran", label: "هدى القرآن" },
    { id: "events", label: "تقويم المناسبات" },
    { id: "social", label: "روابط تابعنا" },
    { id: "categories", label: "إدارة التصنيفات" },
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
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-4">
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">إدارة الصلاحيات</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">إدارة وتخصيص صلاحيات ورتب الوصول للمنصة والمشرفين</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-text-muted group-focus-within:text-red-600 transition-colors" />
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
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
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

  const [footerImageUrl, setFooterImageUrl] = useState("");
  const [footerImageSaving, setFooterImageSaving] = useState(false);

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

    const fetchFooterImage = async () => {
      try {
        const docRef = doc(db, "settings", "custom_footer");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFooterImageUrl(docSnap.data().imageUrl || "");
        }
      } catch (e) {
        console.error("Error fetching custom footer image setting:", e);
      }
    };
    fetchFooterImage();
  }, []);

  const saveFooterImage = async () => {
    if (!footerImageUrl) return alert("يرجى اختيار صورة أو وضع رابط أولاً");
    setFooterImageSaving(true);
    try {
      await setDoc(doc(db, "settings", "custom_footer"), {
        imageUrl: footerImageUrl,
        updatedAt: Date.now(),
      });
      localStorage.setItem("custom_footer_cached_image", footerImageUrl);
      localStorage.setItem("custom_footer_cached_time", String(Date.now()));
      alert("تم حفظ صورة القسم بنجاح!");
    } catch (e) {
      console.error("Error saving custom footer image:", e);
      alert("حدث خطأ أثناء الحفظ في Firestore");
    } finally {
      setFooterImageSaving(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800000) {
      alert("حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 800 كيلوبايت لضمان سرعة التحميل وتوافق قواعد البيانات.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFooterImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

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
    setOrder(link.order ?? 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="border-b dark:border-gray-700 pb-4">
        <div className="flex items-center gap-2 select-none" dir="rtl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-sm shrink-0">
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-800 dark:text-white font-cairo leading-tight">إدارة روابط تابعنا</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo">التحكم في قنوات التواصل والشبكات الاجتماعية للمنصة</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="font-black text-lg text-blue-600 mb-4">
          {editingId ? "تعديل رابط" : "إضافة رابط جديد"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-black">المنصة:</label>
            <select
              value={platform || "whatsapp"}
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
              value={label || ""}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: قناة الواتساب"
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-black">الرابط (URL):</label>
            <input
              type="text"
              value={url || ""}
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
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: انضم لقناتنا للمتابعة..."
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-black">الترتيب:</label>
            <input
              type="number"
              value={order === null || order === undefined ? "" : order}
              onChange={(e) => setOrder(e.target.value === "" ? "" as any : Number(e.target.value))}
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

      {/* إدارة صورة قسم حسابي */}
      <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 mt-8">
        <h3 className="font-black text-lg text-blue-600 mb-2 flex items-center justify-end gap-2">
          <span>إدارة صورة قسم حسابي</span>
          <Image className="w-5 h-5 text-red-600" />
        </h3>
        <p className="text-gray-500 text-xs font-bold leading-relaxed">
          يمكنك تغيير الصورة الترويجية أو الخاصة التي تظهر أسفل قسم "تابعنا" في صفحة حسابي. يتم حفظ الصورة في Firestore وتنزيلها لمرة واحدة فقط لتظهر للعملاء بشكل أسرع دون استهلاك بيانات.
        </p>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="block text-sm font-black">تحميل صورة جديدة:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-bold text-xs"
            />
            <p className="text-[10px] text-gray-400">يفضل اختيار صورة مربعة أو أفقية بحجم أقل من 800 كيلوبايت.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-black">أو رابط الصورة المباشر (URL):</label>
            <input
              type="text"
              value={footerImageUrl}
              onChange={(e) => setFooterImageUrl(e.target.value)}
              placeholder="https://example.com/image.png أو بيانات base64"
              className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-mono text-xs text-left"
              dir="ltr"
            />
          </div>

          {footerImageUrl && (
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-black">معاينة الصورة الحالية:</label>
              <div className="max-w-[200px] border dark:border-gray-700 rounded-2xl overflow-hidden shadow">
                <img
                  src={footerImageUrl}
                  alt="Footer preview"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}

          <button
            onClick={saveFooterImage}
            disabled={footerImageSaving}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50 mt-4"
          >
            {footerImageSaving ? "جاري الحفظ..." : "حفظ صورة القسم الجديدة"}
          </button>
        </div>
      </div>
    </div>
  );
}
