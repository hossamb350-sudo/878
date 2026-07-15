import fs from 'fs';
import path from 'path';

const INPUT_FILE = 'public/quranData.json';
const OUTPUT_DIR = 'public/quran';
const LESSONS_DIR = path.join(OUTPUT_DIR, 'lessons');

async function splitData() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(LESSONS_DIR)) fs.mkdirSync(LESSONS_DIR, { recursive: true });

  console.log('Reading main data file...');
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(rawData);

  const { lessons, ...metadata } = data;

  // 1. Create Metadata (Lessons without content)
  console.log('Creating metadata...');
  const lessonsMetadata = lessons.map(({ content, ...rest }) => rest);
  const finalMetadata = {
    ...metadata,
    lessons: lessonsMetadata
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'metadata.json'), JSON.stringify(finalMetadata, null, 2));

  // 2. Create individual lesson files
  console.log(`Creating ${lessons.length} individual lesson files...`);
  lessons.forEach((lesson) => {
    const filePath = path.join(LESSONS_DIR, `${lesson.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2));
  });

  console.log('Successfully split Quran data!');
}

splitData().catch(console.error);
