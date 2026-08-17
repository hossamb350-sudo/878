const fs = require('fs');

let codeA = fs.readFileSync('src/pages/articles/[slug].tsx', 'utf8');
codeA = codeA.replace(/description: article\.description \|\| "",/g, 'description: "",');
fs.writeFileSync('src/pages/articles/[slug].tsx', codeA);

let codeS = fs.readFileSync('src/pages/search/index.tsx', 'utf8');
if (!codeS.includes('import { routes, generateSlug }')) {
  codeS = codeS.replace(/import \{ Search as SearchIcon/g, 'import { routes, generateSlug } from "../../utils/routes";\nimport { Search as SearchIcon');
  fs.writeFileSync('src/pages/search/index.tsx', codeS);
}

let codeF = fs.readFileSync('src/components/FavoritesList.tsx', 'utf8');
if (!codeF.includes('import { routes, generateSlug }')) {
  codeF = codeF.replace(/import \{ Link \} from "react-router-dom";/, 'import { Link } from "react-router-dom";\nimport { routes, generateSlug } from "../utils/routes";');
}
codeF = codeF.replace(/`\/news\/\$\{item\.id\}`/g, 'routes.news(generateSlug(item.title || "", item.id))');
codeF = codeF.replace(/`\/leader\/\$\{item\.id\}`/g, 'routes.leaderItem(generateSlug(item.title || "", item.id))');
codeF = codeF.replace(/`\/watch\/\$\{item\.id\}`/g, 'routes.watchItem(generateSlug(item.title || "", item.id))');
codeF = codeF.replace(/`\/articles\/\$\{item\.id\}`/g, 'routes.article(generateSlug(item.title || "", item.id))');
fs.writeFileSync('src/components/FavoritesList.tsx', codeF);

