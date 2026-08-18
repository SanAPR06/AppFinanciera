import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(__dirname, 'icon.svg');
const outDir = path.join(root, 'public');

mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512, padded: true },
];

for (const t of targets) {
  const svgBuffer = await sharp(svgPath).resize(t.size, t.size).toBuffer();
  if (t.padded) {
    // Maskable icon: deja margen de seguridad (safe zone ~80%)
    const inner = Math.round(t.size * 0.7);
    const inset = await sharp(svgPath).resize(inner, inner).toBuffer();
    await sharp({
      create: { width: t.size, height: t.size, channels: 4, background: '#14140f' },
    })
      .composite([{ input: inset, gravity: 'center' }])
      .png()
      .toFile(path.join(outDir, t.name));
  } else {
    await sharp(svgBuffer).png().toFile(path.join(outDir, t.name));
  }
  console.log('generated', t.name);
}
console.log('done');
