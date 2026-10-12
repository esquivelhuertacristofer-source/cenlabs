"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Richter3DScene — maqueta de una ciudad con su epicentro y, delante, dos
   sismógrafos de tambor: la estación de REFERENCIA (siempre en la magnitud
   base) y la EXPERIMENTAL (en la magnitud que el alumno elige). Un cartel con el
   sismo OBJETIVO (dato del reto) queda entre los dos.

   El registro de cada tambor es proporcional a 10^Mw con un atenuador por
   décadas (rótulo «÷10^k»): es esquemático. La escena NO muestra el factor de
   energía: es lo que el alumno calcula.
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { LabCanvas, Etiqueta, cajaRedondeada, cilindro, crearLienzo, texturaDeLienzo, useMateriales } from '../_kit';
import { EncuadreSuave } from '../mat_comun_1a5/trazos';
import { Sismografo, Ciudad, OndasEpicentro, EPICENTRO } from './piezas';

interface Props {
  magnitudActual: number;
  magnitudBase: number;
  escenario: string;
  objetivo?: { nombre: string; mw: number };
}

const ANCHO = 14, FONDO = 10.6, Z0 = -6.0;   // losa de la maqueta: x ∈ [−8, 8], z ∈ [−6, 4.6]

/** Pavimento de la maqueta: calles y plaza del epicentro (dibujado, sin red). */
function usePavimento() {
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = 1024, H = Math.round((W * FONDO) / ANCHO);
    const c = crearLienzo(W, H), ctx = c.getContext('2d')!;
    const px = (x: number) => ((x + ANCHO / 2) / ANCHO) * W, pz = (z: number) => ((z - Z0) / FONDO) * H;
    ctx.fillStyle = '#b8c0c3'; ctx.fillRect(0, 0, W, H);
    // aceras con junta
    ctx.strokeStyle = 'rgba(80,90,95,0.18)'; ctx.lineWidth = 1;
    for (let x = -8; x <= 8; x += 1) { ctx.beginPath(); ctx.moveTo(px(x), 0); ctx.lineTo(px(x), H); ctx.stroke(); }
    for (let z = Z0; z <= 4.6; z += 1) { ctx.beginPath(); ctx.moveTo(0, pz(z)); ctx.lineTo(W, pz(z)); ctx.stroke(); }
    // calles
    const calle = (z: number, ancho: number) => {
      ctx.fillStyle = '#4b555b'; ctx.fillRect(0, pz(z - ancho / 2), W, (ancho / FONDO) * H);
      ctx.strokeStyle = '#e7e2c8'; ctx.lineWidth = 2; ctx.setLineDash([14, 12]);
      ctx.beginPath(); ctx.moveTo(0, pz(z)); ctx.lineTo(W, pz(z)); ctx.stroke(); ctx.setLineDash([]);
    };
    calle(-4.35, 0.6); calle(-0.55, 0.6);
    // plaza del epicentro
    ctx.fillStyle = '#cfd6d8'; ctx.beginPath(); ctx.ellipse(px(EPICENTRO[0]), pz(EPICENTRO[1]), (1.6 / ANCHO) * W, (1.6 / FONDO) * H, 0, 0, Math.PI * 2); ctx.fill();
    return texturaDeLienzo(c);
  }, []);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

function Maqueta({ magnitudActual, magnitudBase, objetivo }: Props) {
  const m = useMateriales();
  const pav = usePavimento();
  const matPav = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', map: pav, roughness: 0.9 }), [pav]);
  const matLosa = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7b868c', roughness: 0.8 }), []);
  const matRoja = useMemo(() => new THREE.MeshBasicMaterial({ color: '#c8323c', toneMapped: false }), []);
  useEffect(() => () => { matPav.dispose(); matLosa.dispose(); matRoja.dispose(); }, [matPav, matLosa, matRoja]);
  const losa = cajaRedondeada(ANCHO + 0.4, 0.3, FONDO + 0.4, 0.05, 2);
  const plano = useMemo(() => new THREE.PlaneGeometry(ANCHO, FONDO), []);
  useEffect(() => () => plano.dispose(), [plano]);

  return (
    <>
      <mesh geometry={losa} material={matLosa} position={[0, -0.16, Z0 + FONDO / 2]} />
      <mesh geometry={plano} material={matPav} rotation-x={-Math.PI / 2} position={[0, 0.001, Z0 + FONDO / 2]} />
      <Ciudad magnitud={magnitudActual} />
      <OndasEpicentro magnitud={magnitudActual} />

      {/* epicentro: cruz y rótulo */}
      <group position={[EPICENTRO[0], 0.04, EPICENTRO[1]]} rotation-x={-Math.PI / 2}>
        <mesh material={matRoja}><ringGeometry args={[0.28, 0.34, 40]} /></mesh>
        <mesh material={matRoja}><planeGeometry args={[0.7, 0.05]} /></mesh>
        <mesh material={matRoja}><planeGeometry args={[0.05, 0.7]} /></mesh>
      </group>
      <Etiqueta texto="Epicentro" color="#ffffff" fondo="rgba(200,50,60,0.95)" peso={700} tamano={0.3} ancla={[0.5, 0]} position={[EPICENTRO[0], 0.55, EPICENTRO[1]]} />

      {/* cartel del sismo objetivo (dato del reto) */}
      <group position={[0, 0, 2.45]}>
        {[-1, 1].map((s) => <mesh key={s} geometry={cilindro(0.04, 0.04, 1.1, 8)} material={m.acero} position={[s * 1.55, 0.55, 0]} />)}
        <mesh geometry={cajaRedondeada(3.4, 1.0, 0.07, 0.04, 2)} material={m.carcasaOscura} position={[0, 1.15, 0]} />
        <Etiqueta modo="plano" texto="SISMO OBJETIVO" color="#ffb703" peso={700} tamano={0.2} ancla={[0.5, 0.5]} position={[0, 1.45, 0.045]} />
        <Etiqueta modo="plano" texto={objetivo?.nombre ?? ''} color="#ffffff" peso={600} tamano={0.27} ancla={[0.5, 0.5]} position={[0, 1.17, 0.045]} />
        <Etiqueta modo="plano" texto={`Mw ${(objetivo?.mw ?? 0).toFixed(1)}`} color="#ffb703" peso={700} tamano={0.3} ancla={[0.5, 0.5]} position={[0, 0.88, 0.045]} />
      </group>

      {/* estaciones */}
      <Sismografo magnitud={magnitudBase} color="#1f5fa8" titulo="Estación de referencia" position={[-4.6, 0, 1.0]} />
      <Sismografo magnitud={magnitudActual} color="#b3261e" titulo="Estación experimental" position={[4.6, 0, 1.0]} />
    </>
  );
}

export default function Richter3DScene(props: Props) {
  return (
    <div className="absolute inset-0">
      <LabCanvas fondo="pizarron" sombras={false} camara={{ posicion: [0, 7, 15], objetivo: [0, 1, -0.5], fov: 34 }}
        controles={{ minDistancia: 5, maxDistancia: 40, maxPolar: 1.45, minPolar: 0.25, cajaObjetivo: [[-6, 0, -5], [6, 3, 4]] }}>
        <EncuadreSuave caja={[[-6.6, -0.3, -5.6], [6.6, 3.3, 3.4]]} direccion={[0, 0.42, 1]} margen={1.0} />
        <Maqueta {...props} />
      </LabCanvas>
    </div>
  );
}
