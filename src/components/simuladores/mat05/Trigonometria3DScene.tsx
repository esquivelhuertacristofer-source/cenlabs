"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Trigonometria3DScene — el círculo unitario en el plano XY con su graduación
   en grados (afuera) y radianes (adentro), y a su derecha la gráfica «desenrollada»
   de sen θ (y cos θ si se activa) sincronizada con el vector: la línea punteada
   horizontal lleva la altura del punto del círculo hasta la curva.

   Los ángulos CAPTURADOS por el alumno quedan marcados sobre el círculo. La escena
   NO dibuja ninguna recta del reto ni las soluciones: sólo lo que él mide.
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { LabCanvas, PlanoCartesiano, ArcoAngulo, Etiqueta, toro, esfera } from '../_kit';
import { Trazo, EncuadreSuave } from '../mat_comun_1a5/trazos';
import { geometriaBarras } from '../mat_comun_1a5/barras';

interface Trigonometria3DSceneProps {
  angulo: number;
  verSeno: boolean;
  verCoseno: boolean;
  verTangente?: boolean;
  /** ángulos (°) que el alumno capturó */
  capturados?: number[];
}

const R = 2;                     // radio del círculo unitario en la escena (1 u matemática = R u de escena)
const X0 = R + 1.3;              // origen de la gráfica desenrollada
const SX = 0.62;                 // u de escena por radián en la gráfica
const C_SEN = '#38bdf8', C_COS = '#e879f9', C_TAN = '#facc15', C_CAP = '#ffb703';

const GRADOS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const RAD: Record<number, string> = { 0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };

function curva(f: (t: number) => number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 180; i++) { const t = (i / 180) * Math.PI * 2; pts.push([X0 + t * SX, R * f(t)]); }
  return pts;
}

/** Distancia (hacia adentro) de cada rótulo en radianes: escalonada para que no se pisen. */
const rIn = (g: number) => (g % 90 === 0 ? 0.45 : g % 45 === 0 ? 1.0 : g % 60 === 0 ? 0.6 : 0.3);

/** Graduación del círculo: marcas cada 15° y rótulos en grados y radianes. */
function Graduacion() {
  const geo = useMemo(() => {
    const e: [number, number, number, number, number, number][] = [];
    for (let g = 0; g < 360; g += 15) {
      const a = (g * Math.PI) / 180, notable = GRADOS.includes(g);
      const r0 = R - (notable ? 0.12 : 0.06), r1 = R + (notable ? 0.12 : 0.06);
      e.push([Math.cos(a) * r0, Math.sin(a) * r0, 0.01, Math.cos(a) * r1, Math.sin(a) * r1, 0.01]);
    }
    return geometriaBarras(e, 0.012, 5);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe8ec', toneMapped: false }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group>
      <mesh geometry={geo} material={mat} />
      {GRADOS.map((g) => {
        const a = (g * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
        return (
          <group key={g}>
            <Etiqueta modo="plano" texto={`${g}°`} color="#ffffff" peso={600} tamano={0.3} position={[c * (R + 0.55), s * (R + 0.55), 0.02]} />
            <Etiqueta modo="plano" texto={RAD[g]} color="#9fd8ee" peso={500} tamano={0.24} position={[c * (R - rIn(g)), s * (R - rIn(g)), 0.02]} />
          </group>
        );
      })}
    </group>
  );
}

/** Ejes y rótulos de la gráfica desenrollada. */
function EjesOnda() {
  const marcas = [0, 90, 180, 270, 360];
  return (
    <group>
      <Trazo pts={[[X0 - 0.15, 0], [X0 + 2 * Math.PI * SX + 0.3, 0]]} color="#eef3f5" radio={0.012} />
      <Trazo pts={[[X0, -R - 0.35], [X0, R + 0.35]]} color="#eef3f5" radio={0.012} />
      {[1, -1].map((s) => <Trazo key={s} pts={[[X0, s * R], [X0 + 2 * Math.PI * SX, s * R]]} color="#6f838d" radio={0.008} rayas={[0.12, 0.1]} />)}
      {[1, 0, -1].map((v) => (
        <Etiqueta key={v} modo="plano" texto={String(v).replace('-', '−')} color="#dfe8ec" peso={500} tamano={0.24} ancla={[1, 0.5]} position={[X0 - 0.14, v * R, 0.02]} />
      ))}
      {marcas.map((g) => {
        const x = X0 + ((g * Math.PI) / 180) * SX;
        return (
          <group key={g}>
            <Trazo pts={[[x, -0.09], [x, 0.09]]} color="#eef3f5" radio={0.012} />
            <Etiqueta modo="plano" texto={`${g}°`} color="#ffffff" peso={600} tamano={0.3} ancla={[0.5, 1]} position={[x, -0.16, 0.02]} />
            <Etiqueta modo="plano" texto={g === 360 ? '2π' : RAD[g]} color="#9fd8ee" peso={500} tamano={0.24} ancla={[0.5, 1]} position={[x, -0.6, 0.02]} />
          </group>
        );
      })}
      <Etiqueta modo="plano" texto="*θ*" color="#eef3f5" tamano={0.3} ancla={[0, 0.5]} position={[X0 + 2 * Math.PI * SX + 0.4, 0, 0.02]} />
    </group>
  );
}

function Contenido({ angulo, verSeno, verCoseno, verTangente = false, capturados = [] }: Trigonometria3DSceneProps) {
  const rad = (angulo * Math.PI) / 180;
  const c = Math.cos(rad), s = Math.sin(rad), t = Math.tan(rad);
  const x = R * c, y = R * s;
  const wx = X0 + rad * SX;
  const hayTan = Math.abs(c) > 0.02;
  const tanY = Math.max(-R * 1.55, Math.min(R * 1.55, R * t));

  const ptsSen = useMemo(() => curva(Math.sin), []);
  const ptsCos = useMemo(() => curva(Math.cos), []);
  const geoAro = toro(R, 0.018, 8, 128);
  const matAro = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), []);
  const matDisco = useMemo(() => new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.07, depthWrite: false, toneMapped: false }), []);
  const matVec = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), []);
  const discoGeo = useMemo(() => new THREE.CircleGeometry(R, 96), []);
  useEffect(() => () => { matAro.dispose(); matDisco.dispose(); matVec.dispose(); discoGeo.dispose(); }, [matAro, matDisco, matVec, discoGeo]);
  const matSen = useMemo(() => new THREE.MeshBasicMaterial({ color: C_SEN, toneMapped: false }), []);
  const matCos = useMemo(() => new THREE.MeshBasicMaterial({ color: C_COS, toneMapped: false }), []);
  const matCap = useMemo(() => new THREE.MeshBasicMaterial({ color: C_CAP, toneMapped: false }), []);
  useEffect(() => () => { matSen.dispose(); matCos.dispose(); matCap.dispose(); }, [matSen, matCos, matCap]);

  return (
    <>
      <EncuadreSuave caja={[[-R - 1.1, -R - 0.9, 0], [X0 + 2 * Math.PI * SX + 0.8, R + 0.9, 0]]} margen={1.0} />

      {/* ejes del círculo (1 u matemática = R u de escena) */}
      <PlanoCartesiano rangoX={[-1.45, 1.45]} rangoY={[-1.45, 1.45]} paso={0.5} pasoMayor={1} pasoEtiquetas={1} escala={R} etiquetas={false} nombresEjes={['x', 'y']} />
      <mesh geometry={discoGeo} material={matDisco} position={[0, 0, -0.01]} />
      <mesh geometry={geoAro} material={matAro} />
      <Graduacion />
      <Etiqueta modo="plano" texto="1" color="#dfe8ec" peso={500} tamano={0.24} ancla={[0.5, 1]} position={[R, -0.12, 0.02]} />
      <Etiqueta modo="plano" texto="1" color="#dfe8ec" peso={500} tamano={0.24} ancla={[1, 0.5]} position={[-0.12, R, 0.02]} />

      {/* tangente */}
      {verTangente && hayTan && (
        <group>
          <Trazo pts={[[R, -R * 1.55], [R, R * 1.55]]} color={C_TAN} radio={0.008} opacidad={0.35} />
          <Trazo pts={[[R, 0], [R, tanY]]} color={C_TAN} radio={0.035} z={0.012} />
          <Trazo pts={[[0, 0], [R, tanY]]} color={C_TAN} radio={0.01} rayas={[0.12, 0.09]} />
        </group>
      )}

      {/* proyecciones */}
      {verSeno && (
        <group>
          <Trazo pts={[[x, 0], [x, y]]} color={C_SEN} radio={0.045} z={0.012} />
          <Trazo pts={[[x, y], [wx, y]]} color={C_SEN} radio={0.012} rayas={[0.14, 0.1]} opacidad={0.8} />
        </group>
      )}
      {verCoseno && (
        <group>
          <Trazo pts={[[0, 0], [x, 0]]} color={C_COS} radio={0.045} z={0.014} />
        </group>
      )}

      {/* ángulo y vector */}
      {angulo >= 1 && <ArcoAngulo desde={0} hasta={angulo} radio={0.55} sentido="antihorario" color="#ffd166" etiqueta={`${Math.round(angulo)}°`} marcaRecta={false} />}
      <Trazo pts={[[0, 0], [x, y]]} color="#ffffff" radio={0.04} z={0.016} />
      <mesh geometry={esfera(1, 16)} material={matVec} position={[x, y, 0.03]} scale={0.1} />

      {/* ángulos capturados por el alumno */}
      {capturados.map((g, i) => {
        const a = (g * Math.PI) / 180, px = R * Math.cos(a), py = R * Math.sin(a);
        return (
          <group key={i + '-' + g}>
            <mesh geometry={esfera(1, 14)} material={matCap} position={[px, py, 0.03]} scale={0.13} />
            <Etiqueta modo="plano" texto={`${g}°`} color="#101820" fondo={C_CAP} peso={700} tamano={0.24} position={[Math.cos(a) * (R + 1.05), Math.sin(a) * (R + 1.05), 0.06]} />
            <Trazo pts={[[Math.cos(a) * (R + 0.12), Math.sin(a) * (R + 0.12)], [Math.cos(a) * (R + 0.85), Math.sin(a) * (R + 0.85)]]} color={C_CAP} radio={0.012} />
          </group>
        );
      })}

      {/* gráfica desenrollada */}
      <EjesOnda />
      {verSeno && <Trazo pts={ptsSen} color={C_SEN} radio={0.035} z={0.01} />}
      {verCoseno && <Trazo pts={ptsCos} color={C_COS} radio={0.035} z={0.012} />}
      <Trazo pts={[[wx, -R - 0.1], [wx, R + 0.1]]} color="#ffffff" radio={0.008} opacidad={0.45} />
      {verSeno && <mesh geometry={esfera(1, 14)} material={matSen} position={[wx, y, 0.04]} scale={0.12} />}
      {verCoseno && <mesh geometry={esfera(1, 14)} material={matCos} position={[wx, x, 0.04]} scale={0.12} />}
      <Etiqueta modo="plano" texto={verSeno && verCoseno ? 'sen θ y cos θ' : verCoseno ? 'cos θ' : 'sen θ'} color="#ffffff" fondo="rgba(20,30,36,0.85)" peso={700} tamano={0.3}
        ancla={[0.5, 0]} position={[X0 + Math.PI * SX, R + 0.5, 0.05]} />
    </>
  );
}

export default function Trigonometria3DScene(props: Trigonometria3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 20], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 4, maxDistancia: 50, maxPolar: Math.PI * 0.8, minPolar: Math.PI * 0.2 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
