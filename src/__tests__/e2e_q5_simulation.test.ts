/**
 * Simulación E2E del ejercicio Q5 — Preparación de Soluciones
 * Recorre el flujo: misión → pre-lab → pesaje → transferencia → aforo → validación,
 * con los mismos pasos que ofrecen los controles del panel (grueso 0.1 g, fino
 * 0.005 g, llenado rápido 1 mL hasta el 88 % y goteo de 0.05 mL).
 */
import { validarQ5, toleranciaAforo } from '@/domain/quimica';
import { SUSTANCIAS_SOLUCIONES as SUSTANCIAS } from '@/store/slices/quimicaSlice';

function generarMision(saltIdx: number, mTarget: number, vTarget: number) {
  const sal = SUSTANCIAS[saltIdx];
  const mRequerida = parseFloat(((mTarget * (vTarget / 1000) * sal.pm) / sal.purity).toFixed(3));
  return { sal, mTarget, vTarget, mRequerida };
}

function pesar(mRequerida: number) {
  let polvo = 0;
  while (polvo < mRequerida - 0.1) polvo = parseFloat((polvo + 0.1).toFixed(3));
  while (polvo < mRequerida - 0.003) polvo = parseFloat((polvo + 0.005).toFixed(3));
  return polvo;
}

function aforar(vTarget: number) {
  let agua = 0;
  while (agua < vTarget * 0.88) agua = parseFloat((agua + 1).toFixed(2));
  while (agua < vTarget - toleranciaAforo(vTarget) / 2) agua = parseFloat((agua + 0.05).toFixed(2));
  return agua;
}

const estado = (m: ReturnType<typeof generarMision>, polvo: number, agua: number) =>
  ({ mTarget: m.mTarget, vTarget: m.vTarget, sal: m.sal, matraz: { polvo, agua } }) as any;

describe('E2E Q5 — Preparación de Soluciones (simulación completa)', () => {
  it.each([
    ['NaCl 0.5 M / 250 mL', 0, 0.5, 250],
    ['CuSO4 0.3 M / 500 mL', 1, 0.3, 500],
    ['KMnO4 0.1 M / 100 mL (masa mínima)', 2, 0.1, 100],
    ['K2Cr2O7 0.25 M / 250 mL', 3, 0.25, 250],
  ])('%s — flujo completo exitoso', (_n, idx, mTarget, vTarget) => {
    const mision = generarMision(idx as number, mTarget as number, vTarget as number);
    // Pre-lab: el cálculo del alumno se acepta con ±8 %
    expect(Math.abs(parseFloat(mision.mRequerida.toFixed(2)) - mision.mRequerida) / mision.mRequerida).toBeLessThanOrEqual(0.08);
    const polvo = pesar(mision.mRequerida);
    expect(Math.abs(polvo - mision.mRequerida) / mision.mRequerida).toBeLessThan(0.05);
    const agua = aforar(mision.vTarget);
    expect(validarQ5(estado(mision, polvo, agua)).ok).toBe(true);
  });

  it('pasarse de la marca de aforo invalida la solución, aunque sea por 2 mL', () => {
    const m = generarMision(0, 0.5, 250);
    const v = validarQ5(estado(m, m.mRequerida, 252));
    expect(v.ok).toBe(false);
    expect(v.mensaje).toMatch(/marca/);
  });

  it('quedarse corto de la marca no está aforado', () => {
    const m = generarMision(0, 0.5, 250);
    expect(validarQ5(estado(m, m.mRequerida, 245)).ok).toBe(false);
  });

  it('masa insuficiente → fuera de ±5 % de molaridad', () => {
    const m = generarMision(0, 0.5, 250);
    expect(validarQ5(estado(m, m.mRequerida * 0.9, 250)).ok).toBe(false);
  });
});
