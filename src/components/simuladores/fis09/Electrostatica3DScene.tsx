"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LabCanvas, Etiqueta, useCalidad, cilindro, geoCache, type Calidad } from '../_kit';
import { fuerzaCoulomb } from '@/domain/fisica';
import { cargasBanco, escalaEncuadre, fraccionFlecha, trayectoriaSonda, superposicionEn } from './campo';
import { CintasCampo, CapasEquipotenciales, CALIDAD_CAMPO } from './geometriaCampo';
import { materialLineas, materialCapas } from './materialesCampo';
import { Riel, Carro, materialEsfera, texturaHalo, GEO_ESFERA, COLOR_POS, COLOR_NEG } from './piezas';
import { X_CERO, Y_EJE, R_ESFERA, LARGO_RIEL, X_RIEL0 } from './constantes';
import type { RelojCampo } from './reloj';

/* ────────────────────────────────────────────────────────────────────────────
   Electrostatica3DScene — banco de Coulomb con su campo eléctrico (1 u = 1 dm).

   Dos esferas de Ø 1,8 cm sobre columnas aislantes; q₁ fija en el 0 de la regla y q₂ en
   r. Alrededor, el campo de las dos cargas CALCULADO (fis09/campo.ts):
     · líneas de campo integradas con RK4, 16 por μC sembradas uniformes en ángulo sólido
       (Gauss), con trazos que recorren cada línea en el sentido de E⃗;
     · superficies equipotenciales a ΔV constante (torneadas: el campo tiene simetría de
       revolución alrededor del eje) y la superficie V = 0 cuando las cargas son opuestas;
     · el par de fuerzas acción–reacción, de longitud logarítmica en |F| y SIN cifras.
   Todo lee el MISMO reloj (fis09/reloj.ts) que la gráfica del dock: r se desliza con un
   muelle crítico y el campo se recalcula en cada cuadro de la transición.

   Sin texto en la escena salvo los rótulos cortos de las cargas y las fuerzas (apagados
   por defecto; aparecen al pasar el ratón por una esfera o con «Rótulos»).
──────────────────────────────────────────────────────────────────────────── */

export interface CapasVisibles { lineas: boolean; equipotenciales: boolean; fuerzas: boolean; rotulos: boolean; sonda: boolean }

export interface ElectrostaticaSceneProps {
  reloj: RelojCampo;
  q1: number;                 // μC
  q2: number;                 // μC
  capas: CapasVisibles;
  onCalidad?: (c: Calidad) => void;
  /** se pide volver al encuadre automático (botón «Encuadrar») */
  encuadre?: number;
}

const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

// ───────────────────────────── reloj ─────────────────────────────

/** Avanza el reloj ÚNICO al principio de cada cuadro (prioridad −20: antes que nadie). */
function MotorReloj({ reloj }: { reloj: RelojCampo }) {
  useEffect(() => { reloj.escenaActiva = true; return () => { reloj.escenaActiva = false; }; }, [reloj]);
  useFrame((_, dt) => reloj.paso(dt), -20);
  return null;
}

// ───────────────────────────── estudio ─────────────────────────────

/** Fondo del estudio (degradado oscuro) y cubierta de resina negra que se funde con él. */
function Estudio() {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (!g) return;
    const grad = g.createRadialGradient(256, 210, 20, 256, 300, 420);
    grad.addColorStop(0, '#1b2738');
    grad.addColorStop(0.45, '#111a27');
    grad.addColorStop(1, '#070b12');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    // grano muy fino (±1,5 niveles) para que el degradado no haga escalones
    const img = g.getImageData(0, 0, 512, 512);
    let s = 9182;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const d = ((s >> 16) & 3) - 1.5;
      img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const antes = scene.background;
    scene.background = tex;
    return () => { scene.background = antes; tex.dispose(); };
  }, [scene]);
  const alfa = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.45, '#ffffff'); grad.addColorStop(1, '#000000');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#0e131a', roughness: 0.62, metalness: 0.0, clearcoat: 0.12, clearcoatRoughness: 0.4, envMapIntensity: 0.18,
    alphaMap: alfa, transparent: true, depthWrite: true, name: 'fis09-mesa',
  }), [alfa]);
  useEffect(() => () => { mat.dispose(); alfa.dispose(); }, [mat, alfa]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[X_RIEL0 + LARGO_RIEL / 2, -0.002, -0.4]} material={mat} receiveShadow>
      <circleGeometry args={[11, 72]} />
    </mesh>
  );
}

// ───────────────────────────── esferas sobre sus carros ─────────────────────────────

function CarroConCarga({ reloj, indice, q, rotulo }: { reloj: RelojCampo; indice: 0 | 1; q: number; rotulo: boolean }) {
  const calidad = useCalidad();
  const grupo = useRef<THREE.Group>(null);
  const [encima, setEncima] = useState(false);
  const mat = useMemo(() => materialEsfera(q, calidad === 'alta'), [q, calidad]);
  useEffect(() => () => mat.dispose(), [mat]);
  const halo = useMemo(() => {
    const m = new THREE.SpriteMaterial({ map: texturaHalo(), color: new THREE.Color(q > 0 ? COLOR_POS : COLOR_NEG).multiplyScalar(1.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
    return m;
  }, [q]);
  useEffect(() => () => halo.dispose(), [halo]);
  const aq = Math.min(6, Math.abs(q));
  useFrame(() => {
    const g = grupo.current; if (!g) return;
    g.position.x = X_CERO + (indice === 0 ? 0 : reloj.vis.r / 10);
  });
  const tamHalo = R_ESFERA * (3.4 + 0.45 * aq);
  const L = escalaEncuadre(reloj.objetivo.r);
  return (
    <group ref={grupo} position={[X_CERO + (indice === 0 ? 0 : reloj.vis.r / 10), 0, 0]}>
      <Carro />
      <mesh geometry={GEO_ESFERA()} material={mat} position={[0, Y_EJE, 0]} castShadow
        onPointerOver={(e) => { e.stopPropagation(); setEncima(true); }} onPointerOut={() => setEncima(false)} />
      <sprite material={halo} position={[0, Y_EJE, 0]} scale={[tamHalo, tamHalo, 1]} renderOrder={4} />
      <pointLight position={[0, Y_EJE, 0.02]} color={q > 0 ? COLOR_POS : COLOR_NEG} intensity={0.35 + 0.12 * aq} distance={1.1} decay={2} />
      {(rotulo || encima) && (
        // q₁ hacia la izquierda y q₂ hacia la derecha: a r = 2 cm no se pisan; por encima de la flecha de fuerza
        <Etiqueta texto={`q_${indice + 1} = ${fmtQ(q)}`} position={[(indice === 0 ? -0.4 : 0.4) * R_ESFERA, Y_EJE + R_ESFERA + 0.03 + 0.022 * L, 0]} tamano={0.0078 * L}
          ancla={[indice === 0 ? 1 : 0, 0]} color="#f4f7fb" fondo="rgba(10,16,26,0.78)" siempreVisible />
      )}
    </group>
  );
}

// ───────────────────────────── campo: líneas y equipotenciales ─────────────────────────────

function Campo({ reloj, capas }: { reloj: RelojCampo; capas: CapasVisibles }) {
  const calidad = useCalidad();
  const cfg = CALIDAD_CAMPO[calidad];
  const gl = useThree((s) => s.gl);
  const cintas = useMemo(() => new CintasCampo(cfg.maxLineas, cfg.puntos), [cfg]);
  const pompas = useMemo(() => new CapasEquipotenciales(cfg.maxCapas, cfg.perfil, cfg.segmentos), [cfg]);
  const matL = useMemo(() => materialLineas(), []);
  const matC = useMemo(() => materialCapas(), []);
  useEffect(() => () => { cintas.dispose(); pompas.dispose(); }, [cintas, pompas]);
  useEffect(() => () => { matL.dispose(); matC.dispose(); }, [matL, matC]);
  const hecho = useRef({ version: -1, costeMs: 0, saltar: false });
  const res = useMemo(() => new THREE.Vector2(), []);

  useFrame(() => {
    const h = hecho.current;
    const asentado = reloj.vis.r === reloj.objetivo.r;
    if (h.version !== reloj.versionCampo) {
      // si un recálculo cuesta más de ~14 ms, durante la transición se hace uno de cada dos cuadros
      if (h.saltar && !asentado) { h.saltar = false; }
      else {
        const t0 = performance.now();
        const c = cargasBanco(reloj.vis.q1, reloj.vis.q2, reloj.vis.r);
        cintas.actualizar(c, reloj.vis.r);
        pompas.actualizar(c, reloj.vis.r, cfg.rejilla);
        h.version = reloj.versionCampo;
        h.costeMs = performance.now() - t0;
        h.saltar = h.costeMs > 14;
      }
    }
    const L = escalaEncuadre(reloj.vis.r);
    gl.getDrawingBufferSize(res);
    const u = matL.uniforms;
    u.uT.value = reloj.t;
    u.uRes.value.copy(res);
    u.uAncho.value = 1.6 * gl.getPixelRatio();
    u.uLambda.value = 0.62 * L;
    u.uVel.value = 0.32 * L;
    u.uFlujo.value = reloj.pausa ? 0.55 : 1;
    // crecimiento: el frente de cada línea avanza desde su carga (suave al principio)
    const rv = reloj.revelado;
    u.uRev.value = rv >= 1 ? 1e6 : (1 - Math.pow(1 - rv, 2.2)) * (cintas.arcoMax * 1.02 + 1.5);
    matC.uniforms.uOpac.value = Math.min(1, rv * 1.3);
  });

  return (
    <group>
      <mesh geometry={pompas.geo} material={matC} visible={capas.equipotenciales} renderOrder={5} frustumCulled={false} />
      <mesh geometry={cintas.geo} material={matL} visible={capas.lineas} renderOrder={6} frustumCulled={false} />
      <DiagnosticoCampo cintas={cintas} pompas={pompas} hecho={hecho} />
    </group>
  );
}

// ───────────────────────────── fuerzas ─────────────────────────────

const MAT_FLECHA = () => geoCache('fis09-cono', () => new THREE.ConeGeometry(1, 1, 24));

function Flechas({ reloj, q1, q2, visible, rotulos }: { reloj: RelojCampo; q1: number; q2: number; visible: boolean; rotulos: boolean }) {
  const a = useRef<THREE.Group>(null), b = useRef<THREE.Group>(null);
  const la = useRef<THREE.Group>(null), lb = useRef<THREE.Group>(null);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#ffb547', emissive: '#ff9a1f', emissiveIntensity: 0.55, roughness: 0.32, metalness: 0.1, clearcoat: 0.6, name: 'fis09-flecha' }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const atrae = q1 * q2 < 0;
  useFrame(() => {
    const r = reloj.vis.r;
    const L = escalaEncuadre(r);
    const F = fuerzaCoulomb(q1, q2, r);
    const largo = (fraccionFlecha(F) * L) / 10;          // u
    const grosor = 0.0013 * L;                           // u: radio del vástago (1,3 mm a r = 10 cm)
    const dy = R_ESFERA + 0.012 * L;
    // sobre q₁ (arriba) y sobre q₂ (abajo); sentido según atracción/repulsión
    const ponerFlecha = (g: THREE.Group | null, et: THREE.Group | null, x0: number, y: number, sentido: number) => {
      if (!g) return;
      g.position.set(x0, y, 0.0);
      g.rotation.set(0, 0, sentido > 0 ? -Math.PI / 2 : Math.PI / 2);
      const cuerpo = g.children[0] as THREE.Mesh, cabeza = g.children[1] as THREE.Mesh;
      const lc = Math.min(largo * 0.34, grosor * 6.5);
      cuerpo.scale.set(grosor, Math.max(1e-4, largo - lc), grosor);
      cuerpo.position.set(0, (largo - lc) / 2, 0);
      cabeza.scale.set(grosor * 2.7, lc, grosor * 2.7);
      cabeza.position.set(0, largo - lc / 2, 0);
      if (et) et.position.set(x0 + sentido * (largo + 0.005 * L), y, 0);
    };
    const x1 = X_CERO, x2 = X_CERO + r / 10;
    ponerFlecha(a.current, la.current, x1, Y_EJE + dy, atrae ? 1 : -1);
    ponerFlecha(b.current, lb.current, x2, Y_EJE - dy, atrae ? -1 : 1);
  });
  const L = escalaEncuadre(reloj.objetivo.r);
  return (
    <group visible={visible}>
      {[a, b].map((ref, i) => (
        <group key={i} ref={ref}>
          <mesh geometry={cilindro(1, 1, 1, 16)} material={mat} castShadow />
          <mesh geometry={MAT_FLECHA()} material={mat} castShadow />
        </group>
      ))}
      {rotulos && (
        <>
          {/* «F sobre q₁» en vez de F₁₂/F₂₁: los libros no coinciden en el orden de los índices */}
          <group ref={la}><Etiqueta texto="F sobre q_1" tamano={0.0062 * L} ancla={[atrae ? 0 : 1, 0.5]} color="#ffcf8a" fondo="rgba(10,16,26,0.7)" siempreVisible /></group>
          <group ref={lb}><Etiqueta texto="F sobre q_2" tamano={0.0062 * L} ancla={[atrae ? 1 : 0, 0.5]} color="#ffcf8a" fondo="rgba(10,16,26,0.7)" siempreVisible /></group>
        </>
      )}
    </group>
  );
}

// ───────────────────────────── sonda de superposición ─────────────────────────────

/** Una flecha (vástago + punta) que se reorienta cada cuadro; origen en la base, eje +Y. */
function useFlecha() {
  return useRef<THREE.Group>(null);
}
const EJE_Y = new THREE.Vector3(0, 1, 0);
function orientarFlecha(g: THREE.Group | null, x: number, y: number, dx: number, dy: number, grosor: number) {
  if (!g) return;
  const largo = Math.hypot(dx, dy);
  g.visible = largo > 1e-4;
  if (!g.visible) return;
  g.position.set(x, y, 0.004);
  g.quaternion.setFromUnitVectors(EJE_Y, new THREE.Vector3(dx / largo, dy / largo, 0));
  const lc = Math.min(largo * 0.4, grosor * 7);
  const cuerpo = g.children[0] as THREE.Mesh, cabeza = g.children[1] as THREE.Mesh;
  cuerpo.scale.set(grosor, Math.max(1e-4, largo - lc), grosor);
  cuerpo.position.set(0, (largo - lc) / 2, 0);
  cabeza.scale.set(grosor * 2.8, lc, grosor * 2.8);
  cabeza.position.set(0, largo - lc / 2, 0);
}

/**
 * Sonda: una carga de prueba que recorre una elipse alrededor del par (en el plano del
 * dibujo) y muestra E⃗₁ y E⃗₂ (del color de su carga) y su suma E⃗ = E⃗₁ + E⃗₂ (blanca),
 * con el paralelogramo a trazos. Las tres flechas comparten escala LINEAL en cada punto
 * (si no, el paralelogramo no cerraría): comparan entre sí, no un punto con otro. La
 * blanca es tangente a la línea de campo que pasa por la sonda.
 */
function Sonda({ reloj, q1, q2, rotulo }: { reloj: RelojCampo; q1: number; q2: number; rotulo: boolean }) {
  const f1 = useFlecha(), f2 = useFlecha(), f = useFlecha();
  const bola = useRef<THREE.Mesh>(null);
  const et = useRef<THREE.Group>(null);
  const lado1 = useRef<THREE.Mesh>(null), lado2 = useRef<THREE.Mesh>(null);
  const mats = useMemo(() => {
    const m = (col: string, e: number) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: e, roughness: 0.4, transparent: true, opacity: 0.95, name: 'fis09-sonda' });
    return { a: m(q1 > 0 ? '#ff7a5c' : '#6aa6ff', 0.5), b: m(q2 > 0 ? '#ff7a5c' : '#6aa6ff', 0.5), t: m('#ffffff', 0.9), bola: m('#f6f2e8', 0.7) };
  }, [q1, q2]);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); }, [mats]);
  const matTrazo = useMemo(() => new THREE.MeshBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.45, depthWrite: false, name: 'fis09-sonda-trazo' }), []);
  useEffect(() => () => matTrazo.dispose(), [matTrazo]);
  useFrame(() => {
    const r = reloj.vis.r;
    const L = escalaEncuadre(r);
    const [s, rho] = trayectoriaSonda(r, 0.5 + reloj.t * 0.42);
    const sp = superposicionEn(cargasBanco(q1, q2, r), s, rho, 0.3 * L);
    const x = X_CERO + s / 10, y = Y_EJE + rho / 10;
    const g = 0.0011 * L;
    if (bola.current) { bola.current.position.set(x, y, 0.004); bola.current.scale.setScalar(0.004 * L); }
    orientarFlecha(f1.current, x, y, sp.f1[0] / 10, sp.f1[1] / 10, g * 0.8);
    orientarFlecha(f2.current, x, y, sp.f2[0] / 10, sp.f2[1] / 10, g * 0.8);
    orientarFlecha(f.current, x, y, sp.f[0] / 10, sp.f[1] / 10, g * 1.15);
    // paralelogramo: de la punta de E₁ a la de E y de la punta de E₂ a la de E
    const tramo = (m: THREE.Mesh | null, ax: number, ay: number, bx: number, by: number) => {
      if (!m) return;
      const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy);
      m.visible = l > 1e-4;
      m.position.set((ax + bx) / 2, (ay + by) / 2, 0.003);
      m.rotation.set(0, 0, Math.atan2(dy, dx));
      m.scale.set(l, g * 0.5, 1);
    };
    tramo(lado1.current, x + sp.f1[0] / 10, y + sp.f1[1] / 10, x + sp.f[0] / 10, y + sp.f[1] / 10);
    tramo(lado2.current, x + sp.f2[0] / 10, y + sp.f2[1] / 10, x + sp.f[0] / 10, y + sp.f[1] / 10);
    // el rótulo va hacia fuera del par (lejos de los rótulos de q₁ y q₂, que están junto al eje);
    // si E⃗ también apunta hacia fuera, a un costado de E⃗ para que la flecha blanca no lo tache
    if (et.current) {
      let dx = s - r / 2, dy = rho;
      const dm = Math.hypot(dx, dy) || 1; dx /= dm; dy /= dm;
      const fm = Math.hypot(sp.f[0], sp.f[1]) || 1, ux = sp.f[0] / fm, uy = sp.f[1] / fm;
      if (dx * ux + dy * uy > 0.6) {
        const px = -uy, py = ux, sg = px * dx + py * dy >= 0 ? 1 : -1;
        dx = px * sg; dy = py * sg;
      }
      et.current.position.set(x + dx * 0.008 * L, y + dy * 0.008 * L, 0.01);
      const spr = et.current.children[0] as THREE.Sprite | undefined;
      if (spr?.isSprite) spr.center.set(dx > 0.35 ? 0 : dx < -0.35 ? 1 : 0.5, dy > 0 ? 0 : 1);
    }
  });
  const L0 = escalaEncuadre(reloj.objetivo.r);
  return (
    <group>
      <mesh ref={bola} geometry={esferaSonda()} material={mats.bola} />
      {([[f1, mats.a], [f2, mats.b], [f, mats.t]] as const).map(([ref, m], i) => (
        <group key={i} ref={ref}>
          <mesh geometry={cilindro(1, 1, 1, 10)} material={m} />
          <mesh geometry={MAT_FLECHA()} material={m} />
        </group>
      ))}
      <mesh ref={lado1} geometry={planoUnidad()} material={matTrazo} />
      <mesh ref={lado2} geometry={planoUnidad()} material={matTrazo} />
      {rotulo && (
        <group ref={et}><Etiqueta texto="E = E_1 + E_2" tamano={0.0066 * L0} ancla={[0.5, 0]} color="#ffffff" fondo="rgba(10,16,26,0.7)" siempreVisible /></group>
      )}
    </group>
  );
}
const esferaSonda = () => geoCache('fis09-sonda', () => new THREE.SphereGeometry(1, 20, 14));
const planoUnidad = () => geoCache('fis09-plano1', () => new THREE.PlaneGeometry(1, 1));

// ───────────────────────────── cámara ─────────────────────────────

const DIR_INICIAL = new THREE.Vector3(0.34, 0.3, 1).normalize();

/**
 * Encuadre automático: la caja del banco + el campo visible para la r ACTUAL del reloj,
 * mirando desde la dirección que tenga la cámara (el alumno puede girarla). La distancia
 * es la mínima que mete las 8 esquinas en pantalla (cerrada, sin iterar) y se alcanza con
 * un suavizado exponencial: nada salta. Si el alumno arrastra la cámara, el encuadre
 * automático se detiene hasta el siguiente cambio de r o de tamaño.
 */
function RigCamara({ reloj, encuadre }: { reloj: RelojCampo; encuadre: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const estado = useRef({ activo: 1.4, rUlt: NaN, w: 0, h: 0, primero: true, enc: encuadre, volver: false });
  useEffect(() => {
    if (!controls) return;
    const parar = () => { estado.current.activo = 0; };
    controls.addEventListener('start', parar);
    return () => controls.removeEventListener('start', parar);
  }, [controls]);
  const tmp = useMemo(() => ({ c: new THREE.Vector3(), dir: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), p: new THREE.Vector3(), objetivo: new THREE.Vector3() }), []);
  useFrame((_, dt) => {
    const e = estado.current;
    const r = reloj.vis.r;
    if (r !== e.rUlt || size.width !== e.w || size.height !== e.h || encuadre !== e.enc) {
      // «Encuadrar»: vuelve a la vista de 3/4 girando suavemente (sin saltos)
      if (encuadre !== e.enc) { e.enc = encuadre; e.volver = true; }
      e.activo = e.volver ? 1.6 : 0.9; e.rUlt = r; e.w = size.width; e.h = size.height;
    }
    if (e.activo <= 0) return;
    e.activo -= dt;
    const L = escalaEncuadre(r);
    const x0 = X_CERO - (0.8 * L) / 10, x1 = X_CERO + (r + 0.8 * L) / 10;
    // por debajo de r = 10 cm el campo encoge con L y las columnas dominarían el cuadro: el borde
    // inferior sube hasta medio riel (a r ≤ 7 cm) para que el par y su campo ganen tamaño
    const y0 = 0.02 + 0.55 * Math.min(1, Math.max(0, (10 - L) / 3)), y1 = Y_EJE + (0.74 * L) / 10;
    const z0 = -0.36, z1 = 0.32;
    tmp.c.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const tgt = controls ? (controls as unknown as { target: THREE.Vector3 }).target : tmp.objetivo;
    const kGiro = 1 - Math.exp(-dt / 0.22);
    if (e.primero) tmp.dir.copy(DIR_INICIAL);
    else {
      tmp.dir.copy(camera.position).sub(tgt).normalize();
      if (e.volver) {
        tmp.dir.lerp(DIR_INICIAL, kGiro).normalize();
        if (tmp.dir.angleTo(DIR_INICIAL) < 0.002) e.volver = false;
      }
    }
    if (!(tmp.dir.lengthSq() > 0.5)) tmp.dir.copy(DIR_INICIAL);
    tmp.right.crossVectors(tmp.dir, camera.up).normalize().negate();
    tmp.up.crossVectors(tmp.dir, tmp.right).negate().normalize();
    const aspect = size.width / Math.max(1, size.height);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), tanH = tanV * aspect;
    const margen = 0.92;
    let D = 0;
    for (let i = 0; i < 8; i++) {
      tmp.p.set(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0).sub(tmp.c);
      const x = Math.abs(tmp.p.dot(tmp.right)), y = Math.abs(tmp.p.dot(tmp.up)), z = tmp.p.dot(tmp.dir);
      D = Math.max(D, z + Math.max(x / (margen * tanH), y / (margen * tanV)));
    }
    const k = e.primero ? 1 : 1 - Math.exp(-dt / 0.14);
    e.primero = false;
    tgt.lerp(tmp.c, k);
    const dActual = camera.position.distanceTo(tgt);
    const d = dActual + (D - dActual) * k;
    camera.position.copy(tgt).addScaledVector(tmp.dir, d);
    camera.near = Math.max(0.02, d / 80); camera.far = d * 40;
    camera.updateProjectionMatrix();
    camera.lookAt(tgt);
    controls?.update();
  }, -5);
  return null;
}

// ───────────────────────────── posproceso y diagnóstico ─────────────────────────────

const TONO_NEUTRO = 8; // ToneMappingMode.NEUTRAL de postprocessing (no lo re-exporta @react-three/postprocessing)

/** Bloom moderado sólo en lo que emite (umbral alto) y tono neutro; sólo en calidad alta. */
function Posproceso() {
  const calidad = useCalidad();
  if (calidad !== 'alta') return null;
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.62} luminanceThreshold={0.86} luminanceSmoothing={0.2} radius={0.62} />
      <ToneMapping mode={TONO_NEUTRO} />
    </EffectComposer>
  );
}

const DEV = process.env.NODE_ENV !== 'production';

/** SÓLO en desarrollo: `window.__fis09.salud()` (la sonda de Playwright lo lee). */
function DiagnosticoCampo({ cintas, pompas, hecho }: { cintas: CintasCampo; pompas: CapasEquipotenciales; hecho: React.MutableRefObject<{ costeMs: number }> }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const medida = useRef({ llamadas: 0, triangulos: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles;
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -10);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __fis09?: unknown };
    w.__fis09 = {
      salud() {
        let normalesCero = 0, mallas = 0;
        scene.traverse((o) => {
          const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
          if (!g || !(o as THREE.Mesh).isMesh) return;
          mallas++;
          const n = g.getAttribute('normal');
          if (!n) return;
          for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
        });
        const m = medida.current;
        return {
          llamadas: m.llamadas, triangulos: m.triangulos, mallas, normalesCero, fps: Math.round(m.fps * 10) / 10,
          lineas: cintas.lineas.length, capas: pompas.capas.length, recalculoMs: Math.round(hecho.current.costeMs * 10) / 10,
        };
      },
      /** tiempo medio (ms) de recalcular líneas y equipotenciales para (q₁, q₂, r) */
      medir(q1: number, q2: number, r: number, n = 10) {
        const c = cargasBanco(q1, q2, r);
        let t0 = performance.now();
        for (let i = 0; i < n; i++) cintas.actualizar(c, r);
        const tl = (performance.now() - t0) / n;
        t0 = performance.now();
        for (let i = 0; i < n; i++) pompas.actualizar(c, r, CALIDAD_CAMPO[cintas.P > 100 ? 'alta' : 'media'].rejilla);
        const tc = (performance.now() - t0) / n;
        return { lineasMs: Math.round(tl * 10) / 10, capasMs: Math.round(tc * 10) / 10, lineas: cintas.lineas.length, capas: pompas.capas.length };
      },
    };
    return () => { delete w.__fis09; };
  }, [gl, scene, cintas, pompas, hecho]);
  return null;
}

function InformarCalidad({ onCalidad }: { onCalidad?: (c: Calidad) => void }) {
  const calidad = useCalidad();
  useEffect(() => { onCalidad?.(calidad); }, [calidad, onCalidad]);
  return null;
}

// ───────────────────────────── escena ─────────────────────────────

export default function Electrostatica3DScene({ reloj, q1, q2, capas, onCalidad, encuadre = 0 }: ElectrostaticaSceneProps) {
  const c0 = new THREE.Vector3(X_CERO + 0.5, 1.0, 0);
  const p0 = c0.clone().addScaledVector(DIR_INICIAL, 4.2);
  return (
    <div className="h-full w-full" data-escena-fis09="">
      <LabCanvas
        fondo="laboratorio"
        mesa={false}
        camara={{ posicion: [p0.x, p0.y, p0.z], objetivo: [c0.x, c0.y, c0.z], fov: 30 }}
        controles={{ minDistancia: 0.35, maxDistancia: 14, maxPolar: 1.52, cajaObjetivo: [[-3.5, 0, -1.5], [3.5, 3, 1.5]] }}
      >
        <MotorReloj reloj={reloj} />
        <InformarCalidad onCalidad={onCalidad} />
        <Estudio />
        <Riel />
        <CarroConCarga reloj={reloj} indice={0} q={q1} rotulo={capas.rotulos} />
        <CarroConCarga reloj={reloj} indice={1} q={q2} rotulo={capas.rotulos} />
        <Campo reloj={reloj} capas={capas} />
        <Flechas reloj={reloj} q1={q1} q2={q2} visible={capas.fuerzas} rotulos={capas.rotulos} />
        {capas.sonda && <Sonda reloj={reloj} q1={q1} q2={q2} rotulo={capas.rotulos} />}
        <RigCamara reloj={reloj} encuadre={encuadre} />
        <Posproceso />
      </LabCanvas>
    </div>
  );
}
