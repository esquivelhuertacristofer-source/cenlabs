"use client";
/**
 * Biblioteca de moléculas de bolas y varillas con GEOMETRÍA REAL (longitudes y
 * ángulos de enlace de las tablas habituales). La usan Q3 (balanceo) y Q4 (reactivo
 * limitante).
 *
 *   geometriaMolecula(formula)   → átomos (Å) y enlaces con su orden
 *   mallaMolecula(formula)       → BufferGeometry fusionada (colores por vértice) en u
 *   MoleculasEnBandeja           → N copias en una bandeja circular (InstancedMesh)
 *
 * Escala de dibujo: 1 Å = ESCALA_A u. Las bolas son de radio fijo por elemento
 * (código CPK): no son radios de van der Waals, es un modelo de bolas y varillas.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { geoCache, sanearNormales } from '../_kit';

export type V = [number, number, number];
export interface AtomoMol { s: string; p: V }
export interface MolDef { atomos: AtomoMol[]; enlaces: [number, number, number][] }

export const ESCALA_A = 0.42; // u por ångström
const MAX_COPIAS = 120;

export const CPK: Record<string, string> = {
  H: '#f4f4f1', C: '#4a4f55', N: '#3a63c9', O: '#d9302b', S: '#e6c229', Na: '#8a5cc7', Cu: '#c8733f', Ag: '#c4c9ce',
};
/** radio de la bola (u) */
const RADIO: Record<string, number> = { H: 0.11, C: 0.19, N: 0.18, O: 0.17, S: 0.24, Na: 0.27, Cu: 0.25, Ag: 0.28 };

// ───────────────────────────── álgebra mínima ─────────────────────────────
const sum = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const res = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const largo = (a: V) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V): V => { const l = largo(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const perps = (u: V): [V, V] => {
  const t: V = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const p1 = unit(cruz(u, t));
  return [p1, unit(cruz(u, p1))];
};
const COS_TET = Math.cos((109.47 * Math.PI) / 180), SIN_TET = Math.sin((109.47 * Math.PI) / 180);
/** Tres direcciones tetraédricas alrededor de un eje (carbono terminal con un solo vecino `u`). */
function tresDirs(u: V, fase = 0): V[] {
  const [p1, p2] = perps(u);
  return [0, 1, 2].map((k) => {
    const a = fase + (k * 2 * Math.PI) / 3;
    return unit(sum(mul(u, COS_TET), mul(sum(mul(p1, Math.cos(a)), mul(p2, Math.sin(a))), SIN_TET)));
  });
}
/** Dos direcciones tetraédricas fuera del plano de los vecinos `a` y `b` (unitarios desde el átomo). */
function dosDirs(a: V, b: V): [V, V] {
  const m = unit(mul(sum(a, b), -1));
  const n = unit(cruz(a, b));
  const c = Math.cos((54.74 * Math.PI) / 180), s = Math.sin((54.74 * Math.PI) / 180);
  return [unit(sum(mul(m, c), mul(n, s))), unit(sum(mul(m, c), mul(n, -s)))];
}

class Constructor {
  atomos: AtomoMol[] = [];
  enlaces: [number, number, number][] = [];
  add(s: string, p: V) { this.atomos.push({ s, p }); return this.atomos.length - 1; }
  bond(i: number, j: number, o = 1) { this.enlaces.push([i, j, o]); }
  def(): MolDef { return { atomos: this.atomos, enlaces: this.enlaces }; }
  /** Añade un átomo unido a `i` en la dirección `d` (unitaria) a distancia `l` (Å). */
  unido(i: number, s: string, d: V, l: number, o = 1) {
    const j = this.add(s, sum(this.atomos[i].p, mul(d, l)));
    this.bond(i, j, o);
    return j;
  }
  /** Grupo OH: O a 1,43 Å en `d` y H con ángulo C–O–H de 109°. */
  hidroxilo(i: number, d: V, lCO = 1.43) {
    const o = this.unido(i, 'O', d, lCO);
    const [p1] = perps(d);
    const h = unit(sum(mul(d, Math.cos((71 * Math.PI) / 180)), mul(p1, Math.sin((71 * Math.PI) / 180))));
    this.unido(o, 'H', h, 0.96);
    return o;
  }
}

// ───────────────────────────── cadenas ─────────────────────────────

/** Cadena zigzag de n carbonos (C–C 1,53 Å, ángulo 112,5°) en el plano XY. */
function cadena(c: Constructor, n: number): number[] {
  const dx = 1.272, dy = 0.851;
  const ids: number[] = [];
  for (let i = 0; i < n; i++) ids.push(c.add('C', [(i - (n - 1) / 2) * dx, (i % 2 ? dy : 0) - dy / 2, 0]));
  for (let i = 1; i < n; i++) c.bond(ids[i - 1], ids[i]);
  return ids;
}
const haciaVecino = (c: Constructor, i: number, j: number) => unit(res(c.atomos[j].p, c.atomos[i].p));

function alcano(n: number): MolDef {
  const c = new Constructor();
  const ids = cadena(c, n);
  ids.forEach((id, i) => {
    const vec = [ids[i - 1], ids[i + 1]].filter((x) => x !== undefined) as number[];
    if (vec.length === 2) dosDirs(haciaVecino(c, id, vec[0]), haciaVecino(c, id, vec[1])).forEach((d) => c.unido(id, 'H', d, 1.09));
    else tresDirs(haciaVecino(c, id, vec[0]), i === 0 ? 0 : Math.PI).forEach((d) => c.unido(id, 'H', d, 1.09));
  });
  return c.def();
}

/** Glucosa de cadena abierta (aldohexosa): CHO–(CHOH)₄–CH₂OH. C₆H₁₂O₆. */
function glucosa(): MolDef {
  const c = new Constructor();
  const ids = cadena(c, 6);
  // C1: aldehído (C=O en el plano y H)
  {
    const u = haciaVecino(c, ids[0], ids[1]);
    const an = unit(sum(mul(u, Math.cos((120 * Math.PI) / 180)), mul([0, 1, 0] as V, Math.sin((120 * Math.PI) / 180))));
    const an2 = unit(sum(mul(u, Math.cos((120 * Math.PI) / 180)), mul([0, -1, 0] as V, Math.sin((120 * Math.PI) / 180))));
    // dos direcciones planas a 120° de la cadena: O (arriba, en +Y si apunta hacia afuera) y H
    const dO = an[1] > an2[1] ? an : an2, dH = an[1] > an2[1] ? an2 : an;
    c.unido(ids[0], 'O', dO, 1.21, 2);
    c.unido(ids[0], 'H', dH, 1.1);
  }
  // C2–C5: CH(OH). El OH y el H salen a lados opuestos del plano; alternan para no chocar
  for (let i = 1; i <= 4; i++) {
    const [d1, d2] = dosDirs(haciaVecino(c, ids[i], ids[i - 1]), haciaVecino(c, ids[i], ids[i + 1]));
    const [dOH, dH] = i % 2 ? [d1, d2] : [d2, d1];
    c.hidroxilo(ids[i], dOH);
    c.unido(ids[i], 'H', dH, 1.09);
  }
  // C6: CH₂OH
  {
    const ds = tresDirs(haciaVecino(c, ids[5], ids[4]), Math.PI);
    c.hidroxilo(ids[5], ds[0]);
    c.unido(ids[5], 'H', ds[1], 1.09);
    c.unido(ids[5], 'H', ds[2], 1.09);
  }
  return c.def();
}

function metanol(): MolDef {
  const c = new Constructor();
  const C = c.add('C', [0, 0, 0]);
  const O = c.unido(C, 'O', [1, 0, 0], 1.43);
  tresDirs([1, 0, 0]).forEach((d) => c.unido(C, 'H', d, 1.09));
  const ang = (108.9 * Math.PI) / 180;
  c.unido(O, 'H', [-Math.cos(ang), Math.sin(ang), 0], 0.96);
  return c.def();
}

function sulfato(c: Constructor, S: number, nOxo: number, nOH: number, Na = 0) {
  const t: V[] = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => unit(v as V));
  let k = 0;
  for (let i = 0; i < nOxo; i++, k++) c.unido(S, 'O', t[k], 1.43, 2);
  for (let i = 0; i < nOH; i++, k++) {
    const o = c.unido(S, 'O', t[k], 1.57);
    const [p1] = perps(t[k]);
    c.unido(o, 'H', unit(sum(mul(t[k], 0.309), mul(p1, 0.951))), 0.97);
  }
  for (let i = 0; i < Na; i++, k++) {
    const o = c.unido(S, 'O', t[k], 1.49);
    c.unido(o, 'Na', t[k], 2.3);
  }
}

function nitrato(c: Constructor, ancla: number, d: V, perp: V, lEnlace: number) {
  // O (unido al metal) – N – dos O terminales, plano definido por d y perp
  const O1 = c.unido(ancla, 'O', d, lEnlace);
  const N = c.unido(O1, 'N', d, 1.25);
  const a = (60 * Math.PI) / 180;
  c.unido(N, 'O', unit(sum(mul(d, Math.cos(a)), mul(perp, Math.sin(a)))), 1.22, 2);
  c.unido(N, 'O', unit(sum(mul(d, Math.cos(a)), mul(perp, -Math.sin(a)))), 1.22, 1);
}

function construir(formula: string): MolDef {
  const c = new Constructor();
  switch (formula) {
    case 'H2': { const a = c.add('H', [-0.37, 0, 0]), b = c.add('H', [0.37, 0, 0]); c.bond(a, b); break; }
    case 'O2': { const a = c.add('O', [-0.6, 0, 0]), b = c.add('O', [0.6, 0, 0]); c.bond(a, b, 2); break; }
    case 'N2': { const a = c.add('N', [-0.55, 0, 0]), b = c.add('N', [0.55, 0, 0]); c.bond(a, b, 3); break; }
    case 'CO': { const a = c.add('C', [-0.56, 0, 0]), b = c.add('O', [0.56, 0, 0]); c.bond(a, b, 3); break; }
    case 'CO2': { const C = c.add('C', [0, 0, 0]); c.unido(C, 'O', [-1, 0, 0], 1.16, 2); c.unido(C, 'O', [1, 0, 0], 1.16, 2); break; }
    case 'H2O': {
      const O = c.add('O', [0, -0.2, 0]);
      c.unido(O, 'H', [0.7886, 0.6148, 0], 0.96); c.unido(O, 'H', [-0.7886, 0.6148, 0], 0.96);
      break;
    }
    case 'NH3': {
      const N = c.add('N', [0, 0, 0]);
      [[0.94, -0.33, 0], [-0.47, -0.33, 0.81], [-0.47, -0.33, -0.81]].forEach((p) => c.unido(N, 'H', unit(p as V), 1.01));
      break;
    }
    case 'CH4': {
      const C = c.add('C', [0, 0, 0]);
      ([[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]] as V[]).forEach((d) => c.unido(C, 'H', unit(d), 1.09));
      break;
    }
    case 'C3H8': return alcano(3);
    case 'C8H18': return alcano(8);
    case 'CH3OH': return metanol();
    case 'C6H12O6': return glucosa();
    case 'H2SO4': { const S = c.add('S', [0, 0, 0]); sulfato(c, S, 2, 2); break; }
    case 'Na2SO4': { const S = c.add('S', [0, 0, 0]); sulfato(c, S, 2, 0, 2); break; }
    case 'NaOH': { const Na = c.add('Na', [-2.0, 0, 0]); const O = c.unido(Na, 'O', [1, 0, 0], 1.95); c.unido(O, 'H', [1, 0, 0], 0.96); break; }
    case 'Cu': c.add('Cu', [0, 0, 0]); break;
    case 'Ag': c.add('Ag', [0, 0, 0]); break;
    case 'AgNO3': { const Ag = c.add('Ag', [0, 0, 0]); nitrato(c, Ag, [1, 0, 0], [0, 1, 0], 2.3); break; }
    case 'Cu(NO3)2': {
      const Cu = c.add('Cu', [0, 0, 0]);
      nitrato(c, Cu, [1, 0, 0], [0, 1, 0], 2.0);
      nitrato(c, Cu, [-1, 0, 0], [0, 0, 1], 2.0);
      break;
    }
    default: {
      // fórmula desconocida: una esfera neutra (no debería ocurrir con las reacciones del slice)
      c.add('C', [0, 0, 0]);
    }
  }
  return c.def();
}

const defs = new Map<string, MolDef>();
export function geometriaMolecula(formula: string): MolDef {
  const f = formula.replace(/[₀-₉]/g, (ch) => String(ch.charCodeAt(0) - 0x2080));
  let d = defs.get(f);
  if (!d) { d = construir(f); defs.set(f, d); }
  return d;
}

// ───────────────────────────── malla ─────────────────────────────

function centroide(d: MolDef): V {
  const c: V = [0, 0, 0];
  d.atomos.forEach((a) => { c[0] += a.p[0]; c[1] += a.p[1]; c[2] += a.p[2]; });
  return mul(c, 1 / d.atomos.length);
}
/** Radio de la esfera envolvente (u) centrada en el centroide, con las bolas incluidas. */
export function radioMolecula(formula: string): number {
  const d = geometriaMolecula(formula);
  const c = centroide(d);
  let r = 0;
  d.atomos.forEach((a) => { r = Math.max(r, largo(res(a.p, c)) * ESCALA_A + (RADIO[a.s] ?? 0.13)); });
  return r;
}

const COLOR_VARILLA = new THREE.Color('#c4cacf');

/** Geometría fusionada de una molécula (centrada en su centroide, en u) con colores por vértice. */
export function mallaMolecula(formula: string): THREE.BufferGeometry {
  return geoCache(`mol:${formula}`, () => {
    const d = geometriaMolecula(formula);
    const c = centroide(d);
    const partes: THREE.BufferGeometry[] = [];
    const pintar = (g: THREE.BufferGeometry, col: THREE.Color) => {
      const n = g.getAttribute('position').count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      return g;
    };
    const pos = d.atomos.map((a) => mul(res(a.p, c), ESCALA_A));
    d.atomos.forEach((a, i) => {
      const g = new THREE.SphereGeometry(RADIO[a.s] ?? 0.13, 20, 14);
      g.translate(pos[i][0], pos[i][1], pos[i][2]);
      partes.push(pintar(g, new THREE.Color(CPK[a.s] ?? '#999999')));
    });
    d.enlaces.forEach(([i, j, orden]) => {
      const a = pos[i], b = pos[j];
      const v = res(b, a);
      const L = largo(v);
      if (L < 1e-6) return;
      const dir = unit(v);
      const [p1] = perps(dir);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir));
      const sep = orden === 1 ? [0] : orden === 2 ? [-0.06, 0.06] : [-0.08, 0, 0.08];
      const r = orden === 1 ? 0.04 : 0.028;
      sep.forEach((s) => {
        const g = new THREE.CylinderGeometry(r, r, L, 10, 1, true);
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(...sum(mul(sum(a, b), 0.5), mul(p1, s))), q, new THREE.Vector3(1, 1, 1),
        );
        g.applyMatrix4(m);
        partes.push(pintar(g, COLOR_VARILLA));
      });
    });
    // todas las partes deben tener los mismos atributos (position, normal, uv, color)
    const fusion = mergeGeometries(partes, false);
    partes.forEach((p) => p.dispose());
    return sanearNormales(fusion ?? new THREE.BufferGeometry());
  });
}

// ───────────────────────────── bandeja con N copias ─────────────────────────────

export interface EspecieBandeja { formula: string; copias: number }
export interface Colocacion { x: number; z: number; y: number; esp: number; escala: number; giro: number; tilt: number }

/** Reparte las copias dentro de un disco de radio R: espiral de girasol + relajación de solapes. */
export function repartirEnDisco(especies: EspecieBandeja[], R: number): { pos: Colocacion[]; escala: number } {
  const items: { esp: number; r: number }[] = [];
  especies.forEach((e, k) => { const r = radioMolecula(e.formula); for (let i = 0; i < Math.min(MAX_COPIAS, e.copias); i++) items.push({ esp: k, r }); });
  if (items.length === 0) return { pos: [], escala: 1 };
  const area = items.reduce((s, it) => s + Math.PI * it.r * it.r, 0);
  const escala = Math.min(1, Math.sqrt((0.5 * Math.PI * R * R) / area));
  const rs = items.map((it) => it.r * escala);
  const n = items.length;
  const px = new Float64Array(n), pz = new Float64Array(n);
  const ang = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const rad = (R - rs[i]) * Math.sqrt((i + 0.5) / n);
    px[i] = Math.cos(i * ang) * rad; pz[i] = Math.sin(i * ang) * rad;
  }
  for (let it = 0; it < 90; it++) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = px[j] - px[i], dz = pz[j] - pz[i];
      const d = Math.hypot(dx, dz) || 1e-4;
      const min = (rs[i] + rs[j]) * 0.92;
      if (d < min) {
        const f = ((min - d) / d) * 0.5;
        px[i] -= dx * f; pz[i] -= dz * f; px[j] += dx * f; pz[j] += dz * f;
      }
    }
    for (let i = 0; i < n; i++) {
      const d = Math.hypot(px[i], pz[i]), lim = R - rs[i];
      if (d > lim) { px[i] *= lim / d; pz[i] *= lim / d; }
    }
  }
  const pos: Colocacion[] = items.map((it, i) => ({
    x: px[i], z: pz[i], y: rs[i], esp: it.esp, escala,
    giro: ((i * 2.399) % (Math.PI * 2)), tilt: ((i * 0.7) % 1) * 0.6 - 0.3,
  }));
  return { pos, escala };
}

const capacidad = (n: number) => Math.min(MAX_COPIAS, Math.max(8, 8 * Math.ceil(n / 8)));

/**
 * N copias de cada especie sobre una bandeja de radio R (origen en el centro del fondo).
 * Cada especie es UN InstancedMesh. Las copias nuevas aparecen creciendo y giran despacio.
 */
export function MoleculasEnBandeja({ especies, radio, velocidad = 0.5 }: { especies: EspecieBandeja[]; radio: number; velocidad?: number }) {
  const clave = especies.map((e) => `${e.formula}:${e.copias}`).join('|');
  const { pos, escala } = useMemo(() => repartirEnDisco(especies, radio), [clave, radio]); // eslint-disable-line react-hooks/exhaustive-deps
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.05 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const mallas = useRef<(THREE.InstancedMesh | null)[]>([]);
  const aparicion = useRef<number[]>([]);
  const aux = useMemo(() => new THREE.Object3D(), []);
  const previas = useRef<Record<string, number>>({});

  // las posiciones recalculadas reinician la aparición sólo de las copias que no existían
  useEffect(() => {
    const cont: Record<string, number> = {};
    pos.forEach((p, i) => {
      const f = especies[p.esp].formula;
      cont[f] = (cont[f] ?? 0) + 1;
      aparicion.current[i] = cont[f] <= (previas.current[f] ?? 0) ? 1 : 0;
    });
    previas.current = cont;
  }, [pos]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime * velocidad;
    const idx: number[] = especies.map(() => 0);
    pos.forEach((p, i) => {
      const k = p.esp;
      const m = mallas.current[k]; if (!m) return;
      const ap = Math.min(1, (aparicion.current[i] ?? 1) + dt * 5);
      aparicion.current[i] = ap;
      const e = 1 - Math.pow(1 - ap, 3);
      aux.position.set(p.x, p.y, p.z);
      aux.rotation.set(p.tilt, p.giro + t * (0.6 + (i % 3) * 0.25), 0);
      aux.scale.setScalar(p.escala * e);
      aux.updateMatrix();
      m.setMatrixAt(idx[k]++, aux.matrix);
    });
    especies.forEach((_, k) => {
      const m = mallas.current[k]; if (!m) return;
      m.count = idx[k];
      m.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      {especies.map((e, k) => (
        <instancedMesh
          key={`${e.formula}:${capacidad(e.copias)}`}
          ref={(o) => { mallas.current[k] = o; }}
          args={[mallaMolecula(e.formula), mat, capacidad(e.copias)]}
          frustumCulled={false}
          castShadow
        />
      ))}
    </group>
  );
}
