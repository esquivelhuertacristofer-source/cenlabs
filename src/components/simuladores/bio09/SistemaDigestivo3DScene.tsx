"use client";

/**
 * Digestión enzimática en 3D: el BANCO (baño termostático a 37 °C con el tubo control y
 * el tubo con enzima, medidor de pH, frasco de la enzima) y el APARATO DIGESTIVO con el
 * corte de pared del órgano que el alumno elige.
 *
 * Qué se ve (y qué no):
 *   · el indicador (Lugol / Biuret / fenolftaleína) muestra el sustrato que queda sin
 *     digerir en el último ensayo; el control, sin enzima, no cambia; una enzima
 *     desnaturalizada precipita; sin bilis la grasa forma una capa de aceite;
 *   · el modelo anatómico NO marca dónde actúa la enzima ni dónde se absorbe: sólo señala
 *     el órgano que PROPONE el alumno y el corte de pared muestra el que elige para la
 *     absorción (vellosidades, pliegues, criptas…);
 *   · los monómeros pasan a la sangre sólo cuando la práctica quedó validada.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LabCanvas, EncuadrarCaja, Etiqueta } from '../_kit';
import { ENZIMAS_B9 } from '@/domain/biologia';
import type { EnzimaB9, IncubacionB9, MacronutrienteB9, OrganoB9 } from '@/store/types';
import { BanoTermostatico, GradillaDelBano, TuboMuestra, MedidorPH, SondaPH, FrascoEnzima, NOMBRE_INDICADOR } from './piezas';
import { AparatoDigestivo, CortePared, Pin } from './anatomia';

const ETQ = { tamano: 0.34, fondo: '#ffffffec', color: '#10212b' } as const;
const S_BANCO = 3.2;
const POS_BANCO = new THREE.Vector3(-4.3, 0, 0.6);
const POS_ANAT = new THREE.Vector3(4.5, 5.15, -0.5);
const K_ANAT = 0.9;
/** punto del modelo anatómico (coordenadas locales del aparato) en el mundo */
const anat = (x: number, y: number, z = 0.6): [number, number, number] => [POS_ANAT.x + K_ANAT * x, POS_ANAT.y + K_ANAT * y, POS_ANAT.z + K_ANAT * z];
const COLOR_MONOMERO: Record<MacronutrienteB9, string> = { almidon: '#22c55e', proteina: '#8b5cf6', lipido: '#fbbf24' };
const NOMBRE_MONOMERO: Record<MacronutrienteB9, string> = { almidon: 'Glucosa', proteina: 'Aminoácidos', lipido: 'Ácidos grasos' };

/** Vena porta con partículas de monómeros que van del delgado al hígado (sólo tras validar). */
function FlujoAbsorcion({ activo, color }: { activo: boolean; color: string }) {
  const curva = useMemo(() => new THREE.CatmullRomCurve3([[0.2, -2.7, 0.35], [0.5, -1.7, 0.4], [0.2, -0.4, 0.4], [-0.45, 0.6, 0.38], [-0.9, 1.15, 0.3]].map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal'), []);
  const geoVena = useMemo(() => new THREE.TubeGeometry(curva, 60, 0.05, 8, false), [curva]);
  useEffect(() => () => { geoVena.dispose(); }, [geoVena]);
  const matVena = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5b6fb8', roughness: 0.5 }), []);
  const matP = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 }), [color]);
  useEffect(() => () => { matVena.dispose(); matP.dispose(); }, [matVena, matP]);
  const bolas = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    bolas.current.forEach((b, i) => {
      if (!b) return;
      b.visible = activo;
      if (activo) { b.position.copy(curva.getPointAt((s.clock.elapsedTime * 0.18 + i / 8) % 1)); b.scale.setScalar(0.075); }
    });
  });
  const g = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  useEffect(() => () => { g.dispose(); }, [g]);
  return (
    <group>
      <mesh geometry={geoVena} material={matVena} />
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} ref={(el) => { bolas.current[i] = el; }} geometry={g} material={matP} visible={false} />)}
    </group>
  );
}

export interface PropsDigestivo {
  macronutriente: MacronutrienteB9;
  enzima: EnzimaB9 | null;
  nivelPH: number;
  bilis: boolean;
  ensayo: IncubacionB9 | null;
  incubando: boolean;
  organoRespuesta: OrganoB9 | null;
  absorcionRespuesta: OrganoB9 | null;
  absorbiendo: boolean;
}

function Escena({ macronutriente, enzima, nivelPH, bilis, ensayo, incubando, organoRespuesta, absorcionRespuesta, absorbiendo }: PropsDigestivo) {
  const agitando = useRef(false); agitando.current = incubando;
  const nombreEnzima = enzima ? ENZIMAS_B9[enzima].nombre : 'sin elegir';
  const hidrolisis = ensayo?.hidrolisis ?? 0;
  const bilisTubo = ensayo ? ensayo.bilis : bilis;
  const xe = 0.135, xc = -0.135;                     // posiciones de los tubos (local del banco)
  const sondaTop = new THREE.Vector3(xe + 0.03, 2.1, -0.04);
  const pins: Record<OrganoB9, [number, number]> = { boca: [0, 4.95], estomago: [0.9, 1.5], delgado: [0.0, -1.5], grueso: [-2.0, -1.0] };
  const L = (txt: string, pos: [number, number, number], fin: [number, number, number], izq = false) => (
    <>
      <Etiqueta texto={txt} position={pos} ancla={[izq ? 1 : 0, 0.5]} {...ETQ} />
      <Line points={[[pos[0] + (izq ? 0.04 : -0.04), pos[1], pos[2] - 0.05], fin]} color="#334155" lineWidth={1.2} />
    </>
  );
  return (
    <>
      <EncuadrarCaja caja={[[-8.8, 0, -1.5], [10.9, 12.6, 4.8]]} direccion={[0, 0.12, 1]} margen={1.0} />
      {/* ───── banco ───── */}
      <group position={POS_BANCO.toArray()} scale={S_BANCO}>
        <BanoTermostatico agitando={agitando}>
          <GradillaDelBano>
            <TuboMuestra position={[xc, 0.04, 0]} macro={macronutriente} hidrolisis={0} bilis={bilis} />
            <TuboMuestra position={[xe, 0.04, 0]} macro={macronutriente} hidrolisis={hidrolisis} bilis={bilisTubo} desnaturalizada={ensayo?.resultado === 'desnaturalizada'} agitando={agitando} />
            <SondaPH position={[xe + 0.03, 0.12, -0.04]} />
          </GradillaDelBano>
        </BanoTermostatico>
        <MedidorPH ph={nivelPH} position={[1.0, 0, 1.0]} rotation={[0, -0.3, 0]} scale={0.8} sonda={[(sondaTop.x - 1.0 + 0.2) / 0.8, sondaTop.y / 0.8, (sondaTop.z - 1.0) / 0.8]} />
        <FrascoEnzima nombre={nombreEnzima} position={[-1.0, 0, 1.0]} />
      </group>
      {L('Control (sin enzima)', [-4.5, 6.85, 2.0], [-4.72, 6.3, 1.9], true)}
      {L('Tubo con enzima', [-3.9, 6.85, 2.0], [-3.9, 6.3, 1.9])}
      <Etiqueta texto={`Indicador: ${NOMBRE_INDICADOR[macronutriente]}`} position={[-4.3, 0.45, 4.9]} {...ETQ} />
      <Etiqueta texto={`Enzima: ${nombreEnzima}`} position={[-7.3, 0.45, 4.9]} tamano={0.28} fondo="#ffffffec" color="#10212b" />
      {/* ───── corte de la pared del órgano elegido ───── */}
      <CortePared position={[-4.3, 9.85, 0]} organo={absorcionRespuesta} macro={macronutriente} absorbiendo={absorbiendo} />
      {/* ───── aparato digestivo ───── */}
      <group position={POS_ANAT.toArray()} scale={K_ANAT}>
        <AparatoDigestivo seleccion={organoRespuesta} />
        <FlujoAbsorcion activo={absorbiendo} color={COLOR_MONOMERO[macronutriente]} />
        {organoRespuesta && <Pin position={[pins[organoRespuesta][0], pins[organoRespuesta][1], 0.5]} />}
      </group>
      {organoRespuesta && <Etiqueta texto="tu respuesta" position={[anat(pins[organoRespuesta][0], 0)[0], anat(0, pins[organoRespuesta][1] + 0.95)[1], 1.2]} tamano={0.26} fondo="#f59e0b" color="#2b1a00" />}
      {absorbiendo && <Etiqueta texto={`${NOMBRE_MONOMERO[macronutriente]} → sangre`} position={[anat(1.2, 0)[0], anat(0, -0.3)[1], 1.2]} ancla={[0, 0.5]} tamano={0.28} fondo="#ffffffec" />}
      {L('Boca', [anat(2.6, 0)[0], anat(0, 4.3)[1], 1.2], anat(1.0, 4.2), false)}
      {L('Glándula salival', [anat(-2.3, 0)[0], anat(0, 3.4)[1], 1.2], anat(-1.55, 3.85), true)}
      {L('Hígado', [anat(-2.5, 0)[0], anat(0, 1.9)[1], 1.2], anat(-1.7, 1.5), true)}
      {L('Vesícula biliar', [anat(-2.5, 0)[0], anat(0, 0.5)[1], 1.2], anat(-0.75, 0.62), true)}
      {L('Estómago', [anat(2.6, 0)[0], anat(0, 1.3)[1], 1.2], anat(1.2, 1.0), false)}
      {L('Páncreas', [anat(2.6, 0)[0], anat(0, -0.5)[1], 1.2], anat(1.6, -0.8), false)}
      {L('Intestino delgado', [anat(2.9, 0)[0], anat(0, -2.6)[1], 1.2], anat(1.3, -2.7), false)}
      {L('Intestino grueso', [anat(2.9, 0)[0], anat(0, -3.8)[1], 1.2], anat(2.05, -3.5), false)}
    </>
  );
}

export default function SistemaDigestivo3DScene(props: PropsDigestivo) {
  return (
    <LabCanvas
      fondo="laboratorio"
      mesa={{ ancho: 26, fondo: 11 }}
      camara={{ posicion: [0.6, 6.5, 26], objetivo: [0.6, 5.5, 0], fov: 35 }}
      controles={{ minDistancia: 6, maxDistancia: 42, maxPolar: 1.5, paneo: true, cajaObjetivo: [[-7, 1, -2], [8, 10, 4]] }}
    >
      <Escena {...props} />
    </LabCanvas>
  );
}
