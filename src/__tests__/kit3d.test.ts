/**
 * Kit 3D compartido (src/components/simuladores/_kit): funciones puras.
 *
 * Lo que se comprueba es lo que un profesor vería mal en pantalla:
 *  - que el aforo del matraz encierre DE VERDAD su volumen nominal (integrando el
 *    perfil por otro camino, no con la misma función que lo colocó);
 *  - que altura↔volumen sean inversas en todos los recipientes;
 *  - que la bureta marque 0 arriba y 50 abajo, con 50 mL entre ambas marcas;
 *  - que los perfiles del torno estén en el sentido correcto (si no, la pieza sale
 *    del revés) y no repitan puntos (normales nulas = pantalla negra).
 */
import {
  defVaso, defErlenmeyer, defAforado, defProbeta, defBureta, defBalon, defTubo, defVidrioReloj, defEmbudo,
  defJeringa, defCristalizador, obtenerRecipiente, alturaParaVolumen, volumenHastaAltura, radioEnAltura,
  areaConSigno, buretaAlturaDeLectura, buretaLecturaDeAltura, buretaVolumenDeLectura, jeringaAlturaEmbolo,
  construirSolido, redondear, mm, type DefRecipiente, type P2,
} from '@/components/simuladores/_kit/perfiles';
import {
  barridoAngulo, muestrearFuncion, pasoBonito, numeroEje, formatoCronometro, dimensionesPesa, alturaPila,
  analizarFormato, puntosCatenaria, dinamometroAlargamiento,
} from '@/components/simuladores/_kit/calculos';

/** Volumen por discos finos sobre r(y) — integración INDEPENDIENTE de la del módulo. */
function volumenPorDiscos(interior: P2[], h: number, n = 40000): number {
  const y0 = interior[0][1];
  if (h <= y0) return 0;
  const dy = (h - y0) / n;
  let v = 0;
  for (let i = 0; i < n; i++) {
    const y = y0 + (i + 0.5) * dy;
    const r = radioEnAltura(interior, y);
    v += Math.PI * r * r * dy;
  }
  return v * 1000;
}

const TODOS: DefRecipiente[] = [
  ...[50, 100, 250, 600].map((c) => defVaso(c)),
  ...[50, 100, 250, 500].map((c) => defErlenmeyer(c)),
  ...[50, 100, 250, 500, 1000].map((c) => defAforado(c)),
  ...[10, 25, 50, 100, 250].map((c) => defProbeta(c)),
  defBureta(),
  ...[100, 250, 500].map((c) => defBalon(c)),
  defTubo('16x150'), defTubo('25x150'), defVidrioReloj(100), defEmbudo(75), defJeringa(10), defCristalizador(150),
];

describe('kit 3D · matraz aforado', () => {
  it.each([50, 100, 250, 500, 1000])('el aforo de %i mL encierra el volumen nominal (±1 %%, integrado aparte)', (cap) => {
    const d = defAforado(cap);
    const v = volumenPorDiscos(d.interior, d.extra.yAforo);
    expect(Math.abs(v - cap) / cap).toBeLessThan(0.01);
  });
  it('el aforo cae en el CUELLO (por encima del bulbo, por debajo de la boca)', () => {
    for (const cap of [50, 100, 250, 500, 1000]) {
      const d = defAforado(cap);
      const rCuello = d.extra.radioCuello;
      expect(d.radioInteriorEn(d.extra.yAforo)).toBeCloseTo(rCuello, 6);
      expect(d.extra.yAforo).toBeLessThan(d.altura - mm(15));
    }
  });
  it('proporciones reales: el de 250 mL mide 22 cm y su bulbo ~8 cm', () => {
    const d = defAforado(250);
    expect(d.altura).toBeCloseTo(2.2, 2);
    expect(2 * (d.extra.radioBulbo + d.grosor)).toBeGreaterThan(0.7);
    expect(2 * (d.extra.radioBulbo + d.grosor)).toBeLessThan(0.9);
  });
});

describe('kit 3D · altura ↔ volumen', () => {
  it.each(TODOS.map((d) => [d.id, d] as const))('%s: alturaParaVolumen y volumenHastaAltura son inversas', (_id, d) => {
    const total = d.capacidadTotalML;
    for (const f of [0.03, 0.1, 0.27, 0.5, 0.73, 0.9, 0.98]) {
      const v = total * f;
      const h = d.alturaParaVolumen(v);
      expect(Math.abs(d.volumenHastaAltura(h) - v)).toBeLessThan(Math.max(1e-6, v * 1e-6));
    }
    for (const f of [0.1, 0.5, 0.9]) {
      const h = d.y0 + (d.yMax - d.y0) * f;
      expect(d.alturaParaVolumen(d.volumenHastaAltura(h))).toBeCloseTo(h, 6);
    }
  });
  it.each(TODOS.map((d) => [d.id, d] as const))('%s: el volumen integrado coincide con discos finos', (_id, d) => {
    const h = d.y0 + (d.yMax - d.y0) * 0.6;
    const a = d.volumenHastaAltura(h), b = volumenPorDiscos(d.interior, h, 20000);
    expect(Math.abs(a - b) / Math.max(a, 1e-9)).toBeLessThan(0.003);
  });
  it('los vasos caben su nominal por debajo del borde y con medidas Griffin reales', () => {
    const dims: Record<number, [number, number]> = { 50: [0.42, 0.6], 100: [0.5, 0.7], 250: [0.7, 0.95], 600: [0.9, 1.25] };
    for (const c of [50, 100, 250, 600]) {
      const d = defVaso(c);
      expect(d.capacidadTotalML).toBeGreaterThan(c * 1.1);
      expect(d.alturaParaVolumen(c)).toBeLessThan(d.yMax);
      // diámetro EXTERIOR del cuerpo a media altura (el borde rebordeado sobresale ~1 mm)
      expect((d.radioInteriorEn(d.altura * 0.5) + d.grosor) * 2).toBeCloseTo(dims[c][0], 3);
      expect(d.altura).toBeCloseTo(dims[c][1], 2);
    }
  });
  it('el volumen crece con la altura (monótono) y es 0 en el fondo', () => {
    for (const d of TODOS) {
      expect(d.volumenHastaAltura(d.y0)).toBeCloseTo(0, 9);
      let prev = -1;
      for (let i = 0; i <= 50; i++) {
        const v = d.volumenHastaAltura(d.y0 + ((d.yMax - d.y0) * i) / 50);
        expect(v).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    }
  });
  it('obtenerRecipiente devuelve la misma definición memoizada', () => {
    expect(obtenerRecipiente('vaso-250')).toBe(defVaso(250));
    expect(obtenerRecipiente('bureta-50')).toBe(defBureta());
    expect(obtenerRecipiente('tubo-16x150')).toBe(defTubo('16x150'));
    expect(() => obtenerRecipiente('olla-3')).toThrow();
  });
});

describe('kit 3D · bureta', () => {
  const d = defBureta();
  it('marca 0 ARRIBA y 50 ABAJO', () => {
    expect(d.extra.y0Marca).toBeGreaterThan(d.extra.y50Marca);
    expect(buretaAlturaDeLectura(0)).toBeCloseTo(d.extra.y0Marca, 6);
    expect(buretaAlturaDeLectura(50)).toBeCloseTo(d.extra.y50Marca, 6);
    expect(buretaAlturaDeLectura(10)).toBeGreaterThan(buretaAlturaDeLectura(20));
  });
  it('entre la marca 0 y la 50 hay exactamente 50 mL', () => {
    const v = d.volumenHastaAltura(d.extra.y0Marca) - d.volumenHastaAltura(d.extra.y50Marca);
    expect(v).toBeCloseTo(50, 6);
  });
  it('la escala es lineal (tubo cilíndrico): cada mL mide lo mismo', () => {
    const paso = buretaAlturaDeLectura(0) - buretaAlturaDeLectura(1);
    for (const k of [5, 17, 33, 49]) expect(buretaAlturaDeLectura(k) - buretaAlturaDeLectura(k + 1)).toBeCloseTo(paso, 4);
    // ~1,13 cm por mL con 10,6 mm de diámetro interior
    expect(paso).toBeGreaterThan(0.105); expect(paso).toBeLessThan(0.12);
  });
  it('lectura ↔ altura ↔ volumen son coherentes', () => {
    for (const L of [0, 0.05, 12.4, 25, 49.95]) {
      expect(buretaLecturaDeAltura(buretaAlturaDeLectura(L))).toBeCloseTo(L, 6);
      expect(d.alturaParaVolumen(buretaVolumenDeLectura(L))).toBeCloseTo(buretaAlturaDeLectura(L), 6);
    }
  });
  it('mide unos 72 cm, como una bureta de 50 mL real', () => {
    expect(d.altura).toBeGreaterThan(6.8); expect(d.altura).toBeLessThan(7.6);
  });
  it('la graduación tiene 501 marcas (0,1 mL) y números enteros 0…50', () => {
    const g = d.graduacion!.marcas;
    expect(g).toHaveLength(501);
    expect(g.filter((k) => k.texto).map((k) => k.texto)).toEqual(Array.from({ length: 51 }, (_, i) => String(i)));
  });
});

describe('kit 3D · probeta y jeringa', () => {
  it('la probeta de 100 mL gradúa 1 mL y su marca 100 está bajo el borde', () => {
    const d = defProbeta(100);
    const g = d.graduacion!.marcas;
    expect(g[g.length - 1].mL).toBe(100);
    expect(d.alturaParaVolumen(100)).toBeLessThan(d.yMax - mm(20));
  });
  it('el émbolo de la jeringa avanza linealmente con el volumen', () => {
    const d = defJeringa(10);
    const y0 = jeringaAlturaEmbolo(10, 0), y5 = jeringaAlturaEmbolo(10, 5), y10 = jeringaAlturaEmbolo(10, 10);
    expect(y0).toBeCloseTo(d.extra.yCero, 9);
    expect(y10 - y5).toBeCloseTo(y5 - y0, 9);
    // entre el cero y la marca de 10 caben 10 mL (±0,5 %: el chaflán del fondo roza el cero)
    expect(Math.abs(d.volumenHastaAltura(y10) - d.volumenHastaAltura(y0) - 10)).toBeLessThan(0.05);
  });
});

describe('kit 3D · perfiles del torno', () => {
  it.each(TODOS.map((d) => [d.id, d] as const))('%s: sólido en sentido correcto, sin puntos repetidos ni radios negativos', (_id, d) => {
    // antihorario en (r, y) = normales del torno hacia FUERA del vidrio
    expect(areaConSigno(d.solido)).toBeGreaterThan(0);
    for (let i = 1; i < d.solido.length; i++) {
      const [a, b] = [d.solido[i - 1], d.solido[i]];
      expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(1e-7);
    }
    for (const [r, y] of d.solido) { expect(r).toBeGreaterThanOrEqual(0); expect(Number.isFinite(y)).toBe(true); }
    // la cavidad no tiene voladizos: y no decrece
    for (let i = 1; i < d.interior.length; i++) expect(d.interior[i][1]).toBeGreaterThanOrEqual(d.interior[i - 1][1] - 1e-12);
  });
  it('el grosor de pared es el declarado (exterior − interior en un tramo recto)', () => {
    const d = defVaso(250);
    const h = d.altura * 0.5;
    let rExt = 0;
    for (let i = 0; i < d.solido.length - 1; i++) {
      const [r1, y1] = d.solido[i], [r2, y2] = d.solido[i + 1];
      if ((y1 - h) * (y2 - h) <= 0 && Math.abs(y2 - y1) > 1e-9) rExt = Math.max(rExt, r1 + ((r2 - r1) * (h - y1)) / (y2 - y1));
    }
    expect(rExt - d.radioInteriorEn(h)).toBeCloseTo(d.grosor, 6);
  });
  it('un perfil escrito al revés da área negativa (así se detecta la pieza vuelta del revés)', () => {
    const interior = redondear([[0, 0.01], [0.3, 0.01], [0.3, 0.9]], [0, 0.04, 0]);
    const s = construirSolido(interior, 0.015);
    expect(areaConSigno(s)).toBeGreaterThan(0);
    expect(areaConSigno(s.slice().reverse())).toBeLessThan(0);
  });
  it('alturaParaVolumen satura en el fondo y en el borde', () => {
    const d = defVaso(100);
    expect(alturaParaVolumen(d.interior, -5)).toBe(d.y0);
    expect(alturaParaVolumen(d.interior, 1e6)).toBe(d.yMax);
    expect(volumenHastaAltura(d.interior, d.y0 - 1)).toBe(0);
  });
});

describe('kit 3D · matemáticas', () => {
  it('barridoAngulo dibuja el arco del lado correcto', () => {
    expect(barridoAngulo(0, 90)).toEqual({ inicio: 0, barrido: 90 });
    expect(barridoAngulo(0, 270)).toEqual({ inicio: 0, barrido: -90 });          // el menor va por abajo
    expect(barridoAngulo(0, 270, 'antihorario')).toEqual({ inicio: 0, barrido: 270 });
    expect(barridoAngulo(350, 10)).toEqual({ inicio: 350, barrido: 20 });         // cruza el 0 sin dar la vuelta
    expect(barridoAngulo(180, 90, 'horario')).toEqual({ inicio: 180, barrido: -90 });
    expect(barridoAngulo(90, 180, 'horario').barrido).toBe(-270);
    expect(barridoAngulo(30, 30).barrido).toBe(0);
  });
  it('muestrearFuncion parte la curva en las asíntotas y no la une a través de ellas', () => {
    const tramos = muestrearFuncion((x) => 1 / (x - 4), -10, 10, { recorteY: [-6, 6] });
    expect(tramos.length).toBe(2);
    expect(Math.max(...tramos[0].map((p) => p[0]))).toBeLessThan(4);
    expect(Math.min(...tramos[1].map((p) => p[0]))).toBeGreaterThan(4);
    for (const t of tramos) for (const [, y] of t) expect(Math.abs(y)).toBeLessThanOrEqual(6);
  });
  it('muestrearFuncion afina donde hay curvatura (más puntos en sin x que en una recta)', () => {
    const recta = muestrearFuncion((x) => 2 * x + 1, -10, 10, { escala: 0.5, tol: 0.005 })[0].length;
    const seno = muestrearFuncion((x) => 3 * Math.sin(3 * x), -10, 10, { escala: 0.5, tol: 0.005 })[0].length;
    expect(seno).toBeGreaterThan(recta * 3);
    // la polilínea del seno no se aparta de la curva real más que la tolerancia
    const t = muestrearFuncion((x) => 3 * Math.sin(3 * x), -10, 10, { escala: 0.5, tol: 0.005 })[0];
    for (let i = 0; i < t.length - 1; i++) {
      const xm = (t[i][0] + t[i + 1][0]) / 2;
      expect(Math.abs(3 * Math.sin(3 * xm) - (t[i][1] + t[i + 1][1]) / 2) * 0.5).toBeLessThan(0.02);
    }
  });
  it('pasoBonito y numeroEje', () => {
    expect(pasoBonito(20, 10)).toBe(2);
    expect(pasoBonito(12, 10)).toBe(2);
    expect(pasoBonito(10, 10)).toBe(1);
    expect(pasoBonito(0.7, 10)).toBeCloseTo(0.1, 12);
    expect(numeroEje(-3)).toBe('−3');
    expect(numeroEje(0.30000000000000004)).toBe('0.3');
    expect(numeroEje(-1e-12)).toBe('0');
  });
});

describe('kit 3D · instrumentos, pesas y texto', () => {
  it('formatoCronometro', () => {
    expect(formatoCronometro(0)).toBe('00:00.00');
    expect(formatoCronometro(83.47)).toBe('01:23.47');
    expect(formatoCronometro(1.79)).toBe('00:01.79');
    expect(formatoCronometro(-2)).toBe('00:00.00');
  });
  it('las pesas ranuradas tienen el espesor que da su masa', () => {
    const p100 = dimensionesPesa(100), p50 = dimensionesPesa(50);
    expect(p100.espesor).toBeCloseTo(p50.espesor * 2, 9);
    // latón de 100 g y 46 mm: ~7,5 mm de espesor
    expect(p100.espesor * 100).toBeGreaterThan(6); expect(p100.espesor * 100).toBeLessThan(9);
    expect(alturaPila([100, 50, 20])).toBeCloseTo(p100.espesor + p50.espesor + dimensionesPesa(20).espesor, 12);
  });
  it('el dinamómetro estira proporcional a la fuerza y satura un 5 % sobre el máximo', () => {
    expect(dinamometroAlargamiento(5, 10)).toBeCloseTo(dinamometroAlargamiento(10, 10) / 2, 12);
    expect(dinamometroAlargamiento(50, 10)).toBeCloseTo(dinamometroAlargamiento(10.5, 10), 12);
    expect(dinamometroAlargamiento(-1, 10)).toBe(0);
  });
  it('analizarFormato: superíndices, subíndices y cursiva', () => {
    expect(analizarFormato('x^2')).toEqual([{ t: 'x', nivel: 0, cursiva: false }, { t: '2', nivel: 1, cursiva: false }]);
    expect(analizarFormato('v_{max} = 3')).toEqual([{ t: 'v', nivel: 0, cursiva: false }, { t: 'max', nivel: -1, cursiva: false }, { t: ' = 3', nivel: 0, cursiva: false }]);
    expect(analizarFormato('*x*')).toEqual([{ t: 'x', nivel: 0, cursiva: true }]);
  });
  it('la catenaria pasa por sus extremos, cuelga por debajo de la cuerda y respeta el suelo', () => {
    const A: [number, number, number] = [0, 1, 0], B: [number, number, number] = [2, 1.5, 0.5];
    const p = puntosCatenaria(A, B, 0.3, 40);
    expect(p[0]).toBeCloseTo(0, 6); expect(p[1]).toBeCloseTo(1, 6);
    expect(p[39 * 3]).toBeCloseTo(2, 6); expect(p[39 * 3 + 1]).toBeCloseTo(1.5, 6); expect(p[39 * 3 + 2]).toBeCloseTo(0.5, 6);
    expect(p[20 * 3 + 1]).toBeLessThan(1.25);
    // longitud ≈ distancia·1,3
    let L = 0;
    for (let i = 1; i < 40; i++) L += Math.hypot(p[i * 3] - p[i * 3 - 3], p[i * 3 + 1] - p[i * 3 - 2], p[i * 3 + 2] - p[i * 3 - 1]);
    expect(L / (Math.hypot(2, 0.5, 0.5) * 1.3)).toBeGreaterThan(0.98);
    const q = puntosCatenaria([0, 0.1, 0], [3, 0.1, 0], 0.5, 40, 0.0);
    for (let i = 0; i < 40; i++) expect(q[i * 3 + 1]).toBeGreaterThanOrEqual(0);
  });
});
