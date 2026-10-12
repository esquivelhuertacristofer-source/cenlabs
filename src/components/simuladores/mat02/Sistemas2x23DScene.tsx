"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Sistemas2x23DScene — dos estaciones láser disparan haces (las rectas L1 y L2)
   sobre el pizarrón; el objetivo (satélite, cruce de rutas o torre, según el
   escenario) está fijo en el plano y el alumno debe hacer que sus haces se
   crucen sobre él. El CRUCE actual se marca con una retícula blanca y su
   coordenada; si las rectas no se cortan (paralelas) o son la misma
   (coincidentes) se dice en el propio plano.
──────────────────────────────────────────────────────────────────────────── */

import React, { useMemo } from 'react';
import { LabCanvas, PlanoCartesiano, PuntoMarcado, Etiqueta } from '../_kit';
import { Trazo, EncuadreSuave, NumerosEje } from '../mat_comun_1a5/trazos';
import { validarM2, clasificarSistemaM2 } from '@/domain/matematicas';
import { Satelite, PosteCruce, TorreCelosia, EmisorLaser } from './piezas';

interface Sistemas2x23DSceneProps {
  m1: number;
  b1: number;
  m2: number;
  b2: number;
  target: { x: number; y: number };
  escenario: 'rastreo_satelital' | 'interseccion_rutas' | 'triangulacion_torres';
}

const X = 10.4, Y = 9.4;                 // el plano llega a ±11 en x y ±10 en y
const C1 = '#38bdf8', C2 = '#ffb703';  // Alpha (cian) y Omega (ámbar)
const f1 = (v: number) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(1).replace('-', '−');
const f2 = (v: number) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−');

/** Recorta y = m x + b al rectángulo del plano. Devuelve [izquierdo, derecho] o null. */
const LX = X - 0.9, LY = Y - 0.8;
function recortar(m: number, b: number): [[number, number], [number, number]] | null {
  let x0 = -LX, x1 = LX;
  if (Math.abs(m) > 1e-9) {
    const ya = (-LY - b) / m, yb = (LY - b) / m;
    x0 = Math.max(x0, Math.min(ya, yb)); x1 = Math.min(x1, Math.max(ya, yb));
  } else if (Math.abs(b) > LY) return null;
  if (x1 - x0 < 1e-6) return null;
  return [[x0, m * x0 + b], [x1, m * x1 + b]];
}

function Contenido({ m1, b1, m2, b2, target, escenario }: Sistemas2x23DSceneProps) {
  const tipo = clasificarSistemaM2(m1, b1, m2, b2);
  const unica = tipo === 'unica';
  const bloqueado = validarM2({ m1, b1, m2, b2, target }).isOk;
  const cruce = useMemo(() => {
    if (!unica) return null;
    const x = (b2 - b1) / (m1 - m2);
    return { x, y: m1 * x + b1 };
  }, [unica, m1, b1, m2, b2]);
  const dentro = !!cruce && Math.abs(cruce.x) <= X && Math.abs(cruce.y) <= Y;

  const s1 = useMemo(() => recortar(m1, b1), [m1, b1]);
  const s2 = useMemo(() => recortar(m2, b2), [m2, b2]);
  const colorCruce = bloqueado ? '#34d399' : '#ffffff';

  const objetivo = escenario === 'interseccion_rutas'
    ? { nombre: 'Cruce de rutas', alto: 1.95, el: <PosteCruce position={[0, -1.65, -0.4]} scale={2} /> }
    : escenario === 'triangulacion_torres'
      ? { nombre: 'Torre de señal', alto: 2.2, el: <TorreCelosia position={[0, -2.0, -0.4]} scale={1.9} /> }
      : { nombre: 'Satélite objetivo', alto: 1.4, el: <Satelite position={[0, 0, -0.4]} scale={1.8} /> };

  return (
    <>
      <EncuadreSuave caja={[[-X - 0.4, -Y - 0.3, 0], [X + 0.4, Y + 0.3, 0]]} margen={1.0} />
      <PlanoCartesiano rangoX={[-X, X]} rangoY={[-Y, Y]} paso={1} pasoMayor={5} pasoEtiquetas={2} escala={1} etiquetas={false} />
      <NumerosEje rangoX={[-10, 10]} rangoY={[-9, 9]} paso={2} tam={0.5} />

      {/* objetivo fijo + retícula de puntería */}
      <group position={[target.x, target.y, 0]}>
        {objetivo.el}
        <mesh rotation-x={0} position={[0, 0, 0.02]}>
          <ringGeometry args={[1.5, 1.56, 48]} />
          <meshBasicMaterial color={bloqueado ? '#34d399' : '#9fb3bd'} toneMapped={false} transparent opacity={bloqueado ? 1 : 0.75} />
        </mesh>
        <Etiqueta modo="plano" texto={`${objetivo.nombre} (${target.x}; ${target.y})`} color={bloqueado ? '#34d399' : '#dfe8ec'} fondo="rgba(20,30,36,0.88)" peso={700}
          tamano={0.5} ancla={[0.5, 0]} position={[0, objetivo.alto + 0.3, 0.1]} />
      </group>

      {/* haces láser */}
      {s1 && <Trazo pts={[s1[0], s1[1]]} color={C1} radio={0.055} z={0.01} />}
      {s2 && tipo !== 'dependiente' && <Trazo pts={[s2[0], s2[1]]} color={C2} radio={0.055} z={0.012} />}
      {s2 && tipo === 'dependiente' && <Trazo pts={[s2[0], s2[1]]} color={C2} radio={0.09} rayas={[0.45, 0.35]} z={0.012} />}

      {/* estaciones emisoras: Alpha por la izquierda, Omega por la derecha */}
      {s1 && (
        <group position={[s1[0][0], s1[0][1], 0.05]} rotation-z={Math.atan2(s1[1][1] - s1[0][1], s1[1][0] - s1[0][0])}>
          <EmisorLaser color={C1} scale={1.5} />
        </group>
      )}
      {s2 && (
        <group position={[s2[1][0], s2[1][1], 0.06]} rotation-z={Math.atan2(s2[0][1] - s2[1][1], s2[0][0] - s2[1][0])}>
          <EmisorLaser color={C2} scale={1.5} />
        </group>
      )}
      {s1 && <Etiqueta modo="plano" texto="Alpha · L1" color={C1} fondo="rgba(20,30,36,0.88)" peso={700} tamano={0.46} ancla={[0, 0]} position={[s1[0][0] + 0.3, s1[0][1] + 0.9, 0.1]} />}
      {s2 && <Etiqueta modo="plano" texto="Omega · L2" color={C2} fondo="rgba(20,30,36,0.88)" peso={700} tamano={0.46} ancla={[1, 0]} position={[s2[1][0] - 0.3, s2[1][1] + 0.9, 0.1]} />}

      {/* cruce actual */}
      {cruce && dentro && (
        <group>
          <PuntoMarcado x={cruce.x} y={cruce.y} escala={1} color={colorCruce} radio={0.22} proyecciones position={[0, 0, 0.05]} />
          <mesh position={[cruce.x, cruce.y, 0.03]}>
            <ringGeometry args={[0.5, 0.58, 32]} />
            <meshBasicMaterial color={colorCruce} toneMapped={false} />
          </mesh>
          {!bloqueado && (
            <Etiqueta modo="plano" texto={`Cruce (${f2(cruce.x)}; ${f2(cruce.y)})`} color="#ffffff" fondo="rgba(20,30,36,0.9)" tamano={0.5}
              ancla={[cruce.x > 4 ? 1 : 0, cruce.y > 7 ? 1 : 0]}
              position={[cruce.x + (cruce.x > 4 ? -0.7 : 0.7), cruce.y + (cruce.y > 7 ? -0.7 : 0.7), 0.1]} />
          )}
        </group>
      )}
      {cruce && !dentro && (
        <Etiqueta modo="plano" texto={`El cruce (${f1(cruce.x)}; ${f1(cruce.y)}) queda fuera del plano`} color="#ffd9a8" fondo="rgba(120,60,10,0.92)" tamano={0.6}
          position={[0, -Y + 1.2, 0.2]} />
      )}

      {/* estados sin solución única */}
      {tipo === 'inconsistente' && (
        <Etiqueta modo="plano" texto="Rectas paralelas: no se cruzan, el sistema no tiene solución" color="#ffffff" fondo="rgba(190,40,60,0.92)" peso={700} tamano={0.6}
          position={[0, Y - 1.2, 0.2]} />
      )}
      {tipo === 'dependiente' && (
        <Etiqueta modo="plano" texto="Misma recta: el sistema tiene infinitas soluciones" color="#ffffff" fondo="rgba(190,40,60,0.92)" peso={700} tamano={0.6}
          position={[0, Y - 1.2, 0.2]} />
      )}
      {bloqueado && (
        <Etiqueta modo="plano" texto="Objetivo fijado: valida tu práctica" color="#ffffff" fondo="rgba(16,150,100,0.94)" peso={700} tamano={0.6}
          position={[0, -Y + 1.2, 0.2]} />
      )}
    </>
  );
}

export default function Sistemas2x23DScene(props: Sistemas2x23DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 36], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 8, maxDistancia: 70, maxPolar: Math.PI * 0.8, minPolar: Math.PI * 0.2 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
