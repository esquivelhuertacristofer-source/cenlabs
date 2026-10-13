/**
 * @jest-environment node
 *
 * biologia-8 (Electrocardiograma): el ECG sale del corazón 3D.
 *
 * Se construye el modelo una vez a resolución media (rejilla de 2,6 mm): anatomía
 * por campo de distancia, activación eikonal desde el SA y el His-Purkinje,
 * repolarización y dipolo de capa doble. Sobre él se comprueba:
 *  · Einthoven: cada derivación es una proyección V = D·û; I + III = II y
 *    aVR + aVL + aVF = 0 (exactos);
 *  · el reloj único: FC = 60 000 / RR medido en los picos R de la tira (II);
 *    un cambio de FC entra al latido siguiente;
 *  · PR y QRS medidos en el vector salen los del dominio para bradi, normo y taqui;
 *  · ST isoeléctrico (la pared cerrada: ∮n dA = 0), ejes de P, QRS y T normales,
 *    aVR invertida;
 *  · la mecánica: las AV y las sigmoideas nunca abiertas a la vez.
 */
import { muestrear, mallarValores, areaYCierre, type V3 } from '@/components/simuladores/bio08/anatomia';
import {
  construirModeloElectrico, derivaciones, mapear, dipolo, anguloFrontal, VECTOR_DERIVACION, DERIVACIONES, ELECTRODO,
  TEJIDO, type ModeloElectrico,
} from '@/components/simuladores/bio08/electro';
import { RelojCardiaco, valvulas, tiemposDominio, type ModeloReloj } from '@/components/simuladores/bio08/reloj';
import { tiemposCicloB8 } from '@/domain/biologia';

jest.setTimeout(240000);

let r: ReturnType<typeof muestrear>;
let el: ModeloElectrico;
let mod: ModeloReloj;

beforeAll(() => {
  r = muestrear(0.026);
  el = construirModeloElectrico(r, 0.7);
  const a = el.act;
  mod = {
    fuente: el.fuente, K: el.K,
    act: { aMax: a.aMax, vMin: a.vMin, vMax: a.vMax, rMin: a.rMin, rMax: a.rMax, tLlegadaAV: a.tLlegadaAV },
    tauMedioV: a.vMin + 0.45 * (a.vMax - a.vMin), rhoMedioV: (a.rMin + a.rMax) / 2,
  };
});

/** Un latido completo del vector (paso 1 ms) para un RR dado. */
function latido(rr: number): { t: number[]; D: V3[]; m: ReturnType<typeof mapear> } {
  const m = mapear(rr, el.act);
  const t: number[] = [], D: V3[] = [];
  for (let k = 0; k < rr; k++) { t.push(k); D.push(dipolo(el.fuente, m, k, el.K)); }
  return { t, D, m };
}
const norma = (v: V3) => Math.hypot(v[0], v[1], v[2]);
/** Eje frontal (grados) del vector área de una ventana. */
function eje(D: V3[], a: number, b: number): number {
  const s: V3 = [0, 0, 0];
  for (let k = Math.max(0, Math.floor(a)); k < Math.min(D.length, Math.ceil(b)); k++) { s[0] += D[k][0]; s[1] += D[k][1]; }
  return anguloFrontal(s);
}

describe('Einthoven: las derivaciones son proyecciones del mismo vector', () => {
  test('I + III = II y aVR + aVL + aVF = 0 para cualquier vector', () => {
    let s = 3;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 - 0.5; };
    for (let i = 0; i < 200; i++) {
      const D: V3 = [rnd() * 4, rnd() * 4, rnd() * 4];
      const v = derivaciones(D);
      expect(v.I + v.III).toBeCloseTo(v.II, 12);
      expect(v.aVR + v.aVL + v.aVF).toBeCloseTo(0, 12);
      for (const d of DERIVACIONES) {
        const u = VECTOR_DERIVACION[d];
        expect(v[d]).toBeCloseTo(D[0] * u[0] + D[1] * u[1] + D[2] * u[2], 12);
      }
    }
  });
  test('ejes hexaxiales: I a 0°, II a +60°, III a +120°, aVF a +90°, aVL a −30°, aVR a −150°; |û_I| = 1', () => {
    const ang = Object.fromEntries(DERIVACIONES.map((d) => [d, anguloFrontal(VECTOR_DERIVACION[d])]));
    expect(ang.I).toBeCloseTo(0, 9); expect(ang.II).toBeCloseTo(60, 9); expect(ang.III).toBeCloseTo(120, 9);
    expect(ang.aVF).toBeCloseTo(90, 9); expect(ang.aVL).toBeCloseTo(-30, 9); expect(ang.aVR).toBeCloseTo(-150, 9);
    expect(norma(VECTOR_DERIVACION.I)).toBeCloseTo(1, 12);
    expect(norma(ELECTRODO.RA)).toBeCloseTo(1, 12);
  });
  test('sobre el latido del modelo, la tira cumple I + III = II en cada muestra', () => {
    const { D } = latido(800);
    let peor = 0;
    for (const d of D) { const v = derivaciones(d); peor = Math.max(peor, Math.abs(v.I + v.III - v.II)); }
    expect(peor).toBeLessThan(1e-12);
  });
});

describe('el corazón 3D es coherente', () => {
  test('la activación alcanza todo el ventrículo y casi toda la aurícula', () => {
    let nA = 0, nV = 0;
    for (let o = 0; o < el.act.tejido.length; o++) { if (el.act.tejido[o] === TEJIDO.auricula) nA++; else if (el.act.tejido[o] === TEJIDO.ventriculo) nV++; }
    expect(nV).toBeGreaterThan(10000);
    expect(el.act.sinAlcanzar[1]).toBe(0);
    expect(el.act.sinAlcanzar[0] / nA).toBeLessThan(0.02);
  });
  test('activación ventricular bruta de 70–130 ms y aurícula de 60–120 ms (velocidades 0,6 y 0,9 m/s)', () => {
    expect(el.act.vMax - el.act.vMin).toBeGreaterThan(70);
    expect(el.act.vMax - el.act.vMin).toBeLessThan(130);
    expect(el.act.aMax).toBeGreaterThan(60);
    expect(el.act.aMax).toBeLessThan(120);
  });
  test('las paredes son cerradas: ∮n dA ≈ 0 (es lo que hace isoeléctrico el ST)', () => {
    for (const canal of [r.vMio, r.aMio]) {
      const { area, cierre } = areaYCierre(mallarValores(canal, r, 0));
      expect(area).toBeGreaterThan(1);
      expect(norma(cierre) / area).toBeLessThan(1e-4);
    }
  });
});

describe('PR, QRS y morfología por ritmo', () => {
  test.each([[45], [75], [130]])('a %i lpm el vector da el PR y el QRS del dominio', (bpm) => {
    const rr = 60000 / bpm;
    const { D } = latido(rr);
    const c = tiemposCicloB8(rr);
    const mag = D.map(norma);
    const maxQ = Math.max(...mag.slice(Math.floor(c.pr), Math.ceil(c.qrsFin)));
    const maxP = Math.max(...mag.slice(0, Math.ceil(c.p)));
    const umbralP = 0.04 * maxP, umbralQ = 0.04 * maxQ;
    const inicioP = mag.findIndex((x) => x > umbralP);
    let inicioQ = -1;
    for (let k = Math.floor(c.p + 5); k < c.qrsFin; k++) if (mag[k] > umbralQ && k > c.pr - 40) { inicioQ = k; break; }
    // punto J: tras el pico R, el primer instante desde el que el vector deja de cambiar
    // deprisa (< 0,5 % del máximo por ms durante 10 ms) cerca de la línea base (< 5 %): lo que se lee a ojo
    const medioST = Math.floor((c.qrsFin + c.tIni) / 2);
    let kR = Math.floor(c.pr);
    for (let k = Math.floor(c.pr); k < c.qrsFin; k++) if (mag[k] > mag[kR]) kR = k;
    let finQ = -1;
    for (let k = kR; k < medioST && finQ < 0; k++) {
      let quieto = mag[k] < 0.05 * maxQ;
      for (let j = k; quieto && j < k + 10; j++) {
        const d = Math.hypot(D[j + 1][0] - D[j][0], D[j + 1][1] - D[j][1], D[j + 1][2] - D[j][2]);
        if (d > 0.005 * maxQ) quieto = false;
      }
      if (quieto) finQ = k;
    }
    expect(inicioP).toBeLessThanOrEqual(6);
    expect(Math.abs(inicioQ - inicioP - c.pr)).toBeLessThanOrEqual(12);       // PR
    expect(Math.abs(finQ - inicioQ - (c.qrsFin - c.pr))).toBeLessThanOrEqual(14); // QRS
    // ST isoeléctrico en II
    expect(Math.abs(derivaciones(D[medioST]).II)).toBeLessThan(0.1);
    // R en II de 0,5 a 2 mV; todo invertido en aVR
    const II = D.map((d) => derivaciones(d).II), aVR = D.map((d) => derivaciones(d).aVR);
    const R = Math.max(...II.slice(Math.floor(c.pr), Math.ceil(c.qrsFin)));
    expect(R).toBeGreaterThan(0.5); expect(R).toBeLessThan(2.0);
    const area = (s: number[], a: number, b: number) => s.slice(Math.floor(a), Math.ceil(b)).reduce((x, y) => x + y, 0);
    expect(area(II, 0, c.p)).toBeGreaterThan(0);              // P positiva en II
    expect(area(II, c.tIni, c.tFin)).toBeGreaterThan(0);      // T positiva en II
    expect(area(aVR, 0, c.p)).toBeLessThan(0);
    expect(area(aVR, c.pr, c.qrsFin)).toBeLessThan(0);
    expect(area(aVR, c.tIni, c.tFin)).toBeLessThan(0);
  });
  test('ejes normales: P 0…75°, QRS −30…+90°, T concordante con el QRS', () => {
    const rr = 800, { D } = latido(rr), c = tiemposCicloB8(rr);
    const p = eje(D, 0, c.p), qrs = eje(D, c.pr, c.qrsFin), t = eje(D, c.tIni, c.tFin);
    expect(p).toBeGreaterThan(0); expect(p).toBeLessThan(75);
    expect(qrs).toBeGreaterThan(-30); expect(qrs).toBeLessThan(90);
    expect(Math.abs(t - qrs)).toBeLessThan(75);
  });
});

describe('el reloj único: FC = 60 / RR', () => {
  function picosR(reloj: RelojCardiaco): number[] {
    const n = reloj.escritas, D: V3 = [0, 0, 0], II: number[] = [];
    for (let k = n - 1; k >= 0; k--) { reloj.muestra(k, D); II.push(derivaciones(D).II); }
    const max = Math.max(...II), picos: number[] = [];
    for (let i = 3; i < II.length - 3; i++) {
      if (II[i] > 0.6 * max && II[i] >= II[i - 1] && II[i] > II[i + 1] && II[i] >= Math.max(...II.slice(i - 3, i + 4))) picos.push(i * 2);
    }
    return picos;
  }
  test.each([[38], [45], [75], [100], [140]])('a %i lpm, 60 000 / RR medido en la tira = FC', (bpm) => {
    const reloj = new RelojCardiaco(bpm);
    reloj.fijarModelo(mod);
    reloj.velocidad = 1;
    for (let i = 0; i < 9000 / 16.6667; i++) reloj.avanzar(16.6667);
    const p = picosR(reloj);
    const rr = p.slice(1).map((x, i) => x - p[i]);
    expect(rr.length).toBeGreaterThanOrEqual(4);
    const medio = rr.reduce((a, b) => a + b) / rr.length;
    expect(60000 / medio).toBeCloseTo(bpm, 0);
    for (const x of rr) expect(Math.abs(x - 60000 / bpm)).toBeLessThanOrEqual(2); // un paso de 2 ms
  });
  test('la cámara lenta no cambia lo que se mide (25 mm por segundo DEL PACIENTE)', () => {
    const a = new RelojCardiaco(60), b = new RelojCardiaco(60);
    a.fijarModelo(mod); b.fijarModelo(mod);
    a.velocidad = 1; b.velocidad = 1 / 10;
    for (let i = 0; i < 300; i++) a.avanzar(10);
    for (let i = 0; i < 3000; i++) b.avanzar(10);
    expect(b.tPaciente).toBeCloseTo(a.tPaciente, 6);
    expect(Array.from(b.muestras.slice(0, a.escritas * 3))).toEqual(Array.from(a.muestras.slice(0, a.escritas * 3)));
  });
  test('un fármaco (nueva FC) entra al empezar el latido siguiente, como en el nodo SA', () => {
    const reloj = new RelojCardiaco(50);
    reloj.fijarModelo(mod); reloj.velocidad = 1;
    reloj.paso(300);
    const latido = reloj.latido;
    reloj.fijarFC(90);
    expect(reloj.rr).toBeCloseTo(1200, 6);
    reloj.paso(1200 - 300 - 4);
    expect(reloj.latido).toBe(latido);
    reloj.paso(10);
    expect(reloj.latido).toBe(latido + 1);
    expect(reloj.rr).toBeCloseTo(60000 / 90, 6);
  });
});

describe('mecánica', () => {
  test('las AV y las sigmoideas nunca están abiertas a la vez; la sístole sigue al QRS', () => {
    for (const bpm of [45, 75, 130]) {
      const rr = 60000 / bpm, m = mapear(rr, el.act);
      let ambos = 0, cVmaxT = 0, cVmax = 0;
      for (let t = 0; t < rr; t += 2) {
        const v = valvulas(t, m, mod);
        ambos = Math.max(ambos, Math.min(v.av, v.sigmoidea));
        if (v.cV > cVmax) { cVmax = v.cV; cVmaxT = t; }
      }
      expect(ambos).toBeLessThan(0.05);
      expect(cVmax).toBeGreaterThan(0.9);
      const c = tiemposCicloB8(rr);
      expect(cVmaxT).toBeGreaterThan(c.qrsFin);  // el pico de la contracción llega después de la despolarización
    }
  });
  test('tiempos del dominio: el primer punto ventricular se activa al final del PR y el último al final del QRS', () => {
    const m = mapear(800, el.act), c = tiemposCicloB8(800);
    expect(tiemposDominio(el.act.vMin, el.act.rMin, 2, m, mod.act)[0]).toBeCloseTo(c.pr, 6);
    expect(tiemposDominio(el.act.vMax, el.act.rMax, 2, m, mod.act)[0]).toBeCloseTo(c.qrsFin, 6);
    expect(tiemposDominio(el.act.aMax, el.act.aMax, 1, m, mod.act)[0]).toBeCloseTo(c.p, 6);
  });
});
