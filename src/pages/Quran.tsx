import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { QuranSeries, QuranLesson, QuranSyllabus, QuranExcerpt, QuranLastRead } from "../types";
import { 
  Menu, Info, MoreVertical, Search, Library, Bookmark, Trophy,
  Mic, Undo2, Calendar, Quote, User, X, ChevronLeft, ChevronRight, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuranReader } from "../components/QuranReader";
import { QuranStats } from "../components/QuranStats";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type QuranView = 'series' | 'lessons' | 'lesson-detail' | 'syllabuses' | 'syllabus-detail' | 'excerpts' | 'excerpt-detail' | 'stats';

// --- Sub-components moved outside to prevent re-mounting on every state update ---

const ProgressBar = ({ percentage }: { percentage: number }) => (
  <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full mt-3 overflow-hidden">
    <div 
      style={{ width: `${percentage}%` }} 
      className="h-full bg-emerald-500"
    />
  </div>
);

const QuranSearchView = ({ searchQuery, lessonsList, excerptsList, scrollRef, onNavigateToLesson, onSelectExcerpt, seriesList }: any) => {
  const results = [
    ...lessonsList.filter((l: any) => l.title.includes(searchQuery) || l.content.includes(searchQuery)).map((l: any) => ({ ...l, type: 'lesson' as const })),
    ...excerptsList.filter((e: any) => e.title.includes(searchQuery) || e.content.includes(searchQuery)).map((e: any) => ({ ...e, type: 'excerpt' as const }))
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 relative" ref={scrollRef}>
      <div className="space-y-3 max-w-lg mx-auto">
        {searchQuery.length < 2 ? (
          <p className="text-center text-gray-500 py-10">اكتب كلمة واحدة على الأقل للبحث...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-gray-500 py-10">لم يتم العثور على نتائج لـ "{searchQuery}"</p>
        ) : (
          results.map((item: any) => {
            const isLesson = item.type === 'lesson';
            return (
              <button 
                 key={item.id} 
                 onClick={() => {
                   if (isLesson) {
                     const series = seriesList.find((s: any) => s.id === item.seriesId);
                     if (series) onNavigateToLesson(item as QuranLesson, series);
                   } else {
                     onSelectExcerpt(item as QuranExcerpt);
                   }
                 }}
                 className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl flex flex-col gap-1 border border-gray-100 dark:border-gray-700 text-right shadow-sm focus:outline-none"
              >
                 <div className="flex justify-between items-center">
                   <span className="font-bold text-gray-800 dark:text-gray-100">{item.title}</span>
                   <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-bold">
                     {isLesson ? 'درس' : 'مقتطف'}
                   </span>
                 </div>
                 <p className="text-xs text-gray-500 line-clamp-1">{item.content}</p>
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
         <p className="text-center text-gray-500 py-10 font-bold">لا توجد سلاسل متاحة حالياً</p>
       ) : (
         seriesList.map((series: any) => (
           <button 
              key={series.id} 
              onClick={() => onSelectSeries(series)}
              className="w-full bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-all p-5 rounded-2xl flex items-center justify-between border-r-8 border-amber-600 dark:border-amber-500 group shadow-sm text-right focus:outline-none"
           >
              <div className="flex flex-col gap-1 pr-1">
                <span className="text-lg font-black text-gray-800 dark:text-gray-100">{series.title}</span>
                {series.description && <span className="text-xs text-gray-500 font-bold">{series.description}</span>}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shrink-0 mr-2 focus:outline-none">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
           </button>
         ))
       )}
    </div>
  </div>
);

const LessonsView = ({ selectedSeries, lessonsList, lessonProgress, onNavigateToLesson, scrollRef }: any) => {
  const seriesLessons = lessonsList.filter((l: any) => l.seriesId === selectedSeries?.id);
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
      <div className="space-y-3 max-w-lg mx-auto">
         {seriesLessons.length === 0 ? (
            <p className="text-center text-gray-500 py-10 font-bold">لا توجد دروس في هذه السلسلة أو لم يتم إضافتها بعد.</p>
         ) : (
           seriesLessons.map((lesson: any) => {
              const progress = lessonProgress[lesson.id] || 0;
              return (
                <button 
                   key={lesson.id} 
                   onClick={() => onNavigateToLesson(lesson, selectedSeries!)}
                   className="w-full bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700/80 transition p-4 rounded-2xl flex flex-col shadow-sm border border-gray-100 dark:border-gray-700 text-right group focus:outline-none"
                >
                   <div className="flex items-center justify-between w-full">
                      <span className="text-base font-black text-gray-800 dark:text-gray-200 truncate pr-2">{lesson.title}</span>
                      <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition shrink-0" />
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

const SyllabusesView = ({ syllabusesList, onSelectSyllabus, scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="grid gap-4 max-w-2xl mx-auto md:grid-cols-2">
       {syllabusesList.length === 0 ? (
         <p className="text-center text-gray-500 py-10 col-span-full font-bold">لا توجد مقررات دراسية متاحة.</p>
       ) : (
         syllabusesList.map((item: any) => (
           <button 
              key={item.id} 
              onClick={() => onSelectSyllabus(item)}
              className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-950 hover:border-emerald-500 hover:shadow-md transition text-right flex flex-col items-start gap-2 focus:outline-none"
           >
              <Calendar className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="text-base font-black text-gray-900 dark:text-gray-100">{item.title}</span>
              {item.description && <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">{item.description}</span>}
           </button>
         ))
       )}
    </div>
  </div>
);

const SyllabusDetailView = ({ selectedSyllabus, scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative bg-white dark:bg-gray-900" ref={scrollRef}>
     <div className="max-w-2xl mx-auto p-2 leading-loose text-gray-800 dark:text-gray-200 text-lg md:text-xl font-medium" dir="rtl">
        <h1 className="text-2xl md:text-3xl font-black text-center mb-4 text-emerald-800 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-950 pb-4">{selectedSyllabus?.title}</h1>
        {selectedSyllabus?.description && <p className="text-center mb-8 font-bold text-gray-500 text-sm">{selectedSyllabus.description}</p>}
        <div className="whitespace-pre-wrap text-base md:text-lg leading-[2.1]">{selectedSyllabus?.content || "تفاصيل المقرر غير متوفرة."}</div>
     </div>
  </div>
);

const ExcerptsView = ({ excerptsList, onSelectExcerpt, scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="space-y-4 max-w-lg mx-auto">
       {excerptsList.length === 0 ? (
         <p className="text-center text-gray-500 py-10 font-bold">لا توجد مقتطفات متاحة.</p>
       ) : (
         excerptsList.map((item: any) => (
           <button 
              key={item.id} 
              onClick={() => onSelectExcerpt(item)}
              className="w-full bg-amber-500/5 dark:bg-amber-500-[0.02] p-5 rounded-2xl shadow-sm border border-amber-500/10 dark:border-amber-900/10 hover:shadow-md transition text-right flex items-start gap-4 focus:outline-none"
           >
              <div className="bg-amber-100 dark:bg-amber-950/50 p-3 rounded-xl shrink-0">
                 <Quote className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                 <span className="text-base font-black text-amber-900 dark:text-amber-100 block truncate mb-1">{item.title}</span>
                 <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">{item.content}</span>
              </div>
           </button>
         ))
       )}
    </div>
  </div>
);

const ExcerptDetailView = ({ selectedExcerpt, scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-10 relative bg-[#FAF9F5] dark:bg-gray-900 animate-fade-in" ref={scrollRef}>
     <div className="max-w-2xl mx-auto flex flex-col items-center">
        {selectedExcerpt?.imageUrl && (
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-md">
             <img src={selectedExcerpt.imageUrl} alt={selectedExcerpt.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-xl w-full border border-amber-500/10 dark:border-gray-700 text-right">
           <Quote className="absolute top-6 right-6 w-12 h-12 text-amber-200 dark:text-gray-700 -z-10 opacity-30" />
           <h1 className="text-2xl font-black mb-6 text-amber-900 dark:text-amber-400">{selectedExcerpt?.title}</h1>
           <p className="text-lg md:text-xl leading-loose font-medium text-stone-800 dark:text-zinc-200 whitespace-pre-wrap">{selectedExcerpt?.content}</p>
        </div>
     </div>
  </div>
);

const LessonDetailView = ({ selectedLesson, selectedSeries, bookmarks, notes, highlights, jumpToParagraphIndex, jumpToExactId, onBack, onToggleBookmark, onSaveNote, onDeleteNote, onToggleHighlight, onDeleteHighlight, onProgressUpdate, onClearJump }: any) => {
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

const SidebarItem = ({ icon, label, description, active = false, onClick }: { icon: any, label: string, description?: string, active?: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 transition-colors text-right focus:outline-none ${active ? 'bg-gray-200 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-900/60'}`}>
    <span className={`p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm shrink-0 ${active ? 'ring-2 ring-emerald-500' : ''}`}>{icon}</span>
    <div className="flex flex-col text-right">
      <span className={`text-base font-black leading-tight ${active ? 'text-gray-950 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
      {description && <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 whitespace-nowrap">{description}</span>}
    </div>
  </button>
);

const Header = ({ activeView, selectedSeries, selectedSyllabus, selectedExcerpt, isSearching, searchQuery, setIsSearching, setSearchQuery, setIsSidebarOpen, setActiveView }: any) => {
  let title = "الدروس";
  if (activeView === 'lessons' && selectedSeries) title = selectedSeries.title;
  if (activeView === 'syllabuses') title = "مقرر الدروس";
  if (activeView === 'syllabus-detail' && selectedSyllabus) title = selectedSyllabus.title;
  if (activeView === 'excerpts') title = "المقتطفات";
  if (activeView === 'excerpt-detail' && selectedExcerpt) title = selectedExcerpt.title;
  if (activeView === 'stats') title = "لوحة التقدم";

  return (
    <div className="bg-[#1e293b] text-white pt-2 pb-0 relative z-20 shadow-md flex-shrink-0">
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative flex-1 flex items-center justify-center mx-2 overflow-hidden">
          {isSearching ? (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              className="flex items-center bg-[#2d3a4f] rounded-lg px-3 overflow-hidden w-full"
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                autoFocus
                placeholder="بحث في الدروس والمقتطفات..."
                className="bg-transparent border-none outline-none p-2 w-full text-sm font-bold text-white focus:outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <div className="bg-[#2d3a4f] px-8 py-2 relative w-full text-center truncate rounded-lg">
               <span className="relative z-10 text-sm md:text-base font-black tracking-wider truncate block">{title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isSearching && (
            <button onClick={() => setIsSearching(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none">
              <Search className="w-6 h-6" />
            </button>
          )}
          {activeView !== 'series' && activeView !== 'syllabuses' && activeView !== 'excerpts' && activeView !== 'stats' && (
             <button onClick={() => {
               if (activeView === 'lessons') setActiveView('series');
               else if (activeView === 'syllabus-detail') setActiveView('syllabuses');
               else if (activeView === 'excerpt-detail') setActiveView('excerpts');
             }} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none">
                <ChevronRight className="w-6 h-6" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, activeView, setActiveView, handleLastReadClick }: any) => (
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
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-[#f3f4f6] dark:bg-gray-900 z-[101] shadow-2xl overflow-hidden flex flex-col font-sans rtl"
          dir="rtl"
        >
          <div className="bg-[#e5e7eb] dark:bg-gray-800 p-8 flex flex-col items-center justify-center border-b border-gray-300 dark:border-gray-700 relative shrink-0">
             <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 left-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full focus:outline-none">
               <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
             </button>
             <div className="w-20 h-20 mb-4 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden border-2 border-gray-400">
               <User className="w-12 h-12 text-gray-600 dark:text-gray-300 translate-y-1.5" />
             </div>
             <h3 className="text-lg font-black text-gray-800 dark:text-white">هدي القرآن الكَريم</h3>
             <p className="text-gray-600 dark:text-gray-400 text-xs font-bold mt-1 text-center">الشهيد القائد السيد حسين بدرالدين الحوثي</p>
          </div>

          <div className="flex-1 overflow-y-auto py-4 bg-gray-50 dark:bg-gray-950">
            <SidebarItem icon={<Library className="w-5 h-5 text-amber-500" />} label="دروس الهدى" description="قائمة السلاسل والدروس الكاملة" active={activeView === 'series' || activeView === 'lessons'} onClick={() => { setActiveView('series'); setIsSidebarOpen(false); }} />
            <SidebarItem icon={<Trophy className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />} label="لوحة التقدم" description="متابعة إنجازك وإحصائيات القراءة" active={activeView === 'stats'} onClick={() => { setActiveView('stats'); setIsSidebarOpen(false); }} />
            <SidebarItem icon={<Undo2 className="w-5 h-5 rotate-180 text-amber-500" />} label="آخر قراءة" description="العودة لأخر درس توقفت عنده" onClick={handleLastReadClick} />
            <SidebarItem icon={<Calendar className="w-5 h-5 text-purple-500" />} label="مقرر الدروس" description="المقررات الدراسية المحددة" active={activeView === 'syllabuses' || activeView === 'syllabus-detail'} onClick={() => { setActiveView('syllabuses'); setIsSidebarOpen(false); }} />
            <SidebarItem icon={<Quote className="w-5 h-5 text-rose-500" />} label="المقتطفات" description="الجواهر المنتقاة من الدروس" active={activeView === 'excerpts' || activeView === 'excerpt-detail'} onClick={() => { setActiveView('excerpts'); setIsSidebarOpen(false); }} />
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const StatsView = ({ lessonsList, seriesList, bookmarks, notes, highlights, lessonProgress, onNavigateToLesson, onClearBookmark, onClearNote, onClearHighlight, onResetDashboard }: any) => (
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
  const [activeView, setActiveView] = useState<QuranView>('series');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [seriesList, setSeriesList] = useState<QuranSeries[]>([]);
  const [lessonsList, setLessonsList] = useState<QuranLesson[]>([]);
  const [syllabusesList, setSyllabusesList] = useState<QuranSyllabus[]>([]);
  const [excerptsList, setExcerptsList] = useState<QuranExcerpt[]>([]);

  // Selection State
  const [selectedSeries, setSelectedSeries] = useState<QuranSeries | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<QuranLesson | null>(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState<QuranSyllabus | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<QuranExcerpt | null>(null);

  const [lastRead, setLastRead] = useState<QuranLastRead | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Synced User Items
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [jumpToParagraphIndex, setJumpToParagraphIndex] = useState<number | null>(null);
  const [jumpToExactId, setJumpToExactId] = useState<string | null>(null);

  // Scroll restoration ref
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load LocalStorage fallbacks
    const savedLastRead = localStorage.getItem('quran_last_read');
    if (savedLastRead) {
      try { setLastRead(JSON.parse(savedLastRead)); } catch(e) {}
    }

    const savedProgress = localStorage.getItem('quran_lesson_progress');
    if (savedProgress) {
      try { setLessonProgress(JSON.parse(savedProgress)); } catch(e) {}
    }

    const savedBookmarks = localStorage.getItem("quran_bookmarks");
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch(e){}
    }

    const savedNotes = localStorage.getItem("quran_notes");
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)); } catch(e){}
    }

    const savedHighlights = localStorage.getItem("quran_highlights");
    if (savedHighlights) {
      try { setHighlights(JSON.parse(savedHighlights)); } catch(e){}
    }

    // 2. Fetch Quran content lists
    const unsubSeries = onSnapshot(query(collection(db, "quran_series"), orderBy("order", "asc")), (snap) => {
      setSeriesList(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuranSeries)));
      setLoading(false);
    });

    const unsubLessons = onSnapshot(query(collection(db, "quran_lessons"), orderBy("order", "asc")), (snap) => {
      setLessonsList(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuranLesson)));
    });

    const unsubSyllabuses = onSnapshot(query(collection(db, "quran_syllabuses"), orderBy("order", "asc")), (snap) => {
      setSyllabusesList(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuranSyllabus)));
    });

    const unsubExcerpts = onSnapshot(query(collection(db, "quran_excerpts"), orderBy("order", "asc")), (snap) => {
      setExcerptsList(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuranExcerpt)));
    });

    // 3. User Cloud Sync subcollections
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const uid = currentUser.uid;
        try {
          // Sync Bookmarks
          try {
            const bSnap = await getDocs(collection(db, "users", uid, "bookmarks"));
            const bList = bSnap.docs.map(d => d.data());
            if (bList.length > 0) {
              setBookmarks(bList);
              localStorage.setItem("quran_bookmarks", JSON.stringify(bList));
            }
          } catch (bErr) {
            handleFirestoreError(bErr, OperationType.GET, `users/${uid}/bookmarks`);
          }

          // Sync Notes
          try {
            const nSnap = await getDocs(collection(db, "users", uid, "notes"));
            const nList = nSnap.docs.map(d => d.data());
            if (nList.length > 0) {
              setNotes(nList);
              localStorage.setItem("quran_notes", JSON.stringify(nList));
            }
          } catch (nErr) {
            handleFirestoreError(nErr, OperationType.GET, `users/${uid}/notes`);
          }

          // Sync Highlights
          try {
            const hSnap = await getDocs(collection(db, "users", uid, "highlights"));
            const hList = hSnap.docs.map(d => d.data());
            if (hList.length > 0) {
              setHighlights(hList);
              localStorage.setItem("quran_highlights", JSON.stringify(hList));
            }
          } catch (hErr) {
            handleFirestoreError(hErr, OperationType.GET, `users/${uid}/highlights`);
          }

          // Sync Lesson Progress
          try {
            const pSnap = await getDocs(collection(db, "users", uid, "progress"));
            const pMap: Record<string, number> = {};
            pSnap.docs.forEach(d => {
              pMap[d.id] = d.data().percentage || 0;
            });
            if (Object.keys(pMap).length > 0) {
              setLessonProgress(pMap);
              localStorage.setItem("quran_lesson_progress", JSON.stringify(pMap));
            }
          } catch (pErr) {
             console.error("Sync progress error:", pErr);
          }

          // Sync Last Read
          try {
            const lrDoc = await getDoc(doc(db, "users", uid, "lastRead", "current"));
            if (lrDoc.exists()) {
              const lrData = lrDoc.data() as QuranLastRead;
              setLastRead(lrData);
              localStorage.setItem("quran_last_read", JSON.stringify(lrData));
            }
          } catch (lrErr) {
            console.error("Sync last read error:", lrErr);
          }
        } catch(e) {
          console.error("Cloud synchronizer fail:", e);
        }
      }
    });

    return () => {
      unsubSeries(); unsubLessons(); unsubSyllabuses(); unsubExcerpts(); unsubAuth();
    };
  }, []);

  const navigateToLesson = (lesson: QuranLesson, series: QuranSeries) => {
    setSelectedSeries(series);
    setSelectedLesson(lesson);
    setJumpToParagraphIndex(null);
    setActiveView('lesson-detail');
  };

  const handleLastReadClick = () => {
    setIsSidebarOpen(false);
    if (lastRead) {
      const lesson = lessonsList.find(l => l.id === lastRead.lessonId);
      const series = seriesList.find(s => s.id === lastRead.seriesId);
      if (lesson && series) {
        setSelectedSeries(series);
        setSelectedLesson(lesson);
        setJumpToParagraphIndex(null);
        setActiveView('lesson-detail');
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
    const isBookmarked = bookmarks.some(b => b.lessonId === selectedLesson.id && b.paragraphIndex === paragraphIndex);
    
    const updated = isBookmarked
      ? bookmarks.filter(b => !(b.lessonId === selectedLesson.id && b.paragraphIndex === paragraphIndex))
      : [...bookmarks, {
          lessonId: selectedLesson.id,
          seriesId: selectedSeries.id,
          lessonTitle: selectedLesson.title,
          seriesTitle: selectedSeries.title,
          paragraphIndex,
          text: text.substring(0, 150) + (text.length > 150 ? "..." : ""),
          createdAt: Date.now()
        }];

    setBookmarks(updated);
    localStorage.setItem("quran_bookmarks", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const id = `${selectedLesson.id}_p${paragraphIndex}`;
        const ref = doc(db, "users", auth.currentUser.uid, "bookmarks", id);
        if (isBookmarked) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, {
            lessonId: selectedLesson.id,
            seriesId: selectedSeries.id,
            lessonTitle: selectedLesson.title,
            seriesTitle: selectedSeries.title,
            paragraphIndex,
            text: text.substring(0, 150) + (text.length > 150 ? "..." : ""),
            createdAt: Date.now()
          });
        }
      } catch (e) {
        console.error("Direct db sync bookmark error:", e);
      }
    }
  };

  const handleClearBookmark = async (lessonId: string, paragraphIndex: number) => {
    const updated = bookmarks.filter(b => !(b.lessonId === lessonId && b.paragraphIndex === paragraphIndex));
    setBookmarks(updated);
    localStorage.setItem("quran_bookmarks", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const id = `${lessonId}_p${paragraphIndex}`;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "bookmarks", id));
      } catch(e){}
    }
  };

  const handleSaveNote = async (paragraphIndex: number, noteText: string, quote?: string) => {
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
      updatedAt: Date.now()
    };

    const updated = [...notes, newNote];

    setNotes(updated);
    localStorage.setItem("quran_notes", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid, "notes", newNote.id), newNote);
      } catch(e){}
    }
  };

  const handleDeleteNote = async (noteIdOrIndex: string | number) => {
    if (!selectedLesson) return;
    let updated;
    let idToDelete = "";

    if (typeof noteIdOrIndex === 'string') {
      updated = notes.filter(n => n.id !== noteIdOrIndex);
      idToDelete = noteIdOrIndex;
    } else {
      // Legacy support for index-based delete
      const noteToDelete = notes.find(n => n.lessonId === selectedLesson.id && n.paragraphIndex === noteIdOrIndex);
      if (noteToDelete) {
        idToDelete = noteToDelete.id || `${selectedLesson.id}_p${noteIdOrIndex}`;
        updated = notes.filter(n => n !== noteToDelete);
      } else {
        updated = notes;
      }
    }

    setNotes(updated);
    localStorage.setItem("quran_notes", JSON.stringify(updated));

    if (auth.currentUser && idToDelete) {
      try {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "notes", idToDelete));
      } catch(e){}
    }
  };

  const handleClearNote = async (lessonId: string, paragraphIndex: number) => {
    const updated = notes.filter(n => !(n.lessonId === lessonId && n.paragraphIndex === paragraphIndex));
    setNotes(updated);
    localStorage.setItem("quran_notes", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const id = `${lessonId}_p${paragraphIndex}`;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "notes", id));
      } catch(e){}
    }
  };

  const handleToggleHighlight = async (paragraphIndex: number, color: string, text?: string, startOffset?: number, endOffset?: number) => {
    if (!selectedLesson) return;
    
    // For specific text highlights, match with text and startOffset
    const exIdx = highlights.findIndex(h => 
      h.lessonId === selectedLesson.id && 
      h.paragraphIndex === paragraphIndex && 
      (text ? (h.text === text && h.startOffset === startOffset) : !h.text)
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
        startOffset: typeof startOffset === 'number' ? startOffset : null,
        endOffset: typeof endOffset === 'number' ? endOffset : null,
        createdAt: Date.now() 
      };
      
      if (exIdx > -1 && !text) {
        updated = highlights.map((h, i) => i === exIdx ? item : h);
      } else {
        updated = [...highlights, item];
      }
    }

    setHighlights(updated);
    localStorage.setItem("quran_highlights", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const id = `${selectedLesson.id}_p${paragraphIndex}`;
        const ref = doc(db, "users", auth.currentUser.uid, "highlights", id);
        if (!text) {
          if (isSameColor) await deleteDoc(ref);
          else await setDoc(ref, { lessonId: selectedLesson.id, paragraphIndex, color, createdAt: Date.now() });
        } else {
          // Inline highlights are more complex to sync individually, so we update the parent doc for now if requested
          // For now, let's just keep local updates and rely on the full sync mechanism if available.
        }
      } catch(e){}
    }
  };

  const handleDeleteHighlight = async (paragraphIndex: number) => {
    if (!selectedLesson) return;
    const updated = highlights.filter(h => !(h.lessonId === selectedLesson.id && h.paragraphIndex === paragraphIndex));
    setHighlights(updated);
    localStorage.setItem("quran_highlights", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const id = `${selectedLesson.id}_p${paragraphIndex}`;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "highlights", id));
      } catch(e){}
    }
  };

  const handleClearHighlight = async (lessonId: string, paragraphIndex: number) => {
    const updated = highlights.filter(h => !(h.lessonId === lessonId && h.paragraphIndex === paragraphIndex));
    setHighlights(updated);
    localStorage.setItem("quran_highlights", JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const id = `${lessonId}_p${paragraphIndex}`;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "highlights", id));
      } catch(e){}
    }
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
      timestamp: Date.now()
    };
    setLastRead(progress);
    localStorage.setItem('quran_last_read', JSON.stringify(progress));

    if (auth.currentUser) {
      setDoc(doc(db, "users", auth.currentUser.uid, "lastRead", "current"), progress);
    }

    setLessonProgress(prev => {
      const current = prev[selectedLesson.id] || 0;
      const nextVal = Math.max(current, percent);
      if (nextVal !== current) {
        const nextMap = { ...prev, [selectedLesson.id]: nextVal };
        localStorage.setItem("quran_lesson_progress", JSON.stringify(nextMap));

        if (auth.currentUser) {
          setDoc(doc(db, "users", auth.currentUser.uid, "progress", selectedLesson.id), {
            percentage: nextVal,
            updatedAt: Date.now()
          });
        }

        // Stats tracking
        if (nextVal >= 92 && current < 92) {
          try {
            const stored = localStorage.getItem("quran_reading_stats");
            const parsed = stored ? JSON.parse(stored) : { lessonsReadCount: 0, totalReadingTimeMinutes: 0, lastReadTimestamp: Date.now() };
            parsed.lessonsReadCount += 1;
            parsed.lastReadTimestamp = Date.now();
            localStorage.setItem("quran_reading_stats", JSON.stringify(parsed));
            if (auth.currentUser) {
               setDoc(doc(db, "users", auth.currentUser.uid, "stats", "reader"), parsed, { merge: true });
            }
          } catch(e){}
        }
        return nextMap;
      }
      return prev;
    });
  };

  const handleHopToLesson = (lessonId: string, paragraphIndex?: number, exactId?: string) => {
    const lesson = lessonsList.find(l => l.id === lessonId);
    if (lesson) {
      const series = seriesList.find(s => s.id === lesson.seriesId);
      if (series) {
        setSelectedSeries(series);
        setSelectedLesson(lesson);
        if (typeof paragraphIndex === 'number') {
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
        setActiveView('lesson-detail');
      }
    }
  };

  const handleResetDashboard = async () => {
    const confirmReset = window.confirm("هل أنت متأكد من تصفير وإعادة تعيين لوحة التقدم والمتابعة القرآنية بالكامل؟ سيؤدي هذا لحذف كافة سجلات القراءة والإحصائيات والمفضلة والملحوظات والتلوين.");
    if (!confirmReset) return;

    // Reset local state
    setLastRead(null);
    setLessonProgress({});
    setBookmarks([]);
    setNotes([]);
    setHighlights([]);

    // Clear local storage
    localStorage.removeItem('quran_last_read');
    localStorage.removeItem('quran_lesson_progress');
    localStorage.removeItem('quran_bookmarks');
    localStorage.removeItem('quran_notes');
    localStorage.removeItem('quran_highlights');
    localStorage.removeItem('quran_reading_stats');

    // Firestore deletion
    if (auth.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        // Delete Bookmarks
        for (const item of bookmarks) {
          const id = `${item.lessonId}_p${item.paragraphIndex}`;
          try { await deleteDoc(doc(db, "users", uid, "bookmarks", id)); } catch(e){}
        }
        // Delete Notes
        for (const item of notes) {
          const id = item.id || `${item.lessonId}_p${item.paragraphIndex}`;
          try { await deleteDoc(doc(db, "users", uid, "notes", id)); } catch(e){}
        }
        // Delete Highlights
        for (const item of highlights) {
          const id = `${item.lessonId}_p${item.paragraphIndex}`;
          try { await deleteDoc(doc(db, "users", uid, "highlights", id)); } catch(e){}
        }
      } catch (err) {
        console.warn("Could not delete cloud backup synchronized values", err);
      }
    }
    
    alert("تم تصفير لوحة التقدم وإعادة تعيين كافة الأنشطة بنجاح.");
  };

  const PatternBackground = () => (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden z-0">
      <svg width="100%" height="100%">
        <pattern id="islamic-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M50 0L64.6 35.4L100 50L64.6 64.6L50 100L35.4 64.6L0 50L35.4 35.4L50 0Z" fill="currentColor" />
          <path d="M50 20L58.8 41.2L80 50L58.8 58.8L50 80L41.2 58.8L20 50L41.2 41.2L50 20Z" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center h-full min-h-[50vh] bg-gray-100 dark:bg-gray-950">
         <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-slate-600 dark:text-gray-300 font-extrabold text-sm">جاري تنزيل المحتويات العلمية...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-gray-50 dark:bg-gray-950 font-sans rtl relative overflow-hidden" dir="rtl">
      {activeView !== 'lesson-detail' && (
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
        {activeView !== 'lesson-detail' && <PatternBackground />}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col z-10"
          >
            {isSearching ? <QuranSearchView 
              searchQuery={searchQuery}
              lessonsList={lessonsList}
              excerptsList={excerptsList}
              seriesList={seriesList}
              scrollRef={scrollRef}
              onNavigateToLesson={navigateToLesson}
              onSelectExcerpt={(e: any) => { setSelectedExcerpt(e); setActiveView('excerpt-detail'); }}
            /> : (
              <>
                {activeView === 'series' && <SeriesView 
                  seriesList={seriesList}
                  scrollRef={scrollRef}
                  onSelectSeries={(s: any) => { setSelectedSeries(s); setActiveView('lessons'); }}
                />}
                {activeView === 'lessons' && <LessonsView 
                  selectedSeries={selectedSeries}
                  lessonsList={lessonsList}
                  lessonProgress={lessonProgress}
                  scrollRef={scrollRef}
                  onNavigateToLesson={navigateToLesson}
                />}
                {activeView === 'lesson-detail' && <LessonDetailView 
                  selectedLesson={selectedLesson}
                  selectedSeries={selectedSeries}
                  onBack={() => setActiveView('lessons')}
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
                />}
                {activeView === 'syllabuses' && <SyllabusesView 
                   syllabusesList={syllabusesList}
                   scrollRef={scrollRef}
                   onSelectSyllabus={(s: any) => { setSelectedSyllabus(s); setActiveView('syllabus-detail'); }}
                />}
                {activeView === 'syllabus-detail' && <SyllabusDetailView 
                  selectedSyllabus={selectedSyllabus}
                  scrollRef={scrollRef}
                  onBack={() => setActiveView('syllabuses')}
                  onNavigateToLesson={handleHopToLesson}
                />}
                {activeView === 'excerpts' && <ExcerptsView 
                  excerptsList={excerptsList}
                  scrollRef={scrollRef}
                  onSelectExcerpt={(e: any) => { setSelectedExcerpt(e); setActiveView('excerpt-detail'); }}
                />}
                {activeView === 'excerpt-detail' && <ExcerptDetailView 
                  selectedExcerpt={selectedExcerpt}
                  scrollRef={scrollRef}
                  onBack={() => setActiveView('excerpts')}
                  onShareExcerpt={(txt: string) => { navigator.clipboard.writeText(txt); alert("تم نسخ المقتطف!"); }}
                />}
                {activeView === 'stats' && <StatsView 
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
                />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
