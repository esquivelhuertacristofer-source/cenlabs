/**
 * scripts/new-lab.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Andamia un lab nuevo bajo el modelo "un lab = una carpeta autocontenida":
 * crea src/labs/<id>/ con todos los archivos del contrato (index, contenido,
 * briefing, tutorSteps, quiz, components, catalogo, y objetivos si se pide) y
 * regenera los tres registros. Agregar un lab estándar = correr esto una vez y
 * rellenar los TODO; NUNCA se edita una página de categoría ni un registro.
 *
 * Los stubs son type-válidos (compilan de inmediato) y `components.ts` apunta a
 * ../_placeholder, así el lab CORRE mostrando "en construcción" hasta que se le
 * enchufe el simulador real. Esto mantiene el árbol siempre verde.
 *
 * Uso:
 *   node scripts/new-lab.mjs <id> [opciones]
 *
 *   <id>                 obligatorio, formato <categoria>-<n>, p.ej. quimica-11
 *                        categoría ∈ {quimica, fisica, matematicas, biologia, mecanica}
 *
 *   --titulo   "..."     título de la práctica (default: "TODO: título")
 *   --modulo   "..."     módulo/pestaña de la categoría (default: "TODO: módulo")
 *   --duracion "30 min"  duración mostrada en el catálogo (default: "30 min")
 *   --piloto   Nombre    usa @/components/Piloto<Nombre> en vez del placeholder
 *   --bitacora Nombre    usa @/components/bitacoras/Bitacora<Nombre>
 *   --objetivos          además genera objetivos.ts (barra de objetivos del HUD)
 *   --iframe   /labs/x.html  crea un lab "iframe 3D" (three.js embebido): sólo
 *                        genera index+briefing+catalogo (con simuladorHtml), SIN
 *                        contenido/tutorSteps/quiz/components. Es el patrón de
 *                        mecánica, pero funciona en cualquier categoría.
 *   --no-gen             no regenera los registros (hazlo luego con npm run gen:labs)
 *
 * Ejemplos:
 *   # Lab 2.5D (React) estándar:
 *   node scripts/new-lab.mjs quimica-11 --titulo "Gases Reales" \
 *     --modulo "Fisicoquímica" --duracion "40 min" --piloto GasesReales \
 *     --bitacora GasesReales --objetivos
 *
 *   # Lab iframe 3D (mecánica): el simulador es un HTML three.js ya construido.
 *   node scripts/new-lab.mjs mecanica-11 --titulo "Turbocompresor" \
 *     --modulo "Autotrónica" --duracion "40 min" --iframe /labs/turbo.html
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LABS_DIR = join(ROOT, 'src', 'labs');
const GEN_SCRIPT = join(__dirname, 'gen-lab-registry.mjs');

const CATEGORIAS = ['quimica', 'fisica', 'matematicas', 'biologia', 'mecanica'];
/** Prefijo de código de briefing por categoría (cosmético; el autor puede cambiarlo). */
const PREFIJO_CODIGO = { quimica: 'QMI', fisica: 'FIS', matematicas: 'MAT', biologia: 'BIO', mecanica: 'MEC' };
/** Acento de marca por categoría, usado en el stub de briefing (cosmético). */
const ACENTO_CATEGORIA = { quimica: '#219EBC', fisica: '#219EBC', matematicas: '#219EBC', biologia: '#219EBC', mecanica: '#2A9D8F' };

// ─── Parseo de argumentos ─────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { _: [], objetivos: false, gen: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--objetivos') opts.objetivos = true;
    else if (a === '--no-gen') opts.gen = false;
    else if (a === '--titulo') opts.titulo = argv[++i];
    else if (a === '--modulo') opts.modulo = argv[++i];
    else if (a === '--duracion') opts.duracion = argv[++i];
    else if (a === '--piloto') opts.piloto = argv[++i];
    else if (a === '--bitacora') opts.bitacora = argv[++i];
    else if (a === '--iframe') opts.iframe = argv[++i];
    else if (a.startsWith('--')) fail(`Opción desconocida: ${a}`);
    else opts._.push(a);
  }
  return opts;
}

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// ─── Plantillas de archivos (stubs type-válidos) ──────────────────────────────
const contenidoTs = (c) => `import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
  titulo: ${JSON.stringify(c.titulo)},
  videoUrl: "",
  mision: "TODO: describe la misión del alumno en esta práctica.",
  ecuacion: "TODO = ecuación principal",
  formulaGfx: "TODO: fórmula corta",
  pasos: [
    { id: 1, text: "TODO: primer paso.", icon: "zap" },
    { id: 2, text: "TODO: segundo paso.", icon: "check" },
  ],
  guiaMaestro: {
    objetivo: "TODO: objetivo pedagógico.",
    friccion: "TODO: dónde se traba el alumno y cómo lo resuelve la práctica.",
    puntosClave: ["TODO: concepto clave 1.", "TODO: concepto clave 2."],
  },
  conceptos: [
    { titulo: "TODO: concepto", desc: "TODO: definición." },
  ],
};

export default contenido;
`;

const briefingTs = (c) => `import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: ${JSON.stringify(c.codigo)},
  titulo: ${JSON.stringify(c.titulo)},
  subtitulo: ${JSON.stringify(c.modulo)},
  acento: ${JSON.stringify(c.acento)},
  duracion: ${c.duracionMin},
  videoUrl: '',
  bienvenida: 'TODO: bienvenida del Dr. Quantum. Puede usar \\n para saltos de línea.',
  conceptos: [
    { icono: '🔬', nombre: 'TODO: concepto', descripcion: 'TODO: descripción.' },
  ],
  mision: [
    'TODO: primer objetivo de la misión.',
    'TODO: segundo objetivo de la misión.',
  ],
  aplicaciones: [
    { area: 'TODO: área', ejemplo: 'TODO: aplicación real de este conocimiento.' },
  ],
};

export default briefing;
`;

const tutorStepsTs = () => `import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
  {
    id: 1, tipo: 'intro', pista: '¡Bienvenida!',
    mensaje: '¡Hola, {alumno}! TODO: presenta la misión de esta práctica.',
  },
  {
    id: 2, tipo: 'accion', pista: 'Primer acción',
    mensaje: 'TODO: guía la primera interacción del alumno con el simulador.',
  },
  {
    id: 3, tipo: 'verificar', pista: 'Valida',
    mensaje: 'TODO: indica cuándo y cómo validar la práctica.',
    accion: 'Validar Práctica',
  },
  {
    id: 4, tipo: 'logro', pista: '¡Completado!',
    mensaje: '¡Excelente! TODO: refuerza el concepto aprendido.',
  },
];

export default tutorSteps;
`;

const quizTs = () => `import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
  {
    pregunta: "TODO: primera pregunta del quiz.",
    opciones: ["Opción A", "Opción B", "Opción C", "Opción D"],
    respuestaCorrecta: 0,
    explicacion: "TODO: por qué la opción correcta lo es.",
  },
];

export default quiz;
`;

const objetivosTs = () => `import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

// TODO: mapea el estado del simulador a la barra de objetivos del HUD.
// Los campos disponibles están en ObjetivosState (src/data/labObjetivos.ts).
export default function objetivos(_s: ObjetivosState): Objetivo[] {
  return [
    // { label: 'TODO', current: 0, target: 1, completed: false },
  ];
}
`;

const componentsTs = (c) => {
  const pilotoImport = c.piloto
    ? `@/components/Piloto${c.piloto}`
    : '../_placeholder';
  const bitacoraImport = c.bitacora
    ? `@/components/bitacoras/Bitacora${c.bitacora}`
    : '../_placeholder';
  const todo = (c.piloto && c.bitacora)
    ? ''
    : '// TODO: reemplaza ../_placeholder por el Piloto/Bitácora real de este lab.\n';
  return `'use client';

${todo}import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('${pilotoImport}'), { loading: Loader });
export const Bitacora = dynamic(() => import('${bitacoraImport}'), { loading: Loader });
`;
};

const catalogoTs = (c) => `import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: ${JSON.stringify(c.modulo)},
  titulo: ${JSON.stringify(c.titulo)},
  duracion: ${JSON.stringify(c.duracion)},
  teoria: "TODO: una o dos frases que describan la teoría de la práctica.",
  estado: "activo",
};

export default catalogo;
`;

// Catálogo de un lab "iframe 3D": añade simuladorHtml (ruta pública del HTML
// three.js que el shell embebe por <iframe>). Es lo que distingue a un lab iframe
// de uno 2.5D (criterio funcional, no por prefijo del id).
const catalogoIframeTs = (c) => `import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: ${JSON.stringify(c.modulo)},
  titulo: ${JSON.stringify(c.titulo)},
  duracion: ${JSON.stringify(c.duracion)},
  teoria: "TODO: una o dos frases que describan la teoría de la práctica.",
  estado: "activo",
  simuladorHtml: ${JSON.stringify(c.simuladorHtml)},
};

export default catalogo;
`;

const indexTs = (c) => {
  const imports = [
    `import type { LabModule } from '../_types';`,
    `import contenido from './contenido';`,
    `import briefing from './briefing';`,
    `import tutorSteps from './tutorSteps';`,
    `import quiz from './quiz';`,
  ];
  if (c.objetivos) imports.push(`import objetivos from './objetivos';`);
  const fields = ['  contenido,', '  briefing,', '  tutorSteps,', '  quiz,'];
  if (c.objetivos) fields.push('  objetivos,');
  return `${imports.join('\n')}

const lab: LabModule = {
  id: '${c.id}',
${fields.join('\n')}
};

export default lab;
`;
};

// index.ts de un lab "iframe 3D": el simulador es un HTML three.js embebido (ver
// catalogo.simuladorHtml), no un simulador React. Por eso el módulo sólo aporta
// `briefing` — sin contenido/tutorSteps/quiz — que es el único campo de datos
// común a ambas clases de lab. fromRegistry omite los undefined, así que este lab
// no ensucia MASTER_DATA / ALL_TUTOR_STEPS / ALL_QUIZZES.
const indexIframeTs = (c) => `import type { LabModule } from '../_types';
import briefing from './briefing';

const lab: LabModule = {
  id: '${c.id}',
  briefing,
};

export default lab;
`;

// ─── Main ─────────────────────────────────────────────────────────────────────
const opts = parseArgs(process.argv.slice(2));
const id = opts._[0];

if (!id) fail('Falta el <id>. Uso: node scripts/new-lab.mjs <categoria>-<n> [opciones]');

const m = /^([a-z]+)-(\d+)$/.exec(id);
if (!m) fail(`Id inválido: "${id}". Debe ser <categoria>-<n>, p.ej. quimica-11.`);
const [, categoria, numStr] = m;
if (!CATEGORIAS.includes(categoria)) {
  fail(`Categoría inválida: "${categoria}". Válidas: ${CATEGORIAS.join(', ')}.`);
}

// Un lab es "iframe 3D" si se pasa --iframe <ruta>. La ruta debe ser pública
// (arranca con '/', servida desde public/). Es un criterio funcional, no por
// categoría, aunque hoy sólo mecánica lo usa.
const esIframe = Boolean(opts.iframe);
if (esIframe && !opts.iframe.startsWith('/')) {
  fail(`--iframe debe ser una ruta pública que empiece con '/', p.ej. /labs/turbo.html (recibí "${opts.iframe}").`);
}
if (esIframe && (opts.piloto || opts.bitacora || opts.objetivos)) {
  console.warn('⚠  --piloto/--bitacora/--objetivos se ignoran en un lab --iframe (no tiene simulador React).');
}

const dir = join(LABS_DIR, id);
if (existsSync(dir)) fail(`Ya existe src/labs/${id}/ — elimínalo o usa otro id.`);

const orden = parseInt(numStr, 10);
const duracion = opts.duracion || '30 min';
const duracionMin = parseInt(duracion, 10) || 30;
const ctx = {
  id,
  categoria,
  orden,
  titulo: opts.titulo || `TODO: título de ${id}`,
  modulo: opts.modulo || 'TODO: módulo',
  duracion,
  duracionMin,
  acento: ACENTO_CATEGORIA[categoria] || '#219EBC',
  codigo: `${PREFIJO_CODIGO[categoria]}-${String(orden).padStart(2, '0')}`,
  piloto: opts.piloto,
  bitacora: opts.bitacora,
  objetivos: opts.objetivos,
  simuladorHtml: opts.iframe,
};

// Dos variantes de lab conviven en el contrato (ver src/labs/_types.ts):
//   - iframe 3D → sólo index+briefing+catalogo (con simuladorHtml).
//   - 2.5D React → index+contenido+briefing+tutorSteps+quiz+components+catalogo.
const files = esIframe
  ? {
      'index.ts': indexIframeTs(ctx),
      'briefing.ts': briefingTs(ctx),
      'catalogo.ts': catalogoIframeTs(ctx),
    }
  : {
      'index.ts': indexTs(ctx),
      'contenido.ts': contenidoTs(ctx),
      'briefing.ts': briefingTs(ctx),
      'tutorSteps.ts': tutorStepsTs(ctx),
      'quiz.ts': quizTs(ctx),
      'components.ts': componentsTs(ctx),
      'catalogo.ts': catalogoTs(ctx),
    };
if (!esIframe && ctx.objetivos) files['objetivos.ts'] = objetivosTs(ctx);

mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(dir, name), content, 'utf8');
}

console.log(`\n✓ Lab ${esIframe ? 'iframe 3D' : '2.5D'} andamiado en src/labs/${id}/`);
console.log(`  Archivos: ${Object.keys(files).join(', ')}`);
if (esIframe) {
  console.log(`  Simulador → ${ctx.simuladorHtml} (asegúrate de que el HTML exista en public${ctx.simuladorHtml}).`);
} else if (!ctx.piloto || !ctx.bitacora) {
  console.log('  Piloto/Bitácora → ../_placeholder (reemplázalos por los reales en components.ts).');
}

if (opts.gen) {
  console.log('\n[new-lab] Regenerando registros…');
  execFileSync(process.execPath, [GEN_SCRIPT], { stdio: 'inherit', cwd: ROOT });
} else {
  console.log('\n⚠  --no-gen: corre `npm run gen:labs` para actualizar los registros.');
}

console.log(`\nSiguientes pasos para ${id}:`);
if (esIframe) {
  console.log(`  1. Rellena los TODO en src/labs/${id}/ (briefing, catalogo.teoria).`);
  console.log(`  2. Coloca el HTML three.js en public${ctx.simuladorHtml} (el shell lo embebe por <iframe>).`);
} else {
  console.log(`  1. Rellena los TODO en src/labs/${id}/ (contenido, briefing, tutorSteps, quiz, catalogo).`);
  console.log(`  2. Enchufa el simulador real en components.ts (Piloto/Bitácora).`);
}
console.log(`  3. Verifica: npx tsc --noEmit && npm test && npm run gen:labs:check\n`);

// Confirma que el lab quedó registrado y no rompe el discovery (readdir determinista).
const registrado = readdirSync(LABS_DIR).includes(id);
if (!registrado) fail('El lab no aparece en src/labs tras crearlo (revisa permisos).');
