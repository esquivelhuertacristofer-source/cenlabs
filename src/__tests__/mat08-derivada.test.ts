/**
 * MAT-08 · La derivada — la matemática del banco (`simuladores/mat08/derivada.ts`), su
 * reloj único (`reloj.ts`) y las cotas de la escena (`banco.ts`).
 *
 *  - Derivadas analíticas f′, f″, f‴ de las cinco curvas contra diferencias finitas de
 *    alto orden, y la del cohete contra el dominio (`velocidadM8`, `aceleracionM8`).
 *  - Cocientes incrementales: valores de libro, el error real frente al término de
 *    Taylor (h/2)f″ y (h²/6)f‴, y el ORDEN MEDIDO por mínimos cuadrados: 1 hacia
 *    delante y 2 centrado (y 2 hacia delante justo en una inflexión, donde f″ = 0).
 *  - Redondeo: el error mínimo del cociente hacia delante cae cerca de h ≈ √ε y el del
 *    centrado cerca de ∛ε (la «V» del gráfico log–log).
 *  - Puntos críticos e inflexiones contra sus valores exactos; la inflexión del cohete es
 *    el t* = m/(3k) del validador para los cinco cohetes del sorteo.
 *  - El reloj: la secante converge a la tangente, h baja monótona, el recorrido dibuja
 *    f′ y en el reto NO hay traza hasta revelar; el rango del panel de v no depende de m.
 */
import {
  FUNCIONES, IDS_FUNCION, curvaCohete, cocienteAdelante, cocienteCentrado, cociente, errorDerivada, errorTaylor,
  ordenMedido, barridoError, puntosCriticos, inflexiones, ceros, rangosCurva, marcas, pasoRedondo, prefijoComun, num,
  RANGO_V_RETO, H_TABLA, type Curva,
} from '@/components/simuladores/mat08/derivada';
import { RelojDerivada, N_BINS, FRAC_H_MIN } from '@/components/simuladores/mat08/reloj';
import { mapa, recortarRecta, PLACA_F, PLACA_D, ANCHO_PLOT } from '@/components/simuladores/mat08/banco';
import { velocidadM8, aceleracionM8, posicionM8, tVelocidadMaximaM8, validarM8, T_MAX_M8 } from '@/domain/matematicas';

const COHETES = [1.2, 1.35, 1.5, 1.65, 1.8].map((m) => ({ k: 0.1, m }));
const CURVAS: Curva[] = [...IDS_FUNCION.map((id) => FUNCIONES[id]), curvaCohete({ k: 0.1, m: 1.5 })];

/** Derivada numérica de 6.º orden (estrella de 7 puntos) para comprobar las analíticas. */
function d6(g: (x: number) => number, x: number, h = 1e-3) {
  return (-g(x - 3 * h) + 9 * g(x - 2 * h) - 45 * g(x - h) + 45 * g(x + h) - 9 * g(x + 2 * h) + g(x + 3 * h)) / (60 * h);
}

describe('derivadas analíticas', () => {
  test.each(CURVAS.map((c) => [c.id, c] as const))('%s: f′, f″ y f‴ contra diferencias de 6.º orden', (_, c) => {
    const [a, b] = c.dominio;
    for (let i = 0; i <= 20; i++) {
      const x = a + ((b - a) * i) / 20;
      expect(d6(c.f, x)).toBeCloseTo(c.d1(x), 7);
      expect(d6(c.d1, x)).toBeCloseTo(c.d2(x), 7);
      expect(d6(c.d2, x)).toBeCloseTo(c.d3(x), 6);
    }
  });
  test('el cohete es la MISMA función del dominio y del validador', () => {
    for (const co of COHETES) {
      const c = curvaCohete(co);
      for (let t = 0; t <= 10; t += 0.37) {
        expect(c.f(t)).toBe(posicionM8(co, t));
        expect(c.d1(t)).toBe(velocidadM8(co, t));
        expect(c.d2(t)).toBe(aceleracionM8(co, t));
      }
      expect(c.dominio).toEqual([0, T_MAX_M8]);
    }
  });
  test('fórmulas legibles con coma decimal', () => {
    expect(curvaCohete({ k: 0.1, m: 1.35 }).formula).toBe('s(t) = −0,1·t³ + 1,35·t²');
    expect(curvaCohete({ k: 0.1, m: 1.5 }).formulaD).toBe('v(t) = −0,3·t² + 3·t');
  });
});

describe('cocientes incrementales', () => {
  test('valores de libro: x² en x = 1 → 2 + h hacia delante y 2 exacto centrado', () => {
    const f = (x: number) => x * x;
    for (const h of [1, 0.5, 0.1, 0.01]) {
      expect(cocienteAdelante(f, 1, h)).toBeCloseTo(2 + h, 12);
      expect(cocienteCentrado(f, 1, h)).toBeCloseTo(2, 12);
    }
  });
  test('sen x en 0 con h = 0,1: sen(0,1)/0,1 = 0,998334', () => {
    expect(cocienteAdelante(Math.sin, 0, 0.1)).toBeCloseTo(0.9983341665, 9);
    expect(cocienteCentrado(Math.sin, 0, 0.1)).toBeCloseTo(0.9983341665, 9);
  });
  test('cúbica x³/3 − x en x₀ = 2: (f(2+h) − f(2))/h = 3 + 2h + h²/3 exacto', () => {
    const c = FUNCIONES.cubica;
    for (const h of [1, 0.1, 0.01]) expect(cociente(c, 2, h, 'adelante')).toBeCloseTo(3 + 2 * h + (h * h) / 3, 10);
    for (const h of [1, 0.1, 0.01]) expect(cociente(c, 2, h, 'centrada')).toBeCloseTo(3 + (h * h) / 3, 10);
  });
  test('h < 0 (Q a la izquierda) también converge a f′', () => {
    const c = FUNCIONES.exponencial;
    expect(cociente(c, 1.5, -1e-6, 'adelante')).toBeCloseTo(Math.exp(1.5), 5);
  });
  test('la derivada numérica converge a la analítica en las cinco curvas (centrada, h = 10⁻⁵ → 10⁻⁹)', () => {
    for (const c of CURVAS) {
      const [a, b] = c.dominio;
      for (let i = 1; i < 10; i++) {
        const x = a + ((b - a) * i) / 10;
        expect(Math.abs(cociente(c, x, 1e-5, 'centrada') - c.d1(x))).toBeLessThan(1e-9 * Math.max(1, Math.abs(c.d1(x))) + 2e-9);
        expect(Math.abs(cociente(c, x, 1e-7, 'adelante') - c.d1(x))).toBeLessThan(2e-6);
      }
    }
  });
});

describe('error y orden de convergencia', () => {
  test('el error real sigue el término de Taylor (cociente → 1 cuando h → 0)', () => {
    for (const c of CURVAS) {
      const x = c.dominio[0] + 0.37 * (c.dominio[1] - c.dominio[0]);
      for (const m of ['adelante', 'centrada'] as const) {
        const r = errorDerivada(c, x, 1e-3, m) / errorTaylor(c, x, 1e-3, m);
        expect(r).toBeGreaterThan(0.98);
        expect(r).toBeLessThan(1.02);
      }
    }
  });
  test('orden medido: 1,00 hacia delante y 2,00 centrado en puntos genéricos', () => {
    for (const c of CURVAS) {
      const [a, b] = c.dominio;
      for (const f of [0.23, 0.41, 0.77]) {
        const x = a + f * (b - a);
        if (Math.abs(c.d2(x)) > 0.05) expect(ordenMedido(c, x, 'adelante')!).toBeCloseTo(1, 1);
        if (Math.abs(c.d3(x)) > 0.05) expect(ordenMedido(c, x, 'centrada')!).toBeCloseTo(2, 1);
      }
    }
  });
  test('en una inflexión (f″ = 0) el cociente hacia delante pasa a orden 2', () => {
    expect(ordenMedido(FUNCIONES.cubica, 0, 'adelante')!).toBeCloseTo(2, 3);
    expect(ordenMedido(FUNCIONES.seno, 0, 'adelante')!).toBeCloseTo(2, 2);
  });
  test('en x³/3 − x el error centrado es exactamente h²/3 (f‴ = 2)', () => {
    for (const h of [0.5, 0.1, 0.01]) expect(errorDerivada(FUNCIONES.cubica, 0.7, h, 'centrada')).toBeCloseTo((h * h) / 3, 10);
  });
  test('redondeo: el mínimo del error está cerca de √ε (delante) y de ∛ε (centrado)', () => {
    const c = FUNCIONES.seno, x = 1;
    const minimo = (m: 'adelante' | 'centrada') => barridoError(c, x, m).reduce((p, q) => (q.e < p.e ? q : p));
    const hAd = minimo('adelante').h, hCe = minimo('centrada').h;
    expect(Math.log10(hAd)).toBeGreaterThan(-9.6);
    expect(Math.log10(hAd)).toBeLessThan(-6.9);
    expect(Math.log10(hCe)).toBeGreaterThan(-6.6);
    expect(Math.log10(hCe)).toBeLessThan(-3.9);
    // y por debajo del óptimo el error CRECE al bajar h (manda el redondeo)
    const e12 = barridoError(c, x, 'adelante')[0].e;
    expect(e12).toBeGreaterThan(minimo('adelante').e * 100);
  });
  test('la tabla del dock usa h = 1 … 10⁻⁴', () => {
    expect([...H_TABLA]).toEqual([1, 0.1, 0.01, 0.001, 0.0001]);
  });
});

describe('puntos notables', () => {
  test('cúbica: máximo en −1, mínimo en +1, inflexión en 0', () => {
    const pc = puntosCriticos(FUNCIONES.cubica);
    expect(pc.map((p) => p.tipo)).toEqual(['max', 'min']);
    expect(pc[0].x).toBeCloseTo(-1, 9); expect(pc[1].x).toBeCloseTo(1, 9);
    const inf = inflexiones(FUNCIONES.cubica);
    expect(inf).toHaveLength(1); expect(inf[0].x).toBeCloseTo(0, 9);
  });
  test('sen x en [−π, π]: mínimo en −π/2, máximo en π/2, inflexión en 0 (los extremos no cuentan)', () => {
    const pc = puntosCriticos(FUNCIONES.seno);
    expect(pc.map((p) => [p.tipo, Number(p.x.toFixed(9))])).toEqual([['min', Number((-Math.PI / 2).toFixed(9))], ['max', Number((Math.PI / 2).toFixed(9))]]);
    const inf = inflexiones(FUNCIONES.seno);
    expect(inf).toHaveLength(1); expect(inf[0].x).toBeCloseTo(0, 9);
  });
  test('campana: máximo en 0 e inflexiones en ±1/√2', () => {
    const pc = puntosCriticos(FUNCIONES.campana);
    expect(pc).toHaveLength(1); expect(pc[0].tipo).toBe('max'); expect(pc[0].x).toBeCloseTo(0, 9);
    const inf = inflexiones(FUNCIONES.campana).map((p) => p.x);
    expect(inf[0]).toBeCloseTo(-Math.SQRT1_2, 9); expect(inf[1]).toBeCloseTo(Math.SQRT1_2, 9);
  });
  test('eˣ no tiene puntos críticos ni inflexiones', () => {
    expect(puntosCriticos(FUNCIONES.exponencial)).toHaveLength(0);
    expect(inflexiones(FUNCIONES.exponencial)).toHaveLength(0);
  });
  test('cohete: la inflexión de s(t) es el t* = m/(3k) del validador, y ahí v es máxima', () => {
    for (const co of COHETES) {
      const c = curvaCohete(co);
      const inf = inflexiones(c);
      expect(inf).toHaveLength(1);
      expect(inf[0].x).toBeCloseTo(tVelocidadMaximaM8(co), 9);
      expect(validarM8({ xActual: Math.round(inf[0].x * 100) / 100, ...co })).toBe(true);
      let tMax = 0;
      for (let t = 0; t <= 10; t += 0.001) if (c.d1(t) > c.d1(tMax)) tMax = t;
      expect(tMax).toBeCloseTo(tVelocidadMaximaM8(co), 2);
    }
  });
  test('ceros: raíz exacta en un nodo de la malla y sin duplicados', () => {
    expect(ceros((x) => x, -1, 1, 10)).toEqual([0]);
    expect(ceros((x) => x * x - 0.25, -1, 1)).toHaveLength(2);
  });
});

describe('paneles y escena', () => {
  test('el rango del panel de v en el reto es fijo, no depende de m y contiene v(t) entera', () => {
    for (const co of COHETES) {
      const r = rangosCurva(curvaCohete(co));
      expect(r.d).toEqual(RANGO_V_RETO);
      for (let t = 0; t <= 10; t += 0.01) {
        const v = velocidadM8(co, t);
        expect(v).toBeGreaterThan(r.d[0]); expect(v).toBeLessThan(r.d[1]);
      }
      expect(r.f[0]).toBe(0);
    }
  });
  test('en la exploración los paneles contienen f y f′ enteras, y el 0 de f′', () => {
    for (const id of IDS_FUNCION) {
      const c = FUNCIONES[id], r = rangosCurva(c);
      expect(r.d[0]).toBeLessThan(0); expect(r.d[1]).toBeGreaterThan(0);
      for (let i = 0; i <= 100; i++) {
        const x = c.dominio[0] + (i / 100) * (c.dominio[1] - c.dominio[0]);
        expect(c.f(x)).toBeGreaterThanOrEqual(r.f[0]); expect(c.f(x)).toBeLessThanOrEqual(r.f[1]);
        expect(c.d1(x)).toBeGreaterThanOrEqual(r.d[0]); expect(c.d1(x)).toBeLessThanOrEqual(r.d[1]);
      }
    }
  });
  test('mapa: el dominio llena el ancho de trazado y los rangos su alto', () => {
    const c = FUNCIONES.seno, r = rangosCurva(c), M = mapa(r);
    expect(M.X(c.dominio[0])).toBeCloseTo(PLACA_F.x0, 12);
    expect(M.X(c.dominio[1])).toBeCloseTo(PLACA_F.x1, 12);
    expect(M.X(c.dominio[1]) - M.X(c.dominio[0])).toBeCloseTo(ANCHO_PLOT, 12);
    expect(M.YF(r.f[1])).toBeCloseTo(PLACA_F.y1, 12);
    expect(M.YD(r.d[0])).toBeCloseTo(PLACA_D.y0, 12);
    expect(M.xDe(M.X(0.3))).toBeCloseTo(0.3, 12);
    expect(PLACA_D.y1).toBeLessThan(PLACA_F.y0);
  });
  test('la tangente de la escena toca la curva dibujada (pendiente f′·sf/sx)', () => {
    const c = FUNCIONES.campana, M = mapa(rangosCurva(c));
    const x = 0.4, m = (c.d1(x) * M.sf) / M.sx, h = 1e-6;
    const pend = (M.YF(c.f(x + h)) - M.YF(c.f(x - h))) / (M.X(x + h) - M.X(x - h));
    expect(pend).toBeCloseTo(m, 6);
  });
  test('recorte de una recta al rectángulo de trazado', () => {
    const s = recortarRecta(0, 0, 1, -1, 1, -2, 2)!;
    expect(s[0][0]).toBeCloseTo(-1); expect(s[0][1]).toBeCloseTo(-1);
    expect(s[1][0]).toBeCloseTo(1); expect(s[1][1]).toBeCloseTo(1);
    const v = recortarRecta(0, 0, 10, -1, 1, -2, 2)!;
    expect(v[1][1]).toBeCloseTo(2); expect(v[1][0]).toBeCloseTo(0.2);
    expect(recortarRecta(0, 5, 0, -1, 1, -2, 2)).toBeNull();
  });
  test('formato: coma decimal, signo menos tipográfico, marcas y paso redondos', () => {
    expect(num(-1.25, 2)).toBe('−1,25');
    expect(num(-0.0001, 2)).toBe('0,00');
    expect(pasoRedondo(10, 5)).toBe(2);
    expect(marcas(-2.5, 2.5, 5)).toEqual([-2, -1, 0, 1, 2]);
    expect(prefijoComun('1,00012', '1,00000')).toBe(5);
  });
});

describe('reloj único', () => {
  const avanza = (r: RelojDerivada, s: number, dt = 1 / 60) => { for (let t = 0; t < s; t += dt) r.paso(dt); };

  test('estado inicial (exploración): la secante YA converge — h baja monótona hasta h_min', () => {
    const r = new RelojDerivada(FUNCIONES.cubica, 'explorar');
    expect(r.fase).toBe('converger');
    let hPrev = r.hAbs, pendPrev = Math.abs(r.lectura().d - r.lectura().d1);
    for (let i = 0; i < 120; i++) {
      r.paso(1 / 60);
      if (r.fase !== 'converger') break;
      expect(r.hAbs).toBeLessThan(hPrev);
      const err = Math.abs(r.lectura().d - r.lectura().d1);
      expect(err).toBeLessThanOrEqual(pendPrev + 1e-12);
      hPrev = r.hAbs; pendPrev = err;
    }
    avanza(r, 3);
    expect(r.hAbs).toBeCloseTo(FRAC_H_MIN * 5, 12);
    // con h = h_min la secante ES la tangente a la precisión de la vista
    expect(Math.abs(r.lectura().d - r.lectura().d1)).toBeLessThan(2e-3);
  });

  test('el recorrido dibuja f′ de un extremo a otro y descubre los puntos notables', () => {
    const r = new RelojDerivada(FUNCIONES.cubica, 'explorar');
    avanza(r, 40, 1 / 30);
    // 10 % … 90 % del dominio trazado (y en la vuelta se borra y se vuelve a trazar)
    const vistos = r.criticos.filter((p) => r.descubierto(p.x)).length + r.inflexiones.filter((p) => r.descubierto(p.x)).length;
    expect(vistos).toBeGreaterThan(0);
    const r2 = new RelojDerivada(FUNCIONES.cubica, 'explorar');
    let maxFrac = 0;
    for (let t = 0; t < 40; t += 1 / 30) { r2.paso(1 / 30); maxFrac = Math.max(maxFrac, r2.fraccionTrazada()); }
    expect(maxFrac).toBeGreaterThan(0.78);
    expect(maxFrac).toBeLessThan(0.83);
  });

  test('reto: el trazador NO deja traza de v(t) antes de validar, ni con el vuelo ni moviendo t', () => {
    const r = new RelojDerivada(curvaCohete({ k: 0.1, m: 1.5 }), 'reto', 0);
    avanza(r, 5);
    r.setVuelo(true); avanza(r, 12);
    for (let t = 0; t <= 10; t += 0.05) r.setX0(t);
    expect(r.fraccionTrazada()).toBe(0);
    expect(r.criticos.every((p) => !r.descubierto(p.x))).toBe(true);
    r.revelar(); avanza(r, 2);
    expect(r.fraccionTrazada()).toBe(1);
    r.ocultar();
    expect(r.fraccionTrazada()).toBe(0);
  });

  test('reto: el vuelo avanza 1 s por segundo con la tangente pegada (h = h_min)', () => {
    const r = new RelojDerivada(curvaCohete({ k: 0.1, m: 1.5 }), 'reto', 2);
    r.setVuelo(true);
    avanza(r, 1.5, 0.05);
    expect(r.x0).toBeCloseTo(3.5, 6);
    expect(r.hAbs).toBeCloseTo(FRAC_H_MIN * 10, 12);
  });

  test('reto: al final del vuelo h es negativo (Q por la izquierda) y la pendiente sigue convergiendo', () => {
    const r = new RelojDerivada(curvaCohete({ k: 0.1, m: 1.5 }), 'reto', 9.5);
    const l = r.lectura();
    expect(l.h).toBeLessThan(0);
    expect(l.x0 + l.h).toBeGreaterThanOrEqual(0);
    avanza(r, 3);
    expect(Math.abs(r.lectura().d - velocidadM8({ k: 0.1, m: 1.5 }, 9.5))).toBeLessThan(5e-3);
  });

  test('las mediciones anotadas son la pendiente de la tangente en el t marcado', () => {
    const co = { k: 0.1, m: 1.65 };
    const r = new RelojDerivada(curvaCohete(co), 'reto', 3.217);
    const m = r.anotar()!;
    expect(m.t).toBe(3.22);
    expect(m.v).toBe(velocidadM8(co, 3.22));
    r.anotar();
    expect(r.mediciones).toHaveLength(1);
  });

  test('el método centrado mantiene x₀ ± h dentro del dominio', () => {
    const r = new RelojDerivada(FUNCIONES.seno, 'explorar');
    r.setMetodo('centrada');
    for (const x of [-3.1, -2, 0, 2.5, 3.1]) {
      r.setX0(x); r.reiniciarH();
      for (let i = 0; i < 200; i++) {
        r.paso(1 / 60);
        const l = r.lectura();
        expect(l.x0 - l.hAbs).toBeGreaterThanOrEqual(-Math.PI - 1e-9);
        expect(l.x0 + l.hAbs).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });

  test('movimiento reducido: quieto, y en la exploración la traza de f′ ya está completa', () => {
    const r = new RelojDerivada(FUNCIONES.seno, 'explorar');
    r.estatico();
    const x = r.x0, h = r.hAbs;
    avanza(r, 3);
    expect(r.x0).toBe(x); expect(r.hAbs).toBe(h);
    expect(r.fraccionTrazada()).toBe(1);
    expect(N_BINS).toBe(512);
  });

  test('la versión sube en cada cuadro con cambios (dock y escena leen el mismo estado)', () => {
    const r = new RelojDerivada(FUNCIONES.exponencial, 'explorar');
    const v0 = r.version;
    r.paso(1 / 60);
    expect(r.version).toBe(v0 + 1);
    const l = r.lectura();
    expect(l.dAdelante).toBe(cocienteAdelante(Math.exp, l.x0, l.h));
    expect(l.d1).toBe(Math.exp(l.x0));
  });
});
