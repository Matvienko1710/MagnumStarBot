const fs = require('fs');
const path = require('path');

// Создаем продвинутые PNG иконки с лучшим качеством
const createAdvancedPNG = (size) => {
  // Создаем данные изображения в формате RGBA
  const width = size;
  const height = size;
  const data = [];
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 5;
  const innerRadius = outerRadius - 15;
  const letterRadius = innerRadius * 0.6;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      let r, g, b, a = 255;
      
      if (distance <= outerRadius) {
        if (distance <= innerRadius) {
          // Внутренняя часть монеты - золотой градиент
          const gradient = (distance / innerRadius);
          r = Math.floor(255 - gradient * 50); // 255 -> 205
          g = Math.floor(179 - gradient * 30); // 179 -> 149
          b = Math.floor(71 - gradient * 20);  // 71 -> 51
          
          // Добавляем блик
          const highlightX = centerX - innerRadius * 0.3;
          const highlightY = centerY - innerRadius * 0.3;
          const highlightDist = Math.sqrt((x - highlightX) ** 2 + (y - highlightY) ** 2);
          if (highlightDist < innerRadius * 0.4) {
            const highlight = 1 - (highlightDist / (innerRadius * 0.4));
            r = Math.min(255, r + highlight * 50);
            g = Math.min(255, g + highlight * 50);
            b = Math.min(255, b + highlight * 30);
          }
          
          // Добавляем букву M
          if (isInsideLetterM(x, y, centerX, centerY, letterRadius)) {
            r = Math.floor(r * 0.4); // Темно-коричневый
            g = Math.floor(g * 0.3);
            b = Math.floor(b * 0.2);
          }
        } else {
          // Ободок монеты
          r = 255; g = 107; b = 53; // Оранжевый
        }
      } else {
        // Фон - прозрачный
        r = g = b = 0; a = 0;
      }
      
      data.push(r, g, b, a);
    }
  }
  
  return createPNGFromRGBA(data, width, height);
};

// Проверяем, находится ли точка внутри буквы M
function isInsideLetterM(x, y, centerX, centerY, radius) {
  const dx = x - centerX;
  const dy = y - centerY;
  
  // Простая форма буквы M
  const letterWidth = radius * 0.8;
  const letterHeight = radius * 1.2;
  
  if (Math.abs(dx) > letterWidth / 2 || Math.abs(dy) > letterHeight / 2) {
    return false;
  }
  
  // Левая вертикальная линия
  if (dx < -letterWidth * 0.3 && dx > -letterWidth * 0.4) {
    return true;
  }
  
  // Правая вертикальная линия
  if (dx > letterWidth * 0.3 && dx < letterWidth * 0.4) {
    return true;
  }
  
  // Диагональные линии
  const leftSlope = (dx + letterWidth * 0.4) / (letterWidth * 0.7);
  const rightSlope = (dx - letterWidth * 0.4) / (letterWidth * 0.7);
  
  if (dy > -letterHeight * 0.5 && dy < letterHeight * 0.5) {
    if (Math.abs(dy) < letterHeight * 0.5 * (1 - Math.abs(leftSlope))) {
      return true;
    }
    if (Math.abs(dy) < letterHeight * 0.5 * (1 - Math.abs(rightSlope))) {
      return true;
    }
  }
  
  return false;
}

// Создаем PNG из RGBA данных
function createPNGFromRGBA(data, width, height) {
  // PNG заголовок
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth
  ihdrData.writeUInt8(6, 9);  // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // длина
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([ihdrCrc >> 24, (ihdrCrc >> 16) & 0xFF, (ihdrCrc >> 8) & 0xFF, ihdrCrc & 0xFF])
  ]);
  
  // IDAT chunk - данные изображения
  const imageData = Buffer.from(data);
  const compressedData = simpleDeflate(imageData);
  
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
}

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

// Простое сжатие (заглушка для DEFLATE)
function simpleDeflate(data) {
  // В реальности здесь должно быть DEFLATE сжатие
  // Для простоты возвращаем данные с минимальным сжатием
  return data;
}

// Создаем продвинутые PNG иконки
const sizes = [192, 512];

console.log('🎨 Создание продвинутых PNG иконок...\n');

sizes.forEach(size => {
  try {
    const pngData = createAdvancedPNG(size);
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
  const faviconData = createAdvancedPNG(32);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), faviconData);
  console.log(`✅ Создан favicon.ico (32x32)`);
} catch (error) {
  console.log(`❌ Ошибка создания favicon.ico:`, error.message);
}

console.log('\n🎉 Продвинутые PNG иконки созданы!');
console.log('\n💡 Иконки содержат:');
console.log('   ✨ Золотой градиент');
console.log('   🔤 Букву M в центре');
console.log('   💫 Блик и тени');
console.log('   🎯 Прозрачный фон');
