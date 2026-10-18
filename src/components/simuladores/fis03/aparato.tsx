'use client';
/**
 * fis03/aparato.tsx — las piezas del banco del péndulo, a escala real (1 u = 1 cm).
 *
 *   Estudio con ciclorama (suelo, curva y pared oscuros, sin horizonte), ménsula de acero
 *   atornillada a la pared con su cartabón y el brazo hasta el PIVOTE: una mordaza de dos
 *   placas cuyo canto inferior fija el punto de giro (el eje es z). Detrás del
 *   hilo, el transportador de aluminio satinado con su grabado y el índice rojo del ángulo de
 *   suelta. Esfera de latón maciza con cáncamo de acero; la longitud L se mide del canto de la
 *   mordaza al CENTRO de la esfera. Abajo, la fotopuerta en U con el haz cruzando el plano de
 *   oscilación por el centro de la esfera en reposo.
 *
 * Las geometrías estáticas de un mismo material se funden en una sola malla (pocas llamadas
 * de dibujo). Origen: el suelo en y = 0, el plano de oscilación en z = 0, la pared en −z.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MatsPendulo } from './materiales';

/** cm por metro */
export const U = 100;
/** altura del centro de la esfera en reposo (cm): justo en el haz de la fotopuerta */
export const Y_BOLA = 28;
/** plano de la pared (cm) */
export const Z_PARED = -40;
/** radio del transportador (cm) y su plano */
export const R_TRANSP = 22;
export const Z_TRANSP = -3.2;
/** el brazo va 6,2 cm por encima del pivote */
export const SOBRE_PIVOTE = 6.2;
/** Distancia (cm) del centro de la esfera al punto de amarre del hilo: lo alto del ojo del cáncamo. */
export const amarre = (r: number) => 1.2 * r + 0.36;

/** Altura del pivote (cm) para una longitud L (m). */
export const alturaPivote = (L: number) => L * U + Y_BOLA;

// ───────────────────────────── utilidades ─────────────────────────────

/** Funde geometrías (pasa a no indexadas: posición, normal y uv). Libera las de entrada. */
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

function useGeo(f: () => THREE.BufferGeometry, deps: React.DependencyList): THREE.BufferGeometry {
  const g = useMemo(f, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

/** Caja de cantos redondeados centrada en (x, y, z). */
function caja(w: number, h: number, d: number, r: number, x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.05, h / 2.05, d / 2.05));
  g.translate(x, y, z);
  return g;
}

/** Cilindro de eje `eje` centrado en (x, y, z). */
function cil(r0: number, r1: number, largo: number, seg: number, eje: 'x' | 'y' | 'z', x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r1, r0, largo, seg, 1);
  if (eje === 'x') g.rotateZ(-Math.PI / 2);
  if (eje === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

/** Perilla moleteada de estrella (5 lóbulos) de eje `eje`, con su cara en +eje. */
function perilla(r: number, alto: number, eje: 'x' | 'z', x: number, y: number, z: number): THREE.BufferGeometry[] {
  const partes: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(r * 0.62, r * 0.7, alto, 24, 1)];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const l = new THREE.CylinderGeometry(r * 0.3, r * 0.32, alto * 0.94, 16, 1);
    l.translate(Math.cos(a) * r * 0.66, 0, Math.sin(a) * r * 0.66);
    partes.push(l);
  }
  const vastago = new THREE.CylinderGeometry(r * 0.18, r * 0.18, alto * 0.9, 12, 1);
  vastago.translate(0, -alto * 0.9, 0);
  partes.push(vastago);
  const g = mergeGeos(partes);
  if (eje === 'x') g.rotateZ(-Math.PI / 2);
  if (eje === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return [g];
}

// ───────────────────────────── estudio ─────────────────────────────

/** Ciclorama: suelo, curva de 60 cm y pared, con un viñeteado suave por color de vértice. */
export function Estudio({ mats, centroY }: { mats: MatsPendulo; centroY: number }) {
  const geo = useGeo(() => {
    const Rc = 60, zc = Z_PARED + Rc;
    const perfil: [number, number][] = [];
    for (let i = 0; i <= 10; i++) perfil.push([700 - (i / 10) * (700 - zc), 0]);
    for (let i = 1; i <= 16; i++) { const f = (i / 16) * (Math.PI / 2); perfil.push([zc - Rc * Math.sin(f), Rc - Rc * Math.cos(f)]); }
    for (let i = 1; i <= 12; i++) perfil.push([Z_PARED, Rc + (i / 12) * (900 - Rc)]);
    const nx = 36, X0 = -800, X1 = 800;
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    const base = new THREE.Color('#2f3742'), borde = new THREE.Color('#090c10');
    const c = new THREE.Color();
    for (let j = 0; j < perfil.length; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = X0 + ((X1 - X0) * i) / nx;
        const [z, y] = perfil[j];
        pos.push(x, y, z);
        // distancia al centro del banco: el ciclorama se apaga hacia los bordes
        const d = Math.hypot(x * 0.8, (y - centroY) * 0.9, (z - Z_PARED) * 0.55);
        const f = Math.exp(-Math.pow(d / (190 + centroY * 0.75), 2));
        c.copy(borde).lerp(base, f);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < perfil.length - 1; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
      // caras hacia la cámara (normal hacia +y en el suelo y hacia +z en la pared)
      idx.push(a, b, d, b, e, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [centroY]);
  return <mesh geometry={geo} material={mats.estudio} receiveShadow userData={{ pieza: 'estudio' }} />;
}

// ───────────────────────────── soporte, mordaza y transportador ─────────────────────────────

/** Triángulo (cartabón) en el plano y–z, extruido en x: refuerza la ménsula contra la pared. */
function cartabon(alto: number, vuelo: number, grueso: number, yTop: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(vuelo, 0); s.lineTo(0, -alto); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: grueso, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 });
  // (x_forma, y_forma, z_ext) → (z, y, x): la forma en el plano y–z, el grueso en x
  g.rotateY(-Math.PI / 2);
  g.translate(grueso / 2, yTop, Z_PARED + 1.2);
  return g;
}

/**
 * Ménsula de acero atornillada a la pared (placa, cartabón y brazo hacia delante) hasta la
 * mordaza. `H` es la altura del pivote (cm): el canto inferior de las placas de la mordaza,
 * sobre el centro del transportador. Nada vertical cruza el plano de oscilación.
 */
export function Soporte({ mats, H }: { mats: MatsPendulo; H: number }) {
  const yb = H + SOBRE_PIVOTE;
  // acero pintado al polvo: placa de pared y cartabón
  const pintado = useGeo(() => mergeGeos([
    caja(15, 24, 1.2, 0.4, 0, yb + 3, Z_PARED + 0.6),
    cartabon(15, 22, 1.0, yb - 1.3),
  ]), [yb]);
  const anodizado = useGeo(() => mergeGeos([
    // brazo (tubo cuadrado) desde la pared hasta encima del pivote
    caja(3, 3, -Z_PARED + 1.7, 0.4, 0, yb, Z_PARED / 2 + 0.85),
    // cuerpo de la mordaza (cuelga del brazo)
    caja(3.6, 2.6, 3.6, 0.35, 0, H + 3.75, 0),
    // pletina que sostiene el transportador
    caja(5.5, 4.2, 0.6, 0.2, 0, H + 3.0, Z_TRANSP - 0.45),
    caja(1.6, 1.6, -Z_TRANSP + 0.4, 0.2, 0, H + 4.2, Z_TRANSP / 2 - 0.2),
  ]), [yb, H]);
  const acero = useGeo(() => mergeGeos([
    // placas de la mordaza: el canto inferior (y = H) es el pivote; el hilo pasa entre ellas
    caja(0.7, 2.6, 3.0, 0.12, -0.42, H + 1.3, 0),
    caja(0.7, 2.6, 3.0, 0.12, 0.42, H + 1.3, 0),
    // tornillo pasante de la mordaza
    cil(0.22, 0.22, 4.6, 14, 'x', 0.6, H + 1.6, 0),
  ]), [H]);
  const tornillos = useGeo(() => mergeGeos([
    // tornillos del transportador
    cil(0.35, 0.35, 0.5, 14, 'z', -1.6, H + 3.0, Z_TRANSP - 0.95),
    cil(0.35, 0.35, 0.5, 14, 'z', 1.6, H + 3.0, Z_TRANSP - 0.95),
    // pernos de la placa de pared (arandela y cabeza hexagonal)
    ...[[-5, 10.5], [5, 10.5], [-5, -4.5], [5, -4.5]].flatMap(([x, y]) => [
      cil(1.0, 1.0, 0.25, 24, 'z', x, yb + 3 + y, Z_PARED + 1.32),
      cil(0.62, 0.62, 0.7, 6, 'z', x, yb + 3 + y, Z_PARED + 1.75),
    ]),
  ]), [yb, H]);
  const perillas = useGeo(() => mergeGeos([
    ...perilla(1.0, 0.9, 'x', 3.0, H + 1.6, 0),
  ]), [H]);
  return (
    <group>
      <mesh geometry={pintado} material={mats.negro} castShadow receiveShadow userData={{ pieza: 'brazo' }} />
      <mesh geometry={anodizado} material={mats.anodizado} castShadow receiveShadow userData={{ pieza: 'brazo' }} />
      <mesh geometry={acero} material={mats.acero} castShadow userData={{ pieza: 'mordaza' }} />
      <mesh geometry={tornillos} material={mats.tornillo} castShadow userData={{ pieza: 'brazo' }} />
      <mesh geometry={perillas} material={mats.perilla} castShadow userData={{ pieza: 'perilla' }} />
    </group>
  );
}

/** Transportador de aluminio satinado (semicírculo inferior) con el índice rojo del ángulo de suelta. */
export function Transportador({ mats, H, theta0 }: { mats: MatsPendulo; H: number; theta0: number }) {
  const placa = useGeo(() => {
    const s = new THREE.Shape();
    s.moveTo(-R_TRANSP, 0);
    s.absarc(0, 0, R_TRANSP, Math.PI, 2 * Math.PI, false);
    s.lineTo(-R_TRANSP, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 2, curveSegments: 96 });
    g.translate(0, 0, -0.35 - 0.06);
    return g;
  }, []);
  const cara = useGeo(() => {
    const g = new THREE.CircleGeometry(R_TRANSP - 0.02, 128, Math.PI, Math.PI);
    return g;
  }, []);
  const indice = useGeo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.2); s.lineTo(-0.75, 1.6); s.lineTo(0.75, 1.6); s.lineTo(0, -0.2);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1 });
    // la punta mira al centro: queda sobre el borde, por fuera
    g.rotateZ(Math.PI);
    g.translate(0, 0, -0.1);
    return g;
  }, []);
  const a = theta0;
  // la punta del índice toca el borde de la placa
  const rI = R_TRANSP + 0.3;
  return (
    <group position={[0, H, Z_TRANSP]} userData={{ pieza: 'transportador' }}>
      <mesh geometry={placa} material={mats.satinado} castShadow receiveShadow />
      <mesh geometry={cara} material={mats.grabado} position={[0, 0, 0.012]} receiveShadow />
      {/* índice del ángulo de suelta: en el borde, a θ₀ hacia +x */}
      <group position={[rI * Math.sin(a), -rI * Math.cos(a), 0]} rotation={[0, 0, a]} userData={{ pieza: 'indice' }}>
        <mesh geometry={indice} material={mats.indice} castShadow />
      </group>
    </group>
  );
}

// ───────────────────────────── esfera y fotopuerta ─────────────────────────────

/** Esfera maciza de latón con cáncamo de acero. Origen en el CENTRO de la esfera; el amarre está a AMARRE·r. */
export function Esfera({ mats, r, material }: { mats: MatsPendulo; r: number; material?: THREE.Material }) {
  const bola = useGeo(() => new THREE.SphereGeometry(r, 64, 44), [r]);
  const cancamo = useGeo(() => {
    const base = new THREE.CylinderGeometry(0.2 * r, 0.24 * r, 0.12 * r, 24, 1);
    base.translate(0, 0.97 * r, 0);
    const ojo = new THREE.TorusGeometry(0.085 * r + 0.18, 0.035 * r + 0.07, 10, 28);
    ojo.translate(0, 1.03 * r + 0.085 * r + 0.18, 0);
    return mergeGeos([base, ojo]);
  }, [r]);
  if (material) {
    return (
      <group>
        <mesh geometry={bola} material={material} renderOrder={2} />
        <mesh geometry={cancamo} material={material} renderOrder={2} />
      </group>
    );
  }
  return (
    <group>
      <mesh geometry={bola} material={mats.laton} castShadow receiveShadow userData={{ pieza: 'esfera' }} />
      <mesh geometry={cancamo} material={mats.acero} castShadow userData={{ pieza: 'esfera' }} />
    </group>
  );
}

/** Semiabertura de la U de la fotopuerta (cm): deja pasar la esfera mayor (r = 5,2 cm) con holgura. */
export const SEMI_U = 7.1;

/**
 * Fotopuerta en U con el haz a lo largo de z por el centro de la esfera en reposo. Origen en
 * el haz. `led` es el testigo que se enciende con el haz tapado.
 */
export function Fotopuerta({ mats, led }: { mats: MatsPendulo; led: React.RefObject<THREE.Mesh | null> }) {
  const cuerpo = useGeo(() => mergeGeos([
    caja(2.4, 2.2, 2 * SEMI_U + 5.2, 0.4, 0, -10, 0),
    caja(2.4, 16, 2.4, 0.45, 0, -3, SEMI_U + 1.2),
    caja(2.4, 16, 2.4, 0.45, 0, -3, -(SEMI_U + 1.2)),
    // caja del circuito, detrás
    caja(4.2, 5.2, 3.2, 0.5, 0, -6.5, -(SEMI_U + 3.6)),
  ]), []);
  const lentes = useGeo(() => mergeGeos([
    cil(0.48, 0.48, 0.3, 20, 'z', 0, 0, SEMI_U + 0.08),
    cil(0.48, 0.48, 0.3, 20, 'z', 0, 0, -(SEMI_U + 0.08)),
  ]), []);
  const montaje = useGeo(() => mergeGeos([
    cil(0.6, 0.6, Y_BOLA - 11.1 - 1.6, 16, 'y', 0, -11.1 - (Y_BOLA - 11.1 - 1.6) / 2, 0),
    cil(0.95, 0.95, 1.4, 20, 'y', 0, -11.6, 0),
  ]), []);
  const base = useGeo(() => {
    const perfil = [new THREE.Vector2(0, 0), new THREE.Vector2(7.6, 0), new THREE.Vector2(8.2, 0.35), new THREE.Vector2(8.2, 1.1), new THREE.Vector2(7.4, 1.6), new THREE.Vector2(1.6, 1.8), new THREE.Vector2(1.2, 2.6), new THREE.Vector2(0.001, 2.6)];
    const g = new THREE.LatheGeometry(perfil, 56);
    g.translate(0, -Y_BOLA, 0);
    return g;
  }, []);
  const cable = useGeo(() => {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -8.2, -(SEMI_U + 5.2)),
      new THREE.Vector3(0.5, -12, -(SEMI_U + 9)),
      new THREE.Vector3(4, -Y_BOLA + 0.45, -(SEMI_U + 16)),
      new THREE.Vector3(26, -Y_BOLA + 0.45, -26),
      new THREE.Vector3(70, -Y_BOLA + 0.45, -30),
    ]);
    return new THREE.TubeGeometry(curva, 64, 0.32, 8, false);
  }, []);
  const haz = useGeo(() => cil(0.08, 0.08, 2 * SEMI_U, 8, 'z'), []);
  const ledGeo = useGeo(() => new THREE.SphereGeometry(0.34, 16, 12), []);
  return (
    <group userData={{ pieza: 'fotopuerta' }}>
      <mesh geometry={cuerpo} material={mats.negro} castShadow receiveShadow />
      <mesh geometry={lentes} material={mats.lente} />
      <mesh geometry={montaje} material={mats.acero} castShadow />
      <mesh geometry={base} material={mats.negro} castShadow receiveShadow />
      <mesh geometry={cable} material={mats.cable} castShadow receiveShadow />
      <mesh geometry={haz} material={mats.haz} renderOrder={3} userData={{ pieza: 'haz' }} />
      <mesh ref={led} geometry={ledGeo} material={mats.led} position={[0, 3.6, SEMI_U + 2.42]} />
    </group>
  );
}

// ───────────────────────────── diagnóstico ─────────────────────────────

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
