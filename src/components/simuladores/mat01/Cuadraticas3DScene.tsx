"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Cuadraticas3DScene — pizarrón con la parábola del alumno, la guía punteada y
   los tres puntos medidos de la trayectoria objetivo.

   Además de graficar f(x)=ax²+bx+c revela lo que hace ÚNICA a una parábola: su
   FOCO y su DIRECTRIZ (p = 1/4a) y la propiedad reflectante (todo rayo paralelo
   al eje se refleja hacia el foco). Si Δ<0, el par de raíces complejas
   conjugadas aparece en un plano de Argand aparte, a la derecha de la parábola.

   Encuadre: la caja de la vista se calcula con los puntos medidos, el vértice,
   el intercepto y las raíces reales del alumno (nunca con la parábola objetivo)
   y se transiciona con suavidad. Sin dock encima: el Piloto usa LabLayout.

   Props (interfaz estable con el Piloto): { a, b, c, target, currentRes, escenario?, puntosObjetivo }.
──────────────────────────────────────────────────────────────────────────── */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, PlanoCartesiano, CurvaFuncion, PuntoMarcado, Etiqueta, cajaRedondeada, pasoBonito } from '../_kit';
import { Trazo, EncuadreSuave } from '../mat_comun_1a5/trazos';

interface ComplexRoot { real: number; imaginary: number; }
interface Vertex { h: number; k: number; }
interface CurrentRes { delta: number; vertex: Vertex; roots: ComplexRoot[]; nature: string; }
type Escenario = 'parabola_basica' | 'lanzamiento_proyectil' | 'arquitectura_arco' | 'focalizacion_antena';

interface Cuadraticas3DSceneProps {
  a: number;
  b: number;
  c: number;
  target: { a: number; b: number; c: number };
  currentRes: CurrentRes;
  escenario?: Escenario;
  /** Puntos medidos de la trayectoria objetivo (datos del reto). */
  puntosObjetivo?: Array<{ x: number; y: number }>;
}

const PLANO_X = 16;        // la rejilla llega hasta ±16 en x
const PLANO_Y = 18;        // y hasta ±18
const C_ALUMNO = '#ff6b9b';
const C_GUIA = '#fb8500';
const C_FOCO = '#4cc9f0';
const C_DIREC = '#f25c54';
const C_EJE = '#ffd166';
const C_RAIZ = '#c77dff';

const fEval = (a: number, b: number, c: number, x: number) => a * x * x + b * x + c;
const f1 = (v: number) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1).replace('-', '−');
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Caja de vista (unidades matemáticas), redondeada para que no tiemble. */
function cajaVista(a: number, b: number, c: number, vertex: Vertex, roots: ComplexRoot[], puntos: Array<{ x: number; y: number }>, conArgand: boolean) {
  const xs: number[] = [-2, 2, 0], ys: number[] = [0, c, vertex.k];
  xs.push(vertex.h);
  puntos.forEach((p) => { xs.push(p.x); ys.push(p.y); });
  roots.filter((r) => r.imaginary === 0).forEach((r) => xs.push(r.real));
  ys.push(c);
  let x0 = clamp(Math.min(...xs), -12, 12), x1 = clamp(Math.max(...xs), -12, 12);
  let y0 = clamp(Math.min(...ys), -14, 14), y1 = clamp(Math.max(...ys), -14, 14);
  x0 = Math.floor(x0 - 2); x1 = Math.ceil(x1 + 2); y0 = Math.floor(y0 - 1.5); y1 = Math.ceil(y1 + 2.5);
  // al menos 12 de ancho y 8 de alto, centrado en lo que se midió
  if (x1 - x0 < 12) { const m = (x0 + x1) / 2; x0 = m - 6; x1 = m + 6; }
  if (y1 - y0 < 8) { const m = (y0 + y1) / 2; y0 = m - 4; y1 = m + 4; }
  x0 = Math.floor(x0); x1 = Math.ceil(x1); y0 = Math.floor(y0); y1 = Math.ceil(y1);
  void a; void b;
  return { x0, x1, y0, y1, xTotal: conArgand ? x1 + 8.6 : x1 };
}

/* ── Plano de Argand (raíces complejas conjugadas) ───────────────────────────── */
function PanelArgand({ roots, centro, k = 1 }: { roots: ComplexRoot[]; centro: [number, number]; k?: number }) {
  const mx = Math.max(1, ...roots.map((r) => Math.max(Math.abs(r.real), Math.abs(r.imaginary))));
  const R = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].find((v) => v >= mx * 1.25) ?? 20;
  const lado = 3.1;               // semilado del panel (u)
  const esc = (lado - 0.7) / R;
  const geo = useMemo(() => cajaRedondeada(lado * 2 + 0.6, lado * 2 + 1.5, 0.06, 0.25, 3), [lado]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1f2b32', toneMapped: false }), []);
  const matBorde = useMemo(() => new THREE.MeshBasicMaterial({ color: C_RAIZ, toneMapped: false }), []);
  const geoBorde = useMemo(() => cajaRedondeada(lado * 2 + 0.7, lado * 2 + 1.6, 0.05, 0.27, 3), [lado]);
  const par = roots.filter((r) => r.imaginary !== 0);
  const paso = pasoBonito(R * 2, 6);
  return (
    <group position={[centro[0], centro[1], 0]}>
      <mesh geometry={geoBorde} material={matBorde} position={[0, -0.35, 0.02]} />
      <mesh geometry={geo} material={mat} position={[0, -0.35, 0.03]} />
      <group position={[0, -0.35, 0.05]}>
        <PlanoCartesiano rangoX={[-R, R]} rangoY={[-R, R]} paso={paso / 2 >= 0.5 ? paso / 2 : paso} pasoMayor={paso} pasoEtiquetas={paso} escala={esc} nombresEjes={['Re', 'Im']} />
        {par.map((r, i) => (
          <React.Fragment key={i}>
            <Trazo pts={[[0, 0], [r.real * esc, r.imaginary * esc]]} color={C_RAIZ} radio={0.014} rayas={[0.12, 0.09]} z={0.01} />
            <PuntoMarcado x={r.real} y={r.imaginary} escala={esc} color={C_RAIZ} radio={0.11} position={[0, 0, 0.02]} />
          </React.Fragment>
        ))}
        {par.map((r, i) => (
          <Etiqueta key={'e' + i} modo="plano" texto={`z${i === 0 ? '_1' : '_2'} = ${f1(r.real)} ${r.imaginary > 0 ? '+' : '−'} ${f1(Math.abs(r.imaginary))}i`}
            color="#ffffff" fondo="rgba(20,30,36,0.85)" tamano={0.3 * k} ancla={[r.real > 0 ? 1 : 0, r.imaginary > 0 ? 0 : 1]}
            position={[r.real * esc + (r.real > 0 ? -0.2 : 0.2), r.imaginary * esc + (r.imaginary > 0 ? 0.2 : -0.2), 0.08]} />
        ))}
      </group>
      <Etiqueta modo="plano" texto="Plano de Argand" color={C_RAIZ} peso={700} tamano={0.34 * k} ancla={[0.5, 0]} position={[0, lado + 0.3, 0.06]} />
    </group>
  );
}

/* ── Fotones: rayo paralelo al eje que baja, rebota en la parábola y va al foco ── */
function Fotones({ a, b, c, h, focoY, yTop, span }: { a: number; b: number; c: number; h: number; focoY: number; yTop: number; span: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const xs = useMemo(() => [h - span * 0.6, h + span * 0.6], [h, span]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), []);
  useFrame((st) => {
    const t = st.clock.getElapsedTime();
    xs.forEach((x, i) => {
      const m = refs.current[i]; if (!m) return;
      const yPar = fEval(a, b, c, x);
      const ph = (t * 0.28 + i * 0.5) % 1;
      if (ph < 0.5) { const s = ph / 0.5; m.position.set(x, yTop + (yPar - yTop) * s, 0.06); }
      else { const s = (ph - 0.5) / 0.5; m.position.set(x + (h - x) * s, yPar + (focoY - yPar) * s, 0.06); }
    });
  });
  return (
    <group>
      {xs.map((x, i) => {
        const yPar = fEval(a, b, c, x);
        return (
          <React.Fragment key={i}>
            <Trazo pts={[[x, yTop], [x, yPar]]} color={C_FOCO} radio={0.01} opacidad={0.5} z={0.002} />
            <Trazo pts={[[x, yPar], [h, focoY]]} color={C_FOCO} radio={0.01} opacidad={0.7} z={0.002} />
            <mesh ref={(el) => { refs.current[i] = el; }} material={mat}>
              <sphereGeometry args={[0.1, 14, 10]} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Contenido({ a, b, c, target, currentRes, puntosObjetivo = [] }: Cuadraticas3DSceneProps) {
  const { delta, vertex, roots } = currentRes;
  const complejas = delta < 0 && roots.some((r) => r.imaginary !== 0);
  const up = a >= 0;
  const caja = useMemo(() => cajaVista(a, b, c, vertex, roots, puntosObjetivo, complejas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, b, c, vertex.h, vertex.k, delta, complejas, puntosObjetivo.map((p) => p.y).join(',')]);

  const k = Math.max(1, (caja.xTotal - caja.x0) / 15, (caja.y1 - caja.y0) / 10);
  const showFocus = Math.abs(a) >= 0.06;
  const p = 1 / (4 * (Math.abs(a) < 1e-6 ? 1e-6 : a));
  const focoY = vertex.k + p, dirY = vertex.k - p;
  const yTopRayos = up ? caja.y1 : caja.y0;

  // parábola objetivo (guía punteada): se recorta a la vista
  const guia = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = caja.x0 - 1; x <= caja.x1 + 1; x += 0.1) {
      const y = fEval(target.a, target.b, target.c, x);
      if (y > -PLANO_Y && y < PLANO_Y) pts.push([x, y]);
    }
    return pts;
  }, [target, caja.x0, caja.x1]);

  const rango: [number, number] = [Math.max(-PLANO_X, caja.x0 - 1), Math.min(PLANO_X, caja.x1 + 1)];
  const spanRayos = Math.max(2, Math.min(5, Math.sqrt(Math.abs(yTopRayos - vertex.k) / Math.abs(a || 1e-6)) * 0.8));
  const centroArgand: [number, number] = [caja.x1 + 4.8, (caja.y0 + caja.y1) / 2];

  return (
    <>
      <EncuadreSuave caja={[[caja.x0, caja.y0, 0], [caja.xTotal, caja.y1, 0]]} margen={1.12} />
      <PlanoCartesiano rangoX={[-PLANO_X, PLANO_X]} rangoY={[-PLANO_Y, PLANO_Y]} paso={1} pasoMayor={5} pasoEtiquetas={2} escala={1} />

      {/* eje de simetría */}
      <Trazo pts={[[vertex.h, caja.y0 - 1], [vertex.h, caja.y1 + 1]]} color={C_EJE} radio={0.012} rayas={[0.3, 0.2]} opacidad={0.7} />
      <Etiqueta modo="plano" texto={`x = ${f1(vertex.h)}`} color={C_EJE} fondo="rgba(20,30,36,0.7)" tamano={0.24 * k} ancla={[0, 1]} position={[vertex.h + 0.12 * k, caja.y1 - 0.15 * k, 0.01]} />

      {/* directriz y foco */}
      {showFocus && (
        <>
          <Trazo pts={[[-PLANO_X, dirY], [PLANO_X, dirY]]} color={C_DIREC} radio={0.014} rayas={[0.4, 0.25]} opacidad={0.85} />
          <Etiqueta modo="plano" texto={`directriz  y = ${f1(dirY)}`} color={C_DIREC} fondo="rgba(20,30,36,0.7)" tamano={0.24 * k} ancla={[0, up ? 1 : 0]} position={[caja.x0 + 0.3 * k, dirY + (up ? -0.1 : 0.1) * k, 0.01]} />
          <Fotones a={a} b={b} c={c} h={vertex.h} focoY={focoY} yTop={yTopRayos} span={spanRayos} />
          <PuntoMarcado x={vertex.h} y={focoY} escala={1} color={C_FOCO} radio={0.13} />
          <Etiqueta modo="plano" texto={`Foco (${f1(vertex.h)}; ${f1(focoY)})`} color={C_FOCO} fondo="rgba(20,30,36,0.85)" tamano={0.3 * k} ancla={[0, up ? 0 : 1]} position={[vertex.h + 0.35 * k, focoY + (up ? 0.3 : -0.3) * k, 0.06]} />
        </>
      )}

      {/* guía objetivo (punteada) y puntos medidos */}
      <Trazo pts={guia} color={C_GUIA} radio={0.024} rayas={[0.28, 0.22]} opacidad={0.75} z={0.001} />
      {puntosObjetivo.map((pt) => {
        const lado = pt.x < 0 ? 'izq' : pt.x > 0 ? 'der' : 'arr';
        return (
          <React.Fragment key={pt.x}>
            <PuntoMarcado x={pt.x} y={pt.y} escala={1} color={C_GUIA} radio={0.17} />
            <Etiqueta modo="plano" texto={`(${pt.x < 0 ? '−' : ''}${Math.abs(pt.x)}; ${f1(pt.y)})`} color="#ffd9a8" fondo="rgba(20,30,36,0.85)" tamano={0.34 * k}
              ancla={lado === 'izq' ? [1, 0.5] : lado === 'der' ? [0, 0.5] : [0.5, 0]}
              position={lado === 'izq' ? [pt.x - 0.3 * k, pt.y, 0.05] : lado === 'der' ? [pt.x + 0.3 * k, pt.y, 0.05] : [pt.x, pt.y + 0.3 * k, 0.05]} />
          </React.Fragment>
        );
      })}

      {/* parábola del alumno */}
      <CurvaFuncion f={(x) => fEval(a, b, c, x)} rango={rango} escala={1} color={C_ALUMNO} grosor={0.05} recorteY={[-PLANO_Y, PLANO_Y]} version={`${a}|${b}|${c}`} position={[0, 0, 0.01]} />

      {/* intercepto, raíces reales y vértice */}
      <PuntoMarcado x={0} y={c} escala={1} color="#a3e635" radio={0.11} position={[0, 0, 0.02]} />
      {roots.filter((r) => r.imaginary === 0).map((r, i) => (
        <PuntoMarcado key={i} x={r.real} y={0} escala={1} color="#22d3ee" radio={0.12} position={[0, 0, 0.02]} />
      ))}
      <PuntoMarcado x={vertex.h} y={vertex.k} escala={1} color="#ffffff" radio={0.16} proyecciones position={[0, 0, 0.03]} />
      <Etiqueta modo="plano" texto={`V (${f1(vertex.h)}; ${f1(vertex.k)}) · ${up ? 'mín' : 'máx'}`} color="#ffffff" fondo="rgba(20,30,36,0.85)" tamano={0.3 * k} ancla={[0, up ? 1 : 0]} position={[vertex.h + 0.35 * k, vertex.k + (up ? -0.3 : 0.3) * k, 0.06]} />

      {complejas && <PanelArgand roots={roots} centro={centroArgand} k={k} />}
    </>
  );
}

export default function Cuadraticas3DScene(props: Cuadraticas3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 22], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 4, maxDistancia: 90, maxPolar: Math.PI * 0.8, minPolar: Math.PI * 0.2 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
