/**
 * Q9 · Celdas galvánicas — la física de `simuladores/qmi09/electroquimica.ts` y su
 * reloj (`reloj.ts`).
 *
 *  - Nernst: casos de libro de la celda de Daniell y de Zn/Ag, la pendiente de
 *    59,16 mV por década a 25 °C, y la forma de semiceldas = la de la celda completa.
 *  - Termodinámica: ΔG° = −nFE° contra las ΔfG° del NBS; dE°/dT de cada semicelda
 *    contra Bratsch (1989) y el de la Daniell contra (ΔH° − ΔG°)/(nFT).
 *  - Faraday: m = q·M/(zF) (1 A·h deposita 1,186 g de Cu y 4,025 g de Ag).
 *  - La descarga: carga conservada, masas de Faraday en las varillas, Q → K y E → 0 en
 *    el equilibrio, sin pasarse, independiente del paso; agotamiento del ánodo.
 *  - Circuito: I = E/(R_ext + R_int), V en bornes, voltímetro solo ≈ fem, puente de
 *    KNO₃ con ℓ/(κA) y electroneutralidad (t₊ + t₋ = 1).
 *  - El voltímetro del reto tiene el MISMO signo y valor que el validador de dominio.
 *  - Beer–Lambert del Cu²⁺: log T lineal en c.
 */
import {
  FARADAY, R_GAS, T_REF, METAL, METALES_Q9, BANCO, VOLUMEN_VARILLA_CM3, KAPPA_PUENTE_25, R_DISOLUCIONES, R_VOLTIMETRO,
  T_POTASIO, N_E_COBRE, CARGA_E, SECCION_CABLE,
  coefTemperatura, E0aT, potencialReduccion, nernstCelda, datosReaccion, lnCociente, masaFaraday, transmitancia,
  resistenciaPuente, resistenciaInterna, resistenciaExterna, derivaElectrones, formaVarilla, estadoInicial, leer, avanzar,
  cargaMaxima, electronesReaccion, type IdMetal, type Montaje,
} from '@/components/simuladores/qmi09/electroquimica';
import { RelojCelda, montajeDaniell, ionesVisibles, MOL_POR_ION } from '@/components/simuladores/qmi09/reloj';
import { lecturaVoltimetro, E0_REDUCCION } from '@/domain/quimica';

const T = T_REF;
const PENDIENTE = (R_GAS * T * Math.LN10) / FARADAY; // 0,05916 V por década
const PARES: [IdMetal, IdMetal][] = [['Zn', 'Cu'], ['Zn', 'Ag'], ['Mg', 'Zn'], ['Mg', 'Cu'], ['Mg', 'Ag'], ['Cu', 'Ag']];

/** Corre la celda hasta que deje de dar corriente (o hasta `maxPasos`). */
function descargar(m: Montaje, dt: number, e = estadoInicial(), maxPasos = 200000) {
  let s = e;
  for (let i = 0; i < maxPasos; i++) {
    const n = avanzar(m, s, dt);
    if (n.q === s.q) return n;
    s = n;
  }
  return s;
}

describe('Nernst', () => {
  test('pendiente RT·ln10/F = 59,16 mV por década a 25 °C', () => {
    expect(PENDIENTE).toBeCloseTo(0.059159, 5);
  });
  test('Daniell: E° = 1,10 V con las dos disoluciones 1 M', () => {
    expect(nernstCelda('Zn', 'Cu', 1, 1, T)).toBeCloseTo(1.1, 12);
  });
  test('Daniell de libro: [Cu²⁺] = 0,010 M → 1,10 − 0,0592 = 1,041 V', () => {
    expect(nernstCelda('Zn', 'Cu', 1, 0.01, T)).toBeCloseTo(1.04084, 4);
  });
  test('Daniell de libro: [Zn²⁺] = 0,0010 M → 1,10 + 0,0887 = 1,189 V', () => {
    expect(nernstCelda('Zn', 'Cu', 0.001, 1, T)).toBeCloseTo(1.18874, 4);
  });
  test('Zn/Ag (n = 2, Q = [Zn²⁺]/[Ag⁺]²): [Ag⁺] = 0,01 M → 1,56 − 2·0,0592 = 1,442 V', () => {
    expect(datosReaccion('Zn', 'Ag').n).toBe(2);
    expect(lnCociente('Zn', 'Ag', 1, 0.01)).toBeCloseTo(Math.log(1e4), 10);
    expect(nernstCelda('Zn', 'Ag', 1, 0.01, T)).toBeCloseTo(1.56 - 2 * PENDIENTE, 10);
  });
  test('semiceldas = celda completa para todos los pares, concentraciones y temperaturas', () => {
    for (const [a, c] of PARES) for (const cA of [1e-3, 0.05, 1, 2]) for (const cC of [1e-4, 0.3, 1]) for (const Tk of [278.15, T, 333.15]) {
      const porSemiceldas = potencialReduccion(c, cC, Tk) - potencialReduccion(a, cA, Tk);
      expect(nernstCelda(a, c, cA, cC, Tk)).toBeCloseTo(porSemiceldas, 12);
    }
  });
  test('n = mcm de las cargas', () => {
    expect(electronesReaccion(2, 2)).toBe(2);
    expect(electronesReaccion(2, 1)).toBe(2);
    expect(electronesReaccion(1, 1)).toBe(1);
  });
  test('en el equilibrio (Q = K) la fem es 0', () => {
    for (const [a, c] of PARES) {
      const { lnK, nuA, nuC } = datosReaccion(a, c);
      // con [ánodo] = 1 M, Q = K ⇔ [cátodo] = K^(−1/νc)
      const cC = Math.exp(-lnK / nuC);
      expect(nuA * Math.log(1) - nuC * Math.log(cC)).toBeCloseTo(lnK, 9);
      expect(Math.abs(nernstCelda(a, c, 1, cC, T))).toBeLessThan(1e-12);
    }
  });
});

describe('termodinámica', () => {
  // ΔfG° (kJ/mol) de los cationes acuosos, NBS (Wagman et al., 1982)
  const DFG: Record<IdMetal, number> = { Zn: -147.06, Cu: 65.49, Ag: 77.107, Mg: -454.8 };
  test('ΔG° = −nFE° coincide con las ΔfG° tabuladas (≤ 1 %)', () => {
    for (const [a, c] of PARES) {
      const r = datosReaccion(a, c);
      const tabla = (r.nuA * DFG[a] - r.nuC * DFG[c]) * 1000;
      expect(Math.abs(r.dG0 - tabla) / Math.abs(tabla)).toBeLessThan(0.01);
      expect(r.dG0).toBeCloseTo(-r.n * FARADAY * r.E0, 6);
    }
    // Daniell: −212,3 kJ frente a −212,55 de la tabla
    expect(datosReaccion('Zn', 'Cu').dG0 / 1000).toBeCloseTo(-212.27, 1);
  });
  test('K = 10^(nE°/0,05916): Daniell ≈ 1,6·10³⁷', () => {
    const { log10K } = datosReaccion('Zn', 'Cu');
    expect(log10K).toBeCloseTo((2 * 1.1) / PENDIENTE, 9);
    expect(log10K).toBeGreaterThan(37.1);
    expect(log10K).toBeLessThan(37.3);
  });
  test('dE°/dT de cada semicelda contra Bratsch (1989): Zn +0,119, Cu +0,011, Ag −0,989 mV/K', () => {
    expect(coefTemperatura('Zn') * 1000).toBeCloseTo(0.119, 3);
    expect(coefTemperatura('Cu') * 1000).toBeCloseTo(0.011, 3);
    expect(coefTemperatura('Ag') * 1000).toBeCloseTo(-0.989, 3);
  });
  test('Daniell: dE°/dT = ΔS°/nF ≈ (ΔH° − ΔG°)/(nFT) con las tablas (≤ 5 %)', () => {
    const dH = (-153.89 - 64.77) * 1000, dG = (-147.06 - 65.49) * 1000;
    const tabla = (dH - dG) / (2 * FARADAY * T);
    const modelo = coefTemperatura('Cu') - coefTemperatura('Zn');
    expect(Math.abs(modelo - tabla) / Math.abs(tabla)).toBeLessThan(0.05);
    expect(E0aT('Cu', 333.15) - E0aT('Zn', 333.15)).toBeCloseTo(1.1 + modelo * 35, 12);
  });
});

describe('Faraday', () => {
  test('1 F deposita M/z gramos', () => {
    expect(masaFaraday('Cu', FARADAY)).toBeCloseTo(63.546 / 2, 10);
    expect(masaFaraday('Ag', FARADAY)).toBeCloseTo(107.8682, 10);
  });
  test('1 A durante 1 h: 1,186 g de Cu y 4,025 g de Ag', () => {
    expect(masaFaraday('Cu', 3600)).toBeCloseTo(1.1855, 3);
    expect(masaFaraday('Ag', 3600)).toBeCloseTo(4.0245, 3);
  });
  test('forma de la varilla: el volumen se conserva y crecer/disolver mueve la superficie δ', () => {
    for (const V of [0.5, 2, VOLUMEN_VARILLA_CM3, 5.3]) {
      const f = formaVarilla(V);
      expect(Math.PI * f.r * f.r * f.h).toBeCloseTo(V, 9);
      expect(f.r - BANCO.rVarillaCm).toBeCloseTo(f.delta, 12);
    }
    expect(formaVarilla(VOLUMEN_VARILLA_CM3).delta).toBeCloseTo(0, 9);
  });
});

describe('circuito', () => {
  test('R del puente = ℓ/(κ·A) con el tubo dibujado (Ø 10 mm, ≈ 29 cm)', () => {
    const A = Math.PI * 0.25;
    expect(resistenciaPuente(T)).toBeCloseTo(BANCO.largoPuenteCm / (KAPPA_PUENTE_25 * A), 9);
    expect(BANCO.largoPuenteCm).toBeGreaterThan(25);
    expect(BANCO.largoPuenteCm).toBeLessThan(35);
    expect(resistenciaInterna(T)).toBeCloseTo(resistenciaPuente(T) + R_DISOLUCIONES, 12);
    // a 45 °C conduce un 40 % más
    expect(resistenciaPuente(T) / resistenciaPuente(T + 20)).toBeCloseTo(1.4, 9);
  });
  test('I = E/(R_ext + R_int) y V = I·R_ext; con sólo el voltímetro V ≈ E', () => {
    const m = montajeDaniell(1000);
    const l = leer(m, estadoInicial());
    const Rext = resistenciaExterna(1000);
    expect(Rext).toBeCloseTo((1000 * R_VOLTIMETRO) / (1000 + R_VOLTIMETRO), 9);
    expect(l.I).toBeCloseTo(1.1 / (Rext + resistenciaInterna(T)), 12);
    expect(l.V).toBeCloseTo(l.I * Rext, 12);
    const abierto = leer(montajeDaniell('abierta'), estadoInicial());
    expect(Math.abs(abierto.V - 1.1) / 1.1).toBeLessThan(1e-4);
  });
  test('sin puente o sin puntas no hay lectura ni corriente', () => {
    const e = estadoInicial();
    expect(leer({ ...montajeDaniell(1000), puente: false }, e).V).toBe(0);
    expect(leer({ ...montajeDaniell(1000), cables: false }, e).I).toBe(0);
    expect(avanzar({ ...montajeDaniell(1000), puente: false }, e, 1e6).q).toBe(0);
  });
  test('deriva de los electrones: 1 A en 0,5 mm² de cobre → 0,147 mm/s', () => {
    expect(derivaElectrones(1)).toBeCloseTo(1 / (N_E_COBRE * CARGA_E * SECCION_CABLE), 15);
    expect(derivaElectrones(1) * 1000).toBeCloseTo(0.147, 3);
  });
});

describe('el voltímetro del reto', () => {
  test('mismo signo y valor que el validador de dominio (1 M, 25 °C, circuito abierto)', () => {
    for (const izq of METALES_Q9) for (const der of METALES_Q9) {
      if (izq === der) continue;
      const l = leer({ izq, der, puente: true, cables: true, carga: 'abierta', T }, estadoInicial());
      const dominio = lecturaVoltimetro(izq, der);
      expect(Math.sign(l.V)).toBe(Math.sign(dominio));
      expect(l.V).toBeCloseTo(dominio, 3);
      expect(l.fem).toBeCloseTo(E0_REDUCCION[der] - E0_REDUCCION[izq], 12);
      // el ánodo físico es el de menor E° (lo que el alumno debe identificar)
      expect(l.anodo).toBe(E0_REDUCCION[izq] < E0_REDUCCION[der] ? 'izq' : 'der');
    }
  });
});

describe('descarga (Euler implícito)', () => {
  const m = montajeDaniell(100);
  const fin = descargar(m, 2e5);
  test('la carga se conserva: q = 2F·Δn(Cu²⁺) = 2F·Δn(Zn²⁺)', () => {
    const V = BANCO.volumenL;
    expect(fin.q).toBeCloseTo(2 * FARADAY * (V - fin.nDer), 4);
    expect(fin.q).toBeCloseTo(2 * FARADAY * (fin.nIzq - V), 4);
    expect(fin.q).toBeCloseTo(cargaMaxima(m, estadoInicial()), 3);
  });
  test('las varillas cambian lo que dice Faraday', () => {
    const dmZn = (fin.vIzq - VOLUMEN_VARILLA_CM3) * METAL.Zn.rho;
    const dmCu = (fin.vDer - VOLUMEN_VARILLA_CM3) * METAL.Cu.rho;
    expect(dmZn).toBeCloseTo(-masaFaraday('Zn', fin.q), 9);
    expect(dmCu).toBeCloseTo(masaFaraday('Cu', fin.q), 9);
    // 0,2 mol: −13,08 g de Zn y +12,71 g de Cu
    expect(dmZn).toBeCloseTo(-13.076, 2);
    expect(dmCu).toBeCloseTo(12.709, 2);
  });
  test('al final Q = K y E = 0 (la celda se agota)', () => {
    const l = leer(m, fin);
    expect(Math.abs(l.fem)).toBeLessThan(1e-6);
    expect(Math.abs(l.lnQ - l.lnK) / l.lnK).toBeLessThan(1e-6);
    expect(l.cDer).toBeLessThan(1e-30);
  });
  test('E baja monótona y nunca se pasa de 0, con cualquier paso', () => {
    for (const dt of [1e3 * 37, 1e6, 1e8]) {
      let s = estadoInicial(), Eprev = Infinity;
      for (let i = 0; i < 4000; i++) {
        s = avanzar(m, s, dt);
        const E = leer(m, s).fem;
        expect(E).toBeGreaterThanOrEqual(0);
        expect(E).toBeLessThanOrEqual(Eprev + 1e-12);
        Eprev = E;
      }
    }
  });
  test('el final no depende del paso', () => {
    const a = descargar(m, 1e5), b = descargar(m, 1e8);
    expect(a.q).toBeCloseTo(b.q, 3);
    expect(leer(m, b).fem).toBeLessThan(1e-6);
  });
  test('el tiempo de descarga ≈ q/I de la meseta (tensión casi constante)', () => {
    const I0 = leer(m, estadoInicial()).I;
    expect(fin.t).toBeGreaterThan((0.95 * fin.q) / I0);
    expect(fin.t).toBeLessThan((1.15 * fin.q) / I0);
  });
  test('si el ánodo sumergido se acaba antes, la celda se para con fem > 0', () => {
    const e = { ...estadoInicial(), vIzq: 0.5 };   // poco zinc
    const f = descargar(m, 1e5, e);
    expect(f.vIzq).toBeLessThan(1e-9);
    expect(leer(m, f).fem).toBeGreaterThan(1);
    expect(f.q).toBeCloseTo((2 * FARADAY * 0.5 * METAL.Zn.rho) / METAL.Zn.M, 3);
  });
  test('electroneutralidad: el puente cede t₊ de K⁺ al cátodo y t₋ de NO₃⁻ al ánodo', () => {
    expect((fin.kDer + fin.nitIzq) * FARADAY).toBeCloseTo(fin.q, 4);
    expect(fin.kDer / (fin.kDer + fin.nitIzq)).toBeCloseTo(T_POTASIO, 12);
  });
  test('todos los pares del reto se agotan en el equilibrio', () => {
    for (const [a, c] of PARES) {
      const mm: Montaje = { izq: a, der: c, puente: true, cables: true, carga: 1000, T };
      const f = descargar(mm, 1e6);
      expect(leer(mm, f).fem).toBeLessThan(1e-6);
      expect(f.vIzq).toBeGreaterThan(0);
    }
  });
  test('montado al revés, la corriente va al revés (el ánodo sigue siendo el de menor E°)', () => {
    const mm: Montaje = { izq: 'Cu', der: 'Zn', puente: true, cables: true, carga: 100, T };
    const s = avanzar(mm, estadoInicial(), 1e6);
    expect(s.q).toBeLessThan(0);
    expect(s.vDer).toBeLessThan(VOLUMEN_VARILLA_CM3);
    expect(s.vIzq).toBeGreaterThan(VOLUMEN_VARILLA_CM3);
    expect(leer(mm, s).V).toBeLessThan(0);
  });
});

describe('Beer–Lambert del Cu²⁺', () => {
  test('log T es lineal en la concentración; el Zn²⁺ es incoloro', () => {
    const t1 = transmitancia('Cu', 0.2, 6.7), t2 = transmitancia('Cu', 0.4, 6.7);
    for (let i = 0; i < 3; i++) expect(Math.log10(t2[i])).toBeCloseTo(2 * Math.log10(t1[i]), 12);
    expect(transmitancia('Cu', 0, 6.7)).toEqual([1, 1, 1]);
    expect(transmitancia('Zn', 2, 6.7)).toEqual([1, 1, 1]);
    // el rojo se absorbe mucho más que el azul: la disolución se ve azul
    expect(t1[2]).toBeGreaterThan(t1[1]);
    expect(t1[1]).toBeGreaterThan(t1[0]);
  });
});

describe('reloj único', () => {
  test('cámara rápida: el tiempo simulado avanza dt·factor', () => {
    const r = new RelojCelda(montajeDaniell(1000));
    r.factor = 1e6;
    r.paso(0.05);
    expect(r.estado.t).toBeCloseTo(5e4, 6);
    r.pausa = true;
    expect(r.paso(0.05)).toBe(false);
    expect(r.estado.t).toBeCloseTo(5e4, 6);
  });
  test('la lectura publicada es la del estado del cuadro', () => {
    const r = new RelojCelda(montajeDaniell(1000));
    for (let i = 0; i < 300; i++) r.paso(1 / 60);
    const l = leer(r.montaje, r.estado);
    expect(r.lectura.fem).toBe(l.fem);
    expect(r.lectura.V).toBe(l.V);
    expect(r.historia[r.historia.length - 1].q).toBeLessThanOrEqual(Math.abs(r.estado.q));
  });
  test('cambiar los metales prepara disoluciones nuevas; cambiar la carga no', () => {
    const r = new RelojCelda({ izq: 'Zn', der: 'Ag', puente: true, cables: true, carga: 1000, T });
    for (let i = 0; i < 60; i++) r.paso(1 / 60);
    const q = r.estado.q, g = r.generacion;
    r.fijarMontaje({ carga: 100 });
    expect(r.estado.q).toBe(q);
    r.fijarMontaje({ izq: 'Ag', der: 'Zn' });
    expect(r.estado.q).toBe(0);
    expect(r.generacion).toBeGreaterThan(g);
    // las generaciones no se repiten entre relojes (la escena repuebla al cambiar de reloj)
    const otro = new RelojCelda({ izq: 'Zn', der: 'Cu', puente: true, cables: true, carga: 1000, T });
    expect(otro.generacion).not.toBe(r.generacion);
  });
  test('cada esfera representa 4 mmol: 1 M en 200 mL son 50 iones', () => {
    expect(ionesVisibles(1 * BANCO.volumenL)).toBe(50);
    expect(MOL_POR_ION).toBe(0.004);
  });
});
