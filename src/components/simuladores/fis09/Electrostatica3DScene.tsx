"use client";

import React, { useMemo } from 'react';
import { LabCanvas, EncuadrarCaja, FlechaFuerza, Etiqueta } from '../_kit';
import { fuerzaCoulomb } from '@/domain/fisica';
import { RielConRegla, CarroEsfera, X_CERO, Y_CENTRO_ESFERA, largoFlecha } from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   Electrostatica3DScene — dos esferas metálicas cargadas sobre un riel (1 u = 1 dm).

   Montaje: riel de aluminio con regla graduada en mm; dos carros con columna aislante de
   acrílico y esfera de acero cromado de 1,8 cm. La esfera 1 está fija en el 0 de la regla
   y la 2 viaja hasta r (cm, centro a centro) con el indicador rojo sobre la regla. Cada
   esfera lleva rotulada su carga y un aro del color de su signo (rojo +, azul −).

   Las flechas de fuerza son un par acción-reacción: se atraen o se repelen según los
   signos, y su longitud sube y baja con |F| en escala LOGARÍTMICA y sin cifras (se
   comparan, no se leen: la F de Coulomb la calcula el alumno). La cámara se aleja por
   escalones al abrir la separación para que la regla siempre se vea completa.
──────────────────────────────────────────────────────────────────────────── */

export interface ElectrostaticaSceneProps {
  q1: number;                 // μC
  q2: number;                 // μC
  distancia: number;          // cm, centro a centro
  isAtraccion: boolean;
}

const COL_POS = '#c62828', COL_NEG = '#1565c0';
const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

function Escena({ q1, q2, distancia, isAtraccion }: ElectrostaticaSceneProps) {
  const xB = X_CERO + distancia / 10;
  const F = fuerzaCoulomb(q1, q2, distancia);
  const L = largoFlecha(F);
  const dir = isAtraccion ? 1 : -1;          // hacia la otra esfera = +x para la 1

  // escalones de encuadre: la regla (0–40 cm) cabe siempre
  const alcance = Math.min(4.5, Math.max(1.5, Math.ceil((distancia / 10 + 1.0) * 2) / 2));
  const tam = 0.05 + 0.022 * alcance;       // el rótulo crece al alejarse la cámara
  const caja = useMemo<[[number, number, number], [number, number, number]]>(
    () => [[X_CERO - 0.6, 0, -0.5], [X_CERO + alcance, 1.95, 0.5]], [alcance]);

  const yFlecha = Y_CENTRO_ESFERA;

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.08} direccion={[0.0, 0.5, 1]} />
      <RielConRegla />
      <group position={[X_CERO, 0, 0]}><CarroEsfera colorAnillo={q1 > 0 ? COL_POS : COL_NEG} /></group>
      <group position={[xB, 0, 0]}><CarroEsfera colorAnillo={q2 > 0 ? COL_POS : COL_NEG} /></group>

      {/* cargas */}
      <Etiqueta texto={`q₁ = ${fmtQ(q1)}`} position={[X_CERO, Y_CENTRO_ESFERA + 0.45, 0]} tamano={tam} ancla={[1, 0.5]} color="#ffffff" fondo={q1 > 0 ? COL_POS : COL_NEG} />
      <Etiqueta texto={`q₂ = ${fmtQ(q2)}`} position={[xB, Y_CENTRO_ESFERA + 0.45, 0]} tamano={tam} ancla={[0, 0.5]} color="#ffffff" fondo={q2 > 0 ? COL_POS : COL_NEG} />

      {/* par de fuerzas: sobre la esfera 1 y sobre la esfera 2 */}
      <FlechaFuerza position={[X_CERO, yFlecha + 0.1, 0.09]} vector={[dir * L, 0, 0]} escala={1} color="#e65100" grosor={0.022} etiqueta="F₁₂" />
      <FlechaFuerza position={[xB, yFlecha - 0.1, 0.09]} vector={[-dir * L, 0, 0]} escala={1} color="#e65100" grosor={0.022} etiqueta="F₂₁" />
    </>
  );
}

export default function Electrostatica3DScene(props: ElectrostaticaSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        camara={{ posicion: [0, 3, 8], objetivo: [0, 0.5, 0], fov: 35 }}
        controles={{ minDistancia: 1.2, maxDistancia: 16, maxPolar: 1.45, cajaObjetivo: [[-4, 0, -2], [4, 2.5, 2]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
