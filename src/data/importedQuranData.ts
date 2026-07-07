// Dynamic data loading for large Quran JSON to avoid build-time issues
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/';
    const path = baseUrl.endsWith('/') ? baseUrl + 'quranData.json' : baseUrl + '/quranData.json';
    
    console.log('Fetching Quran data from:', path);
    const response = await fetch(path);
    if (!response.ok) {
      console.warn('Primary fetch failed, trying fallback root path');
      const fallbackResponse = await fetch('quranData.json');
      if (!fallbackResponse.ok) throw new Error('Failed to fetch Quran data from all paths');
      cachedData = await fallbackResponse.json();
    } else {
      cachedData = await response.json();
    }
    console.log('Successfully loaded Quran data:', Object.keys(cachedData));
    return cachedData;
  } catch (error) {
    console.error('Error loading Quran data:', error);
    return { series: [], lessons: [] };
  }
}

// Keeping this for backward compatibility, but it will be empty initially
export const importedQuranData = { series: [], lessons: [] };
