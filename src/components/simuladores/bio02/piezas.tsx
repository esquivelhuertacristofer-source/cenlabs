'use client';
/**
 * bio02/piezas.tsx — las células del lab de ósmosis, con forma real.
 *
 *  Eritrocito: disco bicóncavo con el perfil de Evans–Fung (D = 2R):
 *      z(ρ) = ± R·√(1−ρ²)·(0,2072 + 0,5006·ρ² − 0,0702·ρ⁴),   ρ = r/R
 *    (grosor central ≈ 0,41 R, máximo ≈ 0,61 R en ρ ≈ 0,77: 1,6 y 2,4 µm para R = 3,9 µm).
 *    Se deforma con el volumen relativo V (100 % = reposo):
 *      V < 92  → CRENACIÓN: se encoge, se esferiza y le salen espículas (equinocito);
 *      V > 100 → se esferiza hasta la esfera de V ≈ 160 %, el volumen hemolítico crítico;
 *      lisada  → la membrana estalla: fragmentos («fantasmas») y hemoglobina liberada.
 *
 *  Célula vegetal: pared celulósica rígida (no cambia), membrana plasmática que la
 *  rellena (turgencia, V ≈ 108 %) o se despega de ella (plasmólisis, V < 100 %), vacuola
 *  central, núcleo y cloroplastos que NO se encogen cuando lo hace el protoplasto.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useCalidad, sanearNormales, geoCache, azar } from '../_kit';

const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function useMat<T extends THREE.Material>(crear: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(crear, deps);
  useEffect(() => () => { m.dispose(); }, [m]);
  return m;
}

// ───────────────────────────── eritrocito ─────────────────────────────

const NQ = 44, NT = 64;
export const R_ERITROCITO = 1.5;

/** Direcciones de las espículas del equinocito (puntos de Fibonacci sobre la esfera). */
const ESPICULAS: THREE.Vector3[] = (() => {
  const n = 34, out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return out;
})();

function crearGeometriaEritrocito(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const n = (NQ + 1) * (NT + 1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const idx: number[] = [];
  for (let i = 0; i < NQ; i++) for (let j = 0; j < NT; j++) {
    const a = i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  g.setIndex(idx);
  return g;
}

/** Reescribe vértices y color del eritrocito para el volumen relativo V (% de V0). */
export function formaEritrocito(g: THREE.BufferGeometry, V: number) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const col = g.getAttribute('color') as THREE.BufferAttribute;
  const R0 = R_ERITROCITO;
  const crena = clamp((92 - V) / 34, 0, 1);
  const esfera = Math.max(smooth(0, 1, (V - 100) / 60), crena * 0.55);
  const Rd = R0 * Math.cbrt(Math.min(Math.max(V, 40), 100) / 100) * (1 - 0.12 * crena);
  const Rs = R0 * 0.84 * Math.cbrt(Math.max(V, 60) / 160);
  const v = new THREE.Vector3();
  for (let i = 0; i <= NQ; i++) {
    const q = i / NQ, rho = Math.sin(Math.PI * q), lado = q < 0.5 ? -1 : 1;
    const s2 = Math.sqrt(Math.max(0, 1 - rho * rho));
    const zb = Rd * s2 * (0.2072 + 0.5006 * rho * rho - 0.0702 * rho ** 4);
    const zs = Rs * s2;
    const r = lerp(Rd * rho, Rs * rho, esfera);
    const z = lado * lerp(zb, zs, esfera);
    // palidez central (sólo con el disco bicóncavo); la crenación oscurece
    const pal = (1 - esfera) * (1 - crena) * smooth(0.62, 0, rho);
    const cr = lerp(0.62, 0.86, pal) * (1 - 0.1 * crena), cg = lerp(0.07, 0.26, pal), cb = lerp(0.08, 0.25, pal);
    for (let j = 0; j <= NT; j++) {
      const t = (j / NT) * Math.PI * 2;
      v.set(r * Math.cos(t), z, r * Math.sin(t));
      if (crena > 0.02) {
        const dir = v.clone().normalize();
        let b = 0;
        for (const e of ESPICULAS) { const ang = Math.acos(clamp(dir.dot(e), -1, 1)); b += Math.exp(-(ang * ang) / (2 * 0.11 * 0.11)); }
        v.addScaledVector(dir, Math.min(1, b) * 0.3 * crena * R0);
      }
      const k = i * (NT + 1) + j;
      pos.setXYZ(k, v.x, v.y, v.z);
      col.setXYZ(k, cr, cg, cb);
    }
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  g.computeVertexNormals();
  sanearNormales(g);
  g.computeBoundingSphere();
}

export function Eritrocito({ volumen, giro = true }: { volumen: number; giro?: boolean }) {
  const alta = useCalidad() === 'alta';
  const geo = useMemo(() => crearGeometriaEritrocito(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const V = Math.round((Number.isFinite(volumen) ? volumen : 100) * 2) / 2;
  useLayoutEffect(() => { formaEritrocito(geo, V); }, [geo, V]);
  const mat = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff', vertexColors: true, roughness: 0.5, metalness: 0,
    sheen: 0.55, sheenColor: new THREE.Color('#e0645f'), sheenRoughness: 0.5,
    clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.4, side: THREE.DoubleSide,
  }), [alta]);
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (giro && ref.current) ref.current.rotation.y += dt * 0.22; });
  return (
    <group rotation={[-0.95, 0, 0.12]}>
      <group ref={ref}><mesh geometry={geo} material={mat} castShadow /></group>
    </group>
  );
}

/** Estallido: fragmentos de membrana y hemoglobina liberada. Parte del reposo cuando monta. */
export function Hemolisis() {
  const t0 = useRef<number | null>(null);
  const grupo = useRef<THREE.Group>(null);
  const fragmentos = useMemo(() => {
    const rnd = azar(11), out: { dir: THREE.Vector3; rot: THREE.Vector3; v: number; s: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      out.push({ dir: new THREE.Vector3(r * Math.cos(a), u * 0.8, r * Math.sin(a)), rot: new THREE.Vector3(rnd() * 6, rnd() * 6, rnd() * 6), v: 1.3 + rnd() * 1.6, s: 0.35 + rnd() * 0.45 });
    }
    return out;
  }, []);
  const geoFrag = useMemo(() => new THREE.SphereGeometry(1, 10, 6, 0, 1.5, 0.4, 1.3), []);
  useEffect(() => () => geoFrag.dispose(), [geoFrag]);
  const mFrag = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#b3262e', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#ff9a8f'), side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), []);
  const mHb = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#c92b32', roughness: 0.2, transparent: true, opacity: 0.18, depthWrite: false }), []);
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - t0.current) / 1.4), e = 1 - (1 - t) ** 3;
    grupo.current?.children.forEach((c, i) => {
      const f = fragmentos[i]; if (!f) return;
      c.position.copy(f.dir).multiplyScalar(f.v * e * 1.6);
      c.rotation.set(f.rot.x * e, f.rot.y * e, f.rot.z * e);
    });
  });
  return (
    <group>
      <group ref={grupo}>
        {fragmentos.map((f, i) => <mesh key={i} geometry={geoFrag} material={mFrag} scale={f.s} />)}
      </group>
      {[1.2, 2.0, 2.9].map((r, i) => <mesh key={i} material={mHb}><sphereGeometry args={[r, 24, 16]} /></mesh>)}
    </group>
  );
}

// ───────────────────────────── célula vegetal ─────────────────────────────

const PARED = { w: 3.9, h: 2.7, d: 2.7, t: 0.11 };

function cajaRed(w: number, h: number, d: number, r: number, segs = 5) {
  const g = new RoundedBoxGeometry(w, h, d, segs, Math.min(r, w / 2.05, h / 2.05, d / 2.05));
  return sanearNormales(g);
}

export function CelulaVegetal({ volumen }: { volumen: number }) {
  const alta = useCalidad() === 'alta';
  const V = clamp(Number.isFinite(volumen) ? volumen : 100, 30, 110);
  // el protoplasto llena la pared a V = 108 % (turgencia); por debajo se despega (plasmólisis)
  const k = clamp(Math.cbrt(V / 108) * 0.985, 0.3, 0.985);
  const kq = Math.round(k * 100) / 100; // cuantizado: evita reconstruir la geometría en cada fotograma
  const plasmolisis = 1 - kq;

  const gPared = useMemo(() => cajaRed(PARED.w, PARED.h, PARED.d, 0.2), []);
  const gProto = useMemo(() => cajaRed(
    (PARED.w - 2 * PARED.t) * kq, (PARED.h - 2 * PARED.t) * kq, (PARED.d - 2 * PARED.t) * kq, 0.16 + plasmolisis * 3.2, 6,
  ), [kq, plasmolisis]);
  const gVac = useMemo(() => cajaRed(
    (PARED.w - 2 * PARED.t) * kq * 0.72, (PARED.h - 2 * PARED.t) * kq * 0.7, (PARED.d - 2 * PARED.t) * kq * 0.7, 0.25 + plasmolisis * 2.8, 6,
  ), [kq, plasmolisis]);
  useEffect(() => () => { gPared.dispose(); }, [gPared]);
  useEffect(() => () => { gProto.dispose(); }, [gProto]);
  useEffect(() => () => { gVac.dispose(); }, [gVac]);

  const mPared = useMat(() => (alta
    ? new THREE.MeshPhysicalMaterial({ color: '#eef3c8', roughness: 0.12, transmission: 0.95, thickness: 0.12, ior: 1.45, attenuationColor: new THREE.Color('#c9d77a'), attenuationDistance: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') })
    : new THREE.MeshPhysicalMaterial({ color: '#cdd982', roughness: 0.35, transparent: true, opacity: 0.58, depthWrite: false })), [alta]);
  const mProto = useMat(() => (alta
    ? new THREE.MeshPhysicalMaterial({ color: '#d7edbd', roughness: 0.1, transmission: 0.9, thickness: 0.08, ior: 1.38, attenuationColor: new THREE.Color('#79b84a'), attenuationDistance: 0.9, sheen: 0.5, sheenColor: new THREE.Color('#ffffff') })
    : new THREE.MeshPhysicalMaterial({ color: '#a9d58a', roughness: 0.3, transparent: true, opacity: 0.35, depthWrite: false })), [alta]);
  const mVac = useMat(() => (alta
    ? new THREE.MeshPhysicalMaterial({ color: '#d9f0fb', roughness: 0.08, transmission: 0.95, thickness: 0.5, ior: 1.34, attenuationColor: new THREE.Color('#5fb0e0'), attenuationDistance: 0.35 })
    : new THREE.MeshPhysicalMaterial({ color: '#8cc9ea', roughness: 0.15, transparent: true, opacity: 0.5, depthWrite: false })), [alta]);
  const mLinea = useMat(() => new THREE.LineBasicMaterial({ color: '#7f8f33', transparent: true, opacity: 0.3 }), []);
  const mClo = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#2f7a2a', roughness: 0.4, sheen: 0.8, sheenColor: new THREE.Color('#a4dc7e'), clearcoat: 0.3 }), []);
  const mNuc = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#8c6ab0', roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color('#d9c5ee') }), []);

  // pared celulósica: cinco losas gruesas; el frente queda abierto (corte) para ver el interior
  const losas = useMemo(() => {
    const { w, h, d, t } = PARED;
    return [
      { p: [0, 0, -d / 2 + t / 2] as [number, number, number], s: [w, h, t] as [number, number, number] },
      { p: [-w / 2 + t / 2, 0, 0] as [number, number, number], s: [t, h, d] as [number, number, number] },
      { p: [w / 2 - t / 2, 0, 0] as [number, number, number], s: [t, h, d] as [number, number, number] },
      { p: [0, h / 2 - t / 2, 0] as [number, number, number], s: [w, t, d] as [number, number, number] },
      { p: [0, -h / 2 + t / 2, 0] as [number, number, number], s: [w, t, d] as [number, number, number] },
    ];
  }, []);
  const caja = useMemo(() => geoCache('bio02:caja', () => new THREE.BoxGeometry(1, 1, 1)), []);
  const aristas = useMemo(() => geoCache('bio02:aristas', () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1))), []);

  const cloros = useMemo(() => {
    const rnd = azar(5), out: { d: THREE.Vector3; rz: number; s: number }[] = [];
    for (let i = 0; i < 20; i++) {
      const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
      // proyecta a la superficie de una caja (capa de citoplasma pegada a la membrana)
      const m = Math.max(Math.abs(v.x) / 1, Math.abs(v.y) / 1, Math.abs(v.z) / 1) || 1;
      out.push({ d: v.divideScalar(m), rz: rnd() * Math.PI, s: 0.8 + rnd() * 0.4 });
    }
    return out;
  }, []);
  const iClo = useRef<THREE.InstancedMesh>(null);
  const esferaClo = useMemo(() => geoCache('bio02:clo', () => new THREE.SphereGeometry(1, 14, 10)), []);
  useLayoutEffect(() => {
    const m = iClo.current; if (!m) return;
    const o = new THREE.Object3D();
    const hx = (PARED.w - 2 * PARED.t) * kq / 2 - 0.2, hy = (PARED.h - 2 * PARED.t) * kq / 2 - 0.2, hz = (PARED.d - 2 * PARED.t) * kq / 2 - 0.2;
    cloros.forEach((c, i) => {
      o.position.set(c.d.x * Math.max(hx, 0.05), c.d.y * Math.max(hy, 0.05), c.d.z * Math.max(hz, 0.05));
      o.rotation.set(0, 0, c.rz); o.scale.set(0.2 * c.s, 0.11 * c.s, 0.11 * c.s);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [cloros, kq]);

  return (
    <group>
      {/* pared celulósica: rígida, no cambia con el volumen */}
      {losas.map((l, i) => (
        <group key={i} position={l.p} scale={l.s}>
          <mesh geometry={caja} material={mPared} renderOrder={4} />
          <lineSegments geometry={aristas} material={mLinea} />
        </group>
      ))}
      {/* protoplasto: membrana plasmática, vacuola, núcleo, cloroplastos */}
      <mesh geometry={gProto} material={mProto} renderOrder={2} />
      <mesh geometry={gVac} material={mVac} renderOrder={3} />
      <mesh material={mNuc} position={[-0.55 * kq, 0.28 * kq, 0.0]} scale={[0.3, 0.26, 0.26]}><sphereGeometry args={[1, 18, 14]} /></mesh>
      <instancedMesh ref={iClo} args={[esferaClo, mClo, cloros.length]} frustumCulled={false} />
    </group>
  );
}

// ───────────────────────────── partículas del medio ─────────────────────────────

export interface PropsMedio {
  na: number; cl: number; glucosa: number; interior: number;
  /** semi-extensión de la célula (caja que las partículas del medio no pueden invadir) */
  excluir: [number, number, number];
  /** escala del interior (radio del protoplasto) */
  escalaInterior: [number, number, number];
  /** sentido del agua: 1 entra, −1 sale, 0 estable */
  flujo: number;
}

const CAJA = { x: 5, y: 3, z: 2.8 };

/** Iones, glucosa y agua en el medio; solutos del citoplasma (conservados) dentro. */
export function Medio({ na, cl, glucosa, interior, excluir, escalaInterior, flujo }: PropsMedio) {
  const nTot = na + cl + glucosa;
  const N_AGUA = 28;
  const base = useMemo(() => {
    const rnd = azar(21);
    const mk = (n: number) => Array.from({ length: n }, () => ({ p: new THREE.Vector3((rnd() * 2 - 1) * CAJA.x, (rnd() * 2 - 1) * CAJA.y, (rnd() * 2 - 1) * CAJA.z), f: rnd() * 6, a: 0.25 + rnd() * 0.35 }));
    return { na: mk(80), cl: mk(80), glu: mk(80), agua: Array.from({ length: N_AGUA }, () => ({ u: rnd(), dir: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(), v: 0.18 + rnd() * 0.18 })), dentro: Array.from({ length: 40 }, () => ({ d: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(0.8), f: rnd() * 6 })) };
  }, []);
  const refs = { na: useRef<THREE.InstancedMesh>(null), cl: useRef<THREE.InstancedMesh>(null), glu: useRef<THREE.InstancedMesh>(null), agua: useRef<THREE.InstancedMesh>(null), dentro: useRef<THREE.InstancedMesh>(null) };
  const esf = useMemo(() => geoCache('bio02:esf-p', () => new THREE.SphereGeometry(1, 10, 8)), []);
  const dodeca = useMemo(() => geoCache('bio02:glu', () => new THREE.DodecahedronGeometry(1, 0)), []);
  const mNa = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#7f9fc4', roughness: 0.3, clearcoat: 0.4 }), []);
  const mCl = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#59a56a', roughness: 0.3, clearcoat: 0.4 }), []);
  const mGlu = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#d9a441', roughness: 0.35, clearcoat: 0.3 }), []);
  const mAgua = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#8fd0ee', roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 0.8 }), []);
  const mDentro = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#8d79a8', roughness: 0.4, transparent: true, opacity: 0.9 }), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const mover = (m: THREE.InstancedMesh | null, lista: typeof base.na, n: number, r: number) => {
      if (!m) return;
      m.count = Math.min(n, lista.length);
      for (let i = 0; i < m.count; i++) {
        const q = lista[i];
        tmp.set(q.p.x + Math.sin(t * q.a + q.f) * 0.35, q.p.y + Math.cos(t * q.a * 1.3 + q.f) * 0.3, q.p.z + Math.sin(t * q.a * 0.8 + q.f * 2) * 0.3);
        // fuera de la caja de exclusión: si cae dentro, se empuja a la cara más cercana
        if (Math.abs(tmp.x) < excluir[0] && Math.abs(tmp.y) < excluir[1] && tmp.z > -excluir[2]) {
          const dx = excluir[0] - Math.abs(tmp.x), dy = excluir[1] - Math.abs(tmp.y), dz = excluir[2] - Math.abs(tmp.z);
          // dentro de la huella de la célula sólo pueden estar DETRÁS de ella (nunca entre la cámara y la célula)
          void dx; void dy; void dz;
          tmp.z = -(excluir[2] + 0.1 + Math.abs(tmp.z) * 0.5);
        }
        o.position.copy(tmp); o.scale.setScalar(r); o.rotation.set(t * 0.3 + q.f, t * 0.2, 0);
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    };
    mover(refs.na.current, base.na, na, 0.055);
    mover(refs.cl.current, base.cl, cl, 0.07);
    mover(refs.glu.current, base.glu, glucosa, 0.075);
    // solutos del citoplasma: cantidad FIJA, dentro de la célula (la concentración la da el volumen)
    const di = refs.dentro.current;
    if (di) {
      di.count = interior;
      for (let i = 0; i < interior; i++) {
        const q = base.dentro[i % base.dentro.length];
        o.position.set(q.d.x * escalaInterior[0] * 0.8 + Math.sin(t * 0.7 + q.f) * 0.06, q.d.y * escalaInterior[1] * 0.8 + Math.cos(t * 0.6 + q.f) * 0.06, q.d.z * escalaInterior[2] * 0.8);
        o.scale.setScalar(0.07); o.rotation.set(0, 0, 0); o.updateMatrix(); di.setMatrixAt(i, o.matrix);
      }
      di.instanceMatrix.needsUpdate = true;
    }
    // agua: cruza la membrana en el sentido del flujo neto
    const ag = refs.agua.current;
    if (ag) {
      ag.count = flujo === 0 ? 0 : N_AGUA;
      for (let i = 0; i < ag.count; i++) {
        const q = base.agua[i];
        const u = (q.u + t * q.v * 0.5) % 1;           // 0 → 1
        const f = flujo > 0 ? 1 - u : u;                // entra: de fuera a dentro
        const rx = lerp(escalaInterior[0] * 0.55, excluir[0] + 0.9, f), ry = lerp(escalaInterior[1] * 0.55, excluir[1] + 0.9, f), rz = lerp(escalaInterior[2] * 0.55, excluir[2] + 0.9, f);
        o.position.set(q.dir.x * rx, q.dir.y * ry, q.dir.z * rz); o.scale.setScalar(0.04); o.rotation.set(0, 0, 0); o.updateMatrix(); ag.setMatrixAt(i, o.matrix);
      }
      ag.instanceMatrix.needsUpdate = true;
    }
  });
  void nTot;
  return (
    <group>
      <instancedMesh ref={refs.na} args={[esf, mNa, 80]} frustumCulled={false} />
      <instancedMesh ref={refs.cl} args={[esf, mCl, 80]} frustumCulled={false} />
      <instancedMesh ref={refs.glu} args={[dodeca, mGlu, 80]} frustumCulled={false} />
      <instancedMesh ref={refs.dentro} args={[esf, mDentro, 40]} frustumCulled={false} />
      <instancedMesh ref={refs.agua} args={[esf, mAgua, N_AGUA]} frustumCulled={false} />
    </group>
  );
}
