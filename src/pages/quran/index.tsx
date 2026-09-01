import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useSearchParams } from "react-router-dom";
import {
  QuranSeries,
  QuranLesson,
  QuranSyllabus,
  QuranExcerpt,
  QuranLastRead,
} from "../../types";
import { SyncService } from "../../services/SyncService";
import {
  Menu,
  Info,
  MoreVertical,
  Search,
  Library,
  Bookmark,
  Trophy,
  Mic,
  Undo2,
  Calendar,
  Quote,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BookOpenCheck,
  BookText,
  Scroll,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Shield,
  Clock,
  Check,
  Copy,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getShareableUrl } from "../../config/apiConfig";
import { shareContent } from "../../utils/share";
import { SEO } from "../../components/SEO";
import { QuranReader } from "../../components/QuranReader";
import { QuranStats } from "../../components/QuranStats";
import { QuranKareem } from "../../components/QuranKareem";
import { IslamicExcerptCard, IslamicOrnamentDivider } from "../../components/AdminQuranExcerpts";
import { STATIC_QURAN_SERIES, STATIC_QURAN_LESSONS, processQuranData, sortQuranLessons, formatLessonDisplayTitle } from "../../data/staticQuranData";
import { loadQuranMetadata, loadLessonContent } from "../../data/importedQuranData";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type QuranView =
  | "series"
  | "lessons"
  | "lesson-detail"
  | "syllabuses"
  | "syllabus-detail"
  | "excerpts"
  | "excerpt-detail"
  | "stats"
  | "leader"
  | "quran";

// --- Sub-components moved outside to prevent re-mounting on every state update ---

const SyllabusDetailView = (props: any) => <div className="p-4 text-center">تفاصيل المنهج (قيد التطوير)</div>;

const ProgressBar = ({ percentage }: { percentage: number }) => (
  <div className="w-full bg-surface-main h-1 rounded-full mt-3 overflow-hidden">
    <div style={{ width: `${percentage}%` }} className="h-full bg-taiz-sky" />
  </div>
);

const QuranSearchView = ({
  searchQuery,
  lessonsList,
  excerptsList,
  scrollRef,
  onNavigateToLesson,
  onSelectExcerpt,
  seriesList,
}: any) => {
  const results = [
    ...lessonsList
      .filter(
        (l: any) =>
          l.title.includes(searchQuery) || (l.content && l.content.includes(searchQuery))
      )
      .map((l: any) => ({ ...l, type: "lesson" as const })),
    ...excerptsList
      .filter(
        (e: any) =>
          e.title.includes(searchQuery) || (e.content && e.content.includes(searchQuery))
      )
      .map((e: any) => ({ ...e, type: "excerpt" as const })),
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 relative" ref={scrollRef}>
      <div className="space-y-3 max-w-lg mx-auto">
        {searchQuery.length < 2 ? (
          <p className="text-center text-text-muted py-10">
            اكتب كلمة واحدة على الأقل للبحث...
          </p>
        ) : results.length === 0 ? (
          <p className="text-center text-text-muted py-10">
            لم يتم العثور على نتائج لـ "{searchQuery}"
          </p>
        ) : (
          results.map((item: any) => {
            const isLesson = item.type === "lesson";
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isLesson) {
                    const series = seriesList.find(
                      (s: any) => s.id === item.seriesId
                    );
                    if (series) onNavigateToLesson(item as QuranLesson, series);
                  } else {
                    onSelectExcerpt(item as QuranExcerpt);
                  }
                }}
                className="w-full bg-surface-card p-4 rounded-xl flex flex-col gap-1 border border-border-light text-right shadow-sm focus:outline-none"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text-primary">
                    {item.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-surface-main rounded text-text-secondary font-bold">
                    {isLesson ? "درس" : "مقتطف"}
                  </span>
                </div>
                <p className="text-xs text-text-muted line-clamp-1">
                  {item.content}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const formatLessonCount = (count: number) => {
  if (count === 1) return "درس واحد";
  if (count === 2) return "درسان";
  if (count >= 3 && count <= 10) return `${count} دروس`;
  return `${count} درساً`;
};

const SeriesView = ({
  seriesList,
  lessonsList = [],
  onSelectSeries,
  scrollRef,
}: any) => {
  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-4 bg-white transition-colors duration-300" ref={scrollRef}>
      <div className="max-w-[760px] mx-auto space-y-6 pb-16">
        {/* سلاسل هدي القرآن */}
        <div className="space-y-3">
          {seriesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-white dark:bg-stone-900 rounded-[14px] border border-slate-200/60 dark:border-slate-800/60 p-6">
              <Library className="w-12 h-12 text-stone-200 mb-2" />
              <p className="text-slate-400 font-bold font-cairo text-xs">لا توجد سلاسل متاحة حالياً</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {seriesList.sort((a: any, b: any) => a.order - b.order).map((series: any, idx: number) => {
                const count = lessonsList.filter((l: any) => l.seriesId === series.id).length;

                return (
                  <motion.div
                    key={series.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <button
                      onClick={() => onSelectSeries(series)}
                      className="w-full group relative bg-white dark:bg-stone-900 rounded-[12px] sm:rounded-[14px] p-3 sm:p-3.5 flex items-center justify-between gap-3 text-right transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-xs border border-slate-200/60 dark:border-slate-800/60 active:scale-[0.99] cursor-pointer"
                      dir="rtl"
                    >
                      {/* Middle: Content */}
                      <div className="flex-1 flex flex-col items-start overflow-hidden min-w-0">
                        <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 transition-colors group-hover:text-taiz-sky font-cairo leading-tight">
                          {series.title?.replace("سلسلة ", "").replace("السلسلة ", "")}
                        </h3>

                        {/* Footer Info */}
                        <div className="w-full flex items-center gap-2 mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                          {/* Lessons Count */}
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                            <BookText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] sm:text-[11px] font-bold font-cairo">
                              {formatLessonCount(count)}
                            </span>
                          </div>

                          {/* Conditional Metadata for Al-Imran and Al-Ma'idah */}
                          {(series.title?.includes("آل عمران") || series.title?.includes("المائدة")) && (
                            <>
                              <div className="w-px h-2.5 bg-slate-200 dark:bg-slate-700" />
                              <div className="flex items-center gap-1">
                                <Scroll className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 font-cairo">
                                  {series.title?.includes("آل عمران") ? "200" : "120"} آية
                                </span>
                              </div>
                              <div className="w-px h-2.5 bg-slate-200 dark:bg-slate-700" />
                              <div className="flex items-center gap-1">
                                <Compass className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 font-cairo">
                                  مدنية
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Left Side: Arrow Button */}
                      <div className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 dark:bg-stone-800 text-slate-400 group-hover:bg-taiz-sky group-hover:text-white transition-all shadow-xs">
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LessonsView = ({
  selectedSeries,
  lessonsList,
  lessonProgress,
  onNavigateToLesson,
  scrollRef,
}: any) => {
  const seriesLessons = sortQuranLessons(
    lessonsList.filter((l: any) => l.seriesId === selectedSeries?.id)
  );

  const handleShareLesson = async (e: React.MouseEvent, lesson: any, displayTitle: string) => {
    e.stopPropagation();
    e.preventDefault();
    await shareContent({
      title: displayTitle,
      type: "lesson",
      id: lesson.id,
      seriesId: lesson.seriesId || selectedSeries?.id,
    });
  };
  
  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-4 sm:py-6 relative bg-white" ref={scrollRef}>
      <div className="max-w-[760px] mx-auto space-y-4 pb-20">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-3 px-1 py-1 select-none mb-2" dir="rtl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-taiz-royal to-taiz-sky flex items-center justify-center shadow-xs shrink-0 text-white">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-right">
              <h2 className="font-extrabold text-[14px] sm:text-[15px] text-slate-900 dark:text-white font-cairo leading-tight">
                دروس {selectedSeries?.title?.replace("سلسلة ", "").replace("السلسلة ", "") || "السلسلة"}
              </h2>
              <p className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium font-cairo truncate">
                {selectedSeries?.description || "قائمة المحاضرات والدروس العلمية"}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg font-cairo shrink-0">
            {seriesLessons.length} دروس
          </span>
        </div>

        {/* Fourth: Lessons List */}
        {seriesLessons.length === 0 ? (
          <p className="text-center text-text-muted py-20 font-bold bg-white/50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 font-cairo">
            لا توجد دروس في هذه السلسلة أو لم يتم إضافتها بعد.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {seriesLessons.map((lesson: any, index: number) => {
              const progress = lessonProgress?.[lesson.id] || 0;
              const displayTitle = formatLessonDisplayTitle(lesson.title, lesson.order, index, selectedSeries?.title);
              
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div
                    onClick={() => onNavigateToLesson(lesson, selectedSeries!)}
                    className="w-full group relative bg-white dark:bg-stone-900 rounded-[12px] sm:rounded-[14px] p-3 sm:p-3.5 flex items-center justify-between gap-3 text-right transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-xs border border-slate-200/60 dark:border-slate-800/60 active:scale-[0.99] cursor-pointer"
                    dir="rtl"
                  >
                    {/* Middle: Content */}
                    <div className="flex-1 flex flex-col items-start min-w-0">
                      <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-white mb-0.5 line-clamp-1 group-hover:text-taiz-sky transition-colors font-cairo leading-tight">
                        {displayTitle}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 font-cairo">
                          ضمن: {selectedSeries?.title?.replace("سلسلة ", "").replace("السلسلة ", "")}
                        </span>
                      </div>

                      {/* Excerpt */}
                      {lesson.content && (
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-cairo mb-1 w-full">
                          {lesson.content.split('\n')[0]}
                        </p>
                      )}
                      
                      {progress > 0 && (
                        <div className="mt-1 w-full max-w-[130px]">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-bold font-cairo">
                            <span>نسبة الإنجاز</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-stone-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-taiz-sky to-taiz-royal transition-all duration-500 rounded-full" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Side: Actions (Share + Arrow Button) */}
                    <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleShareLesson(e, lesson, displayTitle)}
                        className="p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-stone-800 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="مشاركة الدرس"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 dark:bg-stone-800 text-slate-400 group-hover:bg-taiz-sky group-hover:text-white transition-all shadow-xs">
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const SyllabusesView = ({
  syllabusesList,
  lessonsList,
  seriesList,
  onSelectLesson,
  scrollRef,
}: any) => {
  const now = Date.now();
  const activeSyllabuses = (syllabusesList || []).filter((s: any) => {
    if (s.expiresAt && now > s.expiresAt) return false;
    if (s.endDate) {
      const endMs = typeof s.endDate === "number" ? s.endDate : new Date(s.endDate).setHours(23, 59, 59, 999);
      if (!isNaN(endMs) && now > endMs) return false;
    }
    return true;
  });

  const handleShareSyllabus = async (e: React.MouseEvent, syllabus: any, lessonTitle: string, seriesId?: string) => {
    e.stopPropagation();
    e.preventDefault();
    await shareContent({
      title: `المقرر: ${lessonTitle}`,
      type: "syllabus",
      id: syllabus.id,
      seriesId: seriesId,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 relative" ref={scrollRef}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
          {activeSyllabuses.length === 0 ? (
            <p className="text-center text-text-muted py-10 col-span-full font-bold font-cairo">
              لا توجد مقررات دراسية حالية.
            </p>
          ) : (
            activeSyllabuses.map((item: any) => {
              // 1. Resolve original lesson from lessonsList
              const matchedLesson = (lessonsList || []).find((l: any) => l.id === item.lessonId);
              const lesson = matchedLesson || {
                id: item.lessonId,
                title: item.lessonTitle || "درس مقرر",
                seriesId: item.seriesId || "",
                seriesTitle: item.seriesTitle || "",
                order: 0,
              };

              // 2. Resolve series
              const matchedSeries = (seriesList || []).find((s: any) => s.id === (lesson.seriesId || item.seriesId));
              const series = matchedSeries || {
                id: item.seriesId || lesson.seriesId || "default-series",
                title: item.seriesTitle || (lesson as any).seriesTitle || "هدي القرآن الكريم",
                description: "",
                order: 1,
              };

              const displayTitle = formatLessonDisplayTitle(
                lesson.title || item.lessonTitle,
                lesson.order,
                undefined,
                series.title || item.seriesTitle
              );

              // Date calculation
              let dateText = "";
              if (item.startDate && item.endDate) {
                const sDate = typeof item.startDate === "number" ? new Date(item.startDate).toLocaleDateString("ar-EG") : item.startDate;
                const eDate = typeof item.endDate === "number" ? new Date(item.endDate).toLocaleDateString("ar-EG") : item.endDate;
                dateText = `من ${sDate} إلى ${eDate}`;
              } else if (item.endDate) {
                const eDate = typeof item.endDate === "number" ? new Date(item.endDate).toLocaleDateString("ar-EG") : item.endDate;
                dateText = `ينتهي في: ${eDate}`;
              } else if (item.expiresAt) {
                dateText = `ينتهي في: ${new Date(item.expiresAt).toLocaleDateString("ar-YE")}`;
              }

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectLesson(lesson, series)}
                  className="bg-white dark:bg-stone-900 p-3 sm:p-3.5 rounded-[12px] sm:rounded-[14px] shadow-xs border border-slate-200/60 dark:border-slate-800/60 hover:border-taiz-sky/40 hover:shadow-md transition-all duration-300 text-right flex flex-col justify-between items-start gap-2 focus:outline-none relative overflow-hidden group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="text-[10px] sm:text-[11px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold font-cairo">
                      المقرر الأسبوعي
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleShareSyllabus(e, item, displayTitle, series.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer active:scale-95"
                      title="مشاركة المقرر"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right w-full">
                    <span className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-white font-cairo group-hover:text-taiz-sky transition-colors line-clamp-2">
                      {displayTitle}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {series.title || item.seriesTitle || "هدي القرآن الكريم"}
                    </span>
                  </div>
                  {dateText && (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold font-cairo mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{dateText}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const ExcerptsView = ({
  excerptsList,
  onSelectExcerpt,
  scrollRef,
}: {
  excerptsList: QuranExcerpt[];
  onSelectExcerpt: (excerpt: QuranExcerpt) => void;
  scrollRef: any;
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 relative" ref={scrollRef} dir="rtl">
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Excerpts Grid */}
        {excerptsList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-amber-500/20 text-slate-500 font-bold font-cairo space-y-2">
            <Quote className="w-8 h-8 mx-auto text-amber-500/40 transform scale-x-[-1]" />
            <p>لا توجد مقتطفات حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {excerptsList.map((item) => (
              <IslamicExcerptCard
                key={item.id}
                excerpt={item}
                onSelect={() => onSelectExcerpt(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ExcerptDetailView = ({
  selectedExcerpt,
  scrollRef,
  onBack,
}: {
  selectedExcerpt: QuranExcerpt | null;
  scrollRef: any;
  onBack: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  if (!selectedExcerpt) {
    return (
      <div className="flex-1 p-8 text-center font-bold font-cairo text-slate-500" dir="rtl">
        لم يتم تحديد مقتطف.
        <button onClick={onBack} className="block mx-auto mt-4 text-amber-600 font-bold font-cairo">
          العودة للقائمة
        </button>
      </div>
    );
  }

  const hasSource = Boolean(
    selectedExcerpt.source &&
      typeof selectedExcerpt.source === "string" &&
      selectedExcerpt.source.trim().length > 0 &&
      selectedExcerpt.source.trim() !== "غير محدد" &&
      selectedExcerpt.source.trim() !== "null" &&
      selectedExcerpt.source.trim() !== "undefined"
  );

  const hasAuthor = Boolean(
    selectedExcerpt.author &&
      typeof selectedExcerpt.author === "string" &&
      selectedExcerpt.author.trim().length > 0 &&
      selectedExcerpt.author.trim() !== "غير محدد" &&
      selectedExcerpt.author.trim() !== "null" &&
      selectedExcerpt.author.trim() !== "undefined"
  );

  const handleCopy = () => {
    let textToCopy = `« ${selectedExcerpt.title || "مقتطف"} »\n\n"${selectedExcerpt.content || ""}"`;
    if (hasAuthor) textToCopy += `\n👤 ${selectedExcerpt.author}`;
    if (hasSource) textToCopy += `\n📌 ${selectedExcerpt.source}`;
    textToCopy += `\nمنصة تعز الإعلامية`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    await shareContent({
      title: selectedExcerpt.title || "مقتطف",
      type: "excerpt",
      id: selectedExcerpt.id,
      imageUrl: selectedExcerpt.mediaUrl,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 relative bg-slate-50/50 dark:bg-stone-950" ref={scrollRef} dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back Button & Actions Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-3.5 py-2 rounded-xl transition-all font-cairo cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>العودة لقائمة المقتطفات</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 px-3 py-1.5 rounded-xl hover:border-amber-500 transition-colors font-cairo shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "تم النسخ" : "نسخ النص"}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors font-cairo shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>

        {/* Main Luxury Islamic Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-lg p-5 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Top Decorative Stripe */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-500" />

          {/* Background Ambient Glows */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header: Ornament & Title - Full Title Display */}
          <div className="text-center space-y-2 select-none">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md mx-auto">
              <Quote className="w-6 h-6 transform scale-x-[-1]" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-cairo leading-snug break-words">
              {selectedExcerpt.title}
            </h1>
          </div>

          {/* Excerpt Media Image (Optional) */}
          {selectedExcerpt.mediaUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
              <img
                src={selectedExcerpt.mediaUrl}
                alt={selectedExcerpt.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {/* Excerpt Core Body */}
          <div className="relative px-2 sm:px-4 py-2">
            <Quote className="absolute -top-3 -right-2 w-10 h-10 text-amber-500/15 dark:text-amber-400/10 pointer-events-none transform scale-x-[-1]" />
            <p className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 font-cairo leading-[2.2] text-justify whitespace-pre-wrap">
              {selectedExcerpt.content}
            </p>
            <Quote className="absolute -bottom-3 -left-2 w-10 h-10 text-emerald-500/15 dark:text-emerald-400/10 pointer-events-none" />
          </div>

          {/* Details Section: Author & Source conditionally rendered */}
          {(hasAuthor || hasSource) && (
            <div className={`grid gap-3 pt-2 ${hasAuthor && hasSource ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {/* Author */}
              {hasAuthor && (
                <div className="bg-amber-50/50 dark:bg-stone-950/60 p-3.5 rounded-2xl border border-amber-500/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-right font-cairo">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                      {selectedExcerpt.author}
                    </span>
                  </div>
                </div>
              )}

              {/* Source (Book/Reference) */}
              {hasSource && (
                <div className="bg-emerald-50/50 dark:bg-stone-950/60 p-3.5 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-right font-cairo">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                      {selectedExcerpt.source}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LessonDetailView = ({
  selectedLesson,
  selectedSeries,
  bookmarks,
  notes,
  highlights,
  jumpToParagraphIndex,
  jumpToExactId,
  isLoading,
  onBack,
  onToggleBookmark,
  onSaveNote,
  onDeleteNote,
  onToggleHighlight,
  onDeleteHighlight,
  onProgressUpdate,
  onClearJump,
}: any) => {
  if (!selectedLesson) return null;
  const safeSeries = selectedSeries || {
    id: selectedLesson.seriesId || "default-series",
    title: (selectedLesson as any).seriesTitle || "هدي القرآن الكريم",
    description: "",
    order: 1,
  };
  return (
    <QuranReader
      lesson={selectedLesson}
      series={safeSeries}
      onBack={onBack}
      bookmarks={bookmarks}
      onToggleBookmark={onToggleBookmark}
      notes={notes}
      onSaveNote={onSaveNote}
      onDeleteNote={onDeleteNote}
      highlights={highlights}
      onToggleHighlight={onToggleHighlight}
      onDeleteHighlight={onDeleteHighlight}
      onProgressUpdate={onProgressUpdate}
      jumpToParagraphIndex={jumpToParagraphIndex}
      jumpToExactId={jumpToExactId}
      onClearJump={onClearJump}
      isLoading={isLoading}
    />
  );
};

const SidebarItem = ({
  icon,
  label,
  description,
  active = false,
  onClick,
}: {
  icon: any;
  label: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 transition-colors text-right focus:outline-none ${
      active ? "bg-taiz-navy/5" : "hover:bg-surface-hover"
    }`}
  >
    <span
      className={`p-2 rounded-xl bg-surface-main shadow-sm shrink-0 ${
        active ? "ring-2 ring-taiz-sky" : ""
      }`}
    >
      {icon}
    </span>
    <div className="flex flex-col text-right">
      <span
        className={`text-base font-black leading-tight font-cairo ${
          active ? "text-taiz-navy" : "text-text-secondary"
        }`}
      >
        {label}
      </span>
      {description && (
        <span className="text-[10px] text-text-secondary font-bold mt-1 whitespace-nowrap">
          {description}
        </span>
      )}
    </div>
  </button>
);

const Header = ({
  activeView,
  selectedSeries,
  selectedSyllabus,
  selectedExcerpt,
  isSearching,
  searchQuery,
  setIsSearching,
  setSearchQuery,
  setIsSidebarOpen,
  setActiveView,
}: any) => {
  let title = "الدروس";
  if (activeView === "leader") title = "الشهيد القائد";
  if (activeView === "lessons" && selectedSeries) title = selectedSeries.title;
  if (activeView === "syllabuses") title = "مقرر الدروس";
  if (activeView === "syllabus-detail" && selectedSyllabus)
    title = selectedSyllabus.title;
  if (activeView === "excerpts") title = "المقتطفات";
  if (activeView === "excerpt-detail" && selectedExcerpt)
    title = selectedExcerpt.title;
  if (activeView === "stats") title = "لوحة التقدم";
  if (activeView === "quran") title = "القرآن الكريم";

  return (
    <div className="bg-taiz-navy text-white pt-2 pb-0 relative z-20 shadow-md flex-shrink-0">
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative flex-1 flex items-center justify-center mx-2 overflow-hidden">
          {isSearching ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              className="flex items-center bg-white/10 rounded-lg px-3 overflow-hidden w-full"
            >
              <Search className="w-4 h-4 text-white/50 shrink-0" />
              <input
                autoFocus
                placeholder="بحث في الدروس والمقتطفات..."
                className="bg-transparent border-none outline-none p-2 w-full text-sm font-bold text-white focus:outline-none placeholder:text-white/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery("");
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <div className="bg-white/10 px-8 py-2 relative w-full text-center truncate rounded-lg">
              <span className="relative z-10 text-sm md:text-base font-black tracking-wider truncate block">
                {title}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isSearching && (
            <button
              onClick={() => setIsSearching(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            >
              <Search className="w-6 h-6" />
            </button>
          )}
          {activeView !== "series" &&
            activeView !== "syllabuses" &&
            activeView !== "excerpts" &&
            activeView !== "stats" && (
              <button
                onClick={() => {
                  if (activeView === "lessons") setActiveView("series");
                  else if (activeView === "syllabus-detail")
                    setActiveView("syllabuses");
                  else if (activeView === "excerpt-detail")
                    setActiveView("excerpts");
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeView,
  setActiveView,
  handleLastReadClick,
}: any) => (
  <AnimatePresence>
    {isSidebarOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-surface-main z-[101] shadow-strong overflow-hidden flex flex-col font-sans rtl"
          dir="rtl"
        >
          <div className="bg-surface-card p-8 flex flex-col items-center justify-center border-b border-border-light relative shrink-0">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 left-4 p-2 bg-surface-main hover:bg-surface-hover rounded-full focus:outline-none"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="w-20 h-20 mb-4 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border-2 border-border-light">
              <User className="w-12 h-12 text-red-600 translate-y-1.5" />
            </div>
            <h3 className="text-lg font-black text-text-primary font-cairo">
              هدي القرآن الكَريم
            </h3>
            <p className="text-text-secondary text-xs font-bold mt-1 text-center">
              الشهيد القائد السيد حسين بدرالدين الحوثي
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-4 bg-surface-main">
            <SidebarItem
              icon={<Shield className="w-5 h-5 text-red-600" />}
              label="الشهيد القائد"
              description="من هو الشهيد القائد؟"
              active={activeView === "leader"}
              onClick={() => {
                setActiveView("leader");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<BookOpen className="w-5 h-5 text-red-600" />}
              label="القرآن الكريم"
              description="تصفح واستمع لسور القرآن الكريم"
              active={activeView === "quran"}
              onClick={() => {
                setActiveView("quran");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<Library className="w-5 h-5 text-red-600" />}
              label="دروس الهدى"
              description="قائمة السلاسل والدروس الكاملة"
              active={activeView === "series" || activeView === "lessons"}
              onClick={() => {
                setActiveView("series");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<Trophy className="w-5 h-5 text-red-600" />}
              label="لوحة التقدم"
              description="متابعة إنجازك وإحصائيات القراءة"
              active={activeView === "stats"}
              onClick={() => {
                setActiveView("stats");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<Undo2 className="w-5 h-5 rotate-180 text-red-600" />}
              label="آخر قراءة"
              description="العودة لأخر درس توقفت عنده"
              onClick={handleLastReadClick}
            />
            <SidebarItem
              icon={<Calendar className="w-5 h-5 text-red-600" />}
              label="مقرر الدروس"
              description="المقررات الدراسية المحددة"
              active={
                activeView === "syllabuses" || activeView === "syllabus-detail"
              }
              onClick={() => {
                setActiveView("syllabuses");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<Quote className="w-5 h-5 text-red-600" />}
              label="المقتطفات"
              description="الجواهر المنتقاة من الدروس"
              active={
                activeView === "excerpts" || activeView === "excerpt-detail"
              }
              onClick={() => {
                setActiveView("excerpts");
                setIsSidebarOpen(false);
              }}
            />
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const LeaderView = ({ scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 md:py-12 relative custom-scrollbar" ref={scrollRef} dir="rtl">
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-surface-card p-6 md:p-10 lg:p-12 rounded-3xl shadow-lg border border-border-light relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-taiz-royal/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-taiz-sky/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-surface-main/30 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-taiz-royal/10 text-taiz-royal rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-taiz-royal text-center leading-tight md:leading-snug max-w-3xl font-cairo">
            ماذا يعني الحديث عن السيد القائد الشهيد حسين بن بدر الدين الحوثي ؟
          </h2>
        </div>
        
        <div className="space-y-10 text-text-secondary leading-loose text-sm md:text-base text-justify font-medium relative z-10">
          
          <div className="bg-taiz-royal/5 border-r-4 border-taiz-royal p-6 md:p-8 rounded-l-2xl shadow-sm">
            <p className="text-base md:text-lg font-bold text-text-primary leading-relaxed">
              الحديث عن السيد حسين هو حديث عن الإنسان الذي جسد كل معاني الإنسانية في حياته, هو حديث عن الرجل الذي تجلت فيه أسمى آيات الرجولة, حديث عن الشجاعة التي أذهلت العالم بكله, حديث عن الإباء والعزة الإيمانية, حديث عن القيم العظيمة والمبادئ السامية, حديث عن السمو في أمثلته العليا, هو حديث عن قرين القرآن الكريم ببصائره وبيناته وهداه , هو حديث عن العظماء الذين قل أن يجود بهم الزمان.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              مكان وتاريخ ميلاد السيد حسين بدر الدين الحوثي :
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              ولد بتاريخ شهر شعبان 1379هـ بمدينة الرويس بني بحر بمحافظة صعدة. وكما فتح عينيه على الدنيا على نور الإيمان والتقوى فإنه نشــأ وترعرع في رحاب القرآن الكريم وعلـوم أهل بيت النبوة صلوات الله عليهم فنهل من هــذا المعين الصافي النقي وتعلم من أبيه العلم والعمل معــاً والشعور بالمسئوليـة العظيمة تجاه أمته ودينه, وكلما شب وكبر كبر معه هذا الشــعور حتى أصبح رجلاً متميزاً منحه الله من العلم والوعي والحكمة والبصيرة والكرم والأخــلاق العالية والتعقل والصبر وسعــة الصدر والشجاعة وغيرهــا من صفات الكمـال ما يبهر كل من عرفه وجالسه.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              كان السيد حسين محل إعجاب كل من عرفه
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              السيد حسين رضوان الله عليه كان محل إعجاب كل من عرفوه, فبعضهم أعجب به لكرمه وسخائه, والآخرون كان مصدر إعجابهم شجاعتــه التي كانت مضرب المثل في المناطق التي عرف فيها , والبعض الآخر سحرهم تواضعـه وكرم أخلاقه, وفريق آخر اندهش لعلمه ومعرفته فوجد نفسه أمــام بحر من العلم لا يدرك قعـره أمـا بعضهم فمدح فيه حكمته وبعد نظره, آخرون أحبوه لحبــه للناس واهتمامه بهم, والكثير الكثير دخل قلوبهم لمواقف الإحسان التي تميز واشتهر بها..
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              فمن هو أبوه؟
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              والده: هو السيد المجاهد فقيه القرآن/ بدر الدين بن أمير الدين بن الحسين ابن محمد الحوثي رحمه الله. فأبوه هو الذي عرف بين الجميع بعلمه وتقواه وخشيته من الله واستشعاره للمسؤولية, وشجاعته في قول الحق, وبأنه لا يخشى في الله لومة لائم وعرف بين الخــاصة والعــامة بالـورع والتقوى وممارسة الأعمـــال الصالحـة وكان كثير الاهتمام بإرشـاد الناس وإصلاحهم وتعليمهم أمور دينهم ودنيــاهم وحل جميع مشاكلـــهم, وكان يولي الفقراء والمحتــاجين اهتماماً خاصاً فكان بيتــه عـامراً بطلاب العلـم وأصحـاب الحاجات وحل المشــاكل وقضــاء الحوائـج وكان يستخــدم مـنبر الجمـعة والمنـاسبات الدينية لتربية الناس وتوعيتهم وتوجيههم. ويوضح السيد حسين كيف كان والده يدفع به وبإخوته إلى تحمل المسئولية الدينية مهما كانت التضحيات ففي محاضرة [توصيات لطلاب الدورة] تحدث بأن والده الذي يملك ثلاثة عشر ولدا هو أحدهم لم يسمع منه في يوم من الأيام بأنه كان يقول لأحد من أولاده أن يترك العمل الذي فيه لله رضا أو يطلب منه أن يحافظ على حياته وهو يتحرك ويعمل للحق. ويؤكد السيد حسين بأن ذلك لا يعني بأن والده لم يكن يهمه سلامة أولاده ولكنه يعرف بأن الأفضل لولده أن يدخل في أعمال وإن كان فيها تضحية بنفسه لا يمنعه من ذلك أو يدفعه إلى الابتعاد عن هذا العمل أو يربيه على الجبن والخوف أو التخلي عن المسئولية.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              الدور الإنساني والاجتماعي.
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              عرف السيد لدى القريب والبعيد والعدو والصديق بأدوار مهمة بما فيه خدمة المجتمع بجناحيه الرجل والمرأة فقد كان يعيش معاناة المجتمع ويتألم لواقعهم فعمل على تحقيق العديد من المشاريع الخدمية في العديد من المناطق التي تصل إليها يده.وأنشأ جمعية مران الاجتماعية الخيرية وقدم من خلالها العديد من المشاريــع المهمة وبالذات لمنطقة مران التي كانت تمثل محل إقامته الرئيسي رغم الصعوبــات التي كان يواجهها من بعض مسئولي الدولـــة في المحافظــة والذين لا يهمهم إلا تحقيق مصالحهم.فبنى العديد من المدارس الدينية والرسمية كما عمل على المتابعة لبناء مستوصف كبير في مران وجهزه بكادر من المنطقة وبعث بمجاميع من البنين والبنات للدورات في المجال الصحي في صنعاء وصعدة وعمل على فتح خطوط إلى المناطق التي لم يصل إليها الخط وتابع حتى حصل على العديد من البرك في عدد من المناطق وكذلك الكهرباء تابعها حتى توفرت شبكة كهرباء لمنطقة مران والمناطق المجاورة لها وقام ببناء مصلى للعيد في منطقة مران تتسع لكل أهالي المنطقة وعمل شخصيا في تلك المشاريع حيث كان دائما في مقدمة من يعمل بيديه. كما عرف بين أبناء المنطقة بأخلاقه العالية وبروحه التي تلامس مشاعر الناس وآمالهم وآلامهم فقد كان ملاذا للمظلومين والمحتاجين والفقراء والمساكين كما عرف برحمته وشفقته حتى بالحيوانات مما جعله محط إعجاب الناس .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد حسين في مجلس النواب
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              عندما دخل السيد حسين إلى مجلس النواب ممثلاً للدائرة (294) في محافظة صعــده عـام 1993م نائبا من نواب حزب الحق حرص السيد على أن يوسع علاقاته بالشخصيات الاجتماعية المخلصة. وكان له دور بارز ومهم في مجلس النواب من حيث صياغة القوانين ومحاربة الفساد المتفشي داخل هذه السلطة وعرف السيد بين الأعضاء برؤيته الحكيمة وقدرته الخطابية وبلاغته العالية وجرأته في مواجهة الباطل حتى أن السيد حسين لم يوقع خلال الفترة التي قضاها في مجلس النواب على أي قرض لعلمه بأن هذه القروض تصل إلى جيوب المتنفذين داخل النظام وأنها لا تعني الشعب لا من قريب ولا من بعيد.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              موقف السيد من الحرب على الجنوب.
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              كان للسيد دور بارز ومعروف فيما يتعلق بالأزمة التي تلت الوحدة اليمنية وأدت إلى حرب صيف 94م حيث كان دوره هو دور الحريص على مصلحة البلد والحفاظ على وحدته وسلامته فكان هو ضمن فريق المصالحة بين الطرفين المتصارعين وعمل بكل جد واهتمام على تجنيب اليمن حربا كانت قد أطلت برأسها وبعد عناء وتعب في محاولة رأب الصدع شعر السيد أن عشاق السلطة ذاهبون إلى الحرب فنأى السيد حسين بنفسه وبأتباعه أن يكونوا شركاء في سفك الدماء وهتك الأعراض ومصادرة الممتلكات بنفسه فقام بالخروج إلى محافظة صعدة رغم أن السلطة التابعة لبيت الأحمر كانت قد فرضت إقامة إجبارية لأعضاء مجلس النواب حتى يضفوا شرعية على الحرب الظالمة والتأثير على الرأي العام اليمني والعالمي,إلا أن السيد لم يعبأ بهذا القرار وخرج إلى محافظة صعدة وأعلن رفضه للحرب لأن الخاسر فيها هو هذا الشعب المظلوم ومن خلال المظاهرات التي قادها في صعدة أعلن عن موقفه وموقف أبناء هذه المحافظة مما يحصل من سفك للدماء اليمنية وهتك للحرمات من أجل السلطة والمال وظل على موقفه الرافض هذا حتى نهاية الحرب. ولم يخف على السلطة الظالمة هذا الموقف المعلن من السيد حسين وأنصاره في محافظة صعدة فعادوا من الجنوب وهم مهووسين بجنون العظمة ونشوة الانتصار الوهمي ليصبوا جام غضبهم على أنصار السيد حسين في مران وهمدان فنزلت الحملات العسكرية الكبيرة على أبناء مران وهمدان. ففي يوم السبت 16/6/1994م وصلت الأخبار إلى أسماع الناس بنزول حملة عسكرية كبيرة ظالمة، نزلت إلى مران، وعبثت بالبلاد، وضربت دور العلماء، واعتقلت أفضل أبناء المنطقة،وفي جبل مران أبدى الظالمون حقدهم بمحاولة تدمير بيت السيد العلامة بدر الدين الحوثي وبيت السيد حسين واقتادوا إلى السجن العشرات منهم ظلما وعدوانا أطفالا وشبابا وشيوخا وبقي البعض منهم في السجن لأكثر من عام دون محاكمة وهو ثمن دفعه السيد وأتباعه لمواقفهم الدينية والوطنية, ولم يكن ما حصل بالشيء الذي يمكن أن يوهن من عزيمة السيد حسين رضوان الله عليه عن المضي قدما في مواقفه المشرفة والقوية في مواجهة المفسدين والظالمين فعملوا على استهدافه شخصيا في صنعاء إلا أن رعاية الله كانت أكبر من مؤامراتهم.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3 font-cairo">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد يتسلم منحة دراسية إلى السودان
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              تسلم السيد حسين رضوان الله عليه منحة دراسية من جامعة صنعاء خلال عضويتـه لمجلس النواب ليكمـل دراستــه العليا في السودان وفي الجامعة كان للسيد حسين حضوره المهيب ومداخلاته العلمية التي كانت تثير إعجاب الدكاترة والطلاب فحظي بشعبية كبيرة بين أوساط المثقفين هناك وبعد عدة سنوات عــاد إلى البلاد ليقوم بتحضــير رسالة الماجستير في علوم القرآن الكريم .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد حسين في مرحلة التقييم لوضعية الأمة
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              تأمل السيد حسين كثيرا في واقع الأمة وبدأ يبحث ويدقق مستفيدا من تجارب الماضي من أين أتيت الأمة؟ ومن أين ضربت؟ وما الذي أوصلها إلى ما وصلت إليه؟ ومن خـلال غوصه في أعماق القرآن الكريم عرف الــداء الذي يفتك بجسم الأمة والذي طرحها أرضاً تئن تحت أقدام اليـهود والنصــارى إنها الثقافــات المغلوطة والعقائد الباطلة فقد كان يقول : [إذا تأمل الإنسـان في واقع الناس يجــد أننا ضحية عقائد باطلة وثقــافات مغــلوطة جاءتنــا من خارج الثقلين كتاب الله و عترة رسوله (صلوات الله عليه وعلى آله), ومن كلام له في لقائه مع مجموعه من طلاب العلم: يجب علينا أن نعتمد على القرآن الكريم اعتــماداً كبيراً وأن نتوب إلى الله ومما قال: (نحن إذا ما انطلقنا من الأساس وعنوان ثقافتنا أن نتثقف بالقرآن الكريم سنجد القرآن الكريم هو هكذا، عندما نتعلمه ونتبعه يزكينا يسمو بنا، يمنحنا الله به الحكمة، يمنحنا القوة، يمنحنا كل القيم، كل القيم التي لما ضاعت ,ضاعت الأمة بضياعها، كما هو حاصل الآن في وضع المسلمين، وفي وضع العرب بالذات. وشرف عظيم جداً لنا، ونتمنى أن نكون بمستوى أن نثقف الآخرين بالقرآن الكريم، وأن نتثقف بثقافة القرآن الكريم {'{'} ذَلِكَ فَضْلُ اللَّهِ يُؤْتِيهِ مَنْ يَشَاءُ وَاللَّهُ ذُو الْفَضْلِ الْعَظِيمِ {'}'} يؤتيه من يشاء فلنحاول أن نكون ممن يشاء الله أن يؤتوا هذا الفضل العظيم.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              ثقته القوية بالله وارتباطه به
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              لقد كان السيد حسين عظيم الثقة بالله تربطه بالله علاقة قوية يذكرك بالمتقين الذين وصفهم الإمام علي عليه السلام بقوله : (عظم الخالق في أنفسهم فصغر ما دونه في أعينهم) وكان يعرف أن من أكبر أزمات الأمة أن لا تثق بالله كما ينبغي مبينا أسباب أزمة الثقة هذه ومما يدل على ثقته العالية بالله سبحانه وتعالى أنه في الحرب الأولى وهو محاصر وصلت إليه رسالة من الكتلة البرلمانية للمؤتمر طلبوا منه فيها أن يبعث برسالة استغاثة إلى الطاغية علي عبدالله صالح يطالبه فيها بوقف الحرب باعتباره أحد مواطنيه وهم مستعدون أن يفعلوا هذه الاستغاثة في البرلمان وعندما وصلت هذه الرسالة إلى السيد حسين رمى بها وقال : (سنستغيث بالله القوي العزيز).
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              خطر دخول أمريكا اليمن
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              كان هذا هو عنوان محاضرة قدمها السيد قبل أكثر من عشر سنوات وهو يحذر أبناء الشعب اليمني من هذا الخطر وما سيترتب على ذلك من دمار وخزي وانتهاك للمحرمات وللأعراض ونهب للثروات على أيدي الأمريكيين إذا لم يتنبه الشعب اليمني ويتحمل مسئوليته في الاستعداد لمواجهة هذه المؤامرة بكل الوسائل الممكنة ولتكن الصرخة بداية المشروع وكذلك تثقيف المجتمع وتهيئته ثقافيا للمواجهة القادمة وكذلك المقاطعة الاقتصادية .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد يقدم الصرخة في وجه المستكبرين كسلاح وموقف
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              يوم الخميس 17 يناير 2002م هو اليوم الذي انطلقت فيه من حناجر السيد حسين صرخة الحق والعزة والكرامة صرخة [الله أكبر الموت لأمريكا الموت لإسرائيل اللعنة على اليهود النصر للإسلام] ليعلن بذلك ولادة فجر جديد لا مكان فيه للذل ولا للهوان ولا للخوف والاستكانة والخنوع, يوم فتح فيه السيد حسين باب العزة والحرية والمواقف المشرفة التي ستعيد للأمة مجدها وسيادتها وتخلصها من تحت أقدام أعدائها, وترفعها من المستنقع الذي قد انغمست فيه .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              الحرب الإعلامية
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              لقد كان من أسوء ما ظلمت به هذه المسيرة القرآنية منذ انطلاقتها وبزوغ فجرها هو ما ووجهت به من حرب إعلامية لا تقل شراسة عن الحرب العسكرية فأنشئت وسائل إعلامية جديدة إضافة إلى ما هو موجود من أجل تشويه هذه المسيرة القرآنية من خلال الكذب والدجل والافتراء وقلب الحقائق وتقديم المعتدي الغاشم ضحية والضحية معتد ظالم. ثم العمل الجاد في التهميش والتقليل لما حققته المسيرة القرآنية من مواقف مشرفة ومن انتصارات في كل المستويات.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد حسين انطلق بدافع استشعاره للمسئولية
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              وفي حوار مع شبكة الـ بي بي سي أثناء الحرب الظالمة في اتصال هاتفي كان منـه هذه الفقرة قال: (إن الله يقول: {'{'}إِنَّ الَّذِينَ يَكْتُمُونَ مَا أَنْزَلْنَا مِنَ الْبَيِّنَاتِ وَالْهُدَى مِنْ بَعْدِ مَا بَيَّنَّاهُ لِلنَّاسِ فِي الْكِتَابِ أُولَئِكَ يَلْعَنُهُمُ اللَّهُ وَيَلْعَنُهُمُ اللَّاعِنُونَ{'}'} نحن نعتقد أن لدينا معرفة بالبينات والهـدى فمن واجبنا أمام الله ـ ونحن يجب أن لا نخاف إلا الله ـ أن نبين للناس فنحن بينا للنـاس أن هذه المرحلة التي نحن فيها ونقول للجميــــع أن المسلمين اليوم في مرحله خطيرة حسب ما أعتقد مرحلة مؤاخذة إلهية ونحن ننطلق من هذه المســـئولية الإلهية في القرآن بتبليغ الناس هذا هو شيء أوجبه الله على من لديهم معرفة{'{'}وَإِذْ أَخَذَ اللَّهُ مِيثَاقَ الَّذِينَ أُوتُوا الْكِتَابَ لَتُبَيِّنُنَّهُ لِلنَّاسِ وَلا تَكْتُمُونَهُ{'}'} فهذا عملنا من البدايــة نذكِّر الناس بالقران الكريم ومن منطلق قول الله سبحانه لرسوله (صلوات الله عليه وعلى آله){'{'}فَذَكِّرْ إِنَّمَا أَنْتَ مُذَكِّرٌ{'}'} فنحن نذكـــر الناس بالقرآن فمن قبــل فلا بأس ومن لا يقبل لا نرغمه على ذلك ولا نفرض عليه أن يتوجه بتوجيهنا ولا نكفـره ولا نفسقه, والتذكير ليس مجرد أن نذكر أن هناك عدو بل يجب أن يكون هناك رؤية تقدم للناس رؤية عملية يتحركون فيها, على هذا الأساس كان أمامنا قضيتان:-
              <br /><br />
              <span className="block p-4 bg-taiz-royal/5 rounded-xl border border-taiz-royal/20 mb-2 font-bold text-taiz-royal">القضية الأولى: رفع شعار: [الله أكبر / الموت لأمريكا/ الموت لإسرائيل / اللعنة على اليهود/ النصر للإسلام]</span>
              <span className="block p-4 bg-taiz-royal/5 rounded-xl border border-taiz-royal/20 font-bold text-taiz-royal">القضية الثانية: مقاطعة البضائع الأمريكية والإسرائيلية كواجب ديني.</span>
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              كان هذا العمل هو ما تتطلبه المرحلة
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              لقد كان هذا التحرك هو ما تتطلبه المرحلة وهو ما الأمة متعطشة إليه فهي تواقة إلى عمل تذوق من خلاله طعم العزة والحرية وخصوصا بعدما فقدت الأمل في الأحزاب بكل أنواعها دينية وقومية وعلمانية وسئمت حالة الذل والهوان ولذلك لقي قبولا وارتياحا ولو في القلوب وإن لم يترجم إلى عمل بسرعة نتيجة لحالة اليأس والإحباط التي كانت مسيطرة على واقع الأمة.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              ومن ولاية [جورجيا] إلى صعدة
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              في ولاية جورجيا الأمريكية يعقد اجتماع يضم الدول الثمان الصناعية وخلاف المعتاد يحضر هذا الاجتماع الرئيس اليمني دون أن يعرف أحد المغزى والهدف من هذا الحضور إلا الله وزعماء تلك الدول ومن يسير في فلكهم في المنطقة ولم تكن التسريبات التي تحدث عنها الإعلام واللقاءات المشبوهة من قبل المخابرات الأمريكية بكل أنواعها ومسئولي مكافحة الإرهاب حول السيد حسين والمسيرة القرآنية بالشكل الذي يكشف حقيقة هذا الحضور المشبوه للزعيم اليمني حيث عاد علي صالح بقرار الحرب الظالمة.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              دور التكفيريين في إعطاء غطاء شرعي للحرب.
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              وكما هي عادة التكفيريين علماء البلاط فقد أفتوا بكفر السيد حسين ووجوب قتاله والوقوف إلى جانب السلطة الظالمة .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              رسائل التهديد والوعيد
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              بدأت رسائل التهديد والوعيد تتوالى على السيد حسين من جهة الطاغية علي عبدالله صالح وكلها كانت تتوعد السيد حسين بأنه لا بد أن يتخلى عن شعار [الموت لأمريكا الموت لإسرائيل] وما ترافق معه من التربية القرآنية أو سوف يسلط عليه من لا يرحم ويقصد بذلك المجرم الدموي علي محسن الأحمر المعروف بولائه لأمريكا وإدارة بعض حروبها الدموية إلا أن السيد حسين كان أكبر من تهديداتهم وثقته الكبيرة بالله جعلته قويا في مواجهة التحديات فلم تهزه التهديدات ولم يثنيه الوعيد بل ازداد إيمانا ويقينا وثباتا على مبدئه, ومع ذلك كان السيد حسين حريصا كل الحرص على أن يفهم الجميع صحة موقفه وأن هذا العمل هو العمل الوحيد الذي سينقذ البلد من مؤامرات الأمريكيين وكان يؤكد للرئيس أنه ليس في صالحه أن يقدم نفسه عبارة عن مدير قسم شرطة لدى الأمريكيين وأكد له بأنه إن فعل ذلك فلن يكون مصيره أقل من مصير شاه إيران وعرفات وصدام حسين وغيرهم من الزعماء الذين ضحوا بشعوبهم إرضاء لأمريكا فجازتهم بالتنكر لكل أعمالهم وتخلت عنهم وضربتهم في الوقت الذي قد كرهتهم شعوبهم.
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد حسين أول من أشعل وقود الثورة ضد النظام الظالم .
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              السيد حسين رضوان الله عليه بثورته الفكرية الثقافية الشاملة قاد أعظم ثورة على الثقافات المغلوطة والعقائد الباطلة التي تؤسس وتشرع للطغيان والظلم ثار على الثقافات المنحرفة التي أوصلت المئات من الطواغيت إلى سدة الحكم وهيئت لهم الساحة ليحكموا الأمة بالقهر والغلبة, هذه الثورة هي الثورة الحقيقية الثورة الناجحة والمحصنة من أي اختراقات فلا أمريكا ولا غيرها قادرة أن تخترق مثل هذه الثورة, ثورة اتجهت إلى بناء أمة لا تقبل بالطواغيت ولا تنخدع بهم ثورة تجعل الأمة تعرف من يحكمها وفق معايير قرآنية, ثورة لا مكان فيها لتلك الأفكار المنحرفة التي أوصلت المجرمين إلى سدة الحكم ليتحكموا على رقاب الأمة الإسلامية عبر تاريخها الطويل مهدت الطريق أمامهم ليصعدوا على أكتافها ويسوموها سوء العذاب حتى وصل بهم الأمر في هذه المرحلة إلى أن يبيعوا كرامة وعزة وشرف وحرية وثروات شعوبهم من أعداء هذه الأمة أمريكا وإسرائيل وأن يتآمروا على شعوبهم وأن يسخروا أنفسهم ليكونوا أدوات قذرة لخدمة أعداء هذه الأمة في ضرب شعوبهم وإذلالها وقهرها .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              كربلاء تعود من جديد
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              واصل الطواغيت والمجرمون زحفهم على جبل مران وبعد عناء شديد وتضحيات جسيمة قدمتها السلطة قربانا للمعبد الأمريكي وصل المجرمون إلى معقل السيد حسين بعد حرب دامت أكثر من ثمانين يوما دفعت فيها أثمانا باهظة فضاعت هيبتها وكسرت شوكتها وهيأت لسقوطها وزوالها ولو بعد حين. لقد تصور الظالمون بأنهم كسبوا المعركة بسيطرتهم على معقل السيد حسين في جبل مران وأنهم قد قضوا على المسيرة القرآنية بوحشيتهم التي أعادت إلى الأذهان كربلاء الطف مرة أخرى عندما حاولوا إحراق السيد حسين وأفراد عائلته ومجموعة من الجرحى بالنار وهم في جرف سلمان من خلال قنابل كبيرة جدا وضعوها في فتحة الجرف من الأعلى وصب البترول إلى الجرف وإشعاله في وحشية لم يسمع عنها أحد في تاريخنا الحديث .
            </p>
          </div>

          <div className="pt-6">
            <h3 className="text-lg md:text-xl font-bold text-taiz-royal mb-4 flex items-start gap-3">
              <span className="mt-1 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-taiz-royal/10 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-taiz-royal"></span>
              </span>
              السيد حسين يودع الحياة بجسده
            </h3>
            <p className="bg-surface-main p-4 md:p-6 rounded-2xl border border-border-light/50 shadow-sm">
              وهكذا ودع سيد المجاهدين قرين القرآن وسليل بيت النبوة القائد والمؤسس للمسيرة القرآنية السيد حسين بدر الدين الحوثي سلام الله عليه هذه الحياة وقد عمل ما عليه وأسس لبناء أمة القرآن أمة الإسلام وقلبه مليء بالثقة بنصر الله لهذه المسيرة الإلهية مهما كانت التضحيات, لقد كان يقسم بأنه واثق من نصر الله حتى لو وصل جنود السلطة الظالمة إلى باب الجرف الذي كان فيه , وهكذا ختم حياته الدنيا كما ذكر من كان معه وهو يردد هذا الدعاء : <span className="font-bold text-taiz-royal bg-taiz-royal/5 px-2 py-1 rounded">( اللهم ثبتني بالقول الثابت في الحياة الدنيا وفي الآخرة )</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsView = ({
  lessonsList,
  seriesList,
  bookmarks,
  notes,
  highlights,
  lessonProgress,
  onNavigateToLesson,
  onClearBookmark,
  onClearNote,
  onClearHighlight,
  onResetDashboard,
}: any) => (
  <QuranStats
    lessonsList={lessonsList}
    seriesList={seriesList}
    bookmarks={bookmarks}
    notes={notes}
    highlights={highlights}
    lessonProgress={lessonProgress}
    onNavigateToLesson={onNavigateToLesson}
    onClearBookmark={onClearBookmark}
    onClearNote={onClearNote}
    onClearHighlight={onClearHighlight}
    onResetDashboard={onResetDashboard}
  />
);

export function Quran() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isFetchingLesson, setIsFetchingLesson] = useState(false);
  const [activeView, setActiveView] = useState<QuranView>("quran");
  const [previousView, setPreviousView] = useState<QuranView>("quran");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State - Loaded from Firestore
  const [seriesList, setSeriesList] = useState<QuranSeries[]>([]);
  const [lessonsList, setLessonsList] = useState<QuranLesson[]>([]);
  const [syllabusesList, setSyllabusesList] = useState<QuranSyllabus[]>([]);
  const [excerptsList, setExcerptsList] = useState<QuranExcerpt[]>([]);

  // Selection State
  const [selectedSeries, setSelectedSeries] = useState<QuranSeries | null>(
    null
  );
  const [selectedLesson, setSelectedLesson] = useState<QuranLesson | null>(
    null
  );
  const [selectedSyllabus, setSelectedSyllabus] =
    useState<QuranSyllabus | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<QuranExcerpt | null>(
    null
  );

  let title = "الدروس";
  if (activeView === "leader") title = "الشهيد القائد";
  if (activeView === "lessons" && selectedSeries) title = selectedSeries.title;
  if (activeView === "syllabuses") title = "مقرر الدروس";
  if (activeView === "syllabus-detail" && selectedSyllabus)
    title = (selectedSyllabus as any).title;
  if (activeView === "excerpts") title = "المقتطفات";
  if (activeView === "excerpt-detail" && selectedExcerpt)
    title = selectedExcerpt.title;
  if (activeView === "stats") title = "لوحة التقدم";
  if (activeView === "quran") title = "القرآن الكريم";

  useEffect(() => {
  }, [title]);

  const [lastRead, setLastRead] = useState<QuranLastRead | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Synced User Items - Saved locally in localStorage (completely offline & quota-friendly)
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [jumpToParagraphIndex, setJumpToParagraphIndex] = useState<
    number | null
  >(null);
  const [jumpToExactId, setJumpToExactId] = useState<string | null>(null);

  // Scroll restoration ref
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load LocalStorage fallbacks
    const savedLastRead = localStorage.getItem("quran_last_read");
    if (savedLastRead) {
      try {
        setLastRead(JSON.parse(savedLastRead));
      } catch (e) {}
    }

    const savedProgress = localStorage.getItem("quran_lesson_progress");
    if (savedProgress) {
      try {
        setLessonProgress(JSON.parse(savedProgress));
      } catch (e) {}
    }

    const savedBookmarks = localStorage.getItem("quran_bookmarks");
    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed);
        } else {
          console.warn("Invalid quran_bookmarks format:", parsed);
          setBookmarks([]);
        }
      } catch (e) {
        console.error("Error parsing quran_bookmarks:", e);
        setBookmarks([]);
      }
    }

    const savedNotes = localStorage.getItem("quran_notes");
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
        } else {
          console.warn("Invalid quran_notes format:", parsed);
          setNotes([]);
        }
      } catch (e) {
        console.error("Error parsing quran_notes:", e);
        setNotes([]);
      }
    }

    const savedHighlights = localStorage.getItem("quran_highlights");
    if (savedHighlights) {
      try {
        const parsed = JSON.parse(savedHighlights);
        if (Array.isArray(parsed)) {
          setHighlights(parsed);
        } else {
          console.warn("Invalid quran_highlights format:", parsed);
          setHighlights([]);
        }
      } catch (e) {
        console.error("Error parsing quran_highlights:", e);
        setHighlights([]);
      }
    }

    // 2. Set up Auth state for display purposes
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 2.5 Preload cached syllabuses and excerpts for zero-latency instant display
    const cachedSyllabuses = localStorage.getItem("taiz_quran_syllabuses_cache");
    const cachedExcerpts = localStorage.getItem("taiz_quran_excerpts_cache");
    if (cachedSyllabuses) {
      try {
        const parsed = JSON.parse(cachedSyllabuses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          const activeS = parsed.filter((s: any) => !s.expiresAt || now <= s.expiresAt);
          setSyllabusesList(activeS);
        }
      } catch (e) {
        console.warn("Error parsing syllabuses cache:", e);
      }
    }
    if (cachedExcerpts) {
      try {
        const parsed = JSON.parse(cachedExcerpts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const published = parsed.filter((e: any) => e.status !== "draft");
          setExcerptsList(published);
        }
      } catch (e) {
        console.warn("Error parsing excerpts cache:", e);
      }
    }

    // 3. Load data asynchronously from JSON file
    let active = true;

    loadQuranMetadata().then((data) => {
      if (!active) return;
      
      const processed = processQuranData(data);
      setSeriesList(processed.series);
      setLessonsList(processed.lessons);
      
      // If we didn't have cached excerpts, use static fallback
      if (!cachedExcerpts) {
        setExcerptsList(processed.excerpts);
      }
      
      // If we didn't have cached syllabuses, use static fallback
      if (!cachedSyllabuses) {
        const now = Date.now();
        const activeSyllabuses = (processed.syllabuses || []).filter((s: any) => !s.expiresAt || now <= s.expiresAt);
        setSyllabusesList(activeSyllabuses);
      }
      
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load Quran data:", err);
      if (active) setLoading(false);
    });

    // 4. Sync syllabuses with SyncService caching and offline-first mechanism
    let unsubSyllabusesFn: (() => void) | null = null;
    SyncService.syncCollection<any>(
      "quran_syllabuses",
      (syllabusesData) => {
        if (!active) return;
        const now = Date.now();
        const activeSyllabuses = (syllabusesData || []).filter((s: any) => !s.expiresAt || now <= s.expiresAt);
        setSyllabusesList(activeSyllabuses);
        try {
          localStorage.setItem("taiz_quran_syllabuses_cache", JSON.stringify(activeSyllabuses));
        } catch (e) {}
      },
      { orderByField: "createdAt", orderDirection: "desc" }
    ).then((unsub) => {
      if (!active) {
        unsub();
      } else {
        unsubSyllabusesFn = unsub;
      }
    }).catch((err) => {
      console.warn("Could not sync quran_syllabuses:", err);
    });

    // 5. Sync excerpts with SyncService caching and offline-first mechanism
    let unsubExcerptsFn: (() => void) | null = null;
    SyncService.syncCollection<QuranExcerpt>(
      "quran_excerpts",
      (excerptsData) => {
        if (!active) return;
        const published = (excerptsData || []).filter((e: any) => e.status !== "draft");
        setExcerptsList(published);
        try {
          localStorage.setItem("taiz_quran_excerpts_cache", JSON.stringify(published));
        } catch (e) {}
      },
      { orderByField: "createdAt", orderDirection: "desc" }
    ).then((unsub) => {
      if (!active) {
        unsub();
      } else {
        unsubExcerptsFn = unsub;
      }
    }).catch((err) => {
      console.warn("Could not sync quran_excerpts:", err);
    });

    return () => {
      unsubAuth();
      if (unsubSyllabusesFn) unsubSyllabusesFn();
      if (unsubExcerptsFn) unsubExcerptsFn();
      active = false;
    };
  }, []);

  const navigateToLesson = async (lesson: QuranLesson, series?: QuranSeries) => {
    if (activeView !== "lesson-detail") {
      setPreviousView(activeView);
    }
    const resolvedSeries = series || seriesList.find((s) => s.id === lesson.seriesId) || {
      id: lesson.seriesId || "default-series",
      title: (lesson as any).seriesTitle || "هدي القرآن الكريم",
      description: "",
      order: 1,
    };
    setSelectedSeries(resolvedSeries);
    setSelectedLesson(lesson);
    setJumpToParagraphIndex(null);
    setJumpToExactId(null);
    setActiveView("lesson-detail");

    // Check if lesson content needs to be loaded from platform JSON files
    if (!lesson.content) {
      setIsFetchingLesson(true);
      try {
        const fullLesson = await loadLessonContent(lesson.id);
        if (fullLesson && fullLesson.content) {
          // Update lesson in list so it's cached in memory
          setLessonsList((prev) =>
            prev.map((l) => (l.id === lesson.id ? { ...l, content: fullLesson.content } : l))
          );
          setSelectedLesson((prev) =>
            prev && prev.id === lesson.id
              ? { ...prev, content: fullLesson.content }
              : { ...lesson, content: fullLesson.content }
          );
        } else {
          console.warn("Could not load lesson content for ID:", lesson.id);
        }
      } catch (error) {
        console.error("Error loading lesson content:", error);
      } finally {
        setIsFetchingLesson(false);
      }
    }
  };

  const handleLastReadClick = async () => {
    setIsSidebarOpen(false);
    if (lastRead) {
      const lesson = lessonsList.find((l) => l.id === lastRead.lessonId);
      const series = seriesList.find((s) => s.id === lastRead.seriesId);
      if (lesson && series) {
        await navigateToLesson(lesson, series);
      } else {
        alert("لم يتم العثور على الدرس المحفوظ");
      }
    } else {
      alert("لا يوجد سجل لآخر قراءة");
    }
  };

  useEffect(() => {
    if (loading) return;

    const lessonParam = searchParams.get("lesson");
    const seriesParam = searchParams.get("series");
    const syllabusParam = searchParams.get("syllabus");
    const excerptParam = searchParams.get("excerpt");
    const viewParam = searchParams.get("view");

    if (lessonParam && lessonsList.length > 0) {
      const matchLesson = lessonsList.find((l) => l.id === lessonParam);
      if (matchLesson) {
        const matchSeries = seriesList.find(
          (s) => s.id === (seriesParam || matchLesson.seriesId)
        );
        navigateToLesson(matchLesson, matchSeries);
        return;
      }
    }

    if (syllabusParam && syllabusesList.length > 0) {
      const matchSyllabus = syllabusesList.find((s) => s.id === syllabusParam);
      if (matchSyllabus) {
        const matchLesson = lessonsList.find((l) => l.id === matchSyllabus.lessonId);
        if (matchLesson) {
          const matchSeries = seriesList.find((s) => s.id === (matchLesson.seriesId || matchSyllabus.seriesId));
          navigateToLesson(matchLesson, matchSeries);
          return;
        } else {
          setActiveView("syllabuses");
          return;
        }
      }
    }

    if (excerptParam && excerptsList.length > 0) {
      const matchExcerpt = excerptsList.find((e) => e.id === excerptParam);
      if (matchExcerpt) {
        setSelectedExcerpt(matchExcerpt);
        setActiveView("excerpt-detail");
        return;
      }
    }

    if (viewParam) {
      if (viewParam === "quran") setActiveView("quran");
      else if (viewParam === "series") setActiveView("series");
      else if (viewParam === "syllabuses") setActiveView("syllabuses");
      else if (viewParam === "excerpts") setActiveView("excerpts");
      else if (viewParam === "stats") setActiveView("stats");
      else if (viewParam === "leader") setActiveView("leader");
    }
  }, [loading, searchParams, lessonsList, seriesList, syllabusesList, excerptsList]);

  // PERSISTENCE TRIGGERS:
  const handleToggleBookmark = async (paragraphIndex: number, text: string) => {
    if (!selectedLesson || !selectedSeries) return;
    const isBookmarked = bookmarks.some(
      (b) =>
        b.lessonId === selectedLesson.id && b.paragraphIndex === paragraphIndex
    );

    const updated = isBookmarked
      ? bookmarks.filter(
          (b) =>
            !(
              b.lessonId === selectedLesson.id &&
              b.paragraphIndex === paragraphIndex
            )
        )
      : [
          ...bookmarks,
          {
            lessonId: selectedLesson.id,
            seriesId: selectedSeries.id,
            lessonTitle: selectedLesson.title,
            seriesTitle: selectedSeries.title,
            paragraphIndex,
            text: text.substring(0, 150) + (text.length > 150 ? "..." : ""),
            createdAt: Date.now(),
          },
        ];

    setBookmarks(updated);
    localStorage.setItem("quran_bookmarks", JSON.stringify(updated));
  };

  const handleClearBookmark = async (
    lessonId: string,
    paragraphIndex: number
  ) => {
    const updated = bookmarks.filter(
      (b) => !(b.lessonId === lessonId && b.paragraphIndex === paragraphIndex)
    );
    setBookmarks(updated);
    localStorage.setItem("quran_bookmarks", JSON.stringify(updated));
  };

  const handleSaveNote = async (
    paragraphIndex: number,
    noteText: string,
    quote?: string
  ) => {
    if (!selectedLesson || !selectedSeries) return;

    const newNote = {
      id: `${selectedLesson.id}_p${paragraphIndex}_t${Date.now()}`,
      lessonId: selectedLesson.id,
      seriesId: selectedSeries.id,
      lessonTitle: selectedLesson.title,
      seriesTitle: selectedSeries.title,
      paragraphIndex,
      noteText,
      quote: quote || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...notes, newNote];

    setNotes(updated);
    localStorage.setItem("quran_notes", JSON.stringify(updated));
  };

  const handleDeleteNote = async (noteIdOrIndex: string | number) => {
    if (!selectedLesson) return;
    let updated;

    if (typeof noteIdOrIndex === "string") {
      updated = notes.filter((n) => n.id !== noteIdOrIndex);
    } else {
      // Legacy support for index-based delete
      const noteToDelete = notes.find(
        (n) =>
          n.lessonId === selectedLesson.id && n.paragraphIndex === noteIdOrIndex
      );
      if (noteToDelete) {
        updated = notes.filter((n) => n !== noteToDelete);
      } else {
        updated = notes;
      }
    }

    setNotes(updated);
    localStorage.setItem("quran_notes", JSON.stringify(updated));
  };

  const handleClearNote = async (lessonId: string, paragraphIndex: number) => {
    const updated = notes.filter(
      (n) => !(n.lessonId === lessonId && n.paragraphIndex === paragraphIndex)
    );
    setNotes(updated);
    localStorage.setItem("quran_notes", JSON.stringify(updated));
  };

  const handleToggleHighlight = async (
    paragraphIndex: number,
    color: string,
    text?: string,
    startOffset?: number,
    endOffset?: number
  ) => {
    if (!selectedLesson) return;

    // For specific text highlights, match with text and startOffset
    const exIdx = highlights.findIndex(
      (h) =>
        h.lessonId === selectedLesson.id &&
        h.paragraphIndex === paragraphIndex &&
        (text ? h.text === text && h.startOffset === startOffset : !h.text)
    );

    let updated;
    const isSameColor = exIdx > -1 && highlights[exIdx].color === color;

    if (isSameColor) {
      updated = highlights.filter((_, idx) => idx !== exIdx);
    } else {
      const item = {
        lessonId: selectedLesson.id,
        paragraphIndex,
        color,
        text: text || null,
        startOffset: typeof startOffset === "number" ? startOffset : null,
        endOffset: typeof endOffset === "number" ? endOffset : null,
        createdAt: Date.now(),
      };

      if (exIdx > -1 && !text) {
        updated = highlights.map((h, i) => (i === exIdx ? item : h));
      } else {
        updated = [...highlights, item];
      }
    }

    setHighlights(updated);
    localStorage.setItem("quran_highlights", JSON.stringify(updated));
  };

  const handleDeleteHighlight = async (paragraphIndex: number) => {
    if (!selectedLesson) return;
    const updated = highlights.filter(
      (h) =>
        !(
          h.lessonId === selectedLesson.id &&
          h.paragraphIndex === paragraphIndex
        )
    );
    setHighlights(updated);
    localStorage.setItem("quran_highlights", JSON.stringify(updated));
  };

  const handleClearHighlight = async (
    lessonId: string,
    paragraphIndex: number
  ) => {
    const updated = highlights.filter(
      (h) => !(h.lessonId === lessonId && h.paragraphIndex === paragraphIndex)
    );
    setHighlights(updated);
    localStorage.setItem("quran_highlights", JSON.stringify(updated));
  };

  const handleProgressUpdate = (percent: number) => {
    if (!selectedLesson || !selectedSeries) return;

    // Globally log the core scroll progress
    const progress: QuranLastRead = {
      lessonId: selectedLesson.id,
      seriesId: selectedSeries.id,
      lessonTitle: selectedLesson.title,
      seriesTitle: selectedSeries.title,
      scrollY: percent === 100 ? 50000 : 0, // Mock Scroll height representation for simple logs
      timestamp: Date.now(),
    };
    setLastRead(progress);
    localStorage.setItem("quran_last_read", JSON.stringify(progress));

    setLessonProgress((prev) => {
      const current = prev[selectedLesson.id] || 0;
      const nextVal = Math.max(current, percent);
      if (nextVal !== current) {
        const nextMap = { ...prev, [selectedLesson.id]: nextVal };
        localStorage.setItem("quran_lesson_progress", JSON.stringify(nextMap));

        // Stats tracking
        if (nextVal >= 92 && current < 92) {
          try {
            const stored = localStorage.getItem("quran_reading_stats");
            const parsed = stored
              ? JSON.parse(stored)
              : {
                  lessonsReadCount: 0,
                  totalReadingTimeMinutes: 0,
                  lastReadTimestamp: Date.now(),
                };
            parsed.lessonsReadCount += 1;
            parsed.lastReadTimestamp = Date.now();
            localStorage.setItem("quran_reading_stats", JSON.stringify(parsed));
          } catch (e) {}
        }
        return nextMap;
      }
      return prev;
    });
  };

  const handleHopToLesson = (
    lessonId: string,
    paragraphIndex?: number,
    exactId?: string
  ) => {
    const lesson = lessonsList.find((l) => l.id === lessonId);
    if (lesson) {
      const series = seriesList.find((s) => s.id === lesson.seriesId);
      if (series) {
        setSelectedSeries(series);
        setSelectedLesson(lesson);
        if (typeof paragraphIndex === "number") {
          setJumpToParagraphIndex(paragraphIndex);
          if (exactId) {
            setJumpToExactId(exactId);
          } else {
            setJumpToExactId(null);
          }
        } else {
          setJumpToParagraphIndex(null);
          setJumpToExactId(null);
        }
        setActiveView("lesson-detail");
      }
    }
  };

  const handleResetDashboard = async () => {
    const confirmReset = window.confirm(
      "هل أنت متأكد من تصفير وإعادة تعيين لوحة التقدم والمتابعة القرآنية بالكامل؟ سيؤدي هذا لحذف كافة سجلات القراءة والإحصائيات والمفضلة والملحوظات والتلوين."
    );
    if (!confirmReset) return;

    // Reset local state
    setLastRead(null);
    setLessonProgress({});
    setBookmarks([]);
    setNotes([]);
    setHighlights([]);

    // Clear local storage
    localStorage.removeItem("quran_last_read");
    localStorage.removeItem("quran_lesson_progress");
    localStorage.removeItem("quran_bookmarks");
    localStorage.removeItem("quran_notes");
    localStorage.removeItem("quran_highlights");
    localStorage.removeItem("quran_reading_stats");

    // Since Quran Guidance is now fully offline to preserve Firestore quota, we only clear localStorage.
    alert("تم تصفير لوحة التقدم وإعادة تعيين كافة الأنشطة بنجاح.");
  };

  const PatternBackground = () => (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden z-0">
      <svg width="100%" height="100%">
        <pattern
          id="islamic-pattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M50 0L64.6 35.4L100 50L64.6 64.6L50 100L35.4 64.6L0 50L35.4 35.4L50 0Z"
            fill="currentColor"
          />
          <path
            d="M50 20L58.8 41.2L80 50L58.8 58.8L50 80L41.2 58.8L20 50L41.2 41.2L50 20Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center h-full min-h-[50vh] bg-gray-50">
        <div className="w-12 h-12 border-4 border-taiz-royal border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-taiz-soft font-black text-sm">
          جاري تنزيل المحتويات العلمية...
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 w-full flex flex-col bg-white dark:bg-gray-950 font-sans rtl relative overflow-hidden"
      dir="rtl"
    >
      <SEO 
        title="المنهج الثقافي"
        description="مكتبة الدروس والبرامج الثقافية للمشروع القرآني"
        type="website"
        path={window.location.pathname}
      />
      {activeView !== "lesson-detail" && (
        <div className="py-2.5 px-3 sm:px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-0 z-50 shrink-0 select-none">
          <div className="max-w-[850px] mx-auto w-full flex flex-col gap-2">
            <div className="w-full flex items-center justify-between gap-3">
              {/* Right side: Sidebar Trigger (Icon-only, beautiful circle) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="القائمة الرئيسية"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-xs active:scale-95 transition-all flex items-center justify-center shrink-0 group cursor-pointer"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200 transition-transform group-hover:scale-110" />
              </button>

              {/* Middle: Dual Segmented Switcher ("القرآن الكريم" | "الدروس") spanning remaining width */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-700/80 grid grid-cols-2 gap-1 shadow-inner select-none">
                {/* Segment 1: القرآن الكريم */}
                <button
                  onClick={() => setActiveView("quran")}
                  className={`relative flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-300 active:scale-95 cursor-pointer ${
                    activeView === "quran"
                      ? "text-white font-black"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-bold"
                  }`}
                >
                  {activeView === "quran" && (
                    <motion.div
                      layoutId="quran-lessons-tab-pill"
                      className="absolute inset-0 bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal rounded-lg sm:rounded-xl shadow-xs border border-taiz-sky/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <BookOpen className={`w-4 h-4 ${activeView === "quran" ? "text-amber-300 animate-pulse" : "text-slate-500 dark:text-slate-400"}`} />
                    <span className="whitespace-nowrap">القرآن الكريم</span>
                  </span>
                </button>

                {/* Segment 2: الدروس */}
                <button
                  onClick={() => setActiveView("series")}
                  className={`relative flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-300 active:scale-95 cursor-pointer ${
                    activeView !== "quran"
                      ? "text-white font-black"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-bold"
                  }`}
                >
                  {activeView !== "quran" && (
                    <motion.div
                      layoutId="quran-lessons-tab-pill"
                      className="absolute inset-0 bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-royal rounded-lg sm:rounded-xl shadow-xs border border-taiz-sky/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <Library className={`w-4 h-4 ${activeView !== "quran" ? "text-sky-300 animate-pulse" : "text-slate-500 dark:text-slate-400"}`} />
                    <span className="whitespace-nowrap">الدروس</span>
                  </span>
                </button>
              </div>

              {/* Left side: Back Button or null */}
              {activeView !== "syllabuses" && activeView !== "excerpts" && activeView !== "series" && activeView !== "quran" ? (
                <button
                  onClick={() => {
                    if (activeView === "lessons") setActiveView("series");
                    else if (activeView === "syllabus-detail") setActiveView("syllabuses");
                    else if (activeView === "excerpt-detail") setActiveView("excerpts");
                    else if (activeView === "stats" || activeView === "leader") setActiveView("series");
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 transition-all text-xs font-bold font-cairo cursor-pointer active:scale-95 shadow-xs shrink-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span className="whitespace-nowrap">العودة</span>
                </button>
              ) : null}
            </div>

            {/* Sub-tabs Row (only shown when in Lessons tab, which is activeView !== "quran") */}
            {activeView !== "quran" && activeView !== "leader" && activeView !== "stats" && (
              <div className="w-full flex justify-center mt-1 animate-fade-in px-1">
                {/* Modern Segmented Control for Sub-tabs */}
                <div className="w-full max-w-md bg-slate-100/70 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/60 grid grid-cols-3 gap-0.5 select-none relative">
                  {/* Sub-tab 1: سلاسل الدروس */}
                  <button
                    onClick={() => setActiveView("series")}
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-[10.5px] sm:text-xs md:text-sm font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                      activeView === "series" || activeView === "lessons"
                        ? "text-blue-600 dark:text-blue-400 font-extrabold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"
                    }`}
                  >
                    {(activeView === "series" || activeView === "lessons") && (
                      <motion.div
                        layoutId="lessons-sub-tab-pill"
                        className="absolute inset-0 bg-blue-50/90 dark:bg-blue-950/45 rounded-lg shadow-xs border border-blue-200/80 dark:border-blue-900/80"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1 font-cairo">
                      <Library className={`w-3.5 h-3.5 ${activeView === "series" || activeView === "lessons" ? "text-blue-500 dark:text-blue-400 animate-pulse" : "text-slate-500 dark:text-slate-400"}`} />
                      <span className="whitespace-nowrap">سلاسل الدروس</span>
                    </span>
                  </button>

                  {/* Sub-tab 2: مقرر الدروس */}
                  <button
                    onClick={() => setActiveView("syllabuses")}
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-[10.5px] sm:text-xs md:text-sm font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                      activeView === "syllabuses" || activeView === "syllabus-detail"
                        ? "text-amber-600 dark:text-amber-500 font-extrabold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"
                    }`}
                  >
                    {(activeView === "syllabuses" || activeView === "syllabus-detail") && (
                      <motion.div
                        layoutId="lessons-sub-tab-pill"
                        className="absolute inset-0 bg-amber-50/90 dark:bg-amber-950/45 rounded-lg shadow-xs border border-amber-200/80 dark:border-amber-900/80"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1 font-cairo">
                      <BookOpenCheck className={`w-3.5 h-3.5 ${activeView === "syllabuses" || activeView === "syllabus-detail" ? "text-amber-500 dark:text-amber-400 animate-pulse" : "text-slate-500 dark:text-slate-400"}`} />
                      <span className="whitespace-nowrap">مقرر الدروس</span>
                    </span>
                  </button>

                  {/* Sub-tab 3: المقتطفات */}
                  <button
                    onClick={() => setActiveView("excerpts")}
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-[10.5px] sm:text-xs md:text-sm font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                      activeView === "excerpts" || activeView === "excerpt-detail"
                        ? "text-teal-600 dark:text-teal-500 font-extrabold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"
                    }`}
                  >
                    {(activeView === "excerpts" || activeView === "excerpt-detail") && (
                      <motion.div
                        layoutId="lessons-sub-tab-pill"
                        className="absolute inset-0 bg-teal-50/90 dark:bg-teal-950/45 rounded-lg shadow-xs border border-teal-200/80 dark:border-teal-900/80"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1 font-cairo">
                      <Quote className={`w-3.5 h-3.5 ${activeView === "excerpts" || activeView === "excerpt-detail" ? "text-teal-500 dark:text-teal-400 animate-pulse" : "text-slate-500 dark:text-slate-400"}`} />
                      <span className="whitespace-nowrap">المقتطفات</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        handleLastReadClick={handleLastReadClick}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {activeView !== "lesson-detail" && <PatternBackground />}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col z-10"
          >
            {searchQuery.trim().length > 0 ? (
              <QuranSearchView
                searchQuery={searchQuery}
                lessonsList={lessonsList}
                excerptsList={excerptsList}
                seriesList={seriesList}
                scrollRef={scrollRef}
                onNavigateToLesson={navigateToLesson}
                onSelectExcerpt={(e: any) => {
                  setSelectedExcerpt(e);
                  setActiveView("excerpt-detail");
                }}
              />
            ) : (
              <>
                {activeView === "series" && (
                  <SeriesView
                    seriesList={seriesList}
                    lessonsList={lessonsList}
                    scrollRef={scrollRef}
                    onSelectSeries={(s: any) => {
                      setSelectedSeries(s);
                      setActiveView("lessons");
                    }}
                  />
                )}
                {activeView === "quran" && (
                  <QuranKareem />
                )}
                {activeView === "lessons" && (
                  <LessonsView
                    selectedSeries={selectedSeries}
                    lessonsList={lessonsList}
                    lessonProgress={lessonProgress}
                    syllabusesList={syllabusesList}
                    scrollRef={scrollRef}
                    onNavigateToLesson={navigateToLesson}
                  />
                )}
                {activeView === "lesson-detail" && (
                  <LessonDetailView
                    selectedLesson={selectedLesson}
                    selectedSeries={selectedSeries}
                    onBack={() => setActiveView(previousView === "lesson-detail" ? "syllabuses" : previousView)}
                    bookmarks={bookmarks}
                    onToggleBookmark={handleToggleBookmark}
                    notes={notes}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    highlights={highlights}
                    onToggleHighlight={handleToggleHighlight}
                    onDeleteHighlight={handleDeleteHighlight}
                    onProgressUpdate={handleProgressUpdate}
                    jumpToParagraphIndex={jumpToParagraphIndex}
                    jumpToExactId={jumpToExactId}
                    isLoading={isFetchingLesson}
                    onClearJump={() => {
                      setJumpToParagraphIndex(null);
                      setJumpToExactId(null);
                    }}
                  />
                )}
                {activeView === "syllabuses" && (
                  <SyllabusesView
                    syllabusesList={syllabusesList}
                    lessonsList={lessonsList}
                    seriesList={seriesList}
                    onSelectLesson={(lesson: any, series: any) => {
                      const resolvedLesson = lessonsList.find((l: any) => l.id === lesson.id) || lesson;
                      const resolvedSeries = series || seriesList.find((s: any) => s.id === (resolvedLesson.seriesId || lesson.seriesId));
                      navigateToLesson(resolvedLesson, resolvedSeries);
                    }}
                    scrollRef={scrollRef}
                  />
                )}
                {activeView === "syllabus-detail" && (
                  <SyllabusDetailView
                    selectedSyllabus={selectedSyllabus}
                    scrollRef={scrollRef}
                    onBack={() => setActiveView("syllabuses")}
                    onNavigateToLesson={handleHopToLesson}
                  />
                )}
                {activeView === "excerpts" && (
                  <ExcerptsView
                    excerptsList={excerptsList}
                    onSelectExcerpt={(excerpt) => {
                      setSelectedExcerpt(excerpt);
                      setActiveView("excerpt-detail");
                      setJumpToParagraphIndex(null);
                    }}
                    scrollRef={scrollRef}
                  />
                )}
                {activeView === "excerpt-detail" && (
                  <ExcerptDetailView
                    selectedExcerpt={selectedExcerpt}
                    scrollRef={scrollRef}
                    onBack={() => setActiveView("excerpts")}
                  />
                )}
                {activeView === "stats" && (
                  <StatsView
                    lessonsList={lessonsList}
                    seriesList={seriesList}
                    bookmarks={bookmarks}
                    notes={notes}
                    highlights={highlights}
                    lessonProgress={lessonProgress}
                    onNavigateToLesson={handleHopToLesson}
                    onClearBookmark={handleClearBookmark}
                    onClearNote={handleClearNote}
                    onClearHighlight={handleClearHighlight}
                    onResetDashboard={handleResetDashboard}
                    onNavigateToQuran={() => setActiveView("quran")}
                  />
                )}
                {activeView === "leader" && <LeaderView scrollRef={scrollRef} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
