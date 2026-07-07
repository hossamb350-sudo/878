import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

// Dynamic data loading from Firestore with local caching
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  // Check local storage for cached data
  const localCache = localStorage.getItem('quran_data_cache');
  const cacheTimestamp = localStorage.getItem('quran_data_timestamp');
  const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
  
  if (localCache && cacheTimestamp) {
    const now = Date.now();
    if (now - parseInt(cacheTimestamp) < CACHE_EXPIRATION) {
      console.log('Loading Quran data from local cache');
      cachedData = JSON.parse(localCache);
      return cachedData;
    }
  }

  try {
    console.log('Loading Quran data from Firestore...');
    
    // Fetch all collections in parallel
    const [seriesSnap, lessonsSnap, excerptsSnap, syllabusesSnap] = await Promise.all([
      getDocs(query(collection(db, "quran_series"), orderBy("order", "asc"))),
      getDocs(query(collection(db, "quran_lessons"), orderBy("order", "asc"))),
      getDocs(query(collection(db, "quran_excerpts"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "quran_syllabuses"), orderBy("createdAt", "desc")))
    ]);

    const series = seriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const excerpts = excerptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const syllabuses = syllabusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fallback to API if Firestore is empty (initial migration)
    if (series.length === 0 && lessons.length === 0) {
      console.warn('Firestore is empty, falling back to API...');
      const res = await fetch('/api/quran-data');
      if (res.ok) {
        const apiData = await res.json();
        // Optionally seed Firestore here, but better to let Admin do it or separate script
        cachedData = apiData;
      }
    } else {
      cachedData = { series, lessons, excerpts, syllabuses };
    }

    if (cachedData) {
      localStorage.setItem('quran_data_cache', JSON.stringify(cachedData));
      localStorage.setItem('quran_data_timestamp', Date.now().toString());
    }

    console.log('Quran data loaded successfully');
    return cachedData;
  } catch (error) {
    console.error('Critical error loading Quran data from Firestore:', error);
    
    // Fallback to API/Local JSON if Firestore fails
    try {
      const res = await fetch('/api/quran-data');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    return { series: [], lessons: [], excerpts: [], syllabuses: [] };
  }
}

export const importedQuranData = { series: [], lessons: [], excerpts: [], syllabuses: [] };
