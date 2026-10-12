"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Derivadas3DScene — pizarrón con la gráfica de posición s(t) del cohete y, a su
   derecha, el propio cohete subiendo por un altímetro con la MISMA escala
   vertical (una línea a rayas une el punto de la curva con su altura).

   s(t) = −k·t³ + m·t² (la misma función del dominio y del validador). En el
   instante marcado t:
     · la TANGENTE (magenta) tiene pendiente s′(t) = v(t), rotulada con su valor;
     · la SECANTE (ámbar) une (t, s(t)) con (t+h, s(t+h)) y h baja a saltos
       (2 → 1 → 0,5 → … → 0,05 s) para mostrar el límite h→0: la secante se
       apoya sobre la tangente.
   La escena no marca el instante de velocidad máxima: eso lo deduce el alumno.
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo, useState } from 'react';
import { LabCanvas, Etiqueta, CurvaFuncion, pasoBonito } from '../_kit';
import { Trazo, EncuadreSuave } from '../mat_comun_1a5/trazos';
import { RejillaEjes, aEscena } from '../mat_comun_6a10/ejes';
import { posicionM8, velocidadM8, T_MAX_M8, type CoheteM8 } from '@/domain/matematicas';
import { Cohete, Plataforma } from './piezas';

const SX = 1.15;          // u de escena por segundo
const ALTO = 10;          // altura del eje s en u
const X_ALT = T_MAX_M8 * SX + 1.5;  // x del altímetro
const X_COH = X_ALT + 1.5;          // x del cohete
const H_PASOS = [2, 1, 0.5, 0.25, 0.1, 0.05];
const C_CURVA = '#22d3ee', C_TANG = '#f472b6', C_SEC = '#fbbf24';
const fmt = (v: number, d = 2) => (Math.abs(v) < 5 * 10 ** -(d + 1) ? 0 : v).toFixed(d).replace('-', '−');

function Contenido({ t, coef }: { t: number; coef: CoheteM8 }) {
  const { yMax, paso } = useMemo(() => {
    let sMax = 1;
    for (let i = 0; i <= 200; i++) sMax = Math.max(sMax, posicionM8(coef, (T_MAX_M8 * i) / 200));
    const p = pasoBonito(sMax * 1.04, 5);
    return { yMax: Math.ceil((sMax * 1.04) / p - 1e-9) * p, paso: p };
  }, [coef.k, coef.m]); // eslint-disable-line react-hooks/exhaustive-deps
  const SY = ALTO / yMax;
  const sFn = (x: number) => posicionM8(coef, x);
  const px = (x: number) => x * SX, py = (s: number) => s * SY;

  // h baja a saltos y se queda un momento en el valor mínimo
  const [idxH, setIdxH] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdxH((i) => (i + 1) % (H_PASOS.length + 2)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = H_PASOS[Math.min(idxH, H_PASOS.length - 1)];

  const s0 = sFn(t), v0 = velocidadM8(coef, t);
  const P: [number, number] = [px(t), py(s0)];
  // la secante va hacia delante; cerca del final, hacia atrás
  const t2 = t + h <= T_MAX_M8 ? t + h : Math.max(0, t - h);
  const P2: [number, number] = [px(t2), py(sFn(t2))];
  const pendSec = t2 === t ? v0 : (sFn(t2) - s0) / (t2 - t);

  // tangente de 3,3 u a cada lado del punto, recortada para que no salga del recuadro
  const pend = (v0 * SY) / SX;
  const limite = (y: number) => (Math.abs(pend) < 1e-9 ? 3.3 : Math.min(3.3, Math.max(0, (y - P[1]) / pend)));
  const aDer = Math.min(pend >= 0 ? limite(ALTO + 0.3) : limite(-0.3), T_MAX_M8 * SX - P[0]);
  const aIzq = Math.min(pend >= 0 ? limite(-0.3) : limite(ALTO + 0.3), P[0]);
  const tA: [number, number] = [P[0] - aIzq, P[1] - pend * aIzq], tB: [number, number] = [P[0] + aDer, P[1] + pend * aDer];

  const alturaCohete = py(s0);
  return (
    <>
      <EncuadreSuave caja={[[-2.4, -2.0, 0], [X_COH + 1.2, ALTO + 2.4, 0]]} margen={1.04} />
      <RejillaEjes x0={0} x1={T_MAX_M8} y0={0} y1={yMax} sx={SX} sy={SY} pasoX={1} pasoY={paso} rejillaY={paso / 2}
        tituloX="tiempo t (s)" tituloY="posición s (m)" />

      {/* curva s(t) */}
      <CurvaFuncion f={aEscena(sFn, SX, SY)} rango={[0, px(T_MAX_M8)]} escala={1} color={C_CURVA} grosor={0.05} version={`${coef.k}|${coef.m}|${SY}`} position={[0, 0, 0.01]} />

      {/* instante marcado */}
      <Trazo pts={[[P[0], 0], P]} color="#cbd5dc" radio={0.012} rayas={[0.14, 0.1]} z={0.012} opacidad={0.8} />
      <Trazo pts={[tA, tB]} color={C_TANG} radio={0.032} z={0.02} />
      <Trazo pts={[P, P2]} color={C_SEC} radio={0.026} z={0.024} />
      <mesh position={[P2[0], P2[1], 0.03]}><sphereGeometry args={[0.1, 16, 12]} /><meshBasicMaterial color={C_SEC} toneMapped={false} /></mesh>
      <mesh position={[P[0], P[1], 0.035]}><sphereGeometry args={[0.15, 18, 14]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
      <mesh position={[P[0], 0, 0.035]}><sphereGeometry args={[0.1, 14, 10]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>

      {/* rótulos */}
      <Etiqueta modo="plano" texto={`t = ${fmt(t)} s`} color="#ffffff" fondo="rgba(20,30,36,0.85)" tamano={0.38} ancla={[t < 1.2 ? 0 : 0.5, 0]} position={[P[0] + (t < 1.2 ? 0.15 : 0), 0.3, 0.06]} />
      <Etiqueta modo="plano" texto={`tangente: s′(t) = ${fmt(v0)} m/s`} color={C_TANG} fondo="rgba(20,30,36,0.85)" tamano={0.4}
        ancla={[0, 1]} position={[0.3, ALTO - 0.3, 0.06]} />
      <Etiqueta modo="plano" texto={`secante: h = ${fmt(h)} s · Δs/Δt = ${fmt(pendSec)}`} color={C_SEC} fondo="rgba(20,30,36,0.85)" tamano={0.4}
        ancla={[0, 1]} position={[0.3, ALTO - 1.35, 0.06]} />

      {/* altímetro, línea de altura y cohete */}
      <Trazo pts={[[X_ALT, 0], [X_ALT, ALTO]]} color="#eef3f5" radio={0.02} z={0.003} />
      {Array.from({ length: Math.round(yMax / (paso / 2)) + 1 }, (_, k) => k * (paso / 2)).map((s) => (
        <Trazo key={s} pts={[[X_ALT - (Math.abs(s / paso - Math.round(s / paso)) < 1e-6 ? 0.16 : 0.09), py(s)], [X_ALT, py(s)]]} color="#eef3f5" radio={0.015} z={0.003} />
      ))}
      <Etiqueta modo="plano" texto="altura (m)" color="#dfe8ec" peso={600} tamano={0.36} ancla={[0.5, 0]} position={[X_ALT, ALTO + 0.5, 0.004]} />
      <Trazo pts={[P, [X_ALT, P[1]]]} color={C_CURVA} radio={0.012} rayas={[0.14, 0.1]} z={0.012} opacidad={0.7} />
      <mesh position={[X_ALT, alturaCohete, 0.03]} rotation-z={-Math.PI / 2}><coneGeometry args={[0.12, 0.28, 3]} /><meshBasicMaterial color={C_CURVA} toneMapped={false} /></mesh>
      <Plataforma position={[X_COH, 0, 0]} />
      <Cohete position={[X_COH, alturaCohete, 0]} empuje={v0 > 0.05} />
      <Etiqueta modo="plano" texto={`${fmt(s0, 1)} m`} color="#ffffff" fondo="rgba(20,30,36,0.85)" tamano={0.34} ancla={[0.5, 0]} position={[X_COH, alturaCohete + 2.0, 0.06]} />
    </>
  );
}

export default function Derivadas3DScene({ t, coef }: { t: number; coef: CoheteM8 }) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 26], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 5, maxDistancia: 70, maxPolar: Math.PI * 0.75, minPolar: Math.PI * 0.25 }}>
        <Contenido t={t} coef={coef} />
      </LabCanvas>
    </div>
  );
}
