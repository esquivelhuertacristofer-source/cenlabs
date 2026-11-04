// =============================================================================
// Batería de seguridad de Labs sobre D1 — SOLO contra el piloto (workers.dev).
//   node scripts/d1/probar-seguridad-labs.mjs [URL]
// Ataca como lo haría un script: sesión falsificada, permisos por rol en /api/datos, CSRF,
// inyección, tablas prohibidas, límites, pantallas y acciones de admin llamadas por un alumno,
// los huecos H1–H4 del 2026-11-03, fuerza bruta, enumeración de cuentas, cabeceras, secretos
// en el código del navegador y archivos internos.
// Cuentas SINTÉTICAS de .export/carga.json (dominio .invalid). No imprime claves ni datos.
// Deja una pausa de login (15 min) en el equipo de prueba de la cuenta víctima, solo en el piloto.
// Al final borra lo que escribió (sim_id «seguridad-…») de la D1 del PILOTO.
// =============================================================================
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const B = process.argv[2] ?? 'https://labs-d1.campanaeducativanacional.workers.dev'
if (!/^https:\/\/labs-d1\.[a-z0-9-]+\.workers\.dev$/.test(B)) throw new Error(`Solo contra el piloto labs-d1.*.workers.dev (no ${B})`)
setTimeout(() => { console.log('TIEMPO AGOTADO'); process.exit(2) }, 480_000)
const C = JSON.parse(fs.readFileSync('.export/carga.json', 'utf8'))
const manifiesto = JSON.parse(fs.readFileSync(process.env.MANIFIESTO ?? '.next/server/server-reference-manifest.json', 'utf8')).node
const ACCION = Object.fromEntries(Object.entries(manifiesto).map(([id, v]) => [v.exportedName, id]))
for (const n of ['iniciarSesion', 'ensureProfileServer', 'syncIntentoServer', 'onboardInstitutionalUsers']) if (!ACCION[n]) throw new Error(`falta la acción ${n} en el manifiesto (¿build distinto del desplegado?)`)
let fallos = 0, total = 0
const ok = (cond, msg) => { total++; console.log(cond ? '  ✓' : '  ✗', msg); if (!cond) fallos++ }

// --- Utilidades ---
const galleta = (r, nombre) => (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(nombre + '='))
async function equipo() {
  const r = await fetch(`${B}/login`, { redirect: 'manual' })
  return galleta(r, 'labs_disp')?.split(';')[0] ?? ''
}
async function accion(nombre, args, cookie = '', ruta = '/login', origin = B) {
  const t0 = performance.now()
  const r = await fetch(B + ruta, {
    method: 'POST', redirect: 'manual',
    headers: { 'Next-Action': ACCION[nombre], 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(args),
  })
  return { r, texto: await r.text(), ms: performance.now() - t0 }
}
async function entrar(correo, clave = C.clave, disp) {
  disp ??= await equipo()
  const { r, texto, ms } = await accion('iniciarSesion', [correo, clave], disp)
  const set = galleta(r, 'labs_sesion')
  return { set, cookie: [disp, set?.split(';')[0]].filter(Boolean).join('; '), texto, ms, disp }
}
async function datos(cookie, lote, extra = {}) {
  const r = await fetch(`${B}/api/datos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: B, 'Sec-Fetch-Site': 'same-origin', ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: typeof lote === 'string' ? lote : JSON.stringify({ lote }),
  })
  let j = null; try { j = await r.json() } catch { /* no JSON */ }
  return { status: r.status, j, res: j?.resultados ?? [] }
}
const tabla = (t, ops) => ({ tipo: 'tabla', tabla: t, ops })
const sel = (t, cols = '*', ...mas) => tabla(t, [['select', [cols]], ...mas])
const rpc = (nombre, args) => ({ tipo: 'rpc', nombre, args })
const pagina = (ruta, cookie) => fetch(B + ruta, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual' })
const filas = (x) => (Array.isArray(x?.data) ? x.data : x?.data ? [x.data] : [])
const destino = (r) => { try { return new URL(r.headers.get('location') ?? '', B).pathname } catch { return '' } }
// Solo la D1 del piloto; el nombre va fijo.
// La sesión OAuth de wrangler caduca a media batería (7403/10000): se renueva con whoami y se reintenta una vez.
const d1Una = (sql) => JSON.parse(execSync(`npx wrangler d1 execute labs-d1 --remote --json --command "${sql}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))[0].results
const d1 = (sql) => { try { return d1Una(sql) } catch { execSync('npx wrangler whoami', { stdio: 'ignore' }); return d1Una(sql) } }

// --- Cuentas (sintéticas) ---
const al = await entrar(C.correos[0])
const yo = (await datos(al.cookie, [{ tipo: 'auth', accion: 'getUser' }])).res[0]?.data?.user
const ajenoId = C.ids.alumno31 // alumno de OTRO grupo (grupo B) del mismo docente
const grupoMio = C.grupos[0], grupoAjeno = C.grupos[1]

console.log('1. Cookie de sesión')
ok(!!al.set, 'login válido entrega cookie')
ok(/HttpOnly/i.test(al.set) && /Secure/i.test(al.set) && /SameSite=lax/i.test(al.set), 'cookie HttpOnly + Secure + SameSite=Lax')
const token = al.set.split(';')[0].slice('labs_sesion='.length)
const [cuerpo, firma] = token.split('.')
const carga = JSON.parse(Buffer.from(cuerpo, 'base64url').toString())
ok(typeof carga.u === 'string' && !('role' in carga) && !('email' in carga), 'la cookie solo lleva id, versión y caducidad (sin rol)')
const conToken = (t) => `${al.disp}; labs_sesion=${t}`
const falsa = Buffer.from(JSON.stringify({ ...carga, u: C.ids.admin })).toString('base64url') + '.' + firma
ok((await pagina('/admin/usuarios', conToken(falsa))).status === 307, 'cookie con el id del admin (firma vieja) → fuera')
ok((await datos(conToken(falsa), [{ tipo: 'auth', accion: 'getUser' }])).res[0]?.data?.user == null, 'cookie con el id de otro → /api/datos sin usuario')
const alargada = Buffer.from(JSON.stringify({ ...carga, e: carga.e + 10 ** 7 })).toString('base64url') + '.' + firma
ok((await pagina('/alumno/inicio', conToken(alargada))).status === 307, 'cookie con caducidad alargada → al login')
const basura = await pagina('/alumno/inicio', conToken('basura.basura'))
ok(basura.status === 307, `cookie basura → al login, sin error (${basura.status})`)
ok((await pagina('/alumno/inicio', al.cookie)).status === 200, 'la cookie auténtica sí entra')
ok(yo?.id === C.ids.alumno1, 'getUser devuelve al alumno correcto')

console.log('2. Lo que un ALUMNO puede leer y escribir por /api/datos')
const L = await datos(al.cookie, [sel('profiles', 'id'), sel('intentos', 'id_alumno'), sel('alumnos_grupos', 'id_alumno'),
  sel('profiles', 'id', ['eq', ['id', ajenoId]]), sel('intentos', 'id_alumno', ['eq', ['id_alumno', ajenoId]])])
ok(filas(L.res[0]).length === 1 && filas(L.res[0])[0].id === yo.id, 'profiles: solo el suyo (H1: antes leía los 42)')
ok(filas(L.res[1]).every((f) => f.id_alumno === yo.id), `intentos: solo los suyos (${filas(L.res[1]).length})`)
ok(filas(L.res[2]).every((f) => f.id_alumno === yo.id), 'alumnos_grupos: solo su inscripción')
ok(filas(L.res[3]).length === 0, 'pedir el perfil de otro alumno por id → nada')
ok(filas(L.res[4]).length === 0, 'pedir los intentos de otro alumno → nada')
const W = await datos(al.cookie, [
  tabla('profiles', [['update', [{ role: 'admin' }]], ['eq', ['id', yo.id]]]),
  tabla('profiles', [['update', [{ role: 'profesor' }]], ['eq', ['id', yo.id]]]),
  tabla('profiles', [['update', [{ email: 'otro@x.invalid' }]], ['eq', ['id', yo.id]]]),
  tabla('profiles', [['upsert', [{ id: yo.id, email: C.correos[0], role: 'admin' }]]]),
  tabla('intentos', [['update', [{ score: 100 }]], ['eq', ['id_alumno', yo.id]]]),
  tabla('intentos', [['upsert', [{ id_alumno: ajenoId, sim_id: 'seguridad-ajeno', status: 'completed', score: 100 }, { onConflict: 'id_alumno,sim_id,status' }]]]),
  tabla('intentos', [['upsert', [{ id_alumno: yo.id, sim_id: 'seguridad-nota', status: 'completed', score: 150 }, { onConflict: 'id_alumno,sim_id,status' }]]]),
  tabla('intentos', [['delete', []], ['eq', ['id_alumno', yo.id]]]),
  tabla('alumnos_grupos', [['upsert', [{ id_alumno: yo.id, id_grupo: grupoAjeno }, { onConflict: 'id_alumno,id_grupo' }]]]),
  tabla('grupos', [['update', [{ id_profesor: yo.id }]], ['eq', ['id', grupoMio]]]),
  tabla('asignaciones', [['insert', [{ id_profesor: yo.id, sim_id: 'seguridad-plan', planned_date: '2026-12-01', id_grupo: 'all' }]]]),
  rpc('handle_new_user', {}), rpc('cen_es_docente', {}),
])
const nombresW = ['darse rol admin', 'darse rol profesor', 'cambiarse el correo', 'upsert de perfil con rol admin', 'subirse la nota con update',
  'intento a nombre de otro alumno', 'nota de 150', 'borrar sus intentos', 'meterse a otro grupo', 'quedarse con su grupo',
  'alumno planea una práctica (cerrado en D1)', 'función interna handle_new_user', 'función cen_es_docente']
W.res.forEach((x, i) => ok(!!x.error, `${nombresW[i]} → rechazado (${x.error?.code ?? 'ACEPTADO'})`))
const propio = await datos(al.cookie, [tabla('intentos', [['upsert', [{ id_alumno: yo.id, sim_id: 'seguridad-propio', status: 'in_progress', score: 0 }, { onConflict: 'id_alumno,sim_id,status' }]]])])
ok(!propio.res[0]?.error, 'su propio intento (lo que hace la app) sí se guarda')
const prohibidas = ['auth_users', 'auth_fallos', 'sqlite_master', '_cf_KV', 'profiles; DROP TABLE profiles']
const Pr = await datos(al.cookie, prohibidas.map((t) => sel(t, '*')))
Pr.res.forEach((x, i) => ok(!!x.error && !filas(x).length, `tabla «${prohibidas[i]}» → rechazada`))

console.log('3. Inyección por filtros, columnas y orden')
const inyecciones = [
  sel('profiles', 'id', ['eq', ['id', "' OR 1=1 --"]]),
  sel('profiles', 'id', ['eq', ['id = id OR 1', '1']]),
  sel('profiles', 'id, (SELECT group_concat(email) FROM profiles)'),
  sel('profiles', 'id', ['order', ['id; DROP TABLE profiles']]),
  sel('profiles', 'id', ['in', ['id', ["x') OR ('1'='1"]]]),
  sel('profiles', '*, auth_users(*)'),
  sel('profiles', 'id', ['or', ['id.neq.0']]),
  sel('profiles', 'id', ['filter', ['id', 'neq', '0']]),
  sel('profiles', 'id', ['limit', ['1; DELETE FROM profiles']]),
  sel('intentos', 'id_alumno', ['or', [`id_alumno.eq.${ajenoId}`]]),
]
const I = await datos(al.cookie, inyecciones)
I.res.forEach((x, i) => {
  const vistas = filas(x)
  const fuga = vistas.some((f) => (f.id && f.id !== yo.id) || (f.id_alumno && f.id_alumno !== yo.id)) || JSON.stringify(x).includes('@')
  const filtra = /SQLITE|D1_|syntax|no such/i.test(JSON.stringify(x.error ?? ''))
  ok(!fuga && !filtra, `inyección ${i + 1} → ${x.error ? 'rechazada' : `${vistas.length} filas, solo las suyas`}, sin fuga${filtra ? ' — EL ERROR CUENTA EL SQL' : ''}`)
})
ok(filas((await datos(al.cookie, [sel('profiles', 'id')])).res[0]).length === 1, 'la base sigue viva y igual después de las inyecciones')

console.log('4. Límites y CSRF de /api/datos')
ok((await datos(al.cookie, Array.from({ length: 21 }, () => sel('profiles', 'id')))).status === 400, '21 pedidos en un lote → 400')
ok((await datos(al.cookie, JSON.stringify({ lote: [sel('profiles', 'x'.repeat(70_000))] }))).status === 413, 'cuerpo de 70 KB → 413')
ok((await datos(al.cookie, 'no es json')).status === 400, 'JSON inválido → 400')
ok((await datos(al.cookie, [sel('profiles', 'id')], { Origin: 'https://sitio-malo.example', 'Sec-Fetch-Site': 'cross-site' })).status === 403, 'desde otro sitio → 403')
ok((await datos(al.cookie, [sel('profiles', 'id')], { 'Content-Type': 'text/plain' })).status === 415, 'Content-Type text/plain (formulario simple entre sitios) → 415')
const getDatos = await fetch(`${B}/api/datos`, { headers: { Cookie: al.cookie } })
ok(getDatos.status === 405 || getDatos.status === 404, `GET /api/datos → ${getDatos.status}`)
const anonL = await datos('', [sel('profiles', 'id'), sel('intentos', 'id_alumno'), sel('alumnos_grupos', 'id_alumno'), sel('grupos', 'id'), sel('asignaciones', 'id')])
ok(anonL.res.length === 5 && anonL.res.every((x) => !filas(x).length), 'anónimo: no lee perfiles, intentos, grupos ni asignaciones')

console.log('5. Pantallas y acciones con sesión de ALUMNO (H1, H3, H4)')
for (const r of ['/', '/alumnos', '/auditoria', '/laboratorios', '/planeamiento']) {
  const p = await pagina(r, al.cookie)
  ok(p.status === 307 && destino(p) === '/alumno/inicio', `alumno en ${r} → a su panel desde el servidor (${p.status} ${destino(p)})`)
}
const adm = await pagina('/admin/usuarios', al.cookie)
ok(adm.status === 307, `alumno en /admin/usuarios → fuera (${adm.status} ${destino(adm)})`)
const correoNuevo = `seguridad-${Date.now()}`
const { texto: tOnb } = await accion('onboardInstitutionalUsers', [[correoNuevo], grupoMio, 'profesor', 'ClaveMala2026!'], al.cookie, '/admin/usuarios')
ok(!/"success":true/.test(tOnb) && /^1:E{/m.test(tOnb), 'onboardInstitutionalUsers con sesión de alumno → rechazada')
ok(d1(`SELECT count(*) n FROM profiles WHERE full_name LIKE '${correoNuevo}%' OR email LIKE '%${correoNuevo}%'`)[0].n === 0, '…y no creó ninguna cuenta')
await accion('ensureProfileServer', [yo.id, C.correos[0], { role: 'admin', full_name: 'x' }], al.cookie, '/alumno/inicio')
await accion('ensureProfileServer', [C.ids.alumno2, 'x@x.invalid', { role: 'admin' }], al.cookie, '/alumno/inicio')
ok(d1(`SELECT role FROM profiles WHERE id IN ('${yo.id}', '${C.ids.alumno2}')`).every((f) => f.role === 'alumno'), 'ensureProfileServer con rol admin en los argumentos (H1) → los roles no cambian')
await accion('syncIntentoServer', [{ id_alumno: ajenoId, sim_id: 'seguridad-sync', status: 'completed', score: 100 }], al.cookie, '/alumno/inicio')
ok(d1(`SELECT count(*) n FROM intentos WHERE sim_id = 'seguridad-sync' AND id_alumno = '${ajenoId}'`)[0].n === 0, 'syncIntentoServer a nombre de otro alumno → no escribe en el otro')
await accion('syncIntentoServer', [{ id_alumno: yo.id, sim_id: 'seguridad-sync2', status: 'completed', score: 9999 }], al.cookie, '/alumno/inicio')
ok(d1(`SELECT count(*) n FROM intentos WHERE sim_id = 'seguridad-sync2' AND score > 100`)[0].n === 0, 'syncIntentoServer con nota 9999 (H2) → no se guarda')

console.log('6. Lo que un DOCENTE puede leer y escribir')
const doc = await entrar(C.docente)
const docId = C.ids.docente
const DL = await datos(doc.cookie, [sel('intentos', 'id_alumno'), sel('alumnos_grupos', 'id_grupo'),
  tabla('profiles', [['update', [{ role: 'admin' }]], ['eq', ['id', docId]]]),
  tabla('profiles', [['update', [{ role: 'profesor' }]], ['eq', ['id', ajenoId]]]),
  tabla('asignaciones', [['insert', [{ id_profesor: C.ids.docenteSinGrupos, sim_id: 'seguridad-ajena', planned_date: '2026-12-02' }]]]),
  tabla('asignaciones', [['insert', [{ id_profesor: docId, sim_id: 'seguridad-plan-doc', planned_date: '2026-12-03', id_grupo: 'all' }]]])])
const misAlumnos = new Set(C.correos.map((_, i) => C.ids[`alumno${i + 1}`]))
ok(filas(DL.res[0]).every((f) => misAlumnos.has(f.id_alumno)), `intentos: solo de alumnos de sus grupos (${filas(DL.res[0]).length})`)
ok(filas(DL.res[1]).every((f) => C.grupos.includes(f.id_grupo)), `alumnos_grupos: solo sus grupos (${filas(DL.res[1]).length})`)
ok(!!DL.res[2]?.error, 'docente se da rol admin → rechazado')
ok(!!DL.res[3]?.error, 'docente hace profesor a un alumno → rechazado')
ok(!!DL.res[4]?.error, 'docente planea a nombre de otro docente → rechazado')
ok(!DL.res[5]?.error, 'docente planea su propia práctica (lo que hace la app) → sí')
const sin = await entrar(C.docenteSinGrupos)
const SL = await datos(sin.cookie, [sel('intentos', 'id_alumno'), sel('alumnos_grupos', 'id_alumno')])
ok(filas(SL.res[0]).length === 0 && filas(SL.res[1]).length === 0, 'docente sin grupos: no ve intentos ni alumnos de nadie')

console.log('7. Cerrar sesión invalida la cookie')
const cerrar = await entrar(C.correos[2])
ok((await pagina('/alumno/inicio', cerrar.cookie)).status === 200, 'antes de cerrar: entra')
await datos(cerrar.cookie, [{ tipo: 'auth', accion: 'signOut' }])
// La sesión se memoriza 30 s por isolate (cliente.ts): en el isolate que atendió el cierre muere
// al instante, en OTRO puede durar hasta 30 s. (Supabase en producción: el token sigue valiendo
// hasta su caducidad, hasta 1 h.) Lo inmediato se informa; lo que se exige es a los 31 s.
const alInstante = (await datos(cerrar.cookie, [{ tipo: 'auth', accion: 'getUser' }])).res[0]?.data?.user == null
console.log(`    (al instante: ${alInstante ? 'ya muerta' : 'aún viva en otro isolate'})`)
await new Promise((r) => setTimeout(r, 31_000))
ok((await datos(cerrar.cookie, [{ tipo: 'auth', accion: 'getUser' }])).res[0]?.data?.user == null, 'a los 31 s de cerrar: la cookie vieja ya no da usuario en /api/datos')
ok((await pagina('/alumno/inicio', cerrar.cookie)).status !== 200, 'a los 31 s de cerrar: la cookie vieja ya no abre el panel')

console.log('8. Fuerza bruta contra una cuenta')
const victima = C.correos[3]
const dispAtacante = await equipo()
let rechazos = 0, pausa = false
for (let i = 0; i < 14; i++) {
  const r = await entrar(victima, 'clave-equivocada-' + i, dispAtacante)
  if (!r.set) rechazos++
  if (/"error":"pausa"/.test(r.texto)) pausa = true
}
ok(rechazos === 14, `14 claves equivocadas: ${rechazos} rechazadas`)
ok(pausa, 'el equipo atacante queda en pausa tras muchos fallos')
ok(!(await entrar(victima, C.clave, dispAtacante)).set, 'desde el equipo en pausa, ni la clave correcta entra')
ok(!!(await entrar(victima)).set, 'el alumno real, desde su propio equipo, sí entra (el ataque no lo deja fuera)')

console.log('9. Enumeración de cuentas')
const tSi = [], tNo = []
for (let i = 0; i < 6; i++) {
  tSi.push((await entrar(C.correos[4], 'mala-' + i)).ms)
  tNo.push((await entrar(`no-existe-${Date.now()}-${i}@nadie.invalid`, 'mala-' + i)).ms)
}
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const dif = Math.abs(med(tSi) - med(tNo))
ok(dif < 250, `correo existente ${Math.round(med(tSi))} ms vs inexistente ${Math.round(med(tNo))} ms (diferencia ${Math.round(dif)} ms)`)
const mSi = (await entrar(C.correos[4], 'mala-x')).texto, mNo = (await entrar('nadie@nadie.invalid', 'mala-x')).texto
const msj = (t) => (t.match(/"error":"([^"]*)"/) ?? [])[1]
ok(msj(mSi) === msj(mNo) && msj(mSi) === 'credenciales', 'mismo mensaje para correo existente e inexistente')
const alta = await datos('', [{ tipo: 'auth', accion: 'signUp' }])
ok(alta.status >= 400 || !!alta.res[0]?.error, 'no hay registro público por /api/datos')

console.log('10. Cabeceras')
const h = (await pagina('/login')).headers
ok(/max-age/.test(h.get('strict-transport-security') ?? ''), 'HSTS')
ok(h.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options SAMEORIGIN (los labs van en iframe del mismo sitio)')
ok(h.get('x-content-type-options') === 'nosniff', 'nosniff')
ok(!/supabase/i.test(h.get('content-security-policy') ?? ''), 'la CSP ya no deja hablar con Supabase')

console.log('11. Secretos en el código que baja al navegador')
let scripts = new Set()
for (const ruta of ['/login', '/alumno/inicio']) {
  const html = await (await pagina(ruta, ruta === '/login' ? '' : al.cookie)).text()
  for (const m of html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)) scripts.add(m[1])
}
const fuga = []
for (const s of scripts) {
  const t = await (await fetch(B + s)).text()
  for (const [n, re] of [['proyecto Supabase', /wbvcclpxxwzkuddjxqig/], ['JWT', /eyJhbGciOi[A-Za-z0-9_-]{20,}/], ['service_role', /service_role/], ['SESION_SECRETO', /SESION_SECRETO/], ['URL de Postgres', /postgres(ql)?:\/\//]])
    if (re.test(t)) fuga.push(`${n} en ${s}`)
}
ok(scripts.size > 3, `${scripts.size} archivos de JS revisados`)
ok(fuga.length === 0, `sin secretos en el JS del navegador ${fuga.join(', ')}`)

console.log('12. Archivos internos y métodos raros')
for (const ruta of ['/.env', '/.env.local', '/.dev.vars', '/wrangler.jsonc', '/.git/config', '/package.json', '/.export/dump.json', '/.export/carga.json', '/_next/../.env', '/worker.ts', '/d1/esquema.sql']) {
  const r = await pagina(ruta)
  const t = r.status === 200 ? await r.text() : ''
  ok(!/SESION_SECRETO|database_id|\[core\]|"dependencies"|CREATE TABLE|SUPABASE|"clave"/.test(t), `${ruta} → ${r.status}, sin contenido interno`)
}
for (const metodo of ['PUT', 'DELETE', 'PATCH']) {
  const r = await fetch(`${B}/api/datos`, { method: metodo, headers: { Cookie: al.cookie, Origin: B } })
  ok(r.status >= 400 && r.status < 500, `${metodo} /api/datos → ${r.status}`)
}
const redir = await pagina('/alumno/inicio?redirect=https://sitio-malo.example&next=https://sitio-malo.example')
ok(!/sitio-malo/.test(redir.headers.get('location') ?? ''), 'sin redirección abierta a otro sitio')

// Limpieza: lo que la batería escribió, solo en la D1 del piloto.
d1(`DELETE FROM intentos WHERE sim_id LIKE 'seguridad-%'`)
d1(`DELETE FROM asignaciones WHERE sim_id LIKE 'seguridad-%'`)
console.log(fallos ? `\n${fallos} FALLO(S) de ${total}` : `\nTodo pasó: ${total}/${total}`)
process.exit(fallos ? 1 : 0)
