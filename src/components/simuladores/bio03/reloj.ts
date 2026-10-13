/**
 * bio03/reloj.ts — EL reloj de la síntesis de proteínas (sin three).
 *
 * El store dice QUÉ pasó (una base apareada, un ARNt aceptado, un error); el reloj lo
 * convierte en un ACONTECIMIENTO con duración (llega el NTP, se aparea, se suelta el
 * pirofosfato, la polimerasa transloca; llega el ARNt con su factor, se acomoda, se
 * forma el enlace peptídico, el ribosoma transloca…) y lleva el estado VISIBLE que
 * leen, en el mismo cuadro, la escena 3D y el dock. La escena lo hace avanzar en su
 * bucle (`paso(dt)`, prioridad −20) y el dock se redibuja desde la suscripción: nunca
 * hay dos relojes.
 *
 *  · Los acontecimientos van en cola; si el alumno se adelanta, los pendientes corren
 *    más deprisa (×2,2) para no quedarse atrás.
 *  · `t` es el tiempo de ambiente (agitación térmica, ondulación del ARN): «pausa» lo
 *    congela. Los acontecimientos siguen aunque haya pausa: lo que el alumno hace se ve.
 *  · Con «reducir movimiento» el ambiente arranca en pausa y cada acontecimiento dura
 *    la cuarta parte.
 *
 * Lo que el reloj expone es SÓLO lo que el alumno ya decidió: bases incorporadas, el
 * NTP o el ARNt que él eligió (correcto o no) y los aminoácidos ya unidos. Nunca la
 * base o el anticodón que tocaría.
 */
import { DUR, camaraLenta, anticodonDe } from './molecular';

export type Acto = 'transcripcion' | 'exportacion' | 'traduccion';
export type TipoEvento = 'incorporar' | 'rechazarNTP' | 'exportar' | 'iniciar' | 'elongar' | 'rechazarARNt' | 'terminar';

export interface Evento {
  tipo: TipoEvento;
  /** base del NTP elegido, anticodón del ARNt elegido o 'LIBERACION' */
  valor: string;
  /** nucleótido del gen (transcripción) o codón (traducción) al que va */
  indice: number;
  /** aminoácido que entra (iniciar / elongar) */
  aa?: string;
}

/** Lo mínimo del estado del store que el reloj necesita. */
export interface EstadoSintesis {
  fase: 'transcripcion' | 'traduccion';
  adnPlantilla: string;
  arnMensajero: string;
  proteina: readonly { name: string }[];
  errores: number;
  terminada: boolean;
}

interface Hecho {
  acto: 'transcripcion' | 'traduccion';
  adn: string;
  /** ARNm del gen tal como lo dio el store (sólo se muestran los nTx primeros) */
  arn: string;
  nTx: number;
  nCod: number;
  peptido: string[];
  terminada: boolean;
}

interface Meta { adn: string; nTx: number; nCod: number; terminada: boolean; errores: number; fase: 'transcripcion' | 'traduccion' }

export const VELOCIDADES = [1, 1 / 3] as const;
const PRISA = 2.2;
const REDUCIDO = 4;

const duracion = (e: Evento): number => ({
  incorporar: DUR.incorporacion,
  rechazarNTP: DUR.rechazoNTP,
  exportar: DUR.exportacion,
  iniciar: DUR.iniciacion,
  elongar: DUR.elongacion,
  rechazarARNt: DUR.rechazoARNt,
  terminar: DUR.terminacion,
}[e.tipo]);

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Fases (fracción del acontecimiento) de la incorporación de un NTP. */
export const FASES_NTP = { llega: 0.45, aparea: 0.6, pirofosfato: 0.72 } as const;
/** Fases de un ciclo de alargamiento. */
export const FASES_ELONGACION = { llega: 0.32, aparea: 0.42, acomoda: 0.55, enlace: 0.65 } as const;

export class RelojSintesis {
  /** tiempo de ambiente (s de pantalla) */
  t = 0;
  velocidad: number = 1;
  pausa: boolean;
  readonly reducido: boolean;
  /** acontecimiento en curso y su avance 0 → 1 */
  actual: Evento | null = null;
  fase = 0;
  readonly cola: Evento[] = [];
  hecho: Hecho;
  private meta: Meta;
  /** hay una escena moviendo el reloj (si no, los acontecimientos se aplican al instante) */
  escenaActiva = false;
  version = 0;
  private subs = new Set<() => void>();

  constructor(inicial: EstadoSintesis, reducido = false) {
    this.reducido = reducido;
    this.pausa = reducido;
    this.hecho = this.desde(inicial);
    this.meta = this.metaDe(inicial);
  }

  private desde(s: EstadoSintesis): Hecho {
    return {
      acto: s.fase,
      adn: s.adnPlantilla,
      arn: s.arnMensajero,
      nTx: s.arnMensajero.length,
      nCod: s.proteina.length,
      peptido: s.proteina.map((a) => a.name),
      terminada: s.terminada,
    };
  }
  private metaDe(s: EstadoSintesis): Meta {
    return { adn: s.adnPlantilla, nTx: s.arnMensajero.length, nCod: s.proteina.length, terminada: s.terminada, errores: s.errores, fase: s.fase };
  }

  /** Salta al estado del store sin animar (gen nuevo, reinicio o algo incoherente). */
  reiniciar(s: EstadoSintesis) {
    this.hecho = this.desde(s);
    this.meta = this.metaDe(s);
    this.cola.length = 0;
    this.actual = null;
    this.fase = 0;
    this.avisar();
  }

  /**
   * Compara el store con lo que el reloj ya muestra o tiene en cola y encola lo nuevo.
   * `intento` es lo que el alumno acaba de elegir (base o anticodón): con él se anima un
   * rechazo. Si el cambio no es un avance (otro gen, reinicio), salta sin animar.
   */
  sincronizar(s: EstadoSintesis, intento?: string) {
    const m = this.meta;
    const coherente = s.adnPlantilla === m.adn
      && s.arnMensajero.length >= m.nTx
      && s.proteina.length >= m.nCod
      && s.errores >= m.errores
      && (!m.terminada || s.terminada)
      && !(m.fase === 'traduccion' && s.fase === 'transcripcion');
    if (!coherente) { this.reiniciar(s); return; }
    this.hecho.arn = s.arnMensajero;
    let cambio = false;
    for (let k = m.errores; k < s.errores; k++) {
      this.cola.push(s.fase === 'transcripcion'
        ? { tipo: 'rechazarNTP', valor: intento ?? 'A', indice: m.nTx }
        : { tipo: 'rechazarARNt', valor: intento ?? 'AAA', indice: m.nCod });
      cambio = true;
    }
    m.errores = s.errores;
    while (s.arnMensajero.length > m.nTx) {
      this.cola.push({ tipo: 'incorporar', valor: s.arnMensajero[m.nTx], indice: m.nTx });
      m.nTx++; cambio = true;
    }
    if (s.fase === 'traduccion' && m.fase === 'transcripcion') {
      this.cola.push({ tipo: 'exportar', valor: '', indice: 0 });
      m.fase = 'traduccion'; cambio = true;
    }
    while (s.proteina.length > m.nCod) {
      const k = m.nCod;
      this.cola.push({ tipo: k === 0 ? 'iniciar' : 'elongar', valor: anticodonDe(s.arnMensajero.slice(3 * k, 3 * k + 3)), indice: k, aa: s.proteina[k].name });
      m.nCod++; cambio = true;
    }
    if (s.terminada && !m.terminada) {
      this.cola.push({ tipo: 'terminar', valor: 'LIBERACION', indice: m.nCod });
      m.terminada = true; cambio = true;
    }
    if (cambio && !this.escenaActiva) this.vaciar();
    if (cambio) this.avisar();
  }

  /** Aplica todo lo pendiente al instante (sin escena que lo anime). */
  vaciar() {
    if (this.actual) { this.aplicar(this.actual); this.actual = null; this.fase = 0; }
    while (this.cola.length) this.aplicar(this.cola.shift()!);
    this.avisar();
  }

  private aplicar(e: Evento) {
    const h = this.hecho;
    switch (e.tipo) {
      case 'incorporar': h.nTx = Math.max(h.nTx, e.indice + 1); break;
      case 'exportar': h.acto = 'traduccion'; break;
      case 'iniciar':
      case 'elongar': h.nCod = Math.max(h.nCod, e.indice + 1); if (e.aa) h.peptido = [...h.peptido.slice(0, e.indice), e.aa]; break;
      case 'terminar': h.terminada = true; break;
      default: break;
    }
  }

  /** Avanza dt s de reloj de pared. */
  paso(dt: number) {
    const d = Math.min(0.1, Math.max(0, dt));
    if (!this.pausa) this.t += d * this.velocidad;
    if (!this.actual && this.cola.length) { this.actual = this.cola.shift()!; this.fase = 0; }
    if (this.actual) {
      const k = this.velocidad * (this.cola.length ? PRISA : 1) * (this.reducido ? REDUCIDO : 1);
      this.fase += (d * k) / duracion(this.actual);
      if (this.fase >= 1) {
        this.aplicar(this.actual);
        this.actual = null; this.fase = 0;
        if (this.cola.length) { this.actual = this.cola.shift()!; this.fase = 0; }
      }
    }
    this.avisar();
  }

  // ───────────────────────── lo que se ve ─────────────────────────

  get acto(): Acto {
    if (this.actual?.tipo === 'exportar') return 'exportacion';
    return this.hecho.acto;
  }
  /** Avance 0 → 1 de la exportación (1 fuera de ella). */
  get exportacion(): number { return this.actual?.tipo === 'exportar' ? this.fase : this.hecho.acto === 'traduccion' ? 1 : 0; }

  /** Nucleótidos del gen ya transcritos (continuo durante la translocación de la polimerasa). */
  get sTx(): number {
    const e = this.actual;
    return this.hecho.nTx + (e?.tipo === 'incorporar' ? sm(FASES_NTP.pirofosfato, 1, this.fase) : 0);
  }
  /** ARNm del gen que existe en la escena (sin el NTP que está llegando). */
  get arnVisible(): string { return this.hecho.arn.slice(0, this.hecho.nTx); }

  /** Codón en el sitio P (continuo durante la translocación). */
  get kP(): number {
    const base = Math.max(0, this.hecho.nCod - 1);
    const e = this.actual;
    if (e?.tipo === 'elongar') return base + sm(FASES_ELONGACION.enlace, 1, this.fase);
    return base;
  }
  /** 60S unida (0 → 1): se une al final de la iniciación. */
  get ensamblado(): number {
    if (this.hecho.nCod > 0) return 1;
    return this.actual?.tipo === 'iniciar' ? sm(0.58, 0.95, this.fase) : 0;
  }
  /** Separación de las subunidades al terminar (0 → 1). */
  get separacion(): number {
    if (this.actual?.tipo === 'terminar') return sm(0.62, 1, this.fase);
    return this.hecho.terminada ? 1 : 0;
  }
  /** Aminoácidos ya unidos a la cadena (lo que se ve). */
  get peptido(): readonly string[] { return this.hecho.peptido; }

  /** Cámara lenta del acto en curso respecto al proceso real. */
  get camaraLenta(): number {
    return camaraLenta(this.acto === 'transcripcion' ? 'transcripcion' : 'traduccion', this.velocidad) * (this.reducido ? 1 / REDUCIDO : 1);
  }

  suscribir(fn: () => void) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private avisar() { this.version++; this.subs.forEach((f) => f()); }
}

/**
 * ¿Qué color lleva la base de la hebra CODIFICANTE del gen en la posición j? Sólo la
 * suya si ya se transcribió (es la misma secuencia que el ARNm, con T por U): delante
 * de la polimerasa sería la respuesta. Fuera del gen (promotor, UTR, flanco) siempre.
 */
export function codificanteVisible(j: number, nGen: number, nTranscritos: number): boolean {
  if (j < 0 || j >= nGen) return true;
  return j < nTranscritos;
}
