/**
 * Capturas del pizarrón de d6-12, vista por vista. Las colisiones de trazado
 * —una banda de veredicto encima de las cifras del eje, una tabla cortada por
 * el borde, el banco 3D ilegible— no las ve ninguna prueba numérica: se ven
 * mirando. Esto saca el lienzo del pizarrón A TAMAÑO COMPLETO, que es donde se
 * distingue si algo se solapa, y además la pantalla entera.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const OUT = process.argv[2] || join(RAIZ, '.capturas');
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png' };

await mkdir(OUT, { recursive: true });
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

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
await pag.goto(`${BASE}/labs/common-rail-precalentamiento.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 90000 });

// El lienzo del pizarrón se saca por su propio data URL: capturar la pantalla
// lo da en escorzo y a media resolución, que es justo donde una colisión de
// 6 px se vuelve invisible.
async function tablero(nombre) {
  const url = await pag.evaluate(() => {
    for (const c of document.querySelectorAll('canvas'))
      if (c.width === 1024 && c.height === 768) return c.toDataURL('image/png');
    // El lienzo del pizarrón no está en el DOM: se busca por la textura.
    return window.__labDebug.tableroPNG || null;
  });
  if (!url) return false;
  writeFileSync(join(OUT, nombre + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  return true;
}

const MODES = await pag.evaluate(() => window.__labDebug.K.MODES);
for (const m of MODES) {
  await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(300);
  const hubo = await tablero('122_' + m);
  await pag.screenshot({ path: join(OUT, '122_' + m + '_pantalla.png') });
  console.log(`${m}: pizarrón ${hubo ? 'ok' : 'NO SE PUDO SACAR'}`);
}
// Y un par de estados que cambian el trazado: la avería más aparatosa, el motor
// de ocho cilindros —que es el que más ensancha el banco y las tablas— y el
// vehículo de seis con sus bujías lentas.
await pag.evaluate(() => { window.__labDebug.setMode('retornos');
  window.__labDebug.setFalla('reguladorPegado'); });
await pag.waitForTimeout(300);
await tablero('122_retornos_regulador');
await pag.evaluate(() => window.__labDebug.setMaquina('v8_66'));
await pag.waitForTimeout(300);
await tablero('122_retornos_v8');
await pag.screenshot({ path: join(OUT, '122_v8_pantalla.png') });
await pag.evaluate(() => { window.__labDebug.setMaquina('d30_06');
  window.__labDebug.setFalla('bujiasLentas'); window.__labDebug.setTemp(-20);
  window.__labDebug.setMode('bujias'); });
await pag.waitForTimeout(300);
await tablero('122_bujias_d30');
await pag.evaluate(() => window.__labDebug.setMode('arranque'));
await pag.waitForTimeout(300);
await tablero('122_arranque_d30');
await pag.evaluate(() => window.__labDebug.setMode('censo'));
await pag.waitForTimeout(300);
await tablero('122_censo_d30');
await pag.evaluate(() => { window.__labDebug.setMode('reto');
  window.__labDebug.armaCaso('reguladorPegado', -20);
  for (const k of ['escaner','manometro','probeta','pinza','arranque']) window.__labDebug.mide(k); });
await pag.waitForTimeout(400);
await tablero('122_reto_medido');
await pag.screenshot({ path: join(OUT, '122_reto_pantalla.png') });

await nav.close();
srv.close();
console.log('capturas en ' + OUT);
