"use client";
/**
 * qmi02/particulas.tsx — EL FENÓMENO: las esferas del gas y sus estelas. Todo sale del
 * reloj (`reloj.ts`) cuadro a cuadro: posiciones de la muestra cinética, y el color de
 * cada esfera por su energía ½mv² (`colorRapidez`: frío azul → caliente rojo, la misma
 * escala que pintan las barras del histograma del dock).
 *
 *  · Esferas: un InstancedMesh con emisión × color de instancia (lo que brilla con el
 *    bloom, además de la placa caliente).
 *  · Estelas cortas: el camino de cada esfera en los últimos TAU s de pantalla, x − v·τ,
 *    recortado en la pared (tras un rebote la estela nace en la pared). Su largo es la
 *    rapidez de la esfera a la cámara lenta elegida, y no depende de los cuadros por
 *    segundo del equipo. Segmentos gruesos (LineSegments2), aditivos, que se apagan
 *    hacia la cola.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { esfera, type Calidad } from '../_kit';
import { CAMARA, CAPACIDAD, U_POR_M, colorRapidez, fraccionDentro } from './cinetica';
import type { RelojGas } from './reloj';

/** Radio con que se dibuja cada esfera (u): 3,5 mm. */
export const RADIO_ESFERA = 0.035;
/** Ventana de la estela: los últimos 0,06 s de pantalla. */
const TAU = 0.06;
/** Brillo de emisión × color: en alta pasa de 1 para que el bloom les dé halo. */
const BRILLO = { alta: 2.3, media: 0.95 } as const;
/** Brillo de la cabeza de la estela (la cola va a 0: con mezcla aditiva, transparente). */
const CABEZA = 0.8;

function materialBrillante(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: '#1d2126', roughness: 0.3, metalness: 0, emissive: '#ffffff', emissiveIntensity: 1, name: 'q2-molecula' });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance *= vColor.rgb;\n#endif',
    );
  };
  m.customProgramCacheKey = () => 'q2-molecula-emisiva';
  return m;
}

export function Particulas({ reloj, calidad, estelas = true }: { reloj: React.MutableRefObject<RelojGas>; calidad: Calidad; estelas?: boolean }) {
  const malla = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, calidad === 'alta' ? 14 : 10), [calidad]);
  const mat = useMemo(() => materialBrillante(), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const size = useThree((s) => s.size);

  // ── estelas: un segmento por esfera ──
  const linea = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(CAPACIDAD * 6));
    g.setColors(new Float32Array(CAPACIDAD * 6));
    const m = new LineMaterial({
      linewidth: calidad === 'alta' ? 2.4 : 2, vertexColors: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, worldUnits: false,
    });
    const l = new LineSegments2(g, m);
    l.frustumCulled = false;
    l.renderOrder = 7;
    // las estelas no se «tocan» con el ratón (el rótulo lo da la esfera)
    l.raycast = () => undefined;
    return l;
  }, [calidad]);
  useEffect(() => () => { linea.geometry.dispose(); (linea.material as LineMaterial).dispose(); }, [linea]);
  useEffect(() => { (linea.material as LineMaterial).resolution.set(size.width, size.height); }, [linea, size.width, size.height]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Color(), rgb: [0, 0, 0] as [number, number, number] }), []);
  const brillo = BRILLO[calidad];
  const ultima = useRef(-1);
  const mallaPrevia = useRef<THREE.InstancedMesh | null>(null);
  const lineaPrevia = useRef<LineSegments2 | null>(null);
  const conEstelas = useRef(estelas);

  useFrame(() => {
    const M = malla.current; if (!M) return;
    const r = reloj.current, s = r.sim;
    // sólo cuando el reloj integró un cuadro nuevo (o cambió de muestra)
    const marca = r.version * 7919 + r.generacion;
    if (marca === ultima.current && M === mallaPrevia.current && linea === lineaPrevia.current && estelas === conEstelas.current) return;
    ultima.current = marca; mallaPrevia.current = M; lineaPrevia.current = linea; conEstelas.current = estelas;
    const N = s.N;
    // ── esferas ──
    tmp.e.setScalar(RADIO_ESFERA);
    const col = M.instanceColor ? (M.instanceColor.array as Float32Array) : null;
    for (let i = 0; i < N; i++) {
      tmp.p.set(s.x[i], s.y[i], s.z[i]);
      tmp.m.compose(tmp.p, tmp.q, tmp.e);
      M.setMatrixAt(i, tmp.m);
      const v = Math.sqrt(s.vx[i] ** 2 + s.vy[i] ** 2 + s.vz[i] ** 2);
      colorRapidez(v, s.M, tmp.rgb);
      // sRGB → lineal (el color de instancia se interpreta en lineal)
      tmp.c.setRGB(tmp.rgb[0], tmp.rgb[1], tmp.rgb[2], THREE.SRGBColorSpace).multiplyScalar(brillo);
      M.setColorAt(i, tmp.c);
    }
    M.count = N;
    M.instanceMatrix.needsUpdate = true;
    if (M.instanceColor) M.instanceColor.needsUpdate = true;
    // ── estelas ──
    const g = linea.geometry as LineSegmentsGeometry;
    linea.visible = estelas && N > 0 && !!col;
    if (!linea.visible || !col) return;
    const pos = (g.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.array as Float32Array;
    const cc = (g.attributes.instanceColorStart as THREE.InterleavedBufferAttribute).data.array as Float32Array;
    const k = r.factor * TAU * U_POR_M;        // u por (m/s)
    const rc = CAMARA.R - RADIO_ESFERA, y0 = CAMARA.yFondo + RADIO_ESFERA, y1 = s.yTecho - RADIO_ESFERA;
    const libre = s.abierta;
    const kc = CABEZA / brillo;
    for (let i = 0; i < N; i++) {
      const hx = s.x[i], hy = s.y[i], hz = s.z[i];
      const dx = s.vx[i] * k, dy = s.vy[i] * k, dz = s.vz[i] * k;
      const t = libre ? 1 : fraccionDentro(hx, hy, hz, dx, dy, dz, rc, y0, y1);
      const w = i * 6;
      pos[w] = hx; pos[w + 1] = hy; pos[w + 2] = hz;
      pos[w + 3] = hx - dx * t; pos[w + 4] = hy - dy * t; pos[w + 5] = hz - dz * t;
      cc[w] = col[i * 3] * kc; cc[w + 1] = col[i * 3 + 1] * kc; cc[w + 2] = col[i * 3 + 2] * kc;
      cc[w + 3] = 0; cc[w + 4] = 0; cc[w + 5] = 0;
    }
    g.instanceCount = N;
    (g.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
    (g.attributes.instanceColorStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
  });

  return (
    <group userData={{ pieza: 'gas' }}>
      <instancedMesh ref={malla} args={[geo, mat, CAPACIDAD]} frustumCulled={false} userData={{ pieza: 'gas' }}>
        <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(CAPACIDAD * 3), 3]} />
      </instancedMesh>
      <primitive object={linea} />
    </group>
  );
}
