const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', '(tabs)', 'discover.tsx');
let text = fs.readFileSync(filePath, 'utf-8');

// Replace literal '\n' sequences with actual newline characters
text = text.split('\\n').join('\n');

fs.writeFileSync(filePath, text, 'utf-8');
console.log('Newlines fixed!');
