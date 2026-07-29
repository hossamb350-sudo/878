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

export function processQuranData(importedData: any) {
  const rawSeries: QuranSeries[] = (importedData?.series || []) as QuranSeries[];
  const rawLessons: QuranLesson[] = (importedData?.lessons || []) as QuranLesson[];
  const rawExcerpts: QuranExcerpt[] = (importedData?.excerpts || []) as QuranExcerpt[];
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
