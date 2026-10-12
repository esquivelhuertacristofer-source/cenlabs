'use client';
/**
 * fis01/piezas.tsx — piezas propias del polígono de tiro parabólico.
 *
 * ESCALA DE ESTE LAB: 1 u = 1 m (es un campo de tiro de ~100 m, no una mesa). El
 * kit trabaja a 1 u = 1 dm, así que aquí las piezas se dibujan directamente en
 * metros. Los instrumentos (lanzador, goniómetro, bola) van AGRANDADOS ×K para que
 * se reconozcan desde la cámara que enmarca todo el campo; la torre, el muro, la
 * diana y las distancias están a escala real.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Etiqueta, cilindro, esfera, tornear, texturaCompartida, useTexturaLienzo, useMateriales, azar, familiaTexto, cajaRedondeada } from '../_kit';

type V3 = [number, number, number];
/** factor de agrandamiento de los instrumentos (lanzador, goniómetro, proyectil) */
export const K = 4;
/** radio del proyectil dibujado: 12 cm reales ×K */
export const R_BOLA = 0.06 * K * 2;   // 0,48 m
/** el cañón queda con el pivote a este alto sobre la cubierta de la torre */
export const ALTO_YUGO = 1.0;
export const LARGO_CANON_ADELANTE = 1.0 * K;   // del pivote a la boca (4 m)

const EJE_Y = new THREE.Vector3(0, 1, 0);

// ───────────────────────────── barras instanciadas ─────────────────────────────

/** Muchas barras (cilindros finos entre dos puntos) en una sola llamada de dibujo. */
export function Barras({ lista, radio, material, sombra = true }: { lista: [V3, V3][]; radio: number; material: THREE.Material; sombra?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const o = new THREE.Object3D();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
    lista.forEach(([p, q], i) => {
      a.set(...p); b.set(...q); d.subVectors(b, a);
      const L = d.length();
      o.position.copy(a).addScaledVector(d, 0.5);
      o.quaternion.setFromUnitVectors(EJE_Y, d.normalize());
      o.scale.set(radio, L, radio);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [lista, radio]);
  return (
    <instancedMesh key={lista.length} ref={ref} args={[cilindro(1, 1, 1, 8), material, lista.length]} castShadow={sombra} receiveShadow frustumCulled={false} />
  );
}

// ───────────────────────────── torre de lanzamiento ─────────────────────────────

/** Torre de celosía de acero con plataforma y barandal. La cubierta queda en y = altura − ALTO_YUGO. */
export function TorreLanzamiento({ altura }: { altura: number }) {
  const m = useMateriales();
  const yCub = altura - ALTO_YUGO - 0.125;
  const { barras, barandal } = useMemo(() => {
    const n = Math.max(2, Math.round(yCub / 5));
    const h = yCub / n;
    const w0 = 4.0, w1 = 3.0;
    const ancho = (y: number) => w0 + (w1 - w0) * (y / yCub);
    const esq = (y: number): V3[] => { const w = ancho(y); return [[-w, y, -w], [w, y, -w], [w, y, w], [-w, y, w]]; };
    const b: [V3, V3][] = [];
    for (let i = 0; i <= n; i++) {
      const c = esq(i * h);
      for (let k = 0; k < 4; k++) b.push([c[k], c[(k + 1) % 4]]);   // anillos
      if (i < n) {
        const c2 = esq((i + 1) * h);
        for (let k = 0; k < 4; k++) {
          b.push([c[k], c2[k]]);                                      // montantes
          // diagonal por cada cara, alternando el sentido
          const k2 = (k + 1) % 4;
          if ((i + k) % 2 === 0) b.push([c[k], c2[k2]]); else b.push([c[k2], c2[k]]);
        }
      }
    }
    // barandal: 4 lados, postes cada 2 m y dos pasamanos
    const r: [V3, V3][] = [];
    const wc = 3.1, yb = yCub + 0.125;
    const lados: [V3, V3][] = [[[-wc, 0, -wc], [wc, 0, -wc]], [[wc, 0, wc], [-wc, 0, wc]], [[-wc, 0, wc], [-wc, 0, -wc]]];
    for (const [p, q] of lados) {
      for (const hh of [0.55, 1.1]) r.push([[p[0], yb + hh, p[2]], [q[0], yb + hh, q[2]]]);
      for (let s = 0; s < 3; s++) {
        const t = s / 3;
        const x = p[0] + (q[0] - p[0]) * t, z = p[2] + (q[2] - p[2]) * t;
        r.push([[x, yb, z], [x, yb + 1.1, z]]);
      }
    }
    return { barras: b, barandal: r };
  }, [yCub]);
  const pie = ALTO_YUGO;
  void pie;
  return (
    <group>
      <Barras lista={barras} radio={0.16} material={m.hierroPintado} />
      <Barras lista={barandal} radio={0.05} material={m.pintura('#c9a227')} />
      {/* cubierta de la plataforma */}
      <mesh position={[0, yCub, 0]} castShadow receiveShadow material={m.pintura('#4b535a')}>
        <boxGeometry args={[6.6, 0.25, 6.6]} />
      </mesh>
      {/* zapatas de concreto */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * 4.0, 0.3, sz * 4.0]} castShadow receiveShadow material={m.ceramica}>
          <boxGeometry args={[1.1, 0.6, 1.1]} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────────────────────── goniómetro ─────────────────────────────

/** Cuadrante de 0° a 90° (vértice en el origen, 0° hacia +X, 90° hacia +Y, mira a +Z). */
export function Cuadrante({ radio, ...g }: { radio: number } & React.ComponentProps<'group'>) {
  const m = useMateriales();
  const tex = useTexturaLienzo(1024, 1024, (ctx, W, H) => {
    const fam = familiaTexto();
    const cx = W / 2, cy = H / 2, R = W / 2 - 6;
    ctx.fillStyle = '#eef1f2'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1b2a33'; ctx.fillStyle = '#1b2a33';
    for (let d = 0; d <= 90; d++) {
      if (d % 5 !== 0 && d % 1 !== 0) continue;
      const a = (d * Math.PI) / 180;
      const l = d % 15 === 0 ? 0.11 : d % 5 === 0 ? 0.07 : 0.035;
      ctx.lineWidth = d % 15 === 0 ? 5 : d % 5 === 0 ? 3 : 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R, cy - Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a) * R * (1 - l), cy - Math.sin(a) * R * (1 - l));
      ctx.stroke();
      if (d % 15 === 0) {
        ctx.font = `700 ${W * 0.062}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(d), cx + Math.cos(a) * R * 0.8, cy - Math.sin(a) * R * 0.8);
      }
    }
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.985, 0, Math.PI / 2, true); ctx.stroke();
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.1 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const geo = useMemo(() => new THREE.CircleGeometry(radio, 48, 0, Math.PI / 2), [radio]);
  useEffect(() => () => geo.dispose(), [geo]);
  void m;
  return (
    <group {...g}>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
    </group>
  );
}

// ───────────────────────────── lanzador ─────────────────────────────

const PERFIL_CANON: [number, number][] = [
  [0, -1.3], [0.7, -1.3], [0.8, -1.15], [0.8, 3.7], [0.92, 3.75], [0.92, 4.0], [0.6, 4.0], [0.6, -1.0], [0, -1.0],
];
const PERFIL_COLLAR: [number, number][] = [[0.92, 3.1], [1.18, 3.1], [1.18, 3.65], [0.92, 3.65]];

/**
 * Lanzador de tubo sobre muñones con cuadrante graduado y fotopuerta anular en la
 * boca. El pivote está en el origen del grupo (= punto de salida del proyectil).
 * `vueloRef.current.dist` es la distancia del proyectil al pivote: enciende el LED
 * de la fotopuerta mientras la bola cruza la boca.
 */
export function Lanzador({ angulo, vueloRef }: { angulo: number; vueloRef: React.MutableRefObject<{ t: number; dist: number }> }) {
  const m = useMateriales();
  const geoCanon = useMemo(() => tornear(PERFIL_CANON, 40), []);
  const geoCollar = useMemo(() => tornear(PERFIL_COLLAR, 40), []);
  useEffect(() => () => { geoCanon.dispose(); geoCollar.dispose(); }, [geoCanon, geoCollar]);
  const ledMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a0f0f', emissive: '#ff2a1a', emissiveIntensity: 0, roughness: 0.3 }), []);
  useEffect(() => () => ledMat.dispose(), [ledMat]);
  const rad = (angulo * Math.PI) / 180;
  const retardo = useRef(0);
  useFrame((_, dt) => {
    const d = vueloRef.current.dist;
    // el LED se mantiene un instante tras el paso (si no, sólo parpadearía un fotograma)
    if (d > 0.01 && d < LARGO_CANON_ADELANTE + 1.6) retardo.current = 0.45; else retardo.current = Math.max(0, retardo.current - dt);
    ledMat.emissiveIntensity = retardo.current > 0 ? 4 : 0;
  });
  return (
    <group>
      {/* base y horquilla */}
      <mesh position={[0, -ALTO_YUGO + 0.1, 0]} material={m.hierroPintado} castShadow receiveShadow geometry={cajaRedondeada(2.8, 0.2, 2.6, 0.05, 2)} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, -ALTO_YUGO / 2 + 0.1, s * 1.15]} material={m.hierroPintado} castShadow receiveShadow geometry={cajaRedondeada(1.5, ALTO_YUGO + 0.5, 0.3, 0.06, 2)} />
      ))}
      {/* cuadrante graduado, detrás del cañón */}
      <Cuadrante radio={5.2} position={[0, 0, -1.5]} />
      {/* parte giratoria */}
      <group rotation={[0, 0, rad]}>
        {/* tubo: el eje de torno es Y; se gira para que apunte a +X local */}
        <group rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={geoCanon} material={m.acero} castShadow receiveShadow />
          <mesh geometry={geoCollar} material={m.plastico('#23272b', 0.5)} castShadow />
          <mesh position={[0, 3.65, 1.18]} geometry={esfera(0.12, 12)} material={ledMat} />
          <mesh position={[0, 3.65, -1.18]} geometry={cajaRedondeada(0.3, 0.18, 0.12, 0.03, 2)} material={m.plastico('#23272b', 0.5)} />
        </group>
        {/* muñones y aguja indicadora */}
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cilindro(0.2, 0.2, 3.4, 16)} material={m.cromo} castShadow position={[0, 0, -0.1]} />
        <mesh position={[2.7, 0, -1.4]} geometry={cajaRedondeada(5.4, 0.1, 0.05, 0.02, 1)} material={m.pintura('#c62828')} />
        <mesh position={[0, 0, 1.45]} geometry={cilindro(0.38, 0.38, 0.3, 20)} rotation={[Math.PI / 2, 0, 0]} material={m.acero} castShadow />
      </group>
    </group>
  );
}

// ───────────────────────────── muro de ladrillo ─────────────────────────────

function texLadrillo() {
  return texturaCompartida('ladrillo-fis01', 512, 256, (ctx, w, h) => {
    const rnd = azar(21);
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(0, 0, w, h);
    const filas = 5, cols = 4;
    const bw = w / cols, bh = h / filas;
    for (let f = 0; f < filas; f++) {
      const off = f % 2 ? bw / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + off, y = f * bh;
        const t = 0.82 + rnd() * 0.3;
        const r = Math.round(158 * t), g = Math.round(74 * t), b = Math.round(52 * t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 26; i++) ctx.fillRect(x + 4 + rnd() * (bw - 10), y + 4 + rnd() * (bh - 10), 2 + rnd() * 3, 1.5);
      }
    }
  }, { repetir: [1, 1] });
}

function geoMuro(ancho: number, alto: number, esp: number) {
  const g = new THREE.BoxGeometry(esp, alto, ancho);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  // tamaños de cada cara en la textura (4 m × 2 m por baldosa)
  const caras: [number, number][] = [[ancho / 4, alto / 2], [ancho / 4, alto / 2], [ancho / 4, esp / 2], [ancho / 4, esp / 2], [esp / 4, alto / 2], [esp / 4, alto / 2]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * caras[f][0], uv.getY(k) * caras[f][1]);
    }
  }
  uv.needsUpdate = true;
  return g;
}

/**
 * Muro de ladrillo cuya CARA FRONTAL (la que mira al cañón) está en x = obsX, que es
 * donde el motor del dominio decide el choque. Al lado, un mástil bandeado cada 5 m
 * para leer la altura.
 */
export function MuroLadrillo({ x, alto, ancho = 16, esp = 2 }: { x: number; alto: number; ancho?: number; esp?: number }) {
  const m = useMateriales();
  const tex = texLadrillo();
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const geo = useMemo(() => geoMuro(ancho, alto, esp), [ancho, alto, esp]);
  useEffect(() => () => geo.dispose(), [geo]);
  const bandas = useMemo(() => {
    const n = Math.ceil(alto / 5);
    return Array.from({ length: n }, (_, i) => ({ y0: i * 5, y1: Math.min(alto, (i + 1) * 5), rojo: i % 2 === 0 }));
  }, [alto]);
  return (
    <group position={[x + esp / 2, 0, 0]}>
      <mesh geometry={geo} material={mat} position={[0, alto / 2, 0]} castShadow receiveShadow />
      {/* albardilla de concreto */}
      <mesh position={[0, alto + 0.15, 0]} castShadow receiveShadow material={m.ceramica}>
        <boxGeometry args={[esp + 0.5, 0.3, ancho + 0.5]} />
      </mesh>
      {/* mástil de altura */}
      <group position={[-esp / 2 - 0.5, 0, ancho / 2 + 0.9]}>
        {bandas.map((b, i) => (
          <mesh key={i} position={[0, (b.y0 + b.y1) / 2, 0]} castShadow material={m.plastico(b.rojo ? '#c62828' : '#f4f4f4', 0.6)}>
            <cylinderGeometry args={[0.2, 0.2, b.y1 - b.y0, 12]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ───────────────────────────── diana en el suelo ─────────────────────────────

/** Diana pintada en el suelo (radio real del dominio) y un asta con bandera. */
export function DianaSuelo({ x, radio }: { x: number; radio: number }) {
  const m = useMateriales();
  const tex = useTexturaLienzo(512, 512, (ctx, W) => {
    const c = W / 2;
    const anillos = 5;
    for (let i = anillos; i >= 1; i--) {
      ctx.fillStyle = i % 2 ? '#c62828' : '#f4f4f4';
      ctx.beginPath(); ctx.arc(c, c, (i / anillos) * (c - 4), 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    for (let i = 1; i <= anillos; i++) { ctx.beginPath(); ctx.arc(c, c, (i / anillos) * (c - 4), 0, Math.PI * 2); ctx.stroke(); }
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group position={[x, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={mat} receiveShadow>
        <circleGeometry args={[radio, 64]} />
      </mesh>
      <group position={[0, 0, -radio - 1.2]}>
        <mesh position={[0, 4, 0]} castShadow material={m.aluminio}><cylinderGeometry args={[0.1, 0.12, 8, 10]} /></mesh>
        <mesh position={[1.1, 7.2, 0]} castShadow><boxGeometry args={[2.2, 1.3, 0.04]} /><meshStandardMaterial color="#c62828" roughness={0.8} side={THREE.DoubleSide} /></mesh>
      </group>
      <Etiqueta texto="Diana" position={[0, 9.8, -radio - 1.2]} tamano={1.7} color="#8c1c1c" fondo="rgba(255,255,255,0.85)" />
    </group>
  );
}

// ───────────────────────────── cinta métrica en el suelo ─────────────────────────────

/** Cinta métrica extendida sobre el suelo desde x = 0, con estacas rotuladas. */
export function CintaSuelo({ largo, paso, z = 4.4 }: { largo: number; paso: number; z?: number }) {
  const m = useMateriales();
  const px = 8192;
  const tex = useTexturaLienzo(px, 64, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f2c230'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#111';
    const pxm = W / largo;
    for (let x = 0; x <= largo + 1e-6; x += paso / 5) {
      const mayor = Math.abs(x / paso - Math.round(x / paso)) < 1e-6;
      ctx.fillRect(x * pxm - (mayor ? 2 : 1), 0, mayor ? 4 : 2, H * (mayor ? 0.55 : 0.3));
    }
    void fam;
  }, [largo, paso], { mipmaps: true });
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const marcas = useMemo(() => {
    const r: number[] = [];
    for (let x = paso; x <= largo + 1e-6; x += paso) r.push(Math.round(x));
    return r;
  }, [largo, paso]);
  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[largo / 2, 0.07, 0]} material={mat} receiveShadow>
        <planeGeometry args={[largo, 0.55]} />
      </mesh>
      {marcas.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.6, 0]} material={m.plastico('#1b2a33', 0.6)} castShadow><cylinderGeometry args={[0.08, 0.08, 1.2, 8]} /></mesh>
          <Etiqueta texto={`${x} m`} position={[0, 2.0, 0]} tamano={1.25} color="#142330" fondo="rgba(255,255,255,0.85)" />
        </group>
      ))}
    </group>
  );
}

// ───────────────────────────── manga de viento ─────────────────────────────

/** Manga de viento: apunta hacia donde sopla (+X si viento > 0) y cuelga más cuanto menos sopla. */
export function MangaViento({ viento, position }: { viento: number; position?: V3 }) {
  const m = useMateriales();
  const sock = useRef<THREE.Group>(null);
  const alto = 9;
  const mats = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#ef6c00', roughness: 0.8, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.8, side: THREE.DoubleSide }),
  ], []);
  useEffect(() => () => mats.forEach((x) => x.dispose()), [mats]);
  const v = Math.abs(viento);
  useFrame((st) => {
    const g = sock.current; if (!g) return;
    const caida = (1 - Math.min(1, v / 9)) * 1.35;
    const aleteo = Math.sin(st.clock.elapsedTime * (2 + v * 0.4)) * 0.05 * Math.min(1, v / 3);
    g.rotation.z = -(caida + aleteo);
  });
  const tramos = [0, 1, 2, 3];
  const L = 4.2, rg = 0.95, rp = 0.45;
  return (
    <group position={position}>
      <mesh position={[0, alto / 2, 0]} castShadow material={m.aluminio}><cylinderGeometry args={[0.1, 0.14, alto, 10]} /></mesh>
      <group position={[0, alto, 0]} rotation={[0, viento >= 0 ? 0 : Math.PI, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.aluminio}><torusGeometry args={[rg, 0.05, 6, 20]} /></mesh>
        <group ref={sock}>
          {tramos.map((i) => {
            const r0 = rg + (rp - rg) * (i / 4), r1 = rg + (rp - rg) * ((i + 1) / 4);
            return (
              <mesh key={i} position={[(i + 0.5) * (L / 4), 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={mats[i % 2]} castShadow>
                <cylinderGeometry args={[r1, r0, L / 4, 14, 1, true]} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}

// ───────────────────────────── estroboscopia de la trayectoria ─────────────────────────────

/**
 * Marcas de posición a intervalos iguales de tiempo (como una foto estroboscópica):
 * aparecen conforme el proyectil las pasa y se conservan al terminar el vuelo.
 */
export function Estroboscopia({ puntos, tVuelo, volando, vueloRef, radio = 0.4 }: {
  puntos: { t: number; p: V3 }[]; tVuelo: number; volando: boolean; vueloRef: React.MutableRefObject<{ t: number; dist: number }>; radio?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const marcas = useMemo(() => {
    const dt = tVuelo <= 4 ? 0.25 : tVuelo <= 8 ? 0.5 : tVuelo <= 16 ? 1 : tVuelo <= 40 ? 2 : 5;
    const r: { t: number; p: V3 }[] = [];
    let j = 0;
    for (let tm = 0; tm <= tVuelo + 1e-9; tm += dt) {
      while (j < puntos.length - 2 && puntos[j + 1].t < tm) j++;
      const a = puntos[j], b = puntos[Math.min(j + 1, puntos.length - 1)];
      const f = b.t > a.t ? Math.min(1, Math.max(0, (tm - a.t) / (b.t - a.t))) : 0;
      r.push({ t: tm, p: [a.p[0] + (b.p[0] - a.p[0]) * f, a.p[1] + (b.p[1] - a.p[1]) * f, a.p[2]] });
    }
    return r;
  }, [puntos, tVuelo]);
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const o = new THREE.Object3D();
    marcas.forEach((k, i) => { o.position.set(...k.p); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [marcas]);
  useFrame(() => {
    const im = ref.current; if (!im) return;
    if (!volando) { im.count = marcas.length; return; }
    const t = vueloRef.current.t;
    let n = 0;
    while (n < marcas.length && marcas[n].t <= t) n++;
    im.count = n;
  });
  return (
    <instancedMesh key={marcas.length} ref={ref} args={[esfera(radio, 10), undefined, marcas.length]} frustumCulled={false} castShadow>
      <meshStandardMaterial color="#e65100" roughness={0.5} />
    </instancedMesh>
  );
}

// ───────────────────────────── ambientes de otros mundos ─────────────────────────────

export interface AmbientePlanetaDef { suelo: string; horizonte: string; cenit: string; niebla: [number, number]; colorNiebla: string }
export const AMBIENTES: Record<string, AmbientePlanetaDef | undefined> = {
  luna: { suelo: '#8f8c86', horizonte: '#08080a', cenit: '#000000', niebla: [1000, 1300], colorNiebla: '#8f8c86' },
  marte: { suelo: '#a65e3a', horizonte: '#d8a57c', cenit: '#9c6a4a', niebla: [350, 1250], colorNiebla: '#d8a57c' },
  jupiter: { suelo: '#b88c5c', horizonte: '#d9b58a', cenit: '#7d5f43', niebla: [250, 1200], colorNiebla: '#d9b58a' },
};

/** Sustituye cielo y suelo del fondo "campo" por los de otro mundo (la Tierra no lo usa). */
export function AmbientePlaneta({ def }: { def: AmbientePlanetaDef }) {
  const cielo = useMemo(() => {
    const g = new THREE.SphereGeometry(3600, 32, 16);
    const p = g.getAttribute('position');
    const col = new Float32Array(p.count * 3);
    const zen = new THREE.Color(def.cenit), hor = new THREE.Color(def.horizonte), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 3600;
      c.copy(hor).lerp(zen, Math.pow(Math.max(0, y), 0.45));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [def]);
  const matCielo = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }), []);
  const matSuelo = useMemo(() => new THREE.MeshStandardMaterial({ color: def.suelo, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), [def]);
  const matBanda = useMemo(() => new THREE.MeshStandardMaterial({ color: def.suelo, roughness: 1, side: THREE.BackSide }), [def]);
  useEffect(() => () => { cielo.dispose(); matCielo.dispose(); matSuelo.dispose(); matBanda.dispose(); }, [cielo, matCielo, matSuelo, matBanda]);
  return (
    <group>
      <mesh geometry={cielo} material={matCielo} renderOrder={-9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} material={matSuelo} receiveShadow>
        <circleGeometry args={[1280, 64]} />
      </mesh>
      <mesh position={[0, 30, 0]} material={matBanda}>
        <cylinderGeometry args={[1300, 1300, 70, 48, 1, true]} />
      </mesh>
    </group>
  );
}
