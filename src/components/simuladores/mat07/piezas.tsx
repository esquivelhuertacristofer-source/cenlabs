'use client';
/**
 * mat07/piezas.tsx — las piezas del banco óptico de Snell, a escala real (1 u = 1 cm):
 *
 *  - MESA ÓPTICA: tablero de aluminio anodizado negro con la rejilla de roscas M6 a
 *    25 mm (la de cualquier laboratorio de óptica).
 *  - DISCO GONIOMÉTRICO de Ø30 cm en aluminio anodizado negro, con la escala GRABADA
 *    a láser (el grabado arranca el tinte y deja el aluminio blanco mate): marcas de
 *    1°, 5° y 10°, números cada 10° medidos desde la normal en los cuatro cuadrantes,
 *    la normal en rojo y el canto biselado a diamante (aluminio brillante).
 *  - BLOQUE SEMICIRCULAR (Ø18 cm × 2,4 cm) de vidrio/acrílico con transmisión física:
 *    `ior` = el índice del medio a la λ de la fuente, `dispersion` = 20/V (la
 *    convención de KHR_materials_dispersion), canto redondeado de 0,8 mm.
 *  - LÁSER de laboratorio compacto (Ø12 mm, carcasa anodizada con disipador de aletas,
 *    nariz de acero, cable) en un portaláser en V sobre un JINETE que abraza el canto
 *    del disco; delante, si se elige, un POLARIZADOR con su marca de eje.
 *
 * Ejes: +Y arriba; la cara de arriba del disco está en y = 0. La figura del modelo
 * (x, y) pasa al mundo como (x, ·, −y): el aire (+y) queda al fondo y el bloque
 * hacia la cámara. Nada de texto en 3D: la escala es grabado del instrumento.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { cajaRedondeada, cilindro, sanearNormales, crearLienzo, texturaDeLienzo, familiaTexto, useVersionFuentes, type Calidad } from '../_kit';
import { R_BLOQUE, R_DISCO, R_ABERTURA } from './optica';

type GroupProps = ThreeElements['group'];

export const ESPESOR_DISCO = 0.8;
export const ESPESOR_BLOQUE = 2.4;
/** Altura del haz sobre la cara del disco (cm). */
export const H_HAZ = 1.2;
/** Cota de la cubierta de la mesa óptica (cm). */
export const Y_MESA = -4.6;
/** Radio interior de las marcas de la escala y radio de los números (cm). */
export const R_ESCALA = 12.2;
export const R_NUMEROS = 14.35;
const BISEL = 0.22;

/** Figura (x, y) → mundo (x, h, −y). */
export const aMundo = (p: [number, number], h = H_HAZ): [number, number, number] => [p[0], h, -p[1]];

// ───────────────────────────── materiales del banco ─────────────────────────────

export interface MaterialesBanco {
  anodizadoNegro: THREE.MeshPhysicalMaterial;
  biselDiamante: THREE.MeshPhysicalMaterial;
  aluminioSatinado: THREE.MeshPhysicalMaterial;
  aceroPulido: THREE.MeshStandardMaterial;
  goma: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
  vidrioPolarizador: THREE.MeshPhysicalMaterial;
  marcaBlanca: THREE.MeshStandardMaterial;
}

/** Materiales propios del banco (vida ligada al componente que los pide). */
export function useMaterialesBanco(): MaterialesBanco {
  const m = useMemo<MaterialesBanco>(() => ({
    // anodizado negro: dieléctrico (óxido) sobre metal → reflejo satinado, sellado brillante
    anodizadoNegro: new THREE.MeshPhysicalMaterial({ color: '#1b1d22', metalness: 0.55, roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.32, name: 'banco-anodizado' }),
    // canto torneado a diamante: aluminio desnudo, rayado circunferencial (anisotropía)
    biselDiamante: new THREE.MeshPhysicalMaterial({ color: '#d7dbe0', metalness: 1, roughness: 0.2, anisotropy: 0.7, name: 'banco-bisel' }),
    aluminioSatinado: new THREE.MeshPhysicalMaterial({ color: '#b9bec5', metalness: 1, roughness: 0.34, anisotropy: 0.4, name: 'banco-aluminio' }),
    aceroPulido: new THREE.MeshStandardMaterial({ color: '#d2d5d9', metalness: 1, roughness: 0.16, name: 'banco-acero' }),
    goma: new THREE.MeshStandardMaterial({ color: '#16171a', metalness: 0, roughness: 0.78, name: 'banco-goma' }),
    cable: new THREE.MeshStandardMaterial({ color: '#202226', metalness: 0, roughness: 0.55, name: 'banco-cable' }),
    vidrioPolarizador: new THREE.MeshPhysicalMaterial({ color: '#4a5258', metalness: 0, roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false, name: 'banco-polarizador' }),
    marcaBlanca: new THREE.MeshStandardMaterial({ color: '#eceff1', metalness: 0, roughness: 0.6, name: 'banco-marca' }),
  }), []);
  useEffect(() => () => { Object.values(m).forEach((x) => x.dispose()); }, [m]);
  return m;
}

// ───────────────────────────── mesa óptica ─────────────────────────────

/**
 * Mesa de granito negro apomazado (la de los laboratorios de metrología): color con
 * variaciones MUY suaves y de baja frecuencia (manchas de 10–25 cm), nada de grano
 * fino que haga «lija» bajo el foco. Repetición larga (losa de 55 cm).
 */
function texturasMesa(calidad: Calidad) {
  if (typeof document === 'undefined') return null;
  const S = calidad === 'alta' ? 512 : 256;
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#1c1e22'; c.fillRect(0, 0, S, S);
  o.fillStyle = `rgb(0, ${Math.round(0.46 * 255)}, 0)`; o.fillRect(0, 0, S, S);
  let sem = 97;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let i = 0; i < 14; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.18 + rnd() * 0.3);
    const claro = rnd() > 0.5;
    // las manchas se dibujan también desplazadas una losa para que el mosaico no tenga costuras
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, claro ? 'rgba(46,49,55,0.35)' : 'rgba(12,13,15,0.35)'); g.addColorStop(1, 'rgba(28,30,34,0)');
      c.fillStyle = g; c.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      const h = o.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      const v = Math.round((claro ? 0.4 : 0.52) * 255);
      h.addColorStop(0, `rgba(0,${v},0,0.5)`); h.addColorStop(1, `rgba(0,${v},0,0)`);
      o.fillStyle = h; o.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
  const rep: [number, number] = [4, 3];
  return { mapa: texturaDeLienzo(col, { repetir: rep }), rug: texturaDeLienzo(rug, { srgb: false, repetir: rep }) };
}

export function MesaOptica({ calidad }: { calidad: Calidad }) {
  const tex = useMemo(() => texturasMesa(calidad), [calidad]);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, roughness: 1, metalness: 0,
    clearcoat: calidad === 'alta' ? 0.18 : 0, clearcoatRoughness: 0.42, name: 'banco-mesa',
  }), [tex, calidad]);
  useEffect(() => () => { mat.dispose(); tex?.mapa.dispose(); tex?.rug.dispose(); }, [mat, tex]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, Y_MESA, 0]} material={mat} receiveShadow>
      <planeGeometry args={[220, 160]} />
    </mesh>
  );
}

// ───────────────────────────── disco goniométrico ─────────────────────────────

/** Valor de la escala (0° en la normal, 90° en la interfaz) para un ángulo polar desde +y. */
export const valorEscala = (a: number) => (a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a);

/**
 * Lienzo de la cara del disco. `orm` codifica rugosidad (G) y metalicidad (B): el
 * anodizado es metálico y satinado; el grabado, blanco mate y no metálico (por eso
 * se lee bajo cualquier luz). La figura (+y) queda ARRIBA del lienzo.
 */
function dibujarCaraDisco(ctx: CanvasRenderingContext2D, S: number, orm: boolean) {
  const k = S / (2 * R_DISCO), c = S / 2;
  const fondo = orm ? `rgb(0, ${Math.round(0.4 * 255)}, ${Math.round(0.55 * 255)})` : '#17191d';
  const grabado = orm ? `rgb(0, ${Math.round(0.74 * 255)}, 0)` : '#e4e7ea';
  ctx.fillStyle = fondo; ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'butt';
  const P = (x: number, y: number): [number, number] => [c + x * k, c - y * k];
  const anillo = (r: number, w: number) => {
    ctx.strokeStyle = grabado; ctx.lineWidth = w * k;
    ctx.beginPath(); ctx.arc(c, c, r * k, 0, Math.PI * 2); ctx.stroke();
  };
  anillo(R_ESCALA - 0.06, 0.035);
  anillo(R_ESCALA + 1.32, 0.03);
  anillo(R_DISCO - BISEL - 0.35, 0.025);
  // marcas: 1° cortas, 5° medias, 10° largas
  for (let g = 0; g < 360; g++) {
    const a = (g * Math.PI) / 180;
    const [L, W] = g % 10 === 0 ? [1.18, 0.07] : g % 5 === 0 ? [0.82, 0.052] : [0.5, 0.036];
    const [x0, y0] = P(Math.sin(a) * R_ESCALA, Math.cos(a) * R_ESCALA);
    const [x1, y1] = P(Math.sin(a) * (R_ESCALA + L), Math.cos(a) * (R_ESCALA + L));
    ctx.strokeStyle = grabado; ctx.lineWidth = W * k;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  // números cada 10°, derechos para quien mira desde el frente (también en el mapa de
  // rugosidad, con la misma forma: un disco mate alrededor dibujaría un halo oscuro)
  ctx.fillStyle = grabado;
  ctx.font = `600 ${Math.round(0.66 * k)}px ${familiaTexto()}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let g = 0; g < 360; g += 10) {
    const a = (g * Math.PI) / 180;
    const [x, y] = P(Math.sin(a) * R_NUMEROS, Math.cos(a) * R_NUMEROS);
    ctx.fillText(String(valorEscala(g)), x, y);
  }
  // normal (rayas, relleno rojo) e interfaz (línea fina)
  ctx.setLineDash([0.55 * k, 0.32 * k]);
  ctx.strokeStyle = orm ? grabado : '#d4574f'; ctx.lineWidth = 0.05 * k;
  ctx.beginPath(); const [nx0, ny0] = P(0, R_ESCALA - 0.25); const [nx1, ny1] = P(0, -(R_ESCALA - 0.25));
  ctx.moveTo(nx0, ny0); ctx.lineTo(nx1, ny1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = grabado; ctx.lineWidth = 0.028 * k; ctx.globalAlpha = 0.75;
  const [ix0, iy0] = P(-(R_ESCALA - 0.25), 0); const [ix1, iy1] = P(R_ESCALA - 0.25, 0);
  ctx.beginPath(); ctx.moveTo(ix0, iy0); ctx.lineTo(ix1, iy1); ctx.stroke();
  ctx.globalAlpha = 1;
  // marca del asiento del bloque y centro
  ctx.lineWidth = 0.025 * k; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.arc(c, c, (R_BLOQUE + 0.12) * k, 0, Math.PI); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 0.035 * k;
  ctx.beginPath(); ctx.arc(c, c, 0.3 * k, 0, Math.PI * 2); ctx.stroke();
}

function useTexturasDisco(calidad: Calidad) {
  const vf = useVersionFuentes();
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const S = calidad === 'alta' ? 2048 : 1024;
    const col = crearLienzo(S, S), orm = crearLienzo(S, S);
    dibujarCaraDisco(col.getContext('2d')!, S, false);
    dibujarCaraDisco(orm.getContext('2d')!, S, true);
    const mapa = texturaDeLienzo(col);
    const rug = texturaDeLienzo(orm, { srgb: false });
    mapa.anisotropy = 16; rug.anisotropy = 16;
    return { mapa, rug };
    // vf: se redibuja cuando llega la tipografía Outfit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calidad, vf]);
  useEffect(() => () => { tex?.mapa.dispose(); tex?.rug.dispose(); }, [tex]);
  return tex;
}

/** Perfil de torno (r, y) → LatheGeometry con normales saneadas. */
function torno(perfil: [number, number][], segs: number, fase = 0, arco = Math.PI * 2) {
  const g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), segs, fase, arco);
  return sanearNormales(g);
}

export function DiscoGoniometrico({ calidad, ...g }: GroupProps & { calidad: Calidad }) {
  const mb = useMaterialesBanco();
  const tex = useTexturasDisco(calidad);
  const segs = calidad === 'alta' ? 180 : 96;
  const geos = useMemo(() => {
    const cara = new THREE.CircleGeometry(R_DISCO - BISEL, segs);
    const bisel = torno([[R_DISCO - BISEL, 0], [R_DISCO - BISEL * 0.35, -BISEL * 0.12], [R_DISCO, -BISEL]], segs);
    const canto = torno([[R_DISCO, -BISEL], [R_DISCO, -ESPESOR_DISCO + 0.1], [R_DISCO - 0.1, -ESPESOR_DISCO]], segs);
    // columna torneada y base del goniómetro (fundición pintada no: aluminio anodizado)
    const columna = torno([
      [0, -ESPESOR_DISCO], [4.2, -ESPESOR_DISCO], [4.2, -ESPESOR_DISCO - 0.35], [3.1, -ESPESOR_DISCO - 0.6],
      [2.6, -2.6], [2.9, -3.0], [6.6, -3.7], [7.0, -4.05], [7.0, Y_MESA + 0.02], [0, Y_MESA + 0.02],
    ], 64);
    return { cara, bisel, canto, columna };
  }, [segs]);
  useEffect(() => () => { Object.values(geos).forEach((x) => x.dispose()); }, [geos]);
  const matCara = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, metalnessMap: tex?.rug ?? null,
    roughness: 1, metalness: 1, clearcoat: 0.3, clearcoatRoughness: 0.3, name: 'banco-cara-disco',
  }), [tex]);
  useEffect(() => () => matCara.dispose(), [matCara]);
  return (
    <group {...g}>
      <mesh geometry={geos.cara} material={matCara} rotation-x={-Math.PI / 2} receiveShadow userData={{ pieza: 'disco' }} />
      <mesh geometry={geos.bisel} material={mb.biselDiamante} receiveShadow />
      <mesh geometry={geos.canto} material={mb.anodizadoNegro} castShadow receiveShadow />
      <mesh geometry={geos.columna} material={mb.anodizadoNegro} castShadow receiveShadow />
    </group>
  );
}

// ───────────────────────────── bloque semicircular ─────────────────────────────

/** Geometrías del bloque en D: torno de 180° (caras, canto curvo redondeado) + tapa plana. */
function geometriasBloque(segs: number) {
  const rr = 0.08, t = ESPESOR_BLOQUE, R = R_BLOQUE;
  const perfil: [number, number][] = [[0, 0]];
  const arcoEsq = (cx: number, cy: number, a0: number, a1: number) => {
    for (let i = 0; i <= 4; i++) { const a = a0 + ((a1 - a0) * i) / 4; perfil.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  };
  perfil.push([R - rr, 0]);
  arcoEsq(R - rr, rr, -Math.PI / 2, 0);
  perfil.push([R, t - rr]);
  arcoEsq(R - rr, t - rr, 0, Math.PI / 2);
  perfil.push([0, t]);
  // φ de −π/2 a π/2: x = r·sen φ ∈ [−R, R], z = r·cos φ ≥ 0 (el lado del bloque, hacia la cámara)
  const curvo = torno(perfil, segs, -Math.PI / 2, Math.PI);
  const forma = new THREE.Shape();
  forma.moveTo(-R, 0); forma.lineTo(R, 0); forma.lineTo(R, t); forma.lineTo(-R, t); forma.lineTo(-R, 0);
  const tapa = new THREE.ShapeGeometry(forma);
  tapa.rotateY(Math.PI); // mira hacia −z: el aire
  return { curvo, tapa };
}

/** Cantos del bloque (arcos superior e inferior y aristas de la cara plana) para el brillo de borde. */
function geometriaCantos(segs: number) {
  const R = R_BLOQUE - 0.03, t = ESPESOR_BLOQUE;
  const tubos: THREE.BufferGeometry[] = [];
  for (const y of [0.03, t - 0.03]) {
    const pts = Array.from({ length: segs + 1 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.PI * i) / segs; // mismo barrido que el torno: z = r·cos ≥ 0
      return new THREE.Vector3(R * Math.sin(a), y, R * Math.cos(a));
    });
    tubos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, 0.035, 6, false));
    tubos.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-R, y, 0.02), new THREE.Vector3(R, y, 0.02)), 4, 0.03, 6, false));
  }
  return tubos;
}

/**
 * Bloque en D. `canto` = color lineal × potencia que entra en el vidrio: el acrílico
 * difunde una fracción pequeña del haz y la reflexión total la guía hasta los cantos
 * pulidos, que se encienden en el color del láser (el efecto de los rótulos de
 * acrílico). Es ambiente: proporcional a la potencia, sin cifras.
 */
export function BloqueSemicircular({ calidad, ior, dispersion, tinte, canto, ...g }: GroupProps & {
  calidad: Calidad; ior: number; dispersion: number; tinte: string; canto?: [number, number, number];
}) {
  const geos = useMemo(() => geometriasBloque(calidad === 'alta' ? 160 : 80), [calidad]);
  useEffect(() => () => { geos.curvo.dispose(); geos.tapa.dispose(); }, [geos]);
  const cantos = useMemo(() => geometriaCantos(calidad === 'alta' ? 96 : 48), [calidad]);
  useEffect(() => () => cantos.forEach((c) => c.dispose()), [cantos]);
  const matCanto = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#000000', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, name: 'banco-canto',
  }), []);
  useEffect(() => () => matCanto.dispose(), [matCanto]);
  useEffect(() => {
    const k = 0.42, c = canto ?? [0, 0, 0];
    matCanto.color.setRGB(c[0] * k, c[1] * k, c[2] * k);
  }, [matCanto, canto]);
  const mat = useMemo(() => {
    if (calidad === 'alta') {
      return new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.025, transmission: 1, thickness: 2.2,
        ior: 1.5, dispersion: 0, attenuationColor: new THREE.Color(tinte), attenuationDistance: 26,
        specularIntensity: 1, envMapIntensity: 1.5, side: THREE.FrontSide, depthWrite: false, name: 'banco-bloque',
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: tinte, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, depthWrite: false,
      specularIntensity: 1, envMapIntensity: 1.8, side: THREE.FrontSide, name: 'banco-bloque-medio',
    });
    // el tinte inicial basta: cambia con setters abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calidad]);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    // three limita ior a [1; 2,333]: el diamante (2,417) se dibuja con el tope (sólo afecta al aspecto)
    mat.ior = Math.min(2.333, Math.max(1, ior));
    mat.dispersion = calidad === 'alta' ? dispersion : 0;
    if (calidad === 'alta') mat.attenuationColor.set(tinte); else mat.color.set(tinte);
    mat.needsUpdate = true;
  }, [mat, ior, dispersion, tinte, calidad]);
  return (
    // 0,04 mm sobre el disco: la cara de abajo no pelea en profundidad con la del disco
    <group {...g} position-y={0.004} userData={{ pieza: 'bloque' }}>
      <mesh geometry={geos.curvo} material={mat} renderOrder={1} />
      <mesh geometry={geos.tapa} material={mat} renderOrder={1} />
      {cantos.map((c, i) => <mesh key={i} geometry={c} material={matCanto} renderOrder={3} />)}
    </group>
  );
}

// ───────────────────────────── láser, portaláser y jinete ─────────────────────────────

/** Torno a lo largo de +X local (para piezas del láser): rota el eje Y del torno a X. */
function tornoX(perfil: [number, number][], segs: number) {
  const g = torno(perfil, segs);
  g.rotateZ(-Math.PI / 2); // eje del torno (Y) → +X
  return g;
}

/**
 * Láser en su jinete. Origen = ABERTURA, a la altura del haz; el cuerpo se extiende
 * hacia +X local (hacia fuera del disco). La escena coloca el grupo en la abertura y
 * lo gira para que +X apunte del centro al láser.
 */
export function LaserEnJinete({ colorHaz, encendido, pol, ...g }: GroupProps & {
  colorHaz: THREE.ColorRepresentation; encendido: boolean; pol: 'natural' | 's' | 'p';
}) {
  const mb = useMaterialesBanco();
  // cotas (cm): módulo láser de Ø14 mm × 74 mm con disipador de 8 aletas
  const RC = 0.7, RA = 0.84, YP = -H_HAZ + 0.32; // radio del cuerpo, de las aletas, cara de la placa
  const geos = useMemo(() => {
    const nariz = tornoX([[0.0, 0.0], [0.22, 0.0], [0.4, 0.05], [0.52, 0.17], [0.55, 0.3], [0.55, 1.05], [0.62, 1.12], [0.62, 1.25]], 44);
    const p: [number, number][] = [[0.62, 1.25], [RC, 1.3], [RC, 2.0], [RC - 0.05, 2.03], [RC - 0.05, 2.12], [RC, 2.15], [RC, 2.55], [RC - 0.05, 2.58], [RC - 0.05, 2.67], [RC, 2.7], [RC, 4.05]];
    for (let i = 0; i < 8; i++) {
      const x = 4.1 + i * 0.27;
      p.push([RC, x], [RA, x + 0.025], [RA, x + 0.115], [RC, x + 0.14]);
    }
    p.push([RC, 6.3], [RC - 0.06, 6.36], [0.0, 6.36]);
    const cuerpo = tornoX(p, 44);
    const tapa = tornoX([[0.0, 6.36], [0.6, 6.36], [0.6, 6.66], [0.46, 6.74], [0.24, 6.74], [0.22, 7.0], [0.15, 7.45], [0.0, 7.45]], 36);
    // cable: de la cola hasta la mesa, por fuera del disco
    const yMesa = Y_MESA - H_HAZ + 0.12;
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(7.4, 0, 0), new THREE.Vector3(8.3, -0.2, 0.15), new THREE.Vector3(9.0, -1.6, 0.6),
      new THREE.Vector3(9.4, yMesa + 0.7, 1.6), new THREE.Vector3(10.0, yMesa, 4.4), new THREE.Vector3(9.0, yMesa, 9.5), new THREE.Vector3(6.2, yMesa, 14), new THREE.Vector3(2.5, yMesa, 17.5),
    ]);
    const cable = new THREE.TubeGeometry(curva, 72, 0.12, 10, false);
    const lente = new THREE.CircleGeometry(0.19, 28); lente.rotateY(-Math.PI / 2); lente.translate(-0.003, 0, 0);
    const aroPol = tornoX([[0.62, -0.12], [0.88, -0.12], [0.93, -0.07], [0.93, 0.07], [0.88, 0.12], [0.62, 0.12]], 44);
    return { nariz, cuerpo, tapa, cable, lente, aroPol };
  }, []);
  useEffect(() => () => { Object.values(geos).forEach((x) => x.dispose()); }, [geos]);
  const matLente = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, name: 'banco-lente' }), []);
  const matFiel = useMemo(() => new THREE.MeshBasicMaterial({ color: '#e0453c', name: 'banco-fiel' }), []);
  useEffect(() => () => { matLente.dispose(); matFiel.dispose(); }, [matLente, matFiel]);
  useEffect(() => {
    const c = new THREE.Color(colorHaz);
    matLente.color.copy(encendido ? c.multiplyScalar(3) : new THREE.Color('#202428'));
  }, [matLente, colorHaz, encendido]);
  // jinete: placa sobre la cara del disco (de r = 11,3 a r = 15) con labio que abraza el canto
  const xJ0 = 11.3 - R_ABERTURA, xJ1 = R_DISCO + 0.02 - R_ABERTURA;
  const largoJ = xJ1 - xJ0;
  const altoCuna = -RC + 0.18 - YP;
  return (
    <group {...g}>
      <group userData={{ pieza: 'laser' }}>
        <mesh geometry={geos.nariz} material={mb.aceroPulido} castShadow />
        <mesh geometry={geos.cuerpo} material={mb.anodizadoNegro} castShadow receiveShadow />
        <mesh geometry={geos.tapa} material={mb.aceroPulido} castShadow />
        <mesh geometry={geos.cable} material={mb.cable} castShadow receiveShadow />
        <mesh geometry={geos.lente} material={matLente} />
      </group>
      <group userData={{ pieza: 'jinete' }}>
        {/* dos cunas en V, brida con tornillo moleteado */}
        {[2.15, 3.55].map((x) => (
          <mesh key={x} geometry={cajaRedondeada(0.9, altoCuna, 1.75, 0.09)} material={mb.aluminioSatinado} position={[x, YP + altoCuna / 2, 0]} castShadow receiveShadow />
        ))}
        <mesh geometry={cilindro(RC + 0.13, RC + 0.13, 0.32, 44)} material={mb.aluminioSatinado} rotation-z={Math.PI / 2} position={[2.15, 0, 0]} castShadow />
        <mesh geometry={cilindro(0.15, 0.15, 0.5, 18)} material={mb.aceroPulido} position={[2.15, RC + 0.33, 0]} castShadow />
        <mesh geometry={cilindro(0.3, 0.3, 0.24, 28)} material={mb.anodizadoNegro} position={[2.15, RC + 0.66, 0]} castShadow />
        {/* placa del jinete sobre el disco y labio por fuera del canto */}
        <mesh geometry={cajaRedondeada(largoJ, 0.32, 2.4, 0.1)} material={mb.aluminioSatinado} position={[xJ0 + largoJ / 2, -H_HAZ + 0.16, 0]} castShadow receiveShadow />
        <mesh geometry={cajaRedondeada(0.34, ESPESOR_DISCO + 0.62, 2.4, 0.1)} material={mb.aluminioSatinado} position={[xJ1 + 0.17, YP - (ESPESOR_DISCO + 0.62) / 2, 0]} castShadow />
        {/* fiel: raya roja grabada en el eje del láser, en el borde de la placa */}
        <mesh position={[xJ0 + 0.32, YP + 0.003, 0]} rotation-x={-Math.PI / 2} material={matFiel}>
          <planeGeometry args={[0.55, 0.05]} />
        </mesh>
      </group>
      {pol !== 'natural' && (
        <group position={[-0.5, 0, 0]} userData={{ pieza: 'polarizador' }}>
          {/* montura del polarizador: aro anodizado + lámina gris + marca del eje de transmisión */}
          <mesh geometry={geos.aroPol} material={mb.anodizadoNegro} castShadow />
          <mesh rotation-y={Math.PI / 2} material={mb.vidrioPolarizador}>
            <circleGeometry args={[0.62, 36]} />
          </mesh>
          {/* el eje: vertical = s (perpendicular al plano de incidencia), horizontal = p */}
          <mesh position={[-0.13, 0, 0]} rotation-x={pol === 's' ? 0 : Math.PI / 2} material={mb.marcaBlanca}>
            <boxGeometry args={[0.025, 1.12, 0.06]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
