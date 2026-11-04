// Humo de un worker de Labs (piloto o ensayo; nunca el dominio): login real con una cuenta
// sintética, panel del alumno, getUser y un lab estático. Sale 0 si todo responde bien.
//   node scripts/d1/humo.mjs https://labs-d1-ensayo.<sub>.workers.dev
import fs from 'node:fs'
const B = process.argv[2]
if (!/^https:\/\/labs-d1(-ensayo)?\.[a-z0-9-]+\.workers\.dev$/.test(B ?? '')) throw new Error(`solo piloto/ensayo (no ${B})`)
const K = JSON.parse(fs.readFileSync('.export/carga.json', 'utf8'))
const m = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8')).node
const LOGIN = Object.entries(m).find(([, v]) => v.exportedName === 'iniciarSesion')[0]
const g = (r, n) => (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(n + '='))?.split(';')[0]
const t0 = Date.now()
const disp = g(await fetch(`${B}/login`, { redirect: 'manual' }), 'labs_disp')
const r = await fetch(`${B}/login`, { method: 'POST', redirect: 'manual', headers: { 'Next-Action': LOGIN, 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component', Origin: B, Cookie: disp ?? '' }, body: JSON.stringify([K.correos[10], K.clave]) })
const ses = g(r, 'labs_sesion'); const cookie = `${disp}; ${ses}`
const panel = (await fetch(`${B}/alumno/inicio`, { headers: { Cookie: cookie }, redirect: 'manual' })).status
const yo = (await (await fetch(`${B}/api/datos`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: B, Cookie: cookie }, body: JSON.stringify({ lote: [{ tipo: 'auth', accion: 'getUser' }] }) })).json()).resultados?.[0]?.data?.user?.id
const lab = (await fetch(`${B}/labs/plataforma-stewart-seis-actuadores.html`)).status
const bien = !!ses && panel === 200 && yo === K.ids.alumno11 && lab === 200
console.log(`humo ${bien ? '✓' : '✗'} login ${ses ? 'ok' : 'NO'} · panel ${panel} · getUser ${yo === K.ids.alumno11 ? 'ok' : 'NO'} · lab ${lab} · ${Date.now() - t0} ms`)
process.exit(bien ? 0 : 1)
