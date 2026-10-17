"use client";
/**
 * qmi09/iones.tsx — el fenómeno: iones en las disoluciones y en el puente, y los
 * electrones por el cable. TODO sale del reloj de la celda (reloj.ts), cuadro a cuadro:
 *
 *  · CATIONES de cada vaso: hay round(n/4 mmol) esferas; cuando el modelo forma
 *    cationes en el ánodo (Faraday) nacen en la superficie de esa varilla y se alejan;
 *    cuando el cátodo los reduce, el más cercano viaja a la varilla y se deposita.
 *  · K⁺ y NO₃⁻ que el PUENTE cede: t₊·q/F de K⁺ al vaso del cátodo y t₋·q/F de NO₃⁻
 *    al del ánodo (electroneutralidad); salen por la punta de la pata.
 *  · Dentro del puente, K⁺ y NO₃⁻ derivan en sentidos opuestos a v = t·I/(zFcA)
 *    multiplicada por el factor de cámara rápida.
 *  · ELECTRONES: cuentas de luz por el cable, del ánodo al cátodo, a la velocidad de
 *    deriva v = I/(n·e·A) del cobre por el mismo factor. Sin corriente, quietos.
 *  · Agitación térmica de los iones disueltos: paseo aleatorio esquemático (no a escala).
 *
 * Las esferas son 3 InstancedMesh (≈ 3 llamadas de dibujo) con emisión × color de
 * instancia: lo único que brilla (bloom) en la escena.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { esfera, useCalidad } from '../_kit';
import { derivaElectrones, derivaPuente, formaVarilla, T_POTASIO, type IdMetal } from './electroquimica';
import { MOL_POR_ION, ionesVisibles, type RelojCelda } from './reloj';
import { COTAS, ejePuente, recorrido } from './piezas';

/** Colores (sRGB) de cada especie: los mismos que la leyenda del dock. */
export const COLOR_ION: Record<IdMetal | 'K' | 'NO3' | 'e', string> = {
  Zn: '#5ff0c0', Cu: '#39b6ff', Ag: '#ffe6a6', Mg: '#b6ff4f', K: '#b884ff', NO3: '#ff8f3f', e: '#ffd166',
};
/**
 * Brillo de emisión (× color). En alta pasa algo de 1 para que el bloom les dé halo; en
 * media no hay bloom y el tono ACES los lavaría hacia el blanco: se quedan en ~1.
 */
const BRILLO_CAL = { alta: 1.6, media: 0.95 } as const;

function materialBrillante(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: '#23272c', roughness: 0.32, metalness: 0, emissive: '#ffffff', emissiveIntensity: 1, name: 'q9-ion' });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance *= vColor.rgb;\n#endif',
    );
  };
  m.customProgramCacheKey = () => 'q9-ion-emisivo';
  return m;
}

const colorHDR = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k);

// ───────────────────────────── iones de los vasos ─────────────────────────────

const CAP_VASOS = 360;
const LIBRE = 0, NACE = 1, DEPOSITA = 2;
const TIPO_CAT = 0, TIPO_K = 1, TIPO_NIT = 2;

interface Slots {
  activo: Uint8Array; vaso: Uint8Array; tipo: Uint8Array; fase: Uint8Array;
  p: Float32Array; v: Float32Array; t: Float32Array; meta: Float32Array;
}
function crearSlots(): Slots {
  return {
    activo: new Uint8Array(CAP_VASOS), vaso: new Uint8Array(CAP_VASOS), tipo: new Uint8Array(CAP_VASOS), fase: new Uint8Array(CAP_VASOS),
    p: new Float32Array(CAP_VASOS * 3), v: new Float32Array(CAP_VASOS * 3), t: new Float32Array(CAP_VASOS), meta: new Float32Array(CAP_VASOS * 3),
  };
}

/** Generador determinista (para que las capturas sean repetibles). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface PropsIones {
  reloj: React.MutableRefObject<RelojCelda>;
  izq: IdMetal | null;
  der: IdMetal | null;
  /** el puente está en su sitio (si no, no cede iones) */
  puente: boolean;
  animar: boolean;
  calidad: 'alta' | 'media';
}

const xVaso = (v: number) => (v === 0 ? -1 : 1) * COTAS.xVaso;
const xVar = (v: number) => (v === 0 ? -1 : 1) * COTAS.xVarilla;
const xPat = (v: number) => (v === 0 ? -1 : 1) * COTAS.xPata;

export function IonesVasos({ reloj, izq, der, puente, animar, calidad }: PropsIones) {
  const malla = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, 14), []);
  const mat = useMemo(() => materialBrillante(), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const s = useRef<Slots>(crearSlots());
  const gen = useRef(-1);
  const metales = useRef<[IdMetal | null, IdMetal | null]>([izq, der]);
  metales.current = [izq, der];
  const rnd = useMemo(() => azar(90210), []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  const cols = useMemo(() => {
    const b = BRILLO_CAL[calidad];
    return {
      Zn: colorHDR(COLOR_ION.Zn, b), Cu: colorHDR(COLOR_ION.Cu, b), Ag: colorHDR(COLOR_ION.Ag, b), Mg: colorHDR(COLOR_ION.Mg, b),
      K: colorHDR(COLOR_ION.K, b * 1.2), NO3: colorHDR(COLOR_ION.NO3, b * 1.2),
    };
  }, [calidad]);

  const yMin = COTAS.yPunta - 0.03, yMax = COTAS.ySuperficie - 0.028;
  const rMax = COTAS.rInterior - 0.028;

  /** punto libre al azar dentro del líquido del vaso v (fuera de la varilla y la pata) */
  const puntoLibre = (v: number, out: Float32Array, k: number) => {
    for (let intento = 0; intento < 40; intento++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * rMax;
      const x = xVaso(v) + Math.cos(a) * r, z = Math.sin(a) * r, y = yMin + 0.02 + rnd() * (yMax - yMin - 0.02);
      if (Math.hypot(x - xVar(v), z) < COTAS.rVarilla + 0.04) continue;
      if (y > COTAS.yPata - 0.03 && Math.hypot(x - xPat(v), z) < 0.11) continue;
      out[k] = x; out[k + 1] = y; out[k + 2] = z; return;
    }
    out[k] = xVaso(v) - 0.15 * Math.sign(xVaso(v)); out[k + 1] = (yMin + yMax) / 2; out[k + 2] = 0.12;
  };
  const libreSlot = () => { const a = s.current.activo; for (let i = 0; i < CAP_VASOS; i++) if (!a[i]) return i; return -1; };
  const nacer = (v: number, tipo: number, enVarilla: boolean, enPuente: boolean) => {
    const i = libreSlot(); if (i < 0) return;
    const S = s.current, k = i * 3;
    S.activo[i] = 1; S.vaso[i] = v; S.tipo[i] = tipo; S.t[i] = 0;
    if (enVarilla) {
      // en la superficie de la varilla (ánodo), a una altura al azar de la parte mojada
      const f = formaVarilla(v === 0 ? reloj.current.estado.vIzq : reloj.current.estado.vDer);
      const a = rnd() * Math.PI * 2, r = f.r / 10 + 0.012;
      const y = COTAS.ySuperficie - 0.02 - rnd() * Math.max(0.02, f.h / 10 - 0.04);
      S.p[k] = xVar(v) + Math.cos(a) * r; S.p[k + 1] = y; S.p[k + 2] = Math.sin(a) * r;
      S.v[k] = Math.cos(a) * 0.16; S.v[k + 1] = 0; S.v[k + 2] = Math.sin(a) * 0.16;
      S.fase[i] = NACE;
    } else if (enPuente) {
      S.p[k] = xPat(v) + (rnd() - 0.5) * 0.04; S.p[k + 1] = COTAS.yPata - 0.01; S.p[k + 2] = (rnd() - 0.5) * 0.04;
      S.v[k] = (rnd() - 0.5) * 0.08; S.v[k + 1] = -0.14; S.v[k + 2] = (rnd() - 0.5) * 0.08;
      S.fase[i] = NACE;
    } else {
      puntoLibre(v, S.p, k);
      S.v[k] = (rnd() - 0.5) * 0.06; S.v[k + 1] = (rnd() - 0.5) * 0.06; S.v[k + 2] = (rnd() - 0.5) * 0.06;
      S.fase[i] = LIBRE; S.t[i] = 1;
    }
  };

  useFrame((_, dtR) => {
    const M = malla.current; if (!M) return;
    const S = s.current;
    const r = reloj.current;
    // un solo reloj: en pausa se congela también la agitación
    const dt = r.pausa ? 0 : Math.min(dtR, 0.05);
    const [mI, mD] = metales.current;
    // disoluciones nuevas: se reparte la población de golpe
    if (gen.current !== r.generacion) {
      gen.current = r.generacion;
      S.activo.fill(0);
      const e = r.estado;
      const pobl: [number, number, number][] = [
        [0, TIPO_CAT, mI ? ionesVisibles(e.nIzq) : 0], [1, TIPO_CAT, mD ? ionesVisibles(e.nDer) : 0],
        [0, TIPO_K, Math.round(e.kIzq / MOL_POR_ION)], [1, TIPO_K, Math.round(e.kDer / MOL_POR_ION)],
        [0, TIPO_NIT, Math.round(e.nitIzq / MOL_POR_ION)], [1, TIPO_NIT, Math.round(e.nitDer / MOL_POR_ION)],
      ];
      for (const [v, tipo, n] of pobl) for (let j = 0; j < n; j++) nacer(v, tipo, false, false);
    }
    // ─ objetivos del modelo en este cuadro ─
    const e = r.estado;
    const objetivo = [
      [mI ? ionesVisibles(e.nIzq) : 0, Math.round(e.kIzq / MOL_POR_ION), Math.round(e.nitIzq / MOL_POR_ION)],
      [mD ? ionesVisibles(e.nDer) : 0, Math.round(e.kDer / MOL_POR_ION), Math.round(e.nitDer / MOL_POR_ION)],
    ];
    const cuenta = [[0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < CAP_VASOS; i++) if (S.activo[i] && S.fase[i] !== DEPOSITA) cuenta[S.vaso[i]][S.tipo[i]]++;
    for (let v = 0; v < 2; v++) {
      if (!(v === 0 ? mI : mD)) {
        // vaso vacío: fuera todo
        for (let i = 0; i < CAP_VASOS; i++) if (S.activo[i] && S.vaso[i] === v) S.activo[i] = 0;
        continue;
      }
      let presupuesto = 4;
      // cationes que se forman (ánodo) o se depositan (cátodo)
      while (cuenta[v][TIPO_CAT] < objetivo[v][TIPO_CAT] && presupuesto-- > 0) { nacer(v, TIPO_CAT, true, false); cuenta[v][TIPO_CAT]++; }
      while (cuenta[v][TIPO_CAT] > objetivo[v][TIPO_CAT] && presupuesto-- > 0) {
        // el catión libre más cercano a la varilla viaja a depositarse
        let mejor = -1, dMin = Infinity;
        for (let i = 0; i < CAP_VASOS; i++) {
          if (!S.activo[i] || S.vaso[i] !== v || S.tipo[i] !== TIPO_CAT || S.fase[i] === DEPOSITA) continue;
          const d = Math.hypot(S.p[i * 3] - xVar(v), S.p[i * 3 + 2]);
          if (d < dMin) { dMin = d; mejor = i; }
        }
        if (mejor < 0) break;
        const k = mejor * 3;
        const f = formaVarilla(v === 0 ? e.vIzq : e.vDer);
        const a = Math.atan2(S.p[k + 2], S.p[k] - xVar(v));
        S.fase[mejor] = DEPOSITA; S.t[mejor] = 0;
        S.meta[k] = xVar(v) + Math.cos(a) * (f.r / 10); S.meta[k + 1] = Math.min(COTAS.ySuperficie - 0.03, Math.max(COTAS.ySuperficie - f.h / 10 + 0.02, S.p[k + 1]));
        S.meta[k + 2] = Math.sin(a) * (f.r / 10);
        cuenta[v][TIPO_CAT]--;
      }
      if (puente) {
        while (cuenta[v][TIPO_K] < objetivo[v][TIPO_K] && presupuesto-- > -2) { nacer(v, TIPO_K, false, true); cuenta[v][TIPO_K]++; }
        while (cuenta[v][TIPO_NIT] < objetivo[v][TIPO_NIT] && presupuesto-- > -4) { nacer(v, TIPO_NIT, false, true); cuenta[v][TIPO_NIT]++; }
      }
    }
    // ─ movimiento ─
    let n = 0;
    for (let i = 0; i < CAP_VASOS; i++) {
      if (!S.activo[i]) continue;
      const k = i * 3, v = S.vaso[i];
      let escala = S.tipo[i] === TIPO_CAT ? 0.0155 : 0.012;
      if (S.fase[i] === DEPOSITA) {
        S.t[i] += dt / 0.55;
        const u = Math.min(1, S.t[i]);
        const w = u * u * (3 - 2 * u);
        for (let c = 0; c < 3; c++) S.p[k + c] += (S.meta[k + c] - S.p[k + c]) * Math.min(1, w * 0.35 + dt * 6);
        escala *= u < 0.85 ? 1 + 0.35 * u : Math.max(0, (1 - u) / 0.15) * 1.3;
        if (u >= 1) { S.activo[i] = 0; continue; }
      } else {
        if (S.fase[i] === NACE) { S.t[i] += dt / 0.45; escala *= Math.min(1, S.t[i]); if (S.t[i] >= 1) S.fase[i] = LIBRE; }
        if (animar) {
          // paseo aleatorio amortiguado (esquemático)
          const sig = 0.22, gam = 1.6;
          for (let c = 0; c < 3; c++) S.v[k + c] = S.v[k + c] * Math.exp(-gam * dt) + (rnd() - 0.5) * sig * Math.sqrt(dt) * 2;
          for (let c = 0; c < 3; c++) S.p[k + c] += S.v[k + c] * dt;
        }
        // confinamiento: pared del vaso, fondo, superficie, varilla y pata del puente
        const cx = xVaso(v);
        let dx = S.p[k] - cx, dz = S.p[k + 2];
        const rr = Math.hypot(dx, dz);
        if (rr > rMax) { S.p[k] = cx + (dx / rr) * rMax; S.p[k + 2] = (dz / rr) * rMax; S.v[k] *= -0.5; S.v[k + 2] *= -0.5; }
        if (S.p[k + 1] < yMin) { S.p[k + 1] = yMin; S.v[k + 1] = Math.abs(S.v[k + 1]); }
        if (S.p[k + 1] > yMax) { S.p[k + 1] = yMax; S.v[k + 1] = -Math.abs(S.v[k + 1]); }
        const f = formaVarilla(v === 0 ? e.vIzq : e.vDer);
        const rv = f.r / 10 + 0.022;
        dx = S.p[k] - xVar(v); dz = S.p[k + 2];
        const dv = Math.hypot(dx, dz);
        if (dv < rv && S.p[k + 1] > COTAS.ySuperficie - f.h / 10 - 0.02 && dv > 1e-6) { S.p[k] = xVar(v) + (dx / dv) * rv; S.p[k + 2] = (dz / dv) * rv; }
        dx = S.p[k] - xPat(v);
        const dp = Math.hypot(dx, dz);
        if (dp < 0.09 && S.p[k + 1] > COTAS.yPata && dp > 1e-6) { S.p[k] = xPat(v) + (dx / dp) * 0.09; S.p[k + 2] = (dz / dp) * 0.09; }
      }
      tmp.e.set(escala, escala, escala);
      tmp.p.set(S.p[k], S.p[k + 1], S.p[k + 2]);
      tmp.m.compose(tmp.p, tmp.q, tmp.e);
      M.setMatrixAt(n, tmp.m);
      const metal = v === 0 ? mI : mD;
      const col = S.tipo[i] === TIPO_K ? cols.K : S.tipo[i] === TIPO_NIT ? cols.NO3 : metal ? cols[metal] : cols.Zn;
      M.setColorAt(n, col);
      n++;
    }
    M.count = n;
    M.instanceMatrix.needsUpdate = true;
    if (M.instanceColor) M.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={malla} args={[geo, mat, CAP_VASOS]} frustumCulled={false} userData={{ pieza: 'iones' }}>
      <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(CAP_VASOS * 3), 3]} />
    </instancedMesh>
  );
}

// ───────────────────────────── iones del puente ─────────────────────────────

const N_PUENTE = 13;

/** K⁺ y NO₃⁻ dentro del gel, derivando en sentidos opuestos. Va DENTRO del grupo del puente. */
export function IonesPuente({ reloj, animar }: { reloj: React.MutableRefObject<RelojCelda>; animar: boolean }) {
  const malla = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, 12), []);
  const mat = useMemo(() => materialBrillante(), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const eje = useMemo(() => recorrido(ejePuente(14)), []);
  const est = useMemo(() => {
    const r = azar(777);
    const n = 2 * N_PUENTE;
    const s = new Float32Array(n), off = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { s[i] = ((i % N_PUENTE) + r() * 0.8) * (eje.L / N_PUENTE); off[i * 2] = (r() - 0.5) * 0.05; off[i * 2 + 1] = (r() - 0.5) * 0.05; }
    return { s, off };
  }, [eje]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  const b = BRILLO_CAL[useCalidad()];
  const cK = useMemo(() => colorHDR(COLOR_ION.K, b * 1.2), [b]), cN = useMemo(() => colorHDR(COLOR_ION.NO3, b * 1.2), [b]);
  useFrame((_, dtR) => {
    const M = malla.current; if (!M) return;
    const r = reloj.current;
    const l = r.lectura;
    const dt = r.pausa ? 0 : Math.min(dtR, 0.05);
    // sentido: el K⁺ va hacia el cátodo; s crece hacia la pata derecha
    const haciaDer = l.anodo === 'izq' ? 1 : -1;
    const I = Math.abs(l.I);
    const vK = derivaPuente(I, T_POTASIO) * r.factor * 10, vN = derivaPuente(I, 1 - T_POTASIO) * r.factor * 10;
    for (let i = 0; i < 2 * N_PUENTE; i++) {
      const esK = i < N_PUENTE;
      if (animar) est.s[i] += (esK ? 1 : -1) * haciaDer * (esK ? vK : vN) * dt;
      est.s[i] = ((est.s[i] % eje.L) + eje.L) % eje.L;
      eje.en(est.s[i], tmp.p);
      tmp.p.x += est.off[i * 2] * (Math.abs(tmp.p.y) < 0.05 ? 0.6 : 1);
      tmp.p.z += est.off[i * 2 + 1];
      // asoman y se esconden en las puntas del gel
      const borde = Math.min(est.s[i], eje.L - est.s[i]);
      const k = Math.min(1, borde / 0.08) * 0.0125;
      tmp.e.set(k, k, k);
      tmp.m.compose(tmp.p, tmp.q, tmp.e);
      M.setMatrixAt(i, tmp.m);
      M.setColorAt(i, esK ? cK : cN);
    }
    M.instanceMatrix.needsUpdate = true;
    if (M.instanceColor) M.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={malla} args={[geo, mat, 2 * N_PUENTE]} frustumCulled={false} renderOrder={6}>
      <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(2 * N_PUENTE * 3), 3]} />
    </instancedMesh>
  );
}

// ───────────────────────────── electrones ─────────────────────────────

const N_E = 46;

/**
 * Electrones por el circuito exterior. `traza` es la polilínea pinza izq. → borne
 * COM → (dentro del instrumento) → borne + → pinza der.; los tramos [ocultoDesde,
 * ocultoHasta] (el interior del aparato) no se dibujan.
 */
export function Electrones({ reloj, traza, oculto, visible, animar }: {
  reloj: React.MutableRefObject<RelojCelda>; traza: number[]; oculto: [number, number]; visible: boolean; animar: boolean;
}) {
  const malla = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, 12), []);
  const mat = useMemo(() => materialBrillante(), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const rec = useMemo(() => recorrido(traza), [traza]);
  const s = useRef<Float32Array>(Float32Array.from({ length: N_E }, (_, i) => (i + 0.5) / N_E));
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  const b = BRILLO_CAL[useCalidad()];
  const col = useMemo(() => colorHDR(COLOR_ION.e, b * 1.6), [b]);
  const colQuieto = useMemo(() => colorHDR(COLOR_ION.e, b * 0.55), [b]);
  useFrame((_, dtR) => {
    const M = malla.current; if (!M) return;
    M.visible = visible;
    if (!visible) return;
    const r = reloj.current;
    const l = r.lectura;
    const dt = r.pausa ? 0 : Math.min(dtR, 0.05);
    const dir = l.anodo === 'izq' ? 1 : -1;
    const v = derivaElectrones(Math.abs(l.I)) * r.factor * 10;      // u/s
    const fluye = v > 1e-3;
    const L = rec.L;
    for (let i = 0; i < N_E; i++) {
      if (animar) s.current[i] = (((s.current[i] + (dir * v * dt) / L) % 1) + 1) % 1;
      const u = s.current[i] * L;
      rec.en(u, tmp.p);
      const dentro = u > oculto[0] && u < oculto[1];
      const k = dentro ? 0 : fluye ? 0.0135 : 0.0105;
      tmp.e.set(k, k, k);
      tmp.m.compose(tmp.p, tmp.q, tmp.e);
      M.setMatrixAt(i, tmp.m);
      M.setColorAt(i, fluye ? col : colQuieto);
    }
    M.instanceMatrix.needsUpdate = true;
    if (M.instanceColor) M.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={malla} args={[geo, mat, N_E]} frustumCulled={false} userData={{ pieza: 'electrones' }}>
      <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(N_E * 3), 3]} />
    </instancedMesh>
  );
}
