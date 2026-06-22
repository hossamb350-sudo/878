import { useState } from "react";
import { 
  BookOpen, Clock, Calendar, Bookmark, FileText, ChevronLeft, 
  Trash2, Undo2, Quote, Sparkles, BookMarked, MessageSquare
} from "lucide-react";
import { motion } from "motion/react";
import { QuranLesson, QuranSeries } from "../types";

interface QuranStatsProps {
  lessonsList: QuranLesson[];
  seriesList: QuranSeries[];
  bookmarks: any[];
  notes: any[];
  highlights: any[];
  lessonProgress: Record<string, number>;
  onNavigateToLesson: (lessonId: string, paragraphIndex?: number) => void;
  onClearBookmark: (lessonId: string, index: number) => void;
  onClearNote: (lessonId: string, index: number) => void;
  onClearHighlight: (lessonId: string, index: number) => void;
}

export function QuranStats({
  lessonsList,
  seriesList,
  bookmarks,
  notes,
  highlights,
  lessonProgress,
  onNavigateToLesson,
  onClearBookmark,
  onClearNote,
  onClearHighlight
}: QuranStatsProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks' | 'notes' | 'highlights'>('history');

  // Load / Compute global reading stats
  const qStats = (() => {
    try {
      const stored = localStorage.getItem("quran_reading_stats");
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return {
      lessonsReadCount: 0,
      totalReadingTimeMinutes: 0,
      lastReadTimestamp: Date.now()
    };
  })();

  // Filter lessons that have any reading progress > 0
  const startedLessons = lessonsList.filter(l => (lessonProgress[l.id] || 0) > 0).map(l => {
    const progress = lessonProgress[l.id] || 0;
    const series = seriesList.find(s => s.id === l.seriesId);
    return {
      ...l,
      progress,
      seriesTitle: series ? series.title : "من هدي القرآن"
    };
  }).sort((a, b) => b.progress - a.progress);

  // Count lessons fully or partially read
  const completedCount = Object.values(lessonProgress).filter(p => p >= 92).length;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 font-sans transition-colors duration-300" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Dashboard Title banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md text-right relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <span className="text-xs bg-emerald-900/30 text-emerald-200 font-extrabold px-3 py-1 rounded-full border border-emerald-400/20">منصتي التعليمية</span>
            <h1 className="text-2xl font-black mt-2">لوحة التقدم والمتابعة القرآنية</h1>
            <p className="text-xs text-emerald-100 font-medium">تتبع مسار تحصيلك العلمي، إحصاءات القراءة، وتفاعلاتك مع هدي القرآن</p>
          </div>
        </div>

        {/* 1. Bento Grid Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card: Completed lessons */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-extrabold block">الدروس المكتملة</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {completedCount} <span className="text-xs text-gray-400">دروس</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Total time read */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-extrabold block">إجمالي وقت القراءة</span>
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
                {qStats.totalReadingTimeMinutes || 0} <span className="text-xs text-gray-400">دقيقة</span>
              </span>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Last read active date */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-extrabold block">آخر زيارة</span>
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300 mt-1 block leading-relaxed">
                {qStats.lastReadTimestamp ? new Date(qStats.lastReadTimestamp).toLocaleDateString("ar-YE", { weekday: "long", month: "short", day: "numeric" }) : "اليوم"}
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <Calendar className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 2. Interactive Navigation tabs for user dashboard details */}
        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700 flex select-none text-xs md:text-sm font-bold shadow-sm whitespace-nowrap overflow-x-auto">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50'}`}
          >
            📊 سجل القراءة ({startedLessons.length})
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'bookmarks' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50'}`}
          >
            🔖 الإشارات ({bookmarks.length})
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'notes' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50'}`}
          >
            ✍️ المذكرات ({notes.length})
          </button>
          <button 
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'highlights' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50'}`}
          >
            ⭐ مميزات ({highlights.length})
          </button>
        </div>

        {/* 3. Panel Switcher content */}
        <div className="space-y-4">
          {/* TAB: Reading history list */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {startedLessons.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold">لم تقرأ أي درس حتى الآن.</p>
                  <p className="text-xs text-gray-400 mt-1">ابدأ بقراءة الدروس من القائمة الرئيسية لحفظ تقدمك تفاعلياً.</p>
                </div>
              ) : (
                startedLessons.map(lesson => (
                  <div 
                    key={lesson.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded">
                        {lesson.seriesTitle}
                      </span>
                      <h3 className="text-base font-black text-gray-800 dark:text-gray-100 mt-1.5 truncate">{lesson.title}</h3>
                      
                      {/* Completion Progress Bar */}
                      <div className="flex items-center gap-3 mt-2 font-mono">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${lesson.progress >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${lesson.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {lesson.progress}% {lesson.progress >= 90 ? 'مكتمل' : 'مستمر'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => onNavigateToLesson(lesson.id)}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black rounded-xl text-xs flex items-center gap-1 transition self-end sm:self-center"
                    >
                      <Undo2 className="w-3.5 h-3.5 rotate-180" />
                      <span>{lesson.progress >= 90 ? "إعادة القراءة" : "استئناف القراءة"}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Bookmarks list */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-3">
              {bookmarks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500">
                  <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold">لا توجد إشارات مرجعية محفوظة.</p>
                  <p className="text-xs text-gray-400 mt-1">يمكنك حفظ أي فقرة هامة في الدروس بالضغط عليها واختيار "حفظ إشارة".</p>
                </div>
              ) : (
                bookmarks.map((bm, idx) => (
                  <div 
                    key={`${bm.lessonId}_bm_${idx}`}
                    className="bg-[#FCFAF7] dark:bg-zinc-800 p-4 rounded-2xl border border-amber-100 dark:border-zinc-700 shadow-sm flex gap-3 text-right group relative"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700/60 pb-1">
                        <span>درس: {bm.lessonTitle || "تفاصيل الدرس"}</span>
                        <span>فِقرة {bm.paragraphIndex + 1}</span>
                      </div>
                      
                      <p className="text-sm text-stone-800 dark:text-zinc-200 leading-relaxed italic line-clamp-2">
                        {bm.text || "محتوى الإشارة المرجعية"}
                      </p>

                      <div className="flex justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/40 mt-1">
                        <button 
                          onClick={() => onClearBookmark(bm.lessonId, bm.paragraphIndex)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3" />
                          <span>إلغاء</span>
                        </button>
                        <button 
                          onClick={() => onNavigateToLesson(bm.lessonId, bm.paragraphIndex)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-bold flex items-center gap-1"
                        >
                          <Undo2 className="w-3 rotate-180" />
                          <span>ذهاب للموضع</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Notes list */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold">لا تملك مذكرات شخصية بعد.</p>
                  <p className="text-xs text-gray-400 mt-1">أضف ملحوظة على أي فقرة لتنظيم أفكارك وكتابة التلخيصات.</p>
                </div>
              ) : (
                notes.map((n, idx) => (
                  <div 
                    key={`${n.lessonId}_note_${idx}`}
                    className="bg-[#FCFAF7] dark:bg-zinc-800 p-4 rounded-2xl border border-amber-200 dark:border-zinc-700 shadow-sm space-y-3 text-right"
                  >
                    <div className="flex justify-between items-start text-[10px] text-gray-400 font-bold border-b border-gray-200/40 pb-1.5">
                      <div className="flex flex-col">
                        <span className="text-amber-800 dark:text-amber-400">ملحوظة على درس: {n.lessonTitle}</span>
                        <span className="mt-0.5">فِقرة {n.paragraphIndex + 1}</span>
                      </div>
                      <span className="text-[9px] font-medium bg-amber-100/60 px-1.5 py-0.5 rounded text-amber-900">مذكرة شخصية</span>
                    </div>

                    <div className="p-3 bg-amber-500/5 dark:bg-zinc-900 rounded-xl border-r-4 border-amber-500">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                        {n.noteText}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 text-xs">
                      <button 
                        onClick={() => onClearNote(n.lessonId, n.paragraphIndex)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3" />
                        <span>حذف</span>
                      </button>
                      <button 
                        onClick={() => onNavigateToLesson(n.lessonId, n.paragraphIndex)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <Undo2 className="w-3 rotate-180" />
                        <span>عرض الدرس والمقالة</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Highlights list */}
          {activeTab === 'highlights' && (
            <div className="space-y-3 font-sans text-right">
              {highlights.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold">لا تملك خطوط تظليل وحفظ.</p>
                  <p className="text-xs text-gray-400 mt-1">أظلل الفقرات الهامة بألوان مميزة لتسهيل الحفظ والمراجعة.</p>
                </div>
              ) : (
                highlights.map((h, idx) => {
                  const lessonObj = lessonsList.find(l => l.id === h.lessonId);
                  const themeColors = {
                    yellow: "bg-yellow-100 border-yellow-500 dark:bg-yellow-950/40 text-stone-900 dark:text-zinc-100",
                    green: "bg-emerald-100 border-emerald-500 dark:bg-emerald-950/40 text-stone-900 dark:text-zinc-100",
                    underline: "bg-transparent border-sky-500 underline decoration-sky-500 decoration-offset-4"
                  };
                  return (
                    <div 
                      key={`${h.lessonId}_hl_${idx}`}
                      className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700/50 pb-1">
                        <span>درس: {lessonObj ? lessonObj.title : "محتوى مغلّف"}</span>
                        <span className="flex items-center gap-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${h.color === 'yellow' ? 'bg-yellow-400' : h.color === 'green' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                          {h.color === 'underline' ? 'تسطير مهدب' : 'تظليل لوني'}
                        </span>
                      </div>

                      <div className={`p-3 border-r-4 rounded-l-xl leading-relaxed text-sm ${themeColors[h.color as 'yellow'|'green'|'underline'] || 'bg-gray-100 border-gray-400'}`}>
                        {lessonObj ? (lessonObj.content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)[h.paragraphIndex] || "محتوى مظلل") : "محتوى الدرس"}
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/40 mt-1">
                        <button 
                          onClick={() => onClearHighlight(h.lessonId, h.paragraphIndex)}
                          className="px-2 py-0.5 text-xs text-red-500 font-bold hover:underline"
                        >
                          حذف الميزة
                        </button>
                        <button 
                          onClick={() => onNavigateToLesson(h.lessonId, h.paragraphIndex)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-zinc-200 text-xs rounded-lg font-bold flex items-center gap-1"
                        >
                          <Undo2 className="w-3 rotate-180" />
                          <span>فتح موضع التعديل</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
