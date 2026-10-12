"use client";

/**
 * Cruza de chícharos (Mendel), sobre la mesa:
 *   · dos vainas abiertas: los progenitores, con guisantes de su fenotipo;
 *   · polen que pasa de una a otra mientras se realiza la cruza;
 *   · cuatro cristalizadores, uno por fenotipo, que se llenan con las semillas
 *     cosechadas (lisas/rugosas, amarillas/verdes); el rótulo da el conteo OBSERVADO;
 *   · tablero de Punnett de esa cruza, que aparece DESPUÉS de cosechar: antes sería
 *     la respuesta a la predicción que el alumno debe hacer solo.
 * Cada semilla dibujada representa 1 (o `razón`) semillas reales; el conteo exacto es el del rótulo.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, Cristalizador, Etiqueta } from '../_kit';
import { FENOTIPOS_B5, claseFenotipoB5 } from '@/domain/biologia';
import type { CruzaB5 } from '@/store/types';
import { MontonSemillas, Vaina, TableroPunnett } from './piezas';

interface Props {
  padre1: string;
  padre2: string;
  cruza: CruzaB5 | null;
  cruzando: boolean;
}

// una fila de cuatro bandejas (a escala ESC_DISH) para que ninguna tape el rótulo de otra
const X_DISH = [-2.175, -0.725, 0.725, 2.175];
const Z_DISH = 1.2, ESC_DISH = 0.8;
const Z_PADRES = -1.2;
const ETQ = { tamano: 0.2, fondo: '#ffffffe6' } as const;
const MAX_VISIBLE = 122;

function Polen({ activo }: { activo: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e2c04a', roughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color('#fff2b0') }), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  useEffect(() => () => { mat.dispose(); geo.dispose(); }, [mat, geo]);
  useFrame(({ clock }) => {
    const m = ref.current; if (!m) return;
    m.visible = activo; if (!activo) return;
    for (let i = 0; i < 10; i++) {
      const u = (clock.elapsedTime * 0.9 + i / 10) % 1;
      const x = -2.6 + 5.2 * u, y = 0.7 + Math.sin(u * Math.PI) * 1.1 + Math.sin(clock.elapsedTime * 7 + i) * 0.05;
      o.position.set(x, y, Z_PADRES + Math.cos(i * 2.1) * 0.12); o.scale.setScalar(0.035); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, 10]} frustumCulled={false} />;
}

function Mesa({ padre1, padre2, cruza, cruzando }: Props) {
  const llegada = useRef(-1e9);
  const prev = useRef<CruzaB5 | null>(null);
  useFrame(({ clock }) => { if (prev.current !== cruza) { prev.current = cruza; llegada.current = clock.elapsedTime; } });
  const obs = cruza?.observados ?? [0, 0, 0, 0];
  const razon = Math.max(1, Math.ceil(Math.max(...obs) / MAX_VISIBLE));
  const vis = obs.map((x) => Math.round(x / razon));
  return (
    <group>
      {/* progenitores */}
      <group position={[-2.15, 0, Z_PADRES]} rotation={[0, 0.2, 0]}><Vaina genotipo={padre1} agitar={cruzando} /></group>
      <group position={[2.15, 0, Z_PADRES]} rotation={[0, -0.2, 0]}><Vaina genotipo={padre2} agitar={cruzando} /></group>
      <Etiqueta texto={`Progenitor 1 · ${padre1}`} position={[-2.15, 1.35, Z_PADRES]} {...ETQ} />
      <Etiqueta texto={FENOTIPOS_B5[claseFenotipoB5(padre1)]} position={[-2.15, 1.05, Z_PADRES]} tamano={0.17} fondo="#ffffffe6" />
      <Etiqueta texto={`Progenitor 2 · ${padre2}`} position={[2.15, 1.35, Z_PADRES]} {...ETQ} />
      <Etiqueta texto={FENOTIPOS_B5[claseFenotipoB5(padre2)]} position={[2.15, 1.05, Z_PADRES]} tamano={0.17} fondo="#ffffffe6" />
      <Polen activo={cruzando} />
      {!cruza && <Etiqueta texto="×" position={[0, 0.9, Z_PADRES]} tamano={0.7} color="#3a4a56" peso={700} fondo={null} />}

      {/* Punnett de la cruza (después de cosechar) */}
      {cruza && <group position={[0, 2.8, -2.5]} rotation={[-0.08, 0, 0]} scale={0.82}><TableroPunnett padre1={cruza.padre1} padre2={cruza.padre2} /></group>}

      {/* una bandeja por fenotipo */}
      {X_DISH.map((x, i) => (
        <group key={i} position={[x, 0, Z_DISH]}>
          <group scale={ESC_DISH}>
            <Cristalizador diametro={150} />
            <MontonSemillas clase={i} n={vis[i]} llegada={llegada} />
          </group>
          <Etiqueta texto={FENOTIPOS_B5[i]} position={[0, 0.13, 0.98]} tamano={0.17} fondo="#ffffffe6" />
          <Etiqueta texto={cruza ? String(obs[i]) : '—'} position={[0, 0.45, 0.98]} tamano={0.3} color="#10212b" peso={700} fondo="#ffffffe6" />
        </group>
      ))}
      {razon > 1 && <Etiqueta texto={`1 semilla dibujada = ${razon} reales`} position={[0, 0.13, 2.75]} tamano={0.17} fondo="#ffffffe6" />}
    </group>
  );
}

export default function Genetica3DScene(props: Props) {
  return (
    <LabCanvas
      fondo="laboratorio"
      mesa={{ ancho: 10, fondo: 8 }}
      camara={{ posicion: [0, 5.0, 9.6], objetivo: [0, 1.75, 0.5], fov: 38 }}
      controles={{ minDistancia: 4, maxDistancia: 18, maxPolar: 1.45, cajaObjetivo: [[-2.5, 0.3, -2], [2.5, 3, 2]] }}
    >
      <Mesa {...props} />
    </LabCanvas>
  );
}
