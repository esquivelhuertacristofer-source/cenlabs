/**
 * HOJAS DE CONTACTO de los labs estáticos (public/labs/*.html).
 *
 * Fotografía cada lab tras arrancar y arma cuadrículas de 20 miniaturas con su
 * nombre, para revisar a ojo la calidad del 3D de todo el catálogo con pocas
 * imágenes. No sustituye al barrido (errores, 404, negro): lo complementa.
 *
 *   node scripts/auditoria/hojas-labs-estaticos.mjs <dirSalida> [--solo a,b] [--ms 6000]
 */
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(RAIZ, 'public');
const args = process.argv.slice(2);
const OUT = resolve(args[0] ?? 'hojas');
const SOLO = args.includes('--solo') ? args[args.indexOf('--solo') + 1].split(',') : null;
const MS = args.includes('--ms') ? Number(args[args.indexOf('--ms') + 1]) : 6000;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };

const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch {}
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(q.url.split('?')[0])] || 'application/octet-stream' });
  r.end(c);
});
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const labs = (await readdir(join(PUB, 'labs'))).filter((f) => f.endsWith('.html') && !f.startsWith('_'))
  .map((f) => f.replace('.html', '')).filter((s) => !SOLO || SOLO.includes(s)).sort();
await mkdir(OUT, { recursive: true });
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await nav.newContext({ viewport: { width: 1280, height: 720 } });
const fotos = [];
for (const slug of labs) {
  const p = await ctx.newPage();
  try {
    await p.goto(`${BASE}/labs/${slug}.html`, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(MS);
    const archivo = join(OUT, `${slug}.png`);
    await p.screenshot({ path: archivo });
    fotos.push({ slug, b64: (await readFile(archivo)).toString('base64') });
    process.stdout.write('.');
  } catch (e) { console.log(`\n✗ ${slug}: ${String(e).slice(0, 120)}`); }
  await p.close();
}
for (let i = 0; i < fotos.length; i += 20) {
  const lote = fotos.slice(i, i + 20);
  const html = `<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(5,352px);gap:4px;padding:4px;font:bold 13px sans-serif;color:#fff}
figure{margin:0}img{width:352px;height:198px;display:block}figcaption{padding:1px 3px}</style>` +
    lote.map((f) => `<figure><img src="data:image/png;base64,${f.b64}"><figcaption>${f.slug}</figcaption></figure>`).join('');
  const p = await nav.newPage({ viewport: { width: 1784, height: 900 } });
  await p.setContent(html);
  await p.screenshot({ path: join(OUT, `hoja-${String(i / 20 + 1).padStart(2, '0')}.png`), fullPage: true });
  await p.close();
}
console.log(`\n${fotos.length} labs · ${Math.ceil(fotos.length / 20)} hojas en ${OUT}`);
await nav.close();
srv.close();
