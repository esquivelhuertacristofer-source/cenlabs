"use client";

import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, FlechaFuerza, Etiqueta } from '../_kit';
import { G_TIERRA } from '@/domain/fisica';
import {
  PisoPruebas, PlacaRampa, Bisagra, BaseBisagra, Cuadrante, ColumnaSoporte, BloqueMasa, Cabestrante, CableRecto, SensorPosicion,
  LARGO_UTIL, LARGO_PLACA, X0, X_TOPE, ALTO_BISAGRA, ALTO_RIEL, ESPESOR_PLACA, BLOQUE, ANCHO_PLACA,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   PlanoInclinado3DScene — rampa de pruebas de 10 m (1 u = 1 m).

   Montaje: placa con rieles y cinta graduada (cifras cada 2,5 m) articulada en una
   bisagra, columna de soporte con collarín en el extremo alto, cuadrante graduado
   detrás (la rampa marca el ángulo), bloque de acero con lastre apilable y rótulo de
   masa, un cabestrante en cada extremo (el del lado que tira lleva el cable, que es
   la fuerza F del alumno, paralela al plano) y el detector de movimiento ultrasónico.

   Diagrama de cuerpo libre: W (peso), N (normal) y F (aplicada) siempre; la fricción
   cinética f solo mientras el bloque desliza (antes de soltarlo no se muestra para no
   delatar el sentido del movimiento). Nunca se muestra la aceleración.

   Props: { angulo, bloquePos (0–1 a lo largo de la rampa), masa, isDeslizando,
   fuerzaAplicada, cargaExtra, muK, movimiento }.
──────────────────────────────────────────────────────────────────────────── */

interface SceneProps {
  angulo: number;
  bloquePos: number;
  masa: number;
  isDeslizando: boolean;
  fuerzaAplicada: number;
  status?: string;
  /** masa de lastre (kg) incluida en `masa`, dibujada como placas apiladas */
  cargaExtra?: number;
  /** μ cinético: solo para dibujar la fricción mientras desliza */
  muK?: number;
  /** sentido del movimiento durante el ensayo (para orientar f) */
  movimiento?: 'reposo' | 'sube' | 'baja';
}

/** metros por newton de las flechas de fuerza (la misma escala para todas) */
const ESC_FUERZA = 0.01;

function Escena({ angulo, bloquePos, masa, isDeslizando, fuerzaAplicada, cargaExtra = 0, muK = 0, movimiento = 'reposo' }: SceneProps) {
  const scene = useThree((s) => s.scene);
  // niebla suave hacia el color del fondo y sombras que cubran toda la rampa
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#dfe3e6', 45, 110);
    scene.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (!l.isDirectionalLight || !l.castShadow) return;
      const c = l.shadow.camera as THREE.OrthographicCamera;
      c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 1; c.far = 90;
      c.updateProjectionMatrix();
      l.position.set(-8, 20, 14);
      l.target.position.set(7, 0, 0); l.target.updateMatrixWorld();
    });
  }, [scene]);

  const rad = (angulo * Math.PI) / 180;
  const sen = Math.sin(rad), cos = Math.cos(rad);
  const s = bloquePos * LARGO_UTIL;
  const bx = X0 + s;                         // centro del bloque en la rampa (local)
  const W = masa * G_TIERRA;
  const N = W * cos;
  const fk = muK * N;

  // apoyo de la columna: bajo el riel, cerca del extremo alto
  const xc = LARGO_PLACA - 1.1;
  const yRiel = -ESPESOR_PLACA - ALTO_RIEL + 0.1;
  const ySoporte = ALTO_BISAGRA + xc * sen + yRiel * cos;
  const xSoporte = xc * cos - yRiel * sen;

  const aplicada = fuerzaAplicada;
  const cableArriba = aplicada > 0.5;
  const cableAbajo = aplicada < -0.5;
  const xCaraArriba = bx + BLOQUE.largo / 2 + 0.03;
  const xCaraAbajo = bx - BLOQUE.largo / 2 - 0.03;
  const xSalidaArriba = LARGO_PLACA - X_TOPE;
  const xSalidaAbajo = X_TOPE;

  // vectores en el sistema local de la rampa
  const wLocal = useMemo<[number, number, number]>(() => [-sen * W, -cos * W, 0], [sen, cos, W]);
  const fSentido = movimiento === 'sube' ? -1 : movimiento === 'baja' ? 1 : 0;

  // encuadre por pasos de 10° para que no «baile» al mover el deslizador
  const q = Math.min(60, Math.ceil(Math.max(angulo, 1) / 10) * 10);
  const radQ = (q * Math.PI) / 180;
  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [
    [-1.5, 0, -2.4], [Math.max(8, LARGO_PLACA * Math.cos(radQ) + 1.5), ALTO_BISAGRA + LARGO_PLACA * Math.sin(radQ) + 1.4, 2.4],
  ], [radQ]);

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.04} direccion={[0.05, 0.2, 1]} />
      <PisoPruebas />

      <group position={[0, 0, 0]}>
        <BaseBisagra />
        <group position={[xSoporte, 0, 0]}><ColumnaSoporte alto={ySoporte - 0.3} /></group>
        {/* cuadrante graduado, detrás de la rampa */}
        <Cuadrante radio={4.2} position={[0, ALTO_BISAGRA, -ANCHO_PLACA / 2 - 0.4]} />
        <group position={[0, ALTO_BISAGRA, 0]} rotation={[0, 0, rad]}>
          <Bisagra />
          <PlacaRampa />
          <group position={[LARGO_PLACA - X_TOPE + 0.66, 0, 0]}><Cabestrante haciaMenos /></group>
          <group position={[X_TOPE - 0.66, 0, 0]}><Cabestrante /></group>
          <group position={[LARGO_PLACA - 0.5, 0, -0.85]}><SensorPosicion /></group>
          <Etiqueta texto="Sensor de posición" position={[LARGO_PLACA - 0.5, 2.0, -0.85]} tamano={0.26} color="#142330" fondo="rgba(255,255,255,0.85)" />

          {cableArriba && <CableRecto x0={xCaraArriba} x1={xSalidaArriba} />}
          {cableAbajo && <CableRecto x0={xSalidaAbajo} x1={xCaraAbajo} />}

          <group position={[bx, 0, 0]}>
            <BloqueMasa masa={masa} extra={cargaExtra} />
            {/* diagrama de cuerpo libre desde el centro del bloque */}
            <group position={[0, BLOQUE.alto / 2, 0]}>
              <FlechaFuerza vector={wLocal} escala={ESC_FUERZA} tipo="peso" etiqueta="W" grosor={0.07} siempreVisible />
              <FlechaFuerza vector={[0, N, 0]} escala={ESC_FUERZA} tipo="normal" etiqueta="N" grosor={0.07} siempreVisible />
              {Math.abs(aplicada) > 0.5 && (
                <FlechaFuerza vector={[aplicada, 0, 0]} escala={ESC_FUERZA} tipo="aplicada" etiqueta="F" grosor={0.07} siempreVisible position={[0, 0.18, 0]} />
              )}
              {isDeslizando && fSentido !== 0 && fk > 0.5 && (
                <FlechaFuerza vector={[fSentido * fk, 0, 0]} escala={ESC_FUERZA} tipo="friccion" etiqueta="f" grosor={0.07} siempreVisible position={[0, -0.18, 0]} />
              )}
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

export default function PlanoInclinado3DScene(props: SceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        mesa={false}
        camara={{ posicion: [7, 6, 22], objetivo: [6.5, 3, 0], fov: 38 }}
        controles={{ minDistancia: 4, maxDistancia: 60, maxPolar: 1.5, cajaObjetivo: [[-5, 0, -6], [20, 14, 6]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
