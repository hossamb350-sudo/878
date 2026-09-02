import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Wifi, WifiOff, CheckCircle2, X } from "lucide-react";
import { NotificationSyncService } from "../services/NotificationSyncService";
import { AppNotification } from "../types";

export function OfflineNotificationSyncHandler() {
  const navigate = useNavigate();
  const [toastNotifs, setToastNotifs] = useState<AppNotification[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showNetworkStatusToast, setShowNetworkStatusToast] = useState<boolean>(false);

  useEffect(() => {
    // Initialize notification sync engine
    NotificationSyncService.init();

    // Register callback for when pending notifications are delivered upon reconnection
    const unsubscribeToast = NotificationSyncService.onToastNotification((notif) => {
      setToastNotifs((prev) => [...prev, notif]);
    });

    const handleOnline = () => {
      setIsOnline(true);
      setShowNetworkStatusToast(true);
      setTimeout(() => setShowNetworkStatusToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkStatusToast(true);
      setTimeout(() => setShowNetworkStatusToast(false), 4000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribeToast();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToastNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    dismissToast(notif.id);
    const target = notif.targetUrl || notif.link;
    if (target) {
      navigate(target);
    }
  };

  return (
    <>
      {/* Network Status Reconnection Toast */}
      <AnimatePresence>
        {showNetworkStatusToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-[#0F172A] border border-[#1E293B] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
            dir="rtl"
          >
            {isOnline ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Wifi className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 text-right">
              <h4 className="font-bold text-sm text-white">
                {isOnline ? "تمت استعادة الاتصال بالإنترنت" : "أنت الآن غير متصل بالإنترنت"}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isOnline
                  ? "جاري التحقق من وجود إشعارات معلقة وتسليمها..."
                  : "سيتم الاحتفاظ بالإشعارات وتسليمها فور عودة الاتصال."}
              </p>
            </div>
            <button
              onClick={() => setShowNetworkStatusToast(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivered Pending Notifications Toasts */}
      <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none" dir="rtl">
        <AnimatePresence>
          {toastNotifs.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="pointer-events-auto cursor-pointer bg-[#0F172A] border border-[#1E293B] text-white p-4 rounded-2xl shadow-2xl hover:border-[#F26522]/50 transition-all group overflow-hidden relative"
              onClick={() => handleNotificationClick(notif)}
            >
              {/* Accent Line */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#F26522] to-[#D9A441]" />

              <div className="flex items-start gap-3 mt-1">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center text-[#F26522] shrink-0 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>

                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/30">
                      إشعار تم تسليمه
                    </span>
                    <span className="text-[10px] text-slate-400 mr-auto flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> تم التسليم
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white truncate leading-snug">
                    {notif.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {notif.body}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissToast(notif.id);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
