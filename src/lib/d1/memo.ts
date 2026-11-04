import 'server-only'

// Piloto D1 — memoria por isolate. D1 atiende UNA consulta a la vez por base, así que
// lo que es igual para todos los alumnos (el catálogo de una fase) no debe pedirse en
// cada página: se guarda aquí unos minutos. Cada isolate tiene la suya; un dato
// publicado tarda a lo más `ttlMs` en verse.
const memoria = new Map<string, { hasta: number; valor: Promise<unknown>; peso: number }>()
// Dos topes: también se guardan cosas por alumno (sesión, sus listas de ids), y sin tope
// un isolate con miles de alumnos podría crecer hasta quedarse sin memoria (128 MB, y al
// pasarse el isolate entero se reinicia: se cae el sitio para todos los que atiende).
// Contar entradas no basta: 4,000 resultados de 30 KB ya son 120 MB. Por eso también se
// suma el tamaño aproximado de cada valor (largo de su JSON) contra un presupuesto.
// Al llenarse se tiran las vencidas y, si no basta, las más viejas (el Map guarda el orden).
const MAX_ENTRADAS = 4000
const MAX_PESO = 24 * 1024 * 1024
let pesoTotal = 0

function quitar(k: string) {
  const v = memoria.get(k)
  if (!v) return
  pesoTotal -= v.peso
  memoria.delete(k)
}

function hacerLugar(ahora: number) {
  for (const [k, v] of memoria) if (v.hasta <= ahora) quitar(k)
  for (const k of memoria.keys()) {
    if (memoria.size < MAX_ENTRADAS * 0.9 && pesoTotal < MAX_PESO * 0.9) break
    quitar(k)
  }
}

/** Largo del JSON del valor: aproxima la memoria que ocupa (un valor que no se serializa cuenta 1 KB). */
function pesar(v: unknown): number {
  try {
    return (JSON.stringify(v)?.length ?? 0) + 64
  } catch {
    return 1024
  }
}

export function memoIsolate<T>(clave: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const ahora = Date.now()
  const hit = memoria.get(clave)
  if (hit && hit.hasta > ahora) return hit.valor as Promise<T>
  if (hit) quitar(clave)
  if (memoria.size >= MAX_ENTRADAS || pesoTotal >= MAX_PESO) hacerLugar(ahora)
  const valor = fn()
  const entrada = { hasta: ahora + ttlMs, valor: valor as Promise<unknown>, peso: clave.length + 64 }
  memoria.set(clave, entrada)
  pesoTotal += entrada.peso
  valor.then(
    (v) => {
      // Si la entrada ya se reemplazó o se tiró, su peso ya no cuenta.
      if (memoria.get(clave) !== entrada) return
      const p = pesar(v)
      pesoTotal += p
      entrada.peso += p
      if (pesoTotal >= MAX_PESO) hacerLugar(Date.now())
    },
    // Un fallo no se queda guardado.
    () => { if (memoria.get(clave) === entrada) quitar(clave) },
  )
  return valor
}

export function olvidar(clave: string) {
  quitar(clave)
}

/** Para las pruebas: cuántas entradas y cuánto pesan. */
export function _estadoMemo() {
  return { entradas: memoria.size, peso: pesoTotal }
}
