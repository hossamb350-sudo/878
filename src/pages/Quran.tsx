import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {
  QuranSeries,
  QuranLesson,
  QuranSyllabus,
  QuranExcerpt,
  QuranLastRead,
} from "../types";
import { SyncService } from "../services/SyncService";
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
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuranReader } from "../components/QuranReader";
import { QuranStats } from "../components/QuranStats";
import { STATIC_QURAN_SERIES, STATIC_QURAN_LESSONS } from "../data/staticQuranData";

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
  | "stats";

// --- Sub-components moved outside to prevent re-mounting on every state update ---

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
          l.title.includes(searchQuery) || l.content.includes(searchQuery)
      )
      .map((l: any) => ({ ...l, type: "lesson" as const })),
    ...excerptsList
      .filter(
        (e: any) =>
          e.title.includes(searchQuery) || e.content.includes(searchQuery)
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

const SeriesView = ({ seriesList, onSelectSeries, scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="space-y-4 max-w-lg mx-auto">
      {seriesList.length === 0 ? (
        <p className="text-center text-text-muted py-10 font-bold">
          لا توجد سلاسل متاحة حالياً
        </p>
      ) : (
        seriesList.map((series: any) => (
          <button
            key={series.id}
            onClick={() => onSelectSeries(series)}
            className="w-full bg-surface-card hover:bg-surface-hover transition-all p-5 rounded-3xl flex items-center justify-between border-r-8 border-taiz-royal group shadow-sm text-right focus:outline-none"
          >
            <div className="flex flex-col gap-1 pr-1">
              <span className="text-lg font-black text-text-primary">
                {series.title}
              </span>
              {series.description && (
                <span className="text-xs text-text-secondary font-bold">
                  {series.description}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-taiz-navy/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shrink-0 mr-2 focus:outline-none">
              <ChevronLeft className="w-5 h-5 text-taiz-navy" />
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

const LessonsView = ({
  selectedSeries,
  lessonsList,
  lessonProgress,
  onNavigateToLesson,
  scrollRef,
}: any) => {
  const seriesLessons = lessonsList.filter(
    (l: any) => l.seriesId === selectedSeries?.id
  );
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
      <div className="space-y-3 max-w-lg mx-auto">
        {seriesLessons.length === 0 ? (
          <p className="text-center text-text-muted py-10 font-bold">
            لا توجد دروس في هذه السلسلة أو لم يتم إضافتها بعد.
          </p>
        ) : (
          seriesLessons.map((lesson: any) => {
            const progress = lessonProgress[lesson.id] || 0;
            return (
              <button
                key={lesson.id}
                onClick={() => onNavigateToLesson(lesson, selectedSeries!)}
                className="w-full bg-surface-card hover:bg-surface-hover transition p-4 rounded-3xl flex flex-col shadow-sm border border-border-light text-right group focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-black text-text-primary truncate pr-2">
                    {lesson.title}
                  </span>
                  <BookOpen className="w-5 h-5 text-text-muted group-hover:text-taiz-sky transition shrink-0" />
                </div>
                {progress > 0 && <ProgressBar percentage={progress} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const SyllabusesView = ({
  syllabusesList,
  lessonsList,
  onSelectLesson,
  scrollRef,
}: any) => {
  const now = Date.now();
  const activeSyllabuses = syllabusesList.filter(
    (s: any) => now >= s.startDate && now <= s.endDate
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
      <div className="grid gap-4 max-w-2xl mx-auto md:grid-cols-2">
        {activeSyllabuses.length === 0 ? (
          <p className="text-center text-text-muted py-10 col-span-full font-bold">
            لا توجد مقررات دراسية حالية.
          </p>
        ) : (
          activeSyllabuses.map((item: any) => {
            const lesson = lessonsList.find((l: any) => l.id === item.lessonId);
            if (!lesson) return null;
            return (
              <button
                key={item.id}
                onClick={() => onSelectLesson(lesson)}
                className="bg-surface-card p-5 rounded-3xl shadow-soft border-2 border-emerald-500/30 hover:border-emerald-500 transition text-right flex flex-col items-start gap-3 focus:outline-none relative overflow-hidden"
              >
                <div className="absolute -left-12 -top-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
                <div className="flex justify-between w-full items-start">
                  <Calendar className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-black">
                    المقرر الحالي
                  </span>
                </div>
                <span className="text-lg font-black text-text-primary">
                  {lesson.title}
                </span>
                <span className="text-xs text-text-secondary font-bold">
                  من {new Date(item.startDate).toLocaleDateString("ar-EG")} إلى{" "}
                  {new Date(item.endDate).toLocaleDateString("ar-EG")}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const ExcerptsView = ({
  excerptsList,
  lessonsList,
  onSelectExcerpt,
  scrollRef,
}: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="space-y-4 max-w-lg mx-auto">
      {excerptsList.length === 0 ? (
        <p className="text-center text-text-muted py-10 font-bold">
          لا توجد مقتطفات متاحة.
        </p>
      ) : (
        excerptsList.map((item: any) => {
          const lesson = lessonsList.find((l: any) => l.id === item.lessonId);
          return (
            <button
              key={item.id}
              onClick={() => onSelectExcerpt(item)}
              className="w-full bg-surface-card p-4 rounded-2xl shadow-soft border border-border-light hover:border-taiz-royal/30 hover:shadow-strong transition text-right flex gap-4 focus:outline-none"
            >
              <div className="w-12 h-12 shrink-0 bg-taiz-royal/5 rounded-xl flex items-center justify-center">
                <Quote className="w-5 h-5 text-taiz-royal" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-sm font-black text-text-primary">
                  {item.title}
                </span>
                {lesson && (
                  <span className="text-xs text-taiz-royal font-bold">
                    من درس: {lesson.title}
                  </span>
                )}
                <span className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {item.content}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  </div>
);

const ExcerptDetailView = ({
  selectedExcerpt,
  lessonsList,
  scrollRef,
  onGoToLesson,
}: any) => {
  const lesson = lessonsList.find(
    (l: any) => l.id === selectedExcerpt?.lessonId
  );
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-8 relative bg-surface-main"
      ref={scrollRef}
    >
      <div
        className="max-w-2xl mx-auto p-4 leading-loose text-text-primary text-lg md:text-xl font-medium"
        dir="rtl"
      >
        <h1 className="text-2xl md:text-3xl font-black mb-2 text-taiz-royal">
          {selectedExcerpt?.title}
        </h1>
        {lesson && (
          <button
            onClick={() => onGoToLesson(lesson)}
            className="inline-flex items-center gap-1 text-sm font-bold text-taiz-sky bg-taiz-sky/10 px-3 py-1 rounded-full hover:bg-taiz-sky/20 transition-colors mb-6"
          >
            <BookOpen className="w-4 h-4" />
            الذهاب للدرس: {lesson.title}
          </button>
        )}
        {selectedExcerpt?.mediaUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-md">
            <img
              src={selectedExcerpt.mediaUrl}
              alt={selectedExcerpt.title}
              className="w-full h-auto"
            />
          </div>
        )}
        <div className="whitespace-pre-wrap text-base md:text-lg leading-[2.1] relative">
          <Quote className="absolute -top-4 -right-2 w-12 h-12 text-taiz-royal/10 -z-10 transform scale-x-[-1]" />
          {selectedExcerpt?.content || "تفاصيل المقتطف غير متوفرة."}
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
  onBack,
  onToggleBookmark,
  onSaveNote,
  onDeleteNote,
  onToggleHighlight,
  onDeleteHighlight,
  onProgressUpdate,
  onClearJump,
}: any) => {
  if (!selectedLesson || !selectedSeries) return null;
  return (
    <QuranReader
      lesson={selectedLesson}
      series={selectedSeries}
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
        className={`text-base font-black leading-tight ${
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
  if (activeView === "lessons" && selectedSeries) title = selectedSeries.title;
  if (activeView === "syllabuses") title = "مقرر الدروس";
  if (activeView === "syllabus-detail" && selectedSyllabus)
    title = selectedSyllabus.title;
  if (activeView === "excerpts") title = "المقتطفات";
  if (activeView === "excerpt-detail" && selectedExcerpt)
    title = selectedExcerpt.title;
  if (activeView === "stats") title = "لوحة التقدم";

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
              <User className="w-12 h-12 text-taiz-navy translate-y-1.5" />
            </div>
            <h3 className="text-lg font-black text-text-primary">
              هدي القرآن الكَريم
            </h3>
            <p className="text-text-secondary text-xs font-bold mt-1 text-center">
              الشهيد القائد السيد حسين بدرالدين الحوثي
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-4 bg-surface-main">
            <SidebarItem
              icon={<Library className="w-5 h-5 text-taiz-royal" />}
              label="دروس الهدى"
              description="قائمة السلاسل والدروس الكاملة"
              active={activeView === "series" || activeView === "lessons"}
              onClick={() => {
                setActiveView("series");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<Trophy className="w-5 h-5 text-taiz-sky" />}
              label="لوحة التقدم"
              description="متابعة إنجازك وإحصائيات القراءة"
              active={activeView === "stats"}
              onClick={() => {
                setActiveView("stats");
                setIsSidebarOpen(false);
              }}
            />
            <SidebarItem
              icon={<Undo2 className="w-5 h-5 rotate-180 text-taiz-royal" />}
              label="آخر قراءة"
              description="العودة لأخر درس توقفت عنده"
              onClick={handleLastReadClick}
            />
            <SidebarItem
              icon={<Calendar className="w-5 h-5 text-taiz-sky" />}
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
              icon={<Quote className="w-5 h-5 text-taiz-royal" />}
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
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<QuranView>("series");
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

    // 3. Sync data
    let active = true;

    // Load static data
    setSeriesList(STATIC_QURAN_SERIES);
    setLessonsList(STATIC_QURAN_LESSONS);
    setLoading(false);

    const unsubSyllabuses = SyncService.syncCollection<QuranSyllabus>(
      "quran_syllabuses",
      (data) => {
        if (active) setSyllabusesList(data);
      },
      { orderByField: "order", orderDirection: "asc" }
    );

    const unsubExcerpts = SyncService.syncCollection<QuranExcerpt>(
      "quran_excerpts",
      (data) => {
        if (active) setExcerptsList(data);
      },
      { orderByField: "order", orderDirection: "asc" }
    );

    return () => {
      unsubAuth();
      active = false;

      unsubSyllabuses.then((u) => u());
      unsubExcerpts.then((u) => u());
    };
  }, []);

  const navigateToLesson = (lesson: QuranLesson, series: QuranSeries) => {
    setSelectedSeries(series);
    setSelectedLesson(lesson);
    setJumpToParagraphIndex(null);
    setActiveView("lesson-detail");
  };

  const handleLastReadClick = () => {
    setIsSidebarOpen(false);
    if (lastRead) {
      const lesson = lessonsList.find((l) => l.id === lastRead.lessonId);
      const series = seriesList.find((s) => s.id === lastRead.seriesId);
      if (lesson && series) {
        setSelectedSeries(series);
        setSelectedLesson(lesson);
        setJumpToParagraphIndex(null);
        setActiveView("lesson-detail");
      } else {
        alert("لم يتم العثور على الدرس المحفوظ");
      }
    } else {
      alert("لا يوجد سجل لآخر قراءة");
    }
  };

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
      className="flex-1 w-full flex flex-col bg-gray-50 dark:bg-gray-950 font-sans rtl relative overflow-hidden"
      dir="rtl"
    >
      {activeView !== "lesson-detail" && (
        <Header
          activeView={activeView}
          selectedSeries={selectedSeries}
          selectedSyllabus={selectedSyllabus}
          selectedExcerpt={selectedExcerpt}
          isSearching={isSearching}
          searchQuery={searchQuery}
          setIsSearching={setIsSearching}
          setSearchQuery={setSearchQuery}
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveView={setActiveView}
        />
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
            {isSearching ? (
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
                    scrollRef={scrollRef}
                    onSelectSeries={(s: any) => {
                      setSelectedSeries(s);
                      setActiveView("lessons");
                    }}
                  />
                )}
                {activeView === "lessons" && (
                  <LessonsView
                    selectedSeries={selectedSeries}
                    lessonsList={lessonsList}
                    progressList={lessonProgress}
                    syllabusesList={syllabusesList}
                    scrollRef={scrollRef}
                    onSelectLesson={navigateToLesson}
                  />
                )}
                {activeView === "lesson-detail" && (
                  <LessonDetailView
                    selectedLesson={selectedLesson}
                    selectedSeries={selectedSeries}
                    onBack={() => setActiveView("lessons")}
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
                    onSelectLesson={(lesson) => {
                      const series = seriesList.find(
                        (s: any) => s.id === lesson.seriesId
                      );
                      setSelectedSeries(series || null);
                      navigateToLesson(lesson);
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
                    lessonsList={lessonsList}
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
                    lessonsList={lessonsList}
                    scrollRef={scrollRef}
                    onGoToLesson={(lesson) => {
                      const series = seriesList.find(
                        (s: any) => s.id === lesson.seriesId
                      );
                      setSelectedSeries(series || null);
                      navigateToLesson(lesson);
                    }}
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
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
