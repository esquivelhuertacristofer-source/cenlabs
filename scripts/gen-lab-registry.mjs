/**
 * scripts/gen-lab-registry.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Codegen del registro de labs. Escanea `src/labs/<id>/` y escribe TRES archivos:
 *
 *   src/labs/_registry.generated.ts    → LABS (datos pesados, server-safe)
 *   src/labs/_components.generated.ts  → LAB_COMPONENTS ('use client')
 *   src/labs/_catalogo.generated.ts    → CATALOGO (metadatos livianos de catálogo)
 *
 * Un lab entra al registro de datos si tiene `index.ts`, al de componentes si
 * tiene `components.ts`, y al de catálogo si tiene `catalogo.ts`. El registro de
 * catálogo va aparte a propósito: es string data puro que consumen las páginas
 * "use client" sin arrastrar los datos pesados del lab (ver _catalogo.ts).
 * La salida son imports estáticos explícitos (greppeable,
 * depurable, sin magia del bundler) — importante por el fork custom de Next.js.
 *
 * Se corre solo en `predev` y `prebuild` (ver package.json). El humano NUNCA
 * edita los archivos .generated.ts. Con `--check` no escribe: falla (exit 1) si
 * la salida difiere de lo que hay en disco (útil en CI/pre-commit).
 *
 * Uso:  node scripts/gen-lab-registry.mjs [--check]
 */
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LABS_DIR = join(__dirname, '..', 'src', 'labs');
const CHECK = process.argv.includes('--check');

const BANNER =
  '// ⚠️  AUTO-GENERADO por scripts/gen-lab-registry.mjs — NO EDITAR A MANO.\n' +
  '// Regenerar:  npm run gen:labs   (corre solo en predev/prebuild).\n\n';

/** Orden natural por categoría y número: quimica-1, quimica-2, …, quimica-10. */
function compareIds(a, b) {
  const [ca, na] = a.split('-');
  const [cb, nb] = b.split('-');
  if (ca !== cb) return ca < cb ? -1 : 1;
  return (parseInt(na, 10) || 0) - (parseInt(nb, 10) || 0);
}

/** `quimica-1` → `quimica_1` (identificador JS válido para el import). */
const toIdent = (id) => id.replace(/[^a-zA-Z0-9]/g, '_');

function discoverLabDirs() {
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
    .sort(compareIds);
}

function buildDataRegistry(dirs) {
  const labs = dirs.filter((id) => existsSync(join(LABS_DIR, id, 'index.ts')));
  const imports = labs
    .map((id) => `import ${toIdent(id)} from './${id}';`)
    .join('\n');
  const entries = labs
    .map((id) => `  '${id}': ${toIdent(id)},`)
    .join('\n');
  return (
    BANNER +
    `import type { LabModule } from './_types';\n` +
    (imports ? imports + '\n' : '') +
    `\nexport const LABS: Record<string, LabModule> = {\n${entries}${entries ? '\n' : ''}};\n`
  );
}

function buildComponentsRegistry(dirs) {
  const labs = dirs.filter((id) => existsSync(join(LABS_DIR, id, 'components.ts')));
  const imports = labs
    .map((id) => `import * as ${toIdent(id)} from './${id}/components';`)
    .join('\n');
  const entries = labs
    .map(
      (id) =>
        `  '${id}': { Piloto: ${toIdent(id)}.Piloto, Bitacora: ${toIdent(id)}.Bitacora },`
    )
    .join('\n');
  return (
    "'use client';\n\n" +
    BANNER +
    `import type { LabComponents } from './_types';\n` +
    (imports ? imports + '\n' : '') +
    `\nexport const LAB_COMPONENTS: Record<string, LabComponents> = {\n${entries}${entries ? '\n' : ''}};\n`
  );
}

function buildCatalogoRegistry(dirs) {
  const labs = dirs.filter((id) => existsSync(join(LABS_DIR, id, 'catalogo.ts')));
  const imports = labs
    .map((id) => `import ${toIdent(id)} from './${id}/catalogo';`)
    .join('\n');
  const entries = labs
    .map((id) => `  '${id}': ${toIdent(id)},`)
    .join('\n');
  return (
    BANNER +
    `import type { CatalogoEntry } from './_types';\n` +
    (imports ? imports + '\n' : '') +
    `\nexport const CATALOGO: Record<string, CatalogoEntry> = {\n${entries}${entries ? '\n' : ''}};\n`
  );
}

function emit(relPath, content) {
  const abs = join(LABS_DIR, relPath);
  const prev = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (prev === content) {
    console.log(`  = ${relPath} (sin cambios)`);
    return true;
  }
  if (CHECK) {
    console.error(`  ✗ ${relPath} está desactualizado — corre 'npm run gen:labs'.`);
    return false;
  }
  writeFileSync(abs, content, 'utf8');
  console.log(`  ✓ ${relPath} escrito`);
  return true;
}

const dirs = discoverLabDirs();
console.log(`[gen-lab-registry] ${dirs.length} carpeta(s) de lab detectada(s).`);

const okData = emit('_registry.generated.ts', buildDataRegistry(dirs));
const okComp = emit('_components.generated.ts', buildComponentsRegistry(dirs));
const okCat = emit('_catalogo.generated.ts', buildCatalogoRegistry(dirs));

if (CHECK && (!okData || !okComp || !okCat)) {
  process.exit(1);
}
