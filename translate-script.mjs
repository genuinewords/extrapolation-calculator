import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';

const input = fs.readFileSync('src/content/blog/extrapolate-categorical-data.mdx', 'utf8');
const parts = input.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);

const frontmatter = parts[1];
const body = parts[2];

// Translate frontmatter fields
const lines = frontmatter.split('\n');
const translatedLines = [];
for (const line of lines) {
  if (line.startsWith('title: ') || line.startsWith('description: ')) {
    const [key, ...rest] = line.split(': ');
    const val = rest.join(': ').replace(/^"/, '').replace(/"$/, '');
    const res = await translate(val, { to: 'bn' });
    translatedLines.push(`${key}: "${res.text}"`);
  } else {
    translatedLines.push(line);
  }
}

// Translate body in chunks
const paragraphs = body.split(/\n\n+/);
const translatedParagraphs = [];
for (const para of paragraphs) {
  if (para.startsWith('<') || para.startsWith('```') || para.match(/^\s*$/)) {
    translatedParagraphs.push(para);
    continue;
  }
  try {
    const res = await translate(para, { to: 'bn' });
    translatedParagraphs.push(res.text);
  } catch {
    translatedParagraphs.push(para);
  }
}

const result = `---\n${translatedLines.join('\n')}\n---\n\n${translatedParagraphs.join('\n\n')}`;
fs.writeFileSync('src/content/blog/bn-extrapolate-categorical-data.mdx', result);
console.log('Done');
