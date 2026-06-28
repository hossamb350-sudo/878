import { collection, query, orderBy, limit, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AppNotification } from "../types";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
const iconImg = "/app-icon.png";

class NotificationService {
  private isListening = false;
  private unsubscribe: (() => void) | null = null;
  private actionCallback: ((link: string) => void) | null = null;
  private initTime = Date.now();

  constructor() {
    this.initCapacitorListeners();
  }

  // Set the redirection callback when a user clicks the notification
  public onNotificationClick(callback: (link: string) => void) {
    this.actionCallback = callback;
  }

  // Get if system notifications are enabled by the user (defaults to true)
  public isEnabled(): boolean {
    const saved = localStorage.getItem("push_notifications_enabled");
    return saved === null ? true : saved === "true";
  }

  // Enable/Disable notifications
  public async setEnabled(enabled: boolean): Promise<boolean> {
    localStorage.setItem("push_notifications_enabled", enabled ? "true" : "false");
    
    if (enabled) {
      return await this.requestPermission();
    } else {
      this.stopListening();
      return false;
    }
  }

  // Request permissions for notifications on Web and Mobile
  public async requestPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        return status.display === "granted";
      } else {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          return permission === "granted";
        }
        return false;
      }
    } catch (e) {
      console.error("Failed to request notification permission:", e);
      return false;
    }
  }

  // Initialize Capacitor notification click listeners
  private initCapacitorListeners() {
    if (Capacitor.isNativePlatform()) {
      try {
        LocalNotifications.addListener(
          "localNotificationActionPerformed",
          (action) => {
            const link = action.notification.extra?.link;
            if (link && this.actionCallback) {
              this.actionCallback(link);
            } else if (link) {
              // Fallback redirect if listener is not registered yet
              localStorage.setItem("pending_notification_redirect", link);
            }
          }
        );
      } catch (e) {
        console.error("Capacitor local notifications listener error:", e);
      }
    }
  }

  // Start listening to real-time additions to the firestore notifications collection
  public startListening(navigateHandler: (link: string) => void) {
    this.onNotificationClick(navigateHandler);

    if (this.isListening) return;
    if (!this.isEnabled()) return;

    // Handle any pending redirection from cold start
    const pending = localStorage.getItem("pending_notification_redirect");
    if (pending) {
      localStorage.removeItem("pending_notification_redirect");
      setTimeout(() => {
        navigateHandler(pending);
      }, 1000);
    }

    this.isListening = true;

    // Set up Firestore listener to trigger immediately on any new notification
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Prepare list of processed/shown notifications to prevent repeats
        const shownJSON = localStorage.getItem("shown_notifications_history") || "[]";
        let shownIds: string[] = [];
        try {
          shownIds = JSON.parse(shownJSON);
        } catch (e) {}

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const docData = change.doc.data();
            const id = change.doc.id;
            const notification = { id, ...docData } as AppNotification;

            // Strict checklist to ensure we only notify when appropriate:
            // 1. User has enabled notifications
            // 2. The notification was created *after* the page/app was initialized (or close to it)
            // 3. We didn't already display this notification in this session/device
            const isFresh = notification.createdAt > this.initTime - 5000;
            const isNew = !shownIds.includes(id);

            if (this.isEnabled() && isFresh && isNew) {
              // Mark as shown immediately
              shownIds.push(id);
              if (shownIds.length > 50) shownIds.shift(); // keep history compact
              localStorage.setItem("shown_notifications_history", JSON.stringify(shownIds));

              // Show native app banner or browser notification
              this.showSystemNotification(notification);
            }
          }
        });
      },
      (error) => {
        console.error("Push notify listening error", error);
      }
    );
  }

  // Show a standard system level alert / push notification to the operating system
  private async showSystemNotification(n: AppNotification) {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: n.title,
              body: n.body,
              id: Math.floor(Math.random() * 1000000),
              extra: {
                link: n.link || "/"
              },
              smallIcon: "res://ic_stat_name", // native Android assets
              actionTypeId: "OPEN_SECTION",
              sound: "res://raw/chime"
            }
          ]
        });
      } catch (e) {
        console.error("Capacitor System Push Display Error", e);
      }
    } else {
      // Standard Web Browser System push banner
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const systemNotification = new Notification(n.title, {
            body: n.body,
            icon: iconImg,
            badge: iconImg,
            tag: n.id,
            requireInteraction: true
          });

          systemNotification.onclick = (e) => {
            e.preventDefault();
            window.focus();
            if (n.link && this.actionCallback) {
              this.actionCallback(n.link);
            }
            systemNotification.close();
          };
        } catch (e) {
          console.error("Web System Push Display error", e);
        }
      }
    }
  }

  public stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isListening = false;
  }

  // Create a new notification document in Firestore to be picked up by other clients
  public async sendNewsNotification(data: { id: string; title: string; category?: string; imageUrl?: string }) {
    try {
      const notificationData: Omit<AppNotification, "id"> = {
        title: "خبر جديد",
        body: data.title,
        category: "news",
        link: `/news/${data.id}`,
        createdAt: Date.now()
      };
      await addDoc(collection(db, "notifications"), notificationData);
    } catch (e) {
      console.error("Failed to send news notification:", e);
    }
  }
}

export const notificationService = new NotificationService();
