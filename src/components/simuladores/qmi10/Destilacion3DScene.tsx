"use client";
/**
 * Q10 · Destilación fraccionada — mesa de laboratorio (R3F + kit).
 *
 *   Balón de 500 mL con la mezcla etanol–agua en una manta calefactora (sobre gato de laboratorio),
 *   columna Vigreux, cabeza de destilación con el termómetro a la altura de la salida lateral,
 *   condensador Liebig con mangueras al recirculador, alargadera y probeta receptora; aparte, un
 *   cilindro con el alcoholímetro que mide la muestra del destilado acumulado.
 *
 *   Todo sale del estado del store: ebullición (burbujas, vapor, gotas) sólo cuando hay caudal;
 *   el termómetro de la cabeza marca `tempCabeza` y el alcoholímetro flota donde le toca por el
 *   % v/v del destilado. La escena no dice cuánto calentar: sólo lo que se ve y se mide.
 */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, MatrazBalon, Probeta, Termometro, SoporteUniversal, Nuez, Pinza, Cable, Etiqueta,
  defBalon, defProbeta, alturaSuperficie, COLORES_LIQUIDO, useMateriales, esfera, cilindro,
} from '../_kit';
import {
  MantaCalefactora, GatoLaboratorio, ControladorManta, ColumnaVigreux, CabezaDestilacion, CABEZA, CondensadorLiebig, LIEBIG,
  OLIVA_SALIDA, OLIVA_ENTRADA, AdaptadorSalida, trayectoAdaptador, Alcoholimetro, ALC, marcaAlcoholimetro, Recirculador,
  AbrazaderaTubo, Burbujas, MANTA_CENTRO_Y,
} from './piezas';

type V3 = [number, number, number];

export interface Destilacion3DProps {
  /** temperatura del líquido del matraz (°C) */
  temp: number;
  /** volumen de mezcla que queda en el matraz (mL) */
  volMatraz: number;
  /** volumen de destilado acumulado en la probeta (mL) */
  volDestilado: number;
  /** % v/v de etanol del destilado acumulado */
  pureza: number;
  /** caudal de destilado (mL/s); > 0 = hierve */
  tasa: number;
  /** temperatura del vapor en la cabeza de la columna (°C) */
  tempCabeza: number;
  /** consigna de la manta (°C) */
  consigna: number;
}

// ── cotas del montaje (1 u = 1 dm) ──
const defBal = defBalon(500);
const Y_GATO = 0.5;
const Y_BALON = Y_GATO + MANTA_CENTRO_Y - 0.525;            // el fondo del balón queda concéntrico con el casquete
const Y_BOCA = Y_BALON + defBal.altura;                      // borde del cuello del balón
const LARGO_COL = 1.75;                                      // 1,5 de columna + 0,25 de junta dentro del cuello
const Y_COL = Y_BOCA - 0.28;
const Y_CABEZA = Y_COL + LARGO_COL - 0.2;
const ANG = CABEZA.anguloBrazo;                              // el condensador sigue el rumbo del brazo lateral
const P_COND: V3 = [CABEZA.fin[0], Y_CABEZA + CABEZA.fin[1], 0];
const FIN_COND: V3 = [P_COND[0] + LIEBIG.largo * Math.cos(ANG), P_COND[1] - LIEBIG.largo * Math.sin(ANG), 0];
const defProb = defProbeta(100);
const defJar = defProbeta(100);
const Y_BOCA_PROBETA = defProb.altura;
const ARCO = trayectoAdaptador(ANG, 0);
const ARCO_FIN: V3 = [ARCO[ARCO.length - 3], ARCO[ARCO.length - 2], 0];
const Y_PUNTA = Y_BOCA_PROBETA - 0.15;                       // la alargadera entra en la probeta
const CAIDA = FIN_COND[1] + ARCO_FIN[1] - Y_PUNTA;
const X_PROBETA = FIN_COND[0] + ARCO_FIN[0];
const POS_JAR: V3 = [3.1, 0, 1.15];
const POS_RECIRC: V3 = [4.0, 0, -3.0];
const POS_CONTROL: V3 = [-2.1, 0, 0.55];
const VOL_MUESTRA = 95;                                      // mL de muestra en el cilindro del alcoholímetro

const enCond = (l: V3): V3 => [P_COND[0] + l[0] * Math.cos(ANG), P_COND[1] - l[0] * Math.sin(ANG), l[2]];

/** Gotas de condensado que caen de la alargadera a la probeta con frecuencia ligada al caudal. */
function Gotas({ tasa, ySup }: { tasa: number; ySup: number }) {
  const m = useMateriales();
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const fase = useRef(0);
  const geo = useMemo(() => esfera(0.03, 10), []);
  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.05);
    fase.current += dt * (0.5 + Math.min(3, tasa * 2));
    const alto = Math.max(0.05, Y_PUNTA - 0.08 - ySup);
    refs.forEach((r, i) => {
      const g = r.current; if (!g) return;
      g.visible = tasa > 0.02;
      if (!g.visible) return;
      const f = (fase.current + i * 0.5) % 1;
      g.position.set(X_PROBETA, Y_PUNTA - 0.08 - f * f * alto, 0);
      g.scale.setScalar(f < 0.15 ? f / 0.15 : 1);
    });
  });
  return <>{refs.map((r, i) => <mesh key={i} ref={r} geometry={geo} material={m.liquido('#d8ecf2')} visible={false} />)}</>;
}

/** Alcoholímetro que flota en la muestra: su marca de % v/v queda a ras de la superficie. */
function AlcoholimetroFlotante({ pct, ySup, yFondo, flota }: { pct: number; ySup: number; yFondo: number; flota: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const obj = flota ? Math.max(yFondo + 0.01, ySup - marcaAlcoholimetro(pct)) : yFondo + 0.01;
  useFrame((_, dt) => {
    const g = ref.current; if (!g) return;
    g.position.y += (obj - g.position.y) * (1 - Math.exp(-Math.min(dt, 0.05) * 3));
    g.rotation.z += ((flota ? 0 : 0.06) - g.rotation.z) * 0.1;
  });
  return <group ref={ref} position={[0, obj, 0]}><Alcoholimetro /></group>;
}

function Montaje(p: Destilacion3DProps) {
  const m = useMateriales();
  const hierve = p.tasa > 0;
  const ySupBalon = Y_BALON + Math.max(0.1, alturaSuperficie(defBal, p.volMatraz));
  const ySupProbeta = alturaSuperficie(defProb, Math.max(0.01, p.volDestilado));
  const hayMuestra = p.volDestilado >= 2;
  const ySupJar = alturaSuperficie(defJar, VOL_MUESTRA);
  const yFondoJar = defJar.interior[0][1];
  const dirCond: V3 = [Math.cos(ANG), -Math.sin(ANG), 0];
  const yClampCond = P_COND[1] - 1.65 * Math.sin(ANG);
  const xClampCond = P_COND[0] + 1.65 * Math.cos(ANG);
  const rizoManguera = useMemo(() => ({ out: enCond(OLIVA_SALIDA), inn: enCond(OLIVA_ENTRADA) }), []);
  const nozzleOut: V3 = [POS_RECIRC[0] + 0.35, 1.1 + 0.3, POS_RECIRC[2]];
  const nozzleIn: V3 = [POS_RECIRC[0] - 0.35, 1.1 + 0.3, POS_RECIRC[2]];

  return (
    <group>
      {/* gato, manta y balón */}
      <GatoLaboratorio />
      <MantaCalefactora position={[0, Y_GATO, 0]} calor={hierve ? 1 : Math.min(1, Math.max(0, (p.consigna - p.temp) / 80))} />
      <MatrazBalon capacidad={500} position={[0, Y_BALON, 0]} liquido={{ volumenML: Math.max(1, p.volMatraz), color: '#dcecef' }} />
      {/* piedras de ebullición y burbujas */}
      {[[-0.18, 0.1], [0.14, -0.12], [0.02, 0.2], [-0.1, -0.22]].map(([x, z], i) => (
        <mesh key={i} geometry={esfera(0.04, 8)} material={m.ceramica} position={[x, Y_BALON + defBal.grosor + 0.06, z]} scale={[1, 0.8, 1]} />
      ))}
      <Burbujas activa={hierve} rMax={0.3} yFondo={Y_BALON + defBal.grosor + 0.08} ySup={ySupBalon} />

      {/* columna Vigreux y cabeza con el termómetro */}
      <ColumnaVigreux position={[0, Y_COL, 0]} largo={LARGO_COL} vapor={hierve ? 1 : 0} />
      <CabezaDestilacion position={[0, Y_CABEZA, 0]} vapor={hierve ? 1 : 0} />
      <Termometro position={[0, Y_CABEZA + 0.4, 0]} temperatura={p.tempCabeza} longitud={2.5} liquido="alcohol" />

      {/* condensador Liebig, inclinado en el rumbo del brazo lateral */}
      <group position={P_COND} rotation={[0, 0, -ANG]}><CondensadorLiebig /></group>
      <AdaptadorSalida position={FIN_COND} angulo={ANG} caida={CAIDA} />
      <Cable desde={rizoManguera.inn} hasta={nozzleIn} holgura={0.5} grosor={0.04} color="#8fc7e4" />
      <Cable desde={rizoManguera.out} hasta={nozzleOut} holgura={0.5} grosor={0.04} color="#8fc7e4" />
      <Recirculador position={POS_RECIRC} />

      {/* soportes: uno sujeta la columna; otro, el condensador por su camisa */}
      <SoporteUniversal position={[-0.26, 0, -2.8]} alturaVarilla={3.6}>
        <Nuez altura={Y_COL + 1.05}>
          <Pinza tipo="matraz" diametro={0.26} largo={2.8} />
        </Nuez>
      </SoporteUniversal>
      <SoporteUniversal position={[xClampCond - 0.26, 0, -2.8]} alturaVarilla={Math.ceil(yClampCond + 0.6)}>
        <Nuez altura={yClampCond}>
          <AbrazaderaTubo radio={0.18} largo={2.8} dir={dirCond} />
        </Nuez>
      </SoporteUniversal>

      {/* receptor: probeta de 100 mL con el destilado y gotas que caen */}
      <Probeta capacidad={100} position={[X_PROBETA, 0, 0]} liquido={p.volDestilado > 0.05 ? { volumenML: Math.min(100, p.volDestilado), color: '#dcecf1' } : undefined} />
      <Gotas tasa={p.tasa} ySup={p.volDestilado > 0.05 ? ySupProbeta : 0.2} />

      {/* cilindro con el alcoholímetro (muestra del destilado acumulado) */}
      <group position={POS_JAR}>
        <Probeta capacidad={100} liquido={hayMuestra ? { volumenML: VOL_MUESTRA, color: '#dcecf1' } : undefined} />
        <AlcoholimetroFlotante pct={p.pureza} ySup={ySupJar} yFondo={yFondoJar} flota={hayMuestra} />
      </group>

      {/* controlador de la manta */}
      <ControladorManta position={POS_CONTROL} rotation={[0, 0.3, 0]} consigna={p.consigna} calentando={p.consigna > p.temp + 1} />
      <Cable desde={[POS_CONTROL[0] + 0.7, 0.35, POS_CONTROL[2] - 0.35]} hasta={[0.72, Y_GATO + 0.3, 0.05]} holgura={0.45} grosor={0.03} color="#23282c" ySuelo={0} />

      {/* rótulos */}
      <Etiqueta texto="Columna Vigreux" position={[-0.95, Y_COL + 0.85, 0.2]} tamano={0.17} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
      <Etiqueta texto="Condensador Liebig" position={[2.5, yClampCond + 0.55, 0.2]} tamano={0.17} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
      <Etiqueta texto="Alcoholímetro" position={[POS_JAR[0], 0.12, POS_JAR[2] + 0.6]} tamano={0.17} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
      <Etiqueta texto="Receptor" position={[X_PROBETA, 0.12, 0.75]} tamano={0.17} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
      <Etiqueta texto="Manta" position={[POS_CONTROL[0], 0.12, POS_CONTROL[2] + 0.8]} tamano={0.17} fondo="#ffffff" borde="#9aa6ad" color="#12202b" peso={600} />
    </group>
  );
}

export default function Destilacion3DScene(props: Destilacion3DProps) {
  void COLORES_LIQUIDO; void cilindro; void ALC;
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [1, 5.5, 14], objetivo: [1.0, 3.0, 0], fov: 35 }}
      controles={{ minDistancia: 5, maxDistancia: 30, cajaObjetivo: [[-2, 0.5, -3], [5, 6, 2]] }}
    >
      <EncuadrarCaja caja={[[-3.0, 0, -3.4], [5.0, 6.8, 3.3]]} margen={1.0} direccion={[0.0, 0.25, 1]} />
      <Montaje {...props} />
    </LabCanvas>
  );
}
