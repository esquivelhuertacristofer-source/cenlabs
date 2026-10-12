/**
 * Fotografía la vitrina del kit 3D (/dev/muestrario-3d). Requiere el servidor de
 * desarrollo en el puerto 3011 (`npx next dev -p 3011`).
 *
 *   node scripts/auditoria/muestrario-kit.mjs <dirSalida> [secciones,separadas] [ancho]x[alto] [msEspera] [calidades]
 *
 * Por cada sección y calidad: abre, espera a que la escena declare `data-listo`,
 * guarda <seccion>-<calidad>.png y registra:
 *   - errores de consola (pageerror, console.error/warning),
 *   - CUALQUIER petición de red a un host que no sea localhost (la plataforma
 *     tiene que funcionar sin internet),
 *   - normales nulas detectadas en la escena (window.__kit.salud()).
 * Escribe res.json con todo y sale con código 1 si hubo peticiones externas.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright')); }

const TODAS = ['quimica', 'bureta', 'calor', 'instrumentos', 'mecanica', 'matematicas', 'campo', 'layout'];
const [out = 'muestrario-out', secArg, tam = '1600x900', espera = '6000', calArg = 'alta,media'] = process.argv.slice(2);
const [W, H] = tam.split('x').map(Number);
mkdirSync(out, { recursive: true });
const secciones = secArg && secArg !== 'todas' ? secArg.split(',') : TODAS;
const calidades = calArg.split(',');
const RUIDO = /metadataBase|missing "sizes"|Largest Contentful|THREE\.Clock|powerPreference|No available adapters|Download the React DevTools|GPU stall|ReadPixels|Fast Refresh|\[HMR\]/;

const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const res = {};
let externas = 0;
for (const cal of calidades) {
  for (const s of secciones) {
    const pag = await ctx.newPage();
    const errs = [];
    const red = [];
    pag.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 300)));
    pag.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 300)); });
    pag.on('request', (r) => {
      const u = new URL(r.url());
      if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) red.push(r.url());
    });
    const clave = `${s}-${cal}`;
    try {
      const [sec, pieza] = s.split('.');
      await pag.goto(`http://localhost:3011/dev/muestrario-3d?foto=1&s=${sec}&calidad=${cal}${pieza ? '&p=' + pieza : ''}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await pag.waitForSelector('[data-listo="1"]', { timeout: 120000 }).catch(() => errs.push('NOTE sin data-listo'));
      await pag.waitForTimeout(Number(espera));
      const salud = await pag.evaluate(() => (window.__kit && window.__kit.salud) ? window.__kit.salud() : null);
      await pag.screenshot({ path: join(out, clave + '.png'), timeout: 180000 });
      res[clave] = { salud, red: [...new Set(red)], errs: [...new Set(errs)].filter((e) => !RUIDO.test(e)).slice(0, 25) };
      externas += res[clave].red.length;
    } catch (e) { res[clave] = { fatal: String(e).slice(0, 300), errs, red }; }
    console.log(clave, JSON.stringify(res[clave]));
    await pag.close();
  }
}
writeFileSync(join(out, 'res.json'), JSON.stringify(res, null, 1));
await nav.close();
if (externas > 0) { console.error(`PETICIONES EXTERNAS: ${externas}`); process.exit(1); }
