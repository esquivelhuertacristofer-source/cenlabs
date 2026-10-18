"use client";
/**
 * qmi07/piezas.tsx — las piezas del montaje de titulación, a escala real
 * (1 u = 10 cm; la cubierta de la mesa en y = 0; +Z mira al alumno).
 *
 *  · MESA de resina epoxi negra con manchas MUY suaves de baja frecuencia (nada de grano).
 *  · BASE DEL SOPORTE (placa de fundición con pintura en polvo satinada) y su varilla.
 *  · AGITADOR MAGNÉTICO de 15 × 15 cm: carcasa de ABS, plato cerámico blanco, mando de
 *    velocidad que gira con las rpm y piloto verde (lo único que emite luz).
 *  · ELECTRODO COMBINADO de pH: cuerpo de epoxi, unión de cerámica, bulbo de vidrio.
 *  · pH-METRO ANALÓGICO de banco: esfera con escala pH 0–14 y mV, espejo antiparalaje,
 *    aguja de bobina móvil amortiguada (segundo orden), mandos y entrada BNC. La cifra
 *    exacta va en el dock (DOM); en 3D sólo la aguja, como en el instrumento real.
 *  · FRASCOS GOTEROS de los tres indicadores, con la disolución madre de su color.
 *  · LÍQUIDO DEL MATRAZ: material propio cuyo sombreador hace Beer–Lambert por píxel —
 *    recorre la cuerda del rayo dentro del líquido (intersección exacta con el tronco de
 *    cono del matraz) y suma la integral de línea de cada estela gaussiana.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import {
  cajaRedondeada, cilindro, esfera, tornear, extruir, formaRectRedondeado, toro,
  crearLienzo, texturaDeLienzo, familiaTexto, useVersionFuentes, useMateriales, Liquido, type Calidad, type P2,
} from '../_kit';
import { ERLEN, MAX_MANCHAS } from './reloj';

type GroupProps = ThreeElements['group'];
export type V3 = [number, number, number];

// ───────────────────────────── cotas del montaje ─────────────────────────────

/** Medidas de escena (u). El matraz está en el origen (x, z) sobre el agitador. */
export const COTAS = {
  base: { x: 0.1, z: -0.62, ancho: 1.9, fondo: 2.95, alto: 0.1 },
  agitador: { lado: 1.5, alto: 0.5, radioPlato: 0.62 },
  /** el electrodo: punta del bulbo y punto por el que cruza la boca del matraz (locales del matraz) */
  electrodo: { bulbo: [0.13, 0.07, -0.16] as V3, boca: [0.07, ERLEN.altura, -0.05] as V3, largo: 1.78, radio: 0.06 },
  phmetro: { pos: [2.15, 0, -0.3] as V3, giro: -0.5, ancho: 1.6, alto: 0.78, fondo: 1.25 },
  goteros: [[-1.3, 0, -0.95], [-1.62, 0, -0.62], [-1.28, 0, -0.42]] as V3[],
};
/** y de la base del matraz (sobre la placa del soporte y el agitador). */
export const Y_MATRAZ = COTAS.base.alto + COTAS.agitador.alto;

/**
 * Brazo de una nuez desde la varilla hasta un punto: giro (rad, alrededor de Y) y largo de
 * la pinza para que el centro del agarre caiga en (dx, dz) desde la varilla. El canal del
 * brazo está desplazado `dxCanal` en X local (NUEZ_DX del kit).
 */
export function brazoHacia(dx: number, dz: number, dxCanal: number): { giro: number; largo: number } {
  const d = Math.hypot(dx, dz);
  const largo = Math.sqrt(Math.max(1e-6, d * d - dxCanal * dxCanal));
  const giro = Math.atan2(dx, dz) - Math.atan2(dxCanal, largo);
  return { giro, largo };
}

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsQ7 {
  mesa: THREE.MeshPhysicalMaterial;
  pinturaBase: THREE.MeshPhysicalMaterial;
  absClaro: THREE.MeshPhysicalMaterial;
  placa: THREE.MeshPhysicalMaterial;
  inox: THREE.MeshPhysicalMaterial;
  mando: THREE.MeshPhysicalMaterial;
  led: THREE.MeshStandardMaterial;
  epoxi: THREE.MeshPhysicalMaterial;
  ceramica: THREE.MeshStandardMaterial;
  bulbo: THREE.MeshPhysicalMaterial;
  carcasaMedidor: THREE.MeshPhysicalMaterial;
  frente: THREE.MeshPhysicalMaterial;
  cromo: THREE.MeshStandardMaterial;
  aguja: THREE.MeshStandardMaterial;
  gota: THREE.MeshPhysicalMaterial;
  ptfe: THREE.MeshPhysicalMaterial;
  goma: THREE.MeshStandardMaterial;
  tapa: (color: string) => THREE.MeshPhysicalMaterial;
}

function texturasMesa(calidad: Calidad) {
  if (typeof document === 'undefined') return null;
  const S = calidad === 'alta' ? 512 : 256;
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#16191c'; c.fillRect(0, 0, S, S);
  o.fillStyle = `rgb(0, ${Math.round(0.5 * 255)}, 0)`; o.fillRect(0, 0, S, S);
  let sem = 7177;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let i = 0; i < 14; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.18 + rnd() * 0.3);
    const claro = rnd() > 0.5;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, claro ? 'rgba(50,56,62,0.3)' : 'rgba(12,14,16,0.3)'); g.addColorStop(1, 'rgba(30,35,40,0)');
      c.fillStyle = g; c.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      const h = o.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      const v = Math.round((claro ? 0.42 : 0.58) * 255);
      h.addColorStop(0, `rgba(0,${v},0,0.45)`); h.addColorStop(1, `rgba(0,${v},0,0)`);
      o.fillStyle = h; o.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
  const rep: [number, number] = [2, 1.2];
  return { mapa: texturaDeLienzo(col, { repetir: rep }), rug: texturaDeLienzo(rug, { srgb: false, repetir: rep }) };
}

export function useMatsQ7(calidad: Calidad): MatsQ7 {
  const tex = useMemo(() => texturasMesa(calidad), [calidad]);
  const tapas = useMemo(() => new Map<string, THREE.MeshPhysicalMaterial>(), [calidad]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = useMemo<MatsQ7>(() => {
    const alta = calidad === 'alta';
    return {
      mesa: new THREE.MeshPhysicalMaterial({
        color: '#ffffff', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, roughness: 1, metalness: 0,
        clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.42, envMapIntensity: 0.45, name: 'q7-mesa',
      }),
      // pintura en polvo gris grafito, satinada (sin martillado)
      pinturaBase: new THREE.MeshPhysicalMaterial({ color: '#2a323b', metalness: 0.25, roughness: 0.5, clearcoat: alta ? 0.3 : 0, clearcoatRoughness: 0.45, name: 'q7-pintura' }),
      // carcasa del agitador en ABS grafito: el blanco queda para el plato (fondo del color)
      absClaro: new THREE.MeshPhysicalMaterial({ color: '#4d565f', metalness: 0, roughness: 0.46, clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.45, name: 'q7-abs' }),
      // plato de vitrocerámica blanca (como en los agitadores de placa cerámica): el color del matraz se lee sobre blanco
      placa: new THREE.MeshPhysicalMaterial({ color: '#e2e0d9', metalness: 0, roughness: 0.22, clearcoat: alta ? 0.7 : 0, clearcoatRoughness: 0.12, name: 'q7-placa' }),
      inox: new THREE.MeshPhysicalMaterial({ color: '#c8ccd0', metalness: 1, roughness: 0.3, name: 'q7-inox' }),
      mando: new THREE.MeshPhysicalMaterial({ color: '#1b1f24', metalness: 0, roughness: 0.38, clearcoat: alta ? 0.5 : 0, name: 'q7-mando' }),
      led: new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#3dff7a', emissiveIntensity: 2.4, roughness: 0.4, name: 'q7-led' }),
      // epoxi azul noche del cuerpo del electrodo
      epoxi: new THREE.MeshPhysicalMaterial({ color: '#1d2f4a', metalness: 0, roughness: 0.32, clearcoat: alta ? 0.6 : 0, clearcoatRoughness: 0.25, name: 'q7-epoxi' }),
      ceramica: new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 0.8, name: 'q7-ceramica' }),
      // bulbo de vidrio sensible: lechoso, con brillo (opaco a la transmisión: se ve dentro del matraz)
      bulbo: new THREE.MeshPhysicalMaterial({ color: '#d9e6ea', metalness: 0, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, sheen: alta ? 0.5 : 0, sheenColor: new THREE.Color('#ffffff'), name: 'q7-bulbo' }),
      // esmalte gris azulado de instrumento clásico
      carcasaMedidor: new THREE.MeshPhysicalMaterial({ color: '#3b4a58', metalness: 0.15, roughness: 0.42, clearcoat: alta ? 0.45 : 0, clearcoatRoughness: 0.3, name: 'q7-carcasa' }),
      frente: new THREE.MeshPhysicalMaterial({ color: '#1a1f25', metalness: 0, roughness: 0.5, clearcoat: alta ? 0.3 : 0, name: 'q7-frente' }),
      cromo: new THREE.MeshStandardMaterial({ color: '#dfe3e6', metalness: 1, roughness: 0.16, name: 'q7-cromo' }),
      aguja: new THREE.MeshStandardMaterial({ color: '#141619', metalness: 0.2, roughness: 0.4, name: 'q7-aguja' }),
      // gota de disolución acuosa: perla brillante (opaca para la pasada de transmisión)
      gota: new THREE.MeshPhysicalMaterial({ color: '#cfe3ec', metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8, name: 'q7-gota' }),
      ptfe: new THREE.MeshPhysicalMaterial({ color: '#f4f4f1', metalness: 0, roughness: 0.4, sheen: alta ? 0.4 : 0, sheenColor: new THREE.Color('#ffffff'), name: 'q7-ptfe' }),
      goma: new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.85, metalness: 0, name: 'q7-goma' }),
      tapa(color: string) {
        let x = tapas.get(color);
        if (!x) { x = new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.4, clearcoat: alta ? 0.4 : 0, name: 'q7-tapa' }); tapas.set(color, x); }
        return x;
      },
    };
  }, [calidad, tex, tapas]);
  useEffect(() => () => {
    Object.values(m).forEach((x) => { if (x instanceof THREE.Material) x.dispose(); });
    tapas.forEach((x) => x.dispose()); tapas.clear();
    tex?.mapa.dispose(); tex?.rug.dispose();
  }, [m, tex, tapas]);
  return m;
}

// ───────────────────────────── mesa, soporte y agitador ─────────────────────────────

export function Mesa({ mats }: { mats: MatsQ7 }) {
  return <mesh geometry={cajaRedondeada(9, 0.3, 5.6, 0.05, 3)} material={mats.mesa} position={[0, -0.15, -0.5]} receiveShadow />;
}

/** Placa del soporte universal con su varilla de acero (origen del grupo: pie de la varilla en la mesa). */
export function BaseSoporte({ mats, varilla, alturaVarilla }: { mats: MatsQ7; varilla: [number, number]; alturaVarilla: number }) {
  const m = useMateriales();
  const B = COTAS.base;
  const geoPlaca = useMemo(() => {
    const g = extruir(formaRectRedondeado(B.ancho, B.fondo, 0.16), B.alto - 0.02, 20);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [B.ancho, B.fondo, B.alto]);
  useEffect(() => () => geoPlaca.dispose(), [geoPlaca]);
  // chaflán superior: segunda placa algo menor encima (el canto se lee redondeado)
  const geoTapa = useMemo(() => {
    const g = extruir(formaRectRedondeado(B.ancho - 0.04, B.fondo - 0.04, 0.14), 0.02, 20);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [B.ancho, B.fondo]);
  useEffect(() => () => geoTapa.dispose(), [geoTapa]);
  const geoBoss = useMemo(() => tornear([[0.0005, 0], [0.16, 0], [0.16, 0.015], [0.12, 0.07], [0.08, 0.09], [0.0005, 0.09]], 40), []);
  useEffect(() => () => geoBoss.dispose(), [geoBoss]);
  const rv = 0.06;
  return (
    <group>
      <group position={[B.x, 0, B.z]} userData={{ pieza: 'soporte' }}>
        <mesh geometry={geoPlaca} material={mats.pinturaBase} castShadow receiveShadow />
        <mesh geometry={geoTapa} material={mats.pinturaBase} position={[0, B.alto - 0.02, 0]} castShadow receiveShadow />
      </group>
      <group position={[varilla[0], B.alto, varilla[1]]} userData={{ pieza: 'soporte' }}>
        <mesh geometry={geoBoss} material={mats.pinturaBase} castShadow />
        <mesh geometry={cilindro(rv, rv, alturaVarilla, 28)} material={m.acero} position={[0, alturaVarilla / 2, 0]} castShadow />
        <mesh geometry={esfera(rv, 16)} material={m.acero} position={[0, alturaVarilla, 0]} scale={[1, 0.45, 1]} />
      </group>
    </group>
  );
}

/** Agitador magnético (origen: centro de la base, en la placa). `rpm` gira el mando. */
export function Agitador({ mats, rpm, ...g }: GroupProps & { mats: MatsQ7; rpm: number }) {
  const { lado: L, alto: H, radioPlato: rp } = COTAS.agitador;
  // carcasa: perfil lateral con frente achaflanado, extruido en X
  const geoCuerpo = useMemo(() => {
    const s = new THREE.Shape();
    const d = L / 2, h = H - 0.05;
    s.moveTo(-d, 0); s.lineTo(d - 0.06, 0); s.quadraticCurveTo(d, 0, d, 0.06); s.lineTo(d, h * 0.42);
    s.lineTo(d - 0.2, h - 0.03); s.quadraticCurveTo(d - 0.23, h, d - 0.28, h); s.lineTo(-d + 0.06, h);
    s.quadraticCurveTo(-d, h, -d, h - 0.06); s.lineTo(-d, 0);
    const geo = extruir(s, L - 0.02, 16);
    geo.translate(0, 0, -(L - 0.02) / 2);
    geo.rotateY(-Math.PI / 2);
    return geo;
  }, [L, H]);
  useEffect(() => () => geoCuerpo.dispose(), [geoCuerpo]);
  const geoPlato = useMemo(() => tornear([[0.0005, 0], [rp, 0], [rp + 0.012, 0.012], [rp + 0.012, 0.03], [rp, 0.042], [0.0005, 0.042]], 64), [rp]);
  useEffect(() => () => geoPlato.dispose(), [geoPlato]);
  const pendiente = Math.atan2(0.2, (H - 0.05) * 0.58);
  // el mando recorre 270° entre 0 y 1200 rpm
  const angMando = -2.36 + (Math.min(1200, Math.max(0, rpm)) / 1200) * 4.71;
  return (
    <group {...g}>
      <mesh geometry={geoCuerpo} material={mats.absClaro} castShadow receiveShadow userData={{ pieza: 'agitador' }} />
      <mesh geometry={geoPlato} material={mats.placa} position={[0, H - 0.05, -0.12]} castShadow receiveShadow userData={{ pieza: 'agitador' }} />
      {/* frente achaflanado: mando de velocidad y piloto */}
      <group position={[0, (H - 0.05) * 0.71, L / 2 - 0.1]} rotation-x={-pendiente}>
        <group position={[0.32, 0, 0.015]} rotation-x={Math.PI / 2} userData={{ pieza: 'mando' }}>
          <mesh geometry={cilindro(0.085, 0.092, 0.07, 32)} material={mats.mando} position={[0, 0.035, 0]} castShadow />
          <group rotation-y={-angMando}>
            <mesh geometry={cajaRedondeada(0.016, 0.012, 0.07, 0.005, 1)} material={mats.inox} position={[0, 0.072, -0.04]} />
          </group>
        </group>
        <mesh geometry={esfera(0.022, 14)} material={rpm > 0 ? mats.led : mats.mando} position={[-0.36, 0.01, 0.02]} />
      </group>
    </group>
  );
}
/** El plato del agitador queda centrado en z = −0,12 de su carcasa. */
export const AGITADOR_CENTRO_PLATO_Z = -0.12;

/** Barra agitadora de PTFE (25 mm × Ø 8 mm, con su anillo central). Origen: centro apoyado en el fondo. */
export function BarraAgitadora({ mats, angulo }: { mats: MatsQ7; angulo: () => number }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.04, 0.17, 8, 18);
    g.rotateZ(Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(() => { if (ref.current) ref.current.rotation.y = angulo(); });
  return (
    <group ref={ref} position={[0, 0.04, 0]} userData={{ pieza: 'barra' }}>
      <mesh geometry={geo} material={mats.ptfe} />
      <mesh geometry={toro(0.041, 0.006, 8, 24)} material={mats.ptfe} rotation-y={Math.PI / 2} />
    </group>
  );
}

// ───────────────────────────── electrodo de pH ─────────────────────────────

/**
 * Electrodo combinado (vidrio + referencia Ag/AgCl en el mismo cuerpo): bulbo sensible,
 * cuerpo de epoxi con la unión de cerámica, cabezal y manguito del cable. Origen: punta
 * del bulbo; eje +Y.
 */
export function ElectrodoPH({ mats, ...g }: GroupProps & { mats: MatsQ7 }) {
  const L = COTAS.electrodo.largo, r = COTAS.electrodo.radio;
  const geoCuerpo = useMemo(() => tornear([
    [0.0005, 0.07], [r * 0.82, 0.075], [r, 0.11], [r, 1.24], [r * 1.05, 1.27], [r * 1.05, 1.3], [0.0005, 1.3],
  ], 32), [r]);
  useEffect(() => () => geoCuerpo.dispose(), [geoCuerpo]);
  const geoBulbo = useMemo(() => tornear([
    [0.0005, 0], [0.018, 0.004], [0.032, 0.016], [0.04, 0.034], [0.042, 0.055], [0.04, 0.078], [0.0005, 0.078],
  ], 28), []);
  useEffect(() => () => geoBulbo.dispose(), [geoBulbo]);
  const geoCabezal = useMemo(() => tornear([
    [0.0005, 1.3], [r * 1.12, 1.3], [r * 1.18, 1.34], [r * 1.18, 1.56], [r * 1.0, 1.6], [0.035, 1.62], [0.03, L], [0.0005, L],
  ], 32), [r, L]);
  useEffect(() => () => geoCabezal.dispose(), [geoCabezal]);
  return (
    <group {...g} userData={{ pieza: 'electrodo' }}>
      <mesh geometry={geoBulbo} material={mats.bulbo} castShadow />
      <mesh geometry={geoCuerpo} material={mats.epoxi} castShadow />
      {/* unión de referencia (diafragma de cerámica) a 1,2 cm de la punta: queda sumergida */}
      <mesh geometry={cilindro(r * 1.004, r * 1.004, 0.025, 28, true)} material={mats.ceramica} position={[0, 0.12, 0]} />
      <mesh geometry={geoCabezal} material={mats.mando} castShadow />
      {/* anillo de color del cabezal */}
      <mesh geometry={cilindro(r * 1.19, r * 1.19, 0.03, 28, true)} material={mats.tapa('#2d74c9')} position={[0, 1.4, 0]} />
    </group>
  );
}
/** Salida del cable en lo alto del electrodo (local). */
export const ELECTRODO_CABLE: V3 = [0, COTAS.electrodo.largo + 0.02, 0];

// ───────────────────────────── pH-metro analógico ─────────────────────────────

/** Ventana de la esfera (u) y semiapertura de la escala (rad). */
const ESFERA = { ancho: 1.2, alto: 0.6, arco: (50 * Math.PI) / 180 };

function dibujarEsferaPH(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const fam = familiaTexto();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#fbf8ef'); g.addColorStop(1, '#efe9da');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const px = W / ESFERA.ancho;
  const cx = W / 2, cy = H * 1.02;
  const R = 0.56 * px;
  const A = ESFERA.arco;
  const ang = (f: number) => -Math.PI / 2 + f * A;
  const pol = (f: number, r: number): [number, number] => [cx + Math.cos(ang(f)) * r, cy + Math.sin(ang(f)) * r];
  // banda de color ácido → neutro → básico bajo la escala de pH (impresa, como en los clásicos)
  const N = 140;
  for (let i = 0; i < N; i++) {
    const f0 = -1 + (2 * i) / N, f1 = -1 + (2 * (i + 1)) / N;
    const ph = ((f0 + 1) / 2) * 14;
    const t = ph / 14;
    const col = t < 0.5
      ? `rgb(${Math.round(196 - 120 * t * 2)},${Math.round(70 + 110 * t * 2)},${Math.round(60 + 40 * t * 2)})`
      : `rgb(${Math.round(76 - 30 * (t - 0.5) * 2)},${Math.round(180 - 90 * (t - 0.5) * 2)},${Math.round(100 + 110 * (t - 0.5) * 2)})`;
    ctx.strokeStyle = col; ctx.lineWidth = 0.022 * px;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, ang(f0), ang(f1) + 0.002); ctx.stroke();
  }
  // espejo antiparalaje
  ctx.lineWidth = 0.02 * px;
  const gm = ctx.createLinearGradient(0, cy - R, 0, cy - R * 0.85);
  gm.addColorStop(0, '#d5d9dc'); gm.addColorStop(0.5, '#f8fafb'); gm.addColorStop(1, '#c2c7cb');
  ctx.strokeStyle = gm;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, ang(-1.02), ang(1.02)); ctx.stroke();
  // escala pH 0–14
  ctx.strokeStyle = '#15181b'; ctx.fillStyle = '#15181b';
  ctx.lineWidth = 0.004 * px;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.84, ang(-1), ang(1)); ctx.stroke();
  for (let i = 0; i <= 140; i++) {
    const ph = i / 10, f = (ph / 14) * 2 - 1;
    const mayor = i % 10 === 0, medio = i % 5 === 0;
    const l = mayor ? 0.075 : medio ? 0.05 : 0.028;
    const [x0, y0] = pol(f, R * 0.84), [x1, y1] = pol(f, R * (0.84 + l));
    ctx.lineWidth = (mayor ? 0.0075 : 0.0038) * px;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (mayor) {
      const [tx, ty] = pol(f, R * 0.99);
      ctx.font = `700 ${0.042 * px}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(ph), tx, ty);
    }
  }
  // escala mV (interior, roja): E = −59,16·(pH − 7)
  ctx.strokeStyle = '#a3261f'; ctx.fillStyle = '#a3261f';
  ctx.lineWidth = 0.0035 * px;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.68, ang(-1), ang(1)); ctx.stroke();
  for (let mv = -400; mv <= 400; mv += 50) {
    const ph = 7 - mv / 59.16, f = (ph / 14) * 2 - 1;
    if (f < -1.001 || f > 1.001) continue;
    const mayor = mv % 200 === 0;
    const [x0, y0] = pol(f, R * 0.68), [x1, y1] = pol(f, R * (0.68 - (mayor ? 0.05 : 0.03)));
    ctx.lineWidth = (mayor ? 0.006 : 0.0035) * px;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (mayor) {
      const [tx, ty] = pol(f, R * 0.57);
      ctx.font = `600 ${0.032 * px}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mv === 0 ? '0' : (mv > 0 ? '+' : '−') + Math.abs(mv), tx, ty);
    }
  }
  ctx.fillStyle = '#15181b'; ctx.font = `700 ${0.06 * px}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('pH', cx, cy - R * 0.36);
  ctx.fillStyle = '#a3261f'; ctx.font = `600 ${0.032 * px}px ${fam}`;
  ctx.fillText('mV', cx, cy - R * 0.25);
}

/**
 * pH-metro analógico de banco. Origen: centro de la base. `lectura()` = pH que mide el
 * electrodo; la aguja la sigue con una respuesta de segundo orden (bobina móvil, f₀ ≈ 1,8 Hz,
 * ζ ≈ 0,7), en tiempo real: es el instrumento, no la química.
 */
export function PHmetroAnalogico({ mats, lectura, ...g }: GroupProps & { mats: MatsQ7; lectura: () => number }) {
  const m = useMateriales();
  const vf = useVersionFuentes();
  const { ancho: AW, alto: AH, fondo: AD } = COTAS.phmetro;
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = 2048, H = Math.round((W * ESFERA.alto) / ESFERA.ancho);
    const c = crearLienzo(W, H);
    dibujarEsferaPH(c.getContext('2d')!, W, H);
    return texturaDeLienzo(c);
  }, [vf]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => tex?.dispose(), [tex]);
  const matEsfera = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, color: '#d8d5cc', roughness: 0.78, metalness: 0, name: 'q7-esfera' }), [tex]);
  useEffect(() => () => matEsfera.dispose(), [matEsfera]);
  // carcasa: perfil lateral (frente inclinado) extruido a lo ancho
  const geoCaja = useMemo(() => {
    const s = new THREE.Shape();
    const d = AD / 2;
    s.moveTo(-d, 0); s.lineTo(d - 0.08, 0); s.quadraticCurveTo(d, 0, d, 0.08); s.lineTo(d, AH * 0.3);
    s.lineTo(d - 0.32, AH - 0.04); s.quadraticCurveTo(d - 0.36, AH, d - 0.42, AH); s.lineTo(-d + 0.08, AH);
    s.quadraticCurveTo(-d, AH, -d, AH - 0.08); s.lineTo(-d, 0);
    const geo = extruir(s, AW, 16);
    geo.translate(0, 0, -AW / 2);
    geo.rotateY(-Math.PI / 2);
    return geo;
  }, [AW, AH, AD]);
  useEffect(() => () => geoCaja.dispose(), [geoCaja]);
  const geoAguja = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.006, -0.05); s.lineTo(0.006, -0.05); s.lineTo(0.0018, 0.6); s.lineTo(0, 0.615); s.lineTo(-0.0018, 0.6); s.lineTo(-0.006, -0.05);
    return extruir(s, 0.004, 4);
  }, []);
  useEffect(() => () => geoAguja.dispose(), [geoAguja]);
  const geoBisel = useMemo(() => {
    const f = formaRectRedondeado(ESFERA.ancho + 0.1, ESFERA.alto + 0.1, 0.05);
    f.holes.push(new THREE.Path(formaRectRedondeado(ESFERA.ancho, ESFERA.alto, 0.025).getPoints(24).reverse()));
    return extruir(f, 0.028, 12);
  }, []);
  useEffect(() => () => geoBisel.dispose(), [geoBisel]);
  const aguja = useRef<THREE.Group>(null);
  const din = useRef({ th: 0, w: 0, ini: false });
  useFrame((_, dt) => {
    const a = aguja.current; if (!a) return;
    const h = Math.min(dt, 0.05);
    const ph = Math.max(-0.3, Math.min(14.3, lectura()));
    const obj = -(((ph / 14) * 2 - 1) * ESFERA.arco);
    const d = din.current;
    if (!d.ini) { d.th = obj; d.ini = true; }
    const wn = 2 * Math.PI * 1.8, z = 0.7;
    const acc = wn * wn * (obj - d.th) - 2 * z * wn * d.w;
    d.w += acc * h; d.th += d.w * h;
    a.rotation.z = d.th;
  });
  // frente inclinado: el panel con la esfera
  const pend = Math.atan2(0.32, AH * 0.7 - 0.04);
  const zFr = AD / 2 - 0.16, yFr = AH * 0.66;
  const yPiv = -ESFERA.alto / 2 - 0.0;
  return (
    <group {...g} userData={{ pieza: 'phmetro' }}>
      <mesh geometry={geoCaja} material={mats.carcasaMedidor} castShadow receiveShadow />
      <group position={[0, yFr, zFr + 0.006]} rotation-x={-pend}>
        <mesh geometry={cajaRedondeada(AW - 0.1, AH * 0.78, 0.02, 0.02, 2)} material={mats.frente} position={[0, 0, -0.012]} />
        <group position={[0, 0.06, 0]}>
          <mesh geometry={geoBisel} material={mats.cromo} position={[0, 0, -0.004]} />
          <mesh material={matEsfera} position={[0, 0, 0.002]}>
            <planeGeometry args={[ESFERA.ancho, ESFERA.alto]} />
          </mesh>
          <group ref={aguja} position={[0, yPiv, 0.012]}>
            <mesh geometry={geoAguja} material={mats.aguja} />
          </group>
          <mesh geometry={cajaRedondeada(ESFERA.ancho, ESFERA.alto, 0.006, 0.002, 1)} material={m.vidrio} position={[0, 0, 0.026]} renderOrder={3} />
        </group>
      </group>
      {/* mandos bajo la esfera: calibración, temperatura y función (baquelita moleteada) */}
      {[-0.45, 0, 0.45].map((x, i) => (
        <group key={i} position={[x, 0.11, AD / 2 + 0.01]} rotation-x={Math.PI / 2}>
          <mesh geometry={cilindro(0.075, 0.082, 0.08, 24)} material={mats.mando} position={[0, 0.04, 0]} />
        </group>
      ))}
      {/* entrada BNC del electrodo en el costado izquierdo */}
      <group position={[-AW / 2, 0.36, 0.05]} rotation-z={Math.PI / 2}>
        <mesh geometry={cilindro(0.045, 0.045, 0.09, 18)} material={mats.cromo} position={[0, 0.03, 0]} />
        <mesh geometry={cilindro(0.06, 0.06, 0.02, 18)} material={mats.cromo} position={[0, 0.0, 0]} />
      </group>
    </group>
  );
}
/** Entrada BNC (local del pH-metro). */
export const PHMETRO_BNC: V3 = [-COTAS.phmetro.ancho / 2 - 0.08, 0.36, 0.05];

// ───────────────────────────── frasco gotero ─────────────────────────────

/** Altura del frasco gotero (u) hasta la punta de la boquilla. */
export const GOTERO_ALTO = 1.02;
/** Frasco gotero de 60 mL de polietileno con la disolución madre del indicador. Origen: base. */
export function FrascoGotero({ mats, color, colorTapa, ...g }: GroupProps & { mats: MatsQ7; color: string; colorTapa: string }) {
  const m = useMateriales();
  const geo = useMemo(() => tornear([
    [0.0005, 0], [0.17, 0], [0.2, 0.03], [0.2, 0.56], [0.16, 0.66], [0.09, 0.71], [0.09, 0.74], [0.0005, 0.74],
  ], 36), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const geoTapa = useMemo(() => tornear([
    [0.0005, 0.72], [0.1, 0.72], [0.104, 0.73], [0.104, 0.82], [0.07, 0.86], [0.03, 0.97], [0.012, GOTERO_ALTO], [0.0005, GOTERO_ALTO],
  ], 28), []);
  useEffect(() => () => geoTapa.dispose(), [geoTapa]);
  const geoLiq = useMemo(() => tornear([[0.0005, 0.02], [0.185, 0.02], [0.185, 0.46], [0.0005, 0.46]], 28), []);
  useEffect(() => () => geoLiq.dispose(), [geoLiq]);
  const matLiq = m.liquido(color);
  return (
    <group {...g} userData={{ pieza: 'gotero' }}>
      <mesh geometry={geo} material={m.plasticoClaro} renderOrder={3} castShadow />
      <mesh geometry={geoLiq} material={matLiq} renderOrder={2} />
      <mesh geometry={geoTapa} material={mats.tapa(colorTapa)} castShadow />
    </group>
  );
}

// ───────────────────────────── líquido del matraz (Beer–Lambert por píxel) ─────────────────────────────

/** Uniformes del sombreador del líquido (compartidos entre calidades). */
export interface UniformesLiquido {
  uCentroQ7: { value: THREE.Vector3 };
  uY0Q7: { value: number };
  uYSupQ7: { value: number };
  uR0Q7: { value: number };
  uKQ7: { value: number };
  uABulkQ7: { value: THREE.Vector3 };
  uManchaQ7: { value: THREE.Vector4[] };
  uDaQ7: { value: THREE.Vector3[] };
  uNQ7: { value: number };
}

export function crearUniformesLiquido(): UniformesLiquido {
  // el cono interior del matraz entre el fondo y el cuello (r = R0 + K·(y − y0))
  const y0 = ERLEN.y0;
  const yA = y0 + 0.05, yB = ERLEN.altura * 0.6;
  const rA = ERLEN.radioInteriorEn(yA), rB = ERLEN.radioInteriorEn(yB);
  const K = (rB - rA) / (yB - yA);
  return {
    uCentroQ7: { value: new THREE.Vector3() },
    uY0Q7: { value: y0 },
    uYSupQ7: { value: y0 + 0.2 },
    uR0Q7: { value: rA + K * (y0 - yA) },
    uKQ7: { value: K },
    uABulkQ7: { value: new THREE.Vector3() },
    uManchaQ7: { value: Array.from({ length: MAX_MANCHAS }, () => new THREE.Vector4(0, -10, 0, 0.01)) },
    uDaQ7: { value: Array.from({ length: MAX_MANCHAS }, () => new THREE.Vector3()) },
    uNQ7: { value: 0 },
  };
}

/** GLSL común: profundidad óptica natural por canal a lo largo de la recta del rayo de vista. */
const GLSL_BEER = /* glsl */ `
uniform vec3 uCentroQ7;
uniform float uY0Q7;
uniform float uYSupQ7;
uniform float uR0Q7;
uniform float uKQ7;
uniform vec3 uABulkQ7;
uniform vec4 uManchaQ7[${MAX_MANCHAS}];
uniform vec3 uDaQ7[${MAX_MANCHAS}];
uniform int uNQ7;
varying vec3 vMundoQ7;

// longitud de la cuerda de la recta p + s·d dentro del tronco de cono (y0 ≤ y ≤ ySup, r ≤ R0 + K(y − y0))
float cuerdaQ7(vec3 p, vec3 d) {
  float sa = -1e3, sb = 1e3;
  if (abs(d.y) > 1e-6) {
    float s1 = (uY0Q7 - p.y) / d.y, s2 = (uYSupQ7 - p.y) / d.y;
    sa = min(s1, s2); sb = max(s1, s2);
  } else if (p.y < uY0Q7 || p.y > uYSupQ7) { return 0.0; }
  float A = uR0Q7 - uKQ7 * uY0Q7;
  float w = A + uKQ7 * p.y;
  float qa = d.x * d.x + d.z * d.z - uKQ7 * uKQ7 * d.y * d.y;
  float qb = 2.0 * (p.x * d.x + p.z * d.z - uKQ7 * d.y * w);
  float qc = p.x * p.x + p.z * p.z - w * w;
  float L = 0.0;
  if (abs(qa) < 1e-8) {
    if (abs(qb) < 1e-8) return qc <= 0.0 ? sb - sa : 0.0;
    float s0 = -qc / qb;
    float lo = qb > 0.0 ? sa : max(sa, s0);
    float hi = qb > 0.0 ? min(sb, s0) : sb;
    return max(0.0, hi - lo);
  }
  float disc = qb * qb - 4.0 * qa * qc;
  if (qa > 0.0) {
    if (disc <= 0.0) return 0.0;
    float r = sqrt(disc);
    float s1 = (-qb - r) / (2.0 * qa), s2 = (-qb + r) / (2.0 * qa);
    L = max(0.0, min(sb, s2) - max(sa, s1));
  } else {
    if (disc <= 0.0) return sb - sa;
    float r = sqrt(disc);
    float s1 = (-qb + r) / (2.0 * qa), s2 = (-qb - r) / (2.0 * qa);
    L = max(0.0, min(sb, s1) - sa) + max(0.0, sb - max(sa, s2));
  }
  return L;
}

vec3 tauQ7(vec3 pMundo, vec3 d) {
  vec3 p = pMundo - uCentroQ7;
  vec3 tau = uABulkQ7 * cuerdaQ7(p, d);
  for (int k = 0; k < ${MAX_MANCHAS}; k++) {
    if (k >= uNQ7) break;
    vec4 m = uManchaQ7[k];
    vec3 w = m.xyz - p;
    float t = dot(w, d);
    float b2 = max(0.0, dot(w, w) - t * t);
    // integral de línea de la gaussiana: σ·√(2π)·e^(−b²/2σ²)
    tau += uDaQ7[k] * (m.w * 2.5066283 * exp(-b2 / (2.0 * m.w * m.w)));
  }
  return max(tau, vec3(0.0));
}
`;

const VS_MUNDO = /* glsl */ `
  #include <project_vertex>
  vMundoQ7 = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

/**
 * Material del líquido. ALTA: transmisión física (refracción del entorno) y, tras ella,
 * la transmitancia T = e^(−τ) de Beer–Lambert por píxel. MEDIA: sin pasada de transmisión;
 * mezcla MULTIPLICATIVA (fondo × T), que es Beer–Lambert sobre lo que hay detrás.
 */
export function crearMaterialLiquido(calidad: Calidad, u: UniformesLiquido): THREE.Material {
  if (calidad === 'alta') {
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.035, transmission: 1, ior: 1.333, thickness: 0.25,
      specularIntensity: 1, envMapIntensity: 1, side: THREE.DoubleSide, name: 'q7-liquido',
    });
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundoQ7;').replace('#include <project_vertex>', VS_MUNDO);
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\n' + GLSL_BEER)
        .replace('#include <transmission_fragment>', '#include <transmission_fragment>\n  totalDiffuse *= exp(-tauQ7(vMundoQ7, normalize(vMundoQ7 - cameraPosition)));');
    };
    mat.customProgramCacheKey = () => 'q7-liquido-alta';
    return mat;
  }
  return new THREE.ShaderMaterial({
    name: 'q7-liquido-media',
    uniforms: u as unknown as Record<string, THREE.IUniform>,
    vertexShader: /* glsl */ `
      varying vec3 vMundoQ7;
      varying vec3 vNormalQ7;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vMundoQ7 = w.xyz;
        vNormalQ7 = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_BEER}
      varying vec3 vNormalQ7;
      void main() {
        vec3 d = normalize(vMundoQ7 - cameraPosition);
        vec3 T = exp(-tauQ7(vMundoQ7, d));
        // borde de la superficie: un leve oscurecimiento rasante para leer que hay líquido
        float fr = pow(1.0 - abs(dot(normalize(vNormalQ7), -d)), 3.0);
        T *= mix(1.0, 0.82, fr);
        // fondo × T en el espacio de salida (sRGB ≈ potencia: el producto se conserva)
        gl_FragColor = vec4(pow(T, vec3(1.0 / 2.2)), 1.0);
      }`,
    // multiplicativa de three (con alfa premultiplicado y α = 1): destino × T
    transparent: true, depthWrite: false, side: THREE.FrontSide, blending: THREE.MultiplyBlending, premultipliedAlpha: true,
    toneMapped: false,
  });
}

/** Líquido del matraz con el material de Beer–Lambert (mismas coordenadas que el Erlenmeyer). */
export function LiquidoMatraz({ volumenML, material }: { volumenML: number; material: THREE.Material }) {
  return <Liquido recipiente={ERLEN} volumenML={volumenML} material={material} sombra={false} />;
}

// ───────────────────────────── diagnóstico ─────────────────────────────

export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number } {
  let mallas = 0, normalesCero = 0;
  o.traverse((x) => {
    const g = (x as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!g || !(x as THREE.Mesh).isMesh) return;
    mallas++;
    const n = g.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { mallas, normalesCero };
}

/** Perfil útil para piezas torneadas de este módulo. */
export type { P2 };
