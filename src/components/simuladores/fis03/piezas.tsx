'use client';
/**
 * fis03/piezas.tsx — piezas propias del montaje del péndulo simple.
 *
 * ESCALA: la del kit (1 u = 1 dm). El péndulo mide hasta 3 m = 30 u, así que el
 * soporte es de piso (varilla de ~3,8 m con base pesada). La plomada, la fotopuerta
 * y la cuerda van a tamaño real; el transportador va agrandado (radio 35 cm) para
 * poder leer la amplitud desde la cámara.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  Etiqueta, cilindro, cajaRedondeada, esfera, tornear, toro, useMateriales, useTexturaLienzo, familiaTexto, dibujarSieteSegmentos,
  texturaCompartida, dibujarMoteado,
} from '../_kit';

export const ALTURA_BOLA_REPOSO = 6;   // u: el centro de la plomada en reposo queda a 60 cm del piso
export const X_VARILLA = -8.6;          // u: la varilla del soporte, a la izquierda del pivote
export const X_REGLA = 7.5;            // u: la regla vertical, a la derecha (fuera del barrido)

/** radio del cuerpo de la plomada (u) para una masa de latón (kg): V = m/ρ, V = π r³ (2 + 5/6) */
export const radioPlomada = (masa: number) => Math.cbrt(masa / 8500 / 8.9) * 10;

// ───────────────────────────── cuarto ─────────────────────────────

export function CuartoPendulo() {
  const m = useMateriales();
  const tex = texturaCompartida('concreto-fis03', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#b6babd', [
      { color: '#9aa0a4', n: 1800, r: [1, 3], alfa: 0.35 },
      { color: '#cfd3d5', n: 1500, r: [0.8, 2.4], alfa: 0.35 },
    ], 17);
  }, { repetir: [10, 10] });
  const suelo = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [tex]);
  const pared = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e6e9eb', roughness: 0.95 }), []);
  useEffect(() => () => { suelo.dispose(); pared.dispose(); }, [suelo, pared]);
  void m;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} material={suelo} receiveShadow><planeGeometry args={[120, 80]} /></mesh>
      <mesh position={[0, 30, -30]} material={pared} receiveShadow><planeGeometry args={[120, 60]} /></mesh>
      {/* zócalo */}
      <mesh position={[0, 1.0, -29.95]} material={m.pintura('#8c959c')}><boxGeometry args={[120, 2, 0.1]} /></mesh>
    </group>
  );
}

// ───────────────────────────── soporte de piso ─────────────────────────────

/** Soporte universal de piso: base de fundición, varilla alta, nuez y brazo horizontal hasta pasar el pivote. */
export function SoportePiso({ alturaBrazo, xDerecha = X_REGLA + 1, altoVarilla = 38 }: { alturaBrazo: number; xDerecha?: number; altoVarilla?: number }) {
  const m = useMateriales();
  const largoBrazo = xDerecha - X_VARILLA;
  return (
    <group>
      {/* base */}
      <mesh geometry={cajaRedondeada(9, 0.7, 6.5, 0.15, 2)} material={m.hierroPintado} position={[X_VARILLA, 0.35, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(8.4, 0.2, 5.9, 0.1, 2)} material={m.hierroPintado} position={[X_VARILLA, 0.78, 0]} castShadow />
      <mesh geometry={cilindro(0.75, 0.9, 0.9, 28)} material={m.hierroPintado} position={[X_VARILLA, 1.1, 0]} castShadow />
      {/* varilla */}
      <mesh geometry={cilindro(0.16, 0.16, altoVarilla, 20)} material={m.acero} position={[X_VARILLA, altoVarilla / 2 + 1.0, 0]} castShadow />
      {/* nuez */}
      <group position={[X_VARILLA, alturaBrazo, 0]}>
        <mesh geometry={cajaRedondeada(0.9, 0.9, 0.9, 0.1, 2)} material={m.pintura('#9aa3aa')} castShadow />
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.16, 0.16, 0.5, 12)} material={m.plastico('#1e2328', 0.5)} position={[0, 0.2, -0.65]} castShadow />
        <mesh geometry={cajaRedondeada(0.34, 0.34, 0.34, 0.05, 1)} material={m.plastico('#1e2328', 0.5)} position={[0, 0.65, 0]} />
      </group>
      {/* brazo horizontal */}
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.11, 0.11, largoBrazo, 16)} material={m.acero} position={[X_VARILLA + largoBrazo / 2, alturaBrazo, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── transportador colgante ─────────────────────────────

/** Semidisco graduado ±90° con el 0° en la vertical (plomada). Origen en el centro. Mira a +Z. */
export function TransportadorPendulo({ radio = 3.5, ...g }: { radio?: number } & React.ComponentProps<'group'>) {
  const tex = useTexturaLienzo(1024, 1024, (ctx, W, H) => {
    const fam = familiaTexto();
    const cx = W / 2, cy = H / 2, R = W / 2 - 8;
    ctx.fillStyle = '#f2f4f5'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#0d47a1'; ctx.fillStyle = '#0d47a1';
    for (let d = -90; d <= 90; d++) {
      const a = (d * Math.PI) / 180;
      const l = d % 10 === 0 ? 0.13 : d % 5 === 0 ? 0.085 : 0.045;
      ctx.lineWidth = d % 10 === 0 ? 5 : d % 5 === 0 ? 3 : 1.4;
      const x0 = cx + Math.sin(a) * R, y0 = cy + Math.cos(a) * R;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(cx + Math.sin(a) * R * (1 - l), cy + Math.cos(a) * R * (1 - l)); ctx.stroke();
      if (d % 10 === 0) {
        ctx.font = `700 ${W * 0.05}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.abs(d)), cx + Math.sin(a) * R * 0.78, cy + Math.cos(a) * R * 0.78);
      }
    }
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + R * 0.7); ctx.stroke();
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const geo = useMemo(() => new THREE.CircleGeometry(radio, 64, Math.PI, Math.PI), [radio]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group {...g}>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
    </group>
  );
}

// ───────────────────────────── regla vertical ─────────────────────────────

/** Cinta graduada colgada del brazo: cero en el pivote, marcas cada 5 cm y cifras cada 50 cm. */
export function ReglaVertical({ alto, ...g }: { alto: number } & React.ComponentProps<'group'>) {
  const m = useMateriales();
  const TOTAL = 38;
  const tex = useTexturaLienzo(128, 2432, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f2c230'; ctx.fillRect(0, 0, W, H);
    const pxu = H / TOTAL;
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#111';
    for (let c = 0; c <= TOTAL * 2; c++) {
      const u = c * 0.5, y = u * pxu;
      const mayor = c % 10 === 0, medio = c % 2 === 0;
      ctx.lineWidth = mayor ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W * (mayor ? 0.6 : medio ? 0.4 : 0.22), y); ctx.stroke();
      if (mayor && c > 0) {
        ctx.font = `700 ${W * 0.3}px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.round(u * 10)), W * 0.12, y + W * 0.2);
      }
    }
  }, []);
  useMemo(() => { if (tex) { tex.repeat.set(1, alto / TOTAL); tex.offset.set(0, 1 - alto / TOTAL); tex.needsUpdate = true; } }, [tex, alto]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group {...g}>
      <mesh position={[0, -alto / 2, 0]} material={mat} castShadow receiveShadow><boxGeometry args={[0.9, alto, 0.05]} /></mesh>
      <mesh geometry={cajaRedondeada(1.1, 0.5, 0.4, 0.05, 1)} material={m.plastico('#1e2328', 0.5)} position={[0, 0.2, 0]} castShadow />
      <Etiqueta texto="cm" position={[0.9, -0.5, 0.1]} tamano={0.5} color="#142330" fondo="rgba(255,255,255,0.85)" />
    </group>
  );
}

// ───────────────────────────── plomada de latón ─────────────────────────────

/**
 * Plomada de latón torneada (cilindro + cono). El origen es el punto de amarre de la
 * cuerda (arriba); el centro de masa queda `distanciaCM(r)` por debajo.
 */
export const distanciaCM = (r: number) => 1.7 * r;
export function Plomada({ radio }: { radio: number }) {
  const m = useMateriales();
  const r = radio;
  const geo = useMemo(() => tornear([[0, -4.3 * r], [r, -1.9 * r], [r, -0.4 * r], [0.9 * r, -0.12 * r], [0.5 * r, 0], [0, 0]], 40), [r]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo} material={m.laton} castShadow receiveShadow />
      <mesh geometry={toro(0.3 * r, 0.07 * r, 8, 16)} material={m.laton} position={[0, 0.3 * r, 0]} rotation={[0, 0, 0]} castShadow />
      {/* anillos de la cabeza */}
      <mesh geometry={cilindro(r * 1.01, r * 1.01, 0.1 * r, 40)} material={m.laton} position={[0, -0.9 * r, 0]} />
    </group>
  );
}

// ───────────────────────────── fotopuerta con contador ─────────────────────────────

/**
 * Fotopuerta con haz perpendicular al plano de oscilación (los brazos quedan a ±Z) y
 * base por debajo de la punta de la plomada. El origen es el haz. `bloqueada` enciende
 * el LED rojo; la pantalla de 7 segmentos muestra el número de oscilaciones completas.
 */
export function FotopuertaPendulo({ bloqueada, cuenta, abertura = 1.5 }: { bloqueada: boolean; cuenta: number; abertura?: number }) {
  const m = useMateriales();
  const yBase = -2.4;
  const lcd = useTexturaLienzo(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c3cbb6'; ctx.fillRect(0, 0, w, h);
    dibujarSieteSegmentos(ctx, String(cuenta), w * 0.9, h * 0.22, h * 0.56, '#1a1f18', 'rgba(26,31,24,0.07)', 0.08, 3);
    ctx.fillStyle = '#1a1f18'; ctx.font = `700 ${h * 0.14}px ${familiaTexto()}`; ctx.textAlign = 'left'; ctx.fillText('OSC', w * 0.06, h * 0.17);
  }, [cuenta]);
  const matLcd = useMemo(() => new THREE.MeshBasicMaterial({ map: lcd, toneMapped: false }), [lcd]);
  useEffect(() => () => matLcd.dispose(), [matLcd]);
  const cuerpo = m.plastico('#23272b', 0.55);
  return (
    <group>
      {/* brazos a ±Z */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={cajaRedondeada(0.34, 3.3, 0.34, 0.06, 2)} material={cuerpo} position={[0, -0.75, s * (abertura / 2 + 0.17)]} castShadow receiveShadow />
          <mesh geometry={cilindro(0.07, 0.07, 0.04, 14)} material={m.plastico(s < 0 ? '#3b1a1a' : '#111111', 0.2)} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, s * (abertura / 2 - 0.005)]} />
        </group>
      ))}
      {/* base que une los brazos, bajo la punta */}
      <mesh geometry={cajaRedondeada(0.5, 0.3, abertura + 0.7, 0.06, 2)} material={cuerpo} position={[0, yBase - 0.15, 0]} castShadow receiveShadow />
      <mesh geometry={esfera(0.07, 10)} material={bloqueada ? m.emisor('#ff3030', 3) : m.plastico('#4a1d1d', 0.3)} position={[0.18, 1.3, abertura / 2 + 0.2]} />
      {/* poste y base al piso */}
      <PosteGate largo={ALTURA_BOLA_REPOSO + yBase - 0.3} yBase={yBase - 0.3} />
      {/* caja de la pantalla */}
      <group position={[0, -1.4, abertura / 2 + 0.34 + 0.2]}>
        <mesh geometry={cajaRedondeada(1.9, 1.0, 0.3, 0.05, 2)} material={m.carcasaOscura} castShadow />
        <mesh material={matLcd} position={[0, 0, 0.16]}><planeGeometry args={[1.6, 0.8]} /></mesh>
      </group>
    </group>
  );
}

function PosteGate({ largo, yBase }: { largo: number; yBase: number }) {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cilindro(0.12, 0.12, largo, 14)} material={m.acero} position={[0, yBase - largo / 2, 0]} castShadow />
      <mesh geometry={cajaRedondeada(3.2, 0.35, 2.6, 0.08, 2)} material={m.hierroPintado} position={[0, -ALTURA_BOLA_REPOSO + 0.175, 0]} castShadow receiveShadow />
    </group>
  );
}
