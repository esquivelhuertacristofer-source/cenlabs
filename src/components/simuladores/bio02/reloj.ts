/**
 * bio02/reloj.ts — EL RELOJ ÚNICO del lab de transporte celular (módulo puro: sin three ni React).
 *
 * La escena llama a `paso(dtPantalla)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar): el tiempo REAL avanza dtPantalla/N (cámara lenta ×1/N rotulada), se integra la
 * célula (`transporte.ts`) y se publica la lectura de ESE cuadro. El dock, la barra de lecturas
 * y las partículas leen el mismo objeto (comparando `version`).
 *
 * Hay dos relojes:
 *  · EXPLORACIÓN (vistas «Membrana» y «Célula»): un glóbulo rojo conocido (290 mOsm/L) que se
 *    pasa al medio elegido (t = 0, «transferencia»). La vista sólo cambia la cámara lenta.
 *  · RETO: la célula del store, con la osmolaridad del citoplasma desconocida (`osm0`). Avisa al
 *    panel cuando la célula revienta o deja de cambiar (entonces se escribe en el store).
 */
import {
  avanzarCelula, leerCelula, estadoTransferencia, pasoVolumenReto, MEDIO_INICIAL, CAMARA_LENTA, UMBRAL_LISIS_B2,
  type EstadoCelula, type Lectura, type Medio,
} from './transporte';

export type VistaB2 = 'membrana' | 'celula' | 'reto';

/** Un punto de la historia de la exploración (t en s reales). */
export interface PuntoGradiente {
  t: number;
  /** mOsm/L dentro − fuera (+: el agua entra) */
  agua: number;
  /** mM fuera − dentro (+: la glucosa entra) */
  glucosa: number;
  /** mmHg fuera − dentro (+: el O₂ entra) */
  o2: number;
  /** mM fuera − dentro (lo sostiene la bomba) */
  na: number;
  /** % de V₀ */
  v: number;
}

const MAX_HISTORIA = 900;

function diezmar<T>(h: T[]): T[] {
  if (h.length <= MAX_HISTORIA) return h;
  // diezma la mitad más antigua (conserva el primero y la forma de la curva)
  const viejos = h.slice(0, MAX_HISTORIA / 2).filter((_, i) => i % 2 === 0);
  return [...viejos, ...h.slice(MAX_HISTORIA / 2)];
}

export class RelojTransporte {
  medio: Medio;
  estado: EstadoCelula;
  lectura: Lectura;
  historia: PuntoGradiente[] = [];
  /** cámara lenta: 1 s de pantalla = 1/factor s reales */
  factor: number = CAMARA_LENTA.membrana;
  pausa = false;
  /** sube cada vez que cambia algo visible */
  version = 0;
  /** sube con cada transferencia (la escena repuebla sus partículas) */
  generacion = 0;
  /** s de pantalla de este cuadro (0 en pausa): la escena anima con esto */
  dtPantalla = 0;
  /** s reales de este cuadro */
  dtReal = 0;
  /** s de animación acumulados (se congelan en pausa) */
  tAnim = 0;
  /** marca del último paso (el panel avanza el reloj si la escena no pinta) */
  ultimoPaso = 0;

  constructor(medio: Medio = MEDIO_INICIAL) {
    this.medio = { ...medio };
    this.estado = estadoTransferencia(this.medio.tC);
    this.lectura = leerCelula(this.medio, this.estado);
    this.anotar(true);
  }

  private anotar(forzar = false) {
    const l = this.lectura;
    const p: PuntoGradiente = {
      t: this.estado.t, agua: l.osmIn - l.osmOut, glucosa: l.gOut - l.gIn, o2: l.pO2Out - l.pO2In, na: l.naOut - l.naIn, v: l.vRel,
    };
    const u = this.historia[this.historia.length - 1];
    // un punto cada ~1/400 del tiempo transcurrido (la gráfica abarca desde la transferencia)
    if (!forzar && u && p.t - u.t < Math.max(1e-5, p.t / 400)) return;
    this.historia.push(p);
    this.historia = diezmar(this.historia);
  }

  /** Avanza dtPantalla segundos de pantalla. */
  paso(dtPantalla: number, ahora = 0) {
    if (!(dtPantalla > 0)) return;
    const d = Math.min(dtPantalla, 0.1);
    this.ultimoPaso = ahora;
    this.dtPantalla = this.pausa ? 0 : d;
    this.dtReal = this.dtPantalla / this.factor;
    this.tAnim += this.dtPantalla;
    if (this.dtReal > 0) {
      this.estado = avanzarCelula(this.medio, this.estado, this.dtReal);
      this.lectura = leerCelula(this.medio, this.estado);
      this.anotar();
    }
    this.version++;
  }

  /** Cambia el medio: la célula sigue desde donde está (los transitorios salen de la ley). */
  fijarMedio(m: Partial<Medio>) {
    const n = { ...this.medio, ...m };
    if (n.nacl === this.medio.nacl && n.kcl === this.medio.kcl && n.glucosa === this.medio.glucosa && n.atp === this.medio.atp && n.pO2 === this.medio.pO2 && n.tC === this.medio.tC) return;
    this.medio = n;
    this.lectura = leerCelula(this.medio, this.estado);
    this.anotar(true);
    this.version++;
  }

  /** t = 0: la célula llega de un suero isotónico sin glucosa y de sangre venosa. */
  transferir() {
    this.estado = estadoTransferencia(this.medio.tC);
    this.lectura = leerCelula(this.medio, this.estado);
    this.historia = [];
    this.anotar(true);
    this.generacion++;
    this.version++;
  }
}

// ───────────────────────────── el reto ─────────────────────────────

export interface ConfigReto {
  tipo: 'animal' | 'vegetal';
  /** mol/L */
  nacl: number;
  /** mol/L */
  glucosa: number;
  tC: number;
  /** Osm/L del citoplasma con V₀ (la incógnita) */
  osm0: number;
  /** del store: si vuelve a false (muestra nueva) la célula vuelve a V₀ */
  lisada: boolean;
}
export interface PuntoVolumen { t: number; v: number }
export type Tendencia = 'gana' | 'pierde' | 'estable';

/** |dV/dt| (en %V₀ por segundo de PANTALLA) por debajo del cual se considera estable. */
const UMBRAL_ESTABLE = 0.05;

export class RelojReto {
  cfg: ConfigReto;
  /** % de V₀ */
  V = 100;
  lisada = false;
  t = 0;
  historia: PuntoVolumen[] = [];
  factor: number = CAMARA_LENTA.reto;
  pausa = false;
  version = 0;
  generacion = 0;
  dtPantalla = 0;
  dtReal = 0;
  tAnim = 0;
  ultimoPaso = 0;
  /** %V₀ por s de pantalla (con signo) */
  dVdt = 0;
  tendencia: Tendencia = 'estable';
  private estableDesde = 0;
  private escrito = true;
  onLisis?: (v: number) => void;
  onEstable?: (v: number) => void;

  constructor(cfg: ConfigReto) {
    this.cfg = { ...cfg };
    this.lisada = cfg.lisada;
    this.historia = [{ t: 0, v: this.V }];
  }

  /** Muestra nueva (otra incógnita, otro tipo celular, o se retiró la lisis): vuelve a V₀. */
  reiniciar() {
    this.V = 100; this.t = 0; this.lisada = false; this.historia = [{ t: 0, v: 100 }];
    this.dVdt = 0; this.tendencia = 'estable'; this.estableDesde = 0; this.escrito = true;
    this.generacion++; this.version++;
  }

  configurar(c: ConfigReto) {
    const muestraNueva = c.osm0 !== this.cfg.osm0 || c.tipo !== this.cfg.tipo || (this.cfg.lisada && !c.lisada);
    this.cfg = { ...c };
    if (muestraNueva) this.reiniciar();
    else { this.escrito = false; this.version++; }
  }

  get osmExt() { return 2 * this.cfg.nacl + this.cfg.glucosa; }

  paso(dtPantalla: number, ahora = 0) {
    if (!(dtPantalla > 0)) return;
    const d = Math.min(dtPantalla, 0.1);
    this.ultimoPaso = ahora;
    this.dtPantalla = this.pausa ? 0 : d;
    this.dtReal = this.dtPantalla / this.factor;
    this.tAnim += this.dtPantalla;
    if (this.dtReal > 0 && !this.lisada) {
      const antes = this.V;
      this.V = pasoVolumenReto(this.V, this.cfg.tipo, this.cfg.osm0, this.osmExt, this.cfg.tC, this.dtReal);
      this.t += this.dtReal;
      this.dVdt = (this.V - antes) / this.dtPantalla;
      this.tendencia = Math.abs(this.dVdt) < UMBRAL_ESTABLE ? 'estable' : this.dVdt > 0 ? 'gana' : 'pierde';
      const u = this.historia[this.historia.length - 1];
      if (!u || this.t - u.t >= Math.max(1e-3, this.t / 400)) { this.historia.push({ t: this.t, v: this.V }); this.historia = diezmar(this.historia); }
      if (this.cfg.tipo === 'animal' && this.V >= UMBRAL_LISIS_B2) {
        this.lisada = true; this.tendencia = 'estable'; this.dVdt = 0;
        this.onLisis?.(this.V);
      } else if (this.tendencia === 'estable') {
        this.estableDesde += this.dtPantalla;
        if (this.estableDesde > 0.8 && !this.escrito) { this.escrito = true; this.onEstable?.(Math.round(this.V * 10) / 10); }
      } else {
        this.estableDesde = 0; this.escrito = false;
      }
    }
    this.version++;
  }
}

/** Reloj activo de cada vista (la membrana y la célula comparten la exploración). */
export const factorDeVista = (v: VistaB2) => CAMARA_LENTA[v];
