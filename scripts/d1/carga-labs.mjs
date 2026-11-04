// =============================================================================
// Escuela simulada contra el piloto de Labs — SOLO labs-d1.*.workers.dev, nunca el dominio.
//   node scripts/d1/carga-labs.mjs <alumnos>:<segundos> [...]     p. ej. 100:30 200:30
// Cada alumno virtual hace lo que hace uno real, con los lotes COPIADOS del navegador
// (.export/lotes-labs.json, capturados en el piloto el 2026-11-03): abre /login, entra, abre
// /alumno/inicio con sus lotes, y abre 3 laboratorios: la página del simulador, sus lotes
// (incluye el upsert del intento en curso) y la acción syncIntentoServer que guarda el
// resultado, con pausas de 1–3 s. Todos salen por UNA IP, como una escuela detrás de su módem.
// Meta (criterio 7): ≥ 99.9 % completos, cero 429, cero 5xx y todo guardado en la base.
// Usa los alumnos sintéticos de .export/carga.json. No imprime claves. Al final borra los
// intentos «carga-…» que dejó, solo en la D1 del piloto.
// =============================================================================
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const B = process.env.BASE ?? 'https://labs-d1.campanaeducativanacional.workers.dev'
if (!/^https:\/\/labs-d1(-ensayo)?\.[a-z0-9-]+\.workers\.dev$/.test(B)) throw new Error(`Solo contra el piloto (no ${B})`)
const BASE_D1 = B.includes('labs-d1-ensayo') ? 'labs-d1-ensayo' : 'labs-d1'
const K = JSON.parse(fs.readFileSync('.export/carga.json', 'utf8'))
const LOTES = JSON.parse(fs.readFileSync('.export/lotes-labs.json', 'utf8'))
const manifiesto = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8')).node
const ACCION = Object.fromEntries(Object.entries(manifiesto).map(([id, v]) => [v.exportedName, id]))
const LABS = ['fisica-1', 'quimica-1', 'biologia-1']
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const galleta = (r, n) => (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(n + '='))?.split(';')[0]

async function medir(paso, reg, fn) {
  const t0 = performance.now()
  try {
    const r = await fn()
    ;(reg.tiempos[paso] ??= []).push(performance.now() - t0)
    if (r.status === 429) reg.n429++
    else if (r.status >= 500) reg.n5xx++
    return r
  } catch (e) { reg.redes++; throw e }
}

async function alumno(correo, marca, reg) {
  const r0 = await medir('pagina login', reg, () => fetch(`${B}/login`, { redirect: 'manual' }))
  await r0.arrayBuffer()
  const disp = galleta(r0, 'labs_disp')
  await espera(1000 + Math.random() * 2000)
  const r1 = await medir('login', reg, () => fetch(`${B}/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Next-Action': ACCION.iniciarSesion, 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component', Origin: B, Cookie: disp ?? '' },
    body: JSON.stringify([correo, K.clave]),
  }))
  const t1 = await r1.text()
  const sesion = galleta(r1, 'labs_sesion')
  if (!sesion) throw new Error(`no entró (${r1.status} ${/"error":"([^"]*)"/.exec(t1)?.[1] ?? ''})`)
  const cookie = `${disp}; ${sesion}`
  const pagina = async (paso, ruta) => {
    const r = await medir(paso, reg, () => fetch(B + ruta, { headers: { Cookie: cookie }, redirect: 'manual' }))
    await r.arrayBuffer()
    if (r.status !== 200) throw new Error(`${ruta} respondió ${r.status}`)
  }
  let uid = null
  const datos = async (paso, cuerpo) => {
    const r = await medir(paso, reg, () => fetch(`${B}/api/datos`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: B, Cookie: cookie }, body: cuerpo }))
    if (r.status !== 200) throw new Error(`${paso}: HTTP ${r.status}`)
    const j = await r.json()
    const malo = j.resultados.find((x) => x.error && x.error.code !== 'PGRST116')
    if (malo) throw new Error(`${paso}: ${malo.error.code} ${String(malo.error.message).slice(0, 40)}`)
    return j.resultados
  }
  const rellena = (s, sim) => s.split('{{uid}}').join(uid).split('"fisica-1"').join(`"${sim}"`)
  uid = (await datos('datos inicio', JSON.stringify({ lote: [{ tipo: 'auth', accion: 'getUser' }] })))[0].data.user?.id
  if (!uid) throw new Error('getUser sin usuario')
  await pagina('pagina inicio', '/alumno/inicio')
  for (const x of LOTES.filter((l) => l.ruta === '/api/datos' && l.fase !== 'lab')) await datos('datos inicio', rellena(x.cuerpo, 'x'))
  for (const [i, lab] of LABS.entries()) {
    await espera(1000 + Math.random() * 2000)
    const sim = `carga-${marca}-${i + 1}`
    await pagina('pagina lab', `/alumno/simulador/${lab}`)
    for (const x of LOTES.filter((l) => l.ruta === '/api/datos' && l.fase === 'lab')) await datos('datos lab', rellena(x.cuerpo, sim))
    // Guardar el resultado, como el puente del lab (acción de servidor).
    const r = await medir('guardar intento', reg, () => fetch(`${B}/alumno/simulador/${lab}`, {
      method: 'POST', redirect: 'manual',
      headers: { 'Next-Action': ACCION.syncIntentoServer, 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component', Origin: B, Cookie: cookie },
      body: JSON.stringify([{ id_alumno: uid, sim_id: sim, score: 80, total_time_seconds: 40, last_step: 5, status: 'completed', bitacora_data: { hallazgos: [], labId: lab } }]),
    }))
    const tx = await r.text()
    if (r.status !== 200 || /^1:E/m.test(tx)) throw new Error(`guardar intento: HTTP ${r.status}`)
  }
}

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]) : 0 }
const d1Una = (sql) => JSON.parse(execSync(`npx wrangler d1 execute ${BASE_D1} --remote --json --command "${sql}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))[0].results
const d1 = (sql) => { try { return d1Una(sql) } catch { execSync('npx wrangler whoami', { stdio: 'ignore' }); return d1Una(sql) } }

let todoBien = true
for (const [ronda, arg] of process.argv.slice(2).entries()) {
  const [n, seg] = arg.split(':').map(Number)
  if (n > K.correos.length) throw new Error(`hay ${K.correos.length} alumnos sintéticos`)
  const reg = { tiempos: {}, n429: 0, n5xx: 0, redes: 0 }
  const errores = {}
  const t0 = Date.now()
  const marca = `${Date.now().toString(36)}${ronda}`
  const res = await Promise.all(K.correos.slice(0, n).map(async (c, i) => {
    await espera((i / n) * seg * 1000)
    try { await alumno(c, marca, reg); return true } catch (e) { const m = String(e.message).slice(0, 80); errores[m] = (errores[m] ?? 0) + 1; return false }
  }))
  const bien = res.filter(Boolean).length
  const guardados = d1(`SELECT count(*) AS n FROM intentos WHERE sim_id LIKE 'carga-${marca}-%' AND status = 'completed'`)[0].n
  const pctBien = (100 * bien) / n
  console.log(`\n${n} alumnos en ${seg} s (una IP) — ${((Date.now() - t0) / 1000).toFixed(0)} s en total`)
  console.log(`  completaron todo: ${bien}/${n} (${pctBien.toFixed(1)} %)   429: ${reg.n429}   5xx: ${reg.n5xx}   red: ${reg.redes}`)
  console.log(`  intentos completados guardados en la base: ${guardados}/${bien * 3} de los que terminaron`)
  for (const [paso, xs] of Object.entries(reg.tiempos)) console.log(`  ${paso.padEnd(18)} p50 ${String(pct(xs, 50)).padStart(5)} ms   p95 ${String(pct(xs, 95)).padStart(5)} ms   p99 ${String(pct(xs, 99)).padStart(5)} ms   (${xs.length})`)
  for (const [m, k] of Object.entries(errores)) console.log(`  ✗ ${k} × ${m}`)
  const paso = pctBien >= 99.9 && reg.n429 === 0 && reg.n5xx === 0 && guardados >= bien * 3
  console.log(`  ${paso ? '✓' : '✗'} meta: ≥ 99.9 % completos, cero 429, cero 5xx y todo lo guardado en la base`)
  todoBien &&= paso
  await espera(15_000) // que se vacíen las ventanas de 10 s de los frenos antes de la ronda siguiente
}
d1(`DELETE FROM intentos WHERE sim_id LIKE 'carga-%'`)
process.exit(todoBien ? 0 : 1)
