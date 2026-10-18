/**
 * B4 · Fotosíntesis — la física de `simuladores/bio04/fotosintesis.ts` y su reloj.
 *
 *  - Coherencia con el juez: en las condiciones del reto la tasa es `tasaNetaB4` exacta.
 *  - Curva de respuesta a la luz: forma P = Pmax(1 − e^(−I/Ik)) − R, pendiente inicial φη,
 *    saturación, punto de compensación (contra la raíz numérica) e I₉₅ = Ik·ln 20.
 *  - CO₂ (Michaelis–Menten del CID) y temperatura (June 2004 y Q₁₀ = 2).
 *  - Fotones: E = hc/λ contra 1239,84 eV·nm; un mol de fotones rojos ≈ 187 kJ.
 *  - Espectros: máximos de Chl a, Chl b y β-caroteno contra Lichtenthaler (1987); la
 *    eficiencia de cada LED con McCree coincide con la del dominio (±0,02).
 *  - Estequiometría: balance atómico de la ecuación global, 1 mL de O₂ a 25 °C = 40,9 µmol,
 *    glucosa, y el esquema Z (8 fotones, 12 H⁺, 18/7 ATP y 2 NADPH por O₂).
 *  - Escena: el O₂ dibujado es proporcional a la bruta con la MISMA constante para
 *    cualquier color, luz, CO₂ y temperatura (un solo modelo detrás de escena y dock).
 */
import {
  EFICIENCIA_ESPECTRAL_B4, PHI_B4, PMAX_B4, RESPIRACION_B4, o2EnsayoB4, ppfdB4, tasaNetaB4, metaB4,
} from '@/domain/biologia';
import type { ColorLuzB4 } from '@/store/types';
import {
  energiaFotonEV, energiaMolFotonesKJ, emisionLED, promedioLED, muestrearLambda, absorcionPigmento, accionMcCree,
  absorptanciaLED, rendimientoAbsorbido, tasaNeta, tasaBruta, o2Ensayo, netaI, brutaI, pmax, respiracion, irradianciaIk,
  compensacion, saturacion95, factorSaturacion, factorCO2, factorTemperatura, factorRespiracion, cid, distanciaParaI,
  REFERENCIA, NAHCO3_OPCIONES, ECUACION_GLOBAL, micromoles, volumenMolar, balanceO2, M_GLUCOSA,
  FOTONES_POR_O2, H_POR_O2, ATP_POR_O2, NADPH_POR_O2, SUBUNIDADES_C, ATP_POR_VUELTA, CALVIN, ESQUEMA_Z, E00_P680, E00_P700,
  phLumen, burbujasPorMin, V_BURBUJA_ML, tasasVisuales, escalaParticulas, esReferencia, TEMPERATURAS, type Pigmento, type Condiciones,
} from '@/components/simuladores/bio04/fotosintesis';
import { RelojFoto, DURACION_VISUAL_S } from '@/components/simuladores/bio04/reloj';

const COLORES: ColorLuzB4[] = ['rojo', 'amarillo', 'blanco', 'azul', 'verde'];
const ref = (color: ColorLuzB4, distancia: number): Condiciones => ({ color, distancia, nahco3: REFERENCIA.nahco3, T: REFERENCIA.T });

/** Máximos locales de una función en [a, b] (paso 0,1 nm). */
function maximos(f: (l: number) => number, a = 381, b = 719): number[] {
  const out: number[] = [];
  for (let l = a; l < b; l += 0.1) if (f(l) > f(l - 0.1) && f(l) >= f(l + 0.1)) out.push(l);
  return out;
}

describe('coherencia con el juez del reto', () => {
  test('en 25 °C y NaHCO₃ 0,1 % la tasa ES tasaNetaB4 (todas las lámparas y distancias)', () => {
    for (const c of COLORES) for (let d = 10; d <= 60; d += 0.5) {
      expect(tasaNeta(ref(c, d))).toBeCloseTo(tasaNetaB4(c, d), 14);
      expect(o2Ensayo(ref(c, d))).toBeCloseTo(o2EnsayoB4(c, d), 13);
    }
  });
  test('los factores valen 1 en la referencia', () => {
    expect(factorCO2(REFERENCIA.nahco3)).toBe(1);
    expect(factorTemperatura(REFERENCIA.T)).toBe(1);
    expect(factorRespiracion(REFERENCIA.T)).toBe(1);
    expect(esReferencia({ nahco3: 0.1, T: 25 })).toBe(true);
    expect(esReferencia({ nahco3: 0.05, T: 25 })).toBe(false);
  });
  test('con luz fuerte, 25 °C y 0,1 % de NaHCO₃ son lo mejor (a 60 cm el frío ahorra respiración)', () => {
    for (const c of COLORES) for (const n of NAHCO3_OPCIONES) for (const T of TEMPERATURAS) {
      expect(tasaNeta({ color: c, distancia: 20, nahco3: n, T })).toBeLessThanOrEqual(tasaNetaB4(c, 20) + 1e-12);
    }
    expect(tasaNeta({ color: 'rojo', distancia: 60, nahco3: 0.1, T: 20 })).toBeGreaterThan(tasaNetaB4('rojo', 60));
  });
  test('el óptimo de temperatura de la NETA baja con la luz (la respiración pesa más con poca luz)', () => {
    const optimo = (d: number) => TEMPERATURAS.reduce((m, T) => (tasaNeta({ color: 'rojo', distancia: d, nahco3: 0.1, T }) > tasaNeta({ color: 'rojo', distancia: d, nahco3: 0.1, T: m }) ? T : m), 25);
    expect(optimo(10)).toBe(25);
    expect(optimo(60)).toBeLessThan(25);
  });
});

describe('curva de respuesta a la luz', () => {
  const c = ref('rojo', 20);
  test('PPFD cae con 1/d²: 1000 a 10 cm, 250 a 20 cm', () => {
    expect(ppfdB4(10)).toBeCloseTo(1000, 12);
    expect(ppfdB4(20)).toBeCloseTo(250, 12);
    expect(distanciaParaI(250)).toBeCloseTo(20, 12);
  });
  test('Ik = Pmax/(φη): 250 µmol·m⁻²·s⁻¹ con luz roja', () => {
    expect(irradianciaIk(c)).toBeCloseTo(PMAX_B4 / PHI_B4, 10);
    expect(irradianciaIk(c)).toBeCloseTo(250, 10);
    expect(irradianciaIk(ref('verde', 20))).toBeCloseTo(250 / 0.7, 10);
  });
  test('P(0) = −R y P(∞) → Pmax − R', () => {
    expect(netaI(c, 0)).toBeCloseTo(-RESPIRACION_B4, 15);
    expect(netaI(c, 1e7)).toBeCloseTo(PMAX_B4 - RESPIRACION_B4, 12);
  });
  test('pendiente inicial φ·η (fotones útiles) y saturación (s = 1 → Ik/I)', () => {
    const h = 1e-4;
    for (const col of COLORES) {
      const cc = ref(col, 20);
      expect((brutaI(cc, h) - brutaI(cc, 0)) / h).toBeCloseTo(PHI_B4 * EFICIENCIA_ESPECTRAL_B4[col], 8);
    }
    expect(factorSaturacion(c, 1e-6)).toBeCloseTo(1, 6);
    expect(factorSaturacion(c, 1e6) * 1e6).toBeCloseTo(irradianciaIk(c), 3);
  });
  test('punto de compensación: la neta es 0 ahí (contra bisección)', () => {
    for (const col of COLORES) for (const T of [10, 25, 35]) for (const n of [0.02, 0.1]) {
      const cc = { color: col, nahco3: n, T };
      const Ic = compensacion(cc);
      let lo = 0, hi = 5000;
      for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (netaI(cc, m) < 0) lo = m; else hi = m; }
      expect(Ic).toBeCloseTo((lo + hi) / 2, 6);
      expect(Math.abs(netaI(cc, Ic))).toBeLessThan(1e-12);
    }
    // luz roja en el reto: I_c = −250·ln(1 − 0,02/0,3) = 17,25 µmol·m⁻²·s⁻¹ (más allá de 60 cm: en el banco siempre hay burbujas)
    expect(compensacion(c)).toBeCloseTo(17.2482, 3);
    expect(distanciaParaI(compensacion(c))).toBeGreaterThan(60);
  });
  test('sin CO₂ añadido y con calor, la respiración puede ganar: no hay compensación', () => {
    expect(compensacion({ color: 'verde', nahco3: 0, T: 40 })).toBe(Infinity);
    expect(tasaNeta({ color: 'verde', distancia: 60, nahco3: 0, T: 40 })).toBeLessThan(0);
  });
  test('saturación al 95 %: I₉₅ = Ik·ln 20 ≈ 749 con rojo', () => {
    const I95 = saturacion95(c);
    expect(brutaI(c, I95) / pmax(c)).toBeCloseTo(0.95, 12);
    expect(I95).toBeCloseTo(250 * Math.log(20), 9);
  });
  test('cuadruplicar la luz (40 → 20 cm) no cuadruplica la bruta', () => {
    expect(tasaBruta(ref('rojo', 20)) / tasaBruta(ref('rojo', 40))).toBeLessThan(4);
    expect(tasaBruta(ref('rojo', 20)) / tasaBruta(ref('rojo', 40))).toBeGreaterThan(2);
  });
});

describe('CO₂ y temperatura', () => {
  test('CID: 0,1 % de NaHCO₃ = 1 g/L = 11,9 mmol/L más el del agua', () => {
    expect(cid(0.1) - cid(0)).toBeCloseTo(1000 / 84.007, 9);
    expect(cid(0)).toBeCloseTo(0.5, 12);
  });
  test('Pmax sube con el CO₂ y se satura (Michaelis–Menten)', () => {
    const f = NAHCO3_OPCIONES.map((n) => factorCO2(n));
    for (let i = 1; i < f.length; i++) expect(f[i]).toBeGreaterThan(f[i - 1]);
    // el primer 0,02 % rinde más que el último 0,05 %: rendimientos decrecientes
    expect(f[1] - f[0]).toBeGreaterThan(f[3] - f[2]);
    expect(pmax({ nahco3: 0, T: 25 }) / PMAX_B4).toBeCloseTo((0.5 / 2.5) / (cid(0.1) / (2 + cid(0.1))), 12);
  });
  test('temperatura: óptimo a 25 °C, a 25 ± 13 °C cae a 1/e; la respiración se duplica cada 10 °C', () => {
    expect(factorTemperatura(38)).toBeCloseTo(Math.exp(-1), 12);
    expect(factorTemperatura(12)).toBeCloseTo(Math.exp(-1), 12);
    expect(respiracion(35) / respiracion(25)).toBeCloseTo(2, 12);
    expect(respiracion(15) / respiracion(25)).toBeCloseTo(0.5, 12);
  });
  test('con calor sube el punto de compensación (más respiración y menos Pmax)', () => {
    const a = compensacion({ color: 'rojo', nahco3: 0.1, T: 20 }), b = compensacion({ color: 'rojo', nahco3: 0.1, T: 35 });
    expect(b).toBeGreaterThan(a);
  });
});

describe('fotones: E = hc/λ', () => {
  test('hc = 1239,84 eV·nm', () => {
    for (const l of [400, 450, 530, 590, 640, 680, 700]) expect(energiaFotonEV(l) * l).toBeCloseTo(1239.84198, 4);
  });
  test('680 nm: 1,823 eV; 700 nm: 1,771 eV; un mol de fotones a 640 nm: 186,9 kJ', () => {
    expect(E00_P680).toBeCloseTo(1.8233, 4);
    expect(E00_P700).toBeCloseTo(1.7712, 4);
    expect(energiaMolFotonesKJ(640)).toBeCloseTo(186.92, 2);
  });
  test('un fotón azul lleva más energía que uno rojo, pero mueve el mismo electrón (rinde menos por fotón)', () => {
    expect(energiaFotonEV(450)).toBeGreaterThan(energiaFotonEV(640));
    expect(EFICIENCIA_ESPECTRAL_B4.azul).toBeLessThan(EFICIENCIA_ESPECTRAL_B4.rojo);
  });
});

describe('espectros', () => {
  const pico = (p: Pigmento, a: number, b: number) => {
    let m = a, v = -1;
    for (let l = a; l <= b; l += 0.1) { const y = absorcionPigmento(p, l); if (y > v) { v = y; m = l; } }
    return { l: m, v };
  };
  test('clorofila a: máximos a 429 y 661 nm (Lichtenthaler, éter), Soret/Qy ≈ 1,2–1,35', () => {
    const s = pico('clorofilaA', 400, 470), q = pico('clorofilaA', 620, 700);
    expect(Math.abs(s.l - 429)).toBeLessThan(1.5);
    expect(Math.abs(q.l - 661)).toBeLessThan(1);
    expect(s.v / q.v).toBeGreaterThan(1.2);
    expect(s.v / q.v).toBeLessThan(1.35);
    expect(s.v).toBeCloseTo(1, 6); // normalizada en su máximo
  });
  test('clorofila b: máximos a 453 y 642 nm, Soret/Qy ≈ 2,7–2,9', () => {
    const s = pico('clorofilaB', 420, 490), q = pico('clorofilaB', 610, 680);
    expect(Math.abs(s.l - 453)).toBeLessThan(1);
    expect(Math.abs(q.l - 642)).toBeLessThan(1);
    expect(s.v / q.v).toBeGreaterThan(2.6);
    expect(s.v / q.v).toBeLessThan(2.95);
  });
  test('β-caroteno: tres bandas 426/450/478 nm y nada por encima de 540 nm', () => {
    const m = maximos((l) => absorcionPigmento('carotenoides', l));
    expect(m.length).toBe(3);
    [426, 450, 478].forEach((x, i) => expect(Math.abs(m[i] - x)).toBeLessThan(1.5));
    expect(absorcionPigmento('carotenoides', 545)).toBeLessThan(0.01);
  });
  test('la clorofila absorbe poco el verde (por eso la hoja se ve verde)', () => {
    for (const p of ['clorofilaA', 'clorofilaB'] as Pigmento[]) expect(absorcionPigmento(p, 530)).toBeLessThan(0.12);
  });
  test('la eficiencia de cada LED con el espectro de McCree coincide con la del dominio (±0,02)', () => {
    for (const c of COLORES) expect(Math.abs(promedioLED(c, accionMcCree) - EFICIENCIA_ESPECTRAL_B4[c])).toBeLessThan(0.02);
  });
  test('LED: cada una tiene su pico donde dice; el blanco lleva un 12 % de fotones azules', () => {
    for (const [c, l] of [['rojo', 640], ['amarillo', 590], ['verde', 530], ['azul', 450]] as [ColorLuzB4, number][]) {
      expect(emisionLED(c, l)).toBeCloseTo(1, 12);
      const media = Array.from({ length: 4000 }, (_, i) => muestrearLambda(c, (i + 0.5) / 4000)).reduce((s, x) => s + x, 0) / 4000;
      expect(Math.abs(media - l)).toBeLessThan(0.6);
    }
    const azules = Array.from({ length: 10000 }, (_, i) => muestrearLambda('blanco', (i + 0.5) / 10000)).filter((x) => x < 490).length / 10000;
    expect(Math.abs(azules - 0.12)).toBeLessThan(0.02);
  });
  test('absorptancia de la hoja: el verde pasa más; rendimiento por fotón absorbido ≤ 0,106 (rojo el máximo)', () => {
    expect(absorptanciaLED('verde')).toBeLessThan(absorptanciaLED('rojo'));
    expect(absorptanciaLED('verde')).toBeLessThan(absorptanciaLED('azul'));
    expect(rendimientoAbsorbido('rojo')).toBeCloseTo(0.106, 12);
    for (const c of COLORES) expect(rendimientoAbsorbido(c)).toBeLessThanOrEqual(0.106 + 1e-12);
    // el azul se absorbe MÁS que el rojo pero rinde menos por fotón absorbido (carotenoides)
    expect(absorptanciaLED('azul')).toBeGreaterThan(absorptanciaLED('rojo'));
    expect(rendimientoAbsorbido('azul')).toBeLessThan(rendimientoAbsorbido('rojo'));
  });
});

describe('estequiometría', () => {
  test('6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂ está balanceada', () => {
    for (const el of ['C', 'H', 'O'] as const) {
      const r = ECUACION_GLOBAL.reactivos.reduce((s, m) => s + m.n * m[el], 0);
      const p = ECUACION_GLOBAL.productos.reduce((s, m) => s + m.n * m[el], 0);
      expect(r).toBe(p);
    }
  });
  test('gas ideal: 24,465 L/mol a 25 °C; 1 mL de O₂ = 40,87 µmol', () => {
    expect(volumenMolar(25)).toBeCloseTo(24.465, 3);
    expect(micromoles(1, 25)).toBeCloseTo(40.874, 2);
    expect(micromoles(1, 0)).toBeCloseTo(1e3 / 22.414, 2);
  });
  test('balance de un ensayo: CO₂ = O₂, H₂O = 2·O₂, glucosa = O₂/6, 8 fotones por O₂', () => {
    const b = balanceO2(1.7, 25);
    expect(b.co2).toBeCloseTo(b.o2, 12);
    expect(b.h2o).toBeCloseTo(2 * b.o2, 12);
    expect(b.glucosaMg).toBeCloseTo((b.o2 / 6) * M_GLUCOSA / 1000, 12);
    expect(b.fotones).toBeCloseTo(8 * b.o2, 12);
    // 1,7 mL → 69,5 µmol de O₂ → 2,09 mg de glucosa
    expect(b.o2).toBeCloseTo(69.49, 1);
    expect(b.glucosaMg).toBeCloseTo(2.087, 2);
  });
  test('esquema Z: 8 fotones, 12 H⁺, 18/7 ATP y 2 NADPH por O₂; 3 ATP por vuelta de 14 H⁺', () => {
    expect(FOTONES_POR_O2).toBe(8);
    expect(H_POR_O2).toBe(12);
    expect(ATP_POR_O2).toBeCloseTo(18 / 7, 12);
    expect(NADPH_POR_O2).toBe(2);
    expect(SUBUNIDADES_C / ATP_POR_VUELTA).toBeCloseTo(4.667, 3);
    // el ciclo de Calvin pide 3 ATP : 2 NADPH = 1,5 y el flujo lineal da 1,29: falta ATP (lo pone el flujo cíclico)
    expect(CALVIN.atpPorCO2 / CALVIN.nadphPorCO2).toBe(1.5);
    expect(ATP_POR_O2 / NADPH_POR_O2).toBeLessThan(1.5);
  });
  test('esquema Z: tras cada fotón los electrones bajan (E sube) hasta el NADP⁺', () => {
    const id = (k: string) => ESQUEMA_Z.findIndex((p) => p.id === k);
    const tramos: [string, string][] = [['h2o', 'p680'], ['p680x', 'feo'], ['feo', 'qa'], ['qa', 'pq'], ['pq', 'b6f'], ['b6f', 'pc'], ['pc', 'p700'],
      ['p700x', 'a0'], ['a0', 'fx'], ['fx', 'fd'], ['fd', 'nadp']];
    for (const [a, b] of tramos) expect(ESQUEMA_Z[id(b)].E).toBeGreaterThanOrEqual(ESQUEMA_Z[id(a)].E);
    // los saltos de luz son la energía del fotón de 680 y 700 nm
    expect(ESQUEMA_Z[id('p680')].E - ESQUEMA_Z[id('p680x')].E).toBeCloseTo(E00_P680, 12);
    expect(ESQUEMA_Z[id('p700')].E - ESQUEMA_Z[id('p700x')].E).toBeCloseTo(E00_P700, 12);
    // del agua al NADP⁺ hay 1,14 V: eso es lo que «sube» la luz
    expect(ESQUEMA_Z[id('h2o')].E - ESQUEMA_Z[id('nadp')].E).toBeCloseTo(1.14, 9);
  });
  test('pH del lumen: 7,5 a oscuras, 5,8 con la bruta máxima', () => {
    expect(phLumen(0)).toBeCloseTo(7.5, 12);
    expect(phLumen(PMAX_B4)).toBeCloseTo(5.8, 12);
  });
  test('burbujas: 0,17 mL/min son 17 burbujas de 0,01 mL por minuto; ninguna bajo compensación', () => {
    expect(burbujasPorMin(0.17)).toBeCloseTo(0.17 / V_BURBUJA_ML, 12);
    expect(burbujasPorMin(-0.01)).toBe(0);
  });
});

describe('la escena sale del mismo modelo', () => {
  test('O₂ dibujado = escala·bruta con la MISMA escala en cualquier condición', () => {
    const k = escalaParticulas();
    for (const c of COLORES) for (const d of [10, 20, 35, 60]) for (const n of NAHCO3_OPCIONES) for (const T of [8, 25, 38]) {
      const cc = { color: c, distancia: d, nahco3: n, T };
      const v = tasasVisuales(cc);
      expect(v.o2).toBeCloseTo(k * tasaBruta(cc), 10);
      expect(v.resp).toBeCloseTo(k * respiracion(T), 10);
      expect(v.pUsar).toBeLessThanOrEqual(1);
      // estequiometría de lo dibujado
      expect(v.co2).toBe(v.o2);
      expect(v.atp).toBeCloseTo(3 * v.o2, 12);
      expect(v.g3p).toBeCloseTo(v.o2 / 3, 12);
    }
  });
  test('fotones dibujados ∝ PPFD; los que mueven electrones = 8 por O₂', () => {
    const v = tasasVisuales(ref('rojo', 20));
    expect(v.fotones).toBeCloseTo(100, 9);
    expect(v.fotones * v.pAbsorber * v.pUsar).toBeCloseTo(8 * v.o2, 9);
  });
});

describe('reloj único', () => {
  test('un ensayo dura 10 min simulados en DURACION_VISUAL_S de pantalla y recoge lo del dominio', () => {
    const r = new RelojFoto(ref('rojo', 20));
    let fin: number | null = null;
    r.onFin = (e) => { fin = e.o2; };
    r.iniciarEnsayo();
    let pasos = 0;
    while (r.ensayo && pasos < 10000) { r.paso(1 / 60); pasos++; }
    expect(fin).not.toBeNull();
    expect(fin!).toBeCloseTo(o2EnsayoB4('rojo', 20), 12);
    expect(pasos / 60).toBeCloseTo(DURACION_VISUAL_S, 1);
    expect(r.ultimo?.o2).toBeCloseTo(o2EnsayoB4('rojo', 20), 12);
  });
  test('la meta del reto sólo se alcanza con rojo a la distancia mínima', () => {
    for (const dMin of [16, 20, 28]) {
      const meta = metaB4(dMin);
      expect(o2Ensayo(ref('rojo', dMin))).toBeGreaterThanOrEqual(meta);
      for (const c of ['amarillo', 'blanco', 'azul', 'verde'] as ColorLuzB4[]) expect(o2Ensayo(ref(c, dMin))).toBeLessThan(meta);
    }
  });
  test('cambiar las condiciones cambia a la vez las tasas visibles y las cifras (mismo objeto)', () => {
    const r = new RelojFoto(ref('verde', 50));
    const v0 = r.version, o0 = r.tasas.o2;
    r.fijar({ color: 'rojo', distancia: 20 });
    expect(r.version).toBeGreaterThan(v0);
    expect(r.tasas.o2).toBeGreaterThan(o0);
    expect(r.neta).toBeCloseTo(tasaNetaB4('rojo', 20), 14);
    expect(r.burbujasMin).toBeCloseTo(burbujasPorMin(r.neta), 12);
  });
  test('en pausa la escena se congela pero el ensayo termina (movimiento reducido)', () => {
    const r = new RelojFoto(ref('rojo', 20));
    r.pausa = true;
    r.iniciarEnsayo();
    const t0 = r.tAnim;
    for (let i = 0; i < 600 && r.ensayo; i++) r.paso(1 / 60);
    expect(r.ensayo).toBeNull();
    expect(r.tAnim).toBe(t0);
    expect(r.dtAnim).toBe(0);
  });
});
