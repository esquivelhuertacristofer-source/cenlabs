/**
 * Lupa atómica de la celda de Daniell (qmi09/atomico.ts): el mundo de átomos tiene que
 * obedecer a la lectura del modelo. Sin corriente no hay reacciones; cada reacción
 * mueve exactamente 2 e⁻ y deposita 1 átomo de Cu por cada Zn que se oxida; el ritmo
 * crece con |I|; los iones visibles siguen la concentración.
 */
import {
  MundoAtomico, ritmoVisible, ionesPorConcentracion, reaccionesReales, GEO, CABLE, rotar, puntoRuta, type EntradaMundo,
} from '@/components/simuladores/qmi09/atomico';
import { CARGA_E } from '@/components/simuladores/qmi09/electroquimica';

const base: EntradaMundo = { I: 7.8e-4, cerrado: true, cAn: 1, cCa: 1, c0An: 1, c0Ca: 1 };
const correr = (m: MundoAtomico, s: number, e: EntradaMundo) => { for (let i = 0; i < Math.round(s * 60); i++) m.paso(1 / 60, e); };

describe('lupa atómica · ritmo y recuentos', () => {
  it('sin corriente, ritmo cero; con corriente, crece con |I| y está acotado', () => {
    expect(ritmoVisible(0)).toBe(0);
    expect(ritmoVisible(1e-9)).toBe(0);
    const Is = [1e-5, 1e-4, 1e-3, 1e-2, 1e-1];
    const r = Is.map(ritmoVisible);
    for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThanOrEqual(r[i - 1]);
    expect(r[2]).toBeGreaterThan(r[0]);
    expect(Math.max(...r)).toBeLessThanOrEqual(2.6);
    expect(ritmoVisible(-1e-3)).toBe(ritmoVisible(1e-3));
  });

  it('reacciones reales por segundo = |I| / 2e', () => {
    expect(reaccionesReales(7.8e-4)).toBeCloseTo(7.8e-4 / (2 * CARGA_E), -10);
    expect(reaccionesReales(7.8e-4)).toBeGreaterThan(2e15);
    expect(reaccionesReales(7.8e-4)).toBeLessThan(3e15);
  });

  it('los iones visibles crecen con la concentración (1 mM → 3, 10 mM → 8, 0,1 M → 12, 1 M → 17)', () => {
    expect(ionesPorConcentracion(1e-3)).toBe(3);
    expect(ionesPorConcentracion(1e-2)).toBe(8);
    expect(ionesPorConcentracion(0.1)).toBe(12);
    expect(ionesPorConcentracion(1)).toBe(17);
    expect(ionesPorConcentracion(0)).toBe(0);
    let antes = 0;
    for (const c of [1e-3, 3e-3, 1e-2, 3e-2, 0.1, 0.3, 1, 2]) { const n = ionesPorConcentracion(c); expect(n).toBeGreaterThanOrEqual(antes); antes = n; }
  });
});

describe('lupa atómica · el mundo', () => {
  it('con el circuito abierto no se arranca ni se deposita ningún átomo', () => {
    const m = new MundoAtomico({ ...base, cerrado: false });
    const zn0 = m.atomosZn();
    correr(m, 20, { ...base, cerrado: false });
    expect(m.oxidaciones).toBe(0);
    expect(m.reacciones).toBe(0);
    expect(m.electrones).toHaveLength(0);
    expect(m.atomosZn()).toBe(zn0);
    expect(m.atomosCuDepositados()).toBe(0);
  });

  it('cerrado: oxida al ritmo visible y cada reacción mueve 2 e⁻ y deposita 1 Cu', () => {
    const m = new MundoAtomico(base);
    correr(m, 30, base);
    const esperadas = ritmoVisible(base.I) * 30;
    expect(Math.abs(m.oxidaciones - esperadas)).toBeLessThanOrEqual(1);
    expect(m.eEmitidos).toBe(2 * m.oxidaciones);
    // se abre el circuito: los electrones en vuelo terminan su viaje y no nace ninguno nuevo
    const ox = m.oxidaciones;
    correr(m, 10, { ...base, cerrado: false });
    expect(m.oxidaciones).toBe(ox);
    expect(m.electrones).toHaveLength(0);
    expect(m.eRecibidos).toBe(m.eEmitidos);
    expect(m.reacciones).toBe(m.oxidaciones);
    expect(m.atomosCuDepositados()).toBe(m.reacciones);
  });

  it('más corriente, más reacciones en el mismo tiempo', () => {
    const a = new MundoAtomico(base), b = new MundoAtomico(base);
    correr(a, 20, { ...base, I: 1e-4 });
    correr(b, 20, { ...base, I: 1e-2 });
    expect(b.oxidaciones).toBeGreaterThan(a.oxidaciones);
  });

  it('los iones de cada lado siguen la concentración del modelo', () => {
    const m = new MundoAtomico(base);
    correr(m, 8, { ...base, cerrado: false });
    expect(Math.abs(m.cuenta('Zn2', 'an') - ionesPorConcentracion(1))).toBeLessThanOrEqual(2);
    expect(Math.abs(m.cuenta('Cu2', 'ca') - ionesPorConcentracion(1))).toBeLessThanOrEqual(2);
    const diluido = { ...base, cerrado: false, cCa: 1e-3 };
    correr(m, 30, diluido);
    expect(m.cuenta('Cu2', 'ca')).toBeLessThanOrEqual(ionesPorConcentracion(1e-3) + 1);
  });

  it('todas las partículas libres quedan dentro de su disolución', () => {
    const m = new MundoAtomico(base);
    correr(m, 15, base);
    for (const p of m.particulas.filter((x) => x.fase === 'libre')) {
      const xr = p.lado === 'an' ? GEO.xAnodo : GEO.xCatodo;
      expect(p.p[0]).toBeGreaterThanOrEqual(xr[0] - 1e-6);
      expect(p.p[0]).toBeLessThanOrEqual(xr[1] + 1e-6);
      expect(p.p[1]).toBeGreaterThanOrEqual(GEO.y[0]);
      expect(p.p[1]).toBeLessThanOrEqual(GEO.y[1]);
    }
  });

  it('el cable une lo alto de los dos electrodos y los e⁻ recorren su ruta', () => {
    expect(CABLE[0][0]).toBeLessThan(GEO.xZn);
    expect(CABLE[CABLE.length - 1][0]).toBeGreaterThan(GEO.xCu);
    const m = new MundoAtomico(base);
    correr(m, 2, base);
    for (const el of m.electrones) {
      const p = puntoRuta(el);
      expect(p.every(Number.isFinite)).toBe(true);
    }
    const v = rotar([0, 0, Math.SQRT1_2, Math.SQRT1_2], [1, 0, 0]);
    expect(v[0]).toBeCloseTo(0, 6);
    expect(v[1]).toBeCloseTo(1, 6);
  });
});
