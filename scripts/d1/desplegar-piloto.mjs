// =============================================================================
// Despliega el PILOTO labs-d1 a labs-d1.<subdominio>.workers.dev — nunca a producción.
//   npm run deploy:piloto            (build + guardas + deploy)
//   npm run deploy:piloto -- --seco  (build + guardas, sin subir nada)
//   npm run deploy:piloto -- --ensayo (lo mismo para labs-d1-ensayo, con wrangler.ensayo.jsonc)
//
// Guardas, en orden; cualquiera que falle para todo antes de subir:
//   1. wrangler.jsonc: name = "labs-d1", sin "routes"/"route", workers_dev true, la base D1 y
//      el KV del piloto, y que NINGÚN id sea de producción (cen-dashboard).
//   2. lint sin errores.
//   3. build (gen-lab-registry, gen-lab-briefings, opennextjs-cloudflare build).
//   4. revisar-paquete: sin secretos copiados de .env* y sin el proyecto de Supabase.
//   5. deploy con -c wrangler.jsonc explícito.
// Los secretos (SESION_SECRETO) van aparte, con `wrangler secret put` sobre labs-d1.
// =============================================================================
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const seco = process.argv.includes('--seco')
// --ensayo: el worker labs-d1-ensayo (wrangler.ensayo.jsonc), su base y su KV.
const ensayo = process.argv.includes('--ensayo')
// Después de la ventana (cambiar-carpeta.mjs) wrangler.jsonc es el de PRODUCCIÓN y el del piloto
// vive en wrangler.piloto.jsonc; la guarda de nombre de abajo impide desplegar al lado equivocado.
const ARCH = ensayo ? 'wrangler.ensayo.jsonc' : fs.existsSync('wrangler.piloto.jsonc') ? 'wrangler.piloto.jsonc' : 'wrangler.jsonc'
const NOMBRE = ensayo ? 'labs-d1-ensayo' : 'labs-d1'
const paso = (t) => console.log(`\n── ${t}`)
const correr = (cmd) => execSync(cmd, { stdio: 'inherit', shell: true })
const alto = (m) => { console.error(`desplegar-piloto: ALTO. ${m} No se desplegó nada.`); process.exit(1) }

paso('1/5 configuración')
const crudo = fs.readFileSync(ARCH, 'utf8')
const cfg = JSON.parse(crudo.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'))
if (cfg.name !== NOMBRE) alto(`${ARCH} dice name="${cfg.name}", no "${NOMBRE}".`)
if ('routes' in cfg || 'route' in cfg) alto(`${ARCH} tiene rutas: le quitaría el dominio a producción.`)
if (cfg.workers_dev !== true) alto('workers_dev no es true: el piloto solo vive en *.workers.dev.')
const self = (cfg.services ?? []).find((s) => s.binding === 'WORKER_SELF_REFERENCE')
if (self && self.service !== NOMBRE) alto(`WORKER_SELF_REFERENCE apunta a "${self.service}".`)
const D1_PILOTO = ensayo ? 'f7d74fd0-5a8d-4208-957d-440ab05a8175' : '0d75ce94-5d36-4659-872d-f01907d08f9a'
const KV_PILOTO = ensayo ? 'ea0beee83244443eb402b77ab6424c79' : 'c12796fe8fc7462eb1c071598d89cc3b'
const d1 = (cfg.d1_databases ?? []).map((d) => d.database_id), kv = (cfg.kv_namespaces ?? []).map((k) => k.id)
if (d1.length !== 1 || d1[0] !== D1_PILOTO) alto(`la D1 no es la del piloto (${d1.join(', ')}).`)
if (kv.some((k) => k !== KV_PILOTO)) alto(`hay un KV que no es el del piloto (${kv.join(', ')}).`)
if (/cen-dashboard/.test(crudo.replace(/^\s*\/\/.*$/gm, ''))) alto('wrangler.jsonc nombra cen-dashboard fuera de comentarios.')
console.log(`${NOMBRE}, sin rutas, workers.dev, su D1 y su KV ✓`)

paso('2/5 lint')
correr('npx eslint --quiet')

paso('3/5 build')
correr('node scripts/gen-lab-registry.mjs && node scripts/gen-lab-briefings.mjs && npx opennextjs-cloudflare build')

paso('4/5 revisar paquete')
correr('node scripts/d1/revisar-paquete.mjs')

if (seco) { console.log('\n--seco: todo listo, no se subió nada.'); process.exit(0) }
paso(`5/5 deploy a ${NOMBRE}.*.workers.dev`)
correr(`npx opennextjs-cloudflare deploy -c ${ARCH}`)
