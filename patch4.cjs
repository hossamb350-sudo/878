const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

code = code.replace(/    const unsub = onSnapshot\(\s*query\(collection\(db, "quran_excerpts"\), orderBy\("createdAt", "desc"\)\),\s*\(snap\) => \{\s*setList\(\s*snap\.docs\.map\(\(d\) => \(\{ id: d\.id, \.\.\.d\.data\(\) \} as QuranExcerpt\)\)\s*\);\s*\}\s*\);\s*return unsub;\s*\}, \[\]\);/,
  `    const unsub = onSnapshot(
      query(collection(db, "quran_excerpts"), orderBy("createdAt", "desc")),
      (snap) => {
        setList(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuranExcerpt))
        );
      }
    );
    return () => {
      unsub();
      unsubLessons?.();
    };
  }, []);`);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log('Done Excerpts Return Fix');
