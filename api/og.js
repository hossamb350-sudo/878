export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const urlPath = req.url; // e.g. /news/123

    // Fetch the original index.html from the static deployment
    let html = '';
    try {
      // Use the root path to hit the standard static index.html fallback
      const response = await fetch(`${protocol}://${host}/`);
      html = await response.text();
    } catch (error) {
      console.error('Error fetching index.html:', error);
      return res.status(500).send('Internal Server Error');
    }

    const projectId = "gen-lang-client-0926657815";
    const databaseId = "ai-studio-3ecd4bf3-759a-4f54-93a0-c6d66639984e";
    
    // Parse collection and slug from URL
    // URL might be /api/og.js if rewritten?
    // Wait, in Vercel, req.url in a rewrite will be the original URL or the rewritten URL?
    // According to Vercel docs, req.url is the path of the original request!
    // But to be safe, we can pass it in the query string from vercel.json.
    
    // Let's extract from req.url assuming it's the original or passed as query.
    let collection = "";
    let slug = "";
    
    if (req.query && req.query.type && req.query.slug) {
        collection = req.query.type;
        if (collection === 'watch') collection = 'videos';
        slug = req.query.slug;
    } else {
        const parts = urlPath.split('?')[0].split('/').filter(Boolean);
        if (parts[0] === 'news') { collection = 'news'; slug = parts[1]; }
        else if (parts[0] === 'articles') { collection = 'articles'; slug = parts[1]; }
        else if (parts[0] === 'watch' && parts[1] === 'channel') { collection = 'livestreams'; slug = parts[2]; }
        else if (parts[0] === 'watch') { collection = 'videos'; slug = parts[1]; }
        else if (parts[0] === 'leader') { collection = 'leader'; slug = parts[1]; }
        else if (parts[0] === 'events' && parts[1] === 'activity') { collection = 'activities'; slug = parts[2]; }
    }

    if (collection && slug) {
      const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collection}/${slug}`;
      const docRes = await fetch(docUrl);
      if (docRes.ok) {
        const docData = await docRes.json();
        if (docData.fields) {
            const fields = docData.fields;
            const title = fields.title?.stringValue || fields.name?.stringValue || "";
            const description = fields.summary?.stringValue || fields.shortDescription?.stringValue || fields.description?.stringValue || (fields.content?.stringValue || "").substring(0, 200);
            let imageUrl = fields.imageUrl?.stringValue || fields.image?.stringValue || fields.thumbnailUrl?.stringValue || fields.iconUrl?.stringValue || "";
            if (imageUrl && imageUrl.startsWith("/")) {
              imageUrl = `${protocol}://${host}${imageUrl}`;
            }
            const fullUrl = `${protocol}://${host}${urlPath}`;
            
            const metaTags = `
              <meta property="og:title" content="منصة تعز الإعلامية" />
              <meta property="og:description" content="${escapeHtml(title)}" />
              <meta property="og:image" content="${imageUrl}" />
              <meta property="og:url" content="${fullUrl}" />
              <meta property="og:type" content="article" />
              <meta property="og:site_name" content="منصة تعز الإعلامية" />
              
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="منصة تعز الإعلامية" />
              <meta name="twitter:description" content="${escapeHtml(title)}" />
              <meta name="twitter:image" content="${imageUrl}" />
            `;
            
            // Replace the generic tags if they exist, or just inject before </head>
            html = html.replace('</head>', `${metaTags}</head>`);
            html = html.replace(/<title>.*<\/title>/, `<title>${escapeHtml(title + ' | منصة تعز الإعلامية')}</title>`);
        }
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Unhandled error in OG API:', error);
    res.status(500).send('Server Error');
  }
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
