import {
  validarM1, feedbackM1, ValidarM2Result, validarM2,
  validarM3, validarM4, validarM5, validarM6,
  validarM7, validarM8, validarM9, validarM10,
} from '@/domain/matematicas';

// ── M1 Ecuaciones Cuadráticas ────────────────────────────────────────────────
describe('validarM1', () => {
  const target = { a: 2, b: -2, c: -3 };
  it('true when within tolerance', () => {
    expect(validarM1({ a: 2, b: -2, c: -3, target } as any)).toBe(true);
  });
  it('true with a off by 0.14 (< 0.15 threshold)', () => {
    expect(validarM1({ a: 2.14, b: -2, c: -3, target } as any)).toBe(true);
  });
  it('false when a off by 0.16', () => {
    expect(validarM1({ a: 2.16, b: -2, c: -3, target } as any)).toBe(false);
  });
  it('false when b off by 0.31', () => {
    expect(validarM1({ a: 2, b: -2.31, c: -3, target } as any)).toBe(false);
  });
  it('false when c off by 0.31', () => {
    expect(validarM1({ a: 2, b: -2, c: -3.31, target } as any)).toBe(false);
  });
});

describe('feedbackM1', () => {
  const target = { a: 2, b: -2, c: -3 };
  it('reports concavity error when sign of a differs', () => {
    const msg = feedbackM1({ a: -2, b: -2, c: -3, target } as any);
    expect(msg).toMatch(/Concavidad/);
  });
  it('reports aperture advice when a is far off', () => {
    const msg = feedbackM1({ a: 4, b: -2, c: -3, target } as any);
    expect(msg).toMatch(/apertura/);
  });
  it('returns fine-tuning message when close', () => {
    const msg = feedbackM1({ a: 2.1, b: -2.1, c: -3, target } as any);
    expect(msg).toMatch(/AJUSTE FINO/);
  });
});

// ── M2 Sistemas 2×2 ──────────────────────────────────────────────────────────
describe('validarM2', () => {
  it('finds intersection at (5, 0) correctly', () => {
    const result = validarM2({ m1: 1, b1: -5, m2: -1, b2: 5, target: { x: 5, y: 0 } } as any);
    expect(result.isOk).toBe(true);
    expect(result.interseccion?.x).toBeCloseTo(5, 1);
    expect(result.interseccion?.y).toBeCloseTo(0, 1);
  });
  it('false when lines are parallel (same slope)', () => {
    const result = validarM2({ m1: 2, b1: 1, m2: 2, b2: 3, target: { x: 0, y: 0 } } as any);
    expect(result.isOk).toBe(false);
  });
  it('false when intersection misses target', () => {
    const result = validarM2({ m1: 1, b1: 0, m2: -1, b2: 0, target: { x: 5, y: 0 } } as any);
    expect(result.isOk).toBe(false);
  });
  it('always returns interseccion point when lines intersect', () => {
    const result = validarM2({ m1: 1, b1: 0, m2: -1, b2: 4, target: { x: 999, y: 999 } } as any);
    expect(result.interseccion).toBeDefined();
    expect(result.interseccion?.x).toBeCloseTo(2, 1);
  });
});

// ── M3 Escala Richter ─────────────────────────────────────────────────────────
describe('validarM3', () => {
  it('true when user value is exact', () => {
    const factor = Math.pow(10, 1.5 * (8.0 - 6.0));
    expect(validarM3({ targetM: 8.0, magnitudBase: 6.0, userInputFactor: String(factor) } as any)).toBe(true);
  });
  it('true when within 5% tolerance', () => {
    const factor = Math.pow(10, 1.5 * (8.0 - 6.0));
    expect(validarM3({ targetM: 8.0, magnitudBase: 6.0, userInputFactor: String(factor * 1.049) } as any)).toBe(true);
  });
  it('false when off by more than 5%', () => {
    const factor = Math.pow(10, 1.5 * (8.0 - 6.0));
    expect(validarM3({ targetM: 8.0, magnitudBase: 6.0, userInputFactor: String(factor * 1.06) } as any)).toBe(false);
  });
  it('false for non-numeric input', () => {
    expect(validarM3({ targetM: 8.0, magnitudBase: 6.0, userInputFactor: 'abc' } as any)).toBe(false);
  });
});

// ── M4 Teorema de Pitágoras ───────────────────────────────────────────────────
describe('validarM4', () => {
  it('true for 3-4-5 triangle', () => {
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5' } as any)).toBe(true);
  });
  it('true for 5-12-13 triangle', () => {
    expect(validarM4({ catetoA: 5, catetoB: 12, userInputC: '13' } as any)).toBe(true);
  });
  it('true within 0.1 tolerance', () => {
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5.09' } as any)).toBe(true);
  });
  it('false when off by 0.11', () => {
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: '5.11' } as any)).toBe(false);
  });
  it('false for non-numeric input', () => {
    expect(validarM4({ catetoA: 3, catetoB: 4, userInputC: 'abc' } as any)).toBe(false);
  });
});

// ── M5 Trigonometría ──────────────────────────────────────────────────────────
// Angle restriction removed (audit fix): only hallazgos count matters.
describe('validarM5', () => {
  const twoHallazgos = [{ id: 1, angulo: 90 }, { id: 2, angulo: 180 }];
  it('true with 2+ hallazgos at any angle', () => {
    expect(validarM5({ angulo: 45, hallazgos: twoHallazgos } as any)).toBe(true);
  });
  it('true with 2+ hallazgos regardless of angle', () => {
    expect(validarM5({ angulo: 90, hallazgos: twoHallazgos } as any)).toBe(true);
  });
  it('false when fewer than 2 hallazgos', () => {
    expect(validarM5({ angulo: 45, hallazgos: [{ id: 1, angulo: 90 }] } as any)).toBe(false);
  });
  it('false when hallazgos is empty', () => {
    expect(validarM5({ angulo: 45, hallazgos: [] } as any)).toBe(false);
  });
});

// ── M6 Transformaciones Geométricas ──────────────────────────────────────────
describe('validarM6', () => {
  const target = { tx: 5, ty: 3, rotacion: 90, escala: 2.0 };
  it('true when all values match exactly', () => {
    expect(validarM6({ tx: 5, ty: 3, rotacion: 90, escala: 2.0, target } as any)).toBe(true);
  });
  it('false when tx differs', () => {
    expect(validarM6({ tx: 4, ty: 3, rotacion: 90, escala: 2.0, target } as any)).toBe(false);
  });
  it('false when rotacion differs', () => {
    expect(validarM6({ tx: 5, ty: 3, rotacion: 180, escala: 2.0, target } as any)).toBe(false);
  });
  it('false when escala differs', () => {
    expect(validarM6({ tx: 5, ty: 3, rotacion: 90, escala: 1.5, target } as any)).toBe(false);
  });
});

// ── M7 Óptica / Snell ─────────────────────────────────────────────────────────
describe('validarM7', () => {
  it('true when userInput matches n2Misterio exactly', () => {
    expect(validarM7({ userInputN2: '1.5', n2Misterio: 1.5 } as any)).toBe(true);
  });
  it('true within ±0.05 tolerance', () => {
    expect(validarM7({ userInputN2: '1.54', n2Misterio: 1.5 } as any)).toBe(true);
  });
  it('false when off by 0.06', () => {
    expect(validarM7({ userInputN2: '1.56', n2Misterio: 1.5 } as any)).toBe(false);
  });
  it('false for non-numeric input', () => {
    expect(validarM7({ userInputN2: '', n2Misterio: 1.5 } as any)).toBe(false);
  });
});

// ── M8 Derivadas ─────────────────────────────────────────────────────────────
describe('validarM8', () => {
  it('true at critical point x=1 (f\'(1)=0)', () => {
    expect(validarM8({ xActual: 1 } as any)).toBe(true);
  });
  it('true at critical point x=3 (f\'(3)=0)', () => {
    expect(validarM8({ xActual: 3 } as any)).toBe(true);
  });
  it('true within tolerance (x=1.02)', () => {
    expect(validarM8({ xActual: 1.02 } as any)).toBe(true);
  });
  it('false at x=2 (not a critical point)', () => {
    expect(validarM8({ xActual: 2 } as any)).toBe(false);
  });
  it('false at x=0', () => {
    expect(validarM8({ xActual: 0 } as any)).toBe(false);
  });
});

// ── M9 Integral de Riemann ────────────────────────────────────────────────────
describe('validarM9', () => {
  it('true when error < 0.5', () => expect(validarM9(0.1)).toBe(true));
  it('true at 0.49', () => expect(validarM9(0.49)).toBe(true));
  it('false at exactly 0.5', () => expect(validarM9(0.5)).toBe(false));
  it('false when error > 0.5', () => expect(validarM9(1.0)).toBe(false));
});

// ── M10 Distribución de Galton ────────────────────────────────────────────────
describe('validarM10', () => {
  const makeContainers = (total: number) => {
    const c = new Array(11).fill(0);
    c[5] = total;
    return c;
  };
  it('true when total >= 200', () => {
    expect(validarM10({ contenedores: makeContainers(200) } as any)).toBe(true);
  });
  it('true when total > 200', () => {
    expect(validarM10({ contenedores: makeContainers(500) } as any)).toBe(true);
  });
  it('false when total < 200', () => {
    expect(validarM10({ contenedores: makeContainers(199) } as any)).toBe(false);
  });
  it('false when all containers empty', () => {
    expect(validarM10({ contenedores: new Array(11).fill(0) } as any)).toBe(false);
  });
});
