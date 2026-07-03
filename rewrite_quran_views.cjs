const fs = require('fs');

let content = fs.readFileSync('src/pages/Quran.tsx', 'utf8');

// We need to rewrite SyllabusesView to filter by date and show the associated lesson title.
content = content.replace(/const SyllabusesView = \(\{ syllabusesList, onSelectSyllabus, scrollRef \}: any\) => \([\s\S]*?\);\n/g, 
`const SyllabusesView = ({ syllabusesList, lessonsList, onSelectLesson, scrollRef }: any) => {
  const now = Date.now();
  const activeSyllabuses = syllabusesList.filter((s: any) => now >= s.startDate && now <= s.endDate);

  return (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="grid gap-4 max-w-2xl mx-auto md:grid-cols-2">
       {activeSyllabuses.length === 0 ? (
         <p className="text-center text-text-muted py-10 col-span-full font-bold">لا توجد مقررات دراسية حالية.</p>
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
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-black">المقرر الحالي</span>
              </div>
              <span className="text-lg font-black text-text-primary">{lesson.title}</span>
              <span className="text-xs text-text-secondary font-bold">
                 من {new Date(item.startDate).toLocaleDateString('ar-EG')} إلى {new Date(item.endDate).toLocaleDateString('ar-EG')}
              </span>
           </button>
           );
         })
       )}
    </div>
  </div>
)};\n`
);

// We can remove SyllabusDetailView
content = content.replace(/const SyllabusDetailView = \(\{ selectedSyllabus, scrollRef \}: any\) => \([\s\S]*?\);\n/g, '');

// Rewrite ExcerptsView to show lesson title
content = content.replace(/const ExcerptsView = \(\{ excerptsList, onSelectExcerpt, scrollRef \}: any\) => \([\s\S]*?\);\n/g,
`const ExcerptsView = ({ excerptsList, lessonsList, onSelectExcerpt, scrollRef }: any) => (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="space-y-4 max-w-lg mx-auto">
       {excerptsList.length === 0 ? (
         <p className="text-center text-text-muted py-10 font-bold">لا توجد مقتطفات متاحة.</p>
       ) : (
         excerptsList.map((item: any) => {
           const lesson = lessonsList.find((l:any) => l.id === item.lessonId);
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
                 <span className="text-sm font-black text-text-primary">{item.title}</span>
                 {lesson && <span className="text-xs text-taiz-royal font-bold">من درس: {lesson.title}</span>}
                 <span className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{item.content}</span>
              </div>
           </button>
         )})
       )}
    </div>
  </div>
);\n`
);

// Rewrite ExcerptDetailView to show mediaUrl instead of imageUrl
content = content.replace(/const ExcerptDetailView = \(\{ selectedExcerpt, scrollRef \}: any\) => \([\s\S]*?\);\n/g,
`const ExcerptDetailView = ({ selectedExcerpt, lessonsList, scrollRef, onGoToLesson }: any) => {
  const lesson = lessonsList.find((l:any) => l.id === selectedExcerpt?.lessonId);
  return (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative bg-surface-main" ref={scrollRef}>
     <div className="max-w-2xl mx-auto p-4 leading-loose text-text-primary text-lg md:text-xl font-medium" dir="rtl">
        <h1 className="text-2xl md:text-3xl font-black mb-2 text-taiz-royal">{selectedExcerpt?.title}</h1>
        {lesson && (
          <button onClick={() => onGoToLesson(lesson)} className="inline-flex items-center gap-1 text-sm font-bold text-taiz-sky bg-taiz-sky/10 px-3 py-1 rounded-full hover:bg-taiz-sky/20 transition-colors mb-6">
            <BookOpen className="w-4 h-4" />
            الذهاب للدرس: {lesson.title}
          </button>
        )}
        {selectedExcerpt?.mediaUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-md">
             <img src={selectedExcerpt.mediaUrl} alt={selectedExcerpt.title} className="w-full h-auto" />
          </div>
        )}
        <div className="whitespace-pre-wrap text-base md:text-lg leading-[2.1] relative">
          <Quote className="absolute -top-4 -right-2 w-12 h-12 text-taiz-royal/10 -z-10 transform scale-x-[-1]" />
          {selectedExcerpt?.content || "تفاصيل المقتطف غير متوفرة."}
        </div>
     </div>
  </div>
)};\n`
);

// We need to update the LessonsView to highlight current syllabuses.
content = content.replace(/const LessonsView = \(\{ lessonsList, selectedSeries, onSelectLesson, scrollRef, progressList \}: any\) => \([\s\S]*?\);\n/g,
`const LessonsView = ({ lessonsList, selectedSeries, onSelectLesson, scrollRef, progressList, syllabusesList }: any) => {
  const now = Date.now();
  const activeSyllabusLessonIds = syllabusesList
    .filter((s:any) => now >= s.startDate && now <= s.endDate)
    .map((s:any) => s.lessonId);

  return (
  <div className="flex-1 overflow-y-auto px-4 py-8 relative" ref={scrollRef}>
    <div className="space-y-3 max-w-lg mx-auto">
       {lessonsList.length === 0 ? (
         <p className="text-center text-text-muted py-10 font-bold">لا توجد دروس متاحة في هذه السلسلة.</p>
       ) : (
         lessonsList.map((item: any, index: number) => {
           const isSyllabus = activeSyllabusLessonIds.includes(item.id);
           const p = progressList.find((p:any) => p.lessonId === item.id);
           const isComplete = p && p.completionPercentage >= 90;
           return (
           <button 
              key={item.id} 
              onClick={() => onSelectLesson(item)}
              className={\`w-full p-4 rounded-2xl shadow-soft border transition text-right flex items-center justify-between focus:outline-none \${isSyllabus ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/30' : 'bg-surface-card border-border-light hover:border-taiz-sky/30 hover:shadow-strong'}\`}
           >
              <div className="flex items-center gap-4">
                 <div className={\`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 \${isSyllabus ? 'bg-emerald-100 text-emerald-600' : isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-main text-text-secondary'}\`}>
                    {isComplete ? <CheckCircle2 className="w-5 h-5" /> : (index + 1)}
                 </div>
                 <div className="flex flex-col">
                   <span className="text-sm md:text-base font-black text-text-primary">{item.title}</span>
                   {isSyllabus && <span className="text-[10px] text-emerald-600 font-bold mt-1">الدرس المقرر</span>}
                 </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-text-muted" />
           </button>
           );
         })
       )}
    </div>
  </div>
)}
`
);

fs.writeFileSync('src/pages/Quran.tsx', content);
console.log('Done rewriting views in Quran.tsx');
