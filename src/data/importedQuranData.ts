export async function loadQuranMetadata() {
  try {
    const response = await fetch("/quran/metadata.json");
    if (!response.ok) {
      throw new Error(`Failed to load metadata.json: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load Quran metadata:", error);
    return {
      series: [],
      lessons: [],
      excerpts: [],
      syllabuses: []
    };
  }
}

export async function loadLessonContent(lessonId: string) {
  try {
    const response = await fetch(`/quran/lessons/${lessonId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load lesson ${lessonId}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load lesson content for ${lessonId}:`, error);
    return null;
  }
}

/**
 * @deprecated Use loadQuranMetadata instead
 */
export async function loadQuranData() {
  return loadQuranMetadata();
}

export const importedQuranData = null;

