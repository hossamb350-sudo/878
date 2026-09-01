import http from 'http';
import https from 'https';
import { parse } from 'url';

export default function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const parsedUrl = parse(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path || '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '0'
      },
      timeout: 15000
    };

    const proxyReq = client.request(options, (proxyRes) => {
      // Handle HTTP redirects (301, 302, 307, 308)
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        let redirectUrl = proxyRes.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
        }
        res.redirect(302, `/api/proxy/stream?url=${encodeURIComponent(redirectUrl)}`);
        return;
      }

      const contentType = proxyRes.headers['content-type'] || 'audio/mpeg';
      res.setHeader('Content-Type', String(contentType));
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (proxyRes.headers['icy-metaint']) {
        res.setHeader('icy-metaint', String(proxyRes.headers['icy-metaint']));
      }
      if (proxyRes.headers['icy-name']) {
        res.setHeader('icy-name', String(proxyRes.headers['icy-name']));
      }

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy stream request error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to proxy stream' });
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || 'Stream error' });
    }
  }
}
