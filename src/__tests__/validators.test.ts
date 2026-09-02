import { validatePracticaId, validateScore } from '@/utils/validators';

describe('validatePracticaId', () => {
  it('accepts valid IDs for all 5 subjects', () => {
    expect(validatePracticaId('quimica-1')).toBe(true);
    expect(validatePracticaId('quimica-10')).toBe(true);
    expect(validatePracticaId('fisica-1')).toBe(true);
    expect(validatePracticaId('matematicas-7')).toBe(true);
    expect(validatePracticaId('biologia-10')).toBe(true);
  });

  /* Mecánica es el 75 % del catálogo y estaba fuera: la materia no figuraba y
     el número tenía tope de dos cifras. El efecto no era un error visible sino
     un panel de profesor vacío, porque el POST volvía 400 y nadie lo miraba. */
  it('accepts mecánica, including the three-digit numbering', () => {
    expect(validatePracticaId('mecanica-1')).toBe(true);
    expect(validatePracticaId('mecanica-99')).toBe(true);
    expect(validatePracticaId('mecanica-100')).toBe(true);
    expect(validatePracticaId('mecanica-120')).toBe(true);
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

  it('rejects numbering that cannot exist', () => {
    // El tope es de cordura, no el catálogo: acota la cadena que va a la
    // consulta, no dice qué labs hay.
    expect(validatePracticaId('mecanica-1000')).toBe(false);
    expect(validatePracticaId('quimica-0')).toBe(false);
    expect(validatePracticaId('quimica-01')).toBe(false);   // sin ceros a la izquierda
    expect(validatePracticaId('quimica--1')).toBe(false);
  });

  it('rejects injection attempts', () => {
    expect(validatePracticaId("quimica-1; DROP TABLE")).toBe(false);
    expect(validatePracticaId('mecanica-1 OR 1=1')).toBe(false);
    // Un salto de línea: `^…$` sin la bandera `m` no lo deja pasar, pero
    // conviene fijarlo porque cambiar la expresión es fácil y esto es lo que
    // separa una lista blanca de un `startsWith`.
    expect(validatePracticaId('mecanica-1\nmecanica-2')).toBe(false);
    expect(validatePracticaId('')).toBe(false);
    expect(validatePracticaId(null as unknown as string)).toBe(false);
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
