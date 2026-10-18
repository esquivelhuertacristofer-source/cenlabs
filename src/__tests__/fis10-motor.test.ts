/**
 * F10 · Motor de CD: la física que mueve la escena y el dock (fis10/motor.ts, lineas.ts, reloj.ts).
 *  · Campo del corte: imanes en arco con imantación radial entre hierro (μ → ∞), serie exacta.
 *    Media de B_r bajo la bobina = 0,5 T (la del dominio), circuito magnético radial, simetrías
 *    y condiciones de contorno; líneas de campo = curvas A = cte, cerradas y orientadas con B.
 *  · Par τ(θ) = N·I·L·r·[B_r(φ) − B_r(φ+π)]: suma de las fuerzas de Lorentz de los dos lados;
 *    con el conmutador nunca cambia de signo (⟨G⟩ = 1); sin él, la media por vuelta es nula.
 *  · Movimiento: el régimen del modelo dinámico es el del dominio (estadoMotor), balance de
 *    potencia V·I = I²R + E·I, rendimiento, umbral de arranque, sentido, constante de tiempo.
 *  · Reloj: tacómetro por pulsos, cámara lenta, historia.
 */
import {
  GEOM, R_M, R_Y, R_O, MU0, M_IMAN, REMANENCIA, VENTANA, J_ROTOR, G_EXTREMOS,
  campo, campoPolar, potencialA, brEntrehierro, brConfig, configImanes, formaPar, parInstantaneo,
  parSinConmutador, ladosActivos, bobinaActiva, estadoInicial, avanzar, corriente, regimen, tauMecanica,
  fcemMedia, aRpm, type ParamsMotor,
} from '@/components/simuladores/fis10/motor';
import { lineasCampo } from '@/components/simuladores/fis10/lineas';
import { RelojMotor, factorAuto, VUELTAS_VISIBLES, LENTOS } from '@/components/simuladores/fis10/reloj';
import { MOTOR, ESPIRAS10, estadoMotor, kMotor, rArmadura, voltajeNecesario, type Polo } from '@/domain/fisica';

const GRAD = Math.PI / 180;
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));

/** Media de f en [a, b] por Simpson. */
function media(f: (x: number) => number, a: number, b: number, n = 720) {
  let s = 0;
  for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(a + ((b - a) * i) / n);
  return s / (3 * n);
}

/** Integra el modelo dinámico hasta el régimen (≥ 12 constantes de tiempo). */
function aRegimen(p: ParamsMotor, theta0 = 0.3) {
  const e = estadoInicial(theta0);
  avanzar(e, p, Math.max(0.3, 12 * tauMecanica(p.N)));
  // media por vuelta completa: ω media = Δθ/Δt sobre 8 vueltas de conmutación
  const t0 = e.t, th0 = e.theta;
  avanzar(e, p, 0.25);
  return { e, omegaMedia: (e.theta - th0) / (e.t - t0) };
}

describe('campo de los imanes en el corte', () => {
  const dip = campo('dipolo');

  it('la inducción media bajo la bobina activa es la del dominio (0,5 T)', () => {
    expect(media((f) => brEntrehierro(dip, f), -VENTANA, VENTANA)).toBeCloseTo(MOTOR.B, 6);
  });

  it('la remanencia que hace falta es la de un imán real (aglomerado de NdFeB)', () => {
    expect(REMANENCIA).toBeGreaterThan(0.45);
    expect(REMANENCIA).toBeLessThan(0.75);
    expect(MU0 * M_IMAN).toBeCloseTo(REMANENCIA, 12);
  });

  it('en el centro del polo es el circuito magnético radial: B = μ₀M·h/(Rr·ln(R_Y/Rr))', () => {
    const radial = (REMANENCIA * GEOM.hm) / (GEOM.Rr * Math.log(R_Y / GEOM.Rr));
    expect(rel(brEntrehierro(dip, 0), radial)).toBeLessThan(0.01);
  });

  it('entre los dos imanes el campo radial se anula y el yugo no satura', () => {
    expect(Math.abs(brEntrehierro(dip, 90 * GRAD))).toBeLessThan(0.02);
    // B en el yugo sobre el eje vertical: todo el flujo de medio polo pasa por ahí
    const bYugo = Math.abs(campoPolar(dip, (R_Y + R_O) / 2, 90 * GRAD)[1]);
    expect(bYugo).toBeGreaterThan(0.9);
    expect(bYugo).toBeLessThan(1.45);
  });

  it('simetrías: N–S impar (B_r(φ+π) = −B_r(φ)); N–N par', () => {
    const cua = campo('cuadrupolo');
    for (const f of [0, 0.3, 0.8, 1.3]) {
      expect(brEntrehierro(dip, f + Math.PI)).toBeCloseTo(-brEntrehierro(dip, f), 9);
      expect(brEntrehierro(cua, f + Math.PI)).toBeCloseTo(brEntrehierro(cua, f), 9);
    }
    // N enfrentado: el campo SALE del imán hacia el inducido (B_r < 0 en los dos)
    expect(brEntrehierro(cua, 0)).toBeLessThan(0);
    expect(brEntrehierro(cua, Math.PI)).toBeLessThan(0);
    // dipolo de referencia: izq. N, der. S → B cruza el inducido de izquierda a derecha
    expect(brEntrehierro(dip, 0)).toBeGreaterThan(0.45);
    expect(brConfig(configImanes('S', 'N'), 0)).toBeLessThan(-0.45);
  });

  it('contorno: B_φ = 0 en las dos caras de hierro y B_r continuo en la cara del imán', () => {
    for (const f of [10 * GRAD, 35 * GRAD, 70 * GRAD]) {
      const bRr = campoPolar(dip, GEOM.Rr * (1 + 1e-9), f);
      const bRy = campoPolar(dip, R_Y * (1 - 1e-9), f);
      expect(Math.abs(bRr[1])).toBeLessThan(1e-6 * Math.max(1, Math.abs(bRr[0])) + 1e-6);
      expect(Math.abs(bRy[1])).toBeLessThan(1e-6);
      const dentro = campoPolar(dip, R_M * (1 - 1e-9), f)[0], fuera = campoPolar(dip, R_M * (1 + 1e-9), f)[0];
      expect(Math.abs(dentro - fuera)).toBeLessThan(1e-5);
    }
  });

  it('no sale flujo por fuera del yugo (A = 0 en el borde exterior)', () => {
    for (const f of [0.2, 1.1, 2.5]) expect(Math.abs(potencialA(dip, R_O * (1 - 1e-12), f))).toBeLessThan(1e-9);
  });
});

describe('líneas de campo', () => {
  const op = { porSigno: 5, puntos: 160, nr: 110, nphi: 480 };
  const dip = campo('dipolo');

  it('son lazos cerrados dentro del yugo: 2 por nivel (N–S) y 4 por nivel (N–N)', () => {
    const ld = lineasCampo('dipolo', op), lc = lineasCampo('cuadrupolo', op);
    expect(ld).toHaveLength(2 * op.porSigno);
    expect(lc).toHaveLength(4 * op.porSigno);
    for (const l of [...ld, ...lc]) {
      const n = l.x.length;
      expect(Math.hypot(l.x[0] - l.x[n - 1], l.y[0] - l.y[n - 1])).toBeLessThan(0.05);
      for (let i = 0; i < n; i++) expect(Math.hypot(l.x[i], l.y[i])).toBeLessThanOrEqual(R_O * 100 + 1e-3);
    }
  });

  it('cada línea es A = cte y va en el sentido de B', () => {
    const ls = lineasCampo('dipolo', op);
    const dA = Math.abs(ls[0].nivel) * 2; // niveles en (k − ½)·ΔA
    for (const l of ls) {
      let aFavor = 0;
      for (let i = 0; i < l.x.length - 1; i += 4) {
        const x = l.x[i] / 100, y = l.y[i] / 100;
        const r = Math.hypot(x, y), f = Math.atan2(y, x);
        expect(Math.abs(potencialA(dip, r, f) - l.nivel)).toBeLessThan(0.02 * dA);
        const [br, bp] = campoPolar(dip, r, f);
        const bx = br * Math.cos(f) - bp * Math.sin(f), by = br * Math.sin(f) + bp * Math.cos(f);
        if (bx * (l.x[i + 1] - l.x[i]) + by * (l.y[i + 1] - l.y[i]) > 0) aFavor++;
      }
      expect(aFavor / Math.ceil((l.x.length - 1) / 4)).toBeGreaterThan(0.97);
    }
  });

  it('las líneas se juntan donde B es mayor: el yugo lleva más inducción que el entrehierro', () => {
    const ls = lineasCampo('dipolo', op);
    const bMax = Math.max(...ls.map((l) => Math.max(...l.b)));
    expect(bMax).toBeGreaterThan(1.1);
    expect(bMax).toBeLessThan(1.8);
  });
});

describe('par τ(θ) y conmutador', () => {
  const NS = configImanes('N', 'S');
  const SN = configImanes('S', 'N');
  const NN = configImanes('N', 'N');
  const N = 50, I = 0.4, k = kMotor(N);

  it('τ es la suma de las dos fuerzas de Lorentz F = N·I·L·B_r por su brazo r', () => {
    for (let th = 0; th < 2 * Math.PI; th += 0.137) {
      const { lados } = ladosActivos(NS, N, I, th);
      const deFuerzas = -(lados[0].Fphi + lados[1].Fphi) * GEOM.Rr; // + horario = −φ̂
      expect(rel(parInstantaneo(NS, N, I, th), deFuerzas)).toBeLessThan(2e-3);
    }
  });

  it('con el conmutador el par nunca cambia de signo y su media por vuelta es k·I', () => {
    let min = Infinity, max = -Infinity;
    for (let th = 0; th < 2 * Math.PI; th += 0.01) {
      const t = parInstantaneo(NS, N, I, th);
      min = Math.min(min, t); max = Math.max(max, t);
      expect(parInstantaneo(SN, N, I, th)).toBeCloseTo(-t, 12);
    }
    expect(min).toBeGreaterThan(0.9 * k * I);
    expect(max).toBeLessThan(1.02 * k * I);
    expect(media((th) => formaPar(NS, th), 0, 2 * Math.PI, 2880)).toBeCloseTo(1, 3);
    expect(G_EXTREMOS.min).toBeGreaterThan(0.9);
  });

  it('sin conmutador la misma bobina empuja media vuelta a favor y media en contra (media 0)', () => {
    expect(Math.abs(media((th) => parSinConmutador(NS, N, I, th), 0, 2 * Math.PI, 2880))).toBeLessThan(1e-3 * k * I);
    // máximo con el plano de la bobina paralelo a B (θ = 0) y nulo perpendicular (θ = 90°), como N·I·A·B·sen φ
    expect(rel(parSinConmutador(NS, N, I, 0), N * I * MOTOR.A * brEntrehierro(campo('dipolo'), 0))).toBeLessThan(1e-9);
    expect(Math.abs(parSinConmutador(NS, N, I, 90 * GRAD))).toBeLessThan(0.05 * k * I);
    expect(parSinConmutador(NS, N, I, Math.PI)).toBeLessThan(-0.95 * k * I);
  });

  it('cada cuarto de vuelta el conmutador pasa la corriente a la bobina que está bajo los imanes', () => {
    for (let th = 0; th < 2 * Math.PI; th += 0.05) {
      const { phiR } = bobinaActiva(th);
      expect(Math.abs(phiR)).toBeLessThanOrEqual(VENTANA + 1e-12);
    }
    expect(bobinaActiva(0).bobina).toBe(0);
    expect(bobinaActiva(Math.PI / 2).bobina).toBe(1);
  });

  it('con polos iguales las fuerzas no dan par', () => {
    for (let th = 0; th < 2 * Math.PI; th += 0.3) {
      expect(parInstantaneo(NN, N, I, th)).toBe(0);
      const { lados } = ladosActivos(NN, N, I, th);
      expect(Math.abs(lados[0].Fphi + lados[1].Fphi)).toBeLessThan(1e-12);
      expect(Math.abs(lados[0].Fphi)).toBeGreaterThan(0);
    }
  });
});

describe('movimiento: el régimen es el del dominio', () => {
  const casos: [number, number, number, Polo, Polo][] = [
    [6, 50, 0.004, 'N', 'S'], [12, 10, 0.02, 'N', 'S'], [20, 100, 0.012, 'S', 'N'], [3, 50, 0.012, 'N', 'S'],
    [24, 100, 0.005, 'N', 'S'], [1.5, 10, 0.008, 'S', 'N'],
  ];
  it.each(casos)('V = %s V, N = %s, carga %s N·m, imanes %s–%s', (V, N, carga, izq, der) => {
    const p: ParamsMotor = { V, N, izq, der, carga, energizado: true };
    const dom = estadoMotor({ voltaje: V, espiras: N, imanIzq: izq, imanDer: der, carga });
    const { e, omegaMedia } = aRegimen(p);
    expect(dom.arranca).toBe(true);
    expect(rel(aRpm(omegaMedia), dom.rpm)).toBeLessThan(2e-4);
    // corriente media de la vuelta (la instantánea lleva el rizado de ω amplificado por E/(I·R))
    expect(rel(corriente(p, configImanes(izq, der), omegaMedia), dom.corriente)).toBeLessThan(3e-3);
    expect(rel(e.I, dom.corriente)).toBeLessThan(5e-3);
  });

  it('en los retos (600–2400 rpm, 0,005–0,020 N·m) el voltaje predicho lleva a la velocidad pedida', () => {
    for (const N of ESPIRAS10) for (const rpm of [600, 1450, 2400]) for (const carga of [0.005, 0.02]) {
      const V = voltajeNecesario(rpm, N, carga);
      if (V > 24) continue;
      const { omegaMedia } = aRegimen({ V, N, izq: 'N', der: 'S', carga, energizado: true });
      expect(rel(aRpm(omegaMedia), rpm)).toBeLessThan(2e-4);
    }
  });

  it('balance de potencia V·I = I²R + E·I y rendimiento η = E/V en régimen', () => {
    for (const [V, N, carga] of [[6, 50, 0.004], [18, 100, 0.02], [9, 10, 0.006]] as const) {
      const p = { V, N, izq: 'N' as Polo, der: 'S' as Polo, carga };
      const r = regimen(p);
      expect(r.Pel).toBeCloseTo(r.Pjoule + r.E * r.I, 10);
      expect(r.Putil).toBeCloseTo(r.E * r.I, 10);
      expect(r.eta).toBeCloseTo(r.E / V, 10);
      // con cualquier ω (también en el arranque): la misma identidad con la corriente media
      for (const w of [0, 0.3 * r.omega, 0.8 * r.omega]) {
        const c = configImanes('N', 'S');
        const I = corriente({ ...p, energizado: true }, c, w);
        const E = fcemMedia(c, N, w);
        expect(V * I).toBeCloseTo(I * I * rArmadura(N) + E * I, 10);
      }
    }
  });

  it('por debajo del umbral V = τ·R/k no arranca; por encima, sí', () => {
    const N = 50, carga = 0.01, umbral = (carga * rArmadura(N)) / kMotor(N);
    const quieto = estadoInicial(0);
    avanzar(quieto, { V: 0.85 * umbral, N, izq: 'N', der: 'S', carga, energizado: true }, 0.5);
    expect(quieto.omega).toBe(0);
    expect(quieto.theta).toBe(0);
    const gira = estadoInicial(0);
    avanzar(gira, { V: 1.2 * umbral, N, izq: 'N', der: 'S', carga, energizado: true }, 0.5);
    expect(gira.omega).toBeGreaterThan(0);
  });

  it('el sentido: N–S horario (+), S–N antihorario (−), N–N no gira y la corriente es V/R', () => {
    const base = { V: 10, N: 50, carga: 0.008, energizado: true };
    expect(aRegimen({ ...base, izq: 'N', der: 'S' }).omegaMedia).toBeGreaterThan(0);
    expect(aRegimen({ ...base, izq: 'S', der: 'N' }).omegaMedia).toBeLessThan(0);
    const e = estadoInicial(0.2);
    avanzar(e, { ...base, izq: 'N', der: 'N' }, 0.3);
    expect(e.omega).toBe(0);
    expect(e.I).toBeCloseTo(10 / rArmadura(50), 12);
  });

  it('arranque exponencial con τ_m = J·R/k² y frenado con la desaceleración τ_c/J al cortar', () => {
    const p: ParamsMotor = { V: 12, N: 50, izq: 'N', der: 'S', carga: 0.006, energizado: true };
    const wf = regimen(p).omega, tm = tauMecanica(50);
    const e = estadoInicial(0);
    avanzar(e, p, tm);
    expect(rel(e.omega / wf, 1 - Math.exp(-1))).toBeLessThan(0.03);
    // cortar: circuito abierto, sólo el freno
    avanzar(e, p, 12 * tm);
    const w0 = e.omega;
    avanzar(e, { ...p, energizado: false }, 0.05);
    expect(e.I).toBe(0);
    expect(rel((w0 - e.omega) / 0.05, p.carga / J_ROTOR)).toBeLessThan(1e-6);
    avanzar(e, { ...p, energizado: false }, 5);
    expect(e.omega).toBe(0); // el freno para, no invierte
  });
});

describe('reloj único', () => {
  it('la cámara lenta deja ver el inducido a ≤ 2,4 vueltas por segundo de pantalla', () => {
    for (const rps of [1, 5, 19, 40, 120, 180]) {
      const f = factorAuto(rps);
      expect(LENTOS).toContain(f);
      expect(rps * f).toBeLessThanOrEqual(VUELTAS_VISIBLES + 1e-12);
    }
  });

  it('arranca ya en régimen, con ω(t) llena y el tacómetro midiendo por pulsos', () => {
    const r = new RelojMotor({ V: 6, N: 50, izq: 'N', der: 'S', carga: 0.004, energizado: true });
    r.arrancarEnRegimen();
    const dom = estadoMotor({ voltaje: 6, espiras: 50, imanIzq: 'N', imanDer: 'S', carga: 0.004 });
    expect(r.hn).toBeGreaterThan(300);
    expect(rel(r.muestra(0).w, dom.omega)).toBeLessThan(1e-3);
    const l = r.lectura();
    expect(rel(l.nTacho, dom.rpm)).toBeLessThan(2e-3);
    expect(l.Pel).toBeCloseTo(l.Pjoule + l.Pint, 10);
    expect(l.eta!).toBeGreaterThan(0.9);
    // en régimen, lo que pasa al rotor (E·I) es lo que absorbe el freno: η = E/V = P_freno/P_el
    expect(l.eta!).toBeCloseTo(l.E / 6, 10);
    expect(rel(l.eta!, l.Pfreno / l.Pel)).toBeLessThan(2e-2);
    expect(r.factor * Math.abs(dom.rpm / 60)).toBeLessThanOrEqual(VUELTAS_VISIBLES);
    // un cuadro de 1/60 s avanza factor/60 s de modelo
    const t0 = r.e.t;
    r.paso(1 / 60);
    expect(r.e.t - t0).toBeCloseTo(r.factor / 60, 9);
    r.pausa = true;
    r.paso(1 / 60);
    expect(r.e.t - t0).toBeCloseTo(r.factor / 60, 9);
  });

  it('al invertir los imanes el tacómetro acaba marcando el giro contrario', () => {
    const r = new RelojMotor({ V: 8, N: 50, izq: 'N', der: 'S', carga: 0.006, energizado: true });
    r.arrancarEnRegimen();
    r.fijar({ izq: 'S', der: 'N' });
    for (let i = 0; i < 4000 && r.lectura().nTacho >= 0; i++) r.paso(1 / 30);
    const dom = estadoMotor({ voltaje: 8, espiras: 50, imanIzq: 'S', imanDer: 'N', carga: 0.006 });
    for (let i = 0; i < 400; i++) r.paso(1 / 30);
    expect(rel(r.lectura().nTacho, dom.rpm)).toBeLessThan(3e-3);
  });

  it('con polos iguales toda la potencia se va en calor: E = 0, I = V/R, η = 0 aunque el rotor siga rodando', () => {
    const r = new RelojMotor({ V: 6, N: 50, izq: 'N', der: 'S', carga: 0.004, energizado: true });
    r.arrancarEnRegimen();
    r.fijar({ der: 'N' });
    r.paso(1 / 30);
    const l = r.lectura();
    expect(Math.abs(l.omega)).toBeGreaterThan(50);
    expect(l.E).toBeCloseTo(0, 12);
    expect(l.I).toBeCloseTo(6 / rArmadura(50), 10);
    expect(l.Pjoule).toBeCloseTo(l.Pel, 10);
    expect(l.eta).toBeCloseTo(0, 12);
  });
});
