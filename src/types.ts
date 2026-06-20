export interface NewsItem {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  imageUrl?: string;
  category: string;
  isBreaking: boolean;
  createdAt: number;
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
  url?: string;
  isActive: boolean;
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
  date: number;
  type: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}
