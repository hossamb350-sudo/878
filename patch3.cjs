const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// target: function AdminQuranExcerpts() { ... const [localLessons, setLocalLessons] = useState<QuranLesson[]>([]);
code = code.replace(/function AdminQuranExcerpts\(\) \{\s*const \[list, setList\] = useState<QuranExcerpt\[\]>\(\[\]\);\s*const \[localLessons, setLocalLessons\] = useState<QuranLesson\[\]>\(\[\]\);\s*const \[editingId, setEditingId\] = useState<string \| null>\(null\);/,
  `function AdminQuranExcerpts() {
  const [list, setList] = useState<QuranExcerpt[]>([]);
  const [localLessons, setLocalLessons] = useState<QuranLesson[]>(STATIC_QURAN_LESSONS);
  const [editingId, setEditingId] = useState<string | null>(null);`
);

code = code.replace(/  useEffect\(\(\) => \{\s*try \{\s*const saved = localStorage\.getItem\("quran_imported_lessons"\);\s*if \(saved\) setLocalLessons\(JSON\.parse\(saved\)\);\s*\} catch \(e\) \{\}/,
  `  useEffect(() => {
    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons")),
      (snap) => {
        const firestoreLessons = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuranLesson));
        setLocalLessons([...STATIC_QURAN_LESSONS, ...firestoreLessons]);
      }
    );`);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log('Done Excerpts');
