export async function loadQuranData() {
  try {
    const response = await fetch("/quranData.json");
    if (!response.ok) {
      throw new Error(`Failed to load quranData.json: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load Quran data dynamically:", error);
    // Fallback to empty object to prevent app crashes
    return {
      series: [],
      lessons: [],
      excerpts: [],
      syllabuses: []
    };
  }
}

export const importedQuranData = null;

