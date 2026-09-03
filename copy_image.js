const fs = require('fs');
const path = require('path');

const source = 'C:\\Users\\DLK Groups\\.gemini\\antigravity-ide\\brain\\015076e4-5771-4d90-a908-f0b7ec606108\\combined_carousel_banner_1783594416269.png';
const dest = path.join(__dirname, 'src', 'assets', 'Images', 'combined-banner.png');

fs.copyFileSync(source, dest);
console.log('Successfully copied the image to ' + dest);
