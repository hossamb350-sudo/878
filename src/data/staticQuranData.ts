import { QuranSeries, QuranLesson, QuranSyllabus, QuranExcerpt } from "../types";

const ordinalMap: { words: string[]; num: number }[] = [
  { words: ['الحادي والثلاثين', 'الحادي والثلاثون'], num: 31 },
  { words: ['الثاني والثلاثين', 'الثاني والثلاثون'], num: 32 },
  { words: ['الثالث والثلاثين', 'الثالث والثلاثون'], num: 33 },
  { words: ['الرابع والثلاثين', 'الرابع والثلاثون'], num: 34 },
  { words: ['الخامس والثلاثين', 'الخامس والثلاثون'], num: 35 },
  { words: ['الحادي والعشرين', 'الحادي والعشرون'], num: 21 },
  { words: ['الثاني والعشرين', 'الثاني والعشرون'], num: 22 },
  { words: ['الثالث والعشرين', 'الثالث والعشرون'], num: 23 },
  { words: ['الرابع والعشرين', 'الرابع والعشرون'], num: 24 },
  { words: ['الخامس والعشرين', 'الخامس والعشرون'], num: 25 },
  { words: ['السادس والعشرين', 'السادس والعشرون'], num: 26 },
  { words: ['السابع والعشرين', 'السابع والعشرون'], num: 27 },
  { words: ['الثامن والعشرين', 'الثامن والعشرون'], num: 28 },
  { words: ['التاسع والعشرين', 'التاسع والعشرون'], num: 29 },
  { words: ['الثلاثين', 'الثلاثون'], num: 30 },
  { words: ['الحادي عشر'], num: 11 },
  { words: ['الثاني عشر'], num: 12 },
  { words: ['الثالث عشر'], num: 13 },
  { words: ['الرابع عشر'], num: 14 },
  { words: ['الخامس عشر'], num: 15 },
  { words: ['السادس عشر'], num: 16 },
  { words: ['السابع عشر'], num: 17 },
  { words: ['الثامن عشر'], num: 18 },
  { words: ['التاسع عشر'], num: 19 },
  { words: ['العشرين', 'العشرون'], num: 20 },
  { words: ['الأول', 'الاول'], num: 1 },
  { words: ['الثاني'], num: 2 },
  { words: ['الثالث'], num: 3 },
  { words: ['الرابع'], num: 4 },
  { words: ['الخامس'], num: 5 },
  { words: ['السادس'], num: 6 },
  { words: ['السابع'], num: 7 },
  { words: ['الثامن'], num: 8 },
  { words: ['التاسع'], num: 9 },
  { words: ['العاشر'], num: 10 }
];

function convertArabicDigits(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, w => arabicDigits.indexOf(w).toString());
}

export function extractLessonNumber(lesson: Partial<QuranLesson>): number {
  const title = lesson.title || '';
  
  for (const entry of ordinalMap) {
    for (const word of entry.words) {
      if (title.includes(word)) {
        return entry.num;
      }
    }
  }

  const normalizedTitle = convertArabicDigits(title);
  const match = normalizedTitle.match(/الدرس\s*(\d+)/i) || normalizedTitle.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  if (typeof lesson.order === 'number' && lesson.order > 0) {
    return lesson.order;
  }

  return 999;
}

export function sortQuranLessons(lessons: QuranLesson[]): QuranLesson[] {
  return [...lessons].sort((a, b) => {
    const numA = extractLessonNumber(a);
    const numB = extractLessonNumber(b);
    if (numA !== numB) return numA - numB;
    if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
    return (a.title || '').localeCompare(b.title || '', 'ar');
  });
}

const ordinalWords: Record<number, string> = {
  1: "الدرس الأول",
  2: "الدرس الثاني",
  3: "الدرس الثالث",
  4: "الدرس الرابع",
  5: "الدرس الخامس",
  6: "الدرس السادس",
  7: "الدرس السابع",
  8: "الدرس الثامن",
  9: "الدرس التاسع",
  10: "الدرس العاشر",
  11: "الدرس الحادي عشر",
  12: "الدرس الثاني عشر",
  13: "الدرس الثالث عشر",
  14: "الدرس الرابع عشر",
  15: "الدرس الخامس عشر",
  16: "الدرس السادس عشر",
  17: "الدرس السابع عشر",
  18: "الدرس الثامن عشر",
  19: "الدرس التاسع عشر",
  20: "الدرس العشرون",
  21: "الدرس الحادي والعشرون",
  22: "الدرس الثاني والعشرون",
  23: "الدرس الثالث والعشرون",
  24: "الدرس الرابع والعشرون",
  25: "الدرس الخامس والعشرون",
  26: "الدرس السادس والعشرون",
  27: "الدرس السابع والعشرون",
  28: "الدرس الثامن والعشرون",
  29: "الدرس التاسع والعشرون",
  30: "الدرس الثلاثون",
};

export function formatLessonDisplayTitle(
  title: string,
  order?: number,
  index?: number,
  seriesTitle?: string
): string {
  const fallbackNum = (order && order > 0) ? order : (typeof index === "number" ? index + 1 : 1);
  const fallbackTitle = ordinalWords[fallbackNum] || `الدرس ${fallbackNum}`;

  if (!title) {
    return fallbackTitle;
  }
  let clean = title.trim();

  // Specifically check if it belongs to Aal-Imran or Al-Ma'idah or has such terms
  const isAalImran = /آل\s*عمران/i.test(clean) || (seriesTitle && /آل\s*عمران/i.test(seriesTitle));
  const isMaidah = /المائدة/i.test(clean) || (seriesTitle && /المائدة/i.test(seriesTitle));

  if (isAalImran || isMaidah) {
    // Check if there is an ordinal word in the title
    for (const entry of ordinalMap) {
      for (const word of entry.words) {
        if (clean.includes(word)) {
          return ordinalWords[entry.num] || `الدرس ${entry.num}`;
        }
      }
    }

    // Check for digits (e.g. الدرس 1, 2, etc.)
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const normalizedDigits = clean.replace(/[٠-٩]/g, w => arabicDigits.indexOf(w).toString());
    const matchDigit = normalizedDigits.match(/(\d+)/);
    if (matchDigit) {
      const num = parseInt(matchDigit[1], 10);
      return ordinalWords[num] || `الدرس ${num}`;
    }

    // If order or index is present
    if (order && order > 0) {
      return ordinalWords[order] || `الدرس ${order}`;
    }
    if (typeof index === "number") {
      return ordinalWords[index + 1] || `الدرس ${index + 1}`;
    }

    return fallbackTitle;
  }

  // General cleanup for other series
  clean = clean
    .replace(/^(دروس\s+)?(آيات\s+من\s+)?سورة\s+[^\s–-]+[-–:]*\s*/gi, "")
    .replace(/^(دروس\s+)?(آيات\s+من\s+)[^\s–-]+[-–:]*\s*/gi, "")
    .trim();

  if (clean === "الدرس الاول" || clean === "الدرس الأول" || clean === "الاول" || clean === "الأول") {
    return "الدرس الأول";
  }

  if (!clean) {
    return fallbackTitle;
  }

  // Check if it's like "الدرس 1", "الدرس 2", "الدرس ١"
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const normalizedForDigits = clean.replace(/[٠-٩]/g, w => arabicDigits.indexOf(w).toString());
  const matchNum = normalizedForDigits.match(/^الدرس\s*(\d+)$/);
  if (matchNum) {
    const parsed = parseInt(matchNum[1], 10);
    if (ordinalWords[parsed]) {
      return ordinalWords[parsed];
    }
  }

  return clean;
}

export function processQuranData(importedData: any) {
  const rawSeries: QuranSeries[] = (importedData?.series || []) as QuranSeries[];
  const rawLessons: QuranLesson[] = (importedData?.lessons || []) as QuranLesson[];
  const rawExcerpts: QuranExcerpt[] = ((importedData?.excerpts || []) as any[]).map((e, idx) => ({
    id: e.id || `excerpt-${idx + 1}`,
    title: e.title || "مقتطف نوراني",
    content: e.content || "",
    source: e.source || "هدي القرآن الكريم",
    author: e.author || "السيد حسين بدر الدين الحوثي",
    status: e.status || "published",
    mediaUrl: e.mediaUrl || undefined,
    createdAt: e.createdAt || Date.now(),
  }));
  const rawSyllabuses: QuranSyllabus[] = (importedData?.syllabuses || []) as QuranSyllabus[];

  // Reorganize series to combine IDs "4", "5", "6", "7" into a single series "4"
  // named "معرفة الله"
  const processedSeries: QuranSeries[] = rawSeries.reduce<QuranSeries[]>((acc, s) => {
    if (s.id === "4") {
      acc.push({
        ...s,
        title: "معرفة الله",
      });
    } else if (s.id === "5" || s.id === "6" || s.id === "7") {
      // Skip these sub-series
    } else {
      acc.push(s);
    }
    return acc;
  }, []).map((s, idx) => ({ ...s, order: idx + 1 }));

  // Map lessons belonging to "5", "6", "7" to the consolidated series "4"
  const processedLessons: QuranLesson[] = rawLessons.map((l) => {
    if (l.seriesId === "5" || l.seriesId === "6" || l.seriesId === "7") {
      return {
        ...l,
        seriesId: "4",
      };
    }
    return l;
  });

  const sortedLessons = sortQuranLessons(processedLessons);

  return {
    series: processedSeries,
    lessons: sortedLessons,
    syllabuses: rawSyllabuses,
    excerpts: rawExcerpts
  };
}

// Keeping empty defaults for initial load
export const STATIC_QURAN_SERIES: QuranSeries[] = [];
export const STATIC_QURAN_LESSONS: QuranLesson[] = [];
export const STATIC_QURAN_SYLLABUSES: QuranSyllabus[] = [];
export const STATIC_QURAN_EXCERPTS: QuranExcerpt[] = [];
