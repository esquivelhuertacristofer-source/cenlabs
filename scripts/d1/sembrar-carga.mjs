// Piloto D1 de Labs (2026-11-03) — cuentas SINTÉTICAS para las baterías y la carga, solo en
// la D1 del piloto (o la local). 300 alumnos en 10 grupos «Piloto carga …» de 30, su docente,
// un docente SIN grupos (el caso de 7 de los 8 profesores reales), un admin y un alumno sin
// grupo. Correos @carga.piloto-d1.invalid: verificar-integridad.mjs los descarta por dominio
// y por nombre de grupo. La clave queda en .export/carga.json (gitignored); el hash bcrypt es
// el de cualquier alta.
//   node scripts/d1/sembrar-carga.mjs   → escribe .export/carga.sql
//   npx wrangler d1 execute labs-d1 --local  --file .export/carga.sql   (pruebas locales)
//   npx wrangler d1 execute labs-d1 --remote --file .export/carga.sql   (piloto, NUNCA producción)
// Con .export/carga.json ya creado, reescribe carga.sql con la MISMA clave e ids (para sembrar
// la local y la remota igual) en vez de inventar otros.
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'

const N = 300, POR_GRUPO = 30, DOM = 'carga.piloto-d1.invalid', ALTA = '2026-11-03T00:00:00.000Z'
const previo = fs.existsSync('.export/carga.json') ? JSON.parse(fs.readFileSync('.export/carga.json', 'utf8')) : null
const clave = previo?.clave ?? crypto.randomBytes(12).toString('base64url')
const hash = previo?.hash ?? bcrypt.hashSync(clave, 10)
const id = (k) => (previo?.ids?.[k]) ?? crypto.randomUUID()
const ids = {}
const s = []
const cuenta = (k, email, nombre, role) => {
  ids[k] = id(k)
  s.push(`INSERT INTO auth_users (id, email, encrypted_password, email_confirmed_at) VALUES ('${ids[k]}', '${email}', '${hash}', '${ALTA}');`)
  s.push(`INSERT INTO profiles (id, email, full_name, role) VALUES ('${ids[k]}', '${email}', '${nombre}', '${role}');`)
  return ids[k]
}
const docente = cuenta('docente', `docente@${DOM}`, 'Docente carga', 'profesor')
cuenta('docenteSinGrupos', `docente-sin-grupos@${DOM}`, 'Docente sin grupos', 'profesor')
cuenta('admin', `admin@${DOM}`, 'Admin piloto', 'admin')
cuenta('alumnoSinGrupo', `alumno-sin-grupo@${DOM}`, 'Alumno sin grupo', 'alumno')
const grupos = []
for (let i = 0; i < N / POR_GRUPO; i++) {
  const k = `grupo${i}`; ids[k] = id(k); grupos.push(ids[k])
  s.push(`INSERT INTO grupos (id, nombre, id_profesor) VALUES ('${ids[k]}', 'Piloto carga ${String.fromCharCode(65 + i)}', '${docente}');`)
}
const correos = []
for (let i = 1; i <= N; i++) {
  const email = `alumno${String(i).padStart(3, '0')}@${DOM}`
  correos.push(email)
  const a = cuenta(`alumno${i}`, email, `Alumno carga ${i}`, 'alumno')
  s.push(`INSERT INTO alumnos_grupos (id_alumno, id_grupo) VALUES ('${a}', '${grupos[Math.floor((i - 1) / POR_GRUPO)]}');`)
}
// Cuenta rara 10c.9 que producción no tiene: un alumno en DOS grupos (alumno300: J y A).
s.push(`INSERT INTO alumnos_grupos (id_alumno, id_grupo) VALUES ('${ids.alumno300}', '${grupos[0]}');`)
fs.mkdirSync('.export', { recursive: true })
fs.writeFileSync('.export/carga.sql', s.join('\n') + '\n')
fs.writeFileSync('.export/carga.json', JSON.stringify({ clave, hash, ids, correos, docente: `docente@${DOM}`, docenteSinGrupos: `docente-sin-grupos@${DOM}`, admin: `admin@${DOM}`, alumnoSinGrupo: `alumno-sin-grupo@${DOM}`, grupos }))
// No se imprime la clave.
console.log(`sentencias ${s.length} → .export/carga.sql (${previo ? 'mismas ids y clave' : 'nuevas'})`)
