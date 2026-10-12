"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Galton3DScene — tablero de Galton sobre el pizarrón: embudo, 10 filas de clavos
   de acero, tabiques de acrílico y repisa numerada (k = desvíos a la derecha).

   Las bolitas caen con la física de siempre (cada clavo las manda a la derecha
   con probabilidad p) y, al llegar a la pila de su contenedor, se cuentan en el
   store. La pila de cada contenedor es una columna cuya altura es proporcional a
   su cuenta (escala relativa al contenedor más lleno); sobre ella se dibuja, en
   esa misma escala, la curva normal N(np, np(1−p)) de De Moivre–Laplace y la
   marca de lo esperado por la binomial. La repisa rotula las cuentas (con una
   pequeña demora para no re-dibujar el texto en cada bolita).

   La escena NO escribe μ ni σ teóricas: el alumno las calcula.
──────────────────────────────────────────────────────────────────────────── */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { pmfBinomialM10 } from '@/domain/matematicas';
import { LabCanvas } from '../_kit';
import { Trazo, EncuadreSuave } from '../mat_comun_1a5/trazos';
import { Clavos, MarcoGalton, FILAS, COLS, SEP, Y_BASE } from './piezas';

interface Galton3DSceneProps {
  probabilidad: number;
  contenedores: number[];
}

const BALL_R = 0.28;
const MAX_BALLS = 200;
const HIST_MAX_H = 3.3;
const BIN_COLORS = [
  '#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4',
  '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444',
];

/* ── Bolitas: física por referencias, sin re-renders ───────────────────────── */
function BallSystem({ probabilidad, alturas }: { probabilidad: number; alturas: React.MutableRefObject<number[]> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { bolitasPendientes, contenedores, contarBolitaM10, setGalton10 } = useSimuladorStore(useShallow((s) => ({
    bolitasPendientes: s.galton10.bolitasPendientes, contenedores: s.galton10.contenedores,
    contarBolitaM10: s.contarBolitaM10, setGalton10: s.setGalton10,
  })));

  const pool = useRef({
    x: new Float32Array(MAX_BALLS),
    y: new Float32Array(MAX_BALLS),
    vy: new Float32Array(MAX_BALLS),
    bounces: new Int32Array(MAX_BALLS),
    active: new Uint8Array(MAX_BALLS),
    hue: new Float32Array(MAX_BALLS),
  });
  const spawnTimer = useRef(0);
  const pendingToSpawn = useRef(0);
  const colorObj = useMemo(() => new THREE.Color(), []);

  // Consumidor: toma del store las bolitas pendientes y las suelta localmente.
  useEffect(() => {
    if (bolitasPendientes > 0) {
      pendingToSpawn.current += bolitasPendientes;
      setGalton10({ bolitasPendientes: 0 });
    }
  }, [bolitasPendientes, setGalton10]);

  // Vaciado: `vaciarGaltonM10`, `setProbabilidadM10` y los reinicios crean un
  // arreglo de contenedores NUEVO y vacío. Sólo entonces se descarta la cola y
  // las bolitas en vuelo (lanzar no cambia la referencia de `contenedores`).
  useEffect(() => {
    if (contenedores.some((c) => c > 0)) return;
    pendingToSpawn.current = 0;
    const p = pool.current;
    for (let i = 0; i < MAX_BALLS; i++) p.active[i] = 0;
  }, [contenedores]);

  const spawnBall = useCallback((): boolean => {
    const p = pool.current;
    for (let i = 0; i < MAX_BALLS; i++) {
      if (!p.active[i]) {
        p.x[i] = (Math.random() - 0.5) * 0.1;
        p.y[i] = FILAS * SEP + 2.5;
        p.vy[i] = -0.5;
        p.bounces[i] = FILAS;
        p.active[i] = 1;
        p.hue[i] = 0.05 + Math.random() * 0.12;
        return true;
      }
    }
    return false; // reserva llena: se reintenta en el siguiente turno
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.033);
    const G = 28;
    const p = pool.current;

    spawnTimer.current += delta;
    if (spawnTimer.current >= 0.1 && pendingToSpawn.current > 0) {
      spawnTimer.current = 0;
      if (spawnBall()) pendingToSpawn.current--;
    }

    for (let i = 0; i < MAX_BALLS; i++) {
      if (!p.active[i]) {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      p.vy[i] -= G * dt;
      p.y[i] += p.vy[i] * dt;

      // choque con el clavo de cada nivel
      if (p.bounces[i] > 0) {
        const row = FILAS - p.bounces[i];            // 0..9
        const pegY = (FILAS - row) * SEP;            // arriba = FILAS, abajo = 1
        const dy = p.y[i] - pegY;
        if (dy < BALL_R + 0.1 && dy > -(BALL_R + 0.1) && p.vy[i] < 0) {
          p.bounces[i]--;
          p.x[i] += (Math.random() < probabilidad ? SEP * 0.5 : -SEP * 0.5);
          p.vy[i] = 2.5 + Math.random() * 2.0;
          p.y[i] = pegY + BALL_R + 0.12;
        }
      }

      // Tras 10 rebotes de ±SEP/2, x = (D − 5)·SEP con D = nº de desvíos a la
      // derecha (0…10): el contenedor ES D = round(x/SEP + 5).
      if (p.bounces[i] <= 0) {
        const bi = Math.max(0, Math.min(COLS - 1, Math.round(p.x[i] / SEP + (COLS - 1) / 2)));
        // la bolita se cuenta al tocar la pila de su contenedor
        const techoPila = Y_BASE + (alturas.current[bi] ?? 0) + BALL_R;
        if (p.y[i] < techoPila) {
          p.active[i] = 0;
          contarBolitaM10(bi);
          dummy.position.set(0, -999, 0);
          dummy.scale.setScalar(0.001);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }

      if (p.y[i] < -15) { p.active[i] = 0; continue; }

      dummy.position.set(p.x[i], p.y[i], 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.setHSL(p.hue[i], 0.8, 0.5);
      meshRef.current.setColorAt(i, colorObj);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  // Búfer de color creado una vez al montar (ninguna bolita sale transparente).
  useEffect(() => {
    if (!meshRef.current || meshRef.current.instanceColor) return;
    const colors = new Float32Array(MAX_BALLS * 3);
    colorObj.setHSL(0.08, 0.8, 0.5);
    for (let i = 0; i < MAX_BALLS; i++) { colors[i * 3] = colorObj.r; colors[i * 3 + 1] = colorObj.g; colors[i * 3 + 2] = colorObj.b; }
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  }, [colorObj]);

  const geo = useMemo(() => new THREE.SphereGeometry(BALL_R, 18, 14), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.22 }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  return <instancedMesh ref={meshRef} args={[geo, mat, MAX_BALLS]} frustumCulled={false} castShadow />;
}

/* ── Pilas de cada contenedor (columnas con transición suave) ──────────────── */
function Pilas({ contenedores, alturas }: { contenedores: number[]; alturas: React.MutableRefObject<number[]> }) {
  const maxC = Math.max(1, ...contenedores);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(() => BIN_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.15 })), []);
  const geo = useMemo(() => new THREE.BoxGeometry(SEP * 0.84, 1, 0.55), []);
  useEffect(() => () => { mats.forEach((m) => m.dispose()); geo.dispose(); }, [mats, geo]);
  useFrame(() => {
    for (let i = 0; i < COLS; i++) {
      const objetivo = Math.max(0.02, ((contenedores[i] ?? 0) / maxC) * HIST_MAX_H);
      alturas.current[i] += (objetivo - alturas.current[i]) * 0.1;
      const m = refs.current[i];
      if (m) { m.scale.y = alturas.current[i]; m.position.y = Y_BASE + alturas.current[i] / 2; }
    }
  });
  return (
    <group>
      {Array.from({ length: COLS }, (_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mats[i]} position={[(i - (COLS - 1) / 2) * SEP, Y_BASE, 0]} />
      ))}
    </group>
  );
}

/* ── Curva esperada y marcas de la binomial, en la misma escala que las pilas ── */
function Esperado({ contenedores, probabilidad }: { contenedores: number[]; probabilidad: number }) {
  const total = contenedores.reduce((a, b) => a + b, 0);
  const maxC = Math.max(1, ...contenedores);
  const curva = useMemo<[number, number][]>(() => {
    if (total < 10) return [];
    const mu = FILAS * probabilidad, sigma = Math.sqrt(FILAS * probabilidad * (1 - probabilidad));
    const pts: [number, number][] = [];
    for (let t = 0; t <= 80; t++) {
      const k = -0.5 + (t / 80) * COLS;
      const g = Math.exp(-0.5 * ((k - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
      pts.push([(k - (COLS - 1) / 2) * SEP, Y_BASE + Math.min(HIST_MAX_H * 1.2, ((total * g) / maxC) * HIST_MAX_H)]);
    }
    return pts;
  }, [total, maxC, probabilidad]);
  const marcas = useMemo(() => (total < 10 ? [] : Array.from({ length: COLS }, (_, k) => ({
    x: (k - (COLS - 1) / 2) * SEP, y: Y_BASE + Math.min(HIST_MAX_H * 1.2, ((total * pmfBinomialM10(k, probabilidad)) / maxC) * HIST_MAX_H),
  }))), [total, maxC, probabilidad]);
  if (!curva.length) return null;
  return (
    <group>
      <Trazo pts={curva} color="#ff5d73" radio={0.04} z={0.5} />
      {marcas.map((m, k) => <Trazo key={k} pts={[[m.x - SEP * 0.42, m.y], [m.x + SEP * 0.42, m.y]]} color="#ffe08a" radio={0.03} z={0.42} />)}
    </group>
  );
}

function Contenido({ probabilidad, contenedores }: Galton3DSceneProps) {
  const alturas = useRef<number[]>(new Array(COLS).fill(0.02));
  // instantánea con demora: curva y rótulos no se regeneran con cada bolita
  const [foto, setFoto] = useState(contenedores);
  const ultima = useRef(contenedores);
  ultima.current = contenedores;
  useEffect(() => {
    const vacio = !contenedores.some((c) => c > 0);
    if (vacio) { setFoto(contenedores); return; }
    const id = setTimeout(() => setFoto(ultima.current), 280);
    return () => clearTimeout(id);
  }, [contenedores]);
  const hay = foto.some((c) => c > 0);
  return (
    <>
      <EncuadreSuave caja={[[-7.4, -6.9, 0], [7.4, 15.4, 0]]} margen={1.03} />
      <MarcoGalton cuentas={hay ? foto : null} />
      <Clavos />
      <Pilas contenedores={contenedores} alturas={alturas} />
      <Esperado contenedores={foto} probabilidad={probabilidad} />
      <BallSystem probabilidad={probabilidad} alturas={alturas} />
    </>
  );
}

export default function Galton3DScene(props: Galton3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" camara={{ posicion: [0, 4, 30], objetivo: [0, 4.5, 0], fov: 35 }}
        controles={{ minDistancia: 10, maxDistancia: 60, maxPolar: Math.PI * 0.62, minPolar: Math.PI * 0.3 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
