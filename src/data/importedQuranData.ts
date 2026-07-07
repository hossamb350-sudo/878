// Dynamic data loading for large Quran JSON to avoid build-time issues
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    // In Capacitor/Mobile, the base URL can vary, but quranData.json is in the root of the web assets
    // Using a relative path 'quranData.json' is generally safest
    console.log('Fetching Quran data...');
    const response = await fetch('./quranData.json');
    
    if (!response.ok) {
      // Fallback for some environments where ./ might not resolve as expected
      const fallbackResponse = await fetch('quranData.json');
      if (!fallbackResponse.ok) throw new Error('Failed to fetch Quran data');
      cachedData = await fallbackResponse.json();
    } else {
      cachedData = await response.json();
    }
    
    console.log('Successfully loaded Quran data');
    return cachedData;
  } catch (error) {
    console.error('Error loading Quran data:', error);
    return { series: [], lessons: [] };
  }
}

// Keeping this for backward compatibility, but it will be empty initially
export const importedQuranData = { series: [], lessons: [] };
