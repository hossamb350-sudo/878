// Dynamic data loading from public folder
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    console.log('Loading Quran data from API...');
    
    // Use the API endpoint which is the authoritative source
    let response = await fetch('/api/quran-data');

    if (!response.ok) {
      console.warn('API fetch failed, trying static path /quranData.json');
      const baseUrl = window.location.origin;
      response = await fetch(`${baseUrl}/quranData.json`);
    }

    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      console.warn('Fallback fetch failed, trying relative path ./quranData.json');
      response = await fetch('./quranData.json');
    }

    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Could not find valid quranData.json in any location');
    }
    
    cachedData = await response.json();
    console.log('Quran data loaded successfully');
    return cachedData;
  } catch (error) {
    console.error('Critical error loading Quran data:', error);
    // Return a valid empty structure to prevent crashes
    return { series: [], lessons: [], excerpts: [], syllabuses: [] };
  }
}

export const importedQuranData = { series: [], lessons: [], excerpts: [], syllabuses: [] };
