/**
 * Dominio de los 10 labs de Biología: modelos científicos y validadores.
 *
 * Todo lo que el panel (Piloto) muestra como resultado de un experimento y todo
 * lo que el botón «Validar práctica» juzga sale de aquí, para que la pantalla y
 * el juez nunca discrepen. Los validadores leen SOLO el estado del store.
 */
import type {
  ResultadoValidacion,
  MicroscopioStateB1, MuestraB1, ObjetivoMagB1,
  TransporteStateB2,
  SintesisStateB3,
  FotosintesisStateB4, ColorLuzB4,
  GeneticaStateB5, ProporcionB5,
  EvolucionStateB6, GenotipoB6, PolillaB6,
  SistemaNerviosoStateB7,
  CardioStateB8, FarmacoB8,
  DigestionStateB9, EnzimaB9, MacronutrienteB9, OrganoB9, IncubacionB9,
  EcosistemaStateB10, ParametrosLVB10,
} from '@/store/types';

/** Generador pseudoaleatorio inyectable (las pruebas usan uno con semilla). */
export type Rng = () => number;

/** mulberry32: PRNG pequeño y determinista para pruebas y barridos de semillas. */
export function rngConSemilla(semilla: number): Rng {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const elegir = <T,>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];
const ok = (): ResultadoValidacion => ({ ok: true });
const falla = (mensaje: string): ResultadoValidacion => ({ ok: false, mensaje });

// ═════════════════════════════════════════════════════════════════════════════
// B1 — Microscopio óptico
// ═════════════════════════════════════════════════════════════════════════════

export const MUESTRAS_B1: Record<MuestraB1, string> = {
  vegetal: 'Hoja de Elodea (montaje en agua)',
  animal: 'Mucosa bucal (azul de metileno)',
  bacteria: 'Yogur natural (tinción de Gram)',
};

/**
 * Misiones posibles. `magMin` = objetivo mínimo con el que la estructura se
 * RESUELVE (ocular 10x): la pared y el contorno celular ya se ven a 100x
 * totales; núcleo y cloroplastos (≈ 5 µm) piden 400x; las bacterias (≈ 1 µm)
 * piden 1000x con aceite de inmersión.
 */
export const OBJETIVOS_B1: readonly { muestra: MuestraB1; organelo: string; magMin: ObjetivoMagB1 }[] = [
  { muestra: 'vegetal', organelo: 'Cloroplastos', magMin: 40 },
  { muestra: 'vegetal', organelo: 'Pared celular', magMin: 10 },
  { muestra: 'animal', organelo: 'Núcleo', magMin: 40 },
  { muestra: 'animal', organelo: 'Membrana plasmática (contorno celular)', magMin: 10 },
  { muestra: 'bacteria', organelo: 'Bacilos y cocos', magMin: 100 },
];

/** Profundidad de campo útil (unidades del tornillo): a más aumento, menos margen. */
export const TOLERANCIA_ENFOQUE_B1: Record<ObjetivoMagB1, number> = { 4: 8, 10: 5, 40: 2.5, 100: 1 };

/**
 * Fracción de la luz que llega al ojo con cada objetivo (lentes de mayor aumento
 * captan un campo más pequeño: la imagen se oscurece y hay que subir el reóstato).
 */
export const TRANSMISION_B1: Record<ObjetivoMagB1, number> = { 4: 1, 10: 0.9, 40: 0.75, 100: 0.6 };
/** Brillo efectivo (iluminación × transmisión) con el que la imagen es legible. */
export const BRILLO_MIN_B1 = 45;
export const BRILLO_MAX_B1 = 75;

export function brilloEfectivoB1(m: Pick<MicroscopioStateB1, 'iluminacion' | 'objetivoMag'>): number {
  return m.iluminacion * (TRANSMISION_B1[m.objetivoMag] ?? 1);
}

/** Desenfoque en px de CSS: 0 en el plano focal, crece fuera de la profundidad de campo. */
export function desenfoqueB1(m: Pick<MicroscopioStateB1, 'enfoqueZ' | 'focoIdealZ' | 'objetivoMag' | 'aceiteInmersionAplicado'>): number {
  const tol = TOLERANCIA_ENFOQUE_B1[m.objetivoMag] ?? 8;
  const dif = Math.abs(m.enfoqueZ - m.focoIdealZ);
  // A 100x sin aceite, la refracción del aire limita la apertura numérica (Abbe): imagen lechosa.
  const sinAceite = m.objetivoMag === 100 && !m.aceiteInmersionAplicado ? 4 : 0;
  return Math.min(14, 2.2 * (dif / tol)) + sinAceite;
}

export function enFocoB1(m: Pick<MicroscopioStateB1, 'enfoqueZ' | 'focoIdealZ' | 'objetivoMag'>): boolean {
  return Math.abs(m.enfoqueZ - m.focoIdealZ) <= (TOLERANCIA_ENFOQUE_B1[m.objetivoMag] ?? 8);
}

export function evaluarB1(m: MicroscopioStateB1): ResultadoValidacion {
  if (m.muestra !== m.muestraObjetivo) return falla('La preparación que está en la platina no es la que pide la misión.');
  if (m.objetivoMag < m.magMin) return falla(`Con este objetivo no se resuelve: ${m.targetOrganelle.toLowerCase()} es más pequeño que el límite de resolución. Necesitas más aumento.`);
  if (m.objetivoMag === 100 && !m.aceiteInmersionAplicado) return falla('El objetivo de 100x es de inmersión: sin aceite la apertura numérica cae y la imagen pierde resolución.');
  const brillo = brilloEfectivoB1(m);
  if (brillo < BRILLO_MIN_B1) return falla('La imagen está demasiado oscura para este objetivo: sube la intensidad de la lámpara.');
  if (brillo > BRILLO_MAX_B1) return falla('La imagen está deslumbrada: baja la intensidad de la lámpara.');
  if (!enFocoB1(m)) return falla('La muestra está fuera de foco: ajusta con el tornillo micrométrico.');
  return ok();
}
export const validarB1 = (m: MicroscopioStateB1): boolean => evaluarB1(m).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B2 — Ósmosis (Boyle–van 't Hoff)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Factor de van 't Hoff del NaCl: 2 partículas por fórmula (ideal; el
 * coeficiente osmótico real a 0.15 M es ≈ 0.93, es decir ≈ 1.86 osmoles por mol).
 * La glucosa no se disocia: i = 1.
 */
export const I_NACL = 2;
export const I_GLUCOSA = 1;
/** Hemólisis: el eritrocito revienta hacia 1.6 veces su volumen (volumen hemolítico crítico). */
export const UMBRAL_LISIS_B2 = 160;
/** La pared celulosa impide que la célula vegetal crezca más allá de ≈ 8 % (turgencia). */
export const VMAX_VEGETAL_B2 = 108;
/** Diferencia de osmolaridad (Osm/L) por debajo de la cual el flujo neto es despreciable. */
export const TOLERANCIA_ISOTONIA_B2 = 0.02;

export const osmolaridadMedioB2 = (nacl: number, glucosa: number) => I_NACL * nacl + I_GLUCOSA * glucosa;
export const osmolaridadCitoplasmaB2 = (concInt: number) => I_NACL * concInt;

/**
 * Volumen de equilibrio (% de V0) según Boyle–van 't Hoff: los solutos del
 * citoplasma se conservan, así que Osm_int·V = Osm_int0·V0 y el agua deja de
 * moverse cuando Osm_int = Osm_ext  →  V = V0 · Osm_int0 / Osm_ext.
 */
export function volumenEquilibrioB2(tipo: TransporteStateB2['tipoCelula'], osmInt0: number, osmExt: number): number {
  const v = osmExt <= 0 ? Infinity : (100 * osmInt0) / osmExt;
  return tipo === 'vegetal' ? Math.min(v, VMAX_VEGETAL_B2) : v;
}

/**
 * Un paso de la ósmosis: dV/dt = Lp(T)·(Osm_int(V) − Osm_ext), con
 * Osm_int(V) = Osm_int0·100/V. La permeabilidad al agua sube con la temperatura (Q10 ≈ 1.5).
 */
export function pasoVolumenB2(v: number, tipo: TransporteStateB2['tipoCelula'], osmInt0: number, osmExt: number, temperatura: number, dt: number): number {
  const lp = 50 * Math.pow(1.5, (temperatura - 25) / 10); // %V0 por (Osm/L · s)
  const osmInt = (osmInt0 * 100) / Math.max(v, 1);
  let nuevo = v + lp * (osmInt - osmExt) * dt;
  if (tipo === 'vegetal') nuevo = Math.min(nuevo, VMAX_VEGETAL_B2);
  return Math.max(20, nuevo);
}

export function evaluarB2(t: TransporteStateB2): ResultadoValidacion {
  if (t.lisada) return falla('La muestra sufrió hemólisis: el medio era demasiado hipotónico. Pide una nueva muestra.');
  const dif = osmolaridadMedioB2(t.concExt, t.glucosaExt) - osmolaridadCitoplasmaB2(t.concInt);
  if (Math.abs(dif) > TOLERANCIA_ISOTONIA_B2) {
    return falla('El medio no es isotónico: la célula todavía gana o pierde agua. Usa el cambio de volumen y la ley de Boyle–van ’t Hoff para calcular la osmolaridad del citoplasma.');
  }
  return ok();
}
export const validarB2 = (t: TransporteStateB2): boolean => evaluarB2(t).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B3 — Síntesis de proteínas
// ═════════════════════════════════════════════════════════════════════════════

/** Apareamiento de la hebra molde de ADN con el ARN que se sintetiza. */
export const COMPLEMENTO_ARN: Record<string, string> = { A: 'U', T: 'A', C: 'G', G: 'C' };

/** Código genético estándar (NCBI tabla 1), 64 codones. */
export const CODIGO_GENETICO: Record<string, { name: string; color: string }> = (() => {
  const familias: [string, string, string[]][] = [
    ['Met', '#3b82f6', ['AUG']],
    ['Phe', '#f97316', ['UUU', 'UUC']],
    ['Leu', '#84cc16', ['UUA', 'UUG', 'CUU', 'CUC', 'CUA', 'CUG']],
    ['Ile', '#f43f5e', ['AUU', 'AUC', 'AUA']],
    ['Val', '#a855f7', ['GUU', 'GUC', 'GUA', 'GUG']],
    ['Ser', '#06b6d4', ['UCU', 'UCC', 'UCA', 'UCG', 'AGU', 'AGC']],
    ['Pro', '#ec4899', ['CCU', 'CCC', 'CCA', 'CCG']],
    ['Thr', '#0ea5e9', ['ACU', 'ACC', 'ACA', 'ACG']],
    ['Ala', '#10b981', ['GCU', 'GCC', 'GCA', 'GCG']],
    ['Tyr', '#d946ef', ['UAU', 'UAC']],
    ['His', '#f59e0b', ['CAU', 'CAC']],
    ['Gln', '#eab308', ['CAA', 'CAG']],
    ['Asn', '#8b5cf6', ['AAU', 'AAC']],
    ['Lys', '#ef4444', ['AAA', 'AAG']],
    ['Asp', '#14b8a6', ['GAU', 'GAC']],
    ['Glu', '#2dd4bf', ['GAA', 'GAG']],
    ['Cys', '#fbbf24', ['UGU', 'UGC']],
    ['Trp', '#7c3aed', ['UGG']],
    ['Arg', '#dc2626', ['CGU', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG']],
    ['Gly', '#6b7280', ['GGU', 'GGC', 'GGA', 'GGG']],
    ['STOP', '#000000', ['UAA', 'UAG', 'UGA']],
  ];
  const mapa: Record<string, { name: string; color: string }> = {};
  for (const [name, color, codones] of familias) for (const c of codones) mapa[c] = { name, color };
  return mapa;
})();

/** Hebra molde (leída 3'→5') → ARNm (5'→3'). */
export const transcribir = (adnPlantilla: string): string =>
  adnPlantilla.split('').map((b) => COMPLEMENTO_ARN[b] ?? '?').join('');

/** Aminoácidos del ARNm desde el primer codón hasta el de paro (sin incluirlo). */
export function traducir(arn: string): string[] {
  const out: string[] = [];
  for (let i = 0; i + 3 <= arn.length; i += 3) {
    const aa = CODIGO_GENETICO[arn.slice(i, i + 3)]?.name ?? '???';
    if (aa === 'STOP') break;
    out.push(aa);
  }
  return out;
}

/** Apareamiento ARN–ARN (codón del ARNm con el anticodón del ARNt). */
export const COMPLEMENTO_ARN_ARN: Record<string, string> = { A: 'U', U: 'A', C: 'G', G: 'C' };
/** Anticodón del ARNt, escrito 3'→5' para alinearlo con el codón 5'→3'. */
export const anticodonB3 = (codon: string): string => codon.split('').map((b) => COMPLEMENTO_ARN_ARN[b] ?? '?').join('');
/** Los codones de paro no tienen ARNt: los reconoce un factor de liberación. */
export const LIBERACION_B3 = 'LIBERACION';

/** Errores de apareamiento tolerados (las bases equivocadas se rechazan y no entran al ARNm). */
export const MAX_ERRORES_B3 = 2;

export function evaluarB3(s: SintesisStateB3): ResultadoValidacion {
  if (s.fase !== 'traduccion' || s.arnMensajero !== transcribir(s.adnPlantilla)) return falla('La transcripción no está completa: aparea cada base de la hebra molde.');
  if (!s.terminada) return falla('La traducción no ha terminado: el ribosoma debe avanzar hasta encontrar un codón de paro.');
  if (s.errores > MAX_ERRORES_B3) return falla(`Cometiste ${s.errores} errores de apareamiento (máximo ${MAX_ERRORES_B3}). Reinicia y transcribe con cuidado.`);
  const esperada = traducir(s.arnMensajero);
  const obtenida = s.proteina.map((a) => a.name);
  if (esperada.length !== obtenida.length || esperada.some((n, i) => n !== obtenida[i])) return falla('La cadena de aminoácidos no corresponde a los codones del ARNm.');
  return ok();
}
export const validarB3 = (s: SintesisStateB3): boolean => evaluarB3(s).ok;

/** Tripletes de la hebra molde que NO dan codón de paro ni de inicio al transcribirse. */
export const POOL_TRIPLETES_B3: readonly string[] = (() => {
  const bases = ['A', 'T', 'C', 'G'];
  const out: string[] = [];
  for (const a of bases) for (const b of bases) for (const c of bases) {
    const t = a + b + c;
    const aa = CODIGO_GENETICO[transcribir(t)]?.name;
    if (aa && aa !== 'STOP' && aa !== 'Met') out.push(t);
  }
  return out;
})();

export function semillaB3(rng: Rng = Math.random): string {
  const medio = Array.from({ length: 3 + Math.floor(rng() * 3) }, () => elegir(POOL_TRIPLETES_B3, rng));
  return ['TAC', ...medio, elegir(['ATT', 'ATC', 'ACT'], rng)].join(''); // ACT → UGA
}

// ═════════════════════════════════════════════════════════════════════════════
// B4 — Fotosíntesis (Elodea): intensidad, espectro y saturación
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Rendimiento cuántico relativo POR FOTÓN incidente con lámparas LED de igual
 * flujo de fotones (PPFD). Curva media de McCree (1972), Agric. Meteorol. 9:
 * 191-216: máximo en el rojo-naranja (≈ 600-640 nm); el azul rinde menos porque
 * parte lo absorben carotenoides y flavonoides que transfieren mal la energía; el
 * verde se absorbe menos pero SÍ impulsa la fotosíntesis (≈ 70 %). El blanco es
 * un promedio ponderado de su espectro. Valores redondeados a 0.05.
 */
export const EFICIENCIA_ESPECTRAL_B4: Record<ColorLuzB4, number> = {
  rojo: 1.0, amarillo: 0.9, blanco: 0.85, azul: 0.75, verde: 0.7,
};
export const NOMBRE_LUZ_B4: Record<ColorLuzB4, string> = {
  rojo: 'Rojo 640 nm', amarillo: 'Ámbar 590 nm', blanco: 'Blanco', azul: 'Azul 450 nm', verde: 'Verde 530 nm',
};
/** PPFD (µmol fotones·m⁻²·s⁻¹) a 10 cm de la lámpara; cae con el inverso del cuadrado. */
export const PPFD_10CM_B4 = 1000;
/** Tasa máxima bruta de la ramita (luz saturante), mL O₂/min. */
export const PMAX_B4 = 0.3;
/** Pendiente inicial de la curva luz-respuesta, mL O₂/min por µmol·m⁻²·s⁻¹ (rojo). */
export const PHI_B4 = 0.0012;
/** Respiración de la ramita, mL O₂/min (se resta: tasa neta). */
export const RESPIRACION_B4 = 0.02;
/** Duración de cada ensayo, min. */
export const DURACION_B4 = 10;
export const D_MAX_B4 = 60;

export const ppfdB4 = (distanciaCm: number) => PPFD_10CM_B4 * (10 / distanciaCm) ** 2;

/** Tasa NETA de O₂ (mL/min): curva exponencial con saturación menos respiración. */
export function tasaNetaB4(color: ColorLuzB4, distanciaCm: number): number {
  const i = ppfdB4(distanciaCm);
  const bruta = PMAX_B4 * (1 - Math.exp((-PHI_B4 * EFICIENCIA_ESPECTRAL_B4[color] * i) / PMAX_B4));
  return bruta - RESPIRACION_B4;
}
/** O₂ recogido en la probeta en un ensayo (no puede ser negativo: bajo el punto de compensación no hay burbujas). */
export const o2EnsayoB4 = (color: ColorLuzB4, distanciaCm: number) =>
  Math.max(0, tasaNetaB4(color, distanciaCm) * DURACION_B4);

/** Meta: a la distancia mínima, entre lo que da la mejor luz y la segunda mejor. */
export function metaB4(dMin: number): number {
  const mejor = o2EnsayoB4('rojo', dMin);
  const segunda = o2EnsayoB4('amarillo', dMin);
  return Math.round(((mejor + segunda) / 2) * 100) / 100;
}

export function evaluarB4(f: FotosintesisStateB4): ResultadoValidacion {
  if (f.ensayos.length === 0) return falla('Aún no has hecho ningún ensayo: enciende la lámpara y mide el O₂ recogido.');
  const logrado = f.ensayos.some((e) => e.distancia >= f.dMin && o2EnsayoB4(e.color, e.distancia) >= f.meta);
  if (!logrado) return falla(`Ningún ensayo alcanzó ${f.meta.toFixed(2)} mL de O₂. Compara tus ensayos: ¿qué color y qué distancia dan más O₂ por fotón?`);
  return ok();
}
export const validarB4 = (f: FotosintesisStateB4): boolean => evaluarB4(f).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B5 — Herencia mendeliana (dihibridismo en chícharo)
// ═════════════════════════════════════════════════════════════════════════════

export const FENOTIPOS_B5 = ['Amarilla-lisa', 'Amarilla-rugosa', 'Verde-lisa', 'Verde-rugosa'] as const;
/** χ² crítico con α = 0.05 por grados de libertad (tablas estándar de Fisher). */
export const CHI2_CRITICO_05: Record<number, number> = { 1: 3.841, 2: 5.991, 3: 7.815 };
export const N_MIN_B5 = 100;
export const TAMANIOS_B5 = [10, 50, 100, 500, 1000] as const;

/** Cruzas de la misión (progenitores con fenotipos distintos de la descendencia). */
export const CRUZAS_B5: readonly [string, string][] = [
  ['AaBb', 'AaBb'], ['AaBb', 'aabb'], ['Aabb', 'aaBb'], ['AaBb', 'Aabb'], ['AaBb', 'aaBb'], ['AABb', 'aaBb'],
];

/** Gametos y su probabilidad (segunda ley: segregación independiente). */
export function gametosB5(genotipo: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of genotipo.slice(0, 2)) for (const b of genotipo.slice(2, 4)) out[a + b] = (out[a + b] ?? 0) + 0.25;
  return out;
}

export function claseFenotipoB5(genotipo: string): number {
  const amarilla = genotipo.slice(0, 2).includes('A');
  const lisa = genotipo.slice(2, 4).includes('B');
  return amarilla ? (lisa ? 0 : 1) : (lisa ? 2 : 3);
}

const unirGametos = (g1: string, g2: string) =>
  [g1[0], g2[0]].sort().join('') + [g1[1], g2[1]].sort().join('');

/** Proporción esperada de las 4 clases fenotípicas (suma 1). */
export function proporcionEsperadaB5(p1: string, p2: string): ProporcionB5 {
  const out: ProporcionB5 = [0, 0, 0, 0];
  const ga = gametosB5(p1), gb = gametosB5(p2);
  for (const [a, pa] of Object.entries(ga)) for (const [b, pb] of Object.entries(gb)) out[claseFenotipoB5(unirGametos(a, b))] += pa * pb;
  return out;
}

/** La predicción del alumno (enteros tipo 9:3:3:1) es equivalente a la teórica. */
export function prediccionCorrectaB5(pred: ProporcionB5, p1: string, p2: string): boolean {
  const suma = pred.reduce((s, x) => s + x, 0);
  if (!(suma > 0) || pred.some((x) => x < 0 || !Number.isFinite(x))) return false;
  const esp = proporcionEsperadaB5(p1, p2);
  return pred.every((x, i) => Math.abs(x / suma - esp[i]) < 1e-9);
}

export function cruzarB5(p1: string, p2: string, n: number, rng: Rng = Math.random): { genotipos: string[]; observados: ProporcionB5 } {
  const ga = Object.keys(gametosB5(p1)).flatMap((g) => Array(gametosB5(p1)[g] * 4).fill(g) as string[]);
  const gb = Object.keys(gametosB5(p2)).flatMap((g) => Array(gametosB5(p2)[g] * 4).fill(g) as string[]);
  const genotipos: string[] = [];
  const observados: ProporcionB5 = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const g = unirGametos(elegir(ga, rng), elegir(gb, rng));
    genotipos.push(g);
    observados[claseFenotipoB5(g)]++;
  }
  return { genotipos, observados };
}

/** χ² de bondad de ajuste contra la proporción predicha (solo clases con esperado > 0). */
export function chiCuadradaB5(observados: ProporcionB5, prediccion: ProporcionB5): { chi2: number; gl: number; critico: number } | null {
  const n = observados.reduce((s, x) => s + x, 0);
  const suma = prediccion.reduce((s, x) => s + x, 0);
  if (n === 0 || !(suma > 0)) return null;
  let chi2 = 0, clases = 0;
  for (let i = 0; i < 4; i++) {
    const esp = (n * prediccion[i]) / suma;
    if (esp > 0) { chi2 += (observados[i] - esp) ** 2 / esp; clases++; }
    else if (observados[i] > 0) return { chi2: Infinity, gl: Math.max(1, clases), critico: CHI2_CRITICO_05[1] };
  }
  const gl = Math.max(1, clases - 1);
  return { chi2, gl, critico: CHI2_CRITICO_05[Math.min(3, gl)] };
}

export function evaluarB5(g: GeneticaStateB5): ResultadoValidacion {
  const c = g.cruza;
  if (!c || c.padre1 !== g.padre1 || c.padre2 !== g.padre2) return falla('Aún no has hecho la cruza de la misión.');
  if (c.n < N_MIN_B5) return falla(`Con ${c.n} semillas el azar pesa demasiado: repite la cruza con al menos ${N_MIN_B5}.`);
  if (!prediccionCorrectaB5(c.prediccion, c.padre1, c.padre2)) return falla('Tu predicción no es la que dictan las leyes de Mendel para esta cruza. Escribe los gametos de cada progenitor y arma el cuadro de Punnett.');
  return ok();
}
export const validarB5 = (g: GeneticaStateB5): boolean => evaluarB5(g).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B6 — Selección natural (Biston betularia, melanismo industrial)
// ═════════════════════════════════════════════════════════════════════════════

/** Alelo C (carbonaria, oscuro) dominante sobre c (typica, clara). */
export const N_POLILLAS_B6 = 40;
/** El ave se come el 40 % de cada generación (selección fuerte, como en los experimentos de Kettlewell en troncos expuestos). */
export const CUOTA_CAZA_B6 = 16;
export const GENERACIONES_MIN_B6 = 3;
export const GENERACIONES_MAX_B6 = 6;
export const DELTA_P_MIN_B6 = 0.15;
/** Selectividad media mínima: sin ella, un cambio de frecuencia puede ser pura deriva génica. */
export const SELECTIVIDAD_MIN_B6 = 0.1;

export const aleloFavorecidoB6 = (ambiente: EvolucionStateB6['ambiente']): 'C' | 'c' => (ambiente === 'industrial' ? 'C' : 'c');
export const fenotipoB6 = (g: GenotipoB6): 'clara' | 'oscura' => (g.includes('C') ? 'oscura' : 'clara');
/** Fenotipo que contrasta con la corteza (el que un ave detecta primero). */
export const fenotipoConspicuoB6 = (ambiente: EvolucionStateB6['ambiente']): 'clara' | 'oscura' => (ambiente === 'industrial' ? 'clara' : 'oscura');

/** Cazadas conspicuas / cazadas − conspicuas / población (antes de la caza). */
export function selectividadB6(bugs: readonly PolillaB6[], ambiente: EvolucionStateB6['ambiente']): number {
  const visible = fenotipoConspicuoB6(ambiente);
  const cazadas = bugs.filter((b) => b.cazada);
  if (cazadas.length === 0 || bugs.length === 0) return 0;
  return cazadas.filter((b) => b.tipo === visible).length / cazadas.length - bugs.filter((b) => b.tipo === visible).length / bugs.length;
}

/** Frecuencia de un alelo en una lista de genotipos. */
export function frecuenciaAleloB6(genotipos: readonly GenotipoB6[], alelo: 'C' | 'c'): number {
  if (genotipos.length === 0) return 0;
  let n = 0;
  for (const g of genotipos) for (const a of g) if (a === alelo) n++;
  return n / (2 * genotipos.length);
}

/**
 * Población de N polillas con una frecuencia de C dada: se reparten exactamente
 * round(2N·p) alelos C y se aparean al azar (unión aleatoria de gametos → Hardy-Weinberg).
 */
export function crearPoblacionB6(pC: number, n: number, rng: Rng = Math.random, idBase = 0): PolillaB6[] {
  const nC = Math.round(2 * n * pC);
  const alelos: ('C' | 'c')[] = Array.from({ length: 2 * n }, (_, i) => (i < nC ? 'C' : 'c'));
  for (let i = alelos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [alelos[i], alelos[j]] = [alelos[j], alelos[i]];
  }
  return Array.from({ length: n }, (_, i) => {
    const par = [alelos[2 * i], alelos[2 * i + 1]].sort().join('') as GenotipoB6; // 'C' < 'c'
    return {
      id: idBase + i, genotipo: par, tipo: fenotipoB6(par),
      x: 5 + rng() * 90, y: 5 + rng() * 85, angle: rng() * Math.PI * 2, cazada: false,
    };
  });
}

/** Las supervivientes se reproducen: la nueva generación hereda su frecuencia alélica. */
export function reproducirB6(bugs: readonly PolillaB6[], n: number, rng: Rng = Math.random, idBase = 0): PolillaB6[] {
  const vivas = bugs.filter((b) => !b.cazada).map((b) => b.genotipo);
  return crearPoblacionB6(frecuenciaAleloB6(vivas, 'C'), n, rng, idBase);
}

/** q estimada a partir del FENOTIPO recesivo (lo único que ve un naturalista): q = √f(cc). */
export function qEstimadaB6(bugs: readonly PolillaB6[]): number {
  const vivas = bugs.filter((b) => !b.cazada);
  if (vivas.length === 0) return 0;
  return Math.sqrt(vivas.filter((b) => b.tipo === 'clara').length / vivas.length);
}

export function pFavActualB6(e: EvolucionStateB6): number {
  return frecuenciaAleloB6(e.bugs.map((b) => b.genotipo), aleloFavorecidoB6(e.ambiente));
}

export function evaluarB6(e: EvolucionStateB6): ResultadoValidacion {
  if (e.historial.length < GENERACIONES_MIN_B6) return falla(`Completa al menos ${GENERACIONES_MIN_B6} generaciones de depredación (llevas ${e.historial.length}).`);
  const selectividad = e.historial.reduce((s, h) => s + h.selectividad, 0) / e.historial.length;
  if (selectividad < SELECTIVIDAD_MIN_B6) return falla('Tu caza fue prácticamente al azar: así la frecuencia solo cambia por deriva génica, no por selección. Actúa como un ave que busca su alimento sobre esta corteza.');
  const delta = e.historial[e.historial.length - 1].pFav - e.pInicialFav;
  if (delta < DELTA_P_MIN_B6) return falla('La frecuencia del alelo mejor camuflado en este ambiente no aumentó lo suficiente. ¿Qué polillas vería primero un ave sobre esta corteza?');
  return ok();
}
export const validarB6 = (e: EvolucionStateB6): boolean => evaluarB6(e).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B7 — Arco reflejo rotuliano y velocidad de conducción
// ═════════════════════════════════════════════════════════════════════════════

/** Retardo de la sinapsis central (monosináptica Ia → motoneurona α), ms. */
export const RETARDO_SINAPSIS_B7 = 0.7;
/** Retardo de la placa neuromuscular, ms. */
export const RETARDO_PLACA_B7 = 0.8;
/** Límite inferior de la velocidad de conducción normal en nervios del miembro inferior, m/s. */
export const VEL_NORMAL_MIN_B7 = 45;
export const TOLERANCIA_VEL_B7 = 0.1;

/**
 * Velocidad de conducción (m/s) según la integridad de la mielina: ≈ 65 m/s con
 * mielina sana (fibras Aα), y cae de forma no lineal al perder mielina hasta la
 * conducción continua de una fibra casi desnuda (≈ 6 m/s).
 */
export const velocidadConduccionB7 = (mielina: number) => 6 + 59 * (Math.max(0, Math.min(100, mielina)) / 100) ** 2;

/** Latencia golpe → contracción (ms): conducción por el camino completo + retardos fijos. Redondeada a 0.1 ms. */
export function latenciaB7(distanciaM: number, mielina: number): number {
  const ms = (distanciaM / velocidadConduccionB7(mielina)) * 1000 + RETARDO_SINAPSIS_B7 + RETARDO_PLACA_B7;
  return Math.round(ms * 10) / 10;
}

export const diagnosticoRealB7 = (mielina: number): 'normal' | 'desmielinizante' =>
  velocidadConduccionB7(mielina) >= VEL_NORMAL_MIN_B7 ? 'normal' : 'desmielinizante';

export function evaluarB7(s: SistemaNerviosoStateB7): ResultadoValidacion {
  if (!s.ensayos.some((e) => e.respuesta)) return falla('Aún no has registrado ningún reflejo: golpea el tendón con fuerza suficiente.');
  if (!s.ensayos.some((e) => !e.respuesta)) return falla('Demuestra la ley del todo o nada: busca una fuerza por debajo del umbral que NO produzca reflejo.');
  if (s.velocidadEstimada === null) return falla('Calcula la velocidad de conducción con tu latencia y la distancia del arco.');
  const v = velocidadConduccionB7(s.integridadMielina);
  if (Math.abs(s.velocidadEstimada - v) > TOLERANCIA_VEL_B7 * v) return falla('Tu velocidad de conducción no cuadra con la latencia medida. Resta los retardos sinápticos antes de dividir la distancia entre el tiempo.');
  if (s.diagnostico !== diagnosticoRealB7(s.integridadMielina)) return falla(`Revisa el diagnóstico: compara tu velocidad con el límite normal (${VEL_NORMAL_MIN_B7} m/s).`);
  return ok();
}
export const validarB7 = (s: SistemaNerviosoStateB7): boolean => evaluarB7(s).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B8 — Electrocardiograma y control autonómico de la frecuencia
// ═════════════════════════════════════════════════════════════════════════════

export const FC_NORMAL_MIN_B8 = 60;
export const FC_NORMAL_MAX_B8 = 100;
export const TOLERANCIA_LECTURA_B8 = 5;

/**
 * Efecto por dosis (simplificado y lineal) y tope de dosis:
 * - Atropina 0.5 mg IV: antagonista muscarínico, quita el freno vagal → +12 lpm. Máx. 3 mg.
 * - Metoprolol 2.5 mg IV: bloqueador β1, frena el nodo SA → −10 lpm. Máx. 15 mg.
 * - Adrenalina 10 µg IV: agonista β1 → +20 lpm. Máx. 3 bolos.
 */
export const FARMACOS_B8: Record<FarmacoB8, { nombre: string; dosis: string; efecto: number; max: number }> = {
  atropina: { nombre: 'Atropina', dosis: '0.5 mg', efecto: 12, max: 6 },
  metoprolol: { nombre: 'Metoprolol', dosis: '2.5 mg', efecto: -10, max: 6 },
  adrenalina: { nombre: 'Adrenalina', dosis: '10 µg', efecto: 20, max: 3 },
};

export function fcConDosisB8(fcInicial: number, dosis: Record<FarmacoB8, number>): number {
  let fc = fcInicial;
  for (const f of Object.keys(FARMACOS_B8) as FarmacoB8[]) fc += FARMACOS_B8[f].efecto * (dosis[f] ?? 0);
  return Math.max(30, Math.min(200, Math.round(fc)));
}

export function clasificarRitmoB8(fc: number): 'bradicardia' | 'taquicardia' | 'normal' {
  return fc < FC_NORMAL_MIN_B8 ? 'bradicardia' : fc > FC_NORMAL_MAX_B8 ? 'taquicardia' : 'normal';
}

/**
 * Tiempos del ciclo (ms) para un intervalo RR: PR 160, QRS 90 y QT por Bazett
 * (QTc = 400 ms → QT = 400·√RR[s]). Si no caben en el RR (FC muy alta), se comprimen.
 */
export function tiemposCicloB8(rrMs: number) {
  let p = 100, pr = 160, qrs = 90, qt = 400 * Math.sqrt(rrMs / 1000), t = 160;
  const fin = pr + qt;
  if (fin > rrMs - 40) {
    const k = (rrMs - 40) / fin;
    p *= k; pr *= k; qrs *= k; qt *= k; t *= k;
  }
  return { p, pr, qrsFin: pr + qrs, tIni: pr + qt - t, tFin: pr + qt };
}

/** Derivación II, en mV, a `tMs` desde el inicio de la onda P. */
export function ecgMvB8(tMs: number, rrMs: number): number {
  const c = tiemposCicloB8(rrMs);
  const t = ((tMs % rrMs) + rrMs) % rrMs;
  if (t < c.p) return 0.15 * Math.sin((t / c.p) * Math.PI);
  if (t < c.pr) return 0;
  if (t < c.qrsFin) {
    const q = (t - c.pr) / (c.qrsFin - c.pr);
    const puntos: [number, number][] = [[0, 0], [0.17, -0.1], [0.39, 1.2], [0.61, -0.3], [0.85, 0], [1, 0]];
    for (let i = 1; i < puntos.length; i++) {
      if (q <= puntos[i][0]) {
        const [x0, y0] = puntos[i - 1], [x1, y1] = puntos[i];
        return y0 + ((q - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return 0;
  }
  if (t < c.tIni) return 0;
  if (t < c.tFin) return 0.3 * Math.sin(((t - c.tIni) / (c.tFin - c.tIni)) * Math.PI);
  return 0;
}

export function faseCicloB8(tMs: number, rrMs: number): string {
  const c = tiemposCicloB8(rrMs);
  const t = ((tMs % rrMs) + rrMs) % rrMs;
  if (t < c.p) return 'Onda P · despolarización auricular';
  if (t < c.pr) return 'Segmento PR · retraso en el nodo AV';
  if (t < c.qrsFin) return 'Complejo QRS · despolarización ventricular';
  if (t < c.tIni) return 'Segmento ST · ventrículos contraídos';
  if (t < c.tFin) return 'Onda T · repolarización ventricular';
  return 'Diástole · llenado ventricular';
}

/** Contracción 0..1: aurículas tras la onda P; ventrículos del QRS al final de la T (sístole). */
export function contraccionB8(tMs: number, rrMs: number): { auriculas: number; ventriculos: number } {
  const c = tiemposCicloB8(rrMs);
  const t = ((tMs % rrMs) + rrMs) % rrMs;
  const campana = (x: number, a: number, b: number) => (x <= a || x >= b ? 0 : Math.sin(((x - a) / (b - a)) * Math.PI));
  return {
    auriculas: campana(t, c.p * 0.6, c.pr + 40),
    ventriculos: campana(t, c.pr + 30, c.tFin),
  };
}

export function evaluarB8(c: CardioStateB8): ResultadoValidacion {
  if (c.diagnostico === null) return falla('Primero registra tu diagnóstico del ritmo con el que llegó el paciente.');
  if (c.diagnostico !== c.tipo) return falla('El diagnóstico inicial no corresponde al trazo. Mide el intervalo R-R del ECG de llegada.');
  const zona = clasificarRitmoB8(c.ritmoBPM);
  if (zona !== 'normal') return falla(`El paciente sigue fuera del ritmo sinusal normal (${FC_NORMAL_MIN_B8}–${FC_NORMAL_MAX_B8} lpm). Mide la FC en el trazo y ajusta el tratamiento.`);
  if (c.lecturaFC === null || Math.abs(c.lecturaFC - c.ritmoBPM) > TOLERANCIA_LECTURA_B8) return falla('Registra la FC que mides AHORA en el trazo (FC = 60 / R-R en segundos).');
  return ok();
}
export const validarB8 = (c: CardioStateB8): boolean => evaluarB8(c).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B9 — Digestión enzimática
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Enzimas del laboratorio. pH óptimos y desnaturalización según textos de
 * fisiología (Guyton & Hall, 14.ª ed., cap. 66):
 * - amilasa salival: almidón, pH óptimo ≈ 6.8; el ácido gástrico la inactiva.
 * - pepsina: proteínas, pH óptimo ≈ 2; se desnaturaliza de forma irreversible por encima de pH ≈ 7.
 * - tripsina (pancreática): proteínas, pH óptimo ≈ 8; a pH ácido queda inactiva pero no se destruye.
 * - lipasa pancreática: triglicéridos, pH óptimo ≈ 8; necesita sales biliares que
 *   emulsionen la grasa; el ácido la desnaturaliza.
 */
export const ENZIMAS_B9: Record<EnzimaB9, {
  nombre: string; sustrato: MacronutrienteB9; organo: OrganoB9; phOptimo: number;
  desnaturaliza: (ph: number) => boolean; requiereBilis: boolean;
}> = {
  amilasa: { nombre: 'Amilasa salival', sustrato: 'almidon', organo: 'boca', phOptimo: 6.8, desnaturaliza: (ph) => ph <= 4, requiereBilis: false },
  pepsina: { nombre: 'Pepsina', sustrato: 'proteina', organo: 'estomago', phOptimo: 2.0, desnaturaliza: (ph) => ph >= 7, requiereBilis: false },
  tripsina: { nombre: 'Tripsina', sustrato: 'proteina', organo: 'delgado', phOptimo: 8.0, desnaturaliza: () => false, requiereBilis: false },
  lipasa: { nombre: 'Lipasa pancreática', sustrato: 'lipido', organo: 'delgado', phOptimo: 8.0, desnaturaliza: (ph) => ph <= 4, requiereBilis: true },
};
export const MACRONUTRIENTES_B9: Record<MacronutrienteB9, { nombre: string; alimento: string; monomero: string }> = {
  almidon: { nombre: 'Almidón', alimento: 'tortilla de maíz', monomero: 'maltosa → glucosa' },
  proteina: { nombre: 'Proteína', alimento: 'clara de huevo', monomero: 'péptidos → aminoácidos' },
  lipido: { nombre: 'Lípidos', alimento: 'aceite de oliva', monomero: 'ácidos grasos y monoglicéridos' },
};
export const ORGANOS_B9: Record<OrganoB9, string> = {
  boca: 'Boca', estomago: 'Estómago', delgado: 'Intestino delgado', grueso: 'Intestino grueso',
};
/** Ancho de la campana de actividad frente al pH. */
export const SIGMA_PH_B9 = 1.2;
/** Incubación de 30 min a 37 °C: con actividad plena se hidroliza el 99 %. */
export const HIDROLISIS_COMPLETA_B9 = 0.9;

export function incubarB9(sustrato: MacronutrienteB9, enzima: EnzimaB9, ph: number, bilis: boolean): IncubacionB9 {
  const e = ENZIMAS_B9[enzima];
  const base = { enzima, pH: ph, bilis };
  if (e.sustrato !== sustrato) return { ...base, resultado: 'sin_reaccion', hidrolisis: 0 };
  if (e.desnaturaliza(ph)) return { ...base, resultado: 'desnaturalizada', hidrolisis: 0 };
  const actividad = Math.exp(-(((ph - e.phOptimo) / SIGMA_PH_B9) ** 2));
  const superficie = e.requiereBilis && !bilis ? 0.12 : 1; // grasa sin emulsionar: poca interfase agua-lípido
  const hidrolisis = 1 - Math.exp(-4.6 * actividad * superficie);
  return { ...base, resultado: hidrolisis >= HIDROLISIS_COMPLETA_B9 ? 'completa' : 'parcial', hidrolisis };
}

export function evaluarB9(d: DigestionStateB9): ResultadoValidacion {
  const e = d.ensayo;
  if (!e) return falla('Aún no has incubado ningún tubo de ensayo.');
  if (e.resultado === 'sin_reaccion') return falla('En tu último tubo no hubo reacción: las enzimas son específicas de su sustrato.');
  if (e.resultado === 'desnaturalizada') return falla('En tu último tubo la enzima se desnaturalizó: el pH estaba fuera de lo que su estructura tolera.');
  if (e.resultado !== 'completa') return falla('La hidrólisis quedó incompleta: revisa el pH y, si el sustrato es grasa, cómo se emulsiona.');
  if (d.organoRespuesta !== ENZIMAS_B9[e.enzima].organo) return falla('Revisa en qué órgano actúa la enzima que usaste: su pH óptimo es una pista.');
  if (d.absorcionRespuesta !== 'delgado') return falla('Revisa dónde se absorben los monómeros: busca el órgano con vellosidades y microvellosidades.');
  return ok();
}
export const validarB9 = (d: DigestionStateB9): boolean => evaluarB9(d).ok;

// ═════════════════════════════════════════════════════════════════════════════
// B10 — Depredador-presa (Lotka-Volterra) integrado con RK4
// ═════════════════════════════════════════════════════════════════════════════

export const DT_B10 = 0.01;           // años por paso de RK4
export const T_OBJETIVO_B10 = 50;     // años que el ecosistema debe sostenerse
export const UMBRAL_EXTINCION_B10 = 1; // menos de un individuo = especie extinta
export const RANGOS_B10: Record<keyof ParametrosLVB10, { min: number; max: number; paso: number }> = {
  alpha: { min: 0.1, max: 1.5, paso: 0.01 },
  beta: { min: 0.001, max: 0.1, paso: 0.001 },
  gamma: { min: 0.1, max: 1.5, paso: 0.01 },
  delta: { min: 0.001, max: 0.1, paso: 0.001 },
};

/** dx/dt = αx − βxy (presas) · dy/dt = δxy − γy (depredadores). */
function derivLV(x: number, y: number, p: ParametrosLVB10): [number, number] {
  return [p.alpha * x - p.beta * x * y, p.delta * x * y - p.gamma * y];
}

/** Un paso de Runge-Kutta de 4.º orden (Euler explícito haría crecer las órbitas hasta el colapso). */
export function pasoRK4B10(x: number, y: number, p: ParametrosLVB10, dt = DT_B10): [number, number] {
  const [k1x, k1y] = derivLV(x, y, p);
  const [k2x, k2y] = derivLV(x + (dt / 2) * k1x, y + (dt / 2) * k1y, p);
  const [k3x, k3y] = derivLV(x + (dt / 2) * k2x, y + (dt / 2) * k2y, p);
  const [k4x, k4y] = derivLV(x + dt * k3x, y + dt * k3y, p);
  return [x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y)];
}

export function extincionB10(x: number, y: number): false | 'presas' | 'depredadores' {
  if (x < UMBRAL_EXTINCION_B10) return 'presas';
  if (y < UMBRAL_EXTINCION_B10) return 'depredadores';
  return false;
}

/** Simula de 0 a T años; se detiene en la primera extinción. */
export function simularLVB10(p: ParametrosLVB10, x0: number, y0: number, T = T_OBJETIVO_B10) {
  let x = x0, y = y0, t = 0;
  const pasos = Math.round(T / DT_B10);
  for (let i = 0; i < pasos; i++) {
    [x, y] = pasoRK4B10(x, y, p);
    t = (i + 1) * DT_B10;
    const ext = extincionB10(x, y);
    if (ext) return { extincion: ext, t, x, y };
  }
  return { extincion: false as const, t, x, y };
}

export const equilibrioLVB10 = (p: ParametrosLVB10) => ({ presas: p.gamma / p.delta, depredadores: p.alpha / p.beta });

const mismosParametros = (a: ParametrosLVB10, b: ParametrosLVB10) =>
  (Object.keys(a) as (keyof ParametrosLVB10)[]).every((k) => Math.abs(a[k] - b[k]) < 1e-12);

export function evaluarB10(e: EcosistemaStateB10): ResultadoValidacion {
  const c = e.corrida;
  if (!c) return falla('Aún no has completado ninguna corrida: inicia la simulación.');
  if (c.extincion) return falla(c.extincion === 'presas' ? 'En tu última corrida las presas se extinguieron. Ajusta los parámetros y vuelve a correr desde el inicio.' : 'En tu última corrida los depredadores se extinguieron. Ajusta los parámetros y vuelve a correr desde el inicio.');
  if (c.t < T_OBJETIVO_B10 - 1e-9) return falla(`La corrida debe sostenerse ${T_OBJETIVO_B10} años sin interrupciones (llegaste a ${c.t.toFixed(1)}).`);
  if (!mismosParametros(c.parametros, e.parametros)) return falla('Cambiaste los parámetros después de la corrida: vuelve a correrla.');
  // El juez repite la simulación: la corrida debe ser reproducible con estos parámetros.
  if (simularLVB10(e.parametros, e.presasIniciales, e.depredadoresIniciales).extincion) return falla('Con estos parámetros el ecosistema no se sostiene 50 años.');
  return ok();
}
export const validarB10 = (e: EcosistemaStateB10): boolean => evaluarB10(e).ok;
