'use client';
/**
 * fis05/piezas.tsx — piezas propias del gato hidráulico.
 *
 * ESCALA: la del kit (1 u = 1 dm). El gato es un modelo de corte (cilindros de vidrio)
 * de ~35 cm de alto: émbolo de bombeo a la izquierda (radio r₁ real), émbolo de salida
 * a la derecha (radio r₂ real), canal de unión con el aceite a la vista, bastidor con la
 * palanca de bombeo, manómetro de carátula y válvula de descarga. Las alturas de aceite
 * usan la MISMA escala en los dos cilindros (1 cm de nivel = 0,1 u), así que
 * A₁·Δh₁ = A₂·Δh₂ se puede medir en las reglas laterales.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Etiqueta, cilindro, cajaRedondeada, tornear, toro, useMateriales, useTexturaLienzo, familiaTexto, texturaCompartida, dibujarMoteado, azar } from '../_kit';

/** alto útil de los cilindros (u) = 25 cm */
export const H_CIL = 2.5;
/** altura del fondo de los cilindros sobre el piso */
export const Y0 = 0.85;
export const X_BOMBA = -5.2;
export const X_RAM = 0;
export const X_FULCRO = -3.7;
export const ESPESOR_VIDRIO = 0.045;
export const ALTO_PISTON = 0.4;
export const LARGO_VASTAGO_BOMBA = 1.2;
export const LARGO_VASTAGO_RAM = 2.6;
export const ALTO_PISTON_RAM = 0.5;

/** lado del cubo de acero (u) para una masa en kg (ρ = 7850 kg/m³) */
export const ladoBloque = (kg: number) => Math.cbrt(kg / 7850) * 10;

// ───────────────────────────── piso ─────────────────────────────

export function PisoTaller() {
  const tex = texturaCompartida('concreto-fis05', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#b3b7ba', [
      { color: '#989ea2', n: 1800, r: [1, 3], alfa: 0.35 },
      { color: '#cdd1d3', n: 1500, r: [0.8, 2.4], alfa: 0.35 },
    ], 29);
  }, { repetir: [12, 12] });
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0, 0]} material={mat} receiveShadow>
      <planeGeometry args={[160, 120]} />
    </mesh>
  );
}

// ───────────────────────────── bastidor y colector ─────────────────────────────

/** Placa base con patas de goma, colector (bloques bajo cada cilindro), canal visible y válvula de descarga. */
export function BastidorYColector({ r1, r2, colorAceite }: { r1: number; r2: number; colorAceite: string }) {
  const m = useMateriales();
  const o1 = r1 + ESPESOR_VIDRIO + 0.12, o2 = r2 + ESPESOR_VIDRIO + 0.12;
  const yCanal = 0.58;
  const largoCanal = X_RAM - X_BOMBA;
  return (
    <group>
      {/* placa base */}
      <mesh geometry={cajaRedondeada(12.2, 0.3, 4.4, 0.08, 2)} material={m.pintura('#1d4e89')} position={[-2.9, 0.15 + 0.12, 0]} castShadow receiveShadow />
      {[[-8.2, -1.7], [-8.2, 1.7], [2.4, -1.7], [2.4, 1.7]].map(([x, z], i) => (
        <mesh key={i} geometry={cilindro(0.3, 0.3, 0.12, 16)} material={m.goma} position={[x, 0.06, z]} castShadow />
      ))}
      {/* bloques del colector bajo cada cilindro */}
      <mesh geometry={cajaRedondeada(2 * o1 + 0.3, 0.6, 1.6, 0.06, 2)} material={m.hierroPintado} position={[X_BOMBA, Y0 - 0.3, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(2 * o2 + 0.4, 0.6, 1.9, 0.06, 2)} material={m.hierroPintado} position={[X_RAM, Y0 - 0.3, 0]} castShadow receiveShadow />
      {/* canal de unión de vidrio con aceite */}
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.16, 0.16, largoCanal, 24, true)} position={[(X_BOMBA + X_RAM) / 2, yCanal, 0]} material={m.vidrio} />
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.135, 0.135, largoCanal, 24)} position={[(X_BOMBA + X_RAM) / 2, yCanal, 0]} material={m.liquido(colorAceite)} />
      {/* bridas del canal */}
      {[X_BOMBA + o1 + 0.2, X_RAM - o2 - 0.2].map((x) => (
        <mesh key={x} rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.26, 0.26, 0.14, 20)} material={m.acero} position={[x, yCanal, 0]} castShadow />
      ))}
      {/* válvula de descarga (tornillo con perilla roja) en el flanco del bloque de salida */}
      <group position={[X_RAM + o2 + 0.2, Y0 - 0.3, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.1, 0.1, 0.5, 14)} material={m.laton} castShadow />
        <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.2, 0.2, 0.22, 18)} material={m.plastico('#c62828', 0.5)} position={[0.35, 0, 0]} castShadow />
      </group>
      {/* poste del fulcro: dos mejillas con el eje de la palanca */}
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} geometry={cajaRedondeada(0.5, 3.8, 0.18, 0.04, 1)} material={m.hierroPintado} position={[X_FULCRO, 0.42 + 1.9, z]} castShadow receiveShadow />
      ))}
    </group>
  );
}

// ───────────────────────────── cilindro de vidrio con regla ─────────────────────────────

/** Tubo de vidrio hueco de radio interior `ri` y alto H_CIL, con tapa guía de acero y regla lateral en cm. Origen: eje, fondo del cilindro. */
export function CilindroVidrio({ ri, lado }: { ri: number; lado: 'izq' | 'der' }) {
  const m = useMateriales();
  const ro = ri + ESPESOR_VIDRIO;
  const geo = useMemo(() => tornear([[ro, 0], [ro, H_CIL], [ri, H_CIL], [ri, 0]], 40), [ro, ri]);
  useEffect(() => () => geo.dispose(), [geo]);
  const tex = useTexturaLienzo(96, 1500, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f4f4ef'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#111';
    for (let c = 0; c <= 25; c++) {
      const y = H - (c / 25) * H;
      const mayor = c % 5 === 0;
      ctx.lineWidth = mayor ? 3 : 1.6;
      ctx.beginPath(); ctx.moveTo(lado === 'izq' ? W : 0, y); ctx.lineTo(lado === 'izq' ? W * (mayor ? 0.4 : 0.65) : W * (mayor ? 0.6 : 0.35), y); ctx.stroke();
      if (mayor) {
        ctx.font = `700 ${W * 0.4}px ${fam}`; ctx.textAlign = lado === 'izq' ? 'left' : 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(String(c), lado === 'izq' ? W * 0.06 : W * 0.94, Math.min(H - W * 0.25, Math.max(W * 0.25, y)));
      }
    }
  }, [lado]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const xr = lado === 'izq' ? -(ro + 0.4) : ro + 0.4;
  return (
    <group>
      <mesh geometry={geo} material={m.vidrio} renderOrder={3} />
      {/* tapa guía */}
      <mesh geometry={cilindro(ro + 0.22, ro + 0.22, 0.28, 32)} material={m.acero} position={[0, H_CIL + 0.14, 0]} castShadow />
      {/* regla de nivel: 0 en el fondo, 25 cm arriba */}
      <mesh position={[xr, H_CIL / 2, ro * 0.2]} material={mat} castShadow><boxGeometry args={[0.55, H_CIL, 0.04]} /></mesh>
      <Etiqueta texto="cm" position={[xr, H_CIL + 0.3, ro * 0.2 + 0.1]} tamano={0.22} color="#142330" fondo="rgba(255,255,255,0.85)" />
    </group>
  );
}

// ───────────────────────────── émbolo con sellos ─────────────────────────────

/** Émbolo de radio `r` y alto `h` con dos sellos de goma y su vástago hacia arriba. Origen: cara inferior (en contacto con el aceite). */
export function Embolo({ r, h, vastago, rVastago }: { r: number; h: number; vastago: number; rVastago: number }) {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cilindro(r * 0.985, r * 0.985, h, 40)} material={m.cromo} position={[0, h / 2, 0]} castShadow />
      {[0.22, 0.7].map((t) => (
        <mesh key={t} geometry={toro(r * 0.985, 0.028, 8, 40)} material={m.goma} position={[0, h * t, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      ))}
      <mesh geometry={cilindro(rVastago, rVastago, vastago, 20)} material={m.cromo} position={[0, h + vastago / 2, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── palanca de bombeo ─────────────────────────────

/** Palanca: barra plana con ranura y empuñadura de goma, extendida hacia −X desde el fulcro (origen = eje). */
export function Palanca() {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cajaRedondeada(7.8, 0.34, 0.5, 0.05, 2)} material={m.pintura('#c9a227')} position={[-3.9, 0, 0]} castShadow />
      {/* ranura por la que corre el pasador del vástago */}
      <mesh geometry={cajaRedondeada(2.6, 0.09, 0.54, 0.02, 1)} material={m.plastico('#15191c', 0.7)} position={[-1.8, 0, 0]} />
      {/* empuñadura */}
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.2, 0.2, 2.6, 24)} material={m.goma} position={[-7.5, 0, 0]} castShadow />
      {/* eje en el fulcro */}
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.1, 0.1, 1.5, 16)} material={m.cromo} castShadow />
    </group>
  );
}

// ───────────────────────────── plataforma y carga ─────────────────────────────

function texAcero() {
  return texturaCompartida('bloque-acero-fis05', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#5d666d', [
      { color: '#4a5258', n: 1500, r: [1, 2.4], alfa: 0.35 },
      { color: '#7b858c', n: 1300, r: [0.8, 2], alfa: 0.3 },
    ], 51);
    const rnd = azar(9);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 90; i++) { const y = rnd() * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (rnd() - 0.5) * 3); ctx.stroke(); }
  }, { repetir: [1, 1] });
}

/** Plataforma de acero y bloque de acero de lado `s` con asas y rótulo de masa. Origen: cara inferior de la plataforma. */
export function CargaAcero({ masa }: { masa: number }) {
  const m = useMateriales();
  const s = ladoBloque(masa);
  const tex = texAcero();
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.55 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const lado = s + 0.8;
  return (
    <group>
      <mesh geometry={cajaRedondeada(lado, 0.25, lado, 0.04, 2)} material={m.hierroPintado} position={[0, 0.125, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(s, s, s, 0.06, 3)} material={mat} position={[0, 0.25 + s / 2, 0]} castShadow receiveShadow />
      {/* asas de izaje */}
      {[-1, 1].map((k) => (
        <mesh key={k} geometry={toro(0.18, 0.04, 8, 20, Math.PI)} material={m.acero} position={[k * s * 0.3, 0.25 + s, 0]} castShadow />
      ))}
      <Etiqueta texto={`${masa} kg`} modo="plano" position={[0, 0.25 + s / 2, s / 2 + 0.012]} tamano={Math.min(0.9, s * 0.2)} color="#f4f4f4" fondo={null} />
    </group>
  );
}
