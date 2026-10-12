"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, cilindro, cajaRedondeada, useMateriales } from '../_kit';
import {
  CuartoPendulo, SoportePiso, TransportadorPendulo, ReglaVertical, Plomada, FotopuertaPendulo,
  ALTURA_BOLA_REPOSO, X_REGLA, radioPlomada, distanciaCM,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   PenduloSimple3DScene — péndulo simple en un cuarto de pruebas (1 u = 1 dm).

   Montaje: soporte universal de piso (base de fundición + varilla + nuez + brazo
   horizontal), cuerda de la longitud L elegida colgando de una pinza, plomada de
   latón (tamaño ∝ ∛m, la longitud se mide del pivote al centro de masa), transportador
   graduado detrás del pivote (la amplitud inicial es de 10°), regla vertical con cifras
   cada 50 cm y fotopuerta bajo la posición de reposo con contador de oscilaciones.

   La animación es el MAS del dominio: ω = √(g/L), amplitud 10°. El contador de la
   fotopuerta cuenta oscilaciones COMPLETAS desde que se soltó (igual que el Piloto).
   Nunca se rotula la gravedad: el alumno la obtiene midiendo T.
──────────────────────────────────────────────────────────────────────────── */

interface PenduloSceneProps {
  longitud: number;
  masa: number;
  isOscilando: boolean;
  gravedad: number;
  /** Se llama con el número de oscilaciones COMPLETAS desde que se soltó (fotopuerta). */
  onOscilacion?: (n: number) => void;
}

const MAX_ANGLE_DEG = 10;
const MAX_ANGLE_RAD = (MAX_ANGLE_DEG * Math.PI) / 180;

function Escena({ longitud, masa, isOscilando, gravedad, onOscilacion }: PenduloSceneProps) {
  const m = useMateriales();
  const scene = useThree((s) => s.scene);
  const Lu = longitud * 10;
  const pivoteY = Lu + ALTURA_BOLA_REPOSO;
  const r = radioPlomada(masa);
  const dcm = distanciaCM(r);

  const pivote = useRef<THREE.Group>(null);
  const fase = useRef(0);
  const cuentaRef = useRef(0);
  const [cuenta, setCuenta] = useState(0);
  const [bloqueada, setBloqueada] = useState(false);
  const bloqRef = useRef(false);

  useLayoutEffect(() => {
    scene.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (!l.isDirectionalLight || !l.castShadow) return;
      const c = l.shadow.camera as THREE.OrthographicCamera;
      c.left = -34; c.right = 34; c.top = 34; c.bottom = -34; c.near = 1; c.far = 220;
      c.updateProjectionMatrix();
      l.position.set(-16, 60, 34);
      l.target.position.set(-2, 18, 0); l.target.updateMatrixWorld();
    });
  }, [scene]);

  useFrame((_, delta) => {
    const g = pivote.current; if (!g) return;
    if (isOscilando) {
      const omega = Math.sqrt(gravedad / longitud);
      fase.current += omega * Math.min(delta, 0.1);
      g.rotation.z = Math.cos(fase.current) * MAX_ANGLE_RAD;
      const n = Math.floor(fase.current / (2 * Math.PI));
      if (n !== cuentaRef.current) { cuentaRef.current = n; setCuenta(n); onOscilacion?.(n); }
    } else {
      fase.current = 0;
      if (cuentaRef.current !== 0) { cuentaRef.current = 0; setCuenta(0); onOscilacion?.(0); }
      g.rotation.z = MAX_ANGLE_RAD;   // sujeta en la amplitud máxima antes de soltarla
    }
    // la fotopuerta se bloquea cuando la plomada cruza el haz (|x| < r)
    const bloq = isOscilando && Math.abs(Lu * Math.sin(g.rotation.z)) < r * 1.05;
    if (bloq !== bloqRef.current) { bloqRef.current = bloq; setBloqueada(bloq); }
  });

  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [[-13.6, 0, -4], [10.2, pivoteY + 3, 4]], [pivoteY]);

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.04} direccion={[0.06, 0.1, 1]} />
      <CuartoPendulo />
      <SoportePiso alturaBrazo={pivoteY + 0.5} />

      {/* pinza del pivote: la cuerda pende de aquí */}
      <group position={[0, pivoteY, 0]}>
        <mesh geometry={cajaRedondeada(0.7, 0.8, 0.7, 0.08, 2)} material={m.pintura('#9aa3aa')} position={[0, 0.5, 0]} castShadow />
        <mesh geometry={cilindro(0.04, 0.04, 0.3, 8)} material={m.acero} position={[0, 0.03, 0]} castShadow />
        {/* soporte del transportador */}
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.06, 0.06, 0.45, 8)} material={m.acero} position={[0, 0.0, -0.2]} />
        <TransportadorPendulo position={[0, 0, -0.45]} radio={3.5} />
        {/* péndulo */}
        <group ref={pivote}>
          <mesh geometry={cilindro(0.03, 0.03, Lu - dcm, 6)} material={m.plastico('#5a4a30', 0.8)} position={[0, -(Lu - dcm) / 2, 0]} castShadow />
          <group position={[0, -(Lu - dcm), 0]}>
            <Plomada radio={r} />
          </group>
        </group>
      </group>

      <ReglaVertical alto={pivoteY - 0.4} position={[X_REGLA, pivoteY, 0]} />

      {/* fotopuerta en el haz de la posición de reposo */}
      <group position={[0, ALTURA_BOLA_REPOSO, 0]}>
        <FotopuertaPendulo bloqueada={bloqueada} cuenta={cuenta} />
      </group>
    </>
  );
}

export default function PenduloSimple3DScene(props: PenduloSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        mesa={false}
        camara={{ posicion: [2, 14, 60], objetivo: [-2, 18, 0], fov: 35 }}
        controles={{ minDistancia: 5, maxDistancia: 120, maxPolar: 1.5, cajaObjetivo: [[-25, 0, -10], [20, 45, 10]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
