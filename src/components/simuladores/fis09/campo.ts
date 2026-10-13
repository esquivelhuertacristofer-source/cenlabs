/**
 * fis09/campo.ts — física del banco de Coulomb (módulo PURO: sin three ni React).
 *
 * Todo lo que la escena dibuja sale de aquí y lo prueba `src/__tests__/fis09-campo.test.ts`:
 *
 *  · Fuerza de Coulomb y superposición:   F⃗ᵢ = Σⱼ k qᵢ qⱼ (r⃗ᵢ − r⃗ⱼ)/|r⃗ᵢ − r⃗ⱼ|³
 *  · Campo y potencial:                   E⃗(P) = Σ k qᵢ (P − r⃗ᵢ)/|P − r⃗ᵢ|³,   V(P) = Σ k qᵢ/|P − r⃗ᵢ|,   E⃗ = −∇V
 *  · Gauss (comprobación numérica):       ∮ E⃗·dA⃗ = q_enc/ε₀
 *  · Líneas de campo: integración RK4 de dP/dℓ = ±E⃗/|E⃗| (ℓ = longitud de arco).
 *  · Equipotenciales: contornos V = V₀ (marching squares + proyección de Newton sobre V = V₀).
 *
 * GEOMETRÍA. Las dos cargas están sobre el eje del banco: s (cm) es la coordenada a lo
 * largo del eje y ρ (cm) la distancia al eje. El campo de cargas sobre un eje tiene
 * simetría de revolución: cada línea de campo vive en un semiplano meridiano (φ fijo)
 * y cada equipotencial es una superficie de revolución. Por eso se integra en 2-D (s, ρ)
 * —exacto, no una aproximación— y la escena gira cada línea a su φ y tornea cada contorno.
 *
 * FUNCIÓN DE CORRIENTE (Stokes). Ψ(s, ρ) = Σ qᵢ cos θᵢ, con θᵢ el ángulo polar del punto
 * visto desde la carga i (medido desde +s), es CONSTANTE a lo largo de cada línea de
 * campo (E⃗ = ∇Ψ × φ̂ / ρ salvo constantes: E⃗·∇Ψ = 0). De ahí sale, sin integrar, a qué
 * carga llega una línea que nace con un ángulo dado: lo usa el recuento de Gauss del dock
 * y las pruebas lo cruzan con la integración RK4.
 *
 * SIEMBRA (Gauss). De cada carga salen `porMicroC·|q|` líneas, repartidas UNIFORMES en
 * ángulo sólido (red de Fibonacci: cos α en pasos iguales, φ en pasos del ángulo áureo).
 * Como el flujo por un casquete es ∝ q(1 − cos α), la red de Fibonacci da a cada línea el
 * mismo flujo q/N: el número de líneas que cruzan cualquier superficie cerrada es
 * ∝ q_enc (Gauss) y su densidad es ∝ |E|.
 *
 * UNIDADES REDUCIDAS para la forma de las líneas (k = 1, q en μC, longitudes en cm):
 * E* = Σ q (P − rᵢ)/|P − rᵢ|³ [μC/cm²], V* = Σ q/|P − rᵢ| [μC/cm]. Los factores a SI están
 * abajo (E_SI_POR_REDUCIDO, V_SI_POR_REDUCIDO).
 */
import { K_COULOMB } from '@/domain/fisica';

// ───────────────────────────── constantes ─────────────────────────────

/** ε₀ = 1/(4πk) en C²/(N·m²). */
export const EPSILON_0 = 1 / (4 * Math.PI * K_COULOMB);
/** Radio de las esferas del banco (cm): Ø 1,8 cm. */
export const R_ESFERA_CM = 0.9;
/** Líneas de campo por microcoulomb (las mismas en calidad alta y media: es física, no detalle). */
export const LINEAS_POR_MICROC = 16;
/** N/C por cada μC/cm² reducido. */
export const E_SI_POR_REDUCIDO = (K_COULOMB * 1e-6) / 1e-4;
/** V por cada μC/cm reducido. */
export const V_SI_POR_REDUCIDO = (K_COULOMB * 1e-6) / 1e-2;
/** Campo de ruptura del aire seco a 1 atm (V/m), para la nota de fidelidad. */
export const E_RUPTURA_AIRE = 3e6;

/** Carga máxima (C) que admite una esfera aislada de radio R (m) en aire antes del efecto corona. */
export function cargaMaximaEnAire(radio_m: number): number {
  return (E_RUPTURA_AIRE * radio_m * radio_m) / K_COULOMB;
}

// ───────────────────────────── cargas en 3-D (superposición, Gauss) ─────────────────────────────

export type V3 = [number, number, number];
/** Carga puntual en el espacio: q en μC y posición en cm. */
export interface CargaPuntual { q: number; p: V3 }

/** Campo eléctrico (N/C) en P (cm) por superposición de las cargas. */
export function campoSI(cargas: readonly CargaPuntual[], P: V3): V3 {
  let ex = 0, ey = 0, ez = 0;
  for (const c of cargas) {
    const dx = (P[0] - c.p[0]) / 100, dy = (P[1] - c.p[1]) / 100, dz = (P[2] - c.p[2]) / 100;
    const d2 = dx * dx + dy * dy + dz * dz;
    const f = (K_COULOMB * c.q * 1e-6) / (d2 * Math.sqrt(d2));
    ex += f * dx; ey += f * dy; ez += f * dz;
  }
  return [ex, ey, ez];
}

/** Potencial eléctrico (V) en P (cm) respecto del infinito. */
export function potencialSI(cargas: readonly CargaPuntual[], P: V3): number {
  let v = 0;
  for (const c of cargas) {
    const d = Math.hypot(P[0] - c.p[0], P[1] - c.p[1], P[2] - c.p[2]) / 100;
    v += (K_COULOMB * c.q * 1e-6) / d;
  }
  return v;
}

/** Fuerza (N) sobre la carga i: suma de las fuerzas de Coulomb de todas las demás. */
export function fuerzaSobre(cargas: readonly CargaPuntual[], i: number): V3 {
  const yo = cargas[i];
  const otras = cargas.filter((_, j) => j !== i);
  const E = campoSI(otras, yo.p);
  const q = yo.q * 1e-6;
  return [q * E[0], q * E[1], q * E[2]];
}

/**
 * Flujo de E⃗ (N·m²/C) a través de una esfera de centro `centro` y radio `radio` (cm),
 * integrado numéricamente: celdas de igual área (cos θ y φ en pasos iguales) con un
 * punto de Gauss–Legendre de 2 por eje y celda. Gauss dice: q_enc/ε₀.
 */
export function flujoEsfera(cargas: readonly CargaPuntual[], centro: V3, radio: number, n = 160): number {
  const R = radio / 100;
  const g = 1 / Math.sqrt(3) / 2; // nodos de Gauss–Legendre de 2 puntos en [0, 1]: 0,5 ± g
  const du = 2 / n, dphi = (2 * Math.PI) / n;
  let suma = 0;
  for (let i = 0; i < n; i++) {
    for (const a of [0.5 - g, 0.5 + g]) {
      const u = -1 + (i + a) * du; // cos θ
      const st = Math.sqrt(Math.max(0, 1 - u * u));
      for (let j = 0; j < n; j++) {
        for (const b of [0.5 - g, 0.5 + g]) {
          const phi = (j + b) * dphi;
          const nx = st * Math.cos(phi), ny = st * Math.sin(phi), nz = u;
          const E = campoSI(cargas, [centro[0] + radio * nx, centro[1] + radio * ny, centro[2] + radio * nz]);
          suma += E[0] * nx + E[1] * ny + E[2] * nz;
        }
      }
    }
  }
  // dA = R² d(cos θ) dφ; cada celda tiene 4 nodos de peso 1/4
  return (suma / 4) * R * R * du * dphi;
}

// ───────────────────────────── cargas sobre el eje del banco ─────────────────────────────

/** Carga sobre el eje: q en μC, s en cm. */
export interface Carga { q: number; s: number }

/** Las dos cargas del banco: q₁ fija en el 0 de la regla y q₂ a r cm. */
export function cargasBanco(q1: number, q2: number, r: number): Carga[] {
  return [{ q: q1, s: 0 }, { q: q2, s: r }];
}

/** Campo reducido (E_s, E_ρ) en (s, ρ). Escribe en `out` (sin asignar memoria). */
export function campoEje(c: readonly Carga[], s: number, rho: number, out: Float64Array | number[]): void {
  let es = 0, er = 0;
  for (let i = 0; i < c.length; i++) {
    const ds = s - c[i].s;
    const d2 = ds * ds + rho * rho;
    const f = c[i].q / (d2 * Math.sqrt(d2));
    es += f * ds; er += f * rho;
  }
  out[0] = es; out[1] = er;
}

/** Potencial reducido V* = Σ q/d en (s, ρ). */
export function potencialEje(c: readonly Carga[], s: number, rho: number): number {
  let v = 0;
  for (let i = 0; i < c.length; i++) v += c[i].q / Math.sqrt((s - c[i].s) ** 2 + rho * rho);
  return v;
}

/** Función de corriente Ψ = Σ qᵢ cos θᵢ: constante a lo largo de cada línea de campo. */
export function corrienteEje(c: readonly Carga[], s: number, rho: number): number {
  let psi = 0;
  for (let i = 0; i < c.length; i++) {
    const ds = s - c[i].s;
    psi += (c[i].q * ds) / Math.sqrt(ds * ds + rho * rho);
  }
  return psi;
}

/** Fuerza axial (N) sobre la carga i del eje; positiva = hacia +s. */
export function fuerzaAxial(c: readonly Carga[], i: number): number {
  let f = 0;
  for (let j = 0; j < c.length; j++) {
    if (j === i) continue;
    const d = (c[i].s - c[j].s) / 100;
    f += (K_COULOMB * c[i].q * 1e-6 * c[j].q * 1e-6 * Math.sign(d)) / (d * d);
  }
  return f;
}

// ───────────────────────────── siembra y destino analítico ─────────────────────────────

const AUREO = Math.PI * (3 - Math.sqrt(5)); // ángulo áureo (rad)

export interface Semilla { cosA: number; phi: number }

/**
 * N direcciones uniformes en ángulo sólido (red de Fibonacci). La primera apunta hacia
 * `haciaS` (+1 = hacia +s) y se alejan en orden: cos α = h·(1 − (2j+1)/N).
 */
export function semillasFibonacci(N: number, haciaS: 1 | -1, fase = 0): Semilla[] {
  const out: Semilla[] = [];
  for (let j = 0; j < N; j++) out.push({ cosA: haciaS * (1 - (2 * j + 1) / N), phi: fase + j * AUREO });
  return out;
}

/**
 * Destino analítico (por Ψ) de la línea que nace en la carga `i` con ángulo cos α (desde +s)
 * en un banco de DOS cargas: índice de la carga a la que llega, o −1 si escapa al infinito.
 * Al nacer junto a qᵢ: Ψ = qᵢ cos α + qⱼ·σ, con σ = signo(sᵢ − sⱼ). Al llegar a qⱼ con
 * ángulo β: Ψ = qᵢ·σ' + qⱼ cos β, con σ' = −σ. Llega si |cos β| ≤ 1 y las cargas tienen signo opuesto.
 */
export function destinoAnalitico(c: readonly Carga[], i: number, cosA: number): number {
  if (c.length !== 2) return -1;
  const j = 1 - i;
  if (c[i].q * c[j].q >= 0) return -1;
  const sig = Math.sign(c[i].s - c[j].s) || 1;
  const psi = c[i].q * cosA + c[j].q * sig;
  const cosB = (psi - c[i].q * -sig) / c[j].q;
  return cosB >= -1 - 1e-12 && cosB <= 1 + 1e-12 ? j : -1;
}

/** Dirección asintótica (cos γ desde +s) de una línea que escapa al infinito. */
export function cosAsintotico(c: readonly Carga[], i: number, cosA: number): number {
  const qt = c.reduce((a, b) => a + b.q, 0);
  let psi = c[i].q * cosA;
  for (let j = 0; j < c.length; j++) if (j !== i) psi += c[j].q * (Math.sign(c[i].s - c[j].s) || 1);
  return psi / qt;
}

export interface ResumenGauss {
  /** líneas que nacen o mueren en cada carga (∝ |q|) */
  porCarga: number[];
  /** líneas que van de la carga positiva a la negativa */
  unen: number;
  /** líneas que salen al infinito (o vienen de él) */
  infinito: number;
}

/** Recuento EXACTO de líneas del banco de dos cargas con la siembra de `lineasDeCampo`. */
export function resumenGauss(q1: number, q2: number, porMicroC = LINEAS_POR_MICROC): ResumenGauss {
  const c = cargasBanco(q1, q2, 10);
  const n = c.map((x) => Math.round(porMicroC * Math.abs(x.q)));
  let unen = 0;
  let infinito = 0;
  // las líneas se siembran en las fuentes (q > 0) hacia delante; en los sumideros (q < 0) hacia
  // atrás y sólo se conservan las que vienen del infinito (las demás repetirían un tubo de flujo)
  for (let i = 0; i < 2; i++) {
    const hacia = (Math.sign(c[1 - i].s - c[i].s) || 1) as 1 | -1;
    for (const sem of semillasFibonacci(n[i], hacia)) {
      const d = destinoAnalitico(c, i, sem.cosA);
      if (c[i].q > 0) { if (d >= 0) unen++; else infinito++; }
      else if (d < 0) infinito++;
    }
  }
  const porCarga = [0, 1].map((i) => {
    let k = 0;
    const hacia = (Math.sign(c[1 - i].s - c[i].s) || 1) as 1 | -1;
    for (const sem of semillasFibonacci(n[i], hacia)) {
      const d = destinoAnalitico(c, i, sem.cosA);
      if (c[i].q > 0 || d < 0) k++;
    }
    // las que llegan desde la otra carga
    if (c[i].q < 0) {
      const j = 1 - i;
      const hj = (Math.sign(c[i].s - c[j].s) || 1) as 1 | -1;
      for (const sem of semillasFibonacci(n[j], hj)) if (c[j].q > 0 && destinoAnalitico(c, j, sem.cosA) === i) k++;
    }
    return k;
  });
  return { porCarga, unen, infinito };
}

// ───────────────────────────── integración RK4 de una línea ─────────────────────────────

export interface OpcionesLinea {
  /** centro (s) y radio (cm) del dominio: la línea se corta al salir */
  centro: number;
  rDominio: number;
  /** radio de captura (cm) alrededor de una carga de signo contrario */
  rCaptura: number;
  /** pasos de arco: h = clamp(kPaso·d_min, hMin, hMax) (cm) */
  kPaso?: number;
  hMin: number;
  hMax: number;
  maxPasos?: number;
}

export type FinLinea = { tipo: 'carga'; indice: number } | { tipo: 'fuera' } | { tipo: 'nulo' } | { tipo: 'pasos' };

export interface Trazo {
  s: number[];
  rho: number[];
  fin: FinLinea;
}

/**
 * Integra con RK4 la línea que pasa por (s0, ρ0) siguiendo σ·E⃗/|E⃗| (σ = +1 hacia
 * donde apunta E, −1 al revés). Paso adaptativo: proporcional a la distancia a la carga
 * más cercana (resuelve la curvatura cerca de las cargas sin gastar pasos lejos).
 */
export function integrarLinea(c: readonly Carga[], s0: number, rho0: number, sigma: 1 | -1, o: OpcionesLinea): Trazo {
  const kPaso = o.kPaso ?? 0.06;
  const maxPasos = o.maxPasos ?? 4000;
  const S: number[] = [s0], P: number[] = [rho0];
  const e = [0, 0];
  let s = s0, rho = rho0;
  const dir = (ss: number, rr: number, out: number[]) => {
    campoEje(c, ss, Math.abs(rr), e);
    const m = Math.hypot(e[0], e[1]);
    if (!(m > 1e-14)) { out[0] = 0; out[1] = 0; return 0; }
    out[0] = (sigma * e[0]) / m; out[1] = (sigma * e[1] * Math.sign(rr || 1)) / m;
    return m;
  };
  const k1 = [0, 0], k2 = [0, 0], k3 = [0, 0], k4 = [0, 0];
  for (let paso = 0; paso < maxPasos; paso++) {
    // distancia a la carga más cercana y captura por una carga de signo contrario a σ
    let dMin = Infinity;
    for (let i = 0; i < c.length; i++) {
      const d = Math.hypot(s - c[i].s, rho);
      if (d < dMin) dMin = d;
      if (paso > 0 && d < o.rCaptura && Math.sign(c[i].q) === -sigma) {
        S.push(c[i].s); P.push(0);
        return { s: S, rho: P, fin: { tipo: 'carga', indice: i } };
      }
    }
    if (Math.hypot(s - o.centro, rho) > o.rDominio) return { s: S, rho: P, fin: { tipo: 'fuera' } };
    const h = Math.min(o.hMax, Math.max(o.hMin, kPaso * dMin));
    if (dir(s, rho, k1) === 0) return { s: S, rho: P, fin: { tipo: 'nulo' } };
    dir(s + 0.5 * h * k1[0], rho + 0.5 * h * k1[1], k2);
    dir(s + 0.5 * h * k2[0], rho + 0.5 * h * k2[1], k3);
    dir(s + h * k3[0], rho + h * k3[1], k4);
    s += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    rho += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    // el eje es una línea de campo: nada lo cruza fuera de las cargas (ρ ≥ 0 por simetría)
    rho = Math.abs(rho);
    S.push(s); P.push(rho);
  }
  return { s: S, rho: P, fin: { tipo: 'pasos' } };
}

export interface LineaCampo extends Trazo {
  /** azimut del semiplano meridiano (rad) */
  phi: number;
  /** carga en la que nace la siembra */
  origen: number;
  /** +1: se integró a favor de E (nace en +); −1: en contra (nace en −, viene del infinito) */
  sentido: 1 | -1;
  cosA: number;
  /** destino analítico por Ψ: índice de carga o −1 (infinito) */
  destino: number;
}

export interface OpcionesLineas extends Omit<OpcionesLinea, 'centro'> {
  porMicroC?: number;
  /** radio de siembra alrededor de cada carga (cm): aquí el campo aún es radial */
  rSiembra: number;
}

/**
 * Todas las líneas del banco (cualquier número de cargas sobre el eje; el recuento de
 * Gauss exacto sólo está garantizado para dos). Fuentes (q > 0): se integran a favor de E.
 * Sumideros (q < 0): en contra de E, y sólo se guardan las que NO terminan en una fuente
 * (vienen del infinito); las otras repetirían tubos de flujo que ya dibuja la fuente.
 */
export function lineasDeCampo(c: readonly Carga[], o: OpcionesLineas): LineaCampo[] {
  const porMicroC = o.porMicroC ?? LINEAS_POR_MICROC;
  const centro = c.reduce((a, b) => a + b.s, 0) / c.length;
  const lineas: LineaCampo[] = [];
  c.forEach((carga, i) => {
    if (carga.q === 0) return;
    const N = Math.round(porMicroC * Math.abs(carga.q));
    // la siembra empieza apuntando a la carga vecina (orden necesario para el recuento exacto)
    let vecina = -1, dv = Infinity;
    c.forEach((x, j) => { if (j !== i && Math.abs(x.s - carga.s) < dv) { dv = Math.abs(x.s - carga.s); vecina = j; } });
    const hacia = (vecina >= 0 ? Math.sign(c[vecina].s - carga.s) || 1 : 1) as 1 | -1;
    const sentido = (carga.q > 0 ? 1 : -1) as 1 | -1;
    const fase = i * 0.5 * AUREO;
    for (const sem of semillasFibonacci(N, hacia, fase)) {
      const destino = destinoAnalitico(c, i, sem.cosA);
      if (sentido < 0 && destino >= 0) continue;
      const sinA = Math.sqrt(Math.max(0, 1 - sem.cosA * sem.cosA));
      const tr = integrarLinea(c, carga.s + o.rSiembra * sem.cosA, o.rSiembra * sinA, sentido, { ...o, centro });
      lineas.push({ ...tr, phi: sem.phi, origen: i, sentido, cosA: sem.cosA, destino });
    }
  });
  return lineas;
}

// ───────────────────────────── equipotenciales ─────────────────────────────

/**
 * Niveles V* de las superficies equipotenciales, a ΔV CONSTANTE (la convención de los
 * mapas de campo: se apiñan donde |E| es grande). ΔV se escoge para que la superficie más
 * externa de la carga mayor tenga radio ≈ a·L (L = escala del encuadre), y se descartan
 * las que quedarían dentro de las esferas o pegadas al punto de silla (forma degenerada).
 */
export function nivelesEquipotenciales(c: readonly Carga[], L: number, opciones: { a?: number; porSigno?: number; rMin?: number } = {}): number[] {
  const a = opciones.a ?? 0.5, porSigno = opciones.porSigno ?? 4, rMin = opciones.rMin ?? 1.5 * R_ESFERA_CM;
  const qMax = Math.max(...c.map((x) => Math.abs(x.q)));
  if (!(qMax > 0)) return [];
  const dV = qMax / (a * L);
  const silla = puntoSilla(c);
  const vSilla = silla !== null ? potencialEje(c, silla, 0) : null;
  const niveles: number[] = [];
  for (const signo of [1, -1]) {
    const qs = c.filter((x) => Math.sign(x.q) === signo).map((x) => Math.abs(x.q));
    if (!qs.length) continue;
    const qGrande = Math.max(...qs);
    for (let m = 1; m <= porSigno; m++) {
      const v = signo * m * dV;
      // radio aproximado de la superficie alrededor de la carga mayor de ese signo
      if (qGrande / (m * dV) < rMin) break;
      if (vSilla !== null && Math.abs(v - vSilla) < 0.06 * Math.abs(vSilla)) continue;
      niveles.push(v);
    }
  }
  return niveles;
}

/** Punto de silla sobre el eje (E = 0) entre dos cargas del mismo signo, o null. */
export function puntoSilla(c: readonly Carga[]): number | null {
  if (c.length !== 2 || c[0].q * c[1].q <= 0) return null;
  // |q1|/x² = |q2|/(r − x)²  →  x = r/(1 + √(q2/q1))
  const r = c[1].s - c[0].s;
  return c[0].s + r / (1 + Math.sqrt(Math.abs(c[1].q / c[0].q)));
}

/**
 * Esfera V = 0 de dos cargas de signo opuesto y distinto módulo (esfera de Apolonio:
 * |P − r₁|/|P − r₂| = |q₁/q₂|). Devuelve centro (s) y radio (cm), o null si no existe
 * (mismo signo) o es el plano medio (módulos iguales).
 */
export function esferaPotencialCero(c: readonly Carga[]): { centro: number; radio: number } | null {
  if (c.length !== 2 || c[0].q * c[1].q >= 0) return null;
  const l = Math.abs(c[0].q / c[1].q);
  if (Math.abs(l - 1) < 1e-9) return null;
  const s1 = c[0].s, s2 = c[1].s;
  // puntos sobre el eje: d₁ = l·d₂ → s = (s1 ± l·s2)/(1 ± l)
  const a = (s1 - l * s2) / (1 - l), b = (s1 + l * s2) / (1 + l);
  return { centro: (a + b) / 2, radio: Math.abs(a - b) / 2 };
}

export interface Rejilla { s0: number; s1: number; rhoMax: number; ns: number; nr: number }

/**
 * Perfiles (s, ρ) de la equipotencial V* = v0, de eje a eje (cada uno, torneado, es una
 * superficie cerrada). Marching squares sobre la rejilla y después cada perfil se
 * remuestrea a `m` puntos equiespaciados en arco y se PROYECTA sobre V = v0 con Newton
 * (error final ≪ 1e-6 en V*). Los contornos que tocan el borde de la rejilla (abiertos) se descartan.
 */
export function perfilesEquipotencial(c: readonly Carga[], v0: number, g: Rejilla, m = 48, valores?: Float64Array): { s: Float64Array; rho: Float64Array }[] {
  const { s0, s1, rhoMax, ns, nr } = g;
  const ds = (s1 - s0) / ns, dr = rhoMax / nr;
  const W = ns + 1;
  const V = valores ?? rejillaPotencial(c, g);
  // segmentos de contorno por celda: los extremos se identifican por arista (para enlazarlos)
  const aristaH = (i: number, j: number) => 2 * (j * W + i);       // arista horizontal (i,j)→(i+1,j)
  const aristaV = (i: number, j: number) => 2 * (j * W + i) + 1;   // arista vertical (i,j)→(i,j+1)
  const punto = new Map<number, [number, number]>();
  const vecinos = new Map<number, number[]>();
  const interp = (a: number, b: number) => (v0 - a) / (b - a);
  const enlazar = (x: number, y: number) => {
    (vecinos.get(x) ?? vecinos.set(x, []).get(x)!).push(y);
    (vecinos.get(y) ?? vecinos.set(y, []).get(y)!).push(x);
  };
  for (let j = 0; j < nr; j++) {
    for (let i = 0; i < ns; i++) {
      const a = V[j * W + i], b = V[j * W + i + 1], cc = V[(j + 1) * W + i + 1], d = V[(j + 1) * W + i];
      const k = (a > v0 ? 1 : 0) | (b > v0 ? 2 : 0) | (cc > v0 ? 4 : 0) | (d > v0 ? 8 : 0);
      if (k === 0 || k === 15) continue;
      const ab = aristaH(i, j), dc = aristaH(i, j + 1), ad = aristaV(i, j), bc = aristaV(i + 1, j);
      const pon = (id: number) => {
        if (punto.has(id)) return;
        if (id % 2 === 0) { // horizontal
          const ii = (id / 2) % W, jj = Math.floor(id / 2 / W);
          const t = interp(V[jj * W + ii], V[jj * W + ii + 1]);
          punto.set(id, [s0 + (ii + t) * ds, jj * dr]);
        } else {
          const ii = ((id - 1) / 2) % W, jj = Math.floor((id - 1) / 2 / W);
          const t = interp(V[jj * W + ii], V[(jj + 1) * W + ii]);
          punto.set(id, [s0 + ii * ds, (jj + t) * dr]);
        }
      };
      const seg = (x: number, y: number) => { pon(x); pon(y); enlazar(x, y); };
      switch (k) {
        case 1: case 14: seg(ab, ad); break;
        case 2: case 13: seg(ab, bc); break;
        case 3: case 12: seg(ad, bc); break;
        case 4: case 11: seg(bc, dc); break;
        case 6: case 9: seg(ab, dc); break;
        case 7: case 8: seg(ad, dc); break;
        case 5: case 10: {
          // silla: se decide con el valor del centro
          const centro = (a + b + cc + d) / 4 > v0;
          if ((k === 5) === centro) { seg(ab, bc); seg(ad, dc); } else { seg(ab, ad); seg(bc, dc); }
          break;
        }
      }
    }
  }
  // enlaza en polilíneas empezando por los extremos (grado 1)
  const usados = new Set<number>();
  const perfiles: { s: Float64Array; rho: Float64Array }[] = [];
  const enEje = (id: number) => id % 2 === 0 && Math.floor(id / 2 / W) === 0;
  for (const [id, vs] of vecinos) {
    if (usados.has(id) || vs.length !== 1) continue;
    const cadena: number[] = [id];
    usados.add(id);
    let actual = id;
    for (;;) {
      const sig = (vecinos.get(actual) ?? []).find((x) => !usados.has(x));
      if (sig === undefined) break;
      cadena.push(sig); usados.add(sig); actual = sig;
    }
    // sólo perfiles cerrados sobre el eje: los dos extremos en la fila ρ = 0
    if (cadena.length < 4 || !enEje(cadena[0]) || !enEje(cadena[cadena.length - 1])) continue;
    const pts = cadena.map((x) => punto.get(x)!);
    if (pts[0][0] > pts[pts.length - 1][0]) pts.reverse();
    perfiles.push(refinarPerfil(c, v0, pts, m));
  }
  return perfiles;
}

/** V* en los nodos de la rejilla (fila ρ = 0 incluida); las cargas se recortan a ±1e6. */
export function rejillaPotencial(c: readonly Carga[], g: Rejilla, out?: Float64Array): Float64Array {
  const W = g.ns + 1, H = g.nr + 1;
  const V = out && out.length >= W * H ? out : new Float64Array(W * H);
  const ds = (g.s1 - g.s0) / g.ns, dr = g.rhoMax / g.nr;
  for (let j = 0; j < H; j++) {
    const rho = j * dr;
    for (let i = 0; i < W; i++) {
      const v = potencialEje(c, g.s0 + i * ds, rho);
      V[j * W + i] = Number.isFinite(v) ? Math.max(-1e6, Math.min(1e6, v)) : (v > 0 ? 1e6 : -1e6);
    }
  }
  return V;
}

/** Remuestrea un perfil a m puntos equiespaciados en arco y los proyecta sobre V = v0. */
function refinarPerfil(c: readonly Carga[], v0: number, pts: [number, number][], m: number) {
  const L: number[] = [0];
  for (let k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const total = L[L.length - 1];
  const S = new Float64Array(m), R = new Float64Array(m);
  let k = 0;
  const e = [0, 0];
  for (let q = 0; q < m; q++) {
    const objetivo = (q / (m - 1)) * total;
    while (k < L.length - 2 && L[k + 1] < objetivo) k++;
    const t = L[k + 1] > L[k] ? (objetivo - L[k]) / (L[k + 1] - L[k]) : 0;
    let s = pts[k][0] + t * (pts[k + 1][0] - pts[k][0]);
    let rho = pts[k][1] + t * (pts[k + 1][1] - pts[k][1]);
    const extremo = q === 0 || q === m - 1;
    if (extremo) rho = 0;
    // Newton sobre V = v0 a lo largo de ∇V = −E (en los extremos, sólo a lo largo del eje)
    for (let it = 0; it < 8; it++) {
      const dv = potencialEje(c, s, rho) - v0;
      campoEje(c, s, rho, e);
      const gs = -e[0], gr = extremo ? 0 : -e[1];
      const g2 = gs * gs + gr * gr;
      if (!(g2 > 0)) break;
      s -= (dv * gs) / g2; rho -= (dv * gr) / g2;
      rho = Math.max(0, rho);
      if (Math.abs(dv) < 1e-10 * Math.max(1, Math.abs(v0))) break;
    }
    S[q] = s; R[q] = rho;
  }
  return { s: S, rho: R };
}

// ───────────────────────────── sonda de superposición ─────────────────────────────

/**
 * Trayectoria de la sonda (carga de prueba): una elipse en el plano del dibujo (φ = 0) que
 * rodea a las dos cargas sin acercarse a ellas. `fase` en rad; devuelve (s, ρ) con ρ con
 * signo (ρ < 0 = por debajo del eje).
 */
export function trayectoriaSonda(r: number, fase: number): [number, number] {
  const L = escalaEncuadre(r);
  // por debajo del eje no baja más de 12 cm: la sonda nunca entra en el riel
  const a = r / 2 + 0.45 * L, b = Math.min(0.5 * L, 12);
  return [r / 2 + a * Math.cos(fase), b * Math.sin(fase)];
}

export interface Superposicion {
  /** campos reducidos (E_s, E_ρ) de cada carga y el total, en el punto */
  E1: [number, number]; E2: [number, number]; E: [number, number];
  /** las tres flechas a UNA misma escala lineal (cm): la mayor mide `largo` */
  f1: [number, number]; f2: [number, number]; f: [number, number];
}

/**
 * Superposición en (s, ρ): E⃗ = E⃗₁ + E⃗₂. Las tres flechas comparten escala LINEAL (si no,
 * el paralelogramo no cerraría); la escala se ajusta en cada punto para que la mayor mida
 * `largo` cm: compara las tres flechas entre sí, no un punto con otro.
 */
export function superposicionEn(c: readonly Carga[], s: number, rhoConSigno: number, largo: number): Superposicion {
  const uno = (q: Carga): [number, number] => {
    const ds = s - q.s, dr = rhoConSigno;
    const d2 = ds * ds + dr * dr;
    const f = q.q / (d2 * Math.sqrt(d2));
    return [f * ds, f * dr];
  };
  const E1 = uno(c[0]), E2 = uno(c[1]);
  const E: [number, number] = [E1[0] + E2[0], E1[1] + E2[1]];
  const m = Math.max(Math.hypot(...E1), Math.hypot(...E2), Math.hypot(...E), 1e-12);
  const k = largo / m;
  return { E1, E2, E, f1: [E1[0] * k, E1[1] * k], f2: [E2[0] * k, E2[1] * k], f: [E[0] * k, E[1] * k] };
}

// ───────────────────────────── escala visual (sin cifras) ─────────────────────────────

/** Escala del encuadre (cm): la separación, con un mínimo para que las esferas quepan holgadas. */
export function escalaEncuadre(r: number): number {
  return Math.max(r, 7);
}

/**
 * Longitud de la flecha de fuerza como FRACCIÓN de la escala del encuadre: logarítmica en
 * |F| (de 0,03 N a ~1000 N) y sin cifras. En pantalla la flecha compara F entre estados:
 * duplicar |F| la alarga siempre lo mismo.
 */
export function fraccionFlecha(F: number): number {
  const x = Math.log10(Math.max(1e-6, F) / 0.03);
  return Math.min(0.55, Math.max(0.1, 0.12 + 0.085 * x));
}

/** Ventana fija (N) del eje vertical log de la gráfica F–r: cubre todos los ajustes del banco. */
export const VENTANA_F: [number, number] = [0.025, 2500];
/** Ventana del eje r (cm) de la gráfica. */
export const VENTANA_R: [number, number] = [2, 40];

/** Formato con coma decimal y separador de millares fino (U+202F), como el resto del lab. */
export function fmtNum(x: number, dec: number): string {
  if (!Number.isFinite(x)) return '—';
  const [ent, frac] = Math.abs(x).toFixed(dec).split('.');
  const conMiles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (x < 0 ? '−' : '') + conMiles + (frac ? ',' + frac : '');
}

/** Formato de una fuerza en N con 3 cifras significativas (sólo se usa TRAS validar). */
export function fmtFuerza(F: number): string {
  if (!Number.isFinite(F)) return '—';
  if (F >= 100) return fmtNum(F, 0);
  if (F >= 10) return fmtNum(F, 1);
  if (F >= 1) return fmtNum(F, 2);
  return fmtNum(F, 3 - Math.floor(Math.log10(F)) - 1);
}
