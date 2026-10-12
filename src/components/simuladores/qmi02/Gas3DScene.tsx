"use client";
/**
 * Q2 · Leyes de los gases (R3F + kit): cilindro de vidrio con pistón, chaqueta
 * termostática, manómetro de carátula y válvula de entrada de gas.
 *
 *   · V (L) = área × altura: el pistón está EXACTAMENTE a V/AREA sobre el fondo.
 *   · n (mol) → número de moléculas dibujadas (120 por mol), rapidez ∝ √(T/M).
 *   · El manómetro lee la presión del estado (P = nRT/V del slice), nunca el objetivo.
 *   · Sobrepresión (isExploded): el pistón sale despedido y el gas escapa por arriba.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, Manometro, Cable, useMateriales, esfera, cilindro, azar } from '../_kit';
import {
  CilindroGas, PistonGas, EscalaVolumen, BanoTermostatico, BotellaGas, ValvulaAguja, puntoRacor, alturaGas,
  R_IN, Y_BASE, Y_TAPA, POS_BANO, RACORES_BANO, SALIDA_BOTELLA,
} from './piezas';

export interface Gas3DSceneProps {
  temperature: number;
  volume: number;
  moles: number;
  pressure?: number;
  isExploded: boolean;
  gasType?: 'He' | 'Ne' | 'CO2';
}

type V3 = [number, number, number];

const MAX_PARTICULAS = 260;
const POR_MOL = 120;
// masa molar (g/mol) y aspecto de cada gas
const GAS = {
  He: { M: 4.003, r: 0.085, color: '#2f8fd8', molecula: false },
  Ne: { M: 20.18, r: 0.12, color: '#f08a1c', molecula: false },
  CO2: { M: 44.01, r: 0.1, color: '#3d4247', molecula: true },
} as const;
const V_REF = 3.6; // u/s para He a 300 K

function Particulas({ temperature, volume, moles, isExploded, gasType, alturaPiston }: {
  temperature: number; volume: number; moles: number; isExploded: boolean; gasType: 'He' | 'Ne' | 'CO2';
  alturaPiston: React.MutableRefObject<number>;
}) {
  const m = useMateriales();
  const info = GAS[gasType];
  const dato = useRef({ temperature, moles, isExploded, gasType });
  dato.current = { temperature, moles, isExploded, gasType };

  const buf = useMemo(() => {
    const rnd = azar(2024);
    const pos = new Float32Array(MAX_PARTICULAS * 3), dir = new Float32Array(MAX_PARTICULAS * 3), eje = new Float32Array(MAX_PARTICULAS * 3);
    const f = new Float32Array(MAX_PARTICULAS);
    const unit = (o: Float32Array, i: number) => {
      let x = rnd() * 2 - 1, y = rnd() * 2 - 1, z = rnd() * 2 - 1;
      const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
      o[i * 3] = x; o[i * 3 + 1] = y; o[i * 3 + 2] = z;
    };
    for (let i = 0; i < MAX_PARTICULAS; i++) {
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * (R_IN - 0.2);
      pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = rnd(); pos[i * 3 + 2] = Math.sin(a) * rr; // y se reescala al primer fotograma
      unit(dir, i); unit(eje, i);
      f[i] = 0.55 + rnd() * 0.9;
    }
    return { pos, dir, eje, f, ini: false };
  }, []);

  const mallaA = useRef<THREE.InstancedMesh>(null);
  const mallaB = useRef<THREE.InstancedMesh>(null);
  const mallaC = useRef<THREE.InstancedMesh>(null);
  const aux = useMemo(() => new THREE.Object3D(), []);
  const matA = useMemo(() => m.plastico(info.color, 0.3), [m, info.color]);
  const matC = useMemo(() => m.plastico('#6b737a', 0.35), [m]);
  const matO = useMemo(() => m.plastico('#e5322d', 0.35), [m]);
  const tiempo = useRef(0);

  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.05);
    tiempo.current += dt;
    const d = dato.current;
    const gi = GAS[d.gasType];
    const cuenta = Math.min(MAX_PARTICULAS, Math.round(d.moles * POR_MOL));
    const rapidez = V_REF * Math.sqrt(d.temperature / 300) * Math.sqrt(GAS.He.M / gi.M) * (d.isExploded ? 0.7 : 1);
    const yMin = Y_BASE + gi.r + 0.02;
    const yMax = Y_BASE + alturaGas(volume) - gi.r - 0.02;
    const rMax = R_IN - gi.r - 0.08;
    const { pos, dir, eje, f } = buf;
    const rot = tiempo.current * 1.6;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    if (!buf.ini) {
      for (let i = 0; i < MAX_PARTICULAS; i++) pos[i * 3 + 1] = yMin + pos[i * 3 + 1] * Math.max(0.05, yMax - yMin);
      buf.ini = true;
    }
    for (let i = 0; i < cuenta; i++) {
      const o = i * 3;
      const v = rapidez * f[i] * dt;
      pos[o] += dir[o] * v; pos[o + 1] += dir[o + 1] * v; pos[o + 2] += dir[o + 2] * v;
      if (d.isExploded) {
        dir[o + 1] += dt * 1.2; // el gas sube y escapa por la boca abierta
        const dentro = pos[o + 1] < Y_TAPA + 0.1;
        if (dentro) {
          const l = Math.hypot(pos[o], pos[o + 2]);
          if (l > rMax) { const nx = pos[o] / l, nz = pos[o + 2] / l, pr = dir[o] * nx + dir[o + 2] * nz; dir[o] -= 2 * pr * nx; dir[o + 2] -= 2 * pr * nz; pos[o] = nx * rMax; pos[o + 2] = nz * rMax; }
          if (pos[o + 1] < yMin) { pos[o + 1] = yMin; dir[o + 1] = Math.abs(dir[o + 1]); }
        } else if (pos[o + 1] > Y_TAPA + 9) { pos[o + 1] = -50; } // fuera de escena
      } else {
        if (pos[o + 1] < yMin) { pos[o + 1] = yMin; dir[o + 1] = Math.abs(dir[o + 1]); }
        else if (pos[o + 1] > yMax) { pos[o + 1] = Math.max(yMin, yMax); dir[o + 1] = -Math.abs(dir[o + 1]); }
        const l = Math.hypot(pos[o], pos[o + 2]);
        if (l > rMax) {
          const nx = pos[o] / l, nz = pos[o + 2] / l, pr = dir[o] * nx + dir[o + 2] * nz;
          dir[o] -= 2 * pr * nx; dir[o + 2] -= 2 * pr * nz;
          pos[o] = nx * rMax; pos[o + 2] = nz * rMax;
        }
      }
    }
    const A = mallaA.current, B = mallaB.current, C = mallaC.current;
    if (A) {
      A.count = cuenta;
      for (let i = 0; i < cuenta; i++) {
        const o = i * 3;
        aux.position.set(pos[o], pos[o + 1], pos[o + 2]); aux.scale.setScalar(gi.molecula ? 1 : 1); aux.updateMatrix();
        A.setMatrixAt(i, aux.matrix);
      }
      A.instanceMatrix.needsUpdate = true;
    }
    if (B && C) {
      const n = gi.molecula ? cuenta : 0;
      B.count = n; C.count = n;
      for (let i = 0; i < n; i++) {
        const o = i * 3;
        // eje de la molécula lineal O=C=O: gira despacio sobre la vertical
        const ex = eje[o] * cr - eje[o + 2] * sr, ez = eje[o] * sr + eje[o + 2] * cr, ey = eje[o + 1];
        aux.scale.setScalar(1);
        aux.position.set(pos[o] + ex * 0.19, pos[o + 1] + ey * 0.19, pos[o + 2] + ez * 0.19); aux.updateMatrix(); B.setMatrixAt(i, aux.matrix);
        aux.position.set(pos[o] - ex * 0.19, pos[o + 1] - ey * 0.19, pos[o + 2] - ez * 0.19); aux.updateMatrix(); C.setMatrixAt(i, aux.matrix);
      }
      B.instanceMatrix.needsUpdate = true; C.instanceMatrix.needsUpdate = true;
    }
  });

  const geoA = esfera(gasType === 'CO2' ? 0.1 : info.r, 14);
  const geoO = esfera(0.095, 12);
  return (
    <group>
      <instancedMesh key={gasType} ref={mallaA} args={[geoA, gasType === 'CO2' ? matC : matA, MAX_PARTICULAS]} frustumCulled={false} />
      <instancedMesh ref={mallaB} args={[geoO, matO, MAX_PARTICULAS]} frustumCulled={false} />
      <instancedMesh ref={mallaC} args={[geoO, matO, MAX_PARTICULAS]} frustumCulled={false} />
    </group>
  );
}

function Montaje({ temperature, volume, moles, pressure, isExploded, gasType }: Required<Gas3DSceneProps>) {
  const pistonRef = useRef<THREE.Group>(null);
  const alturaPiston = useRef(alturaGas(volume));
  const vel = useRef(0);
  const yExp = useRef(0);
  const objetivo = useRef(volume);
  objetivo.current = volume;

  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.05);
    const p = pistonRef.current; if (!p) return;
    if (isExploded) {
      // El pistón sale despedido hacia arriba y cae fuera de escena.
      vel.current = vel.current === 0 ? 7 : vel.current - 9.8 * dt * 1.5;
      yExp.current += vel.current * dt;
      if (yExp.current > 14) { p.visible = false; }
      p.position.y = Y_BASE + alturaPiston.current + Math.max(0, yExp.current);
      p.rotation.z = yExp.current * 0.12;
    } else {
      vel.current = 0; yExp.current = 0; p.visible = true; p.rotation.z = 0;
      const meta = alturaGas(objetivo.current);
      alturaPiston.current += (meta - alturaPiston.current) * Math.min(1, dt * 7);
      p.position.y = Y_BASE + alturaPiston.current;
    }
  });

  const racorAbajo = puntoRacor(false), racorArriba = puntoRacor(true);
  const volante = Math.round(moles * 400) * 0.05; // gira un poco cada vez que se inyecta gas
  const salida: V3 = [-3.7 + SALIDA_BOTELLA[0] + 0.15, SALIDA_BOTELLA[1], -2.0 + SALIDA_BOTELLA[2]];

  return (
    <group>
      <CilindroGas temperatura={temperature} />
      <PistonGas ref={pistonRef} position={[0, Y_BASE + alturaGas(volume), 0]} />
      <Particulas temperature={temperature} volume={volume} moles={moles} isExploded={isExploded} gasType={gasType} alturaPiston={alturaPiston} />

      {/* escala de volumen: la marca 0 queda a la altura del fondo del cilindro */}
      <EscalaVolumen position={[-2.5, Y_BASE, 1.0]} alturaPiston={alturaPiston} />

      {/* entrada de gas: botella → válvula de aguja → base del cilindro */}
      <BotellaGas gas={gasType} position={[-3.7, 0, -2.0]} />
      <ValvulaAguja position={[-2.3, 0.5, 0]} giro={volante} />
      <mesh geometry={cilindro(0.06, 0.06, 0.6, 12)} position={[-1.95, 0.5, 0]} rotation-z={Math.PI / 2}><meshStandardMaterial color="#c9a24e" metalness={1} roughness={0.3} /></mesh>
      <Cable desde={salida} hasta={[-2.7, 0.5, 0.02]} holgura={0.5} grosor={0.05} color="#2e3338" />

      {/* toma de presión → manómetro de carátula */}
      <mesh geometry={cilindro(0.06, 0.06, 0.9, 12)} position={[2.35, 0.5, 0]} rotation-z={Math.PI / 2}><meshStandardMaterial color="#c9a24e" metalness={1} roughness={0.3} /></mesh>
      <mesh geometry={cilindro(0.06, 0.06, 0.95, 12)} position={[2.7, 0.95, 0]}><meshStandardMaterial color="#c9a24e" metalness={1} roughness={0.3} /></mesh>
      <Manometro position={[2.7, 1.95, 0.05]} valor={pressure} min={0} max={8} divisiones={8} menores={5} unidad="atm" titulo="Presión" zonaRoja={[7, 8]} diametro={1.15} decimales={0} conVastago={false} />

      {/* baño termostático y mangueras de la chaqueta */}
      <BanoTermostatico position={POS_BANO} temperatura={temperature} />
      <Cable desde={RACORES_BANO.retorno} hasta={racorAbajo} holgura={0.35} grosor={0.075} color="#3b6ea5" ySuelo={0} />
      <Cable desde={RACORES_BANO.impulsion} hasta={racorArriba} holgura={0.3} grosor={0.075} color="#b8452c" />

      <EncuadrarCaja caja={[[-4.2, 0, -3.0], [5.6, 7.0, 1.7]]} margen={0.96} direccion={[0.1, 0.17, 1]} />
    </group>
  );
}

const Gas3DScene: React.FC<Gas3DSceneProps> = ({ temperature, volume, moles, pressure, isExploded, gasType = 'He' }) => {
  const P = pressure ?? (moles * 0.082057 * temperature) / Math.max(0.1, volume);
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0.4, 4.2, 15], objetivo: [0.6, 2.8, -0.3], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 26, cajaObjetivo: [[-3, 0.5, -2], [4, 6, 1]] }}
    >
      <Montaje temperature={temperature} volume={volume} moles={moles} pressure={P} isExploded={isExploded} gasType={gasType} />
    </LabCanvas>
  );
};

export default Gas3DScene;
