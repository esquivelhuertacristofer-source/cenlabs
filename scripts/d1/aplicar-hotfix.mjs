// Aplica el hotfix de perfiles a Supabase de PRODUCCIÓN (Labs), aprobado por el usuario el 2026-11-03.
// Todo en UNA transacción: 1) comprueba que producción sigue como en la exportación; 2) aplica;
// 3) dentro de la misma transacción simula ataques y uso normal con usuarios reales (sin imprimir
// datos); 4) COMMIT solo si todo pasa. Con --seco hace todo y termina en ROLLBACK.
//   node scripts/d1/aplicar-hotfix.mjs --seco
//   node scripts/d1/aplicar-hotfix.mjs --aplicar
//   node scripts/d1/aplicar-hotfix.mjs --reversa     (deja todo como estaba)
import pg from 'pg'
import fs from 'node:fs'

const modo = process.argv[2]
if (!['--seco', '--aplicar', '--reversa'].includes(modo)) throw new Error('uso: --seco | --aplicar | --reversa')
const env = Object.fromEntries(fs.readFileSync('.export/labs.env', 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const url = env.SUPABASE_DB_URL.replace('[YOUR-PASSWORD]', encodeURIComponent(env.SUPABASE_DB_PASSWORD))
if (!url.includes('wbvcclpxxwzkuddjxqig')) throw new Error('no es la base de Labs')
const d = JSON.parse(fs.readFileSync('.export/dump.json', 'utf8'))

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()
const q = async (s, p) => (await c.query(s, p)).rows
const fallas = []
const revisa = (nombre, ok, det = '') => { console.log(`${ok ? '✓' : '✗'} ${nombre}${det ? '  ' + det : ''}`); if (!ok) fallas.push(nombre) }
try {
  await c.query('BEGIN')
  await c.query(`SET LOCAL lock_timeout = '5s'`)
  if (modo === '--reversa') {
    await c.query(fs.readFileSync('scripts/d1/hotfix-perfiles-2026-11-03.reversa.sql', 'utf8'))
    const p = await q(`select policyname from pg_policies where tablename='profiles' order by 1`)
    revisa('políticas como antes', JSON.stringify(p.map((x) => x.policyname)) === JSON.stringify(d.politicas.filter((x) => x.tablename === 'profiles').map((x) => x.policyname).sort()))
  } else {
    // 1. Producción sigue como en la exportación (si alguien cambió algo, no se pisa).
    const pol = await q(`select tablename, policyname, permissive, cmd, roles::text, qual, with_check from pg_policies where schemaname='public' order by 1,2`)
    const polDump = d.politicas.map((p) => ({ ...p, roles: String(p.roles) }))
    revisa('políticas iguales a la exportación', JSON.stringify(pol) === JSON.stringify(polDump), `${pol.length}`)
    const fn = await q(`select pg_get_functiondef(p.oid) def from pg_proc p where proname='handle_new_user' and pronamespace='public'::regnamespace`)
    revisa('handle_new_user igual a la exportación', fn[0]?.def === d.funciones.find((f) => f.proname === 'handle_new_user').def)
    const trg = await q(`select tgname from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal`)
    revisa('profiles sin triggers previos', trg.length === 0, trg.map((t) => t.tgname).join(','))
    if (fallas.length) throw new Error('producción cambió desde la exportación: no se aplica')

    // 2. Aplicar.
    await c.query(fs.readFileSync('scripts/d1/hotfix-perfiles-2026-11-03.sql', 'utf8'))

    // 3. Simular, dentro de la transacción, con usuarios reales (punto de guardado por prueba).
    const perfiles = await q(`select id, role from public.profiles`)
    const ag = await q(`select id_alumno from public.alumnos_grupos`)
    const alumno = perfiles.find((p) => p.role === 'alumno' && ag.some((a) => a.id_alumno === p.id))
    const otro = perfiles.find((p) => p.role === 'alumno' && p.id !== alumno.id)
    const profe = perfiles.find((p) => p.role === 'profesor' && 1)
    const como = async (claims, rol, fn) => {
      await c.query('SAVEPOINT prueba')
      try {
        await c.query(`SET LOCAL ROLE ${rol}`)
        await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)])
        return await fn()
      } finally { await c.query('ROLLBACK TO SAVEPOINT prueba'); await c.query('RESET ROLE') }
    }
    const a1 = await como({ sub: alumno.id, role: 'authenticated' }, 'authenticated', async () => {
      await c.query(`update public.profiles set role='admin' where id=$1`, [alumno.id])
      return (await q(`select role from public.profiles where id=$1`, [alumno.id]))[0].role
    })
    revisa('A1 alumno no se puede poner admin', a1 === 'alumno', a1)
    const a2 = await como({ role: 'service_role' }, 'service_role', async () => {
      await c.query(`insert into public.profiles (id,email,full_name,role) values ($1,'x@atacante.invalid','X','admin')
        on conflict (id) do update set email=excluded.email, role=excluded.role`, [otro.id])
      return (await q(`select role, email from public.profiles where id=$1`, [otro.id]))[0]
    })
    revisa('A2 ensureProfileServer no da admin ni cambia el correo', a2.role === 'alumno' && a2.email !== 'x@atacante.invalid', a2.role)
    const a5 = await como({ sub: alumno.id, role: 'authenticated' }, 'authenticated', async () => (await q(`select count(*)::int n from public.profiles`))[0].n)
    revisa('A5 alumno solo ve su perfil', a5 === 1, `${a5}`)
    const n1 = await como({ sub: profe.id, role: 'authenticated' }, 'authenticated', async () => (await q(`select count(*)::int n from public.profiles`))[0].n)
    revisa('N1 profesor ve todos los perfiles', n1 === perfiles.length, `${n1}/${perfiles.length}`)
    const n2 = await como({ sub: alumno.id, role: 'authenticated' }, 'authenticated', async () => {
      await c.query(`update public.profiles set full_name=full_name where id=$1`, [alumno.id])
      return (await q(`select count(*)::int n from public.intentos`))[0].n
    })
    revisa('N2 alumno edita su perfil y lee sus intentos', n2 >= 0, `${n2} intentos`)
    const n3 = await como({ role: 'anon' }, 'anon', async () => (await q(`select count(*)::int n from public.profiles`))[0].n)
    revisa('N3 anónimo no lee perfiles', n3 === 0, `${n3}`)
  }
  if (fallas.length) throw new Error('fallaron: ' + fallas.join(', '))
  if (modo === '--seco') { await c.query('ROLLBACK'); console.log('\nSECO: todo pasó; ROLLBACK, producción sin cambios') }
  else { await c.query('COMMIT'); console.log(`\n${modo === '--aplicar' ? 'APLICADO' : 'REVERTIDO'}: COMMIT hecho`) }
} catch (e) {
  await c.query('ROLLBACK').catch(() => {})
  console.log('\nROLLBACK, producción sin cambios:', String(e.message).slice(0, 200))
  process.exitCode = 1
} finally { await c.end() }
