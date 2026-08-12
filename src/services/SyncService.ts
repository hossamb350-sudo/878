import { collection, query, where, getDocs, orderBy, limit, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { get, set } from "idb-keyval";

export interface SyncOptions {
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  customMerge?: (cached: any[], fetched: any[]) => any[];
}

export interface FirestoreErrorInfo {
  error_code: string;
  error_message: string;
  collection_path: string;
  document_id?: string;
  operation_type: 'read' | 'write' | 'delete' | 'query';
  is_permission_error: boolean;
}

export const handleFirestoreError = (
  error: any,
  collectionPath: string,
  operation: 'read' | 'write' | 'delete' | 'query',
  documentId?: string
) => {
  const errorInfo: FirestoreErrorInfo = {
    error_code: error.code || 'unknown',
    error_message: error.message || 'An unexpected error occurred',
    collection_path: collectionPath,
    document_id: documentId,
    operation_type: operation,
    is_permission_error: error.code === 'permission-denied',
  };
  throw new Error(JSON.stringify(errorInfo));
};

export class SyncService {
  // Save/Get helper
  static async getCache<T>(collectionName: string): Promise<T[]> {
    try {
      const data = await get(`cache_${collectionName}`);
      return data || [];
    } catch (e) {
      console.error(`Error reading cache for ${collectionName}:`, e);
      return [];
    }
  }

  static async setCache<T>(collectionName: string, data: T[]): Promise<void> {
    try {
      await set(`cache_${collectionName}`, data);
    } catch (e) {
      console.error(`Error writing cache for ${collectionName}:`, e);
    }
  }

  static async getSyncTime(collectionName: string): Promise<number> {
    const time = await get(`sync_time_${collectionName}`);
    return Number(time || "0");
  }

  static async setSyncTime(collectionName: string, time: number): Promise<void> {
    await set(`sync_time_${collectionName}`, time);
  }

  // Log a deletion from Admin
  static async trackDeletion(collectionName: string, docId: string): Promise<void> {
    try {
      await addDoc(collection(db, "deletions"), {
        collection: collectionName,
        docId: docId,
        timestamp: Date.now(),
      });
    } catch (e) {
      handleFirestoreError(e, "deletions", "write");
    }
  }

  static async refreshCollection<T extends { id: string; createdAt?: number; timestamp?: number }>(
    collectionName: string,
    options?: SyncOptions
  ): Promise<T[]> {
    try {
      let q = query(
        collection(db, collectionName),
        orderBy(options?.orderByField || "createdAt", options?.orderDirection || "desc"),
        limit(options?.limit || 30) // limit enough for pull-to-refresh
      );
      const snap = await getDocs(q);
      const fetchedItems = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as unknown as T)
      );
      
      const sorted = SyncService.sortItems(fetchedItems, options);
      
      await SyncService.setCache(collectionName, sorted);
      await SyncService.setSyncTime(collectionName, Date.now());
      
      return sorted;
    } catch (e: any) {
      const isQuotaExceeded = e.code === 'resource-exhausted' || 
                             (e.message && (e.message.includes('Quota') || e.message.includes('quota')));
      if (isQuotaExceeded) {
        console.warn(`Firestore quota exceeded for collection "${collectionName}" during refresh. Falling back to cache.`);
        const cached = await SyncService.getCache<T>(collectionName);
        return SyncService.sortItems(cached, options);
      }
      handleFirestoreError(e, collectionName, "query");
      return []; // never reached but satisfies TS
    }
  }

  // Perform full sync
  static async syncCollection<T extends { id: string; createdAt?: number; timestamp?: number }>(
    collectionName: string,
    onUpdate: (items: T[]) => void,
    options?: SyncOptions
  ): Promise<() => void> {
    let active = true;

    // 1. Return cached items immediately
    let cachedList = await SyncService.getCache<T>(collectionName);
    
    // Sort cached list
    cachedList = SyncService.sortItems(cachedList, options);
    if (active) onUpdate(cachedList);

    // 2. Perform background sync
    const lastSyncTime = await SyncService.getSyncTime(collectionName);
    const now = Date.now();

    try {
      let q;
      const syncField = options?.orderByField || "createdAt";
      
      if (lastSyncTime === 0) {
        // Initial fetch: get with a limit if specified, to avoid downloading massive history
        q = query(
          collection(db, collectionName),
          orderBy(syncField, options?.orderDirection || "desc"),
          limit(options?.limit || 20)
        );
      } else {
        // Incremental fetch: only get items newer than lastSyncTime
        // Ensure we use the correct field for the time query
        let queryField = syncField === "order" ? "createdAt" : syncField;
        q = query(
          collection(db, collectionName),
          where(queryField, ">", lastSyncTime)
        );
      }

      const [snap, delSnap] = await Promise.all([
        getDocs(q),
        lastSyncTime > 0
          ? getDocs(
              query(
                collection(db, "deletions"),
                where("timestamp", ">", lastSyncTime)
              )
            )
          : null,
      ]);

      if (!active) return () => {};

      // Parse fetched documents
      const fetchedItems = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as unknown as T)
      );

      // Parse deleted IDs
      const deletedIds = new Set<string>();
      if (delSnap) {
        delSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.docId && data.collection === collectionName) {
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
      mergedList = SyncService.sortItems(mergedList, options);

      // Save to cache
      await SyncService.setCache(collectionName, mergedList);
      await SyncService.setSyncTime(collectionName, now);

      // Trigger callback with fresh merged data
      if (active) onUpdate(mergedList);
    } catch (e: any) {
      const isQuotaExceeded = e.code === 'resource-exhausted' || 
                             (e.message && (e.message.includes('Quota') || e.message.includes('quota')));
      if (isQuotaExceeded) {
        console.warn(`Firestore quota exceeded for collection "${collectionName}". Relying on cached data.`);
      } else {
        handleFirestoreError(e, collectionName, "query");
      }
    }

    return () => {
      active = false;
    };
  }

  static sortItems<T extends { id: string; createdAt?: number; timestamp?: number; order?: number }>(
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
}
