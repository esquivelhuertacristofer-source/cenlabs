/**
 * scripts/_migrate-labs.mjs  (ONE-OFF — borrar tras la migración)
 * ─────────────────────────────────────────────────────────────────────────────
 * Extrae los 40 labs estándar (quimica/fisica/matematicas/biologia × 10) de los
 * monolitos a carpetas autocontenidas `src/labs/<id>/`, usando el TS compiler API
 * para copiar el TEXTO EXACTO de cada literal (cero reformateo, cero transcripción
 * a mano). El golden master valida que la extracción es byte-fiel.
 *
 * FASES:
 *   node scripts/_migrate-labs.mjs                 → sólo crea las carpetas (Fase 3A)
 *   node scripts/_migrate-labs.mjs --empty-monoliths → además vacía los monolitos
 *                                                     (LEGACY_* → {} / sólo mecánica) (Fase 3B)
 *
 * mecánica-* NO se toca: sólo tiene `briefing` (no contenido/tutor/quiz) y no
 * encaja en LabModule; su briefing queda como residuo en briefingConfigs.
 */
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const LABS_DIR = join(SRC, 'labs');
const DATA_DIR = join(SRC, 'data');
const COMP_FILE = join(SRC, 'components', 'simulador', 'LabRegistry.tsx');

const EMPTY = process.argv.includes('--empty-monoliths');

// ── helpers de parseo ────────────────────────────────────────────────────────
function parse(file) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return { text, sf };
}

/** Desenvuelve `X as T`, `(X)`, `X satisfies T` hasta la expresión base. */
function unwrap(expr) {
  while (expr && (ts.isAsExpression(expr) || ts.isParenthesizedExpression(expr) ||
         (ts.isSatisfiesExpression && ts.isSatisfiesExpression(expr)))) {
    expr = expr.expression;
  }
  return expr;
}

/** Devuelve la ObjectLiteralExpression inicializadora de `const NAME = {...}`
 *  (desenvolviendo `as const` / paréntesis). */
function findVarObject(sf, name) {
  let found = null;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
        node.name.text === name && node.initializer) {
      const base = unwrap(node.initializer);
      if (base && ts.isObjectLiteralExpression(base)) found = base;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/** Map<id, PropertyAssignment> para un objeto keyed por string/identifier. */
function propsById(objLit) {
  const map = new Map();
  for (const prop of objLit.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    let id = null;
    if (ts.isStringLiteralLike(prop.name)) id = prop.name.text;
    else if (ts.isIdentifier(prop.name)) id = prop.name.text;
    if (id) map.set(id, prop);
  }
  return map;
}

// ── cargar los 4 stores de datos ─────────────────────────────────────────────
const stores = {
  contenido:  { file: join(DATA_DIR, 'simuladoresData.ts'), varName: 'LEGACY_MASTER_DATA' },
  briefing:   { file: join(DATA_DIR, 'briefingConfigs.ts'), varName: 'LEGACY_ALL_BRIEFING_CONFIGS' },
  tutorSteps: { file: join(DATA_DIR, 'tutorSteps.ts'),      varName: 'LEGACY_ALL_TUTOR_STEPS' },
  quiz:       { file: join(DATA_DIR, 'quizQuestions.ts'),   varName: 'LEGACY_ALL_QUIZZES' },
};
for (const s of Object.values(stores)) {
  const parsed = parse(s.file);
  s.text = parsed.text;
  s.sf = parsed.sf;
  s.obj = findVarObject(parsed.sf, s.varName);
  if (!s.obj) throw new Error(`No se encontró ${s.varName} en ${s.file}`);
  s.props = propsById(s.obj);
}

// ── cargar objetivos (switch → función) ──────────────────────────────────────
const objetivosById = new Map();
{
  const { sf } = parse(join(DATA_DIR, 'labObjetivos.ts'));
  let switchStmt = null;
  const visit = (node) => {
    if (ts.isSwitchStatement(node)) switchStmt = node;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!switchStmt) throw new Error('No se encontró el switch en labObjetivos.ts');
  for (const clause of switchStmt.caseBlock.clauses) {
    if (!ts.isCaseClause(clause)) continue; // ignora default
    const id = clause.expression && ts.isStringLiteralLike(clause.expression)
      ? clause.expression.text : null;
    const ret = clause.statements.find((st) => ts.isReturnStatement(st));
    if (id && ret && ret.expression) {
      objetivosById.set(id, ret.expression.getText());
    }
  }
}

// ── cargar rutas de componentes desde LabRegistry.tsx ────────────────────────
const pilotoPath = new Map();
const bitacoraPath = new Map();
{
  const text = readFileSync(COMP_FILE, 'utf8');
  const re = /'([a-z]+-\d+)':\s*dynamic\(\(\)\s*=>\s*import\('([^']+)'\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, id, path] = m;
    if (path.includes('/bitacoras/')) bitacoraPath.set(id, path);
    else pilotoPath.set(id, path);
  }
}

// ── determinar los ids estándar (los que tienen contenido) ───────────────────
const STANDARD_IDS = [...stores.contenido.props.keys()].sort((a, b) => {
  const [ca, na] = a.split('-'), [cb, nb] = b.split('-');
  return ca !== cb ? (ca < cb ? -1 : 1) : (+na - +nb);
});

// validar completitud
const problems = [];
for (const id of STANDARD_IDS) {
  for (const key of ['briefing', 'tutorSteps', 'quiz']) {
    if (!stores[key].props.has(id)) problems.push(`${id}: falta ${key}`);
  }
  if (!pilotoPath.has(id)) problems.push(`${id}: falta ruta de Piloto`);
  if (!bitacoraPath.has(id)) problems.push(`${id}: falta ruta de Bitácora`);
}
if (problems.length) {
  console.error('❌ Problemas de completitud:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`[migrate] ${STANDARD_IDS.length} labs estándar a migrar.`);
console.log(`[migrate] ${objetivosById.size} labs con objetivos.`);

// ── generadores de archivos por lab ──────────────────────────────────────────
const W = (dir, name, content) => {
  writeFileSync(join(dir, name), content, 'utf8');
};

function genContenido(text) {
  return `import type { SimuladorContenido } from '@/data/simuladoresData';\n\n` +
         `const contenido: SimuladorContenido = ${text};\n\nexport default contenido;\n`;
}
function genBriefing(text) {
  return `import type { BriefingConfig } from '@/components/MissionBriefing';\n\n` +
         `const briefing: BriefingConfig = ${text};\n\nexport default briefing;\n`;
}
function genTutor(text) {
  return `import type { TutorStep } from '@/components/DrQuantumTutor';\n\n` +
         `const tutorSteps: TutorStep[] = ${text};\n\nexport default tutorSteps;\n`;
}
function genQuiz(text) {
  return `import type { Question } from '@/components/LabQuiz';\n\n` +
         `const quiz: Question[] = ${text};\n\nexport default quiz;\n`;
}
function genObjetivos(arrText) {
  return `import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';\n\n` +
    `export default function objetivos(s: ObjetivosState): Objetivo[] {\n` +
    `  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,\n` +
    `          gases, balanceo, limitante, soluciones, solubilidad,\n` +
    `          titulacion, equilibrio, celda, destilacion,\n` +
    `          tiroParabolico, planoInclinado, pendulo, hooke } = s;\n` +
    `  return ${arrText};\n}\n`;
}
function genComponents(pPath, bPath) {
  return `'use client';\n\n` +
    `import dynamic from 'next/dynamic';\n` +
    `import { Loader } from '../_loader';\n\n` +
    `export const Piloto = dynamic(() => import('${pPath}'), { loading: Loader });\n` +
    `export const Bitacora = dynamic(() => import('${bPath}'), { loading: Loader });\n`;
}
function genIndex(id, hasObjetivos) {
  const lines = [
    `import type { LabModule } from '../_types';`,
    `import contenido from './contenido';`,
    `import briefing from './briefing';`,
    `import tutorSteps from './tutorSteps';`,
    `import quiz from './quiz';`,
  ];
  if (hasObjetivos) lines.push(`import objetivos from './objetivos';`);
  lines.push('');
  const fields = ['contenido', 'briefing', 'tutorSteps', 'quiz'];
  if (hasObjetivos) fields.push('objetivos');
  lines.push(`const lab: LabModule = {`);
  lines.push(`  id: '${id}',`);
  for (const f of fields) lines.push(`  ${f},`);
  lines.push(`};`);
  lines.push('');
  lines.push(`export default lab;`);
  return lines.join('\n') + '\n';
}

// ── escribir carpetas ────────────────────────────────────────────────────────
for (const id of STANDARD_IDS) {
  const dir = join(LABS_DIR, id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  W(dir, 'contenido.ts', genContenido(stores.contenido.props.get(id).initializer.getText()));
  W(dir, 'briefing.ts', genBriefing(stores.briefing.props.get(id).initializer.getText()));
  W(dir, 'tutorSteps.ts', genTutor(stores.tutorSteps.props.get(id).initializer.getText()));
  W(dir, 'quiz.ts', genQuiz(stores.quiz.props.get(id).initializer.getText()));
  const hasObj = objetivosById.has(id);
  if (hasObj) W(dir, 'objetivos.ts', genObjetivos(objetivosById.get(id)));
  W(dir, 'components.ts', genComponents(pilotoPath.get(id), bitacoraPath.get(id)));
  W(dir, 'index.ts', genIndex(id, hasObj));
}
console.log(`[migrate] Carpetas escritas para ${STANDARD_IDS.length} labs.`);

// ── (Fase 3B) vaciar monolitos ───────────────────────────────────────────────
if (EMPTY) {
  // splice: reemplaza el rango [start,end) del texto por replacement
  const splice = (text, start, end, replacement) =>
    text.slice(0, start) + replacement + text.slice(end);

  // contenido / tutorSteps / quiz: todo migra ⇒ objeto literal → {}
  for (const key of ['contenido', 'tutorSteps', 'quiz']) {
    const s = stores[key];
    const start = s.obj.getStart(s.sf);
    const end = s.obj.getEnd();
    const out = splice(s.text, start, end, '{}');
    writeFileSync(s.file, out, 'utf8');
    console.log(`[migrate] ${s.varName} → {} en ${s.file}`);
  }

  // briefing: conservar SÓLO mecánica-*
  {
    const s = stores.briefing;
    const keep = [];
    for (const prop of s.obj.properties) {
      let id = null;
      if (ts.isPropertyAssignment(prop) && ts.isStringLiteralLike(prop.name)) id = prop.name.text;
      if (id && id.startsWith('mecanica-')) keep.push(prop.getText());
    }
    const rebuilt = '{\n  ' + keep.join(',\n  ') + ',\n}';
    const start = s.obj.getStart(s.sf);
    const end = s.obj.getEnd();
    const out = splice(s.text, start, end, rebuilt);
    writeFileSync(s.file, out, 'utf8');
    console.log(`[migrate] ${s.varName} → sólo ${keep.length} mecánica en ${s.file}`);
  }
}
