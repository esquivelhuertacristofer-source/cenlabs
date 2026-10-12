"use client";

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, Termometro, ParrillaAgitadora, MatrazBalon, Cable, Etiqueta, cilindro, defBalon, PARRILLA_ALTURA,
  useMateriales, COLORES_LIQUIDO,
} from '../_kit';
import {
  Y_BARRA, R_CAMISA, X_DIAL, R_DIAL, X_ENTRADA, X_PUERTO_TERMOMETRO,
  BaseDilatometro, CamisaVapor, BarraEnsayo, ComparadorCaratula,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   DilatacionTermica3DScene — dilatómetro lineal con camisa de vapor (1 u = 1 dm).

   Montaje: barra de 500 mm del material elegido dentro de una camisa de acrílico con tapones
   de hule; apoya a la izquierda en un tornillo de tope y a la derecha empuja el palpador de un
   comparador de carátula (0–2 mm, 0,02 mm por división). Un generador de vapor (matraz de fondo
   redondo con agua sobre la parrilla) conecta por una manguera a la tubuladura de entrada; el
   vapor sale por la otra. Un termómetro de vidrio entra por el puerto central de la camisa.

   La temperatura y la aguja del comparador son las del Piloto: ΔL = α·L₀·ΔT, de modo que la
   escena no rotula α (la barra problema va sin marcar): sólo muestra lo que lee cada instrumento.
──────────────────────────────────────────────────────────────────────────── */

export interface DilatacionSceneProps {
  /** coeficiente α real de la barra montada (1/°C) — sólo mueve la aguja, no se rotula */
  alpha: number;
  /** L₀ en mm */
  longitud: number;
  tempIni: number;
  tempFin: number;
  /** aluminio | cobre | acero | misterioso */
  material: string;
  /** vapor circulando */
  encendido: boolean;
}

const NOMBRE_BARRA: Record<string, string> = { aluminio: 'Aluminio', cobre: 'Cobre', acero: 'Acero', misterioso: 'Metal ?' };
const POS_PARRILLA: [number, number, number] = [-3.0, 0, -2.0];

/** Penacho de vapor sobre la salida: cinco volutas que suben, crecen y se desvanecen. */
function Penacho({ activo, position }: { activo: boolean; position: [number, number, number] }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(() => Array.from({ length: 5 }, () => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);
  React.useEffect(() => () => { mats.forEach((x) => x.dispose()); geo.dispose(); }, [mats, geo]);
  useFrame(({ clock }) => {
    const t0 = clock.elapsedTime * 0.45;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = (t0 + i / 5) % 1;
      mesh.visible = activo;
      mesh.position.set(Math.sin(t * 6 + i) * 0.05 + t * 0.12, t * 0.95, Math.cos(t * 5 + i * 2) * 0.04);
      const s = 0.05 + t * 0.2;
      mesh.scale.set(s, s, s);
      mats[i].opacity = (1 - t) * 0.4;
    });
  });
  return (
    <group position={position}>
      {mats.map((mt, i) => <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mt} visible={false} renderOrder={5} />)}
    </group>
  );
}

function Escena({ alpha, longitud, tempIni, tempFin, material, encendido }: DilatacionSceneProps) {
  const m = useMateriales();
  const dL = alpha * longitud * (tempFin - tempIni);            // mm
  const nivelVapor = encendido ? Math.min(1, Math.max(0, (tempFin - tempIni) / 15)) : 0;

  const def = useMemo(() => defBalon(500), []);
  const yMatraz = PARRILLA_ALTURA + 0.0;
  const yBoca = yMatraz + def.altura + 0.03;
  const rCuello = def.radioInteriorEn(def.altura - 0.05);
  const xMatraz = POS_PARRILLA[0], zMatraz = POS_PARRILLA[2] - 0.12;
  const topeTubo: [number, number, number] = [xMatraz, yBoca + 0.45, zMatraz];
  const entrada: [number, number, number] = [X_ENTRADA, Y_BARRA + R_CAMISA * 0.9 + 0.36, 0];
  const salidaX = -X_ENTRADA;
  const matGoma = useMemo(() => m.plastico('#2a2220', 0.9), [m]);

  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [[-3.6, 0, -3.0], [4.7, 3.9, 0.9]], []);
  const tipoLabel = NOMBRE_BARRA[material] ?? 'Barra';

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.12} direccion={[0.0, 0.45, 1]} />
      <BaseDilatometro />
      <BarraEnsayo material={material} />
      <CamisaVapor vapor={nivelVapor} />
      <Penacho activo={encendido} position={[salidaX, Y_BARRA + R_CAMISA * 0.9 + 0.36, 0]} />

      {/* termómetro por el puerto central; el bulbo queda dentro de la camisa, junto a la barra */}
      <Termometro position={[X_PUERTO_TERMOMETRO, Y_BARRA + 0.09, 0]} scale={1.4} temperatura={tempFin} longitud={1.9} />

      {/* comparador de carátula: su palpador toca el extremo derecho de la barra */}
      <group position={[X_DIAL, Y_BARRA, 0]}><ComparadorCaratula dL={dL} /></group>

      {/* generador de vapor */}
      <ParrillaAgitadora position={POS_PARRILLA} calor={encendido ? 0.9 : 0} agitacion={0} encendida />
      <MatrazBalon position={[xMatraz, yMatraz, zMatraz]} capacidad={500} aro liquido={{ volumenML: 320, color: COLORES_LIQUIDO.agua }} />
      <group position={[xMatraz, yBoca, zMatraz]}>
        <mesh geometry={cilindro(rCuello * 1.15, rCuello * 0.9, 0.2, 24)} material={matGoma} position={[0, -0.05, 0]} castShadow />
        <mesh geometry={cilindro(0.04, 0.04, 0.5, 10, true)} material={m.vidrio} position={[0, 0.2, 0]} renderOrder={3} />
      </group>
      <Cable desde={topeTubo} hasta={entrada} holgura={1.3} grosor={0.07} color="#6f8290" />

      <Etiqueta texto={`Barra: ${tipoLabel}`} position={[-2.4, 0.06, 1.0]} tamano={0.12} color="#142330" fondo="rgba(255,255,255,0.88)" />
      <Etiqueta texto="Camisa de vapor" position={[0.2, 0.06, 1.0]} tamano={0.12} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Generador de vapor" position={[POS_PARRILLA[0], 0.04, POS_PARRILLA[2] + 1.55]} tamano={0.12} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Comparador" position={[X_DIAL, 0.06, 1.0]} tamano={0.12} color="#142330" fondo="rgba(255,255,255,0.85)" />
    </>
  );
}

export default function DilatacionTermica3DScene(props: DilatacionSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        mesa={{ ancho: 14, fondo: 9 }}
        camara={{ posicion: [0.5, 4.2, 9], objetivo: [0.5, 1.2, -0.5], fov: 35 }}
        controles={{ minDistancia: 2.5, maxDistancia: 22, maxPolar: 1.5, cajaObjetivo: [[-4, 0, -3.5], [5, 3.6, 2]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
