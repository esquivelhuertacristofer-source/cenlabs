// Audita las portadas EN SU SITIO: el recorte que de verdad ve el alumno no es
// el fotograma 720x480 sino la franja del 35 % de la ficha, que object-cover
// recorta distinto segun el ancho de la ventana. Reproduce SpotlightCard con CSS
// plano —la ruta /alumno real esta detras de sesion y no se toca— y saca hojas
// de contacto a tamaño de pantalla.
//
//   node scripts/portadas/maqueta-fichas.mjs [dir-portadas] [ancho=1600] [porHoja=6]
//                                            [--solo 43,64] [--oscuro]
//
// Las hojas salen en scripts/portadas/.salida/fichas-N.png.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');
const DEPURA = path.join(AQUI, '.salida');

const buscarPlaywright = () => {
  const candidatos = [
    process.env.PLAYWRIGHT_DIR,
    path.join(process.env.APPDATA ?? '', 'npm/node_modules/playwright/'),
    '/usr/lib/node_modules/playwright/',
  ].filter(Boolean);
  for (const dir of candidatos) {
    try { return createRequire(dir.replace(/\\/g, '/'))('playwright'); } catch { /* siguiente */ }
  }
  console.error('No encuentro Playwright; exporta PLAYWRIGHT_DIR.');
  process.exit(1);
};
const { chromium } = buscarPlaywright();

// Los posicionales hay que separarlos a mano, y NO basta con descartar lo que
// empieza por «--»: el valor de --solo (p. ej. «64,71») no lo lleva, y colandose
// como posicional[0] se convertia en el directorio de portadas — la maqueta salia
// entera sin imagenes y con toda la pinta de que las portadas estaban rotas.
const CON_VALOR = new Set(['--solo']);
const posicional = [];
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { if (CON_VALOR.has(a)) i++; continue; }
  posicional.push(a);
}
const dirPortadas = path.resolve(posicional[0] ?? path.join(RAIZ, 'public/images/mecanica'));
const ancho = Number(posicional[1] ?? 1600);
const porHoja = Number(posicional[2] ?? 6);

const campo = (txt, k) => {
  const m = txt.match(new RegExp(`${k}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? m[1].replace(/\\"/g, '"') : '';
};

const labs = fs.readdirSync(path.join(RAIZ, 'src/labs'))
  .filter((d) => /^mecanica-\d+$/.test(d))
  .map((d) => {
    const txt = fs.readFileSync(path.join(RAIZ, 'src/labs', d, 'catalogo.ts'), 'utf8');
    return {
      id: d, n: Number(d.split('-')[1]),
      modulo: campo(txt, 'modulo'), titulo: campo(txt, 'titulo'),
      teoria: campo(txt, 'teoria'), duracion: campo(txt, 'duracion'),
      estado: campo(txt, 'estado'),
    };
  })
  .filter((l) => l.estado === 'activo')
  .sort((a, b) => a.n - b.n);

// --solo 64,65: para cotejar un retoque sin volver a montar las 112.
const iSolo = process.argv.indexOf('--solo');
const solo = iSolo > 0 ? new Set(process.argv[iSolo + 1].split(',').map(Number)) : null;
const lista = solo ? labs.filter((l) => solo.has(l.n)) : labs;

// --oscuro: el velo que funde el borde de la portada con la ficha cambia de
// blanco a #0A1121, y una portada de fondo claro puede cortarse ahi en seco.
const tema = process.argv.includes('--oscuro') ? 'oscuro' : 'claro';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Las portadas se meten como data URI para que la maqueta funcione sin servidor.
// Una que falte deja un hueco blanco indistinguible de una portada mal encuadrada,
// asi que se lleva la cuenta y se avisa al final.
const faltan = [];
const uri = (n) => {
  const f = path.join(dirPortadas, `prac_${n}.webp`);
  if (!fs.existsSync(f)) { faltan.push(n); return ''; }
  return `data:image/webp;base64,${fs.readFileSync(f).toString('base64')}`;
};

const ficha = (l) => `
<div class="ficha">
  <div class="cuerpo">
    <div>
      <span class="chip"><i></i>${esc(l.modulo)} • ID: ${esc(l.id.toUpperCase())}</span>
      <h3>${esc(l.titulo)}</h3>
      <p>${esc(l.teoria)}</p>
      <div class="pies">
        <div class="pie">🕑 ${esc(l.duracion)}</div>
        <div class="pie acento">◎ Simulador 3D Interactivo</div>
      </div>
    </div>
    <div class="boton">▶</div>
  </div>
  <div class="portada"><div class="velo"></div><img src="${uri(l.n)}" alt=""></div>
  <div class="sello">${l.n}</div>
</div>`;

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,'Segoe UI',sans-serif}
body{padding:24px;background:#f8fafc}
body.oscuro{background:#060B14}
/* SpotlightCard lleva md:col-span-2 dentro de un grid de dos columnas: ocupa la
   fila entera. Una ficha por renglon, no dos. */
.rejilla{display:grid;grid-template-columns:1fr;gap:32px;max-width:1552px;margin:0 auto}
.ficha{position:relative;background:#fff;border:1px solid #e2e8f0;border-left:8px solid #2A9D8F;
  border-radius:32px;overflow:hidden;box-shadow:0 8px 30px rgb(0 0 0/.04);display:flex}
.oscuro .ficha{background:#0A1121;border-color:#1e293b;border-left-color:#2A9D8F}
.cuerpo{position:relative;z-index:20;width:100%;padding:40px;padding-right:35%;
  display:flex;align-items:center;justify-content:space-between;gap:24px}
.chip{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:#effaf7;color:#2A9D8F;
  border-radius:8px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;
  margin-bottom:16px;border:1px solid rgb(42 157 143/.2)}
.oscuro .chip{background:rgb(42 157 143/.2);color:#4FD1C5}
.chip i{width:8px;height:8px;border-radius:50%;background:#2A9D8F;display:block}
h3{font-size:30px;font-weight:900;color:#023047;line-height:1.15;margin-bottom:16px}
.oscuro h3{color:#fff}
p{color:#475569;font-weight:500;line-height:1.6;margin-bottom:32px;font-size:16px}
.oscuro p{color:#94a3b8}
.pies{display:flex;flex-wrap:wrap;gap:16px}
.pie{display:flex;align-items:center;gap:8px;font-weight:700;color:#475569;background:#f8fafc;
  padding:10px 20px;border-radius:12px;border:1px solid #f1f5f9;font-size:15px}
.oscuro .pie{color:#cbd5e1;background:rgb(30 41 59/.5);border-color:#334155}
.pie.acento{color:#023047;background:#effaf7;border-color:rgb(42 157 143/.2)}
.oscuro .pie.acento{color:#4FD1C5;background:rgb(42 157 143/.1)}
.boton{width:64px;height:64px;border-radius:50%;background:#2A9D8F;color:#fff;flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 12px 24px rgb(0 0 0/.15)}
.portada{position:absolute;top:0;bottom:0;right:0;width:35%;z-index:10}
.velo{position:absolute;inset:0;z-index:10;background:linear-gradient(to right,#fff,transparent,transparent)}
.oscuro .velo{background:linear-gradient(to right,#0A1121,transparent,transparent)}
.portada img{width:100%;height:100%;object-fit:cover;object-position:center;opacity:.85}
.sello{position:absolute;left:0;top:0;z-index:40;background:#023047;color:#fff;font-weight:900;
  font-size:13px;padding:3px 9px;border-bottom-right-radius:10px}
`;

fs.mkdirSync(DEPURA, { recursive: true });
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: 1 });

let hoja = 0;
for (let i = 0; i < lista.length; i += porHoja) {
  const lote = lista.slice(i, i + porHoja);
  const html = `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
    <body class="${tema}"><div class="rejilla">${lote.map(ficha).join('')}</div></body>`;
  const tmp = path.join(DEPURA, '_maqueta.html');
  fs.writeFileSync(tmp, html);
  await pag.goto(pathToFileURL(tmp).href);
  await pag.waitForTimeout(250);
  hoja++;
  // El tema va en el nombre: revisar claro y oscuro es la misma orden dos veces,
  // y sin esto la segunda pisaba la hoja de la primera.
  const salida = path.join(DEPURA, `fichas-${tema}-${hoja}.png`);
  await pag.screenshot({ path: salida, fullPage: true });
  console.log(`   ${path.relative(RAIZ, salida)}  (${lote[0].n}–${lote[lote.length - 1].n})`);
  fs.unlinkSync(tmp);
}
await nav.close();

if (faltan.length) {
  console.error(`\n⚠ sin portada en ${path.relative(RAIZ, dirPortadas)}: ${faltan.join(', ')}`);
  console.error('  (generalas con: node scripts/portadas/capturar-portadas.mjs --solo ' + faltan.join(',') + ')');
  process.exitCode = 1;
}
