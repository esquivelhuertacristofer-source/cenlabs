'use client';
/**
 * fis08/piezas.tsx — piezas propias del banco de electrónica (LED + resistor).
 *
 * ESCALA: el protoboard, el LED y el resistor se modelan en MILÍMETROS REALES dentro
 * de un grupo con escala S (u por mm) para que se vean desde la cámara que enmarca
 * también la fuente y el multímetro (agrandados ×6 respecto al kit: 1 mm = 0,06 u).
 * Todo lo que va "dentro del protoboard" usa coordenadas de mm con el origen en el
 * centro de la cara superior (y = 0). La distancia entre agujeros es de 2,54 mm.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  cajaRedondeada, cilindro, tornear, tuboPolilinea, geoCache, esfera,
  useMateriales, useTexturaLienzo, familiaTexto,
} from '../_kit';

export const S = 0.06;                 // u por mm
export const PASO = 2.54;              // mm entre agujeros
export const ANCHO = 83, FONDO = 55, ESPESOR = 8.5;   // mm: protoboard de 400 puntos (30 columnas)
export const COLUMNAS = 30;

/** columnas 1..30 → x (mm) */
export const colX = (c: number) => (c - 15.5) * PASO;
/** filas a–e (zona trasera, a = más atrás) y f–j (delantera) → z (mm) */
const FILAS: Record<string, number> = { a: -13.97, b: -11.43, c: -8.89, d: -6.35, e: -3.81, f: 3.81, g: 6.35, h: 8.89, i: 11.43, j: 13.97 };
export const filaZ = (f: string) => FILAS[f];

export { bandasResistor, bandasConNombre } from './codigoColores';
import { bandasResistor } from './codigoColores';

// ───────────────────────────── protoboard ─────────────────────────────

/** Protoboard de 400 puntos: cuerpo de ABS blanco y cara superior impresa con los agujeros. Origen: centro de la cara superior; unidades en mm (el padre escala). */
export function Protoboard() {
  const m = useMateriales();
  const tex = useTexturaLienzo(1660, 1100, (ctx, W) => {
    const fam = familiaTexto();
    const k = W / ANCHO;               // px por mm
    const X = (mm: number) => (mm + ANCHO / 2) * k, Z = (mm: number) => (mm + FONDO / 2) * k;
    ctx.fillStyle = '#f1efe8'; ctx.fillRect(0, 0, W, FONDO * k);
    // canal central
    ctx.fillStyle = '#d3d0c4'; ctx.fillRect(0, Z(-2.2), W, 4.4 * k);
    // guías de los rieles
    const riel = (z: number, color: string) => { ctx.strokeStyle = color; ctx.lineWidth = 0.5 * k; ctx.beginPath(); ctx.moveTo(X(-37.5), Z(z)); ctx.lineTo(X(37.5), Z(z)); ctx.stroke(); };
    riel(-26.0, '#c62828'); riel(-20.4, '#1565c0'); riel(20.4, '#c62828'); riel(26.0, '#1565c0');
    const agujero = (x: number, z: number) => {
      ctx.fillStyle = '#1f2326'; ctx.fillRect(X(x) - 0.55 * k, Z(z) - 0.55 * k, 1.1 * k, 1.1 * k);
    };
    // zonas de terminales
    for (let c = 1; c <= COLUMNAS; c++) for (const f of Object.keys(FILAS)) agujero(colX(c), FILAS[f]);
    // rieles: grupos de 5 agujeros separados por un hueco
    for (const z of [-24.13, -21.59, 21.59, 24.13]) {
      for (let g = 0; g < 5; g++) for (let i = 0; i < 5; i++) agujero(-35.56 + (g * 6 + i) * PASO, z);
    }
    // rotulado
    ctx.fillStyle = '#2b2f33'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.font = `600 ${1.55 * k}px ${fam}`;
    for (let c = 1; c <= COLUMNAS; c++) if (c === 1 || c % 5 === 0) {
      ctx.fillText(String(c), X(colX(c)), Z(-17.1)); ctx.fillText(String(c), X(colX(c)), Z(17.1));
    }
    ctx.font = `600 ${1.7 * k}px ${fam}`;
    'abcdefghij'.split('').forEach((f) => ctx.fillText(f, X(-39.3), Z(FILAS[f])));
    ctx.font = `700 ${2.2 * k}px ${fam}`;
    ctx.fillStyle = '#c62828'; ctx.fillText('+', X(-38.4), Z(-26.4)); ctx.fillText('+', X(-38.4), Z(21.0));
    ctx.fillStyle = '#1565c0'; ctx.fillText('−', X(-38.4), Z(-20.6)); ctx.fillText('−', X(-38.4), Z(26.2));
  }, []);
  const matTop = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }), [tex]);
  useEffect(() => () => matTop.dispose(), [matTop]);
  return (
    <group>
      <mesh geometry={cajaRedondeada(ANCHO, ESPESOR, FONDO, 0.9, 2)} material={m.pintura('#ece9df')} position={[0, -ESPESOR / 2 - 0.02, 0]} castShadow receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={matTop} receiveShadow>
        <planeGeometry args={[ANCHO - 0.6, FONDO - 0.6]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── LED 5 mm ─────────────────────────────

/**
 * LED rojo difuso de 5 mm. Origen: punto medio entre las patas a la altura de la cara superior del
 * protoboard (coordenadas mm). Ánodo (pata larga) en x = −1,27; cátodo (pata corta) en x = +1,27.
 * `brillo` ∈ [0,1]; `roto` = casquillo ennegrecido y sin luz.
 */
export function LedRojo5mm({ brillo = 0, roto = false }: { brillo?: number; roto?: boolean }) {
  const m = useMateriales();
  const Y0 = 3;   // la base del casquillo, sobre el protoboard
  const geoCuerpo = useMemo(() => geoCache('led5:cuerpo', () => {
    const r = 2.5, rb = 2.9;
    const p: [number, number][] = [[0.001, 0], [rb, 0], [rb, 0.9], [r, 1.0], [r, 5.6]];
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * (Math.PI / 2); p.push([Math.cos(a) * r, 5.6 + Math.sin(a) * r * 0.95]); }
    p[p.length - 1] = [0.001, 5.6 + r * 0.95];
    return tornear(p, 40);
  }), []);
  const mat = useMemo(() => {
    const k = roto ? 0 : brillo;
    return new THREE.MeshPhysicalMaterial({
      color: roto ? '#2a1d1b' : '#c91f25', roughness: roto ? 0.8 : 0.12, transparent: !roto, opacity: roto ? 1 : 0.9,
      emissive: new THREE.Color('#ff2a1a'), emissiveIntensity: roto ? 0 : 0.05 + 1.9 * k, clearcoat: 0.6,
    });
  }, [brillo, roto]);
  useEffect(() => () => mat.dispose(), [mat]);
  const pata = (x: number, largo: number) => <mesh geometry={cilindro(0.3, 0.3, largo, 6)} material={m.cromo} position={[x, Y0 - largo / 2 + 0.5, 0]} castShadow />;
  return (
    <group>
      {pata(-1.27, 12)}{pata(1.27, 9)}
      <group position={[0, Y0, 0]}>
        <mesh geometry={geoCuerpo} material={mat} castShadow />
        {/* soporte interior: poste con el yunque y el chip */}
        <mesh geometry={cilindro(0.35, 0.35, 3.2, 8)} material={roto ? m.plastico('#1a1a1a') : m.cromo} position={[-1.27, 2.9, 0]} />
        <mesh geometry={cilindro(0.5, 0.9, 1.5, 12)} material={roto ? m.plastico('#1a1a1a') : m.cromo} position={[1.27, 2.2, 0]} />
        {!roto && <mesh geometry={esfera(0.28, 8)} material={m.emisor('#ff6b4a', 0.3 + 2.2 * brillo)} position={[1.27, 3.0, 0]} />}
      </group>
    </group>
  );
}

// ───────────────────────────── resistor axial ─────────────────────────────

/**
 * Resistor axial de película metálica, 1/4 W, ±1 %: cuerpo de cerámica azul claro con 5 bandas
 * correctas para `ohm`. Origen: centro del cuerpo entre los agujeros (separación 10,16 mm), mm.
 */
export function ResistorAxial({ ohm }: { ohm: number }) {
  const m = useMateriales();
  const geoCuerpo = useMemo(() => geoCache('res:cuerpo', () => {
    const L = 3.3;
    const p: [number, number][] = [[0.001, -L], [0.9, -L], [1.25, -L + 0.5], [1.05, -L + 1.3], [1.05, L - 1.3], [1.25, L - 0.5], [0.9, L], [0.001, L]];
    const g = tornear(p, 28);
    g.rotateZ(Math.PI / 2);
    return g;
  }), []);
  const bandas = bandasResistor(ohm);
  const mats = useMemo(() => bandas.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 })), [ohm]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => mats.forEach((x) => x.dispose()), [mats]);
  const xs = [-2.55, -1.45, -0.35, 0.85, 2.55];
  const geoPata = useMemo(() => geoCache('res:pata', () => {
    const a = 5.08, pts: number[] = [];
    pts.push(-3.2, 0, 0, -3.8, 0, 0, -a + 0.9, 0, 0);
    for (let i = 1; i <= 6; i++) { const t = (i / 6) * (Math.PI / 2); pts.push(-a + 0.9 * (1 - Math.sin(t)), -0.9 * (1 - Math.cos(t)), 0); }
    pts.push(-a, -8, 0);
    return tuboPolilinea(new Float32Array(pts), 0.32, 6, true);
  }), []);
  return (
    <group position={[0, 1.25, 0]}>
      <mesh geometry={geoCuerpo} material={m.plastico('#7fb3d5', 0.5)} castShadow />
      {xs.map((x, i) => (
        <mesh key={i} geometry={cilindro(1.08, 1.08, i === 4 ? 0.7 : 0.9, 20)} material={mats[i]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]} />
      ))}
      <mesh geometry={geoPata} material={m.cromo} castShadow />
      <mesh geometry={geoPata} material={m.cromo} scale={[-1, 1, 1]} castShadow />
    </group>
  );
}

// ───────────────────────────── puente de alambre ─────────────────────────────

/** Puente de alambre rígido en U entre dos agujeros de una misma fila. Origen: punto medio. `largo` = distancia en mm. */
export function PuenteAlambre({ largo, color = '#e0a800' }: { largo: number; color?: string }) {
  const m = useMateriales();
  const geo = useMemo(() => {
    const h = 4.0, a = largo / 2, pts: number[] = [-a, -6, 0, -a, h - 1, 0];
    for (let i = 1; i <= 6; i++) { const t = (i / 6) * (Math.PI / 2); pts.push(-a + 1 - Math.cos(t), h - 1 + Math.sin(t), 0); }
    pts.push(a - 1, h, 0);
    for (let i = 1; i <= 6; i++) { const t = (i / 6) * (Math.PI / 2); pts.push(a - 1 + Math.sin(t), h - (1 - Math.cos(t)), 0); }
    pts.push(a, -6, 0);
    return tuboPolilinea(new Float32Array(pts), 0.32, 6, true);
  }, [largo]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m.plastico(color, 0.35)} castShadow />;
}

/** Área de clic transparente (para piezas diminutas). */
export function ZonaClic({ radio = 0.3, position }: { radio?: number; position?: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radio, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}
