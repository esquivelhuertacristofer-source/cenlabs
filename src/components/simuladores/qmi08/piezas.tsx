"use client";
/**
 * Q8 · Equilibrio químico N₂O₄ ⇌ 2 NO₂ — piezas propias del montaje.
 *
 *   JeringaGas  jeringa de 20 mL sellada con tapón en la punta; el gas encerrado lleva el tono
 *               REAL de la mezcla (`tonoMezclaNO2`) a la temperatura de la jeringa. Origen: la punta;
 *               el cuerpo sube por +Y (se apoya inclinada contra la pared del baño).
 *   BanoPlato   baño de agua en cristalizador de 190 mm (con o sin hielo flotando).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import {
  Jeringa, BanoHielo, Cristalizador, defCristalizador, defJeringa, jeringaAlturaEmbolo,
  useMateriales, cilindro, COLORES_LIQUIDO,
} from '../_kit';
import { fraccionNO2, tonoMezclaNO2 } from '@/domain/quimica';

type GroupProps = ThreeElements['group'];

/** Volumen de gas sellado en cada jeringa (mL), de la escala de 20 mL. */
export const GAS_ML = 11;
export const JERINGA_CAP = 20;

/** Jeringa de gas sellada: émbolo fijo en GAS_ML; el gas toma el tono de `temp`. */
export function JeringaGas({ temp, ...g }: GroupProps & { temp: number }) {
  const m = useMateriales();
  const def = defJeringa(JERINGA_CAP);
  const Ri = def.extra.radioInterior;
  const yCero = def.extra.yCero;
  const yEmb = jeringaAlturaEmbolo(JERINGA_CAP, GAS_ML);
  const tono = tonoMezclaNO2(temp);
  const x = fraccionNO2(temp);
  // Mismo recurso que el líquido del kit: en calidad alta el gas es transmisivo (Beer-Lambert) para verse
  // a través del plástico de la jeringa y del agua del baño; en media, una lámina translúcida.
  const alta = m.calidad === 'alta';
  const mat = useMemo(() => alta
    ? new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.3, ior: 1.0,
        attenuationColor: new THREE.Color('#d99030'), attenuationDistance: 0.6, side: THREE.DoubleSide,
      })
    : new THREE.MeshPhysicalMaterial({ color: '#d99030', transparent: true, opacity: 0.5, roughness: 0.2, metalness: 0, depthWrite: false }),
  [alta]);
  useEffect(() => {
    const xx = Math.min(1, x);
    if (alta) {
      mat.attenuationColor.set(tono);
      mat.attenuationDistance = 0.9 - 0.62 * xx;
      mat.color.set('#ffffff').lerp(new THREE.Color(tono), 0.25 * xx);
    } else {
      mat.color.set(tono); mat.opacity = 0.2 + 0.72 * xx;
    }
  }, [mat, tono, x, alta]);
  useEffect(() => () => mat.dispose(), [mat]);
  const altoGas = Math.max(0.01, yEmb - yCero);
  return (
    <group {...g}>
      <Jeringa capacidad={JERINGA_CAP} volumenML={GAS_ML} conLiquido={false} />
      {/* gas encerrado entre la punta y el émbolo */}
      <mesh geometry={cilindro(Ri - 0.004, Ri - 0.004, altoGas, 28)} material={mat} position={[0, yCero + altoGas / 2, 0]} renderOrder={4} />
      <mesh geometry={cilindro(0.03, 0.012, yCero, 14)} material={mat} position={[0, yCero / 2, 0]} renderOrder={4} />
      {/* tapón de la punta (luer) */}
      <mesh geometry={cilindro(0.052, 0.045, 0.12, 16)} material={m.plastico('#2d6fb7', 0.5)} position={[0, 0.02, 0]} castShadow />
    </group>
  );
}

/** Altura (u) del fondo interior del cristalizador sobre su base. */
export const FONDO_BANO = defCristalizador(190).y0;

/** Baño en cristalizador: agua hasta el 85 % del borde; con `hielo`, cubos flotando. */
export function BanoPlato({ hielo = false, colorAgua = COLORES_LIQUIDO.agua, ...g }: GroupProps & { hielo?: boolean; colorAgua?: string }) {
  const def = defCristalizador(190);
  const vol = def.volumenHastaAltura(def.y0 + (def.yMax - def.y0) * 0.85);
  if (hielo) return <BanoHielo diametro={190} cubos={16} nivel={0.85} colorAgua="#d3e8f1" {...g} />;
  return <Cristalizador diametro={190} liquido={{ volumenML: vol, color: colorAgua, menisco: 0.4 }} {...g} />;
}
