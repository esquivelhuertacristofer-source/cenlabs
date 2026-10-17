/**
 * B7 · Sistema nervioso: la física que mueve la escena y el dock.
 *  · Hodgkin–Huxley (1952): reposo, pico, todo o nada, umbral, refractariedad, temperatura.
 *  · Cable: el PA propagado del axón de calamar (HH calcularon 18,8 m/s), v ∝ √d sin
 *    mielina, v ∝ D con mielina (internodo = 100·D), saltatoria (tiempo por internodo
 *    constante), desmielinización.
 *  · Arco: cronograma = suma de retardos = latencia del dominio, motoneurona que dispara
 *    al final del retardo central, PEPS subumbral, EMG que despega en L.
 *  · Banco en vivo: velocidad medida, umbral y pulso doble.
 */
import {
  HH, T_LAB, phiT, compuertasInf, integrarHH, maximo, disparo, umbralPulso,
  crearCable, medirVelocidad, lamelas, pasoCable, nodoEn, estimuloSoma, NODO, INTERNODO,
} from '@/components/simuladores/bio07/neuro';
import {
  formaPA, muestraPA, calibrarMotoneurona, registroMotoneurona, cruceSubida, cronograma, emg, ventanaEMG, sacudida, T_CONTRACCION,
} from '@/components/simuladores/bio07/arco';
import { BancoNeurona, umbralBanco, velocidadEsperada, V_REF, crearCableBanco, LARGO_BANCO } from '@/components/simuladores/bio07/banco';
import { latenciaB7, velocidadConduccionB7, RETARDO_SINAPSIS_B7, RETARDO_PLACA_B7 } from '@/domain/biologia';

const pulso = (amp: number, t0: number, dur: number) => (t: number) => (t >= t0 && t < t0 + dur ? amp : 0);

/** semiancho (ms) de un PA: tiempo por encima de la mitad de su amplitud */
function semiancho(V: Float64Array, dt: number) {
  const { v: pico } = maximo(V);
  const mitad = (pico + HH.Vreposo) / 2;
  let n = 0;
  for (let i = 0; i < V.length; i++) if (V[i] > mitad) n++;
  return n * dt;
}

describe('Hodgkin–Huxley (membrana aislada)', () => {
  test('reposo en −65 mV: las corrientes se anulan y V no se mueve', () => {
    const tr = integrarHH({ tFin: 20, T: 6.3, estimulo: () => 0 });
    expect(Math.abs(tr.V[tr.V.length - 1] - HH.Vreposo)).toBeLessThan(0.05);
    const g = compuertasInf(-65);
    expect(g.m).toBeCloseTo(0.0529, 3);
    expect(g.h).toBeCloseTo(0.5961, 3);
    expect(g.n).toBeCloseTo(0.3177, 3);
  });

  test('a 6,3 °C el PA llega a ≈ +40 mV: ~100 mV sobre el reposo, y dura ≈ 1,5 ms a media altura', () => {
    const tr = integrarHH({ tFin: 20, T: 6.3, estimulo: pulso(40, 1, 0.5) });
    const { v: pico } = maximo(tr.V);
    expect(pico).toBeGreaterThan(38);
    expect(pico).toBeLessThan(44);
    expect(pico - HH.Vreposo).toBeGreaterThan(100);
    expect(pico - HH.Vreposo).toBeLessThan(110);
    expect(semiancho(tr.V, tr.dt)).toBeGreaterThan(1.3);
    expect(semiancho(tr.V, tr.dt)).toBeLessThan(1.7);
    // posthiperpolarización hacia E_K
    let min = 0; for (let i = 0; i < tr.V.length; i++) min = Math.min(min, tr.V[i]);
    expect(min).toBeLessThan(-75);
    expect(min).toBeGreaterThan(HH.EK);
  });

  test('todo o nada: por debajo del umbral un potencial local; por encima, el mismo pico', () => {
    const th = umbralPulso(0.5, 6.3);
    expect(th).toBeGreaterThan(10);
    expect(th).toBeLessThan(17);
    const sub = integrarHH({ tFin: 15, T: 6.3, estimulo: pulso(0.9 * th, 1, 0.5) });
    const a = integrarHH({ tFin: 15, T: 6.3, estimulo: pulso(1.5 * th, 1, 0.5) });
    const b = integrarHH({ tFin: 15, T: 6.3, estimulo: pulso(3 * th, 1, 0.5) });
    expect(maximo(sub.V).v).toBeLessThan(-50);
    expect(disparo(a)).toBe(true);
    expect(Math.abs(maximo(a.V).v - maximo(b.V).v)).toBeLessThan(4);
    // umbral de voltaje: el mayor potencial local está en torno a −55/−60 mV
    const casi = integrarHH({ tFin: 15, T: 6.3, estimulo: pulso(0.995 * th, 1, 0.5) });
    expect(maximo(casi.V).v).toBeGreaterThan(-62);
    expect(maximo(casi.V).v).toBeLessThan(-45);
  });

  test('intensidad–duración: un pulso más corto pide más corriente pero casi la misma carga', () => {
    const t1 = umbralPulso(0.1, 6.3), t5 = umbralPulso(0.5, 6.3);
    expect(t1).toBeGreaterThan(t5);
    expect((t1 * 0.1) / (t5 * 0.5)).toBeGreaterThan(0.5);
    expect((t1 * 0.1) / (t5 * 0.5)).toBeLessThan(1.05);
  });

  test('a 18,5 °C (temperatura del lab) el PA es más breve: ≈ 0,4 ms a media altura, pico ≈ +32 mV', () => {
    expect(T_LAB).toBe(18.5);
    expect(phiT(18.5)).toBeCloseTo(Math.pow(3, 1.22), 6);
    const tr = integrarHH({ tFin: 10, estimulo: pulso(60, 1, 0.3) });
    expect(semiancho(tr.V, tr.dt)).toBeGreaterThan(0.36);
    expect(semiancho(tr.V, tr.dt)).toBeLessThan(0.48);
    expect(maximo(tr.V).v).toBeGreaterThan(28);
  });

  test('período refractario (18,5 °C): absoluto a 1 ms, relativo a 3 ms, recuperado a 10 ms', () => {
    const dur = 0.2;
    const th = umbralPulso(dur);
    const segundo = (dtp: number, k: number) => {
      const tr = integrarHH({ tFin: 1 + dtp + 5, estimulo: (t) => pulso(3 * th, 1, dur)(t) + pulso(k * th, 1 + dtp, dur)(t) });
      const i0 = Math.round((1 + dtp) / tr.dt);
      const m = maximo(tr.V, i0);
      return m.v > 0 && m.k > i0 + 5;
    };
    expect(segundo(1, 3)).toBe(false);   // ni con el triple del umbral
    expect(segundo(1, 8)).toBe(false);
    expect(segundo(3, 1.5)).toBe(false); // relativo: pide más que antes
    expect(segundo(3, 3)).toBe(true);
    expect(segundo(10, 1.1)).toBe(true); // ya recuperado
  });
});

describe('cable: conducción', () => {
  test('axón gigante de calamar (Ø 476 µm, Ri 35,4 Ω·cm, 18,5 °C): v ≈ 18,8 m/s como calcularon HH (1952)', () => {
    const r = medirVelocidad({ tipo: 'amielinica', D: 476, largo: 40, Ri: 35.4, T: 18.5, conSoma: false }, 0.002);
    expect(r.bloqueo).toBe(false);
    expect(r.v).toBeGreaterThan(18.2);
    expect(r.v).toBeLessThan(19.4);
  });

  test('sin mielina v ∝ √d: cuadruplicar el diámetro duplica la velocidad', () => {
    const v1 = medirVelocidad({ tipo: 'amielinica', D: 2, largo: 5, conSoma: false }, 0.002).v;
    const v4 = medirVelocidad({ tipo: 'amielinica', D: 8, largo: 5, conSoma: false }, 0.002).v;
    expect(v4 / v1).toBeGreaterThan(1.98);
    expect(v4 / v1).toBeLessThan(2.02);
    expect(v1 / Math.sqrt(2)).toBeCloseTo(V_REF.amielinica, 1);
  });

  test('con mielina v ∝ D (internodo = 100·D): el doble de grueso, el doble de rápido', () => {
    const v6 = medirVelocidad({ tipo: 'mielinica', D: 6, largo: 30, conSoma: false }).v;
    const v12 = medirVelocidad({ tipo: 'mielinica', D: 12, largo: 30, conSoma: false }).v;
    expect(v12 / v6).toBeGreaterThan(1.95);
    expect(v12 / v6).toBeLessThan(2.05);
    expect(v12 / 12).toBeGreaterThan(V_REF.mielinica * 0.97);
    expect(v12 / 12).toBeLessThan(V_REF.mielinica * 1.03);
  });

  test('saltatoria: el PA salta de nodo en nodo y tarda lo mismo por internodo sea cual sea el grosor', () => {
    const tiempoPorInternodo = (D: number) => {
      const c = crearCable({ tipo: 'mielinica', D, largo: 100 * D * 0.012 * 30, conSoma: false });
      const amp = estimuloSoma(c);
      while (c.t < 3) pasoCable(c, 0.001, (t) => (t >= 0.1 && t < 0.2 ? amp : 0));
      const nodos = c.nodos.filter((i) => c.tipo[i] === NODO);
      const t = nodos.map((i) => c.tCruce[i]).filter((x) => x > 0);
      const dts = t.slice(8, 20).map((x, k) => t[k + 9] - x);
      return dts.reduce((s, x) => s + x, 0) / dts.length;
    };
    const a = tiempoPorInternodo(4), b = tiempoPorInternodo(16);
    expect(Math.abs(a - b) / a).toBeLessThan(0.04);
    expect(a * 1000).toBeGreaterThan(30); // ≈ 41 µs por internodo a 18,5 °C
    expect(a * 1000).toBeLessThan(50);
    // bajo la vaina no hay canales: la corriente de Na⁺ sólo entra en los nodos
    const c = crearCable({ tipo: 'mielinica', D: 12, largo: 10, conSoma: false });
    for (let i = 0; i < c.n; i++) if (c.tipo[i] === INTERNODO) expect(c.k[i]).toBe(0);
  });

  test('la mielina acelera: la fibra de 12 µm conduce > 10 veces más rápido que la desnuda; desmielinizada, a la mitad', () => {
    const my = medirVelocidad({ tipo: 'mielinica', D: 12, largo: 30, conSoma: false }).v;
    const de = medirVelocidad({ tipo: 'desmielinizada', D: 12, largo: 30, conSoma: false }).v;
    const am = medirVelocidad({ tipo: 'amielinica', D: 12, largo: 5, conSoma: false }, 0.002).v;
    expect(my / am).toBeGreaterThan(10);
    expect(de).toBeLessThan(my * 0.6);
    expect(de).toBeGreaterThan(am * 3);
    expect(lamelas({ tipo: 'desmielinizada', D: 12 })).toBe(Math.round(lamelas({ tipo: 'mielinica', D: 12 }) / 3));
  });
});

describe('arco reflejo', () => {
  test('la forma del PA propagado en un nodo: subida de < 0,15 ms, pico > +30 mV, posthiperpolarización', () => {
    const f = formaPA();
    const { v: pico, k } = maximo(f.V);
    expect(pico).toBeGreaterThan(30);
    expect(muestraPA(f, -1).V).toBe(HH.Vreposo);
    // de −20 mV (τ = 0) al pico
    expect(f.tau0 + k * f.dtau).toBeLessThan(0.15);
    let min = 0; for (let i = k; i < f.V.length; i++) min = Math.min(min, f.V[i]);
    expect(min).toBeLessThan(-70);
    // en el soma (membrana del calamar) el pico de I_Na va antes que el de I_K, como en HH
    const tr = integrarHH({ tFin: 6, estimulo: pulso(60, 1, 0.3) });
    let kNa = 0, kK = 0;
    for (let i = 0; i < tr.V.length; i++) { if (tr.INa[i] < tr.INa[kNa]) kNa = i; if (tr.IK[i] > tr.IK[kK]) kK = i; }
    expect(kNa).toBeLessThan(kK);
  });

  test('cronograma = suma de retardos = latencia del dominio, para pacientes sanos y desmielinizados', () => {
    for (const [d, m] of [[0.86, 100], [1.0, 92], [1.1, 40], [0.9, 35]] as const) {
      const L = latenciaB7(d, m);
      const c = cronograma(L, RETARDO_SINAPSIS_B7, RETARDO_PLACA_B7);
      expect(c.respuesta).toBeCloseTo(L, 10);
      expect(c.llegadaMedula + RETARDO_SINAPSIS_B7 + c.conduccion / 2 + RETARDO_PLACA_B7).toBeCloseTo(L, 10);
      // la conducción es d/v con el redondeo de 0,1 ms de la latencia
      expect(Math.abs(c.conduccion - (d / velocidadConduccionB7(m)) * 1000)).toBeLessThanOrEqual(0.05 + 1e-9);
    }
  });

  test('la motoneurona dispara justo al final del retardo central; por debajo del umbral, un PEPS lejos del umbral', () => {
    const { Ath, Asupra } = calibrarMotoneurona(RETARDO_SINAPSIS_B7);
    expect(Asupra).toBeGreaterThan(Ath);
    const sup = registroMotoneurona(true, 60, RETARDO_SINAPSIS_B7);
    expect(Math.abs(cruceSubida(sup) - RETARDO_SINAPSIS_B7)).toBeLessThan(0.01);
    expect(maximo(sup.V).v).toBeGreaterThan(25);
    for (const f of [5, 20, 34]) {
      const sub = registroMotoneurona(false, f, RETARDO_SINAPSIS_B7);
      expect(maximo(sub.V).v).toBeLessThan(-57);
      expect(maximo(sub.V).v).toBeGreaterThan(HH.Vreposo + 0.5); // hay PEPS
    }
    // el PEPS crece con la fuerza
    expect(maximo(registroMotoneurona(false, 30, 0.7).V).v).toBeGreaterThan(maximo(registroMotoneurona(false, 10, 0.7).V).v);
  });

  test('EMG: plano hasta la latencia, respuesta de > 1 mV después; sin reflejo, sólo el artefacto', () => {
    for (const L of [16.9, 25.3, 61.2]) {
      let antes = 0, despues = 0;
      for (let t = 5; t < L - 0.1; t += 0.05) antes = Math.max(antes, Math.abs(emg(t, L)));
      for (let t = L; t < L + 10; t += 0.05) despues = Math.max(despues, Math.abs(emg(t, L)));
      expect(antes).toBeLessThan(0.06);
      expect(despues).toBeGreaterThan(1);
      expect(ventanaEMG(L)).toBeGreaterThanOrEqual(L + 18);
    }
    let sinRespuesta = 0;
    for (let t = 5; t < 80; t += 0.05) sinRespuesta = Math.max(sinRespuesta, Math.abs(emg(t, null)));
    expect(sinRespuesta).toBeLessThan(0.06);
    expect(sacudida(16.9 + 2 + T_CONTRACCION, 16.9)).toBeCloseTo(1, 6);
    expect(sacudida(10, 16.9)).toBe(0);
  });
});

describe('banco de la neurona (en vivo)', () => {
  test('la velocidad que mide el banco coincide con la ley de escala (±4 %)', () => {
    for (const [tipo, D] of [['mielinica', 12], ['desmielinizada', 8], ['amielinica', 8]] as const) {
      const u = umbralBanco(tipo, D);
      const b = new BancoNeurona({ tipo, D, estimulo: 1.5 * u, doble: 0 });
      b.estimular();
      while (!b.barridoTerminado) b.avanzar(0.02);
      expect(b.vMedida).not.toBeNull();
      expect(Math.abs((b.vMedida as number) / velocidadEsperada(tipo, D) - 1)).toBeLessThan(0.04);
      expect(b.llegadaTerminal).toBeGreaterThan(0);
    }
  });

  test('umbral del soma: al 95 % no dispara, al 105 % sí (todo o nada)', () => {
    const u = umbralBanco('mielinica', 12);
    const prueba = (k: number) => {
      const b = new BancoNeurona({ tipo: 'mielinica', D: 12, estimulo: k * u, doble: 0 });
      b.estimular();
      while (!b.barridoTerminado) b.avanzar(0.02);
      return b.disparos;
    };
    expect(prueba(0.95)).toBe(0);
    expect(prueba(1.05)).toBe(1);
  });

  test('pulso doble: a 1 ms el segundo cae en el refractario; a 6 ms dispara', () => {
    const u = umbralBanco('mielinica', 12);
    const disparos = (doble: number) => {
      const b = new BancoNeurona({ tipo: 'mielinica', D: 12, estimulo: 1.5 * u, doble });
      b.estimular();
      while (!b.barridoTerminado) b.avanzar(0.02);
      return b.disparos;
    };
    expect(disparos(1)).toBe(1);
    expect(disparos(6)).toBe(2);
  });

  test('la malla del banco no pasa de ~430 compartimentos y cubre los 10 mm', () => {
    const c = crearCableBanco({ tipo: 'amielinica', D: 2, largo: LARGO_BANCO });
    expect(c.n).toBeLessThan(440);
    expect(c.x[c.n - 1]).toBeGreaterThan(LARGO_BANCO);
    const m = crearCableBanco({ tipo: 'mielinica', D: 12, largo: LARGO_BANCO });
    expect(m.x[nodoEn(m, LARGO_BANCO)]).toBeGreaterThan(9);
  });
});
