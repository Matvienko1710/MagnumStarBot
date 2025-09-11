const fs = require('fs');
const path = require('path');

// Создаем качественные PNG иконки используя простой подход
const createQualityIcon = (size) => {
  // Создаем SVG с правильными размерами
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffb347;stop-opacity:1" />
      <stop offset="25%" style="stop-color:#ff8c42;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="75%" style="stop-color:#ff8c42;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffb347;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="highlight" cx="30%" cy="30%" r="40%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.1" />
    </radialGradient>
  </defs>
  
  <!-- Background circle with shadow -->
  <circle cx="256" cy="256" r="240" fill="#0f172a" stroke="#ff6b35" stroke-width="6"/>
  <circle cx="256" cy="256" r="240" fill="none" stroke="#ff8c42" stroke-width="2" opacity="0.5"/>
  
  <!-- Main coin -->
  <circle cx="256" cy="256" r="200" fill="url(#coinGradient)" filter="url(#glow)"/>
  
  <!-- Inner border -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="#d2691e" stroke-width="3"/>
  
  <!-- Letter M with shadow -->
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="180" font-weight="900" text-anchor="middle" fill="#8b4513" stroke="#ffffff" stroke-width="6">M</text>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="180" font-weight="900" text-anchor="middle" fill="#8b4513" stroke="#654321" stroke-width="2">M</text>
  
  <!-- Decorative stars -->
  <circle cx="120" cy="120" r="12" fill="#ffd700" opacity="0.9">
    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="392" cy="120" r="12" fill="#ffd700" opacity="0.9">
    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" begin="0.5s"/>
  </circle>
  <circle cx="120" cy="392" r="12" fill="#ffd700" opacity="0.9">
    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" begin="1s"/>
  </circle>
  <circle cx="392" cy="392" r="12" fill="#ffd700" opacity="0.9">
    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" begin="1.5s"/>
  </circle>
  
  <!-- Center highlight -->
  <circle cx="256" cy="256" r="80" fill="url(#highlight)"/>
  
  <!-- Shine effect -->
  <ellipse cx="200" cy="200" rx="60" ry="120" fill="#ffffff" opacity="0.3" transform="rotate(-30 200 200)"/>
</svg>`;

  return svgContent;
};

// Создаем качественные SVG иконки
const sizes = [192, 512];

console.log('🎨 Создание качественных иконок...\n');

sizes.forEach(size => {
  const svgContent = createQualityIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, '..', 'public', filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Создана ${filename} (${size}x${size})`);
});

// Создаем favicon
const faviconSvg = createQualityIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log(`✅ Создан favicon.svg (32x32)`);

// Создаем Apple Touch Icon
const appleTouchIcon = createQualityIcon(180);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.svg'), appleTouchIcon);
console.log(`✅ Создан apple-touch-icon.svg (180x180)`);

console.log('\n🎉 Качественные SVG иконки созданы!');
console.log('\n📱 Для конвертации в PNG используйте:');
console.log('   🔗 Онлайн: https://cloudconvert.com/svg-to-png');
console.log('   🔗 Онлайн: https://convertio.co/svg-png/');
console.log('   🔗 Онлайн: https://www.freeconvert.com/svg-to-png');
console.log('\n💻 Локально:');
console.log('   ImageMagick: convert icon-192x192.svg icon-192x192.png');
console.log('   Inkscape: inkscape --export-png=icon-192x192.png icon-192x192.svg -w 192 -h 192');
console.log('\n✨ Рекомендуется конвертировать SVG в PNG для лучшей совместимости');
