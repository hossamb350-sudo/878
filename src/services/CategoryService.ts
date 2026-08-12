import { db } from "../firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
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

const DEFAULT_CATEGORIES: { name: string; color: string; description?: string }[] = [
  { name: "محلية", color: "#06B6D4", description: "الأخبار المحلية والشؤون الداخلية" },
  { name: "تعبئة عامة", color: "#EF4444", description: "فعاليات وأخبار التعبئة العامة" },
  { name: "اجتماعية", color: "#10B981", description: "المشاريع والمبادرات الاجتماعية" },
  { name: "أنشطة وزيارات", color: "#8B5CF6", description: "الأنشطة والزيارات الميدانية الرسمية" },
  { name: "مشاريع", color: "#F59E0B", description: "المشاريع التنموية والخدمية" },
  { name: "مقال", color: "#6366F1", description: "المقالات والرؤى التحليلية" },
  { name: "تقارير ميدانية", color: "#3B82F6", description: "التقارير المصورة والميدانية" },
  { name: "زوامل وأناشيد", color: "#EC4899", description: "القصائد والزوامل والأناشيد" },
  { name: "محاضرات ودروس", color: "#14B8A6", description: "المحاضرات التوعوية والدروس" },
  { name: "أفلام وثائقية", color: "#F97316", description: "الوثائقيات والمواد المرئية" },
];

export const CategoryService = {
  subscribeCategories: (callback: (cats: Category[]) => void) => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({
          id: d.id,
          name: d.data().name || "",
          color: d.data().color || "#3B82F6",
          description: d.data().description || "",
          order: typeof d.data().order === "number" ? d.data().order : 99,
          createdAt: d.data().createdAt || Date.now(),
          updatedAt: d.data().updatedAt,
        } as Category));

        // Sort by order then by name
        list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, "ar"));
        callback(list);

        // Background sync to newsMetadata for legacy components
        CategoryService.syncNewsMetadata(list.map(c => ({ name: c.name, color: c.color })));
      } else {
        // Return empty array if no categories exist
        callback([]);
        CategoryService.syncNewsMetadata([]);
      }
    }, (err) => {
      console.warn("[CategoryService] Error listening to categories collection:", err);
    });
  },

  seedDefaultCategories: async () => {
    try {
      const snap = await getDocs(collection(db, "categories"));
      if (snap.empty) {
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
      }
    } catch (e) {
      console.warn("[CategoryService] Error seeding default categories:", e);
    }
  },

  syncNewsMetadata: async (items: { name: string; color: string }[]) => {
    try {
      await setDoc(doc(db, "newsMetadata", "categories"), { items });
    } catch (e) {
      console.warn("[CategoryService] Error syncing newsMetadata:", e);
    }
  },

  saveCategory: async (categoryData: Partial<Category> & { name: string }) => {
    const name = categoryData.name.trim();
    if (!name) throw new Error("اسم التصنيف مطلوب");

    const docId = categoryData.id || doc(collection(db, "categories")).id;
    const catRef = doc(db, "categories", docId);

    const payload = {
      name,
      color: categoryData.color || "#3B82F6",
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

    // 3. Unlink category from all content collections (news, videos, articles, featured_topics, events)
    const collectionsToClean = ["news", "videos", "articles", "featured_topics", "events"];
    let unlinkedContentItems = 0;

    for (const colName of collectionsToClean) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const docsToUpdate = snap.docs.filter(d => d.data().category || d.data().type || d.data().cat);
          if (docsToUpdate.length > 0) {
            for (let i = 0; i < docsToUpdate.length; i += 400) {
              const batch = writeBatch(db);
              const chunk = docsToUpdate.slice(i, i + 400);
              chunk.forEach(d => {
                batch.update(d.ref, { category: "", cat: "", type: "" });
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
