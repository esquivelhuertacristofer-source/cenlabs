'use client';
/**
 * bio08/piezas.tsx — electrocardiograma (1 u = 1 dm; sobre la mesa del laboratorio).
 *
 * Piezas: modelo anatómico del corazón (paredes translúcidas y cámaras con sangre que se
 * llenan y se vacían, válvulas AV y sigmoideas, aorta y tronco pulmonar con el bolo de la
 * eyección) y el monitor de ECG con cuadrícula de papel (cuadro grande = 0,2 s = 0,5 mV).
 *
 * Honestidad: el monitor NO imprime la frecuencia cardiaca: el alumno la mide en el trazo
 * (300 / cuadros grandes entre dos R, o 60 / R-R). Todo sale de un solo reloj cardiaco, y
 * las cámaras siguen `contraccionB8` del dominio.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useMateriales, geoCache, cajaRedondeada, crearLienzo, texturaDeLienzo, familiaTexto, FAMILIA_MONO } from '../_kit';
import { ecgMvB8, faseCicloB8 } from '@/domain/biologia';

type V3 = [number, number, number];
type GroupProps = ThreeElements['group'];

// ───────────────────────────── reloj cardiaco único ─────────────────────────────

export const PASO_MS = 10;
export const VENTANA_S = 4;
export const N_MUESTRAS = (VENTANA_S * 1000) / PASO_MS;

export interface RelojCardiaco {
  tCiclo: number;       // ms desde el inicio de la onda P del latido actual
  rr: number;           // R-R del latido en curso (ms)
  rrObjetivo: number;   // R-R que pide la FC actual (se aplica en el siguiente latido, como el nodo SA)
  acc: number;
  muestras: Float32Array;
  cursor: number;       // columna de barrido
  nuevas: number;       // muestras escritas desde el último dibujo
}
export const nuevoReloj = (bpm: number): RelojCardiaco => ({
  tCiclo: 0, rr: 60000 / bpm, rrObjetivo: 60000 / bpm, acc: 0, muestras: new Float32Array(N_MUESTRAS), cursor: 0, nuevas: 0,
});
export function avanzarReloj(r: RelojCardiaco, dtMs: number) {
  r.acc += Math.min(dtMs, 250);
  while (r.acc >= PASO_MS) {
    r.acc -= PASO_MS;
    r.tCiclo += PASO_MS;
    if (r.tCiclo >= r.rr) { r.tCiclo -= r.rr; r.rr = r.rrObjetivo; }
    r.muestras[r.cursor] = ecgMvB8(r.tCiclo, r.rr);
    r.cursor = (r.cursor + 1) % N_MUESTRAS;
    r.nuevas++;
  }
}

// ───────────────────────────── corazón anatómico ─────────────────────────────

const AZUL = '#4d6fd0', ROJO = '#cc2f35';

/** Esfera deformada en cono hacia el ápice (y < 0): la silueta del ventrículo. */
function geoVentriculo(afilado: number) {
  return geoCache('bio08:vent:' + afilado, () => {
    const g = new THREE.SphereGeometry(1, 44, 30);
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = y < 0 ? 1 + afilado * y : 1;
      p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  });
}
const esf = () => geoCache('bio08:esf', () => new THREE.SphereGeometry(1, 28, 20));

function trayecto(pts: V3[], radio: number, seg = 60) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal'), seg, radio, 12, false);
}

const RUTAS = {
  aorta: [[0.2, 0.7, 0.0], [0.2, 1.5, 0.0], [0.28, 2.15, -0.05], [0.65, 2.55, -0.15], [1.1, 2.3, -0.35], [1.28, 1.7, -0.45], [1.3, 1.0, -0.5]] as V3[],
  pulmonar: [[-0.3, 0.75, 0.45], [-0.22, 1.4, 0.5], [0.0, 2.0, 0.42], [0.42, 2.32, 0.2]] as V3[],
  paDer: [[0.42, 2.32, 0.2], [-0.15, 2.58, -0.15], [-0.7, 2.55, -0.55]] as V3[],
  paIzq: [[0.42, 2.32, 0.2], [1.0, 2.5, -0.1], [1.55, 2.3, -0.5]] as V3[],
  cavaSup: [[-1.0, 1.25, 0.0], [-1.03, 2.5, 0.0]] as V3[],
  cavaInf: [[-0.95, 0.3, -0.05], [-1.0, -0.8, -0.05]] as V3[],
  venasPulm1: [[1.5, 1.6, -0.75], [0.85, 1.35, -0.62]] as V3[],
  venasPulm2: [[1.5, 0.85, -0.75], [0.85, 1.0, -0.62]] as V3[],
};

function useMatsCorazon() {
  const m = useMemo(() => {
    const cavidad = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0 });
    const pared = (c: string, o: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false, clearcoat: 0.5, clearcoatRoughness: 0.3 });
    return {
      sangreD: cavidad(AZUL), sangreI: cavidad(ROJO),
      paredD: pared('#9fb3ea', 0.34), paredI: pared('#e98c8f', 0.34),
      vasoD: new THREE.MeshStandardMaterial({ color: '#6280d6', roughness: 0.45 }),
      vasoI: new THREE.MeshStandardMaterial({ color: '#d4343a', roughness: 0.45 }),
      valv: new THREE.MeshStandardMaterial({ color: '#f1e8cf', roughness: 0.5, side: THREE.DoubleSide }),
      bolo: new THREE.MeshStandardMaterial({ color: '#ff8a7a', emissive: '#ff5a4a', emissiveIntensity: 0.55, roughness: 0.4 }),
      boloD: new THREE.MeshStandardMaterial({ color: '#8fb0ff', emissive: '#5b84ff', emissiveIntensity: 0.55, roughness: 0.4 }),
    };
  }, []);
  useEffect(() => () => { Object.values(m).forEach((x) => x.dispose()); }, [m]);
  return m;
}

/** Aleta de válvula con bisagra en el origen del grupo; `ang` en rad (0 = plana). */
function Aletas({ ancho, ang, material }: { ancho: number; ang: React.MutableRefObject<number>; material: THREE.Material }) {
  const a = useRef<THREE.Group>(null), b = useRef<THREE.Group>(null);
  useFrame(() => {
    if (a.current) a.current.rotation.z = ang.current;
    if (b.current) b.current.rotation.z = -ang.current;
  });
  const g = geoCache('bio08:aleta', () => { const x = new THREE.BoxGeometry(1, 0.025, 0.28); x.translate(0.5, 0, 0); return x; });
  return (
    <group>
      <group ref={a} position={[-ancho / 2, 0, 0]} rotation={[0, 0, 0]}><mesh geometry={g} material={material} scale={[ancho * 0.52, 1, 1]} /></group>
      <group ref={b} position={[ancho / 2, 0, 0]} rotation={[0, Math.PI, 0]}><mesh geometry={g} material={material} scale={[ancho * 0.52, 1, 1]} /></group>
    </group>
  );
}

export interface EstadoCorazon { auriculas: number; ventriculos: number; sistole: number }

/** Corazón en vista anterior: la derecha del paciente queda a la izquierda de la imagen. */
export function Corazon({ estado, ...g }: { estado: React.MutableRefObject<EstadoCorazon> } & GroupProps) {
  const m = useMatsCorazon();
  const cavVI = useRef<THREE.Mesh>(null), cavVD = useRef<THREE.Mesh>(null);
  const cavAI = useRef<THREE.Mesh>(null), cavAD = useRef<THREE.Mesh>(null);
  const parede = useRef<THREE.Group>(null);
  const angAV = useRef(0.85), angSL = useRef(0);
  const boloAo = useRef(0), boloPu = useRef(0);
  const geos = useMemo(() => ({
    aorta: trayecto(RUTAS.aorta, 0.2), pulmonar: trayecto(RUTAS.pulmonar, 0.19), paDer: trayecto(RUTAS.paDer, 0.12), paIzq: trayecto(RUTAS.paIzq, 0.12),
    cavaSup: trayecto(RUTAS.cavaSup, 0.2), cavaInf: trayecto(RUTAS.cavaInf, 0.2), vp1: trayecto(RUTAS.venasPulm1, 0.11), vp2: trayecto(RUTAS.venasPulm2, 0.11),
    boloAo: trayecto(RUTAS.aorta, 0.23, 60), boloPu: trayecto(RUTAS.pulmonar, 0.22, 60),
  }), []);
  useEffect(() => () => { Object.values(geos).forEach((x) => x.dispose()); }, [geos]);
  const segAo = (geos.boloAo.index?.count ?? 0) / 60, segPu = (geos.boloPu.index?.count ?? 0) / 60;
  useFrame(() => {
    const e = estado.current;
    const au = e.auriculas, ve = e.ventriculos;
    const sAu = 1 - 0.3 * au, sVe = 1 - 0.32 * ve;
    cavVI.current?.scale.set(0.58 * sVe, 1.0 * sVe, 0.52 * sVe);
    cavVD.current?.scale.set(0.46 * sVe, 0.88 * sVe, 0.36 * sVe);
    cavAI.current?.scale.set(0.48 * sAu, 0.46 * sAu, 0.46 * sAu);
    cavAD.current?.scale.set(0.5 * sAu, 0.52 * sAu, 0.48 * sAu);
    parede.current?.scale.setScalar(1 - 0.045 * ve);
    // válvulas: AV abiertas en diástole, cerradas en sístole; sigmoideas al revés
    const sis = ve > 0.12 ? 1 : 0;
    angAV.current += ((sis ? 0 : 0.9) - angAV.current) * 0.35;
    angSL.current += ((sis ? 0.95 : 0) - angSL.current) * 0.35;
    // bolo de la eyección: recorre la aorta y el tronco pulmonar durante la sístole
    const p = e.sistole;
    for (const [mesh, seg, ref] of [[geos.boloAo, segAo, boloAo], [geos.boloPu, segPu, boloPu]] as const) {
      ref.current = p;
      if (p > 0 && p < 1) {
        const d = Math.max(0, p * 1.15 - 0.3), h = Math.min(1, p * 1.15);
        mesh.setDrawRange(Math.floor(d * 60) * seg, Math.max(0, (Math.ceil(h * 60) - Math.floor(d * 60)) * seg));
      } else mesh.setDrawRange(0, 0);
    }
  });
  return (
    <group {...g}>
      {/* cámaras con sangre (opacas); las paredes translúcidas las dejan ver */}
      <mesh ref={cavVI} geometry={geoVentriculo(0.4)} material={m.sangreI} position={[0.42, -0.3, -0.08]} rotation={[0, 0, 0.32]} />
      <mesh ref={cavVD} geometry={geoVentriculo(0.45)} material={m.sangreD} position={[-0.5, -0.05, 0.38]} rotation={[0, 0, 0.18]} />
      <mesh ref={cavAI} geometry={esf()} material={m.sangreI} position={[0.62, 1.12, -0.55]} />
      <mesh ref={cavAD} geometry={esf()} material={m.sangreD} position={[-0.88, 0.92, 0.05]} />
      {/* tabique interventricular */}
      <mesh geometry={esf()} material={m.valv} position={[-0.02, -0.25, 0.16]} rotation={[0, 0, 0.3]} scale={[0.03, 0.95, 0.38]} />
      {/* válvulas */}
      <group position={[0.4, 0.62, -0.25]}><Aletas ancho={0.62} ang={angAV} material={m.valv} /></group>
      <group position={[-0.52, 0.58, 0.2]}><Aletas ancho={0.62} ang={angAV} material={m.valv} /></group>
      <group position={[0.2, 0.78, 0.0]} scale={[1, -1, 1]}><Aletas ancho={0.38} ang={angSL} material={m.valv} /></group>
      <group position={[-0.3, 0.8, 0.45]} scale={[1, -1, 1]}><Aletas ancho={0.38} ang={angSL} material={m.valv} /></group>
      {/* paredes translúcidas */}
      <group ref={parede}>
        <mesh geometry={geoVentriculo(0.4)} material={m.paredI} position={[0.32, -0.28, -0.05]} rotation={[0, 0, 0.32]} scale={[0.88, 1.5, 0.82]} renderOrder={2} />
        <mesh geometry={geoVentriculo(0.45)} material={m.paredD} position={[-0.58, -0.08, 0.36]} rotation={[0, 0, 0.18]} scale={[0.66, 1.2, 0.52]} renderOrder={2} />
      </group>
      <mesh geometry={esf()} material={m.paredI} position={[0.62, 1.12, -0.55]} scale={[0.66, 0.62, 0.62]} renderOrder={2} />
      <mesh geometry={esf()} material={m.paredI} position={[1.05, 1.0, 0.1]} scale={[0.26, 0.42, 0.2]} rotation={[0, 0, -0.5]} renderOrder={2} />
      <mesh geometry={esf()} material={m.paredD} position={[-0.88, 0.92, 0.05]} scale={[0.68, 0.7, 0.62]} renderOrder={2} />
      {/* grandes vasos */}
      <mesh geometry={geos.aorta} material={m.vasoI} />
      <mesh geometry={geos.pulmonar} material={m.vasoD} />
      <mesh geometry={geos.paDer} material={m.vasoD} />
      <mesh geometry={geos.paIzq} material={m.vasoD} />
      <mesh geometry={geos.cavaSup} material={m.vasoD} />
      <mesh geometry={geos.cavaInf} material={m.vasoD} />
      <mesh geometry={geos.vp1} material={m.vasoI} />
      <mesh geometry={geos.vp2} material={m.vasoI} />
      {/* ramas del cayado */}
      {[[0.42, 2.5], [0.7, 2.62], [0.95, 2.52]].map(([x, y], i) => (
        <mesh key={i} geometry={geoCache('bio08:rama', () => new THREE.CylinderGeometry(0.07, 0.08, 0.5, 10))} material={m.vasoI} position={[x, y + 0.2, -0.17 - i * 0.04]} />
      ))}
      {/* bolo de sangre expulsada */}
      <mesh geometry={geos.boloAo} material={m.bolo} />
      <mesh geometry={geos.boloPu} material={m.boloD} />
    </group>
  );
}

// ───────────────────────────── monitor de ECG ─────────────────────────────

const W = 1280, H = 720;
export const ANCHO_PANTALLA = 9.0, ALTO_PANTALLA = (9.0 * H) / W;
const X0 = 24, X1 = W - 24, Y0 = 84, Y1 = H - 66;
const PX_S = (X1 - X0) / VENTANA_S;           // px por segundo (cuadro grande = 0,2 s)
const PX_MV = 84;                              // px por mV (10 mm/mV; 1 mm = 8,4 px → cuadro grande = 0,5 mV)
const YB = Y0 + (Y1 - Y0) * 0.6;               // línea de base

function dibujarRejilla(ctx: CanvasRenderingContext2D) {
  const fam = familiaTexto();
  ctx.fillStyle = '#061310'; ctx.fillRect(0, 0, W, H);
  const mmPx = PX_S * 0.04;                     // 1 mm = 40 ms
  ctx.lineWidth = 1;
  for (let x = X0; x <= X1 + 0.1; x += mmPx) {
    const grande = Math.round((x - X0) / mmPx) % 5 === 0;
    ctx.strokeStyle = grande ? 'rgba(110,210,160,0.42)' : 'rgba(110,210,160,0.13)';
    ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y1); ctx.stroke();
  }
  for (let y = YB; y >= Y0 - 0.1; y -= mmPx) {
    const grande = Math.round((YB - y) / mmPx) % 5 === 0;
    ctx.strokeStyle = grande ? 'rgba(110,210,160,0.42)' : 'rgba(110,210,160,0.13)';
    ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
  }
  for (let y = YB + mmPx; y <= Y1 + 0.1; y += mmPx) {
    const grande = Math.round((y - YB) / mmPx) % 5 === 0;
    ctx.strokeStyle = grande ? 'rgba(110,210,160,0.42)' : 'rgba(110,210,160,0.13)';
    ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(110,210,160,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
  // cabecera y calibración
  ctx.fillStyle = '#b6f0d2'; ctx.font = `700 44px ${fam}`; ctx.fillText('II', X0 + 4, 58);
  ctx.font = `600 28px ${FAMILIA_MONO}`; ctx.fillText('25 mm/s   10 mm/mV', X0 + 90, 56);
  ctx.textAlign = 'right'; ctx.font = `600 26px ${fam}`; ctx.fillText('cuadro grande = 0,2 s', X1, 56); ctx.textAlign = 'left';
  // pulso de calibración de 1 mV (2 cuadros grandes de alto)
  ctx.strokeStyle = '#5cff9d'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X0 + 8, YB); ctx.lineTo(X0 + 8 + 12, YB); ctx.lineTo(X0 + 8 + 12, YB - PX_MV); ctx.lineTo(X0 + 8 + 12 + PX_S * 0.2, YB - PX_MV); ctx.lineTo(X0 + 8 + 12 + PX_S * 0.2, YB); ctx.lineTo(X0 + 8 + 12 + PX_S * 0.2 + 12, YB); ctx.stroke();
}

/** Monitor colgado de la pared (el origen es el centro de la caja). El barrido lee las muestras del reloj único; no se imprime ninguna FC. */
export function MonitorECG({ reloj, estado, ...g }: { reloj: React.MutableRefObject<RelojCardiaco>; estado: React.MutableRefObject<{ t: number; rr: number }> } & GroupProps) {
  const m = useMateriales();
  const { tex, rejilla } = useMemo(() => {
    if (typeof document === 'undefined') return { tex: null, rejilla: null };
    const c = crearLienzo(W, H);
    const r = crearLienzo(W, H);
    dibujarRejilla(r.getContext('2d')!);
    return { tex: texturaDeLienzo(c, { mipmaps: false }), rejilla: r };
  }, []);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  const ultimaFase = useRef('');
  const frames = useRef(0);
  useFrame(() => {
    if (!tex || !rejilla) return;
    frames.current++;
    const r = reloj.current;
    if (r.nuevas === 0 && frames.current % 30 !== 0) return;
    r.nuevas = 0;
    const c = tex.image as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(rejilla, 0, 0);
    // trazo: del cursor hacia atrás en el tiempo (la parte adelante del cursor se borra con un hueco)
    const hueco = 10;
    ctx.strokeStyle = '#5cff9d'; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const paso = (X1 - X0) / N_MUESTRAS;
    const dibujarTramo = (desde: number, hasta: number) => {
      ctx.beginPath();
      let primero = true;
      for (let i = desde; i < hasta; i++) {
        const x = X0 + i * paso, y = YB - r.muestras[i] * PX_MV;
        if (primero) { ctx.moveTo(x, y); primero = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    const cur = r.cursor;
    dibujarTramo(0, Math.max(0, cur - 1));
    dibujarTramo(Math.min(N_MUESTRAS, cur + hueco), N_MUESTRAS);
    // punto de barrido
    const xh = X0 + cur * paso, yh = YB - (r.muestras[(cur + N_MUESTRAS - 1) % N_MUESTRAS] ?? 0) * PX_MV;
    ctx.fillStyle = '#eafff3'; ctx.beginPath(); ctx.arc(xh, yh, 5.5, 0, 6.283); ctx.fill();
    // fase del ciclo (sin cifras de frecuencia)
    const fase = faseCicloB8(estado.current.t, estado.current.rr);
    ultimaFase.current = fase;
    ctx.fillStyle = '#b6f0d2'; ctx.font = `600 30px ${familiaTexto()}`; ctx.fillText(fase, X0 + 6, H - 24);
    tex.needsUpdate = true;
  });
  return (
    <group {...g}>
      {/* caja del monitor y pantalla (el origen del grupo es el centro de la caja) */}
      <group>
        <mesh geometry={cajaRedondeada(ANCHO_PANTALLA + 0.7, ALTO_PANTALLA + 0.7, 0.5, 0.18)} material={m.carcasaOscura} castShadow />
        <mesh position={[0, 0, 0.255]} material={mat}><planeGeometry args={[ANCHO_PANTALLA, ALTO_PANTALLA]} /></mesh>
        <mesh position={[ANCHO_PANTALLA / 2 + 0.17, -(ALTO_PANTALLA + 0.7) / 2 + 0.2, 0.26]} material={m.plastico('#2fa56b', 0.4)}>
          <circleGeometry args={[0.06, 12]} />
        </mesh>
      </group>
    </group>
  );
}
