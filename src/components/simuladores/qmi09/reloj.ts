/**
 * qmi09/reloj.ts — EL RELOJ ÚNICO de la celda (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes
 * de dibujar): el tiempo simulado avanza dtReal·factor (cámara rápida rotulada), se
 * integra la celda y se publica la lectura de ESE cuadro. El dock y la barra de
 * lecturas leen el mismo objeto en su requestAnimationFrame (comparando `version`),
 * así que escena, gráficas y cifras salen del mismo estado del modelo.
 *
 * Hay dos relojes: el de la celda de Daniell (exploración) y el del reto (los
 * metales del alumno, 1 M y 25 °C, como fija el reto). Cada uno guarda su historia.
 */
import {
  avanzar, cargaMaxima, estadoInicial, leer, BANCO, T_REF,
  type Carga, type EstadoCelda, type IdMetal, type Lectura, type Montaje,
} from './electroquimica';

export interface PuntoHistoria {
  /** C (valor absoluto) */
  q: number;
  /** fem de la celda (V, ≥ 0) */
  E: number;
  /** tensión en bornes (V, ≥ 0) */
  V: number;
  /** A (≥ 0) */
  I: number;
  /** s simulados */
  t: number;
  /** ln Q de la reacción espontánea */
  lnQ: number;
}

/**
 * Factores de cámara rápida que ofrece el lab (1 s real = factor s simulados). Los tres
 * más lentos existen para las disoluciones diluidas: con [Cu²⁺] = 1 mM la celda sólo da
 * 48 C, y a ×10⁵ se agotaría en medio segundo, antes de que el alumno lea el voltímetro.
 */
export const FACTORES = [1e2, 1e3, 1e4, 1e5, 1e6, 1e7] as const;
export type Factor = (typeof FACTORES)[number];
/** Segundos de pantalla que debe durar, como mínimo, una celda recién preparada. */
export const VIDA_MINIMA_S = 30;
/** Segundos de pantalla en que la fem recién preparada debe quedarse casi quieta, para leerla. */
export const LECTURA_S = 3;
/** Lo más que puede moverse la fem (V) en esos segundos. */
export const DERIVA_MAX_V = 0.012;

/** ¿La celda ya no da corriente aunque el circuito esté cerrado? (equilibrio o ánodo disuelto) */
export function estaAgotada(m: Montaje, e: EstadoCelda, l: Lectura = leer(m, e)): 'equilibrio' | 'anodo' | null {
  if (!l.cerrado || m.carga === 'abierta') return null;
  const vA = l.anodo === 'izq' ? e.vIzq : e.vDer;
  if (vA <= 1e-9) return 'anodo';
  return Math.abs(l.fem) < 2e-3 ? 'equilibrio' : null;
}

/**
 * El mayor factor de cámara rápida (≤ `tope`) con el que la celda (montaje + estado)
 *   a) sigue viva tras VIDA_MINIMA_S segundos de pantalla, y
 *   b) mueve su fem menos de DERIVA_MAX_V en los primeros LECTURA_S segundos
 * (con [Zn²⁺] = 1 mM la fem cae decenas de mV en cuanto pasa algo de carga: sin (b) el
 * alumno no llega a leer el valor de Nernst). Se comprueba integrando el MISMO modelo
 * (`avanzar`), no con una estimación. En circuito abierto no pasa carga: vale el tope.
 * Si ni el más lento cumple, se devuelve el más lento.
 */
export function factorSeguro(m: Montaje, e: EstadoCelda, tope: Factor = 1e7): Factor {
  const candidatos = FACTORES.filter((f) => f <= tope);
  const lento = candidatos[0] ?? FACTORES[0];
  const l0 = leer(m, e);
  if (!l0.cerrado || m.carga === 'abierta' || !(Math.abs(l0.I) > 0)) return candidatos[candidatos.length - 1] ?? lento;
  const PASOS = 120;
  const cumple = (f: Factor) => {
    let s = e;
    const dt = (VIDA_MINIMA_S / PASOS) * f;
    for (let i = 1; i <= PASOS; i++) {
      s = avanzar(m, s, dt);
      const l = leer(m, s);
      if (i * (VIDA_MINIMA_S / PASOS) <= LECTURA_S + 1e-9 && Math.abs(Math.abs(l.fem) - Math.abs(l0.fem)) > DERIVA_MAX_V) return false;
      if (estaAgotada(m, s, l)) return false;
    }
    return true;
  };
  for (let i = candidatos.length - 1; i >= 0; i--) if (cumple(candidatos[i])) return candidatos[i];
  return lento;
}

const MAX_HISTORIA = 900;
/** Generaciones ÚNICAS entre relojes: al cambiar de reloj la escena también repuebla sus iones. */
let GENERACIONES = 0;

export class RelojCelda {
  montaje: Montaje;
  estado: EstadoCelda;
  lectura: Lectura;
  historia: PuntoHistoria[] = [];
  /** carga máxima (C) con la que se prepararon las disoluciones: fija el eje de la gráfica */
  qMax = 0;
  /** sube cada vez que cambia algo visible (dock y DOM redibujan al verlo cambiar) */
  version = 0;
  /** sube cuando se renuevan las disoluciones o cambia el montaje químico (la escena resetea sus iones) */
  generacion = ++GENERACIONES;
  factor: Factor = 1e6;
  pausa = false;

  constructor(montaje: Montaje, c0Izq = 1, c0Der = 1) {
    this.montaje = { ...montaje };
    this.estado = estadoInicial(c0Izq, c0Der);
    this.lectura = leer(this.montaje, this.estado);
    this.recalcularQMax();
    this.anotar(true);
  }

  private recalcularQMax() {
    const fresco = estadoInicial(this.estado.c0Izq, this.estado.c0Der);
    // con el circuito cerrado a la fuerza: la carga que la química permitiría
    this.qMax = cargaMaxima({ ...this.montaje, puente: true, cables: true }, fresco);
  }

  private anotar(forzar = false) {
    const l = this.lectura;
    const p: PuntoHistoria = { q: Math.abs(this.estado.q), E: Math.abs(l.fem), V: Math.abs(l.V), I: Math.abs(l.I), t: this.estado.t, lnQ: l.lnQ };
    const u = this.historia[this.historia.length - 1];
    if (!forzar && u) {
      const dq = Math.abs(p.q - u.q), dE = Math.abs(p.E - u.E), dV = Math.abs(p.V - u.V);
      if (dq < this.qMax / 450 && dE < 0.002 && dV < 0.002) return;
    }
    this.historia.push(p);
    if (this.historia.length > MAX_HISTORIA) {
      // diezma la mitad más antigua (conserva el primero y la forma de la curva)
      const viejos = this.historia.slice(0, MAX_HISTORIA / 2).filter((_, i) => i % 2 === 0);
      this.historia = [...viejos, ...this.historia.slice(MAX_HISTORIA / 2)];
    }
  }

  /** Avanza el reloj dtReal segundos de pantalla. Devuelve true si algo cambió. */
  paso(dtReal: number): boolean {
    if (this.pausa || !(dtReal > 0)) return false;
    const dt = Math.min(dtReal, 0.1) * this.factor;
    const antes = this.estado;
    this.estado = avanzar(this.montaje, this.estado, dt);
    const cambioQuimico = this.estado.q !== antes.q;
    this.lectura = leer(this.montaje, this.estado);
    if (cambioQuimico) this.anotar();
    this.version++;
    return cambioQuimico;
  }

  /** Cambia el montaje. Si cambian los metales, las disoluciones se preparan de nuevo. */
  fijarMontaje(m: Partial<Montaje>) {
    const nuevo = { ...this.montaje, ...m };
    const cambiaQuimica = nuevo.izq !== this.montaje.izq || nuevo.der !== this.montaje.der;
    const cambiaCircuito = nuevo.puente !== this.montaje.puente || nuevo.cables !== this.montaje.cables
      || nuevo.carga !== this.montaje.carga || nuevo.T !== this.montaje.T;
    if (!cambiaQuimica && !cambiaCircuito) return;
    this.montaje = nuevo;
    if (cambiaQuimica) {
      this.estado = estadoInicial(this.estado.c0Izq, this.estado.c0Der);
      this.historia = [];
      this.generacion = ++GENERACIONES;
      this.recalcularQMax();
    }
    this.lectura = leer(this.montaje, this.estado);
    this.anotar(true);
    this.version++;
  }

  /** Disoluciones y electrodos nuevos (con las concentraciones dadas). */
  renovar(c0Izq = this.estado.c0Izq, c0Der = this.estado.c0Der) {
    this.estado = estadoInicial(c0Izq, c0Der);
    this.historia = [];
    this.generacion = ++GENERACIONES;
    this.recalcularQMax();
    this.lectura = leer(this.montaje, this.estado);
    this.anotar(true);
    this.version++;
  }

  /** ¿La celda ya no da corriente aunque el circuito esté cerrado? */
  agotada(): 'equilibrio' | 'anodo' | null {
    return estaAgotada(this.montaje, this.estado, this.lectura);
  }

  /** El mayor factor ≤ `tope` con el que esta celda se deja leer y dura en pantalla (ver `factorSeguro`). */
  factorSeguro(tope: Factor = 1e7): Factor {
    return factorSeguro(this.montaje, this.estado, tope);
  }
}

/** Montaje de la celda de Daniell de exploración: Zn | ZnSO₄ ‖ CuSO₄ | Cu, circuito cerrado. */
export function montajeDaniell(carga: Carga, T = T_REF): Montaje {
  return { izq: 'Zn' as IdMetal, der: 'Cu' as IdMetal, puente: true, cables: true, carga, T };
}

/** Moles de catión que representa cada esfera de la escena. */
export const MOL_POR_ION = 0.004;
/** Esferas de catión de un vaso a la concentración c (M). */
export const ionesVisibles = (n: number) => Math.round(n / MOL_POR_ION);
/** Volumen de cada vaso, para las cifras del dock. */
export const VOLUMEN_ML = BANCO.volumenML;
