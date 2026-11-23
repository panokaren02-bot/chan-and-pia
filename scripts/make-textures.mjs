// Generates the linen and photo-paper textures used by the hashtag flat-lay (public/textures).
import sharp from 'sharp';
import fs from 'fs';

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const smooth = (n, k) => { // 1-D smoothed noise that wraps around
  const raw = Array.from({ length: n }, () => rnd() - .5);
  return raw.map((_, i) => { let s = 0; for (let j = -k; j <= k; j++) s += raw[(i + j + n) % n]; return s / (2 * k + 1); });
};

function linen(size, base) {
  const buf = Buffer.alloc(size * size * 3);
  const rowF = smooth(size, 1), rowS = smooth(size, 6), colF = smooth(size, 1), colS = smooth(size, 6);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const weave = ((x + y) % 2 ? 1 : -1) * 2.2;              // over/under thread pattern
    const v = rowF[y] * 13 + rowS[y] * 4 + colF[x] * 11 + colS[x] * 3 + weave + (rnd() - .5) * 12;
    const i = (y * size + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.max(0, Math.min(255, base[c] + v * (c === 0 ? 1 : .75)));
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 3 } });
}

function paper(size, base) {
  const buf = Buffer.alloc(size * size * 3);
  const fib = smooth(size * 4, 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = (rnd() - .5) * 7 + fib[(x * 3 + y * 7) % (size * 4)] * 10;
    const i = (y * size + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.max(0, Math.min(255, base[c] + v));
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 3 } }).blur(.4);
}

fs.mkdirSync('public/textures', { recursive: true });
await linen(512, [76, 26, 38]).webp({ quality: 82 }).toFile('public/textures/linen-burgundy.webp');
await paper(320, [248, 244, 236]).webp({ quality: 85 }).toFile('public/textures/photo-paper.webp');
for (const f of fs.readdirSync('public/textures')) console.log(f, Math.round(fs.statSync('public/textures/' + f).size / 1024) + 'K');
