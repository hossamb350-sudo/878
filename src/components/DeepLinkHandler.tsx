import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { isAndroidWebBrowser, buildAndroidIntentUrl, openInAndroidApp } from "../utils/deepLink";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Smartphone, Download, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function DeepLinkHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);

  // 1. Native Capacitor deep linking listener
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Check initial launch URL
      App.getLaunchUrl().then((launchUrl) => {
        if (launchUrl && launchUrl.url) {
          handleIncomingDeepLink(launchUrl.url);
        }
      });

      // Listen for runtime deep link intents
      const listenerPromise = App.addListener("appUrlOpen", (data) => {
        if (data && data.url) {
          handleIncomingDeepLink(data.url);
        }
      });

      return () => {
        listenerPromise.then((handle) => handle.remove());
      };
    }
  }, [navigate]);

  function handleIncomingDeepLink(rawUrl: string) {
    try {
      let targetPath = "";
      if (rawUrl.startsWith("taizmedia://") || rawUrl.startsWith("taizapp://")) {
        targetPath = rawUrl.replace(/^taiz(media|app):\/\//, "/");
        if (!targetPath.startsWith("/")) targetPath = "/" + targetPath;
      } else if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        const parsed = new URL(rawUrl);
        targetPath = parsed.pathname + parsed.search + parsed.hash;
      } else {
        targetPath = rawUrl.startsWith("/") ? rawUrl : "/" + rawUrl;
      }

      if (targetPath) {
        console.log("[DeepLink] Navigating to:", targetPath);
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      console.warn("[DeepLink] Failed to parse URL:", rawUrl, err);
    }
  }

  // 2. Fetch app download URL from Firestore settings
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "app_version_config"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.updateUrl) {
            setDownloadUrl(data.updateUrl);
          }
        }
      },
      (err) => console.warn("Could not fetch version config for deep link:", err)
    );
    return () => unsub();
  }, []);

  // 3. Detect Android Web environment to show Smart App Banner
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("deep_link_banner_dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
      return;
    }

    if (isAndroidWebBrowser()) {
      setShowBanner(true);
    }
  }, [location.pathname]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("deep_link_banner_dismissed", "true");
  };

  const handleOpenApp = () => {
    const currentPath = location.pathname + location.search;
    openInAndroidApp(currentPath, downloadUrl || undefined);
  };

  const handleDownloadApp = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    } else {
      // Fallback
      handleOpenApp();
    }
  };

  // Do not render UI if native or not on Android web
  if (Capacitor.isNativePlatform() || !isAndroidWebBrowser() || dismissed || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="تنبيه تطبيق الأندرويد"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="sticky top-0 z-[999] w-full bg-gradient-to-r from-[#07152B] via-[#0E274D] to-[#07152B] border-b border-amber-400/30 text-white shadow-xl px-3 py-2 select-none"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & App Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-slate-900 border border-amber-400/40 shrink-0 shadow-md flex items-center justify-center p-0.5">
              <img
                src="/ic_launcher.png"
                alt="تطبيق المنصة"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex flex-col min-w-0 text-right leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[11px] sm:text-xs text-white font-cairo whitespace-nowrap">
                  تطبيق المنصة الإعلامية
                </span>
                <span className="bg-amber-400 text-[#07152B] text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded-full shrink-0">
                  Android
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium font-cairo whitespace-nowrap overflow-hidden text-ellipsis">
                افتح المحتوى مباشرة في التطبيق
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Open in App Button */}
            <button
              onClick={handleOpenApp}
              className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer font-cairo whitespace-nowrap"
              title="فتح الرابط في تطبيق الأندرويد"
            >
              <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>فتح في التطبيق</span>
            </button>

            {/* Download APK Button if download URL is available */}
            {downloadUrl && (
              <button
                onClick={handleDownloadApp}
                className="hidden md:flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] sm:text-xs px-2 py-1 rounded-lg border border-white/20 transition-all active:scale-95 cursor-pointer font-cairo whitespace-nowrap"
                title="تحميل تطبيق الأندرويد APK"
              >
                <Download className="w-3 h-3 text-amber-300" />
                <span>تحميل APK</span>
              </button>
            )}

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer mr-0.5 shrink-0"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
