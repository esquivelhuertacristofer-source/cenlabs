'use client';
/**
 * fis10/piezas.tsx — piezas propias del banco del motor de CD de imanes permanentes.
 *
 * ESCALA: la del kit (1 u = 1 dm). Eje del motor a lo largo de Z, a la altura Y_EJE sobre
 * la base; el conmutador queda hacia +Z (el sentido «horario» del Piloto se mira desde ahí).
 * Estator: dos imanes en arco (con yugo de acero) que FLANQUEAN al rotor, izquierda y
 * derecha; rotor de núcleo laminado en H con el bobinado de N espiras (más espiras, más
 * capas y vueltas); conmutador de dos delgas y dos escobillas de carbón; cojinetes en dos
 * pedestales; acoplamiento elástico con cinta reflectante, freno de partículas magnéticas
 * y tacómetro óptico.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  cilindro, cajaRedondeada, toro, tuboPolilinea, geoCache, useMateriales, useTexturaLienzo, familiaTexto,
  dibujarSieteSegmentos, Etiqueta,
} from '../_kit';

export const Y_EJE = 1.25;
export const LARGO_ESTATOR = 0.9;
export const R_ROTOR = 0.52;
export const Z_PEDESTAL = 0.72;
export const Z_CONMUTADOR = 0.95;
export const R_CONMUTADOR = 0.17;
export const Z_ACOPLE = -1.2;
export const COLOR_N = '#c62828', COLOR_S = '#1565c0';

// ───────────────────────────── base ─────────────────────────────

/** Base de aluminio con patas de goma. Cara superior en y = 0,1. Origen en la mesa. */
export function BaseMotor({ largo = 4.6, ancho = 2.6, zCentro = -0.4 }: { largo?: number; ancho?: number; zCentro?: number }) {
  const m = useMateriales();
  return (
    <group position={[0, 0, zCentro]}>
      <mesh geometry={cajaRedondeada(ancho, 0.1, largo, 0.03, 2)} material={m.aluminio} position={[0, 0.07, 0]} castShadow receiveShadow />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
        <mesh key={i} geometry={cilindro(0.07, 0.08, 0.04, 14)} material={m.goma} position={[a * (ancho / 2 - 0.15), 0.02, b * (largo / 2 - 0.15)]} />
      ))}
    </group>
  );
}

// ───────────────────────────── estator: imanes en arco con yugo ─────────────────────────────

function geoSector(rIn: number, rOut: number, semiAngulo: number, largo: number, nombre: string): THREE.BufferGeometry {
  return geoCache(`fis10:sector:${nombre}:${rIn}:${rOut}:${semiAngulo}:${largo}`, () => {
    const s = new THREE.Shape();
    s.absarc(0, 0, rOut, -semiAngulo, semiAngulo, false);
    s.absarc(0, 0, rIn, semiAngulo, -semiAngulo, true);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: largo, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1, curveSegments: 28 });
    g.translate(0, 0, -largo / 2);
    return g;
  });
}

/**
 * Un lado del estator: yugo de acero en C y, dentro, el imán de ferrita con su cara polar de color
 * (rojo = N, azul = S) hacia el rotor. `lado` = −1 (izquierda) o +1 (derecha). Origen en el eje.
 */
export function ImanLateral({ lado, polo }: { lado: -1 | 1; polo: 'N' | 'S' }) {
  const m = useMateriales();
  const color = polo === 'N' ? COLOR_N : COLOR_S;
  const geoYugo = geoSector(0.78, 0.86, 0.9, LARGO_ESTATOR, 'yugo');
  const geoIman = geoSector(0.6, 0.78, 0.66, LARGO_ESTATOR, 'iman');
  const geoCara = geoSector(0.6, 0.61, 0.66, LARGO_ESTATOR + 0.004, 'cara');
  // el sector se genera mirando a +X; para el lado izquierdo se gira medio giro
  const rot: [number, number, number] = [0, 0, lado < 0 ? Math.PI : 0];
  return (
    <group position={[0, Y_EJE, 0]} rotation={rot}>
      <mesh geometry={geoYugo} material={m.pintura('#8a9096')} castShadow receiveShadow />
      <mesh geometry={geoIman} material={m.plastico('#2b2d30', 0.7)} castShadow />
      <mesh geometry={geoCara} material={m.plastico(color, 0.4)} />
    </group>
  );
}

/** Soportes de los imanes: bloques de aluminio atornillados a la base. */
export function SoporteImanes() {
  const m = useMateriales();
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cajaRedondeada(0.5, Y_EJE - 0.66 - 0.1, 0.8, 0.02, 1)} material={m.aluminio} position={[s * 0.72, 0.1 + (Y_EJE - 0.66 - 0.1) / 2, 0]} castShadow />
      ))}
    </group>
  );
}

/** Letras N / S sobre la cara polar, visibles de frente. */
export function RotulosPolos({ imanIzq, imanDer }: { imanIzq: 'N' | 'S'; imanDer: 'N' | 'S' }) {
  return (
    <>
      <Etiqueta texto={imanIzq} position={[-0.7, Y_EJE + 0.0, LARGO_ESTATOR / 2 + 0.14]} tamano={0.2} color="#ffffff" fondo={imanIzq === 'N' ? COLOR_N : COLOR_S} />
      <Etiqueta texto={imanDer} position={[0.7, Y_EJE + 0.0, LARGO_ESTATOR / 2 + 0.14]} tamano={0.2} color="#ffffff" fondo={imanDer === 'N' ? COLOR_N : COLOR_S} />
    </>
  );
}

// ───────────────────────────── rotor ─────────────────────────────

/** Bucle de alambre que rodea el alma del rotor (plano YZ), rectángulo con esquinas redondeadas. */
function geoBucle(hy: number, hz: number, grosor: number): THREE.BufferGeometry {
  return geoCache(`fis10:bucle:${hy.toFixed(3)}:${hz}:${grosor}`, () => {
    const r = 0.07, pts: number[] = [];
    const esq = (cy: number, cz: number, a0: number) => { for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * (Math.PI / 2); pts.push(0, cy + r * Math.sin(a), cz + r * Math.cos(a)); } };
    esq(hy - r, hz - r, 0);                  // arriba-delante: de +z a +y
    esq(hy - r, -(hz - r), Math.PI / 2);     // arriba-detrás
    esq(-(hy - r), -(hz - r), Math.PI);      // abajo-detrás
    esq(-(hy - r), hz - r, Math.PI * 1.5);   // abajo-delante
    pts.push(pts[0], pts[1], pts[2]);
    return tuboPolilinea(new Float32Array(pts), grosor, 6, false);
  });
}

/** Parámetros del bobinado por número de espiras (capas y vueltas por capa). */
export function formaBobinado(N: number): { capas: number; vueltas: number } {
  return N >= 100 ? { capas: 3, vueltas: 9 } : N >= 50 ? { capas: 2, vueltas: 7 } : { capas: 1, vueltas: 4 };
}

/**
 * Rotor: eje, núcleo laminado en H (dos zapatas polares unidas por el alma), bobinado y conmutador de dos
 * delgas. Origen en el eje, centrado en z; lo que gira es TODO este grupo (el padre rota su `ref`).
 */
export function RotorBobinado({ espiras }: { espiras: number }) {
  const m = useMateriales();
  const L = 0.8, hz = 0.46;
  const { capas, vueltas } = formaBobinado(espiras);
  const geoZapata = geoSector(0.34, R_ROTOR, 0.88, L, 'zapata');
  const bucles = useMemo(() => {
    const out: { x: number; hy: number }[] = [];
    for (let c = 0; c < capas; c++) for (let v = 0; v < vueltas; v++) out.push({ x: -0.27 + (0.54 * (v + 0.5)) / vueltas, hy: 0.16 + c * 0.052 });
    return out;
  }, [capas, vueltas]);
  const matCobre = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b5602a', metalness: 0.75, roughness: 0.35 }), []);
  useEffect(() => () => matCobre.dispose(), [matCobre]);
  const delga = useMemo(() => geoCache('fis10:delga', () => {
    const s = new THREE.Shape();
    s.absarc(0, 0, R_CONMUTADOR, 0.12, Math.PI - 0.12, false);
    s.absarc(0, 0, 0.06, Math.PI - 0.12, 0.12, true);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: false, curveSegments: 20 });
    return g;
  }), []);
  return (
    <group>
      {/* eje */}
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.055, 0.055, 3.4, 16)} material={m.acero} position={[0, 0, -0.5]} castShadow />
      {/* núcleo laminado en H */}
      <group>
        <mesh geometry={geoZapata} material={m.plastico('#5f656b', 0.45)} castShadow />
        <mesh geometry={geoZapata} material={m.plastico('#5f656b', 0.45)} rotation={[0, 0, Math.PI]} castShadow />
        <mesh geometry={cajaRedondeada(0.76, 0.3, L, 0.01, 1)} material={m.plastico('#5f656b', 0.45)} castShadow />
        {/* aislante de las ranuras (papel) en los extremos del alma */}
        {[-1, 1].map((s) => <mesh key={s} geometry={cajaRedondeada(0.62, 0.34, 0.03, 0.01, 1)} material={m.plastico('#d9c9a0', 0.8)} position={[0, 0, s * (L / 2 + 0.012)]} />)}
      </group>
      {/* bobinado */}
      {bucles.map((b, i) => <mesh key={i} geometry={geoBucle(b.hy, hz, 0.02)} material={matCobre} position={[b.x, 0, 0]} castShadow />)}
      {/* conmutador de dos delgas con aislante entre ellas */}
      <group position={[0, 0, Z_CONMUTADOR - 0.13]}>
        <mesh geometry={delga} material={m.cobre} castShadow />
        <mesh geometry={delga} material={m.cobre} rotation={[0, 0, Math.PI]} castShadow />
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(R_CONMUTADOR * 0.98, R_CONMUTADOR * 0.98, 0.04, 20)} material={m.plastico('#1c1c1c', 0.7)} position={[0, 0, 0.0]} />
      </group>
    </group>
  );
}

// ───────────────────────────── pedestales con cojinete ─────────────────────────────

/** Pedestal con cojinete de bolas (carcasa de aluminio, anillo exterior, anillo interior sobre el eje). */
export function PedestalCojinete({ z }: { z: number }) {
  const m = useMateriales();
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={cajaRedondeada(0.42, Y_EJE - 0.1 - 0.12, 0.2, 0.02, 1)} material={m.aluminio} position={[0, 0.1 + (Y_EJE - 0.22) / 2, 0]} castShadow />
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.2, 0.2, 0.2, 28)} material={m.aluminio} position={[0, Y_EJE, 0]} castShadow />
      <mesh geometry={toro(0.14, 0.03, 8, 28)} material={m.cromo} position={[0, Y_EJE, 0.1]} />
      <mesh geometry={toro(0.14, 0.03, 8, 28)} material={m.cromo} position={[0, Y_EJE, -0.1]} />
    </group>
  );
}

// ───────────────────────────── escobillas ─────────────────────────────

/** Anillo portaescobillas con dos escobillas de carbón (arriba y abajo) apoyadas sobre el conmutador. */
export function Escobillas() {
  const m = useMateriales();
  const portaescob = (s: 1 | -1) => (
    <group key={s} position={[0, Y_EJE + s * (R_CONMUTADOR + 0.2), Z_CONMUTADOR]}>
      <mesh geometry={cilindro(0.1, 0.1, 0.3, 14)} material={m.laton} position={[0, 0, 0]} castShadow />
      <mesh geometry={cilindro(0.045, 0.045, 0.32, 10)} material={m.plastico('#1a1a1a', 0.85)} position={[0, -s * 0.14, 0]} castShadow />
      <mesh geometry={cilindro(0.115, 0.115, 0.05, 14)} material={m.plastico('#1e2328', 0.5)} position={[0, s * 0.17, 0]} />
      <mesh geometry={cilindro(0.03, 0.03, 0.12, 8)} material={m.laton} position={[0, s * 0.26, 0]} />
    </group>
  );
  return (
    <group>
      {portaescob(1)}{portaescob(-1)}
      {/* anillo aislante que sostiene los portaescobillas, con su poste a la base */}
      <mesh geometry={toro(0.44, 0.022, 8, 40)} material={m.plastico('#c9b27a', 0.7)} position={[0, Y_EJE, Z_CONMUTADOR]} />
      <mesh geometry={cajaRedondeada(0.12, Y_EJE - 0.5 - 0.1, 0.12, 0.01, 1)} material={m.plastico('#c9b27a', 0.7)} position={[0, 0.1 + (Y_EJE - 0.6) / 2, Z_CONMUTADOR]} castShadow />
    </group>
  );
}

/** Posiciones (mundo) de las bornas de las escobillas: [positiva (arriba), negativa (abajo)]. */
export function bornasEscobillas(): [[number, number, number], [number, number, number]] {
  const y = R_CONMUTADOR + 0.2 + 0.26 + 0.07;
  return [[0, Y_EJE + y, Z_CONMUTADOR], [0, Y_EJE - y, Z_CONMUTADOR]];
}

// ───────────────────────────── acoplamiento y freno ─────────────────────────────

/** Acoplamiento elástico de garras (cubos de aluminio y araña roja) con cinta retrorreflectante. Origen en el eje, centro del acople. */
export function Acoplamiento() {
  const m = useMateriales();
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh geometry={cilindro(0.17, 0.17, 0.2, 28)} material={m.aluminio} position={[0, 0.17, 0]} castShadow />
      <mesh geometry={cilindro(0.17, 0.17, 0.2, 28)} material={m.aluminio} position={[0, -0.17, 0]} castShadow />
      <mesh geometry={cilindro(0.15, 0.15, 0.14, 24)} material={m.plastico('#d8402f', 0.6)} castShadow />
      {/* cinta retrorreflectante para el tacómetro óptico */}
      <mesh geometry={cilindro(0.172, 0.172, 0.12, 28, true)} material={m.cromo} position={[0, 0.17, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]} />
    </group>
  );
}

/** Freno de partículas magnéticas (carga del motor): cuerpo con aletas, brida y base. Eje a lo largo de Z; origen en el eje, centro. */
export function FrenoCarga() {
  const m = useMateriales();
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.5, 0.5, 0.9, 40)} material={m.pintura('#3a5d7a')} castShadow receiveShadow />
      {[-0.3, -0.1, 0.1, 0.3].map((z) => (
        <mesh key={z} rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.55, 0.55, 0.045, 40)} material={m.pintura('#3a5d7a')} position={[0, 0, z]} castShadow />
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.3, 0.3, 0.06, 28)} material={m.aluminio} position={[0, 0, 0.48]} castShadow />
      {/* caja de conexión */}
      <mesh geometry={cajaRedondeada(0.32, 0.22, 0.32, 0.03, 1)} material={m.carcasaOscura} position={[0, 0.58, 0.05]} castShadow />
      {/* pie sobre la base */}
      <mesh geometry={cajaRedondeada(0.9, Y_EJE - 0.1 - 0.5 + 0.02, 0.6, 0.02, 1)} material={m.aluminio} position={[0, -(Y_EJE - 0.1 + 0.5) / 2 + 0.01, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── tacómetro óptico ─────────────────────────────

/** Tacómetro óptico sobre peana: cabezal que apunta (−X) a la cinta del acople y pantalla LCD. Origen en la mesa. */
export function TacometroOptico({ rpm }: { rpm: number }) {
  const m = useMateriales();
  const ALTO = Y_EJE - 0.12;   // el eje, medido desde la cara superior de la base
  const texto = String(Math.round(Math.abs(rpm)));
  const lcd = useTexturaLienzo(320, 140, (ctx, w, h) => {
    ctx.fillStyle = '#c3cbb6'; ctx.fillRect(0, 0, w, h);
    dibujarSieteSegmentos(ctx, texto, w * 0.78, h * 0.2, h * 0.56, '#1a1f18', 'rgba(26,31,24,0.07)', 0.08, 4);
    ctx.fillStyle = '#1a1f18'; ctx.font = `700 ${h * 0.17}px ${familiaTexto()}`; ctx.textAlign = 'left'; ctx.fillText('rpm', w * 0.8, h * 0.8);
  }, [texto]);
  const matLcd = useMemo(() => new THREE.MeshBasicMaterial({ map: lcd, toneMapped: false }), [lcd]);
  useEffect(() => () => matLcd.dispose(), [matLcd]);
  return (
    <group>
      <mesh geometry={cajaRedondeada(0.9, 0.08, 0.9, 0.03, 1)} material={m.hierroPintado} position={[0, 0.04, 0]} castShadow />
      <mesh geometry={cilindro(0.04, 0.04, ALTO - 0.08, 12)} material={m.acero} position={[0, 0.08 + (ALTO - 0.08) / 2, 0]} castShadow />
      {/* cabezal */}
      <group position={[0, ALTO, 0]}>
        <mesh geometry={cajaRedondeada(0.5, 0.3, 0.3, 0.05, 2)} material={m.carcasaOscura} position={[0, 0, 0]} castShadow />
        <mesh rotation={[0, 0, Math.PI / 2]} geometry={cilindro(0.08, 0.1, 0.12, 16)} material={m.plastico('#111', 0.3)} position={[-0.31, 0, 0]} />
        <mesh geometry={cilindro(0.04, 0.04, 0.02, 12)} material={m.emisor('#ff2a1a', 2)} rotation={[0, 0, Math.PI / 2]} position={[-0.375, 0, 0]} />
      </group>
      {/* pantalla */}
      <group position={[0.1, ALTO + 0.7, 0.1]} rotation={[-0.15, -0.25, 0]}>
        <mesh geometry={cajaRedondeada(1.15, 0.58, 0.14, 0.04, 2)} material={m.carcasaOscura} castShadow />
        <mesh material={matLcd} position={[0, 0, 0.075]}><planeGeometry args={[1.0, 0.44]} /></mesh>
      </group>
      <mesh geometry={cilindro(0.025, 0.025, 0.4, 8)} material={m.acero} position={[0.1, ALTO + 0.4, 0.05]} />
    </group>
  );
}
