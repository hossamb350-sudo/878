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

    const setupPushNotifications = async () => {
      try {
        // Request permissions for push notifications (Triggers prompt on Android 13+)
        const permStatus = await PushNotifications.requestPermissions();

        if (permStatus.receive === "granted") {
          // Register with the push notification service to get a token
          await PushNotifications.register();
        } else {
          console.warn("Push notification permission not granted.");
        }
      } catch (err) {
        console.error("Error setting up push notifications:", err);
      }
    };

    const registerListeners = async () => {
      // Handle successful registration
      await PushNotifications.addListener("registration", async (token) => {
        if (!mounted) return;
        console.log("Push registration success, token: ", token.value);
        try {
          // Save the token to Firestore so our backend/admin can send notifications
          await setDoc(doc(db, "fcm_tokens", token.value), {
            token: token.value,
            platform: Capacitor.getPlatform(),
            updatedAt: Date.now(),
          }, { merge: true });
        } catch (e) {
          console.error("Failed to save FCM token to Firestore:", e);
        }
      });

      // Handle registration errors
      await PushNotifications.addListener("registrationError", (error) => {
        console.error("Error on registration: ", error);
      });

      // Handle notifications received while the app is in the FOREGROUND
      await PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push received in foreground: ", notification);
        // We could show a local toast here, but the OS handles the status bar if configured.
      });

      // Handle notification taps (Background / Killed state)
      await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        console.log("Push action performed: ", action);
        
        const data = action.notification.data;
        if (data) {
          // Extract routing details from the notification payload
          let targetPath = "";
          
          if (data.url) {
            targetPath = data.url;
          } else if (data.contentType && (data.contentId || data.slug)) {
            const slugOrId = data.slug || data.contentId;
            switch (data.contentType) {
              case "news":
                targetPath = `/news/${slugOrId}`;
                break;
              case "article":
                targetPath = `/articles/${slugOrId}`;
                break;
              case "video":
                targetPath = `/watch/${slugOrId}`;
                break;
              case "event":
              case "activity":
                targetPath = `/events/activity/${slugOrId}`;
                break;
              case "leader":
                targetPath = `/leader/${slugOrId}`;
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
      });
    };

    setupPushNotifications();
    registerListeners();

    return () => {
      mounted = false;
      PushNotifications.removeAllListeners();
    };
  }, [navigate]);

  return null;
}
