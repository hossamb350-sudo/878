const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const importStatement = `import { injectDynamicMetaTags } from "./src/ogInjector";\n`;

// Insert the import right after other imports
serverCode = serverCode.replace('import { IMAGEKIT_CONFIG }', `${importStatement}import { IMAGEKIT_CONFIG }`);

const oldHandler = `    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });`;

const newHandler = `    app.get("*", async (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf-8");
        const host = req.headers.host || "taiz-media-ye.vercel.app";
        html = await injectDynamicMetaTags(req.path, html, getDb(), host);
        res.send(html);
      } else {
        res.status(404).send("Not found");
      }
    });`;

serverCode = serverCode.replace(oldHandler, newHandler);

fs.writeFileSync('server.ts', serverCode);
