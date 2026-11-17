/**
 * Los seis casos del microscopio digital (BIO-01): qué se observa, qué se pregunta
 * y cómo se juzga la respuesta. La «verdad» de cada caso sale de la preparación
 * (preparaciones.ts) y de la semilla del intento: nunca se muestra en pantalla.
 */
import type { MicroscopioStateB1, MuestraB1, ObjetivoMagB1, RespuestaCasoB1, ResultadoValidacion } from '@/store/types';
import {
  ORDEN_GRAM, contarEstomas, contarMitosis, contarSangre, largoMedioCebolla, largoParamecio, mezclaGram, rectCentrado,
  type BacteriaGram,
} from './preparaciones';
import { UM_POR_UNIDAD_ENFOQUE, ladoMarcoUm, profundidadCampoUm, sinAceite } from './optica';

export type TipoCasoB1 = 'medir' | 'contar' | 'identificar';

export interface CampoRespuestaB1 { clave: string; etiqueta: string; unidad?: string }

export interface CasoB1 {
  nombre: string;
  /** nombre corto para la pestaña */
  corto: string;
  /** técnica de montaje o tinción */
  tincion: string;
  tipo: TipoCasoB1;
  pregunta: string;
  /** cómo se resuelve, en una línea */
  metodo: string;
  campos: CampoRespuestaB1[];
  /** sólo en «identificar»: las opciones, en el orden de su índice */
  opciones?: string[];
  /** objetivo mínimo con el que la respuesta es fiable */
  objetivoMin: ObjetivoMagB1;
  /** los conteos se hacen con UN objetivo concreto (fija el tamaño del marco) */
  objetivoExacto?: ObjetivoMagB1;
  /** objetivo con el que se abre el caso al elegirlo */
  objetivoInicial: ObjetivoMagB1;
  /** desfase del plano focal de esta preparación (unidades del tornillo) */
  desfaseFoco: number;
}

export const ORDEN_CASOS_B1: readonly MuestraB1[] = ['estanque', 'sangre', 'gram', 'mitosis', 'cebolla', 'estomas'];

export const NOMBRES_GRAM: Record<BacteriaGram, string> = {
  estafilococo: 'Cocos Gram positivos en racimos',
  estreptococo: 'Cocos Gram positivos en cadena',
  bacilo_pos: 'Bacilos Gram positivos',
  bacilo_neg: 'Bacilos Gram negativos',
  diplococo_neg: 'Diplococos Gram negativos',
};

export const CASOS_B1: Record<MuestraB1, CasoB1> = {
  estanque: {
    nombre: 'Agua de estanque, en vivo', corto: 'Estanque', tincion: 'Montaje húmedo sin teñir',
    tipo: 'medir', pregunta: '¿Cuánto mide de largo un paramecio?',
    metodo: 'Congela la imagen y tiende la regla de punta a punta.',
    campos: [{ clave: 'largo', etiqueta: 'Largo', unidad: 'µm' }],
    objetivoMin: 10, objetivoInicial: 40, desfaseFoco: 0,
  },
  sangre: {
    nombre: 'Frotis de sangre con malaria', corto: 'Sangre', tincion: 'Tinción de Giemsa',
    tipo: 'contar', pregunta: 'Dentro del marco: ¿cuántos eritrocitos hay y cuántos llevan el anillo de Plasmodium?',
    metodo: 'Con 100× y aceite. Cuenta las células cuyo centro cae dentro del marco.',
    campos: [{ clave: 'parasitados', etiqueta: 'Con parásito' }, { clave: 'total', etiqueta: 'Eritrocitos' }],
    objetivoMin: 100, objetivoExacto: 100, objetivoInicial: 100, desfaseFoco: 0.22,
  },
  gram: {
    nombre: 'Exudado con dos bacterias', corto: 'Gram', tincion: 'Tinción de Gram',
    tipo: 'identificar', pregunta: '¿Qué bacteria predomina en la muestra?',
    metodo: 'Con 100× y aceite. Fíjate en el color (violeta o rosa), la forma y cómo se agrupan.',
    campos: [{ clave: 'bacteria', etiqueta: 'Predomina' }],
    opciones: ORDEN_GRAM.map((b) => NOMBRES_GRAM[b]),
    objetivoMin: 100, objetivoInicial: 100, desfaseFoco: -0.18,
  },
  mitosis: {
    nombre: 'Punta de raíz de cebolla', corto: 'Mitosis', tincion: 'Corte longitudinal, hematoxilina',
    tipo: 'contar', pregunta: 'Dentro del marco: ¿cuántas células hay y cuántas están en mitosis?',
    metodo: 'Con 40×, en la zona de división. El índice mitótico es mitosis ÷ total.',
    campos: [{ clave: 'enMitosis', etiqueta: 'En mitosis' }, { clave: 'total', etiqueta: 'Células' }],
    objetivoMin: 40, objetivoExacto: 40, objetivoInicial: 40, desfaseFoco: 0.3,
  },
  cebolla: {
    nombre: 'Epidermis de cebolla', corto: 'Cebolla', tincion: 'Tinción con lugol',
    tipo: 'medir', pregunta: '¿Cuánto mide de largo una célula típica?',
    metodo: 'Mide tres células con la regla y saca el promedio.',
    campos: [{ clave: 'largo', etiqueta: 'Largo', unidad: 'µm' }],
    objetivoMin: 4, objetivoInicial: 10, desfaseFoco: -0.33,
  },
  estomas: {
    nombre: 'Estomas de una hoja', corto: 'Estomas', tincion: 'Epidermis de Tradescantia, en agua',
    tipo: 'contar', pregunta: '¿Cuántos estomas hay dentro del marco y qué densidad es por mm²?',
    metodo: 'Con 10×. Densidad = estomas ÷ área del marco.',
    campos: [{ clave: 'estomas', etiqueta: 'Estomas' }, { clave: 'densidad', etiqueta: 'Densidad', unidad: '/mm²' }],
    objetivoMin: 10, objetivoExacto: 10, objetivoInicial: 10, desfaseFoco: 0.14,
  },
};

/** Casos que hay que resolver bien para aprobar la práctica. */
export const CASOS_PARA_APROBAR_B1 = 3;

const ok = (): ResultadoValidacion => ({ ok: true });
const falla = (mensaje: string): ResultadoValidacion => ({ ok: false, mensaje });

// ───────────────────────────── luz y enfoque ─────────────────────────────

/** Fracción de la luz que llega al ojo con cada objetivo (a más aumento, imagen más oscura). */
export const TRANSMISION_B1: Record<ObjetivoMagB1, number> = { 4: 1, 10: 0.9, 40: 0.75, 100: 0.6 };
/** Brillo efectivo con el que la imagen es legible. */
export const BRILLO_MIN_B1 = 45;
export const BRILLO_MAX_B1 = 75;

type Luz = Pick<MicroscopioStateB1, 'iluminacion' | 'objetivoMag'> & { apertura?: number };
/** Brillo = lámpara × transmisión del objetivo × lo que deja pasar el diafragma (abierto del todo = 1). */
export function brilloEfectivoB1(m: Luz): number {
  return m.iluminacion * (TRANSMISION_B1[m.objetivoMag] ?? 1) * (0.5 + 0.5 * (m.apertura ?? 1));
}

/** Plano focal de cada preparación (cada portaobjetos tiene su espesor). */
export const focoCasoB1 = (focoIdealZ: number, caso: MuestraB1): number => focoIdealZ + (CASOS_B1[caso]?.desfaseFoco ?? 0);

type Foco = Pick<MicroscopioStateB1, 'enfoqueZ' | 'focoIdealZ' | 'objetivoMag'> & { muestra?: MuestraB1; aceiteInmersionAplicado?: boolean; apertura?: number };
/** Error de enfoque en micrómetros (con signo). */
export function errorEnfoqueUm(m: Foco): number {
  const foco = m.muestra ? focoCasoB1(m.focoIdealZ, m.muestra) : m.focoIdealZ;
  return (m.enfoqueZ - foco) * UM_POR_UNIDAD_ENFOQUE;
}
/** Margen de enfoque (µm): media profundidad de campo más lo que acomoda el ojo. */
export const ACOMODACION_UM = 0.3;
export function margenEnfoqueUm(m: Foco): number {
  return profundidadCampoUm(m.objetivoMag, !!m.aceiteInmersionAplicado, m.apertura ?? 1) / 2 + ACOMODACION_UM;
}
export const enFocoB1 = (m: Foco): boolean => Math.abs(errorEnfoqueUm(m)) <= margenEnfoqueUm(m) + 1e-9;

// ───────────────────────────── verdad y juicio de cada caso ─────────────────────────────

/** Valores correctos del caso para una vista dada (posición de la platina y objetivo). */
export function verdadCasoB1(caso: MuestraB1, semilla: number, vista: { x: number; y: number; objetivoMag: ObjetivoMagB1 }): number[] {
  const marco = rectCentrado(vista.x, vista.y, ladoMarcoUm(vista.objetivoMag));
  switch (caso) {
    case 'estanque': return [largoParamecio(semilla)];
    case 'cebolla': return [largoMedioCebolla(semilla)];
    case 'gram': return [ORDEN_GRAM.indexOf(mezclaGram(semilla).dominante)];
    case 'sangre': { const c = contarSangre(semilla, marco); return [c.parasitados, c.total]; }
    case 'mitosis': { const c = contarMitosis(semilla, marco); return [c.enMitosis, c.total]; }
    case 'estomas': { const n = contarEstomas(semilla, marco); return [n, n / (ladoMarcoUm(vista.objetivoMag) / 1000) ** 2]; }
  }
}

/** ¿|a − b| cabe en el mayor de un margen absoluto y uno relativo? */
const cerca = (a: number, b: number, abs: number, rel: number) => Math.abs(a - b) <= Math.max(abs, Math.abs(b) * rel) + 1e-9;

/** Condiciones ópticas con las que se tomó la respuesta: sin imagen fiable no hay dato. */
export function condicionesOpticasB1(caso: MuestraB1, focoIdealZ: number, r: RespuestaCasoB1): ResultadoValidacion {
  const c = CASOS_B1[caso];
  if (c.objetivoExacto && r.objetivoMag !== c.objetivoExacto) return falla(`Este conteo se hace con el objetivo de ${c.objetivoExacto}×: el marco cambia de tamaño con el aumento.`);
  if (r.objetivoMag < c.objetivoMin) return falla('Con este objetivo no se resuelve lo que hay que observar: necesitas más aumento.');
  if (sinAceite(r.objetivoMag, r.aceite)) return falla('El objetivo de 100× es de inmersión: sin aceite la apertura numérica cae y la imagen pierde resolución.');
  const brillo = brilloEfectivoB1({ iluminacion: r.iluminacion, objetivoMag: r.objetivoMag, apertura: r.apertura });
  if (brillo < BRILLO_MIN_B1) return falla('La imagen está demasiado oscura: sube la lámpara o abre el diafragma.');
  if (brillo > BRILLO_MAX_B1) return falla('La imagen está deslumbrada: baja la lámpara o cierra un poco el diafragma.');
  if (!enFocoB1({ enfoqueZ: r.enfoqueZ, focoIdealZ, objetivoMag: r.objetivoMag, muestra: caso, aceiteInmersionAplicado: r.aceite, apertura: r.apertura })) {
    return falla('La imagen está fuera de foco: afina con el tornillo micrométrico antes de responder.');
  }
  return ok();
}

/** Juzga la respuesta registrada de un caso. Los mensajes orientan sin revelar el valor. */
export function evaluarRespuestaB1(caso: MuestraB1, semilla: number, focoIdealZ: number, r: RespuestaCasoB1 | undefined): ResultadoValidacion {
  if (!r) return falla('Aún no has respondido este caso.');
  if (r.valores.length < CASOS_B1[caso].campos.length || r.valores.some((v) => !Number.isFinite(v))) return falla('Completa todos los datos de la respuesta.');
  const optica = condicionesOpticasB1(caso, focoIdealZ, r);
  if (!optica.ok) return optica;
  const v = verdadCasoB1(caso, semilla, { x: r.x, y: r.y, objetivoMag: r.objetivoMag });
  const a = r.valores;
  switch (caso) {
    case 'estanque':
      return cerca(a[0], v[0], 0, 0.12) ? ok() : falla('Esa longitud no corresponde al paramecio: mide de punta a punta, con la imagen congelada.');
    case 'cebolla':
      return cerca(a[0], v[0], 0, 0.2) ? ok() : falla('Esa longitud no es la de una célula típica: mide de pared a pared a lo largo y promedia tres.');
    case 'gram':
      return a[0] === v[0] ? ok() : falla('No es la bacteria que predomina: compara cuántas hay de cada color y de cada forma.');
    case 'sangre':
      if (v[1] < 15) return falla('En este campo casi no hay eritrocitos: mueve la platina a una zona con células.');
      if (!cerca(a[1], v[1], 4, 0.15)) return falla('El total de eritrocitos no coincide con lo que hay dentro del marco.');
      return cerca(a[0], v[0], 1, 0.2) ? ok() : falla('El número de eritrocitos parasitados no coincide: busca el anillo azul con su punto rojo.');
    case 'mitosis':
      if (v[1] < 15 || v[0] < 1) return falla('En este campo no hay células en división suficientes: lleva el marco a la zona meristemática, cerca de la punta.');
      if (!cerca(a[1], v[1], 3, 0.15)) return falla('El total de células no coincide con lo que hay dentro del marco.');
      return cerca(a[0], v[0], 1, 0.25) ? ok() : falla('El número de células en mitosis no coincide: cuenta profase, metafase, anafase y telofase.');
    case 'estomas':
      if (v[0] < 2) return falla('En este campo casi no hay estomas: mueve la platina.');
      if (!cerca(a[0], v[0], 1, 0)) return falla('El número de estomas no coincide con lo que hay dentro del marco.');
      return cerca(a[1], v[1], 0, 0.2) ? ok() : falla('La densidad no sale de tu conteo: divide los estomas entre el área del marco en mm².');
  }
}

export type EstadoCasoB1 = 'pendiente' | 'correcto' | 'incorrecto';
type ConRespuestas = Pick<MicroscopioStateB1, 'semilla' | 'focoIdealZ' | 'respuestas'>;

export function estadoCasoB1(m: ConRespuestas, caso: MuestraB1): EstadoCasoB1 {
  const r = m.respuestas[caso];
  if (!r) return 'pendiente';
  return evaluarRespuestaB1(caso, m.semilla, m.focoIdealZ, r).ok ? 'correcto' : 'incorrecto';
}

export const casosResueltosB1 = (m: ConRespuestas): MuestraB1[] => ORDEN_CASOS_B1.filter((c) => estadoCasoB1(m, c) === 'correcto');

/** Fotografía del estado con el que se responde un caso (lo único que el juez lee después). */
export function tomarRespuestaB1(m: MicroscopioStateB1, valores: number[]): RespuestaCasoB1 {
  return {
    valores, x: m.posicionX, y: m.posicionY, objetivoMag: m.objetivoMag, enfoqueZ: m.enfoqueZ,
    iluminacion: m.iluminacion, apertura: m.apertura, aceite: m.aceiteInmersionAplicado,
  };
}
