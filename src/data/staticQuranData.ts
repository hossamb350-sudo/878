import { QuranSeries, QuranLesson, QuranSyllabus, QuranExcerpt } from "../types";
import importedData from "./importedQuranData.json";

export const STATIC_QURAN_SERIES: QuranSeries[] = importedData.series as QuranSeries[];
export const STATIC_QURAN_LESSONS: QuranLesson[] = importedData.lessons as QuranLesson[];
export const STATIC_QURAN_SYLLABUSES: QuranSyllabus[] = [];
export const STATIC_QURAN_EXCERPTS: QuranExcerpt[] = [];
