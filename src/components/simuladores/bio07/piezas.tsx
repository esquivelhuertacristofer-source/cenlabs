'use client';
/**
 * bio07/piezas.tsx — reflejo rotuliano (1 u = 1 dm; mesa de exploración, paciente sentado).
 *
 * Piezas: camilla, pierna (muslo con cuádriceps, rótula, tendón rotuliano, tibia que
 * patea), martillo de reflejos en su soporte, corte de la médula L3–L4 ampliado (sustancia
 * gris en mariposa, raíces dorsal y ventral, neurona sensitiva, motoneurona α y la
 * hendidura sináptica), nervios con vainas de mielina y monitor de EMG.
 *
 * Honestidad: la mielina se dibuja con un espesor FIJO (la del paciente es la incógnita
 * del diagnóstico) y el monitor sólo muestra lo que un EMG real: el artefacto del golpe
 * y la salva muscular cuando llega.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMateriales, geoCache, tornear, cajaRedondeada, crearLienzo, texturaDeLienzo, texturaCompartida, azar, familiaTexto, FAMILIA_MONO, type P2 } from '../_kit';

type V3 = [number, number, number];
type Ctx = CanvasRenderingContext2D;

// ───────────────────────────── coordenadas del montaje ─────────────────────────────

export const RODILLA = new THREE.Vector3(0.2, 5.1, 0);
export const X_CADERA = -4.0;
export const PIVOTE_MARTILLO = new THREE.Vector3(2.55, 6.3, 0);
/** punto del tendón rotuliano donde pega el martillo */
export const BLANCO_GOLPE = new THREE.Vector3(0.82, 4.8, 0);
const L_MARTILLO = 1.9;
/** ángulo del martillo (rad, 0 = colgando; + hacia +X) con el que toca el tendón */
export const ANG_GOLPE = Math.atan2(BLANCO_GOLPE.x - PIVOTE_MARTILLO.x, -(BLANCO_GOLPE.y - PIVOTE_MARTILLO.y)) * 1 + 0.0;

/** Inserta, en coordenadas de la médula ampliada (x, y locales), un punto del mundo. */
export const CENTRO_MEDULA = new THREE.Vector3(0.9, 9.9, 0);
export const ESCALA_MEDULA = 2.2;
export const enMedula = (x: number, y: number, z = 0.12) => new THREE.Vector3(CENTRO_MEDULA.x + x * ESCALA_MEDULA, CENTRO_MEDULA.y + y * ESCALA_MEDULA, z);

// Puntos de los nervios (mundo). El impulso sensitivo va del huso al terminal; el motor, de la motoneurona a la placa.
const HUSO = new THREE.Vector3(-0.35, 6.12, 0.2);
const PLACA = new THREE.Vector3(-2.35, 6.1, 0.2);
export const RUTA_SENSITIVA: THREE.Vector3[] = [
  HUSO.clone(), new THREE.Vector3(0.45, 6.95, 0.25), new THREE.Vector3(1.55, 8.4, 0.25), new THREE.Vector3(2.85, 10.0, 0.2),
  enMedula(1.05, 0.62, 0.2), enMedula(0.62, 0.52, 0.16), enMedula(0.4, 0.28, 0.14), enMedula(0.38, 0.02, 0.14), enMedula(0.37, -0.15, 0.14),
];
export const RUTA_MOTORA: THREE.Vector3[] = [
  enMedula(0.36, -0.44, 0.14), enMedula(0.2, -0.72, 0.14), enMedula(0.06, -0.86, 0.16), new THREE.Vector3(-0.3, 7.9, 0.22),
  new THREE.Vector3(-1.1, 7.0, 0.22), new THREE.Vector3(-1.9, 6.4, 0.22), PLACA.clone(),
];

// ───────────────────────────── suelo, camilla, soporte ─────────────────────────────

export function Consultorio() {
  const m = useMateriales();
  const pad = m.plastico('#2e6c8a', 0.5);
  const suelo = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9ced1', roughness: 0.9 }), []);
  const pared = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e7ebed', roughness: 0.95 }), []);
  useEffect(() => () => { suelo.dispose(); pared.dispose(); }, [suelo, pared]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={suelo} position={[2, -0.001, 0]} receiveShadow><planeGeometry args={[60, 30]} /></mesh>
      <mesh material={pared} position={[2, 8, -4.2]}><planeGeometry args={[60, 22]} /></mesh>
      {/* camilla: colchoneta acolchada sobre bastidor de acero */}
      <mesh geometry={cajaRedondeada(6.6, 0.46, 3.4, 0.12)} material={pad} position={[-3.4, 4.07, 0]} castShadow receiveShadow />
      {[-6.2, -0.9].map((x) => (
        <mesh key={x} geometry={cajaRedondeada(0.34, 3.85, 2.7, 0.04, 1)} material={m.aluminio} position={[x, 1.92, 0]} castShadow />
      ))}
      <mesh geometry={cajaRedondeada(5.6, 0.18, 0.18, 0.03, 1)} material={m.aluminio} position={[-3.55, 3.5, 0]} />
      <mesh geometry={cajaRedondeada(5.2, 0.12, 2.9, 0.03, 1)} material={m.aluminio} position={[-3.55, 0.12, 0]} receiveShadow />
    </group>
  );
}

// ───────────────────────────── pierna ─────────────────────────────

const perfilMuslo = (): P2[] => [[0, 0], [0.7, 0.02], [0.92, 0.5], [0.9, 1.5], [0.8, 2.8], [0.68, 3.8], [0.62, 4.15], [0.45, 4.3], [0, 4.34]];
const perfilPierna = (): P2[] => [[0, -4.0], [0.24, -3.98], [0.29, -3.7], [0.34, -3.0], [0.44, -1.9], [0.5, -1.0], [0.49, -0.4], [0.52, 0.05], [0.46, 0.2], [0, 0.24]];
/** tronco con bata: de la cintura (y = 0) hasta el pecho, con la parte alta redondeada */
const perfilTorso = (): P2[] => [[0, 0], [1.05, 0.02], [1.08, 0.5], [0.98, 1.4], [0.96, 2.2], [1.02, 2.9], [0.98, 3.3], [0.78, 3.62], [0.4, 3.78], [0, 3.82]];

function texMusculo() {
  return texturaCompartida('bio07:musculo', 256, 128, (ctx: Ctx, w: number, h: number) => {
    ctx.fillStyle = '#b8413b'; ctx.fillRect(0, 0, w, h);
    const rnd = azar(12);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * w;
      ctx.strokeStyle = rnd() > 0.5 ? '#8f2c2a' : '#d96a60'; ctx.globalAlpha = 0.25 + rnd() * 0.35; ctx.lineWidth = 1 + rnd() * 2.2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (rnd() - 0.5) * 6, h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

export interface PropsPierna {
  /** giro de la tibia alrededor de la rodilla (rad, + = patada hacia delante) y contracción 0–1 del cuádriceps (se leen en cada fotograma) */
  estado: React.MutableRefObject<{ patada: number; contraccion: number }>;
}

export function Pierna({ estado }: PropsPierna) {
  const m = useMateriales();
  const piel = m.plastico('#e0ae89', 0.62);
  const tendon = m.plastico('#f0e7d2', 0.45);
  const hueso = m.plastico('#f4edd9', 0.4);
  const bata = m.plastico('#bcd7e6', 0.9);
  const tex = texMusculo();
  const musc = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0 }), [tex]);
  useEffect(() => () => { musc.dispose(); }, [musc]);
  const gMuslo = geoCache('bio07:muslo', () => tornear(perfilMuslo(), 40));
  const gPierna = geoCache('bio07:pierna', () => tornear(perfilPierna(), 36));
  const gTorso = geoCache('bio07:torso', () => tornear(perfilTorso(), 40));
  const esf = geoCache('bio07:esf', () => new THREE.SphereGeometry(1, 24, 16));
  const musculo = useRef<THREE.Mesh>(null);
  const tibia = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = Math.min(1, Math.max(0, estado.current.contraccion));
    if (musculo.current) musculo.current.scale.set(0.5 + 0.17 * k, 2.05 - 0.25 * k, 0.64 + 0.1 * k);
    if (tibia.current) tibia.current.rotation.z = estado.current.patada;
  });
  return (
    <group>
      {/* tronco del paciente (sólo hasta la cintura, con bata) */}
      <mesh geometry={gTorso} material={bata} position={[X_CADERA - 0.25, 4.3, 0]} castShadow />
      {/* muslo: de la cadera a la rodilla */}
      <mesh geometry={gMuslo} material={piel} position={[X_CADERA, RODILLA.y, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow />
      {/* cuádriceps sobre la cara anterior del muslo */}
      <mesh ref={musculo} geometry={esf} material={musc} position={[-1.8, 5.62, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
      {/* rótula y tendones */}
      <mesh geometry={esf} material={hueso} position={[0.66, 5.7, 0]} scale={[0.17, 0.3, 0.27]} rotation={[0, 0, -0.25]} castShadow />
      <mesh geometry={cajaRedondeada(0.9, 0.07, 0.34, 0.025, 1)} material={tendon} position={[0.1, 5.98, 0]} rotation={[0, 0, -0.18]} />
      <mesh geometry={cajaRedondeada(0.07, 1.0, 0.3, 0.025, 1)} material={tendon} position={[0.8, 5.2, 0]} rotation={[0, 0, 0.1]} />
      {/* tibia: gira alrededor del eje de la rodilla */}
      <group ref={tibia} position={RODILLA.toArray() as V3}>
        <mesh geometry={gPierna} material={piel} castShadow />
        {/* zapato: puntera hacia +X */}
        <mesh geometry={cajaRedondeada(2.45, 0.62, 0.95, 0.24)} material={m.plastico('#2a3140', 0.6)} position={[0.62, -4.45, 0]} castShadow />
        <mesh geometry={cajaRedondeada(2.5, 0.16, 1.0, 0.07, 1)} material={m.plastico('#ececea', 0.7)} position={[0.62, -4.74, 0]} />
        <mesh geometry={esf} material={piel} position={[0, -0.02, 0]} scale={[0.6, 0.34, 0.6]} />
      </group>
      {/* electrodos de superficie sobre el cuádriceps */}
      {[-2.55, -1.65].map((x) => (
        <mesh key={x} geometry={geoCache('bio07:electrodo', () => new THREE.CylinderGeometry(0.15, 0.15, 0.04, 20))} material={m.plastico('#f1f3f4', 0.5)} position={[x, 6.1, 0.1]} />
      ))}
      {/* huso neuromuscular (receptor de estiramiento) y placas motoras */}
      <mesh geometry={esf} material={m.plastico('#f4d36b', 0.5)} position={HUSO.toArray() as V3} scale={[0.34, 0.07, 0.07]} rotation={[0, 0, -0.1]} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={esf} material={m.plastico('#2f9d6b', 0.45)} position={[PLACA.x - 0.25 + i * 0.24, PLACA.y - 0.08 * i, PLACA.z]} scale={[0.09, 0.05, 0.09]} />
      ))}
    </group>
  );
}

// ───────────────────────────── martillo de reflejos ─────────────────────────────

/** Martillo de Taylor (cabeza de goma triangular) en su soporte; el pivote está en el origen del grupo. */
export function SoporteYMartillo({ angulo }: { angulo: React.MutableRefObject<number> }) {
  const brazo = useRef<THREE.Group>(null);
  useFrame(() => { if (brazo.current) brazo.current.rotation.z = angulo.current; });
  const m = useMateriales();
  const goma = m.plastico('#d94a2b', 0.8);
  const forma = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.34); s.lineTo(0.42, 0.3); s.lineTo(-0.42, 0.3); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
    g.translate(0, 0, -0.18);
    return g;
  }, []);
  useEffect(() => () => { forma.dispose(); }, [forma]);
  const px = PIVOTE_MARTILLO.x, py = PIVOTE_MARTILLO.y;
  return (
    <group>
      {/* soporte: base, columna y brazo horizontal con articulación */}
      <mesh geometry={geoCache('bio07:base', () => new THREE.CylinderGeometry(0.9, 1.0, 0.18, 32))} material={m.hierroPintado} position={[4.6, 0.09, 0]} castShadow />
      <mesh geometry={geoCache('bio07:col', () => new THREE.CylinderGeometry(0.09, 0.09, 1, 14))} material={m.acero} position={[4.6, py / 2, 0]} scale={[1, py, 1]} castShadow />
      <mesh geometry={geoCache('bio07:brazo', () => new THREE.CylinderGeometry(0.08, 0.08, 1, 14))} material={m.acero} position={[(4.6 + px) / 2, py, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 4.6 - px, 1]} castShadow />
      <group ref={brazo} position={[px, py, 0]}>
        <mesh geometry={geoCache('bio07:nudillo', () => new THREE.SphereGeometry(0.15, 16, 12))} material={m.cromo} />
        {/* mango */}
        <mesh geometry={geoCache('bio07:mango', () => new THREE.CylinderGeometry(0.07, 0.085, 1, 14))} material={m.cromo} position={[0, -L_MARTILLO / 2 + 0.1, 0]} scale={[1, L_MARTILLO - 0.2, 1]} castShadow />
        {/* cabeza de goma */}
        <mesh geometry={forma} material={goma} position={[0, -L_MARTILLO - 0.1, 0]} rotation={[0, 0, Math.PI]} castShadow />
      </group>
    </group>
  );
}

// ───────────────────────────── médula espinal ampliada ─────────────────────────────

function formaMariposa(): THREE.Shape {
  // semicontorno derecho (de arriba a abajo); el izquierdo es su espejo
  const der: [number, number][] = [
    [0, 0.13], [0.12, 0.2], [0.26, 0.46], [0.38, 0.64], [0.46, 0.66], [0.5, 0.56], [0.42, 0.34], [0.46, 0.2],
    [0.62, 0.08], [0.7, -0.12], [0.66, -0.42], [0.5, -0.58], [0.3, -0.56], [0.14, -0.4], [0.06, -0.3], [0, -0.28],
  ];
  const izq = der.slice(1, -1).reverse().map(([x, y]) => [-x, y] as [number, number]);
  const pts = [...der, ...izq].map(([x, y]) => new THREE.Vector2(x, y));
  const curva = new THREE.SplineCurve(pts.concat(pts[0]));
  return new THREE.Shape(curva.getPoints(160));
}
const gMariposa = () => geoCache('bio07:mariposa', () => new THREE.ShapeGeometry(formaMariposa(), 8));
const gElipse = (rx: number, ry: number, seg = 48) => geoCache(`bio07:elipse:${rx}:${ry}`, () => {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return new THREE.ShapeGeometry(s, seg);
});
const gAnillo = (rx0: number, ry0: number, rx1: number, ry1: number) => geoCache(`bio07:anillo:${rx0}:${ry0}:${rx1}:${ry1}`, () => {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx1, ry1, 0, Math.PI * 2, false, 0);
  const h = new THREE.Path();
  h.absellipse(0, 0, rx0, ry0, 0, Math.PI * 2, true, 0);
  s.holes.push(h);
  return new THREE.ShapeGeometry(s, 64);
});

export interface PropsMedula {
  /** referencia a un valor 0–1: avance de las vesículas por la hendidura */
  vesiculas: React.MutableRefObject<number>;
  /** referencia 0–1: excitación de la motoneurona */
  excitacion: React.MutableRefObject<number>;
}

export function MedulaAmpliada({ vesiculas, excitacion }: PropsMedula) {
  const m = useMateriales();
  const fondo = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.95 }), []);
  useEffect(() => () => { fondo.dispose(); }, [fondo]);
  const sust = m.plastico('#ece2c4', 0.8);
  const gris = m.plastico('#8f9aa8', 0.8);
  const hueso = m.plastico('#d9cfb5', 0.55);
  const dura = m.plastico('#c9a9b2', 0.9);
  const soma = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8884a', roughness: 0.6 }), []);
  useEffect(() => () => { soma.dispose(); }, [soma]);
  const esf = geoCache('bio07:esf', () => new THREE.SphereGeometry(1, 24, 16));
  const vesRefs = useRef<(THREE.Mesh | null)[]>([]);
  const somaRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const p = vesiculas.current;
    vesRefs.current.forEach((v, i) => {
      if (!v) return;
      const k = Math.min(1, Math.max(0, p * 1.35 - i * 0.07));
      v.visible = p > 0 && p < 1;
      v.position.set(-0.05 + i * 0.045 - (i % 2) * 0.03, -0.205 - 0.095 * k, 0.1);
    });
    if (somaRef.current) {
      const e = excitacion.current;
      soma.color.setRGB(0.85 + 0.15 * e, 0.53 + 0.4 * e, 0.29 + 0.1 * e);
    }
  });
  const S = ESCALA_MEDULA;
  return (
    <group position={CENTRO_MEDULA.toArray() as V3} scale={[S, S, S]}>
      {/* lámina de la ampliación */}
      <mesh geometry={gElipse(1.364, 1.364, 64)} material={fondo} position={[0, 0, -0.05]} />
      <mesh geometry={gAnillo(1.33, 1.33, 1.39, 1.39)} material={m.cromo} position={[0, 0, -0.03]} />
      {/* canal vertebral (hueso), duramadre, sustancia blanca y gris */}
      <mesh geometry={gAnillo(1.03, 0.86, 1.3, 1.1)} material={hueso} position={[0, 0, -0.01]} />
      <mesh geometry={gAnillo(1.0, 0.82, 1.03, 0.86)} material={dura} position={[0, 0, 0]} />
      <mesh geometry={gElipse(1.0, 0.82)} material={sust} position={[0, 0, 0.01]} />
      <mesh geometry={gMariposa()} material={gris} position={[0, 0, 0.02]} />
      <mesh geometry={geoCache('bio07:canal', () => new THREE.CircleGeometry(0.035, 16))} material={m.plastico('#cfd8e0', 0.5)} position={[0, -0.07, 0.03]} />
      {/* ganglio de la raíz dorsal (en la ruta sensitiva) */}
      <mesh geometry={esf} material={m.plastico('#c98f6a', 0.7)} position={[1.05, 0.62, 0.1]} scale={[0.1, 0.1, 0.1]} />
      {/* terminal presináptico de la neurona sensitiva */}
      <mesh geometry={esf} material={m.plastico('#5a9bd4', 0.5)} position={[0.37, -0.15, 0.1]} scale={[0.1, 0.075, 0.07]} />
      {/* motoneurona α: soma + dendritas */}
      <mesh ref={somaRef} geometry={esf} material={soma} position={[0.36, -0.44, 0.1]} scale={[0.16, 0.14, 0.09]} />
      {[[0.55, -0.55, -0.7], [0.5, -0.3, 0.4], [0.2, -0.55, 0.9], [0.45, -0.62, -2.2]].map(([x, y, r], i) => (
        <mesh key={i} geometry={geoCache('bio07:dendrita', () => new THREE.ConeGeometry(0.03, 0.26, 8))} material={soma} position={[x, y, 0.1]} rotation={[0, 0, r]} />
      ))}
      {/* vesículas con neurotransmisor cruzando la hendidura */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} ref={(el) => { vesRefs.current[i] = el; }} geometry={esf} material={m.plastico('#e879b9', 0.4)} scale={[0.026, 0.026, 0.026]} visible={false} />
      ))}
    </group>
  );
}

// ───────────────────────────── nervios con mielina ─────────────────────────────

export interface PropsNervio {
  puntos: THREE.Vector3[];
  /** avance 0–1 del impulso por el nervio (referencia) */
  avance: React.MutableRefObject<number>;
  color: string;
  radio?: number;
}

/** Axón: tubo + vainas de mielina de espesor fijo con nodos de Ranvier + tramo excitado que sigue al impulso. */
export function Nervio({ puntos, avance, color, radio = 0.045 }: PropsNervio) {
  const m = useMateriales();
  const { curva, geo, vainas } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(puntos, false, 'centripetal');
    const g = new THREE.TubeGeometry(c, 140, radio, 8, false);
    const largo = c.getLength();
    const n = Math.max(4, Math.round(largo / 0.5));
    const v: { pos: THREE.Vector3; quat: THREE.Quaternion; l: number }[] = [];
    const eje = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const u0 = (i + 0.07) / n, u1 = (i + 0.93) / n;
      const a = c.getPointAt(u0), b = c.getPointAt(u1);
      const d = b.clone().sub(a);
      v.push({ pos: a.clone().add(b).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(eje, d.clone().normalize()), l: d.length() });
    }
    return { curva: c, geo: g, vainas: v };
  }, [puntos, radio]);
  const exc = useMemo(() => new THREE.TubeGeometry(curva, 140, radio * 1.9, 8, false), [curva, radio]);
  useEffect(() => () => { geo.dispose(); exc.dispose(); }, [geo, exc]);
  const matExc = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ff9f1c', emissiveIntensity: 0.55, roughness: 0.4 }), []);
  useEffect(() => () => { matExc.dispose(); }, [matExc]);
  const total = exc.index ? exc.index.count : 0;
  const segIdx = total / 140; // índices por segmento longitudinal
  const bola = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const p = avance.current;
    const activo = p > 0 && p < 1;
    exc.setDrawRange(0, 0);
    if (activo) {
      const desde = Math.max(0, p - 0.16), hasta = p;
      const s0 = Math.floor(desde * 140) * segIdx, s1 = Math.ceil(hasta * 140) * segIdx;
      exc.setDrawRange(s0, Math.max(0, s1 - s0));
    }
    if (bola.current) {
      bola.current.visible = activo;
      if (activo) bola.current.position.copy(curva.getPointAt(p));
    }
  });
  const gCap = geoCache('bio07:vaina', () => new THREE.CapsuleGeometry(1, 1, 4, 10));
  return (
    <group>
      <mesh geometry={geo} material={m.plastico(color, 0.5)} />
      {vainas.map((v, i) => (
        <mesh key={i} geometry={gCap} material={m.plastico('#f3efe2', 0.55)} position={v.pos} quaternion={v.quat} scale={[radio * 2.3, Math.max(0.01, (v.l - radio * 4.6) / 2), radio * 2.3]} />
      ))}
      <mesh geometry={exc} material={matExc} />
      <mesh ref={bola} visible={false} geometry={geoCache('bio07:bola', () => new THREE.SphereGeometry(1, 16, 12))} material={matExc} scale={[radio * 4.6, radio * 4.6, radio * 4.6]} />
    </group>
  );
}

// ───────────────────────────── monitor de EMG ─────────────────────────────

export const ANCHO_PANTALLA = 5.6, ALTO_PANTALLA = 3.5;
const W = 640, H = 400;

export interface EstadoEMG {
  /** latencia del último ensayo (ms) o null si no hay respuesta / no hay ensayo */
  latencia: number | null;
  hayEnsayo: boolean;
  /** instante del barrido (ms desde el golpe); Infinity = trazo completo */
  barrido: number;
}

/** Ventana temporal del osciloscopio (ms) según la latencia que hay que mostrar. */
export function ventanaEMG(latencia: number | null): number {
  const necesario = (latencia ?? 0) + 18;
  for (const v of [40, 80, 160, 250]) if (necesario <= v) return v;
  return 250;
}

export function dibujarEMG(ctx: Ctx, e: EstadoEMG) {
  const fam = familiaTexto();
  ctx.fillStyle = '#071410'; ctx.fillRect(0, 0, W, H);
  const mx = 78, my = 44, aw = W - mx - 18, ah = H - my - 74;
  const ventana = ventanaEMG(e.latencia);
  const paso = ventana <= 40 ? 5 : ventana <= 80 ? 10 : ventana <= 160 ? 20 : 25;
  // retícula: cuadros mayores cada `paso` ms
  ctx.strokeStyle = 'rgba(120,200,150,0.18)'; ctx.lineWidth = 1;
  for (let t = 0; t <= ventana + 0.01; t += paso) {
    const x = mx + (t / ventana) * aw;
    ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x, my + ah); ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) { const y = my + (i / 4) * ah; ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx + aw, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,200,150,0.5)'; ctx.strokeRect(mx, my, aw, ah);
  ctx.fillStyle = '#9fd9b4'; ctx.font = `600 24px ${FAMILIA_MONO}`; ctx.textAlign = 'center';
  for (let t = 0; t <= ventana + 0.01; t += paso) ctx.fillText(String(t), mx + (t / ventana) * aw, my + ah + 30);
  ctx.textAlign = 'center'; ctx.font = `600 22px ${fam}`;
  ctx.fillText('ms desde el golpe', mx + aw / 2, my + ah + 62); ctx.textAlign = 'left';
  ctx.save(); ctx.font = `600 22px ${fam}`; ctx.translate(30, my + ah / 2 + 78); ctx.rotate(-Math.PI / 2); ctx.fillText('EMG del cuádriceps', 0, 0); ctx.restore();
  ctx.fillStyle = '#9fd9b4'; ctx.font = `600 20px ${fam}`; ctx.fillText('1 mV/div', mx + aw - 100, my - 12);
  const y0 = my + ah / 2;
  // trazo
  if (!e.hayEnsayo) {
    ctx.fillStyle = 'rgba(159,217,180,0.85)'; ctx.font = `500 26px ${fam}`; ctx.textAlign = 'center';
    ctx.fillText('Sin registro: golpea el tendón', mx + aw / 2, y0 - 8); ctx.textAlign = 'left';
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, y0); ctx.lineTo(mx + aw, y0); ctx.stroke();
    return;
  }
  const rnd = azar(77);
  const hasta = Math.min(ventana, e.barrido);
  const señal = (t: number): number => {
    let v = (rnd() - 0.5) * 0.035;                       // ruido de base
    if (t >= 0 && t < 1.4) v += Math.sin(t * 5.2) * Math.exp(-t * 1.6) * 0.55; // artefacto del golpe
    if (e.latencia !== null && t >= e.latencia) {
      const s = t - e.latencia;
      v += Math.sin(s * 1.9) * Math.exp(-s / 5.5) * (1 - Math.exp(-s * 2.2)) * 0.9 + Math.sin(s * 5.3 + 1) * Math.exp(-s / 3.2) * 0.2;
    }
    return v;
  };
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = Math.round(aw);
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * ventana;
    if (t > hasta) break;
    const x = mx + i, y = y0 - señal(t) * (ah / 2) * 0.95;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // cursor de barrido mientras corre el registro
  if (e.barrido < ventana) {
    const x = mx + (e.barrido / ventana) * aw;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x, my + ah); ctx.stroke();
  }
  // marca del golpe
  ctx.fillStyle = '#fbbf24'; ctx.font = `600 22px ${fam}`; ctx.fillText('golpe', mx + 6, my + 24);
  if (e.latencia === null && e.barrido >= ventana) {
    ctx.fillStyle = 'rgba(251,191,36,0.95)'; ctx.font = `600 26px ${fam}`; ctx.textAlign = 'center';
    ctx.fillText('sin respuesta muscular', mx + aw / 2, my + 56); ctx.textAlign = 'left';
  }
}

/** Monitor sobre pie rodante; la pantalla se redibuja sólo cuando cambia el barrido. */
export function MonitorEMG({ leer }: { leer: () => EstadoEMG }) {
  const m = useMateriales();
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const t = texturaDeLienzo(crearLienzo(W, H));
    return t;
  }, []);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  const ultimo = useRef('');
  useFrame(() => {
    if (!tex) return;
    const e = leer();
    const clave = `${e.hayEnsayo}|${e.latencia}|${Math.round(Math.min(e.barrido, 1e4) * 6)}`;
    if (clave === ultimo.current) return;
    ultimo.current = clave;
    const c = tex.image as HTMLCanvasElement;
    dibujarEMG(c.getContext('2d')!, e);
    tex.needsUpdate = true;
  });
  return (
    <group position={[8.5, 0, 0]}>
      <mesh geometry={geoCache('bio07:basem', () => new THREE.CylinderGeometry(1.1, 1.2, 0.16, 32))} material={m.carcasaOscura} position={[0, 0.08, 0]} castShadow />
      <mesh geometry={geoCache('bio07:polm', () => new THREE.CylinderGeometry(0.08, 0.08, 1, 12))} material={m.acero} position={[0, 3.7, -0.1]} scale={[1, 7.4, 1]} castShadow />
      <mesh geometry={cajaRedondeada(6.0, 3.9, 0.4, 0.14)} material={m.carcasaOscura} position={[0, 9.4, 0]} castShadow />
      <mesh position={[0, 9.4, 0.205]} material={mat}><planeGeometry args={[ANCHO_PANTALLA, ALTO_PANTALLA]} /></mesh>
    </group>
  );
}
