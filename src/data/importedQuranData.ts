// Dynamic data loading for large Quran JSON to avoid build-time issues
let cachedData: any = null;

export async function loadQuranData() {
  if (cachedData) return cachedData;
  
  try {
    const response = await fetch('./quranData.json');
    if (!response.ok) throw new Error('Failed to fetch Quran data');
    cachedData = await response.json();
    return cachedData;
  } catch (error) {
    console.error('Error loading Quran data:', error);
    return { series: [], lessons: [] };
  }
}

// Keeping this for backward compatibility, but it will be empty initially
export const importedQuranData = { series: [], lessons: [] };
