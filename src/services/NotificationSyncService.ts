import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { get, set } from "idb-keyval";
import { AppNotification } from "../types";

const DELIVERED_IDS_KEY = "delivered_notifications_ids";
const PENDING_LOCAL_KEY = "pending_offline_notifications";
const LAST_SYNC_TIME_KEY = "notifications_last_sync_time";

export interface PendingSyncResult {
  totalProcessed: number;
  deliveredCount: number;
  skippedPrayerCount: number;
  skippedDuplicateCount: number;
  deliveredList: AppNotification[];
}

export type ToastCallback = (notification: AppNotification) => void;

export class NotificationSyncService {
  private static listeners: Set<ToastCallback> = new Set();
  private static isSyncing = false;
  private static isInitialized = false;

  /**
   * Helper to check if a notification is related to prayer/adhan.
   * EXCLUSION RULE: Prayer notifications must NEVER be queued/delivered retroactively when coming online.
   */
  public static isPrayerNotification(notif: Partial<AppNotification>): boolean {
    if (notif.isPrayerNotification === true) return true;

    const type = (notif.contentType || notif.category || "").toLowerCase();
    if (["prayer", "adhan", "prayer_time", "prayer_alert", "salat"].includes(type)) {
      return true;
    }

    const title = (notif.title || "").toLowerCase();
    const body = (notif.body || "").toLowerCase();

    // Check for explicit Arabic and English prayer terms
    const prayerKeywords = [
      "أذان",
      "الاذان",
      "الأذان",
      "صلاة",
      "الصلاة",
      "مواقيت الصلاة",
      "موعد أذان",
      "موعد صلاة",
      "اذان الفجر",
      "اذان الظهر",
      "اذان العصر",
      "اذان المغرب",
      "اذان العشاء",
      "صلاة الفجر",
      "صلاة الظهر",
      "صلاة العصر",
      "صلاة المغرب",
      "صلاة العشاء",
      "fajr",
      "dhuhr",
      "asr",
      "maghrib",
      "isha",
    ];

    for (const kw of prayerKeywords) {
      if (title.includes(kw) || body.includes(kw)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Register a listener callback to receive in-app toast alerts when pending notifications are delivered upon reconnection.
   */
  public static onToastNotification(callback: ToastCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyToastListeners(notification: AppNotification) {
    this.listeners.forEach((cb) => {
      try {
        cb(notification);
      } catch (err) {
        console.warn("[NotificationSyncService] Toast listener error:", err);
      }
    });
  }

  /**
   * Get set of delivered notification IDs from persistent storage
   */
  public static async getDeliveredIds(): Promise<Set<string>> {
    try {
      const stored = await get<string[]>(DELIVERED_IDS_KEY);
      if (Array.isArray(stored)) {
        return new Set(stored);
      }
    } catch (e) {
      console.warn("Failed to read delivered IDs from cache:", e);
    }
    return new Set();
  }

  /**
   * Mark a notification ID as delivered permanently
   */
  public static async markAsDeliveredLocal(notifId: string): Promise<void> {
    try {
      const deliveredSet = await this.getDeliveredIds();
      deliveredSet.add(notifId);
      await set(DELIVERED_IDS_KEY, Array.from(deliveredSet));
    } catch (e) {
      console.warn("Failed to store delivered ID:", e);
    }
  }

  /**
   * Get pending offline notifications saved locally
   */
  public static async getLocalPending(): Promise<AppNotification[]> {
    try {
      const list = await get<AppNotification[]>(PENDING_LOCAL_KEY);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save local pending list
   */
  public static async setLocalPending(list: AppNotification[]): Promise<void> {
    try {
      await set(PENDING_LOCAL_KEY, list);
    } catch (e) {
      console.warn("Failed to set local pending list:", e);
    }
  }

  /**
   * Queue a notification for offline or broadcast
   */
  public static async addPendingNotification(notif: AppNotification): Promise<void> {
    // 1. STRICT EXCLUSION: Never queue prayer notifications
    if (this.isPrayerNotification(notif)) {
      console.log("[NotificationSyncService] Skipping prayer notification queuing.");
      return;
    }

    notif.status = "pending";
    if (!notif.createdAt) notif.createdAt = Date.now();

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      // Save locally to IndexedDB/localStorage
      const current = await this.getLocalPending();
      if (!current.some((item) => item.id === notif.id)) {
        current.push(notif);
        await this.setLocalPending(current);
        console.log("[NotificationSyncService] Stored pending notification locally while offline:", notif.title);
      }
    } else {
      // Save to Firestore notifications collection
      try {
        await addDoc(collection(db, "notifications"), {
          title: notif.title,
          body: notif.body,
          category: notif.category || "general",
          contentType: notif.contentType || "general",
          contentId: notif.contentId || notif.id,
          imageUrl: notif.imageUrl || "",
          targetUrl: notif.targetUrl || notif.link || "/",
          createdAt: notif.createdAt,
          status: "pending",
          isPrayerNotification: false,
        });
        console.log("[NotificationSyncService] Added pending notification to Firestore:", notif.title);
      } catch (e) {
        console.warn("Failed to write pending notification to Firestore, queueing locally:", e);
        const current = await this.getLocalPending();
        if (!current.some((item) => item.id === notif.id)) {
          current.push(notif);
          await this.setLocalPending(current);
        }
      }
    }
  }

  /**
   * MAIN RECONNECTION & SYNC LOGIC:
   * When returning online:
   * 1. Checks for pending undelivered notifications.
   * 2. Excludes prayer notifications.
   * 3. Prevents duplicate deliveries.
   * 4. Orders chronologically (ASCENDING: oldest to newest).
   * 5. Delivers all due notifications to user.
   * 6. Updates notification status to "delivered".
   */
  public static async checkAndSyncPendingNotifications(): Promise<PendingSyncResult> {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (!isOnline) {
      return { totalProcessed: 0, deliveredCount: 0, skippedPrayerCount: 0, skippedDuplicateCount: 0, deliveredList: [] };
    }

    if (this.isSyncing) {
      console.log("[NotificationSyncService] Sync already in progress, skipping.");
      return { totalProcessed: 0, deliveredCount: 0, skippedPrayerCount: 0, skippedDuplicateCount: 0, deliveredList: [] };
    }

    this.isSyncing = true;
    console.log("[NotificationSyncService] Checking for pending notifications upon reconnection...");

    const deliveredSet = await this.getDeliveredIds();
    const rawPendingCandidates: AppNotification[] = [];

    // A. Load local pending notifications from offline queue
    const localPending = await this.getLocalPending();
    rawPendingCandidates.push(...localPending);

    // B. Query Firestore for pending or recent notifications
    try {
      const q = query(
        collection(db, "notifications"),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        rawPendingCandidates.push({
          id: docSnap.id,
          title: data.title || "",
          body: data.body || "",
          category: data.category || "general",
          contentType: data.contentType || "general",
          contentId: data.contentId || docSnap.id,
          imageUrl: data.imageUrl || "",
          targetUrl: data.targetUrl || data.link || "/",
          createdAt: data.createdAt || Date.now(),
          status: data.status || "pending",
          isPrayerNotification: data.isPrayerNotification,
        });
      });
    } catch (err) {
      console.warn("[NotificationSyncService] Firestore pending query fallback:", err);
      try {
        const lastSync = (await get<number>(LAST_SYNC_TIME_KEY)) || 0;
        const fallbackQ = query(
          collection(db, "notifications"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(fallbackQ);
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if ((data.createdAt || 0) > lastSync) {
            rawPendingCandidates.push({
              id: docSnap.id,
              title: data.title || "",
              body: data.body || "",
              category: data.category || "general",
              contentType: data.contentType || "general",
              contentId: data.contentId || docSnap.id,
              imageUrl: data.imageUrl || "",
              targetUrl: data.targetUrl || data.link || "/",
              createdAt: data.createdAt || Date.now(),
              status: data.status || "pending",
              isPrayerNotification: data.isPrayerNotification,
            });
          }
        });
      } catch (e) {
        console.warn("[NotificationSyncService] Secondary fallback query error:", e);
      }
    }

    // Deduplicate candidates by ID
    const uniqueCandidatesMap = new Map<string, AppNotification>();
    for (const item of rawPendingCandidates) {
      if (!uniqueCandidatesMap.has(item.id)) {
        uniqueCandidatesMap.set(item.id, item);
      }
    }

    const uniqueCandidates = Array.from(uniqueCandidatesMap.values());
    let skippedPrayerCount = 0;
    let skippedDuplicateCount = 0;

    // Filter Step 1: EXCLUDE prayer notifications
    const nonPrayerCandidates = uniqueCandidates.filter((item) => {
      const isPrayer = this.isPrayerNotification(item);
      if (isPrayer) {
        skippedPrayerCount++;
        return false;
      }
      return true;
    });

    // Filter Step 2: EXCLUDE already delivered notifications (No duplicates!)
    const dueNotifications = nonPrayerCandidates.filter((item) => {
      if (deliveredSet.has(item.id)) {
        skippedDuplicateCount++;
        return false;
      }
      return true;
    });

    // Step 3: CHRONOLOGICAL SORTING (ASCENDING: oldest created first -> newest last)
    dueNotifications.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    console.log(
      `[NotificationSyncService] Found ${dueNotifications.length} due pending notifications to deliver. (${skippedPrayerCount} prayer notifications excluded, ${skippedDuplicateCount} duplicates skipped)`
    );

    const deliveredList: AppNotification[] = [];

    // Step 4: Deliver each due notification sequentially
    for (const notif of dueNotifications) {
      try {
        // A. Deliver native browser/device notification
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            try {
              new Notification(notif.title, {
                body: notif.body,
                icon: notif.imageUrl || "/ic_launcher.png",
                badge: "/ic_launcher.png",
                data: { url: notif.targetUrl || "/" },
                dir: "rtl",
                lang: "ar",
              });
            } catch (e) {
              console.warn("[NotificationSyncService] Browser Notification error:", e);
            }
          }
        }

        // B. Trigger in-app toast banner callback
        this.notifyToastListeners(notif);

        // C. Record local delivered state
        await this.markAsDeliveredLocal(notif.id);
        deliveredSet.add(notif.id);
        deliveredList.push(notif);

        // D. Update status in Firestore to "delivered"
        try {
          const docRef = doc(db, "notifications", notif.id);
          await updateDoc(docRef, {
            status: "delivered",
            deliveredAt: Date.now(),
          });
        } catch (e) {
          // Non-blocking
        }

        // Delay 800ms between each notification to preserve sequence visibility
        await new Promise((res) => setTimeout(res, 800));
      } catch (err) {
        console.error(`[NotificationSyncService] Error delivering notification ${notif.id}:`, err);
      }
    }

    // Clean up local pending queue after processing
    await this.setLocalPending([]);
    await set(LAST_SYNC_TIME_KEY, Date.now());

    this.isSyncing = false;

    return {
      totalProcessed: uniqueCandidates.length,
      deliveredCount: deliveredList.length,
      skippedPrayerCount,
      skippedDuplicateCount,
      deliveredList,
    };
  }

  /**
   * Initialize auto-sync listeners on startup and network status changes
   */
  public static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== "undefined") {
      // Listen for online reconnect event
      window.addEventListener("online", () => {
        console.log("[NotificationSyncService] Network status: ONLINE. Triggering pending notifications check...");
        setTimeout(() => {
          this.checkAndSyncPendingNotifications();
        }, 1200);
      });

      window.addEventListener("offline", () => {
        console.log("[NotificationSyncService] Network status: OFFLINE.");
      });

      // Also trigger initial check if currently online
      if (navigator.onLine) {
        setTimeout(() => {
          this.checkAndSyncPendingNotifications();
        }, 2000);
      }
    }
  }
}
