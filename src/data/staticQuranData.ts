import { QuranSeries, QuranLesson, QuranSyllabus, QuranExcerpt } from "../types";

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

  return {
    series: processedSeries,
    lessons: processedLessons,
    syllabuses: rawSyllabuses,
    excerpts: rawExcerpts
  };
}

// Keeping empty defaults for initial load
export const STATIC_QURAN_SERIES: QuranSeries[] = [];
export const STATIC_QURAN_LESSONS: QuranLesson[] = [];
export const STATIC_QURAN_SYLLABUSES: QuranSyllabus[] = [];
export const STATIC_QURAN_EXCERPTS: QuranExcerpt[] = [];
