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
  categories?: string[];
  isBreaking: boolean;
  isPinned?: boolean;
  isFeaturedLayout?: boolean;
  createdAt: number;
  updatedAt?: number;
  author?: string;
  views?: number;
  liveUpdates?: LiveUpdate[];
  tags?: string[];
  videoUrl?: string;
  isLeader?: boolean;
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
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  category?: string;
  views: number;
  order?: number;
  createdAt: number;
  isLeader?: boolean;
}

export interface LiveStream {
  id: string;
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
  description?: string;
  views?: number;
  thumbnailUrl?: string;
  order?: number;
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'user' | 'editor';
  permissions?: string[];
  jobTitle?: string;
  createdAt: number;
  lastLogin?: number;
}

export interface QuranSeries {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  order: number;
  verseCount?: number;
  type?: string;
  createdAt: number;
}

export interface QuranLesson {
  id: string;
  seriesId: string;
  title: string;
  content: string; // The text content of the lesson
  imageUrl?: string; // Image for the lesson
  order: number;
  duration?: number; // In seconds
  createdAt: number;
}

export interface QuranSyllabus {
  id: string;
  lessonId: string; // Refers to the lesson in Local Storage
  lessonTitle?: string;
  seriesId?: string;
  seriesTitle?: string;
  durationVal?: number;
  durationType?: "weeks" | "months";
  expiresAt?: number;
  startDate?: number;
  endDate?: number;
  eventId?: string; // Optional link to an Event
  createdAt: number;
}

export interface QuranExcerpt {
  id: string;
  lessonId: string; // Mandatory
  title: string;
  content: string;
  mediaUrl?: string; // Optional media
  createdAt: number;
}

export interface QuranLastRead {
  lessonId: string;
  seriesId: string;
  scrollY: number;
  timestamp: number;
  lessonTitle?: string;
  seriesTitle?: string;
}

export interface LessonProgress {
  lessonId: string;
  completionPercentage: number; // 0 to 100
  lastUpdated: number;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  description?: string;
  order: number;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: "quran" | "leader" | "general" | "news";
  link?: string;
  createdAt: number;
}

export interface FavoriteItem {
  id: string;
  type: "news" | "leader" | "watch";
  title: string;
  imageUrl?: string;
  savedAt: number;
}
