// Piloto D1 — ÚNICA exportación de lectura de Supabase de producción.
// Una sola conexión directa, una sola transacción READ ONLY (Postgres rechaza
// cualquier escritura dentro). Escribe .export/dump.json (gitignored). No imprime datos.
import pg from 'pg'
import fs from 'node:fs'

// DIR: carpeta de salida (ensayo: DIR=.export/ensayo). ENV_ORIGEN: de dónde leer SUPABASE_DB_URL.
// Labs (como Financiera) no la tiene en su .env.local: el usuario la deja en un archivo aparte, fuera de git,
// y se lee en memoria sin copiarla. Se busca primero aquí y después donde se le pidió (nem-d1).
const DIR = process.env.DIR ?? '.export'
const env = Object.fromEntries(fs.readFileSync(process.env.ENV_ORIGEN ?? '.export/labs.env', 'utf8').split(/\r?\n/)
  .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
// El panel de Supabase da la URI con «[YOUR-PASSWORD]» en lugar de la contraseña. El usuario la
// pega tal cual y pone la contraseña aparte (SUPABASE_DB_PASSWORD): aquí se codifica, porque un
// @, # o / sin codificar rompería la URI.
const url = env.SUPABASE_DB_PASSWORD
  ? env.SUPABASE_DB_URL?.replace(/\[YOUR-PASSWORD\]/, encodeURIComponent(env.SUPABASE_DB_PASSWORD))
  : env.SUPABASE_DB_URL
if (url?.includes('[YOUR-PASSWORD]')) throw new Error('Falta la contraseña: ponla en SUPABASE_DB_PASSWORD')
if (!url?.includes('wbvcclpxxwzkuddjxqig')) throw new Error('SUPABASE_DB_URL no apunta al proyecto esperado')
fs.mkdirSync(DIR, { recursive: true })
if (fs.existsSync(`${DIR}/dump.json`)) throw new Error('Ya hay una exportación: no se repite')

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()
await c.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
const q = async (sql) => (await c.query(sql)).rows
// Opcional: si la tabla no existe (cron sin la extensión), Postgres invalidaría la transacción
// entera. El punto de guardado deja seguir; sigue siendo READ ONLY.
const opcional = async (sql) => {
  await c.query('SAVEPOINT opc')
  try { const r = await q(sql); await c.query('RELEASE SAVEPOINT opc'); return r }
  catch { await c.query('ROLLBACK TO SAVEPOINT opc'); return null }
}
const out = {}
out.columnas = await q(`select table_schema, table_name, column_name, ordinal_position, data_type, udt_name, is_nullable, column_default
  from information_schema.columns where table_schema='public' order by table_name, ordinal_position`)
out.tablas = await q(`select table_name, table_type from information_schema.tables where table_schema='public' order by 1`)
out.restricciones = await q(`select conrelid::regclass::text as tabla, conname, contype, pg_get_constraintdef(oid) as def
  from pg_constraint where connamespace='public'::regnamespace order by 1,2`)
out.indices = await q(`select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by 1,2`)
out.vistas = await q(`select viewname, definition from pg_views where schemaname='public'`)
out.funciones = await q(`select p.proname, pg_get_functiondef(p.oid) as def from pg_proc p where p.pronamespace='public'::regnamespace`)
out.triggers = await q(`select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
  from information_schema.triggers where event_object_schema in ('public','auth')`)
out.politicas = await q(`select tablename, policyname, permissive, cmd, roles, qual, with_check from pg_policies where schemaname='public' order by 1,2`)
// Lo que las políticas no cubren (manual 2b): permisos por tabla y por COLUMNA para anon/authenticated.
out.permisos_tabla = await q(`select table_name, grantee, privilege_type from information_schema.role_table_grants
  where table_schema='public' and grantee in ('anon','authenticated') order by 1,2,3`)
out.permisos_columna = await q(`select table_name, column_name, grantee, privilege_type from information_schema.column_privileges
  where table_schema='public' and grantee in ('anon','authenticated') order by 1,2,3,4`)
// RLS activado por tabla (sin RLS, PostgREST deja leer todo con la llave anónima).
out.rls = await q(`select relname as tabla, relrowsecurity as activo, relforcerowsecurity as forzado from pg_class
  where relnamespace='public'::regnamespace and relkind='r' order by 1`)
// Storage y extensiones que corren solas (manual 1b).
out.buckets = await opcional(`select id, name, public from storage.buckets`)
out.objetos_por_bucket = await opcional(`select bucket_id, count(*)::int as n from storage.objects group by 1`)
out.event_triggers = await q(`select evtname, evtevent, evtenabled, p.proname from pg_event_trigger e join pg_proc p on p.oid=e.evtfoid`)
out.extensiones = await q(`select extname, extversion from pg_extension order by 1`)
out.cron = await opcional(`select jobname, schedule, command from cron.job`)
out.identidades = await opcional(`select provider, count(*)::int as n from auth.identities group by 1`)
// Quién puede llamar cada función por RPC: las SECURITY DEFINER se saltan RLS.
out.permisos_funcion = await q(`select routine_name, grantee, privilege_type from information_schema.routine_privileges
  where routine_schema='public' and grantee in ('anon','authenticated','PUBLIC') order by 1,2`)
out.funciones_meta = await q(`select p.proname, p.prosecdef as security_definer, p.provolatile as volatilidad,
  pg_get_function_identity_arguments(p.oid) as args from pg_proc p where p.pronamespace='public'::regnamespace order by 1`)
out.filas = {}
for (const { table_name, table_type } of out.tablas) {
  if (table_type !== 'BASE TABLE') continue
  out.filas[table_name] = await q(`select * from public."${table_name}"`)
}
out.auth_users = await q(`select id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, last_sign_in_at, banned_until, deleted_at from auth.users`)
await c.query('ROLLBACK')
await c.end()
fs.writeFileSync(`${DIR}/dump.json`, JSON.stringify(out))
console.log('tablas', Object.keys(out.filas).length, 'vistas', out.vistas.length, 'funciones', out.funciones.length,
  'triggers', out.triggers.length, 'politicas', out.politicas.length, 'usuarios', out.auth_users.length)
for (const [t, r] of Object.entries(out.filas)) console.log(t.padEnd(36), r.length)
console.log('MB', (fs.statSync(`${DIR}/dump.json`).size / 1e6).toFixed(1))
