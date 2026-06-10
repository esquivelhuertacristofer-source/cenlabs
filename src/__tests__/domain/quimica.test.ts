import {
  validarQ1, validarQ2, validarQ3, validarQ4, validarQ5,
  validarQ6, validarQ7, validarQ8, validarQ9, validarQ10,
} from '@/domain/quimica';

// ── Q1 Construcción Atómica ───────────────────────────────────────────────────
describe('validarQ1', () => {
  const base = { targetZ: 6, targetA: 14, targetCharge: 0, intentos: 0 };

  it('isOk for correct neutral Carbon-14', () => {
    const result = validarQ1({ ...base, protones: 6, neutrones: 8, electrones: 6 } as any);
    expect(result.isOk).toBe(true);
    expect(result.estrellas).toBe(3);
  });
  it('gives 2 stars on second attempt', () => {
    const result = validarQ1({ ...base, intentos: 1, protones: 6, neutrones: 8, electrones: 6 } as any);
    expect(result.estrellas).toBe(2);
  });
  it('gives 1 star on third+ attempt', () => {
    const result = validarQ1({ ...base, intentos: 2, protones: 6, neutrones: 8, electrones: 6 } as any);
    expect(result.estrellas).toBe(1);
  });
  it('fails with wrong element (wrong Z)', () => {
    const result = validarQ1({ ...base, protones: 7, neutrones: 7, electrones: 7 } as any);
    expect(result.isOk).toBe(false);
    expect(result.message).toMatch(/Elemento incorrecto/);
  });
  it('fails with wrong isotope (wrong A)', () => {
    const result = validarQ1({ ...base, protones: 6, neutrones: 6, electrones: 6 } as any);
    expect(result.isOk).toBe(false);
    expect(result.message).toMatch(/Masa atómica/);
  });
  it('fails with wrong charge (extra electron)', () => {
    const result = validarQ1({ ...base, protones: 6, neutrones: 8, electrones: 7 } as any);
    expect(result.isOk).toBe(false);
    expect(result.message).toMatch(/Carga/);
  });
  it('handles ion target (O²⁻): needs 10 electrons', () => {
    const ion = { targetZ: 8, targetA: 16, targetCharge: -2, intentos: 0 };
    const result = validarQ1({ ...ion, protones: 8, neutrones: 8, electrones: 10 } as any);
    expect(result.isOk).toBe(true);
  });
  it('reports ceder electrons for cation', () => {
    const cation = { targetZ: 6, targetA: 14, targetCharge: 2, intentos: 0 };
    const result = validarQ1({ ...cation, protones: 6, neutrones: 8, electrones: 6 } as any);
    expect(result.isOk).toBe(false);
    expect(result.message).toMatch(/ceder/);
  });
});

// ── Q2 Gases Ideales ──────────────────────────────────────────────────────────
describe('validarQ2', () => {
  it('true when P matches pTarget within 0.1', () => {
    expect(validarQ2({ P: 3.5, pTarget: 3.5, isExploded: false } as any)).toBe(true);
  });
  it('true at boundary (diff = 0.09)', () => {
    expect(validarQ2({ P: 3.59, pTarget: 3.5, isExploded: false } as any)).toBe(true);
  });
  it('false when diff = 0.1', () => {
    expect(validarQ2({ P: 3.6, pTarget: 3.5, isExploded: false } as any)).toBe(false);
  });
  it('false when exploded even if P matches', () => {
    expect(validarQ2({ P: 3.5, pTarget: 3.5, isExploded: true } as any)).toBe(false);
  });
});

// ── Q3 Balanceo de Ecuaciones ─────────────────────────────────────────────────
describe('validarQ3', () => {
  it('true when 4 reactions completed', () => {
    expect(validarQ3({ reaccionesCompletadas: ['a', 'b', 'c', 'd'] } as any)).toBe(true);
  });
  it('true when more than 4 completed', () => {
    expect(validarQ3({ reaccionesCompletadas: ['a', 'b', 'c', 'd', 'e'] } as any)).toBe(true);
  });
  it('false when only 3 completed', () => {
    expect(validarQ3({ reaccionesCompletadas: ['a', 'b', 'c'] } as any)).toBe(false);
  });
  it('false when reaccionesCompletadas is undefined', () => {
    expect(validarQ3({} as any)).toBe(false);
  });
});

// ── Q4 Reactivo Limitante ─────────────────────────────────────────────────────
describe('validarQ4', () => {
  const results = { limitingIdx: 0, excessMass: 10.5 };
  const limitante = { results };

  it('true when limitante idx and excess match', () => {
    expect(validarQ4(limitante as any, 0, 10.5)).toBe(true);
  });
  it('true within 0.1 tolerance on excess', () => {
    expect(validarQ4(limitante as any, 0, 10.59)).toBe(true);
  });
  it('false when limitante idx wrong', () => {
    expect(validarQ4(limitante as any, 1, 10.5)).toBe(false);
  });
  it('false when excess off by 0.11', () => {
    expect(validarQ4(limitante as any, 0, 10.61)).toBe(false);
  });
  it('false when results is missing', () => {
    expect(validarQ4({} as any, 0, 10.5)).toBe(false);
  });
});

// ── Q5 Preparación de Soluciones ──────────────────────────────────────────────
describe('validarQ5', () => {
  it('true when molarity matches within 0.05', () => {
    // NaCl: pm=58.443, purity=1.0, mTarget=0.5M in 250mL
    // masa requerida = 0.5 * 0.25 * 58.443 = 7.305g
    const s = {
      mTarget: 0.5,
      sal: { pm: 58.443, purity: 1.0 },
      matraz: { polvo: 7.305, agua: 250 },
    };
    expect(validarQ5(s as any)).toBe(true);
  });
  it('false when mass is way off', () => {
    const s = {
      mTarget: 0.5,
      sal: { pm: 58.443, purity: 1.0 },
      matraz: { polvo: 1.0, agua: 250 },
    };
    expect(validarQ5(s as any)).toBe(false);
  });
  it('accounts for purity in calculation', () => {
    // With 98.5% purity, need more powder
    const pm = 58.443, purity = 0.985;
    const polvo = (0.5 * 0.25 * pm) / purity; // ~7.386g
    const s = { mTarget: 0.5, sal: { pm, purity }, matraz: { polvo, agua: 250 } };
    expect(validarQ5(s as any)).toBe(true);
  });
});

// ── Q6 Solubilidad ────────────────────────────────────────────────────────────
// Student must: place solution on ice AND have salt exceed solubility limit at that temp.
describe('validarQ6', () => {
  const kno3 = { a: 31.6, b: 0.02 };
  it('true when on ice and salt exceeds solubility limit', () => {
    const limit = kno3.a * Math.exp(kno3.b * 20); // ~46.8 at 20°C
    const s = { temp: 20, salAgregada: limit + 1, sustanciaIdx: 0, sustancias: [kno3], ubicacion: 'hielo' };
    expect(validarQ6(s as any)).toBe(true);
  });
  it('false when not on ice even if salt exceeds limit', () => {
    const limit = kno3.a * Math.exp(kno3.b * 20);
    const s = { temp: 20, salAgregada: limit + 1, sustanciaIdx: 0, sustancias: [kno3], ubicacion: 'mesa' };
    expect(validarQ6(s as any)).toBe(false);
  });
  it('false when below solubility limit (even on ice)', () => {
    const limit = kno3.a * Math.exp(kno3.b * 20);
    const s = { temp: 20, salAgregada: limit - 1, sustanciaIdx: 0, sustancias: [kno3], ubicacion: 'hielo' };
    expect(validarQ6(s as any)).toBe(false);
  });
  it('false when sustanciaIdx out of bounds', () => {
    const s = { temp: 20, salAgregada: 999, sustanciaIdx: 5, sustancias: [kno3], ubicacion: 'hielo' };
    expect(validarQ6(s as any)).toBe(false);
  });
});

// ── Q7 Titulación Ácido-Base ──────────────────────────────────────────────────
describe('validarQ7', () => {
  it('true when answer matches ca exactly', () => {
    expect(validarQ7({ ca: 0.1 } as any, 0.1)).toBe(true);
  });
  it('true within 0.01 tolerance', () => {
    expect(validarQ7({ ca: 0.1 } as any, 0.109)).toBe(true);
  });
  it('false when off by 0.011', () => {
    expect(validarQ7({ ca: 0.1 } as any, 0.111)).toBe(false);
  });
});

// ── Q8 Equilibrio Químico ─────────────────────────────────────────────────────
describe('validarQ8', () => {
  const coldJeringa = { id: 3, temp: 5 };
  const jeringas = [{ id: 1, temp: 20 }, { id: 2, temp: 80 }, coldJeringa];

  it('true when temp < 10 and colors correct', () => {
    expect(validarQ8({ jeringas } as any, 'transparente', 'cafe', 'incoloro')).toBe(true);
  });
  it('false when temp is 10 or above', () => {
    const warm = [{ id: 1, temp: 20 }, { id: 2, temp: 80 }, { id: 3, temp: 10 }];
    expect(validarQ8({ jeringas: warm } as any, 'transparente', 'cafe', 'incoloro')).toBe(false);
  });
  it('false when d1 color is wrong', () => {
    expect(validarQ8({ jeringas } as any, 'cafe', 'cafe', 'incoloro')).toBe(false);
  });
  it('false when d3 color is wrong', () => {
    expect(validarQ8({ jeringas } as any, 'transparente', 'cafe', 'cafe')).toBe(false);
  });
  it('false when jeringa 3 missing (defaults to 20°C)', () => {
    expect(validarQ8({ jeringas: [] } as any, 'transparente', 'cafe', 'incoloro')).toBe(false);
  });
});

// ── Q9 Celda Galvánica ────────────────────────────────────────────────────────
// Validator uses seedMetales to determine correct anode/cathode from reduction potentials.
// Zn (-0.76V) < Cu (0.34V) → Zn is anode, Cu is cathode; E°cell = 0.34 - (-0.76) = 1.10V
describe('validarQ9', () => {
  const celda = { vasoIzq: 'Zn', vasoDer: 'Cu', voltaje: 1.10, seedMetales: ['Zn', 'Cu'] };

  it('true when anodo, catodo and voltage match', () => {
    expect(validarQ9(celda as any, 'Zn', 'Cu', 1.10)).toBe(true);
  });
  it('true within 0.05 voltage tolerance', () => {
    expect(validarQ9(celda as any, 'Zn', 'Cu', 1.14)).toBe(true);
  });
  it('false when anodo is swapped', () => {
    expect(validarQ9(celda as any, 'Cu', 'Zn', 1.10)).toBe(false);
  });
  it('false when voltage off by 0.06', () => {
    expect(validarQ9(celda as any, 'Zn', 'Cu', 1.16)).toBe(false);
  });
  it('false when seedMetales is missing', () => {
    expect(validarQ9({ voltaje: 1.10 } as any, 'Zn', 'Cu', 1.10)).toBe(false);
  });
});

// ── Q10 Destilación Fraccionada ────────────────────────────────────────────────
describe('validarQ10', () => {
  it('true when volDestilado > 50 and pureza near 95', () => {
    expect(validarQ10({ volDestilado: 60 } as any, 95)).toBe(true);
  });
  it('true with pureza at boundary (90 or 100)', () => {
    expect(validarQ10({ volDestilado: 60 } as any, 91)).toBe(true);
    expect(validarQ10({ volDestilado: 60 } as any, 99)).toBe(true);
  });
  it('false when volDestilado <= 50', () => {
    expect(validarQ10({ volDestilado: 50 } as any, 95)).toBe(false);
  });
  it('false when pureza too low (< 90)', () => {
    expect(validarQ10({ volDestilado: 60 } as any, 89)).toBe(false);
  });
  it('false when pureza too high (> 100)', () => {
    expect(validarQ10({ volDestilado: 60 } as any, 101)).toBe(false);
  });
});
