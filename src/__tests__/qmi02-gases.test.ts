/**
 * @jest-environment node
 *
 * Q2 · Leyes de los gases — la física de `simuladores/qmi02/cinetica.ts` y su reloj
 * (`reloj.ts`).
 *
 *  - Maxwell–Boltzmann: normalizada, ⟨v⟩ = √(8RT/πM), ⟨v²⟩ = 3RT/M, moda en v_p, la
 *    fracción más rápida que v_p (0,5724) y el muestreo gaussiano por componentes.
 *  - Pared térmica: la componente normal reemitida es de Rayleigh (⟨v_n⟩ = σ√(π/2)).
 *  - Choques: elásticos entre esferas de igual masa (energía y momento a 1e-12), y la
 *    muestra con paredes especulares conserva su energía con miles de choques.
 *  - La presión contada con impulsos en las paredes reproduce nRT/V (tolerancia
 *    estadística) para He, Ne y CO₂ y para varios (T, V); la T de la muestra llega a la
 *    de las paredes y su histograma de rapideces sigue a Maxwell–Boltzmann.
 *  - Planck: desplazamiento de Wien, el cuerpo negro de 6500 K es casi blanco y la
 *    placa a 1000 K brilla roja-anaranjada; por debajo de ~800 K no se ve.
 *  - Reloj único: cámara lenta (t real = t pantalla × factor), pausa, manómetro =
 *    nRT/V con el volumen del pistón, y la misma ley que el validador del dominio.
 */
import {
  R_J, R_ATM, ATM_PA, GASES, CAMARA, AREA_DM2, alturaGas, presionLey, vProbable, vMedia, vRms, maxwellBoltzmann,
  masaMolar, azar, gaussiana, normalPared, choqueElastico, GasCinetico, planck, xyzCuerpoNegro, brilloCuerpoNegro,
  colorRapidez, temperaturaDeRapidez, DIAMETRO_CHOQUE, POR_MOL, fraccionDentro, type IdGas,
} from '@/components/simuladores/qmi02/cinetica';
import { RelojGas, ejeRapidez, FACTORES } from '@/components/simuladores/qmi02/reloj';
import { presionIdeal, R_GAS, validarQ2 } from '@/domain/quimica';

/** Simpson en [a, b] con n (par) intervalos. */
function simpson(f: (x: number) => number, a: number, b: number, n = 4000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

const He = masaMolar('He'), CO2 = masaMolar('CO2');

describe('Maxwell–Boltzmann', () => {
  test('la densidad está normalizada (∫f dv = 1) para los tres gases y varias T', () => {
    for (const g of ['He', 'Ne', 'CO2'] as IdGas[]) for (const T of [100, 300, 1000]) {
      const M = masaMolar(g), vp = vProbable(T, M);
      expect(simpson((v) => maxwellBoltzmann(v, T, M), 0, 12 * vp)).toBeCloseTo(1, 9);
    }
  });
  test('⟨v⟩ = √(8RT/πM) y ⟨v²⟩ = 3RT/M por integración numérica', () => {
    const T = 300, M = He, vp = vProbable(T, M);
    const media = simpson((v) => v * maxwellBoltzmann(v, T, M), 0, 12 * vp);
    const cuad = simpson((v) => v * v * maxwellBoltzmann(v, T, M), 0, 12 * vp);
    expect(media / vMedia(T, M)).toBeCloseTo(1, 9);
    expect(cuad / ((3 * R_J * T) / M)).toBeCloseTo(1, 9);
  });
  test('valores de referencia a 300 K: He v_rms = 1367 m/s, CO₂ v_rms = 412 m/s; v_p : ⟨v⟩ : v_rms = 1 : 1,128 : 1,225', () => {
    expect(vRms(300, He)).toBeCloseTo(1367.4, 0);
    expect(vRms(300, CO2)).toBeCloseTo(412.3, 0);
    expect(vMedia(300, He) / vProbable(300, He)).toBeCloseTo(2 / Math.sqrt(Math.PI), 12);
    expect(vRms(300, He) / vProbable(300, He)).toBeCloseTo(Math.sqrt(1.5), 12);
  });
  test('la moda está en v_p y el 57,24 % de las moléculas va más rápido que v_p', () => {
    const T = 500, M = CO2, vp = vProbable(T, M);
    // derivada nula en v_p
    const h = vp * 1e-5;
    expect(Math.abs(maxwellBoltzmann(vp + h, T, M) - maxwellBoltzmann(vp - h, T, M))).toBeLessThan(1e-12);
    const masRapidas = 1 - simpson((v) => maxwellBoltzmann(v, T, M), 0, vp);
    expect(masRapidas).toBeCloseTo(0.5724, 4);
  });
  test('muestreo por componentes gaussianas: ⟨v²⟩ y el histograma siguen a MB (χ² < crítico)', () => {
    const g = gaussiana(azar(7));
    const T = 300, M = He, s = Math.sqrt((R_J * T) / M), vp = vProbable(T, M);
    const n = 200000, bins = 30, top = 3.2 * vp, cuentas = new Array(bins).fill(0);
    let v2 = 0;
    for (let i = 0; i < n; i++) {
      const a = g() * s, b = g() * s, c = g() * s;
      const vv = a * a + b * b + c * c;
      v2 += vv;
      const k = Math.floor(Math.sqrt(vv) / (top / bins));
      if (k < bins) cuentas[k]++;
    }
    expect((v2 / n) / ((3 * R_J * T) / M)).toBeCloseTo(1, 2);
    let chi2 = 0;
    for (let k = 0; k < bins; k++) {
      const e = n * simpson((v) => maxwellBoltzmann(v, T, M), (k * top) / bins, ((k + 1) * top) / bins, 40);
      if (e > 5) chi2 += (cuentas[k] - e) ** 2 / e;
    }
    // 29 grados de libertad: χ²(0,999) ≈ 58,3
    expect(chi2).toBeLessThan(58.3);
  });
});

describe('pared térmica (acomodación completa)', () => {
  test('la componente normal reemitida es de Rayleigh: ⟨v_n⟩ = σ√(π/2) y ⟨v_n²⟩ = 2σ²', () => {
    const rnd = azar(11), s = 700;
    let a = 0, b = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) { const v = normalPared(s, rnd()); a += v; b += v * v; }
    expect(a / n / (s * Math.sqrt(Math.PI / 2))).toBeCloseTo(1, 2);
    expect(b / n / (2 * s * s)).toBeCloseTo(1, 2);
  });
});

describe('choques elásticos', () => {
  test('entre dos esferas de igual masa se conservan energía y momento (1e-12)', () => {
    const rnd = azar(3);
    for (let k = 0; k < 2000; k++) {
      const a = [rnd() * 2000 - 1000, rnd() * 2000 - 1000, rnd() * 2000 - 1000];
      const b = [rnd() * 2000 - 1000, rnd() * 2000 - 1000, rnd() * 2000 - 1000];
      let nx = rnd() - 0.5, ny = rnd() - 0.5, nz = rnd() - 0.5;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const E0 = a.reduce((s, x) => s + x * x, 0) + b.reduce((s, x) => s + x * x, 0);
      const p0 = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
      const an0 = a[0] * nx + a[1] * ny + a[2] * nz, bn0 = b[0] * nx + b[1] * ny + b[2] * nz;
      choqueElastico(a, b, nx, ny, nz);
      const E1 = a.reduce((s, x) => s + x * x, 0) + b.reduce((s, x) => s + x * x, 0);
      expect(Math.abs(E1 - E0) / E0).toBeLessThan(1e-12);
      for (let i = 0; i < 3; i++) expect(Math.abs(a[i] + b[i] - p0[i])).toBeLessThan(1e-9);
      // se intercambian las componentes normales
      expect(a[0] * nx + a[1] * ny + a[2] * nz).toBeCloseTo(bn0, 9);
      expect(b[0] * nx + b[1] * ny + b[2] * nz).toBeCloseTo(an0, 9);
    }
  });
  test('con paredes especulares la muestra conserva su energía cinética con miles de choques', () => {
    const g = new GasCinetico({ gas: 'He', T: 300, V: 3, n: 1 }, { paredes: 'especulares', semilla: 5 });
    const E0 = g.energia();
    for (let i = 0; i < 1500; i++) g.paso(2e-6);
    const c = g.tomarContadores();
    expect(c.choquesEntre).toBeGreaterThan(1000);
    expect(c.choquesPared).toBeGreaterThan(10000);
    expect(Math.abs(g.energia() - E0) / E0).toBeLessThan(1e-9);
    expect(c.calor).toBe(0);
  });
});

/** Corre una muestra térmica y devuelve la presión media por impulsos (atm) y la T de la muestra. */
function medir(gas: IdGas, T: number, V: number, n: number, tReal: number, semilla = 1) {
  const g = new GasCinetico({ gas, T, V, n }, { semilla });
  const dt = 1e-6 * Math.sqrt(masaMolar(gas) / He);
  for (let t = 0; t < 4e-4 * Math.sqrt(masaMolar(gas) / He); t += dt) g.paso(dt); // asiento
  g.tomarContadores();
  let Tsum = 0, k = 0;
  for (let t = 0; t < tReal; t += dt) { g.paso(dt); if (++k % 20 === 0) Tsum += g.temperaturaMuestra(); }
  const c = g.tomarContadores();
  return { P: c.pdt / c.t / ATM_PA, T: Tsum / Math.floor(k / 20), choques: c.choquesPared, g };
}

describe('la presión emerge de los choques con las paredes', () => {
  test('He, 300 K, 10 L, 1 mol: impulsos ≈ nRT/V (±3 %)', () => {
    const r = medir('He', 300, 10, 1, 0.012);
    expect(r.choques).toBeGreaterThan(20000);
    expect(Math.abs(r.P / presionLey(1, 300, 10) - 1)).toBeLessThan(0.03);
    expect(Math.abs(r.T / 300 - 1)).toBeLessThan(0.03);
  });
  test('la presión no depende del gas: el CO₂ (11 veces más pesado) a 300 K, 10 L, 1 mol da lo mismo que el He', () => {
    // mismo número de cruces de la cámara que el He: el tiempo escala con √(M/M_He)
    const r = medir('CO2', 300, 10, 1, 0.012 * Math.sqrt(masaMolar('CO2') / He), 9);
    expect(r.choques).toBeGreaterThan(20000);
    expect(Math.abs(r.P / presionLey(1, 300, 10) - 1)).toBeLessThan(0.035);
  });
  test('Boyle y Gay-Lussac: 600 K en 5 L cuadruplica la presión de 300 K en 10 L', () => {
    const r = medir('He', 600, 5, 1, 0.008, 4);
    expect(Math.abs(r.P / presionLey(1, 600, 5) - 1)).toBeLessThan(0.035);
    expect(r.P / presionLey(1, 300, 10)).toBeGreaterThan(3.8);
    expect(r.P / presionLey(1, 300, 10)).toBeLessThan(4.2);
  });
  test('teoría cinética: N·m·⟨v²⟩/(3V) = nR·T_muestra/V (identidad, 1e-12)', () => {
    const g = new GasCinetico({ gas: 'Ne', T: 450, V: 7, n: 0.8 }, { semilla: 2 });
    const Pc = g.presionCinetica() / ATM_PA;
    expect(Pc / presionLey(0.8, g.temperaturaMuestra(), 7)).toBeCloseTo(1, 12);
  });
  test('el volumen excluido de las esferas (2π/3·n·σ³) es < 0,5 % en el estado inicial del reto', () => {
    const nd = (0.406 * POR_MOL) / 10;           // esferas por litro (u³)
    expect((2 * Math.PI / 3) * nd * DIAMETRO_CHOQUE ** 3).toBeLessThan(0.005);
  });
});

describe('equilibrio térmico con las paredes', () => {
  test('al pasar el termostato de 300 a 600 K, la muestra llega a 600 K (±4 %) y el calor entra por las paredes', () => {
    const g = new GasCinetico({ gas: 'He', T: 300, V: 10, n: 0.5 }, { semilla: 8 });
    g.fijarTemperatura(600);
    for (let i = 0; i < 1500; i++) g.paso(1e-6);
    const c = g.tomarContadores();
    expect(c.calor).toBeGreaterThan(0);
    let Ts = 0;
    for (let i = 0; i < 40; i++) { for (let k = 0; k < 50; k++) g.paso(1e-6); Ts += g.temperaturaMuestra(); }
    expect(Math.abs(Ts / 40 / 600 - 1)).toBeLessThan(0.04);
  });
  test('el histograma de la muestra en equilibrio sigue a MB (⟨v⟩ y v_rms a ±2 %)', () => {
    const g = new GasCinetico({ gas: 'He', T: 400, V: 10, n: 1 }, { semilla: 12 });
    for (let i = 0; i < 300; i++) g.paso(1e-6);
    let s1 = 0, s2 = 0, k = 0;
    for (let rep = 0; rep < 60; rep++) {
      for (let i = 0; i < 40; i++) g.paso(1e-6);
      for (let i = 0; i < g.N; i++) { const v2 = g.vx[i] ** 2 + g.vy[i] ** 2 + g.vz[i] ** 2; s1 += Math.sqrt(v2); s2 += v2; k++; }
    }
    expect(Math.abs(s1 / k / vMedia(400, He) - 1)).toBeLessThan(0.02);
    expect(Math.abs(Math.sqrt(s2 / k) / vRms(400, He) - 1)).toBeLessThan(0.02);
  });
  test('cambiar de gas a la misma T conserva la distribución: las rapideces escalan con √(M₁/M₂)', () => {
    const g = new GasCinetico({ gas: 'He', T: 300, V: 10, n: 0.4 }, { semilla: 4 });
    const T0 = g.temperaturaMuestra();
    g.cambiarGas('CO2');
    expect(g.temperaturaMuestra()).toBeCloseTo(T0, 9);
    expect(g.masa).toBeCloseTo((0.4 * CO2) / g.N, 15);
  });
  test('el color de cada esfera depende de su energía: a la misma T, He y CO₂ se ven iguales', () => {
    const v = 1500;
    const vCO2 = v * Math.sqrt(He / CO2);
    expect(temperaturaDeRapidez(vCO2, CO2)).toBeCloseTo(temperaturaDeRapidez(v, He), 9);
    expect(colorRapidez(vCO2, CO2)).toEqual(colorRapidez(v, He));
    // frío azul, caliente rojo
    const frio = colorRapidez(vRms(100, He), He), caliente = colorRapidez(vRms(1500, He), He);
    expect(frio[2]).toBeGreaterThan(frio[0]);
    expect(caliente[0]).toBeGreaterThan(caliente[2]);
  });
});

describe('la cámara', () => {
  test('V = área × altura: el pistón está exactamente a V/A del fondo (A = π·1,3² dm²)', () => {
    expect(AREA_DM2).toBeCloseTo(5.30929, 4);
    for (const V of [2, 7.5, 15]) expect(alturaGas(V) * AREA_DM2).toBeCloseTo(V, 12);
    expect(CAMARA.yFondo + alturaGas(CAMARA.vMax)).toBeLessThan(CAMARA.yFondo + CAMARA.altoUtil);
  });
  test('comprimir es afín: la densidad sigue uniforme y nadie queda fuera', () => {
    const g = new GasCinetico({ gas: 'He', T: 300, V: 10, n: 1 }, { semilla: 6 });
    g.moverPiston(CAMARA.yFondo + alturaGas(4));
    let fuera = 0;
    for (let i = 0; i < g.N; i++) if (g.y[i] < CAMARA.yFondo - 1e-9 || g.y[i] > g.yTecho + 1e-9) fuera++;
    expect(fuera).toBe(0);
  });
  test('inyectar 0,05 mol mete 20 esferas por la válvula y conserva la masa total n·M', () => {
    const g = new GasCinetico({ gas: 'Ne', T: 300, V: 10, n: 0.406 }, { semilla: 6 });
    const N0 = g.N;
    g.inyectar(20, 0.456);
    expect(g.N - N0).toBe(20);
    expect(g.N * g.masa).toBeCloseTo(0.456 * masaMolar('Ne'), 12);
  });
});

describe('el brillo de la placa caliente (Planck)', () => {
  test('desplazamiento de Wien: λ_máx·T = 2,898·10⁻³ m·K', () => {
    for (const T of [3000, 5000, 6500]) {
      let best = 0, lmax = 0;
      for (let l = 200; l <= 1500; l += 0.05) { const b = planck(l, T); if (b > best) { best = b; lmax = l; } }
      expect((lmax * 1e-9 * T) / 2.897772e-3).toBeCloseTo(1, 3);
    }
  });
  test('el cuerpo negro de 6500 K cae en el locus de Planck (x, y) = (0,3135, 0,3237) ±0,003', () => {
    const [X, Y, Z] = xyzCuerpoNegro(6500);
    expect(Math.abs(X / (X + Y + Z) - 0.3135)).toBeLessThan(0.003);
    expect(Math.abs(Y / (X + Y + Z) - 0.3237)).toBeLessThan(0.003);
  });
  test('a 1000 K brilla rojo-anaranjado; a 800 K su luminancia es < 1/100 de la de 1000 K', () => {
    const b = brilloCuerpoNegro(1000);
    expect(b.rgb[0]).toBe(1);
    expect(b.rgb[1]).toBeLessThan(0.3);
    expect(b.rgb[2]).toBeLessThan(0.05);
    expect(b.luminancia).toBeCloseTo(1, 12);
    expect(brilloCuerpoNegro(800).luminancia).toBeLessThan(0.01);
    expect(brilloCuerpoNegro(900).luminancia).toBeGreaterThan(brilloCuerpoNegro(800).luminancia * 5);
  });
});

describe('reloj único', () => {
  const ini = { T: 300, V: 10, n: 0.406, gas: 'He' as IdGas, explotado: false };
  test('cámara lenta: las moléculas avanzan dt × factor segundos reales; en pausa nada', () => {
    const r = new RelojGas(ini, { semilla: 1 });
    r.factor = FACTORES[1];
    r.paso(0.05);
    expect(r.tiempoReal).toBeCloseTo(0.05 * 2e-4, 15);
    r.factor = FACTORES[2];
    r.paso(0.05);
    expect(r.tiempoReal).toBeCloseTo(0.05 * 2e-4 + 0.05 * 5e-5, 15);
    r.pausa = true;
    const v = r.version;
    expect(r.paso(0.05)).toBe(false);
    expect(r.version).toBe(v);
    expect(r.tiempoReal).toBeCloseTo(0.05 * 2.5e-4, 15);
    expect(FACTORES).toEqual([5e-4, 2e-4, 5e-5]);
  });
  test('el manómetro marca nRT/V con el volumen que tiene el pistón; al llegar, el del store', () => {
    const r = new RelojGas(ini, { semilla: 1 });
    r.fijar({ ...ini, V: 5 });
    r.paso(1 / 60);
    // a medio camino: entre 10 y 5 L, con su presión
    expect(r.lectura.V).toBeLessThan(10);
    expect(r.lectura.V).toBeGreaterThan(5);
    expect(r.lectura.P).toBeCloseTo(presionLey(0.406, 300, r.lectura.V), 12);
    for (let i = 0; i < 200; i++) r.paso(1 / 60);
    expect(r.lectura.V).toBeCloseTo(5, 9);
    expect(r.lectura.P).toBeCloseTo(presionLey(0.406, 300, 5), 9);
  });
  test('la ley del reloj es la del validador: nRT/V con R = 0,08206 (±1e-4)', () => {
    expect(R_ATM / R_GAS).toBeCloseTo(1, 4);
    for (const [n, T, V] of [[0.406, 300, 10], [1, 1000, 2], [2, 100, 15]]) {
      expect(presionLey(n, T, V) / presionIdeal(n, T, V)).toBeCloseTo(1, 4);
    }
    // el validador no cambia
    expect(validarQ2({ P: 3.45, pTarget: 3.5, isExploded: false } as never)).toBe(true);
    expect(validarQ2({ P: 3.35, pTarget: 3.5, isExploded: false } as never)).toBe(false);
  });
  test('la medida por impulsos del reloj converge a la ley (He, 600 K, 5 L, 1 mol)', () => {
    const m = { T: 600, V: 5, n: 1, gas: 'He' as IdGas, explotado: false };
    const r = new RelojGas(m, { semilla: 3 });
    r.factor = FACTORES[0];
    for (let i = 0; i < 1800 && (r.lectura.sigma == null || r.lectura.choques < 40000); i++) r.paso(1 / 60);
    const l = r.lectura;
    expect(l.Pimp).not.toBeNull();
    expect(l.sigma).not.toBeNull();
    expect(Math.abs(l.Pimp! / l.Pley - 1)).toBeLessThan(0.04);
    const R = r.rEmergente()!;
    expect(Math.abs(R.R / R_ATM - 1)).toBeLessThan(0.04);
  });
  test('inyectar gas sube n, la muestra recibe sus esferas por la válvula y la trayectoria lo anota', () => {
    const r = new RelojGas(ini, { semilla: 1 });
    const N0 = r.sim.N;
    r.fijar({ ...ini, n: 0.456 });
    for (let i = 0; i < 30; i++) r.paso(1 / 60);
    expect(r.sim.N - N0).toBe(Math.round(0.456 * POR_MOL) - Math.round(0.406 * POR_MOL));
    expect(r.sim.n).toBeCloseTo(0.456, 12);
    expect(r.trayectoria.length).toBe(2);
  });
  test('explotar abre la cámara (el manómetro cae a 1 atm) y reiniciar la repuebla', () => {
    const r = new RelojGas(ini, { semilla: 1 });
    r.fijar({ ...ini, T: 1000, V: 2, explotado: true });
    expect(r.sim.abierta).toBe(true);
    expect(r.lectura.P).toBe(1);
    const g0 = r.generacion;
    r.fijar(ini);
    expect(r.sim.abierta).toBe(false);
    expect(r.generacion).toBeGreaterThan(g0);
    expect(r.sim.N).toBe(Math.round(0.406 * POR_MOL));
  });
  test('el eje del histograma deja ver 3,1·v_p', () => {
    for (const g of Object.keys(GASES) as IdGas[]) for (const T of [100, 300, 1000]) {
      expect(ejeRapidez(T, masaMolar(g))).toBeGreaterThanOrEqual(3.1 * vProbable(T, masaMolar(g)));
    }
  });
  test('la estela x − v·τ se recorta en la pared: su cola nunca sale de la cámara', () => {
    const rnd = azar(77);
    const rc = 1.265, y0 = 0.755, y1 = 2.9;
    let recortadas = 0, enteras = 0;
    for (let k = 0; k < 5000; k++) {
      // cabeza dentro del cilindro, desplazamiento de hasta 1,5 u en cualquier dirección
      const r = rc * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
      const hx = r * Math.cos(a), hz = r * Math.sin(a), hy = y0 + (y1 - y0) * rnd();
      const dx = (rnd() - 0.5) * 3, dy = (rnd() - 0.5) * 3, dz = (rnd() - 0.5) * 3;
      const t = fraccionDentro(hx, hy, hz, dx, dy, dz, rc, y0, y1);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
      const cx = hx - t * dx, cy = hy - t * dy, cz = hz - t * dz;
      expect(Math.hypot(cx, cz)).toBeLessThanOrEqual(rc + 1e-9);
      expect(cy).toBeGreaterThanOrEqual(y0 - 1e-9);
      expect(cy).toBeLessThanOrEqual(y1 + 1e-9);
      const dentro = Math.hypot(hx - dx, hz - dz) <= rc && hy - dy >= y0 && hy - dy <= y1;
      if (dentro) { expect(t).toBe(1); enteras++; } else recortadas++;
    }
    expect(recortadas).toBeGreaterThan(100);
    expect(enteras).toBeGreaterThan(100);
  });
});
