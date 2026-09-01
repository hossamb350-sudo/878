import fs from 'fs';
import path from 'path';

const quranDataPath = path.resolve('./src/data/hadi_quran.json');
const quranData = JSON.parse(fs.readFileSync(quranDataPath, 'utf8'));
const lesson = quranData.lessons.find(l => l.id === "CAkDxE4FR9Nouw7thCFv");
const series = quranData.series.find(s => s.id === lesson.seriesId);
console.log(lesson.title, series.title);
