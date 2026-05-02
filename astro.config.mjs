import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'always',
  site: 'https://extrapolationcalculator.com',
  integrations: [
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
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            calculator: ['./src/components/ExtrapolationCalculator.tsx'],
            charts: ['./src/components/ExtrapolationChart.tsx'],
          },
        },
      },
    },
  },
});
