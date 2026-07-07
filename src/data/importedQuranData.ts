import quranData from './quranData.json';

// Direct data loading to ensure it's bundled and available in APK
export async function loadQuranData() {
  return quranData;
}

export const importedQuranData = quranData;
