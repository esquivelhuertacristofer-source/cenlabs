"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Transformaciones3DScene — pizarrón con una rejilla rotulada en unidades y dos
   siluetas de la MISMA pieza (una placa de chapa recortada, asimétrica a propósito
   para que el giro se lea sin ambigüedad):

     · la silueta OBJETIVO: relleno claro y contorno a rayas (sin números);
     · la pieza del alumno: sólida, con su punto de pivote (el origen de la
       pieza) y una flecha de «frente». Sus parámetros T·R·S se aplican con una
       transición corta, así se VE qué hace cada uno (la escala crece desde el
       pivote, el giro es alrededor del pivote, la traslación mueve el pivote).

   La escena no escribe la respuesta: sólo la silueta y la rejilla, como un
   transparente sobre un papel milimétrico. Encuadre fijo en x∈[−10, 10] (la
   traslación llega a ±5 y la pieza a 2·escala de radio).
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, PlanoCartesiano } from '../_kit';
import { Trazo, EncuadreSuave, NumerosEje } from '../mat_comun_1a5/trazos';

interface Transformaciones3DSceneProps {
  tx: number;
  ty: number;
  rotacion: number;
  escala: number;
  target: { tx: number; ty: number; rotacion: number; escala: number };
  status: 'idle' | 'success' | 'error';
}

/** Placa asimétrica (unidades de la pieza, pivote en (0,0)): ala izquierda larga, derecha corta. */
export const PIEZA: [number, number][] = [
  [0, 1.8], [0.5, 0.45], [1.25, -0.4], [0.42, -0.42], [0.46, -1.3],
  [0, -0.95], [-0.46, -1.3], [-0.42, -0.5], [-2.0, -0.95], [-0.5, 0.45],
];

const X0 = -10, X1 = 10, Y0 = -8, Y1 = 8;

/** Un ángulo se acerca a otro por el camino corto. */
function acerca(actual: number, meta: number, k: number) {
  const d = ((((meta - actual + 180) % 360) + 360) % 360) - 180;
  return actual + d * k;
}

interface PropsSilueta {
  color: string;
  relleno: number;
  rayas?: [number, number];
  /** si es la pieza del alumno: pivote y flecha de frente */
  conPivote?: boolean;
  pose: { tx: number; ty: number; rotacion: number; escala: number };
  /** el alumno se mueve con transición; el objetivo se coloca de una vez */
  suave?: boolean;
  z: number;
}
function Silueta({ color, relleno, rayas, conPivote, pose, suave, z }: PropsSilueta) {
  const grupo = useRef<THREE.Group>(null);
  const estado = useRef({ tx: pose.tx, ty: pose.ty, rot: pose.rotacion, s: pose.escala });
  const geo = useMemo(() => {
    const forma = new THREE.Shape(PIEZA.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.ShapeGeometry(forma);
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: relleno, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), [color, relleno]);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => mat.dispose(), [mat]);
  const contorno = useMemo(() => [...PIEZA, PIEZA[0]] as [number, number][], []);

  const poner = (g: THREE.Group, e: typeof estado.current) => {
    g.position.set(e.tx, e.ty, z);
    g.rotation.z = (e.rot * Math.PI) / 180;
    g.scale.setScalar(e.s);
  };
  useFrame((_, dt) => {
    const g = grupo.current; if (!g) return;
    const e = estado.current;
    if (suave) {
      const k = 1 - Math.exp(-dt * 9);
      e.tx += (pose.tx - e.tx) * k; e.ty += (pose.ty - e.ty) * k; e.s += (pose.escala - e.s) * k;
      e.rot = acerca(e.rot, pose.rotacion, k);
      if (Math.abs(e.tx - pose.tx) < 1e-3 && Math.abs(e.ty - pose.ty) < 1e-3 && Math.abs(e.s - pose.escala) < 1e-3) { e.tx = pose.tx; e.ty = pose.ty; e.s = pose.escala; }
    } else { e.tx = pose.tx; e.ty = pose.ty; e.rot = pose.rotacion; e.s = pose.escala; }
    poner(g, e);
  });
  return (
    <group ref={grupo} position={[pose.tx, pose.ty, z]} rotation-z={(pose.rotacion * Math.PI) / 180} scale={pose.escala}>
      <mesh geometry={geo} material={mat} />
      <Trazo pts={contorno} color={color} radio={0.028} rayas={rayas} z={0.004} />
      {conPivote && (
        <>
          {/* flecha de «frente» (+Y de la pieza) para leer el giro */}
          <Trazo pts={[[0, 0.1], [0, 1.35]]} color="#10212b" radio={0.03} z={0.006} />
          <mesh position={[0, 1.45, 0.006]}><coneGeometry args={[0.13, 0.28, 3]} /><meshBasicMaterial color="#10212b" toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.008]}><circleGeometry args={[0.12, 20]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.007]}><circleGeometry args={[0.17, 20]} /><meshBasicMaterial color="#10212b" toneMapped={false} /></mesh>
        </>
      )}
    </group>
  );
}

function Contenido({ tx, ty, rotacion, escala, target, status }: Transformaciones3DSceneProps) {
  const ok = status === 'success';
  const colorAlumno = ok ? '#34d399' : '#f59e0b';
  return (
    <>
      <EncuadreSuave caja={[[X0 - 0.6, Y0, 0], [X1 + 0.6, Y1, 0]]} margen={1.02} />
      <PlanoCartesiano rangoX={[X0, X1]} rangoY={[Y0, Y1]} paso={1} pasoMayor={5} etiquetas={false} escala={1} />
      <NumerosEje rangoX={[X0 + 1, X1 - 1]} rangoY={[Y0 + 1, Y1 - 1]} paso={1} tam={0.5} />
      {/* silueta objetivo: sin números */}
      <Silueta color="#f1f5f9" relleno={0.26} rayas={[0.3, 0.2]} pose={target} z={0.01} />
      {/* pieza del alumno */}
      <Silueta color={colorAlumno} relleno={0.82} conPivote pose={{ tx, ty, rotacion, escala }} suave z={0.03} />
    </>
  );
}

export default function Transformaciones3DScene(props: Transformaciones3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 24], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 4, maxDistancia: 60, maxPolar: Math.PI * 0.8, minPolar: Math.PI * 0.2 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
