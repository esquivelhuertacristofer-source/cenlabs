'use client';
/**
 * bio04/cloroplasto.tsx — el cloroplasto en media sección (esquema: tamaños no a escala).
 *
 *   · ENVOLTURA DOBLE: membrana externa e interna, cada una una cáscara cerrada (dos
 *     superficies) cortada por el plano z = 0; el espacio intermembrana es el hueco.
 *   · GRANA: pilas de tilacoides. Cada tilacoide es un disco HUECO (membrana + lumen): en los
 *     que corta el plano se ve la membrana en sección (rayada) y el lumen, teñido con el pH
 *     que dice el modelo (escala de indicador universal).
 *   · LAMELAS DEL ESTROMA (trastes) que unen los grana, ALMIDÓN, PLASTOGLÓBULOS y el
 *     ESTROMA lleno de Rubisco y ribosomas 70S (puntitos con agitación térmica esquemática).
 *   · El CICLO DE CALVIN como un anillo en el estroma (esquema) con la Rubisco en su
 *     estación de fijación; las partículas que lo recorren están en `particulas.tsx`.
 *   · Una MITOCONDRIA en el citoplasma, también cortada: respira el O₂ (la R del modelo).
 *
 * Unidades de escena: 1 u ≈ 0,6 µm para el cloroplasto (5,3 µm de largo). Los grosores de
 * las membranas y de los tilacoides están exagerados para que se lean (se declara).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { tornear, cajaRedondeada, sanearNormales } from '../_kit';
import { materialCera, materialCorte, materialFantasma, colorPH } from './materiales';
import type { RelojFoto } from './reloj';

export type V3 = [number, number, number];

// ───────────────────────────── cotas ─────────────────────────────

/** Semiejes del cloroplasto (u) y grosores de la envoltura (exagerados para que se lean). */
export const CLORO = {
  A: 4.4, B: 2.05, C: 2.6,
  /** grosor de cada membrana de la envoltura */
  t: 0.06,
  /** espacio intermembrana */
  ims: 0.08,
} as const;
/** Semiejes de la superficie interior de la membrana interna (lo que limita el estroma). */
export const ESTROMA = { A: CLORO.A - 2 * CLORO.t - CLORO.ims, B: CLORO.B - 2 * CLORO.t - CLORO.ims, C: CLORO.C - 2 * CLORO.t - CLORO.ims };
/** ¿Está p dentro del elipsoide (a, b, c) con un margen m? */
export const dentroElipsoide = (p: V3, e: { A: number; B: number; C: number }, m = 0) =>
  (p[0] / (e.A - m)) ** 2 + (p[1] / (e.B - m)) ** 2 + (p[2] / (e.C - m)) ** 2 <= 1;

/** Tilacoide: radio base, semigrosor, grosor de membrana y paso de la pila. */
export const TILACOIDE = { R: 0.52, h: 0.052, m: 0.024, paso: 0.128 } as const;

/**
 * CORTE: se quita la tapa de arriba del cloroplasto (y > Y_CORTE). Queda un «plato» verde
 * con la envoltura doble en sección en el borde y los grana de pie dentro; el disco de
 * arriba de los grana más altos queda cortado y enseña el lumen (teñido con el pH).
 */
export const Y_CORTE = 0.35;
/** ¿Sigue existiendo el punto (no está en la tapa quitada)? */
export const enPieza = (p: V3 | THREE.Vector3) => (Array.isArray(p) ? p[1] : p.y) <= Y_CORTE;
/** Altura del disco de arriba de un granum cortado: el plano pasa por su lumen. */
const CORTA = Y_CORTE + 0.005;

export interface Granum { x: number; y: number; z: number; n: number; r: number; cortado: boolean }
/**
 * Grana colocados a mano en tres filas al tresbolillo, con un hueco para el ciclo de Calvin,
 * y recortados por abajo al estroma (las pilas del borde, donde el plato es bajo, tienen
 * menos tilacoides; en la realidad un granum tiene de unos pocos a decenas).
 */
export const GRANA: Granum[] = (() => {
  const base: { x: number; z: number; top: number; n: number; r: number }[] = [
    // fila de atrás
    { x: -2.62, z: -1.08, top: 0.16, n: 16, r: 0.46 }, { x: -1.38, z: -1.15, top: 0.24, n: 16, r: 0.5 },
    { x: 0.05, z: -1.2, top: CORTA, n: 16, r: 0.52 }, { x: 1.35, z: -1.15, top: 0.22, n: 16, r: 0.5 },
    { x: 2.6, z: -1.05, top: 0.14, n: 16, r: 0.46 },
    // fila central (hueco para el ciclo de Calvin en x ≈ 0,6)
    { x: -3.3, z: 0.0, top: 0.1, n: 14, r: 0.42 }, { x: -2.02, z: 0.04, top: CORTA, n: 16, r: 0.52 },
    { x: -0.76, z: -0.02, top: CORTA, n: 18, r: 0.54 }, { x: 1.98, z: 0.0, top: CORTA, n: 18, r: 0.53 },
    { x: 3.25, z: 0.04, top: 0.08, n: 14, r: 0.42 },
    // fila de delante
    { x: -2.6, z: 1.08, top: 0.16, n: 16, r: 0.46 }, { x: -1.36, z: 1.15, top: CORTA, n: 16, r: 0.5 },
    { x: 0.42, z: 1.2, top: 0.2, n: 16, r: 0.5 }, { x: 1.72, z: 1.12, top: 0.24, n: 16, r: 0.48 },
    { x: 2.88, z: 0.98, top: 0.12, n: 14, r: 0.42 },
  ];
  return base.map((g) => {
    let n = g.n;
    const fondo = () => g.top - (n - 1) * TILACOIDE.paso - TILACOIDE.h;
    const cabe = () => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        if (!dentroElipsoide([g.x + Math.cos(a) * g.r, fondo(), g.z + Math.sin(a) * g.r], ESTROMA, 0.07)) return false;
      }
      return true;
    };
    while (n > 3 && !cabe()) n--;
    return { x: g.x, z: g.z, r: g.r, n, y: g.top - ((n - 1) / 2) * TILACOIDE.paso, cortado: g.top + TILACOIDE.h > Y_CORTE };
  });
})();

/** Centro (mundo) del disco k del granum g (k = 0 abajo). */
export const centroDisco = (g: Granum, k: number): V3 => [g.x, g.y + (k - (g.n - 1) / 2) * TILACOIDE.paso, g.z];
export interface Disco { g: number; k: number; c: V3; r: number; corte: boolean; arriba: boolean }
/** Todos los discos, con si los corta el plano y si son el de arriba de su pila. */
export const DISCOS: Disco[] = GRANA.flatMap((g, gi) => Array.from({ length: g.n }, (_, k) => {
  const c = centroDisco(g, k);
  return { g: gi, k, c, r: g.r, corte: c[1] + TILACOIDE.h > Y_CORTE, arriba: k === g.n - 1 };
}));

/**
 * Un punto al azar en un granum, del lado que se ve: la cara de arriba de la pila (la mitad
 * de las veces) o el canto de un tilacoide del lado de donde llega la luz `haciaLuz`.
 */
export function puntoEnGranum(gi: number, rnd: () => number, out = new THREE.Vector3(), haciaLuz?: THREE.Vector3): THREE.Vector3 {
  const g = GRANA[gi];
  if (rnd() < 0.5 || !haciaLuz) {
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * g.r * 0.85;
    const top = centroDisco(g, g.n - 1)[1];
    return out.set(g.x + Math.cos(a) * rr, Math.min(top + TILACOIDE.h * 0.5, Y_CORTE - 0.01), g.z + Math.sin(a) * rr);
  }
  const k = Math.floor(rnd() * g.n);
  const base = Math.atan2(haciaLuz.z, haciaLuz.x);
  const a = base + (rnd() - 0.5) * 1.6;
  return out.set(g.x + Math.cos(a) * g.r * 0.98, Math.min(centroDisco(g, k)[1], Y_CORTE - 0.01), g.z + Math.sin(a) * g.r * 0.98);
}

/** Ciclo de Calvin (esquema): anillo casi horizontal en el hueco central del estroma. */
export const CALVIN_ANILLO = { c: [0.6, -0.3, 0.02] as V3, R: 0.46, normal: [0.06, 1, 0.16] as V3 };
/** Ángulos (rad) de las estaciones del anillo: fijación (Rubisco), reducción, salida de G3P, regeneración. */
export const ESTACIONES = { fijacion: 0, reduccion: (2 * Math.PI) / 3 - 0.35, salida: Math.PI + 0.2, regeneracion: (5 * Math.PI) / 3 } as const;
/** Base ortonormal del plano del anillo. */
export const BASE_ANILLO = (() => {
  const n = new THREE.Vector3(...CALVIN_ANILLO.normal).normalize();
  const u = new THREE.Vector3(0, 0, 1).cross(n).normalize();
  const v = n.clone().cross(u).normalize();
  return { n, u, v };
})();
/** Punto del anillo al ángulo a (mundo). */
export function puntoAnillo(a: number, out = new THREE.Vector3(), r = CALVIN_ANILLO.R): THREE.Vector3 {
  const { u, v } = BASE_ANILLO;
  return out.set(...CALVIN_ANILLO.c).addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r);
}

/** ¿Choca p (con margen m) con algún granum? */
export function chocaGrana(p: V3, m = 0.05): boolean {
  for (const g of GRANA) {
    const alto = ((g.n - 1) / 2) * TILACOIDE.paso + TILACOIDE.h + m;
    if (Math.hypot(p[0] - g.x, p[2] - g.z) < g.r + m && Math.abs(p[1] - g.y) < alto) return true;
  }
  return false;
}

/** Granos de almidón (en el fondo del plato; uno bajo el ciclo de Calvin, que es de donde sale). */
export const ALMIDON: { p: V3; s: V3; giro: number }[] = [
  { p: [0.62, -1.3, 0.18], s: [0.42, 0.22, 0.3], giro: 0.2 },
  { p: [2.75, -1.05, 0.55], s: [0.36, 0.2, 0.26], giro: -0.5 },
  { p: [-2.75, -1.0, -0.55], s: [0.36, 0.2, 0.26], giro: 0.4 },
];
/** Plastoglóbulos (gotas de lípido): candidatos que no chocan con nada. */
export const PLASTOGLOBULOS: { p: V3; r: number }[] = ([
  { p: [-0.1, -0.85, 0.62], r: 0.08 }, { p: [1.3, -0.55, 0.6], r: 0.09 }, { p: [-1.42, -0.3, -0.58], r: 0.08 },
  { p: [2.6, -0.35, -0.42], r: 0.075 }, { p: [-3.05, -0.45, 0.62], r: 0.07 }, { p: [0.72, -0.85, -0.72], r: 0.085 },
  { p: [-0.2, -0.45, -0.68], r: 0.07 }, { p: [3.45, -0.4, -0.5], r: 0.065 }, { p: [-1.95, -0.6, 0.62], r: 0.075 },
  { p: [1.25, -0.9, -0.5], r: 0.07 }, { p: [-3.4, -0.3, -0.7], r: 0.06 },
] as { p: V3; r: number }[]).filter((g) => !chocaGrana(g.p, g.r + 0.04) && dentroElipsoide(g.p, ESTROMA, g.r + 0.08));

/** Mitocondria (en el citoplasma, delante y por debajo del borde del cloroplasto, sin tocarlo), cortada también
 *  por su plano medio horizontal. Va aquí y no a un costado para no ensanchar el encuadre: así el conjunto llena
 *  ~57 % del alto también en lienzos casi cuadrados (2020 con el dock abierto). */
export const MITO = { p: [1.6, -2.0, 2.85] as V3, s: [0.95, 0.44, 0.48] as V3, giro: -0.35 };
/** Plano del corte: se queda y ≤ Y_CORTE. */
export const PLANO_CLORO = new THREE.Plane(new THREE.Vector3(0, -1, 0), Y_CORTE);
const PLANOS_CUNA = [PLANO_CLORO];
/** Para el fantasma de la tapa quitada (se queda y ≥ Y_CORTE). */
const PLANO_ARRIBA = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y_CORTE);
const PLANO_MITO = new THREE.Plane(new THREE.Vector3(0, -1, 0), MITO.p[1] + 0.04);

/** ¿Choca p con algún granum, grano de almidón o el anillo? (para colocar el estroma) */
export function ocupado(p: V3, m = 0.05): boolean {
  if (chocaGrana(p, m)) return true;
  for (const a of ALMIDON) if (((p[0] - a.p[0]) / (a.s[0] + m)) ** 2 + ((p[1] - a.p[1]) / (a.s[1] + m)) ** 2 + ((p[2] - a.p[2]) / (a.s[2] + m)) ** 2 < 1) return true;
  const c = CALVIN_ANILLO.c;
  if (Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) < CALVIN_ANILLO.R + 0.12) return true;
  return false;
}

// ───────────────────────────── geometrías ─────────────────────────────

/** Invierte una geometría (normales y orden de los triángulos): la cara de dentro pasa a ser la delantera. */
export function invertir(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  n.needsUpdate = true;
  const idx = g.getIndex();
  if (idx) {
    const a = idx.array as Uint16Array | Uint32Array;
    for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
    idx.needsUpdate = true;
  } else {
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i += 3) {
      for (const at of [p, n, g.getAttribute('uv') as THREE.BufferAttribute | undefined]) {
        if (!at) continue;
        for (let k = 0; k < at.itemSize; k++) { const t = at.getComponent(i + 1, k); at.setComponent(i + 1, k, at.getComponent(i + 2, k)); at.setComponent(i + 2, k, t); }
        at.needsUpdate = true;
      }
    }
  }
  return g;
}

/** Elipsoide de semiejes (a, b, c) con normales exactas. */
export function elipsoide(a: number, b: number, c: number, seg = 80, anillos = 52): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, seg, anillos);
  g.scale(a, b, c);
  return sanearNormales(g);
}

/** Perfil de un disco de tilacoide (radio R, semigrosor h) con canto redondo: torno, normales hacia fuera. */
function perfilDisco(R: number, h: number): [number, number][] {
  const p: [number, number][] = [[0.0005, -h], [R * 0.5, -h], [R - h, -h]];
  for (let i = 1; i < 6; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 6; p.push([R - h + Math.cos(a) * h, Math.sin(a) * h]); }
  p.push([R - h, h], [R * 0.5, h], [0.0005, h]);
  return p;
}
const SEG_DISCO = 28;
/** Superficie exterior del tilacoide (radio TILACOIDE.R; las instancias lo escalan en X/Z). */
export const geoDiscoExterior = () => tornear(perfilDisco(TILACOIDE.R, TILACOIDE.h), SEG_DISCO);
/** Pared del lumen (normales hacia el lumen). */
export const geoDiscoLumen = () => invertir(tornear(perfilDisco(TILACOIDE.R - TILACOIDE.m, TILACOIDE.h - TILACOIDE.m), SEG_DISCO));

// ───────────────────────────── piezas ─────────────────────────────

export interface MatsCloro {
  externa: THREE.MeshPhysicalMaterial;
  interna: THREE.MeshPhysicalMaterial;
  tilacoide: THREE.MeshPhysicalMaterial;
  lumen: THREE.MeshPhysicalMaterial;
  traste: THREE.MeshPhysicalMaterial;
  almidon: THREE.MeshPhysicalMaterial;
  globulo: THREE.MeshPhysicalMaterial;
  fantasma: THREE.ShaderMaterial;
  mitoExt: THREE.MeshPhysicalMaterial;
  mitoInt: THREE.MeshPhysicalMaterial;
  mitoMatriz: THREE.MeshPhysicalMaterial;
  enzima: THREE.MeshPhysicalMaterial;
  pista: THREE.MeshStandardMaterial;
}

export function useMatsCloro(): MatsCloro {
  const m = useMemo<MatsCloro>(() => {
    const pl = PLANOS_CUNA;
    const k = { planos: pl } as const;
    return {
      externa: materialCorte({ ...k, color: '#5ea84c', rugosidad: 0.36, clearcoat: 0.6, sheen: 0.25, borde: '#c8f7ae', fuerzaBorde: 0.16, colorSeccion: '#3f6f34', pasoRayado: 0.045 }, 'ext'),
      interna: materialCorte({ ...k, color: '#6fae58', rugosidad: 0.62, borde: '#d6f7c0', fuerzaBorde: 0.05, colorSeccion: '#335f2c', pasoRayado: 0.045, sentido: -1 }, 'int'),
      tilacoide: materialCorte({ ...k, color: '#23763a', rugosidad: 0.44, clearcoat: 0.3, borde: '#9be688', fuerzaBorde: 0.14, colorSeccion: '#174a23', pasoRayado: 0.03 }, 'til'),
      lumen: materialCorte({ ...k, color: '#4fd1b8', rugosidad: 0.9, clearcoat: 0, borde: '#ffffff', fuerzaBorde: 0.0, colorSeccion: '#174a23', pasoRayado: 0.03, emisivo: '#4fd1b8', intensidadEmisiva: 0.6 }, 'lum'),
      traste: materialCorte({ ...k, color: '#3c9248', rugosidad: 0.45, borde: '#a5ec8f', fuerzaBorde: 0.14, colorSeccion: '#22602e', pasoRayado: 0.03, sentido: -1 }, 'tra'),
      almidon: materialCorte({ ...k, color: '#ece2c6', rugosidad: 0.38, borde: '#ffffff', fuerzaBorde: 0.16, colorSeccion: '#b9ad8a', pasoRayado: 0.05 }, 'alm'),
      globulo: materialCorte({ ...k, color: '#f0b040', rugosidad: 0.25, clearcoat: 0.6, borde: '#fff1c4', fuerzaBorde: 0.2, colorSeccion: '#c98b2a', pasoRayado: 0.03 }, 'glo'),
      fantasma: materialFantasma('#bfeaa8', 0.16, [PLANO_ARRIBA]),
      mitoExt: materialCorte({ planos: [PLANO_MITO], color: '#f0b8a0', rugosidad: 0.5, borde: '#ffe6da', fuerzaBorde: 0.35, colorSeccion: '#b07a64', pasoRayado: 0.04 }, 'mex'),
      mitoInt: materialCorte({ planos: [PLANO_MITO], color: '#e08f7a', rugosidad: 0.5, borde: '#ffd9cc', fuerzaBorde: 0.3, colorSeccion: '#9c5d4c', pasoRayado: 0.03, sentido: -1 }, 'min'),
      mitoMatriz: materialCorte({ planos: [PLANO_MITO], color: '#7a3c3a', rugosidad: 0.7, borde: '#ffb3a0', fuerzaBorde: 0.15, colorSeccion: '#5a2a28', pasoRayado: 0.04 }, 'mma'),
      enzima: materialCera({ color: '#3fae74', rugosidad: 0.5, clearcoat: 0.3, borde: '#c8ffe0', fuerzaBorde: 0.2 }, 'enz'),
      pista: new THREE.MeshStandardMaterial({ color: '#0d2a24', emissive: '#7ff0d0', emissiveIntensity: 0.55, roughness: 0.6, transparent: true, opacity: 0.85 }),
    };
  }, []);
  useEffect(() => () => { Object.values(m).forEach((x) => (x as THREE.Material).dispose()); }, [m]);
  return m;
}

/** Envoltura doble (las dos membranas como cáscaras cerradas) + la mitad delantera fantasma. */
export function Envoltura({ mats }: { mats: MatsCloro }) {
  const geos = useMemo(() => {
    const { A, B, C, t, ims } = CLORO;
    return {
      extFuera: elipsoide(A, B, C),
      extDentro: invertir(elipsoide(A - t, B - t, C - t)),
      intFuera: elipsoide(A - t - ims, B - t - ims, C - t - ims),
      intDentro: invertir(elipsoide(ESTROMA.A, ESTROMA.B, ESTROMA.C)),
      fantasma: elipsoide(A + 0.004, B + 0.004, C + 0.004, 72, 48),
    };
  }, []);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  return (
    <group userData={{ pieza: 'envoltura' }}>
      <mesh geometry={geos.extFuera} material={mats.externa} castShadow receiveShadow />
      <mesh geometry={geos.extDentro} material={mats.externa} receiveShadow />
      <mesh geometry={geos.intFuera} material={mats.interna} receiveShadow />
      <mesh geometry={geos.intDentro} material={mats.interna} receiveShadow userData={{ pieza: 'estroma' }} />
      <mesh geometry={geos.fantasma} material={mats.fantasma} renderOrder={8} raycast={() => null} />
    </group>
  );
}

/** Grana: discos (superficie exterior) y paredes del lumen de los discos cortados; el lumen se tiñe con el pH del modelo. */
export function Grana({ mats, reloj }: { mats: MatsCloro; reloj: React.MutableRefObject<RelojFoto> }) {
  const geoExt = useMemo(() => geoDiscoExterior(), []);
  const geoLum = useMemo(() => geoDiscoLumen(), []);
  useEffect(() => () => { geoExt.dispose(); geoLum.dispose(); }, [geoExt, geoLum]);
  const ext = useRef<THREE.InstancedMesh>(null);
  const lum = useRef<THREE.InstancedMesh>(null);
  const cortados = useMemo(() => DISCOS.filter((d) => d.corte), []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const fija = (im: THREE.InstancedMesh | null, lista: Disco[]) => {
      if (!im) return;
      lista.forEach((d, i) => {
        const s = d.r / TILACOIDE.R;
        o.position.set(...d.c); o.rotation.set(0, (d.g * 1.7 + d.k * 0.6) % (Math.PI * 2), 0); o.scale.set(s, 1, s);
        o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
    };
    fija(ext.current, DISCOS);
    fija(lum.current, cortados);
  }, [cortados]);
  // pH del lumen → color (cada cuadro, del reloj)
  const col = useMemo(() => new THREE.Color(), []);
  const ultimo = useRef(-1);
  useFrame(() => {
    const ph = reloj.current.ph;
    if (Math.abs(ph - ultimo.current) < 0.005) return;
    ultimo.current = ph;
    colorPH(ph, col);
    mats.lumen.color.copy(col).multiplyScalar(0.12);
    mats.lumen.emissive.copy(col);
  });
  return (
    <group userData={{ pieza: 'granum' }}>
      <instancedMesh ref={ext} args={[geoExt, mats.tilacoide, DISCOS.length]} castShadow receiveShadow />
      <instancedMesh ref={lum} args={[geoLum, mats.lumen, cortados.length]} userData={{ pieza: 'lumen' }} />
    </group>
  );
}

/** Lamelas del estroma (trastes) entre grana vecinos, a distintas alturas (en la realidad, helicoidales). */
export function Trastes({ mats }: { mats: MatsCloro }) {
  const lista = useMemo(() => {
    // [granum a, granum b, altura en a, altura en b] (fracción de la pila: 0 abajo, 1 arriba)
    const pares: [number, number, number, number][] = [
      // a lo largo de cada fila
      [0, 1, 0.7, 0.45], [1, 2, 0.8, 0.6], [2, 3, 0.4, 0.75], [3, 4, 0.65, 0.5],
      [5, 6, 0.7, 0.55], [6, 7, 0.85, 0.7], [8, 9, 0.6, 0.75], [6, 7, 0.3, 0.35],
      [10, 11, 0.75, 0.6], [11, 12, 0.5, 0.8], [12, 13, 0.7, 0.45], [13, 14, 0.8, 0.6],
      // entre filas (al tresbolillo)
      [0, 5, 0.5, 0.6], [0, 6, 0.85, 0.8], [1, 6, 0.35, 0.4], [1, 7, 0.6, 0.85], [2, 7, 0.8, 0.5],
      [3, 8, 0.5, 0.8], [4, 8, 0.8, 0.6], [4, 9, 0.4, 0.5],
      [5, 10, 0.8, 0.7], [6, 10, 0.45, 0.4], [6, 11, 0.75, 0.85], [7, 11, 0.55, 0.5], [7, 12, 0.8, 0.75],
      [8, 13, 0.75, 0.8], [8, 13, 0.3, 0.35], [9, 13, 0.6, 0.55], [9, 14, 0.8, 0.7],
    ];
    const o = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (const [a, b, fa, fb] of pares) {
      const ga = GRANA[a], gb = GRANA[b];
      if (!ga || !gb) continue;
      const ca = centroDisco(ga, Math.round(fa * (ga.n - 1))), cb = centroDisco(gb, Math.round(fb * (gb.n - 1)));
      const d = new THREE.Vector3(cb[0] - ca[0], cb[1] - ca[1], cb[2] - ca[2]);
      const hor = Math.hypot(d.x, d.z);
      // de borde a borde
      const ux = d.x / hor, uz = d.z / hor;
      const p0 = new THREE.Vector3(ca[0] + ux * ga.r * 0.92, ca[1], ca[2] + uz * ga.r * 0.92);
      const p1 = new THREE.Vector3(cb[0] - ux * gb.r * 0.92, cb[1], cb[2] - uz * gb.r * 0.92);
      const v = p1.clone().sub(p0);
      const L = v.length();
      o.position.copy(p0).addScaledVector(v, 0.5);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), v.normalize());
      o.scale.set(L + 0.08, 1, 1);
      o.updateMatrix();
      out.push(o.matrix.clone());
    }
    return out;
  }, []);
  const geo = useMemo(() => cajaRedondeada(1, 0.05, 0.26, 0.022, 2), []);
  const im = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = im.current; if (!m) return;
    lista.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [lista]);
  return <instancedMesh ref={im} args={[geo, mats.traste, lista.length]} castShadow receiveShadow userData={{ pieza: 'traste' }} />;
}

/** Almidón y plastoglóbulos. */
export function Inclusiones({ mats }: { mats: MatsCloro }) {
  const geoE = useMemo(() => elipsoide(1, 1, 1, 40, 28), []);
  useEffect(() => () => geoE.dispose(), [geoE]);
  return (
    <group>
      {ALMIDON.map((a, i) => (
        <mesh key={i} geometry={geoE} material={mats.almidon} position={a.p} scale={a.s} rotation={[0, a.giro, 0.15]} castShadow receiveShadow userData={{ pieza: 'almidon' }} />
      ))}
      {PLASTOGLOBULOS.map((g, i) => (
        <mesh key={i} geometry={geoE} material={mats.globulo} position={g.p} scale={g.r} userData={{ pieza: 'globulo' }} />
      ))}
    </group>
  );
}

/**
 * Estroma: Rubisco (la proteína más abundante de la Tierra) y ribosomas 70S como puntitos
 * con agitación térmica esquemática (en el sombreador: sin coste por cuadro en la CPU).
 */
export function Estroma({ alta, reloj }: { alta: boolean; reloj: React.MutableRefObject<RelojFoto> }) {
  const n = alta ? 340 : 220;
  const datos = useMemo(() => {
    let s = 7711;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const pos: V3[] = [], col: THREE.Color[] = [], tam: number[] = [];
    // tonos cercanos al del estroma (sin puntos claros que centelleen)
    const cR = new THREE.Color('#3f8a4c'), cR2 = new THREE.Color('#5d8f3e'), cB = new THREE.Color('#6a5c9e');
    let intentos = 0;
    while (pos.length < n && intentos < n * 60) {
      intentos++;
      const p: V3 = [(rnd() * 2 - 1) * ESTROMA.A, (rnd() * 2 - 1) * ESTROMA.B, (rnd() * 2 - 1) * ESTROMA.C];
      // sólo donde se ve: junto a las caras de la cuña
      const cerca = (p[2] < 0 && p[2] > -1.9 && p[1] > Y_CORTE - 0.1) || (p[1] < Y_CORTE && p[2] > -0.4);
      if (!cerca || !enPieza(p) || !dentroElipsoide(p, ESTROMA, 0.08) || ocupado(p, 0.05)) continue;
      pos.push(p);
      const ribosoma = rnd() < 0.16;
      col.push((ribosoma ? cB : rnd() < 0.5 ? cR : cR2).clone().multiplyScalar(0.9 + rnd() * 0.2));
      tam.push(ribosoma ? 0.05 : 0.038 + rnd() * 0.016);
    }
    return { pos, col, tam };
  }, [n]);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const uT = useMemo(() => ({ value: 0 }), []);
  const mat = useMemo(() => {
    const m = materialCera({ vertexColors: false, rugosidad: 0.7, fuerzaBorde: 0.06, sheen: 0.2, clearcoat: 0 }, 'estroma');
    const previo = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      previo.call(m, sh, r);
      sh.uniforms.uT = uT;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uT;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float fi = float(gl_InstanceID);
          vec3 agit = 0.035 * vec3(sin(uT * 1.7 + fi * 12.9898), sin(uT * 1.31 + fi * 78.233), sin(uT * 1.13 + fi * 37.719));
          transformed += agit / max(0.02, length(instanceMatrix[0].xyz));`);
    };
    m.customProgramCacheKey = () => 'bio04estroma-agit';
    return m;
  }, [uT]);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const im = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = im.current; if (!m) return;
    const o = new THREE.Object3D();
    datos.pos.forEach((p, i) => { o.position.set(...p); o.scale.setScalar(datos.tam[i]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, datos.col[i]); });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [datos]);
  useFrame(() => { uT.value = reloj.current.tAnim; });
  return <instancedMesh ref={im} args={[geo, mat, datos.pos.length]} raycast={() => null} frustumCulled={false} />;
}

/** El anillo del ciclo de Calvin (pista) y la Rubisco en la estación de fijación. */
export function AnilloCalvin({ mats }: { mats: MatsCloro }) {
  const geoPista = useMemo(() => {
    const g = new THREE.TorusGeometry(CALVIN_ANILLO.R, 0.014, 10, 96);
    return g;
  }, []);
  useEffect(() => () => geoPista.dispose(), [geoPista]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), BASE_ANILLO.n), []);
  // Rubisco (L8S8): un cubo de ocho grandes y ocho pequeñas, en la estación de fijación
  const rubisco = useMemo(() => {
    const c = puntoAnillo(ESTACIONES.fijacion, new THREE.Vector3(), CALVIN_ANILLO.R + 0.16);
    const out: { p: V3; r: number }[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) out.push({ p: [c.x + sx * 0.05, c.y + sy * 0.05, c.z + sz * 0.05], r: 0.055 });
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; out.push({ p: [c.x + Math.cos(a) * 0.1, c.y + 0.1, c.z + Math.sin(a) * 0.1], r: 0.032 }); out.push({ p: [c.x + Math.cos(a) * 0.1, c.y - 0.1, c.z + Math.sin(a) * 0.1], r: 0.032 }); }
    return out;
  }, []);
  const otras = useMemo(() => [ESTACIONES.reduccion, ESTACIONES.regeneracion].map((a) => puntoAnillo(a, new THREE.Vector3(), CALVIN_ANILLO.R + 0.12)), []);
  return (
    <group userData={{ pieza: 'calvin' }}>
      <mesh geometry={geoPista} material={mats.pista} position={CALVIN_ANILLO.c} quaternion={q} />
      <group userData={{ pieza: 'rubisco' }}>
        {rubisco.map((b, i) => <mesh key={i} position={b.p} scale={b.r} material={mats.enzima} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}
      </group>
      {otras.map((p, i) => (
        <mesh key={i} position={p} scale={0.075} material={mats.enzima}><icosahedronGeometry args={[1, 1]} /></mesh>
      ))}
    </group>
  );
}

/** Mitocondria cortada: dos membranas y crestas. Respira el O₂ que le llega. */
export function Mitocondria({ mats }: { mats: MatsCloro }) {
  const geos = useMemo(() => {
    const [a, b, c] = MITO.s;
    const t = 0.05, ims = 0.05;
    const crestas: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      const x = -a * 0.62 + (i * a * 1.24) / 5;
      const k = Math.sqrt(Math.max(0, 1 - (x / (a - 0.12)) ** 2));
      const g = cajaRedondeada(0.06, (b - 0.12) * 2 * k * 0.78, (c - 0.12) * 2 * k * 0.9, 0.028, 2).clone();
      g.translate(x, (i % 2 ? 1 : -1) * (b - 0.12) * k * 0.2, 0);
      crestas.push(g);
    }
    return {
      extF: elipsoide(a, b, c, 64, 40), extD: invertir(elipsoide(a - t, b - t, c - t, 64, 40)),
      intF: elipsoide(a - t - ims, b - t - ims, c - t - ims, 64, 40), intD: invertir(elipsoide(a - 2 * t - ims, b - 2 * t - ims, c - 2 * t - ims, 64, 40)),
      crestas,
    };
  }, []);
  useEffect(() => () => { const { crestas, ...resto } = geos; Object.values(resto).forEach((g) => g.dispose()); crestas.forEach((g) => g.dispose()); }, [geos]);
  return (
    <group position={MITO.p} rotation={[0, MITO.giro, 0]} userData={{ pieza: 'mitocondria' }}>
      <mesh geometry={geos.extF} material={mats.mitoExt} castShadow receiveShadow />
      <mesh geometry={geos.extD} material={mats.mitoExt} />
      <mesh geometry={geos.intF} material={mats.mitoInt} />
      <mesh geometry={geos.intD} material={mats.mitoMatriz} />
      {geos.crestas.map((g, i) => <mesh key={i} geometry={g} material={mats.mitoInt} castShadow />)}
    </group>
  );
}

/** Puntos de la caja de encuadre de la vista del cloroplasto. */
export function puntosCloroplasto(): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  // la superficie del elipsoide (muestreo grueso): la cuña quitada no cambia la silueta
  for (let i = 0; i < 24; i++) for (let j = 1; j < 12; j++) {
    const a = (i / 24) * Math.PI * 2, b = (j / 12) * Math.PI;
    P.push(new THREE.Vector3(Math.cos(a) * Math.sin(b) * CLORO.A, Math.cos(b) * CLORO.B, Math.sin(a) * Math.sin(b) * CLORO.C));
  }
  const m = new THREE.Vector3(...MITO.p);
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.push(m.clone().add(new THREE.Vector3(dx * MITO.s[0] * 0.9, dy * MITO.s[1], 0)));
  return P;
}
