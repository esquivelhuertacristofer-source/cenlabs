// Humo de PRODUCCIÓN con login real en navegador (usado en la ventana del 2026-11-03).
//   node scripts/d1/humo-produccion.mjs [https://cenlaboratorios.com.mx]
// Necesita una cuenta TEMPORAL en labs-produccion descrita en .export/humo-prod.json ({ id, email }),
// con id de crypto.randomUUID() (un id que no es UUID hace fallar la prueba, no la versión) y el
// hash de .export/carga.json. Entra, revisa panel, getUser, que el alumno no entre a docente/admin
// y abre un lab. ESCRIBE en producción (un intento en curso): borrar la cuenta y su intento al final.
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire('C:/Users/crist/Desktop/nem-d1/package.json')
const { chromium } = require('playwright')
const B = process.argv[2] ?? 'https://cenlaboratorios.com.mx'
const K = JSON.parse(fs.readFileSync('.export/carga.json', 'utf8')), H = JSON.parse(fs.readFileSync('.export/humo-prod.json', 'utf8'))
const nav = await chromium.launch(); const p = await (await nav.newContext()).newPage()
const err = [], malas = []
p.on('pageerror', (e) => err.push(e.message.slice(0, 100))); p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(B)) malas.push(`${r.status()} ${r.url().replace(B, '')}`) })
const t0 = Date.now()
await p.goto(`${B}/login`, { waitUntil: 'networkidle' })
if (await p.locator('text=Avísale a tu maestro').count() === 0) console.log('⚠ el login NO es el de D1')
await p.fill('input[placeholder="usuario@institucion.edu"]', H.email); await p.fill('input[placeholder="••••••••"]', K.clave)
await p.locator('label:has(input[type="checkbox"])').first().click()
await p.click('button[type="submit"]'); await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 }).catch(() => {})
await p.waitForLoadState('networkidle'); await p.waitForTimeout(2500)
const tras = new URL(p.url()).pathname
const yo = await p.evaluate(async () => (await (await fetch('/api/datos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lote: [{ tipo: 'auth', accion: 'getUser' }] }) })).json()).resultados[0].data.user?.id)
const fuera = []
for (const r of ['/', '/admin/usuarios']) { await p.goto(B + r, { waitUntil: 'networkidle' }); fuera.push(`${r}→${new URL(p.url()).pathname}`) }
await p.goto(`${B}/alumno/simulador/fisica-1`, { waitUntil: 'networkidle' }); await p.waitForTimeout(6000)
const lab = new URL(p.url()).pathname
await p.goto(`${B}/alumno/inicio`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
const bien = tras === '/alumno/inicio' && yo === H.id && lab === '/alumno/simulador/fisica-1' && err.length === 0 && malas.length === 0
console.log(`humo ${bien ? '✓' : '✗'} · login → ${tras} (${Date.now() - t0} ms) · getUser ${yo === H.id ? 'ok' : 'NO'} · ${fuera.join(' ')} · lab ${lab} · errores JS ${err.length} · 4xx/5xx ${malas.length} ${malas.slice(0, 3).join(' ')}`)
await nav.close()
process.exit(bien ? 0 : 1)
