// Labs sobre D1 (copiado de financiera-d1 el 2026-11-03) — traduce .export/dump.json (Postgres) a SQLite/D1.
// Salidas:
//   d1/esquema.sql              DDL (tablas, checks, FK, índices, vista del catálogo)
//   .export/datos-NN.sql        INSERT de todas las filas (gitignored: datos de alumnos)
//   src/lib/d1/esquema.gen.ts   tipos de columna, defaults y políticas RLS traducidas
import fs from 'node:fs'

// DIR: carpeta de la exportación. En un ensayo (DIR distinto de .export) el esquema y los
// tipos se escriben ahí también, para compararlos con los vigentes en vez de pisarlos.
const DIR = process.env.DIR ?? '.export'
const ENSAYO = DIR !== '.export'
const d = JSON.parse(fs.readFileSync(`${DIR}/dump.json`, 'utf8'))

// ── Columnas por tabla ────────────────────────────────────────────────────────
const tablas = {}
for (const c of d.columnas) (tablas[c.table_name] ??= []).push(c)
const esVista = new Set(d.tablas.filter((t) => t.table_type !== 'BASE TABLE').map((t) => t.table_name))

const tipoSqlite = (u) =>
  ['int2', 'int4', 'int8', 'bool'].includes(u) ? 'INTEGER' : u === 'numeric' ? 'REAL' : 'TEXT'
const clase = (u) =>
  u === 'jsonb' || u === 'json' ? 'json' : u.startsWith('_') ? 'arr' : u === 'bool' ? 'bool'
    : ['int2', 'int4', 'int8', 'numeric'].includes(u) ? 'num' : 'txt'

const AHORA = `(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
const UUID = `(lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||substr('89ab',1+(abs(random())%4),1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6))))`

function defaultSqlite(def) {
  if (def == null) return null
  if (def === 'now()') return AHORA
  // Financiera: profiles.created_at y progress.*_at. En una columna timestamptz con la sesión en
  // UTC (Supabase) es exactamente now().
  if (def === "timezone('utc'::text, now())") return AHORA
  // bigserial de las tablas del estudio: en SQLite lo da `INTEGER PRIMARY KEY` (alias del rowid).
  if (/^nextval\('\w+'::regclass\)$/.test(def)) return null
  if (def === 'gen_random_uuid()') return UUID
  if (def === 'true') return '1'
  if (def === 'false') return '0'
  if (/^-?\d+(\.\d+)?$/.test(def)) return def
  let m = def.match(/^'(.*)'::(text|jsonb)$/)
  if (m) return `'${m[1]}'`
  if (/^'\{\}'::text\[\]$/.test(def)) return `'[]'`
  throw new Error('default sin traducir: ' + def)
}

// Expresiones de Postgres (checks y políticas) → SQLite.
// Funciones de ayuda de Financiera (todas SECURITY DEFINER: no pasan por RLS):
//   get_my_role()        → el rol del perfil de la sesión            {{role}}
//   get_my_escuela_id()  → la escuela del perfil de la sesión        {{escuela}}
//   get_my_group_ids()   → los grupos donde la sesión es el maestro  (subconsulta sin políticas)
function pgASqlite(e) {
  return e
    .replace(/= ANY \(ARRAY\[([^\]]*)\]\)/g, (_, l) => `IN (${l})`)
    .replace(/'(-?\d+)'::integer/g, '$1')
    .replace(/::(text|integer|uuid|character varying)\b/g, '')
    .replace(/\bpublic\.(get_my_\w+\(\))/g, '$1')
    // Dos formas exactas: «= ANY ((f()))» y «= ANY (f())». Un solo patrón con paréntesis opcionales
    // se comía el paréntesis del WHERE de afuera en la segunda (2026-11-02: todo profiles fallaba).
    .replace(/= ANY \(\(get_my_group_ids\(\)\)\)/g, 'IN (SELECT id FROM grupos WHERE id_profesor = {{uid}})')
    .replace(/= ANY \(get_my_group_ids\(\)\)/g, 'IN (SELECT id FROM grupos WHERE id_profesor = {{uid}})')
    .replace(/\bget_my_role\(\)/g, '{{role}}')
    // Labs (2026-11-03): cen_es_docente() es del hotfix de perfiles (SECURITY DEFINER, lee el rol
    // de la sesión); auth.role() es el rol del JWT: 'authenticated' con sesión, 'anon' sin ella.
    .replace(/\bcen_es_docente\(\)/g, "({{role}} IN ('profesor', 'admin'))")
    .replace(/\bauth\.role\(\)/g, '{{jwtrole}}')
    .replace(/\bget_my_escuela_id\(\)/g, '{{escuela}}')
    .replace(/\(\s*SELECT\s+auth\.uid\(\)\s+AS\s+uid\s*\)/gi, '{{uid}}')
    .replace(/\bauth\.uid\(\)/g, '{{uid}}')
    .replace(/\bpublic\./g, '')
    .replace(/^true$/, '1')
}
// Una política que queda con sintaxis de Postgres no se puede aplicar en SQLite: sin esta
// revisión la consulta tronaría en ejecución, o peor, compararía mal sin avisar.
const SIN_TRADUCIR = /::|\bARRAY\b|\bANY\s*\(|get_my_\w+|\bauth\.\w+|current_setting|\bjwt\b|~\*?\s*'|\bILIKE\b/i
function politicaSqlite(e, donde) {
  const s = pgASqlite(e)
  if (SIN_TRADUCIR.test(s)) throw new Error(`política sin traducir (${donde}): ${s}`)
  // Una traducción que pierde o sobra un paréntesis da SQL roto que solo truena al consultar.
  const sinCadenas = s.replace(/'(?:[^']|'')*'/g, "''")
  let nivel = 0
  for (const ch of sinCadenas) { nivel += ch === '(' ? 1 : ch === ')' ? -1 : 0; if (nivel < 0) break }
  if (nivel !== 0) throw new Error(`política con paréntesis desbalanceados (${donde}): ${s}`)
  return s
}

// ── Restricciones ─────────────────────────────────────────────────────────────
const restr = {}
for (const r of d.restricciones) (restr[r.tabla] ??= []).push(r)

const ddl = [`-- Generado por scripts/d1/generar.mjs desde la exportación del ${new Date().toISOString().slice(0, 10)}.`,
  `-- Login propio: auth_users sustituye a auth.users de Supabase.`,
  `CREATE TABLE auth_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT,
  email_confirmed_at TEXT,
  raw_app_meta_data TEXT NOT NULL DEFAULT '{}',
  raw_user_meta_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT ${AHORA},
  updated_at TEXT NOT NULL DEFAULT ${AHORA},
  last_sign_in_at TEXT,
  banned_until TEXT,
  sesion_version INTEGER NOT NULL DEFAULT 1
);`,
  `-- Pausa por cuenta tras contraseñas equivocadas (no por IP: una escuela entera sale por una sola IP).
CREATE TABLE auth_fallos (email TEXT PRIMARY KEY, fallos INTEGER NOT NULL DEFAULT 0, desde TEXT NOT NULL);`]

// Orden topológico por FK, para crear e insertar sin violar referencias.
const deps = {}
for (const t of Object.keys(tablas)) deps[t] = new Set()
for (const [t, rs] of Object.entries(restr)) for (const r of rs) {
  const m = r.contype === 'f' && r.def.match(/REFERENCES (\w+(?:\.\w+)?)\(/)
  if (m && m[1] !== t && !m[1].startsWith('auth.')) deps[t]?.add(m[1])
}
const orden = []
const visto = new Set()
const visitar = (t) => { if (visto.has(t)) return; visto.add(t); for (const x of deps[t] ?? []) visitar(x); orden.push(t) }
Object.keys(tablas).sort().forEach(visitar)

const avisos = []
for (const t of orden) {
  if (esVista.has(t)) continue
  const lineas = tablas[t].map((c) => {
    let s = `  ${c.column_name} ${tipoSqlite(c.udt_name)}`
    if (c.is_nullable === 'NO') s += ' NOT NULL'
    const df = defaultSqlite(c.column_default)
    if (df) s += ` DEFAULT ${df}`
    return s
  })
  for (const r of restr[t] ?? []) {
    if (r.contype === 'p' || r.contype === 'u') lineas.push(`  ${r.def}`)
    else if (r.contype === 'f') lineas.push(`  ${r.def.replace('auth.users(id)', 'auth_users(id)')}`)
    else if (r.contype === 'c') {
      const s = pgASqlite(r.def)
      if (/::|ARRAY|\{\{/.test(s)) avisos.push(`check omitido ${t}: ${r.def}`)
      else lineas.push(`  ${s}`)
    }
  }
  ddl.push(`CREATE TABLE ${t} (\n${lineas.join(',\n')}\n);`)
}
for (const i of d.indices) {
  if (/UNIQUE|_pkey$/.test(i.indexdef) || /_pkey$/.test(i.indexname)) continue
  const m = i.indexdef.match(/^CREATE INDEX (\w+) ON public\.(\w+) USING btree \(([\w, ]+)\)(?: WHERE (.+))?$/)
  if (m) ddl.push(`CREATE INDEX ${m[1]} ON ${m[2]} (${m[3]})${m[4] ? ' WHERE ' + pgASqlite(m[4]) : ''};`)
  else avisos.push('índice omitido: ' + i.indexdef)
}
// Índices que en Postgres no hacían falta (los cubría RLS/planificador) y en D1 cada
// fila escaneada se cobra: las búsquedas por FK que hacen las políticas traducidas y las
// pantallas del docente. Solo los de columnas que existen en ESTA exportación.
const existe = (t, c) => tablas[t]?.some((x) => x.column_name === c)
for (const [nombre, t, cols] of [
  ['d1_alumnos_grupos_grupo', 'alumnos_grupos', ['id_grupo']],
  ['d1_alumnos_grupos_alumno', 'alumnos_grupos', ['id_alumno']],
  ['d1_profiles_escuela', 'profiles', ['escuela_id']],
  ['d1_profiles_grupo', 'profiles', ['group_id']],
  ['d1_grupos_profesor', 'grupos', ['id_profesor']],
  ['d1_grupos_escuela', 'grupos', ['escuela_id']],
  ['d1_intentos_usuario', 'intentos', ['user_id', 'status']],
  // Labs: las políticas y las pantallas filtran intentos por alumno y estado, y asignaciones por profesor.
  ['d1_intentos_alumno', 'intentos', ['id_alumno', 'status']],
  ['d1_asignaciones_profesor', 'asignaciones', ['id_profesor']],
  ['d1_progress_usuario', 'progress', ['user_id']],
]) {
  if (cols.every((c) => existe(t, c))) ddl.push(`CREATE INDEX ${nombre} ON ${t} (${cols.join(', ')});`)
  else avisos.push(`índice propio omitido (columna inexistente): ${nombre}`)
}
ddl.push(`-- El login busca por lower(email): sin esto recorre toda la tabla de usuarios.
CREATE INDEX d1_auth_email_lower ON auth_users (lower(email));
CREATE INDEX d1_auth_creado ON auth_users (created_at);`)
// Las vistas no se traducen solas: si producción tiene alguna, que se vea.
for (const v of d.vistas) avisos.push(`vista SIN traducir: ${v.viewname}`)
fs.mkdirSync('d1', { recursive: true })
fs.writeFileSync(ENSAYO ? `${DIR}/esquema.sql` : 'd1/esquema.sql',ddl.join('\n\n') + '\n')

// ── Datos ─────────────────────────────────────────────────────────────────────
const lit = (v, k) => {
  if (v === null || v === undefined) return 'NULL'
  if (k === 'bool') return v ? '1' : '0'
  if (k === 'num') return String(Number(v))
  if (k === 'json' || k === 'arr') return `'${JSON.stringify(v).replace(/'/g, "''")}'`
  if (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v))) return `'${new Date(v).toISOString()}'`
  return `'${String(v).replace(/'/g, "''")}'`
}
const sentencias = []
for (const u of d.auth_users) {
  if (u.deleted_at) continue
  sentencias.push(`INSERT INTO auth_users (id,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,last_sign_in_at,banned_until) VALUES (${[
    lit(u.id), lit(u.email), lit(u.encrypted_password), lit(u.email_confirmed_at), lit(u.raw_app_meta_data ?? {}, 'json'),
    lit(u.raw_user_meta_data ?? {}, 'json'), lit(u.created_at), lit(u.updated_at), lit(u.last_sign_in_at), lit(u.banned_until)].join(',')});`)
}
const cuenta = {}
for (const t of orden) {
  const filas = d.filas[t]
  if (!filas?.length) continue
  const cols = tablas[t]
  cuenta[t] = filas.length
  for (const f of filas) {
    sentencias.push(`INSERT INTO ${t} (${cols.map((c) => c.column_name).join(',')}) VALUES (${cols.map((c) => lit(f[c.column_name], clase(c.udt_name))).join(',')});`)
  }
}
// Trozos de ~8 MB: `wrangler d1 execute --file` los importa uno por uno.
let trozo = [], tam = 0, n = 0
const volcar = () => { if (!trozo.length) return; fs.writeFileSync(`${DIR}/datos-${String(++n).padStart(2, '0')}.sql`, trozo.join('\n') + '\n'); trozo = []; tam = 0 }
for (const s of sentencias) { trozo.push(s); tam += s.length; if (tam > 8e6) volcar() }
volcar()

// ── Metadatos y políticas para la capa compatible ─────────────────────────────
const meta = {}
for (const [t, cols] of Object.entries(tablas)) {
  meta[t] = {
    vista: esVista.has(t),
    cols: Object.fromEntries(cols.map((c) => [c.column_name, clase(c.udt_name)])),
  }
}
const politicas = {}
// Políticas de producción que D1 NO copia, a propósito (huecos). Están también en
// docs/SQL-HUECOS-PRODUCCION.sql para Supabase, y el oráculo las prueba con ORACULO_SQL.
//   progress_select_policy: «docente o admin → ve TODO el progreso», de todas las escuelas
//   (memoria frontera-entre-escuelas). Lo legítimo ya lo cubren alumno_ve_su_progreso,
//   profesor_ve_progreso_de_su_grupo y admin_ve_todo_progreso (solo su escuela).
//   progress_delete_policy: cualquier docente borraba progreso de cualquier escuela. La app no
//   borra progreso; el admin conserva lo suyo por admin_ve_todo_progreso.
// Labs (2026-11-03): ninguna; las dos de arriba son de Financiera y aquí no existen.
const NO_COPIAR = new Set()
for (const p of d.politicas) {
  if (NO_COPIAR.has(`${p.tablename}.${p.policyname}`)) continue
  const roles = p.roles.replace(/[{}]/g, '').split(',')
  // La traducción supone políticas PERMISIVAS (se unen con OR) para anon/authenticated. Una
  // RESTRICTIVA (va con AND) o para otro rol se traduciría mal sin avisar: mejor que truene.
  if (p.permissive && p.permissive !== 'PERMISSIVE') throw new Error(`política ${p.tablename}.${p.policyname} es ${p.permissive}: la traducción no la soporta`)
  const raros = roles.filter((r) => !['anon', 'authenticated', 'public'].includes(r))
  if (raros.length) throw new Error(`política ${p.tablename}.${p.policyname} para ${raros.join(',')}: la traducción no la soporta`)
  ;(politicas[p.tablename] ??= []).push({
    nombre: p.policyname,
    cmd: p.cmd,
    // `public` incluye a anon: en Postgres una política TO public aplica también sin sesión.
    anon: roles.includes('anon') || roles.includes('public'),
    using: p.qual ? politicaSqlite(p.qual, `${p.tablename}.${p.policyname}`) : null,
    check: p.with_check ? politicaSqlite(p.with_check, `${p.tablename}.${p.policyname}`) : null,
  })
}
// Una tabla SIN RLS en producción deja leer y escribir todo con la llave anónima. Aquí se
// negaría todo (sin políticas, '0'): sería un cambio de comportamiento. Que truene y se decida.
for (const r of d.rls ?? []) {
  if (!r.activo && !esVista.has(r.tabla)) avisos.push(`OJO: ${r.tabla} NO tiene RLS en producción (con la llave anónima se lee entera)`)
}

// ── Relaciones (tablas anidadas del select, como PostgREST) ──────────────────
// Por cada FK `T.col → R(id)`: desde T, `R(...)` es UNA fila; desde R, `T(...)` son VARIAS.
// Si dos FK unen el mismo par, PostgREST pide desambiguar: aquí se deja fuera y se avisa.
const relaciones = {}
const ambiguas = new Set()
const poner = (t, r, v) => {
  relaciones[t] ??= {}
  if (relaciones[t][r]) ambiguas.add(`${t}.${r}`)
  relaciones[t][r] = v
}
for (const [t, rs] of Object.entries(restr)) for (const r of rs) {
  const m = r.contype === 'f' && r.def.match(/^FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/)
  if (!m || !tablas[m[2]]) continue
  poner(t, m[2], { tipo: 'uno', local: m[1], remota: m[3] })
  poner(m[2], t, { tipo: 'muchos', local: m[3], remota: m[1] })
}
for (const a of ambiguas) { const [t, r] = a.split('.'); delete relaciones[t][r]; avisos.push(`relación ambigua omitida: ${a}`) }

// ── Permisos por columna (manual 2b) ──────────────────────────────────────────
// Si `authenticated` tiene SELECT sobre la tabla, ve todas las columnas. Si no, solo las que
// tenga por columna; las demás quedan REVOCADAS para cualquier sesión de usuario.
const revocadas = {}
for (const [t, cols] of Object.entries(tablas)) {
  const porTabla = (d.permisos_tabla ?? []).some((g) => g.table_name === t && g.grantee === 'authenticated' && g.privilege_type === 'SELECT')
  if (porTabla) continue
  const legibles = new Set((d.permisos_columna ?? []).filter((g) => g.table_name === t && g.grantee === 'authenticated' && g.privilege_type === 'SELECT').map((g) => g.column_name))
  const fuera = cols.map((c) => c.column_name).filter((c) => !legibles.has(c))
  if (fuera.length) { revocadas[t] = fuera; avisos.push(`columnas sin SELECT para authenticated en ${t}: ${fuera.join(', ')}`) }
}
fs.mkdirSync('src/lib/d1', { recursive: true })
fs.writeFileSync(ENSAYO ? `${DIR}/esquema.gen.ts` : 'src/lib/d1/esquema.gen.ts', `// GENERADO por scripts/d1/generar.mjs — no editar a mano.
// Columnas por tabla (clase de valor) y políticas RLS de Postgres traducidas a SQLite.
// En las políticas, {{uid}} {{role}} {{jwtrole}} los sustituye la capa compatible con
// literales del usuario de la petición.
export type ClaseCol = 'txt' | 'num' | 'bool' | 'json' | 'arr'
export const TABLAS: Record<string, { vista: boolean; cols: Record<string, ClaseCol> }> = ${JSON.stringify(meta, null, 2)}

export type Politica = { nombre: string; cmd: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'; anon: boolean; using: string | null; check: string | null }
export const POLITICAS: Record<string, Politica[]> = ${JSON.stringify(politicas, null, 2)}

export type Relacion = { tipo: 'uno' | 'muchos'; local: string; remota: string }
export const RELACIONES: Record<string, Record<string, Relacion>> = ${JSON.stringify(relaciones, null, 2)}

/** Funciones de public que existen en producción: rpc.ts responde PGRST202 a las demás, como PostgREST. */
export const FUNCIONES: readonly string[] = ${JSON.stringify([...new Set(d.funciones.map((f) => f.proname))].sort())}

/** Columnas que una sesión de usuario no puede leer (permisos por columna de producción). */
export const REVOCADAS: Record<string, ReadonlySet<string>> = {${Object.entries(revocadas).map(([t, c]) => `\n  ${t}: new Set(${JSON.stringify(c)}),`).join('')}
}
`)

console.log('tablas', orden.length, 'sentencias', sentencias.length, 'trozos', n)
console.log(avisos.join('\n'))
