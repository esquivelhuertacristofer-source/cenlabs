"use client";

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, ResorteHelicoidal, Etiqueta, cilindro, cajaRedondeada, useMateriales } from '../_kit';
import { CuartoPendulo, SoportePiso } from '../fis03/piezas';
import {
  PortapesasKg, ReglaHooke, FlechaVertical, ponLargoFlecha,
  U_POR_M, L0_RESORTE, RADIO_RESORTE, GROSOR_RESORTE, ESPIRAS, OJAL, OFFSET_INDICE, ALTO_BRAZO, ALTO_VARILLA, ALTO_REGLA, X_REGLA_H,
  LARGO_VASTAGO, ESPESOR_DISCO,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   LeyHooke3DScene — banco de resortes (1 u = 1 dm).

   Montaje: soporte de piso con brazo, resorte helicoidal real (kit) colgado de una
   pinza, portapesas con discos de latón de 1 kg (uno por kilogramo de carga) y regla
   vertical graduada en cm con CERO en la posición del índice con el resorte sin
   estirar. El índice (varilla roja) viaja con la placa: lo que marca es la elongación
   x = m·g/k que el alumno lee en el método estático. Con la carga oscilando, el índice
   y el resorte siguen la oscilación real (ω = √(k/m), amplitud A).

   Diagrama de fuerzas: mg (peso, hacia abajo) y Fe = kx (elástica, hacia arriba) desde la
   carga; en equilibrio miden lo mismo. La escena no rotula k ni x, ni ajusta nada al
   valor de k (el soporte tiene siempre la misma altura).

   Props: { k, masa, amplitud, isOscilando }.
──────────────────────────────────────────────────────────────────────────── */

interface HookeSceneProps {
  k: number;
  masa: number;
  amplitud: number;
  isOscilando: boolean;
}

const G = 9.81;
/** u por newton de las flechas */
const ESC_F = 0.14;

function Escena({ k, masa, amplitud, isOscilando }: HookeSceneProps) {
  const m = useMateriales();
  const scene = useThree((s) => s.scene);
  const tRef = useRef(0);
  const largo = useRef(L0_RESORTE);
  const colgante = useRef<THREE.Group>(null);
  const fPeso = { g: useRef<THREE.Group>(null), c: useRef<THREE.Mesh>(null), h: useRef<THREE.Mesh>(null) };
  const fElas = { g: useRef<THREE.Group>(null), c: useRef<THREE.Mesh>(null), h: useRef<THREE.Mesh>(null) };

  useLayoutEffect(() => {
    scene.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (!l.isDirectionalLight || !l.castShadow) return;
      const c = l.shadow.camera as THREE.OrthographicCamera;
      c.left = -26; c.right = 26; c.top = 26; c.bottom = -26; c.near = 1; c.far = 200;
      c.updateProjectionMatrix();
      l.position.set(-14, 40, 26);
      l.target.position.set(-2, 13, 0); l.target.updateMatrixWorld();
    });
  }, [scene]);

  // geometría vertical del montaje
  const yPinza = ALTO_BRAZO - 0.4;
  const yResorte = yPinza - OJAL;                      // origen de la hélice
  const yZero = yResorte - L0_RESORTE - OJAL + 0.2 - OFFSET_INDICE;   // cero de la regla = índice sin estirar

  useFrame((_, delta) => {
    const xEq = (masa * G) / k;                         // m
    let yDin = 0;
    if (isOscilando) {
      tRef.current += Math.min(delta, 0.1);
      yDin = amplitud * Math.cos(Math.sqrt(k / masa) * tRef.current);
    } else {
      tRef.current = 0;                                 // en reposo la carga está en el equilibrio
    }
    const x = xEq + yDin;                               // elongación instantánea (m)
    largo.current = L0_RESORTE + x * U_POR_M;
    if (colgante.current) colgante.current.position.y = yResorte - largo.current - OJAL + 0.2;
    ponLargoFlecha(fPeso, masa * G * ESC_F, 0.09);
    ponLargoFlecha(fElas, k * x * ESC_F, 0.09);
  });

  const nDiscos = masa;
  const yCM = -0.35 - LARGO_VASTAGO + (nDiscos * ESPESOR_DISCO) / 2;
  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => [[-13.6, 0, -4], [6.2, ALTO_BRAZO + 2.5, 4]], []);

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.03} direccion={[0.04, 0.06, 1]} />
      <CuartoPendulo />
      <SoportePiso alturaBrazo={ALTO_BRAZO} xDerecha={X_REGLA_H + 1.5} altoVarilla={ALTO_VARILLA} />

      {/* pinza de la que cuelga el resorte */}
      <mesh geometry={cajaRedondeada(0.8, 0.7, 0.8, 0.08, 2)} material={m.pintura('#9aa3aa')} position={[0, ALTO_BRAZO - 0.45, 0]} castShadow />
      <mesh geometry={cilindro(0.04, 0.04, 0.35, 8)} material={m.acero} position={[0, yPinza - 0.15, 0]} castShadow />

      {/* resorte: la longitud se anima por ref */}
      <ResorteHelicoidal position={[0, yResorte, 0]} longitud={L0_RESORTE} longitudRef={largo} espiras={ESPIRAS} radio={RADIO_RESORTE} grosor={GROSOR_RESORTE} />

      {/* carga */}
      <group ref={colgante} position={[0, yResorte - L0_RESORTE - OJAL + 0.2, 0]}>
        <PortapesasKg n={nDiscos} />
        {/* diagrama de fuerzas junto a la carga */}
        <group position={[-1.7, yCM, 0.3]}>
          <FlechaVertical r={fPeso} color="#d32f2f" arriba={false} grosor={0.09} />
          <FlechaVertical r={fElas} color="#00897b" arriba grosor={0.09} />
          <Etiqueta texto="mg" position={[-0.7, -1.6, 0]} tamano={0.85} color="#b71c1c" fondo="rgba(255,255,255,0.9)" siempreVisible />
          <Etiqueta texto="Fe = kx" position={[-1.2, 1.6, 0]} tamano={0.8} color="#00695c" fondo="rgba(255,255,255,0.9)" siempreVisible />
        </group>
      </group>

      {/* regla con índice: cero en la posición del índice sin estirar */}
      <ReglaHooke position={[X_REGLA_H, yZero, 0]} alto={ALTO_REGLA} yBrazo={ALTO_BRAZO - 0.3 - yZero} />
    </>
  );
}

export default function LeyHooke3DScene(props: HookeSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        mesa={false}
        camara={{ posicion: [2, 14, 50], objetivo: [-2, 13, 0], fov: 35 }}
        controles={{ minDistancia: 5, maxDistancia: 140, maxPolar: 1.5, cajaObjetivo: [[-25, 0, -10], [20, 32, 10]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
