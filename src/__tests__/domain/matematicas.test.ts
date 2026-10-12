/**
 * Matemáticas 1–10: validadores del dominio y BARRIDO DE SEMILLAS.
 *
 * Contrato: cada semilla (500 por lab) debe ser resoluble moviendo los mandos
 * reales del panel (dentro de su rango y paso), y el estado recién abierto no
 * debe aprobar. El barrido usa el mismo camino que la UI: `entrarLab` siembra y
 * `validarLab` juzga leyendo el STORE.
 */
import {
  validarM1, feedbackM1, puntosObjetivoM1, validarM2, evaluarM2, clasificarSistemaM2,
  validarM3, evaluarM3, factorEnergiaM3, validarM4, evaluarM4, validarM5, solucionesM5,
  validarM6, matrizM6, validarM7, evaluarM7, anguloRefraccionM7, validarM8, tVelocidadMaximaM8,
  velocidadM8, aceleracionM8, validarM9, sumaRiemannM9, errorRelativoM9, INTEGRAL_EXACTA_M9,
  TOLERANCIA_M9, validarM10, evaluarM10, pmfBinomialM10, mediaTeoricaM10, sigmaTeoricaM10,
  chiCuadradaM10, estadisticaMuestraM10, leerNumero, VALORES_NOTABLES_M5, N_MAX_M9,
  type MetodoM9,
} from '@/domain/matematicas';
import { useSimuladorStore } from '@/store/simuladorStore';

const SEMILLAS = 500;
const st = () => useSimuladorStore.getState();
/** Abre el lab como la UI (reset + semilla) y devuelve su veredicto inicial. */
const abrir = (n: number) => { st().entrarLab(`matematicas-${n}`); return st().validarLab(`matematicas-${n}`); };
const juzgar = (n: number) => st().validarLab(`matematicas-${n}`);
/** Valores alcanzables por un <input type="range">. */
const rejilla = (min: number, max: number, paso: number) => {
  const out: number[] = [];
  for (let v = min; v <= max + 1e-9; v += paso) out.push(Math.round(v / paso) * paso);
  return out;
};
const enRejilla = (v: number, min: number, max: number, paso: number) =>
  v >= min - 1e-9 && v <= max + 1e-9 && Math.abs(v / paso - Math.round(v / paso)) < 1e-6;

// Generador determinista (mulberry32) para las muestras de Galton.
function rng(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const muestraGalton = (p: number, N: number, r: () => number) => {
  const c = new Array(11).fill(0);
  for (let i = 0; i < N; i++) { let k = 0; for (let f = 0; f < 10; f++) if (r() < p) k++; c[k]++; }
  return c;
};

// ═════════════════════════════════════════════════════════════════════════════
// M1 Ecuaciones cuadráticas
// ═════════════════════════════════════════════════════════════════════════════
describe('M1 · cuadráticas', () => {
  const target = { a: 2, b: -2, c: -3 };
  it('validarM1 respeta las tolerancias por coeficiente', () => {
    expect(validarM1({ a: 2.14, b: -2, c: -3, target } as any)).toBe(true);
    expect(validarM1({ a: 2.16, b: -2, c: -3, target } as any)).toBe(false);
    expect(validarM1({ a: 2, b: -2.31, c: -3, target } as any)).toBe(false);
    expect(validarM1({ a: 2, b: -2, c: -3.31, target } as any)).toBe(false);
  });
  it('los tres puntos medidos determinan a, b y c (el reto es deducible)', () => {
    const [m, z, p] = puntosObjetivoM1(target).map((q) => q.y);
    expect(z).toBeCloseTo(target.c);
    expect((p - m) / 2).toBeCloseTo(target.b);
    expect((p + m) / 2 - z).toBeCloseTo(target.a);
  });
  it('feedbackM1 orienta sin dar la respuesta', () => {
    expect(feedbackM1({ a: -2, b: -2, c: -3, target } as any)).toMatch(/Concavidad/);
    expect(feedbackM1({ a: 2, b: -2, c: 0, target } as any)).toMatch(/x = 0/);
    const msg = feedbackM1({ a: 4, b: -2, c: -3, target } as any);
    expect(msg).toMatch(/apertura/);
    expect(msg).not.toMatch(/a\s*=\s*2\b/);
  });
  it(`${SEMILLAS} semillas: el estado inicial no aprueba y los mandos del panel sí resuelven`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(1).ok).toBe(false);
      const { target: t } = st().cuadraticas;
      expect(enRejilla(t.a, -5, 5, 0.1) && enRejilla(t.b, -10, 10, 0.5) && enRejilla(t.c, -10, 10, 0.5)).toBe(true);
      // Deducción desde los puntos medidos (lo que hace el alumno).
      const [m, z, p] = puntosObjetivoM1(t).map((q) => q.y);
      const a = Math.round(((p + m) / 2 - z) * 10) / 10, b = Math.round(((p - m) / 2) * 2) / 2, c = Math.round(z * 2) / 2;
      st().setCoefsM1(a, b, c);
      expect(juzgar(1).ok).toBe(false);           // falta comprobar Δ y h en la bitácora
      st().setDeltaVerified(true); st().setVertexVerified(true);
      expect(juzgar(1).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M2 Sistemas 2×2
// ═════════════════════════════════════════════════════════════════════════════
describe('M2 · sistemas 2×2', () => {
  it('validarM2 calcula la intersección y exige el objetivo', () => {
    const r = validarM2({ m1: 1, b1: -5, m2: -1, b2: 5, target: { x: 5, y: 0 } } as any);
    expect(r.isOk).toBe(true);
    expect(r.interseccion?.x).toBeCloseTo(5);
    expect(validarM2({ m1: 1, b1: 0, m2: -1, b2: 0, target: { x: 5, y: 0 } } as any).isOk).toBe(false);
  });
  it('distingue sistema inconsistente (paralelas) de dependiente (misma recta)', () => {
    expect(clasificarSistemaM2(2, 1, 2, 3)).toBe('inconsistente');
    expect(clasificarSistemaM2(2, 1, 2, 1)).toBe('dependiente');
    expect(clasificarSistemaM2(2, 1, -1, 1)).toBe('unica');
    expect(evaluarM2({ m1: 2, b1: 1, m2: 2, b2: 1, target: { x: 0, y: 1 } } as any).mensaje).toMatch(/dependiente/);
    expect(evaluarM2({ m1: 2, b1: 1, m2: 2, b2: 3, target: { x: 0, y: 1 } } as any).mensaje).toMatch(/inconsistente/);
  });
  it(`${SEMILLAS} semillas: resolubles con pendientes de paso 0.1 y ordenadas de paso 0.5`, () => {
    const ms = rejilla(-5, 5, 0.1);
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(2).ok).toBe(false);
      const { x, y } = st().sistemas2x2.target;
      // Rectas del panel que pasan EXACTAMENTE por el objetivo.
      const pasan = ms.map((m) => ({ m, b: y - m * x })).filter((r) => enRejilla(r.b, -10, 10, 0.5));
      const r1 = pasan[0];
      const r2 = pasan.find((r) => Math.abs(r.m - r1.m) > 0.05)!;
      expect(r2).toBeDefined();
      st().setSistemasCoefsM2(r1.m, r1.b, r2.m, r2.b);
      expect(juzgar(2).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M3 Magnitud de momento
// ═════════════════════════════════════════════════════════════════════════════
describe('M3 · magnitud de momento', () => {
  const f = factorEnergiaM3(8, 6);
  it('acepta ±5 % y la coma decimal', () => {
    expect(validarM3({ targetM: 8, magnitudBase: 6, userInputFactor: String(f * 1.049) } as any)).toBe(true);
    expect(validarM3({ targetM: 8, magnitudBase: 6, userInputFactor: String(f * 1.06) } as any)).toBe(false);
    expect(validarM3({ targetM: 8, magnitudBase: 6, userInputFactor: '1000,0' } as any)).toBe(true);
    expect(validarM3({ targetM: 8, magnitudBase: 6, userInputFactor: 'abc' } as any)).toBe(false);
  });
  it('distingue el error de amplitud (10^ΔM) del de energía', () => {
    expect(evaluarM3({ targetM: 8, magnitudBase: 6, userInputFactor: '100' } as any).mensaje).toMatch(/AMPLITUD/);
  });
  it(`${SEMILLAS} semillas: el factor 10^(1.5·ΔM) con 3 cifras resuelve`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(3).ok).toBe(false);
      const { targetM, magnitudBase } = st().richter;
      expect(targetM).not.toBe(magnitudBase);
      st().setUserInputM3(String(Number(factorEnergiaM3(targetM, magnitudBase).toPrecision(3))));
      expect(juzgar(3).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M4 Pitágoras
// ═════════════════════════════════════════════════════════════════════════════
describe('M4 · Pitágoras', () => {
  it('exige el vertido y una c dentro de ±0.1', () => {
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5', llenado: 100 } as any)).toBe(true);
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5,09', llenado: 100 } as any)).toBe(true);
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5.11', llenado: 100 } as any)).toBe(false);
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5', llenado: 40 } as any)).toBe(false);
    expect(evaluarM4({ catetoA: 3, catetoB: 4, userInputC: '25', llenado: 100 } as any).mensaje).toMatch(/c²/);
  });
  it(`${SEMILLAS} semillas: catetos dentro del slider y resolubles`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(4).ok).toBe(false);
      const { catetoA, catetoB } = st().pitagoras;
      expect(enRejilla(catetoA, 1, 10, 0.1) && enRejilla(catetoB, 1, 10, 0.1)).toBe(true);
      st().setUserInputM4(Math.hypot(catetoA, catetoB).toFixed(2));
      expect(juzgar(4).ok).toBe(false);           // sin verter no hay demostración
      st().setLlenadoM4(100);
      expect(juzgar(4).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M5 Círculo trigonométrico
// ═════════════════════════════════════════════════════════════════════════════
describe('M5 · ecuaciones trigonométricas', () => {
  it('cada valor notable tiene dos soluciones enteras distintas que cumplen la ecuación', () => {
    for (const v of VALORES_NOTABLES_M5) for (const funcion of ['sen', 'cos'] as const) {
      const [s1, s2] = solucionesM5({ funcion, valor: v.valor });
      expect(s1).not.toBe(s2);
      for (const s of [s1, s2]) {
        const f = funcion === 'sen' ? Math.sin : Math.cos;
        expect(f((s * Math.PI) / 180)).toBeCloseTo(v.valor, 6);
      }
    }
  });
  it('una sola solución no basta y una captura incorrecta invalida', () => {
    const objetivo = { funcion: 'sen', valor: 0.5, texto: '1/2' };
    expect(validarM5({ objetivo, hallazgos: [{ angulo: 30 }] } as any)).toBe(false);
    expect(validarM5({ objetivo, hallazgos: [{ angulo: 30 }, { angulo: 150 }] } as any)).toBe(true);
    expect(validarM5({ objetivo, hallazgos: [{ angulo: 30 }, { angulo: 150 }, { angulo: 210 }] } as any)).toBe(false);
  });
  it(`${SEMILLAS} semillas: capturar las dos soluciones con el slider (paso 1°) resuelve`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(5).ok).toBe(false);
      const o = st().trigonometria.objetivo!;
      for (const s of solucionesM5(o)) {
        expect(enRejilla(s, 0, 359, 1)).toBe(true);
        st().setAnguloM5(s); st().registrarHallazgoM5();
      }
      expect(juzgar(5).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M6 Transformaciones
// ═════════════════════════════════════════════════════════════════════════════
describe('M6 · transformaciones', () => {
  const target = { tx: 5, ty: 3, rotacion: 90, escala: 2 };
  it('validarM6 compara cada transformación y trata 0° ≡ 360°', () => {
    expect(validarM6({ tx: 5, ty: 3, rotacion: 90, escala: 2, target } as any)).toBe(true);
    expect(validarM6({ tx: 4, ty: 3, rotacion: 90, escala: 2, target } as any)).toBe(false);
    expect(validarM6({ tx: 5, ty: 3, rotacion: 180, escala: 2, target } as any)).toBe(false);
    expect(validarM6({ tx: 0, ty: 0, rotacion: 360, escala: 1, target: { tx: 0, ty: 0, rotacion: 0, escala: 1 } } as any)).toBe(true);
  });
  it('matrizM6 es T·R·S', () => {
    const M = matrizM6(1, 2, 90, 2);
    expect(M[0][0]).toBeCloseTo(0); expect(M[0][1]).toBeCloseTo(-2); expect(M[1][0]).toBeCloseTo(2);
    expect(M[0][2]).toBe(1); expect(M[1][2]).toBe(2);
  });
  it(`${SEMILLAS} semillas: objetivo dentro de los sliders y resoluble`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(6).ok).toBe(false);
      const t = st().geometria6.target;
      expect(enRejilla(t.tx, -5, 5, 0.1) && enRejilla(t.ty, -5, 5, 0.1)).toBe(true);
      expect(enRejilla(t.rotacion, 0, 360, 5) && enRejilla(t.escala, 0.5, 2, 0.1)).toBe(true);
      st().setTransformM6(t.tx, t.ty, t.rotacion, t.escala);
      expect(juzgar(6).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M7 Snell
// ═════════════════════════════════════════════════════════════════════════════
describe('M7 · ley de Snell', () => {
  it('±0.05 y diagnóstico del cociente invertido', () => {
    expect(validarM7({ userInputN2: '1,54', n2Misterio: 1.5 } as any)).toBe(true);
    expect(validarM7({ userInputN2: '1.56', n2Misterio: 1.5 } as any)).toBe(false);
    expect(validarM7({ userInputN2: '', n2Misterio: 1.5 } as any)).toBe(false);
    const ev = evaluarM7({ userInputN2: (1 / 1.5).toFixed(3), n2Misterio: 1.5, n1: 1, anguloIncidencia: 45 } as any);
    expect(ev.mensaje).toMatch(/Invertiste/);
  });
  it(`${SEMILLAS} semillas: con θ₂ leído a 0.1° (como lo muestra la escena) n₂ sale dentro de tolerancia`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(7).ok).toBe(false);
      const { n1, n2Misterio, anguloIncidencia } = st().optica7;
      const t2 = anguloRefraccionM7(n1, n2Misterio, anguloIncidencia)!;
      expect(t2).not.toBeNull();
      const t2Leido = Math.round(t2 * 10) / 10;
      const n2 = (n1 * Math.sin((anguloIncidencia * Math.PI) / 180)) / Math.sin((t2Leido * Math.PI) / 180);
      st().setUserInputM7(n2.toFixed(2));
      expect(juzgar(7).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M8 Derivada
// ═════════════════════════════════════════════════════════════════════════════
describe('M8 · derivada (velocidad máxima)', () => {
  const c = { k: 0.1, m: 1.5 };
  it('t* = m/(3k) anula la aceleración y es máximo de v', () => {
    const t = tVelocidadMaximaM8(c);
    expect(t).toBeCloseTo(5);
    expect(aceleracionM8(c, t)).toBeCloseTo(0);
    expect(velocidadM8(c, t)).toBeGreaterThan(velocidadM8(c, t - 0.5));
    expect(velocidadM8(c, t)).toBeGreaterThan(velocidadM8(c, t + 0.5));
  });
  it('tolerancia ±0.2 s', () => {
    expect(validarM8({ xActual: 5.19, ...c } as any)).toBe(true);
    expect(validarM8({ xActual: 5.25, ...c } as any)).toBe(false);
    expect(validarM8({ xActual: 0, ...c } as any)).toBe(false);
  });
  it(`${SEMILLAS} semillas: marcar t* con el slider (paso 0.01 s) resuelve`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(8).ok).toBe(false);
      const d = st().derivada8;
      const t = tVelocidadMaximaM8(d);
      expect(t).toBeGreaterThan(0.5); expect(t).toBeLessThan(9.5);
      st().setXActualM8(Math.round(t * 100) / 100);
      expect(juzgar(8).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M9 Riemann
// ═════════════════════════════════════════════════════════════════════════════
describe('M9 · sumas de Riemann', () => {
  it('la integral exacta de 0.1x² + 1 en [0, 10] es 130/3 y la suma converge a ella', () => {
    expect(INTEGRAL_EXACTA_M9).toBeCloseTo(43.3333, 4);
    expect(sumaRiemannM9(100000, 'punto_medio')).toBeCloseTo(INTEGRAL_EXACTA_M9, 6);
  });
  it('los tres métodos dan resultados distintos (izq < medio < exacta < der)', () => {
    const iz = sumaRiemannM9(10, 'izquierda'), pm = sumaRiemannM9(10, 'punto_medio'), de = sumaRiemannM9(10, 'derecha');
    expect(iz).toBeLessThan(pm); expect(pm).toBeLessThan(INTEGRAL_EXACTA_M9); expect(INTEGRAL_EXACTA_M9).toBeLessThan(de);
  });
  it('umbrales: izquierda/derecha < 2 %, punto medio < 0.1 %', () => {
    const minimoN = (m: MetodoM9) => { for (let n = 1; n <= N_MAX_M9; n++) if (errorRelativoM9(n, m) < TOLERANCIA_M9[m]) return n; return Infinity; };
    expect(minimoN('izquierda')).toBeLessThanOrEqual(N_MAX_M9);
    expect(minimoN('derecha')).toBeLessThanOrEqual(N_MAX_M9);
    expect(minimoN('punto_medio')).toBeGreaterThan(4);
    expect(minimoN('izquierda')).toBeGreaterThan(20);  // no se aprueba con pocas barras
  });
  it('exige el método del reto', () => {
    expect(validarM9({ n: 100, metodo: 'punto_medio', metodoReto: 'izquierda' } as any)).toBe(false);
    expect(validarM9({ n: 100, metodo: 'izquierda', metodoReto: 'izquierda' } as any)).toBe(true);
    expect(validarM9({ n: 10, metodo: 'izquierda', metodoReto: 'izquierda' } as any)).toBe(false);
  });
  it(`${SEMILLAS} semillas: el método del reto con n del slider resuelve`, () => {
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(9).ok).toBe(false);
      const { metodoReto } = st().integral9;
      st().setIntegralM9(N_MAX_M9, metodoReto);
      expect(juzgar(9).ok).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// M10 Galton
// ═════════════════════════════════════════════════════════════════════════════
describe('M10 · máquina de Galton', () => {
  const esperado = (p: number, N: number) => Array.from({ length: 11 }, (_, k) => Math.round(N * pmfBinomialM10(k, p)));
  const pred = (p: number) => ({ prediccionMedia: mediaTeoricaM10(p).toFixed(2), prediccionSigma: sigmaTeoricaM10(p).toFixed(2) });

  it('la pmf suma 1 y su media/varianza son np y np(1−p)', () => {
    const p = 0.35;
    const pmf = Array.from({ length: 11 }, (_, k) => pmfBinomialM10(k, p));
    expect(pmf.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    const mu = pmf.reduce((s, q, k) => s + q * k, 0);
    expect(mu).toBeCloseTo(mediaTeoricaM10(p), 10);
    expect(pmf.reduce((s, q, k) => s + q * (k - mu) ** 2, 0)).toBeCloseTo(sigmaTeoricaM10(p) ** 2, 10);
  });
  it('exige muestra ≥ 200, predicción correcta y ajuste χ²', () => {
    const p = 0.5;
    expect(validarM10({ probabilidad: p, contenedores: esperado(p, 150), ...pred(p) } as any)).toBe(false);
    expect(validarM10({ probabilidad: p, contenedores: esperado(p, 400), ...pred(p) } as any)).toBe(true);
    expect(validarM10({ probabilidad: p, contenedores: esperado(p, 400), prediccionMedia: '5', prediccionSigma: '2.5' } as any)).toBe(false);
    // Todas las bolitas en el centro: N suficiente pero NO es binomial.
    const pico = new Array(11).fill(0); pico[5] = 400;
    expect(evaluarM10({ probabilidad: p, contenedores: pico, ...pred(p) } as any).mensaje).toMatch(/χ²/);
  });
  it('una muestra de otra p no pasa el χ² (no basta con mover el slider después)', () => {
    const r = rng(7);
    let rechazos = 0;
    for (let i = 0; i < 200; i++) {
      const c = muestraGalton(0.65, 250, r);
      if (chiCuadradaM10(c, 0.5).chi2 > chiCuadradaM10(c, 0.5).critico) rechazos++;
    }
    expect(rechazos).toBeGreaterThanOrEqual(198);
  });
  it('muestras honestas de la binomial pasan el χ² (α = 0.001) casi siempre', () => {
    const r = rng(12345);
    let ok = 0;
    for (let i = 0; i < 500; i++) {
      const p = [0.2, 0.35, 0.5, 0.65, 0.8][i % 5];
      if (validarM10({ probabilidad: p, contenedores: muestraGalton(p, 250, r), ...pred(p) } as any)) ok++;
    }
    expect(ok).toBeGreaterThanOrEqual(495);
  });
  it('estadisticaMuestraM10 calcula x̄ y s', () => {
    const s = estadisticaMuestraM10([0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0]);
    expect(s.N).toBe(2); expect(s.media).toBe(5); expect(s.sigma).toBe(1);
  });
  it(`${SEMILLAS} semillas: predecir μ y σ y soltar 300 bolitas resuelve`, () => {
    const r = rng(2024);
    let ok = 0;
    for (let i = 0; i < SEMILLAS; i++) {
      expect(abrir(10).ok).toBe(false);
      const { probabilidad: p } = st().galton10;
      st().setPrediccionM10(mediaTeoricaM10(p).toFixed(2), sigmaTeoricaM10(p).toFixed(2));
      expect(juzgar(10).ok).toBe(false);             // aún sin muestra
      st().setGalton10({ contenedores: muestraGalton(p, 300, r) });
      if (juzgar(10).ok) ok++;
    }
    expect(ok).toBeGreaterThanOrEqual(SEMILLAS - 5);
  });
  it('cambiar p vacía la máquina', () => {
    abrir(10);
    st().setGalton10({ contenedores: esperado(0.5, 300) });
    st().setProbabilidadM10(0.7);
    expect(st().galton10.contenedores.every((c) => c === 0)).toBe(true);
  });
});

describe('leerNumero', () => {
  it('acepta coma decimal y rechaza texto', () => {
    expect(leerNumero('1,5')).toBe(1.5);
    expect(leerNumero(' 2.25 ')).toBe(2.25);
    expect(Number.isNaN(leerNumero(''))).toBe(true);
    expect(Number.isNaN(leerNumero('abc'))).toBe(true);
  });
});
