const fs = require('fs');
const path = require('path');

// Простой SVG иконки для PWA
const createIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffb347;stop-opacity:1" />
      <stop offset="25%" style="stop-color:#ff8c42;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="75%" style="stop-color:#ff8c42;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffb347;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#1a1a2e" stroke="#ff6b35" stroke-width="8"/>
  
  <!-- Inner circle -->
  <circle cx="256" cy="256" r="200" fill="url(#coinGradient)" filter="url(#glow)"/>
  
  <!-- Letter M -->
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="180" font-weight="900" text-anchor="middle" fill="#8b4513" stroke="#ffffff" stroke-width="4">M</text>
  
  <!-- Decorative stars -->
  <circle cx="150" cy="150" r="8" fill="#ffd700" opacity="0.8"/>
  <circle cx="362" cy="150" r="8" fill="#ffd700" opacity="0.8"/>
  <circle cx="150" cy="362" r="8" fill="#ffd700" opacity="0.8"/>
  <circle cx="362" cy="362" r="8" fill="#ffd700" opacity="0.8"/>
  
  <!-- Center highlight -->
  <circle cx="256" cy="256" r="60" fill="#ffffff" opacity="0.3"/>
</svg>`;
};

// Создаем SVG файлы для разных размеров
const sizes = [192, 512];

sizes.forEach(size => {
  const svgContent = createIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, '..', 'public', filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created ${filename}`);
});

console.log('\n🎨 SVG иконки созданы!');
console.log('📝 Для конвертации в PNG используйте:');
console.log('   - Онлайн конвертер: https://convertio.co/svg-png/');
console.log('   - Или ImageMagick: convert icon-192x192.svg icon-192x192.png');
console.log('   - Или Inkscape: inkscape --export-png=icon-192x192.png icon-192x192.svg -w 192 -h 192');
