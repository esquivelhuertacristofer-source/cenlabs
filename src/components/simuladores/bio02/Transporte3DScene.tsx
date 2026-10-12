"use client";

/**
 * Ósmosis: la célula en su medio. Todo sale del estado del lab:
 *   · tipo, volumen (V/V₀ en %) y lisada → forma de la célula (crenación, turgencia,
 *     plasmólisis, hemólisis);
 *   · concExt / glucosaExt → cuántos iones y moléculas de glucosa hay en el medio;
 *   · tendencia → sentido en que cruzan las moléculas de agua.
 * Los solutos del interior son una cantidad FIJA (se conservan): lo que cambia es el
 * volumen. La osmolaridad del citoplasma —la incógnita— no se dibuja.
 */
import React from 'react';
import { Line } from '@react-three/drei';
import { LabCanvas, Etiqueta } from '../_kit';
import { Eritrocito, CelulaVegetal, Hemolisis, Medio } from './piezas';

interface Props {
  tipo: 'animal' | 'vegetal';
  volumen: number;
  concExt: number;
  glucosaExt?: number;
  lisada?: boolean;
  tendencia?: 'gana' | 'pierde' | 'estable';
}

const MAX_CONC = 0.4;
const cuenta = (c: number) => Math.round((Math.max(0, c) / MAX_CONC) * 70);
const ETQ = { tamano: 0.15, fondo: '#ffffffe6' } as const;

function Rotulo3D({ texto, desde, hasta, lado = 'der' }: { texto: string; desde: [number, number, number]; hasta: [number, number, number]; lado?: 'izq' | 'der' }) {
  return (
    <group>
      <Line points={[desde, hasta]} color="#e9eef2" lineWidth={1.2} />
      <Etiqueta texto={texto} position={hasta} {...ETQ} ancla={lado === 'izq' ? [1, 0.5] : [0, 0.5]} />
    </group>
  );
}

export default function Transporte3DScene({ tipo, volumen, concExt, glucosaExt = 0, lisada = false, tendencia = 'estable' }: Props) {
  const v = Number.isFinite(volumen) ? volumen : 100;
  const flujo = lisada ? 0 : tendencia === 'gana' ? 1 : tendencia === 'pierde' ? -1 : 0;
  const vegetal = tipo === 'vegetal';
  const k = Math.min(0.985, Math.max(0.3, Math.cbrt(v / 108) * 0.985));
  return (
    <LabCanvas
      fondo="pizarron"
      camara={{ posicion: [0, 2.0, 12.4], objetivo: [0, 0, 0], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 16, paneo: false, maxPolar: 2.4 }}
    >
      <Medio
        na={cuenta(concExt)} cl={cuenta(concExt)} glucosa={cuenta(glucosaExt)}
        interior={vegetal ? 34 : 0}
        excluir={vegetal ? [2.05, 1.45, 1.45] : [1.75, 1.75, 1.75]}
        escalaInterior={vegetal ? [1.9 * k, 1.25 * k, 1.25 * k] : [1, 1, 1]}
        flujo={flujo}
      />
      {vegetal ? (
        <>
          <CelulaVegetal volumen={v} />
          <Rotulo3D texto="Pared celular" desde={[1.95, 1.3, -0.3]} hasta={[2.3, 1.75, -0.3]} />
          <Rotulo3D texto="Membrana plasmática" desde={[-1.65 * k, -0.9, 0.3]} hasta={[-2.3, -1.75, 0.3]} lado="izq" />
          <Rotulo3D texto="Vacuola" desde={[0.9, 0.15, 0.2]} hasta={[2.3, 0.2, 0.2]} />
          <Rotulo3D texto="Cloroplasto" desde={[0.9 * k, -0.55, 0.45]} hasta={[2.3, -0.85, 0.45]} />
        </>
      ) : lisada ? (
        <Hemolisis />
      ) : (
        <>
          <Eritrocito volumen={v} />
          <Etiqueta texto="Eritrocito" position={[0, 2.2, 0]} {...ETQ} />
        </>
      )}
    </LabCanvas>
  );
}
