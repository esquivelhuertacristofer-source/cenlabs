'use client';
/**
 * mat_comun_6a10/ejes.tsx — ejes con rejilla y números para gráficas con DOS
 * escalas distintas (p. ej. t en s y s en m). Todo se pasa en unidades
 * matemáticas; `sx` y `sy` convierten a unidades de escena (u).
 *
 *  - `RejillaEjes`: rejilla fina + ejes con flecha + números legibles (≥ 0,4 u) + títulos.
 *  - `aEscena`: helper para convertir una función y = f(x) a la que dibuja `CurvaFuncion`
 *    (que trabaja en u de escena con escala 1).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Etiqueta, numeroEje } from '../_kit';
import { Trazo } from '../mat_comun_1a5/trazos';

export interface PropsRejillaEjes {
  x0: number; x1: number; y0: number; y1: number;
  sx: number; sy: number;
  pasoX: number; pasoY: number;
  /** sub-rejilla (por defecto igual al paso de los números) */
  rejillaX?: number; rejillaY?: number;
  tituloX?: string; tituloY?: string;
  tam?: number;
  colorTexto?: string;
  /** fondo de la rejilla: un lienzo claro o la propia pizarra */
  colorRejilla?: string;
  colorEje?: string;
}

export function RejillaEjes({
  x0, x1, y0, y1, sx, sy, pasoX, pasoY, rejillaX, rejillaY, tituloX, tituloY,
  tam = 0.42, colorTexto = '#dfe8ec', colorRejilla = '#52646d', colorEje = '#eef3f5',
}: PropsRejillaEjes) {
  const gx = rejillaX ?? pasoX, gy = rejillaY ?? pasoY;
  const geo = useMemo(() => {
    const p: number[] = [];
    const lin = (ax: number, ay: number, bx: number, by: number) => p.push(ax * sx, ay * sy, 0, bx * sx, by * sy, 0);
    for (let k = Math.ceil(x0 / gx - 1e-9); k * gx <= x1 + 1e-9; k++) lin(k * gx, y0, k * gx, y1);
    for (let k = Math.ceil(y0 / gy - 1e-9); k * gy <= y1 + 1e-9; k++) lin(x0, k * gy, x1, k * gy);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [x0, x1, y0, y1, sx, sy, gx, gy]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: colorRejilla, transparent: true, opacity: 0.8, toneMapped: false }), [colorRejilla]);
  const matCono = useMemo(() => new THREE.MeshBasicMaterial({ color: colorEje, toneMapped: false }), [colorEje]);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => { mat.dispose(); matCono.dispose(); }, [mat, matCono]);
  const numeros: React.ReactNode[] = [];
  for (let k = Math.ceil(x0 / pasoX - 1e-9); k * pasoX <= x1 + 1e-9; k++) {
    const v = k * pasoX;
    numeros.push(<Etiqueta key={'x' + k} modo="plano" texto={numeroEje(v)} color={colorTexto} peso={500} tamano={tam} ancla={[0.5, 1]} position={[v * sx, y0 * sy - 0.16, 0.004]} />);
  }
  for (let k = Math.ceil(y0 / pasoY - 1e-9); k * pasoY <= y1 + 1e-9; k++) {
    const v = k * pasoY;
    numeros.push(<Etiqueta key={'y' + k} modo="plano" texto={numeroEje(v)} color={colorTexto} peso={500} tamano={tam} ancla={[1, 0.5]} position={[x0 * sx - 0.16, v * sy, 0.004]} />);
  }
  const X0 = x0 * sx, X1 = x1 * sx, Y0 = y0 * sy, Y1 = y1 * sy;
  return (
    <group>
      <lineSegments geometry={geo} material={mat} />
      <Trazo pts={[[X0, Y0], [X1 + 0.1, Y0]]} color={colorEje} radio={0.022} z={0.003} />
      <Trazo pts={[[X0, Y0], [X0, Y1 + 0.1]]} color={colorEje} radio={0.022} z={0.003} />
      <mesh material={matCono} position={[X1 + 0.28, Y0, 0.003]} rotation-z={-Math.PI / 2}><coneGeometry args={[0.1, 0.28, 12]} /></mesh>
      <mesh material={matCono} position={[X0, Y1 + 0.28, 0.003]}><coneGeometry args={[0.1, 0.28, 12]} /></mesh>
      {numeros}
      {tituloX && <Etiqueta modo="plano" texto={tituloX} color={colorEje} peso={600} tamano={tam * 1.05} ancla={[0.5, 1]} position={[(X0 + X1) / 2, Y0 - 0.16 - tam * 1.9, 0.004]} />}
      {tituloY && <Etiqueta modo="plano" texto={tituloY} color={colorEje} peso={600} tamano={tam * 1.05} ancla={[0, 0.5]} position={[X0 - 0.1, Y1 + 0.78, 0.004]} />}
    </group>
  );
}

/** Convierte y = f(x) en unidades matemáticas a la función en unidades de escena. */
export const aEscena = (f: (x: number) => number, sx: number, sy: number) => (u: number) => sy * f(u / sx);
