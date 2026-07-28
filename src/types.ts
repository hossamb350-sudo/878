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
  isActive?: boolean;
  staticExpiresAt?: number;
  scrollingExpiresAt?: number;
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
  streamUrl?: string;
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

export interface ActivityItem {
  id: string;
  title?: string;
  type: string;
  dayName: string;
  hijriDate: string;
  gregorianDate: string;
  startTime?: string;
  endTime?: string;
  description: string;
  imageUrl?: string;
  startDate: number;
  endDate?: number;
  location?: string;
  createdAt: number;
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
  bio?: string;
  phone?: string;
  city?: string;
  preferredCategories?: string[];
  notificationSettings?: {
    urgent?: boolean;
    dailyEvents?: boolean;
    prayerTimes?: boolean;
    quranAudio?: boolean;
    articles?: boolean;
  };
  themePreference?: 'light' | 'dark' | 'system';
  fontSizePreference?: 'small' | 'medium' | 'large' | 'xlarge';
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
  content?: string; // Content is now optional for on-demand loading
  imageUrl?: string;
  order: number;
  duration?: number;
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
  type: "news" | "leader" | "watch" | "article";
  title: string;
  imageUrl?: string;
  savedAt: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  additionalImages?: string[];
  authorName: string;
  authorPhoto?: string;
  authorId?: string;
  isFeatured: boolean;
  createdAt: number;
  hijriDate: string;
  gregorianDate: string;
  updatedAt?: number;
  views: number;
}

export interface Author {
  id: string;
  name: string;
  photoURL?: string;
  bio?: string;
  createdAt: number;
}

export interface NewspaperArticleRef {
  id: string;
  sourceType: 'news' | 'article' | 'custom' | 'ad';
  sourceId?: string;
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  caption?: string;
  authorName?: string;
  authorPhoto?: string;
  category?: string;
  // Advanced Layout
  importance?: 'high' | 'medium' | 'low'; // used by AI to allocate space
  imageSize?: 'full' | 'half' | 'quarter' | 'inline' | 'square' | 'rect' | 'pano';
  columns?: number;
  rowSpan?: number;
  colSpan?: number;
  featuredBox?: boolean;
  quote?: string;
  infographicUrl?: string;
  order: number;
}

export interface NewspaperPage {
  id: string;
  pageNumber: number;
  pageType: 'cover' | 'editorial' | 'index' | 'news' | 'articles' | 'reports' | 'custom' | 'ad';
  title: string;
  subtitle?: string;
  gridColumns: number; // 4 to 8
  columnGap?: number; // in mm
  items: NewspaperArticleRef[];
  notes?: string;
  layoutTemplate?: string; // identifier for the AI-generated layout structure
}

export interface NewspaperIssue {
  id: string;
  issueNumber: string;
  title: string;
  subTitle?: string;
  publishDate: string;
  hijriDate?: string;
  coverImage?: string;
  mainHeadline?: string;
  mainHeadlineSummary?: string;
  chiefEditorName?: string;
  chiefEditorTitle?: string;
  editorNoteTitle?: string;
  editorNoteContent?: string;
  theme?: string;
  accentColor?: string;
  
  // Advanced Print Settings
  pageSize?: 'broadsheet' | 'berliner' | 'tabloid' | 'a3' | 'a4';
  fontFamily?: string;
  marginTop?: number; // in mm
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  safeArea?: number;

  status: 'draft' | 'review' | 'published';
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  createdBy: string;
  createdByName?: string;
  pages: NewspaperPage[];
  // Extras from original
  logoUrl?: string;
  pdfUrl?: string;
  views?: number;
}

export interface NewspaperAuditLog {
  id: string;
  issueId: string;
  issueNumber: string;
  action: 'create' | 'edit' | 'review' | 'publish' | 'archive' | 'delete';
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  timestamp: number;
}
