import fs from 'fs';
import path from 'path';

const QURAN_DIR = 'public/quran';
const LESSONS_DIR = path.join(QURAN_DIR, 'lessons');
const METADATA_FILE = path.join(QURAN_DIR, 'metadata.json');

async function rebuildMetadata() {
  console.log('Reading existing metadata...');
  const existingMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));

  console.log('Reading all lesson files...');
  const lessonFiles = fs.readdirSync(LESSONS_DIR).filter(file => file.endsWith('.json'));

  const lessonsMetadata = lessonFiles.map(file => {
    const lessonData = JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), 'utf8'));
    const { content, ...metadata } = lessonData;
    return metadata;
  });

  const newMetadata = {
    ...existingMetadata,
    lessons: lessonsMetadata
  };

  console.log(`Rebuilding metadata with ${lessonsMetadata.length} lessons...`);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(newMetadata, null, 2));

  console.log('Successfully rebuilt metadata.json!');
}

rebuildMetadata().catch(console.error);
