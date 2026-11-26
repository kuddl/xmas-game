import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SPRITES_DIR = path.resolve('public/assets/sprites');
fs.mkdirSync(SPRITES_DIR, { recursive: true });

// Minimal pure-Node RGBA PNG encoder
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createCanvas(width, height) {
  const buf = Buffer.alloc(width * height * 4, 0);
  return {
    width,
    height,
    buf,
    set(x, y, hex) {
      if (x < 0 || y < 0 || x >= width || y >= height || !hex) return;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) : 255;
      const i = (y * width + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = a;
    },
    rect(x, y, w, h, hex) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          this.set(xx, yy, hex);
        }
      }
    },
    drawGrid(ox, oy, rows, palette) {
      for (let y = 0; y < rows.length; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch !== '.' && ch !== ' ' && palette[ch]) {
            this.set(ox + x, oy + y, palette[ch]);
          }
        }
      }
    },
    save(filename) {
      const png = encodePNG(width, height, buf);
      fs.writeFileSync(path.join(SPRITES_DIR, filename), png);
      console.log(`Generated ${filename} (${width}x${height})`);
    },
  };
}

// 1. PLAYER SPRITESHEET (4 frames x 16x16 = 64x16)
// Festive winter runner with red beanie, red coat, carrying a golden gift with red ribbon
{
  const palette = {
    K: '#141824', // dark outline
    R: '#d92638', // festive red coat/hat
    D: '#941727', // dark red shade
    W: '#f4f8ff', // white fur trim / highlight
    S: '#f7c59f', // skin
    E: '#1a2030', // eye
    Y: '#f5b82e', // gift box gold
    O: '#d18815', // gift shade
    B: '#2b3a55', // pants
    T: '#4a2c2a', // boots
  };

  // Frame 0: Stride A (left leg forward, right leg back)
  const frame0 = [
    '....KKKKK.......',
    '...KRRRRRK......',
    '..KRRRRRWWK.....',
    '..KDDDDDDDK.....',
    '...KKSSSK.......',
    '...KSSESK.......',
    '....KKKKK..KKKK.',
    '...KRRRRKKKYYRYK',
    '..KRRDDRRKKYYRYK',
    '..KRRRRRRRKRRRRK',
    '..KRRDRRRRKYYRYK',
    '...KWWWWWK.KKKK.',
    '..KKBBKBBKK.....',
    '.KTTKK..KKTTK...',
    '.KKKK....KKKK...',
    '................',
  ];

  // Frame 1: Passing (legs together, slight bob down)
  const frame1 = [
    '................',
    '....KKKKK.......',
    '...KRRRRRK......',
    '..KRRRRRWWK.....',
    '..KDDDDDDDK.....',
    '...KKSSSK.......',
    '...KSSESK.......',
    '....KKKKK..KKKK.',
    '...KRRRRKKKYYRYK',
    '..KRRDDRRKKYYRYK',
    '..KRRRRRRRKRRRRK',
    '..KRRDRRRRKYYRYK',
    '...KWWWWWK.KKKK.',
    '....KBBBBK......',
    '....KTTKTTK.....',
    '....KKKKKK......',
  ];

  // Frame 2: Stride B (right leg forward, left leg back)
  const frame2 = [
    '....KKKKK.......',
    '...KRRRRRK......',
    '..KRRRRRWWK.....',
    '..KDDDDDDDK.....',
    '...KKSSSK.......',
    '...KSSESK.......',
    '....KKKKK..KKKK.',
    '...KRRRRKKKYYRYK',
    '..KRRDDRRKKYYRYK',
    '..KRRRRRRRKRRRRK',
    '..KRRDRRRRKYYRYK',
    '...KWWWWWK.KKKK.',
    '...KBBKKBBK.....',
    '..KTTK..KTTK....',
    '..KKKK..KKKK....',
    '................',
  ];

  // Frame 3: Jump pose (legs tucked, scarf/coat lifted)
  const frame3 = [
    '....KKKKK.......',
    '...KRRRRRK......',
    '..KRRRRRWWK.....',
    '..KDDDDDDDK.....',
    '...KKSSSK.......',
    '...KSSESK.......',
    '....KKKKK..KKKK.',
    '..KKRRRRKKKYYRYK',
    '.KRRRDDRRKKYYRYK',
    '..KRRRRRRRKRRRRK',
    '...KWWWWWK.YYRYK',
    '..KKBBBBKK.KKKK.',
    '.KTTKKKKTTK.....',
    '.KKKK..KKKK.....',
    '................',
    '................',
  ];

  // Frame 4: Duck pose (crouched low, gift tucked in)
  const frame4 = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...KKKKK........',
    '..KRRRRRK.......',
    '.KRRRRRWWK......',
    '.KDDDDDDDK.KKKK.',
    '..KSSSSSKKKYYRYK',
    '..KSSESSKRKYYRYK',
    '.KRRRRRRRRKRRRRK',
    '.KRRDRRRRRKYYRYK',
    '.KWWWWWWWWKKKKK.',
    'KTTKKBBBBKKTTK..',
  ];

  const c = createCanvas(80, 16);
  c.drawGrid(0, 0, frame0, palette);
  c.drawGrid(16, 0, frame1, palette);
  c.drawGrid(32, 0, frame2, palette);
  c.drawGrid(48, 0, frame3, palette);
  c.drawGrid(64, 0, frame4, palette);
  c.save('player.png');
}

// 2. OBSTACLE BLOCK (24x24) — Retro icy corporate crate / terminal block with red festive accents
{
  const c = createCanvas(24, 24);
  const K = '#16243d';
  const I1 = '#e8f4ff'; // bright ice snow top
  const I2 = '#a9d3f5'; // light ice blue
  const I3 = '#5d9bd6'; // mid blue
  const I4 = '#2f5e96'; // dark blue
  const R1 = '#e02f40'; // festive red accent
  const R2 = '#9c1a28'; // dark red

  // Outer border
  c.rect(1, 2, 22, 21, K);
  // Inner body
  c.rect(2, 3, 20, 19, I3);
  // Top bevel & snow cap
  c.rect(2, 3, 20, 3, I1);
  c.rect(3, 1, 18, 2, I1);
  c.rect(2, 2, 1, 1, K);
  c.rect(21, 2, 1, 1, K);
  c.rect(3, 0, 18, 1, K);
  // Snow drips
  c.rect(4, 6, 3, 2, I1);
  c.rect(12, 6, 4, 1, I1);
  c.rect(18, 6, 2, 2, I1);

  // Inner recessed panel
  c.rect(4, 8, 16, 11, I4);
  c.rect(5, 9, 14, 9, I2);

  // Festive red warning stripes / ribbon on sides
  c.rect(5, 9, 14, 2, R1);
  c.rect(5, 16, 14, 2, R1);
  c.rect(11, 9, 2, 9, R1);
  c.rect(11, 11, 2, 5, R2);

  // Corner bolts
  c.set(3, 20, I4);
  c.set(20, 20, I4);
  c.set(3, 8, I4);
  c.set(20, 8, I4);

  c.save('obstacle-block.png');
}

// 3. GROUND TILE (64x32) — Seamless snowy/icy ground
{
  const c = createCanvas(64, 32);
  const S1 = '#ffffff'; // crisp snow top
  const S2 = '#d7eeff'; // snow shadow
  const I1 = '#90c8f0'; // ice layer 1
  const I2 = '#4f91cc'; // ice layer 2
  const I3 = '#285a8f'; // deep ice
  const I4 = '#193b63'; // dark bedrock

  // Deep base
  c.rect(0, 0, 64, 32, I3);
  c.rect(0, 24, 64, 8, I4);
  c.rect(0, 10, 64, 8, I2);
  c.rect(0, 5, 64, 6, I1);
  c.rect(0, 2, 64, 4, S2);
  c.rect(0, 0, 64, 3, S1);

  // Pixelated snowdrifts / ice blocks pattern (seamless wrap)
  for (let x = 0; x < 64; x++) {
    const wave = Math.round(Math.sin((x / 64) * Math.PI * 4) * 1.5);
    c.rect(x, 3, 1, Math.max(1, 2 + wave), S1);
    c.rect(x, 5 + wave, 1, 2, S2);
    if (x % 8 === 0) {
      c.rect(x, 12, 5, 3, I1);
      c.rect(x + 2, 19, 4, 3, I2);
    }
    if (x % 16 === 4) {
      c.rect(x, 26, 6, 3, I3);
    }
  }
  c.save('ground-tile.png');
}

// 4. BG MOUNTAINS FAR (256x128) — Seamless light icy mountain silhouettes
{
  const c = createCanvas(256, 128);
  const M1 = '#8cc7f0'; // far mountain blue
  const M2 = '#b7def8'; // snow slope highlight
  const M3 = '#e3f3ff'; // bright snow ridge

  const peaks = [
    { x: 24, h: 72, w: 46 },
    { x: 82, h: 95, w: 58 },
    { x: 150, h: 68, w: 50 },
    { x: 212, h: 88, w: 56 },
  ];

  for (let x = 0; x < 256; x++) {
    let maxY = 0;
    let isLit = false;
    for (const p of peaks) {
      // wrap distance
      let dx = x - p.x;
      if (dx > 128) dx -= 256;
      if (dx < -128) dx += 256;
      const adx = Math.abs(dx);
      if (adx < p.w) {
        // stepped pixel mountain
        const stepX = Math.floor(adx / 3) * 3;
        const h = Math.floor(p.h * (1 - stepX / p.w));
        if (h > maxY) {
          maxY = h;
          isLit = dx > 0;
        }
      }
    }
    if (maxY > 0) {
      const topY = 128 - maxY;
      for (let y = topY; y < 128; y++) {
        const distFromTop = y - topY;
        if (distFromTop < 12 && isLit) {
          c.set(x, y, M3);
        } else if (distFromTop < 22 && isLit) {
          c.set(x, y, M2);
        } else {
          c.set(x, y, M1);
        }
      }
    }
  }
  c.save('bg-mountains-far.png');
}

// 5. BG MOUNTAINS MID (256x128) — Closer, higher contrast icy ridges
{
  const c = createCanvas(256, 128);
  const M1 = '#3b82c4';
  const M2 = '#66aee8';
  const M3 = '#e6f5ff';

  const peaks = [
    { x: 40, h: 64, w: 42 },
    { x: 118, h: 78, w: 48 },
    { x: 196, h: 58, w: 44 },
    { x: 248, h: 70, w: 38 },
  ];

  for (let x = 0; x < 256; x++) {
    let maxY = 0;
    let isLit = false;
    for (const p of peaks) {
      let dx = x - p.x;
      if (dx > 128) dx -= 256;
      if (dx < -128) dx += 256;
      const adx = Math.abs(dx);
      if (adx < p.w) {
        const stepX = Math.floor(adx / 2) * 2;
        const h = Math.floor(p.h * (1 - stepX / p.w));
        if (h > maxY) {
          maxY = h;
          isLit = dx >= 0;
        }
      }
    }
    if (maxY > 0) {
      const topY = 128 - maxY;
      for (let y = topY; y < 128; y++) {
        const d = y - topY;
        if (d < 8) {
          c.set(x, y, M3);
        } else if (isLit) {
          c.set(x, y, M2);
        } else {
          c.set(x, y, M1);
        }
      }
    }
  }
  c.save('bg-mountains-mid.png');
}

// 6. BG TREES NEAR (256x64) — Seamless snow-capped pixel pine trees with occasional red accents
{
  const c = createCanvas(256, 64);
  const T1 = '#1f538a';
  const T2 = '#3a7bb8';
  const S1 = '#f0f8ff';
  const TR = '#3d2b24';
  const RD = '#e02f40'; // tiny festive red ornament

  function drawPine(cx, baseH, height, hasOrnament) {
    const baseY = 64 - baseH;
    // Trunk
    c.rect(cx - 1, baseY - 4, 3, 6, TR);
    // Layered tiers
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const tierTop = baseY - height + Math.floor((t * (height - 4)) / tiers);
      const tierH = Math.ceil((height - 4) / tiers) + 3;
      const halfW = 3 + t * 3;
      for (let dy = 0; dy < tierH; dy++) {
        const w = Math.max(1, Math.floor((dy / tierH) * halfW));
        const y = tierTop + dy;
        for (let dx = -w; dx <= w; dx++) {
          const x = (cx + dx + 256) % 256;
          if (dy <= 1 || (dy === 2 && Math.abs(dx) === w)) {
            c.set(x, y, S1); // snow on branches
          } else if (dx > 0) {
            c.set(x, y, T2);
          } else {
            c.set(x, y, T1);
          }
        }
      }
    }
    if (hasOrnament) {
      c.set((cx - 2 + 256) % 256, baseY - Math.floor(height * 0.45), RD);
      c.set((cx + 2 + 256) % 256, baseY - Math.floor(height * 0.25), RD);
    }
  }

  const trees = [
    [16, 0, 34, true],
    [38, 0, 24, false],
    [74, 0, 40, true],
    [98, 0, 28, false],
    [136, 0, 36, false],
    [162, 0, 22, true],
    [194, 0, 42, true],
    [224, 0, 30, false],
    [244, 0, 26, false],
  ];

  for (const [x, base, h, orn] of trees) {
    drawPine(x, base, h, orn);
  }
  c.save('bg-trees-near.png');
}

// 7. POWER-UP: MERKLE ICON (16x16) — Gulf Blue badge, white M, Pomegranate triangle
{
  const palette = {
    O: '#f7d1a8', // Maize outline (glowing coin rim)
    N: '#040e4b', // Gulf Blue
    W: '#ffffff', // M glyph
    R: '#f23a1d', // Pomegranate triangle
  };
  const grid = [
    '..OOOOOOOOOOOO..',
    '.ONNNNNNNNNNNNO.',
    'ONNNNNNNNNNNNNNO',
    'ONNNNNNNNNNNNNNO',
    'ONRRRNWWNNNNWWNO',
    'ONNRRNWWWNNWWWNO',
    'ONNNRNWWWWWWWWNO',
    'ONNNNNWWNWWNWWNO',
    'ONNNNNWWNNNNWWNO',
    'ONNNNNWWNNNNWWNO',
    'ONNNNNWWNNNNWWNO',
    'ONNNNNNNNNNNNNNO',
    'ONNNNNNNNNNNNNNO',
    'ONNNNNNNNNNNNNNO',
    '.ONNNNNNNNNNNNO.',
    '..OOOOOOOOOOOO..',
  ];
  const c = createCanvas(16, 16);
  c.drawGrid(0, 0, grid, palette);
  c.save('powerup-merkle.png');
}

// 8. POWER-UP: ARC LOGO (16x16) — inverted-Y arch on a snow-white badge
{
  const palette = {
    O: '#040e4b', // dark outline
    W: '#f2f8ff', // badge
    B: '#3346d1', // arc stem blue
    D: '#1d2a8c', // arc mid
    N: '#0a0d30', // arc legs (dark navy)
  };
  const grid = [
    '.....OOOOOO.....',
    '...OOWWWWWWOO...',
    '..OWWWWBBWWWWO..',
    '.OWWWWWBBWWWWWO.',
    '.OWWWWWBBWWWWWO.',
    'OWWWWWWDDWWWWWWO',
    'OWWWWWDDDDWWWWWO',
    'OWWWWWNDDNWWWWWO',
    'OWWWWNNWWNNWWWWO',
    'OWWWNNWWWWNNWWWO',
    'OWWNNWWWWWWNNWWO',
    '.ONNNWWWWWWNNNO.',
    '.ONNWWWWWWWWNNO.',
    '..OWWWWWWWWWWO..',
    '...OOWWWWWWOO...',
    '.....OOOOOO.....',
  ];
  const c = createCanvas(16, 16);
  c.drawGrid(0, 0, grid, palette);
  c.save('powerup-arc.png');
}

// 9. SPARKLE (5x5) — white so it can be tinted per power-up
{
  const c = createCanvas(5, 5);
  c.drawGrid(0, 0, ['..W..', '.WWW.', 'WWWWW', '.WWW.', '..W..'], {
    W: '#ffffff',
  });
  c.save('sparkle.png');
}

// 10. FLYING OBSTACLE (24x16) — winged "meeting invite" envelope
{
  const palette = {
    K: '#12223a', // outline
    W: '#f2f8ff', // envelope paper
    R: '#e02f40', // red flap lines
    G: '#a9d3f5', // icy wings
    Y: '#f5b82e', // gold seal
  };
  const grid = [
    '......KKKKKKKKKKKK......',
    '..KK.KWWWWWWWWWWWWK.KK..',
    '.KGGKKWRWWWWWWWWRWKKGGK.',
    'KGGGGKWWRWWWWWWRWWKGGGGK',
    'KGGGGKWWWRWWWWRWWWKGGGGK',
    '.KGGGKWWWWRWWRWWWWKGGGK.',
    '..KKKKWWWWWRRWWWWWKKKK..',
    '.....KWWWWWWWWWWWWK.....',
    '.....KWWWWWWWWWWWWK.....',
    '.....KWWWWWWYYWWWWK.....',
    '.....KWWWWWYYYYWWWK.....',
    '.....KWWWWWWYYWWWWK.....',
    '.....KWWWWWWWWWWWWK.....',
    '......KKKKKKKKKKKK......',
    '........................',
    '........................',
  ];
  const c = createCanvas(24, 16);
  c.drawGrid(0, 0, grid, palette);
  c.save('obstacle-flyer.png');
}

// 11. PLATFORM TILE (16x8) — seamless snowy ice ledge
{
  const palette = {
    W: '#ffffff',
    S: '#d7eeff',
    H: '#e8f4ff',
    I: '#90c8f0',
    M: '#4f91cc',
    K: '#1a3a63',
  };
  const grid = [
    'WWWWWWWWWWWWWWWW',
    'WWWSWWWWWWWSWWWW',
    'SSSSSSSSSSSSSSSS',
    'IIIHIIIIIIIHIIII',
    'IIIIIIIIIIIIIIII',
    'MMMMMIMMMMMMMIMM',
    'MMMMMMMMMMMMMMMM',
    'KKKKKKKKKKKKKKKK',
  ];
  const c = createCanvas(16, 8);
  c.drawGrid(0, 0, grid, palette);
  c.save('platform-tile.png');
}

// 12. STORY POINT COIN (4 spin frames x 12x12 = 48x12)
{
  const K = '#7a4a00'; // outline
  const L = '#ffe27a'; // light edge
  const Y = '#f5b82e'; // gold
  const O = '#d18815'; // shade / inner ring
  const W = '#ffffff'; // highlight
  const widths = [1, 0.62, 0.2, 0.62];
  const c = createCanvas(48, 12);
  widths.forEach((w, frame) => {
    const rx = Math.max(1.1, 5.6 * w);
    const ry = 5.6;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const dx = (x + 0.5 - 6) / rx;
        const dy = (y + 0.5 - 6) / ry;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        let col = Y;
        if (d > 0.68) col = K;
        else if (w > 0.5 && d > 0.28 && d < 0.44) col = O; // embossed inner ring
        else if (dx < -0.35) col = L;
        else if (dx > 0.4) col = O;
        c.set(frame * 12 + x, y, col);
      }
    }
    if (w === 1) {
      c.set(frame * 12 + 3, 3, W);
      c.set(frame * 12 + 4, 2, W);
    }
  });
  c.save('coin.png');
}

// 13. CREATIVE-MODE MUSHROOM (16x16) — pink cap with white dots (#14)
{
  const palette = {
    K: '#3a1030', // outline
    R: '#e8458b', // pink cap
    D: '#a8235e', // cap shade
    W: '#fff4fb', // dots
    S: '#f7e7d4', // stem
    H: '#d9c2a8', // stem shade
    E: '#3a1030', // tiny eyes
  };
  const grid = [
    '................',
    '.....KKKKKK.....',
    '...KKRRWWRRKK...',
    '..KRRRWWWRRRRK..',
    '.KRWWRRRRRRWWRK.',
    '.KRWWRRRRRRWWRK.',
    'KRRRRRWWRRRRRRRK',
    'KRRRRWWWWRRRWRRK',
    'KDDRRRWWRRRRDDDK',
    '.KKDDDDDDDDDDKK.',
    '....KSSSSSSK....',
    '....KSESSESK....',
    '....KSSSSSSK....',
    '....KSSSSSHK....',
    '....KSSSSHHK....',
    '.....KKKKKK.....',
  ];
  const c = createCanvas(16, 16);
  c.drawGrid(0, 0, grid, palette);
  c.save('mushroom.png');
}

// 14. COIN CLOUD (64x24) — soft pixel cloud drawn behind the double-jump coin cluster (#17)
{
  const FILL = '#ffffffd9';
  const SHADE = '#d7eeffd9';
  const EDGE = '#9cc8eef0';
  const blobs = [
    [13, 15, 8.5],
    [24, 10, 9.5],
    [37, 8.5, 10.5],
    [50, 13, 9],
    [31, 15, 10],
  ];
  const inside = (x, y) =>
    y <= 21 && blobs.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r);
  const c = createCanvas(64, 24);
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 64; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      c.set(x, y, edge ? EDGE : y >= 17 ? SHADE : FILL);
    }
  }
  c.save('coin-cloud.png');
}

// 15. SANTA'S SLEIGH WITH TWO FLYING REINDEER (2 frames x 64x24 = 128x24), facing left (landing page #023)
{
  const K = '#141824'; // outline
  const B = '#8a5a2b'; // reindeer brown
  const L = '#c49058'; // belly / light brown
  const A = '#e8d2a8'; // antlers
  const N = '#e02f40'; // red nose
  const R = '#d92638'; // sleigh / santa red
  const D = '#941727'; // dark red
  const G = '#f5b82e'; // gold
  const W = '#f4f8ff'; // white fur / beard
  const S = '#f7c59f'; // skin
  const c = createCanvas(128, 24);

  const reindeer = (ox, oy, frame, nose) => {
    c.rect(ox + 3, oy + 3, 9, 4, B); // body
    c.rect(ox + 4, oy + 6, 7, 1, L); // belly
    c.rect(ox + 1, oy + 1, 3, 3, B); // neck
    c.rect(ox - 1, oy, 3, 2, B); // head
    c.set(ox - 2, oy + 1, nose); // nose
    c.set(ox, oy, K); // eye
    for (const [x, y] of [[0, -1], [1, -2], [-1, -2], [2, -1], [2, -3], [0, -3]]) c.set(ox + x, oy + y, A);
    c.set(ox + 12, oy + 3, W); // tail
    if (frame === 0) {
      c.rect(ox + 4, oy + 7, 1, 3, B);
      c.rect(ox + 10, oy + 7, 1, 3, B);
      c.set(ox + 4, oy + 10, K);
      c.set(ox + 10, oy + 10, K);
    } else {
      // gallop: legs stretched forward and back
      for (const [x, y] of [[3, 7], [2, 8], [1, 9], [11, 7], [12, 8], [13, 9]]) c.set(ox + x, oy + y, B);
      c.set(ox + 0, oy + 9, K);
      c.set(ox + 14, oy + 9, K);
    }
  };

  for (let frame = 0; frame < 2; frame++) {
    const fx = frame * 64;
    const bob = frame === 0 ? 0 : 1;
    reindeer(fx + 3, 7 + bob, frame, N);
    reindeer(fx + 19, 8 - bob, 1 - frame, '#4a2c2a');
    // reins
    for (let x = fx + 15; x < fx + 44; x += 2) c.set(x, 11, G);

    // sleigh body with curled front
    c.rect(fx + 38, 13, 22, 6, R);
    c.rect(fx + 38, 18, 22, 1, D);
    c.rect(fx + 36, 14, 2, 3, R);
    c.set(fx + 36, 13, R);
    c.rect(fx + 38, 13, 22, 1, G);
    // runner
    c.rect(fx + 37, 21, 25, 1, G);
    c.set(fx + 36, 20, G);
    c.set(fx + 35, 19, G);
    c.rect(fx + 42, 19, 1, 2, G);
    c.rect(fx + 56, 19, 1, 2, G);

    // gift on the back
    c.rect(fx + 54, 7, 6, 6, G);
    c.rect(fx + 56, 7, 2, 6, N);
    c.rect(fx + 54, 9, 6, 1, N);

    // santa
    c.rect(fx + 45, 7, 8, 6, R); // coat
    c.rect(fx + 45, 11, 8, 1, W); // fur trim
    c.rect(fx + 46, 3, 5, 3, S); // face
    c.rect(fx + 45, 5, 7, 3, W); // beard
    c.rect(fx + 46, 1, 5, 2, R); // hat
    c.rect(fx + 45, 3, 7, 1, W); // hat brim
    c.set(fx + 52, 1, W); // pompom
    c.set(fx + 47, 4, K); // eye
    c.rect(fx + 43, 8 + bob, 2, 2, R); // arm
    c.set(fx + 42, 9 + bob, K); // mitten
  }

  // 1px dark outline around everything
  const filled = (x, y) => x >= 0 && y >= 0 && x < 128 && y < 24 && c.buf[(y * 128 + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 128; x++) {
      if (filled(x, y)) continue;
      if (x % 64 === 63 || x % 64 === 0) continue; // keep frames separate
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) c.set(x, y, K);
  c.save('santa-sleigh.png');
}

// 16. TINSEL GARLAND TILE (32x12) — seamless sagging strand with beads (landing page finale #023)
{
  const beads = ['#f5b82e', '#e02f40', '#dfe8f2', '#6cb8f0'];
  const c = createCanvas(32, 12);
  for (let x = 0; x < 32; x++) {
    const y = Math.round(2 + 6 * Math.sin((Math.PI * x) / 32));
    c.set(x, y, '#f5b82e');
    c.set(x, y + 1, x % 4 < 2 ? '#d18815' : '#ffe27a');
    if (x % 8 === 4) {
      const col = beads[(x / 8) | 0];
      c.rect(x - 1, y + 2, 3, 2, col);
      c.set(x, y + 2, '#ffffff');
    }
  }
  c.save('tinsel.png');
}

// 17. FAVICON (16x16) — golden gift with red ribbon
{
  const palette = { K: '#141824', Y: '#f5b82e', O: '#d18815', R: '#e02f40', D: '#941727', W: '#ffffff' };
  const grid = [
    '................',
    '....RR....RR....',
    '...R..R..R..R...',
    '...R...RR...R...',
    '....RRRRRRRR....',
    '.KKKKKKRRKKKKKK.',
    '.KYYYYYRRYYYYYK.',
    '.KRRRRRRRRRRRRK.',
    '.KKKKKKRRKKKKKK.',
    '..KYWYYRRYYYYK..',
    '..KYYYYRRYYYOK..',
    '..KYYYYRRYYYOK..',
    '..KYYYYRRYYOOK..',
    '..KOYYYRRYYOOK..',
    '..KKKKKKKKKKKK..',
    '................',
  ];
  const c = createCanvas(16, 16);
  c.drawGrid(0, 0, grid, palette);
  c.save('favicon.png');
}

// 18. Write spritesheet.json config
const spritesheet = {
  version: '1.0.0',
  pixelArt: true,
  sprites: {
    player: {
      path: '/assets/sprites/player.png',
      frameWidth: 16,
      frameHeight: 16,
      frames: 5,
      animations: {
        run: { frames: [0, 1, 2, 1], fps: 10 },
        jump: { frames: [3], fps: 1 },
        duck: { frames: [4], fps: 1 },
      },
    },
    obstacle: {
      path: '/assets/sprites/obstacle-block.png',
      width: 24,
      height: 24,
    },
    ground: {
      path: '/assets/sprites/ground-tile.png',
      width: 64,
      height: 32,
    },
    bgMountainsFar: {
      path: '/assets/sprites/bg-mountains-far.png',
      width: 256,
      height: 128,
    },
    bgMountainsMid: {
      path: '/assets/sprites/bg-mountains-mid.png',
      width: 256,
      height: 128,
    },
    bgTreesNear: {
      path: '/assets/sprites/bg-trees-near.png',
      width: 256,
      height: 64,
    },
    powerupMerkle: {
      path: '/assets/sprites/powerup-merkle.png',
      width: 16,
      height: 16,
    },
    powerupArc: {
      path: '/assets/sprites/powerup-arc.png',
      width: 16,
      height: 16,
    },
    sparkle: {
      path: '/assets/sprites/sparkle.png',
      width: 5,
      height: 5,
    },
    obstacleFlyer: {
      path: '/assets/sprites/obstacle-flyer.png',
      width: 24,
      height: 16,
    },
    platform: {
      path: '/assets/sprites/platform-tile.png',
      width: 16,
      height: 8,
    },
    coin: {
      path: '/assets/sprites/coin.png',
      frameWidth: 12,
      frameHeight: 12,
      frames: 4,
      animations: {
        spin: { frames: [0, 1, 2, 3], fps: 8 },
      },
    },
    mushroom: {
      path: '/assets/sprites/mushroom.png',
      width: 16,
      height: 16,
    },
    coinCloud: {
      path: '/assets/sprites/coin-cloud.png',
      width: 64,
      height: 24,
    },
    santaSleigh: {
      path: '/assets/sprites/santa-sleigh.png',
      frameWidth: 64,
      frameHeight: 24,
      frames: 2,
      animations: {
        fly: { frames: [0, 1], fps: 6 },
      },
    },
    tinsel: {
      path: '/assets/sprites/tinsel.png',
      width: 32,
      height: 12,
    },
    favicon: {
      path: '/assets/sprites/favicon.png',
      width: 16,
      height: 16,
    },
  },
};

fs.writeFileSync(
  path.resolve('public/assets/spritesheet.json'),
  JSON.stringify(spritesheet, null, 2) + '\n'
);
console.log('Generated public/assets/spritesheet.json');
