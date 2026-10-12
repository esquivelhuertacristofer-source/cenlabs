'use client';
/**
 * fis06/piezas.tsx — piezas propias del banco de Arquímedes.
 *
 * ESCALA: la del kit (1 u = 1 dm). Vaso de rebose (lata de Eureka) de acrílico de 15 cm
 * de diámetro con pico vertedor, sobre un elevador de laboratorio; el sólido es un
 * cilindro de ensayo (h = 2,8 r) con armella, colgado del dinamómetro por un hilo.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { cilindro, cajaRedondeada, tornear, toro, useMateriales, geoCache, mm } from '../_kit';

export const RADIO_REBOSE = 0.75;      // u (Ø 15 cm)
export const ALTO_REBOSE = 1.8;        // u
export const GROSOR_PARED = 0.035;
export const ALTURA_ELEVADOR = 0.6;    // u: de la mesa a la plataforma
/** altura del pico (eje) sobre el fondo del vaso de rebose */
export const ALTO_PICO = 1.5;
export const RADIO_PICO = 0.085;
/** el agua queda al ras de la parte baja del pico */
export const NIVEL_REBOSE = ALTO_PICO - RADIO_PICO * 0.5;
export const INCLINACION_PICO = 0.4;   // rad bajo la horizontal
export const LARGO_PICO = 0.82;

/** Dimensiones del cilindro de ensayo (u) para un volumen en m³: h = 2,8 r. */
export function dimensionesSolido(volumenM3: number) {
  const V = volumenM3 * 1000;               // m³ → dm³ = u³
  const r = Math.cbrt(V / (Math.PI * 2.8));
  return { r, h: 2.8 * r };
}

// ───────────────────────────── elevador de laboratorio ─────────────────────────────

/** Elevador de tijera simplificado: plataforma cuadrada de aluminio, columna y perilla. Origen en la mesa. */
export function ElevadorLab({ ancho = 1.8 }: { ancho?: number }) {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cajaRedondeada(ancho * 1.05, 0.08, ancho * 1.05, 0.03, 2)} material={m.hierroPintado} position={[0, 0.04, 0]} castShadow receiveShadow />
      <mesh geometry={cilindro(0.2, 0.2, ALTURA_ELEVADOR - 0.17, 20)} material={m.acero} position={[0, 0.08 + (ALTURA_ELEVADOR - 0.17) / 2, 0]} castShadow />
      <mesh geometry={cajaRedondeada(ancho, 0.09, ancho, 0.03, 2)} material={m.aluminio} position={[0, ALTURA_ELEVADOR - 0.045, 0]} castShadow receiveShadow />
      {/* perilla de ajuste */}
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.045, 0.045, 0.34, 12)} material={m.acero} position={[ancho * 0.52 + 0.1, 0.32, 0]} castShadow />
      <mesh geometry={cilindro(0.1, 0.1, 0.06, 20)} material={m.plastico('#1e2328', 0.5)} rotation={[0, 0, Math.PI / 2]} position={[ancho * 0.52 + 0.3, 0.32, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── vaso de rebose ─────────────────────────────

/** Vaso de rebose de acrílico con pico vertedor (hacia +X). Origen en el centro de la base. */
export function VasoRebose({ colorAgua }: { colorAgua: string }) {
  const m = useMateriales();
  const R = RADIO_REBOSE, H = ALTO_REBOSE, t = GROSOR_PARED;
  const geoVaso = useMemo(() => geoCache(`rebose:${R}:${H}`, () => tornear([
    [0.0005, 0], [R - 0.06, 0], [R - 0.02, 0.012], [R, 0.06], [R, H], [R + 0.025, H + 0.012], [R + 0.025, H + 0.03], [R - t, H + 0.02],
    [R - t, t + 0.04], [R - t - 0.03, t], [0.0005, t],
  ], 64)), [R, H, t]);
  const geoAgua = useMemo(() => new THREE.CylinderGeometry(R - t - 0.004, R - t - 0.004, NIVEL_REBOSE - t, 56), [R, t]);
  useEffect(() => () => geoAgua.dispose(), [geoAgua]);
  const aguaMat = useMemo(() => m.liquido(colorAgua), [m, colorAgua]);
  const largo = LARGO_PICO, a = INCLINACION_PICO;
  return (
    <group>
      <mesh geometry={geoVaso} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      <mesh geometry={geoAgua} material={aguaMat} position={[0, t + (NIVEL_REBOSE - t) / 2, 0]} renderOrder={2} />
      {/* pico vertedor: tubo de acrílico inclinado hacia abajo, saliendo de la pared */}
      <group position={[R - 0.02, ALTO_PICO, 0]} rotation={[0, 0, -Math.PI / 2 - a]}>
        <mesh geometry={cilindro(RADIO_PICO, RADIO_PICO, largo, 20, true)} material={m.vidrio} position={[0, largo / 2, 0]} renderOrder={3} castShadow />
        <mesh geometry={toro(RADIO_PICO, 0.012, 6, 20)} material={m.vidrio} position={[0, largo, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3} />
      </group>
    </group>
  );
}

/** Punto (en el sistema del vaso de rebose) por donde cae el agua. */
export function bocaPico(): [number, number] {
  const L = LARGO_PICO, a = INCLINACION_PICO;
  return [RADIO_REBOSE - 0.02 + L * Math.cos(a), ALTO_PICO - L * Math.sin(a)];
}

// ───────────────────────────── cilindro de ensayo colgado ─────────────────────────────

/** Cilindro de ensayo con armella y el hilo que sube al gancho. Origen en la BASE del cilindro. */
export function SolidoEnsayo({ r, h, largoHilo }: { r: number; h: number; largoHilo: number }) {
  const m = useMateriales();
  const mat = useMemo(() => m.pintura('#8d949a'), [m]);
  return (
    <group>
      <mesh geometry={cilindro(r, r, h, 48)} material={mat} position={[0, h / 2, 0]} castShadow />
      {/* chaflanes de la pieza torneada */}
      <mesh geometry={cilindro(r * 0.96, r, 0.025, 48)} material={mat} position={[0, h - 0.0125, 0]} />
      {/* armella */}
      <mesh geometry={toro(0.045, 0.011, 8, 20)} material={m.acero} position={[0, h + 0.05, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      {/* hilo de pescar */}
      <mesh geometry={cilindro(mm(0.5), mm(0.5), largoHilo, 6)} material={m.plastico('#e9e2cf', 0.8)} position={[0, h + 0.09 + largoHilo / 2, 0]} />
    </group>
  );
}
