const fs = require('fs');
const path = require('path');

const files = [
  'qmi07_agitador.png',
  'qmi07_soporte.png',
  'qmi07_bureta.png',
  'qmi07_matraz.png'
];

console.log('--- Analizando Transparencia ---');
files.forEach(file => {
  const filePath = path.join('public', 'images', file);
  if (!fs.existsSync(filePath)) {
    console.log(`${file}: NO EXISTE`);
    return;
  }
  const buffer = fs.readFileSync(filePath);
  // PNG signature is 8 bytes. IHDR chunk starts at offset 8.
  // IHDR length is 4 bytes (always 13).
  // IHDR type is 'IHDR' (4 bytes).
  // IHDR data: Width(4), Height(4), Bit depth(1), Color type(1)...
  // Color type 6 (Truecolor with alpha) or 4 (Grayscale with alpha).
  const colorType = buffer[25];
  const hasAlpha = colorType === 4 || colorType === 6;
  console.log(`${file}: ColorType=${colorType}, HasAlpha=${hasAlpha}`);
});
