const fs = require('fs');

let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');

layoutCode = layoutCode.replace(
  'truncate leading-tight w-full">\n                {staticItem.text}',
  'break-words leading-relaxed w-full">\n                {staticItem.text}'
);
layoutCode = layoutCode.replace(
  'overflow-hidden">\n              <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 bg-white text-red-700',
  'items-start">\n              <span className="shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 bg-white text-red-700'
);

fs.writeFileSync('src/components/Layout.tsx', layoutCode);
