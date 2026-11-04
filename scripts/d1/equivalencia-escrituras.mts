// =============================================================================
// ¿Cada ESCRITURA, con cada rol, da lo mismo en D1 que en producción?
//   npx tsx --conditions=react-server scripts/d1/equivalencia-escrituras.mts
//
// Misma secuencia de escrituras en los dos lados, con la sesión de cada actor:
//   · Postgres local con lo exportado de producción (oraculo-pg.mts): políticas, triggers y
//     funciones de producción tal cual;
//   · la capa D1 de la app (Consulta / llamarRpc) sobre la D1 LOCAL con los mismos datos.
// Tras cada intento se compara: si se aceptó o se rechazó, y la tabla tocada COMPLETA (sin las
// columnas que pone el reloj o un id aleatorio). Las escrituras se acumulan igual en los dos.
// ENSUCIA la D1 local: al final se vuelve a cargar con scripts/d1/recargar-local.sh.
// Diferencias deliberadas (huecos que D1 cierra) se marcan y no cuentan como falla.
// No imprime datos: solo nombres de escenario, rol y resultado.
// =============================================================================
import { getPlatformProxy } from 'wrangler'
import { Consulta, type Contexto } from '../../src/lib/d1/consulta'
import { llamarRpc } from '../../src/lib/d1/rpc'
import { armarOraculo, q } from './oraculo-pg.mts'

const { pg, d, tablas, comoUsuario } = await armarOraculo()
const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>()
const db = env.DB

// --- Columnas comparables: fuera las del reloj y los ids aleatorios ---
const tipos: Record<string, Record<string, string>> = {}
const estables: Record<string, string[]> = {}
for (const t of tablas) {
  const cols = d.columnas.filter((c: any) => c.table_name === t)
  tipos[t] = Object.fromEntries(cols.map((c: any) => [c.column_name, c.udt_name]))
  estables[t] = cols.filter((c: any) => !['timestamptz', 'timestamp', 'date'].includes(c.udt_name) &&
    !/gen_random_uuid|uuid_generate|nextval|now\(\)/.test(c.column_default ?? '')).map((c: any) => c.column_name)
}
const orden = (v: any): any => Array.isArray(v) ? v.map(orden) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, orden(v[k])])) : v
function norm(v: unknown, tipo: string): string {
  if (v === null || v === undefined) return '∅'
  if (tipo === 'bool') return v === true || v === 1 || v === '1' || v === 'true' || v === 't' ? 't' : 'f'
  if (['int2', 'int4', 'int8', 'numeric', 'float8'].includes(tipo)) return String(Number(v))
  if (tipo === 'jsonb' || tipo === 'json') return JSON.stringify(orden(typeof v === 'string' ? JSON.parse(v) : v))
  return String(v)
}
const huella = (t: string, filas: any[]) => filas.map((f) => estables[t].map((c) => norm(f[c], tipos[t][c])).join('¦'))
const filasDe = (h: string) => (h ? h.split(/\n/).length : 0)
/** Lo que cambió: filas que salen (−) y que entran (+), como multiconjunto ordenado. */
function delta(antes: string[], despues: string[]): string {
  const cuenta = new Map<string, number>()
  for (const f of antes) cuenta.set(f, (cuenta.get(f) ?? 0) - 1)
  for (const f of despues) cuenta.set(f, (cuenta.get(f) ?? 0) + 1)
  return [...cuenta].filter(([, n]) => n).map(([f, n]) => `${n > 0 ? '+' : '−'}${Math.abs(n)} ${f}`).sort().join('\n')
}
async function tablaPg(t: string) { return huella(t, (await pg.query(`SELECT * FROM public.${q(t)}`)).rows as any[]) }
async function tablaD1(t: string) {
  const filas: any[] = []
  for (let i = 0; ; i += 1000) {
    const r = (await (new Consulta(db, { servicio: true }, t) as any).select('*').range(i, i + 999)) as { data: any[] }
    filas.push(...r.data); if (r.data.length < 1000) break
  }
  return huella(t, filas)
}

// --- Actores de Labs (2026-11-03), elegidos de los datos ---
const P: any[] = d.filas.profiles
const grupos: any[] = d.filas.grupos
const ag: any[] = d.filas.alumnos_grupos
const docenteDe = (u: any) => grupos.find((g) => g.id_profesor && ag.some((x) => x.id_alumno === u.id && x.id_grupo === g.id))
const alumno = P.find((u) => u.role === 'alumno' && docenteDe(u))
const grupoAlumno = docenteDe(alumno)
const docente = P.find((u) => u.id === grupoAlumno.id_profesor)
const compañero = P.find((u) => u.role === 'alumno' && u.id !== alumno.id)
const sinGrupo = P.find((u) => u.role === 'alumno' && !ag.some((x) => x.id_alumno === u.id))
const docenteSinGrupos = P.find((u) => u.role === 'profesor' && !grupos.some((g) => g.id_profesor === u.id))
const admin = P.find((u) => u.role === 'admin')
const actores = [
  { nombre: 'anónimo', u: null as any },
  { nombre: 'alumno', u: alumno },
  { nombre: 'docente', u: docente },
  { nombre: 'docente sin grupos', u: docenteSinGrupos },
  { nombre: 'admin', u: admin },
]
const ctxDe = (u: any): Contexto => (u ? { servicio: false, uid: u.id, role: u.role } : { servicio: false, uid: null, role: null }) as Contexto

// --- Escenarios (se corren con cada actor; `yo` es el actor) ---
type Esc = { nombre: string; esperada?: string; tabla: string; op: 'insert' | 'upsert' | 'update' | 'delete'; valores?: Record<string, unknown>; filtro?: Record<string, unknown>; onConflict?: string }
  | { nombre: string; rpc: string; args: Record<string, unknown>; tabla: string; tipos: string[]; esperada?: string }
const SILENCIO = 'D1 RECHAZA (P0001) lo que producción ignora en silencio (trigger cen_proteger_perfil): mismo resultado en la tabla'
const escenarios = (yo: any, n: number): Esc[] => {
  const mio = yo?.id ?? alumno.id
  const sim = (s: string) => `equivalencia-${s}-${n}`
  return [
    { nombre: 'intento propio en curso (como la app)', tabla: 'intentos', op: 'upsert', valores: { id_alumno: mio, sim_id: sim('a'), status: 'in_progress' }, onConflict: 'id_alumno,sim_id,status' },
    { nombre: 'intento propio en curso, otra vez', tabla: 'intentos', op: 'upsert', valores: { id_alumno: mio, sim_id: sim('a'), status: 'in_progress' }, onConflict: 'id_alumno,sim_id,status' },
    { nombre: 'intento propio completado (como la app)', tabla: 'intentos', op: 'upsert', valores: { id_alumno: mio, sim_id: sim('a'), status: 'completed', score: 80, total_time_seconds: 300 }, onConflict: 'id_alumno,sim_id,status' },
    { nombre: 'intento a nombre del compañero', tabla: 'intentos', op: 'upsert', valores: { id_alumno: compañero.id, sim_id: sim('b'), status: 'completed', score: 100 }, onConflict: 'id_alumno,sim_id,status' },
    { nombre: 'subirme la nota directo', tabla: 'intentos', op: 'update', valores: { score: 100 }, filtro: { id_alumno: mio } },
    { nombre: 'bajarle la nota al compañero', tabla: 'intentos', op: 'update', valores: { score: 0 }, filtro: { id_alumno: compañero.id } },
    { nombre: 'pasar mi intento a otro alumno', tabla: 'intentos', op: 'update', valores: { id_alumno: compañero.id }, filtro: { id_alumno: mio, sim_id: sim('a') } },
    { nombre: 'borrar mis intentos', tabla: 'intentos', op: 'delete', filtro: { id_alumno: mio, sim_id: sim('a') } },
    { nombre: 'cambiar mi nombre', tabla: 'profiles', op: 'update', valores: { full_name: `Nombre ${n}` }, filtro: { id: mio } },
    { nombre: 'darme rol admin', tabla: 'profiles', op: 'update', valores: { role: 'admin' }, filtro: { id: mio }, esperada: SILENCIO },
    { nombre: 'darme rol profesor', tabla: 'profiles', op: 'update', valores: { role: 'profesor' }, filtro: { id: mio }, esperada: SILENCIO },
    { nombre: 'cambiar mi correo', tabla: 'profiles', op: 'update', valores: { email: `x${n}@equivalencia.invalid` }, filtro: { id: mio }, esperada: SILENCIO },
    { nombre: 'cambiar el nombre de otro', tabla: 'profiles', op: 'update', valores: { full_name: `Cambiado ${n}` }, filtro: { id: compañero.id } },
    { nombre: 'hacer profesor a un alumno', tabla: 'profiles', op: 'update', valores: { role: 'profesor' }, filtro: { id: compañero.id } },
    { nombre: 'borrar un perfil', tabla: 'profiles', op: 'delete', filtro: { id: compañero.id } },
    { nombre: 'meterme a un grupo', tabla: 'alumnos_grupos', op: 'insert', valores: { id_alumno: mio, id_grupo: grupoAlumno.id } },
    { nombre: 'asignar alumno a grupo (AlumnosContent)', tabla: 'alumnos_grupos', op: 'upsert', valores: { id_alumno: sinGrupo.id, id_grupo: grupoAlumno.id }, onConflict: 'id_alumno,id_grupo' },
    { nombre: 'sacar al alumno de su grupo', tabla: 'alumnos_grupos', op: 'delete', filtro: { id_alumno: alumno.id, id_grupo: grupoAlumno.id } },
    { nombre: 'crear un grupo', tabla: 'grupos', op: 'insert', valores: { nombre: `Grupo ${n}`, id_profesor: mio } },
    { nombre: 'quedarme con el grupo de otro', tabla: 'grupos', op: 'update', valores: { id_profesor: mio }, filtro: { id: grupoAlumno.id } },
    { nombre: 'planear una práctica (CalendarPanel)', tabla: 'asignaciones', op: 'insert', valores: { id_profesor: mio, sim_id: sim('p'), planned_date: '2026-12-01', id_grupo: 'all' },
      esperada: yo && yo.role === 'alumno' ? 'D1 cierra el hueco: en producción un ALUMNO también planea prácticas a su nombre' : undefined },
    { nombre: 'planear a nombre de otro docente', tabla: 'asignaciones', op: 'insert', valores: { id_profesor: docente.id === mio ? admin.id : docente.id, sim_id: sim('q'), planned_date: '2026-12-02' } },
    { nombre: 'borrar mis prácticas planeadas', tabla: 'asignaciones', op: 'delete', filtro: { id_profesor: mio } },
  ]
}

const sqlDe = (e: Exclude<Esc, { rpc: string }>): [string, unknown[]] => {
  const t = q(e.tabla), v = e.valores ?? {}, f = e.filtro ?? {}
  const ps: unknown[] = []
  const p = (x: unknown) => { ps.push(x !== null && typeof x === 'object' ? JSON.stringify(x) : x); return `$${ps.length}` }
  const donde = Object.entries(f).map(([c, x]) => `${q(c)} = ${p(x)}`).join(' AND ') || 'true'
  if (e.op === 'insert' || e.op === 'upsert') {
    const cols = Object.keys(v)
    const base = `INSERT INTO public.${t} (${cols.map(q).join(', ')}) VALUES (${cols.map((c) => p(v[c])).join(', ')})`
    return [e.op === 'upsert' ? `${base} ON CONFLICT (${e.onConflict}) DO UPDATE SET ${cols.map((c) => `${q(c)} = EXCLUDED.${q(c)}`).join(', ')}` : base, ps]
  }
  if (e.op === 'update') {
    const set = Object.entries(v).map(([c, x]) => `${q(c)} = ${p(x)}`).join(', ')
    return [`UPDATE public.${t} SET ${set} WHERE ${donde}`, ps]
  }
  return [`DELETE FROM public.${t} WHERE ${donde}`, ps]
}

async function enPg(e: Esc, u: any, confirmar: boolean): Promise<string | null> {
  try {
    await comoUsuario(u?.id ?? null, async () => {
      if ('rpc' in e) {
        const vals = Object.values(e.args)
        await pg.query(`SELECT public.${q(e.rpc)}(${vals.map((_, i) => `$${i + 1}::${e.tipos[i]}`).join(', ')})`, vals)
      } else { const [s, ps] = sqlDe(e); await pg.query(s, ps) }
    }, confirmar)
    return null
  } catch (err) { return String((err as Error).message).slice(0, 80) }
}
async function enD1(e: Esc, u: any): Promise<string | null> {
  // Como la app: el rol se lee de la base en cada petición, no una vez al empezar.
  const vivo = u ? (await db.prepare('SELECT id, role FROM profiles WHERE id = ?').bind(u.id).first()) : null
  const ctx = ctxDe(vivo)
  let r: { error: { message: string; code: string } | null }
  if ('rpc' in e) r = await llamarRpc(db, ctx, e.rpc, e.args)
  else {
    let c: any = new Consulta(db, ctx, e.tabla)
    if (e.op === 'insert') c = c.insert(e.valores)
    else if (e.op === 'upsert') c = c.upsert(e.valores, { onConflict: e.onConflict })
    else if (e.op === 'update') c = c.update(e.valores)
    else c = c.delete()
    for (const [k, v] of Object.entries(e.filtro ?? {})) c = c.eq(k, v)
    r = await c
  }
  return r.error ? `${r.error.code} ${r.error.message}`.slice(0, 80) : null
}

let n = 0, iguales = 0, deliberadas = 0
const fallas: string[] = [], notas: string[] = []
const tablero: Record<string, Record<string, string>> = {}
for (const a of actores) {
  for (const e of escenarios(a.u, ++n)) {
    // Se compara el CAMBIO de cada lado (filas que entran y salen), no la tabla entera: así una
    // diferencia no contamina los escenarios siguientes.
    const [aPg, aD1] = [await tablaPg(e.tabla), await tablaD1(e.tabla)]
    // D1 primero: si es un hueco que D1 cierra a propósito y D1 lo rechazó, en Postgres se prueba
    // y se deshace, para que las dos bases sigan iguales en los escenarios siguientes.
    const eD1 = await enD1(e, a.u)
    const ePg = await enPg(e, a.u, !(e.esperada && eD1))
    const hPg = delta(aPg, await tablaPg(e.tabla)), hD1 = delta(aD1, await tablaD1(e.tabla))
    const res = (x: string | null, h: string) => (x ? 'rechaza' : h ? 'cambia' : 'sin efecto')
    ;(tablero[e.nombre] ??= {})[a.nombre] = res(ePg, hPg) === res(eD1, hD1) ? res(ePg, hPg) : `${res(ePg, hPg)}→${res(eD1, hD1)}`
    const igual = !!ePg === !!eD1 && hPg === hD1
    if (igual) iguales++
    else if (e.esperada && ePg === null && eD1 !== null) {
      deliberadas++; notas.push(`${a.nombre}: ${e.nombre} — ${e.esperada}`)
    } else fallas.push(`${a.nombre.padEnd(24)} ${e.nombre}: producción ${res(ePg, hPg)}${ePg ? ` (${ePg})` : ''}, D1 ${res(eD1, hD1)}${eD1 ? ` (${eD1})` : ''}${hPg !== hD1 ? ` — cambio en producción ${filasDe(hPg)} filas, en D1 ${filasDe(hD1)}` : ''}`)
  }
}
await dispose()
const actoresN = actores.map((a) => a.nombre)
console.log('escenario'.padEnd(46), actoresN.map((a) => a.slice(0, 11).padEnd(12)).join(''))
for (const [esc, fila] of Object.entries(tablero)) console.log(esc.slice(0, 45).padEnd(46), actoresN.map((a) => (fila[a] ?? '').padEnd(12)).join(''))
for (const l of notas) console.log('◇ diferencia deliberada:', l)
for (const l of fallas) console.log('✗', l)
console.log(`\n${iguales}/${n ? iguales + fallas.length + deliberadas : 0} escrituras idénticas a producción (aceptada/rechazada y tabla completa), ${deliberadas} diferencias deliberadas`)
process.exit(fallas.length ? 1 : 0)
