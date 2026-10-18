/**
 * MAT-06 · Transformaciones geométricas — la matemática del taller
 * (`simuladores/mat06/transformaciones.ts`), su reloj único (`reloj.ts`), las cotas de la
 * escena (`banco.ts`) y la geometría de la pieza de vidrio (`geometria.ts`).
 *
 *  - Cada matriz contra su DEFINICIÓN (imágenes de puntos y de la base), y T·R·S contra la
 *    `matrizM6` del validador del dominio.
 *  - det = factor de área con signo: el área (cordón de zapato) de la imagen de la pieza es
 *    det × la de la pieza, y el signo cambia sólo en la reflexión.
 *  - Isometrías: todas las distancias entre vértices se conservan; la homotecia las
 *    multiplica por |k|.
 *  - No conmutatividad: T·R ≠ R·T (mismo bloque 2×2, traslaciones que difieren en (I − R)·v);
 *    R(90°)·S ≠ S·R(90°); dos reflexiones dan un giro de 2(β − α).
 *  - Inversas: M·M⁻¹ = I; la reflexión es su propia inversa; la homotecia de razón 0 no tiene.
 *  - El viaje: de la identidad a M; arcos de radio constante, rayos por el centro y, en la
 *    reflexión, la sombra del medio giro 3D con det = cos φ (0 a mitad del volteo).
 *  - El reloj: dock y escena leen el mismo estado; el recorrido visita las cinco estaciones.
 */
import * as THREE from 'three';
import {
  PIEZA, ORIGINAL, M_ORIGINAL, PUNTOS_CLAVE, PARAMS_INICIALES, RANGOS, TIPOS, PUNTO_C,
  identidad, mul, aplicar, transformar, det2, det3, inversa, casiIgual, traslacion, rotacion, reflexion, homotecia, trs,
  sombraVolteo, normalEje, matrizFinal, matrizEn, pose3D, embeber, aplicar4, areaConSigno, distancia, centroide,
  elevacionVolteo, num, numCorto, rotuloTransformacion, cajaDe,
  type Mat3, type P2, type ParamsT, type TipoT,
} from '@/components/simuladores/mat06/transformaciones';
import { RelojTransf, DURACION, suave } from '@/components/simuladores/mat06/reloj';
import { cajaEncuadre, ENCUADRE, PLACA, RANGO } from '@/components/simuladores/mat06/banco';
import { geometriaPieza, contarNormalesCero } from '@/components/simuladores/mat06/geometria';
import { matrizM6 } from '@/domain/matematicas';

const EPS = 1e-12;
const cerca = (a: P2, b: P2, eps = 1e-12) => Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
/** Generador reproducible. */
function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const rnd = azar(606);
const punto = (): P2 => [rnd() * 20 - 10, rnd() * 20 - 10];

describe('cada matriz contra su definición', () => {
  test('traslación: (x, y) ↦ (x + vx, y + vy)', () => {
    for (let i = 0; i < 50; i++) {
      const [vx, vy] = punto(), p = punto();
      expect(cerca(aplicar(traslacion(vx, vy), p), [p[0] + vx, p[1] + vy])).toBe(true);
    }
  });
  test('giro: R(90°) lleva e₁ a e₂ y e₂ a −e₁; R(θ)(x, y) = (x cos θ − y sen θ, x sen θ + y cos θ)', () => {
    expect(aplicar(rotacion(90), [1, 0])).toEqual([0, 1]);
    expect(aplicar(rotacion(90), [0, 1])).toEqual([-1, 0]);
    expect(aplicar(rotacion(180), [2, 5])).toEqual([-2, -5]);
    for (let i = 0; i < 50; i++) {
      const th = rnd() * 720 - 360, r = (th * Math.PI) / 180, [x, y] = punto();
      expect(cerca(aplicar(rotacion(th), [x, y]), [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)], 1e-12)).toBe(true);
    }
  });
  test('giro alrededor de c = T(c)·R·T(−c): deja fijo el centro', () => {
    for (let i = 0; i < 40; i++) {
      const th = rnd() * 360, c = punto();
      const M = rotacion(th, c);
      expect(casiIgual(M, mul(traslacion(c[0], c[1]), rotacion(th), traslacion(-c[0], -c[1])), 1e-12)).toBe(true);
      expect(cerca(aplicar(M, c), c, 1e-12)).toBe(true);
    }
  });
  test('reflexión: eje x → (x, −y); eje y → (−x, y); recta y = x → (y, x); fija el eje e invierte la normal', () => {
    expect(aplicar(reflexion(0), [2, 5])).toEqual([2, -5]);
    expect(aplicar(reflexion(90), [2, 5])).toEqual([-2, 5]);
    expect(cerca(aplicar(reflexion(45), [2, 5]), [5, 2])).toBe(true);
    for (let i = 0; i < 40; i++) {
      const a = rnd() * 180, r = (a * Math.PI) / 180, s = rnd() * 10 - 5;
      const [nx, ny] = normalEje(a);
      expect(cerca(aplicar(reflexion(a), [s * Math.cos(r), s * Math.sin(r)]), [s * Math.cos(r), s * Math.sin(r)], 1e-12)).toBe(true);
      expect(cerca(aplicar(reflexion(a), [nx, ny]), [-nx, -ny], 1e-12)).toBe(true);
    }
  });
  test('homotecia: P′ − c = k·(P − c)', () => {
    for (let i = 0; i < 50; i++) {
      const k = rnd() * 6 - 3, c = punto(), p = punto();
      const q = aplicar(homotecia(k, c), p);
      expect(cerca([q[0] - c[0], q[1] - c[1]], [k * (p[0] - c[0]), k * (p[1] - c[1])], 1e-12)).toBe(true);
    }
  });
  test('T·R·S es la MISMA matriz que usa el validador del reto (matrizM6)', () => {
    for (const tx of [-5, -2.3, 0, 3]) for (const ty of [-4, 0, 1.7, 5]) for (const rot of [0, 45, 90, 135, 270, 315]) for (const s of [0.5, 1, 1.5, 2]) {
      const A = trs(tx, ty, rot, s), B = matrizM6(tx, ty, rot, s);
      expect(casiIgual(A, B, 1e-12)).toBe(true);
    }
  });
});

describe('determinante = factor de área con signo', () => {
  const area0 = areaConSigno(PIEZA);
  test('la pieza tiene área no nula (es un polígono de verdad)', () => {
    expect(Math.abs(area0)).toBeGreaterThan(2);
  });
  test('giro y traslación 1, reflexión −1, homotecia k², reto s²', () => {
    expect(det2(rotacion(37, [2, -1]))).toBeCloseTo(1, 12);
    expect(det2(traslacion(4, -3))).toBe(1);
    expect(det2(reflexion(23))).toBeCloseTo(-1, 12);
    expect(det2(homotecia(-1.5, [1, 1]))).toBeCloseTo(2.25, 12);
    expect(det2(trs(3, -2, 90, 1.5))).toBeCloseTo(2.25, 12);
  });
  test('det de la 3×3 afín = det del bloque 2×2', () => {
    for (let i = 0; i < 30; i++) {
      const M: Mat3 = [[rnd() * 4 - 2, rnd() * 4 - 2, rnd() * 10 - 5], [rnd() * 4 - 2, rnd() * 4 - 2, rnd() * 10 - 5], [0, 0, 1]];
      expect(det3(M)).toBeCloseTo(det2(M), 12);
    }
  });
  test('área (cordón de zapato) de la imagen = det × área de la pieza, con su signo', () => {
    for (let i = 0; i < 60; i++) {
      const M: Mat3 = [[rnd() * 4 - 2, rnd() * 4 - 2, rnd() * 10 - 5], [rnd() * 4 - 2, rnd() * 4 - 2, rnd() * 10 - 5], [0, 0, 1]];
      expect(areaConSigno(transformar(M, PIEZA))).toBeCloseTo(det2(M) * area0, 10);
    }
    for (const tipo of TIPOS) for (const rama of [0, 1] as const) {
      const M = matrizFinal(tipo, PARAMS_INICIALES[tipo], rama);
      expect(areaConSigno(transformar(M, ORIGINAL))).toBeCloseTo(det2(M) * areaConSigno(ORIGINAL), 10);
    }
  });
  test('la pieza es quiral: la reflexión invierte el signo del área y ningún giro lo hace', () => {
    expect(Math.sign(areaConSigno(transformar(reflexion(60), PIEZA)))).toBe(-Math.sign(area0));
    for (let th = 0; th < 360; th += 15) expect(Math.sign(areaConSigno(transformar(trs(1, 2, th, 1.5), PIEZA)))).toBe(Math.sign(area0));
  });
});

describe('isometrías y homotecias', () => {
  const pares: [number, number][] = [];
  for (let i = 0; i < PIEZA.length; i++) for (let j = i + 1; j < PIEZA.length; j++) pares.push([i, j]);
  test('giros, reflexiones y traslaciones conservan TODAS las distancias', () => {
    for (let n = 0; n < 30; n++) {
      const Ms = [rotacion(rnd() * 360, punto()), reflexion(rnd() * 180, punto()), traslacion(...punto()), mul(reflexion(rnd() * 180), rotacion(rnd() * 360), traslacion(...punto()))];
      for (const M of Ms) {
        const Q = transformar(M, PIEZA);
        for (const [i, j] of pares) expect(distancia(Q[i], Q[j])).toBeCloseTo(distancia(PIEZA[i], PIEZA[j]), 11);
      }
    }
  });
  test('la homotecia multiplica las distancias por |k| (y el área por k²)', () => {
    for (const k of [-2, -1.5, -0.5, 0.25, 1.75, 2]) {
      const Q = transformar(homotecia(k, PUNTO_C), PIEZA);
      for (const [i, j] of pares) expect(distancia(Q[i], Q[j])).toBeCloseTo(Math.abs(k) * distancia(PIEZA[i], PIEZA[j]), 11);
    }
  });
});

describe('composición: el orden importa', () => {
  test('T·R ≠ R·T: el mismo bloque 2×2 y traslaciones que difieren en (I − R)·v', () => {
    for (let n = 0; n < 40; n++) {
      const th = 15 + rnd() * 330, v: P2 = [rnd() * 7 - 3.5, rnd() * 7 - 3.5];
      const R = rotacion(th), T = traslacion(v[0], v[1]);
      const TR = mul(T, R), RT = mul(R, T);
      expect(casiIgual(TR, RT, 1e-9)).toBe(false);
      for (const [i, j] of [[0, 0], [0, 1], [1, 0], [1, 1]]) expect(TR[i][j]).toBeCloseTo(RT[i][j], 12);
      const Rv = aplicar(R, v);
      expect(TR[0][2] - RT[0][2]).toBeCloseTo(v[0] - Rv[0], 12);
      expect(TR[1][2] - RT[1][2]).toBeCloseTo(v[1] - Rv[1], 12);
    }
  });
  test('R(90°)·S_x es la reflexión en y = x y S_x·R(90°) la de y = −x', () => {
    const Sx = reflexion(0), R90 = rotacion(90);
    expect(casiIgual(mul(R90, Sx), reflexion(45), EPS)).toBe(true);
    expect(casiIgual(mul(Sx, R90), reflexion(135), EPS)).toBe(true);
    expect(casiIgual(mul(R90, Sx), mul(Sx, R90), 1e-9)).toBe(false);
  });
  test('dos giros del mismo centro conmutan; dos reflexiones dan un giro de 2(β − α)', () => {
    const c: P2 = [1.5, -2];
    expect(casiIgual(mul(rotacion(40, c), rotacion(75, c)), mul(rotacion(75, c), rotacion(40, c)), 1e-12)).toBe(true);
    for (const [a, b] of [[0, 30], [20, 65], [100, 10]]) {
      expect(casiIgual(mul(reflexion(b), reflexion(a)), rotacion(2 * (b - a)), 1e-12)).toBe(true);
    }
  });
  test('la estación de composición: la rama 0 es T·R y la 1 es R·T; llegan a sitios distintos', () => {
    const p = PARAMS_INICIALES.composicion;
    const T = traslacion(p.vx, p.vy), R = rotacion(p.theta);
    expect(casiIgual(matrizFinal('composicion', p, 0), mul(T, R), EPS)).toBe(true);
    expect(casiIgual(matrizFinal('composicion', p, 1), mul(R, T), EPS)).toBe(true);
    const a = centroide(transformar(mul(T, R), ORIGINAL)), b = centroide(transformar(mul(R, T), ORIGINAL));
    expect(distancia(a, b)).toBeGreaterThan(4);
  });
});

describe('inversas', () => {
  test('M·M⁻¹ = M⁻¹·M = I', () => {
    for (let n = 0; n < 40; n++) {
      const M = mul(traslacion(...punto()), rotacion(rnd() * 360, punto()), homotecia(0.3 + rnd() * 2, punto()), reflexion(rnd() * 180));
      const Mi = inversa(M)!;
      expect(casiIgual(mul(M, Mi), identidad(), 1e-10)).toBe(true);
      expect(casiIgual(mul(Mi, M), identidad(), 1e-10)).toBe(true);
    }
  });
  test('la reflexión es su propia inversa; la del giro es R(−θ) = Rᵀ; la de T·R·S es S⁻¹·R⁻¹·T⁻¹', () => {
    for (const a of [0, 15, 60, 90, 135]) expect(casiIgual(inversa(reflexion(a))!, reflexion(a), 1e-12)).toBe(true);
    const R = rotacion(70);
    expect(casiIgual(inversa(R)!, rotacion(-70), 1e-12)).toBe(true);
    expect(inversa(R)![0][1]).toBeCloseTo(R[1][0], 12);
    const M = trs(3, -2, 135, 1.5);
    expect(casiIgual(inversa(M)!, mul(homotecia(1 / 1.5), rotacion(-135), traslacion(-3, 2)), 1e-12)).toBe(true);
  });
  test('la homotecia de razón 0 aplasta la figura: no tiene inversa', () => {
    expect(inversa(homotecia(0, PUNTO_C))).toBeNull();
    expect(det2(homotecia(0))).toBe(0);
  });
});

describe('el viaje de la figura a su imagen', () => {
  const todas: [TipoT, 0 | 1][] = [...TIPOS.map((t) => [t, 0] as [TipoT, 0]), ['composicion', 1]];
  test.each(todas)('%s (rama %i): t = 0 es la identidad y t = 1 la matriz final', (tipo, rama) => {
    const p = PARAMS_INICIALES[tipo];
    expect(casiIgual(matrizEn(tipo, p, 0, rama), identidad(), 1e-12)).toBe(true);
    expect(casiIgual(matrizEn(tipo, p, 1, rama), matrizFinal(tipo, p, rama), 1e-12)).toBe(true);
  });
  test('giro: los vértices recorren ARCOS (distancia al centro constante) y el ángulo crece con t', () => {
    const p = PARAMS_INICIALES.rotacion, c = PUNTO_C;
    for (const q of ORIGINAL) for (let t = 0; t <= 1; t += 0.05) expect(distancia(aplicar(matrizEn('rotacion', p, t), q), c)).toBeCloseTo(distancia(q, c), 12);
  });
  test('homotecia: cada vértice avanza por el RAYO que sale del centro', () => {
    const p = PARAMS_INICIALES.homotecia, c = PUNTO_C;
    for (const q of ORIGINAL) for (let t = 0; t <= 1; t += 0.05) {
      const r = aplicar(matrizEn('homotecia', p, t), q);
      expect((q[0] - c[0]) * (r[1] - c[1]) - (q[1] - c[1]) * (r[0] - c[0])).toBeCloseTo(0, 11);
    }
  });
  test('traslación: todos los vértices se desplazan el MISMO vector t·v', () => {
    const p = PARAMS_INICIALES.traslacion;
    for (const q of ORIGINAL) {
      const r = aplicar(matrizEn('traslacion', p, 0.3), q);
      expect(cerca([r[0] - q[0], r[1] - q[1]], [0.3 * p.vx, 0.3 * p.vy], 1e-12)).toBe(true);
    }
  });
  test('reflexión: la sombra del volteo tiene det = cos(π·t) y se aplasta a mitad del camino', () => {
    const p = PARAMS_INICIALES.reflexion;
    for (let t = 0; t <= 1; t += 0.05) expect(det2(matrizEn('reflexion', p, t))).toBeCloseTo(Math.cos(Math.PI * t), 12);
    expect(det2(matrizEn('reflexion', p, 0.5))).toBeCloseTo(0, 12);
    expect(casiIgual(sombraVolteo(p.alfa, [0, 0], 1), reflexion(p.alfa), 1e-12)).toBe(true);
  });
  test('reflexión: la pose 3D es un medio giro real cuya sombra ortogonal es la matriz del dock', () => {
    const p = PARAMS_INICIALES.reflexion, h = 0.5;
    for (let t = 0; t <= 1; t += 0.1) {
      const pose = pose3D('reflexion', p, t, M_ORIGINAL, h);
      const S = mul(matrizEn('reflexion', p, t), M_ORIGINAL);
      for (const q of PIEZA) {
        const [x, y, z] = aplicar4(pose, q[0], q[1], 0);
        expect(cerca([x, y], aplicar(S, q), 1e-9)).toBe(true);
        expect(z).toBeGreaterThanOrEqual(h - 1e-9);         // nunca cruza detrás del vidrio
      }
      // es una rotación: columnas ortonormales del bloque 3×3
      const col = (j: number) => new THREE.Vector3(pose[j * 4], pose[j * 4 + 1], pose[j * 4 + 2]);
      expect(col(0).length()).toBeCloseTo(1, 12);
      expect(col(0).dot(col(2))).toBeCloseTo(0, 12);
    }
    // al llegar, la cara de delante mira hacia el vidrio: se ve el dorso (orientación invertida)
    const fin = pose3D('reflexion', p, 1, M_ORIGINAL, h);
    expect(fin[10]).toBeCloseTo(-1, 12);
    expect(elevacionVolteo(p.alfa, [0, 0], ORIGINAL)).toBe(0);
  });
  test('si el eje corta la figura, la pieza se eleva lo justo para no cruzar el vidrio', () => {
    const p: ParamsT = { ...PARAMS_INICIALES.reflexion, alfa: 150 };
    expect(elevacionVolteo(p.alfa, [0, 0], ORIGINAL)).toBeGreaterThan(0);
    for (let t = 0; t <= 1; t += 0.05) {
      const pose = pose3D('reflexion', p, t, M_ORIGINAL, 0.5);
      for (const q of PIEZA) expect(aplicar4(pose, q[0], q[1], -0.1)[2]).toBeGreaterThanOrEqual(0.5 - 0.1 - 1e-9);
    }
  });
  test('las demás poses son la matriz plana con la pieza a su altura; la homotecia por 0 no se aplasta del todo', () => {
    const p = PARAMS_INICIALES.rotacion;
    const pose = pose3D('rotacion', p, 0.4, M_ORIGINAL, 0.5);
    expect(pose).toEqual(embeber(mul(matrizEn('rotacion', p, 0.4), M_ORIGINAL), 0.5));
    const q: ParamsT = { ...PARAMS_INICIALES.homotecia, k: 0 };
    const pq = pose3D('homotecia', q, 1, M_ORIGINAL, 0.5);
    expect(Math.abs(pq[0] * pq[5] - pq[1] * pq[4])).toBeGreaterThan(1e-4);
  });
  test('composición: a mitad del viaje la rama T·R sólo ha girado y la R·T sólo ha trasladado', () => {
    const p = PARAMS_INICIALES.composicion;
    expect(casiIgual(matrizEn('composicion', p, 0.5, 0), rotacion(p.theta), 1e-12)).toBe(true);
    expect(casiIgual(matrizEn('composicion', p, 0.5, 1), traslacion(p.vx, p.vy), 1e-12)).toBe(true);
  });
});

describe('los mandos del taller nunca sacan la imagen de la placa', () => {
  const valores = (r: { min: number; max: number; paso: number }) => { const v: number[] = []; for (let x = r.min; x <= r.max + 1e-9; x += r.paso) v.push(x); return v; };
  const dentro = (M: Mat3) => transformar(M, ORIGINAL).every(([x, y]) => Math.abs(x) <= RANGO + 0.2 && Math.abs(y) <= RANGO + 0.2);
  test('traslación, giro, reflexión y homotecia', () => {
    for (const vx of valores(RANGOS.vx)) for (const vy of valores(RANGOS.vy)) expect(dentro(traslacion(vx, vy))).toBe(true);
    for (const th of valores(RANGOS.theta)) for (const c of ['O', 'C'] as const) expect(dentro(matrizFinal('rotacion', { ...PARAMS_INICIALES.rotacion, theta: th, centro: c }))).toBe(true);
    for (const a of valores(RANGOS.alfa)) expect(dentro(reflexion(a))).toBe(true);
    for (const k of valores(RANGOS.k)) for (const c of ['O', 'C'] as const) expect(dentro(matrizFinal('homotecia', { ...PARAMS_INICIALES.homotecia, k, centro: c }))).toBe(true);
  });
  test('composición (las dos ramas)', () => {
    for (const th of valores(RANGOS.theta)) for (const vx of valores(RANGOS.vComp)) for (const vy of valores(RANGOS.vComp)) {
      const p = { ...PARAMS_INICIALES.composicion, theta: th, vx, vy };
      expect(dentro(matrizFinal('composicion', p, 0)) && dentro(matrizFinal('composicion', p, 1))).toBe(true);
    }
  });
});

describe('el reloj único', () => {
  test('dock y escena leen el MISMO estado: M del cuadro y puntos = M·original', () => {
    const r = new RelojTransf('explorar');
    for (let i = 0; i < 200; i++) {
      r.paso(1 / 60);
      const l = r.lectura();
      expect(casiIgual(l.M, matrizEn(r.tipo, r.p, r.t), 0)).toBe(true);
      expect(l.det).toBe(det2(l.M));
      for (const q of l.puntos) expect(q.ahora).toEqual(aplicar(l.M, q.orig));
    }
  });
  test('los puntos clave del taller son los de la pieza colocada (A, B, C y el pivote)', () => {
    const l = new RelojTransf('explorar').lectura();
    expect(l.puntos.map((q) => q.id)).toEqual(['A', 'B', 'C', 'P']);
    l.puntos.forEach((q, i) => expect(q.orig).toEqual(aplicar(M_ORIGINAL, PUNTOS_CLAVE[i].p)));
  });
  test('la ida dura lo que dice DURACION y llega exactamente a la imagen', () => {
    const r = new RelojTransf('explorar');
    let s = 0;
    while (r.fase === 'ida' && s < 10) { r.paso(1 / 120); s += 1 / 120; }
    expect(s).toBeCloseTo(DURACION.ida, 1);
    expect(casiIgual(r.lectura().M, matrizFinal(r.tipo, r.p), 1e-12)).toBe(true);
    expect(suave(0)).toBe(0); expect(suave(1)).toBe(1); expect(suave(0.5)).toBeCloseTo(0.5, 12);
  });
  test('el recorrido visita las cinco estaciones en orden y vuelve a empezar', () => {
    const r = new RelojTransf('explorar');
    const vistas: TipoT[] = [r.tipo];
    for (let i = 0; i < 60 * 60 && vistas.length < 6; i++) { r.paso(1 / 60); if (r.tipo !== vistas[vistas.length - 1]) vistas.push(r.tipo); }
    expect(vistas).toEqual([...TIPOS, TIPOS[0]]);
  });
  test('elegir estación para el recorrido; cambiar un mando cambia la matriz en el mismo cuadro', () => {
    const r = new RelojTransf('explorar');
    r.setTipo('homotecia');
    expect(r.recorrido).toBe(false);
    r.setAvance(1);
    expect(det2(r.lectura().M)).toBeCloseTo(PARAMS_INICIALES.homotecia.k ** 2, 12);
    r.setParam({ k: 2 });
    expect(det2(r.lectura().M)).toBeCloseTo(4, 12);
    // cada estación guarda sus mandos
    r.setTipo('rotacion');
    expect(r.p.theta).toBe(PARAMS_INICIALES.rotacion.theta);
    r.setTipo('homotecia');
    expect(r.p.k).toBe(2);
  });
  test('movimiento reducido: la imagen ya colocada y quieta', () => {
    const r = new RelojTransf('explorar');
    r.estatico();
    const M = r.lectura().M;
    for (let i = 0; i < 100; i++) r.paso(1 / 30);
    expect(casiIgual(r.lectura().M, M, 0)).toBe(true);
    expect(casiIgual(M, matrizFinal(r.tipo, r.p), 1e-12)).toBe(true);
  });
  test('reto: la placa dibujada converge a los mandos y su matriz es T·R·S (giro por el camino corto)', () => {
    const r = new RelojTransf('reto');
    r.setMeta({ tx: 3, ty: -2, rot: 350, s: 1.5 });
    let s = 0;
    for (; s < 3; s += 1 / 60) r.paso(1 / 60);
    expect(r.pose).toEqual({ tx: 3, ty: -2, rot: 350, s: 1.5 });
    expect(casiIgual(r.lectura().M, matrizM6(3, -2, 350, 1.5), 1e-12)).toBe(true);
    // de 350° a 10° gira 20°, no 340°
    r.setMeta({ tx: 3, ty: -2, rot: 10, s: 1.5 });
    r.paso(1 / 60);
    expect(r.pose.rot).toBeGreaterThan(350);
    // la tabla del reto es de la pieza → tu placa (nunca la silueta)
    expect(r.lectura().puntos.map((q) => q.orig)).toEqual(PUNTOS_CLAVE.map((k) => k.p));
  });
});

describe('cotas de la escena y geometría de la pieza', () => {
  test('el encuadre tiene el tamaño mínimo, incluye lo pedido y no sale de la placa', () => {
    const c = cajaEncuadre(cajaDe(ORIGINAL));
    expect(c.x1 - c.x0).toBeGreaterThanOrEqual(ENCUADRE.minAncho - 1e-9);
    expect(c.y1 - c.y0).toBeGreaterThanOrEqual(ENCUADRE.minAlto - 1e-9);
    const g = cajaEncuadre({ x0: -12, x1: 12, y0: -12, y1: 12 });
    expect(g.x0).toBeGreaterThanOrEqual(-PLACA.lado / 2 - 1e-9);
    expect(g.y1).toBeLessThanOrEqual(PLACA.lado / 2 + 1e-9);
    const conCentro = cajaEncuadre(cajaDe(ORIGINAL), [[6, -6]]);
    expect(conCentro.x1).toBeGreaterThan(6); expect(conCentro.y0).toBeLessThan(-6);
  });
  test('pieza de vidrio: frente +z, dorso −z, cantos horizontales y CERO normales nulas', () => {
    const g = geometriaPieza(0.2);
    const n = g.getAttribute('normal');
    expect(g.groups.map((x) => x.materialIndex).sort()).toEqual([0, 1, 2]);
    for (const gr of g.groups) for (let i = gr.start; i < gr.start + gr.count; i++) {
      const nz = n.getZ(i);
      if (gr.materialIndex === 0) expect(nz).toBeCloseTo(1, 9);
      else if (gr.materialIndex === 1) expect(nz).toBeCloseTo(-1, 9);
      else expect(Math.abs(nz)).toBeLessThan(1e-9);
    }
    const escena = new THREE.Scene();
    escena.add(new THREE.Mesh(g));
    expect(contarNormalesCero(escena).normalesCero).toBe(0);
  });
});

describe('formato', () => {
  test('coma decimal y signo menos tipográfico', () => {
    expect(num(-0.5, 2)).toBe('−0,50');
    expect(num(-0.0001, 2)).toBe('0,00');
    expect(num(2.25, 2, true)).toBe('+2,25');
    expect(numCorto(1.5)).toBe('1,5');
    expect(numCorto(2)).toBe('2');
    expect(numCorto(-0.25)).toBe('−0,25');
    expect(rotuloTransformacion('composicion', PARAMS_INICIALES.composicion)).toBe('T(2,5; 3) y R(−90°)');
    expect(rotuloTransformacion('homotecia', PARAMS_INICIALES.homotecia)).toBe('H(k = −1,5) · centro C');
  });
});
