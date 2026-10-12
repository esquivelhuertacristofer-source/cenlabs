"use client";

/**
 * Montaje clásico de la fotosíntesis con Elodea (1 u = 1 dm):
 * rama de Elodea bajo un embudo INVERTIDO dentro de un vaso con agua; el vástago del
 * embudo entra en un tubo colector graduado, lleno de agua e invertido, donde se
 * acumula el O₂; lámpara LED de color sobre un carro en un banco óptico graduado
 * (la distancia es la del lab); luxómetro cuántico y termómetro.
 *
 * Ligado al modelo del dominio (nada decorativo):
 *   · burbujas → tasa neta tasaNetaB4(color, distancia) (cero si no supera la respiración);
 *   · columna de gas → O₂ del ensayo: sube de 0 al valor durante la medición y queda
 *     en el del último ensayo registrado;
 *   · luxómetro → ppfdB4(distancia); termómetro → sube al acercar la lámpara.
 * La meta de O₂ y la mejor luz NO se dibujan: son lo que el alumno descubre.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import {
  LabCanvas, useMateriales, VasoPrecipitado, Embudo, TuboEnsayo, Termometro, Cable, Etiqueta,
  defVaso, defEmbudo, defTubo, alturaSuperficie, cilindro, geoCache,
} from '../_kit';
import { tasaNetaB4, ppfdB4, o2EnsayoB4, PMAX_B4, RESPIRACION_B4 } from '@/domain/biologia';
import type { ColorLuzB4 } from '@/store/types';
import { BancoOptico, LamparaLED, RamaElodea, Luxometro, SensorPAR, BurbujasO2, Y_BANCO, LUZ_HEX } from './piezas';

interface Props {
  simulando: boolean;
  colorLuz: ColorLuzB4;
  distancia: number;
  /** distancia mínima segura (la lámpara calienta el agua por debajo) */
  dMin: number;
  /** O₂ (mL) del último ensayo registrado; 0 si no hay */
  ultimoO2: number;
}

const DUR_VISUAL = 2.5;      // s reales que representan los 10 min del ensayo
const K = 1.3;                        // escala visual del montaje (vaso, embudo, tubo, termómetro); la distancia a la lámpara no se escala
const P = (x: number, y: number, z: number): [number, number, number] => [x * K, y * K, z * K];
const ETQ = { tamano: 0.19, fondo: '#ffffffe6' } as const;

// ── geometría del montaje ──
const SF = 0.8;                       // escala del embudo
const defV = defVaso(600), defF = defEmbudo(75), defT = defTubo('13x100');
const H_TUBO = 1.8;                   // alargamiento vertical del tubo colector (capilar graduado)
const ESC_T = 0.8;                    // escala radial del tubo
const R_IN = defT.radioInteriorEn(defT.altura * 0.5) * ESC_T;
const ML_POR_U = 0.001 / (Math.PI * R_IN * R_IN); // longitud (u) que ocupa 1 mL en la columna
const R_OUT = defT.radioMax * ESC_T;
const Y_AGUA = Y_BANCO + alturaSuperficie(defV, 560);
const Y_BOCA = Y_BANCO + 0.14;       // boca del embudo (sobre tres perlas de vidrio)
const Y_PUNTA = Y_BOCA + defF.altura * SF;
const Y_TUBO0 = Y_AGUA - 0.12;       // extremo abierto del tubo: bajo el nivel del agua
const Y_TUBO1 = Y_TUBO0 + defT.altura * H_TUBO;
const Y_CERO = Y_TUBO1 - 0.15;       // marca de 0 mL (el gas se acumula bajo la cúpula)

function Rotulo3D({ texto, desde, hasta, ancla = [0.5, 0.5] }: { texto: string; desde: [number, number, number]; hasta: [number, number, number]; ancla?: [number, number] }) {
  return (
    <group>
      <Line points={[desde, hasta]} color="#46535c" lineWidth={1.2} />
      <Etiqueta texto={texto} position={hasta} {...ETQ} ancla={ancla} />
    </group>
  );
}

function Montaje({ simulando, colorLuz, distancia, dMin, ultimoO2 }: Props) {
  const m = useMateriales();
  const hex = LUZ_HEX[colorLuz] ?? '#ffffff';
  const xLamp = distancia / 10;
  const ppfd = ppfdB4(distancia);
  const tasa = tasaNetaB4(colorLuz, distancia);
  const r = Math.max(0, Math.min(1, tasa / (PMAX_B4 - RESPIRACION_B4)));
  const nBurb = tasa <= 0.002 ? 0 : Math.round(4 + 32 * r);
  const temperatura = Math.min(46, 22 + 12 * (dMin / Math.max(distancia, 1)) ** 2);

  // ── columna de gas (mL) ──
  const gasRef = useRef(ultimoO2);
  const interfaz = useRef<THREE.Group>(null);
  const agua = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  const objetivo = o2EnsayoB4(colorLuz, distancia);
  const yIntRef = useRef(Y_CERO - ultimoO2 * ML_POR_U);
  const [yInt, setYInt] = React.useState(Y_CERO - ultimoO2 * ML_POR_U);
  useEffect(() => { t0.current = null; if (simulando) gasRef.current = 0; }, [simulando]);
  useFrame(({ clock }, dt) => {
    let v = gasRef.current;
    if (simulando) {
      if (t0.current === null) t0.current = clock.elapsedTime;
      v = objetivo * Math.min(1, (clock.elapsedTime - t0.current) / DUR_VISUAL);
    } else {
      v += (ultimoO2 - v) * (1 - Math.exp(-dt * 6));
    }
    gasRef.current = v;
    const y = Math.max(Y_TUBO0 + 0.05, Y_CERO - v * ML_POR_U);
    if (Math.abs(y - yIntRef.current) > 0.002) { yIntRef.current = y; setYInt(y); }
  });

  const matAgua = useMemo(() => m.liquido('#4f9fc8'), [m]);
  const matMenisco = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1d5878', roughness: 0.4 }), []);
  useEffect(() => () => matMenisco.dispose(), [matMenisco]);
  const hojas = useMemo(() => Array.from({ length: 12 }, (_, i): [number, number, number] => [Math.sin(i * 2.4) * 0.11, Y_BANCO + 0.25 + (i / 12) * 0.5, Math.cos(i * 2.4) * 0.11]), []);
  const marcas = useMemo(() => Array.from({ length: 36 }, (_, k) => ({ k, mL: k / 10 })), []);
  const R_BOCA = 0.375 * SF * 0.96, H_CONO = 0.46, R_VASTAGO = 0.03;
  const geoCono = useMemo(() => geoCache('bio04:cono', () => new THREE.CylinderGeometry(R_VASTAGO, R_BOCA, H_CONO, 40, 1, true)), [R_BOCA]);
  const geoAro = useMemo(() => geoCache('bio04:aro', () => new THREE.TorusGeometry(R_BOCA, 0.011, 8, 48)), [R_BOCA]);
  const matCono = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#c6e6ef', roughness: 0.12, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }), []);
  const matAro = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#8fb9c6', roughness: 0.2 }), []);
  useEffect(() => () => { matCono.dispose(); matAro.dispose(); }, [matCono, matAro]);
  const matMarca = useMemo(() => m.impreso('#1b2b4a'), [m]);
  const cajaMarca = useMemo(() => geoCache('bio04:marca', () => new THREE.BoxGeometry(1, 1, 1)), []);

  return (
    <group>
      <BancoOptico />

      <group scale={K}>
      {/* vaso con agua, embudo invertido y rama de Elodea */}
      <group position={[0, Y_BANCO, 0]} rotation={[0, 2.4, 0]}><VasoPrecipitado capacidad={600} liquido={{ volumenML: 560, color: '#cfe6ef' }} /></group>
      {[0, 1, 2].map((i) => <mesh key={i} geometry={geoCache('bio04:perla', () => new THREE.SphereGeometry(1, 12, 8))} material={m.vidrio} position={[Math.cos(i * 2.094) * 0.27, Y_BANCO + 0.075, Math.sin(i * 2.094) * 0.27]} scale={0.055} />)}
      <group position={[0.02, Y_BANCO + 0.06, 0]}><RamaElodea largo={0.85} /></group>
      <group position={[0, Y_PUNTA, 0]} rotation={[Math.PI, 0, 0]} scale={SF}><Embudo diametro={75} /></group>

      {/* realce del embudo: cono de vidrio y aro de la boca (el vidrio barato casi no se ve a esta distancia) */}
      <mesh geometry={geoCono} material={matCono} position={[0, Y_BOCA + H_CONO / 2, 0]} renderOrder={0} />
      <mesh geometry={geoAro} material={matAro} position={[0, Y_BOCA, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {/* tubo colector graduado, invertido, lleno de agua (el gas queda bajo la cúpula) */}
      <group position={[0, Y_TUBO1, 0]} rotation={[Math.PI, 0, 0]} scale={[ESC_T, H_TUBO, ESC_T]}><TuboEnsayo tamano="13x100" /></group>
      <mesh ref={agua} geometry={cilindro(1, 1, 1, 24)} material={matAgua} position={[0, (Y_TUBO0 + yInt) / 2, 0]} scale={[R_IN - 0.004, Math.max(0.01, yInt - Y_TUBO0), R_IN - 0.004]} />
      <mesh geometry={cilindro(1, 1, 1, 24)} material={matMenisco} position={[0, yInt, 0]} scale={[R_IN - 0.003, 0.012, R_IN - 0.003]} />
      <group ref={interfaz}>
        {marcas.map(({ k, mL }) => {
          const y = Y_CERO - mL * ML_POR_U;
          const largo = k % 10 === 0 ? 0.075 : k % 5 === 0 ? 0.055 : 0.032;
          return <mesh key={k} geometry={cajaMarca} material={matMarca} position={[-R_OUT * 0.15, y, R_OUT * 0.97]} scale={[largo, 0.004, 0.003]} />;
        })}
        {[0, 1, 2, 3].map((n) => (
          <Etiqueta key={n} texto={String(n)} position={[0.14, Y_CERO - n * ML_POR_U, 0.05]} tamano={0.16} color="#1b2b4a" peso={700} fondo={null} />
        ))}
        <Etiqueta texto="mL de O₂" position={[0.24, Y_CERO + 0.28, 0.05]} tamano={0.17} color="#1b2b4a" peso={700} fondo={null} />
      </group>
      <BurbujasO2 n={nBurb} hojas={hojas} cuello={[0, Y_BOCA + 0.5, 0]} yInterfaz={yInt - 0.015} ciclo={0.22 + 0.2 * r} />

      {/* termómetro en el agua */}
      <Termometro position={[0.3, Y_BANCO + 0.06, 0.24]} temperatura={temperatura} min={10} max={50} longitud={1.7} />

      </group>

      {/* lámpara en el riel: su lente está a `distancia` cm del eje del tubo */}
      <group position={[xLamp, 0, 0]}><LamparaLED hex={hex} /></group>
      <pointLight position={[xLamp - 0.25, 1.05, 0]} color={hex} intensity={2 + 7 * Math.min(1, ppfd / 500)} distance={9} decay={1.4} />

      {/* luxómetro: sensor frente a la lámpara y pantalla en el banco */}
      <group position={[1.05, 0, 0.55]}><SensorPAR /></group>
      <group position={[1.3, 0, -0.5]}><Luxometro ppfd={ppfd} /></group>
      <Cable desde={[1.05, Y_BANCO + 0.12, 0.55]} hasta={[1.3, Y_BANCO + 0.12, -0.42]} color="#1d1f22" ySuelo={Y_BANCO} holgura={0.25} />

      {/* rótulos (coordenadas del montaje ya escaladas) */}
      <Rotulo3D texto="Tubo colector" desde={P(-R_OUT, Y_TUBO1 - 0.5, 0)} hasta={[-0.95, (Y_TUBO1 - 0.5) * K, 0.2]} ancla={[1, 0.5]} />
      <Rotulo3D texto="Elodea" desde={P(-0.12, Y_BANCO + 0.45, 0.1)} hasta={[-1.05, 0.55 * K, 0.4]} ancla={[1, 0.5]} />
      <Rotulo3D texto="Embudo invertido" desde={P(0.2, Y_BOCA + 0.55, 0.05)} hasta={[0.95, 2.05, 0.3]} ancla={[0, 0.5]} />
      <Rotulo3D texto="Termómetro" desde={P(0.3, Y_BANCO + 1.5, 0.24)} hasta={[0.95, 2.75, 0.3]} ancla={[0, 0.5]} />
    </group>
  );
}

export default function Fotosintesis3DScene(props: Props) {
  return (
    <LabCanvas
      fondo="laboratorio"
      mesa={{ ancho: 24, fondo: 6 }}
      camara={{ posicion: [-0.6, 3.4, 11.6], objetivo: [1.65, 1.55, 0], fov: 38 }}
      controles={{ minDistancia: 3, maxDistancia: 20, maxPolar: 1.45, cajaObjetivo: [[-1, 0.8, -1], [5, 3, 1]] }}
    >
      <Montaje {...props} />
    </LabCanvas>
  );
}
