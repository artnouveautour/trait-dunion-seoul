import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
