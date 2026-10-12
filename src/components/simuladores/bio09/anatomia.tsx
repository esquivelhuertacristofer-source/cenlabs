'use client';
/**
 * bio09/anatomia.tsx — órganos del aparato digestivo y corte de la pared de cada uno.
 *
 * Modelo de láminas anatómicas (vista anterior, derecha del paciente a la izquierda):
 * boca con glándula salival, esófago, hígado con vesícula biliar, estómago, páncreas,
 * intestino delgado (asas) e intestino grueso (con haustras).
 *
 * Honestidad: el modelo NO indica dónde actúa cada enzima ni dónde se absorbe. El único
 * resalte es la elección del alumno, y el corte de pared muestra el órgano que él elige
 * (vellosidades, pliegues, criptas…): de ahí saca sus propias conclusiones.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { geoCache, Etiqueta, texturaCompartida, azar } from '../_kit';

type V3 = [number, number, number];
type GroupProps = ThreeElements['group'];
export type Organo = 'boca' | 'estomago' | 'delgado' | 'grueso';

const esf = () => geoCache('bio09:esf', () => new THREE.SphereGeometry(1, 28, 20));

function tubo(pts: V3[], radio: number, seg = 90, radiales = 12) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal'), seg, radio, radiales, false);
}

// ───────────────────────────── trayectos ─────────────────────────────

const RUTA_ESOFAGO: V3[] = [[0, 3.75, 0], [0, 2.7, 0.02], [-0.1, 1.9, 0.05], [0.0, 1.35, 0.08]];
const RUTA_PILORO: V3[] = [[0.8, 0.0, 0.1], [0.2, -0.45, 0.1], [-0.55, -0.62, 0.08], [-0.85, -0.85, 0.06]];
const RUTA_COLEDOCO: V3[] = [[-0.7, 0.62, 0.3], [-0.78, 0.0, 0.2], [-0.8, -0.7, 0.1]];
const RUTA_DUCTO_PAROTIDA: V3[] = [[-1.55, 3.85, 0.1], [-1.0, 4.05, 0.2], [-0.5, 4.3, 0.3]];

function rutaDelgado(): V3[] {
  const pts: V3[] = [[-0.85, -0.85, 0.06], [-1.15, -1.2, 0.08], [-0.9, -1.55, 0.1]];
  const filas = [-1.9, -2.3, -2.7, -3.1, -3.5, -3.9];
  filas.forEach((y, i) => {
    const dir = i % 2 === 0 ? 1 : -1, x0 = -1.3 * dir, x1 = 1.3 * dir;
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI * 3 + i) * 0.12, 0.1 + 0.05 * Math.sin(t * 5 + i)]); }
  });
  return pts;
}
const RUTA_GRUESO: V3[] = [
  [-1.95, -4.05, 0.05], [-2.0, -3.2, 0.04], [-2.0, -2.2, 0.04], [-1.95, -1.4, 0.05], [-1.6, -1.1, 0.08], [-0.8, -1.2, 0.1],
  [0.2, -1.32, 0.1], [1.2, -1.2, 0.08], [1.85, -1.1, 0.06], [2.0, -1.9, 0.04], [2.0, -2.9, 0.04], [1.9, -3.7, 0.05],
  [1.3, -4.1, 0.07], [0.7, -3.95, 0.08], [0.45, -4.45, 0.07], [0.45, -5.0, 0.06],
];

// ───────────────────────────── materiales ─────────────────────────────

function useMatsOrganos(sel: Organo | null) {
  const m = useMemo(() => {
    const mk = (color: string, o: Organo | null, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.45, emissive: sel && o === sel ? '#ffb347' : '#000000', emissiveIntensity: sel && o === sel ? 0.28 : 0, ...extra });
    return {
      boca: mk('#c9505e', 'boca'), lengua: mk('#e2828f', 'boca'), diente: mk('#f6f3ea', 'boca', { clearcoat: 0.6 }),
      esofago: mk('#c97c6c', null), estomago: mk('#e0907f', 'estomago'),
      higado: mk('#7d2f27', null, { roughness: 0.4 }), vesicula: mk('#6aa84f', null), pancreas: mk('#e6c47a', null, { roughness: 0.6 }),
      salival: mk('#e5bb73', 'boca', { roughness: 0.6 }),
      delgado: mk('#eaa08a', 'delgado'), grueso: mk('#c47a6b', 'grueso'), haustra: mk('#a9604f', 'grueso'),
    };
  }, [sel]);
  useEffect(() => () => { Object.values(m).forEach((x) => x.dispose()); }, [m]);
  return m;
}

// ───────────────────────────── el aparato digestivo ─────────────────────────────

/** Tubo con rebordes (haustras) sobre una ruta: los anillos siguen la curva. */
function Haustras({ pts, radio, material }: { pts: V3[]; radio: number; material: THREE.Material }) {
  const anillos = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const n = Math.round(c.getLength() / 0.42);
    const eje = new THREE.Vector3(0, 0, 1);
    return Array.from({ length: n }, (_, i) => {
      const u = (i + 0.5) / n;
      const p = c.getPointAt(u), t = c.getTangentAt(u);
      return { pos: p, quat: new THREE.Quaternion().setFromUnitVectors(eje, t) };
    });
  }, [pts]);
  const g = geoCache('bio09:haustra', () => new THREE.TorusGeometry(1, 0.14, 8, 22));
  return <>{anillos.map((a, i) => <mesh key={i} geometry={g} material={material} position={a.pos} quaternion={a.quat} scale={[radio * 1.02, radio * 1.02, radio * 1.02]} />)}</>;
}

export interface PropsAparato extends GroupProps { seleccion: Organo | null }
export function AparatoDigestivo({ seleccion, ...g }: PropsAparato) {
  const m = useMatsOrganos(seleccion);
  const geos = useMemo(() => ({
    esofago: tubo(RUTA_ESOFAGO, 0.21), piloro: tubo(RUTA_PILORO, 0.27), coledoco: tubo(RUTA_COLEDOCO, 0.05, 30, 8), parotida: tubo(RUTA_DUCTO_PAROTIDA, 0.035, 30, 8),
    delgado: tubo(rutaDelgado(), 0.2, 260), grueso: tubo(RUTA_GRUESO, 0.33, 200, 14),
  }), []);
  useEffect(() => () => { Object.values(geos).forEach((x) => x.dispose()); }, [geos]);
  const dientes = useMemo(() => Array.from({ length: 9 }, (_, i) => -0.8 + i * 0.2), []);
  return (
    <group {...g}>
      {/* boca: cavidad, labios, dientes y lengua */}
      <mesh geometry={esf()} material={m.boca} position={[0, 4.2, -0.05]} scale={[1.2, 0.62, 0.55]} castShadow />
      <mesh geometry={geoCache('bio09:labio', () => new THREE.TorusGeometry(1, 0.17, 14, 40))} material={m.lengua} position={[0, 4.2, 0.4]} scale={[1.28, 0.7, 1]} />
      {dientes.map((x) => (
        <group key={x}>
          <mesh geometry={geoCache('bio09:diente', () => new THREE.BoxGeometry(0.17, 0.2, 0.1))} material={m.diente} position={[x, 4.38, 0.4 - Math.abs(x) * 0.08]} />
          <mesh geometry={geoCache('bio09:diente', () => new THREE.BoxGeometry(0.17, 0.2, 0.1))} material={m.diente} position={[x, 4.04, 0.4 - Math.abs(x) * 0.08]} />
        </group>
      ))}
      <mesh geometry={esf()} material={m.lengua} position={[0, 4.12, 0.12]} scale={[0.82, 0.2, 0.42]} />
      <mesh geometry={esf()} material={m.salival} position={[-1.55, 3.85, 0.05]} scale={[0.4, 0.55, 0.3]} rotation={[0, 0, 0.3]} castShadow />
      <mesh geometry={geos.parotida} material={m.salival} />
      {/* esófago y estómago */}
      <mesh geometry={geos.esofago} material={m.esofago} castShadow />
      <mesh geometry={esf()} material={m.estomago} position={[0.55, 0.7, 0.1]} scale={[1.1, 0.8, 0.62]} rotation={[0, 0, 0.55]} castShadow />
      <mesh geometry={esf()} material={m.estomago} position={[-0.15, 1.2, 0.1]} scale={[0.5, 0.5, 0.45]} castShadow />
      <mesh geometry={geos.piloro} material={m.estomago} castShadow />
      {/* hígado, vesícula y páncreas */}
      <mesh geometry={esf()} material={m.higado} position={[-1.35, 1.35, 0.0]} scale={[1.9, 0.95, 0.62]} rotation={[0, 0, -0.22]} castShadow />
      <mesh geometry={esf()} material={m.vesicula} position={[-0.75, 0.62, 0.34]} scale={[0.17, 0.33, 0.17]} rotation={[0, 0, 0.1]} />
      <mesh geometry={geos.coledoco} material={m.vesicula} />
      <mesh geometry={esf()} material={m.pancreas} position={[0.4, -0.9, -0.02]} scale={[1.5, 0.2, 0.22]} rotation={[0, 0, 0.12]} castShadow />
      {/* intestinos */}
      <mesh geometry={geos.delgado} material={m.delgado} castShadow />
      <mesh geometry={geos.grueso} material={m.grueso} castShadow />
      <Haustras pts={RUTA_GRUESO} radio={0.33} material={m.haustra} />
      <mesh geometry={geoCache('bio09:apendice', () => new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8))} material={m.grueso} position={[-1.7, -4.25, 0.05]} rotation={[0, 0, 0.9]} />
    </group>
  );
}

// ───────────────────────────── corte de la pared ─────────────────────────────

function texPared(clave: string, pinta: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  return texturaCompartida(clave, 256, 256, pinta, {});
}

/** Perfil de la mucosa (x de −1.6 a 1.6, y de −0.9 a la superficie). */
function perfilMucosa(tipo: Exclude<Organo, 'delgado'>): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.6, -0.9);
  s.lineTo(1.6, -0.9);
  if (tipo === 'estomago') {
    // pliegues (rugosidades) de la mucosa gástrica
    s.lineTo(1.6, -0.2);
    for (let i = 0; i <= 64; i++) { const x = 1.6 - (3.2 * i) / 64; s.lineTo(x, -0.2 + 0.34 * Math.pow(Math.abs(Math.sin(x * 1.6 + 0.4)), 0.8)); }
  } else if (tipo === 'grueso') {
    // mucosa lisa con criptas rectas (sin vellosidades)
    s.lineTo(1.6, 0.1);
    const n = 12, w = 3.2 / n;
    for (let i = 0; i < n; i++) {
      const x1 = 1.6 - i * w, x2 = x1 - w * 0.62, x3 = x1 - w * 0.78, x4 = x1 - w;
      s.lineTo(x1, 0.1); s.lineTo(x2, 0.1); s.lineTo(x2 - 0.01, -0.45); s.lineTo(x3 + 0.01, -0.45); s.lineTo(x3, 0.1); s.lineTo(x4, 0.1);
    }
  } else {
    // boca: epitelio plano estratificado (superficie lisa)
    s.lineTo(1.6, -0.15);
    s.lineTo(-1.6, -0.15);
  }
  s.lineTo(-1.6, -0.9);
  return s;
}

function Capas({ tipo }: { tipo: Exclude<Organo, 'delgado'> }) {
  const geo = useMemo(() => new THREE.ExtrudeGeometry(perfilMucosa(tipo), { depth: 0.9, bevelEnabled: false, curveSegments: 6 }), [tipo]);
  const tex = texPared('bio09:pared:' + tipo, (ctx, w, h) => {
    const rnd = azar(tipo === 'estomago' ? 3 : tipo === 'grueso' ? 5 : 8);
    ctx.fillStyle = tipo === 'boca' ? '#e9a5ad' : tipo === 'estomago' ? '#e59b8b' : '#d8a191'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(160,70,70,0.22)' : 'rgba(255,230,225,0.25)';
      ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 2 + rnd() * 5, 0, 6.283); ctx.fill();
    }
  });
  const matMucosa = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }), [tex]);
  const matSub = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2d9cb', roughness: 0.8 }), []);
  const matMus = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b95c52', roughness: 0.7 }), []);
  useEffect(() => () => { geo.dispose(); matMucosa.dispose(); matSub.dispose(); matMus.dispose(); }, [geo, matMucosa, matSub, matMus]);
  return (
    <group position={[0, -0.2, -0.45]}>
      <mesh geometry={geo} material={matMucosa} />
      <mesh material={matSub} position={[0, -1.08, 0.45]}><boxGeometry args={[3.2, 0.3, 0.9]} /></mesh>
      <mesh material={matMus} position={[0, -1.4, 0.45]}><boxGeometry args={[3.2, 0.34, 0.9]} /></mesh>
      <mesh material={matMus} position={[0, -1.76, 0.45]}><boxGeometry args={[3.2, 0.3, 0.9]} /></mesh>
    </group>
  );
}

const COLOR_MONOMERO = { almidon: '#22c55e', proteina: '#8b5cf6', lipido: '#fbbf24' } as const;

/** Vellosidades del intestino delgado con capilar, quilífero y microvellosidades. */
function Vellosidades({ macro, absorbiendo }: { macro: keyof typeof COLOR_MONOMERO; absorbiendo: boolean }) {
  const XS = [-1.2, -0.6, 0, 0.6, 1.2];
  const H = 1.5, R = 0.25;
  const mats = useMemo(() => ({
    base: new THREE.MeshStandardMaterial({ color: '#d98f7d', roughness: 0.6 }),
    vell: new THREE.MeshPhysicalMaterial({ color: '#f0b3a5', roughness: 0.45, transparent: true, opacity: 0.55, depthWrite: false }),
    capilar: new THREE.MeshStandardMaterial({ color: '#d12b33', roughness: 0.4 }),
    lacteo: new THREE.MeshStandardMaterial({ color: '#f1d56a', roughness: 0.4 }),
    micro: new THREE.MeshStandardMaterial({ color: '#e9988a', roughness: 0.7 }),
    part: new THREE.MeshStandardMaterial({ color: COLOR_MONOMERO[macro], emissive: COLOR_MONOMERO[macro], emissiveIntensity: 0.35, roughness: 0.4 }),
  }), [macro]);
  useEffect(() => () => { Object.values(mats).forEach((x) => x.dispose()); }, [mats]);
  const geos = useMemo(() => ({
    capsula: new THREE.CapsuleGeometry(R, H - 2 * R, 8, 20),
    capilar: tubo([[-0.09, 0.0, 0.0], [-0.1, 0.5, 0.0], [-0.04, H * 0.75, 0], [0.05, H * 0.75, 0], [0.1, 0.5, 0.0], [0.09, 0.0, 0.0]], 0.026, 40, 8),
    lacteo: tubo([[0, 0, 0], [0, H * 0.82, 0]], 0.045, 12, 8),
  }), []);
  useEffect(() => () => { Object.values(geos).forEach((x) => x.dispose()); }, [geos]);
  // microvellosidades: pelitos sobre la superficie de cada vellosidad (una sola malla instanciada)
  const micro = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const im = micro.current; if (!im) return;
    const rnd = azar(21), d = new THREE.Object3D();
    let k = 0;
    for (const x of XS) for (let i = 0; i < 70; i++) {
      const ang = rnd() * Math.PI * 2, yy = R + rnd() * (H - 2 * R);
      const nx = Math.cos(ang), nz = Math.sin(ang);
      d.position.set(x + nx * (R + 0.02), yy + 0.0, nz * (R + 0.02) * 0.9);
      d.rotation.set(0, 0, 0); d.lookAt(d.position.x + nx, d.position.y, d.position.z + nz); d.rotateX(Math.PI / 2);
      d.updateMatrix(); im.setMatrixAt(k++, d.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }, []);
  const part = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    part.current.forEach((p, i) => {
      if (!p) return;
      p.visible = absorbiendo;
      if (!absorbiendo) return;
      const vi = Math.floor(i / 3), x = XS[vi], u = (s.clock.elapsedTime * 0.35 + (i % 3) / 3 + vi * 0.17) % 1;
      const lacteal = macro === 'lipido';
      const ex = lacteal ? 0 : 0.1;
      // entra desde la luz (a la derecha de la vellosidad) y sube por el vaso
      if (u < 0.4) p.position.set(x + R + 0.45 - ((R + 0.45 - ex) * u) / 0.4, 0.55 + 0.25 * Math.sin(i), 0);
      else p.position.set(x + ex, 0.55 + ((u - 0.4) / 0.6) * (H * 0.55), 0);
      p.scale.setScalar(0.035);
    });
  });
  return (
    <group position={[0, -1.25, -0.1]}>
      <mesh material={mats.base} position={[0, -0.3, 0]}><boxGeometry args={[3.4, 0.5, 0.9]} /></mesh>
      {XS.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={geos.capsula} material={mats.vell} position={[0, H / 2, 0]} renderOrder={2} />
          <mesh geometry={geos.capilar} material={mats.capilar} />
          <mesh geometry={geos.lacteo} material={mats.lacteo} />
        </group>
      ))}
      <instancedMesh ref={micro} args={[geoCache('bio09:micro', () => new THREE.CylinderGeometry(0.008, 0.008, 0.07, 5)), mats.micro, XS.length * 70]} />
      {Array.from({ length: XS.length * 3 }, (_, i) => (
        <mesh key={i} ref={(el) => { part.current[i] = el; }} geometry={esf()} material={mats.part} visible={false} />
      ))}
    </group>
  );
}

const TITULO_PARED: Record<Organo, string> = {
  boca: 'Pared de la boca: epitelio plano estratificado',
  estomago: 'Pared del estómago: pliegues y glándulas',
  delgado: 'Pared del intestino delgado: vellosidades',
  grueso: 'Pared del colon: criptas, sin vellosidades',
};

/** Lupa con el corte de la pared del órgano elegido para la pregunta de absorción. */
export function CortePared({ organo, macro, absorbiendo, ...g }: { organo: Organo | null; macro: keyof typeof COLOR_MONOMERO; absorbiendo: boolean } & GroupProps) {
  const fondo = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.95 }), []);
  const aro = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfd5da', metalness: 0.9, roughness: 0.25 }), []);
  useEffect(() => () => { fondo.dispose(); aro.dispose(); }, [fondo, aro]);
  return (
    <group {...g}>
      <mesh material={fondo} position={[0, 0, -0.6]}><circleGeometry args={[2.35, 64]} /></mesh>
      <mesh material={aro} position={[0, 0, -0.58]}><torusGeometry args={[2.35, 0.07, 10, 64]} /></mesh>
      {organo === null && (
        <>
          <Etiqueta texto="Pared del órgano" position={[0, 0.25, -0.5]} tamano={0.27} color="#51626d" />
          <Etiqueta texto="que elijas en la pregunta 5" position={[0, -0.15, -0.5]} tamano={0.27} color="#51626d" />
        </>
      )}
      {organo === 'delgado' && <Vellosidades macro={macro} absorbiendo={absorbiendo} />}
      {organo && organo !== 'delgado' && <Capas tipo={organo} />}
      {organo && <Etiqueta texto={TITULO_PARED[organo]} position={[0, 2.75, 0.2]} tamano={0.3} fondo="#ffffffec" />}
      {organo === 'delgado' && (
        <>
          <Etiqueta texto="Capilar" position={[-1.5, 0.45, 0.5]} tamano={0.27} fondo="#ffffffec" />
          <Etiqueta texto="Quilífero" position={[-1.5, 0.0, 0.5]} tamano={0.27} fondo="#ffffffec" />
        </>
      )}
    </group>
  );
}

/** Marcador «tu respuesta» sobre un órgano. */
export function Pin({ ...g }: GroupProps) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 }), []);
  useEffect(() => () => { m.dispose(); }, [m]);
  return (
    <group {...g}>
      <mesh material={m} geometry={geoCache('bio09:pinC', () => new THREE.ConeGeometry(0.18, 0.4, 14))} rotation={[Math.PI, 0, 0]} position={[0, 0.2, 0]} />
      <mesh material={m} geometry={esf()} position={[0, 0.5, 0]} scale={[0.13, 0.13, 0.13]} />
    </group>
  );
}
