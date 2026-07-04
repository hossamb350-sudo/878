import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const db = new DatabaseSync('mlz.db');

// 1. Fetch Series from m_master
const rawSeries = db.prepare("SELECT * FROM m_master ORDER BY m_id ASC").all();

// 2. Fetch Lessons from malazm
const rawLessons = db.prepare("SELECT * FROM malazm ORDER BY m_xid ASC, part_no ASC, mlz_id ASC").all();

// 3. Fetch Pages from malazim_pages
const rawPages = db.prepare("SELECT * FROM malazim_pages ORDER BY mlz_id ASC, mlz_page ASC").all();

// Group pages by lesson ID
const pagesByLesson = {};
for (const p of rawPages) {
  if (!pagesByLesson[p.mlz_id]) {
    pagesByLesson[p.mlz_id] = [];
  }
  pagesByLesson[p.mlz_id].push(p.mlz_content || "");
}

// Map SQLite series to QuranSeries type
const quranSeries = rawSeries.map((s, idx) => ({
  id: String(s.m_id),
  title: s.m_name || "",
  description: "",
  imageUrl: "",
  order: idx + 1,
  createdAt: Date.now()
}));

// Map SQLite lessons to QuranLesson type
const quranLessons = rawLessons.map((l, idx) => {
  const lessonPages = pagesByLesson[l.mlz_id] || [];
  const content = lessonPages.join("\n\n");
  
  return {
    id: String(l.mlz_id),
    seriesId: String(l.m_xid),
    title: l.mlz_name || "",
    content: content,
    order: idx + 1,
    createdAt: Date.now()
  };
});

const output = {
  series: quranSeries,
  lessons: quranLessons
};

// Ensure directory exists
if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data');
}

fs.writeFileSync('src/data/importedQuranData.json', JSON.stringify(output, null, 2));
console.log("Data exported to src/data/importedQuranData.json");
