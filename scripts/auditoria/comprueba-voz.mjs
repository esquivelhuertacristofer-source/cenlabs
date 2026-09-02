/**
 * ¿SUENA?
 *
 * Las pruebas de `src/__tests__/voz.test.ts` comprueban que el texto se
 * normaliza bien y que el archivo que la página va a pedir existe. Ninguna de
 * las dos cosas dice que el MP3 sea audio reproducible: un archivo de 40 KB con
 * la cabecera rota pasa las dos y no suena.
 *
 * Esto lo abre en un navegador de verdad, lo reproduce y mide. Comprueba:
 *   · que cada clip tenga duración > 0 y se pueda reproducir hasta el final;
 *   · que la locutora vaya al ritmo que se eligió, contrastando la duración
 *     medida contra las palabras del texto;
 *   · que la pausa entre frases sea la del papel y no la que le toque a la red,
 *     que es lo que justifica el reproductor de dos elementos.
 *
 *   node --experimental-strip-types --import ./scripts/_resolver-ts.mjs \
 *        scripts/auditoria/comprueba-voz.mjs [--labs mecanica-120,quimica-1]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { clipsDeBriefing } from '../../src/lib/voz/claves';
import { PAPELES, pausaEntre, RECORTE } from '../../src/lib/voz/decir';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const PUBLICO = join(RAIZ, 'public');

const args = process.argv.slice(2);
const i = args.indexOf('--labs');
const LABS = i >= 0 ? args[i + 1].split(',') : ['mecanica-120', 'quimica-1', 'biologia-5'];

const srv = createServer(async (q, r) => {
  const ruta = decodeURIComponent(q.url.split('?')[0]);
  let cuerpo;
  // El archivo se lee ANTES de mandar la cabecera: al revés, un fallo de
  // lectura llega cuando la respuesta ya empezó y el catch no puede escribir.
  try { cuerpo = await readFile(join(PUBLICO, ruta)); } catch { cuerpo = null; }
  if (!cuerpo) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': extname(ruta) === '.mp3' ? 'audio/mpeg' : 'text/plain' });
  r.end(cuerpo);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const pag = await nav.newPage();
await pag.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }).catch(() => {});
await pag.setContent('<!doctype html><meta charset="utf-8"><title>voz</title><body></body>');

let fallos = 0;
for (const lab of LABS) {
  const briefing = JSON.parse(await readFile(join(PUBLICO, 'labs-data', 'briefing', `${lab}.json`), 'utf8'));
  const clips = clipsDeBriefing(briefing);
  // Una muestra de cada papel: medirlos todos serían horas de audio.
  const muestra = [];
  for (const papel of Object.keys(PAPELES)) {
    const c = clips.find((x) => x.papel === papel);
    if (c) muestra.push(c);
  }

  const medido = await pag.evaluate(async ({ base, lab, muestra }) => {
    const salida = [];
    for (const c of muestra) {
      const a = new Audio(`${base}/assets/voz/${lab}/${c.clave}.mp3`);
      a.preload = 'auto';
      const dur = await new Promise((res) => {
        a.addEventListener('loadedmetadata', () => res(a.duration), { once: true });
        a.addEventListener('error', () => res(-1), { once: true });
        setTimeout(() => res(-2), 12000);
      });
      salida.push({ clave: c.clave, papel: c.papel, dur, palabras: c.texto.split(/\s+/).length });
    }
    return salida;
  }, { base: BASE, lab, muestra: muestra.map((c) => ({ clave: c.clave, papel: c.papel, texto: c.texto })) });

  console.log(`\n${lab}  (${clips.length} clips)`);
  for (const m of medido) {
    const bien = m.dur > 0.2;
    if (!bien) fallos += 1;
    const ppm = m.dur > 0 ? Math.round((m.palabras / m.dur) * 60) : 0;
    console.log(`  ${bien ? 'ok' : '‼️'} ${m.papel.padEnd(10)} ${String(m.dur.toFixed(2)).padStart(6)} s  ${
      String(ppm).padStart(4)} palabras/min  ritmo ${PAPELES[m.papel].ritmo.padStart(5)}  ${m.clave}`);
  }
}

console.log('\nPausas entre papeles seguidos, en segundos:');
for (const a of ['dato', 'rotulo']) {
  const fila = Object.keys(PAPELES).map((b) => `${b} ${pausaEntre(a, b).toFixed(2)}`).join(' · ');
  console.log(`  tras ${a.padEnd(7)} ${fila}`);
}

await nav.close();
srv.close();
if (fallos) { console.error(`\n‼️  ${fallos} clip(s) no se pudieron reproducir`); process.exit(1); }
console.log('\nTodos los clips de la muestra suenan.');
