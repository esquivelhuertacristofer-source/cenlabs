// =============================================================================
// Oráculo: un Postgres real (PGlite, en este equipo) armado SOLO con la exportación de
// producción (.export/dump.json): tablas, valores por omisión, restricciones (PK, UNIQUE, FK,
// CHECK), funciones (pg_get_functiondef tal cual), triggers, RLS, permisos y políticas (texto
// de pg_policies tal cual), y los datos. Auth mínimo como Supabase: roles anon/authenticated
// y auth.uid() que lee request.jwt.claims. No se conecta a Supabase.
// Lo usan equivalencia-rls.mts (lecturas) y equivalencia-escrituras.mts.
// =============================================================================
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'

export const q = (s: string) => `"${s.replace(/"/g, '""')}"`

export async function armarOraculo(dump = '.export/dump.json') {
  const d = JSON.parse(fs.readFileSync(dump, 'utf8'))
  const crudo = new PGlite()
  // Un error de PGlite trae los parámetros (filas de alumnos): se re-lanza solo con el mensaje.
  const limpio = (e: unknown) => new Error(String((e as Error)?.message ?? e).slice(0, 300))
  const pg = {
    exec: (s: string) => crudo.exec(s).catch((e) => { throw limpio(e) }),
    query: <T = any>(s: string, p?: unknown[]) => crudo.query<T>(s, p).catch((e) => { throw limpio(e) }),
  }
  const x = (s: string) => pg.exec(s)
  await x(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb, raw_app_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(coalesce(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'role' $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
  `)

  const tablas: string[] = d.tablas.filter((t: any) => t.table_type === 'BASE TABLE').map((t: any) => t.table_name)
  const pk: Record<string, string[]> = {}
  for (const r of d.restricciones.filter((r: any) => r.contype === 'p'))
    pk[r.tabla.replace(/^public\./, '')] = r.def.match(/\(([^)]+)\)/)[1].split(',').map((s: string) => s.trim().replace(/"/g, ''))

  const secuencias = new Set<string>()
  for (const t of tablas) {
    const cols = d.columnas.filter((c: any) => c.table_name === t).sort((a: any, b: any) => a.ordinal_position - b.ordinal_position)
    for (const c of cols) { const m = /nextval\('([^']+)'/.exec(c.column_default ?? ''); if (m) secuencias.add(m[1].replace(/::regclass$/, '')) }
    for (const s of secuencias) await x(`CREATE SEQUENCE IF NOT EXISTS ${s}`)
    await x(`CREATE TABLE public.${q(t)} (${cols.map((c: any) => `${q(c.column_name)} ${c.udt_name}` +
      (c.column_default ? ` DEFAULT ${c.column_default}` : '') + (c.is_nullable === 'NO' ? ' NOT NULL' : '')).join(', ')})`)
  }
  await pg.query(`INSERT INTO auth.users SELECT * FROM jsonb_populate_recordset(NULL::auth.users, $1::jsonb)`, [JSON.stringify(d.auth_users)])
  for (const t of tablas)
    if (d.filas[t].length) await pg.query(`INSERT INTO public.${q(t)} SELECT * FROM jsonb_populate_recordset(NULL::public.${q(t)}, $1::jsonb)`, [JSON.stringify(d.filas[t])])
  for (const s of secuencias) {
    const m = d.columnas.find((c: any) => (c.column_default ?? '').includes(s))
    await x(`SELECT setval('${s}', greatest(1, (SELECT coalesce(max(${q(m.column_name)}), 0) FROM public.${q(m.table_name)})))`)
  }
  // Restricciones: PK y UNIQUE primero (las FK las necesitan), luego FK y CHECK.
  const orden = { p: 0, u: 1, f: 2, c: 3 } as Record<string, number>
  const sinRestriccion: string[] = []
  for (const r of [...d.restricciones].sort((a: any, b: any) => (orden[a.contype] ?? 9) - (orden[b.contype] ?? 9))) {
    if (!(r.contype in orden)) continue
    const t = r.tabla.replace(/^public\./, '')
    if (!tablas.includes(t)) continue
    try { await x(`ALTER TABLE public.${q(t)} ADD CONSTRAINT ${q(r.conname)} ${r.def}`) } catch { sinRestriccion.push(`${t}.${r.conname}`) }
  }
  let pendientes = [...d.funciones]
  for (let vuelta = 0; vuelta < 5 && pendientes.length; vuelta++) {
    const siguen = []
    for (const f of pendientes) { try { await x(f.def) } catch { siguen.push(f) } }
    pendientes = siguen
  }
  const sinFuncion = pendientes.map((f: any) => f.proname)
  const sinTrigger: string[] = []
  // information_schema.triggers da UNA fila por evento: un trigger BEFORE INSERT OR UPDATE (el
  // cen_proteger_perfil de Labs) llega dos veces. Se juntan los eventos y se crea una sola vez.
  const porTrigger = new Map<string, any>()
  for (const t of d.triggers.filter((t: any) => t.event_object_schema === 'public')) {
    const k = `${t.event_object_table}.${t.trigger_name}`
    const previo = porTrigger.get(k)
    if (previo) previo.eventos.push(t.event_manipulation)
    else porTrigger.set(k, { ...t, eventos: [t.event_manipulation] })
  }
  for (const t of porTrigger.values()) {
    try {
      await x(`CREATE TRIGGER ${q(t.trigger_name)} ${t.action_timing} ${t.eventos.join(' OR ')} ON public.${q(t.event_object_table)} FOR EACH ROW ${t.action_statement}`)
    } catch { sinTrigger.push(t.trigger_name) }
  }
  for (const r of d.rls) if (r.activo && tablas.includes(r.tabla)) await x(`ALTER TABLE public.${q(r.tabla)} ENABLE ROW LEVEL SECURITY`)
  for (const g of d.permisos_tabla) if (tablas.includes(g.table_name)) await x(`GRANT ${g.privilege_type} ON public.${q(g.table_name)} TO ${g.grantee}`)
  await x(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated`)
  for (const p of d.politicas) {
    const roles = String(p.roles).replace(/[{}]/g, '').split(',').join(', ')
    await x(`CREATE POLICY ${q(p.policyname)} ON public.${q(p.tablename)} AS ${p.permissive} FOR ${p.cmd} TO ${roles}` +
      (p.qual ? ` USING (${p.qual})` : '') + (p.with_check ? ` WITH CHECK (${p.with_check})` : ''))
  }

  // Para probar un arreglo de producción ANTES de pegarlo en Supabase: ORACULO_SQL=<archivo>.
  if (process.env.ORACULO_SQL) await x(fs.readFileSync(process.env.ORACULO_SQL, 'utf8'))

  /** Corre fn dentro de una transacción con la sesión de uid (null = anónimo). confirmar=false → ROLLBACK. */
  async function comoUsuario<T>(uid: string | null, fn: () => Promise<T>, confirmar = false): Promise<T> {
    await x('BEGIN')
    let ok = false
    try {
      await x(`SET LOCAL ROLE ${uid ? 'authenticated' : 'anon'}`)
      await pg.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify(uid ? { sub: uid, role: 'authenticated' } : { role: 'anon' })])
      const r = await fn(); ok = true; return r
    } finally { await x(ok && confirmar ? 'COMMIT' : 'ROLLBACK') }
  }
  return { pg, d, tablas, pk, comoUsuario, faltantes: { restricciones: sinRestriccion, funciones: sinFuncion, triggers: sinTrigger } }
}
