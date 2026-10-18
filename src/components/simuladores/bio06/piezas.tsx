'use client';
/**
 * bio06/piezas.tsx — las piezas del claro del bosque (R3F). Todas LEEN el reloj único en su
 * useFrame (prioridad 0, después del paso del reloj): ninguna decide nada por su cuenta.
 *
 *  · Bosque: el roble principal (misma superficie que usa el reloj), dos ramas con hojas, robles de
 *    media distancia y de fondo, suelo de hojarasca. El hollín de la corteza es un uniforme.
 *  · Polillas: 6 InstancedMesh (alas izquierda/derecha y cuerpo de cada forma).
 *  · Aves: hasta 3 carboneros con cabeza y alas articuladas y la presa en el pico.
 *  · Aire: haces de luz entre los troncos y motas (o copos de hollín) que flotan.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { Calidad } from '../_kit';
import type { PolillaEsc, AveEsc } from './reloj';
import { RAMAS, TRONCO, ENVERGADURA, type V3 } from './bosque';
import {
  materialCorteza, geoTronco, geoRama, geoTroncoLejano, geoAla, geoCuerpoPolilla, geoPresa, materialesPolilla,
  geoAve, geoAlaAve, materialesAve, CABEZA_AVE, texturaHojarasca, texturaHoja, geoHoja, materialHaz, materialMotas,
  BALDOSA, REP_CORTEZA, fijarHollinCorteza, factoresCorteza,
} from './materiales';

/** Lo que las piezas leen del reloj activo en cada cuadro. */
export interface FuenteEscena {
  hollin: number;
  noche: number;
  t: number;
  dtPantalla: number;
  polillas: PolillaEsc[];
  avesEsc: AveEsc[];
}
export type Fuente = () => FuenteEscena;

const azar = (s: number) => { let a = s >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ───────────────────────────── bosque ─────────────────────────────

/** Robles de fondo (posiciones fijas): [x, z, radio]. */
const LEJANOS: [number, number, number][] = (() => {
  const r = azar(77);
  const out: [number, number, number][] = [];
  while (out.length < 16) {
    const x = (r() - 0.5) * 150, z = -22 - r() * 110;
    if (Math.abs(x) < 9 && z > -40) continue; // no tapar el roble principal
    if (out.some(([a, b]) => Math.hypot(a - x, b - z) < 12)) continue;
    out.push([x, z, 1.6 + r() * 1.8]);
  }
  return out;
})();
/** Robles de media distancia (con la malla del principal escalada). */
const MEDIOS: [number, number, number, number][] = [[-11.5, -20, 0.8, 0.6], [13.5, -26, 0.85, 2.2], [-26, -38, 0.9, 4.0]];

export function Bosque({ fuente, calidad, onHover }: { fuente: Fuente; calidad: Calidad; onHover?: (e: ThreeEvent<PointerEvent>, pieza: string) => void }) {
  const alta = calidad === 'alta';
  const geoT = useMemo(() => geoTronco(alta ? 112 : 72), [alta]);
  // los robles de media distancia, con menos lados (se ven pequeños y entre niebla)
  const geoM = useMemo(() => geoTronco(alta ? 56 : 40), [alta]);
  const geoR = useMemo(() => RAMAS.map((r) => geoRama(r, alta ? 44 : 28, alta ? 14 : 10)), [alta]);
  const geoL = useMemo(() => geoTroncoLejano(), []);
  const matT = useMemo(() => materialCorteza([1, 1], 1), []);
  const matR = useMemo(() => materialCorteza([1, 1], 0), []);
  const matL = useMemo(() => materialCorteza([1, 1], 0.7), []);
  useEffect(() => () => { geoT.dispose(); geoM.dispose(); geoR.forEach((g) => g.dispose()); }, [geoT, geoM, geoR]);
  useEffect(() => () => { geoL.dispose(); matT.dispose(); matR.dispose(); matL.dispose(); }, [geoL, matT, matR, matL]);
  const lejanos = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = lejanos.current; if (!m) return;
    const o = new THREE.Object3D();
    LEJANOS.forEach(([x, z, r], i) => { o.position.set(x, -0.5, z); o.scale.set(r, TRONCO.alto + 8, r); o.rotation.set(0, i * 1.7, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, []);
  const ultimo = useRef(-1);
  useFrame(() => {
    const h = fuente().hollin;
    if (h === ultimo.current) return;
    ultimo.current = h;
    const f = factoresCorteza(h);
    for (const m of [matT, matR, matL]) fijarHollinCorteza(m, h, f);
  });
  const hover = (pieza: string) => (onHover ? (e: ThreeEvent<PointerEvent>) => onHover(e, pieza) : undefined);
  return (
    <group>
      <mesh geometry={geoT} material={matT} castShadow receiveShadow userData={{ pieza: 'roble' }} onPointerMove={hover('roble')} />
      {geoR.map((g, i) => <mesh key={i} geometry={g} material={matR} castShadow receiveShadow userData={{ pieza: 'rama' }} onPointerMove={hover('rama')} />)}
      {MEDIOS.map(([x, z, k, giro], i) => (
        <mesh key={i} geometry={geoM} material={matL} position={[x, -0.4, z - TRONCO.zEje * k]} rotation={[0, giro, 0]} scale={[k, 1, k]} receiveShadow userData={{ pieza: 'fondo' }} raycast={() => null} />
      ))}
      <instancedMesh ref={lejanos} args={[geoL, matL, LEJANOS.length]} frustumCulled={false} raycast={() => null} userData={{ pieza: 'fondo' }} />
      <Suelo fuente={fuente} />
      <Hojas fuente={fuente} calidad={calidad} />
    </group>
  );
}

function Suelo({ fuente }: { fuente: Fuente }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: texturaHojarasca(), roughness: 0.97, metalness: 0, color: '#b9aa94' }), []);
  const geo = useMemo(() => { const g = new THREE.CircleGeometry(320, 48); g.rotateX(-Math.PI / 2); return g; }, []);
  useEffect(() => () => { mat.dispose(); geo.dispose(); }, [mat, geo]);
  const base = useMemo(() => new THREE.Color('#b9aa94'), []);
  // el hollín también ensucia la hojarasca
  useFrame(() => { mat.color.copy(base).multiplyScalar(1 - 0.35 * fuente().hollin); });
  return <mesh geometry={geo} material={mat} receiveShadow userData={{ pieza: 'suelo' }} raycast={() => null} />;
}

/** Hojas de roble en las puntas de las ramas y un dosel que asoma por arriba; se mecen con el viento. */
function Hojas({ fuente, calidad }: { fuente: Fuente; calidad: Calidad }) {
  const n = calidad === 'alta' ? 170 : 110;
  const base = useMemo(() => {
    const r = azar(19);
    const out: { p: THREE.Vector3; q: THREE.Quaternion; s: number; f: number }[] = [];
    const racimo = (c: V3, cuantas: number, radio: number) => {
      for (let k = 0; k < cuantas; k++) {
        const p = new THREE.Vector3(c[0] + (r() - 0.5) * radio * 2, c[1] + (r() - 0.3) * radio, c[2] + (r() - 0.5) * radio * 1.4);
        const e = new THREE.Euler((r() - 0.5) * 2.4, r() * Math.PI * 2, (r() - 0.5) * 2.4 + Math.PI);
        out.push({ p, q: new THREE.Quaternion().setFromEuler(e), s: 0.8 + r() * 0.5, f: r() * 10 });
      }
    };
    const fin0 = RAMAS[0].puntos[RAMAS[0].puntos.length - 1], fin1 = RAMAS[1].puntos[RAMAS[1].puntos.length - 1];
    racimo([fin0[0] + 0.6, fin0[1] + 0.6, fin0[2]], Math.round(n * 0.22), 1.6);
    racimo([fin1[0] - 0.6, fin1[1] + 0.6, fin1[2]], Math.round(n * 0.18), 1.4);
    // dosel que asoma por las esquinas de arriba
    racimo([-7.8, 14.2, 2.2], Math.round(n * 0.3), 3.0);
    racimo([9.2, 14.6, 1.2], n - out.length, 3.2);
    return out.slice(0, n);
  }, [n]);
  const geo = useMemo(() => geoHoja(), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: texturaHoja(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.62, metalness: 0 }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), s: new THREE.Vector3() }), []);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const im = ref.current; if (!im) return;
    const f = fuente();
    const t = f.t;
    base.forEach((b, i) => {
      tmp.e.set(Math.sin(t * 1.3 + b.f) * 0.09, Math.sin(t * 0.9 + b.f * 1.7) * 0.07, Math.sin(t * 1.7 + b.f * 0.6) * 0.05);
      tmp.q.setFromEuler(tmp.e).premultiply(b.q);
      tmp.s.setScalar(b.s);
      tmp.m.compose(b.p, tmp.q, tmp.s);
      im.setMatrixAt(i, tmp.m);
    });
    im.instanceMatrix.needsUpdate = true;
    // el hollín también se deposita en las hojas
    color.setScalar(1 - 0.45 * f.hollin);
    mat.color.copy(color);
  });
  return <instancedMesh ref={ref} args={[geo, mat, base.length]} castShadow frustumCulled={false} raycast={() => null} userData={{ pieza: 'hojas' }} />;
}

// ───────────────────────────── polillas ─────────────────────────────

const CAP_POLILLAS = 200;
/** Radio de la diana del clic (u): la polilla mide 0,275 de semienvergadura; se perdona un poco más. */
const DIANA_POLILLA = 0.31;
const ESCALA_NULA = new THREE.Vector3(1e-4, 1e-4, 1e-4);

/** Las polillas del reloj activo. En el reto, el clic en una polilla es la caza del alumno. */
export function Polillas({ fuente, onCazar, onHover }: {
  fuente: Fuente;
  onCazar?: (id: number) => void;
  onHover?: (e: ThreeEvent<PointerEvent>, pieza: string) => void;
}) {
  const geo = useMemo(() => ({ d: geoAla(1), i: geoAla(-1), c: geoCuerpoPolilla(), diana: new THREE.CircleGeometry(DIANA_POLILLA, 18).translate(0, -0.02, 0.02) }), []);
  const mat = useMemo(() => ({ clara: materialesPolilla('clara'), oscura: materialesPolilla('oscura') }), []);
  // la diana del clic: un disco INVISIBLE algo mayor que la polilla (el rayo cabe entre las dos alas)
  const matDiana = useMemo(() => new THREE.MeshBasicMaterial({ visible: false }), []);
  useEffect(() => () => {
    geo.d.dispose(); geo.i.dispose(); geo.c.dispose(); geo.diana.dispose(); matDiana.dispose();
    for (const m of [mat.clara, mat.oscura]) { m.ala.dispose(); m.cuerpo.dispose(); }
  }, [geo, mat, matDiana]);
  const r = {
    clara: { d: useRef<THREE.InstancedMesh>(null), i: useRef<THREE.InstancedMesh>(null), c: useRef<THREE.InstancedMesh>(null), x: useRef<THREE.InstancedMesh>(null) },
    oscura: { d: useRef<THREE.InstancedMesh>(null), i: useRef<THREE.InstancedMesh>(null), c: useRef<THREE.InstancedMesh>(null), x: useRef<THREE.InstancedMesh>(null) },
  };
  const ids = useRef<{ clara: number[]; oscura: number[] }>({ clara: [], oscura: [] });
  const tmp = useMemo(() => ({
    base: new THREE.Matrix4(), rot: new THREE.Matrix4(), m: new THREE.Matrix4(),
    x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(),
  }), []);
  useFrame(() => {
    const lista = fuente().polillas;
    const n = { clara: 0, oscura: 0 };
    for (const p of lista) {
      if (!p.visible) continue;
      const f = p.fenotipo;
      const k = n[f];
      if (k >= CAP_POLILLAS) continue;
      tmp.y.set(p.cabeza[0], p.cabeza[1], p.cabeza[2]);
      tmp.z.set(p.dorso[0], p.dorso[1], p.dorso[2]);
      tmp.x.crossVectors(tmp.y, tmp.z).normalize();
      tmp.base.makeBasis(tmp.x, tmp.y, tmp.z).setPosition(p.pos[0], p.pos[1], p.pos[2]);
      const rr = r[f];
      rr.c.current?.setMatrixAt(k, tmp.base);
      // sólo las posadas se pueden cazar con un clic
      if (rr.x.current) { if (p.modo === 'posada' && !p.marcada) rr.x.current.setMatrixAt(k, tmp.base); else rr.x.current.setMatrixAt(k, tmp.m.copy(tmp.base).scale(ESCALA_NULA)); }
      tmp.m.multiplyMatrices(tmp.base, tmp.rot.makeRotationY(-p.ala));
      rr.d.current?.setMatrixAt(k, tmp.m);
      tmp.m.multiplyMatrices(tmp.base, tmp.rot.makeRotationY(p.ala));
      rr.i.current?.setMatrixAt(k, tmp.m);
      ids.current[f][k] = p.id;
      n[f]++;
    }
    for (const f of ['clara', 'oscura'] as const) {
      for (const m of [r[f].d.current, r[f].i.current, r[f].c.current, r[f].x.current]) {
        if (!m) continue;
        m.count = n[f];
        m.instanceMatrix.needsUpdate = true;
      }
      // la esfera de recorte del clic sigue a las polillas
      r[f].x.current?.computeBoundingSphere();
    }
  });
  const clic = (f: 'clara' | 'oscura') => (onCazar ? (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const id = ids.current[f][e.instanceId];
    if (id !== undefined) onCazar(id);
  } : undefined);
  const hover = (f: 'clara' | 'oscura') => (onHover ? (e: ThreeEvent<PointerEvent>) => onHover(e, f === 'clara' ? 'polilla-clara' : 'polilla-oscura') : undefined);
  return (
    <group userData={{ pieza: 'polillas' }}>
      {(['clara', 'oscura'] as const).map((f) => (
        <group key={f}>
          <instancedMesh ref={r[f].d} args={[geo.d, mat[f].ala, CAP_POLILLAS]} castShadow frustumCulled={false} raycast={() => null} userData={{ pieza: 'polilla-' + f }} />
          <instancedMesh ref={r[f].i} args={[geo.i, mat[f].ala, CAP_POLILLAS]} castShadow frustumCulled={false} raycast={() => null} userData={{ pieza: 'polilla-' + f }} />
          <instancedMesh ref={r[f].c} args={[geo.c, mat[f].cuerpo, CAP_POLILLAS]} castShadow frustumCulled={false} raycast={() => null} userData={{ pieza: 'polilla-' + f }} />
          <instancedMesh ref={r[f].x} args={[geo.diana, matDiana, CAP_POLILLAS]} frustumCulled={false} onClick={clic(f)} onPointerMove={hover(f)} userData={{ pieza: 'polilla-' + f }} />
        </group>
      ))}
    </group>
  );
}

// ───────────────────────────── aves ─────────────────────────────

/** Escala del carbonero: el modelo mide 1,6 u y el real 14 cm. */
const ESCALA_AVE = 0.88;
const HOMBRO: V3 = [0.17, 0.1, 0.12];

function Ave({ k, fuente, matPresa, geoP, onHover }: {
  k: number; fuente: Fuente;
  matPresa: { clara: THREE.Material; oscura: THREE.Material }; geoP: THREE.BufferGeometry;
  onHover?: (e: ThreeEvent<PointerEvent>, pieza: string) => void;
}) {
  const geo = useMemo(() => ({ cuerpo: geoAve('cuerpo'), cabeza: geoAve('cabeza'), alaD: geoAlaAve(1), alaI: geoAlaAve(-1), ojo: new THREE.SphereGeometry(0.032, 12, 8) }), []);
  const mat = useMemo(() => materialesAve(), []);
  useEffect(() => () => { Object.values(geo).forEach((g) => g.dispose()); Object.values(mat).forEach((m) => m.dispose()); }, [geo, mat]);
  const g = useRef<THREE.Group>(null), cab = useRef<THREE.Group>(null), alaD = useRef<THREE.Group>(null), alaI = useRef<THREE.Group>(null);
  const presaC = useRef<THREE.Mesh>(null), presaO = useRef<THREE.Mesh>(null), presa = useRef<THREE.Group>(null);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3() }), []);
  useFrame(() => {
    const a = fuente().avesEsc.find((x) => x.i === k);
    const grupo = g.current; if (!grupo) return;
    grupo.visible = !!a && a.visible;
    if (!a || !a.visible) return;
    grupo.position.set(a.pos[0], a.pos[1], a.pos[2]);
    tmp.z.set(a.adelante[0], a.adelante[1], a.adelante[2]);
    tmp.y.set(a.arriba[0], a.arriba[1], a.arriba[2]);
    tmp.x.crossVectors(tmp.y, tmp.z).normalize();
    tmp.y.crossVectors(tmp.z, tmp.x).normalize();
    tmp.m.makeBasis(tmp.x, tmp.y, tmp.z);
    grupo.quaternion.setFromRotationMatrix(tmp.m);
    const pl = (1 - a.alas) * (Math.PI / 2 - 0.1);
    alaD.current?.rotation.set(0, pl, a.batida * a.alas);
    alaI.current?.rotation.set(0, -pl, -a.batida * a.alas);
    cab.current?.rotation.set(a.cabezaPitch, a.cabezaYaw, 0, 'YXZ');
    if (presa.current) { presa.current.visible = !!a.presa && a.presaEscala > 0.02; presa.current.scale.setScalar(Math.max(0.001, a.presaEscala)); }
    if (presaC.current) presaC.current.visible = a.presa === 'clara';
    if (presaO.current) presaO.current.visible = a.presa === 'oscura';
  });
  const hover = onHover ? (e: ThreeEvent<PointerEvent>) => onHover(e, 'ave') : undefined;
  return (
    <group ref={g} visible={false} userData={{ pieza: 'ave' }} onPointerMove={hover}>
      <group scale={ESCALA_AVE}>
        <mesh geometry={geo.cuerpo} material={mat.cuerpo} castShadow />
        <group ref={cab} position={CABEZA_AVE}>
          <mesh geometry={geo.cabeza} material={mat.cuerpo} castShadow />
          {[-1, 1].map((l) => <mesh key={l} geometry={geo.ojo} material={mat.ojo} position={[l * 0.12, 0.035, 0.1]} />)}
          {/* la presa, de lado en la punta del pico */}
          <group ref={presa} position={[0, -0.01, 0.31]} visible={false}>
            <group rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={1.15}>
              <mesh ref={presaC} geometry={geoP} material={matPresa.clara} visible={false} />
              <mesh ref={presaO} geometry={geoP} material={matPresa.oscura} visible={false} />
            </group>
          </group>
        </group>
        <group ref={alaD} position={HOMBRO}><mesh geometry={geo.alaD} material={mat.ala} castShadow /></group>
        <group ref={alaI} position={[-HOMBRO[0], HOMBRO[1], HOMBRO[2]]}><mesh geometry={geo.alaI} material={mat.ala} castShadow /></group>
      </group>
    </group>
  );
}

export function Aves({ fuente, onHover }: { fuente: Fuente; onHover?: (e: ThreeEvent<PointerEvent>, pieza: string) => void }) {
  const geoP = useMemo(() => geoPresa(), []);
  const mats = useMemo(() => ({ clara: materialesPolilla('clara').ala, oscura: materialesPolilla('oscura').ala }), []);
  useEffect(() => () => { geoP.dispose(); mats.clara.dispose(); mats.oscura.dispose(); }, [geoP, mats]);
  return <>{[0, 1, 2].map((k) => <Ave key={k} k={k} fuente={fuente} matPresa={mats} geoP={geoP} onHover={onHover} />)}</>;
}

// ───────────────────────────── aire: haces de luz y motas ─────────────────────────────

const HACES: { x: number; z: number; ancho: number; giro: number }[] = [
  { x: -14, z: -26, ancho: 7, giro: -0.32 }, { x: -3, z: -38, ancho: 9, giro: -0.3 }, { x: 9, z: -30, ancho: 6, giro: -0.34 }, { x: 22, z: -48, ancho: 10, giro: -0.28 },
];

export function Aire({ fuente, calidad }: { fuente: Fuente; calidad: Calidad }) {
  const mats = useMemo(() => HACES.map(() => materialHaz()), []);
  const geoH = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const n = calidad === 'alta' ? 240 : 130;
  const { geoM, vel } = useMemo(() => {
    const r = azar(5);
    const pos = new Float32Array(n * 3), tam = new Float32Array(n), vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[3 * i] = (r() - 0.5) * 22; pos[3 * i + 1] = 1 + r() * 19; pos[3 * i + 2] = -6 + r() * 13;
      tam[i] = 0.05 + r() * 0.09;
      vel[3 * i] = (r() - 0.5) * 0.12; vel[3 * i + 1] = (r() - 0.5) * 0.06; vel[3 * i + 2] = (r() - 0.5) * 0.1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    return { geoM: g, vel };
  }, [n]);
  const matM = useMemo(() => materialMotas(), []);
  useEffect(() => () => { mats.forEach((m) => m.dispose()); geoH.dispose(); geoM.dispose(); matM.dispose(); }, [mats, geoH, geoM, matM]);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const colorDia = useMemo(() => new THREE.Color('#ffe9bd'), []), colorHumo = useMemo(() => new THREE.Color('#d9c08a'), []);
  useFrame(() => {
    const f = fuente();
    const dia = 1 - f.noche;
    mats.forEach((m) => {
      m.uniforms.uT.value = f.t;
      m.uniforms.uFuerza.value = (0.09 + 0.07 * f.hollin) * dia;
      (m.uniforms.uColor.value as THREE.Color).copy(colorDia).lerp(colorHumo, f.hollin);
    });
    const pr = gl.getPixelRatio();
    matM.uniforms.uEscala.value = (size.height * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    (matM.uniforms.uColor.value as THREE.Color).setRGB(1, 0.95, 0.82).lerp(new THREE.Color('#2b2724'), f.hollin * 0.9);
    matM.uniforms.uAlfa.value = (0.35 + 0.25 * f.hollin) * (0.35 + 0.65 * dia);
    const d = f.dtPantalla;
    if (!d) return;
    const p = geoM.getAttribute('position') as THREE.BufferAttribute;
    const a = p.array as Float32Array;
    const cae = 0.12 * f.hollin; // el hollín cae; el polen flota
    for (let i = 0; i < n; i++) {
      a[3 * i] += (vel[3 * i] + 0.05 * Math.sin(f.t * 0.6 + i)) * d;
      a[3 * i + 1] += (vel[3 * i + 1] - cae) * d;
      a[3 * i + 2] += vel[3 * i + 2] * d;
      if (a[3 * i + 1] < 0.5) a[3 * i + 1] = 20;
      if (a[3 * i + 1] > 20.5) a[3 * i + 1] = 1;
      if (Math.abs(a[3 * i]) > 11) a[3 * i] = -Math.sign(a[3 * i]) * 10.9;
    }
    p.needsUpdate = true;
  });
  return (
    <group userData={{ pieza: 'aire' }}>
      {HACES.map((h, i) => (
        <mesh key={i} geometry={geoH} material={mats[i]} position={[h.x, 22, h.z]} rotation={[0, 0, h.giro]} scale={[h.ancho, 52, 1]} renderOrder={2} raycast={() => null} />
      ))}
      <points geometry={geoM} material={matM} renderOrder={3} frustumCulled={false} raycast={() => null} />
    </group>
  );
}

export { ENVERGADURA, BALDOSA, REP_CORTEZA };
