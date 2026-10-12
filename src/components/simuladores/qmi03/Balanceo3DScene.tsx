"use client";
/**
 * Q3 · Balanceo de ecuaciones — balanza de brazos iguales (Lavoisier) con R3F + kit.
 *
 *   · Plato izquierdo = REACTIVOS, plato derecho = PRODUCTOS.
 *   · Cada plato lleva tantas moléculas de bolas y varillas (geometría real) como el
 *     coeficiente de su especie: al cambiar un coeficiente aparece o desaparece una copia.
 *   · El brazo se inclina según la masa de cada lado (instrumento: no dice qué coeficiente
 *     corregir). Con la masa conservada queda horizontal y se enciende el testigo verde.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, Etiqueta, useMateriales, cilindro, cajaRedondeada, tornear, toro, esfera,
  useTexturaLienzo, familiaTexto, type P2,
} from '../_kit';
import { MoleculasEnBandeja, type EspecieBandeja } from './moleculas';

type V3 = [number, number, number];

const PIV: V3 = [0, 4.7, 0];   // eje del brazo
const L = 3.0;                  // semibrazo
const H_COLGANTE = 2.9;         // del gancho al fondo del plato
const R_PLATO = 1.95;
const TILT_MAX = 0.3;

const subs = (f: string) => f.replace(/(\d+)/g, '_{$1}');

/** Varilla recta entre dos puntos (sin crear objetos en el render). */
function Varilla({ a, b, r = 0.014, material }: { a: V3; b: V3; r?: number; material: THREE.Material }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return { pos: va.add(vb).multiplyScalar(0.5), quat: q, len };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return <mesh geometry={cilindro(r, r, len, 6)} material={material} position={pos} quaternion={quat} />;
}

function Plato({ especies, etiqueta, grupo }: { especies: EspecieBandeja[]; etiqueta: string; grupo: React.RefObject<THREE.Group | null> }) {
  const m = useMateriales();
  const perfil: P2[] = useMemo(() => [[0, 0], [R_PLATO, 0], [R_PLATO + 0.05, 0.05], [R_PLATO + 0.05, 0.28], [R_PLATO + 0.01, 0.28], [R_PLATO - 0.02, 0.07], [0, 0.07]], []);
  const rim: V3[] = useMemo(() => [90, 210, 330].map((g) => [Math.cos((g * Math.PI) / 180) * R_PLATO, 0.26, Math.sin((g * Math.PI) / 180) * R_PLATO] as V3), []);
  const texto = especies.map((e) => `${e.copias} ${subs(e.formula)}`).join(' + ');
  return (
    <group ref={grupo}>
      <mesh geometry={tornear(perfil, 64)} material={m.acero} castShadow receiveShadow />
      {rim.map((p, i) => <Varilla key={i} a={[0, H_COLGANTE, 0]} b={p} material={m.acero} />)}
      <mesh geometry={toro(0.07, 0.014, 6, 16)} material={m.acero} position={[0, H_COLGANTE + 0.04, 0]} rotation-y={Math.PI / 2} />
      <group position={[0, 0.07, 0]}>
        <MoleculasEnBandeja especies={especies} radio={R_PLATO - 0.15} />
      </group>
      {/* rótulo del plato en su borde frontal, y el contenido (coeficientes) sobre el gancho */}
      <Etiqueta texto={etiqueta} position={[0, 0.14, R_PLATO + 0.06]} tamano={0.17} peso={700} color="#ffffff" fondo="#3b4a54" modo="plano" />
      <Etiqueta texto={texto} position={[0, H_COLGANTE + 0.55, 0]} tamano={0.26} peso={600} color="#1b2a33" fondo="#ffffffe6" ancla={[0.5, 0]} />
    </group>
  );
}

function Escala() {
  const m = useMateriales();
  const tex = useTexturaLienzo(512, 96, (ctx, W, H) => {
    ctx.fillStyle = '#f6f4ee'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#16191c';
    for (let k = -8; k <= 8; k++) {
      const x = W / 2 + (k * W) / 18;
      const h = k === 0 ? H * 0.8 : k % 4 === 0 ? H * 0.55 : H * 0.35;
      ctx.fillRect(x - (k === 0 ? 3 : 1.5), 0, k === 0 ? 6 : 3, h);
    }
    ctx.font = `700 ${H * 0.32}px ${familiaTexto()}`; ctx.textAlign = 'center'; ctx.fillText('0', W / 2, H * 0.97);
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group position={[0, PIV[1] - 1.6, 0.2]}>
      <mesh geometry={cajaRedondeada(1.6, 0.3, 0.05, 0.02)} material={m.carcasaOscura} />
      <mesh material={mat} position={[0, 0, 0.03]}><planeGeometry args={[1.5, 0.28]} /></mesh>
    </group>
  );
}

function Balanza({ reactivos, productos, masaR, masaP, equilibrada }: {
  reactivos: EspecieBandeja[]; productos: EspecieBandeja[]; masaR: number; masaP: number; equilibrada: boolean;
}) {
  const m = useMateriales();
  const brazo = useRef<THREE.Group>(null);
  const platoI = useRef<THREE.Group>(null);
  const platoD = useRef<THREE.Group>(null);
  const estado = useRef({ t: 0, v: 0 });
  const dif = (masaR - masaP) / Math.max(1, masaR, masaP);
  const objetivo = Math.max(-TILT_MAX, Math.min(TILT_MAX, dif * 2.2));
  const meta = useRef(objetivo);
  meta.current = objetivo;

  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.04);
    const e = estado.current;
    // resorte amortiguado: el brazo oscila un poco antes de asentarse
    const acc = -26 * (e.t - meta.current) - 3.2 * e.v;
    e.v += acc * dt; e.t += e.v * dt;
    const th = e.t;
    if (brazo.current) brazo.current.rotation.z = th;
    const c = Math.cos(th), s = Math.sin(th);
    if (platoI.current) platoI.current.position.set(PIV[0] - L * c, PIV[1] - L * s - H_COLGANTE, 0);
    if (platoD.current) platoD.current.position.set(PIV[0] + L * c, PIV[1] + L * s - H_COLGANTE, 0);
  });

  return (
    <group>
      {/* base, columna y cabeza con el cuchillo del brazo */}
      <mesh geometry={cajaRedondeada(4.6, 0.3, 2.4, 0.06)} material={m.hierroPintado} position={[0, 0.15, 0]} castShadow receiveShadow />
      <mesh geometry={cilindro(0.17, 0.22, PIV[1] - 0.5, 28)} material={m.acero} position={[0, 0.3 + (PIV[1] - 0.5) / 2, 0]} castShadow />
      <mesh geometry={cajaRedondeada(0.5, 0.36, 0.36, 0.05)} material={m.laton} position={[0, PIV[1] - 0.2, 0]} castShadow />
      <Escala />
      {/* testigo de masa conservada (verde) */}
      <mesh geometry={esfera(0.12, 16)} position={[1.8, 0.4, 0.85]}>
        <meshStandardMaterial color={equilibrada ? '#22c55e' : '#c98a1c'} emissive={equilibrada ? '#22c55e' : '#000000'} emissiveIntensity={equilibrada ? 0.8 : 0} roughness={0.3} />
      </mesh>
      <Etiqueta texto="masa conservada" position={[1.8, 0.28, 1.0]} tamano={0.15} ancla={[0.5, 1]} color="#4a5157" peso={600} />

      {/* brazo: viga, cuchillo, aguja y ganchos */}
      <group ref={brazo} position={PIV}>
        <mesh geometry={cajaRedondeada(2 * L + 0.3, 0.16, 0.2, 0.04)} material={m.aluminio} castShadow />
        <mesh geometry={cilindro(0.13, 0.13, 0.36, 20)} material={m.laton} rotation-x={Math.PI / 2} castShadow />
        <mesh geometry={cajaRedondeada(0.04, 1.5, 0.03, 0.01)} material={m.plastico('#c8372d', 0.4)} position={[0, -0.75, 0.12]} />
        {[-L, L].map((x) => (
          <mesh key={x} geometry={toro(0.07, 0.016, 6, 16)} material={m.laton} position={[x, -0.1, 0]} rotation-y={Math.PI / 2} />
        ))}
      </group>

      <Plato especies={reactivos} etiqueta="Reactivos" grupo={platoI} />
      <Plato especies={productos} etiqueta="Productos" grupo={platoD} />
    </group>
  );
}

export interface BalanceoSceneProps { balanceo: any }

export default function Balanceo3DScene({ balanceo }: BalanceoSceneProps) {
  if (!balanceo) return null;
  const { reacciones, reaccionActual, coeficientes, masaReactivos = 0, masaProductos = 0, isBalanced } = balanceo;
  const reac = reacciones?.[reaccionActual] ?? reacciones?.[0];
  if (!reac) return null;
  const nR = reac.reactivos.length;
  const reactivos: EspecieBandeja[] = reac.reactivos.map((mo: any, i: number) => ({ formula: mo.formula, copias: Math.max(1, coeficientes[i] || 1) }));
  const productos: EspecieBandeja[] = reac.productos.map((mo: any, i: number) => ({ formula: mo.formula, copias: Math.max(1, coeficientes[nR + i] || 1) }));
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 4.5, 17], objetivo: [0, 3, 0], fov: 35 }}
      controles={{ minDistancia: 6, maxDistancia: 30, cajaObjetivo: [[-3, 1, -1], [3, 5, 1]] }}
    >
      <EncuadrarCaja caja={[[-5.2, 0.1, -2.5], [5.2, 5.9, 2.5]]} margen={0.96} direccion={[0, 0.16, 1]} />
      <Balanza reactivos={reactivos} productos={productos} masaR={masaReactivos} masaP={masaProductos} equilibrada={!!isBalanced} />
    </LabCanvas>
  );
}
