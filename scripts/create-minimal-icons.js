const fs = require('fs');
const path = require('path');

// Создаем простые PNG иконки используя минимальный PNG формат
const createMinimalPNG = (size) => {
  // Минимальный PNG заголовок + 1x1 пиксель
  // Это будет работать как placeholder, браузер масштабирует
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
  ]);
  
  return pngData;
};

// Создаем PNG файлы
const sizes = [192, 512];

sizes.forEach(size => {
  const pngData = createMinimalPNG(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(__dirname, '..', 'public', filename);
  
  fs.writeFileSync(filepath, pngData);
  console.log(`✅ Created ${filename}`);
});

// Создаем favicon
const faviconData = createMinimalPNG(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), faviconData);
console.log(`✅ Created favicon.ico`);

console.log('\n🎨 Минимальные PNG иконки созданы!');
console.log('📱 Эти иконки будут работать как placeholder');
console.log('💡 Рекомендуется заменить их на качественные PNG иконки');
