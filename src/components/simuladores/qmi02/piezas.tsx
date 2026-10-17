"use client";
/**
 * qmi02/piezas.tsx — las piezas del banco de gases, a escala real (1 u = 1 dm = 10 cm;
 * la cubierta de la mesa en y = 0; +Z mira al alumno). Las cotas de la cámara vienen
 * de `cinetica.ts` (CAMARA): el volumen del gas es V = área × altura EXACTAMENTE.
 *
 *  · UNIDAD TERMOSTÁTICA: caja de aluminio anodizado con la placa del fondo de la
 *    cámara (acero inoxidable torneado). La placa fija la T del gas; por encima de
 *    ~850 K brilla con el color de Planck (`brilloCuerpoNegro`) y por debajo de 0 °C
 *    se escarcha. En el frente, la perilla de consigna (gira con T) y dos pilotos.
 *  · CÁMARA DE CUARZO (sílice fundida, ior 1,458): Ø interior 26 cm, graduada en
 *    litros sobre el vidrio; bridas de inoxidable y cuatro tirantes.
 *  · PISTÓN de aluminio con dos juntas tóricas, movido por un HUSILLO de 5 mm de paso
 *    con volante: el volante da (Δh / paso) vueltas.
 *  · MANÓMETRO de Bourdon (atm y kPa) y TERMÓMETRO bimetálico (K y °C): esferas
 *    dibujadas en lienzo, agujas con respuesta de segundo orden. La cifra exacta va en
 *    el dock (DOM), no en 3D.
 *  · BOTELLA de gas con regulador, manguera y VÁLVULA DE AGUJA de entrada.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  cajaRedondeada, cilindro, esfera, toro, tornear, tuboPolilinea, extruir, bandaSobrePerfil, crearLienzo, texturaDeLienzo,
  familiaTexto, useVersionFuentes, useMateriales, type Calidad, type P2,
} from '../_kit';
import { CAMARA, AREA_DM2, Y_TAPA, alturaGas, brilloCuerpoNegro, escarcha, type IdGas } from './cinetica';

type GroupProps = ThreeElements['group'];
export type V3 = [number, number, number];

// ───────────────────────────── cotas ─────────────────────────────

export const COTAS = {
  base: { ancho: 4.7, alto: 0.48, fondo: 3.0 },
  /** espesor de la pared de cuarzo */
  pared: 0.08,
  rBrida: 1.7,
  /** bridas: inferior (sobre la base) y superior (alrededor de la boca del cuarzo) */
  yBridaInf: [0.48, 0.86] as [number, number],
  yBridaSup: [Y_TAPA - 0.16, Y_TAPA] as [number, number],
  altoTapa: 0.2,
  rTirante: 1.56,
  espesorPiston: 0.3,
  largoHusillo: 3.15,
  /** 5 mm por vuelta */
  pasoHusillo: 0.05,
  rVolante: 0.7,
  manometro: { pos: [2.12, 2.55, 0.45] as V3, diametro: 1.2, giro: -0.32 },
  termometro: { pos: [1.74, 1.22, 1.12] as V3, diametro: 0.84, giro: -0.36 },
  valvula: [-1.86, 0.48, -0.55] as V3,
  botella: [-3.2, 0, -1.3] as V3,
};
export const R_EXT = CAMARA.R + COTAS.pared;
export const Y_TOPE_TAPA = Y_TAPA + COTAS.altoTapa;
/** Altura del plano del pistón (cara inferior) para V litros. */
export const yPistonDe = (V: number) => CAMARA.yFondo + alturaGas(V);
/** Altura del cubo del volante con el pistón en y. */
export const yVolanteDe = (yPiston: number) => yPiston + COTAS.espesorPiston + 0.08 + COTAS.largoHusillo;

// ───────────────────────────── utilidades ─────────────────────────────

interface Parte { g: THREE.BufferGeometry; p?: V3; r?: V3; s?: V3 }
/** Funde geometrías del MISMO material en una (una llamada de dibujo). Clona las del kit (cacheadas). */
export function fundir(partes: Parte[]): THREE.BufferGeometry {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const lista = partes.map(({ g, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] }) => {
    let c = g.clone();
    if (c.index) c = c.toNonIndexed();
    for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
    if (!c.getAttribute('uv')) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.getAttribute('position').count * 2), 2));
    c.clearGroups();
    m.compose(new THREE.Vector3(...p), q.setFromEuler(e.set(...r)), new THREE.Vector3(...s));
    c.applyMatrix4(m);
    return c;
  });
  const out = mergeGeometries(lista, false) ?? lista[0];
  lista.forEach((c) => { if (c !== out) c.dispose(); });
  return out;
}

/** Cuenta las normales nulas de la escena (una normal nula deja el lienzo negro). */
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

/** Anillo torneado (sección rectangular con chaflanes de `ch`). */
function anillo(r0: number, r1: number, h: number, ch: number, segs: number) {
  return tornear([[r0, 0], [r1 - ch, 0], [r1, ch], [r1, h - ch], [r1 - ch, h], [r0, h], [r0, 0.0001]], segs);
}

// ───────────────────────────── materiales del banco ─────────────────────────────

export interface MatsQ2 {
  mesa: THREE.MeshPhysicalMaterial;
  anodizado: THREE.MeshPhysicalMaterial;
  panel: THREE.MeshPhysicalMaterial;
  inox: THREE.MeshStandardMaterial;
  inoxPulido: THREE.MeshStandardMaterial;
  placa: THREE.MeshPhysicalMaterial;
  bronce: THREE.MeshStandardMaterial;
  cuarzo: THREE.Material;
  junta: THREE.MeshPhysicalMaterial;
  fenolico: THREE.MeshPhysicalMaterial;
  negroMate: THREE.MeshStandardMaterial;
  escarcha: THREE.MeshStandardMaterial;
  escarchaVidrio: THREE.MeshStandardMaterial;
  ledRojo: THREE.MeshStandardMaterial;
  ledAzul: THREE.MeshStandardMaterial;
  manguera: THREE.MeshPhysicalMaterial;
  trenza: THREE.MeshStandardMaterial;
}

function texturasMesa(calidad: Calidad) {
  if (typeof document === 'undefined') return null;
  const S = calidad === 'alta' ? 512 : 256;
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#1e2328'; c.fillRect(0, 0, S, S);
  o.fillStyle = `rgb(0, ${Math.round(0.5 * 255)}, 0)`; o.fillRect(0, 0, S, S);
  let sem = 7177;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  // manchas MUY suaves de baja frecuencia (nada de grano fino)
  for (let i = 0; i < 16; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.16 + rnd() * 0.32);
    const claro = rnd() > 0.5;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, claro ? 'rgba(50,56,62,0.32)' : 'rgba(12,14,16,0.32)'); g.addColorStop(1, 'rgba(30,35,40,0)');
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

/**
 * Escarcha: manchas blancas sueltas de borde suave (alfa), sin velo uniforme ni
 * purpurina. `subida`: en el cuarzo, densa abajo y desvanecida hacia arriba (v = 0 abajo).
 */
function texturaEscarcha(subida: boolean) {
  if (typeof document === 'undefined') return null;
  const S = 256;
  const c = crearLienzo(S, S);
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, S, S);
  let sem = subida ? 991 : 99;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  // escarcha fina: muchas manchas pequeñas y tenues (cristales de hielo vistos de lejos)
  for (let i = 0; i < 420; i++) {
    const x = rnd() * S, y = subida ? S * (1 - Math.pow(rnd(), 1.8)) : rnd() * S, r = S * (0.012 + rnd() * 0.035);
    const a = 0.12 + rnd() * 0.22;
    for (const dx of [-S, 0, S]) for (const dy of subida ? [0] : [-S, 0, S]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
  if (subida) {
    // la escarcha nace en la brida fría: el alfa se apaga con la altura
    g.globalCompositeOperation = 'destination-in';
    const v = g.createLinearGradient(0, S, 0, 0);
    v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.35, 'rgba(0,0,0,0.75)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'source-over';
  }
  return texturaDeLienzo(c, { repetir: subida ? [4, 1] : [3, 3] });
}

export function useMatsQ2(calidad: Calidad): MatsQ2 {
  const kit = useMateriales(calidad);
  const tex = useMemo(() => texturasMesa(calidad), [calidad]);
  const texEsc = useMemo(() => texturaEscarcha(false), []);
  const texEscV = useMemo(() => texturaEscarcha(true), []);
  const m = useMemo<MatsQ2>(() => {
    const alta = calidad === 'alta';
    // cuarzo: transmisión física en alta (sin escribir profundidad: las estelas del gas se ven a través)
    // (en media, el vidrio barato del kit: compartido, no se libera aquí)
    const cuarzo = alta
      ? new THREE.MeshPhysicalMaterial({
          color: '#ffffff', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.04, ior: 1.458,
          specularIntensity: 1, envMapIntensity: 1.1, attenuationColor: new THREE.Color('#eef8fb'), attenuationDistance: 3,
          depthWrite: false, name: 'q2-cuarzo',
        })
      : kit.vidrio;
    return {
      mesa: new THREE.MeshPhysicalMaterial({
        color: '#ffffff', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, roughness: 1, metalness: 0,
        clearcoat: alta ? 0.35 : 0, clearcoatRoughness: 0.38, name: 'q2-mesa',
      }),
      // aluminio anodizado grafito, satinado
      anodizado: new THREE.MeshPhysicalMaterial({ color: '#3b4048', metalness: 0.7, roughness: 0.42, clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.4, name: 'q2-anodizado' }),
      panel: new THREE.MeshPhysicalMaterial({ color: '#1d2025', metalness: 0.2, roughness: 0.5, clearcoat: alta ? 0.3 : 0, clearcoatRoughness: 0.45, name: 'q2-panel' }),
      inox: new THREE.MeshStandardMaterial({ color: '#c4c8cc', metalness: 1, roughness: 0.3, name: 'q2-inox' }),
      inoxPulido: new THREE.MeshStandardMaterial({ color: '#dfe2e5', metalness: 1, roughness: 0.14, name: 'q2-inox-pulido' }),
      // placa del fondo: inoxidable con el brillo térmico como emisión
      placa: new THREE.MeshPhysicalMaterial({ color: '#9a9fa4', metalness: 0.9, roughness: 0.34, emissive: '#000000', emissiveIntensity: 1, name: 'q2-placa' }),
      bronce: new THREE.MeshStandardMaterial({ color: '#c08a4c', metalness: 1, roughness: 0.32, name: 'q2-bronce' }),
      cuarzo,
      junta: new THREE.MeshPhysicalMaterial({ color: '#1b1c1f', metalness: 0, roughness: 0.55, sheen: alta ? 0.3 : 0, name: 'q2-junta' }),
      fenolico: new THREE.MeshPhysicalMaterial({ color: '#141518', metalness: 0, roughness: 0.28, clearcoat: alta ? 0.6 : 0, clearcoatRoughness: 0.2, name: 'q2-fenolico' }),
      negroMate: new THREE.MeshStandardMaterial({ color: '#1a1c1f', metalness: 0.1, roughness: 0.6, name: 'q2-negro' }),
      escarcha: new THREE.MeshStandardMaterial({
        color: '#eef5fa', map: texEsc, roughness: 0.9, metalness: 0, transparent: true, opacity: 0, depthWrite: false, name: 'q2-escarcha',
      }),
      escarchaVidrio: new THREE.MeshStandardMaterial({
        color: '#eef5fa', map: texEscV, roughness: 0.9, metalness: 0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, name: 'q2-escarcha-vidrio',
      }),
      ledRojo: new THREE.MeshStandardMaterial({ color: '#2a0d0c', emissive: '#ff3b2f', emissiveIntensity: 0, roughness: 0.3, name: 'q2-led-rojo' }),
      ledAzul: new THREE.MeshStandardMaterial({ color: '#0c1830', emissive: '#3aa0ff', emissiveIntensity: 0, roughness: 0.3, name: 'q2-led-azul' }),
      manguera: new THREE.MeshPhysicalMaterial({ color: '#2c3238', metalness: 0, roughness: 0.45, sheen: alta ? 0.2 : 0, name: 'q2-manguera' }),
      trenza: new THREE.MeshStandardMaterial({ color: '#a7acb0', metalness: 0.9, roughness: 0.45, name: 'q2-trenza' }),
    };
  }, [calidad, tex, texEsc, texEscV, kit]);
  useEffect(() => () => {
    Object.values(m).forEach((x) => { if (x instanceof THREE.Material && x !== kit.vidrio) x.dispose(); });
    tex?.mapa.dispose(); tex?.rug.dispose();
  }, [m, tex, kit]);
  useEffect(() => () => { texEsc?.dispose(); texEscV?.dispose(); }, [texEsc, texEscV]);
  return m;
}

// ───────────────────────────── mesa ─────────────────────────────

export function Mesa({ mats }: { mats: MatsQ2 }) {
  return <mesh geometry={cajaRedondeada(11, 0.3, 6, 0.05, 3)} material={mats.mesa} position={[0, -0.15, -0.6]} receiveShadow />;
}

// ───────────────────────────── unidad termostática y placa del fondo ─────────────────────────────

/**
 * Caja de la unidad termostática con la placa del fondo de la cámara. `temperatura`
 * mueve la perilla de consigna, los pilotos, el brillo de Planck de la placa y la
 * escarcha. El brillo ilumina además el gas con una luz puntual del mismo color.
 */
export function UnidadTermostatica({ mats, temperatura }: { mats: MatsQ2; temperatura: number }) {
  const { ancho: W, alto: H, fondo: D } = COTAS.base;
  const kit = useMateriales();
  const segs = kit.calidad === 'alta' ? 96 : 56;
  // placa: inoxidable torneado con dos ranuras concéntricas finas
  const geoPlaca = useMemo(() => {
    const r = CAMARA.R, y1 = CAMARA.yFondo - H;
    const p: P2[] = [[0.0005, y1], [0.38, y1], [0.38, y1 - 0.006], [0.4, y1 - 0.006], [0.4, y1], [0.85, y1], [0.85, y1 - 0.006], [0.87, y1 - 0.006], [0.87, y1],
      [r + 0.02, y1], [R_EXT + 0.01, y1 - 0.02], [R_EXT + 0.01, 0], [0.0005, 0]];
    return tornear(p.reverse(), segs);
  }, [H, segs]);
  useEffect(() => () => geoPlaca.dispose(), [geoPlaca]);
  const luz = useRef<THREE.PointLight>(null);
  const escarchaRef = useRef(0);
  useEffect(() => {
    const b = brilloCuerpoNegro(Math.max(500, temperatura));
    // visible desde ~850 K; a 1000 K, emisión 2 (el bloom le da el halo). Al rojo, el
    // reflejo del estudio se apaga: si no, el blanco del entorno lo vuelve rosa
    const k = Math.min(2.4, 2 * b.luminancia);
    mats.placa.emissive.setRGB(b.rgb[0], b.rgb[1], b.rgb[2]);
    mats.placa.emissiveIntensity = k;
    const calor = Math.min(1, b.luminancia * 1.5);
    mats.placa.envMapIntensity = 1 - 0.85 * calor;
    mats.placa.color.set('#9a9fa4').multiplyScalar(1 - 0.6 * calor);
    if (luz.current) { luz.current.color.setRGB(b.rgb[0], b.rgb[1], b.rgb[2]); luz.current.intensity = 2.2 * Math.min(1.2, b.luminancia); }
    const e = escarcha(temperatura);
    escarchaRef.current = e;
    mats.escarcha.opacity = 0.7 * e;
    mats.escarcha.visible = e > 0.01;
    mats.escarchaVidrio.opacity = 0.9 * e;
    mats.escarchaVidrio.visible = e > 0.01;
    mats.ledRojo.emissiveIntensity = temperatura > 305 ? 2.4 : 0;
    mats.ledAzul.emissiveIntensity = temperatura < 285 ? 2.4 : 0;
  }, [temperatura, mats]);
  // perilla de consigna: −135° a 100 K, +135° a 1000 K
  const angulo = (-135 + ((temperatura - 100) / 900) * 270) * (Math.PI / 180);
  const geoCaja = useMemo(() => cajaRedondeada(W, H, D, 0.06, 4), [W, H, D]);
  const fijas = useMemo(() => fundir([
    // frente: un panel embutido
    { g: cajaRedondeada(1.5, 0.3, 0.03, 0.025, 2), p: [1.25, H / 2, D / 2 + 0.004] },
  ]), [H, D]);
  useEffect(() => () => fijas.dispose(), [fijas]);
  return (
    <group userData={{ pieza: 'termostato' }}>
      <mesh geometry={geoCaja} material={mats.anodizado} position={[0, H / 2, 0]} castShadow receiveShadow />
      <mesh geometry={fijas} material={mats.panel} />
      {/* perilla de consigna con su índice (sin cifras) */}
      <group position={[0.85, H / 2, D / 2 + 0.03]}>
        <mesh geometry={cilindro(0.11, 0.115, 0.08, 32)} material={mats.fenolico} rotation-x={Math.PI / 2} position={[0, 0, 0.04]} castShadow />
        <group rotation-z={-angulo}>
          <mesh geometry={cajaRedondeada(0.016, 0.08, 0.01, 0.004, 1)} material={mats.inoxPulido} position={[0, 0.06, 0.085]} />
        </group>
      </group>
      {/* pilotos: calentar (rojo) y enfriar (azul) */}
      {[[1.45, mats.ledRojo], [1.7, mats.ledAzul]].map(([x, mat], i) => (
        <group key={i} position={[x as number, H / 2, D / 2 + 0.02]}>
          <mesh geometry={cilindro(0.045, 0.045, 0.02, 24)} material={mats.inoxPulido} rotation-x={Math.PI / 2} />
          <mesh geometry={esfera(0.03, 16)} material={mat as THREE.Material} position={[0, 0, 0.012]} />
        </group>
      ))}
      {/* placa del fondo (su cara superior es el suelo del gas) */}
      <group userData={{ pieza: 'placa' }}>
        <mesh geometry={geoPlaca} material={mats.placa} position={[0, H, 0]} receiveShadow />
        {/* boca de entrada de gas y vaina del termopar en el fondo */}
        <mesh geometry={cilindro(0.035, 0.035, 0.004, 20)} material={mats.negroMate} position={[-CAMARA.R + 0.08, CAMARA.yFondo + 0.002, 0]} />
        <mesh geometry={tornear([[0.0005, 0.07], [0.012, 0.064], [0.014, 0.05], [0.014, 0], [0.0005, 0]], 16)} material={mats.inox} position={[0.85, CAMARA.yFondo, 0.55]} />
      </group>
      <pointLight ref={luz} position={[0, CAMARA.yFondo + 0.35, 0]} intensity={0} distance={5} decay={2} />
      {/* escarcha: sobre la base alrededor de la cámara (se ve sólo bajo 0 °C) */}
      <mesh material={mats.escarcha} position={[0, H + 0.003, 0]} rotation-x={-Math.PI / 2} renderOrder={2}>
        <ringGeometry args={[COTAS.rBrida - 0.02, 2.0, 64, 1]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── la cámara de cuarzo con sus bridas ─────────────────────────────

/** Graduación en litros grabada en el cuarzo (blanco esmaltado), de cara al alumno. */
function Graduacion({ centro }: { centro: number }) {
  const vf = useVersionFuentes();
  const vTope = 15.5;
  const alto = alturaGas(vTope);
  const ARCO = 0.36;
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    // el lienzo con la proporción de la banda (sin estirar las cifras)
    const H = 2048, W = Math.round((H * ARCO * R_EXT) / alto);
    const c = crearLienzo(W, H);
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    const fam = familiaTexto();
    g.strokeStyle = 'rgba(244,248,250,0.92)'; g.fillStyle = 'rgba(244,248,250,0.95)';
    g.lineCap = 'round';
    for (let k = 0; k <= vTope * 2; k++) {
      const v = k / 2;
      if (v < 1) continue;
      const y = H - (v / vTope) * H;
      const entero = k % 2 === 0, cinco = v % 5 === 0;
      g.lineWidth = cinco ? 9 : entero ? 6 : 4;
      const largo = cinco ? 150 : entero ? 104 : 62;
      g.beginPath(); g.moveTo(W - 8, y); g.lineTo(W - 8 - largo, y); g.stroke();
      if (entero && v % 2 === 0 && v >= 2) {
        g.font = `${cinco || v === 10 ? 700 : 600} 64px ${fam}`;
        g.textAlign = 'right'; g.textBaseline = 'middle';
        g.fillText(String(v), W - 8 - largo - 14, y);
      }
    }
    g.font = `700 60px ${fam}`; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillText('L', W - 14, 6);
    return texturaDeLienzo(c);
  }, [vf, alto]);
  useEffect(() => () => tex?.dispose(), [tex]);
  const geo = useMemo(() => bandaSobrePerfil(() => R_EXT, 0, alto, { arco: ARCO, centro, holgura: 0.0015, filas: 2, segmentos: 24 }), [alto, centro]);
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.02, roughness: 0.4, metalness: 0, depthWrite: false, name: 'q2-graduacion' }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return <mesh geometry={geo} material={mat} position={[0, CAMARA.yFondo, 0]} renderOrder={6} />;
}

export function CamaraCuarzo({ mats, centroGraduacion, temperatura }: { mats: MatsQ2; centroGraduacion: number; temperatura: number }) {
  const kit = useMateriales();
  const segs = kit.calidad === 'alta' ? 96 : 56;
  const H = Y_TAPA - CAMARA.yFondo;
  const geoTubo = useMemo(() => tornear([[CAMARA.R, 0], [R_EXT, 0], [R_EXT, H], [CAMARA.R, H], [CAMARA.R, 0.0001]], segs), [H, segs]);
  useEffect(() => () => geoTubo.dispose(), [geoTubo]);
  const [yi0, yi1] = COTAS.yBridaInf, [ys0, ys1] = COTAS.yBridaSup;
  // bridas y tirantes de inoxidable fundidos por material
  const geoAcero = useMemo(() => {
    const brida = (h: number) => anillo(R_EXT + 0.005, COTAS.rBrida, h, 0.02, segs);
    const partes: Parte[] = [
      { g: brida(yi1 - yi0), p: [0, yi0, 0] },
      { g: brida(ys1 - ys0), p: [0, ys0, 0] },
    ];
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const x = Math.sin(a) * COTAS.rTirante, z = Math.cos(a) * COTAS.rTirante;
      // tirante entre bridas y sus tuercas
      partes.push({ g: cilindro(0.035, 0.035, ys0 - yi1, 16), p: [x, (ys0 + yi1) / 2, z] });
      partes.push({ g: cilindro(0.065, 0.065, 0.07, 6), p: [x, yi1 + 0.035, z], r: [0, a, 0] });
      partes.push({ g: cilindro(0.065, 0.065, 0.07, 6), p: [x, ys0 - 0.035, z], r: [0, a, 0] });
    }
    return fundir(partes);
  }, [segs, yi0, yi1, ys0, ys1]);
  useEffect(() => () => geoAcero.dispose(), [geoAcero]);
  // escarcha que trepa por el cuarzo frío (sobre la cara exterior)
  const geoEscarcha = useMemo(() => tornear([[R_EXT + 0.004, 0], [R_EXT + 0.004, 0.9]], segs), [segs]);
  useEffect(() => () => geoEscarcha.dispose(), [geoEscarcha]);
  const e = escarcha(temperatura);
  return (
    <group>
      <group userData={{ pieza: 'camara' }}>
        <mesh geometry={geoTubo} material={mats.cuarzo} position={[0, CAMARA.yFondo, 0]} renderOrder={4} castShadow customDepthMaterial={kit.sombraVidrio} />
        <Graduacion centro={centroGraduacion} />
      </group>
      <mesh geometry={geoAcero} material={mats.inox} castShadow receiveShadow userData={{ pieza: 'bridas' }} />
      {e > 0.01 && (
        <mesh geometry={geoEscarcha} material={mats.escarchaVidrio} position={[0, yi1 - 0.02, 0]} scale={[1, 0.3 + 0.8 * e, 1]} renderOrder={5} />
      )}
    </group>
  );
}

// ───────────────────────────── tapa, pistón, husillo y volante ─────────────────────────────

/** Tapa con la tuerca de bronce del husillo y las tuercas de los tirantes. Origen: y = 0 de la escena. */
export function Tapa({ mats }: { mats: MatsQ2 }) {
  const kit = useMateriales();
  const segs = kit.calidad === 'alta' ? 96 : 56;
  const geo = useMemo(() => {
    const h = COTAS.altoTapa, R = COTAS.rBrida;
    // disco con chaflán y el agujero del husillo
    const disco = tornear([[0.1, 0], [R - 0.03, 0], [R, 0.03], [R, h - 0.04], [R - 0.04, h], [0.1, h], [0.1, 0.0001]], segs);
    const partes: Parte[] = [{ g: disco, p: [0, Y_TAPA, 0] }];
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const x = Math.sin(a) * COTAS.rTirante, z = Math.cos(a) * COTAS.rTirante;
      partes.push({ g: cilindro(0.065, 0.065, 0.08, 6), p: [x, Y_TOPE_TAPA + 0.04, z], r: [0, a, 0] });
      partes.push({ g: cilindro(0.035, 0.035, 0.05, 16), p: [x, Y_TOPE_TAPA + 0.1, z] });
    }
    const g = fundir(partes);
    disco.dispose();
    return g;
  }, [segs]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group userData={{ pieza: 'husillo' }}>
      <mesh geometry={geo} material={mats.inox} castShadow receiveShadow />
      {/* tuerca de bronce (hexagonal) del husillo */}
      <mesh geometry={cilindro(0.24, 0.24, 0.17, 6)} material={mats.bronce} position={[0, Y_TOPE_TAPA + 0.085, 0]} castShadow />
      <mesh geometry={cilindro(0.2, 0.24, 0.04, 6)} material={mats.bronce} position={[0, Y_TOPE_TAPA + 0.19, 0]} castShadow />
    </group>
  );
}

/** Husillo roscado (anillos torneados de 5 mm) — se fabrica una vez. */
let GEO_HUSILLO: THREE.BufferGeometry | null = null;
function geoHusillo() {
  if (!GEO_HUSILLO) {
    const L = COTAS.largoHusillo, p = COTAS.pasoHusillo;
    const pts: P2[] = [[0.0005, 0], [0.07, 0]];
    for (let y = 0.02; y < L - 0.04; y += p) pts.push([0.075, y], [0.088, y + p * 0.35], [0.088, y + p * 0.5], [0.075, y + p * 0.85]);
    pts.push([0.075, L - 0.02], [0.06, L], [0.0005, L]);
    GEO_HUSILLO = tornear(pts, 20);
  }
  return GEO_HUSILLO;
}

/**
 * Pistón + husillo + volante, como una sola pieza que sube y baja. Origen: la cara
 * inferior del pistón (la que toca el gas). `giro` (rad) hace girar el volante.
 */
export const ConjuntoPiston = React.forwardRef<THREE.Group, GroupProps & { mats: MatsQ2; giro: React.MutableRefObject<number> }>(
  function ConjuntoPiston({ mats, giro, ...g }, ref) {
    const kit = useMateriales();
    const segs = kit.calidad === 'alta' ? 72 : 40;
    const e = COTAS.espesorPiston;
    const geoPiston = useMemo(() => {
      const r = CAMARA.R - 0.004;
      // ranuras de las juntas a 1/4 y 3/4 del espesor
      const ranura = (y: number): P2[] => [[r, y - 0.035], [r - 0.03, y - 0.03], [r - 0.03, y + 0.03], [r, y + 0.035]];
      const p: P2[] = [[0.0005, 0], [r - 0.012, 0], [r, 0.012], ...ranura(e * 0.28), ...ranura(e * 0.72), [r, e - 0.012], [r - 0.02, e], [0.22, e], [0.2, e + 0.08], [0.0005, e + 0.08]];
      return tornear(p, segs);
    }, [segs, e]);
    useEffect(() => () => geoPiston.dispose(), [geoPiston]);
    const volante = useRef<THREE.Group>(null);
    useFrame(() => { if (volante.current) volante.current.rotation.y = giro.current; });
    const geoVolante = useMemo(() => {
      const R = COTAS.rVolante;
      const partes: Parte[] = [];
      // tres radios del cubo a la llanta (el cilindro, tumbado sobre X y girado a su ángulo)
      for (let k = 0; k < 3; k++) {
        const a = (k * 2 * Math.PI) / 3, d = R / 2 + 0.03;
        partes.push({ g: cilindro(0.03, 0.038, R - 0.1, 12), p: [Math.cos(a) * d, -0.04, -Math.sin(a) * d], r: [0, a, -Math.PI / 2] });
      }
      partes.push({ g: cilindro(0.11, 0.12, 0.16, 28), p: [0, 0, 0] });
      return fundir(partes);
    }, []);
    useEffect(() => () => geoVolante.dispose(), [geoVolante]);
    const yHusillo = e + 0.08;
    return (
      <group ref={ref} {...g}>
        <group userData={{ pieza: 'piston' }}>
          <mesh geometry={geoPiston} material={kit.aluminio} castShadow receiveShadow />
          {[0.28, 0.72].map((k) => (
            <mesh key={k} geometry={toro(CAMARA.R - 0.026, 0.026, 10, segs)} material={mats.junta} position={[0, e * k, 0]} rotation-x={Math.PI / 2} />
          ))}
        </group>
        <group userData={{ pieza: 'husillo' }}>
          <mesh geometry={geoHusillo()} material={mats.inoxPulido} position={[0, yHusillo, 0]} castShadow />
          <group ref={volante} position={[0, yHusillo + COTAS.largoHusillo, 0]}>
            <mesh geometry={geoVolante} material={mats.inoxPulido} castShadow />
            <mesh geometry={toro(COTAS.rVolante, 0.055, 14, 72)} material={mats.fenolico} rotation-x={Math.PI / 2} position={[0, -0.07, 0]} castShadow />
            <mesh geometry={cilindro(0.045, 0.05, 0.26, 18)} material={mats.fenolico} position={[COTAS.rVolante, 0.08, 0]} castShadow />
          </group>
        </group>
      </group>
    );
  },
);

// ───────────────────────────── esferas de los instrumentos ─────────────────────────────

const A0 = (-225 * Math.PI) / 180, A1 = (45 * Math.PI) / 180;

interface Escala {
  min: number; max: number;
  /** marcas mayores numeradas y menores por mayor */
  paso: number; menores: number;
  color: string;
  /** radios relativos al de la esfera: arco, final de marcas mayores/menores y números */
  rArco: number; rMayor: number; rMenor: number; rTexto: number;
  tamTexto: number;
  /** convierte el valor de esta escala al de la escala principal (posición) */
  aPrincipal?: (v: number) => number;
  /** etiqueta numérica de cada mayor */
  texto?: (v: number) => string | null;
}

function dibujarEsfera(ctx: CanvasRenderingContext2D, W: number, escalas: Escala[], principal: { min: number; max: number },
  zonaRoja: [number, number] | null, unidad: string, segunda: string, clase: string) {
  const fam = familiaTexto();
  const c = W / 2, r = W * 0.47;
  const g = ctx.createRadialGradient(c, c * 0.82, r * 0.08, c, c, r * 1.05);
  g.addColorStop(0, '#fbfbf8'); g.addColorStop(1, '#ebeae4');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, W / 2, 0, Math.PI * 2); ctx.fill();
  const ang = (v: number) => A0 + ((v - principal.min) / (principal.max - principal.min)) * (A1 - A0);
  if (zonaRoja) {
    ctx.strokeStyle = '#c62828'; ctx.lineWidth = W * 0.028;
    ctx.beginPath(); ctx.arc(c, c, r * 0.885, ang(zonaRoja[0]), ang(zonaRoja[1])); ctx.stroke();
  }
  for (const e of escalas) {
    const pos = e.aPrincipal ?? ((v: number) => v);
    ctx.strokeStyle = e.color; ctx.fillStyle = e.color;
    ctx.lineWidth = W * 0.0035;
    ctx.beginPath(); ctx.arc(c, c, r * e.rArco, ang(pos(e.min)), ang(pos(e.max))); ctx.stroke();
    const total = Math.round((e.max - e.min) / e.paso) * e.menores;
    for (let i = 0; i <= total; i++) {
      const v = e.min + (i * e.paso) / e.menores;
      const vp = pos(v);
      if (vp < principal.min - 1e-9 || vp > principal.max + 1e-9) continue;
      const a = ang(vp);
      const mayor = i % e.menores === 0;
      const medio = !mayor && e.menores % 2 === 0 && i % (e.menores / 2) === 0;
      const r2 = r * (mayor ? e.rMayor : medio ? (e.rMayor + e.rMenor) / 2 : e.rMenor);
      ctx.lineWidth = W * (mayor ? 0.0075 : 0.0035);
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * r * e.rArco, c + Math.sin(a) * r * e.rArco); ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2); ctx.stroke();
      if (mayor) {
        const t = e.texto ? e.texto(v) : String(v);
        if (t) {
          ctx.font = `600 ${W * e.tamTexto}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(t, c + Math.cos(a) * r * e.rTexto, c + Math.sin(a) * r * e.rTexto);
        }
      }
    }
  }
  ctx.fillStyle = '#15191c';
  ctx.font = `700 ${W * 0.075}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(unidad, c, c + r * 0.4);
  ctx.fillStyle = '#9b2a22'; ctx.font = `600 ${W * 0.045}px ${fam}`;
  ctx.fillText(segunda, c, c + r * 0.58);
  ctx.fillStyle = '#6a7177'; ctx.font = `500 ${W * 0.03}px ${fam}`;
  ctx.fillText(clase, c, c - r * 0.3);
}

/** Ángulo de la aguja (rotación z) para un valor de la escala principal. */
const anguloAguja = (v: number, min: number, max: number) => {
  const t = Math.max(-0.02, Math.min(1.02, (v - min) / (max - min)));
  return -(A0 + t * (A1 - A0)) - Math.PI / 2;
};

interface PropsInstrumento extends GroupProps {
  mats: MatsQ2;
  diametro: number;
  lectura: () => number;
  min: number; max: number;
  escalas: Escala[];
  zonaRoja?: [number, number] | null;
  unidad: string; segunda: string; clase: string;
  /** periodo propio de la aguja (s) */
  periodo?: number;
  reducido?: boolean;
  /** vástago inferior (Bourdon) */
  vastago?: boolean;
}

/** Instrumento de esfera con caja de inoxidable, bisel cromado, cristal y aguja amortiguada. */
function InstrumentoEsfera({ mats, diametro, lectura, min, max, escalas, zonaRoja = null, unidad, segunda, clase, periodo = 0.6, reducido = false, vastago = true, ...g }: PropsInstrumento) {
  const kit = useMateriales();
  const vf = useVersionFuentes();
  const R = diametro / 2;
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = kit.calidad === 'alta' ? 1024 : 768;
    const c = crearLienzo(W, W);
    dibujarEsfera(c.getContext('2d')!, W, escalas, { min, max }, zonaRoja, unidad, segunda, clase);
    return texturaDeLienzo(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vf, kit.calidad, min, max, unidad, segunda, clase]);
  useEffect(() => () => tex?.dispose(), [tex]);
  // cartulina mate: bajo la luz clave no se quema
  const matEsfera = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, color: '#dcdad2', roughness: 0.78, metalness: 0, name: 'q2-esfera' }), [tex]);
  useEffect(() => () => matEsfera.dispose(), [matEsfera]);
  const geoCaja = useMemo(() => {
    const p: P2[] = [[0.0005, -0.16 * R], [R * 0.96, -0.16 * R], [R * 1.03, -0.12 * R], [R * 1.04, 0], [R * 0.99, 0.006], [0.0005, 0.006]];
    const geo = tornear(p, 64); geo.rotateX(Math.PI / 2);
    return geo;
  }, [R]);
  const geoBisel = useMemo(() => {
    const p: P2[] = [[R * 0.965, 0.0], [R * 1.055, 0.0], [R * 1.08, 0.025], [R * 1.05, 0.06], [R * 0.99, 0.066], [R * 0.95, 0.04], [R * 0.965, 0.0]];
    const geo = tornear(p, 72); geo.rotateX(Math.PI / 2);
    return geo;
  }, [R]);
  const geoAguja = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.02, -0.16); s.lineTo(0.02, -0.16); s.lineTo(0.008, 0.86); s.lineTo(0, 0.9); s.lineTo(-0.008, 0.86); s.lineTo(-0.02, -0.16);
    return fundir([{ g: extruir(s, 0.012, 4) }, { g: cilindro(0.06, 0.06, 0.02, 20), p: [0, 0, 0.012], r: [Math.PI / 2, 0, 0] }]);
  }, []);
  useEffect(() => () => { geoCaja.dispose(); geoBisel.dispose(); geoAguja.dispose(); }, [geoCaja, geoBisel, geoAguja]);
  const aguja = useRef<THREE.Group>(null);
  const din = useRef({ th: anguloAguja(lectura(), min, max), w: 0 });
  useFrame((_, dt) => {
    const a = aguja.current; if (!a) return;
    const obj = anguloAguja(lectura(), min, max);
    const d = din.current;
    if (reducido) { d.th = obj; d.w = 0; a.rotation.z = obj; return; }
    const h = Math.min(dt, 0.05), wn = (2 * Math.PI) / periodo, z = 0.7;
    d.w += (wn * wn * (obj - d.th) - 2 * z * wn * d.w) * h;
    d.th += d.w * h;
    a.rotation.z = d.th;
  });
  return (
    <group {...g}>
      <mesh geometry={geoCaja} material={mats.inox} castShadow />
      <mesh geometry={geoBisel} material={kit.cromo} castShadow />
      <mesh material={matEsfera} position={[0, 0, 0.008]}><circleGeometry args={[R * 0.965, 72]} /></mesh>
      <group ref={aguja} position={[0, 0, 0.02]} scale={[R * 0.86, R * 0.86, 1]}>
        <mesh geometry={geoAguja} material={mats.negroMate} />
      </group>
      <mesh material={kit.vidrio} position={[0, 0, 0.05]} renderOrder={3}><circleGeometry args={[R * 0.965, 64]} /></mesh>
      {vastago && (
        <group position={[0, -R * 1.02, -0.06]}>
          <mesh geometry={cilindro(0.075, 0.075, 0.1, 6)} material={kit.laton} position={[0, -0.06, 0]} castShadow />
          <mesh geometry={cilindro(0.045, 0.045, 0.14, 16)} material={kit.laton} position={[0, -0.17, 0]} castShadow />
        </group>
      )}
    </group>
  );
}

/** Manómetro de Bourdon: 0–8 atm (zona roja desde 7) con escala interior en kPa. */
export function Manometro({ mats, lectura, reducido, ...g }: GroupProps & { mats: MatsQ2; lectura: () => number; reducido?: boolean }) {
  const { diametro } = COTAS.manometro;
  const escalas = useMemo<Escala[]>(() => [
    { min: 0, max: 8, paso: 1, menores: 10, color: '#15191c', rArco: 0.93, rMayor: 0.8, rMenor: 0.87, rTexto: 0.67, tamTexto: 0.075 },
    {
      min: 0, max: 800, paso: 100, menores: 2, color: '#9b2a22', rArco: 0.5, rMayor: 0.56, rMenor: 0.53, rTexto: 0.41, tamTexto: 0.04,
      aPrincipal: (kPa) => kPa / 101.325, texto: (v) => (v % 200 === 0 ? String(v) : null),
    },
  ], []);
  return (
    <group {...g} userData={{ pieza: 'manometro' }}>
      <InstrumentoEsfera mats={mats} diametro={diametro} lectura={lectura} min={0} max={8} escalas={escalas} zonaRoja={[7, 8]}
        unidad="atm" segunda="kPa" clase="Clase 1,0" periodo={0.7} reducido={reducido} />
    </group>
  );
}

/** Termómetro bimetálico: 0–1000 K con escala interior en °C. */
export function Termometro({ mats, lectura, reducido, ...g }: GroupProps & { mats: MatsQ2; lectura: () => number; reducido?: boolean }) {
  const { diametro } = COTAS.termometro;
  const escalas = useMemo<Escala[]>(() => [
    { min: 0, max: 1000, paso: 100, menores: 5, color: '#15191c', rArco: 0.93, rMayor: 0.79, rMenor: 0.87, rTexto: 0.65, tamTexto: 0.068, texto: (v) => (v % 200 === 0 ? String(v) : null) },
    {
      min: -200, max: 700, paso: 100, menores: 2, color: '#9b2a22', rArco: 0.5, rMayor: 0.57, rMenor: 0.535, rTexto: 0.4, tamTexto: 0.042,
      aPrincipal: (C) => C + 273.15, texto: (v) => (v % 200 === 0 ? (v < 0 ? '−' + Math.abs(v) : String(v)) : null),
    },
  ], []);
  return (
    <group {...g} userData={{ pieza: 'termometro' }}>
      <InstrumentoEsfera mats={mats} diametro={diametro} lectura={lectura} min={0} max={1000} escalas={escalas}
        unidad="K" segunda="°C" clase="Bimetálico" periodo={1.6} reducido={reducido} vastago={false} />
    </group>
  );
}

// ───────────────────────────── tuberías de los instrumentos ─────────────────────────────

/** Tubo de inoxidable de Ø 9 mm por una polilínea con codos redondeados. */
export function TuboInox({ puntos, mats, radio = 0.045 }: { puntos: V3[]; mats: MatsQ2; radio?: number }) {
  const geo = useMemo(() => {
    // codos: cada esquina se redondea con una Bézier cuadrática
    const pts: number[] = [];
    const P = puntos.map((p) => new THREE.Vector3(...p));
    pts.push(...P[0].toArray());
    for (let i = 1; i < P.length - 1; i++) {
      const a = P[i - 1], b = P[i], c = P[i + 1];
      const ra = Math.min(0.12, a.distanceTo(b) / 2), rc = Math.min(0.12, b.distanceTo(c) / 2);
      const p0 = b.clone().addScaledVector(a.clone().sub(b).normalize(), ra), p2 = b.clone().addScaledVector(c.clone().sub(b).normalize(), rc);
      const q = new THREE.QuadraticBezierCurve3(p0, b, p2);
      for (let k = 0; k <= 8; k++) pts.push(...q.getPoint(k / 8).toArray());
    }
    pts.push(...P[P.length - 1].toArray());
    return tuboPolilinea(pts, radio, 14, true);
  }, [puntos, radio]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={mats.inox} castShadow />;
}

// ───────────────────────────── botella de gas y válvula ─────────────────────────────

/** Color normalizado del hombro de la botella (He marrón, Ne rojo-marrón, CO₂ gris). */
export const COLOR_BOTELLA: Record<IdGas, string> = { He: '#8e6136', Ne: '#9d3d31', CO2: '#7b858b' };

export function BotellaGas({ gas, mats, ...g }: GroupProps & { gas: IdGas; mats: MatsQ2 }) {
  const kit = useMateriales();
  const segs = kit.calidad === 'alta' ? 56 : 32;
  const cuerpo: P2[] = useMemo(() => [[0.0005, 0], [0.47, 0], [0.52, 0.04], [0.53, 0.1], [0.53, 2.5], [0.5, 2.8], [0.33, 3.06], [0.17, 3.17], [0.0005, 3.19]], []);
  const geoCuerpo = useMemo(() => tornear(cuerpo, segs), [cuerpo, segs]);
  const geoHombro = useMemo(() => tornear([[0.533, 2.25], [0.533, 2.5], [0.503, 2.8], [0.333, 3.06], [0.173, 3.17]], segs), [segs]);
  useEffect(() => () => { geoCuerpo.dispose(); geoHombro.dispose(); }, [geoCuerpo, geoHombro]);
  const matCuerpo = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#2f353a', metalness: 0.35, roughness: 0.38, clearcoat: kit.calidad === 'alta' ? 0.5 : 0, clearcoatRoughness: 0.3, name: 'q2-botella' }), [kit.calidad]);
  const matHombro = useMemo(() => new THREE.MeshPhysicalMaterial({ color: COLOR_BOTELLA[gas], metalness: 0.3, roughness: 0.4, clearcoat: kit.calidad === 'alta' ? 0.5 : 0, clearcoatRoughness: 0.3, name: 'q2-hombro' }), [gas, kit.calidad]);
  useEffect(() => () => { matCuerpo.dispose(); matHombro.dispose(); }, [matCuerpo, matHombro]);
  return (
    <group {...g} userData={{ pieza: 'botella' }}>
      <mesh geometry={geoCuerpo} material={matCuerpo} castShadow receiveShadow />
      <mesh geometry={geoHombro} material={matHombro} castShadow />
      {/* válvula de la botella y regulador de latón con su manómetro */}
      <mesh geometry={cilindro(0.13, 0.16, 0.3, 24)} material={kit.laton} position={[0, 3.32, 0]} castShadow />
      <mesh geometry={cajaRedondeada(0.36, 0.34, 0.36, 0.07)} material={kit.laton} position={[0, 3.62, 0]} castShadow />
      <mesh geometry={cilindro(0.1, 0.1, 0.4, 18)} material={kit.laton} position={[0.3, 3.62, 0]} rotation-z={Math.PI / 2} castShadow />
      <mesh geometry={cilindro(0.17, 0.17, 0.07, 32)} material={kit.cromo} position={[0, 3.62, 0.21]} rotation-x={Math.PI / 2} />
      <mesh geometry={cilindro(0.15, 0.15, 0.02, 32)} material={mats.negroMate} position={[0, 3.62, 0.25]} rotation-x={Math.PI / 2} />
      <mesh geometry={cilindro(0.13, 0.13, 0.18, 20)} material={mats.fenolico} position={[0, 3.92, 0]} castShadow />
    </group>
  );
}
/** Salida del regulador, relativa a la botella. */
export const SALIDA_BOTELLA: V3 = [0.5, 3.62, 0];

/** Válvula de aguja de entrada; el volante gira un poco con cada inyección. Origen: su base. */
export function ValvulaAguja({ mats, giro = 0, reducido = false, ...g }: GroupProps & { mats: MatsQ2; giro?: number; reducido?: boolean }) {
  const kit = useMateriales();
  const volante = useRef<THREE.Group>(null);
  const actual = useRef(giro);
  useFrame((_, dt) => {
    const v = volante.current; if (!v) return;
    actual.current = reducido ? giro : actual.current + (giro - actual.current) * Math.min(1, dt * 5);
    v.rotation.y = actual.current;
  });
  return (
    <group {...g} userData={{ pieza: 'valvula' }}>
      <mesh geometry={cajaRedondeada(0.26, 0.3, 0.26, 0.05)} material={kit.laton} position={[0, 0.15, 0]} castShadow />
      <mesh geometry={cilindro(0.075, 0.075, 0.5, 18)} material={kit.laton} position={[-0.22, 0.17, 0]} rotation-z={Math.PI / 2} castShadow />
      <mesh geometry={cilindro(0.06, 0.06, 0.3, 14)} material={kit.cromo} position={[0, 0.42, 0]} castShadow />
      <group ref={volante} position={[0, 0.6, 0]}>
        <mesh geometry={cilindro(0.2, 0.2, 0.05, 32)} material={mats.fenolico} castShadow />
        <mesh geometry={cilindro(0.035, 0.035, 0.42, 12)} material={mats.fenolico} rotation-z={Math.PI / 2} position={[0, 0.035, 0]} />
      </group>
    </group>
  );
}
/** Entrada de la válvula (para la manguera), relativa a su origen. */
export const ENTRADA_VALVULA: V3 = [-0.47, 0.17, 0];

/** Manguera de gas trenzada entre dos puntos (catenaria corta). */
export function Manguera({ desde, hasta, mats, holgura = 0.5 }: { desde: V3; hasta: V3; mats: MatsQ2; holgura?: number }) {
  const geo = useMemo(() => {
    const A = new THREE.Vector3(...desde), B = new THREE.Vector3(...hasta);
    const medio = A.clone().lerp(B, 0.5); medio.y -= holgura;
    const c = new THREE.CatmullRomCurve3([A, A.clone().lerp(medio, 0.5).setY(Math.min(A.y, medio.y + holgura * 0.3)), medio, B.clone().lerp(medio, 0.5), B]);
    const pts: number[] = [];
    for (let k = 0; k <= 48; k++) pts.push(...c.getPoint(k / 48).toArray());
    return tuboPolilinea(pts, 0.04, 12, true);
  }, [desde, hasta, holgura]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={mats.trenza} castShadow />;
}

export { AREA_DM2 };
