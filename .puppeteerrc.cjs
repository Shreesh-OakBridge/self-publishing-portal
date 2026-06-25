const { join } = require('path');

// Store Chromium inside node_modules/.cache so it persists with Vercel's
// dependency cache (the default ~/.cache/puppeteer is not cached between builds,
// which otherwise makes prerendering fail on cached deploys).
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
