/**
 * Saca el LIENZO del pizarrón a 1024×768 por `__labDebug.tableroPNG`, no la
 * pantalla en escorzo: los solapes de rótulos, bandas y leyendas sólo se ven a
 * tamaño real, y ninguna prueba numérica puede enterarse de ellos.
 *   node scripts/auditoria/.shot_123.mjs [vista...]
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const OUT = 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/shot123';
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png' };
const srv = createServer(async (q, r) => {
  const ruta = decodeURIComponent(q.url.split('?')[0]);
  let cuerpo = null;
  try { cuerpo = await readFile(join(PUB, ruta)); } catch { cuerpo = null; }
  if (!cuerpo) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
  r.end(cuerpo);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;
await mkdir(OUT, { recursive: true });

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
await pag.goto(`${BASE}/labs/sobrealimentacion-turbo-intercooler.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 60000 });

const args = process.argv.slice(2);
const K = await pag.evaluate(() => window.__labDebug.K);
const vistas = args.length ? args : K.MODES;

async function guarda(nombre) {
  const url = await pag.evaluate(() => window.__labDebug.tableroPNG);
  await writeFile(join(OUT, nombre + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('  ' + nombre + '.png');
}
// El montaje a medias, con el banco lleno.
await guarda('00_ensamble_vacio');
await pag.evaluate(() => window.__labDebug.monta());
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });

for (const m of vistas) {
  await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(220);
  await guarda(m);
  const buf = await pag.screenshot();
  await writeFile(join(OUT, 'pantalla_' + m + '.png'), buf);
}
// Casos que cambian lo que se pinta: sin intercooler, en altura, con la
// descarga pegada, y el diésel.
const casos = [
  ['sinIC_gas',   { falla: 'sinIC' },  ['intercooler','camino','mapa'], 'gas14t'],
  ['altura',      { falla: 'sano', alt: 2660 }, ['mapa','camino'], 'gas14t'],
  ['wgPegada',    { falla: 'wgPegada' }, ['respuesta','mapa'], 'gas14t'],
  ['sinIC_diesel',{ falla: 'sinIC' },  ['intercooler'], 'die20t'],
  ['v8',          { falla: 'sano' },   ['mapa','censo'], 'die66t'],
];
for (const [nom, cfg, ms, maq] of casos) {
  await pag.evaluate(k => window.__labDebug.setMaq(k), maq);
  await pag.evaluate(() => { if (!window.__labDebug.simUnlocked) window.__labDebug.monta(); });
  await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
  if (cfg.falla) await pag.evaluate(f => window.__labDebug.setFalla(f), cfg.falla);
  await pag.evaluate(c => window.__labDebug.setAmb(c), { alt: cfg.alt || 0 });
  for (const m of ms) {
    await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
    await pag.waitForTimeout(200);
    await guarda(nom + '_' + m);
  }
}
// El reto con dos instrumentos puestos, que es donde se ve si la caja crece.
await pag.evaluate(k => window.__labDebug.setMaq(k), 'gas14t');
await pag.evaluate(() => { if (!window.__labDebug.simUnlocked) window.__labDebug.monta(); });
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => { window.__labDebug.mide('tmap'); window.__labDebug.mide('banco');
  window.__labDebug.mide('manos'); });
await pag.waitForTimeout(200);
await guarda('reto_3_instrumentos');
await pag.evaluate(() => { window.__labDebug.mide('sonda3'); window.__labDebug.mide('taco');
  window.__labDebug.mide('mapa'); window.__labDebug.elige('sinIC'); window.__labDebug.entrega(); });
await pag.waitForTimeout(200);
await guarda('reto_entregado');

await nav.close(); srv.close();
console.log('\n→ ' + OUT);
