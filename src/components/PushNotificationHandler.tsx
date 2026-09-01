import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export function PushNotificationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run on native Android/iOS platforms
    if (!Capacitor.isNativePlatform()) return;

    let mounted = true;

    const initPush = async () => {
      try {
        // 1. Register listeners FIRST before requesting permissions or registering
        await PushNotifications.addListener("registration", async (token) => {
          if (!mounted) return;
          console.log("[PushNotification] Registration success, token:", token?.value);
          if (token?.value) {
            try {
              await setDoc(doc(db, "fcm_tokens", token.value), {
                token: token.value,
                platform: Capacitor.getPlatform(),
                updatedAt: Date.now(),
              }, { merge: true });
            } catch (e) {
              console.warn("[PushNotification] Failed to save token to Firestore:", e);
            }
          }
        });

        await PushNotifications.addListener("registrationError", (error) => {
          console.warn("[PushNotification] Registration error:", error);
        });

        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("[PushNotification] Push received in foreground:", notification);
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("[PushNotification] Push action performed:", action);
          try {
            const data = action?.notification?.data;
            if (data) {
              let targetPath = "";
              if (data.url) {
                targetPath = data.url;
              } else if (data.contentType && (data.contentId || data.slug)) {
                const slugOrId = data.slug || data.contentId;
                switch (data.contentType) {
                  case "news":
                    targetPath = `/news/${slugOrId}`;
                    break;
                  case "urgent":
                  case "urgentNews":
                    targetPath = `/news`;
                    break;
                  case "article":
                  case "articles":
                    targetPath = `/articles/${slugOrId}`;
                    break;
                  case "video":
                  case "videos":
                    targetPath = `/watch/${slugOrId}`;
                    break;
                  case "event":
                  case "activity":
                  case "activities":
                    targetPath = `/events/activity/${slugOrId}`;
                    break;
                  case "leader":
                    targetPath = `/leader/${slugOrId}`;
                    break;
                  case "quran":
                  case "lessons":
                    targetPath = `/quran`;
                    break;
                  default:
                    targetPath = `/${data.contentType}/${slugOrId}`;
                }
              }
              if (targetPath) {
                if (!targetPath.startsWith("/")) targetPath = "/" + targetPath;
                console.log("[PushNotification] Navigating to:", targetPath);
                navigate(targetPath, { replace: true });
              }
            }
          } catch (e) {
            console.error("[PushNotification] Navigation error:", e);
          }
        });

        // 2. Check permissions: if already granted and not explicitly disabled, register with a safe delay
        const permStatus = await PushNotifications.checkPermissions();
        const isDisabled = localStorage.getItem("push_notifications_enabled") === "false";

        if (permStatus?.receive === "granted" && !isDisabled) {
          setTimeout(async () => {
            try {
              console.log("[PushNotification] Executing delayed registration...");
              
              if (Capacitor.getPlatform() === 'android') {
                await PushNotifications.createChannel({
                  id: 'fcm_high_priority_channel',
                  name: 'المنصة الإعلامية',
                  description: 'إشعارات المنصة الإعلامية للأخبار والتحديثات',
                  importance: 5,
                  visibility: 1,
                  vibration: true,
                });
              }

              await PushNotifications.register();
            } catch (regErr) {
              console.error("[PushNotification] Delayed native registration failed caught safely:", regErr);
            }
          }, 1500);
        } else {
          console.log("[PushNotification] Push notifications not active on startup.");
        }
      } catch (err) {
        console.warn("[PushNotification] Initialization error caught safely:", err);
      }
    };

    initPush();

    return () => {
      mounted = false;
      try {
        PushNotifications.removeAllListeners();
      } catch {
        // ignore
      }
    };
  }, [navigate]);

  return null;
}

