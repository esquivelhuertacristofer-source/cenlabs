"use client";
/**
 * Q9 · Celda galvánica — mesa de laboratorio (R3F + kit).
 *
 *   Dos vasos de precipitados con la sal 1 M de cada metal (el Cu²⁺ tiñe de azul), un electrodo en
 *   lámina en cada vaso, un puente salino en U con tapones de algodón y un multímetro cuyas
 *   puntas —COM negra al vaso izquierdo, V roja al derecho— tocan las láminas al conectar.
 *
 *   El multímetro marca lo que marcaría el instrumento (E°der − E°izq, con signo). La escena NO
 *   dibuja flujo de electrones ni etiqueta ánodo/cátodo: identificarlos es la tarea del alumno.
 */
import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, VasoPrecipitado, MultimetroDigital, Etiqueta, defVaso,
} from '../_kit';
import { LaminaMetal, PuenteSalino, SALES, LAMINA } from './piezas';

type V3 = [number, number, number];

export interface Galvanic3DProps {
  metalIzq: string | null;
  metalDer: string | null;
  puenteSalino: boolean;
  cablesConectados: boolean;
  voltaje: number;
  /** metales del reto: los que aún no están en un vaso se ven sobre la mesa */
  seedMetales: string[];
}

const ESCALA_VASO = 1.25;
const XL = -1.35, XR = 1.35, ZV = 0.4;
const VOL_SOL = 150;
const DESPL_LAMINA = 0.24;           // la lámina se apoya en el lado exterior de su vaso
const POS_MULTI: V3 = [0, 0, -2.7];
const POS_PUENTE: V3 = [0, 0.3, ZV];
const REPOSO_PUENTE: V3 = [0, 0.05, -1.7];
const defV = defVaso(250);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Estado 3D que se acerca a `objetivo` con una exponencial; sólo re-renderiza mientras se mueve. */
function useSuave(objetivo: V3, vel = 4): V3 {
  const [v, setV] = useState<V3>(objetivo);
  const ref = useRef<V3>(objetivo);
  useFrame((_, dt) => {
    const d = dist(ref.current, objetivo);
    if (d < 1e-3) { if (d > 0) { ref.current = objetivo; setV(objetivo); } return; }
    ref.current = lerp3(ref.current, objetivo, 1 - Math.exp(-Math.min(dt, 0.05) * vel));
    setV(ref.current);
  });
  return v;
}

/** Electrodo dentro de su vaso, con su rótulo de metal. */
function ElectrodoEnVaso({ metal, x }: { metal: string; x: number }) {
  const xs = x + (x < 0 ? -DESPL_LAMINA : DESPL_LAMINA);
  return (
    <group position={[xs, defV.grosor * ESCALA_VASO + 0.012, ZV - 0.14]} rotation={[-0.07, 0, x < 0 ? 0.04 : -0.04]}>
      <LaminaMetal metal={metal} />
      <Etiqueta texto={metal} position={[0, LAMINA.alto + 0.26, 0.02]} tamano={0.24} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={700} />
    </group>
  );
}

function Montaje({ metalIzq, metalDer, puenteSalino, cablesConectados, voltaje, seedMetales }: Galvanic3DProps) {
  const completo = !!metalIzq && !!metalDer && puenteSalino && cablesConectados;

  // puntas del multímetro (coordenadas locales de éste): en reposo sobre la mesa; conectadas, tocan la lámina
  const REPOSO_ROJA: V3 = [0.7, 0.02, 1.3];
  const REPOSO_NEGRA: V3 = [-0.7, 0.02, 1.3];
  const topeL: V3 = [XL - DESPL_LAMINA, 1.44, ZV - 0.25];
  const topeR: V3 = [XR + DESPL_LAMINA, 1.44, ZV - 0.25];
  const conectadas = cablesConectados;
  const puntaRoja = useSuave(conectadas ? sub(topeR, POS_MULTI) : REPOSO_ROJA, 3.5);
  const puntaNegra = useSuave(conectadas ? sub(topeL, POS_MULTI) : REPOSO_NEGRA, 3.5);
  const dirRoja = useMemo<V3>(() => [(XR - 0.4) * 0.12, -0.55, 1], []);
  const dirNegra = useMemo<V3>(() => [(XL + 0.4) * 0.12, -0.55, 1], []);

  // puente salino: de la mesa a su sitio, levantándolo en arco
  const pPuente = useSuave(puenteSalino ? POS_PUENTE : REPOSO_PUENTE, 3);
  const k = dist(pPuente, puenteSalino ? POS_PUENTE : REPOSO_PUENTE);
  const elevacion = Math.min(1, k / 1.2) * 0.9;
  const giro = THREE.MathUtils.clamp(1 - dist(pPuente, POS_PUENTE) / dist(REPOSO_PUENTE, POS_PUENTE), 0, 1);

  const sinColocar = seedMetales.filter((s) => s !== metalIzq && s !== metalDer);

  return (
    <group>
      {/* vasos con la sal 1 M de su metal (vacíos mientras no tienen electrodo) */}
      {([[XL, metalIzq], [XR, metalDer]] as [number, string | null][]).map(([x, met]) => (
        <group key={x} position={[x, 0, ZV]}>
          <group scale={ESCALA_VASO}>
            <VasoPrecipitado capacidad={250} liquido={met ? { volumenML: VOL_SOL, color: SALES[met]?.color ?? '#cfe6ef' } : undefined} />
          </group>
        </group>
      ))}
      {metalIzq && <ElectrodoEnVaso metal={metalIzq} x={XL} />}
      {metalDer && <ElectrodoEnVaso metal={metalDer} x={XR} />}

      {/* puente salino */}
      <group position={[pPuente[0], pPuente[1] + elevacion, pPuente[2]]} rotation={[(1 - giro) * (Math.PI / 2), 0, 0]}>
        <PuenteSalino semiancho={Math.abs(XL) - 0.3} alto={1.3} />
      </group>

      {/* multímetro con COM (negra) y V (roja) */}
      <MultimetroDigital
        position={POS_MULTI}
        lectura={completo ? voltaje : 0}
        unidad="V" modo="V⎓" decimales={2}
        puntaRoja={puntaRoja} puntaNegra={puntaNegra} direccionRoja={dirRoja} direccionNegra={dirNegra}
      />

      {/* láminas aún sin montar, sobre la mesa */}
      {sinColocar.map((met, i) => (
        <group key={met} position={[(i - (sinColocar.length - 1) / 2) * 1.1, 0.012, 2.2]} rotation={[-Math.PI / 2, 0, 0.12]}>
          <LaminaMetal metal={met} position={[0, -LAMINA.alto / 2, 0]} />
          <Etiqueta texto={met} position={[0, 0.8, 0.2]} tamano={0.22} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={700} />
        </group>
      ))}

      {/* rótulos de cada vaso */}
      {([[XL, metalIzq, 'COM · punta negra'], [XR, metalDer, 'V · punta roja']] as [number, string | null, string][]).map(([x, met, punta]) => (
        <Etiqueta key={x} texto={met ? `${SALES[met]?.cation ?? ''} 1 M` : 'vaso sin montar'} position={[x, 0.12, ZV + 0.95]}
          tamano={0.17} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
      ))}
      {([[XL, 'COM · punta negra'], [XR, 'V · punta roja']] as [number, string][]).map(([x, t]) => (
        <Etiqueta key={'p' + x} texto={t} position={[x, 0.12, ZV + 1.25]} tamano={0.13} fondo={null} color="#33444e" peso={600} />
      ))}
    </group>
  );
}

export default function Galvanic3DScene(props: Galvanic3DProps) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 5.2, 10.5], objetivo: [0, 1.0, -0.4], fov: 35 }}
      controles={{ minDistancia: 4, maxDistancia: 22, cajaObjetivo: [[-3.5, 0.3, -3], [3.5, 2.5, 2]] }}
    >
      <EncuadrarCaja caja={[[-3.0, 0, -3.5], [3.0, 3.0, 2.3]]} margen={1.0} direccion={[0, 0.42, 1]} />
      <Montaje {...props} />
    </LabCanvas>
  );
}
