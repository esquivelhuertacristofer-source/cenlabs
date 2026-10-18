/**
 * Q10 · Destilación fraccionada — la física de `simuladores/qmi10/columna.ts`.
 *
 *  - Equilibrio: Antoine da los puntos de ebullición normales del NIST; Raoult (burbuja/rocío)
 *    coherente; la curva y = αx/(1 + (α − 1)x) con α = 2,47 y su inversa; lo que se aparta de
 *    Raoult exacto (< 0,008 en y); etanol–agua con el azeótropo del dominio.
 *  - Flujos con derrame molar constante: V̄ = Q/λ, D = V/(R+1), L/V = R/(R+1), F = D + B.
 *  - McCabe–Thiele: la columna de 6 etapas en régimen cumple las dos rectas de operación
 *    plato a plato, el equilibrio en cada etapa y el balance de materia F·z = D·x_D + B·x_B;
 *    las rectas se cortan sobre la recta q (x = z).
 *  - Fenske: k etapas a reflujo total ⇔ N_min = k; la columna cerrada a reflujo total da
 *    N_min = 6 (sus 5 platos + hervidor).
 *  - Underwood = pellizco geométrico; la escalera necesita etapas infinitas al acercarse a R_min
 *    y no pasa por debajo de él; el etanol–agua tiene pellizco TANGENTE cerca del azeótropo.
 *  - Dinámica de platos: el régimen de McCabe–Thiele es su punto fijo, converge a él desde
 *    otro estado y, a reflujo total, conserva el inventario.
 *  - Reto: el perfil de los platos termina EXACTAMENTE en el destilado del dominio.
 *  - Reloj: el divisor pasa 1/(R + 1) del tiempo en toma; el receptor recoge D·v_molar; en el reto
 *    la columna está fría y vacía hasta que hierve, y luego sigue al store.
 */
import {
  MEZCLAS, ALFA_HEXANO_HEPTANO, ANTOINE, N_PLATOS, PLATO_ALIMENTACION, R_MAX, Q_MIN, Q_MAX,
  presionVapor, tSaturacion, tBurbujaRaoult, tRocioRaoult, yRaoult, yAlfa, xAlfa, alfaRaoult,
  flujos, regimen, regimenTotal, rectaRectificacion, rectaAgotamiento, enRecta, corteRectas,
  fenske, underwood, reflujoMinimo, escalera, ColumnaDinamica, perfilReto, colorComposicion, AZEOTROPO_ETANOL, volumenMolar,
  type Operacion,
} from '@/components/simuladores/qmi10/columna';
import {
  yEquilibrio, tBurbuja, composicionDestilado, etapasEfectivas, pasoDestilacion, fraccionMolarDesdeVolumenes,
} from '@/domain/quimica';
import { RelojDestilacion } from '@/components/simuladores/qmi10/reloj';

const HH = MEZCLAS.hexanoHeptano;
const EA = MEZCLAS.etanolAgua;
const op = (R: number, Q: number, total = false): Operacion => ({ R, Q, total });
const RANGOS: [number, number][] = [[1, 300], [1.5, 200], [2, 280], [3, 280], [5, 300], [8, 150], [R_MAX, Q_MIN], [R_MAX, Q_MAX]];

describe('equilibrio líquido–vapor', () => {
  test('Antoine da los puntos de ebullición normales del NIST (68,73 y 98,43 °C)', () => {
    expect(tSaturacion(ANTOINE.hexano)).toBeCloseTo(68.73, 1);
    expect(tSaturacion(ANTOINE.heptano)).toBeCloseTo(98.43, 1);
    expect(presionVapor(ANTOINE.hexano, tSaturacion(ANTOINE.hexano))).toBeCloseTo(760, 9);
  });
  test('Raoult: burbuja y rocío coinciden en los puros y forman la lente entre ellos', () => {
    const l = ANTOINE.hexano, p = ANTOINE.heptano;
    expect(tBurbujaRaoult(1, l, p)).toBeCloseTo(tSaturacion(l), 8);
    expect(tBurbujaRaoult(0, l, p)).toBeCloseTo(tSaturacion(p), 8);
    expect(tRocioRaoult(1, l, p)).toBeCloseTo(tSaturacion(l), 8);
    for (let x = 0.05; x < 1; x += 0.05) {
      // el rocío de una composición está por encima de su burbuja
      expect(tRocioRaoult(x, l, p)).toBeGreaterThan(tBurbujaRaoult(x, l, p));
      // el vapor de Raoult en equilibrio con x tiene su rocío a la burbuja de x
      expect(tRocioRaoult(yRaoult(x, l, p), l, p)).toBeCloseTo(tBurbujaRaoult(x, l, p), 6);
    }
  });
  test('α = media geométrica de P₁/P₂ en los dos puntos de ebullición: 2,47', () => {
    const a1 = alfaRaoult(tSaturacion(ANTOINE.hexano), ANTOINE.hexano, ANTOINE.heptano);
    const a2 = alfaRaoult(tSaturacion(ANTOINE.heptano), ANTOINE.hexano, ANTOINE.heptano);
    expect(a1).toBeCloseTo(2.618, 2);
    expect(a2).toBeCloseTo(2.330, 2);
    expect(ALFA_HEXANO_HEPTANO).toBeCloseTo(2.47, 2);
  });
  test('la curva del lab es y = αx/(1 + (α − 1)x) y su inversa es exacta', () => {
    const a = ALFA_HEXANO_HEPTANO;
    for (let x = 0; x <= 1.0000001; x += 0.0625) {
      expect(HH.yEq(x)).toBeCloseTo((a * x) / (1 + (a - 1) * x), 14);
      expect(HH.xEq(HH.yEq(x))).toBeCloseTo(x, 12);
      expect(xAlfa(yAlfa(x, a), a)).toBeCloseTo(x, 12);
    }
    // caso de libro: x = 0,5 → y = α/(α + 1)
    expect(HH.yEq(0.5)).toBeCloseTo(a / (a + 1), 14);
  });
  test('α constante se aparta de Raoult exacto menos de 0,008 en y (la simplificación, medida)', () => {
    let d = 0;
    for (let x = 0; x <= 1; x += 0.005) d = Math.max(d, Math.abs(HH.yEq(x) - yRaoult(x, ANTOINE.hexano, ANTOINE.heptano)));
    expect(d).toBeLessThan(0.008);
    expect(d).toBeGreaterThan(0.005);
  });
  test('etanol–agua: los datos del dominio, el azeótropo en 0,894 y la inversa', () => {
    expect(EA.yEq(AZEOTROPO_ETANOL)).toBeCloseTo(AZEOTROPO_ETANOL, 12);
    expect(EA.tBurbuja(0)).toBe(100);
    expect(EA.tBurbuja(AZEOTROPO_ETANOL)).toBeCloseTo(78.15, 2);
    for (let x = 0.01; x < AZEOTROPO_ETANOL; x += 0.037) {
      expect(EA.yEq(x)).toBe(yEquilibrio(x));
      expect(EA.xEq(EA.yEq(x))).toBeCloseTo(x, 9);
      // el vapor sale de la tabla a la misma temperatura que su líquido
      expect(EA.tRocio(EA.yEq(x))).toBeCloseTo(tBurbuja(x), 6);
    }
  });
});

describe('flujos con derrame molar constante', () => {
  test('V̄ = Q/λ, D = V/(R+1), L/V = R/(R+1), L̄ = L + F, F = D + B', () => {
    for (const [R, Q] of RANGOS) {
      const f = flujos(HH, op(R, Q));
      expect(f.Vb).toBeCloseTo((Q * 3600) / HH.lambda, 10);
      expect(f.D).toBeCloseTo(f.V / (R + 1), 12);
      expect(f.L / f.V).toBeCloseTo(R / (R + 1), 12);
      expect(f.Lb).toBeCloseTo(f.L + f.F, 12);
      expect(f.D + f.B).toBeCloseTo(f.F, 12);
      expect(f.B).toBeGreaterThan(0);
    }
  });
  test('a reflujo total no entra ni sale nada y L = V', () => {
    const f = flujos(HH, op(3, 200, true));
    expect([f.F, f.D, f.B]).toEqual([0, 0, 0]);
    expect(f.L).toBe(f.V);
  });
});

describe('McCabe–Thiele: la columna de 6 etapas en régimen', () => {
  for (const M of [HH, EA]) {
    test(`${M.nombre}: rectas de operación plato a plato, equilibrio y balance de materia`, () => {
      for (const [R, Q] of RANGOS) {
        const r = regimen(M, op(R, Q));
        const f = r.flujos;
        expect(Math.abs(r.residuo)).toBeLessThan(1e-9);
        // balance global del ligero
        expect(f.D * r.xD + f.B * r.xB).toBeCloseTo(f.F * M.z, 9);
        const rec = rectaRectificacion(R, r.xD);
        const ago = rectaAgotamiento(f, r.xB);
        // la de rectificación tiene pendiente R/(R+1) y pasa por (x_D, x_D); la de agotamiento por (x_B, x_B)
        expect(rec.m).toBeCloseTo(R / (R + 1), 14);
        expect(enRecta(rec, r.xD)).toBeCloseTo(r.xD, 14);
        expect(enRecta(ago, r.xB)).toBeCloseTo(r.xB, 12);
        // se cortan sobre la recta q (alimentación líquida saturada: x = z)
        expect(corteRectas(rec, ago)[0]).toBeCloseTo(M.z, 9);
        // cada etapa: vapor en equilibrio con su líquido; y el vapor que sube de abajo sobre su recta
        for (let n = 1; n <= N_PLATOS; n++) {
          expect(r.y[n - 1]).toBeCloseTo(M.yEq(r.x[n - 1]), 9);
          const yAbajo = n < N_PLATOS ? r.y[n] : r.yB;
          const recta = n < PLATO_ALIMENTACION ? rec : ago;
          expect(yAbajo).toBeCloseTo(enRecta(recta, r.x[n - 1]), 9);
        }
        expect(r.yB).toBeCloseTo(M.yEq(r.xB), 9);
        // condensador total
        expect(r.y[0]).toBe(r.xD);
        // el ligero se concentra hacia arriba
        for (let n = 1; n < N_PLATOS; n++) expect(r.x[n - 1]).toBeGreaterThan(r.x[n]);
      }
    });
  }
  test('más reflujo con el mismo calor: destilado más puro, menos destilado', () => {
    const a = regimen(HH, op(2, 280)), b = regimen(HH, op(5, 280));
    expect(b.xD).toBeGreaterThan(a.xD);
    expect(b.flujos.D).toBeLessThan(a.flujos.D);
    // cifras de la columna por defecto (R = 2, 280 W)
    expect(a.xD).toBeCloseTo(0.8418, 3);
    expect(a.xB).toBeCloseTo(0.1135, 3);
  });
  test('el etanol–agua no cruza el azeótropo con ningún reflujo ni calor', () => {
    for (const R of [1, 3, 8, R_MAX]) for (const Q of [Q_MIN, 200, Q_MAX]) {
      expect(regimen(EA, op(R, Q)).xD).toBeLessThanOrEqual(AZEOTROPO_ETANOL);
    }
  });
});

describe('Fenske, Underwood y el reflujo mínimo', () => {
  const a = ALFA_HEXANO_HEPTANO;
  test('Fenske: k etapas a reflujo total desde x_D dan N_min = k', () => {
    for (const xD of [0.8, 0.9, 0.99]) for (let k = 1; k <= 9; k++) {
      let x = xD;
      for (let i = 0; i < k; i++) x = HH.xEq(x); // reflujo total: y_{n+1} = x_n
      expect(fenske(xD, x, a)).toBeCloseTo(k, 9);
    }
  });
  test('Fenske con la escalera de McCabe–Thiele a reflujo total (la diagonal)', () => {
    const e = escalera(HH, 0.95, 0.05, Infinity, HH.z, true);
    // la escalera interpola la última etapa en x; Fenske la da en log-cocientes: < 0,35 de diferencia
    expect(Math.abs(e.etapas - fenske(0.95, 0.05, a))).toBeLessThan(0.35);
    expect(Math.ceil(e.etapas)).toBe(Math.ceil(fenske(0.95, 0.05, a)));
  });
  test('Underwood = pellizco de McCabe–Thiele en la recta q (q = 1)', () => {
    for (const z of [0.2, 0.45, 0.7]) for (const xD of [0.85, 0.95, 0.99]) {
      const u = underwood(a, z, xD).Rmin;
      const g = reflujoMinimo(HH, xD, z);
      expect(g.Rmin).toBeCloseTo(u, 10);
      expect(g.xPellizco).toBe(z);
      // forma cerrada del pellizco: (x_D − y*)/(y* − x*) con x* = z
      const ys = HH.yEq(z);
      expect(u).toBeCloseTo((xD - ys) / (ys - z), 10);
    }
    // a mano: y* = 2,46996·0,45/(1 + 1,46996·0,45) = 0,66897 → (0,9 − 0,66897)/(0,66897 − 0,45) = 1,0550
    expect(underwood(a, HH.z, 0.9).Rmin).toBeCloseTo(1.0550, 3);
  });
  test('la escalera crece sin límite al acercarse a R_min y se detiene por debajo', () => {
    const Rmin = reflujoMinimo(HH, 0.9, HH.z).Rmin;
    const N = (k: number) => escalera(HH, 0.9, 0.1, Rmin * k, HH.z).etapas;
    expect(N(2)).toBeCloseTo(7.63, 1);
    expect(N(1.5)).toBeLessThan(N(1.1));
    expect(N(1.1)).toBeLessThan(N(1.02));
    expect(N(1.02)).toBeGreaterThan(2 * N(2));
    expect(N(0.98)).toBe(Infinity);
    // con R grande se acerca a Fenske
    expect(N(200)).toBeLessThan(fenske(0.9, 0.1, a) + 1.3);
  });
  test('etanol–agua: pellizco tangente cerca del azeótropo para x_D ≥ 0,8', () => {
    const r = reflujoMinimo(EA, 0.85, EA.z);
    expect(r.xPellizco).toBeGreaterThan(EA.z + 0.3);
    expect(r.Rmin).toBeGreaterThan(1.5);
    expect(escalera(EA, 0.85, 0.02, r.Rmin * 1.05, EA.z).etapas).toBeLessThan(Infinity);
    expect(escalera(EA, 0.85, 0.02, r.Rmin * 0.97, EA.z).etapas).toBe(Infinity);
    // por debajo del pellizco tangente, el de la recta q es el que manda
    expect(reflujoMinimo(EA, 0.7, EA.z).xPellizco).toBe(EA.z);
  });
});

describe('dinámica de platos', () => {
  test('el régimen de McCabe–Thiele es su punto fijo (dx/dt ≈ 0)', () => {
    for (const M of [HH, EA]) for (const [R, Q] of RANGOS) {
      const c = new ColumnaDinamica(M, op(R, Q));
      const d = new Float64Array(N_PLATOS + 2);
      c.derivadas(c.x, d);
      for (const v of d) expect(Math.abs(v)).toBeLessThan(1e-12);
    }
  });
  test('desde otro régimen converge al nuevo (R de 2 a 6)', () => {
    const c = new ColumnaDinamica(HH, op(2, 280));
    c.ajustar(op(6, 280));
    c.integrar(20000);
    const r = regimen(HH, op(6, 280));
    expect(c.x[0]).toBeCloseTo(r.xD, 6);
    expect(c.x[N_PLATOS + 1]).toBeCloseTo(r.xB, 6);
    for (let n = 1; n <= N_PLATOS; n++) expect(c.x[n]).toBeCloseTo(r.x[n - 1], 6);
  });
  test('el inventario cambia exactamente por F·z − D·x_D − B·x_B', () => {
    const c = new ColumnaDinamica(HH, op(2, 280));
    c.ajustar(op(4, 220));
    const f = c.fl;
    let I = c.inventario(), esperado = I;
    for (let i = 0; i < 400; i++) {
      const xD0 = c.x[0], xB0 = c.x[N_PLATOS + 1];
      c.integrar(1);
      const xD1 = c.x[0], xB1 = c.x[N_PLATOS + 1];
      esperado += ((f.F * HH.z - f.D * (xD0 + xD1) / 2 - f.B * (xB0 + xB1) / 2) / 3600) * 1;
      I = c.inventario();
    }
    expect(I).toBeCloseTo(esperado, 6);
  });
  test('a reflujo total conserva el inventario y llega al perfil de Fenske: 6 etapas', () => {
    const c = new ColumnaDinamica(HH, op(2, 280));
    const I0 = c.inventario();
    c.ajustar(op(2, 280, true));
    c.integrar(6000);
    expect(c.inventario()).toBeCloseTo(I0, 12);
    const r = regimenTotal(HH, 280, c.M, I0);
    expect(c.x[0]).toBeCloseTo(r.xD, 7);
    expect(c.x[N_PLATOS + 1]).toBeCloseTo(r.xB, 7);
    expect(fenske(r.xD, r.xB, ALFA_HEXANO_HEPTANO)).toBeCloseTo(N_PLATOS + 1, 9);
    expect(fenske(c.x[0], c.x[N_PLATOS + 1], ALFA_HEXANO_HEPTANO)).toBeCloseTo(N_PLATOS + 1, 5);
  });
});

describe('el reto (modelo del dominio, sin tocarlo)', () => {
  test('el plato de arriba devuelve exactamente el destilado del dominio', () => {
    for (const tasa of [0.05, 0.5, 1, 2, 5, 15]) for (const [vE, vW] of [[100, 100], [60, 90], [20, 80]]) {
      const p = perfilReto(vE, vW, tasa);
      const xPot = fraccionMolarDesdeVolumenes(vE, vW);
      expect(p.xPot).toBe(xPot);
      expect(p.Nef).toBe(etapasEfectivas(tasa));
      expect(p.y[0]).toBe(composicionDestilado(xPot, etapasEfectivas(tasa)));
      expect(p.yD).toBe(p.y[0]);
      // eficiencia global de los 5 platos entre 0 y 60 %
      expect(p.eficiencia).toBeGreaterThan(0);
      expect(p.eficiencia).toBeLessThanOrEqual(0.6);
      // a reflujo total el líquido de cada plato es el vapor que le llega de abajo
      for (let i = 0; i < N_PLATOS - 1; i++) expect(p.x[i]).toBe(p.y[i + 1]);
      expect(p.x[N_PLATOS - 1]).toBe(composicionDestilado(xPot, 1));
      // el etanol se concentra hacia arriba
      for (let i = 1; i < N_PLATOS; i++) expect(p.x[i - 1]).toBeGreaterThanOrEqual(p.x[i]);
    }
  });
  test('la temperatura de cabeza del store es la de burbuja del destilado del perfil', () => {
    let d = {
      calorManta: 88, tempMezcla: 20, tempCabeza: 20, tasa: 0, volEtanolMatraz: 100, volAguaMatraz: 100,
      volDestilado: 0, volEtanolDest: 0, purezaDestilado: 0, status: 'idle' as const,
    } as Parameters<typeof pasoDestilacion>[0];
    for (let i = 0; i < 400; i++) d = pasoDestilacion(d, 0.25);
    expect(d.tasa).toBeGreaterThan(0);
    // el estado del store ya avanzó un paso: el perfil se calcula con el matraz de ANTES de ese paso
    const p = perfilReto(d.volEtanolMatraz, d.volAguaMatraz, d.tasa);
    expect(Math.abs(tBurbuja(p.yD) - d.tempCabeza)).toBeLessThan(0.05);
  });
});

test('código de color: ámbar = menos volátil, cian = más volátil', () => {
  const [r0, , b0] = colorComposicion(0), [r1, , b1] = colorComposicion(1);
  expect(r0).toBeGreaterThan(b0);
  expect(b1).toBeGreaterThan(r1);
  // monótono en el canal azul
  let ant = -1;
  for (let x = 0; x <= 1; x += 0.05) { const b = colorComposicion(x)[2]; expect(b).toBeGreaterThanOrEqual(ant - 1e-9); ant = b; }
});

describe('el reloj único', () => {
  test('el embudo del divisor pasa 1/(R + 1) del tiempo en toma', () => {
    for (const R of [1, 2, 4]) {
      const r = new RelojDestilacion('hexanoHeptano', { R, Q: 280, total: false });
      let enToma = 0, total = 0;
      for (let i = 0; i < 6000; i++) { r.paso(0.01); if (i > 500) { total++; if (r.vista.embudo > 0.5) enToma++; } }
      expect(Math.abs(enToma / total - 1 / (R + 1))).toBeLessThan(0.02);
    }
  });
  test('el receptor recoge D·v_molar(x_D) (cámara rápida incluida)', () => {
    const r = new RelojDestilacion('hexanoHeptano', { R: 2, Q: 280, total: false });
    const v0 = r.vista.receptor.mL;
    for (let i = 0; i < 300; i++) r.paso(1 / 30);
    const esperado = (r.fl.D / 3600) * 10 * r.factor * volumenMolar(r.mezcla, r.col.x[0]);
    expect(Math.abs(r.vista.receptor.mL - v0 - esperado) / esperado).toBeLessThan(0.01);
  });
  test('reto: columna fría y vacía hasta que hierve; luego, el perfil del store', () => {
    const r = new RelojDestilacion();
    r.ponerModo('reto');
    const frio = { calorManta: 60, tempMezcla: 45, tempCabeza: 20, tasa: 0, volEtanolMatraz: 100, volAguaMatraz: 100, volDestilado: 0, volEtanolDest: 0, purezaDestilado: 0, status: 'idle' };
    r.sincronizarReto(frio);
    for (let i = 0; i < 30; i++) r.paso(0.1);
    for (let n = 1; n <= N_PLATOS; n++) { expect(r.vista.T[n]).toBe(20); expect(r.vista.nivel[n]).toBe(0); }
    expect(r.vista.vapor).toBe(0);
    const caliente = { ...frio, calorManta: 95, tempMezcla: 82.7, tempCabeza: 78.9, tasa: 1.8 };
    r.sincronizarReto(caliente);
    for (let i = 0; i < 200; i++) r.paso(0.1);
    const p = perfilReto(100, 100, 1.8);
    expect(r.vista.x[0]).toBe(p.yD);
    expect(r.vista.x[1]).toBe(p.x[0]);
    expect(r.vista.T[3]).toBe(tBurbuja(p.x[2]));
    expect(r.vista.nivel[1]).toBeGreaterThan(0.99);
  });
});
