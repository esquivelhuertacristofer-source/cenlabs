'use client';
/**
 * bio04/piezas.tsx — piezas propias del montaje de Elodea (lo que el kit no trae):
 *   banco óptico con regla, lámpara LED de color sobre carro, rama de Elodea,
 *   luxómetro cuántico (PAR) y burbujas de O₂.
 * Escala del kit: 1 u = 1 dm. El tubo colector, el vaso, el embudo y el termómetro
 * son piezas del kit (vidrio con transmisión real).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  useMateriales, cajaRedondeada, cilindro, geoCache, azar, Regla, Etiqueta, sanearNormales,
} from '../_kit';

export const Y_BANCO = 0.1; // cara superior del banco óptico
export const BANCO = { x0: -2.6, x1: 7.4, ancho: 1.5 };

export const LUZ_HEX: Record<string, string> = { blanco: '#fff1d6', rojo: '#e5503f', amarillo: '#f0b02e', verde: '#49b565', azul: '#4673d6' };

// ───────────────────────────── banco óptico ─────────────────────────────

export function BancoOptico() {
  const m = useMateriales();
  const largo = BANCO.x1 - BANCO.x0;
  return (
    <group>
      <mesh geometry={cajaRedondeada(largo, Y_BANCO, BANCO.ancho, 0.02, 2)} material={m.carcasaOscura} position={[(BANCO.x0 + BANCO.x1) / 2, Y_BANCO / 2, 0]} castShadow receiveShadow />
      {/* regla del riel: la marca 0 está en el eje del tubo; la distancia lámpara–tubo se lee en cm */}
      <Regla longitud={66} material="acero" ancho={0.24} position={[0, Y_BANCO, BANCO.ancho / 2 - 0.2]} />
      <Etiqueta texto="Riel graduado (cm)" position={[3.3, Y_BANCO + 0.05, BANCO.ancho / 2 + 0.35]} tamano={0.19} fondo="#ffffffe6" />
    </group>
  );
}

// ───────────────────────────── lámpara LED sobre carro ─────────────────────────────

/** Lámpara LED con filtro de color; mira hacia −X (hacia el tubo). El origen es su lente, sobre el banco. */
export function LamparaLED({ hex, encendida = true }: { hex: string; encendida?: boolean }) {
  const m = useMateriales();
  const lente = useMemo(() => m.emisor(hex, encendida ? 1.5 : 0.05), [m, hex, encendida]);
  const yEje = 1.05;
  return (
    <group>
      {/* carro sobre el riel y poste */}
      <mesh geometry={cajaRedondeada(0.7, 0.16, 0.5, 0.03, 2)} material={m.aluminio} position={[0.5, Y_BANCO + 0.08, 0]} castShadow />
      <mesh geometry={cilindro(0.05, 0.05, yEje - Y_BANCO, 20)} material={m.cromo} position={[0.5, (yEje + Y_BANCO) / 2, 0]} castShadow />
      {/* cabezal: carcasa, aletas disipadoras, bisel y lente de color */}
      <group position={[0, yEje, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={cilindro(0.33, 0.33, 0.55, 36)} material={m.carcasaOscura} position={[0, -0.3, 0]} castShadow />
        {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} geometry={cilindro(0.38, 0.38, 0.035, 36)} material={m.aluminio} position={[0, -0.62 - i * 0.075, 0]} castShadow />)}
        <mesh geometry={cilindro(0.36, 0.36, 0.05, 36)} material={m.aluminio} position={[0, -0.02, 0]} />
        <mesh geometry={cilindro(0.29, 0.29, 0.03, 36)} material={lente} position={[0, 0.01, 0]} />
      </group>
      <Etiqueta texto="Lámpara LED" position={[0.4, yEje + 0.6, 0]} tamano={0.21} fondo="#ffffffe6" />
    </group>
  );
}

// ───────────────────────────── Elodea ─────────────────────────────

/** Rama de Elodea canadensis: tallo con verticilos de hojas lanceoladas. Origen en la base del tallo. */
export function RamaElodea({ largo = 0.8 }: { largo?: number }) {
  const m = useMateriales();
  const hoja = useMemo(() => geoCache('bio04:hoja', () => {
    const g = new THREE.SphereGeometry(1, 10, 6);
    g.scale(1, 0.12, 0.34);
    g.translate(1, 0, 0); // pivote en la base de la hoja
    return g;
  }), []);
  const tallo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, largo * 0.35, 0.03), new THREE.Vector3(-0.03, largo * 0.7, -0.02), new THREE.Vector3(0.02, largo, 0.02)]);
    return sanearNormales(new THREE.TubeGeometry(c, 20, 0.014, 6, false));
  }, [largo]);
  useEffect(() => () => tallo.dispose(), [tallo]);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#3f8a3a', roughness: 0.5, sheen: 0.7, sheenColor: new THREE.Color('#a9dc83'), side: THREE.DoubleSide, clearcoat: 0.15 }), []);
  const matTallo = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#6aa24a', roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color('#d4efb0') }), []);
  useEffect(() => () => { mat.dispose(); matTallo.dispose(); }, [mat, matTallo]);
  const iHojas = useRef<THREE.InstancedMesh>(null);
  const verticilos = 14, porVerticilo = 4;
  useEffect(() => {
    const im = iHojas.current; if (!im) return;
    const o = new THREE.Object3D(), rnd = azar(9);
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, largo * 0.35, 0.03), new THREE.Vector3(-0.03, largo * 0.7, -0.02), new THREE.Vector3(0.02, largo, 0.02)]);
    let k = 0;
    for (let v = 0; v < verticilos; v++) {
      const t = 0.08 + (v / verticilos) * 0.92, p = c.getPoint(t);
      for (let j = 0; j < porVerticilo; j++) {
        const a = (j / porVerticilo) * Math.PI * 2 + v * 0.8 + rnd() * 0.3;
        o.position.copy(p); o.rotation.set(0, a, 0.5 + rnd() * 0.35);
        o.scale.setScalar(0.16 + (1 - Math.abs(t - 0.5)) * 0.07);
        o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
      }
    }
    im.instanceMatrix.needsUpdate = true;
  }, [largo]);
  void m;
  return (
    <group>
      <mesh geometry={tallo} material={matTallo} castShadow />
      <instancedMesh ref={iHojas} args={[hoja, mat, verticilos * porVerticilo]} frustumCulled={false} castShadow />
    </group>
  );
}

// ───────────────────────────── luxómetro cuántico ─────────────────────────────

/** Medidor de PPFD: pantalla LCD con la lectura y sensor cosenoidal sobre un soporte. */
export function Luxometro({ ppfd }: { ppfd: number }) {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cajaRedondeada(0.62, 0.92, 0.16, 0.05, 3)} material={m.carcasaClara} position={[0, 0.46 + Y_BANCO, 0]} rotation={[-0.2, 0, 0]} castShadow />
      <mesh geometry={cajaRedondeada(0.5, 0.3, 0.02, 0.02, 2)} material={m.plastico('#b9c9a6', 0.35)} position={[0, 0.68 + Y_BANCO, 0.095]} rotation={[-0.2, 0, 0]} />
      <Etiqueta texto={ppfd.toFixed(0)} position={[0, 0.7 + Y_BANCO, 0.12]} tamano={0.17} color="#1e2a1c" peso={700} modo="plano" rotation={[-0.2, 0, 0]} />
      <Etiqueta texto="µmol m⁻² s⁻¹" position={[0, 0.58 + Y_BANCO, 0.12]} tamano={0.05} color="#1e2a1c" modo="plano" rotation={[-0.2, 0, 0]} />
      <mesh geometry={cilindro(0.045, 0.045, 0.1, 16)} material={m.plastico('#2d6fb7', 0.5)} position={[0.17, 0.2 + Y_BANCO, 0.09]} />
      <Etiqueta texto="Luxómetro cuántico" position={[0.45, 1.2 + Y_BANCO, 0]} tamano={0.19} fondo="#ffffffe6" />
    </group>
  );
}

/** Cabeza sensora (disco cosenoidal) que se coloca a la altura del tubo, mirando a la lámpara. */
export function SensorPAR() {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cilindro(0.025, 0.025, 0.55, 12)} material={m.cromo} position={[0, 0.275 + Y_BANCO, 0]} />
      <mesh geometry={cilindro(0.12, 0.12, 0.05, 24)} material={m.carcasaOscura} position={[0, 0.58 + Y_BANCO, 0]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={cilindro(0.07, 0.07, 0.056, 24)} material={m.plasticoClaro} position={[0.003, 0.58 + Y_BANCO, 0]} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
}

// ───────────────────────────── burbujas de O₂ ─────────────────────────────

export interface PropsBurbujas {
  /** burbujas simultáneas (0–36), ligadas a la tasa neta del modelo */
  n: number;
  /** origen (hojas), cuello del vástago y superficie del gas (y) */
  hojas: [number, number, number][];
  cuello: [number, number, number];
  yInterfaz: number;
  /** velocidad de ciclo (1/s) */
  ciclo: number;
}
const N_MAX = 36;

export function BurbujasO2({ n, hojas, cuello, yInterfaz, ciclo }: PropsBurbujas) {
  const im = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => geoCache('bio04:burb', () => new THREE.SphereGeometry(1, 12, 8)), []);
  // burbuja legible a cualquier calidad: casi blanca, algo translúcida, dibujada por encima del agua (no entra en la pasada de transmisión)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f4fbff', emissive: '#bfe6f5', emissiveIntensity: 0.35, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const sem = useMemo(() => { const r = azar(33); return Array.from({ length: N_MAX }, () => ({ f: r(), h: Math.floor(r() * 997), w: r() * 6 })); }, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = im.current; if (!m) return;
    m.count = Math.min(N_MAX, Math.max(0, Math.round(n)));
    const t = clock.elapsedTime * ciclo;
    for (let i = 0; i < m.count; i++) {
      const s = sem[i], u = (t + s.f) % 1;
      const h = hojas[s.h % hojas.length];
      const uFun = Math.min(1, u / 0.45), uTub = Math.max(0, (u - 0.45) / 0.55);
      let x: number, y: number, z: number, r: number;
      if (u < 0.45) {
        const e = uFun * uFun * (3 - 2 * uFun);
        x = h[0] + (cuello[0] - h[0]) * e + Math.sin(clock.elapsedTime * 3 + s.w) * 0.012;
        y = h[1] + (cuello[1] - h[1]) * uFun;
        z = h[2] + (cuello[2] - h[2]) * e;
        r = 0.04;
      } else {
        x = cuello[0] + Math.sin(clock.elapsedTime * 4 + s.w) * 0.006;
        y = cuello[1] + (yInterfaz - cuello[1]) * uTub;
        z = cuello[2];
        r = 0.032;
      }
      o.position.set(x, y, z); o.scale.setScalar(r); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={im} args={[geo, mat, N_MAX]} frustumCulled={false} renderOrder={6} />;
}
