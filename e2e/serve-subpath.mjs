// Serves dist/ under /some/sub/path/ so the E2E suite can check sub-path hosting.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PREFIX = '/some/sub/path/';
const ROOT = join(import.meta.dirname, '..', 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (!path.startsWith(PREFIX)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const rel = normalize(path.slice(PREFIX.length) || 'index.html');
  // A service worker script must be served as JavaScript.
  if (rel.startsWith('..')) {
    res.writeHead(400).end();
    return;
  }
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'Content-Type': TYPES[extname(rel)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(4174);
