import {
  validarF1, validarF2, validarF3, validarF4, validarF5,
  validarF6, validarF7, validarF8, validarF9, validarF10,
} from '@/domain/fisica';

// ── F1 Tiro Parabólico ──────────────────────────────────────────────────────
describe('validarF1', () => {
  it('true when resultado is exito', () => expect(validarF1({ resultado: 'exito' } as any)).toBe(true));
  it('false when resultado is fallo', () => expect(validarF1({ resultado: 'fallo' } as any)).toBe(false));
  it('false when resultado is null', () => expect(validarF1({ resultado: null } as any)).toBe(false));
});

// ── F2 Plano Inclinado ──────────────────────────────────────────────────────
describe('validarF2', () => {
  it('true when angulo > 0 and resultado set', () => expect(validarF2({ angulo: 30, resultado: 'exito' } as any)).toBe(true));
  it('false when angulo is 0', () => expect(validarF2({ angulo: 0, resultado: 'exito' } as any)).toBe(false));
  it('false when resultado is null', () => expect(validarF2({ angulo: 30, resultado: null } as any)).toBe(false));
});

// ── F3 Péndulo Simple ───────────────────────────────────────────────────────
describe('validarF3', () => {
  it('true when longitud > 0 and periodo > 0', () => expect(validarF3({ longitud: 1.5, periodo: 2.4 } as any)).toBe(true));
  it('false when longitud is 0', () => expect(validarF3({ longitud: 0, periodo: 2.4 } as any)).toBe(false));
  it('false when periodo is 0', () => expect(validarF3({ longitud: 1.5, periodo: 0 } as any)).toBe(false));
});

// ── F4 Ley de Hooke ─────────────────────────────────────────────────────────
describe('validarF4', () => {
  it('true when masa, k, estiramiento are non-zero', () => expect(validarF4({ masa: 2, k: 100, estiramiento: 0.02 } as any)).toBe(true));
  it('false when estiramiento is 0', () => expect(validarF4({ masa: 2, k: 100, estiramiento: 0 } as any)).toBe(false));
  it('false when k is 0', () => expect(validarF4({ masa: 2, k: 0, estiramiento: 0.02 } as any)).toBe(false));
  it('false when masa is 0', () => expect(validarF4({ masa: 0, k: 100, estiramiento: 0.02 } as any)).toBe(false));
});

// ── F5 Prensa Hidráulica (bitácora) ─────────────────────────────────────────
describe('validarF5', () => {
  it('true when bitacoraData has fisica5 key', () => expect(validarF5({ fisica5: { presion: 31830 } } as any)).toBe(true));
  it('false when fisica5 key missing', () => expect(validarF5({} as any)).toBe(false));
  it('false when fisica5 is null', () => expect(validarF5({ fisica5: null } as any)).toBe(false));
});

// ── F6 Principio de Arquímedes ──────────────────────────────────────────────
// Validator checks sumergido against physics-based target: min(1.1, densidadCuerpo/densidadLiquido).
// Defaults: densidadCuerpo=800, densidadLiquido=1000 → targetSumergido=0.8
describe('validarF6', () => {
  it('true when sumergido matches target (defaults: 0.8)', () => expect(validarF6({ sumergido: 0.8 } as any)).toBe(true));
  it('true within tolerance of target', () => expect(validarF6({ sumergido: 0.83 } as any)).toBe(true));
  it('false when far from target', () => expect(validarF6({ sumergido: 1.0 } as any)).toBe(false));
  it('false when sumergido is 0', () => expect(validarF6({ sumergido: 0 } as any)).toBe(false));
  it('false when sumergido is undefined (coerced to 0)', () => expect(validarF6({ sumergido: undefined } as any)).toBe(false));
  it('accounts for explicit densidades', () => {
    // densidadCuerpo=500, densidadLiquido=1000 → target=0.5
    expect(validarF6({ sumergido: 0.5, densidadCuerpo: 500, densidadLiquido: 1000 } as any)).toBe(true);
    expect(validarF6({ sumergido: 1.0, densidadCuerpo: 500, densidadLiquido: 1000 } as any)).toBe(false);
  });
});

// ── F7 Dilatación Térmica ────────────────────────────────────────────────────
describe('validarF7', () => {
  it('true when tempFin - tempIni >= 50', () => expect(validarF7({ tempIni: 20, tempFin: 70 } as any)).toBe(true));
  it('true at exact boundary (50)', () => expect(validarF7({ tempIni: 20, tempFin: 70 } as any)).toBe(true));
  it('false when delta is 49', () => expect(validarF7({ tempIni: 20, tempFin: 69 } as any)).toBe(false));
  it('false when cooled down', () => expect(validarF7({ tempIni: 100, tempFin: 20 } as any)).toBe(false));
});

// ── F8 Ley de Ohm ────────────────────────────────────────────────────────────
describe('validarF8', () => {
  it('true when voltaje > 0, resistencia > 0, switchOn', () => expect(validarF8({ voltaje: 5, resistencia: 220, switchOn: true } as any)).toBe(true));
  it('false when switch is off', () => expect(validarF8({ voltaje: 5, resistencia: 220, switchOn: false } as any)).toBe(false));
  it('false when voltaje is 0', () => expect(validarF8({ voltaje: 0, resistencia: 220, switchOn: true } as any)).toBe(false));
  it('false when resistencia is 0', () => expect(validarF8({ voltaje: 5, resistencia: 0, switchOn: true } as any)).toBe(false));
});

// ── F9 Electrostática ────────────────────────────────────────────────────────
// Charges in integer μC (K_SCALED=89.87); distancia required.
describe('validarF9', () => {
  it('true with two positive charges and distancia', () => expect(validarF9({ q1: 1, q2: 1, distancia: 0.1 } as any)).toBe(true));
  it('true with opposite charges and distancia', () => expect(validarF9({ q1: 1, q2: -1, distancia: 0.1 } as any)).toBe(true));
  it('false when q1 is 0', () => expect(validarF9({ q1: 0, q2: 1, distancia: 0.1 } as any)).toBe(false));
  it('false when q2 is 0', () => expect(validarF9({ q1: 1, q2: 0, distancia: 0.1 } as any)).toBe(false));
  it('false when distancia missing', () => expect(validarF9({ q1: 1, q2: 1 } as any)).toBe(false));
});

// ── F10 Motor Eléctrico ──────────────────────────────────────────────────────
describe('validarF10', () => {
  it('true when encendido and rpm > 0', () => expect(validarF10({ encendido: true, rpm: 1200 } as any)).toBe(true));
  it('false when not encendido', () => expect(validarF10({ encendido: false, rpm: 1200 } as any)).toBe(false));
  it('false when rpm is 0', () => expect(validarF10({ encendido: true, rpm: 0 } as any)).toBe(false));
});
