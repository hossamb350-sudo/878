const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

if (!code.includes('STATIC_QURAN_LESSONS')) {
  code = code.replace(
    'import { AdminNewsWizard } from "../components/AdminNewsWizard";',
    'import { AdminNewsWizard } from "../components/AdminNewsWizard";\nimport { STATIC_QURAN_LESSONS } from "../data/staticQuranData";'
  );
}

// Fix AdminQuranSyllabuses
let syllabusesCode = `  const [localLessons, setLocalLessons] = useState<QuranLesson[]>(STATIC_QURAN_LESSONS);
  useEffect(() => {
    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons")),
      (snap) => {
        const firestoreLessons = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuranLesson));
        setLocalLessons([...STATIC_QURAN_LESSONS, ...firestoreLessons]);
      }
    );`;

code = code.replace(/  const \[localLessons, setLocalLessons\] = useState<QuranLesson\[\]>\(\[\]\);\s*const \[editingId, setEditingId\] = useState<string \| null>\(null\);/, 
  `  const [localLessons, setLocalLessons] = useState<QuranLesson[]>(STATIC_QURAN_LESSONS);\n  const [editingId, setEditingId] = useState<string | null>(null);`);

code = code.replace(/  useEffect\(\(\) => \{\s*\/\/ Load local lessons\s*try \{\s*const saved = localStorage\.getItem\("quran_imported_lessons"\);\s*if \(saved\) \{\s*setLocalLessons\(JSON\.parse\(saved\)\);\s*\}\s*\} catch \(e\) \{\}/g, 
  `  useEffect(() => {
    const unsubLessons = onSnapshot(
      query(collection(db, "quran_lessons")),
      (snap) => {
        const firestoreLessons = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuranLesson));
        setLocalLessons([...STATIC_QURAN_LESSONS, ...firestoreLessons]);
      }
    );`);

code = code.replace(/    return \(\) => \{\s*unsub\(\);\s*unsubEvents\(\);\s*\};\s*\}, \[\]\);/g,
  `    return () => {
      unsub();
      unsubEvents?.();
      unsubLessons?.();
    };
  }, []);`);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log('Done Admin');
