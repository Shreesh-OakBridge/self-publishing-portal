// Post-build prerender: renders each public route to static HTML so non-JS
// crawlers and social scrapers get real content, per-page meta, and JSON-LD.
//
// Runs after `vite build` (see package.json "build" script). It serves the
// freshly built dist/ locally, loads each route in headless Chromium, lets the
// app render (incl. CMS fetch + applySeo), then writes the rendered HTML to
// dist/<route>/index.html. Vercel serves those static files for those paths;
// real users still get the SPA taking over on load.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = 4317;

// Indexable public routes (not the funnel/auth/account/checkout/admin pages).
const ROUTES = ['/', '/services', '/plans', '/portfolio', '/faq', '/about', '/terms', '/privacy'];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml',
};

// Minimal static server with SPA fallback to index.html for extension-less paths.
function serve() {
  return http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
      let filePath = path.join(DIST, urlPath);
      if (!path.extname(filePath) || !existsSync(filePath)) {
        filePath = path.join(DIST, 'index.html'); // SPA fallback
      }
      const data = await readFile(filePath);
      res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end('Not found');
    }
  });
}

async function run() {
  const server = serve();
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      // Skip the one-time welcome overlay so the home page renders its real content.
      await page.evaluateOnNewDocument(() => {
        try { sessionStorage.setItem('ob_welcomed', '1'); } catch { /* ignore */ }
      });
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'networkidle0',
        timeout: 45000,
      });
      // Ensure SEO (canonical/meta/JSON-LD) has been applied before capturing.
      await page.waitForSelector('link[rel="canonical"]', { timeout: 8000 }).catch(() => {});
      const html = await page.content();
      await page.close();

      const outDir = route === '/' ? DIST : path.join(DIST, route);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(path.join(outDir, 'index.html'), html);
      console.log(`prerendered ${route} -> ${path.relative(DIST, path.join(outDir, 'index.html'))} (${html.length} bytes)`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`Prerendered ${ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
