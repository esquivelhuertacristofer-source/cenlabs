"use client";
/**
 * Q9 · Celda galvánica — piezas propias del montaje.
 *
 *   LaminaMetal   electrodo en lámina (Zn, Cu, Ag, Mg) con el acabado real de cada metal.
 *   PuenteSalino  tubo de vidrio en U, relleno de electrolito inerte (KNO₃) y con tapones de
 *                 algodón en los extremos. Origen: el punto medio entre las dos patas, a la altura
 *                 del extremo inferior de las patas (que quedan sumergidas).
 *   SALES         catión y sal de la disolución 1 M de cada metal.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useMateriales, geoCache, tuboPolilinea, cajaRedondeada, esfera, cilindro, COLORES_LIQUIDO } from '../_kit';

type GroupProps = ThreeElements['group'];

export const SALES: Record<string, { cation: string; sal: string; color: string }> = {
  Zn: { cation: 'Zn^{2+}', sal: 'ZnSO_{4}', color: COLORES_LIQUIDO.agua },
  Cu: { cation: 'Cu^{2+}', sal: 'CuSO_{4}', color: COLORES_LIQUIDO.sulfatoCobre },
  Ag: { cation: 'Ag^{+}', sal: 'AgNO_{3}', color: COLORES_LIQUIDO.agua },
  Mg: { cation: 'Mg^{2+}', sal: 'MgSO_{4}', color: COLORES_LIQUIDO.agua },
};

const ACABADO: Record<string, { color: string; metal: number; rug: number }> = {
  Zn: { color: '#b4bcc0', metal: 0.55, rug: 0.5 },     // gris azulado mate, algo granulado
  Cu: { color: '#d0713f', metal: 0.7, rug: 0.3 },      // rojizo brillante
  Ag: { color: '#f2f4f5', metal: 0.5, rug: 0.18 },     // blanco brillante
  Mg: { color: '#aeb4b8', metal: 0.45, rug: 0.62 },    // cinta gris mate con óxido tenue
};

const matsMetal = new Map<string, THREE.MeshStandardMaterial>();
function materialMetal(id: string): THREE.MeshStandardMaterial {
  let mt = matsMetal.get(id);
  if (!mt) {
    const a = ACABADO[id] ?? ACABADO.Zn;
    mt = new THREE.MeshStandardMaterial({ color: a.color, metalness: a.metal, roughness: a.rug, name: 'q9-metal-' + id });
    matsMetal.set(id, mt);
  }
  return mt;
}

export const LAMINA = { ancho: 0.3, alto: 1.5, grueso: 0.02 };

/** Lámina de metal de 3 × 15 cm (origen: borde inferior, centrada). */
export function LaminaMetal({ metal, ...g }: GroupProps & { metal: string }) {
  const geo = useMemo(() => geoCache('q9lamina', () => cajaRedondeada(LAMINA.ancho, LAMINA.alto, LAMINA.grueso, 0.004, 1)), []);
  return (
    <group {...g}>
      <mesh geometry={geo} material={materialMetal(metal)} position={[0, LAMINA.alto / 2, 0]} castShadow />
    </group>
  );
}

/** Recorrido del tubo en U en el plano XY: patas verticales y travesaño con esquinas redondeadas. */
function trayectoU(semiancho: number, alto: number, radio: number): number[] {
  const pts: number[] = [];
  const push = (x: number, y: number) => pts.push(x, y, 0);
  push(-semiancho, 0);
  push(-semiancho, alto - radio);
  for (let i = 1; i <= 8; i++) {
    const a = Math.PI - (i / 8) * (Math.PI / 2);          // esquina izquierda: de 180° a 90°
    push(-semiancho + radio + Math.cos(a) * radio, alto - radio + Math.sin(a) * radio);
  }
  for (let i = 1; i <= 8; i++) {
    const a = Math.PI / 2 - (i / 8) * (Math.PI / 2);      // esquina derecha: de 90° a 0°
    push(semiancho - radio + Math.cos(a) * radio, alto - radio + Math.sin(a) * radio);
  }
  push(semiancho, 0);
  return pts;
}

/** Puente salino: vidrio, electrolito y tapones de algodón. */
export function PuenteSalino({ semiancho = 1.0, alto = 1.3, ...g }: GroupProps & { semiancho?: number; alto?: number }) {
  const m = useMateriales();
  const geoTubo = useMemo(() => tuboPolilinea(trayectoU(semiancho, alto, 0.35), 0.055, 14, false), [semiancho, alto]);
  const geoLiq = useMemo(() => tuboPolilinea(trayectoU(semiancho, alto, 0.35), 0.04, 12, false), [semiancho, alto]);
  useEffect(() => () => { geoTubo.dispose(); geoLiq.dispose(); }, [geoTubo, geoLiq]);
  const algodon = useMemo(() => esfera(0.06, 14), []);
  return (
    <group {...g}>
      <mesh geometry={geoTubo} material={m.vidrio} renderOrder={3} castShadow />
      <mesh geometry={geoLiq} material={m.liquido('#e3eef1')} />
      {[-semiancho, semiancho].map((x) => (
        <mesh key={x} geometry={algodon} material={m.plastico('#f4f1ea', 0.95)} position={[x, 0.03, 0]} scale={[1, 1.3, 1]} castShadow />
      ))}
    </group>
  );
}

/** Pinza de cocodrilo con funda de color (para rotular el lado del cable). */
export function Cocodrilo({ color, ...g }: GroupProps & { color: string }) {
  const m = useMateriales();
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(0.07, 0.17, 0.045, 0.01, 1)} material={m.acero} position={[0, 0.08, 0]} castShadow />
      <mesh geometry={cilindro(0.04, 0.034, 0.18, 12)} material={m.plastico(color, 0.55)} position={[0, 0.25, 0]} castShadow />
    </group>
  );
}
