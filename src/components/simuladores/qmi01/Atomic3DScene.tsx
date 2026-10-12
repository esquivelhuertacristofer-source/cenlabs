"use client";
/**
 * Q1 · Construcción atómica — modelo de Bohr de libro de texto (R3F + kit).
 *
 *   · Núcleo: protones (rojo) y neutrones (azul) EMPAQUETADOS (red cúbica centrada
 *     en las caras, los vecinos se tocan) y mezclados.
 *   · Capas K (n = 1, máx. 2 e⁻) y L (n = 2, máx. 8 e⁻) como órbitas circulares
 *     dibujadas en un plano; cada electrón recorre la suya y los de una capa van
 *     equiespaciados.
 *   · Fondo neutro (pizarrón del kit), sin estrellas ni postproceso.
 *   · Inestabilidad: a nivel 2 el núcleo vibra; a nivel 3 se desintegra (los
 *     nucleones se separan y se encogen). Los electrones de la corteza NO salen
 *     disparados: la inestabilidad del núcleo no los afecta.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, Etiqueta, useMateriales, esfera, toro } from '../_kit';

interface Atomic3DSceneProps {
  protons: number;
  neutrons: number;
  electrons: number;
  instability: number;
}

type V3 = [number, number, number];

// Geometría del modelo (u arbitrarias: es un esquema, no un montaje de mesa)
const R_NUCLEON = 0.4;
const R_K = 2.7;
const R_L = 4.5;
const R_ELECTRON = 0.14;
const CAP_K = 2;
const CAP_L = 8;
const MAX_VISIBLES = 160;

/** Posiciones del núcleo: los N sitios de una red FCC más cercanos al centro, recentrados. */
function sitiosNucleo(n: number, r: number): V3[] {
  const cand: { p: V3; d: number }[] = [];
  const paso = (2 * r) / Math.SQRT2; // vecinos a 2r → se tocan
  const off: V3 = [0.07, 0.05, 0.03];
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) for (let k = -6; k <= 6; k++) {
    if ((i + j + k) % 2 !== 0) continue;
    const p: V3 = [i * paso, j * paso, k * paso];
    cand.push({ p, d: Math.hypot(p[0] - off[0] * r, p[1] - off[1] * r, p[2] - off[2] * r) });
  }
  cand.sort((a, b) => a.d - b.d || a.p[0] - b.p[0] || a.p[1] - b.p[1] || a.p[2] - b.p[2]);
  const sel = cand.slice(0, n).map((c) => c.p);
  if (sel.length === 0) return [];
  const c: V3 = [0, 0, 0];
  sel.forEach((p) => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
  c[0] /= sel.length; c[1] /= sel.length; c[2] /= sel.length;
  return sel.map((p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]] as V3);
}

/** ¿El sitio i es protón? Reparto uniforme (Bresenham) para que se vean mezclados. */
function esProton(i: number, total: number, p: number): boolean {
  return Math.floor(((i + 1) * p) / total) > Math.floor((i * p) / total);
}

function Nucleo({ protons, neutrons, instability }: { protons: number; neutrons: number; instability: number }) {
  const m = useMateriales();
  const total = Math.min(MAX_VISIBLES, protons + neutrons);
  const r = R_NUCLEON * Math.min(1, Math.cbrt(40 / Math.max(1, total)));
  const sitios = useMemo(() => sitiosNucleo(total, r), [total, r]);
  const pVis = Math.round((protons / Math.max(1, protons + neutrons)) * total);
  const geo = esfera(r, 28);
  const matP = useMemo(() => m.plastico('#d6382d', 0.32), [m]);
  const matN = useMemo(() => m.plastico('#3f6fc4', 0.32), [m]);
  const grupo = useRef<THREE.Group>(null);
  const expl = useRef(0);

  useFrame((s, dt) => {
    const g = grupo.current; if (!g) return;
    const t = s.clock.elapsedTime;
    const destruye = instability >= 3;
    expl.current = destruye ? Math.min(1, expl.current + dt * 0.5) : Math.max(0, expl.current - dt * 2);
    const e = expl.current;
    const vib = instability >= 2 ? 0.018 * (instability - 1) : 0;
    for (let i = 0; i < g.children.length; i++) {
      const hijo = g.children[i];
      const b = sitios[i]; if (!b) continue;
      const fase = i * 1.7;
      const j = vib * Math.sin(t * 38 + fase);
      const k = 1 + e * 6 + j;
      hijo.position.set(b[0] * k, b[1] * k, b[2] * k);
      hijo.scale.setScalar(1 - 0.8 * e);
    }
  });

  return (
    <group ref={grupo}>
      {sitios.map((p, i) => (
        <mesh key={i} geometry={geo} material={esProton(i, total, pVis) ? matP : matN} position={p} castShadow={false} />
      ))}
    </group>
  );
}

function Corteza({ electrons }: { electrons: number }) {
  const m = useMateriales();
  const nK = Math.min(CAP_K, electrons);
  const nL = Math.min(CAP_L, Math.max(0, electrons - CAP_K));
  const geoE = esfera(R_ELECTRON, 20);
  const matE = useMemo(() => m.plastico('#f0bd22', 0.28), [m]);
  const matOrbLlena = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0.85 }), []);
  const matOrbVacia = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0.32 }), []);
  useEffect(() => () => { matOrbLlena.dispose(); matOrbVacia.dispose(); }, [matOrbLlena, matOrbVacia]);

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    for (let i = 0; i < nK + nL; i++) {
      const me = refs.current[i]; if (!me) continue;
      const enK = i < nK;
      const idx = enK ? i : i - nK, cuantos = enK ? nK : nL;
      const R = enK ? R_K : R_L;
      const w = enK ? 0.9 : 0.5;
      const a = t * w + (idx / cuantos) * Math.PI * 2 + (enK ? 0.6 : 0);
      me.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    }
  });

  return (
    <group>
      <mesh geometry={toro(R_K, 0.022, 8, 120)} material={nK > 0 ? matOrbLlena : matOrbVacia} />
      <mesh geometry={toro(R_L, 0.022, 8, 160)} material={nL > 0 ? matOrbLlena : matOrbVacia} />
      {Array.from({ length: nK + nL }, (_, i) => (
        <mesh key={i} ref={(o) => { refs.current[i] = o; }} geometry={geoE} material={matE} />
      ))}
      <Etiqueta texto={`Capa K (n = 1) · ${nK}/${CAP_K}`} position={[0, R_K + 0.1, 0]} tamano={0.27} ancla={[0.5, 0]} color="#f4f7f8" />
      <Etiqueta texto={`Capa L (n = 2) · ${nL}/${CAP_L}`} position={[0, R_L + 0.1, 0]} tamano={0.27} ancla={[0.5, 0]} color="#f4f7f8" />
    </group>
  );
}

export default function Atomic3DScene({ protons, neutrons, electrons, instability }: Atomic3DSceneProps) {
  return (
    <LabCanvas
      fondo="pizarron"
      sombras={false}
      camara={{ posicion: [0, 1.2, 16], objetivo: [0, 0, 0], fov: 35 }}
      controles={{ minDistancia: 6, maxDistancia: 30, paneo: false }}
    >
      <EncuadrarCaja caja={[[-6.2, -5.1, -1], [5.2, 5.4, 1]]} margen={1.02} direccion={[0, 0.07, 1]} />
      {/* El plano de las órbitas se inclina un poco para que se lea el volumen */}
      <group rotation={[-0.32, 0.12, 0]}>
        <Nucleo protons={protons} neutrons={neutrons} instability={instability} />
        <Corteza electrons={electrons} />
      </group>
    </LabCanvas>
  );
}
