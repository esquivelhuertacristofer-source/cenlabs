"use client";

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, FuenteBanco, Cable, Etiqueta } from '../_kit';
import {
  Y_EJE, Z_PEDESTAL, Z_ACOPLE, BaseMotor, ImanLateral, SoporteImanes, RotulosPolos, RotorBobinado, PedestalCojinete,
  Escobillas, bornasEscobillas, Acoplamiento, FrenoCarga, TacometroOptico,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   MotorElectrico3DScene — motor de CD de imanes permanentes (1 u = 1 dm).

   Montaje: base de aluminio con el estator (dos imanes en arco con yugo de acero que flanquean
   al rotor; cara polar roja = N, azul = S), rotor de núcleo laminado en H con bobinado de N
   espiras, conmutador de dos delgas con sus escobillas de carbón, dos pedestales con
   cojinete, acoplamiento elástico con cinta reflectante, freno de partículas magnéticas
   (la carga), tacómetro óptico apuntando a la cinta y fuente de banco con sus cables.

   El eje va a lo largo de Z y el conmutador queda hacia +Z: el sentido «horario» del Piloto
   es el que se ve desde ahí. La animación es la del dominio (`estadoMotor`): el rotor gira
   a ω del Piloto (en cámara lenta, ×0,1: a 2400 rpm real no se vería giro alguno en pantalla);
   con dos polos iguales enfrentados, o si no arranca, se queda quieto.
──────────────────────────────────────────────────────────────────────────── */

export interface MotorSceneProps {
  imanIzq: 'N' | 'S';
  imanDer: 'N' | 'S';
  espiras: number;
  /** rpm con signo (+ horario visto desde el conmutador); 0 = detenido */
  rpm: number;
  corriente: number;
  voltaje: number;
  encendido: boolean;
}

const CAMARA_LENTA = 0.1;
const POS_FUENTE: [number, number, number] = [-2.9, 0, -0.1];
const BORNA_MAS: [number, number, number] = [POS_FUENTE[0] + 0.228, 0.221, POS_FUENTE[2] + 1.42];
const BORNA_MENOS: [number, number, number] = [POS_FUENTE[0] + 0.722, 0.221, POS_FUENTE[2] + 1.42];

function Escena({ imanIzq, imanDer, espiras, rpm, corriente, voltaje, encendido }: MotorSceneProps) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = rotor.current; if (!g || rpm === 0) return;
    g.rotation.z -= ((rpm * 2 * Math.PI) / 60) * CAMARA_LENTA * Math.min(dt, 0.05);
  });
  const [bMas, bMenos] = bornasEscobillas();
  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [[-3.9, 0, -2.5], [1.6, 2.2, 2.85]], []);
  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.1} direccion={[0.62, 0.42, 0.9]} />
      <BaseMotor />
      <SoporteImanes />
      <ImanLateral lado={-1} polo={imanIzq} />
      <ImanLateral lado={1} polo={imanDer} />
      <RotulosPolos imanIzq={imanIzq} imanDer={imanDer} />
      <PedestalCojinete z={Z_PEDESTAL} />
      <PedestalCojinete z={-Z_PEDESTAL} />

      {/* rotor: eje, núcleo, bobinado, conmutador y acople (todo gira junto) */}
      <group ref={rotor} position={[0, Y_EJE, 0]}>
        <RotorBobinado espiras={espiras} />
        <group position={[0, 0, Z_ACOPLE]}><Acoplamiento /></group>
      </group>

      <Escobillas />
      <group position={[0, Y_EJE, -1.95]}><FrenoCarga /></group>
      <group position={[0.95, 0.12, Z_ACOPLE]}><TacometroOptico rpm={encendido ? rpm : 0} /></group>

      {/* fuente de banco y cables a las bornas de las escobillas */}
      <FuenteBanco position={POS_FUENTE} voltaje={voltaje} corriente={encendido ? corriente : 0} encendida />
      <Cable desde={BORNA_MAS} hasta={bMas} holgura={0.5} grosor={0.03} color="#c62828" ySuelo={0.12} />
      <Cable desde={BORNA_MENOS} hasta={bMenos} holgura={0.5} grosor={0.03} color="#1d1f22" ySuelo={0.12} />

      <Etiqueta texto="Freno de carga" position={[0, Y_EJE + 0.85, -1.95]} tamano={0.12} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Tacómetro óptico" position={[0.95, 0.08, -1.2 + 0.7]} tamano={0.1} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Fuente de CD" position={[POS_FUENTE[0], 0.08, POS_FUENTE[2] + 1.9]} tamano={0.12} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Escobillas y conmutador" position={[-0.2, 0.08, 2.35]} tamano={0.1} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Giro a 1/10 de la velocidad real" position={[-0.2, 0.08, 2.7]} tamano={0.085} color="#475569" fondo="rgba(255,255,255,0.75)" />
    </>
  );
}

export default function MotorElectrico3DScene(props: MotorSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        mesa={{ ancho: 14, fondo: 9 }}
        camara={{ posicion: [4.5, 4, 8], objetivo: [-1, 1.1, -0.4], fov: 35 }}
        controles={{ minDistancia: 2.5, maxDistancia: 20, maxPolar: 1.5, cajaObjetivo: [[-4, 0, -3], [2, 3, 3]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
