import fs from 'fs';
import path from 'path';
const cwd = process.cwd();
const metadataPath = fs.existsSync(path.join(cwd, 'dist/client/quran/metadata.json')) 
  ? path.join(cwd, 'dist/client/quran/metadata.json') 
  : path.join(cwd, 'public/quran/metadata.json');
const raw = fs.readFileSync(metadataPath, 'utf8');
const data = JSON.parse(raw);
console.log(data.lessons.slice(0, 1).map(l => l.title));
