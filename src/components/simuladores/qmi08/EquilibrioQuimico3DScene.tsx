"use client";
/**
 * Q8 · Equilibrio químico N₂O₄ ⇌ 2 NO₂ — mesa de laboratorio (R3F + kit).
 *
 *   Tres jeringas de gas selladas (mezcla N₂O₄/NO₂) y tres baños: hielo (0 °C), agua del grifo
 *   (20 °C) y agua caliente sobre parrilla (80 °C), cada uno con su termómetro. Cada jeringa
 *   se apoya en el baño donde el alumno la coloca y toma, con la inercia del store, el tono REAL
 *   de la mezcla a su temperatura (`tonoMezclaNO2`). La escena nunca dice qué color toca: sólo
 *   lo que se vería a través del vidrio.
 */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, ParrillaAgitadora, PARRILLA_ALTURA, Termometro, Etiqueta,
} from '../_kit';
import { TEMP_BANO_Q8 } from '@/domain/quimica';
import { JeringaGas, BanoPlato, FONDO_BANO } from './piezas';

type V3 = [number, number, number];
export type UbicacionJeringa = 'mesa' | 'caliente' | 'hielo';
export interface JeringaVista { id: number; temp: number; ubicacion: UbicacionJeringa }
export interface EquilibrioQuimico3DProps { jeringas: JeringaVista[] }

// Disposición en triángulo: hielo y baño caliente al fondo, agua ambiente al frente.
const C_BANO: Record<UbicacionJeringa, [number, number]> = { hielo: [-2.7, -0.95], mesa: [0, 1.15], caliente: [2.75, -0.95] };
/** Altura de la base de cada baño: el caliente va sobre la placa de la parrilla. */
const Y_BANO: Record<UbicacionJeringa, number> = { hielo: 0, mesa: 0, caliente: PARRILLA_ALTURA };
const NOMBRE: Record<UbicacionJeringa, string> = { hielo: 'Baño de hielo · 0 °C', mesa: 'Agua ambiente · 20 °C', caliente: 'Baño caliente · 80 °C' };
const SEP = 0.68;            // separación entre jeringas de un mismo baño
const ESCALA = 1.3;          // jeringas de 50 mL (más legibles que las de 20 mL a esta distancia)
const INCLINACION = -0.22;   // se apoyan contra la pared trasera del cristalizador

function objetivo(u: UbicacionJeringa, indice: number, n: number): V3 {
  // se escalonan en profundidad para que las aletas de las vecinas no se crucen
  const z = n === 1 ? 0 : (indice % 2 === 0 ? -0.16 : 0.12);
  return [C_BANO[u][0] + (indice - (n - 1) / 2) * SEP, Y_BANO[u] + FONDO_BANO + 0.03, C_BANO[u][1] + z];
}

/** Jeringa que se traslada de un baño a otro levantándola en arco. */
function JeringaMovil({ temp, destino, numero }: { temp: number; destino: V3; numero: number }) {
  const ref = useRef<THREE.Group>(null);
  const inicio = useRef<V3>(destino);
  useFrame((_, dtReal) => {
    const g = ref.current; if (!g) return;
    const dt = Math.min(dtReal, 0.05);
    const k = 1 - Math.exp(-dt * 5);
    const p = g.position;
    const dx = destino[0] - p.x, dz = destino[2] - p.z;
    const lejos = Math.min(1, Math.hypot(dx, dz) / 1.2);
    // se eleva sobre el borde mientras queda camino por recorrer y desciende al llegar
    const yObjetivo = destino[1] + lejos * 1.55;
    p.x += dx * k; p.z += dz * k; p.y += (yObjetivo - p.y) * k;
  });
  return (
    <group ref={ref} position={inicio.current} rotation={[INCLINACION, 0, 0]}>
      <group scale={ESCALA}><JeringaGas temp={temp} /></group>
      {/* número de la jeringa, sobre las aletas */}
      <Etiqueta texto={String(numero)} position={[0, 1.03 * ESCALA + 0.12, 0.05]} tamano={0.17} fondo="#ffffff" borde="#8b99a2" color="#12202b" peso={700} siempreVisible />
    </group>
  );
}

function Montaje({ jeringas }: EquilibrioQuimico3DProps) {
  // posición dentro de su baño: por orden de id entre las que comparten ubicación
  const destinos = useMemo(() => {
    const grupos: Record<UbicacionJeringa, JeringaVista[]> = { hielo: [], mesa: [], caliente: [] };
    [...jeringas].sort((a, b) => a.id - b.id).forEach((j) => grupos[j.ubicacion].push(j));
    const mapa = new Map<number, V3>();
    (Object.keys(grupos) as UbicacionJeringa[]).forEach((u) => grupos[u].forEach((j, i) => mapa.set(j.id, objetivo(u, i, grupos[u].length))));
    return mapa;
  }, [jeringas]);

  return (
    <group>
      {/* los tres baños (la placa de la parrilla queda 12 cm detrás del origen de la pieza) */}
      <BanoPlato hielo position={[C_BANO.hielo[0], 0, C_BANO.hielo[1]]} />
      <BanoPlato position={[C_BANO.mesa[0], 0, C_BANO.mesa[1]]} />
      <ParrillaAgitadora position={[C_BANO.caliente[0], 0, C_BANO.caliente[1] + 0.12]} calor={0.72} agitacion={0} />
      <BanoPlato position={[C_BANO.caliente[0], Y_BANO.caliente, C_BANO.caliente[1]]} colorAgua="#d9eef5" />

      {/* termómetro de cada baño, apoyado contra la pared del fondo */}
      {(['hielo', 'mesa', 'caliente'] as UbicacionJeringa[]).map((u) => (
        <Termometro key={u} position={[C_BANO[u][0] + 0.5, Y_BANO[u] + FONDO_BANO + 0.02, C_BANO[u][1] - 0.44]} rotation={[-0.14, 0, 0.05]}
          temperatura={TEMP_BANO_Q8[u]} longitud={2.5} liquido="alcohol" />
      ))}

      {/* rótulos de cada baño */}
      {(['hielo', 'mesa', 'caliente'] as UbicacionJeringa[]).map((u) => (
        <Etiqueta key={u} texto={NOMBRE[u]} position={[C_BANO[u][0], 0.16, C_BANO[u][1] + (u === 'mesa' ? 1.45 : 1.9)]} tamano={0.2} fondo="#ffffff" borde="#8b99a2" color="#12202b" peso={600} />
      ))}

      {/* las jeringas selladas */}
      {jeringas.map((j) => {
        const d = destinos.get(j.id);
        return d ? <JeringaMovil key={j.id} temp={j.temp} destino={d} numero={j.id} /> : null;
      })}
    </group>
  );
}

export default function EquilibrioQuimico3DScene(props: EquilibrioQuimico3DProps) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 6.2, 11.5], objetivo: [0, 1.0, 0.2], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 24, cajaObjetivo: [[-4, 0.4, -2], [4, 3, 2]] }}
    >
      <EncuadrarCaja caja={[[-3.9, 0, -2.0], [4.0, 3.0, 2.4]]} margen={0.98} direccion={[0, 0.5, 1]} />
      <Montaje {...props} />
    </LabCanvas>
  );
}
