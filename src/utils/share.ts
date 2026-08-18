import { generateSlug, routes } from "./routes";
import { getShareableUrl } from "../config/apiConfig";

export interface ShareOptions {
  title: string;
  type: 'news' | 'video' | 'article' | 'activity' | 'leader';
  id: string;
  imageUrl?: string;
  authorPhoto?: string;
}

/**
 * Fallback to legacy document.execCommand('copy') when Clipboard API is blocked or document lacks focus.
 */
export function copyTextFallback(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Position out of view
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return !!successful;
  } catch (err) {
    console.error("copyTextFallback failed:", err);
    return false;
  }
}

/**
 * Robustly copy text to clipboard trying the Clipboard API, and falling back to execCommand if not focused.
 */
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator.clipboard !== "undefined" && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, attempting legacy fallback...", err);
    }
  }
  return copyTextFallback(text);
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
  const copied = await safeCopyToClipboard(shareableUrl);
  return { success: copied, native: false };
}
