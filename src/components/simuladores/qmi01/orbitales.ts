/**
 * qmi01/orbitales.ts — FÍSICA del modelo cuántico de la Construcción atómica.
 *
 * Módulo PURO: sin three ni React. Lo usan el Piloto (diagrama de cajas, lecturas),
 * la escena 3D (nubes, contornos, corte) y las pruebas jest, así que las tres cosas
 * salen de las MISMAS funciones.
 *
 * MODELO (se declara en pantalla, tal cual):
 *   · Cada electrón ocupa un orbital HIDROGENOIDE ψ_nlm de un solo electrón con una
 *     carga nuclear efectiva Z_eff dada por las REGLAS DE SLATER (1930) para la
 *     configuración actual. No es Hartree-Fock: no hay autoconsistencia ni
 *     correlación, y Slater da el MISMO Z_eff al 2s y al 2p (el orden 2s < 2p de
 *     energía viene de la penetración, que este modelo no contiene; el orden de
 *     llenado se toma del principio de Aufbau).
 *   · Unidades atómicas: distancias en radios de Bohr, a₀ = 52,917 721 pm.
 *   · Se trabaja en la variable REDUCIDA ρ = Z_eff·r/a₀. En ρ la forma de cada
 *     orbital no depende de Z_eff: Z_eff sólo la ESCALA (r = ρ·a₀/Z_eff). Por eso la
 *     nube se muestrea una vez y se contrae o se expande con un único factor, que es
 *     exactamente lo que pasa con un hidrogenoide al cambiar Z.
 *   · Orbitales REALES 2pₓ, 2p_y, 2p_z (combinaciones de m = ±1 y m = 0): son los
 *     que se dibujan en los libros y tienen fase real (+/−) por lóbulo.
 *
 * Fórmulas (r en a₀, ψ en a₀^(−3/2)):
 *   ψ₁ₛ  = √(Z³/π) · e^(−ρ)
 *   ψ₂ₛ  = √(Z³/32π) · (2 − ρ) · e^(−ρ/2)              nodo radial en ρ = 2
 *   ψ₂ₚₖ = √(Z³/32π) · Z·k · e^(−ρ/2)       (k = x, y, z) plano nodal k = 0
 *   P(r) = r²·R_nl(r)²,  ∫₀^∞ P dr = 1
 *   ⟨r⟩  = a₀·[3n² − l(l+1)] / (2·Z_eff)
 */

/** Radio de Bohr (CODATA 2018), en pm. */
export const A0_PM = 52.917721;
/** Constante del radio nuclear R = r₀·A^(1/3), en fm. */
export const R0_FM = 1.2;
/** 1 pm = 1000 fm. */
export const FM_POR_PM = 1000;

export type IdOrbital = '1s' | '2s' | '2px' | '2py' | '2pz';
export type Espin = 1 | -1;

export interface DefOrbital {
  id: IdOrbital;
  n: 1 | 2;
  l: 0 | 1;
  /** eje del orbital p (0 = x, 1 = y, 2 = z); null en los s */
  eje: 0 | 1 | 2 | null;
  /** nombre para el DOM (Unicode) */
  nombre: string;
  /** nombre en el mini-formato de las etiquetas 3D del kit (2p_x) */
  etiqueta: string;
  /** subcapa a la que pertenece (para el texto de configuración) */
  subcapa: '1s' | '2s' | '2p';
}

export const ORBITALES: readonly DefOrbital[] = [
  { id: '1s', n: 1, l: 0, eje: null, nombre: '1s', etiqueta: '1s', subcapa: '1s' },
  { id: '2s', n: 2, l: 0, eje: null, nombre: '2s', etiqueta: '2s', subcapa: '2s' },
  { id: '2px', n: 2, l: 1, eje: 0, nombre: '2pₓ', etiqueta: '2p_x', subcapa: '2p' },
  { id: '2py', n: 2, l: 1, eje: 1, nombre: '2p_y', etiqueta: '2p_y', subcapa: '2p' },
  { id: '2pz', n: 2, l: 1, eje: 2, nombre: '2p_z', etiqueta: '2p_z', subcapa: '2p' },
];
// (2p_y y 2p_z no tienen subíndice Unicode: el DOM los pinta con <sub>; ver nombreHtml)

export const DEF: Record<IdOrbital, DefOrbital> = Object.fromEntries(ORBITALES.map((o) => [o.id, o])) as Record<IdOrbital, DefOrbital>;

/** Capacidad del catálogo: hasta el neón (1s² 2s² 2p⁶). */
export const MAX_ELECTRONES = 10;

/**
 * ORDEN DE LLENADO — Aufbau (1s → 2s → 2p), Hund (los tres 2p se ocupan de uno en
 * uno con el espín paralelo ↑ antes de aparearse) y Pauli (dos electrones por
 * orbital, con espines opuestos). El electrón k entra en ORDEN_LLENADO[k].
 */
export const ORDEN_LLENADO: readonly { orbital: IdOrbital; espin: Espin }[] = [
  { orbital: '1s', espin: 1 }, { orbital: '1s', espin: -1 },
  { orbital: '2s', espin: 1 }, { orbital: '2s', espin: -1 },
  { orbital: '2px', espin: 1 }, { orbital: '2py', espin: 1 }, { orbital: '2pz', espin: 1 },
  { orbital: '2px', espin: -1 }, { orbital: '2py', espin: -1 }, { orbital: '2pz', espin: -1 },
];

export type Configuracion = Record<IdOrbital, Espin[]>;

const clampE = (e: number) => Math.max(0, Math.min(MAX_ELECTRONES, Math.round(Number(e) || 0)));

/**
 * Configuración del estado fundamental con `electrones` electrones. Vale igual para
 * átomos neutros y para iones de Z ≤ 10: un catión pierde primero el último que
 * entró (el de mayor energía: 2p antes que 2s, 2s antes que 1s) y un anión gana el
 * siguiente de la secuencia. Para estos elementos no hay anomalías (no hay 3d/4s).
 */
export function configurar(electrones: number): Configuracion {
  const c: Configuracion = { '1s': [], '2s': [], '2px': [], '2py': [], '2pz': [] };
  const e = clampE(electrones);
  for (let k = 0; k < e; k++) c[ORDEN_LLENADO[k].orbital].push(ORDEN_LLENADO[k].espin);
  return c;
}

/** Electrones desapareados (regla de Hund: máxima multiplicidad). */
export function desapareados(c: Configuracion): number {
  return ORBITALES.reduce((s, o) => s + (c[o.id].length === 1 ? 1 : 0), 0);
}

const SUP: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };

/** «1s² 2s² 2p²» (o «Vacío» sin electrones). */
export function textoConfiguracion(electrones: number): string {
  const c = configurar(electrones);
  const sub: Record<'1s' | '2s' | '2p', number> = { '1s': 0, '2s': 0, '2p': 0 };
  for (const o of ORBITALES) sub[o.subcapa] += c[o.id].length;
  const partes = (['1s', '2s', '2p'] as const).filter((k) => sub[k] > 0).map((k) => `${k}${SUP[sub[k]] ?? sub[k]}`);
  return partes.length ? partes.join(' ') : 'Vacío';
}

// ───────────────────────────── Slater ─────────────────────────────

/**
 * Z_eff de Slater para un electrón del orbital `id` con la configuración `c`.
 *   1s:      S = 0,30 · (otros electrones 1s)
 *   2s, 2p:  S = 0,35 · (otros electrones n = 2) + 0,85 · (electrones 1s)
 * Si el orbital está vacío, da la Z_eff que sentiría un electrón AÑADIDO a él.
 * Puede salir ≤ 0: el modelo ya no liga ese electrón (p. ej. H²⁻).
 */
export function zEfectiva(Z: number, c: Configuracion, id: IdOrbital): number {
  const n1 = c['1s'].length;
  const n2 = c['2s'].length + c['2px'].length + c['2py'].length + c['2pz'].length;
  const propio = c[id].length > 0 ? 1 : 0;
  const S = DEF[id].n === 1 ? 0.3 * (n1 - propio) : 0.35 * (n2 - propio) + 0.85 * n1;
  return Z - S;
}

// ─────────────────────── funciones de onda ───────────────────────

const SQRT2 = Math.SQRT2;
const SQRT6 = Math.sqrt(6);

/** Parte radial R_nl(r) [a₀^(−3/2)], r en a₀. */
export function radial(n: number, l: number, Z: number, r: number): number {
  const rho = Z * r;
  const z32 = Math.pow(Z, 1.5);
  if (n === 1) return 2 * z32 * Math.exp(-rho);
  if (l === 0) return (z32 / (2 * SQRT2)) * (2 - rho) * Math.exp(-rho / 2);
  return (z32 / (2 * SQRT6)) * rho * Math.exp(-rho / 2);
}

/** Densidad de probabilidad RADIAL P(r) = r²·R² [1/a₀]. ∫₀^∞ P dr = 1. */
export function densidadRadial(n: number, l: number, Z: number, r: number): number {
  const R = radial(n, l, Z, r);
  return r * r * R * R;
}

/** ⟨r⟩ hidrogenoide [a₀] = [3n² − l(l+1)] / (2Z). */
export function radioMedio(n: number, l: number, Z: number): number {
  return (3 * n * n - l * (l + 1)) / (2 * Z);
}

/** Radio más probable (máximo de P(r)) [a₀]: 1s 1/Z, 2s (3+√5)/Z, 2p 4/Z. */
export function radioMasProbable(id: IdOrbital, Z: number): number {
  if (id === '1s') return 1 / Z;
  if (id === '2s') return (3 + Math.sqrt(5)) / Z;
  return 4 / Z;
}

/** ψ en (x, y, z) [a₀] → [a₀^(−3/2)]. Real (orbitales p reales). */
export function psi(id: IdOrbital, Z: number, x: number, y: number, z: number): number {
  const r = Math.hypot(x, y, z);
  const rho = Z * r;
  if (id === '1s') return Math.sqrt((Z * Z * Z) / Math.PI) * Math.exp(-rho);
  const k = Math.sqrt((Z * Z * Z) / (32 * Math.PI)) * Math.exp(-rho / 2);
  if (id === '2s') return k * (2 - rho);
  const q = id === '2px' ? x : id === '2py' ? y : z;
  return k * Z * q;
}

// ──────────────── distribución radial en la variable ρ ────────────────

/** P(k+1, x) = γ(k+1, x)/k! = 1 − e^(−x)·Σ_{j=0..k} x^j/j!  (gamma regularizada, k entero). */
export function gammaReg(k: number, x: number): number {
  if (x <= 0) return 0;
  let t = 1, s = 1;
  for (let j = 1; j <= k; j++) { t *= x / j; s += t; }
  return 1 - Math.exp(-x) * s;
}

/** Densidad radial en ρ (∫₀^∞ = 1, independiente de Z). */
export function densidadRadialRho(id: IdOrbital, rho: number): number {
  if (id === '1s') return 4 * rho * rho * Math.exp(-2 * rho);
  if (id === '2s') return (rho * rho * (2 - rho) * (2 - rho) * Math.exp(-rho)) / 8;
  return (Math.pow(rho, 4) * Math.exp(-rho)) / 24;
}

/**
 * Función de distribución radial ACUMULADA en ρ (forma cerrada):
 *   1s: P(3, 2ρ)
 *   2s: (1/8)∫(4ρ² − 4ρ³ + ρ⁴)e^(−ρ) = P(3,ρ) − 3·P(4,ρ) + 3·P(5,ρ)
 *   2p: P(5, ρ)
 */
export function cdfRadial(id: IdOrbital, rho: number): number {
  if (rho <= 0) return 0;
  if (id === '1s') return gammaReg(2, 2 * rho);
  if (id === '2s') return gammaReg(2, rho) - 3 * gammaReg(3, rho) + 3 * gammaReg(4, rho);
  return gammaReg(4, rho);
}

const H_TABLA = 0.01, N_TABLA = 8000; // ρ ∈ [0, 80]
const tablas = new Map<string, Float64Array>();
function tablaCdf(id: IdOrbital): Float64Array {
  const clave = id === '1s' || id === '2s' ? id : '2p'; // los tres 2p comparten parte radial
  let t = tablas.get(clave);
  if (!t) {
    t = new Float64Array(N_TABLA + 1);
    for (let i = 0; i <= N_TABLA; i++) t[i] = cdfRadial(id, i * H_TABLA);
    tablas.set(clave, t);
  }
  return t;
}

/**
 * ρ tal que cdfRadial(id, ρ) = u. La CDF es monótona: búsqueda binaria en una tabla
 * de paso 0,01, interpolación lineal y Newton salvaguardado dentro del intervalo
 * (en el nodo del 2s la densidad es 0 y Newton se detiene: queda la interpolación).
 */
export function invertirCdf(id: IdOrbital, u: number): number {
  const t = tablaCdf(id);
  if (!(u > 0)) return 0;
  if (u >= t[N_TABLA]) return N_TABLA * H_TABLA;
  let lo = 0, hi = N_TABLA;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t[m] <= u) lo = m; else hi = m; }
  const a = lo * H_TABLA, b = hi * H_TABLA;
  let x = a + ((u - t[lo]) / Math.max(1e-300, t[hi] - t[lo])) * H_TABLA;
  for (let k = 0; k < 5; k++) {
    const d = densidadRadialRho(id, x);
    if (!(d > 1e-14)) break;
    const xn = x - (cdfRadial(id, x) - u) / d;
    if (!(xn > a && xn < b)) break;
    if (Math.abs(xn - x) < 1e-13) { x = xn; break; }
    x = xn;
  }
  return x;
}

// ───────────────────────────── muestreo ─────────────────────────────

/** PRNG reproducible (mulberry32). */
export function azarSemilla(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MuestraNube {
  /** posiciones en ρ (x, y, z intercalados) */
  pos: Float32Array;
  /** signo de ψ en cada punto (+1 / −1): la fase */
  signo: Float32Array;
  n: number;
}

/**
 * Muestras INDEPENDIENTES de |ψ|² en la variable ρ. Radio por inversión exacta de la
 * CDF radial; ángulo por inversión de la parte angular:
 *   s: dirección uniforme (u = cos θ uniforme en [−1, 1]);
 *   p: densidad (3/2)·u² en u ∈ [−1, 1] → u = ∛(2ξ − 1), φ uniforme, eje = el del orbital.
 * Como las muestras son i.i.d., los k primeros puntos son, a su vez, una muestra
 * válida: la escena dibuja ocupación × (puntos por electrón) y así la densidad de
 * puntos es la densidad ELECTRÓNICA (1 o 2 e⁻ en el orbital).
 */
export function muestrearOrbital(id: IdOrbital, n: number, semilla = 1): MuestraNube {
  const rnd = azarSemilla(semilla);
  const pos = new Float32Array(n * 3);
  const signo = new Float32Array(n);
  const def = DEF[id];
  for (let i = 0; i < n; i++) {
    const rho = invertirCdf(id, Math.min(1 - 1e-12, Math.max(1e-12, rnd())));
    const u = def.l === 0 ? 2 * rnd() - 1 : Math.cbrt(2 * rnd() - 1);
    const phi = 2 * Math.PI * rnd();
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const a = rho * s * Math.cos(phi), b = rho * s * Math.sin(phi), c = rho * u;
    let x = a, y = b, z = c;
    if (def.eje === 0) { x = c; y = a; z = b; }
    else if (def.eje === 1) { x = b; y = c; z = a; }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    signo[i] = def.l === 1 ? (u >= 0 ? 1 : -1) : id === '2s' ? (rho < 2 ? 1 : -1) : 1;
  }
  return { pos, signo, n };
}

// ─────────────────── superficie de isodensidad ───────────────────

/**
 * Densidad |ψ|² REDUCIDA (sin constantes) en ρ y u = cos θ respecto del eje:
 *   1s: e^(−2ρ)    2s: (2 − ρ)²·e^(−ρ)    2p: ρ²·e^(−ρ)·u²
 * El contorno {f = c} encierra la región de MAYOR densidad: es la superficie de
 * isodensidad que un libro llama «el orbital».
 */
export function densidadReducida(id: IdOrbital, rho: number, u = 1): number {
  if (id === '1s') return Math.exp(-2 * rho);
  if (id === '2s') return (2 - rho) * (2 - rho) * Math.exp(-rho);
  return rho * rho * Math.exp(-rho) * u * u;
}

/** Raíz de g(ρ) = c en [lo, hi] con g monótona en el intervalo (bisección). */
function raiz(g: (r: number) => number, c: number, lo: number, hi: number): number {
  const creciente = g(hi) > g(lo);
  for (let i = 0; i < 70; i++) {
    const m = 0.5 * (lo + hi);
    if ((g(m) < c) === creciente) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}

const G2P = (r: number) => r * r * Math.exp(-r);       // máx. 4e⁻² en ρ = 2
const G2S = (r: number) => (2 - r) * (2 - r) * Math.exp(-r); // 4 en 0; 0 en 2; máx. local 4e⁻⁴ en 4
const G2P_MAX = 4 * Math.exp(-2);
const G2S_MAX_EXT = 4 * Math.exp(-4);

/** Probabilidad dentro de {f > c} para el 2s y los radios que la delimitan. */
function region2s(c: number): { p: number; radios: number[] } {
  const a = raiz(G2S, c, 0, 2);
  if (c >= G2S_MAX_EXT) return { p: cdfRadial('2s', a), radios: [a] };
  const b = raiz(G2S, c, 2, 4), d = raiz(G2S, c, 4, 80);
  return { p: cdfRadial('2s', a) + cdfRadial('2s', d) - cdfRadial('2s', b), radios: [a, b, d] };
}

/** Raíces ρa < 2 < ρb de ρ²e^(−ρ) = k (k < 4e⁻²). */
function raices2p(k: number): [number, number] {
  return [raiz(G2P, k, 0, 2), raiz(G2P, k, 2, 80)];
}

/** Probabilidad dentro de {ρ²e^(−ρ)u² > c} para un 2p (los dos lóbulos). */
function prob2p(c: number, pasos = 1200): number {
  const u0 = Math.sqrt(c / G2P_MAX);
  if (u0 >= 1) return 0;
  // ∫_{u0}^{1} (3/2)u²·[F(ρb) − F(ρa)] du ×2 lóbulos; cambio u = u0 + (1−u0)·s² para
  // concentrar puntos cerca de u0, donde las raíces se juntan como una raíz cuadrada.
  let s = 0;
  const f = (t: number) => {
    const u = u0 + (1 - u0) * t * t;
    const [ra, rb] = raices2p(c / (u * u));
    return 1.5 * u * u * (cdfRadial('2pz', rb) - cdfRadial('2pz', ra)) * 2 * (1 - u0) * t;
  };
  // Simpson en t ∈ [0, 1]
  const h = 1 / pasos;
  for (let i = 0; i <= pasos; i++) {
    const w = i === 0 || i === pasos ? 1 : i % 2 ? 4 : 2;
    s += w * f(i * h);
  }
  return 2 * (s * h) / 3;
}

export interface Isodensidad {
  id: IdOrbital;
  /** umbral c de la densidad reducida (densidadReducida = c sobre la superficie) */
  umbral: number;
  /** probabilidad encerrada (≈ fracción pedida) */
  contenido: number;
  /** s: radios de las esferas que forman el contorno, en ρ (1s: [a]; 2s: [a, b, d]) */
  radios: number[];
  /**
   * p: perfil (R, h) en ρ del lóbulo POSITIVO alrededor de su eje (+h), del polo
   * interior al polo exterior pasando por el borde (sentido para el torno: normales
   * hacia fuera). El lóbulo negativo es su reflejo.
   */
  perfil: [number, number][];
}

const cacheIso = new Map<string, Isodensidad>();

/** Superficie de isodensidad que encierra la fracción `fraccion` de la probabilidad. */
export function isodensidad(id: IdOrbital, fraccion = 0.9, segmentosPerfil = 64): Isodensidad {
  const clave = `${id}|${fraccion}|${segmentosPerfil}`;
  const hit = cacheIso.get(clave);
  if (hit) return hit;
  let res: Isodensidad;
  if (id === '1s') {
    const a = invertirCdf('1s', fraccion);
    res = { id, umbral: Math.exp(-2 * a), contenido: cdfRadial('1s', a), radios: [a], perfil: [] };
  } else if (id === '2s') {
    // p(c) decrece con c; la solución tiene c < 4e⁻⁴ (el lóbulo interior sólo encierra 5,3 %)
    let lo = 1e-9, hi = G2S_MAX_EXT * (1 - 1e-9);
    for (let i = 0; i < 80; i++) {
      const m = Math.sqrt(lo * hi); // bisección geométrica: c recorre décadas
      if (region2s(m).p > fraccion) lo = m; else hi = m;
    }
    const c = Math.sqrt(lo * hi);
    const r = region2s(c);
    res = { id, umbral: c, contenido: r.p, radios: r.radios, perfil: [] };
  } else {
    let lo = 1e-9, hi = G2P_MAX * (1 - 1e-9);
    for (let i = 0; i < 60; i++) {
      const m = Math.sqrt(lo * hi);
      if (prob2p(m, 400) > fraccion) lo = m; else hi = m;
    }
    const c = Math.sqrt(lo * hi);
    const u0 = Math.sqrt(c / G2P_MAX);
    const th0 = Math.acos(u0);
    const interior: [number, number][] = [];
    const exterior: [number, number][] = [];
    for (let i = 0; i <= segmentosPerfil; i++) {
      // θ de 0 (eje) a θ0 (borde), con más puntos cerca del borde
      const th = th0 * Math.sin((i / segmentosPerfil) * (Math.PI / 2));
      const u = Math.cos(th), sn = Math.sin(th);
      const k = Math.min(G2P_MAX * (1 - 1e-12), c / (u * u));
      const [ra, rb] = raices2p(k);
      interior.push([ra * sn, ra * u]);
      exterior.push([rb * sn, rb * u]);
    }
    // polo interior → borde (por la raíz interior) → polo exterior (por la exterior)
    const perfil = [...interior, ...exterior.reverse().slice(1)];
    res = { id, umbral: c, contenido: prob2p(c), radios: [], perfil };
  }
  cacheIso.set(clave, res);
  return res;
}

/** ¿El punto (en ρ, coordenadas del átomo) está dentro de la isodensidad del orbital? */
export function dentroIsodensidad(iso: Isodensidad, x: number, y: number, z: number): boolean {
  const def = DEF[iso.id];
  const rho = Math.hypot(x, y, z);
  if (def.l === 0) return densidadReducida(iso.id, rho) > iso.umbral;
  const q = def.eje === 0 ? x : def.eje === 1 ? y : z;
  const u = rho > 0 ? q / rho : 0;
  return densidadReducida(iso.id, rho, u) > iso.umbral;
}

// ───────────────────────────── núcleo ─────────────────────────────

/** Entero con separador de millares de espacio fino (U+202F): «2 800». */
export function miles(v: number): string {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}

/** Radio nuclear R = r₀·A^(1/3) [fm]. */
export function radioNuclearFm(A: number): number {
  return A > 0 ? R0_FM * Math.cbrt(A) : 0;
}

// ─────────────────────────── estado del átomo ───────────────────────────

export interface EstadoOrbital {
  def: DefOrbital;
  espines: Espin[];
  ocupacion: number;
  /** Z_eff de Slater (aunque esté vacío: la de un electrón añadido) */
  zEff: number;
  /** ocupado y con Z_eff > 0 */
  ligado: boolean;
  /** ⟨r⟩ en a₀ (null si no ligado o vacío) */
  rMedio: number | null;
}

export interface EstadoAtomo {
  Z: number;
  electrones: number;
  carga: number;
  configuracion: Configuracion;
  texto: string;
  orbitales: EstadoOrbital[];
  desapareados: number;
  /** electrones que el modelo no liga (Z_eff ≤ 0) */
  noLigados: number;
  /** ⟨r⟩ del orbital ocupado más externo [pm] (null si no hay ninguno ligado) */
  radioPm: number | null;
}

/** Todo lo que pinta la escena y lee el panel, a partir de Z (protones) y electrones. */
export function estadoAtomo(protones: number, electrones: number): EstadoAtomo {
  const Z = Math.max(0, Math.round(Number(protones) || 0));
  const e = clampE(electrones);
  const c = configurar(e);
  let noLigados = 0;
  let rMax: number | null = null;
  const orbitales = ORBITALES.map((def) => {
    const zEff = zEfectiva(Z, c, def.id);
    const ocupacion = c[def.id].length;
    const ligado = ocupacion > 0 && zEff > 0;
    if (ocupacion > 0 && !ligado) noLigados += ocupacion;
    const rMedio = ligado ? radioMedio(def.n, def.l, zEff) : null;
    if (rMedio !== null && (rMax === null || rMedio > rMax)) rMax = rMedio;
    return { def, espines: c[def.id], ocupacion, zEff, ligado, rMedio };
  });
  return {
    Z, electrones: e, carga: Z - e, configuracion: c, texto: textoConfiguracion(e), orbitales,
    desapareados: desapareados(c), noLigados, radioPm: rMax === null ? null : rMax * A0_PM,
  };
}

/** Densidad radial TOTAL Σ ocupación·P_nl(r) [e⁻/a₀] con las Z_eff dadas. */
export function densidadRadialTotal(orbs: { def: DefOrbital; ocupacion: number; zEff: number }[], r: number): number {
  let s = 0;
  for (const o of orbs) if (o.ocupacion > 0 && o.zEff > 0) s += o.ocupacion * densidadRadial(o.def.n, o.def.l, o.zEff, r);
  return s;
}

// ───────────────── energía de Slater y fotones (modo «Átomo») ─────────────────
//
// Energía de UN electrón de Slater: ε = −Ry·Z_eff²/n². La energía TOTAL del átomo
// en este modelo es E = Σ ocupación·ε. Al capturar un electrón, el átomo pasa de
// E(Z, e−1) a E(Z, e) y la diferencia sale como un fotón:
//     E_γ = E(Z, e−1) − E(Z, e)        λ = h·c / E_γ
// Es la energía de ionización de Slater del electrón que entra. No es 13,6·Z_eff²/n²
// del electrón nuevo a secas: ese término ignora que el recién llegado apantalla a
// los que ya estaban (en el He daría 39 eV frente a los 24,6 eV medidos; la
// diferencia de energías totales da 24,2 eV). En el H las dos coinciden: 13,6 eV,
// 91,1 nm. Frente al NIST el error va del 0,1 % (H) al 26 % (Ne).

/** Energía de Rydberg (CODATA 2018), eV. */
export const RYDBERG_EV = 13.605693;
/** h·c, eV·nm. */
export const HC_EV_NM = 1239.84198;

/** ε de Slater de un electrón (eV); 0 si Z_eff ≤ 0 (el modelo no lo liga). */
export function energiaOrbital(n: number, zEff: number): number {
  return zEff > 0 ? (-RYDBERG_EV * zEff * zEff) / (n * n) : 0;
}

/** Energía total de Slater del átomo o ion (Z, e), en eV (≤ 0). */
export function energiaSlater(Z: number, electrones: number): number {
  if (!(Z > 0)) return 0;
  const c = configurar(electrones);
  let E = 0;
  for (const o of ORBITALES) {
    const occ = c[o.id].length;
    if (occ > 0) E += occ * energiaOrbital(o.n, zEfectiva(Z, c, o.id));
  }
  return E;
}

/**
 * Energía (eV) del fotón que sale al capturar el electrón número `electrones`
 * (el átomo pasa de e − 1 a e electrones). ≤ 0: el modelo no libera energía (no
 * hay fotón: electrón no ligado o anión que Slater no explica).
 */
export function energiaCaptura(Z: number, electrones: number): number {
  const e = Math.round(electrones);
  if (e < 1 || e > MAX_ELECTRONES) return 0;
  return energiaSlater(Z, e - 1) - energiaSlater(Z, e);
}

/** λ = h·c/E (nm). */
export function longitudOnda(energiaEv: number): number {
  return energiaEv > 0 ? HC_EV_NM / energiaEv : Infinity;
}

export type Banda = 'UV' | 'visible' | 'IR';
/** Límites convencionales del visible: 380–750 nm. */
export const VISIBLE_NM: readonly [number, number] = [380, 750];

export function bandaEspectral(lambdaNm: number): Banda {
  if (lambdaNm < VISIBLE_NM[0]) return 'UV';
  if (lambdaNm > VISIBLE_NM[1]) return 'IR';
  return 'visible';
}

/** Colores CONVENCIONALES para lo invisible (el ojo no ve UV ni IR). */
export const COLOR_UV = '#9b6bff';
export const COLOR_IR = '#b3361e';

/**
 * Color (hex sRGB) de una longitud de onda. Visible: aproximación de Bruton (1996)
 * con caída de intensidad en los bordes; UV → violeta convencional; IR → rojo
 * oscuro convencional.
 */
export function colorLongitudOnda(lambdaNm: number): string {
  const b = bandaEspectral(lambdaNm);
  if (b === 'UV') return COLOR_UV;
  if (b === 'IR') return COLOR_IR;
  const w = lambdaNm;
  let r = 0, g = 0, bl = 0;
  if (w < 440) { r = -(w - 440) / 60; bl = 1; }
  else if (w < 490) { g = (w - 440) / 50; bl = 1; }
  else if (w < 510) { g = 1; bl = -(w - 510) / 20; }
  else if (w < 580) { r = (w - 510) / 70; g = 1; }
  else if (w < 645) { r = 1; g = -(w - 645) / 65; }
  else { r = 1; }
  const f = w < 420 ? 0.3 + (0.7 * (w - 380)) / 40 : w > 700 ? 0.3 + (0.7 * (750 - w)) / 50 : 1;
  const h = (v: number) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v * f)), 0.8)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(bl)}`;
}

export interface Foton {
  energiaEv: number;
  lambdaNm: number;
  banda: Banda;
  color: string;
}

/** Fotón de captura del electrón número `electrones` en el átomo de Z protones (null si no hay). */
export function fotonCaptura(Z: number, electrones: number): Foton | null {
  const E = energiaCaptura(Z, electrones);
  if (!(E > 1e-9)) return null;
  const l = longitudOnda(E);
  return { energiaEv: E, lambdaNm: l, banda: bandaEspectral(l), color: colorLongitudOnda(l) };
}

// ───────────────── tamaños ESQUEMÁTICOS de las capas (modo «Átomo») ─────────────────
//
// El radio de cada capa es el de MÁXIMA densidad radial de un orbital de Slater,
// r = n²/Z_eff (a₀): K → 1/Z_eff, L → 4/Z_eff. Reproduce los radios atómicos
// calculados (Clementi 1967): H 53, He 31, Li 163 (167), C 65 (67), Ne 36 (38) pm.
// En la capa L vale igual para 2s y 2p (los orbitales de Slater de una misma n
// comparten la parte radial), así que un catión siempre sale menor que el neutro.
// Como del Ne al Li hay un factor 4,5, se COMPRIME con una potencia 1/4 (y un tope
// suave) para que todo quepa en pantalla: el orden se conserva (catión < neutro <
// anión, Li el mayor del periodo) pero las proporciones no — se rotula «esquema».

export const ESQUEMA = {
  /** radio en escena del caso de referencia: la capa L del carbono */
  rRef: 3.0,
  /** su radio de Slater (n = 2, Z_eff = 3,25), a₀ */
  rRefA0: 4 / 3.25,
  gamma: 0.25,
  /** a partir de aquí el radio se satura suavemente (tanh) */
  rSuave: 3.5,
  ancho: 0.6,
} as const;

/** Radio de máxima densidad de un orbital de Slater de número cuántico n: n²/Z_eff (a₀). */
export function radioSlater(n: number, zEff: number): number {
  return (n * n) / zEff;
}

/** Radio en escena para un radio rA0 (a₀). Monótono creciente. */
export function radioEsquematico(rA0: number): number {
  const R = ESQUEMA.rRef * Math.pow(Math.max(1e-6, rA0) / ESQUEMA.rRefA0, ESQUEMA.gamma);
  return R <= ESQUEMA.rSuave ? R : ESQUEMA.rSuave + ESQUEMA.ancho * Math.tanh((R - ESQUEMA.rSuave) / ESQUEMA.ancho);
}

export interface CapaEsquema {
  /** electrones en la capa */
  ocupacion: number;
  /** capacidad (2 u 8) */
  capacidad: number;
  /** radio esquemático en escena; null si Z_eff ≤ 0 (el modelo no ligaría ahí un electrón) */
  radio: number | null;
  /** Z_eff de la capa (la de un electrón añadido si está vacía) */
  zEff: number;
}

/** Capas K y L del esquema para Z protones y e electrones, y el radio exterior ocupado. */
export function capasEsquema(Z: number, electrones: number): { K: CapaEsquema; L: CapaEsquema; exterior: number | null } {
  const c = configurar(electrones);
  const ocK = c['1s'].length;
  const ocL = c['2s'].length + c['2px'].length + c['2py'].length + c['2pz'].length;
  const z1 = zEfectiva(Z, c, '1s');
  // Slater da la misma Z_eff a 2s y 2p; con la capa vacía, la de un electrón añadido
  const z2 = zEfectiva(Z, c, '2s');
  const rK = z1 > 0 ? radioEsquematico(radioSlater(1, z1)) : null;
  const rL = z2 > 0 ? radioEsquematico(radioSlater(2, z2)) : null;
  const ligK = ocK > 0 && rK !== null, ligL = ocL > 0 && rL !== null;
  return {
    K: { ocupacion: ocK, capacidad: 2, radio: rK, zEff: z1 },
    L: { ocupacion: ocL, capacidad: 8, radio: rL, zEff: z2 },
    exterior: ligL ? rL : ligK ? rK : null,
  };
}
