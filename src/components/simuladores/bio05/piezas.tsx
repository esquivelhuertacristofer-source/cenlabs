'use client';
/**
 * bio05/piezas.tsx — guisantes de Mendel: semillas lisas y rugosas, vainas de los
 * progenitores, tablero de Punnett y el conteo por fenotipo.
 *
 * Clases fenotípicas (mismo orden que FENOTIPOS_B5):
 *   0 amarilla-lisa · 1 amarilla-rugosa · 2 verde-lisa · 3 verde-rugosa
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useMateriales, cajaRedondeada, geoCache, azar, sanearNormales, Etiqueta } from '../_kit';
import { claseFenotipoB5 } from '@/domain/biologia';

export const CLASES = [
  { amarilla: true, lisa: true }, { amarilla: true, lisa: false }, { amarilla: false, lisa: true }, { amarilla: false, lisa: false },
] as const;
const COLOR_AMARILLO = '#d9b042', COLOR_VERDE = '#7da64a';

// ───────────────────────────── semillas ─────────────────────────────

export function geoLisa(): THREE.BufferGeometry {
  return geoCache('bio05:lisa', () => { const g = new THREE.SphereGeometry(1, 18, 14); g.scale(1, 0.93, 0.97); return g; });
}
/** Guisante rugoso (deshidratado, con almidón distinto): esfera con arrugas de baja frecuencia. */
export function geoRugosa(): THREE.BufferGeometry {
  return geoCache('bio05:rugosa', () => {
    let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 4);
    g.deleteAttribute('normal'); g.deleteAttribute('uv');
    g = mergeVertices(g, 1e-4);
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      const a = 0.11 * Math.sin(5.1 * v.x + 1.3) * Math.sin(4.6 * v.y + 0.4)
        + 0.08 * Math.sin(6.3 * v.z + 2.1) * Math.cos(5.4 * v.x)
        + 0.06 * Math.sin(8.7 * v.y + 4.0 * v.z);
      const r = 0.9 + a;
      p.setXYZ(i, v.x * r, v.y * r * 0.9, v.z * r * 0.95);
    }
    g.computeVertexNormals(); sanearNormales(g);
    return g;
  });
}

export function useMaterialSemilla(amarilla: boolean, lisa: boolean) {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: amarilla ? COLOR_AMARILLO : COLOR_VERDE, roughness: lisa ? 0.42 : 0.7, clearcoat: lisa ? 0.35 : 0.05, clearcoatRoughness: 0.4,
    sheen: 0.4, sheenColor: new THREE.Color(amarilla ? '#f4e2a0' : '#c2e096'), sheenRoughness: 0.5,
  }), [amarilla, lisa]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

/** Una semilla suelta (para vainas y tablero). */
export function Semilla({ clase, escala = 1, ...g }: { clase: number; escala?: number } & React.ComponentProps<'group'>) {
  const c = CLASES[clase] ?? CLASES[0];
  const mat = useMaterialSemilla(c.amarilla, c.lisa);
  return <group {...g}><mesh geometry={c.lisa ? geoLisa() : geoRugosa()} material={mat} scale={0.1 * escala} castShadow /></group>;
}

// ───────────────────────────── conteo por fenotipo (cristalizador) ─────────────────────────────

const CAPAS = [{ n: 46, r: 0.6, y: 0.1 }, { n: 42, r: 0.5, y: 0.2 }, { n: 34, r: 0.38, y: 0.3 }];
const MAX_VIS = CAPAS.reduce((s, c) => s + c.n, 0);

/** Posiciones de las semillas en capas, relajadas para que no se solapen (determinista). */
function posicionesMonton(semilla: number): [number, number, number][] {
  const rnd = azar(semilla), out: [number, number, number][] = [];
  const rS = 0.1;
  for (const capa of CAPAS) {
    const pts: [number, number][] = Array.from({ length: capa.n }, () => { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * capa.r; return [Math.cos(a) * r, Math.sin(a) * r]; });
    for (let it = 0; it < 28; it++) {
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j][0] - pts[i][0], dz = pts[j][1] - pts[i][1], d = Math.hypot(dx, dz);
        if (d < rS * 2.05 && d > 1e-6) { const f = (rS * 2.05 - d) / 2 / d; pts[i][0] -= dx * f; pts[i][1] -= dz * f; pts[j][0] += dx * f; pts[j][1] += dz * f; }
      }
      for (const p of pts) { const r = Math.hypot(p[0], p[1]); if (r > capa.r) { p[0] *= capa.r / r; p[1] *= capa.r / r; } }
    }
    for (const p of pts) out.push([p[0], capa.y, p[1]]);
  }
  return out;
}

/** Montón de semillas de una clase, con aparición escalonada cuando llega una cosecha nueva. */
export function MontonSemillas({ clase, n, llegada }: { clase: number; n: number; llegada: { current: number } }) {
  const c = CLASES[clase];
  const mat = useMaterialSemilla(c.amarilla, c.lisa);
  const pos = useMemo(() => posicionesMonton(11 + clase * 7), [clase]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const rot = useMemo(() => { const r = azar(70 + clase); return Array.from({ length: MAX_VIS }, () => [r() * 6, r() * 6, r() * 6] as const); }, [clase]);
  const cuenta = Math.min(MAX_VIS, n);
  useLayoutEffect(() => { if (ref.current) ref.current.count = cuenta; }, [cuenta]);
  useFrame(({ clock }) => {
    const m = ref.current; if (!m) return;
    const t = clock.elapsedTime - llegada.current;
    m.count = cuenta;
    for (let i = 0; i < cuenta; i++) {
      const k = Math.min(1, Math.max(0, (t - 0.05 - i * 0.006) / 0.3));
      const e = k * k * (3 - 2 * k);
      const p = pos[i];
      o.position.set(p[0], p[1] + (1 - e) * 0.9, p[2]);
      o.rotation.set(rot[i][0], rot[i][1], rot[i][2]);
      o.scale.setScalar(0.1 * Math.max(0.001, e));
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh key={clase} ref={ref} args={[c.lisa ? geoLisa() : geoRugosa(), mat, MAX_VIS]} frustumCulled={false} castShadow />;
}

// ───────────────────────────── vaina del progenitor ─────────────────────────────

/** Vaina abierta con guisantes del fenotipo del progenitor. Largo ≈ 2,3 u. */
export function Vaina({ genotipo, agitar = false }: { genotipo: string; agitar?: boolean }) {
  const m = useMateriales();
  const clase = claseFenotipoB5(genotipo);
  const tapa = useMemo(() => geoCache('bio05:valva', () => new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), []);
  const verde = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#5f9a47', roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#bde08c'), clearcoat: 0.2, side: THREE.DoubleSide }), []);
  const interior = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#cfe3a6', roughness: 0.6, side: THREE.DoubleSide }), []);
  useEffect(() => () => { verde.dispose(); interior.dispose(); }, [verde, interior]);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (g.current) g.current.rotation.z = agitar ? Math.sin(clock.elapsedTime * 18) * 0.02 : 0; });
  void m;
  return (
    <group ref={g}>
      {/* valva inferior (cuenco) y valva superior abierta hacia atrás */}
      <mesh geometry={tapa} material={verde} position={[0, 0.2, 0]} scale={[1.15, 0.3, 0.34]} castShadow />
      <mesh geometry={tapa} material={interior} position={[0, 0.2, 0]} scale={[1.1, 0.26, 0.3]} />
      <group position={[0, 0.2, -0.3]} rotation={[-2.3, 0, 0]}>
        <mesh geometry={tapa} material={verde} scale={[1.15, 0.3, 0.34]} rotation={[Math.PI, 0, 0]} castShadow />
      </group>
      {/* guisantes en fila, unidos por el funículo */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => <Semilla key={i} clase={clase} position={[x, 0.3, ((i % 2) - 0.5) * 0.06]} escala={1.15} />)}
    </group>
  );
}

// ───────────────────────────── tablero de Punnett ─────────────────────────────

const unir = (g1: string, g2: string) => [g1[0], g2[0]].sort().join('') + [g1[1], g2[1]].sort().join('');
/** Los cuatro gametos de un genotipo AaBb (con repetición, como en el tablero clásico). */
export function cuatroGametos(g: string): string[] { const o: string[] = []; for (const a of g.slice(0, 2)) for (const b of g.slice(2, 4)) o.push(a + b); return o; }

const CELDA = 0.66;
export function TableroPunnett({ padre1, padre2 }: { padre1: string; padre2: string }) {
  const m = useMateriales();
  const g1 = cuatroGametos(padre1), g2 = cuatroGametos(padre2);
  const W = CELDA * 4 + 0.7, H = CELDA * 4 + 0.7;
  const matCelda = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#8a6a47', roughness: 0.7 }), []);
  useEffect(() => () => matCelda.dispose(), [matCelda]);
  const x0 = -W / 2 + 0.7 + CELDA / 2, y0 = H / 2 - 0.7 - CELDA / 2;
  return (
    <group>
      <mesh geometry={cajaRedondeada(W, H, 0.07, 0.03, 2)} material={m.madera} castShadow receiveShadow />
      {g1.map((g, c) => <Etiqueta key={'c' + c} texto={g} position={[x0 + c * CELDA, H / 2 - 0.3, 0.06]} tamano={0.2} color="#2b1d10" peso={700} fondo={null} />)}
      {g2.map((g, r) => <Etiqueta key={'r' + r} texto={g} position={[-W / 2 + 0.35, y0 - r * CELDA, 0.06]} tamano={0.2} color="#2b1d10" peso={700} fondo={null} />)}
      {g2.map((gr, r) => g1.map((gc, c) => {
        const geno = unir(gc, gr), clase = claseFenotipoB5(geno);
        const x = x0 + c * CELDA, y = y0 - r * CELDA;
        return (
          <group key={r + '-' + c} position={[x, y, 0.04]}>
            <mesh geometry={cajaRedondeada(CELDA * 0.9, CELDA * 0.9, 0.03, 0.02, 1)} material={matCelda} position={[0, 0, 0.0]} />
            <Semilla clase={clase} escala={1.25} position={[0, 0.07, 0.07]} />
            <Etiqueta texto={geno} position={[0, -0.2, 0.06]} tamano={0.12} color="#fff6e6" peso={700} fondo={null} />
          </group>
        );
      }))}
    </group>
  );
}
