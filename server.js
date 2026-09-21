const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const PORT = process.env.PORT || 47913;
const FILES = { '/': 'index.html', '/index.html': 'index.html', '/db.json': 'db.json' };

http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/db') {
      let body = '';
      req.setEncoding('utf8'); // else a multi-byte char split across chunks turns into U+FFFD
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        let data, msg;
        try {
          ({ data, msg } = JSON.parse(body));
          if (!data || !Array.isArray(data.assignments) || !Array.isArray(data.courses)) throw new Error('bad shape');
        } catch (e) {
          res.statusCode = 400;
          return res.end(e.message);
        }
        db.write(data, String(msg || '').trim().slice(0, 120) || 'update db');
        res.end('ok');
      });
      return;
    }

    const file = FILES[req.url.split('?')[0]];
    if (!file) {
      res.statusCode = 404;
      return res.end('not found');
    }
    fs.readFile(path.join(__dirname, file), (err, buf) => {
      if (err) return ((res.statusCode = 500), res.end(err.message));
      res.setHeader('content-type', file.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(buf);
    });
  })
  // localhost only: this server hands out a writable db that auto-pushes to a public repo
  .listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}`));
