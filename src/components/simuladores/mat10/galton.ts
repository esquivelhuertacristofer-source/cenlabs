/**
 * mat10/galton.ts — la física de la máquina de Galton, en un módulo PURO (sin three
 * ni React): la escena 3D, el dock y la bitácora leen de aquí, y las pruebas de jest
 * (`src/__tests__/mat10-galton.test.ts`) la contrastan.
 *
 * EL MODELO (unidades: cm, s; g = 981 cm/s²)
 *  - Diez filas de clavos de latón en red triangular (paso d, filas a h = d·√3/2).
 *    Cada clavo es UNA decisión: la bolita sigue por el lado del clavo que toca.
 *    Tras diez clavos cae en el contenedor k = nº de desvíos a la derecha, así que
 *    k ~ Binomial(10, p) si las decisiones son independientes con P(derecha) = p.
 *  - p sale de la INCLINACIÓN α del tablero (giro en su propio plano) con un modelo
 *    de impacto: con el tablero a plomo, el parámetro de impacto b (distancia del
 *    centro de la bolita al eje del clavo, medida en horizontal al tocarlo) es
 *    uniforme en ±w. Inclinado, la componente g·sen α de la gravedad corre a la
 *    bolita δ = h·tan α en la caída de una fila desde el reposo; entonces
 *        b ~ U(δ − w, δ + w),  p = P(b > 0) = ½ + δ/(2w)  ⇒  tan α = (2p − 1)·w/h.
 *    La decisión es Bernoulli(p) EXACTA: derecha ⇔ U > 1 − p con U uniforme.
 *  - Entre clavos la bolita vuela en parábola con la gravedad del tablero inclinado
 *    (g·sen α a lo largo de la fila, g·cos α hacia abajo). El rebote en el clavo
 *    (restitución normal e, retención tangencial μ) fija la componente vertical de
 *    salida y, con ella, la duración del vuelo; la horizontal se ajusta para llegar al
 *    punto de impacto que dicta la siguiente decisión.
 *  - Al pasar la última fila cae por la boca de su canal hasta la primera RANURA libre
 *    de la pila (empaquetamiento hexagonal compacto en un canal de 3,5 diámetros:
 *    capas de 3 bolitas alternadas) y da un último bote corto antes de quedarse quieta.
 *
 * Coordenadas del TABLERO: x a la derecha, y hacia arriba, origen en el eje del clavo
 * de la primera fila. La fila i está en y = −i·h y su clavo j en x = (j − i/2)·d.
 */

// ───────────────────────────── geometría (cm) ─────────────────────────────

export const FILAS = 10;
export const CONTENEDORES = FILAS + 1;
/** Paso horizontal entre clavos de una fila (= ancho de cada contenedor). */
export const PASO = 2.22;
/** Separación vertical entre filas (red triangular equilátera). */
export const DY_FILA = (PASO * Math.sqrt(3)) / 2;
/** Bolita de acero Ø 6 mm y clavo de latón Ø 3,4 mm. */
export const R_BOLA = 0.3;
export const R_CLAVO = 0.17;
/** Distancia entre centros en el contacto bolita–clavo. */
export const R_CONTACTO = R_BOLA + R_CLAVO;
/** Semiancho w de la distribución del parámetro de impacto (con 0,55·R nunca se sale del clavo: |b| ≤ 1,8·w < R). */
export const W_IMPACTO = 0.55 * R_CONTACTO;
export const G = 981;
export const ESPESOR_TABIQUE = 0.1;
export const ANCHO_CANAL = PASO - ESPESOR_TABIQUE;
/** Centro de la bolita al salir de la tolva: una fila (h) por encima del contacto con el clavo 0. */
export const Y_SALIDA = R_CONTACTO + DY_FILA;
export const Y_ULTIMA = -(FILAS - 1) * DY_FILA;
/** Filo superior de los tabiques (bajo la última fila de clavos). */
export const Y_TABIQUE = Y_ULTIMA - 0.75 * DY_FILA;
/** Boca de los canales: la «fila virtual» once, donde la bolita entra al canal. */
export const Y_BOCA = Y_ULTIMA - DY_FILA;
/**
 * Fondo de los canales (cara superior del travesaño inferior): 34 capas de 3 = 102 bolitas
 * por canal. La hondura no es estética: con p = 0,9 (extremo del deslizador) el canal 9
 * recibe el 38,7 % de las bolitas, y con 84 de capacidad la máquina se llenaba antes de
 * la bolita 200 que exige el reto en 1 de cada 5 intentos; con 102, en 2 de cada 10 000
 * (lo prueba jest con colas binomiales exactas).
 */
export const Y_FONDO = Y_BOCA - 18.1;
/** Paredes interiores del marco = paredes exteriores de los contenedores 0 y 10. */
export const X_PARED = (CONTENEDORES / 2) * PASO;

/** Centro del clavo j de la fila i. */
export const clavo = (fila: number, j: number): [number, number] => [(j - fila / 2) * PASO, -fila * DY_FILA];
/** Eje del contenedor k (0…10). */
export const xContenedor = (k: number) => (k - FILAS / 2) * PASO;
/** Eje del tabique m (0…11; 0 y 11 son las paredes del marco). Los tabiques 1…10 caen bajo los clavos de la última fila. */
export const xTabique = (m: number) => (m - CONTENEDORES / 2) * PASO;
/** Todos los clavos, fila a fila (55). */
export function clavos(): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < FILAS; i++) for (let j = 0; j <= i; j++) out.push(clavo(i, j));
  return out;
}

// ───────────────────────────── pila en el canal ─────────────────────────────

/** Separación vertical entre capas del empaquetamiento hexagonal: Ø·√3/2. */
export const PASO_CAPA = 2 * R_BOLA * (Math.sqrt(3) / 2);
export const POR_CAPA = 3;
/** Capas que caben con la de arriba al menos un diámetro bajo la boca. */
export const CAPAS = Math.floor((Y_BOCA - 2 * R_BOLA - (Y_FONDO + R_BOLA)) / PASO_CAPA) + 1;
/** Bolitas que caben en un contenedor. */
export const CAPACIDAD = CAPAS * POR_CAPA;
/** Orden de llenado dentro de una capa (centro primero, luego izquierda y derecha). */
const ORDEN_CAPA = [1, 0, 2];

/** Centro de la n-ésima bolita (0, 1, 2…) apilada en el contenedor k. */
export function ranura(k: number, n: number): [number, number] {
  const capa = Math.floor(n / POR_CAPA);
  const q = ORDEN_CAPA[n % POR_CAPA];
  const izq = xContenedor(k) - ANCHO_CANAL / 2;
  const holgura = ANCHO_CANAL - (POR_CAPA + 0.5) * 2 * R_BOLA;
  const x = izq + holgura / 2 + R_BOLA + (capa % 2 ? R_BOLA : 0) + q * 2 * R_BOLA;
  return [x, Y_FONDO + R_BOLA + capa * PASO_CAPA];
}

// ───────────────────────────── inclinación ↔ p ─────────────────────────────

/** Inclinación α (rad, > 0 = baja el lado derecho) que da probabilidad p de ir a la derecha. */
export const alfaDeP = (p: number) => Math.atan(((2 * p - 1) * W_IMPACTO) / DY_FILA);
/** Inversa: p que produce la inclinación α. */
export const pDeAlfa = (alfa: number) => 0.5 + (DY_FILA * Math.tan(alfa)) / (2 * W_IMPACTO);
/** Corrimiento δ del parámetro de impacto (cm) con probabilidad p. */
export const corrimiento = (p: number) => (2 * p - 1) * W_IMPACTO;
/** Gravedad en coordenadas del tablero inclinado α (cm/s²). */
export const gravedadTablero = (alfa: number): [number, number] => [G * Math.sin(alfa), -G * Math.cos(alfa)];

/** Nivel de burbuja del travesaño superior: vial curvo de radio R_VIAL (cm). */
export const R_VIAL = 50;
/** Desplazamiento de la burbuja a lo largo del vial (cm, en x del tablero): s = R·α hacia el lado ALTO. */
export const burbuja = (alfa: number) => -R_VIAL * alfa;

// ───────────────────────────── azar reproducible ─────────────────────────────

/** Generador uniforme en [0, 1) con semilla (mulberry32): la misma semilla da la misma muestra. */
export function crearAzar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────────────── trayectoria ─────────────────────────────

/** Restitución normal y retención tangencial en el choque acero–latón (sólo dan forma al vuelo). */
export const RESTITUCION_CLAVO = 0.45;
export const RETENCION_TANGENCIAL = 0.85;
/** Restitución al caer sobre la pila (el último bote). */
export const RESTITUCION_PILA = 0.18;
/** Dispersión horizontal del punto de entrada en la boca del canal (cm). */
export const DISPERSION_BOCA = 0.25;

/** Un tramo de vuelo: x(τ) = x0 + vx·τ + ½·ax·τ², τ ∈ [0, dur], que empieza en t0. */
export interface Tramo { t0: number; dur: number; x0: number; y0: number; vx: number; vy: number; ax: number; ay: number }

export interface Recorrido {
  /** +1 derecha, −1 izquierda, una por fila. */
  decisiones: number[];
  /** Parámetro de impacto en cada clavo (cm, > 0 = a la derecha del eje). */
  impactos: number[];
  /** Índice j del clavo tocado en cada fila. */
  clavosTocados: number[];
  /** Contenedor final = nº de decisiones a la derecha. */
  k: number;
  /** Desde la salida de la tolva hasta la boca del canal. */
  tramos: Tramo[];
  /** Instante (desde la salida) en que llega a la boca, y su estado ahí. */
  tBoca: number;
  boca: { x: number; y: number; vx: number; vy: number };
}

/** Duración de un vuelo que sale con vy = u y baja dy (< 0) con gravedad gy (> 0). */
function duracionVuelo(u: number, dy: number, gy: number) {
  return (u + Math.sqrt(Math.max(0, u * u - 2 * gy * dy))) / gy;
}

/** Holgura admitida al comprobar que un vuelo no corta un clavo (0,04 mm). */
const HOLGURA_CHOQUE = 0.004;
/** Muestras por vuelo en la comprobación. */
const MUESTRAS_CHOQUE = 32;

/**
 * ¿El vuelo (x0, y0) + (vx, vy)·τ + ½(ax, ay)·τ² despeja los clavos de las filas
 * `fila` y `fila + 1` y, si baja de los tabiques, sus filos? Se excluyen los extremos
 * (son los propios contactos, a distancia exacta R).
 */
function despeja(fila: number, x0: number, y0: number, vx: number, vy: number, ax: number, ay: number, T: number): boolean {
  for (let s = 1; s < MUESTRAS_CHOQUE; s++) {
    const tau = (s / MUESTRAS_CHOQUE) * T;
    const x = x0 + vx * tau + 0.5 * ax * tau * tau, y = y0 + vy * tau + 0.5 * ay * tau * tau;
    for (let f = fila; f <= Math.min(FILAS - 1, fila + 1); f++) {
      const jc = Math.round(x / PASO + f / 2);
      for (let j = Math.max(0, jc - 1); j <= Math.min(f, jc + 1); j++) {
        const [cx, cy] = clavo(f, j);
        if (Math.hypot(x - cx, y - cy) < R_CONTACTO - HOLGURA_CHOQUE) return false;
      }
    }
    if (y - R_BOLA <= Y_TABIQUE) {
      const m = Math.round(x / PASO + CONTENEDORES / 2);
      if (m >= 1 && m <= FILAS && Math.abs(x - xTabique(m)) < R_BOLA + ESPESOR_TABIQUE / 2) return false;
    }
  }
  return true;
}

/**
 * Recorrido completo de una bolita por los diez clavos (todas sus decisiones se
 * sortean aquí, con `azar`). Consume 1 + FILAS + 1 números: la reproducibilidad
 * de una muestra sólo depende de la semilla.
 */
export function generarRecorrido(p: number, azar: () => number): Recorrido {
  const alfa = alfaDeP(p);
  const [ax, ay] = gravedadTablero(alfa);
  const gy = -ay;
  const delta = corrimiento(p);
  const sortearImpacto = () => (2 * azar() - 1) * W_IMPACTO + delta;
  const contacto = (fila: number, j: number, b: number): [number, number] => {
    const [cx, cy] = clavo(fila, j);
    return [cx + b, cy + Math.sqrt(Math.max(0, R_CONTACTO * R_CONTACTO - b * b))];
  };

  const decisiones: number[] = [], impactos: number[] = [], clavosTocados: number[] = [], tramos: Tramo[] = [];
  let j = 0;
  let b = sortearImpacto();
  // primera caída: desde el reposo en la salida de la tolva hasta el clavo 0 (una fila de altura)
  let [x, y] = contacto(0, 0, b);
  const T0 = duracionVuelo(0, y - Y_SALIDA, gy);
  tramos.push({ t0: 0, dur: T0, x0: x - 0.5 * ax * T0 * T0, y0: Y_SALIDA, vx: 0, vy: 0, ax, ay });
  let vx = ax * T0, vy = -gy * T0;
  let t = T0;
  let boca = { x: 0, y: 0, vx: 0, vy: 0 };

  for (let fila = 0; fila < FILAS; fila++) {
    const s = b > 0 ? 1 : -1;
    decisiones.push(s); impactos.push(b); clavosTocados.push(j);
    // rebote: normal n = (b, √(R² − b²))/R; v' = μ·v_t − e·v_n
    const nx = b / R_CONTACTO, ny = Math.sqrt(Math.max(0, 1 - nx * nx));
    const vn = vx * nx + vy * ny;
    const u = RETENCION_TANGENCIAL * (vy - vn * ny) - RESTITUCION_CLAVO * vn * ny;
    const jSig = j + (s > 0 ? 1 : 0);
    let xs: number, ys: number;
    if (fila < FILAS - 1) {
      b = sortearImpacto();
      [xs, ys] = contacto(fila + 1, jSig, b);
    } else {
      xs = xContenedor(jSig) + (2 * azar() - 1) * DISPERSION_BOCA;
      ys = Y_BOCA;
    }
    const dx = xs - x, dy = ys - y;
    // si el vuelo «físico» rozaría el clavo que deja (al salir por su flanco casi sin
    // bote) o el siguiente, el bote real es algo más alto: se sube vy de 4 en 4 cm/s
    let vy0 = u, T = duracionVuelo(vy0, dy, gy), vx0 = (dx - 0.5 * ax * T * T) / T;
    for (let intento = 0; intento < 30 && !despeja(fila, x, y, vx0, vy0, ax, ay, T); intento++) {
      vy0 = Math.max(vy0, 0) + 4;
      T = duracionVuelo(vy0, dy, gy);
      vx0 = (dx - 0.5 * ax * T * T) / T;
    }
    tramos.push({ t0: t, dur: T, x0: x, y0: y, vx: vx0, vy: vy0, ax, ay });
    t += T;
    x = xs; y = ys;
    vx = vx0 + ax * T; vy = vy0 - gy * T;
    j = jSig;
    if (fila === FILAS - 1) boca = { x, y, vx, vy };
  }
  return { decisiones, impactos, clavosTocados, k: j, tramos, tBoca: t, boca };
}

/**
 * Caída final por el canal, desde la boca hasta la ranura (x, y) de la pila, y el bote
 * sobre ella. Devuelve los dos tramos (el bote vuelve exactamente a la ranura).
 */
export function caidaFinal(t0: number, boca: { x: number; y: number; vx: number; vy: number }, destino: [number, number], alfa: number): Tramo[] {
  const [ax, ay] = gravedadTablero(alfa);
  const gy = -ay;
  const dy = Math.min(-1e-3, destino[1] - boca.y);
  const T = duracionVuelo(boca.vy, dy, gy);
  const vx0 = (destino[0] - boca.x - 0.5 * ax * T * T) / T;
  const vImpacto = boca.vy - gy * T;
  const u = RESTITUCION_PILA * Math.abs(vImpacto);
  const Th = (2 * u) / gy;
  return [
    { t0, dur: T, x0: boca.x, y0: boca.y, vx: vx0, vy: boca.vy, ax, ay },
    { t0: t0 + T, dur: Th, x0: destino[0], y0: destino[1], vx: -0.5 * ax * Th, vy: u, ax, ay },
  ];
}

/** Posición en el tramo a su tiempo local τ. */
export function enTramo(tr: Tramo, tau: number): [number, number] {
  const s = Math.max(0, Math.min(tr.dur, tau));
  return [tr.x0 + tr.vx * s + 0.5 * tr.ax * s * s, tr.y0 + tr.vy * s + 0.5 * tr.ay * s * s];
}

/** Posición a lo largo de una lista de tramos contiguos en el instante t (se queda en los extremos). */
export function posicionEn(tramos: Tramo[], t: number): [number, number] {
  if (!tramos.length) return [0, 0];
  let i = 0;
  while (i < tramos.length - 1 && t > tramos[i].t0 + tramos[i].dur) i++;
  return enTramo(tramos[i], t - tramos[i].t0);
}

// ───────────────────────────── estadística ─────────────────────────────

export function binomial(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}
/** P(K = k) para K ~ Binomial(n, p). */
export const pmfBinomial = (k: number, p: number, n = FILAS) => binomial(n, k) * p ** k * (1 - p) ** (n - k);
/** Densidad normal. */
export const densidadNormal = (x: number, mu: number, sigma: number) =>
  Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

/** ln Γ(x) (Lanczos, g = 7, 9 términos): error relativo < 1e-13 para x > 0. */
export function lnGamma(x: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Función gamma incompleta regularizada inferior P(a, x) (serie o fracción continua de Lentz). */
export function gammaRegularizada(a: number, x: number): number {
  if (x <= 0) return 0;
  const lnPre = a * Math.log(x) - x - lnGamma(a);
  if (x < a + 1) {
    let suma = 1 / a, termino = 1 / a;
    for (let n = 1; n < 500; n++) {
      termino *= x / (a + n);
      suma += termino;
      if (Math.abs(termino) < Math.abs(suma) * 1e-15) break;
    }
    return suma * Math.exp(lnPre);
  }
  const MIN = 1e-300;
  let b = x + 1 - a, c = 1 / MIN, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < MIN) d = MIN;
    c = b + an / c; if (Math.abs(c) < MIN) c = MIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(lnPre) * h;
}

/** Función de distribución de χ² con `gl` grados de libertad. */
export const cdfChi2 = (x: number, gl: number) => gammaRegularizada(gl / 2, x / 2);
/** p-valor de la prueba (cola superior). */
export const pValorChi2 = (x: number, gl: number) => 1 - cdfChi2(x, gl);

/** Contenedores de una muestra de N recorridos simulados (para pruebas y para el modelo). */
export function muestraSimulada(p: number, N: number, azar: () => number): number[] {
  const c = new Array(CONTENEDORES).fill(0);
  for (let i = 0; i < N; i++) c[generarRecorrido(p, azar).k]++;
  return c;
}
