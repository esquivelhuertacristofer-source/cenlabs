import { validatePracticaId, validateScore } from '@/utils/validators';

describe('validatePracticaId', () => {
  it('accepts valid IDs for all 4 subjects', () => {
    expect(validatePracticaId('quimica-1')).toBe(true);
    expect(validatePracticaId('quimica-10')).toBe(true);
    expect(validatePracticaId('fisica-1')).toBe(true);
    expect(validatePracticaId('matematicas-7')).toBe(true);
    expect(validatePracticaId('biologia-10')).toBe(true);
  });

  it('rejects unknown subjects', () => {
    expect(validatePracticaId('arte-1')).toBe(false);
    expect(validatePracticaId('historia-3')).toBe(false);
    expect(validatePracticaId('QUIMICA-1')).toBe(false);
  });

  it('rejects missing number', () => {
    expect(validatePracticaId('quimica')).toBe(false);
    expect(validatePracticaId('quimica-')).toBe(false);
  });

  it('rejects 3-digit numbers', () => {
    expect(validatePracticaId('quimica-100')).toBe(false);
  });

  it('rejects injection attempts', () => {
    expect(validatePracticaId("quimica-1; DROP TABLE")).toBe(false);
    expect(validatePracticaId('')).toBe(false);
  });
});

describe('validateScore', () => {
  it('accepts 0 to 100', () => {
    expect(validateScore(0)).toBe(true);
    expect(validateScore(50)).toBe(true);
    expect(validateScore(100)).toBe(true);
    expect(validateScore(99.9)).toBe(true);
  });

  it('rejects out-of-range values', () => {
    expect(validateScore(-1)).toBe(false);
    expect(validateScore(101)).toBe(false);
    expect(validateScore(1000)).toBe(false);
  });

  it('rejects non-numeric types', () => {
    expect(validateScore(NaN)).toBe(false);
    expect(validateScore('100' as any)).toBe(false);
    expect(validateScore(null as any)).toBe(false);
    expect(validateScore(undefined as any)).toBe(false);
  });
});
