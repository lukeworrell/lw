// Regenerates public/resume.pdf from src/pages/resume-print.astro by
// rendering it with headless Chromium and printing to PDF.
//
// Run locally (`npm run resume:pdf`) and commit the resulting PDF —
// this does not run as part of the Cloudflare Pages build. See the
// README note / chat for why (no headless Chromium in that build
// environment).
//
// Astro's dev server runs as a persistent background daemon (astro dev
// stop/status/logs) rather than exiting with the process that started
// it, so if one's already running on PORT this reuses it instead of
// trying to start a second one. Otherwise it starts a temporary one and
// stops it again when done. Either way: render /resume-print, wait for
// webfonts to finish loading (otherwise the PDF can get generated with
// a fallback font mid-swap), write the PDF.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PORT = 4321;
const PRINT_URL = `http://localhost:${PORT}/resume-print`;
const OUTPUT = fileURLToPath(new URL('../public/resume.pdf', import.meta.url));

async function isServerUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = async () => {
      if (await isServerUp(url)) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for ${url}`));
      setTimeout(tryOnce, 300);
    };
    tryOnce();
  });
}

async function main() {
  let server = null;
  const alreadyRunning = await isServerUp(`http://localhost:${PORT}/`);

  if (alreadyRunning) {
    console.log(`Using the dev server already running at http://localhost:${PORT}`);
  } else {
    console.log('Starting a temporary dev server...');
    server = spawn('npx', ['astro', 'dev', '--port', String(PORT)], { shell: true, stdio: 'inherit' });
    await waitForServer(PRINT_URL);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(PRINT_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: OUTPUT,
      format: 'Letter',
      margin: { top: '0.45in', bottom: '0.45in', left: '0.5in', right: '0.5in' },
      printBackground: true,
    });
    console.log(`Wrote ${OUTPUT}`);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
