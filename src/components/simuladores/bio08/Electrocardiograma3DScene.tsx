"use client";

/**
 * Electrocardiograma en 3D: modelo anatómico del corazón junto al monitor de ECG.
 *
 * UN SOLO RELOJ (`avanzarReloj`, pasos de 10 ms, el mismo modelo ecgMvB8 del dominio):
 * el corazón, sus válvulas y el trazo leen ese reloj, así que nunca se desfasan. Un cambio
 * de FC se aplica en el siguiente latido (como el nodo SA).
 *   · aurículas: se contraen tras la onda P (se vacían hacia el ventrículo);
 *   · ventrículos: del QRS al final de la T (sístole): las cámaras se vacían, se cierran
 *     las válvulas AV, se abren las sigmoideas y el bolo recorre la aorta y el tronco pulmonar;
 *   · monitor: barrido de 4 s a 25 mm/s con cuadrícula (cuadro grande = 0,2 s = 0,5 mV).
 * El monitor NO imprime la frecuencia: el alumno la mide en el trazo.
 */
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LabCanvas, EncuadrarCaja, Etiqueta } from '../_kit';
import { contraccionB8, tiemposCicloB8 } from '@/domain/biologia';
import { Corazon, MonitorECG, nuevoReloj, avanzarReloj, type EstadoCorazon } from './piezas';

const ETQ = { tamano: 0.27, fondo: '#ffffffec', color: '#10212b' } as const;

function Escena({ ritmoBPM }: { ritmoBPM: number }) {
  const bpm = Math.max(30, Math.min(220, ritmoBPM));
  const reloj = useRef(nuevoReloj(bpm));
  const estadoCorazon = useRef<EstadoCorazon>({ auriculas: 0, ventriculos: 0, sistole: 0 });
  const estadoMonitor = useRef({ t: 0, rr: 60000 / bpm });
  useEffect(() => { reloj.current.rrObjetivo = 60000 / bpm; }, [bpm]);

  // el reloj corre antes que las piezas (prioridad menor = antes)
  useFrame((_, dt) => {
    const r = reloj.current;
    avanzarReloj(r, dt * 1000);
    const c = contraccionB8(r.tCiclo, r.rr);
    const tc = tiemposCicloB8(r.rr);
    const ini = tc.pr + 30;
    const p = r.tCiclo >= ini && r.tCiclo <= tc.tFin ? (r.tCiclo - ini) / (tc.tFin - ini) : 0;
    estadoCorazon.current.auriculas = c.auriculas; estadoCorazon.current.ventriculos = c.ventriculos; estadoCorazon.current.sistole = p;
    estadoMonitor.current.t = r.tCiclo; estadoMonitor.current.rr = r.rr;
  }, -1);

  return (
    <>
      <EncuadrarCaja caja={[[-6.6, 0, -3.6], [6.6, 11.9, 1.6]]} direccion={[0, 0.12, 1]} margen={1.0} />
      {/* monitor en brazo de pared */}
      <mesh position={[0, 9.1, -3.72]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.4, 20]} /><meshStandardMaterial color="#9aa3aa" metalness={0.8} roughness={0.35} /></mesh>
      <mesh position={[0, 9.1, -3.95]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.8, 0.8, 0.1, 28]} /><meshStandardMaterial color="#b9c0c5" metalness={0.7} roughness={0.4} /></mesh>
      <MonitorECG reloj={reloj} estado={estadoMonitor} position={[0, 9.1, -3.2]} />
      {/* atril del corazón sobre la mesa */}
      <mesh position={[0, 0.12, 0.3]} castShadow receiveShadow><cylinderGeometry args={[1.7, 1.85, 0.24, 48]} /><meshStandardMaterial color="#d9dde0" roughness={0.4} /></mesh>
      <Corazon estado={estadoCorazon} position={[-0.3, 2.4, 0.3]} scale={1.22} />
      {/* rótulos con sus líneas (cada línea termina en la estructura) */}
      <Etiqueta texto="Tronco pulmonar" position={[-3.6, 5.5, 1.3]} ancla={[1, 0.5]} {...ETQ} />
      <Line points={[[-3.55, 5.5, 1.3], [-0.36, 4.66, 1.55]]} color="#334155" lineWidth={1.3} />
      <Etiqueta texto="Aurícula derecha" position={[-3.6, 3.9, 1.3]} ancla={[1, 0.5]} {...ETQ} />
      <Line points={[[-3.55, 3.9, 1.3], [-1.37, 3.52, 1.24]]} color="#334155" lineWidth={1.3} />
      <Etiqueta texto="Ventrículo derecho" position={[-3.6, 2.2, 1.3]} ancla={[1, 0.5]} {...ETQ} />
      <Line points={[[-3.55, 2.2, 1.3], [-1.06, 2.16, 1.61]]} color="#334155" lineWidth={1.3} />
      <Etiqueta texto="Aorta" position={[3.4, 5.6, 1.3]} ancla={[0, 0.5]} {...ETQ} />
      <Line points={[[3.35, 5.6, 1.3], [1.26, 4.29, 0.44]]} color="#334155" lineWidth={1.3} />
      <Etiqueta texto="Aurícula izquierda" position={[3.4, 4, 1.3]} ancla={[0, 0.5]} {...ETQ} />
      <Line points={[[3.35, 4, 1.3], [0.98, 3.62, 1.12]]} color="#334155" lineWidth={1.3} />
      <Etiqueta texto="Ventrículo izquierdo" position={[3.4, 1.9, 1.3]} ancla={[0, 0.5]} {...ETQ} />
      <Line points={[[3.35, 1.9, 1.3], [0.46, 1.55, 1.37]]} color="#334155" lineWidth={1.3} />
    </>
  );
}

export default function Electrocardiograma3DScene({ ritmoBPM }: { ritmoBPM: number }) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 6.2, 24], objetivo: [0, 5.6, 0], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 36, maxPolar: 1.5, paneo: true, cajaObjetivo: [[-5, 2, -2], [5, 9, 2]] }}
      mesa={{ ancho: 24, fondo: 8 }}
    >
      <Escena ritmoBPM={ritmoBPM} />
    </LabCanvas>
  );
}
