const fs = require('fs');

// Ensure dark mode is globally forced off in index.html as well
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('<meta name="color-scheme" content="light">')) {
  html = html.replace('<head>', '<head>\n    <meta name="color-scheme" content="light">');
  fs.writeFileSync('index.html', html);
  console.log("Added color-scheme meta tag");
}

// Check index.css
let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('@custom-variant dark (&:is(.never-dark));')) {
  css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n@custom-variant dark (&:is(.never-dark));');
  fs.writeFileSync('src/index.css', css);
  console.log("Updated tailwindcss dark variant");
}

