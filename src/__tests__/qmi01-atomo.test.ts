/**
 * Q1 · Construcción atómica — modo «Átomo» y render volumétrico.
 *
 *  - El FOTÓN que sale al capturar un electrón: E = E_Slater(Z, e−1) − E_Slater(Z, e),
 *    λ = hc/E. Se contrasta con las energías de ionización del NIST (lo que mide un
 *    espectroscopista): el H exacto (13,6 eV · 91,1 nm), el resto dentro de lo que
 *    da Slater (≤ 26 %), y sin fotón donde el modelo no libera energía.
 *  - La banda (UV / visible / IR) y el color convencional de lo invisible.
 *  - Los radios ESQUEMÁTICOS de las capas: comprimidos, pero con el orden de verdad
 *    (catión < neutro < anión; Li el mayor y Ne el menor del periodo 2).
 *  - Paridad TS ↔ GLSL: la expresión de ψ que se compila en el sombreador, evaluada
 *    en JS, coincide con psi() de la física.
 */
import {
  RYDBERG_EV, HC_EV_NM, energiaOrbital, energiaSlater, energiaCaptura, longitudOnda, bandaEspectral,
  colorLongitudOnda, fotonCaptura, COLOR_UV, COLOR_IR, radioEsquematico, radioSlater, capasEsquema, ESQUEMA,
  psi, ORBITALES, A0_PM, type IdOrbital,
} from '@/components/simuladores/qmi01/orbitales';
import { EXPRESIONES_PSI, ORDEN_GLSL, evaluadorPsi, glslPsi } from '@/components/simuladores/qmi01/glslOrbitales';

/** Primera energía de ionización (eV), NIST Atomic Spectra Database. */
const NIST_IE1 = [13.598, 24.587, 5.392, 9.323, 8.298, 11.26, 14.534, 13.618, 17.423, 21.565];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe('energía de Slater', () => {
  test('ε = −13,6 eV·Z_eff²/n² y 0 sin ligar', () => {
    expect(energiaOrbital(1, 1)).toBeCloseTo(-RYDBERG_EV, 10);
    expect(energiaOrbital(2, 3.25)).toBeCloseTo((-RYDBERG_EV * 3.25 * 3.25) / 4, 10);
    expect(energiaOrbital(2, 0)).toBe(0);
    expect(energiaOrbital(2, -0.7)).toBe(0);
  });

  test('energía total: H −13,6 eV; He 2·Ry·1,7²; sin protones 0', () => {
    expect(energiaSlater(1, 1)).toBeCloseTo(-13.6057, 3);
    expect(energiaSlater(2, 2)).toBeCloseTo(-2 * RYDBERG_EV * 1.7 * 1.7, 9);
    expect(energiaSlater(0, 3)).toBe(0);
    expect(energiaSlater(6, 0)).toBe(0);
  });

  test('la energía total baja (más negativa) al añadir electrones al neutro', () => {
    for (let Z = 1; Z <= 10; Z++) for (let e = 1; e <= Z; e++) expect(energiaSlater(Z, e)).toBeLessThan(energiaSlater(Z, e - 1));
  });
});

describe('fotón de captura', () => {
  test('H: 13,606 eV y 91,13 nm, UV', () => {
    const f = fotonCaptura(1, 1)!;
    expect(f.energiaEv).toBeCloseTo(13.6057, 3);
    expect(f.lambdaNm).toBeCloseTo(91.127, 2);
    expect(f.banda).toBe('UV');
    expect(f.color).toBe(COLOR_UV);
    expect(longitudOnda(f.energiaEv) * f.energiaEv).toBeCloseTo(HC_EV_NM, 9);
  });

  test('neutros Z = 1…10: dentro del 30 % del NIST; H, He, Li, C y O dentro del 7 %', () => {
    for (let Z = 1; Z <= 10; Z++) {
      const E = energiaCaptura(Z, Z);
      const err = Math.abs(E / NIST_IE1[Z - 1] - 1);
      expect(err).toBeLessThan(0.3);
      if ([1, 2, 3, 6, 8].includes(Z)) expect(err).toBeLessThan(0.07);
    }
  });

  test('He: la diferencia de energías totales (24,2 eV) y no 13,6·Z_eff² (39,3 eV)', () => {
    const E = energiaCaptura(2, 2);
    expect(E).toBeCloseTo(RYDBERG_EV * (2 * 1.7 * 1.7 - 4), 9);
    expect(E).toBeGreaterThan(24);
    expect(E).toBeLessThan(24.6);
    expect(RYDBERG_EV * 1.7 * 1.7).toBeGreaterThan(39);
  });

  test('Li⁺ (Li²⁺ + e⁻): 75,9 eV frente a 75,64 eV del NIST', () => {
    const E = energiaCaptura(3, 2);
    expect(E).toBeCloseTo(75.92, 1);
    expect(Math.abs(E / 75.64 - 1)).toBeLessThan(0.01);
  });

  test('todos los fotones de captura de los neutros son UV (λ < 380 nm)', () => {
    for (let Z = 1; Z <= 10; Z++) {
      const f = fotonCaptura(Z, Z)!;
      expect(f.lambdaNm).toBeLessThan(380);
      expect(f.banda).toBe('UV');
    }
  });

  test('sin fotón: sin protones, electrón no ligado (H²⁻) y aniones que Slater no liga (O⁻, F⁻)', () => {
    expect(fotonCaptura(0, 1)).toBeNull();
    expect(energiaCaptura(1, 3)).toBeLessThanOrEqual(0);
    expect(fotonCaptura(1, 3)).toBeNull();
    expect(energiaCaptura(8, 9)).toBeLessThan(0);
    expect(fotonCaptura(8, 9)).toBeNull();
    expect(fotonCaptura(9, 10)).toBeNull();
    expect(fotonCaptura(6, 0)).toBeNull();
    expect(fotonCaptura(6, 11)).toBeNull();
  });

  test('Li⁻: Slater sí lo liga (0,39 eV) → fotón infrarrojo', () => {
    const f = fotonCaptura(3, 4)!;
    expect(f.energiaEv).toBeGreaterThan(0.3);
    expect(f.energiaEv).toBeLessThan(0.5);
    expect(f.banda).toBe('IR');
    expect(f.color).toBe(COLOR_IR);
  });
});

describe('banda y color', () => {
  test('límites 380 / 750 nm', () => {
    expect(bandaEspectral(379.9)).toBe('UV');
    expect(bandaEspectral(380)).toBe('visible');
    expect(bandaEspectral(750)).toBe('visible');
    expect(bandaEspectral(750.1)).toBe('IR');
    expect(colorLongitudOnda(91)).toBe(COLOR_UV);
    expect(colorLongitudOnda(2000)).toBe(COLOR_IR);
  });

  test('visible: azul a 450, verde a 530, rojo a 650 nm', () => {
    const [r1, g1, b1] = rgb(colorLongitudOnda(450));
    expect(b1).toBeGreaterThan(Math.max(r1, g1));
    const [r2, g2, b2] = rgb(colorLongitudOnda(530));
    expect(g2).toBeGreaterThan(Math.max(r2, b2));
    const [r3, g3, b3] = rgb(colorLongitudOnda(650));
    expect(r3).toBeGreaterThan(Math.max(g3, b3));
    for (const l of [380, 400, 500, 600, 700, 750]) expect(colorLongitudOnda(l)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('radios esquemáticos de las capas', () => {
  test('el carbono es la referencia y la función es monótona y acotada', () => {
    expect(radioEsquematico(ESQUEMA.rRefA0)).toBeCloseTo(ESQUEMA.rRef, 12);
    let prev = 0;
    for (let r = 0.05; r < 60; r *= 1.07) {
      const R = radioEsquematico(r);
      expect(R).toBeGreaterThan(prev);
      expect(R).toBeLessThan(ESQUEMA.rSuave + ESQUEMA.ancho);
      prev = R;
    }
  });

  test('el radio de Slater n²/Z_eff reproduce los radios calculados de Clementi (1967) dentro del 8 %', () => {
    const CLEMENTI_PM = [53, 31, 167, 112, 87, 67, 56, 48, 42, 38];
    for (let Z = 1; Z <= 10; Z++) {
      const c = capasEsquema(Z, Z);
      const capa = Z <= 2 ? c.K : c.L;
      const r = radioSlater(Z <= 2 ? 1 : 2, capa.zEff) * A0_PM;
      expect(Math.abs(r / CLEMENTI_PM[Z - 1] - 1)).toBeLessThan(0.08);
    }
  });

  test('C: capa L de radio 3 y K dentro de L', () => {
    const c = capasEsquema(6, 6);
    expect(c.L.radio).toBeCloseTo(3, 9);
    expect(c.K.radio!).toBeLessThan(c.L.radio! * 0.7);
    expect(c.exterior).toBe(c.L.radio);
    expect(c.K.ocupacion).toBe(2);
    expect(c.L.ocupacion).toBe(4);
  });

  test('periodo 2: el Li el mayor y el Ne el menor; el radio baja de Be a Ne', () => {
    const R = (Z: number) => capasEsquema(Z, Z).exterior!;
    for (let Z = 4; Z <= 10; Z++) expect(R(Z)).toBeLessThan(R(Z - 1));
    expect(R(3)).toBeGreaterThan(R(1));
    expect(R(2)).toBeLessThan(R(1));
  });

  test('catión < neutro < anión', () => {
    const R = (Z: number, e: number) => capasEsquema(Z, e).exterior!;
    expect(R(3, 2)).toBeLessThan(R(3, 3));
    expect(R(1, 1)).toBeLessThan(R(1, 2));
    expect(R(8, 8)).toBeLessThan(R(8, 10));
    expect(R(9, 9)).toBeLessThan(R(9, 10));
    expect(R(6, 4)).toBeLessThan(R(6, 6));
  });

  test('sin electrones o sin protones no hay radio exterior', () => {
    expect(capasEsquema(6, 0).exterior).toBeNull();
    expect(capasEsquema(0, 2).exterior).toBeNull();
    expect(capasEsquema(0, 2).K.radio).toBeNull();
  });
});

describe('paridad TS ↔ GLSL de ψ', () => {
  test('la expresión que va al sombreador da lo mismo que psi() (error relativo < 1e-12)', () => {
    let s = 12345;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (const o of ORBITALES) {
      const f = evaluadorPsi(o.id);
      for (let k = 0; k < 400; k++) {
        const Z = 0.3 + 9.7 * rnd();
        const [x, y, z] = [(rnd() - 0.5) * 12, (rnd() - 0.5) * 12, (rnd() - 0.5) * 12];
        const a = f(Z, x, y, z), b = psi(o.id, Z, x, y, z);
        expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-12 * Math.max(1e-30, Math.abs(b)) + 1e-300);
      }
      // en el núcleo y en el nodo del 2s
      expect(f(2, 0, 0, 0)).toBeCloseTo(psi(o.id, 2, 0, 0, 0), 12);
      expect(f(1, 2, 0, 0)).toBeCloseTo(psi(o.id, 1, 2, 0, 0), 12);
    }
  });

  test('el GLSL generado contiene cada expresión y la función psiOrb en el orden de los uniformes', () => {
    const g = glslPsi();
    expect(ORDEN_GLSL).toEqual(['1s', '2s', '2px', '2py', '2pz'] as IdOrbital[]);
    expect(g).toContain('float psiOrb(int i, vec3 q, float Z)');
    for (const [i, id] of ORDEN_GLSL.entries()) {
      expect(g).toContain(EXPRESIONES_PSI[id].replace(/\bPI\b/g, 'PSI_PI'));
      expect(g).toContain(`if (i == ${i}) return psi_${id}(Z, q.x, q.y, q.z);`);
    }
    // sin «PI» suelto (chocaría con el #define PI de three) y con literales en coma flotante
    expect(/\bPI\b/.test(g)).toBe(false);
    expect(/[^.\w]\d+[^.\d\w]/.test(g.replace(/i == \d/g, ''))).toBe(false);
  });
});
