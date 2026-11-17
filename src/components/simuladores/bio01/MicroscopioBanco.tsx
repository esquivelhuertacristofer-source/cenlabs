'use client';
/**
 * bio01/MicroscopioBanco.tsx — el microscopio óptico compuesto, a escala de banco
 * (1 u = 1 dm; el eje óptico pasa por x = 0, z = 0; el alumno está hacia +Z).
 *
 * Todo lo que se mueve es ESTADO real del lab:
 *   · revólver: gira hasta dejar sobre el eje el objetivo elegido (4x rojo, 10x
 *     amarillo, 40x azul, 100x blanco con anillo negro de inmersión);
 *   · platina: sube con el tornillo de enfoque (macro + micro) y la preparación se
 *     desliza con los mandos X/Y;
 *   · lámpara: el reóstato gira y la ventana de la base brilla según la iluminación;
 *   · condensador: la palanca del diafragma de apertura gira con su mando;
 *   · aceite de inmersión: la gota sobre el cubreobjetos, bajo el objetivo de 100x.
 * Sin rótulos ni cifras dentro del 3D: los datos van en el panel del DOM.
 * No se dibuja el plano focal ideal (es la respuesta): la altura de la platina sólo
 * refleja los tornillos, como en un instrumento real.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, useMateriales, cajaRedondeada, cilindro, geoCache, sanearNormales } from '../_kit';
import type { MuestraB1 } from '@/store/types';

interface Props {
  caso: MuestraB1;
  objetivoMag: number;
  enfoqueMacro: number;
  enfoqueMicro: number;
  enfoqueZ: number;
  posicionX: number;
  posicionY: number;
  iluminacion: number;
  /** diafragma del condensador (0,2..1) */
  apertura: number;
  aceite: boolean;
}

const OBJETIVOS = [
  { mag: 4, largo: 0.7, banda: '#c62828' },
  { mag: 10, largo: 0.78, banda: '#f2c200' },
  { mag: 40, largo: 0.86, banda: '#1e5fb3' },
  { mag: 100, largo: 0.9, banda: '#f1f1ee' },
] as const;
const Y_REVOLVER = 2.0;
const Z_REVOLVER = -0.34;
const R_REVOLVER = 0.34;
/** Color de la preparación vista a simple vista sobre el portaobjetos. */
const COLOR_PREPARACION: Record<MuestraB1, string> = {
  estanque: '#a9b58a', sangre: '#c98a92', gram: '#b98acb', mitosis: '#9a8fcf', cebolla: '#d9b45a', estomas: '#c56aa8',
};

function brazo(): THREE.BufferGeometry {
  return geoCache('bio01:brazo', () => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, -0.95), new THREE.Vector3(0, 0.9, -1.08), new THREE.Vector3(0, 1.6, -1.06),
      new THREE.Vector3(0, 2.15, -0.86), new THREE.Vector3(0, 2.38, -0.5),
    ]);
    return sanearNormales(new THREE.TubeGeometry(c, 48, 0.2, 14, false));
  });
}

function Perilla({ radio, ancho, rot, material, nervaduras = 14 }: { radio: number; ancho: number; rot: number; material: THREE.Material; nervaduras?: number }) {
  const m = useMateriales();
  return (
    <group rotation={[rot, 0, 0]}>
      <mesh geometry={cilindro(radio, radio, ancho, 32)} material={material} rotation={[0, 0, Math.PI / 2]} castShadow />
      {Array.from({ length: nervaduras }).map((_, i) => {
        const a = (i / nervaduras) * Math.PI * 2;
        return <mesh key={i} position={[0, Math.cos(a) * radio, Math.sin(a) * radio]} rotation={[a, 0, 0]} geometry={geoCache('bio01:nerv', () => new THREE.BoxGeometry(1, 1, 1))} scale={[ancho * 0.96, radio * 0.12, radio * 0.2]} material={m.goma} />;
      })}
      <mesh geometry={cilindro(radio * 0.55, radio * 0.55, ancho + 0.012, 24)} material={m.cromo} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
}

function Objetivo({ largo, banda, muestra100 }: { largo: number; banda: string; muestra100: boolean }) {
  const m = useMateriales();
  const bandaMat = useMemo(() => m.plastico(banda, 0.4), [m, banda]);
  return (
    <group>
      {/* cuerpo cónico cromado y anillo de color */}
      <mesh geometry={cilindro(0.12, 0.085, largo * 0.72, 28)} material={m.acero} position={[0, -largo * 0.36, 0]} castShadow />
      <mesh geometry={cilindro(0.128, 0.128, 0.06, 28)} material={bandaMat} position={[0, -0.09, 0]} />
      <mesh geometry={cilindro(0.085, 0.052, largo * 0.28, 24)} material={m.cromo} position={[0, -largo * 0.86, 0]} />
      {muestra100 && <mesh geometry={cilindro(0.088, 0.088, 0.025, 24)} material={m.goma} position={[0, -largo * 0.66, 0]} />}
      <mesh geometry={cilindro(0.04, 0.04, 0.012, 20)} material={m.vidrio} position={[0, -largo - 0.004, 0]} />
    </group>
  );
}

function Escena({ caso, objetivoMag, enfoqueMacro, enfoqueMicro, enfoqueZ, posicionX, posicionY, iluminacion, apertura, aceite }: Props) {
  const m = useMateriales();
  const revolver = useRef<THREE.Group>(null);
  const platina = useRef<THREE.Group>(null);
  const portaobjetos = useRef<THREE.Group>(null);
  const idx = Math.max(0, OBJETIVOS.findIndex((o) => o.mag === objetivoMag));
  const yPlatina = 0.45 + (Math.min(Math.max(enfoqueZ, 0), 110) / 110) * 0.5;

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 9);
    if (revolver.current) {
      const objetivo = -idx * (Math.PI / 2);
      let d = objetivo - revolver.current.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      revolver.current.rotation.y += d * k;
    }
    if (platina.current) platina.current.position.y += (yPlatina - platina.current.position.y) * k;
    if (portaobjetos.current) {
      portaobjetos.current.position.x += ((posicionX / 1200) * 0.3 - portaobjetos.current.position.x) * k;
      portaobjetos.current.position.z += ((posicionY / 1200) * 0.22 - portaobjetos.current.position.z) * k;
    }
  });

  const brillo = 0.15 + (iluminacion / 100) * 2.4;
  const ventana = useMemo(() => m.emisor('#fff1cf', brillo), [m, brillo]);
  const pintura = useMemo(() => m.pintura('#cdd4da'), [m]);
  const matPrep = useMemo(() => m.plastico(COLOR_PREPARACION[caso], 0.6), [m, caso]);
  const gota = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e0a73c', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, transmission: m.calidad === 'alta' ? 0.6 : 0, thickness: 0.05, ior: 1.515, transparent: m.calidad !== 'alta', opacity: 0.85 }), [m]);
  useEffect(() => () => { gota.dispose(); }, [gota]);

  const pie = useMemo(() => cajaRedondeada(2.1, 0.28, 2.5, 0.09, 4), []);
  const bloque = useMemo(() => cajaRedondeada(0.86, 0.6, 0.78, 0.1, 4), []);

  return (
    <group>
      {/* ── base y brazo ── */}
      <mesh geometry={pie} material={pintura} position={[0, 0.14, -0.2]} castShadow receiveShadow />
      <mesh geometry={brazo()} material={pintura} castShadow />
      {/* ventana de la lámpara + condensador */}
      <mesh geometry={cilindro(0.26, 0.26, 0.012, 32)} material={ventana} position={[0, 0.286, 0]} />
      <mesh geometry={cilindro(0.2, 0.3, 0.14, 32)} material={m.cromo} position={[0, 0.35, 0]} castShadow />
      <mesh geometry={cilindro(0.19, 0.19, 0.014, 32)} material={m.vidrio} position={[0, 0.425, 0]} />
      {/* diafragma de apertura: anillo moleteado y palanca que gira con el mando */}
      <mesh geometry={cilindro(0.315, 0.315, 0.035, 36)} material={m.carcasaOscura} position={[0, 0.315, 0]} />
      <group position={[0, 0.315, 0]} rotation={[0, 0.5 + (1 - apertura) * 1.5, 0]}>
        <mesh geometry={cajaRedondeada(0.03, 0.022, 0.2, 0.008, 2)} material={m.cromo} position={[0, 0, 0.4]} />
        <mesh material={m.goma} position={[0, 0, 0.5]}><sphereGeometry args={[0.03, 14, 10]} /></mesh>
      </group>
      {/* reóstato */}
      <group position={[0.62, 0.28, 0.82]}>
        <mesh geometry={cilindro(0.17, 0.17, 0.07, 28)} material={m.carcasaOscura} position={[0, 0.035, 0]} castShadow />
        <group rotation={[0, -(iluminacion / 100) * Math.PI * 1.5 + Math.PI * 0.75, 0]}>
          <mesh geometry={geoCache('bio01:caja', () => new THREE.BoxGeometry(1, 1, 1))} material={m.plastico('#f4f4f2', 0.4)} position={[0, 0.074, 0.1]} scale={[0.025, 0.008, 0.11]} />
        </group>
      </group>

      {/* ── platina con el tornillo de enfoque ── */}
      <group ref={platina} position={[0, yPlatina, 0]}>
        <mesh geometry={cajaRedondeada(1.6, 0.07, 1.5, 0.03, 3)} material={m.carcasaOscura} position={[0, -0.035, 0.05]} castShadow receiveShadow />
        {/* cremallera que une la platina con el brazo */}
        <mesh geometry={cajaRedondeada(0.5, 0.2, 0.36, 0.03, 2)} material={pintura} position={[0, -0.17, -0.82]} />
        <mesh geometry={cajaRedondeada(0.34, 0.55, 0.14, 0.02, 2)} material={m.cromo} position={[0, -0.3, -0.92]} />
        {/* abertura iluminada */}
        <mesh geometry={cilindro(0.28, 0.28, 0.004, 32)} material={ventana} position={[0, 0.001, 0]} />
        {/* pinzas de la platina */}
        <mesh geometry={cajaRedondeada(0.07, 0.03, 0.34, 0.01, 2)} material={m.acero} position={[-0.52, 0.03, 0.18]} />
        <mesh geometry={cajaRedondeada(0.07, 0.03, 0.34, 0.01, 2)} material={m.acero} position={[0.52, 0.03, 0.18]} />
        {/* porta y cubreobjetos con la preparación */}
        <group ref={portaobjetos} position={[0, 0, 0]}>
          <mesh geometry={cajaRedondeada(0.76, 0.013, 0.26, 0.004, 2)} material={m.vidrio} position={[0, 0.0065, 0]} />
          <mesh geometry={cajaRedondeada(0.15, 0.0145, 0.26, 0.003, 2)} material={m.plastico('#e8ecef', 0.7)} position={[-0.305, 0.0072, 0]} />
          <mesh geometry={cilindro(0.085, 0.085, 0.004, 28)} material={matPrep} position={[0, 0.0148, 0]} scale={[1.2, 1, 0.7]} />
          <mesh geometry={cajaRedondeada(0.22, 0.003, 0.22, 0.001, 1)} material={m.vidrio} position={[0, 0.0175, 0]} />
          {aceite && (
            <mesh material={gota} position={[0, 0.03, 0]} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[0.075, 28, 18]} />
            </mesh>
          )}
        </group>
      </group>

      {/* ── cabezal, revólver y oculares ── */}
      <mesh geometry={bloque} material={pintura} position={[0, 2.38, Z_REVOLVER]} castShadow />
      <group position={[0, Y_REVOLVER, Z_REVOLVER]}>
        <mesh geometry={cilindro(0.5, 0.42, 0.14, 40)} material={m.acero} position={[0, 0.0, 0]} castShadow />
        <group ref={revolver}>
          {OBJETIVOS.map((o, i) => {
            const a = i * (Math.PI / 2);
            return (
              <group key={o.mag} position={[Math.sin(a) * R_REVOLVER, -0.07, Math.cos(a) * R_REVOLVER]} rotation={[0, a, 0]}>
                <Objetivo largo={o.largo} banda={o.banda} muestra100={o.mag === 100} />
              </group>
            );
          })}
        </group>
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.2, 2.66, Z_REVOLVER]} rotation={[0.52, 0, -s * 0.12]}>
          <mesh geometry={cilindro(0.13, 0.15, 0.62, 28)} material={pintura} position={[0, 0.31, 0]} castShadow />
          <mesh geometry={cilindro(0.1, 0.1, 0.34, 28)} material={m.cromo} position={[0, 0.76, 0]} castShadow />
          <mesh geometry={cilindro(0.125, 0.125, 0.07, 28)} material={m.goma} position={[0, 0.96, 0]} />
        </group>
      ))}

      {/* ── tornillos macro y micrométrico (a ambos lados del brazo) ── */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.38, 0.95, -1.0]}>
          <group position={[s * 0.1, 0, 0]}><Perilla radio={0.27} ancho={0.16} rot={(enfoqueMacro / 100) * Math.PI * 6} material={m.carcasaOscura} /></group>
          <group position={[s * 0.27, 0, 0]}><Perilla radio={0.15} ancho={0.12} rot={(enfoqueMicro / 10) * Math.PI * 2} material={m.carcasaClara} nervaduras={10} /></group>
        </group>
      ))}

    </group>
  );
}

export default function MicroscopioBanco(props: Props) {
  return (
    <LabCanvas
      fondo="laboratorio"
      mesa={{ ancho: 9, fondo: 5 }}
      camara={{ posicion: [3.0, 2.7, 8.4], objetivo: [0, 1.75, -0.2], fov: 40 }}
      controles={{ minDistancia: 3.5, maxDistancia: 11, maxPolar: 1.5, paneo: false }}
    >
      <Escena {...props} />
    </LabCanvas>
  );
}
