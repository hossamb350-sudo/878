import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { Device } from "@capacitor/device";

export class PushNotificationService {
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    return null; // Not needed for Android
  }

  static async isSubscribed(): Promise<boolean> {
    if (Capacitor.getPlatform() !== "android") return false;
    try {
      const { receive } = await FirebaseMessaging.checkPermissions();
      return receive === "granted";
    } catch (e) {
      return false;
    }
  }

  static async subscribeUser(): Promise<boolean> {
    if (Capacitor.getPlatform() !== "android") return false;
    try {
      const permissions = await FirebaseMessaging.requestPermissions();
      if (permissions.receive !== "granted") {
        return false;
      }
      const { token } = await FirebaseMessaging.getToken();
      if (token) {
        await fetch("/api/notifications/fcm/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, topic: "all" })
        });
        localStorage.setItem("fcm_token", token);
        return true;
      }
      return false;
    } catch (e) {
      console.error("FCM Subscribe error:", e);
      return false;
    }
  }

  static async unsubscribeUser(): Promise<boolean> {
    if (Capacitor.getPlatform() !== "android") return true;
    try {
      const token = localStorage.getItem("fcm_token");
      if (token) {
        await fetch("/api/notifications/fcm/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, topic: "all" })
        });
        localStorage.removeItem("fcm_token");
        await FirebaseMessaging.deleteToken();
      }
      return true;
    } catch (e) {
      console.error("FCM Unsubscribe error:", e);
      return false;
    }
  }

  static async triggerPushNotification(title: string, body: string, url: string = "/", type: string = "general", contentId: string = "", imageUrl: string = ""): Promise<boolean> {
    try {
      const res = await fetch("/api/notifications/fcm/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url, type, contentId, imageUrl, topic: "all" })
      });
      return res.ok;
    } catch (e) {
      console.error("Trigger FCM failed:", e);
      return false;
    }
  }
}
