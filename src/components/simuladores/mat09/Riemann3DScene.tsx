"use client";

import React, { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { fM9, puntoEvaluacionM9, A_M9, B_M9, type MetodoM9 } from '@/domain/matematicas';

interface Riemann3DSceneProps {
  n: number;
  metodo: MetodoM9;
  animandoLimite: boolean;
}

/** El intervalo [A, B] se centra en el origen de la escena. */
const X0 = (A_M9 + B_M9) / 2;
const PROF = 0.6; // profundidad de las barras (eje z)

function RiemannBars({ n, metodo }: { n: number; metodo: MetodoM9 }) {
  const dx = (B_M9 - A_M9) / n;

  // Geometría y materiales COMPARTIDOS: una caja unitaria escalada por barra.
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const matBarra = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#10b981', roughness: 0.45, metalness: 0.1, emissive: '#064e3b', emissiveIntensity: 0.35,
  }), []);
  const matPunto = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fbbf24' }), []);
  const geoPunto = useMemo(() => new THREE.SphereGeometry(0.09, 12, 12), []);
  useEffect(() => () => { geo.dispose(); matBarra.dispose(); matPunto.dispose(); geoPunto.dispose(); }, [geo, matBarra, matPunto, geoPunto]);

  const bars = useMemo(() => {
    const b = [];
    for (let i = 0; i < n; i++) {
      const xe = puntoEvaluacionM9(i, n, metodo);
      const h = fM9(xe);
      b.push({ x: A_M9 + i * dx + dx / 2 - X0, xe: xe - X0, h, id: i });
    }
    return b;
  }, [n, metodo, dx]);

  // La curva es la MISMA f del dominio y del validador.
  const curvePoints = useMemo(() => {
    const p: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = A_M9 + ((B_M9 - A_M9) * i) / 100;
      p.push(new THREE.Vector3(x - X0, fM9(x), PROF / 2 + 0.02));
    }
    return p;
  }, []);

  return (
    <group>
      {/* Curva f(x) = 0.1x² + 1, delante de las barras */}
      <Line points={curvePoints} color="#f8fafc" lineWidth={3} />

      {/* Barras de Riemann (sólidas, con una separación mínima entre ellas) */}
      {bars.map((bar) => (
        <mesh key={bar.id} geometry={geo} material={matBarra}
          position={[bar.x, bar.h / 2, 0]} scale={[dx * 0.96, bar.h, PROF]} />
      ))}

      {/* Punto de evaluación de cada barra (donde se mide la altura f(x*)) */}
      {n <= 30 && bars.map((bar) => (
        <mesh key={`p-${bar.id}`} geometry={geoPunto} material={matPunto}
          position={[bar.xe, bar.h, PROF / 2 + 0.05]} />
      ))}

      {/* Etiquetas de área por barra (sólo con pocas barras) */}
      {n < 20 && bars.map((bar, idx) => (
         idx % 5 === 0 && (
            <Html key={`lbl-${idx}`} position={[bar.x, bar.h + 0.8, 0]} center>
                <div className="text-[6px] font-black text-emerald-400 bg-black/40 px-1 rounded border border-emerald-500/20">
                    ΔA: {(bar.h * dx).toFixed(2)}
                </div>
            </Html>
         )
      ))}
    </group>
  );
}

export default function Riemann3DScene(props: Riemann3DSceneProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas camera={{ position: [7, 9, 21], fov: 40 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 30, 80]} />

        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 14, 10]} intensity={1.6} />
        <pointLight position={[-8, 10, 8]} intensity={1.2} color="#10b981" />

        {/* Plano de referencia detrás de las barras */}
        <Grid
          position={[0, 0, -PROF]}
          infiniteGrid
          fadeDistance={50}
          cellColor="#1e293b"
          sectionColor="#334155"
          sectionSize={5}
          cellSize={1}
          rotation={[Math.PI / 2, 0, 0]}
        />

        <Line points={[[-7, 0, 0], [7, 0, 0]]} color="white" lineWidth={1} transparent opacity={0.35} />
        <Line points={[[-5, 0, 0], [-5, 12.5, 0]]} color="white" lineWidth={1} transparent opacity={0.35} />

        <RiemannBars n={props.n} metodo={props.metodo} />

        <OrbitControls makeDefault target={[0, 5, 0]} />
      </Canvas>
    </div>
  );
}
