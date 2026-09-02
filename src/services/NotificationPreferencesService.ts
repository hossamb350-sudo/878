import { LucideIcon, Newspaper, Zap, BookOpen, PlayCircle, User, Radio, Book, Calendar } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export interface NotificationChannelItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const NOTIFICATION_CHANNELS_LIST: NotificationChannelItem[] = [
  {
    id: "news",
    name: "الأخبار",
    description: "تغطيات ومتابعات إخبارية شاملة للأحداث والتطورات المحلية والدولية",
    icon: Newspaper,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-900/40",
  },
  {
    id: "urgent",
    name: "الأخبار العاجلة",
    description: "تنبيهات فورية واستثنائية للأحداث الطارئة والأخبار العاجلة",
    icon: Zap,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-900/40",
  },
  {
    id: "articles",
    name: "المقالات",
    description: "تحليلات سياسية ورؤى فكرية وقراءات نقدية بأقلام نخبة الكتاب",
    icon: BookOpen,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-900/40",
  },
  {
    id: "videos",
    name: "الفيديوهات",
    description: "تقارير مرئية، فلاشات، مقاطع توثيقية، ومحتوى ميديا متجدد",
    icon: PlayCircle,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-900/40",
  },
  {
    id: "leader",
    name: "السيد القائد",
    description: "كلمات وخطابات ومحاضرات قائد الثورة السيد عبدالملك بدرالدين الحوثي",
    icon: User,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-900/40",
  },
  {
    id: "live",
    name: "البث المباشر",
    description: "إشعارات بدء البث المباشر للقنوات الفضائية والإذاعات المحلية",
    icon: Radio,
    color: "text-rose-500 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-900/40",
  },
  {
    id: "lessons",
    name: "مقرر الدروس",
    description: "دروس هدي القرآن الكريم الأسبوعية وملازم الشهيد القائد",
    icon: Book,
    color: "text-teal-500 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/40",
    borderColor: "border-teal-200 dark:border-teal-900/40",
  },
  {
    id: "activities",
    name: "الأنشطة",
    description: "فعاليات، مناسبات، ولقاءات وفعاليات محافظة تعز الرسمية والشعبية",
    icon: Calendar,
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-900/40",
  },
];

export type NotificationChannelsState = Record<string, boolean>;

export const NOTIFICATION_STORAGE_KEY = "taiz_notification_channels_config";

export function getDefaultNotificationChannels(): NotificationChannelsState {
  const defaults: NotificationChannelsState = {};
  NOTIFICATION_CHANNELS_LIST.forEach((ch) => {
    defaults[ch.id] = true;
  });
  return defaults;
}

export function getSavedNotificationChannels(): NotificationChannelsState {
  try {
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all 8 keys exist
      const defaults = getDefaultNotificationChannels();
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load notification channels config", e);
  }
  return getDefaultNotificationChannels();
}

export async function saveNotificationChannels(channels: NotificationChannelsState): Promise<void> {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(channels));
    localStorage.setItem("push_notifications_enabled", "true");

    // Sync with Firestore user document if signed in
    const currentUser = auth.currentUser;
    if (currentUser?.uid) {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          notificationSettings: {
            enabled: true,
            urgent: !!channels.urgent,
            news: !!channels.news,
            articles: !!channels.articles,
            videos: !!channels.videos,
            leader: !!channels.leader,
            live: !!channels.live,
            lessons: !!channels.lessons,
            activities: !!channels.activities,
            channels: channels,
            updatedAt: Date.now(),
          },
        },
        { merge: true }
      );
    }
  } catch (e) {
    console.warn("Failed to save notification preferences", e);
  }
}

export async function requestNativeNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus?.receive === "granted") {
        if (Capacitor.getPlatform() === "android") {
          await PushNotifications.createChannel({
            id: "fcm_high_priority_channel",
            name: "منصة تعز الإعلامية",
            description: "إشعارات منصة تعز الإعلامية للأخبار والتحديثات",
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }
        await PushNotifications.register();
        return true;
      }
      return false;
    } else if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return true;
  } catch (e) {
    console.warn("Error requesting notification permission", e);
    return false;
  }
}
