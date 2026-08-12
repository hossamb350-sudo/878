const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const oldLogic = `  // Find the static item: the newest active item that hasn't expired
  const staticItem = urgentNewsList.find(item => item.expiresAt && item.expiresAt > currentTime);
  
  // The rest go to the scrolling marquee
  const scrollingItems = urgentNewsList.filter(item => item.id !== staticItem?.id);`;

const newLogic = `  // Normalize items for backward compatibility
  const normalizedList = urgentNewsList.map(item => ({
    ...item,
    staticExpiresAt: item.staticExpiresAt !== undefined ? item.staticExpiresAt : (item.expiresAt || 0),
    scrollingExpiresAt: item.scrollingExpiresAt !== undefined ? item.scrollingExpiresAt : (item.expiresAt || 0),
  }));

  // Find the static item: the newest active item that is meant to be static
  const staticItem = normalizedList.find(item => item.staticExpiresAt > currentTime);
  
  // The rest go to the scrolling marquee if they haven't expired for scrolling
  const scrollingItems = normalizedList.filter(item => 
    item.scrollingExpiresAt > currentTime && item.id !== staticItem?.id
  );`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/Layout.tsx', content);
