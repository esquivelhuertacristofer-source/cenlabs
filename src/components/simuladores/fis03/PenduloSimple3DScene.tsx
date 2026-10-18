"use client";
/**
 * F3 · Péndulo simple — el banco en 3D (R3F), 1 u = 1 cm.
 *
 *   Ciclorama oscuro de estudio; riel de pared con carro, brazo y mordaza (el pivote);
 *   transportador grabado con el índice del ángulo de suelta; esfera de latón con cáncamo; y
 *   la fotopuerta en U con su haz. Sobre el mismo plano: la ESTELA de la esfera (cinta que se
 *   apaga en medio periodo, con destellos estroboscópicos a intervalos de tiempo iguales:
 *   juntos en los extremos, separados abajo, donde va más rápida) y el péndulo LINEAL
 *   fantasma (sen θ ≈ θ), que con amplitud grande se adelanta al real.
 *
 * RELOJ ÚNICO. `reloj.paso(dt)` corre aquí en un useFrame de prioridad −1 (antes que nada se
 * dibuje): integra la ecuación completa con RK4. El giro de la esfera, el fantasma, la
 * estela, el testigo de la fotopuerta y el dock leen ese mismo estado. Ningún useFrame con
 * prioridad > 0 (sin compositor, r3f dejaría de dibujar y el lienzo saldría negro).
 *
 * Nada de cifras en 3D: el grabado del transportador es la única escala, como en el banco real.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ControlesBanco } from '../_kit';
import type { RelojPendulo } from './reloj';
import { radioEsfera, periodoExacto, GRAD } from './pendulo';
import { crearMateriales, materialEstela, type MatsPendulo } from './materiales';
import {
  U, Y_BOLA, Z_PARED, SOBRE_PIVOTE, R_TRANSP, Z_TRANSP, SEMI_U,
  alturaPivote, amarre, Estudio, Soporte, Transportador, Esfera, Fotopuerta, contarNormalesCero,
} from './aparato';
import { cifra } from './formato';

export type Calidad = 'alta' | 'media';

export interface PenduloSceneProps {
  reloj: RelojPendulo;
  /** longitud (m) */
  L: number;
  /** masa de la esfera (kg) */
  masa: number;
  /** ángulo de suelta (rad): índice del transportador y encuadre */
  theta0: number;
  fantasma: boolean;
  estela: boolean;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** el aparato entero o el primer plano de la esfera cruzando la fotopuerta */
  vista?: VistaF3;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  onListo?: () => void;
}

export type VistaF3 = 'conjunto' | 'fotopuerta';

export interface RotuloF3 { id: string; texto: string; ancla: () => THREE.Vector3 }

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#080b10';

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.06;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(250, 200, 10, 256, 250, 430);
      grad.addColorStop(0, '#1a232d'); grad.addColorStop(0.55, '#0e141b'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      // tramado mínimo contra las bandas del degradado
      const img = g.getImageData(0, 0, 512, 512);
      let s = 4073;
      for (let i = 0; i < img.data.length; i += 4) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const d = ((s >> 16) & 3) - 1.5;
        img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
      }
      g.putImageData(img, 0, 0);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    scene.background = tex ?? new THREE.Color(FONDO);
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.62;
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); tex?.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

function Luces({ calidad, H }: { calidad: Calidad; H: number }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  const S = H + 60;
  const posClave: [number, number, number] = [-0.55 * S - 40, 1.25 * S + 40, 0.95 * S + 90];
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    const d = Math.hypot(posClave[0], posClave[1] - H * 0.45, posClave[2] + 10);
    l.shadow.bias = -0.0002; l.shadow.normalBias = 0.6; l.shadow.radius = 7;
    l.shadow.camera.near = Math.max(20, d - 2.2 * S); l.shadow.camera.far = d + 2.2 * S; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, H * 0.45, -12); l.target.updateMatrixWorld();
  }, [H]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <hemisphereLight args={['#b9c9da', '#07080b', 0.3]} />
      {/* clave cálida de estudio, delante a la izquierda: charco de luz y sombra suave en el ciclorama */}
      <spotLight ref={clave} position={posClave} angle={0.5} penumbra={0.85} decay={0} intensity={2.25} color="#fff0dc" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta la esfera, el hilo y el riel */}
      <directionalLight position={[0.8 * S, 0.75 * S, -1.1 * S]} intensity={1.0} color="#cfe0ff" />
      <directionalLight position={[0.9 * S, 0.35 * S, 0.8 * S]} intensity={0.32} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6;
/** Bloom sólo en lo que emite (estela, destellos, testigo: HDR > 1) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1.25} luminanceSmoothing={0.2} radius={0.55} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.5} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 1, 5000);
  const tgt = objetivo.clone();
  const v = new THREE.Vector3();
  const caja = (d: number) => {
    cam.position.copy(tgt).addScaledVector(dir, d);
    cam.up.set(0, 1, 0); cam.lookAt(tgt);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of puntos) { v.copy(p).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  let d = 300;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 20, hi = 4000;
    for (let i = 0; i < 46; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m; }
    d = hi;
    const b = caja(d);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const medioAlto = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2), medioAncho = medioAlto * aspecto;
    const derecha = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(derecha, cx * medioAncho).addScaledVector(arriba, cy * medioAlto);
  }
  return { pos: tgt.clone().addScaledVector(dir, d), objetivo: tgt };
}

const DIR_CAMARA = (() => {
  const az = 15 * GRAD, el = 6 * GRAD;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

/**
 * Lo que manda en el encuadre: el péndulo en sus dos extremos, la mordaza con el transportador
 * y la U de la fotopuerta (su pie y el suelo quedan por debajo: el objeto es el péndulo).
 */
function puntosEncuadre(Lcm: number, r: number, amp: number): THREE.Vector3[] {
  const H = Lcm + Y_BOLA;
  const s = Math.sin(amp), c = Math.cos(amp);
  const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const pts = [
    P(0, H + SOBRE_PIVOTE + 1.5, 0),
    P(0, Y_BOLA - 11.2, SEMI_U + 2.4), P(0, Y_BOLA - 11.2, -(SEMI_U + 2.4)),
  ];
  for (const sg of [-1, 1]) {
    pts.push(P(sg * (Lcm * s + r), H - Lcm * c, 0));
    pts.push(P(sg * Lcm * s, H - Lcm * c - r, 0));
    pts.push(P(sg * R_TRANSP, H, Z_TRANSP));
  }
  return pts;
}

/** Primer plano: la esfera en sus extremos (o ±18 cm si la amplitud es pequeña) y la U de la fotopuerta. */
function puntosFotopuerta(Lcm: number, r: number, amp: number): THREE.Vector3[] {
  const H = Lcm + Y_BOLA;
  const s = Math.sin(amp), c = Math.cos(amp);
  const x = Math.max(18, Lcm * s + r);
  const yTop = Math.max(Y_BOLA + r + 10, H - Lcm * c + r + 4);
  const P = (a: number, b: number, z: number) => new THREE.Vector3(a, b, z);
  return [P(-x, yTop, 0), P(x, yTop, 0), P(-x, Y_BOLA - 12, 0), P(x, Y_BOLA - 12, 0), P(0, Y_BOLA - 12, SEMI_U + 2.4), P(0, Y_BOLA - 12, -(SEMI_U + 2.4))];
}

const DIR_FOTOPUERTA = (() => {
  // de tres cuartos: se ven los dos brazos de la U y el haz entre ellos
  const az = 32 * GRAD, el = 9 * GRAD;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ Lcm, r, amp, reducido, encuadre, vista }: { Lcm: number; r: number; amp: number; reducido: boolean; encuadre: number; vista: VistaF3 }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const primera = useRef(true);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimo = useRef({ encuadre, vista });
  // no re-encuadrar por cada grado ni por cada centímetro
  const ampR = Math.round(amp / (2 * GRAD)) * 2 * GRAD;
  const LR = Math.round(Lcm / 5) * 5;
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimo.current.encuadre !== encuadre || ultimo.current.vista !== vista) { ultimo.current = { encuadre, vista }; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    // en vertical manda el ancho: más aire arriba y abajo
    const p = vista === 'fotopuerta'
      ? encuadrar(DIR_FOTOPUERTA, new THREE.Vector3(0, Y_BOLA, 0), puntosFotopuerta(LR, r, ampR), camera.fov, aspecto, 0.86, aspecto < 1 ? 0.5 : 0.62)
      : encuadrar(DIR_CAMARA, new THREE.Vector3(0, (LR + Y_BOLA) / 2, 0), puntosEncuadre(LR, r, ampR), camera.fov, aspecto, 0.9, aspecto < 1 ? 0.6 : 0.7);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, camera, reducido, encuadre, LR, r, ampR, vista]);
  useFrame((_, dt) => {
    const a = anim.current; if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.9);
    const e = facil(a.t);
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.o0, a.o1, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── hilo de grosor visible ─────────────────────────────

const GEO_HILO = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true); g.translate(0, -0.5, 0); return g; })();

/**
 * Hilo de nailon trenzado de Ø 0,8 mm desde el pivote (origen) hacia −y. A la distancia de
 * la cámara mediría menos de un píxel: el grosor se ajusta para no bajar de ~1,3 px.
 */
function Hilo({ largo, material, fantasma = false }: { largo: number; material: THREE.Material; fantasma?: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const m = ref.current; if (!m) return;
    m.getWorldPosition(v);
    const d = v.distanceTo(camera.position);
    const px = (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, size.height);
    const rad = Math.max(0.04, (fantasma ? 0.55 : 0.68) * px);
    m.scale.set(rad, largo, rad);
  });
  return <mesh ref={ref} geometry={GEO_HILO} material={material} castShadow={!fantasma} renderOrder={fantasma ? 2 : 0} userData={{ pieza: fantasma ? 'fantasma' : 'hilo' }} />;
}

// ───────────────────────────── estela ─────────────────────────────

const N_ESTELA = 110;
const N_DESTELLOS = 18;

class CintaEstela {
  readonly geo = new THREE.BufferGeometry();
  readonly pos = new Float32Array(N_ESTELA * 2 * 3);
  readonly col = new Float32Array(N_ESTELA * 2 * 4);
  constructor() {
    const lado = new Float32Array(N_ESTELA * 2);
    for (let i = 0; i < N_ESTELA * 2; i++) lado[i] = i % 2 ? 1 : -1;
    const idx: number[] = [];
    for (let i = 0; i < N_ESTELA - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    this.geo.setIndex(idx);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4));
    this.geo.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -150, 0), 400);
  }
  dispose() { this.geo.dispose(); }
}

/**
 * Estela del último medio periodo (un vaivén completo de lado a lado) en el plano de
 * oscilación, y destellos a intervalos de tiempo IGUALES (T/16) que se apagan con la edad:
 * su separación es la rapidez de la esfera.
 */
function Estela({ reloj, Lcm, r, visible, mats }: { reloj: RelojPendulo; Lcm: number; r: number; visible: boolean; mats: MatsPendulo }) {
  const cinta = useMemo(() => new CintaEstela(), []);
  const mat = useMemo(() => materialEstela(), []);
  const geoD = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);
  useEffect(() => () => { cinta.dispose(); mat.dispose(); geoD.dispose(); }, [cinta, mat, geoD]);
  const malla = useRef<THREE.Mesh>(null);
  const dest = useRef<THREE.InstancedMesh>(null);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const cero = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);
  useFrame(() => {
    const vivo = visible && reloj.c.suelto;
    if (malla.current) malla.current.visible = vivo;
    if (dest.current) dest.current.visible = vivo;
    if (!vivo) return;
    const e = reloj.e;
    const Tx = periodoExacto(reloj.c.L, reloj.c.g, Math.min(reloj.amplitud, 179 * GRAD));
    const largoT = 0.5 * Tx;
    const t0 = Math.max(reloj.tSuelta, e.t - largoT);
    const span = e.t - t0;
    // cinta
    let thPrev = e.theta;
    for (let i = 0; i < N_ESTELA; i++) {
      const f = i / (N_ESTELA - 1);
      let th = i === 0 ? e.theta : reloj.thetaEn(e.t - span * f);
      if (!Number.isFinite(th)) th = thPrev;
      thPrev = th;
      const ancho = (r * 0.95 * Math.pow(1 - f, 0.55) + 0.12) / 2;
      const sx = Math.sin(th), sy = -Math.cos(th);
      const a = 0.85 * Math.pow(1 - f, 1.7);
      for (let s = 0; s < 2; s++) {
        const rr = Lcm + (s ? ancho : -ancho);
        const v = i * 2 + s;
        cinta.pos[v * 3] = rr * sx; cinta.pos[v * 3 + 1] = rr * sy; cinta.pos[v * 3 + 2] = 0;
        cinta.col[v * 4] = 1.55; cinta.col[v * 4 + 1] = 1.08; cinta.col[v * 4 + 2] = 0.5; cinta.col[v * 4 + 3] = a;
      }
    }
    (cinta.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (cinta.geo.getAttribute('aCol') as THREE.BufferAttribute).needsUpdate = true;
    // destellos a tiempos fijos (no resbalan por la cinta: son fotos)
    const im = dest.current; if (!im) return;
    const dt = Tx / 16;
    const k0 = Math.floor(e.t / dt);
    for (let j = 0; j < N_DESTELLOS; j++) {
      const tj = (k0 - j) * dt;
      const edad = (e.t - tj) / largoT;
      if (tj < t0 || edad > 1) { im.setMatrixAt(j, cero); continue; }
      const th = reloj.thetaEn(tj);
      if (!Number.isFinite(th)) { im.setMatrixAt(j, cero); continue; }
      const k = Math.pow(1 - edad, 1.3);
      const esc = r * (0.2 + 0.1 * k);
      m4.makeScale(esc, esc, esc).setPosition(Lcm * Math.sin(th), -Lcm * Math.cos(th), 0.2);
      im.setMatrixAt(j, m4);
      col.setRGB(2.1 * k, 1.75 * k, 1.25 * k);
      im.setColorAt(j, col);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <mesh ref={malla} geometry={cinta.geo} material={mat} renderOrder={4} frustumCulled={false} />
      <instancedMesh ref={dest} args={[geoD, mats.estrobo, N_DESTELLOS]} renderOrder={5} frustumCulled={false} />
    </group>
  );
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;
const ROT_ARRIBA = 44;
const ROT_ABAJO = 44;

function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloF3[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      v.copy(r.ancla()).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      const dentro = it.z < 1 && it.x > 0 && it.x < size.width && it.y > 0 && it.y < size.height;
      el.style.opacity = dentro ? '1' : '0';
      if (!dentro) continue;
      const w = el.offsetWidth || 110, h = el.offsetHeight || 22;
      const choque = (x: number, y: number) => cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
      const limite = size.height - h - ROT_ABAJO;
      // bajando desde el ancla; si se sale por abajo, al otro lado del ancla; y si no, subiendo
      const bajando = (x: number) => {
        let y = Math.max(ROT_ARRIBA, it.y - h / 2);
        for (let k = 0; k < 12; k++) { const c = choque(x, y); if (!c) return y; y = c.y + c.h + 4; }
        return Infinity;
      };
      let x = Math.min(size.width - w - 4, Math.max(4, it.x + 10));
      let y = bajando(x);
      if (y > limite) { x = Math.max(4, Math.min(size.width - w - 4, it.x - 10 - w)); y = bajando(x); }
      if (y > limite) {
        x = Math.min(size.width - w - 4, Math.max(4, it.x + 10));
        y = Math.min(limite, Math.max(ROT_ARRIBA, it.y - h / 2));
        for (let k = 0; k < 12; k++) { const c = choque(x, y); if (!c) break; y = Math.max(ROT_ARRIBA, c.y - h - 4); }
      }
      cajas.push({ x, y, w, h });
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
  });
  return null;
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-f3="">
      {d.texto}
    </div>
  );
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad, Lcm, r, amp }: { reloj: RelojPendulo; calidad: Calidad; Lcm: number; r: number; amp: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const medida = useRef({ llamadas: 0, triangulos: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  // prioridad NEGATIVA: con > 0 r3f deja de dibujar solo y el lienzo sale negro
  useFrame(() => {
    if (!DEV) return;
    const ri = gl.info.render, m = medida.current;
    m.llamadas = ri.calls; m.triangulos = ri.triangles;
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -20);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __fis03?: unknown };
    w.__fis03 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulosDibujados: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const l = reloj.lectura();
        return { c: reloj.c, t: reloj.e.t, theta: reloj.e.theta, omega: reloj.e.omega, lineal: reloj.lineal(), factor: reloj.factor, pausa: reloj.pausa, lectura: l, medidas: reloj.medidas.length, crono: reloj.cronoLeer() };
      },
      /** sólo desarrollo: pausa y fija el ángulo (capturas) */
      angulo(gr: number) { reloj.pausa = true; reloj.e.theta = gr * GRAD; reloj.e.omega = 0; return reloj.e.theta; },
      pausa(p: boolean) { reloj.pausa = p; },
      /** fracción del alto del lienzo que ocupan el aparato entero y el péndulo (pivote → esfera) */
      fraccion() {
        const v = new THREE.Vector3();
        const medir = (pts: THREE.Vector3[]) => {
          let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
          for (const p of pts) { v.copy(p).project(camera); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); }
          return { alto: (y1 - y0) / 2, ancho: (x1 - x0) / 2 };
        };
        const H = Lcm + Y_BOLA;
        const pend = [new THREE.Vector3(0, H, 0), new THREE.Vector3(0, H - Lcm - r, 0), new THREE.Vector3(Lcm * Math.sin(amp), H - Lcm * Math.cos(amp), 0), new THREE.Vector3(-Lcm * Math.sin(amp), H - Lcm * Math.cos(amp), 0)];
        return { aparato: medir(puntosEncuadre(Lcm, r, amp)), pendulo: medir(pend), lienzo: { w: size.width, h: size.height } };
      },
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      escena: scene,
    };
    return () => { delete w.__fis03; };
  }, [gl, scene, reloj, calidad, camera, size, Lcm, r, amp]);
  return null;
}

function AvisarListo({ onListo }: { onListo?: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current > 3) return;
    n.current++;
    if (n.current === 3) onListo?.();
  });
  return null;
}

// ───────────────────────────── el banco ─────────────────────────────

function Banco({ p, mats, rotulo, publicarRotulos, nodos }: {
  p: PenduloSceneProps; mats: MatsPendulo;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloF3[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, L, masa, theta0, fantasma, estela, reducido, encuadre = 0, vista = 'conjunto' } = p;
  const Lcm = L * U;
  const H = alturaPivote(L);
  const r = radioEsfera(masa) * U;
  const largoHilo = Lcm - amarre(r);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.paso(dt); }, -1);

  const real = useRef<THREE.Group>(null);
  const linea = useRef<THREE.Group>(null);
  const led = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (real.current) real.current.rotation.z = reloj.e.theta;
    if (linea.current) {
      linea.current.visible = fantasma && reloj.c.suelto;
      linea.current.rotation.z = reloj.lineal().theta;
    }
    // testigo de la fotopuerta: encendido con el haz tapado (y ≥ 90 ms de pantalla, para que se vea)
    const ml = led.current?.material as THREE.MeshBasicMaterial | undefined;
    if (ml) {
      const on = reloj.c.suelto && (reloj.e.t - reloj.tBloqueo) / Math.max(1e-6, reloj.factor) < 0.09;
      ml.color.set(on ? '#ff3a30' : '#3a1012');
      if (on) ml.color.multiplyScalar(3.2);
    }
  });

  // rótulo al pasar el ratón
  const textoPieza = useCallback((o: THREE.Object3D | null): string | null => {
    let x: THREE.Object3D | null = o;
    while (x && !x.userData?.pieza) x = x.parent;
    if (!x) return null;
    switch (x.userData.pieza) {
      case 'brazo': return 'Ménsula de acero atornillada a la pared';
      case 'mordaza': return 'Mordaza: su canto inferior es el pivote';
      case 'perilla': return 'Perilla de apriete';
      case 'transportador': case 'indice': return `Transportador grabado · índice rojo en ${cifra(theta0 / GRAD, 0)}°`;
      case 'hilo': return `Hilo de nailon · L = ${cifra(L, 2)} m hasta el centro de la esfera`;
      case 'esfera': return `Esfera de latón maciza · ${cifra(masa, 0)} kg · Ø ${cifra(2 * r, 1)} cm`;
      case 'fotopuerta': return 'Fotopuerta: cronometra los pasos por el haz';
      case 'haz': return 'Haz infrarrojo (dibujado; en el banco real no se ve)';
      case 'fantasma': return 'Péndulo lineal: la aproximación sen θ ≈ θ';
      default: return null;
    }
  }, [theta0, L, masa, r]);
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const t = textoPieza(e.object);
    rotulo.current(t ? { texto: t, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos fijos (≤ 8, apagados por defecto)
  const rotulos = useMemo<RotuloF3[]>(() => {
    if (!p.rotulos) return [];
    const bola = () => { const th = reloj.e.theta; return new THREE.Vector3(Lcm * Math.sin(th) + r, H - Lcm * Math.cos(th), 0); };
    const lista: RotuloF3[] = [
      { id: 'mo', texto: 'Pivote (mordaza)', ancla: () => new THREE.Vector3(2, H + 2, 0) },
      { id: 'tr', texto: 'Transportador', ancla: () => new THREE.Vector3(R_TRANSP * 0.7, H - R_TRANSP * 0.72, Z_TRANSP) },
      { id: 'hi', texto: 'Hilo', ancla: () => { const th = reloj.e.theta; return new THREE.Vector3(Lcm * 0.55 * Math.sin(th), H - Lcm * 0.55 * Math.cos(th), 0); } },
      { id: 'es', texto: 'Esfera de latón', ancla: bola },
      { id: 'fo', texto: 'Fotopuerta', ancla: () => new THREE.Vector3(1.2, Y_BOLA - 10, SEMI_U + 1.2) },
      { id: 'me', texto: 'Ménsula', ancla: () => new THREE.Vector3(7, H + SOBRE_PIVOTE + 12, Z_PARED + 1) },
    ];
    if (fantasma) lista.push({ id: 'fa', texto: 'Fantasma lineal', ancla: () => { const th = reloj.lineal().theta; return new THREE.Vector3(Lcm * Math.sin(th) - r, H - Lcm * Math.cos(th) + r, 0); } });
    // sobre el arco, a 0,6 de la amplitud hacia +x: lejos de la fotopuerta y de su rótulo
    if (estela) lista.push({ id: 'et', texto: 'Estela', ancla: () => { const a = 0.6 * Math.max(reloj.amplitud, 4 * GRAD); return new THREE.Vector3(Lcm * Math.sin(a), H - Lcm * Math.cos(a) - r * 1.2, 0); } });
    return lista;
  }, [p.rotulos, reloj, Lcm, H, r, fantasma, estela]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara Lcm={Lcm} r={r} amp={theta0} reducido={reducido} encuadre={encuadre} vista={vista} />
      <Estudio mats={mats} centroY={H * 0.5} />
      <Soporte mats={mats} H={H} />
      <Transportador mats={mats} H={H} theta0={theta0} />
      {/* péndulo real: gira con θ del modelo alrededor del canto de la mordaza */}
      <group position={[0, H, 0]}>
        <group ref={real}>
          <Hilo largo={largoHilo} material={mats.hilo} />
          <group position={[0, -Lcm, 0]}><Esfera mats={mats} r={r} /></group>
        </group>
        <group ref={linea} userData={{ pieza: 'fantasma' }}>
          <Hilo largo={largoHilo} material={mats.fantasmaHilo} fantasma />
          <group position={[0, -Lcm, 0]}><Esfera mats={mats} r={r} material={mats.fantasma} /></group>
        </group>
        <Estela reloj={reloj} Lcm={Lcm} r={r} visible={estela} mats={mats} />
      </group>
      <group position={[0, Y_BOLA, 0]}>
        <Fotopuerta mats={mats} led={led} />
      </group>
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

export default function PenduloSimple3DScene(props: PenduloSceneProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const mats = useMemo(() => crearMateriales(calidad), [calidad]);
  useEffect(() => () => { mats.todos.forEach((m) => m.dispose()); mats.texturas.forEach((t) => t.dispose()); }, [mats]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloF3[]>([]);
  const dprMedia = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
  const Lcm = props.L * U;
  const r = radioEsfera(props.masa) * U;
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-f3="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 2] : [dprMedia, dprMedia]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [60, 120, 420], fov: 32, near: 2, far: 6000 }}
        onPointerMissed={() => rotulo.current(null)}
      >
        <Ajustes calidad={calidad} />
        <Luces calidad={calidad} H={alturaPivote(props.L)} />
        <ControlesBanco objetivo={[0, 80, 0]} fondo="laboratorio"
          limites={{ minDistancia: 25, maxDistancia: 1600, maxPolar: 1.62, minPolar: 0.15, paneo: true, cajaObjetivo: [[-260, 0, -60], [260, 420, 80]] }} />
        <Banco p={props} mats={mats} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
        <DiagnosticoDev reloj={props.reloj} calidad={calidad} Lcm={Lcm} r={r} amp={props.theta0} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((x) => (
          <div key={x.id} ref={(el) => { if (el) nodos.current.set(x.id, el); else nodos.current.delete(x.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-f3={x.id}>
            {x.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
