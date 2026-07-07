// Dynamic data loading from public folder
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    console.log('Loading Quran data from local assets...');
    
    // Construct path relative to the current site root
    const baseUrl = window.location.origin;
    const jsonPath = `${baseUrl}/quranData.json`;
    
    console.log('Attempting to fetch from:', jsonPath);
    let response = await fetch(jsonPath);

    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      console.warn('Absolute path fetch failed, trying relative path ./quranData.json');
      response = await fetch('./quranData.json');
    }
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      console.warn('Relative path fetch failed, trying direct filename quranData.json');
      response = await fetch('quranData.json');
    }

    if (!response.ok) throw new Error('Could not find quranData.json in any location');
    
    cachedData = await response.json();
    console.log('Quran data loaded successfully');
    return cachedData;
  } catch (error) {
    console.error('Critical error loading Quran data:', error);
    return { series: [], lessons: [] };
  }
}

export const importedQuranData = { series: [], lessons: [] };
