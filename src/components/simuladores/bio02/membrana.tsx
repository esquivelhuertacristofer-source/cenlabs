'use client';
/**
 * bio02/membrana.tsx — la vista MEMBRANA: un trozo de la membrana del glóbulo rojo en media
 * sección, a escala (1 u = 1 nm) y a CÁMARA LENTA ×1/300. Fuera (arriba) el plasma con Na⁺, Cl⁻,
 * K⁺, glucosa y O₂; dentro (abajo) el citoplasma con K⁺, Cl⁻, Na⁺, ATP y hemoglobina.
 *
 * El plano z = 0 corta la bicapa y la parte transmembrana de las proteínas (sus dominios de fuera
 * y de dentro quedan enteros): la cara de corte enseña los lípidos de perfil y los caminos por
 * dentro de cada proteína.
 *
 * Cada partícula del medio es UNA molécula real de la caja dibujada (c·V·N_A); las que cruzan
 * salen de las tasas del reloj (`transporte.ts`) con la cámara lenta rotulada:
 *  · BOMBA Na⁺/K⁺: ciclo de Post–Albers con 3 Na⁺, 1 ATP y 2 K⁺ por vuelta; el tiempo de espera
 *    (E1·3Na⁺ esperando ATP) es el que hace que salgan `ciclos·(1/300)` vueltas por segundo.
 *  · GLUT1: gira entre caras a 2·k_cat y en cada giro lleva una glucosa con probabilidad
 *    S/(K_m + S) de la cara de la que sale (en promedio, el flujo de Michaelis–Menten).
 *  · ACUAPORINA: la fila de agua de cada poro avanza con el flujo neto (cada molécula que sale
 *    son 10⁴ reales).
 *  · O₂: cruza la bicapa entre los lípidos (difusión simple, cada uno son 10 reales).
 * El movimiento térmico de las partículas es esquemático (el real es ~10⁶ veces más rápido).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { azar, type Calidad } from '../_kit';
import {
  BICAPA, colasLipido, colesterol, glucosa as geoGlucosa, oxigeno as geoOxigeno, agua as geoAgua, nucleotido, hemoglobina,
  monomeroAcuaporina, hazGlut1, ichGlut1, bombaTM, compuertaBomba, subunidadBeta, globulo, suavizar, teñir, unir, type V3,
} from './geometria';
import { materialCera, materialCorte, materialAlfombra, materialBrillo, planosCorte } from './materiales';
import { enCaja, PARCHE, PAQUETE } from './transporte';
import type { RelojTransporte } from './reloj';

type Reloj = React.MutableRefObject<RelojTransporte>;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ───────────────────────────── cotas ─────────────────────────────

/** Centros de las proteínas (nm, mundo). */
export const PROT = {
  aqp: V(-11.5, 0, -1.6),
  glut: V(-2.6, 0, 0),
  bomba: V(8.6, 0, -0.4),
} as const;
/** Caja de partículas de cada lado: 40 × 5 × 7 nm = PARCHE.cajaNm3 (la que cuenta c·V·N_A). */
const CAJA = { x0: -20, x1: 20, z0: -5.4, z1: -0.4, yIn: 3.1, yOut: 10.1 } as const;
/** Donde el O₂ cruza la bicapa desnuda (x, z). */
const PASOS_O2: [number, number][] = [[-17.2, -1.0], [-6.9, -1.4], [3.0, -0.9], [14.6, -1.2], [-15.6, -2.1], [16.6, -0.8]];
const SITIOS_NA: V3[] = [[-0.55, -0.25, 0.42], [0.15, 0.22, 0.44], [0.72, -0.35, 0.42]];
const SITIOS_K: V3[] = [[-0.35, -0.05, 0.44], [0.5, 0.05, 0.44]];

/** Huellas de las proteínas en la bicapa (x, z, radio x, radio z) para no poner lípidos. */
const HUELLAS: [number, number, number, number][] = [
  [PROT.aqp.x, PROT.aqp.z, 3.7, 3.7],
  [PROT.glut.x, PROT.glut.z, 3.3, 1.75],
  [PROT.bomba.x + 0.35, PROT.bomba.z - 0.55, 3.15, 2.05],
];
const enHuella = (x: number, z: number, margen = 0) => HUELLAS.some(([cx, cz, rx, rz]) => ((x - cx) / (rx + margen)) ** 2 + ((z - cz) / (rz + margen)) ** 2 < 1);

/** ¿Un punto del medio choca con los dominios de fuera de la bicapa? */
function chocaProteina(x: number, y: number, z: number): boolean {
  const b = PROT.bomba;
  if (Math.abs(x - PROT.aqp.x) < 3.9 && Math.abs(z - PROT.aqp.z) < 3.9 && Math.abs(y) < 3.6) return true;
  if (x > PROT.glut.x - 2.6 && x < PROT.glut.x + 2.6 && y > -4.4 && y < -2.5 && z > -2.2) return true;
  if (x > b.x - 4.2 && x < b.x + 4.4 && y > -7.4 && y < -2.4 && z > -3.4) return true;
  if (x > b.x - 0.6 && x < b.x + 4.6 && y > 2.4 && y < 6.4 && z > -3.6) return true;
  return false;
}

/** Puntos que el encuadre debe meter en el lienzo. */
export function puntosMembrana(): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  for (const x of [-19, 19]) for (const y of [-9.6, 9.6]) for (const z of [-6, 0.6]) P.push(V(x, y, z));
  return P;
}

// ───────────────────────────── materiales ─────────────────────────────

/** Movimiento térmico de los lípidos en el shader: un vaivén de 0,05 nm por instancia. */
function conOndulacion<T extends THREE.Material>(m: T, uT: { value: number }, clave: string): T {
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo?.call(m, sh, r);
    sh.uniforms.uTB2 = uT;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTB2;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float faseB2 = float(gl_InstanceID) * 2.39996;
        transformed.y += 0.05 * sin(uTB2 * 1.6 + faseB2);
        transformed.x += 0.03 * sin(uTB2 * 1.1 + faseB2 * 1.7);`);
  };
  const k = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => `${k ? k() : ''}ond${clave}`;
  return m;
}

export interface MatsMembrana {
  cabezaFuera: THREE.MeshPhysicalMaterial; cabezaDentro: THREE.MeshPhysicalMaterial; cola: THREE.MeshPhysicalMaterial;
  colesterol: THREE.MeshPhysicalMaterial; nucleo: THREE.MeshPhysicalMaterial; alfombraFuera: THREE.MeshPhysicalMaterial;
  alfombraDentro: THREE.MeshPhysicalMaterial; proteina: THREE.MeshPhysicalMaterial; brillo: THREE.MeshStandardMaterial;
  uT: { value: number };
}

function useMatsMembrana(): MatsMembrana {
  const mats = useMemo<MatsMembrana>(() => {
    const uT = { value: 0 };
    return {
      uT,
      cabezaFuera: conOndulacion(materialCera({ color: '#ffffff', vertexColors: false, rugosidad: 0.42, sheen: 0.35, clearcoat: 0.3, borde: '#fff6e4', fuerzaBorde: 0.2 }, 'cabezaF'), uT, 'cf'),
      cabezaDentro: conOndulacion(materialCera({ color: '#ffffff', rugosidad: 0.42, sheen: 0.35, clearcoat: 0.3, borde: '#ffe9e0', fuerzaBorde: 0.2 }, 'cabezaD'), uT, 'cd'),
      cola: conOndulacion(materialCera({ color: '#ffffff', vertexColors: true, rugosidad: 0.55, sheen: 0.2, clearcoat: 0.08, borde: '#ffe2a0', fuerzaBorde: 0.1 }, 'cola'), uT, 'co'),
      colesterol: conOndulacion(materialCera({ color: '#ffffff', vertexColors: true, rugosidad: 0.4, sheen: 0.3, clearcoat: 0.25, borde: '#fffbe8', fuerzaBorde: 0.16 }, 'colest'), uT, 'ch'),
      nucleo: materialCorte({ color: '#8a6a2e', rugosidad: 0.85, sheen: 0, clearcoat: 0, fuerzaBorde: 0.04, planos: planosCorte(BICAPA.eCorte), colorSeccion: '#6e5428', pasoRayado: 0.18 }, 'nucleo'),
      alfombraFuera: materialAlfombra('#e9dcc0'),
      alfombraDentro: materialAlfombra('#ebc6ad'),
      proteina: materialCorte({ color: '#ffffff', vertexColors: true, rugosidad: 0.46, sheen: 0.3, clearcoat: 0.22, borde: '#eef6ff', fuerzaBorde: 0.26, planos: planosCorte(BICAPA.eCorte), pasoRayado: 0.16 }, 'prot'),
      brillo: materialBrillo('fosfo'),
    };
  }, []);
  useEffect(() => () => { Object.values(mats).forEach((m) => { if (m instanceof THREE.Material) m.dispose(); }); }, [mats]);
  return mats;
}

// ───────────────────────────── bicapa ─────────────────────────────

interface Lipido { x: number; z: number; giro: number; colesterol: boolean; tono: number; fila: number }

/** Red hexagonal de la hoja: filas desde el corte (z ≈ −0,45) hacia atrás. */
function redLipidos(x0: number, x1: number, filas: number, semilla: number): Lipido[] {
  const rnd = azar(semilla);
  const a = BICAPA.paso, dz = a * Math.sqrt(3) / 2;
  const out: Lipido[] = [];
  for (let j = 0; j < filas; j++) {
    const z = -0.45 - j * dz;
    for (let x = x0 + (j % 2) * a / 2; x <= x1; x += a) {
      const jx = x + (rnd() - 0.5) * 0.12, jz = z + (rnd() - 0.5) * 0.1;
      if (enHuella(jx, jz, 0.15)) continue;
      // ~30 % de colesterol en cada hoja (la membrana del glóbulo rojo tiene casi 1:1 con los fosfolípidos)
      out.push({ x: jx, z: jz, giro: rnd() * Math.PI * 2, colesterol: rnd() < 0.3, tono: rnd(), fila: j });
    }
  }
  return out;
}

/**
 * La bicapa: hoja de fuera entera (cabezas en red hexagonal hasta 9 nm hacia atrás), y las tres
 * filas del corte con sus colas y su colesterol en las dos hojas; detrás, el núcleo hidrófobo y
 * las alfombras de cabezas de la membrana que sigue.
 */
function Bicapa({ mats, calidad }: { mats: MatsMembrana; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const ancho = alta ? 30 : 24;
  const { fuera, dentro } = useMemo(() => ({
    fuera: redLipidos(-ancho, ancho, alta ? 7 : 5, 31),
    dentro: redLipidos(-ancho, ancho, 3, 47),
  }), [ancho, alta]);
  const geos = useMemo(() => {
    const cab = (seg: number) => { const g = teñir(suavizar(new THREE.SphereGeometry(BICAPA.rCabeza, seg, Math.round(seg * 0.7))), '#ffffff'); return g; };
    const colas = colasLipido(4);
    teñir(colas, '#e0b862');
    const oh = teñir(suavizar(new THREE.SphereGeometry(0.2, 8, 6)), '#ffffff');
    return { cabCerca: cab(alta ? 12 : 9), cabLejos: cab(alta ? 8 : 6), colas, ch: colesterol(), oh };
  }, [alta]);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);

  // reparto en mallas instanciadas (el orden de las colas sigue al de las cabezas del corte)
  const reparto = useMemo(() => {
    const corteF = fuera.filter((l) => l.fila < 3), lejosF = fuera.filter((l) => l.fila >= 3);
    return {
      cabCorteF: corteF.filter((l) => !l.colesterol), colasF: corteF.filter((l) => !l.colesterol), chF: corteF.filter((l) => l.colesterol),
      cabLejosF: lejosF.filter((l) => !l.colesterol), ohLejosF: lejosF.filter((l) => l.colesterol),
      cabD: dentro.filter((l) => !l.colesterol), chD: dentro.filter((l) => l.colesterol),
    };
  }, [fuera, dentro]);

  const refs = {
    cabCorteF: useRef<THREE.InstancedMesh>(null), colasF: useRef<THREE.InstancedMesh>(null), chF: useRef<THREE.InstancedMesh>(null),
    cabLejosF: useRef<THREE.InstancedMesh>(null), ohLejosF: useRef<THREE.InstancedMesh>(null),
    cabD: useRef<THREE.InstancedMesh>(null), colasD: useRef<THREE.InstancedMesh>(null), chD: useRef<THREE.InstancedMesh>(null),
  };
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    // fuera: PC y esfingomielina (marfil); dentro: PE y PS (melocotón, algo de rosa en la PS)
    const tonoF = (t: number) => col.set('#f1e6cf').offsetHSL(0, (t - 0.5) * 0.06, (t - 0.5) * 0.08);
    const tonoD = (t: number) => (t < 0.25 ? col.set('#eaa69a') : col.set('#f1caa9')).offsetHSL(0, 0, (t - 0.5) * 0.06);
    const poner = (m: THREE.InstancedMesh | null, lista: Lipido[], y: number, abajo: boolean, color?: (t: number) => THREE.Color, escala = 1) => {
      if (!m) return;
      lista.forEach((l, i) => {
        o.position.set(l.x, y, l.z);
        o.rotation.set(abajo ? Math.PI : 0, l.giro, 0);
        o.scale.setScalar(escala);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        if (color) m.setColorAt(i, color(l.tono));
      });
      m.count = lista.length;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    };
    const y = BICAPA.yCabeza;
    poner(refs.cabCorteF.current, reparto.cabCorteF, y, false, tonoF);
    poner(refs.colasF.current, reparto.colasF, y, false);
    poner(refs.chF.current, reparto.chF, 1.85, false);
    poner(refs.cabLejosF.current, reparto.cabLejosF, y, false, tonoF);
    poner(refs.ohLejosF.current, reparto.ohLejosF, 1.9, false, () => col.set('#f7f1e8'));
    poner(refs.cabD.current, reparto.cabD, -y, true, tonoD);
    poner(refs.colasD.current, reparto.cabD, -y, true);
    poner(refs.chD.current, reparto.chD, -1.85, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reparto]);

  // detrás de las filas del corte: núcleo hidrófobo y alfombras de cabezas (membrana que sigue)
  const geoNucleo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const geoPlano = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => { geoNucleo.dispose(); geoPlano.dispose(); }, [geoNucleo, geoPlano]);
  const zCorte3 = -0.45 - 3 * BICAPA.paso * Math.sqrt(3) / 2 + 0.25;
  const yN = BICAPA.yColaArriba;
  return (
    <group userData={{ pieza: 'bicapa' }}>
      <instancedMesh ref={refs.cabCorteF} args={[geos.cabCerca, mats.cabezaFuera, reparto.cabCorteF.length]} castShadow receiveShadow userData={{ pieza: 'cabeza' }} />
      <instancedMesh ref={refs.colasF} args={[geos.colas, mats.cola, reparto.colasF.length]} castShadow receiveShadow userData={{ pieza: 'cola' }} />
      <instancedMesh ref={refs.chF} args={[geos.ch, mats.colesterol, Math.max(1, reparto.chF.length)]} castShadow userData={{ pieza: 'colesterol' }} />
      <instancedMesh ref={refs.cabLejosF} args={[geos.cabLejos, mats.cabezaFuera, reparto.cabLejosF.length]} receiveShadow userData={{ pieza: 'cabeza' }} />
      <instancedMesh ref={refs.ohLejosF} args={[geos.oh, mats.colesterol, Math.max(1, reparto.ohLejosF.length)]} userData={{ pieza: 'colesterol' }} />
      <instancedMesh ref={refs.cabD} args={[geos.cabCerca, mats.cabezaDentro, reparto.cabD.length]} castShadow receiveShadow userData={{ pieza: 'cabezaD' }} />
      <instancedMesh ref={refs.colasD} args={[geos.colas, mats.cola, reparto.cabD.length]} castShadow receiveShadow userData={{ pieza: 'cola' }} />
      <instancedMesh ref={refs.chD} args={[geos.ch, mats.colesterol, Math.max(1, reparto.chD.length)]} castShadow userData={{ pieza: 'colesterol' }} />
      {/* núcleo hidrófobo detrás de las filas del corte y a los lados (su cara de corte, rayada) */}
      <mesh geometry={geoNucleo} material={mats.nucleo} position={[0, 0, (zCorte3 - 70) / 2]} scale={[140, 2 * yN, 70 + zCorte3]} receiveShadow userData={{ pieza: 'nucleo' }} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoNucleo} material={mats.nucleo} position={[s * (ancho + 0.4 + 35), 0, (zCorte3 - 0.55) / 2]} scale={[70, 2 * yN, Math.abs(zCorte3 + 0.55)]} />
      ))}
      {/* alfombras: la hoja de fuera sigue hasta el horizonte; la de dentro, por si se mira desde abajo */}
      <mesh geometry={geoPlano} material={mats.alfombraFuera} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.93, -35.3]} scale={[140, 70, 1]} receiveShadow userData={{ pieza: 'bicapa' }} />
      <mesh geometry={geoPlano} material={mats.alfombraDentro} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.93, -35.3]} scale={[140, 70, 1]} userData={{ pieza: 'bicapa' }} />
    </group>
  );
}

// ───────────────────────────── proteínas ─────────────────────────────

export interface PartesMoviles {
  glutN: React.RefObject<THREE.Group | null>;
  glutC: React.RefObject<THREE.Group | null>;
  bombaA: React.RefObject<THREE.Group | null>;
  bombaN: React.RefObject<THREE.Group | null>;
  compFuera: React.RefObject<THREE.Group | null>;
  compDentro: React.RefObject<THREE.Group | null>;
  fosfo: React.RefObject<THREE.InstancedMesh | null>;
}

/** Una familia de color por proteína: acuaporina turquesa, GLUT1 azul, bomba violeta (β rosa). */
const COL = {
  aqp: ['#2bb5a0', '#36c2ab', '#25a291', '#3fbfae'],
  glutN: '#4d8fe6', glutC: '#3f7bd6', ich: '#6f9fe0',
  alfa: '#8b6fd6', P: '#7457c4', N: '#a98bea', A: '#9a7fe0', beta: '#e79cc4',
};

function Proteinas({ mats, partes }: { mats: MatsMembrana; partes: PartesMoviles }) {
  const geos = useMemo(() => {
    const aqp = unir([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => {
      const g = monomeroAcuaporina(COL.aqp[i], i + 1);
      g.rotateY(i * Math.PI / 2 + 0.3);
      g.translate(sx * 1.6, 0, sz * 1.6);
      return g;
    }));
    return {
      aqp,
      glutN: hazGlut1(-1, COL.glutN, 40), glutC: hazGlut1(1, COL.glutC, 50), ich: ichGlut1(COL.ich),
      tm: bombaTM(COL.alfa), comp: compuertaBomba('#a48ce4'), beta: subunidadBeta(COL.beta),
      P: unir([globulo([0.1, -4.0, -0.8], [1.6, 1.15, 1.45], COL.P, 71), globulo([0.9, -3.3, -0.2], [0.7, 0.55, 0.6], COL.P, 72, 2)]),
      N: globulo([0.75, -1.1, -0.1], [1.45, 1.3, 1.35], COL.N, 73),
      A: unir([globulo([-0.4, 0, 0], [1.35, 1.15, 1.25], COL.A, 74), globulo([0.6, 0.55, 0.35], [0.55, 0.45, 0.5], COL.A, 75, 2)]),
      fosfo: new THREE.SphereGeometry(0.3, 12, 8),
    };
  }, []);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  const b = PROT.bomba, g = PROT.glut, a = PROT.aqp;
  return (
    <group>
      {/* acuaporina 1: tetrámero, el corte pasa por el eje de los dos poros de delante */}
      <mesh geometry={geos.aqp} material={mats.proteina} position={a} castShadow receiveShadow userData={{ pieza: 'aqp' }} />
      {/* GLUT1: dos haces que se balancean (acceso alterno) y su dominio intracelular */}
      <group position={g} userData={{ pieza: 'glut' }}>
        <group ref={partes.glutN} position={[-1.45, 0, 0]}><mesh geometry={geos.glutN} material={mats.proteina} position={[1.45, 0, 0]} castShadow receiveShadow /></group>
        <group ref={partes.glutC} position={[1.45, 0, 0]}><mesh geometry={geos.glutC} material={mats.proteina} position={[-1.45, 0, 0]} castShadow receiveShadow /></group>
        <mesh geometry={geos.ich} material={mats.proteina} castShadow receiveShadow />
      </group>
      {/* Na⁺/K⁺-ATPasa: α (TM, compuertas, dominios A, N y P) y β con sus glicanos */}
      <group position={b} userData={{ pieza: 'bomba' }}>
        <mesh geometry={geos.tm} material={mats.proteina} castShadow receiveShadow />
        <group ref={partes.compFuera} position={[-0.95, 0, 0.75]}><mesh geometry={geos.comp} material={mats.proteina} castShadow /></group>
        <group ref={partes.compDentro} position={[0.35, 0, 1.0]}><mesh geometry={geos.comp} material={mats.proteina} castShadow /></group>
        <mesh geometry={geos.P} material={mats.proteina} castShadow receiveShadow userData={{ pieza: 'bombaP' }} />
        <group ref={partes.bombaN} position={[1.45, -4.3, -0.8]} userData={{ pieza: 'bombaN' }}><mesh geometry={geos.N} material={mats.proteina} castShadow receiveShadow /></group>
        <group ref={partes.bombaA} position={[-2.35, -3.9, -0.6]} userData={{ pieza: 'bombaA' }}><mesh geometry={geos.A} material={mats.proteina} castShadow receiveShadow /></group>
        <mesh geometry={geos.beta} material={mats.proteina} castShadow receiveShadow userData={{ pieza: 'beta' }} />
        <instancedMesh ref={partes.fosfo} args={[geos.fosfo, mats.brillo, 1]} position={[0.75, -2.85, 0.55]} />
      </group>
    </group>
  );
}

// ───────────────────────────── partículas ─────────────────────────────

const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P3 = new THREE.Vector3();
const S3 = new THREE.Vector3();
function poner(m: THREE.InstancedMesh, i: number, p: THREE.Vector3 | V3, s: number, rx = 0, ry = 0, rz = 0) {
  if (Array.isArray(p)) P3.set(p[0], p[1], p[2]); else P3.copy(p);
  E.set(rx, ry, rz); Q.setFromEuler(E); S3.setScalar(Math.max(s, 1e-4));
  M4.compose(P3, Q, S3);
  m.setMatrixAt(i, M4);
}
const suave = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
const lerp3 = (a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) => out.copy(a).lerp(b, t);

/** Una población (de un lado) con hogares fijos y vaivén térmico esquemático. */
interface Poblacion { hogar: THREE.Vector3[]; fase: Float32Array; esc: Float32Array }
function poblacion(n: number, lado: 1 | -1, semilla: number, filtro?: (p: THREE.Vector3) => boolean, separacion = 0): Poblacion {
  const rnd = azar(semilla);
  const hogar: THREE.Vector3[] = [];
  let intentos = 0;
  while (hogar.length < n && intentos < n * 200) {
    intentos++;
    const x = CAJA.x0 + rnd() * (CAJA.x1 - CAJA.x0);
    const y = lado * (CAJA.yIn + rnd() * (CAJA.yOut - CAJA.yIn));
    const z = CAJA.z0 + rnd() * (CAJA.z1 - CAJA.z0);
    if (chocaProteina(x, y, z)) continue;
    const p = V(x, y, z);
    if (filtro && !filtro(p)) continue;
    if (separacion > 0 && hogar.some((h) => h.distanceTo(p) < separacion)) continue;
    hogar.push(p);
  }
  const fase = new Float32Array(hogar.length * 3);
  for (let i = 0; i < fase.length; i++) fase[i] = rnd() * Math.PI * 2;
  return { hogar, fase, esc: new Float32Array(hogar.length) };
}
/** Posición de un miembro de la población en el instante t (vaivén de ±0,45 nm). */
function enPoblacion(pb: Poblacion, i: number, t: number, lado: 1 | -1, out: THREE.Vector3): THREE.Vector3 {
  const h = pb.hogar[i], f = pb.fase;
  out.set(
    h.x + 0.45 * Math.sin(t * 0.55 + f[3 * i]),
    h.y + 0.38 * Math.sin(t * 0.47 + f[3 * i + 1]),
    h.z + 0.4 * Math.sin(t * 0.61 + f[3 * i + 2]),
  );
  if (lado > 0) out.y = Math.max(out.y, CAJA.yIn - 0.15); else out.y = Math.min(out.y, -CAJA.yIn + 0.15);
  return out;
}

/**
 * Un viajero: una molécula que recorre un camino (puntos). Si sale del medio aparece con un
 * fundido (`aparece`); si acaba en el medio se funde con él (`queda` = false); si acaba en un
 * sitio de unión se queda ahí hasta el paso siguiente.
 */
interface Viajero { activo: boolean; camino: THREE.Vector3[]; t: number; dur: number; giro: number; queda: boolean; aparece: boolean }
function enCamino(v: Viajero, out: THREE.Vector3) {
  const n = v.camino.length - 1;
  const u = suave(Math.max(0, Math.min(v.t, v.dur)) / v.dur) * n;
  const k = Math.min(n - 1, Math.floor(u));
  return lerp3(v.camino[k], v.camino[k + 1], u - k, out);
}
/** Escala de un viajero (fundidos de entrada y salida); 0 = ya no se ve. */
function escalaViajero(v: Viajero): number {
  if (!v.activo) return 0;
  const ent = v.aparece ? suave((v.t + 0.0001) / 0.3) : 1;
  const sal = !v.queda && v.t > v.dur ? 1 - suave((v.t - v.dur) / 0.45) : 1;
  return ent * sal;
}
const FUNDIDO = 0.45;

const CAP = { na: 220, k: 210, cl: 310, glu: 40, hb: 10, atp: 6 } as const;
const R_ION = { na: 0.3, k: 0.34, cl: 0.37 } as const;
export const COLOR_PARTICULA = {
  na: '#f4a340', k: '#a173ef', cl: '#62cf84', glu: '#fff1cf', o2: '#ff5a4e', agua: '#9fd8f5', atp: '#4fc3c9', hb: '#c8283a',
} as const;

/** Duraciones (s de pantalla) de los pasos fijos del ciclo de la bomba. */
const PASOS_BOMBA = [0.9, 0.8, 0.45, 0.75, 0.9, 0.9, 0.45, 0.75, 0.9] as const;
const T_FIJO_BOMBA = PASOS_BOMBA.reduce((a, b) => a + b, 0);
const viajeroVacio = (): Viajero => ({ activo: false, camino: [V(0, 0, 0), V(0, 0, 0)], t: 0, dur: 1, giro: 0, queda: false, aparece: false });
const C_TMP = new THREE.Color();
const C_DESOXI = new THREE.Color('#4a1824'), C_OXI = new THREE.Color('#a8333f'), C_FOSFO = new THREE.Color('#ffb347');

/** Bocas y sitio de GLUT1 (mundo). */
const G_SITIO = V(PROT.glut.x, 0, 0.05), G_BOCA_F = V(PROT.glut.x, 2.65, 0.05), G_BOCA_D = V(PROT.glut.x, -2.75, 0.3);
/** Poros de los dos monómeros de delante de la acuaporina (el corte pasa por su eje). */
const POROS = [V(PROT.aqp.x - 1.6, 0, PROT.aqp.z + 1.6), V(PROT.aqp.x + 1.6, 0, PROT.aqp.z + 1.6)];
const SEP_AGUA = 0.72, N_FILA = 6;

interface EstadoFenomeno {
  gen: number; primero: boolean; rnd: () => number;
  bomba: { paso: number; t: number; espera: number; esperando: boolean; nas: Viajero[]; ks: Viajero[]; atp: Viajero; adp: Viajero; pi: Viajero };
  glut: { lado: 1 | -1; t: number; girando: boolean; cargado: Viajero | null; viajes: Viajero[] };
  filaAgua: number[]; salidasAgua: Viajero[]; o2: Viajero[]; acO2: number;
}

/** Lo que pasa en la membrana: partículas, las tres máquinas y el O₂. Un solo useFrame. */
function Fenomeno({ reloj, partes, calidad }: { reloj: Reloj; partes: PartesMoviles; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const geos = useMemo(() => ({
    ion: teñir(suavizar(new THREE.IcosahedronGeometry(1, 1)), '#ffffff'),
    glu: geoGlucosa(), o2: geoOxigeno(), agua: geoAgua(), atp: nucleotido(3), adp: nucleotido(2), pi: nucleotido(1), hb: hemoglobina(alta ? 2 : 1),
  }), [alta]);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  const mats = useMemo(() => ({
    na: materialCera({ color: COLOR_PARTICULA.na, rugosidad: 0.3, clearcoat: 0.6, sheen: 0.2, borde: '#ffe2b8', fuerzaBorde: 0.3 }, 'na'),
    k: materialCera({ color: COLOR_PARTICULA.k, rugosidad: 0.3, clearcoat: 0.6, sheen: 0.2, borde: '#e6d8ff', fuerzaBorde: 0.3 }, 'k'),
    cl: materialCera({ color: COLOR_PARTICULA.cl, rugosidad: 0.32, clearcoat: 0.5, sheen: 0.2, borde: '#dcffe6', fuerzaBorde: 0.28 }, 'cl'),
    glu: materialCera({ color: COLOR_PARTICULA.glu, vertexColors: true, rugosidad: 0.35, clearcoat: 0.5, borde: '#ffffff', fuerzaBorde: 0.3 }, 'glu'),
    o2: materialCera({ color: COLOR_PARTICULA.o2, vertexColors: true, rugosidad: 0.3, clearcoat: 0.6, borde: '#ffd0c8', fuerzaBorde: 0.35 }, 'o2'),
    agua: materialCera({ color: '#ffffff', vertexColors: true, rugosidad: 0.2, clearcoat: 0.8, borde: '#e8f8ff', fuerzaBorde: 0.35 }, 'agua'),
    nuc: materialCera({ color: '#ffffff', vertexColors: true, rugosidad: 0.35, clearcoat: 0.5, borde: '#fff2d8', fuerzaBorde: 0.28 }, 'nuc'),
    hb: materialCera({ color: COLOR_PARTICULA.hb, vertexColors: true, rugosidad: 0.62, sheen: 0.25, clearcoat: 0.08, borde: '#e08a8a', fuerzaBorde: 0.12 }, 'hb'),
  }), []);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); }, [mats]);

  // poblaciones de cada lado (hogares fijos; el número visible sale de la concentración)
  const pob = useMemo(() => {
    // la hemoglobina (~6 nm) primero, en la mitad baja de la caja; lo demás no se le mete dentro
    const lejosDeProteinas = (p: THREE.Vector3) => [[PROT.bomba.x, -4.6], [PROT.glut.x, -3.6], [PROT.aqp.x, -3]].every(([x, y]) => Math.hypot(p.x - x, p.y - y) > 6.2);
    const hb = poblacion(CAP.hb, -1, 110, (p) => p.y < -5.6 && p.z < -2.2 && lejosDeProteinas(p), 5.8);
    const evitaHb = (p: THREE.Vector3) => hb.hogar.every((h) => h.distanceTo(p) > 3.1);
    return {
      naF: poblacion(200, 1, 101), naD: poblacion(20, -1, 102, evitaHb),
      kF: poblacion(10, 1, 103), kD: poblacion(200, -1, 104, evitaHb),
      clF: poblacion(200, 1, 105), clD: poblacion(110, -1, 106, evitaHb),
      gluF: poblacion(20, 1, 107), gluD: poblacion(20, -1, 108, evitaHb),
      atpD: poblacion(CAP.atp, -1, 109, (p) => p.x > 0 && evitaHb(p)),
      hb,
    };
  }, []);

  const im = {
    na: useRef<THREE.InstancedMesh>(null), k: useRef<THREE.InstancedMesh>(null), cl: useRef<THREE.InstancedMesh>(null),
    glu: useRef<THREE.InstancedMesh>(null), o2: useRef<THREE.InstancedMesh>(null), agua: useRef<THREE.InstancedMesh>(null),
    atp: useRef<THREE.InstancedMesh>(null), adp: useRef<THREE.InstancedMesh>(null), pi: useRef<THREE.InstancedMesh>(null),
    hb: useRef<THREE.InstancedMesh>(null),
  };

  const est = useRef<EstadoFenomeno | null>(null);
  if (!est.current) {
    est.current = {
      gen: -1, primero: true, rnd: azar(77),
      bomba: { paso: 0, t: 0, espera: 0, esperando: false, nas: [0, 1, 2].map(viajeroVacio), ks: [0, 1].map(viajeroVacio), atp: viajeroVacio(), adp: viajeroVacio(), pi: viajeroVacio() },
      glut: { lado: 1, t: 0, girando: false, cargado: null, viajes: [0, 1, 2, 3].map(viajeroVacio) },
      filaAgua: [0, 0.31], salidasAgua: Array.from({ length: 16 }, viajeroVacio), o2: Array.from({ length: 16 }, viajeroVacio), acO2: 0,
    };
  }

  useFrame(() => {
    const r = reloj.current, l = r.lectura, e = est.current!;
    const t = r.tAnim, dt = r.dtPantalla, F = r.factor, rnd = e.rnd;
    const genNueva = e.gen !== r.generacion;
    e.gen = r.generacion;
    const primero = e.primero;
    e.primero = false;

    // ─── poblaciones: cuántas hay de cada una en la caja (moléculas reales: c·V·N_A) ───
    const nC = (mM: number) => Math.round(enCaja(mM, PARCHE.cajaNm3));
    const fundir = primero ? 1 : Math.min(1, dt * 2.5);
    // sólo se escriben las que se ven (o se están desvaneciendo): las demás no se dibujan
    const pintarPob = (m: THREE.InstancedMesh | null, base: number, p: Poblacion, n: number, lado: 1 | -1, radio: number, gira = false) => {
      if (!m) return base;
      let k = base;
      for (let i = 0; i < p.hogar.length; i++) {
        p.esc[i] += ((i < n ? 1 : 0) - p.esc[i]) * fundir;
        if (p.esc[i] < 0.01) continue;
        const s = p.esc[i] * radio;
        enPoblacion(p, i, t, lado, P3);
        if (gira) poner(m, k, P3, s, t * 0.4 + p.fase[3 * i], t * 0.3 + p.fase[3 * i + 1], 0);
        else { M4.makeScale(s, s, s); M4.setPosition(P3); m.setMatrixAt(k, M4); }
        k++;
      }
      return k;
    };
    const naM = im.na.current, kM = im.k.current, clM = im.cl.current, gluM = im.glu.current;
    let iNa = pintarPob(naM, 0, pob.naF, nC(l.naOut), 1, R_ION.na);
    iNa = pintarPob(naM, iNa, pob.naD, nC(l.naIn), -1, R_ION.na);
    let iK = pintarPob(kM, 0, pob.kF, nC(l.kOut), 1, R_ION.k);
    iK = pintarPob(kM, iK, pob.kD, nC(l.kIn), -1, R_ION.k);
    let iCl = pintarPob(clM, 0, pob.clF, nC(l.clOut), 1, R_ION.cl);
    iCl = pintarPob(clM, iCl, pob.clD, nC(l.clIn), -1, R_ION.cl);
    let iGlu = pintarPob(gluM, 0, pob.gluF, nC(l.gOut), 1, 1, true);
    iGlu = pintarPob(gluM, iGlu, pob.gluD, nC(l.gIn), -1, 1, true);
    const iAtp = pintarPob(im.atp.current, 0, pob.atpD, nC(l.atp), -1, 1, true);
    const nHb = pintarPob(im.hb.current, 0, pob.hb, nC(l.hb), -1, 1, true);
    if (im.hb.current) im.hb.current.count = nHb;
    // hemoglobina: de rojo oscuro (desoxi) a escarlata (oxi) con la saturación del modelo
    if (im.hb.current) (im.hb.current.material as THREE.MeshPhysicalMaterial).color.copy(C_DESOXI).lerp(C_OXI, l.sat);

    const avanzar = (v: Viajero) => { if (v.activo) { v.t += dt; if (!v.queda && v.t > v.dur + FUNDIDO) v.activo = false; } };
    const pintarViajero = (m: THREE.InstancedMesh | null, i: number, v: Viajero, s: number, gira = false) => {
      if (!m) return;
      const k = escalaViajero(v) * s;
      if (k <= 1e-3) { M4.makeScale(1e-4, 1e-4, 1e-4); m.setMatrixAt(i, M4); return; }
      enCamino(v, P3);
      if (gira) poner(m, i, P3, k, v.giro + t * 0.5, t * 0.7 + v.giro, 0);
      else { M4.makeScale(k, k, k); M4.setPosition(P3); m.setMatrixAt(i, M4); }
    };
    const lanzar = (v: Viajero, camino: THREE.Vector3[], dur: number, queda: boolean, aparece: boolean, t0 = 0) => {
      v.activo = true; v.camino = camino; v.dur = dur; v.t = t0; v.queda = queda; v.aparece = aparece; v.giro = rnd() * 6.28;
    };
    const desdeMedio = (lado: 1 | -1, cerca: THREE.Vector3) => V(cerca.x + (rnd() - 0.5) * 6, lado * (4.4 + rnd() * 3), Math.min(-0.8, cerca.z - 1.2 - rnd() * 3));

    // ─── bomba Na⁺/K⁺ (ciclo de Post–Albers) ───
    const b = e.bomba, bc = PROT.bomba;
    const W = (p: V3) => V(bc.x + p[0], bc.y + p[1], bc.z + p[2]);
    const ciclosPantalla = l.bomba.ciclos / F;
    const periodo = ciclosPantalla > 1e-9 ? 1 / ciclosPantalla : Infinity;
    // si el ritmo pide menos que los pasos fijos, se aceleran; si pide más, se espera al ATP
    const escala = periodo < T_FIJO_BOMBA ? periodo / T_FIJO_BOMBA : 1;
    const esperaNecesaria = Math.max(0, periodo - T_FIJO_BOMBA);
    const dur = (k: number) => PASOS_BOMBA[k] * escala;
    const entDentro = W([0.45, -2.75, 0.45]), entFuera = W([-0.35, 2.75, 0.45]);
    const sitioATP = W([1.75, -4.15, 0.55]), sitioP = W([0.75, -2.85, 0.55]);
    const iniciarPaso = (k: number) => {
      b.paso = k; b.t = 0;
      if (k === 0) b.nas.forEach((v, i) => lanzar(v, [desdeMedio(-1, entDentro), entDentro.clone().add(V(0, -0.7, 0)), entDentro, W(SITIOS_NA[i])], dur(0), true, true, -i * 0.18));
      if (k === 1) { b.esperando = true; b.espera = 0; }
      if (k === 2) { b.atp.activo = false; lanzar(b.adp, [sitioATP, sitioATP.clone().add(V(1.2, -1.0, 0.6)), V(bc.x + 4.5, -7.5, -1.5)], 1.6 * escala, false, false); }
      if (k === 4) b.nas.forEach((v, i) => lanzar(v, [W(SITIOS_NA[i]), entFuera, entFuera.clone().add(V(-0.4 + i * 0.4, 0.8, 0)), desdeMedio(1, entFuera)], dur(4) + 0.6, false, false, -i * 0.15));
      if (k === 5) b.ks.forEach((v, i) => lanzar(v, [desdeMedio(1, entFuera), entFuera.clone().add(V(0, 0.7, 0)), entFuera, W(SITIOS_K[i])], dur(5), true, true, -i * 0.2));
      if (k === 6) lanzar(b.pi, [sitioP, sitioP.clone().add(V(-0.4, -1.4, 0.6)), V(bc.x - 2 + rnd() * 2, -7.2, -1.2)], 1.6 * escala, false, false);
      if (k === 8) b.ks.forEach((v, i) => lanzar(v, [W(SITIOS_K[i]), entDentro, entDentro.clone().add(V(0.3 * i, -0.8, 0)), desdeMedio(-1, entDentro)], dur(8) + 0.6, false, false, -i * 0.15));
    };
    if (genNueva) { [...b.nas, ...b.ks, b.atp, b.adp, b.pi].forEach((v) => { v.activo = false; }); iniciarPaso(0); }
    if (dt > 0) {
      if (b.esperando) {
        // E1·3Na⁺ esperando el ATP: esta espera es la que fija el ritmo medio del modelo
        b.espera += dt;
        if (b.espera >= esperaNecesaria) {
          b.esperando = false; b.t = 0;
          lanzar(b.atp, [V(bc.x + 3 + rnd() * 2, -6.6 - rnd(), -1.4), sitioATP.clone().add(V(0.6, -0.8, 0.3)), sitioATP], dur(1), true, true);
        }
      } else {
        b.t += dt;
        if (b.t >= dur(b.paso)) iniciarPaso((b.paso + 1) % PASOS_BOMBA.length);
      }
      [...b.nas, ...b.ks, b.atp, b.adp, b.pi].forEach(avanzar);
    }
    // poses del ciclo: N se cierra sobre el ATP, A gira (E1P → E2P), las compuertas abren a un lado
    const f = b.esperando ? 0 : Math.min(1, b.t / Math.max(1e-6, dur(b.paso)));
    const p = b.paso;
    const conATP = p === 1 ? suave(f) : p === 2 ? 1 : p === 3 ? 1 - suave(f) : 0;
    const aGiro = p === 3 ? suave(f) : p >= 4 && p <= 6 ? 1 : p === 7 ? 1 - suave(f) : 0;
    const abFuera = p === 4 ? Math.min(1, f * 3) : p === 5 ? Math.min(1, (1 - f) * 3) : 0;
    const abDentro = p === 8 ? Math.min(1, f * 3) : p === 0 ? Math.min(1, (1 - f) * 3) : 0;
    if (partes.bombaN.current) partes.bombaN.current.rotation.set(0, 0, conATP * 0.32);
    if (partes.bombaA.current) { partes.bombaA.current.rotation.set(0, aGiro * 1.1, -aGiro * 0.18); partes.bombaA.current.position.set(-2.35 + aGiro * 0.55, -3.9 - aGiro * 0.25, -0.6); }
    if (partes.compFuera.current) partes.compFuera.current.rotation.set(0, 0, abFuera * 0.2);
    if (partes.compDentro.current) partes.compDentro.current.rotation.set(0, 0, -abDentro * 0.2);
    const fosfo = partes.fosfo.current;
    if (fosfo) {
      // el aspartato fosforilado (E1P/E2P): el único emisor de la escena, con un destello al formarse
      const on = p >= 2 && p <= 5 ? 1 : 0;
      const destello = p === 2 ? 1 - f : 0;
      const s = on * (0.55 + destello * 0.45) + 1e-4;
      M4.makeScale(s, s, s);
      fosfo.setMatrixAt(0, M4);
      fosfo.setColorAt(0, C_TMP.copy(C_FOSFO).multiplyScalar(alta ? 1.1 + 2.4 * destello : 0.9 + destello * 0.4));
      fosfo.instanceMatrix.needsUpdate = true;
      if (fosfo.instanceColor) fosfo.instanceColor.needsUpdate = true;
    }
    b.nas.forEach((v, i) => pintarViajero(naM, iNa + i, v, R_ION.na * 1.1));
    b.ks.forEach((v, i) => pintarViajero(kM, iK + i, v, R_ION.k * 1.1));
    iNa += 3; iK += 2;
    pintarViajero(im.atp.current, iAtp, b.atp, 1, true);
    pintarViajero(im.adp.current, 0, b.adp, 1, true);
    pintarViajero(im.pi.current, 0, b.pi, 1, true);

    // ─── GLUT1 (acceso alterno): gira a 2·k_cat, carga con probabilidad S/(K_m+S) ───
    const g = e.glut;
    const girosPantalla = l.glut.giros / F;
    const periodoG = girosPantalla > 1e-9 ? 1 / girosPantalla : Infinity;
    const tGiro = Math.min(0.35, periodoG * 0.45);
    const nuevaCarga = () => {
      const boca = g.lado > 0 ? G_BOCA_F : G_BOCA_D;
      if (g.cargado) lanzar(g.cargado, [G_SITIO.clone(), boca.clone(), desdeMedio(g.lado, boca)], 1.1, false, false);
      g.cargado = null;
      if (rnd() < (g.lado > 0 ? l.glut.pFuera : l.glut.pDentro)) {
        const v = g.viajes.find((x) => !x.activo);
        if (v) {
          lanzar(v, [desdeMedio(g.lado, boca), boca.clone().add(V(0, g.lado * 0.8, 0)), boca.clone(), G_SITIO.clone()], Math.max(0.25, Math.min(1, (periodoG - tGiro) * 0.8)), true, true);
          g.cargado = v;
        }
      }
    };
    if (genNueva) { g.viajes.forEach((v) => { v.activo = false; }); g.cargado = null; g.lado = 1; g.t = 0; g.girando = false; nuevaCarga(); }
    if (dt > 0) {
      g.t += dt;
      if (!g.girando && g.t >= periodoG - tGiro) { g.girando = true; g.t = 0; }
      else if (g.girando && g.t >= tGiro) { g.girando = false; g.t = 0; g.lado = g.lado > 0 ? -1 : 1; nuevaCarga(); }
      g.viajes.forEach(avanzar);
    }
    // balancín: +θ abierto afuera, −θ abierto adentro
    const th = 0.16 * (g.girando ? g.lado * (1 - 2 * suave(g.t / tGiro)) : g.lado);
    if (partes.glutN.current) partes.glutN.current.rotation.z = th;
    if (partes.glutC.current) partes.glutC.current.rotation.z = -th;
    g.viajes.forEach((v, i) => pintarViajero(gluM, iGlu + i, v, 1.1, true));
    iGlu += g.viajes.length;

    // ─── acuaporina: la fila de agua de los dos poros de delante avanza con el flujo neto ───
    const aguaM = im.agua.current;
    if (aguaM) {
      const porPoro = l.aguaTetramero / 4 / F / PAQUETE.agua;   // dibujadas por s de pantalla y poro (+: entran)
      let iAg = 0;
      POROS.forEach((poro, k) => {
        const antes = e.filaAgua[k];
        e.filaAgua[k] -= porPoro * SEP_AGUA * dt;
        const cruces = Math.floor(antes / SEP_AGUA) - Math.floor(e.filaAgua[k] / SEP_AGUA);
        for (let c = 0; c < Math.min(4, Math.abs(cruces)); c++) {
          const v = e.salidasAgua.find((x) => !x.activo); if (!v) break;
          const s = cruces > 0 ? -1 : 1;
          const fin = V(poro.x, s * 2.5, poro.z + 0.05);
          lanzar(v, [fin, fin.clone().add(V((rnd() - 0.5) * 1.2, s * 1.2, -0.3)), V(poro.x + (rnd() - 0.5) * 5, s * (4.5 + rnd() * 2), poro.z - 1 - rnd() * 2)], 1.4, false, false);
        }
        const L = N_FILA * SEP_AGUA;
        for (let j = 0; j < N_FILA; j++) {
          const y = ((((e.filaAgua[k] + j * SEP_AGUA) % L) + L) % L) - L / 2 + SEP_AGUA / 2;
          const borde = 1 - suave((Math.abs(y) - 1.7) / 0.45);
          P3.set(poro.x + 0.04 * Math.sin(t * 3 + j * 1.7 + k), y, poro.z + 0.05);
          poner(aguaM, iAg++, P3, borde, 0.3 * j, t * 0.8 + j, 0);
        }
      });
      e.salidasAgua.forEach((v) => { avanzar(v); pintarViajero(aguaM, iAg++, v, 1, true); });
      aguaM.count = iAg;
    }

    // ─── O₂: difusión simple entre los lípidos (cada uno = 10 moléculas) ───
    const o2M = im.o2.current;
    if (o2M) {
      e.acO2 += (Math.abs(l.o2Parche) / F / PAQUETE.o2) * dt;
      while (e.acO2 >= 1) {
        e.acO2 -= 1;
        const v = e.o2.find((x) => !x.activo); if (!v) { e.acO2 = 0; break; }
        const [px, pz] = PASOS_O2[Math.floor(rnd() * PASOS_O2.length)];
        const s = l.o2Parche > 0 ? 1 : -1;
        const x = px + (rnd() - 0.5) * 0.8, z = pz + (rnd() - 0.5) * 0.5;
        lanzar(v, [V(x + (rnd() - 0.5) * 4, s * (5 + rnd() * 3), z - rnd() * 2), V(x, s * 2.9, z), V(x + 0.15, s * 0.9, z), V(x - 0.1, -s * 0.9, z), V(x, -s * 2.9, z), V(x + (rnd() - 0.5) * 3, -s * (4.5 + rnd() * 2), z - 1 - rnd() * 3)], 3.2, false, true);
      }
      e.o2.forEach((v, i) => { avanzar(v); pintarViajero(o2M, i, v, 1, true); });
    }

    if (naM) naM.count = iNa;
    if (kM) kM.count = iK;
    if (clM) clM.count = iCl;
    if (gluM) gluM.count = iGlu;
    if (im.atp.current) im.atp.current.count = iAtp + 1;
    for (const k of Object.keys(im) as (keyof typeof im)[]) { const m = im[k].current; if (m) m.instanceMatrix.needsUpdate = true; }
  }, -0.5);

  return (
    <group userData={{ pieza: 'particulas' }}>
      <instancedMesh ref={im.na} args={[geos.ion, mats.na, CAP.na + 4]} frustumCulled={false} userData={{ pieza: 'na' }} />
      <instancedMesh ref={im.k} args={[geos.ion, mats.k, CAP.k + 4]} frustumCulled={false} userData={{ pieza: 'k' }} />
      <instancedMesh ref={im.cl} args={[geos.ion, mats.cl, CAP.cl]} frustumCulled={false} userData={{ pieza: 'cl' }} />
      <instancedMesh ref={im.glu} args={[geos.glu, mats.glu, CAP.glu + 4]} frustumCulled={false} userData={{ pieza: 'glu' }} />
      <instancedMesh ref={im.o2} args={[geos.o2, mats.o2, 16]} frustumCulled={false} castShadow userData={{ pieza: 'o2' }} />
      <instancedMesh ref={im.agua} args={[geos.agua, mats.agua, 2 * N_FILA + 16]} frustumCulled={false} userData={{ pieza: 'agua' }} />
      <instancedMesh ref={im.atp} args={[geos.atp, mats.nuc, CAP.atp + 1]} frustumCulled={false} castShadow userData={{ pieza: 'atp' }} />
      <instancedMesh ref={im.adp} args={[geos.adp, mats.nuc, 1]} frustumCulled={false} userData={{ pieza: 'adp' }} />
      <instancedMesh ref={im.pi} args={[geos.pi, mats.nuc, 1]} frustumCulled={false} userData={{ pieza: 'pi' }} />
      <instancedMesh ref={im.hb} args={[geos.hb, mats.hb, CAP.hb]} frustumCulled={false} castShadow receiveShadow userData={{ pieza: 'hb' }} />
    </group>
  );
}

/** Reloj de animación de los lípidos (vaivén térmico). */
function Ondulacion({ mats, reloj }: { mats: MatsMembrana; reloj: Reloj }) {
  useFrame(() => { mats.uT.value = reloj.current.tAnim; });
  return null;
}

export function VistaMembrana({ reloj, calidad }: { reloj: Reloj; calidad: Calidad }) {
  const mats = useMatsMembrana();
  const partes: PartesMoviles = {
    glutN: useRef<THREE.Group>(null), glutC: useRef<THREE.Group>(null), bombaA: useRef<THREE.Group>(null), bombaN: useRef<THREE.Group>(null),
    compFuera: useRef<THREE.Group>(null), compDentro: useRef<THREE.Group>(null), fosfo: useRef<THREE.InstancedMesh>(null),
  };
  return (
    <group>
      <Ondulacion mats={mats} reloj={reloj} />
      <Bicapa mats={mats} calidad={calidad} />
      <Proteinas mats={mats} partes={partes} />
      <Fenomeno reloj={reloj} partes={partes} calidad={calidad} />
    </group>
  );
}

// ───────────────────────────── rótulos ─────────────────────────────

export const ROTULO_PIEZA_MEMBRANA: Record<string, string> = {
  bicapa: 'Bicapa de fosfolípidos (≈ 4 nm)',
  cabeza: 'Cabeza polar (fosfatidilcolina, esfingomielina)',
  cabezaD: 'Cabeza polar de la hoja interna (PE, PS)',
  cola: 'Colas de ácidos grasos (una con doble enlace cis)',
  colesterol: 'Colesterol',
  nucleo: 'Interior hidrófobo de la bicapa',
  aqp: 'Acuaporina 1: canal de agua (ósmosis)',
  glut: 'GLUT1: transportador de glucosa (difusión facilitada)',
  bomba: 'Bomba Na⁺/K⁺ (subunidad α): transporte activo',
  bombaP: 'Dominio P: se fosforila con el ATP',
  bombaN: 'Dominio N: une el ATP',
  bombaA: 'Dominio A: desfosforila',
  beta: 'Subunidad β con sus glicanos',
  na: 'Na⁺', k: 'K⁺', cl: 'Cl⁻', glu: 'Glucosa', o2: 'O₂ (cada uno ≈ 10 moléculas)', agua: 'H₂O (cada una ≈ 10⁴ moléculas)',
  atp: 'ATP', adp: 'ADP', pi: 'Fosfato (Pᵢ)', hb: 'Hemoglobina',
};

export interface RotuloB2 { id: string; texto: string; ancla: V3 }
export const ROTULOS_MEMBRANA: RotuloB2[] = [
  { id: 'fue', texto: 'Plasma (fuera)', ancla: [-17, 8.6, -4] },
  { id: 'den', texto: 'Citoplasma (dentro)', ancla: [-17, -8.6, -4] },
  { id: 'bic', texto: 'Bicapa lipídica', ancla: [-17.5, 2.6, -0.5] },
  { id: 'aqp', texto: 'Acuaporina · H₂O', ancla: [PROT.aqp.x, 3.6, PROT.aqp.z] },
  { id: 'glu', texto: 'GLUT1 · glucosa', ancla: [PROT.glut.x, 3.4, 0] },
  { id: 'bom', texto: 'Bomba Na⁺/K⁺ · ATP', ancla: [PROT.bomba.x + 1.5, 6.2, PROT.bomba.z - 1.2] },
  { id: 'o2', texto: 'O₂ · difusión simple', ancla: [PASOS_O2[2][0], 3.2, PASOS_O2[2][1]] },
];
