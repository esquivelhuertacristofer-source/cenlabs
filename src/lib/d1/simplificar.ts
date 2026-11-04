// =============================================================================
// Simplifica una política YA sustituida ({{role}} → 'student', etc.) antes de mandarla a D1.
//
// Por qué: las políticas de producción mezclan con OR las ramas de todos los roles:
//   (('student' = 'super_admin') OR (('student' = 'admin') AND (user_id IN (…)))) OR (user_id = 'u1')
// SQLite no descarta las ramas constantes al planear, así que con ese OR no usa el índice de
// user_id y recorre la tabla entera (medido 2026-11-02: 2,174 filas leídas para darle a un alumno
// su progreso). Quitando las ramas que ya se saben falsas queda `(user_id = 'u1')` y va por índice.
//
// Solo evalúa hojas que son comparación entre DOS literales de texto ('a' = 'b', 'a' <> 'b',
// 'a' IN ('b', 'c')); todo lo demás se deja tal cual. Divide solo en AND/OR de nivel cero
// (fuera de paréntesis y de comillas), así que las subconsultas quedan intactas como hojas.
// Ante cualquier forma que no entienda, devuelve la expresión original: nunca cambia el sentido.
// La equivalencia con producción la prueban scripts/d1/equivalencia-*.mts.
// =============================================================================

type Nodo = { t: 'v'; v: boolean } | { t: 'hoja'; s: string } | { t: 'y' | 'o'; hijos: Nodo[] }

/** Partes de `s` separadas por la palabra `op` (AND/OR) en nivel cero, o null si no hay. */
function partir(s: string, op: 'AND' | 'OR'): string[] | null {
  const partes: string[] = []
  let nivel = 0, comilla = false, desde = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (comilla) { if (c === "'") { if (s[i + 1] === "'") i++; else comilla = false } continue }
    if (c === "'") comilla = true
    else if (c === '(') nivel++
    else if (c === ')') { nivel--; if (nivel < 0) return null }
    else if (nivel === 0 && /\s/.test(c)) {
      const m = new RegExp(`^\\s+${op}\\s+`, 'i').exec(s.slice(i))
      if (m) { partes.push(s.slice(desde, i)); i += m[0].length - 1; desde = i + 1 }
    }
  }
  if (nivel !== 0 || comilla) return null
  partes.push(s.slice(desde))
  return partes.length > 1 ? partes : null
}

/** Quita paréntesis que envuelven TODA la expresión. */
function sinEnvoltura(s: string): string {
  s = s.trim()
  while (s.startsWith('(') && s.endsWith(')')) {
    let nivel = 0, comilla = false, cierraAlFinal = true
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (comilla) { if (c === "'") { if (s[i + 1] === "'") i++; else comilla = false } continue }
      if (c === "'") comilla = true
      else if (c === '(') nivel++
      else if (c === ')') { nivel--; if (nivel === 0 && i < s.length - 1) { cierraAlFinal = false; break } }
    }
    if (!cierraAlFinal) break
    s = s.slice(1, -1).trim()
  }
  return s
}

const LIT = String.raw`'((?:[^']|'')*)'`
const IGUAL = new RegExp(`^${LIT}\\s*(=|<>|!=)\\s*${LIT}$`)
const EN = new RegExp(`^${LIT}\\s+(NOT\\s+)?IN\\s*\\(\\s*(${LIT}(?:\\s*,\\s*${LIT})*)\\s*\\)$`, 'i')

function hoja(s: string): Nodo {
  if (s === '1' || /^true$/i.test(s)) return { t: 'v', v: true }
  if (s === '0' || /^false$/i.test(s)) return { t: 'v', v: false }
  let m = IGUAL.exec(s)
  if (m) return { t: 'v', v: (m[1] === m[3]) === (m[2] === '=') }
  m = EN.exec(s)
  if (m) {
    const lista = [...m[3].matchAll(new RegExp(LIT, 'g'))].map((x) => x[1])
    return { t: 'v', v: lista.includes(m[1]) !== !!m[2] }
  }
  return { t: 'hoja', s }
}

function leer(s: string, hondo = 0): Nodo {
  if (hondo > 50) return { t: 'hoja', s }
  s = sinEnvoltura(s)
  const o = partir(s, 'OR')
  if (o) return { t: 'o', hijos: o.map((x) => leer(x, hondo + 1)) }
  const y = partir(s, 'AND')
  if (y) return { t: 'y', hijos: y.map((x) => leer(x, hondo + 1)) }
  return hoja(s)
}

function reducir(n: Nodo): Nodo {
  if (n.t !== 'y' && n.t !== 'o') return n
  const neutro = n.t === 'y' // AND: true no aporta; OR: false no aporta
  const hijos: Nodo[] = []
  for (const h of n.hijos.map(reducir)) {
    if (h.t === 'v') { if (h.v === neutro) continue; return { t: 'v', v: !neutro } }
    hijos.push(h)
  }
  if (!hijos.length) return { t: 'v', v: neutro }
  return hijos.length === 1 ? hijos[0] : { t: n.t, hijos }
}

function escribir(n: Nodo): string {
  if (n.t === 'v') return n.v ? '1' : '0'
  if (n.t === 'hoja') return `(${n.s})`
  return `(${n.hijos.map(escribir).join(n.t === 'y' ? ' AND ' : ' OR ')})`
}

export function simplificar(expr: string): string {
  try {
    return escribir(reducir(leer(expr)))
  } catch {
    return expr
  }
}
