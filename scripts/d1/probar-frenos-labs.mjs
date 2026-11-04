// =============================================================================
// Labs (2026-11-03, copia de Financiera). ¿Los frenos cortan un abuso? Solo contra el piloto. (Que NO corten el uso legítimo lo mide
// la batería de carga: cero 429 con 300 alumnos desde una IP.)
//   node scripts/d1/probar-frenos-labs.mjs
// Los dos casos que el freno de worker.ts promete (ver su encabezado):
//   1. Bucle en UNA conexión (una pestaña que reintenta sin parar): el contador exacto del
//      isolate lo corta en la misma ventana de 10 s.
//   2. Script con MUCHAS conexiones sostenido: los isolates cuentan por separado y lo corta el
//      limitador nativo de Cloudflare, aproximado y tarde (en NEM cortó a los ~31 s).
//   3. Pasado el freno, la sesión vuelve sola.
// Usa un alumno sintético de carga (.export/carga.json). No imprime claves.
// =============================================================================
import fs from 'node:fs'
import { Agent } from 'undici'

const B = 'https://labs-d1.campanaeducativanacional.workers.dev'
const K = JSON.parse(fs.readFileSync('.export/carga.json', 'utf8'))
const manifiesto = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8')).node
const LOGIN = Object.entries(manifiesto).find(([, v]) => v.exportedName === 'iniciarSesion')[0]
const galleta = (r, n) => (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(n + '='))?.split(';')[0]
let fallos = 0
const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) fallos++ }
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

const disp = galleta(await fetch(`${B}/login`, { redirect: 'manual' }), 'labs_disp')
const r = await fetch(`${B}/login`, { method: 'POST', redirect: 'manual',
  headers: { 'Next-Action': LOGIN, 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component', Origin: B, Cookie: disp }, body: JSON.stringify([K.correos[299], K.clave]) })
const cookie = `${disp}; ${galleta(r, 'labs_sesion')}`
const pedir = (dispatcher) => fetch(`${B}/api/datos`, { dispatcher, method: 'POST', headers: { 'Content-Type': 'application/json', Origin: B, Cookie: cookie },
  body: JSON.stringify({ lote: [{ tipo: 'tabla', tabla: 'intentos', ops: [['select', ['sim_id']]] }] }) })

console.log('1. Una pestaña en bucle: una sola conexión, sin pausa, 30 s (tope 80 cada 10 s)')
{
  const una = new Agent({ connections: 1, pipelining: 1 })
  let atendidas = 0, primer429 = 0
  const t0 = Date.now()
  for (let i = 1; i <= 1000 && Date.now() - t0 < 30_000; i++) {
    const s = (await pedir(una)).status
    if (s === 200) atendidas++
    if (s === 429 && !primer429) { primer429 = i; break }
  }
  ok(primer429 > 0, primer429 ? `cortada en la petición ${primer429} (${((Date.now() - t0) / 1000).toFixed(1)} s), ${atendidas} atendidas antes` : `nunca se cortó (${atendidas} atendidas)`)
  await una.close()
}

await espera(12_000)
console.log('2. Un script con muchas conexiones, sostenido 60 s a ~25 pet/s')
{
  const muchas = new Agent({ connections: 50 })
  const t0 = Date.now()
  let primer429 = 0, n = 0, n429 = 0, n5xx = 0
  const enVuelo = []
  while (Date.now() - t0 < 60_000) {
    enVuelo.push(pedir(muchas).then((x) => { n++; if (x.status === 429) { n429++; primer429 ||= Date.now() - t0 } else if (x.status >= 500) n5xx++; return x.arrayBuffer() }).catch(() => {}))
    await espera(40)
  }
  await Promise.all(enVuelo)
  ok(n429 > 0, n429 ? `cortado a los ${(primer429 / 1000).toFixed(0)} s; ${n429} de ${n} frenadas` : `nunca se cortó (${n} peticiones)`)
  ok(n5xx === 0, `sin 5xx (${n5xx})`)
  await muchas.close()
}

console.log('3. Pasado el freno, la sesión vuelve sola')
let vuelve = 0
for (let s = 0; s < 90 && !vuelve; s += 5) { await espera(5000); if ((await pedir()).status === 200) vuelve = s + 5 }
ok(vuelve > 0, vuelve ? `vuelve a los ${vuelve} s` : 'no volvió en 90 s')
console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo pasó')
process.exit(fallos ? 1 : 0)
