/**
 * EL OTRO EXTREMO DEL PUENTE.
 *
 * `public/labs/_puente.js` corre dentro del `<iframe>` del lab y va mandando lo
 * que pasa. Esto es lo que el shell usa para recogerlo: el contrato del
 * mensaje, la acumulación y la nota final.
 *
 * POR QUÉ VIVE APARTE DEL COMPONENTE. Porque la parte que importa —cómo se
 * convierte una sesión de trabajo en una calificación— es una decisión
 * pedagógica, no de interfaz, y tiene que poder leerse y probarse sin montar un
 * iframe. `resumeDe()` es una función pura y tiene sus pruebas.
 */

/** El sobre que manda `_puente.js`. Se valida entero antes de creerle nada. */
export interface MensajeLab {
  fuente: 'cen-lab';
  v: number;
  tipo: 'listo' | 'avance' | 'cierre';
  slug: string;
  /** `completa` = el lab publica si el reto se resolvió. `parcial` = no lo publica. */
  cobertura?: 'completa' | 'parcial';
  segundos?: number;
  modo?: string | null;
  modos?: string[];
  /** `null` significa NO OBSERVABLE, y no es lo mismo que `false`. */
  resuelto?: boolean | null;
  quiz?: { respondida: boolean; acierto: boolean } | null;
  conGancho?: boolean;
  sinCanvas?: boolean;
}

/** Lo que el shell va acumulando de una sesión. */
export interface Sesion {
  slug: string;
  /** Los segundos que el LAB dice que lleva abierto; el shell tiene su propio reloj. */
  segundos: number;
  modos: string[];
  resuelto: boolean | null;
  quizRespondido: boolean;
  quizAcierto: boolean;
  cobertura: 'completa' | 'parcial';
  /** Si el lab llegó a montar su escena. Un `false` aquí es un lab roto. */
  monto: boolean;
}

export const SESION_VACIA: Sesion = {
  slug: '', segundos: 0, modos: [], resuelto: null,
  quizRespondido: false, quizAcierto: false, cobertura: 'parcial', monto: false,
};

/**
 * ¿Es esto un mensaje del puente y no cualquier otra cosa que llegue a
 * `window`? Extensiones del navegador, el propio Next en desarrollo y hasta un
 * anuncio pueden mandar mensajes; se comprueba la forma antes de tocar nada.
 */
export function esMensajeLab(dato: unknown): dato is MensajeLab {
  if (!dato || typeof dato !== 'object') return false;
  const m = dato as Record<string, unknown>;
  return m.fuente === 'cen-lab'
    && m.v === 1
    && typeof m.slug === 'string'
    && (m.tipo === 'listo' || m.tipo === 'avance' || m.tipo === 'cierre');
}

/**
 * Aplica un mensaje a la sesión.
 *
 * MONÓTONO A PROPÓSITO en lo que no puede desandarse: un reto resuelto sigue
 * resuelto aunque el alumno cambie de modo después y el lab deje de decirlo, y
 * los modos visitados sólo crecen. Sin eso, salir del modo «reto» borraría el
 * único logro de la sesión justo antes de guardarla.
 */
export function aplica(sesion: Sesion, m: MensajeLab): Sesion {
  const s: Sesion = { ...sesion, slug: m.slug || sesion.slug };

  if (m.tipo === 'listo') {
    s.monto = m.sinCanvas !== true;
    return s;
  }

  if (typeof m.segundos === 'number' && m.segundos >= 0) s.segundos = m.segundos;
  if (Array.isArray(m.modos)) s.modos = [...new Set([...s.modos, ...m.modos.filter((x) => typeof x === 'string')])];
  if (m.resuelto === true) s.resuelto = true;
  else if (m.resuelto === false && s.resuelto !== true) s.resuelto = false;
  if (m.quiz) {
    s.quizRespondido = s.quizRespondido || m.quiz.respondida;
    s.quizAcierto = s.quizAcierto || m.quiz.acierto;
  }
  // Una sola lectura completa vale más que muchas parciales: si el lab llegó a
  // publicar su estado alguna vez, la sesión es observable.
  if (m.cobertura === 'completa') s.cobertura = 'completa';
  return s;
}

/** Nota, y de dónde sale cada parte. */
export interface Resumen {
  score: number;
  /** Qué se pudo medir. Es lo que el panel del profesor tiene que enseñar junto a la nota. */
  detalle: { concepto: string; puntos: number; de: number; medido: boolean }[];
  /** `false` cuando el lab no publica su estado: la nota es de participación, no de logro. */
  evaluable: boolean;
}

/** Cuánto tiempo dentro del lab se considera una sesión de trabajo, no un vistazo. */
const SEGUNDOS_SESION = 8 * 60;

/**
 * De una sesión a una calificación.
 *
 * LO QUE ESTA FUNCIÓN NO HACE, y es deliberado: no inventa una nota cuando no
 * puede medirla. En los 27 labs que no publican su estado, lo único observable
 * es que el alumno estuvo trabajando y por dónde anduvo; eso vale una nota de
 * PARTICIPACIÓN, tope 60, y el resumen lo dice con `evaluable: false` para que
 * el panel no la enseñe como si fuera una nota de logro. Poner 0 sería acusar
 * al alumno de no haber hecho nada, y poner 100 sería regalar la práctica; las
 * dos cosas son mentira y la segunda además vacía de sentido el tablero.
 *
 * El reparto en los labs que sí se pueden medir:
 *
 *   40  resolver el reto            es la tarea de diagnóstico, y es lo que se pide
 *   25  acertar el cuestionario     comprueba que entendió, no sólo que atinó
 *   20  recorrer los modos          un lab de cuatro vistas no se entiende con una
 *   15  sostener la sesión          ocho minutos; por debajo no hubo práctica
 */
export function resumeDe(s: Sesion): Resumen {
  const modos = Math.min(s.modos.length, 4);
  const tiempo = Math.min(s.segundos / SEGUNDOS_SESION, 1);

  if (s.cobertura !== 'completa') {
    const detalle = [
      { concepto: 'Vistas del laboratorio recorridas', puntos: Math.round((modos / 4) * 35), de: 35, medido: true },
      { concepto: 'Tiempo de trabajo sostenido', puntos: Math.round(tiempo * 25), de: 25, medido: true },
      { concepto: 'Reto resuelto', puntos: 0, de: 0, medido: false },
      { concepto: 'Cuestionario', puntos: 0, de: 0, medido: false },
    ];
    return {
      score: detalle.reduce((a, d) => a + d.puntos, 0),
      detalle,
      evaluable: false,
    };
  }

  const detalle = [
    { concepto: 'Reto resuelto', puntos: s.resuelto ? 40 : 0, de: 40, medido: true },
    { concepto: 'Cuestionario acertado', puntos: s.quizAcierto ? 25 : 0, de: 25, medido: true },
    { concepto: 'Vistas del laboratorio recorridas', puntos: Math.round((modos / 4) * 20), de: 20, medido: true },
    { concepto: 'Tiempo de trabajo sostenido', puntos: Math.round(tiempo * 15), de: 15, medido: true },
  ];
  return {
    score: Math.min(100, detalle.reduce((a, d) => a + d.puntos, 0)),
    detalle,
    evaluable: true,
  };
}
