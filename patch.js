const fs = require('fs');
let code = fs.readFileSync('src/pages/Quran.tsx', 'utf8');

const target = `    setLessonsList(STATIC_QURAN_LESSONS);
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
  }, []);`;

const replacement = `    setLessonsList(STATIC_QURAN_LESSONS);
    setLoading(false);

    const unsubSeries = SyncService.syncCollection<QuranSeries>(
      "quran_series",
      (data) => {
        if (active) {
          setSeriesList((prev) => {
            const staticIds = new Set(STATIC_QURAN_SERIES.map((s) => s.id));
            const newDynamic = data.filter((d) => !staticIds.has(d.id));
            return [...STATIC_QURAN_SERIES, ...newDynamic].sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            );
          });
        }
      },
      { orderByField: "order", orderDirection: "asc" }
    );

    const unsubLessons = SyncService.syncCollection<QuranLesson>(
      "quran_lessons",
      (data) => {
        if (active) {
          setLessonsList((prev) => {
            const staticIds = new Set(STATIC_QURAN_LESSONS.map((l) => l.id));
            const newDynamic = data.filter((d) => !staticIds.has(d.id));
            return [...STATIC_QURAN_LESSONS, ...newDynamic].sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            );
          });
        }
      },
      { orderByField: "order", orderDirection: "asc" }
    );

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
      unsubSeries.then((u) => u());
      unsubLessons.then((u) => u());
      unsubSyllabuses.then((u) => u());
      unsubExcerpts.then((u) => u());
    };
  }, []);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/Quran.tsx', code);
  console.log('Success Quran.tsx');
} else {
  console.log('Target not found in Quran.tsx');
}
