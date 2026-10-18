'use client';
/**
 * mat05/piezas.tsx — el INSTRUMENTO del círculo trigonométrico (1 u = el radio del círculo
 * unitario; en el aparato real, 10 cm):
 *
 *  - ARO DE LATÓN de Ø27 cm, torneado con chaflanes, con la escala GRABADA y rellena de
 *    laca negra (como un transportador de instrumento): marcas de 1°, 5° y 10°, números
 *    cada 30°. El grabado es mate y no metálico; el latón, pulido.
 *  - DISCO DE VIDRIO engastado en el aro, con el círculo unitario (r = 1), los ejes y las
 *    marcas de π/12 GRABADOS AL ÁCIDO (blanco esmerilado); el arco de «1 rad» enseña qué es
 *    un radián. Eje central de latón.
 *  - ÍNDICE DE LECTURA: un hilo rojo sobre la escala, en una pinza de latón que gira con θ.
 *  - PANEL DE LA ONDA: lámina de vidrio sostenida por dos postes de latón, con el eje θ en
 *    radianes, las líneas ±1 y las verticales de π/2 grabadas. La traza es luz (luz.ts).
 *  - PLINTO lacado en negro y suelo de estudio que se funde con el fondo.
 *
 * Ejes: el círculo y el panel están en el plano z = 0 (cara del vidrio en z = −0,01); la
 * luz va en z = LZ, justo delante. Nada de cifras en 3D: sólo el grabado del instrumento.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { cajaRedondeada, cilindro, sanearNormales, crearLienzo, texturaDeLienzo, familiaTexto, useVersionFuentes, type Calidad } from '../_kit';
import { X0_ONDA, LARGO_ONDA, ESCALA_ONDA } from './reloj';

// ───────────────────────────── cotas ─────────────────────────────

export const R_IN = 1.07;
export const R_OUT = 1.36;
const CH = 0.012;
export const Z_ARO_FRENTE = -0.006;
const Z_ARO_ATRAS = -0.1;
export const R_VIDRIO = 1.09;
export const Z_VIDRIO = -0.01;
/** Plano de la luz (segmentos, trazas, destellos): delante del aro y del vidrio. */
export const LZ = 0.008;
/** Cubierta del plinto. */
export const Y_PLINTO = -1.8;
const ALTO_PLINTO = 0.2;
/** Panel de la onda. */
export const PANEL = {
  x0: X0_ONDA - 0.14, x1: X0_ONDA + LARGO_ONDA + 0.14, y0: -1.3, y1: 1.3,
};
export const X_PLINTO: [number, number] = [-1.78, PANEL.x1 + 0.34];
export const Z_PLINTO: [number, number] = [-0.5, 0.5];

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsM5 {
  laton: THREE.MeshPhysicalMaterial;
  latonSatinado: THREE.MeshPhysicalMaterial;
  vidrio: THREE.MeshPhysicalMaterial;
  laca: THREE.MeshPhysicalMaterial;
  bronce: THREE.MeshPhysicalMaterial;
  acero: THREE.MeshStandardMaterial;
  hilo: THREE.MeshBasicMaterial;
}

export function useMatsM5(calidad: Calidad): MatsM5 {
  const m = useMemo<MatsM5>(() => {
    const alta = calidad === 'alta';
    return {
      // latón pulido: metal con F0 dorado, reflejo nítido del estudio
      laton: new THREE.MeshPhysicalMaterial({ color: '#d9b56c', metalness: 1, roughness: 0.2, clearcoat: 0.25, clearcoatRoughness: 0.18, name: 'm5-laton' }),
      latonSatinado: new THREE.MeshPhysicalMaterial({ color: '#cfa860', metalness: 1, roughness: 0.34, name: 'm5-laton-sat' }),
      vidrio: alta
        ? new THREE.MeshPhysicalMaterial({
          color: '#ffffff', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.03, ior: 1.52,
          attenuationColor: new THREE.Color('#d6f0ec'), attenuationDistance: 0.8, specularIntensity: 1, envMapIntensity: 1.3,
          transparent: true, depthWrite: false, name: 'm5-vidrio',
        })
        : new THREE.MeshPhysicalMaterial({
          color: '#cfe9ef', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false,
          specularIntensity: 1, envMapIntensity: 1.6, name: 'm5-vidrio-medio',
        }),
      // laca negra de piano: capa transparente brillante sobre negro
      laca: new THREE.MeshPhysicalMaterial({ color: '#0b0d11', metalness: 0, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.07, name: 'm5-laca' }),
      bronce: new THREE.MeshPhysicalMaterial({ color: '#3a3330', metalness: 0.85, roughness: 0.36, clearcoat: 0.3, clearcoatRoughness: 0.3, name: 'm5-bronce' }),
      acero: new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 1, roughness: 0.18, name: 'm5-acero' }),
      hilo: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3b30').multiplyScalar(1.6), toneMapped: false, name: 'm5-hilo' }),
    };
  }, [calidad]);
  useEffect(() => () => { Object.values(m).forEach((x) => x.dispose()); }, [m]);
  return m;
}

// ───────────────────────────── utilidades ─────────────────────────────

/** Torno con el eje en +Z: el perfil es (r, z). Normales saneadas. */
function tornoZ(perfil: [number, number][], segs: number) {
  const g = new THREE.LatheGeometry(perfil.map(([r, z]) => new THREE.Vector2(Math.max(0, r), z)), segs);
  g.rotateX(Math.PI / 2); // la altura del torno (y) pasa a z
  return sanearNormales(g);
}

/** Torno con el eje en +Y (columnas y postes). */
function tornoY(perfil: [number, number][], segs: number) {
  const g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), segs);
  return sanearNormales(g);
}

// ───────────────────────────── aro graduado ─────────────────────────────

const R_CARA_IN = R_IN + CH, R_CARA_OUT = R_OUT - CH;

/** Cara del aro: color (`orm` = false) o rugosidad/metalicidad (`orm` = true: G = rugosidad, B = metalicidad). */
function dibujarAro(ctx: CanvasRenderingContext2D, S: number, orm: boolean) {
  const k = S / (2 * R_CARA_OUT), c = S / 2;
  const P = (r: number, a: number): [number, number] => [c + r * Math.cos(a) * k, c - r * Math.sin(a) * k];
  // fondo: latón (blanco en el mapa de color: lo tiñe el material); en ORM, pulido y metálico
  if (orm) {
    ctx.fillStyle = `rgb(0, ${Math.round(0.22 * 255)}, 255)`; ctx.fillRect(0, 0, S, S);
    // variación MUY suave y de baja frecuencia del pulido (manchas de 10–20 cm)
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 9; i++) {
      const x = rnd() * S, y = rnd() * S, r = S * (0.2 + rnd() * 0.25);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const v = Math.round((0.17 + rnd() * 0.12) * 255);
      g.addColorStop(0, `rgba(0, ${v}, 255, 0.55)`); g.addColorStop(1, `rgba(0, ${v}, 255, 0)`);
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  } else {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
  }
  // grabado relleno de laca: oscuro, mate (G alto) y no metálico (B = 0)
  const tinta = orm ? `rgb(0, ${Math.round(0.62 * 255)}, 0)` : '#1d160d';
  ctx.strokeStyle = tinta; ctx.fillStyle = tinta; ctx.lineCap = 'butt';
  const r0 = R_CARA_IN + 0.004;
  const linea = (a: number, ra: number, rb: number, w: number) => {
    const [x0, y0] = P(ra, a), [x1, y1] = P(rb, a);
    ctx.lineWidth = w * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  };
  for (let g = 0; g < 360; g++) {
    const a = (g * Math.PI) / 180;
    if (g % 90 === 0) linea(a, r0, r0 + 0.13, 0.0085);
    else if (g % 10 === 0) linea(a, r0, r0 + 0.088, 0.0065);
    else if (g % 5 === 0) linea(a, r0, r0 + 0.062, 0.005);
    else linea(a, r0, r0 + 0.036, 0.0036);
  }
  const anillo = (r: number, w: number) => { ctx.lineWidth = w * k; ctx.beginPath(); ctx.arc(c, c, r * k, 0, Math.PI * 2); ctx.stroke(); };
  anillo(r0, 0.004);
  anillo(R_CARA_OUT - 0.035, 0.003);
  // números cada 30°, derechos para quien mira de frente
  ctx.font = `600 ${Math.round(0.082 * k)}px ${familiaTexto()}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let g = 0; g < 360; g += 30) {
    const a = (g * Math.PI) / 180;
    const [x, y] = P(1.262, a);
    ctx.fillText(String(g), x, y);
  }
}

function useTexturasAro(calidad: Calidad) {
  const vf = useVersionFuentes();
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const S = calidad === 'alta' ? 2048 : 1024;
    const col = crearLienzo(S, S), orm = crearLienzo(S, S);
    dibujarAro(col.getContext('2d')!, S, false);
    dibujarAro(orm.getContext('2d')!, S, true);
    const mapa = texturaDeLienzo(col), rug = texturaDeLienzo(orm, { srgb: false });
    mapa.anisotropy = 16; rug.anisotropy = 16;
    return { mapa, rug };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calidad, vf]);
  useEffect(() => () => { tex?.mapa.dispose(); tex?.rug.dispose(); }, [tex]);
  return tex;
}

export function AroGraduado({ mats, calidad }: { mats: MatsM5; calidad: Calidad }) {
  const tex = useTexturasAro(calidad);
  const segs = calidad === 'alta' ? 256 : 128;
  const geos = useMemo(() => {
    const cara = new THREE.RingGeometry(R_CARA_IN, R_CARA_OUT, segs, 1);
    // canto exterior (perfil hacia +z: normales hacia fuera) e interior (hacia −z: hacia el eje)
    const exterior = tornoZ([
      [R_OUT - CH, Z_ARO_ATRAS], [R_OUT, Z_ARO_ATRAS + CH], [R_OUT, Z_ARO_FRENTE - CH], [R_OUT - CH, Z_ARO_FRENTE],
    ], segs);
    const interior = tornoZ([
      [R_IN + CH, Z_ARO_FRENTE], [R_IN, Z_ARO_FRENTE - CH], [R_IN, Z_ARO_ATRAS],
    ], segs);
    const trasera = new THREE.RingGeometry(R_IN, R_OUT - CH, segs, 1);
    trasera.rotateY(Math.PI);
    trasera.translate(0, 0, Z_ARO_ATRAS);
    cara.translate(0, 0, Z_ARO_FRENTE);
    return { cara, exterior, interior, trasera };
  }, [segs]);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  const matCara = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#d9b56c', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, metalnessMap: tex?.rug ?? null,
    roughness: 1, metalness: 1, clearcoat: 0.25, clearcoatRoughness: 0.2, name: 'm5-aro-cara',
  }), [tex]);
  useEffect(() => () => matCara.dispose(), [matCara]);
  return (
    <group userData={{ pieza: 'aro' }}>
      <mesh geometry={geos.cara} material={matCara} receiveShadow />
      <mesh geometry={geos.exterior} material={mats.laton} castShadow receiveShadow />
      <mesh geometry={geos.interior} material={mats.laton} receiveShadow />
      <mesh geometry={geos.trasera} material={mats.latonSatinado} castShadow />
    </group>
  );
}

// ───────────────────────────── disco de vidrio grabado ─────────────────────────────

/** Grabado al ácido del disco: blanco esmerilado sobre transparente. */
function dibujarVidrio(ctx: CanvasRenderingContext2D, S: number) {
  const k = S / (2 * R_VIDRIO), c = S / 2;
  const P = (r: number, a: number): [number, number] => [c + r * Math.cos(a) * k, c - r * Math.sin(a) * k];
  ctx.clearRect(0, 0, S, S);
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineCap = 'round';
  // el círculo unitario (r = 1)
  ctx.globalAlpha = 0.95; ctx.lineWidth = 0.0075 * k;
  ctx.beginPath(); ctx.arc(c, c, 1 * k, 0, Math.PI * 2); ctx.stroke();
  // ejes
  ctx.globalAlpha = 0.6; ctx.lineWidth = 0.0045 * k;
  const eje = (x0: number, y0: number, x1: number, y1: number) => { ctx.beginPath(); ctx.moveTo(c + x0 * k, c - y0 * k); ctx.lineTo(c + x1 * k, c - y1 * k); ctx.stroke(); };
  eje(-R_IN, 0, R_IN, 0); eje(0, -R_IN, 0, R_IN);
  // marcas de π/12 hacia dentro del círculo
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const largo = i % 6 === 0 ? 0.07 : i % 2 === 0 ? 0.05 : 0.032;
    const [x0, y0] = P(1 - largo, a), [x1, y1] = P(1, a);
    ctx.globalAlpha = 0.75; ctx.lineWidth = 0.004 * k;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  // el radián: arco de longitud 1 sobre un círculo de radio 0,8 es 0,8 rad… se graba en r = 1
  // como banda: de 0 a 1 rad, por dentro, con sus topes
  const rr = 0.9;
  ctx.globalAlpha = 0.55; ctx.lineWidth = 0.0045 * k; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.arc(c, c, rr * k, 0, -1, true); ctx.stroke();
  for (const a of [0, 1]) { const [x0, y0] = P(rr - 0.025, a), [x1, y1] = P(rr + 0.025, a); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  // rótulos de la escala en radianes (pocos y pequeños)
  ctx.globalAlpha = 0.8;
  ctx.font = `500 ${Math.round(0.07 * k)}px ${familiaTexto()}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const rot = (t: string, r: number, a: number, dx = 0, dy = 0) => { const [x, y] = P(r, a); ctx.fillText(t, x + dx * k, y - dy * k); };
  rot('π/2', 0.84, Math.PI / 2, 0.1, 0);
  rot('π', 0.86, Math.PI, 0, 0.07);
  rot('3π/2', 0.84, (3 * Math.PI) / 2, 0.12, 0);
  rot('0 · 2π', 0.8, 0, 0, -0.07);
  ctx.font = `500 ${Math.round(0.058 * k)}px ${familiaTexto()}`;
  rot('1 rad', 0.79, 0.5, 0, 0);
  ctx.globalAlpha = 1;
}

function useTexturaVidrio(calidad: Calidad) {
  const vf = useVersionFuentes();
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const S = calidad === 'alta' ? 2048 : 1024;
    const c = crearLienzo(S, S);
    dibujarVidrio(c.getContext('2d')!, S);
    const t = texturaDeLienzo(c);
    t.anisotropy = 16;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calidad, vf]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

export function DiscoVidrio({ mats, calidad }: { mats: MatsM5; calidad: Calidad }) {
  const tex = useTexturaVidrio(calidad);
  const segs = calidad === 'alta' ? 160 : 96;
  const geos = useMemo(() => {
    const disco = new THREE.CylinderGeometry(R_VIDRIO, R_VIDRIO, 0.03, segs, 1);
    disco.rotateX(Math.PI / 2);
    disco.translate(0, 0, Z_VIDRIO - 0.015);
    const grabado = new THREE.CircleGeometry(R_VIDRIO, segs);
    grabado.translate(0, 0, Z_VIDRIO + 0.0006);
    // eje: botón de latón torneado (no sobresale del plano de la luz)
    const boton = tornoZ([[0, -0.003], [0.026, -0.003], [0.034, -0.008], [0.034, Z_VIDRIO - 0.03], [0, Z_VIDRIO - 0.03]].reverse() as [number, number][], 40);
    return { disco, grabado, boton };
  }, [segs]);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  const matGrabado = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.5, depthWrite: false, color: '#eaf4f7', name: 'm5-grabado-vidrio',
  }), [tex]);
  useEffect(() => () => matGrabado.dispose(), [matGrabado]);
  return (
    <group userData={{ pieza: 'disco' }}>
      <mesh geometry={geos.disco} material={mats.vidrio} renderOrder={1} />
      <mesh geometry={geos.grabado} material={matGrabado} renderOrder={2} />
      <mesh geometry={geos.boton} material={mats.laton} castShadow />
    </group>
  );
}

// ───────────────────────────── índice de lectura ─────────────────────────────

/** Hilo rojo sobre la escala, en una pinza de latón. Origen = centro; el grupo se gira θ. */
export function IndiceLectura({ mats }: { mats: MatsM5 }) {
  const pinza = cajaRedondeada(0.07, 0.05, 0.13, 0.012);
  return (
    <group userData={{ pieza: 'indice' }}>
      {/* hilo: de la arista interior del aro a la exterior, a ras de la cara */}
      <mesh position={[(R_IN + R_OUT) / 2 + 0.01, 0, Z_ARO_FRENTE + 0.0022]} material={mats.hilo}>
        <boxGeometry args={[R_OUT - R_IN + 0.02, 0.0045, 0.002]} />
      </mesh>
      {/* pinza por fuera del canto */}
      <mesh geometry={pinza} material={mats.latonSatinado} position={[R_OUT + 0.03, 0, (Z_ARO_FRENTE + Z_ARO_ATRAS) / 2]} castShadow />
    </group>
  );
}

// ───────────────────────────── soporte del aro ─────────────────────────────

export function Soporte({ mats }: { mats: MatsM5 }) {
  const geos = useMemo(() => {
    const yTop = -R_OUT + 0.02, yBase = Y_PLINTO;
    const columna = tornoY([
      [0, yBase], [0.24, yBase], [0.24, yBase + 0.03], [0.2, yBase + 0.05], [0.09, yBase + 0.08], [0.07, yBase + 0.12],
      [0.06, yTop - 0.16], [0.075, yTop - 0.14], [0.075, yTop - 0.11], [0.06, yTop - 0.09], [0.055, yTop - 0.06], [0, yTop - 0.06],
    ], 64);
    return { columna };
  }, []);
  useEffect(() => () => { geos.columna.dispose(); }, [geos]);
  const muñon = cajaRedondeada(0.2, 0.12, 0.16, 0.025);
  return (
    <group userData={{ pieza: 'soporte' }}>
      <mesh geometry={geos.columna} material={mats.bronce} position={[0, 0, (Z_ARO_FRENTE + Z_ARO_ATRAS) / 2]} castShadow receiveShadow />
      {/* muñón de latón que abraza el aro por abajo */}
      <mesh geometry={muñon} material={mats.laton} position={[0, -R_OUT - 0.02, (Z_ARO_FRENTE + Z_ARO_ATRAS) / 2]} castShadow />
    </group>
  );
}

// ───────────────────────────── panel de la onda ─────────────────────────────

const PANEL_W = PANEL.x1 - PANEL.x0, PANEL_H = PANEL.y1 - PANEL.y0;

function dibujarPanel(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const k = W / PANEL_W;
  const X = (xm: number) => (xm - PANEL.x0) * k, Y = (ym: number) => (PANEL.y1 - ym) * k;
  const xTh = (t: number) => X(X0_ONDA + t * ESCALA_ONDA);
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff';
  // eje θ
  ctx.globalAlpha = 0.85; ctx.lineWidth = 0.006 * k;
  ctx.beginPath(); ctx.moveTo(xTh(0), Y(0)); ctx.lineTo(xTh(2 * Math.PI) + 0.06 * k, Y(0)); ctx.stroke();
  // ±1
  ctx.globalAlpha = 0.5; ctx.lineWidth = 0.004 * k; ctx.setLineDash([0.04 * k, 0.035 * k]);
  for (const v of [1, -1]) { ctx.beginPath(); ctx.moveTo(xTh(0), Y(v)); ctx.lineTo(xTh(2 * Math.PI), Y(v)); ctx.stroke(); }
  ctx.setLineDash([]);
  // verticales de π/2 y marcas de π/12
  for (let i = 0; i <= 24; i++) {
    const x = xTh((i * Math.PI) / 12);
    if (i % 6 === 0) {
      ctx.globalAlpha = 0.32; ctx.lineWidth = 0.0035 * k;
      ctx.beginPath(); ctx.moveTo(x, Y(1.08)); ctx.lineTo(x, Y(-1.08)); ctx.stroke();
    }
    ctx.globalAlpha = 0.75; ctx.lineWidth = 0.004 * k;
    const l = i % 6 === 0 ? 0.05 : i % 2 === 0 ? 0.032 : 0.02;
    ctx.beginPath(); ctx.moveTo(x, Y(l)); ctx.lineTo(x, Y(-l)); ctx.stroke();
  }
  // rótulos del eje en radianes y de ±1
  ctx.globalAlpha = 0.8;
  ctx.font = `500 ${Math.round(0.072 * k)}px ${familiaTexto()}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ['π/2', 'π', '3π/2', '2π'].forEach((t, i) => ctx.fillText(t, xTh(((i + 1) * Math.PI) / 2) + (i === 3 ? -0.03 * k : 0), Y(-0.07)));
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('1', xTh(0) - 0.03 * k, Y(1)); ctx.fillText('−1', xTh(0) - 0.03 * k, Y(-1));
  ctx.globalAlpha = 1;
}

function useTexturaPanel(calidad: Calidad) {
  const vf = useVersionFuentes();
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = calidad === 'alta' ? 2048 : 1024;
    const H = Math.round((W * PANEL_H) / PANEL_W);
    const c = crearLienzo(W, H);
    dibujarPanel(c.getContext('2d')!, W, H);
    const t = texturaDeLienzo(c);
    t.anisotropy = 16;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calidad, vf]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

export function PanelOnda({ mats, calidad }: { mats: MatsM5; calidad: Calidad }) {
  const tex = useTexturaPanel(calidad);
  const cx = (PANEL.x0 + PANEL.x1) / 2, cy = (PANEL.y0 + PANEL.y1) / 2;
  const vidrio = cajaRedondeada(PANEL_W, PANEL_H, 0.026, 0.008, 2);
  const matGrabado = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.55, depthWrite: false, color: '#eaf4f7', name: 'm5-grabado-panel',
  }), [tex]);
  useEffect(() => () => matGrabado.dispose(), [matGrabado]);
  const poste = useMemo(() => tornoY([
    [0, Y_PLINTO], [0.085, Y_PLINTO], [0.085, Y_PLINTO + 0.025], [0.05, Y_PLINTO + 0.05], [0.032, Y_PLINTO + 0.08],
    [0.028, PANEL.y1 + 0.02], [0.036, PANEL.y1 + 0.04], [0.036, PANEL.y1 + 0.07], [0.02, PANEL.y1 + 0.09], [0, PANEL.y1 + 0.09],
  ], 40), []);
  useEffect(() => () => poste.dispose(), [poste]);
  const pinza = cajaRedondeada(0.07, 0.11, 0.07, 0.014);
  const zP = Z_VIDRIO - 0.013;
  return (
    <group userData={{ pieza: 'panel' }}>
      <mesh geometry={vidrio} material={mats.vidrio} position={[cx, cy, zP]} renderOrder={1} />
      <mesh position={[cx, cy, Z_VIDRIO + 0.0006]} material={matGrabado} renderOrder={2}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
      </mesh>
      {[PANEL.x0 - 0.05, PANEL.x1 + 0.05].map((x) => (
        <group key={x} position={[x, 0, zP]}>
          <mesh geometry={poste} material={mats.laton} castShadow receiveShadow />
          {[-0.95, 0.95].map((y) => (
            <mesh key={y} geometry={pinza} material={mats.latonSatinado} position={[x < cx ? 0.035 : -0.035, y, 0]} castShadow />
          ))}
        </group>
      ))}
    </group>
  );
}

// ───────────────────────────── plinto y suelo ─────────────────────────────

export function Plinto({ mats }: { mats: MatsM5 }) {
  const w = X_PLINTO[1] - X_PLINTO[0], d = Z_PLINTO[1] - Z_PLINTO[0];
  const caja = cajaRedondeada(w, ALTO_PLINTO, d, 0.035, 4);
  const filo = cajaRedondeada(w - 0.06, 0.012, 0.012, 0.005, 2);
  return (
    <group userData={{ pieza: 'plinto' }}>
      <mesh geometry={caja} material={mats.laca} position={[(X_PLINTO[0] + X_PLINTO[1]) / 2, Y_PLINTO - ALTO_PLINTO / 2, (Z_PLINTO[0] + Z_PLINTO[1]) / 2]} castShadow receiveShadow />
      {/* filo de latón embutido en el canto frontal */}
      <mesh geometry={filo} material={mats.laton} position={[(X_PLINTO[0] + X_PLINTO[1]) / 2, Y_PLINTO - 0.05, Z_PLINTO[1] + 0.001]} />
    </group>
  );
}

/** Suelo de estudio: oscuro, recibe la sombra y se funde con el fondo por un borde suave. */
export function Suelo({ calidad }: { calidad: Calidad }) {
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const S = 256;
    const c = crearLienzo(S, S), g = c.getContext('2d')!;
    const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.45, '#ffffff'); r.addColorStop(1, '#000000');
    g.fillStyle = r; g.fillRect(0, 0, S, S);
    return texturaDeLienzo(c, { srgb: false });
  }, []);
  useEffect(() => () => tex?.dispose(), [tex]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#11161d', roughness: 0.78, metalness: 0, alphaMap: tex, transparent: true, depthWrite: false, name: 'm5-suelo',
  }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  void calidad;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(X_PLINTO[0] + X_PLINTO[1]) / 2, Y_PLINTO - ALTO_PLINTO - 0.002, 0]} material={mat} receiveShadow renderOrder={0}>
      <circleGeometry args={[9, 64]} />
    </mesh>
  );
}

export { cilindro };
