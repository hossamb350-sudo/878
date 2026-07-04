import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('mlz.db');

// List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables in database:", tables.map(t => t.name));

for (const table of tables) {
  const name = table.name;
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
  console.log(`\nTable [${name}]: ${countRow.count} rows`);
  
  const columns = db.prepare(`PRAGMA table_info(${name})`).all();
  console.log("Columns:", columns.map(c => `${c.name} (${c.type})` + (c.pk ? ' [PK]' : '')));
  
  try {
    const firstRow = db.prepare(`SELECT * FROM ${name} LIMIT 1`).all();
    if (firstRow.length > 0) {
      const truncatedRow = {};
      for (const [key, val] of Object.entries(firstRow[0])) {
        if (typeof val === 'string' && val.length > 100) {
          truncatedRow[key] = val.substring(0, 100) + '...';
        } else {
          truncatedRow[key] = val;
        }
      }
      console.log("Sample Row:", truncatedRow);
    }
  } catch (e) {
    console.error("Error reading sample row:", e);
  }
}

