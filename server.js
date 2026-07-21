const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const DIR = __dirname;

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
  let file = req.url === '/' ? '/index.html' : req.url;
  const fp = path.join(DIR, file);
  if (!fp.startsWith(DIR)) {
    res.writeHead(403);
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
