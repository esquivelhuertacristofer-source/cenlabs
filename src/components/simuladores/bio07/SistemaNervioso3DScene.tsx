"use client";

/**
 * Reflejo rotuliano en 3D (consulta): martillo de reflejos → tendón rotuliano → huso
 * neuromuscular → neurona sensitiva → médula L3–L4 (sinapsis monosináptica con la
 * motoneurona α) → axón motor → placa motora del cuádriceps → patada, con el EMG en el
 * monitor. El impulso recorre cada tramo en la duración EXACTA de la fase que anima el
 * Piloto (latencia medida en cámara lenta). La mielina del paciente NO se dibuja.
 *
 * Props: { fase: {estado, inicio, duracion}, fuerzaGolpe, ultimo: ensayo más reciente }.
 */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LabCanvas, EncuadrarCaja, Etiqueta } from '../_kit';
import { RETARDO_SINAPSIS_B7, RETARDO_PLACA_B7 } from '@/domain/biologia';
import {
  Consultorio, Pierna, SoporteYMartillo, MedulaAmpliada, Nervio, MonitorEMG, enMedula,
  RUTA_SENSITIVA, RUTA_MOTORA, ANG_GOLPE, type EstadoEMG,
} from './piezas';

export type Estado = 'reposo' | 'golpe' | 'viajando_sensorial' | 'sinapsis' | 'viajando_motor' | 'contraccion';
/** Fase del arco que anima el Piloto: `inicio` en performance.now(), `duracion` en ms. */
export interface FaseReflejo { estado: Estado; inicio: number; duracion: number }
export interface EnsayoVisto { respuesta: boolean; latencia: number | null }

/** 1 ms fisiológico se muestra como 60 ms en pantalla (misma constante que el Piloto). */
const CAMARA_LENTA = 60;
const DUR_CONTRACCION_MS = 700;
const ETQ = { tamano: 0.3, fondo: '#ffffffec', color: '#10212b' } as const;
const suave = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

interface Props { fase: FaseReflejo; fuerzaGolpe: number; status?: string; ultimo: EnsayoVisto | null }

function Escena({ fase, fuerzaGolpe, ultimo }: Props) {
  const faseRef = useRef(fase); faseRef.current = fase;
  const fuerzaRef = useRef(fuerzaGolpe); fuerzaRef.current = fuerzaGolpe;
  const ultimoRef = useRef(ultimo); ultimoRef.current = ultimo;
  const avSens = useRef(0), avMot = useRef(0), vesic = useRef(0), exc = useRef(0);
  const pierna = useRef({ patada: 0, contraccion: 0 });
  const angMartillo = useRef(ANG_GOLPE + 0.6);
  const finGolpe = useRef<number | null>(null);
  const eraGolpe = useRef(false);

  useFrame(() => {
    const f = faseRef.current;
    const ahora = performance.now();
    const p = f.duracion > 0 ? Math.min(1, Math.max(0, (ahora - f.inicio) / f.duracion)) : 0;
    const reposoAng = ANG_GOLPE + 0.35 + 0.0075 * fuerzaRef.current;
    avSens.current = f.estado === 'viajando_sensorial' ? p : 0;
    avMot.current = f.estado === 'viajando_motor' ? p : 0;
    vesic.current = f.estado === 'sinapsis' ? p : 0;
    exc.current = f.estado === 'sinapsis' ? p : f.estado === 'viajando_motor' ? 1 - p : 0;
    // martillo: sube hasta el ángulo de la fuerza, cae sobre el tendón y rebota
    if (f.estado === 'golpe') {
      angMartillo.current = reposoAng + (ANG_GOLPE - reposoAng) * p * p;
      eraGolpe.current = true; finGolpe.current = null;
    } else {
      if (eraGolpe.current) { finGolpe.current = ahora; eraGolpe.current = false; }
      if (finGolpe.current !== null) {
        const q = (ahora - finGolpe.current) / 650;
        if (q >= 1) { finGolpe.current = null; angMartillo.current = reposoAng; }
        else angMartillo.current = ANG_GOLPE + (reposoAng - ANG_GOLPE) * suave(q) + Math.sin(q * Math.PI * 2.4) * 0.07 * (1 - q);
      } else angMartillo.current += (reposoAng - angMartillo.current) * 0.2;
    }
    // patada: sube rápido y vuelve despacio; amplitud según la fuerza del golpe
    if (f.estado === 'contraccion') {
      const k = p < 0.3 ? suave(p / 0.3) : 1 - suave((p - 0.3) / 0.7);
      pierna.current.patada = (0.25 + 0.004 * fuerzaRef.current) * k + Math.sin(p * Math.PI * 3.5) * 0.02 * (1 - p);
      pierna.current.contraccion = k;
    } else { pierna.current.patada = 0; pierna.current.contraccion = 0; }
  });

  /** estado del monitor: instante del barrido (ms desde el golpe) según la fase. */
  const leerEMG = (): EstadoEMG => {
    const u = ultimoRef.current, f = faseRef.current;
    if (!u) return { latencia: null, hayEnsayo: false, barrido: Infinity };
    const L = u.latencia;
    if (f.estado === 'reposo') return { latencia: L, hayEnsayo: true, barrido: Infinity };
    if (f.estado === 'golpe' || L === null) return { latencia: L, hayEnsayo: true, barrido: f.estado === 'golpe' ? 0 : Infinity };
    const p = f.duracion > 0 ? Math.min(1, Math.max(0, (performance.now() - f.inicio) / f.duracion)) : 0;
    const c = L - RETARDO_SINAPSIS_B7 - RETARDO_PLACA_B7;
    let t0 = 0, span = 0;
    if (f.estado === 'viajando_sensorial') { t0 = 0; span = c / 2; }
    else if (f.estado === 'sinapsis') { t0 = c / 2; span = RETARDO_SINAPSIS_B7; }
    else if (f.estado === 'viajando_motor') { t0 = c / 2 + RETARDO_SINAPSIS_B7; span = c / 2 + RETARDO_PLACA_B7; }
    else { t0 = L; span = DUR_CONTRACCION_MS / CAMARA_LENTA; }
    return { latencia: L, hayEnsayo: true, barrido: t0 + span * p };
  };

  const soma = enMedula(0.36, -0.44), cleft = enMedula(0.37, -0.3);
  return (
    <>
      <EncuadrarCaja caja={[[-5.6, 0, -1], [11.6, 13.7, 1]]} direccion={[0, 0.02, 1]} margen={0.98} />
      <Consultorio />
      <Pierna estado={pierna} />
      <SoporteYMartillo angulo={angMartillo} />
      <MedulaAmpliada vesiculas={vesic} excitacion={exc} />
      <Nervio puntos={RUTA_SENSITIVA} avance={avSens} color="#4c8fcf" />
      <Nervio puntos={RUTA_MOTORA} avance={avMot} color="#d8884a" />
      <MonitorEMG leer={leerEMG} />

      {/* rótulos (en el corte de la médula, las líneas señalan la estructura) */}
      <Etiqueta texto="Médula espinal L3–L4 (ampliada)" position={[0.9, 13.35, 0.3]} {...ETQ} />
      <Etiqueta texto="Hendidura sináptica" position={[-2.45, 9.8, 0.3]} ancla={[1, 0.5]} {...ETQ} />
      <Line points={[[-2.4, 9.8, 0.25], [cleft.x - 0.08, cleft.y, 0.25]]} color="#334155" lineWidth={1.4} />
      <Etiqueta texto="Motoneurona α" position={[-2.45, 8.6, 0.3]} ancla={[1, 0.5]} {...ETQ} />
      <Line points={[[-2.4, 8.6, 0.25], [soma.x - 0.2, soma.y, 0.25]]} color="#334155" lineWidth={1.4} />
      <Etiqueta texto="Neurona sensitiva" position={[3.4, 12.45, 0.3]} {...ETQ} />
      <Line points={[[3.35, 12.2, 0.25], [3.22, 11.38, 0.25]]} color="#334155" lineWidth={1.4} />
      <Etiqueta texto="Cuádriceps" position={[-2.0, 7.35, 0.3]} {...ETQ} />
      <Etiqueta texto="Tendón rotuliano" position={[1.5, 3.85, 0.3]} ancla={[0, 0.5]} {...ETQ} />
      <Line points={[[1.45, 3.9, 0.25], [0.95, 4.65, 0.25]]} color="#334155" lineWidth={1.4} />
      <Etiqueta texto="Martillo de reflejos" position={[3.2, 7.35, 0.3]} ancla={[0, 0.5]} {...ETQ} />
      <Etiqueta texto="Registro EMG" position={[8.5, 7.15, 0.3]} {...ETQ} />
    </>
  );
}

export default function SistemaNervioso3DScene(props: Props) {
  return (
    <LabCanvas
      fondo="laboratorio"
      mesa={false}
      camara={{ posicion: [3.0, 6.9, 25], objetivo: [3.0, 6.8, 0], fov: 35 }}
      controles={{ minDistancia: 6, maxDistancia: 40, maxPolar: 1.5, paneo: true, cajaObjetivo: [[-6, 2, -2], [12, 12, 2]] }}
    >
      <Escena {...props} />
    </LabCanvas>
  );
}
