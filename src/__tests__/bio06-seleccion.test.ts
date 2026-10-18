/**
 * B6 · Selección natural — la ciencia de `simuladores/bio06/seleccion.ts`.
 *
 *  - Camuflaje: corteza = mezcla por área de líquenes y hollín; contraste de Michelson; el hollín
 *    con el que las dos formas contrastan igual.
 *  - Depredación calibrada contra la historia: s ≈ 0,47 con la corteza negra (orden de las
 *    recapturas de Kettlewell, 1955) y s ≈ 0,31 con 90 % de hollín (Haldane, 1924).
 *  - Ecuación de la selección p′ = p·w₁/w̄ contra cálculo a mano y contra sus formas cerradas
 *    (selección aditiva, letal recesivo, selección contra el recesivo) y el caso de Mánchester.
 *  - Hardy–Weinberg sin selección; deriva binomial de varianza p(1 − p)/(2N).
 *  - El modelo individual de la escena (sorteo de supervivencia + Wright–Fisher): su media es la
 *    determinista y su varianza neutra ≈ p(1 − p)/(2N·v).
 *  - Fijación: P = p₀ neutral, tiempo de Kimura–Ohta, u(p) de Kimura con selección.
 *  - Reto: la banda neutra usa las funciones del juez y la caza del alumno se recupera del registro.
 */
import {
  ALBEDO, albedoCorteza, contraste, contrasteFenotipo, hollinNeutro, viabilidad, viabilidadesGenotipo, seleccionDe,
  hardyWeinberg, wMedia, wMarginalC, pSiguiente, trayectoriaDeterminista, generacionesHasta, varianzaDeriva,
  tiempoAbsorcionNeutral, tiempoFijacionNeutral, probFijacionKimura, pasoWF, reproducir, poblacionInicial,
  sortearMuertes, frecuenciaSupervivientes, generacionConteo, conteoDe, conteoHW, frecuenciaC, frecuenciaCConteo,
  pronosticar, bandaNeutraReto, supervivenciaRealizada, qEstimada, rngSemilla, binomial, DEPREDACION, type Eficacias,
} from '@/components/simuladores/bio06/seleccion';
import { crearPoblacionB6, selectividadB6, fenotipoConspicuoB6, rngConSemilla, CUOTA_CAZA_B6 } from '@/domain/biologia';

const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const varianza = (xs: number[]) => { const m = media(xs); return xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1); };
const NEUTRO: Eficacias = { CC: 1, Cc: 1, cc: 1 };

describe('camuflaje: albedo y contraste', () => {
  it('la corteza es la mezcla POR ÁREA de líquenes y hollín', () => {
    expect(albedoCorteza(0)).toBeCloseTo(ALBEDO.liquenes, 14);
    expect(albedoCorteza(1)).toBeCloseTo(ALBEDO.hollin, 14);
    expect(albedoCorteza(0.25)).toBeCloseTo(0.75 * ALBEDO.liquenes + 0.25 * ALBEDO.hollin, 14);
    expect(albedoCorteza(2)).toBe(albedoCorteza(1));
  });
  it('contraste de Michelson: simétrico, 0 si iguales, 1 contra el negro', () => {
    expect(contraste(0.3, 0.1)).toBeCloseTo(0.5, 14);
    expect(contraste(0.1, 0.3)).toBeCloseTo(0.5, 14);
    expect(contraste(0.2, 0.2)).toBe(0);
    expect(contraste(0.4, 0)).toBe(1);
  });
  it('sin hollín la typica casi no se ve; con hollín total, la carbonaria', () => {
    expect(contrasteFenotipo('clara', 0)).toBeLessThan(0.03);
    expect(contrasteFenotipo('oscura', 0)).toBeGreaterThan(0.7);
    expect(contrasteFenotipo('oscura', 1)).toBeLessThan(0.05);
    expect(contrasteFenotipo('clara', 1)).toBeGreaterThan(0.7);
  });
  it('existe un hollín neutro donde las dos formas contrastan igual', () => {
    const h = hollinNeutro();
    expect(h).toBeGreaterThan(0.4);
    expect(h).toBeLessThan(0.9);
    expect(contrasteFenotipo('clara', h)).toBeCloseTo(contrasteFenotipo('oscura', h), 9);
    expect(seleccionDe(h, 3).s).toBeLessThan(1e-8);
  });
});

describe('depredación calibrada', () => {
  it('v = e^(−λ·aves·(c₀ + C)) y sin aves no hay selección', () => {
    const c = contrasteFenotipo('clara', 0.6);
    expect(viabilidad('clara', 0.6, 2)).toBeCloseTo(Math.exp(-DEPREDACION.lambdaPorAve * 2 * (DEPREDACION.c0 + c)), 14);
    const s0 = seleccionDe(0.9, 0);
    expect(s0.s).toBe(0);
    expect(s0.favorecido).toBeNull();
    expect(viabilidadesGenotipo(0.9, 0)).toEqual({ CC: 1, Cc: 1, cc: 1 });
  });
  it('corteza negra y 3 aves: la typica sobrevive ≈ la mitad que la carbonaria (Kettlewell 1955)', () => {
    const s = seleccionDe(1, 3);
    expect(s.favorecido).toBe('oscura');
    expect(s.s).toBeGreaterThan(0.44);
    expect(s.s).toBeLessThan(0.5);
  });
  it('90 % de hollín y 3 aves: s ≈ 0,31, el valor de Haldane (1924) para Mánchester', () => {
    const s = seleccionDe(0.9, 3);
    expect(s.s).toBeGreaterThan(0.28);
    expect(s.s).toBeLessThan(0.34);
  });
  it('corteza limpia: la favorecida es la clara; la selección crece con el número de aves', () => {
    expect(seleccionDe(0, 2).favorecido).toBe('clara');
    expect(seleccionDe(0, 1).s).toBeLessThan(seleccionDe(0, 2).s);
    expect(seleccionDe(0, 2).s).toBeLessThan(seleccionDe(0, 3).s);
    // con C dominante, CC y Cc comparten la viabilidad del fenotipo oscuro
    const v = viabilidadesGenotipo(0.3, 2);
    expect(v.CC).toBe(v.Cc);
    expect(v.cc).toBeCloseTo(viabilidad('clara', 0.3, 2), 14);
  });
});

describe('ecuación de la selección p′ = p·w₁/w̄', () => {
  it('contra el cálculo a mano', () => {
    const w: Eficacias = { CC: 1, Cc: 1, cc: 0.65 };
    // w̄ = 0,01 + 0,18 + 0,81·0,65 = 0,7165; w₁ = 0,1 + 0,9 = 1
    expect(wMedia(0.1, w)).toBeCloseTo(0.7165, 14);
    expect(wMarginalC(0.1, w)).toBeCloseTo(1, 14);
    expect(pSiguiente(0.1, w)).toBeCloseTo(0.1 / 0.7165, 14);
    // la eficacia absoluta o la relativa dan la misma p′
    expect(pSiguiente(0.37, { CC: 0.5, Cc: 0.4, cc: 0.2 })).toBeCloseTo(pSiguiente(0.37, { CC: 1, Cc: 0.8, cc: 0.4 }), 14);
  });
  it('selección aditiva multiplicativa: odds(p_t) = odds(p₀)·(1 + s)^t', () => {
    const s = 0.07, p0 = 0.02;
    const t = trayectoriaDeterminista(p0, { CC: (1 + s) ** 2, Cc: 1 + s, cc: 1 }, 60);
    for (const g of [1, 10, 30, 60]) expect(t[g] / (1 - t[g])).toBeCloseTo((p0 / (1 - p0)) * (1 + s) ** g, 9);
  });
  it('letal recesivo: q_t = q₀/(1 + t·q₀) exactamente', () => {
    const q0 = 0.4;
    const t = trayectoriaDeterminista(1 - q0, { CC: 1, Cc: 1, cc: 0 }, 50);
    for (let g = 0; g <= 50; g++) expect(1 - t[g]).toBeCloseTo(q0 / (1 + g * q0), 12);
  });
  it('contra el recesivo: q′ = q(1 − s·q)/(1 − s·q²)', () => {
    for (const [q, s] of [[0.7, 0.3], [0.2, 0.9], [0.95, 0.05]]) {
      expect(1 - pSiguiente(1 - q, { CC: 1, Cc: 1, cc: 1 - s })).toBeCloseTo((q * (1 - s * q)) / (1 - s * q * q), 14);
    }
  });
  it('Mánchester (Haldane 1924): con s = 1/3 la forma oscura pasa de 1 % a 99 % en ≈ 47 generaciones', () => {
    const w = { CC: 1, Cc: 1, cc: 2 / 3 };
    const pIni = 1 - Math.sqrt(0.99); // 1 % oscuras = 1 − q²
    const pFin = 1 - Math.sqrt(0.01); // 99 % oscuras
    const g = generacionesHasta(pIni, w, pFin);
    expect(g).toBeGreaterThanOrEqual(40);
    expect(g).toBeLessThanOrEqual(50);
  });
  it('el alelo dominante favorecido se frena al final: el recesivo se esconde en los Cc', () => {
    const w = viabilidadesGenotipo(0.9, 3);
    const t = trayectoriaDeterminista(0.05, w, 200);
    const sube = (a: number, b: number) => t[b] - t[a];
    expect(sube(0, 10)).toBeGreaterThan(sube(60, 70) * 5);
    expect(t[200]).toBeLessThan(0.999); // q ≈ 1/(s·t): no llega a fijarse
  });
});

describe('Hardy–Weinberg y deriva', () => {
  it('sin selección p no cambia y las frecuencias son p², 2pq, q²', () => {
    for (const p of [0.05, 0.3, 0.5, 0.91]) {
      expect(pSiguiente(p, NEUTRO)).toBeCloseTo(p, 14);
      expect(pSiguiente(p, { CC: 0.6, Cc: 0.6, cc: 0.6 })).toBeCloseTo(p, 14);
      const [a, b, c] = hardyWeinberg(p);
      expect(a + b + c).toBeCloseTo(1, 14);
      expect(b).toBeCloseTo(2 * p * (1 - p), 14);
    }
  });
  it('los hijos de Wright–Fisher salen en proporciones de Hardy–Weinberg (χ² < 13,8)', () => {
    const rng = rngSemilla(11);
    const p = 0.3, N = 20000;
    const c = conteoDe(reproducir(p, N, rng));
    const esp = hardyWeinberg(p).map((f) => f * N);
    const chi = [c.CC, c.Cc, c.cc].reduce((s, o, i) => s + (o - esp[i]) ** 2 / esp[i], 0);
    expect(chi).toBeLessThan(13.8);
  });
  it('varianza de la deriva = p(1 − p)/(2N) y media = p (muestreo binomial de 2N copias)', () => {
    const rng = rngSemilla(5);
    const p = 0.3, N = 50, R = 12000;
    const ps = Array.from({ length: R }, () => frecuenciaC(reproducir(p, N, rng)));
    expect(media(ps)).toBeCloseTo(p, 2);
    expect(Math.abs(varianza(ps) / varianzaDeriva(p, 2 * N) - 1)).toBeLessThan(0.05);
    // el binomial del Wright–Fisher clásico, igual
    const rng2 = rngSemilla(6);
    const qs = Array.from({ length: R }, () => pasoWF(p, N, NEUTRO, rng2));
    expect(Math.abs(varianza(qs) / varianzaDeriva(p, 2 * N) - 1)).toBeLessThan(0.05);
    expect(binomial(10, 0, rng)).toBe(0);
    expect(binomial(10, 1, rng)).toBe(10);
  });
  it('modelo individual neutro: media p exacta y varianza ≈ p(1 − p)/(2N·v) (sólo los supervivientes dejan genes)', () => {
    const rng = rngSemilla(21);
    const N = 100, v = 0.6, R = 20000;
    const inicio = { CC: 25, Cc: 50, cc: 25 };
    const ps = Array.from({ length: R }, () => frecuenciaCConteo(generacionConteo(inicio, { CC: v, Cc: v, cc: v }, N, rng)));
    expect(media(ps)).toBeCloseTo(0.5, 2);
    expect(Math.abs(varianza(ps) / (0.25 / (2 * N * v)) - 1)).toBeLessThan(0.05);
  });
  it('la escena (sorteo polilla a polilla) y el conteo son el mismo proceso', () => {
    const N = 40, R = 8000;
    const v = viabilidadesGenotipo(0.9, 3);
    const gs = poblacionInicial(0.2, N, rngSemilla(1));
    const r1 = rngSemilla(31), r2 = rngSemilla(32);
    const a = Array.from({ length: R }, () => {
      const m = sortearMuertes(gs, v, r1);
      return frecuenciaC(reproducir(frecuenciaSupervivientes(gs, m), N, r1));
    });
    const b = Array.from({ length: R }, () => frecuenciaCConteo(generacionConteo(conteoDe(gs), v, N, r2)));
    expect(Math.abs(media(a) - media(b))).toBeLessThan(0.005);
    expect(Math.abs(varianza(a) / varianza(b) - 1)).toBeLessThan(0.08);
  });
});

describe('muchas réplicas: la media es la determinista', () => {
  it('con selección (90 % de hollín, 3 aves, N = 1000) la media de 150 réplicas sigue a p′ = p·w₁/w̄', () => {
    const v = viabilidadesGenotipo(0.9, 3);
    const pr = pronosticar({ inicio: conteoHW(0.05, 1000), v, N: 1000, horizonte: 20, replicas: 150, semilla: 3 });
    let peor = 0;
    for (let g = 0; g <= 20; g++) peor = Math.max(peor, Math.abs(pr.cuantiles[g].media - pr.det[g]));
    expect(peor).toBeLessThan(0.012);
    expect(pr.det[20]).toBeGreaterThan(0.3);
    // y la banda de deriva rodea a la determinista
    for (let g = 1; g <= 20; g++) {
      expect(pr.cuantiles[g].p05).toBeLessThanOrEqual(pr.det[g] + 1e-9);
      expect(pr.cuantiles[g].p95).toBeGreaterThanOrEqual(pr.det[g] - 1e-9);
    }
  });
  it('neutral: la media no se mueve y la banda se ensancha como la deriva acumulada', () => {
    const N = 40;
    const pr = pronosticar({ inicio: conteoHW(0.5, N), v: NEUTRO, N, horizonte: 10, replicas: 3000, semilla: 4 });
    expect(Math.abs(pr.cuantiles[10].media - 0.5)).toBeLessThan(0.01);
    // Var(p_t) = p₀q₀[1 − (1 − 1/2N)^t]
    const sd10 = Math.sqrt(0.25 * (1 - (1 - 1 / (2 * N)) ** 10));
    expect((pr.cuantiles[10].p95 - pr.cuantiles[10].p05) / (2 * 1.645 * sd10)).toBeGreaterThan(0.9);
    expect((pr.cuantiles[10].p95 - pr.cuantiles[10].p05) / (2 * 1.645 * sd10)).toBeLessThan(1.1);
    expect(pr.det.every((p) => Math.abs(p - 0.5) < 1e-14)).toBe(true);
  });
});

describe('fijación', () => {
  const hastaAbsorber = (p0: number, N: number, w: Eficacias, rng: () => number) => {
    let p = p0, t = 0;
    while (p > 0 && p < 1) { p = pasoWF(p, N, w, rng); t++; }
    return { fija: p >= 1, t };
  };
  it('neutral: P(fijar) = p₀', () => {
    const rng = rngSemilla(41);
    const R = 2500;
    const f = Array.from({ length: R }, () => hastaAbsorber(0.3, 20, NEUTRO, rng).fija).filter(Boolean).length / R;
    expect(Math.abs(f - 0.3)).toBeLessThan(0.03);
  });
  it('neutral: tiempo medio de absorción = −4N[p ln p + q ln q] (Kimura y Ohta 1969)', () => {
    const rng = rngSemilla(42);
    const N = 20, R = 2000;
    const t = media(Array.from({ length: R }, () => hastaAbsorber(0.5, N, NEUTRO, rng).t));
    expect(tiempoAbsorcionNeutral(0.5, N)).toBeCloseTo(4 * N * Math.LN2, 12);
    expect(Math.abs(t / tiempoAbsorcionNeutral(0.5, N) - 1)).toBeLessThan(0.07);
    expect(tiempoFijacionNeutral(0.5, N)).toBeCloseTo(4 * N * Math.LN2, 12);
  });
  it('con selección aditiva: u(p) = (1 − e^(−4Nsp))/(1 − e^(−4Ns)) (Kimura 1962)', () => {
    const rng = rngSemilla(43);
    const N = 50, s = 0.02, p0 = 0.1, R = 2500;
    const w = { CC: 1 + 2 * s, Cc: 1 + s, cc: 1 };
    const u = probFijacionKimura(p0, N, s);
    expect(u).toBeCloseTo((1 - Math.exp(-0.4)) / (1 - Math.exp(-4)), 12);
    const f = Array.from({ length: R }, () => hastaAbsorber(p0, N, w, rng).fija).filter(Boolean).length / R;
    expect(Math.abs(f - u)).toBeLessThan(0.03);
    expect(probFijacionKimura(0.2, 50, 0)).toBe(0.2);
  });
});

describe('el reto', () => {
  it('la caza del alumno se recupera EXACTA del registro del juez (selectividad)', () => {
    const rng = rngConSemilla(9);
    for (let k = 0; k < 200; k++) {
      const amb = k % 2 ? 'industrial' : 'limpio';
      const bugs = crearPoblacionB6(0.15 + 0.7 * rng(), 40, rng);
      const consp = fenotipoConspicuoB6(amb);
      // un ave sesgada: elige primero conspicuas con probabilidad 0,7
      const orden = bugs.map((b, i) => ({ i, k: (b.tipo === consp ? 0.7 : 0.3) * rng() })).sort((a, b) => b.k - a.k);
      const caz = new Set(orden.slice(0, CUOTA_CAZA_B6).map((o) => o.i));
      const marcadas = bugs.map((b, i) => ({ ...b, cazada: caz.has(i) }));
      const sigma = selectividadB6(marcadas, amb);
      const fC = bugs.filter((b) => b.tipo === consp).length / bugs.length;
      const r = supervivenciaRealizada(fC, sigma);
      expect(r.cazadasConspicuas).toBe(marcadas.filter((b) => b.cazada && b.tipo === consp).length);
    }
  });
  it('banda neutra: caza al azar con las funciones del juez, contiene la q inicial y se ensancha', () => {
    const banda = bandaNeutraReto({ pC0: 0.3, generaciones: 6, replicas: 600, semilla: 5 });
    const q0 = 0.7; // q estimada de partida (HW): √q² = q
    expect(banda[0].p05).toBeLessThanOrEqual(q0 + 0.08);
    expect(banda[0].p95).toBeGreaterThanOrEqual(q0 - 0.08);
    expect(banda[6].p95 - banda[6].p05).toBeGreaterThan(banda[1].p95 - banda[1].p05);
    expect(qEstimada(0.49)).toBeCloseTo(0.7, 14);
    // la banda no dice qué fenotipo conviene: su mediana apenas se mueve
    expect(Math.abs(banda[6].p50 - banda[0].p50)).toBeLessThan(0.06);
  });
});
