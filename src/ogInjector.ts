import { getFirestore } from "firebase-admin/firestore";

function escapeHtml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function injectDynamicMetaTags(reqPath: string, html: string, db: FirebaseFirestore.Firestore | null, host: string): Promise<string> {
  if (!db) return html;

  try {
    const parts = reqPath.split('/').filter(Boolean);
    let collection = "";
    let slug = "";

    if (parts[0] === 'news' && parts[1]) { collection = 'news'; slug = parts[1]; }
    else if (parts[0] === 'articles' && parts[1]) { collection = 'articles'; slug = parts[1]; }
    else if (parts[0] === 'watch' && parts[1]) { collection = 'videos'; slug = parts[1]; }
    else if (parts[0] === 'leader' && parts[1]) { collection = 'leader'; slug = parts[1]; }
    else if (parts[0] === 'events' && parts[1] === 'activity' && parts[2]) { collection = 'activities'; slug = parts[2]; }

    if (collection && slug) {
      const doc = await db.collection(collection).doc(slug).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          const title = data.title || "";
          let description = data.summary || data.shortDescription || "";
          if (!description && data.content) {
            description = data.content.substring(0, 200);
          }
          let imageUrl = data.imageUrl || data.image || data.thumbnailUrl || "";
          if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `https://${host}${imageUrl}`;
          }
          const fullUrl = `https://${host}${reqPath}`;
          const fullTitle = `${title} | منصة تعز الإعلامية`;

          const metaTags = `
            <meta property="og:title" content="${escapeHtml(fullTitle)}" />
            <meta property="og:description" content="${escapeHtml(description)}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="${fullUrl}" />
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="منصة تعز الإعلامية" />
            
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
            <meta name="twitter:description" content="${escapeHtml(description)}" />
            <meta name="twitter:image" content="${imageUrl}" />
          `;
          
          let updatedHtml = html.replace('</head>', `${metaTags}\n</head>`);
          updatedHtml = updatedHtml.replace(/<title>.*<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
          
          return updatedHtml;
        }
      }
    }
  } catch (error) {
    console.error("Error injecting OG tags:", error);
  }

  return html;
}
