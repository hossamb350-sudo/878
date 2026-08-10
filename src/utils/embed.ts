export function getEmbedUrl(url?: string, autoplay: boolean = true, isMuted: boolean = false): string {
  if (!url) return "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=${autoplay ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0`;
    }
  }
  if (url.includes("/w/") || url.includes("/videos/watch/")) {
    let embedUrl = url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
    const params: string[] = [];
    if (autoplay) params.push("autoplay=1");
    if (isMuted) params.push("mute=1");
    if (params.length > 0) {
      embedUrl += (embedUrl.includes("?") ? "&" : "?") + params.join("&");
    }
    return embedUrl;
  }
  return url;
}
