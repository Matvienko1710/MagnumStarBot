const fs = require('fs');
const path = require('path');

// Простые PNG иконки в base64 формате
const createSimplePNG = (size) => {
  // Это простой PNG с золотой монетой и буквой M
  // Размер: 1x1 пиксель, но браузер будет масштабировать
  const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffb347"/>
          <stop offset="50%" style="stop-color:#ff6b35"/>
          <stop offset="100%" style="stop-color:#ffb347"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <circle cx="50" cy="50" r="48" fill="#1a1a2e" stroke="#ff6b35" stroke-width="2"/>
      
      <!-- Coin -->
      <circle cx="50" cy="50" r="40" fill="url(#grad)"/>
      
      <!-- Letter M -->
      <text x="50" y="65" font-family="Arial" font-size="50" font-weight="bold" text-anchor="middle" fill="#8b4513">M</text>
      
      <!-- Highlight -->
      <circle cx="50" cy="50" r="15" fill="#ffffff" opacity="0.3"/>
    </svg>
  `;
  
  return canvas;
};

// Создаем SVG файлы, которые можно легко конвертировать
const sizes = [192, 512];

sizes.forEach(size => {
  const svgContent = createSimplePNG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, '..', 'public', filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created ${filename}`);
});

// Создаем также favicon
const faviconSvg = createSimplePNG(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log(`✅ Created favicon.svg`);

console.log('\n🎨 SVG иконки созданы!');
console.log('📱 Для PWA используйте эти SVG файлы или конвертируйте в PNG');
console.log('🔗 Онлайн конвертер: https://cloudconvert.com/svg-to-png');
