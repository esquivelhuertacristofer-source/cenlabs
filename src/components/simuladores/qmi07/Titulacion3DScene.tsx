"use client";
/**
 * Q7 · Titulación ácido-base — mesa de laboratorio (R3F + kit).
 *
 *   Bureta de 50 mL con llave de PTFE sujeta por pinza a un soporte universal; Erlenmeyer de 250 mL
 *   con la alícuota de HCl sobre azulejo blanco; frasco gotero de fenolftaleína; electrodo de pH
 *   (sujeto con una segunda pinza) conectado a un pH-metro de banco.
 *
 *   La bureta marca el volumen añadido (lectura = nivel del líquido, como en el vidrio real) y el
 *   matraz toma el color del indicador cuando el pH pasa de 8,2. La escena NUNCA muestra el volumen
 *   de equivalencia ni la concentración del ácido: sólo lo que ve y lee un alumno.
 */
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, SoporteUniversal, Nuez, Pinza, Bureta, Erlenmeyer, Cable, Etiqueta,
  defBureta, defErlenmeyer, alturaSuperficie, COLORES_LIQUIDO, useMateriales, cilindro, esfera,
} from '../_kit';
import { Azulejo, FrascoGotero, GOTERO_ALTO, ElectrodoPH, ELECTRODO_CABLE, PHmetro, PHMETRO_BNC } from './piezas';
import { VIRAJE_FENOLFTALEINA } from '@/domain/quimica';

type V3 = [number, number, number];

export interface Titulacion3DProps {
  volumenBase: number;
  ph: number;
  indicador: boolean;
  /** apertura de la llave, 0–1 */
  flowRate: number;
  purgada: boolean;
  /** volumen de la alícuota de ácido (mL) y molaridad de la base (mol/L): rótulos de reactivos */
  va: number;
  cb: number;
}

// ── geometría del montaje ──
const defB = defBureta();
const SX = -0.19;                       // soporte universal
const SZ = -1.4;
const NUEZ_B = 4.6;                     // altura de la nuez de la bureta
const Y_PINZA_EN_BURETA = defB.extra.y50Marca + 1.6;
const X_BURETA = SX + 0.26;             // eje de la bureta (el brazo de la nuez queda a 26 mm de la varilla)
const Z_BURETA = SZ + 1.6;
const TIP_Y = NUEZ_B - 0.02 - Y_PINZA_EN_BURETA;   // punta de la bureta sobre la mesa
const X_MATRAZ = 0;                     // el matraz queda 7 cm a un lado del eje de la bureta: la punta cae dentro del cuello
const Y_BASE = 0.19;                    // base del soporte (0,16) + azulejo (0,03)
const defE = defErlenmeyer(250);
const GIRO_ELECTRODO = -0.09;           // gira el brazo para que el electrodo entre por el lado opuesto del cuello
const X_ELECTRODO = SX + 0.26 * Math.cos(GIRO_ELECTRODO) + 1.6 * Math.sin(GIRO_ELECTRODO);
const Z_ELECTRODO = SZ - 0.26 * Math.sin(GIRO_ELECTRODO) + 1.6 * Math.cos(GIRO_ELECTRODO);
const Y_PUNTA_ELECTRODO = Y_BASE + 0.03;
const GRIP_ELECTRODO = 1.62;            // la pinza abraza el cabezal (altura sobre la punta)
const POS_PH: V3 = [2.75, 0, 0.5];

// ── frasco gotero: reposo y posición de trabajo (inclinado sobre la boca del matraz) ──
const REPOSO_GOTERO: V3 = [-2.1, 0, 0.9];
const PHI = 0.9;                        // inclinación respecto de la vertical (rad)
const PUNTA_GOTERO: V3 = [X_MATRAZ, Y_BASE + defE.altura + 0.32, Z_BURETA + 0.1];
const BASE_TRABAJO: V3 = [
  PUNTA_GOTERO[0], PUNTA_GOTERO[1] + GOTERO_ALTO * Math.cos(PHI), PUNTA_GOTERO[2] + GOTERO_ALTO * Math.sin(PHI),
];
const DUR_GOTERO = 3.4;

const suave = (t: number) => t * t * (3 - 2 * t);
const mezcla = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(t, 0, 1)).getHexString();

/** Color del contenido del matraz: incoloro hasta el viraje; luego rosa tenue → fucsia. */
function colorMatraz(ph: number, indicador: boolean): string {
  if (!indicador || ph < VIRAJE_FENOLFTALEINA) return COLORES_LIQUIDO.agua;
  const t = (ph - VIRAJE_FENOLFTALEINA) / (9.8 - VIRAJE_FENOLFTALEINA);
  return t < 0.5 ? mezcla(COLORES_LIQUIDO.agua, COLORES_LIQUIDO.fenolftaleinaTenue, t * 2) : mezcla(COLORES_LIQUIDO.fenolftaleinaTenue, COLORES_LIQUIDO.fenolftaleina, (t - 0.5) * 2);
}

function Montaje({ volumenBase, ph, indicador, flowRate, purgada, va, cb }: Titulacion3DProps) {
  const m = useMateriales();
  const volMatraz = va + volumenBase;
  const ySup = Y_BASE + Math.max(0.05, alturaSuperficie(defE, volMatraz));
  const abierta = flowRate > 0.1;
  const llave = THREE.MathUtils.clamp(flowRate, 0, 1);
  const color = colorMatraz(ph, indicador);

  // ── gotas de NaOH que caen de la punta ──
  const g1 = useRef<THREE.Mesh>(null), g2 = useRef<THREE.Mesh>(null), g3 = useRef<THREE.Mesh>(null);
  const hilo = useRef<THREE.Mesh>(null);
  const reloj = useRef(0);
  const gotero = useRef<THREE.Group>(null);
  const gotaI1 = useRef<THREE.Mesh>(null), gotaI2 = useRef<THREE.Mesh>(null);
  const anim = useRef({ t: -1, previo: indicador });

  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.05);
    reloj.current += dt * (1.2 + flowRate * 5);
    const caida = TIP_Y - 0.05 - ySup;
    const hilo_ = abierta && flowRate > 0.5;
    [g1.current, g2.current, g3.current].forEach((g, i) => {
      if (!g) return;
      g.visible = abierta && !hilo_;
      if (!g.visible) return;
      const f = (reloj.current + i / 3) % 1;
      const y = TIP_Y - 0.05 - f * f * caida;     // cae acelerando
      g.position.set(X_BURETA, y, Z_BURETA);
      const s = f < 0.12 ? f / 0.12 : 1;          // la gota crece antes de soltarse
      g.scale.set(s, s * (1 + f * 0.5), s);
    });
    if (hilo.current) {
      hilo.current.visible = hilo_;
      hilo.current.scale.set(0.4 + flowRate * 0.9, caida, 0.4 + flowRate * 0.9);
      hilo.current.position.set(X_BURETA, TIP_Y - 0.05 - caida / 2, Z_BURETA);
    }
    // ── frasco gotero: se acerca, deja caer dos gotas y vuelve a su sitio ──
    const A = anim.current;
    if (indicador && !A.previo) A.t = 0;
    A.previo = indicador;
    if (A.t >= 0) { A.t += dt; if (A.t > DUR_GOTERO) A.t = -1; }
    const t = A.t < 0 ? 0 : A.t / DUR_GOTERO;
    const k = A.t < 0 ? 0 : t < 0.3 ? suave(t / 0.3) : t > 0.75 ? 1 - suave((t - 0.75) / 0.25) : 1;
    if (gotero.current) {
      const p = gotero.current.position;
      p.set(
        THREE.MathUtils.lerp(REPOSO_GOTERO[0], BASE_TRABAJO[0], k),
        THREE.MathUtils.lerp(REPOSO_GOTERO[1], BASE_TRABAJO[1], k) + Math.sin(k * Math.PI) * 0.4,
        THREE.MathUtils.lerp(REPOSO_GOTERO[2], BASE_TRABAJO[2], k),
      );
      gotero.current.rotation.set(THREE.MathUtils.lerp(0, Math.PI + PHI, k), 0, 0);
    }
    [gotaI1.current, gotaI2.current].forEach((g, i) => {
      if (!g) return;
      const t0 = 0.38 + i * 0.16;
      const f = (t - t0) / 0.16;
      g.visible = A.t >= 0 && f > 0 && f < 1;
      if (g.visible) {
        const dy = PUNTA_GOTERO[1] - 0.04 - (ySup + 0.02);
        g.position.set(PUNTA_GOTERO[0], PUNTA_GOTERO[1] - 0.04 - f * f * dy, PUNTA_GOTERO[2]);
        g.scale.setScalar(Math.min(1, f * 6));
      }
    });
  });

  const gota = useMemo(() => esfera(0.026, 12), []);
  const cuerpoHilo = useMemo(() => cilindro(0.02, 0.02, 1, 8), []);
  const bureta = useMemo(() => ({ x: X_BURETA, z: Z_BURETA }), []);
  const cableDesde: V3 = [X_ELECTRODO, Y_PUNTA_ELECTRODO + ELECTRODO_CABLE[1], Z_ELECTRODO];
  const cableHasta: V3 = [POS_PH[0] + PHMETRO_BNC[0] - 0.08, POS_PH[1] + PHMETRO_BNC[1], POS_PH[2] + PHMETRO_BNC[2]];

  return (
    <group>
      {/* soporte universal con la bureta (pinza superior) y el electrodo (pinza inferior) */}
      <SoporteUniversal position={[SX, 0, SZ]} alturaVarilla={6.1}>
        <Nuez altura={NUEZ_B}>
          <Pinza tipo="bureta" diametro={0.135}>
            <Bureta position={[0, -Y_PINZA_EN_BURETA, 0]} lecturaML={volumenBase} llave={llave} colorLiquido={COLORES_LIQUIDO.agua} />
            {/* burbuja de aire atrapada en la punta mientras no se purga */}
            {!purgada && <mesh geometry={cilindro(0.016, 0.016, 0.16, 10)} material={m.vidrio} position={[0, -Y_PINZA_EN_BURETA + 0.2, 0]} renderOrder={4} />}
          </Pinza>
        </Nuez>
        <Nuez altura={Y_PUNTA_ELECTRODO + GRIP_ELECTRODO + 0.02} giro={GIRO_ELECTRODO}>
          <Pinza tipo="bureta" diametro={0.12}>
            <ElectrodoPH position={[0, -GRIP_ELECTRODO, 0]} />
          </Pinza>
        </Nuez>
      </SoporteUniversal>

      {/* azulejo blanco sobre la base del soporte y matraz con la alícuota de ácido */}
      <Azulejo position={[X_MATRAZ, 0.16, Z_BURETA]} lado={1.5} />
      <Erlenmeyer capacidad={250} position={[X_MATRAZ, Y_BASE, Z_BURETA]} liquido={{ volumenML: volMatraz, color }} />

      {/* gotas y chorro de NaOH */}
      <mesh ref={g1} geometry={gota} material={m.liquido(COLORES_LIQUIDO.agua)} visible={false} position={[bureta.x, TIP_Y, bureta.z]} />
      <mesh ref={g2} geometry={gota} material={m.liquido(COLORES_LIQUIDO.agua)} visible={false} position={[bureta.x, TIP_Y, bureta.z]} />
      <mesh ref={g3} geometry={gota} material={m.liquido(COLORES_LIQUIDO.agua)} visible={false} position={[bureta.x, TIP_Y, bureta.z]} />
      <mesh ref={hilo} geometry={cuerpoHilo} material={m.liquido(COLORES_LIQUIDO.agua)} visible={false} />

      {/* frasco gotero de fenolftaleína */}
      <group ref={gotero} position={REPOSO_GOTERO}><FrascoGotero nombre="Fenolftaleína" /></group>
      <mesh ref={gotaI1} geometry={gota} material={m.liquido(COLORES_LIQUIDO.agua)} visible={false} />
      <mesh ref={gotaI2} geometry={gota} material={m.liquido(COLORES_LIQUIDO.agua)} visible={false} />

      {/* pH-metro y cable del electrodo */}
      <PHmetro position={POS_PH} ph={ph} />
      <Cable desde={cableDesde} hasta={cableHasta} holgura={0.9} color="#23282c" grosor={0.012} />

      {/* rótulos de los reactivos */}
      <Etiqueta texto={`NaOH ${cb} M`} position={[1.0, TIP_Y + 3.2, Z_BURETA]} tamano={0.3} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={700} />
      <Etiqueta texto={`HCl · ${va} mL`} position={[X_MATRAZ, 0.12, Z_BURETA + 1.3]} tamano={0.26} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={700} />
      <Etiqueta texto="pH-metro" position={[POS_PH[0], 0.12, POS_PH[2] + 0.95]} tamano={0.22} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
    </group>
  );
}

export default function Titulacion3DScene(props: Titulacion3DProps) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 5, 14], objetivo: [0.3, 4.3, 0], fov: 35 }}
      controles={{ minDistancia: 4, maxDistancia: 26, cajaObjetivo: [[-3, 0.5, -2], [3.5, 8.5, 2]] }}
    >
      <EncuadrarCaja caja={[[-3.0, 0, -1.6], [3.9, 9.5, 2.0]]} margen={1.0} direccion={[0, 0.22, 1]} />
      <Montaje {...props} />
    </LabCanvas>
  );
}
