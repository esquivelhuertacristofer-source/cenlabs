"use client";
/**
 * Q6 · Solubilidad y cristalización — mesa de laboratorio (R3F + kit).
 *
 *   Vaso de precipitados de 250 mL con 100 g de agua y un termómetro, que el alumno lleva a tres
 *   estaciones: parrilla de calentamiento, mesa (temperatura ambiente) y baño de hielo. La sal que
 *   no cabe en la disolución a esa temperatura queda en el fondo como cristales con el hábito real
 *   de cada sustancia (agujas de KNO₃, cubos de NaCl, prismas azules de CuSO₄·5H₂O, láminas de
 *   KClO₃). El CuSO₄ disuelto tiñe el agua de azul en proporción a lo disuelto.
 *   La escena muestra lo que vería el alumno: nunca la solubilidad tabulada ni la saturación.
 */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, VasoPrecipitado, ParrillaAgitadora, PARRILLA_ALTURA, BanoHielo,
  Termometro, Etiqueta, COLORES_LIQUIDO, defVaso, defCristalizador,
} from '../_kit';
import { Frasco } from '../qmi05/piezas';
import { CristalesCama, type SalId } from './piezas';

type V3 = [number, number, number];
export type UbicacionVaso = 'mesa' | 'parrilla' | 'hielo';

export interface Solubilidad3DProps {
  temp: number;
  salAgregada: number;
  /** gramos de sal que NO caben en el agua a la temperatura actual (los que quedan sólidos) */
  salSolida: number;
  sustanciaId: string;
  formula: string;
  nombre: string;
  ubicacion: UbicacionVaso;
}

const ESCALA_VASO = 1.7;
// Disposición en triángulo: parrilla y baño de hielo al fondo, zona de trabajo (mesa) al frente.
const C_PARRILLA: [number, number] = [-2.3, -1.0];
const C_HIELO: [number, number] = [2.5, -1.0];
const C_MESA: [number, number] = [0, 1.3];
const FONDO_DISH = defCristalizador(190).y0;
/** Posición del vaso en cada estación (base del vaso apoyada). */
const ESTACION: Record<UbicacionVaso, V3> = {
  parrilla: [C_PARRILLA[0], PARRILLA_ALTURA, C_PARRILLA[1]],
  mesa: [C_MESA[0], 0, C_MESA[1]],
  hielo: [C_HIELO[0], FONDO_DISH, C_HIELO[1]],
};
const ROTULO: Record<UbicacionVaso, string> = { parrilla: 'Parrilla', mesa: 'Mesa · ambiente', hielo: 'Baño de hielo' };
const DENSIDAD_DISOL = 0.42; // mL que aporta cada gramo disuelto al volumen de la disolución
const defV = defVaso(250);

const esSal = (s: string): s is SalId => s === 'kno3' || s === 'nacl' || s === 'cuso4' || s === 'kclo3';
const ascii = (f: string) => f.replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080));

function mezclaColor(a: string, b: string, t: number): string {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(t, 0, 1)).getHexString();
}

/** Vaso con su contenido; se traslada de una estación a otra levantándolo en arco. */
function VasoMovil({ ubicacion, temp, salAgregada, salSolida, sal }: { ubicacion: UbicacionVaso; temp: number; salAgregada: number; salSolida: number; sal: SalId }) {
  const ref = useRef<THREE.Group>(null);
  const inicio = useRef<V3>(ESTACION[ubicacion]);
  const destino = ESTACION[ubicacion];
  useFrame((_, dtReal) => {
    const g = ref.current; if (!g) return;
    const k = 1 - Math.exp(-Math.min(dtReal, 0.05) * 4.5);
    const dx = destino[0] - g.position.x, dz = destino[2] - g.position.z;
    const lejos = Math.min(1, Math.hypot(dx, dz) / 1.6);
    g.position.x += dx * k; g.position.z += dz * k;
    g.position.y += (destino[1] + lejos * 2.4 - g.position.y) * k;
  });

  const disuelta = Math.max(0, salAgregada - salSolida);
  const volumen = Math.min(235, 100 + disuelta * DENSIDAD_DISOL + (salSolida > 0 ? 0 : 0));
  const color = sal === 'cuso4'
    ? mezclaColor(COLORES_LIQUIDO.agua, COLORES_LIQUIDO.sulfatoCobre, 0.12 + 0.88 * Math.min(1, disuelta / 45))
    : COLORES_LIQUIDO.agua;
  const rInt = defV.radioMax - defV.grosor - 0.01;

  return (
    <group ref={ref} position={inicio.current}>
      <group scale={ESCALA_VASO}>
        <VasoPrecipitado capacidad={250} graduado liquido={{ volumenML: volumen, color }} />
        <CristalesCama sal={sal} masaG={salSolida} radio={rInt} position={[0, defV.grosor + 0.004, 0]} />
      </group>
      {/* termómetro apoyado en la pared del vaso, con el bulbo en la disolución */}
      <Termometro position={[0.28, 0.06, 0.04]} rotation={[0.04, 0, -0.15]} temperatura={temp} longitud={3.0} liquido="alcohol" />
    </group>
  );
}

function Montaje({ temp, salAgregada, salSolida, sustanciaId, formula, nombre, ubicacion }: Solubilidad3DProps) {
  const sal: SalId = esSal(sustanciaId) ? sustanciaId : 'kno3';
  const calor = ubicacion === 'parrilla' ? 0.8 : 0;
  const rotulos = useMemo(() => (Object.keys(ROTULO) as UbicacionVaso[]), []);
  return (
    <group>
      {/* estación 1: parrilla (la placa queda 12 cm detrás del origen de la pieza) */}
      <ParrillaAgitadora position={[C_PARRILLA[0], 0, C_PARRILLA[1] + 0.12]} calor={calor} agitacion={0} encendida={calor > 0} />
      {/* estación 3: baño de hielo */}
      <BanoHielo position={[C_HIELO[0], 0, C_HIELO[1]]} diametro={190} cubos={16} nivel={0.85} colorAgua="#d3e8f1" />

      {/* frasco de la sal que se está ensayando, en la zona de trabajo */}
      <Frasco position={[0.2, 0, -1.0]} formula={ascii(formula)} nombre={nombre} />

      <VasoMovil ubicacion={ubicacion} temp={temp} salAgregada={salAgregada} salSolida={salSolida} sal={sal} />

      {rotulos.map((u) => {
        const c = u === 'parrilla' ? C_PARRILLA : u === 'mesa' ? C_MESA : C_HIELO;
        const zr = u === 'mesa' ? c[1] + 1.15 : c[1] + 1.75;
        return (
          <Etiqueta key={u} texto={ROTULO[u]} position={[c[0], 0.16, zr]}
            tamano={0.2} fondo={u === ubicacion ? '#ffffff' : '#e4e9ec'} borde={u === ubicacion ? '#219EBC' : '#9aa6ad'} color="#12202b" peso={u === ubicacion ? 700 : 500} />
        );
      })}
    </group>
  );
}

export default function Solubilidad3DScene(props: Solubilidad3DProps) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 6.2, 11.5], objetivo: [0, 1.0, 0.2], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 24, cajaObjetivo: [[-4, 0.4, -2], [4, 3, 2]] }}
    >
      <EncuadrarCaja caja={[[-3.7, 0, -2.0], [4.0, 3.1, 2.5]]} margen={0.98} direccion={[0, 0.5, 1]} />
      <Montaje {...props} />
    </LabCanvas>
  );
}
