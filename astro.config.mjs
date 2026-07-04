// @ts-check
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

// Set this to your real production origin. Used for canonical URLs,
// sitemap generation, Open Graph tags, and JSON-LD.
const SITE = 'https://www.cyberkunju.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  trailingSlash: 'never',

  integrations: [
    svelte(),
    // Keep the internal design/style-guide page out of the sitemap.
    sitemap({ filter: (page) => !page.includes('/design') }),
  ],

  // Native Shiki highlighting with dual themes. Light is the default output;
  // dark is switched via CSS (see src/styles/prose.css). Astro 7 ships a
  // Rust-based markdown pipeline; remark/rehype plugins are opt-in.
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },

  // Inline small stylesheets to remove render-blocking requests on the
  // critical path; larger ones stay external and cacheable.
  build: {
    inlineStylesheets: 'auto',
  },

  // Ship the smallest HTML possible.
  compressHTML: true,
});
