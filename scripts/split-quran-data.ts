import fs from 'fs';
import path from 'path';

const INPUT_FILE = 'public/quranData.json';
const OUTPUT_DIR = 'public/quran';
const LESSONS_DIR = path.join(OUTPUT_DIR, 'lessons');

async function splitData() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(LESSONS_DIR)) fs.mkdirSync(LESSONS_DIR, { recursive: true });

  let baseMetadata: any = {
    title: "هدي القرآن الكريم",
    description: "دروس هدي القرآن الكريم كاملة ومقسّمة"
  };

  if (fs.existsSync(INPUT_FILE)) {
    console.log('Reading main data file...');
    try {
      const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
      const data = JSON.parse(rawData);
      const { lessons, ...metadata } = data;
      baseMetadata = metadata;

      console.log(`Writing ${lessons.length} individual lesson files from quranData.json...`);
      lessons.forEach((lesson: any) => {
        const filePath = path.join(LESSONS_DIR, `${lesson.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2));
      });
    } catch (e) {
      console.error('Error parsing quranData.json:', e);
    }
  }

  // Dynamically rebuild metadata.json using ALL lesson files present in LESSONS_DIR
  console.log('Rebuilding metadata.json from all lesson files in directory...');
  const lessonFiles = fs.readdirSync(LESSONS_DIR).filter(file => file.endsWith('.json'));
  console.log(`Found ${lessonFiles.length} lesson files.`);

  const lessonsMetadata = lessonFiles.map(file => {
    try {
      const lessonData = JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), 'utf8'));
      const { content, ...rest } = lessonData;
      return rest;
    } catch (e: any) {
      console.error(`Error reading/parsing lesson file ${file}:`, e.message);
      return null;
    }
  }).filter(Boolean);

  const finalMetadata = {
    ...baseMetadata,
    lessons: lessonsMetadata
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'metadata.json'), JSON.stringify(finalMetadata, null, 2));
  console.log('Successfully split Quran data and rebuilt metadata index!');
}

splitData().catch(console.error);
