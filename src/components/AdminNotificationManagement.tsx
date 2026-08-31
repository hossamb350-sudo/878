import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, Timestamp, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Search, Bell, Send, CheckCircle, XCircle, Clock, AlertCircle, X, ExternalLink, Activity, PlayCircle, BookOpen, User, Book, CalendarIcon, Key, Settings } from "lucide-react";
import { NewsItem, Article, VideoItem, LeaderContent, QuranLesson, ActivityItem, NotificationHistoryItem } from "../types";

import { AdminFCMDiagnostics } from "./AdminFCMDiagnostics";

// Helper components
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
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

export function AdminNotificationManagement() {
  const [activeTab, setActiveTab] = useState("news");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Notification Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{success: boolean, message: string} | null>(null);
  
  // FCM Server Key (Legacy)
  const [serverKey, setServerKey] = useState(localStorage.getItem("fcm_server_key") || "");
  const [showSettings, setShowSettings] = useState(false);

  const tabs = [
    { id: "news", label: "الأخبار", icon: Activity },
    { id: "articles", label: "المقالات", icon: BookOpen },
    { id: "videos", label: "الفيديوهات", icon: PlayCircle },
    { id: "leader", label: "السيد القائد", icon: User },
    { id: "lessons", label: "مقرر الدروس", icon: Book },
    { id: "activities", label: "الأنشطة", icon: CalendarIcon },
    { id: "history", label: "سجل الإشعارات", icon: Clock },
    { id: "diagnostics", label: "فحص الإشعارات", icon: AlertCircle },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === "diagnostics") {
      setItems([]);
      return;
    }

    setLoading(true);
    setItems([]);
    try {
      let colName = "";
      switch(activeTab) {
        case "news": colName = "news"; break;
        case "articles": colName = "articles"; break;
        case "videos": colName = "videos"; break;
        case "leader": colName = "leader"; break;
        case "lessons": colName = "quran_syllabuses"; break;
        case "activities": colName = "activities"; break;
        case "history": colName = "notifications_history"; break;
      }
      
      const orderField = activeTab === "lessons" ? "createdAt" : "createdAt";
      const orderDir = activeTab === "lessons" ? "desc" : "desc";
      const q = query(collection(db, colName), orderBy(orderField, orderDir), limit(100));
      const snap = await getDocs(q);
      
      const data = snap.docs.map(doc => {
        const item = { id: doc.id, ...doc.data() } as any;
        if (activeTab === "lessons") {
           item.title = item.lessonTitle || "درس قرآن";
           item.shortDescription = item.seriesTitle ? `سلسلة: ${item.seriesTitle}` : "";
           // to navigate properly to quran section we could keep lessonId
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
    const desc = item.shortDescription || item.description || item.content || item.body || "";
    return title.toLowerCase().includes(term) || desc.toLowerCase().includes(term);
  });

  const handleOpenModal = (item: any) => {
    setSelectedItem(item);
    setNotifTitle(item.title || "عنوان الإشعار");
    let desc = item.shortDescription || item.description || "";
    if (!desc && item.content) {
       desc = item.content.substring(0, 100) + "...";
    }
    setNotifBody(desc || "نص الإشعار");
    setSendResult(null);
    setIsModalOpen(true);
  };

  const handleSendNotification = async () => {
    if (!auth.currentUser) return;
    setSending(true);
    setSendResult(null);
    try {
      const token = await auth.currentUser.getIdToken();
      let contentType = activeTab;
      let targetUrl = `/${contentType}/${selectedItem.id}`;
      
      if (activeTab === "activities") {
        contentType = "event"; 
        targetUrl = `/events/activity/${selectedItem.id}`;
      }
      if (activeTab === "lessons") {
        contentType = "quran";
        // Quran lessons usually don't have a single direct link, maybe to the series
        // but we'll try `/quran` or if we have a specific lesson path
        targetUrl = `/quran`; 
      }
      if (activeTab === "leader") {
        targetUrl = `/leader/${selectedItem.id}`;
      }
      if (activeTab === "videos") {
        targetUrl = `/watch/${selectedItem.id}`;
      }

      const payload = {
        notification: {
          title: notifTitle,
          body: notifBody,
          image: selectedItem.imageUrl || selectedItem.thumbnailUrl,
          sound: "default"
        },
        data: {
          contentType,
          contentId: selectedItem.id,
          url: targetUrl
        }
      };

      try {
        if (!serverKey) {
          throw new Error("يرجى إدخال مفتاح الخدمة (Service Account JSON) أولاً من إعدادات الإشعارات (رمز الترس).");
        }

        let credentials;
        try {
          credentials = JSON.parse(serverKey);
          if (!credentials.private_key || !credentials.client_email || !credentials.project_id) {
            throw new Error("JSON غير صالح");
          }
        } catch (e) {
          throw new Error("الملف المدخل ليس بصيغة Service Account JSON صحيحة. يرجى إنشاء مفتاح جديد من إعدادات Firebase.");
        }

        const { collection, getDocs, addDoc } = await import("firebase/firestore");
        
        // Fetch all tokens
        const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
        const tokens = tokensSnapshot.docs.map(doc => doc.id);
        
        if (tokens.length === 0) {
          throw new Error("لا توجد أي أجهزة مسجلة لإرسال الإشعارات إليها.");
        }

        setSendResult({ success: true, message: "جاري توليد الرموز وإرسال الإشعارات، يرجى الانتظار..." });

        // Generate OAuth2 token using jose
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
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
        });
        
        const oauthData = await oauthRes.json();
        if (!oauthRes.ok) {
          throw new Error("فشل الحصول على تصريح الإرسال. تأكد من أن الـ JSON صحيح.");
        }
        
        const accessToken = oauthData.access_token;
        const projectId = credentials.project_id;

        let successCount = 0;
        let failureCount = 0;

        // Send to each token
        for (let i = 0; i < tokens.length; i++) {
          const v1Payload = {
            message: {
              token: tokens[i],
              notification: {
                title: payload.notification.title,
                body: payload.notification.body,
                image: payload.notification.image || undefined
              },
              data: payload.data,
              android: {
                priority: "high"
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

          if (fcmRes.ok) {
            successCount++;
          } else {
            failureCount++;
          }
        }

        // Record to history
        try {
          await addDoc(collection(db, "notifications_history"), {
            title: notifTitle,
            body: notifBody,
            imageUrl: selectedItem.imageUrl || selectedItem.thumbnailUrl || "",
            contentType,
            contentId: selectedItem.id,
            contentTitle: selectedItem.title,
            successCount,
            failureCount,
            tokensCount: tokens.length,
            createdAt: Date.now(),
            sentBy: auth.currentUser?.email || "Admin",
            method: "legacy_client_side"
          });
        } catch (e) {
          console.warn("Failed to record history", e);
        }

        setSendResult({
          success: true,
          message: `تم الإرسال بنجاح! وصل لـ ${successCount} وفشل ${failureCount}.`
        });
        
        // Reset form
        setNotifTitle("");
        setNotifBody("");

      } catch (err: any) {
        console.error("Error sending push notification:", err);
        setSendResult({
          success: false,
          message: err.message
        });
      } finally {
        setSending(false);
      }
      
      setTimeout(() => {
        if (sendResult?.success || !sendResult) {
          setIsModalOpen(false);
        }
      }, 3500);
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || "حدث خطأ أثناء إرسال الإشعار" });
    } finally {
      setSending(false);
    }
  };

  const renderContentCard = (item: any) => {
    const imageUrl = item.imageUrl || item.thumbnailUrl;
    
    return (
      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
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
              className="w-full py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
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
      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.body}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.createdAt).toLocaleString('ar-SA')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                نجاح: {item.successCount || 0}
              </span>
              {(item.failureCount || 0) > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="w-3 h-3" />
                  فشل: {item.failureCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الإشعارات</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إرسال إشعارات مخصصة للمستخدمين وربطها بالمحتوى</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors text-sm font-medium shrink-0"
          >
            <Settings className="w-4 h-4" />
            إعدادات المفتاح
          </button>

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="بحث في المحتوى..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg shrink-0 mt-1">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">مفتاح الخدمة (Service Account JSON)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  بما أنك لا تستخدم خادم خارجي أو خطة مدفوعة، يتم إرسال الإشعارات مباشرة من متصفحك بشكل مجاني 100% باستخدام واجهة HTTP v1 الحديثة. يرجى إدخال محتوى ملف Service Account JSON من إعدادات مشروعك في Firebase (Project Settings {'>'} Service Accounts {'>'} Generate New Private Key). سيتم حفظه في متصفحك الحالي فقط.
                </p>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={serverKey}
                  onChange={(e) => {
                    setServerKey(e.target.value);
                    localStorage.setItem("fcm_server_key", e.target.value);
                  }}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left font-mono text-sm dark:text-white min-h-[120px]"
                  dir="ltr"
                />
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all font-cairo ${
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

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "diagnostics" ? (
          <AdminFCMDiagnostics />
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">لا يوجد محتوى</h3>
            <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على أي بيانات مطابقة.</p>
          </div>
        ) : (
          <div className={activeTab === "history" ? "flex flex-col gap-4" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
            {filteredItems.map(item => 
              activeTab === "history" ? renderHistoryCard(item) : renderContentCard(item)
            )}
          </div>
        )}
      </div>

      {/* Send Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !sending && setIsModalOpen(false)} title="إرسال إشعار للمستخدمين">
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                سيتم إرسال هذا الإشعار لجميع المستخدمين المشتركين. عند الضغط على الإشعار، سيتم تحويلهم مباشرة إلى هذا المحتوى:
                <strong className="block mt-1 font-bold text-gray-900 dark:text-white">{selectedItem.title}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نص الإشعار</label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              {/* Preview */}
              <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-100 dark:bg-gray-800/50">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">معاينة الإشعار على الهاتف</h4>
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex gap-4 max-w-sm">
                  <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/50 flex shrink-0 items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{notifTitle || "العنوان هنا"}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">{notifBody || "النص هنا"}</p>
                  </div>
                  {(selectedItem.imageUrl || selectedItem.thumbnailUrl) && (
                    <div className="w-12 h-12 shrink-0 rounded overflow-hidden">
                      <img src={selectedItem.imageUrl || selectedItem.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {sendResult && (
              <div className={`p-4 rounded-xl ${sendResult.success ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                <div className="flex items-center gap-2 font-medium">
                  {sendResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  {sendResult.message}
                </div>
              </div>
            )}

            <div className="pt-6 mt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={sending}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sending || !notifTitle || !notifBody}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
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
