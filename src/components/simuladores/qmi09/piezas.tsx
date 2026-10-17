"use client";
/**
 * qmi09/piezas.tsx — las piezas del banco de la celda galvánica, a escala real
 * (1 u = 10 cm; la cubierta de la mesa en y = 0; +Z mira al alumno).
 *
 *  · MESA de resina epoxi negra (la de un laboratorio de química): color y brillo con
 *    manchas MUY suaves de baja frecuencia, nada de grano fino.
 *  · VASOS Griffin de 250 mL del kit (vidrio con transmisión) con 200 mL de la sal de
 *    su metal; el color sale de Beer–Lambert con la concentración del modelo.
 *  · VARILLAS de electrodo de Ø 10 mm con su borne de latón. La parte sumergida se
 *    adelgaza (ánodo, superficie atacada) o engorda (cátodo, depósito mate) con el
 *    volumen de metal que dice Faraday (`formaVarilla`).
 *  · BARRA PORTAELECTRODO de polipropileno apoyada en el borde de cada vaso.
 *  · PUENTE SALINO: tubo de vidrio en U de Ø 10 mm interior, gel de agar con KNO₃
 *    (translúcido) que cierra las puntas; su largo es el que usa la resistencia.
 *  · VOLTÍMETRO analógico de cero central sobre un elevador de aluminio: esfera con
 *    dos escalas (±1,5 V y ±5 V, se resalta la activa), espejo antiparalaje, aguja
 *    amortiguada, bornes COM (negro) y + (rojo) y el selector de la caja de carga
 *    entre ellos. La cifra exacta va en el dock (DOM), no en 3D.
 *  · CABLES de silicona con pinzas de cocodrilo.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  cajaRedondeada, cilindro, esfera, tornear, tuboPolilinea, extruir, formaRectRedondeado, sanearNormales,
  crearLienzo, texturaDeLienzo, familiaTexto, useVersionFuentes, useMateriales, VasoPrecipitado, Liquido, type Calidad,
} from '../_kit';
import { BANCO, METAL, formaVarilla, type Carga, type IdMetal } from './electroquimica';

type GroupProps = ThreeElements['group'];
export type V3 = [number, number, number];

/** Una parte de una pieza fundida: geometría (no se modifica) con su posición, giro y escala. */
interface Parte { g: THREE.BufferGeometry; p?: V3; r?: V3; s?: V3 }
/**
 * Funde varias geometrías del MISMO material en una sola (una llamada de dibujo en vez
 * de n). Las del kit están cacheadas y compartidas: se clonan antes de transformarlas.
 */
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

// ───────────────────────────── cotas del banco ─────────────────────────────

/** Medidas de escena (u). Las químicas (vaso, varilla, puente) vienen de BANCO. */
export const COTAS = {
  ...BANCO,
  /** altura del borde del vaso */
  yBorde: BANCO.vaso.altura,
  /** radio interior del vaso */
  rInterior: BANCO.vaso.radioInteriorEn(0.3),
  /** extremo superior de las varillas */
  yTopeVarilla: 1.3,
  rVarilla: BANCO.rVarillaCm / 10,
  /**
   * voltímetro: elevador + caja, centrado en x = 0 al fondo. El elevador lo sube lo
   * bastante para que, desde la cámara (≈ 20° de elevación), ni la esfera ni los bornes
   * queden detrás del travesaño del puente (se verían deformados a través del vidrio).
   */
  zMedidor: -1.05,
  altoElevador: 0.95,
  anchoCaja: 1.36,
  altoCaja: 0.9,
  fondoCaja: 0.6,
  /** esfera (ventana) del voltímetro, relativa al centro del frente de la caja */
  ventana: { ancho: 1.12, alto: 0.56, y: 0.15 },
  /** bornes y selector de carga: altura sobre el frente y separación */
  yBornes: -0.3,
  xBorne: 0.42,
  /** semiapertura de la escala (rad) */
  arcoEscala: (48 * Math.PI) / 180,
};
/** Frente del voltímetro (z) y su centro (y). */
export const FRENTE_MEDIDOR = COTAS.zMedidor + COTAS.fondoCaja / 2;
export const Y_CENTRO_CAJA = COTAS.altoElevador + COTAS.altoCaja / 2;
/** Posición de cada borne en el mundo (la punta COM a la izquierda). */
export const BORNE: Record<'com' | 'v', V3> = {
  com: [-COTAS.xBorne, Y_CENTRO_CAJA + COTAS.yBornes, FRENTE_MEDIDOR + 0.07],
  v: [COTAS.xBorne, Y_CENTRO_CAJA + COTAS.yBornes, FRENTE_MEDIDOR + 0.07],
};
/** Punto de agarre de la pinza en lo alto de cada varilla. */
export const AGARRE = (lado: 'izq' | 'der'): V3 => [(lado === 'izq' ? -1 : 1) * COTAS.xVarilla, COTAS.yTopeVarilla - 0.07, 0];

// ───────────────────────────── materiales ─────────────────────────────

/** Acabado de cada metal: pulido, superficie atacada (ánodo) y depósito electrolítico (cátodo). */
const ACABADO: Record<IdMetal, { pulido: [string, number]; atacado: [string, number]; deposito: [string, number, number] }> = {
  // [color sRGB, rugosidad] — reflectancias medidas: Zn gris azulado, Cu salmón, Ag casi blanca, Mg gris claro
  Zn: { pulido: ['#c3cad0', 0.34], atacado: ['#8f989f', 0.72], deposito: ['#7f878d', 0.78, 0.65] },
  Cu: { pulido: ['#efa483', 0.26], atacado: ['#b8735a', 0.7], deposito: ['#c06a47', 0.74, 0.62] },
  Ag: { pulido: ['#f2f1ec', 0.16], atacado: ['#b9b8b2', 0.66], deposito: ['#cfcfca', 0.62, 0.72] },
  Mg: { pulido: ['#d3d6d8', 0.38], atacado: ['#9fa4a7', 0.74], deposito: ['#a9adb0', 0.75, 0.6] },
};

export interface MatsQ9 {
  mesa: THREE.MeshPhysicalMaterial;
  elevador: THREE.MeshPhysicalMaterial;
  carcasa: THREE.MeshPhysicalMaterial;
  bisel: THREE.MeshPhysicalMaterial;
  aguja: THREE.MeshStandardMaterial;
  laton: THREE.MeshStandardMaterial;
  pp: THREE.MeshPhysicalMaterial;
  algodon: THREE.MeshStandardMaterial;
  gel: THREE.MeshPhysicalMaterial;
  rojo: THREE.MeshPhysicalMaterial;
  negro: THREE.MeshPhysicalMaterial;
  silRojo: THREE.MeshPhysicalMaterial;
  silNegro: THREE.MeshPhysicalMaterial;
  acero: THREE.MeshStandardMaterial;
  pulido: (m: IdMetal) => THREE.MeshPhysicalMaterial;
}

function texturasMesa(calidad: Calidad) {
  if (typeof document === 'undefined') return null;
  const S = calidad === 'alta' ? 512 : 256;
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#20252a'; c.fillRect(0, 0, S, S);
  o.fillStyle = `rgb(0, ${Math.round(0.5 * 255)}, 0)`; o.fillRect(0, 0, S, S);
  let sem = 4111;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let i = 0; i < 16; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.16 + rnd() * 0.32);
    const claro = rnd() > 0.5;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, claro ? 'rgba(52,58,64,0.32)' : 'rgba(14,16,18,0.32)'); g.addColorStop(1, 'rgba(32,37,42,0)');
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

export function useMatsQ9(calidad: Calidad): MatsQ9 {
  const tex = useMemo(() => texturasMesa(calidad), [calidad]);
  const pulidos = useMemo(() => new Map<IdMetal, THREE.MeshPhysicalMaterial>(), [calidad]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = useMemo<MatsQ9>(() => {
    const alta = calidad === 'alta';
    return {
      mesa: new THREE.MeshPhysicalMaterial({
        color: '#ffffff', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, roughness: 1, metalness: 0,
        clearcoat: alta ? 0.35 : 0, clearcoatRoughness: 0.38, name: 'q9-mesa',
      }),
      // aluminio anodizado gris grafito, satinado
      elevador: new THREE.MeshPhysicalMaterial({ color: '#3a3f46', metalness: 0.7, roughness: 0.42, clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.4, name: 'q9-elevador' }),
      // ABS carbón con un barniz suave
      carcasa: new THREE.MeshPhysicalMaterial({ color: '#25292e', metalness: 0, roughness: 0.52, clearcoat: alta ? 0.3 : 0, clearcoatRoughness: 0.45, name: 'q9-carcasa' }),
      bisel: new THREE.MeshPhysicalMaterial({ color: '#c9ced4', metalness: 1, roughness: 0.3, name: 'q9-bisel' }),
      aguja: new THREE.MeshStandardMaterial({ color: '#16181b', metalness: 0.2, roughness: 0.4, name: 'q9-aguja' }),
      laton: new THREE.MeshStandardMaterial({ color: '#d8b56a', metalness: 1, roughness: 0.3, name: 'q9-laton' }),
      pp: new THREE.MeshPhysicalMaterial({ color: '#cfd2cc', metalness: 0, roughness: 0.55, sheen: alta ? 0.3 : 0, sheenColor: new THREE.Color('#ffffff'), name: 'q9-pp' }),
      algodon: new THREE.MeshStandardMaterial({ color: '#f3f1ea', metalness: 0, roughness: 0.96, name: 'q9-algodon' }),
      // gel de agar: lechoso y translúcido (deja ver los iones del puente)
      gel: new THREE.MeshPhysicalMaterial({
        color: '#e9f1ee', metalness: 0, roughness: 0.35, transparent: true, opacity: 0.22, depthWrite: false,
        side: THREE.DoubleSide, name: 'q9-gel',
      }),
      rojo: new THREE.MeshPhysicalMaterial({ color: '#c8231f', metalness: 0, roughness: 0.32, clearcoat: alta ? 0.5 : 0, name: 'q9-rojo' }),
      negro: new THREE.MeshPhysicalMaterial({ color: '#17181a', metalness: 0, roughness: 0.32, clearcoat: alta ? 0.5 : 0, name: 'q9-negro' }),
      silRojo: new THREE.MeshPhysicalMaterial({ color: '#b51d1b', metalness: 0, roughness: 0.42, sheen: alta ? 0.25 : 0, name: 'q9-silicona-roja' }),
      silNegro: new THREE.MeshPhysicalMaterial({ color: '#1b1c1f', metalness: 0, roughness: 0.42, sheen: alta ? 0.25 : 0, name: 'q9-silicona-negra' }),
      acero: new THREE.MeshStandardMaterial({ color: '#cfd3d6', metalness: 1, roughness: 0.28, name: 'q9-acero' }),
      pulido(id: IdMetal) {
        let x = pulidos.get(id);
        if (!x) {
          const a = ACABADO[id].pulido;
          x = new THREE.MeshPhysicalMaterial({ color: a[0], metalness: 1, roughness: a[1], name: 'q9-metal-' + id });
          pulidos.set(id, x);
        }
        return x;
      },
    };
  }, [calidad, tex, pulidos]);
  useEffect(() => () => {
    Object.values(m).forEach((x) => { if (x instanceof THREE.Material) x.dispose(); });
    pulidos.forEach((x) => x.dispose());
    pulidos.clear();
    tex?.mapa.dispose(); tex?.rug.dispose();
  }, [m, tex, pulidos]);
  return m;
}

// ───────────────────────────── mesa ─────────────────────────────

export function Mesa({ mats }: { mats: MatsQ9 }) {
  return (
    <group>
      <mesh geometry={cajaRedondeada(9, 0.3, 5.2, 0.05, 3)} material={mats.mesa} position={[0, -0.15, -0.4]} receiveShadow />
    </group>
  );
}

// ───────────────────────────── vaso con disolución ─────────────────────────────

/**
 * Vaso de 250 mL con 200 mL de disolución. `material` es el del líquido (lo crea y lo
 * actualiza la escena con Beer–Lambert); `null` = vaso vacío (reto sin montar).
 */
export function VasoCelda({ x, material, children }: { x: number; material: THREE.Material | null; children?: React.ReactNode }) {
  // el parche blanco de rotular del vaso va al costado exterior (si no, tapa el electrodo)
  const giro = x < 0 ? -1.02 : 2.6;
  return (
    <group position={[x, 0, 0]}>
      <VasoPrecipitado capacidad={250} rotation-y={giro} />
      {material && <Liquido recipiente={BANCO.vaso} volumenML={BANCO.volumenML} material={material} />}
      {children}
    </group>
  );
}

/** Barra de polipropileno sobre el borde: sujeta la varilla y la pata del puente. */
export function BarraPortaelectrodo({ x, mats }: { x: number; mats: MatsQ9 }) {
  const L = 0.86;
  return (
    <mesh geometry={cajaRedondeada(L, 0.045, 0.14, 0.012, 2)} material={mats.pp}
      position={[x, COTAS.yBorde + 0.0225, 0]} castShadow receiveShadow userData={{ pieza: 'barra' }} />
  );
}

// ───────────────────────────── varilla de electrodo ─────────────────────────────

const SEG_VAR = 40;

/** Cilindro unidad (r = 1, de y = −1 a 0) con la punta redondeada: se escala (r, h, r). */
function geoSumergida() {
  const p: [number, number][] = [[0.0005, -1]];
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); p.push([Math.sin(a) * 1, -1 + (1 - Math.cos(a)) * 0.12]); }
  p.push([1, 0], [0.0005, 0]);
  return tornear(p, SEG_VAR);
}

/** Borne de latón de lo alto de la varilla (collar, cuello y bola), fundido en una pieza. */
let BORNE_VARILLA: THREE.BufferGeometry | null = null;
function geoBorneVarilla() {
  if (!BORNE_VARILLA) {
    const rr = BANCO.rVarillaCm / 10;
    BORNE_VARILLA = fundir([
      { g: cilindro(rr * 1.35, rr * 1.35, 0.06, 28), p: [0, 0.03, 0] },
      { g: cilindro(rr * 0.75, rr * 0.9, 0.05, 20), p: [0, 0.085, 0] },
      { g: esfera(rr * 0.78, 16), p: [0, 0.11, 0] },
    ]);
  }
  return BORNE_VARILLA;
}

export interface PropsVarilla extends GroupProps {
  metal: IdMetal;
  mats: MatsQ9;
  /** cm³ de metal sumergido en este cuadro (lo lee la varilla en su useFrame) */
  volumen?: () => number;
  /** en el reto, sin colocar: tumbada sobre la mesa */
  tumbada?: boolean;
}

/**
 * Varilla de Ø 10 mm con borne de latón. Origen: el eje a la altura de la superficie
 * del líquido. La parte sumergida se dibuja con el radio y el largo de Faraday: si
 * adelgaza, con la superficie ATACADA; si engorda, con el DEPÓSITO mate del metal.
 */
export function Varilla({ metal, mats, volumen, tumbada = false, ...g }: PropsVarilla) {
  const ys = COTAS.ySuperficie;
  const rr = COTAS.rVarilla;
  const largoArriba = COTAS.yTopeVarilla - ys;
  const geoArriba = useMemo(() => cilindro(rr, rr, largoArriba, SEG_VAR, true), [rr, largoArriba]);
  const geoSum = useMemo(() => geoSumergida(), []);
  useEffect(() => () => geoSum.dispose(), [geoSum]);
  const matSum = useMemo(() => mats.pulido(metal).clone(), [mats, metal]);
  useEffect(() => () => matSum.dispose(), [matSum]);
  const sum = useRef<THREE.Mesh>(null);
  const a = ACABADO[metal];
  const cPul = useMemo(() => new THREE.Color(a.pulido[0]), [a]);
  const cAt = useMemo(() => new THREE.Color(a.atacado[0]), [a]);
  const cDep = useMemo(() => new THREE.Color(a.deposito[0]), [a]);
  useFrame(() => {
    const s = sum.current; if (!s) return;
    const V = volumen ? volumen() : null;
    const f = V == null ? { r: BANCO.rVarillaCm, h: BANCO.hSumergidaCm, delta: 0 } : formaVarilla(V);
    s.scale.set(f.r / 10, f.h / 10, f.r / 10);
    s.visible = f.r > 1e-4;
    // aspecto: 0,15 mm de ataque o de depósito ya cambian el brillo (el pulido se pierde enseguida)
    const k = Math.min(1, Math.abs(f.delta) / 0.015);
    if (f.delta < 0) {
      matSum.color.copy(cPul).lerp(cAt, k);
      matSum.roughness = a.pulido[1] + (a.atacado[1] - a.pulido[1]) * k;
      matSum.metalness = 1 - 0.15 * k;
    } else {
      matSum.color.copy(cPul).lerp(cDep, k);
      matSum.roughness = a.pulido[1] + (a.deposito[1] - a.pulido[1]) * k;
      matSum.metalness = 1 - (1 - a.deposito[2]) * k;
    }
  });
  return (
    <group {...g} rotation={tumbada ? [0, 0, Math.PI / 2] : undefined} userData={{ pieza: 'varilla', metal }}>
      <mesh geometry={geoArriba} material={mats.pulido(metal)} position={[0, largoArriba / 2, 0]} castShadow />
      <mesh ref={sum} geometry={geoSum} material={matSum} castShadow scale={[rr, BANCO.hSumergidaCm / 10, rr]} />
      <mesh geometry={geoBorneVarilla()} material={mats.laton} position={[0, COTAS.yTopeVarilla - ys, 0]} />
    </group>
  );
}

// ───────────────────────────── puente salino ─────────────────────────────

/** Eje del tubo en U (plano XY, z = 0), relativo al CENTRO del travesaño. Desde la pata izquierda. */
export function ejePuente(n = 10): number[] {
  const { xPata: X, yPata, yTecho, rEsq: r } = COTAS;
  const y0 = yPata - yTecho;
  const pts: number[] = [];
  const push = (x: number, y: number) => pts.push(x, y, 0);
  const tramo = (x0: number, ya: number, yb: number, k: number) => { for (let i = 0; i < k; i++) push(x0, ya + ((yb - ya) * i) / k); };
  tramo(-X, y0, -r, 8);
  for (let i = 0; i <= n; i++) { const a = Math.PI - (i / n) * (Math.PI / 2); push(-X + r + Math.cos(a) * r, -r + Math.sin(a) * r); }
  for (let i = 1; i < 8; i++) push(-X + r + ((2 * X - 2 * r) * i) / 8, 0);
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 - (i / n) * (Math.PI / 2); push(X - r + Math.cos(a) * r, -r + Math.sin(a) * r); }
  tramo(X, -r - 1e-4, y0, 8);
  push(X, y0);
  return pts;
}

/** Remuestrea una polilínea por longitud de arco: devuelve la función s ∈ [0, L] → punto. */
export function recorrido(pts: number[]) {
  const n = pts.length / 3;
  const acum = [0];
  for (let i = 1; i < n; i++) acum.push(acum[i - 1] + Math.hypot(pts[i * 3] - pts[i * 3 - 3], pts[i * 3 + 1] - pts[i * 3 - 2], pts[i * 3 + 2] - pts[i * 3 - 1]));
  const L = acum[n - 1];
  const en = (s: number, out: THREE.Vector3) => {
    const u = Math.max(0, Math.min(L, s));
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acum[m] <= u) lo = m; else hi = m; }
    const k = (u - acum[lo]) / Math.max(1e-9, acum[hi] - acum[lo]);
    out.set(
      pts[lo * 3] + (pts[hi * 3] - pts[lo * 3]) * k,
      pts[lo * 3 + 1] + (pts[hi * 3 + 1] - pts[lo * 3 + 1]) * k,
      pts[lo * 3 + 2] + (pts[hi * 3 + 2] - pts[lo * 3 + 2]) * k,
    );
    return out;
  };
  return { L, en };
}

/** Tubo de vidrio en U con el gel de agar y los tapones. Origen: centro del travesaño. */
export function PuenteSalino({ mats }: { mats: MatsQ9 }) {
  const m = useMateriales();
  const geoVidrio = useMemo(() => tuboPolilinea(ejePuente(14), 0.068, 28, false), []);
  // el gel de agar cuaja dentro del tubo y él mismo cierra las puntas: sin tapones de algodón
  // (se veían como una mancha blanca dentro de cada vaso)
  const geoGel = useMemo(() => tuboPolilinea(ejePuente(14), 0.049, 20, true), []);
  useEffect(() => () => { geoVidrio.dispose(); geoGel.dispose(); }, [geoVidrio, geoGel]);
  return (
    <group userData={{ pieza: 'puente' }}>
      <mesh geometry={geoVidrio} material={m.vidrio} renderOrder={4} castShadow customDepthMaterial={m.sombraVidrio} />
      <mesh geometry={geoGel} material={mats.gel} renderOrder={5} />
    </group>
  );
}

// ───────────────────────────── voltímetro analógico ─────────────────────────────

export type EscalaV = 1.5 | 5;

/** Esfera del voltímetro: dos escalas de cero central; la activa en negro y rojo, la otra apagada. */
function dibujarEsfera(ctx: CanvasRenderingContext2D, W: number, H: number, activa: EscalaV) {
  const fam = familiaTexto();
  // cartulina blanca cálida con un degradado muy suave
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#fbfaf5'); g.addColorStop(1, '#efede4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const px = W / COTAS.ventana.ancho;                 // píxeles por u
  const cx = W / 2, cy = H + 0.0 * px;                // pivote en el borde inferior
  const R = 0.5 * px;
  const A = COTAS.arcoEscala;
  const ang = (f: number) => -Math.PI / 2 + f * A;    // f ∈ [−1, 1]
  const pol = (f: number, r: number): [number, number] => [cx + Math.cos(ang(f)) * r, cy + Math.sin(ang(f)) * r];
  // espejo antiparalaje: banda plateada bajo la escala exterior
  ctx.lineWidth = 0.022 * px;
  const gm = ctx.createLinearGradient(0, cy - R, 0, cy - R * 0.85);
  gm.addColorStop(0, '#d9dde0'); gm.addColorStop(0.5, '#f7f9fa'); gm.addColorStop(1, '#c4c9cd');
  ctx.strokeStyle = gm;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.905, ang(-1.02), ang(1.02)); ctx.stroke();
  const escala = (rango: EscalaV, rIn: number, rOut: number, rTxt: number, color: string, on: boolean) => {
    const paso = rango === 5 ? 0.2 : 0.05;
    const mayor = rango === 5 ? 1 : 0.5;
    const medio = rango === 5 ? 0.5 : 0.25;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.globalAlpha = on ? 1 : 0.3;
    ctx.lineWidth = 0.005 * px;
    ctx.beginPath(); ctx.arc(cx, cy, rIn, ang(-1), ang(1)); ctx.stroke();
    const N = Math.round((2 * rango) / paso);
    for (let i = 0; i <= N; i++) {
      const v = -rango + i * paso;
      const f = v / rango;
      const esMayor = Math.abs(v / mayor - Math.round(v / mayor)) < 1e-6;
      const esMedio = Math.abs(v / medio - Math.round(v / medio)) < 1e-6;
      const l = esMayor ? 1 : esMedio ? 0.62 : 0.38;
      const [x0, y0] = pol(f, rIn), [x1, y1] = pol(f, rIn + (rOut - rIn) * l * (rOut > rIn ? 1 : 1));
      ctx.lineWidth = (esMayor ? 0.0085 : 0.0048) * px;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      if (esMayor) {
        const [tx, ty] = pol(f, rTxt);
        ctx.font = `700 ${0.044 * px}px ${fam}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const t = Math.abs(v) < 1e-9 ? '0' : Math.abs(v).toString().replace('.', ',');
        ctx.fillText(t, tx, ty);
      }
    }
    ctx.globalAlpha = 1;
  };
  escala(5, R * 0.86, R * 0.94, R * 1.0, '#15181b', activa === 5);
  escala(1.5, R * 0.7, R * 0.62, R * 0.55, '#b3261e', activa === 1.5);
  ctx.fillStyle = '#15181b';
  ctx.font = `700 ${0.06 * px}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('V', cx, cy - R * 0.36);
  ctx.font = `700 ${0.05 * px}px ${fam}`;
  const [mx, my] = pol(-1.12, R * 0.78), [px2, py2] = pol(1.12, R * 0.78);
  ctx.fillText('−', mx, my); ctx.fillText('+', px2, py2);
  ctx.font = `500 ${0.022 * px}px ${fam}`; ctx.fillStyle = '#5a6066';
  ctx.fillText('Clase 1,5   ⊓   DC', cx, cy - R * 0.2);
}

/**
 * Voltímetro sobre su elevador. Origen: centro de la base del elevador, en la mesa.
 * `lectura()` = voltios con signo que mide (V⁺ − COM); la aguja la sigue con una
 * respuesta de segundo orden (instrumento de bobina móvil, τ ≈ 0,25 s, ζ ≈ 0,7).
 */
export function Voltimetro({ mats, lectura, escala, carga, ...g }: GroupProps & { mats: MatsQ9; lectura: () => number; escala: EscalaV; carga: Carga }) {
  const m = useMateriales();
  const vf = useVersionFuentes();
  const { anchoCaja: AW, altoCaja: AH, fondoCaja: AD, altoElevador: HE, ventana } = COTAS;
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = 2048, H = Math.round((W * ventana.alto) / ventana.ancho);
    const c = crearLienzo(W, H);
    dibujarEsfera(c.getContext('2d')!, W, H, escala);
    return texturaDeLienzo(c);
  }, [escala, vf, ventana.alto, ventana.ancho]);
  useEffect(() => () => tex?.dispose(), [tex]);
  // cartulina mate algo gris: bajo la luz clave no se quema (ni dispara el bloom)
  const matEsfera = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, color: '#d4d2ca', roughness: 0.78, metalness: 0, name: 'q9-esfera' }), [tex]);
  useEffect(() => () => matEsfera.dispose(), [matEsfera]);
  const rango = useRef<EscalaV>(escala);
  rango.current = escala;
  const geoAguja = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.006, -0.06); s.lineTo(0.006, -0.06); s.lineTo(0.0022, 0.47); s.lineTo(0, 0.485); s.lineTo(-0.0022, 0.47); s.lineTo(-0.006, -0.06);
    const aguja = extruir(s, 0.004, 4);
    // con su contrapeso: una sola pieza
    const g = fundir([{ g: aguja }, { g: cilindro(0.016, 0.016, 0.008, 16), p: [0, -0.05, 0.002], r: [Math.PI / 2, 0, 0] }]);
    aguja.dispose();
    return g;
  }, []);
  useEffect(() => () => geoAguja.dispose(), [geoAguja]);
  // piezas fijas del frente fundidas por material (pocas llamadas de dibujo)
  const fijas = useMemo(() => {
    const yB = COTAS.yBornes, xB = COTAS.xBorne, yP = ventana.y - ventana.alto / 2;
    const borne = (x: number): Parte[] => [
      { g: cilindro(0.05, 0.055, 0.04, 24), p: [x, yB, 0.02], r: [Math.PI / 2, 0, 0] },
      { g: cilindro(0.042, 0.042, 0.03, 6), p: [x, yB, 0.075], r: [Math.PI / 2, 0, 0] },
    ];
    const bisel = formaRectRedondeado(ventana.ancho + 0.1, ventana.alto + 0.1, 0.045);
    bisel.holes.push(new THREE.Path(formaRectRedondeado(ventana.ancho, ventana.alto, 0.02).getPoints(24).reverse()));
    const geoMarco = extruir(bisel, 0.025, 12);
    const out = {
      // marco de la ventana, tapa del pivote y placa del selector
      bisel: fundir([
        { g: geoMarco, p: [0, ventana.y, -0.004] },
        { g: cilindro(0.032, 0.032, 0.018, 24), p: [0, yP, 0.016], r: [Math.PI / 2, 0, 0] },
        { g: cajaRedondeada(0.28, 0.15, 0.03, 0.02, 2), p: [0, yB - 0.005, 0.012] },
      ]),
      // tornillo de cero (bajo la esfera, a un lado del pivote) y borne COM
      negro: fundir([{ g: cilindro(0.026, 0.028, 0.014, 20), p: [0.2, yP - 0.06, 0.007], r: [Math.PI / 2, 0, 0] }, ...borne(-xB)]),
      rojo: fundir(borne(xB)),
      laton: fundir([-xB, xB].map((x) => ({ g: cilindro(0.016, 0.016, 0.07, 14), p: [x, yB, 0.06] as V3, r: [Math.PI / 2, 0, 0] as V3 }))),
      // marcas de las posiciones del selector
      marcas: fundir([-1, -0.33, 0.33, 1].map((k) => ({ g: esfera(0.008, 8), p: [Math.sin(k * 0.9) * 0.095, yB + Math.cos(k * 0.9) * 0.095 - 0.02, 0.03] as V3 }))),
    };
    geoMarco.dispose();
    return out;
  }, [ventana.alto, ventana.ancho, ventana.y]);
  useEffect(() => () => { Object.values(fijas).forEach((x) => x.dispose()); }, [fijas]);
  // dinámica de la aguja (en tiempo REAL: es el instrumento, no la química)
  const aguja = useRef<THREE.Group>(null);
  const din = useRef({ th: 0, w: 0 });
  useFrame((_, dt) => {
    const a = aguja.current; if (!a) return;
    const h = Math.min(dt, 0.05);
    const f = Math.max(-1.06, Math.min(1.06, lectura() / rango.current));
    const obj = -f * COTAS.arcoEscala;
    const wn = 2 * Math.PI / 0.55, z = 0.68;
    const d = din.current;
    const acc = wn * wn * (obj - d.th) - 2 * z * wn * d.w;
    d.w += acc * h; d.th += d.w * h;
    a.rotation.z = d.th;
  });
  const anguloCarga = carga === 'abierta' ? -1 : carga === 1000 ? -0.33 : carga === 100 ? 0.33 : 1;
  const yF = HE + AH / 2;          // centro del frente
  const zF = AD / 2;               // frente (local)
  const yPiv = ventana.y - ventana.alto / 2;
  return (
    <group {...g}>
      {/* elevador de aluminio anodizado */}
      <mesh geometry={cajaRedondeada(AW + 0.16, HE, AD + 0.2, 0.03, 3)} material={mats.elevador} position={[0, HE / 2, 0]} castShadow receiveShadow />
      {/* caja del instrumento: frente un poco echado hacia atrás */}
      <group position={[0, yF, 0]} userData={{ pieza: 'voltimetro' }}>
        <mesh geometry={cajaRedondeada(AW, AH, AD, 0.07, 4)} material={mats.carcasa} castShadow receiveShadow />
        <group position={[0, 0, zF]}>
          {/* marco, tapa del pivote y placa del selector (una pieza de aluminio) */}
          <mesh geometry={fijas.bisel} material={mats.bisel} />
          <mesh material={matEsfera} position={[0, ventana.y, 0.002]}>
            <planeGeometry args={[ventana.ancho, ventana.alto]} />
          </mesh>
          {/* aguja con su contrapeso, pivote al pie de la esfera */}
          <group ref={aguja} position={[0, yPiv, 0.012]}>
            <mesh geometry={geoAguja} material={mats.aguja} />
          </group>
          {/* cristal */}
          <mesh geometry={cajaRedondeada(ventana.ancho, ventana.alto, 0.006, 0.002, 1)} material={m.vidrio} position={[0, ventana.y, 0.024]} renderOrder={3} />
          {/* tornillo de cero + borne COM (negro), borne + (rojo) y sus postes de latón */}
          <mesh geometry={fijas.negro} material={mats.negro} />
          <mesh geometry={fijas.rojo} material={mats.rojo} />
          <mesh geometry={fijas.laton} material={mats.laton} />
          {/* selector de la caja de carga entre los bornes */}
          <group userData={{ pieza: 'carga' }}>
            <mesh geometry={fijas.marcas} material={mats.algodon} />
          </group>
          <group position={[0, COTAS.yBornes, 0]} userData={{ pieza: 'carga' }}>
            <group rotation-z={-anguloCarga * 0.9} position={[0, -0.02, 0.03]}>
              <mesh geometry={cilindro(0.052, 0.058, 0.05, 18)} material={mats.negro} rotation-x={Math.PI / 2} position={[0, 0, 0.025]} castShadow />
              <mesh geometry={cajaRedondeada(0.008, 0.05, 0.006, 0.002, 1)} material={mats.algodon} position={[0, 0.03, 0.052]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ───────────────────────────── cables y pinzas ─────────────────────────────

/**
 * Polilínea de un cable de prueba: sale de la pinza hacia arriba y atrás, cuelga y
 * entra de frente en el borne. Bézier cúbica muestreada (la misma que siguen los
 * electrones).
 */
export function trazaCable(pinza: V3, borne: V3, n = 46): number[] {
  const P0 = new THREE.Vector3(...pinza), P3 = new THREE.Vector3(...borne);
  const sx = Math.sign(pinza[0] || 1);
  // sube desde la pinza, pasa por detrás y POR ENCIMA del travesaño del puente y entra
  // al borne desde arriba y delante (así ningún tramo se ve a través del vidrio del puente)
  const P1 = P0.clone().add(new THREE.Vector3(sx * 0.1, 0.32, -0.16));
  const P2 = P3.clone().add(new THREE.Vector3(sx * 0.05, 0.3, 0.34));
  const c = new THREE.CubicBezierCurve3(P0, P1, P2, P3);
  const out: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { c.getPoint(i / (n - 1), v); out.push(v.x, v.y, v.z); }
  return out;
}

/** Cable de silicona (se reconstruye sólo cuando cambian sus extremos). */
export function CablePrueba({ pinza, borne, material }: { pinza: V3; borne: V3; material: THREE.Material }) {
  const clave = [...pinza, ...borne].map((v) => v.toFixed(4)).join(',');
  const geo = useMemo(() => tuboPolilinea(trazaCable(pinza, borne), 0.017, 12, true), [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} castShadow />;
}

/**
 * Pinza de cocodrilo con funda: mordazas de acero dentadas y funda de color. Origen
 * en la punta de las mordazas; el cuerpo va hacia +X local.
 */
export function PinzaCocodrilo({ funda, mats, ...g }: GroupProps & { funda: THREE.Material; mats: MatsQ9 }) {
  const geoMordaza = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0.16, 0.012); s.lineTo(0.16, 0.026); s.lineTo(0.01, 0.022); s.lineTo(0, 0.008); s.lineTo(0, 0);
    const geo = extruir(s, 0.034, 6);
    geo.translate(0, 0, -0.017);
    return sanearNormales(geo);
  }, []);
  useEffect(() => () => geoMordaza.dispose(), [geoMordaza]);
  const geoFunda = useMemo(() => {
    const p: [number, number][] = [[0.0005, 0], [0.03, 0.0], [0.034, 0.03], [0.032, 0.11], [0.02, 0.15], [0.0005, 0.152]];
    const geo = tornear(p, 20);
    geo.rotateZ(-Math.PI / 2);
    return geo;
  }, []);
  useEffect(() => () => geoFunda.dispose(), [geoFunda]);
  // las dos mordazas (la de abajo, reflejada) en una sola pieza
  const geoMordazas = useMemo(() => {
    let abajo = geoMordaza.clone();
    if (abajo.index) { const ni = abajo.toNonIndexed(); abajo.dispose(); abajo = ni; }
    abajo.scale(1, -1, 1);
    // al reflejar, el orden de los triángulos se invierte: se le da la vuelta para conservar las caras hacia fuera
    const pos = abajo.getAttribute('position') as THREE.BufferAttribute;
    const nor = abajo.getAttribute('normal') as THREE.BufferAttribute;
    const uv = abajo.getAttribute('uv') as THREE.BufferAttribute | undefined;
    for (let i = 0; i < pos.count; i += 3) {
      for (const at of [pos, nor]) { const x = at.getX(i + 1), y = at.getY(i + 1), z = at.getZ(i + 1); at.setXYZ(i + 1, at.getX(i + 2), at.getY(i + 2), at.getZ(i + 2)); at.setXYZ(i + 2, x, y, z); }
      if (uv) { const u = uv.getX(i + 1), v = uv.getY(i + 1); uv.setXY(i + 1, uv.getX(i + 2), uv.getY(i + 2)); uv.setXY(i + 2, u, v); }
    }
    const g = fundir([{ g: geoMordaza, p: [0, 0.004, 0] }, { g: abajo, p: [0, -0.004, 0] }]);
    abajo.dispose();
    return g;
  }, [geoMordaza]);
  useEffect(() => () => geoMordazas.dispose(), [geoMordazas]);
  return (
    <group {...g}>
      <mesh geometry={geoMordazas} material={mats.acero} />
      <mesh geometry={geoFunda} material={funda} position={[0.13, 0, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── líquido (Beer–Lambert) ─────────────────────────────

/** Material del líquido de un vaso; el color de atenuación lo fija la escena con `tintarLiquido`. */
export function crearMaterialLiquido(calidad: Calidad): THREE.MeshPhysicalMaterial {
  if (calidad === 'alta') {
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.04, transmission: 1, ior: 1.34,
      thickness: 2 * COTAS.rInterior, attenuationDistance: 1, attenuationColor: new THREE.Color(1, 1, 1),
      specularIntensity: 1, envMapIntensity: 1, side: THREE.DoubleSide, name: 'q9-liquido',
    });
  }
  // media (sin pasada de transmisión): transparente; el reflejo del entorno va contenido
  // para que no lave el color de Beer–Lambert hacia el blanco
  return new THREE.MeshPhysicalMaterial({
    color: '#dbeef3', metalness: 0, roughness: 0.12, transparent: true, opacity: 0.3,
    specularIntensity: 0.45, envMapIntensity: 0.3, depthWrite: false, name: 'q9-liquido',
  });
}

/**
 * Tiñe el líquido con Beer–Lambert: absorción por canal μ = ε·c·ln10 (1/cm). En alta,
 * `attenuationColor` = transmitancia de 1 u (10 cm) y `thickness` = el diámetro del
 * vaso: three integra e^(−μ·d) en cada píxel. En media, el color de la transmitancia
 * a media anchura y una opacidad que crece con la absorción.
 */
export function tintarLiquido(mat: THREE.MeshPhysicalMaterial, metal: IdMetal, c: number, calidad: Calidad) {
  const eps = METAL[metal].epsRGB;
  const base = [0.985, 0.992, 0.996]; // el agua sola: un velo frío casi imperceptible
  if (calidad === 'alta') {
    mat.attenuationColor.setRGB(
      Math.max(1e-12, base[0] * Math.pow(10, -eps[0] * c * 10)),
      Math.max(1e-12, base[1] * Math.pow(10, -eps[1] * c * 10)),
      Math.max(1e-12, base[2] * Math.pow(10, -eps[2] * c * 10)),
    );
    return;
  }
  const l = COTAS.rInterior * 10; // cm
  const t = eps.map((e, i) => base[i] * Math.pow(10, -e * c * l));
  // un líquido no tiene albedo difuso: con el color de T entero, la luz clave lo quemaba
  // hacia el blanco. Con ~1/3, lo iluminado vuelve a dar ≈ T.
  mat.color.setRGB(t[0] * 0.32 + 0.01, t[1] * 0.34 + 0.01, t[2] * 0.36 + 0.012);
  const absorbe = 1 - (t[0] + t[1] + t[2]) / 3;
  mat.opacity = 0.2 + 0.7 * absorbe;
}

/** Desplazamiento del lienzo para comprobar normales (diagnóstico). */
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

/** Hook auxiliar: fija una vez la matriz de un objeto (piezas estáticas). */
export function useEstatico(ref: React.RefObject<THREE.Object3D | null>) {
  useLayoutEffect(() => { const o = ref.current; if (!o) return; o.updateMatrixWorld(true); o.matrixAutoUpdate = false; }, [ref]);
}
