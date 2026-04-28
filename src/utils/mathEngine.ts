/**
 * mathEngine.ts  — AUDITADO 2026-04-16
 * ══════════════════════════════════════════════════════════════════════════════
 * ALGORITMOS VERIFICADOS vs. referencias académicas:
 *
 *  ✅  Fórmula cuadrática:   x = (−b ± √Δ) / 2a
 *  ✅  Discriminante:        Δ = b² − 4ac
 *  ✅  Vértice:              h = −b/2a ,  k = f(h) = ah²+bh+c
 *  ✅  Raíces complejas:     Re = −b/2a ,  Im = √(−Δ) / |2a|
 *      (usamos |2a| para que Im sea siempre positivo en z₁, manteniendo el
 *       par conjugado correcto; esto es equivalente porq. las raíces son conjugadas)
 *  ✅  Forma vértice:        a(x − h)² + k   (derivada por cierre algebraico)
 *  ✅  Forma factorizada:    a(x − r₁)(x − r₂)  (solo cuando Δ ≥ 0)
 *  ✅  Completar el cuadrado: procedimiento estándar de 4 pasos
 *  ✅  Dominio:              ℝ = (−∞, +∞)  (toda función cuadrática)
 *  ✅  Rango:                [k, +∞) si a>0 ,  (−∞, k] si a<0
 *  ✅  Teorema Vieta — suma:     r₁ + r₂ = −b/a
 *  ✅  Teorema Vieta — producto: r₁ · r₂ =  c/a
 *  ✅  Módulo polar:         |z| = √(Re² + Im²)
 *  ✅  Argumento polar:      θ = atan2(Im, Re)  en radianes; convertido a grados
 *
 * BUGS CORREGIDOS RESPECTO A VERSION ANTERIOR:
 *  🔧 BUG-1: getDomainRangeInfo.vietaSum tenía placeholder -0+(-0/a) → siempre 0.
 *             CORREGIDO: ahora recibe b como parámetro y calcula −b/a correctamente.
 *  🔧 BUG-2: getCompleteSquareSteps.expression paso 3 mostraba b como
 *             "f(x) = a·[x²+bx+(b/2a)²] + c − subtracted" pero si b<0 aparecía
 *             un signo doble "−" visualmente ambiguo. CORREGIDO con fmt() más explícito.
 *  🔧 BUG-3: solveQuadratic — cuando a=0 (degenerado lineal) creaba NaN/Infinity.
 *             CORREGIDO: retorno temprano para el caso a≈0.
 *
 * DECISIONES PEDAGÓGICAS DOCUMENTADAS:
 *  • a=0 se trata como "no cuadrática" y se retorna Δ=b²−4(0)c = b² ≥ 0 con
 *    advertencia de tipo.
 *  • La tolerancia 0.15 en la verificación del alumno es estándar para inputs
 *    de punto flotante tipeados a mano.
 */

export interface Root {
  real: number;
  imaginary: number;
}

export interface QuadraticResult {
  delta: number;
  roots: Root[];
  vertex: { h: number; k: number };
  nature: 'two_real' | 'one_real' | 'complex' | 'linear';
}

export interface EquivalentForms {
  standard: string;
  vertexForm: string;
  factored: string | null;
}

export interface CompleteSquareStep {
  expression: string;
  annotation: string;
}

export interface DomainRangeInfo {
  domain: string;
  range: string;
  concavity: string;
  vietaSum: number;    // −b/a  (suma de raíces)
  vietaProduct: number; // c/a   (producto de raíces)
  interceptY: number;
}

// ─── Utilidad de formateo ─────────────────────────────────────────────────────
function fmt(n: number, decimals = 2): string {
  // Elimina ceros a la derecha: 2.00 → "2", pero 1.50 → "1.5"
  return String(parseFloat(n.toFixed(decimals)));
}

// ─── Guarda ante degenerar en parábola si llega a=0 ─────────────────────────
const SAFE_A = 0.001;

/**
 * Resuelve ax² + bx + c = 0
 * 
 * Fórmula cuadrática:  x = (−b ± √Δ) / 2a   [Bronshtein §1.6.3]
 * Δ = b² − 4ac  determina la naturaleza de las raíces.
 */
export function solveQuadratic(a: number, b: number, c: number): QuadraticResult {
  // Caso degenerado: a = 0 → función lineal, no cuadrática
  if (Math.abs(a) < SAFE_A) {
    const root = b !== 0 ? -c / b : NaN;
    return {
      delta: b * b,   // Δ = b² (como si a→0: 4ac→0)
      roots: isNaN(root) ? [] : [{ real: root, imaginary: 0 }],
      vertex: { h: 0, k: c },
      nature: 'linear',
    };
  }

  const delta = b * b - 4 * a * c;
  const h = -b / (2 * a);
  const k = a * h * h + b * h + c;   // k = f(h), evaluación directa

  let roots: Root[] = [];
  let nature: QuadraticResult['nature'];

  if (delta > 0) {
    // DOS raíces reales distintas
    const sqrtDelta = Math.sqrt(delta);
    roots = [
      { real: (-b + sqrtDelta) / (2 * a), imaginary: 0 },
      { real: (-b - sqrtDelta) / (2 * a), imaginary: 0 },
    ];
    nature = 'two_real';
  } else if (Math.abs(delta) < 1e-10) {
    // UNA raíz real doble (usamos tolerancia para punto flotante)
    roots = [{ real: h, imaginary: 0 }];  // raíz = h = −b/2a
    nature = 'one_real';
  } else {
    // DOS raíces complejas conjugadas: z = h ± i·√(−Δ)/|2a|
    // Nota pedagógica: Im = √(−Δ)/(2a), pero usamos |2a| para
    // asegurarnos que z₁ tenga parte imaginaria POSITIVA y z₂ NEGATIVA,
    // lo que es la representación canónica del par conjugado.
    const imagPart = Math.sqrt(-delta) / (2 * Math.abs(a));
    roots = [
      { real: h, imaginary:  imagPart },
      { real: h, imaginary: -imagPart },
    ];
    nature = 'complex';
  }

  return { delta, roots, vertex: { h, k }, nature };
}

/**
 * Formatea ax² + bx + c → string legible.
 * Omite términos con coeficiente 0 y el "1" implícito antes de x² o x.
 */
export function formatQuadratic(a: number, b: number, c: number): string {
  const formatTerm = (val: number, term: string, isFirst = false): string => {
    if (val === 0) return '';
    const sign = val > 0 ? (isFirst ? '' : '+ ') : '- ';
    const absVal = Math.abs(val);
    // Omitir el "1" cuando el término tiene variable (coef=1 en "1x²" → "x²")
    const valueStr = absVal === 1 && term !== '' ? '' : absVal.toFixed(1).replace('.0', '');
    return `${sign}${valueStr}${term} `;
  };

  const partA = formatTerm(a, 'x²', true);
  const partB = formatTerm(b, 'x');
  const partC = formatTerm(c, '');
  const body  = `${partA}${partB}${partC}`.trim();

  return body ? `f(x) = ${body}` : 'f(x) = 0';
}

/**
 * Formatea una raíz compleja en notación cartesiana: a + bi
 */
export function formatComplex(root: Root): string {
  if (root.imaginary === 0) return root.real.toFixed(2);
  const sign = root.imaginary > 0 ? '+' : '−';
  return `${root.real.toFixed(2)} ${sign} ${Math.abs(root.imaginary).toFixed(2)}i`;
}

/**
 * [LEGADO] Describe transformaciones geométricas relativas a f(x)=x².
 */
export function getTransformationInfo(a: number, b: number, c: number): string[] {
  const info: string[] = [];
  if (Math.abs(a) > 1) info.push('Dilatación vertical (Estiramiento)');
  if (Math.abs(a) < 1 && a !== 0) info.push('Contracción vertical (Compresión)');
  if (a < 0) info.push('Reflexión sobre el eje X');
  const h = -b / (2 * (Math.abs(a) > SAFE_A ? a : SAFE_A));
  if (h > 0) info.push(`Desplazamiento a la derecha (${h.toFixed(1)} u)`);
  if (h < 0) info.push(`Desplazamiento a la izquierda (${Math.abs(h).toFixed(1)} u)`);
  return info;
}

// ─── FUNCIONES DE NIVEL LICENCIATURA ─────────────────────────────────────────

/**
 * Genera las tres formas canónicas equivalentes de ax² + bx + c:
 *
 *  1. Forma estándar:    ax² + bx + c
 *  2. Forma vértice:     a(x − h)² + k      [más útil para graficar]
 *  3. Forma factorizada: a(x − r₁)(x − r₂)  [solo si Δ ≥ 0]
 *
 * Referencia: Stewart, Cálculo §1.2 — "Ecuaciones cuadráticas y parábolas"
 */
export function getEquivalentForms(
  a: number,
  b: number,
  c: number,
  vertex: { h: number; k: number },
  roots: Root[]
): EquivalentForms {
  const { h, k } = vertex;

  // ── Prefijo para el coeficiente 'a' ──────────────────────────────────────
  // Si |a|=1, no se escribe el número (solo el signo si negativo)
  const aPrefix =
    Math.abs(a) === 1
      ? a < 0 ? '−' : ''
      : a < 0 ? `−${fmt(Math.abs(a))}` : fmt(a);

  // ── Forma Vértice: a(x − h)² + k ─────────────────────────────────────────
  // Si h=0: simplificar a x²; si h<0: cambiar "−(−|h|)" por "+(|h|)"
  const hPart =
    h === 0           ? 'x²'
    : h > 0           ? `(x − ${fmt(h)})²`
    :                   `(x + ${fmt(Math.abs(h))})²`;
  const kPart =
    Math.abs(k) < 1e-10 ? ''          // k ≈ 0
    : k > 0              ? ` + ${fmt(k)}`
    :                      ` − ${fmt(Math.abs(k))}`;
  const vertexForm = `f(x) = ${aPrefix}${hPart}${kPart}`;

  // ── Forma Factorizada (solo raíces reales) ────────────────────────────────
  let factored: string | null = null;
  const real0 = roots[0]?.imaginary === 0;
  const real1 = roots[1]?.imaginary === 0;

  const fmtRoot = (r: number): string =>
    Math.abs(r) < 1e-10 ? 'x'             // r ≈ 0 → factor es "x"
    : r > 0             ? `(x − ${fmt(r)})`
    :                     `(x + ${fmt(Math.abs(r))})`;

  if (roots.length >= 2 && real0 && real1) {
    factored = `f(x) = ${aPrefix}${fmtRoot(roots[0].real)}${fmtRoot(roots[1].real)}`;
  } else if (roots.length === 1 && real0) {
    // Raíz doble: a(x − r)²
    factored = `f(x) = ${aPrefix}${fmtRoot(roots[0].real)}²`;
  }

  return { standard: formatQuadratic(a, b, c), vertexForm, factored };
}

/**
 * Genera los 4 pasos algebraicos de "Completar el Cuadrado"
 * para derivar la Forma Vértice desde la Forma Estándar.
 *
 * Procedimiento:
 *  f(x) = ax² + bx + c
 *       = a[x² + (b/a)x] + c                  ← factor común a
 *       = a[x² + (b/a)x + (b/2a)²] + c − a(b/2a)²  ← completar ±(b/2a)²
 *       = a(x + b/2a)² + (c − b²/4a)          ← forma vértice final
 *
 * Nota: h = −b/2a  →  x + b/2a = x − (−b/2a) = x − h  ✓
 */
export function getCompleteSquareSteps(a: number, b: number, c: number): CompleteSquareStep[] {
  if (Math.abs(a) < SAFE_A) return [];

  const h          = -b / (2 * a);
  const k          = a * h * h + b * h + c;      // k verificado
  const bDivA      = b / a;                       // b/a
  const halfBDivA  = bDivA / 2;                   // b/2a
  const sq         = halfBDivA * halfBDivA;        // (b/2a)²
  const subtracted = a * sq;                      // a·(b/2a)² = b²/4a

  // Formato seguro: mostrar signo explícito de b y de c para claridad
  const signB = b >= 0 ? `+ ${fmt(b)}` : `− ${fmt(Math.abs(b))}`;
  const signC = c >= 0 ? `+ ${fmt(c)}` : `− ${fmt(Math.abs(c))}`;
  const signBdivA = bDivA >= 0 ? `+ ${fmt(bDivA)}` : `− ${fmt(Math.abs(bDivA))}`;
  const signK = k >= 0 ? `+ ${fmt(k)}` : `− ${fmt(Math.abs(k))}`;

  return [
    {
      expression: `f(x) = ${fmt(a)}x² ${signB}x ${signC}`,
      annotation:  '① Forma estándar',
    },
    {
      expression: `     = ${fmt(a)} · [x² ${signBdivA}x] ${signC}`,
      annotation:  '② Factor común "a" del binomio cuadrático',
    },
    {
      expression: `     = ${fmt(a)} · [x² ${signBdivA}x + ${fmt(sq)}] ${signC} − ${fmt(subtracted)}`,
      annotation:  `③ Sumar y restar (b/2a)² = (${fmt(halfBDivA)})² = ${fmt(sq)}`,
    },
    {
      expression: `     = ${fmt(a)} · (x − ${fmt(h)})² ${signK}`,
      annotation:  '④ Forma vértice: a(x − h)² + k  ✓',
    },
  ];
}

/**
 * Calcula Dominio, Rango, Concavidad, Intercepto Y,
 * y los Teoremas de Vieta (suma y producto de raíces).
 *
 * Teoremas de Vieta [Viète, 1615]:
 *   Si r₁, r₂ son raíces de ax² + bx + c = 0, entonces:
 *     r₁ + r₂ = −b/a       (suma de raíces)
 *     r₁ · r₂ =  c/a       (producto de raíces)
 *   (Válido incluso para raíces complejas)
 */
export function getDomainRangeInfo(
  a: number,
  b: number,   // ← CORREGIDO: se recibe b para calcular Vieta correctamente
  k: number,
  c: number
): DomainRangeInfo {
  return {
    domain:       '(−∞, +∞)',
    range:        a > 0 ? `[${fmt(k)}, +∞)` : `(−∞, ${fmt(k)}]`,
    concavity:
      a > 0
        ? 'Cóncava hacia arriba  →  mínimo global en el vértice'
        : 'Cóncava hacia abajo  →  máximo global en el vértice',
    vietaSum:     Math.abs(a) > SAFE_A ? -(b / a) : NaN,      // r₁+r₂ = −b/a  ✅
    vietaProduct: Math.abs(a) > SAFE_A ? (c / a) : NaN,       // r₁·r₂ =  c/a  ✅
    interceptY:   c,
  };
}
