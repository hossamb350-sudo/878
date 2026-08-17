import { routes } from './routes';

export interface PageMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'video.other';
  path?: string; // e.g. routes.news(slug)
}

export function updateMetadata(meta: PageMetadata) {
  const siteName = "منصة تعز الإعلامية";
  const title = meta.title ? `${meta.title} | ${siteName}` : siteName;
  
  // Title
  document.title = title;
  
  const setMetaTag = (selector: string, attribute: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.startsWith('meta[name')) {
        el.setAttribute('name', selector.match(/meta\[name="([^"]+)"\]/)?.[1] || '');
      } else if (selector.startsWith('meta[property')) {
        el.setAttribute('property', selector.match(/meta\[property="([^"]+)"\]/)?.[1] || '');
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attribute, value);
  };

  const setLinkTag = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // Basic Meta
  if (meta.description) {
    setMetaTag('meta[name="description"]', 'content', meta.description);
    setMetaTag('meta[property="og:description"]', 'content', meta.description);
    setMetaTag('meta[property="twitter:description"]', 'content', meta.description);
  }

  // Open Graph
  setMetaTag('meta[property="og:title"]', 'content', title);
  setMetaTag('meta[property="twitter:title"]', 'content', title);
  setMetaTag('meta[property="og:site_name"]', 'content', siteName);

  if (meta.type) {
    setMetaTag('meta[property="og:type"]', 'content', meta.type);
  }

  if (meta.imageUrl) {
    setMetaTag('meta[property="og:image"]', 'content', meta.imageUrl);
    setMetaTag('meta[property="twitter:image"]', 'content', meta.imageUrl);
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
  }

  if (meta.path) {
    const absoluteUrl = routes.absolute(meta.path);
    setMetaTag('meta[property="og:url"]', 'content', absoluteUrl);
    setLinkTag('canonical', absoluteUrl);
  }
}
