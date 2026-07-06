const fs = require('fs');
let code = fs.readFileSync('src/pages/Quran.tsx', 'utf8');

const replacement = `    setLessonsList(STATIC_QURAN_LESSONS);
    setLoading(false);

    const unsubSeries = SyncService.syncCollection(
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

    const unsubLessons = SyncService.syncCollection(
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

    const unsubSyllabuses = SyncService.syncCollection(
      "quran_syllabuses",
      (data) => {
        if (active) setSyllabusesList(data);
      },
      { orderByField: "order", orderDirection: "asc" }
    );`;

// Regex replacement
code = code.replace(/    setLessonsList\(STATIC_QURAN_LESSONS\);\s*setLoading\(false\);\s*const unsubSyllabuses = SyncService\.syncCollection<QuranSyllabus>\(\s*"quran_syllabuses",\s*\(data\) => \{\s*if \(active\) setSyllabusesList\(data\);\s*\},\s*\{ orderByField: "order", orderDirection: "asc" \}\s*\);/, replacement);

code = code.replace(/      unsubSyllabuses\.then\(\(u\) => u\(\)\);\s*unsubExcerpts\.then\(\(u\) => u\(\)\);\s*\};\s*\}, \[\]\);/, 
`      unsubSeries.then((u) => u());
      unsubLessons.then((u) => u());
      unsubSyllabuses.then((u) => u());
      unsubExcerpts.then((u) => u());
    };
  }, []);`);

fs.writeFileSync('src/pages/Quran.tsx', code);
console.log('Done');
