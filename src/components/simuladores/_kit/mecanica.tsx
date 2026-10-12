'use client';
/**
 * _kit/mecanica.tsx — resorte helicoidal, pesas ranuradas y portapesas, flechas de
 * fuerza, polea, cuerda y bloque.
 *
 * ResorteHelicoidal: la geometría (número de vértices) depende sólo de espiras,
 * radio y grosor. La LONGITUD se escribe en el sitio sobre el mismo búfer (posición
 * y normal analíticas de la hélice), así que estirarlo no crea geometría. Para
 * animarlo a 60 fps sin re-renderizar React, pasa `longitudRef` (un ref numérico):
 * se lee en useFrame y sólo se reescribe si cambió.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { mm, type P2 } from './perfiles';
import { geoCache, tornear, cilindro, toro, extruir, tuboPolilinea, cajaRedondeada } from './geometria';
import { useMateriales } from './materiales';
import { familiaTexto, useTexturaLienzo } from './texturas';
import { Etiqueta } from './texto';
import { dimensionesPesa } from './calculos';

type GroupProps = ThreeElements['group'];
type V3 = [number, number, number];

// ───────────────────────────── resorte ─────────────────────────────

export interface PropsResorte extends GroupProps {
  /** longitud de la parte helicoidal (u) */
  longitud?: number;
  espiras?: number;
  /** radio medio de la hélice (u) */
  radio?: number;
  /** radio del alambre (u) */
  grosor?: number;
  ganchos?: boolean;
  color?: string;
  /** ref numérico para animar la longitud sin re-render */
  longitudRef?: React.MutableRefObject<number>;
  segmentosPorEspira?: number;
}

const RADIALES = 8;

function escribirHelice(g: THREE.BufferGeometry, L: number, n: number, R: number, a: number, spe: number) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const nor = g.getAttribute('normal') as THREE.BufferAttribute;
  const P = pos.array as Float32Array, N = nor.array as Float32Array;
  const filas = n * spe + 1;
  const c = L / (2 * Math.PI * n);
  const s = Math.hypot(R, c) || 1;
  let k = 0;
  for (let i = 0; i < filas; i++) {
    const th = (i / spe) * Math.PI * 2;
    const ct = Math.cos(th), st = Math.sin(th);
    const px = R * ct, py = -c * th, pz = R * st;
    // marco analítico: N hacia el eje, B = T × N
    const nx = -ct, ny = 0, nz = -st;
    const bx = (c * st) / s, by = -R / s, bz = (-c * ct) / s;
    for (let j = 0; j < RADIALES; j++) {
      const f = (j / RADIALES) * Math.PI * 2;
      const cf = Math.cos(f), sf = Math.sin(f);
      const ox = cf * nx + sf * bx, oy = cf * ny + sf * by, oz = cf * nz + sf * bz;
      N[k] = ox; N[k + 1] = oy; N[k + 2] = oz;
      P[k] = px + a * ox; P[k + 1] = py + a * oy; P[k + 2] = pz + a * oz;
      k += 3;
    }
  }
  pos.needsUpdate = true; nor.needsUpdate = true;
  if (!g.boundingSphere) g.boundingSphere = new THREE.Sphere();
  g.boundingSphere.center.set(0, -L / 2, 0); g.boundingSphere.radius = Math.hypot(L / 2, R + a);
}

/** Resorte helicoidal que cuelga desde el origen hacia −Y. */
export function ResorteHelicoidal({
  longitud = 1.5, espiras = 18, radio = 0.12, grosor = 0.012, ganchos = true, color, longitudRef, segmentosPorEspira = 20, ...g
}: PropsResorte) {
  const m = useMateriales();
  const n = Math.max(1, Math.round(espiras));
  const spe = Math.max(8, segmentosPorEspira);
  const geo = useMemo(() => {
    const filas = n * spe + 1;
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filas * RADIALES * 3), 3));
    gg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(filas * RADIALES * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < filas - 1; i++) for (let j = 0; j < RADIALES; j++) {
      const j2 = (j + 1) % RADIALES;
      const A = i * RADIALES + j, B = i * RADIALES + j2, C = (i + 1) * RADIALES + j, D = (i + 1) * RADIALES + j2;
      idx.push(A, C, B, B, C, D); // (C−A)×(B−A) = T×B = −N → hacia fuera del alambre
    }
    gg.setIndex(idx);
    return gg;
  }, [n, spe]);
  useEffect(() => () => geo.dispose(), [geo]);
  const ultima = useRef(-1);
  const grupoAbajo = useRef<THREE.Group>(null);
  const aplicar = (L: number) => {
    if (Math.abs(L - ultima.current) < 1e-6) return;
    ultima.current = L;
    escribirHelice(geo, L, n, radio, grosor, spe);
    if (grupoAbajo.current) grupoAbajo.current.position.y = -L;
  };
  useLayoutEffect(() => { ultima.current = -1; aplicar(longitudRef ? longitudRef.current : longitud); }); // cada render
  useFrame(() => { if (longitudRef) aplicar(longitudRef.current); });
  const thE = 2 * Math.PI * n;
  const geoOjal = useMemo(() => geoCache(`ojalResorte:${radio}:${grosor}`, () => {
    // del extremo de la espira al eje y un ojal cerrado encima
    const pts: number[] = [radio, 0, 0, radio * 0.55, grosor * 2.5, 0, 0.0, grosor * 4, 0];
    const r = radio * 0.75, cy = grosor * 4 + r;
    for (let i = 1; i <= 26; i++) { const a = -Math.PI / 2 + (i / 26) * Math.PI * 1.85; pts.push(r * Math.cos(a), cy + r * Math.sin(a), 0); }
    return tuboPolilinea(new Float32Array(pts), grosor, 8, true);
  }), [radio, grosor]);
  const mat = color ? m.pintura(color) : m.acero;
  return (
    <group {...g}>
      <mesh geometry={geo} material={mat} castShadow />
      {ganchos && (
        <>
          <mesh geometry={geoOjal} material={mat} castShadow />
          <group ref={grupoAbajo} position={[0, -longitud, 0]}>
            <mesh geometry={geoOjal} material={mat} rotation={[Math.PI, -thE, 0, 'YXZ']} castShadow />
          </group>
        </>
      )}
    </group>
  );
}
/** Distancia del extremo del ojal al final de la hélice (para enganchar piezas). */
export const resorteLargoOjal = (radio = 0.12, grosor = 0.012) => grosor * 4 + radio * 1.5;

// ───────────────────────────── pesas ranuradas ─────────────────────────────


function formaRanurada(R: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  const a0 = Math.asin(h / R);
  s.moveTo(Math.sqrt(R * R - h * h), h);
  s.absarc(0, 0, R, a0, Math.PI * 2 - a0, false);
  s.lineTo(0, -h);
  s.absarc(0, 0, h, -Math.PI / 2, -Math.PI * 1.5, true);
  s.lineTo(Math.sqrt(R * R - h * h), h);
  return s;
}

/** Pesa ranurada (disco con ranura hacia +X), apoyada en y = 0. */
export function PesaRanurada({ gramos = 100, material = 'laton', rotulo = true, ...g }: GroupProps & { gramos?: number; material?: 'laton' | 'hierro'; rotulo?: boolean }) {
  const m = useMateriales();
  const { diametro, espesor } = dimensionesPesa(gramos, material);
  const geo = useMemo(() => geoCache(`pesa:${gramos}:${material}`, () => {
    const gg = extruir(formaRanurada(diametro / 2, mm(4.5)), espesor, 40);
    gg.rotateX(-Math.PI / 2);
    return gg;
  }), [gramos, material, diametro, espesor]);
  const tex = useTexturaLienzo(256, 128, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(40,30,10,0.85)'; ctx.font = `700 ${H * 0.5}px ${familiaTexto()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${gramos} g`, W / 2, H / 2);
  }, [gramos]);
  const matRot = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, roughness: 0.6, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -1 }), [tex]);
  useEffect(() => () => matRot.dispose(), [matRot]);
  const mt = material === 'laton' ? m.laton : m.pintura('#5d6770');
  return (
    <group {...g}>
      <mesh geometry={geo} material={mt} castShadow receiveShadow />
      {rotulo && (
        <mesh material={matRot} rotation-x={-Math.PI / 2} position={[-diametro * 0.22, espesor + 0.0006, 0]}>
          <planeGeometry args={[diametro * 0.5, diametro * 0.25]} />
        </mesh>
      )}
    </group>
  );
}


export const PORTAPESAS = { largoVastago: 1.2, espesorBase: mm(4), diametroBase: 0.46 };
/** Portapesas con vástago y gancho; origen en el punto de cuelgue (arriba). Apila `masas` (g). */
export function Portapesas({ masas = [], material = 'laton', ...g }: GroupProps & { masas?: number[]; material?: 'laton' | 'hierro' }) {
  const m = useMateriales();
  const P = PORTAPESAS;
  const yBase = -P.largoVastago;
  let y = yBase + P.espesorBase;
  const pila = masas.map((gramos, i) => {
    const e = dimensionesPesa(gramos, material).espesor;
    const el = <PesaRanurada key={i} gramos={gramos} material={material} rotulo={i === masas.length - 1} position={[0, y, 0]} rotation-y={i % 2 ? Math.PI * 0.85 : 0} />;
    y += e;
    return el;
  });
  const geoGancho = useMemo(() => geoCache('ganchoPortapesas', () => {
    // vástago por el eje y un ojal abierto cuya cara interior superior es el origen
    const r = 0.035, cy = -r - mm(1.6);
    const pts: number[] = [0, -0.13, 0, 0, cy - r, 0];
    for (let i = 1; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI * 1.75; pts.push(r * Math.cos(a), cy + r * Math.sin(a), 0); }
    return tuboPolilinea(new Float32Array(pts), mm(1.6), 8, true);
  }), []);
  const largoVarilla = P.largoVastago - 0.13;
  return (
    <group {...g}>
      <mesh geometry={geoGancho} material={m.acero} castShadow />
      <mesh geometry={cilindro(mm(2.2), mm(2.2), largoVarilla, 12)} material={m.acero} position={[0, yBase + largoVarilla / 2, 0]} castShadow />
      <mesh geometry={cilindro(P.diametroBase / 2, P.diametroBase / 2, P.espesorBase, 40)} material={m.acero} position={[0, yBase + P.espesorBase / 2, 0]} castShadow receiveShadow />
      {pila}
    </group>
  );
}

// ───────────────────────────── flecha de fuerza ─────────────────────────────

export type TipoFuerza = 'peso' | 'normal' | 'tension' | 'friccion' | 'aplicada' | 'resultante' | 'elastica' | 'velocidad' | 'aceleracion' | 'componente';
export const COLORES_FUERZA: Record<TipoFuerza, string> = {
  peso: '#d32f2f', normal: '#1565c0', tension: '#6a1b9a', friccion: '#ef6c00', aplicada: '#2e7d32',
  resultante: '#212121', elastica: '#00897b', velocidad: '#0097a7', aceleracion: '#c2185b', componente: '#78909c',
};

export interface PropsFlecha extends GroupProps {
  /** vector (en N, m/s…) — su módulo × escala = longitud dibujada */
  vector: V3;
  escala?: number;
  tipo?: TipoFuerza;
  color?: string;
  etiqueta?: string;
  grosor?: number;
  siempreVisible?: boolean;
  /** discontinua (componentes) */
  discontinua?: boolean;
}
const EJE_Y = new THREE.Vector3(0, 1, 0);
/** Flecha 3D desde el origen del grupo en la dirección del vector. */
export function FlechaFuerza({ vector, escala = 0.1, tipo = 'aplicada', color, etiqueta, grosor = 0.035, siempreVisible = false, discontinua = false, ...g }: PropsFlecha) {
  const m = useMateriales();
  const col = color ?? COLORES_FUERZA[tipo];
  const mat = useMemo(() => {
    const mt = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.05, depthTest: !siempreVisible, transparent: siempreVisible });
    return mt;
  }, [col, siempreVisible]);
  useEffect(() => () => mat.dispose(), [mat]);
  const L = Math.hypot(vector[0], vector[1], vector[2]) * escala;
  const q = useMemo(() => {
    const d = new THREE.Vector3(...vector);
    if (d.lengthSq() < 1e-12) return new THREE.Quaternion();
    return new THREE.Quaternion().setFromUnitVectors(EJE_Y, d.normalize());
  }, [vector[0], vector[1], vector[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  if (L < 1e-4) return null;
  const cabeza = Math.min(L * 0.4, grosor * 5);
  const cuerpo = Math.max(0.0001, L - cabeza);
  const trozos = discontinua ? Math.max(2, Math.round(cuerpo / (grosor * 5))) : 1;
  const ro = siempreVisible ? 30 : 0;
  void m;
  return (
    <group {...g}>
      <group quaternion={q}>
        {Array.from({ length: trozos }, (_, i) => {
          const l = cuerpo / trozos;
          const h = discontinua ? l * 0.6 : l;
          return <mesh key={i} geometry={cilindro(1, 1, 1, 12)} material={mat} scale={[grosor, h, grosor]} position={[0, i * l + h / 2, 0]} castShadow={!siempreVisible} renderOrder={ro} />;
        })}
        <mesh geometry={geoCache('conoFlecha', () => new THREE.ConeGeometry(1, 1, 20))} material={mat} scale={[grosor * 2.4, cabeza, grosor * 2.4]} position={[0, cuerpo + cabeza / 2, 0]} castShadow={!siempreVisible} renderOrder={ro} />
      </group>
      {etiqueta && (
        <Etiqueta texto={etiqueta} color={col} fondo="rgba(255,255,255,0.88)" tamano={Math.max(0.09, grosor * 3.2)} siempreVisible={siempreVisible}
          position={[(vector[0] * escala / L) * (L + grosor * 5), (vector[1] * escala / L) * (L + grosor * 5), (vector[2] * escala / L) * (L + grosor * 5)]} />
      )}
    </group>
  );
}

// ───────────────────────────── polea y cuerda ─────────────────────────────

export interface PropsPolea extends GroupProps {
  radio?: number;
  /** ángulo de giro (rad) o velocidad angular (rad/s) si `girando` */
  angulo?: number;
  velocidadAngular?: number;
  conSoporte?: boolean;
}
/** Polea de aluminio con garganta, rayos y horquilla. Origen en el eje; rueda en el plano XY (eje +Z). */
export function Polea({ radio = 0.25, angulo = 0, velocidadAngular = 0, conSoporte = true, ...g }: PropsPolea) {
  const m = useMateriales();
  const rueda = useRef<THREE.Group>(null);
  const ancho = Math.max(0.06, radio * 0.28);
  const geoLlanta = useMemo(() => geoCache(`llantaPolea:${radio}`, () => {
    const R = radio, w = ancho / 2, gar = Math.min(radio * 0.18, mm(6));
    const p: P2[] = [
      [R * 0.78, -w * 0.8], [R - 0.004, -w], [R + 0.003, -w * 0.92], [R + 0.003, -w * 0.55],
      [R - gar * 0.6, -w * 0.3], [R - gar, 0], [R - gar * 0.6, w * 0.3], [R + 0.003, w * 0.55],
      [R + 0.003, w * 0.92], [R - 0.004, w], [R * 0.78, w * 0.8], [R * 0.78, -w * 0.8],
    ];
    const geo = tornear(p, 56); geo.rotateX(Math.PI / 2); // antihorario en (r, y); eje → +Z
    return geo;
  }), [radio, ancho]);
  const geoAlma = useMemo(() => geoCache(`almaPolea:${radio}`, () => {
    const s = new THREE.Shape(); s.absarc(0, 0, radio * 0.8, 0, Math.PI * 2, false);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, rc = radio * 0.5;
      const h = new THREE.Path(); h.absarc(Math.cos(a) * rc, Math.sin(a) * rc, radio * 0.17, 0, Math.PI * 2, true); s.holes.push(h);
    }
    const h0 = new THREE.Path(); h0.absarc(0, 0, mm(3), 0, Math.PI * 2, true); s.holes.push(h0);
    const geo = extruir(s, ancho * 0.35, 40); geo.translate(0, 0, -ancho * 0.175);
    return geo;
  }), [radio, ancho]);
  useFrame((_, dt) => {
    if (!rueda.current) return;
    if (velocidadAngular) rueda.current.rotation.z -= velocidadAngular * Math.min(dt, 0.05);
    else rueda.current.rotation.z = -angulo;
  });
  return (
    <group {...g}>
      <group ref={rueda}>
        <mesh geometry={geoLlanta} material={m.aluminio} castShadow receiveShadow />
        <mesh geometry={geoAlma} material={m.aluminio} castShadow />
        <mesh geometry={cilindro(radio * 0.16, radio * 0.16, ancho * 0.9, 24)} material={m.aluminio} rotation-x={Math.PI / 2} />
      </group>
      <mesh geometry={cilindro(mm(3), mm(3), ancho * 2.1, 12)} material={m.acero} rotation-x={Math.PI / 2} />
      {conSoporte && (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} material={m.pintura('#3b4148')} position={[0, -radio * 0.55, s * (ancho / 2 + 0.03)]} castShadow>
              <boxGeometry args={[radio * 0.4, radio * 1.3, 0.025]} />
            </mesh>
          ))}
          <mesh material={m.pintura('#3b4148')} position={[0, -radio * 1.2, 0]} castShadow><boxGeometry args={[radio * 0.4, 0.05, ancho + 0.085]} /></mesh>
          <mesh geometry={cilindro(mm(6), mm(6), 0.8, 16)} material={m.acero} position={[0, -radio * 1.2 - 0.4, 0]} castShadow />
        </group>
      )}
    </group>
  );
}

/** Cuerda recta entre dos puntos (cilindro unitario orientado: no se regenera). */
export function Cuerda({ desde, hasta, grosor = mm(1.2), color = '#e9e2cf' }: { desde: V3; hasta: V3; grosor?: number; color?: string }) {
  const m = useMateriales();
  const { pos, q, L } = useMemo(() => {
    const a = new THREE.Vector3(...desde), b = new THREE.Vector3(...hasta);
    const d = b.clone().sub(a);
    const L2 = d.length();
    return { pos: a.add(b).multiplyScalar(0.5).toArray() as V3, q: new THREE.Quaternion().setFromUnitVectors(EJE_Y, L2 > 0 ? d.normalize() : EJE_Y.clone()), L: L2 };
  }, [desde[0], desde[1], desde[2], hasta[0], hasta[1], hasta[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return <mesh geometry={cilindro(1, 1, 1, 8)} material={m.plastico(color, 0.9)} position={pos} quaternion={q} scale={[grosor, L, grosor]} castShadow />;
}

/** Tramo de cuerda abrazando una polea (arco de la garganta) en el plano XY. */
export function CuerdaEnPolea({ radio = 0.25, desde = 0, hasta = Math.PI, grosor = mm(1.2), color = '#e9e2cf', ...g }: GroupProps & { radio?: number; desde?: number; hasta?: number; grosor?: number; color?: string }) {
  const m = useMateriales();
  const gar = Math.min(radio * 0.18, mm(6));
  return (
    <group {...g}>
      <mesh geometry={toro(radio - gar + grosor, grosor, 6, 48, hasta - desde)} material={m.plastico(color, 0.9)} rotation-z={desde} castShadow />
    </group>
  );
}

/** Bloque de madera con armella (planos inclinados, fricción). Apoyado en y = 0. */
export function Bloque({ ancho = 0.8, alto = 0.4, fondo = 0.5, armella = true, color, ...g }: GroupProps & { ancho?: number; alto?: number; fondo?: number; armella?: boolean; color?: string }) {
  const m = useMateriales();
  const mat = color ? m.pintura(color) : m.madera;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(ancho, alto, fondo, 0.02, 2)} material={mat} position={[0, alto / 2, 0]} castShadow receiveShadow />
      {armella && (
        <group position={[ancho / 2, alto / 2, 0]}>
          <mesh geometry={cilindro(mm(1.5), mm(1.5), 0.06, 8)} material={m.acero} rotation-z={Math.PI / 2} position={[0.03, 0, 0]} />
          <mesh geometry={toro(0.035, mm(1.5), 6, 16)} material={m.acero} position={[0.095, 0, 0]} />
        </group>
      )}
    </group>
  );
}
