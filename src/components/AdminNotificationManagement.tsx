import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, Timestamp, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Search, Bell, Send, CheckCircle, XCircle, Clock, AlertCircle, X, ExternalLink, Activity, PlayCircle, BookOpen, User, Book, CalendarIcon, Key, Settings, Zap, Image, Upload, Link2, Sparkles, PlusCircle, Save, Trash2, Quote, Tv } from "lucide-react";
import { NewsItem, Article, VideoItem, LeaderContent, QuranLesson, ActivityItem, NotificationHistoryItem } from "../types";
import { getStoredFCMKey, saveStoredFCMKey } from "../utils/sendFCM";
import { NotificationSyncService } from "../services/NotificationSyncService";

import { AdminFCMDiagnostics } from "./AdminFCMDiagnostics";

// Helper components
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-cairo">
            <Bell className="w-5 h-5 text-blue-500" />
            {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export interface AdminNotificationManagementProps {
  role?: string;
  isAdmin?: boolean;
}

export function AdminNotificationManagement({ role, isAdmin = false }: AdminNotificationManagementProps = {}) {
  const [activeTab, setActiveTab] = useState("custom");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Notification Modal State (for existing items)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{success: boolean, message: string} | null>(null);

  // Custom Notification State
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customImage, setCustomImage] = useState("");
  const [customTargetType, setCustomTargetType] = useState("home");
  const [customCustomUrl, setCustomCustomUrl] = useState("");
  const [customSending, setCustomSending] = useState(false);
  const [customResult, setCustomResult] = useState<{success: boolean, message: string} | null>(null);
  
  // FCM Server Key (Legacy & HTTP v1)
  const [serverKey, setServerKey] = useState(localStorage.getItem("fcm_server_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [keyError, setKeyError] = useState("");

  const canManageKey = Boolean(isAdmin || role === "admin");

  useEffect(() => {
    // Sync FCM key from Firestore or LocalStorage on mount
    const syncKey = async () => {
      try {
        const storedKey = await getStoredFCMKey();
        if (storedKey) {
          setServerKey(storedKey);
        }
      } catch (e) {
        console.warn("Could not sync FCM key", e);
      }
    };
    syncKey();
  }, []);

  const handleSaveKey = async () => {
    setKeySaving(true);
    setKeyError("");
    setKeySaveSuccess(false);
    try {
      const trimmed = serverKey.trim();
      if (trimmed) {
        try {
          const parsed = JSON.parse(trimmed);
          if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
            throw new Error("ملف Service Account JSON غير مكتمل. تأكد من وجود project_id و private_key و client_email.");
          }
        } catch (e: any) {
          throw new Error(e.message || "صيغة JSON غير صالحة. يرجى نسخ ملف مفتاح الخدمة Service Account بالكامل.");
        }
      }

      await saveStoredFCMKey(trimmed);
      setKeySaveSuccess(true);
      setTimeout(() => setKeySaveSuccess(false), 4500);
    } catch (err: any) {
      console.error("Error saving FCM key:", err);
      setKeyError(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setKeySaving(false);
    }
  };

  const tabs = [
    { id: "custom", label: "إشعار مخصص (نص وصورة)", icon: Send },
    { id: "urgent", label: "الأخبار العاجلة", icon: Zap },
    { id: "news", label: "الأخبار", icon: Activity },
    { id: "articles", label: "المقالات", icon: BookOpen },
    { id: "videos", label: "الفيديوهات (ميديا)", icon: PlayCircle },
    { id: "leader", label: "السيد القائد", icon: User },
    { id: "lessons", label: "مقرر الدروس", icon: Book },
    { id: "excerpts", label: "المقتطفات", icon: Quote },
    { id: "activities", label: "الأنشطة", icon: CalendarIcon },
    { id: "tv", label: "قنوات البث التلفزيوني", icon: Tv },
    { id: "history", label: "سجل الإشعارات", icon: Clock },
    { id: "diagnostics", label: "فحص الإشعارات", icon: AlertCircle },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === "diagnostics" || activeTab === "custom") {
      setItems([]);
      return;
    }

    setLoading(true);
    setItems([]);
    try {
      let colName = "";
      switch(activeTab) {
        case "urgent": colName = "urgentNews"; break;
        case "news": colName = "news"; break;
        case "articles": colName = "articles"; break;
        case "videos": colName = "videos"; break;
        case "leader": colName = "leader"; break;
        case "lessons": colName = "quran_syllabuses"; break;
        case "excerpts": colName = "quran_excerpts"; break;
        case "activities": colName = "activities"; break;
        case "tv": colName = "livestreams"; break;
        case "history": colName = "notifications_history"; break;
      }
      
      let snap;
      if (activeTab === "tv") {
        snap = await getDocs(collection(db, "livestreams"));
      } else {
        const orderField = "createdAt";
        const orderDir = "desc";
        const q = query(collection(db, colName), orderBy(orderField, orderDir), limit(100));
        snap = await getDocs(q);
      }
      
      const data = snap.docs.map(doc => {
        const item = { id: doc.id, ...doc.data() } as any;
        if (activeTab === "urgent") {
          item.title = item.text || "خبر عاجل";
          item.shortDescription = item.isActive ? "🟢 نشط حالياً على شريط الأخبار العاجلة" : "⚪ غير نشط / منتهي الصلاحية";
        } else if (activeTab === "lessons") {
          item.title = item.lessonTitle || item.title || "المقرر الأسبوعي";
          item.shortDescription = item.seriesTitle ? `سلسلة: ${item.seriesTitle}` : (item.dateRange || "مقرر دراسي");
        } else if (activeTab === "excerpts") {
          item.title = item.title || item.quote || item.text || "مقتطف من هدي القرآن";
          item.shortDescription = item.source || item.author || item.speaker || "الشهيد القائد / السيد القائد";
        } else if (activeTab === "tv") {
          item.title = item.name || "قناة بث مباشر";
          item.shortDescription = item.type === "tv" ? "📺 قناة تلفزيونية - بث مباشر" : "📻 إذاعة صوتية - بث مباشر";
          item.imageUrl = item.iconUrl || item.logoUrl || item.imageUrl || "";
        }
        return item;
      });
      setItems(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const term = search.toLowerCase();
    const title = item.title || "";
    const desc = item.shortDescription || item.description || item.content || item.body || item.text || "";
    return title.toLowerCase().includes(term) || desc.toLowerCase().includes(term);
  });

  const handleOpenModal = (item: any) => {
    setSelectedItem(item);
    if (activeTab === "urgent") {
      const urgentText = (item.text || item.title || "").trim();
      const cleanUrgent = urgentText.replace(/^عاجل\s*\|\s*/, '').trim();
      setNotifTitle(cleanUrgent ? `عاجل | ${cleanUrgent}` : "عاجل");
      setNotifBody("");
    } else if (activeTab === "articles") {
      const author = (item.authorName || item.author || "").trim();
      const artTitle = (item.title || "").trim();
      const formattedTitle = author ? `${author} | ${artTitle}` : artTitle;
      setNotifTitle(formattedTitle);
      setNotifBody("");
    } else if (activeTab === "news") {
      const rawTitle = (item.title || "").trim();
      const cleanTitle = rawTitle.replace(/^الأخبار\s*\|\s*/, '').trim();
      const formattedTitle = cleanTitle ? `الأخبار | ${cleanTitle}` : "الأخبار";
      setNotifTitle(formattedTitle);
      setNotifBody("");
    } else if (activeTab === "videos") {
      const rawTitle = (item.title || "").trim();
      const cleanTitle = rawTitle.replace(/^ميديا\s*\|\s*/, '').trim();
      const formattedTitle = cleanTitle ? `ميديا | ${cleanTitle}` : "ميديا";
      setNotifTitle(formattedTitle);
      setNotifBody("");
    } else if (activeTab === "leader") {
      setNotifTitle((item.title || "").trim());
      setNotifBody("");
    } else if (activeTab === "lessons") {
      const rawTitle = (item.lessonTitle || item.title || "").trim();
      const cleanTitle = rawTitle.replace(/^المقرر\s*\|\s*/, '').trim();
      const formattedTitle = cleanTitle ? `المقرر | ${cleanTitle}` : "المقرر الأسبوعي";
      setNotifTitle(formattedTitle);
      setNotifBody(item.seriesTitle ? `سلسلة: ${item.seriesTitle}` : "");
    } else if (activeTab === "excerpts") {
      const rawTitle = (item.title || item.quote || item.text || "").trim();
      const cleanTitle = rawTitle.replace(/^مقتطف\s*\|\s*/, '').trim();
      const formattedTitle = cleanTitle ? `مقتطف | ${cleanTitle}` : "مقتطف من هدي القرآن";
      setNotifTitle(formattedTitle);
      setNotifBody((item.source || item.author || item.speaker || "").trim());
    } else if (activeTab === "activities") {
      setNotifTitle((item.title || "").trim());
      setNotifBody("");
    } else if (activeTab === "tv") {
      const cleanName = (item.name || item.title || "").trim();
      setNotifTitle(cleanName ? `بث مباشر | ${cleanName}` : "بث مباشر");
      setNotifBody(item.type === "tv" ? `شاهد البث المباشر لقناة ${cleanName}` : `استمع للبث المباشر لإذاعة ${cleanName}`);
    } else {
      setNotifTitle(item.title || "");
      setNotifBody("");
    }
    setSendResult(null);
    setIsModalOpen(true);
  };

  const handleSendNotification = async () => {
    if (!auth.currentUser) return;
    setSending(true);
    setSendResult(null);
    try {
      let contentType = activeTab;
      let targetUrl = `/${contentType}/${selectedItem.id}`;
      
      if (activeTab === "urgent") {
        contentType = "urgent";
        targetUrl = `/news`;
      } else if (activeTab === "activities") {
        contentType = "event"; 
        targetUrl = `/events/activity/${selectedItem.id}`;
      } else if (activeTab === "tv") {
        contentType = "tv";
        targetUrl = `/tv`;
      } else if (activeTab === "lessons") {
        contentType = "syllabus";
        targetUrl = `/quran?syllabus=${selectedItem.id}&view=syllabuses`; 
      } else if (activeTab === "excerpts") {
        contentType = "excerpt";
        targetUrl = `/quran?excerpt=${selectedItem.id}&view=excerpts`;
      } else if (activeTab === "leader") {
        targetUrl = `/leader/${selectedItem.id}`;
      } else if (activeTab === "videos") {
        targetUrl = `/watch/${selectedItem.id}`;
      } else if (activeTab === "articles") {
        targetUrl = `/articles/${selectedItem.id}`;
      } else if (activeTab === "news") {
        targetUrl = `/news/${selectedItem.id}`;
      }

      const imageUrl = selectedItem.imageUrl || selectedItem.iconUrl || selectedItem.thumbnailUrl || selectedItem.mediaUrl || "";

      await sendPushDirect({
        title: notifTitle,
        body: notifBody,
        imageUrl,
        contentType,
        contentId: selectedItem.id,
        contentTitle: selectedItem.title || notifTitle,
        targetUrl,
      });

      setSendResult({
        success: true,
        message: "تم إرسال الإشعار لجميع المستخدمين بنجاح!"
      });
      
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2500);
    } catch (err: any) {
      console.error("Error sending push notification:", err);
      setSendResult({
        success: false,
        message: err.message || "حدث خطأ أثناء إرسال الإشعار"
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      alert("يرجى إدخال عنوان الإشعار");
      return;
    }

    setCustomSending(true);
    setCustomResult(null);

    try {
      let targetUrl = "/";
      switch(customTargetType) {
        case "news": targetUrl = "/news"; break;
        case "articles": targetUrl = "/articles"; break;
        case "watch": targetUrl = "/watch"; break;
        case "leader": targetUrl = "/leader"; break;
        case "quran": targetUrl = "/quran"; break;
        case "syllabuses": targetUrl = "/quran?view=syllabuses"; break;
        case "excerpts": targetUrl = "/quran?view=excerpts"; break;
        case "events": targetUrl = "/events"; break;
        case "tv": targetUrl = "/tv"; break;
        case "custom": targetUrl = customCustomUrl || "/"; break;
        default: targetUrl = "/";
      }

      await sendPushDirect({
        title: customTitle.trim(),
        body: customBody.trim(),
        imageUrl: customImage.trim(),
        contentType: "custom",
        contentId: "custom_" + Date.now(),
        contentTitle: customTitle.trim(),
        targetUrl,
      });

      setCustomResult({
        success: true,
        message: "تم إرسال الإشعار المخصص بنجاح لجميع المستخدمين!"
      });

      // Clear form
      setCustomTitle("");
      setCustomBody("");
      setCustomImage("");
    } catch (err: any) {
      console.error("Error sending custom notification:", err);
      setCustomResult({
        success: false,
        message: err.message || "حدث خطأ أثناء إرسال الإشعار المخصص"
      });
    } finally {
      setCustomSending(false);
    }
  };

  const sendPushDirect = async (opts: {
    title: string;
    body: string;
    imageUrl?: string;
    contentType: string;
    contentId: string;
    contentTitle: string;
    targetUrl: string;
  }) => {
    const { title, body, imageUrl, contentType, contentId, contentTitle, targetUrl } = opts;

    const activeKey = serverKey || (await getStoredFCMKey());

    if (activeKey) {
      try {
        let credentials;
        try {
          credentials = JSON.parse(activeKey);
        } catch {
          throw new Error("ملف Service Account JSON غير صالح.");
        }

        if (!credentials.private_key || !credentials.client_email || !credentials.project_id) {
          throw new Error("ملف Service Account JSON غير مكتمل.");
        }

        const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
        const tokens = tokensSnapshot.docs.map(doc => doc.id);

        if (tokens.length === 0) {
          throw new Error("لا توجد أجهزة مسجلة لاستقبال الإشعار حالياً.");
        }

        const { SignJWT, importPKCS8 } = await import("jose");
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 3600;
        const privateKey = await importPKCS8(credentials.private_key, "RS256");

        const jwt = await new SignJWT({
          iss: credentials.client_email,
          sub: credentials.client_email,
          aud: "https://oauth2.googleapis.com/token",
          scope: "https://www.googleapis.com/auth/firebase.messaging",
        })
          .setProtectedHeader({ alg: "RS256", typ: "JWT" })
          .setIssuedAt(iat)
          .setExpirationTime(exp)
          .sign(privateKey);

        const oauthRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
        });

        const oauthData = await oauthRes.json();
        if (!oauthRes.ok) throw new Error("فشل الحصول على تصريح Firebase OAuth.");

        const accessToken = oauthData.access_token;
        const projectId = credentials.project_id;

        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < tokens.length; i++) {
          const v1Payload = {
            message: {
              token: tokens[i],
              notification: {
                title: title,
                body: body || undefined,
                image: imageUrl || undefined
              },
              data: {
                title: title,
                body: body || "",
                contentType: contentType,
                contentId: contentId,
                url: targetUrl,
                dir: "rtl",
                lang: "ar"
              },
              android: {
                priority: "high",
                notification: {
                  title: title,
                  body: body || undefined,
                  ticker: title,
                  image: imageUrl || undefined,
                  icon: "ic_launcher",
                  color: "#1e3a8a",
                  sound: "default",
                  channelId: "fcm_high_priority_channel",
                  defaultSound: true,
                  defaultVibrateTimings: true
                }
              },
              webpush: {
                headers: {
                  Urgency: "high"
                },
                notification: {
                  title: title,
                  body: body || undefined,
                  icon: "/ic_launcher.png",
                  badge: "/ic_launcher.png",
                  image: imageUrl || undefined,
                  dir: "rtl",
                  lang: "ar"
                },
                fcm_options: {
                  link: targetUrl
                }
              }
            }
          };

          const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(v1Payload)
          });

          if (fcmRes.ok) successCount++;
          else failureCount++;
        }

        try {
          await addDoc(collection(db, "notifications_history"), {
            title: title,
            body: body,
            imageUrl: imageUrl || "",
            contentType: contentType,
            contentId: contentId,
            contentTitle: contentTitle,
            successCount,
            failureCount,
            tokensCount: tokens.length,
            createdAt: Date.now(),
            sentBy: auth.currentUser?.displayName || auth.currentUser?.email || "Staff",
            method: "client_side_v1"
          });

          // Also queue in NotificationSyncService for offline clients (excluding prayer notifications)
          const isPrayer = NotificationSyncService.isPrayerNotification({ title, body, contentType });
          if (!isPrayer) {
            await NotificationSyncService.addPendingNotification({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              title,
              body,
              category: "general",
              contentType,
              contentId,
              imageUrl: imageUrl || "",
              targetUrl,
              createdAt: Date.now(),
              status: "pending",
              isPrayerNotification: false
            });
          }
        } catch (e) {
          console.warn("Failed to record history / queue pending notification", e);
        }

        return;
      } catch (err: any) {
        console.warn("Client-side direct FCM failed, attempting server broadcast fallback...", err);
      }
    }

    // Server Fallback
    const response = await fetch("/api/push/fcm-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        body: body,
        image: imageUrl,
        data: {
          contentType: contentType,
          slug: contentId,
          contentId: contentId,
          url: targetUrl
        }
      }),
    });

    if (!response.ok) {
      throw new Error("فشل إرسال الإشعار. يرجى التأكد من إدخال مفتاح Service Account JSON من إعدادات الإشعارات.");
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً، يفضل أن يكون أقل من 2 ميغابايت");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const renderContentCard = (item: any) => {
    const imageUrl = item.imageUrl || item.thumbnailUrl || item.mediaUrl;
    
    return (
      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col font-cairo">
        {imageUrl && (
          <div className="h-40 w-full bg-gray-100 dark:bg-gray-900 relative">
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">{item.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
            {item.shortDescription || item.description || "بدون وصف"}
          </p>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
            <button
              onClick={() => handleOpenModal(item)}
              className="w-full py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              إرسال إشعار
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryCard = (item: NotificationHistoryItem) => {
    return (
      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 font-cairo">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
              {item.contentType && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                  {item.contentType}
                </span>
              )}
            </div>
            {item.body && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.body}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(item.createdAt).toLocaleString('ar-SA')}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                نجاح: {item.successCount || 0}
              </span>
              {(item.failureCount || 0) > 0 && (
                <span className="flex items-center gap-1 text-red-500 font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  فشل: {item.failureCount}
                </span>
              )}
            </div>
          </div>
          {item.imageUrl && (
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200">
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">إدارة الإشعارات</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-cairo text-sm">إرسال إشعارات مخصصة (نص وصورة) وإشعارات المحتوى للمستخدمين عبر FCM</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {canManageKey && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-bold shrink-0 font-cairo ${
                showSettings
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Settings className="w-4 h-4" />
              إعدادات المفتاح
            </button>
          )}

          {activeTab !== "custom" && activeTab !== "diagnostics" && (
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="بحث في المحتوى..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-cairo text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>
      </div>

      {canManageKey && showSettings && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg shrink-0 mt-1">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-3 font-cairo">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">مفتاح الخدمة (Service Account JSON)</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                    حصري للمسؤول (Admin Only)
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  يتم استخدام هذا المفتاح لإرسال الإشعارات عبر بروتوكول Firebase HTTP v1 الحديث لجميع مستخدمي المنصة. عند حفظ المفتاح هنا، سيتم تخزينه في إعدادات المنصة السحابية واستخدامه تلقائياً لتشغيل إرسال الإشعارات لدى كل من المشرفين (Manager) والمحررين (Editor) دون الحاجة لإدخال المفتاح من قبلهم.
                </p>
              </div>

              {keyError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{keyError}</span>
                </div>
              )}

              {keySaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>تم حفظ إعدادات المفتاح في المنصة بنجاح! يمكن للمدراء والمحررين الآن إرسال الإشعارات بسلاسة.</span>
                </div>
              )}

              <div className="space-y-3">
                <textarea
                  value={serverKey}
                  onChange={(e) => {
                    setServerKey(e.target.value);
                  }}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left font-mono text-xs dark:text-white min-h-[130px]"
                  dir="ltr"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {serverKey?.trim() ? "✓ المفتاح مدخل ومستعد للاستخدام" : "⚠️ لم يتم إدخال مفتاح بعد"}
                  </p>
                  <div className="flex items-center gap-2">
                    {serverKey?.trim() && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("هل أنت متأكد من حذف مفتاح الإشعارات من المنصة؟")) {
                            setServerKey("");
                            await saveStoredFCMKey("");
                            setKeySaveSuccess(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        مسح المفتاح
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      disabled={keySaving || !serverKey.trim()}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {keySaving ? "جاري الحفظ..." : "حفظ إعدادات المفتاح"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon as any;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all font-cairo text-xs sm:text-sm ${
                activeTab === tab.id
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md border-transparent"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === "custom" ? (
          /* Custom Notification Tab: Text + Image */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-cairo">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">إرسال إشعار مخصص (نص وصورة)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">أنشئ إشعاراً مخصصاً بالكامل مع نص وصورة ووجهة محددة</p>
                </div>
              </div>

              <form onSubmit={handleSendCustomNotification} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                    عنوان الإشعار <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بيان هام | فعاليات المولد النبوي الشريف"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-medium"
                  />
                </div>

                {/* Body / Text */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                    نص / متن الإشعار (اختياري)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اكتب تفاصيل الإشعار أو اتركه فارغاً إذا أردت إشعاراً مقتضباً..."
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none font-medium"
                  />
                </div>

                {/* Image Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                    صورة الإشعار (رابط أو رفع من الجهاز)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={customImage}
                      onChange={(e) => setCustomImage(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                      dir="ltr"
                    />
                    <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer flex items-center gap-2 font-bold text-xs shrink-0 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>رفع صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {customImage && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setCustomImage("")}
                        className="text-xs text-red-600 hover:underline font-bold"
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Destination */}
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                    وجهة الإشعار عند النقر
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "home", label: "الرئيسية" },
                      { id: "news", label: "الأخبار" },
                      { id: "articles", label: "المقالات" },
                      { id: "watch", label: "ميديا" },
                      { id: "leader", label: "السيد القائد" },
                      { id: "quran", label: "القرآن الكريم" },
                      { id: "syllabuses", label: "مقرر الدروس" },
                      { id: "excerpts", label: "المقتطفات" },
                      { id: "events", label: "الأنشطة" },
                      { id: "tv", label: "البث المباشر" },
                      { id: "custom", label: "رابط مخصص" },
                    ].map((dest) => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setCustomTargetType(dest.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                          customTargetType === dest.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {dest.label}
                      </button>
                    ))}
                  </div>

                  {customTargetType === "custom" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="https://example.com أو /my-path"
                        value={customCustomUrl}
                        onChange={(e) => setCustomCustomUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>

                {customResult && (
                  <div className={`p-4 rounded-xl font-bold flex items-center gap-2 text-sm ${
                    customResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {customResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {customResult.message}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={customSending || !customTitle.trim()}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {customSending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري إرسال الإشعار لجميع الأجهزة...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>إرسال الإشعار الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm sticky top-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-400" />
                    معاينة حية للإشعار على جهاز المستخدم
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">Android / iOS / Web</span>
                </div>

                {/* 1. Heads-up Notification Preview */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold text-slate-400">الإشعار المنبثق (Heads-up):</span>
                  <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-3.5 border border-slate-700/80 shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex shrink-0 items-center justify-center shadow-md">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-400">منصة تعز الإعلامية</span>
                        <span className="text-[10px] text-slate-400">الآن</span>
                      </div>
                      <p className="font-bold text-white text-xs truncate mt-0.5">
                        {customTitle || "عنوان الإشعار هنا"}
                      </p>
                    </div>
                    {customImage && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                        <img src={customImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Expanded Shade Notification Preview */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400">الإشعار في لوحة الإشعارات (Expanded):</span>
                  <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Bell className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-slate-300">منصة تعز الإعلامية</span>
                      </div>
                      <span className="text-[10px] text-slate-400">الآن</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{customTitle || "عنوان الإشعار هنا"}</h4>
                      {customBody && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{customBody}</p>
                      )}
                    </div>

                    {customImage && (
                      <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                        <img src={customImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "diagnostics" ? (
          <AdminFCMDiagnostics />
        ) : loading ? (
          <div className="flex items-center justify-center h-64 font-cairo">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 font-cairo">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">لا يوجد محتوى</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">لم يتم العثور على أي بيانات مطابقة.</p>
          </div>
        ) : (
          <div className={activeTab === "history" ? "flex flex-col gap-4 font-cairo" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-cairo"}>
            {filteredItems.map(item => 
              activeTab === "history" ? renderHistoryCard(item) : renderContentCard(item)
            )}
          </div>
        )}
      </div>

      {/* Send Modal for existing content */}
      <Modal isOpen={isModalOpen} onClose={() => !sending && setIsModalOpen(false)} title="إرسال إشعار للمستخدمين">
        {selectedItem && (
          <div className="space-y-6 font-cairo" dir="rtl">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                سيتم إرسال هذا الإشعار لجميع المستخدمين المشتركين. عند الضغط على الإشعار، سيتم تحويلهم مباشرة إلى هذا المحتوى:
                <strong className="block mt-1 font-bold text-gray-900 dark:text-white">{selectedItem.title}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">نص الإشعار (اختياري)</label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  rows={3}
                  placeholder="بدون نص إضافي (يظهر العنوان فقط في الإشعار المنبثق)"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              {/* Preview */}
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-100 dark:bg-gray-800/50">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">معاينة الإشعار على الهاتف</h4>
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 flex gap-4 max-w-sm border border-slate-200/80">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex shrink-0 items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{notifTitle || "العنوان هنا"}</p>
                    {notifBody && <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">{notifBody}</p>}
                  </div>
                  {(selectedItem.imageUrl || selectedItem.thumbnailUrl) && (
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-slate-100">
                      <img src={selectedItem.imageUrl || selectedItem.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {sendResult && (
              <div className={`p-4 rounded-xl font-bold flex items-center gap-2 text-sm ${sendResult.success ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                {sendResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {sendResult.message}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={sending}
                className="w-full sm:w-auto px-6 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sending || !notifTitle.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال الإشعار
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
