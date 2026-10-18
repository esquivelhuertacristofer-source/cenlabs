'use client';
/**
 * bio04/membrana.tsx — la vista TILACOIDE: un trozo de la membrana del tilacoide, la membrana
 * de enfrente y el lumen entre las dos, a CÁMARA LENTA ×1/40 (esquema: 1 u ≈ 2,5 nm; cada
 * proteína es un cúmulo de esferas con su forma y su tamaño aproximados).
 *
 * Todo sale de UNA tasa del reloj: `tasas.eMembrana` (e⁻/s de pantalla en un PSII, ya
 * ralentizados), y de la fracción de fotones absorbidos que se usan (`tasas.pUsar`):
 *  · 2 FOTONES por electrón (uno llega a la antena de cada fotosistema y su excitación salta
 *    al centro de reacción) y los que sobran se disipan (destello rojo: fluorescencia y calor).
 *  · El e⁻ recorre el ESQUEMA Z: P680* → feofitina → QA → QB → plastoquinona (lleva 2 e⁻ y
 *    toma 2 H⁺ del estroma) → citocromo b₆f (ciclo Q: 2 H⁺ por e⁻ al lumen) → plastocianina
 *    (1 e⁻) → P700 → P700* → A₀ → Fₓ → ferredoxina (1 e⁻) → FNR (2 e⁻ + H⁺ + NADP⁺ → NADPH).
 *  · Cada e⁻ que sale del P680 lo repone el agua: cada 4 e⁻ el Mn₄CaO₅ rompe 2 H₂O y suelta
 *    O₂ y 4 H⁺ al lumen.
 *  · Los H⁺ del lumen se dibujan en número PROPORCIONAL a [H⁺] = 10^−pH del modelo y vuelven
 *    al estroma por la ATP sintasa: cada H⁺ se sube a una subunidad c y da (13/14) de vuelta
 *    con el anillo; 14 H⁺ = 1 vuelta = 3 ATP (uno por cada 120°).
 * `reloj.trazador` = punto del esquema Z donde va el e⁻ más antiguo en vuelo (lo pinta el dock).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { cajaRedondeada } from '../_kit';
import type { Calidad } from '../_kit';
import { colorLambda, muestrearLambda, SUBUNIDADES_C, ATP_POR_VUELTA, E_POR_O2, PH_LUMEN_OSCURO, DELTA_PH_LUMEN } from './fotosintesis';
import { materialBicapa, materialBrillo, materialCera, materialEstela, materialHalo, colorPH } from './materiales';
import { azar } from './particulas';
import type { RelojFoto } from './reloj';
import type { V3 } from './cloroplasto';

type Reloj = React.MutableRefObject<RelojFoto>;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ───────────────────────────── cotas y sitios ─────────────────────────────

/** Membrana de arriba (y ∈ ±e), membrana de enfrente (centro yInf) y el lumen entre las dos. */
/**
 * La membrana sigue más allá del cuadro por los lados (es una lámina, no una caja) y está
 * CORTADA en z = z1, por la mitad de las proteínas: su cara de corte enseña las cabezas y las
 * colas de los lípidos, y las proteínas asoman enteras por delante (convención de los
 * esquemas de membrana en sección).
 */
export const MEMB = { x0: -15, x1: 15, z0: -3.0, z1: 0.15, e: 0.78 } as const;
/** El lumen, debajo de la membrana (la membrana de enfrente del disco queda fuera del cuadro). */
export const LUMEN = { y0: -3.0, y1: -MEMB.e } as const;

export const SITIO = {
  psii: V(-5.0, 0, 0.3), b6f: V(-1.4, 0, -0.35), psi: V(1.9, 0, 0.4),
  fnr: V(4.2, MEMB.e + 0.45, 1.1), atp: V(6.4, 0, -0.1),
} as const;
const rel = (s: THREE.Vector3, x: number, y: number, z: number) => s.clone().add(V(x, y, z));
/** Puntos del camino del electrón y de los H⁺ (mundo). */
export const P = {
  oec: rel(SITIO.psii, 0.45, -1.62, 1.25),
  p680: rel(SITIO.psii, 0.3, -0.35, 1.05),
  feo: rel(SITIO.psii, 0.12, 0.08, 1.12),
  qa: rel(SITIO.psii, -0.22, 0.48, 1.02),
  qb: rel(SITIO.psii, 0.8, 0.42, 1.0),
  qo: rel(SITIO.b6f, -0.3, -0.38, 0.62),
  qn: rel(SITIO.b6f, -0.2, 0.62, 0.6),
  cytf: rel(SITIO.b6f, 0.32, -1.3, 0.6),
  pcB6f: rel(SITIO.b6f, 0.62, -1.9, 0.78),
  pcPsi: rel(SITIO.psi, -0.45, -1.32, 0.75),
  p700: rel(SITIO.psi, -0.1, -0.35, 0.6),
  a0: rel(SITIO.psi, 0.0, 0.15, 0.55),
  fx: rel(SITIO.psi, 0.1, 0.65, 0.5),
  fdPsi: rel(SITIO.psi, 0.3, 1.58, 0.72),
  fdFnr: rel(SITIO.fnr, -0.64, 0.05, 0.1),
  fad: rel(SITIO.fnr, 0, 0.1, 0.2),
  nadp: rel(SITIO.fnr, 0.35, 0.62, 0.25),
  hEntrada: rel(SITIO.atp, 1.02, -1.05, 0.5),
  hSalida: rel(SITIO.atp, 1.02, 1.05, 0.5),
} as const;

/** Anillo c y cabeza de la ATP sintasa (relativos al sitio). */
const ANILLO_C = { R: 0.92, y: 0 };
/** Ángulo φ = atan2(z, x) del semicanal de entrada de los H⁺ alrededor del eje de la sintasa. */
const FI_ENTRADA = Math.atan2(0.5, 1.02);
const CABEZA = { y: 3.65, R: 0.82 };

// ───────────────────────────── cúmulos de esferas ─────────────────────────────

interface Forma { c: V3; r: V3 }
interface Cuenta { p: THREE.Vector3; r: number; col: THREE.Color }

/**
 * Cuentas en la CÁSCARA de una unión de elipsoides (las de dentro no se verían), con un poco
 * de solape y una variación de tono suave (no es ruido de alta frecuencia: cada cuenta ocupa
 * decenas de píxeles).
 */
function cumulo(semilla: number, centro: THREE.Vector3, formas: Forma[], color: string, rb = 0.2, max = 400): Cuenta[] {
  const rnd = azar(semilla);
  const lo = V(Infinity, Infinity, Infinity), hi = V(-Infinity, -Infinity, -Infinity);
  for (const f of formas) for (let k = 0; k < 3; k++) {
    lo.setComponent(k, Math.min(lo.getComponent(k), f.c[k] - f.r[k]));
    hi.setComponent(k, Math.max(hi.getComponent(k), f.c[k] + f.r[k]));
  }
  const out: Cuenta[] = [];
  const base = new THREE.Color(color);
  const p = V(0, 0, 0);
  for (let intento = 0; intento < 26000 && out.length < max; intento++) {
    p.set(lo.x + rnd() * (hi.x - lo.x), lo.y + rnd() * (hi.y - lo.y), lo.z + rnd() * (hi.z - lo.z));
    let prof = -Infinity;
    for (const f of formas) {
      const q = ((p.x - f.c[0]) / f.r[0]) ** 2 + ((p.y - f.c[1]) / f.r[1]) ** 2 + ((p.z - f.c[2]) / f.r[2]) ** 2;
      prof = Math.max(prof, (1 - Math.sqrt(q)) * Math.min(f.r[0], f.r[1], f.r[2]));
    }
    if (prof < rb * 0.2 || prof > rb * 1.25) continue;
    const r = rb * (0.82 + 0.36 * rnd());
    let choca = false;
    for (const b of out) { const dx = b.p.x - p.x - centro.x, dy = b.p.y - p.y - centro.y, dz = b.p.z - p.z - centro.z; const m = (b.r + r) * 0.84; if (dx * dx + dy * dy + dz * dz < m * m) { choca = true; break; } }
    if (choca) continue;
    out.push({ p: p.clone().add(centro), r, col: base.clone().offsetHSL(0, (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.07) });
  }
  return out;
}

const trimero = (cx: number, cz: number, giro: number): Forma[] => [0, 1, 2].map((k) => {
  const a = giro + (k * 2 * Math.PI) / 3;
  return { c: [cx + Math.cos(a) * 0.52, 0, cz + Math.sin(a) * 0.52] as V3, r: [0.5, 0.78, 0.5] as V3 };
});

export interface Complejo { id: string; pieza: string; cuentas: Cuenta[] }

/** Los complejos fijos de la membrana de arriba (el rotor de la ATP sintasa va aparte). */
function complejos(): { fijos: Complejo[]; rotor: Cuenta[]; antenaII: Cuenta[]; antenaI: Cuenta[] } {
  const s = SITIO;
  const psii = cumulo(11, s.psii, [
    { c: [0, -0.05, -0.95], r: [1.05, 1.1, 0.95] }, { c: [0, -0.05, 0.95], r: [1.05, 1.1, 0.95] },
    { c: [0.15, -1.35, -0.85], r: [0.8, 0.5, 0.62] }, { c: [0.15, -1.35, 0.85], r: [0.8, 0.5, 0.62] },
    { c: [0, 1.0, -0.8], r: [0.75, 0.3, 0.6] }, { c: [0, 1.0, 0.8], r: [0.75, 0.3, 0.6] },
  ], '#3f9a6e', 0.21);
  const antenaII = cumulo(12, s.psii, [
    ...trimero(-2.15, 0.15, 0.3), ...trimero(-1.55, -1.85, 1.1), ...trimero(0.55, -2.15, 0.7),
  ], '#86c95c', 0.19);
  const b6f = cumulo(13, s.b6f, [
    { c: [0, 0, -0.62], r: [0.78, 1.0, 0.62] }, { c: [0, 0, 0.62], r: [0.78, 1.0, 0.62] },
    { c: [0.3, -1.2, -0.55], r: [0.48, 0.42, 0.42] }, { c: [0.3, -1.2, 0.55], r: [0.48, 0.42, 0.42] },
    { c: [-0.1, 0.95, -0.5], r: [0.5, 0.25, 0.42] }, { c: [-0.1, 0.95, 0.5], r: [0.5, 0.25, 0.42] },
  ], '#d98a4a', 0.2);
  const psi = cumulo(14, s.psi, [
    { c: [0, 0, 0], r: [1.3, 1.0, 1.15] }, { c: [0.15, 1.05, 0.1], r: [0.75, 0.35, 0.65] }, { c: [0, -0.95, 0], r: [0.9, 0.24, 0.8] },
  ], '#2f8f8a', 0.21);
  const antenaI = cumulo(15, s.psi, [0, 1, 2, 3].map((i) => ({ c: [-1.2 + 0.8 * i, 0, -1.55] as V3, r: [0.42, 0.72, 0.42] as V3 })), '#9bd46e', 0.19);
  const fnr = cumulo(16, s.fnr, [{ c: [0, 0, 0], r: [0.58, 0.44, 0.52] }], '#e0b84a', 0.17);
  // ATP sintasa: estator (a, b, α₃β₃, δ) fijo
  const a = s.atp;
  const sub: Forma[] = [{ c: [1.28, 0, 0], r: [0.5, 0.85, 0.55] }];
  const tallo: Cuenta[] = [];
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const pt = V(1.38 - 0.1 * t, 0.9 + 2.9 * t, 0.05);
    if (t > 0.8) pt.x -= (t - 0.8) * 3.2;
    tallo.push({ p: pt.add(a), r: 0.16, col: new THREE.Color('#b9a6e0') });
  }
  const estatorA = cumulo(17, a, sub, '#b9a6e0', 0.19);
  const alfa: Forma[] = [], beta: Forma[] = [];
  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    (k % 2 ? beta : alfa).push({ c: [Math.cos(ang) * CABEZA.R, CABEZA.y, Math.sin(ang) * CABEZA.R], r: [0.5, 0.8, 0.5] });
  }
  const cabezaA = cumulo(18, a, alfa, '#efb3c2', 0.2);
  const cabezaB = cumulo(19, a, beta, '#c96b8c', 0.2);
  const delta = cumulo(20, a, [{ c: [0, CABEZA.y + 0.92, 0], r: [0.45, 0.26, 0.45] }], '#b9a6e0', 0.16);
  // rotor (anillo c + γ + ε), relativo al eje de la sintasa
  const rotor: Cuenta[] = [];
  for (let k = 0; k < SUBUNIDADES_C; k++) {
    const ang = (k * 2 * Math.PI) / SUBUNIDADES_C;
    for (const y of [-0.56, 0, 0.56]) rotor.push({ p: V(Math.cos(ang) * ANILLO_C.R, y, Math.sin(ang) * ANILLO_C.R), r: 0.205, col: new THREE.Color('#9c7ad6').offsetHSL(0, 0, y === 0 ? 0.03 : -0.02) });
  }
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    rotor.push({ p: V(0.12 * Math.sin(t * 3), 0.85 + 2.45 * t, 0.1 * Math.cos(t * 2)), r: 0.24 - 0.04 * t, col: new THREE.Color('#6f52b8') });
  }
  for (let k = 0; k < 3; k++) { const ang = (k * 2 * Math.PI) / 3; rotor.push({ p: V(Math.cos(ang) * 0.36, 0.95, Math.sin(ang) * 0.36), r: 0.2, col: new THREE.Color('#8466c8') }); }
  return {
    fijos: [
      { id: 'psii', pieza: 'psii', cuentas: psii },
      { id: 'lhcii', pieza: 'lhcii', cuentas: antenaII },
      { id: 'b6f', pieza: 'b6f', cuentas: b6f },
      { id: 'psi', pieza: 'psi', cuentas: psi },
      { id: 'lhci', pieza: 'lhci', cuentas: antenaI },
      { id: 'fnr', pieza: 'fnr', cuentas: fnr },
      { id: 'atp', pieza: 'atp', cuentas: [...estatorA, ...tallo, ...cabezaA, ...cabezaB, ...delta] },
    ],
    rotor, antenaII, antenaI,
  };
}

// ───────────────────────────── piezas fijas ─────────────────────────────

const GEO_CUENTA = () => new THREE.IcosahedronGeometry(1, 1);

function Cumulo({ c, mat, geo }: { c: Complejo; mat: THREE.Material; geo: THREE.BufferGeometry }) {
  const im = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = im.current; if (!m) return;
    const o = new THREE.Object3D();
    c.cuentas.forEach((b, i) => { o.position.copy(b.p); o.scale.setScalar(b.r); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, b.col); });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [c]);
  return <instancedMesh ref={im} args={[geo, mat, c.cuentas.length]} userData={{ pieza: c.pieza }} />;
}

/** La bicapa (translúcida, con las cabezas y las colas a la vista en los bordes) y el lumen teñido por el pH. */
function Membranas({ reloj, ocupadas }: { reloj: Reloj; ocupadas: Cuenta[] }) {
  const { x0, x1, z0, z1, e } = MEMB;
  const L = x1 - x0, D = z1 - z0;
  const geoLosa = useMemo(() => cajaRedondeada(L, 2 * e, D, 0.3, 3), [L, D, e]);
  const matLosa = useMemo(() => materialBicapa(), []);
  // cabezas (esferas) y colas (cilindros finos) en los bordes de delante y de la derecha
  const { cabezas, colas } = useMemo(() => {
    const cab: THREE.Matrix4[] = [], col: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    const paso = 0.31;
    const puntos: { x: number; z: number; nx: number; nz: number }[] = [];
    for (let x = x0 + 0.2; x <= x1 - 0.2; x += paso) puntos.push({ x, z: z1 - 0.03, nx: 0, nz: 1 });
    // donde una proteína atraviesa la cara de corte no hay lípidos
    const cerca = ocupadas.filter((b) => Math.abs(b.p.z - z1) < 0.7 && Math.abs(b.p.y) < e + 0.4);
    const libre = (x: number, y: number) => !cerca.some((b) => (b.p.x - x) ** 2 + (b.p.y - y) ** 2 + (b.p.z - z1) ** 2 < (b.r + 0.2) ** 2);
    let k = 0;
    for (const q of puntos) for (const s of [1, -1]) {
      k++;
      const y = s * (e - 0.15);
      if (!libre(q.x, y) || !libre(q.x, y - s * 0.36)) continue;
      o.position.set(q.x, y, q.z); o.rotation.set(0, 0, 0); o.scale.setScalar(0.15); o.updateMatrix(); cab.push(o.matrix.clone());
      for (const d of [-0.055, 0.055]) {
        // dos colas por lípido, hacia el centro de la bicapa (con un quiebro: el doble enlace cis)
        o.position.set(q.x + d * (q.nz ? 1 : 0), y - s * 0.36, q.z + d * (q.nx ? 1 : 0));
        o.rotation.set(0, 0, ((k % 3) - 1) * 0.12 * s); o.scale.set(1, 1, 1); o.updateMatrix(); col.push(o.matrix.clone());
      }
    }
    return { cabezas: cab, colas: col };
  }, [x0, x1, z1, e, ocupadas]);
  const geoCab = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const geoCola = useMemo(() => new THREE.CylinderGeometry(0.032, 0.026, 0.46, 5), []);
  const matCab = useMemo(() => materialCera({ color: '#f1dcb4', rugosidad: 0.5, borde: '#fff6e0', fuerzaBorde: 0.18 }, 'cabeza'), []);
  const matCola = useMemo(() => materialCera({ color: '#d9b45c', rugosidad: 0.6, fuerzaBorde: 0.05 }, 'cola'), []);
  const imCab = useRef<THREE.InstancedMesh>(null), imCola = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const a = imCab.current, b = imCola.current; if (!a || !b) return;
    cabezas.forEach((m, i) => a.setMatrixAt(i, m)); colas.forEach((m, i) => b.setMatrixAt(i, m));
    a.instanceMatrix.needsUpdate = true; b.instanceMatrix.needsUpdate = true;
    a.computeBoundingSphere(); b.computeBoundingSphere();
  }, [cabezas, colas]);
  // lumen: volumen translúcido del color del pH, que se desvanece hacia abajo
  const geoLumen = useMemo(() => new THREE.BoxGeometry(L - 0.3, LUMEN.y1 - LUMEN.y0, D - 0.3), [L, D]);
  const matLumen = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color('#4fd1b8') }, uY0: { value: LUMEN.y0 }, uY1: { value: LUMEN.y1 } },
    vertexShader: /* glsl */ `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uY0; uniform float uY1; varying vec3 vP;
      void main(){
        float a = 0.3 * smoothstep(uY0, uY1, vP.y);
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
  }), []);
  const ultimo = useRef(-1);
  useFrame(() => {
    const ph = reloj.current.ph;
    if (Math.abs(ph - ultimo.current) < 0.005) return;
    ultimo.current = ph;
    colorPH(ph, matLumen.uniforms.uColor.value);
  });
  useEffect(() => () => { matLosa.dispose(); geoCab.dispose(); geoCola.dispose(); matCab.dispose(); matCola.dispose(); geoLumen.dispose(); matLumen.dispose(); }, [matLosa, geoCab, geoCola, matCab, matCola, geoLumen, matLumen]);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  return (
    <group>
      <group userData={{ pieza: 'membrana' }}>
        <instancedMesh ref={imCab} args={[geoCab, matCab, cabezas.length]} />
        <instancedMesh ref={imCola} args={[geoCola, matCola, colas.length]} />
        <mesh geometry={geoLosa} material={matLosa} position={[cx, 0, cz]} renderOrder={4} />
      </group>
      <mesh geometry={geoLumen} material={matLumen} position={[cx, (LUMEN.y0 + LUMEN.y1) / 2, cz]} renderOrder={3} userData={{ pieza: 'lumenM' }} />
    </group>
  );
}

// ───────────────────────────── el fenómeno ─────────────────────────────

const HDR = { alta: 2.4, media: 1.1 } as const;
const DIR_LUZ_M = V(0.42, -0.82, -0.38).normalize();
const V_FOTON = 9;

/** Fases del electrón: destino, duración (s de pantalla) e índice del esquema Z (ESQUEMA_Z). */
type Fase = { a: keyof typeof P | null; dur: number; z: number; espera?: 'qb' | 'p700' | 'fad'; viaje?: 'pq' | 'pc' | 'fd'; z2?: number };
const FASES: Fase[] = [
  { a: 'feo', dur: 0.22, z: 2, z2: 3 },
  { a: 'qa', dur: 0.24, z: 3, z2: 4 },
  { a: 'qb', dur: 0.26, z: 4 },
  { a: null, dur: 0, z: 4, espera: 'qb' },
  { a: 'qo', dur: 1.5, z: 5, viaje: 'pq' },
  { a: 'cytf', dur: 0.4, z: 6 },
  { a: 'pcB6f', dur: 0.3, z: 6, z2: 7 },
  { a: 'pcPsi', dur: 1.35, z: 7, viaje: 'pc' },
  { a: 'p700', dur: 0.32, z: 8 },
  { a: null, dur: 0, z: 8, espera: 'p700' },
  { a: 'a0', dur: 0.2, z: 9, z2: 10 },
  { a: 'fx', dur: 0.22, z: 11 },
  { a: 'fdPsi', dur: 0.26, z: 12 },
  { a: 'fdFnr', dur: 1.2, z: 12, viaje: 'fd' },
  { a: 'fad', dur: 0.26, z: 13 },
  { a: null, dur: 0, z: 13, espera: 'fad' },
];

interface Electron { vivo: boolean; fase: number; t: number; de: THREE.Vector3; ctrl: THREE.Vector3; pos: THREE.Vector3; edad: number; listo: boolean }
interface Movil {
  tipo: number; t: number; dur: number; a: THREE.Vector3; c: THREE.Vector3; b: THREE.Vector3;
  apaga: boolean; fin?: () => void; pos: THREE.Vector3;
}
/** Tipos de móviles (moléculas y lanzaderas): color, tamaño y si brilla. */
const MOV = {
  H2O: 0, O2: 1, ADP: 2, ATP: 3, NADP: 4, NADPH: 5, HSTROMA: 6, PQ: 7, PC: 8, FD: 9, HSALE: 10, HUECO: 11,
} as const;

interface Proton { vivo: boolean; estado: 0 | 1 | 2; pos: THREE.Vector3; vel: THREE.Vector3; t: number; de: THREE.Vector3; rot0: number }

interface Foton { vivo: boolean; t: number; dur: number; p0: THREE.Vector3; dir: THREE.Vector3; col: THREE.Color; destino: 0 | 1 | 2; blanco: THREE.Vector3; e?: Electron }
interface Salto { vivo: boolean; t: number; a: THREE.Vector3; m: THREE.Vector3; b: THREE.Vector3; col: THREE.Color; alLlegar: () => void }

const CAP = { e: 40, mov: 160, h: 120, f: 70, s: 30, halo: 320, flash: 60 } as const;

function bez(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  return out.set(u * u * a.x + 2 * u * t * c.x + t * t * b.x, u * u * a.y + 2 * u * t * c.y + t * t * b.y, u * u * a.z + 2 * u * t * c.z + t * t * b.z);
}
const suave = (t: number) => t * t * (3 - 2 * t);

/** Número de H⁺ que se dibujan en el lumen: proporcional a [H⁺] = 10^−pH (1 a pH 7,5; 50 a pH 5,8). */
export function protonesLumen(ph: number): number {
  const a = 10 ** -PH_LUMEN_OSCURO, b = 10 ** -(PH_LUMEN_OSCURO - DELTA_PH_LUMEN);
  return Math.max(1, Math.round(1 + (49 * (10 ** -ph - a)) / (b - a)));
}

function FenomenoMembrana({ reloj, calidad, antenaII, antenaI, rotorRef }: {
  reloj: Reloj; calidad: Calidad; antenaII: Cuenta[]; antenaI: Cuenta[]; rotorRef: React.MutableRefObject<THREE.Group | null>;
}) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const rnd = useMemo(() => azar(2024), []);
  const hdr = HDR[calidad];

  // ── mallas ──
  const geoE = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const matE = useMemo(() => materialBrillo('memE'), []);
  const matH = useMemo(() => materialBrillo('memH'), []);
  const matMolB = useMemo(() => materialBrillo('memMolB'), []);
  const matMol = useMemo(() => materialCera({ rugosidad: 0.4, clearcoat: 0.4, fuerzaBorde: 0.25, borde: '#ffffff' }, 'memMol'), []);
  const geoEst = useMemo(() => { const g = new THREE.CylinderGeometry(0.035, 0.005, 0.8, 8, 1, false); g.rotateX(Math.PI / 2); g.translate(0, 0, -0.4); return g; }, []);
  const matEst = useMemo(() => materialEstela(0.8), []);
  const halo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CAP.halo * 3), 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(CAP.halo * 3), 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(new Float32Array(CAP.halo), 1));
    const m = materialHalo(); m.depthTest = false;
    const o = new THREE.Points(g, m); o.frustumCulled = false; o.renderOrder = 12;
    return { g, m, o };
  }, []);
  useEffect(() => () => { geoE.dispose(); matE.dispose(); matH.dispose(); matMolB.dispose(); matMol.dispose(); geoEst.dispose(); matEst.dispose(); halo.g.dispose(); halo.m.dispose(); }, [geoE, matE, matH, matMolB, matMol, geoEst, matEst, halo]);
  const imE = useRef<THREE.InstancedMesh>(null), imH = useRef<THREE.InstancedMesh>(null);
  const imMol = useRef<THREE.InstancedMesh>(null), imMolB = useRef<THREE.InstancedMesh>(null), imF = useRef<THREE.InstancedMesh>(null);

  // ── estado ──
  const S = useMemo(() => {
    const e: Electron[] = Array.from({ length: CAP.e }, () => ({ vivo: false, fase: 0, t: 0, de: V(0, 0, 0), ctrl: V(0, 0, 0), pos: V(0, 0, 0), edad: 0, listo: false }));
    const mov: Movil[] = [];
    const h: Proton[] = Array.from({ length: CAP.h }, () => ({ vivo: false, estado: 0 as const, pos: V(0, 0, 0), vel: V(0, 0, 0), t: 0, de: V(0, 0, 0), rot0: 0 }));
    const f: Foton[] = [];
    const saltos: Salto[] = [];
    const flashes: { p: THREE.Vector3; col: THREE.Color; t: number; vida: number; tam: number }[] = [];
    return {
      e, mov, h, f, saltos, flashes,
      accE: { v: 0 }, accDis: { v: 0 }, accSale: { v: 0 },
      sOEC: 0, nAgua: 0, esperaQB: [] as Electron[], esperaFAD: [] as Electron[],
      rot: 0, rotObjetivo: 0, ultimoTercio: 0, sitioATP: 0, sembrado: false,
    };
  }, []);

  const flash = (p: THREE.Vector3, col: THREE.Color, tam: number, vida: number) => {
    if (S.flashes.length > CAP.flash) S.flashes.shift();
    S.flashes.push({ p: p.clone(), col: col.clone(), t: 0, vida, tam });
  };
  const movil = (tipo: number, a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, dur: number, apaga = false, fin?: () => void) => {
    if (S.mov.length > CAP.mov) S.mov.shift();
    S.mov.push({ tipo, t: 0, dur, a: a.clone(), c: c.clone(), b: b.clone(), apaga, fin, pos: a.clone() });
  };
  const alEstroma = () => V(-7.5 + rnd() * 15.5, 2.6 + rnd() * 1.8, -2.2 + rnd() * 4.6);
  const enLumen = () => V(-8 + rnd() * 16.5, LUMEN.y0 + 0.35 + rnd() * (LUMEN.y1 - LUMEN.y0 - 0.7), -2.2 + rnd() * 3.4);
  const nuevoProton = (p: THREE.Vector3) => {
    const q = S.h.find((x) => !x.vivo); if (!q) return;
    q.vivo = true; q.estado = 0; q.pos.copy(p); q.vel.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.6); q.t = 0;
  };
  const hDelEstroma = (destino: THREE.Vector3) => {
    const a = alEstroma().lerp(destino, 0.55);
    movil(MOV.HSTROMA, a, a.clone().lerp(destino, 0.5).add(V(0, 0.3, 0.2)), destino, 0.6, true);
  };
  const lanzarE = (fase: number, de: THREE.Vector3) => {
    const x = S.e.find((q) => !q.vivo); if (!x) return null;
    x.vivo = true; x.fase = fase; x.t = 0; x.de.copy(de); x.pos.copy(de); x.edad = 0; x.listo = false;
    x.ctrl.copy(de);
    return x;
  };
  const avanzar = (x: Electron) => { x.de.copy(x.pos); x.fase++; x.t = 0; x.ctrl.copy(x.pos); };

  /** Fotón hacia una antena: 0 = PSII (nace un e⁻), 1 = PSI (lo espera `e`), 2 = se disipa. */
  const foton = (destino: 0 | 1 | 2, e?: Electron) => {
    const ant = destino === 0 ? antenaII : destino === 1 ? antenaI : (rnd() < 0.55 ? antenaII : antenaI);
    const b = ant[Math.floor(rnd() * ant.length)];
    const blanco = b.p.clone().add(V(0, b.r * 0.6, 0));
    const L = 6.5 + rnd() * 2;
    const [r, g, bl] = colorLambda(muestrearLambda(reloj.current.cond.color, rnd()));
    if (S.f.length >= CAP.f) {
      // nunca se pierde un fotón del que depende un electrón: se descarta uno disipado
      if (destino === 2) return;
      const i = S.f.findIndex((q) => q.destino === 2);
      S.f.splice(i >= 0 ? i : 0, 1);
    }
    S.f.push({ vivo: true, t: 0, dur: L / V_FOTON, p0: blanco.clone().addScaledVector(DIR_LUZ_M, -L), dir: DIR_LUZ_M.clone(), col: new THREE.Color(r, g, bl), destino: destino === 2 ? 2 : destino, blanco, e });
  };

  const alcanzarRC = (f: Foton) => {
    // la excitación salta de la antena al centro de reacción (≈ 0,35 s de pantalla)
    const rc = f.destino === 0 ? P.p680 : P.p700;
    const m = f.blanco.clone().lerp(rc, 0.5).add(V(0, 0.25, 0.25));
    if (S.saltos.length > CAP.s) { const v = S.saltos.shift(); v?.alLlegar(); }
    S.saltos.push({
      vivo: true, t: 0, a: f.blanco.clone(), m, b: rc.clone(), col: f.col.clone().lerp(new THREE.Color(1, 1, 1), 0.4),
      alLlegar: () => {
        flash(rc, new THREE.Color(1, 1, 1).multiplyScalar(hdr * 0.9), 0.75, 0.4);
        if (f.destino === 0) {
          // P680* cede un e⁻ y el agua repone el hueco
          lanzarE(0, P.p680);
          movil(MOV.HUECO, P.oec, P.oec.clone().lerp(P.p680, 0.5).add(V(0.2, 0, 0.2)), P.p680, 0.5, true);
          nuevoProton(P.oec.clone().add(V(0, -0.2, 0)));
          S.sOEC++;
          if (S.sOEC % 2 === 0) {
            const a = enLumen();
            movil(MOV.H2O, a, a.clone().lerp(P.oec, 0.5).add(V(0, 0.4, 0.3)), P.oec, 0.9, true);
          }
          if (S.sOEC >= E_POR_O2) {
            S.sOEC = 0;
            const sale = V(SITIO.psii.x + 1.0 + rnd() * 1.5, 4.6, 1.6 + rnd());
            movil(MOV.O2, P.oec, V(SITIO.psii.x + 1.6, 0, 2.2), sale, 2.6, true);
          }
        } else if (f.e) {
          f.e.listo = true;
        }
      },
    });
  };

  const cola = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color(), v: new THREE.Vector3(), q: new THREE.Quaternion(), z: new THREE.Vector3(0, 0, 1) }), []);

  useFrame(() => {
    const r = reloj.current, dt = r.dtAnim, ta = r.tasas;
    const eRate = ta.eMembrana;
    // ── siembra: el lumen arranca con los H⁺ de su pH y el anillo cargado (estado estacionario) ──
    if (!S.sembrado) {
      S.sembrado = true;
      const n = protonesLumen(r.ph);
      for (let i = 0; i < n; i++) nuevoProton(enLumen());
      if (eRate > 0) for (let k = 0; k < SUBUNIDADES_C - 1; k++) {
        const q = S.h.find((x) => !x.vivo); if (!q) break;
        q.vivo = true; q.estado = 2; q.rot0 = S.rot -((SUBUNIDADES_C - 1 - k) * 2 * Math.PI) / SUBUNIDADES_C;
      }
    }
    // ── fotones: los usados nacen al ritmo de los e⁻; los que sobran se disipan ──
    const nE = Math.min(6, Math.floor((S.accE.v += eRate * dt)));
    S.accE.v -= nE;
    for (let k = 0; k < nE; k++) foton(0);
    const pU = Math.max(0.05, ta.pUsar);
    const nD = Math.min(6, Math.floor((S.accDis.v += 2 * eRate * (1 / pU - 1) * dt)));
    S.accDis.v -= nD;
    for (let k = 0; k < nD; k++) foton(2);

    // ── vuelo de fotones ──
    for (const f of S.f) {
      if (!f.vivo) continue;
      f.t += dt;
      if (f.t >= f.dur) {
        f.vivo = false;
        if (f.destino === 2) flash(f.blanco, new THREE.Color('#ff2a12').multiplyScalar(hdr * 0.55), 0.55, 0.6);
        else { flash(f.blanco, f.col.clone().multiplyScalar(hdr * 0.8), 0.5, 0.35); alcanzarRC(f); }
      }
    }
    S.f = S.f.filter((f) => f.vivo);
    // ── saltos de excitación ──
    for (const s of S.saltos) {
      if (!s.vivo) continue;
      s.t += dt / 0.35;
      if (s.t >= 1) { s.vivo = false; s.alLlegar(); }
    }
    S.saltos = S.saltos.filter((s) => s.vivo);

    // ── electrones ──
    let trazador = -1, edadMax = -1;
    for (const x of S.e) {
      if (!x.vivo) continue;
      x.edad += dt;
      const F = FASES[x.fase];
      if (!F) { x.vivo = false; continue; }
      if (F.espera === 'qb') {
        if (!S.esperaQB.includes(x)) { S.esperaQB.push(x); hDelEstroma(P.qb); }
        if (S.esperaQB.length >= 2 && S.esperaQB[0] === x) {
          // PQ + 2 e⁻ + 2 H⁺ → PQH₂, que viaja por la membrana al b₆f
          const par = S.esperaQB.splice(0, 2);
          const ctrl = P.qb.clone().lerp(P.qo, 0.5).add(V(0, -0.05, 0.75));
          movil(MOV.PQ, P.qb, ctrl, P.qo, FASES[4].dur, false, () => {
            // ciclo Q: 4 H⁺ al lumen por cada PQH₂ (2 por e⁻) y 2 H⁺ que entran del estroma por Qn
            for (let i = 0; i < 4; i++) nuevoProton(P.qo.clone().add(V((rnd() - 0.5) * 0.6, -0.7 - rnd() * 0.4, (rnd() - 0.5) * 0.6)));
            hDelEstroma(P.qn); hDelEstroma(P.qn);
            // la PQ vacía vuelve a la reserva de la membrana
            movil(MOV.PQ, P.qo, P.qo.clone().lerp(P.qb, 0.5).add(V(0, 0.05, -0.2)), P.qb.clone().add(V(-0.4, -0.1, -0.5)), 1.6, true);
          });
          par.forEach((q, i) => { avanzar(q); q.ctrl.copy(ctrl); q.t = -i * 0.02; });
        }
        x.pos.copy(P.qb).add(V(S.esperaQB.indexOf(x) * 0.12, 0, 0));
      } else if (F.espera === 'p700') {
        if (!x.listo && x.t === 0) { foton(1, x); x.t = 0.0001; }
        if (x.listo) { x.listo = false; avanzar(x); }
        x.pos.copy(P.p700);
      } else if (F.espera === 'fad') {
        if (!S.esperaFAD.includes(x)) {
          S.esperaFAD.push(x);
          if (S.esperaFAD.length === 1) {
            const a = alEstroma();
            movil(MOV.NADP, a, a.clone().lerp(P.nadp, 0.5).add(V(0, 0.6, 0)), P.nadp, 1.0, false);
          }
        }
        x.pos.copy(P.fad);
        if (S.esperaFAD.length >= 2 && S.esperaFAD[0] === x) {
          const par = S.esperaFAD.splice(0, 2);
          par.forEach((q) => { q.vivo = false; });
          hDelEstroma(P.nadp);
          S.mov = S.mov.filter((m) => !(m.tipo === MOV.NADP && m.t >= m.dur));
          movil(MOV.NADPH, P.nadp, P.nadp.clone().add(V(0.6, 1.2, 0.4)), V(P.nadp.x + 1.5 + rnd(), 4.8, 1.5 + rnd()), 2.4, true);
          flash(P.nadp, new THREE.Color('#5fe3ff').multiplyScalar(hdr * 0.6), 0.5, 0.35);
          continue;
        }
      } else if (F.a) {
        const destino = P[F.a];
        if (x.t === 0 && F.viaje === 'pc') {
          movil(MOV.PC, P.pcB6f, P.pcB6f.clone().lerp(P.pcPsi, 0.5).add(V(0, -0.35, 0.9)), P.pcPsi, F.dur, false, () => {
            movil(MOV.PC, P.pcPsi, P.pcPsi.clone().lerp(P.pcB6f, 0.5).add(V(0, -0.5, 1.5)), P.pcB6f.clone().add(V(0.3, -0.2, 0.6)), 1.6, true);
          });
          x.ctrl.copy(P.pcB6f).lerp(P.pcPsi, 0.5).add(V(0, -0.35, 0.9));
        }
        if (x.t === 0 && F.viaje === 'fd') {
          movil(MOV.FD, P.fdPsi, P.fdPsi.clone().lerp(P.fdFnr, 0.5).add(V(0, 0.55, 0.5)), P.fdFnr, F.dur, false, () => {
            movil(MOV.FD, P.fdFnr, P.fdFnr.clone().lerp(P.fdPsi, 0.5).add(V(0, 0.8, 1.0)), P.fdPsi.clone().add(V(0.2, 0.4, 0.6)), 1.6, true);
          });
          x.ctrl.copy(P.fdPsi).lerp(P.fdFnr, 0.5).add(V(0, 0.55, 0.5));
        }
        x.t += dt;
        const u = Math.min(1, Math.max(0, x.t / F.dur));
        if (F.viaje) bez(x.de, x.ctrl, destino, suave(u), x.pos);
        else x.pos.lerpVectors(x.de, destino, suave(u));
        if (u >= 1) {
          x.pos.copy(destino);
          avanzar(x);
        }
      }
      if (x.vivo && x.edad > edadMax) {
        edadMax = x.edad;
        const Fz = FASES[x.fase] ?? F;
        trazador = Fz.z2 !== undefined && x.t / Math.max(0.01, Fz.dur) > 0.5 ? Fz.z2 : Fz.z;
      }
    }
    // el hueco del P680 (agua → P680) si no hay otro en vuelo
    if (trazador < 0 && S.mov.some((m) => m.tipo === MOV.HUECO)) trazador = 0;
    r.trazador = trazador;

    // ── H⁺: el lumen tiende a protonesLumen(pH); salen por la ATP sintasa al ritmo que entran ──
    const objetivo = protonesLumen(r.ph);
    const libres = S.h.filter((q) => q.vivo && q.estado === 0);
    const entra = 3 * eRate;
    const nS = Math.min(6, Math.floor((S.accSale.v += entra * Math.min(3, Math.max(0.2, libres.length / objetivo)) * dt)));
    S.accSale.v -= nS;
    for (let k = 0; k < nS && libres.length; k++) {
      const q = libres.splice(Math.floor(rnd() * libres.length), 1)[0];
      q.estado = 1; q.t = 0; q.de.copy(q.pos);
    }
    const rotor = rotorRef.current;
    for (const q of S.h) {
      if (!q.vivo) continue;
      if (q.estado === 0) {
        // agitación en el lumen (sin salirse)
        q.vel.add(cola.v.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(2.2 * dt)).multiplyScalar(1 - 0.6 * dt);
        q.pos.addScaledVector(q.vel, dt);
        const lim = (v: number, a: number, b: number, k: 'x' | 'y' | 'z') => { if (v < a) { q.pos[k] = a; q.vel[k] = Math.abs(q.vel[k]); } else if (v > b) { q.pos[k] = b; q.vel[k] = -Math.abs(q.vel[k]); } };
        lim(q.pos.x, -8, 8.5, 'x'); lim(q.pos.y, LUMEN.y0 + 0.2, LUMEN.y1 - 0.2, 'y'); lim(q.pos.z, -2.4, 1.4, 'z');
      } else if (q.estado === 1) {
        q.t += dt / 0.7;
        q.pos.lerpVectors(q.de, P.hEntrada, suave(Math.min(1, q.t)));
        if (q.t >= 1) {
          // sube a la subunidad c que está en la entrada y el anillo avanza 1/14 de vuelta
          q.estado = 2; q.rot0 = S.rotObjetivo;
          S.rotObjetivo += (2 * Math.PI) / SUBUNIDADES_C;
        }
      } else {
        // gira con el anillo (rotation.y > 0 lleva el ángulo φ = atan2(z, x) hacia φ − θ)
        const ang = FI_ENTRADA - (S.rot - q.rot0);
        q.pos.set(SITIO.atp.x + Math.cos(ang) * (ANILLO_C.R + 0.18), 0.04, SITIO.atp.z + Math.sin(ang) * (ANILLO_C.R + 0.18));
        if (S.rot - q.rot0 >= ((SUBUNIDADES_C - 1) * 2 * Math.PI) / SUBUNIDADES_C) {
          // da casi una vuelta y sale al estroma por el semicanal de arriba
          q.vivo = false;
          const fin = alEstroma();
          movil(MOV.HSALE, P.hSalida, P.hSalida.clone().add(V(0.6, 1.0, 0.4)), fin.clone().setY(fin.y - 0.8), 1.8, true);
        }
      }
    }
    // giro del rotor (sentido antihorario visto desde el estroma) y ATP cada 120°
    S.rot += (S.rotObjetivo - S.rot) * Math.min(1, dt * 3.5);
    if (rotor) rotor.rotation.y = S.rot;
    const tercio = Math.floor(S.rot / ((2 * Math.PI) / ATP_POR_VUELTA));
    if (tercio > S.ultimoTercio) {
      S.ultimoTercio = tercio;
      const k = S.sitioATP; S.sitioATP = (S.sitioATP + 1) % 3;
      const ang = Math.PI / 3 + (k * 2 * Math.PI) / 3;
      const sitio = V(SITIO.atp.x + Math.cos(ang) * (CABEZA.R + 0.55), CABEZA.y - 0.2, SITIO.atp.z + Math.sin(ang) * (CABEZA.R + 0.55));
      movil(MOV.ATP, sitio, sitio.clone().add(V(Math.cos(ang) * 0.8, 0.6, Math.sin(ang) * 0.8)), sitio.clone().add(V(Math.cos(ang) * 2.0, 1.3, Math.sin(ang) * 1.6 + 0.6)), 2.2, true);
      flash(sitio, new THREE.Color('#ffc94a').multiplyScalar(hdr * 0.5), 0.55, 0.35);
      // el siguiente ADP + Pi llega al sitio que se abre
      const ang2 = Math.PI / 3 + (S.sitioATP * 2 * Math.PI) / 3;
      const s2 = V(SITIO.atp.x + Math.cos(ang2) * (CABEZA.R + 0.55), CABEZA.y - 0.2, SITIO.atp.z + Math.sin(ang2) * (CABEZA.R + 0.55));
      const a = s2.clone().add(V(Math.cos(ang2) * 2, 0.9, Math.sin(ang2) * 2));
      movil(MOV.ADP, a, a.clone().lerp(s2, 0.5).add(V(0, 0.4, 0)), s2, 1.2, false);
    }

    // ── móviles ──
    for (const m of S.mov) {
      m.t += dt;
      const u = Math.min(1, m.t / m.dur);
      bez(m.a, m.c, m.b, suave(u), m.pos);
      if (u >= 1 && m.fin) { const f = m.fin; m.fin = undefined; f(); }
    }
    S.mov = S.mov.filter((m) => m.t < m.dur || (!m.apaga && m.t < m.dur + 0.25));

    // ── flashes ──
    for (const fl of S.flashes) fl.t += dt;
    S.flashes = S.flashes.filter((fl) => fl.t < fl.vida);

    // ───── dibujo ─────
    const o = cola.o, c = cola.c;
    const hp = halo.g.getAttribute('position') as THREE.BufferAttribute, hc = halo.g.getAttribute('aColor') as THREE.BufferAttribute, ht = halo.g.getAttribute('aTam') as THREE.BufferAttribute;
    halo.m.uniforms.uEscala.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    let nh = 0;
    const halo1 = (p: THREE.Vector3, col: THREE.Color, k: number, tam: number) => {
      if (nh >= CAP.halo) return;
      hp.setXYZ(nh, p.x, p.y, p.z); hc.setXYZ(nh, col.r * k, col.g * k, col.b * k); ht.setX(nh, tam); nh++;
    };
    // electrones
    const mE = imE.current;
    if (mE) {
      let n = 0;
      const ce = new THREE.Color('#8ff8ff');
      for (const x of S.e) {
        if (!x.vivo) continue;
        o.position.copy(x.pos); o.rotation.set(0, 0, 0); o.scale.setScalar(0.085); o.updateMatrix(); mE.setMatrixAt(n, o.matrix);
        mE.setColorAt(n, c.copy(ce).multiplyScalar(hdr * 0.9)); n++;
        halo1(x.pos, ce, 0.55, 0.42);
      }
      for (const s of S.saltos) {
        bez(s.a, s.m, s.b, s.t, cola.v);
        o.position.copy(cola.v); o.scale.setScalar(0.07); o.updateMatrix(); mE.setMatrixAt(n, o.matrix);
        mE.setColorAt(n, c.copy(s.col).multiplyScalar(hdr * 0.9)); n++;
        halo1(cola.v, s.col, 0.6, 0.5);
      }
      mE.count = n; mE.instanceMatrix.needsUpdate = true; if (mE.instanceColor) mE.instanceColor.needsUpdate = true;
    }
    // H⁺
    const mH = imH.current;
    if (mH) {
      let n = 0;
      const ch = new THREE.Color('#ffb347');
      const pon = (p: THREE.Vector3, k: number) => {
        o.position.copy(p); o.scale.setScalar(0.1 * k); o.updateMatrix(); mH.setMatrixAt(n, o.matrix);
        mH.setColorAt(n, c.copy(ch).multiplyScalar(hdr * 0.4)); n++;
        halo1(p, ch, 0.22 * k, 0.34);
      };
      for (const q of S.h) if (q.vivo) pon(q.pos, 1);
      for (const m of S.mov) if (m.tipo === MOV.HSTROMA || m.tipo === MOV.HSALE) {
        const u = m.t / m.dur; pon(m.pos, m.apaga ? Math.max(0.05, Math.min(1, u / 0.15, (1 - u) / 0.25)) : 1);
      }
      mH.count = n; mH.instanceMatrix.needsUpdate = true; if (mH.instanceColor) mH.instanceColor.needsUpdate = true;
    }
    // moléculas (cera) y productos (brillo)
    const mM = imMol.current, mB = imMolB.current;
    if (mM && mB) {
      let n = 0, nb = 0;
      const COL: Record<number, string[]> = {
        [MOV.H2O]: ['#ee5a4a', '#e9f4ff', '#e9f4ff'], [MOV.O2]: ['#ee4b3e', '#ee4b3e'], [MOV.ADP]: ['#b98d3c', '#a77a2e', '#8a8f99'],
        [MOV.NADP]: ['#3f8fa0', '#367f8f'], [MOV.PQ]: ['#e6cf3a', '#d8bf2c', '#c9ae24', '#bba01e'], [MOV.PC]: ['#3d7fd6'], [MOV.FD]: ['#c9503c'],
      };
      for (const m of S.mov) {
        const u = m.t / m.dur;
        const k = m.apaga ? Math.max(0.001, Math.min(1, u / 0.12, (1 - u) / 0.2)) : Math.min(1, u / 0.12 + 0.001);
        if (m.tipo === MOV.ATP || m.tipo === MOV.NADPH || m.tipo === MOV.HUECO) {
          if (m.tipo === MOV.HUECO) {
            o.position.copy(m.pos); o.scale.setScalar(0.07 * k); o.updateMatrix(); mB.setMatrixAt(nb, o.matrix);
            mB.setColorAt(nb, c.set('#8ff8ff').multiplyScalar(hdr * 0.6)); nb++; halo1(m.pos, c.set('#8ff8ff'), 0.35 * k, 0.32);
          } else {
            const col = m.tipo === MOV.ATP ? '#ffc94a' : '#5fe3ff';
            for (let j = 0; j < 2; j++) {
              o.position.copy(m.pos).add(cola.v.set(j * 0.16 - 0.08, 0, 0)); o.scale.setScalar(0.11 * k); o.updateMatrix(); mB.setMatrixAt(nb, o.matrix);
              mB.setColorAt(nb, c.set(col).multiplyScalar(hdr * 0.45)); nb++;
            }
            halo1(m.pos, c.set(col), 0.35 * k, 0.5);
          }
          continue;
        }
        const cols = COL[m.tipo]; if (!cols) continue;
        const tam = m.tipo === MOV.PC || m.tipo === MOV.FD ? 0.3 : m.tipo === MOV.PQ ? 0.11 : 0.1;
        const giro = m.t * 1.3 + m.tipo;
        if (m.tipo === MOV.PC || m.tipo === MOV.FD) {
          // proteínas pequeñas: un racimo de 6 cuentas
          for (let j = 0; j < 6; j++) {
            const a = giro + (j * Math.PI) / 3;
            o.position.copy(m.pos).add(cola.v.set(Math.cos(a) * 0.17, (j % 2 ? 0.1 : -0.1), Math.sin(a) * 0.17)); o.scale.setScalar(0.16 * k); o.updateMatrix(); mM.setMatrixAt(n, o.matrix);
            mM.setColorAt(n, c.set(cols[0]).offsetHSL(0, 0, (j % 3) * 0.03)); n++;
          }
          if (m.tipo === MOV.FD) halo1(m.pos, c.set('#ffcf8a'), 0.12 * k, 0.3);
          continue;
        }
        for (let j = 0; j < cols.length; j++) {
          const off = m.tipo === MOV.PQ ? j * 0.2 - 0.3 : m.tipo === MOV.H2O ? (j === 0 ? 0 : (j === 1 ? -1 : 1) * 0.11) : j * 0.17 - 0.08;
          const dy = m.tipo === MOV.H2O && j > 0 ? -0.07 : 0;
          o.position.copy(m.pos).add(cola.v.set(Math.cos(giro) * off, dy, Math.sin(giro) * off)); o.scale.setScalar(tam * k * (m.tipo === MOV.H2O && j > 0 ? 0.6 : 1)); o.updateMatrix(); mM.setMatrixAt(n, o.matrix);
          mM.setColorAt(n, c.set(cols[j])); n++;
        }
      }
      mM.count = n; mM.instanceMatrix.needsUpdate = true; if (mM.instanceColor) mM.instanceColor.needsUpdate = true;
      mB.count = nb; mB.instanceMatrix.needsUpdate = true; if (mB.instanceColor) mB.instanceColor.needsUpdate = true;
    }
    // fotones (estela + cabeza)
    const mF = imF.current;
    if (mF) {
      let n = 0;
      cola.q.setFromUnitVectors(cola.z, DIR_LUZ_M);
      for (const f of S.f) {
        cola.v.copy(f.p0).addScaledVector(f.dir, f.t * V_FOTON);
        o.position.copy(cola.v); o.quaternion.copy(cola.q); o.scale.set(1, 1, Math.min(1, (f.t * V_FOTON) / 0.8 + 0.05)); o.updateMatrix(); mF.setMatrixAt(n, o.matrix);
        mF.setColorAt(n, c.copy(f.col).multiplyScalar(hdr * 0.8)); n++;
        halo1(cola.v, f.col, 0.7, 0.42);
      }
      mF.count = n; mF.instanceMatrix.needsUpdate = true; if (mF.instanceColor) mF.instanceColor.needsUpdate = true;
      o.quaternion.identity();
    }
    for (const fl of S.flashes) {
      const u = fl.t / fl.vida, a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
      halo1(fl.p, fl.col, a * a, fl.tam * (0.6 + 0.6 * u));
    }
    halo.g.setDrawRange(0, nh);
    hp.needsUpdate = true; hc.needsUpdate = true; ht.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={imE} args={[geoE, matE, CAP.e + CAP.s]} frustumCulled={false} raycast={() => null} renderOrder={6} />
      <instancedMesh ref={imH} args={[geoE, matH, CAP.h + CAP.mov]} frustumCulled={false} raycast={() => null} renderOrder={6} />
      <instancedMesh ref={imMol} args={[geoE, matMol, CAP.mov * 6]} frustumCulled={false} raycast={() => null} />
      <instancedMesh ref={imMolB} args={[geoE, matMolB, CAP.mov * 2]} frustumCulled={false} raycast={() => null} />
      <instancedMesh ref={imF} args={[geoEst, matEst, CAP.f + 4]} frustumCulled={false} raycast={() => null} renderOrder={7} />
      <primitive object={halo.o} />
    </group>
  );
}

// ───────────────────────────── conjunto ─────────────────────────────

export function VistaTilacoide({ reloj, calidad }: { reloj: Reloj; calidad: Calidad }) {
  const datos = useMemo(() => complejos(), []);
  const geo = useMemo(() => GEO_CUENTA(), []);
  const mat = useMemo(() => materialCera({ rugosidad: 0.62, clearcoat: 0.12, borde: '#ffffff', fuerzaBorde: 0.14, potenciaBorde: 2.2 }, 'cuenta'), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const rotor = useRef<THREE.Group>(null);
  const rotorC = useMemo<Complejo>(() => ({ id: 'rotor', pieza: 'rotor', cuentas: datos.rotor }), [datos]);
  // al salir de la vista, el dock deja de seguir el electrón
  useEffect(() => { const r = reloj; return () => { r.current.trazador = -1; }; }, [reloj]);
  const ocupadas = useMemo(() => [
    ...datos.fijos.flatMap((c) => c.cuentas),
    ...datos.rotor.map((b) => ({ ...b, p: b.p.clone().add(SITIO.atp) })),
  ], [datos]);
  return (
    <group>
      <Membranas reloj={reloj} ocupadas={ocupadas} />
      {datos.fijos.map((c) => <Cumulo key={c.id} c={c} mat={mat} geo={geo} />)}
      <group ref={rotor} position={SITIO.atp.toArray()}>
        <Cumulo c={rotorC} mat={mat} geo={geo} />
      </group>
      <FenomenoMembrana reloj={reloj} calidad={calidad} antenaII={datos.antenaII} antenaI={datos.antenaI} rotorRef={rotor} />
    </group>
  );
}

/** Rótulos de la vista (≤ 8, apagados por defecto). */
export const ROTULOS_TILACOIDE: { id: string; texto: string; ancla: V3 }[] = [
  { id: 'psii', texto: 'Fotosistema II', ancla: [SITIO.psii.x, 1.5, SITIO.psii.z] },
  { id: 'b6f', texto: 'Citocromo b₆f', ancla: [SITIO.b6f.x, 1.35, SITIO.b6f.z] },
  { id: 'psi', texto: 'Fotosistema I', ancla: [SITIO.psi.x, 1.55, SITIO.psi.z] },
  { id: 'atp', texto: 'ATP sintasa', ancla: [SITIO.atp.x, CABEZA.y + 1.3, SITIO.atp.z] },
  { id: 'fnr', texto: 'FNR (NADPH)', ancla: [SITIO.fnr.x + 0.4, SITIO.fnr.y + 0.8, SITIO.fnr.z] },
  { id: 'agua', texto: 'H₂O → O₂', ancla: [P.oec.x, P.oec.y - 0.5, P.oec.z] },
  { id: 'lum', texto: 'Lumen (pH)', ancla: [-0.2, (LUMEN.y0 + LUMEN.y1) / 2, MEMB.z1] },
  { id: 'est', texto: 'Estroma', ancla: [-3.6, 3.0, 1.5] },
];
export const ROTULO_PIEZA_TILACOIDE: Record<string, string> = {
  psii: 'Fotosistema II (P680) y el complejo que rompe el agua',
  lhcii: 'Antena LHCII: clorofilas a y b, carotenoides',
  b6f: 'Citocromo b₆f: ciclo Q, 2 H⁺ por e⁻ al lumen',
  psi: 'Fotosistema I (P700)',
  lhci: 'Antena LHCI',
  fnr: 'FNR: 2 e⁻ + H⁺ + NADP⁺ → NADPH',
  atp: 'ATP sintasa (cabeza α₃β₃ y estator)',
  rotor: 'Rotor: anillo de 14 subunidades c + γ',
  membrana: 'Membrana del tilacoide (bicapa de lípidos)',
};

/** Caja de encuadre de la vista. */
export function puntosTilacoide(): THREE.Vector3[] {
  const P0: THREE.Vector3[] = [];
  // las proteínas (de la antena del PSII a la ATP sintasa), no la lámina, que sigue fuera del cuadro
  for (const x of [SITIO.psii.x - 3.2, SITIO.atp.x + 1.8]) for (const y of [LUMEN.y0 + 0.4, CABEZA.y + 1.1]) for (const z of [-1.2, 2.0]) P0.push(V(x, y, z));
  return P0;
}
