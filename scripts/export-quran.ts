import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportData() {
  console.log("Fetching Quran data from Firestore...");
  
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

  const seriesSnap = await getDocs(query(collection(db, "quran_series"), orderBy("order", "asc")));
  const lessonsSnap = await getDocs(query(collection(db, "quran_lessons"), orderBy("order", "asc")));
  const excerptsSnap = await getDocs(query(collection(db, "quran_excerpts"), orderBy("createdAt", "desc")));
  const syllabusesSnap = await getDocs(query(collection(db, "quran_syllabuses"), orderBy("createdAt", "desc")));
  
  const series = seriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const excerpts = excerptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const syllabuses = syllabusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const data = {
    series,
    lessons,
    excerpts,
    syllabuses,
    lastUpdated: new Date().toISOString()
  };
  
  const outPath = path.resolve(__dirname, '../src/data/hadi_quran.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log(`Successfully exported data to ${outPath}`);
  console.log(`- Series: ${series.length}`);
  console.log(`- Lessons: ${lessons.length}`);
  console.log(`- Excerpts: ${excerpts.length}`);
  console.log(`- Syllabuses: ${syllabuses.length}`);
}

exportData().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(e => {
  console.error("Failed to export data:", e);
  process.exit(1);
});
