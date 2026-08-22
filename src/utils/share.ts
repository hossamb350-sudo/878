import { generateSlug, routes } from "./routes";
import { getShareableUrl } from "../config/apiConfig";

export interface ShareOptions {
  title: string;
  type: 'news' | 'video' | 'article' | 'activity' | 'leader' | 'channel' | 'radio';
  id: string;
  imageUrl?: string;
  authorPhoto?: string;
}

/**
 * Perform a native share action, or fall back if not supported.
 * Returns true if native share succeeded/was triggered, false if clipboard fallback was used.
 */
export async function shareContent(options: ShareOptions): Promise<{ success: boolean; native: boolean }> {
  const { title, type, id, imageUrl, authorPhoto } = options;
  
  // 1. Generate clean URL (Shortened format using only the ID to prevent long Arabic encoded slugs)
  let path = "";
  switch (type) {
    case "news":
      path = routes.news(id);
      break;
    case "video":
      path = routes.watchItem(id);
      break;
    case "article":
      path = routes.article(id);
      break;
    case "leader":
      path = routes.leaderItem(id);
      break;
    case "activity":
      path = routes.activity(id);
      break;
    case "channel":
    case "radio":
      path = routes.channel(id);
      break;
    default:
      path = `/${type}/${id}`;
  }
  
  const shareableUrl = getShareableUrl(path);
  
  // 2. Select the specific image according to requirements
  let imageToShare = "";
  if (type === "article") {
    // For articles: author's photo or fallback to article image
    imageToShare = authorPhoto || imageUrl || "";
  } else if (type === "video") {
    // For videos: thumbnailUrl (which is options.imageUrl)
    imageToShare = imageUrl || "";
  } else {
    // For news and other: imageUrl
    imageToShare = imageUrl || "";
  }
  
  // Clean empty or undefined values
  if (imageToShare && imageToShare.trim() === "") {
    imageToShare = "";
  }

  // 3. Try Web Share API
  if (typeof navigator.share !== "undefined") {
    try {
      // If we have an image, let's try to fetch and share it as a file
      if (imageToShare) {
        try {
          const response = await fetch(imageToShare, { mode: 'cors' });
          const blob = await response.blob();
          const fileType = blob.type || 'image/jpeg';
          const fileExt = fileType.split('/')[1] || 'jpg';
          const file = new File([blob], `share-${id}.${fileExt}`, { type: fileType });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title,
              text: title,
              url: shareableUrl
            });
            return { success: true, native: true };
          }
        } catch (fileErr) {
          console.debug("Failed to share file, falling back to text/link share", fileErr);
        }
      }
      
      // Fallback to text & link sharing
      await navigator.share({
        title: title,
        text: title,
        url: shareableUrl,
      });
      return { success: true, native: true };
    } catch (err) {
      console.debug("Native share failed, falling back to copy", err);
      // If user cancels, we don't want to show copy-to-clipboard, so check for AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: true, native: true };
      }
    }
  }
  
  // 4. Fallback to Copy to Clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareableUrl);
      return { success: true, native: false };
    }
  } catch (clipboardErr) {
    console.debug("Clipboard writeText failed, trying execCommand fallback", clipboardErr);
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = shareableUrl;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return { success: successful, native: false };
  } catch (fallbackErr) {
    console.warn("Clipboard fallback copy also failed", fallbackErr);
    return { success: false, native: false };
  }
}
