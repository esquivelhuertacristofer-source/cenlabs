import { simplificar } from './simplificar'
import 'server-only'
import { POLITICAS, RELACIONES, REVOCADAS, TABLAS, type ClaseCol, type Politica } from '@/lib/d1/esquema.gen'

// =============================================================================
// Labs sobre D1 — constructor de consultas con la misma forma que supabase-js
// (`from().select().eq().order()…`), traducido a SQL de SQLite sobre D1. Es la capa
// de Financiera (financiera-d1, en producción desde 2026-11-02), que a su vez es la de
// NEM (2026-10-31), adaptada a Labs el 2026-11-03.
//
// La seguridad que en Postgres hacía RLS la hace esta capa: con un contexto de
// USUARIO, a cada SELECT/UPDATE/DELETE se le añade el USING de las políticas de su
// tabla (las de producción, traducidas en esquema.gen.ts), y cada INSERT se valida
// contra su WITH CHECK antes de escribir. Sin política aplicable, se niega todo,
// como Postgres con RLS activo. El contexto de SERVICIO (lo que antes era la
// service_role) no filtra nada: el código que lo usa ya filtra escuela a mano.
//
// Lo propio de Labs:
//  · el trigger cen_proteger_perfil (hotfix de producción del 2026-11-03): con sesión de
//    usuario nadie cambia el rol, el id ni el correo de un perfil, ni crea uno que no sea alumno;
//  · tablas anidadas en el select (`*, profiles(full_name)`), como PostgREST:
//    la tabla anidada pasa TAMBIÉN por sus propias políticas.
// =============================================================================

export type Contexto =
  | { servicio: true }
  | {
      servicio: false
      uid: string | null
      role: string | null
    }

export type ErrorD1 = { message: string; code: string; details: string | null; hint: string | null }
type Resultado = { data: unknown; error: ErrorD1 | null; count: number | null; status: number; statusText: string }

const IDENT = /^[a-z_][a-z0-9_]*$/
// Sin limit()/range(), PostgREST devuelve a lo más 1,000 filas (max-rows de Supabase). Sin este
// tope, D1 entregaba las 12k actividades de golpe (/aula/admin) y todo eso quedaba en memoria y
// en KV. Un tope EXPLÍCITO sí se respeta (hasta 100,000): el catálogo de misiones ya pide todo
// en una consulta a propósito, y cortarlo a 1,000 vació la mitad de /aula/actividades (medido
// en la comparación con producción del 2026-10-29).
const MAX_FILAS = 1000
const MAX_EXPLICITO = 100_000
// Permisos por columna (manual 2b): las columnas que anon/authenticated NO pueden leer en
// producción salen de la exportación (`permisos_columna`) y las escribe generar.mjs en
// REVOCADAS. Con la sesión de un usuario, `*` las omite y pedirlas es 42501, como allá.

function err(message: string, code: string): ErrorD1 {
  return { message, code, details: null, hint: null }
}

/** Traduce el mensaje de SQLite al código SQLSTATE que el código ya revisa (23505…). */
function errorDeD1(e: unknown): ErrorD1 {
  const m = e instanceof Error ? e.message : String(e)
  const code = /UNIQUE constraint/i.test(m) ? '23505'
    : /FOREIGN KEY constraint/i.test(m) ? '23503'
    : /CHECK constraint/i.test(m) ? '23514'
    : /NOT NULL constraint/i.test(m) ? '23502'
    : 'D1000'
  return err(m.replace(/^D1_ERROR:\s*/, ''), code)
}

const q = (v: string) => `'${v.replace(/'/g, "''")}'`

/** Sustituye {{uid}}… por literales del usuario de la petición. */
function sustituir(expr: string, ctx: Extract<Contexto, { servicio: false }>): string {
  const UUID = /^[0-9a-f-]{36}$/i
  const lit = (v: string | null, ok: RegExp) => (v && ok.test(v) ? q(v) : 'NULL')
  return expr
    .replace(/\{\{uid\}\}/g, lit(ctx.uid, UUID))
    .replace(/\{\{role\}\}/g, lit(ctx.role, /^[a-z_]+$/))
    // auth.role() de Supabase: el rol del JWT, no el del perfil.
    .replace(/\{\{jwtrole\}\}/g, ctx.uid ? `'authenticated'` : `'anon'`)
}

export type Cmd = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'

/** OR de las políticas permisivas aplicables, o '0' si no hay ninguna. También la usan las RPC (rpc.ts). */
export function politica(tabla: string, cmd: Cmd, ctx: Contexto, campo: 'using' | 'check'): string | null {
  if (ctx.servicio) return null
  if (TABLAS[tabla]?.vista) return null // las vistas corren como su dueño en Postgres
  const aplicables = (POLITICAS[tabla] ?? []).filter(
    (p: Politica) => (p.cmd === cmd || p.cmd === 'ALL') && (ctx.uid ? true : p.anon),
  )
  const exprs = aplicables
    .map((p) => (campo === 'check' ? (p.check ?? p.using) : p.using))
    .filter((x): x is string => !!x)
  if (!exprs.length) return '0'
  // Sin las ramas de otros roles (ya se sabe el rol), para que D1 use los índices: ver simplificar.ts.
  return simplificar(exprs.map((x) => `(${sustituir(x, ctx)})`).join(' OR '))
}

function aSql(v: unknown, clase: ClaseCol | undefined): unknown {
  if (v === undefined || v === null) return null
  if (typeof v === 'boolean') return v ? 1 : 0
  if (clase === 'json' || clase === 'arr') return typeof v === 'string' && clase === 'json' ? JSON.stringify(v) : JSON.stringify(v)
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}

function deSql(fila: Record<string, unknown>, tabla: string): Record<string, unknown> {
  const cols = TABLAS[tabla]?.cols ?? {}
  for (const k of Object.keys(fila)) {
    const c = cols[k]
    const v = fila[k]
    if (v === null || v === undefined) continue
    if (c === 'bool') fila[k] = v === 1 || v === true || v === '1'
    else if ((c === 'json' || c === 'arr') && typeof v === 'string') {
      try { fila[k] = JSON.parse(v) } catch { /* texto que no es JSON: se devuelve tal cual */ }
    }
  }
  return fila
}

/** `%x_%` de LIKE (sensible a mayúsculas, como en Postgres) → patrón GLOB. */
function likeAGlob(p: string): string {
  return p.replace(/[[*?]/g, (c) => `[${c}]`).replace(/%/g, '*').replace(/_/g, '?')
}

// D1 rechaza los patrones LIKE/GLOB de más de 50 bytes («LIKE or GLOB pattern too complex»);
// Postgres no tiene tope. Medido el 2026-10-29: 50 entra, 51 no. Sin esto, buscar una frase
// larga («cómo se calcula el área de un triángulo rectángulo») tiraba la página.
const TOPE_PATRON = 50
const bytes = (s: string) => new TextEncoder().encode(s).length

/**
 * `lower()` de SQLite solo baja las letras ASCII; el ILIKE de Postgres baja todas. Los nombres de
 * las escuelas llegan en MAYÚSCULAS («JOSÉ NÚÑEZ»): sin esto, buscar «josé» no los encontraba.
 * Se bajan a mano las del español; el patrón se baja en JS (toLowerCase sí es Unicode).
 */
function minusculas(col: string): string {
  let e = `lower(${col})`
  for (const [m, n] of [['Á', 'á'], ['É', 'é'], ['Í', 'í'], ['Ó', 'ó'], ['Ú', 'ú'], ['Ü', 'ü'], ['Ñ', 'ñ']]) e = `replace(${e}, '${m}', '${n}')`
  return e
}

/** El texto de un patrón sin comodines (para comparar con =), o null si tiene alguno. */
function literalDeLike(p: string): string | null {
  let out = ''
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '\\' && i + 1 < p.length) { out += p[++i]; continue }
    if (p[i] === '%' || p[i] === '_') return null
    out += p[i]
  }
  return out
}

/**
 * Un patrón que no cabe se recorta: se queda su principio y termina en %. Trae lo mismo
 * y quizá algo más, nunca menos (sirve para buscar; nada de permisos pasa por LIKE).
 */
function recortarPatron(p: string, medir: (s: string) => number): string {
  if (medir(p) <= TOPE_PATRON) return p
  let out = ''
  for (let i = 0; i < p.length; i++) {
    let trozo = p[i]
    // Un escape (\%) o un carácter de dos unidades (emoji) no se parte.
    if ((trozo === '\\' || /[\uD800-\uDBFF]/.test(trozo)) && i + 1 < p.length) trozo += p[++i]
    if (medir(out + trozo + '%') > TOPE_PATRON) break
    out += trozo
  }
  return out.endsWith('%') && !out.endsWith('\\%') ? out : out + '%'
}

/**
 * WITH CHECK de INSERT/UPDATE sobre filas que se van a escribir; lanza 42501 si alguna no pasa,
 * con el mensaje de Postgres. También lo usan las RPC (record_intento).
 */
export async function verificarCheck(db: D1Database, ctx: Contexto, tabla: string, cmd: 'INSERT' | 'UPDATE', filas: Record<string, unknown>[], onQuery?: () => void) {
  const chk = politica(tabla, cmd, ctx, 'check')
  if (!chk || !filas.length) return
  const cols = Object.keys(TABLAS[tabla].cols)
  const proy = cols.map((c) => `json_extract(value, '$.${c}') AS ${c}`).join(', ')
  const sql = `SELECT 1 AS x FROM (SELECT ${proy} FROM json_each(?)) AS ${tabla} WHERE NOT COALESCE((${chk}), 0) LIMIT 1`
  const json = JSON.stringify(filas.map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, aSql(v, TABLAS[tabla].cols[k])]))))
  onQuery?.()
  const r = await db.prepare(sql).bind(json).first()
  if (r) throw Object.assign(new Error(`new row violates row-level security policy for table "${tabla}"`), { code: '42501' })
}

export class Consulta implements PromiseLike<Resultado> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private columnas = '*'
  private retorno: string | null = null
  private filtros: { sql: string; params: unknown[] }[] = []
  private ordenes: string[] = []
  private lim: number | null = null
  private desde: number | null = null
  private modoUno: 'single' | 'maybe' | null = null
  private conteo = false
  private soloConteo = false
  private valores: Record<string, unknown>[] = []
  private parche: Record<string, unknown> = {}
  private conflicto: string | null = null
  private ignorarDuplicados = false
  private anidadas: { rel: string; alias: string; cols: string; tipo: 'uno' | 'muchos'; local: string; remota: string }[] = []
  private ocultas = new Set<string>()

  constructor(private db: D1Database, private ctx: Contexto, private tabla: string, private onQuery?: () => void) {
    if (!TABLAS[tabla]) throw new Error(`[d1] tabla desconocida: ${tabla}`)
  }

  /** `escribir`: columna de un INSERT/UPDATE (la migración 10 solo quitó el permiso de LEER). */
  private col(c: string, escribir = false): string {
    if (!IDENT.test(c) || !(c in TABLAS[this.tabla].cols)) throw new Error(`[d1] columna desconocida ${this.tabla}.${c}`)
    if (!escribir && !this.ctx.servicio && REVOCADAS[this.tabla]?.has(c))
      throw Object.assign(new Error(`permission denied for table ${this.tabla}`), { code: '42501' })
    return c
  }

  private todasLasCols(): string {
    const fuera = this.ctx.servicio ? undefined : REVOCADAS[this.tabla]
    return fuera ? Object.keys(TABLAS[this.tabla].cols).filter((c) => !fuera.has(c)).join(', ') : '*'
  }

  /**
   * Columnas del select. Un trozo `tabla(cols)` es una tabla anidada (como en PostgREST):
   * se apunta en `anidadas` y se resuelve después con una segunda consulta por relación
   * (ver `anidar`). La columna de enlace se pide aunque no se haya pedido, y se quita al final.
   */
  private listaCols(s: string, anidar = false): string {
    // Como supabase-js, que quita todo espacio del select antes de enviarlo: Labs escribe
    // `alumnos_grupos ( grupos ( nombre ) )` (AlumnosContent, TopAlumnos, LatestDeliveries).
    const t = s.replace(/\s+/g, '')
    if (!t || t === '*') return this.todasLasCols()
    const partes: string[] = []
    let prof = 0, ini = 0
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '(') prof++
      else if (t[i] === ')') prof--
      else if (t[i] === ',' && prof === 0) { partes.push(t.slice(ini, i)); ini = i + 1 }
    }
    partes.push(t.slice(ini))
    const sql: string[] = []
    const nombres = new Set<string>()
    let todas = false
    for (const x of partes.map((p) => p.trim()).filter(Boolean)) {
      const m = x.match(/^(?:(\w+):)?(\w+)\(([\s\S]*)\)$/)
      if (m) {
        const [, alias, rel, cols] = m
        const r = RELACIONES[this.tabla]?.[rel]
        if (!anidar || !r) throw new Error(`[d1] relación desconocida ${this.tabla} → ${rel}`)
        this.anidadas.push({ rel, alias: alias ?? rel, cols, ...r })
        continue
      }
      if (x === '*') { sql.push(this.todasLasCols()); todas = true; continue }
      const [a, b] = x.split(':').map((y) => y.trim())
      if (b) { sql.push(`${this.col(b)} AS ${IDENT.test(a) ? a : this.col(a)}`); nombres.add(IDENT.test(a) ? a : b) }
      else { sql.push(this.col(a)); nombres.add(a) }
    }
    // La columna local de cada relación tiene que venir en la fila para poder enlazar; si no
    // se pidió, se agrega y se quita al final (`ocultas`).
    for (const a of this.anidadas) {
      if (todas || nombres.has(a.local)) continue
      sql.push(`${this.col(a.local)}`)
      nombres.add(a.local)
      this.ocultas.add(a.local)
    }
    return sql.join(', ') || this.todasLasCols()
  }

  /** Resuelve las tablas anidadas de un select ya leído. Cada una con las políticas de SU tabla. */
  private async anidar(filas: Record<string, unknown>[]) {
    for (const a of this.anidadas) {
      const llaves = [...new Set(filas.map((f) => f[a.local]).filter((v) => v != null))]
      let relacionadas: Record<string, unknown>[] = []
      if (llaves.length) {
        const sub = new Consulta(this.db, this.ctx, a.rel, this.onQuery)
        const cols = a.cols.trim() === '*' ? '*' : `${a.cols}, ${a.remota}`
        const r = await sub.select(cols).in(a.remota, llaves).limit(MAX_EXPLICITO)
        if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code })
        relacionadas = (r.data as Record<string, unknown>[]) ?? []
      }
      const pedidaRemota = a.cols.trim() === '*' || a.cols.split(',').map((c) => c.trim()).includes(a.remota)
      const limpia = (f: Record<string, unknown>) => {
        if (pedidaRemota) return f
        const { [a.remota]: _quitada, ...resto } = f
        void _quitada
        return resto
      }
      for (const f of filas) {
        const suyas = relacionadas.filter((x) => x[a.remota] === f[a.local])
        f[a.alias] = a.tipo === 'uno' ? (suyas[0] ? limpia(suyas[0]) : null) : suyas.map(limpia)
      }
    }
    for (const f of filas) for (const c of this.ocultas) delete f[c]
  }

  // ── Operaciones ────────────────────────────────────────────────────────────
  select(cols = '*', opts?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (this.op === 'select') {
      this.columnas = this.listaCols(cols, true)
      if (opts?.count) this.conteo = true
      if (opts?.head) this.soloConteo = true
    } else {
      this.retorno = this.listaCols(cols)
    }
    return this
  }
  insert(v: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = 'insert'; this.valores = Array.isArray(v) ? v : [v]; return this
  }
  upsert(v: Record<string, unknown> | Record<string, unknown>[], o?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = 'upsert'; this.valores = Array.isArray(v) ? v : [v]
    this.conflicto = o?.onConflict ?? null; this.ignorarDuplicados = !!o?.ignoreDuplicates; return this
  }
  update(v: Record<string, unknown>) { this.op = 'update'; this.parche = v; return this }
  delete() { this.op = 'delete'; return this }

  // ── Filtros ────────────────────────────────────────────────────────────────
  private f(sql: string, ...params: unknown[]) { this.filtros.push({ sql, params }); return this }
  eq(c: string, v: unknown) { return this.f(`${this.col(c)} = ?`, aSql(v, TABLAS[this.tabla].cols[c])) }
  neq(c: string, v: unknown) { return this.f(`${this.col(c)} <> ?`, aSql(v, undefined)) }
  gt(c: string, v: unknown) { return this.f(`${this.col(c)} > ?`, aSql(v, undefined)) }
  gte(c: string, v: unknown) { return this.f(`${this.col(c)} >= ?`, aSql(v, undefined)) }
  lt(c: string, v: unknown) { return this.f(`${this.col(c)} < ?`, aSql(v, undefined)) }
  lte(c: string, v: unknown) { return this.f(`${this.col(c)} <= ?`, aSql(v, undefined)) }
  like(c: string, p: string) { return this.f(...this.sqlLike(c, p, false)) }
  ilike(c: string, p: string) { return this.f(...this.sqlLike(c, p, true)) }
  /** LIKE/ILIKE dentro del tope de D1: sin comodines es una igualdad; si no cabe, se recorta. */
  private sqlLike(c: string, p: string, sinMayusculas: boolean): [string, string] {
    const col = this.col(c)
    const lit = literalDeLike(p)
    if (lit !== null) return sinMayusculas ? [`${minusculas(col)} = ?`, lit.toLowerCase()] : [`${col} = ?`, lit]
    return sinMayusculas
      ? [`${minusculas(col)} LIKE ? ESCAPE '\\'`, recortarPatron(p.toLowerCase(), bytes)]
      : [`${col} GLOB ?`, likeAGlob(recortarPatron(p, (s) => bytes(likeAGlob(s))))]
  }
  is(c: string, v: null | boolean) {
    return this.f(`${this.col(c)} IS ${v === null ? 'NULL' : v ? '1' : '0'}`)
  }
  in(c: string, vs: readonly unknown[]) {
    // Una sola variable aunque la lista sea larga: D1 admite 100 por sentencia.
    return this.f(`${this.col(c)} IN (SELECT value FROM json_each(?))`, JSON.stringify(vs.map((v) => aSql(v, undefined))))
  }
  match(o: Record<string, unknown>) { for (const [k, v] of Object.entries(o)) this.eq(k, v); return this }
  /** Subconjunto de la sintaxis de PostgREST: `col.op.valor,col.op.valor` (op: eq, neq, is, in, like, ilike, gt…). */
  or(expr: string) {
    const partes: string[] = []
    let prof = 0, ini = 0
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') prof++
      else if (expr[i] === ')') prof--
      else if (expr[i] === ',' && prof === 0) { partes.push(expr.slice(ini, i)); ini = i + 1 }
    }
    partes.push(expr.slice(ini))
    const sqls: string[] = []
    const params: unknown[] = []
    for (const p of partes) {
      const m = p.trim().match(/^(\w+)\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.([\s\S]*)$/)
      if (!m) throw new Error(`[d1] .or() no soportado: ${p}`)
      const [, c, op, val] = m
      const col = this.col(c)
      if (op === 'is') sqls.push(`${col} IS ${val === 'null' ? 'NULL' : val === 'true' ? '1' : '0'}`)
      else if (op === 'in') {
        sqls.push(`${col} IN (SELECT value FROM json_each(?))`)
        params.push(JSON.stringify(val.replace(/^\(|\)$/g, '').split(',').map((x) => x.trim().replace(/^"|"$/g, ''))))
      } else if (op === 'ilike' || op === 'like') {
        const [s, v] = this.sqlLike(c, val.replace(/\*/g, '%'), op === 'ilike')
        sqls.push(s); params.push(v)
      }
      else {
        const sim = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[op]
        sqls.push(`${col} ${sim} ?`); params.push(val)
      }
    }
    return this.f(`(${sqls.join(' OR ')})`, ...params)
  }

  // ── Modificadores ──────────────────────────────────────────────────────────
  order(c: string, o?: { ascending?: boolean; nullsFirst?: boolean }) {
    const asc = o?.ascending ?? true
    // Postgres: ASC pone los NULL al final, DESC al principio. SQLite al revés: se explicita.
    const nf = o?.nullsFirst ?? !asc
    this.ordenes.push(`${this.col(c)} ${asc ? 'ASC' : 'DESC'} NULLS ${nf ? 'FIRST' : 'LAST'}`)
    return this
  }
  limit(n: number) { this.lim = n; return this }
  range(a: number, b: number) { this.desde = a; this.lim = b - a + 1; return this }
  single() { this.modoUno = 'single'; return this }
  maybeSingle() { this.modoUno = 'maybe'; return this }

  // ── Ejecución ──────────────────────────────────────────────────────────────
  private where(cmd: Cmd): { sql: string; params: unknown[] } {
    const partes = this.filtros.map((f) => f.sql)
    const params = this.filtros.flatMap((f) => f.params)
    const pol = politica(this.tabla, cmd, this.ctx, 'using')
    if (pol) partes.push(`(${pol})`)
    return { sql: partes.length ? ` WHERE ${partes.join(' AND ')}` : '', params }
  }

  private async todas(sql: string, params: unknown[]): Promise<Record<string, unknown>[]> {
    this.onQuery?.()
    const r = await this.db.prepare(sql).bind(...params).all()
    return (r.results as Record<string, unknown>[]).map((f) => deSql(f, this.tabla))
  }

  /** WITH CHECK de INSERT/UPDATE sobre las filas nuevas; lanza si alguna no pasa. */
  private async verificarCheck(cmd: 'INSERT' | 'UPDATE', filas: Record<string, unknown>[]) {
    await verificarCheck(this.db, this.ctx, this.tabla, cmd, filas, this.onQuery)
  }

  /** Triggers de producción que dependen de QUIÉN escribe (no aplican al contexto de servicio). */
  private triggers(filas: Record<string, unknown>[], viejas?: Record<string, unknown>[]) {
    const ctx = this.ctx
    if (ctx.servicio) return
    // cen_proteger_perfil (hotfix de producción del 2026-11-03), BEFORE INSERT OR UPDATE de
    // profiles. Allá, por la API, el rol/id/correo se quedan como estaban en silencio y un perfil
    // nuevo toma el rol de su alta. Aquí es más estricto y más visible: con sesión de USUARIO se
    // RECHAZA (P0001) cambiarlos, y crear un perfil que no sea alumno. El servidor (contexto de
    // servicio) es el único que nombra docentes y admins. `distinto` = IS DISTINCT FROM.
    if (this.tabla === 'profiles') {
      const distinto = (a: unknown, b: unknown) => (a ?? null) !== (b ?? null)
      const alto = (m: string) => { throw Object.assign(new Error(`Seguridad: ${m}`), { code: 'P0001' }) }
      if (viejas) {
        viejas.forEach((old, i) => {
          const neu = filas[i]
          if (distinto(neu.role, old.role)) alto('Nadie puede cambiar su rol desde su sesión.')
          if (distinto(neu.id, old.id)) alto('No se puede cambiar el id de un perfil.')
          if (distinto(neu.email, old.email)) alto('El correo solo lo cambia CEN.')
        })
      } else {
        for (const f of filas) if ((f.role ?? 'alumno') !== 'alumno') alto('Un perfil creado desde una sesión solo puede ser de alumno.')
      }
    }
    // Más estricto que producción (2026-11-03): allá la política «Profesores gestionan sus propias
    // asignaciones» solo pide id_profesor = la sesión, así que un ALUMNO también podía planear
    // prácticas a su nombre. La pantalla (CalendarPanel) es del docente.
    if (this.tabla === 'asignaciones' && ctx.role !== 'profesor' && ctx.role !== 'admin') {
      throw Object.assign(new Error('Seguridad: solo un docente planea prácticas.'), { code: 'P0001' })
    }
  }

  private async ejecutar(): Promise<Resultado> {
    const t = this.tabla
    const cols = TABLAS[t].cols
    let data: unknown = null
    let count: number | null = null

    if (this.op === 'select') {
      const w = this.where('SELECT')
      if (this.conteo) {
        this.onQuery?.()
        const r = await this.db.prepare(`SELECT count(*) AS n FROM ${t}${w.sql}`).bind(...w.params).first<{ n: number }>()
        count = r?.n ?? 0
      }
      if (!this.soloConteo) {
        let sql = `SELECT ${this.columnas} FROM ${t}${w.sql}`
        if (this.ordenes.length) sql += ` ORDER BY ${this.ordenes.join(', ')}`
        // Siempre con tope, y nunca negativo: SQLite toma LIMIT -1 como «sin límite».
        const lim = Number.isFinite(this.lim) ? Math.min(MAX_EXPLICITO, Math.max(0, Math.trunc(this.lim!))) : MAX_FILAS
        sql += ` LIMIT ${lim}`
        if (this.desde != null) sql += ` OFFSET ${Math.max(0, Math.trunc(Number.isFinite(this.desde) ? this.desde : 0))}`
        const filas = await this.todas(sql, w.params)
        if (this.anidadas.length) await this.anidar(filas)
        data = filas
      }
    } else if (this.op === 'insert' || this.op === 'upsert') {
      // En Postgres el ON CONFLICT DO UPDATE dispara cen_proteger_perfil; aquí ese guardia solo
      // corre en update(). Con sesión de usuario no hay upsert de profiles: que truene en vez de
      // dejar cambiarse el rol (era la escalada a admin cerrada el 2026-11-03).
      if (this.op === 'upsert' && t === 'profiles' && !this.ctx.servicio)
        throw Object.assign(new Error('upsert de profiles con sesión de usuario: usa update() (el guardia de rol no corre en upsert)'), { code: '42501' })
      const filas = this.valores.map((v) => ({ ...v }))
      this.triggers(filas)
      await this.verificarCheck('INSERT', filas)
      const claves = [...new Set(filas.flatMap((f) => Object.keys(f)))].map((c) => this.col(c, true))
      const json = JSON.stringify(filas.map((f) => Object.fromEntries(claves.map((k) => [k, aSql(f[k], cols[k])]))))
      let sql = `INSERT INTO ${t} (${claves.join(', ')}) SELECT ${claves.map((c) => `json_extract(value, '$.${c}')`).join(', ')} FROM json_each(?) WHERE 1`
      if (this.op === 'upsert') {
        const objetivo = (this.conflicto ?? 'id').split(',').map((c) => this.col(c.trim()))
        if (this.ignorarDuplicados) sql += ` ON CONFLICT (${objetivo.join(', ')}) DO NOTHING`
        else {
          const set = claves.filter((c) => !objetivo.includes(c)).map((c) => `${c} = excluded.${c}`)
          const pol = politica(t, 'UPDATE', this.ctx, 'using')
          sql += set.length ? ` ON CONFLICT (${objetivo.join(', ')}) DO UPDATE SET ${set.join(', ')}${pol ? ` WHERE ${pol}` : ''}` : ` ON CONFLICT (${objetivo.join(', ')}) DO NOTHING`
        }
      }
      if (this.retorno) sql += ` RETURNING ${this.retorno}`
      data = await this.todas(sql, [json])
      if (!this.retorno) data = null
    } else if (this.op === 'update') {
      const w = this.where('UPDATE')
      const parche = { ...this.parche }
      const claves = Object.keys(parche).map((c) => this.col(c, true))
      if (!this.ctx.servicio) {
        // Filas que el usuario puede tocar, para pasar el WITH CHECK y los triggers con el valor nuevo.
        const viejas = await this.todas(`SELECT * FROM ${t}${w.sql}`, w.params)
        const nuevas = viejas.map((v) => ({ ...v, ...parche }))
        this.triggers(nuevas, viejas)
        await this.verificarCheck('UPDATE', nuevas)
      }
      const set = Object.keys(parche).map((c) => `${this.col(c, true)} = ?`)
      if (!claves.length) return { data: [], error: null, count: null, status: 204, statusText: 'No Content' }
      let sql = `UPDATE ${t} SET ${set.join(', ')}${w.sql}`
      if (this.retorno) sql += ` RETURNING ${this.retorno}`
      data = await this.todas(sql, [...Object.keys(parche).map((k) => aSql(parche[k], cols[k])), ...w.params])
      if (!this.retorno) data = null
    } else {
      const w = this.where('DELETE')
      let sql = `DELETE FROM ${t}${w.sql}`
      if (this.retorno) sql += ` RETURNING ${this.retorno}`
      data = await this.todas(sql, w.params)
      if (!this.retorno) data = null
    }

    if (this.modoUno) {
      const filas = (data as unknown[] | null) ?? []
      if (filas.length > 1) return { data: null, error: err('JSON object requested, multiple (or no) rows returned', 'PGRST116'), count, status: 406, statusText: 'Not Acceptable' }
      if (!filas.length && this.modoUno === 'single') return { data: null, error: err('JSON object requested, multiple (or no) rows returned', 'PGRST116'), count, status: 406, statusText: 'Not Acceptable' }
      data = filas[0] ?? null
    }
    return { data, error: null, count, status: 200, statusText: 'OK' }
  }

  then<A = Resultado, B = never>(ok?: ((v: Resultado) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return this.ejecutar()
      .catch((e: unknown): Resultado => {
        const code = (e as { code?: string })?.code
        const error = code ? err((e as Error).message, code) : errorDeD1(e)
        return { data: null, error, count: null, status: 400, statusText: 'Bad Request' }
      })
      .then(ok, ko)
  }
}
