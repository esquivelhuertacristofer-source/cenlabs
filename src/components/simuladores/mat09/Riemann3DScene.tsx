"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Riemann3DScene — pizarrón con la gráfica de f(x) = 0,1·x² + 1 en [0, 10] y los
   n rectángulos de la suma de Riemann como bloques con espesor. Cada bloque llega
   hasta la curva en su punto de evaluación (marcado con una esfera): extremo
   izquierdo, extremo derecho o punto medio, según el método. Se ve sin hacer
   cuentas que la izquierda queda por debajo de la curva, la derecha por encima y
   el punto medio casi la bordea.

   Rótulos: con pocos rectángulos (n ≤ 8) cada uno lleva su ΔA = f(x*)·Δx; con más,
   un solo rectángulo de ejemplo (el segundo) lleva su ΔA y el resto se lee en la
   altura. No se rotula la integral exacta: el Piloto da la suma y el error.
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LabCanvas, Etiqueta, CurvaFuncion } from '../_kit';
import { Trazo, EncuadreSuave } from '../mat_comun_1a5/trazos';
import { RejillaEjes, aEscena } from '../mat_comun_6a10/ejes';
import { fM9, puntoEvaluacionM9, A_M9, B_M9, type MetodoM9 } from '@/domain/matematicas';

interface Riemann3DSceneProps {
  n: number;
  metodo: MetodoM9;
  animandoLimite: boolean;
}

const SX = 1.4;            // u de escena por unidad de x
const SY = 0.9;            // u de escena por unidad de y
const Y_MAX = 12;
const ESPESOR = 0.5;       // profundidad de los bloques
const C_BARRA = '#2fb98a', C_PUNTO = '#fbbf24', C_CURVA = '#f8fafc';
const f2 = (v: number) => v.toFixed(2).replace('-', '−');
const NOMBRE: Record<MetodoM9, string> = { izquierda: 'extremos izquierdos', derecha: 'extremos derechos', punto_medio: 'puntos medios' };

/** Los n rectángulos en UNA malla instanciada (hasta 100 bloques, un solo dibujo). */
function Bloques({ n, metodo }: { n: number; metodo: MetodoM9 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const refP = useRef<THREE.InstancedMesh>(null);
  const dx = (B_M9 - A_M9) / n;
  const datos = useMemo(() => Array.from({ length: n }, (_, i) => {
    const xe = puntoEvaluacionM9(i, n, metodo);
    return { xc: A_M9 + i * dx + dx / 2, xe, h: fM9(xe) };
  }), [n, metodo, dx]);
  useLayoutEffect(() => {
    const m = ref.current, mp = refP.current; if (!m || !mp) return;
    const o = new THREE.Object3D();
    datos.forEach((d, i) => {
      o.position.set(d.xc * SX, (d.h * SY) / 2, 0);
      o.scale.set(dx * SX * 0.95, d.h * SY, ESPESOR);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      o.position.set(d.xe * SX, d.h * SY, ESPESOR / 2 + 0.03);
      o.scale.setScalar(1); o.updateMatrix(); mp.setMatrixAt(i, o.matrix);
    });
    m.count = n; mp.count = n;
    m.instanceMatrix.needsUpdate = true; mp.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere(); mp.computeBoundingSphere();
  }, [datos, dx, n]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const geoP = useMemo(() => new THREE.SphereGeometry(0.085, 14, 10), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: C_BARRA, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 0.88 }), []);
  const matP = useMemo(() => new THREE.MeshBasicMaterial({ color: C_PUNTO, toneMapped: false }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); matP.dispose(); }, [geo, mat, matP]);
  useEffect(() => () => geoP.dispose(), [geoP]);
  return (
    <>
      <instancedMesh ref={ref} args={[geo, mat, 100]} frustumCulled={false} />
      <instancedMesh ref={refP} args={[geoP, matP, 100]} visible={n <= 60} frustumCulled={false} />
    </>
  );
}

function Contenido({ n, metodo, animandoLimite }: Riemann3DSceneProps) {
  const dx = (B_M9 - A_M9) / n;
  const f = useMemo(() => aEscena(fM9, SX, SY), []);
  const rotulos = useMemo(() => {
    if (n <= 8) return Array.from({ length: n }, (_, i) => i);
    return [1];
  }, [n]);
  return (
    <>
      <EncuadreSuave caja={[[-1.8, -2.1, 0], [B_M9 * SX + 1.2, Y_MAX * SY + 1.5, 0]]} margen={1.04} />
      <RejillaEjes x0={0} x1={B_M9} y0={0} y1={Y_MAX} sx={SX} sy={SY} pasoX={1} pasoY={2} rejillaY={1} tituloX="x" tituloY="f(x)" />
      <Bloques n={n} metodo={metodo} />
      {/* la curva, delante de los bloques */}
      <CurvaFuncion f={f} rango={[0, B_M9 * SX]} escala={1} color={C_CURVA} grosor={0.05} version="m9" position={[0, 0, ESPESOR / 2 + 0.02]} />
      {/* ΔA = f(x*)·Δx */}
      {rotulos.map((i) => {
        const xe = puntoEvaluacionM9(i, n, metodo);
        const h = fM9(xe);
        const ancho = dx * SX;
        const claro = n <= 8;
        return (
          <Etiqueta key={i} modo="plano" texto={claro ? `ΔA = ${f2(h * dx)}` : `ΔA = f(x*)·Δx = ${f2(h * dx)}`}
            color="#ffffff" fondo="rgba(20,30,36,0.82)" tamano={claro ? Math.min(0.36, ancho * 0.2) : 0.36}
            ancla={claro ? [0.5, 0.5] : [0, 0]} position={claro ? [(A_M9 + i * dx + dx / 2) * SX, (h * SY) / 2, ESPESOR / 2 + 0.06] : [(A_M9 + i * dx + dx / 2) * SX + 0.2, h * SY + 1.0, ESPESOR / 2 + 0.06]} />
        );
      })}
      {n > 8 && (
        <Trazo pts={[[(A_M9 + 1.5 * dx) * SX, fM9(puntoEvaluacionM9(1, n, metodo)) * SY], [(A_M9 + 1.5 * dx) * SX + 0.2, fM9(puntoEvaluacionM9(1, n, metodo)) * SY + 1.0]]} color="#ffffff" radio={0.012} z={ESPESOR / 2 + 0.05} opacidad={0.7} />
      )}
      <Etiqueta modo="plano" texto={`n = ${n} rectángulos · ${NOMBRE[metodo]}${animandoLimite ? ' · n → ∞' : ''}`} color="#e8f7f0" fondo="rgba(20,30,36,0.82)" tamano={0.4}
        ancla={[0, 1]} position={[1.2, Y_MAX * SY + 1.0, 0.06]} />
    </>
  );
}

export default function Riemann3DScene(props: Riemann3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 26], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 5, maxDistancia: 70, maxPolar: Math.PI * 0.75, minPolar: Math.PI * 0.25 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
