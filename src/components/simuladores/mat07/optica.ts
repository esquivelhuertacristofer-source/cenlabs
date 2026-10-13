/**
 * mat07/optica.ts — la física del banco de Snell, en un módulo PURO (sin three ni
 * React): la escena 3D, el dock de instrumentos y la bitácora leen de aquí, y las
 * pruebas de jest (`src/__tests__/mat07-optica.test.ts`) la contrastan.
 *
 *  - Ley de Snell        n₁·sen θ₁ = n₂·sen θ₂ (null si hay reflexión total interna)
 *  - Fresnel             R_s, R_p (potencia) en una interfaz dieléctrica sin pérdidas;
 *                        T = 1 − R. Luz natural: R = (R_s + R_p)/2.
 *  - Brewster / crítico  tan θ_B = n₂/n₁ (R_p = 0) · sen θ_c = n₂/n₁ si n₁ > n₂
 *  - Dispersión          Cauchy de dos términos n(λ) = A + B/λ², ajustado a n_D y al
 *                        número de Abbe V = (n_D − 1)/(n_F − n_C) del material.
 *  - Bruma               Beer–Lambert: P(s) = P₀·e^(−μ·s) a lo largo de cada haz.
 *
 * GEOMETRÍA DEL BANCO (en cm, coordenadas de la FIGURA): origen en el centro de la
 * cara plana del bloque semicircular; +y = normal hacia el AIRE; el bloque ocupa
 * y < 0, r < R_BLOQUE. Los ángulos se miden desde la normal. El láser va montado en
 * un jinete que gira alrededor del disco; su posición angular φ (desde +y, hacia −x):
 *   φ ≤ 90°  → aire → bloque, θ₁ = φ
 *   φ > 90°  → bloque → aire, θ₁ = 180° − φ (el láser apunta al centro por la cara
 *              curva: entra por la normal sin desviarse y llega a la cara plana)
 * Así una sola variable continua describe los dos sentidos y la escena puede girar
 * el láser de un lado al otro sin saltos.
 */

// ───────────────────────────── constantes ─────────────────────────────

/** Líneas de Fraunhofer (nm): C (H rojo), D (Na amarillo), F (H azul). */
export const LAMBDA_C = 656.27;
export const LAMBDA_D = 589.29;
export const LAMBDA_F = 486.13;

/** Radio del bloque semicircular, del disco y de la escala (cm). */
export const R_BLOQUE = 9;
export const R_DISCO = 15;
/** Distancia del centro a la abertura del láser (cm). */
export const R_ABERTURA = 9.8;
/** Hasta dónde se trazan los haces que salen (cm): más allá no hay bruma que los muestre. */
export const R_FIN = 20;
/** Coeficiente de extinción de la bruma (1/cm): tenue, ~11 % de pérdida en 10 cm. */
export const MU_AIRE = 0.012;
/** Extinción del acrílico/vidrio por dispersión interna (1/cm). */
export const MU_VIDRIO = 0.004;

export type IdLaser = 'red' | 'green' | 'cyan' | 'violet' | 'white';
export type Sentido = 'aire-bloque' | 'bloque-aire';
export type Polarizacion = 'natural' | 's' | 'p';

export interface DefLaser { id: IdLaser; nombre: string; corto: string; lambdaNm: number | null }
/** Láseres del banco: diodo rojo, DPSS verde, ion de argón azul-cian y diodo violeta; «blanca», una fuente de luz blanca colimada. */
export const LASERES: DefLaser[] = [
  { id: 'red', nombre: 'Láser rojo · 650 nm', corto: '650 nm', lambdaNm: 650 },
  { id: 'green', nombre: 'Láser verde · 532 nm', corto: '532 nm', lambdaNm: 532 },
  { id: 'cyan', nombre: 'Láser azul-cian · 488 nm', corto: '488 nm', lambdaNm: 488 },
  { id: 'violet', nombre: 'Láser violeta · 405 nm', corto: '405 nm', lambdaNm: 405 },
  { id: 'white', nombre: 'Luz blanca colimada (abre el espectro)', corto: 'blanca', lambdaNm: null },
];
export const laserDe = (id: IdLaser): DefLaser => LASERES.find((l) => l.id === id) ?? LASERES[1];

/** Muestras espectrales de la luz blanca (nm), de igual peso. */
export const ESPECTRO_BLANCO = [410, 450, 490, 530, 570, 610, 655];

/**
 * Número de Abbe de cada medio de la tabla (V = (n_D − 1)/(n_F − n_C)):
 * agua 55,6 · vidrio crown 64 (tipo BK7) · cuarzo (rayo ordinario) 70 · diamante 55,5.
 * El cristal MISTERIOSO se modela con V = 60 (dispersión moderada, de cristal):
 * así ni el láser violeta aleja su índice de n_D más de 0,03 y la tolerancia del
 * reto (±0,05) sigue valiendo con cualquier color.
 */
export const ABBE_MISTERIO = 60;
const ABBE_TABLA: [number, number][] = [[1.333, 55.6], [1.5, 64], [1.544, 70], [2.417, 55.5]];
export function abbeDe(nD: number, misterio = false): number {
  if (misterio) return ABBE_MISTERIO;
  if (Math.abs(nD - 1) < 1e-6) return Infinity; // el aire: sin dispersión apreciable a esta escala
  const fila = ABBE_TABLA.find(([n]) => Math.abs(n - nD) < 5e-4);
  return fila ? fila[1] : ABBE_MISTERIO;
}

// ───────────────────────────── dispersión (Cauchy) ─────────────────────────────

export interface Cauchy { A: number; B: number } // B en µm²
/**
 * Cauchy de dos términos ajustado a n_D y a V: n_F − n_C = (n_D − 1)/V fija B y
 * n(λ_D) = n_D fija A. λ en µm dentro de la fórmula.
 */
export function cauchyDesdeAbbe(nD: number, V: number): Cauchy {
  if (!Number.isFinite(V) || V <= 0) return { A: nD, B: 0 };
  const iF = 1 / (LAMBDA_F / 1000) ** 2, iC = 1 / (LAMBDA_C / 1000) ** 2, iD = 1 / (LAMBDA_D / 1000) ** 2;
  const B = (nD - 1) / V / (iF - iC);
  return { A: nD - B * iD, B };
}
export function indiceCauchy(c: Cauchy, lambdaNm: number): number {
  const l = lambdaNm / 1000;
  return c.A + c.B / (l * l);
}
/** Índice del medio a la longitud de onda dada (null → n_D). */
export function indiceA(nD: number, V: number, lambdaNm: number | null): number {
  if (lambdaNm == null) return nD;
  return indiceCauchy(cauchyDesdeAbbe(nD, V), lambdaNm);
}

// ───────────────────────────── Snell y Fresnel ─────────────────────────────

const RAD = Math.PI / 180;
export const rad = (g: number) => g * RAD;
export const grados = (r: number) => r / RAD;

/** Ángulo de refracción (rad) o null si hay reflexión total interna. */
export function snell(n1: number, n2: number, theta1: number): number | null {
  const s = (n1 / n2) * Math.sin(theta1);
  if (s > 1) return null;
  return Math.asin(Math.min(1, s));
}

/** Reflectancia a incidencia normal: ((n₁ − n₂)/(n₁ + n₂))². */
export const reflectanciaNormal = (n1: number, n2: number) => ((n1 - n2) / (n1 + n2)) ** 2;

export interface Fresnel {
  Rs: number; Rp: number; R: number;
  Ts: number; Tp: number; T: number;
  /** ángulo transmitido (rad) o null si hay reflexión total interna */
  thetaT: number | null;
  tir: boolean;
}

/**
 * Coeficientes de Fresnel en POTENCIA para una interfaz dieléctrica sin pérdidas.
 *   r_s = (n₁ cos θᵢ − n₂ cos θₜ)/(n₁ cos θᵢ + n₂ cos θₜ)
 *   r_p = (n₂ cos θᵢ − n₁ cos θₜ)/(n₂ cos θᵢ + n₁ cos θₜ)
 *   R = |r|², T = 1 − R (= (n₂ cos θₜ / n₁ cos θᵢ)·|t|², lo comprueba jest).
 * Con reflexión total interna, R_s = R_p = 1.
 */
export function fresnel(n1: number, n2: number, thetaI: number): Fresnel {
  const ci = Math.cos(thetaI);
  const st = (n1 / n2) * Math.sin(thetaI);
  if (st >= 1) return { Rs: 1, Rp: 1, R: 1, Ts: 0, Tp: 0, T: 0, thetaT: null, tir: true };
  const ct = Math.sqrt(1 - st * st);
  const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  const rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
  const Rs = rs * rs, Rp = rp * rp;
  const R = (Rs + Rp) / 2;
  return { Rs, Rp, R, Ts: 1 - Rs, Tp: 1 - Rp, T: 1 - R, thetaT: Math.asin(st), tir: false };
}

/** Amplitudes de transmisión de Fresnel (para comprobar T = 1 − R con la otra fórmula). */
export function transmisionAmplitud(n1: number, n2: number, thetaI: number): { ts: number; tp: number } | null {
  const ci = Math.cos(thetaI);
  const st = (n1 / n2) * Math.sin(thetaI);
  if (st >= 1) return null;
  const ct = Math.sqrt(1 - st * st);
  return { ts: (2 * n1 * ci) / (n1 * ci + n2 * ct), tp: (2 * n1 * ci) / (n2 * ci + n1 * ct) };
}

export function reflectanciaPol(f: Fresnel, pol: Polarizacion): number {
  return pol === 's' ? f.Rs : pol === 'p' ? f.Rp : f.R;
}

/** Ángulo de Brewster (rad): tan θ_B = n₂/n₁; ahí R_p = 0. */
export const brewster = (n1: number, n2: number) => Math.atan2(n2, n1);
/** Ángulo crítico (rad) si n₁ > n₂; null si no hay reflexión total posible. */
export function anguloCritico(n1: number, n2: number): number | null {
  if (n2 >= n1) return null;
  return Math.asin(n2 / n1);
}

// ───────────────────────────── el banco: θ₁ y sentido ─────────────────────────────

/** Fase φ (°) del jinete del láser para un sentido y θ₁. */
export const faseDe = (sentido: Sentido, theta1Deg: number) => (sentido === 'aire-bloque' ? theta1Deg : 180 - theta1Deg);
/** Sentido y θ₁ (°) que corresponden a una fase φ (°). */
export function desdeFase(faseDeg: number): { sentido: Sentido; theta1: number } {
  return faseDeg <= 90 ? { sentido: 'aire-bloque', theta1: faseDeg } : { sentido: 'bloque-aire', theta1: 180 - faseDeg };
}

/** Índices (n de incidencia, n de transmisión) en la cara plana según el sentido. */
export function indicesInterfaz(sentido: Sentido, n1: number, n2: number): [number, number] {
  return sentido === 'aire-bloque' ? [n1, n2] : [n2, n1];
}

export interface LecturaBanco {
  sentido: Sentido;
  theta1: number;          // °
  /** θ₂ (°) por muestra espectral (null = reflexión total para esa muestra) */
  theta2: (number | null)[];
  /** R y T en la cara plana, promediados en el espectro (luz natural o la polarización elegida) */
  R: number; T: number;
  Rs: number; Rp: number;
  tir: boolean;
  /** índices usados en la cara plana (incidencia, transmisión), a la λ representativa */
  nInc: number; nTrans: number;
}

/** Longitudes de onda que transporta la fuente (una para un láser, siete para la blanca). */
export const lambdasDe = (laser: IdLaser): number[] => {
  const l = laserDe(laser).lambdaNm;
  return l == null ? ESPECTRO_BLANCO : [l];
};

/**
 * Lo que mide el fotómetro en la cara plana: R y T para la configuración dada. Con
 * luz blanca, promedio de igual peso sobre las muestras del espectro.
 */
export function lecturaBanco(
  { sentido, theta1, n1 = 1, nD, V, laser, pol }:
  { sentido: Sentido; theta1: number; n1?: number; nD: number; V: number; laser: IdLaser; pol: Polarizacion },
): LecturaBanco {
  const lams = lambdasDe(laser);
  let R = 0, Rs = 0, Rp = 0, tirTodas = true;
  const theta2: (number | null)[] = [];
  for (const l of lams) {
    const n2 = indiceA(nD, V, l);
    const [ni, nt] = indicesInterfaz(sentido, n1, n2);
    const f = fresnel(ni, nt, rad(theta1));
    R += reflectanciaPol(f, pol); Rs += f.Rs; Rp += f.Rp;
    if (!f.tir) tirTodas = false;
    theta2.push(f.thetaT == null ? null : grados(f.thetaT));
  }
  const k = lams.length;
  const nRep = indiceA(nD, V, laserDe(laser).lambdaNm);
  const [nInc, nTrans] = indicesInterfaz(sentido, n1, nRep);
  return { sentido, theta1, theta2, R: R / k, T: 1 - R / k, Rs: Rs / k, Rp: Rp / k, tir: tirTodas, nInc, nTrans };
}

// ───────────────────────────── trazado de haces ─────────────────────────────

export type MedioHaz = 'aire' | 'vidrio';
export type TipoHaz = 'incidente' | 'reflejado' | 'refractado' | 'salida';
export interface Haz {
  /** extremos en coordenadas de la figura (cm) */
  a: [number, number];
  b: [number, number];
  medio: MedioHaz;
  tipo: TipoHaz;
  /** potencia en el extremo `a` (fracción de la emitida por la fuente) */
  p: number;
  /** longitud de onda (nm) o null para un haz que mezcla el espectro */
  lambdaNm: number | null;
  /** potencia por muestra espectral en `a` (para mezclar el color); suma = p */
  espectro: { lambdaNm: number; p: number }[];
  /** extinción (1/cm) en este tramo */
  mu: number;
}

export interface ParamsTrazado {
  fase: number;          // φ (°)
  n1?: number;
  nD: number;
  V: number;
  laser: IdLaser;
  pol: Polarizacion;
  rBloque?: number;
  rAbertura?: number;
  rFin?: number;
  muAire?: number;
  muVidrio?: number;
}

const largo = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const punto = (dir: [number, number], r: number): [number, number] => [dir[0] * r, dir[1] * r];

/**
 * Traza los haces del banco para la fase φ del láser. Devuelve los tramos con su
 * potencia (Fresnel en cada cara, Beer–Lambert entre caras). Simplificaciones (se
 * declaran en la ficha): sólo el primer orden (se omite el ~4 % que la cara curva
 * devuelve hacia dentro y los rebotes múltiples), haz infinitamente delgado.
 */
export function trazarBanco(p: ParamsTrazado): { haces: Haz[]; lectura: LecturaBanco } {
  const n1 = p.n1 ?? 1;
  const RB = p.rBloque ?? R_BLOQUE, RA = p.rAbertura ?? R_ABERTURA, RF = p.rFin ?? R_FIN;
  const mA = p.muAire ?? MU_AIRE, mV = p.muVidrio ?? MU_VIDRIO;
  const { sentido, theta1 } = desdeFase(p.fase);
  const t1 = rad(theta1);
  const fi = rad(p.fase);
  const u: [number, number] = [-Math.sin(fi), Math.cos(fi)]; // del centro hacia el láser
  const lams = lambdasDe(p.laser);
  const w = 1 / lams.length;
  const nDe = (l: number) => indiceA(p.nD, p.V, l);
  const haces: Haz[] = [];
  const mezcla = (esp: { lambdaNm: number; p: number }[]) => esp.reduce((s, e) => s + e.p, 0);
  const lamUnica = lams.length === 1 ? lams[0] : null;
  const atenua = (esp: { lambdaNm: number; p: number }[], f: number) => esp.map((e) => ({ lambdaNm: e.lambdaNm, p: e.p * f }));
  const push = (a: [number, number], b: [number, number], medio: MedioHaz, tipo: TipoHaz, esp: { lambdaNm: number; p: number }[]) => {
    const pt = mezcla(esp);
    if (!(pt > 1e-6)) return;
    const unica = esp.length === 1 ? esp[0].lambdaNm : lamUnica;
    haces.push({ a, b, medio, tipo, p: pt, lambdaNm: unica, espectro: esp, mu: medio === 'aire' ? mA : mV });
  };

  if (sentido === 'aire-bloque') {
    // incidente: de la abertura al centro, por el aire
    const a: [number, number] = punto(u, RA);
    const esp0 = lams.map((l) => ({ lambdaNm: l, p: w }));
    push(a, [0, 0], 'aire', 'incidente', esp0);
    const espO = atenua(esp0, Math.exp(-mA * RA));
    const refl: { lambdaNm: number; p: number }[] = [];
    for (const e of espO) {
      const n2 = nDe(e.lambdaNm);
      const f = fresnel(n1, n2, t1);
      const R = reflectanciaPol(f, p.pol);
      refl.push({ lambdaNm: e.lambdaNm, p: e.p * R });
      if (f.thetaT == null) continue;
      // refractado en el bloque; sale por la cara curva a incidencia normal (sin desviarse)
      const d: [number, number] = [Math.sin(f.thetaT), -Math.cos(f.thetaT)];
      const espV = [{ lambdaNm: e.lambdaNm, p: e.p * (1 - R) }];
      push([0, 0], punto(d, RB), 'vidrio', 'refractado', espV);
      const tCurva = 1 - reflectanciaNormal(n2, n1);
      push(punto(d, RB), punto(d, RF), 'aire', 'salida', atenua(espV, Math.exp(-mV * RB) * tCurva));
    }
    // reflejado en la cara plana: ángulo de reflexión = θ₁ para todas las λ
    const dr: [number, number] = [Math.sin(t1), Math.cos(t1)];
    push([0, 0], punto(dr, RF), 'aire', 'reflejado', refl);
  } else {
    // incidente: de la abertura a la cara curva (aire), entra por la normal y llega al centro
    const a: [number, number] = punto(u, RA);
    const esp0 = lams.map((l) => ({ lambdaNm: l, p: w }));
    push(a, punto(u, RB), 'aire', 'incidente', esp0);
    const espEntra = esp0.map((e) => ({ lambdaNm: e.lambdaNm, p: e.p * Math.exp(-mA * (RA - RB)) * (1 - reflectanciaNormal(n1, nDe(e.lambdaNm))) }));
    push(punto(u, RB), [0, 0], 'vidrio', 'incidente', espEntra);
    const espO = atenua(espEntra, Math.exp(-mV * RB));
    const refl: { lambdaNm: number; p: number }[] = [];
    for (const e of espO) {
      const n2 = nDe(e.lambdaNm);
      const f = fresnel(n2, n1, t1);
      const R = reflectanciaPol(f, p.pol);
      refl.push({ lambdaNm: e.lambdaNm, p: e.p * R });
      if (f.thetaT == null) continue; // reflexión total interna para esta λ
      const d: [number, number] = [Math.sin(f.thetaT), Math.cos(f.thetaT)];
      push([0, 0], punto(d, RF), 'aire', 'refractado', [{ lambdaNm: e.lambdaNm, p: e.p * (1 - R) }]);
    }
    // reflejado DENTRO del bloque: sale por la cara curva a incidencia normal
    const dr: [number, number] = [Math.sin(t1), -Math.cos(t1)];
    push([0, 0], punto(dr, RB), 'vidrio', 'reflejado', refl);
    const reflSale = refl.map((e) => ({ lambdaNm: e.lambdaNm, p: e.p * Math.exp(-mV * RB) * (1 - reflectanciaNormal(nDe(e.lambdaNm), n1)) }));
    push(punto(dr, RB), punto(dr, RF), 'aire', 'salida', reflSale);
  }
  const lectura = lecturaBanco({ sentido, theta1, n1, nD: p.nD, V: p.V, laser: p.laser, pol: p.pol });
  return { haces, lectura };
}

/** Potencia de un haz a una distancia s de su extremo `a` (Beer–Lambert). */
export const potenciaEn = (h: Haz, s: number) => h.p * Math.exp(-h.mu * s);
export const longitudHaz = (h: Haz) => largo(h.a, h.b);

// ───────────────────────────── mediciones del alumno ─────────────────────────────

/**
 * Pendiente por mínimos cuadrados de una recta POR EL ORIGEN, y = m·x:
 * m = Σxy / Σx². Con x = sen θ(bloque), y = sen θ(aire) la pendiente es n₂/n₁.
 */
export function pendienteOrigen(puntos: { x: number; y: number }[]): number | null {
  let sxy = 0, sxx = 0;
  for (const { x, y } of puntos) { sxy += x * y; sxx += x * x; }
  return sxx > 1e-12 ? sxy / sxx : null;
}

/** Punto (sen θ bloque, sen θ aire) de una medición, según el sentido en que se tomó. */
export function puntoMedicion(sentido: Sentido, theta1Deg: number, thetaLeidoDeg: number): { x: number; y: number } {
  const sLaser = Math.sin(rad(theta1Deg)), sLeido = Math.sin(rad(thetaLeidoDeg));
  return sentido === 'aire-bloque' ? { x: sLeido, y: sLaser } : { x: sLaser, y: sLeido };
}

// ───────────────────────────── color de una longitud de onda ─────────────────────────────

/**
 * Funciones de igualación CIE 1931 (2°) con el ajuste analítico de varios lóbulos
 * de Wyman, Sloan y Shirley (2013). Devuelve XYZ relativos.
 */
export function cie1931(lambdaNm: number): [number, number, number] {
  const g = (x: number, mu: number, s1: number, s2: number) => {
    const t = (x - mu) / (x < mu ? s1 : s2);
    return Math.exp(-0.5 * t * t);
  };
  const l = lambdaNm;
  const X = 1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2);
  const Y = 0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1);
  const Z = 1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8);
  return [X, Y, Z];
}

/**
 * Color RGB LINEAL (sRGB primarios) de una λ, desaturado lo justo para caer en la
 * gama y normalizado a canal máximo 1. Es el color de PANTALLA del haz; la física
 * (índices, ángulos, potencias) no lo usa.
 */
export function colorLambda(lambdaNm: number): [number, number, number] {
  const [X, Y, Z] = cie1931(lambdaNm);
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const m = Math.min(r, g, b);
  if (m < 0) { r -= m; g -= m; b -= m; } // fuera de gama: se mezcla con blanco
  const M = Math.max(r, g, b, 1e-9);
  return [r / M, g / M, b / M];
}

/** Factores por canal para que la suma de las muestras de la luz blanca dé blanco (1,1,1). */
export const BALANCE_BLANCO: [number, number, number] = (() => {
  const s = [0, 0, 0];
  for (const l of ESPECTRO_BLANCO) { const c = colorLambda(l); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; }
  return [ESPECTRO_BLANCO.length / s[0], ESPECTRO_BLANCO.length / s[1], ESPECTRO_BLANCO.length / s[2]];
})();

/**
 * Color lineal × potencia de un haz: mezcla sus muestras espectrales (con el balance
 * de blanco si la fuente es blanca). Un haz monocromático conserva su tono.
 */
export function rgbHaz(h: Haz, blanca: boolean): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  for (const e of h.espectro) {
    const c = colorLambda(e.lambdaNm);
    const k = blanca ? BALANCE_BLANCO : [1, 1, 1];
    out[0] += c[0] * k[0] * e.p; out[1] += c[1] * k[1] * e.p; out[2] += c[2] * k[2] * e.p;
  }
  return out;
}
