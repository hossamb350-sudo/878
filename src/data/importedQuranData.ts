import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { get as getIDB, set as setIDB } from "idb-keyval";
import { Capacitor } from "@capacitor/core";

// Dynamic data loading from Firestore with IndexedDB caching
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  const CACHE_KEY = 'quran_data_cache';
  const TIMESTAMP_KEY = 'quran_data_timestamp';
  const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
  
  const isNative = Capacitor.isNativePlatform();
  const API_BASE = isNative 
    ? (import.meta.env.VITE_API_BASE_URL || "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app")
    : "";
  
  let localCache: any = null;
  let cacheTimestamp: number = 0;

  // 1. Check IndexedDB for cached data (Hydrate UI immediately if offline or fresh)
  try {
    localCache = await getIDB(CACHE_KEY);
    const ts = await getIDB(TIMESTAMP_KEY);
    if (ts) cacheTimestamp = Number(ts);
    
    if (localCache && cacheTimestamp) {
      const now = Date.now();
      const isOffline = !navigator.onLine;
      
      // If offline, OR cache is fresh, return local data instantly
      if (isOffline || (now - cacheTimestamp < CACHE_EXPIRATION)) {
        console.log(`[SyncService] Hydrating Quran data from IndexedDB cache. Offline: ${isOffline}`);
        cachedData = localCache;
        
        // If we are online but just returning fresh cache, we could optionally 
        // trigger background sync here. But for now, returning cache is sufficient.
        return cachedData;
      }
    }
  } catch (e) {
    console.warn('[SyncService] Error reading from IndexedDB:', e);
  }

  // 2. Fetch from Firestore (Network)
  try {
    console.log('[SyncService] Loading Quran data from Firestore...');
    
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
      console.warn('[SyncService] Firestore is empty, falling back to API...');
      const res = await fetch(`${API_BASE}/api/quran-data`);
      if (res.ok) {
        const apiData = await res.json();
        cachedData = apiData;
      } else {
        cachedData = { series, lessons, excerpts, syllabuses };
      }
    } else {
      cachedData = { series, lessons, excerpts, syllabuses };
    }

    if (cachedData) {
      // Save to IndexedDB (Persistent local cache)
      await setIDB(CACHE_KEY, cachedData);
      await setIDB(TIMESTAMP_KEY, Date.now());
      console.log('[SyncService] Quran data synced and persisted to local storage.');
    }

    return cachedData;
  } catch (error) {
    console.error('[SyncService] Critical error loading Quran data from network:', error);
    
    // 3. OFFLINE FALLBACK: if network fails and we HAVE old cache, hydrate UI with it
    if (localCache) {
       console.log("[SyncService] Network failed. Falling back to persistent local cache (Offline Mode).");
       cachedData = localCache;
       return cachedData;
    }

    // Try API as last resort
    try {
      const res = await fetch(`${API_BASE}/api/quran-data`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("[SyncService] API fallback also failed.", e);
    }

    return { series: [], lessons: [], excerpts: [], syllabuses: [] };
  }
}

export const importedQuranData = { series: [], lessons: [], excerpts: [], syllabuses: [] };
