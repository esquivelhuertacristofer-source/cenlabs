/**
 * scripts/gen-lab-briefings.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Publica el briefing de cada lab como ACTIVO ESTÁTICO en vez de como código.
 *
 * ¿Por qué existe este script?
 * ────────────────────────────
 * El worker de Cloudflare inlinea todos los chunks del build de servidor en un
 * solo `handler.mjs`, y el plan gratuito lo topa en 3 MiB comprimidos. Los 160
 * briefings son ~885 KB de prosa; entraban al worker porque `MecanicaShellClient`
 * y `SimuladorClient` (ambos "use client", y por tanto también renderizados en el
 * servidor) importaban el registro ENTERO para leer UNA entrada. El 2026-08-11 el
 * despliegue reventó por 58 KiB.
 *
 * La prosa no es código: no se ejecuta, no se ramifica, sólo se lee. Así que sale
 * del grafo de JS y se sirve como JSON desde `public/`, que Cloudflare entrega
 * desde el borde sin siquiera invocar al worker. Mismo espíritu que los stubs de
 * Sentry y jsPDF en `next.config.ts`, pero para datos en vez de librerías.
 *
 * Escribe DOS cosas:
 *
 *   public/labs-data/briefing/<id>.json   → el BriefingConfig completo, uno por
 *                                            lab. Lo pide el cliente al montar.
 *   src/labs/_briefing-meta.generated.ts  → SÓLO los tres campos que necesita
 *                                            generateMetadata() en el servidor
 *                                            (~40 KB en vez de 885 KB). El <title>
 *                                            y la <meta description> siguen
 *                                            saliendo en el HTML del servidor,
 *                                            byte a byte como antes.
 *
 * El origen de la verdad sigue siendo `src/labs/<id>/briefing.ts`, escrito a mano.
 * Este script lo COMPILA Y EJECUTA con esbuild (los 160 sólo importan el tipo, que
 * esbuild borra), así que el JSON es exactamente lo que evaluaba el registro.
 *
 * Se corre solo en `predev`, `prebuild` y `cf:build` (ver package.json). El humano
 * NUNCA edita la salida. Con `--check` no escribe: falla (exit 1) si el disco no
 * coincide con lo que tocaba generar.
 *
 * Uso:  node scripts/gen-lab-briefings.mjs [--check]
 */
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');
const LABS_DIR = join(SRC_DIR, 'labs');
const JSON_DIR = join(ROOT, 'public', 'labs-data', 'briefing');
const META_FILE = join(LABS_DIR, '_briefing-meta.generated.ts');
const CHECK = process.argv.includes('--check');

/**
 * Longitud del recorte de `bienvenida` que usa generateMetadata como description
 * cuando el lab no trae `subtitulo`. Es el `.substring(0, 160)` que ya estaba en
 * [id]/page.tsx: se replica aquí para que el meta generado dé el MISMO byte.
 */
const DESC_MAX = 160;

const BANNER =
  '// ⚠️  AUTO-GENERADO por scripts/gen-lab-briefings.mjs — NO EDITAR A MANO.\n' +
  '// Regenerar:  npm run gen:briefings   (corre solo en predev/prebuild/cf:build).\n\n';

/** Orden natural por categoría y número: quimica-1, quimica-2, …, quimica-10. */
function compareIds(a, b) {
  const [ca, na] = a.split('-');
  const [cb, nb] = b.split('-');
  if (ca !== cb) return ca < cb ? -1 : 1;
  return (parseInt(na, 10) || 0) - (parseInt(nb, 10) || 0);
}

/** Carpetas de lab que declaran briefing.ts, en el mismo orden que el registro. */
function discoverBriefings() {
  if (!existsSync(LABS_DIR)) return [];
  return readdirSync(LABS_DIR)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .filter((name) => {
      try {
        return statSync(join(LABS_DIR, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .filter((name) => existsSync(join(LABS_DIR, name, 'briefing.ts')))
    .sort(compareIds);
}

/**
 * Compila los 160 briefing.ts a un módulo y los EVALÚA. No se parsea el TypeScript
 * a mano ni se hace una regex sobre el literal: se ejecuta, que es lo único que
 * garantiza que el JSON valga lo mismo que valía `fromRegistry('briefing')`.
 */
async function evaluarBriefings(ids) {
  const entrada =
    ids.map((id, i) => `import b${i} from './labs/${id}/briefing.ts';`).join('\n') +
    `\nexport const BRIEFINGS = {\n` +
    ids.map((id, i) => `  ${JSON.stringify(id)}: b${i},`).join('\n') +
    `\n};\n`;

  const res = await build({
    stdin: { contents: entrada, resolveDir: SRC_DIR, sourcefile: '_briefings-entry.ts', loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    logLevel: 'silent',
    // Los briefing.ts sólo hacen `import type { BriefingConfig }`, que esbuild
    // borra al compilar. El alias está por si algún día uno importa un valor
    // compartido (una paleta, una constante) desde '@/…'.
    alias: { '@': SRC_DIR },
  });

  const tmp = join(tmpdir(), `cen-briefings-${process.pid}.mjs`);
  writeFileSync(tmp, res.outputFiles[0].text, 'utf8');
  try {
    const mod = await import(pathToFileURL(tmp).href);
    return mod.BRIEFINGS;
  } finally {
    rmSync(tmp, { force: true });
  }
}

/** Escribe (o compara, con --check) un archivo. Devuelve true si está en orden. */
function emit(abs, rel, content) {
  const prev = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (prev === content) return true;
  if (CHECK) {
    console.error(`  ✗ ${rel} está desactualizado — corre 'npm run gen:briefings'.`);
    return false;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf8');
  return false; // false = "no estaba igual"; el llamador lo cuenta como escrito
}

const ids = discoverBriefings();
console.log(`[gen-lab-briefings] ${ids.length} briefing(s) detectado(s).`);

const BRIEFINGS = await evaluarBriefings(ids);

// ── 1. Un JSON por lab en public/labs-data/briefing/ ──────────────────────────
mkdirSync(JSON_DIR, { recursive: true });
let escritos = 0;
let desactualizados = 0;
for (const id of ids) {
  const cfg = BRIEFINGS[id];
  if (!cfg || typeof cfg !== 'object') {
    console.error(`  ✗ ${id}/briefing.ts no exporta un objeto por defecto.`);
    process.exit(1);
  }
  // Compacto y con salto final: viaja por la red, no lo lee un humano.
  const content = JSON.stringify(cfg) + '\n';
  if (emit(join(JSON_DIR, `${id}.json`), `public/labs-data/briefing/${id}.json`, content)) continue;
  CHECK ? desactualizados++ : escritos++;
}

// Barre JSON de labs que ya no existen: si no, un lab borrado seguiría publicado.
const esperados = new Set(ids.map((id) => `${id}.json`));
for (const f of readdirSync(JSON_DIR).filter((n) => n.endsWith('.json'))) {
  if (esperados.has(f)) continue;
  if (CHECK) {
    console.error(`  ✗ public/labs-data/briefing/${f} sobra (su lab ya no existe).`);
    desactualizados++;
  } else {
    rmSync(join(JSON_DIR, f));
    console.log(`  − ${f} eliminado (su lab ya no existe)`);
  }
}

console.log(
  CHECK
    ? `  ${ids.length - desactualizados}/${ids.length} JSON en orden`
    : `  ✓ ${escritos} JSON escrito(s), ${ids.length - escritos} sin cambios`
);

// ── 2. El mapa mínimo que el servidor SÍ necesita ─────────────────────────────
// generateMetadata() corre en el worker y sólo lee estos tres campos. Se emiten
// aparte —en vez de dejar que el servidor cargue el briefing entero— porque es la
// diferencia entre ~40 KB y 885 KB de prosa dentro del worker.
const filas = ids
  .map((id) => {
    const b = BRIEFINGS[id];
    const meta = {
      titulo: b.titulo,
      subtitulo: b.subtitulo,
      // Mismo recorte que hacía [id]/page.tsx sobre `bienvenida`, para que la
      // <meta description> salga idéntica a la de antes de esta migración.
      bienvenidaCorta: String(b.bienvenida ?? '').substring(0, DESC_MAX),
    };
    return `  ${JSON.stringify(id)}: ${JSON.stringify(meta)},`;
  })
  .join('\n');

const metaTs =
  BANNER +
  `import type { BriefingMeta } from './_briefing-meta';\n\n` +
  `export const BRIEFING_META: Record<string, BriefingMeta> = {\n${filas}${filas ? '\n' : ''}};\n`;

const metaIgual = emit(META_FILE, 'src/labs/_briefing-meta.generated.ts', metaTs);
console.log(metaIgual ? '  = _briefing-meta.generated.ts (sin cambios)' : '  ✓ _briefing-meta.generated.ts escrito');

if (CHECK && (desactualizados > 0 || !metaIgual)) {
  process.exit(1);
}
