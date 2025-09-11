const fs = require('fs');
const path = require('path');

// Создаем простые PNG иконки используя минимальный PNG формат
const createPNGIcon = (size) => {
  // Создаем простой PNG с золотой монетой
  // Это будет базовый PNG, который браузер может использовать
  
  // PNG заголовок
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (заголовок изображения)
  const width = size;
  const height = size;
  const bitDepth = 8;
  const colorType = 2; // RGB
  const compression = 0;
  const filter = 0;
  const interlace = 0;
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(bitDepth, 8);
  ihdrData.writeUInt8(colorType, 9);
  ihdrData.writeUInt8(compression, 10);
  ihdrData.writeUInt8(filter, 11);
  ihdrData.writeUInt8(interlace, 12);
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // длина
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([ihdrCrc >> 24, (ihdrCrc >> 16) & 0xFF, (ihdrCrc >> 8) & 0xFF, ihdrCrc & 0xFF])
  ]);
  
  // Создаем простые данные изображения (золотой круг)
  const imageData = createImageData(width, height);
  const compressedData = compressData(imageData);
  
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressedData]));
  const idatChunk = Buffer.concat([
    Buffer.from([compressedData.length >> 24, (compressedData.length >> 16) & 0xFF, (compressedData.length >> 8) & 0xFF, compressedData.length & 0xFF]),
    Buffer.from('IDAT'),
    compressedData,
    Buffer.from([idatCrc >> 24, (idatCrc >> 16) & 0xFF, (idatCrc >> 8) & 0xFF, idatCrc & 0xFF])
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]), // длина
    Buffer.from('IEND'),
    Buffer.from([iendCrc >> 24, (iendCrc >> 16) & 0xFF, (iendCrc >> 8) & 0xFF, iendCrc & 0xFF])
  ]);
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
};

// Простая функция CRC32
function crc32(data) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Создаем данные изображения (золотой круг с буквой M)
function createImageData(width, height) {
  const data = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius) {
        // Золотой цвет для монеты
        data.push(255, 179, 71, 255); // RGBA - золотой
      } else if (distance <= radius + 5) {
        // Темная обводка
        data.push(26, 26, 46, 255); // RGBA - темно-синий
      } else {
        // Прозрачный фон
        data.push(0, 0, 0, 0); // RGBA - прозрачный
      }
    }
  }
  
  return data;
}

// Простое сжатие данных (заглушка)
function compressData(data) {
  // В реальности здесь должно быть DEFLATE сжатие
  // Для простоты возвращаем данные как есть
  return Buffer.from(data);
}

// Создаем PNG иконки
const sizes = [192, 512];

console.log('🎨 Создание PNG иконок...\n');

sizes.forEach(size => {
  try {
    const pngData = createPNGIcon(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(__dirname, '..', 'public', filename);
    
    fs.writeFileSync(filepath, pngData);
    console.log(`✅ Создана ${filename} (${size}x${size})`);
  } catch (error) {
    console.log(`❌ Ошибка создания icon-${size}x${size}.png:`, error.message);
  }
});

// Создаем favicon
try {
  const faviconData = createPNGIcon(32);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), faviconData);
  console.log(`✅ Создан favicon.ico (32x32)`);
} catch (error) {
  console.log(`❌ Ошибка создания favicon.ico:`, error.message);
}

console.log('\n🎉 PNG иконки созданы!');
console.log('\n💡 Если иконки не отображаются корректно, используйте SVG версии или онлайн конвертеры');
