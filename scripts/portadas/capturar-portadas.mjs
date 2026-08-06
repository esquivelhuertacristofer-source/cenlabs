// Genera la portada de cada practica de mecanica capturando su PROPIO simulador
// 3D, no arte de archivo. Sirve public/ con un servidor estatico minimo, abre
// cada /labs/<slug>.html en Chromium con viewport 3:2 (el mismo formato que la
// franja de la tarjeta, asi el object-cover no recorta nada), oculta todo el HUD
// para dejar solo la escena, REENCUADRA la camara sobre la maquina (ver
// encuadre.mjs) y reencodea a WebP dentro del propio navegador con toDataURL —
// asi no hace falta sharp ni ninguna dependencia nueva en el proyecto.
//
// Playwright NO es dependencia del proyecto (no queremos arrastrar Chromium al
// build de Cloudflare): se resuelve desde la instalacion global. Si la tuya esta
// en otro sitio, exporta PLAYWRIGHT_DIR con la ruta de su carpeta node_modules.
//
//   npm run gen:portadas -- [--solo 43,64]
//   node scripts/portadas/capturar-portadas.mjs [--desde N] [--hasta N]
//                              [--solo 1,13,45] [--ancho 720] [--calidad 0.72]
//                              [--margen 1.06] [--margen-v 1.14]
//                              [--cobertura 0.92] [--subir 0]
//                              [--salida <dir>] [--png-tambien] [--sin-reencuadre]
//                              [--forzar-banco] [--sin-ajustes]
//
// Sin argumentos rehace las 112 portadas de public/images/mecanica tal como estan
// commiteadas. Para una practica nueva basta con `--solo N`.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { gancho, rutaOrbit, REENCUADRE, LIMPIAR, FIJAR, DERIVA } from './encuadre.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');
const PUBLICO = path.join(RAIZ, 'public');
// Los artefactos de depuracion (informe, PNG sin comprimir) van aparte: la unica
// salida que se commitea son los .webp.
const DEPURA = path.join(AQUI, '.salida');

// Playwright vive fuera del proyecto. createRequire necesita un directorio que
// CONTENGA node_modules, de ahi el sufijo.
const buscarPlaywright = () => {
  const candidatos = [
    process.env.PLAYWRIGHT_DIR,
    path.join(process.env.APPDATA ?? '', 'npm/node_modules/playwright/'),
    '/usr/lib/node_modules/playwright/',
  ].filter(Boolean);
  for (const dir of candidatos) {
    try { return createRequire(dir.replace(/\\/g, '/'))('playwright'); } catch { /* siguiente */ }
  }
  try { return createRequire(path.join(RAIZ, 'package.json'))('playwright'); } catch { /* nada */ }
  console.error('No encuentro Playwright. Instalalo global (npm i -g playwright && npx playwright install chromium)\n'
    + 'o exporta PLAYWRIGHT_DIR con la carpeta que contiene su node_modules.');
  process.exit(1);
};
const { chromium } = buscarPlaywright();

const arg = (n, d) => {
  const i = process.argv.indexOf('--' + n);
  return i < 0 ? d : process.argv[i + 1];
};
const DESDE = Number(arg('desde', 1));
const HASTA = Number(arg('hasta', 999));
// Lista suelta para muestreos: --solo 1,13,45,95
const SOLO = arg('solo') ? new Set(arg('solo').split(',').map(Number)) : null;
const ANCHO = Number(arg('ancho', 720));
const ALTO = Math.round(ANCHO * 2 / 3);
const CALIDAD = Number(arg('calidad', 0.72));
const SALIDA = arg('salida', path.join(PUBLICO, 'images/mecanica'));
const PNG_TAMBIEN = process.argv.includes('--png-tambien');
const SIN_REENCUADRE = process.argv.includes('--sin-reencuadre');
// Aire alrededor de la caja del sujeto, por eje (1 = toca el borde). Se pide mas
// aire arriba y abajo porque la franja de la tarjeta puede ser mas apaisada que
// 3:2 y entonces object-cover recorta por ahi.
const MARGEN = Number(arg('margen', 1.06));
const MARGEN_V = Number(arg('margen-v', 1.14));
// Fraccion del "peso" (tamaño) del sujeto que debe entrar en cuadro. Por debajo
// de 1 se dejan fuera accesorios sueltos y lejanos que abririan el plano sin
// aportar nada reconocible a 720 px.
const COBERTURA = Number(arg('cobertura', 0.92));
// Baja el sujeto en el cuadro, en fracciones de su alto (composicion, no medida).
const SUBIR = Number(arg('subir', 0));
// Deja el banco de trabajo FUERA de la medida aunque encima solo haya dos
// aparatos. Sin esto, en los labs de montaje minimo la losa gana el cuadro y la
// portada es una mesa vacia. Ver el comentario de `forzarBanco` en encuadre.mjs.
const FORZAR_BANCO = process.argv.includes('--forzar-banco');

// Excepciones POR LAB. El barrido general acierta en 107 de 112; estos cinco
// montan la practica entera con dos aparatos sobre el banco, y el filtro que
// descarta el pedestal exige >= 3 piezas encima, asi que nunca se disparaba y la
// portada salia siendo una mesa vacia. Aflojarlo para todos no vale: reaparece el
// fallo medido en los labs 6 y 11 (encuadraban 2 piezas de 22 y 5 de 42).
// Se conserva aqui para que volver a generar las portadas de un maquetado
// reproduzca exactamente el juego que esta commiteado.
const AJUSTES = {
  43: { forzarBanco: true },   // termopar / RTD / infrarrojo
  64: { forzarBanco: true },   // transitorio RC
  65: { forzarBanco: true },   // transitorio RL
  67: { forzarBanco: true },   // fasores y desfase
  68: { forzarBanco: true },   // impedancias RLC
};
const SIN_AJUSTES = process.argv.includes('--sin-ajustes');

// Viewport con la misma proporcion que la salida: asi el aspect que ve three.js
// es el del encuadre final y no hay que recortar despues.
const VIEWPORT_W = 1200, VIEWPORT_H = 800;
// Margen para que la escena respire antes de que el bucle de render se estabilice
// (env map PMREM, sombras, bloom y las texturas de canvas tardan unos frames).
const ASENTAR_MS = 2600;

// ── Lista de labs ───────────────────────────────────────────────────────────
const DIRLABS = path.join(RAIZ, 'src/labs');
const labs = [];
for (const d of fs.readdirSync(DIRLABS)
  .filter((x) => x.startsWith('mecanica-'))
  .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))) {
  const f = path.join(DIRLABS, d, 'catalogo.ts');
  if (!fs.existsSync(f)) continue;
  const m = fs.readFileSync(f, 'utf8').match(/simuladorHtml:\s*["']([^"']+)["']/);
  if (!m) { console.log('  (sin simuladorHtml)', d); continue; }
  if (!fs.existsSync(path.join(PUBLICO, m[1])) ) { console.log('  (falta el html)', d, m[1]); continue; }
  const n = Number(d.split('-')[1]);
  if (SOLO) { if (!SOLO.has(n)) continue; }
  else if (n < DESDE || n > HASTA) continue;
  labs.push({ id: d, n, ruta: m[1] });
}

// ── Servidor estatico de public/ ────────────────────────────────────────────
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

const servidor = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(PUBLICO, rel);
  if (!f.startsWith(PUBLICO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); res.end('no'); return;
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const PUERTO = servidor.address().port;
console.log(`servidor estatico en :${PUERTO} · ${labs.length} labs · ${ANCHO}x${ALTO} q${CALIDAD}`
  + (SIN_REENCUADRE ? ' · sin reencuadre' : ` · margen ${MARGEN}/${MARGEN_V} cobertura ${COBERTURA}`));

fs.mkdirSync(SALIDA, { recursive: true });
fs.mkdirSync(DEPURA, { recursive: true });

// ── Navegador ───────────────────────────────────────────────────────────────
const navegador = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const contexto = await navegador.newContext({
  viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
if (!SIN_REENCUADRE) {
  await contexto.addInitScript(gancho());
  await rutaOrbit(contexto);
}

// Pagina auxiliar: recibe el PNG y devuelve el WebP ya reescalado. Se reutiliza
// para los 112 para no pagar el arranque de una pagina por lab.
const recodificador = await contexto.newPage();
await recodificador.goto('about:blank');

const informe = [];
let fallos = 0;

// Cola en vez de bucle simple para poder reencolar: three.js baja de jsdelivr y
// un tropiezo de red tumbaba el lab entero (medido en mecanica-71, que a la
// segunda salio a la primera). Un solo reintento, al final de la cola.
const cola = labs.map((lab) => ({ lab, intento: 0 }));
while (cola.length) {
  const tarea = cola.shift();
  const lab = tarea.lab;
  const pagina = await contexto.newPage();
  const errores = [];
  // Con la pila: sin ella un "cannot read properties of undefined" no dice nada.
  pagina.on('pageerror', (e) => errores.push((e.stack || String(e)).split('\n').slice(0, 4).join(' ⏎ ').slice(0, 400)));
  try {
    // 'load' espera a TODOS los recursos, y three.js viene de jsdelivr: cinco labs
    // del barrido se cayeron por ahi con timeout aunque la escena iba a dibujarse
    // igual. Basta con el documento; la señal de verdad es el canvas de mas abajo.
    await pagina.goto(`http://127.0.0.1:${PUERTO}${lab.ruta}`, {
      waitUntil: 'domcontentloaded', timeout: 90000,
    });
    // El canvas lo crea three.js, no el HTML: esperar a que exista y tenga area.
    // Ojo con la firma: waitForFunction(fn, arg, opciones) — pasar las opciones
    // en el 2.º hueco las trata como `arg` y deja el timeout por defecto.
    await pagina.waitForFunction(() => {
      const c = document.querySelector('canvas');
      return !!c && c.width > 100 && c.height > 100;
    }, null, { timeout: 45000 });
    await pagina.waitForTimeout(ASENTAR_MS);

    // Los labs de ensamble arrancan DESARMADOS: sin esto la portada retrata el
    // kit disperso sobre el banco, no la maquina. Hay dos familias y no comparten
    // API — los del molde E+S publican __labDebug.progress().simUnlocked y un
    // boton de montaje automatico; los cinco legados (1-5) publican __test con un
    // booleano *Installed por pieza y se montan con setAutoMode(true) + start().
    const armado = await pagina.evaluate(() => {
      const d = window.__labDebug;
      let bloqueado = false;
      try {
        const p = d && typeof d.progress === 'function' ? d.progress() : null;
        if (p && p.simUnlocked === false) bloqueado = true;
        else if (d && d.simUnlocked === false) bloqueado = true;
      } catch { /* el lab no expone progreso: no es E+S */ }
      if (bloqueado) {
        // En E+S la seccion de ensamble es el modo ①, asi que el primer btnAuto*
        // del documento es siempre el de montaje (no el de un recorrido guiado).
        const b = document.querySelector('button[id^="btnAuto"]');
        if (!b) return { es: true, via: 'E+S', boton: null };
        b.click();
        return { es: true, via: 'E+S', boton: b.id };
      }
      const t = window.__test;
      if (t && typeof t.state === 'function') {
        let s = null;
        try { s = t.state(); } catch { /* sin estado: no es de ensamble */ }
        const llaves = s ? Object.keys(s).filter((k) => /Installed$/.test(k)) : [];
        if (llaves.length && llaves.some((k) => s[k] === false)) {
          // El orden importa: cada paso encadena el siguiente con un setTimeout
          // que solo se programa si autoMode ya estaba puesto al entrar en el paso.
          try { t.setAutoMode(true); } catch { /* ignorar */ }
          try { t.start(); } catch { /* ignorar */ }
          return { es: true, via: '__test', piezas: llaves.length };
        }
      }
      return { es: false };
    });
    if (armado.via === 'E+S' && armado.boton) {
      await pagina.waitForFunction(() => {
        const d = window.__labDebug;
        try {
          const p = typeof d.progress === 'function' ? d.progress() : null;
          if (p && 'simUnlocked' in p) return p.simUnlocked === true;
          if ('simUnlocked' in d) return d.simUnlocked === true;
        } catch { return true; }
        return true;
      }, null, { timeout: 150000 }).catch(() => { armado.agotado = true; });
      await pagina.waitForTimeout(1400); // que rematen los tweens de colocacion
    } else if (armado.via === '__test') {
      await pagina.waitForFunction(() => {
        try {
          const s = window.__test.state();
          return Object.keys(s).filter((k) => /Installed$/.test(k)).every((k) => s[k] === true);
        } catch { return true; }
      }, null, { timeout: 150000 }).catch(() => { armado.agotado = true; });
      await pagina.waitForTimeout(2200); // los legados animan el viaje de la pieza
    }

    // Dejar solo la escena: se oculta todo hermano del contenedor del canvas.
    // Es generico a proposito — los nombres de clase del HUD cambian por lab.
    const oculto = await pagina.evaluate(() => {
      const c = document.querySelector('canvas');
      let cont = c;
      while (cont.parentElement && cont.parentElement !== document.body) cont = cont.parentElement;
      let n = 0;
      for (const el of Array.from(document.body.children)) {
        if (el !== cont) { el.style.setProperty('display', 'none', 'important'); n++; }
      }
      return { ocultos: n, id: cont.id || cont.tagName.toLowerCase() };
    });
    // Que el lab reaccione al resize del canvas antes de medir la camara.
    await pagina.waitForTimeout(450);

    // Encuadre de portada a nivel de ESCENA (no recorte 2D): se oculta la pizarra
    // teorica y las etiquetas flotantes, se mide la maquina y se coloca la camara.
    let marco = null, deriva = -1;
    if (!SIN_REENCUADRE) {
      const opciones = {
        margen: MARGEN, margenV: MARGEN_V, cobertura: COBERTURA, subir: SUBIR,
        forzarBanco: FORZAR_BANCO,
        ...(SIN_AJUSTES ? {} : AJUSTES[lab.n] ?? {}),
      };
      marco = await pagina.evaluate(REENCUADRE, opciones);
      await pagina.waitForTimeout(700);
      // Segunda pasada: hay labs que animan la camara al arrancar (deriva) y labs
      // que reponen etiquetas. Repetir la medida ya sin pizarra es idempotente.
      if (marco.ok) {
        const primera = marco;
        marco = await pagina.evaluate(REENCUADRE, opciones);
        // La 2.ª pasada corre con la pizarra YA desmontada, asi que sus contadores
        // valen 0 siempre. El censo bueno es la suma de las dos.
        marco.pizarras = (primera.pizarras || 0) + (marco.pizarras || 0);
        marco.etiquetas = (primera.etiquetas || 0) + (marco.etiquetas || 0);
      }
      // Hay labs cuyo aparato arranca APAGADO —no oculto por un modo, sino con
      // visible=false hasta que se opera— y entonces lo unico que queda en pie es
      // el banco: mecanica-71 tenia 8 ramas de una malla escondidas y la portada
      // encuadraba 0,49x0,1 m. Si el encuadre sale de menos de 4 piezas o de una
      // caja de menos de 0,8 m, se lanza el recorrido/arranque automatico del lab
      // y se vuelve a medir. Solo se acepta la segunda medida si de verdad trae
      // mas piezas: un lab que ya salia bien no se toca.
      if (marco.ok && (marco.piezas < 4 || Math.max(marco.ancho, marco.alto) < 0.8)) {
        // 76 labs reparten la maquina por modos con botones id="m_*", y en el modo
        // de arranque puede no haber nada que retratar: mecanica-71 nace en
        // 'explora', donde los 8 botes del banco de capacitores estan en
        // visible=false, y solo quedaban el banco y una barrita. Se prueban los
        // modos uno a uno —y de remate el arranque automatico— y se queda el que
        // mas piezas deja a la vista. Solo entran aqui los labs mal encuadrados,
        // asi que ninguno que ya salia bien paga estos segundos.
        const intentos = await pagina.evaluate(() => Array.from(document.querySelectorAll('button[id^="m_"]'))
          .filter((b) => !b.disabled).map((b) => b.id));
        // Pulsar y volver a medir. Devuelve null si el boton no existe o esta apagado.
        const probar = async (id, espera) => {
          const pulsado = await pagina.evaluate(({ id, yaPulsado }) => {
            let b = null;
            if (id === '__auto') {
              const bs = Array.from(document.querySelectorAll('button'));
              b = bs.find((x) => x.id && x.id !== yaPulsado && /^(btnAuto|btnTour|btnPlay)/i.test(x.id));
            } else b = document.getElementById(id);
            if (!b || b.disabled) return false;
            b.click();               // el HUD esta en display:none, pero el DOM responde
            return true;
          }, { id, yaPulsado: armado.boton ?? null });
          if (!pulsado) return null;
          await pagina.waitForTimeout(espera);
          const otro = await pagina.evaluate(REENCUADRE, opciones);
          return otro.ok ? otro : null;
        };
        let mejorMarco = marco, mejorVia = null;
        for (const id of intentos) {
          const otro = await probar(id, 1100);
          if (otro && otro.piezas > mejorMarco.piezas) { mejorMarco = otro; mejorVia = id; }
        }
        // El recorrido automatico SOLO si ningun modo sirvio. Los labs guardan el
        // cambio de modo tras `if(!autoRunning)`, asi que una vez lanzado el auto
        // los botones m_* dejan de responder y ya no se puede volver al ganador
        // (medido en mecanica-71: el reclick de m_banco se perdia y la portada
        // acababa con una sola pieza).
        if (!mejorVia) {
          const otro = await probar('__auto', 3500);
          if (otro && otro.piezas > mejorMarco.piezas) { mejorMarco = otro; mejorVia = '__auto'; }
        }
        if (mejorVia) {
          // Dejar el lab en el modo ganador: el ultimo click pudo ser otro.
          if (mejorVia !== '__auto') {
            // Se queda la MEDIDA de la vuelta, aunque salga algo peor: REENCUADRE
            // ademas de medir mueve la camara, y el marco que se guarda tiene que
            // ser el de la escena que de verdad se va a retratar (si no, DERIVA
            // compara contra una puesta que ya no existe).
            const vuelta = await probar(mejorVia, 1300);
            if (vuelta) mejorMarco = vuelta;
          }
          mejorMarco.pizarras = marco.pizarras; mejorMarco.etiquetas = marco.etiquetas;
          mejorMarco.despertado = mejorVia;
          marco = mejorMarco;
        } else if (intentos.length) {
          marco.despertado = 'modos sin efecto';
        }
      }
      // Clavar la camara ANTES de la ultima espera: a partir de aqui el bucle del
      // lab puede seguir animandola, pero cada render la repone donde toca.
      if (marco.ok) await pagina.evaluate(FIJAR);
      await pagina.waitForTimeout(500);
      await pagina.evaluate(LIMPIAR);
      await pagina.waitForTimeout(150);
      if (marco.ok) deriva = await pagina.evaluate(DERIVA, marco.puesta);
    } else {
      await pagina.waitForTimeout(450);
    }

    const png = await pagina.screenshot({ type: 'png' });

    // Reencodear a WebP dentro del navegador (sin sharp). Con el reencuadre hecho
    // en 3D no hace falta recortar: el cuadro ya es el que queremos, solo se baja
    // de VIEWPORT a LADO.
    const res = await recodificador.evaluate(async ({ b64, ancho, alto, calidad }) => {
      const img = new Image();
      await new Promise((ok, mal) => { img.onload = ok; img.onerror = mal; img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas');
      c.width = ancho; c.height = alto;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, img.width, img.height, 0, 0, ancho, alto);
      return { url: c.toDataURL('image/webp', calidad) };
    }, { b64: png.toString('base64'), ancho: ANCHO, alto: ALTO, calidad: CALIDAD });

    if (!res.url.startsWith('data:image/webp')) throw new Error('el navegador no devolvio WebP');
    const webp = Buffer.from(res.url.split(',')[1], 'base64');
    const destino = path.join(SALIDA, `prac_${lab.n}.webp`);
    fs.writeFileSync(destino, webp);
    if (PNG_TAMBIEN) fs.writeFileSync(path.join(DEPURA, `png-${lab.n}.png`), png);

    // Control de escena vacia: una portada casi de un solo color significa que
    // el lab no llego a dibujar (WebGL caido, error de modulo, etc.).
    const variedad = await recodificador.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((ok) => { img.onload = ok; img.src = 'data:image/webp;base64,' + b64; });
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 64, 64);
      const d = g.getImageData(0, 0, 64, 64).data;
      const vistos = new Set();
      for (let i = 0; i < d.length; i += 4) vistos.add((d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3));
      return vistos.size;
    }, webp.toString('base64'));

    const kb = webp.length / 1024;
    informe.push({ n: lab.n, id: lab.id, kb: +kb.toFixed(1), variedad, errores: errores.length,
      ocultos: oculto.ocultos, marco, deriva, armado });
    const avisos = [];
    if (armado.via === 'E+S' && !armado.boton) avisos.push('E+S SIN BOTON DE MONTAJE');
    if (armado.agotado) avisos.push('el montaje automatico no termino');
    if (variedad < 12) avisos.push('ESCENA PLANA');
    if (marco && !marco.ok) avisos.push('SIN REENCUADRE: ' + marco.motivo);
    if (marco && marco.ok && !marco.controles) avisos.push('sin OrbitControls');
    if (deriva > 0.02) avisos.push(`movida ${deriva} (congelada)`);
    if (errores.length) avisos.push(`${errores.length} err JS`);
    const m = marco && marco.ok
      ? `caja ${String(marco.ancho).padStart(5)}x${String(marco.alto).padEnd(5)} d ${String(marco.dist).padStart(5)} piz ${marco.pizarras} etq ${String(marco.etiquetas).padStart(2)}`
        + ` banco ${String(marco.banco ?? '—').padStart(5)} sobre ${String(marco.sobreBanco).padStart(3)}/${String(marco.candidatas).padStart(3)} usa ${String(marco.piezas).padStart(3)}`
        + (armado.es ? `  ⚙ ${armado.via}` : '') + (marco.despertado ? `  ▶ ${marco.despertado}` : '')
      : '';
    console.log(`  ${String(lab.n).padStart(3)} ${lab.id.padEnd(14)} ${kb.toFixed(1).padStart(6)} KB  tonos ${String(variedad).padStart(4)}  ${m}${avisos.length ? '  ⚠ ' + avisos.join(' · ') : ''}`);
    if (errores.length) console.log('       ' + errores[0]);
  } catch (e) {
    if (tarea.intento === 0) {
      tarea.intento = 1; cola.push(tarea);
      console.log(`  ${String(lab.n).padStart(3)} ${lab.id.padEnd(14)}  reintento: ${String(e.message).split('\n')[0].slice(0, 80)}`);
    } else {
      fallos++;
      console.log(`  ${String(lab.n).padStart(3)} ${lab.id.padEnd(14)}  FALLO: ${String(e.message).slice(0, 110)}`);
      informe.push({ n: lab.n, id: lab.id, fallo: String(e.message).slice(0, 200) });
    }
  } finally {
    await pagina.close();
  }
}

await navegador.close();
servidor.close();

const ok = informe.filter((r) => !r.fallo);
const kbs = ok.map((r) => r.kb).sort((a, b) => a - b);
console.log('\n─────────────────────────────────────────────');
console.log(`capturadas ${ok.length}/${labs.length}   fallos ${fallos}`);
if (kbs.length) {
  console.log(`peso: min ${kbs[0].toFixed(1)} · mediana ${kbs[kbs.length >> 1].toFixed(1)} · max ${kbs.at(-1).toFixed(1)} KB`);
  console.log(`total: ${(kbs.reduce((s, x) => s + x, 0) / 1024).toFixed(2)} MB`);
}
const lista = (t, f) => { const s = ok.filter(f); if (s.length) console.log(`${t}: ${s.map((r) => r.n).join(', ')}`); };
lista('ESCENAS PLANAS (revisar)', (r) => r.variedad < 12);
lista('SIN REENCUADRE', (r) => r.marco && !r.marco.ok);
lista('SIN OrbitControls', (r) => r.marco && r.marco.ok && !r.marco.controles);
lista('CAMARA A LA DERIVA', (r) => r.deriva > 0.02);
lista('SIN PIZARRA DETECTADA', (r) => r.marco && r.marco.ok && !r.marco.pizarras);
lista('CON ERRORES JS', (r) => r.errores > 0);
fs.writeFileSync(path.join(DEPURA, 'informe-portadas.json'), JSON.stringify(informe, null, 1));
console.log(`informe: ${path.relative(RAIZ, path.join(DEPURA, 'informe-portadas.json'))}`);
if (fallos) process.exitCode = 1;
