/**
 * _kit/perfiles.ts — PERFILES TORNEADOS DE LA CRISTALERÍA (funciones puras, sin three).
 *
 * Escala del kit: 1 u = 1 dm = 10 cm  →  1 mm = 0,01 u  y  1 u³ = 1 L = 1000 mL.
 *
 * Cada recipiente se describe por la CAVIDAD interior: una polilínea [r, y] que
 * arranca en el fondo (sobre el eje si el fondo es cerrado, o en la boca del
 * vástago si es abierto, como la bureta o el embudo) y sube hasta el borde, con
 * `y` NO decreciente (ninguna pieza de laboratorio tiene voladizos interiores).
 * El sólido de vidrio se fabrica desplazando esa cavidad el grosor de pared hacia
 * fuera y cerrándolo con un cordón (borde redondeado) arriba. Así:
 *   - la pared tiene grosor real y uniforme;
 *   - el volumen se integra EXACTAMENTE sobre la misma cavidad que se dibuja, y
 *     las graduaciones impresas, el aforo y el líquido caen donde deben.
 *
 * Volumen de una polilínea: cada tramo es un tronco de cono,
 *   V = π·Δy/3 · (r₁² + r₁r₂ + r₂²)   (exacto para el perfil lineal a trozos).
 *
 * Sentido del perfil del sólido (trampa conocida): LatheGeometry calcula la normal
 * de cada tramo como (dy, −dx). Para que salgan hacia FUERA del vidrio, el perfil
 * se recorre: exterior desde el eje hacia fuera y hacia arriba → cordón del borde
 * → interior hacia abajo hasta el eje. `construirSolido` lo hace siempre así y
 * `areaConSigno` permite comprobarlo en las pruebas.
 */

export type P2 = [number, number]; // [radio, altura] en u

export const ML_POR_U3 = 1000;
/** milímetros → unidades del kit */
export const mm = (x: number) => x / 100;

const EPS = 1e-9;

// ───────────────────────────── utilidades de trazado ─────────────────────────────

/** Puntos de un arco de circunferencia en el plano (r, y); ángulos en radianes,
 *  medidos como en matemáticas (0 = +r, π/2 = +y). Incluye ambos extremos. */
export function arco(cr: number, cy: number, R: number, a0: number, a1: number, n: number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cr + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return out;
}

/** Quita puntos consecutivos repetidos (una normal de longitud cero deja la escena
 *  ENTERA en negro sin un solo error en consola). */
export function limpiar(p: P2[], eps = 1e-7): P2[] {
  const out: P2[] = [];
  for (const q of p) {
    const u = out[out.length - 1];
    if (!u || Math.hypot(q[0] - u[0], q[1] - u[1]) > eps) out.push([q[0], q[1]]);
  }
  return out;
}

/** Bézier cuadrática p0 → p1 con control c (n tramos, incluye extremos). */
function bezier2(p0: P2, c: P2, p1: P2, n: number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t;
    out.push([a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]]);
  }
  return out;
}

/**
 * Redondea las esquinas interiores de un polígono abierto con Bézier cuadráticas
 * tangentes (control en la esquina). `cortes[i]` es la distancia (u) que se recorta
 * a cada lado de la esquina i (0 = esquina viva). Se limita para que dos redondeos
 * vecinos no se pisen.
 */
export function redondear(poly: P2[], cortes: number[], n = 10): P2[] {
  const out: P2[] = [poly[0]];
  const largo = (i: number) => Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
  for (let i = 1; i < poly.length - 1; i++) {
    const c = cortes[i] ?? 0;
    if (c <= 0) { out.push(poly[i]); continue; }
    const lIn = largo(i - 1), lOut = largo(i);
    const limIn = lIn * ((cortes[i - 1] ?? 0) > 0 ? 0.5 : 0.98);
    const limOut = lOut * ((cortes[i + 1] ?? 0) > 0 ? 0.5 : 0.98);
    const d = Math.min(c, limIn, limOut);
    const p = poly[i], a = poly[i - 1], b = poly[i + 1];
    const pIn: P2 = [p[0] + ((a[0] - p[0]) * d) / lIn, p[1] + ((a[1] - p[1]) * d) / lIn];
    const pOut: P2 = [p[0] + ((b[0] - p[0]) * d) / lOut, p[1] + ((b[1] - p[1]) * d) / lOut];
    out.push(...bezier2(pIn, p, pOut, n));
  }
  out.push(poly[poly.length - 1]);
  return limpiar(out);
}

/** Normal "del lado del vidrio" (derecha del sentido de avance) en cada vértice. */
function normalesDerecha(path: P2[]): P2[] {
  const nSeg: P2[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1][0] - path[i][0], dy = path[i + 1][1] - path[i][1];
    const l = Math.hypot(dx, dy) || 1;
    nSeg.push([dy / l, -dx / l]);
  }
  return path.map((_, i) => {
    const a = nSeg[Math.max(0, i - 1)], b = nSeg[Math.min(nSeg.length - 1, i)];
    let nx = a[0] + b[0], ny = a[1] + b[1];
    const l = Math.hypot(nx, ny);
    if (l < 1e-9) return b;
    nx /= l; ny /= l;
    // escala de inglete: mantiene el grosor perpendicular en las esquinas suaves
    const k = Math.max(0.5, nx * b[0] + ny * b[1]);
    return [nx / k, ny / k] as P2;
  });
}

/** Desplaza una polilínea `d` hacia su derecha (el lado del vidrio). */
export function desplazar(path: P2[], d: number): P2[] {
  const n = normalesDerecha(path);
  return path.map((p, i) => [Math.max(0, p[0] + n[i][0] * d), p[1] + n[i][1] * d] as P2);
}

/** Área con signo del polígono cerrado (r, y). Positiva = sentido antihorario en el
 *  plano (r a la derecha, y arriba), que es el sentido correcto para el sólido. */
export function areaConSigno(p: P2[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Sólido de vidrio a partir de la cavidad: exterior (cavidad desplazada `grosor`)
 * desde abajo hasta el borde → cordón de radio `rb` (≥ grosor/2) tangente a la
 * pared interior → cavidad de vuelta hacia abajo. Exige que el último tramo de la
 * cavidad sea recto y de longitud ≥ 2·rb (todas las piezas lo cumplen).
 */
export function construirSolido(interior: P2[], grosor: number, rb = grosor / 2, nBorde = 14): P2[] {
  rb = Math.max(rb, grosor / 2 + 1e-6);
  const N = interior.length;
  const pe = interior[N - 1], pa = interior[N - 2];
  let dx = pe[0] - pa[0], dy = pe[1] - pa[1];
  const l = Math.hypot(dx, dy); dx /= l; dy /= l; // d = dirección de avance
  const nx = dy, ny = -dx;                        // n = lado del vidrio
  const cosA = Math.max(-1, Math.min(1, (grosor - rb) / rb));
  const aLow = -Math.acos(cosA);
  const yLow = rb * Math.sin(aLow);               // coordenada local (a lo largo de d), ≤ 0
  const loc = (x: number, y: number): P2 => [pe[0] + x * nx + y * dx, pe[1] + x * ny + y * dy];

  const ext = desplazar(interior, grosor);
  const recorte: P2[] = [];
  for (const q of ext) {
    const s = (q[0] - pe[0]) * dx + (q[1] - pe[1]) * dy;
    if (s < yLow - 1e-6) recorte.push(q);
  }
  recorte.push(loc(grosor, yLow));
  const borde: P2[] = [];
  for (let i = 1; i < nBorde; i++) {
    const a = aLow + ((Math.PI - aLow) * i) / nBorde;
    borde.push(loc(rb + rb * Math.cos(a), rb * Math.sin(a)));
  }
  const vuelta = interior.slice().reverse();
  const solido = limpiar([...recorte, ...borde, ...vuelta]);
  // si el fondo es abierto (cavidad que no empieza en el eje), el primer punto del
  // exterior y el último del interior quedan en la misma altura: el anillo de la
  // punta lo cierra el propio torno entre ambos.
  if (interior[0][0] > 1e-6) solido.unshift([interior[0][0], interior[0][1]]);
  return solido;
}

// ───────────────────────────── volumen ─────────────────────────────

/** Volumen (mL) de la cavidad desde su fondo hasta la altura h. */
export function volumenHastaAltura(interior: P2[], h: number): number {
  let v = 0;
  for (let i = 0; i < interior.length - 1; i++) {
    const [r1, y1] = interior[i], [r2, y2] = interior[i + 1];
    if (y2 - y1 <= EPS) continue;
    if (h <= y1) break;
    const yt = Math.min(h, y2);
    const rt = r1 + ((r2 - r1) * (yt - y1)) / (y2 - y1);
    v += (Math.PI * (yt - y1) / 3) * (r1 * r1 + r1 * rt + rt * rt);
    if (h <= y2) break;
  }
  return v * ML_POR_U3;
}

/** Altura a la que la cavidad encierra `mL` (bisección; la función es monótona). */
export function alturaParaVolumen(interior: P2[], mL: number): number {
  const y0 = interior[0][1], y1 = interior[interior.length - 1][1];
  if (mL <= 0) return y0;
  if (mL >= volumenHastaAltura(interior, y1)) return y1;
  let a = y0, b = y1;
  for (let k = 0; k < 64; k++) {
    const m = (a + b) / 2;
    if (volumenHastaAltura(interior, m) < mL) a = m; else b = m;
  }
  return (a + b) / 2;
}

/** Radio interior a la altura h (último tramo que la contiene). */
export function radioEnAltura(perfil: P2[], h: number): number {
  let r = perfil[0][0];
  for (let i = 0; i < perfil.length - 1; i++) {
    const [r1, y1] = perfil[i], [r2, y2] = perfil[i + 1];
    if (y2 - y1 <= EPS) { if (Math.abs(h - y1) < EPS) r = Math.max(r1, r2); continue; }
    if (h >= y1 - EPS && h <= y2 + EPS) r = r1 + ((r2 - r1) * (h - y1)) / (y2 - y1);
  }
  return r;
}

/** Radio de la polilínea EXTERIOR a la altura h (para bandas impresas). */
export function radioExteriorEn(solido: P2[], h: number): number {
  // el exterior es el tramo inicial del sólido hasta el punto más alto
  let iTop = 0;
  for (let i = 0; i < solido.length; i++) if (solido[i][1] > solido[iTop][1]) iTop = i;
  let r = 0;
  for (let i = 0; i < iTop; i++) {
    const [r1, y1] = solido[i], [r2, y2] = solido[i + 1];
    if (Math.abs(y2 - y1) <= EPS) continue;
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    if (h >= lo && h <= hi) r = Math.max(r, r1 + ((r2 - r1) * (h - y1)) / (y2 - y1));
  }
  return r;
}

// ───────────────────────────── definición de recipientes ─────────────────────────────

export type TipoRecipiente =
  | 'vaso' | 'erlenmeyer' | 'aforado' | 'probeta' | 'bureta' | 'balon'
  | 'tubo' | 'vidrioReloj' | 'embudo' | 'jeringa' | 'cristalizador';

export interface Graduacion {
  /** volumen (mL) de cada marca, de menor a mayor */
  marcas: { mL: number; nivel: 0 | 1 | 2; texto?: string }[];
}

export interface DefRecipiente {
  id: string;
  tipo: TipoRecipiente;
  nombre: string;
  nominalML: number;
  /** cavidad interior [r, y] desde el fondo hacia arriba (u) */
  interior: P2[];
  /** perfil cerrado del sólido de vidrio para LatheGeometry */
  solido: P2[];
  grosor: number;
  /** altura total del vidrio (u) */
  altura: number;
  radioMax: number;
  /** fondo de la cavidad y máximo nivel útil (u) */
  y0: number;
  yMax: number;
  /** volumen hasta el borde (mL) */
  capacidadTotalML: number;
  alturaParaVolumen(mL: number): number;
  volumenHastaAltura(h: number): number;
  radioInteriorEn(h: number): number;
  /** pico vertedor (ángulo del torno, rad: 0 = +Z, π/2 = +X) */
  pico?: { angulo: number; alto: number; salida: number; ancho: number };
  graduacion?: Graduacion;
  /** datos propios de cada pieza (aforo, escala de bureta, etc.) */
  extra: Record<string, number>;
}

function completar(
  base: Omit<DefRecipiente, 'alturaParaVolumen' | 'volumenHastaAltura' | 'radioInteriorEn' | 'altura' | 'radioMax' | 'y0' | 'yMax' | 'capacidadTotalML' | 'extra'> & { extra?: Record<string, number> },
): DefRecipiente {
  const interior = base.interior;
  let altura = 0, radioMax = 0;
  for (const [r, y] of base.solido) { altura = Math.max(altura, y); radioMax = Math.max(radioMax, r); }
  const y0 = interior[0][1], yMax = interior[interior.length - 1][1];
  return {
    ...base,
    extra: base.extra ?? {},
    altura, radioMax, y0, yMax,
    capacidadTotalML: volumenHastaAltura(interior, yMax),
    alturaParaVolumen: (mL: number) => alturaParaVolumen(interior, mL),
    volumenHastaAltura: (h: number) => volumenHastaAltura(interior, h),
    radioInteriorEn: (h: number) => radioEnAltura(interior, h),
  };
}

const cache = new Map<string, DefRecipiente>();
function memo(id: string, f: () => DefRecipiente): DefRecipiente {
  let d = cache.get(id);
  if (!d) { d = f(); cache.set(id, d); }
  return d;
}

function marcasCada(desde: number, hasta: number, paso: number, numCada: number, medioCada = 0): Graduacion {
  const marcas: Graduacion['marcas'] = [];
  const n = Math.round((hasta - desde) / paso);
  for (let i = 0; i <= n; i++) {
    const v = +(desde + i * paso).toFixed(6);
    const esNum = Math.abs(v / numCada - Math.round(v / numCada)) < 1e-6;
    const esMedio = medioCada > 0 && Math.abs(v / medioCada - Math.round(v / medioCada)) < 1e-6;
    marcas.push({ mL: v, nivel: esNum ? 2 : esMedio ? 1 : 0, texto: esNum ? String(+v.toFixed(3)) : undefined });
  }
  return { marcas };
}

// ── Vaso de precipitados Griffin, forma baja (ISO 3819) ──
export const CAPACIDADES_VASO = [50, 100, 250, 600] as const;
const TABLA_VASO: Record<number, { D: number; H: number; t: number; grad: [number, number, number, number] }> = {
  // D y H en mm; graduación: desde, hasta, paso, número cada
  50: { D: 42, H: 60, t: 1.2, grad: [10, 40, 5, 10] },
  100: { D: 50, H: 70, t: 1.3, grad: [20, 80, 10, 20] },
  250: { D: 70, H: 95, t: 1.5, grad: [50, 200, 25, 50] },
  600: { D: 90, H: 125, t: 1.8, grad: [100, 500, 50, 100] },
  // cristalizador (sin graduar): se reutiliza el mismo trazado
};

function cavidadVaso(Di: number, H: number, t: number, rb: number): P2[] {
  const Ri = Di / 2;
  const f = 0.13 * Ri;
  return redondear([[0, t], [Ri, t], [Ri, H - rb]], [0, f, 0], 12);
}

export function defVaso(capacidad: number = 250): DefRecipiente {
  const cap = (TABLA_VASO[capacidad] ? capacidad : 250) as keyof typeof TABLA_VASO;
  return memo('vaso-' + cap, () => {
    const T = TABLA_VASO[cap];
    const t = mm(T.t), rb = t * 0.95;
    const interior = cavidadVaso(mm(T.D) - 2 * t, mm(T.H), t, rb);
    const [d, h, p, n] = T.grad;
    return completar({
      id: 'vaso-' + cap, tipo: 'vaso', nombre: `Vaso de precipitados ${cap} mL`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      pico: { angulo: -Math.PI / 2, alto: mm(T.H) * 0.13, salida: mm(T.D) * 0.075, ancho: 0.42 },
      graduacion: marcasCada(d, h, p, n),
    });
  });
}

/** Cristalizador (para baño de hielo / María): forma baja y ancha. */
export function defCristalizador(diametroMM = 150): DefRecipiente {
  return memo('cristalizador-' + diametroMM, () => {
    const t = mm(2.2), rb = t;
    const H = mm(diametroMM * 0.5);
    const interior = cavidadVaso(mm(diametroMM) - 2 * t, H, t, rb);
    const cap = Math.round(volumenHastaAltura(interior, H - rb) / 10) * 10;
    return completar({
      id: 'cristalizador-' + diametroMM, tipo: 'cristalizador', nombre: `Cristalizador ${diametroMM} mm`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      pico: { angulo: -Math.PI / 2, alto: H * 0.12, salida: mm(diametroMM) * 0.035, ancho: 0.3 },
    });
  });
}

// ── Matraz Erlenmeyer, cuello estrecho (ISO 1773) ──
export const CAPACIDADES_ERLENMEYER = [50, 100, 250, 500] as const;
const TABLA_ERLEN: Record<number, { D: number; H: number; cuello: number; grad: [number, number, number, number] }> = {
  50: { D: 51, H: 85, cuello: 22, grad: [10, 40, 10, 10] },
  100: { D: 64, H: 105, cuello: 22, grad: [25, 75, 25, 25] },
  250: { D: 85, H: 145, cuello: 34, grad: [50, 200, 25, 50] },
  500: { D: 105, H: 180, cuello: 34, grad: [100, 400, 50, 100] },
};
export function defErlenmeyer(capacidad: number = 250): DefRecipiente {
  const cap = (TABLA_ERLEN[capacidad] ? capacidad : 250) as keyof typeof TABLA_ERLEN;
  return memo('erlenmeyer-' + cap, () => {
    const T = TABLA_ERLEN[cap];
    const t = mm(1.5), rb = mm(2.3);
    const H = mm(T.H), Ri = mm(T.D) / 2 - t, rn = mm(T.cuello) / 2 - t;
    const yCuello = H * 0.74;
    const interior = redondear(
      [[0, t], [Ri, t], [rn, yCuello], [rn, H - rb]],
      [0, Ri * 0.17, (Ri - rn) * 0.32, 0], 14,
    );
    const [d, h, p, n] = T.grad;
    return completar({
      id: 'erlenmeyer-' + cap, tipo: 'erlenmeyer', nombre: `Matraz Erlenmeyer ${cap} mL`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      graduacion: marcasCada(d, h, p, n),
    });
  });
}

// ── Matraz aforado clase A (ISO 1042) ──
export const CAPACIDADES_AFORADO = [50, 100, 250, 500, 1000] as const;
const TABLA_AFORADO: Record<number, { H: number; cuelloInt: number }> = {
  50: { H: 140, cuelloInt: 9 },
  100: { H: 170, cuelloInt: 10.5 },
  250: { H: 220, cuelloInt: 12.5 },
  500: { H: 260, cuelloInt: 15.5 },
  1000: { H: 300, cuelloInt: 20 },
};

function cavidadBulbo(Rb: number, rn: number, t: number, yTop: number, fondoPlano: boolean): { interior: P2[]; yCuello: number } {
  // esfera de radio Rb, centro (0, yc); fondo plano (aforado) o redondo (balón)
  const yc = fondoPlano ? t + 0.8 * Rb : t + Rb;
  const pt = (th: number): P2 => [Rb * Math.sin(th), yc - Rb * Math.cos(th)];
  const th1 = fondoPlano ? (140 * Math.PI) / 180 : (148 * Math.PI) / 180;
  // esquina del hombro: tangente en th1 hasta r = rn
  const [r1, y1] = pt(th1);
  const s = (r1 - rn) / -Math.cos(th1);
  const K: P2 = [rn, y1 + s * Math.sin(th1)];
  const pts: P2[] = [];
  const cortes: number[] = [];
  if (fondoPlano) {
    const thb = Math.acos(0.8); // donde la esfera corta el plano y = t
    const th0 = thb + (14 * Math.PI) / 180;
    const [r0, y0] = pt(th0);
    const sh = (y0 - t) / Math.sin(th0);
    const H0: P2 = [r0 - sh * Math.cos(th0), t];
    pts.push([0, t], H0); cortes.push(0, 0.16 * Rb);
    const n = 28;
    for (let i = 0; i <= n; i++) { pts.push(pt(th0 + ((th1 - th0) * i) / n)); cortes.push(0); }
  } else {
    const n = 36;
    for (let i = 0; i <= n; i++) { pts.push(pt((th1 * i) / n)); cortes.push(0); }
  }
  pts.push(K); cortes.push(Math.min(s * 0.85, 0.5 * Rb));
  pts.push([rn, yTop]); cortes.push(0);
  return { interior: redondear(pts, cortes, 14), yCuello: K[1] + Math.min(s * 0.85, 0.5 * Rb) };
}

export function defAforado(capacidad: number = 250): DefRecipiente {
  const cap = (TABLA_AFORADO[capacidad] ? capacidad : 250) as keyof typeof TABLA_AFORADO;
  return memo('aforado-' + cap, () => {
    const T = TABLA_AFORADO[cap];
    const t = mm(1.3), rb = mm(1.2);
    const H = mm(T.H), rn = mm(T.cuelloInt) / 2;
    const yTop = H - rb;
    // Se busca el radio del bulbo para que el aforo (al 40 % del cuello) encierre
    // exactamente el volumen nominal: el aforo sale de INTEGRAR el perfil.
    const prueba = (Rb: number) => {
      const { interior, yCuello } = cavidadBulbo(Rb, rn, t, yTop, true);
      const yAforo = yCuello + 0.4 * (yTop - yCuello);
      return { interior, yAforo, v: volumenHastaAltura(interior, yAforo) };
    };
    let a = rn * 2, b = H * 0.4;
    for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (prueba(m).v < cap) a = m; else b = m; }
    const { interior } = prueba((a + b) / 2);
    // el aforo se recalcula integrando sobre el perfil final
    const yAforo = alturaParaVolumen(interior, cap);
    return completar({
      id: 'aforado-' + cap, tipo: 'aforado', nombre: `Matraz aforado ${cap} mL`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      extra: { yAforo, radioBulbo: (a + b) / 2, radioCuello: rn },
    });
  });
}

// ── Matraz de fondo redondo (balón) ──
export const CAPACIDADES_BALON = [100, 250, 500] as const;
const TABLA_BALON: Record<number, { D: number; cuelloInt: number; cuelloL: number }> = {
  100: { D: 64, cuelloInt: 14, cuelloL: 40 },
  250: { D: 85, cuelloInt: 24, cuelloL: 48 },
  500: { D: 105, cuelloInt: 26, cuelloL: 55 },
};
export function defBalon(capacidad: number = 250): DefRecipiente {
  const cap = (TABLA_BALON[capacidad] ? capacidad : 250) as keyof typeof TABLA_BALON;
  return memo('balon-' + cap, () => {
    const T = TABLA_BALON[cap];
    const t = mm(1.4), rb = mm(2.2);
    const Rb = mm(T.D) / 2 - t, rn = mm(T.cuelloInt) / 2;
    const yAprox = t + Rb + Rb * 0.95 + mm(T.cuelloL);
    const { interior } = cavidadBulbo(Rb, rn, t, yAprox, false);
    return completar({
      id: 'balon-' + cap, tipo: 'balon', nombre: `Matraz de fondo redondo ${cap} mL`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      extra: { radioBulbo: Rb, centroBulbo: t + Rb },
    });
  });
}

// ── Probeta graduada, forma alta (ISO 4788) ──
export const CAPACIDADES_PROBETA = [10, 25, 50, 100, 250] as const;
const TABLA_PROBETA: Record<number, { escala: number; paso: number; num: number; medio: number; pie: number }> = {
  // escala = longitud graduada (mm); pie = ancho entre caras del pie hexagonal (mm)
  10: { escala: 95, paso: 0.2, num: 1, medio: 0.5, pie: 46 },
  25: { escala: 110, paso: 0.5, num: 5, medio: 2.5, pie: 56 },
  50: { escala: 135, paso: 1, num: 10, medio: 5, pie: 64 },
  100: { escala: 170, paso: 1, num: 10, medio: 5, pie: 76 },
  250: { escala: 215, paso: 2, num: 50, medio: 10, pie: 100 },
};
export const PROBETA_ALTO_PIE = mm(9);
export function defProbeta(capacidad: number = 100): DefRecipiente {
  const cap = (TABLA_PROBETA[capacidad] ? capacidad : 100) as keyof typeof TABLA_PROBETA;
  return memo('probeta-' + cap, () => {
    const T = TABLA_PROBETA[cap];
    const t = mm(1.4), rb = mm(1.4);
    const Ri = Math.sqrt(cap / ML_POR_U3 / (Math.PI * mm(T.escala)));
    const yFondo = PROBETA_ALTO_PIE + mm(3) + t;
    const yTop = yFondo + mm(T.escala) * 1.16;
    const interior = redondear([[0, yFondo], [Ri, yFondo], [Ri, yTop]], [0, Ri * 0.25, 0], 10);
    // el sólido arranca por debajo del fondo: el tubo se apoya sobre el pie
    return completar({
      id: 'probeta-' + cap, tipo: 'probeta', nombre: `Probeta graduada ${cap} mL`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      pico: { angulo: -Math.PI / 2, alto: mm(9), salida: Ri * 0.22, ancho: 0.38 },
      graduacion: marcasCada(T.paso, cap, T.paso, T.num, T.medio),
      extra: { pie: mm(T.pie), radioInterior: Ri },
    });
  });
}

// ── Bureta 50 mL clase B ──
/** Bureta: 0 mL ARRIBA, 50 mL abajo; división 0,1 mL. */
export function defBureta(): DefRecipiente {
  return memo('bureta-50', () => {
    const t = mm(1.3), rb = t * 0.6;
    const Ri = mm(10.6) / 2;
    const yLlave = mm(65);
    const y50 = mm(108);
    const escala = 0.05 / (Math.PI * Ri * Ri); // 50 mL en u (≈ 5,67 u = 56,7 cm)
    const yTop = y50 + escala + mm(42);
    const interior = redondear([
      [mm(0.75), 0],            // boca de la punta
      [mm(1.6), mm(38)],         // punta cónica
      [mm(2.0), mm(46)],
      [mm(2.0), yLlave + mm(17)], // vástago que atraviesa la llave
      [Ri, yLlave + mm(36)],     // ensanche hacia el tubo
      [Ri, yTop],
    ], [0, mm(3), mm(3), mm(6), mm(8), 0], 10);
    const v50 = volumenHastaAltura(interior, y50);
    const y0 = alturaParaVolumen(interior, v50 + 50);
    const marcas = marcasCada(0, 50, 0.1, 1, 0.5);
    return completar({
      id: 'bureta-50', tipo: 'bureta', nombre: 'Bureta 50 mL', nominalML: 50,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
      graduacion: marcas,
      extra: { y0Marca: y0, y50Marca: y50, yLlave, radioInterior: Ri, volumenEnCero: v50 + 50 },
    });
  });
}
/** Altura (u, desde la punta) del nivel que corresponde a una LECTURA de bureta. */
export function buretaAlturaDeLectura(lecturaML: number): number {
  const d = defBureta();
  return d.alturaParaVolumen(d.extra.volumenEnCero - lecturaML);
}
/** Lectura (mL) que marca un nivel situado a la altura y. */
export function buretaLecturaDeAltura(y: number): number {
  const d = defBureta();
  return d.extra.volumenEnCero - d.volumenHastaAltura(y);
}
/** Volumen (mL, medido desde la punta) que hay en la bureta para una lectura dada. */
export function buretaVolumenDeLectura(lecturaML: number): number {
  return defBureta().extra.volumenEnCero - lecturaML;
}

// ── Tubo de ensayo ──
export const TAMANOS_TUBO = ['13x100', '16x150', '18x180', '25x150'] as const;
export function defTubo(tam: string = '16x150'): DefRecipiente {
  return memo('tubo-' + tam, () => {
    const [Dm, Lm] = tam.split('x').map(Number);
    const D = Number.isFinite(Dm) ? Dm : 16, L = Number.isFinite(Lm) ? Lm : 150;
    const t = mm(D >= 18 ? 1.2 : 0.9), rb = t * 0.95;
    const Ri = mm(D) / 2 - t;
    const interior = limpiar([...arco(0, t + Ri, Ri, -Math.PI / 2, 0, 18), [Ri, mm(L) - rb]]);
    const cap = Math.round(volumenHastaAltura(interior, mm(L) - rb));
    return completar({
      id: 'tubo-' + tam, tipo: 'tubo', nombre: `Tubo de ensayo ${D}×${L} mm`, nominalML: cap,
      interior, solido: construirSolido(interior, t, rb), grosor: t,
    });
  });
}

// ── Vidrio de reloj ──
export function defVidrioReloj(diametroMM = 100): DefRecipiente {
  return memo('reloj-' + diametroMM, () => {
    const t = mm(1.6);
    const Rd = mm(diametroMM) / 2 - t;
    const Rc = mm(diametroMM) * 1.05; // radio de curvatura
    const thE = Math.asin(Rd / Rc);
    const interior = limpiar([...arco(0, t + Rc, Rc, -Math.PI / 2, -Math.PI / 2 + thE, 30)]);
    // último tramo recto: prolonga 2 mm la tangente
    const [rl, yl] = interior[interior.length - 1];
    interior.push([rl + mm(2) * Math.cos(thE), yl + mm(2) * Math.sin(thE)]);
    return completar({
      id: 'reloj-' + diametroMM, tipo: 'vidrioReloj', nombre: `Vidrio de reloj ${diametroMM} mm`,
      nominalML: Math.round(volumenHastaAltura(interior, interior[interior.length - 1][1])),
      interior, solido: construirSolido(interior, t), grosor: t,
    });
  });
}

// ── Embudo de vidrio de 60° ──
export function defEmbudo(diametroMM = 75): DefRecipiente {
  return memo('embudo-' + diametroMM, () => {
    const t = mm(1.6);
    const Rtop = mm(diametroMM) / 2 - t;
    const rv = mm(diametroMM >= 90 ? 3.5 : 2.8); // radio interior del vástago
    const Lv = mm(diametroMM);                   // vástago ≈ diámetro
    const yCono = Lv + (Rtop - rv) / Math.tan(Math.PI / 6);
    const interior = redondear([[rv, 0], [rv, Lv], [Rtop, yCono]], [0, mm(4), 0], 12);
    return completar({
      id: 'embudo-' + diametroMM, tipo: 'embudo', nombre: `Embudo ${diametroMM} mm`,
      nominalML: Math.round(volumenHastaAltura(interior, yCono)),
      interior, solido: construirSolido(interior, t), grosor: t,
    });
  });
}

// ── Jeringa de plástico (Luer) ──
export const CAPACIDADES_JERINGA = [5, 10, 20] as const;
const TABLA_JERINGA: Record<number, { di: number; paso: number; num: number }> = {
  5: { di: 12.0, paso: 0.2, num: 1 },
  10: { di: 14.5, paso: 0.2, num: 2 },
  20: { di: 19.1, paso: 1, num: 5 },
};
export function defJeringa(capacidad: number = 10): DefRecipiente {
  const cap = (TABLA_JERINGA[capacidad] ? capacidad : 10) as keyof typeof TABLA_JERINGA;
  return memo('jeringa-' + cap, () => {
    const T = TABLA_JERINGA[cap];
    const t = mm(1.1);
    const Ri = mm(T.di) / 2;
    const yCero = mm(13);
    const escala = cap / ML_POR_U3 / (Math.PI * Ri * Ri);
    const yTop = yCero + escala * 1.18;
    const interior = redondear([[mm(0.9), 0], [mm(1.2), mm(10)], [Ri, yCero], [Ri, yTop]], [0, mm(0.8), mm(1.5), 0], 8);
    return completar({
      id: 'jeringa-' + cap, tipo: 'jeringa', nombre: `Jeringa ${cap} mL`, nominalML: cap,
      interior, solido: construirSolido(interior, t, t * 0.55), grosor: t,
      graduacion: marcasCada(T.paso, cap, T.paso, T.num, T.num / 2),
      extra: { yCero, radioInterior: Ri, escala, volumenMuerto: volumenHastaAltura(interior, yCero) },
    });
  });
}
/** Altura del frente del émbolo (u) para un volumen leído en la jeringa. */
export function jeringaAlturaEmbolo(capacidad: number, volumenML: number): number {
  const d = defJeringa(capacidad);
  const Ri = d.extra.radioInterior;
  return d.extra.yCero + Math.max(0, volumenML) / ML_POR_U3 / (Math.PI * Ri * Ri);
}

/** Catálogo por id corto: 'vaso-250', 'erlenmeyer-250', 'aforado-100', 'probeta-100',
 *  'bureta-50', 'balon-250', 'tubo-16x150', 'reloj-100', 'embudo-75', 'jeringa-10',
 *  'cristalizador-150'. */
export function obtenerRecipiente(id: string): DefRecipiente {
  const [tipo, arg] = id.split('-');
  const num = Number(arg);
  switch (tipo) {
    case 'vaso': return defVaso(num || 250);
    case 'erlenmeyer': return defErlenmeyer(num || 250);
    case 'aforado': return defAforado(num || 250);
    case 'probeta': return defProbeta(num || 100);
    case 'bureta': return defBureta();
    case 'balon': return defBalon(num || 250);
    case 'tubo': return defTubo(arg || '16x150');
    case 'reloj': return defVidrioReloj(num || 100);
    case 'embudo': return defEmbudo(num || 75);
    case 'jeringa': return defJeringa(num || 10);
    case 'cristalizador': return defCristalizador(num || 150);
    default: throw new Error(`Recipiente desconocido: ${id}`);
  }
}
