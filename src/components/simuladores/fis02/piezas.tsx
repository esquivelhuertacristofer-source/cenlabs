'use client';
/**
 * fis02/piezas.tsx — piezas propias de la rampa de pruebas (plano inclinado).
 *
 * ESCALA DE ESTE LAB: 1 u = 1 m (la rampa mide 10 m, como en el dominio). Todo el
 * montaje se dibuja en el sistema LOCAL de la rampa: origen en el eje de la bisagra,
 * +X a lo largo del plano (hacia arriba), +Y normal al plano, +Z hacia el alumno.
 * El grupo que lo contiene se gira `angulo` sobre Z.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Etiqueta, cilindro, cajaRedondeada, esfera, useMateriales, useTexturaLienzo, familiaTexto, texturaCompartida, dibujarMoteado } from '../_kit';

/** longitud útil de la rampa (m): la del dominio */
export const LARGO_UTIL = 10;
/** el origen de la coordenada de posición del bloque está a esta distancia de la bisagra */
export const X0 = 2.1;
export const LARGO_PLACA = LARGO_UTIL + 2 * X0;
/** posición de los topes de goma (del borde de cada extremo) */
export const X_TOPE = X0 - 0.95;
export const ANCHO_PLACA = 2.5;
export const ESPESOR_PLACA = 0.12;
export const ALTO_RIEL = 0.42;
/** altura del bloque y de los puntos de amarre del cable */
export const BLOQUE = { largo: 1.4, alto: 1.0, ancho: 1.6 };
export const Y_CABLE = 0.5;
/** la bisagra queda a esta altura del piso */
export const ALTO_BISAGRA = 0.55;

// ───────────────────────────── piso de la nave de pruebas ─────────────────────────────

export function PisoPruebas() {
  const tex = texturaCompartida('concreto-fis02', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#b6babd', [
      { color: '#9aa0a4', n: 1800, r: [1, 3], alfa: 0.35 },
      { color: '#cfd3d5', n: 1500, r: [0.8, 2.4], alfa: 0.35 },
    ], 17);
    ctx.strokeStyle = 'rgba(80,90,96,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);   // junta de dilatación
  }, { repetir: [14, 14] });
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0, 0]} material={mat} receiveShadow>
      <planeGeometry args={[160, 160]} />
    </mesh>
  );
}

// ───────────────────────────── rampa ─────────────────────────────

/** Placa con rieles laterales, tope en cada extremo y cinta graduada (marcas cada 0,5 m; cifras cada 2,5 m). */
export function PlacaRampa() {
  const m = useMateriales();
  const cinta = useTexturaLienzo(4096, 128, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f2c230'; ctx.fillRect(0, 0, W, H);
    const pxm = W / LARGO_PLACA;
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#111';
    for (let i = 0; i <= LARGO_UTIL * 10; i++) {
      const x = (X0 + i / 10) * pxm;
      const mayor = i % 25 === 0, medio = i % 5 === 0;
      ctx.lineWidth = mayor ? 7 : medio ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x, H * (mayor ? 0.38 : medio ? 0.55 : 0.75)); ctx.stroke();
    }
    ctx.font = `700 ${H * 0.34}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = 0; v <= LARGO_UTIL; v += 2.5) {
      ctx.fillText(Number.isInteger(v) ? `${v}` : String(v).replace('.', ','), (X0 + v) * pxm, 4);
    }
  }, []);
  const matCinta = useMemo(() => new THREE.MeshStandardMaterial({ map: cinta, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [cinta]);
  useEffect(() => () => matCinta.dispose(), [matCinta]);
  const largo = LARGO_PLACA;
  return (
    <group>
      {/* superficie */}
      <mesh geometry={cajaRedondeada(largo, ESPESOR_PLACA, ANCHO_PLACA, 0.02, 2)} material={m.pintura('#8d969c')} position={[largo / 2, -ESPESOR_PLACA / 2, 0]} castShadow receiveShadow />
      {/* rieles (perfil en C visto de frente) */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cajaRedondeada(largo, ALTO_RIEL, 0.08, 0.02, 2)} material={m.pintura('#5d6870')} position={[largo / 2, -ESPESOR_PLACA - ALTO_RIEL / 2 + 0.1, s * (ANCHO_PLACA / 2 - 0.04)]} castShadow receiveShadow />
      ))}
      {/* travesaños */}
      {[0.1, 0.27, 0.45, 0.63, 0.8, 0.95].map((t) => (
        <mesh key={t} geometry={cajaRedondeada(0.1, 0.16, ANCHO_PLACA - 0.1, 0.02, 1)} material={m.pintura('#5d6870')} position={[largo * t, -ESPESOR_PLACA - 0.08, 0]} castShadow />
      ))}
      {/* cinta graduada en el riel frontal */}
      <mesh position={[largo / 2, -ESPESOR_PLACA - ALTO_RIEL / 2 + 0.1, ANCHO_PLACA / 2 + 0.002]} material={matCinta}>
        <planeGeometry args={[largo, ALTO_RIEL - 0.04]} />
      </mesh>
      {/* topes de goma */}
      {[X_TOPE, largo - X_TOPE].map((x) => (
        <mesh key={x} geometry={cajaRedondeada(0.16, 0.3, ANCHO_PLACA - 0.2, 0.04, 2)} material={m.goma} position={[x, 0.15, 0]} castShadow />
      ))}
    </group>
  );
}

/** Bisagra: placa fija en el piso + muñón. Origen en el eje. */
export function Bisagra() {
  const m = useMateriales();
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.1, 0.1, ANCHO_PLACA + 0.3, 20)} material={m.cromo} castShadow />
    </group>
  );
}

/** Base de la bisagra (en coordenadas del mundo, apoyada en el piso). */
export function BaseBisagra() {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cajaRedondeada(1.0, ALTO_BISAGRA - 0.05, ANCHO_PLACA + 0.2, 0.04, 2)} material={m.hierroPintado} position={[-0.1, (ALTO_BISAGRA - 0.05) / 2, 0]} castShadow receiveShadow />
    </group>
  );
}

/** Cuadrante graduado 0°–90° (placa trasera fija; la rampa marca el ángulo sobre ella). */
export { Cuadrante } from '../fis01/piezas';

// ───────────────────────────── columna de soporte ─────────────────────────────

/** Columna de acero con base y collarín deslizante bajo la placa. Origen en el piso; `alto` = hasta el apoyo. */
export function ColumnaSoporte({ alto }: { alto: number }) {
  const m = useMateriales();
  const h = Math.max(0.05, alto);
  return (
    <group>
      <mesh geometry={cajaRedondeada(1.5, 0.1, 1.5, 0.03, 2)} material={m.hierroPintado} position={[0, 0.05, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(0.34, h, 0.34, 0.03, 2)} material={m.acero} position={[0, 0.1 + h / 2, 0]} castShadow receiveShadow />
      {/* cartelas de la base */}
      {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([sx, sz], i) => (
        <mesh key={i} geometry={cajaRedondeada(sx ? 0.5 : 0.1, 0.6, sz ? 0.5 : 0.1, 0.02, 1)} material={m.hierroPintado} position={[sx * 0.32, 0.4, sz * 0.32]} castShadow />
      ))}
      {/* collarín de apoyo */}
      <mesh geometry={cajaRedondeada(0.55, 0.16, 0.55, 0.03, 2)} material={m.pintura('#c9a227')} position={[0, 0.1 + h + 0.04, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── bloque de prueba ─────────────────────────────

/** Bloque de acero con lastre apilable y rótulo de masa. Origen en el centro de su base. */
export function BloqueMasa({ masa, extra }: { masa: number; extra: number }) {
  const m = useMateriales();
  const placas = Math.round(extra / 5);
  const { largo, alto, ancho } = BLOQUE;
  return (
    <group>
      <mesh geometry={cajaRedondeada(largo, alto, ancho, 0.05, 3)} material={m.pintura('#4f6a86')} position={[0, alto / 2, 0]} castShadow receiveShadow />
      {/* patines de fricción bajo el bloque */}
      <mesh geometry={cajaRedondeada(largo - 0.1, 0.03, ancho - 0.1, 0.01, 1)} material={m.goma} position={[0, 0.015, 0]} />
      {/* argollas de amarre a ambos lados */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[0, Math.PI / 2, 0]} position={[s * (largo / 2 + 0.03), Y_CABLE, 0]} castShadow material={m.cromo}>
          <torusGeometry args={[0.07, 0.022, 8, 20]} />
        </mesh>
      ))}
      {/* lastre */}
      {Array.from({ length: placas }, (_, i) => (
        <mesh key={i} geometry={cajaRedondeada(largo - 0.1, 0.1, ancho - 0.2, 0.02, 2)} material={m.acero} position={[0, alto + 0.05 + i * 0.105, 0]} castShadow receiveShadow />
      ))}
      <Etiqueta texto={`${masa} kg`} modo="plano" position={[0, alto / 2, ancho / 2 + 0.006]} tamano={0.22} color="#ffffff" fondo={null} />
    </group>
  );
}

// ───────────────────────────── cabestrante y cable ─────────────────────────────

/** Cabestrante: caja con tambor. `haciaMenos` lo orienta hacia −X (el del extremo bajo). */
export function Cabestrante({ haciaMenos = false }: { haciaMenos?: boolean }) {
  const m = useMateriales();
  const s = haciaMenos ? -1 : 1;
  return (
    <group scale={[s, 1, 1]}>
      <mesh geometry={cajaRedondeada(0.9, 0.62, 0.8, 0.05, 2)} material={m.pintura('#c9a227')} position={[0, 0.31, 0]} castShadow receiveShadow />
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.2, 0.2, 0.9, 24)} material={m.acero} position={[0.46, Y_CABLE, 0]} castShadow />
      <mesh geometry={cajaRedondeada(0.3, 0.22, 0.5, 0.04, 2)} material={m.plastico('#1d1f22', 0.6)} position={[-0.2, 0.73, 0]} castShadow />
    </group>
  );
}

/** Cable recto paralelo a la rampa entre x0 y x1, a la altura Y_CABLE. */
export function CableRecto({ x0, x1 }: { x0: number; x1: number }) {
  const m = useMateriales();
  const L = Math.abs(x1 - x0);
  if (L < 0.02) return null;
  return (
    <mesh position={[(x0 + x1) / 2, Y_CABLE, 0]} rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.025, 0.025, L, 8)} material={m.acero} castShadow />
  );
}

// ───────────────────────────── sensor de posición ─────────────────────────────

/** Detector ultrasónico de movimiento (transductor de disco) montado al final de la rampa, mirando hacia −X. */
export function SensorPosicion() {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cajaRedondeada(0.34, 0.5, 0.3, 0.04, 2)} material={m.plastico('#2a2f33', 0.5)} position={[0, 0.25 + 0.05, 0]} castShadow />
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.15, 0.15, 0.04, 24)} material={m.laton} position={[-0.19, 0.38, 0]} />
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.1, 0.1, 0.045, 24)} material={m.plastico('#111111', 0.8)} position={[-0.2, 0.38, 0]} />
      <mesh geometry={cajaRedondeada(0.46, 0.06, 0.4, 0.02, 1)} material={m.acero} position={[0, 0.03, 0]} />
      <mesh geometry={esfera(0.025, 8)} material={m.emisor('#38d27a', 2)} position={[0.0, 0.5, 0.16]} />
    </group>
  );
}
