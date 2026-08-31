import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Activity, Server, Smartphone, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export function AdminFCMDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError("");
    try {
      const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
      
      // 1. Fetch tokens directly from Firestore
      const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
      const tokensCount = tokensSnapshot.size;
      
      // Check for Service Account Key in localStorage
      const savedKey = localStorage.getItem("fcm_server_key");
      let hasValidKey = false;
      if (savedKey) {
        try {
          const credentials = JSON.parse(savedKey);
          if (credentials.private_key && credentials.client_email && credentials.project_id) {
            hasValidKey = true;
          }
        } catch (e) {
          // invalid json
        }
      }
      
      setDiagnostics({
        isAdminSdkReady: hasValidKey, // We use the client-side mechanism now
        hasLegacyServerKey: false,
        tokensCount: tokensCount,
        vercelEnv: "Client-Side (Local Storage)",
        dryRunStatus: hasValidKey ? "مستعد للإرسال (Ready)" : "غير جاهز (Missing Service Account JSON)",
      });

      // 2. Fetch recent notification history from Firestore
      const historyRef = collection(db, "notifications_history");
      const q = query(historyRef, orderBy("createdAt", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setHistoryLogs(logs);

    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            فحص وتشخيص إشعارات FCM
          </h2>
          <p className="text-sm text-gray-500 mt-1">حالة خوادم الإشعارات ومفاتيح الربط مع Firebase</p>
        </div>
        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl transition-colors disabled:opacity-50"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {diagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Server className="w-5 h-5 text-purple-500" />
              حالة الخادم (Server Config)
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">نظام الإرسال (Engine):</span>
                {diagnostics.isAdminSdkReady ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Admin SDK (FCM v1)
                  </span>
                ) : diagnostics.hasLegacyServerKey ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Legacy FCM API
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    غير متصل (No Credentials)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">اختبار الإرسال (Dry Run):</span>
                <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 text-left" dir="ltr">
                  {diagnostics.dryRunStatus}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">بيئة الاستضافة:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                  {diagnostics.vercelEnv}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              الأجهزة المسجلة
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                {diagnostics.tokensCount}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                جهاز / توكن نشط في قاعدة البيانات
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History Error Logs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            أحدث عمليات الإرسال والأخطاء
          </h3>
        </div>
        <div className="p-0">
          {historyLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لا توجد سجلات بعد</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {historyLogs.map(log => (
                <div key={log.id} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{log.title}</h4>
                    <span className="text-xs text-gray-400" dir="ltr">
                      {new Date(Number(log.createdAt)).toLocaleString('en-GB')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{log.body}</p>
                  
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-gray-500">نجاح:</span>
                      <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                        {log.successCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-gray-500">فشل:</span>
                      <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                        {log.failureCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-gray-500">إجمالي التوكنات المستهدفة:</span>
                      <span className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                        {log.tokensCount || 0}
                      </span>
                    </div>
                  </div>
                  
                  {(Number(log.failureCount) > 0 || (Number(log.successCount) === 0 && Number(log.tokensCount) > 0)) && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg text-xs text-orange-800 dark:text-orange-300">
                      <strong>تحليل الخطأ:</strong> فشل إرسال بعض أو كل الإشعارات. قد يكون ذلك بسبب عدم تكوين مفتاح الخادم (Server Key) أو وجود توكنات منتهية الصلاحية. راجع حالة الخادم في الأعلى.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}