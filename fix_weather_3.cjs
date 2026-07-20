const fs = require('fs');
let hwContent = fs.readFileSync('src/components/HeaderWidgets.tsx', 'utf8');

// The rest of the leftover function is between the top of the file and `const renderMosqueDomeIcon = () => (`

const endIndex = hwContent.indexOf('const renderMosqueDomeIcon = () => (');
// We need to find where the leftover starts. It starts with `  // 1. Check for Sunrise/Sunset`
const startIndex = hwContent.indexOf('  // 1. Check for Sunrise/Sunset');

if (startIndex !== -1 && endIndex !== -1) {
    const before = hwContent.substring(0, startIndex);
    const after = hwContent.substring(endIndex);
    // Remove trailing `};\n\n` from the before part just in case? Actually `before` has the `iconProps`? Wait no, `iconProps` was removed.
    // Let's just find the start of the imports and we can see what's before.
    fs.writeFileSync('src/components/HeaderWidgets.tsx', before + after);
    console.log("Removed leftover code.");
} else {
    console.log("Could not find start or end index.");
}
