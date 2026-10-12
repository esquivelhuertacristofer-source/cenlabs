'use client';
/**
 * mat07/piezas.tsx — el montaje de óptica de la ley de Snell, visto desde arriba
 * como en la mesa: un DISCO ÓPTICO de cartulina con escala angular (0° en la
 * normal, 1° por marca, números cada 10° en los cuatro cuadrantes), un BLOQUE
 * SEMICIRCULAR de vidrio acrílico apoyado en él (la cara plana es la interfaz y el
 * rayo refractado sale por la curva sin desviarse) y un APUNTADOR LÁSER.
 *
 * Origen = punto de incidencia, +Y = normal hacia el aire, +X a la derecha, la
 * cartulina en z = 0 y el haz a z = ALTURA_HAZ (a media altura del bloque).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { Etiqueta, cilindro, extruir, useMateriales } from '../_kit';

type GroupProps = ThreeElements['group'];

export const R_DISCO = 7.1;       // radio de la cartulina
export const R_BLOQUE = 5.6;      // radio del bloque semicircular
export const ESPESOR_BLOQUE = 1;  // alto del bloque sobre la cartulina
export const ALTURA_HAZ = ESPESOR_BLOQUE / 2;
const R_ESCALA = 5.7;             // la escala empieza justo fuera del bloque
const TINTA = '#1d2b33';
const PAPEL = '#f1ede3';

/** Marcas de la escala: un rectángulo fino por grado, en una sola geometría. */
function geometriaMarcas(): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const marca = (gradosDesdeNormal: number, largo: number, ancho: number) => {
    const a = (gradosDesdeNormal * Math.PI) / 180;
    const dx = Math.sin(a), dy = Math.cos(a);   // radial
    const nx = dy, ny = -dx;                    // tangencial
    const r0 = R_ESCALA, r1 = R_ESCALA + largo, w = ancho / 2;
    const b = pos.length / 3;
    pos.push(dx * r0 - nx * w, dy * r0 - ny * w, 0, dx * r0 + nx * w, dy * r0 + ny * w, 0,
      dx * r1 + nx * w, dy * r1 + ny * w, 0, dx * r1 - nx * w, dy * r1 - ny * w, 0);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  for (let g = 0; g < 360; g++) {
    const r = g % 10 === 0 ? [0.46, 0.05] : g % 5 === 0 ? [0.3, 0.036] : [0.17, 0.024];
    marca(g, r[0], r[1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

/** Disco óptico: cartulina, escala graduada y recta normal a rayas. */
export function DiscoOptico(props: GroupProps) {
  const m = useMateriales();
  const marcas = useMemo(geometriaMarcas, []);
  useEffect(() => () => marcas.dispose(), [marcas]);
  const matTinta = useMemo(() => new THREE.MeshBasicMaterial({ color: TINTA, toneMapped: false, side: THREE.DoubleSide }), []);
  useEffect(() => () => matTinta.dispose(), [matTinta]);
  const numeros: React.ReactNode[] = [];
  for (let g = 0; g <= 90; g += 10) {
    const s = Math.sin((g * Math.PI) / 180), c = Math.cos((g * Math.PI) / 180);
    const r = 6.6;
    const cuadrantes: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
    cuadrantes.forEach(([sx, sy], i) => {
      // 0° y 90° se repiten en dos cuadrantes: se dibujan una vez por posición
      if ((g === 0 && sx === -1) || (g === 90 && sy === -1)) return;
      numeros.push(<Etiqueta key={`${g}-${i}`} modo="plano" texto={String(g)} color={TINTA} peso={600} tamano={0.5}
        position={[sx * s * r, sy * c * r, 0.012]} />);
    });
  }
  return (
    <group {...props}>
      {/* cartulina */}
      <mesh geometry={cilindro(R_DISCO, R_DISCO, 0.12, 96)} material={m.impreso(PAPEL)} rotation-x={Math.PI / 2} position={[0, 0, -0.06]} receiveShadow />
      {/* escala */}
      <mesh geometry={marcas} material={matTinta} position={[0, 0, 0.006]} />
      {numeros}
      <Etiqueta modo="plano" texto="normal" color="#ff9d9d" peso={600} tamano={0.4} ancla={[1, 0.5]} position={[-0.2, -(R_DISCO + 0.4), 0.012]} />
    </group>
  );
}

/** Bloque semicircular de vidrio acrílico con aristas marcadas. */
export function BloqueSemicircular({ color = '#8fd0e8', ...g }: GroupProps & { color?: string }) {
  const geo = useMemo(() => {
    const forma = new THREE.Shape();
    forma.moveTo(-R_BLOQUE, 0);
    forma.absarc(0, 0, R_BLOQUE, Math.PI, Math.PI * 2, false);
    forma.lineTo(-R_BLOQUE, 0);
    return extruir(forma, ESPESOR_BLOQUE, 64);
  }, []);
  const aristas = useMemo(() => new THREE.EdgesGeometry(geo, 30), [geo]);
  const matVidrio = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }), [color]);
  const matLinea = useMemo(() => new THREE.LineBasicMaterial({ color: '#dff4fb', transparent: true, opacity: 0.9, toneMapped: false }), []);
  useEffect(() => () => { geo.dispose(); aristas.dispose(); }, [geo, aristas]);
  useEffect(() => () => { matVidrio.dispose(); matLinea.dispose(); }, [matVidrio, matLinea]);
  return (
    <group {...g}>
      <mesh geometry={geo} material={matVidrio} renderOrder={2} />
      <lineSegments geometry={aristas} material={matLinea} renderOrder={3} />
    </group>
  );
}

/**
 * Apuntador láser sobre un soporte en V. El origen es la PUNTA (donde sale el haz);
 * el cuerpo se extiende hacia +Y local (hacia atrás). Gira con `rotation-z = θ₁`.
 */
export function ApuntadorLaser({ color, ...g }: GroupProps & { color: string }) {
  const m = useMateriales();
  const tinte = useMemo(() => m.emisor(color, 1.2), [m, color]);
  return (
    <group {...g}>
      {/* cuerpo de aluminio anodizado */}
      <mesh geometry={cilindro(0.3, 0.3, 2.6, 28)} material={m.aluminio} position={[0, 1.64, 0]} />
      <mesh geometry={cilindro(0.34, 0.34, 0.34, 28)} material={m.carcasaOscura} position={[0, 0.17, 0]} />
      {/* tapa trasera con el pulsador */}
      <mesh geometry={cilindro(0.33, 0.33, 0.5, 28)} material={m.carcasaOscura} position={[0, 3.19, 0]} />
      <mesh geometry={cilindro(0.1, 0.1, 0.12, 14)} material={m.goma} position={[0, 2.2, 0.32]} rotation-x={Math.PI / 2} />
      {/* ventana de salida */}
      <mesh geometry={cilindro(0.15, 0.15, 0.04, 20)} material={tinte} position={[0, -0.005, 0]} />
      {/* soporte en V bajo el cuerpo */}
      <mesh position={[0, 1.7, -0.33]}>
        <boxGeometry args={[0.95, 1.1, 0.34]} />
        <primitive object={m.hierroPintado} attach="material" />
      </mesh>
    </group>
  );
}
