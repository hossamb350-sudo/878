const fs = require('fs');
const file = 'src/components/AdminNewsWizard.tsx';
let code = fs.readFileSync(file, 'utf8');

// The logic block that was injected
const logicBlock = `
  const filteredNewsList = newsList.filter(item => {
    const matchesSearch = !listSearchQuery || item.title.toLowerCase().includes(listSearchQuery.toLowerCase());
    const matchesCategory = listCategoryFilter === "all" || item.category === listCategoryFilter || (item.categories && item.categories.includes(listCategoryFilter));
    const status = item.publishStatus || "published";
    const matchesStatus = listStatusFilter === "all" || status === listStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredNewsList.length / itemsPerPage);
  const paginatedNewsList = filteredNewsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
`;

// Remove the injected block from the wrong place (inside useEffect)
const wrongBlockRegex = /const filteredNewsList = newsList\.filter.*?currentPage \* itemsPerPage\);/s;
code = code.replace(wrongBlockRegex, '');

// Fix the mangled return in useEffect if necessary
code = code.replace(/return \(\) => unsubCats\(\);/, 'return () => unsubCats();');
// Since I did: code = code.replace(/  return \(/, filterLogicInjection + `\n  return (`);
// It means I replaced "  return (" with "logic\n  return (".
// If I removed the logic, the "  return (" is still there. But it should be "  return () => unsubCats();".
// Wait, the original was "  return ()". The replacement made it: "logic\n  return ()"
// So removing the logic just leaves "  return ()". Which is correct.

// Find the real main return. It's probably the one that looks like:
//   return (
//     <div className=...
// Let's find "  return (\n    <div"
const mainReturnIndex = code.indexOf('  return (\n    <div');
if (mainReturnIndex !== -1) {
    code = code.substring(0, mainReturnIndex) + logicBlock + '\n' + code.substring(mainReturnIndex);
} else {
    console.log("Could not find main return");
}

fs.writeFileSync(file, code);
