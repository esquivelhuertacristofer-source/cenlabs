/**
 * DE QUÉ MATERIA ES UNA PRÁCTICA.
 *
 * Suena a una línea y por eso estaba escrita a mano en cada sitio que la
 * necesitaba. En `AlumnosContent` la cadena era así:
 *
 *     let cat = 'Matemáticas';
 *     if (sim.startsWith('quimica'))       cat = 'Química';
 *     else if (sim.startsWith('fisica'))   cat = 'Física';
 *     else if (sim.startsWith('biologia')) cat = 'Biología';
 *
 * o sea que TODO lo que no fuera esas tres cosas caía en Matemáticas por
 * omisión. Mientras mecánica no reportara nada, daba igual. En cuanto empezó a
 * hacerlo, las 120 prácticas de mecánica se habrían contado como matemáticas y
 * habrían torcido el radar de competencias de todos los alumnos, sin error, sin
 * aviso y sin manera de notarlo mirando la pantalla.
 *
 * Aquí no hay omisión que adivine: lo que no se reconoce se devuelve como
 * desconocido y quien pinta decide qué hacer con eso.
 */

export const MATERIAS = ['quimica', 'fisica', 'matematicas', 'biologia', 'mecanica'] as const;
export type Materia = typeof MATERIAS[number];

const ROTULO: Record<Materia, string> = {
  quimica: 'Química',
  fisica: 'Física',
  matematicas: 'Matemáticas',
  biologia: 'Biología',
  mecanica: 'Mecánica',
};

/** Las cinco, en el orden en que se enseñan en el panel y en el radar. */
export const ROTULOS: string[] = MATERIAS.map((m) => ROTULO[m]);

/**
 * La materia de un `sim_id` (`mecanica-120`, `quimica-3`). `null` si no es
 * ninguna de las cinco — un identificador viejo, o uno mal escrito.
 */
export function materiaDe(simId: string | null | undefined): Materia | null {
  if (typeof simId !== 'string') return null;
  const prefijo = simId.toLowerCase().split('-')[0];
  return (MATERIAS as readonly string[]).includes(prefijo) ? (prefijo as Materia) : null;
}

/**
 * Cómo se escribe en pantalla. Para lo que no se reconoce devuelve el prefijo
 * en mayúsculas, que es feo a propósito: un rótulo raro en el panel es la señal
 * de que hay datos que nadie está clasificando, y es mejor verla que taparla
 * repartiéndolos en una materia cualquiera.
 */
export function rotuloMateria(simId: string | null | undefined): string {
  const m = materiaDe(simId);
  if (m) return ROTULO[m];
  const prefijo = typeof simId === 'string' ? simId.split('-')[0] : '';
  return prefijo ? prefijo.toUpperCase() : 'Sin clasificar';
}
