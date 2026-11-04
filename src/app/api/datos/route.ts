import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { atenderLote } from '@/lib/d1/navegador'

// Financiera sobre D1 — por aquí pasa lo que el navegador antes le pedía a Supabase
// directamente (src/lib/supabase-browser.ts). Qué se acepta: src/lib/d1/navegador.ts.

export const dynamic = 'force-dynamic'

const MAX_CUERPO = 64 * 1024

export async function POST(req: NextRequest) {
  // Solo desde el propio sitio (CSRF): el navegador marca `sec-fetch-site` y no se puede
  // falsificar desde otra página; si falta, se compara el origen con el host.
  const sitio = req.headers.get('sec-fetch-site')
  const origen = req.headers.get('origin')
  const mismoSitio = sitio ? sitio === 'same-origin' : !!origen && new URL(origen).host === req.headers.get('host')
  if (!mismoSitio) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  if (!(req.headers.get('content-type') ?? '').startsWith('application/json')) return NextResponse.json({ error: 'Tipo no permitido' }, { status: 415 })

  const texto = await req.text()
  if (texto.length > MAX_CUERPO) return NextResponse.json({ error: 'Envío demasiado grande' }, { status: 413 })
  let cuerpo: { lote?: unknown }
  try { cuerpo = JSON.parse(texto) } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const cliente = await createSupabaseServerClient()
  const resultados = await atenderLote(cliente, cuerpo?.lote)
  if (!resultados) return NextResponse.json({ error: 'Lote inválido' }, { status: 400 })
  return NextResponse.json({ resultados }, { headers: { 'Cache-Control': 'no-store, private' } })
}
