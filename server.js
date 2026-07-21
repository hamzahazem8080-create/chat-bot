const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const DIR = __dirname;
const GROQ_API = 'api.groq.com';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

http.createServer((req, res) => {
  // ── CORS preflight ──
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // ── Proxy for Groq API ──
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const opts = {
        hostname: GROQ_API,
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers['authorization'],
        },
      };
      const proxy = https.request(opts, proxyRes => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(data);
        });
      });
      proxy.on('error', () => {
        res.writeHead(502, { 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: { message: 'Proxy error' } }));
      });
      proxy.end(body);
    });
    return;
  }

  // ── Static files ──
  let file = req.url === '/' ? '/index.html' : req.url;
  const fp = path.join(DIR, file);
  if (!fp.startsWith(DIR)) {
    res.writeHead(403, { 'Access-Control-Allow-Origin': '*' });
    return res.end('Forbidden');
  }
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('');
  console.log('  ===============================');
  console.log('    ذكي — شات بوت المدرسة');
  console.log('  ===============================');
  console.log('  📡  http://localhost:' + PORT);
  console.log('  ⚡  اضغط Ctrl+C للإيقاف');
  console.log('');
});
