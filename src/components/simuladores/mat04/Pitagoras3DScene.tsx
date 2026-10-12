"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Pitagoras3DScene — demostración hidráulica del teorema: un triángulo
   rectángulo macizo con un TANQUE CUADRADO DE AGUA sobre cada lado. Al verter, el
   agua de los dos tanques de los catetos pasa al de la hipotenusa (el volumen
   a² + b² llena c²). El agua obedece a la gravedad: su superficie es horizontal
   aunque el tanque de la hipotenusa esté inclinado.

   Escenarios: «básico» (pizarrón), «rampas» (muro de obra, pasamanos) y
   «navegación» (mar y barco). La escena no muestra c: el rótulo dice «c² = ?».
──────────────────────────────────────────────────────────────────────────── */

import React from 'react';
import { LabCanvas } from '../_kit';
import { EncuadreSuave } from '../mat_comun_1a5/trazos';
import { Tanque, PrismaTriangulo, Barco, Pasamanos, FondoEscenario, type Escenario } from './piezas';

interface Pitagoras3DSceneProps {
  catetoA: number;
  catetoB: number;
  llenado: number;
  escenario: Escenario;
}

function Contenido({ catetoA, catetoB, llenado, escenario }: Pitagoras3DSceneProps) {
  const a = Math.max(0.1, catetoA || 3), b = Math.max(0.1, catetoB || 4);
  const h = Math.hypot(a, b);
  const ang = Math.atan2(b, -a);
  const f = Math.min(1, Math.max(0, llenado / 100));
  const nav = escenario === 'navegacion_maritima';

  const L = Math.min(Math.max(0.9 * b, 1.4), 3.6);
  const xBarco = a + 0.45 + L * 0.5, yBarco = -a * 0.55;
  const x1 = Math.max(a + b, nav ? a + 0.45 + L : 0), y0 = -a, y1 = a + b;
  const x0 = -b;
  const ancho = x1 - x0, alto = y1 - y0;
  const tam = Math.min(1.1, Math.max(0.3, Math.max(ancho, alto) * 0.034));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const margen = Math.max(1.0, Math.max(ancho, alto) * 0.05);

  return (
    <>
      <EncuadreSuave caja={[[x0 - margen, y0 - margen, -0.6], [x1 + margen, y1 + margen, 0.6]]} margen={1.0} />
      <FondoEscenario escenario={escenario} centro={[cx, nav ? yBarco - 2.33 : cy]} />

      <PrismaTriangulo a={a} b={b} escenario={escenario} />
      {escenario === 'diseno_rampas' && <Pasamanos a={a} b={b} />}
      {nav && <Barco L={L} position={[xBarco, yBarco, 0.2]} />}

      <Tanque lado={a} centro={[a / 2, -a / 2]} nivel={1 - f} etiqueta={`a² = ${(a * a).toFixed(0)} u²`} tamEtiqueta={tam} />
      <Tanque lado={b} centro={[-b / 2, b / 2]} nivel={1 - f} etiqueta={`b² = ${(b * b).toFixed(0)} u²`} tamEtiqueta={tam} />
      <Tanque lado={h} centro={[(a + b) / 2, (a + b) / 2]} ang={ang} nivel={f} etiqueta="c² = ?" tamEtiqueta={tam * 1.15} />
    </>
  );
}

export default function Pitagoras3DScene(props: Pitagoras3DSceneProps) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 0, 40], objetivo: [0, 0, 0], fov: 35 }}
        controles={{ minDistancia: 6, maxDistancia: 120, maxPolar: Math.PI * 0.8, minPolar: Math.PI * 0.2 }}>
        <Contenido {...props} />
      </LabCanvas>
    </div>
  );
}
