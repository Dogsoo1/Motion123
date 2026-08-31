/** Zero-dependency static server for the built game. */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  // Redirect to /web/ rather than rewriting, so the page's relative asset
  // paths ("./styles.css", "../dist/...") resolve the way they do on disk.
  if (pathname === '/') {
    res.writeHead(302, { location: '/web/' });
    res.end();
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  // Contain every request inside the project directory.
  const target = resolve(join(ROOT, normalize(pathname)));
  if (!target.startsWith(ROOT) || !existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(target)] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  createReadStream(target).pipe(res);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Start on another port with:\n  PORT=8081 npm start`,
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Deal Room running at http://localhost:${PORT}/`);
});
