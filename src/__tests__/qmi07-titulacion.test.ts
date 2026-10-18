/**
 * Q7 · Titulación ácido-base — la química de `simuladores/qmi07/acidobase.ts` y su reloj
 * (`reloj.ts`).
 *
 *  - Balance de carga exacto: forma cerrada del fuerte-fuerte, pH 7,00 en el equivalente,
 *    conservación de carga y de masa en toda la curva de los tres ácidos.
 *  - Ácido débil: pH = pKa en la semiequivalencia (con su corrección exacta), hidrólisis del
 *    anión en el equivalente (pH > 7 con la K_b = K_w/K_a calculada), y el fosfórico con sus
 *    dos saltos.
 *  - Indicador: fracción In⁻ = 1/2 en pK_In; Beer–Lambert multiplicativo en el camino.
 *  - Bureta: gota de Tate, paso de la llave, vaciado en 75 s, umbral del chorro.
 *  - Reloj: cada mL que sale se apunta una vez; el titulador marca el equivalente con el pico
 *    de la derivada; la estela vive más cerca del equivalente; al fusionar estelas se
 *    conserva el volumen arrastrado.
 *  - El rosa que ve el alumno y el validador de dominio (`validarQ7`) coinciden.
 */
import {
  ACIDOS, ACIDOS_LISTA, INDICADORES, INDICADORES_LISTA, KW, AGUA_ML, PENDIENTE_NERNST, PUNTA, LIQUIDO_BURETA, G, HARKINS_BROWN,
  V_GOTA_ML, Q_CHORRO, T_VACIADO_S, N_TAU,
  resolverH, pH, totales, especies, curva, volumenEquivalencia, kbConjugada, fraccionBasica, transmitancia, absorbanciaPorCm,
  mVElectrodo, volumenGotaTate, areaLlave, caudalChorro, tauMezcla, volumenArrastrado, phZona, derivada, fracciones,
  type Sistema, type IdAcido,
} from '@/components/simuladores/qmi07/acidobase';
import { RelojTitulacion, CAUDAL, CAPACIDAD_ML, MAX_PLUMAS } from '@/components/simuladores/qmi07/reloj';
import { phTitulacion, validarQ7, VIRAJE_FENOLFTALEINA } from '@/domain/quimica';

const sis = (acido: IdAcido, ca = 0.1): Sistema => ({ acido, ca, va: 25, vAgua: AGUA_ML, cb: 0.1 });

/**
 * [H⁺] exacto del fuerte-fuerte: raíz de h² − δh − K_w = 0 con δ = C_A − C_Na. Con base en
 * exceso (δ < 0) se usa la forma racionalizada 2K_w/(−δ + √(δ² + 4K_w)): la de libro
 * (δ + √…)/2 resta dos números casi iguales y pierde 8 cifras (era el 1,4·10⁻⁹ de pH).
 */
const hFuerte = (CA: number, CNa: number) => {
  const d = CA - CNa, r = Math.sqrt(d * d + 4 * KW);
  return d >= 0 ? (d + r) / 2 : (2 * KW) / (r - d);
};

describe('fuerte-fuerte (HCl con NaOH)', () => {
  const s = sis('HCl');
  test('el balance de carga coincide con la forma cerrada en toda la curva', () => {
    for (let v = 0; v <= 50; v += 0.37) {
      const c = totales(s, v);
      expect(pH('HCl', c)).toBeCloseTo(-Math.log10(hFuerte(c.CA, c.CNa)), 9);
    }
  });
  test('pH inicial de 25 mL de HCl 0,1 M con 75 mL de agua: 1,602', () => {
    expect(pH('HCl', totales(s, 0))).toBeCloseTo(-Math.log10(0.025), 3);
  });
  test('en el equivalente el pH es 7,00 (sólo K_w)', () => {
    const vEq = volumenEquivalencia(s);
    expect(vEq).toBeCloseTo(25, 12);
    expect(Math.abs(pH('HCl', totales(s, vEq)) - 7)).toBeLessThan(1e-9);
  });
});

describe('débil-fuerte (ácido acético con NaOH)', () => {
  const s = sis('CH3COOH');
  const pKa = ACIDOS.CH3COOH.pKa[0];
  test('pH = pKa en la semiequivalencia (Henderson–Hasselbalch) y su corrección exacta', () => {
    const v = volumenEquivalencia(s) / 2;
    const c = totales(s, v);
    const h = resolverH('CH3COOH', c);
    expect(Math.abs(-Math.log10(h) - pKa)).toBeLessThan(0.01);
    // exacto: K_a = h·[A⁻]/[HA] con [A⁻] = C_Na + h − K_w/h
    const A = c.CNa + h - KW / h;
    expect(Math.log10((h * A) / (c.CA - A))).toBeCloseTo(-pKa, 9);
  });
  test('en el equivalente el pH pasa de 7 por la hidrólisis del acetato (K_b = K_w/K_a)', () => {
    const vEq = volumenEquivalencia(s);
    const c = totales(s, vEq);
    const Kb = kbConjugada('CH3COOH');
    expect(Kb).toBeCloseTo(KW / 10 ** -pKa, 20);
    expect(Kb).toBeCloseTo(5.7e-10, 11);
    const p = pH('CH3COOH', c);
    expect(p).toBeGreaterThan(7);
    // aproximación de libro [OH⁻] = √(K_b·C): 8,53
    expect(p).toBeCloseTo(14 + Math.log10(Math.sqrt(Kb * c.CA)), 2);
    // y la relación exacta de la hidrólisis: [OH⁻]·[HA]/[A⁻] = K_b
    const e = especies(s, vEq);
    expect((e.oh * e.formas[0]) / e.formas[1]).toBeCloseTo(Kb, 15);
  });
  test('el pH inicial es el de un ácido débil (≈ ½(pKa − log C))', () => {
    const c = totales(s, 0);
    expect(pH('CH3COOH', c)).toBeCloseTo(0.5 * (pKa - Math.log10(c.CA)), 1);
  });
});

describe('poliprótico (H₃PO₄ con NaOH)', () => {
  const s = sis('H3PO4', 0.05);
  test('la derivada marca los dos primeros equivalentes (el tercero no se ve)', () => {
    const c = curva(s, 45, 9000);
    const d = derivada(c, 0);
    const pico = (a: number, b: number) => d.filter((q) => q.v > a && q.v < b).reduce((m, q) => (q.d > m.d ? q : m), { v: 0, d: -1 });
    expect(pico(8, 17).v).toBeCloseTo(volumenEquivalencia(s, 1), 1);
    expect(pico(20, 30).v).toBeCloseTo(volumenEquivalencia(s, 2), 1);
  });
  test('en el primer equivalente el pH ≈ ½(pKa₁ + pKa₂) (anfolito H₂PO₄⁻)', () => {
    const [k1, k2] = ACIDOS.H3PO4.pKa;
    expect(pH('H3PO4', totales(s, volumenEquivalencia(s, 1)))).toBeCloseTo((k1 + k2) / 2, 0);
  });
});

describe('conservación en toda la curva', () => {
  test.each(ACIDOS_LISTA)('%s: carga neutra y masa del ácido constante', (a) => {
    const s = sis(a, a === 'H3PO4' ? 0.05 : 0.1);
    const nA = (s.ca * s.va) / 1000;
    for (let v = 0; v <= 50; v += 0.25) {
      const e = especies(s, v);
      expect(Math.abs(e.positivas - e.negativas) / e.positivas).toBeLessThan(1e-9);
      // el ácido en todas sus formas suma C_A, y C_A·V son los moles de la alícuota
      expect(e.formas.reduce((x, y) => x + y, 0)).toBeCloseTo(e.CA, 14);
      expect((e.CA * (s.va + s.vAgua + v)) / 1000).toBeCloseTo(nA, 15);
      // el sodio es el que dio la bureta
      expect((e.na * (s.va + s.vAgua + v)) / 1000).toBeCloseTo((s.cb * v) / 1000, 15);
    }
  });
  test('las fracciones α suman 1 y son estables con [H⁺] extremas', () => {
    for (const lh of [-14, -10, -7, -4, -1, 0.5]) {
      const f = fracciones(ACIDOS.H3PO4.pKa, 10 ** lh);
      expect(f.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 14);
      for (const x of f) expect(Number.isFinite(x) && x >= 0).toBe(true);
    }
  });
});

describe('indicadores (HIn ⇌ H⁺ + In⁻) y Beer–Lambert', () => {
  test.each(INDICADORES_LISTA)('%s: mitad In⁻ en pK_In, 10:1 una unidad arriba y abajo', (id) => {
    const ind = INDICADORES[id];
    expect(fraccionBasica(ind, ind.pKIn)).toBeCloseTo(0.5, 15);
    expect(fraccionBasica(ind, ind.pKIn + 1)).toBeCloseTo(10 / 11, 14);
    expect(fraccionBasica(ind, ind.pKIn - 1)).toBeCloseTo(1 / 11, 14);
    expect(ind.rango[0]).toBeLessThan(ind.pKIn + 0.5);
    expect(ind.rango[1]).toBeGreaterThan(ind.pKIn - 0.5);
  });
  test('T(2ℓ) = T(ℓ)² y la absorbancia es lineal en c', () => {
    const ind = INDICADORES.azulBromotimol;
    const t1 = transmitancia(ind, 4e-6, 7.1, 3), t2 = transmitancia(ind, 4e-6, 7.1, 6);
    t1.forEach((x, k) => expect(t2[k]).toBeCloseTo(x * x, 14));
    const a1 = absorbanciaPorCm(ind, 2e-6, 9), a2 = absorbanciaPorCm(ind, 4e-6, 9);
    a1.forEach((x, k) => expect(a2[k]).toBeCloseTo(2 * x, 14));
  });
  test('la fenolftaleína es incolora en ácido y absorbe el verde (rosa) en base', () => {
    const f = INDICADORES.fenolftaleina;
    expect(transmitancia(f, 2e-5, 4, 6).every((x) => x > 0.999)).toBe(true);
    const T = transmitancia(f, 2e-5, 11, 6);
    expect(T[1]).toBeLessThan(T[0]);
    expect(T[1]).toBeLessThan(T[2]);
  });
  test('electrodo ideal: 0 mV en pH 7 y −59,16 mV por unidad de pH a 25 °C', () => {
    expect(mVElectrodo(7)).toBeCloseTo(0, 12);
    expect(mVElectrodo(8) - mVElectrodo(7)).toBeCloseTo(-59.16, 2);
    expect(PENDIENTE_NERNST).toBeCloseTo(0.05916, 5);
  });
});

describe('bureta: gota, llave, vaciado y chorro', () => {
  test('gota de Tate con Harkins–Brown: 2π·r·γ·φ/(ρ·g) = 0,043 mL', () => {
    const v = (2 * Math.PI * (PUNTA.radioExtCm / 100) * LIQUIDO_BURETA.gamma * HARKINS_BROWN) / (LIQUIDO_BURETA.rho * G) * 1e6;
    expect(volumenGotaTate()).toBeCloseTo(v, 12);
    expect(V_GOTA_ML).toBeCloseTo(0.043, 3);
  });
  test('paso de la llave: 0 cerrada, 1 abierta, área de dos círculos a medio giro, creciente', () => {
    expect(areaLlave(0)).toBe(0);
    expect(areaLlave(1)).toBeCloseTo(1, 12);
    expect(areaLlave(0.5)).toBeCloseTo((2 / Math.PI) * (Math.acos(0.5) - 0.5 * Math.sqrt(0.75)), 12);
    let ant = -1;
    for (let p = 0; p <= 1.0001; p += 0.01) { const a = areaLlave(p); expect(a).toBeGreaterThanOrEqual(ant); ant = a; }
  });
  test('con la llave abierta la bureta se vacía de 0 a 50 mL en 75 s (ISO 385 clase A)', () => {
    let t = 0;
    const dv = 0.02;
    for (let v = 0; v < 50; v += dv) t += dv / CAUDAL.caudal(1, v + dv / 2);
    expect(Math.abs(t - T_VACIADO_S) / T_VACIADO_S).toBeLessThan(0.005);
  });
  test('el chorro empieza con Weber = 4 en la punta (≈ 0,42 mL/s)', () => {
    const d = PUNTA.diamIntCm / 100;
    const v = Math.sqrt((4 * LIQUIDO_BURETA.gamma) / (LIQUIDO_BURETA.rho * d));
    expect(caudalChorro()).toBeCloseTo(v * Math.PI * (d / 2) ** 2 * 1e6, 12);
    expect(Q_CHORRO).toBeGreaterThan(0.4);
    expect(Q_CHORRO).toBeLessThan(0.45);
  });
  test('aperturaPara invierte el caudal', () => {
    for (const q of [0.04, 0.1, 0.3]) expect(CAUDAL.caudal(CAUDAL.aperturaPara(q, 20), 20)).toBeCloseTo(q, 8);
  });
});

describe('mezcla y estela de la gota', () => {
  test('τ = N·τ/N y V_e = v·(e^(t/τ) − 1)', () => {
    expect(tauMezcla(400)).toBeCloseTo(N_TAU / (400 / 60), 12);
    expect(tauMezcla(0)).toBe(20);
    expect(volumenArrastrado(0.043, 0, 0.4)).toBe(0);
    expect(volumenArrastrado(0.043, 0.4 * Math.LN2, 0.4)).toBeCloseTo(0.043, 12);
  });
  test('la zona de la gota es básica al principio y se vuelve ácida al arrastrar matraz', () => {
    const s = sis('HCl');
    const c = totales(s, 15);
    expect(phZona('HCl', c, 0.1, V_GOTA_ML, 0.001)).toBeGreaterThan(11);
    expect(phZona('HCl', c, 0.1, V_GOTA_ML, 5)).toBeLessThan(3);
  });
});

/** Reloj del reto (sin titulador) con la llave fija. */
function relojReto(ca = 0.1, indicador: 'fenolftaleina' | 'azulBromotimol' | null = 'fenolftaleina') {
  const r = new RelojTitulacion(sis('HCl', ca), { auto: false, indicador, conIndicador: !!indicador });
  return r;
}

describe('el reloj', () => {
  test('cada mL que sale se apunta una vez; lo que cae acaba en el matraz', () => {
    const r = relojReto();
    let apuntado = 0;
    r.onSalida = (mL) => { apuntado += mL; };
    r.aperturaObjetivo = 0.3;
    for (let i = 0; i < 600; i++) r.paso(0.05);
    expect(r.chorro).toBe(false);
    expect(apuntado).toBeCloseTo(r.vbSalida, 9);
    // goteo: cada salida es una gota de Tate
    expect(Math.round(r.vbSalida / V_GOTA_ML) * V_GOTA_ML).toBeCloseTo(r.vbSalida, 6);
    r.aperturaObjetivo = 0;
    for (let i = 0; i < 100; i++) r.paso(0.05);
    expect(r.gotas.length).toBe(0);
    expect(r.vb).toBeCloseTo(r.vbSalida, 9);
    expect(r.lectura.ph).toBeCloseTo(pH('HCl', totales(r.sistema, r.vb)), 12);
  });
  test('con la llave abierta del todo sale chorro y la lectura no pasa de 50 mL', () => {
    const r = relojReto();
    let apuntado = 0;
    r.onSalida = (mL) => { apuntado += mL; };
    r.aperturaObjetivo = 1;
    let chorro = false;
    for (let i = 0; i < 2400; i++) { r.paso(0.05); chorro ||= r.chorro; }
    expect(chorro).toBe(true);
    expect(r.vbSalida).toBeLessThanOrEqual(CAPACIDAD_ML);
    expect(r.vbSalida).toBeGreaterThan(CAPACIDAD_ML - 0.05);
    expect(apuntado).toBeCloseTo(r.vbSalida, 9);
  });
  test('el titulador automático marca el equivalente con el pico de ΔpH/ΔV y empieza otra alícuota', () => {
    const r = new RelojTitulacion(sis('HCl'), { auto: true, indicador: 'azulBromotimol', conIndicador: true });
    const gen0 = r.generacion;
    let historia = r.historia;
    for (let i = 0; i < 6000 && r.generacion === gen0; i++) { historia = r.historia; r.paso(0.05); }
    expect(r.generacion).toBe(gen0 + 1);
    const d = derivada(historia);
    const pico = d.reduce((m, q) => (q.d > m.d ? q : m), d[0]);
    expect(Math.abs(pico.v - 25)).toBeLessThan(V_GOTA_ML * 1.5);
    // cerca del salto gotea despacio: las lecturas están a una gota
    const cerca = historia.filter((p) => Math.abs(p.v - 25) < 0.3);
    expect(cerca.length).toBeGreaterThan(8);
  });
  test('una estela dura más cerca del equivalente (queda menos ácido que la neutralice)', () => {
    const vida = (v: number) => {
      const r = relojReto(0.1, 'azulBromotimol');
      r.adelantarA(v);
      r.aperturaObjetivo = 0.25;
      let t = 0;
      while (r.plumas.length === 0 && t < 10) { r.paso(0.02); t += 0.02; if (r.gotas.length) r.aperturaObjetivo = 0; }
      r.aperturaObjetivo = 0;
      let vivo = 0;
      while (r.plumas.length > 0 && vivo < 30) { r.paso(0.02); vivo += 0.02; }
      return vivo;
    };
    expect(vida(24.9)).toBeGreaterThan(vida(12.5));
  });
  test('al fusionar una gota en la estela más joven se conserva el volumen arrastrado', () => {
    const r = relojReto(0.1, 'azulBromotimol');
    r.adelantarA(10);
    r.aperturaObjetivo = 0.38; // ≈ 8 gotas/s: más gotas que sitios para estelas
    const tau = tauMezcla(r.rpm);
    let fusiones = 0;
    for (let i = 0; i < 3000; i++) {
      const ult = r.plumas[r.plumas.length - 1];
      const antes = ult ? { p: ult, vol: ult.vol, vE: volumenArrastrado(ult.vol, ult.t, tau), n: r.plumas.length } : null;
      const vb0 = r.vb;
      r.paso(0.002);
      if (antes && r.vb > vb0 && antes.n === MAX_PLUMAS && r.plumas.length === MAX_PLUMAS && r.plumas[MAX_PLUMAS - 1] === antes.p && antes.p.vol > antes.vol) {
        fusiones++;
        // V_e de la estela antes de la gota ≈ el de después con la edad efectiva (salvo el paso de 2 ms)
        expect(volumenArrastrado(antes.p.vol, antes.p.t, tau)).toBeCloseTo(antes.vE, 2);
        expect(antes.p.vol).toBeCloseTo(antes.vol + (r.vb - vb0), 9);
      }
      expect(r.plumas.length).toBeLessThanOrEqual(MAX_PLUMAS);
    }
    expect(fusiones).toBeGreaterThan(0);
  });
});

describe('el rosa que se ve y el validador de dominio', () => {
  test('con el matraz ya rosa (pH exacto ≥ 8,2) el validador da el punto final por alcanzado, gota a gota', () => {
    for (let ca = 0.05; ca <= 0.18; ca += 0.0137) {
      const c = Math.round(ca * 1000) / 1000;
      const s = sis('HCl', c);
      for (let k = Math.floor(volumenEquivalencia(s) / V_GOTA_ML) - 3; k < Math.floor(volumenEquivalencia(s) / V_GOTA_ML) + 4; k++) {
        const v = Math.round(k * V_GOTA_ML * 1000) / 1000;
        if (pH('HCl', totales(s, v)) >= VIRAJE_FENOLFTALEINA) expect(phTitulacion(c, 25, 0.1, v)).toBeGreaterThanOrEqual(VIRAJE_FENOLFTALEINA);
      }
    }
  });
  test('validarQ7 acepta Cb·Vb/Va con la lectura del primer rosa (±2 %)', () => {
    const c = 0.123;
    const s = sis('HCl', c);
    let v = 0;
    for (let k = 0; ; k++) { v = Math.round(k * V_GOTA_ML * 1000) / 1000; if (pH('HCl', totales(s, v)) >= VIRAJE_FENOLFTALEINA) break; }
    const t = { ca: c, va: 25, cb: 0.1, volumenBase: v, purgada: true, indicador: true, status: 'idle' as const, history: [], respuestaCa: Math.round((0.1 * v / 25) * 1000) / 1000 };
    expect(validarQ7(t).ok).toBe(true);
    expect(validarQ7({ ...t, purgada: false }).ok).toBe(false);
    expect(validarQ7({ ...t, volumenBase: v - 2 * V_GOTA_ML }).ok).toBe(false);
  });
});
