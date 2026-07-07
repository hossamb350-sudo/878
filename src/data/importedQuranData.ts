// Dynamic data loading from public folder
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    // In Capacitor, fetching from the root or relative path is standard
    // We try 'quranData.json' which refers to the file in the public folder
    console.log('Loading Quran data from local assets...');
    
    // Using a more robust fetch for mobile
    const response = await fetch('./quranData.json', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Fallback for some Capacitor versions
      const fallbackResponse = await fetch('quranData.json');
      if (!fallbackResponse.ok) throw new Error('Could not find quranData.json in assets');
      cachedData = await fallbackResponse.json();
    } else {
      cachedData = await response.json();
    }

    console.log('Quran data loaded successfully');
    return cachedData;
  } catch (error) {
    console.error('Critical error loading Quran data:', error);
    // Return empty but valid structure to prevent app crash
    return { series: [], lessons: [] };
  }
}

export const importedQuranData = { series: [], lessons: [] };
