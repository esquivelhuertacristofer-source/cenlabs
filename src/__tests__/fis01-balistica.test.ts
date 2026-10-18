/**
 * F1 · Tiro parabólico: la física que mueve la escena, el dock y el juez del reto
 * (domain/fisica · volarTiro, fis01/balistica.ts, fis01/reloj.ts).
 *  · Vacío: el RK4 reproduce las formas cerradas R = v₀² sen 2θ/g, H = (v₀ sen θ)²/2g,
 *    T = 2v₀ sen θ/g y la posición en todo instante; ángulos complementarios, 45° óptimo.
 *  · Arrastre cuadrático: k → 0 converge a la parábola (error ∝ k), caída vertical contra la
 *    solución analítica con tanh, convergencia en h, el ángulo óptimo baja de 45°.
 *  · Energía: se conserva sin aire; con aire, lo perdido es el trabajo del arrastre.
 *  · Estroboscopio: Δx constante y Δ²y = −g·Δt² (independencia de los movimientos).
 *  · Juez y escena: la misma trayectoria; el reloj del reto dura lo que tarda el veredicto.
 */
import {
  ESCENARIOS, H_TIRO, RADIO_DIANA, coefArrastre, condicionesMision, duracionAnimacionMs, simularDisparo, volarTiro,
  type CondicionesTiro, type Mision1,
} from '@/domain/fisica';
import {
  G_TIERRA, K_AIRE, alcanceVacio, alturaMaxVacio, tiempoVueloVacio, alcanceVacioDesde, estadoVacio, energia,
  potenciaArrastre, velocidadTerminal, trayectoria, estadoEn, tiempoApice, anguloOptimo, alcance, pasoEstrobo,
  marcasEstrobo, condicionesBanco,
} from '@/components/simuladores/fis01/balistica';
import { RelojTiro, ESPERA_BUCLE, BANCO_INICIAL } from '@/components/simuladores/fis01/reloj';

const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
const vacio = (g: number, y0 = 0): CondicionesTiro => ({ g, k: 0, viento: 0, y0, muro: null });

describe('vacío: el integrador reproduce las formas cerradas', () => {
  const casos: [number, number, number][] = [[9.81, 18, 60], [9.81, 25, 45], [9.81, 7, 15], [1.62, 30, 70], [24.79, 40, 33]];

  it.each(casos)('g = %p, v₀ = %p m/s, θ = %p°: R, H y T exactos', (g, v, a) => {
    const tr = trayectoria(vacio(g), { angulo: a, velocidad: v });
    expect(rel(tr.vuelo.hitX, alcanceVacio(v, a, g))).toBeLessThan(1e-10);
    expect(rel(tr.vuelo.maxY, alturaMaxVacio(v, a, g))).toBeLessThan(1e-10);
    expect(rel(tr.T, tiempoVueloVacio(v, a, g))).toBeLessThan(1e-10);
  });

  it('desde una altura y₀: R y T de la parábola completa', () => {
    for (const [y0, v, a] of [[20, 25, 40], [35, 10, 5], [12, 60, 75]]) {
      const tr = trayectoria(vacio(9.81, y0), { angulo: a, velocidad: v });
      expect(rel(tr.vuelo.hitX, alcanceVacioDesde(v, a, 9.81, y0))).toBeLessThan(1e-10);
      expect(rel(tr.T, tiempoVueloVacio(v, a, 9.81, y0))).toBeLessThan(1e-10);
    }
  });

  it('la lectura densa (Hermite entre pasos) es la parábola en cualquier instante', () => {
    const v = 18, a = 60, tr = trayectoria(vacio(9.81), { angulo: a, velocidad: v });
    let peor = 0;
    for (let i = 0; i <= 997; i++) {
      const t = (i / 997) * tr.T;
      const e = estadoEn(tr, t), c = estadoVacio(v, a, 9.81, 0, t);
      peor = Math.max(peor, Math.abs(e.x - c.x), Math.abs(e.y - c.y), Math.abs(e.vx - c.vx), Math.abs(e.vy - c.vy));
    }
    expect(peor).toBeLessThan(1e-9);
  });

  it('ángulos complementarios dan el mismo alcance; el máximo está en 45°', () => {
    for (const a of [10, 15, 30, 37, 44]) {
      const r1 = alcance(20, a, 9.81, 0), r2 = alcance(20, 90 - a, 9.81, 0);
      expect(Math.abs(r1 - r2)).toBeLessThan(1e-9);
    }
    const o = anguloOptimo(20, 9.81, 0);
    expect(Math.abs(o.angulo - 45)).toBeLessThan(1e-3);
    expect(rel(o.alcance, (20 * 20) / 9.81)).toBeLessThan(1e-9);
  });

  it('el vértice está en t = v₀ sen θ / g con vy = 0', () => {
    const tr = trayectoria(vacio(9.81), { angulo: 60, velocidad: 18 });
    const ta = tiempoApice(tr)!;
    expect(Math.abs(ta - (18 * Math.sin(Math.PI / 3)) / 9.81)).toBeLessThan(1e-9);
  });
});

describe('arrastre cuadrático (RK4)', () => {
  it('k del balín: ρ·Cd·A/(2m) = 0,003256 1/m al nivel del mar', () => {
    expect(K_AIRE).toBeCloseTo((1.225 * 0.47 * Math.PI * 0.06 * 0.06) / 2, 12);
    expect(K_AIRE).toBeCloseTo(0.003256, 6);
  });

  it('con k → 0 converge a la parábola: el error del alcance es proporcional a k', () => {
    const v = 25, a = 40, R0 = alcanceVacio(v, a, 9.81);
    const d1 = R0 - alcance(v, a, 9.81, 1e-4), d2 = R0 - alcance(v, a, 9.81, 1e-5), d3 = R0 - alcance(v, a, 9.81, 1e-9);
    expect(d1).toBeGreaterThan(0);
    expect(rel(d1 / d2, 10)).toBeLessThan(0.02);
    expect(Math.abs(d3)).toBeLessThan(1e-5);
  });

  it('caída vertical: y(t) = y₀ − (v_t²/g)·ln cosh(g·t/v_t) y v → v_t = √(g/k)', () => {
    const g = 9.81, k = K_AIRE, vt = velocidadTerminal(g, k);
    expect(vt).toBeCloseTo(54.89, 2);
    const tr = trayectoria({ g, k, viento: 0, y0: 2000, muro: null }, { angulo: 90, velocidad: 0 });
    for (const t of [1, 3, 5, 10, 20]) {
      const e = estadoEn(tr, t);
      const y = 2000 - ((vt * vt) / g) * Math.log(Math.cosh((g * t) / vt));
      const vy = -vt * Math.tanh((g * t) / vt);
      expect(rel(e.y, y)).toBeLessThan(1e-9);
      expect(rel(e.vy, vy)).toBeLessThan(1e-8);
    }
  });

  it('el paso h = 0,04 s deja el impacto a < 1 mm del de h/16 (con viento y muro)', () => {
    const c: CondicionesTiro = { g: 9.81, k: K_AIRE, viento: -4, y0: 15, muro: null };
    for (const [v, a] of [[40, 35], [90, 20], [15, 70]]) {
      const a1 = volarTiro(c, { angulo: a, velocidad: v }, false, H_TIRO);
      const a2 = volarTiro(c, { angulo: a, velocidad: v }, false, H_TIRO / 16);
      expect(Math.abs(a1.hitX - a2.hitX)).toBeLessThan(1e-3);
      expect(Math.abs(a1.t - a2.t)).toBeLessThan(1e-4);
    }
    const cm: CondicionesTiro = { ...c, muro: { x: 30, alto: 25 } };   // en x = 30 m el balín pasa a ≈ 19,5 m
    const m1 = volarTiro(cm, { angulo: 12, velocidad: 50 }, false, H_TIRO);
    const m2 = volarTiro(cm, { angulo: 12, velocidad: 50 }, false, H_TIRO / 16);
    expect(m1.fin).toBe('muro');
    expect(Math.abs(m1.yImpacto - m2.yImpacto)).toBeLessThan(1e-3);
  });

  it('el aire acorta el alcance; el ángulo óptimo baja de 45° y baja más cuanto más rápido', () => {
    const vs = [5, 10, 18, 25, 40, 60, 100];
    const opt = vs.map((v) => anguloOptimo(v, 9.81, K_AIRE).angulo);
    expect(opt[0]).toBeGreaterThan(44.5);
    for (let i = 0; i < vs.length; i++) {
      expect(opt[i]).toBeLessThan(45);
      if (i > 0) expect(opt[i]).toBeLessThan(opt[i - 1]);
      expect(alcance(vs[i], 45, 9.81, K_AIRE)).toBeLessThan(alcanceVacio(vs[i], 45, 9.81));
    }
    // valores de referencia del banco (los muestra el dock)
    expect(opt[2]).toBeGreaterThan(42.5); expect(opt[2]).toBeLessThan(44.5);
    expect(opt[6]).toBeGreaterThan(30); expect(opt[6]).toBeLessThan(40);
  });

  it('con aire, el complementario bajo llega más lejos que el alto', () => {
    expect(alcance(25, 30, 9.81, K_AIRE)).toBeGreaterThan(alcance(25, 60, 9.81, K_AIRE));
  });
});

describe('energía mecánica', () => {
  it('sin aire se conserva en todo el vuelo (a 1e-12 relativo)', () => {
    const tr = trayectoria(vacio(9.81, 10), { angulo: 52, velocidad: 30 });
    const E0 = energia(tr.muestras[0], 9.81);
    for (const m of tr.muestras) expect(rel(energia(m, 9.81), E0)).toBeLessThan(1e-12);
  });

  it('con aire, la energía perdida es el trabajo del arrastre ∫k|v|³dt', () => {
    const c = condicionesBanco(true);
    const tr = trayectoria(c, { angulo: 45, velocidad: 40 });
    const n = 4000, T = tr.T;
    let W = 0;
    for (let i = 0; i <= n; i++) {
      const e = estadoEn(tr, (i / n) * T);
      W += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * potenciaArrastre(c.k, 0, e.vx, e.vy);
    }
    W *= T / (3 * n);
    const perdida = energia(estadoEn(tr, T), c.g) - energia(tr.muestras[0], c.g);
    expect(perdida).toBeLessThan(0);
    expect(rel(perdida, W)).toBeLessThan(1e-6);
  });
});

describe('estroboscopio: independencia de los movimientos', () => {
  it('sin aire: Δx = v₀cosθ·Δt constante y Δ²y = −g·Δt²', () => {
    const v = 18, a = 60, g = 9.81;
    const tr = trayectoria(vacio(g), { angulo: a, velocidad: v });
    const dt = pasoEstrobo(tr.T);
    const mk = marcasEstrobo(tr, dt);
    expect(mk.length).toBeGreaterThan(9);
    for (let i = 1; i < mk.length; i++) {
      expect(Math.abs(mk[i].x - mk[i - 1].x - v * Math.cos(Math.PI / 3) * dt)).toBeLessThan(1e-9);
      expect(Math.abs(mk[i].t - mk[i - 1].t - dt)).toBeLessThan(1e-12);
    }
    for (let i = 2; i < mk.length; i++) expect(Math.abs(mk[i].y - 2 * mk[i - 1].y + mk[i - 2].y + g * dt * dt)).toBeLessThan(1e-9);
  });

  it('con aire: el paso horizontal se acorta de imagen en imagen', () => {
    const tr = trayectoria(condicionesBanco(true), { angulo: 60, velocidad: 25 });
    const mk = marcasEstrobo(tr, pasoEstrobo(tr.T));
    for (let i = 2; i < mk.length; i++) expect(mk[i].x - mk[i - 1].x).toBeLessThan(mk[i - 1].x - mk[i - 2].x);
  });

  it('el intervalo es «redondo» y deja entre 10 y 24 imágenes en vuelos de 0,5 s a 2 min', () => {
    for (const T of [0.5, 1.2, 3.18, 5.1, 9, 30, 60, 120]) {
      const p = pasoEstrobo(T);
      expect([0.05, 0.1, 0.2, 0.5, 1, 2, 5]).toContain(p);
      expect(T / p).toBeLessThanOrEqual(24);
      expect(T / p).toBeGreaterThanOrEqual(9.6);
    }
  });
});

describe('el juez del reto y la escena usan la misma trayectoria', () => {
  const m: Mision1 = { escenario: 'tierra', targetX: 65, y0: 17, obsX: 26, obsY: 27, viento: 3.9 };

  it('simularDisparo y la trayectoria de la escena caen en el mismo punto (bit a bit)', () => {
    for (const d of [{ angulo: 45, velocidad: 25 }, { angulo: 62, velocidad: 31 }, { angulo: 10, velocidad: 80 }]) {
      const r = simularDisparo(m, d, true);
      const tr = trayectoria(condicionesMision(m), d);
      expect(tr.vuelo.hitX).toBe(r.hitX);
      expect(tr.T).toBe(r.t);
      expect(estadoEn(tr, tr.T).x).toBeCloseTo(r.hitX, 12);
    }
  });

  it('el muro: por debajo de su altura choca en su cara; por encima pasa', () => {
    const luna: Mision1 = { escenario: 'luna', targetX: 70, y0: 10, obsX: 30, obsY: 20, viento: 0 };
    const bajo = simularDisparo(luna, { angulo: 10, velocidad: 40 });
    expect(bajo.resultado).toBe('colision');
    expect(bajo.hitX).toBe(30);
    // y en el muro contra la parábola: y = y₀ + x·tanθ − g·x²/(2v²cos²θ)
    const th = (10 * Math.PI) / 180, g = ESCENARIOS.luna.g;
    const yTeo = 10 + 30 * Math.tan(th) - (g * 30 * 30) / (2 * 40 * 40 * Math.cos(th) ** 2);
    expect(Math.abs(bajo.yImpacto - yTeo)).toBeLessThan(1e-9);
    const alto = simularDisparo(luna, { angulo: 30, velocidad: 25 });
    expect(alto.resultado).not.toBe('colision');
  });

  it('acierto = caer a ≤ 2,5 m del centro de la diana (criterio sin cambios)', () => {
    const luna: Mision1 = { escenario: 'luna', targetX: 70, y0: 0, obsX: 1e6, obsY: 0, viento: 0 };
    // v tal que R = 70 m exactos a 45° sin aire: v = √(R·g)
    const v = Math.sqrt(70 * ESCENARIOS.luna.g);
    expect(simularDisparo(luna, { angulo: 45, velocidad: v }).resultado).toBe('exito');
    const vLejos = Math.sqrt((70 + RADIO_DIANA + 0.05) * ESCENARIOS.luna.g);
    expect(simularDisparo(luna, { angulo: 45, velocidad: vLejos }).resultado).toBe('fallo');
    expect(coefArrastre(0)).toBe(0);
  });
});

describe('reloj único', () => {
  it('banco: arranca disparando, aterriza, mantiene la foto y vuelve a disparar', () => {
    const r = new RelojTiro('banco');
    expect(r.fase).toBe('vuelo');
    expect(r.t).toBe(0);
    expect(r.p).toEqual(BANCO_INICIAL);
    const T = r.tiro!.T, d0 = r.disparos;
    for (let i = 0; i < 600 && r.fase === 'vuelo'; i++) r.paso(1 / 60);
    expect(r.fase).toBe('espera');
    expect(r.t).toBe(T);
    expect(r.marcasVisibles).toBe(r.marcas.length);
    for (let i = 0; i < Math.ceil((ESPERA_BUCLE + 0.1) * 60); i++) r.paso(1 / 60);
    expect(r.fase).toBe('vuelo');
    expect(r.disparos).toBe(d0 + 1);
  });

  it('la lectura del dock es el estado de la escena en ese mismo cuadro', () => {
    const r = new RelojTiro('banco');
    for (let i = 0; i < 37; i++) r.paso(1 / 60);
    const l = r.lectura()!, e = estadoEn(r.tiro!, r.t);
    expect(l.x).toBe(e.x); expect(l.y).toBe(e.y); expect(l.vx).toBe(e.vx); expect(l.vy).toBe(e.vy);
    expect(l.t).toBeCloseTo(37 / 60, 12);
  });

  it('banco: al mover un mando la trayectoria nueva se ve completa al instante', () => {
    const r = new RelojTiro('banco');
    r.fijar({ angulo: 30, velocidad: 18, aire: false });
    expect(r.fase).toBe('espera');
    expect(r.t).toBe(r.tiro!.T);
    expect(r.vacio).toBeNull();
    expect(Math.abs(r.comp!.vuelo.hitX - r.tiro!.vuelo.hitX)).toBeLessThan(1e-9); // complementario sin aire
    expect(Math.abs(r.optimo!.angulo - 45)).toBeLessThan(1e-3);
    r.fijar({ angulo: 30, velocidad: 18, aire: true });
    expect(r.vacio).not.toBeNull();
    expect(r.optimo!.angulo).toBeLessThan(45);
  });

  it('la pausa congela el banco', () => {
    const r = new RelojTiro('banco');
    r.paso(0.05);
    const t = r.t;
    r.pausa = true;
    r.paso(0.05);
    expect(r.t).toBe(t);
  });

  it('reto: sin disparo no hay trayectoria; el vuelo dura lo que tarda el veredicto del store', () => {
    const m: Mision1 = { escenario: 'marte', targetX: 70, y0: 22, obsX: 30, obsY: 15, viento: -6.5 };
    const r = new RelojTiro('reto');
    expect(r.lectura()).toBeNull();
    expect(r.tiro).toBeNull();
    r.limpiar(m);
    expect(r.lectura()).toBeNull();
    const d = { angulo: 41, velocidad: 24 };
    r.dispararReto(m, d, 1);
    const sim = simularDisparo(m, d);
    expect(r.tiro!.T).toBe(sim.t);
    const dur = duracionAnimacionMs(sim.t) / 1000;
    expect(r.factor * dur).toBeCloseTo(sim.t, 12);
    // a 60 Hz la bola aterriza en el cuadro en que vence el temporizador del store
    let n = 0;
    while (r.fase === 'vuelo' && n < 1000) { r.paso(1 / 60); n++; }
    expect(Math.abs(n / 60 - dur)).toBeLessThan(1 / 60 + 1e-9);
    expect(r.lectura()!.x).toBeCloseTo(sim.hitX, 12);
    expect(r.historial.length).toBe(1);
    // la pausa del banco no detiene el reto (el veredicto llega a su hora)
    r.dispararReto(m, { angulo: 50, velocidad: 24 }, 2);
    r.pausa = true;
    r.paso(0.05);
    expect(r.t).toBeGreaterThan(0);
    expect(r.historial.length).toBe(2);
    r.limpiar({ ...m, targetX: 60 });
    expect(r.historial.length).toBe(0);
  });

  it('el reloj del banco sale de las condiciones del banco (Tierra, y₀ = 0, sin muro ni viento)', () => {
    const r = new RelojTiro('banco');
    expect(r.tiro!.cond).toEqual({ g: G_TIERRA, k: K_AIRE, viento: 0, y0: 0, muro: null });
  });
});
