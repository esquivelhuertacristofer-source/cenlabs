'use client';
/**
 * bio09/piezas.tsx — banco de la digestión enzimática (1 u = 1 dm).
 *
 * Baño termostático de acrílico a 37 °C con una gradilla: el tubo CONTROL (sustrato +
 * indicador, sin enzima) y el tubo CON ENZIMA; medidor de pH con su sonda y el frasco de
 * la enzima elegida. El indicador muestra lo que un reactivo real mostraría del sustrato
 * que QUEDA sin digerir:
 *   · almidón  → Lugol: azul-negro con almidón, ámbar sin él;
 *   · proteína → Biuret: violeta con enlaces peptídicos, azul sin ellos;
 *   · lípidos  → fenolftaleína + Na₂CO₃: rosa; los ácidos grasos liberados la decoloran.
 * Sin sales biliares la grasa forma una capa de aceite sobre el agua; con ellas queda
 * emulsionada (lechosa). Una enzima desnaturalizada precipita en el fondo del tubo.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import {
  useMateriales, geoCache, cajaRedondeada, tornear, crearLienzo, texturaDeLienzo, familiaTexto, FAMILIA_MONO,
  TuboEnsayo, Cable, defTubo, alturaSuperficie, radioEnAltura, mm, type P2,
} from '../_kit';

type V3 = [number, number, number];
type GroupProps = ThreeElements['group'];
export type Macro = 'almidon' | 'proteina' | 'lipido';

// ───────────────────────────── color del indicador ─────────────────────────────

const mezcla = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();
/** Color del reactivo según la fracción de sustrato hidrolizada (cuantizada a 0,1 para compartir materiales). */
export function colorIndicador(macro: Macro, hidrolisis: number): string {
  const h = Math.round(Math.min(1, Math.max(0, hidrolisis)) * 10) / 10;
  if (macro === 'almidon') return mezcla('#3a4cb4', '#e3b44a', h);       // Lugol
  if (macro === 'proteina') return mezcla('#9a5fcb', '#4a9ae8', h);      // Biuret
  return mezcla('#f06cb4', '#f6f2e8', h);                                // fenolftaleína
}
export const NOMBRE_INDICADOR: Record<Macro, string> = { almidon: 'Lugol', proteina: 'Biuret', lipido: 'Fenolftaleína' };

const TUBO = '18x180';
const VOL_ML = 14;

export interface PropsTubo {
  macro: Macro;
  hidrolisis: number;
  bilis: boolean;
  desnaturalizada?: boolean;
  /** vibra mientras se incuba */
  agitando?: React.MutableRefObject<boolean>;
}

/** Tubo de ensayo con el contenido y su indicador. Origen en el centro de la base. */
export function TuboMuestra({ macro, hidrolisis, bilis, desnaturalizada = false, agitando, ...g }: PropsTubo & GroupProps) {
  const def = defTubo(TUBO);
  const acuoso = colorIndicador(macro, hidrolisis);
  const emulsion = macro === 'lipido' && bilis;
  const color = emulsion ? mezcla(acuoso, '#f6f1e6', 0.62) : acuoso;
  const hSup = alturaSuperficie(def, VOL_ML);
  const rSup = radioEnAltura(def.interior, hSup) * 0.96;
  const grupo = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!grupo.current) return;
    const on = agitando?.current;
    grupo.current.rotation.z = on ? Math.sin(s.clock.elapsedTime * 22) * 0.012 : 0;
  });
  const cil = geoCache('bio09:capaAceite', () => new THREE.CylinderGeometry(1, 1, 1, 28));
  const matAceite = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8c24a', roughness: 0.3 }), []);
  const matPrecipitado = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.85 }), []);
  useEffect(() => () => { matAceite.dispose(); matPrecipitado.dispose(); }, [matAceite, matPrecipitado]);
  const flocs = useMemo(() => Array.from({ length: 11 }, (_, i) => ({
    x: Math.sin(i * 2.4) * 0.05, y: 0.05 + (i % 4) * 0.035, z: Math.cos(i * 1.7) * 0.05, r: 0.022 + (i % 3) * 0.008,
  })), []);
  return (
    <group {...g}>
      <group ref={grupo}>
        <TuboEnsayo tamano={TUBO} liquido={{ volumenML: VOL_ML, color }} />
        {macro === 'lipido' && !bilis && (
          <mesh geometry={cil} material={matAceite} position={[0, hSup + 0.07, 0]} scale={[rSup, 0.14, rSup]} />
        )}
        {desnaturalizada && flocs.map((f, i) => (
          <mesh key={i} geometry={geoCache('bio09:floc', () => new THREE.SphereGeometry(1, 12, 8))} material={matPrecipitado} position={[f.x, f.y, f.z]} scale={[f.r, f.r * 0.8, f.r]} />
        ))}
      </group>
    </group>
  );
}

// ───────────────────────────── baño termostático ─────────────────────────────

const AN = 1.7, AL = 1.45, FO = 1.25;

function texPantalla(texto: string, sub: string) {
  const c = crearLienzo(256, 96);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0c1a14'; ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = '#5cff9d'; ctx.font = `700 52px ${FAMILIA_MONO}`; ctx.textAlign = 'center'; ctx.fillText(texto, 128, 58);
  ctx.fillStyle = '#9fd9b4'; ctx.font = `600 20px ${familiaTexto()}`; ctx.fillText(sub, 128, 86);
  return texturaDeLienzo(c, { mipmaps: false });
}

/** Pantallita de texto (termostato y medidor de pH). */
export function Pantalla({ texto, sub, ancho = 0.8, alto = 0.3, ...g }: { texto: string; sub: string; ancho?: number; alto?: number } & GroupProps) {
  const tex = useMemo(() => (typeof document === 'undefined' ? null : texPantalla(texto, sub)), [texto, sub]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  return <group {...g}><mesh material={mat}><planeGeometry args={[ancho, alto]} /></mesh></group>;
}

export function BanoTermostatico({ agitando, children, ...g }: { agitando: React.MutableRefObject<boolean>; children?: React.ReactNode } & GroupProps) {
  const m = useMateriales();
  const acrilico = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e3f1f7', roughness: 0.08, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }), []);
  const agua = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#9ed7f0', roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }), []);
  useEffect(() => () => { acrilico.dispose(); agua.dispose(); }, [acrilico, agua]);
  const burb = useRef<(THREE.Mesh | null)[]>([]);
  const geoB = geoCache('bio09:burbuja', () => new THREE.SphereGeometry(1, 10, 8));
  const semillas = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: Math.sin(i * 12.9) * 0.6, z: Math.cos(i * 7.3) * 0.4, f: 0.4 + (i % 5) * 0.12, o: i * 0.37 })), []);
  const matB = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }), []);
  useEffect(() => () => { matB.dispose(); }, [matB]);
  useFrame((s) => {
    const on = agitando.current;
    burb.current.forEach((b, i) => {
      if (!b) return;
      b.visible = on;
      if (!on) return;
      const q = semillas[i];
      const u = ((s.clock.elapsedTime * q.f + q.o) % 1);
      b.position.set(q.x, 0.2 + u * 1.0, q.z);
      b.scale.setScalar(0.018 + 0.022 * Math.sin(u * Math.PI));
    });
  });
  return (
    <group {...g}>
      {/* zócalo de acero con el panel de control */}
      <mesh geometry={cajaRedondeada(AN + 0.1, 0.34, FO + 0.1, 0.05)} material={m.acero} position={[0, 0.17, 0]} castShadow receiveShadow />
      <Pantalla texto="37.0°C" sub="BAÑO · 30 min" ancho={0.78} alto={0.24} position={[-0.38, 0.17, FO / 2 + 0.056]} />
      <mesh geometry={geoCache('bio09:perilla', () => new THREE.CylinderGeometry(0.08, 0.08, 0.06, 20))} material={m.carcasaOscura} position={[0.3, 0.17, FO / 2 + 0.06]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geoCache('bio09:led', () => new THREE.CircleGeometry(0.03, 12))} material={m.emisor('#ff9f1c', 1.4)} position={[0.6, 0.17, FO / 2 + 0.056]} />
      {/* paredes de acrílico y agua */}
      {[[0, AL / 2 + 0.34, FO / 2, AN, AL, 0.03], [0, AL / 2 + 0.34, -FO / 2, AN, AL, 0.03]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} material={acrilico} position={[x, y, z] as V3}><boxGeometry args={[w, h, d]} /></mesh>
      ))}
      {[-1, 1].map((s) => <mesh key={s} material={acrilico} position={[s * AN / 2, AL / 2 + 0.34, 0]}><boxGeometry args={[0.03, AL, FO]} /></mesh>)}
      <mesh material={agua} position={[0, 0.34 + 0.55, 0]}><boxGeometry args={[AN - 0.06, 1.1, FO - 0.06]} /></mesh>
      {/* aros de aluminio en el borde */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={m.aluminio} position={[0, AL + 0.34, s * FO / 2]}><boxGeometry args={[AN + 0.04, 0.05, 0.05]} /></mesh>
          <mesh material={m.aluminio} position={[s * AN / 2, AL + 0.34, 0]}><boxGeometry args={[0.05, 0.05, FO]} /></mesh>
        </group>
      ))}
      {semillas.map((_, i) => <mesh key={i} ref={(el) => { burb.current[i] = el; }} geometry={geoB} material={matB} visible={false} position={[0, 0.5, 0]} />)}
      {children}
    </group>
  );
}

/** Soporte de los tubos: un puente sobre el borde del baño con dos aros; los tubos se apoyan en el fondo. */
export function GradillaDelBano({ children }: { children?: React.ReactNode }) {
  const m = useMateriales();
  const yAro = 0.34 + AL - 0.02;
  return (
    <group position={[0, 0.34 + 0.0, 0]}>
      <mesh material={m.aluminio} position={[0, yAro - 0.34, -0.2]}><boxGeometry args={[AN + 0.1, 0.03, 0.03]} /></mesh>
      {[-0.135, 0.135].map((x) => (
        <group key={x}>
          <mesh material={m.aluminio} position={[x, yAro - 0.34, -0.1]}><boxGeometry args={[0.03, 0.03, 0.2]} /></mesh>
          <mesh geometry={geoCache('bio09:aro', () => new THREE.TorusGeometry(0.108, 0.014, 8, 24))} material={m.aluminio} position={[x, yAro - 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
      {children}
    </group>
  );
}

// ───────────────────────────── medidor de pH y frasco de enzima ─────────────────────────────

/** Medidor de pH de sobremesa con sonda hacia el tubo de ensayo. */
export function MedidorPH({ ph, sonda, ...g }: { ph: number; sonda: V3 } & GroupProps) {
  const m = useMateriales();
  const color = useMemo(() => {
    const c = new THREE.Color();
    c.setHSL(Math.min(0.78, Math.max(0, (ph - 1) / 11 * 0.78)), 0.85, 0.5); // 1 rojo … 12 violeta
    return '#' + c.getHexString();
  }, [ph]);
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(0.7, 0.95, 0.5, 0.07)} material={m.carcasaClara} position={[0, 0.475, 0]} castShadow />
      <Pantalla texto={`pH ${ph.toFixed(1)}`} sub="medidor de pH" ancho={0.58} alto={0.22} position={[0, 0.74, 0.256]} />
      <mesh position={[0, 0.5, 0.256]} material={m.plastico(color, 0.4)}><planeGeometry args={[0.46, 0.07]} /></mesh>
      <mesh geometry={geoCache('bio09:bot', () => new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16))} material={m.carcasaOscura} position={[-0.15, 0.25, 0.26]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geoCache('bio09:bot', () => new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16))} material={m.carcasaOscura} position={[0.15, 0.25, 0.26]} rotation={[Math.PI / 2, 0, 0]} />
      <Cable desde={[0.2, 0.9, 0.0]} hasta={sonda} holgura={0.5} color="#2f3338" grosor={0.014} />
    </group>
  );
}

/** Sonda de pH metida en el tubo (vidrio con bulbo). */
export function SondaPH({ ...g }: GroupProps) {
  const m = useMateriales();
  return (
    <group {...g}>
      <mesh geometry={geoCache('bio09:sonda', () => new THREE.CylinderGeometry(0.024, 0.024, 1.9, 12))} material={m.plastico('#e9edef', 0.4)} position={[0, 0.95, 0]} />
      <mesh geometry={geoCache('bio09:sondaB', () => new THREE.SphereGeometry(0.045, 12, 10))} material={m.plastico('#d6e4ea', 0.2)} position={[0, 0.0, 0]} />
    </group>
  );
}

const perfilFrasco = (): P2[] => [[0, 0], [0.2, 0.01], [0.24, 0.05], [0.24, 0.5], [0.2, 0.62], [0.09, 0.7], [0.09, 0.78], [0.12, 0.8], [0.12, 0.85], [0.0, 0.85]];

/** Frasco con la enzima elegida (rotulado). */
export function FrascoEnzima({ nombre, ...g }: { nombre: string } & GroupProps) {
  const m = useMateriales();
  const geo = geoCache('bio09:frasco', () => tornear(perfilFrasco(), 28));
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = crearLienzo(256, 128);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fbfaf5'; ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#1b3a4b'; ctx.fillRect(0, 0, 256, 22);
    ctx.fillStyle = '#10212b'; ctx.textAlign = 'center'; ctx.font = `700 25px ${familiaTexto()}`;
    const partes = nombre.split(' ');
    ctx.fillText(partes[0], 128, 62);
    ctx.font = `500 20px ${familiaTexto()}`;
    if (partes[1]) ctx.fillText(partes.slice(1).join(' '), 128, 90);
    ctx.font = `600 16px ${familiaTexto()}`; ctx.fillText('enzima', 128, 116);
    return texturaDeLienzo(c, { mipmaps: false });
  }, [nombre]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex]);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  return (
    <group {...g}>
      <mesh geometry={geo} material={m.plastico('#a86a2a', 0.2)} castShadow />
      <mesh position={[0, 0.3, 0.2415]} material={mat}><planeGeometry args={[0.42, 0.25]} /></mesh>
      <mesh geometry={geoCache('bio09:gotero', () => new THREE.CylinderGeometry(0.07, 0.1, 0.16, 16))} material={m.goma} position={[0, 0.93, 0]} />
    </group>
  );
}

export { mm };
