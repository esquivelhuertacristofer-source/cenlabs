"use client";

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  LabCanvas, EncuadrarCaja, FuenteBanco, MultimetroDigital, Cable, Etiqueta, cilindro, useMateriales,
} from '../_kit';
import {
  S, ESPESOR, colX, filaZ, Protoboard, LedRojo5mm, ResistorAxial, PuenteAlambre, ZonaClic,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   Ohm3DScene — LED con resistencia limitadora sobre un protoboard (1 u = 1 dm).

   Montaje: protoboard de 400 puntos (agrandado ×6: 1 mm = 0,06 u), LED rojo de 5 mm y
   resistor axial de 5 bandas con el código de colores de SU valor, fuente de banco (a la
   izquierda) y multímetro en modo mA con las puntas sobre el protoboard (a la derecha).

   Circuito en serie:  fuente (+) → col. 11 → [multímetro: puntas en col. 11 y 15] →
   resistor (col. 15 a 19) → LED (ánodo col. 19, cátodo col. 20) → fuente (−).
   En el módulo 01 un puente de alambre ocupa el lugar del resistor.

   Cada pieza se conecta con un clic: la pieza «suelta» yace en la mesa y al conectarla
   viaja a sus agujeros. La corriente que muestra el multímetro y el brillo del LED vienen
   de la misma cifra que el Piloto (dominio `corrienteLed`); no se rotula ninguna R.
──────────────────────────────────────────────────────────────────────────── */

export interface OhmSceneProps {
  nivel: number;
  voltaje: number;
  resistencia: number;
  switchOn: boolean;
  ledRoto: boolean;
  /** Corriente del lazo (mA) calculada por el Piloto con el dominio. */
  corrienteMA: number;
  bateriaConectada: boolean;
  resistenciaConectada: boolean;
  ledConectado: boolean;
  onToggleConexion: (c: 'bateria' | 'resistencia' | 'led') => void;
}

// ───────────────────────────── geometría del montaje ─────────────────────────────

const BX = 0, BZ = 1.7;                 // centro del protoboard (u)
const TOPE = ESPESOR * S;               // altura de la cara superior del protoboard
const ESC_INST = 1.5;                   // escala de la fuente y del multímetro (agrandados)
const POS_FUENTE: [number, number, number] = [-3.7, 0, -1.9];
const POS_DMM: [number, number, number] = [3.9, 0, -1.1];
const COL = { rojo: 11, probaNegra: 15, resistorDer: 19, ledAnodo: 19, ledCatodo: 20 };

type V3 = [number, number, number];
/** punto del mundo sobre el agujero (col, fila) a h mm sobre la cara superior */
const agujero = (c: number, fila: string, h = 0): V3 => [BX + S * colX(c), TOPE + S * h, BZ + S * filaZ(fila)];

function bornaFuente(x: number): V3 {
  return [POS_FUENTE[0] + ESC_INST * x, POS_FUENTE[1] + ESC_INST * 0.221, POS_FUENTE[2] + ESC_INST * 1.42];
}
const BORNA_MAS = bornaFuente(0.228), BORNA_MENOS = bornaFuente(0.722);

/** Clavija de banana/jumper que entra en el agujero: cuerpo de color con pasador. Coordenadas mm. */
function Clavija({ color }: { color: string }) {
  const m = useMateriales();
  return (
    <group>
      <mesh geometry={cilindro(0.35, 0.35, 12, 8)} material={m.cromo} position={[0, 0, 0]} />
      <mesh geometry={cilindro(1.9, 1.9, 8, 14)} material={m.plastico(color, 0.45)} position={[0, 9, 0]} castShadow />
    </group>
  );
}

/**
 * Pieza con dos poses (suelta en la mesa / insertada). Al cambiar `activa` viaja con un pequeño
 * arco; en el primer render ya está en su sitio.
 */
function Movil({ suelta, puesta, activa, onClick, children }: {
  suelta: { p: V3; rz?: number }; puesta: { p: V3; rz?: number }; activa: boolean; onClick?: () => void; children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const u = useRef(activa ? 1 : 0);
  useFrame((_, dt) => {
    const gr = g.current; if (!gr) return;
    const objetivo = activa ? 1 : 0;
    u.current += (objetivo - u.current) * Math.min(1, dt * 6);
    if (Math.abs(objetivo - u.current) < 0.002) u.current = objetivo;
    const k = u.current, hop = Math.sin(Math.PI * k) * 0.5;
    gr.position.set(
      suelta.p[0] + (puesta.p[0] - suelta.p[0]) * k,
      suelta.p[1] + (puesta.p[1] - suelta.p[1]) * k + hop,
      suelta.p[2] + (puesta.p[2] - suelta.p[2]) * k,
    );
    gr.rotation.z = (suelta.rz ?? 0) * (1 - k) + (puesta.rz ?? 0) * k;
  });
  const over = (e: { stopPropagation: () => void }, on: boolean) => { e.stopPropagation(); document.body.style.cursor = on ? 'pointer' : 'auto'; };
  return (
    <group ref={g} scale={S}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? (e) => over(e, true) : undefined}
      onPointerOut={onClick ? (e) => over(e, false) : undefined}>
      {children}
      <ZonaClic radio={9} position={[0, 4, 0]} />
    </group>
  );
}

function Escena(p: OhmSceneProps) {
  const { nivel, voltaje, resistencia, switchOn, ledRoto, corrienteMA, bateriaConectada, resistenciaConectada, ledConectado, onToggleConexion } = p;
  const conR = nivel >= 2;
  const fluye = switchOn && !ledRoto && bateriaConectada && ledConectado && (!conR || resistenciaConectada) && corrienteMA > 0.01;
  const brillo = fluye ? Math.min(1, Math.pow(corrienteMA / 20, 0.6)) : 0;
  const lectura = fluye ? corrienteMA : 0;

  // ── poses ──
  const rSuelta = { p: [BX - 1.3, 8 * S, BZ + 2.9] as V3, rz: 0 };
  const rPuesta = { p: agujero((COL.probaNegra + COL.resistorDer) / 2, 'e'), rz: 0 };
  // LED acostado sobre su costado: sus patas apuntan hacia −X
  const ledSuelto = { p: [BX + 1.3, 2.9 * S, BZ + 2.9] as V3, rz: -Math.PI / 2 };
  const ledPuesto = { p: agujero(COL.ledAnodo + 0.5, 'c'), rz: 0 };

  // ── cables de la fuente: a los agujeros (conectada) o sueltos sobre la mesa ──
  const clavijaRoja = agujero(COL.rojo, 'a');
  const clavijaNegra = agujero(COL.ledCatodo, 'a');
  const sueltaRoja: V3 = [BX - 3.3, 0.07, BZ - 0.9], sueltaNegra: V3 = [BX - 3.0, 0.07, BZ - 0.4];
  const topeClavija = (v: V3): V3 => [v[0], v[1] + 14 * S, v[2]];
  const cabRoja = bateriaConectada ? topeClavija(clavijaRoja) : [sueltaRoja[0] + 0.5, sueltaRoja[1], sueltaRoja[2]] as V3;
  const cabNegra = bateriaConectada ? topeClavija(clavijaNegra) : [sueltaNegra[0] + 0.5, sueltaNegra[1], sueltaNegra[2]] as V3;

  // ── multímetro: sus puntas descansan sobre los agujeros (coordenadas LOCALES, sin rotar) ──
  const loc = (w: V3): V3 => [(w[0] - POS_DMM[0]) / ESC_INST, (w[1] - POS_DMM[1]) / ESC_INST, (w[2] - POS_DMM[2]) / ESC_INST];
  const puntaRoja = loc(agujero(COL.rojo, 'c', 0.2)), puntaNegra = loc(agujero(COL.probaNegra, 'c', 0.2));
  const dirRoja: V3 = [0.35, -0.85, -0.2], dirNegra: V3 = [0.6, -0.8, -0.25];

  const caja = useMemo<[V3, V3]>(() => [[-5.0, 0, -2.8], [4.7, 3.2, 4.6]], []);

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.0} direccion={[0.0, 0.62, 1]} />

      {/* fuente de banco: un clic conecta o suelta sus cables */}
      <group position={POS_FUENTE} scale={ESC_INST}
        onClick={(e) => { e.stopPropagation(); onToggleConexion('bateria'); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
        <FuenteBanco voltaje={voltaje} corriente={fluye ? corrienteMA / 1000 : 0} encendida limitando={false} />
      </group>
      <Cable desde={BORNA_MAS} hasta={cabRoja} holgura={0.5} grosor={0.05} color="#c62828" ySuelo={0} />
      <Cable desde={BORNA_MENOS} hasta={cabNegra} holgura={0.5} grosor={0.05} color="#1d1f22" ySuelo={0} />

      {/* clavijas de los cables: en el protoboard o tiradas en la mesa */}
      {bateriaConectada ? (
        <>
          <group position={clavijaRoja} scale={S}><Clavija color="#c62828" /></group>
          <group position={clavijaNegra} scale={S}><Clavija color="#1d1f22" /></group>
        </>
      ) : (
        <>
          <group position={sueltaRoja} scale={S} rotation={[0, 0, -Math.PI / 2]}><Clavija color="#c62828" /></group>
          <group position={sueltaNegra} scale={S} rotation={[0, 0, -Math.PI / 2]}><Clavija color="#1d1f22" /></group>
        </>
      )}

      {/* protoboard y sus piezas */}
      <group position={[BX, TOPE, BZ]} scale={S}><Protoboard /></group>
      {!conR && (
        <group position={agujero((COL.probaNegra + COL.resistorDer) / 2, 'a')} scale={S}>
          <PuenteAlambre largo={(COL.resistorDer - COL.probaNegra) * 2.54} />
        </group>
      )}
      {conR && (
        <Movil suelta={rSuelta} puesta={rPuesta} activa={resistenciaConectada} onClick={() => onToggleConexion('resistencia')}>
          <ResistorAxial ohm={resistencia} />
        </Movil>
      )}
      <Movil suelta={ledSuelto} puesta={ledPuesto} activa={ledConectado} onClick={() => onToggleConexion('led')}>
        <LedRojo5mm brillo={brillo} roto={ledRoto} />
      </Movil>
      {brillo > 0.02 && ledConectado && (
        <pointLight position={[ledPuesto.p[0], ledPuesto.p[1] + 0.6, ledPuesto.p[2] + 0.2]} color="#ff3b2a" intensity={0.7 * brillo} distance={2.2} decay={2} />
      )}

      {/* multímetro en mA con las puntas en el protoboard */}
      <MultimetroDigital position={POS_DMM} scale={ESC_INST} modo="mA" unidad="mA" lectura={lectura} decimales={1}
        puntaRoja={puntaRoja} puntaNegra={puntaNegra} direccionRoja={dirRoja} direccionNegra={dirNegra} inclinacion={0.28} />

      <Etiqueta texto="Fuente de CD" position={[POS_FUENTE[0], 0.1, POS_FUENTE[2] + 3.6]} tamano={0.17} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Multímetro (mA)" position={[POS_DMM[0], 0.1, POS_DMM[2] + 1.6]} tamano={0.17} color="#142330" fondo="rgba(255,255,255,0.85)" />
      <Etiqueta texto="Protoboard" position={[BX, 0.1, BZ + 1.95]} tamano={0.17} color="#142330" fondo="rgba(255,255,255,0.85)" />
    </>
  );
}

export default function Ohm3DScene(props: OhmSceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="laboratorio"
        camara={{ posicion: [0, 6, 11], objetivo: [0, 0.6, 1], fov: 35 }}
        controles={{ minDistancia: 2.5, maxDistancia: 24, maxPolar: 1.45, cajaObjetivo: [[-6, 0, -4], [6, 3, 6]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
