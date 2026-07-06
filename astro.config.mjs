import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, extname } from 'path';

function inlineCssPlugin() {
  return {
    name: 'inline-css',
    hooks: {
      'astro:build:done': function({ dir }) {
        let distDir;
        if (typeof dir === 'string') {
          distDir = dir;
        } else if (dir.pathname) {
          distDir = dir.pathname.replace(/^\/([A-Z]:)/, '$1');
        } else if (dir.toString) {
          distDir = dir.toString();
        } else {
          return;
        }
        const cssDir = join(distDir, '_astro');
        let cssMap = {};
        try {
          const files = readdirSync(cssDir);
          for (const file of files) {
            if (file.endsWith('.css')) {
              cssMap[file] = readFileSync(join(cssDir, file), 'utf-8');
              try { unlinkSync(join(cssDir, file)); } catch {}
            }
          }
        } catch { return; }
        if (Object.keys(cssMap).length === 0) return;

        function processHtmlFiles(dirPath) {
          const entries = readdirSync(dirPath);
          for (const entry of entries) {
            const fullPath = join(dirPath, entry);
            const st = statSync(fullPath);
            if (st.isDirectory()) {
              processHtmlFiles(fullPath);
            } else if (extname(entry) === '.html') {
              let html = readFileSync(fullPath, 'utf-8');
              if (html.includes('rel="stylesheet"')) {
                for (const [cssFile, cssContent] of Object.entries(cssMap)) {
                  html = html.replace(
                    new RegExp('<link rel="stylesheet" href="/_astro/' + cssFile.replace(/\./g, '\\.') + '">'),
                    '<style>' + cssContent + '</style>'
                  );
                }
                writeFileSync(fullPath, html, 'utf-8');
              }
            }
          }
        }
        processHtmlFiles(distDir);
      },
    },
  };
}

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
    inlineCssPlugin(),
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
