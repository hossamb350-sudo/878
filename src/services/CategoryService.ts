import { db } from "../firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";
import { Category } from "../types";

export const PRESET_CATEGORY_COLORS = [
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet/Purple
  "#EC4899", // Pink
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#64748B", // Slate
];

export const DEFAULT_CATEGORIES: { name: string; color: string; description?: string }[] = [];

// In-memory reactive category cache for synchronous access
let cachedCategories: Category[] = [];
let categoryCacheMap: Map<string, Category> = new Map();

export const CategoryService = {
  getFallbackColor: (name: string): string => {
    if (!name) return "#34619B";
    const norm = name.trim().toLowerCase();
    const match = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === norm);
    if (match) return match.color;

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % PRESET_CATEGORY_COLORS.length;
    return PRESET_CATEGORY_COLORS[colorIndex];
  },

  getCachedCategories: (): Category[] => {
    return cachedCategories;
  },

  getCategoryColor: (name: string): string => {
    if (!name) return "#64748B";
    const norm = name.trim().toLowerCase();
    const found = categoryCacheMap.get(norm);
    if (found?.color) return found.color;
    return CategoryService.getFallbackColor(name);
  },

  subscribeCategories: (callback: (cats: Category[]) => void) => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({
          id: d.id,
          name: (d.data().name || "").trim(),
          color: d.data().color || "#3B82F6",
          description: d.data().description || "",
          order: typeof d.data().order === "number" ? d.data().order : 99,
          createdAt: d.data().createdAt || Date.now(),
          updatedAt: d.data().updatedAt,
        } as Category));

        // Sort by order then by name
        list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, "ar"));
        
        cachedCategories = list;
        categoryCacheMap = new Map(list.map(c => [c.name.toLowerCase(), c]));

        callback(list);

        // Background sync to newsMetadata for legacy components
        CategoryService.syncNewsMetadata(list.map(c => ({ name: c.name, color: c.color })));
      } else {
        cachedCategories = [];
        categoryCacheMap = new Map();
        callback([]);
        CategoryService.syncNewsMetadata([]);
      }
    }, (err) => {
      console.warn("[CategoryService] Error listening to categories collection:", err);
    });
  },

  syncNewsMetadata: async (items: { name: string; color: string }[]) => {
    try {
      await setDoc(doc(db, "newsMetadata", "categories"), { items }, { merge: true });
    } catch (e) {
      console.warn("[CategoryService] Error syncing newsMetadata:", e);
    }
  },

  saveCategory: async (categoryData: Partial<Category> & { name: string; color?: string }) => {
    const name = categoryData.name.trim();
    if (!name) throw new Error("اسم التصنيف مطلوب");

    const docId = categoryData.id || doc(collection(db, "categories")).id;
    const catRef = doc(db, "categories", docId);

    const payload = {
      name,
      color: categoryData.color || CategoryService.getFallbackColor(name),
      description: categoryData.description || "",
      order: typeof categoryData.order === "number" ? categoryData.order : Date.now(),
      updatedAt: Date.now(),
      ...(categoryData.id ? {} : { createdAt: Date.now() })
    };

    await setDoc(catRef, payload, { merge: true });

    // Sync metadata
    const snap = await getDocs(collection(db, "categories"));
    const list = snap.docs.map(d => ({ name: d.data().name, color: d.data().color }));
    await CategoryService.syncNewsMetadata(list);

    return docId;
  },

  /**
   * Ensures that every category in the provided list exists in the Firestore 'categories' database collection.
   * If a category does not exist yet, it is immediately persisted with its designated name and color.
   */
  ensureCategoriesExist: async (
    items: Array<string | { name: string; color?: string }>
  ): Promise<Record<string, { id: string; name: string; color: string }>> => {
    if (!items || items.length === 0) return {};

    const resultMap: Record<string, { id: string; name: string; color: string }> = {};
    const missingItems: Array<{ name: string; color?: string }> = [];

    // 1. Fetch current categories from Firestore
    const snap = await getDocs(collection(db, "categories"));
    const dbCatsMap = new Map<string, { id: string; name: string; color: string }>();

    snap.docs.forEach(d => {
      const data = d.data();
      const rawName = (data.name || "").trim();
      if (rawName) {
        dbCatsMap.set(rawName.toLowerCase(), {
          id: d.id,
          name: rawName,
          color: data.color || "#3B82F6"
        });
      }
    });

    // 2. Identify missing categories
    items.forEach(item => {
      const rawName = typeof item === "string" ? item.trim() : item.name?.trim();
      const customColor = typeof item === "object" ? item.color : undefined;
      if (!rawName) return;

      const norm = rawName.toLowerCase();
      const existing = dbCatsMap.get(norm);

      if (existing) {
        resultMap[rawName] = existing;
      } else {
        missingItems.push({ name: rawName, color: customColor });
      }
    });

    // 3. Batch-insert any new categories into Firestore
    if (missingItems.length > 0) {
      const batch = writeBatch(db);
      missingItems.forEach((m, idx) => {
        const norm = m.name.toLowerCase();
        if (dbCatsMap.has(norm)) return; // Avoid duplicate within same batch

        const newRef = doc(collection(db, "categories"));
        const color = m.color || CategoryService.getFallbackColor(m.name);
        const newCat = {
          name: m.name,
          color,
          description: "",
          order: dbCatsMap.size + idx,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        batch.set(newRef, newCat);
        const entry = { id: newRef.id, name: m.name, color };
        dbCatsMap.set(norm, entry);
        resultMap[m.name] = entry;
      });

      await batch.commit();

      // Refresh legacy sync
      const updatedList = Array.from(dbCatsMap.values()).map(c => ({ name: c.name, color: c.color }));
      await CategoryService.syncNewsMetadata(updatedList);
    }

    return resultMap;
  },

  /**
   * Prepares and links content category data for database persistence.
   * Ensures categories exist in Firestore 'categories' and returns complete relational fields:
   * - category (primary)
   * - categories (string array)
   * - categoryColor (primary color)
   * - categoryColors (map of name -> hex color)
   * - categoryIds (array of Firestore category document IDs)
   */
  linkContentCategories: async (
    rawCategories: string[] | string,
    colorOverrides?: Record<string, string>
  ): Promise<{
    category: string;
    categories: string[];
    categoryColor: string;
    categoryColors: Record<string, string>;
    categoryIds: string[];
  }> => {
    let catList: string[] = [];
    if (Array.isArray(rawCategories)) {
      catList = rawCategories.map(c => (c || "").trim()).filter(Boolean);
    } else if (typeof rawCategories === "string" && rawCategories.trim()) {
      catList = rawCategories.split(/[,،/]/).map(c => c.trim()).filter(Boolean);
    }

    // Deduplicate
    const uniqueCats = Array.from(new Set(catList));
    if (uniqueCats.length === 0) {
      return {
        category: "",
        categories: [],
        categoryColor: "#3B82F6",
        categoryColors: {},
        categoryIds: []
      };
    }

    const itemsToEnsure = uniqueCats.map(name => ({
      name,
      color: colorOverrides?.[name]
    }));

    const verifiedMap = await CategoryService.ensureCategoriesExist(itemsToEnsure);

    const primaryName = uniqueCats[0] || "";
    const primaryColor = verifiedMap[primaryName]?.color || colorOverrides?.[primaryName] || CategoryService.getFallbackColor(primaryName);

    const categoryColors: Record<string, string> = {};
    const categoryIds: string[] = [];

    uniqueCats.forEach(name => {
      const entry = verifiedMap[name];
      const color = entry?.color || colorOverrides?.[name] || CategoryService.getFallbackColor(name);
      categoryColors[name] = color;
      if (entry?.id) {
        categoryIds.push(entry.id);
      }
    });

    return {
      category: primaryName,
      categories: uniqueCats,
      categoryColor: primaryColor,
      categoryColors,
      categoryIds
    };
  },

  /**
   * Updates a category in the database and cascades name/color changes to all referenced content items in Firestore.
   */
  updateCategoryAndCascade: async (
    catId: string,
    updatedData: { name: string; color: string; description?: string; order?: number }
  ) => {
    const catRef = doc(db, "categories", catId);
    const prevSnap = await getDoc(catRef);
    if (!prevSnap.exists()) {
      throw new Error("التصنيف غير موجود");
    }

    const oldName = (prevSnap.data().name || "").trim();
    const newName = updatedData.name.trim();
    const newColor = updatedData.color;

    // 1. Update Category Document
    await setDoc(catRef, {
      name: newName,
      color: newColor,
      description: updatedData.description || "",
      order: typeof updatedData.order === "number" ? updatedData.order : (prevSnap.data().order ?? 0),
      updatedAt: Date.now()
    }, { merge: true });

    // 2. Cascade update to content collections if name or color changed
    const contentCollections = ["news", "videos", "articles", "featured_topics", "leader"];

    for (const colName of contentCollections) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (snap.empty) continue;

        const docsToUpdate: Array<{ ref: any; payload: any }> = [];

        snap.docs.forEach(d => {
          const data = d.data();
          let needsUpdate = false;
          const payload: any = {};

          // Check primary category
          if (data.category && data.category.trim().toLowerCase() === oldName.toLowerCase()) {
            payload.category = newName;
            payload.categoryColor = newColor;
            needsUpdate = true;
          }

          // Check categories array
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            const hasMatch = data.categories.some((c: string) => c.trim().toLowerCase() === oldName.toLowerCase());
            if (hasMatch) {
              payload.categories = data.categories.map((c: string) => 
                c.trim().toLowerCase() === oldName.toLowerCase() ? newName : c
              );
              needsUpdate = true;
            }
          }

          // Check categoryColors mapping
          if (data.categoryColors && typeof data.categoryColors === "object") {
            const colorsMap = { ...data.categoryColors };
            if (colorsMap[oldName] !== undefined || colorsMap[newName] !== undefined) {
              delete colorsMap[oldName];
              colorsMap[newName] = newColor;
              payload.categoryColors = colorsMap;
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            docsToUpdate.push({ ref: d.ref, payload });
          }
        });

        // Batch update
        if (docsToUpdate.length > 0) {
          for (let i = 0; i < docsToUpdate.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = docsToUpdate.slice(i, i + 400);
            chunk.forEach(item => {
              batch.update(item.ref, item.payload);
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`[CategoryService] Error cascading category update to ${colName}:`, err);
      }
    }

    // 3. Sync newsMetadata
    const snap = await getDocs(collection(db, "categories"));
    const list = snap.docs.map(d => ({ name: d.data().name, color: d.data().color }));
    await CategoryService.syncNewsMetadata(list);
  },

  deleteCategory: async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
    
    // Sync metadata
    const snap = await getDocs(collection(db, "categories"));
    const list = snap.docs.map(d => ({ name: d.data().name, color: d.data().color }));
    await CategoryService.syncNewsMetadata(list);
  },

  deleteAllCategories: async () => {
    const snap = await getDocs(collection(db, "categories"));
    if (snap.empty) {
      await CategoryService.syncNewsMetadata([]);
      return 0;
    }

    const docs = snap.docs;
    let deletedCount = 0;
    
    // Delete in batches of 400
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 400);
      chunk.forEach(d => {
        batch.delete(d.ref);
        deletedCount++;
      });
      await batch.commit();
    }

    await CategoryService.syncNewsMetadata([]);
    return deletedCount;
  },

  deduplicateCategories: async () => {
    const snap = await getDocs(collection(db, "categories"));
    if (snap.empty) return { totalRemoved: 0, uniqueCount: 0 };

    const seenNames = new Map<string, string>(); // normalizedName -> docId to keep
    const toDeleteIds: string[] = [];

    snap.docs.forEach(d => {
      const rawName = (d.data().name || "").trim();
      const normName = rawName.toLowerCase();
      if (!normName) {
        toDeleteIds.push(d.id); // delete empty name categories
        return;
      }

      if (seenNames.has(normName)) {
        toDeleteIds.push(d.id); // duplicate found!
      } else {
        seenNames.set(normName, d.id);
      }
    });

    if (toDeleteIds.length > 0) {
      for (let i = 0; i < toDeleteIds.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = toDeleteIds.slice(i, i + 400);
        chunk.forEach(id => {
          batch.delete(doc(db, "categories", id));
        });
        await batch.commit();
      }
    }

    // Refresh remaining list and sync newsMetadata
    const freshSnap = await getDocs(collection(db, "categories"));
    const list = freshSnap.docs.map(d => ({ name: d.data().name, color: d.data().color }));
    await CategoryService.syncNewsMetadata(list);

    return { totalRemoved: toDeleteIds.length, uniqueCount: seenNames.size };
  },

  resetToDefaultCategories: async () => {
    await CategoryService.deleteAllCategories();
    
    const batch = writeBatch(db);
    DEFAULT_CATEGORIES.forEach((c, idx) => {
      const newRef = doc(collection(db, "categories"));
      batch.set(newRef, {
        name: c.name,
        color: c.color,
        description: c.description || "",
        order: idx,
        createdAt: Date.now()
      });
    });
    await batch.commit();
    await CategoryService.syncNewsMetadata(DEFAULT_CATEGORIES.map(c => ({ name: c.name, color: c.color })));
    return DEFAULT_CATEGORIES.length;
  },

  purgeAllOldCategoriesAndUnlinkContent: async () => {
    // 1. Delete all categories from categories collection
    const deletedCategories = await CategoryService.deleteAllCategories();

    // 2. Clear newsMetadata categories
    await CategoryService.syncNewsMetadata([]);

    // 3. Unlink category from all content collections (news, videos, articles, featured_topics, events, leader)
    const collectionsToClean = ["news", "videos", "articles", "featured_topics", "events", "leader"];
    let unlinkedContentItems = 0;

    for (const colName of collectionsToClean) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const docsToUpdate = snap.docs.filter(d => d.data().category || (d.data().categories && d.data().categories.length > 0));
          if (docsToUpdate.length > 0) {
            for (let i = 0; i < docsToUpdate.length; i += 400) {
              const batch = writeBatch(db);
              const chunk = docsToUpdate.slice(i, i + 400);
              chunk.forEach(d => {
                batch.update(d.ref, { category: "", categories: [], categoryColor: "", categoryColors: {}, categoryIds: [] });
                unlinkedContentItems++;
              });
              await batch.commit();
            }
          }
        }
      } catch (err) {
        console.warn(`[CategoryService] Error unlinking categories in collection ${colName}:`, err);
      }
    }

    // Clear local storage category caches
    try {
      localStorage.removeItem("admin_saved_cats");
      localStorage.removeItem("news_categories");
    } catch {}

    return { deletedCategories, unlinkedContentItems };
  }
};
