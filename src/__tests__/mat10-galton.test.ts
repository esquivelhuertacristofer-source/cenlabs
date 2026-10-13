/**
 * MAT-10 · Máquina de Galton — la física de la máquina (`simuladores/mat10/galton.ts`).
 *
 *  - Binomial(10, p): la pmf suma 1, μ = np, σ² = np(1 − p), y coincide con el dominio.
 *  - χ²: la función de distribución (gamma incompleta regularizada) contra la tabla
 *    NIST de valores críticos (α = 0,001 del validador y α = 0,05).
 *  - Generador con semilla reproducible; decisiones Bernoulli(p) exactas; el contenedor
 *    es el número de desvíos a la derecha; muestras simuladas pasan el χ² del validador.
 *  - Inclinación ↔ p (modelo de impacto) y el nivel de burbuja.
 *  - Cinemática: los tramos son continuos, cada impacto está sobre la superficie del
 *    clavo, la bolita no atraviesa clavos, paredes ni tabiques, y acaba en su ranura.
 *  - Pila: empaquetamiento hexagonal sin solapes dentro del canal, capacidad 102, y esa
 *    capacidad no impide llegar a las 200 bolitas del reto en ningún punto del deslizador.
 */
import {
  FILAS, CONTENEDORES, PASO, DY_FILA, R_BOLA, R_CONTACTO, W_IMPACTO, ESPESOR_TABIQUE, ANCHO_CANAL, G,
  Y_SALIDA, Y_TABIQUE, Y_BOCA, Y_FONDO, X_PARED, CAPACIDAD, CAPAS, POR_CAPA, PASO_CAPA, R_VIAL,
  clavo, clavos, xContenedor, xTabique, ranura, alfaDeP, pDeAlfa, corrimiento, gravedadTablero, burbuja,
  crearAzar, generarRecorrido, caidaFinal, enTramo, posicionEn, pmfBinomial, densidadNormal, lnGamma, cdfChi2, pValorChi2,
  muestraSimulada, type Tramo,
} from '@/components/simuladores/mat10/galton';
import {
  pmfBinomialM10, mediaTeoricaM10, sigmaTeoricaM10, chiCuadradaM10, CHI2_CRITICO_001_M10, FILAS_M10, validarM10, MUESTRA_MIN_M10,
} from '@/domain/matematicas';

const P_RETO = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
const P_DESLIZADOR = Array.from({ length: 17 }, (_, i) => Math.round((0.1 + i * 0.05) * 100) / 100);
const fin = (tr: Tramo) => enTramo(tr, tr.dur);

describe('Binomial(10, p)', () => {
  test('la pmf suma 1 y tiene μ = np, σ² = np(1 − p) en toda la rejilla del deslizador', () => {
    for (const p of P_DESLIZADOR) {
      const pmf = Array.from({ length: CONTENEDORES }, (_, k) => pmfBinomial(k, p));
      expect(pmf.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      const mu = pmf.reduce((s, q, k) => s + q * k, 0);
      expect(mu).toBeCloseTo(10 * p, 12);
      expect(pmf.reduce((s, q, k) => s + q * (k - mu) ** 2, 0)).toBeCloseTo(10 * p * (1 - p), 12);
      // la misma que juzga el validador
      for (let k = 0; k <= 10; k++) expect(pmfBinomial(k, p)).toBeCloseTo(pmfBinomialM10(k, p), 14);
      expect(mediaTeoricaM10(p)).toBeCloseTo(mu, 12);
      expect(sigmaTeoricaM10(p)).toBeCloseTo(Math.sqrt(10 * p * (1 - p)), 12);
    }
    expect(FILAS).toBe(FILAS_M10);
  });
  test('valores de tabla: P(5) con p = ½ es 252/1024; P(10) con p = 0,9 es 0,9¹⁰', () => {
    expect(pmfBinomial(5, 0.5)).toBeCloseTo(252 / 1024, 14);
    expect(pmfBinomial(10, 0.9)).toBeCloseTo(0.3486784401, 10);
  });
  test('la normal de De Moivre–Laplace integra 1', () => {
    let s = 0;
    for (let x = -10; x <= 20; x += 0.001) s += densidadNormal(x, 5, Math.sqrt(2.5)) * 0.001;
    expect(s).toBeCloseTo(1, 5);
  });
});

describe('χ² de bondad de ajuste', () => {
  test('lnΓ: Γ(5) = 24, Γ(½) = √π, Γ(3,5) = 15√π/8', () => {
    expect(lnGamma(5)).toBeCloseTo(Math.log(24), 12);
    expect(lnGamma(0.5)).toBeCloseTo(0.5 * Math.log(Math.PI), 12);
    expect(lnGamma(3.5)).toBeCloseTo(Math.log((15 * Math.sqrt(Math.PI)) / 8), 12);
  });
  test('la tabla del validador (α = 0,001, NIST) es el cuantil 0,999 de χ²', () => {
    CHI2_CRITICO_001_M10.forEach((c, i) => expect(cdfChi2(c, i + 1)).toBeCloseTo(0.999, 5));
  });
  test('cuantiles 0,95 de tabla (NIST 1.3.6.7.4)', () => {
    const t95 = [3.841, 5.991, 7.815, 9.488, 11.07, 12.592, 14.067, 15.507, 16.919, 18.307];
    t95.forEach((c, i) => expect(cdfChi2(c, i + 1)).toBeCloseTo(0.95, 3));
  });
  test('casos cerrados: gl = 2 → F = 1 − e^(−x/2); gl = 1 → F = erf(√(x/2))', () => {
    for (const x of [0.3, 1, 2.5, 7, 15]) expect(cdfChi2(x, 2)).toBeCloseTo(1 - Math.exp(-x / 2), 12);
    expect(cdfChi2(1, 1)).toBeCloseTo(0.682689492137, 10); // ±1σ
    expect(pValorChi2(3.841458820694124, 1)).toBeCloseTo(0.05, 10);
  });
});

describe('azar reproducible y decisiones de Bernoulli', () => {
  test('la misma semilla da la misma muestra; otra semilla, otra', () => {
    const a = muestraSimulada(0.65, 300, crearAzar(42));
    const b = muestraSimulada(0.65, 300, crearAzar(42));
    const c = muestraSimulada(0.65, 300, crearAzar(43));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.reduce((x, y) => x + y, 0)).toBe(300);
    // y el recorrido entero (no sólo k) es idéntico
    const r1 = generarRecorrido(0.3, crearAzar(7)), r2 = generarRecorrido(0.3, crearAzar(7));
    expect(r1).toEqual(r2);
  });
  test('el contenedor es el número de desvíos a la derecha y el camino es coherente', () => {
    const azar = crearAzar(1);
    for (let i = 0; i < 800; i++) {
      const r = generarRecorrido(P_DESLIZADOR[i % P_DESLIZADOR.length], azar);
      expect(r.decisiones).toHaveLength(FILAS);
      expect(r.k).toBe(r.decisiones.filter((s) => s > 0).length);
      expect(r.clavosTocados[0]).toBe(0);
      for (let f = 0; f < FILAS - 1; f++) expect(r.clavosTocados[f + 1]).toBe(r.clavosTocados[f] + (r.decisiones[f] > 0 ? 1 : 0));
      // decide el LADO del clavo que toca
      r.impactos.forEach((b, f) => expect(Math.sign(b)).toBe(r.decisiones[f]));
    }
  });
  test('P(derecha) = p en cada clavo (15 000 decisiones por p, a menos de 4 errores típicos)', () => {
    for (const p of [0.1, 0.25, 0.5, 0.7, 0.9]) {
      const azar = crearAzar(Math.round(p * 1000));
      let der = 0, n = 0;
      for (let i = 0; i < 1500; i++) { const r = generarRecorrido(p, azar); der += r.decisiones.filter((s) => s > 0).length; n += FILAS; }
      expect(Math.abs(der / n - p)).toBeLessThan(4 * Math.sqrt((p * (1 - p)) / n));
    }
  });
  test('las decisiones de una misma bolita son independientes (correlación entre filas ≈ 0)', () => {
    const p = 0.7, azar = crearAzar(99);
    let sxy = 0, sx = 0, sy = 0, sxx = 0, n = 0;
    for (let i = 0; i < 6000; i++) {
      const d = generarRecorrido(p, azar).decisiones.map((s) => (s > 0 ? 1 : 0));
      for (let f = 0; f < FILAS - 1; f++) { sx += d[f]; sy += d[f + 1]; sxy += d[f] * d[f + 1]; sxx += d[f]; n++; }
    }
    const cov = sxy / n - (sx / n) * (sy / n), varz = sxx / n - (sx / n) ** 2;
    expect(Math.abs(cov / varz)).toBeLessThan(0.02);
  });
  test('μ y σ muestrales convergen a np y √(np(1−p)) (8000 bolitas)', () => {
    for (const p of [0.2, 0.5, 0.8]) {
      const c = muestraSimulada(p, 8000, crearAzar(5 + Math.round(p * 10)));
      const N = 8000, media = c.reduce((s, x, k) => s + x * k, 0) / N;
      const varz = c.reduce((s, x, k) => s + x * (k - media) ** 2, 0) / N;
      expect(Math.abs(media - 10 * p)).toBeLessThan(4 * Math.sqrt((10 * p * (1 - p)) / N));
      expect(Math.sqrt(varz)).toBeCloseTo(Math.sqrt(10 * p * (1 - p)), 1);
    }
  });
  test('muestras de 250 bolitas de la máquina pasan el χ² del validador (149 de 150; α = 0,001) y la predicción exacta valida', () => {
    let ok = 0;
    const azar = crearAzar(2026);
    for (let i = 0; i < 150; i++) {
      const p = P_RETO[i % P_RETO.length];
      const c = muestraSimulada(p, 250, azar);
      const { chi2, critico } = chiCuadradaM10(c, p);
      if (chi2 <= critico && validarM10({ probabilidad: p, contenedores: c, prediccionMedia: (10 * p).toFixed(2), prediccionSigma: Math.sqrt(10 * p * (1 - p)).toFixed(2) } as never)) ok++;
    }
    expect(ok).toBeGreaterThanOrEqual(149);
  });
});

describe('inclinación ↔ p (modelo de impacto)', () => {
  test('a plomo p = ½; la inversa recupera p; es monótona', () => {
    expect(alfaDeP(0.5)).toBe(0);
    let prev = -Infinity;
    for (const p of P_DESLIZADOR) {
      expect(pDeAlfa(alfaDeP(p))).toBeCloseTo(p, 12);
      expect(alfaDeP(p)).toBeGreaterThan(prev);
      prev = alfaDeP(p);
    }
  });
  test('tan α = (2p − 1)·w/h: p = 0,75 → 3,85°, p = 0,9 → 6,13°', () => {
    const grados = (a: number) => (a * 180) / Math.PI;
    expect(Math.tan(alfaDeP(0.75))).toBeCloseTo((0.5 * W_IMPACTO) / DY_FILA, 12);
    expect(grados(alfaDeP(0.75))).toBeCloseTo(3.846, 2);
    expect(grados(alfaDeP(0.9))).toBeCloseTo(6.13, 1);
    expect(grados(alfaDeP(0.25))).toBeCloseTo(-3.846, 2);
  });
  test('la deriva de una fila desde el reposo con el tablero inclinado es δ = h·tan α', () => {
    for (const p of [0.2, 0.65, 0.9]) {
      const a = alfaDeP(p), [ax, ay] = gravedadTablero(a);
      const T = Math.sqrt((2 * DY_FILA) / -ay);
      expect(0.5 * ax * T * T).toBeCloseTo(corrimiento(p), 12);
      expect(Math.hypot(ax, ay)).toBeCloseTo(G, 9);
    }
  });
  test('el impacto nunca se sale del clavo: |b| < R en todo el deslizador', () => {
    const azar = crearAzar(3);
    for (const p of [0.1, 0.9]) for (let i = 0; i < 1500; i++) {
      for (const b of generarRecorrido(p, azar).impactos) expect(Math.abs(b)).toBeLessThan(R_CONTACTO);
    }
    expect(W_IMPACTO + corrimiento(0.9)).toBeLessThan(R_CONTACTO);
  });
  test('nivel de burbuja: s = R·α hacia el lado alto (R = 50 cm: 0,87 cm por grado)', () => {
    expect(burbuja(alfaDeP(0.5))).toBeCloseTo(0, 12);
    expect(burbuja((Math.PI / 180) * 1)).toBeCloseTo(-0.8727, 4);
    expect(Math.sign(burbuja(alfaDeP(0.8)))).toBe(-1); // baja la derecha → la burbuja sube a la izquierda
    expect(R_VIAL).toBe(50);
  });
});

describe('cinemática del vuelo', () => {
  const PEGS = clavos();
  test('55 clavos en red triangular: fila i en y = −i·h, clavo j en x = (j − i/2)·d', () => {
    expect(PEGS).toHaveLength(55);
    expect(clavo(9, 0)).toEqual([-4.5 * PASO, -9 * DY_FILA]);
    // los tabiques 1…10 caen bajo los clavos de la última fila
    for (let j = 0; j < FILAS; j++) expect(xTabique(j + 1)).toBeCloseTo(clavo(FILAS - 1, j)[0], 12);
    expect(xTabique(0)).toBeCloseTo(-X_PARED, 12);
  });
  test('tramos continuos y contiguos; cada impacto está sobre la superficie del clavo', () => {
    const azar = crearAzar(11);
    for (let i = 0; i < 500; i++) {
      const p = P_DESLIZADOR[i % P_DESLIZADOR.length];
      const r = generarRecorrido(p, azar);
      expect(r.tramos).toHaveLength(FILAS + 1);
      expect(r.tramos[0].y0).toBeCloseTo(Y_SALIDA, 12);
      expect(r.tramos[0].vx).toBe(0); expect(r.tramos[0].vy).toBe(0);
      for (let f = 0; f < r.tramos.length; f++) {
        const tr = r.tramos[f];
        expect(tr.dur).toBeGreaterThan(0);
        if (f < r.tramos.length - 1) {
          const [x, y] = fin(tr), sig = r.tramos[f + 1];
          expect(sig.t0).toBeCloseTo(tr.t0 + tr.dur, 12);
          expect(x).toBeCloseTo(sig.x0, 9); expect(y).toBeCloseTo(sig.y0, 9);
          const [cx, cy] = clavo(f, r.clavosTocados[f]);
          expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(R_CONTACTO, 9);
        }
      }
      const [xb, yb] = fin(r.tramos[FILAS]);
      expect(xb).toBeCloseTo(r.boca.x, 9); expect(yb).toBeCloseTo(Y_BOCA, 9);
      expect(Math.abs(xb - xContenedor(r.k))).toBeLessThanOrEqual(0.25 + 1e-9);
    }
  });
  test('la bolita no atraviesa clavos, paredes ni tabiques (muestreo fino de 600 recorridos)', () => {
    const azar = crearAzar(77);
    let peor = Infinity, fueraDePared = 0, contraTabique = 0;
    for (let i = 0; i < 600; i++) {
      const p = [0.1, 0.3, 0.5, 0.7, 0.9][i % 5];
      const r = generarRecorrido(p, azar);
      for (const tr of r.tramos) for (let s = 0; s <= 100; s++) {
        const [x, y] = enTramo(tr, (s / 100) * tr.dur);
        for (const [cx, cy] of PEGS) { const d = Math.hypot(x - cx, y - cy); if (d < peor) peor = d; }
        if (Math.abs(x) > X_PARED - R_BOLA) fueraDePared++;
        if (y - R_BOLA <= Y_TABIQUE) for (let m = 1; m <= FILAS; m++) {
          if (Math.abs(x - xTabique(m)) < R_BOLA + ESPESOR_TABIQUE / 2) contraTabique++;
        }
      }
    }
    // tolerancia: 0,1 mm (la comprobación del modelo muestrea cada vuelo en 32 puntos)
    expect(peor).toBeGreaterThan(R_CONTACTO - 0.01);
    expect(fueraDePared).toBe(0);
    expect(contraTabique).toBe(0);
  });
  test('tiempos realistas: 15–140 ms entre clavos; de la tolva a la boca en menos de 1,2 s', () => {
    const azar = crearAzar(5);
    for (let i = 0; i < 500; i++) {
      const r = generarRecorrido([0.2, 0.5, 0.8][i % 3], azar);
      for (const tr of r.tramos.slice(1)) { expect(tr.dur).toBeGreaterThan(0.015); expect(tr.dur).toBeLessThan(0.14); }
      expect(r.tBoca).toBeLessThan(1.2);
    }
  });
  test('la caída final acaba en la ranura y el bote vuelve a ella', () => {
    const azar = crearAzar(8);
    for (let i = 0; i < 300; i++) {
      const p = [0.15, 0.5, 0.85][i % 3];
      const r = generarRecorrido(p, azar);
      const n = i % CAPACIDAD;
      const destino = ranura(r.k, n);
      const t = caidaFinal(r.tBoca, r.boca, destino, alfaDeP(p));
      expect(t[0].x0).toBeCloseTo(r.boca.x, 12); expect(t[0].y0).toBeCloseTo(r.boca.y, 12);
      expect(t[0].t0).toBeCloseTo(r.tBoca, 12);
      const [x1, y1] = fin(t[0]);
      expect(x1).toBeCloseTo(destino[0], 9); expect(y1).toBeCloseTo(destino[1], 9);
      const [x2, y2] = fin(t[1]);
      expect(x2).toBeCloseTo(destino[0], 9); expect(y2).toBeCloseTo(destino[1], 9);
      expect(t[1].vy).toBeGreaterThan(0);
      // dentro de su canal en todo momento
      for (let s = 0; s <= 40; s++) {
        const [x] = enTramo(t[0], (s / 40) * t[0].dur);
        expect(Math.abs(x - xContenedor(r.k))).toBeLessThanOrEqual(ANCHO_CANAL / 2 - R_BOLA + 1e-9);
      }
      expect(posicionEn([...r.tramos, ...t], 1e9)).toEqual(fin(t[1]));
    }
  });
});

describe('la pila en el canal', () => {
  test('capacidad: 34 capas de 3 → 102 bolitas; la capa de arriba queda un diámetro bajo la boca', () => {
    expect(POR_CAPA).toBe(3);
    expect(CAPAS).toBe(34);
    expect(CAPACIDAD).toBe(102);
    expect(ranura(5, CAPACIDAD - 1)[1]).toBeLessThanOrEqual(Y_BOCA - 2 * R_BOLA);
    expect(PASO_CAPA).toBeCloseTo(R_BOLA * Math.sqrt(3), 12);
  });
  test('hexagonal compacta: sin solapes, dentro del canal, y cada bolita de arriba apoya en dos de abajo', () => {
    for (const k of [0, 5, 10]) {
      const pts = Array.from({ length: CAPACIDAD }, (_, n) => ranura(k, n));
      for (let a = 0; a < pts.length; a++) {
        const [x, y] = pts[a];
        expect(x - R_BOLA).toBeGreaterThanOrEqual(xContenedor(k) - ANCHO_CANAL / 2 - 1e-9);
        expect(x + R_BOLA).toBeLessThanOrEqual(xContenedor(k) + ANCHO_CANAL / 2 + 1e-9);
        expect(y - R_BOLA).toBeGreaterThanOrEqual(Y_FONDO - 1e-9);
        let apoyos = 0;
        for (let b = 0; b < pts.length; b++) {
          if (a === b) continue;
          const d = Math.hypot(pts[b][0] - x, pts[b][1] - y);
          expect(d).toBeGreaterThanOrEqual(2 * R_BOLA - 1e-9);
          if (pts[b][1] < y - 1e-9 && Math.abs(d - 2 * R_BOLA) < 1e-9) apoyos++;
        }
        if (y > Y_FONDO + R_BOLA + 1e-9) expect(apoyos).toBeGreaterThanOrEqual(1);
      }
    }
  });
  test('la máquina no se llena antes de la bolita 200 del reto (cota de la unión con colas binomiales exactas)', () => {
    // La bolita 200 sale si, tras las 199 primeras, ningún canal está lleno:
    // P(bloqueo) ≤ Σ_k P(Bin(199, P_k) ≥ C), con P_k la pmf de Binomial(10, p).
    const cola = (n: number, q: number, m: number) => {
      let s = 0;
      for (let j = m; j <= n; j++) s += Math.exp(lnGamma(n + 1) - lnGamma(j + 1) - lnGamma(n - j + 1) + j * Math.log(q) + (n - j) * Math.log1p(-q));
      return s;
    };
    const bloqueo = (p: number, cap: number) => {
      let s = 0;
      for (let k = 0; k <= FILAS; k++) s += cola(MUESTRA_MIN_M10 - 1, pmfBinomial(k, p), cap);
      return s;
    };
    const peor = Math.max(...P_DESLIZADOR.map((p) => bloqueo(p, CAPACIDAD)));
    expect(peor).toBeLessThan(5e-4);
    expect(bloqueo(0.9, CAPACIDAD)).toBeCloseTo(bloqueo(0.1, CAPACIDAD), 12);
    // con los 84 de antes (28 capas) el extremo del deslizador se bloqueaba 1 de cada 5 veces
    expect(bloqueo(0.9, 84)).toBeGreaterThan(0.18);
  });
  test('la altura de la pila es proporcional a su cuenta (3 bolitas por capa de Ø·√3/2)', () => {
    expect(ranura(3, 30)[1] - ranura(3, 0)[1]).toBeCloseTo(10 * PASO_CAPA, 12);
  });
});
