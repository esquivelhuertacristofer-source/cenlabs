const fs = require('fs');
const path = require('path');

async function getDimensions(filename) {
  const filePath = path.join('public', 'images', filename);
  const buffer = fs.readFileSync(filePath);
  // PNG dimensions are at offset 16 (Width) and 20 (Height), each 4 bytes
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function run() {
  const files = ['11.png', '12.png', '13.png', '14.png', '15.png'];
  console.log('--- Dimensiones de los Assets ---');
  for (const file of files) {
    try {
      const dim = await getDimensions(file);
      console.log(`${file}: ${dim.width}x${dim.height}`);
    } catch (e) {
      console.log(`${file}: Error reading`);
    }
  }
}

run();
