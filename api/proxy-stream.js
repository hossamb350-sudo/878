export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Icy-MetaData': '0'
      }
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Copy content-type
    const contentType = proxyRes.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);
    
    // Copy icy headers
    const icyMetaInt = proxyRes.headers.get('icy-metaint');
    if (icyMetaInt) responseHeaders.set('icy-metaint', icyMetaInt);
    
    const icyName = proxyRes.headers.get('icy-name');
    if (icyName) responseHeaders.set('icy-name', icyName);

    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Stream error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
