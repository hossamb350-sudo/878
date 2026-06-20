export interface LiveUpdate {
  id: string;
  text: string;
  time: string | number;
  imageUrl?: string;
  imageTitle?: string;
  timestamp?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  shortDescription?: string;
  content: string;
  imageUrl?: string;
  additionalImages?: string[];
  category: string;
  isBreaking: boolean;
  createdAt: number;
  updatedAt?: number;
  author?: string;
  liveUpdates?: LiveUpdate[];
}

export interface UrgentNews {
  id: string;
  text: string;
  createdAt: number;
  expiresAt: number;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  views: number;
  createdAt: number;
}

export interface LiveStream {
  id?: string;
  name?: string;
  iconUrl?: string;
  url?: string;
  isActive: boolean;
  createdAt?: number;
}

export interface LeaderContent {
  id: string;
  title: string;
  type: "text" | "video";
  content: string;
  createdAt: number;
}

export interface QuranContent {
  link?: string;
  isActive: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  dayName: string;
  hijriDate: string;
  gregorianDate: string;
  timestamp: number; // Actual date timestamp for calculations
  icon?: string;
  category: "religious" | "national" | "historical" | "all";
  type: string; // Additional type label
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}
