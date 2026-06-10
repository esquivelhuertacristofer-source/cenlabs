/**
 * Simulación E2E completa del ejercicio Q5 — Preparación de Soluciones
 * Recorre todo el flujo: semilla → pre-lab → pesaje → transferencia → aforo → validación
 */
import { validarQ5 } from '@/domain/quimica';

// ── Datos de sustancias (igual que quimicaSlice) ───────────────────────────────
const SUSTANCIAS = [
  { nombre: 'Cloruro de Sodio',      formula: 'NaCl',    pm: 58.443,  purity: 0.985 },
  { nombre: 'Sulfato de Cobre (II)', formula: 'CuSO4',   pm: 159.609, purity: 0.99  },
  { nombre: 'Permanganato de K',     formula: 'KMnO4',   pm: 158.034, purity: 0.98  },
  { nombre: 'Dicromato de K',        formula: 'K2Cr2O7', pm: 294.185, purity: 0.97  },
];
const VOLUMENES = [100, 250, 500];

// ── Helpers de cálculo ─────────────────────────────────────────────────────────
function generarMision(saltIdx: number, mTarget: number, vTarget: number) {
  const sal = SUSTANCIAS[saltIdx];
  const mRequerida = parseFloat(((mTarget * (vTarget / 1000) * sal.pm) / sal.purity).toFixed(3));
  return { sal, mTarget, vTarget, mRequerida };
}

function calcMolaridadReal(polvoEnMatraz: number, sal: typeof SUSTANCIAS[0], aguaML: number): number {
  const masaEfectiva = polvoEnMatraz * sal.purity;
  return (masaEfectiva / sal.pm) / (aguaML / 1000);
}

// ── SIMULACIÓN COMPLETA ────────────────────────────────────────────────────────
describe('E2E Q5 — Preparación de Soluciones (simulación completa)', () => {

  // Caso 1: NaCl 0.5 M en 250 mL (caso base)
  it('CASO 1: NaCl 0.5 M / 250 mL — flujo completo exitoso', () => {
    console.log('\n═══════════════════════════════════════════');
    console.log('  CASO 1: NaCl  0.5 M  250 mL');
    console.log('═══════════════════════════════════════════');

    const { sal, mTarget, vTarget, mRequerida } = generarMision(0, 0.5, 250);
    console.log(`Sustancia  : ${sal.nombre} (${sal.formula})`);
    console.log(`Misión     : ${mTarget} M en ${vTarget} mL`);
    console.log(`Masa req.  : ${mRequerida} g  (PM=${sal.pm}, pureza=${sal.purity*100}%)`);

    // ── PRE-LAB: alumno calcula ────────────────────────────────────────────────
    const calculoAlumno = parseFloat(mRequerida.toFixed(2)); // ±8% tolerado
    const errPorcentual = Math.abs(calculoAlumno - mRequerida) / mRequerida;
    console.log(`\nPRE-LAB → Alumno ingresa: ${calculoAlumno} g  (error: ${(errPorcentual*100).toFixed(1)}%)`);
    expect(errPorcentual).toBeLessThanOrEqual(0.08);
    console.log('PRE-LAB ✓  — cálculo aprobado');

    // ── PESAJE: simular adición de polvo en pasos ──────────────────────────────
    console.log('\nPESAJE ANALÍTICO:');
    let polvoBalanza = 0;
    const PASO_GRUESO = 0.05;
    const PASO_FINO   = 0.005;

    // Fase gruesa: hasta ~95% de mRequerida
    while (polvoBalanza < mRequerida * 0.95) {
      polvoBalanza = parseFloat((polvoBalanza + PASO_GRUESO).toFixed(3));
    }
    console.log(`  + Grueso (${PASO_GRUESO}g/tick) → ${polvoBalanza.toFixed(3)} g`);

    // Fase fina: ajuste hasta entrar en ±5%
    while (Math.abs(polvoBalanza - mRequerida) / mRequerida > 0.048) {
      polvoBalanza = parseFloat((polvoBalanza + PASO_FINO).toFixed(3));
    }
    console.log(`  + Fino   (${PASO_FINO}g/tick) → ${polvoBalanza.toFixed(3)} g`);

    const accuracyPesaje = (1 - Math.abs(polvoBalanza - mRequerida) / mRequerida) * 100;
    console.log(`  Precisión balanza: ${accuracyPesaje.toFixed(1)}%`);
    expect(Math.abs(polvoBalanza - mRequerida) / mRequerida).toBeLessThan(0.05);
    console.log('PESAJE ✓');

    // ── TRANSFERENCIA ──────────────────────────────────────────────────────────
    const polvoMatraz = polvoBalanza;
    console.log(`\nTRANSFERENCIA → polvo en matraz: ${polvoMatraz.toFixed(3)} g`);

    // ── AFORO: llenado rápido + goteo de precisión ─────────────────────────────
    console.log('\nAFORO:');
    let aguaML = 0;
    const umbralPrecision = vTarget * 0.88;

    // Llenado rápido hasta 88%
    while (aguaML < umbralPrecision) {
      aguaML = parseFloat((aguaML + 1).toFixed(1));
    }
    console.log(`  Llenado rápido (+1 mL/tick) → ${aguaML.toFixed(1)} mL`);

    // Goteo de precisión hasta 98–100.2%
    while (aguaML < vTarget * 0.99) {
      aguaML = parseFloat((aguaML + 0.1).toFixed(1));
    }
    // Verificación final: no sobre-dilución
    const sobreDilucion = aguaML > vTarget + 2;
    console.log(`  Goteo precisión (+0.1 mL/tick) → ${aguaML.toFixed(1)} mL`);
    expect(sobreDilucion).toBe(false);
    console.log(`  ¿Sobre-dilución? ${sobreDilucion ? '⚠ SÍ' : 'NO ✓'}`);

    // ── VALIDACIÓN FINAL ───────────────────────────────────────────────────────
    const mActual = calcMolaridadReal(polvoMatraz, sal, aguaML);
    const precision = (1 - Math.abs(mActual - mTarget) / mTarget) * 100;
    const stars = precision >= 99 ? 3 : precision >= 97 ? 2 : 1;

    console.log('\n─── RESULTADO FINAL ───────────────────────');
    console.log(`  M objetivo : ${mTarget.toFixed(3)} M`);
    console.log(`  M lograda  : ${mActual.toFixed(4)} M`);
    console.log(`  Error abs. : ${Math.abs(mActual - mTarget).toFixed(4)} M`);
    console.log(`  Precisión  : ${precision.toFixed(2)}%`);
    console.log(`  Estrellas  : ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);

    const storeState = {
      mTarget,
      sal,
      matraz: { polvo: polvoMatraz, agua: aguaML },
    };
    const isOk = validarQ5(storeState as any);
    console.log(`  validarQ5  : ${isOk ? '✅ APROBADO' : '❌ REPROBADO'}`);
    expect(isOk).toBe(true);
  });

  // Caso 2: CuSO4 0.3 M en 500 mL
  it('CASO 2: CuSO4 0.3 M / 500 mL — flujo completo exitoso', () => {
    console.log('\n═══════════════════════════════════════════');
    console.log('  CASO 2: CuSO4  0.3 M  500 mL');
    console.log('═══════════════════════════════════════════');

    const { sal, mTarget, vTarget, mRequerida } = generarMision(1, 0.3, 500);
    console.log(`Masa requerida: ${mRequerida} g`);

    let polvo = 0;
    while (polvo < mRequerida * 0.96) polvo = parseFloat((polvo + 0.05).toFixed(3));
    while (Math.abs(polvo - mRequerida) / mRequerida > 0.045) polvo = parseFloat((polvo + 0.005).toFixed(3));

    let agua = 0;
    while (agua < vTarget * 0.88) agua = parseFloat((agua + 1).toFixed(1));
    while (agua < vTarget * 0.99)  agua = parseFloat((agua + 0.1).toFixed(1));

    const mActual = calcMolaridadReal(polvo, sal, agua);
    console.log(`Polvo: ${polvo.toFixed(3)} g | Agua: ${agua.toFixed(1)} mL | M: ${mActual.toFixed(4)}`);

    const isOk = validarQ5({ mTarget, sal, matraz: { polvo, agua } } as any);
    console.log(`validarQ5: ${isOk ? '✅ APROBADO' : '❌ REPROBADO'}`);
    expect(isOk).toBe(true);
  });

  // Caso 3: KMnO4 0.1 M en 100 mL (masa muy pequeña — caso límite)
  it('CASO 3: KMnO4 0.1 M / 100 mL — masa mínima, límite de precisión', () => {
    console.log('\n═══════════════════════════════════════════');
    console.log('  CASO 3: KMnO4  0.1 M  100 mL');
    console.log('═══════════════════════════════════════════');

    const { sal, mTarget, vTarget, mRequerida } = generarMision(2, 0.1, 100);
    console.log(`Masa requerida: ${mRequerida} g`);

    // Con masa pequeña hay que ir despacio desde el principio
    let polvo = 0;
    while (polvo < mRequerida * 0.94) polvo = parseFloat((polvo + 0.05).toFixed(3));
    while (Math.abs(polvo - mRequerida) / mRequerida > 0.045) polvo = parseFloat((polvo + 0.005).toFixed(3));

    let agua = 0;
    while (agua < vTarget * 0.88) agua = parseFloat((agua + 1).toFixed(1));
    while (agua < vTarget * 0.99)  agua = parseFloat((agua + 0.1).toFixed(1));

    const mActual = calcMolaridadReal(polvo, sal, agua);
    console.log(`Polvo: ${polvo.toFixed(3)} g | Agua: ${agua.toFixed(1)} mL | M: ${mActual.toFixed(4)}`);

    const isOk = validarQ5({ mTarget, sal, matraz: { polvo, agua } } as any);
    console.log(`validarQ5: ${isOk ? '✅ APROBADO' : '❌ REPROBADO'}`);
    expect(isOk).toBe(true);
  });

  // Caso 4: sobre-dilución severa → debe fallar
  // NOTA: +10 mL en 250 mL solo cambia M en ~0.02 (dentro de ±0.05).
  // Para fallar la validación se necesita una dilución que baje M > 0.05.
  // +60 mL → M_real ≈ 0.403 M, error = 0.097 M > 0.05 → falla correctamente.
  it('CASO 4: sobre-dilución severa (+60 mL) → validarQ5 debe retornar false', () => {
    console.log('\n═══════════════════════════════════════════');
    console.log('  CASO 4: sobre-dilución severa (error esperado)');
    console.log('═══════════════════════════════════════════');

    const { sal, mTarget, vTarget, mRequerida } = generarMision(0, 0.5, 250);
    const polvo = mRequerida;
    const agua = vTarget + 60; // +60 mL → M cae a ~0.40 M, fuera de tolerancia

    const mActual = calcMolaridadReal(polvo, sal, agua);
    const error = Math.abs(mActual - mTarget);
    console.log(`Agua excedida: ${agua} mL (+60 mL) | M real: ${mActual.toFixed(4)} M`);
    console.log(`Error: ${error.toFixed(4)} M — tolerancia: 0.05 M`);
    console.log(`Error supera tolerancia: ${error > 0.05 ? 'SÍ ✓' : 'NO'}`);

    // Nota pedagógica: la UI guarda en +2 mL, pero el dominio solo rechaza
    // cuando la dilución es suficiente para salir de ±0.05 M
    const isOk = validarQ5({ mTarget, sal, matraz: { polvo, agua } } as any);
    console.log(`validarQ5: ${isOk ? '✅ (inesperado)' : '❌ RECHAZADO — correcto'}`);
    expect(isOk).toBe(false);
  });

  // Caso 5: masa muy corta → debe fallar
  it('CASO 5: masa insuficiente → validarQ5 debe retornar false', () => {
    const { sal, mTarget, vTarget, mRequerida } = generarMision(0, 0.5, 250);
    const polvo = mRequerida * 0.5; // solo la mitad
    const isOk = validarQ5({ mTarget, sal, matraz: { polvo, agua: vTarget } } as any);
    console.log(`Masa cortada: ${polvo.toFixed(3)} g → ${isOk ? '✅ (inesperado)' : '❌ RECHAZADO — correcto'}`);
    expect(isOk).toBe(false);
  });
});
