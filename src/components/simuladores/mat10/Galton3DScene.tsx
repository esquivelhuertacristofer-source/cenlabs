"use client";

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { pmfBinomialM10 } from '@/domain/matematicas';

interface Galton3DSceneProps {
  probabilidad: number;
  contenedores: number[];
}

const ROWS = 10;
const PEG_SX = 1.0;
const PEG_SY = 1.0;
const BALL_R = 0.28;
const COLS = ROWS + 1;
const MAX_BALLS = 200;

const BIN_COLORS = [
  '#7c3aed','#6366f1','#3b82f6','#0ea5e9','#06b6d4',
  '#14b8a6','#22c55e','#84cc16','#eab308','#f97316','#ef4444',
];

/* ═══════════════════════════════════════════════════════════
   BALL SYSTEM — Uses ref-based physics, no state re-renders
   ═══════════════════════════════════════════════════════════ */
function BallSystem({ probabilidad }: {
  probabilidad: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { bolitasPendientes, contenedores, contarBolitaM10, setGalton10 } = useSimuladorStore(useShallow((s) => ({
    bolitasPendientes: s.galton10.bolitasPendientes, contenedores: s.galton10.contenedores,
    contarBolitaM10: s.contarBolitaM10, setGalton10: s.setGalton10,
  })));

  // Ball pool — all refs, never triggers re-render
  const pool = useRef({
    x:      new Float32Array(MAX_BALLS),
    y:      new Float32Array(MAX_BALLS),
    vy:     new Float32Array(MAX_BALLS),
    bounces:new Int32Array(MAX_BALLS),
    active: new Uint8Array(MAX_BALLS),  // 0=dead, 1=falling
    hue:    new Float32Array(MAX_BALLS),
  });
  const spawnTimer = useRef(0);
  const pendingToSpawn = useRef(0);
  const colorObj = useMemo(() => new THREE.Color(), []);

  // Consumer pattern: take pending balls from store and spawn them locally
  useEffect(() => {
    if (bolitasPendientes > 0) {
      pendingToSpawn.current += bolitasPendientes;
      setGalton10({ bolitasPendientes: 0 });
    }
  }, [bolitasPendientes, setGalton10]);

  // Vaciado: `vaciarGaltonM10`, `setProbabilidadM10` y los reinicios crean un
  // arreglo de contenedores NUEVO y vacío. Sólo entonces se descarta la cola y
  // las bolitas en vuelo (lanzar no cambia la referencia de `contenedores`, así
  // que no borra lo que se acaba de pedir).
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
        p.x[i]       = (Math.random() - 0.5) * 0.1;
        p.y[i]       = ROWS * PEG_SY + 2.5;
        p.vy[i]      = -0.5;
        p.bounces[i] = ROWS;
        p.active[i]  = 1;
        p.hue[i]     = 0.05 + Math.random() * 0.12;
        return true;
      }
    }
    return false; // reserva llena: se reintenta en el siguiente turno
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt   = Math.min(delta, 0.033);
    const G    = 28;
    const p    = pool.current;
    const startY = ROWS * PEG_SY + 2.5;

    // Spawn logic based on local queue
    spawnTimer.current += delta;
    if (spawnTimer.current >= 0.1 && pendingToSpawn.current > 0) {
      spawnTimer.current = 0;
      if (spawnBall()) pendingToSpawn.current--;
    }

    let visible = 0;
    for (let i = 0; i < MAX_BALLS; i++) {
      if (!p.active[i]) {
        // Hide inactive balls far below scene
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Physics
      p.vy[i] -= G * dt;
      p.y[i]  += p.vy[i] * dt;

      // Peg collisions — each of the ROWS levels
      if (p.bounces[i] > 0) {
        const row  = ROWS - p.bounces[i];       // 0..9
        const pegY = (ROWS - row) * PEG_SY;     // top=ROWS, bottom=1
        const dy   = p.y[i] - pegY;
        if (dy < BALL_R + 0.1 && dy > -(BALL_R + 0.1) && p.vy[i] < 0) {
          p.bounces[i]--;
          p.x[i] += (Math.random() < probabilidad ? PEG_SX * 0.5 : -PEG_SX * 0.5);
          p.vy[i] = 2.5 + Math.random() * 2.0;
          p.y[i]  = pegY + BALL_R + 0.12;
        }
      }

      // Settle at bottom
      if (p.y[i] < -1.5 && p.bounces[i] <= 0) {
        p.active[i] = 0;
        // Tras 10 rebotes de ±PEG_SX/2, x = (D − 5)·PEG_SX con D = nº de
        // desvíos a la derecha (0…10): el contenedor ES D = round(x/PEG_SX + 5).
        const bi = Math.round(p.x[i] / PEG_SX + (COLS - 1) / 2);
        const finalBin = Math.max(0, Math.min(COLS - 1, bi));
        contarBolitaM10(finalBin);
        // Hide
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Kill if lost
      if (p.y[i] < -15) { p.active[i] = 0; continue; }

      // Render
      dummy.position.set(p.x[i], p.y[i], 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color
      colorObj.setHSL(p.hue[i], 0.85, 0.52);
      meshRef.current.setColorAt(i, colorObj);
      visible++;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Búfer de color creado una vez al montar (ninguna bolita sale transparente).
  useEffect(() => {
    if (!meshRef.current || meshRef.current.instanceColor) return;
    const colors = new Float32Array(MAX_BALLS * 3);
    colorObj.setHSL(0.08, 0.85, 0.52);
    for (let i = 0; i < MAX_BALLS; i++) {
      colors[i*3]   = colorObj.r;
      colors[i*3+1] = colorObj.g;
      colors[i*3+2] = colorObj.b;
    }
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  }, [colorObj]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_BALLS]}
      frustumCulled={false}
    >
      <sphereGeometry args={[BALL_R, 16, 16]} />
      <meshStandardMaterial
        metalness={0.5}
        roughness={0.2}
        emissive="#f97316"
        emissiveIntensity={0.5}
        vertexColors
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   PEGS — Metallic spheres at each peg position
   ═══════════════════════════════════════════════════════════ */
function Pegs() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo<[number, number, number][]>(() => {
    const ps: [number, number, number][] = [];
    for (let row = 0; row < ROWS; row++) {
      const y   = (ROWS - row) * PEG_SY;
      const num = row + 1;
      const w   = (num - 1) * PEG_SX;
      for (let i = 0; i < num; i++) ps.push([-w / 2 + i * PEG_SX, y, 0]);
    }
    return ps;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    positions.forEach((pos, i) => {
      dummy.position.set(...pos);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.05} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   HISTOGRAM — Animated bars with smooth lerp
   ═══════════════════════════════════════════════════════════ */
const HIST_MAX_H = 5.5;
const HIST_BASE_Y = -3.2;
function HistogramBars({ contenedores }: { contenedores: number[] }) {
  const maxC      = Math.max(1, ...contenedores);
  const MAX_H     = HIST_MAX_H;
  const BASE_Y    = HIST_BASE_Y;
  const barsRef   = useRef<(THREE.Mesh | null)[]>([]);
  const heights   = useRef<number[]>(new Array(COLS).fill(0.02));

  useFrame(() => {
    for (let i = 0; i < COLS; i++) {
      const target = Math.max(0.02, (contenedores[i] / maxC) * MAX_H);
      heights.current[i] += (target - heights.current[i]) * 0.06;
      const mesh = barsRef.current[i];
      if (mesh) {
        const h = heights.current[i];
        mesh.scale.y = h;
        mesh.position.y = BASE_Y + h * 0.5;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: COLS }, (_, i) => {
        const x     = (i - (COLS - 1) / 2) * PEG_SX;
        const color = BIN_COLORS[i];
        return (
          <mesh
            key={i}
            ref={el => { barsRef.current[i] = el; }}
            position={[x, -3.2, 0]}
          >
            <boxGeometry args={[PEG_SX * 0.82, 1, 0.8]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.4} />
          </mesh>
        );
      })}
      {/* Bin dividers */}
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <mesh key={`d${i}`} position={[(i - COLS / 2) * PEG_SX, -2, 0]}>
          <boxGeometry args={[0.04, 2.8, 0.85]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   CURVA ESPERADA — N·f(k) de la normal N(np, np(1−p)) (De Moivre–Laplace),
   en la MISMA escala que las barras (cuentas / máximo observado · MAX_H).
   Un único búfer de 101 puntos que se reescribe sólo cuando cambian los datos.
   ═══════════════════════════════════════════════════════════ */
const PUNTOS_CURVA = 101;
function GaussianCurve({ contenedores, probabilidad }: { contenedores: number[]; probabilidad: number }) {
  const { geo, linea } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(PUNTOS_CURVA * 3), 3));
    const m = new THREE.LineBasicMaterial({ color: '#e11d48', transparent: true, opacity: 0.85 });
    const l = new THREE.Line(g, m);
    l.visible = false;
    return { geo: g, linea: l };
  }, []);
  useEffect(() => () => { geo.dispose(); (linea.material as THREE.Material).dispose(); }, [geo, linea]);

  const total = contenedores.reduce((a, b) => a + b, 0);
  const maxC = Math.max(1, ...contenedores);

  useEffect(() => {
    linea.visible = total >= 10;
    if (total < 10) return;
    const mu     = ROWS * probabilidad;
    const sigma  = Math.sqrt(ROWS * probabilidad * (1 - probabilidad));
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let t = 0; t < PUNTOS_CURVA; t++) {
      const k  = -0.5 + (t / (PUNTOS_CURVA - 1)) * COLS;      // contenedor continuo −0.5…10.5
      const g  = Math.exp(-0.5 * ((k - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
      const h  = Math.min(HIST_MAX_H * 1.4, (total * g / maxC) * HIST_MAX_H);
      pos.setXYZ(t, (k - (COLS - 1) / 2) * PEG_SX, h + HIST_BASE_Y, 0.5);
    }
    pos.needsUpdate = true;
    geo.computeBoundingSphere();
  }, [total, maxC, probabilidad, geo, linea]);

  return (
    <primitive object={linea} />
  );
}

/* Marca de lo esperado por contenedor (N·P(K = k)) para comparar con cada barra. */
function EsperadoBinomial({ contenedores, probabilidad }: { contenedores: number[]; probabilidad: number }) {
  const total = contenedores.reduce((a, b) => a + b, 0);
  const maxC = Math.max(1, ...contenedores);
  if (total < 10) return null;
  return (
    <group>
      {Array.from({ length: COLS }, (_, k) => {
        const h = Math.min(HIST_MAX_H * 1.4, (total * pmfBinomialM10(k, probabilidad) / maxC) * HIST_MAX_H);
        return (
          <mesh key={k} position={[(k - (COLS - 1) / 2) * PEG_SX, HIST_BASE_Y + h, 0.45]}>
            <boxGeometry args={[PEG_SX * 0.86, 0.06, 0.06]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   MACHINE FRAME
   ═══════════════════════════════════════════════════════════ */
function MachineFrame() {
  const H = ROWS * PEG_SY + 5.5;
  const W = COLS * PEG_SX + 1.2;
  const C = '#1e293b';

  return (
    <group>
      {[-1, 1].map(s => (
        <RoundedBox key={s} args={[0.2, H, 1.0]} radius={0.05}
          position={[s * (W / 2 + 0.1), H / 2 - 3.8, 0]}>
          <meshStandardMaterial color={C} metalness={0.4} roughness={0.5} />
        </RoundedBox>
      ))}
      <RoundedBox args={[W + 0.4, 0.2, 1.0]} radius={0.05} position={[0, H - 3.8, 0]}>
        <meshStandardMaterial color={C} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[W + 1.5, 0.3, 1.6]} radius={0.08} position={[0, -3.8, 0]} receiveShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Funnel */}
      {[-1, 1].map(s => (
        <RoundedBox key={`f${s}`} args={[0.1, 1.8, 0.9]} radius={0.03}
          position={[s * 0.55, ROWS * PEG_SY + 2.3, 0]}
          rotation={[0, 0, s * 0.22]}>
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════════════════════ */
export default function Galton3DScene({ probabilidad, contenedores }: Galton3DSceneProps) {

  return (
    <div className="w-full h-full bg-[#f1f5f9]">
      <Canvas
        shadows
        camera={{ position: [0, 4, 17], fov: 52 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
      >
        <color attach="background" args={['#f1f5f9']} />

        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 14, 14]} intensity={1.1} color="#ffffff" castShadow />
        <directionalLight position={[-4, 10, 10]} intensity={0.35} color="#dbeafe" />
        <pointLight position={[0, 14, 7]} intensity={0.5} color="#fef3c7" />

        <MachineFrame />
        <Pegs />
        <BallSystem probabilidad={probabilidad} />
        <HistogramBars contenedores={contenedores} />
        <GaussianCurve contenedores={contenedores} probabilidad={probabilidad} />
        <EsperadoBinomial contenedores={contenedores} probabilidad={probabilidad} />

        <ContactShadows position={[0, -3.9, 0]} opacity={0.2} scale={22} blur={2} far={8} />

        <OrbitControls
          makeDefault
          target={[0, 3, 0]}
          enablePan={false}
          minDistance={11}
          maxDistance={32}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.6}
        />
      </Canvas>
    </div>
  );
}
