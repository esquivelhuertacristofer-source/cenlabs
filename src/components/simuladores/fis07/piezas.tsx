'use client';
/**
 * fis07/piezas.tsx — piezas propias del dilatómetro lineal.
 *
 * ESCALA: la del kit (1 u = 1 dm). La barra mide 500 mm (5 u); la camisa de vapor es un tubo de
 * acrílico de 4 cm de diámetro y 40 cm de largo con tapones de hule por los que la barra asoma 5 cm
 * a cada lado: a la izquierda apoya en un tornillo de tope y a la derecha empuja el palpador de un
 * comparador de carátula. El comparador va agrandado (Ø 14 cm) para poder leerse desde la cámara
 * que enmarca todo el tren. Eje de la barra a lo largo de X, a la altura Y_BARRA.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { cilindro, cajaRedondeada, toro, esfera, useMateriales, useTexturaLienzo, familiaTexto } from '../_kit';

export const Y_BARRA = 1.0;
export const Y_BASE = 0.15;            // cara superior de la base
export const L_BARRA = 5.0;            // u (500 mm)
export const L_CAMISA = 4.0;           // u
export const R_CAMISA = 0.2;           // u
export const R_BARRA = 0.06;
export const X_DIAL = 3.84;            // centro de la carátula
export const R_DIAL = 0.72;
export const RANGO_DIAL_MM = 2.0;      // vuelta completa útil de la aguja (≈ 330°)
export const X_PUERTO_TERMOMETRO = 0.0;
export const X_ENTRADA = -1.55, X_SALIDA = 1.55;

// ───────────────────────────── base y apoyos ─────────────────────────────

/** Base de aluminio con cunas de la camisa, pedestal del tope y poste del comparador. Origen en la mesa. */
export function BaseDilatometro() {
  const m = useMateriales();
  const yC = Y_BARRA - R_CAMISA - 0.02;     // fondo de la cuna
  return (
    <group>
      <mesh geometry={cajaRedondeada(8.4, 0.1, 1.5, 0.03, 2)} material={m.aluminio} position={[0.7, Y_BASE - 0.05, 0]} castShadow receiveShadow />
      {[-1, 1].map((s) => <mesh key={s} geometry={cilindro(0.07, 0.08, 0.04, 14)} material={m.goma} position={[0.7 + s * 4.0, 0.02, 0.6]} />)}
      {/* cunas de la camisa */}
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={cajaRedondeada(0.3, yC - Y_BASE, 0.9, 0.02, 1)} material={m.pintura('#9aa3aa')} position={[0, Y_BASE + (yC - Y_BASE) / 2, 0]} castShadow />
          <mesh geometry={cajaRedondeada(0.3, 0.12, 0.1, 0.01, 1)} material={m.pintura('#9aa3aa')} position={[0, yC + 0.06, 0.3]} castShadow />
          <mesh geometry={cajaRedondeada(0.3, 0.12, 0.1, 0.01, 1)} material={m.pintura('#9aa3aa')} position={[0, yC + 0.06, -0.3]} castShadow />
        </group>
      ))}
      {/* pedestal del tope (extremo fijo) */}
      <group position={[-3.05, 0, 0]}>
        <mesh geometry={cajaRedondeada(0.42, Y_BARRA + 0.35 - Y_BASE, 0.8, 0.03, 2)} material={m.hierroPintado} position={[0, Y_BASE + (Y_BARRA + 0.35 - Y_BASE) / 2, 0]} castShadow />
        {/* tornillo de tope: su punta toca el extremo izquierdo de la barra */}
        <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.05, 0.05, 0.46, 14)} material={m.acero} position={[0.28, Y_BARRA, 0]} castShadow />
        <mesh geometry={esfera(0.05, 12)} material={m.acero} position={[0.505, Y_BARRA, 0]} />
        <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.17, 0.17, 0.2, 24)} material={m.plastico('#1e2328', 0.5)} position={[-0.31, Y_BARRA, 0]} castShadow />
      </group>
      {/* poste del comparador, detrás de la carátula */}
      <mesh geometry={cilindro(0.07, 0.07, Y_BARRA + 0.2 - Y_BASE, 16)} material={m.acero} position={[X_DIAL, Y_BASE + (Y_BARRA + 0.2 - Y_BASE) / 2, -0.62]} castShadow />
      <mesh geometry={cajaRedondeada(0.9, 0.12, 0.7, 0.03, 2)} material={m.hierroPintado} position={[X_DIAL, Y_BASE + 0.06, -0.55]} castShadow />
      <mesh geometry={cajaRedondeada(0.18, 0.18, 0.5, 0.02, 1)} material={m.pintura('#9aa3aa')} position={[X_DIAL, Y_BARRA, -0.4]} castShadow />
    </group>
  );
}

// ───────────────────────────── camisa de vapor ─────────────────────────────

/**
 * Camisa de vapor: tubo de acrílico con tapones de hule, tubuladura de entrada (a la izquierda), salida
 * de vapor (a la derecha) y puerto del termómetro (centro). `vapor` ∈ [0,1] da la niebla de vapor dentro.
 */
export function CamisaVapor({ vapor }: { vapor: number }) {
  const m = useMateriales();
  const hule = useMemo(() => m.plastico('#2a2220', 0.9), [m]);
  const matVapor = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), []);
  useEffect(() => () => matVapor.dispose(), [matVapor]);
  matVapor.opacity = 0.34 * Math.min(1, Math.max(0, vapor));
  const x0 = -L_CAMISA / 2, x1 = L_CAMISA / 2;
  const tubuladura = (x: number, conArriba = true) => (
    <group position={[x, Y_BARRA + R_CAMISA * 0.9, 0]}>
      <mesh geometry={cilindro(0.075, 0.075, 0.34, 14, true)} material={m.vidrio} position={[0, 0.17, 0]} renderOrder={3} />
      <mesh geometry={toro(0.075, 0.012, 6, 16)} material={m.vidrio} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3} />
      {conArriba && null}
    </group>
  );
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(R_CAMISA, R_CAMISA, L_CAMISA, 36, true)} material={m.plasticoClaro} position={[0, Y_BARRA, 0]} renderOrder={3} castShadow />
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(R_CAMISA * 0.93, R_CAMISA * 0.93, L_CAMISA - 0.1, 28)} material={matVapor} position={[0, Y_BARRA, 0]} renderOrder={2} visible={vapor > 0.01} />
      {/* tapones de hule en los extremos, con la barra pasando por el centro */}
      {[x0, x1].map((x, i) => (
        <mesh key={i} rotation={[0, 0, Math.PI / 2]} geometry={cilindro(R_CAMISA * 1.07, R_CAMISA * 0.93, 0.2, 28)} material={hule} position={[x + (i === 0 ? -0.08 : 0.08), Y_BARRA, 0]} castShadow />
      ))}
      {[x0 + 0.1, x1 - 0.1].map((x) => <mesh key={x} rotation={[0, 0, Math.PI / 2]} geometry={cilindro(R_CAMISA * 1.06, R_CAMISA * 1.06, 0.08, 32)} material={m.acero} position={[x, Y_BARRA, 0]} castShadow />)}
      {tubuladura(X_ENTRADA)}
      {tubuladura(X_SALIDA)}
      {/* puerto del termómetro: cuello de vidrio con tapón */}
      <group position={[X_PUERTO_TERMOMETRO, Y_BARRA + R_CAMISA * 0.9, 0]}>
        <mesh geometry={cilindro(0.13, 0.13, 0.22, 16, true)} material={m.plasticoClaro} position={[0, 0.11, 0]} renderOrder={3} />
        <mesh geometry={cilindro(0.1, 0.135, 0.12, 16)} material={hule} position={[0, 0.2, 0]} castShadow />
      </group>
    </group>
  );
}

// ───────────────────────────── barra de ensayo ─────────────────────────────

/** Barra de 500 mm del material elegido. `material` = aluminio | cobre | acero | misterioso. */
export function BarraEnsayo({ material }: { material: string }) {
  const m = useMateriales();
  const mat = useMemo(() => {
    switch (material) {
      case 'aluminio': return m.aluminio;
      case 'cobre': return m.cobre;
      case 'acero': return m.acero;
      default: return m.pintura('#3b4147');   // barra problema: pavonada, sin pistas
    }
  }, [material, m]);
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(R_BARRA, R_BARRA, L_BARRA, 24)} material={mat} position={[0, Y_BARRA, 0]} castShadow />
  );
}

// ───────────────────────────── comparador de carátula ─────────────────────────────

/**
 * Comparador de carátula: caja redonda con la escala de 0 a 2 mm (marcas cada 0,02 mm), aguja que gira
 * en sentido horario y palpador horizontal hacia −X. Origen en el centro de la carátula; mira a +Z.
 * `dL` en mm: ángulo = dL/2 · 330°.
 */
export function ComparadorCaratula({ dL }: { dL: number }) {
  const m = useMateriales();
  const tex = useTexturaLienzo(1024, 1024, (ctx, W, H) => {
    const fam = familiaTexto();
    const cx = W / 2, cy = H / 2, R = W / 2 - 14;
    ctx.fillStyle = '#f6f6f2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#111';
    const N = 100, barrido = (330 * Math.PI) / 180;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * barrido;                       // desde las 12 en sentido horario
      const mayor = i % 10 === 0, medio = i % 5 === 0;
      const l = mayor ? 0.13 : medio ? 0.09 : 0.055;
      ctx.lineWidth = mayor ? 6 : medio ? 4 : 2.4;
      const x0 = cx + Math.sin(a) * R * 0.97, y0 = cy - Math.cos(a) * R * 0.97;
      const x1 = cx + Math.sin(a) * R * (0.97 - l), y1 = cy - Math.cos(a) * R * (0.97 - l);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      if (mayor) {
        ctx.font = `700 ${W * 0.062}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText((i / 50).toFixed(1), cx + Math.sin(a) * R * 0.66, cy - Math.cos(a) * R * 0.66);
      }
    }
    ctx.font = `700 ${W * 0.06}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('mm', cx, cy + R * 0.34);
    ctx.font = `600 ${W * 0.045}px ${fam}`; ctx.fillText('0,02 mm / div.', cx, cy + R * 0.46);
    ctx.fillStyle = '#555'; ctx.font = `600 ${W * 0.04}px ${fam}`; ctx.fillText('COMPARADOR', cx, cy - R * 0.36);
  }, []);
  const matCara = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }), [tex]);
  useEffect(() => () => matCara.dispose(), [matCara]);
  const ang = (Math.min(RANGO_DIAL_MM * 1.03, Math.max(0, dL)) / RANGO_DIAL_MM) * ((330 * Math.PI) / 180);
  return (
    <group>
      {/* caja y bisel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(R_DIAL, R_DIAL, 0.26, 48)} material={m.pintura("#2b2f33")} position={[0, 0, -0.1]} castShadow />
      <mesh geometry={toro(R_DIAL - 0.02, 0.055, 10, 56)} material={m.cromo} position={[0, 0, 0.08]} />
      <mesh material={matCara} position={[0, 0, 0.07]}><circleGeometry args={[R_DIAL - 0.04, 56]} /></mesh>
      {/* aguja con contrapeso */}
      <group position={[0, 0, 0.1]} rotation={[0, 0, -ang]}>
        <mesh geometry={cajaRedondeada(0.022, R_DIAL * 0.88, 0.008, 0.003, 1)} material={m.plastico('#c62828', 0.35)} position={[0, R_DIAL * 0.4, 0]} />
        <mesh geometry={cajaRedondeada(0.04, 0.16, 0.008, 0.004, 1)} material={m.plastico('#c62828', 0.35)} position={[0, -0.07, 0]} />
      </group>
      <mesh geometry={cilindro(0.045, 0.045, 0.03, 16)} material={m.cromo} position={[0, 0, 0.115]} rotation={[Math.PI / 2, 0, 0]} />
      {/* cristal */}
      <mesh position={[0, 0, 0.125]} renderOrder={4}><circleGeometry args={[R_DIAL - 0.04, 48]} /><meshPhysicalMaterial transparent opacity={0.08} roughness={0.02} /></mesh>
      {/* vástago y palpador hacia −X */}
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.075, 0.075, 0.3, 16)} material={m.acero} position={[-R_DIAL - 0.08, 0, -0.06]} castShadow />
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.032, 0.032, 0.5, 12)} material={m.cromo} position={[-R_DIAL - 0.32, 0, -0.06]} castShadow />
      <mesh geometry={esfera(0.045, 12)} material={m.acero} position={[-R_DIAL - 0.57, 0, -0.06]} />
    </group>
  );
}
