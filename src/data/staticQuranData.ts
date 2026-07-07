import { QuranSeries, QuranLesson, QuranSyllabus, QuranExcerpt } from "../types";
import { importedQuranData as importedData } from "./importedQuranData";

const rawSeries: QuranSeries[] = (importedData?.series || []) as QuranSeries[];
const rawLessons: QuranLesson[] = (importedData?.lessons || []) as QuranLesson[];

// Reorganize series to combine IDs "4", "5", "6", "7" into a single series "4"
// named "السلسلة الثالثة - معرفة الله"
export const STATIC_QURAN_SERIES: QuranSeries[] = rawSeries.reduce<QuranSeries[]>((acc, s) => {
  if (s.id === "4") {
    acc.push({
      ...s,
      title: "السلسلة الثالثة - معرفة الله",
    });
  } else if (s.id === "5" || s.id === "6" || s.id === "7") {
    // Skip these sub-series
  } else {
    acc.push(s);
  }
  return acc;
}, []).map((s, idx) => ({ ...s, order: idx + 1 }));

// Map lessons belonging to "5", "6", "7" to the consolidated series "4"
export const STATIC_QURAN_LESSONS: QuranLesson[] = rawLessons.map((l) => {
  if (l.seriesId === "5" || l.seriesId === "6" || l.seriesId === "7") {
    return {
      ...l,
      seriesId: "4",
    };
  }
  return l;
});

export const STATIC_QURAN_SYLLABUSES: QuranSyllabus[] = [];
export const STATIC_QURAN_EXCERPTS: QuranExcerpt[] = [];
