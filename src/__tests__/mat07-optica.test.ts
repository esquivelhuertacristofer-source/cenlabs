/**
 * MAT-07 · Ley de Snell — la física del banco óptico (`simuladores/mat07/optica.ts`).
 *
 *  - Snell: casos de libro y la misma respuesta que el validador de dominio.
 *  - Fresnel: R(0) = ((n₁−n₂)/(n₁+n₂))², R → 1 en rasante, Brewster con R_p = 0,
 *    identidad de Abelès a 45° (R_p = R_s²), T = 1 − R contra la fórmula de
 *    amplitudes, y los valores de tabla del vidrio n = 1,5 a 45°.
 *  - Ángulo crítico y reflexión total interna.
 *  - Cauchy ajustado al número de Abbe: n_D exacto, n_F − n_C = (n_D − 1)/V, el BK7
 *    real (Schott) dentro de 5·10⁻⁴, y el sesgo de color acotado para el reto.
 *  - Trazado del banco: conservación de la potencia en cada cara, ángulos de Snell
 *    en los haces, reflexión total sin haz transmitido, Beer–Lambert en la bruma.
 *  - Mediciones: pendiente por el origen = n₂, y el reto se resuelve leyendo θ₂ al
 *    grado con θ₁ ≥ 48°.
 */
import {
  snell, fresnel, transmisionAmplitud, reflectanciaNormal, brewster, anguloCritico, rad, grados,
  cauchyDesdeAbbe, indiceCauchy, indiceA, abbeDe, ABBE_MISTERIO, LAMBDA_C, LAMBDA_D, LAMBDA_F,
  trazarBanco, desdeFase, faseDe, lecturaBanco, pendienteOrigen, puntoMedicion, potenciaEn, longitudHaz,
  colorLambda, BALANCE_BLANCO, ESPECTRO_BLANCO, rgbHaz, LASERES, R_BLOQUE, R_ABERTURA, MU_AIRE,
} from '@/components/simuladores/mat07/optica';
import { anguloRefraccionM7, TOL_M7 } from '@/domain/matematicas';

describe('ley de Snell', () => {
  test('aire → vidrio 1,5 a 30°: θ₂ = asen(1/3) = 19,47°', () => {
    expect(grados(snell(1, 1.5, rad(30))!)).toBeCloseTo(19.4712, 3);
  });
  test('coincide con el validador de dominio en toda la rejilla del reto', () => {
    for (let n = 1.4; n <= 2.0001; n += 0.05) for (let a = 10; a <= 80; a += 7) {
      expect(grados(snell(1, n, rad(a))!)).toBeCloseTo(anguloRefraccionM7(1, n, a)!, 9);
    }
  });
  test('n₁ sen θ₁ = n₂ sen θ₂ en ambos sentidos', () => {
    const t2 = snell(1.5, 1, rad(30))!;
    expect(1.5 * Math.sin(rad(30))).toBeCloseTo(1 * Math.sin(t2), 12);
    expect(grados(t2)).toBeCloseTo(48.5904, 3);
  });
  test('vidrio → aire más allá del crítico: no hay haz refractado', () => {
    expect(snell(1.5, 1, rad(45))).toBeNull();
  });
});

describe('ecuaciones de Fresnel', () => {
  test('incidencia normal: R_s = R_p = ((n₁−n₂)/(n₁+n₂))² (0,04 para el vidrio 1,5)', () => {
    const f = fresnel(1, 1.5, 0);
    expect(f.Rs).toBeCloseTo(0.04, 12);
    expect(f.Rp).toBeCloseTo(0.04, 12);
    expect(reflectanciaNormal(1, 1.5)).toBeCloseTo(0.04, 12);
    expect(fresnel(1, 2.417, 0).R).toBeCloseTo(((1 - 2.417) / (1 + 2.417)) ** 2, 12); // diamante ≈ 17,2 %
    expect(fresnel(1.5, 1, 0).R).toBeCloseTo(0.04, 12); // simétrica a incidencia normal
  });
  test('valores de tabla, vidrio 1,5 a 45°: R_s = 9,20 %, R_p = 0,85 %, R = 5,03 %', () => {
    const f = fresnel(1, 1.5, rad(45));
    expect(f.Rs).toBeCloseTo(0.09204, 4);
    expect(f.Rp).toBeCloseTo(0.00847, 4);
    expect(f.R).toBeCloseTo(0.05025, 4);
  });
  test('identidad de Abelès: a 45°, R_p = R_s² para cualquier n', () => {
    for (const n of [1.333, 1.5, 1.7, 2.417]) {
      const f = fresnel(1, n, rad(45));
      expect(f.Rp).toBeCloseTo(f.Rs * f.Rs, 12);
    }
  });
  test('incidencia rasante: R → 1', () => {
    const f = fresnel(1, 1.5, rad(89.999));
    expect(f.Rs).toBeGreaterThan(0.999);
    expect(f.Rp).toBeGreaterThan(0.999);
    expect(fresnel(1, 1.5, rad(80)).R).toBeCloseTo(0.3877, 4); // crece rápido cerca de la rasante (R_s 53,9 %, R_p 23,7 %)
  });
  test('ángulo de Brewster: tan θ_B = n₂/n₁ y ahí R_p = 0 (también dentro del vidrio)', () => {
    const tb = brewster(1, 1.5);
    expect(grados(tb)).toBeCloseTo(56.3099, 3);
    const f = fresnel(1, 1.5, tb);
    expect(f.Rp).toBeLessThan(1e-25);
    expect(f.Rs).toBeCloseTo(((1.5 ** 2 - 1) / (1.5 ** 2 + 1)) ** 2, 10); // 14,79 %
    const tbi = brewster(1.5, 1);
    expect(grados(tbi)).toBeCloseTo(33.6901, 3);
    expect(fresnel(1.5, 1, tbi).Rp).toBeLessThan(1e-25);
    // en el ángulo de Brewster el haz reflejado y el refractado son perpendiculares
    expect(grados(tb + f.thetaT!)).toBeCloseTo(90, 9);
  });
  test('T = 1 − R coincide con (n₂ cos θₜ / n₁ cos θᵢ)·|t|² (energía conservada)', () => {
    for (const [n1, n2] of [[1, 1.5], [1.5, 1], [1, 2.2]]) for (let a = 0; a < 89; a += 6) {
      const f = fresnel(n1, n2, rad(a));
      const t = transmisionAmplitud(n1, n2, rad(a));
      if (!t) { expect(f.tir).toBe(true); continue; }
      const k = (n2 * Math.cos(f.thetaT!)) / (n1 * Math.cos(rad(a)));
      expect(k * t.ts * t.ts).toBeCloseTo(f.Ts, 10);
      expect(k * t.tp * t.tp).toBeCloseTo(f.Tp, 10);
    }
  });
});

describe('ángulo crítico y reflexión total interna', () => {
  test('sen θ_c = n₂/n₁: vidrio 1,5 → 41,81°, agua 1,333 → 48,61°, diamante → 24,44°', () => {
    expect(grados(anguloCritico(1.5, 1)!)).toBeCloseTo(41.8103, 3);
    expect(grados(anguloCritico(1.333, 1)!)).toBeCloseTo(48.6066, 3);
    expect(grados(anguloCritico(2.417, 1)!)).toBeCloseTo(24.4397, 3);
    expect(anguloCritico(1, 1.5)).toBeNull();
  });
  test('justo por encima del crítico R = 1 y T = 0; justo por debajo sale casi rasante y débil', () => {
    const tc = anguloCritico(1.5, 1)!;
    const sobre = fresnel(1.5, 1, tc + rad(0.01));
    expect(sobre.tir).toBe(true);
    expect(sobre.R).toBe(1);
    expect(sobre.T).toBe(0);
    const bajo = fresnel(1.5, 1, tc - rad(0.01));
    expect(bajo.tir).toBe(false);
    expect(grados(bajo.thetaT!)).toBeGreaterThan(87);
    expect(bajo.T).toBeLessThan(0.3); // la transmisión se apaga al acercarse al crítico
  });
});

describe('dispersión de Cauchy ajustada al número de Abbe', () => {
  test('n(λ_D) = n_D y n_F − n_C = (n_D − 1)/V', () => {
    for (const [nD, V] of [[1.5, 64], [1.333, 55.6], [2.417, 55.5], [1.8, 60]]) {
      const c = cauchyDesdeAbbe(nD, V);
      expect(indiceCauchy(c, LAMBDA_D)).toBeCloseTo(nD, 12);
      expect(indiceCauchy(c, LAMBDA_F) - indiceCauchy(c, LAMBDA_C)).toBeCloseTo((nD - 1) / V, 12);
    }
  });
  test('BK7 (n_D 1,5168, V 64,17) contra Schott: n_F 1,52238, n_C 1,51432, n(405) 1,5302', () => {
    const c = cauchyDesdeAbbe(1.5168, 64.17);
    expect(Math.abs(indiceCauchy(c, LAMBDA_F) - 1.52238)).toBeLessThan(2e-4);
    expect(Math.abs(indiceCauchy(c, LAMBDA_C) - 1.51432)).toBeLessThan(2e-4);
    expect(Math.abs(indiceCauchy(c, 404.66) - 1.53024)).toBeLessThan(5e-4);
  });
  test('dispersión normal: n baja al crecer λ; sin dispersión el aire', () => {
    const lams = [405, 488, 532, 589.29, 650];
    const ns = lams.map((l) => indiceA(1.5, 64, l));
    for (let i = 1; i < ns.length; i++) expect(ns[i]).toBeLessThan(ns[i - 1]);
    expect(indiceA(1, abbeDe(1), 405)).toBe(1);
    expect(abbeDe(1.5)).toBe(64);
    expect(abbeDe(1.73, true)).toBe(ABBE_MISTERIO);
  });
  test('cristal misterioso: con cualquier láser el índice se aleja de n_D menos que la tolerancia', () => {
    let peor = 0;
    for (let n = 1.4; n <= 2.0001; n += 0.01) for (const l of LASERES) {
      if (l.lambdaNm == null) continue;
      peor = Math.max(peor, Math.abs(indiceA(n, ABBE_MISTERIO, l.lambdaNm) - n));
    }
    expect(peor).toBeLessThan(0.03);
    expect(peor).toBeLessThan(TOL_M7);
  });
});

describe('trazado del banco', () => {
  const base = { nD: 1.5, V: 64, pol: 'natural' as const };

  test('fase φ ↔ (sentido, θ₁)', () => {
    expect(desdeFase(35)).toEqual({ sentido: 'aire-bloque', theta1: 35 });
    expect(desdeFase(140)).toEqual({ sentido: 'bloque-aire', theta1: 40 });
    expect(faseDe('bloque-aire', 40)).toBe(140);
    expect(faseDe('aire-bloque', 40)).toBe(40);
  });

  test('aire → bloque: el refractado sale a θ₂ de Snell y la potencia se conserva en la cara plana', () => {
    const { haces, lectura } = trazarBanco({ ...base, fase: 50, laser: 'green' });
    const inc = haces.find((h) => h.tipo === 'incidente')!;
    const refl = haces.find((h) => h.tipo === 'reflejado')!;
    const refr = haces.find((h) => h.tipo === 'refractado')!;
    const pO = potenciaEn(inc, longitudHaz(inc));
    expect(pO).toBeCloseTo(Math.exp(-MU_AIRE * R_ABERTURA), 12);
    expect(refl.p + refr.p).toBeCloseTo(pO, 12);
    const n532 = indiceA(1.5, 64, 532);
    const t2 = grados(Math.atan2(refr.b[0], -refr.b[1]));
    expect(t2).toBeCloseTo(grados(snell(1, n532, rad(50))!), 9);
    expect(lectura.theta2[0]!).toBeCloseTo(t2, 9);
    // el reflejado sale a θ₁ al otro lado de la normal
    expect(grados(Math.atan2(refl.b[0], refl.b[1]))).toBeCloseTo(50, 9);
    expect(refl.p / pO).toBeCloseTo(fresnel(1, n532, rad(50)).R, 12);
    // el refractado llega a la cara curva por la normal: sigue recto al salir
    const sal = haces.find((h) => h.tipo === 'salida')!;
    expect(Math.atan2(sal.b[0], -sal.b[1])).toBeCloseTo(Math.atan2(refr.b[0], -refr.b[1]), 12);
    expect(Math.hypot(...refr.b)).toBeCloseTo(R_BLOQUE, 12);
  });

  test('bloque → aire bajo el crítico: refracta alejándose de la normal; sobre el crítico, sólo reflexión', () => {
    const bajo = trazarBanco({ ...base, fase: 180 - 30, laser: 'red' });
    const refr = bajo.haces.find((h) => h.tipo === 'refractado')!;
    const n650 = indiceA(1.5, 64, 650);
    expect(grados(Math.atan2(refr.b[0], refr.b[1]))).toBeCloseTo(grados(snell(n650, 1, rad(30))!), 9);
    expect(bajo.lectura.tir).toBe(false);
    const sobre = trazarBanco({ ...base, fase: 180 - 45, laser: 'red' });
    expect(sobre.haces.some((h) => h.tipo === 'refractado')).toBe(false);
    expect(sobre.lectura.tir).toBe(true);
    expect(sobre.lectura.R).toBe(1);
    const dentro = sobre.haces.find((h) => h.tipo === 'incidente' && h.medio === 'vidrio')!;
    const reflV = sobre.haces.find((h) => h.tipo === 'reflejado')!;
    expect(reflV.p).toBeCloseTo(potenciaEn(dentro, longitudHaz(dentro)), 12); // R = 1: no se pierde nada
  });

  test('polarización p en el ángulo de Brewster: el haz reflejado desaparece', () => {
    const n532 = indiceA(1.5, 64, 532);
    const tb = grados(brewster(1, n532));
    const { haces } = trazarBanco({ ...base, pol: 'p', fase: tb, laser: 'green' });
    expect(haces.some((h) => h.tipo === 'reflejado')).toBe(false);
    const s = trazarBanco({ ...base, pol: 's', fase: tb, laser: 'green' });
    expect(s.haces.find((h) => h.tipo === 'reflejado')!.p).toBeGreaterThan(0.1);
  });

  test('luz blanca: el violeta se desvía más que el rojo y R + T = 1 en cada muestra', () => {
    const { haces, lectura } = trazarBanco({ ...base, fase: 60, laser: 'white' });
    const refr = haces.filter((h) => h.tipo === 'refractado');
    expect(refr).toHaveLength(ESPECTRO_BLANCO.length);
    const ang = (h: typeof refr[0]) => Math.atan2(h.b[0], -h.b[1]);
    const violeta = refr.find((h) => h.lambdaNm === 410)!, rojo = refr.find((h) => h.lambdaNm === 655)!;
    expect(ang(violeta)).toBeLessThan(ang(rojo)); // más cerca de la normal
    expect(lectura.R + lectura.T).toBeCloseTo(1, 12);
    // cerca del crítico, bloque → aire, el abanico se abre: el violeta se refleja ya y el rojo aún sale
    const tcRojo = grados(anguloCritico(indiceA(1.5, 64, 655), 1)!);
    const casi = trazarBanco({ ...base, fase: 180 - (tcRojo - 0.05), laser: 'white' });
    const sal = casi.haces.filter((h) => h.tipo === 'refractado').map((h) => h.lambdaNm);
    expect(sal).toContain(655);
    expect(sal).not.toContain(410);
  });

  test('Beer–Lambert: P(s) = P₀·e^(−μ s)', () => {
    const { haces } = trazarBanco({ ...base, fase: 40, laser: 'green' });
    const inc = haces[0];
    expect(potenciaEn(inc, 5)).toBeCloseTo(inc.p * Math.exp(-MU_AIRE * 5), 12);
  });

  test('color: la luz blanca suma blanco; cada láser con su tono', () => {
    const { haces } = trazarBanco({ ...base, fase: 40, laser: 'white' });
    const c = rgbHaz(haces[0], true);
    expect(c[0]).toBeCloseTo(c[1], 9);
    expect(c[1]).toBeCloseTo(c[2], 9);
    expect(BALANCE_BLANCO.every((k) => Number.isFinite(k) && k > 0)).toBe(true);
    const verde = colorLambda(532), rojo = colorLambda(650), azul = colorLambda(450);
    expect(verde[1]).toBe(1); expect(rojo[0]).toBe(1); expect(azul[2]).toBe(1);
  });

  test('lectura del fotómetro con luz natural = media de R_s y R_p', () => {
    const l = lecturaBanco({ sentido: 'aire-bloque', theta1: 45, nD: 1.5, V: Infinity, laser: 'green', pol: 'natural' });
    expect(l.R).toBeCloseTo(0.05025, 4);
    expect(l.R).toBeCloseTo((l.Rs + l.Rp) / 2, 12);
  });
});

describe('mediciones del alumno', () => {
  test('la pendiente por el origen de sen θ(aire) frente a sen θ(bloque) es n₂', () => {
    const n = 1.62;
    const pts = [20, 35, 50, 65, 80].map((a) => puntoMedicion('aire-bloque', a, grados(snell(1, n, rad(a))!)));
    expect(pendienteOrigen(pts)!).toBeCloseTo(n, 10);
    const inv = [15, 25, 35].map((a) => puntoMedicion('bloque-aire', a, grados(snell(n, 1, rad(a))!)));
    expect(pendienteOrigen(inv)!).toBeCloseTo(n, 10);
    expect(pendienteOrigen([])).toBeNull();
  });
  test('el reto se resuelve leyendo θ₂ al grado con θ₁ ≥ 48° (láser verde)', () => {
    let peor = 0;
    for (let n = 1.4; n <= 2.0001; n += 0.01) for (let a = 48; a <= 80; a++) {
      const nv = indiceA(n, ABBE_MISTERIO, 532);
      const leido = Math.round(grados(snell(1, nv, rad(a))!));
      peor = Math.max(peor, Math.abs(Math.sin(rad(a)) / Math.sin(rad(leido)) - n));
    }
    expect(peor).toBeLessThanOrEqual(TOL_M7);
  });
});
