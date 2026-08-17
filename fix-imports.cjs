const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
content = content.replace(
  '  Trash2,',
  '  Trash2,\n  Activity,\n  Archive,\n  Zap,\n  Radio,\n  ArrowLeftRight,\n  Edit2,\n  Loader2,\n  RotateCcw,'
);
fs.writeFileSync('src/pages/Admin.tsx', content);
