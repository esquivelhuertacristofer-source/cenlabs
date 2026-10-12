'use client';
/**
 * mat08/piezas.tsx — el cohete de la telemetría: cuerpo de torno con ojiva,
 * cuatro aletas de chapa, tobera y llama (sólo mientras el motor empuja), más la
 * plataforma de lanzamiento. Origen = la base de la tobera, eje +Y.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import { tornear, extruir, cilindro, useMateriales } from '../_kit';
import type { P2 } from '../_kit';

type GroupProps = ThreeElements['group'];
export const ALTO_COHETE = 1.75;

export function Cohete({ empuje, ...g }: GroupProps & { empuje: boolean }) {
  const m = useMateriales();
  const cuerpo = useMemo(() => tornear([[0.001, 0.2], [0.3, 0.2], [0.3, 1.12]], 32), []);
  const ojiva = useMemo(() => {
    const p: P2[] = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14; p.push([0.3 * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.12 * u), 1.12 + 0.63 * u]); }
    return tornear(p, 32);
  }, []);
  const tobera = useMemo(() => tornear([[0.12, 0], [0.2, 0.2], [0.2, 0.22], [0.001, 0.22]], 24), []);
  const aleta = useMemo(() => {
    const f = new THREE.Shape();
    f.moveTo(0.29, 0.22); f.lineTo(0.62, -0.06); f.lineTo(0.62, 0.3); f.lineTo(0.29, 0.78); f.closePath();
    const geo = extruir(f, 0.045, 4); geo.translate(0, 0, -0.0225);
    return geo;
  }, []);
  useEffect(() => () => { cuerpo.dispose(); ojiva.dispose(); tobera.dispose(); aleta.dispose(); }, [cuerpo, ojiva, tobera, aleta]);
  const llama = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const l = llama.current; if (!l) return;
    const t = clock.getElapsedTime();
    l.visible = empuje;
    l.scale.set(1, 1 + 0.14 * Math.sin(t * 31) + 0.06 * Math.sin(t * 47), 1);
  });
  return (
    <group {...g}>
      <mesh geometry={cuerpo} material={m.pintura('#eef2f4')} />
      <mesh geometry={ojiva} material={m.pintura('#c8372d')} />
      <mesh geometry={tobera} material={m.aluminio} />
      {[0, 1, 2, 3].map((k) => <mesh key={k} geometry={aleta} material={m.pintura('#c8372d')} rotation-y={(k * Math.PI) / 2} />)}
      {/* ventanilla */}
      <mesh geometry={cilindro(0.1, 0.1, 0.06, 20)} material={m.carcasaOscura} position={[0, 0.88, 0.29]} rotation-x={Math.PI / 2} />
      <mesh geometry={cilindro(0.07, 0.07, 0.07, 20)} material={m.plastico('#7fc4de', 0.2)} position={[0, 0.88, 0.3]} rotation-x={Math.PI / 2} />
      {/* llama: sólo mientras hay empuje */}
      <mesh ref={llama} position={[0, -0.28, 0]} rotation-x={Math.PI}>
        <coneGeometry args={[0.14, 0.56, 16]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Plataforma de lanzamiento: losa de hormigón, torre de servicio y brazo. */
export function Plataforma(props: GroupProps) {
  const m = useMateriales();
  return (
    <group {...props}>
      <mesh material={m.impreso('#9aa3a8')} position={[0, -0.12, 0]}>
        <boxGeometry args={[2.1, 0.24, 1.2]} />
      </mesh>
      <mesh material={m.hierroPintado} position={[-0.8, 1.05, -0.3]}>
        <boxGeometry args={[0.2, 2.2, 0.2]} />
      </mesh>
      <mesh material={m.hierroPintado} position={[-0.5, 1.7, -0.3]}>
        <boxGeometry args={[0.7, 0.1, 0.1]} />
      </mesh>
    </group>
  );
}
