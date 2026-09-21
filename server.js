const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const PORT = process.env.PORT || 47913;

http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/db') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const { data, msg } = JSON.parse(body);
          if (!data || !Array.isArray(data.assignments) || !Array.isArray(data.courses)) throw new Error('bad shape');
          db.write(data, String(msg || 'update db').slice(0, 120));
          res.end('ok');
        } catch (e) {
          res.statusCode = 400;
          res.end(e.message);
        }
      });
      return;
    }
    const file = req.url === '/' ? 'index.html' : path.basename(req.url.split('?')[0]);
    fs.readFile(path.join(__dirname, file), (err, buf) => {
      if (err) return ((res.statusCode = 404), res.end('not found'));
      res.setHeader('content-type', file.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(buf);
    });
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}`));
