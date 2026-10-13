'use client';
/**
 * bio08/piezas.tsx — piezas 3D del electrocardiograma (1 u = 1 dm, coordenadas del
 * paciente: +x a su izquierda, +y arriba, +z hacia delante).
 *
 * Geometrías construidas desde los datos del worker (corazon.ts) y componentes que
 * leen el reloj cardiaco en cada cuadro: el corazón que late con su onda, el sistema
 * de conducción, las válvulas, el torso de vidrio con los electrodos, el triángulo
 * de Einthoven con la proyección del vector en la derivación elegida, y la flecha
 * del dipolo con su estela.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import type { Line2, LineMaterial } from 'three-stdlib';
import type { MallaCorazon, MallaValvula, DatosCorazon } from './corazon';
import type { Rama, Derivacion } from './electro';
import { VECTOR_DERIVACION } from './electro';
import type { Malla, V3 } from './anatomia';
import { MARCO } from './anatomia';
import type { RelojCardiaco } from './reloj';
import { materialConduccion, materialCorazon, materialFantasma, materialPurkinje, materialTorso, type UniformesTiempo } from './sombreadores';

// ───────────────────────────── geometrías ─────────────────────────────

/** Malla del corazón con sus atributos eléctricos y mecánicos. */
export function geometriaCorazon(m: MallaCorazon): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(m.color, 3));
  g.setAttribute('aTau', new THREE.BufferAttribute(m.tau, 1));
  g.setAttribute('aRho', new THREE.BufferAttribute(m.rho, 1));
  g.setAttribute('aProc', new THREE.BufferAttribute(m.proc, 1));
  g.setAttribute('aExc', new THREE.BufferAttribute(m.exc, 1));
  g.setAttribute('aSec', new THREE.BufferAttribute(m.sec, 1));
  g.setAttribute('aDesp', new THREE.BufferAttribute(m.desp, 3));
  g.setAttribute('aArr', new THREE.BufferAttribute(m.arrastre, 3));
  g.setIndex(new THREE.BufferAttribute(m.idx, 1));
  g.computeBoundingSphere();
  if (g.boundingSphere) g.boundingSphere.radius += 0.2; // la contracción mueve los vértices en el sombreador
  return g;
}

/**
 * Sistema de conducción como tubos fusionados (una llamada de dibujo) con, por
 * vértice, el tiempo bruto del impulso y su proceso (0 aurícula, 1 nodo AV, 2 His-Purkinje).
 * La red de Purkinje va aparte: es invisible en reposo y sólo brilla cuando la
 * cruza el impulso (radio visual 0,45 mm; las fibras reales son más finas).
 */
export function geometriaConduccion(ramas: Rama[], alta: boolean, cuales: 'principal' | 'purkinje'): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], tt: number[] = [], pr: number[] = [], pk: number[] = [], idx: number[] = [];
  const v3 = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), d = new THREE.Vector3();
  for (const r of ramas) {
    if (r.puntos.length < 2 || r.t.some((x) => !Number.isFinite(x))) continue; // sin tiempo propio: no se dibuja
    const purk = r.nombre.startsWith('Purkinje');
    if (purk !== (cuales === 'purkinje')) continue;
    const R = purk ? 0.0045 : Math.max(0.0085, r.radio);
    const nS = purk ? 4 : (alta ? 10 : 7);
    const pc = r.proceso === 'A' ? 0 : r.proceso === 'AV' ? 1 : 2;
    const P = r.puntos.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const n = P.length;
    // marco por transporte paralelo
    T.subVectors(P[1], P[0]).normalize();
    N.set(0, 1, 0); if (Math.abs(N.dot(T)) > 0.9) N.set(1, 0, 0);
    N.addScaledVector(T, -N.dot(T)).normalize();
    const base = pos.length / 3;
    for (let i = 0; i < n; i++) {
      if (i > 0 && i < n - 1) T.subVectors(P[i + 1], P[i - 1]).normalize();
      else if (i === n - 1) T.subVectors(P[i], P[i - 1]).normalize();
      N.addScaledVector(T, -N.dot(T)).normalize();
      B.crossVectors(T, N);
      for (let s = 0; s < nS; s++) {
        const a = (s / nS) * Math.PI * 2;
        d.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
        v3.copy(P[i]).addScaledVector(d, R);
        pos.push(v3.x, v3.y, v3.z); nor.push(d.x, d.y, d.z); tt.push(r.t[i]); pr.push(pc); pk.push(purk ? 1 : 0);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < nS; s++) {
      const a = base + i * nS + s, b = base + i * nS + ((s + 1) % nS), c = a + nS, e = b + nS;
      idx.push(a, b, c, b, e, c);
    }
    // tapas
    for (const [i, sg] of [[0, -1], [n - 1, 1]] as const) {
      if (i === 0) T.subVectors(P[1], P[0]).normalize(); else T.subVectors(P[n - 1], P[n - 2]).normalize();
      const c = pos.length / 3;
      pos.push(P[i].x, P[i].y, P[i].z); nor.push(T.x * sg, T.y * sg, T.z * sg); tt.push(r.t[i]); pr.push(pc); pk.push(purk ? 1 : 0);
      const anillo = base + i * nS;
      for (let s = 0; s < nS; s++) {
        const a = anillo + s, b = anillo + ((s + 1) % nS);
        if (sg > 0) idx.push(a, b, c); else idx.push(b, a, c);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
  g.setAttribute('aProcC', new THREE.Float32BufferAttribute(pr, 1));
  g.setAttribute('aPk', new THREE.Float32BufferAttribute(pk, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Válvula con un objetivo de morph: 0 = cerrada, 1 = abierta. */
export function geometriaValvula(v: MallaValvula): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(v.cerrada, 3));
  g.setIndex(new THREE.BufferAttribute(v.idx, 1));
  g.computeVertexNormals();
  const ga = new THREE.BufferGeometry();
  ga.setAttribute('position', new THREE.BufferAttribute(v.abierta, 3));
  ga.setIndex(new THREE.BufferAttribute(v.idx, 1));
  ga.computeVertexNormals();
  g.morphAttributes.position = [ga.getAttribute('position')];
  g.morphAttributes.normal = [ga.getAttribute('normal')];
  g.morphTargetsRelative = false;
  g.computeBoundingSphere();
  if (g.boundingSphere) g.boundingSphere.radius += 0.25;
  return g;
}

export function geometriaMalla(m: Malla): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.nor, 3));
  g.setIndex(new THREE.BufferAttribute(m.idx, 1));
  g.computeBoundingSphere();
  return g;
}

// ───────────────────────────── corazón ─────────────────────────────

/**
 * Miocardio: con corte de cuatro cámaras (más la cáscara translúcida de lo que el
 * corte quita) o entero. Las dos geometrías salen del mismo campo y comparten
 * atributos, así que la onda es la misma en ambas.
 */
export function Corazon({ datos, u, corte, alta }: { datos: DatosCorazon; u: UniformesTiempo; corte: boolean; alta: boolean }) {
  const geoV = useMemo(() => geometriaCorazon(datos.visual), [datos]);
  const geoC = useMemo(() => geometriaCorazon(datos.corte), [datos]);
  const geoK = useMemo(() => geometriaCorazon(datos.coronarias), [datos]);
  const mat = useMemo(() => materialCorazon(u, alta), [u, alta]);
  const matK = useMemo(() => materialCorazon(u, alta, true), [u, alta]);
  const fantasma = useMemo(() => materialFantasma(u), [u]);
  useEffect(() => () => { geoV.dispose(); geoC.dispose(); geoK.dispose(); }, [geoV, geoC, geoK]);
  useEffect(() => () => { mat.dispose(); matK.dispose(); fantasma.dispose(); }, [mat, matK, fantasma]);
  useEffect(() => { u.uCorte.value = corte ? 1 : 0; }, [u, corte]);
  return (
    <group>
      <mesh geometry={corte ? geoC : geoV} material={mat} name="miocardio" />
      <mesh geometry={geoK} material={matK} name="coronarias" />
      {corte && <mesh geometry={geoV} material={fantasma} renderOrder={3} name="fantasma" />}
    </group>
  );
}

/** Fibras de conducción y los dos nodos (SA con su potencial de marcapasos, AV con su retardo). */
export function Conduccion({ datos, u, reloj, alta }: { datos: DatosCorazon; u: UniformesTiempo; reloj: RelojCardiaco; alta: boolean }) {
  const geo = useMemo(() => geometriaConduccion(datos.ramas, alta, 'principal'), [datos, alta]);
  const geoPk = useMemo(() => geometriaConduccion(datos.ramas, alta, 'purkinje'), [datos, alta]);
  const mat = useMemo(() => materialConduccion(u), [u]);
  const matPk = useMemo(() => materialPurkinje(u), [u]);
  const matSA = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3e2b4', emissive: '#ffcf7a', emissiveIntensity: 0, roughness: 0.4 }), []);
  const matAV = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3e2b4', emissive: '#ffcf7a', emissiveIntensity: 0, roughness: 0.4 }), []);
  // halos aditivos: el SA «se carga» durante la diástole (fase 4) y destella al disparar
  const halo = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,236,190,1)'); gr.addColorStop(0.25, 'rgba(255,190,110,0.55)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mk = () => new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    return { tex, sa: mk(), av: mk() };
  }, []);
  const spSA = useRef<THREE.Sprite>(null), spAV = useRef<THREE.Sprite>(null);
  useEffect(() => () => { geo.dispose(); geoPk.dispose(); mat.dispose(); matPk.dispose(); matSA.dispose(); matAV.dispose(); halo.tex.dispose(); halo.sa.dispose(); halo.av.dispose(); }, [geo, geoPk, mat, matPk, matSA, matAV, halo]);
  useFrame(() => {
    const m = reloj.mapeo; if (!m) return;
    const t = reloj.tCicloSuave;
    // SA: la rampa diastólica (fase 4) sube hasta el umbral y dispara al inicio del ciclo
    const fase4 = Math.pow(Math.min(1, t / m.rr), 2.2);
    const disparo = Math.exp(-t / 22);
    matSA.emissiveIntensity = 0.25 + 0.9 * fase4 + 5.5 * disparo;
    // AV: brilla mientras el impulso lo cruza despacio
    const enAV = t >= m.tAV && t <= m.tHis ? 1 : Math.exp(-Math.abs(t < m.tAV ? m.tAV - t : t - m.tHis) / 10);
    matAV.emissiveIntensity = 0.2 + 2.6 * enAV;
    halo.sa.opacity = Math.min(1, 0.12 + 0.5 * fase4 + 0.9 * disparo);
    spSA.current?.scale.setScalar(0.08 + 0.05 * fase4 + 0.12 * disparo);
    halo.av.opacity = 0.65 * enAV;
    spAV.current?.scale.setScalar(0.07 + 0.03 * enAV);
  });
  return (
    <group>
      <mesh geometry={geo} material={mat} name="conduccion" renderOrder={1} />
      <mesh geometry={geoPk} material={matPk} name="purkinje" renderOrder={4} />
      <mesh position={datos.sa} material={matSA} scale={[0.034, 0.024, 0.034]} renderOrder={1}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh position={datos.nodoAV} material={matAV} scale={[0.026, 0.018, 0.026]} renderOrder={1}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <sprite ref={spSA} position={datos.sa} material={halo.sa} renderOrder={6} />
      <sprite ref={spAV} position={datos.nodoAV} material={halo.av} renderOrder={6} />
    </group>
  );
}

/** Las cuatro válvulas (morph cerrada → abierta) y las cuerdas tendinosas. */
export function Valvulas({ datos, estado }: { datos: DatosCorazon; estado: React.MutableRefObject<{ av: number; sigmoidea: number; cV: number }> }) {
  const geos = useMemo(() => ({
    mitral: geometriaValvula(datos.valvulas.mitral), tricuspide: geometriaValvula(datos.valvulas.tricuspide),
    aortica: geometriaValvula(datos.valvulas.aortica), pulmonar: geometriaValvula(datos.valvulas.pulmonar),
  }), [datos]);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#d8b9a6', roughness: 0.62, metalness: 0, side: THREE.DoubleSide, sheen: 0.35, sheenColor: new THREE.Color('#f3d6c8'), sheenRoughness: 0.6,
  }), []);
  const cuerdas = useMemo(() => {
    const lista: { v: MallaValvula; c: { v: number; ancla: V3 } }[] = [];
    for (const v of [datos.valvulas.mitral, datos.valvulas.tricuspide]) for (const c of v.cuerdas) lista.push({ v, c });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lista.length * 6), 3));
    return { lista, g };
  }, [datos]);
  const matCuerda = useMemo(() => new THREE.LineBasicMaterial({ color: '#d9c3b0', transparent: true, opacity: 0.7 }), []);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); mat.dispose(); cuerdas.g.dispose(); matCuerda.dispose(); }, [geos, mat, cuerdas, matCuerda]);
  const refs = useRef<Record<string, THREE.Mesh | null>>({});
  const grupo = useRef<THREE.Group>(null);
  useLayoutEffect(() => { Object.values(refs.current).forEach((m) => m?.updateMorphTargets()); }, [geos]);
  useFrame(() => {
    const e = estado.current;
    const r = refs.current;
    const set = (k: string, x: number) => { const m = r[k]; if (m?.morphTargetInfluences) m.morphTargetInfluences[0] = x; };
    set('mitral', e.av); set('tricuspide', e.av); set('aortica', e.sigmoidea); set('pulmonar', e.sigmoidea);
    // el plano valvular baja con la sístole (≈ 1 cm)
    const bajada = -0.1 * e.cV;
    if (grupo.current) grupo.current.position.set(MARCO.ey[0] * bajada, MARCO.ey[1] * bajada, MARCO.ey[2] * bajada);
    const pa = cuerdas.g.getAttribute('position') as THREE.BufferAttribute;
    cuerdas.lista.forEach(({ v, c }, i) => {
      const k = c.v * 3;
      for (let q = 0; q < 3; q++) {
        pa.array[i * 6 + q] = v.cerrada[k + q] + (v.abierta[k + q] - v.cerrada[k + q]) * e.av;
        pa.array[i * 6 + 3 + q] = c.ancla[q] - MARCO.ey[q] * bajada * 0.7; // la cuerda queda en el marco del grupo
      }
    });
    pa.needsUpdate = true;
  });
  return (
    <group ref={grupo}>
      {(Object.keys(geos) as (keyof typeof geos)[]).map((k) => (
        <mesh key={k} ref={(m) => { refs.current[k] = m; }} geometry={geos[k]} material={mat} name={`valvula-${k}`} />
      ))}
      <lineSegments geometry={cuerdas.g} material={matCuerda} />
    </group>
  );
}

// ───────────────────────────── torso, electrodos, Einthoven ─────────────────────────────

export function Torso({ datos }: { datos: DatosCorazon }) {
  const geo = useMemo(() => geometriaMalla(datos.torso), [datos]);
  const mat = useMemo(() => materialTorso(), []);
  const matT = useMemo(() => materialTorso(true), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); matT.dispose(); }, [geo, mat, matT]);
  return (
    <group>
      <mesh geometry={geo} material={matT} renderOrder={4} name="torso-dorso" />
      <mesh geometry={geo} material={mat} renderOrder={5} name="torso" />
    </group>
  );
}

/** Colores AHA de los cables: RA blanco, LA negro, LL rojo. */
export const COLOR_ELECTRODO = { RA: '#f4f4f2', LA: '#26282b', LL: '#d8343a' } as const;

export function Electrodos({ datos }: { datos: DatosCorazon }) {
  const geoDisco = useMemo(() => new THREE.CylinderGeometry(0.085, 0.085, 0.012, 40), []);
  const geoAro = useMemo(() => new THREE.TorusGeometry(0.05, 0.012, 12, 40), []);
  const geoBroche = useMemo(() => new THREE.SphereGeometry(0.02, 20, 12), []);
  const matDisco = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e9ecef', roughness: 0.85 }), []);
  const matBroche = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9cfd4', roughness: 0.25, metalness: 1 }), []);
  const matsAro = useMemo(() => Object.fromEntries((Object.keys(COLOR_ELECTRODO) as (keyof typeof COLOR_ELECTRODO)[])
    .map((k) => [k, new THREE.MeshStandardMaterial({ color: COLOR_ELECTRODO[k], roughness: 0.4 })])) as Record<keyof typeof COLOR_ELECTRODO, THREE.MeshStandardMaterial>, []);
  useEffect(() => () => { geoDisco.dispose(); geoAro.dispose(); geoBroche.dispose(); matDisco.dispose(); matBroche.dispose(); Object.values(matsAro).forEach((m) => m.dispose()); }, [geoDisco, geoAro, geoBroche, matDisco, matBroche, matsAro]);
  return (
    <group>
      {(Object.keys(datos.electrodos) as (keyof typeof COLOR_ELECTRODO)[]).map((k) => {
        const e = datos.electrodos[k];
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...e.normal));
        return (
          <group key={k} position={e.piel} quaternion={q}>
            <mesh geometry={geoDisco} material={matDisco} position={[0, 0.006, 0]} />
            <mesh geometry={geoAro} material={matsAro[k]} position={[0, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={geoBroche} material={matBroche} position={[0, 0.02, 0]} scale={[1, 0.7, 1]} />
          </group>
        );
      })}
    </group>
  );
}

/** Ejes de cada derivación en la escena: segmento a dibujar (de − a +). */
export function ejeDerivacion(d: Derivacion, datos: DatosCorazon): [V3, V3] {
  const e = datos.electrodos;
  const c: V3 = [(e.RA.piel[0] + e.LA.piel[0] + e.LL.piel[0]) / 3, (e.RA.piel[1] + e.LA.piel[1] + e.LL.piel[1]) / 3, (e.RA.piel[2] + e.LA.piel[2] + e.LL.piel[2]) / 3];
  switch (d) {
    case 'I': return [e.RA.piel, e.LA.piel];
    case 'II': return [e.RA.piel, e.LL.piel];
    case 'III': return [e.LA.piel, e.LL.piel];
    case 'aVR': return [c, e.RA.piel];
    case 'aVL': return [c, e.LA.piel];
    default: return [c, e.LL.piel];
  }
}

const ESCALA_DIPOLO = 0.36; // u por mV

/**
 * Triángulo de Einthoven entre los electrodos, el eje de la derivación elegida
 * (flecha hacia su polo +) y la PROYECCIÓN del vector cardiaco sobre ese eje:
 * una barra de longitud ∝ V = D·û (dorada si es +, azul si es −) con la guía
 * punteada desde la punta del vector. Es lo mismo que escribe la pluma.
 */
export function Einthoven({ datos, derivacion, reloj }: { datos: DatosCorazon; derivacion: Derivacion; reloj: RelojCardiaco }) {
  const e = datos.electrodos;
  const tri = useMemo(() => [e.RA.piel, e.LA.piel, e.LL.piel, e.RA.piel] as V3[], [e]);
  const [a, b] = useMemo(() => ejeDerivacion(derivacion, datos), [derivacion, datos]);
  const u = VECTOR_DERIVACION[derivacion];
  const uLen = Math.hypot(u[0], u[1], u[2]);
  const un = useMemo(() => new THREE.Vector3(u[0] / uLen, u[1] / uLen, u[2] / uLen), [u, uLen]);
  // punto del eje más cercano al origen del vector (pie de la proyección)
  const pie = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), C = new THREE.Vector3(...datos.centro);
    const ab = B.clone().sub(A);
    const s = THREE.MathUtils.clamp(C.clone().sub(A).dot(ab) / ab.lengthSq(), 0, 1);
    return A.clone().addScaledVector(ab, s);
  }, [a, b, datos.centro]);
  // punta de flecha del eje en el polo +
  const flecha = useMemo(() => {
    const B = new THREE.Vector3(...b), A = new THREE.Vector3(...a);
    const dir = B.clone().sub(A).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { pos: B.clone().addScaledVector(dir, -0.11), q };
  }, [a, b]);
  const barra = useRef<THREE.Mesh>(null);
  const guia = useRef<Line2>(null);
  const matBarra = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.5), toneMapped: false, depthTest: false, transparent: true, opacity: 0.95 }), []);
  const matPunta = useMemo(() => new THREE.MeshBasicMaterial({ color: '#9fd8ff', toneMapped: false, depthTest: false, transparent: true, opacity: 0.9 }), []);
  useEffect(() => () => { matBarra.dispose(); matPunta.dispose(); }, [matBarra, matPunta]);
  const D = useRef<V3>([0, 0, 0]);
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), y: new THREE.Vector3(0, 1, 0), d: new THREE.Vector3(), arr: new Float32Array(6) }), []);
  useFrame(() => {
    const v = reloj.D; D.current = v;
    const val = v[0] * un.x + v[1] * un.y + v[2] * un.z; // = D·û (mV)
    const L = val * ESCALA_DIPOLO;
    const m = barra.current;
    if (m) {
      const abs = Math.max(1e-4, Math.abs(L));
      tmp.d.copy(un).multiplyScalar(Math.sign(L) || 1);
      tmp.q.setFromUnitVectors(tmp.y, tmp.d);
      m.quaternion.copy(tmp.q);
      m.scale.set(1, abs, 1);
      m.position.copy(pie).addScaledVector(un, L / 2);
      matBarra.color.setRGB(L >= 0 ? 2.3 : 0.35, L >= 0 ? 1.45 : 0.95, L >= 0 ? 0.45 : 2.4);
      m.visible = Math.abs(L) > 0.004;
    }
    const g = guia.current;
    if (g) {
      const c = datos.centro;
      const tip: V3 = [c[0] + v[0] * ESCALA_DIPOLO, c[1] + v[1] * ESCALA_DIPOLO, c[2] + v[2] * ESCALA_DIPOLO];
      const fin = pie.clone().addScaledVector(un, L);
      tmp.arr.set([tip[0], tip[1], tip[2], fin.x, fin.y, fin.z]);
      g.geometry.setPositions(tmp.arr);
      g.computeLineDistances();
      g.visible = Math.abs(L) > 0.02;
    }
  });
  return (
    <group>
      <Line points={tri} color="#8fb8cf" lineWidth={1.4} transparent opacity={0.45} renderOrder={6} />
      <Line points={[a, b]} color="#d7f0ff" lineWidth={2.6} transparent opacity={0.95} renderOrder={7} />
      <mesh position={flecha.pos} quaternion={flecha.q} material={matPunta} renderOrder={7}>
        <coneGeometry args={[0.04, 0.11, 20]} />
      </mesh>
      <mesh ref={barra} material={matBarra} renderOrder={8}>
        <cylinderGeometry args={[0.03, 0.03, 1, 14]} />
      </mesh>
      <Line ref={guia} points={[[0, 0, 0], [0, 0, 0]]} color="#ffe2a8" lineWidth={1.2} dashed dashSize={0.035} gapSize={0.03} transparent opacity={0.7} depthTest={false} renderOrder={8} />
    </group>
  );
}

/** Flecha del vector cardiaco (dipolo) desde el centro eléctrico y una estela corta de su punta (≈ 50 ms): rastro de movimiento, no una gráfica. */
export function Dipolo({ datos, reloj }: { datos: DatosCorazon; reloj: RelojCardiaco }) {
  const grupo = useRef<THREE.Group>(null);
  const astil = useRef<THREE.Mesh>(null);
  const punta = useRef<THREE.Mesh>(null);
  const estela = useRef<Line2>(null);
  const N = 25;
  const colores = useMemo(() => Array.from({ length: N }, (_, i) => { const a = Math.pow(1 - i / (N - 1), 1.3); return [0.35 * a + 0.03, 0.95 * a + 0.05, 1.25 * a + 0.08] as [number, number, number]; }), []);
  const ini = useMemo(() => Array.from({ length: N }, () => datos.centro as V3), [datos.centro]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 1.9, 2.5), toneMapped: false, depthTest: false, transparent: true }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), y: new THREE.Vector3(0, 1, 0), q: new THREE.Quaternion(), D: [0, 0, 0] as V3, arr: new Float32Array(N * 3) }), []);
  useFrame(() => {
    const D = reloj.D;
    const L = Math.hypot(D[0], D[1], D[2]) * ESCALA_DIPOLO;
    const g = grupo.current;
    if (g) {
      g.visible = L > 0.012;
      tmp.v.set(D[0], D[1], D[2]).normalize();
      if (L > 1e-6) g.quaternion.setFromUnitVectors(tmp.y, tmp.v);
      const cabeza = Math.min(0.09, L * 0.45);
      if (astil.current) { astil.current.scale.set(1, Math.max(1e-4, L - cabeza), 1); astil.current.position.set(0, (L - cabeza) / 2, 0); }
      if (punta.current) { punta.current.scale.set(cabeza / 0.09, cabeza / 0.09, cabeza / 0.09); punta.current.position.set(0, L - cabeza / 2, 0); }
    }
    const e = estela.current;
    if (e) {
      const c = datos.centro;
      for (let k = 0; k < N; k++) {
        const s = reloj.muestra(k, tmp.D) ?? ([0, 0, 0] as V3);
        tmp.arr[k * 3] = c[0] + s[0] * ESCALA_DIPOLO; tmp.arr[k * 3 + 1] = c[1] + s[1] * ESCALA_DIPOLO; tmp.arr[k * 3 + 2] = c[2] + s[2] * ESCALA_DIPOLO;
      }
      e.geometry.setPositions(tmp.arr);
      (e.material as LineMaterial).opacity = 0.9;
    }
  });
  return (
    <group>
      <group ref={grupo} position={datos.centro} renderOrder={9}>
        <mesh ref={astil} material={mat} renderOrder={9}><cylinderGeometry args={[0.021, 0.021, 1, 16]} /></mesh>
        <mesh ref={punta} material={mat} renderOrder={9}><coneGeometry args={[0.052, 0.09, 24]} /></mesh>
        <mesh material={mat} renderOrder={9}><sphereGeometry args={[0.032, 20, 14]} /></mesh>
      </group>
      <Line ref={estela} points={ini} vertexColors={colores} lineWidth={2.6} transparent opacity={0.9} depthTest={false} renderOrder={9} toneMapped={false} />
    </group>
  );
}
