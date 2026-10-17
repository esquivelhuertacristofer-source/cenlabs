'use client';
/**
 * bio07/piezas.tsx — EL ARCO REFLEJO ROTULIANO en 3D (diorama).
 *
 * Paciente sentado con la pierna colgando, de perfil: muslo (fémur, cuádriceps con su
 * huso muscular y sus placas motoras, isquiotibiales), rótula, tendón rotuliano, pierna
 * (tibia, peroné, gemelos) que patea, piel translúcida, martillo de Taylor, electrodos de
 * EMG. Arriba, la médula lumbar (L3–L4) AMPLIADA y vista en corte: sustancia gris en
 * mariposa, raíces dorsal y ventral con sus raicillas, ganglio raquídeo con la neurona
 * sensitiva seudomonopolar, motoneurona α del cuádriceps, interneurona Ia inhibidora y
 * motoneurona de los isquiotibiales, y la microelectrodo de vidrio en la motoneurona.
 *
 * TIEMPOS: todo lee `RelojArco` (ms del paciente desde el golpe). El PA recorre cada
 * fibra como V(s, t) = V_PA(t − t₀ − s/v) con s la distancia REAL a lo largo de la vía
 * (la médula, ampliada, mide ≈ 1 cm de los ≈ 50 cm de cada tramo) y v = d/(L − 1,5 ms).
 * La motoneurona toma su V del registro HH (PEPS o PEPS + PA); la pierna, de la sacudida.
 *
 * Esquema no a escala: la médula y las fibras están ampliadas; el huso, también.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { HH } from './neuro';
import { formaPA, muestraPA, sacudida } from './arco';
import { T_BALANCEO, type RelojArco, type EnsayoArco } from './reloj';
import {
  materialMembrana, materialMielina, materialTejido, materialVidrio, materialBrillo, nuevoPerfil, N_PERFIL, vNorm, fijarVMembrana,
  texturaMusculo, texturaHueso, azar,
} from './materiales';
import {
  tuboVariable, fibraMielinica, arbolDendritico, geoSoma, conAtributos, formaMariposa, contornoMedula, torno, perfilHuso,
  type V3, v3,
} from './geometria';
import type { AlPasar } from './banco3d';
import { Rotulos, type Rotulo } from './rotulos';

// ───────────────────────────── composición ─────────────────────────────

/** Centro y semiejes del corte de la médula (ampliada). */
export const MEDULA = { c: [-2.6, 1.6] as [number, number], rx: 1.15, ry: 0.88, fondo: 1.3 };
const enMedula = (x: number, y: number, z = 0.05): V3 => [MEDULA.c[0] + x * MEDULA.rx, MEDULA.c[1] + y * MEDULA.ry, z];
/** Rodilla (eje de giro de la pierna). */
export const RODILLA: V3 = [1.75, -0.62, 0];
/** Punto de la piel sobre el tendón rotuliano donde pega el martillo, y pivote del martillo. */
const GOLPE = new THREE.Vector3(2.06, -1.05, 0);
const ANG_MANGO = THREE.MathUtils.degToRad(53.13);
const MANGO = 1.7, MEDIO_CABEZA = 0.17;
const PIVOTE = (() => {
  const loc = new THREE.Vector3(-MEDIO_CABEZA, MANGO, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), ANG_MANGO);
  return GOLPE.clone().sub(loc).add(new THREE.Vector3(0, 0, 0.0));
})();

const MN: V3 = enMedula(0.46, -0.37, 0.06);
const MN_ANT: V3 = enMedula(0.27, -0.6, 0.06);
const INTER: V3 = enMedula(0.2, -0.08, 0.06);
const DRG: V3 = [-0.85, 2.36, -0.16];
const SOMA_DRG: V3 = [-0.86, 2.45, -0.1];
const T_DRG: V3 = [-0.86, 2.29, -0.12];
const UNION: V3 = [-0.26, 1.86, -0.04];

/** Cuádriceps: huso de 3,6 de largo y radio 0,42 con el eje en (x, −0,22, 0), centrado en x = −0,25. */
const CUAD = { cx: -0.25, cy: -0.22, L: 3.6, R: 0.42 };
const radioCuad = (x: number) => {
  const t = (x - CUAD.cx + CUAD.L / 2) / CUAD.L;
  return CUAD.R * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, t)))), 0.75);
};
/** Punto de la superficie anterosuperior del cuádriceps (a 45°), elevado `h`. */
const sobreCuad = (x: number, h = 0, ang = Math.PI / 4): V3 => {
  const r = radioCuad(x) + h;
  return [x, CUAD.cy + r * Math.cos(ang), r * Math.sin(ang)];
};
const HUSO: V3 = sobreCuad(-0.85, -0.005);
/** Placas motoras del cuádriceps (zona de placas, en mitad del vientre). */
const PLACAS: V3[] = [sobreCuad(0.0, 0.006, 0.62), sobreCuad(0.26, 0.006, 0.82), sobreCuad(0.5, 0.006, 0.66)];
const RAMIFICA: V3 = sobreCuad(0.22, 0.05, 0.72);

// vías (puntos de control); se marca el índice del punto donde la vía entra o sale de la médula
const VIA_IA: { p: V3[]; borde: number } = {
  p: [
    sobreCuad(-0.85, 0.07), sobreCuad(-0.5, 0.04), sobreCuad(-0.1, 0.045, 0.7), [0.12, 0.24, 0.3], [0.14, 0.55, 0.21], [0.15, 0.95, 0.12], [0.04, 1.4, 0.03],
    [UNION[0] - 0.05, UNION[1] + 0.03, UNION[2] + 0.02], [-0.5, 2.15, -0.1], T_DRG, [-1.3, 2.43, -0.22], [-1.78, 2.33, -0.18],
    enMedula(0.62, 0.6, 0.0), enMedula(0.42, 0.42, 0.05), enMedula(0.32, 0.12, 0.05), enMedula(0.36, -0.12, 0.06), [MN[0] - 0.02, MN[1] + 0.13, 0.07],
  ],
  borde: 11,
};
const VIA_ALFA: { p: V3[]; borde: number } = {
  p: [
    MN, enMedula(0.66, -0.47, 0.04), enMedula(0.86, -0.6, -0.08), [-1.45, 1.1, -0.22], [-1.1, 1.17, -0.22], [-0.62, 1.48, -0.13],
    [UNION[0] + 0.03, UNION[1] - 0.03, UNION[2] - 0.01], [0.08, 1.38, 0.06], [0.19, 0.95, 0.16], [0.2, 0.55, 0.25], [0.21, 0.26, 0.33], RAMIFICA,
  ],
  borde: 2,
};

// ───────────────────────────── utilidades ─────────────────────────────

/** Curva Catmull-Rom (centrípeta) por los puntos. */
const curva = (p: V3[]) => new THREE.CatmullRomCurve3(p.map(v3), false, 'centripetal', 0.5);
/** u (por longitud de arco) del punto de la curva más cercano a q. */
function uDe(c: THREE.Curve<THREE.Vector3>, q: V3) {
  const Q = v3(q);
  let mejor = 0, dmin = Infinity;
  for (let i = 0; i <= 400; i++) { const u = i / 400; const d = c.getPointAt(u).distanceToSquared(Q); if (d < dmin) { dmin = d; mejor = u; } }
  return mejor;
}

/** Losa de médula: tapa frontal, pared lateral con normales analíticas y tapa trasera. */
function losaMedula() {
  const cont = contornoMedula(MEDULA.rx, MEDULA.ry);
  const forma = new THREE.Shape(cont);
  const frente = new THREE.ShapeGeometry(forma, 1);
  // tapa trasera: la misma forma en z = −fondo, con el giro de los triángulos y la normal invertidos
  const atras = new THREE.ShapeGeometry(forma, 1);
  atras.translate(0, 0, -MEDULA.fondo);
  const ia = atras.index!;
  for (let i = 0; i < ia.count; i += 3) { const a = ia.getX(i + 1); ia.setX(i + 1, ia.getX(i + 2)); ia.setX(i + 2, a); }
  const na = atras.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < na.count; i++) na.setXYZ(i, 0, 0, -1);
  const n = cont.length;
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const capas = 6;
  for (let k = 0; k <= n; k++) {
    const P = cont[k % n], A = cont[(k - 1 + n) % n], B = cont[(k + 1) % n];
    const tx = B.x - A.x, ty = B.y - A.y;
    const l = Math.hypot(tx, ty) || 1;
    for (let j = 0; j <= capas; j++) {
      pos.push(P.x, P.y, -(MEDULA.fondo * j) / capas);
      nor.push(ty / l, -tx / l, 0);
    }
  }
  for (let k = 0; k < n; k++) for (let j = 0; j < capas; j++) {
    const a = k * (capas + 1) + j, b = (k + 1) * (capas + 1) + j;
    // cara frontal hacia fuera: (−z) × tangente = normal exterior (contorno antihorario)
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const pared = new THREE.BufferGeometry();
  pared.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  pared.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  pared.setIndex(idx);
  atras.deleteAttribute('uv');
  return { frente, atras, pared };
}

/** Normales nulas (triángulos degenerados) → normal radial desde el centro de la pieza. */
function repararNormales(g: THREE.BufferGeometry) {
  const n = g.getAttribute('normal') as THREE.BufferAttribute, p = g.getAttribute('position') as THREE.BufferAttribute;
  g.computeBoundingBox();
  const c = new THREE.Vector3(); g.boundingBox!.getCenter(c);
  const v = new THREE.Vector3();
  for (let i = 0; i < n.count; i++) {
    if (Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6) continue;
    v.fromBufferAttribute(p, i).sub(c);
    if (v.lengthSq() < 1e-12) v.set(0, 0, 1);
    v.normalize(); n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/** Huso muscular: cápsula fusiforme (eje x) con 3 fibras intrafusales y la terminación anuloespiral. */
function geoHuso() {
  const L = 0.56, R = 0.065;
  const capsula = torno(perfilHuso(L, R, 30, 0.12), 32);
  capsula.rotateZ(-Math.PI / 2);
  const fibras: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const dy = Math.cos(a) * 0.022, dz = Math.sin(a) * 0.022;
    const c = new THREE.LineCurve3(new THREE.Vector3(-L * 0.62, dy, dz), new THREE.Vector3(L * 0.62, dy, dz));
    fibras.push(tuboVariable(c, (u) => 0.012 * (0.6 + 0.4 * Math.sin(Math.PI * u)), { segs: 24, radial: 8, tapaIni: true, tapaFin: true }));
  }
  const pts: THREE.Vector3[] = [];
  const vueltas = 5, ancho = 0.17;
  for (let i = 0; i <= 160; i++) {
    const s = i / 160;
    const a = s * vueltas * Math.PI * 2;
    pts.push(new THREE.Vector3(-ancho / 2 + ancho * s, Math.cos(a) * 0.04, Math.sin(a) * 0.04));
  }
  const espiral = tuboVariable(new THREE.CatmullRomCurve3(pts), () => 0.0085, { segs: 220, radial: 6, tapaIni: true, tapaFin: true, perfil: [0, 0] });
  return { capsula, fibras: unirConAtributos(fibras), espiral };
}

function unirConAtributos(gs: THREE.BufferGeometry[]) {
  // todas vienen de tuboVariable: mismos atributos
  const g = new THREE.BufferGeometry();
  const noms = Object.keys(gs[0].attributes);
  let nV = 0, nI = 0;
  for (const p of gs) { nV += p.getAttribute('position').count; nI += p.index!.count; }
  for (const nom of noms) {
    const it = gs[0].getAttribute(nom).itemSize;
    const arr = new Float32Array(nV * it); let o = 0;
    for (const p of gs) { const a = p.getAttribute(nom).array as Float32Array; arr.set(a, o); o += a.length; }
    g.setAttribute(nom, new THREE.BufferAttribute(arr, it));
  }
  const idx = new Uint32Array(nI); let oi = 0, base = 0;
  for (const p of gs) { const ix = p.index!.array; for (let k = 0; k < ix.length; k++) idx[oi++] = ix[k] + base; base += p.getAttribute('position').count; p.dispose(); }
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

/** Cabeza triangular del martillo de Taylor (goma), en el plano xy local: arista ancha hacia −x. */
function geoCabezaTaylor() {
  const s = new THREE.Shape();
  const r = 0.045;
  // triángulo: arista ancha vertical en x = −0,17 (de y −0,14 a +0,14) y punta en x = +0,3
  const A = new THREE.Vector2(-0.17, -0.14), B = new THREE.Vector2(-0.17, 0.14), C = new THREE.Vector2(0.3, 0);
  const esquinas = [A, B, C];
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k < 3; k++) {
    const P = esquinas[k], Pa = esquinas[(k + 2) % 3], Pb = esquinas[(k + 1) % 3];
    const d1 = Pa.clone().sub(P).normalize(), d2 = Pb.clone().sub(P).normalize();
    const ang = Math.acos(d1.dot(d2));
    const off = r / Math.tan(ang / 2);
    const a0 = P.clone().addScaledVector(d1, off), a1 = P.clone().addScaledVector(d2, off);
    const bis = d1.clone().add(d2).normalize();
    const centro = P.clone().addScaledVector(bis, r / Math.sin(ang / 2));
    const t0 = Math.atan2(a0.y - centro.y, a0.x - centro.x);
    let t1 = Math.atan2(a1.y - centro.y, a1.x - centro.x);
    while (t1 > t0) t1 -= Math.PI * 2;
    if (t0 - t1 > Math.PI) t1 += Math.PI * 2;
    for (let i = 0; i <= 8; i++) { const t = t0 + ((t1 - t0) * i) / 8; pts.push(new THREE.Vector2(centro.x + r * Math.cos(t), centro.y + r * Math.sin(t))); }
  }
  // sentido antihorario para ExtrudeGeometry
  if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
  s.setFromPoints(pts);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -0.05);
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  return repararNormales(g);
}

/** Corte de la sustancia blanca: cordones posteriores algo más claros, laterales algo más oscuros; muy poco contraste. */
function texturaSustanciaBlanca() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efe6d6'; g.fillRect(0, 0, 256, 256);
  g.filter = 'blur(10px)';
  const elipse = (x: number, y: number, rx: number, ry: number, col: string) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  elipse(128, 52, 30, 40, 'rgba(255,250,240,0.8)');           // cordones posteriores (arriba en el corte)
  elipse(52, 128, 28, 46, 'rgba(214,198,176,0.45)');          // cordón lateral izquierdo
  elipse(204, 128, 28, 46, 'rgba(214,198,176,0.45)');         // cordón lateral derecho
  elipse(128, 214, 46, 26, 'rgba(226,214,196,0.4)');          // cordones anteriores
  g.filter = 'none';
  const rad = g.createRadialGradient(128, 128, 60, 128, 128, 132);
  rad.addColorStop(0, 'rgba(0,0,0,0)'); rad.addColorStop(1, 'rgba(255,236,220,0.35)');
  g.fillStyle = rad; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  // las uv del ShapeGeometry son las coordenadas x, y del corte: se llevan al cuadrado 0–1
  t.repeat.set(1 / (2 * MEDULA.rx), 1 / (2 * MEDULA.ry));
  t.offset.set(0.5, 0.5);
  return t;
}

function Instancias({ matrices, geo, material }: { matrices: THREE.Matrix4[]; geo: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current; if (!m) return;
    matrices.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh ref={ref} args={[geo, material, matrices.length]} raycast={() => null} />;
}

// ───────────────────────────── materiales ─────────────────────────────

function useMatsArco() {
  return useMemo(() => {
    const perfilIa = nuevoPerfil();
    const perfilAlfa = nuevoPerfil();
    const musc = texturaMusculo();
    const hueso = texturaHueso();
    const cuadriceps = materialTejido({ color: '#ffffff', mapa: musc, rugosidad: 0.5, sheen: 0.7, clearcoat: 0.35, fuerzaBorde: 0.22, borde: '#ffc9b8', emisivo: '#ff6a2a', intensidadEmisiva: 0 });
    return {
      perfilIa, perfilAlfa,
      blanca: materialTejido({ color: '#eee5d6', rugosidad: 0.42, sheen: 0.8, clearcoat: 0.35, fuerzaBorde: 0.3, borde: '#fff4e6' }),
      blancaCorte: materialTejido({ color: '#ffffff', mapa: texturaSustanciaBlanca(), rugosidad: 0.45, sheen: 0.7, clearcoat: 0.3, fuerzaBorde: 0.1 }),
      fibraTenue: materialTejido({ color: '#d9cdb2', rugosidad: 0.45, sheen: 0.6, fuerzaBorde: 0.15 }),
      neuronaVentral: materialTejido({ color: '#7fa894', rugosidad: 0.45, sheen: 0.6, fuerzaBorde: 0.2 }),
      neuronaDorsal: materialTejido({ color: '#9196c2', rugosidad: 0.45, sheen: 0.6, fuerzaBorde: 0.2 }),
      gris: materialTejido({ color: '#b78f98', rugosidad: 0.55, sheen: 0.6, clearcoat: 0.2, fuerzaBorde: 0.12 }),
      canal: materialTejido({ color: '#3a2a33', rugosidad: 0.6, sheen: 0.2, fuerzaBorde: 0.05 }),
      arteria: materialTejido({ color: '#a8262e', rugosidad: 0.35, sheen: 0.5, clearcoat: 0.6, fuerzaBorde: 0.2 }),
      raiz: materialTejido({ color: '#f1e3c4', rugosidad: 0.4, sheen: 0.8, clearcoat: 0.4, fuerzaBorde: 0.35, alfa: [0.32, 0.85] }),
      vaina: materialTejido({ color: '#f6ecd6', rugosidad: 0.35, sheen: 0.8, clearcoat: 0.5, fuerzaBorde: 0.55, borde: '#fff6e6', potenciaBorde: 2.0, alfa: [0.16, 0.7] }),
      ganglio: materialTejido({ color: '#f3dfc2', rugosidad: 0.4, sheen: 0.8, clearcoat: 0.5, fuerzaBorde: 0.5, borde: '#fff1dc', alfa: [0.5, 0.92] }),
      ia: materialMembrana({ color: '#6fa8ff', perfil: perfilIa, ganancia: 1.1 }),
      alfa: materialMembrana({ color: '#5fcf9f', perfil: perfilAlfa, ganancia: 1.1 }),
      mielinaIa: materialMielina(perfilIa),
      mielinaAlfa: materialMielina(perfilAlfa),
      somaMN: materialMembrana({ color: '#5fcf9f', perfil: null, ganancia: 1.0 }),
      somaAnt: materialMembrana({ color: '#4fae88', perfil: null, ganancia: 0.9, frio: '#3f7dff' }),
      inter: materialMembrana({ color: '#c99bff', perfil: null, ganancia: 1.0 }),
      somaDRG: materialMembrana({ color: '#6fa8ff', perfil: null, ganancia: 1.0 }),
      placa: materialMembrana({ color: '#5fcf9f', perfil: null, ganancia: 1.2 }),
      espiral: materialMembrana({ color: '#6fa8ff', perfil: null, ganancia: 1.3 }),
      capsula: materialTejido({ color: '#eaf2ff', rugosidad: 0.25, sheen: 0.4, clearcoat: 0.8, fuerzaBorde: 0.55, borde: '#f2f8ff', alfa: [0.12, 0.6] }),
      intrafusal: materialTejido({ color: '#c3584f', rugosidad: 0.45, sheen: 0.6, fuerzaBorde: 0.15 }),
      cuadriceps,
      musculo: materialTejido({ color: '#ffffff', mapa: musc, rugosidad: 0.5, sheen: 0.7, clearcoat: 0.35, fuerzaBorde: 0.22, borde: '#ffc9b8' }),
      hueso: materialTejido({ color: '#ffffff', mapa: hueso, rugosidad: 0.45, sheen: 0.4, clearcoat: 0.5, fuerzaBorde: 0.2 }),
      tendon: materialTejido({ color: '#eee7d8', rugosidad: 0.28, sheen: 0.9, clearcoat: 0.8, fuerzaBorde: 0.35 }),
      piel: materialTejido({ color: '#d6e4f2', rugosidad: 0.5, sheen: 0.3, clearcoat: 0.3, fuerzaBorde: 0.9, borde: '#e6f2ff', potenciaBorde: 2.8, alfa: [0.04, 0.62] }),
      goma: materialTejido({ color: '#b3262b', rugosidad: 0.55, sheen: 0.5, clearcoat: 0.25, fuerzaBorde: 0.15 }),
      cromo: new THREE.MeshPhysicalMaterial({ color: '#e9eef3', metalness: 1, roughness: 0.2, envMapIntensity: 1.2 }),
      frente: materialBrillo('#fff0c8', 3.2),
      electrodo: materialTejido({ color: '#f3f3ef', rugosidad: 0.4, sheen: 0.3, clearcoat: 0.6, fuerzaBorde: 0.1 }),
      cableRojo: materialTejido({ color: '#c0392b', rugosidad: 0.35, sheen: 0.3, clearcoat: 0.7, fuerzaBorde: 0.1 }),
      cableNegro: materialTejido({ color: '#23272e', rugosidad: 0.35, sheen: 0.3, clearcoat: 0.7, fuerzaBorde: 0.15 }),
      vidrio: materialVidrio(),
    };
  }, []);
}

// ───────────────────────────── geometría ─────────────────────────────

interface Via { curva: THREE.CatmullRomCurve3; fibra: { axon: THREE.BufferGeometry; vainas: THREE.BufferGeometry | null }; uBorde: number }

function construirVia(v: { p: V3[]; borde: number }, nodosCada = 0.24): Via {
  const c = curva(v.p);
  const L = c.getLength();
  const nodos: number[] = [];
  for (let s = nodosCada * 0.5; s < L - nodosCada * 0.3; s += nodosCada) nodos.push(s / L);
  const fibra = fibraMielinica(c, { rAx: 0.026, rMy: 0.04, nodos, hueco: 0.04 / L, mielina: true, segsPorU: Math.round(L / 0.012), radial: 10, tapaIni: true, tapaFin: true });
  return { curva: c, fibra, uBorde: uDe(c, v.p[v.borde]) };
}

function useGeoArco() {
  return useMemo(() => {
    const losa = losaMedula();
    const gris = new THREE.ShapeGeometry(formaMariposa(MEDULA.rx * 0.92, MEDULA.ry * 0.92), 1);
    gris.deleteAttribute('uv');
    const canal = new THREE.CircleGeometry(0.035, 24);
    canal.deleteAttribute('uv');
    const arteria = tuboVariable(new THREE.LineCurve3(new THREE.Vector3(MEDULA.c[0], MEDULA.c[1] - MEDULA.ry * 1.02, 0.02), new THREE.Vector3(MEDULA.c[0], MEDULA.c[1] - MEDULA.ry * 1.02, -MEDULA.fondo + 0.02)), () => 0.035, { segs: 6, radial: 14, tapaIni: true, tapaFin: true });

    // raíces: haz de raicillas que entra por el surco a tres profundidades y se reúne en la raíz
    const raiz = (borde: [number, number], haciaD: V3, fin: V3, r: number) => {
      const partes: THREE.BufferGeometry[] = [];
      const [bx, by] = borde;
      for (const z of [-0.15, -0.45, -0.75]) {
        const c = new THREE.CatmullRomCurve3([new THREE.Vector3(bx - 0.04 * Math.sign(haciaD[0]), by, z), new THREE.Vector3(bx + haciaD[0] * 0.25, by + haciaD[1] * 0.25, z * 0.7), v3(fin)], false, 'centripetal');
        partes.push(tuboVariable(c, (u) => r * (0.55 + 0.45 * u), { segs: 18, radial: 10, tapaIni: true }));
      }
      return unirConAtributos(partes);
    };
    const pD = (a: number) => [MEDULA.c[0] + Math.cos(a) * MEDULA.rx * 0.98, MEDULA.c[1] + Math.sin(a) * MEDULA.ry * 0.98] as [number, number];
    const raizDorsal = raiz(pD(THREE.MathUtils.degToRad(52)), [1, 0.5, 0], [-1.36, 2.42, -0.22], 0.06);
    const raizVentral = raiz(pD(THREE.MathUtils.degToRad(-38)), [1, -0.1, 0], [-1.12, 1.16, -0.24], 0.06);
    const raizDorsalIzq = raiz(pD(THREE.MathUtils.degToRad(128)), [-1, 0.5, 0], [-4.25, 2.35, -0.3], 0.06);
    const raizVentralIzq = raiz(pD(THREE.MathUtils.degToRad(218)), [-1, -0.1, 0], [-4.15, 1.05, -0.3], 0.06);
    // de las raíces al nervio raquídeo y al femoral (vaina translúcida que lleva las dos fibras)
    const tramoD = tuboVariable(curva([[-1.4, 2.43, -0.22], [-1.12, 2.42, -0.2], DRG]), () => 0.075, { segs: 16, radial: 14 });
    const tramoV = tuboVariable(curva([[-1.15, 1.16, -0.24], [-0.62, 1.47, -0.14], UNION]), (u) => 0.07 + 0.01 * u, { segs: 22, radial: 14 });
    const nervio = tuboVariable(curva([[-0.62, 2.27, -0.14], [-0.45, 2.14, -0.1], UNION, [0.06, 1.39, 0.05], [0.17, 0.95, 0.14], [0.17, 0.55, 0.23], [0.17, 0.3, 0.31]]),
      (u) => 0.085 - 0.012 * u, { segs: 90, radial: 16, tapaFin: true });
    const ganglio = torno(perfilHuso(0.72, 0.24, 28, 0.25), 36);
    ganglio.rotateZ(-Math.PI / 2 + 0.25);
    ganglio.translate(DRG[0], DRG[1], DRG[2]);
    const tallo = tuboVariable(curva([SOMA_DRG, [SOMA_DRG[0] + 0.03, SOMA_DRG[1] - 0.08, SOMA_DRG[2] - 0.01], T_DRG]), () => 0.016, { segs: 12, radial: 8 });

    const ia = construirVia(VIA_IA);
    const alfa = construirVia(VIA_ALFA);
    // el nervio femoral es un haz: otras fibras (tenues) acompañan a la Ia y a la α
    const ejeNervio = curva([UNION, [0.06, 1.39, 0.05], [0.17, 0.95, 0.14], [0.17, 0.55, 0.23], [0.17, 0.32, 0.3]]);
    const otras: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 7; k++) {
      const th = (k / 7) * Math.PI * 2 + 0.4, rr = k % 2 ? 0.05 : 0.04;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const P = ejeNervio.getPointAt(u), T = ejeNervio.getTangentAt(u).normalize();
        const N = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 0, 1)).normalize();
        const B = new THREE.Vector3().crossVectors(T, N).normalize();
        pts.push(P.addScaledVector(N, Math.cos(th) * rr).addScaledVector(B, Math.sin(th) * rr));
      }
      otras.push(tuboVariable(new THREE.CatmullRomCurve3(pts), () => 0.011, { segs: 60, radial: 6, tapaIni: true, tapaFin: true }));
    }
    const fibrasNervio = unirConAtributos(otras);
    // la sustancia gris está llena de neuronas: motoneuronas en el asta ventral, interneuronas en la dorsal
    const mariposa = formaMariposa(MEDULA.rx * 0.92, MEDULA.ry * 0.92).getPoints(120);
    const dentro = (x: number, y: number) => {
      let c = false;
      for (let i = 0, j = mariposa.length - 1; i < mariposa.length; j = i++) {
        const a = mariposa[i], b = mariposa[j];
        if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
      }
      return c;
    };
    const rnd = azar(17);
    const evitar = [MN, MN_ANT, INTER].map((q) => new THREE.Vector2(q[0] - MEDULA.c[0], q[1] - MEDULA.c[1]));
    const neuronasGris = (ventral: boolean, n: number) => {
      const out: THREE.Matrix4[] = [];
      let intentos = 0;
      while (out.length < n && intentos++ < 4000) {
        const x = (rnd() * 2 - 1) * MEDULA.rx * 0.9, y = (rnd() * 2 - 1) * MEDULA.ry * 0.9;
        if (ventral ? y > -0.08 * MEDULA.ry : y < 0.12 * MEDULA.ry) continue;
        if (!dentro(x, y) || Math.abs(x) < 0.06) continue;
        if (evitar.some((q) => q.distanceTo(new THREE.Vector2(x, y)) < 0.17)) continue;
        const r = ventral ? 0.026 + 0.018 * rnd() : 0.016 + 0.01 * rnd();
        out.push(new THREE.Matrix4().compose(new THREE.Vector3(x + MEDULA.c[0], y + MEDULA.c[1], 0.012), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rnd() * 6.28), new THREE.Vector3(r * 1.25, r, r * 0.6)));
      }
      return out;
    };
    const grisVentral = neuronasGris(true, 26);
    const grisDorsal = neuronasGris(false, 22);
    // otras cabezas del cuádriceps: vasto medial (abajo, delante, junto a la rodilla) y vasto lateral (detrás)
    const vastoMedial = torno(perfilHuso(1.55, 0.25, 30, 0.16), 36, true);
    const vastoLateral = torno(perfilHuso(3.0, 0.32, 32, 0.16), 36, true);
    // colateral de la Ia a la interneurona y axón de la interneurona a la motoneurona antagonista
    const colateral = tuboVariable(curva([enMedula(0.33, 0.06, 0.05), enMedula(0.26, -0.01, 0.06), [INTER[0] + 0.05, INTER[1] + 0.04, 0.06]]), () => 0.012, { segs: 16, radial: 8, tapaFin: true });
    const axInter = tuboVariable(curva([INTER, enMedula(0.18, -0.32, 0.06), [MN_ANT[0] - 0.02, MN_ANT[1] + 0.09, 0.06]]), () => 0.011, { segs: 18, radial: 8, tapaFin: true });
    const axAnt = tuboVariable(curva([MN_ANT, enMedula(0.55, -0.75, 0.04), enMedula(0.86, -0.8, -0.12)]), () => 0.016, { segs: 18, radial: 8, tapaFin: true });
    // ramas de la α a las placas motoras, pegadas a la superficie del músculo
    const ramas = PLACAS.map((p) => {
      const xm = (RAMIFICA[0] + p[0]) / 2;
      return tuboVariable(curva([RAMIFICA, sobreCuad(xm, 0.03, 0.75), p]), (u) => 0.014 - 0.004 * u, { segs: 16, radial: 8, tapaFin: true });
    });
    const ramasAlfa = unirConAtributos(ramas);
    const giroPlacas = PLACAS.map((p) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, p[1] - CUAD.cy, p[2]).normalize()));

    // somas de la médula con sus dendritas (en la cara del corte)
    const arbolMN = arbolDendritico(MN, 0.11, { semilla: 3, ramas: 6, largo: 0.17, r0: 0.024, niveles: 2, aplastar: 0.25, excluir: [0.6, -0.4, 0] });
    const somaMN = geoSoma(0.11, [...arbolMN.bases, new THREE.Vector3(0.8, -0.4, 0).normalize()], 7, 40);
    const arbolAnt = arbolDendritico(MN_ANT, 0.085, { semilla: 8, ramas: 5, largo: 0.13, r0: 0.02, niveles: 2, aplastar: 0.25, excluir: [0.8, -0.5, 0] });
    const somaAnt = geoSoma(0.085, arbolAnt.bases, 9, 36);
    const somaInter = geoSoma(0.055, [new THREE.Vector3(0, -1, 0)], 4, 28);
    const somaDRG = new THREE.SphereGeometry(0.075, 28, 20);

    // pierna (fija): fémur, cuádriceps, isquiotibiales, rótula, tendón del cuádriceps
    const femur = tuboVariable(curva([[-2.05, -0.5, -0.05], [-0.4, -0.56, -0.05], [1.5, -0.62, -0.05]]), (u) => 0.12 + 0.05 * Math.pow(Math.abs(2 * u - 1), 6), { segs: 50, radial: 20, uv: true });
    const cuello = tuboVariable(curva([[-2.0, -0.5, -0.05], [-2.15, -0.36, -0.05], [-2.24, -0.25, -0.05]]), () => 0.1, { segs: 10, radial: 16, uv: true });
    const cuadriceps = torno(perfilHuso(CUAD.L, CUAD.R, 40, 0.18), 44, true);
    const isquios = torno(perfilHuso(3.3, 0.28, 32, 0.16), 36, true);
    const gemelos = torno(perfilHuso(1.75, 0.3, 30, 0.14), 36, true);
    const tendonCuad = tuboVariable(curva([[CUAD.cx + CUAD.L / 2 - 0.2, -0.25, 0.0], [1.72, -0.33, 0.0], [1.97, -0.45, 0.0]]), (u) => 0.1 - 0.035 * u, { segs: 18, radial: 14 });
    const esfera = new THREE.SphereGeometry(1, 36, 24);
    const cilindro = conAtributos(new THREE.CylinderGeometry(1, 1, 1, 18, 1, false));
    // pierna (gira): tibia, peroné; en coordenadas relativas a la rodilla
    const K = v3(RODILLA);
    const rel = (p: V3) => [p[0] - K.x, p[1] - K.y, p[2] - K.z] as V3;
    const tibia = tuboVariable(curva([rel([1.76, -0.78, -0.02]), rel([1.78, -1.6, -0.02]), rel([1.8, -2.5, -0.02]), rel([1.8, -3.12, -0.02])]),
      (u) => (u < 0.12 ? 0.2 - 0.85 * u : 0.1) + 0.035 * Math.max(0, (u - 0.9) / 0.1), { segs: 60, radial: 20, uv: true, tapaIni: true, tapaFin: true });
    const perone = tuboVariable(curva([rel([1.56, -0.95, -0.1]), rel([1.57, -2.0, -0.1]), rel([1.6, -3.1, -0.1])]), (u) => 0.045 + 0.02 * Math.max(0, (u - 0.9) / 0.1), { segs: 40, radial: 12, uv: true, tapaIni: true, tapaFin: true });
    // piel: muslo (fijo), rodilla y pierna + pie (giran). La espinilla queda justo bajo la piel; la pantorrilla abulta detrás.
    const ejeMuslo = curva([[-2.75, -0.44, 0], [-0.6, -0.47, 0], [1.6, -0.56, 0]]);
    const radioMuslo = (u: number) => 0.82 - 0.22 * u;
    const pielMuslo = tuboVariable(ejeMuslo, radioMuslo, { segs: 60, radial: 44, tapaIni: true });
    const radiosPierna: [number, number][] = [[0, 0.52], [0.16, 0.48], [0.45, 0.45], [0.8, 0.3], [1, 0.22]];
    const radioPierna = (u: number) => {
      for (let k = 1; k < radiosPierna.length; k++) if (u <= radiosPierna[k][0]) {
        const [u0, r0] = radiosPierna[k - 1], [u1, r1] = radiosPierna[k];
        const s = (u - u0) / (u1 - u0); return r0 + (r1 - r0) * (s * s * (3 - 2 * s));
      }
      return 0.22;
    };
    const pielPierna = tuboVariable(curva([rel([1.74, -0.6, 0]), rel([1.57, -1.0, 0]), rel([1.47, -1.8, 0]), rel([1.6, -2.6, 0]), rel([1.73, -3.1, 0])]),
      radioPierna, { segs: 70, radial: 44 });
    const pie = tuboVariable(curva([rel([1.55, -3.3, 0]), rel([1.95, -3.36, 0]), rel([2.45, -3.42, 0]), rel([2.82, -3.44, 0])]),
      (u) => 0.22 - 0.08 * u, { segs: 40, radial: 36, tapaIni: true, tapaFin: true });
    { // el pie es más plano que ancho
      const c = new THREE.Vector3(...rel([2.1, -3.38, 0]));
      pie.translate(-c.x, -c.y, -c.z); pie.scale(1, 0.62, 1.05); pie.translate(c.x, c.y, c.z);
    }
    const tobillo = tuboVariable(curva([rel([1.73, -3.0, 0]), rel([1.71, -3.18, 0]), rel([1.64, -3.3, 0])]), () => 0.21, { segs: 12, radial: 36 });
    // martillo
    const cabeza = geoCabezaTaylor();
    const mango = tuboVariable(new THREE.LineCurve3(new THREE.Vector3(0, -0.28, 0), new THREE.Vector3(0, MANGO - 0.03, 0)), (u) => 0.024 + 0.006 * (1 - u), { segs: 30, radial: 16, tapaIni: true, tapaFin: true });
    const casquillo = tuboVariable(new THREE.LineCurve3(new THREE.Vector3(0, MANGO - 0.07, -0.07), new THREE.Vector3(0, MANGO - 0.07, 0.07)), () => 0.04, { segs: 4, radial: 16, tapaIni: true, tapaFin: true });
    // electrodos del EMG sobre la cara anterior del muslo, con sus cables
    const electrodos = [-0.3, 0.55].map((x) => {
      const a = THREE.MathUtils.degToRad(58);
      const n = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
      const u = uDe(ejeMuslo, [x, -0.5, 0]);
      const c = ejeMuslo.getPointAt(u);
      const r = radioMuslo(u);
      const p = new THREE.Vector3(c.x, c.y + r * Math.cos(a), r * Math.sin(a));
      return { p, n };
    });
    const disco = conAtributos(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 28));
    const cables = electrodos.map((e, i) => tuboVariable(new THREE.CatmullRomCurve3([
      e.p.clone().addScaledVector(e.n, 0.03), e.p.clone().addScaledVector(e.n, 0.35).add(new THREE.Vector3(0.1, 0.1, 0.1)),
      new THREE.Vector3(1.3 + 0.25 * i, 1.35, 0.75), new THREE.Vector3(2.4 + 0.2 * i, 2.6, 0.9), new THREE.Vector3(3.2 + 0.2 * i, 4.2, 1.0),
    ], false, 'centripetal'), () => 0.016, { segs: 90, radial: 8 }));
    // microelectrodo de vidrio en la motoneurona α (registro intracelular)
    const dirMicro = new THREE.Vector3(0.45, 1, 0.75).normalize();
    const puntaMicro = v3(MN).add(new THREE.Vector3(0.03, 0.06, 0.05));
    const micro = tuboVariable(new THREE.LineCurve3(puntaMicro, puntaMicro.clone().addScaledVector(dirMicro, 3)), (u) => (u > 0.4 ? 0.05 : 0.004 + 0.046 * Math.pow(u / 0.4, 1.5)), { segs: 50, radial: 16 });
    const huso = geoHuso();
    return {
      losa, gris, canal, arteria, raizDorsal, raizVentral, raizDorsalIzq, raizVentralIzq, tramoD, tramoV, nervio, ganglio, tallo,
      ia, alfa, fibrasNervio, grisVentral, grisDorsal, vastoMedial, vastoLateral, colateral, axInter, axAnt, ramasAlfa, giroPlacas, arbolMN: arbolMN.geo, somaMN, arbolAnt: arbolAnt.geo, somaAnt, somaInter, somaDRG,
      femur, cuello, cuadriceps, isquios, gemelos, tendonCuad, esfera, cilindro, tibia, perone, pielMuslo, pielPierna, pie, tobillo,
      cabeza, mango, casquillo, electrodos, disco, cables, micro, huso,
    };
  }, []);
}

/** Libera todas las geometrías de un árbol de objetos (dos niveles bastan aquí). */
function liberar(x: unknown, nivel = 0) {
  if (x instanceof THREE.BufferGeometry) { x.dispose(); return; }
  if (nivel > 2 || !x || typeof x !== 'object') return;
  for (const v of Array.isArray(x) ? x : Object.values(x as Record<string, unknown>)) liberar(v, nivel + 1);
}

// ───────────────────────────── perfil del PA en una vía ─────────────────────────────

/** s (fracción de la distancia real del tramo, 0–1) para cada muestra del perfil. */
function distanciasVia(via: Via, aferente: boolean): Float32Array {
  const s = new Float32Array(N_PERFIL);
  for (let i = 0; i < N_PERFIL; i++) {
    const u = i / (N_PERFIL - 1);
    s[i] = aferente ? Math.min(1, u / via.uBorde) : Math.max(0, (u - via.uBorde) / (1 - via.uBorde));
  }
  return s;
}

/** Escribe el perfil (R = V, G = frente) de una vía para el instante t. */
function escribirPerfil(tex: THREE.DataTexture, sFrac: Float32Array, t: number, t0: number | null, durTramo: number) {
  const F = formaPA();
  const d = tex.image.data as Uint8Array;
  for (let i = 0; i < N_PERFIL; i++) {
    let V: number = HH.Vreposo, sub = 0;
    if (t0 !== null) {
      const tau = t - t0 - sFrac[i] * durTramo;
      V = muestraPA(F, tau).V;
      const V2 = muestraPA(F, tau - 0.01).V;
      // destello: sube hacia el umbral y decae 50 µs después de cruzarlo (τ = 0 en el cruce de −20 mV)
      sub = tau >= 0 ? Math.exp(-tau / 0.05) : V > V2 ? Math.min(1, Math.max(0, (V + 50) / 30)) ** 2 : 0;
    }
    d[4 * i] = Math.round(vNorm(V) * 255);
    d[4 * i + 1] = Math.round(sub * 255);
  }
  tex.needsUpdate = true;
}

/** V (mV) de la motoneurona en el instante t (ms del paciente). */
function vMN(e: EnsayoArco, t: number) {
  const tr = e.mn, rel = t - e.cron.llegadaMedula;
  if (rel <= tr.t[0]) return HH.Vreposo;
  const k = Math.min(tr.t.length - 1, Math.max(0, Math.round((rel - tr.t[0]) / tr.dt)));
  return tr.V[k];
}

/** Ángulo del martillo (rad; 0 = tocando el tendón; negativo = levantado). */
export function anguloMartillo(fuerza: number, t: number) {
  const a0 = THREE.MathUtils.degToRad(12 + 48 * Math.min(1, Math.max(0, fuerza) / 100));
  if (!Number.isFinite(t)) return -a0;
  if (t < 0) { const x = Math.min(1, -t / T_BALANCEO); return -a0 * x * x; }
  // rebote y vuelta a la posición de reposo
  const s = Math.min(1, t / 140);
  return -a0 * (s * s * (3 - 2 * s));
}

// ───────────────────────────── el arco ─────────────────────────────

export function ArcoReflejo3D({ reloj, fuerza, alPasar, rotulos }: { reloj: RelojArco; fuerza: number; alPasar?: AlPasar; rotulos?: boolean }) {
  const g = useGeoArco();
  const m = useMatsArco();
  const sIa = useMemo(() => distanciasVia(g.ia, true), [g]);
  const sAlfa = useMemo(() => distanciasVia(g.alfa, false), [g]);
  const uT = useMemo(() => uDe(g.ia.curva, T_DRG), [g]);
  const pierna = useRef<THREE.Group>(null);
  const martillo = useRef<THREE.Group>(null);
  const huso = useRef<THREE.Group>(null);
  const cuad = useRef<THREE.Mesh>(null);
  const tendonR = useRef<THREE.Mesh>(null);
  const frIa = useRef<THREE.Mesh>(null);
  const frAlfa = useRef<THREE.Mesh>(null);
  const fuerzaRef = useRef(fuerza); fuerzaRef.current = fuerza;
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), q: new THREE.Quaternion() }), []);
  const K = useMemo(() => v3(RODILLA), []);
  // puntos del tendón rotuliano: polo inferior de la rótula (fijo) y tuberosidad tibial (gira con la pierna)
  const polo = useMemo(() => new THREE.Vector3(1.99, -0.79, 0), []);
  const tuberRel = useMemo(() => new THREE.Vector3(1.9 - RODILLA[0], -1.32 - RODILLA[1], 0), []);
  useEffect(() => () => liberar(g), [g]);

  useFrame(() => {
    const e = reloj.ensayo;
    const activo = !!e && Number.isFinite(reloj.t);
    const t = activo ? reloj.t : -Infinity;
    // ── fibras
    if (e && activo) {
      const tramo = e.cron.conduccion / 2;
      escribirPerfil(m.perfilIa, sIa, t, 0, tramo);
      escribirPerfil(m.perfilAlfa, sAlfa, t, e.supra ? e.cron.disparoMN : null, tramo);
      const F = formaPA();
      const vT = muestraPA(F, t - 0.1 - uT / g.ia.uBorde * tramo).V;
      fijarVMembrana(m.somaDRG, vT, 0);
      fijarVMembrana(m.espiral, muestraPA(F, t).V, 0);
      const vm = vMN(e, t);
      fijarVMembrana(m.somaMN, vm, 0);
      // interneurona Ia inhibidora: dispara con el reflejo (0,7 ms tras la llegada); la antagonista se hiperpolariza
      const tIn = e.cron.llegadaMedula + 0.7;
      fijarVMembrana(m.inter, e.supra ? muestraPA(F, t - tIn).V : HH.Vreposo + 8 * Math.exp(-Math.max(0, t - e.cron.llegadaMedula - 0.3) / 2) * (t > e.cron.llegadaMedula + 0.3 ? 1 : 0), 0);
      const ipsp = e.supra && t > tIn + 0.6 ? -9 * ((t - tIn - 0.6) / 1.5) * Math.exp(1 - (t - tIn - 0.6) / 1.5) : 0;
      fijarVMembrana(m.somaAnt, HH.Vreposo + ipsp, 0);
      fijarVMembrana(m.placa, e.supra ? muestraPA(F, t - e.cron.llegadaPlaca + 0.05).V : HH.Vreposo, 0);
    } else {
      escribirPerfil(m.perfilIa, sIa, 0, null, 1);
      escribirPerfil(m.perfilAlfa, sAlfa, 0, null, 1);
      for (const x of [m.somaDRG, m.espiral, m.somaMN, m.inter, m.somaAnt, m.placa]) fijarVMembrana(x, HH.Vreposo, 0);
    }
    // ── mecánica: martillo, huso estirado, cuádriceps que se contrae, pierna que patea
    const f = e ? e.fuerza : fuerzaRef.current;
    if (martillo.current) martillo.current.rotation.z = ANG_MANGO + anguloMartillo(f, activo ? t : NaN);
    const Lr = e && e.supra && activo ? e.L : null;
    const sac = activo ? sacudida(t, Lr) : 0;
    const estiron = activo && t > 0 ? (t / 3) * Math.exp(1 - t / 3) * (0.4 + 0.6 * f / 100) : 0;
    if (huso.current) huso.current.scale.set(1 + 0.12 * estiron, 1 - 0.05 * estiron, 1 - 0.05 * estiron);
    if (cuad.current) cuad.current.scale.set(1 + 0.06 * sac, 1 - 0.035 * sac - 0.01 * estiron, 1 + 0.06 * sac);
    const act = Lr !== null && activo ? Math.exp(-(((t - Lr - 4) / 5) ** 2)) : 0;
    m.cuadriceps.emissiveIntensity = 0.55 * act;
    const theta = THREE.MathUtils.degToRad((14 + 12 * f / 100) * sac);
    if (pierna.current) pierna.current.rotation.z = theta;
    // tendón rotuliano entre la rótula y la tuberosidad (que gira con la pierna)
    // el frente del PA en cada fibra (una cuenta luminosa donde V cruza el umbral)
    const ponerFrente = (ref: React.RefObject<THREE.Mesh | null>, via: Via, u: number | null) => {
      const mm = ref.current; if (!mm) return;
      if (u === null) { mm.visible = false; return; }
      mm.visible = true;
      via.curva.getPointAt(Math.min(1, Math.max(0, u)), mm.position);
    };
    if (e && activo && t >= 0) {
      const tramo = e.cron.conduccion / 2;
      const sIaF = t / tramo;
      ponerFrente(frIa, g.ia, t < e.cron.llegadaMedula + 0.25 ? (sIaF < 1 ? sIaF * g.ia.uBorde : g.ia.uBorde + (1 - g.ia.uBorde) * Math.min(1, (t - e.cron.llegadaMedula) / 0.25)) : null);
      const sAF = (t - e.cron.disparoMN) / tramo;
      ponerFrente(frAlfa, g.alfa, e.supra && sAF >= 0 && sAF <= 1.02 ? g.alfa.uBorde + (1 - g.alfa.uBorde) * Math.min(1, sAF) : null);
    } else { ponerFrente(frIa, g.ia, null); ponerFrente(frAlfa, g.alfa, null); }
    if (tendonR.current) {
      tmp.b.copy(tuberRel).applyAxisAngle(new THREE.Vector3(0, 0, 1), theta).add(K);
      tmp.a.subVectors(tmp.b, polo);
      const L = tmp.a.length();
      tendonR.current.position.copy(polo).addScaledVector(tmp.a, 0.5);
      tendonR.current.quaternion.setFromUnitVectors(tmp.up, tmp.a.normalize());
      tendonR.current.scale.set(0.062, L, 0.05);
    }
  }, -1);

  const pasar = (nombre: string) => ({
    onPointerOver: (ev: ThreeEvent<PointerEvent>) => { ev.stopPropagation(); alPasar?.(nombre, ev); },
    onPointerMove: (ev: ThreeEvent<PointerEvent>) => { ev.stopPropagation(); alPasar?.(nombre, ev); },
    onPointerOut: () => alPasar?.(null),
  });
  const nada = () => null;
  const huso0 = v3(HUSO);
  const cuadPos = new THREE.Vector3(CUAD.cx, CUAD.cy, 0);

  return (
    <group>
      {/* médula ampliada */}
      <group position={[MEDULA.c[0], MEDULA.c[1], 0]}>
        <mesh geometry={g.losa.frente} material={m.blancaCorte} {...pasar('Sustancia blanca')} />
        <mesh geometry={g.losa.pared} material={m.blanca} {...pasar('Médula L3–L4 (corte)')} />
        <mesh geometry={g.losa.atras} material={m.blanca} raycast={nada} />
        <mesh geometry={g.gris} material={m.gris} position={[0, 0, 0.004]} {...pasar('Sustancia gris')} />
        <mesh geometry={g.canal} material={m.canal} position={[0, -0.02, 0.008]} raycast={nada} />
      </group>
      <mesh geometry={g.arteria} material={m.arteria} {...pasar('Arteria espinal anterior')} />
      <Instancias matrices={g.grisVentral} geo={g.esfera} material={m.neuronaVentral} />
      <Instancias matrices={g.grisDorsal} geo={g.esfera} material={m.neuronaDorsal} />
      <mesh geometry={g.fibrasNervio} material={m.fibraTenue} raycast={nada} />
      <mesh geometry={g.raizDorsal} material={m.raiz} {...pasar('Raíz dorsal')} renderOrder={3} />
      <mesh geometry={g.raizVentral} material={m.raiz} {...pasar('Raíz ventral')} renderOrder={3} />
      <mesh geometry={g.raizDorsalIzq} material={m.raiz} raycast={nada} renderOrder={3} />
      <mesh geometry={g.raizVentralIzq} material={m.raiz} raycast={nada} renderOrder={3} />
      <mesh geometry={g.tramoD} material={m.vaina} raycast={nada} renderOrder={4} />
      <mesh geometry={g.tramoV} material={m.vaina} raycast={nada} renderOrder={4} />
      <mesh geometry={g.nervio} material={m.vaina} {...pasar('Nervio femoral')} renderOrder={4} />
      <mesh geometry={g.ganglio} material={m.ganglio} {...pasar('Ganglio raquídeo')} renderOrder={5} />
      <mesh geometry={g.somaDRG} material={m.somaDRG} position={SOMA_DRG} {...pasar('Neurona sensitiva')} />
      <mesh geometry={g.tallo} material={m.somaDRG} raycast={nada} />
      {/* neuronas del corte */}
      <mesh geometry={g.somaMN} material={m.somaMN} position={MN} {...pasar('Motoneurona α')} />
      <mesh geometry={g.arbolMN} material={m.somaMN} raycast={nada} />
      <mesh geometry={g.somaAnt} material={m.somaAnt} position={MN_ANT} {...pasar('Motoneurona de los isquiotibiales')} />
      <mesh geometry={g.arbolAnt} material={m.somaAnt} raycast={nada} />
      <mesh geometry={g.somaInter} material={m.inter} position={INTER} {...pasar('Interneurona Ia inhibidora')} />
      <mesh geometry={g.colateral} material={m.ia} raycast={nada} />
      <mesh geometry={g.axInter} material={m.inter} raycast={nada} />
      <mesh geometry={g.axAnt} material={m.somaAnt} raycast={nada} />
      <mesh geometry={g.micro} material={m.vidrio} renderOrder={6} {...pasar('Microelectrodo (registro de la motoneurona)')} />
      {/* fibras Ia y α con su mielina */}
      <mesh geometry={g.ia.fibra.axon} material={m.ia} {...pasar('Fibra Ia (sensitiva)')} />
      {g.ia.fibra.vainas && <mesh geometry={g.ia.fibra.vainas} material={m.mielinaIa} raycast={nada} renderOrder={2} />}
      <mesh geometry={g.alfa.fibra.axon} material={m.alfa} {...pasar('Fibra α (motora)')} />
      {g.alfa.fibra.vainas && <mesh geometry={g.alfa.fibra.vainas} material={m.mielinaAlfa} raycast={nada} renderOrder={2} />}
      <mesh geometry={g.ramasAlfa} material={m.alfa} raycast={nada} />
      <mesh ref={frIa} geometry={g.esfera} material={m.frente} scale={0.055} visible={false} raycast={nada} />
      <mesh ref={frAlfa} geometry={g.esfera} material={m.frente} scale={0.055} visible={false} raycast={nada} />
      {PLACAS.map((p, i) => <mesh key={i} geometry={g.esfera} material={m.placa} position={p} quaternion={g.giroPlacas[i]} scale={[0.055, 0.02, 0.042]} {...pasar('Placa motora')} />)}
      {/* huso muscular */}
      <group ref={huso} position={huso0} rotation={[0, 0, 0.12]}>
        <mesh geometry={g.huso.capsula} material={m.capsula} renderOrder={3} {...pasar('Huso muscular')} />
        <mesh geometry={g.huso.fibras} material={m.intrafusal} raycast={nada} />
        <mesh geometry={g.huso.espiral} material={m.espiral} raycast={nada} />
      </group>
      {/* muslo */}
      <mesh geometry={g.femur} material={m.hueso} {...pasar('Fémur')} />
      <mesh geometry={g.cuello} material={m.hueso} raycast={nada} />
      <mesh geometry={g.esfera} material={m.hueso} position={[-2.26, -0.24, -0.05]} scale={0.19} raycast={nada} />
      <mesh geometry={g.esfera} material={m.hueso} position={[1.62, -0.66, 0.1]} scale={[0.19, 0.2, 0.16]} raycast={nada} />
      <mesh geometry={g.esfera} material={m.hueso} position={[1.62, -0.66, -0.2]} scale={[0.19, 0.2, 0.16]} raycast={nada} />
      <mesh ref={cuad} geometry={g.cuadriceps} material={m.cuadriceps} position={cuadPos} rotation={[0, 0, -Math.PI / 2]} {...pasar('Cuádriceps')} />
      <mesh geometry={g.vastoMedial} material={m.cuadriceps} position={[0.95, -0.4, 0.3]} rotation={[0, 0, -Math.PI / 2 - 0.16]} {...pasar('Vasto medial (cuádriceps)')} />
      <mesh geometry={g.vastoLateral} material={m.cuadriceps} position={[-0.35, -0.42, -0.33]} rotation={[0, 0, -Math.PI / 2 - 0.03]} {...pasar('Vasto lateral (cuádriceps)')} />
      <mesh geometry={g.isquios} material={m.musculo} position={[-0.45, -0.86, -0.05]} rotation={[0, 0, -Math.PI / 2 - 0.02]} {...pasar('Isquiotibiales')} />
      <mesh geometry={g.tendonCuad} material={m.tendon} raycast={nada} />
      <mesh geometry={g.esfera} material={m.hueso} position={[2.0, -0.6, 0]} scale={[0.1, 0.17, 0.15]} rotation={[0, 0, 0.35]} {...pasar('Rótula')} />
      <mesh ref={tendonR} geometry={g.cilindro} material={m.tendon} {...pasar('Tendón rotuliano')} />
      <mesh geometry={g.esfera} material={m.piel} position={RODILLA} scale={0.5} renderOrder={9} raycast={nada} />
      <mesh geometry={g.pielMuslo} material={m.piel} renderOrder={9} raycast={nada} />
      {/* pierna que gira en la rodilla */}
      <group ref={pierna} position={RODILLA}>
        <mesh geometry={g.tibia} material={m.hueso} {...pasar('Tibia')} />
        <mesh geometry={g.perone} material={m.hueso} raycast={nada} />
        <mesh geometry={g.esfera} material={m.hueso} position={[1.9 - RODILLA[0], -1.3 - RODILLA[1], 0]} scale={[0.07, 0.09, 0.07]} raycast={nada} />
        <mesh geometry={g.gemelos} material={m.musculo} position={[1.47 - RODILLA[0], -1.78 - RODILLA[1], -0.04]} rotation={[0, 0, 0.04]} raycast={nada} />
        <mesh geometry={g.pielPierna} material={m.piel} renderOrder={9} raycast={nada} />
        <mesh geometry={g.tobillo} material={m.piel} renderOrder={9} raycast={nada} />
        <mesh geometry={g.pie} material={m.piel} renderOrder={9} scale={[1, 1, 1]} raycast={nada} />
      </group>
      {/* electrodos de superficie del EMG */}
      {g.electrodos.map((el, i) => (
        <group key={i}>
          <mesh geometry={g.disco} material={m.electrodo} position={el.p} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), el.n)} {...pasar('Electrodo del EMG')} />
          <mesh geometry={g.esfera} material={m.cromo} position={el.p.clone().addScaledVector(el.n, 0.02)} scale={0.025} raycast={nada} />
          <mesh geometry={g.cables[i]} material={i ? m.cableNegro : m.cableRojo} raycast={nada} />
        </group>
      ))}
      {/* martillo de Taylor */}
      <group ref={martillo} position={PIVOTE} rotation={[0, 0, ANG_MANGO]}>
        <mesh geometry={g.mango} material={m.cromo} {...pasar('Martillo de reflejos')} />
        <mesh geometry={g.casquillo} material={m.cromo} raycast={nada} />
        <mesh geometry={g.cabeza} material={m.goma} position={[0, MANGO, 0]} {...pasar('Martillo de reflejos')} />
      </group>
      {rotulos && <Rotulos lista={rotulosArco()} />}
    </group>
  );
}

// ───────────────────────────── rótulos y encuadres ─────────────────────────────

export function rotulosArco(): Rotulo[] {
  return [
    { texto: 'Médula L3–L4', p: enMedula(-0.75, 0.62, 0.02), dx: -64, dy: -40 },
    { texto: 'Interneurona', p: INTER, dx: -150, dy: -10 },
    { texto: 'Motoneurona α', p: MN, dx: -150, dy: 44 },
    { texto: 'Ganglio raquídeo', p: DRG, dx: 40, dy: -40 },
    { texto: 'Fibra Ia', p: [0.13, 0.95, 0.15], dx: 70, dy: -10 },
    { texto: 'Huso muscular', p: HUSO, dx: -96, dy: -46 },
    { texto: 'Cuádriceps', p: [-1.6, -0.1, 0.3], dx: -40, dy: 64 },
    { texto: 'Tendón rotuliano', p: [2.0, -1.1, 0.05], dx: 64, dy: 40 },
  ];
}

export const ENCUADRE_ARCO = { centro: [-0.1, -0.42, 0] as V3, semiAlto: 4.5, semiAncho: 4.2, dir: [0.32, 0.18, 1] as V3 };
export const ENCUADRE_MEDULA = { centro: [-2.0, 1.62, 0] as V3, semiAlto: 1.15, semiAncho: 1.75, dir: [0.28, 0.16, 1] as V3 };
