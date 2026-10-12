"use client";

/**
 * Dogma central en 3D. Todo sale del estado del lab:
 *   · transcripción: la doble hélice (bases coloreadas según la secuencia), la ARN
 *     polimerasa abre la burbuja en la base que toca transcribir y el ARNm crece con
 *     las bases que el alumno ya apareó;
 *   · exportación: el ARNm sale del núcleo por un poro nuclear;
 *   · traducción: el ARNm se desliza por el ribosoma (subunidad mayor y menor, sitios
 *     E · P · A); el sitio A espera VACÍO el ARNt que elija el alumno; los ARNt ya
 *     usados ocupan P y E y la cadena de aminoácidos sale por la subunidad mayor;
 *     en el codón de paro, el factor de liberación suelta la proteína.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LabCanvas, EncuadrarCaja, Etiqueta } from '../_kit';
import { CODIGO_GENETICO, anticodonB3 } from '@/domain/biologia';
import {
  DobleHelice, ARNPolimerasa, HebraARNm, ARNt, Ribosoma, FactorLiberacion, CadenaPolipeptidica, EnvolturaNuclear, MarcoSitio, xBase,
} from './piezas';

interface Props {
  fase: 'transcripcion' | 'traduccion';
  adnPlantilla: string;
  arnMensajero: string;
  /** transcripción: bases ya apareadas · traducción: índice de la primera base del codón en el sitio A */
  currentIndex: number;
  proteina: { id: string; name: string; color: string }[];
  terminada: boolean;
  /** el ARNm está saliendo del núcleo por el poro (animación de ~2 s) */
  exportando: boolean;
}

const SP = 0.5;       // separación de pares de bases (hélice)
const SPR = 0.4;      // separación de bases del ARNm en el ribosoma
const DUR_EXPORT = 2.0;
const ETQ = { tamano: 0.22, fondo: '#ffffffe6' } as const;
const atenuar = (hex: string) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#8a8f98'), 0.18).getHexString();
const suave = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

// ───────────────────────────── transcripción ─────────────────────────────

function Transcripcion({ adn, arn }: { adn: string; arn: string }) {
  const n = adn.length, p = Math.min(arn.length, n);
  const w = (n - 1) * SP;
  const xp = xBase(Math.min(p, n - 1), n) + 0.25;
  return (
    <group>
      <EncuadrarCaja caja={[[-w / 2 - 1.2, -1.5, -1.2], [w / 2 + 1.2, 2.5, 1.2]]} direccion={[0, 0.1, 1]} margen={1.0} />
      <DobleHelice adn={adn} p={p} />
      {p < n && <ARNPolimerasa x={xp} />}
      <group position={[xBase(0, n), 1.75, 0]}>
        <HebraARNm arn={arn} paso={SP} radio={0.26} />
      </group>
      {p > 0 && p < n && <Line points={[[xBase(p - 1, n), 1.75, 0], [xp, 1.0, 0]]} color="#5b6470" lineWidth={3} />}
      <Etiqueta texto="ARNm  5′ → 3′" position={[xBase(0, n) - 0.2, 2.3, 0]} ancla={[0, 0.5]} {...ETQ} />
      <Etiqueta texto="ADN" position={[w / 2 + 0.7, 0, 0]} ancla={[0, 0.5]} {...ETQ} />
      <Etiqueta texto="3′" position={[-w / 2 - 0.35, -1.05, 0]} {...ETQ} />
      <Etiqueta texto="5′" position={[w / 2 + 0.35, -1.05, 0]} {...ETQ} />
      {p < n && <Etiqueta texto="ARN polimerasa" position={[xp, -1.5, 0]} {...ETQ} />}
      {p === 0 && <Etiqueta texto="hebra molde 3′ → 5′" position={[0, -1.5, 0]} {...ETQ} />}
    </group>
  );
}

// ───────────────────────────── traducción ─────────────────────────────

function Traduccion({ arn, ci, proteina, terminada, exportando }: { arn: string; ci: number; proteina: Props['proteina']; terminada: boolean; exportando: boolean }) {
  const n = arn.length;
  const xw = 2 * SPR + n * SPR + 0.55;      // posición de la envoltura nuclear durante la exportación
  const gxFinal = -(ci - 2) * SPR;           // el centro del sitio P (base ci−2) cae en x = 0
  const hebra = useRef<THREE.Group>(null);
  const ribo = useRef<THREE.Group>(null);
  const cadena = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const [fin, setFin] = useState(!exportando);
  useEffect(() => { if (exportando) { t0.current = null; setFin(false); } else setFin(true); }, [exportando]);

  useFrame(({ clock }, dt) => {
    const k = 1 - Math.exp(-dt * 8);
    let e = 1;
    if (exportando) {
      if (t0.current === null) t0.current = clock.elapsedTime;
      e = Math.min(1, (clock.elapsedTime - t0.current) / DUR_EXPORT);
    }
    if (hebra.current) {
      if (exportando) hebra.current.position.x = THREE.MathUtils.lerp(xw + 0.6, gxFinal, suave(e));
      else hebra.current.position.x += (gxFinal - hebra.current.position.x) * k;
    }
    if (ribo.current) { const s = exportando ? suave((e - 0.35) / 0.4) : 1; ribo.current.scale.setScalar(Math.max(0.001, s)); ribo.current.visible = s > 0.01; }
    if (cadena.current) {
      const dx = terminada ? -2.2 : 0, dy = terminada ? 0.9 : 0;
      cadena.current.position.x += (dx - cadena.current.position.x) * k;
      cadena.current.position.y += (dy - cadena.current.position.y) * k;
    }
  });

  const codonP = ci >= 3 ? arn.slice(ci - 3, ci) : '';
  const codonE = ci >= 6 ? arn.slice(ci - 6, ci - 3) : '';
  const colorP = codonP ? atenuar(CODIGO_GENETICO[codonP]?.color ?? '#888888') : undefined;
  const wide = exportando || !fin;
  const caja: [[number, number, number], [number, number, number]] = wide
    ? [[-3.6, -2.4, -2], [xw + 3.1, 3.8, 2]]
    : [[-4.1, -2.3, -2], [4.1, terminada ? 4.6 : 3.4, 2]];

  return (
    <group>
      <EncuadrarCaja caja={caja} direccion={[0, 0.08, 1]} margen={1.02} />
      {/* ARNm: el 5′ a la izquierda; se desliza bajo el ribosoma */}
      <group ref={hebra} position={[gxFinal, 0, 0]}>
        <HebraARNm arn={arn} paso={SPR} radio={0.16} cap />
        <Etiqueta texto="5′" position={[-SPR * 1.1, 0.42, 0]} {...ETQ} />
        <Etiqueta texto="ARNm  3′" position={[(n - 1) * SPR + 0.45, 0, 0]} ancla={[0, 0.5]} {...ETQ} />
      </group>
      <group ref={ribo}>
        <Ribosoma separacion={terminada ? 0.3 : 0} />
        {/* sitios E · P · A */}
        {[['E', -3 * SPR], ['P', 0], ['A', 3 * SPR]].map(([s, x]) => (
          <Etiqueta key={s as string} texto={s as string} position={[x as number, -1.75, 0.2]} tamano={0.22} peso={700} fondo="#ffffffe6" />
        ))}
        {!terminada && <MarcoSitio x={3 * SPR} w={3 * SPR + 0.05} />}
        {codonP && <ARNt anticodon={anticodonB3(codonP)} aaColor={colorP} position={[0, 0.36, 0]} escala={0.95} />}
        {codonE && <ARNt anticodon={anticodonB3(codonE)} position={[-3 * SPR, 0.36, 0]} escala={0.95} rotation={[0, 0, 0.12]} />}
        {terminada && <group position={[3 * SPR, 0.1, 0]}><FactorLiberacion /></group>}
        <Etiqueta texto="Subunidad mayor" position={[-2.15, 1.7, 0]} ancla={[1, 0.5]} {...ETQ} />
        <Etiqueta texto="Subunidad menor" position={[-1.85, -0.95, 0]} ancla={[1, 0.5]} {...ETQ} />
        <group ref={cadena}>
          {proteina.length > 0 && <CadenaPolipeptidica aminoacidos={proteina} origen={[0, 1.7, 0]} />}
          {terminada && proteina.length > 0 && <Etiqueta texto="Proteína liberada" position={[0, 1.45, 0]} {...ETQ} />}
        </group>
      </group>
      {wide && (
        <>
          <EnvolturaNuclear x={xw} />
          <Etiqueta texto="Núcleo" position={[xw + 1.5, 2.6, 0]} {...ETQ} />
          <Etiqueta texto="Citoplasma" position={[xw - 1.5, 2.6, 0]} {...ETQ} />
          <Etiqueta texto="Poro nuclear" position={[xw, -1.15, 0.4]} {...ETQ} />
        </>
      )}
    </group>
  );
}

export default function Sintesis3DScene({ fase, adnPlantilla, arnMensajero, currentIndex, proteina, terminada, exportando }: Props) {
  return (
    <LabCanvas fondo="pizarron" camara={{ posicion: [0, 1.2, 12], objetivo: [0, 0.4, 0], fov: 35 }} controles={{ minDistancia: 3, maxDistancia: 26, paneo: true, maxPolar: 2.6 }}>
      {fase === 'transcripcion'
        ? <Transcripcion adn={adnPlantilla} arn={arnMensajero} />
        : <Traduccion arn={arnMensajero} ci={currentIndex} proteina={proteina} terminada={terminada} exportando={exportando} />}
    </LabCanvas>
  );
}
