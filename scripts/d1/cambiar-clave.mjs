// =============================================================================
// Cambiar la contraseña de una cuenta (lo que antes hacía el correo de Supabase).
//   node scripts/d1/cambiar-clave.mjs alumno@escuela.mx              → genera una clave nueva y la muestra UNA vez
//   NUEVA_CLAVE='…' node scripts/d1/cambiar-clave.mjs alumno@escuela.mx → usa esa
//
// Además: cierra al instante todas las sesiones abiertas de esa cuenta (sube
// sesion_version) y le quita la pausa por intentos fallidos.
// Base: BASE_D1=<id de la base>, obligatorio. Antes era la del piloto por omisión: después del
// cambio, olvidar la variable cambiaba la clave en el piloto, decía «Listo» y el alumno seguía
// sin poder entrar. Antes de tocar nada muestra el NOMBRE de la base.
// =============================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

const CUENTA = '226aa1ea2896760a5b68180a66c3170f'
const BASE_D1 = process.env.BASE_D1
const correo = (process.argv[2] ?? '').trim().toLowerCase()
if (!/^[^@\s]+@[^@\s]+$/.test(correo)) { console.log('uso: BASE_D1=<id de la base> node scripts/d1/cambiar-clave.mjs <correo>'); process.exit(1) }
if (!/^[0-9a-f-]{36}$/.test(BASE_D1 ?? '')) { console.log('Falta BASE_D1=<id de la base> (npx wrangler d1 list). No se cambió nada.'); process.exit(1) }

// Clave fácil de dictar a un niño: sin letras que se confunden (l/1, O/0).
const LETRAS = 'abcdefghjkmnpqrstuvwxyz', NUM = '23456789'
const azar = (s, n) => Array.from(crypto.randomBytes(n), (b) => s[b % s.length]).join('')
const generada = !process.env.NUEVA_CLAVE
const clave = process.env.NUEVA_CLAVE ?? `${azar(LETRAS, 4)}-${azar(NUM, 4)}`
if (clave.length < 6) { console.log('la clave debe tener al menos 6 caracteres'); process.exit(1) }

const token = process.env.CF_API_TOKEN ?? fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1]
async function consultar(sql, params) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.success) throw new Error(JSON.stringify(j.errors ?? r.status).slice(0, 300) + ' (¿sesión de wrangler caducada? corre: npx wrangler whoami)')
  return j.result[0]
}

const info = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
if (!info?.success) { console.log('No se encontró esa base (¿id mal copiado o sesión de wrangler caducada?). No se cambió nada.'); process.exit(1) }
console.log(`Base: ${info.result.name}`)

const hash = await bcrypt.hash(clave, 10)
const r = await consultar(
  `UPDATE auth_users SET encrypted_password = ?, sesion_version = sesion_version + 1, updated_at = ? WHERE lower(email) = ? RETURNING id`,
  [hash, new Date().toISOString(), correo],
)
if (!r.results.length) { console.log(`No existe ninguna cuenta con el correo ${correo}. No se cambió nada.`); process.exit(1) }
// La pausa de la cuenta y las de cada dispositivo (llave «correo|dispositivo»).
await consultar(`DELETE FROM auth_fallos WHERE email = ? OR substr(email, 1, ?) = ?`, [correo, correo.length + 1, correo + '|'])
console.log(`Listo: ${correo} tiene contraseña nueva y se cerraron sus sesiones abiertas.`)
if (generada) console.log(`Contraseña nueva (dísela al alumno; no se vuelve a mostrar): ${clave}`)
