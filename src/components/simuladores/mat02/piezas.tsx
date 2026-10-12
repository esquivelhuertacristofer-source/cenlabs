'use client';
/**
 * mat02/piezas.tsx — objetivos y emisores del lab de sistemas 2×2.
 *
 *  - `Satelite`, `PosteCruce`, `TorreCelosia`: el objetivo según el escenario.
 *  - `EmisorLaser`: la estación que dispara cada haz (la recta) a lo largo de su dirección.
 *
 * Todas miran a +Z (el alumno), se apoyan en el origen de su grupo y mide ≈ 1,6 u
 * (el plano de las rectas va de −10 a 10, así que se reconocen sin tapar el cruce).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { geometriaBarras } from '../mat_comun_1a5/barras';
import { useMateriales, cajaRedondeada, cilindro, esfera, extruir, texturaCompartida, tornear, Etiqueta } from '../_kit';

type GroupProps = ThreeElements['group'];

function useGeo<T extends THREE.BufferGeometry>(crear: () => T, deps: unknown[]): T {
  const g = useMemo(crear, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

// ───────────────────────────── satélite ─────────────────────────────

function texPanelSolar() {
  return texturaCompartida('mat02-panel-solar', 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#16356b'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8fb3e8'; ctx.lineWidth = 1.5;
    for (let x = 0; x <= w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += h / 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#c9d6ea'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
  });
}

/** Satélite de comunicaciones: cuerpo con manta dorada, dos paneles solares y antena parabólica. */
export function Satelite({ ...g }: GroupProps) {
  const m = useMateriales();
  const tex = texPanelSolar();
  const matPanel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.35, metalness: 0.5 }), [tex]);
  useEffect(() => () => matPanel.dispose(), [matPanel]);
  const matOro = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9a93b', roughness: 0.38, metalness: 0.75 }), []);
  useEffect(() => () => matOro.dispose(), [matOro]);
  const cuerpo = cajaRedondeada(0.62, 0.62, 0.62, 0.05, 2);
  const panel = cajaRedondeada(1.15, 0.5, 0.03, 0.01, 1);
  // plato: casquete torneado (r, y)
  const plato = useGeo(() => tornear([[0, 0], [0.1, 0.012], [0.2, 0.04], [0.27, 0.085], [0.265, 0.095], [0.19, 0.055], [0.1, 0.028], [0, 0.02]], 28), []);
  return (
    <group {...g}>
      <mesh geometry={cuerpo} material={matOro} castShadow />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={cilindro(0.025, 0.025, 0.36, 8)} material={m.aluminio} rotation-z={Math.PI / 2} position={[s * 0.46, 0, 0]} />
          <mesh geometry={panel} material={matPanel} position={[s * 1.2, 0, 0]} castShadow />
        </group>
      ))}
      {/* mástil y plato */}
      <mesh geometry={cilindro(0.025, 0.03, 0.26, 8)} material={m.aluminio} position={[0, 0.44, 0]} />
      <mesh geometry={plato} material={m.carcasaClara} position={[0, 0.57, 0]} rotation={[Math.PI / 2 - 0.35, 0, 0]} scale={1.15} />
      <mesh geometry={esfera(0.025, 8)} material={m.emisor('#ff5a4d', 1.5)} position={[0, 0.66, 0.1]} />
      {/* franja de radiador */}
      <mesh geometry={cajaRedondeada(0.64, 0.1, 0.64, 0.02, 1)} material={m.carcasaOscura} position={[0, -0.18, 0]} />
    </group>
  );
}

// ───────────────────────────── torre de celosía ─────────────────────────────

/** Torre de telecomunicaciones de celosía con paneles sectoriales y baliza. */
export function TorreCelosia({ ...g }: GroupProps) {
  const m = useMateriales();
  const geo = useGeo(() => {
    const H = 1.7, b0 = 0.28, b1 = 0.08, niveles = 6;
    const barras: [number, number, number, number, number, number][] = [];
    const lado = (y: number) => b0 + (b1 - b0) * (y / H);
    const esq = (y: number) => { const l = lado(y); return [[-l, y, -l], [l, y, -l], [l, y, l], [-l, y, l]] as [number, number, number][]; };
    const e0 = esq(0), e1 = esq(H);
    for (let i = 0; i < 4; i++) barras.push([...e0[i], ...e1[i]] as never);
    for (let k = 0; k < niveles; k++) {
      const ya = (H * k) / niveles, yb = (H * (k + 1)) / niveles;
      const A = esq(ya), B = esq(yb);
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        barras.push([...B[i], ...B[j]] as never);               // anillo superior
        barras.push([...A[i], ...B[j]] as never);               // diagonal
      }
    }
    return geometriaBarras(barras, 0.012);
  }, []);
  return (
    <group {...g}>
      <mesh geometry={geo} material={m.hierroPintado} castShadow />
      <mesh geometry={cajaRedondeada(0.9, 0.06, 0.9, 0.01, 1)} material={m.carcasaOscura} position={[0, 0.03, 0]} />
      {/* paneles sectoriales */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cajaRedondeada(0.07, 0.4, 0.03, 0.01, 1)} material={m.carcasaClara} position={[s * 0.15, 1.45, 0.14]} />
      ))}
      <mesh geometry={cilindro(0.012, 0.012, 0.35, 6)} material={m.aluminio} position={[0, 1.88, 0]} />
      <mesh geometry={esfera(0.05, 12)} material={m.emisor('#ff4d3d', 2)} position={[0, 2.08, 0]} />
    </group>
  );
}

// ───────────────────────────── poste de cruce de rutas ─────────────────────────────

function flecha(l: number, h: number, haciaDerecha: boolean): THREE.Shape {
  const s = new THREE.Shape();
  const p = 0.3 * h;
  if (haciaDerecha) { s.moveTo(-l / 2, -h / 2); s.lineTo(l / 2 - p, -h / 2); s.lineTo(l / 2, 0); s.lineTo(l / 2 - p, h / 2); s.lineTo(-l / 2, h / 2); }
  else { s.moveTo(l / 2, -h / 2); s.lineTo(-l / 2 + p, -h / 2); s.lineTo(-l / 2, 0); s.lineTo(-l / 2 + p, h / 2); s.lineTo(l / 2, h / 2); }
  s.closePath();
  return s;
}

/** Poste con dos señales de ruta que se cruzan (el punto donde coinciden las dos rutas). */
export function PosteCruce({ ...g }: GroupProps) {
  const m = useMateriales();
  const gA = useGeo(() => extruir(flecha(1.1, 0.34, true), 0.03), []);
  const gB = useGeo(() => extruir(flecha(1.1, 0.34, false), 0.03), []);
  return (
    <group {...g}>
      <mesh geometry={cilindro(0.04, 0.05, 1.7, 10)} material={m.aluminio} position={[0, 0.85, 0]} castShadow />
      <mesh geometry={cilindro(0.1, 0.12, 0.06, 14)} material={m.carcasaOscura} position={[0, 0.03, 0]} />
      <mesh geometry={gA} material={m.pintura('#1c7c54')} position={[0.04, 1.42, 0.06]} castShadow />
      <mesh geometry={gB} material={m.pintura('#1565a8')} position={[-0.04, 1.0, 0.06]} castShadow />
      <Etiqueta modo="plano" texto="Ruta A" color="#ffffff" peso={700} tamano={0.13} position={[-0.02, 1.42, 0.1]} />
      <Etiqueta modo="plano" texto="Ruta B" color="#ffffff" peso={700} tamano={0.13} position={[0.02, 1.0, 0.1]} />
      <mesh geometry={esfera(0.045, 10)} material={m.emisor('#ffb703', 1.6)} position={[0, 1.74, 0]} />
    </group>
  );
}

// ───────────────────────────── emisor láser ─────────────────────────────

/**
 * Estación emisora: base, rótula y cañón que apunta hacia +X local (gírala en Z
 * con el ángulo de la recta). `color` es el del haz.
 */
export function EmisorLaser({ color, ...g }: { color: string } & GroupProps) {
  const m = useMateriales();
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(0.46, 0.2, 0.34, 0.03, 2)} material={m.carcasaOscura} position={[-0.05, 0, 0]} castShadow />
      <mesh geometry={esfera(0.16, 16)} material={m.carcasaClara} position={[0, 0, 0]} />
      <mesh geometry={cilindro(0.09, 0.11, 0.55, 16)} material={m.aluminio} rotation-z={-Math.PI / 2} position={[0.32, 0, 0]} castShadow />
      <mesh geometry={cilindro(0.075, 0.075, 0.03, 16)} material={m.emisor(color, 2.2)} rotation-z={-Math.PI / 2} position={[0.6, 0, 0]} />
    </group>
  );
}
