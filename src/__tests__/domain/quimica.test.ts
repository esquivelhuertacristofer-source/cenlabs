import {
  validarQ1, validarQ2, validarQ3, validarQ4, validarQ5,
  validarQ6, validarQ7, validarQ8, validarQ9, validarQ10,
  presionIdeal, analizarLimitante, generarMasasLimitante, toleranciaExceso,
  solubilidadA, TABLAS_SOLUBILIDAD, disueltaEnCaliente,
  phTitulacion, fraccionNO2, colorMezclaNO2, lecturaVoltimetro,
  tBurbuja, yEquilibrio, pasoDestilacion, aforoCorrecto, toleranciaAforo,
} from '@/domain/quimica';
import { useSimuladorStore } from '@/store/simuladorStore';

const st = () => useSimuladorStore.getState();

// Generador pseudoaleatorio reproducible para los barridos de semillas.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  it('fails with wrong element (wrong Z)', () => {
    const result = validarQ1({ ...base, protones: 7, neutrones: 7, electrones: 7 } as any);
    expect(result.isOk).toBe(false);
    expect(result.message).toMatch(/Elemento incorrecto/);
  });
  it('fails with wrong isotope (wrong A)', () => {
    const result = validarQ1({ ...base, protones: 6, neutrones: 6, electrones: 6 } as any);
    expect(result.message).toMatch(/Masa atómica/);
  });
  it('handles ion target (O²⁻): needs 10 electrons', () => {
    const ion = { targetZ: 8, targetA: 16, targetCharge: -2, intentos: 0 };
    expect(validarQ1({ ...ion, protones: 8, neutrones: 8, electrones: 10 } as any).isOk).toBe(true);
  });
  it('el store limita Z y e⁻ a 10 (catálogo hasta el neón, configuración hasta 2p)', () => {
    st().entrarLab('quimica-1');
    st().setParticulas(14, 3, 15);
    expect(st().particulas.protones).toBe(10);
    expect(st().particulas.electrones).toBe(10);
  });
});

// ── Q2 Gases Ideales ──────────────────────────────────────────────────────────
describe('validarQ2', () => {
  it('true when P matches pTarget within 0.1', () => {
    expect(validarQ2({ P: 3.5, pTarget: 3.5, isExploded: false } as any)).toBe(true);
  });
  it('false when diff = 0.1', () => {
    expect(validarQ2({ P: 3.6, pTarget: 3.5, isExploded: false } as any)).toBe(false);
  });
  it('false when exploded even if P matches', () => {
    expect(validarQ2({ P: 3.5, pTarget: 3.5, isExploded: true } as any)).toBe(false);
  });

  it('500 semillas: el estado inicial no aprueba y existe (T, V) en el rango de los controles que sí', () => {
    const rnd = mulberry32(2);
    for (let k = 0; k < 500; k++) {
      const pTarget = parseFloat((1.5 + rnd() * 4.5).toFixed(2));
      const n = 0.406;
      expect(Math.abs(presionIdeal(n, 300, 10) - pTarget)).toBeGreaterThanOrEqual(0.1);
      let existe = false;
      for (let T = 100; T <= 1000 && !existe; T += 10) {
        for (let V = 2; V <= 15.001 && !existe; V += 0.1) {
          const P = presionIdeal(n, T, V);
          if (P <= 7 && Math.abs(P - pTarget) < 0.1) existe = true;
        }
      }
      expect(existe).toBe(true);
    }
  });

  it('reiniciar la cámara tras explotar conserva el objetivo', () => {
    st().entrarLab('quimica-2');
    const objetivo = st().gases.pTarget;
    st().updateGases(1000, 2, 0.406);
    expect(st().gases.isExploded).toBe(true);
    st().resetGases();
    expect(st().gases.isExploded).toBe(false);
    expect(st().gases.pTarget).toBe(objetivo);
  });
});

// ── Q3 Balanceo de Ecuaciones ─────────────────────────────────────────────────
describe('Q3 balanceo', () => {
  it('validarQ3: 4 reacciones completadas', () => {
    expect(validarQ3({ reaccionesCompletadas: ['a', 'b', 'c', 'd'] } as any)).toBe(true);
    expect(validarQ3({ reaccionesCompletadas: ['a', 'b', 'c'] } as any)).toBe(false);
    expect(validarQ3({} as any)).toBe(false);
  });

  const aplicar = (coefs: number[]) => coefs.forEach((c, i) => st().setCoeficiente(i, c));

  it('ninguna reacción empieza balanceada con todos los coeficientes en 1', () => {
    st().entrarLab('quimica-3');
    const reacciones = st().balanceo.reacciones;
    for (let i = 0; i < reacciones.length; i++) {
      useSimuladorStore.setState({ balanceo: { ...st().balanceo, reaccionesCompletadas: reacciones.slice(0, i).map((r: any) => r.id) } });
      st().setReaccion(i);
      expect(st().balanceo.reaccionActual).toBe(i);
      expect(st().balanceo.isBalanced).toBe(false);
    }
  });

  it('solo los coeficientes mínimos completan la reacción; múltiplos no', () => {
    st().entrarLab('quimica-3');
    const correctos = st().balanceo.reacciones[0].coeficientesCorrectos as number[];
    aplicar(correctos.map((c) => c * 2));
    expect(st().balanceo.isBalanced).toBe(true);
    expect(st().balanceo.reaccionesCompletadas).toHaveLength(0);
    aplicar(correctos);
    expect(st().balanceo.reaccionesCompletadas).toEqual([st().balanceo.reacciones[0].id]);
  });

  it('recorrer las reacciones con sus coeficientes mínimos aprueba la práctica; recién abierta no', () => {
    st().entrarLab('quimica-3');
    expect(st().validarLab('quimica-3').ok).toBe(false);
    const reacciones = st().balanceo.reacciones;
    for (let i = 0; i < 4; i++) {
      st().setReaccion(i);
      aplicar(reacciones[i].coeficientesCorrectos);
    }
    expect(st().validarLab('quimica-3').ok).toBe(true);
  });

  it('la masa se conserva en todas las reacciones balanceadas (Lavoisier)', () => {
    st().entrarLab('quimica-3');
    const reacciones = st().balanceo.reacciones;
    for (let i = 0; i < reacciones.length; i++) {
      useSimuladorStore.setState({ balanceo: { ...st().balanceo, reaccionesCompletadas: reacciones.map((r: any) => r.id) } });
      st().setReaccion(i);
      aplicar(reacciones[i].coeficientesCorrectos);
      expect(Math.abs(st().balanceo.masaReactivos - st().balanceo.masaProductos)).toBeLessThan(0.01);
    }
  });
});

// ── Q4 Reactivo Limitante ─────────────────────────────────────────────────────
describe('Q4 reactivo limitante', () => {
  const agua = { reactivos: [{ formula: 'H2', molar: 2.016, coef: 2 }, { formula: 'O2', molar: 31.998, coef: 1 }], productos: [{ formula: 'H2O', molar: 18.015, coef: 2 }] };

  it('analizarLimitante: 4 g H₂ y 16 g O₂ → O₂ limita y sobran 1.984 g de H₂', () => {
    const a = analizarLimitante(agua, [4, 16]);
    expect(a.limitingIdx).toBe(1);
    expect(a.excessMass).toBeCloseTo(4 - 2 * (16 / 31.998) * 2.016, 3);
    expect(a.theoreticalYield).toBeCloseTo(2 * (16 / 31.998) * 18.015, 3);
  });

  const estado = (masas: number[], limitanteIdx: number | null, exceso: number | null) => ({
    reaccionActual: 0, reacciones: [agua], inputMasses: masas, respuesta: { limitanteIdx, exceso },
  }) as any;

  it('sin respuesta no aprueba; con respuesta correcta sí; el panel no puede pasarse sus propios resultados', () => {
    expect(validarQ4(estado([4, 16], null, null)).ok).toBe(false);
    const a = analizarLimitante(agua, [4, 16]);
    expect(validarQ4(estado([4, 16], a.limitingIdx, a.excessMass)).ok).toBe(true);
    expect(validarQ4(estado([4, 16], 0, a.excessMass)).ok).toBe(false);
    expect(validarQ4(estado([4, 16], 1, a.excessMass * 1.1)).ok).toBe(false);
  });

  it('500 semillas por reacción: limitante claro, la respuesta calculada aprueba y las equivocadas no', () => {
    st().entrarLab('quimica-4');
    const reacciones = st().limitante.reacciones;
    const rnd = mulberry32(4);
    for (const reac of reacciones) {
      for (let k = 0; k < 500; k++) {
        const masas = generarMasasLimitante(reac, rnd);
        const a = analizarLimitante(reac, masas);
        expect(a.ambiguo).toBe(false);
        expect(masas.every((m) => m >= 0.5 && m <= 150)).toBe(true);
        const e = { reaccionActual: 0, reacciones: [reac], inputMasses: masas } as any;
        expect(validarQ4({ ...e, respuesta: { limitanteIdx: null, exceso: null } }).ok).toBe(false);
        expect(validarQ4({ ...e, respuesta: { limitanteIdx: a.limitingIdx, exceso: parseFloat(a.excessMass.toFixed(2)) } }).ok).toBe(true);
        expect(validarQ4({ ...e, respuesta: { limitanteIdx: 1 - a.limitingIdx, exceso: a.excessMass } }).ok).toBe(false);
        expect(validarQ4({ ...e, respuesta: { limitanteIdx: a.limitingIdx, exceso: a.excessMass + 3 * toleranciaExceso(a.excessMass) } }).ok).toBe(false);
      }
    }
  });

  it('el lab recién abierto no aprueba y la respuesta registrada en el store sí', () => {
    st().entrarLab('quimica-4');
    expect(st().validarLab('quimica-4').ok).toBe(false);
    const l = st().limitante;
    const a = analizarLimitante(l.reacciones[l.reaccionActual], l.inputMasses);
    st().setRespuestaP4(a.limitingIdx, parseFloat(a.excessMass.toFixed(2)));
    expect(st().validarLab('quimica-4').ok).toBe(true);
  });
});

// ── Q5 Preparación de Soluciones ──────────────────────────────────────────────
describe('Q5 soluciones', () => {
  const s = (polvo: number, agua: number) => ({
    mTarget: 0.5, vTarget: 250, sal: { pm: 58.443, purity: 1.0 }, matraz: { polvo, agua },
  }) as any;

  it('aprueba con ±5 % de molaridad y el aforo exacto', () => {
    expect(validarQ5(s(7.305, 250)).ok).toBe(true);
    expect(validarQ5(s(7.305 * 1.04, 250)).ok).toBe(true);
    expect(validarQ5(s(7.305 * 1.06, 250)).ok).toBe(false);
  });
  it('sin aforar, o pasado de la marca, no aprueba', () => {
    expect(validarQ5(s(7.305, 240)).ok).toBe(false);
    expect(validarQ5(s(7.305, 251)).ok).toBe(false);
    expect(aforoCorrecto(250.4, 250)).toBe(true);
  });

  it('la balanza acumula lo que se añade (antes se quedaba en 0.05 g)', () => {
    st().entrarLab('quimica-5');
    st().addPolvo(0.05);
    expect(st().soluciones.balanza.polvo).toBe(0); // sin tara no se pesa
    st().toggleTara();
    for (let i = 0; i < 100; i++) st().addPolvo(0.05);
    expect(st().soluciones.balanza.polvo).toBeCloseTo(5, 3);
    st().addPolvo(-0.005);
    expect(st().soluciones.balanza.polvo).toBeCloseTo(4.995, 3);
  });

  it('500 semillas: recién abierto no aprueba; pesar, transferir y aforar con los controles sí', () => {
    for (let k = 0; k < 500; k++) {
      st().entrarLab('quimica-5');
      expect(st().validarLab('quimica-5').ok).toBe(false);
      const { mRequerida, vTarget } = st().soluciones;
      st().toggleTara();
      // mantener «+ Grueso» (0.1 g por paso) hasta quedar a menos de 0.1 g; luego «+ Fino»
      st().addPolvo(Math.floor((mRequerida - 0.1) * 10) / 10);
      while (st().soluciones.balanza.polvo < mRequerida - 0.003) st().addPolvo(0.005);
      st().transferirPolvo();
      // llenado rápido (1 mL) hasta el 88 %, goteo (0.1 mL) hasta la marca
      let agua = 0;
      while (agua < vTarget * 0.88) agua += 1;
      while (agua < vTarget - toleranciaAforo(vTarget) / 2) agua += 0.1;
      st().setAgua(agua);
      expect(st().validarLab('quimica-5').ok).toBe(true);
    }
  });
});

// ── Q6 Solubilidad ────────────────────────────────────────────────────────────
describe('Q6 solubilidad', () => {
  it('tablas CRC: KNO₃ 31.6 g a 20 °C y 246 g a 100 °C; interpolación lineal', () => {
    expect(solubilidadA(TABLAS_SOLUBILIDAD.kno3, 20)).toBeCloseTo(31.6, 5);
    expect(solubilidadA(TABLAS_SOLUBILIDAD.kno3, 100)).toBeCloseTo(246, 5);
    expect(solubilidadA(TABLAS_SOLUBILIDAD.kno3, 25)).toBeCloseTo((31.6 + 45.8) / 2, 5);
    expect(solubilidadA(TABLAS_SOLUBILIDAD.nacl, 0)).toBeCloseTo(35.7, 5);
  });
  it('disueltaEnCaliente exige más sal de la que admite el agua a 20 °C y toda disuelta', () => {
    expect(disueltaEnCaliente(TABLAS_SOLUBILIDAD.kno3, 60, 50)).toBe(true);
    expect(disueltaEnCaliente(TABLAS_SOLUBILIDAD.kno3, 20, 50)).toBe(false); // cabe a 20 °C
    expect(disueltaEnCaliente(TABLAS_SOLUBILIDAD.kno3, 100, 50)).toBe(false); // no se disuelve toda
  });

  const correr = (seg: number) => { for (let i = 0; i < seg * 4; i++) st().updateTemperaturaP6(0.25); };

  it('añadir sal a temperatura ambiente y enfriar NO basta: hay que disolver en caliente', () => {
    st().entrarLab('quimica-6');
    st().addSalSolubilidad(60);
    st().setUbicacionVaso('hielo');
    correr(40);
    expect(st().validarLab('quimica-6').ok).toBe(false);
  });

  it.each([0, 1, 2, 3])('sustancia %i: disolver en caliente y enfriar en hielo aprueba', (idx) => {
    st().entrarLab('quimica-6');
    expect(st().validarLab('quimica-6').ok).toBe(false);
    st().setSustanciaSolubilidad(idx);
    const tabla = st().solubilidad.sustancias[idx].tabla;
    // con los botones de +1/+5/+20 g: un poco más de lo que cabe a 20 °C y que quepa a 90 °C
    const objetivo = Math.min(solubilidadA(tabla, 90), solubilidadA(tabla, 20) + 25);
    let sal = 0;
    while (sal + 1 <= objetivo && sal <= solubilidadA(tabla, 20)) sal += 1;
    while (sal + 1 <= objetivo && sal < solubilidadA(tabla, 20) + 1) sal += 1;
    st().addSalSolubilidad(sal);
    st().setUbicacionVaso('parrilla');
    correr(30);
    expect(st().solubilidad.disueltoEnCaliente).toBe(true);
    st().setUbicacionVaso('hielo');
    correr(40);
    expect(st().validarLab('quimica-6').ok).toBe(true);
  });
});

// ── Q7 Titulación Ácido-Base ──────────────────────────────────────────────────
describe('Q7 titulación', () => {
  it('pH: inicial = −log Ca, 7 en la equivalencia y básico después', () => {
    expect(phTitulacion(0.1, 25, 0.1, 0)).toBeCloseTo(1, 5);
    expect(phTitulacion(0.1, 25, 0.1, 25)).toBe(7);
    expect(phTitulacion(0.1, 25, 0.1, 26)).toBeGreaterThan(11);
  });

  it('500 semillas: recién abierto no aprueba; titular hasta el viraje y calcular Ca sí', () => {
    for (let k = 0; k < 500; k++) {
      st().entrarLab('quimica-7');
      expect(st().validarLab('quimica-7').ok).toBe(false);
      st().togglePurgaP7();
      st().toggleIndicadorP7();
      // a chorro (válvula abierta) mientras el pH sigue claramente ácido, luego gota a gota (0.05 mL)
      let chorro = 0;
      while (phTitulacion(st().titulacion.ca, 25, 0.1, chorro + 2) < 4) chorro += 1;
      st().addDropNaOH(chorro);
      while (phTitulacion(st().titulacion.ca, 25, 0.1, st().titulacion.volumenBase) < 8.2) st().addDropNaOH(0.05);
      const t = st().titulacion;
      expect(t.volumenBase).toBeLessThanOrEqual(50);
      st().setRespuestaP7(parseFloat(((0.1 * t.volumenBase) / 25).toFixed(4)));
      expect(st().validarLab('quimica-7').ok).toBe(true);
    }
  });

  it('una respuesta 3 % lejos, o sin indicador, no aprueba', () => {
    const t = { ca: 0.1, va: 25, cb: 0.1, volumenBase: 25.05, purgada: true, indicador: true, respuestaCa: 0.103 } as any;
    expect(validarQ7(t).ok).toBe(false);
    expect(validarQ7({ ...t, respuestaCa: 0.1002 }).ok).toBe(true);
    expect(validarQ7({ ...t, respuestaCa: 0.1, indicador: false }).ok).toBe(false);
  });
});

// ── Q8 Equilibrio Químico ─────────────────────────────────────────────────────
describe('Q8 equilibrio N₂O₄ ⇌ 2NO₂', () => {
  it('van \'t Hoff: más NO₂ al calentar; a 20 °C la mezcla ya es ámbar, no incolora', () => {
    expect(fraccionNO2(0)).toBeLessThan(fraccionNO2(20));
    expect(fraccionNO2(20)).toBeLessThan(fraccionNO2(80));
    expect(colorMezclaNO2(0)).toBe('palido');
    expect(colorMezclaNO2(20)).toBe('ambar');
    expect(colorMezclaNO2(80)).toBe('cafe');
  });

  const esperar = () => { for (let i = 0; i < 120; i++) st().updateTemperaturaP8(0.25); };

  it('cualquier asignación de jeringas a baños sirve (no hay jeringa «correcta»)', () => {
    const banos = ['hielo', 'mesa', 'caliente'] as const;
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const p of perms) {
      st().entrarLab('quimica-8');
      expect(st().validarLab('quimica-8').ok).toBe(false);
      p.forEach((b, i) => st().setUbicacionJeringa(i + 1, banos[b]));
      esperar();
      for (const j of st().equilibrio.jeringas) st().setObservacionP8(j.id, colorMezclaNO2(j.temp));
      expect(st().validarLab('quimica-8').ok).toBe(true);
    }
  });

  it('observaciones equivocadas, o sin esperar el equilibrio térmico, no aprueban', () => {
    st().entrarLab('quimica-8');
    st().setUbicacionJeringa(1, 'hielo');
    st().setUbicacionJeringa(2, 'caliente');
    st().setObservacionP8(1, 'palido');
    st().setObservacionP8(2, 'cafe');
    st().setObservacionP8(3, 'ambar');
    expect(validarQ8(st().equilibrio).ok).toBe(false); // aún a 20 °C
    esperar();
    expect(validarQ8(st().equilibrio).ok).toBe(true);
    st().setObservacionP8(3, 'palido'); // «incoloro» a 20 °C es falso
    expect(validarQ8(st().equilibrio).ok).toBe(false);
  });
});

// ── Q9 Celda Galvánica ────────────────────────────────────────────────────────
describe('Q9 celda galvánica', () => {
  it('el voltímetro marca con signo: E°(der) − E°(izq)', () => {
    expect(lecturaVoltimetro('Zn', 'Cu')).toBeCloseTo(1.10, 5);
    expect(lecturaVoltimetro('Cu', 'Zn')).toBeCloseTo(-1.10, 5);
  });

  it('todas las parejas: armar con el ánodo en COM e identificarlo aprueba; al revés o mal identificado, no', () => {
    const metales = ['Zn', 'Cu', 'Ag', 'Mg'];
    for (const a of metales) for (const b of metales) {
      if (a === b) continue;
      st().entrarLab('quimica-9');
      useSimuladorStore.setState({ celda: { ...st().celda, seedMetales: [a, b] } });
      expect(st().validarLab('quimica-9').ok).toBe(false);
      const [anodo, catodo] = lecturaVoltimetro(a, b) > 0 ? [a, b] : [b, a];
      st().setMetalVaso('izq', catodo);
      st().setMetalVaso('der', anodo);
      st().togglePuenteSalino();
      st().toggleCables();
      expect(st().celda.voltaje).toBeLessThan(0);
      st().setRespuestaP9(anodo, catodo);
      expect(validarQ9(st().celda).ok).toBe(false); // voltímetro en negativo
      st().setMetalVaso('izq', anodo);
      st().setMetalVaso('der', catodo);
      expect(st().celda.voltaje).toBeGreaterThan(0);
      st().setRespuestaP9(catodo, anodo);
      expect(validarQ9(st().celda).ok).toBe(false); // mal identificado
      st().setRespuestaP9(anodo, catodo);
      expect(st().validarLab('quimica-9').ok).toBe(true);
    }
  });
});

// ── Q10 Destilación Fraccionada ────────────────────────────────────────────────
describe('Q10 destilación', () => {
  it('equilibrio etanol–agua (Perry): azeótropo y puntos de ebullición', () => {
    expect(tBurbuja(0)).toBe(100);
    expect(tBurbuja(0.8943)).toBeCloseTo(78.15, 2);
    expect(yEquilibrio(0.1)).toBeGreaterThan(0.1);
  });

  const destilar = (manta: number, maxSeg = 900) => {
    st().entrarLab('quimica-10');
    st().setCalorManta(manta);
    for (let t = 0; t < maxSeg && st().destilacion.volDestilado < 50; t += 0.25) st().updateDestilacion(0.25);
    return st().destilacion;
  };

  it('recién abierto no aprueba', () => {
    st().entrarLab('quimica-10');
    expect(st().validarLab('quimica-10').ok).toBe(false);
  });

  it('calentar apenas por encima de la ebullición da destilado ≥ 85 % v/v y aprueba', () => {
    const d = destilar(88);
    expect(d.volDestilado).toBeGreaterThanOrEqual(50);
    expect(d.purezaDestilado).toBeGreaterThanOrEqual(85);
    expect(d.tempMezcla).toBeLessThan(90); // el líquido no pasa de su punto de burbuja
    expect(st().validarLab('quimica-10').ok).toBe(true);
  });

  it('calentar a fondo inunda la columna: destilado más pobre que no aprueba', () => {
    const d = destilar(150);
    expect(d.volDestilado).toBeGreaterThanOrEqual(50);
    expect(d.purezaDestilado).toBeLessThan(85);
    expect(validarQ10(d).ok).toBe(false);
  });

  it('la pureza baja al calentar más (no al revés)', () => {
    const suave = destilar(86).purezaDestilado;
    const medio = destilar(100).purezaDestilado;
    const fuerte = destilar(140).purezaDestilado;
    expect(suave).toBeGreaterThan(medio);
    expect(medio).toBeGreaterThan(fuerte);
  });

  it('pasoDestilacion conserva el volumen total', () => {
    let d = { ...st().destilacion, calorManta: 95 };
    for (let i = 0; i < 400; i++) d = pasoDestilacion(d, 0.25);
    expect(d.volEtanolMatraz + d.volAguaMatraz + d.volDestilado).toBeCloseTo(200, 6);
  });
});
