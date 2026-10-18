/**
 * F3 · Péndulo simple: la física que mueve la escena y el dock (fis03/pendulo.ts y reloj.ts).
 *  · T₀ = 2π√(L/g) y su coherencia con el dominio (el validador del reto).
 *  · K(k) por la media aritmético-geométrica contra la tabla 17.1 de Abramowitz & Stegun,
 *    contra Γ(1/4)²/(4√π) y contra una cuadratura independiente.
 *  · T = 4√(L/g)·K(sen θ₀/2) contra el periodo que mide la fotopuerta sobre la integración
 *    RK4 de la ecuación completa, de 2° a 150°; la serie 1 + θ²/16 + 11θ⁴/3072 y su error O(θ⁶).
 *  · Energía conservada, ω máxima, tensión del hilo, péndulo lineal amortiguado exacto.
 *  · Reloj: fotopuerta, oscilaciones, medidas T(θ₀), cronómetro en tiempo de modelo, mano.
 */
import {
  GRAD, RHO_LATON, GAMMA_AMORTIGUADO, agm, elipticaK, razonPeriodo, periodoExacto, periodoPequeno, razonSerie,
  periodoSerie, periodoSimulado, pasoRK4, avanzar, energiaEspecifica, omegaMaxima, lineal, radioEsfera,
  tensionHilo, aceleracion, DetectorPasos, type ParamsPendulo, type EstadoPendulo,
} from '@/components/simuladores/fis03/pendulo';
import { RelojPendulo } from '@/components/simuladores/fis03/reloj';
import { periodoPendulo, TOL_MUESTRA_PERIODO, TOL_RESULTADO_CRONO, G_TIERRA } from '@/domain/fisica';

const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
const P = (L: number, g: number, gamma = 0): ParamsPendulo => ({ L, g, gamma });

describe('periodo de ángulo pequeño', () => {
  it('T₀ = 2π√(L/g): 1 m en la Tierra da 2,006067 s', () => {
    expect(periodoPequeno(1, 9.81)).toBeCloseTo(2.0060666807, 9);
    expect(periodoPequeno(0.25, 9.81)).toBeCloseTo(2.0060666807 / 2, 9);
  });

  it('es el mismo T₀ que usa el validador del reto (dominio)', () => {
    for (const L of [0.5, 1, 1.5, 2, 2.5, 3]) for (const g of [3.7, 9.81, 24.7]) {
      expect(rel(periodoPequeno(L, g), periodoPendulo(L, g))).toBeLessThan(1e-15);
    }
  });

  it('T² frente a L es una recta por el origen de pendiente 4π²/g', () => {
    for (const g of [3.71, 9.81, 24.79]) {
      for (const L of [0.5, 1.7, 3]) expect(rel(periodoPequeno(L, g) ** 2 / L, (4 * Math.PI ** 2) / g)).toBeLessThan(1e-14);
    }
  });
});

describe('integral elíptica completa K(k) por la media aritmético-geométrica', () => {
  it('AGM(1, √2) = 1,19814023473559 (la constante de Gauss es su inverso)', () => {
    expect(agm(1, Math.SQRT2)).toBeCloseTo(1.19814023473559, 13);
  });

  // Abramowitz & Stegun, tabla 17.1: K en función del ángulo modular α (k = sen α)
  const TABLA: [number, number][] = [
    [0, 1.5707963268], [10, 1.5828428043], [20, 1.6200258991], [30, 1.6857503548], [45, 1.8540746773],
    [60, 2.1565156475], [75, 2.7680631454], [80, 3.1533852519], [89, 5.4349098296],
  ];
  it.each(TABLA)('K(sen %i°) = %f (A&S 17.1)', (alfa, K) => {
    expect(Math.abs(elipticaK(Math.sin(alfa * GRAD)) - K)).toBeLessThan(1e-10);
  });

  it('K(1/√2) = Γ(1/4)²/(4√π) = 1,854074677301372', () => {
    expect(elipticaK(Math.SQRT1_2)).toBeCloseTo(1.854074677301372, 13);
  });

  it('coincide con una cuadratura de Simpson independiente', () => {
    const quad = (k: number, n = 20000) => {
      const h = Math.PI / 2 / n;
      let s = 0;
      for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) / Math.sqrt(1 - (k * Math.sin(i * h)) ** 2);
      return (s * h) / 3;
    };
    for (const k of [0.05, 0.3, 0.6, 0.85, 0.95]) expect(rel(elipticaK(k), quad(k))).toBeLessThan(1e-11);
  });

  it('K(0) = π/2 y diverge en k → 1', () => {
    expect(elipticaK(0)).toBeCloseTo(Math.PI / 2, 15);
    expect(elipticaK(1)).toBe(Infinity);
    expect(elipticaK(0.9999999)).toBeGreaterThan(9);
  });
});

describe('periodo exacto frente a la serie', () => {
  it('T/T₀ de referencia: 10° → 1,0019072; 30° → 1,0174088; 90° → 1,1803406; 150° → 1,7622037', () => {
    expect(razonPeriodo(10 * GRAD)).toBeCloseTo(1.0019072, 7);
    expect(razonPeriodo(30 * GRAD)).toBeCloseTo(1.0174088, 7);
    expect(razonPeriodo(90 * GRAD)).toBeCloseTo(1.1803406, 7);
    expect(razonPeriodo(150 * GRAD)).toBeCloseTo(1.7622037, 7);
  });

  it('la serie de dos términos acierta a 1e-8 a 10° y su error crece como θ⁶', () => {
    expect(Math.abs(razonSerie(10 * GRAD) - razonPeriodo(10 * GRAD))).toBeLessThan(1e-8);
    const e10 = razonPeriodo(10 * GRAD) - razonSerie(10 * GRAD);
    const e20 = razonPeriodo(20 * GRAD) - razonSerie(20 * GRAD);
    expect(e20 / e10).toBeGreaterThan(55);
    expect(e20 / e10).toBeLessThan(72);
    // a 90° la serie ya se queda un 0,37 % corta
    expect(rel(periodoSerie(1, 9.81, 90 * GRAD), periodoExacto(1, 9.81, 90 * GRAD))).toBeGreaterThan(3e-3);
  });

  it('el periodo NO depende de la masa: ninguna función del periodo la recibe', () => {
    expect(periodoExacto.length).toBe(3);
    expect(periodoSimulado.length).toBeLessThanOrEqual(3);
  });
});

describe('la ecuación completa integrada con RK4', () => {
  const casos: [number, number, number][] = [
    [2, 1, 9.81], [10, 1, 9.81], [30, 0.5, 9.81], [45, 3, 3.71], [60, 2, 24.79], [90, 1, 9.81], [150, 1.5, 9.81],
  ];
  it.each(casos)('a %i° (L = %f m, g = %f) la fotopuerta mide el periodo elíptico a 1e-8', (gr, L, g) => {
    const Tsim = periodoSimulado(gr * GRAD, P(L, g));
    expect(rel(Tsim, periodoExacto(L, g, gr * GRAD))).toBeLessThan(1e-8);
  });

  it('conserva la energía: 100 periodos a 90° con deriva < 1e-9', () => {
    const p = P(1, 9.81);
    const e: EstadoPendulo = { t: 0, theta: 90 * GRAD, omega: 0 };
    const E0 = energiaEspecifica(e.theta, e.omega, p);
    avanzar(e, p, 100 * periodoExacto(1, 9.81, 90 * GRAD));
    expect(rel(energiaEspecifica(e.theta, e.omega, p), E0)).toBeLessThan(1e-9);
  });

  it('en el punto más bajo |ω| = 2·ω₀·sen(θ₀/2)', () => {
    for (const gr of [10, 45, 90]) {
      const p = P(1.2, 9.81);
      const e: EstadoPendulo = { t: 0, theta: gr * GRAD, omega: 0 };
      let wMax = 0;
      while (e.theta > 0) { pasoRK4(e, p, 1e-4); wMax = Math.max(wMax, Math.abs(e.omega)); }
      expect(rel(wMax, omegaMaxima(gr * GRAD, p))).toBeLessThan(2e-6);
    }
  });

  it('el hilo nunca se destensa con θ₀ ≤ 90°: T = m(g cos θ + Lω²) ≥ 0, y vale 0 al soltar a 90°', () => {
    const p = P(1, 9.81);
    expect(tensionHilo(90 * GRAD, 0, p, 2)).toBeCloseTo(0, 12);
    const e: EstadoPendulo = { t: 0, theta: 90 * GRAD, omega: 0 };
    let minimo = Infinity;
    for (let i = 0; i < 4000; i++) { pasoRK4(e, p, 5e-4); minimo = Math.min(minimo, tensionHilo(e.theta, e.omega, p, 2)); }
    expect(minimo).toBeGreaterThanOrEqual(-1e-9);
    // en el punto más bajo: T = mg(3 − 2 cos θ₀) = 3mg a 90°
    const abajo: EstadoPendulo = { t: 0, theta: 90 * GRAD, omega: 0 };
    while (abajo.theta > 0) pasoRK4(abajo, p, 1e-4);
    expect(rel(tensionHilo(0, abajo.omega, p, 2), 3 * 2 * 9.81)).toBeLessThan(1e-4);
  });
});

describe('péndulo lineal (el fantasma) y amortiguamiento', () => {
  it('la solución exacta cumple su ecuación y sus condiciones iniciales', () => {
    const p = P(1, 9.81, GAMMA_AMORTIGUADO);
    const th0 = 30 * GRAD;
    const l0 = lineal(0, th0, p);
    expect(l0.theta).toBeCloseTo(th0, 14);
    expect(l0.omega).toBeCloseTo(0, 14);
    const w2 = p.g / p.L, h = 1e-4;
    for (const t of [0.3, 1.7, 5.2, 12]) {
      const a = lineal(t - h, th0, p), b = lineal(t, th0, p), c = lineal(t + h, th0, p);
      const acc = (a.theta - 2 * b.theta + c.theta) / (h * h);
      expect(Math.abs(acc - (-w2 * b.theta - 2 * p.gamma * b.omega))).toBeLessThan(1e-5);
      expect(Math.abs((c.theta - a.theta) / (2 * h) - b.omega)).toBeLessThan(1e-6);
    }
  });

  it('la amplitud decae como e^(−γt): cociente entre máximos sucesivos = e^(−γ·T_d)', () => {
    const p = P(1, 9.81, GAMMA_AMORTIGUADO);
    const wd = Math.sqrt(p.g / p.L - p.gamma ** 2), Td = (2 * Math.PI) / wd;
    // lineal: exacto
    const maximos: number[] = [];
    let prev = lineal(0, 1, p).omega;
    for (let t = 1e-3; t < 6 * Td; t += 1e-3) {
      const w = lineal(t, 1, p).omega;
      if (prev > 0 && w <= 0) maximos.push(lineal(t, 1, p).theta);
      prev = w;
    }
    for (let i = 1; i < maximos.length; i++) expect(maximos[i] / maximos[i - 1]).toBeCloseTo(Math.exp(-p.gamma * Td), 4);
    // y la ecuación completa a 0,5° sigue al lineal (sen θ ≈ θ allí): error < 1e-3·θ₀ a los 30 s
    const th0 = 0.5 * GRAD;
    const e: EstadoPendulo = { t: 0, theta: th0, omega: 0 };
    avanzar(e, p, 30);
    expect(Math.abs(e.theta - lineal(30, th0, p).theta)).toBeLessThan(1e-3 * th0);
  });

  it('a 45° el fantasma lineal se adelanta: el periodo real es un 4 % más largo', () => {
    const p = P(1, 9.81);
    const real = periodoSimulado(45 * GRAD, p);
    expect(rel(real / periodoPequeno(1, 9.81), 1.0399733)).toBeLessThan(1e-6);
  });

  it('la aceleración es la de la ecuación completa', () => {
    const p = P(2, 9.81, 0.1);
    expect(aceleracion(1, 0.5, p)).toBeCloseTo(-(9.81 / 2) * Math.sin(1) - 2 * 0.1 * 0.5, 14);
  });
});

describe('esfera de latón y fotopuerta', () => {
  it('la esfera de 1 kg de latón mide 3,04 cm de radio (m = ρ·4πr³/3)', () => {
    expect(radioEsfera(1) * 100).toBeCloseTo(3.0397, 3);
    for (const m of [1, 2, 5]) expect(rel((RHO_LATON * 4 * Math.PI * radioEsfera(m) ** 3) / 3, m)).toBeLessThan(1e-12);
  });

  it('cuenta oscilaciones completas desde el primer paso por el haz', () => {
    const p = P(1, 9.81);
    const T = periodoExacto(1, 9.81, 20 * GRAD);
    const e: EstadoPendulo = { t: 0, theta: 20 * GRAD, omega: 0 };
    const d = new DetectorPasos();
    while (e.t < 10.25 * T) { const t0 = e.t, th0 = e.theta; pasoRK4(e, p, 1e-3); d.registrar(t0, th0, e.t, e.theta); }
    expect(d.pasos).toBe(21);
    expect(d.oscilaciones).toBe(10);
    expect(rel(d.periodo, T)).toBeLessThan(1e-8);
  });
});

describe('reloj único', () => {
  const nuevo = (o: Partial<{ L: number; g: number; gamma: number; theta0: number }> = {}) =>
    new RelojPendulo({ L: 1, g: G_TIERRA, gamma: 0, theta0: 45 * GRAD, r: radioEsfera(2), suelto: true, ...o });

  it('arranca vivo: con historia y con el periodo de la fotopuerta ya medido', () => {
    const r = nuevo();
    r.arrancar(8);
    expect(r.hn).toBeGreaterThan(1000);
    const l = r.lectura();
    expect(rel(l.T, periodoExacto(1, G_TIERRA, 45 * GRAD))).toBeLessThan(1e-8);
    expect(l.n).toBeGreaterThanOrEqual(3);
    // la historia llega hasta el cuadro actual (a menos de un intervalo de muestreo) y guarda
    // el mismo modelo: el lineal de cada muestra es la solución exacta en su instante
    const u = r.muestra(r.hn - 1);
    expect(r.e.t - u.t).toBeLessThan(1 / 150 + 1e-9);
    expect(Math.abs(u.lin - r.lineal(u.t).theta)).toBeLessThan(1e-6);
    expect(Math.abs(r.thetaEn(u.t) - u.th)).toBeLessThan(1e-7);
    // y θ interpolado entre muestras sigue a la integración (error de interpolación < 1e-4 rad)
    const e: EstadoPendulo = { t: 0, theta: 45 * GRAD, omega: 0 };
    avanzar(e, P(1, G_TIERRA), 4.123);
    expect(Math.abs(r.thetaEn(4.123) - e.theta)).toBeLessThan(1e-4);
  });

  it('cámara lenta y pausa: el modelo avanza dt·factor, o nada', () => {
    const r = nuevo();
    r.factor = 0.25;
    r.paso(0.05);
    expect(r.e.t).toBeCloseTo(0.0125, 12);
    r.pausa = true;
    r.paso(0.05);
    expect(r.e.t).toBeCloseTo(0.0125, 12);
  });

  it('el cronómetro mide tiempo de modelo', () => {
    const r = nuevo();
    r.pausa = true; // sin interpolación entre cuadros
    r.cronoAlternar();
    r.integrar(5.25);
    expect(r.cronoLeer()).toBeCloseTo(5.25, 9);
    r.cronoAlternar();
    r.integrar(3);
    expect(r.cronoLeer()).toBeCloseTo(5.25, 9);
    r.cronoReiniciar();
    expect(r.cronoLeer()).toBe(0);
  });

  it('la mano lo sujeta en θ₀: el tiempo corre, el péndulo no, y el fantasma tampoco', () => {
    const r = nuevo({ theta0: 10 * GRAD });
    r.fijar({ suelto: false });
    r.integrar(3);
    expect(r.e.theta).toBe(10 * GRAD);
    expect(r.lineal().theta).toBe(10 * GRAD);
    expect(r.lectura().n).toBe(0);
    r.fijar({ suelto: true });
    expect(r.tSuelta).toBeCloseTo(3, 9);
    r.integrar(periodoExacto(1, G_TIERRA, 10 * GRAD) * 3.5);
    expect(r.lectura().n).toBe(3);
  });

  it('amortiguado, las medidas T(θ₀) de la fotopuerta caen sobre la curva elíptica', () => {
    const r = nuevo({ gamma: GAMMA_AMORTIGUADO, theta0: 80 * GRAD });
    r.arrancar(60);
    expect(r.medidas.length).toBeGreaterThan(15);
    // la amplitud bajó: e^(−γ·60) ≈ 0,12
    expect(r.amplitud).toBeLessThan(15 * GRAD);
    for (const m of r.medidas) expect(Math.abs(m.razon - razonPeriodo(m.amp))).toBeLessThan(2e-3);
    // y recorren la curva: de ~1,13 a ~1,00
    expect(r.medidas[0].razon).toBeGreaterThan(1.09);
    expect(r.medidas[r.medidas.length - 1].razon).toBeLessThan(1.01);
  });

  it('a la amplitud del reto (10°) el periodo real cabe holgado en la tolerancia del validador', () => {
    // muestra: ±6 % sobre T₀; resultado: g = 4π²L/T² a ±5 %
    const Treal = periodoExacto(1, 12.3, 10 * GRAD);
    const T0 = periodoPendulo(1, 12.3);
    expect(rel(Treal, T0)).toBeLessThan(TOL_MUESTRA_PERIODO / 20);
    const gMedida = (4 * Math.PI ** 2 * 1) / Treal ** 2;
    expect(rel(gMedida, 12.3)).toBeLessThan(TOL_RESULTADO_CRONO / 10);
  });
});
