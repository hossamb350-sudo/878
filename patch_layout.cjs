const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!code.includes('import { routes }')) {
  code = code.replace(
    'import { motion, AnimatePresence } from "motion/react";',
    'import { motion, AnimatePresence } from "motion/react";\nimport { routes } from "../utils/routes";'
  );
}

// Replace the literal string paths with route generator calls
code = code.replace('to: "/",', 'to: routes.home(),');
code = code.replace('to: "/watch",', 'to: routes.watch(),');
code = code.replace('to: "/leader",', 'to: routes.leader(),');
code = code.replace('to: "/quran",', 'to: routes.quran(),');
code = code.replace('to: "/events",', 'to: routes.events(),');
code = code.replace('to: "/admin",', 'to: routes.admin(),');

fs.writeFileSync('src/components/Layout.tsx', code);
