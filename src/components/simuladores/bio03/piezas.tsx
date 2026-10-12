'use client';
/**
 * bio03/piezas.tsx — dogma central: ADN, ARN polimerasa, ARNm, ARNt, ribosoma, poro nuclear.
 *
 * Colores de las bases (los mismos de los botones del lab):
 *   A verde · U/T rosa · C azul · G ámbar.
 * Honestidad con la tarea: el alumno DEDUCE cada base del ARNm y cada ARNt. Por eso
 *   · la hebra opuesta de la doble hélice sólo se colorea DETRÁS de la polimerasa (lo ya
 *     transcrito); delante queda en gris, o la hélice daría la respuesta;
 *   · no se dibuja ninguna base ni ARNt «por llegar»: el sitio A espera vacío hasta que
 *     el alumno elige; el factor de liberación sólo aparece cuando lo elige.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useCalidad, geoCache, Etiqueta, sanearNormales } from '../_kit';

export const COLOR_BASE: Record<string, string> = { A: '#2fa56b', U: '#d6455d', T: '#d6455d', C: '#3f8fc7', G: '#e69b2e' };
const GRIS = '#8c97a3';
const PURINAS = 'AG';
const COMP_ADN: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };

function useMat<T extends THREE.Material>(crear: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(crear, deps);
  useEffect(() => () => { m.dispose(); }, [m]);
  return m;
}
/** Material de un color (compartido por componente): plástico satinado de modelo molecular. */
function useColores(colores: string[]) {
  const clave = colores.join('|');
  const mapa = useMemo(() => {
    const m = new Map<string, THREE.MeshPhysicalMaterial>();
    for (const c of colores) if (!m.has(c)) m.set(c, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.3, sheenColor: new THREE.Color('#ffffff') }));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  useEffect(() => () => { mapa.forEach((m) => m.dispose()); }, [mapa]);
  return (c: string) => mapa.get(c) ?? mapa.values().next().value!;
}

const cil = () => geoCache('bio03:cil', () => new THREE.CylinderGeometry(1, 1, 1, 12));
const esf = () => geoCache('bio03:esf', () => new THREE.SphereGeometry(1, 16, 12));
const Y = new THREE.Vector3(0, 1, 0);

/** Varilla de `a` a `b` (cilindro de radio r). */
function Varilla({ a, b, r, material }: { a: THREE.Vector3; b: THREE.Vector3; r: number; material: THREE.Material }) {
  const { pos, q, L } = useMemo(() => {
    const d = b.clone().sub(a), L = d.length();
    return { pos: a.clone().add(b).multiplyScalar(0.5), q: new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), L };
  }, [a, b]);
  return <mesh geometry={cil()} material={material} position={pos} quaternion={q} scale={[r, L, r]} castShadow />;
}

// ───────────────────────────── doble hélice ─────────────────────────────

const SP = 0.5, RH = 0.74, GIRO = 0.628, DESFASE = 2.5, BURBUJA = 0.55;
const GROSOR_HEBRA = 0.085;

/** Punto de la hebra `h` (0 = molde, 1 = opuesta) en la posición continua s (en pares de bases). */
function puntoHebra(s: number, h: 0 | 1, n: number, p: number): THREE.Vector3 {
  const bub = p < n ? BURBUJA * Math.exp(-(((s - (p + 0.5)) / 1.25) ** 2)) : 0;
  const R = RH + bub;
  const a = s * GIRO + (h === 1 ? DESFASE : 0);
  return new THREE.Vector3((s - (n - 1) / 2) * SP, R * Math.cos(a), R * Math.sin(a));
}
export const xBase = (i: number, n: number) => (i - (n - 1) / 2) * SP;

export function DobleHelice({ adn, p }: { adn: string; p: number }) {
  const n = adn.length;
  const colores = useMemo(() => [...Object.values(COLOR_BASE), GRIS, '#5c6fa6', '#8d9aae'], []);
  const mat = useColores(colores);
  const tubos = useMemo(() => {
    const mk = (h: 0 | 1) => {
      const pts: THREE.Vector3[] = [];
      for (let s = -0.7; s <= n - 0.3 + 1e-6; s += 0.25) pts.push(puntoHebra(s, h, n, p));
      return sanearNormales(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(40, n * 12), GROSOR_HEBRA, 8, false));
    };
    return [mk(0), mk(1)];
  }, [n, p]);
  useEffect(() => () => { tubos.forEach((t) => t.dispose()); }, [tubos]);

  const rungs = useMemo(() => {
    const out: { a: THREE.Vector3; b: THREE.Vector3; c: string; fin: THREE.Vector3; k: string }[] = [];
    for (let i = 0; i < n; i++) {
      const P1 = puntoHebra(i, 0, n, p), P2 = puntoHebra(i, 1, n, p);
      const bT = adn[i], bP = COMP_ADN[bT] ?? 'A';
      const fr = PURINAS.includes(bT) ? 0.58 : 0.42;   // purina (2 anillos) + pirimidina (1) = ancho constante
      const m1 = P1.clone().lerp(P2, fr);            // la base molde cubre una fracción `fr` de la cuerda
      const m2 = P2.clone().lerp(P1, 1 - fr);        // la opuesta cubre el resto
      out.push({ a: P1, b: m1, c: COLOR_BASE[bT] ?? GRIS, fin: m1, k: `t${i}` });
      // la opuesta sólo se colorea en lo ya transcrito (i < p); en la burbuja se abre; delante, gris
      const abierta = p < n && i >= p && i <= p + 1;
      if (!abierta) out.push({ a: P2, b: m2, c: i < p ? (COLOR_BASE[bP] ?? GRIS) : GRIS, fin: m2, k: `o${i}` });
    }
    return out;
  }, [adn, n, p]);

  return (
    <group>
      <mesh geometry={tubos[0]} material={mat('#5c6fa6')} castShadow />
      <mesh geometry={tubos[1]} material={mat('#8d9aae')} castShadow />
      {rungs.map((r) => (
        <group key={r.k}>
          <Varilla a={r.a} b={r.b} r={0.1} material={mat(r.c)} />
          <mesh geometry={esf()} material={mat(r.c)} position={r.fin} scale={0.13} />
        </group>
      ))}
    </group>
  );
}

export function ARNPolimerasa({ x }: { x: number }) {
  const alta = useCalidad() === 'alta';
  const mat = useMat(() => (alta
    ? new THREE.MeshPhysicalMaterial({ color: '#b9aee6', roughness: 0.3, transmission: 0.88, thickness: 0.35, ior: 1.33, attenuationColor: new THREE.Color('#8f7fd6'), attenuationDistance: 2.2, sheen: 0.5, sheenColor: new THREE.Color('#ffffff') })
    : new THREE.MeshPhysicalMaterial({ color: '#a89ad9', roughness: 0.35, transparent: true, opacity: 0.4, depthWrite: false })), [alta]);
  return (
    <group position={[x, 0.02, 0]}>
      <mesh geometry={esf()} material={mat} position={[0.1, 0.05, -0.2]} scale={[0.85, 0.95, 0.7]} renderOrder={5} />
      <mesh geometry={esf()} material={mat} position={[0.55, 0.35, -0.15]} scale={[0.5, 0.5, 0.5]} renderOrder={5} />
    </group>
  );
}

// ───────────────────────────── ARNm ─────────────────────────────

const atenuar = (hex: string) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#8a8f98'), 0.18).getHexString();

/** Hebra de ARNm como cuentas coloreadas con su letra; `inicio` fija la base 0 (en x). */
export function HebraARNm({ arn, paso, radio, y = 0, z = 0, letra = true, cap = false }: { arn: string; paso: number; radio: number; y?: number; z?: number; letra?: boolean; cap?: boolean }) {
  const mat = useColores([...Object.values(COLOR_BASE), '#5b6470']);
  const tubo = useMemo(() => {
    if (arn.length < 2) return null;
    const pts = Array.from({ length: arn.length }, (_, i) => new THREE.Vector3(i * paso, y + Math.sin(i * 0.7) * 0.015, z));
    return sanearNormales(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), arn.length * 6, radio * 0.28, 8, false));
  }, [arn.length, paso, radio, y, z]);
  useEffect(() => () => { tubo?.dispose(); }, [tubo]);
  return (
    <group>
      {tubo && <mesh geometry={tubo} material={mat('#5b6470')} />}
      {cap && <mesh geometry={esf()} material={mat('#5b6470')} position={[-paso * 1.1, y, z]} scale={radio * 0.95} />}
      {arn.split('').map((b, i) => (
        <group key={i} position={[i * paso, y, z]}>
          <mesh geometry={esf()} material={mat(COLOR_BASE[b] ?? GRIS)} scale={radio} castShadow />
          {letra && <Etiqueta texto={b} position={[0, 0, radio * 1.08]} tamano={radio * 1.1} color="#ffffff" peso={700} />}
        </group>
      ))}
    </group>
  );
}

// ───────────────────────────── ARNt ─────────────────────────────

/** ARNt en L: tallo aceptor con el aminoácido arriba, brazos D y T, anticodón abajo (y = 0). */
export function ARNt({ anticodon, aaColor, escala = 1, ...g }: { anticodon: string; aaColor?: string; escala?: number } & React.ComponentProps<'group'>) {
  const mat = useColores(['#7f9bd6', '#a9bde6', ...Object.values(COLOR_BASE), aaColor ?? '#888888']);
  const V = (x: number, y: number) => new THREE.Vector3(x, y, 0);
  const cuerpo = mat('#7f9bd6'), claro = mat('#a9bde6');
  return (
    <group scale={escala} {...g}>
      {anticodon.split('').map((b, i) => <mesh key={i} geometry={esf()} material={mat(COLOR_BASE[b] ?? GRIS)} position={[(i - 1) * 0.16, 0, 0]} scale={0.085} castShadow />)}
      <Varilla a={V(-0.1, 0.1)} b={V(-0.1, 0.55)} r={0.04} material={cuerpo} />
      <Varilla a={V(0.1, 0.1)} b={V(0.1, 0.55)} r={0.04} material={cuerpo} />
      <Varilla a={V(-0.1, 0.55)} b={V(-0.33, 0.78)} r={0.04} material={cuerpo} />
      <Varilla a={V(0.1, 0.55)} b={V(0.33, 0.78)} r={0.04} material={cuerpo} />
      <mesh geometry={esf()} material={claro} position={[-0.36, 0.8, 0]} scale={0.1} />
      <mesh geometry={esf()} material={claro} position={[0.36, 0.8, 0]} scale={0.1} />
      <Varilla a={V(-0.07, 0.6)} b={V(-0.07, 1.2)} r={0.035} material={cuerpo} />
      <Varilla a={V(0.07, 0.6)} b={V(0.07, 1.2)} r={0.035} material={cuerpo} />
      {aaColor && <mesh geometry={esf()} material={mat(aaColor)} position={[0, 1.36, 0]} scale={0.17} castShadow />}
    </group>
  );
}

// ───────────────────────────── ribosoma ─────────────────────────────

export function Ribosoma({ separacion = 0 }: { separacion?: number }) {
  const alta = useCalidad() === 'alta';
  const grande = useMat(() => (alta
    ? new THREE.MeshPhysicalMaterial({ color: '#9bbfe8', roughness: 0.1, transmission: 0.82, thickness: 0.4, ior: 1.36, attenuationColor: new THREE.Color('#4f86c6'), attenuationDistance: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#d8e8fa'), clearcoat: 0.3 })
    : new THREE.MeshPhysicalMaterial({ color: '#7fa9dc', roughness: 0.25, transparent: true, opacity: 0.32, depthWrite: false })), [alta]);
  const pequena = useMat(() => (alta
    ? new THREE.MeshPhysicalMaterial({ color: '#ecc79a', roughness: 0.15, transmission: 0.6, thickness: 0.3, ior: 1.38, attenuationColor: new THREE.Color('#d08a3c'), attenuationDistance: 0.8, sheen: 0.6, sheenColor: new THREE.Color('#fff2dd'), clearcoat: 0.3 })
    : new THREE.MeshPhysicalMaterial({ color: '#d9a05c', roughness: 0.3, transparent: true, opacity: 0.5, depthWrite: false })), [alta]);
  return (
    <group>
      {/* subunidad mayor (60S): cúpula sobre el ARNm; túnel de salida arriba */}
      <mesh geometry={esf()} material={grande} position={[0, 1.0 + separacion, 0]} scale={[2.0, 1.02, 0.95]} renderOrder={6} />
      <mesh geometry={esf()} material={grande} position={[-0.5, 1.95 + separacion, 0]} scale={[0.36, 0.26, 0.28]} renderOrder={6} />
      {/* subunidad menor (40S): plataforma bajo el ARNm */}
      <mesh geometry={esf()} material={pequena} position={[0.1, -0.7 - separacion * 0.4, 0]} scale={[1.7, 0.55, 0.85]} renderOrder={6} />
    </group>
  );
}

/** Factor de liberación: proteína en el sitio A cuando el ribosoma llega al codón de paro. */
export function FactorLiberacion() {
  const mat = useColores(['#9a6fc0', '#c3a3e0']);
  return (
    <group>
      <mesh geometry={esf()} material={mat('#9a6fc0')} position={[0, 0.7, 0]} scale={[0.4, 0.5, 0.3]} castShadow />
      <Varilla a={new THREE.Vector3(0, 0.3, 0)} b={new THREE.Vector3(0, 0.0, 0)} r={0.06} material={mat('#c3a3e0')} />
      <mesh geometry={esf()} material={mat('#c3a3e0')} position={[0.28, 1.05, 0]} scale={0.18} />
    </group>
  );
}

// ───────────────────────────── cadena de aminoácidos ─────────────────────────────

export function CadenaPolipeptidica({ aminoacidos, origen }: { aminoacidos: { id: string; name: string; color: string }[]; origen: [number, number, number] }) {
  const colores = useMemo(() => aminoacidos.map((a) => atenuar(a.color)), [aminoacidos]);
  const mat = useColores(colores.length ? colores : ['#888888']);
  const pts = useMemo(() => aminoacidos.map((_, i) => new THREE.Vector3(origen[0] - 0.15 + 0.3 * Math.sin(i * 1.2), origen[1] + i * 0.3, origen[2] + 0.12 * Math.cos(i * 1.1))), [aminoacidos, origen]);
  const tubo = useMemo(() => (pts.length > 1 ? sanearNormales(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 8, 0.04, 8, false)) : null), [pts]);
  useEffect(() => () => { tubo?.dispose(); }, [tubo]);
  const gris = useColores(['#aab2bd']);
  return (
    <group>
      {tubo && <mesh geometry={tubo} material={gris('#aab2bd')} />}
      {pts.map((p, i) => (
        <group key={aminoacidos[i].id} position={p}>
          <mesh geometry={esf()} material={mat(colores[i])} scale={0.15} castShadow />
          <Etiqueta texto={aminoacidos[i].name} position={[0.34, 0, 0.1]} tamano={0.13} fondo="#ffffffd9" ancla={[0, 0.5]} />
        </group>
      ))}
    </group>
  );
}

// ───────────────────────────── envoltura nuclear con poro ─────────────────────────────

/** Muro de dos membranas con un poro nuclear en (y, z) = (0, 0). La membrana mira a ±x. */
export function EnvolturaNuclear({ x, opacidad = 1 }: { x: number; opacidad?: number }) {
  const geos = useMemo(() => {
    const f = new THREE.Shape();
    f.moveTo(-3.6, -3.4); f.lineTo(3.6, -3.4); f.lineTo(3.6, 4.2); f.lineTo(-3.6, 4.2); f.closePath();
    const h = new THREE.Path(); h.absarc(0, 0, 0.52, 0, Math.PI * 2, true); f.holes.push(h);
    const g = new THREE.ExtrudeGeometry(f, { depth: 0.1, bevelEnabled: false, curveSegments: 28 });
    g.translate(0, 0, -0.05); g.rotateY(Math.PI / 2); g.computeVertexNormals(); sanearNormales(g);
    return g;
  }, []);
  useEffect(() => () => geos.dispose(), [geos]);
  const mem = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#d8c6a2', roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#fff0d0'), transparent: opacidad < 1, opacity: 0.88 * opacidad, side: THREE.DoubleSide }), [opacidad]);
  const prot = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#8d7fc4', roughness: 0.4, clearcoat: 0.3, transparent: opacidad < 1, opacity: opacidad }), [opacidad]);
  const anillo = useMemo(() => new THREE.TorusGeometry(0.62, 0.1, 10, 28), []);
  useEffect(() => () => anillo.dispose(), [anillo]);
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={geos} material={mem} position={[-0.17, 0, 0]} />
      <mesh geometry={geos} material={mem} position={[0.17, 0, 0]} />
      {[-0.28, 0.28].map((dx) => <mesh key={dx} geometry={anillo} material={prot} position={[dx, 0, 0]} rotation={[0, Math.PI / 2, 0]} />)}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <mesh key={i} geometry={esf()} material={prot} position={[0, Math.cos(a) * 0.66, Math.sin(a) * 0.66]} scale={[0.3, 0.09, 0.09]} rotation={[a, 0, 0]} />;
      })}
    </group>
  );
}

export function MarcoSitio({ x, w = 1.2 }: { x: number; w?: number }) {
  const pts = useMemo(() => [[-w / 2, -0.32], [w / 2, -0.32], [w / 2, 0.32], [-w / 2, 0.32], [-w / 2, -0.32]].map(([a, b]) => new THREE.Vector3(x + a, b, 0.3)), [x, w]);
  return <Line points={pts} color="#ffffff" lineWidth={2} />;
}
