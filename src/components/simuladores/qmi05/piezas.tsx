"use client";
/**
 * Q5 · Preparación de soluciones — piezas propias del montaje.
 *
 *   Espatula    microespátula de acero con mango; se desplaza al vidrio de reloj al pesar.
 *   Frasco      frasco de reactivo de boca ancha (HDPE) con tapa aparte y etiqueta.
 *   Piseta      piseta de agua destilada: se inclina sobre el matraz y vierte un hilo de agua.
 *   MontonPolvo montoncito de soluto en el fondo del matraz (se disuelve con el progreso).
 */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useMateriales, tornear, cilindro, cajaRedondeada, esfera, geoCache, Etiqueta, type P2 } from '../_kit';

type GroupProps = ThreeElements['group'];

/** Microespátula: la hoja está en x ∈ [−0,55, 0] y el mango en x > 0 (origen en el arranque de la hoja). */
export function Espatula(props: GroupProps) {
  const m = useMateriales();
  return (
    <group {...props}>
      <mesh geometry={cajaRedondeada(0.55, 0.012, 0.13, 0.005)} material={m.acero} position={[-0.275, 0, 0]} castShadow />
      <mesh geometry={cilindro(0.015, 0.015, 0.9, 10)} material={m.acero} rotation-z={Math.PI / 2} position={[0.4, 0, 0]} castShadow />
      <mesh geometry={cilindro(0.045, 0.045, 0.55, 14)} material={m.plastico('#1f4f9a', 0.5)} rotation-z={Math.PI / 2} position={[1.07, 0, 0]} castShadow />
    </group>
  );
}

/** Frasco de boca ancha, 0,55 de radio y 1,3 de alto; la tapa va aparte. */
export function Frasco({ formula, nombre, ...g }: GroupProps & { formula: string; nombre: string }) {
  const m = useMateriales();
  const perfil: P2[] = useMemo(() => [[0, 0], [0.54, 0], [0.58, 0.05], [0.58, 1.05], [0.5, 1.2], [0.44, 1.3], [0.44, 1.42], [0.4, 1.42], [0.4, 1.3], [0.0005, 0.06]], []);
  const geo = useMemo(() => geoCache('q5frasco', () => tornear(perfil, 40)), [perfil]);
  return (
    <group {...g}>
      <mesh geometry={geo} material={m.plastico('#f1f1ee', 0.45)} castShadow receiveShadow />
      <mesh geometry={cilindro(0.455, 0.455, 0.1, 32)} material={m.plastico('#1f4f9a', 0.5)} position={[0, 1.37, 0]} />
      <Etiqueta texto={formula.replace(/(\d+)/g, '_{$1}')} modo="plano" position={[0, 0.78, 0.59]} tamano={0.26} peso={700} color="#12202b" fondo="#ffffff" borde="#9aa6ad" />
      <Etiqueta texto={nombre} modo="plano" position={[0, 0.48, 0.59]} tamano={0.12} peso={600} color="#12202b" fondo="#ffffff" />
      {/* tapa suelta, volcada junto al frasco */}
      <mesh geometry={cilindro(0.5, 0.5, 0.26, 32)} material={m.plastico('#1f4f9a', 0.5)} position={[-0.95, 0.5, 0.35]} rotation-z={Math.PI / 2} castShadow />
    </group>
  );
}

/** Piseta de 250 mL: cuerpo translúcido, tapón blanco y pico acodado hacia −X. Origen: base. */
export function Piseta(props: GroupProps) {
  const m = useMateriales();
  const cuerpo: P2[] = useMemo(() => [[0, 0], [0.3, 0], [0.34, 0.06], [0.34, 1.35], [0.26, 1.7], [0.13, 1.88], [0.13, 1.98], [0.0005, 1.98]], []);
  const geo = useMemo(() => geoCache('q5piseta', () => tornear(cuerpo, 32)), [cuerpo]);
  return (
    <group {...props}>
      <mesh geometry={geo} material={m.plasticoClaro} castShadow />
      {/* agua que contiene */}
      <mesh geometry={cilindro(0.32, 0.32, 0.8, 24)} material={m.liquido('#cfe6ef')} position={[0, 0.45, 0]} />
      <mesh geometry={cilindro(0.15, 0.17, 0.22, 20)} material={m.plastico('#f5f5f2', 0.5)} position={[0, 2.08, 0]} castShadow />
      {/* pico: tramo vertical y tramo inclinado hacia −X */}
      <mesh geometry={cilindro(0.045, 0.045, 0.3, 10)} material={m.plastico('#f5f5f2', 0.5)} position={[0, 2.3, 0]} castShadow />
      <group position={[0, 2.43, 0]} rotation-z={0.9}>
        <mesh geometry={cilindro(0.04, 0.04, 0.75, 10)} material={m.plastico('#f5f5f2', 0.5)} position={[0, 0.37, 0]} castShadow />
      </group>
    </group>
  );
}
/** Punta del pico de la piseta (coordenadas locales del origen de la piseta). */
export const PUNTA_PISETA: [number, number, number] = [-Math.sin(0.9) * 0.78, 2.43 + Math.cos(0.9) * 0.78, 0];

/** Montoncito de soluto en el fondo del matraz; `escala` 1 → 0 al disolverse. */
export function MontonPolvo({ color, escala, radio, ...g }: GroupProps & { color: string; escala: number; radio: number }) {
  const m = useMateriales();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => { if (ref.current) { ref.current.scale.set(escala, escala, escala); ref.current.visible = escala > 0.02; } });
  return <mesh ref={ref} geometry={esfera(radio, 20)} material={m.plastico(color, 0.9)} scale={[1, 0.45, 1]} {...g} />;
}
