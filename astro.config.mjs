import { defineConfig } from 'astro/config';
import skin from './src/skin.js';

// A skin with a basePath is served under that prefix — London Playbook lives at
// aileronvip.com/london-playbook. Astro's `base` only prefixes generated links,
// it does not nest the output, so emit into dist/<basePath> to match and let
// Vercel serve dist/ as the web root. Skins with no basePath build at root.
const base = skin.site.basePath || '/';
const outDir = base === '/' ? './dist' : './dist' + base;

export default defineConfig({
  site: skin.site.url,
  base,
  outDir,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
