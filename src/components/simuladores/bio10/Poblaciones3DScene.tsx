"use client";

/**
 * Lotka-Volterra en 3D: un prado con liebres (presas) y linces (depredadores) y, sobre
 * dos tableros, las gráficas del experimento.
 *   dx/dt = α·x − β·x·y     (presas)        dy/dt = δ·x·y − γ·y     (depredadores)
 * El NÚMERO de animales refleja N(t): cada liebre vale `PRESAS_POR_LIEBRE` presas y cada
 * lince un depredador. Los tableros trazan N(t) y el plano de fase (x, y) con sus ejes y
 * escala. El modelo clásico no tiene capacidad de carga: no se dibuja ninguna asíntota.
 * Props: { presas, depredadores, historial, simulando, inicial, equilibrio, extincion }.
 */
import React from 'react';
import { LabCanvas, EncuadrarCaja, Etiqueta } from '../_kit';
import { Fauna, Tablero, dibujarSerie, dibujarFase, PRESAS_POR_LIEBRE, DEPRED_POR_LINCE, type Punto } from './piezas';

export interface PropsPoblaciones {
  presas: number;
  depredadores: number;
  historial: Punto[];
  simulando?: boolean;
  inicial: { x: number; y: number };
  equilibrio: { x: number; y: number };
  tMax: number;
  extincion?: false | 'presas' | 'depredadores' | null;
}

function Escena({ presas, depredadores, historial, inicial, equilibrio, tMax, extincion }: PropsPoblaciones) {
  const datos = { historial, presas, depredadores, inicial, equilibrio, tMax, extincion: extincion ?? null };
  return (
    <>
      <EncuadrarCaja caja={[[-10.7, 0, -2.6], [10.7, 11.2, 10.2]]} direccion={[0, 0.2, 1]} margen={0.95} />
      <Tablero dibujar={dibujarSerie} datos={datos} position={[-5.3, 7.2, -2.5]} ancho={9.8} alto={7.65625} />
      <Tablero dibujar={dibujarFase} datos={datos} position={[5.3, 7.2, -2.5]} ancho={9.8} alto={7.65625} />
      <Fauna presas={presas} depredadores={depredadores} />
      <Etiqueta texto={`1 liebre = ${PRESAS_POR_LIEBRE} presas · 1 lince = ${DEPRED_POR_LINCE} depredadores`} position={[0, 0.25, 10.4]} tamano={0.42} fondo="#ffffffe6" color="#10212b" />
    </>
  );
}

export default function Poblaciones3DScene(props: PropsPoblaciones) {
  return (
    <LabCanvas
      fondo="campo"
      extensionCampo={300}
      camara={{ posicion: [0, 8.5, 26], objetivo: [0, 5.4, 0], fov: 36 }}
      controles={{ minDistancia: 8, maxDistancia: 60, maxPolar: 1.5, paneo: true }}
    >
      <Escena {...props} />
    </LabCanvas>
  );
}
