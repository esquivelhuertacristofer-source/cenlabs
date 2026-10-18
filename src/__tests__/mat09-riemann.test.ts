/**
 * MAT-09 · Sumas de Riemann — la matemática del banco (`simuladores/mat09/riemann.ts`), su reloj
 * único (`reloj.ts`) y las cotas de la escena (`banco.ts`).
 *
 *  - Sumas contra formas cerradas: en la curva del reto f = 0,1x² + 1 en [0, 10] (I = 130/3)
 *      E_izq = −50/n + 50/(3n²) · E_der = 50/n + 50/(3n²) · E_medio = −25/(3n²) · E_trap = 50/(3n²)
 *    y Simpson EXACTO; en la cúbica de exploración Simpson también es exacto (I = 30,4).
 *  - El error real contra el término de Euler–Maclaurin en las tres curvas de exploración.
 *  - Orden de convergencia MEDIDO por mínimos cuadrados (1, 1, 2, 2, 4).
 *  - Las columnas de la escena: Σ áreas = Sₙ y sobra − falta = E.
 *  - El n mínimo del reto (58, 59, 14) y que el mensaje de fallo no da el error.
 *  - El reloj: el llenado vierte la suma parcial exacta, la transición acaba en Sₙ, Simpson va con n par.
 */
import {
  FUNCIONES, IDS_FUNCION, CURVA_RETO, METODOS, suma, errorSuma, errorAsintotico, ordenMedido, nMinimoReto,
  columnas, areaColumna, sobraFalta, techo, nEfectivo, num, leerDecimal, cientifica, barridoError, ORDEN_TEORICO,
  type Curva, type Metodo,
} from '@/components/simuladores/mat09/riemann';
import { RelojRiemann, N_AUTO_TOPE, N_AUTO_INICIO } from '@/components/simuladores/mat09/reloj';
import { mapa, ALTO_PLOT, Y_BASE } from '@/components/simuladores/mat09/banco';
import { sumaRiemannM9, evaluarM9, INTEGRAL_EXACTA_M9, errorRelativoM9, type MetodoM9 } from '@/domain/matematicas';

const EXPLORAR: Curva[] = IDS_FUNCION.map((id) => FUNCIONES[id]);
const TODAS: Curva[] = [...EXPLORAR, CURVA_RETO];

describe('curvas: primitiva y derivadas', () => {
  test.each(TODAS.map((c) => [c.id, c] as const))('%s: F′ = f, f′ y f‴ contra diferencias centradas; I = F(b) − F(a)', (_, c) => {
    const h = 1e-3;
    for (let i = 0; i <= 20; i++) {
      const x = c.a + ((c.b - c.a) * i) / 20;
      expect((c.F(x + h) - c.F(x - h)) / (2 * h)).toBeCloseTo(c.f(x), 5);
      expect((c.f(x + h) - c.f(x - h)) / (2 * h)).toBeCloseTo(c.d1(x), 5);
      // f‴ = (f′)″
      expect((c.d1(x + h) - 2 * c.d1(x) + c.d1(x - h)) / (h * h)).toBeCloseTo(c.d3(x), 4);
      // la curva cabe en la placa (0 ≤ f ≤ yMax)
      expect(c.f(x)).toBeGreaterThan(0);
      expect(c.f(x)).toBeLessThan(c.yMax);
    }
    expect(c.F(c.b) - c.F(c.a)).toBeCloseTo(c.exacta, 12);
  });
  test('valores cerrados de las integrales', () => {
    expect(FUNCIONES.onda.exacta).toBeCloseTo(25.5 - Math.cos(10), 14);
    expect(FUNCIONES.onda.exacta).toBeCloseTo(26.3390715, 6);
    expect(FUNCIONES.exponencial.exacta).toBeCloseTo(44.7299758, 6);
    expect(FUNCIONES.cubica.exacta).toBeCloseTo(30.4, 13);
    expect(CURVA_RETO.exacta).toBe(INTEGRAL_EXACTA_M9);
    expect(CURVA_RETO.exacta).toBeCloseTo(130 / 3, 14);
  });
});

describe('sumas contra formas cerradas (curva del reto, I = 130/3)', () => {
  const cerrada: Record<'izquierda' | 'derecha' | 'punto_medio' | 'trapecio', (n: number) => number> = {
    izquierda: (n) => -50 / n + 50 / (3 * n * n),
    derecha: (n) => 50 / n + 50 / (3 * n * n),
    punto_medio: (n) => -25 / (3 * n * n),
    trapecio: (n) => 50 / (3 * n * n),
  };
  test.each(Object.keys(cerrada))('%s: E(n) igual a la forma cerrada para n = 1 … 200', (m) => {
    for (let n = 1; n <= 200; n++) {
      expect(errorSuma(CURVA_RETO, n, m as Metodo)).toBeCloseTo(cerrada[m as keyof typeof cerrada](n), 11);
    }
  });
  test('valores de libro: n = 4 izquierda 31,875 · derecha 56,875 · medio 42,8125 · trapecios 44,375', () => {
    expect(suma(CURVA_RETO, 4, 'izquierda')).toBeCloseTo(31.875, 12);
    expect(suma(CURVA_RETO, 4, 'derecha')).toBeCloseTo(56.875, 12);
    expect(suma(CURVA_RETO, 4, 'punto_medio')).toBeCloseTo(42.8125, 12);
    expect(suma(CURVA_RETO, 4, 'trapecio')).toBeCloseTo(44.375, 12);
  });
  test('Simpson es exacto en la parábola del reto', () => {
    for (const n of [2, 4, 6, 10, 64]) expect(Math.abs(errorSuma(CURVA_RETO, n, 'simpson'))).toBeLessThan(1e-11);
  });
  test('izquierda, derecha y medio salen del MISMO cálculo que el validador', () => {
    for (const m of ['izquierda', 'derecha', 'punto_medio'] as MetodoM9[]) {
      for (const n of [4, 10, 37, 58, 59, 100]) expect(suma(CURVA_RETO, n, m)).toBe(sumaRiemannM9(n, m));
    }
  });
});

describe('Simpson exacto en cúbicas', () => {
  test('cúbica de exploración: |S − 30,4| < 1e-11 para n par', () => {
    for (const n of [2, 4, 8, 16, 100, 256]) expect(Math.abs(suma(FUNCIONES.cubica, n, 'simpson') - 30.4)).toBeLessThan(1e-11);
  });
  test('y en cualquier cúbica: x³ en [0, 1] con n = 2 da 1/4', () => {
    const c: Curva = { ...FUNCIONES.cubica, id: 'cubica', f: (x) => x ** 3, a: 0, b: 1, exacta: 0.25 };
    expect(suma(c, 2, 'simpson')).toBeCloseTo(0.25, 15);
    // una cuártica ya no: x⁴ con n = 2 da 5/24 ≠ 1/5
    const q: Curva = { ...c, f: (x) => x ** 4, exacta: 0.2 };
    expect(suma(q, 2, 'simpson')).toBeCloseTo(5 / 24, 15);
  });
  test('Simpson sube un n impar al par siguiente', () => {
    expect(nEfectivo(7, 'simpson')).toBe(8);
    expect(nEfectivo(8, 'simpson')).toBe(8);
    expect(nEfectivo(7, 'izquierda')).toBe(7);
    expect(suma(FUNCIONES.onda, 7, 'simpson')).toBe(suma(FUNCIONES.onda, 8, 'simpson'));
  });
  test('trapecios y medio NO son exactos en la cúbica (no es simétrica: f′(10) ≠ f′(0))', () => {
    expect(Math.abs(errorSuma(FUNCIONES.cubica, 16, 'trapecio'))).toBeGreaterThan(1e-3);
    expect(Math.abs(errorSuma(FUNCIONES.cubica, 16, 'punto_medio'))).toBeGreaterThan(1e-3);
  });
});

describe('error real frente al término de Euler–Maclaurin', () => {
  test.each(EXPLORAR.map((c) => [c.id, c] as const))('%s, n = 64', (_, c) => {
    for (const m of METODOS) {
      const r = errorSuma(c, 64, m) / errorAsintotico(c, 64, m);
      if (m === 'simpson' && c.id === 'cubica') { expect(Math.abs(errorSuma(c, 64, m))).toBeLessThan(1e-11); continue; }
      // Simpson: el siguiente término es O(Δx⁶), relativo O(Δx²) ≈ 3·10⁻³
      expect(Math.abs(r - 1)).toBeLessThan(m === 'simpson' ? 5e-3 : 1e-5);
    }
  });
  test('en polinomios de grado ≤ 3 la serie termina: el término principal es EXACTO', () => {
    for (const c of [FUNCIONES.cubica, CURVA_RETO]) {
      for (const m of ['izquierda', 'derecha', 'punto_medio', 'trapecio'] as Metodo[]) {
        for (const n of [3, 8, 50]) expect(errorSuma(c, n, m)).toBeCloseTo(errorAsintotico(c, n, m), 11);
      }
    }
  });
});

describe('orden de convergencia medido (mínimos cuadrados de log|E| frente a log Δx)', () => {
  test.each(TODAS.map((c) => [c.id, c] as const))('%s: 1, 1, 2, 2, 4', (_, c) => {
    for (const m of METODOS) {
      const p = ordenMedido(c, m);
      if (m === 'simpson' && (c.id === 'cubica' || c.id === 'reto')) { expect(p).toBeNull(); continue; }
      expect(p).not.toBeNull();
      expect(Math.abs((p as number) - ORDEN_TEORICO[m])).toBeLessThan(0.03);
    }
  });
  test('el barrido del dock no lleva ceros (no caben en el eje logarítmico)', () => {
    expect(barridoError(FUNCIONES.cubica, 'simpson')).toHaveLength(0);
    for (const p of barridoError(FUNCIONES.onda, 'izquierda')) expect(p.e).toBeGreaterThan(0);
  });
});

describe('las columnas de la escena', () => {
  test.each(TODAS.map((c) => [c.id, c] as const))('%s: Σ áreas = Sₙ y sobra − falta = E', (_, c) => {
    for (const m of METODOS) {
      for (const n of [2, 5, 16]) {
        const cols = columnas(c, n, m);
        expect(cols.reduce((s, k) => s + areaColumna(k), 0)).toBeCloseTo(suma(c, n, m), 11);
        const sf = sobraFalta(c, cols);
        expect(sf.sobra).toBeGreaterThanOrEqual(0);
        expect(sf.falta).toBeGreaterThanOrEqual(0);
        // cuadratura de Simpson con 32 subtramos por columna: hasta 1·10⁻⁴ en el panel ancho de Simpson n = 2
        expect(Math.abs(sf.sobra - sf.falta - errorSuma(c, n, m))).toBeLessThan(1e-5 * c.exacta);
      }
    }
  });
  test('el techo pasa por sus tres nodos (Simpson: la parábola por f(x₂ₖ), f(x₂ₖ₊₁), f(x₂ₖ₊₂))', () => {
    const c = FUNCIONES.onda;
    for (const k of columnas(c, 8, 'simpson')) {
      expect(techo(k, k.x0)).toBeCloseTo(c.f(k.x0), 12);
      expect(techo(k, (k.x0 + k.x1) / 2)).toBeCloseTo(c.f((k.x0 + k.x1) / 2), 12);
      expect(techo(k, k.x1)).toBeCloseTo(c.f(k.x1), 12);
    }
    expect(columnas(c, 8, 'simpson')).toHaveLength(4);
  });
  test('la izquierda de la onda sólo falta en n = 2 (no sobra nada) y lo que falta es −E', () => {
    const sf = sobraFalta(FUNCIONES.onda, columnas(FUNCIONES.onda, 2, 'izquierda'));
    expect(sf.sobra).toBeCloseTo(0, 9);
    expect(sf.falta).toBeCloseTo(-errorSuma(FUNCIONES.onda, 2, 'izquierda'), 4);
  });
});

describe('reto: n mínimo y mensajes', () => {
  test('n mínimo: izquierda 58, derecha 59, punto medio 14 (y el anterior no cumple)', () => {
    const esperado: Record<MetodoM9, number> = { izquierda: 58, derecha: 59, punto_medio: 14 };
    for (const m of Object.keys(esperado) as MetodoM9[]) {
      const n = nMinimoReto(m)!;
      expect(n).toBe(esperado[m]);
      expect(evaluarM9({ n, metodo: m, metodoReto: m }).ok).toBe(true);
      expect(evaluarM9({ n: n - 1, metodo: m, metodoReto: m }).ok).toBe(false);
    }
  });
  test('el mensaje de fallo NO da el error relativo ni la integral', () => {
    const v = evaluarM9({ n: 10, metodo: 'izquierda', metodoReto: 'izquierda' });
    expect(v.ok).toBe(false);
    const e = errorRelativoM9(10, 'izquierda') * 100;
    const msj = v.mensaje ?? '';
    for (const t of [e.toFixed(2), e.toFixed(1), num(e, 2), num(e, 1), '43,3', '43.3', '130']) expect(msj).not.toContain(t);
    expect(msj).toContain('2,0 %');
  });
  test('la probeta del reto tiene escala fija: no delata la integral', () => {
    expect(CURVA_RETO.escalaProbeta).toBe(80);
    expect(CURVA_RETO.escalaProbeta % 10).toBe(0);
  });
});

describe('formato con coma decimal', () => {
  test('num, cientifica y leerDecimal', () => {
    expect(num(43.3333, 2)).toBe('43,33');
    expect(num(-0.0001, 2)).toBe('0,00');
    expect(num(-1.5, 1)).toBe('−1,5');
    expect(cientifica(3.2e-5, 1)).toBe('3,2·10⁻⁵');
    expect(leerDecimal('43,333')).toBeCloseTo(43.333, 12);
    expect(leerDecimal('43.333')).toBeCloseTo(43.333, 12);
    expect(leerDecimal('−2,5')).toBe(-2.5);
    expect(leerDecimal('abc')).toBeNaN();
  });
});

describe('el reloj único', () => {
  const correr = (r: RelojRiemann, s: number, dt = 1 / 60) => { for (let t = 0; t < s; t += dt) r.paso(dt); };

  test('llenado: la probeta marca la suma de lo vertido, crece monótona y acaba en Sₙ', () => {
    const c = FUNCIONES.onda;
    const r = new RelojRiemann(c, 'explorar', 'izquierda', N_AUTO_INICIO);
    expect(r.fase).toBe('llenar');
    expect(r.nivel).toBe(0);
    let antes = 0;
    while (r.fase === 'llenar') {
      r.paso(1 / 60);
      const l = r.lectura();
      // nivel = Σ crecimiento·área de lo que se ve
      let visto = 0;
      for (let i = 0; i < r.nVista; i++) visto += areaColumna({ x0: r.vx0[i], x1: r.vx1[i], q0: r.vq0[i], qm: r.vqm[i], q1: r.vq1[i] });
      if (l.fase === 'llenar') {
        expect(l.nivel).toBeCloseTo(visto, 10);
        expect(l.sumaMostrada).toBe(l.nivel);
      }
      expect(l.nivel).toBeGreaterThanOrEqual(antes - 1e-12);
      antes = l.nivel;
    }
    expect(r.fase).toBe('sostener');
    expect(r.nivel).toBeCloseTo(suma(c, 2, 'izquierda'), 12);
  });

  test('n crece solo: 2 → 4 → … → 128; cada transición acaba en las columnas y la suma de la nueva n', () => {
    const c = FUNCIONES.exponencial;
    const r = new RelojRiemann(c, 'explorar', 'punto_medio', N_AUTO_INICIO);
    const vistas: number[] = [];
    for (let k = 0; k < 4000 && r.fase !== 'final'; k++) {
      const f0 = r.fase;
      r.paso(1 / 60);
      if (f0 === 'partir' && r.fase === 'sostener') {
        vistas.push(r.n);
        expect(r.nivel).toBeCloseTo(suma(c, r.n, 'punto_medio'), 10);
        const cols = columnas(c, r.n, 'punto_medio');
        for (let i = 0; i < r.nVista; i++) expect(r.vqm[i]).toBeCloseTo(cols[i].qm, 12);
      }
    }
    expect(vistas).toEqual([4, 8, 16, 32, 64, 128]);
    expect(r.n).toBe(N_AUTO_TOPE);
    // y vuelve a empezar: se vacía y n = 2
    correr(r, 5);
    expect(r.n).toBe(2);
  });

  test('a mano: setN para el bucle; Simpson va con n par', () => {
    const r = new RelojRiemann(FUNCIONES.onda, 'explorar', 'izquierda', 2);
    r.setN(10);
    expect(r.auto).toBe(false);
    correr(r, 1);
    expect(r.fase).toBe('quieto');
    expect(r.lectura().suma).toBeCloseTo(suma(FUNCIONES.onda, 10, 'izquierda'), 12);
    r.setN(7);
    r.setMetodo('simpson');
    expect(r.n).toBe(8);
    correr(r, 1);
    expect(r.nivel).toBeCloseTo(suma(FUNCIONES.onda, 8, 'simpson'), 12);
    expect(r.nVista).toBe(4);
  });

  test('reto: el reloj no avanza n solo y su suma es la del validador', () => {
    const r = new RelojRiemann(CURVA_RETO, 'reto', 'derecha', 20);
    expect(r.auto).toBe(false);
    correr(r, 6);
    expect(r.n).toBe(20);
    expect(r.fase).toBe('quieto');
    expect(r.lectura().suma).toBe(sumaRiemannM9(20, 'derecha'));
  });

  test('movimiento reducido: estatico deja columnas completas y la probeta llena', () => {
    const r = new RelojRiemann(FUNCIONES.cubica, 'explorar', 'trapecio', 2);
    r.estatico(16);
    expect(r.fase).toBe('quieto');
    expect(r.nivel).toBeCloseTo(suma(FUNCIONES.cubica, 16, 'trapecio'), 12);
    expect(r.paso(0.1)).toBe(false);
  });
});

describe('el banco', () => {
  test('la probeta: su cero es el de la función y su fondo de escala ocupa el alto del trazado', () => {
    for (const c of TODAS) {
      const m = mapa(c);
      expect(m.nivel(0)).toBe(Y_BASE);
      expect(m.nivel(c.escalaProbeta)).toBeCloseTo(Y_BASE + ALTO_PLOT, 12);
      expect(m.Y(c.yMax)).toBeCloseTo(Y_BASE + ALTO_PLOT, 12);
      expect(m.xDe(m.X(3.7))).toBeCloseTo(3.7, 12);
      // las sumas del bucle automático (n ≥ 2) caben en la probeta
      for (const met of METODOS) for (let n = 2; n <= 128; n *= 2) expect(suma(c, n, met)).toBeLessThan(c.escalaProbeta);
    }
  });
});
