/**
 * M5 · Círculo trigonométrico — la matemática de `simuladores/mat05/trigonometria.ts` y su
 * reloj (`reloj.ts`), que es lo que dibujan la escena 3D, la onda y el dock.
 *
 *  - Definición geométrica: P = (cos θ, sen θ), identidad pitagórica a 1e-12, tan = sen/cos
 *    y T = (1, tan θ) alineado con O y P (la construcción de la escena).
 *  - Valores notables exactos (la tabla del dock) a 1e-12; radianes exactos.
 *  - Cuadrantes, signos y ángulo de referencia (los que muestra el dock).
 *  - El reto del dominio: sus dos soluciones cumplen la ecuación según este módulo.
 *  - Fourier: b_k en forma cerrada contra la integral numérica, Parseval, convergencia
 *    (orden medido: N^−½ la cuadrada, N^−3/2 la triangular), Leibniz en π/2, el
 *    sobreimpulso de Gibbs → (2/π)·Si(π) y la cadena de epiciclos = suma parcial.
 *  - Reloj único: ω, vuelta y escala del eje θ de la onda.
 */
import {
  leer, geometria, cuadranteDe, referenciaDe, radianesExactos, NOTABLES, valorExacto, norm360, aRad,
  coeficiente, terminos, ondaObjetivo, sumaParcial, epiciclos, sentidosDe, potencia, errorRMS, maximoSuma, integralSeno, GIBBS,
  FORMAS, type Forma,
} from '@/components/simuladores/mat05/trigonometria';
import { RelojTrig, OMEGA_GRADOS, PERIODO_S, xOnda, X0_ONDA, ESCALA_ONDA, LARGO_ONDA } from '@/components/simuladores/mat05/reloj';
import { solucionesM5, VALORES_NOTABLES_M5 } from '@/domain/matematicas';

const ANGULOS = Array.from({ length: 721 }, (_, i) => i * 0.5); // 0°…360° cada medio grado

describe('definición geométrica', () => {
  test('P = (cos θ, sen θ) está en el círculo: sen²θ + cos²θ = 1 a 1e-12', () => {
    for (const g of [...ANGULOS, 1e-7, 89.9999, 123.456, -30, 725]) {
      const l = leer(g);
      expect(Math.abs(l.pitagoras - 1)).toBeLessThan(1e-12);
      const { P, radio } = geometria(g);
      expect(Math.hypot(P[0], P[1])).toBeCloseTo(1, 12);
      expect(Math.hypot(radio[1][0] - radio[0][0], radio[1][1] - radio[0][1])).toBeCloseTo(1, 12);
    }
  });
  test('el segmento del seno mide |sen θ| y el del coseno |cos θ|', () => {
    for (const g of ANGULOS) {
      const { seno, coseno } = geometria(g);
      const l = leer(g);
      expect(Math.abs(seno[1][1] - seno[0][1])).toBeCloseTo(Math.abs(l.sen), 12);
      expect(seno[0][0]).toBe(seno[1][0]); // vertical
      expect(Math.abs(coseno[1][0] - coseno[0][0])).toBeCloseTo(Math.abs(l.cos), 12);
      expect(coseno[0][1]).toBe(coseno[1][1]); // horizontal
    }
  });
  test('tan θ = sen θ / cos θ y T = (1, tan θ) está en la recta OP; indefinida en 90° y 270°', () => {
    for (const g of ANGULOS) {
      const l = leer(g);
      const { tangente, P } = geometria(g);
      if (g === 90 || g === 270) { expect(l.tan).toBeNull(); expect(tangente).toBeNull(); continue; }
      expect(l.tan).not.toBeNull();
      expect(l.tan!).toBeCloseTo(l.sen / l.cos, 12);
      expect(Math.abs(l.tan! - Math.tan(aRad(g))) / Math.max(1, Math.abs(l.tan!))).toBeLessThan(1e-12);
      const T = tangente![1];
      expect(T[0]).toBe(1);
      // O, P y T alineados: el producto cruz P × T es 0
      expect(Math.abs(P[0] * T[1] - P[1] * T[0])).toBeLessThan(1e-12 * Math.max(1, Math.abs(T[1])));
    }
  });
  test('identidades: sen(180° − θ) = sen θ, cos(−θ) = cos θ, sen(θ + 90°) = cos θ, 1 + tan² = 1/cos²', () => {
    for (const g of ANGULOS) {
      const l = leer(g);
      expect(leer(180 - g).sen).toBeCloseTo(l.sen, 12);
      expect(leer(-g).cos).toBeCloseTo(l.cos, 12);
      expect(leer(g + 90).sen).toBeCloseTo(l.cos, 12);
      expect(leer(2 * g).sen).toBeCloseTo(2 * l.sen * l.cos, 12);
      if (l.tan != null && Math.abs(l.cos) > 0.05) expect(1 + l.tan ** 2).toBeCloseTo(1 / l.cos ** 2, 9);
    }
  });
});

describe('valores notables y radianes', () => {
  test('la tabla exacta coincide con sen y cos a 1e-12', () => {
    for (const n of NOTABLES) {
      const l = leer(n.g);
      expect(Math.abs(valorExacto(n.sen) - l.sen)).toBeLessThan(1e-12);
      expect(Math.abs(valorExacto(n.cos) - l.cos)).toBeLessThan(1e-12);
      if (n.g === 90) expect(l.tan).toBeNull();
      else expect(Math.abs(valorExacto(n.tan) - l.tan!)).toBeLessThan(1e-12);
    }
    expect(valorExacto('√3/2')).toBeCloseTo(0.8660254037844386, 15);
    expect(valorExacto('−√2/2')).toBeCloseTo(-Math.SQRT1_2, 15);
  });
  test('radianes exactos: 180° = π, 210° = 7π/6, 315° = 7π/4, 360° = 2π; 37° no es notable', () => {
    expect(radianesExactos(0)).toBe('0');
    expect(radianesExactos(30)).toBe('π/6');
    expect(radianesExactos(90)).toBe('π/2');
    expect(radianesExactos(180)).toBe('π');
    expect(radianesExactos(210)).toBe('7π/6');
    expect(radianesExactos(315)).toBe('7π/4');
    expect(radianesExactos(360)).toBe('2π');
    expect(radianesExactos(37)).toBeNull();
    for (let g = 0; g <= 360; g += 15) {
      const t = radianesExactos(g)!;
      const m = /^(\d*)π(?:\/(\d+))?$/.exec(t);
      const v = t === '0' ? 0 : (Number(m![1] || 1) * Math.PI) / Number(m![2] || 1);
      expect(v).toBeCloseTo(aRad(g), 14);
    }
  });
  test('1 rad = 57,2958° y el arco de radio 1 mide θ(rad)', () => {
    expect(1 / aRad(1)).toBeCloseTo(57.29577951308232, 12);
    expect(aRad(360)).toBeCloseTo(2 * Math.PI, 14);
  });
});

describe('cuadrantes, signos y ángulo de referencia', () => {
  test('signos por cuadrante (Todas, Seno, Tangente, Coseno)', () => {
    const casos: [number, number, number, number, number][] = [
      // g, cuadrante, signo sen, signo cos, signo tan
      [45, 1, 1, 1, 1], [135, 2, 1, -1, -1], [225, 3, -1, -1, 1], [315, 4, -1, 1, -1],
    ];
    for (const [g, q, s, c, t] of casos) {
      const l = leer(g);
      expect(l.cuadrante).toBe(q);
      expect(l.signos).toEqual({ sen: s, cos: c, tan: t });
    }
  });
  test('sobre los ejes el cuadrante es 0 y el signo nulo es 0 (no ±1·10⁻¹⁶)', () => {
    expect(leer(0).signos).toEqual({ sen: 0, cos: 1, tan: 0 });
    expect(leer(90).signos).toEqual({ sen: 1, cos: 0, tan: null });
    expect(leer(180).signos).toEqual({ sen: 0, cos: -1, tan: 0 });
    expect(leer(270).signos).toEqual({ sen: -1, cos: 0, tan: null });
    for (const g of [0, 90, 180, 270, 360]) expect(cuadranteDe(g)).toBe(0);
  });
  test('ángulo de referencia: |sen θ| = sen(ref) y |cos θ| = cos(ref)', () => {
    for (const g of ANGULOS) {
      const r = referenciaDe(g);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(90);
      expect(Math.abs(leer(g).sen)).toBeCloseTo(Math.sin(aRad(r)), 12);
      expect(Math.abs(leer(g).cos)).toBeCloseTo(Math.cos(aRad(r)), 12);
    }
    expect(referenciaDe(210)).toBe(30);
    expect(referenciaDe(300)).toBe(60);
    expect(referenciaDe(135)).toBe(45);
  });
  test('el reto del dominio: sus dos soluciones cumplen la ecuación en esta geometría', () => {
    for (const v of VALORES_NOTABLES_M5) for (const funcion of ['sen', 'cos'] as const) {
      const sol = solucionesM5({ funcion, valor: v.valor });
      for (const s of sol) {
        const l = leer(s);
        expect(funcion === 'sen' ? l.sen : l.cos).toBeCloseTo(v.valor, 12);
      }
      // misma referencia; signo de la función = signo del valor
      expect(referenciaDe(sol[0])).toBeCloseTo(referenciaDe(sol[1]), 12);
    }
  });
  test('norm360 lleva cualquier ángulo a [0, 360)', () => {
    expect(norm360(-30)).toBe(330);
    expect(norm360(720)).toBe(0);
    expect(norm360(359.5)).toBe(359.5);
  });
});

describe('síntesis de Fourier', () => {
  /** b_k = (1/π)·∫₀^{2π} f(θ)·sen(kθ) dθ por punto medio (los saltos caen en bordes de celda). */
  const bNumerico = (forma: Forma, k: number, M = 200000) => {
    const h = (2 * Math.PI) / M;
    let s = 0;
    for (let i = 0; i < M; i++) { const t = (i + 0.5) * h; s += ondaObjetivo(forma, t) * Math.sin(k * t); }
    return (s * h) / Math.PI;
  };
  test('los coeficientes en forma cerrada coinciden con la integral (≤ 1e-8)', () => {
    for (const forma of FORMAS) for (let k = 1; k <= 9; k++) {
      expect(Math.abs(coeficiente(forma, k) - bNumerico(forma, k))).toBeLessThan(1e-8);
    }
    expect(coeficiente('cuadrada', 1)).toBeCloseTo(4 / Math.PI, 15);
    expect(coeficiente('cuadrada', 2)).toBe(0);
    expect(coeficiente('triangular', 3)).toBeCloseTo(-8 / (9 * Math.PI ** 2), 15);
    expect(coeficiente('sierra', 2)).toBeCloseTo(-1 / Math.PI, 15);
  });
  test('términos no nulos: cuadrada k = 1, 3, 5…; sierra k = 1, 2, 3…', () => {
    expect(terminos('cuadrada', 4).map((t) => t.k)).toEqual([1, 3, 5, 7]);
    expect(terminos('triangular', 3).map((t) => t.k)).toEqual([1, 3, 5]);
    expect(terminos('sierra', 4).map((t) => t.k)).toEqual([1, 2, 3, 4]);
  });
  test('Parseval: Σ b_k²/2 → potencia media (1 la cuadrada, 1/3 las otras)', () => {
    for (const forma of FORMAS) {
      const ts = terminos(forma, 20000);
      const suma = ts.reduce((a, t) => a + (t.b * t.b) / 2, 0);
      expect(Math.abs(suma - potencia(forma))).toBeLessThan(forma === 'triangular' ? 1e-12 : 2e-5);
      // potencia media numérica de la onda
      let p = 0; const M = 100000;
      for (let i = 0; i < M; i++) p += ondaObjetivo(forma, ((i + 0.5) * 2 * Math.PI) / M) ** 2;
      expect(p / M).toBeCloseTo(potencia(forma), 6);
    }
  });
  test('el error cuadrático medio baja con N y con el orden medido (−½ cuadrada, −3/2 triangular)', () => {
    for (const forma of FORMAS) {
      let prev = Infinity;
      for (let N = 1; N <= 40; N++) { const e = errorRMS(forma, N); expect(e).toBeLessThan(prev); prev = e; }
    }
    const orden = (forma: Forma) => Math.log(errorRMS(forma, 400) / errorRMS(forma, 100)) / Math.log(4);
    expect(orden('cuadrada')).toBeCloseTo(-0.5, 2);
    expect(orden('sierra')).toBeCloseTo(-0.5, 2);
    expect(orden('triangular')).toBeCloseTo(-1.5, 2);
    // la triangular converge uniformemente: |f − S_N| ≤ Σ_{k>2N−1} 8/(π²k²) < 2/(π²(N−1))
    for (const N of [3, 10, 30]) {
      const ts = terminos('triangular', N);
      let m = 0;
      for (let i = 0; i <= 4000; i++) { const t = (2 * Math.PI * i) / 4000; m = Math.max(m, Math.abs(ondaObjetivo('triangular', t) - sumaParcial(ts, t))); }
      expect(m).toBeLessThan(2 / (Math.PI ** 2 * (N - 1 + 1e-9)));
    }
  });
  test('Leibniz: la cuadrada en θ = π/2 vale (4/π)(1 − 1/3 + 1/5 − …) → 1', () => {
    expect(sumaParcial(terminos('cuadrada', 100000), Math.PI / 2)).toBeCloseTo(1, 4);
    // la triangular en su pico: todos los términos suman; lo que falta es la cola 8/π²·Σ 1/k² ≈ 2/(π²N)
    const N = 2000;
    const falta = 1 - sumaParcial(terminos('triangular', N), Math.PI / 2);
    expect(falta).toBeGreaterThan(0);
    expect(Math.abs(falta / (2 / (Math.PI ** 2 * N)) - 1)).toBeLessThan(0.01);
  });
  test('Gibbs: el máximo de S_N de la cuadrada tiende a (2/π)·Si(π) = 1,17898 y no baja de ahí', () => {
    expect(integralSeno(Math.PI)).toBeCloseTo(1.851937051982466, 12);
    expect(GIBBS).toBeCloseTo(1.1789797444721672, 12);
    // con N grande el máximo está junto al salto (θ ≈ π/(2N)): se barre fino sólo ahí
    const maxJunto = (forma: Forma, N: number, t0: number, t1: number) => {
      const ts = terminos(forma, N);
      let m = -Infinity;
      for (let i = 0; i <= 20000; i++) m = Math.max(m, sumaParcial(ts, t0 + ((t1 - t0) * i) / 20000));
      return m;
    };
    expect(maxJunto('cuadrada', 400, 0, 0.05)).toBeCloseTo(GIBBS, 4);
    // el sobreimpulso NO desaparece al subir N: es ~8,95 % del salto (2)
    for (const N of [5, 10, 50]) expect((maximoSuma('cuadrada', N) - 1) / 2).toBeGreaterThan(0.085);
    // la sierra tiene el mismo sobreimpulso en su salto (θ = π), montado sobre la rampa θ/π:
    // el pico cae en θ ≈ π − π/N, donde la rampa vale 1 − 1/N → máx ≈ GIBBS − 1/N
    expect(Math.abs(maxJunto('sierra', 800, Math.PI - 0.05, Math.PI) - (GIBBS - 1 / 800))).toBeLessThan(2e-4);
  });
  test('la cadena de epiciclos: la altura de la última punta es S_N(θ) en cualquier sentido de giro', () => {
    for (const forma of FORMAS) for (const N of [1, 4, 10]) {
      const ts = terminos(forma, N);
      for (const sentidos of [undefined, sentidosDe(forma, N), ts.map(() => -1 as const)]) {
        for (let i = 0; i < 50; i++) {
          const t = (2 * Math.PI * i) / 50 + 0.013;
          const ch = epiciclos(ts, t, sentidos);
          expect(ch.length).toBe(N);
          expect(ch[N - 1].punta[1]).toBeCloseTo(sumaParcial(ts, t), 12);
          ch.forEach((e, j) => {
            expect(e.r).toBeCloseTo(Math.abs(ts[j].b), 15);
            expect(Math.hypot(e.punta[0] - e.c[0], e.punta[1] - e.c[1])).toBeCloseTo(e.r, 12);
            if (j > 0) expect(e.c).toEqual(ch[j - 1].punta);
          });
        }
      }
    }
  });
  test('con los sentidos alternos la cadena queda acotada: |x| ≤ Gibbs (cuadrada) y ≤ 1 (triangular)', () => {
    const maxX = (forma: Forma, N: number, sentidos?: (1 | -1)[], soloFinal = false) => {
      const ts = terminos(forma, N);
      let m = 0;
      for (let i = 0; i <= 3600; i++) {
        const ch = epiciclos(ts, (2 * Math.PI * i) / 3600, sentidos);
        for (const e of soloFinal ? ch.slice(-1) : ch) m = Math.max(m, Math.abs(e.punta[0]));
      }
      return m;
    };
    // la punta final: la cuadrada en coseno, acotada por Gibbs; ningún eslabón pasa de b₁ = 4/π
    expect(maxX('cuadrada', 10, sentidosDe('cuadrada', 10), true)).toBeLessThan(GIBBS + 1e-3);
    expect(maxX('cuadrada', 10, sentidosDe('cuadrada', 10))).toBeLessThan(4 / Math.PI + 1e-9);
    expect(maxX('triangular', 10, sentidosDe('triangular', 10))).toBeLessThan(1 + 1e-9);
    // en un solo sentido la cuadrada se dispara hasta Σ b_k (la serie conjugada, ~ ln N)
    expect(maxX('cuadrada', 10)).toBeCloseTo(terminos('cuadrada', 10).reduce((a, t) => a + t.b, 0), 6);
    expect(maxX('cuadrada', 10)).toBeGreaterThan(2.7);
    // la sierra (un sentido) se va como mucho a (2/π)·H_N, hacia la izquierda
    const H10 = Array.from({ length: 10 }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0);
    expect(maxX('sierra', 10, sentidosDe('sierra', 10))).toBeCloseTo((2 / Math.PI) * H10, 6);
  });
});

describe('reloj único y eje de la onda', () => {
  test('gira a 30 °/s: una vuelta cada 12 s y la traza vuelve a empezar', () => {
    expect(OMEGA_GRADOS).toBe(30);
    expect(PERIODO_S).toBe(12);
    const r = new RelojTrig();
    r.girando = true;
    for (let i = 0; i < 600; i++) r.paso(0.02); // 12 s
    expect(r.theta).toBeCloseTo(0, 6);
    expect(r.vuelta).toBe(1);
    r.paso(0.05);
    expect(r.theta).toBeCloseTo(1.5, 9);
  });
  test('arrastrar o pausar detiene el giro; fijar normaliza', () => {
    const r = new RelojTrig();
    r.girando = true; r.arrastrando = true;
    expect(r.paso(0.1)).toBe(false);
    r.arrastrando = false; r.girando = false;
    expect(r.paso(0.1)).toBe(false);
    r.fijar(-90);
    expect(r.theta).toBe(270);
    const v = r.version; r.fijar(270);
    expect(r.version).toBe(v); // sin cambio, sin versión nueva
  });
  test('configurar recalcula la serie y acota N a [1, 10]', () => {
    const r = new RelojTrig();
    r.configurar({ modo: 'fourier', forma: 'triangular', n: 3 });
    expect(r.terminos.map((t) => t.k)).toEqual([1, 3, 5]);
    r.configurar({ n: 99 });
    expect(r.terminos.length).toBe(10);
  });
  test('eje θ de la onda: lineal, 0 en X0 y 2π a LARGO_ONDA; la altura de la pluma = la del punto', () => {
    expect(xOnda(0)).toBe(X0_ONDA);
    expect(xOnda(2 * Math.PI) - X0_ONDA).toBeCloseTo(LARGO_ONDA, 12);
    expect(xOnda(1) - xOnda(0)).toBeCloseTo(ESCALA_ONDA, 12);
    // el punto del círculo y la pluma de la onda están a la misma altura (proyección horizontal)
    for (const g of ANGULOS) expect(geometria(g).P[1]).toBe(Math.sin(aRad(norm360(g))));
  });
});
