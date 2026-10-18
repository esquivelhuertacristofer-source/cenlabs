'use client';
/**
 * bio02/celula.tsx — las vistas CÉLULA (exploración) y RETO, a escala de micras (1 u = 1 µm).
 *
 *  · Glóbulo rojo: su malla encierra EXACTAMENTE el volumen del modelo (`forma.ts`): disco
 *    bicóncavo de 90 fL en reposo, esfera de igual área al hincharse, equinocito al encogerse;
 *    lisis al pasar el volumen crítico (fantasma de membrana y hemoglobina que se dispersa).
 *    Su color sale de la saturación de la hemoglobina (oscuro venoso → escarlata arterial).
 *  · Célula vegetal (reto): pared rígida en corte; el protoplasto (con su vacuola) ocupa un
 *    volumen proporcional al del modelo y se despega de la pared en la plasmólisis (esquema).
 *  · Gotas de agua: cada una es 0,2 fL (su volumen real) y salen al ritmo de dV/dt.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { azar, sanearNormales, type Calidad } from '../_kit';
import { crearGeoEritrocito, formarEritrocito, R_E } from './forma';
import { materialCera, materialCorte } from './materiales';
import { ERITROCITO, VMAX_VEGETAL_B2 } from './transporte';
import type { RelojTransporte, RelojReto } from './reloj';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const suave = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
const C_DESOXI = new THREE.Color('#5c1322'), C_OXI = new THREE.Color('#d8273a');
/** Volumen de cada gota dibujada (fL = µm³) y su radio. */
export const GOTA_FL = 0.2;
const R_GOTA = Math.cbrt((3 * GOTA_FL) / (4 * Math.PI));
/** Por encima de este ritmo (gotas por s de pantalla) las gotas se saturan (esquema). */
export const GOTAS_MAX = 90;

/** Inclinación del glóbulo para que se lea su forma bicóncava. */
const INCLINA = new THREE.Euler(0.78, 0, 0.2);

/** El borde del disco inclinado (gira sobre su propio eje: su silueta no cambia al girar). */
export function puntosCelula(): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  const q = new THREE.Quaternion().setFromEuler(INCLINA);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    for (const y of [-1.25, 1.25]) P.push(V(Math.cos(a) * R_E * 1.04, y, Math.sin(a) * R_E * 1.04).applyQuaternion(q));
  }
  return P;
}

// ───────────────────────────── glóbulo rojo ─────────────────────────────

function useMatGlobulo(clave: string, k = 1) {
  const m = useMemo(() => {
    const mat = materialCera({ color: '#c22a35', vertexColors: true, rugosidad: 0.42, sheen: 0.6, clearcoat: 0.32, borde: '#ff9a92', fuerzaBorde: 0.32 * k, potenciaBorde: 2.2 }, clave);
    mat.sheenColor = new THREE.Color('#ff8a80');
    return mat;
  }, [clave, k]);
  useEffect(() => () => m.dispose(), [m]);
  return m;
}

/** Geometría compartida del glóbulo: sigue al volumen que devuelve `volumen()` (fL). */
function useGeoGlobulo(volumen: () => number) {
  const geo = useMemo(() => crearGeoEritrocito(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const ultimo = useRef(-1);
  useFrame(() => {
    const v = volumen();
    if (Math.abs(v - ultimo.current) < 0.04) return;
    ultimo.current = v;
    formarEritrocito(geo, v);
    geo.computeBoundingBox();
  }, -0.4);
  return geo;
}

/** Gotas de agua que cruzan la membrana al ritmo de dV/dt (+ entran). */
function Gotas({ tasa, semiejes, dt, soloDetras = false }: {
  /** gotas por s de pantalla (con signo) */
  tasa: () => number;
  /** semiejes (µm) de la superficie de la célula en su marco local */
  semiejes: () => THREE.Vector3;
  dt: () => number;
  soloDetras?: boolean;
}) {
  const N = 96;
  const geo = useMemo(() => sanearNormales(new THREE.SphereGeometry(R_GOTA, 12, 9)), []);
  const mat = useMemo(() => materialCera({ color: '#5fb4e6', rugosidad: 0.08, clearcoat: 1, sheen: 0.1, borde: '#d8f2ff', fuerzaBorde: 0.55, potenciaBorde: 1.8, transparente: 0.62 }, 'gota'), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const st = useRef<{ act: Uint8Array; t: Float32Array; dir: THREE.Vector3[]; entra: Uint8Array; ac: number; rnd: () => number } | null>(null);
  if (!st.current) st.current = { act: new Uint8Array(N), t: new Float32Array(N), dir: Array.from({ length: N }, () => V(0, 1, 0)), entra: new Uint8Array(N), ac: 0, rnd: azar(303) };
  const M = useMemo(() => new THREE.Matrix4(), []);
  const P = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const m = ref.current, s = st.current!; if (!m) return;
    const d = dt();
    const r = tasa();
    const ejes = semiejes();
    if (d > 0) {
      s.ac += Math.min(GOTAS_MAX, Math.abs(r)) * d;
      while (s.ac >= 1) {
        s.ac -= 1;
        const i = s.act.indexOf(0); if (i < 0) { s.ac = 0; break; }
        const u = s.rnd() * 2 - 1, a = s.rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
        s.dir[i].set(rr * Math.cos(a), u, rr * Math.sin(a));
        if (soloDetras && s.dir[i].z > 0.2) s.dir[i].z = -s.dir[i].z;
        s.act[i] = 1; s.t[i] = 0; s.entra[i] = r > 0 ? 1 : 0;
      }
    }
    let n = 0;
    for (let i = 0; i < N; i++) {
      if (!s.act[i]) continue;
      s.t[i] += d;
      if (s.t[i] > 1) { s.act[i] = 0; continue; }
      const dir = s.dir[i];
      const k = 1 / Math.sqrt((dir.x / ejes.x) ** 2 + (dir.y / ejes.y) ** 2 + (dir.z / ejes.z) ** 2);
      // fuera → superficie (entra) o superficie → fuera (sale); se funde al cruzar
      const u = s.entra[i] ? s.t[i] : 1 - s.t[i];
      const dist = k * THREE.MathUtils.lerp(1.9, 0.92, suave(u));
      const esc = Math.min(suave(s.t[i] / 0.15), suave((1 - s.t[i]) / 0.25)) * (s.entra[i] ? 1 - 0.6 * suave((u - 0.8) / 0.2) : 1);
      P.copy(dir).multiplyScalar(dist);
      M.makeScale(esc, esc, esc).setPosition(P);
      m.setMatrixAt(n++, M);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} frustumCulled={false} userData={{ pieza: 'gota' }} />;
}

/** Fantasma de membrana y nube de hemoglobina tras la lisis (t en s de pantalla desde que estalla). */
function Lisis({ t }: { t: () => number }) {
  const frag = useMemo(() => {
    const rnd = azar(11), out: { dir: THREE.Vector3; rot: THREE.Vector3; v: number; s: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      out.push({ dir: V(r * Math.cos(a), u * 0.8, r * Math.sin(a)), rot: V(rnd() * 3, rnd() * 3, rnd() * 3), v: 0.6 + rnd() * 0.8, s: 0.8 + rnd() * 0.5 });
    }
    return out;
  }, []);
  const geoFrag = useMemo(() => sanearNormales(new THREE.SphereGeometry(R_E * 0.55, 16, 10, 0, 1.4, 0.5, 1.1)), []);
  const geoNube = useMemo(() => new THREE.SphereGeometry(1, 32, 20), []);
  const mFrag = useMemo(() => { const m = materialCera({ color: '#e7a3a6', rugosidad: 0.4, sheen: 0.8, clearcoat: 0.2, borde: '#ffd6d6', fuerzaBorde: 0.4, transparente: 0.75 }, 'fantasma'); m.side = THREE.DoubleSide; return m; }, []);
  const mNubes = useMemo(() => [0, 1, 2].map(() => new THREE.MeshPhysicalMaterial({ color: '#b3202e', roughness: 0.3, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.FrontSide })), []);
  useEffect(() => () => { geoFrag.dispose(); geoNube.dispose(); mFrag.dispose(); mNubes.forEach((m) => m.dispose()); }, [geoFrag, geoNube, mFrag, mNubes]);
  const grupo = useRef<THREE.Group>(null);
  const nubes = useRef<THREE.Group>(null);
  useFrame(() => {
    const e = 1 - Math.pow(1 - Math.min(1, t() / 2.2), 3);
    grupo.current?.children.forEach((c, i) => {
      const f = frag[i]; if (!f) return;
      c.position.copy(f.dir).multiplyScalar(R_E * (0.55 + f.v * e * 0.7));
      c.rotation.set(f.rot.x * e, f.rot.y * e, f.rot.z * e);
    });
    nubes.current?.children.forEach((c, i) => {
      // la hemoglobina liberada se difunde: una nube que crece y se aclara (nunca envuelve la cámara)
      const r = R_E * (0.9 + (0.35 + 0.3 * i) * e);
      c.scale.setScalar(r);
      ((c as THREE.Mesh).material as THREE.MeshPhysicalMaterial).opacity = (0.16 - 0.04 * i) * (1 - 0.5 * e);
    });
  });
  return (
    <group userData={{ pieza: 'lisis' }}>
      <group ref={grupo}>{frag.map((f, i) => <mesh key={i} geometry={geoFrag} material={mFrag} scale={f.s} />)}</group>
      <group ref={nubes}>{mNubes.map((m, i) => <mesh key={i} geometry={geoNube} material={m} renderOrder={5} />)}</group>
    </group>
  );
}

/** Glóbulos vecinos (fuera de foco): la misma muestra, así que se hinchan igual. */
const VECINOS: { p: [number, number, number]; r: [number, number, number] }[] = [
  { p: [-17, 6, -34], r: [0.4, 0.6, 0.3] },
  { p: [19, -7, -42], r: [-1.2, 2.1, 0.2] },
  { p: [8, 15, -55], r: [0.9, -0.5, 1.1] },
  { p: [-11, -14, -48], r: [-0.3, 1.4, -0.8] },
];

function Glóbulo({ volumen, saturacion, dt, tasaGotas, lisada, tLisis, vecinos, calidad }: {
  volumen: () => number; saturacion: () => number; dt: () => number; tasaGotas: () => number;
  lisada: () => boolean; tLisis: () => number; vecinos: boolean; calidad: Calidad;
}) {
  const geo = useGeoGlobulo(volumen);
  const mat = useMatGlobulo('globulo');
  const matLejos = useMatGlobulo('globuloLejos', 0.5);
  const giro = useRef<THREE.Group>(null);
  const malla = useRef<THREE.Mesh>(null);
  const [roto, setRoto] = React.useState(false);
  const ejes = useMemo(() => V(R_E, R_E * 0.5, R_E), []);
  useFrame(() => {
    const s = saturacion();
    mat.color.copy(C_DESOXI).lerp(C_OXI, s);
    matLejos.color.copy(mat.color).multiplyScalar(0.4);
    const d = dt();
    if (giro.current && d > 0) giro.current.rotation.y += d * 0.12;
    const bb = geo.boundingBox;
    if (bb) ejes.set(Math.max(0.5, bb.max.x), Math.max(0.3, bb.max.y), Math.max(0.5, bb.max.z));
    const l = lisada();
    if (l !== roto) setRoto(l);
  });
  return (
    <group>
      <group rotation={INCLINA}>
        <group ref={giro}>
          {!roto && <mesh ref={malla} geometry={geo} material={mat} castShadow receiveShadow userData={{ pieza: 'globulo' }} />}
          {!roto && <Gotas tasa={tasaGotas} semiejes={() => ejes} dt={dt} />}
          {roto && <Lisis t={tLisis} />}
        </group>
      </group>
      {vecinos && (calidad === 'alta' ? VECINOS : VECINOS.slice(0, 2)).map((v, i) => (
        <mesh key={i} geometry={geo} material={matLejos} position={v.p} rotation={v.r} visible={!roto} userData={{ pieza: 'vecino' }} />
      ))}
    </group>
  );
}

// ───────────────────────────── vistas ─────────────────────────────

type RefReloj<T> = React.MutableRefObject<T>;

/** Exploración: el glóbulo conocido transferido al medio elegido (cámara lenta ×1/10). */
export function VistaCelula({ reloj, calidad }: { reloj: RefReloj<RelojTransporte>; calidad: Calidad }) {
  return (
    <Glóbulo
      calidad={calidad}
      vecinos
      volumen={() => reloj.current.lectura.V}
      saturacion={() => reloj.current.lectura.sat}
      dt={() => reloj.current.dtPantalla}
      tasaGotas={() => reloj.current.lectura.dVdt / reloj.current.factor / GOTA_FL}
      lisada={() => reloj.current.lectura.vRel >= 160}
      tLisis={() => 0}
    />
  );
}

/** El reto: la célula del store con la osmolaridad interna desconocida (×1/10). */
export function VistaReto({ reloj, calidad }: { reloj: RefReloj<RelojReto>; calidad: Calidad }) {
  const tL = useRef<{ gen: number; t0: number } | null>(null);
  const tipo = reloj.current.cfg.tipo;
  if (tipo === 'vegetal') return <CelulaVegetal reloj={reloj} calidad={calidad} />;
  return (
    <Glóbulo
      calidad={calidad}
      vecinos
      volumen={() => (Math.min(reloj.current.V, 165) / 100) * ERITROCITO.V0}
      saturacion={() => 0.85}
      dt={() => reloj.current.dtPantalla}
      tasaGotas={() => (reloj.current.dVdt / 100) * ERITROCITO.V0 / GOTA_FL}
      lisada={() => reloj.current.lisada}
      tLisis={() => {
        const r = reloj.current;
        if (!tL.current || tL.current.gen !== r.generacion) tL.current = { gen: r.generacion, t0: r.tAnim };
        return r.tAnim - tL.current.t0;
      }}
    />
  );
}

// ───────────────────────────── célula vegetal ─────────────────────────────

/** Medidas (µm): pared por fuera y su grosor. */
const PARED = { w: 44, h: 30, d: 30, t: 1.2 };
const INT = { w: PARED.w - 2 * PARED.t - 0.3, h: PARED.h - 2 * PARED.t - 0.3, d: PARED.d - 2 * PARED.t - 0.3 };

export function puntosVegetal(): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  for (const x of [-PARED.w / 2, PARED.w / 2]) for (const y of [-PARED.h / 2, PARED.h / 2]) for (const z of [-PARED.d / 2, 0]) P.push(V(x, y, z));
  return P;
}

const CORTE_Z = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];

function cajaR(w: number, h: number, d: number, r: number) {
  const g = new RoundedBoxGeometry(w, h, d, 5, Math.min(r, w / 2.05, h / 2.05, d / 2.05));
  return sanearNormales(g);
}

function CelulaVegetal({ reloj, calidad }: { reloj: RefReloj<RelojReto>; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const geos = useMemo(() => {
    const exterior = cajaR(PARED.w, PARED.h, PARED.d, 3.2);
    const interior = cajaR(PARED.w - 2 * PARED.t, PARED.h - 2 * PARED.t, PARED.d - 2 * PARED.t, 2.4);
    // la cara interior de la pared mira hacia dentro: se invierte el orden de cada triángulo y su normal
    const idx = interior.getIndex();
    const pos = interior.getAttribute('position') as THREE.BufferAttribute;
    const n = interior.getAttribute('normal') as THREE.BufferAttribute;
    if (idx) {
      for (let k = 0; k < idx.count; k += 3) { const a = idx.getX(k + 1); idx.setX(k + 1, idx.getX(k + 2)); idx.setX(k + 2, a); }
    } else {
      for (let k = 0; k < pos.count; k += 3) {
        for (const at of [pos, n]) {
          const x = at.getX(k + 1), y = at.getY(k + 1), z = at.getZ(k + 1);
          at.setXYZ(k + 1, at.getX(k + 2), at.getY(k + 2), at.getZ(k + 2));
          at.setXYZ(k + 2, x, y, z);
        }
      }
    }
    for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
    return {
      exterior, interior,
      proto: cajaR(INT.w, INT.h, INT.d, 5),
      vacuola: cajaR(INT.w * 0.8, INT.h * 0.74, INT.d * 0.74, 6),
      nucleo: sanearNormales(new THREE.SphereGeometry(3.6, 28, 20)),
      cloro: sanearNormales(new THREE.SphereGeometry(1, 16, 10)),
    };
  }, []);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  const mats = useMemo(() => ({
    pared: materialCorte({ color: '#d9d39a', rugosidad: 0.6, sheen: 0.4, clearcoat: 0.1, borde: '#fffbe0', fuerzaBorde: 0.18, planos: CORTE_Z, colorSeccion: '#a99f5c', pasoRayado: 0.9 }, 'paredV'),
    proto: materialCorte({ color: '#8fc77a', rugosidad: 0.45, sheen: 0.5, clearcoat: 0.25, borde: '#e6ffd8', fuerzaBorde: 0.3, planos: CORTE_Z, colorSeccion: '#4f8a3f', pasoRayado: 0.8 }, 'protoV'),
    vacuola: materialCorte({ color: '#9fd0ee', rugosidad: 0.2, sheen: 0.3, clearcoat: 0.6, borde: '#ffffff', fuerzaBorde: 0.35, planos: CORTE_Z, colorSeccion: '#5d9cc4', pasoRayado: 0.8 }, 'vacV'),
    nucleo: materialCorte({ color: '#a585c9', rugosidad: 0.45, sheen: 0.6, clearcoat: 0.2, borde: '#efe2ff', fuerzaBorde: 0.3, planos: CORTE_Z, colorSeccion: '#6f4f96', pasoRayado: 0.6 }, 'nucV'),
    cloro: materialCera({ color: '#2f8a3a', rugosidad: 0.4, sheen: 0.7, clearcoat: 0.3, borde: '#b4f0a0', fuerzaBorde: 0.3 }, 'cloroV'),
  }), []);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); }, [mats]);
  const cloros = useMemo(() => {
    const rnd = azar(5), out: { p: THREE.Vector3; r: THREE.Euler }[] = [];
    while (out.length < (alta ? 34 : 22)) {
      const v = V(rnd() * 2 - 1, rnd() * 2 - 1, -rnd());
      const m = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)) || 1;
      v.divideScalar(m);
      out.push({ p: v, r: new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3) });
    }
    return out;
  }, [alta]);
  const proto = useRef<THREE.Group>(null);
  const iClo = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const ejes = useMemo(() => V(INT.w / 2, INT.h / 2, INT.d / 2), []);
  useFrame(() => {
    // el protoplasto llena la pared con V = 108 % (turgencia); por debajo se despega (plasmólisis)
    const k = Math.cbrt(Math.max(20, Math.min(reloj.current.V, VMAX_VEGETAL_B2)) / VMAX_VEGETAL_B2);
    if (proto.current) proto.current.scale.setScalar(k);
    ejes.set(INT.w / 2 * k, INT.h / 2 * k, INT.d / 2 * k);
    const m = iClo.current;
    if (m) {
      cloros.forEach((c, i) => {
        o.position.set(c.p.x * (INT.w / 2 - 2.2) * k, c.p.y * (INT.h / 2 - 2.2) * k, c.p.z * (INT.d / 2 - 2.2) * k);
        o.rotation.copy(c.r); o.scale.set(2.6, 1.3, 1.6);
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  });
  const tasa = () => (reloj.current.dVdt / 100) * ERITROCITO.V0 / GOTA_FL;
  return (
    <group rotation={[0.18, -0.32, 0]}>
      <mesh geometry={geos.exterior} material={mats.pared} castShadow receiveShadow userData={{ pieza: 'pared' }} />
      <mesh geometry={geos.interior} material={mats.pared} receiveShadow userData={{ pieza: 'pared' }} />
      <group ref={proto}>
        <mesh geometry={geos.proto} material={mats.proto} receiveShadow userData={{ pieza: 'protoplasto' }} />
        <mesh geometry={geos.vacuola} material={mats.vacuola} userData={{ pieza: 'vacuola' }} />
        <mesh geometry={geos.nucleo} material={mats.nucleo} position={[-INT.w * 0.36, INT.h * 0.18, -INT.d * 0.2]} userData={{ pieza: 'nucleo' }} />
      </group>
      <instancedMesh ref={iClo} args={[geos.cloro, mats.cloro, cloros.length]} castShadow frustumCulled={false} userData={{ pieza: 'cloroplasto' }} />
      <Gotas tasa={tasa} semiejes={() => ejes} dt={() => reloj.current.dtPantalla} soloDetras />
    </group>
  );
}

export const ROTULO_PIEZA_CELULA: Record<string, string> = {
  globulo: 'Glóbulo rojo (su volumen es el del modelo)',
  vecino: 'Otro glóbulo de la muestra',
  gota: 'Agua: cada gota ≈ 0,2 fL',
  lisis: 'Lisis: membrana rota y hemoglobina liberada',
  pared: 'Pared celular (rígida)',
  protoplasto: 'Membrana y citoplasma (protoplasto)',
  vacuola: 'Vacuola central',
  nucleo: 'Núcleo',
  cloroplasto: 'Cloroplasto',
};
