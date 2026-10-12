"use client";
/**
 * Q7 · Titulación ácido-base — piezas propias del montaje.
 *
 *   Azulejo        azulejo blanco bajo el matraz (para ver el viraje del indicador).
 *   FrascoGotero   frasco gotero de plástico de 30 mL con boquilla (fenolftaleína). Origen: base.
 *   ElectrodoPH    electrodo combinado de vidrio: bulbo, cuerpo transparente y cabezal. Origen: la punta.
 *   PHmetro        potenciómetro de banco con pantalla de 7 segmentos (lectura = instrumento).
 */
import React, { useMemo } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import {
  useMateriales, geoCache, tornear, cilindro, cajaRedondeada, esfera, mm, Etiqueta, type P2,
  useTexturaLienzo, dibujarSieteSegmentos, familiaTexto,
} from '../_kit';

type GroupProps = ThreeElements['group'];

/** Azulejo cerámico blanco de 1,6 × 1,6 (origen: centro de la cara inferior). */
export function Azulejo({ lado = 1.6, ...g }: GroupProps & { lado?: number }) {
  const m = useMateriales();
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(lado, 0.03, lado, 0.01, 2)} material={m.ceramica} position={[0, 0.015, 0]} receiveShadow castShadow />
    </group>
  );
}

/** Altura del frasco gotero (u) hasta la punta de la boquilla. */
export const GOTERO_ALTO = 1.32;
/** Frasco gotero de plástico (30 mL) con boquilla: se invierte y se aprieta para dejar caer gotas. Origen: base. */
export function FrascoGotero({ nombre, ...g }: GroupProps & { nombre: string }) {
  const m = useMateriales();
  const cuerpo: P2[] = useMemo(() => [
    [0.0005, 0], [0.24, 0], [0.27, 0.05], [0.27, 0.72], [0.22, 0.86], [0.12, 0.95], [0.075, 0.99], [0.07, 1.2], [0.03, GOTERO_ALTO], [0.012, GOTERO_ALTO],
    [0.012, GOTERO_ALTO - 0.02], [0.05, 1.19], [0.055, 1.0], [0.1, 0.94], [0.2, 0.84], [0.25, 0.71], [0.25, 0.06], [0.0005, 0.04],
  ], []);
  const geo = useMemo(() => geoCache('q7gotero', () => tornear(cuerpo, 36)), [cuerpo]);
  return (
    <group {...g}>
      <mesh geometry={geo} material={m.plasticoClaro} renderOrder={3} castShadow />
      {/* disolución incolora (fenolftaleína en etanol) */}
      <mesh geometry={cilindro(0.235, 0.235, 0.62, 28)} material={m.liquido('#cfe6ef')} position={[0, 0.36, 0]} />
      <Etiqueta texto={nombre} modo="plano" position={[0, 0.36, 0.272]} tamano={0.085} peso={600} color="#12202b" fondo="#ffffff" borde="#9aa6ad" />
    </group>
  );
}

/** Altura total del electrodo (u). */
export const ELECTRODO_LARGO = 1.7;
/** Electrodo de pH combinado: bulbo de vidrio sensible, cuerpo de vidrio y cabezal de plástico. */
export function ElectrodoPH(props: GroupProps) {
  const m = useMateriales();
  const perfil: P2[] = useMemo(() => [
    [0.0005, 0], [0.035, 0.015], [0.052, 0.07], [0.054, 0.13], [0.045, 0.2], [0.04, 0.26], [0.04, 1.2], [0.0005, 1.2],
  ], []);
  const geo = useMemo(() => geoCache('q7electrodo', () => tornear(perfil, 28)), [perfil]);
  return (
    <group {...props}>
      <mesh geometry={geo} material={m.vidrio} renderOrder={3} castShadow />
      {/* bulbo sensible (membrana de vidrio con electrolito) y varilla interior de plata */}
      <mesh geometry={esfera(0.043, 16)} material={m.liquido('#d9e8ee')} position={[0, 0.095, 0]} scale={[1, 1.1, 1]} />
      <mesh geometry={cilindro(0.008, 0.008, 1.0, 8)} material={m.cromo} position={[0, 0.72, 0]} />
      {/* cabezal azul con anillo y salida del cable */}
      <mesh geometry={cilindro(0.058, 0.056, 0.46, 24)} material={m.plastico('#2d6fb7', 0.45)} position={[0, 1.2 + 0.23, 0]} castShadow />
      <mesh geometry={cilindro(0.066, 0.066, 0.05, 24)} material={m.plastico('#e8ecef', 0.4)} position={[0, 1.2 + 0.02, 0]} />
      <mesh geometry={cilindro(0.03, 0.03, 0.05, 16)} material={m.plastico('#16191c', 0.5)} position={[0, ELECTRODO_LARGO + 0.01, 0]} />
    </group>
  );
}

/** Posición de la salida del cable del electrodo (coordenadas locales). */
export const ELECTRODO_CABLE: [number, number, number] = [0, ELECTRODO_LARGO + 0.04, 0];

/** pH-metro de banco: caja con frente inclinado y pantalla de 7 segmentos. Origen: centro de la base. */
export function PHmetro({ ph, ...g }: GroupProps & { ph: number }) {
  const m = useMateriales();
  const texto = ph.toFixed(2);
  const lcd = useTexturaLienzo(512, 256, (ctx, W, H) => {
    ctx.fillStyle = '#b9c7a8'; ctx.fillRect(0, 0, W, H);
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    dibujarSieteSegmentos(ctx, texto, W * 0.74, H * 0.2, H * 0.6, '#1b2119', 'rgba(27,33,25,0.06)', 0.1, 4);
    ctx.fillStyle = '#1b2119'; ctx.font = `700 ${H * 0.2}px ${familiaTexto()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('pH', W * 0.8, H * 0.78);
    ctx.font = `600 ${H * 0.1}px ${familiaTexto()}`; ctx.fillText('ATC 25.0 °C', W * 0.05, H * 0.16);
  }, [texto]);
  const ancho = 1.5, fondo = 1.0;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(ancho, 0.32, fondo, 0.05, 3)} material={m.carcasaClara} position={[0, 0.16, 0]} castShadow receiveShadow />
      {/* frente inclinado: pantalla y teclas */}
      <group position={[0, 0.33, 0.12]} rotation-x={0.5}>
        <mesh geometry={cajaRedondeada(ancho * 0.93, 0.05, 0.62, 0.02, 2)} material={m.carcasaOscura} castShadow />
        <mesh position={[0, 0.03, -0.04]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[ancho * 0.66, 0.4]} />
          <meshBasicMaterial map={lcd ?? undefined} color={lcd ? '#ffffff' : '#b9c7a8'} toneMapped={false} />
        </mesh>
      </group>
      {/* entrada BNC en el costado */}
      <mesh geometry={cilindro(0.05, 0.05, 0.1, 16)} material={m.cromo} position={[-ancho / 2 - 0.04, 0.2, -0.1]} rotation-z={Math.PI / 2} />
    </group>
  );
}
/** Posición de la entrada BNC (coordenadas locales de PHmetro). */
export const PHMETRO_BNC: [number, number, number] = [-0.83, 0.2, -0.1];
