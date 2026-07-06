/**
 * crear-cuentas-demo.mjs — Crea (idempotente) una cuenta de MAESTRO y una de ALUMNO.
 * Ejecutar desde cen-dashboard/:  node scripts/crear-cuentas-demo.mjs
 *
 * - Usa SUPABASE_SERVICE_ROLE_KEY (bypass RLS) de .env.local.
 * - Si la cuenta ya existe, NO la duplica: solo repara su rol en `profiles`.
 * - "maestro" = rol 'profesor' en este código (login enruta profesor -> /).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Cargar .env.local (mismo parser que piloto-setup.ts) ──────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = 'piloto2026'; // misma convención que el resto del piloto

const CUENTAS = [
  { email: 'maestro.demo@cenlaboratorios.com', full_name: 'Maestro Demo', role: 'profesor' },
  { email: 'alumno.demo@cenlaboratorios.com', full_name: 'Alumno Demo', role: 'alumno' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('❌  No puedo conectar con Supabase:', listErr.message);
    process.exit(1);
  }
  const existentes = new Map(listData.users.map((u) => [u.email?.toLowerCase(), u]));

  const resultados = [];
  for (const c of CUENTAS) {
    const yaExiste = existentes.get(c.email.toLowerCase());
    let userId;

    if (yaExiste) {
      userId = yaExiste.id;
      console.log(`⏭️   Ya existía: ${c.email}`);
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: c.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: c.full_name, role: c.role },
      });
      if (createErr) {
        console.error(`❌  Error creando ${c.email}: ${createErr.message}`);
        continue;
      }
      userId = created.user.id;
      console.log(`✅  Creada: ${c.email}`);
      await sleep(1500); // dar tiempo al trigger handle_new_user
    }

    // Verificar/reparar el perfil y su rol (robusto ante trigger lento o rol por defecto)
    const { error: upsertErr } = await admin
      .from('profiles')
      .upsert({ id: userId, email: c.email, full_name: c.full_name, role: c.role }, { onConflict: 'id' });
    if (upsertErr) console.error(`⚠️   No pude fijar el rol de ${c.email}: ${upsertErr.message}`);

    resultados.push({ ...c, id: userId });
  }

  // Verificación final: leer roles reales desde profiles
  const { data: perfiles } = await admin
    .from('profiles')
    .select('email, full_name, role')
    .in('email', resultados.map((r) => r.email));
  const rolReal = new Map((perfiles ?? []).map((p) => [p.email, p.role]));

  const linea = '═'.repeat(66);
  console.log(`\n${linea}`);
  console.log('  CUENTAS LISTAS — CEN Labs   (URL local: http://localhost:3001/login)');
  console.log(linea);
  console.log(`  ${'ROL'.padEnd(10)}${'EMAIL'.padEnd(38)}CONTRASEÑA`);
  console.log('  ' + '─'.repeat(62));
  for (const r of resultados) {
    const rolMostrar = r.role === 'profesor' ? 'maestro' : r.role;
    const ok = rolReal.get(r.email) === r.role ? '' : `  ⚠️ rol en DB=${rolReal.get(r.email) ?? 'ninguno'}`;
    console.log(`  ${rolMostrar.padEnd(10)}${r.email.padEnd(38)}${PASSWORD}${ok}`);
  }
  console.log(linea);
  console.log('  Maestro entra a la vista de profesor (/) · Alumno a /alumno/inicio');
  console.log('  Nota: al iniciar sesión, marca el checkbox de Aviso de Privacidad.\n');
}

main().catch((err) => {
  console.error('\n❌  Error fatal:', err);
  process.exit(1);
});
