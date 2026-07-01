// Reescribe referencias a imágenes /assets/** y /images/** de .png/.jpg/.jpeg a .webp.
// NO toca /icon-192.png, /icon-512.png (empiezan por /icon-), ni URLs externas
// (usan /patterns/ u otros paths, nunca /assets/ ni /images/).
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CODE = /\.(tsx?|jsx?|mjs|css)$/i;
const RE = /(\/(?:assets|images)\/[^"'`)\s]*)\.(?:png|jpe?g)\b/g;

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out = out.concat(walk(p));
    else if (CODE.test(entry)) out.push(p);
  }
  return out;
}

let changed = 0, hits = 0;
for (const p of walk("src")) {
  const src = readFileSync(p, "utf8");
  let n = 0;
  const out = src.replace(RE, (m, base) => { n++; return base + ".webp"; });
  if (n > 0) {
    writeFileSync(p, out);
    changed++;
    hits += n;
    console.log(`${n}  ${p.replace(/\\/g, "/")}`);
  }
}
console.log(`\n== ${hits} referencias reescritas en ${changed} archivos ==`);
