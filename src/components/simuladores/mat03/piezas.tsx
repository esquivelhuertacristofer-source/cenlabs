'use client';
/**
 * mat03/piezas.tsx — sismógrafo de tambor y maqueta de ciudad del lab de
 * magnitud de momento.
 *
 *  - `senalSismica(t)`: registro normalizado de un evento (P, S y coda) que se
 *    repite cada `CICLO` s. Lo comparten los dos sismógrafos y la ciudad.
 *  - `Sismografo`: tambor con papel milimetrado que gira, brazo con pluma que
 *    traza sobre él y masa inercial. La traza se DIBUJA en un lienzo: la pluma
 *    escribe donde está, el papel se mueve y la tinta queda.
 *  - `Ciudad`: bloques con fachada de ventanas que oscilan con el mismo registro.
 *
 * AMPLITUD: la traza es proporcional a 10^Mw (cada unidad de magnitud multiplica
 * ×10 la amplitud, +20 dB) con un ATENUADOR en pasos de 10 dB, como un registrador
 * real: el rótulo dice «atenuador N dB». Es una traza esquemática, no una
 * calibración de estación.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  useMateriales, cajaRedondeada, cilindro, esfera, crearLienzo, texturaDeLienzo, texturaCompartida, Etiqueta, azar,
} from '../_kit';

export const CICLO = 8;            // s: un evento por vuelta del tambor
const T_P = 1.2, T_S = 2.7;        // llegada de las ondas P y S dentro del ciclo (s)

const suave = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Registro normalizado (≈ −1…1) de un evento en el instante `tc` del ciclo [0, CICLO). */
export function senalSismica(tc: number): number {
  let v = 0;
  if (tc > T_P) { const d = tc - T_P; v += 0.18 * Math.exp(-d / 1.1) * Math.sin(d * 38) * suave(0, 0.12, d); }
  if (tc > T_S) {
    const d = tc - T_S;
    v += 0.95 * Math.exp(-d / 1.7) * Math.sin(d * 16 + 0.5 * Math.sin(d * 2.7)) * suave(0, 0.35, d);
    v += 0.25 * Math.exp(-d / 2.4) * Math.sin(d * 9.5 + 1.1);
  }
  return v;
}

/**
 * Atenuador (dB, pasos de 10) y fracción de escala completa de la traza.
 * Amplitud A (mm) = 10^(Mw − 3), es decir +20 dB por cada unidad de magnitud;
 * el papel admite 20 mm (≈ 26 dB) y el atenuador baja la señal en pasos de 10 dB.
 */
export function ganancia(mw: number): { dB: number; frac: number } {
  const Adb = 20 * (mw - 3), esc = 20 * Math.log10(20);
  const dB = Math.max(0, Math.ceil((Adb - esc) / 10 - 1e-9) * 10);
  return { dB, frac: Math.min(1, Math.pow(10, (Adb - dB - esc) / 20)) };
}

/** Intensidad de la sacudida visual de la maqueta (u). Esquemática y acotada. */
export const sacudida = (mw: number) => Math.min(0.16, 0.012 * Math.pow(1.55, Math.max(0, mw - 4)));

function useGeo<T extends THREE.BufferGeometry>(crear: () => T, deps: unknown[]): T {
  const g = useMemo(crear, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

// ───────────────────────────── sismógrafo de tambor ─────────────────────────────

const R = 0.75, LONG = 2.3, BRAZO = 1.15;     // radio del tambor, largo y brazo de la pluma (u)
const AX = 1.12;                              // altura del eje del tambor sobre la mesa de la base (u)
const W_INK = 768, H_INK = 192;
const AMP = 0.44;                              // fracción del alto del papel que alcanza la escala completa

function texPapel() {
  return texturaCompartida('mat03-papel-tambor', 1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f5efdf'; ctx.fillRect(0, 0, w, h);
    // milimetrado: fina cada 1/64 de vuelta y cada 1/16 del largo; gruesa cada 8 y 4
    for (let i = 0; i <= 64; i++) {
      ctx.strokeStyle = i % 8 === 0 ? 'rgba(190,110,90,0.55)' : 'rgba(190,110,90,0.22)'; ctx.lineWidth = i % 8 === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo((i / 64) * w, 0); ctx.lineTo((i / 64) * w, h); ctx.stroke();
    }
    for (let j = 0; j <= 16; j++) {
      ctx.strokeStyle = j % 4 === 0 ? 'rgba(190,110,90,0.55)' : 'rgba(190,110,90,0.22)'; ctx.lineWidth = j % 4 === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(0, (j / 16) * h); ctx.lineTo(w, (j / 16) * h); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(90,70,60,0.7)'; ctx.lineWidth = 2;       // línea de cero
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
  }, { repetir: [1, 1] });
}

export interface PropsSismografo {
  magnitud: number;
  color: string;           // color de la tinta
  titulo: string;
  position?: [number, number, number];
}

/** Sismógrafo de tambor: el papel gira una vuelta por ciclo y la pluma traza el evento. */
export function Sismografo({ magnitud, color, titulo, position = [0, 0, 0] }: PropsSismografo) {
  const m = useMateriales();
  const { dB, frac } = ganancia(magnitud);
  const papel = texPapel();
  const lienzo = useMemo(() => (typeof document === 'undefined' ? null : crearLienzo(W_INK, H_INK)), []);
  const tinta = useMemo(() => {
    if (!lienzo) return null;
    const t = texturaDeLienzo(lienzo, { mipmaps: false });
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }, [lienzo]);
  useEffect(() => () => tinta?.dispose(), [tinta]);
  const matPapel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', map: papel, roughness: 0.85, side: THREE.DoubleSide }), [papel]);
  const matTinta = useMemo(() => new THREE.MeshBasicMaterial({ map: tinta, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), [tinta]);
  useEffect(() => () => { matPapel.dispose(); matTinta.dispose(); }, [matPapel, matTinta]);
  const geoTambor = useGeo(() => new THREE.CylinderGeometry(R, R, LONG, 96, 1, true), []);
  const geoTinta = useGeo(() => new THREE.CylinderGeometry(R + 0.004, R + 0.004, LONG, 96, 1, true), []);

  const matPluma = useMemo(() => new THREE.MeshBasicMaterial({ color }), [color]);
  useEffect(() => () => matPluma.dispose(), [matPluma]);
  const penRef = useRef<THREE.Group>(null);
  const masaRef = useRef<THREE.Group>(null);
  const estado = useRef({ c: -1, y: 0.5, frac: -1 });
  const colorTinta = color;

  // trazo completo del ciclo con la amplitud actual (se usa al cambiar la magnitud)
  const dibujaTodo = (ctx: CanvasRenderingContext2D, fr: number) => {
    ctx.clearRect(0, 0, W_INK, H_INK);
    ctx.strokeStyle = colorTinta; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let c = 0; c <= W_INK; c += 2) {
      const v = (senalSismica((c / W_INK) * CICLO) * fr * AMP);
      const y = (0.5 - v) * H_INK;
      if (c === 0) ctx.moveTo(c, y); else ctx.lineTo(c, y);
    }
    ctx.stroke();
  };

  useFrame((st) => {
    if (!lienzo || !tinta || !penRef.current) return;
    const ctx = lienzo.getContext('2d'); if (!ctx) return;
    const tc = st.clock.elapsedTime % CICLO;
    const fase = tc / CICLO;
    const c = fase * W_INK;
    const e = estado.current;
    // al cambiar la amplitud se rehace toda la traza
    if (Math.abs(e.frac - frac) > 1e-6) { dibujaTodo(ctx, frac); e.frac = frac; e.c = c; }
    const v = senalSismica(tc) * frac * AMP + 0.004 * Math.sin(tc * 53);
    const y = (0.5 - v) * H_INK;
    // la pluma escribe (sin unir el salto de fin de vuelta)
    if (e.c >= 0 && c >= e.c && c - e.c < W_INK / 4) {
      ctx.strokeStyle = colorTinta; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.c, e.y); ctx.lineTo(c, y); ctx.stroke();
    }
    // borra la tinta vieja que viene delante de la pluma
    const banda = W_INK * 0.05, ini = c + 4;
    if (ini + banda <= W_INK) ctx.clearRect(ini, 0, banda, H_INK);
    else { ctx.clearRect(ini, 0, W_INK - ini, H_INK); ctx.clearRect(0, 0, ini + banda - W_INK, H_INK); }
    e.c = c; e.y = y;
    tinta.offset.x = fase; if (papel) papel.offset.x = fase;
    tinta.needsUpdate = true;
    // brazo: x_pluma = −BRAZO·sen(α)
    const xPluma = v * LONG;
    const alfa = -Math.asin(Math.max(-0.97, Math.min(0.97, xPluma / BRAZO)));
    penRef.current.rotation.y = alfa;
    if (masaRef.current) masaRef.current.rotation.y = alfa;
  });

  const zT = -0.7;                               // z del eje del tambor
  const zPivote = zT + R + BRAZO + 0.05;         // pivote del brazo
  return (
    <group position={position}>
      {/* base */}
      <mesh geometry={cajaRedondeada(3.4, 0.22, 3.9, 0.04, 2)} material={m.hierroPintado} position={[0, 0.11, 0]} castShadow receiveShadow />
      {/* soportes del tambor y eje */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={cajaRedondeada(0.14, AX + R * 0.8, 1.3, 0.03, 2)} material={m.carcasaOscura} position={[s * (LONG / 2 + 0.14), (AX + R * 0.8) / 2 + 0.22, zT]} castShadow />
          <mesh geometry={cilindro(0.1, 0.1, 0.1, 18)} material={m.aluminio} rotation-z={Math.PI / 2} position={[s * (LONG / 2 + 0.05), AX + 0.22, zT]} />
        </group>
      ))}
      <mesh geometry={cilindro(0.04, 0.04, LONG + 0.5, 12)} material={m.acero} rotation-z={Math.PI / 2} position={[0, AX + 0.22, zT]} />
      {/* tambor: papel y tinta (el eje queda a lo largo de X) */}
      <group position={[0, AX + 0.22, zT]} rotation-z={-Math.PI / 2}>
        <mesh geometry={geoTambor} material={matPapel} />
        <mesh geometry={geoTinta} material={matTinta} renderOrder={2} />
        <mesh geometry={cilindro(R + 0.01, R + 0.01, 0.02, 48)} material={m.aluminio} position={[0, LONG / 2, 0]} />
        <mesh geometry={cilindro(R + 0.01, R + 0.01, 0.02, 48)} material={m.aluminio} position={[0, -LONG / 2, 0]} />
      </group>
      {/* poste, brazo con pluma y masa inercial */}
      <mesh geometry={cilindro(0.07, 0.09, AX, 14)} material={m.acero} position={[0, 0.22 + AX / 2, zPivote]} castShadow />
      <mesh geometry={cilindro(0.11, 0.11, 0.05, 16)} material={m.aluminio} position={[0, 0.22 + AX + 0.025, zPivote]} />
      <group ref={penRef} position={[0, AX + 0.22, zPivote]}>
        <mesh geometry={cajaRedondeada(0.045, 0.045, BRAZO, 0.01, 1)} material={m.aluminio} position={[0, 0, -BRAZO / 2]} />
        <mesh geometry={cilindro(0.004, 0.022, 0.12, 8)} material={m.acero} rotation-x={-Math.PI / 2} position={[0, 0, -BRAZO - 0.03]} />
        <mesh geometry={esfera(0.025, 8)} material={matPluma} position={[0, 0, -BRAZO - 0.09]} />
      </group>
      <group ref={masaRef} position={[0, AX + 0.22, zPivote]}>
        <mesh geometry={cajaRedondeada(0.04, 0.04, 0.5, 0.01, 1)} material={m.aluminio} position={[0, 0, 0.25]} />
        <mesh geometry={cilindro(0.2, 0.2, 0.34, 24)} material={m.laton} position={[0, -0.02, 0.52]} castShadow />
      </group>
      {/* placa frontal */}
      <Etiqueta modo="plano" texto={titulo} color="#101820" fondo="#e8edf0" peso={700} tamano={0.26} ancla={[0.5, 0.5]} position={[0, 0.11, 1.955]} />
      <Etiqueta modo="plano" texto={dB === 0 ? `Mw ${magnitud.toFixed(1)}  ·  sin atenuador` : `Mw ${magnitud.toFixed(1)}  ·  atenuador ${dB} dB`} color="#ffffff" fondo="rgba(16,24,32,0.92)" peso={700} tamano={0.3} ancla={[0.5, 0]} position={[0, AX + R + 0.55, zT + 0.2]} />
    </group>
  );
}

// ───────────────────────────── ciudad en maqueta ─────────────────────────────

function texFachada() {
  return texturaCompartida('mat03-fachada', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d9d4c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6f8591';
    const rnd = azar(9);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      ctx.fillStyle = rnd() > 0.88 ? '#e9dca4' : '#647b88';
      ctx.fillRect(i * 32 + 6, j * 32 + 7, 20, 18);
    }
  }, { repetir: [1, 1] });
}

interface Bloque { x: number; z: number; w: number; d: number; h: number; tono: number }
const BLOQUES: Bloque[] = (() => {
  const out: Bloque[] = [];
  const rnd = azar(2024);
  const cols = [-5.8, -4.3, -2.8, -1.3, 1.3, 2.8, 4.3, 5.8];
  const filas = [-5.2, -3.5];
  filas.forEach((z, fi) => {
    cols.forEach((x, ci) => {
      const r = rnd();
      out.push({ x: x + (rnd() - 0.5) * 0.2, z: z + (rnd() - 0.5) * 0.15, w: 0.8 + rnd() * 0.45, d: 0.8 + rnd() * 0.35, h: (fi === 0 ? 1.4 : 0.9) + r * (fi === 0 ? 2.4 : 1.4), tono: rnd() });
    });
  });
  // laterales, junto al epicentro
  [[-5.4, -2.2], [-3.6, -1.5], [3.6, -1.5], [5.4, -2.2], [-6.4, -2.6], [6.4, -2.6]].forEach(([x, z]) => {
    out.push({ x, z, w: 0.9 + rnd() * 0.3, d: 0.9, h: 0.8 + rnd() * 1.1, tono: rnd() });
  });
  return out;
})();
export const EPICENTRO: [number, number] = [0, -1.8];

/** Maqueta sobria de ciudad; oscila con el registro y llega la onda según la distancia. */
export function Ciudad({ magnitud }: { magnitud: number }) {
  const m = useMateriales();
  const fachada = texFachada();
  const refs = useRef<(THREE.Group | null)[]>([]);
  const matBloque = useMemo(() => BLOQUES.map((b) => {
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.1, 0.1, 0.78 + b.tono * 0.12), map: fachada, roughness: 0.8 });
    return mat;
  }), [fachada]);
  useEffect(() => () => matBloque.forEach((x) => x.dispose()), [matBloque]);
  const geos = useMemo(() => BLOQUES.map((b) => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d);
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    // las ventanas conservan su tamaño real: se escalan las UV con el tamaño de cada cara
    const nor = g.getAttribute('normal') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
      const su = nx > 0.5 ? b.d : b.w;
      if (ny > 0.5) uv.setXY(i, 0, 0); else uv.setXY(i, uv.getX(i) * su * 1.6, uv.getY(i) * b.h * 1.6);
    }
    return g;
  }), []);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  const s = sacudida(magnitud);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    BLOQUES.forEach((b, i) => {
      const g = refs.current[i]; if (!g) return;
      const dist = Math.hypot(b.x - EPICENTRO[0], b.z - EPICENTRO[1]);
      const tc = ((t - dist * 0.07) % CICLO + CICLO) % CICLO;
      const v = senalSismica(tc);
      g.position.x = b.x + v * s * 0.8;
      g.rotation.z = -v * s * 0.35 / Math.max(0.8, b.h * 0.5) * (magnitud > 7 ? 1.4 : 1);
    });
  });
  return (
    <group>
      {BLOQUES.map((b, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} position={[b.x, 0, b.z]}>
          <mesh geometry={geos[i]} material={matBloque[i]} position={[0, b.h / 2, 0]} castShadow receiveShadow />
          <mesh geometry={cajaRedondeada(b.w + 0.04, 0.05, b.d + 0.04, 0.01, 1)} material={m.carcasaClara} position={[0, b.h + 0.02, 0]} />
        </group>
      ))}
    </group>
  );
}

/** Ondas que salen del epicentro cuando llega el evento (anillos planos que se expanden). */
export function OndasEpicentro({ magnitud }: { magnitud: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(() => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: '#c8323c', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })), []);
  useEffect(() => () => mats.forEach((x) => x.dispose()), [mats]);
  const geo = useGeo(() => new THREE.RingGeometry(0.97, 1, 96), []);
  useFrame((st) => {
    const tc = st.clock.elapsedTime % CICLO;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const d = tc - (T_P - 0.2) - i * 0.55;
      const vivo = d > 0 && d < 3.2;
      mesh.visible = vivo;
      if (vivo) { const r = 0.4 + d * 3.1; mesh.scale.set(r, r, 1); mats[i].opacity = (1 - d / 3.2) * (0.35 + 0.05 * Math.min(8, magnitud)); }
    });
  });
  return (
    <group position={[EPICENTRO[0], 0.03, EPICENTRO[1]]} rotation-x={-Math.PI / 2}>
      {mats.map((mat, i) => <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mat} />)}
    </group>
  );
}
