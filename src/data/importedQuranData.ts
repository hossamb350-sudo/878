import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { get as getIDB, set as setIDB } from "idb-keyval";
import { Capacitor } from "@capacitor/core";

// Dynamic data loading from Firestore with IndexedDB caching
let cachedData: any = null;
const API_BASE = Capacitor.isNativePlatform() ? "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app" : "";

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  // Check IndexedDB for cached data
  const CACHE_KEY = 'quran_data_cache';
  const TIMESTAMP_KEY = 'quran_data_timestamp';
  const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
  
  try {
    const localCache = await getIDB(CACHE_KEY);
    const cacheTimestamp = await getIDB(TIMESTAMP_KEY);
    
    if (localCache && cacheTimestamp) {
      const now = Date.now();
      if (now - Number(cacheTimestamp) < CACHE_EXPIRATION) {
        console.log('Loading Quran data from IndexedDB cache');
        cachedData = localCache;
        return cachedData;
      }
    }
  } catch (e) {
    console.warn('Error reading from IndexedDB:', e);
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
      const res = await fetch(`${API_BASE}/api/quran-data`);
      if (res.ok) {
        const apiData = await res.json();
        cachedData = apiData;
      }
    } else {
      cachedData = { series, lessons, excerpts, syllabuses };
    }

    if (cachedData) {
      // Save to IndexedDB (supports much larger data than localStorage)
      await setIDB(CACHE_KEY, cachedData);
      await setIDB(TIMESTAMP_KEY, Date.now());
    }

    console.log('Quran data loaded successfully');
    return cachedData;
  } catch (error) {
    console.error('Critical error loading Quran data from Firestore:', error);
    
    // Fallback to API/Local JSON if Firestore fails
    try {
      const res = await fetch(`${API_BASE}/api/quran-data`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    return { series: [], lessons: [], excerpts: [], syllabuses: [] };
  }
}

export const importedQuranData = { series: [], lessons: [], excerpts: [], syllabuses: [] };
