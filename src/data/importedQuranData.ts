// Dynamic data loading from public folder to avoid build-time JSON parsing errors
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    // Try multiple paths to ensure compatibility with both Web and Capacitor/APK
    const paths = ['./quranData.json', 'quranData.json', '/quranData.json'];
    let response = null;
    
    for (const path of paths) {
      try {
        console.log(`Attempting to fetch Quran data from: ${path}`);
        const res = await fetch(path);
        if (res.ok) {
          response = res;
          break;
        }
      } catch (e) {
        console.warn(`Failed to fetch from ${path}:`, e);
      }
    }

    if (!response) {
      throw new Error('Failed to fetch Quran data from all attempted paths');
    }

    cachedData = await response.json();
    console.log('Successfully loaded Quran data via fetch');
    return cachedData;
  } catch (error) {
    console.error('Error loading Quran data:', error);
    return { series: [], lessons: [] };
  }
}

// Keeping for backward compatibility
export const importedQuranData = { series: [], lessons: [] };
