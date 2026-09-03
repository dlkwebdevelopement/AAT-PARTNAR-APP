const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Agathiyan\\AAT-PROJECT\\APP\\Vendor_New\\src\\screens',
  'c:\\Agathiyan\\AAT-PROJECT\\APP\\Vendor_New\\src\\components'
];

function walkSync(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walkSync(filepath, callback);
    } else if (filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
      callback(filepath);
    }
  });
}

dirs.forEach(dir => {
  walkSync(dir, filepath => {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content;

    newContent = newContent.replace(/colors\.dark_green/g, 'colors.deep_blue');
    newContent = newContent.replace(/colors\.light_green/g, 'colors.deep_blue');
    newContent = newContent.replace(/colors\.very_light_green/g, '"#F0F4FF"');
    newContent = newContent.replace(/colors\.very_light_gray/g, '"#FAFAFA"');
    newContent = newContent.replace(/backgroundColor:\s*['"]#FFB300['"]/gi, 'backgroundColor: colors.deep_blue');
    newContent = newContent.replace(/shadowColor:\s*['"]#FFB300['"]/gi, 'shadowColor: colors.deep_blue');
    newContent = newContent.replace(/#1a7f3c/gi, '#0B1A3D');
    newContent = newContent.replace(/#e8f5e9/gi, '#EFF6FF');
    newContent = newContent.replace(/#a5d6a7/gi, '#DBEAFE');
    newContent = newContent.replace(/#f0fdf4/gi, '#F0F4FF');

    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log('Updated: ' + filepath);
    }
  });
});
console.log('Bulk update completed.');
