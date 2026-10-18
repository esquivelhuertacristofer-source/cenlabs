'use client';
/**
 * fis10/piezas.tsx — las piezas del banco del motor (1 u = 1 cm), sin lógica de simulación.
 *
 *  · Estator: yugo de acero pintado con una ventana en el cuadrante superior derecho (detrás
 *    de la franja del corte) y dos imanes en arco de 100°, niquelados; en el corte, rayados y
 *    teñidos con su polo (N rojo, S azul).
 *  · Inducido (gira): paquete de chapa con 4 ranuras, forro de Nomex, haces de cobre de las
 *    dos bobinas (sección hilo a hilo), cabezas de bobina, salidas a las delgas, eje, colector
 *    de 4 delgas con mica, acople elástico con su cinta reflectante y el rotor del freno.
 *  · Escudo trasero con rodamiento, anillo portaescobillas, escobillas de carbón en latón,
 *    tacómetro óptico, freno de partículas, placa base, batería, regulador y cables.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { cajaRedondeada, cilindro, esfera } from '../_kit';
import {
  COTA, sectorAnular, formaInducido, contornoRanura, haz, plano, extruirZ, ladoBobina, recorridoCabeza,
  recorridoSalida, radioHaz, tubo, formaSilla, perfilFreno, suavizar,
} from './geometria';
import type { MatsMotor } from './materiales';
import type { Polo } from '@/domain/fisica';

type V3 = [number, number, number];
const GRAD = Math.PI / 180;

/** Malla con sombras (la mayoría de las piezas). */
function M({ g, m, p, r, s, sombra = false, pieza, ...resto }: {
  g: THREE.BufferGeometry; m: THREE.Material | THREE.Material[]; p?: V3; r?: V3; s?: V3; sombra?: boolean; pieza?: string;
} & Record<string, unknown>) {
  return <mesh geometry={g} material={m} position={p} rotation={r} scale={s} castShadow={sombra} receiveShadow userData={pieza ? { pieza } : undefined} {...resto} />;
}

/** Geometría que se libera al cambiar. */
function useGeo<T extends THREE.BufferGeometry>(crear: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const g = useMemo(crear, deps);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

/** Cilindro a lo largo de Z entre z0 y z1. */
function cilZ(r: number, z0: number, z1: number, segs = 48, abierto = false) {
  const g = cilindro(r, r, Math.abs(z1 - z0), segs, abierto).clone();
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, (z0 + z1) / 2);
  return g;
}

// ───────────────────────────── estator ─────────────────────────────

export function Estator({ mats, izq, der }: { mats: MatsMotor; izq: Polo; der: Polo }) {
  const { Rr, Rm, Ry, Ro, alfa, zPaquete, zVentana, zYugo } = COTA;
  void Rr;
  // yugo: franja delantera entera + resto con la ventana del cuadrante 0°–90°
  const yugoFrente = useGeo(() => sectorAnular({ r0: Ry, r1: Ro, a0: 0, a1: Math.PI * 2, z0: zVentana, z1: 0, corte: { frente: true, fondo: true } }), []);
  const yugoResto = useGeo(() => sectorAnular({ r0: Ry, r1: Ro, a0: Math.PI / 2, a1: Math.PI * 2, z0: zYugo, z1: zVentana, caras: { frente: false }, corte: { lados: true, fondo: false } }), []);
  // imanes: derecho (−α…α, sin su mitad superior detrás de la franja) e izquierdo (π−α…π+α)
  const imanDerF = useGeo(() => sectorAnular({ r0: Rm, r1: Ry, a0: -alfa, a1: alfa, z0: zVentana, z1: 0, segs: 40, corte: { frente: true, lados: false, fondo: true } }), []);
  const imanDerR = useGeo(() => sectorAnular({ r0: Rm, r1: Ry, a0: -alfa, a1: 0, z0: zPaquete, z1: zVentana, segs: 24, caras: { frente: false }, corte: { lados: [false, true] } }), []);
  const imanIzq = useGeo(() => sectorAnular({ r0: Rm, r1: Ry, a0: Math.PI - alfa, a1: Math.PI + alfa, z0: zPaquete, z1: 0, segs: 40, corte: { frente: true, lados: false } }), []);
  const corteDe = (p: Polo) => (p === 'N' ? mats.imanCorteN : mats.imanCorteS);
  const mY = [mats.yugo, mats.yugoCorte, mats.yugoInterior];
  return (
    <group>
      <group userData={{ pieza: 'yugo' }}>
        <M g={yugoFrente} m={mY} sombra />
        <M g={yugoResto} m={mY} sombra />
      </group>
      <group userData={{ pieza: 'iman', lado: 'der', polo: der }}>
        <M g={imanDerF} m={[mats.iman, corteDe(der), mats.iman]} />
        <M g={imanDerR} m={[mats.iman, corteDe(der), mats.iman]} />
      </group>
      <group userData={{ pieza: 'iman', lado: 'izq', polo: izq }}>
        <M g={imanIzq} m={[mats.iman, corteDe(izq), mats.iman]} />
      </group>
    </group>
  );
}

// ───────────────────────────── inducido (gira) ─────────────────────────────

/** Ángulos de las ranuras en el marco del rotor; bobina A = 0° y 180°, B = 90° y 270°. */
export const RANURAS = [0, 90, 180, 270].map((a) => a * GRAD);
export const BOBINA_DE_RANURA = [0, 1, 0, 1] as const;

export function Inducido({ mats, N, corriente }: {
  mats: MatsMotor; N: number;
  /** materiales de los trazos de corriente de cada bobina (los anima la escena) */
  corriente: [THREE.ShaderMaterial, THREE.ShaderMaterial];
}) {
  const { zPaquete, rEje, zColector, rColector, zAcople, rAcople, zCinta, zFreno } = COTA;
  const chapa = useGeo(() => extruirZ(formaInducido(), zPaquete, 0, 64), []);
  const chapaCorte = useGeo(() => {
    const g = new THREE.ShapeGeometry(formaInducido(), 64);
    return g;
  }, []);
  // ranuras: forro (Nomex), hueco y haz de cobre en el corte
  const forros = useGeo(() => mergeGeos(RANURAS.map((b) => plano(contornoRanura(b, 0), 0))), []);
  const huecos = useGeo(() => mergeGeos(RANURAS.map((b) => plano(contornoRanura(b, 0.025), 0))), []);
  const hacesA = useGeo(() => mergeGeos([plano(haz(RANURAS[0], N), 0), plano(haz(RANURAS[2], N), 0)]), [N]);
  const hacesB = useGeo(() => mergeGeos([plano(haz(RANURAS[1], N), 0), plano(haz(RANURAS[3], N), 0)]), [N]);
  // lados de bobina dentro de las ranuras (se ven por la boca de la ranura y por la ventana)
  const ladosA = useGeo(() => mergeGeos([ladoBobina(RANURAS[0], N), ladoBobina(RANURAS[2], N)]), [N]);
  const ladosB = useGeo(() => mergeGeos([ladoBobina(RANURAS[1], N), ladoBobina(RANURAS[3], N)]), [N]);
  // cabezas de bobina traseras
  const rH = radioHaz(N);
  const curvaA = useMemo(() => recorridoCabeza(0, N), [N]);
  const curvaB = useMemo(() => recorridoCabeza(1, N), [N]);
  const cabezaA = useGeo(() => tubo(curvaA, rH, 120, 14), [curvaA, rH]);
  const cabezaB = useGeo(() => tubo(curvaB, rH, 120, 14), [curvaB, rH]);
  const flujoA = useGeo(() => tubo(curvaA, rH * 1.06 + 0.012, 120, 14), [curvaA, rH]);
  const flujoB = useGeo(() => tubo(curvaB, rH * 1.06 + 0.012, 120, 14), [curvaB, rH]);
  // salidas a las delgas: A → delgas de 90° y 270°; B → 180° y 0°
  const salidas = useGeo(() => mergeGeos([
    tubo(recorridoSalida(0, 90 * GRAD, N), 0.035, 40, 6),
    tubo(recorridoSalida(Math.PI, 270 * GRAD, N), 0.035, 40, 6),
    tubo(recorridoSalida(90 * GRAD, 180 * GRAD, N), 0.035, 40, 6),
    tubo(recorridoSalida(270 * GRAD, 360 * GRAD, N), 0.035, 40, 6),
  ]), [N]);
  // eje y su corte
  const eje = useGeo(() => cilZ(rEje, zFreno[0] - 0.4, 0, 40), []);
  const ejeCorte = useGeo(() => { const g = new THREE.CircleGeometry(rEje, 40); return g; }, []);
  // colector: 4 delgas (±42°) con mica entre ellas, casquillo aislante y talones
  const delgas = useGeo(() => mergeGeos([0, 90, 180, 270].flatMap((c) => [sectorAnular({
    r0: 0.52, r1: rColector, a0: (c - 42) * GRAD, a1: (c + 42) * GRAD, z0: zColector[1], z1: zColector[0], segs: 18,
    corte: { frente: false, fondo: false, lados: false },
  }), sectorAnular({
    r0: rColector - 0.05, r1: 1.14, a0: (c - 9) * GRAD, a1: (c + 9) * GRAD, z0: zColector[0] - 0.26, z1: zColector[0] + 0.06, segs: 4,
    corte: { frente: false, fondo: false, lados: false },
  })])), []);
  const micas = useGeo(() => mergeGeos([45, 135, 225, 315].map((c) => sectorAnular({
    r0: 0.5, r1: rColector - 0.012, a0: (c - 3) * GRAD, a1: (c + 3) * GRAD, z0: zColector[1] + 0.02, z1: zColector[0] - 0.02, segs: 2,
    corte: { frente: false, fondo: false, lados: false },
  }))), []);
  const casquillo = useGeo(() => sectorAnular({ r0: rEje, r1: 0.53, a0: 0, a1: Math.PI * 2, z0: zColector[1] - 0.12, z1: zColector[0] + 0.18, segs: 32, corte: { frente: false, fondo: false } }), []);

  // acople elástico: dos cubos de aluminio y la araña de poliuretano
  const cubos = useGeo(() => mergeGeos([
    sectorAnular({ r0: rEje, r1: rAcople, a0: 0, a1: Math.PI * 2, z0: zAcople[0] - 0.78, z1: zAcople[0], segs: 64, corte: { frente: false, fondo: false } }),
    sectorAnular({ r0: rEje, r1: rAcople, a0: 0, a1: Math.PI * 2, z0: zAcople[1], z1: zAcople[1] + 0.78, segs: 64, corte: { frente: false, fondo: false } }),
    ...[0, 120, 240].flatMap((c) => [
    sectorAnular({ r0: 0.55, r1: rAcople - 0.04, a0: (c - 28) * GRAD, a1: (c + 28) * GRAD, z0: zAcople[0] - 1.05, z1: zAcople[0] - 0.76, segs: 8, corte: { frente: false, fondo: false, lados: false } }),
    sectorAnular({ r0: 0.55, r1: rAcople - 0.04, a0: (c + 32) * GRAD, a1: (c + 88) * GRAD, z0: zAcople[1] + 0.76, z1: zAcople[1] + 1.05, segs: 8, corte: { frente: false, fondo: false, lados: false } }),
    ]),
  ]), []);
  const arana = useGeo(() => sectorAnular({ r0: 0.5, r1: rAcople - 0.1, a0: 0, a1: Math.PI * 2, z0: zAcople[1] + 0.8, z1: zAcople[0] - 0.8, segs: 48, corte: { frente: false, fondo: false } }), []);
  // cinta reflectante (frente al sensor cuando θ = 0)
  const cinta = useGeo(() => sectorAnular({ r0: rAcople - 0.01, r1: rAcople + 0.006, a0: -13 * GRAD, a1: 13 * GRAD, z0: zCinta - 0.25, z1: zCinta + 0.25, segs: 10, corte: { frente: false, fondo: false, lados: false } }), []);
  // rotor del freno (sólo el buje que asoma)
  const bujeFreno = useGeo(() => sectorAnular({ r0: rEje, r1: 0.62, a0: 0, a1: Math.PI * 2, z0: zFreno[0] + 0.02, z1: zFreno[0] + 0.45, segs: 32, corte: { frente: false, fondo: false } }), []);

  return (
    <group>
      <group userData={{ pieza: 'inducido' }}>
        <M g={chapa} m={mats.chapa} />
        <M g={chapaCorte} m={mats.chapaCorte} sombra={false} />
        <M g={forros} m={mats.forro} sombra={false} />
        <M g={huecos} m={mats.hueco} sombra={false} />
      </group>
      <group userData={{ pieza: 'bobina', bobina: 0 }}>
        <M g={hacesA} m={mats.cobreCorte[0]} sombra={false} />
        <M g={ladosA} m={mats.esmalte[0]} />
        <M g={cabezaA} m={mats.esmalte[0]} />
        <mesh geometry={flujoA} material={corriente[0]} renderOrder={3} />
      </group>
      <group userData={{ pieza: 'bobina', bobina: 1 }}>
        <M g={hacesB} m={mats.cobreCorte[1]} sombra={false} />
        <M g={ladosB} m={mats.esmalte[1]} />
        <M g={cabezaB} m={mats.esmalte[1]} />
        <mesh geometry={flujoB} material={corriente[1]} renderOrder={3} />
      </group>
      <M g={salidas} m={mats.hiloSalida} pieza="salidas" />
      <group userData={{ pieza: 'eje' }}>
        <M g={eje} m={mats.eje} />
        <M g={ejeCorte} m={mats.ejeCorte} sombra={false} p={[0, 0, 0.001]} />
      </group>
      <group userData={{ pieza: 'colector' }}>
        <M g={delgas} m={mats.delga} />
        <M g={micas} m={mats.mica} />
        <M g={casquillo} m={mats.mica} />
      </group>
      <group userData={{ pieza: 'acople' }}>
        <M g={cubos} m={mats.aluminio} />
        <M g={arana} m={mats.poliuretano} />
        <M g={cinta} m={mats.cinta} sombra={false} />
      </group>
      <M g={bujeFreno} m={mats.aluminio} pieza="freno" />
    </group>
  );
}

/** Junta varias geometrías en una no indexada (sólo position, normal y uv). Libera las de entrada. */
export function mergeGeos(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const planas = gs.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of planas) total += g.getAttribute('position').count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of planas) {
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const p = g.getAttribute('position') as THREE.BufferAttribute, n = g.getAttribute('normal') as THREE.BufferAttribute;
    const u = g.getAttribute('uv') as THREE.BufferAttribute | undefined;
    for (let i = 0; i < p.count; i++) {
      pos[(o + i) * 3] = p.getX(i); pos[(o + i) * 3 + 1] = p.getY(i); pos[(o + i) * 3 + 2] = p.getZ(i);
      nor[(o + i) * 3] = n.getX(i); nor[(o + i) * 3 + 1] = n.getY(i); nor[(o + i) * 3 + 2] = n.getZ(i);
      if (u) { uv[(o + i) * 2] = u.getX(i); uv[(o + i) * 2 + 1] = u.getY(i); }
    }
    o += p.count;
  }
  planas.forEach((g, k) => { if (g !== gs[k]) g.dispose(); });
  gs.forEach((g) => g.dispose());
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  r.computeBoundingSphere();
  return r;
}

// ───────────────────────────── escudo y escobillas ─────────────────────────────

/** Brazos del escudo trasero (grados): dejan libre la vista al colector desde la ventana. */
const BRAZOS = [-25, 160, 255];

export function Escudo({ mats }: { mats: MatsMotor }) {
  const [z0, z1] = COTA.zEscudo;
  const fundido = useGeo(() => mergeGeos([
    sectorAnular({ r0: 2.62, r1: COTA.Ro + 0.06, a0: 0, a1: Math.PI * 2, z0: z1, z1: z0, segs: 96, corte: { frente: false, fondo: false } }),
    sectorAnular({ r0: 0.98, r1: 1.32, a0: 0, a1: Math.PI * 2, z0: z1 - 0.15, z1: z0 + 0.05, segs: 48, corte: { frente: false, fondo: false } }),
    ...BRAZOS.map((a) => sectorAnular({
      r0: 1.25, r1: 2.7, a0: (a - 9) * GRAD, a1: (a + 9) * GRAD, z0: z1 + 0.05, z1: z0 - 0.08, segs: 4, corte: { frente: false, fondo: false, lados: false },
    })),
  ]), []);
  const rodamiento = useGeo(() => mergeGeos([
    sectorAnular({ r0: 0.78, r1: 0.98, a0: 0, a1: Math.PI * 2, z0: z1 - 0.12, z1: z0 + 0.02, segs: 40, corte: { frente: false, fondo: false } }),
    sectorAnular({ r0: COTA.rEje, r1: 0.56, a0: 0, a1: Math.PI * 2, z0: z1 - 0.12, z1: z0 + 0.02, segs: 40, corte: { frente: false, fondo: false } }),
  ]), []);
  const sello = useGeo(() => sectorAnular({ r0: 0.56, r1: 0.78, a0: 0, a1: Math.PI * 2, z0: z1 - 0.1, z1: z0, segs: 40, corte: { frente: false, fondo: false } }), []);
  const tornillos = useGeo(() => mergeGeos([20, 140, 260].map((a) => {
    const g = cilindro(0.13, 0.13, 0.16, 16).clone(); g.rotateX(Math.PI / 2);
    g.translate(Math.cos(a * GRAD) * 2.92, Math.sin(a * GRAD) * 2.92, z1 - 0.08);
    return g;
  })), []);
  return (
    <group userData={{ pieza: 'escudo' }}>
      <M g={fundido} m={mats.yugo} sombra />
      <M g={rodamiento} m={mats.rodamiento} />
      <M g={sello} m={mats.goma} />
      <M g={tornillos} m={mats.tornillo} />
    </group>
  );
}

/** Portaescobillas (arriba y abajo), escobillas de carbón, resortes y trenzas. */
export function Escobillas({ mats }: { mats: MatsMotor }) {
  const z = COTA.zEscobilla, rc = COTA.rColector;
  // balancín en dos arcos (arriba y abajo): deja ver el colector de lado
  const aro = useGeo(() => mergeGeos([[55, 125], [235, 305]].map(([a0, a1]) => sectorAnular({
    r0: 2.15, r1: 2.92, a0: a0 * GRAD, a1: a1 * GRAD, z0: z - 0.2, z1: z + 0.2, segs: 24, corte: { frente: false, fondo: false, lados: false },
  }))), []);
  const columnas = useGeo(() => mergeGeos([60, 120, 240, 300].map((a) => {
    const g = cilindro(0.11, 0.11, Math.abs(COTA.zEscudo[1] - (z + 0.2)), 16).clone(); g.rotateX(Math.PI / 2);
    g.translate(Math.cos(a * GRAD) * 2.76, Math.sin(a * GRAD) * 2.76, (COTA.zEscudo[1] + z + 0.2) / 2);
    return g;
  })), []);
  // un portaescobillas en coordenadas locales (eje +Y radial), luego se gira a 90° y 270°
  const porta = useMemo(() => {
    const placas = mergeGeos([
      ...[-1, 1].map((sx) => { const g = cajaRedondeada(0.06, 0.62, 0.78, 0.02, 1).clone(); g.translate(sx * 0.33, rc + 0.43, z); return g; }),
      ...[-1, 1].map((sz) => { const g = cajaRedondeada(0.72, 1.0, 0.05, 0.02, 1).clone(); g.translate(0, rc + 0.62, z + sz * 0.39); return g; }),
      (() => { const g = cajaRedondeada(0.74, 0.07, 0.82, 0.02, 1).clone(); g.translate(0, rc + 1.14, z); return g; })(),
    ]);
    const brazo = (() => { const g = cajaRedondeada(0.5, 0.78, 0.32, 0.05, 2).clone(); g.translate(0, rc + 1.52, z); return g; })();
    const carbon = (() => { const g = cajaRedondeada(0.52, 0.92, 0.62, 0.03, 2).clone(); g.translate(0, rc + 0.46, z); return g; })();
    // resorte helicoidal entre la escobilla y la tapa
    const hel: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 2 * 4.5; hel.push(new THREE.Vector3(0.13 * Math.cos(a), rc + 0.93 + t * 0.2, z + 0.13 * Math.sin(a))); }
    const resorte = tubo(new THREE.CatmullRomCurve3(hel), 0.022, 160, 6);
    // trenza de cobre: de la escobilla al borne del brazo
    const trenza = tubo(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, rc + 0.86, z + 0.2), new THREE.Vector3(0.42, rc + 1.0, z + 0.32), new THREE.Vector3(0.52, rc + 1.3, z + 0.2), new THREE.Vector3(0.36, rc + 1.62, z + 0.18),
    ]), 0.045, 40, 8);
    const borne = (() => { const g = cilindro(0.1, 0.1, 0.16, 16).clone(); g.rotateZ(Math.PI / 2); g.translate(0.32, rc + 1.62, z + 0.06); return g; })();
    return { placas, brazo, carbon, resorte, trenza, borne };
  }, [rc, z]);
  useEffect(() => () => { Object.values(porta).forEach((g) => g.dispose()); }, [porta]);
  return (
    <group>
      <group userData={{ pieza: 'portaescobillas' }}>
        <M g={aro} m={mats.fenolico} />
        <M g={columnas} m={mats.laton} />
      </group>
      {[0, Math.PI].map((giro) => (
        <group key={giro} rotation={[0, 0, giro]}>
          <group userData={{ pieza: 'escobilla', arriba: giro === 0 }}>
            <M g={porta.carbon} m={mats.carbon} />
            <M g={porta.placas} m={mats.laton} />
            <M g={porta.resorte} m={mats.resorte} />
            <M g={porta.trenza} m={mats.trenza} />
            <M g={porta.borne} m={mats.laton} />
          </group>
          <M g={porta.brazo} m={mats.fenolico} pieza="portaescobillas" />
        </group>
      ))}
    </group>
  );
}

/** Bornes de las escobillas (mundo): arriba el +, abajo el −. */
export const BORNE_ESCOBILLA: { mas: V3; menos: V3 } = {
  mas: [0.42, COTA.rColector + 1.62, COTA.zEscobilla + 0.06],
  menos: [-0.42, -(COTA.rColector + 1.62), COTA.zEscobilla + 0.06],
};

// ───────────────────────────── banco ─────────────────────────────

export function Base({ mats }: { mats: MatsMotor }) {
  const y = COTA.yBase;
  // placa: x de −11,7 a 5,7 y z de −15,3 a 2,7
  const placa = useMemo(() => { const g = cajaRedondeada(17.4, 0.8, 18.0, 0.18, 3).clone(); g.translate(-3.0, y - 0.4, -6.3); return g; }, [y]);
  const pies = useMemo(() => mergeGeos([[-11.2, 2.2], [5.2, 2.2], [-11.2, -14.8], [5.2, -14.8]].map(([x, z]) => {
    const g = cilindro(0.55, 0.62, 0.35, 24).clone(); g.translate(x, y - 0.98, z); return g;
  })), [y]);
  const sillaG = useMemo(() => {
    const f = formaSilla(5.6, y, COTA.Ro + 0.004);
    return mergeGeos([extruirZ(f, -1.75, -0.95, 32), extruirZ(f, -3.65, -2.85, 32)]);
  }, [y]);
  const tornillos = useMemo(() => mergeGeos([-1.35, -3.25].flatMap((zc) => [-2.2, 2.2].map((x) => {
    const g = cilindro(0.17, 0.17, 0.12, 6).clone(); g.translate(x, y + 0.06, zc); return g;
  }))), [y]);
  useEffect(() => () => { placa.dispose(); pies.dispose(); sillaG.dispose(); tornillos.dispose(); }, [placa, pies, sillaG, tornillos]);
  return (
    <group userData={{ pieza: 'base' }}>
      <M g={placa} m={mats.base} />
      <M g={pies} m={mats.goma} />
      <M g={sillaG} m={mats.aluminio} pieza="silla" sombra />
      <M g={tornillos} m={mats.tornillo} />
    </group>
  );
}

export function Freno({ mats }: { mats: MatsMotor }) {
  const [zf, zb] = COTA.zFreno;
  const cuerpo = useMemo(() => {
    const perfil = perfilFreno();
    const g = new THREE.LatheGeometry(perfil, 96);
    // torno: eje Y → eje Z, del frente (zf) hacia atrás
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, zf);
    const brida = sectorAnular({ r0: 0.7, r1: COTA.rFreno + 0.22, a0: 0, a1: Math.PI * 2, z0: zf - 0.26, z1: zf, segs: 96, corte: { frente: false, fondo: false } });
    return mergeGeos([suavizar(g, 40 * GRAD), brida]);
  }, [zf]);

  const pernos = useMemo(() => mergeGeos([30, 90, 150, 210, 270, 330].map((a) => {
    const g = cilindro(0.14, 0.14, 0.14, 6).clone(); g.rotateX(Math.PI / 2);
    g.translate(Math.cos(a * GRAD) * 2.7, Math.sin(a * GRAD) * 2.7, zf + 0.07); return g;
  })), [zf]);
  const silla = useMemo(() => extruirZ(formaSilla(5.4, COTA.yBase, COTA.rFreno + 0.2), zb + 0.6, zf - 0.6, 32), [zb, zf]);
  const prensa = useMemo(() => {
    const g = cilindro(0.32, 0.32, 0.7, 24).clone(); g.translate(0, COTA.rFreno + 0.45, (zf + zb) / 2 - 1.0); return g;
  }, [zf, zb]);
  const cable = useMemo(() => tubo(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, COTA.rFreno + 0.8, (zf + zb) / 2 - 1.0), new THREE.Vector3(0, COTA.rFreno + 1.6, zb + 0.6),
    new THREE.Vector3(-0.6, 1.0, zb - 1.3), new THREE.Vector3(-1.0, COTA.yBase + 0.14, zb - 1.7), new THREE.Vector3(-1.2, COTA.yBase + 0.14, -14.7), new THREE.Vector3(-1.3, COTA.yBase - 0.6, -15.6),
  ]), 0.16, 60, 10), [zf, zb]);
  useEffect(() => () => { cuerpo.dispose(); pernos.dispose(); silla.dispose(); prensa.dispose(); cable.dispose(); }, [cuerpo, pernos, silla, prensa, cable]);
  return (
    <group userData={{ pieza: 'freno' }}>
      <M g={cuerpo} m={mats.negro} sombra />
      <M g={pernos} m={mats.tornillo} />
      <M g={silla} m={mats.aluminio} sombra />
      <M g={prensa} m={mats.plastico} />
      <M g={cable} m={mats.cableNegro} sombra />
    </group>
  );
}

/** Tacómetro óptico de reflexión: sensor en un poste, apuntando al acople. */
export const POS_SENSOR: V3 = [2.55, 0, COTA.zCinta];
export function Tacometro({ mats, led, punto }: { mats: MatsMotor; led: React.RefObject<THREE.Mesh | null>; punto: React.RefObject<THREE.Mesh | null> }) {
  const [x, , z] = POS_SENSOR;
  const caja = useMemo(() => { const g = cajaRedondeada(1.5, 1.0, 1.15, 0.12, 3).clone(); g.translate(x + 0.25, 0, z); return g; }, [x, z]);
  const lente = useMemo(() => { const g = cilindro(0.24, 0.24, 0.12, 32).clone(); g.rotateZ(Math.PI / 2); g.translate(x - 0.54, 0, z); return g; }, [x, z]);
  const poste = useMemo(() => mergeGeos([
    (() => { const g = cilindro(0.2, 0.2, -COTA.yBase - 0.5, 24).clone(); g.translate(x + 0.25, (COTA.yBase - 0.5) / 2, z); return g; })(),
    (() => { const g = cilindro(0.75, 0.8, 0.22, 32).clone(); g.translate(x + 0.25, COTA.yBase + 0.11, z); return g; })(),
  ]), [x, z]);
  const cable = useMemo(() => tubo(new THREE.CatmullRomCurve3([
    new THREE.Vector3(x + 1.0, 0, z), new THREE.Vector3(x + 1.5, -0.5, z - 0.4), new THREE.Vector3(x + 1.6, COTA.yBase + 0.6, z - 1.4),
    new THREE.Vector3(x + 1.6, COTA.yBase + 0.08, z - 2.6), new THREE.Vector3(x + 1.7, COTA.yBase + 0.08, -14.6), new THREE.Vector3(x + 1.7, COTA.yBase - 0.6, -15.6),
  ]), 0.07, 80, 8), [x, z]);
  useEffect(() => () => { caja.dispose(); lente.dispose(); poste.dispose(); cable.dispose(); }, [caja, lente, poste, cable]);
  return (
    <group userData={{ pieza: 'tacometro' }}>
      <M g={caja} m={mats.plastico} sombra />
      <M g={lente} m={mats.lente} />
      <M g={poste} m={mats.aluminio} sombra />
      <M g={cable} m={mats.cableNegro} sombra />
      {/* testigo de pulso (verde) y punto rojo del emisor sobre el acople */}
      <mesh ref={led} geometry={esfera(0.075, 16)} position={[x + 0.6, 0.52, z + 0.32]}>
        <meshBasicMaterial color="#1a3a22" toneMapped={false} />
      </mesh>
      <mesh ref={punto} position={[COTA.rAcople + 0.012, 0, z]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.1, 20]} />
        <meshBasicMaterial color="#ff2a2a" toneMapped={false} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/** Batería de 24 V (dos bloques de 12 V en serie) y regulador con su perilla. */
export const POS_BATERIA: V3 = [-8.2, COTA.yBase, -9.6];
export const POS_REGULADOR: V3 = [-7.6, COTA.yBase, -1.6];
export const BORNE_REGULADOR = { mas: [-5.3, COTA.yBase + 1.5, -1.0] as V3, menos: [-5.3, COTA.yBase + 1.5, -2.2] as V3 };

export function Bateria({ mats }: { mats: MatsMotor }) {
  const [x, y, z] = POS_BATERIA;
  const bloques = useMemo(() => mergeGeos([-1.32, 1.32].map((dx) => { const g = cajaRedondeada(2.5, 6.15, 9.6, 0.18, 3).clone(); g.translate(x + dx, y + 3.075, z); return g; })), [x, y, z]);
  const bornes = useMemo(() => ({
    rojo: mergeGeos([-1.32, 1.32].map((dx) => { const g = cajaRedondeada(0.75, 0.42, 0.9, 0.1, 2).clone(); g.translate(x + dx, y + 6.32, z + 3.7); return g; })),
    negro: mergeGeos([-1.32, 1.32].map((dx) => { const g = cajaRedondeada(0.75, 0.42, 0.9, 0.1, 2).clone(); g.translate(x + dx, y + 6.32, z - 3.7); return g; })),
  }), [x, y, z]);
  // puente entre bloques (− del primero al + del segundo)
  const puente = useMemo(() => tubo(new THREE.CatmullRomCurve3([
    new THREE.Vector3(x - 1.32, y + 6.55, z - 3.7), new THREE.Vector3(x, y + 7.3, z), new THREE.Vector3(x + 1.32, y + 6.55, z + 3.7),
  ]), 0.12, 40, 10), [x, y, z]);
  useEffect(() => () => { bloques.dispose(); bornes.rojo.dispose(); bornes.negro.dispose(); puente.dispose(); }, [bloques, bornes, puente]);
  return (
    <group userData={{ pieza: 'bateria' }}>
      <M g={bloques} m={mats.abs} sombra />
      <M g={bornes.rojo} m={mats.tapaRoja} />
      <M g={bornes.negro} m={mats.tapaNegra} />
      <M g={puente} m={mats.cableNegro} />
    </group>
  );
}

export function Regulador({ mats, V, energizado, perilla, palanca }: {
  mats: MatsMotor; V: number; energizado: boolean;
  perilla: React.RefObject<THREE.Group | null>; palanca: React.RefObject<THREE.Group | null>;
}) {
  const [x, y, z] = POS_REGULADOR;
  const caja = useMemo(() => { const g = cajaRedondeada(4.4, 2.8, 3.4, 0.25, 3).clone(); g.translate(x, y + 1.4, z); return g; }, [x, y, z]);
  const bornes = useMemo(() => ({
    rojo: (() => { const g = cilindro(0.26, 0.26, 0.5, 20).clone(); g.rotateZ(Math.PI / 2); g.translate(BORNE_REGULADOR.mas[0] - 0.05, BORNE_REGULADOR.mas[1], BORNE_REGULADOR.mas[2]); return g; })(),
    negro: (() => { const g = cilindro(0.26, 0.26, 0.5, 20).clone(); g.rotateZ(Math.PI / 2); g.translate(BORNE_REGULADOR.menos[0] - 0.05, BORNE_REGULADOR.menos[1], BORNE_REGULADOR.menos[2]); return g; })(),
  }), []);
  useEffect(() => () => { caja.dispose(); bornes.rojo.dispose(); bornes.negro.dispose(); }, [caja, bornes]);
  // perilla: 0 V → −135°, 24 V → +135° (sin cifras: la tensión está en el panel)
  const giro = (-135 + (Math.max(0, Math.min(24, V)) / 24) * 270) * GRAD;
  return (
    <group userData={{ pieza: 'regulador' }}>
      <M g={caja} m={mats.aluminio} sombra />
      <M g={bornes.rojo} m={mats.tapaRoja} />
      <M g={bornes.negro} m={mats.tapaNegra} />
      <group ref={perilla} position={[x - 0.6, y + 2.8, z + 0.2]} rotation={[0, -giro, 0]}>
        <M g={cilindro(0.72, 0.8, 0.62, 48)} m={mats.perilla} p={[0, 0.31, 0]} />
        <M g={cajaRedondeada(0.1, 0.05, 0.55, 0.02, 1)} m={mats.cinta} p={[0, 0.64, 0.35]} sombra={false} />
      </group>
      <group position={[x + 1.25, y + 2.8, z + 0.2]}>
        <M g={cilindro(0.32, 0.36, 0.18, 24)} m={mats.tornillo} p={[0, 0.09, 0]} />
        <group ref={palanca} rotation={[energizado ? -0.5 : 0.5, 0, 0]}>
          <M g={cilindro(0.07, 0.09, 0.95, 12)} m={mats.tornillo} p={[0, 0.5, 0]} />
          <M g={esfera(0.12, 16)} m={mats.tornillo} p={[0, 0.98, 0]} />
        </group>
      </group>
    </group>
  );
}

/** Cables de la batería al regulador y del regulador a las escobillas. */
export function Cables({ mats }: { mats: MatsMotor }) {
  const geos = useMemo(() => {
    const yb = COTA.yBase;
    const [bx, , bz] = POS_BATERIA;
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const rojoBat = tubo(new THREE.CatmullRomCurve3([v(bx + 1.32, yb + 6.6, bz + 3.7), v(bx + 1.6, yb + 7.4, bz + 5.2), v(-6.4, yb + 3.8, -3.6), v(-7.4, yb + 2.85, -2.4)]), 0.11, 50, 8);
    const negroBat = tubo(new THREE.CatmullRomCurve3([v(bx - 1.32, yb + 6.6, bz - 3.7), v(bx - 2.0, yb + 7.0, bz - 1.0), v(-9.6, yb + 3.6, -3.4), v(-8.3, yb + 2.85, -2.6)]), 0.11, 50, 8);
    const m = BORNE_ESCOBILLA.mas, n = BORNE_ESCOBILLA.menos;
    const rM = BORNE_REGULADOR.mas, rN = BORNE_REGULADOR.menos;
    const rojo = tubo(new THREE.CatmullRomCurve3([
      v(rM[0] + 0.2, rM[1], rM[2]), v(rM[0] + 1.2, rM[1] + 0.2, rM[2] - 0.4), v(-4.0, 3.0, -4.6), v(-1.6, 4.4, m[2] - 0.2), v(m[0] + 0.25, m[1] + 0.35, m[2]),
    ]), 0.11, 80, 8);
    const negro = tubo(new THREE.CatmullRomCurve3([
      v(rN[0] + 0.2, rN[1], rN[2]), v(rN[0] + 1.0, yb + 0.25, rN[2] - 0.8), v(-3.8, yb + 0.2, -4.4), v(-1.6, n[1] - 0.6, n[2] + 0.1), v(n[0] - 0.25, n[1] - 0.3, n[2]),
    ]), 0.11, 80, 8);
    return { rojoBat, negroBat, rojo, negro };
  }, []);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  return (
    <group userData={{ pieza: 'cables' }}>
      <M g={geos.rojoBat} m={mats.cableRojo} sombra />
      <M g={geos.negroBat} m={mats.cableNegro} sombra />
      <M g={geos.rojo} m={mats.cableRojo} sombra />
      <M g={geos.negro} m={mats.cableNegro} sombra />
    </group>
  );
}

/** Cuenta mallas y normales nulas (diagnóstico de la escena). */
export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number; triangulos: number } {
  let mallas = 0, normalesCero = 0, triangulos = 0;
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    const g = m.geometry as THREE.BufferGeometry;
    mallas++;
    triangulos += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
    const n = g.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { mallas, normalesCero, triangulos: Math.round(triangulos) };
}

