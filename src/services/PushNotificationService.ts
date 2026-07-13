import { collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BAD_LAWZHGtCnTB1VARbKNd8FXtWmMdDersfNojTktkSWPicaZcwHdgdM5nQbmVl9GkujacJdrwJ9HYqWEYhDHM";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications are not supported in this browser.");
      return null;
    }

    try {
      // Register the service worker at the root scope
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered successfully with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }

  static async isSubscribed(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (e) {
      console.error("Error checking subscription state:", e);
      return false;
    }
  }

  static async subscribeUser(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      let reason = "متصفحك لا يدعم إشعارات الويب.";
      
      // Check for common reasons
      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        reason = "الإشعارات تتطلب اتصالاً آمناً (HTTPS). يرجى التأكد من أنك تستخدم HTTPS.";
      } else if (window.isSecureContext === false) {
        reason = "المتصفح في وضع غير آمن يمنع الإشعارات.";
      } else {
        reason = "متصفحك لا يدعم إشعارات الويب أو أنك تشغل التطبيق داخل نافذة معاينة مقيدة. يرجى فتح التطبيق في علامة تبويب جديدة (New Tab) أو متصفح خارجي مثل Chrome.";
      }
      
      alert(reason);
      return false;
    }

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("يجب السماح بالإشعارات لتفعيل الخدمة.");
        return false;
      }

      // 2. Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to Push Manager
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log("User successfully subscribed to Push Manager:", subscription);

      // 4. Save subscription to backend API and Firestore (for hybrid redundancy)
      const subscriptionPayload = subscription.toJSON();
      
      // Save in Express backend
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionPayload),
      });

      if (!response.ok) {
        console.warn("Failed to register subscription on backend Express API. Will retry or rely on Firestore.");
      }

      // Save in Firestore directly for high availability
      try {
        const subCollection = collection(db, "push_subscriptions");
        // Check if already exists to prevent duplicate entries
        const q = query(subCollection, where("endpoint", "==", subscription.endpoint));
        const existingDocs = await getDocs(q);
        
        if (existingDocs.empty) {
          await addDoc(subCollection, {
            endpoint: subscription.endpoint,
            keys: subscriptionPayload.keys || {},
            createdAt: Date.now(),
            userAgent: navigator.userAgent,
          });
          console.log("Subscription saved to Firestore successfully.");
        }
      } catch (firestoreErr) {
        console.error("Failed to save subscription to Firestore:", firestoreErr);
      }

      localStorage.setItem("push_subscribed", "true");
      return true;
    } catch (error) {
      console.error("Failed to subscribe user to push notifications:", error);
      alert("حدث خطأ أثناء تفعيل الإشعارات. يرجى المحاولة مرة أخرى.");
      return false;
    }
  }

  static async unsubscribeUser(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Send unsubscribe to backend
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(err => console.warn("Failed to unsubscribe on backend API:", err));

        // Delete from Firestore
        try {
          const subCollection = collection(db, "push_subscriptions");
          const q = query(subCollection, where("endpoint", "==", subscription.endpoint));
          const snap = await getDocs(q);
          snap.forEach(async (docRef) => {
            await deleteDoc(docRef.ref);
          });
        } catch (firestoreErr) {
          console.error("Failed to delete subscription from Firestore:", firestoreErr);
        }

        // Unsubscribe from Push Manager
        await subscription.unsubscribe();
        console.log("User successfully unsubscribed.");
      }

      localStorage.removeItem("push_subscribed");
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe user:", error);
      return false;
    }
  }

  /**
   * Helper to request backend to trigger push to all subscribers
   */
  static async triggerPushNotification(title: string, body: string, url: string = "/"): Promise<boolean> {
    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body, url }),
      });
      return response.ok;
    } catch (e) {
      console.error("Failed to trigger push notification from client:", e);
      return false;
    }
  }
}
