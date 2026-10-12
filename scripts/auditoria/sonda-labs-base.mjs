/**
 * Sonda de los labs base (física, química, biología, matemáticas).
 * Requiere `npx next dev -p 3011` corriendo (usa la ruta /dev/lab/<id>).
 *
 *   node scripts/auditoria/sonda-labs-base.mjs <dirSalida> [ids,separados] [ancho]x[alto] [msEspera]
 *
 * Por cada lab: abre, pulsa «Iniciar Práctica», espera, recoge errores de consola
 * (pageerror + console.error), cuenta los <canvas> y guarda <id>.png. Escribe
 * res.json con todo. Sin ids recorre los 40.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright')); }

const [out = 'sonda-out', idsArg, tam = '1600x900', espera = '9000'] = process.argv.slice(2);
const [W, H] = tam.split('x').map(Number);
mkdirSync(out, { recursive: true });
const ids = idsArg ? idsArg.split(',') : ['fisica', 'quimica', 'biologia', 'matematicas']
  .flatMap((m) => Array.from({ length: 10 }, (_, i) => `${m}-${i + 1}`));
const RUIDO = /metadataBase|missing "sizes"|Largest Contentful|THREE\.Clock|PCFSoftShadowMap|powerPreference|No available adapters|Download the React DevTools/;

const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await nav.newContext({ viewport: { width: W, height: H } });
const res = {};
for (const id of ids) {
  const pag = await ctx.newPage();
  const errs = [];
  pag.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 300)));
  pag.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 300)); });
  try {
    await pag.goto(`http://localhost:3011/dev/lab/${id}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    try { await pag.getByText('Iniciar Práctica', { exact: false }).first().click({ timeout: 30000 }); }
    catch { errs.push('NOTE sin botón Iniciar Práctica'); }
    await pag.waitForTimeout(Number(espera));
    const canvases = await pag.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`;
    }));
    await pag.screenshot({ path: join(out, id + '.png') });
    res[id] = { canvases, errs: [...new Set(errs)].filter((e) => !RUIDO.test(e)).slice(0, 25) };
  } catch (e) { res[id] = { fatal: String(e).slice(0, 300), errs }; }
  console.log(id, JSON.stringify(res[id]));
  await pag.close();
}
writeFileSync(join(out, 'res.json'), JSON.stringify(res, null, 1));
await nav.close();
