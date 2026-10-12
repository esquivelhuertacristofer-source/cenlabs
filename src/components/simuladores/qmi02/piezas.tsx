"use client";
/**
 * Q2 · Leyes de los gases — piezas propias del montaje.
 *
 *   CilindroGas      cilindro de vidrio con base, collares, tapa con prensaestopas y
 *                    chaqueta termostática (agua/aceite entre dos paredes de vidrio).
 *   PistonGas        pistón de aluminio con dos aros de goma, vástago y mango en T.
 *   EscalaVolumen    regla vertical rotulada en litros con índice rojo en el pistón.
 *   BanoTermostatico baño de recirculación con pantalla y las dos mangueras.
 *   BotellaGas       botella de gas pequeña (tipo «lecture bottle») con regulador.
 *   ValvulaAguja     válvula de entrada de gas con volante giratorio.
 *
 * Escala: 1 u = 1 dm → el volumen del gas es V (L) = área × altura, con el área en
 * u² y la altura en u: la posición del pistón es EXACTAMENTE V/AREA sobre la base.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import {
  useMateriales, tornear, cilindro, toro, cajaRedondeada, esfera, geoCache, useTexturaLienzo, familiaTexto, Etiqueta, mm,
  type P2,
} from '../_kit';

type GroupProps = ThreeElements['group'];

// ───────────────────────────── dimensiones ─────────────────────────────
export const R_IN = 1.3;                    // radio interior del cilindro (u)
export const AREA = Math.PI * R_IN * R_IN;  // 5,31 u²
const PARED = 0.07;
export const R_EXT = R_IN + PARED;          // 1,37
const R_CAM_FIN = 1.75;                     // pared exterior de la chaqueta: interior
const R_CAM_FUERA = 1.8;
const R_COLLAR = 1.9;
export const Y_BASE = 0.6;                  // fondo del cilindro (sobre el collar inferior)
export const H_CIL = 3.25;                  // altura interior útil
export const Y_TAPA = Y_BASE + H_CIL;       // 3,85
const ESPESOR_PISTON = 0.32;
const LARGO_VASTAGO = 3.0;

/** Altura del gas sobre el fondo (u) para un volumen V (L). */
export const alturaGas = (V: number) => V / AREA;

const tuboVidrio = (r0: number, r1: number, h: number, seg: number) =>
  geoCache(`q2tubo:${r0}:${r1}:${h}:${seg}`, () => tornear([[r0, 0], [r1, 0], [r1, h], [r0, h], [r0, 0.0001]], seg));

const anillo = (r0: number, r1: number, h: number, seg = 64) =>
  geoCache(`q2anillo:${r0}:${r1}:${h}:${seg}`, () => tornear([[r0, 0], [r1, 0], [r1, h], [r0, h], [r0, 0.0001]], seg));

/** Color del fluido de la chaqueta según la temperatura (K): azul frío → neutro → naranja caliente. */
export function colorFluido(T: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (T - 100) / 900));
  const frio = new THREE.Color('#3f86cc'), medio = new THREE.Color('#bfe0ea'), caliente = new THREE.Color('#ee5a2c');
  return t < 0.22 ? frio.lerp(medio, t / 0.22) : medio.lerp(caliente, (t - 0.22) / 0.78);
}

// ───────────────────────────── cilindro con chaqueta ─────────────────────────────

export function CilindroGas({ temperatura, ...g }: GroupProps & { temperatura: number }) {
  const m = useMateriales();
  const segs = m.calidad === 'alta' ? 72 : 40;
  const matFluido = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bfe0ea', transparent: true, opacity: 0.42, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide }), []);
  // pared exterior de la chaqueta: vidrio translúcido SIN escritura de profundidad, para que el fluido se vea tras ella
  const matPared = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e6f1f5', transparent: true, opacity: 0.16, roughness: 0.08, depthWrite: false, side: THREE.DoubleSide }), []);
  useEffect(() => () => { matFluido.dispose(); matPared.dispose(); }, [matFluido, matPared]);
  useEffect(() => { matFluido.color.copy(colorFluido(temperatura)); }, [matFluido, temperatura]);

  return (
    <group {...g}>
      {/* base y collar inferior (cierra el fondo del cilindro) */}
      <mesh geometry={cajaRedondeada(4.5, 0.4, 4.5, 0.08)} material={m.hierroPintado} position={[0, 0.2, 0]} castShadow receiveShadow />
      <mesh geometry={tornear([[0, 0], [R_COLLAR, 0], [R_COLLAR, 0.2], [R_COLLAR - 0.06, 0.2], [R_IN + 0.02, 0.2], [0, 0.2]], segs)} material={m.acero} position={[0, 0.4, 0]} castShadow receiveShadow />
      {/* paredes de vidrio: cilindro interior y pared exterior de la chaqueta */}
      <mesh geometry={tuboVidrio(R_IN, R_EXT, H_CIL, segs)} material={m.vidrio} position={[0, Y_BASE, 0]} renderOrder={3} />
      <mesh geometry={tuboVidrio(R_CAM_FIN, R_CAM_FUERA, H_CIL, segs)} material={matPared} position={[0, Y_BASE, 0]} renderOrder={5} />
      {/* fluido termostático entre las dos paredes */}
      <mesh geometry={tuboVidrio(R_EXT + 0.005, R_CAM_FIN - 0.005, H_CIL - 0.02, segs)} material={matFluido} position={[0, Y_BASE + 0.01, 0]} renderOrder={4} />
      {/* collar superior con orificio para el vástago, y prensaestopas */}
      <mesh geometry={anillo(0.1, R_COLLAR, 0.15, segs)} material={m.acero} position={[0, Y_TAPA, 0]} castShadow />
      <mesh geometry={cilindro(0.2, 0.22, 0.2, 24)} material={m.laton} position={[0, Y_TAPA + 0.25, 0]} castShadow />
      <mesh geometry={toro(R_COLLAR - 0.05, 0.03, 8, segs)} material={m.cromo} position={[0, Y_TAPA + 0.15, 0]} rotation-x={Math.PI / 2} />
      {/* racores de la chaqueta (hacia atrás-derecha): abajo y arriba */}
      {[Y_BASE - 0.1, Y_TAPA + 0.075].map((y, i) => (
        <group key={i} position={[R_COLLAR * Math.SQRT1_2, y, -R_COLLAR * Math.SQRT1_2]} rotation-y={Math.PI * 0.25}>
          <mesh geometry={cilindro(0.1, 0.1, 0.4, 16)} material={m.laton} rotation-z={Math.PI / 2} position={[0.1, 0, 0]} castShadow />
          <mesh geometry={cilindro(0.075, 0.075, 0.18, 16)} material={m.laton} rotation-z={Math.PI / 2} position={[0.38, 0, 0]} castShadow />
        </group>
      ))}
    </group>
  );
}

/** Posición mundial del extremo de cada racer de la chaqueta (para las mangueras). */
export function puntoRacor(arriba: boolean): [number, number, number] {
  const r = R_COLLAR + 0.38 + 0.1;
  const d = Math.SQRT1_2;
  return [r * d, arriba ? Y_TAPA + 0.075 : Y_BASE - 0.1, -r * d];
}

// ───────────────────────────── pistón ─────────────────────────────

/** Origen en la cara INFERIOR del pistón (la que toca el gas); el vástago sube. */
export const PistonGas = React.forwardRef<THREE.Group, GroupProps>(function PistonGas(props, ref) {
  const m = useMateriales();
  const segs = m.calidad === 'alta' ? 56 : 32;
  const perfil: P2[] = useMemo(() => [[0, 0], [R_IN - 0.045, 0], [R_IN - 0.045, ESPESOR_PISTON], [0, ESPESOR_PISTON]], []);
  return (
    <group ref={ref} {...props}>
      <mesh geometry={tornear(perfil, segs)} material={m.aluminio} castShadow />
      {[0.08, 0.24].map((y) => (
        <mesh key={y} geometry={toro(R_IN - 0.02, 0.05, 8, segs)} material={m.goma} position={[0, y, 0]} rotation-x={Math.PI / 2} castShadow />
      ))}
      <mesh geometry={cilindro(0.09, 0.09, LARGO_VASTAGO, 20)} material={m.cromo} position={[0, ESPESOR_PISTON + LARGO_VASTAGO / 2, 0]} castShadow />
      {/* mango en T */}
      <group position={[0, ESPESOR_PISTON + LARGO_VASTAGO + 0.05, 0]}>
        <mesh geometry={cilindro(0.16, 0.16, 0.14, 20)} material={m.acero} castShadow />
        <mesh geometry={cilindro(0.13, 0.13, 1.1, 20)} material={m.plastico('#c8372d', 0.5)} rotation-z={Math.PI / 2} position={[0, 0.2, 0]} castShadow />
      </group>
    </group>
  );
});
export const ALTO_PISTON = ESPESOR_PISTON;

// ───────────────────────────── escala de volumen ─────────────────────────────

const V_MAX_ESCALA = 15;

/** Regla vertical con marcas cada litro (largas cada 5 L) y un índice rojo que sigue al pistón. */
export function EscalaVolumen({ alturaPiston, ...g }: GroupProps & { alturaPiston: React.MutableRefObject<number> }) {
  const m = useMateriales();
  const alto = alturaGas(V_MAX_ESCALA + 0.8);
  const ancho = 0.72;
  const tex = useTexturaLienzo(256, 1024, (ctx, W, H) => {
    ctx.fillStyle = '#f6f4ee'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#16191c'; ctx.strokeStyle = '#16191c';
    const fam = familiaTexto();
    for (let v = 0; v <= V_MAX_ESCALA; v++) {
      const y = H - (v / (V_MAX_ESCALA + 0.8)) * H;
      const mayor = v % 5 === 0;
      ctx.lineWidth = mayor ? 5 : 3;
      ctx.beginPath(); ctx.moveTo(W, y); ctx.lineTo(W - (mayor ? 90 : 52), y); ctx.stroke();
      if (mayor || v % 5 === 0) {
        ctx.font = `700 ${70}px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(v), 10, y - 2);
      }
    }
    ctx.font = `700 ${56}px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('L', 10, 6);
  }, []);
  const matRegla = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }), [tex]);
  useEffect(() => () => matRegla.dispose(), [matRegla]);
  const indice = useRef<THREE.Mesh>(null);
  useFrame(() => { if (indice.current) indice.current.position.y = alturaPiston.current; });
  const forma = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0.16, 0.07); s.lineTo(0.16, -0.07); s.closePath();
    return s;
  }, []);
  return (
    <group {...g}>
      {/* la marca 0 coincide con el fondo del cilindro (origen del grupo = y de la base) */}
      <mesh position={[0, alto / 2, 0]} castShadow>
        <boxGeometry args={[ancho, alto, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh material={matRegla} position={[0, alto / 2, 0.022]}><planeGeometry args={[ancho, alto]} /></mesh>
      <mesh ref={indice} position={[ancho / 2 + 0.02, 0, 0.03]} rotation-y={0}>
        <shapeGeometry args={[forma]} />
        <meshBasicMaterial color="#d32f2f" side={THREE.DoubleSide} />
      </mesh>
      {/* pie de apoyo */}
      <mesh geometry={cajaRedondeada(1.1, 0.2, 0.7, 0.03)} material={m.hierroPintado} position={[0, -0.1, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── baño termostático ─────────────────────────────

export const POS_BANO: [number, number, number] = [4.5, 0, -2.0];
/** Racores del baño (lado izquierdo) en coordenadas del mundo. */
export const RACORES_BANO = { retorno: [3.45, 0.38, -2.0] as [number, number, number], impulsion: [3.45, 1.0, -2.0] as [number, number, number] };

export function BanoTermostatico({ temperatura, ...g }: GroupProps & { temperatura: number }) {
  const m = useMateriales();
  const calor = temperatura > 330;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(2.1, 1.35, 1.6, 0.09)} material={m.carcasaClara} position={[0, 0.675, 0]} castShadow receiveShadow />
      {/* tapa del baño con una rejilla de ventilación */}
      <mesh geometry={cajaRedondeada(1.7, 0.06, 1.2, 0.02)} material={m.carcasaOscura} position={[0, 1.37, -0.05]} castShadow />
      {/* panel frontal: pantalla + perilla */}
      <mesh geometry={cajaRedondeada(1.6, 0.5, 0.04, 0.03)} material={m.carcasaOscura} position={[0, 0.95, 0.81]} />
      <Etiqueta texto={`${Math.round(temperatura)} K`} modo="plano" position={[-0.25, 0.95, 0.835]} tamano={0.27} fondo="#0c1d12" color="#7be08e" peso={700} />
      <Etiqueta texto="TERMOSTATO" modo="plano" position={[0, 0.5, 0.825]} tamano={0.1} color="#5a6268" peso={700} />
      <mesh geometry={cilindro(0.17, 0.17, 0.1, 28)} material={m.plastico('#2b2f33', 0.5)} position={[0.55, 0.95, 0.86]} rotation-x={Math.PI / 2} castShadow />
      <mesh geometry={cajaRedondeada(0.03, 0.2, 0.02, 0.008)} material={m.plastico(calor ? '#e0603c' : '#4f93d1', 0.4)} position={[0.55, 1.03, 0.915]} />
      {/* racores del lado izquierdo (hacia el cilindro) */}
      {[0.38, 1.0].map((y) => (
        <mesh key={y} geometry={cilindro(0.075, 0.075, 0.18, 16)} material={m.laton} position={[-1.1, y, 0]} rotation-z={Math.PI / 2} castShadow />
      ))}
      {/* patas de goma */}
      {[[-0.85, -0.6], [0.85, -0.6], [-0.85, 0.6], [0.85, 0.6]].map(([x, z], i) => (
        <mesh key={i} geometry={cilindro(0.08, 0.08, 0.04, 12)} material={m.goma} position={[x, 0.02, z]} />
      ))}
    </group>
  );
}

// ───────────────────────────── botella de gas ─────────────────────────────

export const COLOR_BOTELLA: Record<string, string> = { He: '#9a6a3c', Ne: '#b8473a', CO2: '#7d868c' };
export const NOMBRE_GAS: Record<string, string> = { He: 'He', Ne: 'Ne', CO2: 'CO_2' };

export function BotellaGas({ gas, ...g }: GroupProps & { gas: string }) {
  const m = useMateriales();
  const segs = m.calidad === 'alta' ? 48 : 28;
  const cuerpo: P2[] = useMemo(() => [[0, 0], [0.5, 0], [0.55, 0.05], [0.55, 2.55], [0.5, 2.85], [0.32, 3.1], [0.16, 3.2], [0.0, 3.22]], []);
  return (
    <group {...g}>
      <mesh geometry={tornear(cuerpo, segs)} material={m.pintura('#33383c')} castShadow receiveShadow />
      {/* hombro pintado con el color del gas */}
      <mesh geometry={tornear([[0.553, 2.2], [0.553, 2.55], [0.503, 2.85], [0.325, 3.1], [0.165, 3.2]] as P2[], segs)} material={m.pintura(COLOR_BOTELLA[gas] ?? '#7d868c')} />
      {/* válvula y regulador */}
      <mesh geometry={cilindro(0.13, 0.16, 0.3, 20)} material={m.laton} position={[0, 3.3, 0]} castShadow />
      <mesh geometry={cajaRedondeada(0.34, 0.32, 0.34, 0.06)} material={m.laton} position={[0, 3.6, 0]} castShadow />
      <mesh geometry={cilindro(0.1, 0.1, 0.36, 16)} material={m.laton} position={[0.28, 3.6, 0]} rotation-z={Math.PI / 2} castShadow />
      <mesh geometry={cilindro(0.16, 0.16, 0.06, 28)} material={m.cromo} position={[0, 3.6, 0.19]} rotation-x={Math.PI / 2} />
      <mesh geometry={cilindro(0.15, 0.15, 0.03, 28)} material={m.plastico('#f4f4f1', 0.5)} position={[0, 3.6, 0.225]} rotation-x={Math.PI / 2} />
      <mesh geometry={cilindro(0.12, 0.12, 0.2, 18)} material={m.plastico('#2b2f33', 0.5)} position={[0, 3.9, 0]} castShadow />
      <Etiqueta texto={NOMBRE_GAS[gas] ?? gas} modo="plano" position={[0, 1.45, 0.556]} tamano={0.34} fondo="#f6f4ee" color="#1b2a33" peso={700} />
    </group>
  );
}
export const SALIDA_BOTELLA: [number, number, number] = [0.46, 3.6, 0];

// ───────────────────────────── válvula de aguja ─────────────────────────────

/** Válvula de entrada de gas; el volante gira con `giro` (rad) cada vez que se inyecta gas. */
export function ValvulaAguja({ giro = 0, ...g }: GroupProps & { giro?: number }) {
  const m = useMateriales();
  const volante = useRef<THREE.Group>(null);
  const actual = useRef(0);
  useFrame((_, dt) => {
    const v = volante.current; if (!v) return;
    actual.current += (giro - actual.current) * Math.min(1, dt * 6);
    v.rotation.y = actual.current;
  });
  return (
    <group {...g}>
      <mesh geometry={cilindro(0.13, 0.13, 0.8, 18)} material={m.laton} rotation-z={Math.PI / 2} castShadow />
      <mesh geometry={cajaRedondeada(0.3, 0.3, 0.3, 0.05)} material={m.laton} position={[0, 0.05, 0]} castShadow />
      <mesh geometry={cilindro(0.07, 0.07, 0.35, 14)} material={m.cromo} position={[0, 0.34, 0]} castShadow />
      <group ref={volante} position={[0, 0.54, 0]}>
        <mesh geometry={cilindro(0.3, 0.3, 0.05, 28)} material={m.plastico('#c8372d', 0.45)} castShadow />
        <mesh geometry={cilindro(0.045, 0.045, 0.62, 12)} material={m.plastico('#a52c24', 0.45)} rotation-z={Math.PI / 2} position={[0, 0.04, 0]} />
        <mesh geometry={esfera(0.06, 14)} material={m.plastico('#a52c24', 0.4)} position={[0.3, 0.04, 0]} />
      </group>
      {/* sello de PTFE en la unión */}
      <mesh geometry={cilindro(0.15, 0.15, 0.03, 18)} material={m.ptfe} rotation-z={Math.PI / 2} position={[0.42, 0, 0]} />
    </group>
  );
}

export { mm };
