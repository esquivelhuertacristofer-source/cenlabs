/**
 * fisica-9 (ley de Coulomb) — la física que dibuja el banco 3D y el dock.
 * Módulo puro: src/components/simuladores/fis09/campo.ts.
 */
import { K_COULOMB, CARGAS_UC, fuerzaCoulomb } from '@/domain/fisica';
import {
  EPSILON_0, LINEAS_POR_MICROC, R_ESFERA_CM, campoSI, potencialSI, fuerzaSobre, flujoEsfera,
  cargasBanco, campoEje, potencialEje, corrienteEje, fuerzaAxial, semillasFibonacci, destinoAnalitico,
  cosAsintotico, resumenGauss, integrarLinea, lineasDeCampo, nivelesEquipotenciales, puntoSilla,
  esferaPotencialCero, perfilesEquipotencial, escalaEncuadre, fraccionFlecha, cargaMaximaEnAire,
  fmtNum, fmtFuerza, E_SI_POR_REDUCIDO, V_SI_POR_REDUCIDO, trayectoriaSonda, superposicionEn, type CargaPuntual, type V3,
} from '@/components/simuladores/fis09/campo';
import { dibujarGraficaFr, fuerza, type Ctx2D, type DatosGrafica } from '@/components/simuladores/fis09/grafica';
import { crearRelojCampo } from '@/components/simuladores/fis09/reloj';

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

// ───────────────────────────── Coulomb ─────────────────────────────
describe('Ley de Coulomb', () => {
  it('valores de referencia: ±1 μC a 10 cm → 0,8988 N; +2/−3 μC a 12 cm → 3,745 N', () => {
    expect(Math.abs(fuerzaAxial(cargasBanco(1, 1, 10), 1))).toBeCloseTo(0.89876, 4);
    expect(Math.abs(fuerzaAxial(cargasBanco(2, -3, 12), 1))).toBeCloseTo(K_COULOMB * 6e-12 / 0.0144, 9);
    expect(Math.abs(fuerzaAxial(cargasBanco(2, -3, 12), 1))).toBeCloseTo(3.7448, 3);
  });

  it('coincide con el validador del dominio en TODO el espacio del reto (12 × 12 cargas × 39 distancias)', () => {
    let peor = 0;
    for (const q1 of CARGAS_UC) for (const q2 of CARGAS_UC) for (let r = 2; r <= 40; r++) {
      const c = cargasBanco(q1, q2, r);
      peor = Math.max(peor, rel(Math.abs(fuerzaAxial(c, 1)), fuerzaCoulomb(q1, q2, r)));
    }
    expect(peor).toBeLessThan(1e-12);
  });

  it('acción y reacción: F₁₂ = −F₂₁; repulsión empuja q₂ hacia +s, atracción hacia q₁', () => {
    for (const [q1, q2] of [[3, 2], [-4, -1], [5, -6], [-2, 1]]) {
      const c = cargasBanco(q1, q2, 17);
      expect(fuerzaAxial(c, 0)).toBeCloseTo(-fuerzaAxial(c, 1), 12);
      expect(Math.sign(fuerzaAxial(c, 1))).toBe(q1 * q2 > 0 ? 1 : -1);
    }
  });

  it('inverso del cuadrado y proporcionalidad al producto de las cargas', () => {
    const F = (q1: number, q2: number, r: number) => Math.abs(fuerzaAxial(cargasBanco(q1, q2, r), 1));
    expect(F(3, 4, 20) / F(3, 4, 10)).toBeCloseTo(0.25, 12);
    expect(F(3, 4, 30) / F(3, 4, 10)).toBeCloseTo(1 / 9, 12);
    expect(F(6, 4, 10) / F(3, 4, 10)).toBeCloseTo(2, 12);
    expect(F(-6, -2, 10) / F(3, 4, 10)).toBeCloseTo(1, 12);
  });
});

// ───────────────────────────── superposición ─────────────────────────────
describe('Superposición', () => {
  const tres: CargaPuntual[] = [{ q: 2, p: [0, 0, 0] }, { q: -3, p: [12, 0, 0] }, { q: 1.5, p: [5, 7, -3] }];

  it('la fuerza sobre una carga es la suma vectorial de las fuerzas de Coulomb de cada otra', () => {
    const coulombPar = (a: CargaPuntual, b: CargaPuntual): V3 => {
      const d = [0, 1, 2].map((k) => (a.p[k] - b.p[k]) / 100);
      const r = Math.hypot(d[0], d[1], d[2]);
      const f = (K_COULOMB * a.q * 1e-6 * b.q * 1e-6) / (r * r * r);
      return [f * d[0], f * d[1], f * d[2]];
    };
    for (let i = 0; i < 3; i++) {
      const F = fuerzaSobre(tres, i);
      const suma: V3 = [0, 0, 0];
      tres.forEach((b, j) => { if (j !== i) { const f = coulombPar(tres[i], b); for (let k = 0; k < 3; k++) suma[k] += f[k]; } });
      for (let k = 0; k < 3; k++) expect(F[k]).toBeCloseTo(suma[k], 9);
    }
    // la suma de todas las fuerzas internas es cero (tercera ley)
    const tot = [0, 1, 2].map((k) => tres.reduce((a, _, i) => a + fuerzaSobre(tres, i)[k], 0));
    tot.forEach((x) => expect(Math.abs(x)).toBeLessThan(1e-9));
  });

  it('el campo total es la suma de los campos de cada carga', () => {
    const P: V3 = [3, -4, 6];
    const E = campoSI(tres, P);
    const suma = tres.map((c) => campoSI([c], P)).reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]] as V3);
    for (let k = 0; k < 3; k++) expect(rel(E[k], suma[k])).toBeLessThan(1e-12);
  });

  it('dipolo ±q: en el punto medio E = 2kq/(r/2)² y apunta hacia −q', () => {
    const q = 2, r = 10;
    const E = campoSI([{ q, p: [0, 0, 0] }, { q: -q, p: [r, 0, 0] }], [r / 2, 0, 0]);
    expect(rel(E[0], (2 * K_COULOMB * q * 1e-6) / (r / 200) ** 2)).toBeLessThan(1e-12);
    expect(E[0]).toBeGreaterThan(0);
  });

  it('E = −∇V (diferencias centrales) en puntos al azar', () => {
    const h = 1e-4; // cm
    for (const P of [[2, 3, 1], [-5, 1, 2], [9, -2, 4], [14, 6, -1]] as V3[]) {
      const E = campoSI(tres, P);
      for (let k = 0; k < 3; k++) {
        const a = [...P] as V3, b = [...P] as V3;
        a[k] += h; b[k] -= h;
        const grad = (potencialSI(tres, a) - potencialSI(tres, b)) / (2 * h / 100);
        expect(rel(-grad, E[k])).toBeLessThan(1e-5);
      }
    }
  });

  it('las unidades reducidas del eje coinciden con el SI', () => {
    const c = cargasBanco(3, -5, 14);
    const e = [0, 0];
    campoEje(c, 6, 4, e);
    const E = campoSI(c.map((x) => ({ q: x.q, p: [x.s, 0, 0] as V3 })), [6, 4, 0]);
    expect(rel(e[0] * E_SI_POR_REDUCIDO, E[0])).toBeLessThan(1e-12);
    expect(rel(e[1] * E_SI_POR_REDUCIDO, E[1])).toBeLessThan(1e-12);
    expect(rel(potencialEje(c, 6, 4) * V_SI_POR_REDUCIDO, potencialSI(c.map((x) => ({ q: x.q, p: [x.s, 0, 0] as V3 })), [6, 4, 0]))).toBeLessThan(1e-12);
  });
});

// ───────────────────────────── Gauss ─────────────────────────────
describe('Ley de Gauss (integral numérica sobre una esfera)', () => {
  const banco: CargaPuntual[] = [{ q: 4, p: [0, 0, 0] }, { q: -3, p: [10, 0, 0] }];
  const qe = (q: number) => (q * 1e-6) / EPSILON_0;

  it('esfera que encierra sólo q₁: Φ = q₁/ε₀', () => {
    expect(rel(flujoEsfera(banco, [0, 0, 0], 4), qe(4))).toBeLessThan(1e-4);
    // centro desplazado: da igual dónde esté la carga dentro
    expect(rel(flujoEsfera(banco, [1.5, -1, 0.8], 5), qe(4))).toBeLessThan(1e-3);
  });
  it('esfera que encierra las dos: Φ = (q₁ + q₂)/ε₀', () => {
    expect(rel(flujoEsfera(banco, [5, 0, 0], 12), qe(1))).toBeLessThan(1e-3);
  });
  it('esfera sin carga dentro: Φ = 0 (lo que entra, sale)', () => {
    expect(Math.abs(flujoEsfera(banco, [5, 6, 0], 2.5))).toBeLessThan(1e-3 * qe(1));
  });
  it('ε₀ = 1/(4πk) = 8,854×10⁻¹² C²/(N·m²)', () => {
    expect(EPSILON_0).toBeCloseTo(8.8541878e-12, 18);
  });
});

// ───────────────────────────── líneas de campo ─────────────────────────────
const OPC = { rSiembra: 0.02, rCaptura: 0.05, hMin: 0.002, hMax: 0.5, kPaso: 0.04, maxPasos: 20000 };

describe('Líneas de campo (RK4) y función de corriente Ψ', () => {
  it('la red de Fibonacci reparte el ángulo sólido a partes iguales (Δcos α = 2/N)', () => {
    const s = semillasFibonacci(24, 1);
    expect(s).toHaveLength(24);
    for (let j = 1; j < s.length; j++) expect(s[j - 1].cosA - s[j].cosA).toBeCloseTo(2 / 24, 12);
    expect(s[0].cosA).toBeCloseTo(1 - 1 / 24, 12);
  });

  it('Ψ se conserva a lo largo de cada línea integrada', () => {
    for (const [q1, q2, r] of [[1, -1, 10], [6, -1, 8], [-2, 5, 20], [3, 3, 12], [-4, -1, 6], [2, -6, 3]]) {
      const c = cargasBanco(q1, q2, r);
      const lineas = lineasDeCampo(c, { ...OPC, rDominio: 6 * r });
      let peor = 0;
      for (const l of lineas) {
        const psi0 = corrienteEje(c, l.s[0], l.rho[0]);
        // se excluye el último punto (encajado en el centro de la carga de llegada, donde Ψ no está definida)
        for (let k = 1; k < l.s.length - 1; k++) peor = Math.max(peor, Math.abs(corrienteEje(c, l.s[k], l.rho[k]) - psi0));
      }
      expect(peor).toBeLessThan(2e-3 * Math.max(Math.abs(q1), Math.abs(q2)));
    }
  });

  it('nacen en + y mueren en −: cada línea acaba en la carga que predice Ψ o escapa', () => {
    for (const [q1, q2, r] of [[1, -1, 10], [5, -2, 14], [-3, 6, 9], [2, -2, 2], [4, 4, 10], [-1, -5, 25]]) {
      const c = cargasBanco(q1, q2, r);
      const lineas = lineasDeCampo(c, { ...OPC, rDominio: 400 });
      for (const l of lineas) {
        if (l.destino >= 0) {
          expect(l.fin).toEqual({ tipo: 'carga', indice: l.destino });
          expect(Math.sign(c[l.destino].q)).toBe(-Math.sign(c[l.origen].q));
        } else {
          expect(l.fin.tipo).toBe('fuera');
        }
        // nunca terminan en una carga del mismo signo que su origen
        if (l.fin.tipo === 'carga') expect(Math.sign(c[l.fin.indice].q)).not.toBe(Math.sign(c[l.origen].q));
        // las que se integran a contracorriente nacen en una carga negativa y vienen del infinito
        if (l.sentido === -1) { expect(c[l.origen].q).toBeLessThan(0); expect(l.destino).toBe(-1); }
        else expect(c[l.origen].q).toBeGreaterThan(0);
      }
    }
  });

  it('Gauss en las líneas: de cada carga salen (o llegan) LINEAS_POR_MICROC (16) líneas por μC, EXACTAMENTE', () => {
    for (const q1 of CARGAS_UC) for (const q2 of CARGAS_UC) {
      const g = resumenGauss(q1, q2);
      expect(g.porCarga[0]).toBe(LINEAS_POR_MICROC * Math.abs(q1));
      expect(g.porCarga[1]).toBe(LINEAS_POR_MICROC * Math.abs(q2));
      // las que unen las cargas son las de la carga menor; el resto va al infinito (∝ carga neta)
      if (q1 * q2 < 0) {
        expect(g.unen).toBe(LINEAS_POR_MICROC * Math.min(Math.abs(q1), Math.abs(q2)));
        expect(g.infinito).toBe(LINEAS_POR_MICROC * Math.abs(q1 + q2));
      } else {
        expect(g.unen).toBe(0);
        expect(g.infinito).toBe(LINEAS_POR_MICROC * (Math.abs(q1) + Math.abs(q2)));
      }
    }
  });

  it('el recuento de las líneas INTEGRADAS coincide con el de Gauss', () => {
    for (const [q1, q2, r] of [[3, -1, 10], [-2, 5, 7], [1, -1, 30], [6, 2, 12]]) {
      const c = cargasBanco(q1, q2, r);
      // dominio amplio: el lazo más abierto de ±1 μC a 30 cm llega a ~480 cm del par
      const lineas = lineasDeCampo(c, { ...OPC, rDominio: 4000, hMax: 5, maxPasos: 40000 });
      const toca = [0, 1].map((i) => lineas.filter((l) => l.origen === i || (l.fin.tipo === 'carga' && l.fin.indice === i)).length);
      expect(toca).toEqual(resumenGauss(q1, q2).porCarga);
    }
  });

  it('el destino analítico: la primera línea de q₁ va derecha a q₂ y la de atrás da la vuelta', () => {
    const c = cargasBanco(1, -1, 10);
    expect(destinoAnalitico(c, 0, 0.999)).toBe(1);
    expect(destinoAnalitico(c, 0, -0.999)).toBe(1);
    const c2 = cargasBanco(4, -1, 10); // sólo 1/4 del flujo de q₁ llega a q₂: 1 − cos α ≤ 1/2
    expect(destinoAnalitico(c2, 0, 0.51)).toBe(1);
    expect(destinoAnalitico(c2, 0, 0.49)).toBe(-1);
  });

  it('las que escapan salen en la dirección asintótica que predice Ψ', () => {
    const c = cargasBanco(5, -2, 10);
    const lineas = lineasDeCampo(c, { ...OPC, rDominio: 3000, hMax: 20 });
    const libres = lineas.filter((l) => l.destino < 0);
    expect(libres.length).toBe(LINEAS_POR_MICROC * 3);
    for (const l of libres) {
      const n = l.s.length - 1;
      const ds = l.s[n] - 5, dr = l.rho[n];
      const cosFinal = ds / Math.hypot(ds, dr);
      expect(Math.abs(cosFinal - cosAsintotico(c, l.origen, l.cosA))).toBeLessThan(0.02);
    }
  });

  it('una sola carga: líneas rectas radiales', () => {
    const tr = integrarLinea([{ q: 2, s: 0 }], 0.6, 0.8, 1, { centro: 0, rDominio: 30, rCaptura: 0.05, hMin: 0.01, hMax: 1 });
    const n = tr.s.length - 1;
    expect(tr.fin.tipo).toBe('fuera');
    expect(tr.rho[n] / tr.s[n]).toBeCloseTo(0.8 / 0.6, 9);
  });
});

// ───────────────────────────── equipotenciales ─────────────────────────────
describe('Superficies equipotenciales', () => {
  const rejilla = (r: number) => { const L = escalaEncuadre(r); return { s0: -1.25 * L, s1: r + 1.25 * L, rhoMax: 1.25 * L, ns: 200, nr: 90 }; };

  it('cada perfil está sobre V = V₀, cerrado sobre el eje y ⟂ a E', () => {
    for (const [q1, q2, r] of [[1, -1, 10], [6, -1, 10], [3, 3, 12], [-2, -5, 20], [4, -2, 3], [1, 1, 40]]) {
      const c = cargasBanco(q1, q2, r);
      const niveles = nivelesEquipotenciales(c, escalaEncuadre(r));
      expect(niveles.length).toBeGreaterThan(0);
      let perfiles = 0;
      for (const v0 of niveles) {
        for (const p of perfilesEquipotencial(c, v0, rejilla(r), 48)) {
          perfiles++;
          expect(p.rho[0]).toBe(0); expect(p.rho[p.rho.length - 1]).toBe(0);
          const e = [0, 0];
          for (let k = 0; k < p.s.length; k++) {
            expect(Math.abs(potencialEje(c, p.s[k], p.rho[k]) - v0)).toBeLessThan(1e-7 * Math.abs(v0));
            if (k > 0 && k < p.s.length - 1) {
              // tangente del perfil ⟂ E
              const ts = p.s[k + 1] - p.s[k - 1], tr = p.rho[k + 1] - p.rho[k - 1];
              campoEje(c, p.s[k], p.rho[k], e);
              const cos = (ts * e[0] + tr * e[1]) / (Math.hypot(ts, tr) * Math.hypot(e[0], e[1]));
              expect(Math.abs(cos)).toBeLessThan(0.03);
            }
          }
        }
      }
      expect(perfiles).toBeGreaterThan(0);
    }
  });

  it('a ΔV constante: las superficies se apiñan cerca de la carga (radios ≈ kq/V)', () => {
    const c = [{ q: 3, s: 0 }];
    const niveles = nivelesEquipotenciales(c, 10, { porSigno: 4, rMin: 0.1 });
    const radios = niveles.map((v) => perfilesEquipotencial(c, v, { s0: -15, s1: 15, rhoMax: 15, ns: 240, nr: 120 }, 32)[0].s[31]);
    radios.forEach((R, m) => expect(R).toBeCloseTo(3 / niveles[m], 6));
    expect(radios[0] - radios[1]).toBeGreaterThan(radios[1] - radios[2]);
  });

  it('V = 0 de dos cargas opuestas desiguales es la esfera de Apolonio', () => {
    const c = cargasBanco(6, -2, 10);
    const e = esferaPotencialCero(c)!;
    // |P − r₁|/|P − r₂| = 3 → sobre el eje: s = 15 y s = 7,5 → centro 11,25, radio 3,75
    expect(e.centro).toBeCloseTo(11.25, 12);
    expect(e.radio).toBeCloseTo(3.75, 12);
    for (let a = 0; a <= Math.PI; a += Math.PI / 7) {
      expect(Math.abs(potencialEje(c, e.centro + e.radio * Math.cos(a), e.radio * Math.sin(a)))).toBeLessThan(1e-12);
    }
    expect(esferaPotencialCero(cargasBanco(2, -2, 10))).toBeNull(); // plano medio
    expect(esferaPotencialCero(cargasBanco(2, 3, 10))).toBeNull();
  });

  it('punto de silla entre cargas iguales: E = 0', () => {
    const c = cargasBanco(2, 8, 12);
    const s = puntoSilla(c)!;
    expect(s).toBeCloseTo(4, 12); // 12/(1 + 2)
    const e = [0, 0];
    campoEje(c, s, 0, e);
    expect(Math.abs(e[0])).toBeLessThan(1e-12);
    expect(puntoSilla(cargasBanco(2, -8, 12))).toBeNull();
  });
});

// ───────────────────────────── sonda de superposición ─────────────────────────────
describe('Sonda: E = E₁ + E₂ con flechas a una misma escala lineal', () => {
  it('el campo total es la suma y el paralelogramo cierra (escala común)', () => {
    for (const [q1, q2, r] of [[1, -1, 10], [6, -2, 4], [3, 3, 25], [-5, 1, 40]]) {
      const c = cargasBanco(q1, q2, r);
      for (let k = 0; k < 24; k++) {
        const [s, rho] = trayectoriaSonda(r, (k / 24) * 2 * Math.PI);
        const sp = superposicionEn(c, s, rho, 3);
        // E es la suma
        expect(sp.E[0]).toBeCloseTo(sp.E1[0] + sp.E2[0], 12);
        expect(sp.E[1]).toBeCloseTo(sp.E1[1] + sp.E2[1], 12);
        // y coincide con el campo del eje (en ρ ≥ 0 el signo de E_ρ se conserva; abajo, se invierte)
        const e = [0, 0];
        campoEje(c, s, Math.abs(rho), e);
        const m = Math.hypot(e[0], e[1]);
        expect(Math.abs(sp.E[0] - e[0])).toBeLessThan(1e-12 * m);
        expect(Math.abs(sp.E[1] - Math.sign(rho || 1) * e[1])).toBeLessThan(1e-12 * m);
        // las flechas: f = f₁ + f₂ (mismo factor) y la mayor mide 3 cm
        expect(sp.f[0]).toBeCloseTo(sp.f1[0] + sp.f2[0], 10);
        expect(sp.f[1]).toBeCloseTo(sp.f1[1] + sp.f2[1], 10);
        expect(Math.max(Math.hypot(...sp.f1), Math.hypot(...sp.f2), Math.hypot(...sp.f))).toBeCloseTo(3, 10);
      }
    }
  });

  it('la trayectoria rodea a las dos cargas sin acercarse a menos de 1,5 diámetros', () => {
    for (let r = 2; r <= 40; r += 2) {
      let dmin = Infinity;
      for (let k = 0; k < 360; k++) {
        const [s, rho] = trayectoriaSonda(r, (k / 360) * 2 * Math.PI);
        dmin = Math.min(dmin, Math.hypot(s, rho), Math.hypot(s - r, rho));
      }
      expect(dmin).toBeGreaterThan(1.5 * 2 * R_ESFERA_CM);
    }
  });
});

// ───────────────────────────── escala visual y fidelidad ─────────────────────────────
describe('Escala visual y notas de fidelidad', () => {
  it('la flecha crece con |F| (log), acotada y sin saltos', () => {
    let prev = 0;
    for (let lg = -3; lg <= 4; lg += 0.05) {
      const f = fraccionFlecha(10 ** lg);
      expect(f).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(f).toBeGreaterThanOrEqual(0.1); expect(f).toBeLessThanOrEqual(0.55);
      prev = f;
    }
    // duplicar F alarga la flecha lo mismo en cualquier punto del rango útil
    expect(fraccionFlecha(2) - fraccionFlecha(1)).toBeCloseTo(fraccionFlecha(20) - fraccionFlecha(10), 12);
  });

  it('una esfera de 0,9 cm en aire no retiene más de ~27 nC (las μC del reto son de libro)', () => {
    expect(cargaMaximaEnAire(R_ESFERA_CM / 100)).toBeCloseTo(2.7e-8, 9);
  });

  it('formatos: coma decimal, millares con espacio fino', () => {
    expect(fmtNum(1234.5, 1)).toBe('1 234,5');
    expect(fmtNum(-0.25, 2)).toBe('−0,25');
    expect(fmtFuerza(0.0561)).toBe('0,0561');
    expect(fmtFuerza(3.7448)).toBe('3,74');
    expect(fmtFuerza(808.9)).toBe('809');
  });
});

// ───────────────────────────── dock: no regalar la respuesta ─────────────────────────────
/** Contexto 2D que graba todo el texto escrito y los puntos dibujados. */
function ctxGrabador() {
  const textos: string[] = [];
  const noop = () => undefined;
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, shadowColor: '', shadowBlur: 0,
    save: noop, restore: noop, beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop, fill: noop, arc: noop, fillRect: noop,
    setLineDash: noop, closePath: noop, rect: noop, clip: noop,
    fillText: (t: string) => { textos.push(t); },
  } as unknown as Ctx2D;
  return { ctx, textos };
}

describe('Dock: la gráfica F–r no da la fuerza antes de validar', () => {
  const reto = { q1: 2, q2: -3, r: 12 };
  const base: DatosGrafica = { r: 12, q1: 2, q2: -3, puntos: [{ r: 12, q1: 2, q2: -3 }, { r: 6, q1: 2, q2: -3 }], validado: false, reto };

  it('ANTES de validar (con el banco puesto EN el reto): ni una cifra en el eje F ni una «N»', () => {
    const { ctx, textos } = ctxGrabador();
    dibujarGraficaFr(ctx, 300, 180, base);
    const permitidos = new Set(['2', '5', '10', '20', '40', 'separación r (cm, escala log)', '×10', '|F| (escala log)', 'r ×2', 'F ÷4']);
    for (const t of textos) expect(permitidos.has(t)).toBe(true);
    expect(textos.join(' ')).not.toMatch(/N|reto/);
  });

  it('TRAS validar: eje en N y el punto del reto con su valor', () => {
    const { ctx, textos } = ctxGrabador();
    dibujarGraficaFr(ctx, 300, 180, { ...base, validado: true });
    expect(textos).toContain('|F| (N, escala log)');
    expect(textos).toContain('0,1');
    expect(textos).toContain('1 000');
    expect(textos.some((t) => t.startsWith('✚ reto ') && t.endsWith(' N'))).toBe(true);
    expect(textos).toContain(`✚ reto ${fmtFuerza(fuerza(2, -3, 12))} N`);
  });

  it('la gráfica usa la misma ley que el validador', () => {
    for (const [q1, q2, r] of [[2, -3, 12], [6, 6, 2], [1, -1, 40]]) expect(rel(fuerza(q1, q2, r), fuerzaCoulomb(q1, q2, r))).toBeLessThan(1e-12);
  });
});

// ───────────────────────────── reloj único ─────────────────────────────
describe('Reloj único de la escena y del dock', () => {
  it('r se desliza sin rebote hasta la pedida y asienta en < 1 s', () => {
    const rl = crearRelojCampo({ q1: 1, q2: -1, r: 10 }, false);
    rl.escenaActiva = true;
    rl.fijar({ q1: 1, q2: -1, r: 30 });
    let t = 0, prev = rl.vis.r, max = 0;
    while (rl.vis.r !== 30 && t < 3) {
      rl.paso(1 / 60); t += 1 / 60;
      expect(rl.vis.r).toBeGreaterThanOrEqual(prev - 1e-9); // monótona: sin rebote
      prev = rl.vis.r; max = Math.max(max, rl.vis.r);
    }
    expect(rl.vis.r).toBe(30);
    expect(max).toBeLessThanOrEqual(30);
    expect(t).toBeLessThan(1);
  });

  it('un cambio de carga es inmediato y las líneas vuelven a crecer; reducir movimiento lo hace todo instantáneo', () => {
    const rl = crearRelojCampo({ q1: 1, q2: -1, r: 10 }, false);
    rl.escenaActiva = true;
    for (let i = 0; i < 120; i++) rl.paso(1 / 60);
    expect(rl.revelado).toBe(1);
    const v0 = rl.versionCampo;
    rl.fijar({ q1: 4, q2: -1, r: 10 });
    expect(rl.vis.q1).toBe(4);
    expect(rl.revelado).toBe(0);
    expect(rl.versionCampo).toBeGreaterThan(v0);
    const rr = crearRelojCampo({ q1: 1, q2: -1, r: 10 }, true);
    expect(rr.pausa).toBe(true);
    rr.escenaActiva = true;
    rr.fijar({ q1: 2, q2: 2, r: 25 });
    expect(rr.vis.r).toBe(25);
    expect(rr.revelado).toBe(1);
    const t0 = rr.t; rr.paso(0.5);
    expect(rr.t).toBe(t0); // en pausa el tiempo de animación no corre
  });

  it('sin escena montada, fijar() salta al objetivo (el dock nunca queda desfasado)', () => {
    const rl = crearRelojCampo({ q1: 1, q2: -1, r: 10 }, false);
    rl.fijar({ q1: 1, q2: -1, r: 33 });
    expect(rl.vis.r).toBe(33);
  });
});
