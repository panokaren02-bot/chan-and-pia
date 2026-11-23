// Converts the original photos in public/mobile-image and public/desktop-image
// into small WebP files in public/images. Edit MAP to change which photo goes where.
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const M = (n, ext = 'jpeg') => `public/mobile-image/couples (${n}).${ext}`;
const D = (n) => `public/desktop-image/couples (${n}).jpeg`;

// name -> { m: mobile (portrait) source, d: desktop (landscape) source }
const MAP = {
  loader:    { d: D(31) },
  hero:      { m: M(14), d: D(2) },
  savedate:  { m: M(5, 'png'), d: D(10) },
  ceremony:  { d: D(34) },
  reception: { d: D(13) },
  dresscode: { m: M(9), d: D(15) },
  entourage: { m: M(8), d: D(25) },
  polaroid:  { m: M(7, 'png') },
  rsvp:      { m: M(12), d: D(29) },
  thanks:    { m: M(2, 'png'), d: D(42) },
  // gallery
  g1: { m: M(1, 'png') }, g2: { d: D(20) }, g3: { m: M(6, 'png') }, g4: { d: D(28) },
  g5: { m: M(15) }, g6: { d: D(11) }, g7: { m: M(4, 'png') }, g8: { d: D(46) },
  g9: { m: M(10) }, g10: { d: D(37) }, g11: { m: M(3, 'png') }, g12: { d: D(36) },
};

const out = 'public/images';
fs.mkdirSync(out, { recursive: true });

for (const [name, src] of Object.entries(MAP)) {
  for (const [kind, file] of Object.entries(src)) {
    const width = kind === 'm' ? 1080 : 2000;
    const dest = path.join(out, `${name}-${kind}.webp`);
    await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toFile(dest);
    console.log(dest, Math.round(fs.statSync(dest).size / 1024) + 'K');
  }
}

// Small prints for the opening-screen collage (c1..c12)
const THUMBS = [M(1, 'png'), D(20), M(3, 'png'), D(28), M(15), D(36), M(6, 'png'), M(13), D(39), M(4, 'png'), D(46), M(10)];
for (const [i, file] of THUMBS.entries()) {
  const dest = path.join(out, `c${i + 1}.webp`);
  await sharp(file).rotate().resize({ width: 520, withoutEnlargement: true }).webp({ quality: 70 }).toFile(dest);
  console.log(dest, Math.round(fs.statSync(dest).size / 1024) + 'K');
}
