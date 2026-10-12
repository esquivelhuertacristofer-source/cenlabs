'use client';
/**
 * mat_comun_1a5/trazos.tsx — piezas de línea compartidas por los labs de
 * matemáticas 1 a 5 (el kit sólo trae la curva continua).
 *
 *  - `Trazo`: polilínea plana (en el plano XY) como tubo fino; continua o a rayas.
 *  - `EncuadreSuave`: encuadra una caja con la cámara, pero con una transición
 *    corta cuando la caja cambia (un deslizador no «salta» la vista).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tuboPolilinea, Etiqueta } from '../_kit';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

type V3 = [number, number, number];

/** Parte una polilínea en rayas de longitud `raya` separadas por `hueco`. */
export function rayar(pts: [number, number][], raya: number, hueco: number): [number, number][][] {
  const out: [number, number][][] = [];
  if (pts.length < 2) return out;
  let actual: [number, number][] = [pts[0]];
  let pintando = true, resto = raya;
  for (let i = 1; i < pts.length; i++) {
    let [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    let l = Math.hypot(x1 - x0, y1 - y0);
    while (l > resto && l > 1e-9) {
      const t = resto / l;
      const xm = x0 + (x1 - x0) * t, ym = y0 + (y1 - y0) * t;
      if (pintando) { actual.push([xm, ym]); out.push(actual); actual = []; }
      else actual = [[xm, ym]];
      pintando = !pintando;
      resto = pintando ? raya : hueco;
      x0 = xm; y0 = ym;
      l = Math.hypot(x1 - x0, y1 - y0);
    }
    resto -= l;
    if (pintando) actual.push([x1, y1]);
  }
  if (pintando && actual.length > 1) out.push(actual);
  return out;
}

export interface PropsTrazo extends Omit<ThreeElements['group'], 'position'> {
  /** puntos en unidades de escena (plano XY) */
  pts: [number, number][];
  color?: string;
  radio?: number;
  /** [raya, hueco] en u de escena; sin él, la línea es continua */
  rayas?: [number, number];
  z?: number;
  opacidad?: number;
}
/** Polilínea plana con tubo fino (continua o a rayas). Geometría memoizada y liberada. */
export function Trazo({ pts, color = '#ffffff', radio = 0.012, rayas, z = 0.003, opacidad = 1, ...g }: PropsTrazo) {
  const huella = useMemo(() => pts.map((p) => p[0].toFixed(3) + ',' + p[1].toFixed(3)).join(';') + `|${radio}|${rayas?.join(',') ?? ''}|${z}`, [pts, radio, rayas, z]);
  const geo = useMemo(() => {
    const tramos = rayas ? rayar(pts, rayas[0], rayas[1]) : [pts];
    const partes = tramos.filter((t) => t.length > 1).map((t) => {
      const a = new Float32Array(t.length * 3);
      t.forEach(([x, y], i) => a.set([x, y, z], i * 3));
      return tuboPolilinea(a, radio, 6, true);
    }).filter((p) => p.getAttribute('position'));
    if (!partes.length) return new THREE.BufferGeometry();
    if (partes.length === 1) return partes[0];
    const u = mergeGeometries(partes, false)!;
    partes.forEach((p) => p.dispose());
    return u;
  }, [huella]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacidad < 1, opacity: opacidad }), [color, opacidad]);
  useEffect(() => () => mat.dispose(), [mat]);
  return <group {...g}><mesh geometry={geo} material={mat} /></group>;
}

/** Encuadra la caja con la cámara y, si la caja cambia, hace una transición suave. */
export function EncuadreSuave({ caja, margen = 1.08, direccion = [0, 0, 1] }: { caja: [V3, V3]; margen?: number; direccion?: V3 }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const meta = useRef<{ centro: THREE.Vector3; dist: number; anim: boolean; primera: boolean; dir: THREE.Vector3 }>({
    centro: new THREE.Vector3(), dist: 10, anim: false, primera: true, dir: new THREE.Vector3(...direccion).normalize(),
  });
  const clave = [...caja[0], ...caja[1]].map((v) => v.toFixed(3)).join(',');
  useEffect(() => {
    const m = meta.current;
    if (m.primera) m.dir.set(...direccion).normalize();
    const min = new THREE.Vector3(...caja[0]), max = new THREE.Vector3(...caja[1]);
    m.centro.copy(min).add(max).multiplyScalar(0.5);
    const tam = max.clone().sub(min);
    const aspect = size.width / Math.max(1, size.height);
    const fovV = THREE.MathUtils.degToRad(camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    // extensión proyectada: con la cámara elevada, la profundidad de la caja suma al alto
    const dn = m.dir.clone().normalize();
    const elev = Math.asin(Math.min(1, Math.abs(dn.y)));
    const altoP = tam.y * Math.cos(elev) + tam.z * Math.sin(elev);
    const anchoP = tam.x + tam.z * Math.abs(dn.x);
    const dV = (altoP / 2) / Math.tan(fovV / 2), dH = (anchoP / 2) / Math.tan(fovH / 2);
    m.dist = Math.max(dV, dH) * margen + tam.z / 2 * Math.cos(elev);
    if (m.primera) {
      m.primera = false;
      camera.position.copy(m.centro).addScaledVector(m.dir, m.dist);
      camera.near = 0.05; camera.far = m.dist * 40 + 100; camera.updateProjectionMatrix();
      camera.lookAt(m.centro);
      if (controls && 'target' in controls) { controls.target.copy(m.centro); controls.update(); }
    } else m.anim = true;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, size.width, size.height, controls]);
  useFrame((_, dt) => {
    const m = meta.current;
    if (!m.anim) return;
    const tgt = controls && 'target' in controls ? controls.target : m.centro.clone();
    const dir = camera.position.clone().sub(tgt);
    const dActual = Math.max(1e-3, dir.length());
    dir.normalize();
    const k = 1 - Math.exp(-dt * 7);
    tgt.lerp(m.centro, k);
    const d = dActual + (m.dist - dActual) * k;
    camera.position.copy(tgt).addScaledVector(dir, d);
    camera.lookAt(tgt);
    if (controls && 'update' in controls) controls.update();
    if (tgt.distanceTo(m.centro) < 0.01 && Math.abs(d - m.dist) < 0.02) m.anim = false;
  });
  return null;
}

/** Números de los ejes con el tamaño que se pida (el kit los limita a 0,26 u). */
export function NumerosEje({ rangoX, rangoY, paso = 2, tam = 0.45, color = '#dfe8ec', escala = 1 }: {
  rangoX: [number, number]; rangoY: [number, number]; paso?: number; tam?: number; color?: string; escala?: number;
}) {
  const out: React.ReactNode[] = [];
  const fmt = (v: number) => String(v).replace('-', '−');
  for (let k = Math.ceil(rangoX[0] / paso); k * paso <= rangoX[1] + 1e-9; k++) {
    const v = k * paso; if (v === 0) continue;
    out.push(<Etiqueta key={'x' + k} modo="plano" texto={fmt(v)} color={color} peso={500} tamano={tam} ancla={[0.5, 1]} position={[v * escala, -0.14 * tam / 0.26, 0.004]} />);
  }
  for (let k = Math.ceil(rangoY[0] / paso); k * paso <= rangoY[1] + 1e-9; k++) {
    const v = k * paso; if (v === 0) continue;
    out.push(<Etiqueta key={'y' + k} modo="plano" texto={fmt(v)} color={color} peso={500} tamano={tam} ancla={[1, 0.5]} position={[-0.14 * tam / 0.26, v * escala, 0.004]} />);
  }
  return <group>{out}</group>;
}
