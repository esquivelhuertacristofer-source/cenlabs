'use client';
/**
 * fis01/piezas.tsx — piezas del polígono de tiro (1 u = 1 m), sin lógica de simulación.
 *
 *  · Cañón neumático en montaje de SECTOR: el tubo pivota en la boca (muñones en la boca), así
 *    el punto de salida es el mismo a cualquier ángulo —el (0, y₀) del modelo— y la culata barre
 *    un cuarto de círculo por debajo, guiada por una ranura en arco con su perno de apriete. Un
 *    cuadrante de latón grabado lee el ángulo. Dibujado ×K (K = 3) con el balín, para verse.
 *  · Explanada hundida 1,6 m: la boca queda a ras del campo, así el disparo del banco sale y cae
 *    a la misma altura (R = v₀²·sen 2θ/g exacto). Muro de contención con tronera para la boca.
 *  · Pista de concreto con regla de acero grabada (x), pantalla móvil con escala (y), torre de
 *    celosía, muro de paneles con mástil de altura, diana pintada con el dron posado, manga de
 *    viento, colinas y arboleda lejanas.
 *  · `Cuadrante` (cuadrante de papel 0°–90°) se conserva: lo usa el plano inclinado (fis02).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexturaLienzo, useMateriales, familiaTexto } from '../_kit';
import { texCuadrante, texRegla, texPantalla, type MatsTiro } from './materiales';

type V3 = [number, number, number];

/** Agrandamiento del cañón, del balín y del dron (se declara en «Modelo»): a ×1 el balín de
 *  12 cm sería un punto sobre una parábola de 20 m y la estela no se leería. */
export const K = 5;
/** Radio dibujado del balín (Ø 12 cm reales × K). */
export const R_BALIN = 0.06 * K;
/** Medidas del cañón en m reales (antes de ×K). */
export const CANON = { L: 0.42, rTubo: 0.075, rAlma: 0.062, zPlaca: 0.135, rSector: 0.46, rRanura: 0.31, yBase: -0.5 };
/** De la boca a la cara de apoyo de las patas del montaje, ya ×K (m). */
export const ALTO_MONTAJE = (-CANON.yBase + 0.035) * K;
/** Desnivel de la explanada del cañón (m): el montaje apoya en su piso y la boca queda a ras del campo. */
export const DESNIVEL = ALTO_MONTAJE;
/** La explanada ocupa x ∈ [X_TERRAZA, 0] y z ∈ [Z_TERRAZA[0], Z_TERRAZA[1]]. */
export const X_TERRAZA = -10;
export const Z_TERRAZA: [number, number] = [-7.5, 22];
/** Largo de la pista y de la regla (m). */
export const LARGO_PISTA = 140;
/** Tronera del muro de contención frente a la boca: medio ancho y fondo (m). */
const TRONERA = { z: (CANON.zPlaca + 0.075) * K, fondo: 0.5 };

// ───────────────────────────── geometría ─────────────────────────────

/** Junta geometrías en una no indexada (position, normal, uv). Libera las de entrada. */
export function fundir(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const planas = gs.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of planas) total += g.getAttribute('position').count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of planas) {
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const p = g.getAttribute('position') as THREE.BufferAttribute, n = g.getAttribute('normal') as THREE.BufferAttribute;
    const u = g.getAttribute('uv') as THREE.BufferAttribute | undefined;
    for (let i = 0; i < p.count; i++) {
      pos[(o + i) * 3] = p.getX(i); pos[(o + i) * 3 + 1] = p.getY(i); pos[(o + i) * 3 + 2] = p.getZ(i);
      nor[(o + i) * 3] = n.getX(i); nor[(o + i) * 3 + 1] = n.getY(i); nor[(o + i) * 3 + 2] = n.getZ(i);
      if (u) { uv[(o + i) * 2] = u.getX(i); uv[(o + i) * 2 + 1] = u.getY(i); }
    }
    o += p.count;
  }
  planas.forEach((g, k) => { if (g !== gs[k]) g.dispose(); });
  gs.forEach((g) => g.dispose());
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  r.computeBoundingSphere();
  return r;
}

/** Caja con UV en metros (cada cara: u, v = sus medidas / tile). */
export function cajaUV(w: number, h: number, d: number, tile: [number, number] = [1, 1]): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  // orden de caras de BoxGeometry: +x, −x, +y, −y, +z, −z
  const caras: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, (uv.getX(k) * caras[f][0]) / tile[0], (uv.getY(k) * caras[f][1]) / tile[1]);
  }
  uv.needsUpdate = true;
  return g;
}

function caja(w: number, h: number, d: number, x: number, y: number, z: number, tile?: [number, number]) {
  const g = tile ? cajaUV(w, h, d, tile) : new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}
function cilY(r0: number, r1: number, h: number, segs: number, x: number, y: number, z: number) {
  const g = new THREE.CylinderGeometry(r1, r0, h, segs);
  g.translate(x, y, z);
  return g;
}
/** Cilindro a lo largo de z entre z0 y z1. */
function cilZ(r: number, z0: number, z1: number, segs: number, x = 0, y = 0) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), segs);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, (z0 + z1) / 2);
  return g;
}

function useGeo<T extends THREE.BufferGeometry>(crear: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const g = useMemo(crear, deps);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

/** Malla con sombras recibidas y, si se pide, proyectadas. */
function M({ g, m, p, r, s, sombra = true, pieza, ...resto }: {
  g: THREE.BufferGeometry; m: THREE.Material; p?: V3; r?: V3; s?: V3 | number; sombra?: boolean; pieza?: string;
} & Record<string, unknown>) {
  return <mesh geometry={g} material={m} position={p} rotation={r} scale={s as V3} castShadow={sombra} receiveShadow userData={pieza ? { pieza } : undefined} {...resto} />;
}

/** Torno alrededor de x (perfil [r, x]). */
function tornoX(perfil: [number, number][], segs: number): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(perfil.map(([r, h]) => new THREE.Vector2(Math.max(0, r), h)), segs);
  g.rotateZ(-Math.PI / 2);   // eje y del torno → +x
  return g;
}

// ───────────────────────────── cañón neumático ─────────────────────────────

/** Perfil del tubo [r, x] desde el fondo del alma visible hasta la culata (m reales). */
const PERFIL_TUBO: [number, number][] = [
  [0, -0.06], [0.062, -0.06], [0.062, 0], [0.084, 0], [0.09, -0.006], [0.09, -0.032], [0.077, -0.04],
  [0.075, -0.05], [0.075, -0.292], [0.082, -0.3], [0.097, -0.3], [0.097, -0.334], [0, -0.334],
];
const PERFIL_VALVULA: [number, number][] = [
  [0, -0.334], [0.086, -0.334], [0.088, -0.338], [0.088, -0.4], [0.07, -0.41], [0.05, -0.41], [0.05, -0.425], [0, -0.425],
];

/** Placa lateral del sector: cuarto de disco con buje, ranura en arco y aligeramientos. */
function formaPlaca(): THREE.Shape {
  const { rSector, rRanura } = CANON;
  const s = new THREE.Shape();
  const rb = 0.075, frente = 0.075;
  s.moveTo(frente, 0);
  s.absarc(0, 0, rb, 0, Math.PI, false);            // buje por arriba
  s.lineTo(-rSector, 0);
  s.absarc(0, 0, rSector, Math.PI, Math.PI * 1.5, false);
  s.lineTo(frente, -rSector);
  s.lineTo(frente, 0);
  // ranura en arco del perno (de 1° a 89° de elevación)
  const ranura = new THREE.Path();
  const a0 = Math.PI + 0.01, a1 = Math.PI * 1.5 - 0.01, w = 0.02;
  ranura.absarc(0, 0, rRanura + w, a0, a1, false);
  ranura.absarc(Math.cos(a1) * rRanura, Math.sin(a1) * rRanura, w, a1, a1 + Math.PI, false);
  ranura.absarc(0, 0, rRanura - w, a1, a0, true);
  ranura.absarc(Math.cos(a0) * rRanura, Math.sin(a0) * rRanura, w, a0 + Math.PI, a0 + 2 * Math.PI, false);
  s.holes.push(ranura);
  // aligeramientos
  for (const a of [1.12, 1.38]) {
    const h = new THREE.Path();
    h.absarc(Math.cos(Math.PI * a) * 0.175, Math.sin(Math.PI * a) * 0.175, 0.045, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  return s;
}

/**
 * Cañón neumático (origen = boca = eje de muñones = punto de salida). `angulo` en grados.
 * Se dibuja en m reales: el grupo se escala ×K desde fuera.
 */
export function Canon({ mats, angulo, retroceso, matCuadrante }: {
  mats: MatsTiro; angulo: React.MutableRefObject<number>; retroceso: React.MutableRefObject<number>; matCuadrante: THREE.Material;
}) {
  const { zPlaca, rRanura, yBase } = CANON;
  const tubo = useGeo(() => tornoX(PERFIL_TUBO, 48), []);
  const valvula = useGeo(() => {
    const v = tornoX(PERFIL_VALVULA, 36);
    const racor = cilY(0.018, 0.018, 0.06, 16, -0.37, -0.115, 0);   // racor de la manguera, hacia abajo
    return fundir([v, racor]);
  }, []);
  // collar de muñones sobre la corona de la boca: el eje de giro pasa por la boca
  const collar = useGeo(() => fundir([
    tornoX([[0.09, -0.003], [0.1, -0.003], [0.106, -0.009], [0.106, -0.046], [0.1, -0.052], [0.09, -0.052]], 40),
    cilZ(0.028, -zPlaca - 0.03, zPlaca + 0.03, 24, -0.027, 0),     // muñones
  ]), []);
  const perno = useGeo(() => fundir([
    cilZ(0.016, -zPlaca - 0.04, zPlaca + 0.04, 16, -rRanura, 0),
    cilZ(0.042, zPlaca + 0.03, zPlaca + 0.062, 28, -rRanura, 0),   // pomo delantero
    cilZ(0.042, -zPlaca - 0.062, -zPlaca - 0.03, 28, -rRanura, 0), // pomo trasero
    caja(0.05, 0.03, 0.2, -rRanura, 0.06, 0),                      // abrazadera sobre el tubo
  ]), []);
  const aguja = useGeo(() => caja(0.13, 0.008, 0.004, -0.415, 0, zPlaca + 0.02), []);
  const placas = useGeo(() => {
    const s = formaPlaca();
    const mk = (z0: number) => {
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false, curveSegments: 40 });
      g.translate(0, 0, z0);
      return g;
    };
    return fundir([mk(zPlaca - 0.0125), mk(-zPlaca - 0.0125)]);
  }, []);
  const bujes = useGeo(() => fundir([
    cilZ(0.06, zPlaca + 0.012, zPlaca + 0.04, 32, 0, 0),
    cilZ(0.06, -zPlaca - 0.04, -zPlaca - 0.012, 32, 0, 0),
  ]), []);
  const base = useGeo(() => fundir([
    caja(0.62, 0.035, 0.42, -0.2, yBase + 0.0175, 0),
    caja(0.6, 0.06, 0.03, -0.2, yBase + 0.065, zPlaca + 0.03),    // ángulos de anclaje de las placas
    caja(0.6, 0.06, 0.03, -0.2, yBase + 0.065, -zPlaca - 0.03),
    ...[[-0.48, 0.17], [0.08, 0.17], [-0.48, -0.17], [0.08, -0.17]].map(([x, z]) => cilY(0.025, 0.02, 0.035, 16, x, yBase - 0.0175, z)),
  ]), []);
  const escala = useGeo(() => {
    const g = new THREE.RingGeometry(0.355, 0.455, 72, 1, Math.PI, Math.PI / 2);
    g.translate(0, 0, zPlaca + 0.0135);
    return g;
  }, []);
  const giro = useRef<THREE.Group>(null);
  const corredera = useRef<THREE.Group>(null);
  useFrame(() => {
    if (giro.current) giro.current.rotation.z = (angulo.current * Math.PI) / 180;
    if (corredera.current) corredera.current.position.x = -retroceso.current;
  });
  return (
    <group userData={{ pieza: 'canon' }}>
      <M g={placas} m={mats.fundicion} pieza="sector" />
      <M g={bujes} m={mats.anodizado} pieza="sector" />
      <M g={base} m={mats.anodizado} pieza="sector" />
      <M g={escala} m={matCuadrante} sombra={false} pieza="cuadrante" />
      <group ref={giro}>
        <group ref={corredera}>
          <M g={tubo} m={mats.aceroPulido} pieza="canon" />
          <M g={valvula} m={mats.anodizado} pieza="canon" />
        </group>
        <M g={collar} m={mats.anodizado} pieza="canon" />
        <M g={perno} m={mats.anodizado} pieza="sector" />
        <M g={aguja} m={mats.tanque} sombra={false} pieza="cuadrante" />
      </group>
    </group>
  );
}

/** Material del cuadrante grabado (latón). */
export function useMatCuadrante(calidad: 'alta' | 'media') {
  const tex = useMemo(() => texCuadrante(0.355, 0.455), []);
  const m = useMemo(() => {
    const p = { map: tex ?? undefined, metalness: 0.75, roughness: 0.34, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
    return calidad === 'alta' ? new THREE.MeshPhysicalMaterial({ ...p, clearcoat: 0.3, clearcoatRoughness: 0.3 }) : new THREE.MeshStandardMaterial(p);
  }, [tex, calidad]);
  useEffect(() => () => { m.dispose(); }, [m]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  return m;
}

/** Calderín de aire con manómetro y la manguera hasta la válvula (coordenadas del mundo). */
const CALDERIN = { x: -5.4, z: -2.3 };
export function Calderin({ mats, valvula }: { mats: MatsTiro; valvula: THREE.Vector3 | null }) {
  const { x, z } = CALDERIN, yS = -DESNIVEL;
  const cuerpo = useGeo(() => {
    const g = new THREE.CapsuleGeometry(0.34, 1.3, 8, 28);
    g.rotateZ(Math.PI / 2);
    g.translate(x, yS + 0.62, z);
    return g;
  }, []);
  const patas = useGeo(() => fundir([
    caja(0.12, 0.3, 0.6, x - 0.55, yS + 0.15, z), caja(0.12, 0.3, 0.6, x + 0.55, yS + 0.15, z),
    cilY(0.05, 0.05, 0.22, 16, x + 0.25, yS + 1.05, z), cilY(0.03, 0.03, 0.16, 12, x - 0.2, yS + 1.02, z),
  ]), []);
  const esfera = useGeo(() => { const g = cilZ(0.13, 0, 0.06, 32, 0, 0); g.translate(x + 0.25, yS + 1.26, z + 0.02); return g; }, []);
  const vidrio = useGeo(() => { const g = new THREE.CircleGeometry(0.115, 32); g.translate(x + 0.25, yS + 1.26, z + 0.081); return g; }, []);
  const esferaTex = useTexturaLienzo(256, 256, (g, w) => {
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, w);
    g.strokeStyle = '#222'; g.lineWidth = 3;
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI * 0.75 + (i / 20) * Math.PI * 1.5;
      const r0 = i % 5 === 0 ? 86 : 96;
      g.beginPath(); g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); g.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108); g.stroke();
    }
    g.fillStyle = '#c62828'; g.fillRect(122, 40, 12, 8);
    g.save(); g.translate(128, 128); g.rotate(Math.PI * 0.75 + 1.05 * Math.PI * 1.5); g.fillStyle = '#111'; g.fillRect(0, -3, 92, 6); g.restore();
    g.beginPath(); g.fillStyle = '#111'; g.arc(128, 128, 9, 0, Math.PI * 2); g.fill();
  }, []);
  const matEsfera = useMemo(() => new THREE.MeshStandardMaterial({ map: esferaTex ?? undefined, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), [esferaTex]);
  useEffect(() => () => matEsfera.dispose(), [matEsfera]);
  // manguera: del racor de la válvula (se mueve con el ángulo) a la salida del calderín
  const manguera = useMemo(() => {
    if (!valvula) return null;
    const { x, z } = CALDERIN, yS = -DESNIVEL;
    const a = valvula.clone(), b = new THREE.Vector3(x - 0.2, yS + 1.1, z);
    const m1 = new THREE.Vector3(a.x - 0.2, Math.min(a.y, yS + 0.2) - 0.1, a.z - 0.3);
    const m2 = new THREE.Vector3(b.x + 0.4, yS + 0.15, b.z + 0.1);
    const c = new THREE.CatmullRomCurve3([a, m1, m2, b], false, 'centripetal');
    return new THREE.TubeGeometry(c, 48, 0.05, 10, false);
  }, [valvula]);
  useEffect(() => () => { manguera?.dispose(); }, [manguera]);
  return (
    <group userData={{ pieza: 'calderin' }}>
      <M g={cuerpo} m={mats.tanque} pieza="calderin" />
      <M g={patas} m={mats.anodizado} pieza="calderin" />
      <M g={esfera} m={mats.aluminio} pieza="calderin" />
      <mesh geometry={vidrio} material={matEsfera} userData={{ pieza: 'calderin' }} />
      {manguera && <mesh geometry={manguera} material={mats.goma} castShadow receiveShadow userData={{ pieza: 'manguera' }} />}
    </group>
  );
}

// ───────────────────────────── terreno ─────────────────────────────

/** Campo, explanada hundida con su muro de contención y tronera, pista de concreto y regla. */
export function Terreno({ mats, matSuelo, regla = true }: { mats: MatsTiro; matSuelo: THREE.Material; regla?: boolean }) {
  const [z0, z1] = Z_TERRAZA;
  const campo = useGeo(() => {
    const s = new THREE.Shape();
    const L = 2800;   // hasta donde la niebla ya lo funde con el horizonte
    s.moveTo(-L, -L); s.lineTo(L, -L); s.lineTo(L, L); s.lineTo(-L, L); s.lineTo(-L, -L);
    const h = new THREE.Path();
    // el hueco de la explanada (en coordenadas de la forma: x, y = −z)
    h.moveTo(X_TERRAZA, -z1); h.lineTo(X_TERRAZA, -z0); h.lineTo(0, -z0); h.lineTo(0, -z1); h.lineTo(X_TERRAZA, -z1);
    s.holes.push(h);
    const g = new THREE.ShapeGeometry(s, 1);
    g.rotateX(-Math.PI / 2);
    // UV en metros (baldosa de 10 m)
    const p = g.getAttribute('position') as THREE.BufferAttribute, uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 10, p.getZ(i) / 10);
    return g;
  }, []);
  const piso = useGeo(() => {
    const g = new THREE.PlaneGeometry(-X_TERRAZA, z1 - z0);
    g.rotateX(-Math.PI / 2);
    g.translate(X_TERRAZA / 2, -DESNIVEL, (z0 + z1) / 2);
    const p = g.getAttribute('position') as THREE.BufferAttribute, uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 5, p.getZ(i) / 5);
    return g;
  }, []);
  // muro de contención (0,3 m) y albardilla; tronera de 1,3 m × 0,35 m en la boca del cañón
  const muros = useGeo(() => {
    const e = 0.3, hM = DESNIVEL, yc = -hM / 2, t: [number, number] = [5, 5];
    const tz = TRONERA.z, tPro = TRONERA.fondo;
    return fundir([
      // frente al cañón (cara en x = 0), partido por la tronera
      caja(e, hM, z1 - tz, e / 2, yc, (tz + z1) / 2, t),
      caja(e, hM, tz - z0, e / 2, yc, (z0 - tz) / 2, t),
      caja(e, hM - tPro, 2 * tz, e / 2, yc - tPro / 2, 0, t),
      // fondo y laterales
      caja(e, hM, z1 - z0 + 2 * e, X_TERRAZA - e / 2, yc, (z0 + z1) / 2, t),
      caja(-X_TERRAZA, hM, e, X_TERRAZA / 2, yc, z0 - e / 2, t),
      caja(-X_TERRAZA, hM, e, X_TERRAZA / 2, yc, z1 + e / 2, t),
    ]);
  }, []);
  const albardilla = useGeo(() => {
    const tz = TRONERA.z;
    return fundir([
      caja(0.42, 0.08, z1 - tz, 0.15, 0.01, (tz + z1) / 2), caja(0.42, 0.08, tz - z0, 0.15, 0.01, (z0 - tz) / 2),
      caja(0.42, 0.08, z1 - z0 + 0.6, X_TERRAZA - 0.15, 0.01, (z0 + z1) / 2),
      caja(-X_TERRAZA, 0.08, 0.42, X_TERRAZA / 2, 0.01, z0 - 0.15), caja(-X_TERRAZA, 0.08, 0.42, X_TERRAZA / 2, 0.01, z1 + 0.15),
    ]);
  }, []);
  const pista = useGeo(() => {
    const g = cajaUV(LARGO_PISTA, 0.06, 6.4, [5, 5]);
    g.translate(0.3 + LARGO_PISTA / 2, -0.01, 0);
    return g;
  }, []);
  const texR = useMemo(() => texRegla(LARGO_PISTA), []);
  useEffect(() => () => { texR?.dispose(); }, [texR]);
  const matRegla = useMemo(() => {
    const m = (mats.regla as THREE.MeshStandardMaterial).clone();
    m.map = texR; m.needsUpdate = true;
    return m;
  }, [mats.regla, texR]);
  useEffect(() => () => matRegla.dispose(), [matRegla]);
  // regla junto a la línea de sombras (z = 0), del lado de la cámara: las rayas tocan la línea
  const geoRegla = useGeo(() => {
    const x0 = 0.3, x1 = LARGO_PISTA, ancho = 0.8, zc = 0.32 + ancho / 2;
    const g = new THREE.PlaneGeometry(x1 - x0, ancho);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0.022, zc);
    const p = g.getAttribute('position') as THREE.BufferAttribute, uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / LARGO_PISTA, p.getZ(i) > zc ? 0 : 1);
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={campo} material={matSuelo} receiveShadow userData={{ pieza: 'campo' }} />
      <mesh geometry={piso} material={mats.terraza} receiveShadow userData={{ pieza: 'explanada' }} />
      <M g={muros} m={mats.muroConcreto} pieza="explanada" />
      <M g={albardilla} m={mats.albardilla} pieza="explanada" />
      <mesh geometry={pista} material={mats.concreto} receiveShadow userData={{ pieza: 'pista' }} />
      {regla && <mesh geometry={geoRegla} material={matRegla} receiveShadow userData={{ pieza: 'regla' }} />}
    </group>
  );
}

// ───────────────────────────── lámpara estroboscópica ─────────────────────────────

/** Cilindro entre dos puntos (para patas y barras de una sola pieza). */
function palo(a: V3, b: V3, r: number, segs = 10): THREE.BufferGeometry {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const g = new THREE.CylinderGeometry(r, r, d.length(), segs);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return g;
}

/**
 * Lámpara estroboscópica en trípode: la fuente de los destellos que «congelan» el balín. La
 * lente (`matLente`, emisiva) la hace destellar la escena en cada instante t = k·Δt.
 * `giro` orienta la lente (y) y `cabeceo` la inclina hacia arriba.
 */
export function Lampara({ mats, matLente, position, giro, cabeceo }: { mats: MatsTiro; matLente: THREE.Material; position: V3; giro: number; cabeceo: number }) {
  const tripode = useGeo(() => fundir([
    ...[0, 1, 2].map((k) => { const a = (k * 2 * Math.PI) / 3 + 0.4; return palo([0, 1.05, 0], [Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62], 0.022, 8); }),
    palo([0, 0.95, 0], [0, 1.55, 0], 0.03, 12),
    ...[0, 1, 2].map((k) => { const a = (k * 2 * Math.PI) / 3 + 0.4; return cilY(0.04, 0.04, 0.03, 10, Math.cos(a) * 0.62, 0.015, Math.sin(a) * 0.62); }),
  ]), []);
  const cabeza = useGeo(() => fundir([
    caja(0.34, 0.26, 0.3, 0, 0, -0.02),
    cilZ(0.15, 0.13, 0.2, 32, 0, 0),                       // reflector
    caja(0.04, 0.06, 0.16, 0, 0.16, -0.02),                // asa
    caja(0.26, 0.03, 0.03, 0, 0.19, -0.02),
  ]), []);
  const lente = useGeo(() => { const g = new THREE.CircleGeometry(0.125, 32); g.translate(0, 0, 0.202); return g; }, []);
  return (
    <group position={position} rotation={[0, giro, 0]} userData={{ pieza: 'lampara' }}>
      <M g={tripode} m={mats.anodizado} pieza="lampara" />
      <group position={[0, 1.66, 0]} rotation={[-cabeceo, 0, 0]}>
        <M g={cabeza} m={mats.anodizado} pieza="lampara" />
        <mesh geometry={lente} material={matLente} userData={{ pieza: 'lampara' }} />
      </group>
    </group>
  );
}

// ───────────────────────────── pantalla de sombras ─────────────────────────────

/** Ancho de la pantalla (m) y giro hacia la cámara (rad): la sombra cae en (x, y, 0) igual. */
export const PANTALLA = { ancho: 2.2, giro: (48 * Math.PI) / 180 };
/** Altura del borde inferior del tablero sobre el suelo (m). */
const BASE_TABLERO = 0.06;

/**
 * Pantalla móvil de proyección: tablero blanco con escala de alturas grabada, marco de aluminio
 * y bastidor con ruedas. Está centrada en z = 0: con luz horizontal paralela a x, la sombra del
 * balín cae en (xPantalla, y, 0) sea cual sea su giro.
 */
export function Pantalla({ mats, alto, grupo }: { mats: MatsTiro; alto: number; grupo: React.RefObject<THREE.Group | null> }) {
  const w = PANTALLA.ancho;
  const tex = useMemo(() => texPantalla(alto, w, BASE_TABLERO), [alto, w]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const matTablero = useMemo(() => {
    const m = (mats.pantalla as THREE.MeshStandardMaterial).clone();
    m.map = tex; m.needsUpdate = true;
    return m;
  }, [mats.pantalla, tex]);
  useEffect(() => () => matTablero.dispose(), [matTablero]);
  // tablero en el plano x = 0 del grupo, mirando a −x
  const tablero = useGeo(() => {
    const g = new THREE.PlaneGeometry(w, alto);
    g.rotateY(-Math.PI / 2);
    g.translate(-0.031, alto / 2 + 0.06, 0);
    return g;
  }, [alto]);
  const dorso = useGeo(() => caja(0.06, alto, w, 0, alto / 2 + 0.06, 0), [alto]);
  const marco = useGeo(() => fundir([
    caja(0.09, alto + 0.1, 0.07, 0, alto / 2 + 0.06, w / 2 + 0.035), caja(0.09, alto + 0.1, 0.07, 0, alto / 2 + 0.06, -w / 2 - 0.035),
    caja(0.09, 0.07, w + 0.14, 0, alto + 0.11, 0),
    // puntales traseros
    ...[-1, 1].map((s) => { const g = caja(0.06, Math.min(alto, 9) * 0.92, 0.06, 0, 0, 0); g.rotateZ(-0.2); g.translate(0.65, Math.min(alto, 9) * 0.45, s * (w / 2 - 0.15)); return g; }),
  ]), [alto]);
  const bastidor = useGeo(() => fundir([
    caja(1.9, 0.1, 0.12, 0.45, 0.16, w / 2 - 0.15), caja(1.9, 0.1, 0.12, 0.45, 0.16, -w / 2 + 0.15),
    caja(0.12, 0.1, w - 0.3, 1.3, 0.16, 0),
  ]), []);
  const ruedas = useGeo(() => fundir(
    [[-0.4, w / 2 - 0.15], [1.3, w / 2 - 0.15], [-0.4, -w / 2 + 0.15], [1.3, -w / 2 + 0.15]].map(([x, z]) => cilZ(0.1, z - 0.04, z + 0.04, 20, x, 0.1)),
  ), []);
  return (
    <group ref={grupo} userData={{ pieza: 'pantalla' }}>
      <group rotation={[0, PANTALLA.giro, 0]}>
        <mesh geometry={tablero} material={matTablero} receiveShadow userData={{ pieza: 'pantalla' }} />
        <M g={dorso} m={mats.blanco} pieza="pantalla" />
        <M g={marco} m={mats.aluminio} pieza="pantalla" />
        <M g={bastidor} m={mats.anodizado} pieza="pantalla" />
        <M g={ruedas} m={mats.goma} pieza="pantalla" />
      </group>
    </group>
  );
}

// ───────────────────────────── torre del reto ─────────────────────────────

/** Barras finas entre dos puntos en una sola llamada (InstancedMesh). */
function Barras({ lista, radio, material }: { lista: [V3, V3][]; radio: number; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useGeo(() => new THREE.CylinderGeometry(1, 1, 1, 10), []);
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const o = new THREE.Object3D(), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    lista.forEach(([p, q], i) => {
      a.set(...p); b.set(...q); d.subVectors(b, a);
      const L = d.length();
      o.position.copy(a).addScaledVector(d, 0.5);
      o.quaternion.setFromUnitVectors(Y, d.normalize());
      o.scale.set(radio, L, radio);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [lista, radio]);
  return <instancedMesh key={lista.length} ref={ref} args={[geo, material, lista.length]} castShadow receiveShadow userData={{ pieza: 'torre' }} />;
}

/** Centro (x) y medio ancho de la torre (m). */
const TORRE = { xc: -2.1, a: 1.7 };

/**
 * Torre de celosía sobre la explanada (base en y = −DESNIVEL) cuya cubierta queda a la altura
 * del montaje del cañón: boca en y₀. Voladizo delantero bajo la base del cañón.
 */
export function Torre({ mats, y0 }: { mats: MatsTiro; y0: number }) {
  const yCub = y0 - ALTO_MONTAJE;   // cara superior de la cubierta
  const { xc, a } = TORRE;
  const barras = useMemo(() => {
    const yb = -DESNIVEL, alto = yCub - 0.12 - yb;
    const n = Math.max(2, Math.round(alto / 3));
    const h = alto / n;
    const esq = (y: number): V3[] => [[xc - a, y, -a], [xc + a, y, -a], [xc + a, y, a], [xc - a, y, a]];
    const b: [V3, V3][] = [];
    for (let i = 0; i <= n; i++) {
      const c = esq(yb + i * h);
      for (let k = 0; k < 4; k++) b.push([c[k], c[(k + 1) % 4]]);
      if (i < n) {
        const c2 = esq(yb + (i + 1) * h);
        for (let k = 0; k < 4; k++) {
          b.push([c[k], c2[k]]);
          const k2 = (k + 1) % 4;
          if ((i + k) % 2 === 0) b.push([c[k], c2[k2]]); else b.push([c[k2], c2[k]]);
        }
      }
    }
    return b;
  }, [yCub, xc, a]);
  const cubierta = useGeo(() => fundir([
    caja(2 * a + 0.5, 0.12, 2 * a + 0.5, xc, yCub - 0.06, 0),
    caja(1.9, 0.12, 2.8, 0.0, yCub - 0.06, 0),                      // voladizo bajo la base del cañón
    (() => { const g = caja(0.12, 1.6, 0.12, 0, 0, 0); g.rotateZ(0.75); g.translate(0.15, yCub - 0.75, 1.2); return g; })(),
    (() => { const g = caja(0.12, 1.6, 0.12, 0, 0, 0); g.rotateZ(0.75); g.translate(0.15, yCub - 0.75, -1.2); return g; })(),
  ]), [yCub]);
  const barandal = useMemo(() => {
    const y = yCub, r: [V3, V3][] = [];
    const x0 = xc - a - 0.2, x1 = xc + a + 0.2, z = a + 0.2;
    for (const hh of [0.5, 1.0]) {
      r.push([[x0, y + hh, -z], [x1, y + hh, -z]], [[x0, y + hh, z], [x1, y + hh, z]], [[x0, y + hh, -z], [x0, y + hh, z]]);
    }
    for (const x of [x0, (x0 + x1) / 2, x1]) for (const zz of [-z, z]) r.push([[x, y, zz], [x, y + 1.0, zz]]);
    return r;
  }, [yCub, xc, a]);
  const zapatas = useGeo(() => fundir([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => caja(0.7, 0.3, 0.7, xc + sx * a, -DESNIVEL + 0.15, sz * a))), []);
  return (
    <group userData={{ pieza: 'torre' }}>
      <Barras lista={barras} radio={0.075} material={mats.galvanizado} />
      <Barras lista={barandal} radio={0.03} material={mats.pintura} />
      <M g={cubierta} m={mats.chapa} pieza="torre" />
      <M g={zapatas} m={mats.albardilla} pieza="torre" />
    </group>
  );
}

// ───────────────────────────── muro del reto ─────────────────────────────

/** Muro de paneles prefabricados con la CARA frontal en x = obsX (donde el modelo decide el choque). */
export function Muro({ mats, x, alto }: { mats: MatsTiro; x: number; alto: number }) {
  const ancho = 16, esp = 1.2;
  const cuerpo = useGeo(() => caja(esp, alto, ancho, x + esp / 2, alto / 2, 0, [4, 8]), [x, alto]);
  const tapa = useGeo(() => caja(esp + 0.3, 0.25, ancho + 0.3, x + esp / 2, alto + 0.125, 0), [x, alto]);
  const franjas = useMemo(() => {
    const n = Math.ceil(alto / 5);
    return Array.from({ length: n }, (_, i) => ({ y0: i * 5, y1: Math.min(alto, (i + 1) * 5), rojo: i % 2 === 0 }));
  }, [alto]);
  const geoRojo = useGeo(() => fundir(franjas.filter((f) => f.rojo).map((f) => cilY(0.16, 0.16, f.y1 - f.y0, 16, x - 0.6, (f.y0 + f.y1) / 2, ancho / 2 + 0.7))), [franjas, x]);
  const geoBlanco = useGeo(() => {
    const b = franjas.filter((f) => !f.rojo);
    return b.length ? fundir(b.map((f) => cilY(0.16, 0.16, f.y1 - f.y0, 16, x - 0.6, (f.y0 + f.y1) / 2, ancho / 2 + 0.7))) : new THREE.BufferGeometry();
  }, [franjas, x]);
  return (
    <group userData={{ pieza: 'muro' }}>
      <M g={cuerpo} m={mats.paneles} pieza="muro" />
      <M g={tapa} m={mats.albardilla} pieza="muro" />
      <M g={geoRojo} m={mats.rojo} pieza="mastil" />
      {franjas.some((f) => !f.rojo) && <M g={geoBlanco} m={mats.blanco} pieza="mastil" />}
    </group>
  );
}

// ───────────────────────────── diana y dron ─────────────────────────────

export function Diana({ mats, x, radio }: { mats: MatsTiro; x: number; radio: number }) {
  const g = useGeo(() => { const c = new THREE.CircleGeometry(radio, 72); c.rotateX(-Math.PI / 2); c.translate(x, 0.035, 0); return c; }, [x, radio]);
  return <mesh geometry={g} material={mats.diana} receiveShadow userData={{ pieza: 'diana' }} />;
}

/** Cuadricóptero posado en el centro de la diana (×K). `abatido` lo vuelca tras el impacto. */
export function Dron({ mats, x, abatido, reducido }: { mats: MatsTiro; x: number; abatido: boolean; reducido: boolean }) {
  const cuerpo = useGeo(() => {
    const g = new THREE.CapsuleGeometry(0.05, 0.1, 6, 20);
    g.rotateZ(Math.PI / 2); g.scale(1, 0.62, 1); g.translate(0, 0.095, 0);
    return fundir([g, caja(0.08, 0.025, 0.06, 0.02, 0.135, 0)]);
  }, []);
  const brazos = useGeo(() => fundir([
    ...[45, 135, 225, 315].map((d) => {
      const a = (d * Math.PI) / 180;
      const g = new THREE.CylinderGeometry(0.009, 0.009, 0.2, 10);
      g.rotateZ(Math.PI / 2); g.rotateY(-a); g.translate(Math.cos(a) * 0.1, 0.1, Math.sin(a) * 0.1);
      return g;
    }),
    // patines
    caja(0.24, 0.012, 0.012, 0, 0.012, 0.075), caja(0.24, 0.012, 0.012, 0, 0.012, -0.075),
    ...[[0.06, 0.075], [-0.06, 0.075], [0.06, -0.075], [-0.06, -0.075]].map(([px, pz]) => caja(0.01, 0.08, 0.01, px, 0.05, pz)),
  ]), []);
  const motores = useGeo(() => fundir([45, 135, 225, 315].map((d) => {
    const a = (d * Math.PI) / 180;
    return cilY(0.022, 0.022, 0.03, 20, Math.cos(a) * 0.2, 0.112, Math.sin(a) * 0.2);
  })), []);
  const helice = useGeo(() => fundir([caja(0.17, 0.003, 0.018, 0, 0, 0), cilY(0.008, 0.008, 0.012, 10, 0, 0, 0)]), []);
  const led = useGeo(() => new THREE.SphereGeometry(0.009, 12, 8), []);
  const grupo = useRef<THREE.Group>(null);
  const helices = useRef<(THREE.Mesh | null)[]>([]);
  const matLed = useMemo(() => (mats.led as THREE.MeshStandardMaterial).clone(), [mats.led]);
  useEffect(() => () => matLed.dispose(), [matLed]);
  const vuelco = useRef(0);
  useFrame((st, dt) => {
    const meta = abatido ? 1 : 0;
    vuelco.current += (meta - vuelco.current) * Math.min(1, dt * (abatido ? 5 : 2));
    if (grupo.current) { grupo.current.rotation.z = vuelco.current * 0.55; grupo.current.position.y = vuelco.current * 0.05; }
    const w = abatido || reducido ? 0 : 3.5;
    helices.current.forEach((h, i) => { if (h) h.rotation.y += dt * w * (i % 2 ? -1 : 1); });
    matLed.emissiveIntensity = abatido ? 0 : (Math.sin(st.clock.elapsedTime * 4) > 0.2 ? 2.6 : 0.15);
  });
  return (
    <group position={[x, 0.04, 0]} scale={K} userData={{ pieza: 'dron' }}>
      <group ref={grupo}>
        <M g={cuerpo} m={mats.plastico} pieza="dron" />
        <M g={brazos} m={mats.carbono} pieza="dron" />
        <M g={motores} m={mats.aluminio} pieza="dron" />
        {[45, 135, 225, 315].map((d, i) => {
          const a = (d * Math.PI) / 180;
          return <mesh key={d} ref={(el) => { helices.current[i] = el; }} geometry={helice} material={mats.helice} position={[Math.cos(a) * 0.2, 0.13, Math.sin(a) * 0.2]} rotation={[0, i * 0.7, 0]} castShadow userData={{ pieza: 'dron' }} />;
        })}
        <mesh geometry={led} material={matLed} position={[0.105, 0.1, 0]} userData={{ pieza: 'dron' }} />
      </group>
    </group>
  );
}

// ───────────────────────────── manga de viento ─────────────────────────────

/** Manga de viento: apunta hacia donde sopla (+x si viento > 0) y cuelga más cuanto menos sopla. */
export function MangaViento({ mats, viento, position, reducido }: { mats: MatsTiro; viento: number; position: V3; reducido: boolean }) {
  const manga = useRef<THREE.Group>(null);
  const alto = 7;
  const v = Math.abs(viento);
  const poste = useGeo(() => fundir([cilY(0.06, 0.08, alto, 14, 0, alto / 2, 0), cilY(0.25, 0.25, 0.06, 20, 0, 0.03, 0)]), []);
  const aro = useGeo(() => { const g = new THREE.TorusGeometry(0.42, 0.025, 8, 28); g.rotateY(Math.PI / 2); return g; }, []);
  const tramos = useMemo(() => {
    const L = 2.6, rg = 0.42, rp = 0.2;
    return [0, 1, 2, 3].map((i) => {
      const r0 = rg + (rp - rg) * (i / 4), r1 = rg + (rp - rg) * ((i + 1) / 4);
      const g = new THREE.CylinderGeometry(r1, r0, L / 4, 18, 1, true);
      g.rotateZ(-Math.PI / 2);
      g.translate((i + 0.5) * (L / 4), 0, 0);
      return g;
    });
  }, []);
  useEffect(() => () => tramos.forEach((g) => g.dispose()), [tramos]);
  useFrame((st) => {
    const g = manga.current; if (!g) return;
    const caida = (1 - Math.min(1, v / 9)) * 1.3;
    const aleteo = reducido ? 0 : Math.sin(st.clock.elapsedTime * (2 + v * 0.4)) * 0.05 * Math.min(1, v / 3);
    g.rotation.z = -(caida + aleteo);
  });
  return (
    <group position={position} userData={{ pieza: 'manga' }}>
      <M g={poste} m={mats.aluminio} pieza="manga" />
      <group position={[0, alto, 0]} rotation={[0, viento >= 0 ? 0 : Math.PI, 0]}>
        <M g={aro} m={mats.aluminio} pieza="manga" />
        <group ref={manga}>
          {tramos.map((g, i) => <M key={i} g={g} m={mats.tela[i % 2]} pieza="manga" />)}
        </group>
      </group>
    </group>
  );
}

// ───────────────────────────── paisaje ─────────────────────────────

/** Colinas lejanas: una banda de cerros suaves (baja frecuencia) a 700–1000 m. */
export function Colinas({ material }: { material: THREE.Material }) {
  const g = useGeo(() => {
    const n = 220, R = 820, pos: number[] = [], idx: number[] = [];
    const alto = (a: number) => 26 + 22 * Math.sin(a * 3 + 0.4) + 14 * Math.sin(a * 7 + 1.3) + 7 * Math.sin(a * 17 + 2.1) + 4 * Math.sin(a * 29);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = R + 120 * Math.sin(a * 5 + 0.7);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      pos.push(x, -5, z, x, Math.max(6, alto(a)), z);
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // normales hacia el centro (se ven por dentro) y con algo de «cielo»
    const nn = geo.getAttribute('normal') as THREE.BufferAttribute, p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < nn.count; i++) {
      const x = -p.getX(i), z = -p.getZ(i), l = Math.hypot(x, z) || 1;
      const v = new THREE.Vector3(x / l, 0.9, z / l).normalize();
      nn.setXYZ(i, v.x, v.y, v.z);
    }
    return geo;
  }, []);
  return <mesh geometry={g} material={material} userData={{ pieza: 'paisaje' }} />;
}

/**
 * Arboleda lejana: un cinturón detrás de la pista (190–260 m) y otro a la derecha, para que el
 * cielo y las colinas se vean por encima. Copas de cuatro lóbulos (silueta irregular) con tono
 * por árbol; copas y troncos instanciados (dos llamadas). La niebla las funde con el horizonte.
 */
export function Arboleda({ mats }: { mats: MatsTiro }) {
  const copas = useRef<THREE.InstancedMesh>(null), troncos = useRef<THREE.InstancedMesh>(null);
  const datos = useMemo(() => {
    const r: { x: number; z: number; h: number; w: number; tono: number; giro: number }[] = [];
    let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 84; i++) r.push({ x: -200 + i * 8 + rnd() * 6, z: -280 - rnd() * 80, h: 8 + rnd() * 6, w: 3.6 + rnd() * 2, tono: rnd(), giro: rnd() * 6.28 });
    for (let i = 0; i < 26; i++) r.push({ x: 420 + rnd() * 80, z: -260 + i * 13 + rnd() * 8, h: 8 + rnd() * 6, w: 3.6 + rnd() * 2, tono: rnd(), giro: rnd() * 6.28 });
    return r;
  }, []);
  const gCopa = useGeo(() => {
    const lobulo = (r: number, x: number, y: number, z: number, a: number, b: number) => { const g = new THREE.SphereGeometry(r, a, b); g.translate(x, y, z); return g; };
    return fundir([lobulo(1, 0, 1, 0, 12, 9), lobulo(0.72, 0.58, 0.78, 0.22, 9, 7), lobulo(0.66, -0.52, 0.84, -0.26, 9, 7), lobulo(0.6, 0.08, 1.62, 0.1, 9, 7)]);
  }, []);
  const gTronco = useGeo(() => { const g = new THREE.CylinderGeometry(0.18, 0.26, 1, 8); g.translate(0, 0.5, 0); return g; }, []);
  useLayoutEffect(() => {
    const c = copas.current, t = troncos.current; if (!c || !t) return;
    const o = new THREE.Object3D(), col = new THREE.Color();
    datos.forEach((d, i) => {
      o.position.set(d.x, d.h * 0.18, d.z); o.rotation.set(0, d.giro, 0); o.scale.set(d.w, d.h * 0.4, d.w); o.updateMatrix(); c.setMatrixAt(i, o.matrix);
      const f = 0.78 + d.tono * 0.44;
      c.setColorAt(i, col.setRGB(f * 0.96, f, f * 0.9));
      o.position.set(d.x, 0, d.z); o.rotation.set(0, 0, 0); o.scale.set(1.3, d.h * 0.34, 1.3); o.updateMatrix(); t.setMatrixAt(i, o.matrix);
    });
    c.instanceMatrix.needsUpdate = true; t.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
    c.computeBoundingSphere(); t.computeBoundingSphere();
  }, [datos]);
  return (
    <group userData={{ pieza: 'paisaje' }}>
      <instancedMesh ref={copas} args={[gCopa, mats.arbol, datos.length]} />
      <instancedMesh ref={troncos} args={[gTronco, mats.tronco, datos.length]} />
    </group>
  );
}

// ───────────────────────────── cuadrante de papel (lo usa fis02) ─────────────────────────────

/** Cuadrante de 0° a 90° (vértice en el origen, 0° hacia +X, 90° hacia +Y, mira a +Z). */
export function Cuadrante({ radio, ...g }: { radio: number } & React.ComponentProps<'group'>) {
  const m = useMateriales();
  const tex = useTexturaLienzo(1024, 1024, (ctx, W, H) => {
    const fam = familiaTexto();
    const cx = W / 2, cy = H / 2, R = W / 2 - 6;
    ctx.fillStyle = '#eef1f2'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1b2a33'; ctx.fillStyle = '#1b2a33';
    for (let d = 0; d <= 90; d++) {
      const a = (d * Math.PI) / 180;
      const l = d % 15 === 0 ? 0.11 : d % 5 === 0 ? 0.07 : 0.035;
      ctx.lineWidth = d % 15 === 0 ? 5 : d % 5 === 0 ? 3 : 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R, cy - Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a) * R * (1 - l), cy - Math.sin(a) * R * (1 - l));
      ctx.stroke();
      if (d % 15 === 0) {
        ctx.font = `700 ${W * 0.062}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(d), cx + Math.cos(a) * R * 0.8, cy - Math.sin(a) * R * 0.8);
      }
    }
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.985, 0, Math.PI / 2, true); ctx.stroke();
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.1 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const geo = useMemo(() => new THREE.CircleGeometry(radio, 48, 0, Math.PI / 2), [radio]);
  useEffect(() => () => geo.dispose(), [geo]);
  void m;
  return (
    <group {...g}>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
    </group>
  );
}

// ───────────────────────────── diagnóstico ─────────────────────────────

export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number; triangulos: number } {
  let mallas = 0, normalesCero = 0, triangulos = 0;
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    const g = m.geometry as THREE.BufferGeometry;
    const p = g.getAttribute('position');
    if (!p) return;
    mallas++;
    const inst = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
    triangulos += ((g.index ? g.index.count : p.count) / 3) * inst;
    const n = g.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { mallas, normalesCero, triangulos: Math.round(triangulos) };
}
