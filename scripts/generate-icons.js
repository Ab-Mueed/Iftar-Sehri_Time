const fs = require('fs');
const path = require('path');

// Create the icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate a simple SVG icon with the given size and color
function generateSvgIcon(size, color) {
  const halfSize = size / 2;
  const quarterSize = size / 4;
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" />
  <circle cx="${halfSize}" cy="${halfSize}" r="${quarterSize}" fill="white" />
  <text x="${halfSize}" y="${halfSize + 5}" font-family="Arial" font-size="${quarterSize}" fill="${color}" text-anchor="middle">R</text>
</svg>`;
}

// Write the SVG icons to files
const icons = [
  { size: 192, color: '#4CAF50' },
  { size: 512, color: '#4CAF50' }
];

icons.forEach(({ size, color }) => {
  const svgContent = generateSvgIcon(size, color);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Generated icon: ${filePath}`);
});

console.log('Icon generation complete!'); 