const fs = require('fs');

let content = fs.readFileSync('src/pages/Quran.tsx', 'utf8');

// Replace the useEffect block that syncs with Firestore for series and lessons.
content = content.replace(
  /const unsubSeries = SyncService\.syncCollection<QuranSeries>\("quran_series"[\s\S]*?\}, \{ orderByField: "order", orderDirection: "asc" \}\);/g,
  `// Removed Firestore sync for Series and Lessons`
);

content = content.replace(
  /const unsubLessons = SyncService\.syncCollection<QuranLesson>\("quran_lessons"[\s\S]*?\}, \{ orderByField: "order", orderDirection: "asc" \}\);/g,
  `// Removed Firestore sync for Lessons\n    setLoading(false);`
);

// Remove the Promise.all for unsubSeries and unsubLessons in the cleanup function
content = content.replace(/unsubSeries\.then\(u => u\(\)\);/g, '');
content = content.replace(/unsubLessons\.then\(u => u\(\)\);/g, '');

content = content.replace(
  /const cachedSeries = localStorage\.getItem\("quran_cache_series"\);[\s\S]*?try \{ setLessonsList\(JSON\.parse\(cachedLessons\)\); \} catch\(e\) \{\}/g,
  `const importedSeries = localStorage.getItem("quran_imported_series");
    if (importedSeries) {
      try { setSeriesList(JSON.parse(importedSeries)); } catch(e) {}
    }
    const importedLessons = localStorage.getItem("quran_imported_lessons");
    if (importedLessons) {
      try { setLessonsList(JSON.parse(importedLessons)); } catch(e) {}
    }`
);

fs.writeFileSync('src/pages/Quran.tsx', content);
console.log('Done rewriting Quran.tsx for LocalStorage');
