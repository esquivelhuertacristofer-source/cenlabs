/**
 * piloto-setup.ts — Setup automatizado del onboarding piloto
 * Ejecutar: npx tsx scripts/piloto-setup.ts
 *
 * Hace TODO sin tocar el Supabase Dashboard:
 *   1. Verifica acceso con service_role
 *   2. Decide/crea admin
 *   3. Verifica tablas
 *   4. Crea GRUPO-PILOTO-001
 *   5. Crea 10 alumnos ficticios
 *   6. Verifica/repara vínculos alumnos_grupos
 *   7. Crea profesor
 *   8. Verifica/repara roles en profiles
 *   9. Escribe credenciales en output/
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Cargar .env.local ────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx === -1) continue
    const k = t.slice(0, idx).trim()
    const v = t.slice(idx + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

// ── Constantes ───────────────────────────────────────────────────────────────
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DOMAIN           = 'cenlaboratorios.com'
const PASSWORD         = 'piloto2026'
const GRUPO_NOMBRE     = 'GRUPO-PILOTO-001'

const ALUMNOS = [
  'Sofía Martínez García',
  'Diego Hernández López',
  'Valentina Ramírez Cruz',
  'Mateo González Pérez',
  'Ximena Torres Sánchez',
  'Sebastián Flores Rivera',
  'Camila Vázquez Morales',
  'Emiliano Castro Jiménez',
  'Isabella Ruiz Mendoza',
  'Santiago Aguilar Romero',
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateEmail(fullName: string): string {
  return (
    fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '.') +
    '@' + DOMAIN
  )
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function sep(title: string) {
  const line = '═'.repeat(62)
  console.log(`\n${line}\n  ${title}\n${line}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    console.error('❌  Faltan SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL en .env.local')
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ─── PASO 1: Verificar acceso ────────────────────────────────────────────
  sep('PASO 1 — Verificar acceso con service_role')

  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listErr) {
    console.error('❌  No puedo conectar con Supabase:', listErr.message)
    process.exit(1)
  }
  const allAuthUsers = listData.users
  console.log(`✅  Conexión exitosa. Total usuarios en auth: ${allAuthUsers.length}`)

  const first10 = allAuthUsers.slice(0, 10).map(u => `    • ${u.email}`)
  console.log('Primeros 10 emails:\n' + (first10.join('\n') || '    (ninguno)'))

  const jaraAccounts = allAuthUsers.filter(u => u.email?.toLowerCase().startsWith('jara'))
  if (jaraAccounts.length) {
    console.log('\nCuentas jara* encontradas:')
    jaraAccounts.forEach(u => console.log(`    • ${u.email}  (id: ${u.id})`))
  } else {
    console.log('\nNo se encontraron cuentas jara*')
  }

  // ─── PASO 2: Admin ───────────────────────────────────────────────────────
  sep('PASO 2 — Decidir admin')

  const { data: existingAdmins } = await admin
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('role', 'admin')

  let adminEmail = 'admin@cenlaboratorios.com'

  if (existingAdmins && existingAdmins.length > 0) {
    adminEmail = existingAdmins[0].email
    console.log(`✅  Admin(s) ya existen:`)
    existingAdmins.forEach(a => console.log(`    • ${a.email}  (${a.full_name ?? '—'})`))
  } else if (jaraAccounts.length > 0) {
    const target = jaraAccounts[0]
    adminEmail = target.email!
    const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', target.id)
    if (error) console.error(`❌  Error promoviendo ${adminEmail}:`, error.message)
    else console.log(`✅  Promovido a admin: ${adminEmail}`)
  } else {
    const existingAdminAuth = allAuthUsers.find(u => u.email === 'admin@cenlaboratorios.com')
    if (existingAdminAuth) {
      const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', existingAdminAuth.id)
      if (error) console.error('❌  Error actualizando role:', error.message)
      else console.log(`✅  admin@cenlaboratorios.com ya estaba en auth, role actualizado a admin`)
    } else {
      console.log('ℹ️   Creando admin@cenlaboratorios.com...')
      const { data: newAdmin, error: createErr } = await admin.auth.admin.createUser({
        email: 'admin@cenlaboratorios.com',
        password: 'admin2026',
        email_confirm: true,
        user_metadata: { full_name: 'Administrador CEN Labs', role: 'admin' },
      })
      if (createErr) {
        console.error('❌  Error creando admin:', createErr.message)
      } else {
        await sleep(2500)
        const { error: roleErr } = await admin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', newAdmin.user!.id)
        if (roleErr) console.error('❌  Error seteando role admin:', roleErr.message)
        else console.log(`✅  Admin creado y role seteado: ${adminEmail}`)
      }
    }
  }

  // ─── PASO 3: Estado de tablas ────────────────────────────────────────────
  sep('PASO 3 — Estado de tablas')

  for (const t of ['profiles', 'grupos', 'alumnos_grupos', 'intentos', 'asignaciones'] as const) {
    const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true })
    if (error) console.log(`  ❌  ${t.padEnd(18)} → ${error.message}`)
    else       console.log(`  ✅  ${t.padEnd(18)} → ${count ?? 0} filas`)
  }

  // ─── PASO 4: Crear grupo ─────────────────────────────────────────────────
  sep(`PASO 4 — Grupo ${GRUPO_NOMBRE}`)

  const { data: existingGroup } = await admin
    .from('grupos')
    .select('id, nombre')
    .eq('nombre', GRUPO_NOMBRE)
    .maybeSingle()

  let grupoId: string
  if (existingGroup) {
    grupoId = existingGroup.id
    console.log(`✅  Grupo ya existe → id: ${grupoId}`)
  } else {
    const { data: newGroup, error: groupErr } = await admin
      .from('grupos')
      .insert({ nombre: GRUPO_NOMBRE })
      .select()
      .single()
    if (groupErr || !newGroup) {
      console.error('❌  Error creando grupo:', groupErr?.message)
      process.exit(1)
    }
    grupoId = newGroup.id
    console.log(`✅  Grupo creado → id: ${grupoId}`)
  }

  // ─── PASO 5: Crear 10 alumnos ────────────────────────────────────────────
  sep('PASO 5 — Crear 10 alumnos')

  type UserRecord = { name: string; email: string; id: string; role: string }
  const createdUsers: UserRecord[] = []
  const createErrors: { name: string; error: string }[] = []

  for (const nombre of ALUMNOS) {
    const email = generateEmail(nombre)
    const existing = allAuthUsers.find(u => u.email === email)

    if (existing) {
      console.log(`  ⏭️   Ya existe: ${email}`)
      createdUsers.push({ name: nombre, email, id: existing.id, role: 'alumno' })
      continue
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: nombre, role: 'alumno', group_id: grupoId },
    })

    if (createErr) {
      console.log(`  ❌  ${nombre.padEnd(28)} → ${createErr.message}`)
      createErrors.push({ name: nombre, error: createErr.message })
    } else {
      console.log(`  ✅  ${nombre.padEnd(28)} → ${email}`)
      createdUsers.push({ name: nombre, email, id: created.user!.id, role: 'alumno' })
    }

    await sleep(350)
  }

  console.log(`\nAlumnos OK: ${createdUsers.length}  |  Errores: ${createErrors.length}`)
  if (createErrors.length) {
    createErrors.forEach(e => console.log(`  ⚠️   ${e.name}: ${e.error}`))
  }

  // ─── PASO 6: Verificar trigger → alumnos_grupos ──────────────────────────
  sep('PASO 6 — Verificar trigger alumnos_grupos')
  await sleep(3500)

  const alumnoIds = createdUsers.map(u => u.id)
  const { data: agRows } = await admin
    .from('alumnos_grupos')
    .select('id_alumno, id_grupo')
    .eq('id_grupo', grupoId)

  const linkedIds = new Set((agRows ?? []).map(r => r.id_alumno))
  const unlinked = createdUsers.filter(u => u.role === 'alumno' && !linkedIds.has(u.id))

  console.log(`Vínculos existentes: ${agRows?.length ?? 0} de ${createdUsers.length} esperados`)

  if (unlinked.length === 0) {
    console.log('✅  Trigger funcionó — todos los alumnos vinculados al grupo')
  } else {
    console.log(`🔴  TRIGGER NO COMPLETÓ — ${unlinked.length} alumnos sin vínculo. Insertando manualmente...`)
    for (const u of unlinked) {
      const { error: insertErr } = await admin
        .from('alumnos_grupos')
        .insert({ id_alumno: u.id, id_grupo: grupoId })
      if (insertErr) console.log(`  ❌  ${u.email}: ${insertErr.message}`)
      else           console.log(`  ✅  Vinculado: ${u.email}`)
      await sleep(100)
    }
    console.log('\n  ⚠️   BUG DOCUMENTADO: handle_new_user NO inserta en alumnos_grupos.')
    console.log('       La inserción fue manual. Requiere arreglo de trigger en DB.')
  }

  // ─── PASO 7: Crear profesor ──────────────────────────────────────────────
  sep('PASO 7 — Crear profesor piloto')

  const profEmail = 'profesor.piloto@cenlaboratorios.com'
  const existingProf = allAuthUsers.find(u => u.email === profEmail)

  let profId: string
  if (existingProf) {
    console.log(`✅  Profesor ya existe: ${profEmail}`)
    profId = existingProf.id
  } else {
    const { data: prof, error: profErr } = await admin.auth.admin.createUser({
      email: profEmail,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Profesor Piloto', role: 'profesor', group_id: grupoId },
    })
    if (profErr || !prof) {
      console.error('❌  Error creando profesor:', profErr?.message)
      process.exit(1)
    }
    profId = prof.user!.id
    console.log(`✅  Profesor creado: ${profEmail} → ${profId}`)
  }
  createdUsers.push({ name: 'Profesor Piloto', email: profEmail, id: profId, role: 'profesor' })

  // ─── PASO 8: Verificar roles en profiles ────────────────────────────────
  sep('PASO 8 — Verificar y reparar roles en profiles')
  await sleep(2500)

  const allEmails = createdUsers.map(u => u.email)
  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, email, full_name, role')
    .in('email', allEmails)

  const profileMap = new Map((profileRows ?? []).map(p => [p.email, p]))
  const mismatches: { email: string; expected: string; actual: string | null }[] = []

  for (const u of createdUsers) {
    const p = profileMap.get(u.email)
    if (!p) {
      console.log(`  ⚠️   Sin perfil todavía: ${u.email} (trigger lento, se reintentará)`)
      mismatches.push({ email: u.email, expected: u.role, actual: null })
    } else if (p.role !== u.role) {
      mismatches.push({ email: u.email, expected: u.role, actual: p.role })
    }
  }

  if (mismatches.length === 0) {
    console.log(`✅  Todos los roles están correctos (${profileRows?.length ?? 0} perfiles)`)
  } else {
    console.log(`⚠️   ${mismatches.length} discrepancias de rol. Reparando...`)
    for (const m of mismatches) {
      if (!m.actual) {
        console.log(`  ⏳  ${m.email}: sin perfil aún (trigger puede estar demorado)`)
        continue
      }
      const { error } = await admin
        .from('profiles')
        .update({ role: m.expected })
        .eq('email', m.email)
      if (error) console.log(`  ❌  ${m.email}: ${error.message}`)
      else       console.log(`  ✅  ${m.email}: ${m.actual} → ${m.expected}`)
    }
  }

  // ─── PASO 9: Guardar credenciales ────────────────────────────────────────
  sep('PASO 9 — Guardar credenciales')

  const outputDir = resolve(__dir, '../output')
  mkdirSync(outputDir, { recursive: true })

  // piloto-config.ts para uso en otros scripts
  const configContent = `// Auto-generado por piloto-setup.ts — NO commitear
export const PILOTO_CONFIG = {
  GRUPO_ID:    '${grupoId}',
  GRUPO_NOMBRE:'${GRUPO_NOMBRE}',
  ADMIN_EMAIL: '${adminEmail}',
  PASSWORD:    '${PASSWORD}',
  FECHA:       '${new Date().toISOString()}',
} as const
`
  writeFileSync(resolve(__dir, 'piloto-config.ts'), configContent)
  console.log('✅  scripts/piloto-config.ts actualizado')

  // Credenciales legibles
  const maxEmail = Math.max(...createdUsers.map(u => u.email.length), 40)
  const rows = createdUsers.map(u =>
    `  ${u.role.padEnd(10)}  ${u.email.padEnd(maxEmail + 2)}  ${PASSWORD}`
  )
  const creds = [
    '╔══════════════════════════════════════════════════════════════╗',
    '║        CREDENCIALES — GRUPO-PILOTO-001 (CEN Labs)            ║',
    '╠══════════════════════════════════════════════════════════════╣',
    `║  Plataforma:  http://localhost:3001                          ║`,
    `║  Contraseña:  ${PASSWORD.padEnd(46)}║`,
    '╠══════════════════════════════════════════════════════════════╣',
    `  ${'ROL'.padEnd(10)}  ${'EMAIL'.padEnd(maxEmail + 2)}  CONTRASEÑA`,
    '  ' + '─'.repeat(maxEmail + 30),
    ...rows,
    '╚══════════════════════════════════════════════════════════════╝',
  ].join('\n')

  const credPath = resolve(outputDir, 'credenciales-grupo-piloto-001.txt')
  writeFileSync(credPath, creds + '\n')
  console.log(`✅  output/credenciales-grupo-piloto-001.txt`)

  // JSON detallado
  const jsonPath = resolve(outputDir, 'piloto-usuarios.json')
  writeFileSync(jsonPath, JSON.stringify({
    grupo: { id: grupoId, nombre: GRUPO_NOMBRE },
    admin: adminEmail,
    password: PASSWORD,
    fecha: new Date().toISOString(),
    users: createdUsers,
  }, null, 2))
  console.log(`✅  output/piloto-usuarios.json`)

  // ─── VERIFICACIÓN FINAL ──────────────────────────────────────────────────
  sep('VERIFICACIÓN FINAL')

  const { data: finalProfiles } = await admin
    .from('profiles')
    .select('role')
    .in('email', createdUsers.map(u => u.email))

  const counts = { alumno: 0, profesor: 0, admin: 0, otro: 0 }
  for (const p of finalProfiles ?? []) {
    const k = p.role as keyof typeof counts
    if (k in counts) counts[k]++
    else counts.otro++
  }

  const { data: finalLinks } = await admin
    .from('alumnos_grupos')
    .select('id_alumno', { count: 'exact', head: false })
    .eq('id_grupo', grupoId)

  console.log(`Perfiles en DB:  alumnos=${counts.alumno}  profesores=${counts.profesor}  admins=${counts.admin}`)
  console.log(`Vínculos grupo:  ${finalLinks?.length ?? 0} / 10 esperados`)
  console.log(`\n✅  Setup completado.`)
  console.log(`\nAdmin:    admin@cenlaboratorios.com  /  admin2026`)
  console.log(`Piloto:   [email]  /  ${PASSWORD}`)
  console.log(`\nPróximo paso → Fase 6: login manual con las cuentas reales en localhost:3001`)
}

main().catch(err => {
  console.error('\n❌  Error fatal:', err)
  process.exit(1)
})
