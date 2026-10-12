"use client";
/**
 * Q4 · Reactivo limitante — piezas propias del montaje.
 *
 *   Dosificador  tolva de vidrio (cilindro + cono) con su contenido, llave de paso y placa
 *                con la fórmula y la masa cargada (lectura de instrumento).
 *   Reactor      reactor cilíndrico de vidrio sobre pedestal: tapa de acero con dos puertos
 *                de carga, agitador con motor y válvula de descarga en el fondo.
 *   Colector     bandeja de acero donde cae el producto.
 *   TuboVidrio   tubería de vidrio por una polilínea.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import {
  useMateriales, tornear, cilindro, cajaRedondeada, toro, geoCache, tuboPolilinea, Etiqueta, type P2,
} from '../_kit';

type GroupProps = ThreeElements['group'];
type V3 = [number, number, number];

// ───────────────────────────── dimensiones del reactor ─────────────────────────────
export const R_REACTOR = 1.45;          // radio interior
export const H_REACTOR = 2.6;           // altura del cilindro de vidrio
export const Y_PEDESTAL = 0.7;          // altura del fondo sobre la mesa
export const Y_FONDO = Y_PEDESTAL + 0.2; // suelo útil del reactor (sobre la placa base)
export const Y_TAPA = Y_FONDO + H_REACTOR;

// ───────────────────────────── dosificador ─────────────────────────────
const R_TOLVA = 0.52, H_CONO = 0.72, H_CUERPO = 1.55, R_BOQUILLA = 0.07;
export const ALTO_TOLVA = H_CONO + H_CUERPO;
/** Altura (desde la boquilla) a la que el cono tiene el radio `r`. */
export const alturaConoEnRadio = (r: number) => H_CONO * (r - R_BOQUILLA) / (R_TOLVA - R_BOQUILLA);

/** Origen: la boquilla (punta del cono). `nivel` 0–1 = fracción llena del CUERPO cilíndrico. */
export function Dosificador({ color, nivel, formula, rotulo, masa, abierta, ...g }: GroupProps & {
  color: string; nivel: number; formula: string; rotulo: string; masa: string; abierta: number;
}) {
  const m = useMateriales();
  const segs = m.calidad === 'alta' ? 40 : 24;
  const solido: P2[] = useMemo(() => [
    [R_BOQUILLA, 0], [R_BOQUILLA + 0.03, 0], [R_TOLVA + 0.05, H_CONO], [R_TOLVA + 0.05, H_CONO + H_CUERPO],
    [R_TOLVA, H_CONO + H_CUERPO], [R_TOLVA, H_CONO + 0.0001], [R_BOQUILLA, 0.0001],
  ], []);
  const geoVidrio = useMemo(() => geoCache('q4tolva', () => tornear(solido, segs)), [solido, segs]);
  const geoCono = useMemo(() => geoCache('q4cono', () => tornear([[0.0005, 0.02], [R_BOQUILLA, 0.02], [R_TOLVA - 0.02, H_CONO], [0.0005, H_CONO]], segs)), [segs]);
  const matContenido = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 }), [color]);
  useEffect(() => () => matContenido.dispose(), [matContenido]);
  const cuerpo = useRef<THREE.Mesh>(null);
  const cono = useRef<THREE.Mesh>(null);
  const llave = useRef<THREE.Group>(null);
  const llaveActual = useRef(0);
  useFrame((_, dt) => {
    const h = Math.max(0.0001, nivel * (H_CUERPO - 0.1));
    if (cuerpo.current) { cuerpo.current.scale.y = h; cuerpo.current.position.y = H_CONO + h / 2; cuerpo.current.visible = nivel > 0.002; }
    if (cono.current) cono.current.visible = nivel > 0.002;
    llaveActual.current += (abierta - llaveActual.current) * Math.min(1, dt * 8);
    if (llave.current) llave.current.rotation.y = llaveActual.current * Math.PI / 2;
  });
  return (
    <group {...g}>
      <mesh geometry={geoVidrio} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      <mesh ref={cono} geometry={geoCono} material={matContenido} />
      <mesh ref={cuerpo} geometry={cilindro(R_TOLVA - 0.02, R_TOLVA - 0.02, 1, 32)} material={matContenido} />
      {/* llave de paso bajo la boquilla */}
      <group position={[0, -0.13, 0]}>
        <mesh geometry={cilindro(0.09, 0.09, 0.26, 18)} material={m.vidrio} renderOrder={3} />
        <group ref={llave}>
          <mesh geometry={cilindro(0.05, 0.05, 0.34, 14)} material={m.ptfe} rotation-z={Math.PI / 2} />
          <mesh geometry={cilindro(0.025, 0.025, 0.2, 10)} material={m.ptfe} position={[0.26, 0, 0]} rotation-z={Math.PI / 2} />
        </group>
      </group>
      {/* placa rotulada */}
      <Etiqueta texto={`${rotulo} · ${formula}`.replace(/(\d+)/g, '_{$1}')} modo="plano" position={[0, H_CONO + H_CUERPO + 0.32, R_TOLVA + 0.02]} tamano={0.24} peso={700} color="#ffffff" fondo={color} />
      <Etiqueta texto={masa} modo="plano" position={[0, H_CONO + H_CUERPO - 0.28, R_TOLVA + 0.07]} tamano={0.22} peso={600} color="#1b2a33" fondo="#ffffffe6" />
    </group>
  );
}

// ───────────────────────────── tubería de vidrio ─────────────────────────────

export function TuboVidrio({ puntos, radio = 0.075 }: { puntos: V3[]; radio?: number }) {
  const m = useMateriales();
  const clave = puntos.flat().map((v) => v.toFixed(3)).join(',');
  const geo = useMemo(() => {
    // suaviza la polilínea (Catmull-Rom) para que los codos no sean aristas
    const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const pts = curva.getPoints(40);
    const arr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; });
    return tuboPolilinea(arr, radio, 10, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, radio]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m.vidrio} renderOrder={3} castShadow />;
}

// ───────────────────────────── reactor ─────────────────────────────

/** Centro del reactor en x, z; origen en la mesa. `agitando` gira el rodete. */
export function Reactor({ agitando, descarga, ...g }: GroupProps & { agitando: boolean; descarga: number }) {
  const m = useMateriales();
  const segs = m.calidad === 'alta' ? 72 : 40;
  const rot = useRef<THREE.Group>(null);
  const llave = useRef<THREE.Group>(null);
  const llaveAct = useRef(0);
  useFrame((_, dt) => {
    if (rot.current && agitando) rot.current.rotation.y += dt * 9;
    llaveAct.current += (descarga - llaveAct.current) * Math.min(1, dt * 8);
    if (llave.current) llave.current.rotation.y = llaveAct.current * Math.PI / 2;
  });
  const pared = useMemo(() => geoCache('q4reactor', () => tornear([[R_REACTOR, 0], [R_REACTOR + 0.07, 0], [R_REACTOR + 0.07, H_REACTOR], [R_REACTOR, H_REACTOR], [R_REACTOR, 0.0001]], 72)), []);
  return (
    <group {...g}>
      {/* pedestal con patas y placa base de acero con la boca de descarga */}
      {[0, 120, 240].map((a) => {
        const r = (R_REACTOR - 0.2) * Math.cos(0), ang = (a * Math.PI) / 180;
        return <mesh key={a} geometry={cilindro(0.1, 0.1, Y_PEDESTAL, 14)} material={m.hierroPintado} position={[Math.sin(ang) * r, Y_PEDESTAL / 2, Math.cos(ang) * r]} castShadow />;
      })}
      <mesh geometry={cajaRedondeada(3.6, 0.07, 3.6, 0.03)} material={m.hierroPintado} position={[0, 0.035, 0]} receiveShadow />
      <mesh geometry={tornear([[0, 0], [R_REACTOR + 0.25, 0], [R_REACTOR + 0.25, 0.13], [R_REACTOR + 0.07, 0.2], [0, 0.2]], segs)} material={m.acero} position={[0, Y_PEDESTAL, 0]} castShadow receiveShadow />
      <mesh geometry={cilindro(0.11, 0.11, 0.36, 16)} material={m.acero} position={[0, Y_PEDESTAL - 0.16, 0]} castShadow />
      <group position={[0, Y_PEDESTAL - 0.3, 0]}>
        <group ref={llave}>
          <mesh geometry={cilindro(0.04, 0.04, 0.5, 10)} material={m.plastico('#c8372d', 0.5)} rotation-z={Math.PI / 2} position={[0.2, 0, 0]} />
        </group>
      </group>
      {/* cuerpo de vidrio */}
      <mesh geometry={pared} material={m.vidrio} position={[0, Y_FONDO, 0]} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      {/* tapa con dos puertos de carga, el agitador y su motor */}
      <mesh geometry={tornear([[0, 0], [R_REACTOR + 0.25, 0], [R_REACTOR + 0.25, 0.14], [R_REACTOR - 0.2, 0.2], [0.3, 0.42], [0, 0.42]], segs)} material={m.acero} position={[0, Y_TAPA, 0]} castShadow />
      <mesh geometry={toro(R_REACTOR + 0.25, 0.04, 8, segs)} material={m.cromo} position={[0, Y_TAPA + 0.07, 0]} rotation-x={Math.PI / 2} />
      {[-0.62, 0.62].map((x) => (
        <group key={x} position={[x, Y_TAPA + 0.1, 0]}>
          <mesh geometry={cilindro(0.17, 0.2, 0.24, 20)} material={m.acero} position={[0, 0.12, 0]} castShadow />
          <mesh geometry={cilindro(0.1, 0.1, 0.12, 16)} material={m.laton} position={[0, 0.3, 0]} castShadow />
        </group>
      ))}
      <mesh geometry={cajaRedondeada(0.62, 0.62, 0.62, 0.08)} material={m.carcasaOscura} position={[0, Y_TAPA + 0.8, 0]} castShadow />
      <mesh geometry={cilindro(0.15, 0.15, 0.18, 18)} material={m.acero} position={[0, Y_TAPA + 0.5, 0]} />
      <group ref={rot} position={[0, Y_FONDO + 0.4, 0]}>
        <mesh geometry={cilindro(0.045, 0.045, Y_TAPA - Y_FONDO - 0.4 + 0.2, 12)} material={m.cromo} position={[0, (Y_TAPA - Y_FONDO - 0.4) / 2, 0]} castShadow />
        <mesh geometry={cajaRedondeada(1.0, 0.07, 0.22, 0.02)} material={m.acero} position={[0, 0, 0]} castShadow />
        <mesh geometry={cajaRedondeada(0.22, 0.07, 1.0, 0.02)} material={m.acero} position={[0, 0.2, 0]} castShadow />
      </group>
    </group>
  );
}

/** Puntos de entrada (centro de cada puerto, parte alta) en coordenadas locales del reactor. */
export const PUERTOS: [V3, V3] = [[-0.62, Y_TAPA + 0.46, 0], [0.62, Y_TAPA + 0.46, 0]];

// ───────────────────────────── colector ─────────────────────────────

export const R_COLECTOR = 1.5;
export function Colector({ ...g }: GroupProps) {
  const m = useMateriales();
  const perfil: P2[] = useMemo(() => [[0, 0], [R_COLECTOR, 0], [R_COLECTOR + 0.06, 0.05], [R_COLECTOR + 0.06, 0.34], [R_COLECTOR + 0.01, 0.34], [R_COLECTOR - 0.02, 0.08], [0, 0.08]], []);
  return (
    <group {...g}>
      <mesh geometry={tornear(perfil, 64)} material={m.acero} castShadow receiveShadow />
      <Etiqueta texto="Colector de producto" modo="plano" position={[0, 0.17, R_COLECTOR + 0.08]} tamano={0.17} peso={700} color="#ffffff" fondo="#3b4a54" />
    </group>
  );
}
