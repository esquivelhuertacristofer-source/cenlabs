"use client";

import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, SoporteUniversal, Nuez, Dinamometro, Gancho, VasoPrecipitado, Etiqueta, cilindro,
  defVaso, alturaSuperficie, dinamometroAlargamiento, useMateriales, NUEZ_DX,
} from '../_kit';
import { G_TIERRA, pesoAparente, lecturaDinamometro } from '@/domain/fisica';
import {
  VasoRebose, ElevadorLab, SolidoEnsayo, dimensionesSolido, bocaPico,
  ALTURA_ELEVADOR, NIVEL_REBOSE,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   Arquimedes3DScene — principio de Arquímedes con dinamómetro (1 u = 1 dm).

   Montaje: soporte universal con nuez y brazo horizontal que sujeta un dinamómetro
   (del kit); del gancho cuelga, con un hilo, el cilindro de ensayo. Bajo él, un vaso
   de rebose de acrílico sobre un elevador de laboratorio, lleno al ras del pico; el
   agua que desaloja el sólido cae por el pico a un vaso colector SIN graduar (la
   escena no da el volumen: lo obtiene el alumno del empuje).

   La inmersión es REAL: la nuez desciende por la varilla hasta que la fracción `f`
   de la altura del cilindro queda bajo la superficie (cilindro vertical: fracción de
   altura = fracción de volumen). La lectura del dinamómetro sale del mismo dominio
   que el Piloto (`pesoAparente`, resolución 0,01 N). Fluidos: agua, etanol, glicerina.
──────────────────────────────────────────────────────────────────────────── */

export interface ArquimedesSceneProps {
  densidadCuerpo: number;     // kg/m³ (sólo fija el alcance del dinamómetro con el peso en el aire)
  volumenCuerpo: number;      // m³
  densidadLiquido: number;    // kg/m³
  fluido: string;             // 'agua' | 'alcohol' | 'glicerina'
  sumergido: number;          // fracción 0–1
}

const COLOR_FLUIDO: Record<string, string> = { agua: '#cfe6ef', alcohol: '#dde9ee', glicerina: '#f1deaa' };
const X_SOPORTE = -2.7;
const LONGITUD_DIN = 1.7;
const LARGO_HILO = 0.4;
const X_COLECTOR = 1.55;
const VASO_COLECTOR = 600;

/** Alcance del dinamómetro (N): el menor de la serie comercial que cubre el peso en el aire. */
function alcanceDin(W: number): number {
  return [5, 10, 20, 50].find((a) => a >= W * 1.02) ?? 50;
}

function Escena({ densidadCuerpo, volumenCuerpo, densidadLiquido, fluido, sumergido }: ArquimedesSceneProps) {
  const m = useMateriales();
  const fObj = Math.min(1, Math.max(0, sumergido));
  const [f, setF] = useState(fObj);
  const fRef = useRef(fObj);
  const tCambio = useRef(-10);
  const hilo = useRef<THREE.Mesh>(null);

  // La fracción mostrada persigue a la del estado (la nuez se desliza; no salta).
  useFrame(({ clock }, dt) => {
    const d = fObj - fRef.current;
    if (Math.abs(d) > 0.0004) {
      fRef.current += d * Math.min(1, dt * 9);
      tCambio.current = clock.elapsedTime;
      setF(fRef.current);
    } else if (fRef.current !== fObj) { fRef.current = fObj; setF(fObj); }
    if (hilo.current) hilo.current.visible = clock.elapsedTime - tCambio.current < 0.7 && fObj > 0 && f > 0.01;
  });

  const { r, h } = useMemo(() => dimensionesSolido(volumenCuerpo), [volumenCuerpo]);
  const Wair = densidadCuerpo * volumenCuerpo * G_TIERRA;
  const alcance = alcanceDin(Wair);
  const lectura = lecturaDinamometro(pesoAparente(densidadCuerpo, volumenCuerpo, densidadLiquido, f));
  const dx = dinamometroAlargamiento(lectura, alcance, LONGITUD_DIN);

  // Cotas verticales (u). El vaso de rebose descansa sobre el elevador.
  const yBase = ALTURA_ELEVADOR;
  const yAgua = yBase + NIVEL_REBOSE;
  // gancho del dinamómetro: −0,32 (índice) − dx − 0,84·L + 0,02, y su punto más bajo ~0,11 más abajo
  const gancho = -0.32 - dx - LONGITUD_DIN * 0.84 + 0.02 - 0.11;
  const yFondo = f > 0 ? yAgua - f * h : yAgua + 0.1;
  const yAnilla = yFondo + h + 0.09 + LARGO_HILO - gancho;
  const yBrazo = yAnilla + 0.2;

  // Colector: el agua desalojada = f·V (sin escala impresa).
  const mL = f * volumenCuerpo * 1e6;
  const def600 = useMemo(() => defVaso(VASO_COLECTOR), []);
  const nivelColector = mL > 0.5 ? alturaSuperficie(def600, mL) : 0;
  const [xBoca, yBocaRel] = bocaPico();
  const yBoca = yBase + yBocaRel;
  const largoChorro = Math.max(0.05, yBoca - 0.025 - nivelColector);
  const colorFluido = COLOR_FLUIDO[fluido] ?? COLOR_FLUIDO.agua;
  const matChorro = useMemo(() => m.liquido(colorFluido), [m, colorFluido]);

  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [[-3.4, -0.35, -1.2], [2.6, 6.6, 1.7]], []);
  const xAnilla = 0;
  const largoBrazo = xAnilla - X_SOPORTE + 0.1;

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.03} direccion={[0.12, 0.14, 1]} />

      {/* soporte universal; la nuez baja y sube con la inmersión */}
      <SoporteUniversal position={[X_SOPORTE, 0, NUEZ_DX]} alturaVarilla={7.6}>
        <Nuez altura={yBrazo} giro={Math.PI / 2}>
          <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.045, 0.045, largoBrazo, 14)} material={m.acero} position={[0, 0, largoBrazo / 2]} castShadow />
        </Nuez>
      </SoporteUniversal>

      {/* gancho del brazo y dinamómetro */}
      <group position={[xAnilla - 0.05, yBrazo - 0.02, 0]}>
        <Gancho radio={0.06} />
      </group>
      <Dinamometro position={[xAnilla, yAnilla, 0]} fuerza={lectura} max={alcance} longitud={LONGITUD_DIN} />

      {/* sólido colgado: su base está a yFondo */}
      <group position={[0, yFondo, 0]}>
        <SolidoEnsayo r={r} h={h} largoHilo={LARGO_HILO} />
      </group>

      {/* vaso de rebose sobre el elevador */}
      <ElevadorLab />
      <group position={[0, yBase, 0]}>
        <VasoRebose colorAgua={colorFluido} />
      </group>

      {/* chorro del pico al colector (sólo mientras el nivel cambia) */}
      <mesh ref={hilo} geometry={cilindro(0.022, 0.022, 1, 8)} material={matChorro} position={[xBoca, yBoca - 0.025 - largoChorro / 2, 0]} scale={[1, largoChorro, 1]} visible={false} />

      {/* vaso colector, sin graduar */}
      <VasoPrecipitado position={[X_COLECTOR, 0, 0]} capacidad={VASO_COLECTOR} graduado={false}
        liquido={mL > 0.5 ? { volumenML: mL, color: colorFluido } : undefined} />

      <Etiqueta texto="Vaso de rebose" position={[0, 0.16, 1.45]} tamano={0.16} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Colector" position={[X_COLECTOR, 0.16, 0.9]} tamano={0.16} color="#142330" fondo="rgba(255,255,255,0.85)" />
    </>
  );
}

export default function Arquimedes3DScene(props: ArquimedesSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        camara={{ posicion: [1.5, 4.0, 13], objetivo: [-0.4, 3.2, 0], fov: 35 }}
        controles={{ minDistancia: 3, maxDistancia: 30, maxPolar: 1.5, cajaObjetivo: [[-4, 0, -2], [4, 7, 2]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
