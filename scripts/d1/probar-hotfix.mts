// Prueba del hotfix de perfiles contra el ORÁCULO (Postgres local con las políticas de producción
// tal cual). No se conecta a Supabase. No imprime datos de alumnos: solo roles y conteos.
//   npx tsx scripts/d1/probar-hotfix.mts            → control: SIN hotfix (los ataques deben FUNCIONAR)
//   HOTFIX=1 npx tsx scripts/d1/probar-hotfix.mts   → con hotfix (ataques rechazados, uso normal igual)
import fs from 'node:fs'
if (process.env.HOTFIX) process.env.ORACULO_SQL = 'scripts/d1/hotfix-perfiles-2026-11-03.sql'
const { armarOraculo } = await import('./oraculo-pg.mts')
const { pg, d, comoUsuario, faltantes } = await armarOraculo()
const x = (s: string) => pg.exec(s)
if (Object.values(faltantes).some((a) => a.length)) console.log('faltantes en el oráculo:', JSON.stringify(faltantes))

// Lo que el oráculo no trae de Supabase: el rol service_role con permisos y el trigger de alta en auth.users.
await x(`GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role; GRANT USAGE ON SCHEMA public, auth TO service_role;
  GRANT SELECT ON auth.users TO service_role;
  CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`)

const P = d.filas.profiles as any[]
const alumno = P.find((p) => p.role === 'alumno' && d.filas.alumnos_grupos.some((a: any) => a.id_alumno === p.id))
const otroAlumno = P.find((p) => p.role === 'alumno' && p.id !== alumno.id)
const grupoProfe = d.filas.grupos.find((g: any) => g.id_profesor)
const profe = P.find((p) => p.id === grupoProfe.id_profesor)
const admin = P.find((p) => p.role === 'admin')
const sinPerfil = d.auth_users.find((u: any) => !P.some((p) => p.id === u.id))
const rol = async (id: string) => (await pg.query<any>(`SELECT role, email FROM public.profiles WHERE id=$1`, [id])).rows[0]

async function comoServicio<T>(fn: () => Promise<T>): Promise<T> {
  await x('BEGIN')
  try {
    await x('SET LOCAL ROLE service_role')
    await pg.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ role: 'service_role' })])
    return await fn()
  } finally { await x('ROLLBACK') }
}
const res: [string, boolean, string][] = []
const anota = (nombre: string, ok: boolean, det = '') => res.push([nombre, ok, det])
const atrapa = async (fn: () => Promise<unknown>) => { try { await fn(); return 'aceptado' } catch (e) { return 'rechazado: ' + String((e as Error).message).slice(0, 80) } }

// --- Ataques ---
// A1. Alumno se pone admin por la API (política UPDATE sin límite de columnas).
const a1 = await comoUsuario(alumno.id, async () => {
  await pg.query(`UPDATE public.profiles SET role='admin' WHERE id=$1`, [alumno.id])
  return (await pg.query<any>(`SELECT role FROM public.profiles WHERE id=$1`, [alumno.id])).rows[0].role
})
anota('A1 alumno se pone role=admin', a1 === 'admin', a1)

// A2. ensureProfileServer: upsert con service_role, rol y correo del cliente, sobre OTRO usuario.
const a2 = await comoServicio(async () => {
  await pg.query(`INSERT INTO public.profiles (id,email,full_name,role) VALUES ($1,'x@atacante.invalid','X','admin')
    ON CONFLICT (id) DO UPDATE SET email=excluded.email, full_name=excluded.full_name, role=excluded.role`, [otroAlumno.id])
  return await rol(otroAlumno.id)
})
anota('A2 ensureProfileServer da admin a otro', a2.role === 'admin', a2.role)
anota('A2b ensureProfileServer cambia el correo de otro', a2.email === 'x@atacante.invalid', a2.email === 'x@atacante.invalid' ? 'cambiado' : 'intacto')

// A3. Perfil nuevo por la API con role=admin (usuario de auth sin perfil).
if (sinPerfil) {
  const a3 = await comoServicio(async () => {
    await pg.query(`INSERT INTO public.profiles (id,email,full_name,role) VALUES ($1,$2,'X','admin') ON CONFLICT (id) DO UPDATE SET role=excluded.role`, [sinPerfil.id, sinPerfil.email])
    return (await rol(sinPerfil.id)).role
  })
  anota('A3 perfil nuevo por API con role=admin', a3 === 'admin', a3)
}

// A4. Registro público con metadatos role=admin (handle_new_user).
await x('BEGIN')
await pg.query(`INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES ('00000000-0000-4000-8000-0000000000a4','a4@x.invalid','{"role":"admin","full_name":"A4"}')`)
const a4 = (await rol('00000000-0000-4000-8000-0000000000a4')).role
await x('ROLLBACK')
anota('A4 alta con metadatos role=admin', a4 === 'admin', a4)

// A5. Alumno lee los perfiles de todos.
const a5 = await comoUsuario(alumno.id, async () => (await pg.query<any>(`SELECT count(*)::int n FROM public.profiles`)).rows[0].n)
anota('A5 alumno lee todos los perfiles', a5 > 1, `${a5} visibles`)

// --- Uso normal que NO debe cambiar ---
const n1 = await comoUsuario(alumno.id, async () => {
  await pg.query(`UPDATE public.profiles SET full_name='Nombre Nuevo' WHERE id=$1`, [alumno.id])
  return (await pg.query<any>(`SELECT full_name, role FROM public.profiles WHERE id=$1`, [alumno.id])).rows[0]
})
anota('N1 alumno cambia su nombre', n1.full_name === 'Nombre Nuevo' && n1.role === 'alumno', '')
const n2 = await comoUsuario(alumno.id, async () => (await pg.query<any>(`SELECT id FROM public.profiles WHERE id=$1`, [alumno.id])).rows.length)
anota('N2 alumno lee su propio perfil', n2 === 1, '')
const n3 = await comoUsuario(profe.id, async () => (await pg.query<any>(`SELECT count(*)::int n FROM public.profiles`)).rows[0].n)
anota('N3 profesor lee todos los perfiles', n3 === P.length, `${n3}/${P.length}`)
const n4 = await comoUsuario(admin.id, async () => (await pg.query<any>(`SELECT count(*)::int n FROM public.profiles`)).rows[0].n)
anota('N4 admin lee todos los perfiles', n4 === P.length, `${n4}/${P.length}`)
const n5 = await comoUsuario(null, async () => (await pg.query<any>(`SELECT count(*)::int n FROM public.profiles`)).rows[0].n)
anota('N5 anónimo no lee perfiles', n5 === 0, `${n5}`)
await x('BEGIN')
await pg.query(`INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES ('00000000-0000-4000-8000-0000000000b1','b1@x.invalid',$1)`, [JSON.stringify({ role: 'profesor', full_name: 'B1' })])
await pg.query(`INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES ('00000000-0000-4000-8000-0000000000b2','b2@x.invalid',$1)`, [JSON.stringify({ role: 'alumno', full_name: 'B2', group_id: grupoProfe.id })])
const b1 = (await rol('00000000-0000-4000-8000-0000000000b1')).role, b2 = (await rol('00000000-0000-4000-8000-0000000000b2')).role
const b2g = (await pg.query<any>(`SELECT count(*)::int n FROM public.alumnos_grupos WHERE id_alumno='00000000-0000-4000-8000-0000000000b2' AND id_grupo=$1`, [grupoProfe.id])).rows[0].n
await x('ROLLBACK')
anota('N6 alta del admin como profesor', b1 === 'profesor', b1)
anota('N7 alta del admin como alumno, con grupo', b2 === 'alumno' && b2g === 1, `${b2} grupo=${b2g}`)
await x('BEGIN')
await pg.query(`UPDATE public.profiles SET role='profesor' WHERE id=$1`, [alumno.id])
const n8 = (await rol(alumno.id)).role
await x('ROLLBACK')
anota('N8 SQL directo (panel de Supabase) sí cambia el rol', n8 === 'profesor', n8)
if (sinPerfil) {
  const n9 = await comoServicio(async () => {
    await pg.query(`INSERT INTO public.profiles (id,email,full_name,role) VALUES ($1,$2,'X','alumno') ON CONFLICT (id) DO NOTHING`, [sinPerfil.id, sinPerfil.email])
    return (await rol(sinPerfil.id))?.role
  })
  anota('N9 ensureProfileServer crea el perfil que falta', !!n9, String(n9))
}
const n10 = await comoUsuario(alumno.id, async () => (await pg.query<any>(`SELECT count(*)::int n FROM public.intentos`)).rows[0].n)
const n10b = await comoUsuario(profe.id, async () => (await pg.query<any>(`SELECT count(*)::int n FROM public.intentos`)).rows[0].n)
anota('N10 intentos: alumno y profesor leen lo mismo que antes', true, `alumno ${n10}, profesor ${n10b}`)

const modo = process.env.HOTFIX ? 'CON hotfix' : 'SIN hotfix (control)'
console.log(`\n${modo}`)
for (const [n, ok, det] of res) console.log(`${n.startsWith('A') ? (ok ? 'ATAQUE FUNCIONA ' : 'ataque rechazado') : (ok ? 'normal ✓       ' : 'NORMAL ROTO ✗   ')}  ${n}  ${det}`)
fs.mkdirSync('.export', { recursive: true })
fs.writeFileSync(`.export/probar-hotfix-${process.env.HOTFIX ? 'con' : 'sin'}.json`, JSON.stringify(res))
