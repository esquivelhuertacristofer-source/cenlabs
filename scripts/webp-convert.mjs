// Convierte todas las imágenes raster de public/{assets,images} a WebP q82.
// Excluye los iconos PWA (public/icon-192.png, public/icon-512.png) y el favicon,
// que deben permanecer PNG/ICO por el manifest y el service worker.
// Uso: node scripts/webp-convert.mjs
import sharp from "sharp";
import { readdirSync, statSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const ROOTS = ["public/assets", "public/images"];
const RASTER = /\.(png|jpe?g)$/i;

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out = out.concat(walk(p));
    else if (RASTER.test(entry)) out.push([p, s.size]);
  }
  return out;
}

let files = [];
for (const r of ROOTS) if (existsSync(r)) files = files.concat(walk(r));

let before = 0, after = 0, converted = 0, failed = 0;
for (const [p, size] of files) {
  const out = p.replace(RASTER, ".webp");
  try {
    await sharp(p).webp({ quality: 82, effort: 6 }).toFile(out);
    const ns = statSync(out).size;
    before += size;
    after += ns;
    converted++;
    unlinkSync(p);
    const pct = ((1 - ns / size) * 100).toFixed(0);
    console.log(`${(size / 1024).toFixed(0)}KB -> ${(ns / 1024).toFixed(0)}KB (-${pct}%)  ${p.replace(/\\/g, "/")}`);
  } catch (e) {
    failed++;
    console.log("ERROR", p, e.message);
  }
}
console.log(`\n== ${converted} convertidos, ${failed} fallidos ==`);
console.log(`Antes: ${(before / 1024 / 1024).toFixed(1)}MB  Despues: ${(after / 1024 / 1024).toFixed(1)}MB  Ahorro: ${((1 - after / before) * 100).toFixed(1)}%`);
