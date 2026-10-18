/**
 * F6 · Principio de Arquímedes: la física que mueve la escena y el dock.
 *  · Hidrostática exacta del prisma girado (sección recortada por la superficie), E = ρ·g·V,
 *    nivel del tanque finito (A·ys = V_agua + V_sum).
 *  · Equilibrio de flotación: V_s/V = ρ_c/ρ_l y E = P; hundidos: N = P − E (peso aparente).
 *  · Reto: el cilindro colgado del muelle del dinamómetro marca, en reposo, el peso aparente
 *    del dominio (el mismo que registra el alumno y juzga evaluarF6).
 *  · Periodo de la oscilación vertical (masa añadida, tanque finito, amortiguamiento).
 *  · Estabilidad: GM = KB + BM − KG coincide con la pendiente de GZ(θ); el bloque de canto
 *    vuelca y el tumbado se endereza.
 *  · Arrastre (White), ondas (velocidad de fase y llegada del frente) y menisco de
 *    Laplace–Young (curvatura = z/l_c²).
 */
import * as F from '@/components/simuladores/fis06/flotacion';
import { Ondas, velocidadFase, amortiguamiento } from '@/components/simuladores/fis06/ondas';
import { RelojTanque, relojReto, fijarInmersion } from '@/components/simuladores/fis06/reloj';
import { FLUIDOS, pesoAparente, lecturaDinamometro, G_TIERRA } from '@/domain/fisica';

const agua = F.LIQUIDOS.agua, etanol = F.LIQUIDOS.alcohol, glicerina = F.LIQUIDOS.glicerina;
const libre = (c: F.Cuerpo, liq: F.Liquido): F.Montaje => ({ c, liq, Vagua: F.V_AGUA, colgado: false, ySoporte: 0, kMuelle: 0 });
const rad = (g: number) => (g * Math.PI) / 180;

/** Área de la sección bajo y = ys por muestreo fino (referencia independiente del recorte). */
function areaMuestreada(c: F.Cuerpo, y: number, th: number, ys: number, n = 1200) {
  let dentro = 0;
  const co = Math.cos(th), si = Math.sin(th);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = ((i + 0.5) / n - 0.5) * c.b, b = ((j + 0.5) / n - 0.5) * c.h;
    if (y + a * si + b * co <= ys) dentro++;
  }
  return (dentro / (n * n)) * c.b * c.h;
}

/** Suelta el cuerpo y lo deja asentarse `seg` segundos. */
function asentar(c: F.Cuerpo, liq: F.Liquido, seg = 12) {
  const m = libre(c, liq);
  const s = F.estadoSoltar(m);
  F.avanzar(m, s, seg);
  return { m, s };
}

describe('datos', () => {
  test('las densidades de los líquidos son las del dominio (CRC, 20 °C)', () => {
    for (const k of ['agua', 'alcohol', 'glicerina'] as const) expect(F.LIQUIDOS[k].rho).toBe(FLUIDOS[k].rho);
    expect(F.G).toBe(G_TIERRA);
  });
  test('juego de igual volumen: los cuatro bloques miden 256 cm³ en las dos posturas', () => {
    for (const mat of ['pino', 'hielo', 'aluminio', 'hierro'] as const) for (const p of ['tumbado', 'canto'] as const) {
      expect(F.volumen(F.bloque(mat, p)) * 1e6).toBeCloseTo(256, 9);
    }
  });
  test('el cilindro problema: h = 2,8·r y el prisma equivalente conserva volumen y área de flotación', () => {
    const c = F.cilindroProblema(250e-6, 2700);
    expect(c.h / c.r).toBeCloseTo(2.8, 12);
    expect(F.volumen(c)).toBeCloseTo(250e-6, 15);
    expect(c.b * c.L).toBeCloseTo(Math.PI * c.r * c.r, 15);
  });
});

describe('hidrostática del prisma', () => {
  const c = F.bloque('pino', 'tumbado');
  test('derecho: área = b·calado y B a media altura de lo sumergido', () => {
    for (const d of [0.005, 0.02, 0.031]) {
      const y = -d + c.h / 2; // superficie en ys = 0
      const s = F.seccionSumergida(c, y, 0, 0);
      expect(s.A).toBeCloseTo(c.b * d, 12);
      expect(s.cy).toBeCloseTo(-d / 2, 12);
      expect(s.cx).toBeCloseTo(0, 12);
      expect(s.x2 - s.x1).toBeCloseTo(c.b, 12);
    }
    expect(F.seccionSumergida(c, 1, 0, 0).A).toBe(0);
    expect(F.seccionSumergida(c, -1, 0, 0).A).toBeCloseTo(c.b * c.h, 14);
  });
  test('girado: el recorte coincide con el muestreo independiente (error < 0,1 %)', () => {
    for (const th of [rad(7), rad(33), rad(61), rad(-118)]) for (const y of [-0.012, 0.004, 0.019]) {
      const s = F.seccionSumergida(c, y, th, 0);
      const ref = areaMuestreada(c, y, th, 0);
      expect(Math.abs(s.A - ref) / (c.b * c.h)).toBeLessThan(1e-3);
    }
  });
  test('E = ρ_l·g·V: medio bloque de pino en agua desaloja 128 cm³ y recibe 1,2532 N', () => {
    const s = F.seccionSumergida(c, 0, 0, 0);
    const V = s.A * c.L;
    expect(V * 1e6).toBeCloseTo(128, 9);
    expect(F.empuje(agua.rho, V)).toBeCloseTo(998 * 9.81 * 128e-6, 12);
    expect(F.empuje(agua.rho, V)).toBeCloseTo(1.2532, 4);
  });
  test('tanque finito: A_tanque·ys = V_agua + V_sumergido y el nivel sube V/A', () => {
    // a flote, girado y del todo sumergido (y = 0,1: la raíz cae JUSTO en el extremo del corchete)
    for (const [y, th] of [[0.19, 0.2], [0.2, rad(80)], [0.1, 0], [0.05, 0]] as const) {
      const { ys, sec } = F.nivelLibre(c, y, th, F.V_AGUA);
      // residuo expresado como altura: el corte de Newton es |g| < 1e-13 m³ → < 2 pm de nivel
      expect(Math.abs(F.AREA_TANQUE * ys - (F.V_AGUA + sec.A * c.L)) / F.AREA_TANQUE).toBeLessThan(2e-12);
    }
    // hundido: el nivel sube exactamente V/A = 256 cm³ / 640 cm² = 4,0 mm (antes salía de 30
    // bisecciones, 3,7·10⁻¹² m corto: el paso exacto de Newton se rechazaba por caer en el borde)
    const hundido = F.nivelLibre(c, 0.05, 0, F.V_AGUA);
    expect((hundido.ys - F.TANQUE.agua) * 1000).toBeCloseTo((256e-6 / F.AREA_TANQUE) * 1000, 9);
    expect(hundido.ys).toBeCloseTo((F.V_AGUA + F.volumen(c)) / F.AREA_TANQUE, 15);
  });
});

describe('equilibrio de flotación y peso aparente', () => {
  test('flota con V_s/V = ρ_c/ρ_l y E = P (pino y hielo en los tres líquidos)', () => {
    for (const [mat, liq] of [['pino', agua], ['pino', etanol], ['pino', glicerina], ['hielo', agua], ['hielo', glicerina]] as const) {
      const c = F.bloque(mat, 'tumbado');
      const { s } = asentar(c, liq);
      expect(Math.abs(s.V / F.volumen(c) - c.rho / liq.rho)).toBeLessThan(2e-4);
      expect(Math.abs(s.E - s.P)).toBeLessThan(5e-4);
      expect(s.N).toBe(0);
    }
  });
  test('el hielo (917) se hunde en etanol (789): en el fondo, N = P − E con E del volumen entero', () => {
    const c = F.bloque('hielo', 'tumbado');
    const { s } = asentar(c, etanol);
    expect(s.V).toBeCloseTo(F.volumen(c), 12);
    expect(s.N).toBeCloseTo(pesoAparente(917, F.volumen(c), etanol.rho, 1), 3);
  });
  test('aluminio y hierro en el fondo: el apoyo vale el peso aparente del dominio', () => {
    for (const mat of ['aluminio', 'hierro'] as const) for (const liq of [agua, glicerina]) {
      const c = F.bloque(mat, 'tumbado');
      const { s } = asentar(c, liq, 6);
      expect(Math.abs(s.N - pesoAparente(c.rho, F.volumen(c), liq.rho, 1))).toBeLessThan(2e-3);
    }
  });
  test('reto: en reposo, el dinamómetro marca W − ρ_l·g·f·V para f = 0; 0,5; 1 (lo que registra el alumno)', () => {
    for (const [rho, V, liq] of [[2700, 250e-6, agua], [8900, 400e-6, glicerina], [1600, 150e-6, etanol]] as const) {
      const r = relojReto(rho, V, liq, 0, 0.01);
      for (const f of [0, 0.5, 1]) {
        fijarInmersion(r, f);
        r.integrar(5);
        const esperado = pesoAparente(rho, V, liq.rho, f);
        expect(Math.abs(r.s.T - esperado)).toBeLessThan(2e-3);
        expect(lecturaDinamometro(r.s.T)).toBeCloseTo(lecturaDinamometro(esperado), 9);
        expect(r.fraccionSumergida).toBeCloseTo(f, 3);
      }
    }
  });
  test('el soporte para cada inmersión deja el cilindro justo a esa fracción (estática exacta)', () => {
    const m = F.montajeReto(2700, 250e-6, agua, 0.6);
    const s = F.reposoColgado(m, 0.6);
    expect(s.V / F.volumen(m.c)).toBeCloseTo(0.6, 9);
    expect(s.T).toBeCloseTo(pesoAparente(2700, 250e-6, agua.rho, 0.6), 9);
  });
});

describe('oscilación vertical', () => {
  test('el periodo medido coincide con T = 2π√((m + m_a)/k)/√(1 − ζ²) (tanque finito)', () => {
    for (const [mat, liq] of [['pino', agua], ['hielo', agua], ['pino', etanol]] as const) {
      const c = F.bloque(mat, 'tumbado');
      const m = libre(c, liq);
      // equilibrio exacto y un empujón de 1 mm hacia abajo
      const d = c.h * (c.rho / liq.rho);
      const ys0 = (F.V_AGUA + F.masa(c) / liq.rho) / F.AREA_TANQUE;
      const s = F.estadoEn(m, ys0 - d + c.h / 2 - 0.001, 0);
      const cruces: number[] = [];
      let prev = s.y - (ys0 - d + c.h / 2);
      while (s.t < 3) {
        F.avanzar(m, s, 0.0005);
        const z = s.y - (ys0 - d + c.h / 2);
        if (prev < 0 && z >= 0) cruces.push(s.t - (0.0005 * z) / (z - prev));
        prev = z;
      }
      const T = (cruces[3] - cruces[0]) / 3;
      expect(Math.abs(T / F.periodoAmortiguado(c, liq) - 1)).toBeLessThan(0.012);
    }
  });
  test('valor de referencia: el pino tumbado en agua oscila con T₀ = 0,330 s', () => {
    const c = F.bloque('pino', 'tumbado');
    const m = 500 * 256e-6, Af = 0.08 * 0.08;
    const k = 998 * 9.81 * Af * (F.AREA_TANQUE / (F.AREA_TANQUE - Af));
    const T0 = 2 * Math.PI * Math.sqrt((m + 0.5 * 998 * (m / 998)) / k);
    expect(F.periodoVertical(c, agua)).toBeCloseTo(T0, 12);
    expect(T0).toBeCloseTo(0.330, 3);
  });
  test('en glicerina la oscilación muere mucho antes que en agua (viscosidad 1 400 veces mayor)', () => {
    const amplitud = (liq: F.Liquido) => {
      const c = F.bloque('pino', 'tumbado');
      const { m, s } = { m: libre(c, liq), s: F.estadoSoltar(libre(c, liq)) };
      F.avanzar(m, s, 0.6);
      let mx = 0; const zEq = c.h / 2 - c.h * c.rho / liq.rho;
      for (let i = 0; i < 400; i++) { F.avanzar(m, s, 0.002); mx = Math.max(mx, Math.abs(s.y - s.ys - zEq)); }
      return mx;
    };
    expect(amplitud(glicerina)).toBeLessThan(amplitud(agua) * 0.5);
  });
});

describe('estabilidad', () => {
  test('GM = KB + BM − KG coincide con la pendiente de GZ(θ) en θ = 0', () => {
    for (const [mat, post, liq] of [['pino', 'tumbado', agua], ['pino', 'canto', agua], ['hielo', 'tumbado', agua], ['pino', 'tumbado', glicerina]] as const) {
      const c = F.bloque(mat, post);
      const { GM } = F.alturaMetacentrica(c, liq);
      const h = 1e-4;
      const pendiente = (F.brazoAdrizante(c, liq, h) - F.brazoAdrizante(c, liq, -h)) / (2 * h);
      expect(Math.abs(pendiente - GM)).toBeLessThan(2e-6);
    }
  });
  test('pino tumbado: GM = +1,66 cm (estable); de canto: GM = −1,66 cm (vuelca)', () => {
    expect(F.alturaMetacentrica(F.bloque('pino', 'tumbado'), agua).GM * 100).toBeCloseTo(1.66, 2);
    expect(F.alturaMetacentrica(F.bloque('pino', 'canto'), agua).GM * 100).toBeCloseTo(-1.66, 2);
  });
  test('de canto, el pino vuelca y queda tumbado (|θ| = 90°); tumbado, se endereza', () => {
    const canto = asentar(F.bloque('pino', 'canto'), agua, 10).s;
    expect(Math.abs(Math.abs(canto.th) - Math.PI / 2)).toBeLessThan(rad(1));
    const tumbado = asentar(F.bloque('pino', 'tumbado'), agua, 10).s;
    expect(Math.abs(tumbado.th)).toBeLessThan(rad(0.5));
  });
});

describe('arrastre y hundimiento', () => {
  test('a la velocidad límite el arrastre iguala al peso aparente', () => {
    for (const mat of ['aluminio', 'hierro'] as const) for (const liq of [agua, glicerina]) {
      const c = F.bloque(mat, 'tumbado');
      const v = F.velocidadTerminal(c, liq);
      const neto = (F.masa(c) - liq.rho * F.volumen(c)) * F.G;
      expect(F.arrastre(c, liq, v, F.areaVertical(c, 0)) / neto).toBeCloseTo(1, 6);
    }
    expect(F.velocidadTerminal(F.bloque('pino', 'tumbado'), agua)).toBe(0);
  });
  test('límites de la correlación: Stokes a Re → 0 y C∞ a Re → ∞', () => {
    const c = F.bloque('hierro', 'tumbado'), A = F.areaVertical(c, 0), D = F.diametroEquivalente(c);
    const v0 = 1e-9;
    expect(F.arrastre(c, glicerina, v0, A) / ((12 * glicerina.mu * A * v0) / D)).toBeCloseTo(1, 4);
    const vInf = 1e6;
    expect(F.arrastre(c, agua, vInf, A) / (0.5 * agua.rho * A * vInf * vInf)).toBeCloseTo(c.Cinf, 2);
  });
  test('el hierro se hunde antes en agua que en glicerina, y nunca supera su velocidad límite', () => {
    const tiempo = (liq: F.Liquido) => {
      const c = F.bloque('hierro', 'tumbado');
      const m = libre(c, liq), s = F.estadoSoltar(m);
      while (s.N === 0 && s.t < 5) { F.avanzar(m, s, 0.002); if (s.V > 0) expect(-s.vy).toBeLessThan(F.velocidadTerminal(c, liq) * 1.05 + 0.6); }
      return s.t;
    };
    expect(tiempo(agua)).toBeLessThan(tiempo(glicerina));
  });
});

describe('superficie: ondas y menisco', () => {
  test('velocidad de fase de las ondas de 4 cm y disipación de Lamb', () => {
    expect(velocidadFase(agua)).toBeCloseTo(Math.sqrt((9.81 * 0.04) / (2 * Math.PI) + (2 * Math.PI * 0.0728) / (998 * 0.04)), 12);
    expect(velocidadFase(agua)).toBeCloseTo(0.272, 3);
    expect(amortiguamiento(glicerina)).toBeGreaterThan(amortiguamiento(agua) * 30);
  });
  test('el frente de un pulso llega a una sonda a 20 cm en d/c (±15 %) y la media se conserva', () => {
    const o = new Ondas(0.005);
    o.fijarLiquido(agua);
    o.agitacion = 0;
    o.gamma = 0;
    o.pulso(-0.1, 0, 0.01, 1e-3);
    const sonda = (x: number) => { const i = Math.floor((x - o.x0) / o.dx), k = Math.floor((0 - o.z0) / o.dx); return o.u[k * o.nx + i]; };
    let t = 0, llegada = -1;
    while (t < 1.5 && llegada < 0) {
      o.paso(0.002, null, 0); t += 0.002;
      if (sonda(0.1) > 2e-5) llegada = t;
      let s = 0; for (let j = 0; j < o.u.length; j++) s += o.u[j];
      expect(Math.abs(s / o.u.length)).toBeLessThan(1e-9);
    }
    expect(Math.abs(llegada / (0.2 / o.c) - 1)).toBeLessThan(0.15);
  });
  test('el agua aparta el volumen que mete el cuerpo y las ondas acaban muriendo', () => {
    const o = new Ondas(0.01);
    o.fijarLiquido(agua);
    o.agitacion = 0;
    const h = { tipo: 'rect' as const, x1: -0.04, x2: 0.04, z1: -0.04, z2: 0.04 };
    for (let i = 0; i < 20; i++) o.paso(0.004, h, 5e-6);
    const e0 = o.energia();
    expect(e0).toBeGreaterThan(0);
    for (let i = 0; i < 2000; i++) o.paso(0.004, h, 0);
    expect(o.energia()).toBeLessThan(e0 * 1e-3);
  });
  test('menisco: h₀ = √2·l_c (agua 3,856 mm) y el perfil cumple Laplace–Young (curvatura = z/l_c²)', () => {
    const lc = F.longitudCapilar(agua), h0 = F.alturaMenisco(agua);
    expect(lc * 1000).toBeCloseTo(2.727, 3);
    expect(h0 * 1000).toBeCloseTo(3.856, 3);
    expect(h0).toBeCloseTo(Math.SQRT2 * lc, 15);
    expect(F.perfilMenisco(agua, h0)).toBeCloseTo(0, 12);
    for (const z of [0.5 * h0, 0.25 * h0, 0.1 * h0]) {
      // la curva z(x): curvatura κ = z''/(1 + z'²)^(3/2) a partir de x(z) (derivadas numéricas)
      const e = h0 * 1e-3;
      const x = (zz: number) => F.perfilMenisco(agua, zz);
      const xp = (x(z + e) - x(z - e)) / (2 * e);
      const xpp = (x(z + e) - 2 * x(z) + x(z - e)) / (e * e);
      const kappa = Math.abs(xpp) / Math.pow(1 + xp * xp, 1.5);
      expect(Math.abs(kappa / (z / (lc * lc)) - 1)).toBeLessThan(0.01);
    }
  });
});

describe('reloj único', () => {
  test('la cámara lenta avanza el modelo dtPared·factor y guarda la historia', () => {
    const c = F.bloque('pino', 'tumbado');
    const m = libre(c, agua);
    const r = new RelojTanque(m, F.estadoSoltar(m), 0.01);
    r.factor = 1 / 4;
    for (let i = 0; i < 60; i++) r.avanzar(1 / 60);
    expect(r.s.t).toBeCloseTo(0.25, 9);
    expect(r.nHist).toBeGreaterThan(50);
    r.pausa = true;
    r.avanzar(1);
    expect(r.s.t).toBeCloseTo(0.25, 9);
    const g = r.generacion;
    r.reiniciar(m, F.estadoSoltar(m));
    expect(r.generacion).toBe(g + 1);
    expect(r.nHist).toBe(1);
  });
});
