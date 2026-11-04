// =============================================================================
// Revisa el paquete ya construido ANTES de subirlo: que no lleve secretos dentro.
//   node scripts/d1/revisar-paquete.mjs        (va en «npm run deploy», después del build)
//
// Por qué: OpenNext copia TODO .env.local (y .env, .env.production…) dentro del worker, en
// .open-next/cloudflare/next-env.mjs, y en producción lo usa como respaldo de process.env
// cuando falta un secreto del worker. Medido el 2026-10-29: el paquete del piloto llevaba
// SESION_SECRETO; si en la ventana del cambio no se cargaba el secreto nuevo, producción habría
// firmado las sesiones con el del piloto, que está en archivos de este equipo, sin ningún error.
// Lo mismo con las llaves de Supabase que hoy tiene .env.local de nem-plataforma.
// Los secretos van solo con `wrangler secret put` / --secrets-file. Este script para el
// despliegue si encuentra uno.
// =============================================================================
import fs from 'node:fs'

const ARCHIVO = '.open-next/cloudflare/next-env.mjs'
if (!fs.existsSync(ARCHIVO)) {
  console.error(`revisar-paquete: no existe ${ARCHIVO}; primero el build`)
  process.exit(1)
}
const texto = fs.readFileSync(ARCHIVO, 'utf8')
const nombres = new Set([...texto.matchAll(/"([A-Z][A-Z0-9_]*)":/g)].map((m) => m[1]))
// Lo público por diseño (NEXT_PUBLIC_*) ya va al navegador; las claves de las cuentas demo son
// de demostración y conocidas (se avisa, no se frena).
const SECRETO = /SECRET|SECRETO|SERVICE_ROLE|DB_URL|DATABASE_URL|TOKEN|PRIVATE|PASSWORD|_KEY$|API_KEY/
const malos = [...nombres].filter((n) => !n.startsWith('NEXT_PUBLIC_') && SECRETO.test(n))
const demo = [...nombres].filter((n) => n.startsWith('CLAVE_DEMO_'))

if (demo.length) console.log(`revisar-paquete: aviso, el paquete lleva ${demo.length} claves de cuentas demo (${demo.join(', ')})`)
if (malos.length) {
  console.error(`revisar-paquete: ALTO. El paquete lleva secretos copiados de .env*: ${malos.join(', ')}`)
  console.error('  Sácalos de .env.local (a .dev.vars, o a .env.supabase-archivo) y vuelve a construir. No se desplegó nada.')
  process.exit(1)
}
// Labs (igual que Financiera): después del cambio, el paquete no debe hablar con Supabase en ningún lado
// (manual 8c, punto 4). El id del proyecto en cualquier archivo del paquete frena el despliegue;
// `supabase.co` a secas se cuenta y se avisa (puede venir en comentarios de librerías).
const PROYECTO = 'wbvcclpxxwzkuddjxqig' // Labs (Supabase de producción)
let conProyecto = 0, conSupabase = 0
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) { recorrer(p); continue }
    if (!/\.(m?js|json|html|css|txt|map)$/.test(e.name)) continue
    const t = fs.readFileSync(p, 'utf8')
    if (t.includes(PROYECTO)) { conProyecto++; console.error(`  ${p}`) }
    if (t.includes('supabase.co')) conSupabase++
  }
}
recorrer('.open-next')
if (conProyecto) {
  console.error(`revisar-paquete: ALTO. ${conProyecto} archivo(s) del paquete nombran el proyecto de Supabase (${PROYECTO}). No se desplegó nada.`)
  process.exit(1)
}
if (conSupabase) console.log(`revisar-paquete: aviso, ${conSupabase} archivo(s) mencionan supabase.co (sin el proyecto de Labs)`)
console.log(`revisar-paquete: sin secretos en el paquete (${nombres.size} variables revisadas) y sin el proyecto de Supabase`)
