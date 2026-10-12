'use client';
/**
 * mat10/piezas.tsx — la estructura de la máquina de Galton: tablero de pizarra con
 * marco de madera, clavos de acero, embudo, tabiques de acrílico entre los
 * contenedores y la repisa con la numeración de cada uno (k = nº de desvíos a la
 * derecha, 0…10).
 *
 * Geometría en las unidades de la escena: separación entre clavos = 1 u; la fila
 * superior de clavos está en y = FILAS, la última en y = 1; los contenedores
 * apoyan en y = Y_BASE.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Etiqueta, useMateriales } from '../_kit';

export const FILAS = 10;
export const COLS = FILAS + 1;
export const SEP = 1;
export const Y_BASE = -3.2;       // piso de los contenedores (techo de la repisa)
export const ALTO_TABLERO_MAX = 14.6;
const W = COLS * SEP + 1.4;       // ancho del tablero

/** Clavos de acero: cilindros horizontales (eje z) en una malla instanciada. */
export function Clavos() {
  const m = useMateriales();
  const ref = useRef<THREE.InstancedMesh>(null);
  const pos = useMemo(() => {
    const ps: [number, number][] = [];
    for (let fila = 0; fila < FILAS; fila++) {
      const y = (FILAS - fila) * SEP, num = fila + 1, ancho = (num - 1) * SEP;
      for (let i = 0; i < num; i++) ps.push([-ancho / 2 + i * SEP, y]);
    }
    return ps;
  }, []);
  const geo = useMemo(() => { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16); g.rotateX(Math.PI / 2); return g; }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useLayoutEffect(() => {
    const mesh = ref.current; if (!mesh) return;
    const o = new THREE.Object3D();
    pos.forEach(([x, y], i) => { o.position.set(x, y, -0.15); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); });
    mesh.instanceMatrix.needsUpdate = true;
  }, [pos]);
  return <instancedMesh ref={ref} args={[geo, m.impreso('#d5dde1'), pos.length]} castShadow />;
}

/** Tablero, marco, embudo, tabiques y repisa numerada. `cuentas` rotula cuántas bolitas hay en cada contenedor. */
export function MarcoGalton({ cuentas }: { cuentas: number[] | null }) {
  const m = useMateriales();
  const altoTab = 13.9 - Y_BASE;       // de la repisa a la parte alta del embudo
  const yCentro = Y_BASE + altoTab / 2;
  const matAcrilico = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bfe8ff', roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }), []);
  useEffect(() => () => matAcrilico.dispose(), [matAcrilico]);
  const etiquetas: React.ReactNode[] = [];
  for (let k = 0; k < COLS; k++) {
    const x = (k - (COLS - 1) / 2) * SEP;
    etiquetas.push(<Etiqueta key={'k' + k} modo="plano" texto={String(k)} color="#10212b" peso={700} tamano={0.5} position={[x, Y_BASE - 0.55, 0.72]} />);
    if (cuentas) etiquetas.push(<Etiqueta key={'c' + k} modo="plano" texto={String(cuentas[k] ?? 0)} color="#7a2e0b" peso={600} tamano={0.42} position={[x, Y_BASE - 1.28, 0.72]} />);
  }
  return (
    <group>
      {/* pizarra de fondo y marco de madera */}
      <mesh material={m.pintura('#26343c')} position={[0, yCentro, -0.5]}><boxGeometry args={[W, altoTab, 0.2]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.madera} position={[s * (W / 2 + 0.17), yCentro, 0]}><boxGeometry args={[0.34, altoTab, 1.1]} /></mesh>
      ))}
      <mesh material={m.madera} position={[0, Y_BASE + altoTab + 0.12, 0]}><boxGeometry args={[W + 0.68, 0.34, 1.1]} /></mesh>
      {/* repisa con la numeración */}
      <mesh material={m.madera} position={[0, Y_BASE - 0.95, 0.1]}><boxGeometry args={[W + 0.68, 1.9, 1.2]} /></mesh>
      <mesh material={m.impreso('#e9e2cf')} position={[0, Y_BASE - 0.78, 0.705]}><boxGeometry args={[W - 0.3, 1.45, 0.02]} /></mesh>
      <Etiqueta modo="plano" texto="k" color="#5b6770" peso={600} tamano={0.34} ancla={[0, 0.5]} position={[-W / 2 + 0.25, Y_BASE - 0.55, 0.72]} />
      {cuentas && <Etiqueta modo="plano" texto="N" color="#5b6770" peso={600} tamano={0.34} ancla={[0, 0.5]} position={[-W / 2 + 0.25, Y_BASE - 1.28, 0.72]} />}
      {etiquetas}
      {/* tabiques de acrílico entre contenedores */}
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <mesh key={i} material={matAcrilico} position={[(i - COLS / 2) * SEP, Y_BASE + 2.0, 0]}><boxGeometry args={[0.05, 4.0, 0.7]} /></mesh>
      ))}
      {/* embudo */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.acero} position={[s * 0.62, FILAS + 2.3, 0]} rotation-z={-s * 0.3}><boxGeometry args={[0.14, 2.2, 0.9]} /></mesh>
      ))}
    </group>
  );
}
