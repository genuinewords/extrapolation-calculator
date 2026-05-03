const fs = require('fs');
const path = require('path');

// Read content from content.txt and write to the astro file
const contentPath = path.join(__dirname, 'content.txt');
const outputPath = path.join(__dirname, 'src', 'pages', 'extrapolation', 'index.astro');

if (fs.existsSync(contentPath)) {
  const content = fs.readFileSync(contentPath, 'utf8');
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log('Written ' + content.length + ' bytes to ' + outputPath);
} else {
  console.log('content.txt not found');
}
