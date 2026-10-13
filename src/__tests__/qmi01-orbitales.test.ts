/**
 * Q1 · Construcción atómica — física del modelo cuántico (qmi01/orbitales.ts).
 *
 * Lo que se comprueba es lo que un profesor de química vería mal en pantalla:
 *  - que las funciones de onda estén NORMALIZADAS (∫P(r)dr = 1, integrando con
 *    Simpson, no con la forma cerrada que usa el módulo);
 *  - que ⟨r⟩ numérico coincida con a₀[3n² − l(l+1)]/(2Z) para 1s, 2s y 2p;
 *  - que las Z_eff de Slater sean las de la tabla (C 2p 3,25; O 2p 4,55; Ne 2p 5,85…)
 *    también en iones, y que el catión salga más pequeño y el anión más grande;
 *  - el orden de llenado (Aufbau), Hund (desapareados) y Pauli para Z = 1…10 y para
 *    cationes/aniones;
 *  - que la nube de puntos sea una muestra de |ψ|² (radio medio, fase, nodo) y que la
 *    superficie de isodensidad encierre de verdad el 90 % de esas muestras.
 */
import {
  A0_PM, ORBITALES, ORDEN_LLENADO, DEF, configurar, desapareados, textoConfiguracion, zEfectiva,
  radial, densidadRadial, radioMedio, radioMasProbable, psi, cdfRadial, invertirCdf, densidadRadialRho,
  muestrearOrbital, isodensidad, dentroIsodensidad, radioNuclearFm, estadoAtomo, densidadRadialTotal,
  type IdOrbital,
} from '@/components/simuladores/qmi01/orbitales';

/** Simpson compuesto en [a, b] con n (par) intervalos. */
function simpson(f: (x: number) => number, a: number, b: number, n = 20000): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

const NL: Record<IdOrbital, [number, number]> = { '1s': [1, 0], '2s': [2, 0], '2px': [2, 1], '2py': [2, 1], '2pz': [2, 1] };

describe('normalización de la densidad radial P(r) = r²R²', () => {
  for (const id of ['1s', '2s', '2pz'] as IdOrbital[]) {
    for (const Z of [1, 1.3, 3.25, 5.85, 9.7]) {
      it(`∫P dr = 1 · ${id} con Z_eff = ${Z}`, () => {
        const [n, l] = NL[id];
        const I = simpson((r) => densidadRadial(n, l, Z, r), 0, 60 / Z);
        expect(I).toBeCloseTo(1, 8);
      });
    }
  }
  it('la densidad radial en ρ también integra 1 (independiente de Z)', () => {
    for (const id of ['1s', '2s', '2pz'] as IdOrbital[]) expect(simpson((r) => densidadRadialRho(id, r), 0, 80)).toBeCloseTo(1, 8);
  });
  it('|ψ|² integra 1 en 3D (cuadratura en esféricas) para 2pₓ', () => {
    // ∫∫ |ψ|² r² dr dΩ con ψ evaluada en cartesianas: comprueba también la parte angular
    const Z = 3.25, Nr = 400, Nu = 60, Nphi = 32, rmax = 40 / Z;
    let s = 0;
    for (let i = 0; i < Nr; i++) {
      const r = ((i + 0.5) / Nr) * rmax;
      for (let j = 0; j < Nu; j++) {
        const u = -1 + ((j + 0.5) / Nu) * 2, st = Math.sqrt(1 - u * u);
        for (let k = 0; k < Nphi; k++) {
          const ph = ((k + 0.5) / Nphi) * 2 * Math.PI;
          const p = psi('2px', Z, r * st * Math.cos(ph), r * st * Math.sin(ph), r * u);
          s += p * p * r * r;
        }
      }
    }
    s *= (rmax / Nr) * (2 / Nu) * ((2 * Math.PI) / Nphi);
    expect(s).toBeCloseTo(1, 3);
  });
});

describe('⟨r⟩ hidrogenoide = a₀[3n² − l(l+1)]/(2Z)', () => {
  for (const id of ['1s', '2s', '2pz'] as IdOrbital[]) {
    for (const Z of [1, 2.7, 4.55]) {
      it(`${id} con Z_eff = ${Z}`, () => {
        const [n, l] = NL[id];
        const num = simpson((r) => r * densidadRadial(n, l, Z, r), 0, 70 / Z);
        expect(num).toBeCloseTo(radioMedio(n, l, Z), 7);
      });
    }
  }
  it('valores de referencia: 1s 1,5 a₀/Z, 2s 6 a₀/Z, 2p 5 a₀/Z', () => {
    expect(radioMedio(1, 0, 1)).toBe(1.5);
    expect(radioMedio(2, 0, 1)).toBe(6);
    expect(radioMedio(2, 1, 1)).toBe(5);
  });
  it('radio más probable = máximo de P(r): 1s 1/Z, 2s (3+√5)/Z, 2p 4/Z', () => {
    for (const id of ['1s', '2s', '2pz'] as IdOrbital[]) {
      const [n, l] = NL[id];
      const Z = 2.3;
      let best = 0, rb = 0;
      for (let r = 0.0005; r < 20; r += 0.0005) { const p = densidadRadial(n, l, Z, r); if (p > best) { best = p; rb = r; } }
      expect(rb).toBeCloseTo(radioMasProbable(id, Z), 3);
    }
  });
  it('nodo radial del 2s en r = 2a₀/Z y R₂ₛ cambia de signo', () => {
    const Z = 1.95;
    expect(radial(2, 0, Z, 2 / Z)).toBeCloseTo(0, 12);
    expect(radial(2, 0, Z, 1.9 / Z)).toBeGreaterThan(0);
    expect(radial(2, 0, Z, 2.1 / Z)).toBeLessThan(0);
  });
  it('la CDF radial cerrada coincide con la integral numérica', () => {
    for (const id of ['1s', '2s', '2pz'] as IdOrbital[]) {
      for (const x of [0.5, 2, 4.4, 9]) {
        expect(cdfRadial(id, x)).toBeCloseTo(simpson((r) => densidadRadialRho(id, r), 0, x, 4000), 9);
      }
      // la inversa (lo que usa el muestreo); en el nodo del 2s (ρ = 2) la densidad es 0 y la
      // inversa está mal condicionada: se prueba fuera de él
      for (const x of [0.37, 1.3, 4.4, 9, 17.25]) expect(invertirCdf(id, cdfRadial(id, x))).toBeCloseTo(x, 8);
    }
  });
});

describe('Z_eff de Slater', () => {
  // Tabla de libro (reglas de Slater, electrón de valencia):
  const TABLA: [string, number, number, IdOrbital, number][] = [
    ['H 1s', 1, 1, '1s', 1.0],
    ['He 1s', 2, 2, '1s', 1.7],
    ['Li 2s', 3, 3, '2s', 1.3],
    ['Be 2s', 4, 4, '2s', 1.95],
    ['B 2p', 5, 5, '2px', 2.6],
    ['C 2p', 6, 6, '2px', 3.25],
    ['N 2p', 7, 7, '2px', 3.9],
    ['O 2p', 8, 8, '2px', 4.55],
    ['F 2p', 9, 9, '2px', 5.2],
    ['Ne 2p', 10, 10, '2px', 5.85],
    ['C 1s', 6, 6, '1s', 5.7],
    ['Ne 1s', 10, 10, '1s', 9.7],
    // iones
    ['Li⁺ 1s', 3, 2, '1s', 2.7],
    ['He²⁺ (α): sin electrones, uno añadido al 1s ve Z = 2', 2, 0, '1s', 2.0],
    ['C⁺ 2p', 6, 5, '2px', 3.6],
    ['O²⁻ 2p', 8, 10, '2px', 3.85],
    ['F⁻ 2p', 9, 10, '2px', 4.85],
    ['H⁻ 1s', 1, 2, '1s', 0.7],
  ];
  for (const [nombre, Z, e, id, esperado] of TABLA) {
    it(`${nombre} = ${esperado}`, () => {
      expect(zEfectiva(Z, configurar(e), id)).toBeCloseTo(esperado, 10);
    });
  }
  it('2s y 2p comparten Z_eff (Slater los agrupa)', () => {
    const c = configurar(6); // 1s² 2s² 2pₓ¹ 2p_y¹: ambos ocupados
    expect(zEfectiva(6, c, '2s')).toBeCloseTo(zEfectiva(6, c, '2px'), 12);
    // un orbital VACÍO da la Z_eff de un electrón añadido: ve a los 4 de n = 2
    expect(zEfectiva(6, c, '2pz')).toBeCloseTo(6 - 4 * 0.35 - 2 * 0.85, 12);
  });
  it('catión más pequeño, anión más grande (⟨r⟩ de la capa externa)', () => {
    const neutro = estadoAtomo(9, 9).radioPm!, anion = estadoAtomo(9, 10).radioPm!;
    expect(anion).toBeGreaterThan(neutro);
    const C = estadoAtomo(6, 6).radioPm!, Cmas = estadoAtomo(6, 5).radioPm!;
    expect(Cmas).toBeLessThan(C);
    // el orbital ocupado de mayor ⟨r⟩ del C es el 2s: 6/Z_eff = 6/3,25 a₀ = 97,7 pm
    // (Slater da a 2s y 2p la misma Z_eff y ⟨r⟩₂ₛ = 6/Z > ⟨r⟩₂ₚ = 5/Z)
    expect(C).toBeCloseTo((6 / 3.25) * A0_PM, 9);
    expect(estadoAtomo(6, 6).orbitales.find((o) => o.def.id === '2px')!.rMedio).toBeCloseTo(5 / 3.25, 12);
    // Li⁺ pierde la capa L entera: de ⟨r⟩₂ₛ = 6/1,3 a₀ (244 pm) a ⟨r⟩₁ₛ = 1,5/2,7 a₀ (29 pm)
    expect(estadoAtomo(3, 3).radioPm!).toBeCloseTo((6 / 1.3) * A0_PM, 9);
    expect(estadoAtomo(3, 2).radioPm!).toBeCloseTo((1.5 / 2.7) * A0_PM, 9);
  });
  it('sin protones o con demasiados electrones el modelo no liga (Z_eff ≤ 0)', () => {
    expect(estadoAtomo(0, 2).noLigados).toBe(2);
    const H2m = estadoAtomo(1, 3); // H²⁻: el 2s ve Z_eff = 1 − 2·0,85 = −0,7
    expect(H2m.noLigados).toBe(1);
    expect(H2m.orbitales.find((o) => o.def.id === '2s')!.zEff).toBeCloseTo(-0.7, 12);
    expect(estadoAtomo(8, 10).noLigados).toBe(0);
  });
});

describe('llenado: Aufbau, Hund y Pauli', () => {
  const ESPERADO: Record<number, string> = {
    0: 'Vacío', 1: '1s¹', 2: '1s²', 3: '1s² 2s¹', 4: '1s² 2s²', 5: '1s² 2s² 2p¹', 6: '1s² 2s² 2p²',
    7: '1s² 2s² 2p³', 8: '1s² 2s² 2p⁴', 9: '1s² 2s² 2p⁵', 10: '1s² 2s² 2p⁶',
  };
  const DESAP = [0, 1, 0, 1, 0, 1, 2, 3, 2, 1, 0];
  for (let e = 0; e <= 10; e++) {
    it(`${e} e⁻ → ${ESPERADO[e]} con ${DESAP[e]} desapareados`, () => {
      expect(textoConfiguracion(e)).toBe(ESPERADO[e]);
      const c = configurar(e);
      expect(desapareados(c)).toBe(DESAP[e]);
      // Pauli: ≤ 2 por orbital y, si hay 2, espines opuestos
      for (const o of ORBITALES) {
        expect(c[o.id].length).toBeLessThanOrEqual(2);
        if (c[o.id].length === 2) expect(c[o.id][0] + c[o.id][1]).toBe(0);
      }
    });
  }
  it('Hund: los tres 2p se ocupan con ↑ antes de aparear ninguno', () => {
    const c7 = configurar(7);
    expect([c7['2px'], c7['2py'], c7['2pz']]).toEqual([[1], [1], [1]]);
    const c8 = configurar(8);
    expect([c8['2px'], c8['2py'], c8['2pz']]).toEqual([[1, -1], [1], [1]]);
    // el 2p no empieza hasta llenar el 2s (Aufbau)
    expect(configurar(4)['2px']).toEqual([]);
    expect(configurar(3)['2s']).toEqual([1]);
  });
  it('quitar un electrón saca el último que entró (el de mayor energía)', () => {
    const rango = (id: IdOrbital) => (DEF[id].n === 1 ? 0 : DEF[id].l === 0 ? 1 : 2);
    for (let e = 1; e <= 10; e++) {
      const a = configurar(e), b = configurar(e - 1);
      const dif = ORBITALES.filter((o) => a[o.id].length !== b[o.id].length);
      expect(dif).toHaveLength(1);
      const quitado = dif[0].id;
      // ningún orbital ocupado de b es de mayor energía que el que se quitó
      for (const o of ORBITALES) if (a[o.id].length > 0) expect(rango(o.id)).toBeLessThanOrEqual(rango(quitado));
      expect(ORDEN_LLENADO[e - 1].orbital).toBe(quitado);
    }
  });
  it('iones: catión y anión siguen la misma secuencia', () => {
    expect(estadoAtomo(3, 2).texto).toBe('1s²');           // Li⁺
    expect(estadoAtomo(8, 10).texto).toBe('1s² 2s² 2p⁶');  // O²⁻
    expect(estadoAtomo(9, 10).texto).toBe('1s² 2s² 2p⁶');  // F⁻
    expect(estadoAtomo(2, 0).texto).toBe('Vacío');         // He²⁺ (α)
    expect(estadoAtomo(7, 6).desapareados).toBe(2);        // N⁺ = 2p² con dos ↑
    expect(estadoAtomo(8, 7).desapareados).toBe(3);        // O⁺ = 2p³ con tres ↑
    expect(estadoAtomo(6, 6).carga).toBe(0);
    expect(estadoAtomo(8, 10).carga).toBe(-2);
  });
});

describe('nube de puntos: muestra de |ψ|²', () => {
  const N = 30000;
  for (const [id, rmed] of [['1s', 1.5], ['2s', 6], ['2px', 5], ['2pz', 5]] as [IdOrbital, number][]) {
    it(`${id}: ⟨ρ⟩ de las muestras = ${rmed}`, () => {
      const m = muestrearOrbital(id, N, 7);
      let s = 0;
      for (let i = 0; i < N; i++) s += Math.hypot(m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]);
      expect(Math.abs(s / N - rmed)).toBeLessThan(0.05);
    });
  }
  it('la fase de cada punto es el signo de ψ en ese punto', () => {
    for (const id of ['1s', '2s', '2px', '2py', '2pz'] as IdOrbital[]) {
      const m = muestrearOrbital(id, 3000, 11);
      for (let i = 0; i < m.n; i++) {
        const v = psi(id, 1, m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]);
        if (Math.abs(v) > 1e-9) expect(Math.sign(v)).toBe(m.signo[i]);
      }
    }
  });
  it('2p: la mitad de los puntos en cada lóbulo y ⟨u²⟩ = 3/5 respecto del eje', () => {
    const m = muestrearOrbital('2py', N, 3);
    let pos = 0, u2 = 0;
    for (let i = 0; i < N; i++) {
      const x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2];
      if (y > 0) pos++;
      u2 += (y * y) / (x * x + y * y + z * z);
    }
    expect(Math.abs(pos / N - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(u2 / N - 0.6)).toBeLessThan(0.01);
  });
  it('2s: 5,3 % de la probabilidad dentro del nodo (ρ < 2)', () => {
    const m = muestrearOrbital('2s', N, 5);
    let dentro = 0;
    for (let i = 0; i < N; i++) if (Math.hypot(m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]) < 2) dentro++;
    expect(cdfRadial('2s', 2)).toBeCloseTo(0.052653, 5);
    expect(Math.abs(dentro / N - cdfRadial('2s', 2))).toBeLessThan(0.005);
  });
});

describe('superficie de isodensidad del 90 %', () => {
  it('1s: esfera de ρ = 2,6612 (P(3, 2ρ) = 0,9)', () => {
    const iso = isodensidad('1s');
    expect(iso.radios[0]).toBeCloseTo(2.66116, 4);
    expect(iso.contenido).toBeCloseTo(0.9, 9);
  });
  it('2s: bola interior + cáscara exterior, separadas por el nodo', () => {
    const iso = isodensidad('2s');
    const [a, b, d] = iso.radios;
    expect(a).toBeLessThan(2);
    expect(b).toBeGreaterThan(2);
    expect(d).toBeGreaterThan(4);
    expect(iso.contenido).toBeCloseTo(0.9, 6);
  });
  it('2p: dos lóbulos de revolución que no tocan el núcleo', () => {
    const iso = isodensidad('2pz');
    expect(iso.contenido).toBeCloseTo(0.9, 4);
    const [r0, h0] = iso.perfil[0], [r1, h1] = iso.perfil[iso.perfil.length - 1];
    expect(r0).toBeCloseTo(0, 9); expect(r1).toBeCloseTo(0, 9);
    expect(h0).toBeGreaterThan(0);             // el lóbulo no llega a ρ = 0: el plano nodal pasa por el núcleo
    expect(h1).toBeGreaterThan(h0);
    for (const [r] of iso.perfil) expect(r).toBeGreaterThanOrEqual(0);
    // sin puntos repetidos (un punto doble en el torno = normales nulas)
    for (let i = 1; i < iso.perfil.length; i++) {
      const [ra, ha] = iso.perfil[i - 1], [rb, hb] = iso.perfil[i];
      expect(Math.hypot(rb - ra, hb - ha)).toBeGreaterThan(1e-6);
    }
  });
  for (const id of ['1s', '2s', '2px', '2pz'] as IdOrbital[]) {
    it(`${id}: el 90 % de la NUBE DIBUJADA cae dentro del contorno`, () => {
      const iso = isodensidad(id);
      const m = muestrearOrbital(id, 40000, 21);
      let k = 0;
      for (let i = 0; i < m.n; i++) if (dentroIsodensidad(iso, m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2])) k++;
      expect(Math.abs(k / m.n - 0.9)).toBeLessThan(0.006);
    });
  }
});

describe('núcleo y escalas', () => {
  it('R = 1,2 fm·A^(1/3): ¹²C 2,75 fm; ⁴He 1,90 fm', () => {
    expect(radioNuclearFm(12)).toBeCloseTo(2.7473, 3);
    expect(radioNuclearFm(4)).toBeCloseTo(1.9049, 3);
  });
  it('el átomo es ~10⁴–10⁵ veces mayor que su núcleo', () => {
    for (const [Z, A] of [[1, 1], [6, 12], [10, 20]]) {
      const ratio = (estadoAtomo(Z, Z).radioPm! * 1000) / radioNuclearFm(A);
      expect(ratio).toBeGreaterThan(1e4);
      expect(ratio).toBeLessThan(1e5);
    }
  });
  it('densidad radial total = suma de ocupaciones (integra el número de electrones)', () => {
    const est = estadoAtomo(6, 6);
    const I = simpson((r) => densidadRadialTotal(est.orbitales, r), 0, 40);
    expect(I).toBeCloseTo(6, 6);
  });
});
