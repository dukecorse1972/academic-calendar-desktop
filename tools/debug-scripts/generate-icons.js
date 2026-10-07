const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

function createPng(size) {
  const width = size;
  const height = size;

  // Each row starts with filter byte 0, followed by RGBA bytes
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  const radius = size * 0.22;
  const center = size / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Squircle background distance
      const dx = Math.abs(x - center);
      const dy = Math.abs(y - center);
      const cornerDist = Math.hypot(
        Math.max(0, dx - (center - radius)),
        Math.max(0, dy - (center - radius))
      );

      if (cornerDist > radius) {
        // Transparent outside rounded squircle
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Base Background Gradient: Deep Blue to Academic Indigo (#1e3a8a to #2563eb)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(26 + gradRatio * 20);   // 26 -> 46
      let g = Math.round(54 + gradRatio * 55);   // 54 -> 109
      let b = Math.round(138 + gradRatio * 95);  // 138 -> 233
      let a = 255;

      // Draw Top Banner (Calendar Top Bar): Dark Navy
      if (y < size * 0.32) {
        r = 15;
        g = 23;
        b = 42;
      }

      // Draw Calendar Grid / Academic Mortarboard Glyph in center
      // 1. Calendar Ring binder clips at top
      const isClip1 = Math.abs(x - size * 0.33) < size * 0.035 && y > size * 0.20 && y < size * 0.36;
      const isClip2 = Math.abs(x - size * 0.67) < size * 0.035 && y > size * 0.20 && y < size * 0.36;
      if (isClip1 || isClip2) {
        r = 245; g = 158; b = 11; // Amber Gold Accent (#f59e0b)
      }

      // 2. Graduation Mortarboard / Academic Cap Symbol in Calendar body
      const capCenterY = size * 0.58;
      const capHalfW = size * 0.26;
      const capHalfH = size * 0.12;

      // Diamond cap top
      const diamondDist = Math.abs(x - center) / capHalfW + Math.abs(y - capCenterY) / capHalfH;
      if (diamondDist <= 1.0 && diamondDist >= 0.82) {
        // Gold rim
        r = 251; g = 191; b = 36;
      } else if (diamondDist < 0.82) {
        // Pure White Academic Cap Surface
        r = 255; g = 255; b = 255;
      }

      // Tassel hanging to right
      const tasselX = center + capHalfW * 0.75;
      if (Math.abs(x - tasselX) < size * 0.018 && y >= capCenterY && y <= capCenterY + size * 0.16) {
        r = 245; g = 158; b = 11;
      }
      if (Math.abs(x - (tasselX + size * 0.015)) < size * 0.025 && y > capCenterY + size * 0.13 && y < capCenterY + size * 0.17) {
        r = 245; g = 158; b = 11;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Header chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const idatData = zlib.deflateSync(rawData);

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);

  return png;
}

function createIco(pngBuffers) {
  // ICO header
  const count = pngBuffers.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let currentOffset = 6 + count * 16;
  const entries = [];
  const imageBuffers = [];

  pngBuffers.forEach(({ size, png }, idx) => {
    const entryOffset = 6 + idx * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entryOffset); // width (0 = 256)
    header.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1); // height
    header.writeUInt8(0, entryOffset + 2); // Color palette
    header.writeUInt8(0, entryOffset + 3); // Reserved
    header.writeUInt16LE(1, entryOffset + 4); // Color planes
    header.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    header.writeUInt32LE(png.length, entryOffset + 8); // Image size in bytes
    header.writeUInt32LE(currentOffset, entryOffset + 12); // Offset

    currentOffset += png.length;
    imageBuffers.push(png);
  });

  return Buffer.concat([header, ...imageBuffers]);
}

function generate() {
  const assetsDir = path.resolve(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  console.log('[Assets] Generating original AcademiCal branding assets...');

  const png256 = createPng(256);
  const png512 = createPng(512);
  const png64 = createPng(64);
  const png48 = createPng(48);
  const png32 = createPng(32);
  const png16 = createPng(16);

  fs.writeFileSync(path.join(assetsDir, 'icon_512.png'), png512);
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), png256);

  const icoBuf = createIco([
    { size: 256, png: png256 },
    { size: 64, png: png64 },
    { size: 48, png: png48 },
    { size: 32, png: png32 },
    { size: 16, png: png16 }
  ]);

  fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuf);
  console.log('✅ Generated original assets/icon_512.png, assets/icon.png, assets/icon.ico successfully.');
}

generate();
