"use client";

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, Manometro, FlechaFuerza, Etiqueta, cilindro, useMateriales } from '../_kit';
import {
  PisoTaller, BastidorYColector, CilindroVidrio, Embolo, Palanca, CargaAcero, ladoBloque,
  H_CIL, Y0, X_BOMBA, X_RAM, X_FULCRO, ALTO_PISTON, LARGO_VASTAGO_BOMBA, ALTO_PISTON_RAM, LARGO_VASTAGO_RAM,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   PrensaHidraulica3DScene — gato hidráulico en corte (1 u = 1 dm).

   Dos cilindros de vidrio unidos por un canal con aceite: émbolo de bombeo a la
   izquierda (radio r₁ real) con su palanca y su fulcro, émbolo de salida a la derecha
   (radio r₂ real) que sostiene una plataforma con un bloque de acero cuya masa es la
   carga. Cada émbolo lleva sellos de goma y cada cilindro una regla de nivel con la
   MISMA escala (1 cm de nivel = 0,1 u): al bombear se mide Δh₁ y Δh₂ y se comprueba
   A₁·Δh₁ = A₂·Δh₂. El manómetro de carátula marca F₁/A₁ (la fuerza aplicada sobre el
   émbolo pequeño); la flecha F₁ está sobre el vástago de bombeo.

   Props: { y1, y2 (nivel de aceite bajo cada émbolo, fracción de H_CIL), r1, r2 (cm),
   masaCarga (kg), f1 (N) }. Nunca se muestra la fuerza mínima.
──────────────────────────────────────────────────────────────────────────── */

interface PrensaProps {
  y1: number; // nivel del aceite bajo el émbolo 1 (0 a 1, fracción de la altura del cilindro)
  y2: number; // nivel del aceite bajo el émbolo 2
  r1: number; // radio del émbolo 1 (cm)
  r2: number; // radio del émbolo 2 (cm)
  masaCarga?: number;
  f1?: number;
}

const ACEITE = '#d9a441';
/** el fulcro está a la altura del pasador del vástago con el émbolo en reposo (nivel 0,6) */
const Y_FULCRO = Y0 + 0.6 * H_CIL + ALTO_PISTON + LARGO_VASTAGO_BOMBA;
const U_POR_N = 0.0011;

function Escena({ y1, y2, r1, r2, masaCarga = 800, f1 = 0 }: PrensaProps) {
  const m = useMateriales();
  const scene = useThree((s) => s.scene);
  const ri1 = r1 * 0.1, ri2 = r2 * 0.1;          // cm → u (1 u = 1 dm)
  const lado = ladoBloque(masaCarga);
  const barras = f1 / (Math.PI * (r1 / 100) ** 2) / 1e5;

  const fluido1 = useRef<THREE.Mesh>(null);
  const fluido2 = useRef<THREE.Mesh>(null);
  const piston1 = useRef<THREE.Group>(null);
  const piston2 = useRef<THREE.Group>(null);
  const plataforma = useRef<THREE.Group>(null);
  const palanca = useRef<THREE.Group>(null);
  const pasador = useRef<THREE.Group>(null);
  const flecha = useRef<THREE.Group>(null);
  const actual = useRef({ y1: THREE.MathUtils.clamp(y1, 0, 1), y2: THREE.MathUtils.clamp(y2, 0, 1) });
  const largoFlecha = Math.max(0.01, f1 * U_POR_N);

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#dfe3e6', 45, 110);
    scene.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (!l.isDirectionalLight || !l.castShadow) return;
      const c = l.shadow.camera as THREE.OrthographicCamera;
      c.left = -24; c.right = 24; c.top = 24; c.bottom = -24; c.near = 1; c.far = 120;
      c.updateProjectionMatrix();
      l.position.set(-14, 30, 22);
      l.target.position.set(-4, 4, 0); l.target.updateMatrixWorld();
    });
  }, [scene]);

  useFrame((_, delta) => {
    // los niveles llegan acotados a [0, 1]; la escena se acerca suavemente (sin reconstruir geometrías)
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.1));
    const c = actual.current;
    c.y1 += (THREE.MathUtils.clamp(y1, 0, 1) - c.y1) * k;
    c.y2 += (THREE.MathUtils.clamp(y2, 0, 1) - c.y2) * k;
    const h1 = Math.max(0.001, c.y1 * H_CIL), h2 = Math.max(0.001, c.y2 * H_CIL);
    if (fluido1.current) { fluido1.current.scale.y = h1; fluido1.current.position.y = Y0 + h1 / 2; }
    if (fluido2.current) { fluido2.current.scale.y = h2; fluido2.current.position.y = Y0 + h2 / 2; }
    if (piston1.current) piston1.current.position.y = Y0 + h1;
    if (piston2.current) piston2.current.position.y = Y0 + h2;
    if (plataforma.current) plataforma.current.position.y = Y0 + h2 + ALTO_PISTON_RAM + LARGO_VASTAGO_RAM;
    // palanca: el pasador del vástago corre por la ranura; su altura la fija el émbolo
    const yc = Y0 + h1 + ALTO_PISTON + LARGO_VASTAGO_BOMBA;
    if (palanca.current) palanca.current.rotation.z = Math.atan((Y_FULCRO - yc) / (X_FULCRO - X_BOMBA));
    if (pasador.current) pasador.current.position.y = yc;
    if (flecha.current) flecha.current.position.y = yc + 0.35 + largoFlecha;
  });

  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [[-12.8, 0, -2.6], [Math.max(4.6, lado / 2 + 1.2), 5.4 + 0.58 * lado, 2.6]], [lado]);
  const yReposo2 = Y0 + 0.3 * H_CIL;

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.0} direccion={[0.1, 0.16, 1]} />
      <PisoTaller />
      <BastidorYColector r1={ri1} r2={ri2} colorAceite={ACEITE} />

      {/* cilindro de bombeo */}
      <group position={[X_BOMBA, Y0, 0]}>
        <CilindroVidrio ri={ri1} lado="izq" />
      </group>
      <mesh ref={fluido1} position={[X_BOMBA, Y0 + 0.6 * H_CIL / 2, 0]} scale={[ri1 * 0.985, 0.6 * H_CIL, ri1 * 0.985]} geometry={cilindro(1, 1, 1, 32)} material={m.liquido(ACEITE)} />
      <group ref={piston1} position={[X_BOMBA, Y0 + 0.6 * H_CIL, 0]}>
        <Embolo r={ri1} h={ALTO_PISTON} vastago={LARGO_VASTAGO_BOMBA} rVastago={Math.min(0.045, ri1 * 0.55)} />
      </group>

      {/* cilindro de salida */}
      <group position={[X_RAM, Y0, 0]}>
        <CilindroVidrio ri={ri2} lado="der" />
      </group>
      <mesh ref={fluido2} position={[X_RAM, yReposo2 / 2 + Y0 / 2, 0]} scale={[ri2 * 0.985, 0.3 * H_CIL, ri2 * 0.985]} geometry={cilindro(1, 1, 1, 40)} material={m.liquido(ACEITE)} />
      <group ref={piston2} position={[X_RAM, yReposo2, 0]}>
        <Embolo r={ri2} h={ALTO_PISTON_RAM} vastago={LARGO_VASTAGO_RAM} rVastago={Math.min(0.6 * ri2, 0.26)} />
      </group>

      {/* plataforma y carga sobre el vástago del émbolo de salida */}
      <group ref={plataforma} position={[X_RAM, yReposo2 + ALTO_PISTON_RAM + LARGO_VASTAGO_RAM, 0]}>
        <CargaAcero masa={masaCarga} />
      </group>

      {/* palanca de bombeo en su fulcro */}
      <group ref={palanca} position={[X_FULCRO, Y_FULCRO, 0]}>
        <Palanca />
      </group>
      <group ref={pasador} position={[X_BOMBA, Y_FULCRO, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.1, 0.1, 0.95, 14)} material={m.cromo} castShadow />
      </group>

      {/* F₁ sobre el vástago de bombeo */}
      <group ref={flecha} position={[X_BOMBA, Y_FULCRO + 0.35 + largoFlecha, 0]}>
        {f1 > 1 && <FlechaFuerza vector={[0, -f1, 0]} escala={U_POR_N} tipo="aplicada" etiqueta="F₁" grosor={0.07} siempreVisible />}
      </group>

      {/* manómetro de carátula en el colector */}
      <mesh geometry={cilindro(0.08, 0.08, 0.7, 12)} material={m.laton} position={[-2.2, 0.85, 0]} castShadow />
      <Manometro position={[-2.2, 2.05, 0.1]} diametro={1.3} valor={barras} min={0} max={250} unidad="bar" titulo="F₁/A₁" divisiones={10} menores={5} decimales={0} />

      {/* rótulos al frente de cada émbolo */}
      <Etiqueta texto={`Entrada  r₁ = ${r1.toFixed(1)} cm`} position={[X_BOMBA + 0.4, 0.75, 1.9]} tamano={0.34} color="#142330" fondo="rgba(255,255,255,0.88)" />
      <Etiqueta texto={`Salida  r₂ = ${r2.toFixed(1)} cm`} position={[X_RAM + 0.4, 0.75, 1.9]} tamano={0.34} color="#142330" fondo="rgba(255,255,255,0.88)" />
    </>
  );
}

export default function PrensaHidraulica3DScene(props: PrensaProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        mesa={false}
        camara={{ posicion: [4, 8, 24], objetivo: [-4, 5, 0], fov: 35 }}
        controles={{ minDistancia: 3, maxDistancia: 70, maxPolar: 1.5, cajaObjetivo: [[-16, 0, -6], [10, 14, 6]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
