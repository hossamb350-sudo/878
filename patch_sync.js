const fs = require('fs');
let code = fs.readFileSync('src/services/SyncService.ts', 'utf-8');

code = code.replace(
    'import { collection, query, where, getDocs, orderBy, limit, addDoc } from "firebase/firestore";',
    'import { collection, query, where, getDocs, orderBy, limit, addDoc, onSnapshot } from "firebase/firestore";'
);

const target = `      // Trigger callback with fresh merged data
      if (active) onUpdate(mergedList);`;

const replacement = `      // Trigger callback with fresh merged data
      if (active) onUpdate([...mergedList]);

      // --- Realtime Listener for New Content ---
      let queryField = syncField === "order" ? "createdAt" : syncField;
      const realtimeQuery = query(
        collection(db, collectionName),
        where(queryField, ">", now)
      );

      unsubscribeRealtime = onSnapshot(realtimeQuery, (snapshot) => {
        if (!active) return;
        
        let hasNewData = false;
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const newItem = { id: change.doc.id, ...(change.doc.data() as any) } as unknown as T;
            const existingIndex = mergedList.findIndex(item => item.id === newItem.id);
            if (existingIndex > -1) {
              mergedList[existingIndex] = newItem;
            } else {
              mergedList.push(newItem);
            }
            hasNewData = true;
          } else if (change.type === "removed") {
             const existingIndex = mergedList.findIndex(item => item.id === change.doc.id);
             if (existingIndex > -1) {
                 mergedList.splice(existingIndex, 1);
                 hasNewData = true;
             }
          }
        });
        
        if (hasNewData) {
          mergedList = SyncService.sortItems(mergedList, options);
          SyncService.setCache(collectionName, mergedList).catch(console.warn);
          onUpdate([...mergedList]);
        }
      }, (error) => {
         console.warn(\`Realtime listener error for \${collectionName}:\`, error);
      });`;

code = code.replace(target, replacement);

const returnTarget = `    return () => {
      active = false;
    };`;
    
const returnReplacement = `    return () => {
      active = false;
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };`;
    
code = code.replace(returnTarget, returnReplacement);

const activeTarget = `    let active = true;`;
const activeReplacement = `    let active = true;
    let unsubscribeRealtime: (() => void) | null = null;`;
    
code = code.replace(activeTarget, activeReplacement);

fs.writeFileSync('src/services/SyncService.ts', code);
console.log("Patched successfully!");
