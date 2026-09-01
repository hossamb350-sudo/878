import { getFirestore } from "firebase-admin/firestore";
import fs from 'fs';
import path from 'path';

function escapeHtml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function injectDynamicMetaTags(reqUrl: string, html: string, db: FirebaseFirestore.Firestore | null, host: string): Promise<string> {
  if (!db) return html;

  try {
    const url = new URL(reqUrl, `https://${host}`);
    const pathname = url.pathname;
    const searchParams = url.searchParams;
    const parts = pathname.split('/').filter(Boolean);

    let title = "";
    let description = "";
    let imageUrl = "";

    // Local JSON mapping for pure lessons
    if (parts[0] === 'quran' && searchParams.has('lesson') && !searchParams.has('syllabus')) {
      const lessonId = searchParams.get('lesson');
      const cwd = process.cwd();
      const metadataPath = fs.existsSync(path.join(cwd, 'dist/client/quran/metadata.json')) 
        ? path.join(cwd, 'dist/client/quran/metadata.json') 
        : path.join(cwd, 'public/quran/metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        const raw = fs.readFileSync(metadataPath, 'utf8');
        const quranData = JSON.parse(raw);
        const matchLesson = (quranData.lessons || []).find((l: any) => l.id === lessonId);
        if (matchLesson) {
          const matchSeries = (quranData.series || []).find((s: any) => s.id === matchLesson.seriesId);
          title = matchSeries?.title || "سلسلة دروس";
          description = matchLesson.title || "درس مقرر";
          imageUrl = "/icon.png";
        }
      }
    } else {
      let collection = "";
      let slug = "";
      let isQuranSpecial = false;

      if (parts[0] === 'news' && parts[1]) { collection = 'news'; slug = parts[1]; }
      else if (parts[0] === 'articles' && parts[1]) { collection = 'articles'; slug = parts[1]; }
      else if (parts[0] === 'watch' && parts[1] === 'channel' && parts[2]) { collection = 'livestreams'; slug = parts[2]; }
      else if (parts[0] === 'watch' && parts[1]) { collection = 'videos'; slug = parts[1]; }
      else if (parts[0] === 'leader' && parts[1]) { collection = 'leader'; slug = parts[1]; }
      else if (parts[0] === 'events' && parts[1] === 'activity' && parts[2]) { collection = 'activities'; slug = parts[2]; }
      else if (parts[0] === 'quran') {
        if (searchParams.has('syllabus')) {
          collection = 'quran_syllabuses';
          slug = searchParams.get('syllabus') || "";
          isQuranSpecial = true;
        } else if (searchParams.has('excerpt')) {
          collection = 'quran_excerpts';
          slug = searchParams.get('excerpt') || "";
          isQuranSpecial = true;
        }
      }

      if (collection && slug) {
        const doc = await db.collection(collection).doc(slug).get();
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            title = data.title || data.name || "";
            description = data.summary || data.shortDescription || data.description || "";
            imageUrl = data.imageUrl || data.image || data.thumbnailUrl || data.iconUrl || "";

            if (isQuranSpecial && collection === 'quran_syllabuses') {
              title = data.seriesTitle || "سلسلة دروس";
              description = data.lessonTitle || "درس مقرر";
            } else if (isQuranSpecial && collection === 'quran_excerpts') {
              title = data.title || "مقتطف";
              description = data.author || "السيد حسين بدر الدين الحوثي"; // Default author if not present
            }

            if (!description && data.content) {
              description = data.content.substring(0, 200);
            }
          }
        }
      }
    }

    if (title || description) {
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `https://${host}${imageUrl}`;
      }

      const fullUrl = `https://${host}${reqUrl}`;
      const fullTitle = `${title} | منصة تعز الإعلامية`;
      const combinedTitle = `منصة تعز الإعلامية | ${title}`;

      const metaTags = `
        <meta property="og:title" content="${escapeHtml(combinedTitle)}" />
        <meta property="og:description" content="${escapeHtml(description)}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${fullUrl}" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="منصة تعز الإعلامية" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(combinedTitle)}" />
        <meta name="twitter:description" content="${escapeHtml(description)}" />
        <meta name="twitter:image" content="${imageUrl}" />
      `;
      
      let updatedHtml = html.replace('</head>', `${metaTags}\n</head>`);
      updatedHtml = updatedHtml.replace(/<title>.*<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
      
      return updatedHtml;
    }

  } catch (error) {
    console.error("Error injecting OG tags:", error);
  }

  return html;
}
