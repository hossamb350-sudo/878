const fs = require('fs');

let content = fs.readFileSync('src/pages/Quran.tsx', 'utf8');

// Fix LessonsView props in the JSX
content = content.replace(
  /\{activeView === 'lessons' && <LessonsView[\s\S]*?\/>\}/g,
  `{activeView === 'lessons' && <LessonsView 
                  selectedSeries={selectedSeries}
                  lessonsList={lessonsList}
                  progressList={lessonProgress}
                  syllabusesList={syllabusesList}
                  scrollRef={scrollRef}
                  onSelectLesson={navigateToLesson}
                />}`
);

// Fix SyllabusesView props in the JSX
content = content.replace(
  /\{activeView === 'syllabuses' && <SyllabusesView[\s\S]*?\/>\}/g,
  `{activeView === 'syllabuses' && <SyllabusesView 
                  syllabusesList={syllabusesList}
                  lessonsList={lessonsList}
                  onSelectLesson={(lesson) => {
                    const series = seriesList.find((s:any) => s.id === lesson.seriesId);
                    setSelectedSeries(series || null);
                    navigateToLesson(lesson);
                  }}
                  scrollRef={scrollRef}
                />}`
);

// Fix ExcerptsView props in the JSX
content = content.replace(
  /\{activeView === 'excerpts' && <ExcerptsView[\s\S]*?\/>\}/g,
  `{activeView === 'excerpts' && <ExcerptsView 
                  excerptsList={excerptsList}
                  lessonsList={lessonsList}
                  onSelectExcerpt={(excerpt) => {
                    setSelectedExcerpt(excerpt);
                    setActiveView('excerpt-detail');
                    setJumpToParagraphIndex(null);
                  }}
                  scrollRef={scrollRef}
                />}`
);

// Fix ExcerptDetailView props in the JSX
content = content.replace(
  /\{activeView === 'excerpt-detail' && <ExcerptDetailView[\s\S]*?\/>\}/g,
  `{activeView === 'excerpt-detail' && <ExcerptDetailView 
                  selectedExcerpt={selectedExcerpt}
                  lessonsList={lessonsList}
                  scrollRef={scrollRef}
                  onGoToLesson={(lesson) => {
                    const series = seriesList.find((s:any) => s.id === lesson.seriesId);
                    setSelectedSeries(series || null);
                    navigateToLesson(lesson);
                  }}
                />}`
);

fs.writeFileSync('src/pages/Quran.tsx', content);
console.log('Done fixing JSX props in Quran.tsx');
