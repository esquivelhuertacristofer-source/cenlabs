/**
 * Saca el LIENZO del pizarrón a 1024×768 por `__labDebug.tableroPNG`, no la
 * pantalla en escorzo: los solapes de rótulos, bandas y leyendas sólo se ven a
 * tamaño real, y ninguna prueba numérica puede enterarse de ellos.
 *   node scripts/auditoria/.shot_124.mjs [vista...]
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
await pag.goto(`${BASE}/labs/dinamometro-par-potencia-correccion.html`, { waitUntil: 'load', timeout: 90000 });
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
// Casos que cambian lo que se pinta: el turbo en Toluca, la estacion rota, la
// primera marcha, la regla del quince y el diesel.
const casos = [
  ['toluca_atm',  { sitio: 'toluca' },                 ['norma','cadena'], 'na16'],
  ['toluca_turbo',{ sitio: 'toluca' },                 ['norma','cadena'], 'turbo14'],
  ['sinEstacion', { sitio: 'toluca', falla: 'sinEstacion' }, ['cadena','censo'], 'turbo14'],
  ['primera',     { marcha: 0 },                       ['perdidas','cadena'], 'v8na'],
  ['regla15',     { perdidas: 'regla15' },             ['cadena','barrido'], 'na16'],
  ['freno',       { banco: 'freno' },                  ['cadena','perdidas'], 'na16'],
  ['j607',        { norma: 'j607' },                   ['norma'], 'v8na'],
  ['censo_tdi',   {},                                  ['censo'], 'tdi20'],
];
for (const [nom, cfg, ms, maq] of casos) {
  await pag.evaluate(k => window.__labDebug.setMaq(k), maq);
  await pag.evaluate(() => { if (!window.__labDebug.simUnlocked) window.__labDebug.monta(); });
  await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
  await pag.evaluate(f => window.__labDebug.setFalla(f), cfg.falla || 'sano');
  await pag.evaluate(c => window.__labDebug.setCfg(c), {
    sitio: cfg.sitio || 'mar25', banco: cfg.banco || 'inercia',
    norma: cfg.norma || 'j1349', perdidas: cfg.perdidas || 'coastdown',
    marcha: cfg.marcha === undefined ? null : cfg.marcha,
    pasada: cfg.pasada || 1 });
  for (const m of ms) {
    await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
    await pag.waitForTimeout(220);
    await guarda(nom + '_' + m);
  }
}
// El reto con instrumentos puestos, que es donde se ve si la caja crece.
await pag.evaluate(k => window.__labDebug.setMaq(k), 'na16');
await pag.evaluate(() => { if (!window.__labDebug.simUnlocked) window.__labDebug.monta(); });
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => window.__labDebug.armaCaso('sinVentilador',
  { maq: 'na16', sitio: 'cdmx', norma: 'j1349', banco: 'inercia', marcha: 2 }));
await pag.evaluate(() => { window.__labDebug.mide('meteo'); window.__labDebug.mide('coast');
  window.__labDebug.mide('repite'); });
await pag.waitForTimeout(220);
await guarda('reto_3_instrumentos');
await pag.evaluate(() => { window.__labDebug.mide('rodillo'); window.__labDebug.mide('otro');
  window.__labDebug.elige('sinVentilador'); window.__labDebug.entrega(); });
await pag.waitForTimeout(220);
await guarda('reto_entregado');

await nav.close(); srv.close();
console.log('\n→ ' + OUT);
