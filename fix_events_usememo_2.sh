sed -i 's/  }, \[dbEvents, activities\]);/    return merged.sort((a, b) => a.timestamp - b.timestamp);\n  }, [dbEvents, activities]);/' src/pages/Events.tsx
