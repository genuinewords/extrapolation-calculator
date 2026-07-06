import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  site: 'https://extrapolationcalculator.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      langs: [],
    },
  },
  integrations: [
    tailwind(),
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          hi: 'hi',
          es: 'es',
          ru: 'ru',
          fr: 'fr',
          de: 'de',
          it: 'it',
          pt: 'pt',
          bn: 'bn',
          ja: 'ja',
          ko: 'ko',
          ms: 'ms',
          pl: 'pl',
          id: 'id',
          ar: 'ar',
          bg: 'bg',
          tr: 'tr',
          sv: 'sv',
        },
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@theme': new URL('./theme', import.meta.url).pathname,
      },
    },
  },
});
