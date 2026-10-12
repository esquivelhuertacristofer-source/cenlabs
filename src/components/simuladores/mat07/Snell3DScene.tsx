"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Snell3DScene — banco de óptica visto desde arriba (pizarrón detrás): disco
   óptico graduado, bloque semicircular de vidrio acrílico y apuntador láser.

   El haz entra por la izquierda con θ₁ (medido desde la normal), llega al centro
   del disco y se refracta con la ley de Snell. Como el bloque es semicircular, el
   rayo refractado sale por la curva sin desviarse y cruza la ESCALA del disco:
   el alumno mide θ₂ ahí (marcas cada 1°; con zoom se lee mejor, y a θ₁ grandes
   el error de lectura pesa menos en n₂). La escena NO escribe θ₂ ni n₂.

   Con luz blanca el haz se abre en espectro (la dispersión se exagera ×4 para que
   se vea, y se rotula). Si algún día n₁ > n₂ y hay reflexión total, sólo queda el
   rayo reflejado.
──────────────────────────────────────────────────────────────────────────── */

import React, { useMemo } from 'react';
import { LabCanvas, Etiqueta } from '../_kit';
import { Trazo, EncuadreSuave } from '../mat_comun_1a5/trazos';
import { DiscoOptico, BloqueSemicircular, ApuntadorLaser, R_DISCO, ALTURA_HAZ } from './piezas';

interface Snell3DSceneProps {
  n1: number;
  n2: number | string;
  n2Misterio: number;
  anguloIncidencia: number;
  status: 'idle' | 'success' | 'error';
  laserColor?: 'cyan' | 'red' | 'green' | 'violet' | 'white';
}

const COLORES: Record<string, string> = { cyan: '#22d3ee', red: '#ff3b3b', green: '#3ddc6a', violet: '#a06bff', white: '#ffffff' };
const ESPECTRO = [
  { hex: '#ff3b3b', d: -0.008 }, { hex: '#ff9a2e', d: -0.005 }, { hex: '#f2e03a', d: -0.002 },
  { hex: '#3ddc6a', d: 0 }, { hex: '#22d3ee', d: 0.003 }, { hex: '#4a7bff', d: 0.006 }, { hex: '#a06bff', d: 0.012 },
];
const EXAGERACION = 4;
const L_LASER = 7.8;      // distancia del centro a la punta del láser
const L_SALIDA = R_DISCO + 0.35;  // el haz refractado se dibuja hasta fuera de la escala

const grados = (r: number) => (r * 180) / Math.PI;
const rad = (g: number) => (g * Math.PI) / 180;
/** Puntos de un arco que parte de la normal (arriba o abajo) hacia un lado. */
function arco(theta: number, radio: number, abajo: boolean, lado: 1 | -1): [number, number][] {
  const n = Math.max(6, Math.ceil(grados(theta) / 2));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (theta * i) / n;
    return [lado * Math.sin(a) * radio, (abajo ? -1 : 1) * Math.cos(a) * radio] as [number, number];
  });
}

function Contenido({ n1, n2, n2Misterio, anguloIncidencia, laserColor = 'green' }: Snell3DSceneProps) {
  const realN2 = n2 === 'misterio' ? n2Misterio : (n2 as number);
  const t1 = rad(anguloIncidencia);
  const blanco = laserColor === 'white';
  const color = COLORES[laserColor] ?? COLORES.green;
  const s2 = (n1 / realN2) * Math.sin(t1);
  const tir = s2 > 1;
  const t2 = tir ? 0 : Math.asin(s2);

  const inicio = useMemo<[number, number]>(() => [-Math.sin(t1) * L_LASER, Math.cos(t1) * L_LASER], [t1]);
  const reflejado = useMemo<[number, number]>(() => [Math.sin(t1) * L_SALIDA, Math.cos(t1) * L_SALIDA], [t1]);
  const refractado = useMemo<[number, number]>(() => [Math.sin(t2) * L_SALIDA, -Math.cos(t2) * L_SALIDA], [t2]);
  const espectro = useMemo(() => (blanco && !tir ? ESPECTRO.map((c) => {
    const sT = (n1 / (realN2 + c.d * EXAGERACION)) * Math.sin(t1);
    if (sT > 1) return null;
    const a = Math.asin(sT);
    return { hex: c.hex, fin: [Math.sin(a) * L_SALIDA, -Math.cos(a) * L_SALIDA] as [number, number] };
  }).filter(Boolean) as { hex: string; fin: [number, number] }[] : []), [blanco, tir, n1, realN2, t1]);

  const arco1 = useMemo(() => arco(t1, 3.4, false, -1), [t1]);
  const arco2 = useMemo(() => arco(t2, 3.4, true, 1), [t2]);
  const hazBlanco = '#f4f7fb';

  return (
    <>
      <EncuadreSuave caja={[[-11, -8.3, 0], [11.2, 10.8, 0]]} margen={1.03} />
      <DiscoOptico />
      <BloqueSemicircular />

      {/* normal (a rayas) y rótulos de los medios */}
      <Trazo pts={[[0, -R_DISCO + 0.2], [0, R_DISCO - 0.2]]} color="#c25a5a" radio={0.018} rayas={[0.3, 0.22]} z={0.02} />
      <Etiqueta modo="plano" texto={`MEDIO 1 · aire (n_1 = ${n1.toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0')})`} color="#f4f7f8" fondo="rgba(20,30,36,0.78)" tamano={0.42}
        ancla={[1, 0.5]} position={[11, 4.6, 0.05]} />
      <Etiqueta modo="plano" texto="MEDIO 2 · bloque (n_2 = ?)" color="#bfe6f5" fondo="rgba(20,30,36,0.78)" tamano={0.42}
        ancla={[1, 0.5]} position={[11, -4.6, 0.05]} />

      {/* haz: incidente, reflejado (débil) y refractado */}
      <Trazo pts={[inicio, [0, 0]]} color={blanco ? hazBlanco : color} radio={0.045} z={ALTURA_HAZ + 0.02} />
      <Trazo pts={[[0, 0], reflejado]} color={tir ? color : blanco ? hazBlanco : color} radio={tir ? 0.045 : 0.02} opacidad={tir ? 1 : 0.28} z={ALTURA_HAZ + 0.02} />
      {!tir && !blanco && <Trazo pts={[[0, 0], refractado]} color={color} radio={0.045} z={ALTURA_HAZ + 0.02} />}
      {!tir && blanco && espectro.map((r) => <Trazo key={r.hex} pts={[[0, 0], r.fin]} color={r.hex} radio={0.034} z={ALTURA_HAZ + 0.02} />)}

      {/* ángulos desde la normal: θ₁ numérico (dato del experimento), θ₂ sólo marcado */}
      {arco1.length > 1 && <Trazo pts={arco1} color="#ffd166" radio={0.022} z={ALTURA_HAZ + 0.03} />}
      {!tir && arco2.length > 1 && <Trazo pts={arco2} color="#ff8fb8" radio={0.022} z={ALTURA_HAZ + 0.03} />}
      <Etiqueta modo="plano" texto={`θ_1 = ${anguloIncidencia}°`} color="#ffd166" fondo="rgba(20,30,36,0.82)" tamano={0.44}
        ancla={[1, 0.5]} position={[-Math.sin(t1 / 2) * 3.9 - 0.2, Math.cos(t1 / 2) * 3.9, 0.06]} />
      {!tir && !blanco && (
        <Etiqueta modo="plano" texto="θ_2 = ? (mídelo)" color="#ff8fb8" fondo="rgba(20,30,36,0.82)" tamano={0.44}
          ancla={[1, 0.5]} position={[-0.35, -2.4, 0.06]} />
      )}
      {blanco && !tir && (
        <Etiqueta modo="plano" texto="luz blanca: dispersión exagerada ×4" color="#f4f7f8" fondo="rgba(20,30,36,0.82)" tamano={0.4}
          ancla={[0, 0.5]} position={[-10.8, -6.2, 0.06]} />
      )}
      {tir && (
        <Etiqueta modo="plano" texto="Reflexión total interna" color="#ff8a8a" fondo="rgba(20,30,36,0.85)" tamano={0.4}
          ancla={[0, 0.5]} position={[2.2, 2.6, 0.06]} />
      )}

      {/* punto de incidencia */}
      <mesh position={[0, 0, ALTURA_HAZ + 0.03]}><circleGeometry args={[0.12, 20]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>

      {/* apuntador láser: la punta en el inicio del haz, cuerpo hacia atrás */}
      <ApuntadorLaser color={color} position={[inicio[0], inicio[1], ALTURA_HAZ]} rotation-z={t1} />
    </>
  );
}

export default function Snell3DScene(props: Snell3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 26], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 5, maxDistancia: 60, maxPolar: Math.PI * 0.6, minPolar: 0 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
