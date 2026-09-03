import { defineConfig } from 'astro/config';
import skin from './src/skin.js';

export default defineConfig({
  site: skin.site.url,
  base: skin.site.basePath || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
