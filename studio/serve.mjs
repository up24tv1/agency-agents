// Zero-dependency static server: node studio/serve.mjs -> http://localhost:5178
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const dir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'app'); const port = +process.env.PORT || 5178;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json' };
http.createServer((req,res)=>{ let p = decodeURIComponent(new URL(req.url,'http://x').pathname); if (p==='/') p='/index.html';
  const f = path.normalize(path.join(dir,p)); if (!f.startsWith(dir+path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)]||'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
    'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; connect-src 'self' http://localhost:* https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'" });
  fs.createReadStream(f).pipe(res); }).listen(port, ()=>console.log('Studio on http://localhost:'+port));
