/**
 * B2 · Transporte celular — la ciencia de `simuladores/bio02/transporte.ts`.
 *
 *  - Presión osmótica de van 't Hoff contra valores de tabla (NaCl 0,15 M a 37 °C ≈ 7,6 atm;
 *    1 Osm/L a 0 °C = 22,41 atm, el volumen molar del gas ideal).
 *  - Fick: J = −D·dC/dx, P = K·D/L; una difusión numérica independiente (FTCS) llega al
 *    perfil lineal y al flujo P·ΔC; dos compartimentos se igualan con e^(−t·P·A/V).
 *  - Michaelis–Menten y Hill: mitad de V_max en K_m, recta de Lineweaver–Burk, saturación.
 *  - GLUT1: pasivo (nunca contra el gradiente), cero en el equilibrio, y el transportador que
 *    dibuja la escena (giros a 2·k_cat, carga con S/(K_m+S)) da en promedio el flujo de la fórmula.
 *  - Bomba Na⁺/K⁺: 3 Na⁺ : 2 K⁺ : 1 ATP, se para sin ATP, mitad en K_ATP, flujo de Na⁺ del
 *    glóbulo rojo (~2 mmol/(L·h)) y su ΔG menor que el que aporta el ATP.
 *  - Hemoglobina: Hill con P50 = 26,8 mmHg (venosa 75 %, arterial 97 %) y su inversa.
 *  - Ósmosis: equilibrio de Boyle–van 't Hoff (V/V₀ = Osm₀/tonicidad), glucosa igualada,
 *    O₂ cargado; el reto converge al MISMO volumen que el juez del dominio.
 *  - Forma del glóbulo rojo: la malla DIBUJADA encierra el volumen del modelo (suma de
 *    tetraedros), con el disco de reposo de 90 fL y la esfera de igual área al hincharse.
 */
import {
  R_ATM, presionOsmotica, presionVanTHoff, flujoFick, permeabilidad, flujoMembrana, perfilMembrana, difusionMembrana,
  equilibrioFick, mm, hill, glut1, kcatGlut1, GLUT1, bomba, BOMBA, vmaxBomba, energiaBomba, saturacionHb, p50,
  contenidoO2, pO2DeContenido, OXIGENO, ERITROCITO, N_IMPERMEANTE, estadoTransferencia, avanzarCelula, leerCelula,
  volumenEquilibrio, tonicidad, MEDIO_INICIAL, lpCelula, lpRetoPorcentaje, pasoVolumenReto, enCaja, PAQUETE, PARCHE,
  CAMARA_LENTA, N_A, type Medio,
} from '@/components/simuladores/bio02/transporte';
import { crearGeoEritrocito, formarEritrocito, medirMalla, AREA_REPOSO, R_E, rangoVolumen } from '@/components/simuladores/bio02/forma';
import { volumenEquilibrioB2, osmolaridadMedioB2, UMBRAL_LISIS_B2, VMAX_VEGETAL_B2, rngConSemilla } from '@/domain/biologia';

describe('presión osmótica (van ’t Hoff)', () => {
  it('NaCl 0,15 M a 37 °C con i = 2 da ≈ 7,6 atm', () => {
    const pi = presionVanTHoff(2, 0.15, 37);
    expect(pi).toBeCloseTo(7.635, 2);
    expect(pi).toBeGreaterThan(7.5);
    expect(pi).toBeLessThan(7.7);
  });
  it('1 Osm/L a 0 °C es el volumen molar del gas ideal: 22,41 atm', () => {
    expect(presionOsmotica(1, 0)).toBeCloseTo(22.414, 3);
  });
  it('es lineal en la osmolaridad y en la temperatura absoluta', () => {
    expect(presionOsmotica(0.6, 25) / presionOsmotica(0.3, 25)).toBeCloseTo(2, 12);
    expect(presionOsmotica(0.3, 37) / presionOsmotica(0.3, 0)).toBeCloseTo(310.15 / 273.15, 12);
    expect(presionOsmotica(0.29, 37)).toBeCloseTo(0.29 * R_ATM * 310.15, 12);
  });
});

describe('Fick', () => {
  it('J = −D·dC/dx: el flujo baja por el gradiente', () => {
    expect(flujoFick(2e-9, -100)).toBeCloseTo(2e-7, 18);
    expect(flujoFick(2e-9, 100)).toBeLessThan(0);
  });
  it('P = K·D/L y el perfil dentro de la membrana es lineal entre K·C_fuera y K·C_dentro', () => {
    const D = 1e-6, K = 0.02, L = 4e-7;
    expect(permeabilidad(D, K, L)).toBeCloseTo(0.05, 12);
    expect(perfilMembrana(10, 2, K, L, 0)).toBeCloseTo(0.2, 12);
    expect(perfilMembrana(10, 2, K, L, L)).toBeCloseTo(0.04, 12);
    expect(perfilMembrana(10, 2, K, L, L / 2)).toBeCloseTo(0.12, 12);
    // el flujo de Fick con el gradiente del perfil es el de la membrana
    const dCdx = (perfilMembrana(10, 2, K, L, L) - perfilMembrana(10, 2, K, L, 0)) / L;
    expect(flujoFick(D, dCdx)).toBeCloseTo(flujoMembrana(permeabilidad(D, K, L), 10, 2), 9);
  });
  it('la difusión numérica (FTCS) llega al perfil lineal y a J = P·ΔC', () => {
    const D = 1e-6, K = 0.5, L = 1e-4;
    const { perfil, flujo } = difusionMembrana(D, K, L, 8, 1, 30 * (L * L) / D);
    const P = permeabilidad(D, K, L);
    expect(Math.abs(flujo - flujoMembrana(P, 8, 1)) / flujoMembrana(P, 8, 1)).toBeLessThan(2e-3);
    perfil.forEach((c, i) => expect(Math.abs(c - perfilMembrana(8, 1, K, L, (i / (perfil.length - 1)) * L))).toBeLessThan(1e-3 * K * 8));
  });
  it('dos compartimentos se igualan con τ = V/(P·A)', () => {
    const P = 2e-4, A = 1.4e-6, V = 9e-11, cOut = 5;
    const tau = V / (P * A);
    expect(equilibrioFick(0, cOut, P, A, V, tau)).toBeCloseTo(cOut * (1 - Math.exp(-1)), 12);
    // integración independiente (Euler fino) de dC/dt = P·A/V·(C_out − C)
    let c = 0; const h = tau / 20000;
    for (let i = 0; i < 40000; i++) c += h * (P * A / V) * (cOut - c);
    expect(c).toBeCloseTo(equilibrioFick(0, cOut, P, A, V, 2 * tau), 3);
  });
});

describe('Michaelis–Menten y Hill', () => {
  it('v(K_m) = V_max/2, saturación y Lineweaver–Burk', () => {
    expect(mm(80, 3, 3)).toBeCloseTo(40, 12);
    expect(mm(80, 3, 3000)).toBeGreaterThan(0.999 * 80);
    expect(mm(80, 3, 0)).toBe(0);
    // 1/v = (K_m/V_max)·(1/S) + 1/V_max  (recta exacta)
    const pts = [0.5, 1, 2, 5, 10].map((s) => [1 / s, 1 / mm(80, 3, s)]);
    for (const [x, y] of pts) expect(y).toBeCloseTo((3 / 80) * x + 1 / 80, 12);
  });
  it('Hill: mitad en K, más empinada con n', () => {
    expect(hill(1, 10, 3, 10)).toBeCloseTo(0.5, 12);
    expect(hill(1, 10, 3, 20)).toBeGreaterThan(hill(1, 10, 1, 20));
  });
});

describe('GLUT1 (difusión facilitada)', () => {
  it('es pasivo: neto 0 con S igual a ambos lados y siempre a favor del gradiente', () => {
    expect(glut1(5, 5, 37).neto).toBeCloseTo(0, 12);
    for (const so of [0, 0.5, 2, 5, 20, 100]) for (const si of [0, 1, 5, 30]) {
      const n = glut1(so, si, 37).neto;
      if (so > si) expect(n).toBeGreaterThan(0); else if (so < si) expect(n).toBeLessThan(0); else expect(n).toBeCloseTo(0, 12);
    }
  });
  it('se satura en k_cat y gira a 2·k_cat', () => {
    expect(glut1(3, 0, 37).entra).toBeCloseTo(GLUT1.kcat37 / 2, 9);
    expect(glut1(1e5, 0, 37).entra).toBeGreaterThan(0.9999 * GLUT1.kcat37);
    expect(glut1(5, 0, 37).giros).toBeCloseTo(2 * kcatGlut1(37), 12);
    expect(kcatGlut1(27)).toBeCloseTo(GLUT1.kcat37 / GLUT1.q10, 9);
  });
  it('el transportador de la escena (giros con carga aleatoria) promedia el flujo de la fórmula', () => {
    const rnd = rngConSemilla(2026);
    const so = 5, si = 1.5, g = glut1(so, si, 37);
    let lado = 1, entran = 0, salen = 0;
    const giros = 400000;
    for (let i = 0; i < giros; i++) {
      // gira desde la cara en la que está; lleva glucosa con la ocupación de esa cara
      if (lado > 0) { if (rnd() < g.pFuera) entran++; } else if (rnd() < g.pDentro) salen++;
      lado = -lado;
    }
    const t = giros / g.giros;
    expect((entran - salen) / t).toBeCloseTo(g.neto, -1);
    expect(Math.abs((entran - salen) / t - g.neto) / g.neto).toBeLessThan(0.03);
  });
});

describe('Na⁺/K⁺-ATPasa (transporte activo)', () => {
  const E = ERITROCITO;
  it('3 Na⁺ : 2 K⁺ : 1 ATP y se para sin ATP', () => {
    const b = bomba(E.na, 5, E.atp, 37);
    expect(b.naFuera / b.ciclos).toBe(3);
    expect(b.kDentro / b.ciclos).toBe(2);
    expect(b.atp).toBe(b.ciclos);
    expect(bomba(E.na, 5, 0, 37).ciclos).toBe(0);
  });
  it('mitad de su máximo con [ATP] = K_ATP y se satura en V_max', () => {
    // la asíntota en ATP es V_max·f(Na⁺)·f(K⁺); con [ATP] = K_ATP se queda en la mitad exacta
    const b = bomba(E.na, 5, BOMBA.kATP, 37);
    expect(b.ciclos).toBeCloseTo(b.vmaxEf / 2, 12);
    expect(bomba(E.na, 5, 1e6, 37).ciclos).toBeGreaterThan(0.99999 * b.vmaxEf);
    expect(bomba(1e4, 1e4, 1e6, 37).ciclos).toBeGreaterThan(0.999 * vmaxBomba(37));
    expect(bomba(BOMBA.kNa, 5, E.atp, 37).fNa).toBeCloseTo(0.5, 12);
  });
  it('saca ~2 mmol de Na⁺ por litro de células y hora (glóbulo rojo humano)', () => {
    const b = bomba(E.na, 5, E.atp, 37);
    const molHoraCelula = (BOMBA.copias * b.naFuera * 3600) / N_A;
    const celulasPorLitro = 1 / (E.V0 * 1e-15);
    const mmolLh = molHoraCelula * celulasPorLitro * 1000;
    expect(mmolLh).toBeGreaterThan(1);
    expect(mmolLh).toBeLessThan(4);
  });
  it('mover 3 Na⁺ y 2 K⁺ cuesta menos que lo que da un ATP (~50 kJ/mol)', () => {
    const dG = energiaBomba(E.na, 140, E.k, 5, -0.010, 37);
    expect(dG).toBeGreaterThan(30);
    expect(dG).toBeLessThan(45);
    expect(dG).toBeLessThan(50);
  });
});

describe('hemoglobina y O₂ (difusión simple)', () => {
  it('Hill: 50 % en P50, sangre venosa ≈ 75 % y arterial ≈ 97 %', () => {
    expect(p50(37)).toBeCloseTo(26.8, 12);
    expect(saturacionHb(26.8)).toBeCloseTo(0.5, 12);
    expect(saturacionHb(OXIGENO.tejido)).toBeGreaterThan(0.74);
    expect(saturacionHb(OXIGENO.tejido)).toBeLessThan(0.76);
    expect(saturacionHb(OXIGENO.pulmon)).toBeGreaterThan(0.97);
    expect(saturacionHb(OXIGENO.pulmon)).toBeLessThan(0.98);
    expect(p50(27)).toBeLessThan(p50(37)); // en frío la hemoglobina retiene más el O₂
  });
  it('el contenido de O₂ se invierte a su pO₂', () => {
    for (const p of [5, 26.8, 40, 75, 100, 300]) expect(pO2DeContenido(contenidoO2(p, 90), 90)).toBeCloseTo(p, 6);
  });
});

describe('ósmosis del glóbulo rojo (exploración)', () => {
  const correr = (m: Medio, tReal: number) => {
    let e = estadoTransferencia(m.tC);
    for (let t = 0; t < tReal; t += 0.05) e = avanzarCelula(m, e, 0.05);
    return e;
  };
  it('en medio isotónico sin glucosa no cambia de volumen', () => {
    const m: Medio = { ...MEDIO_INICIAL, nacl: 140, glucosa: 0, pO2: 40 };
    const e = correr(m, 5);
    expect(e.V).toBeCloseTo(ERITROCITO.V0, 6);
  });
  it('Boyle–van ’t Hoff: V/V₀ = Osm₀/tonicidad, con la glucosa igualada y el O₂ cargado', () => {
    for (const nacl of [90, 120, 160, 220]) {
      const m: Medio = { ...MEDIO_INICIAL, nacl };
      // la glucosa se iguala con τ ≈ 30 s (cerca del equilibrio GLUT1 es casi lineal): 400 s
      const e = correr(m, 400);
      const l = leerCelula(m, e);
      expect(e.V / volumenEquilibrio(m)).toBeCloseTo(1, 4);
      expect(l.vRel).toBeCloseTo((100 * ERITROCITO.osm0) / tonicidad(m), 2);
      expect(l.gIn).toBeCloseTo(m.glucosa, 3);
      expect(l.osmIn).toBeCloseTo(l.osmOut, 3);
      expect(l.pO2In).toBeCloseTo(m.pO2, 2);
      // los solutos que no cruzan se conservan
      expect((l.osmIn - l.gIn) * e.V).toBeCloseTo(N_IMPERMEANTE, 6);
    }
  });
  it('el agua arranca con dV/dt = L_p·ΔOsm (L_p de la célula entera)', () => {
    const m: Medio = { ...MEDIO_INICIAL, nacl: 120 };
    const l = leerCelula(m, estadoTransferencia());
    expect(l.dVdt).toBeCloseTo(lpCelula(37) * (ERITROCITO.osm0 - (240 + 10 + 5)), 9);
    // P_f·A·V̄w a 25 °C: 0,506 fL/(s·mOsm/L) → τ ≈ 0,6 s reales en 290 mOsm
    expect(lpCelula(25)).toBeCloseTo(0.50596, 4);
  });
  it('lo que dibuja la escena es legible con su cámara lenta', () => {
    const l = leerCelula(MEDIO_INICIAL, estadoTransferencia());
    const aguaPorS = l.aguaTetramero / CAMARA_LENTA.membrana / PAQUETE.agua;
    const o2PorS = l.o2Parche / CAMARA_LENTA.membrana / PAQUETE.o2;
    expect(aguaPorS).toBeGreaterThan(1); expect(aguaPorS).toBeLessThan(10);
    expect(o2PorS).toBeGreaterThan(1); expect(o2PorS).toBeLessThan(10);
    expect(l.bomba.ciclos / CAMARA_LENTA.membrana).toBeGreaterThan(0.08);
    expect(l.glut.giros / CAMARA_LENTA.membrana).toBeLessThan(2);
  });
  it('cuenta las moléculas reales de la caja: c·V·N_A', () => {
    expect(enCaja(120, 2520)).toBeCloseTo(0.12 * 2520e-24 * N_A, 9);
    expect(Math.round(enCaja(120, 2520))).toBe(182);
    // la caja que dibuja la escena: 40 × 5 × 7 nm a cada lado de la membrana
    expect(PARCHE.cajaNm3).toBe(1400);
    expect(Math.round(enCaja(120, PARCHE.cajaNm3))).toBe(101);
  });
});

describe('ósmosis del reto (mismo equilibrio que el juez)', () => {
  it('converge a volumenEquilibrioB2 en célula animal y vegetal', () => {
    for (const [osm0, nacl, glu] of [[0.3, 0.25, 0], [0.28, 0.1, 0.05], [0.34, 0.2, 0], [0.26, 0.13, 0]] as const) {
      const ext = osmolaridadMedioB2(nacl, glu);
      for (const tipo of ['animal', 'vegetal'] as const) {
        let v = 100;
        for (let i = 0; i < 4000; i++) v = pasoVolumenReto(v, tipo, osm0, ext, 25, 0.01);
        expect(v).toBeCloseTo(volumenEquilibrioB2(tipo, osm0, ext), 3);
      }
    }
  });
  it('en el medio isotónico la célula no se mueve; en uno muy hipotónico pasa el umbral de lisis', () => {
    let v = 100;
    for (let i = 0; i < 200; i++) v = pasoVolumenReto(v, 'animal', 0.3, 0.3, 25, 0.05);
    expect(v).toBeCloseTo(100, 9);
    v = 100;
    for (let i = 0; i < 400 && v < UMBRAL_LISIS_B2; i++) v = pasoVolumenReto(v, 'animal', 0.3, 0.12, 25, 0.05);
    expect(v).toBeGreaterThanOrEqual(UMBRAL_LISIS_B2);
    v = 100;
    for (let i = 0; i < 400; i++) v = pasoVolumenReto(v, 'vegetal', 0.3, 0.05, 25, 0.05);
    expect(v).toBe(VMAX_VEGETAL_B2);
  });
  it('L_p real: 562 %V₀/(s·Osm/L) a 25 °C (el reto va a ×1/10)', () => {
    expect(lpRetoPorcentaje(25)).toBeCloseTo(562.2, 1);
    expect(CAMARA_LENTA.reto).toBe(10);
  });
});

describe('forma del glóbulo rojo: la malla tiene el volumen del modelo', () => {
  const g = crearGeoEritrocito();
  it('disco de reposo de Evans–Fung: 90 fL, R ≈ 3,9 µm, área ≈ 130 µm²', () => {
    const m = medirMalla(g);
    expect(m.volumen).toBeGreaterThan(89.1);
    expect(m.volumen).toBeLessThan(90.9);
    expect(R_E).toBeGreaterThan(3.75);
    expect(R_E).toBeLessThan(3.95);
    expect(AREA_REPOSO).toBeGreaterThan(120);
    expect(AREA_REPOSO).toBeLessThan(145);
  });
  it('cualquier volumen del rango se dibuja con error < 0,5 %', () => {
    const [vMin, vMax] = rangoVolumen();
    expect(vMin).toBeLessThan(0.3 * 90);
    expect(vMax).toBeGreaterThan(1.65 * 90);
    for (const pct of [30, 45, 64, 80, 92, 100, 116, 130, 150, 157, 160]) {
      const V = (pct / 100) * 90;
      const medido = formarEritrocito(g, V);
      expect(Math.abs(medido - V) / V).toBeLessThan(0.005);
      expect(Math.abs(medirMalla(g).volumen - V) / V).toBeLessThan(0.005);
    }
  });
  it('al hincharse conserva el área (±4 %) hasta la esfera, que llega antes de la lisis', () => {
    const areas = [100, 120, 140, 150].map((pct) => { formarEritrocito(g, (pct / 100) * 90); return medirMalla(g).area; });
    for (const a of areas) expect(Math.abs(a - areas[0]) / areas[0]).toBeLessThan(0.04);
    // la esfera de igual área: V = A^1,5 / (6·√π)
    const vEsfera = Math.pow(areas[0], 1.5) / (6 * Math.sqrt(Math.PI));
    expect(vEsfera / 90).toBeGreaterThan(1.45);
    expect(vEsfera / 90).toBeLessThan(UMBRAL_LISIS_B2 / 100);
  });
  it('sin normales nulas en ninguna forma', () => {
    for (const pct of [30, 70, 100, 140, 160]) {
      formarEritrocito(g, (pct / 100) * 90);
      const n = g.getAttribute('normal');
      let nulas = 0;
      for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) nulas++;
      expect(nulas).toBe(0);
    }
  });
});
