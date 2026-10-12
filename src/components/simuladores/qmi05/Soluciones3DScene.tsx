"use client";
/**
 * Q5 · Preparación de soluciones — mesa de laboratorio (R3F + kit).
 *
 *   Balanza analítica con vidrio de reloj (lectura = instrumento: masa del reloj antes de
 *   tarar, masa del soluto después), frasco de reactivo con espátula, matraz aforado con
 *   su marca de aforo en el cuello, embudo para la transferencia y piseta de agua.
 *
 *   La escena NO muestra la masa que hay que pesar: sólo lo que marca la balanza y el
 *   nivel real del agua frente a la marca del cuello.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, BalanzaAnalitica, BALANZA_PLATO, VidrioReloj, MatrazAforado, Embudo, defAforado,
  alturaSuperficie, Etiqueta, useMateriales, cilindro, toro,
} from '../_kit';
import { Espatula, Frasco, Piseta, MontonPolvo, PUNTA_PISETA } from './piezas';

type V3 = [number, number, number];

export interface Soluciones3DProps {
  polvo: number; tara: boolean;
  matrazPolvo: number; matrazAgua: number; vTarget: number;
  salColor: string; salFormula?: string; salNombre?: string;
  phase: 'prelab' | 'weighing' | 'dissolving' | 'aforo';
  /** avance 0–1 de la disolución (sólo en la fase `dissolving`) */
  progresoDisolucion?: number;
}

// Dos filas en profundidad (la zona útil es casi cuadrada): al fondo, balanza y matraz; delante, frasco, espátula y piseta.
const X_BAL = -1.9;
const Z_BAL = -1.4;
const POS_BAL: V3 = [X_BAL, 0, Z_BAL];
const PLATO: V3 = [X_BAL + BALANZA_PLATO[0], BALANZA_PLATO[1], Z_BAL + BALANZA_PLATO[2]];
const X_FRASCO = 0.5;
const Z_FRASCO = 1.9;
const X_MATRAZ = 1.5;
const Z_MATRAZ = -1.4;
const REPOSO_PISETA: V3 = [3.3, 0, 1.0];
const GIRO_PISETA = 0.5;
// Espátula (origen = arranque de la hoja; mango hacia +X). Reposo: sobre la mesa, junto al frasco.
const TIP_REPOSO: V3 = [1.5, 0.05, Z_FRASCO + 0.3];
const TIP_AFUERA: V3 = [0.6, 1.55, PLATO[2] + 0.05];   // junto a la puerta abierta de la balanza
const TIP_PLATO: V3 = [PLATO[0] + 0.15, PLATO[1] + 0.42, PLATO[2] + 0.05];

/** Posición de la piseta inclinada para que su pico quede sobre la boca del matraz, a `yPunta`. */
function posicionPisetaActiva(yPunta: number): V3 {
  const c = Math.cos(GIRO_PISETA), s = Math.sin(GIRO_PISETA);
  const rx = PUNTA_PISETA[0] * c - PUNTA_PISETA[1] * s;
  const ry = PUNTA_PISETA[0] * s + PUNTA_PISETA[1] * c;
  return [X_MATRAZ - rx, yPunta - ry, Z_MATRAZ];
}

function capacidadMatraz(v: number): 100 | 250 | 500 {
  return v <= 100 ? 100 : v <= 250 ? 250 : 500;
}

/** Mezcla de colores hex (t = peso de b). */
function mezcla(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}

function Montaje({ polvo, tara, matrazPolvo, matrazAgua, vTarget, salColor, salFormula, salNombre, phase, progresoDisolucion = 0 }: Soluciones3DProps) {
  const m = useMateriales();
  const cap = capacidadMatraz(vTarget);
  const def = useMemo(() => defAforado(cap), [cap]);
  const hMatraz = def.altura;
  const yAforo = def.extra.yAforo;
  const rBulbo = def.extra.radioBulbo;

  // ── actividad: la espátula entra cuando cambia la masa; la piseta, cuando sube el agua ──
  const refs = useRef({ polvo, agua: matrazAgua, tEsp: 0, tAgua: 0, esp: 0, pis: 0 });
  const espatula = useRef<THREE.Group>(null);
  const piseta = useRef<THREE.Group>(null);
  const chorro = useRef<THREE.Mesh>(null);
  const [puerta, setPuerta] = useState(0);
  const ultimaPuerta = useRef(0);
  const yPunta = hMatraz + 0.55;
  const posActiva = useMemo(() => posicionPisetaActiva(yPunta), [yPunta]);
  const suave = (t: number) => t * t * (3 - 2 * t);
  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.05);
    const R = refs.current;
    if (Math.abs(polvo - R.polvo) > 1e-6) { R.tEsp = 0.9; R.polvo = polvo; }
    if (matrazAgua > R.agua + 1e-6) R.tAgua = 0.35;
    R.agua = matrazAgua;
    R.tEsp = Math.max(0, R.tEsp - dt); R.tAgua = Math.max(0, R.tAgua - dt);
    const k = 1 - Math.exp(-dt * 6);
    R.esp += ((R.tEsp > 0 && phase === 'weighing' ? 1 : 0) - R.esp) * k;
    R.pis += ((R.tAgua > 0 && phase === 'aforo' ? 1 : 0) - R.pis) * k;
    // espátula: de la mesa a la puerta de la balanza y, por ella, al vidrio de reloj
    if (espatula.current) {
      const e = R.esp;
      const a = suave(Math.min(1, e * 2)), b = suave(Math.max(0, e * 2 - 1));
      espatula.current.position.set(
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(TIP_REPOSO[0], TIP_AFUERA[0], a), TIP_PLATO[0], b),
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(TIP_REPOSO[1], TIP_AFUERA[1], a), TIP_PLATO[1], b),
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(TIP_REPOSO[2], TIP_AFUERA[2], a), TIP_PLATO[2], b),
      );
      espatula.current.rotation.set(0, THREE.MathUtils.lerp(0.12, 0, a), THREE.MathUtils.lerp(0, 0.3, a));
    }
    // piseta: de pie en su sitio a inclinada sobre la boca del matraz
    if (piseta.current) {
      const p = suave(R.pis);
      piseta.current.position.set(
        THREE.MathUtils.lerp(REPOSO_PISETA[0], posActiva[0], p),
        THREE.MathUtils.lerp(REPOSO_PISETA[1], posActiva[1], p),
        THREE.MathUtils.lerp(REPOSO_PISETA[2], posActiva[2], p),
      );
      piseta.current.rotation.z = GIRO_PISETA * p;
    }
    if (chorro.current) {
      const sup = matrazAgua > 0 ? Math.max(0.2, alturaSuperficie(def, matrazAgua)) : 0.2;
      const largo = Math.max(0.01, yPunta - sup);
      chorro.current.visible = R.pis > 0.9 && R.tAgua > 0;
      chorro.current.scale.y = largo;
      chorro.current.position.y = sup + largo / 2;
    }
    const abierta = R.esp > 0.15 ? 1 : 0;
    if (abierta !== ultimaPuerta.current) { ultimaPuerta.current = abierta; setPuerta(abierta); }
  });

  const lectura = tara ? polvo : 12.5;
  const tinte = useMemo(() => {
    const esBlanca = new THREE.Color(salColor).getHSL({ h: 0, s: 0, l: 0 }).s < 0.1;
    return esBlanca ? '#8fc6e2' : mezcla('#8fc6e2', salColor, 0.6);
  }, [salColor]);
  const cantidadVidrio = Math.round(Math.min(1, 0.15 + polvo / 30) * 20) / 20;
  const rMonton = Math.min(rBulbo * 0.55, 0.12 + 0.05 * Math.sqrt(Math.max(0, matrazPolvo)));
  const escalaMonton = matrazPolvo > 0 && phase !== 'aforo' ? (phase === 'dissolving' ? 1 - progresoDisolucion : 1) : 0;
  const hayEmbudo = phase !== 'aforo';
  const yBoca = hMatraz;

  return (
    <group>
      {/* balanza con el vidrio de reloj y el soluto pesado */}
      <BalanzaAnalitica position={POS_BAL} lectura={lectura} decimales={3} encendida estable puertaAbierta={puerta} />
      {/* anillo de corcho que sostiene el vidrio de reloj sobre el platillo */}
      <mesh geometry={toro(0.2, 0.045, 10, 28)} material={m.plastico('#c9a77c', 0.9)} rotation-x={Math.PI / 2} position={[PLATO[0], PLATO[1] + 0.045, PLATO[2]]} castShadow />
      <group position={[PLATO[0], PLATO[1] + 0.085, PLATO[2]]}>
        <VidrioReloj diametro={75} polvo={polvo > 0.0005 ? (salColor.toLowerCase() === '#ffffff' ? '#f4f4f0' : salColor) : undefined} cantidadPolvo={cantidadVidrio} />
      </group>

      {/* frasco de reactivo y espátula */}
      <Frasco position={[X_FRASCO, 0, Z_FRASCO]} formula={salFormula ?? ''} nombre={salNombre ?? ''} />
      <group ref={espatula} position={TIP_REPOSO}><Espatula /></group>

      {/* matraz aforado con su marca en el cuello */}
      <group position={[X_MATRAZ, 0, Z_MATRAZ]}>
        <MatrazAforado
          capacidad={cap}
          tapon={false}
          liquido={matrazAgua > 0.01 ? { volumenML: matrazAgua, color: tinte } : undefined}
        />
        <group position={[0, def.grosor + 0.012, 0]}>
          <MontonPolvo color={salColor.toLowerCase() === '#ffffff' ? '#f1f1ec' : salColor} radio={rMonton} escala={escalaMonton} />
        </group>
        {hayEmbudo && <Embudo diametro={75} position={[0, hMatraz - 0.32, 0]} />}
        <Etiqueta texto={`aforo · ${cap} mL`} modo="plano" position={[0.75, yAforo, 0]} tamano={0.15} peso={700} color="#12202b" fondo="#ffffff" borde="#9aa6ad" />
        <mesh geometry={cilindro(0.004, 0.004, 0.3, 6)} material={m.acero} rotation-z={Math.PI / 2} position={[0.28, yAforo, 0]} />
      </group>

      {/* piseta de agua destilada */}
      <group ref={piseta} position={REPOSO_PISETA}><Piseta /></group>
      <mesh ref={chorro} geometry={cilindro(0.018, 0.018, 1, 8)} material={m.liquido('#bfe0ee')} position={[X_MATRAZ, 1, Z_MATRAZ]} visible={false} renderOrder={6} />
    </group>
  );
}

export default function Soluciones3DScene(props: Soluciones3DProps) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 7, 13], objetivo: [0, 1.4, 0], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 26, cajaObjetivo: [[-3, 0.5, -2], [3, 3, 2]] }}
    >
      <EncuadrarCaja caja={[[-3.3, 0, -3.1], [4.2, 3.7, 3.0]]} margen={0.98} direccion={[0.02, 0.55, 1]} />
      <Montaje {...props} />
    </LabCanvas>
  );
}
