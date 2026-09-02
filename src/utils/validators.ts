/**
 * Lo que `/api/resultados` acepta como identificador de práctica.
 *
 * ESTA FUNCIÓN ESTABA DEJANDO FUERA A TRES CUARTAS PARTES DEL CATÁLOGO, y no
 * se notaba porque falla en silencio: el alumno termina el lab, el POST vuelve
 * con un 400 y el panel del profesor sigue vacío como si nadie hubiera
 * trabajado. La expresión decía
 *
 *     /^(quimica|fisica|matematicas|biologia)-\d{1,2}$/
 *
 * y se escribió cuando la plataforma tenía cuarenta prácticas de cuatro
 * materias numeradas del 1 al 10. Hoy hay 160, y las 120 de mecánica fallaban
 * DOS veces: por la materia, que no está en la lista, y por el número, porque
 * `\d{1,2}` no admite `mecanica-120`.
 *
 * Lo que sí hay que conservar de la versión vieja, y por eso esto sigue siendo
 * una lista blanca y no un `includes`: el `practica_id` viaja a la consulta de
 * la base, así que se acota a lo que puede existir de verdad y se rechaza todo
 * lo demás —comillas, espacios, punto y coma— antes de mirarlo siquiera.
 */

/**
 * Las cinco materias del catálogo. Es la misma lista que el tipo `Categoria` de
 * `src/labs/_types.ts`; se repite aquí a propósito porque esta función corre en
 * el borde, en la ruta de la API, y no debe arrastrar el grafo de módulos de
 * los labs para validar una cadena.
 */
const MATERIAS = ['quimica', 'fisica', 'matematicas', 'biologia', 'mecanica'] as const;

/**
 * Hasta dónde llega la numeración. Es un tope de cordura, no el catálogo: sirve
 * para que un `mecanica-999999` no pase, no para saber qué labs existen —de eso
 * responde el registro—.
 */
const MAX_ORDEN = 999;

const RE_PRACTICA = new RegExp(`^(?:${MATERIAS.join('|')})-([1-9]\\d{0,2})$`);

export function validatePracticaId(practicaId: string): boolean {
  if (typeof practicaId !== 'string') return false;
  const m = RE_PRACTICA.exec(practicaId);
  if (!m) return false;
  return Number(m[1]) <= MAX_ORDEN;
}

export function validateScore(score: number): boolean {
  return typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100;
}
