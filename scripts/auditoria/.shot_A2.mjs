/**
 * Saca el LIENZO del pizarrón a 1024×768 por `__labDebug.tableroPNG`, no la
 * pantalla en escorzo: los solapes de rótulos, bandas y leyendas sólo se ven a
 * tamaño real, y ninguna prueba numérica puede enterarse de ellos.
 *   node scripts/auditoria/.shot_A2.mjs [vista...]
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const OUT = 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/shotA2';
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
await pag.goto(`${BASE}/labs/carga-alternador-balance.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 60000 });

const args = process.argv.slice(2);
const K = await pag.evaluate(() => window.__labDebug.K);
const vistas = args.length ? args : K.MODES;

async function guarda(nombre) {
  const url = await pag.evaluate(() => window.__labDebug.tableroPNG);
  await writeFile(join(OUT, nombre + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('  ' + nombre + '.png');
}
async function pantalla(nombre) {
  await pag.screenshot({ path: join(OUT, nombre + '.png') });
  console.log('  ' + nombre + '.png (pantalla)');
}
// Y el vano de cerca: en la pantalla entera las piezas ocupan trescientos
// píxeles y no se ve si un cable llega a donde dice que llega.
async function cerca(nombre) {
  await pag.screenshot({ path: join(OUT, nombre + '.png'),
    clip: { x: 830, y: 400, width: 640, height: 480 } });
  console.log('  ' + nombre + '.png (vano)');
}

await guarda('00_ensamble_vacio');
await pantalla('00_pantalla_ensamble');
await pag.screenshot({ path: join(OUT, '00_banco_cerca.png'),
  clip: { x: 700, y: 460, width: 720, height: 420 } });
await pag.evaluate(() => window.__labDebug.monta());
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
await pag.waitForTimeout(400);
await pantalla('01_pantalla_montado');
await cerca('02_vano_cerca');

async function serie(nom, cfg, ms) {
  await pag.evaluate(v => window.__labDebug.setVeh(v), cfg.veh || 'util16');
  await pag.evaluate(() => { if (!window.__labDebug.simUnlocked) window.__labDebug.monta(); });
  await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
  await pag.evaluate(c => {
    window.__labDebug.setSit(c.sit || 'diaCarretera');
    window.__labDebug.setRpm(c.rpm === undefined ? 'auto' : c.rpm);
    window.__labDebug.setFalla(c.falla || 'sano');
    (c.on || []).forEach(k => window.__labDebug.toggleCarga(k));
  }, cfg);
  for (const m of ms) {
    await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
    await pag.waitForTimeout(240);
    await guarda(nom + '_' + m);
  }
}

await serie('10_sano', {}, vistas.filter(m => m !== 'reto'));
await serie('20_atasco', { sit: 'atasco' }, ['curva', 'balance', 'banco', 'censo']);
await serie('30_cable', { falla: 'cableCarga', sit: 'nocheLluvia' }, ['caidas', 'banco']);
await serie('40_furgo', { veh: 'furgo', falla: 'cableCarga' }, ['caidas', 'censo']);
await serie('50_escobillas', { veh: 'util16', falla: 'escobillas', sit: 'atasco' },
  ['curva', 'censo']);
await serie('60_diodo', { falla: 'diodoAbierto', sit: 'nocheLluvia' }, ['banco', 'censo']);
await serie('70_correa', { falla: 'correa', sit: 'atasco' }, ['curva', 'banco']);
await serie('80_veranorpm', { sit: 'veranoClima', rpm: 3000 }, ['balance', 'censo']);

// El reto: virgen, con dos condiciones miradas y entregado.
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => window.__labDebug.armaCaso('escobillas', { veh: 'util16' }));
await pag.waitForTimeout(240);
await guarda('90_reto_virgen');
await pantalla('91_pantalla_reto');
await pag.evaluate(() => { window.__labDebug.setSit('atasco'); });
await pag.waitForTimeout(240);
await guarda('92_reto_dos_condiciones');
await pag.evaluate(() => { window.__labDebug.elige('escobillas'); window.__labDebug.entrega(); });
await pag.waitForTimeout(240);
await guarda('93_reto_entregado');
// Y uno entregado SIN haberlo cerrado, que es el otro veredicto.
await pag.evaluate(() => window.__labDebug.armaCaso('reguladorBajo', { veh: 'turismo' }));
await pag.evaluate(() => { window.__labDebug.setSit('atasco'); });
await pag.waitForTimeout(200);
await pag.evaluate(() => { window.__labDebug.elige('reguladorBajo'); window.__labDebug.entrega(); });
await pag.waitForTimeout(240);
await guarda('94_reto_sin_cerrar');

await nav.close(); srv.close();
console.log('\n→ ' + OUT);
