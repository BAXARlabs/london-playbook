// Render smoke test. Grepping built HTML does not prove a page is visible —
// .tour and .tip both shipped at opacity:0 and passed every HTML-level check.
// This renders the built site and asserts real, on-screen content per section.
//
//   SKIN=playbook npm run build && node scripts/smoke.mjs playbook
//
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const skin = process.argv[2] || process.env.SKIN || 'playbook';
const conf = JSON.parse(fs.readFileSync(new URL(`../src/skins/${skin}.json`, import.meta.url)));
const parent = conf.extends ? JSON.parse(fs.readFileSync(new URL(`../src/skins/${conf.extends}.json`, import.meta.url))) : {};
const basePath = (conf.site?.basePath ?? parent.site?.basePath ?? '').replace(/\/$/, '');

const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json' };
const root = path.join(process.cwd(), 'dist');
const srv = http.createServer((req, res) => {
  let f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(4321, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
await page.goto(`http://localhost:4321${basePath}/`, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
});
await page.waitForTimeout(1500);

const countVisible = (sel) => page.$$eval(sel, els => els.filter(e => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  // A <summary> stays visible when its <details> is closed; everything else in there does not.
  if (!e.closest('summary') && e.closest('details:not([open])')) return false;
  return s.opacity !== '0' && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
}).length);

// [selector, minimum that must be VISIBLE, label]
// Always on screen — a visitor must see these without clicking anything.
const ALWAYS = [
  ['.hero h1, .hero .wordmark', 1, 'hero wordmark'],
  ['#gameday .countdown', 1, 'Game Day countdown'],
  ['.scoreboard .stat', 4, 'scoreboard stats'],
  ['.tour', 12, 'tour cards'],
  ['.filter', 2, 'tour filters'],
  ['.fold-head', 4, 'fold headers'],
  ['.endzone .btn', 2, 'endzone CTAs'],
  ['footer .row > div', 4, 'footer columns'],
];
// Behind a fold — must be visible once opened, and hidden while closed.
const FOLDED = [
  ['.venue', 1, 'venue blocks'],
  ['.station', 3, 'station cards'],
  ['.around-card', 6, 'getting-around cards'],
  ['.tip', 12, 'fan tips'],
  ['.gl-pair', 24, 'glossary pairs'],
];

let failed = 0;
const check = (n, min, label, note='') => {
  const ok = n >= min; if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(n).padStart(3)} / ${min} visible  ${label}${note}`);
};
for (const [sel, min, label] of ALWAYS) check(await countVisible(sel), min, label);

// closed folds must actually hide their contents
const leaked = [];
for (const [sel, , label] of FOLDED) if (await countVisible(sel) > 0) leaked.push(label);
check(leaked.length === 0 ? 1 : 0, 1, 'folds hide contents when closed',
      leaked.length ? `  — leaking: ${leaked.join(', ')}` : '');

await page.$$eval('details.fold', ds => ds.forEach(d => { d.open = true; }));
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
});
await page.waitForTimeout(1200);
for (const [sel, min, label] of FOLDED) check(await countVisible(sel), min, label, '  (fold open)');

await browser.close();
srv.close();
console.log(failed ? `\n${failed} check(s) FAILED for skin "${skin}"` : `\nall checks passed for skin "${skin}"`);
process.exit(failed ? 1 : 0);
