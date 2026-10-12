/**
 * Dominio de física: la ciencia de cada lab, sus validadores y —para cada reto
 * con semilla— un barrido que comprueba que (a) existe una posición de los
 * controles que aprueba y (b) el estado inicial NO aprueba.
 */
import * as F from '@/domain/fisica';

// Generador pseudoaleatorio determinista (mulberry32) para que los barridos sean reproducibles.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rango = (r: { min: number; max: number; paso: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.paso) out.push(Math.round(v * 1e6) / 1e6);
  return out;
};

// ── F1 Tiro parabólico ──────────────────────────────────────────────────────
describe('F1 — tiro parabólico', () => {
  it('sin aire ni viento coincide con la parábola ideal', () => {
    const m: F.Mision1 = { escenario: 'luna', targetX: 60, y0: 0.0001, obsX: 1e6, obsY: 0, viento: 0 };
    const v = 20, ang = 45, g = F.ESCENARIOS.luna.g;
    const r = F.simularDisparo({ ...m }, { angulo: ang, velocidad: v });
    expect(r.hitX).toBeCloseTo((v * v) / g, 0); // alcance R = v²·sin2θ/g
  });

  it('el aire acorta el alcance y el viento a favor lo alarga', () => {
    const base: F.Mision1 = { escenario: 'tierra', targetX: 60, y0: 10, obsX: 1e6, obsY: 0, viento: 0 };
    const d = { angulo: 40, velocidad: 30 };
    const quieto = F.simularDisparo(base, d).hitX;
    const sinAire = F.simularDisparo({ ...base, escenario: 'luna' }, d); // otra g: solo se compara el signo del efecto
    expect(sinAire.hitX).toBeGreaterThan(0);
    expect(F.simularDisparo({ ...base, viento: 5 }, d).hitX).toBeGreaterThan(quieto);
    expect(F.simularDisparo({ ...base, viento: -5 }, d).hitX).toBeLessThan(quieto);
  });

  it('el muro detiene el proyectil aunque el paso de integración sea grande', () => {
    const m: F.Mision1 = { escenario: 'tierra', targetX: 80, y0: 10, obsX: 30, obsY: 30, viento: 0 };
    const r = F.simularDisparo(m, { angulo: 5, velocidad: 100 });
    expect(r.resultado).toBe('colision');
    expect(r.hitX).toBe(30);
  });

  it('un vuelo largo no se reporta como X = 0', () => {
    const m: F.Mision1 = { escenario: 'luna', targetX: 80, y0: 30, obsX: 20, obsY: 10, viento: 0 };
    const r = F.simularDisparo(m, { angulo: 80, velocidad: 60 });
    expect(r.t).toBeGreaterThan(10);
    expect(r.hitX).toBeGreaterThan(0);
  });

  it('el veredicto es haber acertado al menos una vez; un fallo posterior no lo borra', () => {
    expect(F.validarF1({ aciertos: 0 })).toBe(false);
    expect(F.validarF1({ aciertos: 1 })).toBe(true);
  });

  // Para cada misión debe existir (ángulo, velocidad) en la rejilla de los
  // controles que acierte. Se busca por ángulo con bisección de la velocidad
  // (sin muro) y luego se prueban las velocidades enteras vecinas con el muro.
  it.each(Object.keys(F.ESCENARIOS) as F.Escenario[])('toda misión de %s tiene solución con los controles', (esc) => {
    const r = rng(esc.length * 97);
    for (let i = 0; i < 80; i++) {
      const m = F.generarMision1(esc, r);
      let ok = false;
      for (let ang = 5; ang <= 85 && !ok; ang += 2) {
        const libre = { ...m, obsX: 1e6 };
        // primera velocidad (de 10 en 10) que se pasa de la diana: evita integrar vuelos larguísimos
        let hi = -1;
        for (let v = 10; v <= 100; v += 10) {
          if (F.simularDisparo(libre, { angulo: ang, velocidad: v }).hitX >= m.targetX) { hi = v; break; }
        }
        if (hi < 0) continue;
        let lo = hi - 10;
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          if (F.simularDisparo(libre, { angulo: ang, velocidad: mid }).hitX < m.targetX) lo = mid; else hi = mid;
        }
        for (const v of [Math.floor(lo) - 1, Math.floor(lo), Math.ceil(hi), Math.ceil(hi) + 1]) {
          if (v < 0 || v > 100) continue;
          if (F.simularDisparo(m, { angulo: ang, velocidad: v }).resultado === 'exito') { ok = true; break; }
        }
      }
      if (!ok) throw new Error(`misión sin solución en ${esc}: ${JSON.stringify(m)}`);
    }
  });
});

// ── F2 Plano inclinado ──────────────────────────────────────────────────────
describe('F2 — plano inclinado', () => {
  const p = { angulo: 30, empuje: 0, masa: 5, muS: 0.4, muK: 0.3 };
  it('sin fuerza y con fricción suficiente el bloque queda en reposo', () => {
    expect(F.dinamicaPlano({ ...p, angulo: 20 }).estado).toBe('reposo'); // tan20° = 0.36 < 0.4
  });
  it('baja con a = g(sinθ − μk·cosθ)', () => {
    const d = F.dinamicaPlano(p); // tan30° = 0.577 > 0.4 → desliza
    expect(d.estado).toBe('baja');
    expect(d.a).toBeCloseTo(-9.81 * (Math.sin(Math.PI / 6) - 0.3 * Math.cos(Math.PI / 6)), 6);
  });
  it('sube con a = (F − mg·sinθ − μk·N)/m', () => {
    const d = F.dinamicaPlano({ ...p, empuje: 100 });
    const W = 5 * 9.81;
    expect(d.estado).toBe('sube');
    expect(d.a).toBeCloseTo((100 - W * 0.5 - 0.3 * W * Math.cos(Math.PI / 6)) / 5, 6);
  });
  it('valida solo un ensayo en movimiento con predicción a ±0.1 m/s²', () => {
    expect(F.validarF2({ ensayo: null })).toBe(false);
    const a = F.dinamicaPlano({ ...p, empuje: 100 }).a;
    expect(F.validarF2({ ensayo: { ...p, empuje: 100, prediccion: a + 0.05 } })).toBe(true);
    expect(F.validarF2({ ensayo: { ...p, empuje: 100, prediccion: a + 0.3 } })).toBe(false);
    expect(F.validarF2({ ensayo: { ...p, angulo: 10, prediccion: 0 } })).toBe(false); // reposo: no cuenta
  });
  it('toda semilla de fricción permite un ensayo en movimiento con los controles', () => {
    const r = rng(2);
    for (let i = 0; i < 200; i++) {
      const { muK, muS } = F.generarFriccion2(r);
      expect(muS).toBeGreaterThan(muK);
      expect(F.dinamicaPlano({ angulo: 0, empuje: 600, masa: 5, muK, muS }).estado).toBe('sube');
    }
  });
});

// ── F3 Péndulo ──────────────────────────────────────────────────────────────
describe('F3 — péndulo simple', () => {
  const g = 9.81;
  const muestra = (L: number, m: number, n = 10, err = 0) => ({ L, m, n, t: n * F.periodoPendulo(L, g) + err });
  const buenas = [muestra(1, 1), muestra(1, 5), muestra(2, 1), muestra(3, 1)];
  it('T = 2π√(L/g)', () => expect(F.periodoPendulo(1, 9.81)).toBeCloseTo(2.006, 3));
  it('un intento recién abierto no aprueba', () => expect(F.validarF3({ gSemilla: g, muestras: [], gAlumno: null })).toBe(false));
  it('aprueba con 3 longitudes, independencia de masa y g a ±5 %', () => {
    expect(F.validarF3({ gSemilla: g, muestras: buenas, gAlumno: 9.6 })).toBe(true);
    expect(F.validarF3({ gSemilla: g, muestras: buenas, gAlumno: 10.6 })).toBe(false);
  });
  it('rechaza muestras de una sola oscilación o incoherentes', () => {
    expect(F.validarF3({ gSemilla: g, muestras: [...buenas, muestra(2.5, 1, 1)], gAlumno: g })).toBe(false);
    expect(F.validarF3({ gSemilla: g, muestras: [...buenas, { L: 2.5, m: 1, n: 10, t: 5 }], gAlumno: g })).toBe(false);
  });
  it('sin dos masas a la misma L no demuestra la independencia de la masa', () => {
    expect(F.validarF3({ gSemilla: g, muestras: [muestra(1, 1), muestra(2, 1), muestra(3, 1)], gAlumno: g })).toBe(false);
  });
  it('el error de reacción (±0.2 s sobre 10 oscilaciones) cabe en la tolerancia para toda semilla', () => {
    const r = rng(3);
    for (let i = 0; i < 500; i++) {
      const gs = F.generarGravedad3(r);
      // peor caso: L mínima (0.5 m) y cronómetro desviado 0.2 s
      const peores = [0.5, 1.5, 3].flatMap((L) => [1, 5].map((m) => ({ L, m, n: 10, t: 10 * F.periodoPendulo(L, gs) + 0.2 })));
      const Tmed = peores.map((s) => s.t / s.n);
      const gMed = peores.reduce((acc, s, k) => acc + (4 * Math.PI ** 2 * s.L) / Tmed[k] ** 2, 0) / peores.length;
      expect(F.validarF3({ gSemilla: gs, muestras: peores, gAlumno: gMed })).toBe(true);
    }
  });
});

// ── F4 Hooke ────────────────────────────────────────────────────────────────
describe('F4 — ley de Hooke', () => {
  const k = 40;
  const est = [{ m: 1, x: F.lecturaRegla(F.elongacionEquilibrio(1, k)) }, { m: 3, x: F.lecturaRegla(F.elongacionEquilibrio(3, k)) }];
  const din = (m: number, A: number, err = 0) => ({ m, A, n: 10, t: 10 * F.periodoResorte(m, k) + err });
  const dinOk = [din(1, 0.1), din(3, 0.1), din(5, 0.1), din(5, 0.3)];
  it('x = mg/k y T = 2π√(m/k)', () => {
    expect(F.elongacionEquilibrio(2, 19.62)).toBeCloseTo(1, 6);
    expect(F.periodoResorte(1, 4 * Math.PI ** 2)).toBeCloseTo(1, 6);
  });
  it('un intento recién abierto no aprueba', () => expect(F.validarF4({ kSemilla: k, estatica: [], dinamica: [], kAlumno: null })).toBe(false));
  it('aprueba con ambos métodos y k a ±5 %', () => {
    expect(F.validarF4({ kSemilla: k, estatica: est, dinamica: dinOk, kAlumno: 41 })).toBe(true);
    expect(F.validarF4({ kSemilla: k, estatica: est, dinamica: dinOk, kAlumno: 44 })).toBe(false);
    expect(F.validarF4({ kSemilla: k, estatica: est.slice(0, 1), dinamica: dinOk, kAlumno: k })).toBe(false);
    expect(F.validarF4({ kSemilla: k, estatica: est, dinamica: dinOk.slice(0, 3), kAlumno: k })).toBe(false); // una sola amplitud
  });
  it('el peor error de cronometraje sigue dentro de la tolerancia de cada muestra', () => {
    const r = rng(4);
    for (let i = 0; i < 500; i++) {
      const ks = F.generarRigidez4(r);
      for (const m of [1, 2, 3, 4, 5]) {
        expect(F.muestraCronoValida({ n: 10, t: 10 * F.periodoResorte(m, ks) + 0.2 }, F.periodoResorte(m, ks))).toBe(true);
      }
      // y el método estático con la regla al milímetro da k a mejor que ±5 % (m = 5 kg)
      const x = F.lecturaRegla(F.elongacionEquilibrio(5, ks));
      expect(Math.abs((5 * 9.81) / x - ks) / ks).toBeLessThan(0.05);
    }
  });
});

// ── F5 Prensa hidráulica ────────────────────────────────────────────────────
describe('F5 — prensa hidráulica', () => {
  it('F₁min = m·g·(r₁/r₂)² y el volumen se conserva', () => {
    expect(F.fuerzaMinima(1000, 1, 2)).toBeCloseTo(9810 / 4, 6);
    expect(F.desplazamientoSalida(10, 1, 2)).toBeCloseTo(2.5, 9);
    expect(F.areaCm(1) * 10).toBeCloseTo(F.areaCm(2) * F.desplazamientoSalida(10, 1, 2), 12);
  });
  it('valida solo si la carga subió y la predicción de F mínima es correcta', () => {
    const base = { r1: 1, r2: 2, masaCarga: 1000 };
    const fmin = F.fuerzaMinima(1000, 1, 2);
    expect(F.validarF5({ ensayo: null })).toBe(false);
    expect(F.validarF5({ ensayo: { ...base, f1: fmin + 10, prediccion: fmin } })).toBe(true);
    expect(F.validarF5({ ensayo: { ...base, f1: fmin - 10, prediccion: fmin } })).toBe(false);
    expect(F.validarF5({ ensayo: { ...base, f1: fmin + 10, prediccion: fmin * 1.1 } })).toBe(false);
  });
  it('toda carga sembrada se puede elevar con los controles', () => {
    const r = rng(5);
    for (let i = 0; i < 500; i++) {
      const m = F.generarCarga5(r);
      expect(F.fuerzaMinima(m, F.RANGO_R1.min, F.RANGO_R2.max)).toBeLessThanOrEqual(F.RANGO_F1.max);
    }
  });
});

// ── F6 Arquímedes ───────────────────────────────────────────────────────────
describe('F6 — Arquímedes', () => {
  it('la inmersión nunca pasa del 100 %', () => {
    expect(F.pesoAparente(2700, 1e-4, 1000, 1.1)).toBeCloseTo(F.pesoAparente(2700, 1e-4, 1000, 1), 12);
  });
  it('un intento recién abierto no aprueba', () => {
    expect(F.validarF6({ densidadCuerpo: 2700, lecturaAire: null, lecturaFluido: null, densidadAlumno: null })).toBe(false);
  });
  it('toda semilla se resuelve con las lecturas del dinamómetro y cualquier fluido', () => {
    const r = rng(6);
    for (let i = 0; i < 500; i++) {
      const { densidadCuerpo, volumenCuerpo } = F.generarSolido6(r);
      for (const fl of Object.values(F.FLUIDOS)) {
        expect(densidadCuerpo).toBeGreaterThan(fl.rho); // se hunde: el hilo siempre tenso
        const W = F.lecturaDinamometro(F.pesoAparente(densidadCuerpo, volumenCuerpo, fl.rho, 0));
        const Wap = F.lecturaDinamometro(F.pesoAparente(densidadCuerpo, volumenCuerpo, fl.rho, 1));
        const rho = (fl.rho * W) / (W - Wap);
        expect(F.validarF6({ densidadCuerpo, lecturaAire: W, lecturaFluido: Wap, densidadAlumno: rho })).toBe(true);
        expect(F.validarF6({ densidadCuerpo, lecturaAire: W, lecturaFluido: Wap, densidadAlumno: rho * 1.06 })).toBe(false);
      }
    }
  });
});

// ── F7 Dilatación ───────────────────────────────────────────────────────────
describe('F7 — dilatación lineal', () => {
  it('ΔL = α·L₀·ΔT', () => expect(F.dilatacion(23e-6, 500, 80)).toBeCloseTo(0.92, 9));
  it('un intento recién abierto no aprueba aunque se caliente', () => {
    expect(F.validarF7({ alphaMisterioso: 19e-6, ensayo: null, alphaAlumno: null })).toBe(false);
    expect(F.validarF7({ alphaMisterioso: 19e-6, ensayo: { material: 'misterioso', dT: 80, dL: 0.76 }, alphaAlumno: null })).toBe(false);
  });
  it('exige el metal misterioso y ΔT suficiente', () => {
    expect(F.validarF7({ alphaMisterioso: 19e-6, ensayo: { material: 'cobre', dT: 80, dL: 0.66 }, alphaAlumno: 19 })).toBe(false);
    expect(F.validarF7({ alphaMisterioso: 19e-6, ensayo: { material: 'misterioso', dT: 5, dL: 0.0475 }, alphaAlumno: 19 })).toBe(false);
  });
  it('toda semilla se resuelve con la lectura del comparador a ΔT mínimo', () => {
    const r = rng(7);
    for (let i = 0; i < 500; i++) {
      const a = F.generarAlpha7(r);
      const dT = F.DT_MIN_MEDICION;
      const dL = F.lecturaComparador(F.dilatacion(a, F.L0_MM, dT));
      const alumno = (dL / (F.L0_MM * dT)) * 1e6;
      expect(F.validarF7({ alphaMisterioso: a, ensayo: { material: 'misterioso', dT, dL }, alphaAlumno: alumno })).toBe(true);
    }
  });
});

// ── F8 Ley de Ohm con LED ───────────────────────────────────────────────────
describe('F8 — resistencia limitadora de un LED', () => {
  it('I = (V − Vf)/R y R para 20 mA', () => {
    expect(F.corrienteLed(12, 500 - F.R_INTERNA_FUENTE)).toBeCloseTo(0.02, 9);
    expect(F.resistenciaObjetivo(12)).toBeCloseTo(500, 9);
    expect(F.corrienteLed(1.5, 100)).toBe(0); // por debajo de Vf no conduce
  });
  it('sin resistencia el LED se destruye', () => {
    expect(F.corrienteLed(4.5, null)).toBeGreaterThan(F.LED.iDestruccion);
  });
  it('valida R calculada y montada; no aprueba con el LED quemado ni sin ensayo', () => {
    const e = { voltaje: 9, resistencia: 350, rCalculada: 350, corriente: 0.02, ledRoto: false };
    expect(F.validarF8({ ensayo: null })).toBe(false);
    expect(F.validarF8({ ensayo: e })).toBe(true);
    expect(F.validarF8({ ensayo: { ...e, rCalculada: 450 } })).toBe(false); // olvidó la caída del LED (9/0.02)
    expect(F.validarF8({ ensayo: { ...e, resistencia: 220 } })).toBe(false);
    expect(F.validarF8({ ensayo: { ...e, ledRoto: true } })).toBe(false);
  });
  it('todo voltaje del control tiene una resistencia montable dentro de ±5 %', () => {
    for (const V of rango(F.RANGO_V8)) {
      const rObj = F.resistenciaObjetivo(V);
      const existe = rango(F.RANGO_R8).some((R) => Math.abs(R - rObj) / rObj <= F.TOL_R8);
      expect(existe).toBe(true);
    }
  });
});

// ── F9 Coulomb ──────────────────────────────────────────────────────────────
describe('F9 — ley de Coulomb', () => {
  it('dos cargas de 1 μC a 10 cm se repelen con ≈ 0.899 N', () => {
    expect(F.fuerzaCoulomb(1, 1, 10)).toBeCloseTo(0.8988, 3);
    expect(F.tipoInteraccion(1, -1)).toBe('atraccion');
  });
  it('un intento recién abierto no aprueba', () => {
    expect(F.validarF9({ reto: { q1: 2, q2: -3, r: 12 }, respuesta: null, tipoRespuesta: null })).toBe(false);
  });
  it('valida magnitud y tipo del reto; rechaza el error de unidades cm→m', () => {
    const reto = { q1: 2, q2: -3, r: 12 };
    const Fr = F.fuerzaCoulomb(2, -3, 12);
    expect(F.validarF9({ reto, respuesta: Fr, tipoRespuesta: 'atraccion' })).toBe(true);
    expect(F.validarF9({ reto, respuesta: Fr, tipoRespuesta: 'repulsion' })).toBe(false);
    expect(F.validarF9({ reto, respuesta: Fr * 1e4, tipoRespuesta: 'atraccion' })).toBe(false);
  });
  it('toda semilla tiene cargas no nulas y distancia dentro del control', () => {
    const r = rng(9);
    for (let i = 0; i < 500; i++) {
      const t = F.generarReto9(r);
      expect(t.q1 * t.q2).not.toBe(0);
      expect(t.r).toBeGreaterThanOrEqual(F.RANGO_R9_CM.min);
      expect(t.r).toBeLessThanOrEqual(F.RANGO_R9_CM.max);
    }
  });
});

// ── F10 Motor de CD ─────────────────────────────────────────────────────────
describe('F10 — motor de corriente directa', () => {
  const base = { voltaje: 12, espiras: 50, imanIzq: 'N' as const, imanDer: 'S' as const, carga: 0.01 };
  it('más espiras ⇒ menos velocidad a igual voltaje; invertir imanes invierte el giro', () => {
    expect(F.estadoMotor({ ...base, espiras: 10 }).rpm).toBeGreaterThan(F.estadoMotor({ ...base, espiras: 100 }).rpm);
    expect(F.estadoMotor({ ...base, imanIzq: 'S', imanDer: 'N' }).rpm).toBeCloseTo(-F.estadoMotor(base).rpm, 9);
    expect(F.estadoMotor({ ...base, imanDer: 'N' }).sinCampo).toBe(true);
  });
  it('V = k·ω + I·Rₐ cierra el balance', () => {
    const e = F.estadoMotor(base);
    expect(F.voltajeNecesario(e.rpm, 50, 0.01)).toBeCloseTo(12, 9);
  });
  it('un intento recién abierto no aprueba', () => {
    expect(F.validarF10({ reto: { rpmObjetivo: 1200, sentido: 'horario', carga: 0.01 }, ensayo: null })).toBe(false);
  });
  it('toda semilla se resuelve con algún bobinado, polaridad y voltaje de la rejilla', () => {
    const r = rng(10);
    const voltajes = rango(F.RANGO_V10);
    for (let i = 0; i < 500; i++) {
      const reto = F.generarReto10(r);
      const [izq, der]: [F.Polo, F.Polo] = reto.sentido === 'horario' ? ['N', 'S'] : ['S', 'N'];
      let ok = false;
      for (const N of F.ESPIRAS10) {
        const vNec = F.voltajeNecesario(reto.rpmObjetivo, N, reto.carga);
        const vMontado = voltajes.reduce((a, b) => (Math.abs(b - vNec) < Math.abs(a - vNec) ? b : a));
        const ensayo = { voltaje: vMontado, espiras: N, imanIzq: izq, imanDer: der, carga: reto.carga, vPrediccion: vNec };
        if (F.validarF10({ reto, ensayo })) { ok = true; break; }
      }
      if (!ok) throw new Error(`reto de motor sin solución: ${JSON.stringify(reto)}`);
    }
  });
});
