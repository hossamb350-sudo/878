import React from 'react';
import { Helmet } from 'react-helmet-async';
import { routes } from '../utils/routes';

interface SEOProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'video.other';
  path?: string;
}

export function SEO({ title, description, imageUrl, type = 'website', path }: SEOProps) {
  const siteName = "منصة تعز الإعلامية";
  
  // For the browser tab (standard title)
  const tabTitle = title ? `${title} | ${siteName}` : siteName;
  
  // For Open Graph Title (as required for Facebook preview)
  const ogTitle = title ? `${siteName} | ${title}` : siteName;
  
  const absoluteUrl = path ? routes.absolute(path) : undefined;

  return (
    <Helmet>
      <title>{tabTitle}</title>
      {description && <meta name="description" content={description} />}
      
      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={ogTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {absoluteUrl && <meta property="og:url" content={absoluteUrl} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      
      {/* Canonical */}
      {absoluteUrl && <link rel="canonical" href={absoluteUrl} />}
    </Helmet>
  );
}
