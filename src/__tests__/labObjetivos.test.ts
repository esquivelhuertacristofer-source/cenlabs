import { getLabObjetivos, ObjetivosState } from '@/data/labObjetivos';

const base: ObjetivosState = {
  pActual: 0, nActual: 0, eActual: 0,
  targetZ: 0, targetA: 0, targetCharge: 0,
  gases: null, balanceo: null, limitante: null,
  soluciones: null, solubilidad: null, titulacion: null,
  equilibrio: null, celda: null, destilacion: null,
  tiroParabolico: null, planoInclinado: null, pendulo: null, hooke: null,
};

describe('getLabObjetivos', () => {
  it('returns empty array for unknown lab', () => {
    expect(getLabObjetivos('unknown-99', base)).toEqual([]);
    expect(getLabObjetivos('', base)).toEqual([]);
  });

  describe('quimica-1 (Átomo)', () => {
    it('returns 3 objectives', () => {
      expect(getLabObjetivos('quimica-1', base)).toHaveLength(3);
    });

    it('marks completed when pActual === targetZ', () => {
      const s = { ...base, pActual: 6, targetZ: 6, targetA: 14, nActual: 8, eActual: 6 };
      const objs = getLabObjetivos('quimica-1', s);
      expect(objs[0].completed).toBe(true);  // Z correcto
      expect(objs[1].completed).toBe(true);  // A correcto (6+8=14)
      expect(objs[2].completed).toBe(true);  // Carga correcta (6-6=0)
    });

    it('marks incomplete when values differ', () => {
      const s = { ...base, pActual: 3, targetZ: 6 };
      const objs = getLabObjetivos('quimica-1', s);
      expect(objs[0].completed).toBe(false);
    });
  });

  describe('quimica-2 (Gases)', () => {
    it('returns 3 objectives', () => {
      expect(getLabObjetivos('quimica-2', base)).toHaveLength(3);
    });

    it('camera integrity fails when P >= 7', () => {
      const s = { ...base, gases: { V: 10, P: 7.0, pTarget: 2 } };
      const objs = getLabObjetivos('quimica-2', s);
      expect(objs[2].completed).toBe(false);
    });

    it('camera integrity passes when P < 7', () => {
      const s = { ...base, gases: { V: 10, P: 6.9, pTarget: 2 } };
      const objs = getLabObjetivos('quimica-2', s);
      expect(objs[2].completed).toBe(true);
    });
  });

  describe('quimica-5 (Soluciones)', () => {
    it('pesaje marks complete within 0.05g tolerance', () => {
      const mReq = 7.305;
      const s = { ...base, soluciones: { matraz: { polvo: 7.32, agua: 250 }, mRequerida: mReq, vTarget: 250, status: 'idle' } };
      const objs = getLabObjetivos('quimica-5', s);
      expect(objs[0].completed).toBe(true);
    });

    it('pesaje fails outside 0.05g tolerance', () => {
      const s = { ...base, soluciones: { matraz: { polvo: 6.0, agua: 0 }, mRequerida: 7.305, vTarget: 250, status: 'idle' } };
      const objs = getLabObjetivos('quimica-5', s);
      expect(objs[0].completed).toBe(false);
    });
  });

  describe('fisica-1 (Tiro Parabólico)', () => {
    it('returns 3 objectives', () => {
      expect(getLabObjetivos('fisica-1', base)).toHaveLength(3);
    });

    it('precision marks complete on exito', () => {
      const s = { ...base, tiroParabolico: { resultado: 'exito', disparando: false, angulo: 45 } };
      const objs = getLabObjetivos('fisica-1', s);
      expect(objs[1].completed).toBe(true);
    });

    it('alcance marks complete only at 45 degrees', () => {
      const s45 = { ...base, tiroParabolico: { resultado: null, disparando: false, angulo: 45 } };
      const s30 = { ...base, tiroParabolico: { resultado: null, disparando: false, angulo: 30 } };
      expect(getLabObjetivos('fisica-1', s45)[2].completed).toBe(true);
      expect(getLabObjetivos('fisica-1', s30)[2].completed).toBe(false);
    });
  });

  describe('fisica-4 (Hooke)', () => {
    it('returns 3 objectives', () => {
      expect(getLabObjetivos('fisica-4', base)).toHaveLength(3);
    });

    it('carga marks complete when masa > 0', () => {
      const s = { ...base, hooke: { masa: 2.0, estiramiento: 0.5, resultado: null } };
      const objs = getLabObjetivos('fisica-4', s);
      expect(objs[0].completed).toBe(true);
    });
  });

  it('covers all 14 implemented labs', () => {
    const labs = [
      'quimica-1','quimica-2','quimica-3','quimica-4','quimica-5',
      'quimica-6','quimica-7','quimica-8','quimica-9','quimica-10',
      'fisica-1','fisica-2','fisica-3','fisica-4',
    ];
    labs.forEach(id => {
      const objs = getLabObjetivos(id, base);
      expect(objs).toHaveLength(3);
    });
  });
});
