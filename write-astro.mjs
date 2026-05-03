import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const contentPath = join(__dirname, 'content.txt');
const outputPath = join(__dirname, 'src', 'pages', 'extrapolation', 'index.astro');

const content = readFileSync(contentPath, 'utf8');
writeFileSync(outputPath, content, 'utf8');
console.log('Written ' + content.length + ' bytes');
