// @ts-ignore
import importedQuranDataRaw from './importedQuranData.json?raw';

let parsedData = { series: [], lessons: [] };

try {
  if (importedQuranDataRaw) {
    parsedData = JSON.parse(importedQuranDataRaw);
  }
} catch (error) {
  console.error('Failed to parse Quran data:', error);
}

export const importedQuranData = parsedData;
