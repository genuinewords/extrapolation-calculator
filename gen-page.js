const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'content.txt'), 'utf8');
const outputPath = path.join(__dirname, 'src', 'pages', 'extrapolation', 'index.astro');

fs.writeFileSync(outputPath, content, 'utf8');
console.log('Written ' + content.length + ' bytes to ' + outputPath);
