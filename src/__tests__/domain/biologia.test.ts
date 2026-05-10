import {
  validarB1, validarB2, validarB3, validarB4, validarB5,
  validarB6, validarB7, validarB8, validarB9, validarB10,
} from '@/domain/biologia';

// ── B1 Microscopía ───────────────────────────────────────────────────────────
describe('validarB1', () => {
  const base = { objetivoMag: 40, iluminacion: 75, enfoqueZ: 50, focoIdealZ: 50 };

  it('passes with 40x, good light, perfect focus', () => expect(validarB1(base as any)).toBe(true));
  it('fails when mag below minimum', () => expect(validarB1({ ...base, objetivoMag: 10 } as any)).toBe(false));
  it('fails when light too low (< 60)', () => expect(validarB1({ ...base, iluminacion: 55 } as any)).toBe(false));
  it('fails when light too high (> 95)', () => expect(validarB1({ ...base, iluminacion: 100 } as any)).toBe(false));
  it('fails when out of focus for 40x (diff > 3)', () => expect(validarB1({ ...base, enfoqueZ: 54 } as any)).toBe(false));
  it('passes 100x with focus diff = 1', () => {
    const s = { objetivoMag: 100, iluminacion: 75, enfoqueZ: 50, focoIdealZ: 50 };
    expect(validarB1(s as any)).toBe(true);
  });
  it('fails 100x with focus diff = 2', () => {
    const s = { objetivoMag: 100, iluminacion: 75, enfoqueZ: 52, focoIdealZ: 50 };
    expect(validarB1(s as any)).toBe(false);
  });
  it('respects custom magMin parameter', () => {
    expect(validarB1({ ...base, objetivoMag: 10 } as any, 10)).toBe(true);
  });
});

// ── B2 Transporte Celular ────────────────────────────────────────────────────
describe('validarB2', () => {
  it('true when concentrations are equal', () => expect(validarB2({ concExt: 0.3, concInt: 0.3 } as any)).toBe(true));
  it('true when within tolerance (< 0.05)', () => expect(validarB2({ concExt: 0.3, concInt: 0.32 } as any)).toBe(true));
  it('false when diff >= 0.05', () => expect(validarB2({ concExt: 0.3, concInt: 0.36 } as any)).toBe(false));
  it('false when far apart', () => expect(validarB2({ concExt: 0.1, concInt: 0.5 } as any)).toBe(false));
});

// ── B3 Síntesis de Proteínas ─────────────────────────────────────────────────
describe('validarB3', () => {
  it('true when status is success', () => expect(validarB3({ status: 'success' } as any)).toBe(true));
  it('false when status is idle', () => expect(validarB3({ status: 'idle' } as any)).toBe(false));
  it('false when status is error', () => expect(validarB3({ status: 'error' } as any)).toBe(false));
});

// ── B4 Fotosíntesis ──────────────────────────────────────────────────────────
describe('validarB4', () => {
  it('true when status is success', () => expect(validarB4({ status: 'success' } as any)).toBe(true));
  it('false when status is idle', () => expect(validarB4({ status: 'idle' } as any)).toBe(false));
});

// ── B5 Genética Mendeliana ───────────────────────────────────────────────────
describe('validarB5', () => {
  it('true when status is success', () => expect(validarB5({ status: 'success' } as any)).toBe(true));
  it('false otherwise', () => expect(validarB5({ status: 'idle' } as any)).toBe(false));
});

// ── B6 Evolución ─────────────────────────────────────────────────────────────
describe('validarB6', () => {
  it('true when generacion >= 3', () => expect(validarB6({ generacion: 3 } as any)).toBe(true));
  it('true when generacion > 3', () => expect(validarB6({ generacion: 10 } as any)).toBe(true));
  it('false when generacion < 3', () => expect(validarB6({ generacion: 2 } as any)).toBe(false));
  it('false at generacion 1 (start)', () => expect(validarB6({ generacion: 1 } as any)).toBe(false));
});

// ── B7 Sistema Nervioso ───────────────────────────────────────────────────────
describe('validarB7', () => {
  it('true when status is success', () => expect(validarB7({ status: 'success' } as any)).toBe(true));
  it('false otherwise', () => expect(validarB7({ status: 'reposo' } as any)).toBe(false));
});

// ── B8 Sistema Cardiovascular ────────────────────────────────────────────────
describe('validarB8', () => {
  it('true when BPM within ±5 of target', () => expect(validarB8({ ritmoBPM: 145, targetBPM: 145 } as any)).toBe(true));
  it('true at upper boundary (diff = 4)', () => expect(validarB8({ ritmoBPM: 149, targetBPM: 145 } as any)).toBe(true));
  it('false at boundary (diff = 5)', () => expect(validarB8({ ritmoBPM: 150, targetBPM: 145 } as any)).toBe(false));
  it('false when far off', () => expect(validarB8({ ritmoBPM: 70, targetBPM: 145 } as any)).toBe(false));
});

// ── B9 Sistema Digestivo ──────────────────────────────────────────────────────
describe('validarB9', () => {
  it('true when monomerosAbsorbidos > 0', () => expect(validarB9({ monomerosAbsorbidos: 1 } as any)).toBe(true));
  it('true with large value', () => expect(validarB9({ monomerosAbsorbidos: 500 } as any)).toBe(true));
  it('false when monomerosAbsorbidos is 0', () => expect(validarB9({ monomerosAbsorbidos: 0 } as any)).toBe(false));
});

// ── B10 Ecosistema Lotka-Volterra ────────────────────────────────────────────
describe('validarB10', () => {
  it('true when tiempoVirtual > 10', () => expect(validarB10({ tiempoVirtual: 11 } as any)).toBe(true));
  it('true with large time', () => expect(validarB10({ tiempoVirtual: 100 } as any)).toBe(true));
  it('false when tiempoVirtual = 10 (not strictly greater)', () => expect(validarB10({ tiempoVirtual: 10 } as any)).toBe(false));
  it('false when tiempoVirtual is 0', () => expect(validarB10({ tiempoVirtual: 0 } as any)).toBe(false));
});
