'use client';
/**
 * _kit/matematicas.tsx — plano cartesiano, curvas, ángulos y puntos para los labs
 * de matemáticas (fondo "pizarron").
 *
 * Todos trabajan en el plano XY (z = 0) con una `escala` común: 1 unidad
 * matemática = `escala` u de escena. Pásales la MISMA escala.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cilindro, esfera, geoCache, tuboPolilinea } from './geometria';
import { Etiqueta } from './texto';
import { barridoAngulo, anguloDe, muestrearFuncion, pasoBonito, numeroEje } from './calculos';

type GroupProps = ThreeElements['group'];

// (las utilidades puras —pasoBonito, muestrearFuncion, barridoAngulo…— viven en ./calculos)

// ───────────────────────────── plano cartesiano ─────────────────────────────

export interface PropsPlano extends GroupProps {
  rangoX?: [number, number];
  rangoY?: [number, number];
  /** separación de la rejilla fina (unidades matemáticas) */
  paso?: number;
  /** cada cuántas unidades una línea gruesa */
  pasoMayor?: number;
  /** cada cuántas unidades un número (por defecto: automático, ≤ 10 por eje) */
  pasoEtiquetas?: number;
  escala?: number;
  etiquetas?: boolean;
  nombresEjes?: [string, string];
  colorEjes?: string;
  colorRejilla?: string;
  colorRejillaMayor?: string;
  colorTexto?: string;
}
/** Plano cartesiano: rejilla en UNA geometría de líneas (color por vértice), ejes con flecha y números. */
export function PlanoCartesiano({
  rangoX = [-10, 10], rangoY = [-6, 6], paso = 1, pasoMayor = 5, pasoEtiquetas, escala = 0.5, etiquetas = true,
  nombresEjes = ['x', 'y'], colorEjes = '#eef3f5', colorRejilla = '#4b5b63', colorRejillaMayor = '#6f838d', colorTexto = '#dfe8ec', ...g
}: PropsPlano) {
  const [x0, x1] = rangoX, [y0, y1] = rangoY;
  const rejilla = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const cMen = new THREE.Color(colorRejilla), cMay = new THREE.Color(colorRejillaMayor), cEje = new THREE.Color(colorEjes);
    const esMayor = (v: number) => pasoMayor > 0 && Math.abs(v / pasoMayor - Math.round(v / pasoMayor)) < 1e-6;
    const linea = (ax: number, ay: number, bx: number, by: number, c: THREE.Color) => {
      pos.push(ax * escala, ay * escala, 0, bx * escala, by * escala, 0);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    };
    for (let k = Math.ceil(x0 / paso); k * paso <= x1 + 1e-9; k++) {
      const x = k * paso; if (Math.abs(x) < 1e-9) continue;
      linea(x, y0, x, y1, esMayor(x) ? cMay : cMen);
    }
    for (let k = Math.ceil(y0 / paso); k * paso <= y1 + 1e-9; k++) {
      const y = k * paso; if (Math.abs(y) < 1e-9) continue;
      linea(x0, y, x1, y, esMayor(y) ? cMay : cMen);
    }
    // marcas sobre los ejes
    const pe = pasoEtiquetas ?? pasoBonito(Math.max(x1 - x0, y1 - y0), 10);
    const t = 0.09 / escala;
    for (let k = Math.ceil(x0 / pe); k * pe <= x1 + 1e-9; k++) { const x = k * pe; if (Math.abs(x) > 1e-9) linea(x, -t, x, t, cEje); }
    for (let k = Math.ceil(y0 / pe); k * pe <= y1 + 1e-9; k++) { const y = k * pe; if (Math.abs(y) > 1e-9) linea(-t, y, t, y, cEje); }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return gg;
  }, [x0, x1, y0, y1, paso, pasoMayor, pasoEtiquetas, escala, colorEjes, colorRejilla, colorRejillaMayor]);
  useEffect(() => () => rejilla.dispose(), [rejilla]);
  const matLineas = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, toneMapped: false }), []);
  const matEje = useMemo(() => new THREE.MeshBasicMaterial({ color: colorEjes, toneMapped: false }), [colorEjes]);
  useEffect(() => () => { matLineas.dispose(); matEje.dispose(); }, [matLineas, matEje]);
  const pe = pasoEtiquetas ?? pasoBonito(Math.max(x1 - x0, y1 - y0), 10);
  const tam = Math.min(0.26, Math.max(0.12, pe * escala * 0.32));
  const numeros: React.ReactNode[] = [];
  if (etiquetas) {
    for (let k = Math.ceil(x0 / pe); k * pe <= x1 + 1e-9; k++) {
      const x = k * pe; if (Math.abs(x) < 1e-9 || x >= x1 - 1e-9) continue;
      numeros.push(<Etiqueta key={'x' + k} modo="plano" texto={numeroEje(x)} color={colorTexto} peso={500} tamano={tam} ancla={[0.5, 1]} position={[x * escala, -0.12, 0.002]} />);
    }
    for (let k = Math.ceil(y0 / pe); k * pe <= y1 + 1e-9; k++) {
      const y = k * pe; if (Math.abs(y) < 1e-9 || y >= y1 - 1e-9) continue;
      numeros.push(<Etiqueta key={'y' + k} modo="plano" texto={numeroEje(y)} color={colorTexto} peso={500} tamano={tam} ancla={[1, 0.5]} position={[-0.12, y * escala, 0.002]} />);
    }
    numeros.push(<Etiqueta key="o" modo="plano" texto="0" color={colorTexto} peso={500} tamano={tam} ancla={[1, 1]} position={[-0.08, -0.08, 0.002]} />);
  }
  const grosorEje = 0.012;
  const lx = (x1 - x0) * escala, ly = (y1 - y0) * escala;
  const flecha = geoCache('conoEje', () => new THREE.ConeGeometry(1, 1, 16));
  return (
    <group {...g}>
      <lineSegments geometry={rejilla} material={matLineas} />
      {/* ejes (sólo si el cero está dentro del rango) */}
      {y0 <= 0 && y1 >= 0 && (
        <>
          <mesh geometry={cilindro(1, 1, 1, 8)} material={matEje} scale={[grosorEje, lx, grosorEje]} rotation-z={-Math.PI / 2} position={[(x0 + x1) / 2 * escala, 0, 0]} />
          <mesh geometry={flecha} material={matEje} scale={[0.06, 0.2, 0.06]} rotation-z={-Math.PI / 2} position={[x1 * escala + 0.1, 0, 0]} />
          <Etiqueta modo="plano" texto={`*${nombresEjes[0]}*`} color={colorEjes} tamano={0.3} ancla={[0, 0.5]} position={[x1 * escala + 0.28, 0, 0.002]} />
        </>
      )}
      {x0 <= 0 && x1 >= 0 && (
        <>
          <mesh geometry={cilindro(1, 1, 1, 8)} material={matEje} scale={[grosorEje, ly, grosorEje]} position={[0, (y0 + y1) / 2 * escala, 0]} />
          <mesh geometry={flecha} material={matEje} scale={[0.06, 0.2, 0.06]} position={[0, y1 * escala + 0.1, 0]} />
          <Etiqueta modo="plano" texto={`*${nombresEjes[1]}*`} color={colorEjes} tamano={0.3} ancla={[0.5, 0]} position={[0, y1 * escala + 0.26, 0.002]} />
        </>
      )}
      {numeros}
    </group>
  );
}

// ───────────────────────────── curva de una función ─────────────────────────────

export interface PropsCurva extends GroupProps {
  f: (x: number) => number;
  rango: [number, number];
  escala?: number;
  color?: string;
  /** radio del tubo (u) */
  grosor?: number;
  /** recorte vertical en unidades matemáticas (asíntotas) */
  recorteY?: [number, number];
  /** huella para forzar regeneración si `f` depende de algo externo */
  version?: string | number;
}
/** Curva y = f(x) como tubo (muestreo adaptativo; se libera la geometría al cambiar). */
export function CurvaFuncion({ f, rango, escala = 0.5, color = '#ffb703', grosor = 0.022, recorteY = [-1e6, 1e6], version, ...g }: PropsCurva) {
  // huella numérica: si `f` llega como lambda nueva en cada render pero calcula
  // lo mismo, no se regenera la geometría
  const huella = useMemo(() => {
    const vals: string[] = [];
    for (let i = 0; i <= 16; i++) { const x = rango[0] + ((rango[1] - rango[0]) * i) / 16; vals.push(f(x).toFixed(6)); }
    return vals.join(',') + `|${rango.join(',')}|${escala}|${grosor}|${recorteY.join(',')}|${version ?? ''}`;
  }, [f, rango[0], rango[1], escala, grosor, recorteY[0], recorteY[1], version]); // eslint-disable-line react-hooks/exhaustive-deps
  const geo = useMemo(() => {
    const tramos = muestrearFuncion(f, rango[0], rango[1], { escala, tol: grosor * 0.25, recorteY });
    const partes = tramos.map((t) => {
      const pts = new Float32Array(t.length * 3);
      t.forEach(([x, y], i) => pts.set([x * escala, y * escala, 0.004], i * 3));
      return tuboPolilinea(pts, grosor, 8, true);
    }).filter((p) => p.getAttribute('position'));
    if (!partes.length) return new THREE.BufferGeometry();
    const unida = partes.length === 1 ? partes[0] : mergeGeometries(partes, false)!;
    if (partes.length > 1) partes.forEach((p) => p.dispose());
    return unida;
  }, [huella]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: color, emissiveIntensity: 0.25 }), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  return <group {...g}><mesh geometry={geo} material={mat} /></group>;
}

// ───────────────────────────── ángulo ─────────────────────────────

export interface PropsArco extends GroupProps {
  /** ángulos en grados (antihorario desde +X) o vectores 2D */
  desde: number | [number, number];
  hasta: number | [number, number];
  radio?: number;
  sentido?: 'antihorario' | 'horario' | 'menor';
  color?: string;
  etiqueta?: string;
  relleno?: boolean;
  /** si el ángulo es recto, dibuja la escuadra ∟ */
  marcaRecta?: boolean;
}
/** Arco de ángulo con sector sombreado y etiqueta en la bisectriz. */
export function ArcoAngulo({ desde, hasta, radio = 0.6, sentido = 'menor', color = '#8ecae6', etiqueta, relleno = true, marcaRecta = true, ...g }: PropsArco) {
  const a0 = typeof desde === 'number' ? desde : anguloDe(desde);
  const a1 = typeof hasta === 'number' ? hasta : anguloDe(hasta);
  const { inicio, barrido } = barridoAngulo(a0, a1, sentido);
  const recto = marcaRecta && Math.abs(Math.abs(barrido) - 90) < 0.05;
  const geos = useMemo(() => {
    const ini = (inicio * Math.PI) / 180, bar = (barrido * Math.PI) / 180;
    let linea: THREE.BufferGeometry;
    if (recto) {
      const l = radio * 0.55;
      const u = [Math.cos(ini), Math.sin(ini)], v = [Math.cos(ini + bar), Math.sin(ini + bar)];
      linea = tuboPolilinea(new Float32Array([u[0] * l, u[1] * l, 0.003, (u[0] + v[0]) * l, (u[1] + v[1]) * l, 0.003, v[0] * l, v[1] * l, 0.003]), 0.012, 6, true);
    } else {
      const n = Math.max(8, Math.ceil(Math.abs(barrido) / 4));
      const pts = new Float32Array((n + 1) * 3);
      for (let i = 0; i <= n; i++) { const a = ini + (bar * i) / n; pts.set([Math.cos(a) * radio, Math.sin(a) * radio, 0.003], i * 3); }
      linea = tuboPolilinea(pts, 0.014, 6, true);
    }
    // el sector se construye con barrido positivo (CircleGeometry gira antihorario)
    const sector = new THREE.CircleGeometry(recto ? radio * 0.55 * Math.SQRT2 : radio, Math.max(8, Math.ceil(Math.abs(barrido) / 4)),
      bar >= 0 ? ini : ini + bar, Math.abs(bar));
    return { linea, sector };
  }, [inicio, barrido, radio, recto]);
  useEffect(() => () => { geos.linea.dispose(); geos.sector.dispose(); }, [geos]);
  const matL = useMemo(() => new THREE.MeshBasicMaterial({ color, toneMapped: false }), [color]);
  const matS = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), [color]);
  useEffect(() => () => { matL.dispose(); matS.dispose(); }, [matL, matS]);
  const mid = ((inicio + barrido / 2) * Math.PI) / 180;
  const rEt = radio * 1.35 + 0.1;
  return (
    <group {...g}>
      {relleno && !recto && <mesh geometry={geos.sector} material={matS} position={[0, 0, 0.001]} />}
      <mesh geometry={geos.linea} material={matL} />
      {etiqueta && <Etiqueta modo="plano" texto={etiqueta} color={color} tamano={0.22} position={[Math.cos(mid) * rEt, Math.sin(mid) * rEt, 0.004]} />}
    </group>
  );
}

// ───────────────────────────── punto marcado ─────────────────────────────

export interface PropsPunto extends GroupProps {
  x: number; y: number;
  escala?: number;
  color?: string;
  etiqueta?: string;
  radio?: number;
  /** líneas discontinuas hasta los ejes */
  proyecciones?: boolean;
}
/** Punto (x, y) con etiqueta y proyecciones opcionales a los ejes. */
export function PuntoMarcado({ x, y, escala = 0.5, color = '#fb8500', etiqueta, radio = 0.07, proyecciones = false, ...g }: PropsPunto) {
  const X = x * escala, Y = y * escala;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0.3 }), [color]);
  const lineas = useMemo(() => {
    if (!proyecciones) return null;
    const gg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X, Y, 0.002), new THREE.Vector3(X, 0, 0.002), new THREE.Vector3(X, Y, 0.002), new THREE.Vector3(0, Y, 0.002)]);
    const l = new THREE.LineSegments(gg, new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06, toneMapped: false }));
    l.computeLineDistances();
    return l;
  }, [X, Y, color, proyecciones]);
  useEffect(() => () => { mat.dispose(); if (lineas) { lineas.geometry.dispose(); (lineas.material as THREE.Material).dispose(); } }, [mat, lineas]);
  return (
    <group {...g}>
      {lineas && <primitive object={lineas} />}
      <mesh geometry={esfera(1, 20)} material={mat} position={[X, Y, 0.02]} scale={radio} />
      {etiqueta && <Etiqueta modo="plano" texto={etiqueta} color={color} tamano={0.2} ancla={[0, 0]} position={[X + radio * 1.2, Y + radio * 1.2, 0.004]} fondo="rgba(20,30,36,0.75)" />}
    </group>
  );
}
