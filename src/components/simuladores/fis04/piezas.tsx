'use client';
/**
 * fis04/piezas.tsx — piezas propias del banco de resortes (ley de Hooke).
 *
 * ESCALA: la del kit (1 u = 1 dm). Un resorte blando estirado por masas de hasta 5 kg
 * llega a alargarse más de 2 m, así que el soporte es de piso (el de fis03). El resorte
 * va agrandado de calibre (radio 5,5 cm, alambre de 14 mm) para que se vea desde la
 * cámara que enmarca todo el soporte; las masas son discos de latón de 1 kg a tamaño real
 * (Ø 9 cm, 1,85 cm de espesor: m / (ρ·π·r²)).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Etiqueta, cilindro, cajaRedondeada, extruir, useMateriales, useTexturaLienzo, familiaTexto } from '../_kit';

export const L0_RESORTE = 4.5;           // u: longitud natural de la hélice
export const RADIO_RESORTE = 0.65;
export const GROSOR_RESORTE = 0.08;
export const ESPIRAS = 28;
export const OJAL = GROSOR_RESORTE * 4 + RADIO_RESORTE * 1.5;   // largo del ojal del kit
export const LARGO_VASTAGO = 3.0;      // u: del gancho a la placa del portapesas
export const ESPESOR_PLACA = 0.08;
export const RADIO_DISCO = 0.45;
export const ESPESOR_DISCO = 1000 / (8.5 * Math.PI * (RADIO_DISCO * 10) ** 2) / 10;   // u, para 1 kg de latón
/** del extremo del ojal inferior del resorte al índice (cara inferior de la placa) */
export const OFFSET_INDICE = 0.35 + LARGO_VASTAGO + ESPESOR_PLACA;
/** u de dibujo por metro de elongación (el resorte y la regla comparten esta escala; las piezas van a tamaño real) */
export const U_POR_M = 4;
export const ALTO_BRAZO = 25;
export const ALTO_VARILLA = 28;
export const ALTO_REGLA = 12.5;
export const X_REGLA_H = 3.0;

// ───────────────────────────── portapesas con discos de 1 kg ─────────────────────────────

function formaDisco(R: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  const a0 = Math.asin(h / R);
  s.moveTo(Math.sqrt(R * R - h * h), h);
  s.absarc(0, 0, R, a0, Math.PI * 2 - a0, false);
  s.lineTo(0, -h);
  s.absarc(0, 0, h, -Math.PI / 2, -Math.PI * 1.5, true);
  s.lineTo(Math.sqrt(R * R - h * h), h);
  return s;
}

/**
 * Portapesas: gancho, vástago, placa y `n` discos ranurados de 1 kg. El origen es el
 * punto de cuelgue (arriba del gancho); el índice del soporte está en la cara inferior
 * de la placa, a −OFFSET_INDICE.
 */
export function PortapesasKg({ n }: { n: number }) {
  const m = useMateriales();
  const geoDisco = useMemo(() => {
    const g = extruir(formaDisco(RADIO_DISCO, 0.06), ESPESOR_DISCO, 40);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => geoDisco.dispose(), [geoDisco]);
  const yPlaca = -0.35 - LARGO_VASTAGO;
  return (
    <group>
      {/* gancho en S */}
      <mesh geometry={cilindro(0.025, 0.025, 0.35, 8)} material={m.acero} position={[0, -0.175, 0]} castShadow />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} castShadow material={m.acero}><torusGeometry args={[0.06, 0.02, 8, 18]} /></mesh>
      {/* vástago y placa */}
      <mesh geometry={cilindro(0.05, 0.05, LARGO_VASTAGO, 12)} material={m.acero} position={[0, -0.35 - LARGO_VASTAGO / 2, 0]} castShadow />
      <mesh geometry={cilindro(0.5, 0.5, ESPESOR_PLACA, 32)} material={m.acero} position={[0, yPlaca - ESPESOR_PLACA / 2, 0]} castShadow receiveShadow />
      {/* discos */}
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} geometry={geoDisco} material={m.laton} position={[0, yPlaca + i * ESPESOR_DISCO, 0]} rotation={[0, i % 2 ? Math.PI * 0.8 : 0, 0]} castShadow receiveShadow />
      ))}
      {/* rótulo de la masa total */}
      <Etiqueta texto={`${n} kg`} position={[0.85, yPlaca + (n * ESPESOR_DISCO) / 2, 0.2]} tamano={0.34} color="#3b2a08" fondo="rgba(255,255,255,0.88)" />
      {/* índice: varilla horizontal hasta la regla, con punta roja */}
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.02, 0.02, 2.3, 8)} material={m.pintura('#c62828')} position={[1.45, yPlaca - ESPESOR_PLACA, 0.12]} castShadow />
      <mesh position={[2.6, yPlaca - ESPESOR_PLACA, 0.12]} rotation={[0, 0, -Math.PI / 2]} castShadow material={m.pintura('#c62828')}><coneGeometry args={[0.07, 0.3, 12]} /></mesh>
    </group>
  );
}

// ───────────────────────────── regla con índice ─────────────────────────────

/**
 * Regla vertical (marcas cada 1 cm, cifras cada 10 cm): el CERO está en su borde
 * superior = posición de la cara inferior de la placa con el resorte sin estirar. Sube
 * hasta el brazo por un listón liso. Origen en el cero.
 */
export function ReglaHooke({ alto = ALTO_REGLA, yBrazo = 0, ...g }: { alto?: number; yBrazo?: number } & React.ComponentProps<'group'>) {
  const m = useMateriales();
  const px = 24;               // px por cm... por u: ver abajo
  const TOTAL = ALTO_REGLA;
  const tex = useTexturaLienzo(128, 1500, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f2c230'; ctx.fillRect(0, 0, W, H);
    const pxu = H / TOTAL;
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#111';
    for (let c = 0; c <= (TOTAL / U_POR_M) * 100; c++) {         // c = cm
      const y = (c / 100) * U_POR_M * pxu;
      const mayor = c % 10 === 0, medio = c % 5 === 0;
      ctx.lineWidth = mayor ? 3 : 1.6;
      ctx.beginPath(); ctx.moveTo(W, y); ctx.lineTo(W * (mayor ? 0.35 : medio ? 0.55 : 0.75), y); ctx.stroke();
      if (mayor) {
        ctx.font = `700 ${W * 0.26}px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(c), W * 0.04, y + (c === 0 ? W * 0.18 : 0));
      }
    }
  }, []);
  void px;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const sube = Math.max(0, yBrazo);
  return (
    <group {...g}>
      <mesh position={[0, -alto / 2, 0]} material={mat} castShadow receiveShadow><boxGeometry args={[1.1, alto, 0.05]} /></mesh>
      {/* listón liso hasta el brazo */}
      {sube > 0 && <mesh geometry={cajaRedondeada(0.4, sube, 0.05, 0.02, 1)} material={m.pintura('#8c959c')} position={[0.35, sube / 2, 0]} castShadow />}
      <Etiqueta texto="cm" position={[0.9, -0.55, 0.1]} tamano={0.45} color="#142330" fondo="rgba(255,255,255,0.85)" />
    </group>
  );
}

// ───────────────────────────── flecha vertical animable ─────────────────────────────

/** Flecha vertical (hacia arriba si `arriba`) cuya longitud se escribe por ref cada fotograma. */
export interface RefsFlechaV { g: React.RefObject<THREE.Group | null>; c: React.RefObject<THREE.Mesh | null>; h: React.RefObject<THREE.Mesh | null> }

export function FlechaVertical({ r, color, arriba, grosor = 0.07 }: { r: RefsFlechaV; color: string; arriba: boolean; grosor?: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5, depthTest: false, transparent: true }), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group ref={r.g} rotation={[0, 0, arriba ? 0 : Math.PI]} renderOrder={30}>
      <mesh ref={r.c} geometry={cilindro(1, 1, 1, 10)} material={mat} scale={[grosor, 1, grosor]} renderOrder={30} />
      <mesh ref={r.h} geometry={coneGeo()} material={mat} scale={[grosor * 2.6, 1, grosor * 2.6]} renderOrder={30} />
    </group>
  );
}
let _cono: THREE.ConeGeometry | null = null;
function coneGeo() { return _cono ?? (_cono = new THREE.ConeGeometry(1, 1, 16)); }

export function ponLargoFlecha(r: RefsFlechaV, L: number, grosor = 0.07) {
  const c = r.c.current, h = r.h.current, g = r.g.current;
  if (!c || !h || !g) return;
  if (L < 0.12) { g.visible = false; return; }
  g.visible = true;
  const cab = Math.min(L * 0.4, grosor * 5);
  const cuerpo = L - cab;
  c.scale.y = cuerpo; c.position.y = cuerpo / 2;
  h.scale.y = cab; h.position.y = cuerpo + cab / 2;
}

