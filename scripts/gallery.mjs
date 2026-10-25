/**
 * Serves the gallery: every component, variant, size, tone and state, with a
 * switch for the theme. Builds the stylesheet first, so the page is always the
 * current tokens.
 *
 *   pnpm --filter @toghen/ui gallery            # http://localhost:4175
 *   PORT=5000 pnpm --filter @toghen/ui gallery
 *
 * Nothing here ships. Only `dist/`, `src/` and `dev/` are served.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT ?? 4175);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const SERVED = [join(root, 'dist'), join(root, 'src'), join(root, 'dev')];

const css = await build();
console.log(`dist/toghen-ui.css  ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`);

createServer(async (request, response) => {
  const requested = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (requested === '/') {
    response.writeHead(302, { Location: '/dev/gallery.html' }).end();
    return;
  }
  const relative = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(root, relative);

  if (!SERVED.some((folder) => filePath.startsWith(folder))) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end(`Not found: ${requested}`);
  }
}).listen(port, () => {
  console.log(`Gallery at http://localhost:${port}`);
});
