export const BASE_URL = "https://taiz-media-ye.vercel.app";

// Helper to generate a slug from a title
export function generateSlug(title: string, id: string): string {
  if (!title) return id;
  const sanitized = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    // Remove non-alphanumeric (allowing arabic characters)
    .replace(/[^\w\-\u0600-\u06FF]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  
  if (!sanitized) return id;
  return `${sanitized}-${id}`; // append full ID to guarantee uniqueness and easy extraction
}

// Helper to extract ID from a slug
export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  // The ID is the last part after the last hyphen, or the whole string if no hyphen
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

export const routes = {
  home: () => "/",
  search: () => "/search",
  news: (slugOrId: string) => `/news/${slugOrId}`,
  articles: () => "/articles",
  article: (slugOrId: string) => `/articles/${slugOrId}`,
  watch: () => "/watch",
  channel: (id: string) => `/watch/channel/${id}`,
  watchChannel: (id: string) => `/watch/channel/${id}`,
  watchItem: (slugOrId: string) => `/watch/${slugOrId}`,
  leader: () => "/leader",
  leaderItem: (slugOrId: string) => `/leader/${slugOrId}`,
  quran: () => "/quran",
  quranLesson: (lessonId: string, seriesId?: string) => seriesId ? `/quran?lesson=${lessonId}&series=${seriesId}` : `/quran?lesson=${lessonId}`,
  quranSyllabus: (syllabusId: string) => `/quran?syllabus=${syllabusId}`,
  quranExcerpt: (excerptId: string) => `/quran?excerpt=${excerptId}`,
  events: () => "/events",
  activity: (slugOrId: string) => `/events/activity/${slugOrId}`,
  weather: () => "/weather",
  prayerTimes: () => "/prayer-times",
  calendar: (month?: number, year?: number) => month && year ? `/calendar/${month}/${year}` : "/calendar",
  topic: (slugOrId: string) => `/topic/${slugOrId}`,
  admin: () => "/admin",
  download: () => "/download",
  // Absolute URLs for sharing
  absolute: (path: string) => `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
};
