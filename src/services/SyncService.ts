import { collection, query, where, getDocs, orderBy, limit, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface SyncOptions {
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  customMerge?: (cached: any[], fetched: any[]) => any[];
}

export const SyncService = {
  // Save/Get helper
  getCache<T>(collectionName: string): T[] {
    try {
      const data = localStorage.getItem(`cache_${collectionName}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading cache for ${collectionName}:`, e);
      return [];
    }
  },

  setCache<T>(collectionName: string, data: T[]): void {
    try {
      localStorage.setItem(`cache_${collectionName}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error writing cache for ${collectionName}:`, e);
    }
  },

  getSyncTime(collectionName: string): number {
    return Number(localStorage.getItem(`sync_time_${collectionName}`) || "0");
  },

  setSyncTime(collectionName: string, time: number): void {
    localStorage.setItem(`sync_time_${collectionName}`, String(time));
  },

  // Log a deletion from Admin
  async trackDeletion(collectionName: string, docId: string): Promise<void> {
    try {
      await addDoc(collection(db, "deletions"), {
        collection: collectionName,
        docId: docId,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("Error tracking deletion:", e);
    }
  },

  // Perform full sync
  async syncCollection<T extends { id: string; createdAt?: number; timestamp?: number }>(
    collectionName: string,
    onUpdate: (items: T[]) => void,
    options?: SyncOptions
  ): Promise<() => void> {
    let active = true;

    // 1. Return cached items immediately
    let cachedList = this.getCache<T>(collectionName);
    
    // Sort cached list
    cachedList = this.sortItems(cachedList, options);
    onUpdate(cachedList);

    // 2. Perform background sync
    const lastSyncTime = this.getSyncTime(collectionName);
    const now = Date.now();

    try {
      let q;
      if (lastSyncTime === 0) {
        // Initial fetch: get with a limit if specified, to avoid downloading massive history
        q = query(
          collection(db, collectionName),
          orderBy(options?.orderByField || "createdAt", options?.orderDirection || "desc"),
          limit(options?.limit || 100)
        );
      } else {
        // Incremental fetch: only get items newer than lastSyncTime
        // We query by createdAt. For older records without it, they are already cached.
        q = query(
          collection(db, collectionName),
          where("createdAt", ">", lastSyncTime)
        );
      }

      const [snap, delSnap] = await Promise.all([
        getDocs(q),
        lastSyncTime > 0
          ? getDocs(
              query(
                collection(db, "deletions"),
                where("collection", "==", collectionName),
                where("timestamp", ">", lastSyncTime)
              )
            )
          : null,
      ]);

      if (!active) return () => {};

      // Parse fetched documents
      const fetchedItems = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as unknown as T)
      );

      // Parse deleted IDs
      const deletedIds = new Set<string>();
      if (delSnap) {
        delSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.docId) {
            deletedIds.add(data.docId);
          }
        });
      }

      // Merge cached with fetched
      let mergedMap = new Map<string, T>();
      cachedList.forEach((item) => {
        if (!deletedIds.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      });

      fetchedItems.forEach((item) => {
        if (!deletedIds.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      });

      let mergedList = Array.from(mergedMap.values());

      // Handle custom merge if specified
      if (options?.customMerge) {
        mergedList = options.customMerge(cachedList, fetchedItems);
      }

      // Sort
      mergedList = this.sortItems(mergedList, options);

      // Save to cache
      this.setCache(collectionName, mergedList);
      this.setSyncTime(collectionName, now);

      // Trigger callback with fresh merged data
      onUpdate(mergedList);
    } catch (e) {
      console.error(`Failed to sync collection ${collectionName}:`, e);
    }

    return () => {
      active = false;
    };
  },

  sortItems<T extends { id: string; createdAt?: number; timestamp?: number; order?: number }>(
    items: T[],
    options?: SyncOptions
  ): T[] {
    const field = options?.orderByField || "createdAt";
    const dir = options?.orderDirection || "desc";

    return [...items].sort((a, b) => {
      // 1. If we have custom "order" field (like quran series/lessons/syllabuses)
      if (field === "order") {
        const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
        const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
        if (aOrder !== bOrder) {
          return dir === "asc" ? aOrder - bOrder : bOrder - aOrder;
        }
      }

      // 2. Sort by time/timestamp/createdAt
      const valA = Number(a[field as keyof T] || a.createdAt || a.timestamp || 0);
      const valB = Number(b[field as keyof T] || b.createdAt || b.timestamp || 0);
      return dir === "asc" ? valA - valB : valB - valA;
    });
  }
};
