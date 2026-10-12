'use client';
/**
 * mat04/piezas.tsx — tanques de agua, prisma y utilería del lab de Pitágoras.
 *
 *  - `Tanque`: depósito cuadrado de vidrio con marco. El AGUA obedece a la
 *    gravedad: su superficie es siempre horizontal en el mundo, aunque el tanque
 *    esté girado (el de la hipotenusa). El nivel se calcula recortando el cuadrado
 *    girado con el semiplano y ≤ ℓ y buscando ℓ para el volumen pedido.
 *  - `PrismaTriangulo`: el triángulo rectángulo macizo, con el acabado del escenario.
 *  - `Barco`, `Pasamanos`, `FondoEscenario`: contexto de «navegación» y «rampas».
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useMateriales, cajaRedondeada, cilindro, extruir, crearLienzo, texturaDeLienzo, Etiqueta } from '../_kit';
import { geometriaBarras } from '../mat_comun_1a5/barras';

type GroupProps = ThreeElements['group'];
type P = [number, number];

export const PROF = 1.0;       // profundidad de los tanques (u)
const PARED = 0.06;            // espesor de pared (u)
export const COLOR_AGUA = '#2f98e0';

function useGeo<T extends THREE.BufferGeometry>(crear: () => T, deps: unknown[]): T {
  const g = useMemo(crear, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

// ───────────────────────────── nivel del agua ─────────────────────────────

/** Vértices (relativos al centro) de un cuadrado de lado `s` girado `ang` rad. */
export function cuadradoGirado(s: number, ang: number): P[] {
  const h = s / 2, c = Math.cos(ang), n = Math.sin(ang);
  return ([[-h, -h], [h, -h], [h, h], [-h, h]] as P[]).map(([x, y]) => [x * c - y * n, x * n + y * c]);
}

/** Recorta un polígono convexo con el semiplano y ≤ nivel (Sutherland–Hodgman). */
export function recortarNivel(poly: P[], nivel: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = a[1] - nivel, db = b[1] - nivel;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, nivel]); }
  }
  return out;
}

export function areaPoligono(p: P[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}

/** Polígono del agua para una fracción del volumen del cuadrado (0…1) y su nivel. */
export function aguaEnCuadrado(s: number, ang: number, fraccion: number): { poly: P[]; nivel: number } | null {
  const f = Math.min(1, Math.max(0, fraccion));
  if (f <= 1e-4) return null;
  const cuad = cuadradoGirado(s, ang);
  const total = s * s;
  let lo = Math.min(...cuad.map((v) => v[1])), hi = Math.max(...cuad.map((v) => v[1]));
  if (f >= 0.9999) return { poly: cuad, nivel: hi };
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (areaPoligono(recortarNivel(cuad, mid)) < f * total) lo = mid; else hi = mid;
  }
  const nivel = (lo + hi) / 2;
  return { poly: recortarNivel(cuad, nivel), nivel };
}

/** Prisma (profundidad `d`, centrado en z) con las caras no indexadas; la superficie libre más clara. */
export function prismaDePoligono(poly: P[], d: number, nivel: number): THREE.BufferGeometry {
  const pos: number[] = [], col: number[] = [];
  const base = new THREE.Color('#ffffff'), claro = new THREE.Color('#c9ecff');
  const tri = (a: number[], b: number[], c: number[], k: THREE.Color) => { pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) col.push(k.r, k.g, k.b); };
  const z0 = -d / 2, z1 = d / 2;
  const orden = areaConSigno(poly) >= 0 ? poly : [...poly].reverse();     // antihorario
  for (let i = 1; i < orden.length - 1; i++) {
    tri([orden[0][0], orden[0][1], z1], [orden[i][0], orden[i][1], z1], [orden[i + 1][0], orden[i + 1][1], z1], base);
    tri([orden[0][0], orden[0][1], z0], [orden[i + 1][0], orden[i + 1][1], z0], [orden[i][0], orden[i][1], z0], base);
  }
  for (let i = 0; i < orden.length; i++) {
    const a = orden[i], b = orden[(i + 1) % orden.length];
    const superficie = Math.abs(a[1] - nivel) < 1e-6 && Math.abs(b[1] - nivel) < 1e-6 && Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-6;
    const k = superficie ? claro : base;
    tri([a[0], a[1], z1], [a[0], a[1], z0], [b[0], b[1], z0], k);
    tri([a[0], a[1], z1], [b[0], b[1], z0], [b[0], b[1], z1], k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
const areaConSigno = (p: P[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };

// ───────────────────────────── tanque ─────────────────────────────

export interface PropsTanque extends Omit<GroupProps, 'position' | 'rotation'> {
  lado: number;
  centro: P;
  /** giro del tanque (rad, antihorario) */
  ang?: number;
  /** fracción de agua (0…1) */
  nivel: number;
  etiqueta?: string;
  tamEtiqueta?: number;
}

/** Tanque cuadrado de vidrio con marco de aluminio; el agua queda horizontal. */
export function Tanque({ lado, centro, ang = 0, nivel, etiqueta, tamEtiqueta = 0.4, ...g }: PropsTanque) {
  const m = useMateriales();
  const matVidrio = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#bcd7e6', transparent: true, opacity: 0.11, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide }), []);
  const matAgua = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOR_AGUA, vertexColors: true, transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0, side: THREE.DoubleSide }), []);
  useEffect(() => () => { matVidrio.dispose(); matAgua.dispose(); }, [matVidrio, matAgua]);

  const h = lado / 2, d = PROF / 2;
  const marco = useGeo(() => {
    const e: [number, number, number, number, number, number][] = [];
    const v = (x: number, y: number, z: number) => [x * h, y * h, z * d] as const;
    for (const sz of [-1, 1]) {
      e.push([...v(-1, -1, sz), ...v(1, -1, sz)], [...v(1, -1, sz), ...v(1, 1, sz)], [...v(1, 1, sz), ...v(-1, 1, sz)], [...v(-1, 1, sz), ...v(-1, -1, sz)]);
    }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) e.push([...v(sx, sy, -1), ...v(sx, sy, 1)]);
    return geometriaBarras(e, 0.05, 6);
  }, [lado]);
  const glass = useMemo(() => ({
    suelo: cajaRedondeada(lado, PARED, PROF, 0.01, 1), lado: cajaRedondeada(PARED, lado, PROF, 0.01, 1),
    frente: cajaRedondeada(lado, lado, 0.03, 0.01, 1),
  }), [lado]);

  const agua = useMemo(() => aguaEnCuadrado(lado - 2 * PARED, ang, nivel), [lado, ang, nivel]);
  const geoAgua = useMemo(() => (agua ? prismaDePoligono(agua.poly, PROF - 2 * PARED, agua.nivel) : null), [agua]);
  useEffect(() => () => geoAgua?.dispose(), [geoAgua]);

  return (
    <group position={[centro[0], centro[1], 0]} {...g}>
      {/* agua en coordenadas del mundo (no gira con el tanque) */}
      {geoAgua && <mesh geometry={geoAgua} material={matAgua} renderOrder={1} />}
      <group rotation-z={ang}>
        <mesh geometry={glass.suelo} material={matVidrio} position={[0, -h + PARED / 2, 0]} renderOrder={3} />
        <mesh geometry={glass.suelo} material={matVidrio} position={[0, h - PARED / 2, 0]} renderOrder={3} />
        <mesh geometry={glass.lado} material={matVidrio} position={[-h + PARED / 2, 0, 0]} renderOrder={3} />
        <mesh geometry={glass.lado} material={matVidrio} position={[h - PARED / 2, 0, 0]} renderOrder={3} />
        <mesh geometry={glass.frente} material={matVidrio} position={[0, 0, d]} renderOrder={3} />
        <mesh geometry={glass.frente} material={matVidrio} position={[0, 0, -d]} renderOrder={3} />
        <mesh geometry={marco} material={m.aluminio} />
      </group>
      {etiqueta && <Etiqueta modo="plano" texto={etiqueta} color="#ffffff" fondo="rgba(16,24,32,0.9)" peso={700} tamano={tamEtiqueta} position={[0, 0, d + 0.08]} />}
    </group>
  );
}

// ───────────────────────────── prisma del triángulo ─────────────────────────────

function texConcreto() {
  const c = crearLienzo(256, 256), ctx = c.getContext('2d')!;
  ctx.fillStyle = '#a9afb1'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) { ctx.fillStyle = `rgba(${90 + (i * 37) % 70},${95 + (i * 53) % 70},${100 + (i * 29) % 60},0.22)`; ctx.fillRect((i * 97) % 256, (i * 61) % 256, 2, 2); }
  return texturaDeLienzo(c);
}
function texCarta() {
  const c = crearLienzo(256, 256), ctx = c.getContext('2d')!;
  ctx.fillStyle = '#e7f0f3'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(40,110,150,0.45)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, 256); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 32); ctx.lineTo(256, i * 32); ctx.stroke(); }
  return texturaDeLienzo(c);
}

export type Escenario = 'pitagoras_basico' | 'diseno_rampas' | 'navegacion_maritima';

/** Triángulo rectángulo macizo: ángulo recto en el origen, catetos sobre +x (a) y +y (b). */
export function PrismaTriangulo({ a, b, escenario }: { a: number; b: number; escenario: Escenario }) {
  const m = useMateriales();
  const geo = useGeo(() => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(a, 0); s.lineTo(0, b); s.closePath();
    const g = extruir(s, 0.5); g.translate(0, 0, -0.25);
    // UV en unidades de mundo para que el patrón no se estire al cambiar a o b
    const uv = g.getAttribute('uv') as THREE.BufferAttribute, p = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 3, p.getY(i) / 3);
    return g;
  }, [a, b]);
  const tex = useMemo(() => (typeof document === 'undefined' ? null : escenario === 'diseno_rampas' ? texConcreto() : escenario === 'navegacion_maritima' ? texCarta() : null), [escenario]);
  useEffect(() => { if (tex) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true; } return () => tex?.dispose(); }, [tex]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: tex ? (escenario === 'diseno_rampas' ? '#d9c9a6' : '#ffffff') : '#51636d', map: tex, roughness: 0.75, metalness: 0.05 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const geoBorde = useGeo(() => geometriaBarras([[0, 0, 0.26, a, 0, 0.26], [a, 0, 0.26, 0, b, 0.26], [0, b, 0.26, 0, 0, 0.26]], 0.025, 6), [a, b]);
  return (
    <group>
      <mesh geometry={geo} material={mat} />
      <mesh geometry={geoBorde} material={m.aluminio} />
      {/* marca del ángulo recto */}
      <mesh geometry={cajaRedondeada(0.32, 0.32, 0.02, 0.005, 1)} material={m.carcasaClara} position={[0.2, 0.2, 0.27]} />
    </group>
  );
}

// ───────────────────────────── utilería de escenarios ─────────────────────────────

/** Barco de carga visto de costado (eslora `L`, el origen en la línea de flotación al centro). */
export function Barco({ L = 2, ...g }: { L?: number } & GroupProps) {
  const m = useMateriales();
  const casco = useGeo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0.18); s.lineTo(0.45, 0.18); s.lineTo(0.56, 0.18); s.lineTo(0.4, -0.14); s.lineTo(-0.44, -0.14); s.closePath();
    const g2 = extruir(s, 0.26); g2.translate(0, 0, -0.13); return g2;
  }, []);
  return (
    <group scale={L} {...g}>
      <mesh geometry={casco} material={m.pintura('#9b2d30')} />
      <mesh geometry={cajaRedondeada(0.62, 0.035, 0.27, 0.01, 1)} material={m.pintura('#e8e6df')} position={[0.0, 0.185, 0]} />
      <mesh geometry={cajaRedondeada(0.22, 0.2, 0.22, 0.015, 1)} material={m.pintura('#f1efe8')} position={[-0.3, 0.3, 0]} />
      <mesh geometry={cajaRedondeada(0.1, 0.07, 0.2, 0.01, 1)} material={m.carcasaOscura} position={[-0.3, 0.34, 0]} />
      <mesh geometry={cilindro(0.04, 0.045, 0.12, 12)} material={m.pintura('#c1453a')} position={[-0.3, 0.46, 0]} />
      {[-0.05, 0.12, 0.29].map((x, i) => (
        <mesh key={i} geometry={cajaRedondeada(0.14, 0.1, 0.2, 0.01, 1)} material={m.pintura(['#2a6f97', '#d68c45', '#4c956c'][i])} position={[x, 0.24, 0]} />
      ))}
    </group>
  );
}

/** Pasamanos de rampa paralelo a la hipotenusa, del lado del triángulo. */
export function Pasamanos({ a, b }: { a: number; b: number }) {
  const m = useMateriales();
  const h = Math.hypot(a, b);
  const geo = useGeo(() => {
    // en el plano de la rampa: de (a,0) a (0,b); el pasamanos queda 0,32 u hacia el ángulo recto y 0,5 u sobre el plano
    const nx = -b / h, ny = -a / h;        // normal hacia el interior (el ángulo recto)
    const off = 0.34, z = 0.55;
    const P0 = [a + nx * off, 0 + ny * off], P1 = [0 + nx * off, b + ny * off];
    const barras: [number, number, number, number, number, number][] = [[P0[0], P0[1], z, P1[0], P1[1], z], [P0[0], P0[1], z * 0.45, P1[0], P1[1], z * 0.45]];
    const n = Math.max(2, Math.round(h / 1.4));
    for (let i = 0; i <= n; i++) { const t = i / n; const x = P0[0] + (P1[0] - P0[0]) * t, y = P0[1] + (P1[1] - P0[1]) * t; barras.push([x, y, 0.26, x, y, z]); }
    return geometriaBarras(barras, 0.03, 6);
  }, [a, b]);
  return <mesh geometry={geo} material={m.pintura('#f2b705')} />;
}

/** Telón de fondo del escenario (cielo y mar, o muro de obra), dibujado, sin red. */
export function FondoEscenario({ escenario, centro }: { escenario: Escenario; centro: P }) {
  const tex = useMemo(() => {
    if (typeof document === 'undefined' || escenario === 'pitagoras_basico') return null;
    const c = crearLienzo(1024, 640), ctx = c.getContext('2d')!;
    if (escenario === 'navegacion_maritima') {
      const cielo = ctx.createLinearGradient(0, 0, 0, 300); cielo.addColorStop(0, '#6fa6c9'); cielo.addColorStop(1, '#cfe3ee');
      ctx.fillStyle = cielo; ctx.fillRect(0, 0, 1024, 300);
      const mar = ctx.createLinearGradient(0, 300, 0, 640); mar.addColorStop(0, '#2c7ba6'); mar.addColorStop(1, '#14486b');
      ctx.fillStyle = mar; ctx.fillRect(0, 300, 1024, 340);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
      for (let j = 0; j < 14; j++) { const y = 310 + j * 24; ctx.beginPath(); for (let x = 0; x <= 1024; x += 8) { const yy = y + Math.sin(x * 0.04 + j) * 3; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
    } else {
      ctx.fillStyle = '#56626a'; ctx.fillRect(0, 0, 1024, 640);
      ctx.strokeStyle = 'rgba(20,28,32,0.45)'; ctx.lineWidth = 3;
      for (let x = 0; x <= 1024; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 640); ctx.stroke(); }
      for (let y = 0; y <= 640; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
      ctx.fillStyle = '#e9b400'; ctx.fillRect(0, 560, 1024, 40);
      ctx.fillStyle = '#20262a'; for (let x = -40; x < 1100; x += 80) { ctx.beginPath(); ctx.moveTo(x, 600); ctx.lineTo(x + 40, 600); ctx.lineTo(x + 80, 560); ctx.lineTo(x + 40, 560); ctx.fill(); }
    }
    return texturaDeLienzo(c);
  }, [escenario]);
  useEffect(() => () => tex?.dispose(), [tex]);
  const mat = useMemo(() => (tex ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : null), [tex]);
  useEffect(() => () => mat?.dispose(), [mat]);
  const plano = useGeo(() => new THREE.PlaneGeometry(120, 75), []);
  if (!mat) return null;
  return <mesh geometry={plano} material={mat} position={[centro[0], centro[1], -3]} />;
}

