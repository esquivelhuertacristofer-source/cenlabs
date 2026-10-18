'use client';
/**
 * bio04/particulas.tsx — el fenómeno en la vista del cloroplasto. TODO sale de las tasas
 * del reloj (`RelojFoto.tasas`, de `tasasVisuales` en fotosintesis.ts), cuadro a cuadro:
 *
 *  · FOTONES de la lámpara (∝ PPFD), cada uno con su λ muestreada del espectro de la LED y
 *    de ese color. La hoja absorbe la fracción A(λ) de la lámpara; el resto atraviesa.
 *  · DESTELLOS donde se absorben: los que mueven un electrón (probabilidad pUsar: 8 por O₂)
 *    se encienden del color del fotón; los que sobran se disipan como calor y fluorescencia
 *    roja de la clorofila (685 nm). Con mucha luz sobran muchos: es la saturación.
 *  · O₂ (bruto) que nace en los tilacoides y sale; la mitocondria respira R: si R alcanza a
 *    la bruta (punto de compensación) todo el O₂ va a ella y no sale nada.
 *  · CO₂ al ciclo de Calvin (cociente fotosintético 1), en parte el que suelta la mitocondria.
 *  · ATP y NADPH (3 y 2 por CO₂) de los tilacoides a sus estaciones del ciclo; G3P (1 por
 *    3 CO₂) sale del ciclo. El anillo gira 1 vuelta por cada 3 CO₂ fijados.
 * Los ritmos son los del modelo en proporción (1 O₂ dibujado/s ≈ 1/escalaParticulas mL/min).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { muestrearLambda, colorLambda } from './fotosintesis';
import {
  GRANA, centroDisco, puntoEnGranum, enPieza, CLORO, MITO, CALVIN_ANILLO, ESTACIONES, puntoAnillo, BASE_ANILLO, dentroElipsoide, ESTROMA, ALMIDON, type V3,
} from './cloroplasto';
import { materialBrillo, materialCera, materialEstela, materialHalo, materialHaz } from './materiales';
import type { RelojFoto } from './reloj';
import type { Calidad } from '../_kit';

/** Generador determinista (capturas repetibles). */
export function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const suave = (t: number) => t * t * (3 - 2 * t);

/** Dirección de la luz (de la lámpara a la ramita) y punto al que apunta el haz. La lámpara queda arriba a la
 *  izquierda y a ~56° del eje de la cámara inicial: los fotones cruzan la pantalla en diagonal (antes iban casi
 *  en el eje de la vista y sus estelas se acortaban hasta no leerse) y el haz se ve entrar de lado. */
export const DIR_LUZ = new THREE.Vector3(0.574, -0.782, 0.241).normalize();
export const BLANCO_HAZ = new THREE.Vector3(0.2, -0.4, -0.1);
const HACIA_LUZ = DIR_LUZ.clone().negate();
const HDR = { alta: 2.4, media: 1.1 } as const;

type Reloj = React.MutableRefObject<RelojFoto>;

/** Acumulador de eventos: cuántos tocan en este cuadro con una tasa (1/s). */
function cuantos(acc: { v: number }, tasa: number, dt: number, max = 40): number {
  acc.v += Math.max(0, tasa) * dt;
  const n = Math.floor(acc.v);
  acc.v -= n;
  return Math.min(max, n);
}

// ───────────────────────────── destellos (halo aditivo) ─────────────────────────────

const CAP_DESTELLOS = 160;
export interface Destellos { lanzar: (p: THREE.Vector3, color: THREE.Color, tam: number, vida: number) => void }

function useDestellos(alta: boolean): { obj: THREE.Points; api: Destellos; actualizar: (dt: number) => void } {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const r = useMemo(() => {
    const pos = new Float32Array(CAP_DESTELLOS * 3), col = new Float32Array(CAP_DESTELLOS * 3), tam = new Float32Array(CAP_DESTELLOS);
    const edad = new Float32Array(CAP_DESTELLOS), vida = new Float32Array(CAP_DESTELLOS), t0 = new Float32Array(CAP_DESTELLOS), base = new Float32Array(CAP_DESTELLOS * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    const m = materialHalo();
    const obj = new THREE.Points(g, m);
    obj.frustumCulled = false;
    obj.renderOrder = 9;
    let sig = 0;
    const api: Destellos = {
      lanzar(p, c, t, v) {
        const i = sig; sig = (sig + 1) % CAP_DESTELLOS;
        pos.set([p.x, p.y, p.z], i * 3); base.set([c.r, c.g, c.b], i * 3);
        edad[i] = 0; vida[i] = v; t0[i] = t;
      },
    };
    return { obj, api, pos, col, tam, edad, vida, t0, base, g, m };
  }, []);
  useEffect(() => () => { r.g.dispose(); r.m.dispose(); }, [r]);
  const actualizar = (dt: number) => {
    const pr = gl.getPixelRatio();
    r.m.uniforms.uEscala.value = (size.height * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    const k = alta ? 1 : 0.85;
    for (let i = 0; i < CAP_DESTELLOS; i++) {
      if (r.vida[i] <= 0) { r.tam[i] = 0; continue; }
      r.edad[i] += dt;
      const u = r.edad[i] / r.vida[i];
      if (u >= 1) { r.vida[i] = 0; r.tam[i] = 0; continue; }
      const a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
      r.tam[i] = r.t0[i] * (0.6 + 0.6 * u);
      for (let c = 0; c < 3; c++) r.col[i * 3 + c] = r.base[i * 3 + c] * a * a * k;
    }
    (r.g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (r.g.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (r.g.getAttribute('aTam') as THREE.BufferAttribute).needsUpdate = true;
  };
  return { obj: r.obj, api: r.api, actualizar };
}

// ───────────────────────────── fotones ─────────────────────────────

const CAP_FOTONES = 260;
const V_FOTON = 13;          // u/s de pantalla (esquema: la luz real cruza la célula en femtosegundos)
const L_VUELO = 7.5;         // u de vuelo hasta el blanco

const L_ESTELA = 0.95;

function Fotones({ reloj, calidad, destellos }: { reloj: Reloj; calidad: Calidad; destellos: React.MutableRefObject<Destellos | null> }) {
  const im = useRef<THREE.InstancedMesh>(null);
  // estela: cono fino de la cabeza (z = 0) a la cola (z = −L_ESTELA)
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.03, 0.004, L_ESTELA, 10, 1, false);
    g.rotateX(Math.PI / 2);           // eje +y → +z: la base ancha (cabeza) queda delante
    g.translate(0, 0, -L_ESTELA / 2);
    return g;
  }, []);
  const mat = useMemo(() => materialEstela(L_ESTELA), []);
  // cabezas: halo redondo (se ve como luz también sin bloom)
  const size = useThree((st) => st.size);
  const gl = useThree((st) => st.gl);
  const cam = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const cabezas = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CAP_FOTONES * 3), 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(CAP_FOTONES * 3), 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(new Float32Array(CAP_FOTONES), 1));
    const m = materialHalo();
    const o = new THREE.Points(g, m); o.frustumCulled = false; o.renderOrder = 8;
    return { g, m, o };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); cabezas.g.dispose(); cabezas.m.dispose(); }, [geo, mat, cabezas]);
  const rnd = useMemo(() => azar(4242), []);
  const s = useMemo(() => ({
    vivo: new Uint8Array(CAP_FOTONES), t: new Float32Array(CAP_FOTONES), tFin: new Float32Array(CAP_FOTONES),
    tBlanco: new Float32Array(CAP_FOTONES), p0: new Float32Array(CAP_FOTONES * 3), tipo: new Uint8Array(CAP_FOTONES), // 0 atraviesa, 1 útil, 2 disipado
    col: new Float32Array(CAP_FOTONES * 3), acc: { v: 0 }, sig: 0,
  }), []);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color(), v: new THREE.Vector3(), q: new THREE.Quaternion() }), []);
  const qDir = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), DIR_LUZ), []);
  const rojoFluor = useMemo(() => new THREE.Color('#ff2a12'), []);
  useFrame(() => {
    const m = im.current; if (!m) return;
    const r = reloj.current, dt = r.dtAnim, ta = r.tasas;
    const hdr = HDR[calidad];
    // nacimientos
    const n = cuantos(s.acc, ta.fotones, dt, 30);
    for (let k = 0; k < n; k++) {
      const i = s.sig; s.sig = (s.sig + 1) % CAP_FOTONES;
      const abs = rnd() < ta.pAbsorber;
      const usa = abs && rnd() < ta.pUsar;
      let blanco: V3;
      if (abs) {
        // se dibujan en el lado de los grana que da a la luz (la proporción es la del modelo)
        puntoEnGranum(Math.floor(rnd() * GRANA.length), rnd, tmp.v, HACIA_LUZ);
        blanco = [tmp.v.x, tmp.v.y, tmp.v.z];
      } else {
        let p: V3 = [0, 0, 0];
        for (let j = 0; j < 16; j++) { p = [(rnd() * 2 - 1) * CLORO.A * 0.9, -rnd() * CLORO.B * 0.7, (rnd() * 2 - 1) * CLORO.C * 0.8]; if (dentroElipsoide(p, CLORO) && enPieza(p)) break; }
        blanco = p;
      }
      const L = L_VUELO + rnd() * 1.5;
      s.p0.set([blanco[0] - DIR_LUZ.x * L, blanco[1] - DIR_LUZ.y * L, blanco[2] - DIR_LUZ.z * L], i * 3);
      s.t[i] = 0; s.tBlanco[i] = L / V_FOTON; s.tFin[i] = abs ? L / V_FOTON : (L + 6) / V_FOTON;
      s.tipo[i] = abs ? (usa ? 1 : 2) : 0; s.vivo[i] = 1;
      const [cr, cg, cb] = colorLambda(muestrearLambda(r.cond.color, rnd()));
      s.col.set([cr, cg, cb], i * 3);
    }
    // vuelo
    let vis = 0;
    const pC = cabezas.g.getAttribute('position') as THREE.BufferAttribute;
    const cC = cabezas.g.getAttribute('aColor') as THREE.BufferAttribute;
    const tC = cabezas.g.getAttribute('aTam') as THREE.BufferAttribute;
    cabezas.m.uniforms.uEscala.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    for (let i = 0; i < CAP_FOTONES; i++) {
      if (!s.vivo[i]) continue;
      s.t[i] += dt;
      if (s.t[i] >= s.tFin[i]) {
        s.vivo[i] = 0;
        if (s.tipo[i] !== 0 && destellos.current) {
          tmp.v.set(s.p0[i * 3], s.p0[i * 3 + 1], s.p0[i * 3 + 2]).addScaledVector(DIR_LUZ, s.tBlanco[i] * V_FOTON);
          if (s.tipo[i] === 1) {
            tmp.c.setRGB(s.col[i * 3], s.col[i * 3 + 1], s.col[i * 3 + 2]).lerp(new THREE.Color(1, 1, 1), 0.35).multiplyScalar(hdr * 1.1);
            destellos.current.lanzar(tmp.v, tmp.c, 0.42, 0.55);
          } else {
            tmp.c.copy(rojoFluor).multiplyScalar(hdr * 0.55);
            destellos.current.lanzar(tmp.v, tmp.c, 0.3, 0.7);
          }
        }
        continue;
      }
      tmp.v.set(s.p0[i * 3], s.p0[i * 3 + 1], s.p0[i * 3 + 2]).addScaledVector(DIR_LUZ, s.t[i] * V_FOTON);
      // los que atraviesan se apagan después de cruzar
      const apaga = s.tipo[i] === 0 && s.t[i] > s.tBlanco[i] ? 1 - (s.t[i] - s.tBlanco[i]) / (s.tFin[i] - s.tBlanco[i]) : 1;
      const enciende = Math.min(1, s.t[i] / 0.15);
      const k = Math.max(0.001, apaga * enciende);
      // la estela no asoma por detrás del punto de partida
      tmp.o.position.copy(tmp.v); tmp.o.quaternion.copy(qDir); tmp.o.scale.set(1, 1, Math.min(1, (s.t[i] * V_FOTON) / L_ESTELA + 0.05));
      tmp.o.updateMatrix(); m.setMatrixAt(vis, tmp.o.matrix);
      tmp.c.setRGB(s.col[i * 3], s.col[i * 3 + 1], s.col[i * 3 + 2]).multiplyScalar(hdr * 0.8 * k);
      m.setColorAt(vis, tmp.c);
      pC.setXYZ(vis, tmp.v.x, tmp.v.y, tmp.v.z);
      cC.setXYZ(vis, tmp.c.r * 0.7 + 0.25 * k, tmp.c.g * 0.7 + 0.25 * k, tmp.c.b * 0.7 + 0.25 * k);
      tC.setX(vis, 0.3);
      vis++;
    }
    m.count = vis;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    cabezas.g.setDrawRange(0, vis);
    pC.needsUpdate = true; cC.needsUpdate = true; tC.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={im} args={[geo, mat, CAP_FOTONES]} frustumCulled={false} raycast={() => null} renderOrder={7} />
      <primitive object={cabezas.o} />
    </>
  );
}

// ───────────────────────────── moléculas: O₂ y CO₂ ─────────────────────────────

const CAP_MOL = 140;
const O2 = 0, CO2 = 1;
const COL_O = new THREE.Color('#ee4b3e'), COL_C = new THREE.Color('#6b7079');

interface Mol {
  vivo: Uint8Array; tipo: Uint8Array; t: Float32Array; vida: Float32Array;
  p0: Float32Array; p1: Float32Array; p2: Float32Array; eje: Float32Array; fin: Uint8Array;
}
/** Destino al terminar: nada, consumida en la mitocondria (suelta CO₂), fijada por la Rubisco. */
const FIN_NADA = 0, FIN_MITO = 1, FIN_RUBISCO = 2;

function puntoFuera(rnd: () => number, out: number[], lejos = 1): void {
  // por encima del plato, hacia el citoplasma (por donde se ve salir)
  const a = rnd() * Math.PI * 2;
  const r = (2.2 + rnd() * 3.2) * lejos;
  out[0] = Math.cos(a) * r; out[1] = 1.6 + rnd() * 1.8; out[2] = Math.sin(a) * r * 0.55 + 0.4;
}

function Moleculas({ reloj, calidad, destellos }: { reloj: Reloj; calidad: Calidad; destellos: React.MutableRefObject<Destellos | null> }) {
  const im = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const mat = useMemo(() => materialCera({ rugosidad: 0.32, clearcoat: 0.5, fuerzaBorde: 0.35, borde: '#ffe9e4' }, 'mol'), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const rnd = useMemo(() => azar(777), []);
  const s = useMemo<Mol & { accO: { v: number }; accR: { v: number }; accC: { v: number }; sig: number }>(() => ({
    vivo: new Uint8Array(CAP_MOL), tipo: new Uint8Array(CAP_MOL), t: new Float32Array(CAP_MOL), vida: new Float32Array(CAP_MOL),
    p0: new Float32Array(CAP_MOL * 3), p1: new Float32Array(CAP_MOL * 3), p2: new Float32Array(CAP_MOL * 3), eje: new Float32Array(CAP_MOL * 3), fin: new Uint8Array(CAP_MOL),
    accO: { v: 0 }, accR: { v: 0 }, accC: { v: 0 }, sig: 0,
  }), []);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), e: new THREE.Vector3(), w: [0, 0, 0] }), []);
  const mito = useMemo(() => new THREE.Vector3(...MITO.p), []);
  const rubisco = useMemo(() => puntoAnillo(ESTACIONES.fijacion, new THREE.Vector3(), CALVIN_ANILLO.R + 0.14), []);
  const nueva = (tipo: number, a: THREE.Vector3, ctrl: THREE.Vector3, b: THREE.Vector3, vida: number, fin: number) => {
    const i = s.sig; s.sig = (s.sig + 1) % CAP_MOL;
    s.vivo[i] = 1; s.tipo[i] = tipo; s.t[i] = 0; s.vida[i] = vida; s.fin[i] = fin;
    s.p0.set([a.x, a.y, a.z], i * 3); s.p1.set([ctrl.x, ctrl.y, ctrl.z], i * 3); s.p2.set([b.x, b.y, b.z], i * 3);
    tmp.e.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    s.eje.set([tmp.e.x, tmp.e.y, tmp.e.z], i * 3);
  };
  /** punto de nacimiento de un O₂: en un tilacoide (los cortados, a la vista) */
  const enTilacoide = (out: THREE.Vector3) => puntoEnGranum(Math.floor(rnd() * GRANA.length), rnd, out);
  useFrame(() => {
    const m = im.current; if (!m) return;
    const r = reloj.current, dt = r.dtAnim, ta = r.tasas;
    // O₂ bruto: sale, o va a la mitocondria con probabilidad R/bruta (si R ≥ bruta, todo)
    const nO = cuantos(s.accO, ta.o2, dt, 8);
    const pMito = ta.o2 > 0 ? Math.min(1, ta.resp / ta.o2) : 1;
    for (let k = 0; k < nO; k++) {
      enTilacoide(tmp.a);
      if (rnd() < pMito) {
        tmp.b.copy(mito).add(tmp.c.set((rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.25, -0.1));
        tmp.c.copy(tmp.a).lerp(tmp.b, 0.5).add(tmp.e.set(0, 1.5, 0.2));
        nueva(O2, tmp.a, tmp.c, tmp.b, 2.4 + rnd() * 0.8, FIN_MITO);
      } else {
        puntoFuera(rnd, tmp.w); tmp.b.set(tmp.w[0], tmp.w[1], tmp.w[2]);
        tmp.c.copy(tmp.a).add(tmp.e.set((rnd() - 0.5) * 0.6, 1.1 + rnd() * 0.6, (rnd() - 0.5) * 0.6));
        nueva(O2, tmp.a, tmp.c, tmp.b, 2.8 + rnd() * 1.2, FIN_NADA);
      }
    }
    // si la respiración pide más O₂ del que da el cloroplasto, llega del medio
    const nR = cuantos(s.accR, Math.max(0, ta.resp - ta.o2), dt, 4);
    for (let k = 0; k < nR; k++) {
      tmp.a.set(MITO.p[0] + 1.5 + rnd() * 1.5, MITO.p[1] + 1 + rnd(), MITO.p[2] + 0.5 + rnd());
      tmp.b.copy(mito); tmp.c.copy(tmp.a).lerp(tmp.b, 0.5).add(tmp.e.set(0, 0.4, 0.3));
      nueva(O2, tmp.a, tmp.c, tmp.b, 2.6, FIN_MITO);
    }
    // CO₂ del medio que la mitocondria no cubre, a la Rubisco
    const nC = cuantos(s.accC, Math.max(0, ta.co2 - ta.resp), dt, 8);
    for (let k = 0; k < nC; k++) {
      puntoFuera(rnd, tmp.w); tmp.a.set(tmp.w[0], tmp.w[1] + 0.4, tmp.w[2]);
      tmp.b.copy(rubisco);
      tmp.c.copy(tmp.b).add(tmp.e.set((rnd() - 0.5) * 0.6, 1.4, (rnd() - 0.5) * 0.6));
      nueva(CO2, tmp.a, tmp.c, tmp.b, 2.6 + rnd() * 0.8, FIN_RUBISCO);
    }
    // avance
    let vis = 0;
    const tAnim = r.tAnim;
    for (let i = 0; i < CAP_MOL; i++) {
      if (!s.vivo[i]) continue;
      s.t[i] += dt;
      const u = s.t[i] / s.vida[i];
      if (u >= 1) {
        s.vivo[i] = 0;
        if (s.fin[i] === FIN_MITO) {
          // la mitocondria lo respira y suelta un CO₂: a la Rubisco si el ciclo lo pide, o al medio
          tmp.a.copy(mito).add(tmp.c.set((rnd() - 0.5) * 0.4, 0.2, 0));
          const alCiclo = ta.resp > 0 ? rnd() < Math.min(1, ta.co2 / ta.resp) : false;
          if (alCiclo) { tmp.b.copy(rubisco); tmp.c.copy(tmp.a).lerp(tmp.b, 0.5).add(tmp.e.set(0, 1.5, 0.2)); nueva(CO2, tmp.a, tmp.c, tmp.b, 2.4, FIN_RUBISCO); }
          else { tmp.b.set(MITO.p[0] + 1.5 + rnd() * 1.5, MITO.p[1] + 0.8 + rnd(), MITO.p[2] + 0.5 + rnd()); tmp.c.copy(tmp.a).lerp(tmp.b, 0.5).add(tmp.e.set(0, 0.5, 0)); nueva(CO2, tmp.a, tmp.c, tmp.b, 2.6, FIN_NADA); }
        } else if (s.fin[i] === FIN_RUBISCO && destellos.current) {
          destellos.current.lanzar(rubisco, new THREE.Color('#9dffd8').multiplyScalar(HDR[calidad] * 0.6), 0.3, 0.45);
        }
        continue;
      }
      const e = suave(u);
      // Bézier cuadrática + un temblor browniano esquemático
      const a0 = (1 - e) * (1 - e), a1 = 2 * (1 - e) * e, a2 = e * e;
      const x = a0 * s.p0[i * 3] + a1 * s.p1[i * 3] + a2 * s.p2[i * 3] + 0.05 * Math.sin(tAnim * 3.1 + i);
      const y = a0 * s.p0[i * 3 + 1] + a1 * s.p1[i * 3 + 1] + a2 * s.p2[i * 3 + 1] + 0.05 * Math.sin(tAnim * 2.7 + i * 1.7);
      const z = a0 * s.p0[i * 3 + 2] + a1 * s.p1[i * 3 + 2] + a2 * s.p2[i * 3 + 2] + 0.05 * Math.sin(tAnim * 2.3 + i * 0.7);
      const vida = Math.min(1, u / 0.12) * (s.fin[i] === FIN_NADA ? Math.min(1, (1 - u) / 0.25) : Math.min(1, (1 - u) / 0.08));
      tmp.e.set(s.eje[i * 3], s.eje[i * 3 + 1], s.eje[i * 3 + 2]).applyAxisAngle(tmp.c.set(0, 1, 0), tAnim * 0.9 + i);
      const sc = 0.062 * Math.max(0.001, vida);
      if (s.tipo[i] === O2) {
        for (const sg of [-1, 1]) {
          tmp.o.position.set(x + tmp.e.x * 0.07 * sg, y + tmp.e.y * 0.07 * sg, z + tmp.e.z * 0.07 * sg);
          tmp.o.scale.setScalar(sc); tmp.o.updateMatrix(); m.setMatrixAt(vis, tmp.o.matrix); m.setColorAt(vis, COL_O); vis++;
        }
      } else {
        tmp.o.position.set(x, y, z); tmp.o.scale.setScalar(sc * 0.95); tmp.o.updateMatrix(); m.setMatrixAt(vis, tmp.o.matrix); m.setColorAt(vis, COL_C); vis++;
        for (const sg of [-1, 1]) {
          tmp.o.position.set(x + tmp.e.x * 0.11 * sg, y + tmp.e.y * 0.11 * sg, z + tmp.e.z * 0.11 * sg);
          tmp.o.scale.setScalar(sc * 0.88); tmp.o.updateMatrix(); m.setMatrixAt(vis, tmp.o.matrix); m.setColorAt(vis, COL_O); vis++;
        }
      }
    }
    m.count = vis;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={im} args={[geo, mat, CAP_MOL * 3]} frustumCulled={false} raycast={() => null} />;
}

// ───────────────────────────── ATP, NADPH y G3P ─────────────────────────────

const CAP_E = 140;
const ATP = 0, NADPH = 1, G3P = 2;
const COL_E = [new THREE.Color('#ffc94a'), new THREE.Color('#5fe3ff'), new THREE.Color('#ff9a3c')];

function Portadores({ reloj, calidad }: { reloj: Reloj; calidad: Calidad }) {
  const im = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const mat = useMemo(() => materialBrillo('portador'), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const rnd = useMemo(() => azar(31337), []);
  const s = useMemo(() => ({
    vivo: new Uint8Array(CAP_E), tipo: new Uint8Array(CAP_E), t: new Float32Array(CAP_E), vida: new Float32Array(CAP_E),
    p0: new Float32Array(CAP_E * 3), p1: new Float32Array(CAP_E * 3), p2: new Float32Array(CAP_E * 3),
    accA: { v: 0 }, accN: { v: 0 }, accG: { v: 0 }, sig: 0, nATP: 0,
  }), []);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), col: new THREE.Color() }), []);
  const est = useMemo(() => ({
    red: puntoAnillo(ESTACIONES.reduccion, new THREE.Vector3()),
    reg: puntoAnillo(ESTACIONES.regeneracion, new THREE.Vector3()),
    sal: puntoAnillo(ESTACIONES.salida, new THREE.Vector3()),
  }), []);
  // de los grana cortados (los que se ven), cerca del anillo
  const cand = useMemo(() => GRANA.map((g, i) => ({ g, i })).filter(({ g }) => Math.hypot(g.x - CALVIN_ANILLO.c[0], g.z - CALVIN_ANILLO.c[2]) < 2.3).map(({ i }) => i), []);
  const origen = (out: THREE.Vector3) => {
    // del canto de un tilacoide de la mitad de arriba de un granum vecino, del lado del anillo
    const g = GRANA[cand[Math.floor(rnd() * cand.length)]];
    const k = Math.floor(g.n * (0.45 + 0.55 * rnd()));
    const a = Math.atan2(CALVIN_ANILLO.c[2] - g.z, CALVIN_ANILLO.c[0] - g.x) + (rnd() - 0.5) * 0.8;
    return out.set(g.x + Math.cos(a) * g.r, centroDisco(g, Math.min(k, g.n - 1))[1], g.z + Math.sin(a) * g.r);
  };
  const nueva = (tipo: number, a: THREE.Vector3, b: THREE.Vector3, vida: number) => {
    const i = s.sig; s.sig = (s.sig + 1) % CAP_E;
    s.vivo[i] = 1; s.tipo[i] = tipo; s.t[i] = 0; s.vida[i] = vida;
    tmp.c.copy(a).lerp(b, 0.5).add(new THREE.Vector3((rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, 0.12 + rnd() * 0.15));
    s.p0.set([a.x, a.y, a.z], i * 3); s.p1.set([tmp.c.x, tmp.c.y, tmp.c.z], i * 3); s.p2.set([b.x, b.y, b.z], i * 3);
  };
  useFrame(() => {
    const m = im.current; if (!m) return;
    const r = reloj.current, dt = r.dtAnim, ta = r.tasas;
    // ATP: 2 de cada 3 a la reducción, 1 a la regeneración
    const nA = cuantos(s.accA, ta.atp, dt, 10);
    for (let k = 0; k < nA; k++) { s.nATP++; nueva(ATP, origen(tmp.a), s.nATP % 3 === 0 ? est.reg : est.red, 1.3 + rnd() * 0.5); }
    const nN = cuantos(s.accN, ta.nadph, dt, 8);
    for (let k = 0; k < nN; k++) nueva(NADPH, origen(tmp.a), est.red, 1.3 + rnd() * 0.5);
    // G3P: sale del anillo hacia el almidón o la envoltura (exportación de triosas)
    const nG = cuantos(s.accG, ta.g3p, dt, 4);
    for (let k = 0; k < nG; k++) {
      const destino = rnd() < 0.5 ? new THREE.Vector3(...ALMIDON[2].p) : new THREE.Vector3(CALVIN_ANILLO.c[0] + 1.2, -ESTROMA.B * 0.7, -0.3);
      nueva(G3P, est.sal, destino, 2.2);
    }
    const hdr = HDR[calidad];
    let vis = 0;
    for (let i = 0; i < CAP_E; i++) {
      if (!s.vivo[i]) continue;
      s.t[i] += dt;
      const u = s.t[i] / s.vida[i];
      if (u >= 1) { s.vivo[i] = 0; continue; }
      const e = suave(u), a0 = (1 - e) * (1 - e), a1 = 2 * (1 - e) * e, a2 = e * e;
      tmp.o.position.set(
        a0 * s.p0[i * 3] + a1 * s.p1[i * 3] + a2 * s.p2[i * 3],
        a0 * s.p0[i * 3 + 1] + a1 * s.p1[i * 3 + 1] + a2 * s.p2[i * 3 + 1],
        a0 * s.p0[i * 3 + 2] + a1 * s.p1[i * 3 + 2] + a2 * s.p2[i * 3 + 2],
      );
      const vida = Math.min(1, u / 0.1) * Math.min(1, (1 - u) / 0.12);
      tmp.o.scale.setScalar((s.tipo[i] === G3P ? 0.05 : 0.04) * Math.max(0.001, vida));
      tmp.o.updateMatrix(); m.setMatrixAt(vis, tmp.o.matrix);
      m.setColorAt(vis, tmp.col.copy(COL_E[s.tipo[i]]).multiplyScalar(hdr * 0.42));
      vis++;
    }
    m.count = vis;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={im} args={[geo, mat, CAP_E]} frustumCulled={false} raycast={() => null} />;
}

/** Las cuentas del anillo de Calvin: 1 vuelta por cada 3 CO₂; el color dice la etapa (RuBP → 3-PGA → G3P). */
function CuentasCalvin({ reloj, calidad }: { reloj: Reloj; calidad: Calidad }) {
  const N = 12;
  const im = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const mat = useMemo(() => materialBrillo('calvin'), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const fase = useRef(0);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), p: new THREE.Vector3(), c: new THREE.Color() }), []);
  const RUBP = useMemo(() => new THREE.Color('#7be08f'), []), PGA = useMemo(() => new THREE.Color('#79a9ff'), []), GAP = useMemo(() => new THREE.Color('#ffab4a'), []);
  useFrame(() => {
    const m = im.current; if (!m) return;
    const r = reloj.current;
    fase.current += (2 * Math.PI * r.tasas.co2 / 3) * r.dtAnim;
    const hdr = HDR[calidad] * 0.36;
    for (let i = 0; i < N; i++) {
      const a = (fase.current + (i / N) * Math.PI * 2) % (Math.PI * 2);
      puntoAnillo(a, tmp.p);
      // etapa según el arco: fijación → reducción (3-PGA), reducción → salida (G3P), resto (RuBP)
      const etapa = a < ESTACIONES.reduccion ? PGA : a < ESTACIONES.salida ? GAP : RUBP;
      tmp.o.position.copy(tmp.p); tmp.o.scale.setScalar(etapa === PGA ? 0.042 : 0.05);
      tmp.o.updateMatrix(); m.setMatrixAt(i, tmp.o.matrix);
      m.setColorAt(i, tmp.c.copy(etapa).multiplyScalar(hdr));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  void BASE_ANILLO;
  return <instancedMesh ref={im} args={[geo, mat, N]} frustumCulled={false} raycast={() => null} />;
}

// ───────────────────────────── haz de la lámpara ─────────────────────────────

export function Haz({ reloj }: { reloj: Reloj }) {
  const geo = useMemo(() => {
    const L = 15;
    const g = new THREE.CylinderGeometry(3.4, 0.7, L, 48, 1, true);
    g.translate(0, L / 2, 0);   // la base (ancha) en el origen y la punta hacia la lámpara
    return g;
  }, []);
  const mat = useMemo(() => materialHaz(), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR_LUZ.clone().negate()), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const r = reloj.current;
    const [cr, cg, cb] = colorLambda(muestrearLambda(r.cond.color, 0.5));
    if (r.cond.color === 'blanco') col.set('#fff1d6'); else col.setRGB(cr, cg, cb);
    mat.uniforms.uColor.value.copy(col);
    mat.uniforms.uIntensidad.value = Math.min(1.4, Math.sqrt(r.I / 250));
  });
  return <mesh geometry={geo} material={mat} position={BLANCO_HAZ} quaternion={q} renderOrder={2} raycast={() => null} />;
}

/** Luz direccional del color de la lámpara (ilumina el cloroplasto desde donde llegan los fotones). */
export function LuzLampara({ reloj }: { reloj: Reloj }) {
  const l = useRef<THREE.DirectionalLight>(null);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const r = reloj.current, d = l.current; if (!d) return;
    const [cr, cg, cb] = colorLambda(muestrearLambda(r.cond.color, 0.5));
    if (r.cond.color === 'blanco') col.set('#fff1d6'); else col.setRGB(cr, cg, cb);
    d.color.copy(col);
    d.intensity = 0.35 + 1.1 * Math.min(1, r.I / 400);
  });
  const pos = useMemo(() => BLANCO_HAZ.clone().addScaledVector(DIR_LUZ, -12), []);
  return <directionalLight ref={l} position={pos.toArray()} intensity={0.8} />;
}

// ───────────────────────────── conjunto ─────────────────────────────

export function FenomenoCloroplasto({ reloj, calidad }: { reloj: Reloj; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const { obj, api, actualizar } = useDestellos(alta);
  const destellos = useRef<Destellos | null>(api);
  destellos.current = api;
  useFrame(() => actualizar(reloj.current.dtAnim));
  return (
    <group>
      <primitive object={obj} />
      <Fotones reloj={reloj} calidad={calidad} destellos={destellos} />
      <Moleculas reloj={reloj} calidad={calidad} destellos={destellos} />
      <Portadores reloj={reloj} calidad={calidad} />
      <CuentasCalvin reloj={reloj} calidad={calidad} />
    </group>
  );
}
