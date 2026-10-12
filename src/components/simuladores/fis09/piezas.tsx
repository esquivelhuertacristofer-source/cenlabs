'use client';
/**
 * fis09/piezas.tsx — piezas propias del banco de electrostática (esferas sobre riel).
 *
 * ESCALA: la del kit (1 u = 1 dm = 10 cm), a tamaño real: esferas metálicas de 1,8 cm de
 * diámetro en columnas aislantes de acrílico de 12,5 cm, sobre un riel de aluminio con una
 * regla de acero graduada en mm. La distancia r entre los centros se lee con los
 * indicadores de cada carro sobre la regla (0 cm en el centro de la esfera fija).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { cilindro, cajaRedondeada, esfera, useMateriales, useTexturaLienzo, familiaTexto, toro } from '../_kit';

export const RADIO_ESFERA = 0.09;          // u (Ø 1,8 cm)
export const ALTO_COLUMNA = 1.25;          // u (12,5 cm)
export const LARGO_RIEL = 4.9;             // u
export const ALTO_RIEL = 0.26;
export const FONDO_RIEL = 0.7;
export const ALTO_CARRO = 0.1;
export const Y_CENTRO_ESFERA = ALTO_RIEL + ALTO_CARRO + ALTO_COLUMNA + 0.02;
export const X_CERO = -2.0;                // u: posición de la esfera fija (0 cm de la regla)
const LARGO_REGLA = 4.5;                   // u: de −2 cm a +43 cm
const X_REGLA0 = -0.2;                     // u respecto al cero: inicio de la regla

// ───────────────────────────── riel con regla ─────────────────────────────

/** Riel de aluminio con regla en cm/mm. Origen: centro del riel apoyado en la mesa; el cero de la regla en x = X_CERO. */
export function RielConRegla() {
  const m = useMateriales();
  const tex = useTexturaLienzo(4096, 200, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#e9ecee'; ctx.fillRect(0, 0, W, H);
    const pxcm = W / (LARGO_REGLA * 10);
    ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let mm = 0; mm <= LARGO_REGLA * 100; mm++) {
      const cm = mm / 10 + X_REGLA0 * 10;           // cm de la regla (0 = esfera fija)
      const x = (mm / 10) * pxcm;
      const esCm = Math.abs(cm - Math.round(cm)) < 1e-6;
      const es5 = esCm && Math.round(cm) % 5 === 0;
      const l = es5 ? 0.5 : esCm ? 0.38 : 0.2;
      if (!esCm && Math.abs(cm * 2 - Math.round(cm * 2)) > 1e-6) continue;   // sólo medios mm cada 0,5 cm → marcas de 5 mm
      ctx.fillRect(x - (es5 ? 1.4 : 0.8), 0, es5 ? 2.8 : 1.6, H * l);
      if (esCm && Math.round(cm) % 2 === 0 && Math.round(cm) >= 0 && Math.round(cm) <= 40) {
        ctx.font = `700 ${H * 0.34}px ${fam}`;
        ctx.fillText(String(Math.round(cm)), x, H * 0.5);
      }
    }
    ctx.font = `700 ${H * 0.3}px ${fam}`; ctx.textAlign = 'left'; ctx.fillText('cm', 6, H * 0.72);
    // marcas de milímetros entre cm
    for (let mm = 0; mm <= LARGO_REGLA * 100; mm++) {
      const cm = mm / 10 + X_REGLA0 * 10;
      if (Math.abs(cm * 2 - Math.round(cm * 2)) < 1e-6) continue;
      ctx.fillRect((mm / 10) * pxcm - 0.5, 0, 1, H * 0.12);
    }
  }, []);
  const matRegla = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.1 }), [tex]);
  useEffect(() => () => matRegla.dispose(), [matRegla]);
  const cx = X_CERO + X_REGLA0 + LARGO_REGLA / 2;
  return (
    <group>
      <mesh geometry={cajaRedondeada(LARGO_RIEL, ALTO_RIEL, FONDO_RIEL, 0.03, 2)} material={m.aluminio} position={[X_CERO + 2.0, ALTO_RIEL / 2, 0]} castShadow receiveShadow />
      {/* ranura central del carro */}
      <mesh position={[X_CERO + 2.0, ALTO_RIEL + 0.002, -0.12]}><boxGeometry args={[LARGO_RIEL - 0.2, 0.004, 0.09]} /><meshStandardMaterial color="#2a2f33" roughness={0.6} /></mesh>
      {/* regla de acero en el borde delantero */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, ALTO_RIEL + 0.004, 0.2]} material={matRegla} receiveShadow>
        <planeGeometry args={[LARGO_REGLA, 0.26]} />
      </mesh>
      {/* topes y patas */}
      {[-1, 1].map((s) => <mesh key={s} geometry={cajaRedondeada(0.12, ALTO_RIEL, FONDO_RIEL, 0.02, 1)} material={m.plastico('#1e2328', 0.5)} position={[X_CERO + 2.0 + s * (LARGO_RIEL / 2 + 0.06), ALTO_RIEL / 2, 0]} castShadow />)}
    </group>
  );
}

// ───────────────────────────── carro con columna aislante y esfera ─────────────────────────────

/**
 * Carro (con indicador sobre la regla), columna de acrílico y esfera metálica. Origen: base del carro
 * sobre el riel, en el centro de la esfera (x = posición de la carga), z = 0.
 */
export function CarroEsfera({ colorAnillo }: { colorAnillo: string }) {
  const m = useMateriales();
  const yBase = ALTO_RIEL + ALTO_CARRO;
  return (
    <group>
      {/* carro */}
      <mesh geometry={cajaRedondeada(0.12, ALTO_CARRO, 0.46, 0.015, 1)} material={m.hierroPintado} position={[0, ALTO_RIEL + ALTO_CARRO / 2, -0.07]} castShadow />
      {/* indicador: lámina roja con línea de fe sobre la regla (a z = 0,2) */}
      <mesh geometry={cajaRedondeada(0.012, 0.01, 0.2, 0.002, 1)} material={m.plastico('#c62828', 0.35)} position={[0, ALTO_RIEL + 0.03, 0.12]} castShadow />
      {/* casquillo, columna aislante de acrílico y portaesfera de latón */}
      <mesh geometry={cilindro(0.065, 0.065, 0.03, 20)} material={m.plastico('#1e2328', 0.5)} position={[0, yBase + 0.015, 0]} />
      <mesh geometry={cilindro(0.05, 0.05, ALTO_COLUMNA, 20)} material={m.plasticoClaro} position={[0, yBase + ALTO_COLUMNA / 2, 0]} renderOrder={3} castShadow />
      <mesh geometry={cilindro(0.028, 0.045, 0.06, 14)} material={m.laton} position={[0, yBase + ALTO_COLUMNA + 0.01, 0]} castShadow />
      {/* esfera metálica: su centro está sobre la línea del indicador */}
      <group position={[0, Y_CENTRO_ESFERA, 0]}>
        <mesh geometry={esfera(RADIO_ESFERA, 40)} material={m.cromo} castShadow />
      </group>
      <mesh geometry={toro(0.05, 0.007, 6, 24)} material={m.plastico(colorAnillo, 0.4)} rotation={[Math.PI / 2, 0, 0]} position={[0, yBase + 0.05, 0]} />
    </group>
  );
}

/** Longitud (u) de la flecha de fuerza: escala logarítmica, sin cifras (la intensidad se compara, no se lee). */
export function largoFlecha(F: number): number {
  return Math.min(1.5, Math.max(0.16, 0.55 + 0.27 * Math.log10(Math.max(1e-6, F))));
}
